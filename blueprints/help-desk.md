<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/help-desk . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Help Desk

Blueprint BP-013 · Department: Support · Replaces: Zendesk (Support Team), the shared support inbox
For teams of 2 to 25 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Support requests land in a shared inbox and nobody knows who is answering what."

With a shared inbox, two people answer the same customer while another email waits three days for anyone. Nobody can say how long customers wait for a first reply, internal discussion happens in forwarded threads the customer might see, and a reply to an old conversation gets lost because it looks like a new email.

This blueprint turns every request into a ticket with one assignee and a status. Replies go out from the ticket and come back to it. The queue shows what is waiting on the team, oldest first, and each ticket shows how long until its first-response target is missed.

## 2. What the real product does

Research basis: Zendesk's pricing page (zendesk.com/pricing) and its help center articles "About the ticket lifecycle and ticket statuses" and "Creating ticket triggers for automatic ticket updates and notifications" (support.zendesk.com/hc/en-us/articles/8263915942938 and /4408886797466), October 2026.

What we verified:

1. **Price.** Zendesk prices per agent per month. Support Team is $19 paid yearly ($25 paid monthly), Suite Team $55 ($69 monthly) and Suite Professional $115 ($149 monthly). Support Team lists an email and ticketing system, ticket routing, prebuilt analytics dashboards, pre-written responses, customer context, and automations and triggers. Suite Team adds AI agents, an AI knowledge base, omnichannel routing, messaging and live chat, and telephony. Suite Professional adds skills-based routing, an IVR phone tree and more AI tools.
2. **Statuses.** Six standard statuses. New: no action taken yet; a ticket can never go back to New. Open: assigned and waiting on the agent. Pending: waiting on the requester; when the requester replies, the ticket is set back to Open automatically. On-hold (optional): waiting on someone other than the requester; the requester sees it as Open. Solved: the agent has submitted a solution. Closed: set only by the system; it cannot be chosen manually and the requester can no longer reopen it.
3. **Lifecycle.** Assigning an agent changes a New ticket to Open. A requester's reply to a Solved ticket reopens it. Tickets are closed by an automation; by default four days after they are solved, and never later than 28 days after solving. A requester (or agent) can create a follow-up to a closed ticket, which references the original.
4. **Triggers.** Business rules that run, in order, right after a ticket is created or updated; for example, notifying the customer when a ticket has been opened.

### What this blueprint keeps

Tickets from email and a web form, each with a requester, a subject, a status, a priority and one assignee; Zendesk's six statuses and its lifecycle rules (assignment opens a ticket, a requester's reply reopens Pending, On-hold and Solved tickets, Closed only by the system four days after Solved, follow-ups to closed tickets); public replies emailed to the requester and internal notes that never are; email threading by ticket number and message headers; queues for Unassigned, Mine, All open, Pending and Solved; a warning when someone else replied while you were writing; first-response targets per priority with a due-soon and overdue flag; canned replies; a requester's ticket history; weekly reports; CSV export; and deleting a requester's data on request.

### What this blueprint deliberately leaves out

Live chat, messaging apps, phone and social channels; AI agents, AI replies and a knowledge base or help center; a trigger and automation builder (v1 has a fixed set of rules); skills-based and omnichannel routing; business-hours targets (v1 counts calendar hours); multiple brands and support addresses; satisfaction surveys; side conversations and light agents; and integrations. These matter to support teams handling many channels and high volume. A team of 2 to 25 people answering email needs one owner per ticket, clean threads, and to know what is late. If you need chat, phone or a help center, Zendesk's Suite plans include them.

## 3. Scope of v1

