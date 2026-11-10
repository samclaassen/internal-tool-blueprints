<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/invoice-reminders . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

# Invoice Reminders

Blueprint BP-026 · Department: Finance · Replaces: Chaser, the overdue invoices spreadsheet, reminders sent by hand
For teams of 2 to 50 people who invoice business customers and wait to be paid.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Every Friday I go through the overdue list and write the same polite emails by hand."

A small agency or services firm sends invoices from its accounting software, then chases late payers from a spreadsheet. Reminders go out when someone remembers, a customer who promised to pay on Tuesday gets chased on Monday, a disputed invoice gets a "final notice", and nobody can say how much is more than 30 days late without an afternoon in the accounting software.

This blueprint imports open invoices from your accounting software's CSV export and sends reminders on a schedule you set: a heads-up before the due date, then firmer emails after it. It bundles each customer's invoices into one email a day, skips anything paid, disputed, paused or promised, keeps every note and promise on the invoice, lists the accounts that need a phone call, and shows an aging report.

## 2. What the real product does

Research basis: Chaser's pricing page (chaserhq.com/pricing), United States prices, October 2026.

What we verified:

1. **Plans are priced by your company's annual revenue, per month.** Compact: $233 billed yearly or $259 billed monthly, for revenue under $5 million, with 4 users, 30 follow-up templates and 4 automated receivables workflows. Core: $700 yearly or $779 monthly, for revenue under $13 million, with unlimited users, templates and workflows and multi-entity support. Complete: $1,050 yearly or $1,169 monthly, for revenue under $120 million, adding a dedicated account manager, priority support and a receivables forecast. Custom pricing above that. Yearly billing saves 10%.
2. **Consulting services** ("Care" plans) add a dedicated accounts receivable specialist on top of each plan, from $1,079 a month billed yearly for Compact + Care.
3. **Integrations** listed on the site include QuickBooks, Xero, Sage, NetSuite, Microsoft Dynamics 365 Business Central and Stripe, and the site describes a payment portal and SMS payment reminders. A free trial is offered.

A company under $5 million in revenue pays $2,796 a year on Compact, billed yearly, for up to 4 users.

### What this blueprint keeps

Customers with billing contacts; open invoices imported from a CSV export, with a preview of what changes; a reminder schedule of steps before and after the due date, each with its own template; one email per customer per day that bundles their invoices; skipping paid, disputed and promised invoices and paused customers; payments, promises to pay, disputes and notes on each invoice; a list of accounts that need a phone call; an aging report; and exports.

### What this blueprint deliberately leaves out

Live sync with accounting software, a payment portal and card payments, SMS reminders, late payment fees and early payment discounts, credit checks and risk scoring, payment prediction and cash forecasting, multiple currencies or entities, and handling customer replies inside the app (replies go to your shared inbox).

## 3. Scope of v1

- One company, one currency (USD by default), one time zone (Settings; default America/New_York).
- Business dates (issue, due, promise, payment and sent-on dates) are plain calendar dates in the company time zone; only timestamps are stored in UTC.
- Amounts are shown with cents everywhere ($31,800.00); this spec writes whole dollars for short.
- Reminders are sent from one shared address (such as accounts@yourcompany.com) with replies going to that inbox.
- Reminders go out at 09:00 on business days (Monday to Friday) only.
- Money is integer cents.
- Email through an outbox. If no email provider is configured, emails are logged, not sent. Sending real reminders to customers is a deliberate switch in Settings (off by default), so a new install can never email customers by accident.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Finance lead | Everything: settings, the sending switch, schedule and templates, import, customers, invoices, payments, write-offs, reports, export. |
| Member | Accounts receivable, account managers | Customers and invoices: record payments, promises, disputes and notes, pause customers, see reports. Cannot change settings, templates, the schedule or the sending switch, and cannot write off invoices. |

Exports and reports: everyone signed in can see the reports and download both exports (section 12); "export" in the Admin row means the same exports, not extra ones. Today's run preview and Needs a call are visible to everyone; **Run now** is admin-only. Schedule and templates, the Outbox, Import, People and Settings are admin-only pages, which members can neither see nor change.

Customers: admins and members can edit a customer's contact email, cc emails, account owner and notes, and can pause a customer with a reason and resume them with an optional note.

People: admins add people (name, email, role) and deactivate or reactivate them; an admin can't deactivate or demote themselves, so there is always an active admin.

Sign-in: Google sign-in (or a sign-in proxy in front of the app) limited to the company domain in Settings is enough. A signed-in email must be on that domain and match an active Person; anyone else, including an unknown or inactive company address, sees "Ask the finance lead to add you." The development "sign in as" switcher runs the same check.

The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (exactly one row, id "settings"): company_name, company_domain (the sign-in domain), from_name, from_email, reply_to, time_zone, send_time (09:00, 24-hour), sending_enabled (false), account_owner_cc_on_final (true). Phase 1 lets admins edit every field except sending_enabled, which arrives with its confirmation in Phase 2.

