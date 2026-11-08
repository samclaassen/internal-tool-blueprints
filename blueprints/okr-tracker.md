<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/okr-tracker . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

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
- People type values with up to 2 decimals; "$", "%" and thousands commas are accepted and ignored, and more decimals are refused, not rounded. Number and currency values may be negative; percent values are 0 to 100, in key results and in check-ins alike. Values are shown with up to 2 decimals and no trailing zeros (3.0% shows as 3%), currency with cents only when they are not zero, and numbers with their unit. Key result titles are free text and do not change when a target changes.
- One currency for the company (Settings.currency, default USD), used by every currency key result.
- Limits: names up to 100 characters, objective and key result titles up to 200, descriptions up to 2,000, units up to 30.
- Sign-in is limited to the company's email domain (Settings.email_domain). Emails are compared trimmed and lowercase. Deactivating a person ends their sessions at once; they then see "Ask an admin to add you."
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Founders, people or operations leads | Everything: settings, people, teams, cycles, company objectives, any objective or key result, closing cycles. |
| Team lead | One per team | Create and edit their team's objectives and key results; check in any of their team's key results. |
| Member | Everyone else | See everything; check in key results they own; edit objectives they own. |

Who may check in a key result: its owner, the owner of its objective, the lead of that objective's team, or an admin. The same people may change its start and target (R5); its other fields (title, owner, metric, unit, direction) are edited by an admin, the team lead or the objective owner.

- **Creating objectives:** company objectives by admins only; a team's objectives by admins and that team's lead. Members create none.
- **Objective owners** edit their objective's title, description, alignment and key results. Only an admin or the team lead changes its owner or deletes it. An objective's level and team can't change after it is created.
- **Owners:** any active person may own an objective or a key result, whatever their team.
- **Admin-only screens:** People and teams, Settings, Cycles and Outbox (others get "Not allowed"). The OKRs page, every key result page, the Alignment view and the CSV export are open to everyone signed in.
- **Admins:** an admin can't deactivate themselves, and the last active admin can't be demoted or deactivated.
- **Teams:** at most one lead each, who need not be a member of the team; a team may have no lead, and one person may lead several teams. Team names are unique ignoring case. A team can be deleted only when it has no people and no objectives.

The server enforces every rule here.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, email_domain, currency (default USD), time_zone, reminder_day (default Monday), reminder_time (default 09:00), summary_day (default Friday), summary_time (default 16:00).

**Person**: id, name, email (unique, lowercase), role: admin | member, team_id (optional), active.

**Team**: id, name (unique), lead_id.

**Cycle**: id, name (such as "Q4 2026"), starts_on, ends_on, status: planning | active | closed, closed_at, closed_by.

**Objective**: id, cycle_id, level: company | team, team_id (team level only), title, description, owner_id, aligned_to_id (team objectives only: a company objective in the same cycle, optional), position (order within its company or team list), final_score_bp (set at close, in basis points: 6875 shows as 0.7), carried_from_id.

**KeyResult**
- id, objective_id, title, owner_id, metric: number | percent | currency | milestone, unit (such as "hours" or "partners"; optional for numbers, since NPS has none; empty for percent, currency and milestones)
- direction: increase | decrease (milestones are always increase)
- start_x100, target_x100, current_x100 (milestones store 0 and 100 literally, current 0 or 100)
- confidence: on_track | at_risk | off_track (from the latest check-in; empty until the first), last_check_in_at, final_progress_bp (set at close), position, carried_from_id (the key result it was carried forward from)
- A new key result starts with current equal to start and no confidence.

**CheckIn** (append-only): id, key_result_id, at, by_id, value_x100, confidence, comment (required, 3 to 1,000 characters).

**TargetChange** (append-only): id, key_result_id, at, by_id, field: start | target, old_x100, new_x100, reason.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, created_at, kind, to_email, subject, body, status: queued | sent | failed | logged, sent_at, error.

Sign-in sessions and the development clock offset are kept outside this model.

## 6. Progress and pace

**Key result progress** = (current − start) ÷ (target − start), for both directions (a decrease has target below start, so the same formula works). Below 0 counts as 0; above 1 counts as 1 and the key result is marked "Exceeded". A milestone is 0% until done and 100% when done.

**Objective progress** is the plain average of its key results' exact progress. Alignment does not feed team progress into company objectives.

**Display**: whole percentages, rounded half up from the exact value (37.5% shows as 38%).

