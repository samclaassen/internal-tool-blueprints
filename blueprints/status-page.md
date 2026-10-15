<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/status-page . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

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
- Times are stored in UTC, shown to visitors in their local time with the zone, and written in emails in the page's time zone (Settings).
- Email through an outbox. If no email provider is configured, emails are logged, not sent. Every update can email every subscriber of an affected component, so 1,000 subscribers and 4 updates means 4,000 emails; check your provider's plan.
- The public page must be readable without JavaScript and is cached for at most 30 seconds.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Engineering and support leads | Everything: components, groups, incidents, maintenance, templates, subscribers, team, automation tokens, settings. |
| Responder | Anyone on call or in support | Create, update and resolve incidents and maintenance, change component statuses, add postmortems. |
| Visitor | The public | Read the page, history and incidents; subscribe and manage their own subscription. |

Visitors never see drafts, team member names, subscriber emails or internal notes. Updates are signed with the company name. The server enforces this.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): page_name, company_name, logo, time_zone (default America/Chicago), support_url, from_email.

**TeamMember**: id, name, email (unique), role: admin | responder, active.

**ComponentGroup**: id, name, position.

**Component**: id, name, description, group_id, position, status: operational | degraded_performance | partial_outage | major_outage | under_maintenance, created_at, hidden, automation_token (secret), auto_publish (default false), template_id (used by automation).

**StatusChange** (append-only): id, component_id, status, at, incident_id or maintenance_id, actor (team member, "automation" or "schedule").

**Incident**: id, number (INC-0001, sequential), title, status: draft | investigating | identified | monitoring | resolved, impact: none | minor | major | critical, started_at, resolved_at, postmortem (Markdown), created_by.

**IncidentUpdate**: id, incident_id, status, message (10 to 2,000 characters), component_statuses (component and status pairs set by this update), notify (boolean), published_at, author_id.

**Maintenance**: id, number (M-0001), title, message, starts_at, ends_at, components, status: scheduled | in_progress | completed | cancelled, notify.

**Template**: id, name, title, message, components with their status.

**Subscriber**: id, email (unique, lowercase), all_components (boolean), component_ids, confirm_token, confirmed_at, manage_token, unsubscribed_at, created_ip.

**Event** (append-only activity log) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Statuses and uptime

**Overall status** is the worst current component status, in this order: major outage, partial outage, degraded performance, under maintenance, operational. The banner reads "Major outage", "Partial outage", "Degraded performance", "Under maintenance" or "All systems operational".

**Uptime** for a component uses only the StatusChange log. Over the 90 calendar days shown in the bars (today counted as a full day, or from the day the component was created if later):

uptime = 1 − (minutes in major outage + half the minutes in partial outage) ÷ minutes in the window

Degraded performance and maintenance count as up. Show two decimals, rounded down, so any downtime shows below 100.00%. Each day's bar shows the worst status reached that day and lists that day's incidents.

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
| Resolve | Responder | open | resolved | resolved_at set; components return to operational (R6); subscribers emailed |
| Delete | Responder | draft | | Published incidents cannot be deleted |
| Schedule maintenance | Responder | | scheduled | Subscribers emailed if notify is on |
| Start (on time, or early by hand) | Schedule or responder | scheduled | in_progress | Components set to under maintenance |
| Complete (on time, or early by hand) | Schedule or responder | in_progress | completed | Components return to operational (R6) |
| Cancel | Responder | scheduled | cancelled | Subscribers emailed if they had been told |

A resolved incident cannot be reopened; if the problem returns, open a new incident, which may link to the old one.

## 8. Business rules

