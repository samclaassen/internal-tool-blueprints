<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/expense-reports . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Expense Reports

Blueprint BP-014 · Department: Finance · Replaces: Expensify (Collect), receipts in email, the reimbursement spreadsheet
For teams of 5 to 100 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Receipts pile up in email and reimbursements take weeks."

People pay for things on behalf of the company: a taxi to a client, a dinner, a hotel night, a stock photo, the miles they drove. The receipts go to finance by email, someone types them into a spreadsheet, a manager approves in a reply nobody can find later, and the employee waits weeks to be paid back without knowing where their money is.

This blueprint puts every out-of-pocket expense on a report with its receipt. A report goes to the submitter's manager for approval, then to finance to be paid, and at every step everyone can see its status. Spending limits are checked when the expense is entered, not discovered at month end.

## 2. What the real product does

Research basis: Expensify's pricing page (expensify.com/pricing) and its help article "Create and Submit Reports" (help.expensify.com/articles/new-expensify/reports-and-expenses/Create-and-Submit-Reports), October 2026.

What we verified:

1. **Plans and price.** Submit is free for all members: receipt scanning, mileage tracking, expense reports, categories and tags, custom distance and tax rates, personal card import. Collect is $5 per member per month: reimbursements, corporate card management, expense and travel approvals, travel booking, and QuickBooks and Xero integrations. Control is custom pricing "as low as $9 per active member/month": multiple approval flows, custom expense rules, ERP and HR integrations, SAML SSO, custom reporting and budgeting.
2. **Reports.** An expense report is created as a draft and expenses are added to it. Submitting moves it into the approval workflow; without one, the button says "Mark as done". Expenses that are on hold when a report is submitted move to a new draft report.
3. **Retract and reject.** The person who submitted a report can retract it, which moves it back to Draft so expenses can be added, removed or edited. A workspace admin can submit a report on a member's behalf and can reject a report to request changes.
4. **Beyond reports.** The Expensify Card, travel booking, bill pay and invoicing, chat on expenses, delegated access, and accounting and ERP exports.

### What this blueprint keeps

Reimbursable expenses with receipts (photo or PDF upload), categories with per-expense limits, mileage at a company rate, reports that move from Draft to Submitted to Approved to Reimbursed, retract by the submitter, reject with a comment, approval by the submitter's manager, a finance queue for payment with a reference, policy flags (over limit, missing receipt, old expense, possible duplicate) that need an explanation before submitting, reminders to slow approvers, a spending summary, and CSV export for your accounting system.

### What this blueprint deliberately leaves out

Receipt scanning (v1 asks the employee to type the merchant, date and amount; the receipt is attached as proof), corporate and company cards and card feeds, travel booking, multiple currencies and exchange rates, per diems, tax reclaim, bill pay and invoicing, direct bank payments (finance pays through its usual bank run and records the reference here), accounting and ERP integrations (v1 exports CSV), multiple approval flows, budgets and SSO. These matter to companies with cards and travel programs. A team of 5 to 100 people reimbursing out-of-pocket spending needs receipts, one approval and a record of payment. If you want automatic receipt scanning or company cards, Expensify's free and $5 plans cover them.

## 3. Scope of v1

