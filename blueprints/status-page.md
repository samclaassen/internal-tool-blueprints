<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/status-page . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->

# Status Page

Blueprint BP-020 · Department: Support · Replaces: Atlassian Statuspage, "is it down?" support tickets
For teams of 2 to 50 people who run a product their customers depend on.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"When something breaks, half our support queue is people asking if it's down."

A small software company has an outage. Support answers the same question fifty times, the team posts updates in three places, customers who were never affected get alarmed, and a week later nobody can say how long the API was actually down last quarter.

This blueprint is a public status page at a domain you own: each part of the product with its current status, incidents with timed updates, scheduled maintenance, and 90 days of uptime history. Customers subscribe by email to the parts they use. The team posts from one admin screen, and monitoring tools can report problems through a webhook.

## 2. What the real product does

Research basis: Atlassian's Statuspage pricing page (atlassian.com/software/statuspage/pricing), October 2026.

What we verified:

1. **Public page plans.** Free: 100 subscribers, 25 components, 2 team members, 2 metrics, email, Slack and Microsoft Teams notifications, and the REST API. Hobby, $29 a month: 250 subscribers, 5 team members, 5 metrics, basic customization and a custom domain. Startup, $99 a month: 1,000 subscribers, 10 team members, 10 metrics, email, SMS and webhook notifications, custom CSS, and team member SSO with Atlassian Guard. Business, $399 a month: 5,000 subscribers, 25 team members, 25 metrics, custom CSS, HTML and JavaScript, component subscriptions and role-based access control. Enterprise, $1,499 a month: 25,000 subscribers, 50 team members and 50 metrics.
2. **Included in every plan.** Incidents, components and component groups, scheduled maintenance, incident templates, page analytics, basic customization, REST API access, third-party components, automation and chat integrations, a status embed, an activity log and Twitter integration. Notifications are unlimited; the channels depend on the plan.
3. **Other page types.** Private pages for employees start at $79 a month (Starter: 5 team members, 50 authenticated subscribers); audience-specific pages start at $300 a month.
4. **Billing.** Prices are monthly. Yearly billing by credit card is set up manually with a signed order form.

The free plan is enough for many small teams. The case for building is fit and ownership: more subscribers, subscriptions to individual components (listed on Business), your own domain without a paid plan, and incident history in your own database.

### What this blueprint keeps

Components and groups; incidents with timed updates (investigating, identified, monitoring, resolved) and the status of each affected component; incident templates; scheduled maintenance that starts and ends on time; an overall status banner; 90-day uptime bars and percentages per component; incident history; email subscriptions with double opt-in and a choice of components; an Atom feed and a JSON status API; an automation webhook for monitoring tools; postmortems; an activity log.

### What this blueprint deliberately leaves out

Uptime monitoring itself (bring your own monitor and point it at the webhook), SMS, Slack and Teams notifications to subscribers, metrics and response-time graphs, private and audience-specific pages, third-party components, custom HTML and JavaScript themes, translations, an embeddable widget, and posting to social media.

## 3. Scope of v1

