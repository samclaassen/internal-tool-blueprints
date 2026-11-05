<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/inventory-tracker . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->
# Inventory Tracker

Blueprint BP-019 · Department: Ops · Replaces: Sortly, the stock spreadsheet, "who took the last box?"
For teams of 5 to 50 people who keep supplies or parts in a few places.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We find out we're out of something when someone needs it."

A cleaning company, workshop, clinic or small warehouse keeps supplies in a store room and a few vans or shelves. The stock list is a spreadsheet that is right on the day someone counts and wrong a week later. Nobody records what they take, reorders happen when a shelf is already empty, deliveries arrive without anyone checking them against the order, and the yearly count turns up losses nobody can explain.

This blueprint is a shared stock list with quantities per location, kept current by recording every use, delivery and move as it happens (a phone camera and a QR label make that take seconds). Low stock is flagged before it runs out, purchase orders are received against what was ordered, and regular blind counts correct the numbers with a record of every difference.

## 2. What the real product does

Research basis: Sortly's pricing page and plan comparison table (sortly.com/pricing), October 2026.

What we verified:

1. **Plans and prices.** Free: $0 for 100 unique items, 1 user license and 2 active jobs. Advanced: $49 a month billed monthly, or $24 a month billed yearly ($288), for 500 items and 2 user licenses. Ultra: $149 a month, or $74 a month billed yearly ($888), for 2,000 items and 5 user licenses. Premium: $299 a month, or $149 a month billed yearly ($1,788), for 5,000 items and 8 user licenses. Enterprise: by quote, for 10,000 or more items and 12 or more user licenses.
2. **The yearly prices are introductory.** The page says the 50% discount on yearly plans applies only to the first year of a new subscription; after the first year, yearly plans are 20% off. Paid plans have a 14-day free trial, and a credit card is required to start it.
3. **Features by plan.** Every plan, including Free, has item photos, folders, tags, inventory import, in-app barcode and QR code scanning, offline mobile access and activity history reports. Advanced adds QR label creation, item check-in and check-out, low stock alerts, email alerts and low stock reports. Ultra adds barcode labels, third-party scanner support, purchase orders, pick lists, stock counts, date-based alerts, more reports, and Slack, Microsoft Teams and Amazon Business integrations. Premium adds custom role permissions and QuickBooks Online. API, webhooks and SSO are listed only on Enterprise.
4. **History is limited by plan.** Activity history is kept for 1 month on Free, 1 year on Advanced, 3 years on Ultra and without limit on Premium and Enterprise.

For a team of 10 people who all record stock, the published plans stop at 8 user licenses (Premium), and purchase orders and stock counts start on Ultra (5 user licenses).

### What this blueprint keeps

Items with photos, SKUs, barcodes, units, costs and reorder points; quantities per location; recording use, deliveries, moves between locations and adjustments, each as a permanent movement; low stock alerts that count what is already on order; reorder suggestions grouped by supplier; purchase orders with partial receiving; blind stock counts with variances approved by an admin; QR labels for items and locations; scanning with the phone camera; stock value, low stock and usage reports; a CSV export of every movement.

### What this blueprint deliberately leaves out

An offline mobile app, pick lists, jobs and work orders, checking tools in and out to people (see the Equipment Tracker blueprint), serial numbers, lots and expiry dates, several units of measure per item, sales orders and online store sync, accounting integrations, Amazon ordering, and accounting-grade costing (FIFO or weighted average). USB and Bluetooth barcode scanners that type like a keyboard work in the scan box; dedicated scanner hardware does not get special support.

## 3. Scope of v1

- One company, a handful of locations (a store room, vans, shelves, sites).
- Quantities are whole numbers in each item's unit (bottle, box, case, each). Count in the unit you buy and use; an item has one unit.
- Money in integer cents. Stock value is an estimate using each item's latest unit cost, not an accounting valuation.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- A web app that works well on a phone, because most stock is recorded standing at a shelf.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Owners, office and operations staff | Everything: people, locations, suppliers, items and costs, adjustments, purchase orders, approving counts, reports, settings. |
| Staff | Everyone else | See items and quantities at every location, record use, move stock between locations, receive deliveries against a purchase order, start counts and enter counted quantities. |

Staff never see unit costs, stock values, supplier prices or purchase order totals. The server enforces this, not only the screens.

People sign in with the platform's built-in auth or, where there is none, Google sign-in limited to the company email domain. Every sign-in path, including the development "sign in as" switcher, runs the same check: the address must be at the company email domain (brightside.example in the seed) and match an active Person. Anyone else, including a deactivated person or an address from another domain, sees "Ask an admin to add you." New people must have an address at the domain. People are never deleted, only deactivated; deactivating someone ends their sessions. Admins can't demote or deactivate themselves, and there is always at least one active admin.

