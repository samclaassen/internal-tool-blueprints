<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/training-manual . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Training Manual

Blueprint BP-027 · Department: Ops · Replaces: Trainual, the operations binder, onboarding by shadowing
For teams of 5 to 200 people who train staff on processes and policies.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Every new hire learns the job from whoever happens to be on shift."

A café group, clinic or field-service company keeps its processes in a binder, a few shared documents and people's heads. New staff shadow someone and pick up that person's shortcuts. Nobody knows who has read the food safety policy since it changed, the opening checklist describes a machine the shop replaced last year, and when an inspector asks for proof of training there is nothing to show.

This blueprint is a training manual: processes and policies written as short subjects, assigned by role with due dates, with quizzes where it matters, signed acknowledgement for policies, a record of who completed what and when, and reminders for owners to keep each subject current.

## 2. What the real product does

Research basis: Trainual's pricing page (trainual.com/pricing), October 2026.

What we verified:

1. **No published prices.** Every plan (Core, Pro, Premium, Enterprise) is sold through a demo ("Get a demo"); the page lists no prices. The FAQ says a one-time implementation fee of $1,000 applies, and that Trainual is best suited to companies with 25 to 1,000 employees.
2. **Core** includes AI-assisted documentation, flowcharts, AI knowledge search, 500+ templates, video embedding, screen recording, 2 GB of video storage, collaboration, content verification reminders, a roles and responsibilities builder, training by group, due dates, testing, tracking and reporting, an employee directory, a mobile app, 30 days of version history, HRIS and Slack integrations, and implementation support.
3. **Pro** adds individual training paths, video hosting with transcripts (15 GB), 300 e-signatures a year, an org chart and accountability chart, 90 days of version history and a customer success manager. **Premium** adds unlimited video, version history and e-signatures, custom branding and domain, and single sign-on. **Enterprise** adds API access, SOC 2 documentation and priority support.
4. Trainual also sells Operations (meetings, goals, scorecards) and Performance (reviews, feedback) products.

### What this blueprint keeps

Subjects made of short steps, with images and embedded video; assignment by role and to individuals, with due dates counted from the assignment or start date; quizzes with a pass mark; policies signed by typing a full name, with versions, and re-signing when a policy changes in a way that matters; progress per person and subject; owners reminded to verify their subjects on a schedule; search; reports and a CSV export for audits.

### What this blueprint deliberately leaves out

AI writing and AI search, templates, screen recording and video hosting (embed from your video host instead), org and accountability charts, training paths that vary per person, SCORM courses, a course library, gamification, mobile apps, translation, HRIS and Slack integrations, and single sign-on.

## 3. Scope of v1

- One company. People belong to one or more roles (such as Barista or Shift lead).
- Content is Markdown with images and embedded video links. Images are uploaded; video plays from YouTube, Vimeo or Loom embeds.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- A web app that works well on a phone, because most learners will read on their phones.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Owner, operations or people lead | Everything: people, roles, subjects, assignments, settings, every report. |
| Editor | Subject owners | Write and publish subjects they own, see progress on those subjects, verify them. |
| Manager | Shift leads, managers | See progress and overdue training for the people they manage. |
| Learner | Everyone | Read assigned and published subjects, take quizzes, sign policies, see their own progress. |

A person can be a manager and an editor. The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, time_zone, due_soon_days (2), verification_default_days (180).

**Person**: id, name, email (unique, lowercase), is_admin, manager_id, start_date, active.

**Role**: id, name (unique). **PersonRole**: person_id, role_id.

**Subject**: id, title, kind: process | policy, owner_id, status: draft | published | archived, assign_to_all (boolean: every active person), open_to_everyone (boolean: readable by all, assigned or not), due_days (days to complete after assignment), verify_every_days, verified_at, verified_by, version (policies), pass_mark (percent, optional; only with a quiz).

**Step**: id, subject_id, position, title, body (Markdown).

**Question**: id, subject_id, position, text, options (2 to 5), correct_option.

**RoleAssignment**: subject_id, role_id. **PersonAssignment**: subject_id, person_id, assigned_at, due_on. Role assignments create a PersonAssignment for everyone who has the role, now and when they get the role later.

**StepRead**: person_id, step_id, read_at.

**QuizAttempt**: id, person_id, subject_id, at, answers, score_percent, passed.

**Signature**: id, person_id, subject_id, version, typed_name, signed_at.

**PolicyVersion**: subject_id, version, published_at, change_note, requires_resign (boolean).

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Progress

A person's status on an assigned subject is the first that applies:

1. **Completed**: every step read, the quiz passed (if there is one), and for a policy, signed at its current version.
2. **Overdue**: not completed and today is after due_on.
3. **Needs signature**: a policy with everything read but no signature at the current version (including after a change that requires re-signing).
4. **In progress**: at least one step read or one quiz attempt.
5. **Not started**.

