<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/client-onboarding-tracker . The page has a labelled drawing, a live demo and build-or-buy notes. Free to copy and adapt for your own team. -->

# Client Onboarding Tracker

Blueprint BP-006 · Department: Ops · Replaces: Rocketlane (client onboarding), onboarding spreadsheets, checklists kept in one person's notes
For teams of 2 to 25 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 16 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Client onboarding lives in one person's head, and things fall through the cracks."

A new client signs. One person knows the steps: agree what success looks like, run the kickoff, import the client's data, check access, train their champions, sign off go-live. The steps live in that person's notes and in chat. Nobody else can say which client is ready to move on, who owns the next step, or which promise to the client is already late. When that person is out, onboarding stalls.

## 2. What the real product does

Research basis: Rocketlane's product, pricing and help-center pages (rocketlane.com, rocketlane.com/pricing, help.rocketlane.com/support/solutions/articles/67000692193-how-to-create-project-templates-, help.rocketlane.com/support/solutions/articles/67000699280-project-plan, help.rocketlane.com/support/solutions/articles/67000738577-how-to-invite-customers-to-your-portal), October 2026. Rocketlane describes itself as an "agentic PSA" (professional services automation) platform. For onboarding, this is what we verified:

1. **Templates.** A project template lists phases and the tasks inside them. Each phase and task has a start day and a duration counted from the start of the project. An assignee can be a role placeholder, such as "Implementation Manager", that is replaced by a real person once the project begins.
2. **Projects from templates.** A template is imported when a project is created. Dynamic conditions can leave phases or tasks out based on project fields (their example: a kickoff meeting only for projects with ARR over $100K).
3. **Project plan.** A board view shows each phase as a column with its tasks under it. A timeline view shows a Gantt chart with dependencies, a critical path, baselines and a bulk "Shift dates" action. Each phase has a status: To do, In progress, Completed or Blocked. A task with a dependency cannot be completed until the task it depends on is finished.
4. **Shared and private work.** Phases and tasks are either shared with the customer or private to your team. A "Present" mode for kickoff calls hides private items. Tasks can be filtered by the company responsible: yours, the customer's or a partner's.
5. **Customer portal.** Customers are invited by link, from inside a project, or through a portal embedded in your own product. They sign in with a magic link sent to their email. Invite links expire after 7 days, and access can be limited to the customer's email domains.
6. **Milestones.** Marking a task as a milestone sends the customer a CSAT survey when the task is completed.
7. **Beyond onboarding.** The same product covers time tracking and timesheets, resource planning, project budgets, invoicing and revenue recognition, AI agents (sold as "Nitro"), and integrations including Salesforce, HubSpot, Jira, Slack and Zapier.
8. **Pricing.** The pricing page lists Standard at $49 and Premium at $69 per team member per month, billed annually, each with a minimum of 5 team members, and Enterprise at custom pricing. Every plan lists unlimited projects and unlimited customer members. The branded customer portal, magic-link login and milestone CSAT appear from Standard up; resource and financial management from Premium. An "AI Fills" add-on is listed at $29 per user per month.

### What this blueprint keeps

Reusable templates with checklist tasks, default owners and due-date offsets per stage; one project per client engagement, copied from a template; a strict gate at the end of each stage; handoffs that change the project owner and carry a note; due dates, overdue rules and a daily digest; an internal board by stage across all clients; shared versus internal tasks; a bulk date shift; a read-only client progress link; an append-only activity log; CSV export.

### What this blueprint deliberately leaves out

Client logins, and a portal where clients tick off their own tasks, approve, comment or upload files (v1 has a read-only link instead). Role placeholders, dynamic template conditions and task-to-task dependencies (v1 has one gate per stage). Gantt timelines, baselines and critical path. Milestone CSAT surveys. Time tracking, resource planning, budgets, invoicing and revenue recognition. AI agents. CRM, Jira and Slack integrations. Embedding the portal in your own product. These matter to services teams running many billable implementations at once. A team of 2 to 25 people onboarding a few clients a month does not need them. If you need several of them, Rocketlane is worth paying for.

## 3. Scope of v1

- One process, client onboarding, in four fixed stages: Kickoff → Setup → Training → Live. Live is the finish line and has no tasks.
- Several templates (for example "Implementation · standard"), each a checklist of tasks per stage. A project copies its template once, when it is created.
- One team time zone, set by an admin, decides what "today" is. Due dates are calendar dates with no time.
- Team members sign in. Clients never sign in; a client can be sent a read-only progress link.
- Web app that works on a phone, plus email notifications and a daily digest through an outbox.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Member | Everyone on the team | See every project, task and handoff. Create projects. Complete or reopen their own tasks in a project's current stage. Comment. |
| Project owner | The member who owns a project right now (it usually changes at each handoff) | On that project: complete or reopen any task in the current stage; add, edit and skip tasks; shift dates; hand off; change owner; put on hold and resume; edit the client and project name; create and revoke the client link. |
| Admin | One or more people | Everything a project owner can do, on every project. Cancel projects. Manage people, templates and settings. View the outbox. Export CSV. |

A person can hold several roles. Everyone can see everything (that is how onboarding stops living in one head); only the actions above are restricted.

## 5. Data model

