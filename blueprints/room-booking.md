<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/room-booking . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Room Booking

Blueprint BP-024 · Department: Ops · Replaces: Skedda, room calendars nobody checks, "is anyone in here?"
For teams of 10 to 200 people sharing meeting rooms and desks at one office.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Two meetings turn up for the same room, and the big room sits empty because someone booked it every week and stopped coming."

Rooms are shared calendars that half the office never checks, so double bookings get settled in the doorway. Weekly meetings hold the best room long after the meeting stopped happening. On hybrid days people arrive to find no free desk, and nobody can say whether the office needs more rooms or fewer.

This blueprint is a booking app for meeting rooms and desks: a day view of every space, bookings that can never overlap, simple rules (how long, how far ahead, who may book the boardroom), check-in at the start of a meeting so no-shows release the room after 10 minutes, a tablet outside each room, desk booking with "who's in", and a weekly report of how much each room is really used.

## 2. What the real product does

Research basis: Skedda's pricing page (skedda.com/pricing), October 2026.

What we verified:

1. **United States and Canada plans, billed annually and priced per space.** Plus starts at $249 a month with 35 spaces included, interactive floor plans, unlimited users and bookings, a limited rules and roles engine, and a full insights dashboard. Premier starts at $349 a month with 45 spaces included, adding assigned spaces, the full rules and roles engine and unlimited custom fields. Enterprise is priced by sales, with a dedicated account manager and white-glove implementation.
2. **Administrators** are a $99 a month add-on on Plus and Premier.
3. **Other regions** have their own prices: in Europe, the Middle East, Africa and Asia-Pacific, Starter starts at $99 a month (15 spaces), Plus at $149 (20) and Premier at $199 (25).
4. **Features listed** include mobile apps, tablet displays, Microsoft 365 and Google Workspace sync, Microsoft Teams and Slack apps, SCIM, single sign-on, check-in, issue reporting and visitor management.

### What this blueprint keeps

Floors with rooms and desks; a day view of availability; bookings that cannot overlap, checked inside the database; rules for booking length, how far ahead, office hours and restricted rooms; weekly recurring bookings that skip and report conflicts; check-in with automatic release after 10 minutes; ending a recurring series after three no-shows in a row; a tablet display per room with check-in and "book now"; desk booking with one desk per person per day and a "who's in" list; confirmation emails with calendar files and a personal calendar feed; a weekly utilisation and no-show report.

### What this blueprint deliberately leaves out

Two-way sync with Google or Microsoft calendars, interactive floor plan drawings, assigned (permanent) desks, mobile apps, Slack and Teams apps, single sign-on and SCIM, visitor management, catering and equipment requests, and several office locations.

## 3. Scope of v1

- One office with several floors, one time zone (Settings; default America/Chicago).
- Office hours (default 07:00 to 20:00, Monday to Friday) bound every room booking; desks are booked by the whole day.
- Bookings use 15-minute steps.
- Overlap must be impossible even when two people click at the same moment: enforce it in the database, with an exclusion constraint in Postgres or a trigger that refuses overlaps in SQLite, for bookings that are booked or checked in.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Office manager | Everything: floors, spaces, rules, blocked times, people and groups, any booking, reports, room displays. |
| Member | Everyone else | Book rooms and desks within the rules, edit and cancel their own bookings, check in, see the day view and who's in. |
| Room display | A tablet outside a room | Show that room's status, check in the current booking, and book that room for up to 30 minutes when it is free. |

Restricted spaces (such as the boardroom) can only be booked by members of the groups allowed on them, and by admins. The server enforces every rule.

## 5. Data model

All IDs are strings. Timestamps in UTC; times shown in the office time zone.

**Settings** (one row): office_name, time_zone, office_open (07:00), office_close (20:00), office_days (Mon to Fri), check_in_window_minutes (10), room_max_minutes (240), room_advance_days (30), desk_advance_days (14), release_strikes (3).

**Person**: id, name, email (unique, lowercase), role: admin | member, active.

**Group**: id, name (such as "Leadership"); **GroupMember**: group_id, person_id.

**Floor**: id, name, position.

**Space**: id, floor_id, kind: room | desk, name (unique), capacity (rooms), features (such as "Screen", "Whiteboard"), zone (desks), restricted_to_group_id (optional), display_token (rooms, secret), active.

