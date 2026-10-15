<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/maintenance-requests . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Maintenance Requests

Blueprint BP-028 · Department: Ops · Replaces: MaintainX, the maintenance group text, the whiteboard of jobs
For teams of 5 to 200 people with equipment and buildings to look after.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"The walk-in cooler was warm for two days because the request was a text to someone on holiday."

A restaurant group, gym chain or property manager reports problems by text, email and notes on the office door. Nobody knows which jobs are open, who is on them or what is waiting for a part. Filter changes and cleanings happen when someone remembers, and when the ice machine dies there is no history of what was done to it.

This blueprint is a maintenance app: anyone can report a problem from a QR code on the equipment, the maintenance team turns requests into work orders with a priority, an assignee and a due date, follows checklists with readings that flag problems, schedules preventive maintenance that creates its own work orders, and logs time and parts against each asset.

## 2. What the real product does

Research basis: MaintainX's pricing page (getmaintainx.com/pricing), October 2026.

What we verified:

1. **Plans per user per month.** Basic is free, with unlimited work orders, procedures and requester users, real-time messaging, and limits: 2 work orders with attached procedures and 2 repeating work orders a month, and 1 month of advanced analytics. Essential is $20 billed annually ($25 monthly), adding unlimited work orders with images and unlimited repeating work orders, with 3 work orders with attached procedures a month. Premium is $65 billed annually ($75 monthly), adding unlimited procedures on work orders, meter-based maintenance, parts inventory, purchase orders, time and cost tracking, a REST API, external work orders and a dedicated account manager. Enterprise is custom.
2. **Users.** A user is anyone with a login who uses the app; requester accounts are free.
3. **Exports.** Work order exports are PDF on Basic and Essential, and PDF and CSV on Premium and Enterprise.

A team of 3 technicians pays $720 a year on Essential or $2,340 on Premium, billed annually; requesters are free on every plan.

### What this blueprint keeps

Locations and assets with QR codes; a request form anyone can use from a QR code; triage of requests into work orders or a polite decline; work orders with priority, assignee, due date, status, comments and photos; checklists with readings that must fall in a range; preventive maintenance schedules that create work orders on time and never stack; time and parts logged per work order; asset history; overdue and open lists; reports on time to complete and preventive maintenance done on time; CSV export.

### What this blueprint deliberately leaves out

Meter-based maintenance and IoT sensors, parts inventory and purchase orders (see the Inventory Tracker blueprint), external contractor portals, offline mode and mobile apps, real-time messaging, depreciation, multi-site permissions, and SSO.

## 3. Scope of v1

- One organization with a few locations, one time zone (Settings; default America/Chicago).
- The request form works without an account: the requester gives a name and email, and gets updates by email.
- Money is integer cents; time is whole minutes.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- A web app that works well on a phone, because technicians work on their feet.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Operations or facilities lead | Everything: settings, people, locations, assets, checklist templates, schedules, any work order, reports. |
| Technician | Maintenance staff | Triage requests, create and work on work orders, complete checklists, log time and parts, see assets and history. |
| Requester | Anyone, signed in or not | Submit a request from the form or a QR code, and see the status of their own requests through the link in their emails. |

The server enforces every permission. Only admins and technicians have accounts; requesters use the form.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): org_name, time_zone, due_days_high (0), due_days_medium (3), due_days_low (7), pm_lead_days (7).

**Person**: id, name, email (unique, lowercase), role: admin | technician, active.

**Location**: id, name, address. **Asset**: id, location_id, name, category, make_model, serial, qr_code (random, unique), active.

**Request**: id, number (REQ-0001), location_id, asset_id (optional), title, description, photos, requester_name, requester_email, status_token (random), status: new | converted | declined, decline_reason, work_order_id, created_at.

**WorkOrder**: id, number (WO-0001), title, description, location_id, asset_id (optional), priority: high | medium | low, assignee_id, due_on, status: open | in_progress | on_hold | done, hold_reason, completion_note, completed_at, request_id, schedule_id, created_by, created_at.

