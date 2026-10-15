<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/okr-tracker . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# OKR Tracker

Blueprint BP-022 · Department: People · Replaces: Perdoo, the OKR spreadsheet, the quarterly goals slide
For teams of 5 to 100 people who set goals each quarter.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We set OKRs in January and looked at them again in March."

A growing company writes objectives and key results at the start of the quarter in a spreadsheet or a slide. Nobody updates the numbers, so progress is a guess at the end-of-quarter review. Team goals don't say which company goal they support, targets quietly move when they get hard, and the next quarter starts from a blank page.

This blueprint is an OKR tracker: company and team objectives for each quarter, measurable key results, weekly check-ins with a value, a confidence call and a comment, progress and pace calculated the same way everywhere, alignment between team and company objectives, reminders for check-ins that are late, and a cycle close that scores everything and carries unfinished work forward.

## 2. What the real product does

Research basis: Perdoo's pricing page and plan comparison (perdoo.com/pricing), October 2026, priced in US dollars for 10 users.

What we verified:

1. **Plans and prices.** Free for up to 5 users, with strategy maps, OKR and KPI tracking, meetings, Slack and Teams integration, and an AI assistant and coach. Premium: $9 per user per month billed annually for 10 users ($1,080 a year), adding dashboards, SSO and SCIM, premium integrations, and API and MCP server access. Supreme: $11 per user per month billed annually for 10 users ($1,320 a year), adding board views, custom dashboards, more integrations and view-only licenses ($1.75 each per month). The page says the price per user goes down as you add more licenses, and quarterly billing is also offered.
2. **Every plan** includes company, team and individual OKRs and KPIs, projects and tasks, customizable check-ins, user and team reviews, progress reports, goal import, and mobile apps.
3. **Paid features.** Cloning OKRs, a customizable OKR closing process, performance dashboards, custom reports and data export start on Premium. Private OKRs, visibility restrictions, custom fields, tags and templates, and performance reviews are listed only on Supreme.

### What this blueprint keeps

Quarterly cycles; company and team objectives with an owner; up to 5 key results each, measured as a number, percentage, currency amount or milestone, in either direction (higher or lower is better); weekly check-ins with value, confidence and comment; progress and pace calculated by one set of rules; alignment from team to company objectives; a record of every target change with its reason; reminders for late check-ins and a Friday summary; closing a cycle with final scores and carry-forward; history of past cycles; a CSV export.

### What this blueprint deliberately leaves out

KPIs tracked outside cycles, individual OKRs, private OKRs, projects and tasks, performance reviews and engagement surveys, strategy maps, roll-up of team progress into company progress, integrations that update key results automatically, AI drafting, and mobile apps (the web app works on a phone).

## 3. Scope of v1

- One company, one time zone (Settings; default America/New_York). Cycles are calendar quarters by default but can have any start and end date.
- Everyone signed in can see every objective and key result. Openness is the point of OKRs; private goals are a variation.
- Key result values are stored as integer hundredths (8.5% is 850, $40,000 is 4000000, 4.5 hours is 450). Never store them as floats.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Founders, people or operations leads | Everything: settings, people, teams, cycles, company objectives, any objective or key result, closing cycles. |
| Team lead | One per team | Create and edit their team's objectives and key results; check in any of their team's key results. |
| Member | Everyone else | See everything; check in key results they own; edit objectives they own. |

Who may check in a key result: its owner, the owner of its objective, the lead of that objective's team, or an admin. The server enforces every rule here.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, time_zone, reminder_day (default Monday), reminder_time (default 09:00), summary_day (default Friday), summary_time (default 16:00).

**Person**: id, name, email (unique, lowercase), role: admin | member, team_id (optional), active.

**Team**: id, name (unique), lead_id.

**Cycle**: id, name (such as "Q4 2026"), starts_on, ends_on, status: planning | active | closed, closed_at, closed_by.

**Objective**: id, cycle_id, level: company | team, team_id (team level only), title, description, owner_id, aligned_to_id (team objectives only: a company objective in the same cycle, optional), final_score (set at close), carried_from_id.

**KeyResult**
- id, objective_id, title, owner_id, metric: number | percent | currency | milestone, unit (such as "hours" or "partners"; empty for percent and currency)
- direction: increase | decrease (milestones are always increase)
- start_x100, target_x100, current_x100 (milestones: 0 and 100, current 0 or 100)
- confidence: on_track | at_risk | off_track (from the latest check-in), last_check_in_at, final_progress_bp (set at close), position

