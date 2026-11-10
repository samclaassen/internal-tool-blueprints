<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/feature-requests . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Feature Requests

Blueprint BP-030 · Department: Support · Replaces: Canny, the feature request spreadsheet, "+1" emails
For teams of 2 to 50 people building a product for customers.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Feature requests arrive in emails, calls and chats, and we can't say what customers want most."

A small software company hears requests everywhere: support tickets, sales calls, a channel full of "+1"s. Someone keeps a spreadsheet for a while. Duplicates pile up, nobody knows whether the loud request comes from one big customer or twenty small ones, and customers never hear back when the thing they asked for ships.

This blueprint is a public feature request board: customers post ideas and vote, the team merges duplicates, sets statuses, sees the revenue behind each request, and every voter is told when their idea is planned, shipped or declined. A changelog and a roadmap close the loop.

## 2. What the real product does

Research basis: Canny's pricing page (canny.io/pricing), October 2026.

What we verified:

1. **Plans.** Free: $0, with 25 tracked users and 5 managers, unlimited feedback and boards, and automatic feedback capture. Pro: from $79 a month billed yearly, with 100 or more tracked users, 10 managers, project management integrations and advanced privacy; the price rises with the number of tracked users. Business: custom pricing, with 5,000 or more tracked users, SSO and CRM integrations. Paying yearly saves up to 20%.
2. **Tracked users.** A tracked user is anyone who has given feedback: created a post, voted or commented, themselves or through an admin or Canny's AI. Going over the limit upgrades the account automatically unless a spend limit is set.
3. **Features listed** include AI capture of feedback from support and sales conversations (Autopilot), deduplication, a feedback portal with boards, status updates, vote-on-behalf, a changelog, private boards, custom domains and statuses, and integrations with Intercom, Zendesk, Slack, Jira, Linear, HubSpot and Salesforce.

### What this blueprint keeps

A public board where customers post ideas, vote and comment; sign-in by email link; similar-post suggestions before posting; merging duplicates without double-counting votes; statuses with an email to every voter; votes added on a customer's behalf; the revenue behind each request from your own account list; internal notes; a public roadmap and changelog; and exports.

### What this blueprint deliberately leaves out

AI capture from support and sales conversations, AI deduplication and summaries, integrations with project management tools and CRMs, private boards, custom domains per board, translations, SSO, and a widget inside your product.

## 3. Scope of v1

- One company, one public board at /ideas, plus the admin area.
- Customers sign in with a one-time email link; no passwords. The team signs in with your company accounts.
- Revenue comes from an account list you import (company, email domain, monthly revenue in integer cents).
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Product lead | Everything: settings, statuses, merging, accounts import, team, hiding posts, the changelog. |
| Team member | Product, support, sales | Change statuses, merge, add votes on a customer's behalf, write internal notes, draft changelog entries, see revenue. |
| Customer | Anyone who signs in by email | Post ideas, vote, comment, follow posts, see the roadmap and changelog. |
| Visitor | Not signed in | Read the board, roadmap and changelog. |

Customers never see revenue, internal notes or who voted (only vote counts). The server enforces this.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, board_title, from_email, company_domain (team emails), posts_per_day_limit (5).

**TeamMember**: id, name, email, role: admin | member, active.

**Customer**: id, email (unique, lowercase), name, account_id (matched by email domain), created_at, unsubscribed_at.

**Account**: id, company, domain (unique), mrr_cents.

**Post**: id, number, title (8 to 120 characters), body, author_customer_id or author_team_id, status: under_review | planned | in_progress | shipped | declined, status_note, merged_into_id, hidden, created_at.

