<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/equipment-tracker . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

# Equipment Tracker

Blueprint BP-016 · Department: Ops · Replaces: Asset Panda (IT equipment tracking), the laptop spreadsheet
For teams of 10 to 200 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Nobody knows who has which laptop, or when its warranty ends."

Laptops, monitors and phones are bought one at a time and tracked in a spreadsheet that stops being true the first week someone swaps a charger. When a person leaves, nobody is sure what to collect. When a laptop breaks, nobody knows whether it is still under warranty. When the auditor or insurer asks what the company owns, someone spends two days reconciling.

This blueprint is a register of equipment with one current holder per item and a history of every hand-over. Items are checked out and checked in, never silently reassigned. Warranty dates come with reminders, a periodic check asks each person to confirm what they hold, and a person cannot be deactivated while they still have company equipment.

## 2. What the real product does

Research basis: Asset Panda's home page (assetpanda.com) and pricing page (assetpanda.com/pricing), October 2026.

What we verified:

1. **Price.** Asset Panda does not publish prices. Its pricing page asks for details to prepare a custom quote, and offers a free 7-day trial.
2. **What it tracks.** Asset Panda describes itself as one customizable source of truth for assets, tracking who had each item, what happened to it and whether you can prove it: scans, transfers and check-outs, inspections, the full history and chain of custody for audits, and certification dates and inspection status for compliance.
3. **AI and mobile.** Its AI (UrsaAI) identifies an item from a photo, reads labels and fills in fields, grades condition during inspections, and assembles audit history. There is a mobile app, and the product is configured without code (collections and forms).

### What this blueprint keeps

A register of items with a unique asset tag, type, model, serial number, cost, purchase date and warranty end date; statuses (in stock, assigned, in repair, retired, lost); check-out to a person and check-in with condition notes, so every item has at most one holder and a complete hand-over history; a printable label with a QR code that opens the item's page; warranty reminders; a periodic asset check where each person confirms the items they hold; a rule that stops deactivating anyone who still holds equipment; per-person and company totals; CSV import of your existing spreadsheet; CSV export.

### What this blueprint deliberately leaves out

Barcode scanning with a phone camera (v1 opens the item from the QR code with any camera app), photo recognition and AI, inspections and condition grading workflows, compliance certifications, maintenance schedules for vehicles and machinery, depreciation, purchasing and procurement, software licences (see the SaaS Spend Tracker blueprint), automatic discovery through device management, multiple sites with stock levels, and a no-code form builder. These matter to operations teams tracking thousands of physical assets across sites. A company of 10 to 200 people tracking laptops, monitors and phones needs to know who has what, since when, and what is about to go out of warranty.

## 3. Scope of v1

- One company, one currency (USD; costs stored as integer cents), one team time zone (Settings; default America/New_York). Dates are calendar dates.
- Amounts show whole dollars ($9,053) unless there are cents ($1,299.50).
- Item types are a short list an admin manages (Laptop, Monitor, Phone, Accessory, Other).
- Items are held by people, or are in stock, in repair, retired or lost. Locations are a free-text field (for example "London office", "Home", "Storage room").
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone; item pages must be easy to open from a QR code.
- Sign-in: the company email domain is a setting (fernway.example in the seed). In production the verified email comes from Google sign-in or the platform's sign-in; in development a "sign in as" switcher lists every person, and an inactive person who is picked sees "Ask IT to add you."

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| IT admin | People with is_it_admin | Add, edit, import and export items; check out, check in, send to repair, retire and mark lost; run asset checks; manage people, types and settings; read the outbox. |
| Employee | Everyone else | See the items they hold and their history with them; confirm or dispute items in an asset check; report a problem with an item they hold. Cannot see other people's items. |

Opening an item's QR link signed in as an employee who does not hold it shows "This item belongs to Fernway. If you found it, contact it@fernway.example." and nothing else. The same message (HTTP 200) is shown to someone who is not signed in (with a Sign in link), to a former holder, and for a tag that does not exist, so tags cannot be probed. The server enforces all of this. Import and export are for IT admins only.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name (required), email (required, unique, stored lowercase), is_it_admin (boolean), active (boolean)

**Settings** (one row)
- company_name, it_email (shown on the found-item page), time_zone, warranty_notice_days (default 30), tag_prefix (default "NW-"), next_tag_number (integer, starts at 1)
- Limits: warranty_notice_days 1 to 365; tag_prefix 1 to 10 letters, digits, ".", "-" or "_" (it appears in URLs and QR codes); it_email a valid email; time_zone an IANA name. next_tag_number is shown on Settings but cannot be edited.

**ItemType**
- id, name (1 to 40 characters, unique ignoring case), active
- Types are never deleted. An inactive type cannot be chosen for new or imported items, but items that already have it keep it.