**Person**: id, name, email, role: admin | member, active.

**Customer**: id, name (unique, compared trimmed and ignoring case), contact_email (may be empty), cc_emails (a comma-separated list of valid addresses), account_owner_id (may be empty for customers created by import), paused (boolean), paused_reason, notes.

**Invoice**: id, number (unique), customer_id, issue_date, due_date, amount_cents, balance_cents, status: open | paid | disputed | written_off, pay_link (optional URL), dispute_reason, promise_date, not_in_latest_import (boolean), last_imported_at.

**Payment**: id, invoice_id, date, amount_cents, note, recorded_by. A payment equal to the balance sets the invoice to paid. Payments can't be edited or deleted.

**Step**: id, name (unique), offset_days (−365 to 365, negative before the due date, unique across steps), template_id, position (display order, following offset_days), active, is_final (exactly one step, the Final notice). Default steps: "Heads-up" −3, "Due today" 0, "7 days overdue" +7, "14 days overdue" +14, "Final notice" +30 (is_final). Steps can be turned off but not deleted, because ReminderSent rows refer to them.

**Template**: id, name (unique), subject (one line), body (plain text) with merge fields: {customer_name}, {invoice_table}, {total_due}, {oldest_days_overdue}, {pay_links}, {from_name}. {invoice_table} is a plain-text table of the email's invoices (number, due date, days overdue, balance) ending with a Total line; {total_due} is the total with cents ("$7,300.00"); {oldest_days_overdue} is the most overdue invoice's days overdue on the run date, never below 0; {pay_links} is one line per invoice that has a pay link, or nothing. Each default step has a default template of the same name: a short, polite email that greets {customer_name}, shows {invoice_table} and {pay_links}, and signs off with {from_name}, getting firmer from Heads-up to Final notice.

**ReminderSent**: id, invoice_id, step_id, notification_id, sent_on. Unique on invoice and step.

**Note** (append-only): id, exactly one of invoice_id or customer_id, at, by_id (empty for notes the job writes), kind: note | call | promise | promise_broken | dispute | dispute_resolved | pause | resume | payment | write_off | import, text. A customer's page shows its own notes and the notes on its invoices, newest first, in the order written.

**ImportRun**: id, at, by_id, file_name, and five whole-number counts: new_count, updated_count, unchanged_count, error_count, missing_count.

**DailyRun**: id, run_date (unique), at, run_by (the job or the admin who pressed Run now), and a snapshot of what was sent and skipped. It is written in the same transaction as the run's emails and ReminderSent rows, which is what keeps the run to once a day.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, at (when it was written), sent_at, kind: reminder | final_notice | promise_broken | import_finished, to_email, cc, subject, body, status: queued | sent | failed | logged | held, error. Failed emails are not retried automatically.

## 6. The daily reminder run

At send_time on each business day:

1. For each open invoice with a balance, the **current step** is the active step with the largest offset_days whose date (due_date + offset_days) is on or before today. If that step's date fell on a weekend, it is due on the next business day. Only the current step is ever sent: steps an invoice passed while it was paused, promised, disputed or not yet imported are not sent late.
2. Skip the invoice, with the reason recorded for the preview, if (checked in this order, and the preview shows the first that applies): the customer is paused; the invoice is disputed; promise_date is today or later; the customer has no contact email; the current step was already sent for this invoice ("Due today already sent on Oct 21"), or the Final notice was ("Final notice already sent on Sep 30; on the Needs a call list"); a later step was already sent (after a due date moved later on import); the invoice has no current step yet ("No step yet (Heads-up on Nov 11)"); or the customer already got a reminder today.
3. Group the remaining invoices by customer. Each customer gets **one** email, using the template of the most overdue invoice's step (the earliest due date; on a tie, the later step), listing every invoice in it, oldest first, with number, due date, days overdue and balance, and the total. Days overdue are counted on the run date. The email goes to the customer's contact_email with their cc_emails copied.
4. The Final notice (the is_final step) copies the account owner when account_owner_cc_on_final is on and the owner is active; duplicate addresses are removed.
5. Record one ReminderSent per invoice and step, and the DailyRun. With sending_enabled off, reminders are written to the outbox with status held instead of queued; held emails stay held when sending is turned on later (they are never sent late). The switch holds customer reminders only: the promise-broken and import emails go to your own people and are never held.
6. An invoice whose Final notice was sent (or held) more than 7 calendar days ago and is still open goes on the **Needs a call** list.

The run happens once per business day, on the first job call at or after send_time; a job that runs late still does that day's run, and a missed day is not caught up separately (the next run sends each invoice's current step). There are no holidays. **Run now** (admin only) does the same run, and is refused before send_time, at weekends and once the day's run has happened.