- One company, one currency (USD). Money is stored as integer cents. An expense paid in another currency is entered at the US dollar amount on the card or bank statement.
- Reimbursable (out-of-pocket) expenses only.
- One approval step (the submitter's manager), then payment by finance.
- One team time zone (Settings; default America/New_York) decides what "today" is. Expense dates are calendar dates.
- Receipts are private files: JPG, PNG or PDF, up to 10 MB each, stored in the platform's private file storage.
- Email notifications through an outbox. If no email provider is configured, emails are logged, not sent.
- Web app that works on a phone; taking a photo of a receipt on a phone must work.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Employee | Everyone | Create reports and expenses for themselves, submit, retract before approval, see their own reports and receipts. |
| Approver | A person who is someone's manager (Person.manager_id) | Approve or reject reports submitted by their direct reports, and see those reports and receipts. Cannot approve their own report. |
| Finance | People with is_finance | See every report and receipt, approve reports routed to them (R7), mark approved reports reimbursed, reject at the payment step, manage people and settings, export CSV, read the outbox. |

The server enforces all of this, for every action and every receipt download.

## 5. Data model

All IDs are strings. Timestamps are UTC. "Date" means a calendar date in the team time zone.

**Person**
- id, name (required), email (required, unique, stored lowercase)
- manager_id (nullable, references Person; never the person themselves, no loops)
- is_finance (boolean, default false), active (boolean, default true)

**Settings** (one row)
- company_name, time_zone (default America/New_York)
- receipt_required_cents (default 7500: a receipt is required for expenses of $75.00 or more)
- mileage_rate_cents_per_mile (integer, default 70; set this to your company's rate)
- max_age_days (default 90: expenses older than this are flagged)
- reminder_days (default 3)

**Category**
- id, name (unique), limit_cents (nullable: no limit), requires_receipt (boolean, default true), is_mileage (boolean; exactly one category, "Mileage"), active

**Report**
- id, number (sequential, starting at 101, shown as R-101), title (1 to 100 characters), owner_id
- status: draft | submitted | approved | reimbursed
- approver_id (set at submission, R7)
- submitted_at, approved_at, reimbursed_at (nullable)
- payment_reference (nullable, 1 to 100 characters; set when reimbursed), paid_on (nullable date)
- version (integer, goes up on every change)

**Expense**
- id, report_id, category_id
- date (date; not in the future), merchant (1 to 100 characters; for mileage: the trip, e.g. "Office to Acme, return")
- amount_cents (integer, 1 to 1,000,000; for mileage, computed by R5)
- miles_tenths (nullable integer; mileage only, 1 to 20,000, i.e. 0.1 to 2,000 miles), rate_cents_per_mile (nullable; copied from Settings when the expense is created)
- description (optional, max 300), explanation (the note required when the expense has a flag, 5 to 300 characters)
- receipt_file (nullable reference to a private file), created_at

**Comment**
- id, report_id, author_id, text (1 to 1,000), created_at

**Event** (append-only, never edited or deleted)
- id, report_id, actor_id (nullable for the system), type: created | expense_added | expense_edited | expense_removed | submitted | retracted | approved | rejected | reimbursed | reminded | commented
- data (JSON, nullable), created_at

**Notification** (outbox)
- id, kind, to_email, report_id, subject, body, status: pending | sent | logged | failed, error, created_at, sent_at

## 6. Amounts, mileage and flags

- **R1. Money.** Integer cents everywhere. A report's total is the sum of its expenses. Display with thousands separators and two decimals ($1,240.00).
- **R5. Mileage.** amount_cents = miles_tenths × rate_cents_per_mile ÷ 10, rounded half up to the cent. The rate is copied from Settings when the expense is created and never changes afterwards, so changing the company rate never changes existing expenses.
- **Flags.** Each expense is checked when it is saved and again when the report is submitted:
  - **Over limit:** the category has a limit and amount_cents is greater than it.
  - **Missing receipt:** the category requires receipts, amount_cents is at least receipt_required_cents, and no receipt is attached.
  - **Old expense:** the date is more than max_age_days before today.
  - **Possible duplicate:** another expense of the same person (in any report that is not reimbursed more than 90 days ago) has the same date, the same amount and the same merchant, ignoring case and spaces.
- **R4. Flags need an explanation.** A report cannot be submitted while any expense has a Missing receipt flag ("Attach a receipt for Hotel, 1 night ($289.00)."). Every other flag needs the expense's explanation filled in before submitting ("Explain why Dinner with Acme is over the Meals limit of $75.00."). Approvers see every flag and explanation.

### Worked examples (seed data in section 14; today is Tue Oct 13, 2026)

| Expense (Lee Park, R-101) | Category | Amount | Flags |
|---|---|---|---|
| Taxi to Acme, Oct 8 | Travel | $46.20 | none (under $75, no receipt needed) |
| Dinner with Acme, Oct 8 | Meals (limit $75.00) | $112.40, receipt attached | Over limit: needs an explanation |
| Hotel, 1 night, Oct 8 | Lodging (limit $300.00) | $289.00, no receipt yet | Missing receipt: blocks submitting |
| Office to Acme, return, Oct 9 | Mileage at $0.70 | 38.5 miles = $26.95 | none |
| Total | | $474.55 | |

- Mileage: 385 tenths × 70 ÷ 10 = 2,695 cents = $26.95.
- If Lee adds another "Taxi to acme" for $46.20 dated Oct 8, both taxi expenses show Possible duplicate.
- An expense dated Jul 1, 2026 is 104 days old on Oct 13 and shows Old expense.

## 7. Approval routing

- **R7. Who approves.** At submission the approver is the owner's manager. If the owner has no manager, or the manager is inactive, the approver is the first active finance person by name who is not the owner. If there is nobody, submitting is refused: "No one can approve this report. Ask finance to set your manager." Nobody ever approves their own report.

| Owner | Manager | Approver |
|---|---|---|
| Lee Park | Sam Okafor | Sam Okafor |
| Jo Park | Maya Chen | Maya Chen |
| Sam Okafor | Dana Ruiz | Dana Ruiz |
| Dana Ruiz | none | Ana Lima (the other finance person) |

## 8. Lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Employee | (none) | draft | Number assigned; event `created` |
| Add, edit or remove expense | Owner | draft | draft | Flags recomputed; events |
| Submit | Owner, or finance on the owner's behalf | draft | submitted | Needs at least one expense and R4; approver set by R7; approver emailed |
| Retract | Owner (not finance) | submitted | draft | Clears approver and submitted_at; approver emailed that it was withdrawn |
| Approve | The report's approver | submitted | approved | Approver must not be the owner; owner emailed; it joins the finance payment queue |
| Reject | The report's approver | submitted | draft | Comment of 5 to 300 characters required; owner emailed with the comment |
| Reject at payment | Finance | approved | draft | Comment required; owner and approver emailed; the report must be approved again after resubmitting |
| Mark reimbursed | Finance | approved | reimbursed | paid_on (today or earlier) and payment_reference required; owner emailed; final |

Reimbursed is final. Any other move is refused. Only draft reports can be edited.

## 9. Business rules

- **R2. Expense validation.** Date not in the future; merchant 1 to 100 characters; amount between $0.01 and $10,000.00; an active category; receipts must be JPG, PNG or PDF, at most 10 MB, and are checked by content, not just the file name.
- **R3. Receipts are private.** A receipt is served only through an authenticated route to its owner, the report's approver and finance. Anyone else, or a signed-out request, gets "Not found". Receipt links are never public URLs.
- **R6. Submitting.** A report needs at least one expense, no Missing receipt flags and an explanation on every other flagged expense.
- **R8. Visibility.** Employees see their own reports. Approvers also see reports from their direct reports. Finance sees everything. Anyone else gets "Not found" for a report URL.
- **R9. Stale changes.** Approve, reject and reimburse check the report's version; if it changed after the page was loaded, the action is refused with "This report changed. Reload to see the latest version."
- **R10. People.** A manager cannot be the person themselves or create a loop (A manages B manages A). Deactivating a person who is the approver of a submitted report is refused until finance reassigns it (finance can change the approver of a submitted report, with a comment).
- **R11. Events.** Every successful action writes the event in section 8; events are never edited or deleted.
- **R12. Text.** Merchant names, descriptions, explanations and comments are rendered as text, never as HTML.

## 10. Screens

1. **My reports** (home). Each report with number, title, total, status and the next step ("Waiting for Sam Okafor", "Approved, waiting for payment", "Paid Oct 16, reference ACH-1016"). New report button.
2. **Report.** Title, status, approver, total, and the expenses table (date, category, merchant, amount, receipt, flags with their explanation). Add expense (with "Mileage" switching the amount field to miles), receipt upload with a phone camera option, comments, and the activity log. Actions by role and status: Submit, Retract, Approve, Reject, Mark reimbursed.
3. **To approve.** Submitted reports waiting on me, oldest first, with total and flag count.
4. **Finance: Payments.** Approved reports waiting to be paid, grouped by employee, with totals; select several and Mark reimbursed with one paid_on date and reference; Export CSV of the selection.
5. **Finance: All reports.** Every report with filters by status, person and month.
6. **Finance: Spending.** Totals of reimbursed and approved expenses by category and by month (last 6 months), and by person for the selected month.
7. **Admin: People** (manager, finance flag, active) and **Admin: Settings** (receipt threshold, mileage rate, max age, reminder days, categories with limits). Finance only.
8. **Admin: Outbox.**

## 11. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Submit | Approver | "To approve: R-101 Boston client visit ($474.55) from Lee Park" |
| Retract | Approver | "Withdrawn: R-101 Boston client visit" |
| Approve | Owner | "Approved: R-101, waiting for payment" |
| Reject (either step) | Owner (and the approver, at the payment step) | "Changes requested on R-101" (with the comment) |
| Mark reimbursed | Owner | "Paid: R-101 ($474.55), reference ACH-1016" |
| Reminder (section 12) | Approver | "Reminder: R-102 has been waiting 3 days" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Failed sends are retried. A notification failure never blocks the action that caused it.

## 12. Scheduled job and time

An hourly job (protected by a CRON_SECRET header) does two things:
1. **Reminders.** For each submitted report waiting reminder_days or more since submitted_at, with no reminder yet for that submission, email the approver once and write a `reminded` event.
2. **Retry** failed notifications.

All time reads go through one function that adds the development clock offset.

## 13. Edge cases

- A manager leaves while a report waits for them: deactivation is refused until finance reassigns the report (R10).
- An employee's manager changes after they submit: the report keeps its approver; the next submission uses the new manager.
- The mileage rate changes: existing expenses keep their rate (R5); new ones use the new rate.
- An expense is entered twice by mistake: Possible duplicate flags both, and the employee removes one before submitting or explains why they are different.
- Finance marks a report reimbursed by mistake: reimbursed is final; record a correcting comment and handle it in the next payment run. (Reversals are a variation.)
- A receipt photo is very large: refused above 10 MB with "Receipts can be up to 10 MB."

## 14. Seed data

Settings: company "Fernway", time zone America/New_York, receipt threshold $75.00, mileage rate $0.70 per mile, max age 90 days, reminder after 3 days.

Categories: Travel (no limit), Meals (limit $75.00), Lodging (limit $300.00), Software (limit $200.00), Office supplies (limit $150.00), Other (no limit), Mileage (no limit, no receipt).

People: Dana Ruiz (finance, no manager), Ana Lima (finance, manager Dana Ruiz), Sam Okafor (manager Dana Ruiz), Maya Chen (manager Dana Ruiz), Lee Park (manager Sam Okafor), Jo Park (manager Maya Chen). Everyone is active.

Reports (T is when the seed is loaded, here Tue Oct 13, 2026):

| Report | Owner | Status | Expenses | Total |
|---|---|---|---|---|
| R-101 Boston client visit | Lee Park | Draft | The four expenses in section 6 (dinner receipt attached, hotel receipt missing, no explanations yet) | $474.55 |
| R-102 October software | Jo Park | Submitted T-4 days, approver Maya Chen, no reminder yet | Figma plugin, Oct 2, Software, $24.00; Stock photos, Oct 5, Software, $180.00, receipt attached | $204.00 |
| R-103 Team offsite supplies | Sam Okafor | Approved T-1 day by Dana Ruiz | Notebooks and markers, Oct 6, Office supplies, $132.80, receipt attached | $132.80 |
| R-104 Design conference | Maya Chen | Reimbursed Sep 30, reference ACH-0930 | Conference ticket, Sep 10, Other, $890.00; Hotel, 2 nights, Sep 11, Lodging, $350.00 (over limit, explained "Two nights in one charge, $175 a night"); both with receipts | $1,240.00 |

Use small placeholder images as seed receipts.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation

```
Using the Expense Reports blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database and private file storage for receipts.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask finance to add you."
3. Build Admin: People and Admin: Settings with categories (section 10, screen 7). Only finance can use them; enforce R10 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

Do not build reports or expenses yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin: Settings shows a $75.00 receipt threshold, a mileage rate of $0.70 and the seven categories with Meals limited to $75.00.
- [ ] Signed in as Lee, Admin: People says "Only finance can open this page." and a direct request to change settings is refused.
- [ ] Setting Dana Ruiz's manager to Lee Park is refused because it would create a loop (Lee reports to Sam, who reports to Dana).
- [ ] Changing the mileage rate to $0.72 and the Meals limit to $80.00 saves both, and Admin: Settings shows the new values after a reload.

### Phase 2: Reports, expenses and flags

```
Using the Expense Reports blueprint above, build Phase 2 only.

1. Build My reports and the Report screen (section 10, screens 1 and 2) for employees: create reports, add, edit and remove expenses with receipt upload (including a phone camera option) and mileage.
2. Implement R1, R2, R5, the four flags and R4 (section 6), recomputed on the server on every save and again at submission.
3. Implement Submit and Retract (section 8) with R6, R7 and R8, and serve receipts only as R3 describes.
4. Write the Submit and Retract emails to the outbox (section 11) and build Admin: Outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Lee, R-101 shows a total of $474.55, the mileage expense as 38.5 miles = $26.95, an Over limit flag on the dinner and a Missing receipt flag on the hotel.
- [ ] Submitting R-101 is refused with "Attach a receipt for Hotel, 1 night ($289.00)."; after uploading a receipt it is refused with the message asking to explain the dinner.
- [ ] After adding the explanation "Dinner with three people from Acme", R-101 submits, its approver is Sam Okafor, and the outbox has "To approve: R-101 Boston client visit ($474.55) from Lee Park".
- [ ] Adding a second "Taxi to acme" for $46.20 dated Oct 8 to a new draft report flags both taxi expenses as Possible duplicate.
- [ ] Uploading a 12 MB file, or a text file renamed receipt.jpg, is refused.
- [ ] Signed in as Jo, opening R-101 returns Not found, and a direct request for its hotel receipt returns Not found.
- [ ] Lee retracts R-101: it returns to Draft, and the outbox has "Withdrawn: R-101 Boston client visit" for Sam.
- [ ] An expense dated tomorrow is refused, and one dated Jul 1, 2026 shows Old expense.
- [ ] After the mileage rate is changed to $0.72 in Settings, R-101's mileage expense still shows $26.95, and a new 10-mile expense shows $7.20.

### Phase 3: Approval and payment

```
Using the Expense Reports blueprint above, build Phase 3 only.

1. Build To approve, Finance: Payments and Finance: All reports (section 10, screens 3 to 5).
2. Implement Approve, Reject, Reject at payment and Mark reimbursed (section 8) with R7 and R9, enforced on the server, and the related emails (section 11).
3. Add CSV export from Finance: Payments: report number, employee, email, approved date, total, and one line per expense with date, category, merchant and amount.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Maya, To approve lists R-102 ($204.00) from Jo Park; approving it emails Jo "Approved: R-102, waiting for payment" and it appears in Finance: Payments.
- [ ] After Lee submits R-101 again, signed in as Sam, rejecting it without a comment is refused; with the comment "Please split the hotel onto its own report" it returns to Draft and Lee is emailed the comment.
- [ ] Signed in as Dana, submitting a report of her own routes it to Ana Lima, and Dana has no Approve button on it; a direct approve request from Dana is refused.
- [ ] Exporting R-103 from Finance: Payments downloads a CSV with its one expense line and the total $132.80.
- [ ] Marking a report reimbursed without a reference is refused.
- [ ] In Finance: Payments, Dana selects R-102 and R-103 and marks them reimbursed on today's date with reference ACH-1016; both show "Paid", their owners are emailed, and they no longer appear in Payments.
- [ ] Lee submits R-101 again. With it open in two windows as Sam, approving it in one and then rejecting it in the other is refused with "This report changed. Reload to see the latest version."

### Phase 4: Reminders and spending

```
Using the Expense Reports blueprint above, build Phase 4 only.

1. Build the scheduled job in section 12, with a development-only "run job now" control that uses the development clock.
2. Build Finance: Spending (section 10, screen 6).
3. Let finance change the approver of a submitted report with a comment, and enforce the deactivation rule in R10.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (reset to seed data first)
- [ ] Running the job emails Maya "Reminder: R-102 has been waiting 4 days" once; running it again sends nothing new.
- [ ] Deactivating Maya Chen is refused while R-102 waits for her; after finance reassigns R-102 to Dana with a comment, deactivation succeeds.
- [ ] Finance: Spending for September shows Other $890.00 and Lodging $350.00 from R-104.
- [ ] Signed in as Lee, Finance: Spending says "Only finance can open this page."

## 16. Variations

- Receipt scanning that suggests the merchant, date and amount for the employee to confirm.
- Per diems by city.
- A second approval by finance for reports over a set total.
- Multiple currencies with the exchange rate on the expense date.
- Direct payment through your bank's API, with the reference filled in automatically.
- Export to QuickBooks or Xero.
- Reversing a reimbursed report with a correcting entry.