## 5. Data model

All IDs are strings. Timestamps in UTC. Times are shown, and "today" and expected dates reckoned, in the company time zone, a setting (UTC in the seed).

**Person**
- id, name, email (unique, lowercase), role: admin | staff, default_location_id, active

**Location**
- id, name (unique), code (unique, up to 12 letters, digits or hyphens, stored in capitals, used in location labels, such as "VAN1"), active

**Supplier**
- id, name, email (required: purchase orders are emailed to it), lead_time_days (0 to 365)

**Item**
- id, sku (unique regardless of case, such as "GC-32"; letters, digits, dots, underscores and hyphens, stored in capitals because labels link to /i/<sku>), name, unit, barcode (optional, unique, no spaces), photo (optional)
- unit_cost_cents, reorder_point, reorder_qty (an item with 0 is never suggested), supplier_id (required), low_alerted (true after a low stock email, until stock rises above the reorder point again), archived

**Movement** (append-only; the on-hand quantity is the sum of movements)
- id, at, item_id, location_id, quantity (positive in, negative out)
- type: opening | receive | use | move | adjust | count
- reason (required for adjust), po_line_id, count_id, transfer_id (joins the two sides of a move), person_id

You may keep a balance table (item, location, quantity) for speed, updated in the same transaction as each movement, but it must always equal the sum of movements.

**PurchaseOrder**
- id, number (PO-0001, sequential), supplier_id, status: draft | sent | partially_received | received | cancelled
- expected_date, sent_at, closed_short (true when an admin closes it with quantities outstanding), notes, created_by

**POLine**
- id, po_id, item_id, qty_ordered, qty_received, unit_cost_cents

**Count**
- id, number (C-0001, sequential), location_id, status: open | submitted | approved | cancelled, started_at, started_by, submitted_by, approved_by

**CountLine**
- count_id, item_id, expected (on hand when the count started), counted (empty until entered), changed_during_count

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error; the time each email was written is recorded with it and shown on the Outbox.

## 6. Recording stock

| Action | Who | Movement | Rule |
|---|---|---|---|
| Use | Anyone | One negative "use" movement at a location | Refused if the location would go below zero |
| Move | Anyone | A negative and a positive "move" movement with the same transfer_id | Both sides in one transaction; refused if the source would go below zero |
| Receive | Anyone | One positive "receive" movement per purchase order line received | Section 7 |
| Adjust | Admins | One movement with a reason: Damaged, Lost, Found, Correction or Opening balance; the admin enters a signed change (-2 removes two; 0 is refused). Damaged and Lost only remove, Found only adds, Correction and Opening balance go either way | Refused below zero, with R1's message |
| Count | Admins approve | One "count" movement per line with a difference | Section 8, R7 |

### Worked examples (seed data in section 14, applied in order)

| Action | Result |
|---|---|
| Tom uses 2 bottles of glass cleaner at Van 2 | Van 2 goes from 2 to 0; the total goes from 13 to 11, at or below the reorder point of 12, so Dana and Marco get one email: "Low stock: Glass cleaner, 32 oz (11 left, reorder at 12)". |
| Tom uses 1 case of trash bags at Van 2 | Refused: "Only 0 on hand at Van 2." |
| Marco moves 4 bottles of glass cleaner from the Store room to Van 2 | Store room 8 to 4, Van 2 0 to 4; the total stays 11 and no email is sent. |
| Dana opens Reorder suggestions | Glass cleaner, 24 bottles from ProClean Wholesale, $102.00. Nitrile gloves are low (7) but not suggested, because 20 are already on order. |

## 7. Purchase orders

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create (blank or from suggestions) | Admin | | draft | Suggestions make one draft per supplier from the ticked suggestions (rechecked on the server) with each item's reorder quantity and current unit cost. Numbers run one above the highest; a cancelled order keeps its number |
| Edit lines | Admin | draft | draft | Change quantities and unit costs, add and remove lines (one line per item), edit notes; the supplier can't change |
| Send | Admin | draft | sent | Email to the supplier with lines and total; expected date defaults to today plus the supplier's lead time; the admin can change it when sending, but not to a past date, and it is fixed once sent |
| Receive | Anyone | sent or partially_received | partially_received or received | Received quantities go into a chosen location (default Store room); each line's box starts at 0, and one receipt goes into one location (receive twice to split a delivery); received when every line is complete |
| Close short | Admin | partially_received | received | Outstanding quantities are cancelled; closed_short set |
| Cancel | Admin | draft or sent with nothing received | cancelled | Supplier emailed if the order had been sent |

