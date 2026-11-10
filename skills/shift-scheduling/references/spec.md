<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/shift-scheduling . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

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
- Sign-in cookies are HttpOnly and SameSite=Lax, and the server refuses form posts that come from another site.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Manager | People with is_manager | Everything: positions, people, wages, templates, building and publishing weeks, approving claims, swaps, drops and time off, overriding warnings with a note, seeing labor cost. |
| Staff | Everyone else | See their own published shifts and the published schedule for their positions (names and times, never wages), set their own availability, request time off, claim open shifts, request swaps and drops, accept or decline swaps offered to them, subscribe to their calendar feed. |

Staff never see wages, labor cost, draft weeks, override notes or other people's time off (dates or reasons); a person sees their own time-off requests and reasons. The server enforces all of this.

Managers also work shifts (Rosa is a Shift lead), so they have My shifts and can request swaps and drops like anyone else; a manager may approve their own request.

Availability: staff see and edit only their own; managers see and edit everyone's.

Sign-in: a stand-in sign-in form is fine in development, but production needs Google sign-in limited to the company domain or email magic links. Emails are compared trimmed and lowercase. Unknown and inactive emails both see "Ask your manager to add you.", and deactivating someone ends their signed-in sessions. The development "sign in as" switcher lists everyone, inactive people included, and runs the same check. On an empty production database the first manager is created from a setting (BOOTSTRAP_MANAGER_EMAIL and BOOTSTRAP_MANAGER_NAME); the seed data loads only in development.

People and positions: the last active manager can't be deactivated or lose is_manager. Taking a position away from someone who still has future shifts in it is refused, like R8, until those shifts are reassigned or opened. Position names are unique ignoring case; positions can be renamed, and deleted only when no person, template or shift uses them.

## 5. Data model

All IDs are strings. Timestamps are stored in UTC; shift times are entered and shown in the location's time zone. Sign-in sessions and the development clock offset are kept outside this model.

**Settings** (one row)
- location_name, time_zone (an IANA name such as America/New_York), min_rest_minutes (default 600, 0 to 1440)
- Changing the time zone doesn't rewrite shifts: they are stored as UTC instants, so their local times shift with it. Set it before scheduling.

**Person**
- id, name, email (unique, lowercase), phone (optional), is_manager, active
- wage_cents (integer per hour), max_weekly_minutes (default 2400, which is 40 hours), calendar_token (random, unique, at least 32 characters, created with the person)
- Managers enter wages in dollars ("17.50" or "$17.50") and maximum hours in hours on 15-minute steps (35 or 37.5); the app stores cents and minutes. The phone number is free text up to 40 characters.

**Position**
- id, name (unique, such as Barista, Kitchen, Shift lead)

**PersonPosition**
- person_id, position_id; unique pair. Only people who hold a position can work or claim its shifts.

**Availability** (recurring weekly unavailability)
- id, person_id, weekday (1 is Monday, 7 is Sunday), start_time, end_time ("HH:MM" on 15-minute steps; a whole day is 00:00 to 24:00), note (optional, up to 200 characters)
- Start is before end; unavailability that crosses midnight is two entries. Entries may overlap. Changing availability never changes existing shifts (section 13).

**TimeOff**
- id, person_id, start_date, end_date, status: requested | approved | declined, reason (optional, up to 300 characters; seen only by the person and managers), decided_by, created_at
- Staff request time off for themselves; a manager may enter a request for any active person, and it still needs a decision. The start date can't be in the past; the end date defaults to the start date. Overlapping requests are allowed. Requests can't be withdrawn, and a decision is final.

**Template**
- id, name (such as "Opening"; names need not be unique), position_id, start_time, end_time, weekdays (a list of weekday numbers 1 to 7, at least one)
- Templates follow R1: an end at or before the start ends the next day, and the length is 2 to 12 hours on 15-minute steps. Shifts don't refer to templates, so a template can be deleted at any time.

**Week**
- id, week_start (a Monday, unique), status: draft | published, published_at, published_by

