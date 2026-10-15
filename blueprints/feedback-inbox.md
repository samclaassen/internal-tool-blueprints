<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/feedback-inbox . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Customer Feedback Inbox

Blueprint BP-012 · Department: Support · Replaces: Productboard (customer feedback and insights), feedback scattered across email, calls and tickets
For teams of 3 to 50 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Customer feedback is scattered across email, calls and support tickets."

An account manager hears a request on a call, a support agent sees the same request in a ticket, and product sees neither. When the team finally talks about it, nobody can say how many customers asked, how much revenue they represent, or who to tell when it ships. The quotes that would settle the argument are buried in inboxes.

This blueprint is one inbox for customer feedback. Every piece of feedback keeps the customer's own words and the account it came from. Product links it to a theme, themes rank by evidence, revenue and votes, promoted themes go on an internal roadmap with a status history, and when a theme ships the app produces the list of accounts to tell.

## 2. What the real product does

Research basis: Productboard's pricing page (productboard.com/pricing) and customer feedback page (productboard.com/product/insights), October 2026.

What we verified:

1. **Plans and price.** Productboard lists two plans, Business ("Request demo") and Enterprise ("Contact sales"). No prices are shown on the pricing page. Business lists a minimum of 5 makers, 25 contributors, 2 product portals, unlimited feedback notes, unlimited roadmaps and prioritization, manual and dynamic customer segments, feedback loop closing and product usage integrations (Amplitude, Mixpanel). Enterprise adds unlimited contributors, SAML SSO and SCIM, custom roles and permissions and a Salesforce integration.
2. **Collecting feedback.** Feedback from support tickets, call recordings and chat messages (the product page names Zendesk, Gong and Slack) is captured into one place, then curated and routed. The pricing page lists a customer insights repository, customer boards and feedback forms.
3. **Customers and revenue.** Feedback can be sorted, filtered and segmented by customer, with custom and aggregated company fields, so a team can focus on its most important accounts.
4. **Prioritization and roadmaps.** A feature idea hierarchy, custom prioritization formulas, customizable feature statuses, timeline and column roadmaps and release planning.
5. **Closing the loop.** The plan comparison lists "Feedback loop closing", "Notify idea & feedback contributors" and "Export list of feature requesters".
6. **Portals and AI.** Product portals where customers vote (with custom voting questions), an embedded portal and moderation. An AI layer (Spark) with feedback summaries and findings; AI Themes are listed on Enterprise only.

### What this blueprint keeps

Customers (accounts) with email domains and monthly recurring revenue; manual capture of a quote from any channel; an inbound endpoint that turns forwarded emails or tickets into feedback, matched to a customer by email domain; an inbox with triage (link to a theme, dismiss with a reason, restore); themes ranked by evidence, unique-account revenue or votes; votes recorded per customer account; promotion of a theme to an internal roadmap with an owner; five statuses with a required note for every change; and, when a theme ships, a follow-up list of every account that asked or voted, with update emails through an outbox. Plus an activity log and CSV export.

### What this blueprint deliberately leaves out

Native integrations with Zendesk, Gong, Slack, Intercom or Salesforce (v1 has one inbound endpoint that any forwarding service or automation tool can call), a customer-facing portal and public voting, AI summaries and AI themes, customer segments, feature hierarchies and custom prioritization formulas, timeline roadmaps and release planning, product usage data, and SSO. These matter to product organizations with many teams and thousands of customers. A team of 3 to 50 people needs one trusted list of what customers asked for, how much revenue is behind it, and who to tell when it ships.

## 3. Scope of v1

- One company, one currency (USD). MRR is stored as integer cents per month.
- One inbox. Sources are labels chosen by whoever captures the feedback (Email, Call, Ticket, Chat, In-app, Other); the inbound endpoint sets Email or Ticket.
- Each piece of feedback belongs to at most one theme.
- Themes are internal. Nothing in this app is shown to customers except the follow-up emails a team member chooses to send.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- Dates are shown in one team time zone (Settings; default America/New_York).
- Web app that works on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Member | Everyone on the team | See everything. Capture feedback, assign customers, link and unlink themes, dismiss and restore, create themes, record and remove votes, promote a theme (choosing an owner), export CSV. |
| Theme owner | The person set as a promoted theme's owner | Change that theme's status (with a note), change its owner, and work its follow-up list. |
| Admin | One or more people | Everything above on every theme. Manage people, customers (including MRR) and settings. Read the outbox. Delete feedback (R14). |

