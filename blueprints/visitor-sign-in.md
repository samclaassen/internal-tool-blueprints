<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/visitor-sign-in . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Visitor Sign-In

Blueprint BP-023 · Department: Ops · Replaces: Envoy Visitors, the paper sign-in book
For teams of 10 to 200 people at one office.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Visitors sign a paper book at reception, and nobody knows who's in the building."

At a small office, visitors write their names in a book anyone can read, wait while someone hunts for their host, walk around without a badge, and never sign out, so the list for a fire drill is wrong. NDAs are emailed after the meeting, if at all. When a former visitor asks what you keep about them, nobody knows.

This blueprint is a sign-in app for a tablet at reception plus a web app for staff. Visitors sign in in under a minute (or scan the QR code in their invite), sign the document their visit needs, and get a printed badge. The host is emailed the moment they arrive. Everyone is signed out, by themselves, by their host or automatically in the evening. The office manager sees who is on site right now, and visitor details are deleted after a set number of days.

## 2. What the real product does

Research basis: the Visitors tab of Envoy's pricing page (envoy.com/pricing), October 2026.

What we verified:

1. **Basic, free with limited features:** host notifications, 100 visitor entries a month, and up to 50 employees in the directory.
2. **Premium, $362 per location per month, billed annually** (the page offers a quote): custom branding, a virtual front desk, badge printing, visitor photos, visitor analytics, scheduled email reports of visitor data, SSO and directory integrations, legal documents, and emergency notifications to visitors.
3. **Enterprise, custom pricing:** blocklist scanning, access control and guest Wi-Fi integrations, ID scanning with 500 scans a year included, and customizable analytics.
4. The same page sells other workplace products: Response, Reservations, Screens and Deliveries.

An office with more than 50 people, or more than 100 visits a month, outgrows Basic, and Premium costs $4,344 a year per location.

### What this blueprint keeps

Visit types (guest, interview, contractor, delivery) with their own documents and badge rules; a kiosk screen for the reception tablet; sign-in with name, company, host and visit type; documents such as an NDA signed by typing a full name, with the exact version kept; returning visitors recognised by email; badge printing from the browser; host notifications by email, with an optional message to a reception Slack channel; invites with a QR code for one-tap sign-in; sign-out at the kiosk, by badge, by the host or automatically in the evening; a live on-site list and evacuation printout; a searchable visitor log with CSV export; and automatic deletion of visitor details after a retention period.

### What this blueprint deliberately leaves out

ID scanning, visitor photos, blocklist screening, access control and Wi-Fi integrations, a video front desk, several locations, package deliveries tracking, desk and room booking, SMS, calendar integrations and analytics dashboards.

## 3. Scope of v1

- One office, one time zone (Settings).
- The reception tablet opens the kiosk screen in a full-screen browser, signed in as a kiosk device that can only use the kiosk.
- Badges print through the browser's print dialog, with a CSS page size matching the label printer (Settings; default 62 × 100 mm). Make the label printer the tablet's default printer.
- Email through an outbox. If no email provider is configured, emails are logged, not sent. The optional Slack message uses an incoming webhook URL kept as a secret.
- Privacy: ask only for what each visit type needs, show a short privacy notice on the kiosk, and delete visitor details after retention_days (R7).

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Office manager, operations | Everything: settings, staff directory, visit types, documents, the full log, export, deleting a visitor's details. |
| Staff | Everyone who works there | Invite visitors, see their own visitors and the on-site list, sign out their own visitors. |
| Kiosk | The reception tablet | The kiosk screens only: sign in, scan an invite, sign out. |
| Visitor | No account | Uses the kiosk or the link in their invite. |

The server enforces every permission here (R8, R9).

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): office_name, address, time_zone, retention_days (default 90), auto_sign_out_time (default 19:00), privacy_notice, reception_email, badge_size (default 62 × 100 mm), slack_webhook_url (optional, secret).

**Person** (staff): id, name, email (unique, lowercase), role: admin | staff, active.

**Device**: id, name, token (secret, long and random), active. A kiosk opens /kiosk with its token once and stays signed in as that device.