The **preview** shows exactly what the next run will send and skip, with reasons, before it runs: today's run until it has happened, then the next business day's (Monday at weekends), computed from current data. It lists every open or disputed invoice with a balance, either in an email or as skipped. The run re-checks every invoice when it happens.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Customer | Invoices | Today's run |
|---|---|---|
| Acme Corp | INV-1041, $4,800, due Sun Oct 18 (Heads-up); INV-1032, $2,500, due Oct 8 (7 days overdue) | One email to ap@acme.example with the "7 days overdue" template listing both, total $7,300 |
| Bluebird Ltd | INV-1029, $12,000, due Sep 15 (30 days overdue) | One Final notice, copying the account owner, Nina Shah |
| Kestrel Schools | INV-1035, $3,200, due Oct 1 (14 days overdue) | Skipped: promised to pay by Oct 20 |
| Harbor Clinic | INV-1037, $1,900, due Oct 5 | Skipped: customer paused ("disputing the September hours") |
| Olsen & Co | INV-1025, $900, due Aug 31 | Nothing sent: Final notice went out Sep 30; on the Needs a call list |
| Pine Labs | INV-1043, $6,500, due Nov 14 | Nothing: no step yet |

## 7. Importing invoices

Import a CSV of all open invoices exported from your accounting software, with the columns invoice_number, customer, contact_email, issue_date, due_date, amount, balance (dates as YYYY-MM-DD, amounts as plain numbers). Columns may be in any order and extra columns are ignored; a missing column, an empty file or broken quoting rejects the whole file.

A row is an **error** if invoice_number, customer, issue_date, due_date, amount or balance is missing; a date is not a real YYYY-MM-DD date; an amount is not a plain non-negative number with at most two decimals (no $, commas or minus sign); the balance is more than the amount; the due date is before the issue date; contact_email is not a valid address; the invoice number appears twice in the file; or a known invoice number appears under a different customer. contact_email may be blank: a new customer created from such a row has no contact email, and a blank never clears an existing customer's contact. The file's contact_email is used only when a customer is created. Customers are matched by name, trimmed and ignoring case.

| Row | Result |
|---|---|
| A new invoice number | New invoice; a new customer is created if the name is new |
| A known invoice with a different balance, due date, amount or issue date | Updated; a note records each change. A balance of 0 marks it paid; a paid invoice that comes back with a balance is reopened; a disputed invoice stays disputed; a written-off invoice is left alone and counted as unchanged |
| A known invoice with nothing changed | Unchanged |
| A row with a missing or invalid field | Error, with the reason; nothing is imported from that row |
| An open invoice in the app but not in the file | Flagged "Not in latest import" for a person to check; never marked paid automatically. A row with an error still counts as in the file. The flag clears when the invoice appears in a later import, and an already flagged invoice gets no second note |

The preview shows every row's result; nothing changes until Import is pressed. Import checks the file again against current data and applies that result; if it differs from the preview, the result page says so. Every row in the file sets last_imported_at. When the import finishes, the "Import finished" email goes to the person who imported (from Phase 1).

The file is the source of truth for balances: if a payment was recorded in the app but not in the accounting software, the next import puts the file's balance back, and the update note says so. Record payments in the accounting software as well.

## 8. Business rules

- **R1. Money** is integer cents, parsed from text without floating point. Balances never go below zero; a payment larger than the balance is refused with the reason ("A payment of $20,000.00 is more than the balance of $11,000.00."). A payment needs an amount above zero and a date that is not in the future; payments can be recorded on open and disputed invoices (paying a disputed invoice in full makes it paid), not on paid or written-off ones.
- **R2. The run** follows section 6 exactly. Each invoice gets each step at most once (unique ReminderSent), and each customer at most one reminder email a day.
- **R3. Never chase what shouldn't be chased.** Paid, disputed and written-off invoices, paused customers and invoices with a promise date of today or later are never included.
- **R4. Promises.** Recording a promise needs a date from today to today + 30 days, inclusive, on an open invoice with a balance (not a disputed one); a new promise replaces the old one. On the first job call (or Run now) on any day after the promise date, weekends included and before that day's run, an invoice still open with a balance has its promise marked broken: a promise_broken note is written, promise_date is cleared, the promise-broken email goes out, and reminders resume with the current step. A disputed invoice's promise is checked once the dispute is resolved.
- **R5. Disputes** need a reason, can be raised only on open invoices, stop reminders for that invoice, and are resolved by an admin or member with a note (kind dispute_resolved), which reopens the invoice and clears dispute_reason; the notes keep the old reason.
- **R6. Write-offs** are admin-only, need a reason, and set the balance to zero with status written_off. The reason is kept in a write_off note; the original amount stays on the invoice, and no Payment is created.
- **R7. Imports** follow section 7. An import never deletes anything.
- **R8. Sending switch.** With sending_enabled off, every reminder is held in the outbox and nothing reaches a customer; turning it on is admin-only and asks for confirmation, which the server requires too. Turning it off needs no confirmation.
- **R9. Templates** may only use the merge fields in section 5; an unknown field is refused when saving: "{amount_due} isn't a merge field." Field names are case-sensitive, any {...} that isn't exactly one of them (including {} ) is refused with its own message, and nothing is saved.
- **R10. Events.** From Phase 1, every change writes an event; notes and events are never edited or deleted. Only the development "reset to seed data" clears them.