**Shift**
- id, week_id, position_id, starts_at, ends_at, person_id (empty means an open shift), note (optional; shown to managers and in the assigned person's emails, not on the staff schedule)
- override_note (required when a manager saves a shift despite a warning, R4)

**ShiftRequest**
- id, kind: claim | swap | drop, shift_id, requested_by, target_person_id (swaps only), reason (drops only: required, up to 300 characters, seen by the requester and managers), created_at
- status: pending_target (swaps) | pending_manager | approved | declined | cancelled, decided_by, decided_at. Declines, cancels and the automatic decline of competing claims also set decided_by (the manager, the target, the requester or the approving manager) and decided_at.

**Event** (append-only): id, at, actor_id, type, shift_id or week_id, data (JSON).
**Notification** (outbox): id, kind, to_email, subject, body, status: queued | sent | failed | logged, error, created_at, sent_at.

## 6. Conflict checks

Run these whenever a shift is created, edited or assigned, and again when a claim, swap or drop is approved. Hard conflicts block; warnings need a manager's override note. Show every conflict that applies, not only the first: warnings are listed alongside hard conflicts, and an override note never unlocks a hard conflict. Open shifts have no conflicts.

The checks look at all of the person's shifts in any week, draft or published. Weekly hours add up the shifts in the week the new shift starts in. A shift "touches" a date when it overlaps that calendar day in the location's time zone; a shift ending exactly at 00:00 doesn't touch the next day.

**Hard conflicts (always refused)**
- **Overlap:** the person already has a shift that overlaps this one.
- **Approved time off:** the shift touches a date inside the person's approved time off.
- **Position:** the person does not hold the shift's position.
- **Inactive person.**

**Warnings (a manager can save anyway with an override note)**
- **Unavailable:** the shift overlaps the person's recurring unavailability.
- **Short rest:** less than min_rest_minutes (10 hours) between the end of one of the person's shifts and the start of the next, checked before and after the new shift. Exactly 10 hours is fine; back-to-back shifts (0 hours of rest) are a warning.
- **Weekly hours:** the person's scheduled minutes in that week would go over max_weekly_minutes. Exactly the maximum is fine.

Staff cannot override warnings: a claim or swap that would create a warning (or a hard conflict) for the person taking the shift is refused with its text, for example "You can't claim this shift: Ben would have 40 hours this week (35 maximum)." When a manager approves a request and a warning has appeared since it was made (say the person changed their availability), the manager may approve with an override note (R4); hard conflicts always block approval.

Messages for the other cases: "Jo already has a shift that overlaps: Sun Oct 25, 08:00 to 16:00, Barista." · "Sam is inactive." · "Jo is unavailable on Wednesdays 18:00 to 22:00." (the note in brackets when there is one) · "Only 8 hours of rest before Friday's shift (10 hours minimum)." · hours with a fraction are written "7.5 hours".

### Worked examples (seed data in section 14; the draft week starts Monday, October 19, 2026)

| Change | Result |
|---|---|
| Reassign Tuesday's opening shift (Barista, 06:00 to 14:00) from Ben Cho to Jo Park | Warning: "Jo is unavailable on Tuesdays (classes)." A manager can save it with an override note. |
| Reassign Friday's opening shift (06:00 to 14:00) from Jo Park to Ana Lima, who closes Thursday at 22:00 | Warning: "Only 8 hours of rest after Thursday's shift (10 hours minimum)." |
| Assign Ben Cho (32 hours scheduled, 35 maximum) the open Saturday shift, 08:00 to 16:00 | Warning: "Ben would have 40 hours this week (35 maximum)." |
| Assign Kai Brooks to Saturday's kitchen shift | Refused: "Kai has approved time off Oct 24 to 25." |
| Assign Lee Grant to Wednesday's kitchen shift | Refused: "Lee isn't set up for Kitchen." |

## 7. Changes after publishing

Eligible means active and holding the shift's position. Managers can add, edit, reassign, open and delete shifts in any week, including shifts that have already started.

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Publish week | Manager | draft week | published | Each person with shifts gets exactly one "Your shifts" email listing their shifts; separately, each open shift is announced to everyone eligible |
| Edit, reassign or open a published shift, or add one to a published week | Manager | published | published | Affected people emailed with before and after; conflict checks apply; pending requests on the shift are cancelled and their people told. A shift that becomes open, or an open shift whose time or position changes, is announced to everyone eligible except the person who just lost it |
| Delete a shift | Manager | any | deleted | Refused if the shift has any request history (open or reassign it instead); in a published week the person is emailed |
| Claim open shift | Eligible staff | open | pending_manager | Conflict checks for the claimant; several claims can wait on one shift, in the order they were made |
| Request swap | The shift's person | assigned | pending_target | The target must be eligible and someone else (the form lists active colleagues who hold the position); only eligibility is checked now, so the requester never sees the target's time off or hours; target emailed. A swap hands the shift over; it is not an exchange of two shifts, and it has no reason |
| Accept swap | Target | pending_target | pending_manager | Conflict checks for the target, with no overrides |
| Request drop | The shift's person | assigned | pending_manager | Reason required |
| Approve | Manager | pending_manager | approved | Claim: assign the claimant and decline the other claims on that shift (the manager may approve any claim, not only the first in line); swap: reassign to the target; drop: the shift becomes open, its override note is cleared, and it is announced to everyone eligible except the person who dropped it; everyone involved gets the "Request decided" email, which replaces the "shift changed" email |
| Decline | Manager, or the target of a swap | pending | declined | Requester emailed; nothing changes |
| Cancel | Requester | any pending | cancelled | Nothing changes |

An assigned shift has at most one pending swap or drop. Requests on shifts that have already started are refused: creating a claim, swap or drop, accepting a swap and approving are all refused once the shift's start time has passed, while declining and cancelling stay possible. Approval is also refused if the shift no longer matches the request (a claimed shift that is no longer open, or a swap or drop on a shift that is no longer the requester's). Draft weeks are invisible to staff.

