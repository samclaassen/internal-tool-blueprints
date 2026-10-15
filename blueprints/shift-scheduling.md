<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/shift-scheduling . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Shift Scheduling

Blueprint BP-018 · Department: People · Replaces: When I Work (scheduling), the schedule spreadsheet, group texts
For teams of 10 to 100 hourly staff at one location.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"The schedule lives in a spreadsheet and every change happens by text."

A café, shop or clinic with hourly staff builds next week's schedule (the rota) in a spreadsheet, posts a photo of it in a group chat, and then handles every change by text: swaps agreed between two people that the manager never hears about, open shifts nobody claims, someone booked on a day they asked off, and a closing shift followed by an opening shift eight hours later.

This blueprint is a weekly schedule that the manager builds in draft and publishes, with conflicts checked as each shift is assigned. Staff see only published shifts, claim open shifts, and ask to swap or drop, and the manager approves every change. Hours, overtime and labor cost are visible before the week is published.

## 2. What the real product does

Research basis: When I Work's pricing page (wheniwork.com/pricing), October 2026.

What we verified:

1. **Price.** $2.50 per user per month for a single location or schedule, and $5 per user per month for multiple locations or schedules, billed month to month or annually, with a 14-day free trial that needs no credit card. Enterprise pricing is by contact.
2. **What every plan includes.** Employee scheduling, time tracking and attendance, and team messaging. The single-location plan lists auto scheduling, time-off and availability management, a built-in time clock, labor reports and forecasts, and payroll and point-of-sale integrations. The page's list for every plan adds custom scheduling rules and shift templates, GPS clock-in, shift swapping and open shift planning, overtime and break tracking, tips tracking, skills and certification management, shift confirmation alerts, task and document sharing, workplace announcements and live customer support.
3. **Multiple locations plan.** Unlimited job sites, schedules and locations, labor sharing between departments and locations, custom reporting and role permissions, multiple time zones and shift coverage views.

When I Work is inexpensive. For most teams the reason to build is fit and ownership (your own rules, data and integrations), not price.

### What this blueprint keeps

Positions (such as Barista or Kitchen) and who can work them; recurring weekly unavailability and approved time off; shift templates; a weekly schedule built in draft and then published; conflict checks as shifts are assigned (overlap, time off, position, availability, rest between shifts, weekly hours); open shifts that eligible staff claim and the manager approves; swaps that the other person accepts and the manager approves; drops that turn a shift into an open shift; hours and labor cost before publishing; emails when the published schedule changes; a personal calendar feed.

### What this blueprint deliberately leaves out

A time clock and GPS clock-in, payroll and point-of-sale integrations, auto scheduling and labor forecasting, team messaging, multiple locations and time zones, tips, breaks, task lists, and jurisdiction-specific scheduling laws (some cities and states require advance notice of schedules or extra pay for late changes; check what applies to you). These matter to multi-site operators. A single location needs a schedule people trust and a controlled way to change it.

## 3. Scope of v1

- One location and one time zone (Settings; default America/New_York).
- Shifts start and end on 15-minute steps, last 2 to 12 hours, and may cross midnight.
- Weeks run Monday to Sunday. A week is published as a whole; changes after publishing email the people affected.
- Money in integer cents; wages per hour per person.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- A web app that works well on a phone, because staff will use it on phones.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Manager | People with is_manager | Everything: positions, people, wages, templates, building and publishing weeks, approving claims, swaps, drops and time off, overriding warnings with a note, seeing labor cost. |
| Staff | Everyone else | See their own published shifts and the published schedule for their positions (names and times, never wages), set their own availability, request time off, claim open shifts, request swaps and drops, accept or decline swaps offered to them, subscribe to their calendar feed. |

Staff never see wages, labor cost, draft weeks, override notes or other people's time-off reasons. The server enforces all of this.

## 5. Data model

All IDs are strings. Timestamps are stored in UTC; shift times are entered and shown in the location's time zone.

**Settings** (one row)
- location_name, time_zone, min_rest_minutes (default 600)

**Person**
- id, name, email (unique, lowercase), phone (optional), is_manager, active
- wage_cents (integer per hour), max_weekly_minutes (default 2400, which is 40 hours), calendar_token (random, unique)

**Position**
- id, name (unique, such as Barista, Kitchen, Shift lead)

**PersonPosition**
- person_id, position_id; unique pair. Only people who hold a position can work or claim its shifts.

**Availability** (recurring weekly unavailability)
- id, person_id, weekday (1 is Monday, 7 is Sunday), start_time, end_time ("HH:MM"; a whole day is 00:00 to 24:00), note

**TimeOff**
- id, person_id, start_date, end_date, status: requested | approved | declined, reason (managers only), decided_by

**Template**
- id, name (such as "Opening"), position_id, start_time, end_time, weekdays (list)

