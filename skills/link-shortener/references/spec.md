<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/link-shortener . The page has a labelled drawing, build-or-buy notes and the build-test results. Free to copy and adapt for your own team. -->
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
- Recording a click must not slow the redirect: write it after responding (a deferred write, queue or background job). A failed write is logged and never changes the redirect; queued clicks are written before the app shuts down.
- Privacy: no cookies on redirects and no stored IP addresses (R7). Country comes from your host's geolocation header when it provides one (such as CF-IPCountry or X-Vercel-IP-Country, configurable); XX or an invalid value is stored as empty.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | Marketing lead | Everything: settings, users, sources, mediums, presets, campaigns, and every link. |
| Member | Everyone else on the team | Create links, edit and archive their own links, create campaigns, see every link and every report. |
| Visitor | Anyone who clicks | Follow links. |

The server enforces these permissions, not only the screens. Team members sign in with any method that proves they own an address at Settings.email_domain: the platform's built-in auth, Google sign-in, or a one-time link sent through the outbox that expires after 15 minutes and is used only when the person presses Sign in (so link previews can't use it up). Anyone whose address doesn't match an active User, including a deactivated user, sees "Ask an admin to add you."; deactivating someone ends their sessions.

## 5. Data model

All IDs are strings. Timestamps in UTC.