- One public page for one product, at a domain or subdomain you control (such as status.yourcompany.com).
- **Host it separately from your product**: a different hosting account or provider and its own database. A status page that goes down with your app is worse than none.
- Times are stored in UTC, shown to visitors in their local time with the zone, and written in emails in the page's time zone (Settings). Because the page must work without JavaScript, the server writes times in the page's time zone with the zone ("09:00 CDT"), and an optional small script rewrites them to the visitor's own zone. Admin screens use the page's time zone.
- Email through an outbox. If no email provider is configured, emails are logged, not sent. Every update can email every subscriber of an affected component, so 1,000 subscribers and 4 updates means 4,000 emails; check your provider's plan.
- The public page must be readable without JavaScript and is cached for at most 30 seconds. The cache covers the status page, incident pages, History, the feed and the JSON API in production; subscribe, confirm, manage and unsubscribe pages are never cached, and nothing is cached in development, where the clock moves.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Engineering and support leads | Everything: components, groups, incidents, maintenance, templates, subscribers, team, automation tokens, settings. |
| Responder | Anyone on call or in support | Create, update and resolve incidents and maintenance, change component statuses (from the Dashboard's status menu), add postmortems. Adding, editing, hiding and deleting components and groups is for admins. |
| Visitor | The public | Read the page, history and incidents; subscribe and manage their own subscription. |

Visitors never see drafts, team member names, subscriber emails or internal notes. Updates are signed with the company name. The server enforces this. Team members sign in with any method that proves they own an address at Settings.email_domain: the platform's built-in auth, Google sign-in, or a one-time link sent through the outbox that expires after 15 minutes. Only active team members get in. Refusals: signed out, an admin URL redirects to sign-in; an action the role or the current state doesn't allow gets 403 with the reason ("Published incidents can't be deleted."); invalid input gets 422 and the form again with the typed text and the message; a draft or unknown incident is 404 to visitors. Form posts whose Origin is another site are refused.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): page_name, company_name, logo, time_zone (default America/Chicago), support_url, from_email, email_domain (the only domain team members sign in with; larkspur.example in the seed), page_url (the public address used in every email and feed link, such as https://status.larkspur.example; in development, the address the app runs on).

**TeamMember**: id, name, email (unique), role: admin | responder, active.

**ComponentGroup**: id, name, position.

**Component**: id, name, description, group_id, position, status: operational | degraded_performance | partial_outage | major_outage | under_maintenance, created_at, hidden, automation_token (secret), auto_publish (default false), template_id (used by automation: the incident takes the template's title and message, the reporting component gets the reported status, and with no template the title is "Payments: major outage"; impact is major for a major outage and minor otherwise).

**StatusChange** (append-only): id, component_id, status, at, incident_id or maintenance_id, actor (team member, "automation" or "schedule").

**Incident**: id, number (INC-0001, sequential, given when the draft is created and never reused, so a deleted draft leaves a gap), title, status: draft | investigating | identified | monitoring | resolved, impact: none | minor | major | critical (default minor; templates don't set it; title and impact can be changed while the incident is open, and the change is logged), started_at (set when it is published), resolved_at, postmortem (Markdown, up to 20,000 characters; responders and admins add, edit or remove it on resolved incidents only; no email is sent), postmortem_at, created_by, related_to (optional incident).

**IncidentUpdate**: id, incident_id, status, message (10 to 2,000 characters), component_statuses (component and status pairs set by this update), notify (boolean), published_at, author_id. A draft's text is its first IncidentUpdate with published_at empty; publishing sets published_at. Saving a draft needs a title and a message of at least 10 characters.

**Maintenance**: id, number (M-0001), title, message, starts_at, ends_at, components, status: scheduled | in_progress | completed | cancelled, notify.

**Template**: id, name, title, message, components with their status.

**Subscriber**: id, email (unique, lowercase), all_components (boolean), component_ids, confirm_token, confirm_sent_at (the 7-day expiry counts from it), confirmed_at, manage_token, unsubscribed_at, created_ip.

**Event** (append-only activity log) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, headers, created_at, incident_id or maintenance_id, attempts, status: queued | sent | failed | logged, error.

## 6. Statuses and uptime

**Overall status** is the worst current status of the visible (not hidden) components, in this order: major outage, partial outage, degraded performance, under maintenance, operational. The banner reads "Major outage", "Partial outage", "Degraded performance", "Under maintenance" or "All systems operational".

**Uptime** for a component uses only the StatusChange log. Over the 90 calendar days shown in the bars (today counted as a full day, or from the day the component was created if later):

uptime = 1 − (minutes in major outage + half the minutes in partial outage) ÷ minutes in the window

Degraded performance and maintenance count as up. Days run from midnight to midnight in the page time zone. The window's minutes are real minutes, so a window that crosses a daylight-saving change has 60 more or fewer than 129,600; downtime is counted up to now. Each component gets an operational StatusChange row when it is created, and its status before its first row counts as operational. Round down with whole-number arithmetic. Show two decimals, rounded down, so any downtime shows below 100.00%. Each day's bar shows the worst status reached that day and lists that day's incidents: the published incidents affecting the component that were open at any time that day. A bar with incidents links to the first of them. Days before the component was created show "No data" in grey.

### Worked examples (seed data in section 14; 90 days is 129,600 minutes)

| Component | Recorded in the last 90 days | Uptime shown |
|---|---|---|
| API | 42 minutes of major outage (INC-0013) | 1 − 42 ÷ 129,600 = 99.967...%, shown as 99.96% |
| Email delivery | 180 minutes of partial outage (INC-0014), counted as 90 | 1 − 90 ÷ 129,600 = 99.930...%, shown as 99.93% |
| Dashboard, Payments, Webhooks | Nothing | 100.00% |

## 7. Incidents and maintenance

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create (blank or from a template) | Responder | | draft | Not public |
| Publish | Responder | draft | investigating, identified or monitoring | First update posted; component statuses applied; subscribers emailed if notify is on |
| Post update | Responder | open | open or resolved | New update on top; component statuses applied; subscribers emailed if notify is on |
| Resolve | Responder | open | resolved | resolved_at set; components return to operational (R6); subscribers emailed if notify is on (checked by default on the Resolve form) |
| Delete | Responder | draft | | Published incidents cannot be deleted |
| Schedule maintenance | Responder | | scheduled | Subscribers emailed if notify is on |
| Start (on time, or early by hand) | Schedule or responder | scheduled | in_progress | Components set to under maintenance |
| Complete (on time, or early by hand) | Schedule or responder | in_progress | completed | Components return to operational (R6) |
| Cancel | Responder | scheduled | cancelled | Subscribers emailed if they had been told |

An incident sets components to operational, degraded performance, partial outage or major outage; only maintenance sets under maintenance. A component left out of an update keeps the status this incident last set for it, and once affected it stays on the incident's affected list.

A resolved incident cannot be reopened; if the problem returns, open a new incident, which links to the old one through related_to ("Related to INC-0013" on both incident pages).

## 8. Business rules

- **R1. Overall status** is the worst current component status (section 6).
- **R2. Status history.** Every component status change writes a StatusChange row; rows are never edited or deleted. Uptime and the bars come only from this log.
- **R3. Uptime** is calculated as in section 6, rounded down to two decimals.
- **R4. Incident flow.** Statuses move forward through investigating, identified and monitoring to resolved; steps can be skipped but never reversed, and another update with the same status is allowed. Each update needs a message of 10 to 2,000 characters.
- **R5. Corrections.** An admin can correct the text of a published update; the original text stays in the activity log. Only the message can be corrected (status, components and times stay as posted), on open or resolved incidents.
- **R6. Returning to normal.** When an incident is resolved or maintenance completes, each affected component returns to operational, unless another open incident or in-progress maintenance still affects it, in which case it takes the worst status still set. A component's status is always the worst of: the latest status each open incident set for it, and under maintenance for each in-progress maintenance affecting it; with none, operational.
- **R7. Maintenance timing.** A job that runs every minute starts and completes maintenance at its times, sends a reminder 1 hour before the start, and is safe to run twice. Starting early by hand sets starts_at to now, and completing early sets ends_at to now, so History shows the real window. If the job first sees a window after it has already ended, it completes it in the same run without setting its components to under maintenance. The reminder goes once per start time, only when notify is on and the job runs within the hour before the start; moving the start time makes a new reminder due.
- **R8. Subscribers.** Subscriptions need double opt-in; the confirmation link expires after 7 days. Only confirmed subscribers get notifications. Every email to a subscriber, including the confirmation, has a one-click unsubscribe link (opening it unsubscribes at once, a POST to it works for mail apps, and the page offers Subscribe again) and a List-Unsubscribe header; team emails (sign-in links, monitor reports) have neither. Subscribing again with the same email resends the confirmation instead of creating a duplicate: a pending address gets a new 7-day link with the newly chosen components; an unsubscribed one becomes pending again; a confirmed one gets the confirmation again with its components unchanged, pointing to its manage link. The form always shows the same message, so it never reveals who is subscribed. The subscribe form has a hidden honeypot field (a filled one gets the normal success message, and nothing is stored or sent) and allows 5 attempts per IP address per hour: every POST to the subscribe form counts, including invalid ones and honeypot hits, over a sliding hour on the app clock; refused attempts don't count, and the IP is the connection's address unless a trusted proxy is configured.
- **R9. Who gets emailed.** An update with notify on emails each confirmed subscriber who follows all components or at least one affected component, once per update. An incident's affected components are all the components any of its published updates has set, not only those named in the latest update.
- **R10. Automation.** Each component has a secret token. POST /api/automation/<component_id> with the header X-Status-Token and a JSON body {"status": "..."} using one of the four non-maintenance statuses. A wrong or missing token returns 401 and changes nothing. A status equal to the last one reported (the last accepted report for that component; operational before any) is ignored and writes nothing. With auto_publish off (the default), a problem status creates one draft incident from the component's template and emails the team, and the public page does not change; a later "operational" emails the team that the monitor reports recovery and leaves the draft for a person to publish or delete. With auto_publish on, it sets the status and publishes the incident; "operational" resolves the incident it opened (the latest incident automation opened for that component, while it is still a draft or open). A different problem while that incident exists updates it instead of opening another: the draft's component status changes (auto-publish off) or an update with the incident's current status is posted (auto-publish on). Incidents from automation have notify on, so with auto-publish on subscribers are emailed under R9. An "operational" with no incident from automation only emails the team; if auto-publish is turned on while an automation draft exists, the next problem report publishes that draft. Invalid JSON or any other status gets 400, an unknown component 404 and a hidden component 409; the body is read as JSON whatever its Content-Type, there is no cookie or Origin check, and every answer is JSON saying what happened.
- **R11. Public data.** The page, feeds and JSON API never include drafts, team member names, subscriber data or notes.
- **R12. Activity log.** Every change by a person, the schedule or automation writes an event; events are never edited or deleted. Each event names its actor: a team member, "schedule", "automation", "visitor" (subscription changes) or "outbox" (bounce unsubscribes). Development clock and reset actions are not logged.

## 9. Screens

Public:
1. **Status page** (/). Banner, components by group with current status, 90-day bars and uptime, open incidents with their latest update, upcoming maintenance, and Subscribe.
2. **Incident page** (/incidents/INC-0013). Title, affected components, every update with its time, newest first (the order "in order" means everywhere: incident pages, History and the feed), and the postmortem when there is one.
3. **History** (/history). Incidents and completed maintenance by month, newest first. It covers every month from the current one back to the oldest entry; a month with nothing shows "No incidents reported this month." Open published incidents are included; drafts and cancelled maintenance are not, and scheduled or in-progress maintenance appears under Upcoming maintenance.
4. **Subscribe** and **Manage subscription** (from the link in every email): choose components, or unsubscribe.

Admin (/admin, team only):
5. **Dashboard.** Every component with a status menu, open incidents, upcoming maintenance, and New incident. A status set from the menu applies at once and writes a StatusChange row; the next incident or maintenance change affecting that component recalculates it under R6.
6. **Incident editor.** Title, impact, status, message, affected components with a status each, notify, template picker, and a preview of the subscriber email.
7. **Maintenance**, **Components and groups**, **Templates**, **Subscribers** (search, export CSV, remove: deletes the subscriber, and emails already in the outbox stay), **Team**, **Settings**, **Automation** (tokens, auto-publish), **Activity log**, **Outbox**. Admins only: Components and groups (responders see a read-only list), Templates, Subscribers, Team, Settings and Automation, following section 4. Responders also open Maintenance, the Activity log and the Outbox; sign-in links in the Outbox are shown only to the person they were sent to.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Incident published or updated with notify on | Subscribers of affected components (R9) | "[Larkspur status] Investigating: Elevated API error rates" |
| Incident resolved | Subscribers of affected components | "[Larkspur status] Resolved: Elevated API error rates" |
| Maintenance scheduled | Subscribers of affected components | "[Larkspur status] Scheduled maintenance: Database upgrade, Sun Oct 18, 02:00 to 03:00 CDT" |
| Maintenance reminder, started, completed, cancelled | Same | "[Larkspur status] Starting in 1 hour: Database upgrade", "[Larkspur status] Maintenance in progress: Database upgrade", "[Larkspur status] Maintenance completed: Database upgrade", "[Larkspur status] Maintenance cancelled: Database upgrade" |
| Subscribe | The new subscriber | "Confirm your subscription to Larkspur status" |
| Automation reports a problem or a recovery | Every active team member | "Monitor reports Payments: major outage (draft incident INC-0015)"; a recovery reads "Monitor reports Payments: operational (draft incident INC-0015)", and with auto-publish on the bracket reads "(incident INC-0015)" or "(incident INC-0015 resolved)" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Retry failed sends from the every-minute job: POST /api/cron/every-minute with the header X-Cron-Secret (or Authorization: Bearer) equal to CRON_SECRET; a missing or wrong secret gets 401, and with CRON_SECRET unset the endpoint is off. The same job starts and completes maintenance (R7). A failed email never blocks the action that caused it. Maintenance emails go only when its notify is on: scheduled, the reminder, started and completed go to the R9 recipients of its components at that moment; a cancellation goes only to those who got the scheduled email and are still subscribed; editing maintenance sends nothing.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so maintenance timing, reminders and uptime can be tested by moving the clock.

## 12. Feeds and API

- **/history.atom**: one entry per published incident and per maintenance in any status, newest first, titled with the latest status and the number ("Resolved: API errors for some requests (INC-0013)"); an entry's updated time is its latest update, correction, postmortem or maintenance change.
- **/api/v1/status.json**: page name, overall status and banner text, each visible component with its group and status, open incidents with their latest update, and upcoming maintenance. Field names: page {name, url, time_zone, updated_at}, overall_status, banner, components [{id, name, description, group, status, status_label}], open_incidents [{number, title, status, impact, started_at, url, components, latest_update}], upcoming_maintenance [{number, title, status, starts_at, ends_at, message, components}]. Allow cross-origin reads so other sites can embed it.

## 13. Edge cases

- Two open incidents affect the same component: it shows the worse status; resolving one leaves the other's (R6).
- An incident during maintenance: a partial or major outage shows over under maintenance; when the incident resolves, the component goes back to under maintenance until the window ends.
- A component cannot be hidden or deleted while an open incident or in-progress maintenance affects it; hidden components keep their history. A component that appears in any incident, maintenance or template can only be hidden, not deleted. A group can be deleted only when it is empty. Component and group names are unique.
- Maintenance whose end time is moved earlier than now completes on the next job run. Scheduled maintenance can be edited in full (the end must be in the future); in-progress maintenance only its title, message and end time; completed or cancelled maintenance not at all. Maintenance needs at least one component; its message is optional.
- An email address on the subscriber list that bounces: mark the notification failed; three failures in a row unsubscribe the address. Each email gets at most 3 send attempts (the first send and two retries a minute or more apart); "three failures in a row" counts failed attempts to the same address with no success between.
- Visitors in another time zone see local times with the zone, such as "09:00 CDT".

## 14. Seed data

Settings: page "Larkspur status" for Larkspur, invoicing software for freelancers; time zone America/Chicago; support_url https://larkspur.example/support; from_email status@larkspur.example. Dates are relative to today; the examples assume today is Thursday, October 15, 2026. Zone abbreviations in the examples and checks are for those dates: when a date falls outside daylight saving time, "CDT" reads "CST" (02:00 CST).

Team (emails firstname@larkspur.example): Nadia Brooks (admin), Owen Price (responder, support lead), Ivy Chen (responder, engineer).

Components (all created more than 90 days ago, all operational now):
- Group "App": Dashboard, API, Webhooks
- Group "Delivery": Email delivery, Payments (with the description "Processed by Stripe", shown on the public page)

Templates (name; incident title; components; first message): "Elevated API errors"; "Elevated API error rates"; API at partial outage; "We're investigating increased error rates on API requests and will post an update within 30 minutes." "Email delays"; "Delayed invoice emails"; Email delivery at degraded performance; "Invoice emails are being sent with a delay. They are queued, not lost, and we'll post an update within 30 minutes." "Payments unavailable"; "Payments unavailable"; Payments at major outage; "Card payments can't be processed right now. We're investigating with our payment processor and will post an update within 30 minutes." (used by Payments automation). Component template_id: API uses "Elevated API errors", Email delivery "Email delays" and Payments "Payments unavailable"; Dashboard and Webhooks have none.

Incidents (numbering continues after INC-0014; INC-0013 was posted by Ivy Chen and INC-0014 by Owen Price, and every update is signed with the company name):
- INC-0013 "API errors for some requests", Friday Sep 18, impact major. API major outage from 09:00 to 09:42 CDT. Updates: 09:00 Investigating "We're seeing errors on a share of API requests and are investigating."; 09:18 Identified "A database connection limit was reached after a configuration change. We're rolling it back."; 09:30 Monitoring "The change is rolled back and error rates are back to normal. We're monitoring."; 09:42 Resolved "This incident has been resolved."
- INC-0014 "Invoice emails delayed", Friday Oct 2, impact minor. Email delivery partial outage from 13:10 to 16:10 CDT. Updates: 13:10 Investigating "Invoice emails are being sent with a delay. We're investigating."; 13:40 Identified "Our email provider is working through a backlog; invoice emails are queued, not lost."; 15:20 Monitoring "The backlog has cleared and new invoice emails are going out normally. We're monitoring."; 16:10 Resolved.

StatusChange rows: each component has an operational row at its creation; INC-0013 adds API major_outage at 09:00 and operational at 09:42, and INC-0014 adds Email delivery partial_outage at 13:10 and operational at 16:10. The updates in between set no new status.

Maintenance: M-0003 "Database upgrade" ("We're upgrading our main database. The dashboard and API may be briefly unavailable during this window."), Sunday Oct 18, 02:00 to 03:00 CDT, Dashboard and API, scheduled by Owen Price 4 days before the seed day, notify on (the scheduled email has already gone out: the seed puts it in the outbox, status logged, for sam, lee and ana, the confirmed subscribers of Dashboard or API).

Subscribers: sam@clientco.example (all components), lee@agency.example (API and Webhooks), ana@studio.example (all components), jo@freelance.example (Email delivery) are confirmed; max@pending.example (all components) has not confirmed; the others confirmed 30 days before the seed day, and max's confirmation link was sent 2 days before it.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and the public page

```
Using the Status Page blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add team sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. Only active team members can open /admin; visitors never need to sign in.
3. Build Settings, Team, and Components and groups (section 9, screen 7), and the public Status page, Incident pages and History (screens 1 to 3) with R1 to R3 and R11, readable without JavaScript.
4. Load the seed data from section 14, with dates relative to today, including the StatusChange rows for both incidents.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock back to the real time), all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The public page shows "All systems operational", the five components in their two groups, and 90-day uptime of 99.96% for API, 99.93% for Email delivery and 100.00% for the other three.
- [ ] API's bar for 27 days before the seed day (Sep 18 in the examples) shows a major outage and links to INC-0013; Email delivery's bar for 13 days before (Oct 2) shows a partial outage.
- [ ] History lists INC-0014 and INC-0013 with every update in order, and the Database upgrade appears under upcoming maintenance.
- [ ] Signed out, /admin asks for sign-in; signed in as Owen, Team and Settings are not offered, and direct requests to them are refused.

### Phase 2: Incidents and maintenance

```
Using the Status Page blueprint above, build Phase 2 only.

1. Build the admin Dashboard and the Incident editor (section 9, screens 5 and 6) with templates, and the incident actions in section 7, with R4 to R6 and R12.
2. Build Maintenance with the every-minute job (R7) and the Activity log.

Do not send any emails yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Owen creates an incident from "Elevated API errors" and publishes it: it is numbered INC-0015, API shows partial outage and the banner reads "Partial outage".
- [ ] Using the clock: 10 minutes later Owen posts an Identified update setting API to major outage (the banner reads "Major outage"); 20 minutes after that he resolves it. API returns to operational and its uptime shows 99.94%.
- [ ] Moving the clock to M-0003's start (02:00 CDT, 3 days after the seed day; Sunday Oct 18 in the examples) sets Dashboard and API to under maintenance and the banner to "Under maintenance". An incident setting API to partial outage then shows API as partial outage, and resolving it returns API to under maintenance. At 03:00 both return to operational and M-0003 shows completed.
- [ ] A published incident has no Delete action, and a direct delete request is refused; every change above appears in the Activity log with who did it, or "schedule".

### Phase 3: Subscribers, emails, feed and API

```
Using the Status Page blueprint above, build Phase 3 only.

1. Build Subscribe and Manage subscription (section 9, screen 4) with R8, and the Subscribers screen.
2. Write every email in section 10 to the outbox with R9, and build the Outbox screen.
3. Build /history.atom and /api/v1/status.json (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (the subscribe in the first check counts toward the rate limit, so the sixth-attempt check starts by moving the clock forward an hour)
- [ ] Subscribing new@example.com to API only puts a confirmation email in the outbox. Publishing an API incident before she confirms emails sam, lee and ana only; after she confirms, the next update also emails her.
- [ ] Publishing an Email delivery incident emails sam, ana and jo, and not lee or max.
- [ ] An update posted with notify off sends no email.
- [ ] The unsubscribe link in an email works in one click, and that address gets nothing afterwards.
- [ ] A sixth subscribe attempt from the same IP address within an hour is refused.
- [ ] /history.atom lists INC-0013 and INC-0014, and /api/v1/status.json shows the overall status and each component's status, with no drafts and no subscriber data.

### Phase 4: Automation and postmortems

```
Using the Status Page blueprint above, build Phase 4 only.

1. Build the automation webhook (R10) and the Automation screen.
2. Add postmortems to resolved incidents, shown on the incident page and in the feed.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] After a reset, a POST to Payments' automation URL with its token and {"status": "major_outage"} creates draft INC-0015 from "Payments unavailable" and emails Nadia, Owen and Ivy, and the public page does not change.
- [ ] The same request with a wrong token returns 401 and changes nothing, and repeating the valid request does not create a second draft.
- [ ] After another reset, with auto-publish on for Payments, the same request sets Payments to major outage and publishes the incident; a following {"status": "operational"} resolves it and returns Payments to operational.
- [ ] A postmortem added to INC-0013 appears on its incident page below the updates and in /history.atom.

## 16. Variations

- An embeddable banner that shows on your product when there is an open incident, using the JSON API.
- A built-in uptime check that pings each component's URL every minute and calls the automation webhook.
- Slack or Teams messages to subscribers.
- A private page for internal tools, behind your company sign-in.
- Response-time graphs from your monitoring tool.

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser, resetting to the seed data before each phase's checks. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Emails were read on the Outbox screen, and the monitor webhook was called from a separate browser context with no cookies.

**Result:** 18 of 18 acceptance checks passed in one final browser run on a fresh database, plus 114 automated tests. The item-by-item results are in [acceptance-results.json](/builds/status-page/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. Sign-in was limited to "our company email domain", but no setting held the domain. Settings now has email_domain, and section 4 says any method that proves the address works, including a 15-minute one-time link sent through the outbox.
2. The seed gave no text for two of INC-0014's updates or for M-0003, and no from_email. The seed now gives every message and status@larkspur.example.
3. "Elevated API errors" read as both a template name and an incident title, and two templates had no title or message. Each template now has a name, an incident title ("Elevated API error rates"), components and a first message.
4. The seed didn't say who posted the incidents, who scheduled M-0003 or when subscribers confirmed. It now names Ivy Chen and Owen Price, scheduling 4 days before the seed day, confirmations 30 days before and max's link 2 days before.
5. "Including the StatusChange rows for both incidents" didn't say which rows. The seed now lists them: an operational row at each component's creation, then the outage and the return to operational for each incident.
6. "The scheduled email has already gone out" left the outbox empty or guessing. The seed now puts it in the outbox as logged for sam, lee and ana.
7. Only Payments had an automation template. The seed now links API to "Elevated API errors" and Email delivery to "Email delays", and says Dashboard and Webhooks have none.
8. Payments' "note" had no field. It is now the component's description, shown on the public page.
9. Section 4 gave components to admins while section 9 marked only Team and Settings as admin-only. Responders now change statuses from the Dashboard menu, and only admins add, edit, hide or delete components and groups.
10. Nothing said what deleting a component with history or a group with components does. A component used by any incident, maintenance or template can only be hidden, a group can be deleted only when empty, and names are unique.
11. No refusal had an HTTP status or behaviour. Signed-out admin URLs redirect to sign-in, role and state refusals are 403 with the reason, invalid input is 422 with the form kept, drafts are 404 to visitors, and cross-site form posts are refused.
12. Section 9 marked only Team and Settings as admin-only, while section 4 gave templates, subscribers and automation tokens to admins and said nothing about the Activity log or Outbox. Screen 7 now lists which screens are admin-only, and sign-in links in the Outbox are shown only to their recipient.
13. The uptime formula didn't say where days start, whether a window over a daylight-saving change still has 129,600 minutes, or what a component's status was before its first row. Days now run midnight to midnight in the page time zone, minutes are real, downtime counts up to now, and every component gets an operational row when it is created.
14. "Lists that day's incidents" didn't say which incidents or where a bar links. A day's incidents are the published ones open at any time that day, the bar links to the first, and days before a component existed show "No data".
15. Hidden components could still set the banner. The overall status now uses visible components only.
16. Visitors were to see their local time, but the page must work without JavaScript, which can't know the visitor's zone. The server now writes the page's zone with its abbreviation, and an optional script rewrites times to the visitor's zone.
17. A check quoted "02:00 CDT", which is wrong whenever the seed day's maintenance falls after daylight saving ends (it read 02:00 CST in our run). Section 14 now says the zone abbreviations follow the date.
18. "Every update in order" didn't say which order, and section 7's "new update on top" covered only the admin view. Updates are now newest first everywhere: incident pages, History and the feed.
19. History didn't say what an empty month shows, or where open incidents and cancelled or scheduled maintenance go. Every month back to the oldest entry is listed, an empty month says "No incidents reported this month.", open incidents are included, cancelled maintenance is not, and scheduled maintenance sits under Upcoming maintenance.
20. A draft had nowhere to keep its message. A draft's text is now its first IncidentUpdate with published_at empty, and saving one needs a title and a 10-character message.
21. It wasn't clear when an incident gets its number or start time, though a Phase 4 check names "draft incident INC-0015". The number is given when the draft is created and never reused; started_at is set when it is published.
22. Nothing said whether an incident can set under maintenance or what happens to a component an update leaves out. Only maintenance sets under maintenance; a component left out keeps the status this incident last set, and stays on its affected list.
23. R6 explained the return to normal but not how statuses combine while several things are open. A component's status is now always the worst of each open incident's latest status for it and under maintenance for each in-progress maintenance, or operational.
24. The Dashboard's status menu set statuses that R6 would later overwrite. A status set from the menu now applies at once and is recalculated by the next incident or maintenance change affecting that component.
25. Section 7 said resolving emails subscribers, while every update has a notify flag. Resolving now follows notify, which is checked by default on the Resolve form.
26. Impact had no default, templates didn't set it, and nothing said whether title and impact can change later. Impact defaults to minor, and both can be changed while the incident is open, with the change logged.
27. "Never reversed" didn't say whether a second update with the same status is allowed. It is.
28. R5 didn't say what a correction may change or whether resolved incidents can be corrected. Only the message, on open or resolved incidents.
29. A new incident "may link to the old one" with no field for the link. Incident now has related_to, shown on both incident pages.
30. Starting or completing maintenance early by hand didn't say what happens to its times. starts_at or ends_at becomes now, so History shows the real window.
31. Nothing said what can be edited on maintenance once it is scheduled or running. Scheduled maintenance can be edited in full, running maintenance only its title, message and end time, and finished maintenance not at all.
32. A window that is already over when the job first sees it (after downtime, or a moved clock) wasn't covered. The job completes it in the same run without setting components to under maintenance.
33. The every-minute job was "protected by a CRON_SECRET header" with no endpoint or header name. Section 10 now names POST /api/cron/every-minute with X-Cron-Secret or Authorization: Bearer, and 401 for a wrong or missing secret.
34. The 1-hour reminder didn't say whether it depends on notify, or what happens when the start moves. It goes once per start time, only with notify on, when the job runs within the hour before the start.
35. The Notification row had no time, headers, attempt count or link to its incident, and Subscriber had no time for the 7-day expiry to count from. Both now have those fields.
36. R9's "affected component" could mean only the components named in this update, which would skip API subscribers on an update that changes no status. It now means every component the incident's published updates have set.
37. Maintenance emails didn't say whether notify applies to all of them, who gets a cancellation, or whether editing sends anything. All need notify on, a cancellation goes only to those told about it, and edits send nothing.
38. Section 10 gave one subject for the reminder, started and completed, and none for cancelled. It now gives all four.
39. "Subscribing again resends the confirmation" didn't cover pending, unsubscribed and confirmed addresses separately. Each now has a rule, and the form shows the same message whatever the address, so it reveals nobody.
40. "One-click unsubscribe" didn't say whether opening the link is enough or a button is needed. Opening it unsubscribes at once, a POST also works for mail apps, and the page offers Subscribe again.
41. "5 attempts per IP per hour" didn't say what counts, and the check for the sixth attempt shares its hour with the first check's subscribe. Every POST counts over a sliding hour on the app clock, and the checks now say to move the clock an hour first.
42. The honeypot didn't say what a bot sees. A filled honeypot gets the normal success message, and nothing is stored or sent.
43. R8 put an unsubscribe link in "every email", including team sign-in links and monitor reports that go to no subscriber. It now applies to subscriber emails, including the confirmation.
44. Remove on the Subscribers screen could mean delete or unsubscribe. It deletes the subscriber; emails already in the outbox stay.
45. Retries had no limit, and "three failures in a row" didn't say what counts. Each email gets at most 3 attempts, and the rule counts failed attempts to the same address with no success between.
46. Email and feed links need the page's public address, which no setting held. Settings now has page_url.
47. The Atom feed didn't say which maintenance it includes, how titles read or what "updated" means. It now has one entry per published incident and per maintenance in any status, titled with the latest status and number.
48. The JSON API listed its contents but no field names. They are now given.
49. "Cached for at most 30 seconds" didn't say which pages, and caching personal subscription pages would show one visitor's address to another. The cache now covers the public page, incident pages, History, the feed and the API in production only.
50. R12 named people, the schedule and automation, but visitors also change their subscriptions and bounces unsubscribe addresses. Those events now use the actors "visitor" and "outbox", and development clock and reset actions are not logged.
51. "A status equal to the last one reported" and "the incident it opened" had no definition. The last report is the last accepted one for that component (operational before any), and the incident is the latest one automation opened while it is a draft or open.
52. A different problem while automation's incident is still open wasn't covered. It updates that incident instead of opening another.
53. R10 didn't say what an automation incident takes from the template, which impact it gets, or what happens with no template. It takes the template's title and message, the reported status for the component, impact major for a major outage and minor otherwise, and "Payments: major outage" when there is no template.
54. Notify wasn't set for incidents from automation. They have notify on, so auto-published ones email subscribers under R9.
55. Section 10 gave a subject only for the draft case. It now gives the recovery and auto-publish subjects too.
56. An "operational" with nothing to resolve, and auto-publish turned on while a draft exists, weren't covered. The first only emails the team; the second publishes that draft on the next problem report.
57. The webhook gave only the 401 case. Invalid JSON or another status is now 400, an unknown component 404 and a hidden one 409; the body is read as JSON whatever its Content-Type, there is no cookie or Origin check, and every answer is JSON.
58. Postmortems had no rules: who adds them, when, whether they can change, and when they were posted (the feed needs a time). Responders and admins add, edit or remove them on resolved incidents only, postmortem_at records when, and no email is sent.

**What we did not test:**
- Production sign-in. Company-domain one-time sign-in links were built, but every check used the development "sign in as" switcher.
- Sending email. Every email was logged in the outbox, not delivered, so bounces and retries were covered only by the build's own tests.
- The every-minute job on a real scheduler. It was run from the development control with the development clock.
- A real monitoring tool. The test script called the webhook with the URL and token from the Automation screen.
- Visitors in other time zones. Every check ran in America/Chicago, in November 2026, after daylight saving ended.
- Spec fixes that no acceptance check covers, such as status codes, caching, retries, the JSON field names and webhook errors. The test build handles them through its own choices.
- Hosting. The test build ran on SQLite on one server, not separately from the product as section 3 recommends, and the 30-second production cache was not exercised.
