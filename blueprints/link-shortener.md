<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/link-shortener . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Link Shortener

Blueprint BP-021 · Department: Marketing · Replaces: Bitly, the UTM spreadsheet
For teams of 2 to 50 people who share links in email, social, ads and print.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Our UTM tags are a mess and nobody knows which links still work."

Marketing builds tracking links by hand from a spreadsheet, so analytics shows "Facebook", "facebook" and "fb" as three different sources. The short links live in one person's account. A flyer's QR code points at a page that was renamed last month. Nobody can say which campaign link actually got clicks, or how many of those clicks were link previews in Slack.

This blueprint is a link shortener on your own domain (such as go.yourcompany.com) with a UTM builder that only allows your agreed values, QR codes, click counts that leave out bots and link previews, destination changes with a full history, and reports by campaign, source and medium. Every link belongs to the team.

## 2. What the real product does

Research basis: Bitly's pricing page and plan comparison (bitly.com/pages/pricing), October 2026.

What we verified:

1. **Plans and prices, billed annually.** Free (with ads): 5 links and 2 QR codes a month and 3 custom back-halves a month. Core: $10 a month, annual only ($120 a year), with 100 links and 5 QR codes a month, 30 days of click and scan data, a UTM builder, and link and QR code redirects. Growth: $29 a month billed annually ($348), with 500 links and 10 QR codes a month, a complimentary custom domain, branded links, 4 months of data and bulk creation. Premium: $199 a month billed annually ($2,388), with 3,000 links and 200 QR codes a month, 1 year of data, custom campaign-level tracking, city-level and device data, and mobile deep linking. Enterprise: custom pricing. The page says annual plans save up to 34%.
2. **Changing a destination is metered.** The comparison lists redirects (changing where a link or QR code points) at 5 a month on Core, 20 on Growth and 110 on Premium.
3. **Data history by plan.** 30 days on Core, 120 days on Growth, 1 year on Premium and 2 years on Enterprise.
4. **Teams.** Enterprise adds multiple users and group permission management, high-volume API and webhook access, SSO and a dedicated customer success manager. Clicks and scans are unlimited on every plan.

### What this blueprint keeps

Short links on your own domain with readable back-halves; a UTM builder that only accepts your agreed sources and mediums, with presets and campaigns; QR codes as PNG and SVG; destination changes without limits, each kept in a history; link expiry with a fallback page; click and scan counts that leave out bots, link previews and repeat clicks; reports by link, campaign, source, medium, country and referring site; CSV exports; team accounts with owners; a root redirect and a friendly not-found page.

### What this blueprint deliberately leaves out

Landing pages and link-in-bio pages, mobile deep linking, city and device analytics, browser extensions and mobile apps, more than one short domain, an API for other tools, retargeting pixels, splitting traffic between destinations, and AI features.

## 3. Scope of v1

- One short domain you control, pointed at the app. The admin screens live under /admin on the same domain.
- Redirects must be fast: one indexed lookup (or a cache of at most 60 seconds) and a 302 response. Use 302, not 301, so browsers don't remember the destination and changes take effect.
- Recording a click must not slow the redirect: write it after responding (a deferred write, queue or background job).
- Privacy: no cookies on redirects and no stored IP addresses (R7). Country comes from your host's geolocation header when it provides one.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Marketing lead | Everything: settings, users, sources, mediums, presets, campaigns, and every link. |
| Member | Everyone else on the team | Create links, edit and archive their own links, create campaigns, see every link and every report. |
| Visitor | Anyone who clicks | Follow links. |