**Week**
- id, week_start (a Monday, unique), status: draft | published, published_at, published_by

**Shift**
- id, week_id, position_id, starts_at, ends_at, person_id (empty means an open shift), note (optional)
- override_note (required when a manager saves a shift despite a warning, R4)

**ShiftRequest**
- id, kind: claim | swap | drop, shift_id, requested_by, target_person_id (swaps only), reason (drops)
- status: pending_target (swaps) | pending_manager | approved | declined | cancelled, decided_by, decided_at

**Event** (append-only): id, at, actor_id, type, shift_id or week_id, data (JSON).
**Notification** (outbox): id, kind, to_email, subject, body, status: queued | sent | failed | logged, error, created_at, sent_at.

## 6. Conflict checks

Run these whenever a shift is created, edited or assigned, and again when a claim, swap or drop is approved. Hard conflicts block; warnings need a manager's override note. Show every conflict that applies, not only the first.

**Hard conflicts (always refused)**
- **Overlap:** the person already has a shift that overlaps this one.
- **Approved time off:** the shift touches a date inside the person's approved time off.
- **Position:** the person does not hold the shift's position.
- **Inactive person.**

**Warnings (a manager can save anyway with an override note)**
- **Unavailable:** the shift overlaps the person's recurring unavailability.
- **Short rest:** less than min_rest_minutes (10 hours) between the end of one of the person's shifts and the start of the next. Exactly 10 hours is fine.
- **Weekly hours:** the person's scheduled minutes in that week would go over max_weekly_minutes. Exactly the maximum is fine.

Staff cannot override warnings: a claim or swap that would create a warning for the person taking the shift is refused with the warning's text.

### Worked examples (seed data in section 14; the draft week starts Monday, October 19, 2026)

| Change | Result |
|---|---|
| Reassign Tuesday's opening shift (Barista, 06:00 to 14:00) from Ben Cho to Jo Park | Warning: "Jo is unavailable on Tuesdays (classes)." A manager can save it with an override note. |
| Reassign Friday's opening shift (06:00 to 14:00) from Jo Park to Ana Lima, who closes Thursday at 22:00 | Warning: "Only 8 hours of rest after Thursday's shift (10 hours minimum)." |
| Assign Ben Cho (32 hours scheduled, 35 maximum) the open Saturday shift, 08:00 to 16:00 | Warning: "Ben would have 40 hours this week (35 maximum)." |
| Assign Kai Brooks to Saturday's kitchen shift | Refused: "Kai has approved time off Oct 24 to 25." |
| Assign Lee Grant to Wednesday's kitchen shift | Refused: "Lee isn't set up for Kitchen." |

## 7. Changes after publishing

Eligible means active and holding the shift's position.

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Publish week | Manager | draft week | published | Each person with shifts gets one email listing their shifts; each open shift is announced to everyone eligible |
| Edit or reassign a published shift | Manager | published | published | Affected people emailed with before and after; conflict checks apply; pending requests on the shift are cancelled and their people told |
| Claim open shift | Eligible staff | open | pending_manager | Conflict checks for the claimant; several claims can wait on one shift, in the order they were made |
| Request swap | The shift's person | assigned | pending_target | The target must be eligible; target emailed |
| Accept swap | Target | pending_target | pending_manager | Conflict checks for the target |
| Request drop | The shift's person | assigned | pending_manager | Reason required |
| Approve | Manager | pending_manager | approved | Claim: assign the claimant and decline the other claims on that shift; swap: reassign to the target; drop: the shift becomes open and is announced; everyone involved emailed |
| Decline | Manager, or the target of a swap | pending | declined | Requester emailed; nothing changes |
| Cancel | Requester | any pending | cancelled | Nothing changes |

An assigned shift has at most one pending swap or drop. Requests on shifts that have already started are refused. Draft weeks are invisible to staff.

## 8. Business rules