Copy last week copies the week immediately before into a new draft (or into an existing empty draft) with the same local times, positions, people and notes. A copied assignment that would have a hard conflict in the new week becomes an open shift, and the message lists them; override notes are not copied, so warnings need a note again. A manager can also start a blank draft.

## 8. Business rules

- **R1. Shift shape.** 15-minute steps, 2 to 12 hours of real elapsed time (so daylight-saving nights count correctly), may cross midnight: an end at or before the start ends the next day. A shift belongs to the day and week in which it starts, and editing can't move it into another week.
- **R2. Publishing.** Publishing is all or nothing for a week. A week with any hard conflict cannot be published, every warning must have an override note, and a week with no shifts can't be published. There is no unpublish.
- **R3. Visibility.** Staff see published shifts for positions they hold (names and times), their own shifts and requests, swaps offered to them, and open shifts they are eligible for. They never see wages, labor cost, override notes or other people's time off. A staff request for a shift they can't see (a draft week, another position, someone else's request) gets 404, as if it didn't exist; a claim on a visible shift they aren't eligible for gets 403 "You can only claim open shifts for positions you hold."; refusals are shown on the page they came from with the reason.
- **R4. Overrides.** Saving a shift with a warning requires the manager's override note (5 to 200 characters after trimming), stored on the shift and in the event log. One note covers all of the shift's warnings. Editing the shift again asks for the note again (the box starts empty) if a warning still applies; the note is cleared when the shift is saved with no warning.
- **R5. Time off.** Staff request time off; managers approve or decline. Approving time off that clashes with the person's assigned shifts (draft or published, in any week, past or future; open shifts don't count) on any date the time off covers is refused until those shifts are reassigned or opened: "Ben has 1 shift on Oct 19. Reassign it first.", or with more than one, "Ben has 2 shifts on Oct 19 and Oct 20. Reassign them first." Managers see the clash on the request before deciding.
- **R6. Labor cost.** Shift cost is minutes times wage_cents divided by 60, rounded to the cent, using the assigned person's current wage. Open shifts are costed at the average wage of active people who hold the position. Totals by day and for the week, visible to managers only. With the seed data, the open Saturday shift is $144.00 (8 hours at the $18.00 average Barista wage).
- **R7. Calendar feed.** Each person's feed (/calendar/<calendar_token>.ics, served as text/calendar) lists their own shifts in published weeks that overlap the window from 14 days before now to 60 days after now, with position and times. It needs no sign-in, because calendar apps can't sign in: the token is the only key. An unknown or replaced token, or an inactive person's token, returns 404 "Not found." (reactivating the person brings the same link back). Each event's UID is the shift id, so an edited shift updates in place; DTSTART and DTEND are UTC; SUMMARY is "Barista shift, 06:00 to 14:00" and DESCRIPTION repeats the position, day and local times. Open shifts, drafts, wages, costs and override notes never appear. The feed suggests a 1-hour refresh. Regenerating the token disables the old link. Each person can regenerate their own link; a manager can make a new link for anyone (say after a lost phone) without seeing it. Regenerating writes an event without the token and sends no email. The link shown in the app uses the PUBLIC_URL setting as its address.
- **R8. People.** Deactivating a person with future shifts (assigned shifts that haven't ended, draft or published) is refused until those shifts are reassigned or opened: "Ana has 3 future shifts (Thu Oct 15, Wed Oct 21 and Thu Oct 22). Reassign or open them before deactivating Ana." This applies to the Deactivate button and to unticking Active.
- **R9. Events.** Every change writes an event, including changes to people, positions, availability, time off, templates, settings, requests and the development clock; sign-ins and refused attempts don't. Events are never edited or deleted; the only exception is "reset to seed data" in development, which recreates everything.

## 9. Screens

1. **Schedule** (manager home). A week grid: a row for open shifts first, then one row per active person in alphabetical order (plus any inactive person who still has shifts that week), one column per day, shifts as blocks labelled with position, times and (for managers) cost, warnings marked. A side panel shows each person's hours against their maximum; a footer shows hours and labor cost per day and for the week. It opens on the first draft week from the current week on, otherwise the current week, with previous and next buttons. Actions: add a shift (from a template or blank), copy last week into a new draft, start a blank draft, publish. On a phone the grid scrolls sideways with the name column fixed, and the hours panel moves below it. Staff get a read-only Schedule of published weeks for their positions (names and times only); a draft week, asked for directly, is 404.
2. **My shifts** (staff home, built for phones). Swaps offered to me (Accept or Decline); all my published shifts that haven't ended, by day, with Request swap and Request drop (a shift that has started shows "Started" with no actions); open shifts I can claim, with my place in line once I've claimed; my pending requests with Cancel; up to 10 recently decided requests from the last 7 days; and a link to My calendar link, which shows my feed link, how to subscribe, a preview of what the feed holds and Make a new link.
3. **Requests** (manager). Everything waiting for a manager: pending_manager claims, swaps and drops and requested time off, in one list, oldest first by created_at, with each one's conflict check already shown (claims for the claimant, swaps for the target, drops with how many eligible people the open shift will be announced to, time off with the R5 clash) and each claim's place in line. A warning turns Approve into "Approve with override note"; a hard conflict leaves only Decline. Below: swaps still waiting for their target (a manager may decline them) and recently decided requests. The menu shows a count of what waits.
4. **People and positions** (manager): wages, positions, maximum hours, active. **Availability**: each person edits their own; managers see and edit everyone's. **Time off**.
5. **Templates**, **Settings**, **Outbox** and **Event log** (manager). The Event log lists events newest first, and each shift's page shows its own history, including override notes.

Until the Schedule (Phase 2) and My shifts (Phase 3) exist, the home page is a page of links to the screens built so far.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Publish | Each person with shifts | "Your shifts for the week of Oct 19" |
| Published shift changed by a manager | Affected people | "Your shift on Mon Oct 19 changed" (before and after). The same subject covers every kind of change; the person losing a shift gets its old date, the person gaining it the new date. Changes to only the note or the override note send nothing |
| Open shift announced | Each eligible person | "Open shift: Barista, Sat Oct 24, 08:00 to 16:00" |
| Swap requested | Target | "Jo Park asked you to take their shift on Sat Oct 17" |
| Request decided | Requester (and target for swaps) | "Approved: your swap for Sat Oct 17" or "Declined: your claim for Sat Oct 24". Both people in a swap get the same subject, with a body written for each. Claims declined because another claim was approved get "Declined: your claim for Sat Oct 24" with "The shift went to Lee Grant." in the body. When the target declines a swap, only the requester is emailed |
| Request cancelled | The target of a swap the requester cancelled; the people on requests a manager's edit cancelled | "Cancelled: Ben Cho's swap for Mon Oct 19", "Cancelled: your claim for Sun Oct 25" |
| Time off decided | Requester | "Time off Nov 2: approved", "Time off Nov 2 to 4: declined" |

No email is sent when a claim is made, a drop is requested, a swap is accepted, or time off is requested: managers see those on Requests, and the requester sees the status on My shifts.

Write every email to the outbox first, then send it after the change is saved. With no provider configured, set status logged. Failed sends, and emails stuck in queued for more than 5 minutes, are retried by an hourly job: POST /jobs/retry-notifications with the header "Authorization: Bearer <CRON_SECRET>"; with CRON_SECRET unset, the job refuses every call. A failed notification never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset. Times are entered and shown in the location's time zone; store UTC and convert for display so daylight-saving changes are handled. "Today", "the current week" and "Thursday" are all worked out in the location's time zone.

## 12. Export and print

Managers can export a week as CSV (person or "Open", position, date, start, end, hours, cost) for payroll, and print the week grid on one landscape page. Both work for any week that exists, draft or published; a draft is marked (the file name ends "-draft", the print view says DRAFT). Staff get 403 on both, because the CSV holds costs.

- **CSV.** Header Person,Position,Date,Start,End,Hours,Cost, then one row per shift and no totals row: dates as 2026-10-19, times as 24-hour HH:MM in the location's time zone, hours with two decimals (8.00), cost in dollars with two decimals and no $ (144.00, using R6). Rows are grouped by person A to Z, then by start time, with Open rows last. A shift crossing midnight has its start date and an End earlier than Start, which means the next day (R1). The file is UTF-8 with a byte order mark and CRLF line endings, fields with commas, quotes or line breaks are quoted, and a text cell starting with =, +, - or @ gets a leading ' so a spreadsheet never runs it as a formula. The file is named harbor-cafe-week-of-2026-10-19.csv.
- **Print.** A separate page with no navigation, set to landscape with @page. Because printed schedules get posted where staff see them, the default copy shows hours only; a managers' copy adds the labor rows. It shows the open shifts row and the people with shifts that week, with each person's hours and each day's hours. The font size is chosen so the grid fits one A4 landscape page (which also fits US Letter) for up to 60 people with shifts, printing each shift on one line when space is short.

## 13. Edge cases

- A shift from 22:00 to 06:00 crosses midnight: it counts for the day and week it starts in.
- Two people claim the same open shift: both wait in order, the second shown as "2nd in line"; approving one declines the other and emails them.
- A manager reassigns a shift that has a pending swap or drop: the request is cancelled and both people are told.
- A manager edits a published shift so that a warning applies: the override note is required again.
- Someone changes their availability after the week is published: existing shifts stay; the warning shows the next time the shift is edited.

## 14. Seed data

Settings: location "Harbor Café", time zone America/New_York. Dates below assume today is Thursday, October 15, 2026. When loading, shift them so the published week is the current week and the draft week is next week, every date by the same number of days. Reset to seed data uses the real date to find the current week and then sets the development clock to 09:00 on the Thursday of that week, even if that is earlier than now, so the checks never fall on a shift that has already started.

The acceptance checks quote the dates as if today were Thursday, October 15, 2026. Add a development setting that pins the seed's "today" to that date so the checks match word for word, and show the mapping in the development bar (for example "Oct 19 = Nov 9"); on any other day, read every date in the checks shifted by the same number of days.

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
| Kai Brooks | Kitchen | $18.50 | Approved time off Oct 24 to 25 (no reason, decided by Rosa) |
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

Week of Oct 12 (published): the same 24 shifts and assignments, except that the Saturday weekend barista shift, Oct 17, which is open in the draft week, is Jo Park's, so the published week has no open shift. It was published by Rosa at 09:00 on the Thursday before it (Oct 8). Jo has asked Lee Grant to take that Saturday shift as a swap; the request is waiting for Lee.

Loading the seed writes a single "seed loaded" event; it doesn't invent history for the seeded week, time off or swap.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start the checks of Phases 1 and 2 from a fresh load of the seed (the reset button); Phase 3's checks continue from the end of Phase 2's, and Phase 4's from the end of Phase 3's. Checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Shift Scheduling blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth, Google sign-in limited to our company email domain, or email magic links if staff use personal email. A signed-in email must match an active Person; anyone else sees "Ask your manager to add you."
3. Build People and positions, Availability, Time off, Templates, Settings and the Outbox (section 9, screens 4 and 5), with managers-only screens enforced on the server, and rules R5 and R8.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock to 09:00 on the Thursday of the current week, team time; section 14), all visible only in development.

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
3. Write the publish, changed-shift and open-shift emails (section 10) to the outbox, and add a read-only Schedule of published weeks for staff (section 9, screen 1).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Reassigning Tuesday's opening shift from Ben Cho to Jo Park shows "Jo is unavailable on Tuesdays (classes)." and will not save without an override note; cancel it.
- [ ] Reassigning Friday's opening shift from Jo Park to Ana Lima warns "Only 8 hours of rest after Thursday's shift (10 hours minimum)."; cancel it.
- [ ] Assigning Ben Cho the open Saturday shift warns "Ben would have 40 hours this week (35 maximum)."; saving it with the note "Covering this week" stores the note in the event log; then make the shift open again.
- [ ] Assigning Kai Brooks to Saturday's kitchen shift is refused with "Kai has approved time off Oct 24 to 25.", and assigning Lee Grant to Wednesday's kitchen shift is refused with "Lee isn't set up for Kitchen."
- [ ] The footer shows Monday at $632.00 and the week at 192 hours and $3,792.00, with the open Saturday shift costed at $144.00.
- [ ] Publishing the week of Oct 19 sends each of the eight people with shifts exactly one "Your shifts" email, announces the open Saturday shift to the five baristas, and makes the week visible to staff.
- [ ] After publishing, changing Lee Grant's Monday closing shift to start at 15:00 emails Lee the before and after times.

