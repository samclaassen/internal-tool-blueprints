<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/inspections . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Inspections

Blueprint BP-033 · Department: Ops · Replaces: SafetyCulture (now Mitti), paper checklists on clipboards, audit spreadsheets
For teams of 5 to 200 people who check sites, stores or kitchens against a standard.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"The audit says the fire exit was blocked again, and nobody fixed it after last month's audit either."

A retailer, restaurant group or facilities team runs checks on paper: daily opening checklists, monthly store audits, safety walks. The clipboards get filed, failed items are mentioned to someone in passing, scores live in a spreadsheet that one person updates, and nobody can show which store keeps failing the same item or whether last month's problems were fixed.

This blueprint is an inspections app: checklists built from templates, filled in on a phone at the site with photos, scored the same way every time, failed items turned into corrective actions with an owner and a due date, scheduled inspections that show when they are overdue, and reports by site over time.

## 2. What the real product does

Research basis: SafetyCulture's pricing page (safetyculture.com/pricing), October 2026. The product is now sold as Mitti (by SafetyCulture).

What we verified:

1. **Plans.** Free: $0 for teams of up to 10 seats, with 5 active inspection templates, basic analytics, training, tasks and issue reporting, and basic data history. Premium: $24 per seat per month billed annually (save 17%) or $29 monthly, with unlimited active templates and multi-language templates, advanced analytics and training, permissions, integrations and single sign-on. Enterprise: custom price. Teams running several sites can ask for a fixed price per location with unlimited users. Plans can be tried free for 30 days.
2. **AI** is included in every plan, as monthly AI credits per seat (300 on Free, from 500 on Premium, from 800 on Enterprise).
3. **Reports** are PDF and web on Free, and PDF, Word, Excel and web on paid plans. The analytics dashboard keeps 30 days of data on Free.

A team of 10 seats pays $2,880 a year on Premium, billed annually.

### What this blueprint keeps

Templates with sections and questions (yes, no or not applicable; ratings; numbers with an acceptable range; text; photos; signatures), each with a weight; inspections at a site, filled in on a phone; scoring the same way every time; failed answers that create corrective actions with an owner, a due date and evidence of the fix; scheduled inspections with due and overdue states; a printable report; scores by site over time; repeat failures; CSV export.

### What this blueprint deliberately leaves out

Offline mode and mobile apps, AI features, training courses, sensors and telematics, lone worker and investigations, multi-language templates, integrations and single sign-on.

## 3. Scope of v1

- One company with several sites, one time zone (Settings; default America/New_York).
- Inspections are filled in on a phone in the browser with a connection; photos are taken with the phone camera through the browser and stored privately (up to 10 MB each).
- Email through an outbox. If no email provider is configured, emails are logged, not sent.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Operations or safety lead | Everything: sites, people, templates, schedules, every inspection and action, reports, export. |
| Manager | Store or site managers | See inspections and actions for their sites, assign and close actions, run inspections. |
| Inspector | Anyone who carries out checks | Start and complete inspections at sites they are assigned to, and see their own inspections and the actions assigned to them. |

The server enforces every permission.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): company_name, time_zone, action_due_days_high (1), action_due_days_normal (7).

**Person**: id, name, email, role: admin | manager | inspector, site_ids, active.

**Site**: id, name, address, manager_id.

**Template**: id, name, version, status: draft | published | archived, sections: list of { title, questions: list of { id, text, kind: yes_no | rating | number | text | photo | signature, weight (points, default 1), min, max (numbers), photo_required_on_fail, high_priority } }.

**Schedule**: id, template_id, site_id, every: daily | weekly | monthly, weekday or day_of_month, due_time, assignee_id, active.

**Inspection**: id, number (I-0001), template_id, template_version, site_id, inspector_id, schedule_id, due_at, started_at, completed_at, status: due | in_progress | completed | missed, score_percent, signature.

**Answer**: inspection_id, question_id, value, not_applicable, failed (calculated), note, photos.

**Action** (corrective action): id, number (A-0001), inspection_id, question_id, site_id, title, priority: high | normal, assignee_id, due_on, status: open | done, done_note, done_photos, done_at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Scoring and failures