**CheckIn** (append-only): id, key_result_id, at, by_id, value_x100, confidence, comment (required, 3 to 1,000 characters).

**TargetChange** (append-only): id, key_result_id, at, by_id, field: start | target, old_x100, new_x100, reason.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Progress and pace

**Key result progress** = (current − start) ÷ (target − start), for both directions (a decrease has target below start, so the same formula works). Below 0 counts as 0; above 1 counts as 1 and the key result is marked "Exceeded". A milestone is 0% until done and 100% when done.

**Objective progress** is the plain average of its key results' exact progress. Alignment does not feed team progress into company objectives.

**Display**: whole percentages, rounded half up from the exact value (37.5% shows as 38%).

**Pace** compares progress with the share of the cycle that has passed: elapsed = days from the start through today ÷ days in the cycle. A key result is **Ahead** if progress is at least elapsed + 10 points, **Behind** if progress is below elapsed − 10 points, otherwise **On pace**. Milestones have no pace. Progress of 100% shows **Done** instead.

### Worked examples (seed data in section 14; today is day 15 of a 92-day cycle, so elapsed is 16.3%)

| Key result | Start → target | Current | Progress | Pace |
|---|---|---|---|---|
| Trial-to-paid conversion | 8% → 12% | 9% | (9 − 8) ÷ (12 − 8) = 25% | On pace |
| Self-serve MRR | $40,000 → $55,000 | $40,500 | 500 ÷ 15,000 = 3.3%, shown 3% | Behind |
| Monthly logo churn (lower is better) | 3.0% → 2.0% | 2.8% | (3.0 − 2.8) ÷ (3.0 − 2.0) = 20% | On pace |
| Median first response (lower is better) | 6 hours → 2 hours | 4.5 hours | 1.5 ÷ 4 = 37.5%, shown 38% | Ahead |
| NPS | 32 → 40 | 36 | 4 ÷ 8 = 50% | Ahead |
| Partner program page (milestone) | not done → done | not done | 0% | none |
| Objective "Grow revenue from self-serve customers" | | | (25% + 3.33%) ÷ 2 = 14.17%, shown 14% | |

## 7. Cycles and check-ins

| Action | Who | From | To | Rules |
|---|---|---|---|---|
| Create cycle | Admin | | planning | Dates must not overlap another cycle |
| Activate | Admin | planning | active | Only one active cycle at a time |
| Add or edit objectives and key results | Admin, team lead, objective owner | planning or active | | In an active cycle, changing a start or target needs a reason (R5) |
| Check in | See section 4 | active | | A new value, a confidence and a comment; updates current and confidence |
| Close | Admin | active | closed | Records final progress and scores (R7) and offers carry-forward |
| Reopen | Admin | closed | active | Only the most recently closed cycle, with a reason; final scores are cleared |

Closed cycles are read-only: check-ins and edits are refused with "Q3 2026 is closed."

## 8. Business rules

- **R1. Objectives** have 1 to 5 key results. A team has at most 5 objectives per cycle, and the company at most 5.
- **R2. Key results** need a title, an owner who is active, and a target different from the start. Percent values are between 0 and 100; currency is in the company's currency.
- **R3. Progress and pace** are calculated as in section 6, the same way on every screen, in emails and in the export.
- **R4. Check-ins** are append-only. Each one sets the key result's current value, confidence and last_check_in_at. Check-ins in a closed cycle are refused.
- **R5. Moving targets.** Once a cycle is active, changing a key result's start or target requires a reason (5 to 300 characters), writes a TargetChange, and is shown on the key result: "Target changed from 12% to 11% on Oct 20 by Priya Rao: price change made 12% unrealistic."
- **R6. Alignment.** A team objective may align to one company objective in the same cycle. Deleting a company objective that has aligned team objectives is refused.
- **R7. Closing.** Closing a cycle sets each key result's final_progress_bp to its progress at that moment and each objective's final_score to the average, shown as a score from 0.0 to 1.0 with one decimal (68.75% is 0.7). For each key result under 100%, the admin may carry it forward: it is copied into the next cycle (created if needed, starting the day after) under a copy of its objective, with start set to its final value and the same target.
- **R8. Reminders.** At reminder_time on reminder_day, each person who owns a key result in the active cycle that has had no check-in for 7 days or more gets one email listing those key results. The job is safe to run twice.
- **R9. Friday summary.** At summary_time on summary_day, admins and team leads get one email: overall progress, key results behind pace, key results at risk or off track, and key results not checked in for 7 days.
- **R10. Events.** Every change writes an event; check-ins, target changes and events are never edited or deleted.