- One company, one support address (for example support@northwind.example), one team time zone (Settings; default America/New_York).
- Channels: email (through an inbound endpoint fed by your email provider) and a public web form. Agents can also open a ticket on a customer's behalf.
- Requesters never sign in. They reply by email.
- First-response targets in calendar hours, by priority.
- Email goes out through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Agent | Everyone on the support team | See every ticket and requester. Reply, add internal notes, assign (to themselves or anyone active), change status and priority, use and create canned replies, open tickets for customers, export CSV. |
| Admin | One or more agents | Everything an agent can do. Manage agents, settings and first-response targets, edit or delete anyone's canned replies, delete a requester's data (R14), read the outbox. |
| Requester | A customer, by email or the web form | Open tickets, reply to them by email, and receive public replies. Never sees internal notes, assignees or priorities. |

The server enforces all of this. Hiding a button is not a permission check.

## 5. Data model

All IDs are strings. Timestamps are UTC.

**Agent**
- id, name (required), email (required, unique, stored lowercase), is_admin (boolean, default false), active (boolean, default true)

**Settings** (one row)
- company_name (required), support_email (required; the address customers write to and replies come from), time_zone (IANA, default America/New_York)
- target_urgent_minutes (default 60), target_high_minutes (default 240), target_normal_minutes (default 480), target_low_minutes (default 1440); each 15 to 10,080
- auto_close_days (integer 1 to 28, default 4)
- acknowledgement_template (text sent when a ticket is created; may use {requester_first_name}, {ticket_number}, {subject})

**Requester**
- id, email (required, unique, stored lowercase), name (optional, max 100), created_at

**Ticket**
- id, number (integer, sequential from 1001, never reused)
- subject (required, 1 to 150 characters), requester_id, channel: email | web | agent
- status: new | open | pending | on_hold | solved | closed
- priority: low | normal | high | urgent (default normal)
- assignee_id (nullable, an active Agent)
- follow_up_of (nullable ticket id)
- created_at, first_response_at (nullable), first_response_due_at, solved_at (nullable), closed_at (nullable), updated_at
- version (integer, starts at 1, goes up on every change; R13)

**Message**
- id, ticket_id
- kind: requester | public_reply | internal_note
- author_agent_id (nullable; set for public replies and notes)
- body (plain text, 1 to 20,000 characters)
- email_message_id (nullable, unique; the Message-ID header of an email received or sent)
- created_at

**CannedReply**
- id, title (unique ignoring case, 1 to 80), body (1 to 5,000; may use {requester_first_name}, {ticket_number}, {agent_first_name}), created_by, updated_at

**Event** (append-only; never edited or deleted, except by R14)
- id, ticket_id (nullable), actor_agent_id (nullable for the requester and the system)
- type: created | requester_replied | replied | note_added | assigned | status_changed | priority_changed | reopened | follow_up_created | closed | requester_deleted
- data (JSON, nullable: from/to values), created_at

**Notification** (outbox)
- id, kind: acknowledgement | public_reply | assignment
- to_email, ticket_id (nullable), subject, body, message_id_header, in_reply_to_header (nullable)
- status: pending | sent | logged | failed, error (nullable), created_at, sent_at

## 6. Ticket lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create (email or web form) | Requester | (none) | new | Requester found by email or created; number assigned; first_response_due_at set (R5); acknowledgement emailed with "[#1042]" in the subject |
| Create for a customer | Agent | (none) | open | Assigned to the creating agent; the first message is a public reply, which counts as the first response; channel agent |
| Assign | Agent | new, open, pending, on_hold | open if it was new, otherwise unchanged | The assignee is emailed if it is someone else |
| Public reply | Agent | new, open, pending, on_hold, solved | the status chosen in the reply box (Open, Pending, On-hold or Solved) | Emailed to the requester (R8); sets first_response_at if empty; assigns to the replier if unassigned |
| Internal note | Agent | any except closed | unchanged | Never emailed (R7) |
| Change status | Agent | new, open, pending, on_hold, solved | open, pending, on_hold or solved | Solving needs an assignee (R4); sets or clears solved_at |
| Requester replies | Requester (email) | pending, on_hold, solved | open | Reopen; event `reopened` when it was solved |
| Requester replies | Requester (email) | new, open | unchanged | Message added |
| Requester replies | Requester (email) | closed | (new ticket) | A follow-up ticket is created (R3) |
| Close | System (section 11) | solved | closed | Only when solved_at is auto_close_days or more ago; final |