**ChecklistTemplate**: id, name, items: list of { label, kind: check | number | pass_fail, unit, min, max }.
**ChecklistItem** (per work order): work_order_id, position, label, kind, unit, min, max, value, done, flagged, na_reason.

**Schedule** (preventive maintenance): id, title, asset_id, location_id, checklist_template_id, every_n, every_unit: days | weeks | months, mode: fixed | after_completion, next_due_on, assignee_id, priority, active.

**TimeEntry**: work_order_id, person_id, minutes, note. **PartUsed**: work_order_id, name, quantity, unit_cost_cents.

**Comment**: work_order_id, author_id, body, photos, at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Work orders

| Action | Who | From | To | Rule |
|---|---|---|---|---|
| Convert request | Technician | request new | work order open | Priority required; due_on = today + the priority's due days unless set; requester emailed |
| Decline request | Technician | request new | declined | Reason required; requester emailed |
| Start | Assignee or admin | open | in_progress | |
| Hold | Assignee or admin | open or in_progress | on_hold | Reason required ("waiting for part") |
| Resume | Assignee or admin | on_hold | in_progress | |
| Complete | Assignee or admin | in_progress | done | Completion note required; every checklist item done or marked not applicable with a reason; requester emailed |
| Reopen | Admin | done | in_progress | Within 7 days, with a reason |

A work order is **overdue** when it is not done and today is after due_on. Reassigning emails the new assignee.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Situation | Result |
|---|---|
| A cook scans the ice machine's QR code and reports "Leaking onto the floor" | REQ-0032 for Ice machine, Downtown, with the asset filled in; the cook is emailed a status link |
| Raj converts REQ-0032 with priority Medium | WO-0105, due Sun Oct 18 (today + 3 days); the cook is emailed |
| Mia records 45°F on the walk-in check (range 33 to 40°F) | The item is flagged, and the form offers "Create a follow-up work order" |
| "Change HVAC filters", every 3 months, fixed, last due Jul 10 | WO-0099 was due Oct 10 and is 5 days overdue |
| "Clean ice machine", monthly, after completion, last completed Sep 20 | Next due Oct 20; WO-0100 was created on Oct 13 (7 days ahead) and is open |
| Completing WO-0103 (after resuming it) with an unchecked checklist item | Refused: "Finish or mark not applicable: Check door seal." |

## 7. Preventive maintenance

- A schedule creates its next work order pm_lead_days before next_due_on, with the schedule's checklist, assignee and priority, and due_on = next_due_on.
- **Fixed** schedules advance next_due_on by the interval from the previous due date, whenever the work is done. **After completion** schedules set next_due_on to the completion date plus the interval.
- A schedule never has two open work orders: if the previous one is still open when the next would be created, no new work order is created and the open one is flagged "Next due Nov 10 too" for fixed schedules.
- Months are calendar months; a due date on the 31st moves to the last day of shorter months.
- **On time** means completed on or before due_on. Preventive maintenance compliance for a period = preventive work orders due in that period completed on time ÷ preventive work orders due in that period.

## 8. Business rules

