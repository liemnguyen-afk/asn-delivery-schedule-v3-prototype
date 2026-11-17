/* Sample data — mirrors Figma "544 ASN at PO Delivery Schedule Line Level (INV-CORE)", page "ASN at PO Delivery Schedule v3"
   (126:27179): supplier section "ASN at PO Delivery" (126:29138) and buyer section "Buyer - ASN Receipt" (222:102215).
   Dates are MM/DD/YYYY (the Figma mixes DD/MM and MM/DD). */
(() => {
  const sch = (refs, qty, dates, extra = {}) => refs.map((ref, i) => Object.assign({ ref, qty: Array.isArray(qty) ? qty[i] : qty, shipped: 0, needBy: dates[i], by: 'Buyer' }, extra[ref] || {}));
  const code = (po, line) => po.replace(/\W/g, '').slice(-6).toUpperCase() + line;
  const L = (po, line, qty, uom, item, price, orderDate, needBy, more = {}) => Object.assign({ po, line, qty, uom, item, price, orderDate, needBy, spn: 'INP' + code(po, line), aux: 'INAPM' + code(po, line), itemNo: 'ITM-' + code(po, line), sch: [] }, more);

  window.DATA = {
    today: '11/17/2026',
    customer: 'inventory-master',
    supplierName: 'Tech Supplies Co.',
    receiver: 'Maya Wong',
    shipTo: { address: ['150 Main Street', 'San Francisco, CA 94450', 'United States', 'Location Code: 12345', 'Attn: hello'], attention: 'hello' },

    /* Lines the Create ASN action on PO 3627 puts on the draft (Figma Draft ASN 126:29142) */
    flipLines: ['3853-1', '3627-2'],

    /* Open PO lines the supplier can put on an ASN (Manage PO Lines › Add PO Lines, Figma 237:13772).
       sch = PO delivery schedule lines (Reference ID, Quantity, shipped so far, Need By, Initiated By). */
    poLines: [
      L('3853', 1, 100, 'Each', 'Dell Laptop High End Model', 4000, '07/30/2026', '12/15/2026', { spn: 'INP5671', aux: 'INAPM5671', itemNo: 'DLHM64',
        sch: sch(['20501', '20502', '20503', '20504', '20505', '20506', '20507', '20508'], 10,
          ['11/15/2026', '11/22/2026', '11/29/2026', '12/06/2026', '12/13/2026', '12/20/2026', '12/27/2026', '01/03/2027']) }),
      L('3627', 2, 12, 'Box', 'Wireless Keyboard and Mouse', 600, '07/30/2026', '11/30/2026', { spn: 'INP5678', aux: 'INAPM5678', itemNo: 'WKM-2002' }),
      L('8765', 1, 1, 'Box', 'New_item1', 200, '08/02/2026', ''),
      L('ExtPO-Reg2', 2, 5000, 'Each', 'BSL & SUB line', 240000, '07/29/2026', '11/29/2026', {
        sch: sch(['SL-10', 'SL-20', 'SL-30'], [2000, 2000, 1000], ['09/30/2026', '10/31/2026', '11/29/2026']) }),
      L('RegTest PO1', 5, 3000, 'Each', 'Test item5', 3000000, '07/29/2026', '11/29/2026', {
        sch: sch(['SL-10', 'SL-20', 'SL-30'], 1000, ['09/30/2026', '10/31/2026', '11/29/2026'], { 'SL-10': { shipped: 1000 } }) }),
      L('RegTest PO1', 4, 3000, 'Each', 'Test item4', 3000000, '07/29/2026', '11/29/2026'),
      L('RegTest PO1', 3, 1000, 'Each', 'Test item3', 1000000, '07/29/2026', '11/29/2026'),
      L('RegTest PO1', 1, 2000, 'Each', 'Test item2', 2000000, '07/29/2026', '11/29/2026'),
      L('8755', 1, 10, 'Box', 'item1', 2000, '07/28/2026', '07/31/2026'),
      L('Test PO3', 2, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026', {
        sch: sch(['SL-10', 'SL-20'], 500, ['10/31/2026', '11/29/2026']) }),
      L('Test PO3', 1, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'),
      L('Test PO2', 2, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'),
      L('Test PO2', 1, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'),
      L('Test PO1', 1, 1000, 'Each', 'Test item1', 1000000, '07/17/2026', '11/29/2026'),
      L('Test PO1', 2, 1000, 'Each', 'Test item1', 1000000, '07/17/2026', '11/29/2026'),
      L('8736', 1, 30, 'Box', 'cars', 12000, '07/15/2026', ''),
      L('CMIPO9', 1, 1000, 'Each', 'Lenovo ThinkPad T61', 1000000, '07/06/2026', '11/29/2026'),
      L('CMIPO9', 2, 1000, 'Each', 'Lenovo ThinkPad R61i', 1000000, '07/06/2026', '11/29/2026'),
      L('CMIPO8', 1, 500, 'Each', 'Lenovo ThinkPad T61', 500000, '07/06/2026', '11/29/2026'),
      L('CMIPO8', 2, 500, 'Each', 'Lenovo ThinkPad T61', 500000, '07/06/2026', '11/29/2026'),
    ],
    /* expanded by default in Add PO Lines (as in Figma) */
    expandedByDefault: ['3853-1', 'RegTest PO1-5'],

    /* CSP Orders data table (CSP - OP Flip to ASN, 212:85795) */
    orders: [
      { po: '3627', date: '11/02/2026', items: ['20 Each of Office Kits', '12 Box of Wireless Keyboard and Mouse'], total: '6,000.00 USD', flip: true },
      { po: '3626', date: '11/02/2026', items: ['20 Each of Dell Laptop High End Model', '20 Each of Dell Laptop High End Model'], total: '6,000.00 USD', flip: true },
      { po: '3625', date: '11/01/2026', items: ['Laptops'], total: '100,000.00 USD' },
      { po: '3624', date: '11/01/2026', items: ['item1'], total: '110.00 USD' },
      { po: '3623', date: '11/01/2026', items: ['88 Each of item 1'], total: '5,280.00 USD', flip: true },
      { po: '3622', date: '11/01/2026', items: ['66 Each of item1', '66 Each of item2'], total: '5,280.00 USD', cog: true },
      { po: '3621', date: '11/01/2026', items: ['66 Each of item1', '66 Each of item2'], total: '9,240.00 USD', flip: true },
      { po: '3620', date: '10/30/2026', items: ['200 Each of Dell Laptop High End Model', '200 Each of Laptops'], total: '60,000.00 USD', flip: true },
      { po: '3619', date: '10/29/2026', items: ['100 Each of Dell Laptop High End Model'], total: '20,000.00 USD', flip: true },
      { po: '3618', date: '10/28/2026', items: ['10 Each of CD-621630 synchronous receipt test 20261028'], total: '10.00 USD', flip: true },
      { po: '3617', date: '10/27/2026', items: ['10 Each of CD-621630 receiving walkthrough 20261028'], total: '10.00 USD', flip: true },
      { po: '3616', date: '10/27/2026', items: ['10 Each of Dell Laptop High End Model'], total: '2,000.00 USD', flip: true },
    ],

    /* Buyer Receive › ASN Lines (existing rows, 222:102218) */
    receiveRows: [
      { asn: 'ASn4567', ln: 1, item: 'cars', po: '8736', poLine: 1, supplier: 'scc_sup', qty: 30, uom: 'Box', needBy: 'None', received: 0, approval: 'Yes' },
      { asn: 'ASN-1234', ln: 1, item: 'ASN Item', po: '8705', poLine: 1, supplier: 'SCC External 4', qty: 5, uom: 'Each', needBy: 'None', received: 0, approval: 'Yes' },
      { asn: '6551_qtycheck', ln: 1, item: 'car_light', po: '6551', poLine: 1, supplier: 'scc_sup', qty: 90, uom: 'Box', needBy: '03/04/2025', received: 0, approval: 'Yes' },
      { asn: 'ASN_TOTQTY1', ln: 1, item: 'scc_item1', po: '7638', poLine: 1, supplier: 'scc_sup', qty: 5, uom: 'Box', needBy: 'None', received: 0, approval: 'Yes' },
      { asn: 'ASN_for_SMO', ln: 1, item: 'Lenovo ThinkPad X61 Tablet', po: '8577', poLine: 1, supplier: 'scc_sup', qty: 10, uom: 'Each', needBy: 'None', received: 0, approval: 'Yes' },
      { asn: 'track1', ln: 1, item: 'Keyboards', po: '8474', poLine: 1, supplier: 'SCC External 4', qty: 10, uom: 'Each', needBy: '04/30/2026', received: 5, approval: 'No' },
      { asn: 'track1', ln: 2, item: 'Mouse', po: '8474', poLine: 2, supplier: 'SCC External 4', qty: 10, uom: 'Each', needBy: '04/30/2026', received: 0, approval: 'No' },
      { asn: 'ASN_8542', ln: 4, item: 'Test1', po: '8542', poLine: 4, supplier: 'SCC External 4', qty: 2, uom: 'Box', needBy: '05/30/2026', received: 0, approval: 'No' },
      { asn: 'ASN_8542', ln: 3, item: 'Test1', po: '8542', poLine: 3, supplier: 'SCC External 4', qty: 1, uom: 'Box', needBy: '05/30/2026', received: 0, approval: 'No' },
    ],

    /* Buyer View Receipts (existing rows, 222:102705) */
    receipts: [
      { id: '15330', date: '11/08/2026', type: 'Consumption', po: '3600', poLine: 1, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'R.V. Amudha', qty: 7, uom: 'Each', price: 108, actions: 2 },
      { id: '15301', date: '11/05/2026', type: 'Consumption', po: '3862', poLine: 2, item: 'Desktops', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: null, uom: 'None', price: 20000, total: 20000, actions: 1 },
      { id: '15298', date: '11/05/2026', type: 'Consumption', po: '3863', poLine: 1, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 20, uom: 'Each', price: 200, actions: 2 },
      { id: '15297', date: '11/05/2026', type: 'Consumption', po: '3863', poLine: 2, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 20, uom: 'Each', price: 100, actions: 2 },
      { id: '15295', date: '11/05/2026', type: 'Consumption', po: '3864', poLine: 1, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 14, uom: 'Each', price: 300, actions: 2 },
      { id: '15290', date: '11/05/2026', type: 'Consumption', po: '3869', poLine: 2, item: 'Test line 2', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 100, uom: 'Each', price: 100, actions: 2 },
      { id: '15289', date: '11/05/2026', type: 'Consumption', po: '3869', poLine: 1, item: 'Test line 1', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 10, uom: 'Each', price: 500, actions: 2 },
      { id: '15284', date: '11/05/2026', type: 'Consumption', po: '3867', poLine: 2, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 5, uom: 'Each', price: 200, actions: 2 },
      { id: '15281', date: '11/05/2026', type: 'Consumption', po: '3865', poLine: 1, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Ashok Pusarla', qty: 5, uom: 'Each', price: 300, actions: 2 },
      { id: '15270', date: '11/04/2026', type: 'Return to Supplier', po: '3864', poLine: 2, item: 'Dell Laptop High End Model', supplier: 'Inv Ext 1', receiver: 'Mary Caraman', qty: 5, uom: 'Each', price: 100, actions: 0 },
    ],
  };
})();
