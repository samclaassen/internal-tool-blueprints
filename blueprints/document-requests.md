<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/document-requests . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Document Requests

Blueprint BP-031 · Department: Finance · Replaces: Content Snare, document checklists sent by email, "did you get my attachment?"
For teams of 2 to 50 people who collect documents and answers from clients.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Every year-end we chase clients for the same twelve documents, one email at a time."

A bookkeeping firm, agency or law practice sends clients a checklist by email. Files come back as attachments over weeks, half of them the wrong year, some by text message. Someone tracks what is missing in a spreadsheet, writes reminders by hand, and nobody can tell a client exactly what is still outstanding.

This blueprint is a document request app: staff send a client a request built from a template of items (files to upload, questions to answer), the client works through it from a secure link at their own pace, reminders go out on a schedule until it is done, and staff accept each item or ask for changes. Everything is in one place, with a download of all accepted files at the end.

## 2. What the real product does

Research basis: Content Snare's pricing page (contentsnare.com/pricing), October 2026, in US dollars.

What we verified:

1. **Plans, priced by active requests and users.** Basic: $35 a month billed annually ($42 monthly), with 20 active requests, 2 users, 20 GB of storage and 40 SMS a month. Plus: $71 annually ($85 monthly), with 50 active requests, 5 users, 50 GB, 100 SMS, custom branding and premium integrations. Pro: $119 annually ($143 monthly), with 100 active requests, 10 users, 100 GB and 200 SMS. Custom: from $215 a month annually ($258 monthly), with 200 or more active requests and 20 or more users. No contracts.
2. **Every plan** includes unlimited clients, reminders, questions, upload areas and templates, a drag-and-drop request builder, a simple client portal, an approval system, pre-made email templates and Zapier.
3. **An active request** is a form you have sent to a client that isn't finished yet.

A firm with 10 staff pays $1,428 a year on Pro, billed annually, for up to 100 active requests at a time.

### What this blueprint keeps

Templates of items (file uploads and questions); requests sent to a client with a due date; a secure client link with an emailed access code; saving as the client goes; reminders on a schedule that stop when the request is submitted; staff review of each item (accept, or request changes with a comment); progress for staff and client; a dashboard of requests by status and what is overdue; a download of all accepted files; and file retention.

### What this blueprint deliberately leaves out

SMS reminders, custom branding per client, identity checks (KYC/AML), integrations with practice management software, e-signatures, and payments.

## 3. Scope of v1

- One firm. Clients don't have accounts; each request has its own secure link.
- Files up to 25 MB each, of types PDF, JPG, PNG, HEIC, CSV, XLSX and DOCX, stored in private storage and served only through checked links.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Practice manager | Everything: settings, templates, staff, every request, retention. |
| Staff | Accountants, account managers | Create and send requests, review items, and see the requests they own or are added to. |
| Client | The client's contact | Through the request link and access code only: answer questions, upload files, read comments, submit. |

A client can see only their own request, never other requests or internal notes. The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): firm_name, from_email, retention_days (90), reminder_first_after_days (3), reminder_every_days (4), reminder_before_due_days (2), max_reminders (6).

**Staff**: id, name, email, role: admin | staff, active.

**Template**: id, name, items: list of { label, help_text, kind: files | text | long_text | choice | date, options, required }.

**Client**: id, name, contact_name, contact_email.

**Request**: id, number (R-0001), client_id, title, owner_id, watcher_ids, due_on, status: draft | sent | in_progress | submitted | completed | cancelled, sent_at, submitted_at, completed_at, token (random, long), token_revoked, reminders_sent, last_reminded_on.

**Item** (copied from the template when the request is created): id, request_id, position, label, help_text, kind, options, required, answer_text, review: empty | answered | accepted | changes_requested, review_comment, updated_at.

**File**: id, item_id, name, size, type, storage_key, uploaded_at, deleted_at.

**AccessCode**: request_id, code_hash, expires_at, used_at. **ClientSession**: request_id, browser_token_hash, created_at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Progress and reminders

- An item is **done for the client** when it has an answer or at least one file; **accepted** when staff accept it.
- **Client progress** = required items done ÷ required items. **Staff progress** = required items accepted ÷ required items.
- The request becomes **in progress** at the client's first answer, **submitted** when the client presses Submit (allowed only when every required item is done), and **completed** when staff accept every required item.
- If staff request changes on an item of a submitted request, the request goes back to **in progress**, and the client is emailed the comment.