All timestamps are UTC. All IDs are strings (UUID or similar). Dates (start_date, due_date) are calendar dates without a time, stored as YYYY-MM-DD. Text is trimmed before it is checked or saved.

**Settings** (one row)
- company_name (required; shown on the client progress page), time_zone (IANA name, default "UTC"; "today" is the current date in this zone)
- last_digest_on (nullable date; set by the scheduled job, section 13)

**Person**
- id, name (required), title (optional, e.g. "Customer success lead")
- email (required, unique, compared case-insensitively)
- is_admin (boolean, default false), active (boolean, default true)

**Template**
- id, name (required, 1 to 80 characters, unique case-insensitively), description (optional, max 500 characters)
- active (boolean, default true; inactive templates are hidden from New project)
- created_at, updated_at

**TemplateTask** (one checklist item in a template)
- id, template_id
- stage: kickoff | setup | training (never live); position (integer; order within the stage)
- title (required, 1 to 160 characters), description (optional, max 1,000 characters)
- default_owner_id (nullable, references Person; empty means "the project owner")
- offset_days (integer, 0 to 365; the task is due this many days after the project's start date)
- visible_to_client (boolean, default true; false marks the task Internal)

**Project** (one client engagement)
- id, client_name (required, 1 to 80 characters), name (required, 1 to 100 characters, e.g. "Customer portal")
- template_id, template_name (copy of the template's name at creation)
- owner_id (references Person; the current project owner), created_by_id
- start_date (date); stage: kickoff | setup | training | live; status: active | on_hold | cancelled
- stage_started_at (timestamp; set at creation and at every handoff)
- on_hold_since, hold_reason (nullable; set while on hold, cleared on resume)
- cancelled_at, cancel_reason (nullable)
- live_at (nullable timestamp; set by the handoff to Live)
- created_at, updated_at
- (client_name, name) is unique, compared case-insensitively, among projects that are not cancelled.

**Task** (a project's copy of a template task, or a task added to one project)
- id, project_id, template_task_id (nullable; empty for tasks added by hand)
- stage: kickoff | setup | training; position (integer; order within the stage)
- title, description (same limits as TemplateTask); visible_to_client (boolean)
- owner_id (references Person); due_date (date; never before the project's start_date)
- status: open | done | skipped; skip_reason (nullable; required when skipped)
- closed_at, closed_by_id (nullable; set when done or skipped, cleared when reopened or unskipped)
- created_at, updated_at

**Handoff** (the stage history)
- id, project_id, from_stage, to_stage, from_owner_id, to_owner_id
- note (optional, max 1,000 characters), by_id, created_at

**Event** (the activity log; append-only, never updated or deleted)
- id, project_id, task_id (nullable), actor_id (nullable for system actions), created_at
- type: project_created | project_updated | owner_changed | task_added | task_updated | task_completed | task_reopened | task_skipped | task_unskipped | dates_shifted | handed_off | put_on_hold | resumed | cancelled | reassigned | commented | link_created | link_revoked
- comment (nullable; comment text, handoff note, or skip, hold or cancel reason); data (JSON, nullable; e.g. old and new due date, from and to owner, days shifted)

**ClientLink**
- id, project_id, token (unique; at least 128 random bits, URL-safe)
- created_by_id, created_at, revoked_at (nullable), last_viewed_at (nullable)

**Notification** (outbox; makes notifications testable and retryable)
- id, person_id, project_id (nullable), subject, body
- kind: project_created | stage_started | handed_off | owner_changed | task_assigned | went_live | on_hold | resumed | cancelled | commented | digest
- status: queued | sent | logged | failed
- attempts (integer), created_at, sent_at, error

Progress, overdue counts and days in stage are computed from tasks and dates, never stored.

## 6. Creating a project from a template

Run this when someone creates a project. It must be deterministic: the same template, start date and owner always produce the same tasks. The New project screen shows the result as a preview before anything is saved.

1. **Validate.** Client name and project name (R13), a real calendar date for the start date (past dates are allowed), an active project owner, and a usable template (R10).
2. **Copy tasks.** For each template task, in stage order (Kickoff, Setup, Training) and then by position, create a Task with the same stage, position, title, description and visible_to_client, with status open.
3. **Due dates.** due_date = start_date + offset_days, counted in calendar days on the date itself (R15).
4. **Owners.** The owner is the template task's default owner if one is set and active; otherwise the project owner. When an inactive default owner is replaced, say so in the preview and record it in the project_created event data.
5. **Save.** stage = kickoff, status = active, owner_id = the chosen owner, stage_started_at = now, template_name = the template's current name. Write one project_created event and the notifications in section 11, in the same transaction.
6. **Stale template.** If the template's updated_at changed after the preview was shown, refuse with "The template changed. Review the new preview." and show the new preview.

### Worked examples ("Implementation · standard" from section 15, owner Dana)

| Case | Start date | Resulting tasks (owner, due date) |
|---|---|---|
| Ridgeway · Partner portal | 2026-10-13 | Kickoff: Confirm success criteria (Dana, Oct 14), Run kickoff workshop (Maya, Oct 15) · Setup: Import client data (Sam, Oct 18), Verify access and permissions (Ben, Oct 19, Internal) · Training: Train client champions (Maya, Oct 22), Approve go-live checklist (Dana, Oct 23) |
| Same, with Ben inactive | 2026-10-13 | As above, except Verify access and permissions goes to Dana. The preview says "Ben Cho is inactive; assigned to Dana Ruiz." |
| Year end | 2026-12-28 | Due Dec 29, Dec 30, Jan 2, Jan 3, Jan 6, Jan 7 (2027) |
| Leap year | 2028-02-25 | Due Feb 26, Feb 27, Mar 1, Mar 2, Mar 5, Mar 6 |
| Daylight saving ends (America/New_York) | 2026-10-31 | Due Nov 1, Nov 2, Nov 5, Nov 6, Nov 9, Nov 10. Adding 24-hour periods to a midnight timestamp gets this wrong (Nov 1 twice). |
| A task is added to the template after Ridgeway exists | 2026-10-13 | Ridgeway keeps its six tasks (R9). Only projects created afterwards get the new task. |

## 7. Stage gates, progress and overdue

Stages run in a fixed order: Kickoff → Setup → Training → Live. Reaching Live means onboarding is done.

- **Gate.** A project leaves its current stage only when every task in that stage is done or skipped, and only one stage forward (R3, R4).
- **Progress** = (done + skipped) ÷ all tasks, as a whole percent rounded half up (R8).
- **Overdue.** An open task on an active project whose due date is before today (R7). Due today is not overdue. Days overdue = today − due date. Tasks in later stages count too: an overdue later-stage task means the plan has slipped.
- **Days in stage** = today − the date of stage_started_at, in the team time zone.

### Worked example (seed from section 15 loaded on 2026-10-13, so Northwind started on Oct 10)

| Project | Stage | Closed / all | Progress | Overdue (owner, days) | Due today |
|---|---|---|---|---|---|
| Northwind · Customer portal | Kickoff | 0 / 6 | 0% | Confirm success criteria (Dana, 2), Run kickoff workshop (Maya, 1) | none |
| Bluebird · Analytics rollout | Setup | 2 / 6 | 33% | Import client data (Sam, 3), Verify access and permissions (Ben, 2) | none |
| Harbor Studio · Team workspace | Training | 4 / 6 | 67% | none | Train client champions (Maya) |
| Kestrel · Support launch | Live | 6 / 6 | 100% | none | none |

The Board header reads "3 in progress · 4 overdue tasks".

Walk-through: Dana completes "Confirm success criteria" and Maya completes "Run kickoff workshop" on Northwind. Progress is 2 / 6 = 33% and nothing is overdue. Dana hands off to Sam: the stage becomes Setup, the project owner becomes Sam, the Setup tasks still belong to Sam and Ben, and one Handoff row is written. A second handoff is refused until both Setup tasks are done or skipped. If Sam skips "Import client data" with the reason "Client has no legacy data", progress is 3 / 6 = 50%, and the gate still waits for "Verify access and permissions".

## 8. Lifecycle

### Project

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Any member | (none) | Kickoff, active | Section 6. Event project_created |
| Hand off | Project owner, admin | Kickoff, Setup or Training; active | Next stage | Gate (R3, R4). owner_id = chosen next owner, stage_started_at = now, one Handoff row, event handed_off. To Live: live_at = now |
| Change owner | Project owner, admin | active or on_hold, not Live | same | Stage unchanged. Event owner_changed |
| Edit details | Project owner, admin | active or on_hold, not Live | same | Client and project name only (R13). Event project_updated |
| Shift dates | Project owner, admin | active or on_hold, not Live | same | R17. Event dates_shifted |
| Put on hold | Project owner, admin | active, not Live | on_hold | Reason of 3+ characters required. on_hold_since = now. Event put_on_hold |
| Resume | Project owner, admin | on_hold | active | Optional shift by the days on hold (R18). Event resumed, with the shift in its data |
| Cancel | Admin | active or on_hold, not Live | cancelled | Reason of 3+ characters required. The client link stops working. Event cancelled |
| Comment | Anyone | any | same | Event commented |

**Final states:** Live and cancelled. Nothing changes a project in a final state except comments and, for Live, the client link (section 12).

### Task

| Action | Who | From | To | Conditions |
|---|---|---|---|---|
| Complete | Task owner, project owner, admin | open | done | The task's stage is the current stage and the project is active (R2). Sets closed_at, closed_by_id |
| Reopen | Task owner, project owner, admin | done | open | Same conditions. Clears closed_at and closed_by_id |
| Skip | Project owner, admin | open | skipped | Current or later stage; project active or on hold. Reason required (R12) |
| Unskip | Project owner, admin | skipped | open | Current or later stage; project active or on hold |
| Edit | Project owner, admin | open | open | Current or later stage; project active or on hold. Title, owner, due date, client visibility (R11) |
| Add | Project owner, admin | (none) | open | Current or later stage; project active or on hold. Placed at the end of its stage |

## 9. Business rules

- **R1.** Signed-in team members can see everything. Any member can create a project, comment, and complete or reopen their own tasks (R2). Every other change to a project is limited to its current owner and admins; cancelling and every Admin screen are limited to admins. Check permissions on the server for every action; hiding buttons is not enough.
- **R2.** A task can be completed or reopened only while the project is active and the task's stage is the current stage, by the task owner, the project owner or an admin. When someone other than the task owner does it, the activity log says so: "Completed by Dana Ruiz for Maya Chen".
- **R3.** Gate: a handoff is allowed only if the project is active, its stage is not Live, and every task in the current stage is done or skipped. Otherwise refuse and name the open tasks: "Kickoff isn't finished: 2 open tasks (Confirm success criteria, Run kickoff workshop)." Check the gate and change the stage in one transaction.
- **R4.** A handoff moves exactly one stage forward, never skips a stage and never moves back. The next owner must be an active person (keeping the current owner is allowed). It does not change task owners or due dates. The note is optional.
- **R5.** Live and cancelled are final (section 8). Once a stage is handed off, its tasks are locked for good.
- **R6.** due_date = start_date + offset_days in calendar days, with no business-day logic. No task's due date may be earlier than its project's start date.
- **R7.** A task is overdue when it is open, its project is active, and its due date is before today. Due today is not overdue. Overdue counts include tasks in later stages.
- **R8.** Progress = (done + skipped) ÷ all tasks, rounded half up to a whole percent. A project with no tasks shows 0%.
- **R9.** Creating a project copies the template's tasks and stores the template's name. Editing, renaming or deactivating a template never changes existing projects.
- **R10.** A template can start a project only if it is active and has at least one task in each of Kickoff, Setup and Training. Incomplete templates can be saved and are labelled, for example "Incomplete: needs Setup and Training tasks".
- **R11.** Open tasks in the current or a later stage can be edited by the project owner or an admin. A done task must be reopened before it can be edited ("Reopen the task first."). Tasks are never deleted; skip them instead.
- **R12.** Skipping requires a reason of at least 3 characters. Skipped tasks count as closed for the gate and for progress. Unskipping returns the task to open and clears the reason.
- **R13.** Client name 1 to 80 characters, project name 1 to 100, template name 1 to 80 and unique (case-insensitive), task title 1 to 160. The pair (client name, project name) is unique, case-insensitive, among projects that are not cancelled.
- **R14.** Every successful action writes exactly one Event row ("Reassign all" writes one per affected project). Events are never edited or deleted; there is no API or UI to do so. A refused action writes nothing and changes nothing.
- **R15.** "Today" is the current date in Settings.time_zone. Do date arithmetic on dates, never by adding 24-hour periods to timestamps.
- **R16.** Only active people can own projects or tasks or appear in owner pickers. A person who owns open tasks, or owns a project that is active or on hold, cannot be deactivated: refuse and say how many of each they own. "Reassign all to…" moves all of it to one active person in one transaction.
- **R17.** Shift dates moves the due date of every open task on the project by N whole days (−365 to 365, not 0). If any new due date would fall before the start date, nothing moves.
- **R18.** While a project is on hold, its tasks cannot be completed or reopened, it cannot be handed off, its tasks are not overdue, and it is left out of digests. Planning still works: edit, add, skip, unskip, shift dates, change owner. Resume proposes a shift equal to the whole days since on_hold_since; the person resuming can change it to any value, including 0.

## 10. Screens

1. **Board** (home). Four columns: Kickoff, Setup, Training, Live. Header: "3 in progress · 4 overdue tasks" (in progress means not Live and not cancelled). Each card: client name, project name, owner, progress bar with percent, "2 overdue" (or, when nothing is overdue, "1 due today"), "In Setup 6d" (or "Live since Oct 9"), and an On hold badge. In each column, sort by overdue tasks (most first), then by days in stage (longest first). Search by client or project (case-insensitive), filter by owner ("Me" or any person) and template. Cancelled projects and projects live for more than 30 days are hidden unless "Show cancelled" or "Show older live projects" is on. Button: New project. On a phone the columns stack. Empty column: "No projects in Setup."
2. **New project.** Client name, project name, template (active templates; incomplete ones are listed but disabled, with their label), start date (default today), project owner (default the signed-in person). A live preview of section 6: tasks grouped by stage with owner, due date and the Internal tag, plus warnings such as "2 tasks will already be overdue" and "Ben Cho is inactive; assigned to Dana Ruiz." Button: Create project.
3. **Project detail.** Header: client and project name, template name, owner, status, start date, progress, overdue count, and a stage tracker showing when each stage started. One checklist per stage: checkbox, title, owner, due date with "2 days overdue" or "due today", Internal tag, who closed it and when, skip reason. The current stage is expanded. Earlier stages are locked. Later stages are visible, with disabled checkboxes and "Starts after" the stage before them (for example "Starts after Setup"). For the project owner and admins: edit task, skip or unskip, add task, Shift dates, Change owner, Put on hold or Resume, Edit details, and Cancel (admins only). Hand off panel: next owner, optional note, Hand off button. Keep the button enabled and show the server's gate message when it refuses. If the next stage already has overdue tasks, suggest Shift dates. Client link panel (section 12). Comments. Activity log (collapsed by default): every event with actor, time and comment.
4. **My tasks.** The signed-in person's open tasks, grouped: Overdue, Due today, Next 7 days, Later, Waiting for an earlier stage, Paused (project on hold). Sorted by due date, then client. Tick a current-stage task straight from the list. Empty state: "Nothing assigned to you."
5. **Handoffs.** Newest first: time, client and project, from stage → to stage, previous owner → new owner, who handed off, note, link to the project. Filter: last 7 days, last 30 days, all. Empty state: "No handoffs yet."
6. **Projects.** Table of all projects: client, project, template, stage, status, owner, start date, progress, overdue, days in stage, live date. Filters: stage, status, owner, template, search. Admins get Export CSV: one row per project matching the filters, with columns client, project, template, stage, status, owner, start_date, live_date, tasks_total, tasks_done, tasks_skipped, tasks_open, overdue, progress_percent, days_in_stage, days_to_live (live date − start date; blank until Live). Stage and status use the stored values (setup, on_hold). Dates are YYYY-MM-DD.
7. **Admin: Templates.** List with name, task count per stage, and status: Usable, Incomplete (with the label from R10) or Inactive. Editor: name, description, active; tasks grouped by stage with title, default owner, offset days, Internal toggle and description; add, edit, remove, move up and down. Under the editor, a live example listing every task: "A project starting today gets: Confirm success criteria (Dana Ruiz), due Oct 14 …". Warn next to any task whose default owner is inactive. Note at the top: "Changes apply to new projects only."
8. **Admin: People.** Name, email, title, admin, active, open tasks owned, projects owned. Actions: add, edit, deactivate (R16), "Reassign all to…".
9. **Admin: Settings.** Company name, time zone. In development only: the clock control and "Reload seed data".
10. **Admin: Outbox.** Notifications newest first: created, recipient, kind, subject, status, attempts, error. Click a row to read the body. In development only: "Run job now".
11. **Client progress page.** Public, read-only, no sign-in (section 12).

All screens must work on a phone. Use native checkboxes and labelled inputs, and show overdue as text, not only as colour.

## 11. Notifications

| Trigger | Recipient | Content |
|---|---|---|
| Project created | Project owner, unless they created it | "Jo Park created Ridgeway · Partner portal and made you the owner. Your Kickoff tasks: Confirm success criteria, due Oct 14." |
| Stage started (creation, or a handoff to Setup or Training) | Owners of open tasks in the new stage, except the actor and the project owner | "Setup has started on Northwind · Customer portal. Your tasks: Verify access and permissions, due Oct 16." One email per person, listing all their tasks in that stage |
| Handed off to you, or made owner | The new project owner, unless they did it | "Dana Ruiz handed Northwind · Customer portal to you at Setup. Note: Data export arrives Friday. Your tasks: Import client data, due Oct 15." |
| Task assigned (edit, add, reassign all) | The new task owner, unless they did it | "Sam Okafor assigned you Verify access and permissions on Bluebird · Analytics rollout, due Oct 11." Reassign all sends one email listing everything moved |
| Went live | Admins, except the actor | "Kestrel · Support launch is live, 10 days after its start date." |
| On hold, resumed, cancelled | The project owner and owners of open tasks on the project, except the actor | The reason, or on resume the number of days the dates moved |
| Comment | The project owner, unless they wrote it | The comment |
| Daily digest | Each active person with at least one item (section 13) | Overdue, Due today, On your projects, Late across the team |

Write every notification to the outbox in the same transaction as the action, then send after commit. If no email provider is configured, mark the row "logged" instead of sending. If sending fails, keep the row as failed with the error and retry on the next scheduled run, up to 5 attempts in total. A notification failure must never block or undo an action. Seeding writes no notifications.

## 12. Client progress link

A read-only page a client can open without signing in. It is optional: a team that doesn't want it can skip step 1 of Phase 4 and its link checks.

- **Actions.** On the project page, the project owner or an admin can create a link, copy it, replace it (revoke the old link and create a new one, written as one link_created event that records the replaced link) or revoke it. One active link per project. The panel shows when the link was created and last viewed. Each view sets last_viewed_at.
- **Token.** At least 128 random bits from a secure random generator, URL-safe, in the path `/p/<token>`. Never write it to logs.
- **What the page shows.** The company name ("Copperline"), client and project name, the stage tracker with the current stage highlighted (or "Live since Oct 9"), a count such as "2 of 5 done" (done or not needed, out of the tasks shown), and every task whose visible_to_client is true, grouped by stage: title, owner's first name, and "Done Oct 7", "Not needed" or "Due Oct 15". A project on hold shows "Paused".
- **What it never shows.** Internal tasks, comments, the activity log, reasons for skips, holds or cancellation, email addresses, overdue labels, or other projects. Build the page from its own query that selects only the fields above, so an Internal task cannot leak through the page's HTML or data.
- **When it stops working.** When revoked, when the project is cancelled, or 30 days after go-live (live_at). Unknown, revoked, cancelled and expired links all show the same page: "This link is not active. Ask your Copperline contact for a new one." Creating a link for a cancelled project, or one live for more than 30 days, is refused.
- **Headers.** `Cache-Control: no-store` (so a revoke takes effect at once), `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`.

## 13. Scheduled job, digest and time

**Scheduled job** (runs every hour: a platform cron calling `/api/cron/tick`, protected by a CRON_SECRET header):
1. **Digest.** If the time in the team time zone is 08:00 or later and last_digest_on is before today, build one digest per active person, queue the non-empty ones, and set last_digest_on to today, all in one transaction. A day the job misses entirely is not sent late.
2. **Delivery.** Send queued notifications and retry failed ones (up to 5 attempts).

**Digest contents.** Only active projects count. Each task appears at most once per digest.
- **Overdue:** your open tasks in their project's current stage, due before today, with days overdue.
- **Due today:** your open tasks in their project's current stage, due today.
- **On your projects:** other overdue tasks on projects you own, in any stage, with their owner.
- **Late across the team** (admins only): tasks 3 or more days overdue on any project, not already listed above.

Worked example (seed data, job run at 08:00 on the day the seed was loaded): five digests.

| Person | Overdue | Due today | On your projects | Late across the team |
|---|---|---|---|---|
| Dana | Confirm success criteria · Northwind (2 days) | none | Run kickoff workshop · Northwind (Maya, 1 day) | Import client data · Bluebird (Sam, 3 days) |
| Ana | none | none | none | Import client data · Bluebird (Sam, 3 days) |
| Maya | Run kickoff workshop · Northwind (1 day) | Train client champions · Harbor Studio | none | not an admin |
| Sam | Import client data · Bluebird (3 days) | none | Verify access and permissions · Bluebird (Ben, 2 days) | not an admin |
| Ben | Verify access and permissions · Bluebird (2 days) | none | none | not an admin |

Jo and Lee get nothing. A run at 07:00 sends nothing; a second run at 09:00 the same day sends nothing.

## 14. Edge cases

- Two people hand off the same project at once: the second gets "This project already moved to Setup." (R3).
- Someone ticks a task on a stale screen after its stage was handed off: "Kickoff is finished; its tasks are locked." (R5).
- A start date in the past is allowed. The preview warns how many tasks will already be overdue.
- A later-stage task passes its due date: it counts as overdue and appears in the project owner's digest, but cannot be completed until its stage starts. The owner can shift dates or skip it.
- The next stage already has overdue tasks at handoff: the panel suggests Shift dates; the handoff is not blocked.
- An admin changes the time zone: "today" may change, so a task can move between due today and overdue. Due dates themselves never change.
- Work found missing during Training that belongs to Setup: add a task to Training. Stages never move back.

## 15. Seed data

Company name: Copperline. Time zone: America/New_York. last_digest_on: empty. Emails are first name at copperline.example (dana@copperline.example).

| Person | Title | Admin |
|---|---|---|
| Dana Ruiz | Head of Ops | yes |
| Ana Lima | Finance lead | yes |
| Maya Chen | Customer success lead | no |
| Sam Okafor | Engineering lead | no |
| Ben Cho | IT | no |
| Jo Park | Account manager | no |
| Lee Park | Engineer | no |

**Template "Implementation · standard"** (active, usable)

| Stage | Position | Task | Default owner | Offset days | Client sees it |
|---|---|---|---|---|---|
| Kickoff | 1 | Confirm success criteria | Dana | 1 | yes |
| Kickoff | 2 | Run kickoff workshop | Maya | 2 | yes |
| Setup | 1 | Import client data | Sam | 5 | yes |
| Setup | 2 | Verify access and permissions | Ben | 6 | no (Internal) |
| Training | 1 | Train client champions | Maya | 9 | yes |
| Training | 2 | Approve go-live checklist | Dana | 10 | yes |

**Template "Enterprise · draft"** (active, incomplete): one Kickoff task, "Complete security questionnaire", Ben, offset 3, client sees it.

**Projects.** All four use "Implementation · standard", were created by Jo at 09:00 on their start date, and had Dana as Kickoff owner. Dates are relative to the day the seed is loaded (the examples in this document use 2026-10-13).

| Client | Project | Start date | Stage | Owner | Stage started | Done tasks |
|---|---|---|---|---|---|---|
| Northwind | Customer portal | 3 days ago | Kickoff | Dana | 3 days ago | none (0 of 6) |
| Bluebird | Analytics rollout | 8 days ago | Setup | Sam | 6 days ago | Kickoff tasks (2 of 6) |
| Harbor Studio | Team workspace | 9 days ago | Training | Maya | 3 days ago | Kickoff and Setup tasks (4 of 6) |
| Kestrel | Support launch | 14 days ago | Live | Dana | 4 days ago (live_at) | all (6 of 6) |

Each project has the template's six tasks, with owners and due dates from section 6 (24 tasks in all). Each done task was completed by its owner at 16:00 team time on its due date. Nothing is skipped.

**Handoffs** (each at 17:00 team time, newest first):

| When | Project | Stages | Owner change | By |
|---|---|---|---|---|
| 3 days ago | Harbor Studio | Setup → Training | Sam → Maya | Sam |
| 4 days ago | Kestrel | Training → Live | Maya → Dana | Maya |
| 6 days ago | Bluebird | Kickoff → Setup | Dana → Sam | Dana |
| 7 days ago | Harbor Studio | Kickoff → Setup | Dana → Sam | Dana |
| 8 days ago | Kestrel | Setup → Training | Sam → Maya | Sam |
| 12 days ago | Kestrel | Kickoff → Setup | Dana → Sam | Dana |

One comment on Bluebird from Sam, 2 days ago: "Waiting on the client's data export." Write the matching events (project_created, task_completed, handed_off, commented) so every activity log has history. No client links and no notifications are seeded.

## 16. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Client Onboarding Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Settings, Person, Template, TemplateTask, Project, Task, Handoff, Event, ClientLink, Notification) with a real database.
2. Add sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin → People, Admin → Templates and Admin → Settings (section 10, screens 7 to 9) with create, edit and deactivate. Only admins can open them; anyone else sees "Admins only." Check this on the server, not only in the menu. Enforce the limits in section 5 and R13 on the server, and label each template as R10 describes.
4. Load the seed data from section 15, with dates relative to today.
5. Development only: a "sign in as" switcher listing active people; a clock control that moves "now" forward or back, showing the app's current date in the header while it is moved; and "Reload seed data", which deletes all data and rebuilds the seed relative to the app's today. Every date and time calculation must read "now" from this one clock.

Do not build project screens yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Admin → People lists the seven people from section 15 with their titles. Dana and Ana are admins.
- [ ] Signed in as Jo, there is no Admin menu, and opening the Admin → Templates address directly shows "Admins only." Signed in as Ana, all three Admin screens open.
- [ ] Admin → Templates shows "Implementation · standard" as Usable with six tasks (owners Dana, Maya, Sam, Ben, Maya, Dana; offsets 1, 2, 5, 6, 9, 10; "Verify access and permissions" marked Internal) and "Enterprise · draft" as "Incomplete: needs Setup and Training tasks".
- [ ] Dana cannot save a new template named "implementation · STANDARD" (duplicate name) or a task with offset 366. A task with offset 365 saves.
- [ ] Dana deactivates Lee: he disappears from the sign-in-as switcher and from the default-owner picker. Reactivating him brings him back in both places.
- [ ] Moving the clock forward one day changes the date in the header and moves every date in the Templates live example one day later. Moving it back restores them.

### Phase 2: Projects, checklists and stage gates

```
Using the Client Onboarding Tracker blueprint above, build Phase 2 only.

1. Implement project creation (section 6) as a pure function, with unit tests for every row of its worked-examples table.
2. Implement progress, overdue and days in stage (section 7) as pure functions, with unit tests for the seed table in section 7.
3. Build screens 1 to 4 and 6 from section 10: Board, New project with the live preview, Project detail, My tasks and Projects (without CSV export).
4. Implement these actions from section 8: create, hand off, change owner, edit details, comment, and every task action. Enforce rules R1 to R15, and the owner rule in the first sentence of R16, on the server, not only by hiding buttons.
5. Write exactly one Event row per action (R14) and show the activity log on the project page. Write a Handoff row for every handoff and show stage start dates in the stage tracker.
6. Check the gate and change the stage in one database transaction, so two people cannot hand off the same project twice.

Do not send notifications yet; just write rows to the Notification table with status queued. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reload the seed data first; sign in as each person with the switcher)
- [ ] The Board shows Northwind · Customer portal in Kickoff (Dana, 0%, "2 overdue"), Bluebird · Analytics rollout in Setup (Sam, 33%, "2 overdue"), Harbor Studio · Team workspace in Training (Maya, 67%, "1 due today") and Kestrel · Support launch in Live (Dana, 100%). The header reads "3 in progress · 4 overdue tasks".
- [ ] Jo creates client "Ridgeway", project "Partner portal", from "Implementation · standard", starting today, owner Dana. The preview and the saved project both show six tasks due 1, 2, 5, 6, 9 and 10 days from today, owned by Dana, Maya, Sam, Ben, Maya and Dana. Ridgeway appears in Kickoff below Northwind.
- [ ] Creating "ridgeway" / "Partner Portal" again is refused as a duplicate; "Ridgeway" / "Billing migration" is accepted. "Enterprise · draft" is listed but disabled, and a direct request that uses it is refused.
- [ ] Signed in as Jo, Northwind's checkboxes are disabled and a direct request to complete "Confirm success criteria" is refused. Signed in as Maya, "Train client champions" on Northwind shows "Starts after Setup" and a direct request to complete it is refused.
- [ ] Dana presses Hand off on Northwind and sees "Kickoff isn't finished: 2 open tasks (Confirm success criteria, Run kickoff workshop)." Dana and Maya each complete their own task. Northwind shows 33% and no overdue label.
- [ ] Dana hands Northwind off to Sam with the note "Data export arrives Friday". The card moves to Setup with owner Sam; "Import client data" still belongs to Sam and "Verify access and permissions" to Ben; the Kickoff checkboxes are locked. A second handoff is refused until Setup is finished.
- [ ] On Bluebird, Sam skips "Import client data" with the reason "Client has no legacy data" (progress 50%), then reassigns "Verify access and permissions" to Lee. Signed in as Lee, it is listed under Overdue in My tasks; he completes it (67%). Sam hands off to Maya and Bluebird moves to Training.
- [ ] On Harbor Studio, Maya completes "Train client champions" and then cannot change its owner until she reopens it. Setting the due date of "Approve go-live checklist" to the day before the project's start date is refused.
- [ ] Kestrel has no Hand off button and its checkboxes are locked; a direct request to reopen "Approve go-live checklist" is refused. Northwind's activity log lists its creation, both completions and the handoff with its note, each with actor and time.

### Phase 3: Notifications, digest, holds and people changes

```
Using the Client Onboarding Tracker blueprint above, build Phase 3 only.

1. Deliver the notifications in section 11 from the Notification outbox. Use any email provider we have; if none is configured, mark rows "logged" instead of sending. Build Admin → Outbox (section 10, screen 10).
2. Build the scheduled job in section 13 at /api/cron/tick, protected by a CRON_SECRET header: the 08:00 daily digest, delivery and retries. In development, let the job take an optional "now", and add "Run job now" to Admin → Outbox, using the development clock.
3. Add put on hold, resume with the proposed shift, shift dates and cancel (section 8, R17, R18). Enforce them on the server.
4. Add R16 to Admin → People: block deactivating anyone who still owns open tasks or projects that are active or on hold, and add "Reassign all to…". Show the inactive-owner warning in Admin → Templates.
5. Add tests for the seed digest table in section 13, for no second digest on the same day, and for a failed send being retried on the next run.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reload the seed data first)
- [ ] With the clock at 07:00 today (team time), Run job now creates no digests. At 08:00 it creates exactly five, for Dana, Ana, Maya, Sam and Ben. Running it again at 09:00 creates none.
- [ ] The digests match the table in section 13. Sam's lists "Import client data · Bluebird (3 days)" under Overdue and Ben's "Verify access and permissions (2 days)" under On your projects. Maya's lists "Train client champions · Harbor Studio" under Due today. Ana's contains only "Import client data · Bluebird (Sam, 3 days)".
- [ ] Dana completes both Northwind Kickoff tasks (the activity log shows "Completed by Dana Ruiz for Maya Chen") and hands off to Sam with a note. The outbox gains exactly two emails: the handoff to Sam, with the note and "Import client data", and "Setup has started on Northwind · Customer portal" to Ben. With no email provider configured, both show "logged".
- [ ] Sam puts Bluebird on hold with the reason "Client paused for budget review". Its card shows On hold and no overdue label. Signed in as Ben, "Verify access and permissions" cannot be ticked and a direct request is refused. Ben, Maya and Dana each get an on-hold email; Sam does not.
- [ ] Move the clock 5 days forward. Sam resumes Bluebird; the dialog proposes moving open due dates 5 days later and he accepts. Each open task is due 5 days later than before, and the card shows "2 overdue" again (3 days and 2 days).
- [ ] Signed in as Sam, Harbor Studio has no Cancel action and a direct request is refused. Dana cancels it with the reason "Client churned": it leaves the Board (it shows with "Show cancelled"), its checkboxes are locked, and Maya gets a cancellation email.
- [ ] Dana tries to deactivate Ben and is told he owns 2 open tasks. She uses "Reassign all to…" Lee: both "Verify access and permissions" tasks (Northwind and Bluebird) move to Lee, Lee gets one email listing them, and Ben can now be deactivated. Admin → Templates warns that Ben Cho is inactive, and a new project from "Implementation · standard" gives that task to its project owner.

### Phase 4: Client link, handoffs and export

```
Using the Client Onboarding Tracker blueprint above, build Phase 4 only.

1. Build the client progress link exactly as section 12: create, copy, replace and revoke on the project page (project owner and admins, checked on the server), and the public read-only page at /p/<token>.
2. Build the Handoffs screen (section 10, screen 5).
3. Add Export CSV for admins on the Projects screen, with the columns in section 10, screen 6. Check the admin role on the server.
4. Add tests: an Internal task never appears in the public page's HTML or data; unknown, revoked, cancelled and expired links all return the same "not active" page.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reload the seed data first)
- [ ] Sam creates a client link on Bluebird. In a private window, without signing in, it shows Copperline, "Bluebird · Analytics rollout", the stage tracker at Setup, "2 of 5 done" and five tasks. "Verify access and permissions", Sam's comment, email addresses and overdue labels do not appear.
- [ ] After the page is opened, Bluebird's link panel shows a "Last viewed" time. Signed in as Jo, Bluebird has no link actions and a direct request to create one is refused.
- [ ] Sam revokes the link. Reloading the page shows "This link is not active. Ask your Copperline contact for a new one." A newly created link works; the old one stays inactive.
- [ ] Dana creates a link for Kestrel: it shows "Live since" the go-live date 4 days ago and "5 of 5 done". With the clock moved 27 days forward, the same link shows the not-active page, and Kestrel is gone from the Live column unless "Show older live projects" is on.
- [ ] Handoffs lists the six seeded handoffs newest first: Harbor Studio Setup → Training (Sam Okafor → Maya Chen, 3 days ago) at the top, Kestrel Kickoff → Setup (12 days ago) at the bottom.
- [ ] Signed in as Dana, Projects → Export CSV downloads four rows. Bluebird's has stage "setup", progress_percent 33 and overdue 2; Kestrel's has days_to_live 10. Signed in as Jo, there is no Export button and a direct request is refused.

## 17. Variations

- Custom stages per template, such as a Data migration stage, or Hypercare after Live.
- Client logins with client-owned tasks, approvals and file uploads.
- Task dependencies inside a stage, and business-day due dates with team holidays.
- Slack direct messages for handoffs and the daily digest.
- Create a project automatically when a deal is marked won in your CRM.
- A one-question satisfaction survey emailed to the client at go-live.
- A stage-duration report: median days per stage, per template, per quarter.
- Moving a project back one stage, with a required reason.
