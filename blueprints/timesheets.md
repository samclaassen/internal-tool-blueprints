<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/timesheets . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Timesheets

Blueprint BP-017 · Department: Finance · Replaces: Harvest (time tracking and timesheet approval), the hours spreadsheet
For teams of 5 to 100 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Every month-end I chase people for their hours before I can invoice."

A team that bills clients by the hour, or needs to know where its time goes, collects hours in a spreadsheet or a chat thread. People fill it in late, nobody checks the numbers before they go on an invoice, a project quietly runs past its budget, and when a client questions a bill there is no record of who approved what.

This blueprint is a weekly timesheet. People log hours against projects, submit the week, and their manager approves it, which locks it. Billable amounts and budget burn are calculated from approved and submitted hours, project owners are warned at 80% and 100% of budget, and approved hours export cleanly for invoicing.

## 2. What the real product does

Research basis: Harvest's pricing page (getharvest.com/pricing) and its help center articles "Submitting and approving timesheets" and "Unlocking approved time and expenses" (support.getharvest.com/hc/en-us/articles/360048181832 and /4408205049869), October 2026.

What we verified:

1. **Plans and price.** Free is $0 for 1 seat and 2 projects. Teams starts from $9 per seat per month billed annually ($108 per seat per year) or from $11 monthly, with team reporting, invoicing and accounting integrations. Enterprise starts from $14 per seat per month billed annually ($168 per seat per year) or from $17.50 monthly, and adds profitability reporting, timesheet approvals, an activity log, SAML SSO and required notes. Enterprise Plus has custom pricing. Additional invoices, projects, clients and tasks beyond each plan's base are billed by usage. Annual billing is 20% off, and there is a 30-day free trial.
2. **Tracking.** Timers, weekly and daily timesheets and calendar imports, on web, desktop and mobile; time and materials or fixed-fee projects; billable and cost rates per person on Teams and up; project estimates; expense tracking; invoicing.
3. **Approval.** Timesheet approval lets administrators and managers review, approve and lock a team's submitted time and expenses. Timesheets can be submitted daily, weekly or for a custom range, and time and expenses are submitted and approved together. Once approved, entries are locked; an administrator withdraws approval to let someone edit them again.

### What this blueprint keeps

Clients and projects with an hourly rate (or non-billable), a budget in hours and an owner; who is assigned to which project; a weekly timesheet per person with entries in 15-minute steps; submit the week, withdraw before approval, approve (which locks it) or reject with a comment; an admin can withdraw an approval to unlock a week; the rate is fixed onto entries when they are approved; billable amounts and budget burn; warnings to project owners at 80% and 100% of budget; Friday and Monday reminders to submit; reports by project, client and person; CSV export of approved hours for invoicing; an activity log.

### What this blueprint deliberately leaves out

Running timers and desktop or mobile apps, calendar imports, invoicing and payments, expense tracking, cost rates and profitability, capacity planning and forecasting, fixed-fee projects, tasks within projects, required notes as a setting (v1 always allows notes and requires one only for a week with no hours), accounting integrations and SSO. These matter to agencies running their whole billing on one tool. A team of 5 to 100 people needs hours entered on time, checked by a manager, and totals it can trust when it invoices. If you also want invoicing and timers in one product, Harvest's Teams plan covers them; timesheet approval is listed on its Enterprise plan.

## 3. Scope of v1

- One company, one currency (USD). Rates are integer cents per hour; durations are integer minutes.
- Weeks run Monday to Sunday in the team time zone (Settings; default America/New_York). "Today" means today in that zone.
- One approver per person: their manager.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone; entering a day's hours on a phone must be quick.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Member | Everyone | Enter, edit and delete their own entries on weeks that are in draft; submit and withdraw their own week; see their own hours and the projects they are assigned to. |
| Manager | Anyone who is someone's manager | Approve or reject the submitted weeks of their direct reports; see those people's timesheets. |
| Project owner | The person set as a project's owner | See all hours on their project, its budget burn, and receive its budget warnings. |
| Admin | One or more people (usually finance) | Manage people, clients, projects, assignments and settings; see everything; withdraw an approval with a reason; export; read the outbox. |

The server enforces all of this. Nobody approves their own timesheet.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name, email (unique, lowercase), manager_id (nullable; never themselves; no loops), is_admin, active
- weekly_capacity_minutes (default 2400, i.e. 40 hours; used only for the "under hours" note in reminders)

**Settings** (one row)
- company_name, time_zone, reminder_weekday (default Friday), reminder_time (default "15:00")

**Client**
- id, name (unique, 1 to 80), archived

**Project**
- id, client_id (nullable for internal projects), name (1 to 80; unique within the client), owner_id (active Person)
- billable (boolean), rate_cents (integer per hour; required when billable, 0 to 100,000)
- budget_minutes (nullable; no budget when empty), archived
- warned_80_at, warned_100_at (nullable timestamps; R10)

