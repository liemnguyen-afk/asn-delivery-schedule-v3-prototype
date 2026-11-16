# ASN at PO Delivery Schedule Line Level — v3 flow prototype

Clickable static prototype of the supplier flow on Figma page **ASN at PO Delivery Schedule v3** (`126:27179`), section *ASN at PO Delivery* (`126:29138`), file [544 ASN at PO Delivery Schedule Line Level (INV-CORE)](https://www.figma.com/design/yB6ufERH4q4Ei3aTW4eXMa/544-ASN-at-PO-Delivery-Schedule-Line-Level-INV-CORE?node-id=126-27179).

**▶ Live prototype: https://liemnguyen-afk.github.io/asn-delivery-schedule-v3-prototype/**

Or open `index.html` locally (no build step). It starts on the Orders page.

| Figma frame | What you can do |
| --- | --- |
| CSP - OP Flip to ASN | Orders table. The Create ASN icon on PO 3627 creates the draft (other POs work too, without schedules). |
| Draft ASN | Create Advance Ship Notice with 2 lines. Line 1 has 8 delivery schedule lines, line 2 has none. |
| Delivery Schedules (read-only) | Click the **Delivery Schedules** count or its arrow to open the read-only Delivery Schedules card (Figma `213:99588`): Reference ID, External ID, Quantity, Need By Date, Initiated By, and a Total row. Click again to close. |
| ASN Delivery Schedules | Click the **ASN Delivery Schedules** count or the arrow to open the ASN Delivery Schedules card. Select rows (header checkbox = all), edit ASN Shipped Quantity, delete rows with the trash icon. Total sums the selected rows. Save stays disabled until a row is selected. Each qty must be > 0 and ≤ the schedule line qty. |
| ASN Delivery Schedules added | Save closes the card. The count turns bold (e.g. 4) and Shipped Qty becomes the total. |
| Manage - Add PO Lines | **Manage / Add PO line #** opens the modal. Check lines, then **Add to ASN**: the overlay closes and the lines are added to the ASN. |
| Manage - PO Lines / Delete | **PO Lines Added** tab: check lines, then **Delete**. |
| Manage - Confirm delete | Please Confirm: OK deletes, Cancel keeps. The red ⊗ on a line card uses the same dialog. |

**Submit** checks ASN # and the line quantities, then goes back to Orders with a success banner. The **Prototype ▾** menu (bottom left) jumps to each Figma frame state or resets (`localStorage` key `asnds2.state.v1`).

Files: `css/base.css` (classic CSP styles, shared with the earlier delivery-schedule prototype) + `css/app.css`; `js/data.js`, `js/icons.js`, `js/app.js`; `assets/` holds SVGs exported from Figma (H2 icons, delete line, trash-outline, checkboxes, arrows).