**Item**
- id, tag (unique; tag_prefix plus a zero-padded number, e.g. NW-0042; assigned when the item is created, never reused or changed)
- type_id, make (1 to 60), model (1 to 80), serial_number (optional, max 80; unique among items that are not retired when present)
- purchase_date (optional date), cost_cents (optional integer, 0 or more), supplier (optional, max 80)
- warranty_end (optional date)
- status: in_stock | assigned | in_repair | retired | lost
- holder_id (nullable Person; set if and only if status is assigned)
- location (optional, max 80), notes (optional, max 1,000)
- retire_reason (nullable), created_at, version (integer; R11)

**Assignment** (one row per period an item was held)
- id, item_id, person_id, checked_out_at, checked_out_by, condition_out (optional, max 200)
- checked_in_at (nullable), checked_in_by (nullable), condition_in (optional, max 200)
- At most one open assignment (checked_in_at empty) per item.

**AssetCheck** (a periodic confirmation round)
- id, started_at, started_by, due_date, closed_at (nullable)

**CheckResponse** (one per person per item in a check)
- id, check_id, person_id, item_id, answer: pending | have_it | dont_have_it, note (required for dont_have_it, 5 to 300 characters), answered_at, reminded_at

**Event** (append-only, never edited or deleted)
- id, item_id (nullable), actor_id (nullable for the system), type: created | edited | checked_out | checked_in | sent_to_repair | back_from_repair | retired | marked_lost | found | imported | problem_reported | check_started | check_answered | check_closed | warranty_reminded
- data (JSON, nullable), created_at

**Notification** (outbox)
- id, kind, to_email, person_id (nullable), item_id (nullable), subject, body, status: pending | sent | logged | failed, error, created_at, sent_at
- A logged email has no sent_at. A failed email keeps its last error and is retried on every job run until it is sent; an email still pending 10 minutes after it was written is retried too.

## 6. Lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Add | IT admin | (none) | in_stock | Tag assigned (R1); event `created`. The add form has no status field: every new item starts in stock |
| Check out | IT admin | in_stock | assigned | Holder must be an active person (the person list shows active people only, IT admins included, and the server refuses anyone else); new Assignment; the holder is emailed the list of items they now hold |
| Check in | IT admin | assigned | in_stock | Closes the open Assignment with condition notes |
| Send to repair | IT admin | in_stock, assigned | in_repair | From assigned, checks the item in first (one Assignment closed, with the repair note as condition_in; events `checked_in` then `sent_to_repair`) |
| Back from repair | IT admin | in_repair | in_stock | Note required |
| Retire | IT admin | in_stock, in_repair | retired | Reason required (5 to 200 characters); final: every status action is refused, and an admin can only edit the item's fields with a correction note of 5 to 200 characters |
| Mark lost | IT admin | in_stock, assigned, in_repair | lost | Note required; from assigned, closes the Assignment with condition_in "Lost" and writes only `marked_lost` (no `checked_in`, since nothing was handed back) |
| Found | IT admin | lost | in_stock | Note required |
| Report a problem | The current holder only (an IT admin too, when they hold the item) | assigned | assigned | Note required; one email to each active IT admin; event `problem_reported`; the item and its version do not change |

A transfer from one person to another is a check-in followed by a check-out, so the history always shows both. Any other change of status is refused with a message that names the item, its status and the allowed statuses, for example "Can't retire NW-0001: it is assigned to Lee Park. Only items that are in stock or in repair can be retired."

Required notes (back from repair, mark lost, found, report a problem) are 5 to 300 characters. The retire reason is 5 to 200. Condition out, condition in and the repair note are optional, up to 200.

## 7. Warranty and totals

- **R7. Warranty states.** For an item with a warranty_end: **Expired** when it is before today, **Ending soon** when it is within warranty_notice_days (today included), otherwise **Covered** until that date. Exactly: Ending soon when 0 to warranty_notice_days days remain, so the end date itself is Ending soon and the day after is Expired. Items without a warranty_end show "No warranty date". The Ending soon count at the top of Items leaves out retired and lost items.
- **R8. Reminders.** The daily job emails the IT admins once per item when it first becomes Ending soon, listing the item, its holder and the end date (event `warranty_reminded`; never twice for the same warranty_end). Retired and lost items get no reminders. "First becomes Ending soon" means the first job run inside the notice window: an item that is already Expired the first time the job sees it gets no reminder, and a changed warranty_end is reminded again. Items in repair do get reminders. The event's actor is the system.
- **R9. Totals.** Company value = the sum of cost_cents for items that are not retired or lost. Per-person value = the sum for items they currently hold. Items without a cost count as $0 and are listed as "cost unknown". The totals on Items cover the whole register and do not change with search or filters; a "Showing N of M" line reflects the filters.

### Worked examples (seed data in section 14; today is Tue Oct 13, 2026)

| Item | Holder | Warranty end | State on Oct 13 | Reminder |
|---|---|---|---|---|
| NW-0001 MacBook Pro 14 | Lee Park | Nov 2, 2026 | Ending soon (20 days) | Sent on the first job run |
| NW-0002 MacBook Air 13 | Jo Park | T+153 days (Mar 15, 2027) | Covered | Due on T+123 days (Feb 13, 2027) |
| NW-0005 iPhone 15 | Sam Okafor | Sep 30, 2026 | Expired | None (already expired when first seen) |
| NW-0006 MacBook Air 13 | in repair | T+89 days (Jan 10, 2027) | Covered | Due on T+59 days (Dec 11, 2026) |