- A **yes/no** question fails on No. A **rating** (1 to 5) fails at 2 or below. A **number** fails outside min to max. Text, photo and signature questions never fail and carry no points.
- **Score** = points earned ÷ points possible × 100, rounded to the nearest whole percent, where points possible is the sum of weights of scorable questions not marked not applicable, and points earned is the sum of weights of those that didn't fail. A rating that passes earns its weight × (rating − 1) ÷ 4; a failed answer earns nothing.
- Every failed answer creates one action when the inspection is completed, titled with the question, at the inspection's site, assigned to the site manager, due action_due_days_high days later for high-priority questions and action_due_days_normal otherwise.
- A **repeat failure** is a question that failed at the same site in the previous completed inspection from the same template.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Inspection | Answers | Score | Actions |
|---|---|---|---|
| Monthly store audit, Riverside (I-0042, completed Oct 6) | 20 scorable questions of weight 1, 2 not applicable; 16 passed and 2 failed (Fire exit clear: No; Stockroom tidy: rating 2) | 16 ÷ 18 = 89% | A-0031 Fire exit clear (high, due Oct 7, done Oct 7), A-0032 Stockroom tidy (normal, due Oct 13, still open: overdue) |
| Daily opening checklist, Harbor (today) | Fridge temperature 9 °C (range 0 to 5) | | A new high-priority action "Fridge temperature", due tomorrow |
| Monthly store audit, Riverside (Nov) | Fire exit clear: No again | | Marked as a repeat failure |

## 7. Schedules

- Each schedule creates its next inspection with status due: daily ones at 00:00 for that day, weekly and monthly ones 3 days before.
- A due inspection not completed by its due time plus 12 hours becomes **missed**; the site manager is emailed, and the next one is still created on time.
- Completing an inspection that was started from a schedule fulfils it; extra inspections can always be started by hand.

## 8. Business rules

- **R1. Templates** are versioned: publishing an edit creates a new version; inspections keep the version they used, and their report shows those questions.
- **R2. Completing** an inspection needs every question answered or marked not applicable (where allowed), a photo on failed questions that require one, and the inspector's signature if the template asks for it. Completed inspections are read-only.
- **R3. Scoring and actions** follow section 6, the same way on screen, in reports and in exports.
- **R4. Actions.** Closing an action needs a note, and a photo for high-priority actions. Actions past due_on are overdue; the assignee gets a reminder the day they fall due and the site manager the day after.
- **R5. Schedules** follow section 7, run by a job every hour that is safe to run twice.
- **R6. Visibility.** Inspectors see sites they are assigned to; managers see their sites; admins see everything; photos are served only to people who can see the inspection.
- **R7. Repeat failures** are flagged as section 6 defines, on the inspection, the action and the reports.
- **R8. Sites and people.** A site can't be removed while it has open actions; deactivating a manager needs another manager for their sites first.
- **R9. Reports** can be printed or saved as PDF from the browser, one per inspection, with score, failed answers first, photos and the signature.
- **R10. Events.** Every change writes an event; events are never edited or deleted.

## 9. Screens

1. **Today** (home): inspections due today and overdue at my sites, my open actions, and Start inspection.
2. **Inspection** (phone first): sections one at a time, big answer buttons, notes and photos per question, a running count of failed answers, and Complete.
3. **Inspection report**: score, failed answers first with photos and their actions, then everything else, and the signature.
4. **Actions**: open and overdue first, by site, with close (note and photo).
5. **Sites**: each site's latest scores, trend over 6 months, open actions and repeat failures.
6. **Templates** (editor with versions), **Schedules**, **People**, **Settings**, **Outbox** (admin).

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Action created | Assignee | "New action at Riverside: Fire exit clear (due Oct 7)" |
| Action due today | Assignee | "Due today: Stockroom tidy at Riverside" |
| Action overdue | Site manager | "Overdue: Stockroom tidy at Riverside (due Oct 13)" |
| Inspection missed | Site manager | "Missed: Daily opening checklist at Harbor, Oct 14" |
| Repeat failure | Admins | "Repeat failure at Riverside: Fire exit clear" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so schedules, missed inspections and overdue actions can be tested by moving the clock.

## 12. Export

Admins and managers export inspections (number, template, version, site, inspector, due, completed, score, failed count) and actions (number, site, question, priority, assignee, due, status, done at, repeat) as CSV, filtered by site and date range.

## 13. Edge cases

- An inspector loses the connection mid-inspection: answers already saved stay; the screen says what wasn't saved.
- The same question fails twice in one inspection (in two sections that use the same question text): two actions, one per answer.
- A template's weight changes: past inspections keep their scores; new ones use the new version.
- An action's site manager changes: open actions are reassigned to the new manager.
- A daily schedule falls on a day the site is closed: the manager can mark that inspection "site closed", which counts as neither completed nor missed.

