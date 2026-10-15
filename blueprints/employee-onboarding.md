<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/employee-onboarding . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

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

- One company and one team time zone (Settings; default America/New_York). Due dates and start dates are calendar dates.
- Task owners are people in this app. The new hire is added as a person with a start date and can sign in from their start date, once their company email exists.
- Emails through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| People team | People with is_people_team | Manage templates, people and settings; create, edit, cancel and complete onboardings; reassign any task; see check-in notes; export; read the outbox. |
| Manager | A new hire's manager | See their new hires' onboardings, complete their own tasks, reassign their own tasks, write check-in notes for their new hires. |
| Task owner | Anyone with a task (IT, a buddy, anyone) | See the onboardings where they have tasks, and complete or reopen their own tasks. |
| New hire | The person being onboarded, from their start date | See their own checklist (their tasks and the status of tasks others do for them), complete their own tasks. Never sees check-in notes. |

The server enforces all of this. People who are not on an onboarding in any of these roles cannot see it.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name (required), email (required, unique, stored lowercase), title (optional)
- manager_id (nullable Person), is_people_team (boolean), active (boolean)
- start_date (nullable date; set for new hires; they cannot sign in before it)

**Settings** (one row)
- company_name, time_zone, it_owner_id (Person who receives IT tasks), people_owner_id (Person who receives people-team tasks), digest_hour (0 to 23, default 8)

**Template**
- id, name (unique, 1 to 80), kind: base | add_on, active
- An onboarding uses exactly one base template and zero or more add-ons.

**TemplateTask**
- id, template_id, title (1 to 120), description (optional, max 1,000)
- owner_role: manager | it | people | buddy | new_hire
- offset_days (integer −60 to 120; 0 is the start date; negative is before it)
- is_check_in (boolean; check-ins collect a private note when completed), position

**Onboarding**
- id, new_hire_id (Person), manager_id (copied from the new hire at creation), buddy_id (nullable Person)
- start_date (date), title (e.g. "Account Executive"), template_names (copied names of the templates used)
- status: upcoming | in_progress | completed | cancelled (R9)
- cancel_reason (nullable), created_by, created_at

**Task**
- id, onboarding_id, title, description, owner_role, owner_id (Person; resolved at creation, R3)
- offset_days, due_date (R2), is_check_in
- status: open | done | skipped; done_at, done_by (nullable); skip_reason (nullable, 3 to 200 characters)
- check_in_note (nullable, 5 to 2,000 characters; check-ins only; visible to the manager and the people team only)

**Event** (append-only, never edited or deleted)
- id, onboarding_id, actor_id (nullable for the system), type: created | start_date_moved | task_done | task_reopened | task_skipped | task_reassigned | buddy_set | cancelled | completed | reminded
- data (JSON, nullable), created_at

**Notification** (outbox)
- id, kind: digest | pre_start | assigned | cancelled, to_email, person_id, onboarding_id (nullable), subject, body, status: pending | sent | logged | failed, error, created_at, sent_at

**DigestRun**
- person_id, date; unique (person_id, date), so a person never gets two digests on the same day

## 6. Due dates

- **R2. Due dates.** due_date = start_date + offset_days in calendar days. If that falls on a Saturday or Sunday, use the Friday before. Recalculate open tasks whenever the start date moves (R5); done and skipped tasks keep their dates.
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

1. The people team picks the new hire (an existing person with a start date, or a new one created in the same form with name, email, title, manager and start date), one base template, any add-ons, and optionally a buddy.
2. Tasks are copied from the base template, then from each add-on, in template order. Copying happens once; later template edits never change existing onboardings (R6).
3. **R3. Owners.** Each task's owner is resolved from its role: manager → the new hire's manager; it → Settings.it_owner_id; people → Settings.people_owner_id; buddy → the onboarding's buddy; new_hire → the new hire. If any task needs a buddy and none is chosen, or the new hire has no manager, creation is refused and says what is missing: "Choose a buddy: 2 tasks are for the buddy."
4. Due dates are set by R2. Tasks whose due date is already in the past at creation are created open and show as overdue; the form warns "3 tasks are already overdue because the start date is close."
5. Status is upcoming if the start date is after today, otherwise in progress (R9). The manager, IT owner, people owner and buddy are each emailed a summary of their tasks.

