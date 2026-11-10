<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/performance-reviews . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

# Performance Reviews

Blueprint BP-025 · Department: People · Replaces: Lattice Performance, review documents in shared drives
For teams of 10 to 200 people who run review cycles once or twice a year.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Reviews live in Google Docs, half of them are late, and nobody can find last year's."

Twice a year someone in people operations copies a review template into a document per person, shares each one with the right manager, and chases everyone for weeks. Self reviews and manager reviews sit in the same document, so who could see what depends on sharing settings. Peer feedback arrives by email. Ratings are adjusted in a spreadsheet nobody else sees, and last year's review is somewhere in a folder.

This blueprint runs a review cycle: self reviews, peer feedback the manager approves, manager reviews with ratings, calibration by people operations, a release date when employees see their review, and acknowledgement. Who can see each part, and when, is a rule the server enforces.

## 2. What the real product does

Research basis: Lattice's pricing page (lattice.com/pricing), October 2026.

What we verified:

1. **Products priced per seat per month.** Performance is $10 (performance reviews, succession planning, promotions, PIPs, talent reviews and calibration, plus 1:1s, weekly updates, feedback and Q&A boards). Goals & OKRs is $8 and Engagement is $4. Add-ons: Compensation for $6 more and Grow for $4 more.
2. **Contract terms.** The minimum annual agreement is $4,000. All contracts are billed annually, in US dollars. Performance and Goals & OKRs can be bought separately, and 1:1s, feedback and updates come with any base product.
3. **Every base product** includes analytics, an AI agent and integrations.

For a team of 30, Performance alone at $10 per seat is $3,600 a year, so the $4,000 minimum applies; the minimum covers up to 33 seats.

### What this blueprint keeps

Review cycles with a template of questions and 1 to 5 ratings; self reviews; peer feedback, proposed by the employee and approved by the manager; manager reviews with an overall rating; calibration with a recorded reason; release on a set date; acknowledgement by the employee; reminders and an overdue list; each person's review history; a CSV export; and visibility rules for every part of a review.

### What this blueprint deliberately leaves out

1:1s, continuous feedback and praise, goals (see the OKR Tracker blueprint), engagement surveys, succession planning, promotions and PIPs, compensation planning, 360 reviews from direct reports, AI writing help, and HR system integrations.

## 3. Scope of v1

- One company and one review cycle open at a time, with one template per cycle.
- Reporting lines come from each person's manager. The manager on a review is fixed when the cycle launches.
- Ratings are whole numbers from 1 to 5 with labels (section 6).
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- Company settings: name, time zone and email domain (Pinecrest Studio, America/Chicago and pinecrest.example in the seed). Sign-in and new people accept only emails in that domain.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | People operations | Everything: people, reporting lines, templates, cycles, calibration, release, reopening sections, the overdue list, export. |
| Manager | Anyone with direct reports | Everything an employee can do, plus: approve peers for their reports, read their reports' submitted self reviews and peer feedback, write and submit their reports' manager reviews. |
| Employee | Everyone in a cycle | Write and submit their self review, propose peers, write peer feedback when asked, read their review once released, acknowledge it. |

The visibility rules in R2 are enforced on the server for every page and every request.

- Only the manager fixed on a review approves or declines its peers and writes its manager review. Admins and skip-level managers can't. The manager due date marks a manager review overdue but doesn't lock it.
- An admin's own review follows the Employee column of section 6: Hannah sees her own manager review and rating only after release, and can't calibrate or reopen her own review.
- A refusal returns HTTP 403 with its reason on screen; a missing or invalid answer returns 422 with the field's message; a signed-out page request goes to sign-in.
- In production, the first admin comes from a BOOTSTRAP_ADMIN_EMAIL setting, which creates one admin Person when there are none. The seed loads only in development.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Person**: id, name, email (unique, lowercase), title, team, role: admin | member, manager_id (empty for the top of the company), start_date, active, pronouns: he | she | they (for messages such as "Leo hasn't submitted his self review yet.").