**Block**: id, space_id, starts_at, ends_at, reason (maintenance, an event). Blocks are not bookings but take the time.

**Series**: id, space_id, person_id, title, weekday, start_time, end_time, first_date, last_date, released_in_a_row, status: active | ended.

**Booking**: id, space_id, person_id, title, starts_at, ends_at, series_id (optional), status: booked | checked_in | released | cancelled, checked_in_at, released_at, created_by (person or "display").

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, attachment (.ics), status: queued | sent | failed | logged, error.

## 6. Booking rules

A new or changed room booking is checked in this order, and the first failure is shown:

1. Office hours and 15-minute steps: "Rooms can be booked from 07:00 to 20:00, Monday to Friday, in 15-minute steps."
2. Length at most room_max_minutes: "Rooms can be booked for up to 4 hours."
3. For one-off bookings, no further ahead than room_advance_days: "Rooms can be booked up to 30 days ahead." (A recurring series may run up to 12 weeks ahead, R3.)
4. Restricted space: "Only Leadership can book the Boardroom."
5. No overlap with a booking (booked or checked in) or a block: "Atlas is booked 10:00 to 11:00 by Omar Ali."

Desk bookings are for a whole office day, at most desk_advance_days ahead, and one desk per person per day: "You already have desk B4 on Fri Oct 16."

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Request | Result |
|---|---|
| Priya books Atlas today 10:30 to 11:30 | Refused: "Atlas is booked 10:00 to 11:00 by Omar Ali." |
| Ben books Birch today 09:00 to 14:00 | Refused: "Rooms can be booked for up to 4 hours." |
| Omar books the Boardroom | Refused: "Only Leadership can book the Boardroom." Zoe (Leadership) can. |
| Priya books Cedar every Tuesday 15:00 to 16:00 for 8 weeks | 7 bookings made; Tuesday Oct 27 is skipped because Cedar is blocked for maintenance, and she is told which date |
| Omar doesn't check in to his 10:00 Atlas booking | At 10:10 it is released, Atlas shows free, and Omar is emailed |
| Zoe books desk B4 for Friday, then desk A2 for Friday | The second is refused: "You already have desk B4 on Fri Oct 16." |

## 7. Check-in and release

| Event | Rule |
|---|---|
| Check in | Allowed from 15 minutes before the start until check_in_window_minutes after it, by the booker in the app or on the room's display. Desks need no check-in. |
| Release | A room booking not checked in by start + check_in_window_minutes becomes released, its remaining time is free, and the booker is emailed. A job checks every minute. |
| Strikes | Each released booking in a series adds one to released_in_a_row; a check-in resets it to 0. When it reaches release_strikes, the series ends: its future bookings are cancelled and the booker is emailed. |
| End early | The booker can end a checked-in meeting early; the rest of the slot becomes free. |

## 8. Business rules

