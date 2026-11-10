<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/async-standups . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Async Standups

Blueprint BP-035 · Department: Ops · Replaces: Geekbot (async standups in Slack and Teams), the daily standup call, status-update threads
For teams of 4 to 40 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 16 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Our daily standup takes 30 minutes, and half the team is in another time zone."

The call is at 09:30 in New York, which is mid-afternoon in London and late evening in Bengaluru. Half the team joins tired or not at all, people repeat what they said yesterday, and the one blocker that mattered is buried in a 30-minute recording nobody watches. When someone is on holiday, nobody can tell whether they skipped the update or were away.

This blueprint replaces the call with a written check-in. Each person is asked the same few questions at 09:30 in their own time zone, answers in a minute or two, and the team reads the updates when it suits them. Blockers are tracked until someone resolves them, out-of-office days are never counted as missed, and a manager can see who keeps missing updates.

## 2. What the real product does

Research basis: Geekbot's home, standups and pricing pages (geekbot.com, geekbot.com/standups, geekbot.com/pricing) and help center articles (help.geekbot.com/en/articles/4153311-reporting-guidelines-how-do-i-report, /7241740-schedule-configuration, /7241749-questions-intro-outro-configuration, /7241787-broadcast-configuration, /4153902-how-to-enable-engagement-summaries-for-your-standups, /4311783-how-to-personalize-your-standup-settings, /4153854-can-i-edit-my-answers, /4311732-how-do-i-schedule-out-of-office-with-geekbot, /10496052-participation-reminders, /4153205-how-to-schedule-an-email-summary, /10495780-a-quick-dive-into-geekbot-insights, /14007711-geekbot-features), October 2026.

What we verified:

1. **Where it runs.** Geekbot runs standups, polls and surveys inside Slack and Microsoft Teams. At the scheduled time it sends each participant a direct message with the first question; when they finish, it posts the complete update to the standup's broadcast channel. People can also type `report` to the bot to answer later.
2. **Schedules and time zones.** A standup admin picks the days (from daily to the first or last week of each month), the time and the time zone, and can send each person their questions in their own local time zone, or only when they come online. If the admin turns on "Personalize", participants can set their own time and time zone.
3. **Questions.** One fixed question per slot or a random one from a list; answers as plain text, a number or a predefined choice; "prompts" that show a participant their previous answer; questions scheduled only on some days; intro and outro messages with variables. The pricing page lists 25+ templates.
4. **Broadcast.** Reports go to one or more channels, optionally as threaded replies in Slack. "Anonymize replies" makes every answer anonymous and cannot be reverted. An engagement summary posts who has reported, who hasn't and who is out of office, with the participation percentage, team sentiment and the number of blockers.
5. **Reminders, edits and out of office.** Participants choose how often they are reminded. From the dashboard's participation view, people who haven't reported can be reminded, at most once every five hours per person. Reports can be edited after submitting, and the edit updates the channel and the dashboard. Participants set out-of-office periods with a command; prompts stop and they don't appear as non-respondents.
6. **Insights.** Participation by day and by person (the "report rate" is the share of assigned reporting days on which the person reported), blockers sorted by AI into categories such as Dependencies and Technical, team happiness from AI sentiment analysis, answer summaries, streak leaderboards, and out-of-office history. Each person can schedule a daily or weekly email summary per standup.
7. **Beyond standups.** Geekbot AI (ask questions about the team's reports), an API, an MCP server and a CLI for AI agents, CSV exports, and polls and surveys.
8. **Pricing** (geekbot.com/pricing). Starter is free for up to 10 users, with unlimited standups and, per the comparison table, up to 3 months of reporting history. Basic costs $3 per participant per month, or $2.50 billed annually, counting only people included in standups and adjusted daily; polls and surveys are $1 per respondent per month ($0.75 annually). Basic has a 30-day free trial and its listed features include reports in a thread, engagement summaries, anonymous reporting, API access, Geekbot AI and CSV exports. Enterprise is priced through sales and adds volume discounts, Jira, Google Calendar and Asana integration, a dedicated database instance and custom security assessments.

### What this blueprint keeps

Standups with custom questions (text, choice and a blocker question), check-ins at a set time in each person's own time zone or at one fixed time for everyone, a prompt and one reminder by email, the previous answer shown on the form, late updates accepted until the end of the person's day, edits until then, out-of-office periods that are never counted as missed, a daily feed per standup, a daily summary by email and to a Slack channel, blockers tracked until resolved, manager nudges, private standups, pausing, participation per person and team, and CSV export.

### What this blueprint deliberately leaves out

Answering inside Slack or Teams (v1 prompts by email and people answer in the web app; Slack only receives posts), threaded replies, syncing participants with a channel, personal prompt times, random and day-specific questions, numeric answers, intro and outro messages, anonymous reports, AI summaries, AI blocker categories and sentiment, streaks and leaderboards, templates, polls and surveys, the API, MCP server and CLI, and Jira, calendar and Asana integrations. If your team wants to answer without leaving Slack or Teams, Geekbot is free for teams of up to 10 and $2.50 to $3 per participant per month on Basic, which is hard to beat.

## 3. Scope of v1

- One company with any number of standups. A standup is a recurring written check-in for a group: a daily standup, a weekly leadership update.
- Each standup asks the same 1 to 8 questions on its chosen weekdays. Check-ins open at the prompt time in each member's own time zone (timing "local") or at one time in one zone for everyone (timing "fixed").
- Prompts, reminders, nudges and summaries go out by email through an outbox. People answer in the web app, which works on a phone.
- A standup can post each new report and its daily summary to one Slack channel through an incoming webhook. Slack is post-only in v1.
- All timestamps are stored in UTC. Each person has an IANA time zone (for example Europe/London); each standup has one too, used for fixed timing and for its summary.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | One or more people | Everything below for every standup, including members-only ones. Manage people in Admin → People. Create standups. Read the outbox. |
| Manager | Members with "manager" ticked on a standup | For that standup: edit settings, questions and members, pause and resume, nudge, resolve any of its blockers, see Insights, export. |
| Reporter | Members with "reports" ticked | Get check-ins, answer and edit their own, resolve their own blockers. |
| Reader | Every active person | Read the feed and blockers of standups with visibility "team". Members-only standups exist only for their members and admins (R2). |

A person can hold several roles. Nobody answers a check-in for someone else, admins and managers included (R5). Every person manages their own time zone and out-of-office periods in My settings.

## 5. Data model

All timestamps are UTC. Report dates and out-of-office dates are calendar dates (`YYYY-MM-DD`, no time, no zone). All IDs are strings (UUID or similar). Times of day are `HH:MM`, 24-hour.

**Person**
- id, name (required, 1 to 80), email (required, unique, stored lowercase)
- time_zone (required IANA name, default America/New_York)
- is_admin (boolean, default false), active (boolean, default true), created_at

**Standup**
- id, name (required, 1 to 60, unique ignoring case)
- status: active | paused (a new standup is saved as active); paused_at (nullable)
- visibility: team | members
- timing: local | fixed; time_zone (required IANA name; the zone for fixed timing and for the summary)
- days (list of ISO weekdays, 1 = Monday to 7 = Sunday, at least one)
- prompt_time, due_time (`HH:MM`; R3)
- reminder_minutes (nullable integer, 15 to 480; empty means no reminder)
- summary_time (nullable `HH:MM` in time_zone; empty means no summary)
- slack_webhook_url (nullable secret; never shown in full after saving, never exported)
- created_by, created_at

**Question**
- id, standup_id, position (integer), text (required, 1 to 200)
- kind: text | choice | blocker
- required (boolean; always true for blocker)
- options (list of 2 to 6 different strings of 1 to 40 characters; choice only)
- archived_at (nullable; archived questions leave new forms, their answers stay)

**Member** (a person's place in a standup)
- id, standup_id, person_id; unique (standup_id, person_id)
- reports (boolean; gets check-ins), is_manager (boolean), email_summary (boolean)
- joined_at (timestamp; set when added or re-added), removed_at (nullable)

**CheckIn** (one member, one standup, one report date)
- id, standup_id, person_id, report_date; unique (standup_id, person_id, report_date)
- schedule_zone (the IANA zone used, copied at creation)
- prompt_at, due_at, closes_at (timestamps, computed once at creation, section 6)
- status: open | on_time | late | missed | away
- prompted_at (when the prompt was queued; empty for away), reminded_at, nudged_at, nudged_by (nullable)
- submitted_at (first submission), edited_at (last edit), created_at

**Answer**
- id, check_in_id, question_id; unique (check_in_id, question_id)
- question_text (copied when saved), kind (copied)
- text (nullable, max 2,000; for a blocker question, the answer text from section 8), choice (nullable)
- blocker_action (blocker questions only): none | blocked | still_blocked | unblocked | blocked_other
- blocker_text (nullable; the new blocker's description for blocked and blocked_other)

**Blocker**
- id, standup_id, person_id, text (1 to 500)
- opened_check_in_id, opened_on (report date), opened_at (timestamp), last_reported_on (report date)
- status: open | resolved; at most one open blocker per (standup_id, person_id)
- resolved_at, resolved_by (Person), resolved_check_in_id (when resolved from a report), resolution_note (optional, max 300)

**OutOfOffice**
- id, person_id, start_date, end_date (inclusive report dates), note (optional, max 100), created_at

**Notification** (outbox)
- id, channel: email | slack; kind: prompt | reminder | nudge | report_post | blocker_opened | blocker_resolved | summary
- standup_id, person_id (nullable for Slack), to (an email address, or "Slack: <standup name>"), check_in_id (nullable)
- subject, body (plain text), status: queued | sent | logged | failed
- attempts (integer, default 0; each send attempt adds 1), last_error (nullable), created_at, sent_at

**SummaryRun**
- id, standup_id, report_date, created_at; unique (standup_id, report_date)

## 6. Schedules and time zones

**Schedule zone.** For a member of a standup with timing local, the schedule zone is the member's Person.time_zone. With timing fixed, it is Standup.time_zone. A report date is a calendar date in the schedule zone whose weekday is in Standup.days.

**The three instants of a check-in** for report date D, converted to UTC with the time zone database for that date:
- prompt_at: D at prompt_time
- due_at: D at due_time
- closes_at: D plus one day, at 00:00

Never convert by adding a fixed offset or multiples of 24 hours. If a local time does not exist on that date (clocks jump forward), move it forward by the length of the gap (02:30 becomes 03:30); if it happens twice (clocks go back), use the first. The values are stored on the check-in and never recalculated, so later changes to the standup or the person's time zone affect new check-ins only.

**Creating check-ins** (only the scheduled job does this, section 13). A member gets a check-in for report date D when all of these hold:
1. The standup is active, the member has reports ticked and is not removed, and the person is active.
2. D is today's date in the member's schedule zone and is one of the standup's days.
3. prompt_at ≤ now < closes_at, and prompt_at is later than the member's joined_at.
4. No check-in exists for that standup, person and D.

If an out-of-office period of the person covers D, the check-in is created as away and no prompt is sent. Otherwise it is open, prompted_at is set to now and a prompt is queued (section 12). Only today's date is considered: a day on which the job never ran inside the window gets no check-in and is not counted anywhere.

**Next check-in** (shown in the schedule preview and on Today). For each member who reports: the first report date D, starting with today in their schedule zone and looking ahead at most 60 days, that has no check-in yet, whose closes_at is later than now, whose prompt_at is later than joined_at, and that no out-of-office period covers. When dates were skipped because of out-of-office, also show "Away until <end date of that period>". With no date in 60 days, show "None in the next 60 days". For a paused standup, show "Paused".

### Worked examples (seed data in section 15)

Product daily is local, Mon to Fri, prompt 09:30, due 12:00. Leadership weekly is fixed in America/New_York, Mondays, prompt 08:00, due 10:00.

| Member (schedule zone) | Report date | Prompt (UTC) | Due (UTC) | Closes (UTC) | Why |
|---|---|---|---|---|---|
| Priya Nair (Asia/Kolkata) | Wed 14 Oct | Wed 04:00 | Wed 06:30 | Wed 18:30 | UTC+5:30, no clock changes |
| Maya Chen (Europe/London) | Wed 14 Oct | Wed 08:30 | Wed 11:00 | Wed 23:00 | British Summer Time, UTC+1 |
| Sam Okafor (America/New_York) | Wed 14 Oct | Wed 13:30 | Wed 16:00 | Thu 04:00 | UTC-4 |
| Lee Park (America/Los_Angeles) | Wed 14 Oct | Wed 16:30 | Wed 19:00 | Thu 07:00 | UTC-7 |
| Maya Chen (Europe/London) | Mon 26 Oct | Mon 09:30 | Mon 12:00 | Tue 00:00 | UK clocks went back on Sun 25 Oct |
| Sam Okafor (America/New_York) | Mon 26 Oct | Mon 13:30 | Mon 16:00 | Tue 04:00 | US clocks change a week later |
| Sam Okafor (America/New_York) | Mon 2 Nov | Mon 14:30 | Mon 17:00 | Tue 05:00 | UTC-5 from Sun 1 Nov |
| Maya Chen in Leadership weekly (fixed, America/New_York) | Mon 19 Oct | Mon 12:00 | Mon 14:00 | Tue 04:00 | 13:00 in London |
| Maya Chen in Leadership weekly | Mon 26 Oct | Mon 12:00 | Mon 14:00 | Tue 04:00 | 12:00 in London that week |

From Mon 26 to Fri 30 Oct 2026 London is four hours ahead of New York instead of five. Code that stores one offset per person gets that week wrong.

## 7. Check-ins and reports

### Check-in status transitions

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Scheduled job | (none) | open, or away (section 6) | Prompt queued for open check-ins |
| Submit | The check-in's person (R5) | open, before closes_at | on_time or late (R7) | Answers saved; blocker changes (section 8); Slack post when a webhook is saved |
| Edit | The check-in's person | on_time, late, before closes_at | unchanged | Answers replaced except the blocker answer (R9); edited_at set |
| Remind | Scheduled job | open | open | reminded_at set; reminder queued |
| Nudge | A manager or admin (R14) | open | open | nudged_at and nudged_by set; nudge queued |
| Out of office saved | The person (R12) | open, not submitted | away | None |
| Close | Scheduled job | open, closes_at ≤ now | missed | None |
| Member removed or deactivated | Manager, admin (R4, R13) | open | deleted | None |

Missed and away are final. On-time and late check-ins can be edited until closes_at, then they are final too. Screens treat an open check-in whose closes_at has passed as missed until the job records it, and the server refuses to accept answers for it.

### The form

The form shows the standup's active questions in position order. Under each one: "Last time (Tue 13 Oct): …" with the person's answer to the same question in their most recent submitted check-in in this standup with an earlier report date. Text questions take 1 to 2,000 characters, trimmed, kept as plain text with line breaks. Choice questions show their options as buttons; an optional one can be left empty. The blocker question works as section 8 describes.

Saving writes one Answer per question on the form, including empty ones for skipped optional questions, and copies the question's text and kind. Questions added to the standup while a check-in is open appear on its form; archived ones disappear from it.

### Day status

The feed and the summary describe a report date D of one standup with one function. For each member who reports (and each removed member who has a submitted check-in for D):
- **Reported:** their check-in for D is on_time or late.
- **Away:** their check-in is away, or there is no check-in and an out-of-office period covers D.
- **Missed:** their check-in is missed, or open with closes_at in the past.
- **Waiting:** their check-in is open with closes_at in the future, or there is no check-in and closes_at for D is in the future.

Members with no check-in for D are not listed when D's closes_at has passed (that day isn't counted, section 6), when their joined_at is not before D's prompt_at, or when the standup is paused. "X of Y reported" counts Reported as X and Reported + Waiting + Missed as Y. Reported people are listed by submitted_at, then name; the other lists by name.

## 8. Blockers

The blocker question's answer depends on whether the person has an open blocker in this standup:
- **No open blocker:** "No blockers", or "I'm blocked" with a description of 1 to 500 characters.
- **An open blocker:** the form shows "Still blocked: <text> (since <opened_on>)" and offers "Still blocked", "Unblocked" or "Blocked by something else" with a new description.

On submit, in the same transaction as the answers:

| Answer | blocker_action | Effect | Answer text shown and exported |
|---|---|---|---|
| No blockers | none | Nothing | "No blockers" |
| I'm blocked | blocked | New open Blocker: opened_on = report date, opened_at = submitted_at, last_reported_on = report date. Managers are told (section 12) | "Blocked: <text>" |
| Still blocked | still_blocked | last_reported_on = report date | "Still blocked: <text>" |
| Unblocked | unblocked | The blocker is resolved: resolved_at = submitted_at, resolved_by = the person, resolved_check_in_id set | "Unblocked: <old text>" |
| Blocked by something else | blocked_other | The old blocker is resolved as for Unblocked and a new one opened as for I'm blocked | "Unblocked: <old text>. Blocked: <new text>" |

Open blockers are listed oldest first: by opened_on, then opened_at, then person name, as "Jo Park · Product daily · Need staging database access from Ana · since Tue 13 Oct", followed by " · last reported Wed 14 Oct" when last_reported_on is later than opened_on. Resolved blockers from the last 30 days are listed by resolved_at, newest first: "Resolved by Sam Okafor on Tue 13 Oct: Raised the plan limit" (the note is left out when empty; the date is resolved_at in the viewer's time zone). Resolving outside a report is covered by R11. A blocker stays open when its person leaves the standup or is deactivated, until someone resolves it.

## 9. Business rules

- **R1. Server checks.** Every permission is enforced on the server for every action and API call. Hiding a button is not a permission check. Refusals for standup-level permissions use the standup's name: "Only managers of Product daily and admins can change this standup.", "Only managers of Product daily and admins can see insights.", "Only managers of Product daily and admins can export reports."
- **R2. Visibility.** A standup with visibility team can be read by every active person. A members-only standup can be read only by its members (any flags, not removed) and admins. For anyone else it does not exist: its pages and API calls return "Not found", and it is left out of the Standups list, Today, the Blockers page and its count.
- **R3. Standup settings.** Name unique ignoring case: "A standup with this name already exists." At least one day: "Pick at least one day." A time zone from the IANA list: "Pick a time zone from the list." Prompt and due times between 04:00 and 22:00: "Prompt and due times must be between 04:00 and 22:00." Due later than prompt: "The due time must be later than the prompt time." A reminder must land before the due time (prompt_time plus reminder_minutes earlier than due_time): "The reminder must come before the due time." 1 to 8 active questions: "A standup needs 1 to 8 questions." At most one active blocker question: "A standup can have only one blocker question." Choice options: "Choice questions need 2 to 6 different options." A question that has answers can't change its kind: "Archive this question and add a new one instead."
- **R4. Members.** Managers and admins add and remove members and set their flags in Standup settings. Adding or re-adding sets joined_at to now and clears removed_at; the first check-in follows the rule in section 6, so someone added after today's prompt starts tomorrow. Removing sets removed_at and deletes the member's open check-ins that have no submission; unticking reports deletes them the same way. Their submitted reports and their blockers stay.
- **R5. Who answers.** Only the check-in's person submits or edits it: "Only Ben Cho can answer this check-in." Submitting twice (for example a double click) is refused: "You already submitted this check-in. Use Edit to change it."
- **R6. The answer window.** Answers are accepted while prompt_at ≤ now < closes_at. With no open check-in, Today shows the next check-in instead: "Your next Product daily check-in opens Wed 14 Oct at 09:30 (America/Los_Angeles)." (date and time in the schedule zone). After closes_at: "This check-in closed at 00:00 on Thu 15 Oct (Europe/London). Missed check-ins can't be filled in later." An away check-in has no form: "You're out of office on Wed 14 Oct, so there's nothing to answer."
- **R7. On time or late.** The first submission decides the status: on_time when submitted_at ≤ due_at, late otherwise. Edits never change it.
- **R8. Required answers.** A required text question needs at least one character after trimming and a required choice or blocker question needs an option. The refusal names the first unanswered required question in position order: "Answer "What will you do today?" before submitting." "I'm blocked" and "Blocked by something else" need a description: "Describe the blocker in 1 to 500 characters." Nothing is saved when any answer is refused.
- **R9. Editing.** The person can edit until closes_at; after that: "This check-in closed at 00:00 on Thu 15 Oct (Europe/London). Reports can't be changed after that." The blocker answer is read-only on the edit form; to clear a blocker, resolve it (R11). Edits set edited_at, show "edited" next to the report, and are not posted to Slack again.
- **R10. One open blocker.** A person has at most one open blocker per standup, enforced with a unique key. If the open blocker was resolved after the form was loaded, submitting "Still blocked", "Unblocked" or "Blocked by something else" is refused, and so is resolving it a second time: "This blocker was already resolved by Sam Okafor. Reload to see the change."
- **R11. Resolving blockers.** From the Blockers page or the feed, a blocker can be resolved by its person, a manager of its standup or an admin, with an optional note of up to 300 characters. Anyone else: "Only Sam Okafor, a manager of Product daily or an admin can resolve this blocker." When someone other than the blocked person resolves it, the blocked person is told (section 12). A resolved blocker can't be reopened; the person reports a new one.
- **R12. Out of office.** Each person adds and deletes their own periods in My settings. The start can't be before today in their own time zone ("Out-of-office can't start before today."), the end can't be before the start ("The end date is before the start date."), a period is at most 90 days ("Out-of-office can be at most 90 days."), and periods can't overlap: "Overlaps your out-of-office Mon 12 – Fri 16 Oct." A period applies to every standup the person reports in. Saving one turns each open, unsubmitted check-in whose report date it covers into away. Deleting a period never changes check-ins that already exist.
- **R13. People.** Admins add, edit, deactivate and reactivate people in Admin → People. Each person can change their own time zone in My settings. Deactivating someone blocks their sign-in and removes them from every standup as in R4; reactivating does not add them back. There must always be at least one active admin: "At least one active admin is needed."
- **R14. Nudges.** A manager or admin can nudge a person whose check-in is open, once per check-in: "Jo Park was already nudged at 12:35." (the time of nudged_at in the viewer's zone). With no open check-in: "Lee Park has no open check-in to nudge."
- **R15. Pause.** A paused standup gets no new check-ins, reminders or summaries. Open check-ins stay open and can still be answered and nudged, and close as usual. Resuming clears paused_at; check-ins follow section 6 from the next job run. Standups can't be deleted in v1; pause one you no longer use.
- **R16. Display.** Dates: "Wed 14 Oct", with the year added when it isn't the current year. Times: 24-hour "09:30". Times on Today, the feed, the Blockers page and the outbox are in the viewer's own time zone without a label; the feed adds the date when it differs from the report date shown. In messages about a check-in's schedule, times are in the schedule zone followed by the zone name in parentheses. Ranges use an en dash with spaces: "Mon 12 – Fri 16 Oct", "Fri 30 Oct – Mon 2 Nov". Day lists: consecutive runs as "Mon–Fri", otherwise "Mon, Wed, Fri".
- **R17. Notifications never block.** Every notification is written to the outbox in the same transaction as its action and sent after it commits. A failed send never blocks or undoes the action.
- **R18. Reading never writes.** Opening a page or calling a read API never creates check-ins, blockers or any other row, and never changes a status. Only the scheduled job creates check-ins and marks them missed.

## 10. Participation

For one standup, a range of report dates (from and to, inclusive, at most 92 days) and one person:
- reported = their on_time + late check-ins in the range
- counted = reported + missed, where open check-ins whose closes_at has passed count as missed
- Away check-ins and open check-ins still inside their window are not counted. Dates with no check-in are not counted.
- rate = reported ÷ counted as a whole percentage, rounded half up. With integer counts: floor((200 × reported + counted) ÷ (2 × counted)). With counted 0, show "–".

The team row adds up reported and counted across people first and then divides; it never averages personal percentages. Insights lists every person with at least one check-in in the range, including removed members (marked "Removed"), with On time, Late, Missed, Away and Reported ("6 of 7 (86%)"). The default range is the 14 calendar days that end yesterday in the standup's time zone.

### Worked example (Product daily, default range Wed 30 Sep – Tue 13 Oct, seed data)

| Person | On time | Late | Missed | Away | Reported |
|---|---|---|---|---|---|
| Sam Okafor | 7 | 0 | 0 | 0 | 7 of 7 (100%) |
| Ben Cho | 5 | 1 | 1 | 0 | 6 of 7 (86%) |
| Lee Park | 5 | 2 | 0 | 0 | 7 of 7 (100%) |
| Maya Chen | 6 | 1 | 0 | 0 | 7 of 7 (100%) |
| Jo Park | 3 | 1 | 3 | 0 | 4 of 7 (57%) |
| Priya Nair | 6 | 1 | 0 | 0 | 7 of 7 (100%) |
| Tom Bennett | 4 | 0 | 1 | 2 | 4 of 5 (80%) |
| Team | 36 | 6 | 5 | 2 | 42 of 47 (89%) |

Tom's two away days are not counted against him. With the range Mon 5 – Wed 14 Oct on the seed clock, Wednesday adds on-time reports for Sam, Maya and Priya and an away day for Tom; Jo's and Ben's open check-ins are not counted yet, so the team reads 45 of 50 (90%).

## 11. Screens

Navigation: Today, Standups, Blockers, My settings, Admin (admins). Admin pages show "Admins only" to everyone else, and the server refuses their actions.

1. **Today** (home). For each standup the signed-in person reports in: an open check-in as a card, "Product daily · Wed 14 Oct · due 12:00 (Europe/London)", with a Post update button and, once now is past due_at, "Past due: your update will be marked late."; a submitted one that can still be edited as "Posted 10:05 · On time · Edit"; otherwise the next check-in line from R6, or "Product daily is paused.". When an out-of-office period covers today in their zone, also "You're out of office until Fri 16 Oct." With no standups: "You're not in any standup yet."
2. **Check-in form.** The questions as section 7 describes, the blocker options from section 8, and Submit. The same form, with the blocker answer read-only, is used for Edit.
3. **Standups.** The standups the person can see (R2): name, schedule ("Mon–Fri at 09:30, each person's time" for local timing, "Mon at 08:00 America/New_York" for fixed), visibility, Active or Paused, and the person's role. Admins get New standup.
4. **Standup feed.** One report date at a time (default: today in the standup's time zone) with previous and next buttons. Header "5 of 6 reported" (section 7). Reported: each report with the person's name, the submission time (R16), "Late" and "edited" when they apply, and the answers, skipping empty optional ones. Then Waiting, Missed and Away as name lists; managers and admins see Nudge next to each waiting person with an open check-in. Then the standup's open blockers with Resolve where R11 allows.
5. **Blockers.** "3 open blockers" and the open blockers of every standup the person can see, in the order and format of section 8, with Resolve (and an optional note) where R11 allows. A Resolved tab shows the last 30 days.
6. **Standup settings.** Name, visibility, timing, time zone, days, prompt, due, reminder and summary times, the Slack webhook (shown as "Saved, ending in …" plus the last 4 characters, with Remove), questions (add, edit, reorder, archive), members (add, remove, and the reports, manager and email summary flags) and the **schedule preview**: one row per member who reports with name, time zone, next report date, prompt and due in their own time, and prompt in UTC (section 6). Pause and Resume. Everyone who can see the standup can open this page; only managers and admins can change it (R1).
7. **Insights** (managers and admins). A date range (section 10), the per-person table and the team row, and Export CSV.
8. **Export.** "Reports CSV" for the standup and range, named after the standup in lowercase with spaces as hyphens (`product-daily-2026-10-13-to-2026-10-14.csv`): one row per answer, ordered by report date, person name and question position; a check-in with no answers (open, missed or away) gets one row with question and answer empty. Columns: standup, report_date, person, email, schedule_zone, status, prompt_at, due_at, submitted_at, edited_at, question, answer. Dates are `YYYY-MM-DD`, timestamps UTC ISO 8601 (`2026-10-14T13:50:00Z`), status is the stored value (on_time, late, missed, away, open), blocker answers use the text in section 8, missing values are empty, and fields with commas, quotes or line breaks are quoted.
9. **My settings.** The person's time zone, an email summary toggle for each standup they belong to, and their out-of-office periods with Add and Delete (R12).
10. **Admin → People.** Name, email, time zone, admin, active. Add, edit, deactivate, reactivate (R13).
11. **Admin → Outbox.** Every notification, newest first: time, channel, recipient, kind, subject, status, attempts and last error. Click a row to read the body.

All screens must work on a phone. Text people type is always shown as text, never as HTML.

## 12. Notifications and Slack

| Trigger | Recipient | Channel | Subject or first line (seed example) |
|---|---|---|---|
| Check-in created as open | The person | Email | "Product daily for Wed 14 Oct: post your update by 12:00 (America/Los_Angeles)" |
| Reminder (section 13) | The person | Email | "Reminder: Product daily for Wed 14 Oct is due at 12:00 (America/New_York)" |
| Nudge (R14) | The person | Email | "Sam Okafor is waiting for your Product daily update for Wed 14 Oct" |
| Report submitted (not edits), webhook saved | The standup's channel | Slack | "Maya Chen posted Product daily for Thu 15 Oct (late)", "(late)" only when late |
| Blocker opened (blocked, blocked_other) | The standup's active managers, except the reporter | Email | "New blocker in Product daily: Maya Chen" |
| Blocker resolved by someone else (R11) | The blocked person | Email | "Sam Okafor resolved your blocker in Product daily" |
| Daily summary (section 13) | Active members with email_summary ticked who are not out of office on that date | Email | "Product daily, Wed 14 Oct: 3 of 6 reported" |
| Daily summary, webhook saved | The standup's channel | Slack | The same subject as its first line |

Prompt, reminder and nudge emails link to the check-in form; a prompt includes "Still blocked? <text>" when the person has an open blocker. A report post lists each question with its answer, skipping empty optional ones. The blocker emails include the blocker's text and the resolution note.

**Summary body** (seed example, built at 13:05 New York time on Wed 14 Oct):

```
Product daily, Wed 14 Oct: 3 of 6 reported
Reported: Priya Nair, Maya Chen, Sam Okafor
Waiting: Ben Cho, Jo Park, Lee Park
Away: Tom Bennett
Open blockers:
- Jo Park (since Tue 13 Oct): Need staging database access from Ana
- Sam Okafor (since Wed 14 Oct): Waiting on Apple review for the 4.2 build

Then each report, as in the feed.
```

Lines with nobody in them are left out. The summary uses the day status from section 7 at the moment the job builds it.

**Sending.** Each row starts queued. Email can use any provider; if none is configured, set status logged instead of sending. If sending fails, set failed and last_error; every attempt adds 1 to attempts, and the job retries until attempts reaches 5.

**Slack incoming webhook.** Setup, once per standup, by a manager: create a Slack app at api.slack.com/apps, turn on Incoming Webhooks, click Add New Webhook to Workspace, pick the channel and authorize, then paste the URL into Standup settings. The URL must start with `https://hooks.slack.com/services/`, otherwise: "Use a Slack incoming webhook URL that starts with https://hooks.slack.com/services/." The URL contains a secret: store it server-side only, never show it in full again and never put it in exports or logs. To post, send an HTTP POST to the URL with `Content-Type: application/json` and the body `{"text": "<the post>"}`, with a 10-second timeout. HTTP 200 means sent; any other status or a network error means failed, with last_error set to the status code and the first 200 characters of the response, or the error. Slack posts the message as the app, in the channel chosen during setup, and the app does not try to change or delete posts later, so edits appear in the app only.

## 13. Scheduled job and time

**Clock.** Every server-side use of the current time goes through one now() function. "Today" for a person is the date of now() in their time zone; for a check-in, in its schedule zone; for a standup's summary and Insights, in the standup's time zone.

**Development toolbar** (development only; it must not exist or respond in production):
- Sign in as any person.
- The clock: shows "Now: Wed 14 Oct 2026, 14:00 UTC", can be set to any date and time in UTC, and has "+1 hour" and "+1 day". It is stored on the server and now() returns it.
- "Reset to seed data": deletes every row, loads section 15 and sets the clock to Wed 14 Oct 2026, 14:00 UTC.
- "Run scheduled job now" (Phase 3): runs the job below with the development clock.

**Scheduled job.** Runs every 5 minutes; any scheduler that can call a URL works. It is `GET` or `POST /api/cron/tick` with the header `Authorization: Bearer <CRON_SECRET>`, where CRON_SECRET is an environment variable. A missing or wrong header gets 401 "Unauthorized" and nothing runs. The steps run in this order, each in its own transaction:
1. **Close.** Open check-ins with closes_at ≤ now become missed.
2. **Create.** Create check-ins by the rule in section 6, queueing prompts.
3. **Remind.** For each open check-in of an active standup with reminder_minutes set: if reminded_at is empty, prompted_at is set, prompted_at plus reminder_minutes ≤ now and now < due_at, queue one reminder and set reminded_at to now. A check-in created late in its window may get no reminder.
4. **Summaries.** For each active standup with a summary_time: let D be today in the standup's time zone. If D is one of its days, now is at or after D at summary_time in that zone, and no SummaryRun exists for the standup and D, create the SummaryRun and queue the summary (section 12).
5. **Retry.** Send notifications that are queued or failed and have fewer than 5 attempts.

Running the job twice in a row, or two runs at once, creates nothing new: the unique keys on CheckIn and SummaryRun and the reminded_at field make each step safe to repeat. Nothing is caught up: if the job was down, the days it missed get no check-ins and no summary.

## 14. Edge cases

- Someone moves from London to New York at 23:30 London time on a Wednesday: their Wednesday check-in keeps its London instants. At the next run their date in New York is still Wednesday and a check-in already exists, so nothing is created twice.
- A standup's times or days change while check-ins are open: those check-ins keep their stored instants (section 6).
- A question is archived while someone is answering: submitting saves the answers to the questions still active; the archived question's earlier answers stay in the feed and the export.
- A manager removes a member who already reported today: the report stays listed under Reported (section 7).
- Someone sets out-of-office for today after reporting: the submitted check-in stays reported (R12 changes only unsubmitted ones).
- Everyone who reports is away: the summary is still sent, reading "0 of 0 reported", so people trust it to arrive.
- A Slack webhook is revoked in Slack: posts fail with an HTTP error, are retried up to 5 attempts and stay in the outbox as failed. Reports are not affected.
- Two people resolve the same blocker at once: the status check runs inside the transaction and the second gets the R10 message.
- Someone signs in whose email isn't in People, or who is inactive: "Ask an admin to add you."

## 15. Seed data

Company: Tidewater Apps, a mobile app studio with people in New York, Los Angeles, London and Bengaluru. Reset sets the clock to Wed 14 Oct 2026, 14:00 UTC: 10:00 in New York, 07:00 in Los Angeles, 15:00 in London and 19:30 in Kolkata. The dates are fixed, not relative to today, so every worked example and check gives the same answer.

| Person | Email | Role | Time zone | Admin |
|---|---|---|---|---|
| Dana Ruiz | dana@tidewater.example | Head of Product | America/New_York | yes |
| Ana Lima | ana@tidewater.example | Operations lead | America/New_York | yes |
| Sam Okafor | sam@tidewater.example | Engineering lead | America/New_York | no |
| Ben Cho | ben@tidewater.example | Engineer | America/New_York | no |
| Lee Park | lee@tidewater.example | Engineer | America/Los_Angeles | no |
| Maya Chen | maya@tidewater.example | Design lead | Europe/London | no |
| Jo Park | jo@tidewater.example | Engineer | Europe/London | no |
| Tom Bennett | tom@tidewater.example | QA engineer | Europe/London | no |
| Priya Nair | priya@tidewater.example | Engineer | Asia/Kolkata | no |

**Product daily:** active, visibility team, timing local, time zone America/New_York, Mon to Fri, prompt 09:30, due 12:00, reminder 90 minutes, summary 13:00, no Slack webhook. Questions: 1 "What did you get done since your last update?" (text, required); 2 "What will you do today?" (text, required); 3 "Anything blocking you?" (blocker); 4 "How's your workload?" (choice: Light, About right, Heavy; optional). Members: Dana Ruiz (manager and email summary, doesn't report); Sam Okafor (reports, manager); Tom Bennett (reports, email summary); Ben Cho, Lee Park, Maya Chen, Jo Park and Priya Nair (report).

**Leadership weekly:** active, visibility members, timing fixed, time zone America/New_York, Mondays, prompt 08:00, due 10:00, no reminder, summary 10:30, no Slack webhook. Questions: 1 "Top priority this week?" (text, required); 2 "Anything blocking you?" (blocker); 3 "Confidence in this month's plan?" (choice: High, Medium, Low; required). Members: Dana Ruiz (reports, manager, email summary), Sam Okafor and Maya Chen (report). Ana Lima is not a member.

Every member's joined_at is Thu 1 Oct 2026, 12:00 UTC. Tom Bennett has one out-of-office period, Mon 12 – Fri 16 Oct 2026, note "Family visit". The outbox is empty and there are no SummaryRuns.

**Check-ins before today.** Each has the instants from section 6 and prompted_at = prompt_at (none for away). On-time reports were submitted 45 minutes after prompt_at; late ones at 14:00 in the schedule zone (Product daily) or 11:00 New York time (Leadership weekly). Product daily check-ins that ended late or missed have reminded_at = prompted_at + 90 minutes. O = on time, L = late, M = missed, A = away.

| Product daily | Mon 5 | Tue 6 | Wed 7 | Thu 8 | Fri 9 | Mon 12 | Tue 13 |
|---|---|---|---|---|---|---|---|
| Sam Okafor | O | O | O | O | O | O | O |
| Ben Cho | O | L | O | O | M | O | O |
| Lee Park | O | O | O | L | O | L | O |
| Maya Chen | O | O | O | O | L | O | O |
| Jo Park | O | M | O | L | M | M | O |
| Priya Nair | O | O | L | O | O | O | O |
| Tom Bennett | O | O | M | O | O | A | A |

Leadership weekly: Mon 5 Oct, all three on time; Mon 12 Oct, Dana on time, Sam late, Maya missed.

Product daily reports not listed below answer "Worked on the 4.2 release.", "Continue the 4.2 release.", "No blockers" and "About right". Leadership weekly reports not listed answer "Ship the 4.2 release.", "No blockers" and "High".
- Ben Cho, Thu 8 Oct: "I'm blocked: Flaky checkout test on CI". Ben Cho, Mon 12 Oct: "Unblocked", which resolved it.
- Priya Nair, Mon 12 Oct: "I'm blocked: API rate limit on the maps provider"; Tue 13 Oct: "Still blocked". Sam Okafor resolved it on Tue 13 Oct at 15:00 UTC with the note "Raised the plan limit".
- Jo Park, Tue 13 Oct: "Fixed the login crash on Android 15", "Start the offline sync spike", "I'm blocked: Need staging database access from Ana", "Heavy". This blocker is open.
- Dana Ruiz, Leadership weekly, Mon 12 Oct: "I'm blocked: Waiting on the board to approve the 2027 hiring plan". This blocker is open.

**Today, Wed 14 Oct (Product daily):**
- Priya Nair: on time, submitted 05:10 UTC: "Shipped the map clustering fix", "Profile the map screen on low-end phones", "No blockers", "About right".
- Maya Chen: on time, submitted 09:05 UTC: "Finished the onboarding screens", "Review the settings redesign with Sam", "No blockers", "About right".
- Sam Okafor: on time, submitted 13:50 UTC: "Cut the 4.2 release candidate", "Submit 4.2 to the App Store", "I'm blocked: Waiting on Apple review for the 4.2 build", "Heavy". This blocker is open.
- Jo Park: open, prompted 08:30 UTC, reminded 10:00 UTC.
- Ben Cho: open, prompted 13:30 UTC, not reminded.
- Tom Bennett: away, created 08:30 UTC.
- Lee Park: no check-in yet (his prompt is at 16:30 UTC).

Open blockers after loading: Dana Ruiz (Leadership weekly, since Mon 12 Oct), Jo Park (since Tue 13 Oct) and Sam Okafor (since Wed 14 Oct).

## 16. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Async Standups blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Person, Standup, Question, Member, CheckIn, Answer, Blocker, OutOfOffice, Notification, SummaryRun) with a real database. Store every timestamp in UTC and every report date as a plain date.
2. Add sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin → People (section 11, screen 10), the Standups list and Standup settings (screens 3 and 6) with questions, members and the schedule preview from section 6. Leave out Pause, Resume and the Slack webhook field for now. Enforce R1 to R4 and R13 on the server.
4. Write the schedule calculation in section 6 as one pure server-side function (standup, schedule zone, report date in; prompt_at, due_at and closes_at out) with unit tests for every row of the worked-examples table.
5. Load the seed data from section 15 exactly, including the check-ins, answers, blockers and the out-of-office period, with one script that the reset button also runs.
6. Add the development toolbar from section 13: sign in as, the clock (every server-side read of the current time must use it) and "Reset to seed data". None of it may exist or respond in production.

Do not build answering, the feed or the scheduled job yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Ana, Admin → People lists 9 active people: Lee Park in America/Los_Angeles, Priya Nair in Asia/Kolkata, Maya Chen, Jo Park and Tom Bennett in Europe/London, and the other four in America/New_York, with Dana Ruiz and Ana Lima as admins.
- [ ] Signed in as Jo, Admin → People shows "Admins only" (also when opened by URL) and a direct request to save a person is refused.
- [ ] Signed in as Ben, Standups lists Product daily only, and opening Leadership weekly by URL shows "Not found". Signed in as Ana, who is not a member of it, both are listed.
- [ ] Signed in as Sam, the Product daily schedule preview lists 7 people and not Dana: Lee Park, Wed 14 Oct, 09:30, 16:30 UTC; Priya Nair, Thu 15 Oct, 09:30, 04:00 UTC; Maya Chen and Jo Park, Thu 15 Oct, 09:30, 08:30 UTC; Sam Okafor and Ben Cho, Thu 15 Oct, 09:30, 13:30 UTC; Tom Bennett, Mon 19 Oct, 09:30, 08:30 UTC, with "Away until Fri 16 Oct".
- [ ] Signed in as Ana, the Leadership weekly preview shows Dana Ruiz and Sam Okafor on Mon 19 Oct at 08:00, due 10:00 (America/New_York, 12:00 UTC), and Maya Chen on Mon 19 Oct at 13:00, due 15:00 (Europe/London, 12:00 UTC).
- [ ] Signed in as Sam, saving Product daily with due time 09:00 is refused with "The due time must be later than the prompt time.", adding a second blocker question with "A standup can have only one blocker question.", and a 180-minute reminder with "The reminder must come before the due time." Signed in as Ben, the settings page is read-only and a direct request to change it is refused with "Only managers of Product daily and admins can change this standup."
- [ ] Signed in as Ana, deactivating Tom Bennett removes him from Product daily's members and schedule preview, and signing in as Tom shows "Ask an admin to add you." Ana then removes Dana's admin flag, and removing her own is refused with "At least one active admin is needed."
- [ ] The development toolbar shows "Now: Wed 14 Oct 2026, 14:00 UTC", and "+1 hour" changes it to "Now: Wed 14 Oct 2026, 15:00 UTC". "Reset to seed data" sets it back to 14:00, makes Tom active and a Product daily member again, and makes Dana an admin again.

### Phase 2: Check-ins, reports and blockers

```
Using the Async Standups blueprint above, build Phase 2 only.

1. Build Today, the check-in form, the standup feed and the Blockers page (section 11, screens 1, 2, 4 and 5).
2. Implement Submit and Edit from section 7 with R5 to R10, the blocker effects in section 8, and resolving blockers with R11. Save each submission, its answers and its blocker changes in one transaction, and check the check-in's status inside it.
3. Implement the day status in section 7 as one server-side function used by the feed; the Phase 3 summary will reuse it. Screens treat an open check-in whose closes_at has passed as missed.
4. Enforce R2 on every read, including the Blockers page and its count, and R18 everywhere. Use the display formats in R16.

Do not write or send notifications yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (sign in as each person with the development toolbar)
- [ ] Signed in as Jo, Today shows "Product daily · Wed 14 Oct · due 12:00 (Europe/London)" and "Past due: your update will be marked late." The form shows "Last time (Tue 13 Oct): Start the offline sync spike" under "What will you do today?" and offers Still blocked, Unblocked and Blocked by something else for "Need staging database access from Ana (since Tue 13 Oct)". Submitting with only "What will you do today?" left empty is refused with: Answer "What will you do today?" before submitting.
- [ ] Jo submits "Finished the offline sync spike", "Start the sync conflict UI", "Still blocked" and "Heavy". Her report shows "Late", and the Blockers page shows her blocker with "since Tue 13 Oct · last reported Wed 14 Oct".
- [ ] Signed in as Sam, a direct request to submit Ben's open check-in is refused with "Only Ben Cho can answer this check-in." Signed in as Ben, he fills in the form with "I'm blocked: Need the empty cart design" and submits, and his report shows "On time".
- [ ] Signed in as Ben, the Blockers page reads "3 open blockers": Jo Park (since Tue 13 Oct), Sam Okafor (since Wed 14 Oct), Ben Cho (since Wed 14 Oct), in that order, with no Leadership weekly blocker. Signed in as Dana, it reads "4 open blockers", with Dana Ruiz's Leadership weekly blocker first.
- [ ] Signed in as Lee, Today shows "Your next Product daily check-in opens Wed 14 Oct at 09:30 (America/Los_Angeles)." and no form.
- [ ] Signed in as Ana, the Product daily feed for Wed 14 Oct reads "5 of 6 reported" and lists Priya Nair 01:10, Maya Chen 05:05, Sam Okafor 09:50, Ben Cho 10:00 and Jo Park 10:00 with "Late", then Waiting: Lee Park and Away: Tom Bennett.
- [ ] Signed in as Maya, she edits her answer to "What will you do today?" to "Review the settings redesign with Sam and Jo". The feed shows the new text with "edited", her report still reads "On time", and the blocker answer on the edit form is read-only.
- [ ] Signed in as Sam, he resolves Jo's blocker with the note "Ana granted access": it leaves the open list and the Resolved tab shows "Resolved by Sam Okafor on Wed 14 Oct: Ana granted access". Signed in as Ben, a direct request to resolve Sam's blocker is refused with "Only Sam Okafor, a manager of Product daily or an admin can resolve this blocker."
- [ ] Set the clock to Thu 15 Oct 2026, 00:30 UTC. Signed in as Maya, editing her Wednesday report is refused with "This check-in closed at 00:00 on Thu 15 Oct (Europe/London). Reports can't be changed after that."

### Phase 3: Scheduled job, out of office and notifications

```
Using the Async Standups blueprint above, build Phase 3 only.

1. Build the scheduled job in section 13 at /api/cron/tick with the Authorization header described there and its five steps in order. Add "Run scheduled job now" to the development toolbar; it runs the same job with the development clock.
2. Build My settings (section 11, screen 9) with out-of-office periods and R12, including turning open check-ins into away.
3. Write and send every notification in section 12 through the outbox, for the job and for the actions built in Phase 2, with R17. Email can use any provider we have; if none is configured, mark emails "logged". Add the Slack webhook field to Standup settings and post to it exactly as section 12 describes.
4. Add Nudge to the feed for managers and admins with R14, and build Admin → Outbox (screen 11).
5. Add unit tests for the check-in creation rule in section 6: each worked example, a run before prompt_at, a run after closes_at, and a second run that creates nothing.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (read the outbox in Admin → Outbox, signed in as Ana)
- [ ] A request to /api/cron/tick without the Authorization header gets 401. "Run scheduled job now" at the seed clock (Wed 14 Oct, 14:00 UTC) adds nothing to the outbox.
- [ ] Set the clock to 15:05 UTC and run the job. The outbox has one reminder, to Ben Cho: "Reminder: Product daily for Wed 14 Oct is due at 12:00 (America/New_York)", with status "logged". Running it again adds nothing.
- [ ] Set the clock to 16:35 UTC and run the job. Lee's Today shows his open check-in, and the outbox has one prompt to Lee Park: "Product daily for Wed 14 Oct: post your update by 12:00 (America/Los_Angeles)". Running it again adds no second prompt.
- [ ] Signed in as Sam, Nudge next to Jo Park on the feed adds "Sam Okafor is waiting for your Product daily update for Wed 14 Oct" to the outbox for Jo. A second Nudge is refused with "Jo Park was already nudged at 12:35."
- [ ] Set the clock to 17:05 UTC and run the job. The outbox has one summary email, to Dana Ruiz only (Tom Bennett is away), with the subject "Product daily, Wed 14 Oct: 3 of 6 reported" and the body lines "Waiting: Ben Cho, Jo Park, Lee Park" and "Away: Tom Bennett". Running it again adds no summary.
- [ ] Signed in as Lee, adding out-of-office Thu 15 – Fri 16 Oct saves. Signed in as Tom, adding Fri 16 – Mon 19 Oct is refused with "Overlaps your out-of-office Mon 12 – Fri 16 Oct."
- [ ] Set the clock to Thu 15 Oct 2026, 16:35 UTC and run the job. The outbox has new prompts for Thu 15 Oct to Priya Nair, Maya Chen, Jo Park, Sam Okafor and Ben Cho, and none to Lee Park or Tom Bennett. The Product daily feed for Thu 15 Oct lists Lee Park and Tom Bennett under Away, and the feed for Wed 14 Oct lists Ben Cho, Jo Park and Lee Park under Missed.
- [ ] Signed in as Ben, adding out-of-office for Thu 15 – Thu 15 Oct turns his open Thursday check-in into away: Today has no form for it, and the Thursday feed lists Ben Cho under Away.
- [ ] Signed in as Sam, saving the Slack webhook "http://example.com/hook" is refused with "Use a Slack incoming webhook URL that starts with https://hooks.slack.com/services/." Saving "https://hooks.slack.com/services/T0000/B0000/XXXXXXXXXXXX" shows "Saved, ending in XXXX". Maya then submits her Thursday check-in with "I'm blocked: Waiting for copy from marketing": the report is saved as Late, the outbox has a Slack row "Maya Chen posted Product daily for Thu 15 Oct (late)" with status failed, an error and 1 attempt, and emails "New blocker in Product daily: Maya Chen" to Dana Ruiz and Sam Okafor. Running the job again shows 2 attempts on the Slack row.

### Phase 4: Insights, export and pause

```
Using the Async Standups blueprint above, build Phase 4 only.

1. Build Insights (section 11, screen 7) with the participation calculation in section 10 as one pure server-side function, with unit tests for every row of the worked example and for a range with counted 0.
2. Add Export CSV (screen 8) exactly as specified. Only managers of the standup and admins can open Insights or export (R1).
3. Add Pause and Resume to Standup settings with R15, and show "Paused" in the schedule preview and "Product daily is paused." on Today.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Sam, Insights for Product daily opens on Wed 30 Sep – Tue 13 Oct and shows Sam Okafor 7 of 7 (100%), Ben Cho 6 of 7 (86%) with 1 late and 1 missed, Lee Park 7 of 7 (100%) with 2 late, Maya Chen 7 of 7 (100%), Jo Park 4 of 7 (57%) with 3 missed, Priya Nair 7 of 7 (100%), Tom Bennett 4 of 5 (80%) with 2 away, and the team row 42 of 47 (89%).
- [ ] Changing the range to Mon 5 – Wed 14 Oct shows Sam Okafor 8 of 8 (100%), Jo Park still 4 of 7 (57%), Ben Cho still 6 of 7 (86%) and the team row 45 of 50 (90%).
- [ ] Signed in as Ben, opening Product daily's Insights by URL shows "Only managers of Product daily and admins can see insights." and a direct export request is refused with "Only managers of Product daily and admins can export reports." Signed in as Sam, Leadership weekly's Insights shows the same refusal for Leadership weekly, because he is a member but not a manager.
- [ ] Signed in as Sam, Export CSV for Tue 13 – Wed 14 Oct downloads a file with a header and 40 rows. Sam's Wed 14 Oct row for "Anything blocking you?" reads status on_time, submitted_at 2026-10-14T13:50:00Z and answer "Blocked: Waiting on Apple review for the 4.2 build". Tom Bennett's two rows have status away and empty question and answer.
- [ ] Signed in as Sam, he pauses Product daily. Set the clock to 16:35 UTC and run the job: the outbox has no prompt to Lee Park and his Today shows "Product daily is paused.", while Jo can still submit her open Wednesday check-in. Sam resumes it and the job is run again: the outbox now has Lee's prompt for Wed 14 Oct.
- [ ] Set the clock to Mon 26 Oct 2026, 09:00 UTC and run the job. The only new Product daily prompt is to Priya Nair, for Mon 26 Oct; Maya Chen, Jo Park and Tom Bennett get none yet, because after the UK clocks went back their 09:30 is 09:30 UTC. At 09:35 UTC another run adds prompts to Maya Chen, Jo Park and Tom Bennett.

## 17. Variations

- Answer inside Slack: a bot that DMs the questions and takes replies (the Approval Workflow blueprint shows the Slack app pattern), or Microsoft Teams.
- Personal prompt times, so each person picks when they are asked.
- Company holidays that skip a day for everyone, by country.
- Random or day-specific questions and numeric answers.
- An anonymous team-health check-in with a minimum group size before results show.
- Linking blockers to tickets in your issue tracker.
- An AI summary of the day's reports, shown next to the reports, never instead of them.