**Pace** compares progress with the share of the cycle that has passed: elapsed = days from the start through today ÷ days in the cycle. A key result is **Ahead** if progress is at least elapsed + 10 points, **Behind** if progress is below elapsed − 10 points, otherwise **On pace**. Milestones have no pace. Progress of exactly 100% shows **Done** instead; 99.6% shows as 100% and still has a pace.

**Days** are calendar days in the company time zone, both for elapsed time and for "not checked in for N days" (from the date of the latest check-in to today). Before a cycle starts it shows "Not started" (day 0); after it ends, "Ended: day 92 of 92". A key result with no check-in yet shows "Never checked in", has no confidence, counts as not checked in since the cycle's start date and comes first in My check-ins.

**Closed cycles** show final progress and final scores on every screen, and the pace column reads "Cycle closed".

**Overall progress** (in the Friday summary) is the plain average of the exact progress of every objective in the cycle, company and team.

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
| Create cycle | Admin | | planning | Dates must not overlap another cycle (touching dates are fine); the name is required, unique ignoring case, up to 50 characters; the end is after the start |
| Activate | Admin | planning | active | Only one active cycle at a time |
| Add or edit objectives and key results | Admin, team lead, objective owner | planning or active | | In an active cycle, changing a start or target needs a reason (R5) |
| Check in | See section 4 | active | | A new value, a confidence and a comment; updates current and confidence. In a planning cycle it is refused: "Q1 2027 is not active yet." |
| Close | Admin | active | closed | Records final progress and scores (R7) and offers carry-forward |
| Reopen | Admin | closed | active | Only the most recently closed cycle, with a reason of 5 to 300 characters stored in the event, and only while no other cycle is active; final scores are cleared and copies already carried forward stay |

Cycles can't be edited or deleted in v1. Closed cycles are read-only: check-ins and edits are refused with "Q3 2026 is closed."

## 8. Business rules

