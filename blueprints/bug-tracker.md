<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/bug-tracker . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Bug Tracker

Blueprint BP-034 · Department: Support · Replaces: Jira (bug tracking), the bug spreadsheet, bug reports in Slack threads and email
For teams of 5 to 30 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Bugs get reported in five places, and nobody knows which ones are fixed."

A customer tells support, support posts in Slack, a developer gets a direct message, the product manager keeps a spreadsheet, and someone emails a screenshot. The same bug is reported three times and fixed once. A developer says "fixed" in a thread, nobody checks, and the customer hits it again a week later. When someone asks what is still broken and who is on it, the answer takes an afternoon of scrolling.

This blueprint puts every bug in one list, each with a severity, a priority and one owner. "Fixed" is not the end: the reporter or QA verifies the fix, and the person who fixed it can't. Duplicates point to one canonical bug, so everyone who reported the problem hears when it is fixed. Each bug has a fix target by severity, and a weekly summary says what was reported, fixed, verified and is overdue.

## 2. What the real product does

Research basis: Atlassian's Jira pricing page (atlassian.com/software/jira/pricing), licensing FAQ (atlassian.com/licensing/jira-software), bug tracking page and template (atlassian.com/software/jira/features/bug-tracking, atlassian.com/software/jira/templates/bug-tracking), guides to work items and workflows (atlassian.com/software/jira/guides/issues/overview, atlassian.com/software/jira/guides/workflows/overview), and Atlassian Support articles on work types, resolutions and linking (support.atlassian.com/jira-cloud-administration/docs/what-are-issue-types, /what-is-a-resolution-in-jira, support.atlassian.com/jira-software-cloud/docs/link-issues), October 2026.

What we verified:

1. **Plans and price.** Free is $0 for up to 10 users, with 2 GB of storage, Atlassian Community support and 150 automation steps a month. Standard is listed at $8.48 and Premium at $15.56 per user per month with monthly billing; annual billing saves up to 17%, and monthly prices drop per user as seats are added. Standard adds user roles and permissions, 250 GB of storage and business-hours support. Premium adds cross-team planning, approval steps in workflows, unlimited storage and a 99.9% uptime SLA. Enterprise is billed annually through sales. A Free site that goes over 10 users is moved to a 7-day Standard trial.
2. **Free plan limits that matter for bugs.** On Free every user is an admin; permission settings for spaces and work items are paid-only. Free sends at most 100 emails a day across the site, notifications and automation together, then pauses email until the next day. Anonymous access, which lets people outside the company create work items (Atlassian's example: customers submitting bugs), is on paid plans only.
3. **Work items and types.** Jira now calls issues "work items". Software spaces start with Epic, Story, Task, Bug and Subtask; a bug is "a problem which impairs or prevents the functions of a product". Admins can add work types.
4. **Workflows.** A workflow is statuses, transitions and, in company-managed spaces, a resolution. A transition goes one way, so moving back and forth needs two. The resolution records why a work item reached Done (Atlassian's bug examples: Fixed, Won't Fix, Can't Reproduce), and Done items without one still appear in the Open work items filter. Atlassian's example bug workflow has statuses such as Triaged and Fixed. Board columns map to statuses, and transitions can carry conditions, validators and post-functions.
5. **Links.** Work items can be linked out of the box as blocks, clones, duplicates/is duplicated by and relates to, among others; admins configure link types.
6. **Bug tracking.** Bugs are captured with a description, severity level, screenshots and version, prioritized in the backlog by drag and drop, and assigned. Notifications can fire on status changes, automation can auto-assign bugs, and Bitbucket, GitHub and Jenkins integrations update a work item with pull requests, merges and builds. Paid plans include Rovo AI search, chat and agents.

### What this blueprint keeps

One kind of work item, the bug, with reproduction steps, environment, severity and priority; a fixed bug workflow (New, Triaged, In progress, In review, Fixed) whose closed states record the outcome the way Jira's resolutions do (Verified, Won't fix, Can't reproduce, Duplicate); one assignee; duplicates linked to one canonical bug; comments and an activity log; a board whose columns are the statuses, and a list with filters and search; email notifications through an outbox; a public report form for people outside the team; a weekly summary email; CSV export. It also builds in three rules that make "fixed" mean something: the person who fixed a bug can't verify it, fix targets by severity, and a reopen window.

### What this blueprint deliberately leaves out

Other work types (epics, stories, tasks, subtasks), sprints, backlog ranking, timelines and cross-team plans; the workflow editor, custom fields, form builder and automation rules; link types other than duplicates; attachments (v1 accepts a link to a screenshot or recording); versions and releases; Bitbucket, GitHub and Jenkins integrations; Rovo AI and agents; dashboards and custom reports; mobile apps; per-space permissions and single sign-on; several teams or projects. These matter when several teams plan and ship all their work in one tool. A product team of 5 to 30 people that needs every bug in one place and an honest answer to "is it fixed?" can do without them. If you already plan sprints in Jira or want the code integrations, keep your bugs there too. And if your team is 10 people or fewer and can live with everyone being an admin and 100 emails a day, Jira's Free plan costs nothing.

## 3. Scope of v1

- One company, one product team, one list of bugs. Bugs only: feature requests are closed as Won't fix and belong in a separate tool.
- Team members sign in. People outside the team (customers, other departments) can report through an optional public form and never sign in.
- A fixed workflow of nine statuses (section 6), severity S1 to S4, priority P1 to P4, and fix targets by severity in elapsed hours.
- Areas (parts of the product, such as "Mobile app") managed by admins.
- Links instead of attachments.
- Email through an outbox; if no email provider is configured, emails are logged, not sent. A weekly summary email.
- One team time zone (Settings; default America/New_York).
- A web app that works on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Team member | Everyone who can sign in | See every bug. Report bugs, comment, watch, take an unassigned Triaged bug, export the list. Edit their own bug and its severity while it is New. Verify and reopen bugs they reported (R8, R9). |
| Assignee | The person a bug is assigned to | Start, send to review, bring back from review, mark fixed, unassign themselves, edit details, close as Can't reproduce, mark as a duplicate, reopen. |
| Triager | People with the triager flag | Triage New bugs, change severity and priority, assign and unassign, edit details, close as Won't fix or Can't reproduce, mark and unmark duplicates, reopen. |
| QA | People with the QA flag | Verify Fixed bugs they did not fix; reopen. |
| Admin | One or more people | Manage people, areas and settings; read the outbox. Admin gives no power over bugs: an admin who is not a triager can't triage. |
| Outside reporter | Anyone, without signing in | Report a bug through the public form while it is on. Gets an acknowledgement and a "fixed" email. |

A person can hold several roles. Everyone signed in sees every bug, including outside reporters' names and emails. The server enforces all of this.

## 5. Data model

All IDs are strings. Timestamps are UTC. Shown times use the team time zone. All text is plain text.

**Settings** (one row)
- company_name (required, max 60), time_zone (IANA name, default "America/New_York")
- target_s1_hours, target_s2_hours, target_s3_hours, target_s4_hours (each 1 to 8,760, or empty for no target; defaults 24, 168, 720 and empty)
- reopen_window_days (1 to 365, default 30), form_enabled (boolean, default true)
- last_bug_number (integer, default 100; R2)

**Person**
- id, name (required, max 100), email (required, unique, stored lowercase)
- is_admin, is_triager, is_qa (booleans, default false), active (boolean, default true)

**Area**
- id, name (2 to 40 characters, unique ignoring case), active (boolean, default true)

**Bug**
- id, number (integer, unique; R2), version (integer, starts at 1; R17)
- title (5 to 120 characters), area_id (nullable until triage)
- severity: s1 | s2 | s3 | s4; priority: p1 | p2 | p3 | p4 (empty until triage)
- status: new | triaged | in_progress | in_review | fixed | verified | wont_fix | cannot_reproduce | duplicate
- steps (10 to 5,000 characters), expected (optional, max 2,000), actual (what happened, 1 to 2,000)
- environment (where it happened, max 200; required with at least 2 characters on team reports)
- link (optional https URL, max 2,000: a screenshot, a recording or the page)
- source: team | form; reporter_id (team reports); reporter_name, reporter_email (form reports only)
- assignee_id (nullable), duplicate_of_id (nullable, references Bug)
- review_link (optional https URL), fix_note (10 to 2,000 characters, set by Mark fixed)
- fixed_by_id, fixed_at (nullable; the latest fix)
- fix_due_at (nullable timestamp; section 7), overdue_notified_at (nullable timestamp)
- triaged_at, closed_at (nullable timestamps), reopen_count (integer, default 0), created_at, updated_at (the time of its latest event)

Open statuses: new, triaged, in_progress, in_review, fixed. Closed statuses: verified, wont_fix, cannot_reproduce, duplicate. closed_at is set exactly while a bug is closed.

**Watcher**: bug_id, person_id; unique (bug_id, person_id).

**Comment**: id, bug_id, author_id, body (1 to 5,000 characters), created_at. Comments can't be edited or deleted in v1.

**Event** (activity log, append-only)
- id, seq (integer, increasing; orders events written at the same moment), bug_id, actor_id (empty for the system and for form reports)
- type: reported | edited | triaged | severity_changed | priority_changed | assigned | unassigned | started | sent_to_review | review_returned | fixed | verified | reopened | wont_fix | cannot_reproduce | marked_duplicate | duplicate_added | unmarked_duplicate | commented | overdue
- data (JSON, nullable: from/to values, changed field names, comment_id, fix note, bug numbers), created_at

**Notification** (outbox)
- id, kind: new_bug | acknowledgement | assigned | ready_to_verify | verified | fixed_for_reporter | reopened | closed | duplicate | comment | overdue | weekly_summary
- person_id (empty for outside reporters), to_email, bug_id (nullable), subject, body
- status: queued | sent | logged | failed, attempts (integer, default 0), error (nullable), created_at, sent_at (nullable)

**SummaryRun**: week_start (date of a Monday, unique), created_at.

**FormAttempt** (the public form's rate limit, R19): ip_hash (HMAC-SHA256 of the IP address with the FORM_IP_SECRET environment variable), created_at.

## 6. Bug lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Report | Any team member | (none) | new | R3; number (R2); fix_due_at (section 7); reporter watches; event `reported`; notify triagers |
| Report (form) | Outside reporter | (none) | new | R19; number; severity s3, no area; fix_due_at; event `reported` with no actor; acknowledgement; notify triagers |
| Edit details | Reporter (New only), assignee, triagers | any open status | unchanged | R14; event `edited` |
| Change severity | Reporter (New only), triagers | any open status | unchanged | Recalculates fix_due_at (section 7); event `severity_changed` |
| Change priority | Triagers | triaged, in_progress, in_review, fixed | unchanged | Event `priority_changed` |
| Triage | Triagers | new | triaged | R4; triaged_at; event `triaged`; notify the assignee if one is chosen |
| Take it | Any team member | triaged with no assignee | triaged | Assignee = the actor; event `assigned` |
| Assign | Triagers | triaged, in_progress, in_review, fixed | unchanged | R5; event `assigned`; notify the new assignee |
| Unassign | Triagers, the assignee | triaged, in_progress, in_review | triaged | Event `unassigned` |
| Start | Assignee | triaged | in_progress | Event `started` |
| Send to review | Assignee | in_progress | in_review | Optional review_link; event `sent_to_review` |
| Back to in progress | Assignee | in_review | in_progress | Event `review_returned` |
| Mark fixed | Assignee | in_progress, in_review | fixed | R7; event `fixed`; notify verifiers |
| Verify | R8 | fixed | verified | closed_at; event `verified`; notify watchers and outside reporters |
| Reopen | R9 | fixed, verified, wont_fix, cannot_reproduce | R9 | event `reopened`; notify |
| Won't fix | Triagers | new, triaged, in_progress, in_review | wont_fix | R10; closed_at; event `wont_fix`; notify watchers |
| Can't reproduce | Triagers, the assignee | new, triaged, in_progress, in_review | cannot_reproduce | R10; closed_at; event `cannot_reproduce`; notify watchers |
| Mark duplicate | Triagers, the assignee | new, triaged, in_progress, in_review | duplicate | Section 8; events `marked_duplicate` and `duplicate_added`; notify |
| Not a duplicate | Triagers | duplicate | new | Section 8; event `unmarked_duplicate` |
| Comment | Any team member | any | unchanged | Event `commented`; notify watchers |
| Watch, Unwatch | Any team member | any | unchanged | No event |

Reporting, being assigned (by Triage, Take it or Assign) and commenting make a person a watcher. The comment required by Reopen, Won't fix and Can't reproduce, and the optional one on Mark duplicate, is saved as a Comment (its author watches); the action's own event and notification carry it, with no separate `commented` event or comment notification.

## 7. Severity, priority and fix targets

Severity is the impact: the reporter chooses it and triage confirms or changes it. Priority is the order the team works in, set only by triagers. They usually match but don't have to: a cosmetic bug on the pricing page before a launch can be S4 and P1.

| Severity | Use it when | Default fix target |
|---|---|---|
| S1 Critical | The product or a main feature is down for everyone, data is lost or wrong, or there is a security hole | 24 hours |
| S2 Major | A main feature is broken for some people, or the workaround is painful | 168 hours (7 days) |
| S3 Minor | Something is wrong but there is a fair workaround | 720 hours (30 days) |
| S4 Cosmetic | It looks wrong but nobody is blocked | none |

Priorities: P1 Urgent, P2 High, P3 Normal, P4 Low.

- fix_due_at = created_at + the Settings target for the bug's severity, in elapsed hours added to the UTC timestamp; empty when the severity has no target. Across a daylight-saving change the due time therefore shows one hour earlier or later on the clock.
- Changing the severity (at triage or later) recalculates fix_due_at from created_at and clears overdue_notified_at. Changing a target in Settings applies to bugs reported afterwards and to later severity changes; stored due times don't change.
- Bugs in New, Triaged, In progress and In review show a target state: "Overdue by {duration}" when now is later than fix_due_at, otherwise "Due in {duration}", or "No target". Fixed and closed bugs show none. A reopened bug shows it again against the same fix_due_at.
- Durations are whole minutes, rounded down: under 60 minutes "{m} min", under 48 hours "{h} h", otherwise "{d} d", each rounded down. Ages use the same format ("fixed 3 d ago").

### Worked examples (seed data in section 14; now is Tue 13 Oct 2026, 10:00 EDT)

| Bug | Severity | Reported | Fix due | Shows |
|---|---|---|---|---|
| BUG-114 | S1 | Tue 13 Oct, 07:30 | Wed 14 Oct, 07:30 | Due in 21 h |
| BUG-109 | S2 | Wed 7 Oct, 11:30 | Wed 14 Oct, 11:30 | Due in 25 h |
| BUG-104 | S2 | Mon 5 Oct, 09:00 | Mon 12 Oct, 09:00 | Overdue by 25 h |
| BUG-113 | S2 | Mon 12 Oct, 16:00 | Mon 19 Oct, 16:00 | Due in 6 d |
| BUG-102 | S3 | Mon 31 Aug, 10:00 | Wed 30 Sep, 10:00 | Overdue by 13 d |
| BUG-112 | S3 | Fri 9 Oct, 09:30 | Sun 8 Nov, 08:30 (clocks go back on 1 Nov) | Due in 25 d |
| BUG-112 raised to S2 | S2 | Fri 9 Oct, 09:30 | Fri 16 Oct, 09:30 | Due in 2 d |
| A new S3 bug reported now | S3 | Tue 13 Oct, 10:00 | Thu 12 Nov, 09:00 | Due in 30 d |

## 8. Duplicates and similar bugs

**Marking bug D as a duplicate of bug N** (triagers or D's assignee, while D is New, Triaged, In progress or In review; anyone else gets "Only triagers or the assignee can do this."):
1. Refuse if there is no bug N ("There is no BUG-999.") or if N is D ("A bug can't be a duplicate of itself.").
2. If N is a Duplicate, use the bug N points to. Call the result C. Step 5 keeps every duplicate pointing at a bug that is not a duplicate, so one step is enough.
3. If C is D, refuse: "BUG-113 is already a duplicate of BUG-104." (N's number, then D's).
4. If C is Verified, refuse: "BUG-105 is already verified as fixed. If this is the same problem, reopen BUG-105 instead." Any other status is fine, including Fixed, Won't fix and Can't reproduce.
5. In one transaction: D becomes Duplicate with duplicate_of = C and closed_at = now; every bug whose duplicate_of is D now points to C; D's reporter (if an active team member) and D's watchers become watchers of C; events `marked_duplicate` on D (data: C's number and the numbers moved) and `duplicate_added` on C (data: D's number).

**Reports.** A bug's reports count is 1 plus the number of bugs whose duplicate_of is that bug, shown as "3 reports" (nothing when it is 1).

**Not a duplicate** (triagers, on a Duplicate bug): the bug goes back to New with duplicate_of, closed_at, the assignee and overdue_notified_at cleared; its severity, priority and area stay as starting values for triage. Bugs moved to C earlier stay with C, and watchers added to C stay.

**Outside reporters.** When C is verified, the outside reporters of C and of every bug whose duplicate_of is C get the "Fixed" email (section 11).

| Action (in order, from the seed) | Result |
|---|---|
| Seed | BUG-110 is a duplicate of BUG-104, so BUG-104 shows "2 reports" and Ines Moreau watches it |
| Marcus marks BUG-113 as a duplicate of BUG-110 | BUG-110 is a duplicate, so BUG-113 links to BUG-104, which shows "3 reports"; Kofi Mensah (BUG-113's reporter) now watches BUG-104 |
| Marcus marks BUG-104 as a duplicate of BUG-113 | Refused: "BUG-113 is already a duplicate of BUG-104." |
| Marcus marks BUG-112 as a duplicate of BUG-105 | Refused: "BUG-105 is already verified as fixed. If this is the same problem, reopen BUG-105 instead." |
| Marcus marks BUG-104 as a duplicate of BUG-109 | BUG-104 closes as a duplicate of BUG-109; BUG-110 and BUG-113 move to BUG-109, which shows "4 reports"; BUG-104's watchers (Lucy, Theo, Ines, Kofi) now watch BUG-109 |

**Similar bugs.** While someone types a title on Report a bug, the server suggests bugs that may be the same problem. Suggestions only read data.
1. A title's words: lowercase it, split on anything that isn't a letter or a digit, and drop words shorter than 3 characters and these stop words: the, and, for, with, when, not, but, are, was, were, has, have, had, does, doesn, don, can, cannot, from, into, onto, this, that, then, than, after, before, our, your, you, its. Count each word once. No stemming: "export" and "exporting" are different words.
2. A bug's score is the number of words its title shares with the typed title.
3. Candidates are bugs that are not Duplicates and are open or were closed within reopen_window_days.
4. Show up to 5 with a score of 2 or more, highest score first, then highest number first, each with number, title, status, reports count and an Open link; open bugs also get "Watch this bug instead", which makes the person a watcher and opens that bug without creating a report.

| Typed title | Similar bugs |
|---|---|
| "CSV export times out" | BUG-104 (csv, export, times, out), then BUG-113 (csv, times, out). BUG-110 shares two words but is a duplicate |
| "Android app crashes on receipt upload" | BUG-114 (android, app, crashes, receipt) |
| "Wrong currency on invoice PDF" | BUG-105 (wrong, currency, invoice, pdf), Verified on Mon 5 Oct, inside the window |
| "Password reset email never arrives" | None: BUG-101 shares two words but was closed on Fri 4 Sep, outside the window |

## 9. Business rules

- **R1. Permissions on the server.** Every rule about who can do what is checked on the server for every action and API call; hiding a button is not a permission check, and a refused action changes nothing. The server checks permission first, then status, then version (R17). Messages: triager-only actions "Only triagers can do this."; assignee-only actions "Only the assignee (Kofi Mensah) can do this.", or "Take this bug or ask a triager to assign it first." when it has no assignee; actions for triagers or the assignee "Only triagers or the assignee can do this."; editing "Only the reporter (while it's New), the assignee or a triager can edit this bug."; admin pages and actions "Admins only."; an action that the bug's status doesn't allow "BUG-101 is Verified, so this can't be done."
- **R2. Numbers.** A new bug gets Settings.last_bug_number + 1, and last_bug_number is set to it in the same transaction, so numbers are sequential and never reused.
- **R3. Reporting.** Team reports need a title of 5 to 120 characters ("Give the bug a title of 5 to 120 characters."), a severity ("Choose a severity."), steps of 10 to 5,000 characters ("Describe the steps in at least 10 characters."), what happened ("Say what happened.") and where it happened, 2 to 200 characters ("Say where it happened, for example Production, Chrome on Windows."). Expected, area and link are optional; only active areas can be chosen ("Choose an active area."). Text over its maximum is refused with "{Field} can be at most {N} characters." Comments are 1 to 5,000 characters ("Write a comment first."). Every form validates on the server and shows these messages next to the field, keeping what was typed; turn off the browser's own validation (novalidate) so the messages are the ones in this spec.
- **R4. Triage.** Triage needs a severity, a priority ("Set a priority before triaging.") and an area ("Choose an area before triaging.") that is active ("Choose an active area."). The assignee is optional.
- **R5. Assignment.** A bug has at most one assignee, who must be an active person ("Choose an active person."). Take it works only on a Triaged bug with no assignee ("Only unassigned Triaged bugs can be taken."). Unassigning returns the bug to Triaged.
- **R6. Doing the work.** Only the assignee starts, sends to review, brings back from review and marks fixed. A triager who wants to do the work assigns the bug to themselves first.
- **R7. Fix note.** Mark fixed needs a fix note of 10 to 2,000 characters ("Add a fix note of at least 10 characters.") and sets fixed_by to the actor and fixed_at to now.
- **R8. Verification.** Only the reporter (an active team member) or an active QA person can verify, never the person in fixed_by: "You fixed BUG-107, so someone else has to verify it." Anyone else: "Only the reporter or QA can verify BUG-108." When nobody qualifies (the reporter is outside, inactive or the fixer, and no other active QA person exists), the Bug page says "No one else can verify this bug yet. Ask an admin to give someone the QA role."
- **R9. Reopening.** The reporter (an active team member), the assignee, QA people and triagers can reopen a Fixed, Verified, Won't fix or Can't reproduce bug; anyone else gets "Only the reporter, the assignee, QA or a triager can reopen this bug." A comment of at least 10 characters is required ("Add a comment of at least 10 characters."). A closed bug can be reopened only within reopen_window_days of closed_at. After that, the Bug page shows this text where Reopen would be, and a direct request gets this text too: "BUG-101 was closed more than 30 days ago. Report a new bug and mention BUG-101." Fixed goes back to In progress and keeps its assignee. Verified goes to In progress if its assignee is active, otherwise to Triaged with no assignee. Won't fix and Can't reproduce go to New with no assignee, to be triaged again. Reopening adds 1 to reopen_count and clears fixed_by, fixed_at, fix_note, closed_at and overdue_notified_at. Duplicates use Not a duplicate instead.
- **R10. Closing without a fix.** Won't fix and Can't reproduce need a comment of at least 10 characters ("Add a comment of at least 10 characters."). They keep the assignee for the record.
- **R11. Duplicates.** Mark duplicate and Not a duplicate follow section 8 exactly.
- **R12. Closed bugs.** A closed bug can't be edited, assigned, given a new severity or priority, or moved, except by Reopen (R9) and Not a duplicate (section 8). Comments, Watch and Unwatch always work.
- **R13. Fix targets.** fix_due_at, target states and durations follow section 7.
- **R14. Editing.** Edit details covers title, area, steps, expected, what happened, environment and link. Severity and priority have their own controls (section 6). Each save writes one `edited` event listing the changed fields.
- **R15. Events.** Every successful action writes the events named in section 6, with actor and time: one per action, two for Mark duplicate, and `overdue` from the job (section 12). Events are never edited or deleted, and there is no UI or API to do so.
- **R16. People.** Admins add, edit and deactivate people in Admin → People. A person needs a name ("Enter a name.") and a valid email ("Enter a valid email address."), unique ("Someone with this email already exists."). There is always at least one active admin ("There must be at least one active admin.") and one active triager ("There must be at least one active triager."). A person assigned to open bugs can't be deactivated: "Reassign Theo Lindqvist's 3 open bugs first." ("1 open bug" for one). Deactivated people can't sign in ("Ask an admin to add you."), be assigned or verify, and get no notifications; their bugs, comments and history stay.
- **R17. Stale screens.** Every action on an existing bug, except Comment, Watch and Unwatch, sends the version the person saw. The server compares it inside the same transaction as the update and adds 1 on success. A missing or different version gets "BUG-107 changed while you were looking at it. Reload to see the latest." and nothing is saved, so two people can't both move one bug at once. Only the bug the action is on is checked and counted up; changes that Mark duplicate makes to other bugs, and the job's overdue notices, leave their versions alone.
- **R18. Display.** Numbers "BUG-104". Severity "S2 Major" ("S2" on cards); priority "P1 Urgent" ("P1" on cards). Statuses: New, Triaged, In progress, In review, Fixed, Verified, Won't fix, Can't reproduce, Duplicate. Outside reporters: "Sam Rivera (outside)". Times in the team time zone, 24-hour: "Tue 13 Oct, 10:00", with the year added when it isn't this year in the team time zone. Weeks: "Mon 5 – Sun 11 Oct". "Reopened 1 time", "Reopened 2 times".
- **R19. Public form.** /report works without sign-in while form_enabled is on; when it is off, the page and any submission say "Bug reports aren't open right now." Fields: name (1 to 100: "Enter your name."), email (up to 254 characters with one @ and a dot after it, stored lowercase: "Enter a valid email address."), title, what happened and steps as in R3, where it happened (optional) and a link (optional). Reports start as S3 Minor with no area. A hidden honeypot field ("website") that is filled saves nothing and shows "Thanks. We've received your report." Each accepted report writes a FormAttempt; when that ip_hash already has 5 in the last 60 minutes, nothing is saved and the form says "We've received several reports from your network in the last hour. Please try again later." The IP address itself is never stored.
- **R20. Text and links.** Everything people type is shown as text, never as HTML. Links must be https URLs without a username or password ("Links must be full https:// addresses.") and open in a new tab with rel="noopener noreferrer".

## 10. Screens

Navigation: My work, Board, List, Report a bug, Triage (triagers), Summary, Admin (admins), and a "Go to bug" box that opens a bug by number ("104" or "BUG-104"; unknown numbers say "There is no BUG-999.").

1. **My work** (home). "Assigned to me": my bugs in Triaged, In progress and In review, in board order. "Waiting for my verification": Fixed bugs I may verify (R8), oldest fix first, as "BUG-107 Search ignores accented characters · fixed by Theo Lindqvist 3 d ago". "Reported by me": my open bugs, newest first. Triagers also see "Needs triage: 2", linking to Triage. Empty states: "Nothing assigned to you.", "Nothing to verify.", "No open bugs reported by you."
2. **Report a bug.** Title, area (active areas or "Not sure"), severity (with the meanings from section 7), steps to reproduce, expected, what happened, where it happened, link. The Similar bugs panel (section 8) sits under the title. Saving opens the new Bug page.
3. **Bug page.** Header: number, title, status (Duplicate shows "Duplicate of BUG-104" as a link), severity, priority, area, reporter ("Erin Walsh (outside) · erin@bluebird.example" for form reports), assignee, reports count, target state, "Reopened 1 time" when reopen_count is above 0. Body: steps, expected, what happened, where, link, review link, fix note with "Fixed by Theo Lindqvist, Fri 9 Oct, 11:00". An action bar shows only the actions the viewer may take now (section 6), each asking for what it needs (comment, fix note, bug number, triage fields), plus the R8 and R9 texts where they apply. Watchers with Watch/Unwatch. Comments, oldest first, with a box to add one. Activity log: every event oldest first (by created_at, then seq), one line each, such as "Mon 5 Oct, 09:00 · Reported by Lucy Tran" ("Reported by Erin Walsh through the form"), "Mon 5 Oct, 11:00 · Triaged by Marcus Webb: P1 Urgent, Web app, assigned to Theo Lindqvist" (adding ", S3 Minor → S2 Major" when triage changed the severity), "Started by Theo Lindqvist", "Comment by Theo Lindqvist", "BUG-110 marked as a duplicate of this bug by Marcus Webb", "Marked as a duplicate of BUG-104 by Marcus Webb", "Fixed by Kofi Mensah: {fix note}", "Verified by Lucy Tran", "Reopened by Nina Patel: {comment}", "Closed as Won't fix by Marcus Webb: {comment}", "Closed as Can't reproduce by Kofi Mensah: {comment}", "Severity changed by Marcus Webb: S3 Minor → S2 Major", "Overdue: was due Wed 30 Sep, 10:00". Other events follow this pattern, for example "Assigned to Kofi Mensah by Marcus Webb" ("Taken by Grace Kim" for Take it) or "Sent to review by Kofi Mensah".
4. **Triage** (triagers; anyone else sees "Only triagers can open this page."). New bugs, severity first (S1 first), then oldest first. Each row: number, title, reporter, reported time, target state, and severity, priority, area and assignee fields with a Triage button, plus Mark duplicate, Won't fix and Can't reproduce. Empty state: "Nothing to triage."
5. **Board.** Columns New, Triaged, In progress, In review and Fixed, each with a count; closed bugs are not shown. Cards: number, title, severity, priority, assignee or "Unassigned", "2 reports" when more than one, and the target state (Fixed cards: "Fixed 3 d ago"). Order in each column: priority (P1 first, none last), then severity (S1 first), then oldest first. A card menu lists the viewer's allowed actions; drag and drop is optional and must call the card menu's actions. Filters (the List has the same ones; each page keeps its own values in its URL): area, assignee (Anyone, Me, Unassigned, or an active person), severity, priority, "Overdue only" (target state Overdue), and search (a bug number with or without "BUG-", or text contained in the title, ignoring case).
6. **List.** The same filters plus status: Open (default), Closed, All, or one status. Columns: number, title, area, severity, priority, status, assignee, reporter, reports, target state, updated. Newest number first. **Export CSV** downloads every row the filters match as `bugs-2026-10-13.csv` (today in the team time zone) with the columns number, title, area, severity, priority, status, reporter, assignee, reports, duplicate_of, created_at, triaged_at, fixed_at, closed_at, fix_due_at, overdue, reopen_count. Number and duplicate_of as "BUG-104"; severity "S2"; priority "P1"; status as stored (in_progress); outside reporters as "Erin Walsh (outside)" with no email; timestamps UTC ISO 8601 (`2026-10-13T14:00:00Z`); overdue `yes` when the bug is in New to In review and past fix_due_at at export time, otherwise `no`; empty values left empty; UTF-8, with fields that contain commas, quotes or line breaks quoted.
7. **Summary.** A week picker (Monday to Sunday in the team time zone; default the last complete week) showing the counts for that week and the "right now" sections exactly as in the summary email (section 12), computed when the page opens.
8. **Admin → People.** Name, email, admin, triager, QA, active. Add, edit, deactivate (R16).
9. **Admin → Areas.** Name, active. Add, rename, deactivate ("Area names are 2 to 40 characters.", "An area called Web app already exists."); inactive areas can't be chosen for new reports or triage, and existing bugs keep them.
10. **Admin → Settings.** Company name, time zone (an IANA name), the four fix targets ("Targets are 1 to 8,760 hours, or empty for no target."), reopen window ("The reopen window is 1 to 365 days."), public form on or off.
11. **Admin → Outbox.** Every notification, newest first: time, recipient, kind, subject, status, error. Click a row to read the body.
12. **Public report form** (/report, no sign-in). "Report a bug to Wrenfield", the R19 fields, and on success "Thanks, Sam. Your report is BUG-115. We've emailed you a copy."

All screens must work on a phone.

## 11. Notifications

| Kind | Trigger | Recipients | Subject (seed example) |
|---|---|---|---|
| new_bug | Report, either kind | Every active triager except the reporter | "New bug BUG-115 (S3 Minor): Invoice total ignores the discount" |
| acknowledgement | Report (form) | The outside reporter | "We received your bug report BUG-115" |
| assigned | Triage with an assignee, Assign | The new assignee | "Assigned to you: BUG-114 Android app crashes when uploading a receipt photo" |
| ready_to_verify | Mark fixed | The reporter (an active team member) and every active QA person, never the fixer | "Ready to verify: BUG-104 Export to CSV times out for large accounts" |
| verified | Verify | Watchers | "Verified: BUG-106 App logs me out every time I switch screens" |
| fixed_for_reporter | Verify | Outside reporters of the bug and its duplicates, one email per address | "Fixed: App logs me out every time I switch screens" (their own bug's title) |
| reopened | Reopen | The assignee (every active triager when it reopens to New or has no assignee) and watchers | "Reopened: BUG-108 Tooltip covers the Save button on narrow screens" |
| closed | Won't fix, Can't reproduce | Watchers | "Won't fix: BUG-111 Add a dark theme to the invoice editor", "Can't reproduce: BUG-103 Dashboard totals are off by one cent" |
| duplicate | Mark duplicate | The duplicate's reporter and watchers | "BUG-113 is a duplicate of BUG-104" |
| comment | Comment | Watchers | "Comment on BUG-104 from Lucy Tran" |
| overdue | Scheduled job | The assignee, or every active triager when there is none | "Overdue: BUG-104 Export to CSV times out for large accounts" |
| weekly_summary | Scheduled job | Every active person | "Bug summary: Mon 5 – Sun 11 Oct" |

Actions not in this table send nothing. The person who acted never gets a notification about their own action, each person gets at most one notification per action, and inactive people get none. Bodies name the bug, who did what and any comment or fix note, and link to the Bug page (the Summary page for summaries). The outside reporter's emails say only "Hi Erin, the bug you reported (BUG-106, "App logs me out every time I switch screens") has been fixed. Thank you for reporting it." or, for the acknowledgement, "Hi Sam, thanks for your report "Invoice total ignores the discount". We'll email you when it's fixed."

Write each notification to the outbox with status `queued` in the same transaction as the action, then send it after the transaction commits. If no email provider is configured, set the status to `logged` instead of sending. If sending fails, set `failed` with the error; the job retries it until it has had 5 attempts. A notification failure never blocks or undoes the action.

## 12. Time, the scheduled job and the weekly summary

**Clock.** Every server-side read of the current time goes through one now() function. Days and weeks use the team time zone.

**Development toolbar** (development only; it must not exist or respond in production):
- Sign in as any person. Inactive people are listed, and choosing one shows "Ask an admin to add you."
- The clock: "Now: Tue 13 Oct 2026, 10:00 EDT", settable to any date and time, with "+1 hour" and "+1 day". It is stored on the server and stays fixed until changed; now() returns it.
- "Run scheduled job now" (Phase 4), using the development clock.
- "Reset to seed data": reloads section 14, empties the outbox and sets the clock to Tue 13 Oct 2026, 10:00 EDT.

**Scheduled job** (every hour, for example a cron calling POST /api/cron/tick with the header `Authorization: Bearer <CRON_SECRET>`, compared in constant time; anything else gets 401):
1. **Overdue notices.** For each bug in New, Triaged, In progress or In review whose fix_due_at is earlier than now and whose overdue_notified_at is empty: queue an overdue notification (section 11), set overdue_notified_at to now and write an `overdue` event. One notice per bug per due time: a severity change (section 7), Reopen (R9) and Not a duplicate (section 8) clear the field.
2. **Weekly summary.** Let M be the Monday of the current week. If now is at or after M 08:00 and there is no SummaryRun for M minus 7 days, create it and queue one summary per active person for the week from M minus 7 days to the Sunday before M. A missed Monday is sent by the next run that week; a second run sends nothing.
3. **Retry** queued and failed notifications with fewer than 5 attempts.
4. **Clean up** FormAttempt rows older than 24 hours.

**The summary** for week W (Monday 00:00 to Sunday 24:00, team time):
- Counts, each of distinct bugs: Reported (created in W), Fixed (a `fixed` event in W), Verified (a `verified` event in W), Closed without a fix (a `wont_fix`, `cannot_reproduce` or `marked_duplicate` event in W), Reopened (a `reopened` event in W).
- Right now, when the summary is made: Open now, with counts by severity; Overdue (New to In review bugs past fix_due_at, earliest due first, with severity, assignee or "Unassigned", and by how much); Waiting for verification (Fixed bugs, oldest fix first); Not triaged (New bugs, oldest first). An empty section says "None."

Seed example (the job run at the seed time):

```
Bug summary: Mon 5 – Sun 11 Oct
Reported 6 · Fixed 2 · Verified 1 · Closed without a fix 3 · Reopened 1

Open now: 9 (S1 1, S2 4, S3 3, S4 1)

Overdue
- BUG-102 Due date picker shows the wrong month on iPad · S3 Minor · Kofi Mensah · overdue by 13 d
- BUG-104 Export to CSV times out for large accounts · S2 Major · Theo Lindqvist · overdue by 25 h

Waiting for verification
- BUG-107 Search ignores accented characters · fixed by Theo Lindqvist 3 d ago
- BUG-106 App logs me out every time I switch screens · fixed by Kofi Mensah 3 d ago
- BUG-108 Tooltip covers the Save button on narrow screens · fixed by Grace Kim 19 h ago

Not triaged
- BUG-113 Exporting invoices to CSV times out · reported 18 h ago
- BUG-114 Android app crashes when uploading a receipt photo · reported 2 h ago
```

## 13. Edge cases

- Someone signs in whose email isn't in People, or who is inactive: "Ask an admin to add you."
- A developer reports a bug and fixes it: they can't verify it (R8), so QA does.
- An outside reporter's bug is marked a duplicate: they still get the "Fixed" email when the canonical bug is verified (section 8).
- The canonical bug is closed as Won't fix: its duplicates stay Duplicates, and their reporters, who watch it, get the Won't fix email.
- Two people act on the same bug from stale screens: R17. Two people take the same bug: the second gets the R17 message.
- A severity is lowered after the due time passed: the due time is recalculated from created_at, so the bug may stop being overdue; the activity log keeps the change.
- A Fixed bug fails verification after its due time: it returns to In progress, shows Overdue at once and gets a new overdue notice on the next run.
- An area is deactivated: existing bugs keep it and it stays available in filters, marked inactive.
- A person with Fixed bugs leaves: a triager reassigns them first (R16), and the next reopen goes to the new assignee.
- Reading any page, including suggestions, the board and the Summary page, never creates records. Only the job writes SummaryRun.

## 14. Seed data

Company: Wrenfield, invoicing software for small businesses (a web app, iOS and Android apps, an API). Settings: company name Wrenfield, time zone America/New_York, and the section 5 defaults for the rest. Emails are firstname@wrenfield.example. "Reset to seed data" sets the clock to Tue 13 Oct 2026, 10:00 EDT. All dates are fixed (not relative to today) and all times below are team time (EDT) in 2026.

| Person | Job | Admin | Triager | QA |
|---|---|---|---|---|
| Hannah Ortiz | Engineering lead | yes | yes | no |
| Marcus Webb | Product manager | no | yes | no |
| Nina Patel | QA engineer | no | no | yes |
| Theo Lindqvist | Backend developer | no | no | no |
| Grace Kim | Frontend developer | no | no | no |
| Kofi Mensah | Mobile developer | no | no | no |
| Lucy Tran | Support lead | no | no | no |
| Ines Moreau | Product designer | no | no | no |

Everyone is active. Areas: Web app, Mobile app, API, Payments (all active). Settings.last_bug_number is 114.

| Bug | Title | Area | Sev | Pri | Status | Reporter | Assignee | History |
|---|---|---|---|---|---|---|---|---|
| 101 | Password reset link expires immediately | Web app | S2 | P2 | Verified | Lucy | Theo | Reported Mon 24 Aug 09:00; triaged by Marcus 11:00; started Tue 25 Aug 09:30; fixed Thu 27 Aug 15:00 ("Token lifetime was read as minutes, not hours. PR #812."); verified by Lucy Fri 4 Sep 10:00 |
| 102 | Due date picker shows the wrong month on iPad | Mobile app | S3 | P3 | Triaged | Ines | Kofi | Reported Mon 31 Aug 10:00; triaged by Marcus Tue 1 Sep 09:00; overdue notice Wed 30 Sep 11:00 (overdue_notified_at set) |
| 103 | Dashboard totals are off by one cent | Web app | S3 | P3 | Can't reproduce | Lucy | Grace | Reported Tue 15 Sep 14:00; triaged by Hannah Wed 16 Sep 10:00; started Mon 5 Oct 10:00; Can't reproduce by Grace Thu 8 Oct 11:00 ("Totals match the ledger for all 12 accounts I checked.") |
| 104 | Export to CSV times out for large accounts | Web app | S2 | P1 | In progress | Lucy | Theo | Reported Mon 5 Oct 09:00; triaged by Marcus 11:00; started Tue 6 Oct 09:00; Theo commented 09:05 ("Reproduced with the Bluebird account, 48,000 invoices. The export loads every row into memory.") |
| 105 | Invoice PDF shows the wrong currency symbol | Payments | S3 | P2 | Verified | Lucy | Grace | Reported Tue 22 Sep 10:00; triaged by Marcus 15:00; started Mon 28 Sep 09:00; fixed Thu 1 Oct 16:00 ("Uses the account currency, not the browser locale. PR #1244."); verified by Nina Mon 5 Oct 14:00 |
| 106 | App logs me out every time I switch screens | Mobile app | S2 | P2 | Fixed | Erin Walsh, erin@bluebird.example (form) | Kofi | Reported Wed 7 Oct 20:15 as S3; triaged by Marcus Thu 8 Oct 09:00 (S3 Minor → S2 Major); started 10:00; fixed Fri 9 Oct 15:00 ("Session token was cleared on every screen change on iOS 18. Build 4.12.1.") |
| 107 | Search ignores accented characters | Web app | S3 | P3 | Fixed | Lucy | Theo | Reported Tue 29 Sep 11:00; triaged by Marcus Wed 30 Sep 10:00; started Mon 5 Oct 09:00; fixed Wed 7 Oct 16:00 ("Invoice search ignores accents. PR #1296."); reopened by Lucy Thu 8 Oct 10:00 ("Customer search still treats Müller and Muller as different names."); fixed Fri 9 Oct 11:00 ("Customer search ignores accents too. PR #1301.") |
| 108 | Tooltip covers the Save button on narrow screens | Web app | S4 | P4 | Fixed | Grace | Grace | Reported Thu 1 Oct 15:00; triaged by Hannah Fri 2 Oct 09:00; started Mon 12 Oct 09:00; fixed Mon 12 Oct 15:00 ("Tooltip opens above the button when there is no room below. PR #1320.") |
| 109 | Bulk delete removes one invoice too many | Web app | S2 | P1 | In review | Nina | Theo | Reported Wed 7 Oct 11:30; triaged by Hannah 12:00; started Thu 8 Oct 09:00; sent to review Mon 12 Oct 17:00 (https://git.example/wrenfield/web/pull/1322) |
| 110 | CSV export spins forever on big customers | Web app | S2 | none | Duplicate of BUG-104 | Ines | none | Reported Wed 7 Oct 13:00; marked as a duplicate of BUG-104 by Marcus 15:00 |
| 111 | Add a dark theme to the invoice editor | Web app | S4 | none | Won't fix | Kofi | none | Reported Tue 6 Oct 10:00; Won't fix by Marcus 16:00 ("Feature request, not a bug. Added to the roadmap list.") |
| 112 | Reminder emails go out twice on Mondays | Payments | S3 | P2 | Triaged | Nina | none | Reported Fri 9 Oct 09:30; triaged by Hannah 11:00 |
| 113 | Exporting invoices to CSV times out | Web app | S2 | none | New | Kofi | none | Reported Mon 12 Oct 16:00 |
| 114 | Android app crashes when uploading a receipt photo | Mobile app | S1 | none | New | Lucy | none | Reported Tue 13 Oct 07:30 |

Triage assigned each bug to the assignee shown, except BUG-112, which was triaged with no assignee. Each bug has the events, Comment rows (Theo on BUG-104, Lucy on BUG-107, Grace on BUG-103, Marcus on BUG-111) and fixed_by, fixed_at, closed_at and fix_due_at values its history implies. Watchers: each bug's team reporter, its assignee and its commenters, plus Ines on BUG-104 (from BUG-110). The steps, expected, what happened and where text of seeded bugs is up to the builder. No notifications and no SummaryRun rows are seeded.

After loading: 9 open bugs (New 2, Triaged 2, In progress 1, In review 1, Fixed 3) and 5 closed; BUG-104 has 2 reports; BUG-102 and BUG-104 are overdue.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Bug Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Settings, Person, Area, Bug, Watcher, Comment, Event, Notification, SummaryRun, FormAttempt) with a real database.
2. Add sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin → People, Admin → Areas and Admin → Settings (section 10, screens 8 to 10). Only admins can open them ("Admins only." for everyone else, also by URL), and the server refuses admin actions from anyone else. Enforce R16 and unique area names ("An area called Web app already exists.").
4. Load the seed data from section 14 exactly, including every bug's events, comments and watchers.
5. Add the development toolbar from section 12: "sign in as", the clock (shown as "Now: Tue 13 Oct 2026, 10:00 EDT", settable, with "+1 hour" and "+1 day"; every server-side read of the current time must use it) and "Reset to seed data". None of it may exist or respond in production.

Do not build the bug screens yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Admin → People lists 8 active people: Hannah Ortiz (admin, triager), Marcus Webb (triager), Nina Patel (QA), and Theo Lindqvist, Grace Kim, Kofi Mensah, Lucy Tran and Ines Moreau with no flags. Adding a person with the email theo@wrenfield.example is refused with "Someone with this email already exists."
- [ ] Signed in as Grace, Admin → People shows "Admins only." (also when opened by URL) and a direct request to save a person is refused with "Admins only." Signed in as Hannah, it opens.
- [ ] Deactivating Theo Lindqvist is refused with "Reassign Theo Lindqvist's 3 open bugs first." Deactivating Ines Moreau works: she shows as inactive, and choosing her in "sign in as" shows "Ask an admin to add you."
- [ ] Removing Marcus Webb's triager flag works. Removing Hannah Ortiz's triager flag is then refused with "There must be at least one active triager.", and removing her admin flag with "There must be at least one active admin."
- [ ] Admin → Areas lists Web app, Mobile app, API and Payments, and adding "web app" is refused with "An area called Web app already exists." Admin → Settings shows fix targets of 24, 168 and 720 hours for S1 to S3 and none for S4, a 30-day reopen window and the public form on.
- [ ] The toolbar shows "Now: Tue 13 Oct 2026, 10:00 EDT"; "+1 hour" makes it 11:00 and "+1 day" makes it Wed 14 Oct 2026, 11:00. "Reset to seed data" sets it back to Tue 13 Oct 2026, 10:00, makes Ines active again and gives Marcus his triager flag back.

### Phase 2: Reporting, triage and the lifecycle

```
Using the Bug Tracker blueprint above, build Phase 2 only.

1. Build My work, Report a bug, the Bug page, Triage (section 10, screens 1 to 4) and the "Go to bug" box. Leave out the Similar bugs panel and Mark duplicate until Phase 3.
2. Implement every action in section 6 except Report (form), Mark duplicate and Not a duplicate, with rules R1 to R10, R12 to R18 and R20. Enforce them on the server, not only by hiding buttons, and refuse direct API calls that break them with the exact messages in the spec.
3. Compute fix_due_at, target states and durations exactly as section 7, with unit tests for every row of its worked-examples table.
4. Check permission, status and version (R17) inside the same transaction as each update, and write the events section 6 lists for every action.
5. Write the notifications in section 11 for these actions as Notification rows with status "queued", but don't send anything yet.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (sign in as each person with the toolbar)
- [ ] Signed in as Lucy, My work lists only BUG-107 under Waiting for my verification ("fixed by Theo Lindqvist 3 d ago") and BUG-114, BUG-107 and BUG-104 under Reported by me. Signed in as Nina, Waiting for my verification lists BUG-107, BUG-106 and BUG-108, in that order.
- [ ] Signed in as Ines, reporting a bug with the steps "crash" is refused with "Describe the steps in at least 10 characters." With steps, what happened and where it happened filled in, "Invoice list jumps to the top after saving" (Web app, S3 Minor) is saved as BUG-115: New, "Due in 30 d", with Ines Moreau as a watcher.
- [ ] Signed in as Grace, Triage shows "Only triagers can open this page." and a direct request to triage BUG-114 is refused with "Only triagers can do this." Signed in as Marcus, Triage lists BUG-114 (Due in 21 h), BUG-113 (Due in 6 d) and BUG-115 (Due in 30 d) in that order. Triaging BUG-114 without a priority is refused with "Set a priority before triaging."; with P1 Urgent and Kofi Mensah as assignee, BUG-114 becomes Triaged and assigned to Kofi.
- [ ] Signed in as Theo, BUG-114 has no Start button and a direct request to start it is refused with "Only the assignee (Kofi Mensah) can do this." Signed in as Kofi, he starts it (In progress) and sends it to review with the link https://git.example/wrenfield/android/pull/233 (In review). Marking it fixed with the note "Fixed" is refused with "Add a fix note of at least 10 characters."; with "Null check for photos without EXIF data. Build 4.12.2." it becomes Fixed and shows "Fixed by Kofi Mensah, Tue 13 Oct, 10:00".
- [ ] Signed in as Theo, BUG-107 has no Verify button and a direct request to verify it is refused with "You fixed BUG-107, so someone else has to verify it." Signed in as Lucy, she verifies BUG-107: it shows Verified, and her Waiting for my verification now lists only BUG-114.
- [ ] Signed in as Grace, BUG-108 has no Verify button. Signed in as Nina, reopening BUG-108 with no comment is refused with "Add a comment of at least 10 characters."; with "Tooltip still covers Save at 320 px wide." it becomes In progress, assigned to Grace Kim, shows "Reopened 1 time", and the activity log ends with "Reopened by Nina Patel: Tooltip still covers Save at 320 px wide."
- [ ] Signed in as Lucy, she reopens BUG-105 with "Euro invoices show $ again since Monday's release." and it becomes In progress, assigned to Grace Kim. BUG-101 shows "BUG-101 was closed more than 30 days ago. Report a new bug and mention BUG-101." instead of a Reopen button, a direct request to reopen it is refused with that text, and her comment "Seeing this again on Safari." still posts.
- [ ] Signed in as Grace, Take it on BUG-112 assigns it to Grace Kim and it stays Triaged. BUG-113 offers her no Won't fix, and a direct request to close it as Won't fix is refused with "Only triagers can do this." Signed in as Marcus, changing BUG-112's severity from S3 Minor to S2 Major changes its target from "Due in 25 d" to "Due in 2 d".
- [ ] Signed in as Kofi, closing BUG-102 as Can't reproduce with the comment "Works" is refused with "Add a comment of at least 10 characters."; with "Month is correct on iPad Air and iPad mini with iPadOS 18.1." it shows Can't reproduce. BUG-104's activity log reads, in order: "Mon 5 Oct, 09:00 · Reported by Lucy Tran", "Mon 5 Oct, 11:00 · Triaged by Marcus Webb: P1 Urgent, Web app, assigned to Theo Lindqvist", "Tue 6 Oct, 09:00 · Started by Theo Lindqvist", "Tue 6 Oct, 09:05 · Comment by Theo Lindqvist" and "Wed 7 Oct, 15:00 · BUG-110 marked as a duplicate of this bug by Marcus Webb".

### Phase 3: Board, list, duplicates and export

```
Using the Bug Tracker blueprint above, build Phase 3 only.

1. Build the Board and the List (section 10, screens 5 and 6) with the shared filters kept in the URL, the sort orders in section 10, and the card menu using the Phase 2 actions.
2. Implement Mark duplicate and Not a duplicate exactly as section 8 and R11: following a duplicate to its canonical bug, moving existing duplicates, adding watchers, the reports count, their events and queued notifications. Add Mark duplicate to the Bug page and Triage.
3. Add the Similar bugs panel and "Watch this bug instead" to Report a bug (section 8), with unit tests for every row of its worked-examples table.
4. Add Export CSV to the List exactly as screen 6 describes.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Hannah, the Board shows New (2): BUG-114, BUG-113; Triaged (2): BUG-112 (P2, Unassigned, Due in 25 d), BUG-102 (P3, Kofi Mensah, Overdue by 13 d); In progress (1): BUG-104 (P1, Overdue by 25 h, 2 reports); In review (1): BUG-109 (Due in 25 h); Fixed (3): BUG-106, BUG-107 (both "Fixed 3 d ago"), BUG-108 ("Fixed 19 h ago"). No closed bug appears.
- [ ] On the Board, with only the area filter set to Mobile app, the cards are BUG-114, BUG-102 and BUG-106. Signed in as Theo with only Assignee "Me", they are BUG-104, BUG-109 and BUG-107. With only "Overdue only", they are BUG-102 and BUG-104, and reloading the page keeps that filter.
- [ ] The List with only the status filter set to Closed shows BUG-111 (Won't fix), BUG-110 (Duplicate of BUG-104), BUG-105 (Verified), BUG-103 (Can't reproduce) and BUG-101 (Verified), in that order. With status All and the search "csv", it shows BUG-113, BUG-110 and BUG-104.
- [ ] Signed in as Nina, typing the title "CSV export times out" on Report a bug shows BUG-104 and then BUG-113 under Similar bugs, and not BUG-110. "Watch this bug instead" on BUG-104 opens it with Nina Patel among its watchers, and the List with status All still has 14 bugs.
- [ ] Signed in as Marcus, he marks BUG-113 as a duplicate of BUG-110. BUG-113 shows "Duplicate of BUG-104", BUG-104 shows "3 reports", Kofi Mensah is among BUG-104's watchers, and BUG-113 is no longer on the Board.
- [ ] Marking BUG-112 as a duplicate of BUG-105 is refused with "BUG-105 is already verified as fixed. If this is the same problem, reopen BUG-105 instead.", and marking BUG-104 as a duplicate of BUG-113 is refused with "BUG-113 is already a duplicate of BUG-104." Signed in as Grace, BUG-112 offers no Mark duplicate, and a direct request is refused with "Only triagers or the assignee can do this."
- [ ] Signed in as Marcus, Not a duplicate on BUG-110 returns it to New: it appears in the Board's New column and on Triage, and BUG-104 shows "2 reports".
- [ ] On the List with only the status filter set to Closed, Export CSV downloads bugs-2026-10-13.csv with a header and 5 rows. BUG-113's row has status duplicate, an empty priority, duplicate_of BUG-104 and closed_at 2026-10-13T14:00:00Z; BUG-111's row has status wont_fix and closed_at 2026-10-06T20:00:00Z.

### Phase 4: Notifications, scheduled job, summary and the public form

```
Using the Bug Tracker blueprint above, build Phase 4 only.

1. Send the notifications in section 11 from the outbox. Email can use any provider we have; if none is configured, mark each notification "logged" instead of sending. A failed send must never block or undo the action that caused it.
2. Build Admin → Outbox and the Summary page (section 10, screens 11 and 7).
3. Build the scheduled job in section 12 at /api/cron/tick, protected by the CRON_SECRET header: overdue notices, the weekly summary, retries and FormAttempt clean-up. Add "Run scheduled job now" to the development toolbar; it runs the job with the development clock.
4. Build the public report form (screen 12) with R19: the honeypot, the rate limit, the acknowledgement email and the on/off setting.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Run the scheduled job at the seed time. Admin → Outbox gets 9 logged emails: "Overdue: BUG-104 Export to CSV times out for large accounts" to Theo Lindqvist (nothing for BUG-102, already notified), and "Bug summary: Mon 5 – Sun 11 Oct" to each of the 8 people, whose body has "Reported 6 · Fixed 2 · Verified 1 · Closed without a fix 3 · Reopened 1" and lists BUG-102 and BUG-104 under Overdue. Running the job again adds nothing.
- [ ] The Summary page for Mon 5 – Sun 11 Oct shows "Reported 6 · Fixed 2 · Verified 1 · Closed without a fix 3 · Reopened 1", "Open now: 9 (S1 1, S2 4, S3 3, S4 1)", and BUG-107, BUG-106 and BUG-108 under Waiting for verification.
- [ ] Signed in as Nina, she verifies BUG-106. The outbox has "Verified: BUG-106 App logs me out every time I switch screens" to Kofi Mensah and "Fixed: App logs me out every time I switch screens" to erin@bluebird.example, and nothing to Nina.
- [ ] Signed in as Theo, he marks BUG-104 fixed with the note "Export now streams rows in batches of 1,000. PR #1330." The outbox has "Ready to verify: BUG-104 Export to CSV times out for large accounts" to Lucy Tran and to Nina Patel, and nothing to Theo.
- [ ] Signed in as Lucy, she comments "Bluebird asked about this again today." on BUG-104. The outbox has "Comment on BUG-104 from Lucy Tran" to Theo Lindqvist and to Ines Moreau, and nothing to Lucy.
- [ ] Signed out, /report with the name Sam Rivera, the email sam@clientco.example, the title "Invoice total ignores the discount", what happened and steps shows "Thanks, Sam. Your report is BUG-115. We've emailed you a copy." The outbox has "We received your bug report BUG-115" to sam@clientco.example and "New bug BUG-115 (S3 Minor): Invoice total ignores the discount" to Hannah Ortiz and to Marcus Webb. Signed in as Marcus, Triage lists BUG-115 with "Sam Rivera (outside)".
- [ ] Submitting /report with the email "sam@clientco" is refused with "Enter a valid email address." and creates nothing. After Hannah turns the public form off in Admin → Settings, /report shows "Bug reports aren't open right now."
- [ ] With "+1 day" (Wed 14 Oct 2026, 10:00), running the job adds "Overdue: BUG-114 Android app crashes when uploading a receipt photo" for Hannah Ortiz and for Marcus Webb (it has no assignee), nothing for BUG-104 (now Fixed) or BUG-109 (due at 11:30), and no new summary.

## 16. Variations

- Attachments (screenshots and recordings) stored privately, with size limits.
- Pull request and commit webhooks from GitHub or GitLab that move bugs to In review and Fixed.
- Releases ("fixed in 4.12.2"), with outside reporters told when the release ships.
- Fix targets in business hours, with a holiday calendar.
- Slack or Teams alerts for S1 bugs and overdue notices.
- Two-way email for outside reporters, so their replies become comments.
- @mentions in comments, and full-text search over steps and comments.
- Other link types, such as "blocks" and "relates to".