## 9. Screens

1. **Invoices** (home): open invoices (status open or disputed, with a balance) with customer, due date, days overdue (today minus the due date in calendar days; an invoice due today is not yet due), balance, status and last reminder (the most recent step sent, with its date); filters for overdue, disputed, promised (a promise date of today or later), not in latest import; headline totals for all open invoices, and a total for the current filter.
2. **Invoice page**: details, payments, reminders sent, notes timeline, and actions: record payment, promise, dispute, note, write off.
3. **Customers**: contacts, account owner, pause with a reason and resume, their invoices and notes, and editing (section 4).
4. **Today's run**: the preview (section 6) with who gets what and every skip with its reason, and the result once run.
5. **Needs a call**: invoices whose final notice was sent more than 7 days ago, oldest Final notice first, showing "Final notice sent Sep 30" and the last call logged. Paused customers and promised invoices stay on the list with a badge. Logging a call (a note of kind call) doesn't remove an invoice; it leaves the list when it is paid, disputed or written off.
6. **Aging report**: balances in buckets: not yet due, 1 to 30, 31 to 60, 61 to 90 and over 90 days overdue, with totals, as of today. Disputed invoices and paused customers are included, because the money is still owed. Phase 1 builds the bucket totals; Phase 4 adds the view by customer (one row per customer with an open balance, sorted by name, then a totals row) and its export.
7. **Reminders sent** (Phase 4): one row per reminder email, by the business date it went out, with customer, invoices (each with its own step), the email's step (the one whose template it used), to, cc and outbox status, held included; promise-broken and import emails are not reminders. The range defaults to this week (Monday to Sunday) and can be last week, this month, the last 30 days or any From and To dates, both included.
8. **Import**, **People** and **Settings** (Phase 1), **Schedule and templates** and **Outbox** (Phase 2), all admin-only. Schedule and templates lets admins add and edit steps and templates and turn steps on and off. The Outbox lists every email, newest first, with when it was written and its status.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Reminder (section 6) | The customer's contact, plus cc_emails | From the template, using only the merge fields in section 5, such as "{from_name}: {total_due} overdue", which gives "Northwind Design: $7,300.00 overdue" |
| Final notice | The customer, copying the account owner | Such as "Final notice: {total_due}, {oldest_days_overdue} days overdue", which gives "Final notice: $12,000.00, 30 days overdue" |
| Promise broken | The account owner (the admins if the customer has no active owner), one email per invoice | "Kestrel Schools didn't pay INV-1035 by Oct 20" |
| Import finished | The person who imported | "Import: 2 new, 1 updated, 1 error, 1 not in file" |

Write every email to the outbox first, then send it. A job at POST /jobs/reminders, protected by the header X-Cron-Secret matching the CRON_SECRET setting (refused with 401 otherwise), runs every 15 minutes from an external scheduler: it marks broken promises, does the daily run once after send_time on business days, then sends queued emails, and is safe to run twice. A failed email never blocks an action.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so the daily run, weekends and promises can be tested by moving the clock. In development the clock can be set to a date and time in the company time zone or moved by whole days (keeping the time of day); the offset survives a restart and is ignored in production. "Reset to seed data" sets the clock to Thursday, October 15, 2026, 10:00 in the company time zone (after send_time), so the worked examples and checks hold whatever the real date.

## 12. Sample import and export

Sample file for the acceptance checks:

```
invoice_number,customer,contact_email,issue_date,due_date,amount,balance
INV-1025,Olsen & Co,accounts@olsen.example,2026-08-01,2026-08-31,900.00,900.00
INV-1029,Bluebird Ltd,payables@bluebird.example,2026-08-16,2026-09-15,12000.00,12000.00
INV-1035,Kestrel Schools,finance@kestrel.example,2026-09-01,2026-10-01,3200.00,3200.00
INV-1037,Harbor Clinic,office@harborclinic.example,2026-09-05,2026-10-05,1900.00,1900.00
INV-1041,Acme Corp,ap@acme.example,2026-09-18,2026-10-18,4800.00,4800.00
INV-1043,Pine Labs,accounts@pinelabs.example,2026-10-15,2026-11-14,6500.00,3500.00
INV-1044,Acme Corp,ap@acme.example,2026-10-14,2026-11-13,2200.00,2200.00
INV-1045,Quill Studio,billing@quill.example,2026-10-15,2026-11-14,1500.00,1500.00
INV-1046,Kestrel Schools,finance@kestrel.example,2026-10-15,,800.00,800.00
```

Exports (CSV): the aging report by customer (columns customer, not_yet_due, days_1_30, days_31_60, days_61_90, over_90_days, total; the same rows in the same order as the screen, then a Total row), and the reminders sent in a date range (columns date, customer, invoices, step, to, status, cc; one row per email, invoices separated by "; "). Dates are YYYY-MM-DD and amounts plain numbers with two decimals, as in the import file. Files are UTF-8 with a header row; a text cell starting with =, +, - or @ gets a leading apostrophe so a spreadsheet never runs it as a formula.

