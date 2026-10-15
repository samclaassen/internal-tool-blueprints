<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/contract-tracker . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Contract Tracker

Blueprint BP-032 · Department: Finance · Replaces: ContractSafe, contracts in shared folders, renewals discovered on the invoice
For teams of 5 to 200 people with customer, supplier and property contracts to keep track of.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We found out the contract had renewed for another year when the invoice arrived."

A growing company signs contracts with customers, suppliers, landlords and insurers. The PDFs live in a shared folder and people's inboxes. Nobody tracks notice periods, so contracts renew automatically after the window to cancel has closed, and when someone asks "what are we committed to next year?" the answer takes a week.

This blueprint is a contract register: each contract with its counterparty, owner, value, dates, renewal terms and documents; the notice deadline worked out for every auto-renewing contract; reminders to the owner before each deadline; a recorded decision (renew, renegotiate or cancel); automatic roll-over when a contract renews; and a dashboard of what is coming up.

## 2. What the real product does

Research basis: ContractSafe's pricing page (contractsafe.com/pricing), October 2026, in US dollars.

What we verified:

1. **Pricing by features and contract volume, prepaid annually.** Organize starts at $450 a month, Finalize at $660 and Maximize at $815; the price rises with the number of active contracts (bands from 100 or fewer to more than 10,000).
2. **Every plan includes** unlimited users, a free trial, onboarding and training, data and document migration, unlimited archive and attachments, and a dedicated customer success manager.
3. **Organize** includes secure storage, search, unlimited date reminders and alerts, tagging, AI data extraction and contract chat, custom fields, simple editing, dashboards and reports, and custom roles. **Finalize** adds DocuSign and Word integrations, single sign-on, Zapier, redlining, approval workflows, e-signature and commenting. **Maximize** adds APIs, a Salesforce integration, intake forms, templates, lifecycle tracking and AI contract review.

At the entry price, Organize costs $5,400 a year, prepaid.

### What this blueprint keeps

A contract register with counterparty, type, owner, value, dates, renewal terms, tags and documents; notice deadlines calculated for auto-renewing contracts; reminders before notice deadlines and expiry dates; recorded decisions with evidence; automatic roll-over to the next term; confidential contracts; a dashboard of deadlines and commitments; search; CSV export.

### What this blueprint deliberately leaves out

AI extraction from PDFs and contract chat, full-text search inside documents, redlining and editing, approval workflows (see the Approval Workflow blueprint), e-signature, templates and intake forms, integrations, and SSO. For software subscriptions in particular, see the SaaS Spend Tracker blueprint.

## 3. Scope of v1

- One company, one time zone (Settings; default America/Chicago), one currency (integer cents).
- Documents are uploaded PDFs (up to 25 MB each), stored privately; a contract can have several (original, amendments, renewals).
- Dates are calendar dates; "days" are calendar days.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Finance or operations lead, legal | Everything: settings, people, every contract including confidential ones, reports, export. |
| Owner | Whoever is responsible for a contract | Edit their contracts, upload documents, record decisions; receives the reminders. |
| Member | Everyone else | See and search contracts that aren't confidential; no editing. |

Confidential contracts are visible only to their owner and admins. The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, time_zone, notice_reminder_days (60, 30, 7), expiry_reminder_days (90, 30).

**Person**: id, name, email (unique, lowercase), role: admin | member, active.

**Counterparty**: id, name (unique), kind: customer | supplier | landlord | insurer | other, contact_email.

**Contract**
- id, number (C-001), title, counterparty_id, type (such as Customer agreement, Services, Lease, NDA, Insurance, Software), owner_id, confidential, tags
- annual_value_cents (0 for no value), start_date, end_date (empty for evergreen contracts), auto_renew, renewal_term_months, notice_days
- status: active | ending | ended, decision: none | renew | renegotiate | cancel, decision_note, notice_sent_on, late_notice (boolean)

**Document**: id, contract_id, label (Original, Amendment 1, Renewal 2027), file storage key, uploaded_at, uploaded_by.

**ReminderSent**: contract_id, kind: notice | expiry, days_before, for_date, sent_on. Unique on contract, kind, days_before and for_date.

**Term** (append-only history): contract_id, start_date, end_date, how: signed | auto_renewed | extended.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Key dates