- **R1. Shift shape.** 15-minute steps, 2 to 12 hours, may cross midnight; a shift belongs to the day and week in which it starts.
- **R2. Publishing.** Publishing is all or nothing for a week. A week with any hard conflict cannot be published, and every warning must have an override note.
- **R3. Visibility.** Staff see published shifts for positions they hold (names and times), their own shifts and requests, and open shifts they are eligible for. They never see wages, labor cost, override notes or time-off reasons.
- **R4. Overrides.** Saving a shift with a warning requires the manager's override note (5 to 200 characters), stored on the shift and in the event log. Editing the shift again asks for the note again if a warning still applies.
- **R5. Time off.** Staff request time off; managers approve or decline. Approving time off that clashes with the person's shifts (draft or published) is refused until those shifts are reassigned or opened: "Ben has 1 shift on Oct 19. Reassign it first."
- **R6. Labor cost.** Shift cost is minutes times wage_cents divided by 60, rounded to the cent, using the assigned person's current wage. Open shifts are costed at the average wage of active people who hold the position. Totals by day and for the week, visible to managers only. With the seed data, the open Saturday shift is $144.00 (8 hours at the $18.00 average Barista wage).
- **R7. Calendar feed.** Each person's feed (/calendar/<calendar_token>.ics) lists their published shifts from 14 days ago to 60 days ahead, with position and times. Regenerating the token disables the old link.
- **R8. People.** Deactivating a person with future shifts is refused until those shifts are reassigned or opened.
- **R9. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Schedule** (manager home). A week grid: one row per person and a row for open shifts, one column per day, shifts as blocks labelled with position and times, warnings marked. A side panel shows each person's hours against their maximum; a footer shows hours and labor cost per day and for the week. Actions: add a shift (from a template or blank), copy last week into a new draft, publish.
2. **My shifts** (staff home, built for phones). Upcoming published shifts by day with Request swap and Request drop, open shifts I can claim, and my pending requests.
3. **Requests** (manager). Pending claims, swaps, drops and time-off requests, oldest first, with each one's conflict check already shown.
4. **People and positions** (manager): wages, positions, maximum hours, active. **Availability**: each person edits their own; managers see everyone's. **Time off**.
5. **Templates**, **Settings** and **Outbox** (manager).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Publish | Each person with shifts | "Your shifts for the week of Oct 19" |
| Published shift changed | Affected people | "Your shift on Mon Oct 19 changed" (before and after) |
| Open shift announced | Each eligible person | "Open shift: Barista, Sat Oct 24, 08:00 to 16:00" |
| Swap requested | Target | "Jo Park asked you to take her shift on Sat Oct 17" |
| Request decided | Requester (and target for swaps) | "Approved: your swap for Sat Oct 17" |
| Time off decided | Requester | "Time off Nov 2: approved" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by an hourly job (protected by a CRON_SECRET header). A failed notification never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset. Times are entered and shown in the location's time zone; store UTC and convert for display so daylight-saving changes are handled.

## 12. Export and print

Managers can export a week as CSV (person or "Open", position, date, start, end, hours, cost) for payroll, and print the week grid on one landscape page.

## 13. Edge cases

- A shift from 22:00 to 06:00 crosses midnight: it counts for the day and week it starts in.
- Two people claim the same open shift: both wait in order, the second shown as "2nd in line"; approving one declines the other and emails them.
- A manager reassigns a shift that has a pending swap or drop: the request is cancelled and both people are told.
- A manager edits a published shift so that a warning applies: the override note is required again.
- Someone changes their availability after the week is published: existing shifts stay; the warning shows the next time the shift is edited.

## 14. Seed data

Settings: location "Harbor Café", time zone America/New_York. Dates below assume today is Thursday, October 15, 2026. When loading, shift them so the published week is the current week and the draft week is next week.

Positions: Barista, Kitchen, Shift lead.

People (emails firstname@harborcafe.example; 40-hour maximum unless noted):

| Person | Positions | Wage | Notes |
|---|---|---|---|
| Rosa Diaz | Shift lead | $26.00 | Manager |
| Ana Lima | Barista, Shift lead | $19.00 | |
| Ben Cho | Barista | $17.50 | 35-hour maximum |
| Jo Park | Barista | $17.00 | Unavailable all day on Tuesdays: "classes" |
| Lee Grant | Barista | $17.00 | |
| Sam Okafor | Barista, Kitchen | $19.50 | |
| Kai Brooks | Kitchen | $18.50 | Approved time off Oct 24 to 25 |
| Mia Torres | Kitchen | $18.50 | |

Templates: Opening (Barista, 06:00 to 14:00, Mon to Fri), Closing (Barista, 14:00 to 22:00, Mon to Fri), Weekend barista (Barista, 08:00 to 16:00, Sat and Sun), Kitchen (Kitchen, 07:00 to 15:00, every day), Shift lead (Shift lead, 10:00 to 18:00, Mon to Fri).

Week of Oct 19 (draft), 24 shifts of 8 hours:

| Template | Mon 19 | Tue 20 | Wed 21 | Thu 22 | Fri 23 | Sat 24 | Sun 25 |
|---|---|---|---|---|---|---|---|
| Opening | Ben | Ben | Ben | Ben | Jo | | |
| Closing | Lee | Lee | Ana | Ana | Sam | | |
| Weekend barista | | | | | | Open | Jo |
| Kitchen | Mia | Mia | Kai | Kai | Mia | Mia | Sam |
| Shift lead | Rosa | Rosa | Rosa | Rosa | Rosa | | |

That is 192 hours and $3,792.00 of labor, $632.00 of it on Monday. Nobody has a conflict.

