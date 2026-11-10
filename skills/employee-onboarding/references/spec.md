<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/employee-onboarding . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

# Employee Onboarding

Blueprint BP-015 · Department: People · Replaces: BambooHR (onboarding checklist), the new-hire spreadsheet
For teams of 5 to 150 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Every new hire's first week depends on who remembers what."

A new person starts on Monday. Whether their laptop arrived, whether their accounts work, whether anyone planned their first day, and whether their manager ever checks in at 30 days all depend on a few people remembering. The checklist exists somewhere, but nobody owns each line, nothing has a date, and nobody notices a missed step until the new hire is sitting at an empty desk.

This blueprint makes onboarding a set of dated tasks with owners. A template turns a start date into a checklist for IT, the manager, the people team, a buddy and the new hire. Tasks are due relative to the start date, late ones are flagged, and everyone gets one email a day with what is theirs.

## 2. What the real product does

Research basis: BambooHR's pricing page and pricing FAQ (bamboohr.com/pricing), October 2026.

What we verified:

1. **Price.** For companies with 25 employees or fewer, BambooHR charges a flat monthly rate: $250 for Core, $425 for Pro and $650 for Elite. Above 25 employees it charges per employee per month, starting at $10.25 for Core, $17.50 for Pro and $25 for Elite, with automatic volume discounts. Monthly or longer terms are available.
2. **Onboarding features.** Under Hiring & Onboarding, the plan comparison lists a new hire packet, an onboarding checklist, e-signatures, email and offer letter templates, and an applicant tracking system.
3. **The rest of the HR system.** Employee records, custom reports, workflows and approvals, dashboards, time-off management and a time-off calendar, benefits tracking, performance management on Pro, compensation management on Elite, payroll, and over 150 integrations.

BambooHR is a full HR system; onboarding is one part of it. If you already pay for an HR system with onboarding, use it. This blueprint is for teams that do not have one, or whose system's checklist does not fit how they work.

### What this blueprint keeps

Onboarding templates (a base template plus role add-ons) with tasks owned by roles (manager, IT, people team, buddy, new hire) and due dates relative to the start date; one onboarding per new hire created from templates; tasks resolved to real people at creation; a weekend rule for due dates; moving a start date shifts every open task; overdue flags; a pre-start check three days before day one; a daily email per person with their due and late tasks; a new-hire view from day one; 30, 60 and 90-day check-ins with private notes; cancelling an onboarding when an offer falls through; an activity log and CSV export.

### What this blueprint deliberately leaves out

Offer letters, e-signatures and document collection (identity and tax documents belong in your payroll or HR system; this tool records that the step happened, never the documents), employee records, payroll, benefits enrolment, an applicant tracking system (see the Hiring Pipeline blueprint), equipment purchasing, provisioning accounts automatically, training courses, and offboarding (a variation). A team of 5 to 150 people needs the right things to happen in the right order before and after a new hire's first day.

## 3. Scope of v1

- One company and one team time zone (Settings; default America/New_York). Due dates and start dates are calendar dates, shown as "Mon Oct 26", with the year added when it is not the current year ("Fri Jan 22, 2027").
- Task owners are people in this app. The new hire is added as a person with a start date and can sign in from their start date, once their company email exists.
- Emails through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone.
- In production an empty database is not seeded: it starts with Settings and one people-team person (name and email) from setup values, who adds everyone else.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| People team | People with is_people_team | Manage templates, people and settings; create, edit, cancel and complete onboardings; reassign any task; see check-in notes; export; read the outbox. |
| Manager | A new hire's manager | See their new hires' onboardings, complete their own tasks, reassign their own tasks, write check-in notes for their new hires. |
| Task owner | Anyone with a task (IT, a buddy, anyone) | See the onboardings where they have tasks, and complete or reopen their own tasks. |
| New hire | The person being onboarded, from their start date | See their own checklist (their tasks and the status of tasks others do for them), complete their own tasks and reopen ones they completed themselves; they can't skip (the reason would be hidden from them) or reassign. Never sees check-in notes. |