### Phase 3: My shifts, claims, swaps and drops

```
Using the Shift Scheduling blueprint above, build Phase 3 only.

1. Build My shifts (section 9, screen 2) for phones, and Requests for managers (screen 3).
2. Implement claims, swaps and drops exactly as section 7 describes, with conflict checks for the person taking the shift, R3 visibility, and the emails in section 10.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (continue from the end of the Phase 2 checks)
- [ ] Signed in as Lee Grant, My shifts shows Jo's swap request for Saturday Oct 17; accepting it puts it in Rosa's Requests, and Rosa's approval moves the shift to Lee and emails both.
- [ ] Signed in as Ben, claiming the open Saturday Oct 24 shift is refused with "Ben would have 40 hours this week (35 maximum)."
- [ ] Signed in as Mia Torres (Kitchen only), the open Barista shift is not offered, and a direct claim request for it is refused.
- [ ] Signed in as Lee, claiming the same shift puts the claim in Rosa's Requests; a later claim by Ana shows as "2nd in line"; approving Lee's claim assigns the shift to Lee and declines Ana's claim with an email to her.
- [ ] Ana asks to drop her Wednesday Oct 21 shift with a reason; after Rosa approves, the shift is open and announced to the other four baristas (Ben, Jo, Lee and Sam).
- [ ] Rosa copies the week of Oct 19 into a draft for Oct 26; signed in as Ben, that week is not visible, and a direct request for its shifts is refused.

### Phase 4: Calendar feed, export and print

```
Using the Shift Scheduling blueprint above, build Phase 4 only.

