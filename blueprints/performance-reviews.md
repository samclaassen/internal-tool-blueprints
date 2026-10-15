<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/performance-reviews . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

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

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | People operations | Everything: people, reporting lines, templates, cycles, calibration, release, reopening sections, the overdue list, export. |
| Manager | Anyone with direct reports | Everything an employee can do, plus: approve peers for their reports, read their reports' submitted self reviews and peer feedback, write and submit their reports' manager reviews. |
| Employee | Everyone in a cycle | Write and submit their self review, propose peers, write peer feedback when asked, read their review once released, acknowledge it. |

The visibility rules in R2 are enforced on the server for every page and every request.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Person**: id, name, email (unique, lowercase), title, team, role: admin | member, manager_id (empty for the top of the company), start_date, active.

**Template**: id, name, questions: list of { id, text, kind: text | rating, audience: self | manager | both | peer, required }.

**Cycle**: id, name, template_id, status: draft | active | closed, start_date_cutoff, self_due, peer_due, manager_due, release_on, share_peer_feedback (boolean), peer_min_for_sharing (default 2), launched_at, closed_at.

**Review**: id, cycle_id, employee_id, manager_id (fixed at launch), self_status and manager_status: not_started | draft | submitted, self_submitted_at, manager_submitted_at, overall_rating (manager), calibrated_rating, calibration_reason, released_at, acknowledged_at, acknowledgement_comment.

**Answer**: id, review_id, author_id, section: self | manager | peer, question_id, text or rating, updated_at.

**PeerRequest**: id, review_id, peer_id, status: proposed | approved | declined | submitted | peer_declined, decided_by, reason, submitted_at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Ratings and visibility

Competency ratings: 1 Needs improvement, 2 Developing, 3 Solid, 4 Strong, 5 Exceptional.
Overall rating (manager only): 1 Does not meet expectations, 2 Partially meets expectations, 3 Meets expectations, 4 Exceeds expectations, 5 Far exceeds expectations.
The **final rating** is the calibrated rating if there is one, otherwise the overall rating.

| Part of a review | Employee | Their manager | A peer | Admin |
|---|---|---|---|---|
| Self review | Always (their own) | Once submitted | Never | Once submitted |
| Peer feedback | After release, only if the cycle shares it and at least 2 peers submitted: without names, in random order | Each answer once submitted, with the peer's name | Only their own | Once submitted |
| Manager review and overall rating | After release | Always (their own writing) | Never | Once submitted |
| Calibration reason and the rating before calibration | Never | Yes | Never | Yes |
| Final rating | After release | Yes | Never | Yes |

Anyone else, including other managers and the employee's skip-level manager, sees nothing of the review.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Situation | Result |
|---|---|
| Marcus opens Leo's review | "Leo hasn't submitted his self review yet." Marcus can draft his own section but not see Leo's draft. |
| Kai opens Ivy's review | Refused: Kai is neither Ivy's manager nor an admin. |
| Marcus tries to submit Leo's manager review today | Refused: "Leo hasn't submitted his self review. You can submit after Oct 22." |
| Only Kai submits peer feedback for Ivy | Marcus sees Kai's answers with his name; at release Ivy sees no peer feedback, because fewer than 2 peers submitted. |
| Hannah calibrates Leo's overall rating from 4 to 3 | She must give a reason; Marcus is emailed; after release Leo sees "3, Meets expectations" and nothing about calibration. |

## 7. Lifecycle

| Action | Who | Rule |
|---|---|---|
| Launch cycle | Admin | Dates in order (self_due before peer_due, peer_due no later than manager_due, manager_due before release_on). Creates one review for every active person with a manager whose start_date is on or before start_date_cutoff, and emails each employee. |
| Save draft | Author | Any time after launch, until the section is submitted |
| Submit self review | Employee | All required self questions answered |
| Propose peers | Employee | 1 to 3 active people, not themselves and not their manager, before peer_due |
| Approve or decline a peer | Manager | A decline needs a reason; approval emails the peer |
| Submit peer feedback | Approved peer | Before the end of peer_due; a peer may decline with a reason |
| Submit manager review | Manager | All required manager questions and the overall rating answered, and the self review submitted or self_due passed (R4) |
| Calibrate | Admin | Before release, with a reason |
| Reopen a section | Admin | Before release, with a reason; the author is emailed |
| Release | Admin | On or after release_on, for reviews whose manager section is submitted; one by one or all at once |
| Acknowledge | Employee | After release, with an optional comment |
| Close cycle | Admin | After release_on; unreleased reviews stay visible to admins and managers |

## 8. Business rules