- **R1. Requests** need a location, a title (5 to 120 characters) and a valid email. Requests from a QR code have the asset and location filled in. Status links show only that request's status and public comments.
- **R2. Work orders** follow section 6. Completed work orders are read-only except for admin reopening within 7 days.
- **R3. Due dates** come from the priority (Settings) unless set by hand; high is due today.
- **R4. Checklists.** Number items outside min to max are flagged; a flagged item can be completed, but the completion form offers a follow-up work order with the reading in its description.
- **R5. Preventive maintenance** follows section 7, run by a daily job that is safe to run twice.
- **R6. Time and parts.** Minutes are whole and positive; parts need a name, a quantity and a unit cost (which may be zero). Work order and asset totals add them up.
- **R7. Visibility.** Requesters see only their own request through its status link; technicians see every work order and asset; admins see everything.
- **R8. Notifications** follow section 10. A failed email never blocks an action.
- **R9. Numbers** (REQ-, WO-) are sequential and never reused.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Work orders** (technician home): tabs for mine, open, overdue, on hold and done; sorted by overdue first, then priority, then due date.
2. **Work order page**: details, status actions, checklist, comments with photos, time and parts, and the asset's recent history.
3. **Requests**: new requests waiting for triage, with Convert and Decline.
4. **Request form** (public, /r/<location> or from an asset's QR code /a/<qr_code>): location, asset, title, description, photos, name and email. **Status page** (/s/<status_token>).
5. **Assets and locations**: list, QR label printing, and each asset's history with total time and parts cost.
6. **Preventive maintenance**: schedules, next due dates, and a calendar of upcoming work.
7. **Reports** (admin): open by priority, overdue, average time to complete, preventive maintenance compliance, cost by asset and by location; CSV export.
8. **Checklist templates**, **People**, **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Request received | Requester | "We got your request: Leaking onto the floor (REQ-0032)" with the status link |
| Request converted or declined | Requester | "REQ-0032 is now work order WO-0105" or "REQ-0032 was declined" with the reason |
| Assigned | Assignee | "Assigned to you: WO-0105, Ice machine leaking (due Sun Oct 18)" |
| Work order done | Requester, if it came from a request | "Fixed: Ice machine leaking" with the completion note |
| Daily at 07:00 | Admins and technicians with overdue work | "3 overdue work orders" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. The daily job (protected by a CRON_SECRET header) creates preventive work orders and sends the overdue digest.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so due dates, overdue lists and schedules can be tested by moving the clock.

## 12. Export

CSV of work orders for a date range: number, title, location, asset, priority, assignee, status, created, due, completed, minutes, parts cost, request number, schedule. CSV of preventive compliance by schedule.

## 13. Edge cases

- The same problem is reported twice: a technician links the second request to the first work order instead of converting it; both requesters get the updates.
- An asset is deactivated: its schedules are paused, and its QR code shows "This equipment is no longer in service. Report a problem with the location instead."
- A technician is deactivated: their open work orders return to unassigned and admins are emailed.
- A schedule's interval changes: next_due_on is recalculated from the last due date (fixed) or last completion (after completion).
- Photos larger than 10 MB are refused with a message; up to 5 photos per request or comment.

## 14. Seed data

Organization "Juniper Kitchens", two restaurants; time zone America/Chicago. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@juniperkitchens.example): Nora Diaz (admin, operations lead), Raj Patel (technician, lead), Mia Chen (technician).

Locations: Downtown, Eastside.

Assets: Walk-in cooler (Downtown), Ice machine (Downtown), Rooftop HVAC unit (Downtown), Dish machine (Eastside), Hood and exhaust (Eastside).

Checklist templates: "Walk-in cooler check" (Temperature, number, °F, 33 to 40; Door seal intact, pass/fail; Evaporator coils clean, check), "Ice machine cleaning" (Drain and sanitize, check; Replace water filter, check; Test ice quality, pass/fail).

Work orders:
- WO-0099 "Change HVAC filters", Rooftop HVAC unit, from the schedule, medium, Raj, due Oct 10, open (5 days overdue).
- WO-0100 "Clean ice machine", Ice machine, from the schedule, low, Mia, due Oct 20, open.
- WO-0101 "Walk-in cooler warm", Walk-in cooler, high, Raj, due today, in progress, from REQ-0030 by Tara Lane (tara@juniperkitchens.example).
- WO-0102 "Weekly walk-in check", Walk-in cooler, medium, Mia, due today, open, with the Walk-in cooler check.
- WO-0103 "Replace dish machine curtain", Dish machine, low, Mia, due Oct 22, on hold ("waiting for part"), with one checklist item "Check door seal" unchecked.
- WO-0104 "Fix back door latch", Eastside, medium, Raj, done Oct 13 (created Oct 9), 50 minutes, one part "Latch kit" at $24.00.

Requests: REQ-0031 "Mop sink drains slowly" (Eastside, from Leo Park, leo@example.com), new.