**Template**: id, name, questions: list of { id, text, kind: text | rating, audience: self | manager | both | peer, required }. Every template has the question with id overall (rating, manager, required): it is the overall rating. Its answer is copied to Review.overall_rating only when the manager submits; a draft rating stays an answer that only the manager sees.

**Cycle**: id, name, template_id, status: draft | active | closed, start_date_cutoff, self_due, peer_due, manager_due, release_on, share_peer_feedback (boolean), peer_min_for_sharing (default 2), launched_at, closed_at.

**Review**: id, cycle_id, employee_id, manager_id (fixed at launch), self_status and manager_status: not_started | draft | submitted, self_submitted_at, manager_submitted_at, overall_rating (manager), calibrated_rating, calibration_reason, released_at, acknowledged_at, acknowledgement_comment.

**Answer**: id, review_id, author_id, section: self | manager | peer, question_id, text or rating, updated_at.

**PeerRequest**: id, review_id, peer_id, status: proposed | approved | declined | submitted | peer_declined | cancelled, decided_by, reason (1 to 500 characters, required for declined, peer_declined and cancelled), submitted_at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, created_at, kind, to_email, subject, body, status: queued | sent | failed | logged, error. The Outbox lists notifications newest first by created_at.

**ReminderSent**: cycle_id, step: self | peer | manager, due_date, when: three_days | due_day, person_id; unique together, so each reminder is sent at most once.

**Session** and **Setting** (company settings and the development clock offset) hold sign-in sessions and settings.

## 6. Ratings and visibility

Competency ratings: 1 Needs improvement, 2 Developing, 3 Solid, 4 Strong, 5 Exceptional.
Overall rating (manager only): 1 Does not meet expectations, 2 Partially meets expectations, 3 Meets expectations, 4 Exceeds expectations, 5 Far exceeds expectations.
The **final rating** is the calibrated rating if there is one, otherwise the overall rating. The employee sees the manager's answers and the final rating, never the Overall rating answer itself, because it is the rating before calibration.

| Part of a review | Employee | Their manager | A peer | Admin |
|---|---|---|---|---|
| Self review | Always (their own) | Once submitted | Never | Once submitted |
| Peer feedback | After release, only if the cycle shares it and at least 2 peers submitted: without names, in random order | Each answer once submitted, with the peer's name | Only their own | Once submitted |
| Manager review and overall rating | After release | Always (their own writing) | Never | Once submitted |
| Calibration reason and the rating before calibration | Never | Yes | Never | Yes |
| Final rating | After release | Yes | Never | Yes |

Anyone else, including other managers and the employee's skip-level manager, sees nothing of the review.

- An approved peer is refused on the review page, like anyone else; they give feedback on a separate peer feedback page that shows only the peer questions and their own answers.
- Drafts are visible only to their author. Until a self review is submitted, its manager sees "Not submitted" whether or not it was started; admins see Not started, Draft or Submitted.
- Before release, the employee sees the peers they proposed and the manager's decision on each (Waiting for your manager, Approved, or Declined with the reason), never whether a peer has submitted or declined.
- "Random order" means shuffled once per review, so the order stays the same between page loads.
- When peer feedback isn't shared with the employee, their review page has no Peer feedback section at all, not even an empty heading.
- Step statuses and dates (not started, draft, submitted, released, acknowledged) are not review content. The manager and admins see them for every review, including an admin's own row on the dashboard and in the export, where the ratings still follow the Employee column.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Situation | Result |
|---|---|
| Marcus opens Leo's review | "Leo hasn't submitted his self review yet." Marcus can draft his own section but not see Leo's draft. |
| Kai opens Ivy's review | Refused: Kai is neither Ivy's manager nor an admin. As her approved peer, he gives feedback on the separate peer feedback page. |
| Marcus tries to submit Leo's manager review today | Refused: "Leo hasn't submitted his self review. You can submit after Oct 22." From Fri Oct 23 (self_due ended at 23:59 on Oct 22) he can. |
| Only Kai submits peer feedback for Ivy | Marcus sees Kai's answers with his name; at release Ivy sees no peer feedback, because fewer than 2 peers submitted. |
| Hannah calibrates Leo's overall rating from 4 to 3 | She must give a reason; Marcus is emailed; after release Leo sees "3, Meets expectations" and nothing about calibration. |

