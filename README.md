# ASN at PO Delivery Schedule Line Level — v3 e2e prototype

Clickable static prototype of the end-to-end flow on Figma page **ASN at PO Delivery Schedule v3** (`126:27179`) in [544 ASN at PO Delivery Schedule Line Level (INV-CORE)](https://www.figma.com/design/yB6ufERH4q4Ei3aTW4eXMa/544-ASN-at-PO-Delivery-Schedule-Line-Level-INV-CORE?node-id=126-27179). A **supplier** creates an ASN and picks delivery schedule lines (section *ASN at PO Delivery*, `126:29138`). A **buyer** receives it (section *Buyer - ASN Receipt*, `222:102215`).

**▶ Live prototype: https://liemnguyen-afk.github.io/asn-delivery-schedule-v3-prototype/**

Or open `index.html` locally (no build step). It starts on the supplier's Orders page. Dates are MM/DD/YYYY.

## Supplier (Coupa Supplier Portal)

| Figma frame | Route | What you can do |
| --- | --- | --- |
| CSP - OP Flip to ASN | `#/orders` | The **Create ASN** icon on PO 3627 creates the draft. Other POs work too, without schedules. |
| Draft ASN | `#/asn` | Create Advance Ship Notice with 2 lines: **3853 / 1** Dell Laptop (8 delivery schedules, shows **0 of 8 selected**, Shipped Qty 80) and **3627 / 2** Wireless Keyboard and Mouse (no schedules). |
| Delivery Schedules | | Click **0 of 8 selected** to open the Delivery Schedules card: Reference ID, Quantity, **Shipped Qty** (editable), Need By Date, Initiated By, and Total. Select rows; the header checkbox selects all. Typing a Shipped Qty selects that row. Save is disabled until a row is selected. Each Shipped Qty must be > 0 and ≤ the open schedule qty. |
| Select / ASN Delivery Schedules added | | **Save** closes the card. The line shows e.g. **4 of 8 selected**, and Shipped Qty becomes the selected total (40). |
| Manage - Add PO Lines (nested lines) | | **Manage / Add PO line #** opens the overlay. Lines with delivery schedules expand into a nested, selectable **Schedule Line #** table: Need By, Schedule Qty, Shipped, Remaining, UOM. Fully shipped schedule lines are disabled. Lines already on the ASN are pre-checked, with their selected schedules. Picking some schedules makes the PO line indeterminate. The summary reads e.g. "2 ASN lines will be added · 3853 / 1 with 4 of 8 schedule lines". The overlay is capped at the window height: the PO-lines table scrolls inside it under a sticky header row, and the scroll position stays put when you tick or expand lines. **Add to ASN** closes the overlay and syncs the ASN: checked lines are added or updated, unchecked ones are removed. |
| Manage - PO Lines / Delete / Confirm delete | | **PO Lines Added** tab: check lines, **Delete**, then Please Confirm: OK or Cancel. The red ⊗ on a line card uses the same dialog. |

**Submit** checks ASN # and the line quantities, then returns to Orders with a banner. The banner has a link to the buyer's Receive page.

## Buyer (Coupa · Inventory)

| Figma frame | Route | What you can do |
| --- | --- | --- |
| Receive — ASN Lines | `#/buyer/receive` | The submitted ASN comes first (highlighted). **ASN Schedule Line #** shows the line numbers (1, 2, 3…) of the schedules picked on that ASN line, next to **Schedule Line Need By**. Quick Receipts: type a qty or tick *All*, then **Receive**. The box icon opens the detailed receipt. The blue ⟩⟨ button collapses or expands the table. |
| ASN Detailed Receipt | `#/buyer/receive/detail/…` | Quantity, Action (Receive to inventory needs a Warehouse), and the ASN Line table with ASN Schedule Line #. Submit creates the receipt. |
| View Receipts | `#/buyer/receipts` | New receipts come first, with ASN Schedule Line #. The Created Date link opens the receipt. |
| View Receipt | `#/buyer/receipts/<id>` | Receipt details and the PO Line table with ASN Schedule Line #. |

## Prototype menu

The **Prototype ▾** button (bottom left) is a reviewer tool, not product UI. It jumps to each Figma frame state, loads a submitted sample ASN (ASN-3627-01), or resets the prototype (`localStorage` key `asnds2.state.v2`).

Files: `css/base.css` (classic CSP / Coupa styles, shared with the earlier delivery-schedule prototype) + `css/app.css`; `js/data.js` (sample PO lines, schedules, buyer rows), `js/icons.js`, `js/app.js`; `assets/` holds SVGs exported from Figma. Sample values that aren't in Figma, such as the schedule dates, prices and the supplier name, are placeholders.
