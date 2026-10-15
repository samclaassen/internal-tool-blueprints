<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/simple-crm . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Simple CRM

Blueprint BP-001 · Department: Sales · Replaces: HubSpot (free CRM), Pipedrive
For teams of 1 to 15 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 13 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"We pay for a giant CRM and use about ten percent of it."

A small sales team needs three things from a CRM: a list of people and companies, the deals in play, and a reminder of who to call next. Everything else (email sequences, scoring, forecasting, marketing contacts) sits unused. Meanwhile the one thing that matters slips: a promised follow-up is forgotten because nothing put it in front of the right person on the right day.

This blueprint is a CRM built around one rule: every contact has a next follow-up date, and the ones that are late are always at the top.

## 2. What the real product does

Research basis (October 2026):
- HubSpot free CRM product page and pricing: hubspot.com/products/crm, hubspot.com/pricing/crm
- HubSpot knowledge base: knowledge.hubspot.com/object-settings/set-up-and-customize-pipelines, knowledge.hubspot.com/records/manually-log-activities-on-records, knowledge.hubspot.com/import-and-export/import-objects
- Pipedrive pricing: pipedrive.com/en/pricing
- Pipedrive knowledge base: support.pipedrive.com/en/article/activities, support.pipedrive.com/en/article/pipeline-view, support.pipedrive.com/en/article/importing-data-into-pipedrive-with-spreadsheets

What we verified:

1. **Price and limits.** HubSpot's free CRM is free for up to 2 users and, per its product page, up to 1,000 contacts. Paid HubSpot seats start at $15 per seat per month (Starter, which adds required fields, permission sets and multiple currencies). Pipedrive has no free tier: Lite is $14, Growth $39, Premium $59 and Ultimate $79 per seat per month, billed annually, with a 14-day trial.
2. **Contacts and companies.** Both products keep people and companies (Pipedrive calls them organizations) as separate records, linked to each other and to deals. Records have an owner.
3. **Deal pipeline.** HubSpot's default sales pipeline has seven stages, each with a probability: Appointment scheduled (20%), Qualified to buy (40%), Presentation scheduled (60%), Decision maker bought-in (80%), Contract sent (90%), Closed won (100%), Closed lost (0%). The board view shows a weighted amount per stage: the total amount in the stage multiplied by the stage probability. Pipedrive's pipeline view moves deals through stages until they are marked Won or Lost; closed deals leave the active board. Cards show title, contact, value and owner. Deals are sorted by next activity by default and can be sorted by value or expected close date. A Pipedrive deal must be linked to a person or an organization.
4. **Activities.** HubSpot lets you log a note, email, call or meeting on a record with the date it happened, and offers a "task follow up" option in the same form ("log an email and create a task due in two business days to follow up"). Pipedrive activity types are call, meeting, task, deadline, email and lunch; every person and deal shows a "last activity date" (last activity marked done) and a "next activity date" (next scheduled activity not yet done).
5. **Import.** HubSpot accepts a file upload or data pasted directly from a spreadsheet, matches existing contacts by email, and shows mapping errors you can fix or skip before importing. Pipedrive requires a header row, maps columns by name, requires a name for people and organizations, suggests email as an extra identifier to reduce duplicates, previews the result, and reports how many rows were added, updated, merged or skipped, with a reason for each skipped row (for example, an invalid date format).

### What this blueprint keeps

Contacts and companies with owners; one deal pipeline with stage probabilities and Won/Lost; a next follow-up date on every contact (Pipedrive's "next activity date", reduced to the one date that matters); a log-activity form that always sets the next follow-up (HubSpot's "task follow up", made mandatory); a pipeline board with per-stage totals and weighted totals; simple search; CSV export; CSV import by paste with a validation preview and duplicate detection by email; a daily email digest of what is due.

### What this blueprint deliberately leaves out

Email sync and open tracking, sequences, marketing contacts and forms, multiple pipelines, custom fields and custom objects, lead scoring, meeting scheduler and calendar sync, quotes, tickets, AI assistants, forecasting beyond weighted totals, and updating existing records by import. These earn their keep in larger sales teams. A team of 1 to 15 people needs the list, the board and the reminder.

## 3. Scope of v1