**Assignment**
- project_id, person_id; unique pair. Only assigned people can log time to a project.

**Week** (one per person per Monday)
- id, person_id, week_start (date, always a Monday)
- status: draft | submitted | approved
- submitted_at, approved_at, approved_by (nullable), approver_id (set at submission, R6)
- empty_note (required when submitting a week with no entries, 5 to 200 characters, e.g. "On leave")
- reminded_on (nullable date; R11), version (integer; R13)

**Entry**
- id, week_id, person_id, project_id, date (inside the week), minutes (15 to 1,440, multiple of 15), note (optional, max 300)
- rate_cents (nullable; copied from the project when the week is approved, R9)

**Event** (append-only)
- id, actor_id (nullable for the system), week_id (nullable), project_id (nullable)
- type: entry_added | entry_edited | entry_deleted | submitted | withdrawn | approved | rejected | approval_withdrawn | budget_warning | reminded | project_changed
- data (JSON), created_at

**Notification** (outbox)
- id, kind, to_email, person_id, subject, body, status: pending | sent | logged | failed, error, created_at, sent_at

## 6. Time, money and budgets

- **R1. Entries.** Minutes are whole multiples of 15 between 15 and 1,440. A person's total for one date cannot exceed 1,440 minutes. Dates cannot be after today. Hours display as decimals with two places ("7.50 h") and in reports also as h:mm ("7:30").
- **R9. Rates.** While a week is not approved, its billable value uses the project's current rate. Approving a week copies each entry's project rate onto the entry, so later rate changes never change approved hours. Billable value of an entry = minutes × rate_cents ÷ 60, rounded half up to the cent; totals are sums of entry values. Non-billable projects have no value.
- **R10. Budget burn.** For a project with a budget: used = minutes on submitted and approved weeks (drafts are not counted). Burn = used ÷ budget_minutes, shown as a whole percent rounded down. When burn first reaches 80%, and again when it first reaches 100%, the project owner gets one email each (warned_80_at, warned_100_at). Draft time is shown separately as "plus 6.00 h in drafts".

### Worked examples (seed data in section 14; the current week starts Mon Oct 12, 2026)

| Project | Rate | Budget | Submitted + approved | Burn | Billable value |
|---|---|---|---|---|---|
| Acme · Website redesign | $150.00 | 120 h | 96 h | 80%: warning sent to Maya Chen | 96 × $150 = $14,400.00 |
| Bluebird · Brand refresh | $140.00 | 60 h | 22.5 h | 37% | 22.5 × $140 = $3,150.00 |
| Internal · Admin and meetings | non-billable | none | 39.5 h | no budget | none |

- An entry of 1 h 45 min on Website redesign is worth 105 × 15,000 ÷ 60 = 26,250 cents = $262.50.
- If the Website redesign rate changes to $160 after Lee's week of Oct 5 was approved, Lee's approved entries stay at $150; draft and submitted hours show $160 until they are approved.

## 7. Weekly lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Add, edit or delete entries | The person | draft | draft | R1; events |
| Submit | The person | draft | submitted | Needs at least one entry, or empty_note; approver set by R6; approver emailed |
| Withdraw | The person | submitted | draft | Only before approval; approver emailed |
| Approve | The week's approver | submitted | approved | Rates copied (R9); locked; person emailed |
| Reject | The week's approver | submitted | draft | Comment of 5 to 300 characters required; person emailed with it |
| Withdraw approval | Admin | approved | draft | Reason required; rates on entries cleared; person and approver emailed |

Weeks in the future cannot be submitted. A week can be submitted from its Friday onward (team time zone), or any time after it ends.

## 8. Business rules

- **R2. Assignments.** A person can log time only to active projects they are assigned to. Removing an assignment does not touch existing entries.
- **R3. Locks.** Entries on submitted and approved weeks cannot be added, edited or deleted, by anyone, through any route. Withdraw (person, before approval) or withdraw approval (admin) unlocks them.
- **R4. Week membership.** An entry's date must fall inside its week; moving an entry to another week is a delete and an add.
- **R5. Archived projects and clients.** Archived projects accept no new entries and are hidden from pickers; their hours remain in reports.
- **R6. Approver.** At submission the approver is the person's manager; with no active manager, the first active admin by name who is not the person. Nobody approves their own week; if nobody else can, submitting is refused: "No one can approve your timesheet. Ask an admin to set your manager."
- **R7. Visibility.** Members see their own weeks; managers also see their direct reports'; project owners see all entries on their projects; admins see everything. Anyone else gets "Not found".
- **R8. Validation.** Names trimmed, rates and budgets non-negative integers, a billable project needs a rate. Notes and names are rendered as text, never as HTML.
- **R11. Reminders.** At reminder_time on reminder_weekday, each active person whose current week is still a draft gets one reminder (reminded_on), noting if their entered hours are below their weekly capacity. On Monday at 10:00, each person whose previous week is still a draft gets one reminder. Nobody gets two reminders for the same week on the same day.
- **R12. People.** Deactivating a person who is the approver of a submitted week, or the owner of an active project, is refused until reassigned.
- **R13. Stale actions.** Approve, reject and withdraw approval check the week's version; if it changed since the page loaded, refuse with "This timesheet changed. Reload to see the latest version."
- **R14. Events.** Every successful action writes the event in section 7; events are never edited or deleted.