## 8. Business rules

- **R4. Completing tasks.** Only the task owner or the people team can complete, reopen or skip a task. Skipping needs a reason. A manager can also complete or skip tasks of their own new hires' onboardings that are owned by the manager role. Tasks of a cancelled onboarding cannot change.
- **R5. Moving the start date.** Only the people team can move a start date. All open tasks get new due dates by R2, the new hire's Person.start_date changes too, and one event records the old and new dates. Moving a start date to a past date is refused.
- **R6. Templates.** Editing, deactivating or renaming a template never changes existing onboardings. A base template needs at least one task; offsets must be between −60 and 120.
- **R7. Reassigning.** The people team can reassign any open task to another active person; managers can reassign their own open tasks. The new owner is emailed.
- **R8. Check-ins.** Completing a check-in task requires a note of 5 to 2,000 characters. Check-in notes are visible only to the new hire's manager and the people team, never to the new hire, the buddy or IT, and never appear in emails or exports.
- **R9. Status.** upcoming before the start date; in_progress from the start date; completed automatically when every task is done or skipped; cancelled only by the people team, with a reason, which also cancels all open tasks' emails and removes them from digests. A cancelled onboarding is read-only.
- **R10. New hire access.** A new hire can sign in only on or after their start date ("Your account opens on Mon Oct 26."). They see their own tasks and, for tasks others do for them, only the title, the owner's first name and done or not. They never see notes, skip reasons or other people's onboardings.
- **R11. Visibility.** The people team sees all onboardings. Managers see their new hires'. Other task owners see only onboardings where they own a task. Anyone else gets "Not found".
- **R12. People.** Deactivating a person who owns open tasks is refused until they are reassigned: "Reassign Ben Cho's 4 open tasks first." Settings.it_owner_id and people_owner_id must be active people.
- **R13. Events.** Every successful action writes the event in the data model; events are never edited or deleted.

## 9. Screens