**VisitType**: id, name, requires_host, document_id (optional), prints_badge, asks_company, active.

**Document**: id, title, active_version, re_sign_after_days.
**DocumentVersion**: document_id, version (1, 2, 3…), body (Markdown), published_at. Versions are never edited.

**Invite**: id, visitor_name, visitor_email, company, host_id, visit_type_id, expected_at, code (random, unique), status: expected | arrived | cancelled | no_show.

**Visit**: id, visitor_name, visitor_email (optional), company, visit_type_id, host_id (empty for types that need no host), invite_id, signed_in_at, signed_out_at, sign_out_method: kiosk | badge | host | admin | auto, badge_code (random), anonymized_at.

**Signature**: id, visit_id, visitor_email, document_id, version, typed_name, signed_at.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Signing in

On the kiosk:
1. Welcome: "Sign in", "I have an invite", "Sign out".
2. Visit type, then name, email (optional except for invites), company (if the type asks for it) and host (type-ahead over active staff, if the type needs a host).
3. If the type has a document, show its active version and ask the visitor to type their full name to sign, unless this email signed the same version within re_sign_after_days (R3).
4. The privacy notice, with "Sign in".
5. "Welcome, Ana. Raj Patel has been told you're here." The badge prints if the type prints badges.

A visitor email that matches an earlier visit (within retention) pre-fills name and company.

### Worked examples (seed data in section 14; today is Thursday, October 15, 2026)

| Situation | Result |
|---|---|
| Ana Ruiz (ana@bluebird.example) signs in again as a Guest for Raj | Name and company pre-filled; no NDA, because she signed NDA version 2 today; Raj is emailed "Ana Ruiz from Bluebird is here to see you." |
| A first-time guest signs in for Raj | NDA version 2 shown; they must type their full name; badge prints |
| Mark Bell scans the QR code from his invite | His details are pre-filled; he signs the NDA; Lena is emailed; the invite shows Arrived |
| Mark's code is used again | Refused: "This invite has already been used." |
| A delivery from Metro Paper | No host asked; reception is emailed; no badge |
| 19:00 | Everyone still signed in is signed out with method auto |
| The nightly job | The visit from 91 days ago is anonymised; the visit from 89 days ago stays |

## 7. Invites and signing out

| Action | Who | Effect |
|---|---|---|
| Invite | Staff | Invite email to the visitor with date, time, address, host and a QR code of the invite code |
| Cancel invite | The host or an admin | Status cancelled; the visitor is emailed |
| Use invite | Kiosk | Valid only on the expected date in the office time zone; status arrived; the visit links the invite |
| Sign out at the kiosk | Visitor | By typing their name and choosing from today's matches, or by scanning their badge |
| Sign out | The host or an admin | From the on-site list |
| Automatic sign-out | Job | At auto_sign_out_time, everyone still signed in; unused invites for today become no_show |

A visit can be signed out only once.

## 8. Business rules

- **R1. Required details.** A visit needs a name (2 to 80 characters), a visit type, and a host if the type requires one; the email must be valid when given. The server refuses anything else.
- **R2. Documents** are versioned. Publishing an edit creates a new version and makes it active; old versions are never changed. A signature stores the document, version, typed name and time, and the visit page shows exactly the text that was signed.
- **R3. Signing again.** A visitor signs a document again only if they have no signature of its active version within re_sign_after_days, looked up by email. Without an email, they always sign.
- **R4. Notifications.** Each sign-in emails the host once ("Ana Ruiz from Bluebird is here to see you."); types without a host email reception_email; the Slack message goes to the reception channel if configured. A failed notification never blocks the sign-in.
- **R5. Invites.** An invite code works once, on the expected date only.
- **R6. Sign-out** happens once per visit and records the method; automatic sign-out runs at auto_sign_out_time.
- **R7. Retention.** Every night, visits signed out more than retention_days ago are anonymised: name becomes "Visitor", and email, company and signature typed names are cleared; the date, visit type and host stay for counts. An admin can anonymise all of one visitor's visits at once on request, by email.
- **R8. Kiosk device.** It can create visits, use invites and sign visits out, and look up a returning visitor's name and company by exact email. It cannot read the log, invites or anything else.
- **R9. Visibility.** Staff see the on-site list (names, hosts, times) and their own visitors and invites. Admins see everything.
- **R10. Events.** Every change writes an event; events and signatures are never edited or deleted (anonymising clears names but keeps the rows).