## 7. Lifecycle

| Action | Who | Rule |
|---|---|---|
| Launch cycle | Admin | Dates in order (self_due before peer_due, peer_due no later than manager_due, manager_due before release_on). Creates one review for every active person with a manager whose start_date is on or before start_date_cutoff, and emails each employee. Only one cycle can be active: launch is refused while another is, when nobody is eligible, or when an eligible person's manager is inactive. Only a draft cycle can be edited; a template used by a launched cycle is read-only (duplicate it to change it). |
| Save draft | Author | Any time after launch, until the section is submitted. Drafts may be partial: the 20-character minimum applies on submit, the 4,000-character maximum always |
| Submit self review | Employee | All required self questions answered; also after self_due, until release |
| Propose peers | Employee | 1 to 3 active people in total per review, not themselves and not their manager, before the end of peer_due. They need not have a review in the cycle. A peer the manager declined frees the slot but can't be proposed again; a peer who declined still counts. Proposing sends no email: the manager sees proposals on Peers and My reviews |
| Approve or decline a peer | Manager | A decline needs a reason; approval emails the peer. Approve before the end of peer_due; decline until release. A decision can't be changed |
| Submit peer feedback | Approved peer | Before the end of peer_due, with R3's rules for answers; drafts are allowed. A peer may decline with a reason: no email is sent, the manager and admins see the reason, and the peer's draft is deleted |
| Submit manager review | Manager | All required manager questions and the overall rating answered, and the self review submitted or self_due passed (R4). If R4 isn't met, its refusal is shown first and the typed answers stay on the form, unsaved |
| Calibrate | Admin | Before release, with a reason, once the manager review is submitted. The new rating must differ from the current final rating; calibrating again is allowed and emails the manager again. The dashboard groups ratings by the employee's current team |
| Reopen a section | Admin | Before release, with a reason (1 to 500 characters); the author is emailed. Only the self and manager sections can be reopened, from the review page. Reopening the manager review clears the overall rating and any calibration (the event log keeps them), and R4 applies again |
| Release | Admin | On or after release_on (company time zone), in an active cycle, for reviews whose manager section is submitted; one by one or all at once ("all" means every unreleased review whose manager section is submitted). An inactive employee's review is released without an email |
| Acknowledge | Employee | After release, once, with an optional comment (an empty comment is stored as none); also after the cycle closes |
| Close cycle | Admin | After release_on; unreleased reviews stay visible to admins and managers |

Errors from dashboard actions show on the dashboard, and errors from review-page actions on the review page, with the typed values kept.

## 8. Business rules

- **R1. Launch** creates reviews as section 7 describes and fixes each review's manager. People who start after the cutoff, or who have no manager, are not included.
- **R2. Visibility** is exactly the table in section 6, enforced on the server for pages, downloads and direct requests.
- **R3. Submissions.** Required answers must be filled in (text of 20 to 4,000 characters, after trimming; ratings 1 to 5). The same rules apply to self, peer and manager answers. A submitted section is read-only; only an admin can reopen it, before release, with a reason.
- **R4. Order.** A manager can submit a review only after the self review is submitted or self_due has passed.
- **R5. Peers.** Peer feedback is only from approved peers, only before the end of peer_due, and each peer answers only the peer questions.
- **R6. Calibration** sets calibrated_rating with a reason (10 to 500 characters) and emails the manager. The employee never sees the reason or the rating before calibration.
- **R7. Release** makes the review read-only and emails the employee.
- **R8. Acknowledgement** records the time and an optional comment (up to 1,000 characters), visible to the manager and admins. Nothing else in the review can change after it.
- **R9. Reminders.** Three days before each due date and on the day, everyone with a pending item for that step gets one email listing them; the job is safe to run twice. Admins see an overdue list from the day after each due date.
  - Steps with reminders: self review, peer feedback and manager review (release has none).
  - Pending items: a self review not submitted (the employee); an approved peer request not answered (the peer); a proposed peer not yet decided (the manager, in the peer step); a manager review not submitted (the manager).
  - One email per person, per step, per reminder day. Safe to run twice means each (cycle, step, due date, reminder day, person) is sent at most once, recorded in ReminderSent; an item that becomes pending later that day is not emailed again.
  - The job uses the company calendar date, whatever the hour it runs; a missed reminder day is not made up later.
  - Inactive people get no reminders, and their reviews are left out of other people's reminders; they stay on the overdue list, marked inactive.
  - The overdue list shows the open cycle's items from the day after their due date until they are done: self reviews, unanswered peer requests, undecided peer proposals and manager reviews. Released reviews never appear.