The server enforces all of this. People who are not on an onboarding in any of these roles cannot see it. Refusals: a page someone may not open shows "Only the people team can open this page." and an action they may not take gets "Only the people team can do this." (HTTP 403); an onboarding or task they cannot see gets "Not found" (404); invalid input, or an action the current state doesn't allow, gets 422 with the message. Form posts from another site are refused with 403.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name (required, 1 to 100), email (required, unique, stored lowercase), title (optional, max 100)
- manager_id (nullable Person; must be active, not the person themself, and must not create a reporting loop; changing it never changes existing onboardings), is_people_team (boolean), active (boolean)
- start_date (nullable date; set for new hires; they cannot sign in before it)

**Settings** (one row)
- company_name, time_zone, it_owner_id (Person who receives IT tasks), people_owner_id (Person who receives people-team tasks), digest_hour (0 to 23, default 8)

**Template**
- id, name (unique ignoring case, 1 to 80), kind: base | add_on, active
- An onboarding uses exactly one base template and zero or more add-ons.

**TemplateTask**
- id, template_id, title (1 to 120), description (optional, max 1,000)
- owner_role: manager | it | people | buddy | new_hire
- offset_days (integer −60 to 120; 0 is the start date; negative is before it)
- is_check_in (boolean; check-ins collect a private note when completed; only manager or people tasks can be check-ins, because only they may read the note), position