1. **My tasks** (home for everyone but the new hire). My open tasks across onboardings, grouped Overdue, Today, This week, Later, each with the new hire's name and start date.
2. **Onboardings** (people team; managers see theirs). Each onboarding with new hire, title, start date, status, progress (done or skipped of total) and the number of overdue tasks. Filter by status.
3. **Onboarding.** New hire, manager, buddy, start date (with Move start date for the people team), progress, and tasks grouped Before day one, Day one, First week, First 90 days, each task with owner, due date, status and actions (Done, Reopen, Skip, Reassign). Check-in tasks open a note box when completed. Activity log at the bottom.
4. **New onboarding** (people team). The form in section 7 with a preview of the tasks, owners and due dates before saving.
5. **My first weeks** (the new hire's home from their start date). A welcome line with their manager and buddy, their own tasks, and "What others are doing for you" with only titles, first names and done or not.
6. **Templates** (people team). Base templates and add-ons with their tasks, offsets and roles.
7. **Admin: People**, **Admin: Settings** (IT owner, people owner, digest hour), **Admin: Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Onboarding created | Manager, IT owner, people owner and buddy | "Priya Nair starts Mon Oct 26: you have 4 tasks" |
| Task reassigned | New owner | "New onboarding task: Order laptop for Priya Nair (due Mon Oct 19)" |
| Pre-start check (section 11) | Manager and people owner | "Priya Nair starts in 3 days: 2 tasks still open" |
| Daily digest (section 11) | Each person with tasks due today or overdue | "Your onboarding tasks for Tue Oct 13" |
| Cancelled | Everyone with open tasks on it | "Onboarding cancelled: Kai Brooks" (without the reason) |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by the job. A notification failure never blocks the action that caused it.

## 11. Scheduled job and time

An hourly job (protected by a CRON_SECRET header, with a development-only "run job now" control that uses the development clock):
1. **Status.** Set upcoming onboardings whose start date is today or earlier to in_progress.
2. **Pre-start check.** For each upcoming onboarding starting in exactly 3 days, if any task due before the start date is still open, email the manager and the people owner once, listing those tasks.
3. **Digest.** At or after digest_hour in the team time zone, for each active person with open tasks that are due today or overdue on upcoming or in-progress onboardings, and no DigestRun for today, queue one digest listing them, then write the DigestRun.
4. **Retry** failed notifications.

All time reads go through one function that adds the development clock offset.

## 12. Export

People team only: CSV of onboardings (new hire, title, manager, start date, status, tasks done, tasks skipped, tasks open, overdue) and CSV of tasks (onboarding, title, owner, due date, status, done date). Never includes check-in notes or skip reasons.

## 13. Edge cases

- The start date moves while some pre-start tasks are already done: done tasks keep their dates; only open tasks move (R2, R5).
- The buddy leaves: deactivation is refused until their open tasks are reassigned (R12).
- The new hire's manager changes before day one: existing manager-role tasks keep their owner; the people team reassigns them if needed. The onboarding's manager_id stays as created, so check-in notes remain private to the manager who wrote them and the people team.
- An onboarding is created three days before the start date: tasks due earlier are already overdue and the form warns (section 7, step 4).
- Two add-ons contain the same task title: both are copied; the people team can skip one with a reason.

## 14. Seed data

Settings: company "Fernway", time zone America/New_York, IT owner Ben Cho, people owner Dana Ruiz, digest at 08:00.

People: Dana Ruiz (people team), Ben Cho (IT), Sam Okafor (sales manager), Maya Chen (design lead), Ana Lima (account executive, buddy), Jo Park (designer, buddy). New hires (dates relative to the day the seed is loaded; the examples assume Tue Oct 13, 2026): Priya Nair (Account Executive, manager Sam Okafor, start date the second Monday after the seed day: Mon Oct 26), Leo Grant (Product Designer, manager Maya Chen, started on the Monday of the previous week: Mon Oct 5), Kai Brooks (Support Specialist, manager Dana Ruiz, start date the third Monday after the seed day: Mon Nov 2).

Templates:
- **Standard** (base): Send welcome email and first-week schedule (manager, −10); Order laptop (it, −7); Create Google Workspace and Slack accounts (it, −5); Add to payroll and benefits (people, −5); Pick a buddy and introduce them (manager, −3); Prepare desk or ship equipment (it, −1); Welcome meeting and tour (manager, 0); Sign in and read the handbook (new_hire, 0); Coffee with your buddy (buddy, 0); Set 30-60-90 day goals (manager, 4); Complete security training (new_hire, 4); 30-day check-in (manager, 30, check-in); 60-day check-in (manager, 60, check-in); 90-day review (manager, 90, check-in).
- **Sales** (add-on): Shadow three sales calls (buddy, 2); CRM training (new_hire, 10).
- **Design** (add-on): Design system walkthrough (buddy, 2).

Onboardings:
- **Priya Nair**, Standard + Sales, buddy Ana Lima, upcoming. Done: Send welcome email. All other tasks open.
- **Leo Grant**, Standard + Design, buddy Jo Park, in progress. All tasks due before the seed day are done except "Complete security training" and "Set 30-60-90 day goals" (both due Fri Oct 9, open and overdue).
- **Kai Brooks**, Standard, buddy Jo Park, upcoming; to be cancelled in a check.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Employee Onboarding blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person whose start date (if any) is today or earlier; anyone else sees "Ask the people team to add you." or, for a future new hire, "Your account opens on {start date}."
3. Build Templates, Admin: People and Admin: Settings (section 9, screens 6 and 7) for the people team only, with R6 and R12 enforced on the server.
4. Load the seed data from section 14, with dates relative to today, and the onboardings with their tasks as listed.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

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
- [ ] Creating an onboarding for a new person starting Monday Oct 26, 2026 with the Standard template shows the due dates in section 6, including "Prepare desk or ship equipment" on Fri Oct 23 and "90-day review" on Fri Jan 22, 2027.
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
- [ ] Leo cannot see any check-in note or skip reason, and a direct request for his onboarding's check-in note is refused.
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
- [ ] The tasks CSV lists every task with its owner and due date and contains no check-in notes.

## 16. Variations

- Offboarding templates (return equipment, revoke access, exit interview) using the same engine.
- Creating accounts automatically through your identity provider's API for IT tasks.
- A welcome page the new hire can open before day one, without signing in, with their first-day details.
- Slack reminders instead of email.
- Different templates per location.