## 13. Edge cases

- A customer with no contact email (created from an import row with a blank contact_email, or cleared on the Customers screen): their invoices are listed as skipped ("No contact email") in the preview.
- A payment recorded after the preview but before the run: the run re-checks every invoice and leaves it out.
- An invoice's due date moves later on import: steps already sent stay sent; later steps follow the new date.
- A step is turned off: invoices whose current step would be that step get the latest earlier active step, if it wasn't sent; if that one was already sent, nothing goes out until the next active step. An even earlier step is never sent after a firmer one. If the Final notice step is turned off, no Final notice goes out.
- An invoice's due date moves later so that its current step comes before a step already sent: it is skipped ("A later step (7 days overdue) was already sent") until it reaches a step after that one.
- Two people press Run at once: only one run happens for the day.

## 14. Seed data

Company "Northwind Design", a design agency; from accounts@northwind.example; time zone America/New_York; sending switch off. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People: Maya Ortiz (admin, finance lead), Nina Shah (member, account owner for Bluebird Ltd and Acme Corp), Theo Park (member, account owner for the others). Emails firstname@northwind.example; company_domain northwind.example.

Every seed invoice's amount equals its balance, and its issue date is 30 days before its due date (INV-1032: issued Sep 8). Earlier reminders are seeded as ReminderSent rows with matching outbox emails of status sent, one email per invoice and step, at 09:00 on the step's date (moved to the next business day at weekends): INV-1025 every step from Heads-up (Aug 28) to Final notice (Sep 30, copying Theo); INV-1029 Heads-up (Sep 14, because Sep 12 was a Saturday), Due today (Sep 15), 7 days overdue (Sep 22) and 14 days overdue (Sep 29); INV-1032 Heads-up (Oct 5) and Due today (Oct 8). Kestrel Schools and Harbor Clinic have no earlier reminders. Theo logged Kestrel's promise on Oct 13 and paused Harbor Clinic on Oct 9, each with a note.

The seed loads only in development (on first start and on "reset to seed data"). In production the app starts empty except for Settings and one admin, named by the ADMIN_EMAIL setting.

| Invoice | Customer (contact) | Due | Balance | Notes |
|---|---|---|---|---|
| INV-1025 | Olsen & Co (accounts@olsen.example) | Aug 31 | $900 | All steps sent, Final notice on Sep 30 |
| INV-1029 | Bluebird Ltd (payables@bluebird.example) | Sep 15 | $12,000 | Steps up to 14 days overdue sent |
| INV-1032 | Acme Corp (ap@acme.example) | Oct 8 | $2,500 | Heads-up and Due today sent |
| INV-1035 | Kestrel Schools (finance@kestrel.example) | Oct 1 | $3,200 | Promise to pay by Oct 20, logged by Theo |
| INV-1037 | Harbor Clinic (office@harborclinic.example) | Oct 5 | $1,900 | Customer paused: "disputing the September hours" |
| INV-1041 | Acme Corp | Oct 18 | $4,800 | |
| INV-1043 | Pine Labs (accounts@pinelabs.example) | Nov 14 | $6,500 | |

Open total $31,800, of which $20,500 is overdue. Aging: not yet due $11,300; 1 to 30 days $19,600; 31 to 60 days $900; nothing older.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, invoices and import

```
Using the Invoice Reminders blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask the finance lead to add you."
3. Build Invoices, the Invoice page (read-only for now), Customers (with editing), the Aging report totals, Import, People and Settings (section 9, screens 1 to 3, 6 and 8) with R1, R7 and R10, and the "Import finished" email in the outbox, enforcing section 4 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Invoices shows seven open invoices totalling $31,800, with $20,500 overdue.
- [ ] The aging report shows not yet due $11,300, 1 to 30 days $19,600, 31 to 60 days $900, and $0 in the older buckets.
- [ ] Checking the sample file in section 12 shows 5 unchanged, 1 updated (INV-1043, balance $6,500 to $3,500), 2 new (INV-1044, and INV-1045 for a new customer Quill Studio), 1 error (INV-1046, missing due date) and INV-1032 as not in the file; importing makes the open total $32,500.
- [ ] Signed in as Theo, Import and Settings are not offered, and direct requests to them are refused.

### Phase 2: Schedule, templates and the daily run

```
Using the Invoice Reminders blueprint above, build Phase 2 only.

1. Build Schedule and templates with R9, Today's run with its preview and Run now, the sending switch in Settings, and the daily run exactly as section 6 describes, with R2, R3 and R8.
2. Build the job in section 10 and the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Today's run preview lists one email to Acme Corp with INV-1041 and INV-1032 (total $7,300) and a Final notice to Bluebird Ltd copying Nina Shah, and lists Kestrel Schools (promised by Oct 20) and Harbor Clinic (customer paused) as skipped with those reasons.
- [ ] With the sending switch off, running the job puts exactly those two emails in the outbox as held; running it again adds nothing.
- [ ] Saving a template that uses {amount_due} is refused with "{amount_due} isn't a merge field."
- [ ] Moving the clock to Saturday and running the job sends nothing; on Monday Oct 19 it sends Acme the "Due today" reminder for INV-1041, which fell due on Sunday.
- [ ] Signed in as Theo, the sending switch can't be changed, including by a direct request.