Company value: NW-0001 $2,399 + NW-0002 $1,299 + NW-0003 $379 + NW-0004 $2,399 + NW-0005 $899 + NW-0006 $1,299 + NW-0008 $379 = $9,053 (NW-0007 is retired and not counted). Jo Park holds $1,678 (NW-0002 and NW-0003).

## 8. Business rules

- **R1. Tags.** Tags are assigned in order from next_tag_number, zero-padded to 4 digits, and never reused, even when an item is retired. Changing tag_prefix affects only new items. After 9999 the number keeps growing (NW-10000), and if a prefix change would recreate an existing tag, that number is skipped. An import assigns tags only when it is confirmed, in row order; an import that fails changes nothing, next_tag_number included, and there is no undo of an import.
- **R2. One holder.** An item has a holder exactly when its status is assigned, and exactly one open Assignment then. Checking out an item that is not in stock is refused: "NW-0002 is assigned to Jo Park. Check it in first."
- **R3. Active holders only.** Only active people can receive items. Deactivating a person who holds items is refused and lists them: "Collect 2 items from Jo Park first: NW-0002 MacBook Air 13, NW-0003 Dell 27 monitor." "Holds" means currently assigned to them; items in repair or lost do not count, so marking an item lost unblocks deactivation.
- **R4. Serial numbers.** A serial number must be unique among items that are not retired: "Serial C02XK1 is already on NW-0001." Serials are compared trimmed and ignoring case. Lost items keep their serial; only retiring an item frees it.
- **R5. Visibility.** Employees see only items they currently hold, and their own past assignments. IT admins see everything. The QR link of an item opens its page for IT admins and the holder; anyone else sees only the found-item message (section 4). The holder's view of an item leaves out the cost and the event log and shows only their own assignments of it.
- **R6. Validation.** Costs from $0 to $100,000 inclusive, entered in dollars with at most 2 decimals ("2399", "2,399" and "$2,399.00" all work); purchase and warranty dates are real dates, entered as YYYY-MM-DD and checked by the server; warranty_end may not be before purchase_date: "Warranty end can't be before the purchase date." Text is rendered as text, never as HTML.
- **R10. Asset checks.** Starting a check creates one pending CheckResponse for every assigned item, addressed to its holder, and emails each holder once with the list and a link. A person answers each item "I have it" or "I don't have it" (with a note). A "don't have it" answer emails the IT admins. Seven days after the check starts, pending people get one reminder. An IT admin closes the check; the summary shows confirmed, disputed and unanswered items. Only one check can be open at a time.
  - The check covers the items assigned at the moment it starts. Items checked out later are not added, and an item that changes hands during the check stays with its original holder, marked "no longer with you". Starting a check when nothing is assigned is refused.
  - due_date is the start date plus 7 days in the team time zone, which is also the reminder day. The reminder goes once per person per check, lists only their unanswered items, and is recorded in reminded_at.
  - Answers are final. With "I have it" a note is optional (up to 300 characters); with "I don't have it" it is required (5 to 300).
  - Closing leaves unanswered items pending, counted as unanswered. Disputed items are not changed automatically; IT follows up, for example with Mark lost.
  - Events: `check_started` and `check_closed` once per check, `check_answered` once per answered item (so it appears in that item's log).
- **R11. Stale edits.** Edits and status changes check the item's version; if it changed after the page was loaded, the change is refused with "NW-0004 changed. Reload to see the latest version." This applies to every IT action and runs before any other validation, and nothing is saved. Every edit and status change adds 1 to the version; saving an edit with no changes does not.
- **R12. Import.** CSV import (IT admins) accepts the columns type, make, model, serial_number, purchase_date, cost, supplier, warranty_end, location and holder_email, previews every row with errors (unknown type, bad date, duplicate serial, unknown or inactive holder), and imports only valid rows in one transaction. Rows with a holder_email are created checked out to that person.
  - Input: upload a CSV file or paste CSV text, not both; UTF-8, up to 1 MB and 2,000 rows. A blank template with these columns can be downloaded.
  - A header row is required. Column names match ignoring case, spaces and hyphens, in any order; type, make and model must be present. Other columns (notes, tag, status) are ignored and listed above the preview; a repeated column is an error. Notes are not imported.
  - Fully blank rows are skipped. Missing trailing cells count as blank; extra non-empty cells are a row error.
  - Errors: the type must match an active type ignoring case; a bad date is anything that is not a real YYYY-MM-DD date, and a warranty end before the purchase date is also an error; cost uses the item form's formats, blank meaning cost unknown; a duplicate serial is one already on a non-retired item (R4's message) or on an earlier row of the same file; an unknown holder is an email that matches nobody or is not an email, and an inactive holder gets its own error. A blank holder_email puts the item in stock.
  - Confirming checks the file again. If the ready rows have changed since the preview, nothing is imported and the new preview is shown.
  - Each imported item gets an `imported` event (not `created`). A row with a holder also gets an assignment that starts at the moment of import, checked out by the importing admin with an empty condition, and a `checked_out` event, but no "You now have" email, because the person already has it.
  - Import the template's format, not an export: an exported retired item would come back as a new in-stock item.