**Reminders** (to the client, only while the request is sent or in progress): the first one reminder_first_after_days after sending, then every reminder_every_days, plus one reminder_before_due_days before the due date and one on the due date, never more than one a day and never more than max_reminders in all. Each reminder lists the required items still to do.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Situation | Result |
|---|---|
| R-0012 for Bluebird Bakery: 7 required items, 5 done by the client, 3 of them accepted | Client sees "5 of 7 done"; staff see 3 of 7 accepted (43%) |
| R-0013 for Pine Dental, sent Oct 12, not started, due Oct 30 | Reminders on Oct 15, 19, 23, 27, 28 (2 days before due) and 30: six in all |
| Staff request changes on "Bank statements, January to December" with "December is missing" | The item shows the comment to the client; a submitted request goes back to in progress |
| A client opens the link in a new browser | They are asked for the 6-digit code emailed to the contact; it works once, within 10 minutes |
| Uploading a 30 MB file, or a .exe | Refused: "Files can be up to 25 MB, and PDF, JPG, PNG, HEIC, CSV, XLSX or DOCX." |

## 7. Request lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create from template | Staff | | draft | Items copied; editing the request never changes the template |
| Send | Owner or admin | draft | sent | Email with the link to the client contact |
| Answer or upload | Client | sent, in_progress | in_progress | Saved as they go |
| Submit | Client | in_progress | submitted | Every required item done; owner emailed |
| Accept item | Staff | | | When every required item is accepted, the request is completed and the client is emailed "All done" |
| Request changes | Staff | | in_progress (if submitted) | Comment required; client emailed |
| Cancel | Owner or admin | draft, sent, in_progress, submitted | cancelled | Link stops working; client emailed if it had been sent |
| Resend link | Owner or admin | sent, in_progress | same | Old token revoked, new link emailed |

## 8. Business rules

- **R1. Client access.** The link works only with its token, for a request that isn't cancelled or past retention. On a browser without a client session, the client must enter a 6-digit code emailed to the contact (valid 10 minutes, single use, at most 5 tries, then a new code is needed).
- **R2. Files** follow section 3's size and type limits, are stored privately, and are downloaded only by staff who can see the request or by the client through their session.
- **R3. Progress and statuses** follow section 6 and section 7.
- **R4. Reminders** follow section 6, run by a daily job at 09:00 that is safe to run twice.
- **R5. Reviews.** Only staff review; a review comment is required to request changes; every review is kept in the event log.
- **R6. Visibility.** Staff see requests they own or watch; admins see all.
- **R7. Retention.** Files of completed or cancelled requests are deleted retention_days after completion or cancellation; the owner is emailed 7 days before. Answers and the event log are kept.
- **R8. Download.** Staff can download all accepted files of a request as a zip, one folder per item.
- **R9. Templates.** Editing a template never changes requests already created from it.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Requests** (staff home): by status, with client, title, owner, due date, client progress, staff progress and overdue first.
2. **Request page** (staff): items with answers, files and review buttons, comments, the timeline, reminders sent, and actions (send, resend link, cancel, download).
3. **Client view** (/r/<token>): firm name, title, due date, progress, each item with help text and upload or answer field, staff comments, and Submit.
4. **Templates**: items with kind, help text and required flag.
5. **Clients**, **Staff**, **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Sent | Client contact | "Bluebird Bakery: documents for Year-end 2026 (due Oct 30)" with the link |
| Access code | Client contact | "Your code for Ledger & Co: 482913" |
| Reminder (R4) | Client contact | "Reminder: 2 items still needed for Year-end 2026" |
| Changes requested | Client contact | "Ledger & Co asked about: Bank statements" with the comment |
| Submitted | Owner | "Pine Dental submitted Year-end 2026" |
| Completed | Client contact | "All done: Year-end 2026" |
| Retention warning | Owner | "Files for R-0009 will be deleted on Oct 22" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so reminders, access codes, due dates and retention can be tested by moving the clock.

## 12. Export

Staff can download a request's accepted files as a zip (R8), and admins can export requests as CSV: number, client, title, owner, status, sent, submitted, completed, due, required items, done, accepted, reminders sent.

## 13. Edge cases

- A client uploads to the wrong item: they can delete their own files until the item is accepted.
- The contact person changes: staff update the client's contact email and resend the link; the old link stops working.
- Two people at the client work on the same request: both use the link and the code goes to the contact; the timeline shows each change.
- A request's due date passes: it shows Overdue to staff; reminders continue until max_reminders.
- Storage is full or an upload fails halfway: the client sees "Upload failed, please try again" and nothing partial is saved.

## 14. Seed data

