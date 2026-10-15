<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/invoice-reminders . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

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
- Reminders are sent from one shared address (such as accounts@yourcompany.com) with replies going to that inbox.
- Reminders go out at 09:00 on business days (Monday to Friday) only.
- Money is integer cents.
- Email through an outbox. If no email provider is configured, emails are logged, not sent. Sending real reminders to customers is a deliberate switch in Settings (off by default), so a new install can never email customers by accident.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Finance lead | Everything: settings, the sending switch, schedule and templates, import, customers, invoices, payments, write-offs, reports, export. |
| Member | Accounts receivable, account managers | Customers and invoices: record payments, promises, disputes and notes, pause customers, see reports. Cannot change settings, templates, the schedule or the sending switch, and cannot write off invoices. |

The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, from_name, from_email, reply_to, time_zone, send_time (09:00), sending_enabled (false), account_owner_cc_on_final (true).

**Person**: id, name, email, role: admin | member, active.

**Customer**: id, name (unique), contact_email, cc_emails, account_owner_id, paused (boolean), paused_reason, notes.

**Invoice**: id, number (unique), customer_id, issue_date, due_date, amount_cents, balance_cents, status: open | paid | disputed | written_off, pay_link (optional URL), dispute_reason, promise_date, not_in_latest_import (boolean), last_imported_at.

**Payment**: id, invoice_id, date, amount_cents, note, recorded_by. A payment equal to the balance sets the invoice to paid.

**Step**: id, name, offset_days (negative before the due date), template_id, position, active. Default steps: "Heads-up" −3, "Due today" 0, "7 days overdue" +7, "14 days overdue" +14, "Final notice" +30.

**Template**: id, name, subject, body with merge fields: {customer_name}, {invoice_table}, {total_due}, {oldest_days_overdue}, {pay_links}, {from_name}.

**ReminderSent**: id, invoice_id, step_id, notification_id, sent_on. Unique on invoice and step.

**Note** (append-only): id, invoice_id or customer_id, at, by_id, kind: note | call | promise | dispute | pause | payment | import, text.

**ImportRun**: id, at, by_id, file_name, counts (new, updated, unchanged, errors, missing).

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, cc, subject, body, status: queued | sent | failed | logged | held, error.

## 6. The daily reminder run

At send_time on each business day:

1. For each open invoice with a balance, the **current step** is the latest active step whose date (due_date + offset_days) is on or before today. If that step's date fell on a weekend, it is due on the next business day.
2. Skip the invoice, with the reason recorded for the preview, if: the customer is paused; the invoice is disputed; promise_date is today or later; the current step was already sent for this invoice; or the invoice has no current step yet.
3. Group the remaining invoices by customer. Each customer gets **one** email, using the template of the most overdue invoice's step, listing every invoice in it with number, due date, days overdue and balance, and the total.
4. The Final notice copies the account owner when account_owner_cc_on_final is on.
5. Record one ReminderSent per invoice and step. With sending_enabled off, emails are written to the outbox with status held instead of sent.
6. An invoice whose Final notice was sent more than 7 days ago and is still open goes on the **Needs a call** list.

The **preview** shows exactly what the next run will send and skip, with reasons, before it runs.

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

Import a CSV of all open invoices exported from your accounting software, with the columns invoice_number, customer, contact_email, issue_date, due_date, amount, balance (dates as YYYY-MM-DD, amounts as plain numbers).

| Row | Result |
|---|---|
| A new invoice number | New invoice; a new customer is created if the name is new |
| A known invoice with a different balance or due date | Updated; a note records the change |
| A known invoice with nothing changed | Unchanged |
| A row with a missing or invalid field | Error, with the reason; nothing is imported from that row |
| An open invoice in the app but not in the file | Flagged "Not in latest import" for a person to check; never marked paid automatically |

The preview shows every row's result; nothing changes until Import is pressed.

## 8. Business rules