- **R10. Events.** Every change writes an event; events are never edited or deleted. The one exception is the development-only reset to seed data, which reloads every table.

## 9. Screens

1. **My reviews**: my own review for the open cycle (with each step's status and due date), peer requests waiting for me, and my reports' reviews if I'm a manager.
2. **Review page**: the sections the viewer may see under R2, the forms the viewer may fill in, and the timeline of steps. Admins see Reopen (with a reason) under each submitted self or manager section before release. A separate **peer feedback page** for each approved peer shows the peer questions with {name} filled in and only that peer's answers; peers find it under "Peer requests waiting for me".
3. **Peers**: propose peers (employee); approve or decline them (manager).
4. **Cycle dashboard** (admin): every review with each step's status, the overdue list, calibration (overall ratings by team, with Calibrate on each), Release, "Run reminder job now" (also on the Outbox) and Export CSV.
5. **History**: each person's reviews by cycle, newest first; employees see only their own released reviews, plus a line saying a review is in progress. Admins see every person's history and managers the reviews they manage; skip-level managers and anyone else are refused, and an admin's own history uses the employee view. Columns: cycle, status (In progress, Released, Released and acknowledged), manager, self review, peers, manager review, overall and calibrated rating (admins and the manager only), final rating, released, acknowledged (with the comment).
6. **People**, **Templates**, **Cycles**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Cycle launched | Each employee | "H2 2026 review: your self review is due Thu Oct 22" |
| Peer approved | The peer | "Ivy Tan asked for your feedback (due Thu Oct 29)" (the employee's name: the employee asks, the manager approves) |
| Peer declined by the manager | The employee | "Ella Ford won't be asked for feedback" (with the reason) |
| Reminder (R9) | People with pending items | "Your self review is due in 3 days" or "... is due today"; "Your peer feedback is due in 3 days"; "Peer approvals are due in 3 days"; "Your manager review of Leo Grant is due in 3 days" ("Your 2 manager reviews ..." for several) |
| Calibration | The manager | "Leo Grant's overall rating was calibrated to 3" (with the reason) |
| Section reopened | Its author | "Your self review was reopened" or "Your manager review of Leo Grant was reopened" (with the reason) |
| Peer cancelled (deactivated) | The employee | "Ella Ford won't be asked for feedback" (she is no longer active) |
| Release | The employee | "Your H2 2026 review is ready" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job at 09:00 in the company time zone sends reminders: POST /cron/reminders with the header X-Cron-Secret set to CRON_SECRET (refused if it is missing, wrong or unset). A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so due dates, reminders and release can be tested by moving the clock. Due dates end at 23:59 in the company time zone (America/Chicago), so "after Oct 22" means from Fri Oct 23. In development, reset to seed data also sets the clock so that today is Thursday, October 15, 2026 at 10:00 company time, which puts the checks' dates (Oct 19, 22, 23 and 29, Nov 12) where they belong; the clock control takes a date and time in the company time zone.

## 12. Export

Admins can export a cycle as CSV: employee, team, manager, self status and date, peers approved and submitted, manager status and date, overall rating, calibrated rating, final rating, released date, acknowledged date.

- One column each, in this order: Employee, Team, Manager, Self status, Self submitted date, Peers approved, Peers submitted, Manager status, Manager submitted date, Overall rating, Calibrated rating, Final rating, Released date, Acknowledged date. Rows by employee name.
- Statuses use the data model's values (not_started, draft, submitted); dates are YYYY-MM-DD in the company time zone; ratings are numbers. Peers approved counts approved, submitted and peer-declined requests.
- The three rating columns are filled only once the manager section is submitted. In the exporting admin's own row, statuses and dates show as usual, but the overall and calibrated ratings stay empty and the final rating appears only after release.
- UTF-8 with standard quoting; a cell starting with =, +, - or @ gets a leading apostrophe so spreadsheets don't run it as a formula.

## 13. Edge cases

- A manager leaves during a cycle: an admin reassigns their open reviews to another manager, who sees everything the old manager could; the change is logged.
- An employee is deactivated during a cycle: their review stays visible to admins and is excluded from reminders.
- A peer is deactivated after approval: their request is cancelled (status cancelled, reason "Ella Ford is no longer active.") and the employee is told.
- A review released by mistake: there is no un-release; an admin adds a note and starts the conversation outside the app.
- The same person is asked for feedback by three colleagues: each request is separate, with one reminder email listing all of them.

## 14. Seed data

Company Pinecrest Studio, time zone America/Chicago. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@pinecrest.example; teams Leadership for Dan, People for Hannah, Engineering for Marcus, Ivy and Leo, Design for Sofia, Kai, Ella and Nate; everyone except Nate started before Sep 30, 2026; pronouns: Hannah, Sofia, Ivy and Ella she, the rest he):

| Person | Title | Manager | Notes |
|---|---|---|---|
| Dan Price | CEO | none | |
| Hannah Cole | Head of People | Dan | Admin |
| Marcus Webb | Engineering lead | Dan | |
| Sofia Ruiz | Design lead | Dan | |
| Ivy Tan | Engineer | Marcus | |
| Leo Grant | Engineer | Marcus | |
| Kai Moore | Designer | Sofia | |
| Ella Ford | Designer | Sofia | |
| Nate Bell | Designer | Sofia | Started Oct 1 |

Template "Half-year review": "What went well this half?" (text, both), "What would you like to do better next half?" (text, both), ratings for Quality of work, Collaboration and Ownership (both), Overall rating (manager); peer questions "What should {name} keep doing?" and "What could {name} do differently?" (text, peer). Every question is required; {name} is the employee's first name.

Cycles: H1 2026 (closed), which holds only Ivy Tan's review: self due Thu Apr 23, peer due Thu Apr 30, manager due Thu May 7, release on Thu May 14, 2026; Marcus's overall rating 4 with no calibration, released May 14 and acknowledged with a short comment. H2 2026 (active, launched three days ago): start_date_cutoff Sep 30, self due Thu Oct 22, peer due Thu Oct 29, manager due Thu Nov 5, release on Thu Nov 12, peer feedback shared, minimum 2 peers.

H2 2026 reviews (seven, for everyone except Dan and Nate): Ivy, Kai and Sofia have submitted self reviews; Leo has a self review draft; Ella, Marcus and Hannah haven't started. Ivy proposed Kai and Leo, and Marcus approved both; Kai proposed Ivy and Ella, waiting for Sofia. No manager reviews yet.

Launch was Mon Oct 12 at 09:00, so the outbox holds the seven launch emails and the two peer-approval emails for Ivy's peers (all logged), with matching events. Ivy submitted on Tue Oct 13, Kai and Sofia on Wed Oct 14. Leo's draft answers "What went well this half?" and Quality of work only.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and self reviews

```
Using the Performance Reviews blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask people operations to add you."
3. Build People, Templates and Cycles with launch (R1), My reviews and the Review page with self reviews (section 9, screens 1, 2 and 6), with R2 and R3 enforced on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Hannah, H2 2026 has seven reviews; Nate Bell (started Oct 1) and Dan Price (no manager) have none.
- [ ] Signed in as Marcus, Ivy's submitted self review is visible, while Leo's review says "Leo hasn't submitted his self review yet." and shows none of his draft answers.
- [ ] Signed in as Kai, opening Ivy's review is refused, both on screen and by a direct request.
- [ ] Signed in as Leo, submitting his self review with an empty required answer is refused; once complete, it submits, becomes read-only, and Marcus can now read it.

### Phase 2: Peer feedback

```
Using the Performance Reviews blueprint above, build Phase 2 only.

1. Build Peers (section 9, screen 3) and peer feedback with R5 and the peer rows of section 6.
2. Write the peer emails in section 10 to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Sofia, Kai's proposed peers are Ivy and Ella; approving Ivy emails her a request, and declining Ella with a reason emails Kai.
- [ ] Signed in as Kai, his peer feedback page for Ivy asks "What should Ivy keep doing?" and "What could Ivy do differently?"; after he submits, it shows only his own answers, and Ivy's review page itself is still refused.
- [ ] Signed in as Marcus, Ivy's review shows Kai's peer answers with Kai's name.
- [ ] After the clock moves past Oct 29, Leo's peer form for Ivy is closed and a direct submission is refused.

### Phase 3: Manager reviews, calibration and release

```
Using the Performance Reviews blueprint above, build Phase 3 only.

1. Build manager reviews with R4, calibration (R6) and release (R7) on the Cycle dashboard (section 9, screen 4), and acknowledgement (R8).
2. Write the calibration, reopen and release emails to the outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Marcus can draft Leo's manager review, but submitting it today is refused with "Leo hasn't submitted his self review. You can submit after Oct 22."; after the clock moves past Oct 22, he submits it with an overall rating of 4.
- [ ] Hannah calibrates Leo's rating from 4 to 3 with a reason; Marcus is emailed and sees the reason on the review.
- [ ] Before release, Leo sees no part of Marcus's review, including by a direct request.
- [ ] With the clock at Nov 12, Hannah releases Leo's review: Leo is emailed, sees Marcus's answers and "3, Meets expectations", nothing about calibration, and no peer feedback section.
- [ ] Leo acknowledges with a comment; the review shows Acknowledged, and its answers and rating can no longer be changed, including by a direct request.

### Phase 4: Reminders, history and export

```
Using the Performance Reviews blueprint above, build Phase 4 only.

1. Build the daily reminder job and the overdue list (R9).
2. Build History (section 9, screen 5) and the CSV export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Moving the clock to Monday Oct 19 at 09:00 and running the job sends one self-review reminder each to Leo, Ella, Marcus and Hannah, and running it again sends nothing more.
- [ ] On Oct 23, Hannah's overdue list shows four self reviews: Leo Grant, Ella Ford, Marcus Webb and Hannah Cole.
- [ ] Signed in as Hannah, Ivy's history shows H1 2026 (4, Exceeds expectations, acknowledged) and H2 2026 in progress; signed in as Ivy, she sees H1 2026's released review but nothing from H2 2026 beyond her own self review, even after Marcus submits her manager review.
- [ ] The H2 2026 export has seven rows with each step's status and date, and the final rating column filled only for reviews with a submitted manager section (after the previous check, only Ivy's).