Schedules: "Change HVAC filters" (Rooftop HVAC unit, every 3 months, fixed, next due Oct 10, Raj, medium); "Clean ice machine" (Ice machine, every 1 month, after completion, last completed Sep 20, next due Oct 20, Mia, low, Ice machine cleaning); "Hood inspection" (Hood and exhaust, every 6 months, fixed, next due Jan 15, Raj, medium).

Last month's preventive work: 5 preventive work orders were due between Sep 1 and Sep 30, and 4 were completed on time.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, assets and requests

```
Using the Maintenance Requests blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in for admins and technicians with the platform's built-in auth or Google sign-in limited to our company email domain; a signed-in email must match an active Person, and anyone else sees "Ask the operations lead to add you."
3. Build Locations and assets with QR labels, the public Request form and Status page, Requests (section 9, screens 3 to 5), and the Work orders list and page read-only, with R1, R7 and R9.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Work orders shows WO-0099 first as overdue by 5 days, then the high-priority WO-0101 due today; the done tab shows WO-0104.
- [ ] Opening the Ice machine's QR link signed out shows the request form with Downtown and Ice machine filled in; submitting "Leaking onto the floor" creates REQ-0032 and shows its status link.
- [ ] The status link for REQ-0032 shows only that request, and a status link with a wrong token shows "Request not found."
- [ ] Signed out, opening a work order or the requests list asks for sign-in, and a direct request is refused.

### Phase 2: Working on work orders

```
Using the Maintenance Requests blueprint above, build Phase 2 only.

1. Build triage (convert and decline) and every work order action in section 6, with R2 to R4, checklists, comments with photos, and time and parts (R6).
2. Write the emails in section 10 except the daily digest to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Raj converts REQ-0031 with priority Medium: it becomes WO-0105 due Sun Oct 18, and Leo Park gets an email with the work order number.
- [ ] Declining a request without a reason is refused; with a reason, the requester gets an email with it.
- [ ] Mia enters 45 for Temperature on WO-0102: the item is flagged and she is offered a follow-up work order, which is created with the reading in its description.
- [ ] After resuming WO-0103, completing it with "Check door seal" unchecked is refused with "Finish or mark not applicable: Check door seal."; marking it not applicable with a reason lets it complete with a completion note.
- [ ] Raj logs 30 minutes and a "Gasket" part at $18.50 on WO-0101; the work order shows 30 minutes and $18.50, and the Walk-in cooler's history includes it.
- [ ] Completing WO-0101 emails Tara Lane "Fixed: Walk-in cooler warm" with the completion note.

### Phase 3: Preventive maintenance

```
Using the Maintenance Requests blueprint above, build Phase 3 only.

1. Build Preventive maintenance (section 9, screen 6) and the daily job (R5) exactly as section 7 describes, with the overdue digest.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Running the job today sends Raj the overdue digest listing WO-0099, and sends Mia none.
- [ ] With WO-0099 still open, moving the clock to Jan 3 and running the job creates no second HVAC work order and flags WO-0099 "Next due Jan 10 too".
- [ ] Then completing WO-0099 sets "Change HVAC filters" next due to Jan 10 (fixed), and completing WO-0100 sets "Clean ice machine" next due to Feb 3, one month after completion.
- [ ] Moving the clock to Jan 8 and running the job creates the HVAC filters work order due Jan 10 and the Hood inspection work order due Jan 15, both assigned to Raj; running it again creates nothing more.

### Phase 4: Reports and export

```
Using the Maintenance Requests blueprint above, build Phase 4 only.

1. Build Reports (section 9, screen 7) and the CSV exports (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The report for September shows preventive maintenance compliance of 80% (4 of 5 on time).
- [ ] Average time to complete over the last 30 days includes WO-0104 at 4 days, and cost by location shows Eastside at $24.00 and Downtown at $0.
- [ ] The work order export for this month lists every work order with its minutes and parts cost, and signed in as Mia the export is refused.

## 16. Variations

- Meter readings that trigger work orders (every 500 hours of run time).
- Parts stock levels from the Inventory Tracker blueprint.
- A portal for outside contractors to see and update their work orders.
- Vendor contacts and warranty dates on each asset.
- Work order requests from a Slack channel.
