<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/capacity-planner . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Capacity Planner

Blueprint BP-038 · Department: Ops · Replaces: Float (resource scheduling and capacity planning), the resourcing spreadsheet
For teams of 5 to 40 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We say yes to new projects without knowing who actually has time."

A client wants to start in two weeks. The studio lead opens the resourcing spreadsheet, sees some empty cells and says yes. Nobody noticed that one designer works three days a week, that Thanksgiving takes two days out of that week, or that a developer is already booked 24 hours a week on another project. The work lands on the same two people, deadlines slip, and the next pitch is promised on the same guesswork.

This blueprint is a small capacity planner built around one calculation, done the same way on every screen: each person's real capacity for each week (their working hours, minus holidays and time off) against the hours booked for them, confirmed and tentative, with every over-booked week flagged before anyone says yes.

## 2. What the real product does

Research basis: Float's pricing and product pages (float.com/pricing, float.com/product/capacity-planning, float.com/product/scheduling) and help center articles at support.float.com/en/articles/ (4188692-allocate-time, 28963-tentative-projects-phases-and-allocations, 12042863-project-statuses-and-stages, 28942-default-work-days-and-hours, 28934-individual-custom-hours-and-work-days, 440604-schedule-time-off, 3281892-public-and-team-holidays, 4385599-people-report, 8850727-date-range-insights, 28939-search-and-filter, 28920-people-tags, 2732830-project-budgets, 4787660-project-phases, 1813316-export-your-data, 3412688-personal-notifications, 2059673-placeholders, 5215287-access-rights), October 2026.

What we verified:

1. **Pricing.** Float charges per scheduled person: you pay for the people you put on the Schedule, and people who only need to look can be free guests. Starter is $7 and Pro $12 per scheduled person per month billed annually ($8.50 and $14 billed monthly). Enterprise is sold through sales and described as best for teams of 100 or more. The 30-day trial runs on Pro and needs no credit card. Pro adds time tracking, AI experience profiles, client rate cards with several currencies, project cost estimates, advanced reports and dashboards, and single sign-on with domain restrictions.
2. **Allocations.** An allocation is the planned assignment of a person's time to a project, optionally to a phase or task. The standard unit is hours per day, prefilled from the person's availability; Float can also spread a total over a fixed date range, or book a percentage of capacity. Scheduling more than a person's capacity for a day shows as overtime in red, and time can also be scheduled on weekends and public holidays.
3. **Tentative work.** Projects are draft, tentative, confirmed, completed or canceled, with custom stages. Allocations on a tentative project or phase are tentative and show as outlines; on a confirmed project, single allocations can be marked tentative. Tentative projects send no notifications, and canceled allocations leave the Schedule.
4. **Capacity.** The company sets default work days and hours, and each person can have their own part-time days and hours, applied to all dates or from a chosen week. Capacity is daily hours times work days, minus time off and holidays. Holidays come from country and region calendars (one group per person) plus team-wide holidays. Time off has types, balances and optional approval; a full day off over existing allocations deletes them for that day after a warning, a part day leaves them.
5. **Who has time.** Date range insights (up to 92 days) show each person's scheduled, unscheduled and overtime hours, or the percentage utilized, colored grey, orange (overtime on some days) or red (over 100%), and can sort people by unscheduled hours. The Schedule filters by department, role, person tag, manager, project, allocation status and more, and Float suggests people tags for skills.
6. **Budgets.** Each project has one budget type: time and materials, a fixed fee or fixed hours, the last two by project, phase or task. Billable scheduled hours count against an hours budget, and the remaining budget shows in red when the project is over budget. On Starter budgets follow scheduled work; Pro and Enterprise can also follow logged time.
7. **Reports and export.** The People report shows capacity, scheduled, billable, tentative, unscheduled and overtime hours, with percentages rounded to whole numbers. Export is CSV only; the Schedule export lists scheduled hours and remaining capacity by day or week, for up to a year.
8. **Notifications.** Daily or weekly schedule emails. People hear when allocations of theirs in the next 7 days are created, changed or deleted, but not about tentative or completed ones. Project owners hear about any change on their projects. Delivery is in the app, by email, by mobile push or in Slack.
9. **Also included.** Placeholders for unhired roles (1 free on Starter, 5 on Pro), Google and Outlook calendar, Slack, Zapier and API integrations on every plan, a mobile app, and access rights (Account Owner, Admin, Manager, Member), which Float's help center says are being replaced by customizable access roles from mid-October 2026.

### What this blueprint keeps

People with working hours for each weekday (so part-time works as fewer days or shorter days) and skills; one company holiday list; time off in full or part days; projects that are tentative or confirmed, with phases and budgets in hours; bookings by the week, in hours a day or a week, confirmed or tentative; a weekly schedule of booked hours against capacity with over-booking flagged, plus a separate flag for weeks that only go over if tentative work goes ahead; utilization per person and for the team; each phase's booked hours against its budget; a "who has time" search by skill and weeks; email through an outbox when a week goes over capacity or someone's confirmed bookings change; CSV export.

### What this blueprint deliberately leaves out