Everyone can see everything, because the point is a shared view of what customers asked for. Only the actions above are restricted, and the server enforces them.

## 5. Data model

All IDs are strings. Timestamps are UTC.

**Person**
- id, name (required), email (required, unique, stored lowercase), is_admin (boolean, default false), active (boolean, default true)

**Settings** (one row)
- company_name (required, max 60), time_zone (IANA name, default "America/New_York")
- follow_up_template (required, max 2,000 characters; may use {contact_first_name}, {theme_name} and {company_name})

**Customer** (an account)
- id, name (required, 1 to 80, unique ignoring case)
- domains (list of email domains, lowercase, without "@"; each domain belongs to at most one customer; may be empty)
- mrr_cents (integer, 0 or more), archived (boolean, default false)

**Feedback**
- id, customer_id (nullable: null means "Needs customer")
- source: email | call | ticket | chat | in_app | other
- from_name (optional, max 100), from_email (optional, valid email, stored lowercase)
- quote (required, 10 to 3,000 characters after trimming; the customer's words, never rewritten)
- received_at (timestamp; defaults to now), captured_by (nullable Person; null for inbound)
- external_id (optional, max 200; unique when present; set by the inbound endpoint)
- state: inbox | linked | dismissed; theme_id (set only when state is linked)
- dismiss_reason (5 to 300 characters, set only when dismissed)
- created_at

**Theme**
- id, name (required, 3 to 80 characters, unique ignoring case and surrounding spaces), description (optional, max 1,000)
- created_by, created_at
- promoted_at (nullable), owner_id (nullable; required once promoted)
- status: under_review | planned | in_progress | shipped | not_planned (nullable until promoted; shown as Under review, Planned, In progress, Shipped, Not planned)

**Vote** (one per customer account per theme)
- theme_id, customer_id, recorded_by, created_at; unique (theme_id, customer_id)

**StatusChange** (a theme's decision history; append-only)
- id, theme_id, from_status (nullable), to_status, note (5 to 500 characters), actor_id, created_at

**FollowUp** (one account to tell about one shipment)
- id, theme_id, shipped_change_id (the StatusChange that moved the theme to Shipped), customer_id
- status: pending | emailed | contacted | cancelled; done_by (nullable), done_at (nullable), note (optional, max 300)
- unique (shipped_change_id, customer_id)

**Event** (activity log; append-only, never updated or deleted)
- id, actor_id (nullable for inbound and the system), feedback_id (nullable), theme_id (nullable)
- type: captured | inbound_received | customer_assigned | linked | unlinked | dismissed | restored | theme_created | vote_added | vote_removed | promoted | status_changed | owner_changed | follow_up_emailed | follow_up_contacted | feedback_deleted | customer_changed
- data (JSON, nullable), created_at

**Notification** (outbox)
- id, kind, to_email, person_id (nullable; empty for customer contacts), theme_id (nullable)
- subject, body (plain text), status: pending | sent | logged | failed, error (nullable), created_at, sent_at

## 6. Theme metrics and ranking

Compute these from the rows every time. Never store a running total.

- **Evidence** = the number of feedback rows with state linked and this theme_id.
- **Accounts** = the distinct customer_ids among that evidence. Feedback can only be linked once it has a customer (R3), so every piece of evidence has one.
- **MRR** = the sum of the current mrr_cents of those distinct accounts. Each account counts once per theme, however many quotes it gave.
- **Votes** = the number of Vote rows for the theme. A vote never adds evidence or MRR.
- **Ranking.** The Themes screen sorts by Evidence, MRR or Votes, highest first; ties sort by theme name A to Z.
- A customer can be behind several themes. Never add theme MRR figures together and call the result revenue; show the company's total MRR separately on the Customers screen.

### Worked examples (seed data in section 14)

| Theme | Evidence | Accounts | MRR | Votes |
|---|---|---|---|---|
| Single sign-on | 2 (Acme ticket, Acme call) | Acme Corp | $2,400 | 2 (Acme Corp, Harbor Studio) |
| CSV export | 1 (Ridgeway email) | Ridgeway | $890 | 0 |
| Slack alerts | 1 (Olsen in-app) | Olsen & Co | $149 | 0 |

- Sorted by Evidence: Single sign-on, CSV export, Slack alerts (CSV export and Slack alerts tie at 1 and sort by name). By MRR: Single sign-on, CSV export, Slack alerts. By Votes: Single sign-on, then CSV export and Slack alerts by name.
- Harbor Studio's vote on Single sign-on counts as a vote but adds no MRR: MRR comes only from accounts with evidence.
- Moving Acme's call from Single sign-on to Slack alerts: Single sign-on keeps 1 piece of evidence and still $2,400 (Acme's ticket remains); Slack alerts becomes 2 pieces from Olsen & Co and Acme Corp, $2,549.
- Dismissing Olsen's quote leaves Slack alerts with no evidence, so it cannot be promoted (R7).

## 7. Lifecycle

### Feedback

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Capture | Member | (none) | inbox | Customer required in the form; event `captured` |
| Inbound | The inbound endpoint (section 11) | (none) | inbox | Customer matched by from_email domain, or null; event `inbound_received` |
| Assign customer | Member | inbox | inbox | Only while state is inbox; event `customer_assigned` |
| Link to theme | Member | inbox, linked | linked | Needs a customer (R3); moving to another theme replaces theme_id; event `linked` |
| Unlink | Member | linked | inbox | Clears theme_id; event `unlinked` |
| Dismiss | Member | inbox, linked | dismissed | Reason required; clears theme_id; event `dismissed` |
| Restore | Member | dismissed | inbox | Clears the reason; event `restored` |
| Delete | Admin | any | (removed) | R14 |

### Theme

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Member | (none) | not promoted | Event `theme_created` |
| Promote | Member | not promoted | under_review | Needs evidence and an active owner (R7); StatusChange with the note "Promoted to the roadmap"; owner emailed if it is someone else |
| Change status | Theme owner or admin | any status | any different status | Note required (R8); StatusChange; entering Shipped creates the follow-up list (section 9); leaving Shipped cancels its pending follow-ups |
| Change owner | Theme owner or admin | promoted | same | New owner must be active; new owner emailed; event `owner_changed` |

A theme is never deleted. A promoted theme is never un-promoted; use Not planned.

## 8. Business rules

- **R1. The customer's words are kept.** The quote, from_name, from_email, source and received_at are never edited after capture. Fixing a mistake means dismissing the item and capturing it again.
- **R2. One theme per piece of feedback.** Linking to another theme moves it; it never copies it.
- **R3. Evidence needs an account.** Feedback with no customer stays in the "Needs customer" queue and cannot be linked: "Assign a customer before linking this to a theme."
- **R4. Capture validation.** Customer must exist and not be archived, source must be one of the six, the quote must be 10 to 3,000 characters after trimming, from_email (if given) must be a valid address, and received_at cannot be in the future. Nothing is saved when any check fails.
- **R5. Theme names.** 3 to 80 characters, unique ignoring case and surrounding spaces: "A theme called Single sign-on already exists."
- **R6. Votes.** One per customer account per theme. Recording a vote for an account that already voted is refused: "Harbor Studio has already voted for Single sign-on." Removing a vote is a separate action. Archived customers cannot vote.
- **R7. Promotion.** A theme can be promoted only if it has at least one piece of evidence and an active owner is chosen: "Link at least one piece of feedback before promoting this theme." Votes alone are not enough. Promotion is not a commitment to build.
- **R8. Status changes.** Only promoted themes have a status. Changing it requires the theme owner or an admin, a status different from the current one ("Single sign-on is already Planned."), and a note of 5 to 500 characters. Any status can move to any other, so the history can record work that shipped early or a decision that was reversed. History is never edited.
- **R9. Follow-up list.** When a theme enters Shipped, create one pending FollowUp for each distinct non-archived account that has evidence on the theme or a vote for it at that moment. While the theme stays Shipped, an account that gains evidence or a vote is added to the same list. Leaving Shipped sets every pending follow-up of that shipment to cancelled; done ones stay as history. Shipping again starts a new list.
- **R10. Follow-up actions.** Send update queues one email per contact address for that account on this theme (the distinct from_emails of its evidence on the theme), using follow_up_template, and marks the follow-up emailed. If the account has no contact address on this theme (for example it only voted), Send update is not offered and the follow-up can only be marked contacted, with a note of how. Each follow-up is done once; repeating either action is refused: "Ridgeway was already emailed on Oct 14 by Maya Chen."
- **R11. Follow-up emails never include** other customers' names, quotes, MRR, votes, notes or the theme's status history.
- **R12. Customers.** Only admins create, edit, archive or import customers and change MRR. A domain can belong to only one customer: "acme.example already belongs to Acme Corp." Changing MRR changes theme MRR everywhere, because MRR is always computed from current values.
- **R13. Server checks.** Every permission in section 4 and every rule here is enforced on the server, for every action and API call.
- **R14. Delete.** An admin can delete a piece of feedback (for example when a customer asks for their words to be removed). It removes the row and its follow-up email addresses from future lists; the event `feedback_deleted` keeps only the id, the account and the theme, never the quote or the sender.
- **R15. Events.** Every successful action writes the event in section 7. Events are never edited.

## 9. Screens

1. **Inbox** (home). Tabs: Inbox (state inbox with a customer), Needs customer, Linked, Dismissed, each with a count. Filters: source, customer and a text search over the quote, sender and customer name; filters combine. Each card shows the customer, MRR, source, sender, received date and the quote, with actions: Link to theme (choose an existing theme or type a new name), Assign customer (Needs customer only), Dismiss (asks for a reason) and Restore (Dismissed only). A Capture button opens the form: customer, source, sender name and email (optional), quote, received date.
2. **Themes.** A New theme button, and every theme with Evidence, Accounts, MRR and Votes, sorted by the chosen metric (section 6), promoted themes labelled with their status. A note under the table: "MRR counts each account once per theme. Accounts can appear in several themes."
3. **Theme.** Name, description, metrics, every quote with its account and sender, votes with Record vote (choose an account) and Remove, Promote (choose an owner), status with Change status, the status history, and, when Shipped, the follow-up list (R9 and R10).
4. **Roadmap.** Promoted themes in five lanes (Under review, Planned, In progress, Shipped, Not planned), each card showing owner, evidence, MRR and votes. On a phone the lanes stack vertically. Each lane shows "Nothing here yet." when empty.
5. **Follow-ups.** Every pending follow-up across shipped themes, oldest shipment first, with Send update and Mark contacted.
6. **Admin: Customers.** Create, edit and archive customers; CSV import with columns name, domains (separated by semicolons) and mrr (in dollars), with a preview of each row before importing; the company's total MRR.
7. **Admin: People** and **Admin: Settings** (company, time zone, follow-up template with a preview).
8. **Admin: Outbox.** Every notification with its status.
9. **Activity.** The event log, newest first, filterable by theme.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Promote, or change owner | The new owner, unless they made the change | "You own {theme} on the roadmap" |
| Status change by someone other than the owner | The theme owner | "{theme} is now {status}" (with the note) |
| Send update (R10) | Each contact address for that account | "{theme} is here" (follow_up_template) |

Write every notification to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by the scheduled job (an hourly cron, protected by a CRON_SECRET header) up to 5 times. A notification failure never blocks the action that caused it.

## 11. The inbound endpoint

Any tool that can forward an email or call a webhook (an inbound email service, a help desk automation, Zapier) can send feedback in:

- `POST /api/inbound` with the header `Authorization: Bearer <INBOUND_SECRET>` (an environment variable). Compare the secret in constant time. A missing or wrong secret returns 401 and saves nothing.
- JSON body: `external_id` (required, max 200), `from_email` (required), `from_name` (optional), `subject` (optional), `text` (required), `source` (optional: email or ticket; default email), `received_at` (optional ISO timestamp; default now; never in the future).
- The quote is the subject and the text joined by a blank line, trimmed and cut to 3,000 characters. Fewer than 10 characters returns 422.
- The customer is the one whose domains include the domain of from_email. No match means customer_id is null and the item goes to Needs customer.
- A repeated external_id returns 200 with the existing feedback id and saves nothing new, so retries are safe.
- Successful requests return 201 with the new feedback id.

## 12. Edge cases

- The same person emails twice about SSO: two pieces of evidence, one account, MRR counted once.
- An account is archived: its existing evidence still counts in Evidence and MRR (history stays true), but it cannot vote, receive new captures or be added to a new follow-up list.
- MRR is corrected by an admin: every theme's MRR changes at once, because it is computed from current values (R12).
- A theme is moved from Shipped back to In progress with a pending follow-up for Ridgeway: the follow-up becomes cancelled; shipping again creates a new pending one.
- Feedback linked to a shipped theme after shipping (R9): its account is added to the current follow-up list if it is not already there.
- Two people link the same feedback at the same time: the second action sees the current theme in the same transaction and gets "Already linked to CSV export by Jo Park."
- Quotes are rendered as text, never as HTML.

## 13. Time

"Now" is read through one function that adds the development clock offset, so tests can move time forward. Dates are shown in Settings.time_zone.

## 14. Seed data

Settings: company "Northwind", time zone America/New_York, follow-up template "Hi {contact_first_name}, you asked us about {theme_name}. It's now live. Thanks for telling us, it helped us decide. The {company_name} team".

People: Dana Ruiz (admin, support lead), Maya Chen (product), Sam Okafor (product), Jo Park (support), Ben Cho (account manager). All active.

Customers:

| Customer | Domains | MRR |
|---|---|---|
| Acme Corp | acme.example | $2,400 |
| Ridgeway | ridgeway.example | $890 |
| Olsen & Co | olsen.example | $149 |
| Harbor Studio | harbor.example | $490 |

Feedback (T is the day the seed is loaded):

| # | Customer | Source | From | Quote | Received | State |
|---|---|---|---|---|---|---|
| F1 | Acme Corp | Ticket | Priya Shah, priya@acme.example | "We need SSO before we can roll this out to the whole company." | T-9 | Linked: Single sign-on |
| F2 | Acme Corp | Call (captured by Ben Cho) | Tom Becker, tom@acme.example | "IT keeps asking when we'll support SSO with Okta." | T-4 | Linked: Single sign-on |
| F3 | Ridgeway | Email | Ella Brooks, ella@ridgeway.example | "Is there any way to export our project list to CSV?" | T-30 | Linked: CSV export |
| F4 | Olsen & Co | In-app | Kim Olsen, kim@olsen.example | "Would love Slack alerts when a client approves something." | T-6 | Linked: Slack alerts |
| F5 | Harbor Studio | Call (captured by Ben Cho) | Rosa Diaz, rosa@harbor.example | "Can our clients see a progress link without logging in?" | T-1 | Inbox |

Themes:

| Theme | Promoted | Owner | Status history | Votes |
|---|---|---|---|---|
| Single sign-on | T-3 | Sam Okafor | Under review (T-3, "Promoted to the roadmap"), Planned (T-2, "Scheduled for this quarter") | Acme Corp, Harbor Studio |
| CSV export | T-28 | Maya Chen | Under review (T-28), In progress (T-14, "Started"), Shipped (T-1, "Released in version 2.14") | none |
| Slack alerts | not promoted | | | none |

CSV export's shipment has one pending follow-up: Ridgeway.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Customer Feedback Inbox blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin: Customers (with the CSV import preview), Admin: People and Admin: Settings (section 9, screens 6 and 7). Only admins can use them; enforce R12 and R13 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build the inbox or themes yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin: Customers lists the four customers with their MRR and a company total of $3,929.
- [ ] Signed in as Jo, Admin: Customers says "Only admins can open this page." and a direct request to change Acme's MRR is refused.
- [ ] Adding a customer with the domain acme.example is refused with "acme.example already belongs to Acme Corp."
- [ ] Importing a CSV with the header "name,domains,mrr" and the rows "Kestrel,kestrel.example,1200" and "Bluebird,bluebird.example;bluebird.io,75" shows both rows as ready in the preview, then adds them with MRR $1,200 and $75.

### Phase 2: Capture, inbound and triage

```
Using the Customer Feedback Inbox blueprint above, build Phase 2 only.

1. Build the Inbox screen with its tabs, filters, capture form and actions (section 9, screen 1), and the feedback lifecycle in section 7 with R1 to R5, R13 and R15.
2. Build the inbound endpoint exactly as section 11 describes, with tests for a wrong secret, a duplicate external_id, a domain match and no match.
3. Let members create a theme by typing a new name while linking (R5).
4. Build the Activity screen (screen 9).

Do not build ranking, votes, promotion or the roadmap yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The Inbox tab shows Harbor Studio's quote with its MRR ($490), source Call and sender Rosa Diaz; the Linked tab shows four items.
- [ ] Capturing a quote shorter than 10 characters, or with a received date in the future, is refused and saves nothing.
- [ ] Linking Harbor's quote to a new theme typed as "Client progress link" moves it to the Linked tab; typing "single sign-on" as a new theme name links to nothing and shows "A theme called Single sign-on already exists."
- [ ] A POST to /api/inbound with the wrong secret returns 401 and nothing appears.
- [ ] A POST with the right secret from lee@acme.example (external_id "zd-1001") puts the quote in the Inbox tab for Acme Corp with source Email; sending the same external_id again creates nothing new.
- [ ] A POST from nina@newco.example lands in Needs customer, and trying to link it to a theme is refused with "Assign a customer before linking this to a theme."
- [ ] Dismissing Olsen's quote requires a reason; Restore returns it to the Inbox tab with no theme.
- [ ] On the Linked tab, combining the Ticket source filter with the search "SSO" shows only Priya Shah's quote.

### Phase 3: Themes, votes, promotion and the roadmap

```
Using the Customer Feedback Inbox blueprint above, build Phase 3 only.

1. Build the Themes and Theme screens (section 9, screens 2 and 3) with the metrics and ranking in section 6, computed on the server from current rows.
2. Implement votes (R6), promotion (R7), status changes (R8) and owner changes with their notifications (section 10).
3. Build the Roadmap (screen 4).

Do not build the follow-up list yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Themes sorted by Evidence lists Single sign-on (2), CSV export (1), Slack alerts (1); Single sign-on shows 1 account, $2,400 and 2 votes.
- [ ] Recording another vote for Harbor Studio on Single sign-on is refused with "Harbor Studio has already voted for Single sign-on."; its MRR stays $2,400.
- [ ] Moving Tom Becker's call to Slack alerts makes Slack alerts 2 pieces of evidence and $2,549, while Single sign-on keeps $2,400.
- [ ] Promoting Slack alerts without an owner is refused; promoting it with Maya as owner puts it in the Under review lane and the outbox has "You own Slack alerts on the roadmap" for Maya.
- [ ] Creating a theme "Dark mode", recording a vote for Ridgeway and promoting it is refused with "Link at least one piece of feedback before promoting this theme."
- [ ] Signed in as Jo, changing Single sign-on's status is refused; signed in as Sam, moving it to In progress without a note is refused, and with the note "Work started" it moves lanes and the history shows both earlier entries plus the new one.
- [ ] Signed in as Dana, moving Single sign-on to Planned emails Sam "Single sign-on is now Planned".

### Phase 4: Close the loop and export

```
Using the Customer Feedback Inbox blueprint above, build Phase 4 only.

1. Implement the follow-up list (R9), Send update and Mark contacted (R10, R11) on the Theme screen, and the Follow-ups screen (section 9, screen 5).
2. Add the hourly job that retries failed notifications, with a development-only "run job now" control.
3. Implement Delete for admins (R14).
4. Add CSV export of themes (name, status, owner, evidence, accounts, MRR, votes) and of feedback (customer, source, received date, theme, state). Feedback exports never include from_email.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Follow-ups lists Ridgeway as pending for CSV export. Signed in as Maya, Send update queues one email to ella@ridgeway.example using the template, and the follow-up shows "Emailed by Maya Chen".
- [ ] Sending the update to Ridgeway again is refused with a message saying it was already emailed and by whom.
- [ ] Moving Single sign-on to Shipped with a note creates pending follow-ups for Acme Corp and Harbor Studio; Acme's Send update queues emails to priya@acme.example and tom@acme.example, and Harbor offers only Mark contacted.
- [ ] Moving Single sign-on back to In progress cancels its pending follow-ups; shipping it again creates a new pending list.
- [ ] Dana deletes Rosa Diaz's quote: it disappears everywhere, and its feedback_deleted activity entry contains no quote and no email address.
- [ ] Exporting themes downloads a CSV whose Single sign-on row has evidence 2, accounts 1, MRR 2400.00 and votes 2; the feedback CSV has no email column.

## 16. Variations

- Native integrations: a Zendesk or Intercom webhook, Slack message shortcuts, Gong call snippets.
- A public portal where customers vote and comment, with moderation.
- Customer segments (plan, region, size) and filters on the Themes screen.
- A weighted score (for example evidence × MRR) shown next to the raw metrics, never replacing them.
- Release notes generated from shipped themes.
- Duplicate detection that suggests themes for new quotes.