- **R13. Events.** Every successful action writes the events in section 6; events are never edited or deleted. The one exception is "reset to seed data", which exists only in development and recreates the database.

## 9. Screens

1. **Items** (IT admin home). Search by tag, model, serial and holder; filters by type, status, warranty state and location; columns tag, type, make and model, status, holder, location, warranty state, cost. Totals at the top: items, company value, Ending soon count (R7, R9). A checkbox on each row selects items for a label sheet.
2. **Item.** All fields, status actions for IT admins (section 6), the warranty state, the holder, the assignment history (who, from, to, condition out and in), the event log and the label preview. Every status action is shown; those not allowed from the current status are greyed under "Not allowed while …", and the server refuses them with the section 6 message. History times are in the team time zone, with "Now" as the end of an open assignment. Edit changes the descriptive fields only (type, make, model, serial, purchase date, cost, supplier, warranty end, location, notes); status and holder change only through section 6.
3. **Label.** A printable label per item (or a sheet for a selection): company name, tag, make and model, and a QR code of the item's URL. The QR code holds the absolute URL (from the app's BASE_URL), in byte mode with error correction level M. Labels are for IT admins.
4. **People.** Each person with the number and value of items they hold; opening a person lists their items and past assignments. Deactivate (R3). IT admins add people (name, email, IT admin or not), deactivate and reactivate them. Nobody can deactivate themselves or the last active IT admin.
5. **My equipment** (employee home). The items I hold, since when, with Report a problem, and any open asset check to answer. IT admins can open it too, since they can hold items.
6. **Asset checks.** Start a check, see the open check's progress by person, close it, and look at past checks. The Start button stays visible while a check is open; pressing it shows R10's refusal.
7. **Import and export** (CSV, R12; one page holding the import form and both export links), **Admin: Types**, **Admin: Settings**, **Admin: Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Check out | The new holder | "You now have NW-0004 MacBook Pro 14" (with everything they hold) |
| Report a problem | IT admins | "Problem reported with NW-0001 by Lee Park" |
| Warranty reminder (R8) | IT admins | "Warranty ending Nov 2: NW-0001 MacBook Pro 14 (Lee Park)" |
| Asset check started | Each holder | "Please confirm the equipment you have" |
| "I don't have it" answer | IT admins | "Disputed: NW-0003 Dell 27 monitor (Jo Park)" |
| Asset check reminder | Holders with pending answers | "Reminder: please confirm your equipment" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried. A notification failure never blocks the action that caused it.

- "IT admins" means one email to each active IT admin, so one warranty reminder is two outbox rows in the seed.
- An item's short name in subjects and messages is its model, with the make in front when the model starts with a digit: "MacBook Pro 14", "Dell 27 monitor".
- When a reminded item has no holder, the brackets give its status instead: "(in stock)", "(in repair)".
- Bodies: the check-out email lists everything the person now holds and links to My equipment; the problem email has the note and a link to the item; the check-started email lists the person's items, the due date and a link; the check reminder lists only their unanswered items; the dispute email has the note and links to the item and the check.

## 11. Scheduled job and time

A daily run of an hourly job (protected by a CRON_SECRET header, with a development-only "run job now" control that uses the development clock): warranty reminders (R8), asset check reminders (R10), and retrying failed notifications. All time reads go through one function that adds the development clock offset.

- The scheduler calls the endpoint every hour (GET or POST /cron/hourly) with the header X-Cron-Secret (Authorization: Bearer is also accepted). A wrong or missing secret gets 401; if CRON_SECRET is not set the endpoint refuses with 503. The reminders are written so a repeat call sends nothing new, which makes them once a day; failed emails are retried on every call.
- "Run job now" shows what the run did (which reminders went to whom, how many emails were retried).
- The development clock moves forward only, 1 to 3,650 days at a time. Its offset survives a restart and is ignored in production.

## 12. Export

IT admins: CSV of items with every field plus holder name and email and warranty state, and CSV of assignments (tag, person, checked out, checked in, conditions). The export is what an auditor or insurer asks for.

- Items (/export/items.csv): `tag,type,make,model,serial_number,purchase_date,cost,supplier,warranty_end,warranty_state,status,holder_name,holder_email,location,notes,retire_reason,created_at,version`. Cost in dollars (2399.00); status uses the data-model values (in_stock); warranty_state uses R7's names as of today; holder columns only for assigned items; created_at in UTC ISO 8601.
- Assignments (/export/assignments.csv): `tag,make,model,person_name,person_email,checked_out_at,checked_out_by,condition_out,checked_in_at,checked_in_by,condition_in`, every assignment, open or closed, sorted by tag and then check-out time, times in UTC ISO 8601, an open one with an empty checked_in_at.
- Files are UTF-8 with a byte order mark, CRLF line endings, named items-YYYY-MM-DD.csv and assignments-YYYY-MM-DD.csv; a cell that a spreadsheet would run as a formula gets a leading apostrophe.