## 9. Screens

1. **My week** (home). Monday to Sunday columns, one row per project with time, day totals and the week total, a status banner (Draft, Submitted to Maya Chen, Approved by Maya Chen on Oct 13), Submit or Withdraw, and arrows to the previous and next week. On a phone, one day at a time with a quick "+ add time" form (project, hours as 0:15 steps, note).
2. **Approvals.** Submitted weeks waiting for me, oldest first, with person, week, total hours, billable hours, and Approve or Reject; opening one shows the full week read-only.
3. **Projects.** Each project with client, owner, rate, budget burn bar (with the 80% mark), used and draft hours; opening one shows hours by person and by week.
4. **Reports.** Pick a date range and group by client, project or person: hours, billable hours, billable value, approved versus submitted. Export CSV.
5. **Admin: People** (manager, admin, capacity, active), **Admin: Clients and projects** (with assignments), **Admin: Settings**, **Admin: Outbox**, **Activity log**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Submit | Approver | "Timesheet to approve: Jo Park, week of Oct 5 (38.00 h)" |
| Withdraw | Approver | "Withdrawn: Jo Park's timesheet for the week of Oct 5" |
| Approve | Person | "Approved: your timesheet for the week of Oct 5" |
| Reject | Person | "Changes needed on your timesheet for the week of Oct 5" (with the comment) |
| Withdraw approval | Person and approver | "Approval withdrawn: week of Oct 5" (with the reason) |
| Budget warning (R10) | Project owner | "Website redesign has used 80% of its budget (96 of 120 h)" |
| Reminder (R11) | Person | "Please submit your timesheet for the week of Oct 12" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by the job. A notification failure never blocks the action that caused it.

## 11. Scheduled job and time

An hourly job (protected by a CRON_SECRET header, with a development-only "run job now" control and a development clock) sends the reminders in R11, checks budgets for R10 (also checked right after every submit and approve), and retries failed notifications. All time reads go through one function that adds the development clock offset.

## 12. Export

CSV of approved entries for a date range and client: date, client, project, person, hours (decimal), note, rate, value. Only approved weeks are included, so an invoice never contains unchecked hours. A second export lists submitted-but-unapproved weeks so finance can chase them.

## 13. Edge cases

- Someone logs a 25-hour day across two entries: the second entry is refused by R1.
- A manager rejects a week after the person already started next week: only the rejected week returns to draft.
- An approved week needs a fix after invoicing: the admin withdraws approval with a reason, the person edits and resubmits, and the activity log shows the history.
- A project crosses 100% of budget through one large submission: both the 80% and the 100% warnings are sent once each.
- A person moves teams: their manager changes; weeks already submitted keep their approver.

## 14. Seed data

Settings: company "Fernway", time zone America/New_York, reminders Fridays at 15:00.

People (emails firstname@fernway.example): Dana Ruiz (admin, no manager), Maya Chen (manager Dana), Sam Okafor (manager Dana), Jo Park (manager Maya), Lee Park (manager Maya), Ben Cho (manager Sam). All active, capacity 40 h.

Clients and projects:
- Acme Corp · Website redesign: billable at $150.00, budget 120 h, owner Maya Chen, assigned Jo, Lee, Maya.
- Bluebird · Brand refresh: billable at $140.00, budget 60 h, owner Sam Okafor, assigned Ben, Jo, Sam.
- Internal (no client) · Admin and meetings: non-billable, no budget, owner Dana Ruiz, assigned everyone.

Weeks (T is the day the seed is loaded; the examples assume Tue Oct 13, 2026, so the current week starts Mon Oct 12 and the previous week is Oct 5 to 11. If you load the seed on another weekday, set the development clock to the Tuesday of the current week first):