### Phase 3: Payments, promises, disputes and calls

```
Using the Invoice Reminders blueprint above, build Phase 3 only.

1. Add the invoice actions (section 9, screen 2): record payment, promise, dispute, note and write-off, with R4 to R6, and customer pausing.
2. Build Needs a call (screen 5) and the promise-broken email.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Recording a $2,500 payment on INV-1032 marks it paid, and today's preview then shows Acme's email with INV-1041 only.
- [ ] A $1,000 payment on INV-1029 leaves a balance of $11,000, shown in Bluebird's Final notice in today's preview; a payment of $20,000 on it is refused.
- [ ] Signed in as Maya, moving the clock to Wednesday Oct 21 and running the job with INV-1035 unpaid marks Kestrel's promise as broken in a note, emails Theo, and puts a "14 days overdue" reminder for INV-1035 to Kestrel in the outbox.
- [ ] Marking INV-1041 disputed with a reason removes it from the run (the preview lists it as skipped, disputed); resolving the dispute with a note puts it back, and with the clock at Monday Oct 26 the preview includes it in Acme's "7 days overdue" email.
- [ ] Needs a call lists INV-1025 for Olsen & Co, with "Final notice sent Sep 30".
- [ ] Signed in as Theo, writing off INV-1025 is refused; signed in as Maya, it works with a reason and the balance becomes $0.

### Phase 4: Reports and export

```
Using the Invoice Reminders blueprint above, build Phase 4 only.

1. Add the aging report's per-customer view and its CSV export, and the reminders-sent report (section 9, screen 7) and export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The aging report by customer shows Bluebird Ltd's $12,000 in 1 to 30 days and Olsen & Co's $900 in 31 to 60 days, and its CSV has the same rows and totals.
- [ ] After today's run, the reminders-sent report for this week lists the Acme and Bluebird emails with their invoices, steps and status held, and exports as CSV.
- [ ] Signed in as Theo, both reports are visible, and both exports work.

## 16. Variations

- Sync open invoices from QuickBooks or Xero every night instead of importing a file.
- A payment link per invoice through Stripe, with paid invoices closed automatically.
- Different schedules for different customers (gentler for long-standing clients).
- Statements: one monthly email per customer with every open invoice.
- A weekly summary for the finance lead: overdue total, promises due, accounts needing a call.

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser, resetting to the seed data before each phase's checks. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Imports were pasted into the Import screen, emails were read on the Outbox screen, the reminder job was run from the development control and its endpoint with the development clock, and both exports were downloaded, parsed and matched against the screen.