## 9. Screens

1. **OKRs** (home). Cycle switcher, elapsed time ("Day 15 of 92"), company objectives with progress bars and their key results, then each team's objectives, each showing the company objective it supports. Every key result shows progress, pace, confidence, owner and last check-in.
2. **My check-ins.** Key results I can check in, oldest check-in first, flagged "Not checked in for 9 days" after 7 days, each with a Check in button.
3. **Check-in form.** New value (or Done for milestones), confidence, comment, with the progress and pace the new value would give.
4. **Key result page.** Details, target changes, check-in history with comments, and a weekly chart of progress against the expected pace line.
5. **Objective editor** with key results (metric, unit, direction, start, target, owner) and alignment.
6. **Alignment view.** Each company objective with the team objectives under it, and team objectives that support none.
7. **Cycles** (admin): create, activate, close with carry-forward choices, reopen. **People and teams** (admin), **Settings**, **Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Reminder day and time (R8) | Owners with key results not checked in for 7 days | "2 key results need a check-in" |
| Summary day and time (R9) | Admins and team leads | "Q4 2026, day 16 of 92: 1 key result behind pace, 2 at risk" |
| Target changed (R5) | The objective owner and the team lead | "Target changed: Trial-to-paid conversion (12% to 11%)" |
| Cycle closed | Everyone active | "Q4 2026 closed: final scores" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A job (protected by a CRON_SECRET header) runs hourly and sends what is due in the company time zone. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so pace, reminders and summaries can be tested by moving the clock.

## 12. Export

A CSV per cycle, one row per key result: cycle, level, team, objective, key result, owner, metric, unit, direction, start, target, current, progress %, pace, confidence, last check-in date, final progress % (closed cycles).

## 13. Edge cases

- A key result's owner is deactivated: it stays, and an admin or the team lead reassigns it; reminders go to the objective owner until then.
- A check-in value beyond the target: progress shows 100% and "Exceeded".
- A check-in value worse than the start: progress shows 0%.
- Elapsed before the cycle starts is 0%, and after it ends 100%.
- A decrease key result whose target is above its start, or an increase key result whose target is below its start, is refused: "For lower is better, the target must be below the start."
- Changing a key result's metric after check-ins exist is refused; create a new key result.

## 14. Seed data

Company Fernway, subscription software, time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@fernway.example): Nora Quinn (admin, CEO), Ben Ortiz (Sales lead), Mia Chen (Sales), Priya Rao (Product lead), Leo Park (Product), Sam Lee (Support lead).

Teams: Sales (lead Ben), Product (lead Priya), Support (lead Sam).

Cycles: Q3 2026 (closed), and Q4 2026 (active), which started 14 days ago and has 92 days, so today is day 15.

Q4 2026 objectives:

| Objective | Level, owner, aligned to | Key result | Owner | Start → target | Current | Confidence |
|---|---|---|---|---|---|---|
| Grow revenue from self-serve customers | Company, Nora | Increase trial-to-paid conversion from 8% to 12% | Priya | 8% → 12% | 9% | On track |
| | | Grow self-serve MRR from $40,000 to $55,000 | Ben | $40,000 → $55,000 | $40,500 | At risk |
| Keep customers longer | Company, Nora | Reduce monthly logo churn from 3.0% to 2.0% | Sam | 3.0% → 2.0% | 2.8% | On track |
| | | Raise NPS from 32 to 40 | Priya | 32 → 40 | 36 | On track |
| Build a partner channel | Sales, Ben, supports "Grow revenue..." | Sign 10 new partners | Mia | 0 → 10 partners | 3 | On track |
| | | Launch the partner program page | Ben | milestone | not done | At risk |
| Make the trial easier to start | Product, Priya, supports "Grow revenue..." | Cut median time to first invoice from 20 to 5 minutes | Leo | 20 → 5 minutes | 14 | On track |
| | | Ship the guided setup checklist | Leo | milestone | done | On track |
| Answer customers faster | Support, Sam, supports "Keep customers longer" | Reduce median first response time from 6 to 2 hours | Sam | 6 → 2 hours | 4.5 | On track |
| | | Publish 20 help articles | Sam | 0 → 20 articles | 20 | On track |

Resulting objective progress: Grow revenue 14%, Keep customers longer 35%, Build a partner channel 15%, Make the trial easier to start 70%, Answer customers faster 69%.