- **Notice deadline** (auto-renewing contracts with an end date) = end_date − notice_days. That is the last day to tell the counterparty you won't renew.
- **Reminders**: for auto-renewing contracts, notice_reminder_days before the notice deadline (60, 30 and 7 days), to the owner, with admins copied on the last one; for contracts that don't auto-renew, expiry_reminder_days before the end date (90 and 30 days). Each reminder is sent once (ReminderSent), on the first daily run on or after its date.
- **Evergreen** contracts (no end date) have no deadline; they show "Ends with {notice_days} days' notice".
- **Roll-over**: on the day after the end date of an auto-renewing contract whose decision isn't cancel, a new term starts: start = end + 1 day, end = end + renewal_term_months; reminders start again for the new deadline, and the owner is emailed "Renewed automatically".
- **Ending**: a contract with decision cancel (or that doesn't auto-renew) becomes ended the day after its end date.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Contract | Terms | Key date | Reminders |
|---|---|---|---|
| Acme master services agreement | Ends Jan 31, 2027, auto-renews 12 months, 90 days' notice | Notice deadline Nov 2, 2026 | Sep 3 and Oct 3 (sent), Oct 26 |
| Zendesk subscription | Ends Dec 15, 2026, auto-renews 12 months, 30 days' notice | Notice deadline Nov 15, 2026 | Sep 16 (sent), Oct 16, Nov 8 |
| Bluebird NDA | Ends Mar 1, 2027, doesn't renew | Expires Mar 1, 2027 | Dec 1, Jan 30 |
| Van lease | Ends Oct 31, 2026, doesn't renew | Expires in 16 days | Aug 2 and Oct 1 (sent) |
| Office cleaning | Evergreen, 30 days' notice | "Ends with 30 days' notice" | None |
| If nobody decides on Zendesk | | Dec 16, 2026: a new term to Dec 15, 2027 starts | Next notice deadline Nov 15, 2027 |

## 7. Decisions

| Decision | Who | Rule |
|---|---|---|
| Renew | Owner or admin | Records the choice; the roll-over happens on its date |
| Renegotiate | Owner or admin | Records the choice and a note; reminders continue until the deadline |
| Cancel | Owner or admin | Needs notice_sent_on and a note (and usually a document, such as the notice letter); status becomes ending. If notice_sent_on is after the notice deadline, ask for confirmation and set late_notice, shown as "Late notice: check with the counterparty" |
| Undo | Admin | Before the end date, with a reason |

## 8. Business rules

- **R1. Dates.** end_date is after start_date; notice_days is 0 to 365; renewal_term_months is 1 to 60 and required when auto_renew is on.
- **R2. Key dates and reminders** follow section 6, run by a daily job at 08:00 that is safe to run twice.
- **R3. Roll-over** follows section 6 and writes a Term row and an event; it never runs for a contract with decision cancel.
- **R4. Decisions** follow section 7, and are kept in the event log.
- **R5. Confidential** contracts, and their documents, are visible only to the owner and admins, everywhere: lists, search, dashboard, export and direct requests.
- **R6. Documents** are PDFs up to 25 MB, stored privately, downloaded only by people who can see the contract.
- **R7. Commitments.** The dashboard's committed value for the next 12 months = for each active or ending contract with a value, annual_value_cents × the share of the next 12 months its current term covers, counting a roll-over only if its decision is renew.
- **R8. Ownership.** Every active contract has an active owner; deactivating a person requires reassigning their contracts first.
- **R9. Search** matches the contract title, number, counterparty, type and tags.
- **R10. Events.** Every change writes an event; events and terms are never edited or deleted.

## 9. Screens

1. **Dashboard** (home): notice deadlines in the next 90 days, contracts expiring in the next 90 days, decisions waiting, late notices, and committed value for the next 12 months by type.
2. **Contracts**: search and filters (type, owner, counterparty, status, tag, auto-renew), with key date and value columns.
3. **Contract page**: details, key dates and the reminders sent and due, terms history, documents, decision panel, and the event log.
4. **Counterparties**: each with its contracts.
5. **Calendar feed** (/calendar/<token>.ics) of notice deadlines and expiry dates for the contracts each person can see.
6. **People**, **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Notice reminder | Owner (admins copied on the 7-day one) | "Notice deadline in 30 days: Zendesk subscription (Nov 15)" |
| Expiry reminder | Owner | "Expires in 90 days: Bluebird NDA (Mar 1)" |
| Renewed automatically | Owner | "Renewed: Zendesk subscription, now to Dec 15, 2027" |
| Decision recorded | Admins | "Cancel recorded: Zendesk subscription (notice sent Nov 10)" |
| Late notice | Owner and admins | "Late notice: Zendesk subscription; check with Zendesk" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so reminders, deadlines and roll-overs can be tested by moving the clock.

## 12. Export

Admins export contracts as CSV: number, title, counterparty, type, owner, confidential, annual value, start, end, auto-renew, renewal term, notice days, notice deadline, decision, status. Members' exports leave out confidential contracts.

## 13. Edge cases

- A notice deadline falls on a weekend: the deadline stays as calculated; the reminders say which weekday it is.
- notice_days is longer than the term: the notice deadline is before the start of the term; the contract shows "Notice deadline already passed" from day one.
- An end date in the past for an auto-renewing contract when it is entered: it rolls over on the next daily run, as many terms as needed, each recorded.
- A contract's end date changes: reminders already sent stay sent; new ones follow the new dates.
- An owner leaves: admins reassign; future reminders go to the new owner.

## 14. Seed data

Company "Harbor Logistics", time zone America/Chicago. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@harborlogistics.example): Grace Kim (admin, finance lead), Omar Ali (member, sales director), Priya Nair (member, operations manager), Ben Cole (member, IT lead).

