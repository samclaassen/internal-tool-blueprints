<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/equipment-tracker . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

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
- Item types are a short list an admin manages (Laptop, Monitor, Phone, Accessory, Other).
- Items are held by people, or are in stock, in repair, retired or lost. Locations are a free-text field (for example "London office", "Home", "Storage room").
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone; item pages must be easy to open from a QR code.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| IT admin | People with is_it_admin | Add, edit, import and export items; check out, check in, send to repair, retire and mark lost; run asset checks; manage people, types and settings; read the outbox. |
| Employee | Everyone else | See the items they hold and their history with them; confirm or dispute items in an asset check; report a problem with an item they hold. Cannot see other people's items. |

Opening an item's QR link signed in as an employee who does not hold it shows "This item belongs to Fernway. If you found it, contact it@fernway.example." and nothing else. The server enforces all of this.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name (required), email (required, unique, stored lowercase), is_it_admin (boolean), active (boolean)

**Settings** (one row)
- company_name, it_email (shown on the found-item page), time_zone, warranty_notice_days (default 30), tag_prefix (default "NW-"), next_tag_number (integer, starts at 1)

**ItemType**
- id, name (unique), active

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

## 6. Lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Add | IT admin | (none) | in_stock | Tag assigned (R1); event `created` |
| Check out | IT admin | in_stock | assigned | Holder must be an active person; new Assignment; the holder is emailed the list of items they now hold |
| Check in | IT admin | assigned | in_stock | Closes the open Assignment with condition notes |
| Send to repair | IT admin | in_stock, assigned | in_repair | From assigned, checks the item in first (one Assignment closed) |
| Back from repair | IT admin | in_repair | in_stock | Note required |
| Retire | IT admin | in_stock, in_repair | retired | Reason required (5 to 200 characters); final except for corrections by an admin with a note |
| Mark lost | IT admin | in_stock, assigned, in_repair | lost | Note required; from assigned, closes the Assignment with condition_in "Lost" |
| Found | IT admin | lost | in_stock | Note required |
| Report a problem | The holder | assigned | assigned | Note required; IT admins are emailed; event `problem_reported` |

A transfer from one person to another is a check-in followed by a check-out, so the history always shows both. Any other change of status is refused.

## 7. Warranty and totals

- **R7. Warranty states.** For an item with a warranty_end: **Expired** when it is before today, **Ending soon** when it is within warranty_notice_days (today included), otherwise **Covered** until that date. Items without a warranty_end show "No warranty date".
- **R8. Reminders.** The daily job emails the IT admins once per item when it first becomes Ending soon, listing the item, its holder and the end date (event `warranty_reminded`; never twice for the same warranty_end). Retired and lost items get no reminders.
- **R9. Totals.** Company value = the sum of cost_cents for items that are not retired or lost. Per-person value = the sum for items they currently hold. Items without a cost count as $0 and are listed as "cost unknown".

### Worked examples (seed data in section 14; today is Tue Oct 13, 2026)

| Item | Holder | Warranty end | State on Oct 13 | Reminder |
|---|---|---|---|---|
| NW-0001 MacBook Pro 14 | Lee Park | Nov 2, 2026 | Ending soon (20 days) | Sent on the first job run |
| NW-0002 MacBook Air 13 | Jo Park | Mar 15, 2027 | Covered | Due on Feb 13, 2027 |
| NW-0005 iPhone 15 | Sam Okafor | Sep 30, 2026 | Expired | None (already expired when first seen) |
| NW-0006 MacBook Air 13 | in repair | Jan 10, 2027 | Covered | Due on Dec 11, 2026 |

Company value: NW-0001 $2,399 + NW-0002 $1,299 + NW-0003 $379 + NW-0004 $2,399 + NW-0005 $899 + NW-0006 $1,299 + NW-0008 $379 = $9,053 (NW-0007 is retired and not counted). Jo Park holds $1,678 (NW-0002 and NW-0003).

## 8. Business rules

- **R1. Tags.** Tags are assigned in order from next_tag_number, zero-padded to 4 digits, and never reused, even when an item is retired or deleted by import rollback. Changing tag_prefix affects only new items.
- **R2. One holder.** An item has a holder exactly when its status is assigned, and exactly one open Assignment then. Checking out an item that is not in stock is refused: "NW-0002 is assigned to Jo Park. Check it in first."
- **R3. Active holders only.** Only active people can receive items. Deactivating a person who holds items is refused and lists them: "Collect 2 items from Jo Park first: NW-0002 MacBook Air 13, NW-0003 Dell 27 monitor."
- **R4. Serial numbers.** A serial number must be unique among items that are not retired: "Serial C02XK1 is already on NW-0001."
- **R5. Visibility.** Employees see only items they currently hold, and their own past assignments. IT admins see everything. The QR link of an item opens its page for IT admins and the holder; anyone else sees only the found-item message (section 4).
- **R6. Validation.** Costs from $0 to $100,000; purchase and warranty dates are real dates; warranty_end may not be before purchase_date. Text is rendered as text, never as HTML.
- **R10. Asset checks.** Starting a check creates one pending CheckResponse for every assigned item, addressed to its holder, and emails each holder once with the list and a link. A person answers each item "I have it" or "I don't have it" (with a note). A "don't have it" answer emails the IT admins. Seven days after the check starts, pending people get one reminder. An IT admin closes the check; the summary shows confirmed, disputed and unanswered items. Only one check can be open at a time.
- **R11. Stale edits.** Edits and status changes check the item's version; if it changed after the page was loaded, the change is refused with "NW-0004 changed. Reload to see the latest version."
- **R12. Import.** CSV import (IT admins) accepts the columns type, make, model, serial_number, purchase_date, cost, supplier, warranty_end, location and holder_email, previews every row with errors (unknown type, bad date, duplicate serial, unknown or inactive holder), and imports only valid rows in one transaction. Rows with a holder_email are created checked out to that person.
- **R13. Events.** Every successful action writes the events in section 6; events are never edited or deleted.