Progress percent = steps read ÷ steps, shown alongside the status. Quiz score = correct answers ÷ questions, rounded down to a whole percent; passing means score ≥ pass_mark. Retakes are unlimited; the best score counts.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Person and subject | Situation | Status |
|---|---|---|
| Cara, Espresso basics | 6 of 6 steps read, quiz 4 of 5 (80%), pass mark 80% | Completed |
| Dev, Espresso basics | 6 of 6 steps read, quiz 3 of 5 (60%) | In progress (quiz not passed), 100% read |
| Eli, Espresso basics | Started Monday, due 14 days after assignment, 2 of 6 steps read | In progress, 33% |
| Ben, Cash handling policy | All read, signed version 2; version 3 published with requires_resign | Needs signature |
| Dev, Food safety policy | Assigned Sep 1, due in 14 days, nothing read | Overdue |
| Fay, Roasting safety | Signed off and verified | Completed |

## 7. Policies and versions

| Change | Rule |
|---|---|
| Publish a new version with requires_resign | Everyone assigned must sign again, within due_days of publishing; anyone who had read everything becomes Needs signature; everyone assigned is emailed |
| Publish a new version without it (typo fixes) | Version number goes up; existing signatures still count |
| Sign | Type your full name (must match your name in the app, ignoring case and extra spaces); the signature records the version |
| Archive a policy | It stays in everyone's history with their signatures; it is no longer assigned |

Every signature shows the exact text of the version signed.

## 8. Business rules

- **R1. Assignments.** Assigning a subject to a role assigns it to everyone with that role, now and in future. Due date = assignment date + due_days, or for people who start later, their start date + due_days. Removing a role assignment does not delete anyone's progress.
- **R2. Progress** is calculated as in section 6, the same way everywhere.
- **R3. Quizzes** are scored as in section 6. Learners never see the correct answers of a question until they pass.
- **R4. Signatures** follow section 7; a signature is never edited or deleted.
- **R5. Editing.** Editors can edit only subjects they own; publishing a change to a process does not reset anyone's progress, but steps added later count as unread for people who hadn't completed the subject.
- **R6. Verification.** A published subject is due for verification verify_every_days after verified_at. Its owner is emailed when it falls due and weekly until it is verified; overdue subjects show "Needs review" to admins.
- **R7. Visibility.** Learners see only published subjects assigned to them, plus any published subject marked "open to everyone"; managers see the progress of the people they manage; editors see progress on subjects they own; admins see everything.
- **R8. Reminders.** Learners get an email when assigned, once on the first run on or after due_soon_days before the due date, and once on the first run after it becomes overdue; managers get a Monday digest of their team's overdue items.
- **R9. Records.** Step reads, quiz attempts and signatures are append-only, so the training record is an audit trail.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **My training** (home): my assigned subjects with status, progress and due date, overdue first; then subjects open to everyone.
2. **Subject reader**: steps one at a time with Next, marking each step read; the quiz at the end; for policies, the full text and the signature box.
3. **Search** across published subjects I can see.
4. **Subject editor** (editors and admins): steps, quiz, assignment by role and person, due days, verification period, publish (with a change note and "requires re-signing" for policies).
5. **Team progress** (managers and admins): people by subjects grid with status, filters for overdue and needs signature, and each person's history.
6. **Reports** (admins): completion by subject and role, overdue list, verification due list, CSV export.
7. **People and roles**, **Settings**, **Outbox** (admins).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Assigned | Learner | "New training: Espresso basics (due Oct 26)" |
| Due soon | Learner | "Due in 2 days: Espresso basics" |
| Overdue | Learner | "Overdue: Food safety policy" |
| Policy needs re-signing | Everyone assigned | "Please read and sign: Cash handling policy, version 3" |
| Verification due | Subject owner | "Time to review: Opening checklist (last verified Apr 10)" |
| Monday digest | Each manager with overdue items on their team | "Team training: 2 overdue, 1 needs signature" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job at 08:00 (protected by a CRON_SECRET header) sends due-soon, overdue and verification emails, and the Monday digest; it is safe to run twice.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so due dates, reminders and verification can be tested by moving the clock.

## 12. Export

Admins export training records as CSV: person, role, subject, kind, assigned on, due on, status, steps read, best quiz score, signed version, signed at, completed at. Filters for subject, role and date range.

## 13. Edge cases

- A person gains a role: its subjects are assigned with due dates from that day.
- A person is deactivated: their records stay; they drop out of reminders and current reports.
- A subject is archived while assigned: it leaves My training; records stay.
- A step is deleted from a process: reads of it stay in history; progress recalculates on the remaining steps.
- Someone signs the wrong name: refused with "Type your full name as it appears in the app: Ben Ortiz."
- A quiz is edited after people passed it: their pass stands; new attempts use the new questions.

## 14. Seed data

Company "Harbor Coffee Roasters", two cafés and a roastery; time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@harborcoffee.example): Ana Ruiz (admin; owner of Food safety policy), Ben Ortiz (Shift lead; manager of Cara, Dev and Eli; owner of Opening checklist), Cara Lin (Barista), Dev Shah (Barista), Eli Moss (Barista, started Monday Oct 12), Fay Kim (Roaster; owner of Roasting safety; managed by Ana). Ana manages Ben and Fay.

