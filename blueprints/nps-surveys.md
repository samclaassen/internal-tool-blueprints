<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/nps-surveys . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# NPS Surveys

Blueprint BP-029 · Department: Support · Replaces: Delighted (discontinued), the yearly survey form, comments nobody reads
For teams of 2 to 100 people who want to hear from customers every few months.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We send an NPS survey once a year from a form tool, and nobody reads the comments."

A software company surveys its customers when someone remembers, from a generic form tool. The score goes into a slide, the comments sit in a spreadsheet, and unhappy customers who took the time to explain themselves never hear back. Some customers get surveyed three times in a month; others never.

This blueprint is a Net Promoter Score program: customers get a short email with the 0 to 10 question, answer with one click, and explain their score on the next page. Each customer is surveyed at most every 90 days. Every low score becomes a follow-up assigned to the account owner, comments are tagged into themes, and the score is reported by month and by segment.

## 2. What the real product does

Research basis: delighted.com, October 2026.

What we verified:

1. **Delighted is no longer available.** Its pricing page now reads "Thank you for your interest in Delighted. It's no longer available," and points to Qualtrics customer feedback software, which is sold through a demo.
2. **What that means for its customers.** Teams that ran their customer surveys in Delighted need somewhere else to run them.

The Qualtrics page lists far more than a survey tool: listening across channels, AI analysis, conversational follow-up questions and ticketing integrations, for enterprise customer experience programs.

### What this blueprint keeps

Customers imported from your CRM or billing system; NPS surveys by email with one-click scores; a follow-up question page; at most one survey per customer every 90 days, spread across days; unsubscribe; responses sorted into promoters, passives and detractors; a follow-up for every detractor, assigned to the account owner; tags and theme counts; NPS by month and by segment, with response rates; alerts and a weekly digest; CSV export.

### What this blueprint deliberately leaves out

In-app and SMS surveys, website pop-ups, CSAT and CES question types, AI theme detection and sentiment, multiple languages, integrations that create tickets automatically, and benchmarks against other companies.

## 3. Scope of v1

- One company, one survey ("How likely are you to recommend Tally to a friend or colleague?"), one follow-up question ("What's the main reason for your score?"), both editable in Settings.
- Customers are contacts with an email, a company, a plan and an account owner; contacts are imported by CSV.
- Email through an outbox. If no email provider is configured, emails are logged, not sent. A sending switch in Settings (off by default) keeps a new install from emailing customers.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Customer experience lead | Everything: settings, the sending switch, contacts and import, tags, every response and follow-up, reports, export. |
| Member | Account managers, support | Read every response and report; handle follow-ups assigned to them; tag comments. |
| Customer | No account | Answer through the links in the survey email; unsubscribe. |

The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, from_name, from_email, question, follow_up_question, send_time (10:00), daily_send_limit (100), throttle_days (90), company_domain (internal addresses are never surveyed), sending_enabled (false), time_zone.

**Person**: id, name, email, role: admin | member, active.

**Contact**: id, email (unique, lowercase), name, company, plan, account_owner_id, created_at, unsubscribed_at, last_surveyed_at.

**SurveySend**: id, contact_id, token (random, unique), sent_on, status: queued | sent | failed | held.

**Response**: id, send_id, contact_id, plan and account_owner_id (copied from the contact at the first click), score (0 to 10), category: promoter | passive | detractor, comment, first_clicked_at, last_changed_at, tags.

**FollowUp**: id, response_id, owner_id, status: open | contacted | resolved | no_reply | cancelled, due_on, notes (append-only list of { at, by, text }).

**Tag**: id, name (unique).

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged | held, error.

## 6. Scoring

- **Categories:** 9 and 10 are promoters, 7 and 8 passives, 0 to 6 detractors.
- **NPS** for a set of responses = (promoters − detractors) ÷ all responses × 100, rounded to the nearest whole number, shown with the number of responses. With no responses, show "No responses".
- **Response rate** for a month = responses to surveys sent that month ÷ surveys sent that month.
- A response belongs to the month and segment of its first click.

### Worked examples (seed data in section 14)

| Set | Promoters | Passives | Detractors | Responses | NPS |
|---|---|---|---|---|---|
| September | 22 | 10 | 8 | 40 | (22 − 8) ÷ 40 × 100 = 35 |
| September, Pro plan | 13 | 4 | 3 | 20 | 50 |
| September, Starter plan | 9 | 6 | 5 | 20 | 20 |
| October so far | 6 | 3 | 3 | 12 | 25 |