Firm "Ledger & Co", bookkeeping and tax; from documents@ledgerco.example. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Staff (emails firstname@ledgerco.example): Maya Ortiz (admin), Sam Lee (staff), Ivy Chen (staff).

Template "Year-end 2026": Bank statements, January to December (files, required); Credit card statements (files, required); Payroll summary (files, required); Vehicle mileage (text, required); Any new loans or leases? (choice: Yes, No, required); Loan or lease documents (files, optional); Point-of-sale sales report (files, required); Owner's draws (text, required).

Clients: Bluebird Bakery (Ana Lopez, ana@bluebirdbakery.example), Pine Dental (Dr. Lee Park, office@pinedental.example), Harbor Studio (Jo Harbor, jo@harborstudio.example).

Requests:
- R-0012 Bluebird Bakery, Year-end 2026, owner Sam, sent Oct 5, due Oct 30, in progress: 5 of 7 required items done (bank statements, credit card statements, payroll summary, mileage, new loans: No), 3 accepted (credit card, payroll, mileage); point-of-sale report and owner's draws not done.
- R-0013 Pine Dental, Year-end 2026, owner Ivy, sent Oct 12, due Oct 30, not started.
- R-0011 Harbor Studio, Year-end 2026, owner Sam, submitted Oct 13, all required items done, none reviewed yet.
- R-0009 Harbor Studio, Q2 receipts, owner Sam, completed Jul 24 with 4 files.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, templates and requests

```
Using the Document Requests blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database and private file storage.
2. Add staff sign-in with the platform's built-in auth or Google sign-in limited to our company email domain; a signed-in email must match an active Staff member, and anyone else sees "Ask the practice manager to add you."
3. Build Templates, Clients, Requests and the staff Request page (section 9, screens 1, 2, 4 and 5), with create from template, send, cancel and resend link (section 7), R6 and R9, without the client view yet.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Requests lists R-0011 as submitted, R-0012 in progress with client progress 5 of 7 and staff progress 3 of 7, and R-0013 sent and not started.
- [ ] Creating a request for Harbor Studio from "Year-end 2026" copies all 8 items; changing an item's label on that request leaves the template unchanged.
- [ ] Signed in as Ivy, she sees R-0013 but not Sam's requests, and a direct request for R-0012 is refused.

### Phase 2: The client view

```
Using the Document Requests blueprint above, build Phase 2 only.

1. Build the Client view (section 9, screen 3) with the access code (R1), answers and uploads with the limits in section 3 (R2), progress and Submit (section 6).
2. Write the client emails in section 10 to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Opening R-0012's link in a new browser asks for a code; the emailed code works once, and a code older than 10 minutes is refused.
- [ ] As the client, uploading a PDF to the point-of-sale report and answering owner's draws shows "7 of 7 done" and enables Submit; submitting emails Sam.
- [ ] Uploading a 30 MB file or a .exe is refused with the message in section 6.
- [ ] A link with a wrong token shows "This link isn't valid", and R-0012's link stops working after Sam resends the link.

### Phase 3: Review, reminders and completion

```
Using the Document Requests blueprint above, build Phase 3 only.

1. Add item review (accept, request changes) with R5, and completion (section 7).
2. Build the daily reminder job (R4) exactly as section 6 describes.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] On R-0011, Sam requests changes on bank statements with "December is missing": R-0011 goes back to in progress and Jo Harbor is emailed the comment; after the client uploads again and Sam accepts every required item, R-0011 is completed and the client is emailed "All done".
- [ ] Requesting changes without a comment is refused.
- [ ] Running the job today sends R-0013's first reminder listing all 7 required items still to do, and running it again sends nothing.
- [ ] Moving the clock day by day to Oct 30 and running the job each day sends R-0013's reminders on Oct 15, 19, 23, 27, 28 and 30 and no more.

### Phase 4: Download, retention and export

```
Using the Document Requests blueprint above, build Phase 4 only.

1. Build the zip download (R8), retention with its warning (R7), and the CSV export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Downloading R-0012's accepted files gives a zip with one folder per accepted file item.
- [ ] Running the job on Oct 15 warns Sam that R-0009's files will be deleted on Oct 22; on Oct 22 the files are deleted and the request's answers and history remain.
- [ ] The requests export lists all four requests with status, items done and accepted, and reminders sent.

## 16. Variations

- SMS reminders for clients who ignore email.
- Pull the client list from your practice management software.
- Recurring requests (every quarter) created automatically.
- A virus scan on every upload.
- Your firm's logo and colors on the client view.