No action sets a ticket back to New, and no person can set Closed. A closed ticket cannot be changed in any way.

## 7. First-response targets

- **R5.** On creation, first_response_due_at = created_at + the target for the ticket's priority. Changing the priority before the first response recalculates it from created_at. After the first response, the target no longer changes.
- The first response is the first public reply by an agent. Internal notes, the acknowledgement email and status changes do not count.
- Each ticket without a first response shows its target state: **Overdue** when now is past first_response_due_at, **Due soon** when less than 25% of its target time remains, otherwise **Due in** the remaining time ("Due in 1 h 10 min"). Tickets with a first response show "Responded in 2 h 5 min" (the time between created_at and first_response_at).
- Targets count calendar hours, 24 hours a day. Business hours are a variation.

### Worked examples (seed data in section 14; T is the moment the seed is loaded)

| Ticket | Priority | Created | Target | Due | State at T |
|---|---|---|---|---|---|
| #1001 Password reset email never arrives | High | T-3 h | 4 h | T+1 h | Due soon (1 h of 4 h left) |
| #1002 Invoice shows the wrong company name | Normal | T-9 h | 8 h | T-1 h | Overdue by 1 h |
| #1003 How do I add a teammate? | Normal | T-26 h | 8 h | T-18 h | Responded in 2 h |
| Change #1002 to Urgent before replying | Urgent | T-9 h | 1 h | T-8 h | Overdue by 8 h |
| Change #1001 to Low before replying | Low | T-3 h | 24 h | T+21 h | Due in 21 h |

## 8. Business rules

- **R1. New and Open.** A ticket is New until it is assigned or gets its first public reply, and never returns to New. Assigning a New ticket makes it Open.
- **R2. Status choices.** Agents can set Open, Pending, On-hold or Solved. They can never set New or Closed. A ticket on Pending waits for the requester; On-hold waits for someone else and is shown to the requester as Open.
- **R3. Requester replies.** A requester email that belongs to a ticket (R11) adds a requester message. On Pending, On-hold or Solved the ticket becomes Open. On a Closed ticket it creates a new ticket with the same requester and subject, follow_up_of set to the closed ticket, status New and its own first-response target, and the closed ticket stays unchanged.
- **R4. Solving needs an owner.** A ticket can be solved only if it has an assignee: "Assign this ticket before solving it."
- **R6. One assignee.** A ticket has at most one assignee, who must be an active agent. Deactivating an agent with tickets that are not solved or closed is refused: "Reassign Jo Park's 2 open tickets first."
- **R7. Internal notes stay internal.** Notes are never emailed, never quoted in replies, and never included in anything the requester receives.
- **R8. Replies by email.** Every public reply is written to the outbox as an email to the requester, from support_email, with the subject "Re: {subject} [#{number}]", a new Message-ID header, and In-Reply-To set to the last email in the thread. The body is the reply only; it never includes notes, other requesters' details or the assignee's email address.
- **R9. Canned replies** insert their body into the reply box with placeholders filled in. The agent can edit before sending. They never send on their own.
- **R10. Validation.** Subjects 1 to 150 characters, messages 1 to 20,000 characters, requester emails valid and stored lowercase. Message text is shown as text, never as HTML.
- **R11. Threading.** An inbound email belongs to a ticket if its subject contains "[#{number}]" for an existing ticket with the same requester email, or if its In-Reply-To or References headers match a Message-ID the app sent or received for that ticket. Otherwise it creates a new ticket.
- **R12. No duplicates.** An inbound email whose Message-ID was already received creates nothing (the endpoint returns 200 with the existing ticket number).
- **R13. Stale replies.** The reply box remembers the ticket's version when it was opened. If the ticket changed since then (someone else replied, added a note or changed it), sending is stopped with "Ben Cho replied 2 minutes ago. Review the ticket before sending." The agent's draft is kept. Sending again after reviewing goes through.
- **R14. Deleting a requester.** An admin can delete a requester's data on request: their tickets, messages and outbox rows are removed, and one `requester_deleted` event is kept with the admin, the time and the number of tickets, but no email address, name or text.
- **R15. Events.** Every successful action writes the events in section 6. Events are never edited or deleted outside R14.