## 9. Screens

1. **Kiosk** (tablet, large touch targets): welcome, the sign-in steps in section 6, scan invite (camera, with a typed-code fallback), sign out, and a 30-second timeout back to the welcome screen.
2. **On site now** (staff home): who is in the building, with company, host and time; sign-out buttons for your own visitors (all, for admins); an Evacuation list print view.
3. **My visitors and invites** (staff): upcoming invites, today's and past visits of mine; New invite.
4. **Visitor log** (admins): search by name, company or host, date range, visit type; each visit with its signature; CSV export.
5. **Visit types**, **Documents** (with versions), **Staff directory**, **Devices**, **Settings**, **Outbox** (admins).
6. **Badge** print view: visitor name, company, host, date and a QR code of the badge code, at badge_size.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Visitor signs in | Host, or reception_email for types without a host | "Ana Ruiz from Bluebird is here to see you" |
| Invite created | Visitor | "Your visit to Harbor & Pine on Thu Oct 15 at 14:00" (with QR code) |
| Invite cancelled | Visitor | "Your visit on Oct 15 has been cancelled" |
| Visitor signed out automatically | Host | "Omar Haddad was signed out automatically at 19:00" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A job (protected by a CRON_SECRET header) runs every 15 minutes for automatic sign-out and once a night for retention, and is safe to run twice.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so invites, automatic sign-out and retention can be tested by moving the clock.

## 12. Export

CSV for a date range, one row per visit: date, signed in, signed out, method, visitor name, company, email, visit type, host, document and version signed. Anonymised visits export as "Visitor" with empty personal fields.

## 13. Edge cases

- Two visitors with the same name on site: signing out by name lists both with company and sign-in time.
- A host is deactivated: they disappear from the host list; their future invites stay and an admin reassigns them.
- A visitor signs in twice without signing out: the earlier visit is signed out (method kiosk) when the new one starts, matched by email.
- The tablet loses its connection: the kiosk shows "Please wait or ask for help" and never loses a half-completed sign-in silently.
- An invite is scanned on the wrong day: "This invite is for Fri Oct 16."

## 14. Seed data

Office "Harbor & Pine Architects", 400 W Lake St, Chicago; time zone America/Chicago; retention 90 days; automatic sign-out at 19:00; reception_email reception@harborpine.example. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Staff (emails firstname@harborpine.example): Kim Olsen (admin, office manager), Raj Patel, Lena Fox, Tom Reed (staff). Device: "Reception iPad".

Visit types: Guest (host, NDA, badge, company), Interview (host, no document, badge), Contractor (host, Site safety rules, badge, company), Delivery (no host, no document, no badge, company).

Documents: Mutual NDA, version 2 active (version 1 kept), re-sign after 365 days. Site safety rules, version 1, re-sign after 30 days.

Visits today: Omar Haddad (Brightwire Electrical, Contractor, host Kim, signed in 08:30, signed Site safety rules v1); Ana Ruiz (ana@bluebird.example, Bluebird, Guest, host Raj, signed in 09:12, signed NDA v2 at 09:13); Jo Park (Interview, host Lena, 10:00 to 11:05, signed out at the kiosk). Yesterday: three visits, one of them signed out automatically at 19:00. Older: Sam Ortiz (Guest, host Tom), 91 days ago; Priya Shah (Guest, host Lena), 89 days ago.

