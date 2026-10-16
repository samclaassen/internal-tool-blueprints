<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/inventory-tracker . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

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

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Person**
- id, name, email (unique, lowercase), role: admin | staff, default_location_id, active

**Location**
- id, name (unique), code (short, unique, used in location labels, such as "VAN1"), active

**Supplier**
- id, name, email, lead_time_days

**Item**
- id, sku (unique, such as "GC-32"), name, unit, barcode (optional, unique), photo (optional)
- unit_cost_cents, reorder_point, reorder_qty, supplier_id, low_alerted (true after a low stock email, until stock rises above the reorder point again), archived

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

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Recording stock

| Action | Who | Movement | Rule |
|---|---|---|---|
| Use | Anyone | One negative "use" movement at a location | Refused if the location would go below zero |
| Move | Anyone | A negative and a positive "move" movement with the same transfer_id | Both sides in one transaction; refused if the source would go below zero |
| Receive | Anyone | One positive "receive" movement per purchase order line received | Section 7 |
| Adjust | Admins | One movement with a reason: Damaged, Lost, Found, Correction or Opening balance | Refused below zero |
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
| Create (blank or from suggestions) | Admin | | draft | Suggestions make one draft per supplier with each item's reorder quantity and current unit cost |
| Edit lines | Admin | draft | draft | |
| Send | Admin | draft | sent | Email to the supplier with lines and total; expected date defaults to today plus the supplier's lead time |
| Receive | Anyone | sent or partially_received | partially_received or received | Received quantities go into a chosen location (default Store room); received when every line is complete |
| Close short | Admin | partially_received | received | Outstanding quantities are cancelled; closed_short set |
| Cancel | Admin | draft or sent with nothing received | cancelled | Supplier emailed if the order had been sent |

Receiving more than is outstanding on a line is refused: "Ordered 8, 0 received; you can receive up to 8." Extra units that arrive anyway are recorded by an admin as an adjustment with the reason Found.

## 8. Business rules

- **R1. No negative stock.** No movement may take a location below zero. Check and write in one transaction so two people taking the last unit at the same moment cannot both succeed; the second gets "Only 0 on hand at Van 2."
- **R2. Movements are permanent.** Movements and events are never edited or deleted. Mistakes are corrected by an adjustment with a reason.
- **R3. On order.** An item's on-order quantity is the outstanding quantity on its sent and partially received purchase orders.
- **R4. Low stock.** An item is low when its total on hand across locations is at or below its reorder point. The first time it becomes low, every admin gets one email and low_alerted is set; nothing more is sent until the total rises above the reorder point, which clears low_alerted.
- **R5. Reorder suggestions.** Suggest an item when on hand plus on order is at or below the reorder point; the suggested quantity is the item's reorder quantity, at its current unit cost.
- **R6. Unit cost.** Receiving a purchase order line sets the item's unit cost to that line's unit cost. Stock value is quantity times the current unit cost.
- **R7. Counts.** An admin or staff member starts a count for one location; each line records the on-hand quantity at that moment as expected. Counts are blind: counters never see expected quantities. Lines whose item has a movement at that location after the count started are flagged "Changed during count" and must be recounted or confirmed by the approver. On approval, each line with a difference posts one count movement of counted minus the current on-hand quantity.
- **R8. Archiving.** Items are archived, never deleted, and only when they have nothing on hand and nothing on order. Locations can be deactivated only when empty.
- **R9. Visibility.** Staff never see costs, values or purchase order totals (section 4).
- **R10. Units.** An item's unit cannot change once it has movements; create a new item instead.

## 9. Screens

1. **Items** (home). Search by name, SKU or barcode; filter by location, supplier and low stock. Each row: photo, name, SKU, total on hand and unit, a "Low" badge with the on-order quantity, and (admins) value.
2. **Item page.** Photo, details, quantity at each location, on order, and the full movement history. Buttons: Use and Move for everyone; Adjust and Edit for admins. On a phone, Use defaults to the person's default location with a quantity stepper.
3. **Location page** (opened from a location label). Every item at that location with its quantity and a one-tap Use.
4. **Scan.** Opens the camera and reads QR codes and common barcodes (UPC, EAN, Code 128) using a scanning library or the browser's barcode detector, with a text box for typing or a keyboard-style scanner. A match on barcode or SKU opens the item; a location code opens the location.
5. **Purchase orders** and **Reorder suggestions** (admins), with Receive available to everyone on sent orders.
6. **Counts.** Start, enter quantities (blind), submit; admins review variances in units and value and approve.
7. **Reports** (admins): stock value by location and by supplier, low stock with on order, usage by item over the last 30 or 90 days, movement export.
8. **Labels**, **Locations**, **Suppliers**, **People**, **Settings** and **Outbox** (admins).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Item becomes low (R4) | Every admin | "Low stock: Glass cleaner, 32 oz (11 left, reorder at 12)" |
| Purchase order sent | Supplier | "Purchase order PO-0008 from Brightside Cleaning Co." (lines, quantities, unit costs, total, expected date) |
| Purchase order cancelled after sending | Supplier | "Cancelled: purchase order PO-0008" |
| Purchase order past its expected date and not fully received | The admin who created it | "PO-0007 from ProClean Wholesale is overdue" (once, on the first daily job run after the expected date) |
| Count submitted | Every admin | "Count C-0001 at Van 1 is ready to review (2 differences)" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job (protected by a CRON_SECRET header) sends overdue reminders and retries failed emails. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so overdue purchase orders and usage windows can be tested by moving the clock.

## 12. Labels, scanning and export

- **Item labels** show the name, SKU and a QR code for the item's page URL (/i/<sku>). **Location labels** show the location name and a QR code for /l/<code>. Both print on US Letter sheets of 30 labels (3 columns by 10 rows, the common 1 by 2⅝ inch address label size). Any phone camera opens these links; the person must be signed in.
- The **movement export** is a CSV of every movement: date and time, SKU, item, location, type, quantity, person, reason, purchase order number, count number.

## 13. Edge cases

- Two people use the last unit at the same moment: one succeeds and the other is refused (R1).
- A move where the destination is the same as the source is refused.
- Receiving into an inactive location is refused.
- A count is started at a location while another count there is open: refused, with a link to the open count.
- An item with stock on order cannot be archived: "PO-0007 has 20 on order."
- An item's unit cost changes on receipt: the value of all its on-hand units changes with it (R6); the item page shows the previous cost in its history.
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

Stock value: Store room $805.20, Van 1 $197.30, Van 2 $130.55, total $1,133.05. Nitrile gloves are the only low item (7, reorder at 10); their low stock email has already gone out, so low_alerted is set.

Purchase orders:
- PO-0006, Metro Paper Co., received 9 days ago into the Store room: trash bags 6 cases at $38.50 and paper towels 6 cases at $31.00, total $417.00.
- PO-0007, ProClean Wholesale, created and sent by Marco 2 days ago, expected in 5 days: nitrile gloves 20 boxes at $9.80 and vacuum bags 8 packs at $14.20, total $309.60, nothing received.

Movement history: an opening balance for each item and location 45 days ago, the PO-0006 receipt, and "use" movements by Priya at Van 1 and Tom at Van 2 spread over the last 28 days, totalling glass cleaner 18, nitrile gloves 9, mop heads 6, disinfectant 5, microfiber cloths 4, vacuum bags 3, paper towels 3 and trash bags 2. Choose the opening balances so the quantities come out exactly as in the table.

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