| # | Contract | Counterparty | Type | Owner | Annual value | Dates and terms | Notes |
|---|---|---|---|---|---|---|---|
| C-001 | Acme master services agreement | Acme Corp (customer) | Customer agreement | Omar | $120,000 | Feb 1, 2026 to Jan 31, 2027; auto-renews 12 months; 90 days' notice | Reminders for Sep 3 and Oct 3 sent |
| C-002 | Zendesk subscription | Zendesk (supplier) | Software | Ben | $2,280 | Dec 16, 2025 to Dec 15, 2026; auto-renews 12 months; 30 days' notice | Reminder for Sep 16 sent |
| C-003 | Bluebird NDA | Bluebird Ltd (other) | NDA | Omar | none | Mar 1, 2025 to Mar 1, 2027; doesn't renew | |
| C-004 | Van lease | Fleetway Leasing (supplier) | Lease | Priya | $14,400 | Nov 1, 2023 to Oct 31, 2026; doesn't renew | Reminders for Aug 2 and Oct 1 sent |
| C-005 | Office cleaning | Sparkle Services (supplier) | Services | Priya | $9,600 | From Jan 1, 2025, evergreen; 30 days' notice | |
| C-006 | Warehouse lease | Lakeside Properties (landlord) | Lease | Grace | $96,000 | Jan 1, 2024 to Dec 31, 2028; doesn't renew; confidential | |

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and the register

```
Using the Contract Tracker blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database and private document storage.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Contracts, the Contract page with documents, Counterparties, People and Settings (section 9, screens 2 to 4 and 6), with key dates (section 6) shown on each contract, and R1, R5, R6, R8 and R9 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The Acme agreement shows a notice deadline of Nov 2, 2026, the Zendesk subscription Nov 15, 2026, and Office cleaning "Ends with 30 days' notice".
- [ ] Signed in as Omar, the warehouse lease (confidential) doesn't appear in the list, in search or by a direct request; signed in as Grace, it does.
- [ ] Saving a contract with auto-renew on and no renewal term is refused, and uploading a 30 MB file or a non-PDF is refused.
- [ ] Searching "lease" as Priya finds the Van lease only.

### Phase 2: Reminders, decisions and roll-over

```
Using the Contract Tracker blueprint above, build Phase 2 only.

1. Build the daily job with notice and expiry reminders (R2) and roll-over (R3), and the decision panel (section 7, R4).
2. Write the emails in section 10 to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Running the job today sends nothing; moving the clock to Oct 16 and running it sends Ben the 30-day notice reminder for Zendesk, and running it again sends nothing more.
- [ ] Moving the clock to Nov 1 and running the job ends the Van lease.
- [ ] Moving the clock to Nov 5, Omar records Cancel on the Acme agreement with notice sent that day: he is asked to confirm, the contract is marked "Late notice", and Omar and Grace are emailed.
- [ ] Moving the clock to Nov 10, Ben records Cancel on Zendesk with notice sent that day and its status becomes ending; moving the clock to Dec 16 and running the job ends it instead of renewing.
- [ ] After a reset, moving the clock to Dec 16 with no decision on Zendesk and running the job starts a new term to Dec 15, 2027, shows the next notice deadline as Nov 15, 2027, and emails Ben "Renewed automatically".

### Phase 3: Dashboard and calendar

```
Using the Contract Tracker blueprint above, build Phase 3 only.

1. Build the Dashboard (section 9, screen 1) with committed value (R7), and the calendar feed (screen 5).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The dashboard lists the Acme (Nov 2) and Zendesk (Nov 15) notice deadlines and the Van lease expiring Oct 31, and, signed in as Omar, no confidential contracts.
- [ ] Recording Renew on the Acme agreement removes it from "decisions waiting" and counts its renewal in the next 12 months' committed value.
- [ ] Priya's calendar feed lists the Van lease's end date and not the warehouse lease.

### Phase 4: Export

```
Using the Contract Tracker blueprint above, build Phase 4 only.

1. Build the CSV export (section 12) with R5.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Grace's export lists all six contracts with notice deadlines; Omar's leaves out the warehouse lease.
- [ ] The export shows the Zendesk notice deadline as 2026-11-15 and the Office cleaning notice deadline empty.
- [ ] Deactivating Priya is refused while she owns active contracts.

## 16. Variations

- Full-text search inside uploaded PDFs.
- AI suggestions for dates and terms from an uploaded contract, confirmed by a person.
- An approval step before a contract is signed (see the Approval Workflow blueprint).
- A Slack message with the week's deadlines.
- Obligations tracking: deliverables and SLAs due under each contract.