## 9. Screens

1. **Queues** (home). A sidebar with Unassigned (New or Open with no assignee), Mine (assigned to me, not Solved or Closed), All open (New, Open, On-hold), Pending, and Solved (solved in the last 30 days), each with a count. The list shows number, subject, requester, status, priority, assignee, the first-response state (section 7) and the last update. Unassigned and Mine sort by first_response_due_at (overdue first), then by updated_at, oldest first. A search box matches the number, subject, requester email and message text.
2. **Ticket.** Subject, number, requester (with a link to their history), status, priority, assignee (with "Take it"), follow-up link if any, the first-response state, then the thread: requester messages, public replies and internal notes (notes visibly marked "Internal"). The reply box has a Public reply / Internal note switch, a canned reply picker, and a submit button that sets the status ("Submit as Open", "Submit as Pending", "Submit as On-hold", "Submit as Solved").
3. **Requester.** Name, email and every ticket they opened.
4. **New ticket** (agent). Requester email, name, subject, first message (sent as a public reply), priority.
5. **Support form** (public, /support). Name, email, subject, message, and a hidden honeypot field; at most 5 submissions per IP hash per hour. On success: "Thanks. Your request number is #1042. We've emailed you a copy."
6. **Reports.** For each of the last 8 weeks (Monday to Sunday, team time zone): tickets created, tickets solved, median first-response time, and the share of first responses within target.
7. **Admin: Agents**, **Admin: Settings** (targets, auto-close days, acknowledgement template), **Canned replies**, **Admin: Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Ticket created by email or web form | Requester | "[#{number}] {subject}" using acknowledgement_template |
| Public reply | Requester | "Re: {subject} [#{number}]" (R8) |
| Assigned to someone else | The new assignee | "Assigned to you: [#{number}] {subject}" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried by the job up to 5 times. A notification failure never blocks the action that caused it.

## 11. Inbound email and the scheduled job

**Inbound endpoint.** `POST /api/inbound/email`, called by your email provider's inbound webhook (most providers can post parsed email as JSON, or you can adapt their format in one small function). Require the header `Authorization: Bearer <INBOUND_SECRET>` and compare it in constant time; a wrong or missing secret returns 401 and saves nothing. JSON body: `message_id` (required), `from_email` (required), `from_name`, `subject`, `text` (required), `in_reply_to`, `references` (array), `received_at`. Apply R11 and R12. Strip quoted earlier replies below a line starting with "On ... wrote:" when it is clearly a quote; keep the full text otherwise. Ignore emails sent from support_email itself (they are the app's own replies coming back).

**Scheduled job** (hourly, protected by a CRON_SECRET header, with a development-only "run job now" control):
1. **Close** every Solved ticket whose solved_at is auto_close_days or more ago: status closed, closed_at set, event `closed`.
2. **Retry** failed notifications.

All time reads go through one function that adds the development clock offset.

## 12. Reports

- Median first-response time is computed over tickets created in the week that have a first response, in minutes, shown as "2 h 5 min". Weeks with none show "–".
- Within target = tickets created in the week whose first response came on or before first_response_due_at, divided by tickets created in the week that have a first response, as a whole percent.
- Export CSV of the current queue or search: number, subject, requester email, status, priority, assignee, created, first response, solved, closed. No message text.

## 13. Edge cases

- A customer replies to an acknowledgement email: the subject contains "[#1042]", so it is added to #1042.
- A customer starts a new email thread about the same problem: it becomes a new ticket. Merging is a variation.
- Someone else's address replies with "[#1042]" in the subject: the requester email does not match, so it becomes a new ticket (R11).
- An email arrives twice from the provider (retry): the second has the same Message-ID and is ignored (R12).
- An agent solves a ticket, the customer says "thanks!": the ticket reopens to Open (R3). The agent solves it again; the auto-close clock restarts from the new solved_at.
- Ticket numbers keep increasing even when a requester's data is deleted.