**Vote**: post_id, customer_id, created_at, added_by_team_id (when voted on a customer's behalf), unique on post and customer.

**Comment**: id, post_id, author, body, internal (team only), created_at.

**StatusChange** (append-only): post_id, from, to, note, by, at.

**ChangelogEntry**: id, title, body, published_at, post_ids.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Votes, merging and revenue

- A customer votes at most once per post and can remove their vote. Shipped and declined posts take no new votes.
- Posting a new idea votes for it automatically.
- **Merging** a duplicate into a target moves its votes and comments to the target, counting each customer once, marks the duplicate merged (it redirects to the target), and emails the duplicate's voters that their vote moved.
- **Revenue behind a post** = the sum of mrr_cents over distinct accounts with at least one vote on it. Customers without an account add nothing.

### Worked examples (seed data in section 14)

| Situation | Result |
|---|---|
| Merging "Dark theme please" (3 votes) into "Dark mode" (48 votes), with one customer who voted for both | "Dark mode" has 50 votes; the duplicate redirects to it |
| "Export to Word" has votes from people at Acme Books ($2,400 a month), Bluebird ($900) and Pine Labs ($300), two of them from Acme | Revenue behind it: $3,600 a month |
| Moving "Offline editing" from Planned to In progress with a note | Its 22 voters each get one email with the note |
| Voting on "Native Linux app" (declined) | Refused: "This idea is closed to new votes." |
| A customer types "export word" in the new idea title | "Export to Word" is suggested before they post |

## 7. Statuses

| Status | Meaning | Shown on the roadmap |
|---|---|---|
| Under review | New, not yet decided | No |
| Planned | We intend to build it | Planned column |
| In progress | Being built | In progress column |
| Shipped | Released; usually linked from a changelog entry | Shipped column (last 90 days) |
| Declined | Not planned; a public reason is required | No |

Any status can move to any other. Every change writes a StatusChange and emails every voter and follower once, with the note if there is one. Declining requires a note.

## 8. Business rules

- **R1. Sign-in.** Customers sign in with a one-time link valid for 15 minutes and used once. Team emails on company_domain sign in to the admin area, not the board account.
- **R2. Votes and merging** follow section 6.
- **R3. Statuses** follow section 7.
- **R4. Revenue** follows section 6 and is visible only to the team.
- **R5. Posting.** Titles of 8 to 120 characters; at most posts_per_day_limit new posts per customer per day; similar posts are suggested by matching title words before posting.
- **R6. Changelog.** Publishing an entry shows it on the changelog page and emails the voters of its linked posts once, even if they voted for several of them ("New in Quill: Mentions in comments"). This is separate from the status email each post sent when it was set to Shipped.
- **R7. Votes on behalf.** A team member can add a vote for a customer (by email, creating the customer if needed) with a note about where the request came from; it counts like any vote and records who added it.
- **R8. Hiding.** Admins can hide spam or abusive posts and comments; hidden items disappear from the board and stay in the admin area.
- **R9. Privacy.** The board shows vote counts but never voter names or emails; internal comments and revenue are team-only; every email has an unsubscribe link.
- **R10. Events.** Every change writes an event; events and status changes are never edited or deleted.

## 9. Screens

1. **Board** (/ideas): posts sorted by votes (or newest), filter by status, search; each with title, status, vote count and a vote button.
2. **Post page**: description, status with its latest note, vote and follow buttons, public comments; for the team, internal comments, revenue, voters list and actions.
3. **New idea**: title with similar-post suggestions, description.
4. **Roadmap** (/roadmap): Planned, In progress and Shipped columns.
5. **Changelog** (/changelog): published entries, newest first, linking the shipped posts.
6. **Admin**: posts with votes and revenue, sortable; merge; status changes; votes on behalf; accounts import (CSV: company, domain, mrr); team; settings; changelog editor; hidden items; outbox.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Sign-in requested | Customer | "Your sign-in link for Quill ideas" |
| Status changed | Voters and followers | "Planned: Dark mode" (with the note) |
| Merged | Voters of the duplicate | "Your vote moved to Dark mode" |
| Changelog published | Voters of linked posts, once each | "New in Quill: Mentions in comments" |
| New comment on a followed post | Followers, except the commenter | "New comment on Export to Word" |

Write every email to the outbox first, then send it. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so sign-in link expiry, the daily post limit and the roadmap's 90-day window can be tested.

## 12. Export

Team members can export posts as CSV (number, title, status, votes, revenue, created, last status change) and a post's voters as CSV (email, company, MRR, voted at, added by).

## 13. Edge cases

- A customer changes their email domain: their votes stay; revenue follows their current account.
- An account's MRR changes: revenue behind every post updates; past status emails don't.
- A merged post is merged again: votes follow to the final target; links redirect to it.
- A team member votes on behalf of a customer who already voted: refused, "Ana already voted for this idea."
- Someone requests sign-in links repeatedly: at most 5 per email per hour.

## 14. Seed data

Company "Quill", a writing app for teams; board "Quill ideas"; team domain quill.example. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Team (emails firstname@quill.example): Nina Shah (admin, product lead), Omar Ali (member, support).

Accounts: Acme Books (acmebooks.example, $2,400 a month), Bluebird (bluebird.example, $900), Pine Labs (pinelabs.example, $300), Harbor Studio (harborstudio.example, $1,500).

Posts:

| # | Title | Status | Votes | Notes |
|---|---|---|---|---|
| 1 | Dark mode | Planned | 48 | |
| 2 | Export to Word | Under review | 31 | 4 of the voters are at known accounts: 2 Acme Books, 1 Bluebird, 1 Pine Labs |
| 3 | Offline editing | Planned | 22 | |
| 4 | Comment mentions | Shipped (Oct 1) | 15 | Linked from the changelog entry "Mentions in comments" |
| 5 | Native Linux app | Declined | 6 | Note: "We're focusing on the web app for now." |
| 6 | Dark theme please | Under review | 3 | One of its voters also voted for Dark mode |

Customers used in the checks: ana@acmebooks.example (Ana Lopez, voted for Export to Word and Dark mode), ben@bluebird.example (voted for Export to Word), kim@example.com (no account, has voted for nothing). Apart from the four Export to Word voters and Ana's vote on Dark mode, no voter belongs to a known account, and Harbor Studio has no voters.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, the board and voting

```
Using the Feature Requests blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add customer sign-in by one-time email link (R1) and team sign-in with the platform's built-in auth or Google sign-in limited to our company email domain.
3. Build the Board, Post page, New idea with similar-post suggestions, and voting (section 9, screens 1 to 3) with R5 and R9.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The board lists Dark mode (48), Export to Word (31), Offline editing (22), Comment mentions (15), Native Linux app (6) and Dark theme please (3), sorted by votes.
- [ ] Kim requests a sign-in link, uses it, and votes for Export to Word, which goes to 32; using the same link again, or after 15 minutes, is refused.
- [ ] Voting on Native Linux app is refused with "This idea is closed to new votes.", both on screen and by a direct request.
- [ ] Typing "export word" as a new idea's title suggests Export to Word.
- [ ] Signed out, a post page shows the vote count but no voter names or emails, and no internal comments.

### Phase 2: Statuses, merging and notifications

```
Using the Feature Requests blueprint above, build Phase 2 only.

1. Build the team actions on the Post page and Admin (section 9, screens 2 and 6): status changes (section 7), merging (section 6), votes on behalf (R7), internal comments and hiding (R8).
2. Write the emails in section 10 to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Merging Dark theme please into Dark mode leaves Dark mode with 50 votes, redirects the duplicate, and emails its 3 voters that their vote moved.
- [ ] Moving Offline editing to In progress with a note emails each of its 22 voters once, with the note.
- [ ] Declining a post without a note is refused.
- [ ] Omar adds a vote on behalf of kim@example.com to Dark mode, noting "Asked on a support call"; Kim appears as a voter with "added by Omar Ali", and adding it again is refused.
- [ ] Signed in as Kim, internal comments and the voters list are not visible, and a direct request for them is refused.

### Phase 3: Revenue, roadmap and changelog

```
Using the Feature Requests blueprint above, build Phase 3 only.

1. Build the accounts import and revenue behind each post (section 6, R4) in Admin, with sorting by revenue.
2. Build the Roadmap and Changelog (section 9, screens 4 and 5) with R6.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Revenue behind Export to Word shows $3,600 a month, counting Acme Books once; changing Pine Labs to $500 a month makes it $3,800.
- [ ] Sorting the admin list by revenue puts Export to Word first.
- [ ] The roadmap shows Dark mode and Offline editing under Planned and Comment mentions under Shipped, and no declined or under-review posts.
- [ ] After Offline editing is set to Shipped, publishing a changelog entry that links it shows the entry on /changelog and sends each of its 22 voters one changelog email.

### Phase 4: Export and limits

```
Using the Feature Requests blueprint above, build Phase 4 only.

1. Build the CSV exports (section 12), the posting limit (R5) and the sign-in link limit (section 13).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The posts export lists all six posts with votes, status and revenue, and Export to Word's voter export lists each voter with company and MRR.
- [ ] Kim's sixth new idea in one day is refused with a message about the daily limit.
- [ ] A sixth sign-in link request for the same email within an hour is refused.

## 16. Variations

- Private boards for beta customers, by email domain.
- A widget inside your product that opens the board with the customer already signed in.
- Send planned and in-progress posts to your issue tracker.
- Weight votes by plan or revenue in the default sort.
- AI suggestions for duplicates, reviewed by a person before merging.