**Onboarding**
- id, new_hire_id (Person), manager_id (copied from the new hire at creation), buddy_id (nullable Person)
- start_date (date), title (copied from the new hire's title at creation, e.g. "Account Executive"), template_names (copied names of the templates used)
- status: upcoming | in_progress | completed | cancelled (R9)
- cancel_reason (nullable), created_by, created_at

**Task**
- id, onboarding_id, title, description, owner_role, owner_id (Person; resolved at creation, R3)
- offset_days, due_date (R2), is_check_in, position (the order the task was copied in, section 7)
- status: open | done | skipped; done_at, done_by (nullable); skip_reason (nullable, 3 to 200 characters)
- check_in_note (nullable, 5 to 2,000 characters; check-ins only; visible to the manager and the people team only)

**Event** (append-only, never edited or deleted)
- id, onboarding_id, actor_id (nullable for the system), type: created | start_date_moved | task_done | task_reopened | task_skipped | task_reassigned | cancelled | completed | reminded
- data (JSON, nullable), created_at

**Notification** (outbox)
- id, kind: digest | pre_start | assigned | cancelled, to_email, person_id, onboarding_id (nullable), subject, body, status: pending | sent | logged | failed, error, created_at, sent_at

**DigestRun**
- person_id, date; unique (person_id, date), so a person never gets two digests on the same day

## 6. Due dates

- **R2. Due dates.** due_date = start_date + offset_days in calendar days. If that falls on a Saturday or Sunday, use the Friday before. Recalculate open tasks whenever the start date moves (R5); done and skipped tasks keep their dates. Reopening a task clears done_at, done_by and skip_reason and recalculates its due date from the current start date; a reopened check-in keeps its note until it is completed again with a new one.
- **R1. Overdue.** A task is overdue when it is open, its onboarding is upcoming or in progress, and its due date is before today. Due today is not overdue.

### Worked examples (start date Monday Oct 26, 2026)

| Task | Offset | Raw date | Due date |
|---|---|---|---|
| Send welcome email and first-week schedule | −10 | Fri Oct 16 | Fri Oct 16 |
| Order laptop | −7 | Mon Oct 19 | Mon Oct 19 |
| Create Google Workspace and Slack accounts | −5 | Wed Oct 21 | Wed Oct 21 |
| Prepare desk or ship equipment | −1 | Sun Oct 25 | Fri Oct 23 |
| Welcome meeting and tour | 0 | Mon Oct 26 | Mon Oct 26 |
| Set 30-60-90 day goals | 4 | Fri Oct 30 | Fri Oct 30 |
| 30-day check-in | 30 | Wed Nov 25 | Wed Nov 25 |
| 60-day check-in | 60 | Fri Dec 25 | Fri Dec 25 |
| 90-day review | 90 | Sun Jan 24, 2027 | Fri Jan 22, 2027 |

If the start date moves to Monday Nov 2, every open task moves: "Order laptop" becomes Mon Oct 26, and "Prepare desk or ship equipment" becomes Fri Oct 30 (raw date Sun Nov 1).

## 7. Creating an onboarding

1. The people team picks the new hire (an existing active person with a start date and no upcoming or in-progress onboarding, using their saved start date; or a new one created in the same form with name, email, title, manager and start date, saved only when the onboarding is), one base template, any add-ons, and optionally a buddy.
2. Tasks are copied from the base template, then from each add-on in add-on name order, each in its template's task order. Copying happens once; later template edits never change existing onboardings (R6).
3. **R3. Owners.** Each task's owner is resolved from its role: manager → the new hire's manager; it → Settings.it_owner_id; people → Settings.people_owner_id; buddy → the onboarding's buddy; new_hire → the new hire. If any task needs a buddy and none is chosen, or the new hire has no manager, creation is refused and lists everything missing at once (an inactive manager or buddy counts as missing): "Choose a buddy: 2 tasks are for the buddy." The new hire can't be their own buddy.
4. Due dates are set by R2. Tasks whose due date is already in the past at creation are created open and show as overdue; the form warns "3 tasks are already overdue because the start date is close." A start date in the past is allowed at creation, for someone who has already started: the onboarding is then in progress and the warning says "because the start date has already passed".
5. Status is upcoming if the start date is after today, otherwise in progress (R9). The manager, IT owner, people owner and buddy are each emailed a summary of their tasks: one email per person even if they hold several roles, none to someone with no tasks, and none to the new hire.

## 8. Business rules

- **R4. Completing tasks.** Only the task owner or the people team can complete, reopen or skip a task. Skipping needs a reason. A manager can also complete or skip manager-role tasks on their own new hires' onboardings, whoever owns them now, but not reopen them. Tasks of a cancelled onboarding cannot change.
- **R5. Moving the start date.** Only the people team can move a start date, on an upcoming or in-progress onboarding, to today or later and not to the same date. Moving it sends no email. All open tasks get new due dates by R2, the new hire's Person.start_date changes too, and one event records the old and new dates. Moving a start date to a past date is refused. While a person has an upcoming or in-progress onboarding, their start date changes only through Move start date, not in Admin: People.
- **R6. Templates.** Editing, deactivating or renaming a template never changes existing onboardings. A base template needs at least one task: it is created with its first task, its last task can't be removed, and an add-on with no tasks can't be changed to a base template. Offsets must be between −60 and 120. Templates are never deleted, only deactivated; an inactive template can't be picked for a new onboarding.
- **R7. Reassigning.** The people team can reassign any open task to another active person; managers can reassign open tasks they own on their own new hires' onboardings; nobody else can reassign. A check-in can't be reassigned to the new hire, the buddy or the IT owner. The new owner is emailed. There is no separate Change buddy action in v1: to change a buddy, reassign their open tasks.
- **R8. Check-ins.** Completing a check-in task requires a note of 5 to 2,000 characters. Check-in notes are visible only to the new hire's manager and the people team, never to the new hire, the buddy or IT, and never appear in emails, events or exports. Any request that returns a note (the Onboarding screen, or `GET /api/tasks/{id}/check-in-note`) refuses everyone else with 403, or 404 if they can't see the onboarding.
- **R9. Status.** upcoming before the start date; in_progress from the start date; completed automatically when every task is done or skipped (reopening a task moves it back to upcoming or in progress, and a completed onboarding can't be cancelled or have its start date moved); cancelled only by the people team, with a reason of 3 to 200 characters that only the people team and the manager see (never in emails or events). Cancelling deletes the onboarding's unsent (pending or failed) emails and removes its tasks from digests; the tasks stay open but can't change. A cancelled onboarding is read-only.
- **R10. New hire access.** A new hire can sign in only on or after their start date ("Your account opens on Mon Oct 26."). They see their own tasks and, for tasks others do for them, only the title, the owner's first name and done or not. They never see notes, skip reasons or other people's onboardings, and never open the Onboarding screen of their own onboarding (403, pointing them to My first weeks).
- **R11. Visibility.** The people team sees all onboardings. Managers see the onboardings whose manager_id is them (the manager recorded at creation). Other task owners see only onboardings where they currently own a task. Anyone else gets "Not found". The Onboardings screen is open to everyone and lists only what they can see.
- **R12. People.** Deactivating a person who owns open tasks on upcoming or in-progress onboardings is refused until they are reassigned: "Reassign Ben Cho's 4 open tasks first.", followed by each task and its new hire. Settings.it_owner_id and people_owner_id must be active people, so the current IT owner or people owner can't be deactivated until Settings names someone else. Nobody can deactivate themselves or remove their own people-team flag, so the people team is never left empty.
- **R13. Events.** Every successful action on an onboarding writes the event in the data model; events are never edited or deleted. Events belong to an onboarding, so changes to templates, people and settings are not logged as events, and only the development Reset to seed data clears them.

## 9. Screens

1. **My tasks** (home for everyone but the new hire). My open tasks across onboardings, grouped Overdue, Today, This week (tomorrow to Sunday) and Later, each with the new hire's name and start date.
2. **Onboardings** (everyone, limited by R11). Each onboarding with new hire, title, start date, status, progress (done or skipped of total) and the number of overdue tasks. Filter by status.
3. **Onboarding.** New hire, manager, buddy, start date (with Move start date for the people team), progress, and tasks grouped by offset: Before day one (negative), Day one (0), First week (1 to 6) and First 90 days (7 or more, offsets up to 120 included), sorted by due date within a group, each task with owner, due date, status and actions (Done, Reopen, Skip, Reassign). Check-in tasks open a note box when completed. Activity log at the bottom.
4. **New onboarding** (people team). The form in section 7 with a preview of the tasks, owners and due dates before saving.
5. **My first weeks** (the new hire's home from their start date while their onboarding is upcoming or in progress; after it completes, their home is My tasks). A welcome line with their manager's and buddy's full names, their own tasks (the tasks they currently own, with due date and whether done, never who resolved them), and "What others are doing for you": every other task on their onboarding, check-ins included, with only the title, the owner's first name (the first word of their name) and Done or Not yet (a skipped task shows as Done).
6. **Templates** (people team). Base templates and add-ons with their tasks, offsets and roles.
7. **Admin: People**, **Admin: Settings** (IT owner, people owner, digest hour), **Admin: Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Onboarding created | Manager, IT owner, people owner and buddy | "Priya Nair starts Mon Oct 26: you have 4 tasks" |
| Task reassigned | New owner | "New onboarding task: Order laptop for Priya Nair (due Mon Oct 19)" |
| Pre-start check (section 11) | Manager and people owner | "Priya Nair starts in 3 days: 2 tasks still open" |
| Daily digest (section 11) | Each person with tasks due today or overdue | "Your onboarding tasks for Tue Oct 13" |
| Cancelled | Everyone with open tasks on it except the new hire | "Onboarding cancelled: Kai Brooks" (without the reason) |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by the job. A notification failure never blocks the action that caused it.

## 11. Scheduled job and time

An hourly job at `POST /api/jobs/hourly`, called by an outside scheduler with CRON_SECRET in an `X-Cron-Secret` or `Authorization: Bearer` header (a missing or wrong secret gets 401; if CRON_SECRET is not set the endpoint answers 503), with a development-only "Run scheduled job now" control that uses the development clock. Every step is safe to repeat, so a late or doubled run sends nothing twice:
1. **Status.** Set upcoming onboardings whose start date is today or earlier to in_progress. This writes no event and sends no email.
2. **Pre-start check.** For each upcoming onboarding starting in exactly 3 calendar days (team time, on any run that day), if any task due before the start date is still open (overdue ones included), email the onboarding's manager and the people owner once per start date (one email if they are the same person; if the start date moves, the check runs again for the new date), listing those tasks with owner and due date, and write a `reminded` event.
3. **Digest.** On any run at or after digest_hour in the team time zone, for each active person who can sign in (a new hire from their start date) with open tasks they own that are due today or overdue on upcoming or in-progress onboardings, and no DigestRun for today, queue one digest listing them under Overdue and Due today, and write the DigestRun in the same transaction. Digests write no event.
4. **Retry** failed notifications created in the last 3 days, and pending ones older than 10 minutes, by resending the same stored email; a run's own failures wait for the next run.

All time reads go through one function that adds the development clock offset.

## 12. Export

People team only, from links on the Onboardings screen that keep its status filter: CSV of onboardings (onboarding ID, new hire, title, manager, start date, status, tasks done, tasks skipped, tasks open, overdue) and CSV of tasks (onboarding ID, onboarding as the new hire's name, title, owner, due date, status, done date). Dates are YYYY-MM-DD in team time; done date is blank for open and skipped tasks; overdue follows R1, so it is 0 for completed and cancelled onboardings. Never includes check-in notes, skip reasons, cancel reasons or email addresses. A cell that starts with =, +, - or @ is written with a leading ' so a spreadsheet does not run it as a formula.

## 13. Edge cases

- The start date moves while some pre-start tasks are already done: done tasks keep their dates; only open tasks move (R2, R5).
- The buddy leaves: deactivation is refused until their open tasks are reassigned (R12).
- The new hire's manager changes before day one: existing manager-role tasks keep their owner; the people team reassigns them if needed. The onboarding's manager_id stays as created, so check-in notes remain private to the manager who wrote them and the people team.
- An onboarding is created three days before the start date: tasks due earlier are already overdue and the form warns (section 7, step 4).
- Two add-ons contain the same task title: both are copied; the people team can skip one with a reason.

## 14. Seed data

Settings: company "Fernway", time zone America/New_York, IT owner Ben Cho, people owner Dana Ruiz, digest at 08:00.

Reset to seed data also sets the development clock to 08:00 on the seed day in the team time zone. The development "sign in as" switcher lists everyone, including inactive people and new hires who have not started, so their refusals can be tried.

People: Dana Ruiz (people team), Ben Cho (IT), Sam Okafor (sales manager), Maya Chen (design lead), Ana Lima (account executive, buddy), Jo Park (designer, buddy). Their titles are People Operations Lead, IT Manager, Sales Manager, Design Lead, Account Executive and Designer, and every email is first.last@fernway.com (dana.ruiz@fernway.com). Ana Lima reports to Sam Okafor and Jo Park to Maya Chen; the others have no manager. New hires (dates relative to the seed day, which is the real date in the team time zone when the seed is loaded; the examples assume Tue Oct 13, 2026; "the second Monday after" counts only Mondays after the seed day, so a seed day that is itself a Monday does not count, and "the previous week" is the Monday-to-Sunday week before the seed day's week): Priya Nair (Account Executive, manager Sam Okafor, start date the second Monday after the seed day: Mon Oct 26), Leo Grant (Product Designer, manager Maya Chen, started on the Monday of the previous week: Mon Oct 5), Kai Brooks (Support Specialist, manager Dana Ruiz, start date the third Monday after the seed day: Mon Nov 2).

Templates:
- **Standard** (base): Send welcome email and first-week schedule (manager, −10); Order laptop (it, −7); Create Google Workspace and Slack accounts (it, −5); Add to payroll and benefits (people, −5); Pick a buddy and introduce them (manager, −3); Prepare desk or ship equipment (it, −1); Welcome meeting and tour (manager, 0); Sign in and read the handbook (new_hire, 0); Coffee with your buddy (buddy, 0); Set 30-60-90 day goals (manager, 4); Complete security training (new_hire, 4); 30-day check-in (manager, 30, check-in); 60-day check-in (manager, 60, check-in); 90-day review (manager, 90, check-in).
- **Sales** (add-on): Shadow three sales calls (buddy, 2); CRM training (new_hire, 10).
- **Design** (add-on): Design system walkthrough (buddy, 2).

Onboardings:
- **Priya Nair**, Standard + Sales, buddy Ana Lima, upcoming. Done: Send welcome email. All other tasks open.
- **Leo Grant**, Standard + Design, buddy Jo Park, in progress. All tasks due before the seed day are done except "Complete security training" and "Set 30-60-90 day goals" (both due Fri Oct 9, open and overdue).
- **Kai Brooks**, Standard, buddy Jo Park, upcoming; to be cancelled in a check.

Each seeded onboarding was created by Dana Ruiz and starts with a `created` event. Each seeded done task was done by its owner at 16:00 team time on its due date (or on the day before the seed day, if its due date is later) and has a `task_done` event.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Employee Onboarding blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person whose start date (if any) is today or earlier; anyone else sees "Ask the people team to add you." or, for a future new hire, "Your account opens on {start date}."
3. Build Templates, Admin: People and Admin: Settings (section 9, screens 6 and 7) for the people team only, with R6 and R12 enforced on the server.
4. Load the seed data from section 14, with dates relative to today, and the onboardings with their tasks as listed.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock to 08:00 on the seed day, team time; section 14), all visible only in development.

Do not build the onboarding screens yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Templates shows Standard with 14 tasks and the Sales and Design add-ons, with each task's role and offset.
- [ ] Signed in as Ben, Templates says "Only the people team can open this page." and a direct request to edit a template is refused.
- [ ] Signing in as Priya Nair is refused with "Your account opens on" followed by her start date.
- [ ] Deactivating Ben Cho is refused with a message naming his open tasks.

### Phase 2: Onboardings and tasks

```
Using the Employee Onboarding blueprint above, build Phase 2 only.

1. Build My tasks, Onboardings, Onboarding and New onboarding (section 9, screens 1 to 4).
2. Implement section 7 (creation with R3 and the preview), R1, R2, R4 to R9 and R11, enforced on the server.
3. Write the creation and reassignment emails (section 10) to the outbox, and build Admin: Outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Creating an onboarding for a new person starting Monday Oct 26, 2026 with the Standard template and Ana Lima as buddy shows the due dates in section 6, including "Prepare desk or ship equipment" on Fri Oct 23 and "90-day review" on Fri Jan 22, 2027.
- [ ] Creating an onboarding with the Sales add-on and no buddy is refused with a message saying how many tasks are for the buddy.
- [ ] Moving Priya Nair's start date one week later moves every open task by 7 days, keeps "Send welcome email" (done) on its date, and logs the old and new start dates.
- [ ] Signed in as Ben, My tasks shows "Order laptop" for Priya Nair; completing it marks it done with his name and time.
- [ ] Signed in as Ana Lima, opening Leo Grant's onboarding returns Not found, while Priya Nair's onboarding (where she is the buddy) opens.
- [ ] Skipping a task without a reason is refused; skipping "Prepare desk or ship equipment" with "Fully remote" counts it in progress as done or skipped.
- [ ] Completing the 30-day check-in without a note is refused; with a note, the note is visible to Maya and Dana but not to Jo Park (Leo's buddy).
- [ ] Cancelling Kai Brooks's onboarding requires a reason, makes it read-only, and emails everyone with open tasks without including the reason.

### Phase 3: The new hire's view

```
Using the Employee Onboarding blueprint above, build Phase 3 only.

1. Build My first weeks (section 9, screen 5) as the new hire's home, with R10.
2. Make sure every API the screen uses returns only what R10 allows, and add tests that a new hire cannot read check-in notes, skip reasons or other onboardings.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Leo Grant, My first weeks shows his manager Maya Chen and buddy Jo Park, his own tasks, and "What others are doing for you" with titles, first names and done or not.
- [ ] Leo completes "Complete security training" and it disappears from his overdue list.
- [ ] Signed in as Maya, completing Leo's 30-day check-in with a note works. Signed in as Leo again, he cannot see that note or any skip reason, and a direct request for his onboarding's check-in note is refused.
- [ ] Leo opening Priya Nair's onboarding URL returns Not found.

### Phase 4: Job, digests and export

```
Using the Employee Onboarding blueprint above, build Phase 4 only.

1. Build the scheduled job in section 11 (status, pre-start check, digest, retries) with a development-only "run job now" control.
2. Add the CSV exports in section 12 for the people team.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Running the job at 08:00 sends Jo Park no digest and sends Leo Grant one listing "Complete security training" as overdue; running it again the same day sends nothing new.
- [ ] Moving the clock to 3 days before Priya Nair's start date and running the job emails Sam and Dana "Priya Nair starts in 3 days" with the open pre-start tasks, once.
- [ ] Moving the clock to Priya Nair's start date and running the job changes her onboarding to In progress, and she can now sign in.
- [ ] After Maya completes Leo's 30-day check-in with a note, the tasks CSV lists every task with its owner and due date and does not contain that note.

## 16. Variations

- Offboarding templates (return equipment, revoke access, exit interview) using the same engine.
- Creating accounts automatically through your identity provider's API for IT tasks.
- A welcome page the new hire can open before day one, without signing in, with their first-day details.
- Slack reminders instead of email.
- Different templates per location.

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser, resetting to the seed data before each phase's checks. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed.

**Result:** 20 of 20 acceptance checks passed in one final browser run on a fresh database, plus 109 automated tests. The item-by-item results are in [acceptance-results.json](/builds/employee-onboarding/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. The seed counted "the second Monday after the seed day" without saying what happens when the seed day is itself a Monday, or whether the seed day is the real date or the development clock. It is the real date, and only Mondays after it count.
2. The seed people had no titles, emails or managers except the new hires'. Section 14 now gives all three.
3. The seed didn't say who completed the done tasks, when, or which events the seeded onboardings start with. Each was created by Dana with a `created` event, and each done task was done by its owner at 16:00 on its due date with a `task_done` event.
4. Onboarding.title had no source. It is copied from the new hire's title at creation.
5. Tasks had no position field, so "template order" couldn't be kept after copying. Task now has position.
6. R13 said every action writes an event, but every event belongs to an onboarding. Template, people and settings changes are now explicitly not logged.
7. A check signs in as Priya before her start date, but nothing said the development switcher lists people who can't sign in yet. It lists everyone, inactive people included.
8. Dates in messages and on screens had no format. They read "Mon Oct 26", with the year when it isn't the current one.
9. Refusals had no wording beyond one message, and no HTTP status. Section 4 now gives the page and action messages, 403, 404 and 422, and refuses cross-site form posts.
10. R12 didn't say whether tasks on cancelled onboardings block a deactivation, or what happens to the current IT or people owner. Only upcoming and in-progress tasks count, and a Settings owner can't be deactivated until Settings names someone else.
11. Nothing stopped the people team from deactivating themselves or removing their own people-team flag. Both are now refused.
12. Admin: People could edit a start date that R5 says only Move start date may change. While a person has a live onboarding, their start date changes only through Move start date.
13. Person fields had no length limits and the manager field had no rules, and template names were unique without saying whether case counts. Names and titles have limits, a manager must be active, not the person and not a reporting loop, and template names are unique ignoring case.
14. R6's "a base template needs at least one task" didn't cover creating one, removing its last task or turning an empty add-on into a base, and nothing said whether templates can be deleted. Each case is now covered, and templates are only deactivated.
15. Any role could own a check-in, but only the manager and the people team may read its note. Check-ins are now limited to manager and people tasks.
16. Section 4 let the new hire see "their own checklist", but the Onboarding screen shows notes and skip reasons R10 forbids. The new hire never opens it and is sent to My first weeks.
17. R11 didn't say which manager sees an onboarding after the new hire's manager changes, or who may open the Onboardings list. It is the manager recorded at creation, and the list is open to everyone, limited by R11.
18. "This week" and the Onboarding screen's four groups had no boundaries. This week runs from tomorrow to Sunday, and the groups follow the offset (negative, 0, 1 to 6, 7 or more).
19. "In template order" didn't say how add-ons are ordered. Add-ons are copied in name order.
20. The form's existing-person option didn't say who can be picked, or whether a person can have two live onboardings. Only active people with a start date and no live onboarding, and a new person is saved only with the onboarding.
21. Nothing said whether an onboarding can start in the past, which the first Phase 2 check needs once the seed day is after Oct 26. It can, starts in progress and the warning says the start date has passed.
22. R3 showed one missing item at a time and said nothing about an inactive manager or buddy, or a new hire who is their own buddy. It lists everything missing, counts inactive people as missing, and refuses the new hire as buddy.
23. The creation email didn't say whether someone with two roles gets two emails, or whether the new hire gets one. One per person, none to people with no tasks, none to the new hire.
24. The cancellation email went to "everyone with open tasks", which includes the new hire whose offer fell through. It now goes to everyone except the new hire.
25. "Cancels all open tasks' emails" could mean cancelling the tasks or the outbox rows, and the cancel reason had no limits or audience. Unsent emails are deleted, tasks stay open but locked, and the reason is 3 to 200 characters for the people team and the manager only.
26. Nothing said what reopening a task does to a completed onboarding, or whether a completed one can be cancelled or moved. It goes back to upcoming or in progress, and completed onboardings can't be cancelled or moved.
27. R4 let managers act on tasks "owned by the manager role" without saying whether that means the role or the current owner, or whether they can reopen. Manager-role tasks whoever owns them, complete or skip only.
28. R7 let managers reassign "their own" tasks without saying on which onboardings, and a check-in could be reassigned to someone who can't read its note. Managers reassign tasks they own on their new hires' onboardings, and check-ins never go to the new hire, the buddy or IT.
29. Reopen had no rule for the done fields, the skip reason, the due date or a check-in's note. It clears the first two, recalculates the due date and keeps the note until it is replaced.
30. R5 didn't say whether a start date can move to today, to the same date, or on a completed onboarding, or whether anyone is emailed. Today or later, not the same date, only live onboardings, and no email.
31. The event types included `buddy_set`, but no screen or rule changed a buddy. v1 has no Change buddy action; the buddy's tasks are reassigned instead.
32. My first weeks was home "from their start date" with no end. It is home while the onboarding is upcoming or in progress.
33. Screen 5 said "first names" while the check names "Maya Chen" and "Jo Park", and didn't say how skipped tasks or check-ins appear. The welcome line uses full names, the list uses first names, includes check-ins, and shows a skipped task as Done.
34. Section 4 let the new hire complete tasks while R4 lets task owners also skip and reopen. The new hire can complete and reopen their own completions, but can't skip (the reason would be hidden from them) or reassign.
35. A check asks for "a direct request for the check-in note", but no request returned a note on its own. The spec now names one, and who it refuses.
36. "Protected by a CRON_SECRET header" named no header, endpoint or response. It is `POST /api/jobs/hourly` with `X-Cron-Secret` or `Authorization: Bearer`, 401 for a wrong secret and 503 when none is set.
37. Moving an onboarding to in progress didn't say whether it writes an event or emails anyone. It does neither.
38. The pre-start check didn't say whether overdue tasks count, what "once" means when the start date moves, or what happens when the manager is also the people owner. Overdue tasks count, once per start date, one email per person, and a `reminded` event.
39. The digest didn't say whether new hires who haven't started get one, how it is laid out, or whether it writes an event. Only people who can sign in, grouped Overdue and Due today, no event.
40. "Retry failed notifications" had no limit. Failed emails are retried for 3 days, and pending ones after 10 minutes.
41. The exports had no location, date format, ID column or rule for overdue on closed onboardings. They are on Onboardings, use YYYY-MM-DD and an onboarding ID, and overdue follows R1.
42. The CSV export could write a task title or name starting with = as a spreadsheet formula. Such cells now start with an apostrophe.
43. Nothing said how the first person signs in to a production install with an empty database. It starts with Settings and one people-team person from setup values.
44. The first Phase 2 check created a Standard onboarding without a buddy, which R3 refuses because Standard has a buddy task. The check now names Ana Lima as buddy.

**What we did not test:**
- Production sign-in. A trusted-header path for a sign-in proxy was built, but every check used the development "sign in as" switcher.
- Sending email. Every email was logged in the outbox, not delivered.
- The hourly job on a real scheduler. It was run from the development control and by calling its endpoint without the secret and with a wrong one.
- Daylight saving and other time zones. Every check ran in America/New_York in November 2026.
- Spec fixes that no acceptance check covers, such as status codes, retries and CSV escaping. The test build handles them through its own choices.
- Hosting. The test build ran on SQLite on one server. For a hosted deploy, use a managed Postgres (or your platform's database) and the same schema.