- One team, one currency (set once by an admin; default USD). Deal values are stored as integer cents.
- One pipeline with fixed stages (section 7).
- Follow-up and close dates are calendar dates (no time of day), interpreted in one team time zone (a configuration value such as a `TEAM_TIME_ZONE` environment variable; default America/New_York). "Today" means today in that time zone.
- Web app that works on a phone. One email per person per day (the digest). No other notifications.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Member | Everyone on the team | See every contact, company and deal. Create contacts, companies and deals. Log activities on any contact. Edit, reschedule, archive or move only records they own. Export CSV. |
| Owner | The person set as owner of a record | Edit the record, change its owner, reschedule its follow-up, archive it; for deals, move stages, mark won or lost, reopen. |
| Admin | One or more people | Everything an owner can do, on every record. Manage the team (add people, deactivate with reassignment). Import CSV. Delete any logged activity. |

Everyone can see everything: on a small team, a colleague often covers a call. Only changes are restricted. Any member can log an activity on any contact (the activity records who logged it).

## 5. Data model

All IDs are strings. Dates written as "date" are calendar dates stored as `YYYY-MM-DD`. Timestamps are UTC.

**Person** (a user of the CRM)
- id
- name (required)
- email (required, unique, case-insensitive)
- is_admin (boolean, default false)
- active (boolean, default true)

**Company**
- id
- name (required, max 120 chars, unique case-insensitive)
- domain (optional; normalised to lowercase without `https://`, `www.` or a path, e.g. `acme.example`; unique when present)
- owner_id (references an active Person)
- created_at (timestamp)