- **R1. Money** is integer cents. Balances never go below zero; a payment larger than the balance is refused.
- **R2. The run** follows section 6 exactly. Each invoice gets each step at most once (unique ReminderSent), and each customer at most one reminder email a day.
- **R3. Never chase what shouldn't be chased.** Paid, disputed and written-off invoices, paused customers and invoices with a promise date of today or later are never included.
- **R4. Promises.** Recording a promise needs a date within 30 days. When the day after the promise date arrives and the invoice is still open, the promise is marked broken in a note, and reminders resume with the current step.
- **R5. Disputes** need a reason, stop reminders for that invoice, and are resolved by an admin or member with a note, which reopens the invoice.
- **R6. Write-offs** are admin-only, need a reason, and set the balance to zero with status written_off.
- **R7. Imports** follow section 7. An import never deletes anything.
- **R8. Sending switch.** With sending_enabled off, every reminder is held in the outbox and nothing reaches a customer; turning it on is admin-only and asks for confirmation.
- **R9. Templates** may only use the merge fields in section 5; an unknown field is refused when saving: "{amount_due} isn't a merge field."
- **R10. Events.** Every change writes an event; notes and events are never edited or deleted.

## 9. Screens

1. **Invoices** (home): open invoices with customer, due date, days overdue, balance, status and last reminder; filters for overdue, disputed, promised, not in latest import; totals.
2. **Invoice page**: details, payments, reminders sent, notes timeline, and actions: record payment, promise, dispute, note, write off.
3. **Customers**: contacts, account owner, pause with a reason, their invoices and notes.
4. **Today's run**: the preview (section 6) with who gets what and every skip with its reason, and the result once run.
5. **Needs a call**: invoices whose final notice was sent more than 7 days ago, oldest first.
6. **Aging report**: balances by customer in buckets: not yet due, 1 to 30, 31 to 60, 61 to 90 and over 90 days overdue, with totals.
7. **Import**, **Schedule and templates**, **People**, **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Reminder (section 6) | The customer's contact, plus cc_emails | "Northwind Design: 2 invoices, $7,300 due" (depends on the template) |
| Final notice | The customer, copying the account owner | "Final notice: invoice INV-1029, 30 days overdue" |
| Promise broken | The account owner | "Kestrel Schools didn't pay INV-1035 by Oct 20" |
| Import finished | The person who imported | "Import: 2 new, 1 updated, 1 error, 1 not in file" |

Write every email to the outbox first, then send it. A job (protected by a CRON_SECRET header) runs every 15 minutes, does the daily run once after send_time on business days, and is safe to run twice. A failed email never blocks an action.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so the daily run, weekends and promises can be tested by moving the clock.

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

Exports (CSV): the aging report, and the reminders sent in a date range (date, customer, invoices, step, to, status).

## 13. Edge cases

- A customer with no contact email: their invoices are listed as skipped ("No contact email") in the preview.
- A payment recorded after the preview but before the run: the run re-checks every invoice and leaves it out.
- An invoice's due date moves later on import: steps already sent stay sent; later steps follow the new date.
- A step is turned off: invoices whose current step is that step get the latest earlier active step that wasn't sent, if any.
- Two people press Run at once: only one run happens for the day.

## 14. Seed data

Company "Northwind Design", a design agency; from accounts@northwind.example; time zone America/New_York; sending switch off. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People: Maya Ortiz (admin, finance lead), Nina Shah (member, account owner for Bluebird Ltd and Acme Corp), Theo Park (member, account owner for the others). Emails firstname@northwind.example.

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
3. Build Invoices, the Invoice page (read-only for now), Customers, the Aging report and Import (section 9, screens 1 to 3, 6 and 7) with R1 and R7, enforcing section 4 on the server.
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

1. Build Schedule and templates with R9, Today's run with its preview, and the daily run exactly as section 6 describes, with R2, R3 and R8.
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
- [ ] A $1,000 payment on INV-1029 leaves a balance of $11,000, shown in Bluebird's Final notice; a payment of $20,000 on it is refused.
- [ ] Moving the clock to Wednesday Oct 21 and running the job with INV-1035 unpaid marks Kestrel's promise as broken in a note, emails Theo, and puts a "14 days overdue" reminder for INV-1035 to Kestrel in the outbox.
- [ ] Marking INV-1041 disputed with a reason removes it from the run; resolving the dispute with a note puts it back.
- [ ] Needs a call lists INV-1025 for Olsen & Co, with "Final notice sent Sep 30".
- [ ] Signed in as Theo, writing off INV-1025 is refused; signed in as Maya, it works with a reason and the balance becomes $0.

### Phase 4: Reports and export

```
Using the Invoice Reminders blueprint above, build Phase 4 only.

1. Add the aging report's per-customer view and its CSV export, and the reminders-sent report and export (section 12).

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