Roles: Barista (Cara, Dev, Eli), Shift lead (Ben), Roaster (Fay).

| Subject | Kind | Assigned to | Due days | Details |
|---|---|---|---|---|
| Espresso basics | process | Barista | 14 | 6 steps (The machine; Dialling in the grinder; Dosing and tamping; Pulling a shot; Steaming milk; Cleaning down), 5-question quiz, pass mark 80% |
| Opening checklist | process | Barista, Shift lead | 7 | 4 steps; last verified 188 days ago, every 180 days |
| Food safety policy | policy, version 2 | Everyone (assign_to_all) | 14 | 3 steps; must be signed |
| Cash handling policy | policy, version 3 | Shift lead | 7 | 2 steps; version 3 published yesterday with requires_resign |
| Roasting safety | process | Roaster | 14 | 3 steps (Before you start; Fire safety; Cleaning the grinder and roaster); verified 20 days ago |

Every subject except the Opening checklist was verified within the last 60 days.

Progress: Cara has completed Espresso basics (quiz 4 of 5), the Opening checklist and the Food safety policy (signed v2). Dev read all of Espresso basics but scored 3 of 5, completed the Opening checklist, and has not started the Food safety policy, assigned to him on Sep 1. Eli was assigned everything on Monday and has read 2 of 6 Espresso basics steps. Ben signed Cash handling version 2 and completed the Opening checklist and the Food safety policy (signed v2). Fay has completed Roasting safety and the Food safety policy (signed v2). Ana has not started the Food safety policy.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, subjects and reading

```
Using the Training Manual blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build People and roles, the Subject editor (without quizzes and policies for now), assignments (R1), My training and the Subject reader (section 9, screens 1, 2, 4 and 7), with R7 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Eli, My training lists Espresso basics (in progress, 33%, due Oct 26), the Opening checklist (due Oct 19) and the Food safety policy (due Oct 26); he cannot see Cash handling or Roasting safety, including by a direct request.
- [ ] Eli reads steps 3 to 6 of Espresso basics, and it shows 100% read.
- [ ] Ana gives Dev the Roaster role: Roasting safety appears in his training, due 14 days from today.
- [ ] Signed in as Ben, he can edit the Opening checklist but not Food safety, and a direct edit request is refused.

### Phase 2: Quizzes, policies and signatures

```
Using the Training Manual blueprint above, build Phase 2 only.

1. Add quizzes (R3) and the progress rules in section 6 (R2).
2. Add policies, versions and signatures exactly as section 7 describes (R4).
3. Write the assignment and re-signing emails (section 10) to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Dev retakes the Espresso basics quiz and scores 4 of 5: it shows 80%, passed, and the subject becomes Completed; his earlier 60% attempt is still in his history.
- [ ] Signed in as Ben, the Cash handling policy shows Needs signature for version 3; signing "ben ortiz" works, and signing "Ben O." is refused with "Type your full name as it appears in the app: Ben Ortiz."
- [ ] Ana publishes Food safety version 3 with requires re-signing: Ben, Cara and Fay, who had signed version 2, become Needs signature, and each of the six people assigned gets one email. Cara signs version 3; Ana then publishes version 4 as a typo fix, and Cara stays Completed.
- [ ] Cara's signature on version 2 still shows the version 2 text.

### Phase 3: Reminders, verification and team progress

```
Using the Training Manual blueprint above, build Phase 3 only.

1. Build the daily job with due-soon, overdue and verification emails and the Monday digest (R6, R8).
2. Build Team progress (section 9, screen 5) for managers and admins.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Ben, Team progress shows Dev's Food safety policy as Overdue and Eli's Espresso basics as In progress; he can't see Fay's progress, including by a direct request.
- [ ] Running the job today emails Ben that the Opening checklist is due for review (last verified 188 days ago), and running it again adds nothing.
- [ ] Moving the clock to Saturday Oct 24 and running the job emails Eli that Espresso basics and the Food safety policy are due in 2 days.
- [ ] Moving the clock to Monday Oct 19 and running the job sends Ben a digest listing Dev's overdue Food safety policy, and sends Ana none, since none of her people are overdue.

### Phase 4: Search, reports and export

```
Using the Training Manual blueprint above, build Phase 4 only.

1. Build Search (section 9, screen 3) and Reports with the CSV export (screen 6, section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Eli, searching "grinder" finds the Espresso basics step that mentions it and nothing from Roasting safety.
- [ ] The completion report shows Espresso basics completed by 1 of 3 Baristas and the Food safety policy by 3 of 6 people.
- [ ] The CSV export has one row per person and assigned subject with status, best quiz score and signed version.

## 16. Variations

- Training paths: subjects in a set order for a new role.
- Practical sign-off: a manager confirms a skill was demonstrated, not just read.
- Expiring certifications (food handler cards) with renewal reminders.
- Translations of each subject.
- A Slack message when training is assigned or overdue.