Time tracking and anything that compares planned with logged hours; rates, costs, fees, margins, currencies, and fixed-fee or time-and-materials budgets; percentage allocations, specific times of day, repeating allocations, tasks, milestones, templates, draft projects and a project timeline view; placeholders and AI staffing suggestions; regional holiday calendars, time off types, balances and approvals; working-hour changes from a chosen date; overtime by day; billable and non-billable splits; Slack, calendar and project-tool integrations, an API, mobile apps, single sign-on, dashboards and an activity feed. If you need planned-against-actual reporting (Float's Pro plan, $12 per scheduled person per month billed annually), rates and margins, or holiday calendars for several offices, Float is worth paying for.

## 3. Scope of v1

- One company and one team time zone, set by a `TEAM_TIME_ZONE` environment variable (default America/New_York). "Today" is today in that zone. Weeks run Monday to Sunday.
- Planning in hours and whole weeks: a booking covers one or more whole weeks, at so many hours a day or a week. No percentages and no times of day.
- Hours are entered in steps of 0.25 and stored as integer minutes.
- One list of company holidays that applies to everyone.
- Time off is recorded, not requested or approved.
- Planned hours only: no time tracking, rates or money.
- Email notifications through an outbox, CSV export, and a web app that works on a phone (the schedule grid scrolls sideways).

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Member | Everyone who can sign in | See the Schedule, Projects, Who has time and Time off. Add time off for themselves starting today or later, and remove their own while its first day is today or later. |
| Planner | Producers, studio managers, team leads | Everything members do, plus: create and edit projects and phases, confirm, close or mark projects lost, add, change and delete bookings for anyone, add and remove anyone's time off on any dates, export CSV. |
| Admin | One or more people | Everything planners do, plus: add, edit, deactivate and reactivate people (their working hours, skills and role), manage skills and holidays, read the outbox. |

Each person has one role (Person.role). Everyone signed in sees every person's bookings, time off dates and capacity, and every project's budget: the point is that everyone can see who has time. Time off has no reason or type, so nothing private is shown.

## 5. Data model

All IDs are strings (UUID or similar). Timestamps are UTC. Dates are calendar dates (`YYYY-MM-DD`) in the team time zone. Every hour amount is stored as integer minutes (1 hour = 60).

**Person**
- id, name (required, 1 to 80 characters), email (required, unique, stored lower-case)
- title (optional, max 60 characters, e.g. "Designer")
- role: admin | planner | member (default member)
- on_schedule (boolean, default true; false for people who don't take project work, such as a studio director)
- mon_minutes, tue_minutes, wed_minutes, thu_minutes, fri_minutes, sat_minutes, sun_minutes (working hours per weekday; 0 to 1440 in multiples of 15; default 480 Monday to Friday and 0 at the weekend)
- active (boolean, default true), created_at

**Skill**: id, name (required, 1 to 40 characters, unique ignoring case)

**PersonSkill**: person_id, skill_id; unique (person_id, skill_id)

**Holiday**: id, date (unique), name (required, 1 to 60 characters)

**TimeOff**
- id, person_id, start_date, end_date (on or after start_date; at most 366 days in total)
- part_day_minutes (nullable: empty means full days; otherwise 15 to 1440 in multiples of 15, taken off each working day in the range)
- created_by, created_at

**Project**
- id, name (required, 1 to 80 characters, unique ignoring case), client (optional, max 80 characters)
- status: tentative | confirmed | closed | lost
- created_by, created_at, status_changed_by and status_changed_at (nullable; set by Confirm, Mark lost and Close)

**Phase**
- id, project_id, name (required, 1 to 60 characters, unique within its project ignoring case)
- budget_minutes (nullable: empty means no budget; otherwise a whole number of hours from 1 to 100,000, stored as minutes)
- position (integer, display order), created_at

**Booking** (Float calls this an allocation)
- id, person_id, phase_id (the booking's project is its phase's project)
- first_week, last_week (both Mondays; last_week on or after first_week; at most 52 weeks in total)
- unit: per_day | per_week
- minutes (per_day: 15 to 1440; per_week: 15 to 10080; multiples of 15)
- tentative (boolean), note (optional, max 200 characters)
- created_by, created_at, updated_by, updated_at

**Notification** (outbox)
- id, recipient_id (a Person)
- kind: over_capacity | booking_added | booking_changed | booking_removed | project_confirmed | time_off_added | time_off_removed
- subject, body (plain text)
- status: queued | sent | logged | failed; attempts (integer, default 0; each send attempt adds 1); error (nullable); created_at, sent_at (nullable)

There is no table of totals. Capacity, booked and free hours, utilization and budget use are computed from these rows every time (R11).

## 6. Capacity and bookings

Write these as pure server-side functions. The Schedule, the week detail, the booking preview, Who has time, notifications and both CSV files all call them.

**One day.** For a person and a date, the first rule that matches decides:
1. The date is a holiday: capacity 0, not available. Label: the holiday's name.
2. The person works 0 hours on that weekday: capacity 0, not available. Label: "Not a working day".
3. The person has time off that day with no part-day hours, or with part-day hours equal to or more than the day's working hours: capacity 0, not available. Label: "Time off".
4. The person has part-day time off that day: capacity = working hours minus part-day hours, available. Label: the hours left, then the hours off: "4 h (time off 4 h)".
5. Otherwise capacity = the day's working hours, available. Label: the hours: "8 h".

Because holidays are checked first, time off that covers a holiday or a day the person doesn't work never reduces capacity twice.

**One week.** A person's capacity for a week is the sum of its seven days. Step through dates one calendar day at a time, never by adding 24 hours, so daylight-saving changes can't skip or repeat a day.

**A booking in a week.** A booking counts in every week from first_week to last_week, unless its project is lost:
- per_week: the booking's hours, whatever the week holds. Holidays and time off don't shrink it.
- per_day: the booking's hours times the person's available days that week. Holidays and full days off take days out; a part day off doesn't.

**Week totals.** confirmed = the hours of the person's confirmed bookings in the week; tentative = the hours of their tentative bookings; booked = confirmed + tentative; free = capacity - booked (it can be negative). Status, first match wins:
- **Off**: capacity 0 and booked 0.
- **Over**: confirmed is more than capacity.
- **Tentative over**: booked is more than capacity, so the confirmed work fits and the tentative work doesn't.
- Otherwise no status. Booked exactly equal to capacity is not over.

Where a message gives an amount over, it is booked - capacity.

**Utilization** = confirmed ÷ capacity, and **utilization with tentative** = booked ÷ capacity, as whole percentages rounded half up. Over several weeks or people, add up the hours first, then divide. When capacity is 0, show "–". Over-booked weeks give more than 100%.

### Worked examples (seed data in section 14)

| Person (works) | Week | Capacity | Bookings that week | Booked/capacity | Status |
|---|---|---|---|---|---|
| Lee (8 h Mon to Fri) | 16 Nov | 40 - 4 (part day off Fri 20 Nov) = 36 | Brightline Build, 8 h a day × 5 available days = 40 | 40/36 | Over: a part day off doesn't shrink a per-day booking |
| Lee | 23 Nov | 40 - 16 (Thanksgiving Thu and Fri) = 24 | 8 h a day × 3 days = 24 | 24/24 | none: exactly full |
| Ben (8 h Mon to Thu) | 23 Nov | 32 - 8 (Thanksgiving Thu; he doesn't work Fridays) = 24 | Brightline Build 24 h a week + Studio website 8 h a week = 32 | 32/24 | Over: per-week bookings don't shrink |
| Jo (8 h Mon to Wed) | 23 Nov | 24: both holidays fall on days she doesn't work | Brightline Design 16 h a week | 16/24 | none |
| Maya (8 h Mon to Fri) | 23 Nov | 0: time off Mon to Wed, holidays Thu and Fri | Brightline Design 4 h a day × 0 days = 0 | 0/0 | Off |
| Priya (6 h Mon to Fri) | 23 Nov | 30 - 6 (time off Wed) - 12 (holidays Thu and Fri, which her time off also covers, counted once) = 12 | Studio website 2 h a day × 2 days = 4 | 4/12 | none |
| Maya | 30 Nov | 40 | Orchard Design 24 h a week (confirmed) + Lumen Identity 20 h a week (tentative) | 44/40 | Tentative over |
| Sam (8 h Mon to Fri) | 7 Dec | 40 - 24 (time off Mon to Wed) = 16 | Brightline Build 16 h a week | 16/16 | none |
| Jo | 21 Dec | 0: time off Mon to Wed; Christmas is a Friday, which she doesn't work | none | 0/0 | Off |

Utilization: in the week of 16 Nov the 8 people on the schedule have 282 h of capacity and 138 h confirmed: 48.94%, shown as 49%. Over the 8 weeks from 16 Nov, Maya has 264 h of capacity, 136 h confirmed and 60 h tentative: 52% (51.52%), and 74% with tentative (74.24%). Lee's week of 16 Nov is 40 ÷ 36 = 111%.

## 7. Projects, phases and budgets

A project has one or more phases, and every booking belongs to a phase, so every booked hour counts against exactly one phase.

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Planner or admin | (none) | tentative or confirmed, as chosen | The form also creates the first phase (name, optional budget) |
| Edit name and client; add, edit or delete a phase | Planner or admin | tentative, confirmed | same | R10 |
| Confirm | Planner or admin | tentative | confirmed | Every booking on the project becomes confirmed, in the same transaction; notifications (section 11) |
| Mark lost | Planner or admin | tentative | lost | Its bookings stay, but count nowhere except the project page |
| Close | Planner or admin | confirmed | closed | Refused while any of its bookings runs after the current week: "Brightline website has 6 bookings that run after this week. End or delete them first." (with one: "has 1 booking that runs after this week. End or delete it first."). Its bookings keep counting, as past work |

From the wrong status: "Only tentative projects can be confirmed.", "Only tentative projects can be marked lost.", "Only confirmed projects can be closed." The status is checked inside the same transaction as the change. Confirm, Mark lost and Close set status_changed_by and status_changed_at. **Final states:** closed and lost; after that nothing about the project, its phases or its bookings can change (R5).

**Budget arithmetic.** For each phase, over all its bookings and all their weeks, past and future, including bookings of people who are now inactive: confirmed hours, tentative hours, and booked = confirmed + tentative. When the phase has a budget:
- left = budget - booked, shown as "16 h left", "0 h left" or, when negative, "Over by 24 h"
- used = booked ÷ budget, a whole percentage rounded half up
- **Over budget** when confirmed is more than the budget; **Tentative over budget** when confirmed fits but booked doesn't; otherwise no flag

A phase without a budget shows "No budget" and no left, used or flag. A project's budget is the sum of its phases' budgets ("No budget" when none has one), its booked hours are the sum over all its phases, and its flag is its worst phase flag. A lost project shows its numbers on its own page only, under "Lost: these hours don't count on the schedule.", and no flags.

### Worked examples (seed data)

| Project · phase | Budget | Bookings (hours over all weeks) | Confirmed | Tentative | Left | Used | Flag |
|---|---|---|---|---|---|---|---|
| Brightline website · Design | 100 h | Maya 4 h a day: 20 + 20 + 20 + 0 = 60; Jo 16 h a week × 4 = 64 | 124 h | 0 h | Over by 24 h | 124% | Over budget |
| Brightline website · Build | 430 h | Lee 40 + 24 + 40 + 40 + 40 = 184; Sam 64; Ben 120; Tom 60 (past weeks); Ana 12 (tentative) | 428 h | 12 h | Over by 10 h | 102% | Tentative over budget |
| Orchard app redesign · Discovery | 40 h | Maya 4 h a day: 20 + 20 | 40 h | 0 h | 0 h left | 100% | none |
| Orchard app redesign · Design | 160 h | Maya 24 × 4 = 96; Jo 8 h a day × 3 days × 2 weeks = 48 | 144 h | 0 h | 16 h left | 90% | none |
| Lumen rebrand · Identity | 90 h | Maya 20 × 3 = 60; Priya 10 × 3 = 30 (the project is tentative) | 0 h | 90 h | 0 h left | 100% | none |
| Studio website · Refresh | No budget | Ben 8 × 4 = 32; Priya 2 h a day: 10 + 4 = 14 | 46 h | 0 h | – | – | – |
| Pinecrest campaign · Concepts (lost) | 40 h | Priya 10 × 2 = 20 | 0 h | 20 h | 20 h left | 50% | none (lost) |

So the Projects list shows Brightline website with a 530 h budget, 564 h booked and Over budget.

## 8. Who has time

Inputs: a skill (Any skill, or one skill); a first and last week (default: the current week to 3 weeks later; R2 applies; at most 26 weeks: "Pick up to 26 weeks."); and "Count tentative bookings as busy" (ticked by default).

For each active person on the schedule with the skill, over those weeks: capacity, confirmed, tentative, and free = capacity - confirmed - tentative (capacity - confirmed when the box is unticked), plus each week's free hours. Sort by free hours, most first, then by name. Negative free hours show as "Over by 12 h". The search only reads; it never saves anything.

| Search (seed data) | Result |
|---|---|
| UI design, weeks of 30 Nov to 14 Dec, box ticked | Jo Park: capacity 72 h, confirmed 48 h, tentative 0 h, 24 h free (weeks 0, 0, 24). Maya Chen: capacity 120 h, confirmed 72 h, tentative 60 h, Over by 12 h (weeks -4, -4, -4) |
| The same, box unticked | Maya Chen 48 h free, then Jo Park 24 h free |
| Frontend, week of 23 Nov | Tom Bennett 24 h free, Sam Okafor 8 h, Lee Park 0 h |

## 9. Business rules

- **R1. Server checks.** Every permission in section 4 and every rule here is enforced on the server for every action and API call; hiding a button is not a check. A member asking for a planner action gets "Planners only."; anyone but an admin asking for an admin action gets "Admins only." Reading a page never creates or changes anything.
- **R2. Weeks and dates.** A week runs Monday to Sunday in the team time zone and is named by its Monday; the current week is the one that contains today. first_week and last_week must be Mondays ("Weeks start on a Monday."), last_week can't be before first_week ("The last week can't be before the first week.") and a booking covers at most 52 weeks ("A booking can cover at most 52 weeks."). Impossible dates such as 2026-02-30 are refused ("Enter a real date."), never rolled over.
- **R3. Hours.** Working hours per weekday: 0 to 24 in steps of 0.25 ("Enter 0 to 24 hours a day, in steps of 0.25."). Per-day bookings and part-day time off: 0.25 to 24 ("Enter 0.25 to 24 hours a day, in steps of 0.25."). Per-week bookings: 0.25 to 168 ("Enter 0.25 to 168 hours a week, in steps of 0.25."). Phase budgets: a whole number of hours from 1 to 100,000, or empty ("Enter a whole number of hours from 1 to 100,000, or leave it empty.").
- **R4. Who can be booked.** Only active people on the schedule can be given a booking, or have one changed: "Dana Ruiz can't be booked. Only active people on the schedule can."
- **R5. Project status.** Closed and lost projects are read-only, including their phases and bookings, and bookings can't be moved onto them: "Pinecrest campaign is lost, so it can't change." ("Brightline website is closed, so it can't change."). On a tentative project every booking is tentative; saving a confirmed one is refused: "Lumen rebrand is tentative, so its bookings are too." On a confirmed project each booking is confirmed or tentative, as the planner chooses.
- **R6. Overbooking is allowed.** Over and Tentative over are warnings, never refusals. The preview shows them before saving.
- **R7. Time off.** "The last day can't be before the first day."; at most 366 days ("Time off can cover at most 366 days."). A person's time off can't overlap their other time off: "Overlaps your time off, Mon 23 – Wed 25 Nov." (a planner sees "Overlaps Maya Chen's time off, Mon 23 – Wed 25 Nov."). Members add time off only for themselves and only starting today or later ("Time off can't start in the past. Ask a planner to record it."), and remove only their own ("You can only remove your own time off.") while its first day is today or later ("This time off has started. Ask a planner to remove it."). Planners and admins add and remove anyone's time off on any dates. Time off is never edited: remove it and add it again. Only active people can be given time off.
- **R8. People.** Only admins add, edit, deactivate and reactivate people, in Admin → People. Emails are unique ("Someone already uses lee@larkspur.example."). Someone on the schedule needs at least one working day ("Someone on the schedule needs at least one working day."). There must always be at least one active admin ("There must be at least one active admin."). Deactivating someone, or taking them off the schedule, is refused while they have bookings that run this week or later: "Lee Park has 1 booking that runs this week or later. End or delete it first." ("Ben Cho has 2 bookings that run this week or later. End or delete them first."). Inactive people can't sign in and disappear from the Schedule, pickers and searches; their bookings stay and still count in project totals. Changing someone's working hours changes every week, past and future.
- **R9. Holidays and skills.** One holiday per date: "There's already a holiday on Fri 25 Dec." Skill names are unique ignoring case: "There's already a skill called UI design." Deleting a skill asks "Remove Illustration from 1 person?" and then removes it from everyone who has it.
- **R10. Projects and phases.** Project names are unique ignoring case ("There's already a project called Brightline website."); phase names are unique within a project ignoring case ("This project already has a phase called Design."). A project keeps at least one phase ("A project needs at least one phase."). A phase with bookings can't be deleted: "Discovery has 1 booking. Move or delete it first." ("Build has 6 bookings. Move or delete them first."). To move a booking, change its phase in the booking form.
- **R11. Computed, not stored.** Every number in sections 6, 7 and 8 is computed from the rows each time by the same server-side functions. Nothing keeps a running total, and the preview and the save use the same code.
- **R12. Simultaneous changes.** The booking form sends the updated_at it loaded; if the booking has changed since, saving is refused: "Someone else changed this booking. Reload to see the latest." Status changes and deletes check the current state inside the same transaction as the change; deleting a booking or time off that no longer exists gets "This was already deleted."
- **R13. Display.** Hours have up to two decimals and no trailing zeros ("36 h", "37.5 h"); grid cells show bare numbers ("40/36"); negative free hours have a minus sign ("-4"). Percentages are whole numbers rounded half up. Dates: "Mon 23 Nov"; ranges use an en dash with spaces: "Mon 23 – Wed 25 Nov", "Mon 30 Nov – Tue 1 Dec". Weeks: "week of 16 Nov", "weeks of 30 Nov to 14 Dec". The year is added when it isn't the current year ("4 Jan 2027"). Amounts: "8 h a day", "24 h a week".

## 10. Screens

Navigation: Schedule, Projects, Who has time, Time off, Export (planners and admins), Admin (admins). Planner pages show "Planners only." to members, admin pages show "Admins only." to everyone else, and the server refuses their actions (R1).

1. **Schedule** (home). A Person column, one column per week for 8 weeks starting with the current week (headers "16 Nov" to "4 Jan 2027", current week highlighted), then an "8 weeks" column. Rows: active people on the schedule, sorted by name, with title and weekly hours under the name ("Designer · 24 h a week"); the signed-in person's row is highlighted. A week cell shows "booked/capacity" ("40/36") and its status from section 6: "Over" (red), "Tentative over" (amber) or "Off" (grey). The 8 weeks cell covers the 8 weeks shown: utilization ("52%") and, when the person has tentative hours in those weeks, "74% with tentative". A Team row adds up the rows shown: per week "booked/capacity" and utilization ("138/282", "49%"), and in its 8 weeks cell the team's utilization and utilization with tentative ("31%", "36% with tentative"). Controls: Previous 4 weeks, This week, Next 4 weeks; a skill filter (Any skill or one skill) that limits the rows and the Team row; Add booking (planners and admins). Clicking a cell opens the week detail. When the filter leaves nobody: "Nobody on the schedule has this skill." On a phone the name column stays fixed and the weeks scroll sideways.
2. **Week detail** (a panel for one person and week). Heading "Priya Nair, week of 23 Nov". One line per day with its label from section 6 ("Mon 23 Nov: 6 h", "Wed 25 Nov: Time off", "Thu 26 Nov: Thanksgiving", "Sat 28 Nov: Not a working day", "Fri 20 Nov: 4 h (time off 4 h)"), then "Capacity: 12 h". Then one line per booking covering the week, from projects that aren't lost: "Studio website (Refresh): 4 h · 2 h a day · Confirmed", with Edit for planners and admins unless the project is closed. Then "Booked: 4 h of 12 h" and the status. Planners and admins also get Add booking, prefilled with this person and week.
3. **Booking form** (add and edit; planners and admins). Person (active people on the schedule), project (tentative and confirmed) and phase, first and last week (Mondays), hours with "a day" or "a week", Tentative (unticked by default; ticked and locked on a tentative project), note. A live preview from the server, using the same functions as the save, shows the person's weeks after this change, one line per week of the booking: "Week of 7 Dec: 36 h of 16 h · Over by 20 h", "Week of 30 Nov: 44 h of 40 h · Tentative over by 4 h", "Week of 23 Nov: 0 h of 0 h · Off" or just the hours; then the phase after this change: "Orchard app redesign (Design): 164 h of 160 h · Over by 4 h" (or "· 16 h left", or "· No budget"). Saving is allowed whatever the preview says (R6). Edit adds Delete, with a confirmation. Errors appear inline and the form keeps what was typed.
4. **Projects.** Tentative and confirmed projects sorted by name, then a "Closed and lost" section. Each row: name, client, status, budget ("530 h" or "No budget"), booked ("564 h") and the project's flag. New project (planners and admins): name, client, Tentative or Confirmed, first phase name and budget.
5. **Project page.** Name, client, status, and the section 7 actions its status allows (planners and admins). Phases: name, budget, confirmed, tentative, left, used and flag, with Add phase, Edit (name and budget) and Delete. Bookings: person, phase, weeks ("weeks of 16 Nov to 14 Dec"), amount ("8 h a day"), status and total hours, ordered by first week then person, with Edit and Add booking (prefilled with this project) for planners and admins. Closed and lost projects show no edit controls.
6. **Who has time.** The inputs and results of section 8. Each row: name, title, skills, capacity, confirmed, tentative, free ("24 h free" or "Over by 12 h"), and one small cell per week with that week's free hours (negative ones in red). Planners and admins get Book on each row, which opens the booking form with that person and the searched weeks filled in. With no matches: "Nobody on the schedule has this skill."
7. **Time off.** "Upcoming" (ending today or later) and "Past" (ended in the last 365 days), each sorted by first day then name, one line each: "Maya Chen · Mon 23 – Wed 25 Nov · full days", "Lee Park · Fri 20 Nov · 4 h". Add time off: person (members: only themselves), first day, last day, and full days or a part day with hours. Delete where R7 allows, with a confirmation.
8. **Export** (planners and admins). A first and last week (R2 messages; at most 52 weeks: "Pick up to 52 weeks.") and two downloads. A file with no rows still has its header row.
   - **Weekly load CSV** (`weekly-load-2026-11-16-to-2026-11-23.csv`): one row per active person on the schedule per week, ordered by week then name: person, email, week_start, capacity_hours, confirmed_hours, tentative_hours, booked_hours, free_hours, utilization_pct, status.
   - **Bookings CSV** (`bookings-2026-11-16-to-2026-11-23.csv`): one row per booking per week in which it has more than 0 hours, leaving out lost projects, ordered by week, person, project, phase, then created_at: week_start, person, email, project, client, phase, hours, status, unit, booking_id, updated_at.
   - Formats: dates `YYYY-MM-DD`; hours as decimals with up to two places and no trailing zeros (`37.5`, `40`, `-4`); utilization_pct a whole number, empty when capacity is 0; status `ok`, `over`, `tentative_over` or `off` in the weekly file and `confirmed` or `tentative` in the bookings file; unit `per_day` or `per_week`; updated_at in UTC ISO 8601 (`2026-10-26T14:00:00Z`); missing values empty; fields with commas, quotes or line breaks quoted.
9. **Admin → People.** Everyone, active and inactive: name, email, title, role, on the schedule, weekly hours ("24 h a week"), skills and active. Add and edit (with the seven day fields and the skills), deactivate and reactivate (R8).
10. **Admin → Skills.** Each skill with the number of active people who have it. Add, rename and delete (R9).
11. **Admin → Holidays.** Pick a year; each holiday's date and name; add and delete.
12. **Admin → Outbox.** Every notification, newest first: time, recipient, kind, subject, status, attempts and error. Clicking a row shows the body. "Retry failed" sends again every failed notification with fewer than 5 attempts.

## 11. Notifications

| Trigger | Recipients | Subject (seed example) |
|---|---|---|
| A week becomes Over | Every active admin and planner, and the person, except whoever made the change | "Over capacity: Sam Okafor, week of 7 Dec (36 h of 16 h)"; for several weeks "Over capacity: Maya Chen, 3 weeks from 30 Nov" |
| Booking added | The person | "New booking: Orchard app redesign (Design)" |
| Booking changed | The person (if the person changes, the old one gets "removed" and the new one "added") | "Booking changed: Brightline website (Build)" |
| Booking deleted | The person | "Booking removed: Brightline website (Design)" |
| Project confirmed | Each person with a booking on it that runs this week or later | "Confirmed: Lumen rebrand" |
| Time off added by someone else | The person | "Time off added: Mon 30 Nov – Tue 1 Dec" |
| Time off removed by someone else | The person | "Time off removed: Fri 20 Nov" |

- **Over capacity.** After any change that can make a week Over (a booking added or changed, time off added, a holiday added, working hours changed, a project confirmed), compare the status of each affected person's weeks, from the current week on, before and after the change. Affected people: the booking's person (before and after), the person whose time off or hours changed, everyone on the schedule for a holiday, and everyone with a booking on the confirmed project. The weeks that were not Over and now are go into one notification per recipient for that person and change. Subject: "Over capacity: {name}, week of {week} ({booked} h of {capacity} h)" for one week, "Over capacity: {name}, {n} weeks from {first week}" for more. Body: one line per week, "Week of 30 Nov: 44 h booked, 40 h capacity, 4 h over." A week that was already Over, or is only Tentative over, sends nothing.
- **Bookings.** Sent only when the booking, before or after the change, is confirmed and runs this week or later, and only if the person didn't make the change. Changing only the note sends nothing. Bodies: "Ana Lima booked you on Orchard app redesign (Design): 20 h a week, week of 7 Dec." / "Ana Lima changed your booking on Brightline website (Build). Before: 24 h a week, weeks of 16 Nov to 14 Dec. Now: 16 h a week, weeks of 16 Nov to 14 Dec." / "Ana Lima removed your booking on Brightline website (Design): 16 h a week, weeks of 2 Nov to 23 Nov." A tentative side gets " (tentative)" after its amount.
- **Project confirmed.** "Ana Lima confirmed Lumen rebrand. Your bookings are now confirmed:" then one line per booking of that person on the project that runs this week or later: "Identity, 20 h a week, weeks of 30 Nov to 14 Dec". Confirming sends no booking_changed notices. The person who confirmed gets nothing.
- **Time off.** "Ana Lima added time off for you: Mon 30 Nov – Tue 1 Dec (full days)." or "(4 h a day)" for a part day; removal reads "Ana Lima removed your time off: Fri 20 Nov (4 h a day)."

Write each notification to the outbox with status `queued` in the same transaction as the change, then send it by email after the transaction commits. With no email provider configured, set the status to `logged` instead of sending. If a send fails, set `failed`, keep the error and add 1 to attempts; "Retry failed" in Admin → Outbox tries again. A notification failure never blocks or undoes the change.

## 12. Time and the development toolbar

**Clock.** Every server-side read of the current time goes through one now() function. Today is the date of now() in TEAM_TIME_ZONE, and it decides the current week.

**Development toolbar** (development only; it must not exist or respond in production):
- Sign in as any person. An inactive person sees "Ask an admin to add you."
- The clock: shows "Today: Wed 18 Nov 2026", can be set to any date and time, and has "+1 day" and "+1 week". It is stored on the server and now() returns it.
- "Reset to seed data": reloads section 14 and sets the clock to Wed 18 Nov 2026, 09:00 in the team time zone.

There are no scheduled jobs in v1.

## 13. Edge cases

- A per-week booking keeps its hours in a week with a holiday or time off, so the week can turn Over (Ben, week of 23 Nov). To book around a holiday, use hours a day, or end the booking a week earlier and add a smaller one for that week.
- A per-day booking in a week with no available days adds nothing (Maya's Brightline booking, week of 23 Nov). The week detail lists it with 0 h, and the bookings CSV has no row for it.
- Time off that covers holidays or days the person doesn't work removes each working day once (Priya, week of 23 Nov). A part day off with as many hours as the working day, or more, counts as a full day off.
- A holiday added on a date someone has time off: the holiday wins, the time off stays recorded, and nothing is counted twice.
- Changing someone's working hours changes every week, including past utilization. Per-day bookings follow it; per-week bookings don't.
- A booking of someone who has been deactivated can be deleted but not changed (R4). It keeps counting in project totals and the bookings CSV, but its person leaves the Schedule, Who has time and the weekly load CSV.
- Bookings on a lost project stay on its page and count nowhere else. A closed project's bookings keep counting, because they are past work.
- Confirming a project also confirms its bookings in past weeks; only people with bookings that run this week or later are notified, and inactive people never are.
- The week of 28 Dec 2026 is named by its Monday and includes Fri 1 Jan 2027, New Year's Day.
- Two planners save the same booking: R12. Two people confirm the same project at once: the second gets "Only tentative projects can be confirmed."
- Someone signs in whose email isn't in People, or who is inactive: "Ask an admin to add you."

## 14. Seed data

Company: Larkspur Studio, a design and web studio. Team time zone America/New_York; emails are firstname@larkspur.example. Reset to seed data sets the clock to Wed 18 Nov 2026, 09:00, so the current week is the week of 16 Nov. The dates are fixed, not relative to today, so every worked example and check gives the same answer.

| Person | Title | Role | On schedule | Hours Mon to Sun | Week | Skills |
|---|---|---|---|---|---|---|
| Dana Ruiz | Studio director | admin | no | 8, 8, 8, 8, 8, 0, 0 | 40 h | Strategy |
| Ana Lima | Producer | planner | yes | 8, 8, 8, 8, 8, 0, 0 | 40 h | Project management |
| Maya Chen | Design lead | member | yes | 8, 8, 8, 8, 8, 0, 0 | 40 h | UI design, Branding |
| Jo Park | Designer | member | yes | 8, 8, 8, 0, 0, 0, 0 | 24 h | UI design, Illustration |
| Sam Okafor | Engineering lead | member | yes | 8, 8, 8, 8, 8, 0, 0 | 40 h | Frontend, Backend |
| Lee Park | Developer | member | yes | 8, 8, 8, 8, 8, 0, 0 | 40 h | Frontend |
| Ben Cho | Developer | member | yes | 8, 8, 8, 8, 0, 0, 0 | 32 h | Backend |
| Priya Nair | Copywriter | member | yes | 6, 6, 6, 6, 6, 0, 0 | 30 h | Copywriting, Branding |
| Tom Bennett | Contract developer | member | yes | 8, 8, 8, 8, 8, 0, 0 | 40 h | Frontend |

Everyone is active. Skills: Backend, Branding, Copywriting, Frontend, Illustration, Project management, Strategy, UI design. Holidays: Thu 26 Nov 2026 Thanksgiving, Fri 27 Nov 2026 Day after Thanksgiving, Fri 25 Dec 2026 Christmas Day, Fri 1 Jan 2027 New Year's Day.

Time off (all 2026): Lee Park Fri 20 Nov, part day 4 h; Maya Chen Mon 23 – Wed 25 Nov; Priya Nair Wed 25 – Fri 27 Nov; Sam Okafor Mon 7 – Wed 9 Dec; Jo Park Mon 21 – Wed 23 Dec (the last four are full days).

| Project | Client | Status | Phases (budget) |
|---|---|---|---|
| Brightline website | Brightline Bikes | confirmed | Design (100 h), Build (430 h) |
| Orchard app redesign | Orchard Health | confirmed | Discovery (40 h), Design (160 h) |
| Lumen rebrand | Lumen Coffee | tentative | Identity (90 h) |
| Studio website | (none) | confirmed | Refresh (no budget) |
| Pinecrest campaign | Pinecrest Bank | lost (by Ana Lima at 2026-11-12T15:00:00Z) | Concepts (40 h) |

| # | Person | Project · phase | Weeks of (2026) | Amount | Tentative |
|---|---|---|---|---|---|
| 1 | Maya Chen | Brightline website · Design | 2 Nov to 23 Nov | 4 h a day | no |
| 2 | Jo Park | Brightline website · Design | 2 Nov to 23 Nov | 16 h a week | no |
| 3 | Lee Park | Brightline website · Build | 16 Nov to 14 Dec | 8 h a day | no |
| 4 | Sam Okafor | Brightline website · Build | 23 Nov to 14 Dec | 16 h a week | no |
| 5 | Ben Cho | Brightline website · Build | 16 Nov to 14 Dec | 24 h a week | no |
| 6 | Tom Bennett | Brightline website · Build | 26 Oct to 9 Nov | 20 h a week | no |
| 7 | Ana Lima | Brightline website · Build | 30 Nov to 14 Dec | 4 h a week | yes; note "Extra producer time if the change request is approved." |
| 8 | Maya Chen | Orchard app redesign · Discovery | 9 Nov to 16 Nov | 4 h a day | no |
| 9 | Maya Chen | Orchard app redesign · Design | 30 Nov to 21 Dec | 24 h a week | no |
| 10 | Jo Park | Orchard app redesign · Design | 30 Nov to 7 Dec | 8 h a day | no |
| 11 | Maya Chen | Lumen rebrand · Identity | 30 Nov to 14 Dec | 20 h a week | yes |
| 12 | Priya Nair | Lumen rebrand · Identity | 30 Nov to 14 Dec | 10 h a week | yes |
| 13 | Ben Cho | Studio website · Refresh | 16 Nov to 7 Dec | 8 h a week | no |
| 14 | Priya Nair | Studio website · Refresh | 16 Nov to 23 Nov | 2 h a day | no |
| 15 | Priya Nair | Pinecrest campaign · Concepts | 30 Nov to 7 Dec | 10 h a week | yes |

Every seed row was created by Ana Lima at 2026-10-26T14:00:00Z, and no booking has been changed since (updated_at is the same time). The outbox starts empty.

Resulting Schedule (check these after loading):

| Person | 16 Nov | 23 Nov | 30 Nov | 7 Dec | 14 Dec | 21 Dec | 28 Dec | 4 Jan 2027 | 8 weeks |
|---|---|---|---|---|---|---|---|---|---|
| Ana Lima | 0/40 | 0/24 | 4/40 | 4/40 | 4/40 | 0/32 | 0/32 | 0/40 | 0%, 4% with tentative |
| Ben Cho | 32/32 | 32/24 Over | 32/32 | 32/32 | 24/32 | 0/32 | 0/32 | 0/32 | 61% |
| Jo Park | 16/24 | 16/24 | 24/24 | 24/24 | 0/24 | 0/0 Off | 0/24 | 0/24 | 48% |
| Lee Park | 40/36 Over | 24/24 | 40/40 | 40/40 | 40/40 | 0/32 | 0/32 | 0/40 | 65% |
| Maya Chen | 40/40 | 0/0 Off | 44/40 Tentative over | 44/40 Tentative over | 44/40 Tentative over | 24/32 | 0/32 | 0/40 | 52%, 74% with tentative |
| Priya Nair | 10/30 | 4/12 | 10/30 | 10/30 | 10/30 | 0/24 | 0/24 | 0/30 | 7%, 21% with tentative |
| Sam Okafor | 0/40 | 16/24 | 16/40 | 16/16 | 16/40 | 0/32 | 0/32 | 0/40 | 24% |
| Tom Bennett | 0/40 | 0/24 | 0/40 | 0/40 | 0/40 | 0/32 | 0/32 | 0/40 | 0% |
| Team | 138/282, 49% | 92/156, 59% | 170/286, 48% | 170/262, 52% | 138/286, 36% | 24/216, 11% | 0/240, 0% | 0/286, 0% | 31%, 36% with tentative |

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Capacity Planner blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Person, Skill, PersonSkill, Holiday, TimeOff, Project, Phase, Booking, Notification) with a real database. Store every hour amount as integer minutes.
2. Add sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin → People, Admin → Skills and Admin → Holidays (section 10, screens 9 to 11). Only admins can open them ("Admins only." for everyone else, also by URL), and the server refuses admin actions from anyone else. Enforce R2 for holiday dates, R3 for working hours, R8 and R9.
4. Load the seed data from section 14 exactly, including the time off, projects, phases and bookings that later phases show.
5. Add the development toolbar from section 12: "sign in as", the clock (every server-side read of the current time must use it) and "Reset to seed data". None of it may exist or respond in production.

Do not build the Schedule, bookings or project screens yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin → People lists 9 active people: Dana Ruiz (admin, not on the schedule), Ana Lima (planner) and 7 members. Weekly hours read "40 h a week" for Dana, Ana, Maya, Sam, Lee and Tom, "24 h a week" for Jo Park, "32 h a week" for Ben Cho and "30 h a week" for Priya Nair.
- [ ] Signed in as Maya, and then as Ana, the Admin pages show "Admins only." (also when opened by URL) and a direct request to save a person is refused. Signed in as Dana, they open.
- [ ] Editing Priya Nair, a Friday of 25 hours and a Friday of 6.1 hours are each refused with "Enter 0 to 24 hours a day, in steps of 0.25.", and setting every day to 0 is refused with "Someone on the schedule needs at least one working day." A Friday of 4 hours saves, and her weekly hours read "28 h a week".
- [ ] Admin → Skills lists Backend 2, Branding 2, Copywriting 1, Frontend 3, Illustration 1, Project management 1, Strategy 1 and UI design 2. Adding "ui design" is refused with "There's already a skill called UI design." Deleting Illustration asks "Remove Illustration from 1 person?" and, once confirmed, Jo Park's only skill is UI design.
- [ ] Deactivating Lee Park is refused with "Lee Park has 1 booking that runs this week or later. End or delete it first.", taking Ben Cho off the schedule with "Ben Cho has 2 bookings that run this week or later. End or delete them first.", and changing Dana's role to planner with "There must be at least one active admin." Deactivating Tom Bennett works (his only booking ended before this week): Admin → People shows him as inactive, and "sign in as" Tom shows "Ask an admin to add you."
- [ ] Admin → Holidays for 2026 lists Thu 26 Nov Thanksgiving, Fri 27 Nov Day after Thanksgiving and Fri 25 Dec Christmas Day, and 2027 lists Fri 1 Jan 2027 New Year's Day. Adding a holiday on 2026-12-25 is refused with "There's already a holiday on Fri 25 Dec.", and a direct request for 2026-02-30 is refused with "Enter a real date."
- [ ] The toolbar shows "Today: Wed 18 Nov 2026", and "+1 day" changes it to "Today: Thu 19 Nov 2026". "Reset to seed data" sets it back to Wed 18 Nov 2026, makes Tom Bennett active again, sets Priya Nair's weekly hours back to "30 h a week" and gives Jo Park Illustration again.

### Phase 2: Capacity, bookings and the Schedule

```
Using the Capacity Planner blueprint above, build Phase 2 only.

1. Implement section 6 as pure server-side functions (day capacity and label, week capacity, a booking's hours in a week, week totals and status, utilization), with unit tests for every row of the section 6 worked examples and for every cell of the resulting Schedule in section 14.
2. Build the Schedule, now the home page, and the week detail (section 10, screens 1 and 2).
3. Build the booking form (screen 3) for planners and admins: add, change and delete bookings, with the live preview. The preview's phase line uses the budget arithmetic in section 7. Members can't open the form, and the server refuses their booking requests with "Planners only."
4. Build Time off (screen 7) with R7.
5. Enforce R1 to R7 and R11 to R13 on the server, not only by hiding buttons, including the updated_at check in R12.

Do not build the project pages, Who has time, notifications or export yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Maya, the Schedule shows the weeks of 16 Nov to 4 Jan 2027 and 8 rows (Ana Lima, Ben Cho, Jo Park, Lee Park, Maya Chen, Priya Nair, Sam Okafor, Tom Bennett; not Dana Ruiz), and every cell matches section 14, including Lee Park "40/36" Over for 16 Nov, Ben Cho "32/24" Over for 23 Nov, Maya Chen "0/0" Off for 23 Nov and "44/40" Tentative over for 30 Nov, and Jo Park "0/0" Off for 21 Dec.
- [ ] The Team row reads "138/282" and "49%" for the week of 16 Nov and "92/156" and "59%" for the week of 23 Nov. Maya Chen's 8 weeks cell reads "52%" and "74% with tentative", and Tom Bennett's reads "0%". Filtering by Frontend leaves Lee Park, Sam Okafor and Tom Bennett, and the Team row for 23 Nov then reads "40/72" and "56%".
- [ ] Clicking Priya Nair's cell for 23 Nov shows "Mon 23 Nov: 6 h", "Tue 24 Nov: 6 h", "Wed 25 Nov: Time off", "Thu 26 Nov: Thanksgiving", "Fri 27 Nov: Day after Thanksgiving", "Sat 28 Nov: Not a working day", "Sun 29 Nov: Not a working day", "Capacity: 12 h", "Studio website (Refresh): 4 h · 2 h a day · Confirmed" and "Booked: 4 h of 12 h". Lee Park's cell for 16 Nov shows "Fri 20 Nov: 4 h (time off 4 h)".
- [ ] Signed in as Maya, there is no Add booking button, the booking form shows "Planners only." when opened by URL, and a direct request to create a booking is refused.
- [ ] Signed in as Ana, a new booking for Sam Okafor on Orchard app redesign (Design), 20 h a week for the week of 7 Dec only, previews "Week of 7 Dec: 36 h of 16 h · Over by 20 h" and "Orchard app redesign (Design): 164 h of 160 h · Over by 4 h". It saves, and Sam's cell for 7 Dec reads "36/16" Over.
- [ ] On a new booking for Priya Nair on Lumen rebrand (Identity), Tentative is ticked and can't be unticked; 2 h a day for the week of 30 Nov saves, and Priya's cell for 30 Nov reads "20/30" with no status. A direct request to save a confirmed booking on Lumen rebrand is refused with "Lumen rebrand is tentative, so its bookings are too."
- [ ] The booking form refuses 25 h a day ("Enter 0.25 to 24 hours a day, in steps of 0.25."), 10.1 h a week ("Enter 0.25 to 168 hours a week, in steps of 0.25.") and a last week before the first ("The last week can't be before the first week."), and a direct request with first_week 2026-11-18 is refused with "Weeks start on a Monday."
- [ ] Ana changes Ben Cho's Brightline website (Build) booking from 24 to 16 h a week: Ben's cells read "24/32" for 16 Nov and "24/24" with no status for 23 Nov. She deletes Jo Park's Brightline website (Design) booking: Jo's cells for 16 Nov and 23 Nov read "0/24".
- [ ] Signed in as Maya, time off for Fri 4 Dec saves and her cell for 30 Nov reads "44/32" Tentative over. Time off for Mon 16 Nov is refused with "Time off can't start in the past. Ask a planner to record it.", time off for Tue 24 Nov with "Overlaps your time off, Mon 23 – Wed 25 Nov.", and a direct request to remove Lee Park's time off with "You can only remove your own time off." Signed in as Ana, removing Lee's Fri 20 Nov time off makes his cell for 16 Nov read "40/40".

### Phase 3: Projects, budgets and Who has time

```
Using the Capacity Planner blueprint above, build Phase 3 only.

1. Build Projects and the Project page (section 10, screens 4 and 5) with every action in the section 7 transitions table, the budget arithmetic and flags, R5 and R10. Check the status inside the same transaction as each change (R12).
2. Confirming a project sets all its bookings to confirmed in the same transaction. Closing is refused while any of its bookings runs after the current week.
3. Build Who has time (screen 6) exactly as section 8, with unit tests for its worked examples, and the Book button for planners and admins.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Maya, Projects lists Brightline website (Brightline Bikes, Confirmed, 530 h budget, 564 h booked, Over budget), Lumen rebrand (Lumen Coffee, Tentative, 90 h, 90 h), Orchard app redesign (Orchard Health, Confirmed, 200 h, 184 h) and Studio website (Confirmed, No budget, 46 h), with Pinecrest campaign (Pinecrest Bank, Lost, 40 h, 20 h) under Closed and lost. There is no New project button, and a direct request to create a project is refused with "Planners only."
- [ ] The Brightline website page shows Design with a 100 h budget, 124 h confirmed, 0 h tentative, "Over by 24 h", 124% and Over budget, and Build with 430 h, 428 h confirmed, 12 h tentative, "Over by 10 h", 102% and Tentative over budget, and lists 7 bookings, including Tom Bennett's (weeks of 26 Oct to 9 Nov, 60 h). The Orchard app redesign page shows Discovery at 40 h confirmed of 40 h, "0 h left", 100% and no flag, and Design at 144 h confirmed, "16 h left", 90%.
- [ ] Who has time for UI design, weeks of 30 Nov to 14 Dec, lists Jo Park first (capacity 72 h, confirmed 48 h, 24 h free, weekly cells 0, 0, 24) and Maya Chen second (capacity 120 h, confirmed 72 h, tentative 60 h, "Over by 12 h", weekly cells -4, -4, -4). Unticking "Count tentative bookings as busy" puts Maya Chen first with 48 h free and Jo Park second with 24 h free.
- [ ] Who has time for Frontend, week of 23 Nov to week of 23 Nov, lists Tom Bennett (24 h free), Sam Okafor (8 h) and Lee Park (0 h) in that order. Signed in as Ana, Book on Tom Bennett's row opens the booking form with Tom Bennett and the week of 23 Nov filled in.
- [ ] The Pinecrest campaign page shows Lost, the Concepts phase with 20 h tentative under "Lost: these hours don't count on the schedule.", and no edit controls, even for Ana. A direct request to add a booking to Concepts is refused with "Pinecrest campaign is lost, so it can't change.", and Priya Nair's Schedule cell for 30 Nov reads "10/30".
- [ ] Ana confirms Lumen rebrand. Its Identity phase shows 90 h confirmed and 0 h tentative, and Maya Chen's Schedule cells for 30 Nov, 7 Dec and 14 Dec read "44/40" Over. A direct request to confirm it again is refused with "Only tentative projects can be confirmed."
- [ ] Closing Brightline website is refused with "Brightline website has 6 bookings that run after this week. End or delete them first." Ana creates Harbor app for Harbor Ferries as Tentative with a first phase Discovery of 60 h, and it is listed with a 60 h budget and 0 h booked. Creating a project called "brightline website" is refused with "There's already a project called Brightline website."
- [ ] Deleting Harbor app's Discovery phase is refused with "A project needs at least one phase.", and deleting Orchard app redesign's Discovery phase with "Discovery has 1 booking. Move or delete it first." Ana marks Harbor app lost, and it moves under Closed and lost.

### Phase 4: Notifications and export

```
Using the Capacity Planner blueprint above, build Phase 4 only.

1. Add the notifications in section 11 to the actions built in Phases 1 to 3 (bookings, time off, holidays, working hours and confirming a project). Write each one to the outbox in the same transaction as the change and send it after the commit. Email can use any provider we have; if none is configured, mark it "logged" instead of sending. A failed send never blocks or undoes the change.
2. Add unit tests for the "becomes Over" comparison: a week that was already Over, or is only Tentative over, sends nothing; weeks before the current week send nothing; the person who made the change gets nothing.
3. Build Admin → Outbox (section 10, screen 12) with Retry failed.
4. Build Export (screen 8) with both CSV files, exactly as specified.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Ana, add a booking for Sam Okafor on Orchard app redesign (Design), 20 h a week for the week of 7 Dec. Signed in as Dana, Admin → Outbox shows three new notifications, all logged: "Over capacity: Sam Okafor, week of 7 Dec (36 h of 16 h)" to Dana Ruiz and to Sam Okafor, and "New booking: Orchard app redesign (Design)" to Sam Okafor with the body "Ana Lima booked you on Orchard app redesign (Design): 20 h a week, week of 7 Dec." None goes to Ana Lima.
- [ ] Ana changes Ben Cho's Brightline website (Build) booking from 24 to 16 h a week. The outbox gets exactly one new notification: "Booking changed: Brightline website (Build)" to Ben Cho, whose body includes "Before: 24 h a week, weeks of 16 Nov to 14 Dec. Now: 16 h a week, weeks of 16 Nov to 14 Dec."
- [ ] Ana changes Priya Nair's Lumen rebrand (Identity) booking from 10 to 12 h a week, and the outbox gets no new notifications.
- [ ] Ana confirms Lumen rebrand. The outbox gets four new notifications: "Confirmed: Lumen rebrand" to Maya Chen and to Priya Nair (Priya's body includes "Identity, 12 h a week, weeks of 30 Nov to 14 Dec"), and "Over capacity: Maya Chen, 3 weeks from 30 Nov" to Dana Ruiz and to Maya Chen, whose body has three lines: "Week of 30 Nov: 44 h booked, 40 h capacity, 4 h over.", "Week of 7 Dec: 44 h booked, 40 h capacity, 4 h over." and "Week of 14 Dec: 44 h booked, 40 h capacity, 4 h over."
- [ ] Ana adds full-day time off for Ben Cho, Mon 30 Nov – Tue 1 Dec. The outbox gets "Time off added: Mon 30 Nov – Tue 1 Dec" to Ben Cho, and "Over capacity: Ben Cho, week of 30 Nov (24 h of 16 h)" to Dana Ruiz and to Ben Cho.
- [ ] Signed in as Maya, she adds time off for Fri 4 Dec. Her Schedule cell for 30 Nov reads "44/32" Over, and the outbox gets no new notifications (the week was already Over, and she made the change herself).
- [ ] Signed in as Ana, Export → Weekly load CSV for the weeks of 16 Nov to 23 Nov downloads `weekly-load-2026-11-16-to-2026-11-23.csv` with 16 rows. Lee Park's row for 2026-11-16 reads capacity_hours 36, confirmed_hours 40, tentative_hours 0, booked_hours 40, free_hours -4, utilization_pct 111, status over; Maya Chen's row for 2026-11-23 has capacity_hours 0, an empty utilization_pct and status off.
- [ ] The Bookings CSV for the week of 23 Nov to the week of 23 Nov has 6 rows, in this order: Ben Cho (Brightline website, Build, 16), Ben Cho (Studio website, Refresh, 8), Jo Park (Brightline website, Design, 16), Lee Park (Brightline website, Build, 24), Priya Nair (Studio website, Refresh, 4) and Sam Okafor (Brightline website, Build, 16). There is no row for Maya Chen.
- [ ] Signed in as Maya, Export and Admin → Outbox are not in the navigation; opened by URL, Export shows "Planners only." and Admin → Outbox shows "Admins only.", and direct requests for either CSV are refused.

## 16. Variations

- Percentages of capacity ("half of Maya's time for four weeks"), converted to hours.
- Working hours that change from a chosen week on, so past weeks keep their capacity.
- Several holiday lists for offices in different countries, one per person.
- Placeholders for roles you haven't hired yet, swapped for a person later.
- A Monday "your week" email for each person, sent by a scheduled job.
- Bookings for specific days, with over-capacity checked per day.
- Time tracking, so planned hours can be compared with actual hours.
- Bill rates and fees, so budgets can be in money as well as hours.
- Drag and drop on the grid to move bookings between people and weeks.
- Slack messages for over-capacity and booking changes.
- Approved leave imported from the Time-Off Tracker blueprint, so time off is entered once.