- **R1. Launch** creates reviews as section 7 describes and fixes each review's manager. People who start after the cutoff, or who have no manager, are not included.
- **R2. Visibility** is exactly the table in section 6, enforced on the server for pages, downloads and direct requests.
- **R3. Submissions.** Required answers must be filled in (text of 20 to 4,000 characters; ratings 1 to 5). A submitted section is read-only; only an admin can reopen it, before release, with a reason.
- **R4. Order.** A manager can submit a review only after the self review is submitted or self_due has passed.
- **R5. Peers.** Peer feedback is only from approved peers, only before the end of peer_due, and each peer answers only the peer questions.
- **R6. Calibration** sets calibrated_rating with a reason (10 to 500 characters) and emails the manager. The employee never sees the reason or the rating before calibration.
- **R7. Release** makes the review read-only and emails the employee.
- **R8. Acknowledgement** records the time and an optional comment (up to 1,000 characters), visible to the manager and admins. Nothing else in the review can change after it.
- **R9. Reminders.** Three days before each due date and on the day, everyone with a pending item for that step gets one email listing them; the job is safe to run twice. Admins see an overdue list from the day after each due date.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **My reviews**: my own review for the open cycle (with each step's status and due date), peer requests waiting for me, and my reports' reviews if I'm a manager.
2. **Review page**: the sections the viewer may see under R2, the forms the viewer may fill in, and the timeline of steps.
3. **Peers**: propose peers (employee); approve or decline them (manager).
4. **Cycle dashboard** (admin): every review with each step's status, the overdue list, calibration (overall ratings by team, with Calibrate on each), and Release.
5. **History**: each person's reviews by cycle; employees see only their own released reviews.
6. **People**, **Templates**, **Cycles**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Cycle launched | Each employee | "H2 2026 review: your self review is due Thu Oct 22" |
| Peer approved | The peer | "Ivy Tan asked for your feedback (due Thu Oct 29)" |
| Peer declined by the manager | The employee | "Ella Ford won't be asked for feedback" (with the reason) |
| Reminder (R9) | People with pending items | "Your self review is due in 3 days" |
| Calibration | The manager | "Leo Grant's overall rating was calibrated to 3" (with the reason) |
| Section reopened | Its author | "Your self review was reopened" (with the reason) |
| Release | The employee | "Your H2 2026 review is ready" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job at 09:00 in the company time zone (protected by a CRON_SECRET header) sends reminders. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so due dates, reminders and release can be tested by moving the clock. Due dates end at 23:59 in the company time zone (America/Chicago).

## 12. Export

Admins can export a cycle as CSV: employee, team, manager, self status and date, peers approved and submitted, manager status and date, overall rating, calibrated rating, final rating, released date, acknowledged date.

## 13. Edge cases

- A manager leaves during a cycle: an admin reassigns their open reviews to another manager, who sees everything the old manager could; the change is logged.
- An employee is deactivated during a cycle: their review stays visible to admins and is excluded from reminders.
- A peer is deactivated after approval: their request is cancelled and the employee is told.
- A review released by mistake: there is no un-release; an admin adds a note and starts the conversation outside the app.
- The same person is asked for feedback by three colleagues: each request is separate, with one reminder email listing all of them.

## 14. Seed data

Company Pinecrest Studio, time zone America/Chicago. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@pinecrest.example):

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

Template "Half-year review": "What went well this half?" (text, both), "What would you like to do better next half?" (text, both), ratings for Quality of work, Collaboration and Ownership (both), Overall rating (manager); peer questions "What should {name} keep doing?" and "What could {name} do differently?" (text, peer).

Cycles: H1 2026 (closed), in which Ivy Tan's review was released with a final rating of 4 and acknowledged. H2 2026 (active, launched three days ago): start_date_cutoff Sep 30, self due Thu Oct 22, peer due Thu Oct 29, manager due Thu Nov 5, release on Thu Nov 12, peer feedback shared, minimum 2 peers.

H2 2026 reviews (seven, for everyone except Dan and Nate): Ivy, Kai and Sofia have submitted self reviews; Leo has a self review draft; Ella, Marcus and Hannah haven't started. Ivy proposed Kai and Leo, and Marcus approved both; Kai proposed Ivy and Ella, waiting for Sofia. No manager reviews yet.

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
- [ ] Signed in as Kai, his peer form on Ivy's review asks "What should Ivy keep doing?" and "What could Ivy do differently?"; after he submits, he can see only his own answers on her review.
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
- [ ] Ivy's history shows H1 2026 (4, Exceeds expectations, acknowledged) and H2 2026 in progress; signed in as Ivy, she sees H1 2026's released review but nothing from H2 2026 beyond her own self review.
- [ ] The H2 2026 export has seven rows with each step's status and date, and the final rating column filled only for reviews with a submitted manager section.

## 16. Variations

- Upward feedback from direct reports to their manager.
- Short monthly check-ins between cycles.
- Goals from the OKR Tracker shown next to the review.
- A rating distribution chart per team for calibration meetings.
- Signed PDF copies of released reviews for the employee file.
