/* ASN at PO Delivery Schedule Line Level (v3 e2e flow) — clickable prototype
   Supplier (CSP): Orders › Create ASN › Draft ASN › Delivery Schedules (select + Shipped Qty) › Manage PO Lines (nested schedule lines, delete + confirm) › Submit
   Buyer (Inventory): Receive › ASN Lines › ASN Detailed Receipt › View Receipts › View Receipt */
(() => {
  const D = window.DATA, I = window.ICONS;
  const KEY = 'asnds2.state.v2';
  const $app = document.getElementById('app');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const img = (f, w, h, alt = '') => `<img src="assets/${f}" width="${w}" height="${h}" alt="${alt}">`;
  const none = v => (v === undefined || v === null || v === '' || v === 'None') ? '<span class="none">None</span>' : esc(v);
  const q1 = n => Number(n).toFixed(1);
  const q4 = n => Number(n).toFixed(4);
  const num = v => (v === '' || v == null || isNaN(Number(v))) ? NaN : Number(v);
  const fmt = n => Number(n).toLocaleString('en-US');
  const money = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const price2 = n => Number(n).toFixed(2);
  const lkey = l => `${l.po}-${l.line}`;
  const poLine = k => D.poLines.find(l => lkey(l) === k);
  const schOpen = s => s.qty - s.shipped;

  // ---------------------------------------------------------------- state
  const fresh = () => ({ draft: null, card: null, modal: null, confirm: null, banner: null, errors: {}, seq: 1,
    asns: [], receipts: [], rcv: {}, qr: {}, dr: null, xp: { receive: true, receipts: true }, nextReceipt: 15412 });
  let S;
  try { S = Object.assign(fresh(), JSON.parse(localStorage.getItem(KEY) || 'null') || {}); } catch (e) { S = fresh(); }
  const save = () => localStorage.setItem(KEY, JSON.stringify(S));
  let menuOpen = false, toastT = null;
  const toast = msg => { let t = document.querySelector('.toast'); if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); } t.textContent = msg; clearTimeout(toastT); toastT = setTimeout(() => t.remove(), 2800); };

  // ASN line: a PO line plus the delivery schedule lines picked for it (sel: ref -> shipped qty)
  const schTotal = src => src.sch.reduce((t, s) => t + schOpen(s), 0);
  const mkLine = (src, sel = {}) => {
    const picked = Object.values(sel).reduce((t, v) => t + v, 0);
    const qty = Object.keys(sel).length ? picked : (src.sch.length ? schTotal(src) : src.qty);
    return { id: 'L' + (S.seq++), key: lkey(src), po: src.po, line: src.line, item: src.item, poQty: src.qty, uom: src.uom, needBy: src.needBy, spn: src.spn, aux: src.aux, itemNo: src.itemNo, price: src.price, sel, qty: q4(qty) };
  };
  const src = l => poLine(l.key);
  function linesForPo(po) {
    if (po === '3627') return D.flipLines.map(poLine);
    const o = D.orders.find(o => o.po === po);
    return o.items.map((t, i) => { const m = t.match(/^(\d[\d,]*) (\w+) of (.+)$/); return { po, line: i + 1, qty: m ? +m[1].replace(/,/g, '') : 1, uom: m ? m[2] : 'Each', item: m ? m[3] : t, needBy: '12/15/2026', spn: 'INP' + po + (i + 1), aux: 'INAPM' + po + (i + 1), itemNo: 'ITM-' + po + '-' + (i + 1), price: 100, orderDate: o.date, sch: [] }; });
  }
  function newDraft(po) {
    const ls = linesForPo(po);
    for (const l of ls) if (!poLine(lkey(l))) D.poLines.push(l);
    S.draft = { asnNo: '', fromPo: po, lines: ls.map(l => mkLine(l)) };
    S.card = null; S.modal = null; S.confirm = null; S.errors = {};
  }
  // keep ad-hoc PO lines (from other Orders rows) resolvable after reload
  if (S.draft) for (const l of S.draft.lines) if (!poLine(l.key)) { const [po] = l.key.split('-'); linesForPo(po).forEach(x => { if (!poLine(lkey(x))) D.poLines.push(x); }); }
  const lineById = id => S.draft && S.draft.lines.find(l => l.id === id);

  // ---------------------------------------------------------------- shells
  const NAV = ['Invoices', 'Orders', 'Business Profile', 'Payments', 'Service Sheets', 'Items', 'ASN', 'Sourcing', 'Forecasts', 'Catalogs', 'Setup', 'More...'];
  const SUB = ['Orders', 'Order Lines', 'Returns', 'Order Changes', 'Order Line Changes', 'Order Confirmations', 'Order Confirmation Lines', 'Delivery Schedule', 'Shipments'];
  const header = orders => `
    <div class="hdr-top">${I.logo}<span class="prod">Supplier Portal</span><span class="sp"></span>
      <span class="upg">Upgrade</span><span class="hcirc">TT</span><span class="hcirc">${I.bell}</span><span class="hcirc">${I.cart}</span><span class="hcirc">${I.check}</span><span class="hcirc">${I.help}</span></div>
    <div class="nav"><span class="nv" data-a="go" data-to="#/orders" style="cursor:pointer">${I.home}</span>${NAV.map(n => `<span class="nv ${n === 'Orders' ? 'on' : ''}" ${n === 'Orders' ? 'data-a="go" data-to="#/orders" style="cursor:pointer"' : ''}>${n}</span>`).join('')}</div>
    <div class="subnav">${SUB.map(n => `<span class="sb ${n === 'Orders' ? 'on go' : ''}" ${n === 'Orders' ? 'data-a="go" data-to="#/orders"' : ''}>${n}</span>`).join('')}</div>
    ${orders
      ? `<div class="custbar"><span>Select customer</span><select class="inp" style="width:206px"><option>${D.customer}</option></select><span class="btn primary sm">Upload Invoice</span><span class="beta">Beta</span></div>
         <div class="custbar" style="padding-top:4px"><span style="font-size:11px">10 Free Uploads Remaining | <span class="lnk">Share Feedback</span></span></div>`
      : `<div class="custbar asn"><span>Select customer</span><select class="inp" style="width:206px"><option>${D.customer}</option></select></div>`}`;
  const footer = `<div class="foot">English (US) <span class="lnk">Terms of Use</span> <span class="lnk">Privacy Policy</span> © 2006-2026 Coupa Software Incorporated</div>`;
  const NAV_B = ['Requests', 'Orders', 'Invoices', 'Payments', 'Inventory', 'Suppliers', 'Reports', 'Items', 'Setup'];
  const SUB_RCV = ['Receive', 'Receipts', 'Receipt Requests', 'Transactions', 'On-Hand Balances', 'Warehouses', 'Cycle Counts', 'Transfers'];
  const SUB_B = ['Overview', 'Workbench', 'On-Hand Balances', 'Optimization Scheduler', 'Fulfillment', 'Pick Lists', 'Receive', 'View Receipts', 'Unreceived Orders', 'Adjustments & Transfers', 'Cycle Counts', 'Lots', 'Asset Tags', 'ASNs', 'More...'];
  const buyerHeader = (active, subs = SUB_B) => `
    <div class="hdr-top">${I.logo}<span class="gsrch">${I.searchGrey}<span>What do you need?</span></span><span class="sp"></span>
      <span class="hcirc av">JM</span><span class="hcirc">${I.bell}</span><span class="hcirc">${I.cart}</span><span class="hcirc">${I.help}</span></div>
    <div class="nav buyer"><span class="nv">${I.home}</span>${NAV_B.map(n => `<span class="nv ${n === 'Inventory' ? 'on' : ''}">${n}</span>`).join('')}</div>
    <div class="subnav">${subs.map(n => { const to = n === 'Receive' ? '#/buyer/receive' : (n === 'View Receipts' || n === 'Receipts') ? '#/buyer/receipts' : ''; return `<span class="sb ${n === active ? 'on' : ''} ${to ? 'go' : ''}" ${to ? `data-a="go" data-to="${to}"` : ''}>${n}</span>`; }).join('')}</div>`;
  const buyerFooter = `<div class="foot buyer">Total Spend Management - Make Margins Multiply &nbsp;•&nbsp; English (United States) &nbsp;•&nbsp; Accessibility &nbsp;•&nbsp; <span class="lnk">Coupa Cares</span></div>`;
  const pager = (n = 3) => `<div class="pager"><div class="pp">Per page <b>15</b> | <b>45</b> | <b>90</b></div><div class="pn"><span class="dis">Prev</span><span class="cur">1</span>${n > 1 ? '<span>2</span>' : ''}${n > 2 ? '<span>3</span>' : ''}<span>Next</span></div></div>`;
  const h2 = (icon, w, h, t) => `<div class="h2"><span class="ic">${img(icon, w, h)}</span>${t}</div>`;
  const dateInp = (f, v) => `<span class="date"><input ${f ? `data-f="${f}"` : ''} placeholder="mm/dd/yyyy" value="${esc(v || '')}">${I.calendar}</span>`;
  const cbx = (on, a, attrs = '', state) => `<span class="cbx ${state === 'dis' ? 'dis' : ''}" ${state === 'dis' ? '' : `data-a="${a}"`} ${attrs} role="checkbox" aria-checked="${on === 'mix' ? 'mixed' : !!on}">${on === 'mix' ? '<span class="cbmix"></span>' : img(on ? 'checkbox-checked.svg' : 'checkbox-empty.svg', 20, 20)}</span>`;

  // ================================================================ SUPPLIER: Orders (CSP - OP Flip to ASN)
  function vOrders() {
    const rows = D.orders.map(o => `<tr>
      <td><span class="lnk po-link">${o.po}</span></td><td>${o.date}</td><td>Issued</td><td>None</td><td>${o.items.join('<br>')}</td><td>No</td><td class="r">${o.total}</td><td>None</td>
      <td><span class="acts"><span class="ico" data-tip="Create Invoice">${I.invoice}</span><span class="ico" data-tip="Create Credit Note">${I.creditNote}</span>${o.flip ? `<span class="ico" data-tip="Create ASN" data-a="flip" data-po="${o.po}">${I.asnFlip}</span>` : ''}${o.cog ? `<span class="ico" data-tip="Service">${I.cog}</span>` : ''}</span></td></tr>`).join('');
    return header(true) + `<div class="page">
      ${S.banner && S.banner.asn ? `<div class="alert-ok" style="margin-top:16px"><span>${esc(S.banner.asn)} <span class="lnk" style="color:#fff;text-decoration:underline" data-a="go" data-to="#/buyer/receive">Receive it as the buyer ›</span></span><span class="x" data-a="dismiss">✕</span></div>` : ''}
      <div class="ptrow" style="margin-top:20px"><h1>Purchase Orders</h1><span class="sp"></span><span class="ghost">Return to classic experience</span></div>
      <div class="hint">Click the ${I.invoice} Action to Invoice from a Purchase Order</div>
      <div class="card"><div class="views"><span class="v1">☰ Views</span><span class="v2">All</span></div>
        <div class="srow"><span class="search"><input placeholder="Search">${I.searchGrey}</span><span class="kebab">⋮</span></div>
        <table class="t"><thead><tr><th>PO Number</th><th>Order Date</th><th>Status</th><th>Acknowledged At</th><th>Items</th><th>Unanswered Comments</th><th class="r">Total</th><th>Assigned To</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>
    </div><span class="navi">${I.sparkle}</span>` + footer;
  }

  // ================================================================ SUPPLIER: Create Advance Ship Notice (Draft ASN)
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
      const err = E['q' + l.id]; const s = src(l); const hasS = s && s.sch.length; const open = S.card && S.card.lineId === l.id;
      const nSel = Object.keys(l.sel).length;
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
        ${hasS ? `<div class="lrow"><div class="ind"></div><div class="f w188"><div class="l">Delivery Schedules</div><span class="lnk2 dsl ${open ? 'open' : ''}" data-a="card" data-id="${l.id}" title="${open ? 'Hide' : 'Select'} delivery schedules"><b>${nSel} of ${s.sch.length}</b> selected</span></div></div>` : ''}
        ${open ? vCard(l, s) : ''}
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
      <div class="asn-cols"><div class="c1">${h2('h-info.svg', 23, 23, 'General Info')}${left}</div><div class="c2">${right}</div></div>
      <div style="margin-top:34px">${h2('h-lines.svg', 23, 13, 'Lines')}</div>
      <span class="addl" data-a="manage">${I.pencilBlue} Manage / Add PO line #</span>
      <div class="lines">${lines || '<div class="empty">No lines on this ASN. Use <b>Manage / Add PO line #</b> to add PO lines.</div>'}</div>
      <div class="afoot"><span class="addl" data-a="manage">${I.pencilBlue} Manage / Add PO line #</span><span class="sp"></span>
        <span class="lnk2" data-a="cancelDraft" style="margin-right:6px">Cancel</span><span class="btn grey" data-a="saveDraft">Save</span><span class="btn grey" data-a="submit">Submit</span></div>
    </div>` + footer;
  }

  // ---------------------------------------------------------------- Delivery Schedules card (Figma 213:99588 / 230:135630)
  function openCard(l) {
    const s = src(l);
    S.card = { lineId: l.id, rows: s.sch.map(x => ({ ref: x.ref, qty: x.qty, open: schOpen(x), needBy: x.needBy, by: x.by, ship: String(l.sel[x.ref] != null ? l.sel[x.ref] : schOpen(x)), on: l.sel[x.ref] != null })), err: {}, had: Object.keys(l.sel).length > 0 };
  }
  const cardTotal = () => S.card.rows.filter(r => r.on).reduce((t, r) => t + (num(r.ship) || 0), 0);
  function vCard(l) {
    const c = S.card; const live = c.rows.filter(r => r.open > 0); const nOn = c.rows.filter(r => r.on).length;
    const all = live.length && live.every(r => r.on) ? true : (nOn ? 'mix' : false);
    const body = c.rows.map(r => { const dis = r.open <= 0; return `<div class="sch-row ${r.on ? '' : 'dim'} ${dis ? 'done' : ''}">
        <div class="c-cb">${cbx(r.on, 'cardRow', `data-ref="${r.ref}"`, dis ? 'dis' : '')}</div>
        <div class="c-ref">${r.ref}${dis ? ' <span class="none">· Fully shipped</span>' : ''}</div><div class="c-qt">${fmt(r.qty)}</div>
        <div class="c-sh">${dis ? '' : `<input class="qinp ${c.err[r.ref] ? 'err' : ''}" data-f="cs.${r.ref}" value="${esc(r.ship)}" inputmode="decimal" title="${c.err[r.ref] ? esc(c.err[r.ref]) : `Open qty: ${r.open}`}">`}</div>
        <div class="c-nb">${r.needBy}</div></div>`; }).join('');
    return `<div class="sch-wrap">
      <div class="sch-card">
        <div class="sch-title">Delivery Schedules</div>
        <div class="sch-t">
          <div class="sch-row sch-head"><div class="c-cb">${cbx(all, 'cardAll')}</div><div class="c-ref">Reference ID</div><div class="c-qt">Quantity</div><div class="c-sh hr">Shipped Qty</div><div class="c-nb">Need By Date</div><div class="c-g"></div></div>
          <div class="sch-body"><div class="sch-vp" data-vp="card-${l.id}">${body}</div><div class="sch-sb"><div class="th"></div></div></div>
          <div class="sch-row sch-tot"><div class="c-cb"></div><div class="c-ref lab2"><span><b>Total</b> schedules selected</span></div><div class="c-qt"></div><div class="c-sh tv" id="cardtot">${fmt(cardTotal())}</div><div class="c-nb"></div><div class="c-g"></div></div>
        </div>
      </div>
      <div class="sch-act"><span class="c2err">${c.err.rows || ''}</span><span class="sp"></span>
        <button class="c2btn ghost" data-a="cardCancel">Cancel</button>
        <button class="c2btn pri" data-a="cardSave" ${nOn || c.had ? '' : 'disabled'}>Save</button></div>
    </div>`;
  }
  function saveCard() {
    const c = S.card; const l = lineById(c.lineId); const err = {};
    const on = c.rows.filter(r => r.on);
    for (const r of on) { const v = num(r.ship); if (!(v > 0)) err[r.ref] = 'Enter a quantity greater than 0'; else if (v > r.open) err[r.ref] = `Exceeds the open schedule quantity (${r.open})`; }
    if (Object.keys(err).length) { err.rows = 'Fix the highlighted Shipped Qty'; c.err = err; save(); render(); return; }
    l.sel = Object.fromEntries(on.map(r => [r.ref, num(r.ship)]));
    l.qty = q4(on.length ? cardTotal() : schTotal(src(l)));
    delete S.errors['q' + l.id];
    S.card = null; save(); render();
    toast(`${on.length} of ${c.rows.length} delivery schedules selected on ASN line ${S.draft.lines.indexOf(l) + 1}`);
  }
  function syncScroll(vp) {
    const th = vp.parentElement.querySelector('.th'); if (!th) return; const track = vp.clientHeight - 4;
    const ratio = vp.clientHeight / vp.scrollHeight;
    if (ratio >= 1) { th.style.display = 'none'; return; }
    const h = Math.max(24, track * ratio);
    th.style.display = ''; th.style.height = h + 'px'; th.style.top = 2 + (track - h) * (vp.scrollTop / (vp.scrollHeight - vp.clientHeight)) + 'px';
  }

  // ---------------------------------------------------------------- Manage PO Lines modal (Add PO Lines with nested schedule lines, 237:13772)
  function openManage() {
    const m = { tab: 'add', q: '', on: {}, ssel: {}, exp: {}, dsel: {} };
    for (const k of D.expandedByDefault) m.exp[k] = true;
    for (const l of S.draft.lines) { const s = src(l); if (s.sch.length && Object.keys(l.sel).length) { m.ssel[l.key] = Object.fromEntries(Object.keys(l.sel).map(r => [r, true])); m.exp[l.key] = true; } else m.on[l.key] = true; }
    S.modal = m;
  }
  const manageRows = () => { const on = S.draft.lines.map(l => l.key); return on.map(poLine).concat(D.poLines.filter(l => !on.includes(lkey(l)))); };
  function pState(l) {
    const m = S.modal, k = lkey(l);
    if (!l.sch.length) return m.on[k] ? true : false;
    const live = l.sch.filter(s => schOpen(s) > 0); const n = live.filter(s => (m.ssel[k] || {})[s.ref]).length;
    if (m.on[k] && !n) return true; // whole PO line (no schedule picked)
    return n === 0 ? false : (n === live.length ? true : 'mix');
  }
  function summary() {
    const m = S.modal; const picked = manageRows().filter(l => pState(l));
    const part = picked.filter(l => l.sch.length && pState(l) === 'mix').map(l => `${l.po} / ${l.line} with ${Object.keys(m.ssel[lkey(l)] || {}).length} of ${l.sch.length} schedule lines`);
    const onAsn = new Set(S.draft.lines.map(l => l.key)); const adds = picked.filter(l => !onAsn.has(lkey(l))).length; const drops = [...onAsn].filter(k => !picked.some(l => lkey(l) === k)).length;
    return { n: picked.length, text: `${picked.length} ASN line${picked.length === 1 ? '' : 's'} will be added${part.length ? ' · ' + part.join(' · ') : ''}${drops ? ` · ${drops} line${drops === 1 ? '' : 's'} removed from the ASN` : ''}`, adds, drops };
  }
  function vManage() {
    const m = S.modal; if (!m) return '';
    const head = `<div class="modal-h">Manage PO Lines<span class="x" data-a="mClose">${I.close}</span></div>
      <div class="mtabs"><span class="${m.tab === 'add' ? 'on' : ''}" data-a="mTab" data-k="add">Add PO Lines</span><span class="${m.tab === 'added' ? 'on' : ''}" data-a="mTab" data-k="added">PO Lines Added</span></div>
      <div class="mbar"><span class="srch"><input data-f="mq" placeholder="Search" value="${esc(m.q || '')}">${I.search}</span></div>`;
    const q = (m.q || '').trim().toLowerCase();
    const match = l => !q || `${l.po} ${l.item} ${l.sch.map(s => s.ref).join(' ')}`.toLowerCase().includes(q);
    const itm = l => `${fmt(l.qty)} ${esc(l.uom)} of ${esc(l.item)}`;
    if (m.tab === 'added') {
      const list = S.draft.lines.filter(l => match(src(l)));
      const nSel = list.filter(l => m.dsel[l.id]).length; const allOn = list.length && nSel === list.length;
      const rows = list.map(l => `<tr><td class="cbcol"><input type="checkbox" class="native" data-a="dSel" data-k="${l.id}" ${m.dsel[l.id] ? 'checked' : ''}></td>
        <td><span class="lnk2">${esc(l.po)}</span></td><td>${l.line}</td><td>${fmt(l.poQty)} ${esc(l.uom)} of ${esc(l.item)}</td><td class="r">${fmt(l.poQty)}</td><td class="r">${price2(l.price)}</td><td>${src(l).orderDate}</td><td>${none(l.needBy)}</td><td><span class="none">None</span></td></tr>`).join('');
      return `<div class="scrim"><div class="modal mpl">${head}<div class="modal-b">
        <div class="mtool"><button class="btn c1" data-a="mDel" ${nSel ? '' : 'disabled'}>Delete</button></div>
        <table class="mt"><thead><tr><th class="cbcol"><input type="checkbox" class="native" data-a="dAll" ${allOn ? 'checked' : ''}></th><th>PO #</th><th>Line #</th><th style="width:36%">Item</th><th class="r">Quantity</th><th>Price</th><th>Order Date</th><th>Need by Date</th><th>Order Confirmation Line Status</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="9" class="empty">No PO lines on this ASN.</td></tr>'}</tbody></table>
        <div class="mpager"><span class="dis">Prev</span><span class="cur">1</span><span>2</span><span>3</span><span>Next</span></div></div></div></div>`;
    }
    const list = manageRows().filter(match); const sm = summary();
    const total = manageRows().length; const allState = sm.n === 0 ? false : (sm.n === total ? true : 'mix');
    const rows = list.map((l, i) => {
      const k = lkey(l); const st = pState(l); const hasS = l.sch.length > 0; const exp = hasS && m.exp[k];
      const alt = i % 2 ? 'alt' : '';
      const prow = `<tr class="${alt} ${st ? 'sel' : ''}">
        <td class="cbcol">${cbx(st, 'mPo', `data-k="${esc(k)}"`)}</td>
        <td class="carcol">${hasS ? `<span class="car ${exp ? 'open' : ''}" data-a="mExp" data-k="${esc(k)}" title="${exp ? 'Collapse' : 'Expand'} schedule lines">▸</span>` : ''}</td>
        <td><span class="lnk2">${esc(l.po)}</span></td><td>${l.line}</td><td>${itm(l)}</td>
        <td>${hasS ? `<span class="lnk2 b" data-a="mExp" data-k="${esc(k)}">${l.sch.length} schedule lines</span>` : '<span class="none">No schedule lines</span>'}</td>
        <td class="r">${fmt(l.qty)}</td><td class="r">${price2(l.price)}</td><td>${l.orderDate}</td><td>${none(l.needBy)}</td><td><span class="none">None</span></td></tr>`;
      if (!exp) return prow;
      const ss = m.ssel[k] || {}; const live = l.sch.filter(s => schOpen(s) > 0); const nOn = live.filter(s => ss[s.ref]).length;
      const hst = nOn === 0 ? false : (nOn === live.length ? true : 'mix');
      const crow = l.sch.map((s, j) => { const done = schOpen(s) <= 0; return `<tr class="${j % 2 ? 'alt' : ''} ${done ? 'done' : ''}">
          <td class="cbcol">${cbx(!done && !!ss[s.ref], 'mSch', `data-k="${esc(k)}" data-ref="${s.ref}"`, done ? 'dis' : '')}</td>
          <td><b>${s.ref}</b>${done ? ' · Fully shipped' : ''}</td><td>${s.needBy}</td><td class="r">${fmt(s.qty)}</td><td class="r">${fmt(s.shipped)}</td><td class="r"><b>${fmt(schOpen(s))}</b></td><td class="pl">${esc(l.uom)}</td></tr>`; }).join('');
      return prow + `<tr class="nest ${alt}"><td colspan="11"><div class="npanel"><table class="mt sub">
          <thead><tr><th class="cbcol">${cbx(hst, 'mSchAll', `data-k="${esc(k)}"`)}</th><th style="width:22%">Schedule Line #</th><th style="width:16%">Need By</th><th class="r" style="width:13%">Schedule Qty</th><th class="r" style="width:12%">Shipped</th><th class="r" style="width:13%">Remaining</th><th class="pl">UOM</th></tr></thead>
          <tbody>${crow}</tbody></table></div></td></tr>`;
    }).join('');
    return `<div class="scrim"><div class="modal mpl wide">${head}<div class="modal-b">
      <div class="mtool flex"><button class="btn c1 ${sm.n ? 'on' : ''}" data-a="mAdd" ${sm.n || sm.drops ? '' : 'disabled'}>Add to ASN</button><span class="msum">${sm.n || sm.drops ? esc(sm.text) : 'Select PO lines or schedule lines to add to the ASN'}</span><span class="sp"></span><span class="lnk2" data-a="mExpAll">Expand all</span><span class="lnk2" data-a="mColAll">Collapse all</span></div>
      <div class="mscroll" data-keep="manage-add"><table class="mt nested"><thead><tr><th class="cbcol">${cbx(allState, 'mAll')}</th><th class="carcol"></th><th>PO #</th><th>Line #</th><th style="width:22%">Item</th><th>Delivery schedule</th><th class="r">Quantity</th><th class="r">Price</th><th>Order Date</th><th>Need by Date</th><th>Order Confirmation Line Status</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="11" class="empty">No PO lines match your search.</td></tr>'}</tbody></table></div>
      <div class="mpager"><span class="dis">Prev</span><span class="cur">1</span><span>2</span><span>3</span><span>Next</span></div>
    </div></div></div>`;
  }
  function applyManage() {
    const m = S.modal; const sm = summary(); const d = S.draft;
    const picked = manageRows().filter(l => pState(l));
    const next = [];
    for (const l of picked) {
      const k = lkey(l); const refs = l.sch.length ? Object.keys(m.ssel[k] || {}).filter(r => schOpen(l.sch.find(s => s.ref === r)) > 0) : [];
      const existing = d.lines.find(x => x.key === k);
      const sel = Object.fromEntries(refs.map(r => [r, existing && existing.sel[r] != null ? existing.sel[r] : schOpen(l.sch.find(s => s.ref === r))]));
      if (existing) {
        const changed = JSON.stringify(Object.keys(existing.sel).sort()) !== JSON.stringify(refs.slice().sort());
        if (changed) { existing.sel = sel; existing.qty = q4(refs.length ? Object.values(sel).reduce((t, v) => t + v, 0) : schTotal(l)); }
        next.push(existing);
      } else next.push(mkLine(l, sel));
    }
    // keep ASN order: existing lines first (in their order), then new ones
    d.lines = d.lines.filter(x => next.includes(x)).concat(next.filter(x => !d.lines.includes(x)));
    if (S.card && !lineById(S.card.lineId)) S.card = null;
    S.modal = null; save(); render();
    toast(`ASN updated · ${sm.adds} line${sm.adds === 1 ? '' : 's'} added${sm.drops ? ` · ${sm.drops} removed` : ''}`);
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
    if (S.card && ids.includes(S.card.lineId)) S.card = null;
    for (const id of ids) delete S.errors['q' + id];
    toast(`${ids.length} PO line${ids.length === 1 ? '' : 's'} deleted from the ASN`);
  }

  // ---------------------------------------------------------------- submit → buyer receives the ASN
  function submit() {
    const d = S.draft; const E = {};
    if (!d.asnNo.trim()) E.asnNo = 'ASN # is required';
    if (!d.lines.length) E.top = 'Add at least one PO line to the ASN.';
    for (const l of d.lines) { const v = num(l.qty); if (!(v > 0)) E['q' + l.id] = 'Enter a quantity greater than 0'; else if (v > l.poQty) E['q' + l.id] = `Exceeds Po Line Quantity (${q1(l.poQty)})`; }
    if (Object.keys(E).length) { if (!E.top) E.top = 'Please fix the highlighted fields.'; S.errors = E; save(); render(); window.scrollTo(0, 0); return; }
    const no = d.asnNo.trim();
    const lines = d.lines.map(l => { const s = src(l); const refs = s.sch.filter(x => l.sel[x.ref] != null);
      return { po: l.po, line: l.line, item: l.item, uom: l.uom, needBy: l.needBy, price: l.price, itemNo: l.itemNo, poQty: l.poQty, qty: num(l.qty),
        sched: refs.map((x, i) => ({ n: i + 1, ref: x.ref, needBy: x.needBy, qty: l.sel[x.ref] })) }; });
    S.asns = S.asns.filter(a => a.no !== no); S.asns.unshift({ no, date: D.today, lines });
    const ns = lines.reduce((t, l) => t + l.sched.length, 0);
    S.banner = { asn: `Advance Ship Notice ${no} was submitted with ${lines.length} line${lines.length === 1 ? '' : 's'}${ns ? ` and ${ns} delivery schedule${ns === 1 ? '' : 's'}` : ''}.` };
    S.draft = null; S.card = null; S.errors = {}; save(); location.hash = '#/orders';
  }

  // ================================================================ BUYER: Receive › ASN Lines (222:102218)
  const nums = r => r.refs && r.refs.length ? r.refs.join('<br>') : none();
  const nbs = r => r.needBys && r.needBys.length ? r.needBys.join('<br>') : none();
  function receiveRows() {
    const mine = [];
    for (const a of S.asns) a.lines.forEach((x, i) => {
      const key = `${a.no}#${i + 1}`;
      mine.push({ key, asn: a.no, ln: i + 1, item: x.item, po: x.po, poLine: x.line, refs: x.sched.map(s => s.n), needBys: x.sched.map(s => s.needBy), supplier: D.supplierName, qty: x.qty, uom: x.uom, needBy: x.needBy, received: S.rcv[key] || 0, approval: 'No', price: x.price, itemNo: x.itemNo, ordered: x.poQty, mine: true });
    });
    const stat = D.receiveRows.map(r => Object.assign({ key: `${r.asn}#${r.ln}`, refs: [], needBys: [], price: 10, itemNo: 'None', ordered: r.qty }, r, { received: r.received + (S.rcv[`${r.asn}#${r.ln}`] || 0) }));
    return mine.concat(stat);
  }
  const xToggle = which => `<span class="xtoggle" data-a="xp" data-w="${which}" title="${S.xp[which] ? 'Collapse table' : 'Expand table'}">${S.xp[which] ? I.collapse : I.expand}</span>`;
  function vReceive() {
    const rows = receiveRows(); const E = S.errors || {};
    const body = rows.map(r => { const open = r.qty - r.received; return `<tr class="${r.mine && S.asns[0] && r.asn === S.asns[0].no ? 'mine' : ''}">
        <td><span class="lnk">${esc(r.asn)}</span></td><td>${r.ln}</td><td>${esc(r.item)}</td><td><span class="lnk">${esc(r.po)}</span></td><td>${r.poLine}</td>
        <td>${nums(r)}</td><td>${nbs(r)}</td><td></td><td>${none()}</td><td>${esc(r.supplier)}</td><td class="r">${fmt(r.qty)}</td><td>${r.uom}</td><td>${none(r.needBy)}</td><td class="r">${r.received}</td>
        <td>${dateInp(`rd.${r.key}`)}</td>
        <td>${open > 0 ? `<span class="qr"><input class="inp ${E['qr.' + r.key] ? 'err' : ''}" data-qr="${esc(r.key)}" value="${esc(S.qr[r.key] || '')}"><label><input type="checkbox" class="native" data-qa="${esc(r.key)}" data-open="${open}" ${S.qr[r.key] == open && open ? 'checked' : ''}> All</label></span>` : '<span class="none">Received</span>'}</td>
        <td>${r.approval}</td><td class="c">${open > 0 ? `<span class="ico" data-tip="Detailed receipt" data-a="detail" data-k="${esc(r.key)}">${I.packageAdd}</span>` : ''}</td></tr>`; }).join('');
    return buyerHeader('Receive', SUB_RCV) + `
      <div class="c990 top"><h1>Receive</h1>
        <div class="tabs"><span class="tab">PO Lines</span><span class="tab on">ASN Lines</span><span class="tab">Returns</span><span class="tab">Returned Stock Order Lines</span></div>
        <div class="intro"><span>Enter quantities to fully or partially receive or apply other actions on the bottom of the page. To specify asset tags or other details, click the detailed receipt icon at the end of each row.</span>${I.print}</div>
        ${E.top ? `<div class="alert-err">${E.top}</div>` : ''}
        ${!S.asns.length ? `<div class="alert-info" style="margin-bottom:10px">No ASN from the supplier flow yet. Submit one in the supplier flow, or use <b>Prototype ▾ → Load sample ASN</b>.</div>` : ''}
        <div class="c1bar alt"><span class="btn sm">Export to ▾</span><span class="sp"></span><span class="lbl">View</span><span class="sel" style="width:230px">All ${I.chev}</span><span class="btn sm" style="padding:0 7px">${I.clock}</span><span class="btn sm">Advanced</span><span class="srch" style="width:210px"><input placeholder="Search">${I.search}</span></div>
      </div>
      <div class="xwrap ${S.xp.receive ? 'expanded' : 'collapsed'}">${xToggle('receive')}
        <table class="c1 grey"><thead><tr><th>ASN #</th><th>ASN Line</th><th>Item</th><th>PO Number</th><th>PO Line</th><th>ASN Schedule Line #</th><th>Schedule Line Need By</th><th>Invoice</th><th>Invoice Line</th><th>Supplier</th><th class="r">ASN Quantity</th><th>UOM</th><th>PO Line Need By</th><th class="r">Received</th><th class="c">Receipt Date</th><th>Quick Receipts <input type="checkbox" class="native" data-a="qrAll"></th><th>Receipt approval required</th><th class="c">Actions</th></tr></thead><tbody>${body}</tbody></table>
      </div>
      <div class="c990 bot">${pager(2)}<div style="display:flex;justify-content:flex-end;gap:14px;align-items:center;margin-top:16px"><span class="lnk">Cancel</span><span class="btn" data-a="quickReceive">Receive</span></div></div>` + buyerFooter;
  }
  function quickReceive() {
    const rows = receiveRows(); const E = {}; const todo = [];
    for (const r of rows) { const v = S.qr[r.key]; if (v === undefined || v === '') continue; const n = Number(v); const open = r.qty - r.received;
      if (!(n > 0) || n > open) { E['qr.' + r.key] = 1; E.top = `Quick receipt quantity for ${r.asn} line ${r.ln} must be between 1 and ${open}.`; } else todo.push([r, n]); }
    if (!todo.length && !E.top) E.top = 'Enter a Quick Receipts quantity (or check All) on at least one line.';
    if (E.top) { S.errors = E; save(); render(); return; }
    const ids = todo.map(([r, n]) => makeReceipt(r, n, {}));
    S.qr = {}; S.errors = {}; S.banner = { receipts: ids.length }; save(); location.hash = '#/buyer/receipts';
  }
  function makeReceipt(r, n, extra) {
    const id = String(S.nextReceipt++);
    S.rcv[r.key] = (S.rcv[r.key] || 0) + n;
    S.receipts.unshift({ id, date: D.today, status: 'Created', type: 'Receipt', po: r.po, poLine: r.poLine, refs: r.refs, needBys: r.needBys, item: r.item, supplier: r.supplier, receiver: D.receiver, qty: n, uom: r.uom, price: r.price, asn: r.asn, asnLine: r.ln, itemNo: r.itemNo, needBy: r.needBy, ordered: r.ordered, warehouse: extra.warehouse || '', mine: true });
    return id;
  }

  // ================================================================ BUYER: ASN Detailed Receipt (222:102363)
  function vDetail(key) {
    const r = receiveRows().find(x => x.key === key);
    if (!r) return buyerHeader('Receive') + `<div class="c990"><h1>ASN Detailed Receipt</h1><p class="alert-info">That ASN line is no longer open. <span class="lnk" data-a="go" data-to="#/buyer/receive">Back to Receive</span></p></div>` + buyerFooter;
    const open = r.qty - r.received; const E = S.errors || {};
    const dr = S.dr && S.dr.key === key ? S.dr : (S.dr = { key, qty: String(open), action: 'inv', wh: '' });
    const kv = (k, v, req) => `<div class="kv"><div class="k">${req ? '<span class="req">*</span>' : ''}${k}</div><div class="v">${v}</div></div>`;
    const inp = w => `<input class="inp" style="width:${w}px">`;
    const sel = (w, v, ph) => `<select class="inp" style="width:${w}px">${ph ? `<option>${ph}</option>` : ''}${v ? `<option>${v}</option>` : ''}</select>`;
    const file = '<span class="fileinp"><span class="b">Choose File</span>No file chosen</span>';
    return buyerHeader('Receive') + `<div class="c990"><h1>ASN Detailed Receipt</h1>
      ${E.top ? `<div class="alert-err" style="margin-top:14px">${E.top}</div>` : ''}
      <div class="form2">
        <div class="col" style="width:450px">
          ${kv('Quantity', `<input class="inp ${E.qty ? 'err' : ''}" style="width:56px;text-align:right" data-f="dr.qty" value="${esc(dr.qty)}"> ${r.uom}<div class="lnk" style="margin-top:4px">${money((Number(dr.qty) || 0) * r.price)} USD</div>`, 1)}
          ${kv('Close for Receiving', '<input type="checkbox" class="native">')}
          ${kv('Receipt Date', dateInp('', D.today))}
          ${kv('Action', `<div style="display:flex;flex-direction:column;gap:12px">
            <label class="radio"><input type="radio" name="act" data-f="dr.action" value="consume" ${dr.action === 'consume' ? 'checked' : ''}> Consume</label>
            <label class="radio"><input type="radio" name="act" data-f="dr.action" value="inv" ${dr.action === 'inv' ? 'checked' : ''}> Receive to inventory</label>
            ${dr.action === 'inv' ? `<div style="display:flex;flex-direction:column;gap:12px;margin-left:10px">
              <div class="kv"><div class="k" style="width:96px">Target Item #</div><input class="inp" readonly style="width:172px" value="${esc(r.itemNo)}"></div>
              <div class="kv"><div class="k" style="width:96px"><span class="req">*</span>Warehouse</div><div><select class="inp ${E.wh ? 'err' : ''}" style="width:192px" data-f="dr.wh"><option value="">Select an Option</option>${['Main Warehouse - SF', 'East DC'].map(w => `<option ${dr.wh === w ? 'selected' : ''}>${w}</option>`).join('')}</select>${E.wh ? '<div class="lerr">Warehouse is required</div>' : ''}</div></div>
              <div class="kv tight"><div class="k" style="width:96px"><span class="req">*</span>Location</div><div class="v">${dr.wh ? (dr.wh === 'East DC' ? 'B-12' : 'A-01') : 'None'}</div></div></div>` : ''}
            <label class="radio"><input type="radio" name="act" data-f="dr.action" value="return" ${dr.action === 'return' ? 'checked' : ''}> Return to supplier</label>
            <label class="radio"><input type="radio" name="act" data-f="dr.action" value="dispose" ${dr.action === 'dispose' ? 'checked' : ''}> Dispose</label></div>`)}
        </div>
        <div class="col" style="flex:1">
          ${kv('Inspection Result', sel(116, '', ' '))}${kv('Rfid Tag', inp(156))}${kv('Barcode', inp(156))}${kv('Custom Field 16', inp(226))}
          ${kv('Packing slip', file)}${kv('Custom Field 17', file)}${kv('Custom Field 12', inp(226))}${kv('Receipts_Source', sel(248, 'USA'))}
          ${kv('Carrier Name', inp(226))}${kv('money', `${inp(86)} <select class="inp" style="width:72px"><option>USD</option></select>`)}${kv('Custom Date', dateInp(''))}
          ${kv('Text Box CF', '<textarea class="inp" rows="5" style="width:244px"></textarea>')}${kv('Custom Field 13', sel(248, 'USA'))}${kv('Custom Field 18', inp(226))}
          ${kv('CF Attachments', file)}${kv('custom_field_2', inp(226))}${kv('Evidencia Recepcion', 'Add <span class="lnk">File</span> | <span class="lnk">URL</span> | <span class="lnk">Text</span>')}
        </div>
      </div>
      <div class="sect2">ASN Line</div>
      <table class="c1 grey" style="border:1px solid #ddd"><thead><tr><th>ASN #</th><th>ASN Line</th><th>PO #</th><th>PO Line</th><th>ASN Schedule Line #</th><th>Schedule Line Need By</th><th>Invoice</th><th>Invoice Line</th><th>Description</th><th>Supplier</th><th class="r">Shipped Qty</th><th>UOM</th><th class="r">Price</th><th class="r">PO Total</th><th>Need By</th><th class="r">Received</th></tr></thead>
        <tbody><tr><td><span class="lnk">${esc(r.asn)}</span></td><td>${r.ln}</td><td><span class="lnk">${esc(r.po)}</span></td><td>${r.poLine}</td><td>${nums(r)}</td><td>${nbs(r)}</td><td></td><td></td><td>${esc(r.item)}</td><td>${esc(r.supplier)}</td><td class="r">${q1(r.qty)}</td><td>${r.uom}</td><td class="r">${money(r.price)}</td><td class="r">${money(r.price * r.qty)}</td><td>${none(r.needBy)}</td><td class="r">${q1(r.received)}</td></tr></tbody></table>
      <div class="sect2">Asset Tags (Optional)</div>
      <div class="assets"><div class="top"><div class="k" style="width:146px;text-align:right;font-weight:700;color:#3e5673">Asset Tags</div><div style="flex:1">You can enter asset tags manually below or use <span class="lnk">this CSV template</span>. The headers must be <i>asset tag, serial, owner,</i> and <i>note</i>. In each row, <i>asset tag</i> is required while the others are optional. Remember, the number of asset tags in the CSV file must be ${open} or fewer. <span class="lnk">Toggle manual entry.</span><div style="margin-top:6px">${file}</div></div></div>
        <div class="man"><div style="display:flex;gap:10px;align-items:flex-end">${['Tag', 'Serial Number', 'Owner', 'Note'].map((t, i) => `<div><div style="font-weight:700;color:#3e5673;margin-bottom:6px">${i === 0 ? '<input type="checkbox" class="native"> ' : ''}${t}</div><input class="inp" style="width:194px"></div>`).join('')}</div></div></div>
      <div style="display:flex;justify-content:flex-end;gap:16px;align-items:center;margin-top:22px"><span class="lnk" data-a="go" data-to="#/buyer/receive">Cancel</span><span class="btn primary" data-a="submitDetail" data-k="${esc(key)}">Submit</span></div>
    </div>` + buyerFooter;
  }
  function submitDetail(key) {
    const r = receiveRows().find(x => x.key === key); const dr = S.dr; const open = r.qty - r.received; const E = {};
    const n = Number(dr.qty);
    if (!(n > 0) || n > open) { E.qty = 1; E.top = `Quantity must be between 1 and ${open}.`; }
    if (dr.action === 'inv' && !dr.wh) { E.wh = 1; E.top = E.top || 'Warehouse is required to receive to inventory.'; }
    if (E.top) { S.errors = E; save(); render(); return; }
    const id = makeReceipt(r, n, { warehouse: dr.wh });
    S.dr = null; S.errors = {}; S.banner = { receipts: 1, id }; save(); location.hash = '#/buyer/receipts';
  }

  // ================================================================ BUYER: View Receipts (222:102705)
  function allReceipts() { return S.receipts.concat(D.receipts.map(r => Object.assign({ status: 'Created', refs: [], needBys: [] }, r))); }
  function vReceipts() {
    const rows = allReceipts().map(r => `<tr class="${r.mine && S.banner && S.banner.receipts ? 'new' : ''}">
      <td><input type="checkbox" class="native"></td><td><span class="lnk" data-a="go" data-to="#/buyer/receipts/${r.id}">${r.date}</span></td><td>${r.status}</td><td>${r.type}</td><td><span class="lnk">${esc(r.po)}</span></td><td>${r.poLine}</td>
      <td>${nums(r)}</td><td>${none()}</td><td>${none()}</td><td>${esc(r.item)}</td><td>${esc(r.supplier)}</td><td>${esc(r.receiver)}</td>
      <td class="r">${r.qty == null ? none() : fmt(r.qty)}</td><td>${none(r.uom)}</td><td class="r">${money(r.price)}</td><td>USD</td><td class="r">${money(r.total != null ? r.total : r.price * r.qty)}</td><td></td>
      <td><span class="acts" style="gap:8px">${(r.actions === undefined || r.actions >= 1) ? `<span class="ico" data-tip="Void">${I.void}</span>` : ''}${(r.actions === undefined || r.actions >= 2) ? `<span class="ico" data-tip="Return">${I.inventoryReturn}</span>` : ''}</span></td></tr>`).join('');
    const b = S.banner && S.banner.receipts ? S.banner : null;
    return buyerHeader('View Receipts') + `
      <div class="c990 top"><h1>View Receipts</h1>
        <div class="tabs"><span class="tab on">Receipts</span><span class="tab">Receipt Requests</span></div><div style="height:24px"></div>
        ${b ? `<div class="alert-ok" style="margin-bottom:10px">${b.receipts} receipt${b.receipts > 1 ? 's' : ''} created successfully<span class="x" data-a="dismiss">${I.close}</span></div>` : ''}
        <div class="c1bar alt"><span class="btn sm">Export to ▾</span><span class="sp"></span><span class="lbl">View</span><span class="sel" style="width:230px">All ${I.chev}</span><span class="btn sm" style="padding:0 7px">${I.clock}</span><span class="btn sm">Advanced search</span><span class="srch" style="width:210px"><input placeholder="Search">${I.search}</span></div>
        <div class="bulk">↩ <span class="btn sm disabled">Void</span><span class="btn sm disabled">Return</span></div>
      </div>
      <div class="xwrap ${S.xp.receipts ? 'expanded' : 'collapsed'}">${xToggle('receipts')}
        <table class="c1"><thead><tr><th><input type="checkbox" class="native"></th><th>Created Date</th><th>Status</th><th>Type</th><th>PO ID</th><th>Order Line Number</th><th>ASN Schedule Line #</th><th>Invoice(ASN Line)</th><th>Invoice Line Number(ASN Line)</th><th>Item</th><th>Supplier</th><th>Receiver</th><th class="r">Quantity</th><th>UOM</th><th class="r">Price</th><th>Currency</th><th class="r">Total</th><th>Receipts Batch Source</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table>
      </div>
      <div class="c990 bot">${pager(2)}</div>` + buyerFooter;
  }

  // ================================================================ BUYER: View Receipt (222:102865)
  function vReceipt(id) {
    const r = allReceipts().find(x => x.id === id);
    if (!r) return buyerHeader('View Receipts') + `<div class="c990"><h1>View Receipt</h1><p class="alert-info">Receipt not found. <span class="lnk" data-a="go" data-to="#/buyer/receipts">View All Receipts</span></p></div>` + buyerFooter;
    const kv = (k, v) => `<div class="kv"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    return buyerHeader('View Receipts') + `<div class="c990"><h1>View Receipt</h1><div style="height:24px"></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${kv('Receipt ID', r.id)}${kv('Receipt Request', none())}${r.asn ? kv('ASN', `<span class="lnk">${esc(r.asn)} · Line ${r.asnLine}</span>`) : ''}${kv('Created on', r.date)}${kv('Type', r.type.toLowerCase())}${kv('Status', r.status)}
        ${kv('Item number', esc(r.itemNo || 'DLHM64'))}${kv('Item', `<span class="lnk">${esc(r.item)}</span>`)}${kv('Quantity', r.qty == null ? none() : r.qty)}${kv('Voided/Returned Quantity', '0.0')}${kv('UOM', none(r.uom))}
        ${kv('Price', money(r.price) + ' USD')}${kv('Receipt Date', r.date)}${kv('Created by user', esc(r.receiver))}${kv('Match Reference Key', none())}${kv('Inspection Result', none())}
        ${kv('Chart of Accounts', 'SAP General Ledger')}${kv('Account', 'DAL-Marketing-Assets')}${r.warehouse ? kv('Warehouse', esc(r.warehouse)) : ''}${['Rfid Tag', 'Barcode', 'Custom Field 16', 'Packing slip', 'Custom Field 17', 'Custom Field 12'].map(k => kv(k, none())).join('')}
        ${kv('Receipts_Source', 'USA')}${['Carrier Name', 'money', 'Custom Date', 'Text Box CF'].map(k => kv(k, none())).join('')}${kv('Custom Field 13', 'USA')}${['Custom Field 18', 'CF Attachments', 'custom_field_2'].map(k => kv(k, none())).join('')}
        ${kv('Exported', 'No (<span class="lnk">Change</span>)')}${kv('Evidencia recepcion', none())}
      </div>
      <div class="sect2">PO Line</div>
      <table class="c1 grey" style="border:1px solid #ddd"><thead><tr><th>PO</th><th>Line</th><th>ASN Schedule Line #</th><th>Req</th><th>Line</th><th>Description</th><th>Supplier</th><th class="r">Ordered</th><th>Unit</th><th class="r">Price</th><th class="r">Total</th><th class="r">Landed Cost</th><th class="r">Total with Landed Cost</th><th>Need By</th><th class="r">Received</th></tr></thead>
        <tbody><tr><td><span class="lnk">${esc(r.po)}</span></td><td>${r.poLine}</td><td>${nums(r)}</td><td><span class="lnk">4102</span></td><td>1</td><td>${esc(r.item)} ${I.edit.replace('width="20" height="20"', 'width="13" height="13"')}</td><td><span class="lnk">${esc(r.supplier)}</span></td><td class="r">${r.ordered || r.qty || ''}</td><td>${none(r.uom)}</td><td class="r">${money(r.price)}</td><td class="r">${money(r.price * (r.ordered || r.qty || 0))}</td><td></td><td></td><td>${none(r.needBy)}</td><td class="r">${q1(r.qty || 0)}</td></tr></tbody></table>
      <div style="display:flex;justify-content:flex-end;gap:14px;margin-top:30px"><span class="btn">Return</span><span class="btn">Edit Receipt</span></div>
      <div class="sect2">Void</div>
      <div class="kv"><div class="k">Qty to Void</div><div class="v"><input class="inp" style="width:156px"> <label><input type="checkbox" class="native"> All</label><div style="font-size:10.5px;color:#555;margin-top:6px">${r.qty || 0} eligible for void</div></div></div>
      <div class="kv" style="margin-top:10px"><div class="k">Reason for Voiding</div><div class="v"><select class="inp" style="width:194px"><option>Select</option></select></div></div>
      <div class="kv" style="margin-top:10px"><div class="k">Void Note</div><div class="v"><textarea class="inp" rows="5" style="width:390px" placeholder="Provide optional note"></textarea></div></div>
      <div style="display:flex;justify-content:flex-end;gap:14px;align-items:center;margin-top:8px"><span class="lnk" data-a="go" data-to="#/buyer/receipts">« View All Receipts</span><span class="btn disabled">Void Receipt</span></div>
      <div class="sect2">${I.clock} Integration History</div><div>No Records Found</div>
      <div class="sect2" style="margin-top:50px">${I.clock} History</div>
      <div class="hist"><span class="who">${esc(r.receiver)}</span> on <b>${r.date}</b> at <b>10:42 AM</b><div>${r.type} ${r.id} Created</div></div>
    </div>` + buyerFooter;
  }

  // ---------------------------------------------------------------- prototype menu
  const SCREENS = [
    ['h', 'Supplier · CSP'], ['CSP - OP Flip to ASN (Orders)', '#/orders'], ['Draft ASN', '#/proto/draft'], ['Delivery Schedules (none selected)', '#/proto/schedules'],
    ['Select Delivery Schedules (4 selected)', '#/proto/selected'], ['ASN Delivery Schedules added', '#/proto/added'],
    ['Manage - Add PO Lines (nested lines)', '#/proto/manage-add'], ['Manage - PO Lines', '#/proto/manage-lines'], ['Manage - Delete PO Lines', '#/proto/manage-delete'], ['Manage - Confirm delete', '#/proto/manage-confirm'],
    ['h', 'Buyer · Inventory'], ['Receive — ASN Lines', '#/buyer/receive'], ['ASN Detailed Receipt', '#/proto/detail'], ['View Receipts', '#/buyer/receipts'], ['View Receipt', '#/proto/receipt'],
  ];
  const vProto = () => `<div class="proto"><span class="btn" data-a="menu">Prototype ▾</span>${menuOpen ? `<div class="menu">
    ${SCREENS.map(([t, h]) => t === 'h' ? `<div class="h">${h}</div>` : `<div class="i" data-a="go" data-to="${h}">${t}</div>`).join('')}
    <hr><div class="i" data-a="go" data-to="#/proto/sample">Load sample ASN (ASN-3627-01, submitted)</div><div class="i" data-a="go" data-to="#/proto/reset">Reset prototype</div></div>` : ''}</div>`;
  const pick4 = l => { l.sel = Object.fromEntries(src(l).sch.slice(0, 4).map(s => [s.ref, schOpen(s)])); l.qty = q4(Object.values(l.sel).reduce((t, v) => t + v, 0)); };
  function loadSample() {
    const keep = { asns: S.asns, receipts: S.receipts, rcv: S.rcv, nextReceipt: S.nextReceipt };
    newDraft('3627'); pick4(S.draft.lines[0]); S.draft.asnNo = 'ASN-3627-01'; submit(); Object.assign(S, { banner: null });
    S.receipts = keep.receipts; S.rcv = keep.rcv; S.nextReceipt = keep.nextReceipt; save();
  }
  function protoState(k) {
    if (k === 'sample') { loadSample(); location.replace('#/buyer/receive'); toast('Sample ASN-3627-01 submitted from the supplier side'); return; }
    if (k === 'detail' || k === 'receipt') {
      if (!S.asns.length) loadSample();
      const r = receiveRows().find(x => x.mine && x.qty - x.received > 0);
      if (k === 'detail') { S.dr = null; location.replace(r ? `#/buyer/receive/detail/${encodeURIComponent(r.key)}` : '#/buyer/receive'); return; }
      if (!S.receipts.length && r) makeReceipt(r, r.qty - r.received, { warehouse: 'Main Warehouse - SF' });
      save(); location.replace(`#/buyer/receipts/${allReceipts()[0].id}`); return;
    }
    newDraft('3627'); const l = S.draft.lines[0];
    if (k === 'schedules' || k === 'selected') { openCard(l); if (k === 'selected') for (const r of S.card.rows) r.on = ['20501', '20502', '20503', '20505'].includes(r.ref); }
    if (k === 'added' || k.startsWith('manage')) pick4(l);
    if (k === 'manage-add') openManage();
    if (k === 'manage-lines') { openManage(); S.modal.tab = 'added'; }
    if (k === 'manage-delete' || k === 'manage-confirm') { openManage(); S.modal.tab = 'added'; S.modal.dsel = Object.fromEntries(S.draft.lines.map(x => [x.id, true])); }
    if (k === 'manage-confirm') S.confirm = { ids: S.draft.lines.map(x => x.id) };
    save(); location.replace('#/asn');
  }

  // ---------------------------------------------------------------- render / router
  function render() {
    const h = location.hash || '#/orders';
    const vpTop = {}; document.querySelectorAll('.sch-vp').forEach(v => { vpTop[v.dataset.vp] = v.scrollTop; });
    const keep = {}; document.querySelectorAll('[data-keep]').forEach(v => { keep[v.dataset.keep] = v.scrollTop; });
    const m = h.match(/^#\/([\w-]+)\/?([^/]*)\/?([^/]*)\/?(.*)$/) || [];
    const [, area, a, b, c] = m;
    if (area === 'proto') {
      menuOpen = false;
      if (a === 'reset') { localStorage.removeItem(KEY); S = fresh(); location.replace('#/orders'); toast('Prototype reset'); return; }
      protoState(a); return;
    }
    let html;
    if (area === 'asn') html = vDraft() + (S.draft ? vManage() + vConfirm() : '');
    else if (area === 'buyer') {
      document.title = 'Coupa · ASN at PO Delivery Schedule Line Level';
      if (a === 'receive' && b === 'detail') html = vDetail(decodeURIComponent(c));
      else if (a === 'receive') html = vReceive();
      else if (a === 'receipts' && b) html = vReceipt(b);
      else html = vReceipts();
    } else html = vOrders();
    if (area !== 'buyer') document.title = 'ASN at PO Delivery Schedule Line Level · Coupa Supplier Portal';
    $app.innerHTML = html + vProto();
    document.querySelectorAll('[data-keep]').forEach(v => { v.scrollTop = keep[v.dataset.keep] || 0; });
    document.querySelectorAll('.sch-vp').forEach(v => { v.scrollTop = vpTop[v.dataset.vp] || 0; v.addEventListener('scroll', () => syncScroll(v)); syncScroll(v); });
  }
  window.addEventListener('hashchange', () => {
    const h = location.hash;
    if (S.banner && S.banner.asn && !/^#\/orders/.test(h) && !/^#\/buyer\/receive$/.test(h)) S.banner = null;
    if (S.banner && S.banner.receipts && !/^#\/buyer\/receipts$/.test(h)) S.banner = null;
    S.errors = {}; save(); render(); window.scrollTo(0, 0);
  });

  // ---------------------------------------------------------------- events
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-a]');
    if (!el) { if (menuOpen && !e.target.closest('.proto')) { menuOpen = false; render(); } return; }
    const a = el.dataset.a, k = el.dataset.k, id = el.dataset.id, ref = el.dataset.ref;
    if (a !== 'menu') menuOpen = false;
    const c = S.card, m = S.modal;
    switch (a) {
      case 'go': if (location.hash === el.dataset.to) render(); else location.hash = el.dataset.to; break;
      case 'menu': menuOpen = !menuOpen; render(); break;
      case 'dismiss': S.banner = null; save(); render(); break;
      case 'flip': newDraft(el.dataset.po); save(); location.hash = '#/asn'; break;
      // Delivery Schedules card
      case 'card': if (c && c.lineId === id) S.card = null; else openCard(lineById(id)); save(); render(); break;
      case 'cardRow': { const r = c.rows.find(r => r.ref === ref); r.on = !r.on; delete c.err[ref]; save(); render(); break; }
      case 'cardAll': { const live = c.rows.filter(r => r.open > 0); const all = live.every(r => r.on); live.forEach(r => { r.on = !all; }); save(); render(); break; }
      case 'cardCancel': S.card = null; save(); render(); break;
      case 'cardSave': saveCard(); break;
      // lines / manage
      case 'rmLine': S.confirm = { ids: [id] }; save(); render(); break;
      case 'manage': openManage(); save(); render(); break;
      case 'mClose': S.modal = null; save(); render(); break;
      case 'mTab': m.tab = k; m.dsel = {}; save(); render(); break;
      case 'mExp': m.exp[k] = !m.exp[k]; save(); render(); break;
      case 'mExpAll': manageRows().forEach(l => { if (l.sch.length) m.exp[lkey(l)] = true; }); save(); render(); break;
      case 'mColAll': m.exp = {}; save(); render(); break;
      case 'mPo': { const l = poLine(k); const st = pState(l);
        if (l.sch.length) { delete m.on[k]; if (st === true) m.ssel[k] = {}; else { m.ssel[k] = Object.fromEntries(l.sch.filter(s => schOpen(s) > 0).map(s => [s.ref, true])); m.exp[k] = true; } }
        else if (st) delete m.on[k]; else m.on[k] = true;
        save(); render(); break; }
      case 'mSch': { const ss = m.ssel[k] = m.ssel[k] || {}; if (ss[ref]) delete ss[ref]; else ss[ref] = true; delete m.on[k]; save(); render(); break; }
      case 'mSchAll': { const l = poLine(k); const live = l.sch.filter(s => schOpen(s) > 0); const ss = m.ssel[k] || {}; const all = live.every(s => ss[s.ref]); m.ssel[k] = all ? {} : Object.fromEntries(live.map(s => [s.ref, true])); delete m.on[k]; save(); render(); break; }
      case 'mAll': { const rows = manageRows(); const all = rows.every(l => pState(l) === true);
        m.on = {}; m.ssel = {}; if (!all) rows.forEach(l => { const kk = lkey(l); if (l.sch.length) m.ssel[kk] = Object.fromEntries(l.sch.filter(s => schOpen(s) > 0).map(s => [s.ref, true])); else m.on[kk] = true; });
        save(); render(); break; }
      case 'mAdd': applyManage(); break;
      case 'dSel': if (el.checked) m.dsel[k] = true; else delete m.dsel[k]; save(); render(); break;
      case 'dAll': m.dsel = {}; if (el.checked) S.draft.lines.forEach(l => { m.dsel[l.id] = true; }); save(); render(); break;
      case 'mDel': S.confirm = { ids: Object.keys(m.dsel) }; save(); render(); break;
      case 'cfNo': S.confirm = null; save(); render(); break;
      case 'cfOk': deleteLines(S.confirm.ids); if (S.modal) S.modal.dsel = {}; S.confirm = null; save(); render(); break;
      // footer
      case 'saveDraft': save(); toast('ASN draft saved'); break;
      case 'cancelDraft': S.draft = null; S.card = null; save(); location.hash = '#/orders'; break;
      case 'submit': submit(); break;
      // buyer
      case 'xp': S.xp[el.dataset.w] = !S.xp[el.dataset.w]; save(); render(); break;
      case 'detail': S.dr = null; S.errors = {}; location.hash = `#/buyer/receive/detail/${encodeURIComponent(k)}`; break;
      case 'submitDetail': submitDetail(k); break;
      case 'quickReceive': quickReceive(); break;
      case 'qrAll': { const on = el.checked; S.qr = {}; if (on) for (const r of receiveRows()) { const o = r.qty - r.received; if (o > 0) S.qr[r.key] = String(o); } save(); render(); break; }
    }
  });
  document.addEventListener('input', e => {
    const t = e.target, f = t.dataset.f;
    if (t.dataset.qr !== undefined) { S.qr[t.dataset.qr] = t.value; save(); return; }
    if (!f) return;
    if (f.startsWith('d.')) { S.draft[f.slice(2)] = t.value; save(); return; }
    if (f.startsWith('q.')) { lineById(f.slice(2)).qty = t.value; save(); return; }
    if (f.startsWith('cs.')) { // typing a Shipped Qty selects that schedule line
      const r = S.card.rows.find(r => r.ref === f.slice(3)); r.ship = t.value; t.classList.remove('err');
      if (!r.on) { r.on = true; save(); const pos = t.selectionStart; render(); const n = document.querySelector(`[data-f="${f}"]`); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
      const tot = document.getElementById('cardtot'); if (tot) tot.textContent = fmt(cardTotal()); save(); return;
    }
    if (f === 'mq') { S.modal.q = t.value; save(); const pos = t.selectionStart; render(); const n = document.querySelector('[data-f="mq"]'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
    if (f === 'dr.qty') { S.dr.qty = t.value; save(); return; }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.f === 'dr.action') { S.dr.action = t.value; save(); render(); }
    if (t.dataset.f === 'dr.wh') { S.dr.wh = t.value; save(); render(); }
    if (t.dataset.f === 'dr.qty') render();
    if (t.dataset.qa !== undefined) { S.qr[t.dataset.qa] = t.checked ? t.dataset.open : ''; save(); render(); }
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (S.confirm) S.confirm = null; else if (S.modal) S.modal = null; else return;
    save(); render();
  });

  if (!location.hash) location.replace('#/orders');
  render();
})();