- **R1. No overlaps.** Two bookings or blocks for the same space never overlap. This is enforced by the database, not only by a check in the code.
- **R2. Booking rules** are applied as in section 6, on every create and every change, in that order.
- **R3. Recurring bookings** repeat weekly on one weekday for up to 12 weeks, and are not limited by room_advance_days. Each date is checked separately against the other rules; dates that fail are skipped and listed ("Skipped Tue Oct 27: Cedar is blocked: maintenance"), and the rest are booked.
- **R4. Check-in and release** follow section 7. A released or cancelled booking never comes back.
- **R5. Strikes.** A series ends after release_strikes released bookings in a row (section 7).
- **R6. Own bookings.** Members edit, cancel and check in only their own bookings; admins can act on any booking. Cancelling a booking that has started is refused; end it early instead.
- **R7. Room displays** can only read their own room's schedule for today, check in the current booking, and create a booking for that room of 15 or 30 minutes starting now, if free and within the rules, titled "Booked at the room".
- **R8. Calendar.** Each confirmation email carries an .ics file, and each person has a private calendar feed (/calendar/<token>.ics) of their upcoming bookings; cancelled and released bookings send an updated .ics with status cancelled.
- **R9. Utilisation.** For a week, a room's utilisation is the hours of its bookings that were not cancelled or released, divided by its office hours that week (13 hours × 5 days = 65). The no-show rate is released bookings divided by all room bookings that started that week, not counting cancelled ones.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Day view** (home): a date picker, floors as tabs, rooms as rows and the office day as columns in 15-minute steps, bookings as blocks with title and booker; click a free slot to book. Filters for capacity and features.
2. **Booking form**: space, title, date, start and end, repeat weekly with an end date, and a live check of the rules before saving.
3. **My bookings**: upcoming bookings and series, with check in, edit, end early and cancel.
4. **Desks**: each floor's desks by zone for a chosen day, free or taken (with who), and **Who's in**: everyone with a desk that day, by team.
5. **Room display** (/display/<token>, tablet): room name; "Available until 14:00", or for a booking not yet checked in "Client call prep, 10:00 to 11:00. Check in by 10:10" with a Check in button, or once checked in "In use: Client call prep, until 11:00"; the next two bookings; and Book 15 or 30 minutes when free.
6. **Reports** (admin): utilisation and no-show rate per room for a chosen week, with the week before for comparison.
7. **Floors and spaces**, **Blocks**, **Groups**, **People**, **Room displays** (tokens), **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Booking made or changed | Booker | "Booked: Atlas, Thu Oct 15, 10:00 to 11:00" (with .ics) |
| Recurring booking made | Booker | "Booked: Cedar every Tuesday, 7 of 8 dates" (lists skipped dates, with .ics) |
| Booking released | Booker | "Released: Atlas at 10:10 (no check-in)" |
| Series ended | Booker | "Your weekly Sales sync in Birch has ended after 3 missed check-ins" |
| Booking cancelled by an admin | Booker | "Cancelled: Birch, Tue Oct 20 (reason)" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. The every-minute job is protected by a CRON_SECRET header and is safe to run twice. A failed email never blocks a booking.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so check-in windows, releases and strikes can be tested by moving the clock.

## 12. Report export

The weekly report downloads as CSV: room, floor, capacity, office hours, booked hours used, utilisation %, bookings, released, no-show %.

## 13. Edge cases

- Two people book the same slot at the same moment: one succeeds and the other sees the overlap message (R1).
- A booking is shortened while in progress: allowed by the booker (end early); extending is checked like a new booking.
- An admin blocks a room over existing bookings: the block is refused until those bookings are moved or cancelled, and the screen lists them.
- A space is deactivated: future bookings must be cancelled first (listed, with one button that cancels them and emails their bookers).
- A person is deactivated: their future bookings and series are cancelled and the time freed.
- Daylight saving changes: a weekly series keeps its local time.

## 14. Seed data

Office "Cedar & Co", Chicago, time zone America/Chicago, open 07:00 to 20:00 Monday to Friday. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@cedarco.example): Grace Lee (admin, office manager), Omar Ali, Priya Nair, Ben Cole, Zoe Hart (all members). Group Leadership: Zoe Hart.

Spaces:

| Floor | Space | Kind | Capacity, features or zone |
|---|---|---|---|
| Floor 3 | Atlas | room | 10, Screen, Whiteboard |
| Floor 3 | Boardroom | room | 14, Screen; restricted to Leadership |
| Floor 2 | Birch | room | 6, Screen |
| Floor 2 | Cedar | room | 4 |
| Floor 2 | Phone booth | room | 1 |
| Floor 2 | Desks A1 to A6 | desk | zone A |
| Floor 3 | Desks B1 to B6 | desk | zone B |

Block: Cedar, Tuesday Oct 27, all day, "Maintenance".

Today: Omar Ali, Atlas 10:00 to 11:00 "Client call prep" (booked, not checked in); Zoe Hart, Boardroom 13:00 to 14:00 "Board prep"; Priya Nair, Birch 14:00 to 15:00 "Design review".

Series: Ben Cole, Birch, Tuesdays 09:00 to 09:30 "Sales sync", for 12 weeks from four weeks ago; the last two Tuesdays were released (released_in_a_row 2).

Desks: Omar has A1 and Priya has B2 tomorrow (Friday).