## 9. Screens

1. **Items** (IT admin home). Search by tag, model, serial and holder; filters by type, status, warranty state and location; columns tag, type, make and model, status, holder, location, warranty state, cost. Totals at the top: items, company value, Ending soon count.
2. **Item.** All fields, status actions for IT admins (section 6), the warranty state, the holder, the assignment history (who, from, to, condition out and in), the event log and the label preview.
3. **Label.** A printable label per item (or a sheet for a selection): company name, tag, make and model, and a QR code of the item's URL.
4. **People.** Each person with the number and value of items they hold; opening a person lists their items and past assignments. Deactivate (R3).
5. **My equipment** (employee home). The items I hold, since when, with Report a problem, and any open asset check to answer.
6. **Asset checks.** Start a check, see the open check's progress by person, close it, and look at past checks.
7. **Import and export** (CSV, R12), **Admin: Types**, **Admin: Settings**, **Admin: Outbox**.

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

## 11. Scheduled job and time

A daily run of an hourly job (protected by a CRON_SECRET header, with a development-only "run job now" control that uses the development clock): warranty reminders (R8), asset check reminders (R10), and retrying failed notifications. All time reads go through one function that adds the development clock offset.

## 12. Export

IT admins: CSV of items with every field plus holder name and email and warranty state, and CSV of assignments (tag, person, checked out, checked in, conditions). The export is what an auditor or insurer asks for.

## 13. Edge cases

- Someone leaves: deactivation is refused until their items are checked in or marked lost (R3). The people list shows who still holds items.
- A laptop is swapped between two people: check in from the first, check out to the second; the history shows both.
- A disputed item in an asset check: the IT admin investigates; marking it lost closes the assignment with "Lost".
- An item is found after being marked lost: Found returns it to stock with a note; history keeps both events.
- Two admins edit the same item at once: R11.
- Importing a spreadsheet twice: duplicate serial numbers are reported as errors in the preview, so nothing is duplicated.

## 14. Seed data

Settings: company "Fernway", IT email it@fernway.example, time zone America/New_York, warranty notice 30 days, tag prefix "NW-", next tag 9.

Types: Laptop, Monitor, Phone, Accessory, Other.

People (emails are firstname@fernway.example, for example lee@fernway.example): Ben Cho (IT admin), Dana Ruiz (IT admin), Lee Park, Jo Park, Sam Okafor, Maya Chen, Priya Nair. Everyone is active.

Items (T is when the seed is loaded; the examples assume Tue Oct 13, 2026):

| Tag | Type | Make and model | Serial | Cost | Purchased | Warranty end | Status | Holder | Since |
|---|---|---|---|---|---|---|---|---|---|
| NW-0001 | Laptop | Apple MacBook Pro 14 | C02XK1 | $2,399 | Nov 2, 2023 | T+20 days (Nov 2, 2026) | assigned | Lee Park | Nov 6, 2023 |
| NW-0002 | Laptop | Apple MacBook Air 13 | C02YP7 | $1,299 | Mar 15, 2024 | Mar 15, 2027 | assigned | Jo Park | Mar 18, 2024 |
| NW-0003 | Monitor | Dell 27 monitor | CN0D27A | $379 | Mar 15, 2024 | Mar 15, 2027 | assigned | Jo Park | Mar 18, 2024 |
| NW-0004 | Laptop | Apple MacBook Pro 14 | C02ZQ3 | $2,399 | Oct 1, 2026 | Oct 1, 2029 | in_stock | | |
| NW-0005 | Phone | Apple iPhone 15 | F17XR2 | $899 | Sep 30, 2024 | T-13 days (Sep 30, 2026) | assigned | Sam Okafor | Oct 2, 2024 |
| NW-0006 | Laptop | Apple MacBook Air 13 | C02WM8 | $1,299 | Jan 10, 2024 | Jan 10, 2027 | in_repair | | |
| NW-0007 | Laptop | Lenovo ThinkPad X1 | PF3K9 | $1,450 | Feb 1, 2021 | Feb 1, 2024 | retired ("Battery failure") | | |
| NW-0008 | Monitor | Dell 27 monitor | CN0D27B | $379 | Mar 15, 2024 | Mar 15, 2027 | in_stock | | |

Assignment history: NW-0006 was held by Maya Chen from Jan 12, 2024 until it was sent to repair 5 days before the seed day ("Keyboard not responding"). NW-0004 has never been assigned.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation and the register

```
Using the Equipment Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask IT to add you."
3. Build Items and Item (section 9, screens 1 and 2) for IT admins, with adding and editing items (R1, R4, R6, R11), and Admin: Types and Admin: Settings.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build check-out, check-in or asset checks yet. When you're done, list what you built and anything in the spec you had to interpret.
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
- [ ] Signed in as Jo, My equipment lists only her items; opening NW-0001's item URL shows the found-item message with it@fernway.example and no details.
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
- [ ] Moving the clock to 30 days before Mar 15, 2027 and running the job sends reminders for NW-0002, NW-0003 and NW-0008.
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