## 14. Seed data

Company "Northline Retail", three stores; time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

People (emails firstname@northline.example): Dana Ruiz (admin, operations lead), Luis Ortega (manager, Riverside), Amy Chen (manager, Harbor and Hilltop), Sam Patel (inspector, Riverside and Harbor).

Sites: Riverside, Harbor, Hilltop.

Templates:
- "Monthly store audit" (version 3): Front of store (8 yes/no), Stockroom (5 yes/no and "Stockroom tidy" as a rating), Safety (6 yes/no including "Fire exit clear", high priority, photo required on fail); 20 scorable questions of weight 1, plus a signature.
- "Daily opening checklist" (version 1): Lights and signage on (yes/no), Fridge temperature (number, °C, 0 to 5, high priority), Floor clear and dry (yes/no), Cash float counted (yes/no).

Schedules: Daily opening checklist at each store every day, due 09:00, assigned to Sam at Riverside and Harbor and to Amy at Hilltop; Monthly store audit at each store on the 6th, assigned to the site manager.

History: I-0042 Monthly store audit at Riverside on Oct 6 by Luis, scored 89% as in section 6, with A-0031 done and A-0032 open; Harbor's and Hilltop's October audits scored 95% and 100%. Daily checklists were completed every day except Harbor on Oct 14, which is missed.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation, templates and inspections

```
Using the Inspections blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database and private photo storage.
2. Add sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Templates with versions (R1), Sites, People, the Inspection screen and the Inspection report (section 9, screens 2, 3 and 6), with R2, R3 and R6 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] I-0042's report shows 89% with Fire exit clear and Stockroom tidy listed first as failed.
- [ ] Signed in as Sam, completing a Monthly store audit at Harbor with Fire exit clear answered No and no photo is refused; with a photo it completes, and the score excludes questions marked not applicable.
- [ ] Publishing a change to "Monthly store audit" creates version 4, and I-0042 still shows version 3's questions.
- [ ] Signed in as Sam, Hilltop's inspections are not visible, and a direct request for one is refused.

### Phase 2: Actions

```
Using the Inspections blueprint above, build Phase 2 only.

1. Create actions from failed answers (section 6) and build Actions (section 9, screen 4) with R4 and R7.
2. Write the action and repeat-failure emails (section 10) to the outbox, and build the Outbox screen.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Sam completes today's Daily opening checklist at Harbor with Fridge temperature 9: a high-priority action "Fridge temperature" is created for Amy, due tomorrow, and she is emailed.
- [ ] A-0032 shows as overdue, and closing it without a note is refused; closing the new Fridge temperature action (high priority) without a photo is refused.
- [ ] Completing another Monthly store audit at Riverside with Fire exit clear answered No marks it as a repeat failure and emails Dana.
- [ ] Signed in as Luis, he can close Riverside's actions but not Harbor's, including by a direct request.

### Phase 3: Schedules and the Today screen

```
Using the Inspections blueprint above, build Phase 3 only.

1. Build Schedules and the hourly job (section 7, R5), and the Today screen (section 9, screen 1), with the missed and overdue emails.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Sam, Today lists the Daily opening checklists due today at Riverside and Harbor, and not Hilltop's.
- [ ] Moving the clock to 21:01 with Harbor's checklist not done and running the job marks it missed and emails Amy; running it again sends nothing more.
- [ ] Moving the clock to Nov 3 and running the job creates the November Monthly store audits for all three stores, due Nov 6.

### Phase 4: Site reports and export

```
Using the Inspections blueprint above, build Phase 4 only.

1. Build Sites (section 9, screen 5) with score trends and repeat failures, and the CSV exports (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Sites shows October's audit scores: Riverside 89%, Harbor 95%, Hilltop 100%, and Riverside's open action count.
- [ ] The actions export for October lists A-0031 and A-0032 with their status and priority, and the inspections export shows Harbor's Oct 14 checklist as missed.
- [ ] Signed in as Sam, the export is refused.

## 16. Variations

- Offline mode for sites without a signal.
- Inspections triggered by a QR code at each area of a site.
- Score targets per template, with an alert below target.
- Share an inspection report with a franchisee or landlord by link.
- Temperature sensors that fill in readings automatically.