- **R1. Objectives** have 1 to 5 key results. A team has at most 5 objectives per cycle, and the company at most 5. An objective is created together with its first key result, and deleting its last key result is refused. Objectives and key results can be deleted (subject to R6); their check-ins, target changes and events stay.
- **R2. Key results** need a title, an owner who is active, and a target different from the start. Percent values are between 0 and 100; currency is in the company's currency.
- **R3. Progress and pace** are calculated as in section 6, the same way on every screen, in emails and in the export.
- **R4. Check-ins** are append-only. Each one sets the key result's current value, confidence and last_check_in_at. Check-ins in a closed cycle are refused.
- **R5. Moving targets.** Once a cycle is active, changing a key result's start or target requires a reason (5 to 300 characters, counted after trimming), writes a TargetChange, and is shown on the key result: "Target changed from 12% to 11% on Oct 20 by Priya Rao: price change made 12% unrealistic." In a planning cycle the start and target change freely, with no reason, record or email. A milestone's start and target can't be changed.
- **R6. Alignment.** A team objective may align to one company objective in the same cycle. Deleting a company objective that has aligned team objectives is refused.
- **R7. Closing.** Closing a cycle sets each key result's final_progress_bp to its progress at that moment and each objective's final_score_bp to the exact average, shown as a score from 0.0 to 1.0 with one decimal, rounded half up (68.75% is 0.7). For each key result under 100%, the admin may carry it forward: it is copied into the next cycle (created if needed, starting the day after) under a copy of its objective, with start set to its final value and the same target.
  - Carry-forward is chosen on the close screen only, one checkbox per key result under 100%, all unticked to start.
  - The next cycle is the first cycle that starts after this one ends. If there is none and something is carried, it is created in planning, named for the next quarter ("Q4 2026" is followed by "Q1 2027") and three calendar months long.
  - The objective copy keeps level, team, title, description and owner and sets carried_from_id; a team copy aligns to the copy of its company objective only if that one was carried too. If the owner is inactive, the closing admin owns the copy.
  - The key result copy keeps title, metric, unit, direction and owner (the copy objective's owner if the owner is inactive), sets carried_from_id, and starts with current equal to start, no confidence and no check-ins.
  - If a copy would break R1 in the next cycle, the whole close is refused with a message and nothing changes. Closing again after a reopen skips key results already carried.
- **R8. Reminders.** At reminder_time on reminder_day, each person who owns a key result in the active cycle that has had no check-in for 7 days or more (including key results already at 100%) gets one email listing those key results. For an inactive owner, the email goes to the objective owner, or to the team lead if that person is inactive too. A job is due from its set time until the end of that day in the company time zone, with no catch-up on later days, and each job runs at most once per date, so running it twice is safe. With no active cycle, nothing is sent.
- **R9. Friday summary.** At summary_time on summary_day, admins and team leads get one email each (one per person, even if they are both): overall progress, key results behind pace, key results at risk or off track, and key results not checked in for 7 days. In the subject, "N at risk" counts only At risk; ", N off track" is added when any key result is off track.
- **R10. Events.** Every change writes an event; check-ins, target changes and events are never edited or deleted.

## 9. Screens

1. **OKRs** (home). Cycle switcher, elapsed time ("Day 15 of 92"), company objectives with progress bars and their key results, then each team's objectives, each showing the company objective it supports. Every key result shows progress, pace, confidence, owner and last check-in.
2. **My check-ins.** Key results I can check in (as their owner, the objective owner, the team lead or an admin), oldest check-in first, flagged "Not checked in for 9 days" after 7 days, each with a Check in button.
3. **Check-in form.** New value (or Done and Not done for milestones; a done milestone can be set back), confidence (no default, so it is chosen each time), comment (trimmed before its length is checked), with the progress and pace the new value would give.
4. **Key result page.** Details, target changes, check-in history with comments, and a weekly chart of progress against the expected pace line. The chart has one point per week of the cycle (days 1 to 7, 8 to 14, and so on, the last week ending on the cycle's last day): the value of the latest check-in on or before the week's last day, carried forward through weeks with none and the start value before the first, using the start and target in effect at that time. The week in progress is shown "so far", and points stop at today, the cycle's end or the close. Milestones are charted at 0% or 100%. The expected pace line runs straight from 0% at the start to 100% at the end.
5. **Objective editor** with key results (metric, unit, direction, start, target, owner) and alignment.
6. **Alignment view.** For any cycle (with a cycle switcher), each company objective with the team objectives under it and their own progress, and team objectives that support none. It is read-only; alignment is changed in the objective editor.
7. **Cycles** (admin): create, activate, close with carry-forward choices, reopen. **People and teams** (admin), **Settings**, **Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Reminder day and time (R8) | Owners with key results not checked in for 7 days | "2 key results need a check-in" |
| Summary day and time (R9) | Admins and team leads | "Q4 2026, day 16 of 92: 1 key result behind pace, 2 at risk" (Friday, October 16 in the seed) |
| Target changed (R5) | The objective owner and the team lead (company objectives have no team lead), each once, never the person who made the change; inactive people are skipped | "Target changed: Increase trial-to-paid conversion from 8% to 12% (12% to 11%)", using the key result's full title; a start-only change uses "Start changed: …", and a change to both uses the target subject with both changes in the body |
| Cycle closed | Everyone active | "Q4 2026 closed: final scores", listing each objective's score, each key result's final progress and what was carried forward. Activating or reopening a cycle sends nothing. |

Write every email to the outbox first, then send it. An email caused by an action is sent right after the action is saved. The email provider is optional and set by configuration; with no provider configured, set status logged. Failed emails stay failed in the Outbox; there is no automatic retry in v1. The hourly job is POST /jobs/hourly with the secret in an X-Cron-Secret header (with no CRON_SECRET set, every call is refused); it sends the reminders and the summary when they are due in the company time zone. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so pace, reminders and summaries can be tested by moving the clock.

## 12. Export

A CSV per cycle, one row per key result: cycle, level, team, objective, key result, owner, metric, unit, direction, start, target, current, progress %, pace, confidence, last check-in date, final progress % (closed cycles).

- Rows follow the OKRs page: company objectives, then each team's, with key results in their order.
- Level, metric and direction are the stored values (company, percent, decrease); pace and confidence are the labels on screen (On pace, At risk). Start, target and current are plain numbers without $, %, units or separators (40000, 8.5); milestones read Done or Not done. Progress % and final progress % are whole numbers rounded half up, without a % sign. Dates are YYYY-MM-DD in the company time zone. Fields with no value (team for company objectives, confidence and last check-in before any check-in, final progress % in open cycles) are blank.
- In a closed cycle, progress % is the final progress and pace reads "Cycle closed".
- The file is UTF-8 with a byte order mark, and text starting with =, +, - or @ gets a leading apostrophe so spreadsheets don't run it as a formula.

## 13. Edge cases

- A key result's owner is deactivated: it stays, and an admin or the team lead reassigns it; reminders go to the objective owner until then.
- A check-in value beyond the target: progress shows 100% and "Exceeded".
- A check-in value worse than the start: progress shows 0%.
- Elapsed before the cycle starts is 0%, and after it ends 100%.
- A decrease key result whose target is above its start, or an increase key result whose target is below its start, is refused: "For lower is better, the target must be below the start."
- Changing a key result's metric after check-ins exist is refused; create a new key result.

## 14. Seed data

Company Fernway, subscription software, email domain fernway.example, currency USD, time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026. Add a development setting that pins the seed's "today" to Thursday, October 15, 2026, 09:00 company time, so the checks' "Monday" is October 19 and their "Friday" October 23; without it, the Phase 3 checks hold only when the next Monday is 4 days away or less. Reset to seed data also sets the development clock back to the seed's "today".

People (emails firstname@fernway.example): Nora Quinn (admin, CEO; no team, and the title is not stored), Ben Ortiz (Sales lead), Mia Chen (Sales), Priya Rao (Product lead), Leo Park (Product), Sam Lee (Support lead).

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

Check-ins: every Q4 key result has two or three check-ins; the latest is 1 or 2 days ago for all of them except the partner program page (9 days ago) and help articles (8 days ago). Each is by the key result's owner at 10:00 company time with a one-line comment; earlier check-ins step from the start toward the current value, and the latest equals the Current column and its confidence.

Q3 2026 (closed): the 92 days before Q4, closed by Nora at 09:00 on Q4's first day. Company objective "Launch self-serve checkout" (Nora) with "Ship checkout to all plans" (Priya, milestone, done, 100%) and "Reach 200 self-serve signups a month" (Ben, 0 → 200, final 120, 60%); final score 0.8.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the OKR Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build People and teams, Settings, the Objective editor and the OKRs home page (section 9, screens 1, 5 and 7) with R1 to R3 and R6, enforcing section 4's permissions on the server. Until Phase 2 adds R5, refuse start and target changes in an active cycle with a message.
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
- [ ] Signed in as Ben, My check-ins lists Self-serve MRR, the partner program page and Sign 10 new partners (he owns its objective), with only the page flagged "Not checked in for 9 days".
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

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser. Each phase's checks started from a fresh load of the seed and ran in order on the same data, as the build plan says; the seed loaded relative to the real date, so the Phase 3 checks set the development clock to the next Monday at 09:00 and the next Friday at 16:00. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Emails were read on the Outbox screen, the hourly job was run from the development "Run hourly job now" button and once through its endpoint, the chart was read from its weekly points, and the CSV was downloaded and parsed.

**Result:** 19 of 19 acceptance checks passed in one final browser run on a fresh database, plus 136 automated tests. The item-by-item results are in [acceptance-results.json](/builds/okr-tracker/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. The seed loads relative to today, but the Phase 3 checks move the clock to "Monday 09:00" and "Friday 16:00", which only works when the next Monday is at most 4 days away; from a Tuesday every key result would be a week old by then. Section 14 now asks for a development setting that pins the seed's "today" to Thursday, October 15, 2026, so the checks' Monday is October 19 and their Friday October 23.
2. Nothing said whether reset to seed data also resets the development clock, though Phase 3 moves it. Reset now sets the clock back to the seed's "today".
3. "Two or three check-ins" per key result came with no values, authors, times or comments. Each is by the owner at 10:00 company time with a one-line comment, stepping from the start toward the current value.
4. The closed Q3 cycle had no dates, no closer and no key result owners. It is the 92 days before Q4, closed by Nora at 09:00 on Q4's first day, with Priya and Ben owning its two key results.
5. Nora is "admin, CEO" with no team, and Person has no title field. She has no team, and the title is not stored.
6. Sign-in was "limited to our company email domain", but Settings had no domain. Settings now has email_domain (fernway.example in the seed), and emails are compared trimmed and lowercase.
7. Sign-in sessions and the development clock offset had nowhere to live. Section 5 now says they are kept outside the data model.
8. Nothing said what happens to a deactivated person who is still signed in. Their sessions end at once, and they see "Ask an admin to add you."
9. An admin could deactivate themselves or demote the last admin, locking everyone out. Both are now refused.
10. Teams had a lead but no rules: whether the lead must be a member, whether one person can lead several teams, a team with no lead, or deleting a team. Section 4 now covers each, and team names are unique ignoring case.
11. Section 4 didn't say who can open People and teams, Settings and Cycles. They are admin-only, and others see "Not allowed".
12. The Outbox screen had no stated audience. It is admin-only.
13. The Alignment view and the CSV export had no permission rule. Everyone signed in can use them, since section 3 says everyone sees everything.
14. No role was named as able to create objectives. Company objectives are created by admins and a team's by admins and that team's lead; members create none.
15. "Edit objectives they own" didn't say whether an owner can change the owner, add key results or delete the objective. Owners edit the title, description, alignment and key results; only an admin or the team lead changes the owner or deletes it.
16. Nothing said who may own an objective or a key result. Any active person, whatever their team.
17. Nothing said whether an objective's level or team can change. They can't after it is created.
18. A Phase 2 check has Priya change the target of a key result on Nora's company objective, but section 4 gave editing only to admins, team leads and objective owners. Whoever may check in a key result may now also change its start and target; its other fields stay with an admin, the lead and the objective owner.
19. My check-ins lists "key results I can check in", which for Ben includes Sign 10 new partners because he owns its objective, while the Phase 2 check named only his own two. Screen 2 now says whose key results it lists, and the check names all three.
20. Currency key results were "in the company's currency", with no currency setting. Settings now has currency, default USD.
21. Objectives had no position, so their order on the OKRs page was undefined. Objective now has position.
22. final_score had no stored unit. It is final_score_bp in basis points, shown from 0.0 to 1.0 rounded half up.
23. "Milestones: 0 and 100" sat among fields stored in hundredths, so 100 could mean 1. Milestones store 0 and 100 literally.
24. Values are stored in hundredths, but nothing said how people type them: decimals, "$" and "%", negative numbers. Section 3 now says, and more than 2 decimals is refused, not rounded.
25. Titles say "3.0% to 2.0%", but nothing said how values are displayed or whether titles follow target changes. Values show up to 2 decimals without trailing zeros, and titles are free text that never changes by itself.
26. A unit was described "such as hours or partners", but NPS has none. A unit is optional for numbers.
27. There were no length limits for names, titles, descriptions or units. Section 3 now has them.
28. "Progress of 100% shows Done" didn't say whether that is the rounded or the exact value. Done needs exactly 100%; 99.6% shows 100% and still has a pace.
29. Elapsed time before and after a cycle had no display. It shows "Not started" (day 0) and "Ended: day 92 of 92".
30. "Not checked in for 7 days" and elapsed days didn't say whether they count calendar days or 24-hour periods, or in which time zone. Both count calendar days in the company time zone.
31. A key result with no check-in had no confidence, no "last check-in" and no rule for reminders. It shows "Never checked in", counts from the cycle's start and comes first in My check-ins, and a new key result starts with current equal to start.
32. Nothing said what a closed cycle shows for progress and pace. Every screen shows final progress and scores, and pace reads "Cycle closed".
33. The Friday summary includes "overall progress", which was never defined. It is the plain average of every objective's exact progress in the cycle, company and team.
34. The Outbox needs a time for each email, but Notification had no created or sent time. It now has created_at and sent_at.
35. Phase 1 builds the objective editor for an active cycle, but R5's reason and record only arrive in Phase 2. The Phase 1 prompt now refuses start and target changes in an active cycle until then.
36. R1 requires 1 to 5 key results without saying how an objective is created or whether its last key result can be deleted. It is created with its first key result, and deleting the last one is refused.
37. Nothing said whether objectives and key results can be deleted or what happens to their check-ins. They can, subject to R6, and their check-ins, target changes and events stay.
38. Check-ins were allowed only in active cycles, with no message for a planning cycle. They are refused with "Q1 2027 is not active yet."
39. R2's 0-to-100 limit for percent values didn't say whether check-ins follow it. They do; other values may pass the target or fall below the start.
40. The check-in form had no default confidence and no rule for spaces around the 3-character comment. Confidence is chosen each time, and the comment is trimmed before it is counted.
41. Milestone check-ins offered only "Done". They are Done or Not done, and a done milestone can be set back.
42. R5 applies "once a cycle is active" but didn't say what a change in a planning cycle records or emails. Nothing: the start and target change freely.
43. Nothing said whether a milestone's start and target can change. They can't.
44. R5 covers starts and targets, but section 10 had only a "Target changed" email. A start-only change uses "Start changed: …", and a change to both uses the target subject with both changes in the body.
45. The email went to "the objective owner and the team lead", but company objectives have no team lead, and the person who made the change might be either. Each gets it once, never the person who made the change, and inactive people are skipped.
46. The subject example used the short name "Trial-to-paid conversion", while the seed's title is "Increase trial-to-paid conversion from 8% to 12%". The subject uses the full title, as the example now shows.
47. Section 10 said an hourly job "sends what is due" without saying whether emails caused by an action wait for it. They are sent right after the action is saved; the job sends reminders and the summary.
48. No email provider was named, and nothing said whether failed emails are retried. The provider is optional configuration, and failed emails stay failed in the Outbox in v1.
49. The job was "protected by a CRON_SECRET header" with no endpoint, header name or rule for an unset secret. It is POST /jobs/hourly with an X-Cron-Secret header, and with no secret set every call is refused.
50. "At reminder_time on reminder_day" didn't say how long a job stays due, whether a missed one catches up, or what happens with no active cycle. A job is due from its time until the end of that day, never catches up, and sends nothing without an active cycle.
51. "Safe to run twice" wasn't defined. Each job runs at most once per date.
52. R8 reminds owners whose key results need a check-in, but the Phase 3 check expects Sam's reminder about the help articles, already at 20 of 20. R8 now says key results at 100% are included.
53. Section 13 sends an inactive owner's reminders to the objective owner, but not what happens if that person is inactive too. Then the team lead gets them.
54. The summary subject counts "2 at risk" without saying whether off-track key results count, and an admin who is also a lead could get two summaries. "At risk" counts only At risk, ", N off track" is added when any exist, and each person gets one email.
55. R7 creates the next cycle "if needed" with no name, length or status. It is named for the next quarter ("Q1 2027"), runs three calendar months and starts in planning.
56. "The next cycle" was undefined when a later cycle exists with a gap, or when nothing is carried. It is the first cycle that starts after this one ends, and one is created only if something is carried.
57. Carry-forward had no screen and no default. It is chosen on the close screen, one unticked checkbox per key result under 100%.
58. The copied objective's fields, owner and alignment weren't given. It keeps level, team, title, description and owner (the closing admin if the owner is inactive), and a team copy aligns only to a carried copy of its company objective.
59. The copied key result's current value, confidence and owner weren't given. It starts with current equal to start, no confidence and no check-ins, and keeps its owner unless they are inactive.
60. Closing again after a reopen could carry the same key result twice, and a key result had no link to the one it came from. KeyResult now has carried_from_id, and a second close skips key results already carried.
61. Carrying forward could push the next cycle past R1's limit of 5. The whole close is then refused with a message.
62. Reopening needed "a reason" with no length or storage, and nothing said what happens to copies already carried or while another cycle is active. The reason is 5 to 300 characters stored in the event, copies stay, and reopening is refused while another cycle is active.
63. Creating a cycle had no rules for names, an end before the start, touching dates, or editing and deleting cycles. Section 7 now covers each, and cycles can't be edited or deleted in v1.
64. The cycle-closed email had a subject but no body, and nothing said whether activating or reopening a cycle emails anyone. It lists the scores, final progress and what was carried; activating and reopening send nothing.
65. "A weekly chart of progress" didn't say what a weekly point is when a week has no check-in, one or several. Each point is the latest check-in on or before the week's last day, carried forward, with the current week shown "so far".
66. After a target change, nothing said which start and target the chart's earlier points use. They use the ones in effect at the time.
67. Milestones have no pace, and nothing said how the chart draws them. They are charted at 0% or 100%.
68. The Alignment view had no way to pick a cycle and no rule for editing. It has a cycle switcher, shows each objective's own progress, and alignment is changed in the objective editor.
69. The CSV listed its columns but gave no formats for values, percentages, labels or dates. Section 12 now gives each: plain numbers, whole percentages without a % sign, on-screen labels and YYYY-MM-DD dates.
70. The CSV had no encoding and no guard against text starting with "=". It is UTF-8 with a byte order mark, and such text gets a leading apostrophe.
71. A closed cycle's export had both "progress %" and "final progress %" with no rule between them. Progress is the final progress, and pace reads "Cycle closed".
72. The export's row order wasn't given. Rows follow the OKRs page.

**What we did not test:**
- Production sign-in: every check used the development "sign in as" switcher, and Google sign-in limited to the company domain was not built.
- Real email delivery: every email was logged in the outbox; no email provider was configured.
- A real scheduler: the hourly job's endpoint was called directly and from the development button, never by cron.
- Hosting: the checks ran on localhost with SQLite.
- The development setting that pins the seed's "today" (gap 1) is a fix the test build doesn't have; the checks ran against the real date.
- Phones beyond one 390-pixel Chromium viewport.
- Spec fixes that no check covers, such as reopening a cycle, inactive owners, R1 limits when carrying forward and the CSV formula guard.