Receiving more than is outstanding on a line is refused: "Ordered 8, 0 received; you can receive up to 8." A receipt is all or nothing: if any line is refused, nothing on it is recorded. Extra units that arrive anyway are recorded by an admin as an adjustment with the reason Found.

## 8. Business rules

- **R1. No negative stock.** No movement may take a location below zero. Check and write in one transaction so two people taking the last unit at the same moment cannot both succeed; the second gets "Only 0 on hand at Van 2."
- **R2. Movements are permanent.** Movements and events are never edited or deleted. Mistakes are corrected by an adjustment with a reason.
- **R3. On order.** An item's on-order quantity is the outstanding quantity on its sent and partially received purchase orders.
- **R4. Low stock.** An item is low when its total on hand across locations is at or below its reorder point. The first time it becomes low, every active admin gets one email and low_alerted is set; nothing more is sent until the total rises above the reorder point, which clears low_alerted. The rule runs after every use, move, adjustment, receipt and count, and when an admin changes the reorder point; a new item with no stock is not low until its first movement.
- **R5. Reorder suggestions.** Suggest an item when on hand plus on order is at or below the reorder point; the suggested quantity is the item's reorder quantity, at its current unit cost. An item already on a draft is still suggested, marked "on draft PO-0008" and unticked.
- **R6. Unit cost.** Receiving a purchase order line sets the item's unit cost to that line's unit cost. Stock value is quantity times the current unit cost.
- **R7. Counts.** An admin or staff member starts a count for one location; each line records the on-hand quantity at that moment as expected. A count lists every active item that has ever had stock at the location, including those now at 0, and the counter can add an item found there. Counts are blind: counters never see expected quantities. While a count is open nobody sees them on the count screens, admins included; admins see them once it is submitted, and staff never do (on the screens or through any data request). Lines whose item has any movement at that location recorded after the count started are flagged "Changed during count" (the flag stays) and must be recounted or confirmed by the approver: Recount replaces the counted number with what is there now, and Confirm keeps it (the counter counted after the change). Either covers changes up to that moment; a later movement needs another. On approval, each line with a difference posts one count movement of counted minus the current on-hand quantity. Approval is refused at an inactive location, or when an archived item's count differs. Count movements are dated at approval and recorded against the approver.
- **R8. Archiving.** Items are archived, never deleted, and only when they have nothing on hand at any location and nothing on order (draft orders don't count). An admin can restore an archived item. Locations can be deactivated only when empty and when they are no active person's default location.
- **R9. Visibility.** Staff never see costs, values or purchase order totals (section 4). They do see supplier names, reorder points and reorder quantities. Every page and data response is shaped on the server, and a staff request for an admin-only page, action or field (such as an item's cost) is refused with 403.
- **R10. Units.** An item's unit cannot change once it has any movement, opening balances included (the server refuses it); create a new item instead.

## 9. Screens

1. **Items** (home). Search by name, SKU or barcode; filter by location (the items with stock there, with their quantity at that location), supplier and low stock. Each row: photo, name, SKU, total on hand and unit, a "Low" badge with the on-order quantity ("Low", then "20 on order" when anything is on order; archived items are never low), and (admins) value.
2. **Item page.** Photo, details, quantity at each location, on order, and the full movement history. Buttons: Use and Move for everyone; Adjust and Edit for admins. On a phone, Use defaults to the person's default location with a quantity stepper. Use starts at the location the person came from (a location page or ?location=CODE), then their default location, then the Store room (Dana and Marco have no default location); Move's destination starts blank.
3. **Location page** (opened from a location label). Every item with stock at that location, with its quantity and a one-tap Use; items that have had stock there but are now at 0 are listed under "None left here". One-tap Use records 1 unit without asking, and a double tap is not recorded twice.
4. **Scan.** Opens the camera and reads QR codes and common barcodes (UPC, EAN, Code 128) using a scanning library or the browser's barcode detector, with a text box for typing or a keyboard-style scanner. A match on barcode or SKU opens the item; a location code opens the location. Matches are tried in this order: one of the app's label links, a barcode (exact), a SKU, a location code; SKUs and codes ignore case. Where the browser can't read codes from the camera, the page says so and the text box still works (the phone's own camera app still opens QR labels).
5. **Purchase orders** and **Reorder suggestions** (admins), with Receive available to everyone on sent orders. Staff see a list of orders waiting for delivery and can open sent, partially received and received orders without costs or totals; drafts and cancelled orders are admin-only.
6. **Counts.** Start, enter quantities (blind), submit; admins review variances in units and value and approve. The variance is counted minus on hand now (what approval posts), valued at the current unit cost, with expected shown beside it. Submitting needs a number on every line (blank is not 0); the counter can save partial work first. Anyone can submit; any admin can approve, including one who also counted. An admin can cancel an open or submitted count, and whoever started a count can cancel it while it is open; nothing is posted.
7. **Reports** (admins): stock value by location (active locations, plus any inactive one still holding stock) and by supplier (each item's current supplier), low stock with on order, usage by item over the last 30 or 90 days (only use movements, in the 30 or 90 days up to now on the app clock), movement export.
8. **Labels**, **Locations**, **Suppliers**, **People**, **Settings** and **Outbox** (admins). On Labels an admin ticks the items and locations to print (every active one is ticked at first) and sets the number of copies of each.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Item becomes low (R4) | Every active admin | "Low stock: Glass cleaner, 32 oz (11 left, reorder at 12)" (quantity at each location, on order, reorder quantity and supplier, a link to the item; no costs) |
| Purchase order sent | Supplier | "Purchase order PO-0008 from Brightside Cleaning Co." (lines, quantities, unit costs, total, expected date, order date, a request to quote the PO number, and the sending admin as the contact) |
| Purchase order cancelled after sending | Supplier | "Cancelled: purchase order PO-0008" (the lines, without prices) |
| Purchase order past its expected date and not fully received | The admin who created it | "PO-0007 from ProClean Wholesale is overdue" (once, on the first daily job run on a day after the expected date in the company time zone; on the expected date itself it is not overdue; if the creator is no longer an active admin, every active admin gets it) |
| Count submitted | Every active admin | "Count C-0001 at Van 1 is ready to review (2 differences)", or "(1 difference)" and "(no differences)" (who submitted, each difference in units and value, changed lines, a link) |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job (protected by a CRON_SECRET header: /cron/daily, GET or POST, with the secret in Authorization: Bearer or X-Cron-Secret; called once a day by an outside scheduler; turned off when CRON_SECRET isn't set) sends overdue reminders and retries failed emails (every failed email is requeued on each run). A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so overdue purchase orders and usage windows can be tested by moving the clock. The development clock moves forward by days and hours; only "Reset to seed data" sets it back, and moving it doesn't sign anyone out.

## 12. Labels, scanning and export

- **Item labels** show the name, SKU and a QR code for the item's page URL (/i/<sku>). **Location labels** show the location name and a QR code for /l/<code>. QR codes encode the app's public address (an APP_URL setting, or the address the Labels page was opened on when it isn't set). Both print on US Letter sheets of 30 labels (3 columns by 10 rows, the common 1 by 2⅝ inch address label size: the Avery 5160 layout, with a 0.5 inch top margin, 3/16 inch side margins and 1/8 inch between columns). Any phone camera opens these links; the person must be signed in, and someone signed out lands on the label's page after signing in.
- The **movement export** is a CSV of every movement: date and time, SKU, item, location, type, quantity, person, reason, purchase order number, count number. It is UTF-8, oldest first, one row per movement (a move is two rows, one per location), with signed quantities, the stored type (opening, receive, use, move, adjust, count) and times as "YYYY-MM-DD HH:MM:SS" in the company time zone, named in the header; text starting with =, +, - or @ gets a leading apostrophe so a spreadsheet can't run it.

## 13. Edge cases

- Two people use the last unit at the same moment: one succeeds and the other is refused (R1).
- A move where the destination is the same as the source is refused.
- Receiving into an inactive location is refused, and so are use, move and adjust at an inactive location or on an archived item.
- A count is started at a location while another count there is open or submitted: refused, with a link to that count.
- An item with stock on order cannot be archived: "PO-0007 has 20 on order."
- An item's unit cost changes on receipt: the value of all its on-hand units changes with it (R6); the item page shows the previous cost in its history. Admins see a "Unit cost changes" table on the item page from Phase 1: date, old and new cost, and source (an edit, or the purchase order that changed it).
- A scanned barcode matches nothing: offer "Create item with this barcode" to admins and "No item has this barcode" to staff.

## 14. Seed data

Company "Brightside Cleaning Co.", a commercial cleaning business. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@brightside.example): Dana Reyes (admin, owner), Marco Silva (admin, operations), Priya Shah (staff, default location Van 1), Tom Bell (staff, default location Van 2).

Locations: Store room (STORE), Van 1 (VAN1), Van 2 (VAN2).

Suppliers: ProClean Wholesale (orders@proclean.example, lead time 5 days), Metro Paper Co. (sales@metropaper.example, lead time 7 days).

| SKU | Item | Unit | Unit cost | Reorder at | Reorder qty | Supplier | Store room | Van 1 | Van 2 | Total |
|---|---|---|---|---|---|---|---|---|---|---|
| GC-32 | Glass cleaner, 32 oz (barcode 012345678905) | bottle | $4.25 | 12 | 24 | ProClean | 8 | 3 | 2 | 13 |
| GL-M | Nitrile gloves, medium, box of 100 | box | $9.80 | 10 | 20 | ProClean | 4 | 2 | 1 | 7 |
| DS-1G | Disinfectant concentrate, 1 gal | jug | $22.75 | 4 | 8 | ProClean | 6 | 1 | 1 | 8 |
| MF-24 | Microfiber cloths, pack of 24 | pack | $18.00 | 6 | 12 | ProClean | 10 | 2 | 2 | 14 |
| MH-01 | Mop head | each | $7.50 | 10 | 20 | ProClean | 12 | 3 | 3 | 18 |
| VB-10 | Vacuum bags, pack of 10 | pack | $14.20 | 4 | 8 | ProClean | 5 | 1 | 0 | 6 |
| TB-33 | Trash bags, 33 gal, case of 250 | case | $38.50 | 3 | 6 | Metro Paper | 5 | 1 | 0 | 6 |
| PT-12 | Paper towels, case of 12 rolls | case | $31.00 | 3 | 6 | Metro Paper | 2 | 1 | 1 | 4 |

Stock value: Store room $805.20, Van 1 $197.30, Van 2 $130.55, total $1,133.05. Nitrile gloves are the only low item (7, reorder at 10); their low stock email has already gone out, so low_alerted is set; that email is not in the outbox, which starts empty.

Purchase orders:
- PO-0006, Metro Paper Co., created and sent by Dana 16 days ago and received by her 9 days ago into the Store room: trash bags 6 cases at $38.50 and paper towels 6 cases at $31.00, total $417.00.
- PO-0007, ProClean Wholesale, created and sent by Marco 2 days ago, expected in 5 days (Marco changed the default expected date when he sent it): nitrile gloves 20 boxes at $9.80 and vacuum bags 8 packs at $14.20, total $309.60, nothing received.

Movement history: an opening balance for each item and location 45 days ago (recorded by Dana), the PO-0006 receipt, moves by Marco 8 days ago from the Store room (1 case of trash bags to Van 1; 1 case of paper towels to Van 1 and 3 to Van 2), and "use" movements by Priya at Van 1 and Tom at Van 2 spread over the last 28 days, totalling glass cleaner 18, nitrile gloves 9, mop heads 6, disinfectant 5, microfiber cloths 4, vacuum bags 3, paper towels 3 and trash bags 2. Choose the opening balances so the quantities come out exactly as in the table; where a location starts empty its opening balance is 0 (opening balances are the only movements that may be 0).

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start the checks of Phases 1, 2 and 4 from a fresh load of the seed (the reset button); Phase 3's checks continue from the end of Phase 2's. Checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Inventory Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build People, Locations, Suppliers and Items (create, edit, photo upload, archive with R8 and R10), the Items list and the Item page (section 9, screens 1 and 2) without the Use, Move and Adjust buttons, enforcing R9 on the server.
4. Load the seed data from section 14, with dates relative to today, including the movement history.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock back to the real time), all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Items lists the eight seed items with their totals; nitrile gloves show a Low badge with "20 on order".
- [ ] Glass cleaner's page shows Store room 8, Van 1 3 and Van 2 2, and a movement history that adds up to 13.
- [ ] Signed in as Tom, unit costs and values appear nowhere, and a direct request for an item's cost is refused.
- [ ] Creating another item with SKU GC-32 is refused as a duplicate, and archiving the mop heads is refused because 18 are on hand.

### Phase 2: Recording stock, alerts, labels and scanning

```
Using the Inventory Tracker blueprint above, build Phase 2 only.

1. Add Use, Move and Adjust (section 6) on the Item and Location pages, with R1, R2 and R4, all on the server.
2. Write the low stock email (section 10) to the outbox and build the Outbox screen.
3. Build the Labels screen and the Location page (section 12 and section 9, screen 3), and the Scan screen (screen 4).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Tom, using 2 bottles of glass cleaner at Van 2 leaves Van 2 at 0 and the total at 11, and puts exactly one low stock email each for Dana and Marco in the outbox; using 1 more at Van 1 sends no further email.
- [ ] Tom using 1 case of trash bags at Van 2 is refused with "Only 0 on hand at Van 2."
- [ ] Marco moving 4 bottles of glass cleaner from the Store room to Van 2 leaves Store room 4 and Van 2 4, with one move in the history showing both locations.
- [ ] Marco adjusting the mop heads in the Store room by minus 2 with the reason Damaged leaves 16 in total; Tom has no Adjust button, and a direct adjust request from him is refused.
- [ ] The label sheet prints item labels with QR codes three across; opening a label's link signed in as Priya shows the item with Use set to Van 1.
- [ ] Typing 012345678905 into the Scan screen opens glass cleaner, and typing VAN1 opens the Van 1 page.

### Phase 3: Purchase orders

```
Using the Inventory Tracker blueprint above, build Phase 3 only.

1. Build Purchase orders and Reorder suggestions (section 7 and section 9, screen 5) with R3, R5 and R6.
2. Write the purchase order emails and the overdue reminder (section 10) to the outbox, with the daily job.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (continue from the end of the Phase 2 checks)
- [ ] After the Phase 2 checks, Reorder suggestions list glass cleaner, 24 bottles from ProClean Wholesale at $102.00, and do not list nitrile gloves; creating the draft makes PO-0008.
- [ ] Sending PO-0008 emails orders@proclean.example with the line and the total and sets the expected date 5 days ahead.
- [ ] Receiving 20 boxes of gloves on PO-0007 into the Store room leaves 24 there and 27 in total, clears the Low badge, and marks PO-0007 partially received.
- [ ] Receiving 10 packs of vacuum bags on PO-0007 is refused with "Ordered 8, 0 received; you can receive up to 8."; receiving 8 marks PO-0007 received.
- [ ] Receiving all of PO-0008 takes glass cleaner to 34 and clears its Low badge; recording use until it is at 12 again sends a new low stock email.
- [ ] After a reset, moving the clock 6 days ahead and running the daily job puts one overdue email to Marco about PO-0007 in the outbox; running the job again adds nothing.

### Phase 4: Counts and reports

```
Using the Inventory Tracker blueprint above, build Phase 4 only.

1. Build Counts (section 9, screen 6) with R7, and the count submitted email.
2. Build Reports and the movement export (section 9, screen 7, and section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] After a reset, the value report shows Store room $805.20, Van 1 $197.30, Van 2 $130.55 and a total of $1,133.05.
- [ ] Priya starts a count at Van 1 and never sees expected quantities; she enters microfiber cloths 1, nitrile gloves 3 and the seed quantity for everything else, and submits.
- [ ] Dana sees two differences: microfiber cloths minus 1 (minus $18.00) and nitrile gloves plus 1 (plus $9.80); approving posts two count movements and Van 1's value becomes $189.10.
- [ ] In a second count at Van 1, using 1 disinfectant there before approval flags that line "Changed during count", and approval waits until Dana recounts or confirms it.
- [ ] The usage report for the last 30 days shows 18 bottles of glass cleaner used, and the movement export includes every movement with its type, person and any purchase order or count number.

## 16. Variations

- Days of cover: on hand divided by average daily use, with a warning when cover is shorter than the supplier's lead time.
- Pick lists for jobs, deducting stock when the job is completed.
- Lots and expiry dates for medical or food supplies.
- Check tools in and out to people (see the Equipment Tracker blueprint).
- Sync purchase orders and supplier bills to your accounting system.
- Several units per item (buy by the case, use by the bottle).

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser, resetting to the seed data before the checks of Phases 1, 2 and 4 (Phase 3's checks continue from Phase 2's, as section 15 says). Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. The label sheet was rendered for printing and one label's QR code was decoded and opened, emails were read on the Outbox screen, the daily job was run from the development control with the development clock, and the movement export was downloaded, parsed and matched against every item's history.

**Result:** 21 of 21 acceptance checks passed in one final browser run on a fresh database, plus 137 automated tests. The item-by-item results are in [acceptance-results.json](/builds/inventory-tracker/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. Sign-in with "the platform's built-in auth or Google sign-in" didn't say what to do on a host with no built-in auth. Section 4 now says Google sign-in limited to the company domain is enough, and every sign-in path, the development switcher included, runs the same check.
2. Sign-in was limited to "our company email domain", but no setting held the domain. The seed now names brightside.example, and an address from any other domain sees "Ask an admin to add you." like an unknown or inactive one.
3. Nothing protected the last admin or said what deactivating someone does. Admins can't demote or deactivate themselves, there is always an active admin, and deactivating someone ends their sessions.
4. The seed history could not produce the seed table: the Store room receives PO-0006's 6 trash bags and 6 paper towels yet must end at 5 and 2, while all use happens in the vans. The history now includes the moves that restock the vans 8 days ago.
5. The seed's history of "an opening balance for each item and location" didn't say what to record where a location starts empty. An opening balance of 0 is recorded too, and opening balances are the only movements that may have a quantity of 0.
6. PO-0007 was sent 2 days ago to a supplier with a 5-day lead time, which gives an expected date 3 days away, yet the seed says "expected in 5 days". The seed now says the expected date was changed by hand when it was sent.
7. PO-0006 had no creator or sent date, and the openings had no person. Dana created and sent PO-0006 16 days ago and recorded the opening balances and the receipt.
8. The gloves' earlier low stock email had "already gone out", which could put a seed email in the outbox and break Phase 2's check of exactly one low stock email each for Dana and Marco. The seed now keeps the outbox empty and records only low_alerted.
9. Dana and Marco had no default location, so Use had nowhere to start for them. Admins have none, and Use starts at a location chosen on the page (the label's or location page's), then the person's default location, then the Store room; Move's destination starts blank.
10. The outbox record had no timestamp, so the Outbox couldn't show when an email was written. The time each email was written is now recorded with it and shown on the Outbox.
11. No time zone was named for "today", expected dates and times on screen. The company time zone is a setting (UTC in the seed), and stored times stay UTC.
12. SKUs, location codes and barcodes had no format, though SKUs and codes go into label URLs. SKUs are letters, digits, dots, underscores and hyphens, unique regardless of case and stored in capitals; codes are up to 12 letters, digits or hyphens; barcodes have no spaces.
13. Nothing said which supplier and item fields are required. A supplier needs an email (orders are emailed to it) and a lead time of 0 to 365 days; every item needs a supplier and a unit cost, and an item with a reorder quantity of 0 is never suggested.
14. Screen 1 didn't say what the Low badge shows when nothing is on order, or whether archived items can be low. The badge reads "Low", followed by the on-order quantity (such as "20 on order") when anything is on order, and archived items are never low.
15. The location filter could mean items stocked anywhere or items stocked there. It shows the items with stock at that location, with their quantity there.
16. R9 listed what staff never see but not what they do see. Staff see supplier names, reorder points and reorder quantities.
17. The check's "direct request for an item's cost" named no endpoint, and the spec had no API. R9 now says every page and data response is shaped on the server, and any staff request for an admin-only page, action or field gets 403.
18. Archiving had no undo, and R8 didn't say whether a draft order blocks it. Draft orders don't block archiving (only sent and partially received ones count as on order), and an admin can restore an archived item.
19. A location could be deactivated while it was still someone's default location. That is now refused too.
20. R10 didn't say whether opening balances lock an item's unit. Any movement does, opening balances included, and the server refuses the change.
21. Section 13 says the item page shows the previous cost, but cost changes on receipt arrive in Phase 3 and nothing said where manual edits appear. Admins now see a "Unit cost changes" table from Phase 1, with each change's date, old and new cost and source (an edit or a purchase order).
22. R4 didn't say what happens when an admin edits the reorder point. The same rule runs after an edit: raising the total above the point clears low_alerted, and dropping the point to or below the total sends the email.
23. The development clock's controls weren't defined. It moves forward by days and hours, only "Reset to seed data" sets it back, and moving it doesn't sign anyone out.
24. Section 12 says a label opens for a signed-in person but not what happens to someone signed out. They sign in and land on the label's page.
25. Adjust didn't say whether the admin enters a change or a new quantity. It is a signed change (-2 removes two), zero is refused, and a negative change gets R1's message.
26. Nothing tied a reason to a direction, so "Found" could remove stock. Damaged and Lost only remove, Found only adds, and Correction and Opening balance go either way.
27. Only receiving into an inactive location was refused. Use, move and adjust are now refused at an inactive location and for an archived item.
28. "Every item at that location" didn't say whether items that have run out there are listed. Items with stock are listed with a one-tap Use; items that have had stock there but are at 0 are listed under "None left here".
29. The location page's "one-tap Use" didn't say how many units it records or whether it asks first. It records 1 unit with no confirmation, and a double tap is not recorded twice.
30. "Every admin" could include deactivated admins. Low stock and count emails go to every active admin.
31. Section 10 gave the low stock email's subject but no body. The body lists the quantity at each location, what is on order, the reorder quantity and supplier, and a link to the item, with no costs.
32. Nothing said which address the QR codes encode. They use the app's public address (an APP_URL setting), or the address the Labels page was opened on when it isn't set.
33. The label size, "the common 1 by 2⅝ inch address label size", gave no margins. The sheet now uses the Avery 5160 layout: 0.5 inch top margin, 3/16 inch side margins, 1/8 inch between columns.
34. The Labels screen had no controls. An admin ticks the items and locations to print (all active ones ticked by default) and the number of copies of each.
35. Scan didn't say what wins when a typed code could be a barcode, a SKU and a location code. It matches a label link, then a barcode, then a SKU, then a location code, ignoring case for SKUs and codes.
36. The camera depends on a barcode library or the browser's barcode detector, which iPhones lack. Where the browser can't read the camera, the Scan page says so and the text box still works.
37. Screen 5 put Purchase orders under admins, but anyone can receive. Staff now see the orders waiting for delivery and can open sent, partially received and received orders without costs; drafts and cancelled orders are admin-only.
38. R5 counts only sent orders as on order, so an item already on a draft was suggested again. It still is, marked "on draft PO-0008" and unticked.
39. Creating drafts from suggestions didn't say which suggestions or how numbers run. The admin ticks suggestions, the server rechecks them, and numbers run one above the highest; a cancelled order keeps its number.
40. "Edit lines" didn't say what can change. On a draft an admin changes quantities and unit costs, adds and removes lines (one line per item) and edits notes; the supplier can't change.
41. Section 7 gave the expected date a default but didn't say whether it can be changed. The admin can change it when sending, but not to a past date, and it is fixed once sent.
42. The purchase order email had no layout beyond its contents. It also gives the order date, asks the supplier to quote the PO number, and names the sending admin as the contact; the cancellation email lists the lines without prices.
43. The receive form wasn't described. Each line has a box that starts at 0, and one receipt goes into one location; to split a delivery, receive twice.
44. Nothing said what happens to the other lines of a receipt when one is refused. A receipt is all or nothing.
45. An overdue reminder "after the expected date" left the expected date itself unclear, and a check moves the clock 6 days for a 5-day order. An order is overdue from the day after its expected date in the company time zone.
46. The overdue reminder had nowhere to go if the admin who created the order was deactivated. It goes to every active admin.
47. A daily job "protected by a CRON_SECRET header" named no endpoint or header and no scheduler. It is /cron/daily, GET or POST, with the secret in Authorization: Bearer or X-Cron-Secret, called once a day by an outside scheduler, and turned off when CRON_SECRET isn't set.
48. The daily job "retries failed emails" with no rule. The job requeues every failed email on each run.
49. "Counts are blind: counters never see expected quantities" didn't say whether an admin counting is blind too. Nobody sees expected quantities on a count while it is open; admins see them only after it is submitted, and staff never do.
50. R7 didn't say which items a count lists. It lists every active item that has had stock at the location, those now at 0 included, and the counter can add an item found there.
51. Only an open count blocked a new count, so a submitted count awaiting review didn't, and approving both would correct the same stock twice. A submitted count blocks one too.
52. Flagging a movement "after the count started" didn't say what counts as after or whether a flag clears. Any movement of the item at that location recorded after the start flags the line, and the flag stays.
53. A flagged line that "must be recounted or confirmed by the approver" didn't say what each does. Recount replaces the counted number with what is there now; Confirm keeps the counted number because it was counted after the change; either covers changes up to that moment.
54. Screen 6 showed "variances" while R7 posts counted minus the current on hand, which differ when stock moved during the count. The difference on review is counted minus on hand now, valued at the current unit cost, with expected shown beside it.
55. Submitting didn't say whether every line needs a number. Every line does, a blank is not 0, and the counter can save partial work first.
56. Nothing said who can submit or approve. Anyone can submit; any admin can approve, including one who counted.
57. The count email's "(2 differences)" had no singular or zero form and no body. It reads "(1 difference)" and "(no differences)", goes to every active admin, and lists each difference in units and value.
58. The count status cancelled had no action. An admin can cancel an open or submitted count, and whoever started it can cancel it while it is open; nothing is posted.
59. Approval could post stock to an inactive location or change an archived item. Both are refused.
60. Count movements had no date or person. They are dated at approval and recorded against the approver.
61. The value reports didn't say whether an inactive location or an item's past supplier counts. By location covers active locations and any inactive one still holding stock; by supplier uses each item's current supplier.
62. Usage "over the last 30 or 90 days" didn't say what counts as usage or where the window ends. Only use movements count, and the window is the 30 or 90 days up to now on the app clock.
63. The export format left out how a move appears, the quantity's sign, the time format and spreadsheet safety. A move is two rows, quantities are signed, times are "YYYY-MM-DD HH:MM:SS" in the company time zone (named in the header), and text starting with = + - or @ gets a leading apostrophe.

**What we did not test:**
- Production sign-in. Google sign-in limited to the company domain was built, but every check used the development "sign in as" switcher.
- Sending email. Low stock, purchase order, overdue and count emails were logged in the outbox, not delivered.
- The daily job on a real scheduler. It was run from the development control and the cron endpoint with the development clock.
- Hosting. The checks ran on localhost, not on a public https address that phones can reach.
- Phone cameras and barcode scanners. Codes were typed into Scan, and one QR code was decoded by software from the rendered label sheet, not scanned from a printed label.
- Printing on real label stock. The sheet was checked as a one-page US Letter PDF with three labels across.
- Two people taking the last unit at the same moment. The build's own tests cover it with two database connections; no browser check did.
- Spec fixes that no acceptance check covers, such as restoring an archived item, cancelling a count, CSV formula guarding and a deactivated admin's reminders. The test build handles them through its own choices.