Check-ins: every Q4 key result has two or three check-ins; the latest is 1 or 2 days ago for all of them except the partner program page (9 days ago) and help articles (8 days ago).

Q3 2026 (closed): company objective "Launch self-serve checkout" (Nora) with "Ship checkout to all plans" (milestone, done, 100%) and "Reach 200 self-serve signups a month" (0 → 200, final 120, 60%); final score 0.8.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the OKR Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build People and teams, Settings, the Objective editor and the OKRs home page (section 9, screens 1, 5 and 7) with R1 to R3 and R6, enforcing section 4's permissions on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The OKRs page for Q4 2026 shows "Day 15 of 92", "Grow revenue from self-serve customers" at 14% and "Keep customers longer" at 35%, each with its two key results.
- [ ] Team objectives show Build a partner channel at 15%, Make the trial easier to start at 70% and Answer customers faster at 69%, each naming the company objective it supports.
- [ ] Median first response time shows 38% and Ahead, Self-serve MRR shows 3% and Behind, Publish 20 help articles shows Done, and the partner program page shows no pace.
- [ ] Signed in as Mia, there is no way to edit the company objectives or Product's objective, and a direct edit request is refused; signed in as Nora, editing works.
- [ ] Adding a sixth key result to an objective is refused, and so is a key result whose target equals its start or a lower-is-better key result whose target is above its start.

### Phase 2: Check-ins and target changes

```
Using the OKR Tracker blueprint above, build Phase 2 only.

1. Build My check-ins, the Check-in form and the Key result page (section 9, screens 2 to 4) with R4 and R5.
2. Add the target-changed email (section 10) to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Ben, My check-ins lists Self-serve MRR and the partner program page, with the page flagged "Not checked in for 9 days".
- [ ] Ben checks in Self-serve MRR at $47,000, At risk, with a comment: it shows 47% and Ahead, the objective shows 36%, and the key result's history lists the new check-in with his comment.
- [ ] Signed in as Mia, checking in Self-serve MRR is refused, both in the screen and as a direct request.
- [ ] Priya changes the conversion target from 12% to 11%: she must give a reason, the key result shows "Target changed from 12% to 11%" with her reason, progress becomes 33%, and Nora gets an email.
- [ ] Ben marks the partner program page done: it shows 100% and Done, and Build a partner channel becomes 65%.

### Phase 3: Reminders, summary and closing cycles

```
Using the OKR Tracker blueprint above, build Phase 3 only.

1. Build the hourly job with the reminders (R8) and the Friday summary (R9).
2. Build Cycles (section 9, screen 7) with activate, close with carry-forward (R7) and reopen, and make closed cycles read-only.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Moving the clock to Monday 09:00 and running the job emails Ben about the partner program page and Sam about the help articles, one email each and nobody else; running the job again sends nothing more.
- [ ] Moving the clock to Friday 16:00 and running the job emails Nora, Ben, Priya and Sam one summary each that lists Self-serve MRR as behind pace and at risk.
- [ ] Nora closes Q4 2026: Answer customers faster scores 0.7, every key result keeps its final progress, and carrying forward "Sign 10 new partners" creates it in Q1 2027 with a start of 3 and a target of 10.
- [ ] After closing, a check-in on a Q4 key result is refused with "Q4 2026 is closed."
- [ ] Switching to Q3 2026 shows "Launch self-serve checkout" with a final score of 0.8.

### Phase 4: Alignment, charts and export

```
Using the OKR Tracker blueprint above, build Phase 4 only.

1. Build the Alignment view (section 9, screen 6) and the weekly progress chart on the Key result page.
2. Build the CSV export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The alignment view shows Build a partner channel and Make the trial easier to start under "Grow revenue from self-serve customers", and Answer customers faster under "Keep customers longer".
- [ ] Self-serve MRR's chart shows its check-ins as weekly points and a straight expected-pace line from 0% at the start to 100% at the end of the cycle.
- [ ] The Q4 2026 export has one row per key result (10 rows) with progress, pace, confidence and last check-in, using the same numbers as the OKRs page.
- [ ] Deleting "Keep customers longer" is refused because Answer customers faster is aligned to it.

## 16. Variations

- Private objectives visible only to chosen people.
- Individual OKRs under team objectives.
- Roll team progress up into the company objective it supports, with weights.
- KPIs that are tracked continuously, outside cycles.
- Update a key result automatically from a spreadsheet or your database every night.
- A Slack message with the Friday summary.