- **R1. Overall status** is the worst current component status (section 6).
- **R2. Status history.** Every component status change writes a StatusChange row; rows are never edited or deleted. Uptime and the bars come only from this log.
- **R3. Uptime** is calculated as in section 6, rounded down to two decimals.
- **R4. Incident flow.** Statuses move forward through investigating, identified and monitoring to resolved; steps can be skipped but never reversed. Each update needs a message of 10 to 2,000 characters.
- **R5. Corrections.** An admin can correct the text of a published update; the original text stays in the activity log.
- **R6. Returning to normal.** When an incident is resolved or maintenance completes, each affected component returns to operational, unless another open incident or in-progress maintenance still affects it, in which case it takes the worst status still set.
- **R7. Maintenance timing.** A job that runs every minute starts and completes maintenance at its times, sends a reminder 1 hour before the start, and is safe to run twice.
- **R8. Subscribers.** Subscriptions need double opt-in; the confirmation link expires after 7 days. Only confirmed subscribers get notifications. Every email has a one-click unsubscribe link and a List-Unsubscribe header. Subscribing again with the same email resends the confirmation instead of creating a duplicate. The subscribe form has a hidden honeypot field and allows 5 attempts per IP address per hour.
- **R9. Who gets emailed.** An update with notify on emails each confirmed subscriber who follows all components or at least one affected component, once per update.
- **R10. Automation.** Each component has a secret token. POST /api/automation/<component_id> with the header X-Status-Token and a JSON body {"status": "..."} using one of the four non-maintenance statuses. A wrong or missing token returns 401 and changes nothing. A status equal to the last one reported is ignored. With auto_publish off (the default), a problem status creates one draft incident from the component's template and emails the team, and the public page does not change; a later "operational" emails the team that the monitor reports recovery and leaves the draft for a person to publish or delete. With auto_publish on, it sets the status and publishes the incident; "operational" resolves the incident it opened.
- **R11. Public data.** The page, feeds and JSON API never include drafts, team member names, subscriber data or notes.
- **R12. Activity log.** Every change by a person, the schedule or automation writes an event; events are never edited or deleted.

## 9. Screens

Public:
1. **Status page** (/). Banner, components by group with current status, 90-day bars and uptime, open incidents with their latest update, upcoming maintenance, and Subscribe.
2. **Incident page** (/incidents/INC-0013). Title, affected components, every update with its time, and the postmortem when there is one.
3. **History** (/history). Incidents and completed maintenance by month, newest first.
4. **Subscribe** and **Manage subscription** (from the link in every email): choose components, or unsubscribe.

Admin (/admin, team only):
5. **Dashboard.** Every component with a status menu, open incidents, upcoming maintenance, and New incident.
6. **Incident editor.** Title, impact, status, message, affected components with a status each, notify, template picker, and a preview of the subscriber email.
7. **Maintenance**, **Components and groups**, **Templates**, **Subscribers** (search, export CSV, remove), **Team** and **Settings** (admins only), **Automation** (tokens, auto-publish), **Activity log**, **Outbox**.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Incident published or updated with notify on | Subscribers of affected components (R9) | "[Larkspur status] Investigating: Elevated API error rates" |
| Incident resolved | Subscribers of affected components | "[Larkspur status] Resolved: Elevated API error rates" |
| Maintenance scheduled | Subscribers of affected components | "[Larkspur status] Scheduled maintenance: Database upgrade, Sun Oct 18, 02:00 to 03:00 CDT" |
| Maintenance reminder, started, completed | Same | "[Larkspur status] Starting in 1 hour: Database upgrade" |
| Subscribe | The new subscriber | "Confirm your subscription to Larkspur status" |
| Automation reports a problem or a recovery | Every active team member | "Monitor reports Payments: major outage (draft incident INC-0015)" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. Retry failed sends from the every-minute job (protected by a CRON_SECRET header). A failed email never blocks the action that caused it.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so maintenance timing, reminders and uptime can be tested by moving the clock.

## 12. Feeds and API

- **/history.atom**: one entry per incident and maintenance, updated whenever a new update is posted, with the latest status in the title.
- **/api/v1/status.json**: page name, overall status and banner text, each visible component with its group and status, open incidents with their latest update, and upcoming maintenance. Allow cross-origin reads so other sites can embed it.

## 13. Edge cases