1. Build the calendar feed (R7) with link regeneration.
2. Build the CSV export and the one-page print view (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (continue from the end of the Phase 3 checks)
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

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser. The checks of Phases 1 and 2 started from a fresh load of the seed, and Phases 3 and 4 continued on the same data, as the build plan says; the seed's "today" was pinned to Thursday, October 15, 2026, so the dates match the checks. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Emails were read on the Outbox screen, the calendar feed was fetched by its link, the CSV was downloaded and parsed, and the print view was printed to PDF by Chromium.

**Result:** 20 of 20 acceptance checks passed in one final browser run on a fresh database, plus 66 automated tests. The item-by-item results are in [acceptance-results.json](/builds/shift-scheduling/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. The seed loads relative to today, but every check quotes October dates, so on any other day the checks could not be followed word for word. Section 14 now says to add a development setting that pins the seed's "today" to Thursday, October 15, 2026, and to show the date mapping in the development bar.
2. Reset to seed data could move the clock backwards, and nothing said whether the current week came from the real date or the development clock. Reset now uses the real date and sets the clock to Thursday 09:00 of that week even if that is earlier than now.
3. "The same assignments, except that Jo Park also works Saturday" could mean 24 or 25 published shifts. The published week now has the same 24 shifts, with Jo in the Saturday slot that is open in the draft week, and no open shift.
4. The seeded published week had no published_at or published_by. It was published by Rosa at 09:00 on the Thursday before it.
5. Kai's seeded time off had no reason or decider, and nothing said whether loading the seed writes history. It has no reason and was decided by Rosa, and loading the seed writes one "seed loaded" event.
6. Sign-in offered built-in auth, Google or magic links without saying how emails are matched or what happens to someone already signed in when they are deactivated. Emails are compared trimmed and lowercase, unknown and inactive people both see the refusal, deactivation ends their sessions, and the development switcher runs the same check.
7. Nothing said how the first manager signs in to a production install with an empty database. A BOOTSTRAP_MANAGER_EMAIL setting creates them, and the seed loads only in development.
8. Sign-in sessions and the development clock had nowhere to live, and Template.weekdays was just "list". Sessions and the clock offset sit outside the model, and weekdays is a list of numbers 1 to 7, at least one.
9. Requests are shown "oldest first" and claims wait "in the order they were made", but TimeOff and ShiftRequest had no created_at. Both now have one.
10. R5 gave only a one-shift message and didn't define "touches a date" or say which shifts count. It now has the plural message, counts assigned shifts in any week, draft or published, and section 6 defines touching a date in the location's time zone, with a shift ending at 00:00 not touching the next day.
11. R8 refused deactivation for "future shifts" without defining them or giving a message. Future means assigned shifts that haven't ended, draft or published, and R8 now quotes the refusal and covers unticking Active too.
12. Taking a position away from someone who still has shifts in it would silently break the position check. It is now refused, like R8, until those shifts are reassigned or opened.
13. The last active manager could be deactivated or lose is_manager, locking everyone out. Both are now refused.
14. Positions were listed with no rules for names, renaming or deleting. Names are unique ignoring case, positions can be renamed, and they can be deleted only when nothing uses them.
15. Section 9 said managers "see everyone's" availability while section 4 lets managers do everything. Managers now see and edit everyone's; staff only their own.
16. Availability entries had no rules for steps, end times, overnight periods, overlaps or the note. They use 15-minute steps up to 24:00, start before they end, overnight periods are two entries, overlaps are allowed and the note is optional up to 200 characters.
17. Time-off requests had no rules for who can request for whom, past dates, a missing end date, the reason's length, overlaps, or withdrawing a request. Section 5 now covers each, and a decision is final.
18. R3 said staff never see time-off reasons, while section 4 said other people's reasons. A person sees their own requests and reasons, and staff never see anyone else's time off at all.
19. The time-off email gave only "approved" for a single day. Section 10 now shows a declined, multi-day subject, and says managers get no email when time off is requested.
20. Phase 2's prompt built the Outbox screen, but a Phase 1 check reads Ben's email in the outbox. Phase 1 now builds the Outbox.
21. The retry job was "protected by a CRON_SECRET header" with no endpoint, header or rule for an unset secret, and nothing said when emails are sent. It is POST /jobs/retry-notifications with an Authorization: Bearer header, refuses every call with no secret set, and retries failed emails and ones stuck in queued; emails are sent after the change is saved.
22. R9 said events are never deleted, while reset to seed data has to delete them, and "every change" didn't say whether sign-ins count. R9 now lists what writes events, excludes sign-ins and refused attempts, and names the development reset as the only exception.
23. Templates had no rules for names, overnight times, length, weekdays or deleting. They follow R1, need at least one weekday, needn't have unique names, and can be deleted because shifts don't refer to them.
24. Settings had no limits on min_rest_minutes and no word on what changing the time zone does to existing shifts. Rest is 0 to 1440 minutes, the time zone is an IANA name, and changing it leaves shifts at the same UTC instants.
25. Wages and maximum hours were stored as cents and minutes with no word on how managers enter them. Managers enter dollars and hours on 15-minute steps, and the phone number is free text up to 40 characters.
26. Phase 1 had no home page because the Schedule and My shifts come later. Until those phases, home is a page of links to the screens built so far.
27. Nothing said how sign-in cookies are set or whether form posts from other sites are refused. Section 3 now asks for HttpOnly, SameSite=Lax cookies and refuses cross-site posts.
28. "Today", "the current week" and "Thursday" didn't say whose time zone. Section 11 now says the location's.
29. Nothing said which week the manager's Schedule opens on. It opens on the first draft week from the current week on, otherwise the current week.
30. A Phase 2 check makes the published week "visible to staff", but My shifts arrives in Phase 3. Phase 2 now adds a read-only staff Schedule of published weeks, with drafts returning 404.
31. Section 6 gave messages for five worked examples only. It now gives wording for overlaps, inactive people, part-day unavailability, rest before a shift and fractional hours.
32. Short rest didn't say whether it is checked before the new shift as well as after, or what back-to-back shifts are. Both directions are checked, and back-to-back shifts are a warning.
33. The conflict checks didn't say which of the person's shifts they look at. They use all of the person's shifts in any week, draft or published, and weekly hours add up the week the new shift starts in.
34. Nothing said whether an open shift can have conflicts. It can't.
35. "Show every conflict" didn't say whether warnings are listed beside a hard conflict or whether an override note helps. They are listed together, and a note never unlocks a hard conflict.
36. R4 didn't say whether one note covers several warnings, when a note is cleared, or how its length is counted. One note covers all of a shift's warnings, it is cleared when the shift is saved with none, the box starts empty on each edit, and length is counted after trimming.
37. R1 didn't say how length is measured across a daylight-saving night, how an overnight end is entered, or whether editing can move a shift into another week. Length is real elapsed time, an end at or before the start is the next day, and a shift can't move to another week.
38. Shifts have a note, but R3 shows staff only names and times. The note is shown to managers and in the assigned person's emails, not on the staff schedule.
39. Nothing said whether managers can change a shift that has already started. They can; only staff requests stop at the start time.
40. The changed-shift email had one example and no rule for reassignments or note-only edits. The same subject covers every change, the person losing a shift gets its old date and the person gaining it the new date, and note-only changes send nothing.
41. Open shifts were announced only at publishing, so a shift a manager opened later in a published week reached nobody. Opening, adding or changing an open shift in a published week now announces it to everyone eligible except the person who lost it.
42. "Pending requests are cancelled and their people told" had no email. Section 10 now has a Request cancelled email.
43. Nothing said whether a shift can be deleted. Managers can delete one unless it has request history, and deleting a published shift emails its person.
44. "Copy last week" didn't say which week is copied, what happens to assignments that now conflict, or whether override notes come along. It copies the week before, conflicted assignments become open shifts, notes are not copied, and a blank draft is also possible.
45. Nothing stopped publishing an empty week or said whether a week can be unpublished. An empty week can't be published, and there is no unpublish.
46. The publish check said each person is emailed "exactly once", while baristas also get the open-shift announcement. The check now says exactly one "Your shifts" email, and the table says the announcement is separate.
47. A check quotes the open Saturday shift's $144.00 cost, but no screen showed a single shift's cost. Each block on the manager grid now shows its cost.
48. The grid's rows had no order and no rule for inactive people. Open shifts come first, then active people A to Z, plus anyone inactive who still has shifts that week.
49. A check reads the override note "in the event log", but no screen showed the log. Section 9 now has an Event log screen and a history on each shift's page.
50. The week grid had no phone layout, though the app must work on phones. It scrolls sideways with the name column fixed, and the hours panel moves below.
51. The swap email said "take her shift", but people have no pronoun field. It now says "their shift".
52. "Requester (and target for swaps)" didn't say whether both swap emails share a subject. They do, with a body written for each.
53. An approved request changes a published shift, which also triggers the "shift changed" email, so people would get two emails for one change. The decision email replaces the changed email.
54. A check expected a dropped shift "announced to the baristas" without saying whether the person who dropped it counts. It is announced to everyone eligible except them, and the check now names the other four baristas.
55. Section 10 had no email, or said there was none, for a new claim, a drop request, an accepted swap, a cancelled swap or claims declined because another was approved. Each now has a row or a sentence.
56. Staff can't override warnings, yet the checks run again at approval and a warning may appear in between. A manager may approve with an override note; hard conflicts always block, and staff claims and accepts are refused on either kind.
57. Nothing said whether the swap target's conflicts are checked when the swap is requested or accepted. Only eligibility is checked at the request, so the requester never sees the target's time off or hours; conflicts are checked when the target accepts.
58. "Requests on shifts that have already started are refused" didn't say which steps. Creating, accepting and approving are refused after the start time; declining and cancelling still work.
59. Refusals for staff had no HTTP status, so a direct request for a hidden shift could reveal it. Shifts staff can't see return 404, an ineligible claim returns 403 with a message, and refusals show on the page they came from.
60. Requests didn't say whether swaps still waiting for their target belong on the manager's list, or how time off fits in. The list holds everything waiting for a manager, oldest first, with swaps waiting for their target in a separate section.
61. Nothing said whether a manager must approve the first claim in line. Any claim can be approved, and approving one declines the rest.
62. The swap request had no rule for who can be the target, whether it is an exchange, or whether it needs a reason. The target is another eligible colleague, a swap hands the shift over, and it has no reason.
63. Drop reasons had no length or audience. They are required, up to 300 characters, and seen only by the requester and managers.
64. Section 4 gave My shifts to staff while the seed's manager works shifts. Managers have My shifts too and may approve their own requests.
65. My shifts said "upcoming" without a limit and didn't say how a shift in progress or decided requests appear. It lists every published shift that hasn't ended, marks started ones, and shows up to 10 requests decided in the last 7 days.
66. A request could be approved after a manager had changed its shift underneath. Approval is refused when the shift no longer matches the request.
67. decided_by and decided_at were described only for decisions, not for declines by the target, cancels or the automatic decline of competing claims. All of them set both fields.
68. "From 14 days ago to 60 days ahead" didn't say whether that is dates or instants, or whether a shift in progress counts. The window runs from now, and any shift that overlaps it is listed.
69. The calendar feed didn't say whether it needs sign-in or what an unknown link returns. It needs none, because calendar apps can't sign in; the token is the key, and anything else returns 404 "Not found.".
70. Nothing said what an inactive person's feed does. It returns Not found, and reactivating the person brings the same link back.
71. The feed's events had no content or time format. R7 now gives the summary, description, UTC times, and says open shifts, drafts and costs never appear.
72. A changed shift could appear twice in a calendar app, and nothing said how often the feed refreshes. Each event's UID is the shift id, and the feed suggests a 1-hour refresh.
73. A check reads the feed, but a browser downloads a calendar file instead of showing it. The calendar link page now previews what the feed holds.
74. The feed link shown to people needs the app's address, which nothing stored. It comes from a PUBLIC_URL setting.
75. Only the person could regenerate their link, leaving a lost phone's link live until they did. A manager can make a new link for anyone without seeing it, regenerating writes an event without the token, and no email is sent.
76. The calendar link had no screen. My shifts now links to a My calendar link page with the link, subscribe help, a preview and Make a new link.
77. The CSV columns had no formats, order or file name, and nothing said whether it has a totals row. Section 12 now gives the header, date, time, hours and cost formats, the row order, the file name and no totals row.
78. The CSV has a date column but no end date, so an overnight shift was ambiguous. It shows the start date with an End earlier than Start, meaning the next day.
79. Nothing said whether a draft week can be exported or printed. Any existing week can, and a draft is marked in the file name and on the page.
80. Section 12 said managers can export and print without saying staff can't, though the CSV holds costs. Staff get 403 on both.
81. The print view printed the manager's grid, with labor cost, while printed schedules are posted where staff see them and staff must never see labor cost. The default copy shows hours only; a managers' copy adds labor.
82. The print view didn't say which rows it holds. It shows the open shifts row and the people with shifts that week.
83. "One landscape page" gave no paper size or team size. The print view is sized for A4 landscape, which also fits US Letter, for up to 60 people with shifts.
84. The CSV had no encoding and no guard against names that start with =. It is UTF-8 with a byte order mark, and risky cells get a leading apostrophe.

**What we did not test:**
- Production sign-in. Every check used the development "sign in as" switcher; Google sign-in and magic links were not built or tried.
- Sending email. Every email was logged in the outbox; no email provider was configured, and the hourly retry job was run only by the build's own tests.
- A real scheduler. The retry job is an endpoint for an hourly cron, which was not set up.
- Hosting. The checks ran on localhost, not on a public https address.
- Calendar apps. The feed was fetched and parsed, but not subscribed to from iPhone, Google Calendar or Outlook.
- Printing on paper. The print view was printed to PDF by Chromium (one landscape page); other browsers and printers were not tried.
- Daylight-saving weeks and phone layout beyond one 390-pixel Chromium viewport; no physical phone was used.
- Spec fixes that no acceptance check covers, such as positions, templates, deleting shifts, the retry job and the CSV formula guard. The test build handles them through its own choices.