Invites: Mark Bell (mark@clientco.example, Clientco, Guest, host Lena) today at 14:00; Dev Gupta (dev@vendorly.example, Vendorly, Guest, host Tom) today at 16:00; Sara Kim (sara@example.com, Interview, host Raj) tomorrow at 10:00.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Visitor Sign-In blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add staff sign-in with the platform's built-in auth or Google sign-in limited to our company email domain; a signed-in email must match an active Person, and anyone else sees "Ask the office manager to add you." Add kiosk devices (R8).
3. Build On site now, the Visitor log, Visit types, Documents with versions (R2), Staff directory, Devices and Settings (section 9, screens 2, 4 and 5), with R9 on the server.
4. Load the seed data from section 14, with dates relative to today.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] On site now shows Omar Haddad (Brightwire Electrical, host Kim Olsen, since 08:30) and Ana Ruiz (Bluebird, host Raj Patel, since 09:12), and the log shows today's three visits and yesterday's three.
- [ ] Publishing an edit to the Mutual NDA creates version 3, and Ana Ruiz's visit still shows the version 2 text she signed.
- [ ] Signed in as Raj, the log shows only his visitors, and Settings and Documents are refused, including direct requests.
- [ ] The Reception iPad device can open only the kiosk, and a direct request for the log is refused.

### Phase 2: The kiosk and notifications

```
Using the Visitor Sign-In blueprint above, build Phase 2 only.

1. Build the Kiosk sign-in (section 6 and section 9, screen 1) with R1, R3 and R4, and the Badge print view (screen 6).
2. Write the sign-in emails (section 10) to the outbox, and the optional Slack message.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] On the kiosk, a first-time guest signing in for Raj must type a full name under NDA version 2, then sees "Raj Patel has been told you're here", and the outbox has one email for Raj.
- [ ] Ana Ruiz signing in again with ana@bluebird.example has her name and company filled in and is not asked to sign the NDA.
- [ ] A Delivery sign-in asks for no host, emails reception@harborpine.example, and prints no badge.
- [ ] The badge print view shows the visitor's name, company, host, date and a QR code, laid out for a 62 × 100 mm label.
- [ ] Signing in a Guest without a name or a host is refused, both on the kiosk and as a direct request.

### Phase 3: Invites and signing out

```
Using the Visitor Sign-In blueprint above, build Phase 3 only.

1. Build invites and My visitors and invites (section 7 and section 9, screen 3) with R5, including the invite email with its QR code.
2. Build every way of signing out in section 7, the 15-minute job for automatic sign-out (R6), and the email to hosts.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Mark Bell's invite email in the outbox has a QR code; using his code on the kiosk fills in his details, he signs the NDA, Lena is emailed, and the invite shows Arrived.
- [ ] Using Mark's code again is refused with "This invite has already been used.", and Sara Kim's code is refused today with "This invite is for Fri Oct 16."
- [ ] Scanning Omar Haddad's badge code at the kiosk signs him out; Raj can sign out Ana Ruiz from On site now but has no sign-out button for other hosts' visitors, and a direct request is refused.
- [ ] Moving the clock to 19:00 and running the job signs out everyone still on site with the method auto, emails their hosts, and marks Dev Gupta's unused invite as no-show.

### Phase 4: Retention, evacuation and export

```
Using the Visitor Sign-In blueprint above, build Phase 4 only.

1. Build the nightly retention job and the admin's delete-on-request action (R7).
2. Build the Evacuation list print view and the CSV export (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Running the nightly job anonymises Sam Ortiz's visit from 91 days ago (it shows "Visitor" with no email or company) and keeps Priya Shah's from 89 days ago; running it again changes nothing.
- [ ] Kim deletes Ana Ruiz's details by email: every visit of hers shows "Visitor", her signature's typed name is cleared, and the action is in the event log.
- [ ] The Evacuation list prints everyone on site now with their host and sign-in time.
- [ ] Exporting today's visits gives a CSV with one row per visit and the document version each visitor signed.

## 16. Variations

- Visitor photos taken by the tablet camera, deleted with the rest of the details.
- A watchlist that pauses a sign-in and alerts the office manager.
- Host messages in Slack or Teams instead of email.
- Several office locations, each with its own kiosk and settings.
- Guest Wi-Fi details printed on the badge.
- Package deliveries logged and handed to their recipient.