- Two open incidents affect the same component: it shows the worse status; resolving one leaves the other's (R6).
- An incident during maintenance: a partial or major outage shows over under maintenance; when the incident resolves, the component goes back to under maintenance until the window ends.
- A component cannot be hidden or deleted while an open incident or in-progress maintenance affects it; hidden components keep their history.
- Maintenance whose end time is moved earlier than now completes on the next job run.
- An email address on the subscriber list that bounces: mark the notification failed; three failures in a row unsubscribe the address.
- Visitors in another time zone see local times with the zone, such as "09:00 CDT".

## 14. Seed data

Settings: page "Larkspur status" for Larkspur, invoicing software for freelancers; time zone America/Chicago; support_url https://larkspur.example/support. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Team (emails firstname@larkspur.example): Nadia Brooks (admin), Owen Price (responder, support lead), Ivy Chen (responder, engineer).

Components (all created more than 90 days ago, all operational now):
- Group "App": Dashboard, API, Webhooks
- Group "Delivery": Email delivery, Payments (with a note "Processed by Stripe")

Templates: "Elevated API errors" (API at partial outage; "We're investigating increased error rates on API requests and will post an update within 30 minutes."), "Email delays" (Email delivery at degraded performance), "Payments unavailable" (Payments at major outage; used by Payments automation).

Incidents (numbering continues after INC-0014):
- INC-0013 "API errors for some requests", Friday Sep 18, impact major. API major outage from 09:00 to 09:42 CDT. Updates: 09:00 Investigating "We're seeing errors on a share of API requests and are investigating."; 09:18 Identified "A database connection limit was reached after a configuration change. We're rolling it back."; 09:30 Monitoring "The change is rolled back and error rates are back to normal. We're monitoring."; 09:42 Resolved "This incident has been resolved."
- INC-0014 "Invoice emails delayed", Friday Oct 2, impact minor. Email delivery partial outage from 13:10 to 16:10 CDT. Updates: 13:10 Investigating; 13:40 Identified "Our email provider is working through a backlog; invoice emails are queued, not lost."; 15:20 Monitoring; 16:10 Resolved.

Maintenance: M-0003 "Database upgrade", Sunday Oct 18, 02:00 to 03:00 CDT, Dashboard and API, scheduled, notify on (the scheduled email has already gone out).

Subscribers: sam@clientco.example (all components), lee@agency.example (API and Webhooks), ana@studio.example (all components), jo@freelance.example (Email delivery) are confirmed; max@pending.example (all components) has not confirmed.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation and the public page

```
Using the Status Page blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add team sign-in with the platform's built-in auth or Google sign-in limited to our company email domain. Only active team members can open /admin; visitors never need to sign in.
3. Build Settings, Team, and Components and groups (section 9, screen 7), and the public Status page, Incident pages and History (screens 1 to 3) with R1 to R3 and R11, readable without JavaScript.
4. Load the seed data from section 14, with dates relative to today, including the StatusChange rows for both incidents.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] The public page shows "All systems operational", the five components in their two groups, and 90-day uptime of 99.96% for API, 99.93% for Email delivery and 100.00% for the other three.
- [ ] API's bar for Sep 18 shows a major outage and links to INC-0013; Email delivery's bar for Oct 2 shows a partial outage.
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
- [ ] Moving the clock to Sunday 02:00 CDT sets Dashboard and API to under maintenance and the banner to "Under maintenance"; at 03:00 both return to operational and M-0003 shows completed.
- [ ] During that maintenance, an incident setting API to partial outage shows API as partial outage; resolving it returns API to under maintenance until 03:00.
- [ ] A published incident has no Delete action, and a direct delete request is refused; every change above appears in the Activity log with who did it, or "schedule".

### Phase 3: Subscribers, emails, feed and API

```
Using the Status Page blueprint above, build Phase 3 only.

1. Build Subscribe and Manage subscription (section 9, screen 4) with R8, and the Subscribers screen.
2. Write every email in section 10 to the outbox with R9, and build the Outbox screen.
3. Build /history.atom and /api/v1/status.json (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
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