## 16. Variations

- Upward feedback from direct reports to their manager.
- Short monthly check-ins between cycles.
- Goals from the OKR Tracker shown next to the review.
- A rating distribution chart per team for calibration meetings.
- Signed PDF copies of released reviews for the employee file.

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser. Each phase's checks started from a fresh load of the seed and ran in order on the same data, as the build plan says; reset to seed data set the development clock to Thursday, October 15, 2026 at 10:00 company time, and the checks moved it to October 19, 23 and 30 and November 12. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Emails were read on the admin Outbox screen, the reminder job was run from its "Run reminder job now" button and once through its endpoint, and the CSV export was downloaded and parsed.

**Result:** 17 of 17 acceptance checks passed in one final browser run on a fresh database, plus 122 automated tests. The item-by-item results are in [acceptance-results.json](/builds/performance-reviews/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. "Leo hasn't submitted his self review yet." needs a pronoun, but Person had no pronoun field. Person now has pronouns, and the seed gives each person one.
2. The worked example and a Phase 1 check refuse Kai on Ivy's review, while a Phase 2 check put his peer form "on Ivy's review". Peers now write on a separate peer feedback page, the review page refuses them, and the Phase 2 check says so.
3. The template's "Overall rating" question and the review's overall_rating field were never linked. The question with id overall is the overall rating, and every template has it.
4. The seed template didn't say which questions are required. Every question is.
5. The 20-character minimum didn't say whether it applies to drafts. It applies on submit; the 4,000-character maximum always applies.
6. Nothing said whether an employee can still submit a self review after self_due. They can, until release.
7. Nothing said which rules apply when an admin opens her own review. The Employee column does, so Hannah sees her own rating only after release.
8. Nothing said what a manager sees of a self review that was started but not submitted. They see "Not submitted"; admins see Not started, Draft or Submitted.
9. Launch had no rule for a second active cycle, nobody eligible, or an eligible person whose manager is inactive. Each is refused.
10. Nothing said whether a launched cycle or a template in use can be edited. Only draft cycles can; a template in use is duplicated instead.
11. The H1 2026 cycle had no dates and no list of reviews. It holds only Ivy's review, with dates from April 23 to May 14.
12. Seed people had no teams or start dates apart from Nate's. Section 14 now gives both.
13. The seed's cycle was "launched three days ago" with no launch emails, submission times or peer-approval emails. Section 14 now lists them.
14. "In random order" didn't say whether the order changes on every page load. It is shuffled once per review.
15. Sign-in was limited to "our company email domain", with no setting for the domain. The company settings hold it.
16. Reset to seed data deletes events that R10 says are never deleted. Reset is now the one, development-only exception.
17. Nothing said how the first admin exists in production. A BOOTSTRAP_ADMIN_EMAIL setting creates one, and the seed loads only in development.
18. Refusals had messages but no HTTP status. Refusals are 403, invalid answers 422, and signed-out pages go to sign-in.
19. Section 14 loads the seed relative to today, but the checks name October 19, 22, 23 and 29 and November 12. Reset now sets today to Thursday, October 15, 2026, and the clock control takes company time.
20. "1 to 3 peers" didn't say whether that is per proposal or in total. It is 3 per review in total, with rules for declined slots.
21. Nothing said whether a proposed peer must be in the cycle. Any active person except the employee and their manager can be.
22. Nothing said whether admins or skip-level managers can approve peers. Only the manager on the review can, and a decision can't be changed.
23. Nothing said whether a manager can approve or decline after peer_due. Approving stops at peer_due; declining is allowed until release.
24. Decline reasons had no length. They are 1 to 500 characters.
25. A peer who declines had no email, visibility or draft rule. No email is sent, the manager and admins see the reason, and the draft is deleted.
26. Nothing said whether peers can save drafts or who sees them. They can, and only the peer sees them.
27. Section 6 didn't say what the employee sees of their peers before release. They see whom they proposed and the manager's decision, never whether a peer has answered.
28. Section 10 has no email for a proposal, so the manager wasn't told. Proposals send no email and show on Peers and My reviews.
29. "Ivy Tan asked for your feedback" uses the employee's name although the manager approves. The table now says the employee's name is intended.
30. A deactivated peer's request "is cancelled", but PeerRequest had no cancelled status. It now has one, with its own email.
31. The Outbox lists emails, but notifications had no time. They now have created_at.
32. Nothing said whether peer answers follow R3's length rules. They do, like self and manager answers.
33. Nothing said whether a manager review that breaks R4 is checked for missing answers first. The R4 refusal comes first, and the typed answers stay on the form.
34. "You can submit after Oct 22" didn't say whether October 22 itself counts. It doesn't: from October 23, once self_due has ended at 23:59.
35. Nothing said when overall_rating is set. Only when the manager submits; a draft rating stays an answer only the manager sees.
36. Nothing said whether admins can write a manager review or whether manager_due locks it. Only the manager can, and the due date only marks it overdue.
37. Section 6 shows the employee the "overall rating" after release but never "the rating before calibration", which is the same field once calibrated. The employee sees the final rating, never the overall answer.
38. Calibration had no rule for an unsubmitted manager review, an unchanged rating or a second calibration. It needs a submitted review and a different rating, and can be repeated.
39. "Overall ratings by team" didn't say which team, and the reason length didn't say whether spaces count. The employee's current team, and 10 to 500 characters after trimming.
40. Nothing stopped an admin calibrating or reopening her own review. Both are refused.
41. Reopen had no screen, no list of sections and no reason length. It is on the review page, for self and manager sections, with 1 to 500 characters.
42. Nothing said what reopening a manager review does to its rating and calibration. Both are cleared, the events keep them, and R4 applies again.
43. Section 10 had a reopen subject only for self reviews. The manager version now names the employee.
44. Release didn't say which time zone counts, what "all at once" includes, or whether inactive employees are emailed. Company time, every review with a submitted manager section, and no email.
45. Acknowledgement didn't say whether an empty comment counts, whether it can be repeated, or whether it works after the cycle closes. Empty is none, once only, and yes.
46. Nothing said where errors from dashboard actions show. On the dashboard, with the typed values kept.
47. R9 didn't say which steps get reminders. Self review, peer feedback and manager review; release has none.
48. "A pending item" wasn't defined for each step. R9 now lists who owes what, including the manager's undecided peer proposals.
49. "One email listing them" didn't say per step or per day. One email per person, per step, per reminder day.
50. "Safe to run twice" had no definition and nowhere to record sends. Each reminder is sent once, recorded in ReminderSent.
51. Nothing said whether the 09:00 job uses the hour, or whether a missed day is made up. It uses the company date, and a missed day isn't.
52. Section 10 had only the self review's "due in 3 days" subject. It now has the due-today, peer, approval and manager versions.
53. Nothing said whether inactive people get reminders or stay on the overdue list. No reminders; they stay on the list, marked inactive.
54. The job was "protected by a CRON_SECRET header" with no endpoint or header name. POST /cron/reminders with X-Cron-Secret.
55. No screen offered "run the job now". The Cycle dashboard and the Outbox have "Run reminder job now".
56. The overdue list didn't say which items it shows. Self reviews, unanswered peer requests, undecided proposals and manager reviews, never released ones.
57. History said what employees see but not managers, skip-level managers or an admin looking at her own. Section 9 now covers each.
58. History had no columns. Section 9 now lists them.
59. The export's "self status and date" didn't say one column or two, or what format statuses, dates and ratings take. Section 12 now names 14 columns and their formats.
60. R2 covers downloads, so the exporting admin's own row hid its statuses, but the export check expects each step's status in all seven rows. Statuses and dates aren't review content; only her ratings are hidden.
61. The CSV had no encoding or formula guard. UTF-8, and cells starting with =, +, - or @ get an apostrophe.
62. On a fresh seed no review has a submitted manager section, so the export check's final-rating condition couldn't fail. The check now runs after the previous one submits Ivy's manager review.
63. The release check expects "no peer feedback section", but nothing said whether an empty heading counts. When feedback isn't shared there is no section at all.
64. The history check didn't say whose view "Ivy's history" is. It now says signed in as Hannah.

**What we did not test:**
- Production sign-in: every check used the development "sign in as" switcher; the Google sign-in limited to the company domain was built but never tried against Google.
- Real email delivery: every email was logged in the outbox; no email provider was configured.
- A real scheduler: the daily reminder job was run from its button and its endpoint, never by cron at 09:00.
- Hosting: the checks ran on localhost with SQLite.
- Anonymous peer feedback after release: no check reaches a release with 2 or more submitted peers, so the shuffled, nameless view is covered only by the build's own tests.
- Section 13's edge cases (a manager leaving mid-cycle, deactivating an employee or an approved peer) and closing a cycle.
- Phones beyond one 390-pixel Chromium viewport.
