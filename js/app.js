/* ASN at PO Delivery Schedule Line Level (v3 flow) — clickable prototype
   Orders › Flip to ASN › Draft ASN › ASN Delivery Schedules (select / edit / save) › Manage PO Lines (add, delete + confirm) › Submit */
(() => {
  const D = window.DATA, I = window.ICONS;
  const KEY = 'asnds2.state.v1';
  const $app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (f, w, h, alt = '') => `<img src="assets/${f}" width="${w}" height="${h}" alt="${alt}">`;
  const none = v => (v === undefined || v === null || v === '') ? '<span class="none">None</span>' : esc(v);
  const q1 = n => Number(n).toFixed(1);
  const q4 = n => Number(n).toFixed(4);
  const num = v => (v === '' || v == null || isNaN(Number(v))) ? NaN : Number(v);
  const fmt = n => Number(n).toLocaleString('en-US');
  const price = n => Number(n).toFixed(2);

  // ---------------------------------------------------------------- state
  const fresh = () => ({ draft: null, ds: {}, panel: null, modal: null, confirm: null, banner: null, errors: {}, seq: 1 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
  S.ds = S.ds || {};
  const save = () => localStorage.setItem(KEY, JSON.stringify(S));
  let menuOpen = false, toastT = null;
  const toast = msg => { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2600); };

  const mkLine = src => ({ id: 'L' + (S.seq++), po: src.po, line: src.line, item: src.item, poQty: src.qty, uom: src.uom, needBy: src.needBy, spn: src.spn, aux: src.aux, price: src.price, orderDate: src.orderDate, sch: src.sch || [], qty: q4(src.qty), asnSch: [] });
  function linesForPo(po) {
    const detailed = Object.values(D.poLines).filter(l => l.po === po);
    if (detailed.length) return detailed;
    const o = D.orders.find(o => o.po === po);
    return o.items.map((t, i) => { const m = t.match(/^(\d[\d,]*) (\w+) of (.+)$/); return { po, line: i + 1, qty: m ? +m[1].replace(/,/g, '') : 1, uom: m ? m[2] : 'Each', item: m ? m[3] : t, needBy: '12/15/2026', spn: 'INP' + po + i, aux: 'INAPM' + po + i, price: 100, orderDate: o.date, sch: [] }; });
  }
  function newDraft(po) { S.ds = {}; S.draft = { asnNo: '', fromPo: po, lines: [] }; S.draft.lines = linesForPo(po).map(mkLine); S.panel = null; S.modal = null; S.confirm = null; S.errors = {}; }
  const lineById = id => S.draft && S.draft.lines.find(l => l.id === id);

  // ---------------------------------------------------------------- shell
  const NAV = ['Invoices', 'Orders', 'Business Profile', 'Payments', 'Service Sheets', 'Items', 'ASN', 'Sourcing', 'Forecasts', 'Catalogs', 'Setup', 'More...'];
  const SUB = ['Orders', 'Order Lines', 'Returns', 'Order Changes', 'Order Line Changes', 'Order Confirmations', 'Order Confirmation Lines', 'Delivery Schedule', 'Shipments'];
  const header = (orders) => `
    <div class="hdr-top">${I.logo}<span class="prod">Supplier Portal</span><span class="sp"></span>
      <span class="upg">Upgrade</span><span class="hcirc">TT</span><span class="hcirc">${I.bell}</span><span class="hcirc">${I.cart}</span><span class="hcirc">${I.check}</span><span class="hcirc">${I.help}</span></div>
    <div class="nav"><span class="nv" data-a="go" data-to="#/orders" style="cursor:pointer">${I.home}</span>${NAV.map(n => `<span class="nv ${n === 'Orders' ? 'on' : ''}" ${n === 'Orders' ? 'data-a="go" data-to="#/orders" style="cursor:pointer"' : ''}>${n}</span>`).join('')}</div>
    <div class="subnav">${SUB.map(n => `<span class="sb ${n === 'Orders' ? 'on go' : ''}" ${n === 'Orders' ? 'data-a="go" data-to="#/orders"' : ''}>${n}</span>`).join('')}</div>
    ${orders
      ? `<div class="custbar"><span>Select customer</span><select class="inp" style="width:206px"><option>${D.customer}</option></select><span class="btn primary sm">Upload Invoice</span><span class="beta">Beta</span></div>
         <div class="custbar" style="padding-top:4px"><span style="font-size:11px">10 Free Uploads Remaining | <span class="lnk">Share Feedback</span></span></div>`
      : `<div class="custbar asn"><span>Select customer</span><select class="inp" style="width:206px"><option>${D.customer}</option></select></div>`}`;
  const footer = `<div class="foot">English (US) <span class="lnk">Terms of Use</span> <span class="lnk">Privacy Policy</span> © 2006-2026 Coupa Software Incorporated</div>`;
  const h2 = (icon, w, h, t) => `<div class="h2"><span class="ic">${img(icon, w, h)}</span>${t}</div>`;
  const dateInp = (f, v) => `<span class="date"><input ${f ? `data-f="${f}"` : ''} placeholder="mm/dd/yyyy" value="${esc(v || '')}">${I.calendar}</span>`;

  // ================================================================ Orders (CSP - OP Flip to ASN)
  function vOrders() {
    const rows = D.orders.map(o => `<tr>
      <td><span class="lnk po-link">${o.po}</span></td><td>${o.date}</td><td>Issued</td><td>None</td><td>${o.items.join('<br>')}</td><td>No</td><td class="r">${o.total}</td><td>None</td>
      <td><span class="acts"><span class="ico" data-tip="Create Invoice">${I.invoice}</span><span class="ico" data-tip="Create Credit Note">${I.creditNote}</span>${o.flip ? `<span class="ico" data-tip="Create ASN" data-a="flip" data-po="${o.po}">${I.asnFlip}</span>` : ''}${o.cog ? `<span class="ico" data-tip="Service">${I.cog}</span>` : ''}</span></td></tr>`).join('');
    return header(true) + `<div class="page">
      ${S.banner ? `<div class="alert-ok" style="margin-top:16px"><span>${esc(S.banner)}</span><span class="x" data-a="dismiss">✕</span></div>` : ''}
      <div class="ptrow" style="margin-top:20px"><h1>Purchase Orders</h1><span class="sp"></span><span class="ghost">Return to classic experience</span></div>
      <div class="hint">Click the ${I.invoice} Action to Invoice from a Purchase Order</div>
      <div class="card"><div class="views"><span class="v1">☰ Views</span><span class="v2">All</span></div>
        <div class="srow"><span class="search"><input placeholder="Search">${I.searchGrey}</span><span class="kebab">⋮</span></div>
        <table class="t"><thead><tr><th>PO Number</th><th>Order Date</th><th>Status</th><th>Acknowledged At</th><th>Items</th><th>Unanswered Comments</th><th class="r">Total</th><th>Assigned To</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div><span class="navi">${I.sparkle}</span>` + footer;
  }

  // ================================================================ Create Advance Ship Notice (Draft ASN)
  function vDraft() {
    const d = S.draft;
    if (!d) return header(false) + `<div class="asn-page"><h1>Create Advance Ship Notice</h1><p class="alert-info" style="margin-top:20px">No ASN draft yet. Go to <span class="lnk" data-a="go" data-to="#/orders">Orders</span> and click the <b>Create ASN</b> action on a PO.</p></div>` + footer;
    const E = S.errors || {};
    const fr = (label, ctrl, req, np) => `<div class="frow"><div class="fl">${req ? '<span class="req">*</span>' : ''}${label}</div><div class="fv ${np ? 'np' : ''}">${ctrl}</div></div>`;
    const tx = (w, f, v) => `<input class="inp ${f && E[f] ? 'err' : ''}" ${f ? `data-f="d.${f}"` : ''} style="width:${w}px" value="${esc(v || '')}">`;
    const ta = (w, h) => `<textarea class="inp" style="width:${w}px;height:${h}px"></textarea>`;
    const sel = (w, ph) => `<select class="inp" style="width:${w}px">${ph ? `<option>${ph}</option>` : '<option></option>'}</select>`;
    const left = [
      fr('ASN #', tx(95, 'asnNo', d.asnNo) + (E.asnNo ? `<div class="lerr">${E.asnNo}</div>` : ''), 1, 1),
      fr('Status', 'Draft'), fr('Gross Weight', tx(146), 0, 1), fr('Ship Date', dateInp('d.shipDate', d.shipDate), 0, 1),
      fr('Expected Delivery Date', dateInp('d.expDate', d.expDate), 0, 1), fr('Supplier only', tx(210), 0, 1), fr('CF Text', tx(210), 0, 1),
      fr('CF Text Box', ta(245, 98), 0, 1), fr('CF Number', tx(210), 0, 1), fr('CF drop down', sel(80), 0, 1), fr('date header', dateInp(), 0, 1),
      fr('CF Radio', `<div class="rad">${['inventory', 'expense', 'procurement'].map(v => `<label><input type="radio" name="cfr">${v}</label>`).join('')}</div>`),
      fr('CF Check BOx', '<input type="checkbox" class="cbn">'), fr('CF Attachment', '<span class="fbtn">Choose File</span>No file chosen'),
      fr('Lookup', sel(225, 'Select'), 0, 1), fr('user cf', sel(133, 'Select'), 0, 1), fr('approval group', sel(133, 'Select'), 0, 1),
      fr('Money', tx(186) + ' <select class="cur"><option>USD</option></select>', 0, 1), fr('custom_field_sample', tx(212), 0, 1),
    ].join('');
    const right = [
      h2('h-shipment.svg', 22, 23, 'Ship To'),
      fr('Ship To Warehouse', tx(133), 0, 1),
      fr('Ship to Address', `<div style="display:flex;gap:14px">${D.shipTo.address.join('<br>')}<span style="margin-top:-2px">${I.search}</span></div>`),
      fr('Ship to Attention', tx(133, 'att', d.att != null ? d.att : D.shipTo.attention), 0, 1),
      `<div style="height:16px"></div>`, h2('h-shipment.svg', 22, 23, 'Shipping Info'),
      ...['Tracking Number', 'Carrier', 'Shipping Method', 'Standard Carrier Alpha Code', 'Container', 'Trailer', 'Bill Of Lading', 'Packing Slip #'].map(l => fr(l, tx(133), 0, 1)),
      fr('Ship Note', ta(155, 98), 0, 1),
    ].join('');

    const lines = d.lines.map((l, i) => {
      const err = E['q' + l.id]; const open = S.panel && S.panel.lineId === l.id;
      const hasS = l.sch.length > 0; const n = l.asnSch.length;
      const schRow = hasS
        ? `<div class="lrow"><div class="ind"></div>
            <div class="f w188"><div class="l">Delivery Schedules</div><span class="sval"><span class="lnk2" data-a="ds" data-id="${l.id}">${l.sch.length}</span><span class="stog ${S.ds[l.id] ? 'open' : ''}" data-a="ds" data-id="${l.id}" title="${S.ds[l.id] ? 'Hide' : 'Show'} delivery schedules">${img('arrow-grey-right.svg', 8, 14)}</span></span></div>
            <div class="f w154"><div class="l">Schedule Line Need By</div>${l.sch[0].needBy}</div>
            <div class="f" style="width:240px"><div class="l">ASN Delivery Schedules</div><span class="sval"><span class="lnk2 ${n ? 'b' : ''}" data-a="sch" data-id="${l.id}">${n}</span><span class="stog ${open ? 'open' : ''}" data-a="sch" data-id="${l.id}" title="${open ? 'Hide' : 'Show'} ASN delivery schedule">${img('arrow-grey-right.svg', 8, 14)}</span></span></div></div>`
        : `<div class="lrow"><div class="ind"></div>
            <div class="f w188"><div class="l">Delivery Schedules</div>${none()}</div>
            <div class="f w159"><div class="l">Schedule Line Qty</div>${none()}</div>
            <div class="f w156"><div class="l">Schedule Line Need By</div>${none()}</div></div>`;
      return `<div class="aline">
        <div class="lrow"><div class="n">${i + 1}</div>
          <div class="f w188"><div class="l">Description</div>${esc(l.item)}</div>
          <div class="f w159"><div class="l">Shipped Qty</div><input class="inp ${err ? 'err' : ''}" style="width:115px;height:28px" data-f="q.${l.id}" value="${esc(l.qty)}">${err ? `<div class="lerr">${err}</div>` : ''}</div>
          <div class="f w156"><div class="l">UOM</div><select class="inp" style="width:112px;height:28px" disabled><option>${esc(l.uom)}</option></select></div>
          <div class="f w154"><div class="l">Received Quantity</div>0</div>
          <div class="f w150"><div class="l">Status</div>Draft</div>
          <span class="x" title="Delete line" data-a="rmLine" data-id="${l.id}">${img('delete-line.svg', 16, 16, 'Delete line')}</span></div>
        <div class="lrow"><div class="ind"></div>
          <div class="f w188"><div class="l">Supplier Part Number</div>${esc(l.spn)}</div>
          <div class="f w159"><div class="l">PO #</div><span class="lnk2">${esc(l.po)}</span></div>
          <div class="f w156"><div class="l">PO Line</div>${l.line}</div>
          <div class="f w154"><div class="l">Po Line Quantity</div>${q1(l.poQty)}</div>
          <div class="f w154"><div class="l">PO Line Need By</div>${none(l.needBy)}</div></div>
        ${schRow}
        ${hasS && S.ds[l.id] ? vDeliverySchedules(l) : ''}
        ${open ? vSchedules(l) : ''}
        <div class="lrow"><div class="ind"></div>
          <div class="f w188"><div class="l">Invoice Num Reference</div></div><div class="f w159"><div class="l">Invoice</div></div><div class="f w156"><div class="l">Invoice Line</div></div><div class="f w154"><div class="l">Invoice Line Qty</div></div>
          <div class="f" style="width:190px"><div class="l">Supplier AUX Part Number</div>${esc(l.aux)}</div></div>
        <div class="lrow"><div class="ind"></div><div class="f w188"><div class="l">Match Reference</div>${none()}</div></div>
        <div class="lrow"><div class="ind"></div><div class="f" style="width:258px"><div class="l">text box</div><textarea class="inp" style="width:245px;height:100px"></textarea></div>
          <div class="f"><div class="l">custom_field_sample_1</div><input class="inp" style="width:212px;height:28px"></div></div>
        <div class="lrow" style="margin-bottom:0"><div class="ind"></div><div class="f" style="flex:1"><div class="l">Comments</div><textarea class="inp" style="width:100%;height:100px"></textarea></div></div>
      </div>`;
    }).join('');

    return header(false) + `<div class="asn-page">
      <h1>Create Advance Ship Notice</h1>
      ${E.top ? `<div class="alert-err" style="margin-top:16px">${E.top}</div>` : ''}
      <div class="asn-cols">
        <div class="c1">${h2('h-info.svg', 23, 23, 'General Info')}${left}</div>
        <div class="c2">${right}</div>
      </div>
      <div style="margin-top:34px">${h2('h-lines.svg', 23, 13, 'Lines')}</div>
      <span class="addl" data-a="manage">${I.pencilBlue} Manage / Add PO line #</span>
      <div class="lines">${lines || '<div class="empty">No lines on this ASN. Use <b>Manage / Add PO line #</b> to add PO lines.</div>'}</div>
      <div class="afoot"><span class="addl" data-a="manage">${I.pencilBlue} Manage / Add PO line #</span><span class="sp"></span>
        <span class="lnk2" data-a="cancelDraft" style="margin-right:6px">Cancel</span><span class="btn grey" data-a="saveDraft">Save</span><span class="btn grey" data-a="submit">Submit</span></div>
    </div>` + footer;
  }

  // ---------------------------------------------------------------- ASN Delivery Schedule panel
  function openPanel(l) {
    const picked = Object.fromEntries(l.asnSch.map(s => [s.n, s]));
    S.panel = { lineId: l.id, rows: l.sch.map(s => ({ n: s.n, needBy: s.needBy, open: s.qty, qty: picked[s.n] ? String(picked[s.n].qty) : String(s.qty), on: !!picked[s.n] })), err: {} };
  }
  const panelTotal = () => S.panel.rows.filter(r => r.on).reduce((t, r) => t + (num(r.qty) || 0), 0);
  function vSchedules(l) {
    const p = S.panel; const rows = p.rows; const nOn = rows.filter(r => r.on).length;
    const all = rows.length && nOn === rows.length;
    const cb = (on, a, n) => `<span class="cbx" data-a="${a}" ${n != null ? `data-n="${n}"` : ''} role="checkbox" aria-checked="${on}">${img(on ? 'checkbox-checked.svg' : 'checkbox-empty.svg', 20, 20)}</span>`;
    const body = rows.map(r => `<div class="sch-row ${r.on ? '' : 'dim'}">
        <div class="c-cb">${cb(r.on, 'schRow', r.n)}</div><div class="c-n">${r.n}</div>
        <div class="c-q"><input class="qinp ${p.err['r' + r.n] ? 'err' : ''}" data-f="sq.${r.n}" value="${esc(r.qty)}" inputmode="decimal" title="${p.err['r' + r.n] ? esc(p.err['r' + r.n]) : `Schedule line qty: ${r.open}`}"></div>
        <div class="c-d">${r.needBy}</div>
        <div class="c-a"><span class="trash" data-a="schDel" data-n="${r.n}" title="Delete schedule line">${img('trash-outline.svg', 24, 24, 'Delete schedule line')}</span></div></div>`).join('');
    return `<div class="sch-wrap">
      <div class="sch-card">
        <div class="sch-title">ASN Delivery Schedules</div>
        <div class="sch-t">
          <div class="sch-row sch-head"><div class="c-cb">${cb(all, 'schAll')}</div><div class="c-n">#</div><div class="c-q">ASN Shipped Quantity</div><div class="c-d">Need By Date</div><div class="c-a">Actions</div><div class="c-g"></div></div>
          ${rows.length ? `<div class="sch-body"><div class="sch-vp" data-vp="asn-${l.id}">${body}</div><div class="sch-sb"><div class="th"></div></div></div>`
            : `<div class="sch-empty">All schedule lines were removed. Click Cancel to start again.</div>`}
          <div class="sch-row sch-tot"><div class="lab"><span><b>Total</b> (All Schedules)</span></div><div class="val" id="schtot">${fmt(panelTotal())}</div><div class="c-g"></div></div>
        </div>
      </div>
      <div class="sch-act">
        <span class="c2err">${p.err.rows || ''}</span>
        <span class="sp"></span>
        <button class="c2btn ghost" data-a="schCancel">Cancel</button>
        <button class="c2btn pri" data-a="schSave" ${nOn ? '' : 'disabled'}>Save</button>
      </div>
    </div>`;
  }
  function savePanel() {
    const p = S.panel; const l = lineById(p.lineId); const err = {};
    const on = p.rows.filter(r => r.on);
    for (const r of on) { const v = num(r.qty); if (!(v > 0)) err['r' + r.n] = 'Enter a quantity greater than 0'; else if (v > r.open) err['r' + r.n] = `Exceeds the schedule line quantity (${r.open})`; }
    if (Object.keys(err).length) err.rows = 'Fix the highlighted quantities';
    p.err = err;
    if (Object.keys(err).length) { save(); render(); return; }
    l.asnSch = on.map(r => ({ n: r.n, qty: num(r.qty), needBy: r.needBy }));
    l.qty = q4(panelTotal());
    delete S.errors['q' + l.id];
    S.panel = null; save(); render();
    toast(`${on.length} delivery schedule${on.length === 1 ? '' : 's'} added to ASN line ${S.draft.lines.indexOf(l) + 1}`);
  }
  // ---------------------------------------------------------------- Delivery Schedules (read-only, PO schedule lines)
  function vDeliverySchedules(l) {
    const rows = l.sch.map(s => `<div class="sch-row">
        <div class="c-ref">${s.ref}</div><div class="c-ext"><span class="none">${none(s.ext)}</span></div><div class="c-qty">${fmt(s.qty)}</div>
        <div class="c-nb">${s.needBy}</div><div class="c-ini">${esc(s.by)}</div></div>`).join('');
    return `<div class="sch-wrap ro">
      <div class="sch-card">
        <div class="sch-title">Delivery Schedules</div>
        <div class="sch-t">
          <div class="sch-row sch-head"><div class="c-ref">Reference ID</div><div class="c-ext">External ID</div><div class="c-qty">Quantity</div><div class="c-nb">Need By Date</div><div class="c-ini">Initiated By</div><div class="c-g"></div></div>
          <div class="sch-body"><div class="sch-vp" data-vp="ds-${l.id}">${rows}</div><div class="sch-sb"><div class="th"></div></div></div>
          <div class="sch-row sch-tot"><div class="c-ref lab2"><span><b>Total</b> (All Schedules)</span></div><div class="c-ext"></div><div class="c-qty">${fmt(l.sch.reduce((t, s) => t + s.qty, 0))}</div><div class="c-nb"></div><div class="c-ini"></div><div class="c-g"></div></div>
        </div>
      </div>
    </div>`;
  }
  function syncScroll(vp) {
    if (!vp) return;
    const th = vp.parentElement.querySelector('.th'); const track = vp.clientHeight - 4;
    const ratio = vp.clientHeight / vp.scrollHeight;
    if (ratio >= 1) { th.style.display = 'none'; return; }
    th.style.display = ''; th.style.height = Math.max(24, track * ratio) + 'px';
    th.style.top = 2 + (track - Math.max(24, track * ratio)) * (vp.scrollTop / (vp.scrollHeight - vp.clientHeight)) + 'px';
  }

  // ---------------------------------------------------------------- Manage PO Lines modal
  const lkey = l => `${l.po}-${l.line}`;
  function vManage() {
    const m = S.modal; if (!m) return '';
    const onAsn = new Set(S.draft.lines.map(lkey));
    let list = m.tab === 'add' ? D.addable.filter(l => !onAsn.has(lkey(l))) : S.draft.lines.map(l => ({ ...l, qty: l.poQty, id: l.id }));
    const q = (m.q || '').trim().toLowerCase();
    if (q) list = list.filter(l => `${l.po} ${l.item}`.toLowerCase().includes(q));
    const id = l => m.tab === 'add' ? lkey(l) : l.id;
    const nSel = list.filter(l => m.sel[id(l)]).length;
    const allOn = list.length && nSel === list.length;
    const rows = list.map(l => `<tr>
      <td class="cbcol"><input type="checkbox" class="native" data-a="mSel" data-k="${esc(id(l))}" ${m.sel[id(l)] ? 'checked' : ''}></td>
      <td><span class="lnk2">${esc(l.po)}</span></td><td>${l.line}</td><td>${fmt(l.qty)} ${esc(l.uom)} of ${esc(l.item)}</td>
      <td class="r">${fmt(l.qty)}</td><td class="r">${price(l.price)}</td><td>${l.orderDate}</td><td>${none(l.needBy)}</td><td><span class="none">None</span></td></tr>`).join('');
    return `<div class="scrim"><div class="modal mpl">
      <div class="modal-h">Manage PO Lines<span class="x" data-a="mClose">${I.close}</span></div>
      <div class="modal-b">
        <div class="mtabs"><span class="${m.tab === 'add' ? 'on' : ''}" data-a="mTab" data-k="add">Add PO Lines</span><span class="${m.tab === 'added' ? 'on' : ''}" data-a="mTab" data-k="added">PO Lines Added</span></div>
        <div class="mbar"><span class="srch"><input data-f="mq" placeholder="Search" value="${esc(m.q || '')}">${I.search}</span></div>
        <div class="mtool">${m.tab === 'add'
          ? `<button class="btn c1" data-a="mAdd" ${nSel ? '' : 'disabled'}>Add to ASN</button>`
          : `<button class="btn c1" data-a="mDel" ${nSel ? '' : 'disabled'}>Delete</button>`}</div>
        <table class="mt"><thead><tr><th class="cbcol"><input type="checkbox" class="native" data-a="mAll" ${allOn ? 'checked' : ''}></th><th>PO #</th><th>Line #</th><th style="width:36%">Item</th><th class="r">Quantity</th><th>Price</th><th>Order Date</th><th>Need by Date</th><th>Order Confirmation Line Status</th></tr></thead>
          <tbody>${rows || `<tr><td colspan="9" class="empty">${m.tab === 'add' ? 'No PO lines to add.' : 'No PO lines on this ASN.'}</td></tr>`}</tbody></table>
        <div class="mpager"><span class="dis">Prev</span><span class="cur">1</span><span>2</span><span>3</span><span>Next</span></div>
      </div></div></div>`;
  }
  function vConfirm() {
    if (!S.confirm) return '';
    return `<div class="scrim" style="z-index:40;${S.modal ? 'background:rgba(47,47,47,.35)' : ''}"><div class="modal cfm">
      <div class="modal-h">Please Confirm</div>
      <div class="modal-b"><div class="msg">Are you sure you want to delete?</div>
        <div class="row"><span class="btn" data-a="cfNo">Cancel</span><span class="btn primary" data-a="cfOk">OK</span></div></div></div></div>`;
  }
  function deleteLines(ids) {
    S.draft.lines = S.draft.lines.filter(l => !ids.includes(l.id));
    if (S.panel && ids.includes(S.panel.lineId)) S.panel = null;
    for (const id of ids) delete S.errors['q' + id];
    toast(`${ids.length} PO line${ids.length === 1 ? '' : 's'} deleted from the ASN`);
  }

  // ---------------------------------------------------------------- submit
  function submit() {
    const d = S.draft; const E = {};
    if (!d.asnNo.trim()) E.asnNo = 'ASN # is required';
    if (!d.lines.length) E.top = 'Add at least one PO line to the ASN.';
    for (const l of d.lines) { const v = num(l.qty); if (!(v > 0)) E['q' + l.id] = 'Enter a quantity greater than 0'; else if (v > l.poQty) E['q' + l.id] = `Exceeds Po Line Quantity (${q1(l.poQty)})`; }
    if (Object.keys(E).length) { if (!E.top) E.top = 'Please fix the highlighted fields.'; S.errors = E; save(); render(); window.scrollTo(0, 0); return; }
    const ns = d.lines.reduce((t, l) => t + l.asnSch.length, 0);
    S.banner = `Advance Ship Notice ${d.asnNo.trim()} was submitted with ${d.lines.length} line${d.lines.length === 1 ? '' : 's'}${ns ? ` and ${ns} delivery schedule${ns === 1 ? '' : 's'}` : ''}.`;
    S.draft = null; S.panel = null; S.errors = {}; save(); location.hash = '#/orders';
  }

  // ---------------------------------------------------------------- prototype menu
  const SCREENS = [
    ['CSP - OP Flip to ASN (Orders)', '#/orders'], ['Draft ASN', '#/proto/draft'], ['Delivery Schedules (read-only)', '#/proto/delivery'], ['ASN Delivery Schedules (open)', '#/proto/schedules'],
    ['ASN Delivery Schedules (4 selected)', '#/proto/selected'], ['ASN Delivery Schedules added', '#/proto/added'],
    ['Manage - Add PO Lines', '#/proto/manage-add'], ['Manage - PO Lines', '#/proto/manage-lines'], ['Manage - Delete PO Lines', '#/proto/manage-delete'], ['Manage - Confirm delete', '#/proto/manage-confirm'],
  ];
  const vProto = () => `<div class="proto"><span class="btn" data-a="menu">Prototype ▾</span>${menuOpen ? `<div class="menu">
    <div class="h">Jump to screen (Figma frames)</div>${SCREENS.map(([t, h]) => `<div class="i" data-a="go" data-to="${h}">${t}</div>`).join('')}
    <hr><div class="i" data-a="go" data-to="#/proto/reset">Reset prototype</div></div>` : ''}</div>`;
  function protoState(k) {
    newDraft('3627'); const l = S.draft.lines[0];
    if (k === 'delivery') S.ds[l.id] = true;
    if (k === 'schedules' || k === 'selected') { openPanel(l); if (k === 'selected') { for (const r of S.panel.rows) r.on = [1, 2, 3, 5].includes(r.n); } }
    if (k === 'added' || k.startsWith('manage')) { l.asnSch = [1, 2, 3, 4].map(n => ({ n, qty: 10, needBy: l.sch[n - 1].needBy })); l.qty = q4(40); }
    if (k === 'manage-add') S.modal = { tab: 'add', sel: {}, q: '' };
    if (k === 'manage-lines') S.modal = { tab: 'added', sel: {}, q: '' };
    if (k === 'manage-delete' || k === 'manage-confirm') S.modal = { tab: 'added', sel: Object.fromEntries(S.draft.lines.map(x => [x.id, true])), q: '' };
    if (k === 'manage-confirm') S.confirm = { ids: S.draft.lines.map(x => x.id), from: 'modal' };
    save(); location.replace('#/asn');
  }

  // ---------------------------------------------------------------- render / router
  function render() {
    const h = location.hash || '#/orders';
    const vpTop = {}; document.querySelectorAll('.sch-vp').forEach(v => { vpTop[v.dataset.vp] = v.scrollTop; });
    const m = h.match(/^#\/([\w-]+)\/?([\w-]*)/) || [];
    let html;
    if (m[1] === 'proto') {
      if (m[2] === 'reset') { localStorage.removeItem(KEY); S = fresh(); menuOpen = false; location.replace('#/orders'); toast('Prototype reset'); return; }
      menuOpen = false; protoState(m[2]); return;
    }
    if (m[1] === 'asn') html = vDraft() + (S.draft ? vManage() + vConfirm() : '');
    else html = vOrders();
    $app.innerHTML = html + vProto();
    document.querySelectorAll('.sch-vp').forEach(v => { v.scrollTop = vpTop[v.dataset.vp] || 0; v.addEventListener('scroll', () => syncScroll(v)); syncScroll(v); });
  }
  window.addEventListener('hashchange', () => { if (!/^#\/orders/.test(location.hash)) S.banner = null; S.errors = {}; save(); render(); window.scrollTo(0, 0); });

  // ---------------------------------------------------------------- events
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el) { if (menuOpen && !e.target.closest('.proto')) { menuOpen = false; render(); } return; }
    const a = el.dataset.a, k = el.dataset.k, id = el.dataset.id, n = +el.dataset.n;
    if (a !== 'menu') menuOpen = false;
    const p = S.panel;
    switch (a) {
      case 'go': if (location.hash === el.dataset.to) render(); else location.hash = el.dataset.to; break;
      case 'menu': menuOpen = !menuOpen; render(); break;
      case 'dismiss': S.banner = null; save(); render(); break;
      case 'flip': newDraft(el.dataset.po); save(); location.hash = '#/asn'; break;
      // schedules
      // only one in-line table per line: opening one closes the other
      case 'ds': if (S.ds[id]) delete S.ds[id]; else { S.ds[id] = true; if (p && p.lineId === id) S.panel = null; } save(); render(); break;
      case 'sch': { if (p && p.lineId === id) S.panel = null; else { delete S.ds[id]; openPanel(lineById(id)); } save(); render(); break; }
      case 'schRow': { const r = p.rows.find(r => r.n === n); r.on = !r.on; delete p.err['r' + n]; save(); render(); break; }
      case 'schAll': { const all = p.rows.every(r => r.on); p.rows.forEach(r => { r.on = !all; }); save(); render(); break; }
      case 'schDel': p.rows = p.rows.filter(r => r.n !== n); delete p.err['r' + n]; save(); render(); break;
      case 'schCancel': S.panel = null; save(); render(); break;
      case 'schSave': savePanel(); break;
      // lines / manage
      case 'rmLine': S.confirm = { ids: [id], from: 'line' }; save(); render(); break;
      case 'manage': S.modal = { tab: 'add', sel: {}, q: '' }; save(); render(); break;
      case 'mClose': S.modal = null; save(); render(); break;
      case 'mTab': S.modal.tab = k; S.modal.sel = {}; save(); render(); break;
      case 'mSel': { const s = S.modal.sel; if (el.checked) s[k] = true; else delete s[k]; save(); render(); break; }
      case 'mAll': { const ids = [...document.querySelectorAll('table.mt tbody [data-a="mSel"]')].map(x => x.dataset.k); S.modal.sel = {}; if (el.checked) ids.forEach(i => { S.modal.sel[i] = true; }); save(); render(); break; }
      case 'mAdd': { const keys = Object.keys(S.modal.sel); const add = D.addable.filter(l => keys.includes(lkey(l))); S.draft.lines.push(...add.map(mkLine)); S.modal = null; save(); render(); toast(`${add.length} PO line${add.length === 1 ? '' : 's'} added to the ASN`); break; }
      case 'mDel': S.confirm = { ids: Object.keys(S.modal.sel), from: 'modal' }; save(); render(); break;
      case 'cfNo': S.confirm = null; save(); render(); break;
      case 'cfOk': deleteLines(S.confirm.ids); if (S.modal) S.modal.sel = {}; S.confirm = null; save(); render(); break;
      // footer
      case 'saveDraft': save(); toast('ASN draft saved'); break;
      case 'cancelDraft': S.draft = null; S.panel = null; save(); location.hash = '#/orders'; break;
      case 'submit': submit(); break;
    }
  });
  document.addEventListener('input', e => {
    const t = e.target, f = t.dataset.f; if (!f) return;
    if (f.startsWith('d.')) { S.draft[f.slice(2)] = t.value; save(); return; }
    if (f.startsWith('q.')) { lineById(f.slice(2)).qty = t.value; save(); return; }
    if (f.startsWith('sq.')) { const r = S.panel.rows.find(r => r.n === +f.slice(3)); r.qty = t.value; t.classList.remove('err'); const tot = document.getElementById('schtot'); if (tot) tot.textContent = fmt(panelTotal()); save(); return; }
    if (f === 'mq') { S.modal.q = t.value; save(); const pos = t.selectionStart; render(); const nn = document.querySelector('[data-f="mq"]'); if (nn) { nn.focus(); nn.setSelectionRange(pos, pos); } return; }
  });
  document.addEventListener('change', e => {
    const t = e.target;
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (S.confirm) S.confirm = null; else if (S.modal) S.modal = null; else return;
    save(); render();
  });

  if (!location.hash) location.replace('#/orders');
  render();
})();