**Contact**
- id
- name (required, max 120 chars)
- email (optional; unique across all contacts, including archived ones, case-insensitive)
- phone (optional, free text)
- title (optional, job title)
- company_id (nullable, references Company)
- owner_id (references an active Person)
- next_follow_up (date, required while the contact is not archived)
- archived (boolean, default false)
- created_at (timestamp)
- last_activity_on (derived: the latest `happened_on` among the contact's call, email, meeting and note activities; empty if none)

**Deal**
- id
- title (required, max 120 chars)
- contact_id (required, references Contact)
- company_id (nullable; copied from the contact's company whenever the deal's contact is set)
- owner_id (references an active Person while the deal is open)
- value_cents (integer, 0 or more)
- stage: lead | demo | proposal | negotiation | won | lost
- expected_close (date, required)
- closed_on (date; set when the deal is won or lost, cleared on reopen)
- lost_reason (text; required when the deal is lost, cleared on reopen)
- created_at (timestamp)

**Activity** (the timeline of a contact)
- id
- contact_id (required)
- deal_id (nullable; set when the activity is about a deal)
- type: call | email | meeting | note | system
- happened_on (date)
- note (text, max 2,000 chars; required for note and system types)
- by_id (the Person who logged it)
- created_at (timestamp)

`system` activities are written by the app (contact created or imported, owner changed, follow-up moved, deal created, deal stage changed, archived, unarchived). People cannot log or delete them.

**DigestLog** (one row per digest email, so the job never sends twice)
- id, person_id, date (the day the digest covers), overdue_count, due_today_count, deals_count, sent_at, error

## 6. Business rules

Follow-ups
- **R1.** Every contact that is not archived has exactly one next follow-up date. It can be moved but never cleared. To stop following someone up, archive them.
- **R2.** A contact's follow-up status is computed against today: **overdue** if `next_follow_up` is before today, **due today** if equal, **upcoming** if later. "Overdue N days" means today minus `next_follow_up` in days.
- **R3.** Contact lists are sorted overdue first (oldest date first), then due today, then upcoming (soonest first). Ties sort by contact name A to Z. Archived contacts never appear in this list unless the Archived filter is chosen.
- **R4.** When a person enters or changes a follow-up date by hand (new contact, edit, reschedule), it must be today or later. Saving other fields on an overdue contact does not force a new date.
- **R5.** Logging an activity (call, email, meeting or note) always sets the contact's next follow-up. The new date must be after today (tomorrow or later): logging means you followed up today. The form offers quick picks Tomorrow, 3 days, 1 week, 2 weeks, and defaults to 3 days.
- **R6.** An activity's `happened_on` must be today or earlier. The note is required for the note type (at least 3 characters) and optional for call, email and meeting.
- **R7.** Anyone can log an activity on any active contact. Archived contacts cannot get new activities until they are unarchived.
- **R8.** The author of an activity or an admin can delete a call, email, meeting or note. Deleting does not change the contact's follow-up date. System activities cannot be deleted.

Ownership and permissions
- **R9.** Every company, contact and open deal has an active owner. New records default to the person creating them.
- **R10.** Only the record's owner or an admin can edit it, change its owner, reschedule its follow-up, archive or unarchive it, or (for deals) move its stage, mark it won or lost, or reopen it. The refusal message names the owner: "Only Sam Okafor (the owner) or an admin can change this contact."
- **R11.** Changing a contact's owner or follow-up date writes a system activity ("Owner changed from Jo Park to Maya Chen", "Follow-up moved from Oct 10 to Oct 20").

Duplicates and validation
- **R12.** Contact email is unique across all contacts, archived included, compared trimmed and case-insensitive. The error names the existing contact: "Kim Olsen already uses kim@olsen.example."
- **R13.** Company names are unique (case-insensitive, trimmed). When a contact form or an import row names a company that does not exist, the company is created, owned by the contact's owner. When it matches an existing company (ignoring case), that company is used.
- **R14.** Archiving a contact who has open deals is refused: "Kim Olsen has 1 open deal. Close it or move it to another contact first." Unarchiving sets `next_follow_up` to today if the stored date is in the past.

Deals
- **R15.** A deal needs a title, a contact who is not archived, a value of $0 or more, and an expected close date. When an expected close date is set or changed on an open deal, it must be today or later. A deal is created in an open stage only.
- **R16.** An open deal whose expected close is before today is flagged "Past close date" on the board, on the Today screen and in the owner's digest. The flag clears when the date is moved or the deal is closed.
- **R17.** Moving a deal to Lost requires a reason of at least 3 characters. Won and Lost set `closed_on` to today. Reopening (moving a closed deal to an open stage) clears `closed_on` and `lost_reason`. If its owner has been deactivated, the reopened deal is assigned to the active admin reopening it (R9 and R10); otherwise the owner stays unchanged. Every stage change writes a system activity on the deal's contact with `deal_id` set.
- **R18.** Stage totals use open deals only: count, sum of `value_cents`, and weighted sum (value × stage probability, rounded to the nearest cent per deal). "Won this month" is the sum of deals with stage won and `closed_on` in the current calendar month.

Team
- **R19.** Only admins can add or deactivate people. An admin cannot deactivate themselves. Deactivating requires picking an active person to receive their records: all their companies and contacts (archived included) and their open deals are reassigned. Closed deals keep their original owner, so history stays true. Inactive people disappear from owner pickers and from Act as.

Search, import and export
- **R20.** Search is case-insensitive. The query is split on spaces and every term must appear somewhere in the record: contact name, email, phone, title and company name; company name and domain; deal title, company name and contact name. Queries shorter than 2 characters are refused: "Type at least 2 characters." Archived contacts appear in results, labelled Archived.
- **R21.** Only admins can import. Export is open to everyone and exports exactly the rows in the current view (filters applied, in display order).

## 7. Deals and pipeline

| Stage | Probability | Open? |
|---|---|---|
| Lead | 10% | yes |
| Demo | 30% | yes |
| Proposal | 60% | yes |
| Negotiation | 80% | yes |
| Won | 100% | no |
| Lost | 0% | no |

### Deal lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | Anyone | (none) | lead, demo, proposal or negotiation | `company_id` copied from the contact; system activity "Deal created" |
| Edit | Owner or admin | any | same | Contact change re-copies `company_id`; new expected close must be today or later if the deal is open |
| Move | Owner or admin | open stage | another open stage | System activity "Moved from Proposal to Negotiation" |
| Mark won | Owner or admin | open stage | won | `closed_on` = today; system activity |
| Mark lost | Owner or admin | open stage | lost | Reason required (R17); `closed_on` = today; system activity with the reason |
| Reopen | Owner or admin | won or lost | an open stage | Clears `closed_on` and `lost_reason`; system activity. If the expected close is now in the past the deal shows "Past close date" until it is updated |

Moving a deal to the stage it is already in is refused: "Bluebird annual plan is already in Proposal."

### Worked examples (with the seed data in section 12; T is today)

**Contact order (Everyone).** Grace Kim (overdue 6 days), Priya Shah (3), Hana Sato (2), Rosa Diaz (1), then due today: Kim Olsen, Nina Patel (name order), then Leo Martins (T+1), Owen Hart (T+2), Tom Becker (T+4), Ivan Petrov (T+5), Zoe Carter (T+7), Marcus Lee (T+9), Felix Wong (T+14). Ruth Adams is archived and not listed.

**Clock moves one day.** Today becomes T+1. The order is now Grace Kim (overdue 7 days), Priya Shah (4), Hana Sato (3), Rosa Diaz (2), Kim Olsen (1), Nina Patel (1), then Leo Martins (due today), then the rest. Kim Olsen and Nina Patel tie on date and sort by name.

**Logging a call.** On day T, Sam logs a call with Priya Shah ("Walked through pricing, needs Tom's sign-off") and picks "1 week". Priya's next follow-up becomes T+7, her last activity becomes T, and she drops out of Sam's overdue list. Sam's overdue count goes from 2 to 1.

**Board totals.**

| Stage | Deals | Total | Weighted |
|---|---|---|---|
| Lead | Acme expansion $12,500, Kestrel starter $3,200 | $15,700 | $1,570 |
| Demo | Bluebird add-on seats $4,500, Acme pilot $6,000, Pine Labs team plan $7,400 | $17,900 | $5,370 |
| Proposal | Bluebird annual plan $18,000, Ridgeway onboarding $9,800 | $27,800 | $16,680 |
| Negotiation | Olsen & Co rollout $32,000, Harbor renewal $15,000 | $47,000 | $37,600 |
| Open pipeline | 9 deals | $108,400 | $61,220 |

Filtered to Sam's deals: Bluebird annual plan, Bluebird add-on seats, Harbor renewal: $37,500 open.

Moving Bluebird annual plan from Proposal to Negotiation: Proposal becomes $9,800 (1 deal), Negotiation $65,000 (3 deals). The open total is unchanged; the weighted total rises by $3,600 (from 60% to 80% of $18,000).

## 8. Screens

1. **Today** (home). For the signed-in person, with a Me / Everyone toggle. Three sections: Overdue (red, most overdue first, "Overdue 3 days"), Due today, and Deals to watch (their open deals that are past close date or closing in the next 7 days). Each contact row has a Log activity button that opens the log form for that contact. Shows a one-line note when today's digest was sent ("Digest sent for Oct 14: 2 overdue, 0 due today, 1 deal"). Empty state: "Nothing due today. Nice."
2. **Contacts.** Table: name (with title and company), owner, open deal (most advanced stage and value), last activity ("Call · 10 days ago"), next follow-up (badge: "Overdue 3d" red, "Today" amber, or a date). Filters: Mine / Everyone / a specific owner; All / Overdue / Due today / Archived. Summary line: "3 overdue · 2 due today". Buttons: New contact, Export CSV, Import (admins).
3. **Contact detail.** Name, title, company link, email, phone, owner, follow-up status. **Log activity** card: type (Call, Email, Meeting, Note), date it happened (default today), note, optional deal (open deals of this contact), next follow-up with quick picks. Timeline (newest first, system entries muted, delete for the author or admins). Deals list with New deal. Actions for owner or admin: Edit, Reschedule follow-up, Archive or Unarchive.
4. **New / edit contact.** Name, email, phone, title, company (pick an existing one or type a new name), owner, next follow-up (default today).
5. **Companies.** Table: name, domain, owner, active contacts, open deal value, earliest next follow-up among its contacts. New company.
6. **Company detail.** Fields, contacts (with follow-up badges), deals, and the combined recent timeline of its contacts. Edit for owner or admin.
7. **Pipeline.** Open tab: one column per open stage with header "Proposal · 2 · $27,800 · weighted $16,680", cards sorted by expected close (title, company, value, owner, expected close; "Past close date" in red). Each card has a "Move to" control (works on a phone; drag and drop is optional). Page header: open pipeline total, weighted total, won this month, number past close date. Mine / Everyone filter. New deal. Closed tab: won and lost deals with closed date and lost reason.
8. **Deal detail.** Title, contact, company, owner, value, stage, probability, expected close, closed date, lost reason. Actions for owner or admin: Edit, Move to stage, Mark won, Mark lost (reason), Reopen. History: the deal's activities and stage changes.
9. **Search.** One box in the top bar. Results grouped into Contacts, Companies and Deals, each linking to its page.
10. **Import** (admins). Paste box with the expected columns shown. Check button shows a preview table: each row's line number, values, and a status (Ready, Duplicate, or Error with the message). Import button imports the Ready rows and shows the summary.
11. **Team** (admins). People with email, admin flag and active status. Add person (name, email, admin). Deactivate with a required "Give their records to" picker, showing how many contacts, companies and open deals will move.

All screens must work on a phone at 390px wide without sideways scrolling of the page.

## 9. CSV import and export

### Import by paste

- The first line is a header row. Columns are matched by name, ignoring case, spaces and underscores: `name` (required), `email`, `phone`, `title`, `company`, `owner`, `next_follow_up`. Unknown columns are ignored and listed as a warning ("Ignored column: Source"). A paste without a `name` column is refused: "The header row needs a name column."
- Values may be separated by commas (a CSV file) or tabs (cells copied from a spreadsheet). The separator is chosen from the header line: tab if it contains a tab, otherwise comma. Double-quoted values may contain commas, line breaks and doubled quotes (`"Olsen & Co, Ltd"`).
- At most 500 data rows per paste. Blank lines are skipped.
- Per row, checked in this order:
  1. `name` is required: "Name is required."
  2. `email`, when present, must look like an email: "Invalid email: max@@bluebird".
  3. `email` already used by a contact in the CRM: status Duplicate, "Already in the CRM as Kim Olsen", not imported. Email repeated earlier in the same paste: Duplicate, "Same email as line 2".
  4. `owner`, when present, must match an active person by email or full name (case-insensitive): "Unknown owner: Pat". Blank means the importer.
  5. `next_follow_up`, when present, must be a real date in `YYYY-MM-DD` form: "Invalid date: 13/01/2026 (use YYYY-MM-DD)". Blank means today. Past dates are accepted (they come from your old system) and show as overdue.
- Rows with status Ready are imported; Duplicate and Error rows are not. Importing re-checks every row first, so nothing changed between Check and Import can slip through.
- Each imported contact gets a system activity "Imported by Dana Ruiz". Companies are resolved by R13.
- The summary reads: "Imported 2 contacts (1 new company). Skipped 1 duplicate and 3 rows with errors."

### Sample paste (use it for the acceptance checks)

```
name,email,phone,title,company,owner,next_follow_up
Ella Brooks,ella@harbor.example,,Office manager,Harbor,sam@northwind.example,
Kim Olsen,kim@olsen.example,,,Olsen & Co,,
Max Ford,max@@bluebird,,,Bluebird,,
,noname@acme.example,,,Acme,,
Ava Reed,ava@newco.example,,,Newco,lee@northwind.example,13/01/2026
Ben Ortiz,ben@quill.example,555-0142,Founder,Quill Studio,Lee Park,
```

Expected preview: line 2 Ella Brooks Ready (owner Sam Okafor, follow-up today, existing company Harbor); line 3 Duplicate (already in the CRM as Kim Olsen); line 4 Error "Invalid email: max@@bluebird"; line 5 Error "Name is required."; line 6 Error "Invalid date: 13/01/2026 (use YYYY-MM-DD)"; line 7 Ben Ortiz Ready (owner Lee Park, new company Quill Studio). Import creates 2 contacts and 1 company.

### Export

- **Contacts CSV** (`contacts-YYYY-MM-DD.csv`): Name, Email, Phone, Title, Company, Owner, Next follow-up, Follow-up status (overdue, today, upcoming, archived), Last activity, Open deals, Open deal value. Values in dollars without the currency sign (`18000.00`).
- **Deals CSV** (`deals-YYYY-MM-DD.csv`): Title, Company, Contact, Owner, Stage, Value, Probability, Weighted value, Expected close, Closed on, Lost reason.
- Both export the rows in the current view (R21). Quote any value containing a comma, quote or line break, and double inner quotes.

## 10. Daily digest (the only notification and the only scheduled job)

Runs once a day at 08:00 in the team time zone (on Vercel: a cron hitting `/api/cron/digest` protected by a `CRON_SECRET` header; accept an optional `today` override in development).

For each active person:
1. Count their overdue contacts, their contacts due today, and their open deals that are past close date or closing within 7 days.
2. If all three are zero, send nothing.
3. If a DigestLog row already exists for this person and date, send nothing (the job is safe to run twice).
4. Otherwise write the DigestLog row, then send one email: subject "3 follow-ups due today" (overdue plus due today), body listing each contact with company and how overdue, then the deals, each linking to its page. If sending fails, keep the row with the error and retry on the next run.

There are no other scheduled jobs and no other notifications (no email per activity or per stage change). Overdue status is always computed from today's date, never stored.

## 11. Edge cases

- A contact changes company: their existing deals keep the old company (it was copied when the deal's contact was set). Editing the deal's contact re-copies it.
- An owner leaves: deactivate them in Team and pick who gets their records (R19). Closed deals keep the old owner for history.
- Two people log activities on the same contact on the same day: both are kept; the last one saved sets the follow-up.
- Logging an activity on an overdue contact with a follow-up date of today is refused (R5), so the overdue list cannot be cleared without moving the date forward.
- A pasted spreadsheet has a trailing empty column or blank lines: ignored.
- The same email appears twice in one paste: the second is a Duplicate of the first (section 9).
- A deal's contact is archived later: not possible while the deal is open (R14). Closed deals may point to archived contacts.
- Daylight-saving changes: dates have no time of day, so nothing shifts.
- The browser and the team are in different time zones: "today" always uses the team time zone.

## 12. Seed data

Team (from the shared sample company, Northwind):

| Person | Email | Admin |
|---|---|---|
| Dana Ruiz | dana@northwind.example | yes |
| Ana Lima | ana@northwind.example | yes |
| Maya Chen | maya@northwind.example | no |
| Sam Okafor | sam@northwind.example | no |
| Ben Cho | ben@northwind.example | no |
| Jo Park | jo@northwind.example | no |
| Lee Park | lee@northwind.example | no |

Companies: Bluebird (bluebird.example, Sam), Acme (acme.example, Maya), Ridgeway (ridgeway.example, Lee), Olsen & Co (olsen.example, Dana), Harbor (harbor.example, Sam), Kestrel (kestrel.example, Jo), Pine Labs (pinelabs.example, Lee).

Contacts (T is the day the seed is loaded):

| Contact | Title | Company | Owner | Next follow-up |
|---|---|---|---|---|
| Grace Kim | Director of IT | Harbor | Sam | T-6 |
| Priya Shah | Head of Operations | Bluebird | Sam | T-3 |
| Hana Sato | Operations lead | Pine Labs | Lee | T-2 |
| Rosa Diaz | VP Finance | Acme | Maya | T-1 |
| Kim Olsen | Founder | Olsen & Co | Dana | T |
| Nina Patel | COO | Ridgeway | Lee | T |
| Leo Martins | CEO | Kestrel | Jo | T+1 |
| Owen Hart | Procurement manager | Acme | Maya | T+2 |
| Tom Becker | CTO | Bluebird | Sam | T+4 |
| Ivan Petrov | Head of Sales | Pine Labs | Lee | T+5 |
| Zoe Carter | Independent consultant | (none) | Maya | T+7 |
| Marcus Lee | Office manager | Olsen & Co | Dana | T+9 |
| Felix Wong | Engineering manager | Ridgeway | Lee | T+14 |
| Ruth Adams | Former buyer | Kestrel | Jo | archived |

Emails are first name at the company domain (priya@bluebird.example); Zoe Carter is zoe@carter.example.

Deals:

| Deal | Contact | Owner | Value | Stage | Expected close |
|---|---|---|---|---|---|
| Acme expansion | Owen Hart | Maya | $12,500 | Lead | T+40 |
| Kestrel starter | Leo Martins | Jo | $3,200 | Lead | T+30 |
| Bluebird add-on seats | Tom Becker | Sam | $4,500 | Demo | T+25 |
| Acme pilot | Rosa Diaz | Maya | $6,000 | Demo | T-2 (past close date) |
| Pine Labs team plan | Hana Sato | Lee | $7,400 | Demo | T+18 |
| Bluebird annual plan | Priya Shah | Sam | $18,000 | Proposal | T+10 |
| Ridgeway onboarding | Nina Patel | Lee | $9,800 | Proposal | T+14 |
| Olsen & Co rollout | Kim Olsen | Dana | $32,000 | Negotiation | T+5 |
| Harbor renewal | Grace Kim | Sam | $15,000 | Negotiation | T+3 |
| Pine Labs pilot | Ivan Petrov | Lee | $5,000 | Won (T-2) | T-2 |
| Harbor first order | Grace Kim | Sam | $8,000 | Won (T-20) | T-20 |
| Ridgeway consulting | Felix Wong | Lee | $2,500 | Lost (T-8, "Chose to build in-house") | T-8 |

Give every contact one to three past activities (calls, emails, meetings, notes) so timelines and "last activity" have content.

## 13. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation, team, companies and contacts

```
Using the Simple CRM blueprint above, build Phase 1 only.

1. Set up the data model from section 5 (Person, Company, Contact, Deal, Activity, DigestLog) with a real database.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Team (screen 11), Companies (5, 6) and Contacts (2, 4) with create and edit. Enforce rules R1 to R4 and R9 to R14 and R19 on the server, not only in the UI.
4. Sort the contacts list exactly as R3, with the Mine / Everyone / owner filters and the All / Overdue / Due today / Archived filters.
5. Load the seed data from section 12, with dates relative to today.
6. Add a small "act as" switcher visible only in development, so I can test as different people, and a development-only control that moves "today" forward one day.

Do not build activities, deals, import or export yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Seven people exist; Dana and Ana are admins. Acting as Jo, Team is not available; acting as Dana it is.
- [ ] Contacts (Everyone) lists Grace Kim first with "Overdue 6d", then Priya Shah, Hana Sato and Rosa Diaz, then Kim Olsen and Nina Patel with "Today". Ruth Adams is not listed; the Archived filter shows her.
- [ ] Acting as Sam, Mine shows exactly Grace Kim, Priya Shah and Tom Becker.
- [ ] Creating a contact with email kim@olsen.example is refused with "Kim Olsen already uses kim@olsen.example."
- [ ] Creating a contact with a follow-up date of yesterday is refused. Creating "Lena Fox" with company "Lumen Dental" (new) and follow-up today creates both, and Lumen Dental appears in Companies owned by the creator.
- [ ] Acting as Lee, opening Priya Shah's edit form and saving is refused with "Only Sam Okafor (the owner) or an admin can change this contact."
- [ ] Acting as Dana, deactivating Jo Park with records going to Maya Chen moves Leo Martins, Ruth Adams, Kestrel and the Kestrel starter deal to Maya. Jo no longer appears in owner pickers.

### Phase 2: Activities, follow-ups, Today and search

```
Build Phase 2 of the Simple CRM blueprint: activities, follow-ups, the Today screen and search.

1. Contact detail (screen 3) with the Log activity card and timeline. Implement R5 to R8 and R11 exactly. Logging an activity and setting the next follow-up happen in one database transaction.
2. Reschedule follow-up and Archive / Unarchive for the owner or an admin (R4, R10, R14).
3. Today screen (screen 1) for the signed-in person with the Me / Everyone toggle.
4. Search (screen 9) exactly as R20.
5. Write unit tests for follow-up status, the R3 sort order (use the worked example in section 7), and the R5 date rule.
```

**Acceptance checks**
- [ ] Acting as Sam, Today shows Grace Kim (Overdue 6 days) and Priya Shah (Overdue 3 days), and Harbor renewal under Deals to watch.
- [ ] Sam logs a call on Priya Shah with "1 week". Priya leaves Sam's overdue list, her timeline shows the call by Sam Okafor, and her last activity is today.
- [ ] Logging an activity with next follow-up today is refused ("Pick a next follow-up date after today."). Logging a Note with no text is refused.
- [ ] Acting as Lee, logging an email on Priya Shah works and shows "by Lee Park", but Reschedule is refused with the owner message.
- [ ] Pressing +1 day makes Kim Olsen and Nina Patel overdue by 1 day and Leo Martins due today.
- [ ] Searching "olsen" finds Kim Olsen and Marcus Lee, the company Olsen & Co, and the deal Olsen & Co rollout. Searching "a" is refused.
- [ ] Acting as Dana, archiving Kim Olsen is refused because she has an open deal. Archiving Marcus Lee works; he leaves the list and shows under Archived.

### Phase 3: Deals and pipeline

```
Build Phase 3 of the Simple CRM blueprint: deals and the pipeline board.

1. Deals with create, edit, move, won, lost and reopen exactly as the lifecycle table in section 7 and rules R15 to R18. Enforce owner-or-admin on the server.
2. Pipeline screen (screen 7) with per-stage count, total and weighted total, the header totals, the Mine / Everyone filter, the "Move to" control on each card, and the Closed tab.
3. Deal detail (screen 8). Show open deals on the contact and company pages, and offer the contact's open deals in the Log activity form.
4. Write unit tests for the board totals using the worked example in section 7.
```

**Acceptance checks**
- [ ] The board shows Lead $15,700 (2), Demo $17,900 (3), Proposal $27,800 (2) and Negotiation $47,000 (2); the header shows open pipeline $108,400 and weighted $61,220.
- [ ] Acme pilot shows "Past close date". Mine as Sam shows 3 deals and $37,500.
- [ ] Acting as Lee, moving Harbor renewal is refused with "Only Sam Okafor (the owner) or an admin can change this deal."
- [ ] Acting as Sam, moving Bluebird annual plan to Negotiation updates Proposal to $9,800 and Negotiation to $65,000, and Priya Shah's timeline shows "Moved from Proposal to Negotiation".
- [ ] Marking Harbor renewal lost without a reason is refused. With "Budget frozen" it leaves the board and appears in Closed with the reason.
- [ ] Acting as Dana, marking Olsen & Co rollout won raises Won this month by $32,000.
- [ ] A new deal for Rosa Diaz with expected close yesterday is refused. With a date next month and stage Proposal it appears in the Proposal column and on Rosa Diaz's page.

### Phase 4: Import, export and the daily digest

```
Build Phase 4 of the Simple CRM blueprint: CSV import by paste, CSV export and the daily digest.

1. Import screen (screen 10) exactly as section 9: header matching, comma or tab separator, quoted values, per-row checks in the stated order, preview, then import of Ready rows with the summary line. Admins only (R21).
2. Export Contacts CSV and Deals CSV with the columns in section 9, exporting the current view.
3. The daily digest job in section 10 at /api/cron/digest with a CRON_SECRET header and a development-only "today" override. If no email provider is configured, log the emails instead of sending.
4. Write unit tests for the CSV parser (quotes, commas, tabs, line breaks) and for every row of the sample paste.
```

**Acceptance checks**
- [ ] Acting as Jo, there is no Import button and the import page is refused. Acting as Dana it opens.
- [ ] Checking the sample paste shows 2 Ready, 1 Duplicate (Kim Olsen) and 3 Errors with the messages in section 9.
- [ ] Importing creates Ella Brooks (owner Sam Okafor, due today, company Harbor) and Ben Ortiz (owner Lee Park, new company Quill Studio), and shows "Imported 2 contacts (1 new company). Skipped 1 duplicate and 3 rows with errors."
- [ ] Export with the Overdue filter downloads contacts-YYYY-MM-DD.csv with a header row and one row per overdue contact (4 with the seed data).
- [ ] Export from the pipeline downloads deals-YYYY-MM-DD.csv with one row per deal in the view and the weighted value column.
- [ ] Moving the clock forward one day runs the digest: acting as Sam, Today shows "Digest sent" for the new date with his counts. Running the job again for the same day sends nothing new.

## 14. Variations

- Contacts from a form on your website (a public endpoint that creates a contact owned by a round-robin owner, follow-up today).
- A Friday email to each owner of everything that slipped this week.
- Custom stages and probabilities that match how you actually sell.
- Update existing contacts by email during import (HubSpot's "create and update").
- Business-day follow-up picks that skip weekends.
- A "rotting" flag for deals with no activity in N days.