## 14. Seed data

Settings: company "Northwind", support email support@northwind.example, time zone America/New_York, default targets, auto-close after 4 days, acknowledgement template "Hi {requester_first_name}, we've received your request #{ticket_number} ({subject}). We'll reply as soon as we can. Northwind support".

Agents: Dana Ruiz (admin), Jo Park, Ben Cho. All active.

Canned replies: "Password reset steps" ("Hi {requester_first_name}, you can reset your password from the sign-in page with 'Forgot password'. If the email doesn't arrive within 5 minutes, check spam and reply here. {agent_first_name}") and "Billing date change" (a short reply about changing the billing date).

Tickets (T is when the seed is loaded; all messages plain text):

| # | Subject | Requester | Status | Priority | Assignee | Created | First response | Notes |
|---|---|---|---|---|---|---|---|---|
| 1001 | Password reset email never arrives | Max Ford, max@bluebird.example | New | High | none | T-3 h | none | |
| 1002 | Invoice shows the wrong company name | Ella Brooks, ella@ridgeway.example | New | Normal | none | T-9 h | none | |
| 1003 | How do I add a teammate? | Kim Olsen, kim@olsen.example | Open | Normal | Jo Park | T-26 h | T-24 h | Last message from Kim at T-1 h |
| 1004 | Export to CSV fails over 5,000 rows | Priya Shah, priya@acme.example | On-hold | High | Ben Cho | T-50 h | T-49 h | Internal note from Ben: "Waiting on engineering, bug 3141." |
| 1005 | Can we change our billing date? | Tom Becker, tom@acme.example | Pending | Normal | Jo Park | T-30 h | T-28 h | Jo asked which date they want |
| 1006 | Bulk import question | Rosa Diaz, rosa@harbor.example | Solved (T-2 days) | Normal | Ben Cho | T-3 days | T-3 days + 1 h | |
| 1007 | Where do I download invoices? | Lee Grant, lee@pinelabs.example | Solved (T-5 days) | Low | Jo Park | T-6 days | T-6 days + 3 h | |
| 1008 | Login loop on Safari | Max Ford, max@bluebird.example | Closed (solved T-14 days, closed T-10 days) | Normal | Ben Cho | T-15 days | T-15 days + 2 h | |