September's response rate: 40 responses to 100 surveys sent = 40%.

## 7. Sending and answering

**Daily send** at send_time on weekdays, when sending_enabled is on (otherwise the emails are held in the outbox):
1. Contacts are due if they are not unsubscribed, their email isn't on company_domain, and they have never been surveyed or were last surveyed more than throttle_days ago.
2. Send to at most daily_send_limit due contacts, those never surveyed first, then the longest ago; set last_surveyed_at.

**The email** asks the question with eleven links, 0 to 10, each carrying the send's token and the score, plus an unsubscribe link.

**Answering:** clicking a score records it (first_clicked_at) and opens a page with the follow-up question and a comment box. Clicking another score in the same email within 24 hours of the first click changes the score; after 24 hours the links show "Thanks, we already have your answer." and nothing changes.

**Unsubscribe** works in one click and sets unsubscribed_at; that contact is never surveyed again.

## 8. Business rules

- **R1. One answer per survey.** A send has at most one response; changes are allowed only within 24 hours of the first click (section 7).
- **R2. Categories and NPS** are calculated as in section 6, the same way on every screen, in emails and in exports.
- **R3. Throttle.** No contact is surveyed more than once in throttle_days, internal addresses are never surveyed, and unsubscribed contacts never again.
- **R4. Sending** follows section 7 and is safe to run twice on the same day.
- **R5. Follow-ups.** Every detractor response creates a follow-up assigned to the contact's account owner (or the admin if there is none), due 2 business days later, and emails the owner at once. If the score changes to 7 or more, the follow-up is cancelled; if it changes back, it reopens.
- **R6. Closing the loop.** A follow-up moves to contacted, resolved or no reply with a note. Notes are never edited or deleted.
- **R7. Tags.** Comments can have any number of tags; theme counts for a period count responses per tag.
- **R8. Imports** of contacts upsert by email, never delete, and show a preview: new, updated, unchanged and errors.
- **R9. Privacy.** Response pages show only the question and the customer's own answer; every survey email has a one-click unsubscribe link and a List-Unsubscribe header.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Dashboard**: NPS for this month and last, with response counts and rate; a 6-month trend; the split of promoters, passives and detractors; open follow-ups.
2. **Responses**: newest first, filters by category, month, plan, owner and tag; each with score, comment, contact, follow-up status and tags.
3. **Follow-ups**: mine first, then all; due date, status, notes.
4. **Contacts** with Import (preview), and each contact's survey and response history.
5. **Reports**: NPS by month and by segment (plan, account owner), theme counts by month, response rate; CSV export.
6. **Public pages**: the score and comment page (/s/<token>/<score>), and the unsubscribe page.
7. **Settings**, **Tags**, **People**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Daily send | Each due contact | "Quick question from Tally" (the question with 0 to 10 links) |
| Detractor response | The account owner | "Ana Lopez (Acme Books) scored 3: follow up by Mon Oct 19" |
| Monday 09:00 | Admins | "NPS last week: 30 (10 responses), 2 follow-ups overdue" |

Write every email to the outbox first, then send it. A job (protected by a CRON_SECRET header) runs every 15 minutes for the daily send and the Monday digest, and is safe to run twice.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so the 24-hour answer window, throttling, due dates and the digest can be tested by moving the clock.

## 12. Import and export

Contact import CSV columns: email, name, company, plan, account_owner_email. Sample file for the checks:

```
email,name,company,plan,account_owner_email
ana@acmebooks.example,Ana Lopez,Acme Books,Pro,omar@tallyco.example
new.one@harbor.example,Jo Harbor,Harbor Accounting,Starter,priya@tallyco.example
ben@bluebird.example,Ben Cole,Bluebird Ltd,Pro,priya@tallyco.example
broken-email,No Name,Nowhere,Starter,omar@tallyco.example
```

Response export (CSV): date, contact, company, plan, owner, score, category, comment, tags, follow-up status.

## 13. Edge cases

- The same person appears under two emails: they are two contacts; merging is a variation.
- A contact changes plan after answering: the response keeps the plan it had when answered, so past segment reports don't move.
- A survey bounces: the send is marked failed; three failures in a row unsubscribe the contact with the reason "bounced".
- A score link is forwarded to someone else: it still counts once, for the original contact.
- An account owner is deactivated: their open follow-ups go to the admin.

## 14. Seed data

Company "Tally & Co", bookkeeping software; company_domain tallyco.example; time zone America/New_York; sending switch off. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@tallyco.example): Grace Kim (admin, customer experience lead), Omar Ali and Priya Nair (members, account managers).