## 13. Edge cases

- Someone leaves: deactivation is refused until their items are checked in or marked lost (R3). The people list shows who still holds items.
- A laptop is swapped between two people: check in from the first, check out to the second; the history shows both.
- A disputed item in an asset check: the IT admin investigates; marking it lost closes the assignment with "Lost".
- An item is found after being marked lost: Found returns it to stock with a note; history keeps both events.
- Two admins edit the same item at once: R11.
- Importing a spreadsheet twice: duplicate serial numbers are reported as errors in the preview, so nothing is duplicated.
- A stale edit (R11) is refused before anything else is checked.

## 14. Seed data

Reset loads the seed relative to today, the date in the team time zone when it is loaded: every date in this section, purchase dates and "since" dates included, moves by the number of days between Tue Oct 13, 2026 and today, so the worked examples in section 7 hold with shifted dates (on a later seed day NW-0001's reminder reads that day plus 20 days, not Nov 2).

Settings: company "Fernway", IT email it@fernway.example, time zone America/New_York, warranty notice 30 days, tag prefix "NW-", next tag 9.

Types: Laptop, Monitor, Phone, Accessory, Other.

People (emails are firstname@fernway.example, for example lee@fernway.example): Ben Cho (IT admin), Dana Ruiz (IT admin), Lee Park, Jo Park, Sam Okafor, Maya Chen, Priya Nair. Everyone is active.

Items (T is when the seed is loaded; the examples assume Tue Oct 13, 2026):

| Tag | Type | Make and model | Serial | Cost | Purchased | Warranty end | Status | Holder | Since |
|---|---|---|---|---|---|---|---|---|---|
| NW-0001 | Laptop | Apple MacBook Pro 14 | C02XK1 | $2,399 | Nov 2, 2023 | T+20 days (Nov 2, 2026) | assigned | Lee Park | Nov 6, 2023 |
| NW-0002 | Laptop | Apple MacBook Air 13 | C02YP7 | $1,299 | Mar 15, 2024 | T+153 days (Mar 15, 2027) | assigned | Jo Park | Mar 18, 2024 |
| NW-0003 | Monitor | Dell 27 monitor | CN0D27A | $379 | Mar 15, 2024 | T+153 days (Mar 15, 2027) | assigned | Jo Park | Mar 18, 2024 |
| NW-0004 | Laptop | Apple MacBook Pro 14 | C02ZQ3 | $2,399 | Oct 1, 2026 | Oct 1, 2029 | in_stock | | |
| NW-0005 | Phone | Apple iPhone 15 | F17XR2 | $899 | Sep 30, 2024 | T-13 days (Sep 30, 2026) | assigned | Sam Okafor | Oct 2, 2024 |
| NW-0006 | Laptop | Apple MacBook Air 13 | C02WM8 | $1,299 | Jan 10, 2024 | T+89 days (Jan 10, 2027) | in_repair | | |
| NW-0007 | Laptop | Lenovo ThinkPad X1 | PF3K9 | $1,450 | Feb 1, 2021 | Feb 1, 2024 | retired ("Battery failure") | | |
| NW-0008 | Monitor | Dell 27 monitor | CN0D27B | $379 | Mar 15, 2024 | T+153 days (Mar 15, 2027) | in_stock | | |

Assignment history: NW-0006 was held by Maya Chen from Jan 12, 2024 until it was sent to repair 5 days before the seed day ("Keyboard not responding"). NW-0004 has never been assigned.

Make is the first word of "Make and model" (Apple, Dell, Lenovo) and the model is the rest (MacBook Pro 14, 27 monitor, ThinkPad X1). Location, supplier and notes are blank. Ben Cho made every seed check-out and the NW-0006 check-in; each item's created_at is its purchase date; NW-0007's `retired` event is dated on its warranty end; seed events are marked as seed data.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and the register

```
Using the Equipment Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask IT to add you."
3. Build Items and Item (section 9, screens 1 and 2) for IT admins, with adding and editing items (R1, R4, R6, R11), and Admin: Types and Admin: Settings.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock back to the real time), all visible only in development.

Do not build check-out, check-in or asset checks yet. Until Phase 2, the Item screen shows the seed's assignment history read-only, the label preview shows a placeholder where the QR code will go, and employees see "Only IT can open this page." on these screens and a placeholder home page. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Ben, Items lists 8 items with a company value of $9,053 and 1 item Ending soon (NW-0001).
- [ ] Adding a laptop gives it the tag NW-0009; adding another gives NW-0010.
- [ ] Adding an item with the serial C02XK1 is refused with "Serial C02XK1 is already on NW-0001."
- [ ] Saving a warranty end before the purchase date is refused.
- [ ] Signed in as Lee, opening Items says "Only IT can open this page." and a direct request to add an item is refused.

### Phase 2: Check-out, check-in and statuses

```
Using the Equipment Tracker blueprint above, build Phase 2 only.

1. Implement every action in section 6 with R2, R3, R5 and R13, enforced on the server, and the assignment history on the Item screen.
2. Build People and My equipment (section 9, screens 4 and 5), and the found-item message for QR links (section 4).
3. Build Label (screen 3) with a QR code of each item's URL.
4. Write the check-out and problem-report emails (section 10) to the outbox, and build Admin: Outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Ben checks out NW-0004 to Priya Nair with the condition "New": its status is Assigned, the history shows Priya from today, and the outbox has "You now have NW-0004 MacBook Pro 14" for Priya.
- [ ] Checking out NW-0002 to Priya is refused with "NW-0002 is assigned to Jo Park. Check it in first."
- [ ] Transferring NW-0003 from Jo to Maya (check in, then check out) leaves two rows in its history and Jo holding $1,299 on the People screen.
- [ ] Deactivating Lee Park is refused with a message listing NW-0001.
- [ ] Signed in as Jo, My equipment lists only her items (NW-0002; NW-0003 went to Maya in the check above); opening NW-0001's item URL shows the found-item message with it@fernway.example and no details.
- [ ] Lee reports a problem with NW-0001 ("Battery drains in two hours"): the outbox has "Problem reported with NW-0001 by Lee Park" for both IT admins.
- [ ] Retiring NW-0001 while it is assigned is refused; marking NW-0005 lost closes Sam's assignment with "Lost" and removes $899 from the company value.
- [ ] The label for NW-0004 shows Fernway, the tag and model, and a QR code that opens NW-0004's page.

### Phase 3: Warranty and asset checks

```
Using the Equipment Tracker blueprint above, build Phase 3 only.

1. Implement the warranty states and reminders (R7, R8) and the scheduled job in section 11, with a development-only "run job now" control.
2. Build Asset checks (section 9, screen 6) and the answering flow on My equipment, with R10.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Running the job emails the IT admins one reminder for NW-0001 and none for NW-0005; running it again sends nothing new.
- [ ] Moving the clock to 30 days before NW-0002's warranty end (T+123 days; Feb 13, 2027 in the examples) and running the job sends reminders for NW-0002, NW-0003 and NW-0008.
- [ ] Starting an asset check emails Lee, Jo and Sam (the holders) once each; starting a second check while one is open is refused.
- [ ] Jo answers "I have it" for NW-0002 and "I don't have it" for NW-0003 with the note "Left at the old office"; the IT admins are emailed "Disputed: NW-0003 Dell 27 monitor (Jo Park)".
- [ ] Seven days after the check started, running the job reminds Lee and Sam only; closing the check shows 1 confirmed, 1 disputed and 2 unanswered.

### Phase 4: Import and export

```
Using the Equipment Tracker blueprint above, build Phase 4 only.

1. Build CSV import with a preview and CSV export (section 9, screen 7; R12; section 12).
2. Add tests for import errors: unknown type, bad date, duplicate serial, unknown holder.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Importing three rows (a valid monitor, a laptop with the serial C02YP7, and a phone for holder nobody@fernway.example) previews one ready row and two errors naming the duplicate serial and the unknown holder, and imports only the monitor, tagged with the next tag number.
- [ ] A valid imported row with holder_email lee@fernway.example is created checked out to Lee Park, with an assignment from today.
- [ ] The items export contains every item with its holder and warranty state; the assignments export contains NW-0006's past assignment to Maya Chen.

## 16. Variations

- Scan QR codes in the app with the phone camera to check items in and out.
- Pull devices automatically from your device management tool.
- Depreciation by straight line over a set number of years.
- Requests: employees ask for equipment and IT fulfils them.
- Several sites with stock counts per site.
- Software licences on the same register (or use the SaaS Spend Tracker blueprint).

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser. Each phase's checks started from a fresh load of the seed and ran in order on the same data, as the build plan says; the seed loaded relative to the real day (Tuesday, November 10, 2026), so every date sat 28 days after the Oct 13 examples, and the Phase 3 checks moved the clock forward 123 and then 7 days. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Emails were read on the admin Outbox screen, the job was run from its "Run job now" button, the label's QR code was decoded from a screenshot and opened, and both CSV exports were downloaded and parsed.

**Result:** 21 of 21 acceptance checks passed in one final browser run on a fresh database, plus 116 automated tests. The item-by-item results are in [acceptance-results.json](/builds/equipment-tracker/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. Section 14 made only the warranty ends relative to the seed day, so purchase and "since" dates were fixed while warranties moved. Every seed date now moves by the days between Oct 13, 2026 and today.
2. "Today" for the seed didn't say in which time zone. It is the date in the team time zone when the seed loads.
3. The seed's "Make and model" column was one string, while Item has separate make and model fields. Make is the first word and the model the rest.
4. The seed gave no location, supplier, notes, created_at, or who made the seed check-outs. They are blank, Ben Cho made them, and created_at is the purchase date.
5. Nothing said whether the Items totals follow the search and filters. They cover the whole register, with a separate "Showing N of M" line.
6. The Ending soon count didn't say whether retired and lost items count. They don't.
7. "Within warranty_notice_days (today included)" left the end date itself unclear. The end date is Ending soon and the day after is Expired.
8. R4 didn't say whether serials compare ignoring case, or whether a lost item keeps its serial. They compare trimmed and ignoring case, and only retiring frees a serial.
9. Costs are stored in cents but nothing said how they are typed. They are entered in dollars with at most 2 decimals, "2,399" and "$2,399.00" included.
10. Nothing said how dates are entered. They are YYYY-MM-DD, checked by the server.
11. Editing didn't say which fields an edit may change. Only the descriptive fields; status and holder change only through section 6.
12. "Final except for corrections by an admin with a note" didn't say what a correction may change. Status actions are refused, and field edits need a 5 to 200 character note.
13. R11 didn't say whether the version check comes before validation. It comes first, and nothing is saved.
14. Nothing said whether the add form offers a status. It doesn't; every new item starts in stock.
15. ItemType had an active flag with no rule for inactive types. They can't be chosen for new or imported items, existing items keep them, and types are never deleted.
16. Settings had no limits. Notice days are 1 to 365, the tag prefix is 1 to 10 URL-safe characters, and next_tag_number is read-only.
17. R1 didn't cover tag number 10,000 or a prefix change that recreates an existing tag. Numbers keep growing, and a colliding number is skipped.
18. Sign-in was limited to "our company email domain" with no setting for the domain. The domain is a setting, and an inactive person picked in the switcher sees "Ask IT to add you."
19. The development clock had no limits. It moves forward only, 1 to 3,650 days at a time, survives a restart and is ignored in production.
20. Reset to seed data deletes events that R13 says are never deleted. Reset is the one, development-only exception.
21. Nothing said how amounts are shown. Whole dollars, with cents only when there are any.
22. The emails write "NW-0004 MacBook Pro 14" but "NW-0003 Dell 27 monitor", so no rule for an item's short name fitted both. It is the model, with the make in front when the model starts with a digit.
23. Two checks click actions that the current status doesn't allow, but nothing said whether the Item screen shows them. Every action is shown, the disallowed ones greyed, and the server refuses them.
24. "Any other change of status is refused" had no message. The message names the item, its status and the allowed statuses.
25. Only the retire reason had a length. Required notes are 5 to 300 characters, and conditions and the repair note are optional, up to 200.
26. Send to repair from assigned didn't say what condition_in or events it records. The repair note is the condition_in, with `checked_in` then `sent_to_repair`.
27. Mark lost from assigned didn't say whether it writes `checked_in`. It writes only `marked_lost`.
28. R11 named "edits and status changes" but not Report a problem, or whether actions bump the version. Every IT action is version-checked and bumps it; a problem report does neither.
29. "The holder" reports a problem, but an IT admin can hold items too, and "IT admins are emailed" didn't say how many emails. Only the current holder reports, and each active IT admin gets one email.
30. R5 lets the holder open the item but didn't say what they see. They see it without cost or event log, and only their own assignments.
31. The found-item message was defined only for signed-in employees. It also covers people not signed in, former holders and unknown tags, so tags can't be probed.
32. The QR code's content and format weren't given. It holds the absolute URL in byte mode with error correction level M.
33. "A sheet for a selection" didn't say how items are selected. Checkboxes on Items.
34. IT admins "manage people", but no screen added, deactivated or reactivated anyone. People does all three, and nobody can deactivate themselves or the last active IT admin.
35. R3 didn't say whether items in repair or lost count as held. Only assigned items do.
36. Nothing said who appears in the check-out person list. Active people, IT admins included.
37. Section 10 gave subjects but no bodies. It now says what each email contains.
38. Nothing said whether a logged email has a sent time, or how failures are kept. A logged email has no sent_at, and a failed one keeps its last error.
39. "The history shows Priya from today" didn't say how an open assignment or its times are shown. Times are in the team time zone, with "Now" for an open assignment.
40. My equipment was "the employee home", though IT admins can hold items. IT admins can open it too.
41. "A daily run of an hourly job" didn't say how often the endpoint is called. Hourly, with reminders that send nothing new on a repeat call, and retries on every call.
42. "Protected by a CRON_SECRET header" named no header or endpoint. It is X-Cron-Secret on /cron/hourly, with 401 for a wrong secret and 503 when none is set.
43. Nothing said what "run job now" shows. It shows which reminders went to whom and how many emails were retried.
44. "Emails the IT admins" didn't say one email or one per admin. One per active IT admin, so one reminder is two outbox rows.
45. "When it first becomes Ending soon" didn't cover an item the job first sees after its warranty ended, or a changed end date. The first is never reminded, and a new end date is reminded again.
46. The reminder subject ends with the holder, but in-stock and in-repair items have none. The brackets give the status, and items in repair are reminded.
47. "Failed sends are retried" had no schedule or limit, and Notification has no attempt count. Failed emails retry on every job run, and pending ones after 10 minutes.
48. AssetCheck had a due_date with no rule. It is the start date plus 7 days in the team time zone.
49. "Pending people get one reminder" didn't say per check or per item, or where it is recorded. Once per person per check, listing only their unanswered items, in reminded_at.
50. Nothing said which items a check covers if items move while it is open. Those assigned when it starts; a moved item stays with its original holder.
51. Nothing said whether answers can be changed, or whether "I have it" takes a note. Answers are final, and the note is optional with "I have it".
52. Closing didn't say what happens to unanswered or disputed items. Unanswered stay pending and count as unanswered; disputed items are not changed.
53. Nothing said what starting a check with nothing assigned does. It is refused.
54. Section 5 lists `check_answered` but not per answer or per check. It is per answered item; `check_started` and `check_closed` are once per check.
55. The check that refuses a second open check needed a Start button while one is open. It stays visible, and pressing it shows the refusal.
56. The asset check emails had no bodies. The started email lists the person's items and due date, and the reminder only the unanswered ones.
57. Section 9 listed "Import and export" as one screen with no layout. One page holds the import form and both export links.
58. Nothing said what happens if the data changes between preview and confirm. Confirm checks again and imports nothing if the ready rows changed.
59. R12 named columns but not whether a header row is required or how names match. A header is required, names match ignoring case, spaces and hyphens, and other columns are ignored and listed.
60. "Bad date" wasn't defined. Anything that isn't a real YYYY-MM-DD date, plus a warranty end before the purchase date.
61. The import's cost column had no format. It uses the item form's dollar formats, blank meaning cost unknown.
62. Nothing said how the type column matches. It matches an active type ignoring case.
63. "Duplicate serial" didn't cover two rows of the same file. An earlier row's serial counts too.
64. "Unknown or inactive holder" didn't say what a blank holder_email means or whether the two errors differ. Blank means in stock, and inactive has its own error.
65. Rows with a holder are "created checked out" with no time, checker or condition. The assignment starts at import, by the importing admin, with no condition.
66. Section 6 emails the holder on every check-out, but an import records equipment people already have. Import sends no "You now have" email.
67. Section 5 lists an `imported` event without saying whether it replaces `created`. It does, with `checked_out` added when there is a holder.
68. R1 mentioned items "deleted by import rollback", but no rollback exists. Tags are assigned only on confirm, a failed import changes nothing, and there is no undo.
69. Nothing said what to do with blank rows or rows with missing or extra cells. Blank rows are skipped, missing cells are blank, and extra non-empty cells are an error.
70. Import didn't say upload or paste, or set any limits. Either one, not both, UTF-8, up to 1 MB and 2,000 rows.
71. R12 has no notes column though Item has notes. Notes aren't imported.
72. The items export said "every field" with no columns or formats. Section 12 now lists the header, cost in dollars and the warranty state as of today.
73. The assignments export didn't say whether open assignments are included, or the order. Every assignment, sorted by tag and check-out time, with UTC times.
74. The exports had no encoding, line endings or formula guard. UTF-8 with a byte order mark, CRLF, and a leading apostrophe on formula-like cells.
75. Nothing said whether an export can be imported back. The template is the import format; an exported retired item would come back as a new one.
76. Nothing offered a starting file for the import. A blank template with the R12 columns can be downloaded.
77. Import and export appear in the IT admin row of section 4 only. They are now stated as IT admin only.
78. A Phase 2 check expected Jo's "items" after an earlier check had moved NW-0003 to Maya. The check now names NW-0002 as her only item.
79. R6 refused a warranty end before the purchase date with no message. It is "Warranty end can't be before the purchase date."
80. Phase 1's Item screen includes a label preview, but QR codes arrive in Phase 2. Phase 1 shows a placeholder.
81. Phase 1 builds no screen for employees, whose home is My equipment in Phase 2. Until then they see a placeholder.
82. Phase 1's Item screen shows the assignment history, but check-out arrives in Phase 2. Phase 1 shows the seed history read-only.

**What we did not test:**
- Production sign-in: every check used the development "sign in as" switcher; the production path, a verified email passed in from Google or the platform's sign-in, was built but never tried.
- Real email delivery: every email was logged in the outbox; no email provider was configured, so failed sends and their retries were not exercised in the browser.
- A real scheduler: the job was run from its development button, never by cron through its endpoint.
- Hosting: the checks ran on localhost with SQLite.
- Printed labels: the QR code was decoded from a screenshot, never printed or scanned with a phone camera.
- Stale edits (R11), the Found and Back from repair actions, protecting the last IT admin, and importing an uploaded file rather than pasted text are not covered by any acceptance check.
- Phones beyond one 390-pixel Chromium viewport.
