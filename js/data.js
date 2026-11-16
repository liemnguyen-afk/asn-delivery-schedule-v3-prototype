/* Sample data — mirrors Figma "544 ASN at PO Delivery Schedule Line Level (INV-CORE)",
   page "ASN at PO Delivery Schedule v3" (126:27179), section "ASN at PO Delivery" (126:29138).
   Dates are MM/DD/YYYY (the Figma mixes DD/MM and MM/DD). */
window.DATA = {
  today: '11/16/2026',
  customer: 'inventory-master',
  shipTo: { address: ['150 Main Street', 'San Francisco, CA 94450', 'United States', 'Location Code: 12345', 'Attn: hello'], attention: 'hello' },

  /* PO lines that a Flip to ASN puts on the draft. sch = PO delivery schedule lines. */
  poLines: {
    '3627-1': { po: '3627', line: 1, item: 'Dell Laptop High End Model', qty: 100, uom: 'Each', needBy: '12/15/2026', spn: 'INP5671', aux: 'INAPM5671', price: 4000, orderDate: '11/02/2026',
      sch: [
        { n: 1, qty: 10, needBy: '11/15/2026', ref: '20508', ext: '', by: 'Buyer' }, { n: 2, qty: 10, needBy: '11/22/2026', ref: '20507', ext: '', by: 'Buyer' }, { n: 3, qty: 10, needBy: '11/29/2026', ref: '20506', ext: '', by: 'Buyer' }, { n: 4, qty: 10, needBy: '12/06/2026', ref: '20505', ext: '', by: 'Buyer' },
        { n: 5, qty: 10, needBy: '12/13/2026', ref: '20504', ext: '', by: 'Buyer' }, { n: 6, qty: 10, needBy: '12/20/2026', ref: '20503', ext: '', by: 'Buyer' }, { n: 7, qty: 10, needBy: '12/27/2026', ref: '20502', ext: '', by: 'Buyer' }, { n: 8, qty: 10, needBy: '01/03/2027', ref: '20501', ext: '', by: 'Buyer' },
      ] },
    '3627-2': { po: '3627', line: 2, item: 'Wireless Keyboard and Mouse', qty: 12, uom: 'Box', needBy: '11/30/2026', spn: 'INP5678', aux: 'INAPM5678', price: 600, orderDate: '11/02/2026', sch: [] },
  },

  /* CSP Orders data table (CSP - OP Flip to ASN, 212:85795) */
  orders: [
    { po: '3627', date: '11/02/2026', items: ['100 Each of Dell Laptop High End Model', '12 Box of Wireless Keyboard and Mouse'], total: '6,000.00 USD', flip: true },
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

  /* Manage PO Lines › Add PO Lines (213:95322) */
  addable: [
    ['8898', 1, 20, 'Box', 'item1', 4000, '10/21/2026', '10/31/2026'],
    ['8797', 1, 1, 'Box', 'New_item1', 200, '09/20/2026', '09/30/2026'],
    ['8765', 1, 1, 'Box', 'New_item1', 200, '08/02/2026', ''],
    ['ExtPO-Reg2', 2, 5000, 'Each', 'BSL & SUB line', 240000, '07/29/2026', '11/29/2026'],
    ['RegTest PO1', 5, 3000, 'Each', 'Test item5', 3000000, '07/29/2026', '11/29/2026'],
    ['RegTest PO1', 4, 3000, 'Each', 'Test item4', 3000000, '07/29/2026', '11/29/2026'],
    ['RegTest PO1', 3, 1000, 'Each', 'Test item3', 1000000, '07/29/2026', '11/29/2026'],
    ['RegTest PO1', 1, 2000, 'Each', 'Test item2', 2000000, '07/29/2026', '11/29/2026'],
    ['8755', 1, 10, 'Box', 'item1', 2000, '07/28/2026', '07/31/2026'],
    ['Test PO3', 2, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'],
    ['Test PO3', 1, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'],
    ['Test PO2', 2, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'],
    ['Test PO2', 1, 1000, 'Each', 'Test item1', 1000000, '07/19/2026', '11/29/2026'],
    ['Test PO1', 1, 1000, 'Each', 'Test item1', 1000000, '07/17/2026', '11/29/2026'],
    ['Test PO1', 2, 1000, 'Each', 'Test item1', 1000000, '07/17/2026', '11/29/2026'],
    ['8736', 1, 30, 'Box', 'cars', 12000, '07/15/2026', ''],
    ['CMIPO9', 1, 1000, 'Each', 'Lenovo ThinkPad T61', 1000000, '07/06/2026', '11/29/2026'],
    ['CMIPO9', 2, 1000, 'Each', 'Lenovo ThinkPad R61i', 1000000, '07/06/2026', '11/29/2026'],
    ['CMIPO8', 1, 500, 'Each', 'Lenovo ThinkPad T61', 500000, '07/06/2026', '11/29/2026'],
    ['CMIPO8', 2, 500, 'Each', 'Lenovo ThinkPad T61', 500000, '07/06/2026', '11/29/2026'],
  ].map(([po, line, qty, uom, item, price, orderDate, needBy], i) => ({ po, line, qty, uom, item, price, orderDate, needBy, spn: 'INP' + (7000 + i), aux: 'INAPM' + (7000 + i), sch: [] })),

};