Week of Oct 12 (published): the same assignments, except that Jo Park also works Saturday's weekend barista shift, Oct 17. Jo has asked Lee Grant to take that shift as a swap; the request is waiting for Lee.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Shift Scheduling blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth, Google sign-in limited to our company email domain, or email magic links if staff use personal email. A signed-in email must match an active Person; anyone else sees "Ask your manager to add you."
3. Build People and positions, Availability, Time off, Templates and Settings (section 9, screens 4 and 5), with managers-only screens enforced on the server, and rules R5 and R8.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build the schedule grid yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Rosa, People shows the eight people with their positions and wages; signed in as Ben, wages are not visible anywhere and a direct request for them is refused.
- [ ] Jo marks herself unavailable on Wednesdays from 18:00 to 22:00 and sees it on her availability; she cannot edit Ben's.
- [ ] Ben requests Monday Oct 19 off and Rosa's approval is refused with "Ben has 1 shift on Oct 19. Reassign it first."; Ben requests Monday Nov 2 instead, Rosa approves it, and Ben's email appears in the outbox.
- [ ] Deactivating Ana Lima is refused because she has future shifts.

### Phase 2: Building and publishing the week

```
Using the Shift Scheduling blueprint above, build Phase 2 only.

1. Build the Schedule grid (section 9, screen 1) with add, edit, assign, open, copy last week and publish.
2. Implement every conflict check in section 6, override notes (R4), publishing (R2) and labor cost (R6), all on the server.
3. Write the publish, changed-shift and open-shift emails (section 10) to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Reassigning Tuesday's opening shift from Ben Cho to Jo Park shows "Jo is unavailable on Tuesdays (classes)." and will not save without an override note; cancel it.
- [ ] Reassigning Friday's opening shift from Jo Park to Ana Lima warns "Only 8 hours of rest after Thursday's shift (10 hours minimum)."; cancel it.
- [ ] Assigning Ben Cho the open Saturday shift warns "Ben would have 40 hours this week (35 maximum)."; saving it with the note "Covering this week" stores the note in the event log; then make the shift open again.
- [ ] Assigning Kai Brooks to Saturday's kitchen shift is refused with "Kai has approved time off Oct 24 to 25.", and assigning Lee Grant to Wednesday's kitchen shift is refused with "Lee isn't set up for Kitchen."
- [ ] The footer shows Monday at $632.00 and the week at 192 hours and $3,792.00, with the open Saturday shift costed at $144.00.
- [ ] Publishing the week of Oct 19 emails each of the eight people with shifts exactly once, announces the open Saturday shift to the five baristas, and makes the week visible to staff.
- [ ] After publishing, changing Lee Grant's Monday closing shift to start at 15:00 emails Lee the before and after times.

### Phase 3: My shifts, claims, swaps and drops

```
Using the Shift Scheduling blueprint above, build Phase 3 only.

1. Build My shifts (section 9, screen 2) for phones, and Requests for managers (screen 3).
2. Implement claims, swaps and drops exactly as section 7 describes, with conflict checks for the person taking the shift, R3 visibility, and the emails in section 10.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Lee Grant, My shifts shows Jo's swap request for Saturday Oct 17; accepting it puts it in Rosa's Requests, and Rosa's approval moves the shift to Lee and emails both.
- [ ] Signed in as Ben, claiming the open Saturday Oct 24 shift is refused with "Ben would have 40 hours this week (35 maximum)."
- [ ] Signed in as Lee, claiming the same shift puts the claim in Rosa's Requests; a later claim by Ana shows as "2nd in line"; approving Lee's claim assigns the shift to Lee and declines Ana's claim with an email to her.
- [ ] Signed in as Mia Torres (Kitchen only), the open Barista shift is not offered, and a direct claim request for it is refused.
- [ ] Ana asks to drop her Wednesday Oct 21 shift with a reason; after Rosa approves, the shift is open and announced to the baristas.
- [ ] Rosa copies the week of Oct 19 into a draft for Oct 26; signed in as Ben, that week is not visible, and a direct request for its shifts is refused.

### Phase 4: Calendar feed, export and print

```
Using the Shift Scheduling blueprint above, build Phase 4 only.

1. Build the calendar feed (R7) with link regeneration.
2. Build the CSV export and the one-page print view (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Ben's calendar feed lists his published shifts with position and times and nothing from the draft week of Oct 26; after he regenerates the link, the old link returns Not found.
- [ ] Exporting the week of Oct 19 downloads a CSV with one row per shift, hours and cost, with Ana's dropped Wednesday shift shown as Open.
- [ ] The print view fits the week of Oct 19 on one landscape page.

## 16. Variations

- A time clock that compares clock-in and clock-out with scheduled times.
- Auto-fill: suggest the eligible person with the fewest hours and no warnings.
- Shift confirmations: staff confirm they have seen a changed shift.
- Text messages for same-day changes.
- Several locations with a location filter.
- Rules for local scheduling laws (advance notice, extra pay for late changes).