Contacts: 300 customers on the Pro or Starter plan, split between Omar and Priya. Named ones used in the checks:
- ana@acmebooks.example, Ana Lopez, Acme Books, Pro, owner Omar, last surveyed 95 days ago.
- ben@bluebird.example, Ben Cole, Bluebird Ltd, Starter, owner Priya, last surveyed 60 days ago.
- cara@pinelabs.example, Cara Diaz, Pine Labs, Pro, owner Omar, unsubscribed.
- dev@tallyco.example, Dev Shah, Tally & Co (an employee's test account), Pro, never surveyed.

Survey history: in September, 100 surveys were sent and 40 answered: Pro 13 promoters, 4 passives, 3 detractors; Starter 9 promoters, 6 passives, 5 detractors. In October so far, 12 answered: 6 promoters, 3 passives, 3 detractors. Detractor follow-ups exist for all of them; the September ones are resolved, and October's three are open, one of them overdue. In September, comments are tagged Export (5), Pricing (4) and Bank feeds (3); in October, one comment is tagged Pricing and none Export.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, contacts and the dashboard

```
Using the NPS Surveys blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask the customer experience lead to add you."
3. Build Contacts with Import (R8), Responses, the Dashboard and Settings (section 9, screens 1, 2, 4 and 7), with scoring as section 6 (R2), enforcing section 4 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The dashboard shows September's NPS as 35 from 40 responses (22 promoters, 10 passives, 8 detractors) with a 40% response rate, and October's as 25 from 12 responses.
- [ ] Filtering September by plan shows Pro at 50 and Starter at 20.
- [ ] Checking the sample import in section 12 shows 1 new (Jo Harbor), 1 unchanged (Ana Lopez), 1 updated (Ben Cole, plan Starter to Pro) and 1 error (broken-email).
- [ ] Signed in as Omar, Settings and Import are not offered, and direct requests to them are refused.

### Phase 2: Sending and answering

```
Using the NPS Surveys blueprint above, build Phase 2 only.

1. Build the daily send (section 7, R3, R4) with a preview of who is due, the survey email, the public score and comment page, the 24-hour change rule (R1) and one-click unsubscribe (R9).
2. Build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The send preview includes Ana Lopez and leaves out Ben Cole (surveyed 60 days ago), Cara Diaz (unsubscribed) and dev@tallyco.example (internal), and never lists more than 100 contacts.
- [ ] With the sending switch off, running the job puts the surveys in the outbox as held, and running it again the same day adds nothing.
- [ ] Opening the score 6 link from Ana's survey records a detractor and shows the comment page; opening the score 8 link from the same email an hour later changes it to 8, a passive.
- [ ] 25 hours after her first click, opening any score link shows "Thanks, we already have your answer." and the score stays 8.
- [ ] Clicking the unsubscribe link marks Ana unsubscribed, and she no longer appears in the send preview after the clock moves 100 days.

### Phase 3: Follow-ups, tags and the digest

```
Using the NPS Surveys blueprint above, build Phase 3 only.

1. Build Follow-ups (section 9, screen 3) with R5 and R6, and tags with theme counts (R7).
2. Write the detractor alert and the Monday digest (section 10) to the outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] After the daily send, a score of 3 from Ana creates a follow-up for Omar due Mon Oct 19 and emails him at once; changing her score to 9 within 24 hours cancels it.
- [ ] Omar logs "Called her, fixed the export" and marks a follow-up resolved; the response shows the follow-up as resolved with his note.
- [ ] Signed in as Priya, she can't change the status of Omar's follow-ups, including by a direct request.
- [ ] Tagging two October comments Export shows Export with 2 in October's theme counts.
- [ ] Moving the clock to Monday 09:00 and running the job sends Grace one digest with last week's NPS and the overdue follow-up.

### Phase 4: Reports and export

```
Using the NPS Surveys blueprint above, build Phase 4 only.

1. Build Reports (section 9, screen 5) and the response export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Reports show a monthly trend with September 35 and October 25, and NPS by account owner for September that adds up to the 40 responses.
- [ ] The response export for September has 40 rows with score, category, comment, tags and plan.
- [ ] Changing a contact's plan after they answered does not change September's NPS by plan.

## 16. Variations

- CSAT after a support ticket closes, with the same follow-up rules.
- In-app surveys through a small script on your product.
- Merge contacts that are the same person.
- Send detractor alerts to a Slack channel.
- AI suggestions for tags, reviewed by a person before saving.