Each seeded message has a Message-ID of the form "<{ticket number}.{position}@northwind.example>", where position counts the ticket's messages from 1. For example, #1006 has Rosa's question (<1006.1@northwind.example>) and Ben's reply that solved it (<1006.2@northwind.example>).

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Help Desk blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Agent; anyone else sees "Ask an admin to add you."
3. Build Admin: Agents, Admin: Settings and Canned replies (section 9, screen 7). Only admins can change agents and settings; enforce R6 for deactivation, on the server.
4. Load the seed data from section 14, with times relative to now.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build queues, tickets or email yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin: Settings shows the four first-response targets (1 h, 4 h, 8 h, 24 h) and auto-close after 4 days.
- [ ] Signed in as Jo, Admin: Agents says "Only admins can open this page." and a direct request to change settings is refused.
- [ ] Deactivating Jo Park is refused with "Reassign Jo Park's 2 open tickets first." (tickets #1003 and #1005).
- [ ] Creating a canned reply titled "password reset steps" is refused because the title already exists.

### Phase 2: Queues, tickets and replies

```
Using the Help Desk blueprint above, build Phase 2 only.

1. Build Queues, Ticket, Requester and New ticket (section 9, screens 1 to 4) and the public support form (screen 5).
2. Implement every action in section 6 except inbound email and the scheduled job, with R1, R2, R4, R6 to R10, R13 and R15 enforced on the server.
3. Implement the first-response targets and states in section 7.
4. Write acknowledgement, public reply and assignment emails to the outbox exactly as R8 and section 10 describe, and build Admin: Outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Unassigned lists #1002 (Overdue by 1 h) above #1001 (Due soon), and Mine for Jo lists #1003 and #1005.
- [ ] Changing #1001's priority to Low shows "Due in 21 h"; changing it back to High shows Due soon again.
- [ ] Signed in as Jo, "Take it" on #1001 makes it Open and assigned to Jo; it disappears from Unassigned.
- [ ] Jo sends a public reply on #1001 using the "Password reset steps" canned reply, submitted as Pending: the outbox has one email to max@bluebird.example with the subject "Re: Password reset email never arrives [#1001]" and "Max" filled in, and #1001 shows "Responded in" with the time since it was created.
- [ ] An internal note on #1004 appears marked Internal and adds nothing to the outbox.
- [ ] Solving #1002 while it is unassigned is refused with "Assign this ticket before solving it."
- [ ] With #1003 open in two browser windows as Jo and Ben, Ben replies first; Jo's reply is stopped with a message naming Ben, keeps her draft, and goes through when she sends again.
- [ ] Submitting the public support form creates ticket #1009 as New with first-response due 8 hours later, and the outbox has its acknowledgement with "[#1009]" in the subject.

### Phase 3: Email in, threading and follow-ups

```
Using the Help Desk blueprint above, build Phase 3 only.

1. Build the inbound endpoint in section 11 with R3, R11 and R12, including the secret check, ignoring the app's own address, and stripping clearly quoted replies.
2. Make the requester's reply reopen Pending, On-hold and Solved tickets, and create follow-up tickets for closed ones (R3), with the events in section 6.
3. Add tests for: a wrong secret, a duplicate Message-ID, a subject reference with a different requester, an In-Reply-To match, and a reply to a closed ticket.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] A POST without the right secret returns 401 and creates nothing.
- [ ] An email from tom@acme.example with the subject "Re: Can we change our billing date? [#1005]" adds a requester message to #1005 and sets it from Pending to Open.
- [ ] Sending the same email again (same message_id) creates nothing.
- [ ] An email from rosa@harbor.example with no ticket number in the subject and the In-Reply-To <1006.2@northwind.example> reopens #1006 from Solved to Open.
- [ ] An email from max@bluebird.example with "[#1008]" in the subject creates a new ticket that shows "Follow-up of #1008", while #1008 stays Closed.
- [ ] An email from someone@else.example with "[#1003]" in the subject creates a new ticket instead of joining #1003.
- [ ] An email from a new address with no reference creates a New ticket and an acknowledgement in the outbox.

### Phase 4: Auto-close, reports and data deletion

```
Using the Help Desk blueprint above, build Phase 4 only.

1. Build the scheduled job in section 11 (close, retry), protected by a CRON_SECRET header, with a development-only "run job now" control that uses the development clock.
2. Build Reports and the CSV export (section 9, screen 6, and section 12).
3. Implement R14 for admins.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Running the job closes #1007 (solved 5 days ago) and leaves #1006 Solved; after moving the clock forward 2 days and running it again, #1006 is Closed too.
- [ ] A closed ticket shows no reply box or status control, and a direct request to change it is refused.
- [ ] Reports for the current week show the number of tickets created and solved and a median first-response time, and a week with no responses shows "–".
- [ ] Exporting All open downloads a CSV with #1001, #1002, #1003 and #1004 and no message text.
- [ ] Dana deletes Max Ford's data: #1001 and #1008 disappear, their outbox rows are gone, and the requester_deleted event contains no email address or name.

## 16. Variations

- Business-hours targets with a weekly schedule and holidays.
- Next-reply targets, not only first response.
- Merging duplicate tickets from the same requester.
- A satisfaction rating link in the Solved email.
- Simple automatic assignment (round robin among agents who are in).
- A small help center: articles linked from the support form.
- Slack notifications for urgent tickets.