**Settings** (one row): short_domain (short links are always https://short_domain/slug), main_site_url (the root redirect and the not-found page's link), expired_fallback_url, allowed_destination_domains (optional list), time_zone, email_domain (the only domain team members sign in with), app_name (the name in email subjects and page titles).

**User**: id, name, email (unique, lowercase), role: admin | member, active.

**UtmValue**: id, kind: source | medium, value (lowercase letters, digits and hyphens), active.

**Preset**: id, name, source, medium, content (optional).

**Campaign**: id, value (such as spring-sale-2026, unique), name, owner_id, archived.

**Link**
- id, slug (unique, the back-half), title, base_url, utm_source, utm_medium, campaign_id, utm_term, utm_content, destination_url (base URL with UTM parameters applied)
- owner_id, created_at, expires_at (optional), status: active | expired | archived, notes

**LinkChange** (append-only): id, link_id, at, user_id, field, old_value, new_value.

**Click** (append-only): id, link_id, at, kind: click | scan | preview | bot | expired, counted (false for repeats, R6), country (two letters or empty), referrer_domain (the Referer's host name, lowercased and without www., from http or https referrers only; or empty), visitor_hash.

**Event** (append-only) and **Notification** (outbox): id, at, actor, type, data; and id, at (when it was queued), kind, to_email, subject, body, status: queued | sent | failed | logged, error.

## 6. Building the destination

The destination is the base URL plus utm_source, utm_medium, utm_campaign, and utm_term and utm_content when given, in that order. Other query parameters stay where they are, exactly as typed (not re-encoded); a #fragment stays at the end. Values are lowercased automatically and spaces become hyphens. Source and medium must be on the allowed lists, and the campaign must be an existing campaign. If the base URL already has UTM parameters (any parameter starting utm_, in any case), they are removed and replaced, with a warning; the link still saves, and the cleaned base URL is stored.

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
| Any method other than GET or HEAD | 405 | nothing |

Slugs match without regard to case or a trailing slash: /Spring/ is /spring. Requests are classified in this order: expired, then preview, then bot, then scan or click; user agents match without regard to case. Only qr=1 has a meaning: other parameters on a short link are dropped, and qr with any other value is a normal click. A path that isn't a single slug-shaped segment, including reserved words, gets the 404 page.

## 8. Business rules

- **R1. Slugs.** 3 to 50 characters: lowercase letters, digits and hyphens, unique. Reserved words are refused: admin, api, auth, login, logout, qr, static, assets, health, robots.txt, favicon.ico. Refusals read "Slugs must be 3 to 50 characters.", "Slugs can use only lowercase letters, digits and hyphens." and "admin is a reserved word. Choose another slug." (with the slug typed). A typed slug is lowercased and leading or trailing slashes are removed before these checks, so "/Spring/" is checked as spring. A slug can change only until its link has a counted click or scan at any time (previews, bots and expired requests don't count); after that it is permanent, because it may be printed, and a change is refused with "This slug is permanent because the link has counted clicks or scans (it may already be printed)."
- **R2. Destinations.** http or https only, at most 2,000 characters for the final URL including its UTM tags ("Links can be at most 2,000 characters, including UTM tags."), and inside allowed_destination_domains when that list is set (a listed domain or any subdomain of it; an empty list allows every domain).
- **R3. UTMs** are built as in section 6. Source and medium values come only from the active lists; term and content are lowercased, with spaces turned into hyphens.
- **R4. Destination changes.** No limit. Every edit, from Phase 1 on, writes one LinkChange per changed field with the old and new values, and the next click uses the new destination. If the new destination is on a different domain (host names compared without regard to case or a leading www.; a subdomain counts as different) and the link had scans in the last 30 days, ask for confirmation: "This link is in a QR code that was scanned 12 times in the last 30 days." (with the real number of counted scans in the same 30-day window as Links; with none, there is no question). Pressing "Yes, change the destination" saves the change.
- **R5. Expiry.** Expiry is entered as a date and time in the Settings time zone; a new or changed expiry must be in the future ("Choose an expiry in the future."). At expires_at the link redirects to the expired fallback; its stored status becomes expired on the next request, page load or minute check, recorded as an event by system. The owner is emailed once, by the first daily job run when the link expires within the next 72 hours (so a link given a 2-day expiry still gets one); the subject's date is in team time, and changing the expiry allows a new reminder.
- **R6. Counting.** Counted clicks and scans exclude previews, bots, expired requests and repeats: the same visitor on the same link within 30 seconds of that visitor's last counted click or scan on it (clicks and scans count alike, so a scan and then a tap is one). Reports use counted clicks and scans only, and show previews separately.
- **R7. Privacy.** visitor_hash is SHA-256 of a daily random salt plus IP address plus user agent. The salt is replaced at midnight in the Settings time zone (by the app clock) and the old one is discarded; it is kept only in memory, so hashes cannot be traced back or joined across days. IP addresses are never stored. The IP is the connection's address, or X-Forwarded-For only when the app runs behind a proxy you trust (TRUST_PROXY).
- **R8. Ownership.** Members edit and archive only their own links; admins can edit any link. A link with counted clicks or scans is archived, never deleted. Because R9 keeps every click and change, only a link with no clicks of any kind and no change history can be deleted; any other delete request is refused (409). The owner or an admin can restore an archived link; it becomes active, or expired if its expiry has passed. An archived link returns the 404 page and keeps its slug, history and reports; it gets no reminders, and its earlier clicks still count in digests.
- **R9. Events.** Every change writes an event; events, changes and clicks are never edited or deleted.

## 9. Screens

1. **Links** (home): search by slug, title or destination; filter by campaign, owner, source, medium and status. Each row: short link with a copy button, title, destination host, campaign, counted clicks and scans in the last 30 days (today and the 29 days before it, in the Settings time zone, up to now; every screen uses the same window), owner.
2. **New link** and **Edit link**: base URL, slug (suggested from the title), preset, source, medium, campaign, term, content, title, expiry, notes, with a live preview of the final URL and the QR code (the QR preview arrives with QR codes in Phase 2; Phase 1 shows a placeholder). Title, base URL, source, medium and campaign are required; a blank slug takes the suggestion from the title, with -2, -3 and so on if it's taken. Source and medium are typed, with the allowed values suggested, so a value off the list is refused with section 6's message; choosing a preset fills source, medium and content.
3. **Link page**: the short link, copy, QR code download (PNG at 1,024 pixels and SVG), destination, change history, a daily chart of counted clicks and scans (30 or 90 days) and, for the same period, top countries and referring sites and the number of previews left out (bots, repeats and expired requests are shown too, on a smaller line). Top lists show 10 rows and sum the rest; a missing country shows as Unknown and a missing referrer as No referrer.
4. **Campaigns**: each campaign with its links and their counted clicks and counted scans, shown separately and as a total, broken down by source and medium, for the last 30 days by default (90 days and all time can be chosen). Archived campaigns and campaigns with no links are listed too.
5. **Sources and mediums**, **Presets**, **Users** and **Settings** (admins), and **Outbox**. Users are never deleted, only deactivated; admins can't demote or deactivate themselves, there is always at least one active admin, and new users need an address at the email domain. Sources and mediums can be added and turned on or off but not renamed or deleted; presets can be edited and deleted, because links copy their values.
6. Public: the redirect, the not-found page and the root redirect.

## 10. Notifications

| Trigger | Recipient | Subject |
|---|---|---|
| Link expires in 3 days | Owner | "go.northwind.example/q4-podcast expires on Oct 18" |
| Monday 08:00 in the Settings time zone (any run from Monday 08:00 until Tuesday 08:00 sends it, so a daily job at any fixed time sends it once) | Each active user whose links had counted clicks or scans in the previous Monday 00:00 to Sunday 24:00, team time (credited to each link's current owner, whatever the link's status; deactivated users get none) | "Your links last week: 2 links, 34 clicks", with ", 5 scans" added when there were scans; the link count covers links with counted clicks or scans that week, and the body lists each link's counted clicks and scans for that week |
| User added | The new user | "You've been added to Northwind links" |

Write every email to the outbox first, then send it. Admins see every email in the Outbox and members see their own; in production, sign-in links are never shown there. With no provider configured, set status logged. A daily job (protected by a CRON_SECRET header: /api/cron/daily, GET or POST, with the secret in Authorization: Bearer or X-Cron-Secret; turned off when CRON_SECRET isn't set) sends reminders and digests, and is safe to run twice: each link gets one reminder per expiry date and each user one digest per week, even if two runs overlap.

## 11. Time

All "now" reads go through one function that adds the development clock offset, so expiry, reminders, the 30-second repeat window and digests can be tested. The development clock can be moved forward or set to any date and time; sign-in sessions and sign-in links expire on real time, and production ignores the offset.

## 12. QR codes and export

- QR codes encode the short link with ?qr=1, so scans are counted separately from clicks. Use a standard library; error correction level M, the smallest version that fits and a 4-module quiet zone; downloadable as SVG and as a 1,024-pixel PNG. Any signed-in team member can download any link's codes.
- **Links export** (CSV): short link, title, destination, source, medium, campaign, term, content, owner, created, status, counted clicks, counted scans (both of all time). The short link is the full https:// address, campaign is its value, owner is the owner's name, created is YYYY-MM-DD HH:MM in team time, and an empty term or content is blank.
- **Clicks export** (CSV) for a date range: date, slug, counted clicks, counted scans, previews. Both exports follow the current Links filters; with none, every link is included, archived and expired ones too. A clicks export row exists for each link and day with a counted click, counted scan or preview; rows are sorted by date, then slug. Dates are whole days in team time, both ends included, at most 731 days; a malformed range or a start after the end is refused with a message. Files are UTF-8 with standard quoting, and a text cell starting with =, +, - or @ gets a leading apostrophe so spreadsheets don't run it.

## 13. Edge cases

- Two people choose the same slug at the same moment: one succeeds and the other is told it is taken.
- A base URL with spaces or without a scheme: add https:// and encode it; refuse it if it still doesn't parse. "//host" becomes https://host; any other scheme is refused with "Links must start with http:// or https://.", and a host without a dot (other than localhost) or a user name or password in the URL is refused.
- A campaign is archived: its links keep working; it is no longer offered for new links.
- A source or medium is deactivated: existing links keep it; new links cannot use it. An edited link may keep a deactivated source or medium, or an archived campaign, only while that field is unchanged.
- A link's owner is deactivated: the link stays and an admin can reassign it. Its expiry reminders go to the active admins.
- A visitor with no user agent: counted as a click (some apps send none).
- An expired link's expiry is cleared or moved later: it becomes active again, recorded in its history.

## 14. Seed data

Company Northwind, a B2B software company. Short domain go.northwind.example, email domain northwind.example, app name "Northwind links", main site https://northwind.example, expired fallback https://northwind.example, time zone America/New_York. Dates are relative to today; the examples assume today is Thursday, October 15, 2026.

Users (emails firstname@northwind.example): Maya Lopez (admin, marketing lead), Chris Doyle (member, content), Sana Iqbal (member, events).

Sources: facebook, google, linkedin, newsletter, partner, podcast, print. Mediums: email, social, paid-social, cpc, referral, qr, audio.

Presets: Newsletter (newsletter, email), LinkedIn post (linkedin, social), LinkedIn ads (linkedin, paid-social), Print (print, qr).

Campaigns: spring-sale-2026 "Spring sale 2026" (Maya), webinar-may-2026 "Webinar May 2026" (Sana), q4-launch "Q4 launch" (Chris).

Link titles and created dates: /spring "Spring sale pricing (newsletter)", 40 days before the seed day; /spring-li "Spring sale pricing (LinkedIn ads)", 39 days before; /flyer "Q4 launch flyer", 35 days before; /q4-podcast "Q4 launch podcast ad", 34 days before; /webinar-may "May webinar registration", 45 days before it expired.

| Link | Destination base | UTMs | Owner | Counted in the last 30 days |
|---|---|---|---|---|
| /spring | https://northwind.example/pricing | newsletter, email, spring-sale-2026 | Maya | 342 clicks (US 210, GB 61, CA 40, DE 31), plus 25 previews |
| /spring-li | https://northwind.example/pricing | linkedin, paid-social, spring-sale-2026, content carousel-a | Maya | 128 clicks |
| /flyer | https://northwind.example/demo | print, qr, q4-launch | Chris | 57 scans and 3 clicks |
| /q4-podcast | https://northwind.example/launch | podcast, audio, q4-launch; expires in 3 days (Oct 18 in the examples) | Chris | 19 clicks |
| /webinar-may | https://northwind.example/webinars/may | newsletter, email, webinar-may-2026; expired 136 days before the seed day (Jun 1 in the examples) | Sana | none (88 clicks in the 30 days before it expired, all older than 30 days) |

Spread the seed clicks and scans evenly over the last 28 days, so they all stay inside the 30-day window. No seed click or scan has a referring site, only /spring's clicks have countries, and seed visitor hashes are placeholders. None of the seed links has a change history yet. Reset to seed data also sets the development clock to 09:00 on the seed day in the team time zone. Reset deletes and reloads all data, history included: the one development-only exception to R9. The seed users keep their IDs, so a signed-in tester stays signed in.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation and the link builder

```
Using the Link Shortener blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly, with a real database.
2. Add sign-in under /admin with the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active User; anyone else sees "Ask an admin to add you."
3. Build Links, New link and Edit link (section 9, screens 1 and 2) with R1 to R3 and R8's ownership rule (archiving comes in Phase 4), and the admin screens in screen 5, plus a simple Campaigns list where anyone can add a campaign and its owner or an admin can archive or restore it (the Campaigns report is Phase 3), all enforced on the server. Do not build redirects yet.
4. Load the seed data from section 14, with dates relative to today, including the clicks.
5. Add a "sign in as" switcher, a "move the clock forward" control and a "reset to seed data" button (which also sets the clock to 09:00 on the seed day, team time; section 14), all visible only in development.

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
2. Build QR codes (section 12) and destination changes with history (R4), and expiry (R5) without the email. Start the Link page (screen 3) with the short link, QR downloads, destination and change history; its charts come in Phase 3.

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
- [ ] After a reset, running the daily job emails Chris once that /q4-podcast expires in 3 days ("expires on Oct 18" in the examples); running it again sends nothing more.
- [ ] Moving the clock to the next Monday at 08:00 or later (team time) and running the job puts a digest for Maya and Chris in the outbox with each of their links' counted clicks and scans for the previous week, and none for Sana.
- [ ] Changing /flyer's destination to another domain asks for confirmation because it was scanned in the last 30 days.
- [ ] Archiving /flyer makes it return the 404 page; links with counted clicks have no Delete action, and a direct delete request is refused.

## 16. Variations

- A small API so other tools can create links with your UTM rules.
- Split traffic between two destinations to test a page.
- Several short domains, one per brand.
- Send counted clicks to your analytics tool as events.
- A browser bookmarklet that opens New link with the current page as the base URL.

## 17. Build notes from our test build

We built this blueprint by sending the four phase prompts above, in order, to an AI builder (Claude, working in Type, with a fresh session for each phase that saw only this spec and the code so far), then checked every acceptance item in a real browser, resetting to the seed data before each phase's checks. Where a check says something is refused, the person saw the reason on screen and a direct request got an error with nothing changed. Short links were opened from separate browser contexts with no cookies (one with Slack's link-preview user agent), the QR codes were downloaded and decoded, the CSV exports were downloaded and parsed, and emails were read on the Outbox screen.

**Result:** 19 of 19 acceptance checks passed in one final browser run on a fresh database, plus 151 automated tests. The item-by-item results are in [acceptance-results.json](/builds/link-shortener/acceptance-results.json).

**Gaps the build found, now fixed in this spec:**
1. Sign-in was limited to "our company email domain", but no setting held the domain. Settings now has email_domain (northwind.example in the seed).
2. "Built-in auth or Google sign-in" didn't say what counts when neither is available. Section 4 now accepts any method that proves the address, including a 15-minute one-time link sent through the outbox that is used only when the person presses Sign in, so link previews can't use it up.
3. It wasn't clear when "Ask an admin to add you." appears. Anyone whose address doesn't match an active user sees it, including a deactivated user, and deactivating someone ends their sessions.
4. The "You've been added to Northwind links" subject named an app that no setting held. Settings now has app_name, "Northwind links" in the seed.
5. Members may create campaigns from Phase 1, but the Campaigns screen arrived in Phase 3. Phase 1 now builds a simple Campaigns list where anyone adds a campaign and its owner or an admin archives or restores it.
6. Nothing protected the last admin or said whether users can be deleted. Users are never deleted, only deactivated; admins can't demote or deactivate themselves, there is always an active admin, and new users need an address at the email domain.
7. The admin screens didn't say what can be changed. Sources and mediums can be added and turned on or off but not renamed or deleted; presets can be edited and deleted, because links copy their values.
8. "Expired Jun 1" was a fixed date in a seed that is otherwise relative to today, and the 88 old clicks had no dates. /webinar-may now expired 136 days before the seed day (Jun 1 in the examples), with its 88 clicks in the 30 days before that.
9. The seed gave no link titles, campaign names or created dates. It now gives all three.
10. Only /spring's clicks had countries, and nothing said what the other seed clicks carry or whether any have a referring site. No seed click or scan has a referring site, only /spring's have countries, and seed visitor hashes are placeholders.
11. A reset deletes history that R9 says is never deleted. Reset is now the one development-only exception to R9, and the seed users keep their IDs so the tester stays signed in.
12. The development clock's controls and its effect on sessions weren't defined. It can be moved forward or set to any date and time; sessions and sign-in links expire on real time, and production ignores the offset.
13. Screen 2 promised a QR preview while QR codes are Phase 2. Screen 2 now says Phase 1 shows a placeholder.
14. No field was marked required and a blank slug had no rule. Title, base URL, source, medium and campaign are required; a blank slug takes the title's suggestion, adding -2, -3 and so on if it's taken.
15. Source and medium could be dropdowns, which would make the "fb" refusal impossible to try. They are now typed with the allowed values suggested, and choosing a preset fills source, medium and content.
16. Expiry had no time zone or limits. It is entered in the Settings time zone, and a new or changed expiry must be in the future ("Choose an expiry in the future.").
17. R4 recorded destination changes only, so it wasn't clear whether Phase 1 edits leave history. Every edit, from Phase 1 on, writes one LinkChange per changed field.
18. A check expected "the messages in section 6 or R1", but R1 gave no message for a reserved word or a bad slug. R1 now gives all three.
19. R1 didn't say whether a typed slug is cleaned up. It is lowercased and leading or trailing slashes are removed before the checks.
20. "Has a counted click or scan" didn't say over what period, or the refusal's wording. Any counted click or scan ever makes the slug permanent (previews, bots and expired requests don't), and R1 gives the message.
21. "Replaced, with a warning" didn't say which tags count or whether the link still saves. Any utm_ parameter, in any case, is removed; the link saves and the cleaned base URL is stored.
22. "Other query parameters stay where they are" didn't say whether they are re-encoded. They are kept exactly as typed.
23. The 2,000-character limit didn't say whether it covers the UTM tags. It applies to the final URL, with its message.
24. allowed_destination_domains didn't say whether subdomains pass. A listed domain or any subdomain of it passes, and an empty list allows every domain.
25. "Add https://" didn't cover //host, other schemes, hosts without a dot or URLs with a password. //host becomes https://host, and the rest are refused.
26. Editing a link whose source, medium or campaign was later turned off wasn't covered. An edited link keeps such a value only while that field is unchanged.
27. short_domain had no scheme, so the copied link could be http or https. Short links are always https://short_domain/slug.
28. The 30-second window didn't say what it counts from or whether a scan and a click are the same visit. It counts from that visitor's last counted click or scan on the link, and the two count alike.
29. Section 7 didn't say which rule wins when a request is both, say, a preview and expired. Requests are classified expired, then preview, then bot, then scan or click, and user agents match without regard to case.
30. "Replaced every day" didn't say which day or where the salt lives. It changes at midnight in the Settings time zone and is kept only in memory.
31. R7 hashed "IP address" without saying which one behind a proxy. It is the connection's address, or X-Forwarded-For only behind a proxy you trust.
32. "Your host's geolocation header" named no header. Section 3 now names CF-IPCountry and X-Vercel-IP-Country (configurable) and stores XX or an invalid value as empty.
33. referrer_domain had no format. It is the Referer's host name, lowercased and without www., from http or https referrers only.
34. Other query parameters on a short link, and qr with another value, weren't covered. Only qr=1 means anything; other parameters are dropped and qr=2 is a normal click.
35. Paths with several segments or a reserved word had no rule. Anything that isn't a single slug-shaped segment gets the 404 page.
36. Section 7 covered GET and HEAD only. Any other method now gets 405.
37. A click write that fails after the response had no rule. It is logged and never changes the redirect, and queued clicks are written before the app shuts down.
38. "Becomes expired" didn't say when the stored status changes or who the event's actor is. Redirects switch at expires_at; the status follows on the next request, page load or minute check, recorded as an event by system.
39. Nothing said whether an expired link can come back. Clearing its expiry or setting a later one makes it active again.
40. Section 12 gave no QR version, quiet zone or access rule. Codes use the smallest version that fits and a 4-module quiet zone, and any signed-in team member can download any link's codes.
41. "The last 30 days" could be a rolling 720 hours or calendar days, and Phase 1 and Phase 3 chose differently. It is now today and the 29 days before it in the Settings time zone, on every screen.
42. The change history that Phase 2 needed lives on the Link page, whose charts are Phase 3. Phase 2 now starts the Link page with the short link, QR downloads, destination and history.
43. Campaigns had no period. It shows the last 30 days by default, with 90 days and all time to choose from.
44. "Counted clicks" on Campaigns didn't say whether scans are included, though the check's 470 is a total. Campaigns shows counted clicks and scans separately and as a total.
45. It wasn't said whether archived campaigns or campaigns with no links appear. Both are listed.
46. The Link page didn't say which period the countries, referring sites and previews cover. They follow the chart's 30 or 90 days.
47. "Previews left out" ignored the bots, repeats and expired requests that R6 also leaves out. Those are shown too, on a smaller line.
48. "Top countries" had no length or labels for missing values. Top lists show 10 rows and sum the rest; a missing country is Unknown and a missing referrer is No referrer.
49. The links export's counted clicks and scans had no period, so /webinar-may could be 0 or 88. They are of all time.
50. The exports didn't say whether they follow the Links filters. Both do; with none, every link is included, archived and expired ones too.
51. The links export gave columns but no formats. The short link is the full https:// address, campaign its value, owner the name, created YYYY-MM-DD HH:MM in team time, and empty term or content blank.
52. "One row per link per day" didn't say which days get a row. A link has a row for a day with a counted click, counted scan or preview, sorted by date, then slug.
53. The clicks export's date range had no rules. Dates are whole days in team time, both ends included, at most 731 days, and a malformed range or a start after the end is refused.
54. Link titles and notes in a CSV could run as spreadsheet formulas. Files are UTF-8 with standard quoting, and a cell starting with =, +, - or @ gets a leading apostrophe.
55. Phase 1 asked for R8, whose archiving comes in Phase 4. Phase 1 now builds R8's ownership rule only.
56. Notifications had no time, so the Outbox couldn't show when an email was queued. Notification now has at.
57. A daily job couldn't know whether "Monday 08:00" had passed in its run. A run from Monday 08:00 until Tuesday 08:00 team time sends the digest, so a daily job at any fixed time sends it once.
58. "The previous Monday to Sunday" had no boundaries or owner rule. It runs Monday 00:00 to Sunday 24:00 team time, credited to each link's current owner; deactivated users get none.
59. The digest subject had no place for scans. It adds ", 5 scans" when there were scans, and its link count covers links with counted activity that week.
60. "Emailed 3 days before" didn't fit a daily job or a link made with a 2-day expiry. The first run with the expiry less than 72 hours away sends it once, and changing the expiry allows a new one.
61. A deactivated owner's expiry reminder had nowhere to go. It goes to the active admins.
62. "Safe to run twice" didn't say what must not repeat. Each link gets one reminder per expiry date and each user one digest per week, even if two runs overlap.
63. "Protected by a CRON_SECRET header" named no endpoint or header. It is /api/cron/daily, GET or POST, with the secret in Authorization: Bearer or X-Cron-Secret, and off when CRON_SECRET isn't set.
64. The Outbox had no rule on who sees which email. Admins see every email and members their own, and in production sign-in links are never shown there.
65. "A different domain" didn't say how hosts compare. Host names compare without regard to case or a leading www., and a subdomain counts as different.
66. The R4 question quoted "12 times" without saying which scans it counts or how to answer. It shows the real number of counted scans in the same 30-day window as Links, and "Yes, change the destination" saves it.
67. R8 implied that links without counted clicks can be deleted, while R9 keeps every click and change forever. Only a link with no clicks of any kind and no history can be deleted, and any other delete request is refused with 409.
68. Archiving had no undo. The owner or an admin can restore an archived link, which becomes active, or expired if its expiry has passed.
69. Nothing said what else archiving changes. An archived link keeps its slug, history and reports, gets no reminders, and its earlier clicks still count in digests.

**What we did not test:**
- Production sign-in. Company-domain one-time sign-in links were built, but every check used the development "sign in as" switcher.
- Sending email. Expiry reminders, digests and welcome emails were logged in the outbox, not delivered.
- The daily job on a real scheduler. It was run from the development control with the development clock; the cron endpoint was only checked by hand for its secret.
- Hosting on a real short domain. The checks ran on localhost, so https, the host's country header (countries came only from the seed) and a trusted proxy's X-Forwarded-For were not exercised.
- Redirect speed under load, and the deferred click write with many visitors at once.
- Phone cameras. The QR codes were decoded by software from the PNG and from the SVG rendered in a browser, not scanned from paper.
- Spec fixes that no acceptance check covers, such as 405 answers, CSV formula guarding, restoring an archived link and a deactivated owner's reminders. The test build handles them through its own choices.