| Week | Person | Status | Website redesign | Brand refresh | Admin and meetings | Total |
|---|---|---|---|---|---|---|
| Sep 28 | Lee Park | Approved by Maya | 38 h | | 2 h | 40 h |
| Sep 28 | Jo Park | Approved by Maya | 20 h | 16 h | 4 h | 40 h |
| Oct 5 | Lee Park | Approved by Maya | 36 h | | 4 h | 40 h |
| Oct 5 | Jo Park | Submitted, waiting for Maya | 2 h | 6.5 h | 29.5 h | 38 h |
| Oct 5 | Ben Cho | Draft, no entries | | | | 0 h |
| Oct 12 (current) | Lee Park | Draft | 6 h (Monday) | | | 6 h |
| Oct 12 (current) | Jo Park | Draft | | 3 h (Monday) | | 3 h |

Totals that follow: Website redesign submitted and approved = 38 + 20 + 36 + 2 = 96 h (80% of 120 h; the 80% warning to Maya is recorded as already sent), plus 6 h in drafts. Brand refresh = 16 + 6.5 = 22.5 h (37%), plus 3 h in drafts. Admin and meetings = 2 + 4 + 4 + 29.5 = 39.5 h, not budgeted.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Timesheets blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin: People, Admin: Clients and projects (with assignments) and Admin: Settings (section 9, screen 5) for admins only, with R8 and R12 enforced on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build timesheets yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin: Clients and projects shows Website redesign at $150.00 with a 120 h budget owned by Maya Chen, and its three assigned people.
- [ ] Signed in as Jo, Admin pages say "Only admins can open this page." and a direct request to change a rate is refused.
- [ ] Saving a billable project without a rate is refused.
- [ ] Deactivating Maya Chen is refused because she is the approver of Jo's submitted week and owns an active project.

### Phase 2: My week, submit and withdraw

```
Using the Timesheets blueprint above, build Phase 2 only.

1. Build My week (section 9, screen 1), including the phone layout.
2. Implement entries and the draft, submit and withdraw actions in section 7 with R1 to R8 and R14, enforced on the server.
3. Write the submit and withdraw emails to the outbox and build Admin: Outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Lee, My week for the current week shows 6.00 h on Website redesign on Monday and the status Draft.
- [ ] Adding 1:45 on Website redesign works; adding 1:40 is refused; adding an entry that takes one day over 24 hours is refused.
- [ ] Adding time to Brand refresh is not possible for Lee (he is not assigned), and a direct request to do so is refused.
- [ ] Submitting the current week before Friday is refused; after moving the clock to Friday, Lee submits it, the banner says "Submitted to Maya Chen", and the outbox has "Timesheet to approve" for Maya.
- [ ] While submitted, Lee cannot edit or delete an entry, including through a direct request; withdrawing returns the week to Draft and emails Maya.
- [ ] Signed in as Ben, submitting last week with no entries is refused until he adds the note "On leave", then it submits to Sam Okafor.

### Phase 3: Approvals, rates and budgets

```
Using the Timesheets blueprint above, build Phase 3 only.

1. Build Approvals and Projects (section 9, screens 2 and 3).
2. Implement approve, reject and withdraw approval (section 7) with R6, R9, R10 and R13, and their emails.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Maya, Approvals lists Jo Park's week of Oct 5 with 38.00 h; approving it locks it and emails Jo.
- [ ] Projects shows Website redesign at 80% (96 of 120 h) "plus 6.00 h in drafts", and Brand refresh at 37%.
- [ ] After Dana changes the Website redesign rate to $160, Lee's approved weeks still value at $150 per hour, while his draft hours show $160.
- [ ] Rejecting a submitted week without a comment is refused; with a comment it returns to Draft and the person is emailed.
- [ ] Dana withdraws approval of Lee's week of Oct 5 with a reason: it becomes Draft and editable, and both Lee and Maya are emailed.
- [ ] Submitting enough hours to take Website redesign past 120 h sends Maya the 100% warning once, and no second 80% warning.
- [ ] Maya submits a week of her own: it goes to Dana Ruiz, and Maya has no Approve button on it.

### Phase 4: Reminders, reports and export

```
Using the Timesheets blueprint above, build Phase 4 only.

1. Build the scheduled job in section 11 with reminders (R11), and a development-only "run job now" control.
2. Build Reports and the exports in section 12.
3. Build the Activity log.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Moving the clock to Friday 15:00 and running the job reminds everyone whose current week is a draft, once; running it again sends nothing new.
- [ ] Moving the clock to the next Monday 10:00 and running the job reminds people whose previous week is still a draft.
- [ ] Reports grouped by client for the last 30 days shows Acme Corp's billable value from approved and submitted hours, with approved and submitted shown separately.
- [ ] The approved-hours export for Acme Corp contains only entries from approved weeks, with rate and value columns, and no entries from Jo's submitted week.

## 16. Variations

- A running timer that turns into an entry when stopped.
- Tasks within projects and per-person billable rates.
- Cost rates and profitability by project.
- Fixed-fee projects with milestones.
- Invoices created from the approved-hours export.
- Calendar import of meetings as draft entries.