Last week (Monday Oct 5 to Friday Oct 9): Atlas 10 bookings totalling 26 hours, none released; Birch 8 bookings totalling 16 hours, of which 2 (3 hours) were released, Ben's Sales sync on Tuesday Oct 6 (30 minutes) and a 2.5-hour workshop; Cedar 5 bookings totalling 5 hours, of which 1 (1 hour) was released; no other room bookings. That gives Atlas 40%, Birch 20% and Cedar 6% utilisation, and a no-show rate of 13% (3 of 23).

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and the day view

```
Using the Room Booking blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database, including the database-level guarantee in R1.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask the office manager to add you."
3. Build Floors and spaces, Blocks, Groups, People and Settings (section 9, screen 7) for admins, and the Day view (screen 1) for everyone, read-only for now.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Today's day view for Floor 3 shows Atlas booked 10:00 to 11:00 by Omar Ali and the Boardroom 13:00 to 14:00 by Zoe Hart; Floor 2 shows Birch 14:00 to 15:00 by Priya Nair.
- [ ] Filtering by capacity 8 or more shows only Atlas and the Boardroom.
- [ ] Signed in as Omar, the admin screens are not offered, and a direct request to change a space is refused.
- [ ] Inserting two overlapping bookings for Atlas directly in the database (not through the app) fails.

### Phase 2: Booking, rules and recurring bookings

```
Using the Room Booking blueprint above, build Phase 2 only.

1. Build the Booking form and My bookings (section 9, screens 2 and 3) with R2, R3 and R6, all on the server.
2. Build desk booking and Who's in (screen 4).
3. Write the booking emails with .ics files (section 10, R8) to the outbox, the personal calendar feed, and the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Priya booking Atlas today 10:30 to 11:30 is refused with "Atlas is booked 10:00 to 11:00 by Omar Ali.", and Ben booking Birch 09:00 to 14:00 is refused with "Rooms can be booked for up to 4 hours."
- [ ] Omar can't book the Boardroom ("Only Leadership can book the Boardroom."), and Zoe can.
- [ ] Priya books Cedar every Tuesday 15:00 to 16:00 for 8 weeks: 7 bookings are made, Tuesday Oct 27 is listed as skipped for maintenance, and her email lists the skipped date and has an .ics file.
- [ ] Booking a room 31 days ahead is refused, and so is a booking from 19:30 to 20:30.
- [ ] Zoe books desk B4 for Friday; booking A2 for the same Friday is refused with "You already have desk B4 on Fri Oct 16."; Who's in for Friday lists Omar, Priya and Zoe.
- [ ] Omar can't cancel Priya's booking, including by a direct request.

### Phase 3: Check-in, release and room displays

```
Using the Room Booking blueprint above, build Phase 3 only.

1. Build check-in, release, strikes and end early (section 7) with R4 and R5, and the every-minute job.
2. Build the Room display (section 9, screen 5) with R7, and the release and series-ended emails.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Moving the clock to 10:10 and running the job releases Omar's Atlas booking, shows Atlas free from 10:10, and emails Omar; checking in at 10:05 instead keeps it booked.
- [ ] Atlas's room display at 10:05 shows "Client call prep, 10:00 to 11:00. Check in by 10:10" and a Check in button; after checking in it shows "In use: Client call prep, until 11:00".
- [ ] The Phone booth's display at 10:00 offers Book 15 or 30 minutes; booking 30 minutes creates "Booked at the room" from 10:00 to 10:30, and the display can't see any other room.
- [ ] Moving the clock to next Tuesday 09:10 and running the job releases Ben's Sales sync for the third time in a row: the series ends, its future bookings are cancelled, and Ben is emailed.

### Phase 4: Reports and export

```
Using the Room Booking blueprint above, build Phase 4 only.

1. Build Reports (section 9, screen 6) with R9, and the CSV export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The report for the week of Oct 5 shows Atlas 40%, Birch 20% and Cedar 6% utilisation, and a no-show rate of 13% (3 of 23 bookings released).
- [ ] The same report downloads as CSV with one row per room, including the Boardroom and the Phone booth at 0%.
- [ ] Signed in as Omar, Reports are not offered, and a direct request for the report is refused.

## 16. Variations

- Two-way sync with Google Calendar or Microsoft 365 room calendars.
- A floor plan image with clickable rooms and desks.
- Assigned desks that are released to others on days their owner is away.
- Catering or equipment requests on a booking.
- Several office locations with their own hours.
- A Slack command that finds a free room now.