The server enforces these permissions, not only the screens.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): short_domain, main_site_url (the root redirect and the not-found page's link), expired_fallback_url, allowed_destination_domains (optional list), time_zone.

**User**: id, name, email (unique, lowercase), role: admin | member, active.

**UtmValue**: id, kind: source | medium, value (lowercase letters, digits and hyphens), active.

**Preset**: id, name, source, medium, content (optional).

**Campaign**: id, value (such as spring-sale-2026, unique), name, owner_id, archived.

**Link**
- id, slug (unique, the back-half), title, base_url, utm_source, utm_medium, campaign_id, utm_term, utm_content, destination_url (base URL with UTM parameters applied)
- owner_id, created_at, expires_at (optional), status: active | expired | archived, notes

**LinkChange** (append-only): id, link_id, at, user_id, field, old_value, new_value.

**Click** (append-only): id, link_id, at, kind: click | scan | preview | bot | expired, counted (false for repeats, R6), country (two letters or empty), referrer_domain (or empty), visitor_hash.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Building the destination

The destination is the base URL plus utm_source, utm_medium, utm_campaign, and utm_term and utm_content when given, in that order. Other query parameters stay where they are; a #fragment stays at the end. Values are lowercased automatically and spaces become hyphens. Source and medium must be on the allowed lists, and the campaign must be an existing campaign. If the base URL already has UTM parameters, they are replaced, with a warning.

### Worked examples (seed data in section 14)

| Input | Result |
|---|---|
| https://northwind.example/pricing with the "Newsletter" preset and campaign spring-sale-2026 | https://northwind.example/pricing?utm_source=newsletter&utm_medium=email&utm_campaign=spring-sale-2026 |
| https://northwind.example/demo?ref=partner#form with linkedin, paid-social, spring-sale-2026 and content "Carousel A" | https://northwind.example/demo?ref=partner&utm_source=linkedin&utm_medium=paid-social&utm_campaign=spring-sale-2026&utm_content=carousel-a#form |
| Source "fb" | Refused: "fb isn't an allowed source. Allowed: facebook, google, linkedin, newsletter, partner, podcast, print." |
| A base URL that already has utm_source=twitter | Warning: "This URL already has UTM tags; they will be replaced." |
| Slug "spring" | Refused: "go.northwind.example/spring is taken. Try spring-2." |
| Destination javascript:alert(1) | Refused: "Links must start with http:// or https://." |

## 7. Redirects and counting

| Request | Response | Recorded as |
|---|---|---|
| /spring (active link) | 302 to the destination | click, counted |
| /spring again from the same visitor within 30 seconds | 302 | click, not counted |
| /spring from a link preview (user agent contains Slackbot, Twitterbot, LinkedInBot, facebookexternalhit, WhatsApp, Discordbot, TelegramBot or Applebot) | 302 | preview, not counted |
| /spring from another crawler (user agent contains bot, crawler or spider) | 302 | bot, not counted |
| /flyer?qr=1 (the address in the QR code) | 302 to the destination, without qr=1 | scan, counted |
| /webinar-may (expired) | 302 to the expired fallback URL | expired |
| /nothing-here or an archived link | 404 page: "This link doesn't exist." with a link to the main site | nothing |
| / | 302 to the main site | nothing |
| HEAD requests | Same status, no body | nothing |

Slugs match without regard to case or a trailing slash: /Spring/ is /spring.

## 8. Business rules

- **R1. Slugs.** 3 to 50 characters: lowercase letters, digits and hyphens, unique. Reserved words are refused: admin, api, auth, login, logout, qr, static, assets, health, robots.txt, favicon.ico. A slug can change only until its link has a counted click or scan; after that it is permanent, because it may be printed.
- **R2. Destinations.** http or https only, at most 2,000 characters, and inside allowed_destination_domains when that list is set.
- **R3. UTMs** are built as in section 6. Source and medium values come only from the active lists; term and content are lowercased, with spaces turned into hyphens.
- **R4. Destination changes.** No limit. Each change writes a LinkChange with the old and new values, and the next click uses the new destination. If the new destination is on a different domain and the link had scans in the last 30 days, ask for confirmation: "This link is in a QR code that was scanned 12 times in the last 30 days."
- **R5. Expiry.** At expires_at the link becomes expired and redirects to the expired fallback. The owner is emailed 3 days before.
- **R6. Counting.** Counted clicks and scans exclude previews, bots, expired requests and repeats: the same visitor on the same link within 30 seconds. Reports use counted clicks and scans only, and show previews separately.
- **R7. Privacy.** visitor_hash is SHA-256 of a daily random salt plus IP address plus user agent. The salt is replaced every day and the old one is discarded, so hashes cannot be traced back or joined across days. IP addresses are never stored.
- **R8. Ownership.** Members edit and archive only their own links; admins can edit any link. A link with counted clicks or scans is archived, never deleted.
- **R9. Events.** Every change writes an event; events, changes and clicks are never edited or deleted.

## 9. Screens

1. **Links** (home): search by slug, title or destination; filter by campaign, owner, source, medium and status. Each row: short link with a copy button, title, destination host, campaign, counted clicks and scans in the last 30 days, owner.
2. **New link** and **Edit link**: base URL, slug (suggested from the title), preset, source, medium, campaign, term, content, title, expiry, notes, with a live preview of the final URL and the QR code.
3. **Link page**: the short link, copy, QR code download (PNG at 1,024 pixels and SVG), destination, change history, a daily chart of clicks and scans (30 or 90 days), top countries and referring sites, and the number of previews left out.
4. **Campaigns**: each campaign with its links and counted clicks, broken down by source and medium.
5. **Sources and mediums**, **Presets**, **Users** and **Settings** (admins), and **Outbox**.
6. Public: the redirect, the not-found page and the root redirect.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Link expires in 3 days | Owner | "go.northwind.example/q4-podcast expires on Oct 18" |
| Monday 08:00 in the Settings time zone | Each active user whose links had counted clicks or scans in the previous Monday to Sunday | "Your links last week: 2 links, 34 clicks" (each link's counted clicks and scans for that week) |
| User added | The new user | "You've been added to Northwind links" |

Write every email to the outbox first, then send it. With no provider configured, set status logged. A daily job (protected by a CRON_SECRET header) sends reminders and digests, and is safe to run twice.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so expiry, reminders, the 30-second repeat window and digests can be tested.

## 12. QR codes and export

- QR codes encode the short link with ?qr=1, so scans are counted separately from clicks. Use a standard library; error correction level M; downloadable as SVG and as a 1,024-pixel PNG.
- **Links export** (CSV): short link, title, destination, source, medium, campaign, term, content, owner, created, status, counted clicks, counted scans.
- **Clicks export** (CSV) for a date range: date, slug, counted clicks, counted scans, previews.

## 13. Edge cases

- Two people choose the same slug at the same moment: one succeeds and the other is told it is taken.
- A base URL with spaces or without a scheme: add https:// and encode it; refuse it if it still doesn't parse.
- A campaign is archived: its links keep working; it is no longer offered for new links.
- A source or medium is deactivated: existing links keep it; new links cannot use it.
- A link's owner is deactivated: the link stays and an admin can reassign it.
- A visitor with no user agent: counted as a click (some apps send none).

## 14. Seed data

Company Northwind, a B2B software company. Short domain go.northwind.example, main site https://northwind.example, expired fallback https://northwind.example, time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Users (emails firstname@northwind.example): Maya Lopez (admin, marketing lead), Chris Doyle (member, content), Sana Iqbal (member, events).

Sources: facebook, google, linkedin, newsletter, partner, podcast, print. Mediums: email, social, paid-social, cpc, referral, qr, audio.

Presets: Newsletter (newsletter, email), LinkedIn post (linkedin, social), LinkedIn ads (linkedin, paid-social), Print (print, qr).

Campaigns: spring-sale-2026 (Maya), webinar-may-2026 (Sana), q4-launch (Chris).

| Link | Destination base | UTMs | Owner | Counted in the last 30 days |
|---|---|---|---|---|
| /spring | https://northwind.example/pricing | newsletter, email, spring-sale-2026 | Maya | 342 clicks (US 210, GB 61, CA 40, DE 31), plus 25 previews |
| /spring-li | https://northwind.example/pricing | linkedin, paid-social, spring-sale-2026, content carousel-a | Maya | 128 clicks |
| /flyer | https://northwind.example/demo | print, qr, q4-launch | Chris | 57 scans and 3 clicks |
| /q4-podcast | https://northwind.example/launch | podcast, audio, q4-launch; expires Oct 18 | Chris | 19 clicks |
| /webinar-may | https://northwind.example/webinars/may | newsletter, email, webinar-may-2026; expired Jun 1 | Sana | none (88 clicks before it expired, all older than 30 days) |

Spread the seed clicks and scans evenly over the last 30 days. None of the seed links has a change history yet.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app.

### Phase 1: Foundation and the link builder

```
Using the Link Shortener blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in under /admin with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active User; anyone else sees "Ask an admin to add you."
3. Build Links, New link and Edit link (section 9, screens 1 and 2) with R1 to R3 and R8, and the admin screens in screen 5, all enforced on the server. Do not build redirects yet.
4. Load the seed data from section 14, with dates relative to today, including the clicks.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button, all visible only in development.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Links shows the five seed links; /spring shows 342 clicks in the last 30 days and /flyer shows 57 scans.
- [ ] Building a link from https://northwind.example/demo?ref=partner#form with linkedin, paid-social, spring-sale-2026 and content "Carousel A" previews exactly the second URL in section 6's examples.
- [ ] The source "fb", the slug "spring", the slug "admin" and the destination javascript:alert(1) are each refused with the messages in section 6 or R1.
- [ ] Changing the slug of /spring is refused because it has clicks; changing the slug of a new link with no clicks works.
- [ ] Signed in as Chris, he can edit /flyer but not /spring, and a direct request to edit /spring is refused.

### Phase 2: Redirects and counting

```
Using the Link Shortener blueprint above, build Phase 2 only.

1. Build the public redirect, the not-found page and the root redirect exactly as section 7 describes, recording clicks after the response with R6 and R7.
2. Build QR codes (section 12) and destination changes with history (R4), and expiry (R5) without the email.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Opening /spring returns a 302 to the full pricing URL with its UTM parameters, and /spring's count goes from 342 to 343.
- [ ] Opening it again within 30 seconds still redirects, but the count stays at 343; a request with the user agent "Slackbot-LinkExpanding 1.0" is recorded as a preview and not counted.
- [ ] /flyer's QR code downloads as SVG and PNG and encodes the short link with ?qr=1; opening that address redirects without qr=1 and takes the scans from 57 to 58.
- [ ] /webinar-may redirects to https://northwind.example and is recorded as expired; /nothing-here returns a 404 page with a link to the main site; / redirects to the main site.
- [ ] Changing /spring-li's destination records the old and new URLs in its history, and the next click goes to the new destination.
- [ ] No IP address is stored anywhere in the database.

### Phase 3: Reports and exports

```
Using the Link Shortener blueprint above, build Phase 3 only.

1. Build the Link page charts and breakdowns (section 9, screen 3) and Campaigns (screen 4), using counted clicks and scans only.
2. Build both CSV exports (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] After a reset, campaign spring-sale-2026 shows 470 clicks: newsletter 342 and linkedin 128, or email 342 and paid-social 128.
- [ ] /spring's page shows the countries US 210, GB 61, CA 40 and DE 31, and 25 previews left out of the count.
- [ ] Filtering Links by campaign q4-launch shows /flyer and /q4-podcast only.
- [ ] The links export lists all five links with their UTM values, owner and counted clicks and scans; the clicks export for the last 30 days has one row per link per day with clicks.

### Phase 4: Reminders, digest and safeguards

```
Using the Link Shortener blueprint above, build Phase 4 only.

1. Build the daily job with the expiry reminder and the Monday digest (section 10), and the Outbox screen.
2. Add the QR confirmation in R4 and archiving in R8.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] After a reset, running the daily job emails Chris once that /q4-podcast expires on Oct 18; running it again sends nothing more.
- [ ] Moving the clock to Monday and running the job puts a digest for Maya and Chris in the outbox with each of their links' counted clicks and scans for the previous week, and none for Sana.
- [ ] Changing /flyer's destination to another domain asks for confirmation because it was scanned in the last 30 days.
- [ ] Archiving /flyer makes it return the 404 page; links with counted clicks have no Delete action, and a direct delete request is refused.

## 16. Variations

- A small API so other tools can create links with your UTM rules.
- Split traffic between two destinations to test a page.
- Several short domains, one per brand.
- Send counted clicks to your analytics tool as events.
- A browser bookmarklet that opens New link with the current page as the base URL.