**Result:** 18 of 18 acceptance checks passed in one final browser run on a fresh database, plus 113 automated tests. The item-by-item results are in [acceptance-results.json](/builds/invoice-reminders/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. Sign-in offered "the platform's built-in auth or Google sign-in" without saying what to do on a host with neither. Section 4 now says Google sign-in or a sign-in proxy limited to the company domain is enough, and the development switcher runs the same check.
2. Sign-in was limited to "our company email domain", but nothing stored the domain. Settings now has company_domain, northwind.example in the seed.
3. The People screen was listed but no phase built it, so "Ask the finance lead to add you." had no way to be acted on. Phase 1 now builds People, and section 4 says admins add, deactivate and reactivate people and can't lock themselves out.
4. Section 4 gave export to admins only, while a Phase 4 check has Theo, a member, exporting. Section 4 now says everyone signed in can see the reports and use both exports.
5. Section 13 mentions people pressing Run, but nothing said who may run the day's reminders by hand or when. Run now is admin-only and refused before send_time, at weekends and after the day's run.
6. Nothing said whether steps can be deleted or how far from the due date they can be. Steps can be turned off but not deleted, and offsets run from -365 to 365 days.
7. No phase let anyone edit a customer's contact, cc emails or account owner, so imported customers could never get an owner. Section 4 now lets admins and members edit them, from Phase 1.
8. Customers created by import have no account owner, leaving the promise-broken email with no recipient. It now goes to the admins when there is no active owner.
9. Customers could be paused but nothing said how to resume them. Section 4 adds resume with an optional note.
10. Phase 1 builds Settings, but the sending switch belongs to Phase 2, so it was unclear what Phase 1 may edit. Settings now says Phase 1 edits every field except sending_enabled.
11. The import columns made contact_email required, while section 13 has a customer with no contact email. contact_email may now be blank, and a blank never clears an existing contact.
12. "A missing or invalid field" had no definition. Section 7 now lists what makes a row an error, from bad dates and amounts to a balance above the amount and a repeated invoice number.
13. Only a changed balance or due date counted as "updated", so a changed amount or issue date was silently ignored. Those changes now count as updated too, each with a note.
14. Nothing said how an import row finds its customer. Customers are matched by name, trimmed and ignoring case, and the file's contact email is used only for new customers.
15. A known invoice number arriving under a different customer wasn't covered. It is now an error and nothing is imported from that row.
16. The import didn't say what a zero balance, a paid invoice coming back, or a disputed or written-off invoice in the file should do. A zero balance marks it paid, a paid invoice with a balance reopens, a disputed one stays disputed, and a written-off one is left alone.
17. "Not in latest import" didn't say whether an error row counts as in the file, when the flag clears, or whether it is noted twice. Error rows count as in the file, the flag clears on the next import that includes the invoice, and it is noted once.
18. The preview and the import could disagree if data changed in between. Import now checks the file again and the result page says if it differs from the preview.
19. The "Import finished" email was listed but no phase built it. Phase 1 now writes it to the outbox.
20. A payment recorded in the app is undone by the next import of the accounting balance, and the spec never said which wins. The file is the source of truth, the update note says so, and section 7 tells you to record payments in the accounting software too.
21. ImportRun's "counts" had no shape. They are five whole-number fields.
22. Steps can be renamed and added, so "the Final notice" couldn't be identified by name. Step now has is_final, set on exactly one step.
23. "The latest active step" could tie if two steps shared an offset. Offsets are unique, and the current step is the one with the largest offset that has come due.
24. Section 13's turned-off step rule could send a gentle earlier step after a firmer one. The earlier step goes out only if it wasn't sent; an even earlier one never does, and with the Final notice step off no Final notice goes out.
25. A due date moved later on import could make the current step one that comes before a step already sent. The invoice is now skipped ("A later step (7 days overdue) was already sent") until it reaches a later step.
26. Nothing said whether steps an invoice passed while paused or promised are sent late. Only the current step is ever sent.
27. The worked examples show "Nothing" for Olsen & Co and Pine Labs, but the preview's skip list didn't cover them. The preview now lists every open or disputed invoice, with reasons such as "No step yet (Heads-up on Nov 11)".
28. An invoice can be skipped for several reasons at once. The reasons are checked in a fixed order and the preview shows the first.
29. R2 limits each customer to one email a day, but no skip reason enforced it. "The customer already got a reminder today" is now a skip reason.
30. After the day's run, nothing said what the preview shows. It shows the next business day's run, Monday at weekends.
31. Nothing said what happens when the job runs late, misses a day, or meets a holiday. A late job still does that day's run, missed days aren't caught up, and there are no holidays.
32. "The most overdue invoice's step" didn't say how to break ties or order the invoices. The earliest due date wins, a tie goes to the later step, and invoices are listed oldest first.
33. The merge fields had no formats. Section 5 now defines {invoice_table}, {total_due}, {oldest_days_overdue} and {pay_links}, and says emails are plain text.
34. R9 didn't say whether field names are case-sensitive or what happens with several unknown fields. Names are case-sensitive, each unknown field gets its own message, and nothing is saved.
35. "The customer's contact, plus cc_emails" didn't say whether the account owner is copied when inactive or listed twice. The owner is copied only when active, and duplicate addresses are removed.
36. Held reminders had no rule for when sending is turned on later. They stay held and are never sent late.
37. R8 says every reminder is held, but the promise-broken and import emails go to staff. The switch now holds customer reminders only.
38. Notification had no list of kinds. They are reminder, final_notice, promise_broken and import_finished.
39. Nothing recorded that the day's run had happened, which "safe to run twice" depends on. A DailyRun row per date, written with the emails, now does.
40. "A CRON_SECRET header" had no name or endpoint. The job is POST /jobs/reminders with an X-Cron-Secret header, and a wrong secret gets 401.
41. R8 asked for confirmation before turning sending on but not whether the server enforces it or turning it off needs it. The server requires it, and turning sending off doesn't.
42. The spec named five templates but gave no text for them. Section 5 now describes the default templates.
43. Section 10's example subjects needed an invoice count and number, which aren't merge fields, so R9 refused them. The examples now use only the allowed merge fields.
44. R4 marks a promise "broken" but no field held that. A promise_broken note is written and promise_date is cleared.
45. "When the day after the promise date arrives" didn't say whether that means the daily run or any job call, or weekends. It is the first job call on any later day, weekends included, before that day's run.
46. A disputed invoice with a passed promise date wasn't covered. Its promise is checked once the dispute is resolved.
47. "A date within 30 days" didn't say whether today or day 30 count, or whether past dates do. Today through today + 30 are allowed, and past dates aren't.
48. Nothing said which invoices can take a promise or what a second promise does. Open invoices with a balance can, not disputed ones, and a new promise replaces the old one.
49. R1 refused overpayments but said nothing else about payments. A payment needs an amount above zero and a date not in the future, works on open and disputed invoices only, and can't be edited.
50. R5 didn't say which invoices can be disputed or what happens to the reason on resolve. Only open invoices, and resolving clears dispute_reason while the notes keep it.
51. Needs a call is for phoning, but there was no way to log a call. Notes now have a call kind, and logging one doesn't remove the invoice from the list.
52. R6 needed a write-off reason but Note had no kind for it. Notes now have write_off, and the original amount stays on the invoice.
53. Needs a call didn't say whether paused or promised invoices stay on it, or what "oldest first" sorts by. They stay with a badge, sorted by when the Final notice went out.
54. With sending off, a held Final notice never reached the customer, and nothing said whether it starts the 7 days. Held counts as sent.
55. Nothing said how an invoice leaves Needs a call. It leaves when paid, disputed or written off.
56. Settings is "one row" but had no id. It is exactly one row with id "settings".
57. The outbox had no time each email was written, so the Outbox couldn't sort or show it. Notification now has at and sent_at.
58. "invoice_id or customer_id" on Note could mean either or both. It is exactly one, and a customer's page shows its own notes and its invoices' notes.
59. cc_emails had no format. It is a comma-separated list of valid addresses.
60. R10 forbids deleting notes and events, which the development reset has to do. Only the development reset clears them.
61. The development clock's offset had no home and could be lost on restart. It survives a restart and is ignored in production.
62. "Open invoices" could exclude disputed ones, which would leave the Disputed filter empty. Invoices lists open and disputed invoices with a balance.
63. "Days overdue" had no definition. It is today minus the due date in calendar days, counted on the run date in emails, and an invoice due today is not yet due.
64. Screen 6 described the aging report "by customer", but Phase 4 adds the per-customer view. Phase 1 now builds the bucket totals and Phase 4 the view by customer.
65. The filters didn't say what "promised" means or what the totals cover. Promised is a promise date of today or later, and there is a total for the current filter as well as for all open invoices.
66. "Last reminder" didn't say what to show. It is the most recent step sent, with its date.
67. R10 wasn't in the Phase 1 prompt, so imports and settings changes might write no events. R10 now applies from Phase 1.
68. The seed gave no issue dates or amounts. Every seed invoice's amount equals its balance and its issue date is 30 days before its due date.
69. The seed said which steps were sent but not when or as which emails, and Bluebird's Heads-up fell on a Saturday. Section 14 now lists every earlier reminder with its date as a sent email.
70. The seed didn't say who paused Harbor Clinic or when either note was written. Theo logged the promise on Oct 13 and paused Harbor Clinic on Oct 9.
71. "Load the seed data" didn't say whether a production install should get the demo data. The seed loads only in development, and production starts with Settings and one admin.
72. The seed is "relative to today", but the checks need Thursday, October 15, 2026 after 09:00. Reset to seed data now sets the clock to that date at 10:00.
73. "Move the clock forward" didn't say how. The clock can be set to a date and time or moved by whole days.
74. The spec writes "$31,800" while money is stored in cents. Amounts are shown with cents everywhere.
75. Nothing said which dates are calendar dates and which are timestamps. Business dates are calendar dates in the company time zone; only timestamps are UTC.
76. The aging CSV had no columns or row order. Section 12 now names the columns and says it has the screen's rows, then a Total row.
77. The reminders-sent report didn't say whether a row is an email or an invoice, which step an email with several shows, or whether the cc goes in. One row per email, the step whose template it used, and a cc column.
78. Nothing said whether held reminders or the promise-broken email belong in the reminders-sent report. Held reminders do; the promise-broken and import emails don't.
79. "This week" had no definition. The range defaults to Monday to Sunday of this week, with other ranges and both ends included.
80. The exports had no encoding or protection against formulas in names. Files are UTF-8 with a header row, and a cell starting with =, +, - or @ is prefixed with an apostrophe.
81. Phase 3's dispute check came after a run that had already sent INV-1041's current step, so "puts it back" couldn't be seen. The check now moves the clock to Monday Oct 26, when the preview includes it in Acme's "7 days overdue" email.
82. Phase 3's promise check reads the Outbox, which only admins can open, but named no person. It now says "Signed in as Maya".
83. Phase 3's check that Bluebird's Final notice shows $11,000 didn't say where. It now says in today's preview.

**What we did not test:**
- Production sign-in. A sign-in proxy hook limited to the company domain was built, but every check used the development "sign in as" switcher.
- Sending email. Reminders were held in the outbox with sending off, and the promise-broken and import emails were logged, not delivered; no email provider was configured.
- The reminder job on a real scheduler. It was run from the development control and its endpoint with the development clock.
- Hosting. The checks ran on localhost, not on a public https address.
- A real accounting export. The import used the sample file in section 12, not a file from QuickBooks or Xero.
- Phone layout beyond one viewport. On a 390-pixel screen the run preview's invoice table is wider than the screen; no physical phone was used.
- Spec fixes that no acceptance check covers, such as People, customer editing, turned-off steps, due dates that move on import and CSV formula guarding. The test build handles them through its own choices.
