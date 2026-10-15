<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/testimonial-wall . The page has the drawing, a live demo, build-or-buy notes and test results. Free to copy and adapt for your own team. -->

# Testimonial Wall

Blueprint BP-005 · Department: Marketing · Replaces: Senja (testimonial collection and walls), quotes kept in email threads, call notes and screenshots
For teams of 1 to 10 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 15 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"Our best customer quotes are buried in emails and call notes."

A customer writes "this saved us a week every month" in a support reply, or says it on a renewal call. Someone pastes it into Slack. Months later marketing wants it for the homepage: nobody can find it, nobody knows whether the customer agreed to be quoted by name, and when the customer asks to be taken down, nobody knows where it appears.

v1 is small: a public form customers fill in themselves (or a personal link pre-filled with what they already said), a permission checkbox whose exact wording is kept, a review queue, and one wall, as a public page and an embed, that only ever shows quotes with current permission.

## 2. What the real product does

Research basis: Senja's pricing page and help center (senja.io/pricing, support.senja.io/what-do-approved-and-unapproved-mean-rfswt, and the help center collections support.senja.io/collect-testimonials-jwfc3, support.senja.io/manage-testimonials-h516k and support.senja.io/share-testimonials-p1slv), October 2026.

Senja runs one loop: collect, approve, share.

1. **Collection.** A simple or multistep form collects text and video testimonials. Customers can be invited one at a time or in bulk, with follow-ups.
2. **Import.** Testimonials left elsewhere (text, video, screenshots) can be imported. The pricing FAQ names 35 sources, including X, Facebook, Google, Capterra and Trustpilot.
3. **Approval.** Every testimonial is approved or unapproved, and only approved ones can be used in widgets and Walls of Love. Each form either approves new testimonials automatically or leaves them for manual review. Web, spreadsheet and manual imports are approved by default. Unapproved testimonials can still be shared as a link.
4. **Managing.** Search, filters and tags. Help articles cover editing a testimonial, showing part of a long one, anonymous or initials-only display, removing a customer's email, and finding testimonials "with public or private consent".
5. **Sharing.** Every plan has unlimited widgets (over 20 templates, added to a site without code), unlimited Walls of Love (a shareable page with a call to action) and view and click analytics. A widget or Wall of Love set to auto-add picks up newly approved testimonials, including where it is embedded. Paid plans add custom domains and your own branding; Pro adds star-rating rich snippets for search results.
6. **Extras.** Rewards for customers who leave a testimonial, AI analysis and case studies, translation (Pro), video reels, Zapier, an API and webhooks (Starter and up).

Pricing on senja.io/pricing, monthly billing: Free is $0 with 15 testimonials (newer ones are hidden until you upgrade). Starter is $29 per month with unlimited testimonials, 3 forms, 1 project and 2 seats. Pro is $59 per month with unlimited forms, 5 projects and 5 seats (extra seats $5, extra projects $10 per month). Yearly billing gives 2 months free.

### What this blueprint keeps

A public text form with an optional star rating, personal invitations with one reminder, a manual review step (Senja's approved gate, split here into approve and publish), one public wall plus an embed, a featured quote, rating filters and CSV export. It also makes three things explicit that matter when you publish customers' names: the exact permission wording each customer agreed to, a private link where customers withdraw permission themselves, and a history of every decision.

### What this blueprint deliberately leaves out

Video and reels, imports from review sites and social networks, automatic approval, editing or excerpting a customer's words, multiple forms and walls, widget templates, custom domains and branding, rewards, AI analysis, translation, widget analytics, rich snippets, Zapier, API and webhooks. These matter when testimonials are a large program across several products and channels. A team of 1 to 10 people collecting a few dozen text quotes for one website does not need them in v1. If video, or importing reviews you already have, is the point, use Senja: its free plan includes both, up to 15 testimonials.

## 3. Scope of v1

- One company, one collection form, one wall (a public page plus an embed for your website).
- Text testimonials with an optional 1 to 5 star rating. No photos, logos or video; cards show initials.
- Customers never sign in. They use the form, a personal invitation link, or the private link they get after submitting.
- Email goes through an outbox (section 11). With no provider configured, emails are logged instead of sent.
- The form, the wall and the queue work on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Customer | Anyone with the form link or an invitation link. No account | Submit a testimonial. See its status and withdraw permission on their private page |
| Member | Anyone on the team | See every testimonial, its history and the wall preview. Create invitations and cancel their own. Copy the embed code |
| Moderator | Whoever owns the website copy, usually 1 or 2 people | Everything a member can, plus approve, reject, publish, unpublish, feature, record a withdrawal, cancel any invitation |
| Admin | One or more people | Everything a moderator can, plus manage people and settings, read the outbox, export CSV, delete rejected or withdrawn testimonials |

Every staff member sees every testimonial. Only the actions are restricted, and the server checks them on every request. The form, the thank-you page, the private page, the wall and the embeds are the only pages without sign-in.

## 5. Data model

All timestamps are UTC. IDs are strings (UUID or similar). Text lengths are counted after trimming. Tokens come from a cryptographically secure generator: at least 24 URL-safe characters, unique.

**Person** (staff only)
- id, name (required), email (required, unique, lowercase), active (boolean, default true), created_at
- role: member | moderator | admin

**Settings** (one row)
- company_name and wall_title (required, max 80 each), form_intro (required, max 500)
- permission_text (required, 20 to 500 chars): the sentence next to the permission checkbox
- permission_version (integer, starts at 1, +1 each time permission_text changes)
- form_open (boolean, default true), time_zone (IANA name, default "America/New_York"; for dates in emails and on public pages)

**Testimonial**
- id, submitted_at, updated_at
- name (required, 2 to 80 chars), email (required, valid, max 254, never public)
- company, job_title (optional, max 100 each; job_title is labelled "Role" on the form)
- quote (required, 20 to 1,000 chars; plain text, line breaks kept, never rendered as HTML)
- rating (nullable integer 1 to 5; null means no rating, never zero stars)
- consent (boolean; true only when the customer ticked the box)
- consent_text (the exact sentence the customer agreed to; empty when not given), consent_version (nullable integer), consent_at (nullable), withdrawn_at (nullable)
- status: pending | approved | rejected | published | withdrawn; featured (boolean, default false)
- source: form | invitation; invitation_id (nullable); manage_token (for the customer's private link)
- review_note (nullable, max 300, private), reviewed_by_id, reviewed_at (nullable)
- published_at (nullable; the most recent publish)

**Invitation**
- id, token, created_by_id (references Person)
- name (required, 2 to 80), email (required), company, job_title (optional): used to pre-fill the form
- prefill_quote (optional, max 1,000): the words the customer already used
- source: email | call | chat | other, source_note (optional, max 300, private)
- status: open | completed | cancelled | expired
- created_at (the email is queued then), expires_at (created_at + 14 days), reminded_at, completed_at (nullable)
- testimonial_id (nullable; the testimonial it produced)

**Event** (append-only history; never copies the customer's quote, email or name)
- id, testimonial_id (nullable), invitation_id (nullable), created_at
- actor_type: person | customer | system, actor_id (when a person)
- type: submitted | approved | rejected | published | unpublished | featured | unfeatured | withdrawn | deleted | invitation_created | invitation_completed | invitation_reminded | invitation_cancelled | invitation_expired | settings_changed
- note (nullable; review or withdrawal note), data (JSON, nullable; e.g. old and new permission_version)

**Notification** (the outbox)
- id, to_email, person_id (nullable, for staff), testimonial_id, invitation_id (nullable)
- kind: submission_received | new_submission | invitation | invitation_reminder | published | withdrawal_confirmed | withdrawn_alert
- subject, body (plain text)
- status: queued | sent | logged | failed, created_at, sent_at, error

**FormAttempt** (rate limiting): id, ip_hash (SHA-256 of the IP plus a server secret; never the raw IP), created_at.

## 6. The collection form and consent

The form is at `/share`. An invitation link, `/share/<invitation token>`, shows it pre-filled (section 12).

**Fields**, under Settings.form_intro: Your name (required); Email (required, with the help text "Private. We use it to confirm your submission and send you a link to withdraw permission."); Company; Role; Rating (No rating by default, or 1 to 5 stars); Your words (required, with a character counter); and a checkbox, never pre-ticked, labelled with Settings.permission_text. Under it: "If you tick the box, we may show your words, rating, name, role and company on our website. We never show your email. If you leave it unticked, only our team will read it." Hidden: permission_version, and a honeypot field named `website` that people and screen readers never see.

**On submit, the server:**
1. Refuses with "We're not collecting testimonials right now." if form_open is false, unless this is an open invitation link.
2. Shows the normal thank-you page and saves nothing if `website` is filled in.
3. Refuses with "Too many submissions from your network. Please try again in an hour." if this IP hash has 5 FormAttempts in the last 60 minutes.
4. Validates every field (section 5), e.g. "Please write at least 20 characters." On error it shows the form again with the customer's input and each error next to its field.
5. If the box is ticked but permission_version is not current, refuses with "Our permission wording changed while you were writing. Please read it again and tick the box.", keeping the input, showing the new wording and unticking the box.
6. In one transaction, creates the testimonial: pending, not featured. If ticked: consent true, with consent_text, consent_version and consent_at from the current wording and time. If not: consent false and those fields empty. It generates manage_token, completes the invitation if there is one (source invitation), records a FormAttempt, writes the events and queues the emails in section 11.
7. Shows the thank-you page: "Thank you, Cy. We've received your words.", then "Nothing goes on our website until our team has reviewed it." or "You didn't give permission to publish, so only our team will read this.", then "Keep this link to check the status or withdraw permission at any time:" with `/t/<manage_token>`. The confirmation email has the same link.

**The private page** (`/t/<manage_token>`) shows the customer's words, name, role, company, rating and date sent, and the first status line that matches:

| Testimonial | Status line |
|---|---|
| withdrawn | "You withdrew permission on 14 Oct 2026. It is not shown on our website." |
| consent false | "You didn't give permission to publish this, so only our team can read it." |
| pending | "Waiting for review." |
| approved | "Approved. Not on our website yet." |
| published | "On our website since 12 Oct 2026.", with a link to the wall |
| rejected | "We won't publish this one. Thank you for sending it." |

When consent is true the page also has **Withdraw permission**. It asks "Withdraw permission? Your words will be removed from Northwind's website right away. To share them again you would need to send them again." and then applies R8. Staff notes and other testimonials never appear here. An unknown token shows "This link is not valid."

Seed permission wording, version 1: "I give Northwind permission to publish this quote, rating, name, role and company on its website. I can withdraw permission at any time." Have your organization review its own wording; this blueprint is a product design, not legal advice.

## 7. Lifecycle

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Submit | Customer | (none) | pending | Section 6. Event `submitted`. Emails: submission_received, new_submission |
| Approve | Moderator, admin | pending | approved | Needs consent (R4). Optional note. Event `approved` |
| Reject | Moderator, admin | pending | rejected | Note required (R4). Event `rejected`. No email |
| Publish | Moderator, admin | approved | published | R5. Sets published_at. Event `published`. Email: published |
| Unpublish | Moderator, admin | published | approved | Clears featured. Event `unpublished` |
| Feature | Moderator, admin | published | published | Clears the previous featured one in the same transaction (R7). Event `featured`, and `unfeatured` on the previous one |
| Unfeature | Moderator, admin | published | published | Event `unfeatured` |
| Withdraw | Customer, on the private page | any but withdrawn, while consent is true | withdrawn | R8. Event `withdrawn`. Emails: withdrawal_confirmed, withdrawn_alert |
| Record withdrawal | Moderator, admin | same as Withdraw | withdrawn | Note required, 5 to 300 chars, saying how the customer asked. Otherwise as Withdraw |
| Delete | Admin | rejected, withdrawn | (deleted) | R14 |

Rejected and withdrawn testimonials can never be approved or published again.

Invitations start open and end completed (the customer submits through the link), cancelled (by its creator, a moderator or an admin) or expired (section 12). Every change writes an event.

### Worked examples: actions shown to a moderator (seed data)

| Seed testimonial | Status, consent | Actions |
|---|---|---|
| Cy Patel | pending, given | Approve, Reject, Record withdrawal |
| Lee Hart | pending, not given | Reject. Approve is disabled: "No permission to publish" |
| Omar Haddad | approved, given | Publish, Record withdrawal |
| Ana Moreno | published, featured | Unpublish, Unfeature, Record withdrawal |
| Ben Adler | published | Unpublish, Feature, Record withdrawal |
| Felix Wong | rejected, given | Record withdrawal (admins also: Delete) |
| Kai Jensen | withdrawn | None (admins: Delete) |

Members see no action buttons.

## 8. Business rules

- **R1.** The server decides status and consent. A new testimonial is always pending and not featured, and its consent fields come only from the checkbox.
- **R2.** Only the customer gives permission. The box is never pre-ticked, not even on invitation links. Nothing on the staff side sets consent to true, and staff cannot type in a testimonial: to capture a quote from an email or a call, send an invitation.
- **R3.** Customer wording is never edited. No staff action changes name, email, company, job_title, rating, quote or consent fields. To shorten a quote, invite the customer with the shorter wording pre-filled; the new submission gets its own permission.
- **R4.** Only pending testimonials can be approved or rejected. Approve requires consent = true, otherwise the server refuses with "No permission to publish." Reject requires a note of 5 to 300 characters; an approval note is optional, max 300.
- **R5.** Approval is not publication. Publish requires status approved, consent = true and no withdrawn_at, checked in the same transaction as the update.
- **R6.** Unpublish returns a testimonial to approved and clears featured. It can be published again.
- **R7.** At most one testimonial is featured, and only a published one. Featuring another clears the old one in the same transaction. Enforce it in the database too (a unique index on featured where featured is true, if your database supports partial indexes).
- **R8.** Withdrawal is allowed while consent = true and status is not withdrawn. In one transaction: consent = false, withdrawn_at = now, status = withdrawn, featured = false. Keep consent_text, consent_version and consent_at as evidence. It cannot be undone; to share again, the customer submits again.
- **R9.** The wall shows a testimonial only if status = published AND consent = true AND withdrawn_at is empty. The query checks all three, not just the status.
- **R10.** Public pages and embeds include only name, job_title, company, rating, quote and featured. Never email, notes, consent details, tokens or invitation details.
- **R11.** Every action writes one Event for each testimonial or invitation it changes. Events are never edited, and only Delete (R14) removes them.
- **R12.** Status checks and updates happen in one transaction. When two people act on the same testimonial, the second gets a message such as "Already published by Jo Park" and nothing changes.
- **R13.** Roles (section 4) are checked on the server. A member who calls the approve endpoint directly gets a 403.
- **R14.** Delete is admin only, for rejected or withdrawn testimonials. It removes the testimonial, its events, its outbox rows and its invitation, then writes one `deleted` event with the admin, the time and the old id. The private link then shows "This link is not valid."
- **R15.** Changing permission_text increases permission_version and writes a `settings_changed` event. Existing testimonials keep the consent_text they agreed to.
- **R16.** The form is protected by the honeypot, at most 5 saved submissions per IP hash per 60 minutes, and server-side checks of every limit.
- **R17.** An invitation produces at most one testimonial. Its link works only while it is open and before expires_at, even when form_open is false.
- **R18.** The wall is a selection, not a review site. It never shows a total count or an average rating, never says "all reviews", and says which ratings it shows when a minimum is set.

## 9. The wall and the embed

**Selection** (one pure function for the public wall, the embeds and the preview on screen 4):
1. Keep testimonials that pass R9.
2. With a minimum rating (4 or 5), keep only those rated at least that. Unrated testimonials appear only without a minimum.
3. Put the featured testimonial first (if still in the list), then the rest by submitted_at, newest first.
4. Embeds only: keep the first `limit`.

### Worked examples (fresh seed data, section 14)

Published in the seed: Ana Moreno (5 stars, featured, sent 40 days ago), Ben Adler (5, 30 days ago), Rosa Lind (no rating, 21 days ago), Hugo Brandt (4, 14 days ago), Theo Grant (3, 9 days ago).

| View | Shows, in order |
|---|---|
| `/wall` | Ana (featured), Theo, Hugo, Rosa, Ben |
| `/wall?min_rating=4` | Ana (featured), Hugo, Ben |
| `/wall?min_rating=5` | Ana (featured), Ben |
| `/embed/wall?min_rating=4&limit=2` | Ana (featured), Hugo |
| `/wall` after Jo approves and publishes Cy | Ana (featured), Cy, Theo, Hugo, Rosa, Ben |
| `/wall` after Jo features Ben | Ben (featured), Theo, Hugo, Rosa, Ana |
| `/wall` after Ana withdraws | Theo, Hugo, Rosa, Ben, nothing featured; `/embed/featured` is empty |

Never on the wall in the seed: Cy Patel (pending), Lee Hart (no permission), Omar Haddad (approved, not published), Felix Wong (rejected), Kai Jensen (withdrawn).

**Pages**
- `/wall`: heading Settings.wall_title, then "A selection of what our customers told us, shared with their permission." Filter links: All ratings, 4 stars and up, 5 stars (`?min_rating=4`, `?min_rating=5`). With a filter on: "Showing 4 and 5 star ratings only." or "Showing 5 star ratings only." With nothing to show: "No testimonials yet."
- `/embed/wall`: the same cards with no heading or filter links, on a transparent background. Parameters: `min_rating` (4 or 5; other values ignored) and `limit` (1 to 50, default 50). With a minimum, the same "Showing ..." line in small text under the cards. With nothing to show, it renders nothing.
- `/embed/featured`: only the featured testimonial, for a homepage; empty when nothing is featured.

**Cards**: the quote in quotation marks with its line breaks; stars with a text equivalent ("Rated 4 out of 5"), or nothing when unrated; initials in a circle; the name; then job title and company, whichever exist. The featured card spans the full width. Text wraps at phone width.

**The snippet** (screen 4 fills in the chosen options):

```html
<div data-testimonial-wall="https://<your-app>/embed/wall?min_rating=4&limit=6"></div>
<script src="https://<your-app>/embed.js" async></script>
```

`/embed.js` puts an iframe in every element with `data-testimonial-wall` (that URL, `title="Customer testimonials"`, width 100%, no border, `loading="lazy"`). The embed pages post `{ "type": "testimonial-wall:height", "height": <pixels> }` to their parent on load and whenever their height changes; embed.js resizes the iframe only for messages from your app's origin whose source is that iframe. Screen 4 also offers a plain `<iframe>` snippet, 800 pixels high, for sites that do not allow scripts.

**Headers**
- `/embed/wall` and `/embed/featured`: `Content-Security-Policy: frame-ancestors *`. Every other page: `frame-ancestors 'none'` and `X-Frame-Options: DENY`.
- `/wall` and the embeds: `Cache-Control: no-store`, so an unpublish or withdrawal shows on the next load. If you add a CDN later, cache for 60 seconds at most: a cached copy of a withdrawn quote is still published.
- `/t/...` and `/share/<token>`: `Referrer-Policy: no-referrer` and `noindex`, so tokens do not leak.

## 10. Screens

Staff screens need sign-in. Forms keep what was typed and show each error next to its field; success shows only after the server has saved. Status and permission are written out, never shown by color alone.

1. **Queue** (home). Cards: quote, name, role and company, rating ("No rating"), permission ("Permission to publish", "Private: no permission" or "Permission withdrawn"), status, age ("Sent 2 days ago"), source ("Form" or "Invitation from Sam Okafor"), and the actions allowed for the state and the viewer (section 7). Filters: Pending (default, oldest first), Approved, Published, Rejected, Withdrawn, All (newest first). Search matches name, company and quote within the filter. Admins see Export CSV. Empty state: "Nothing waiting for review."
2. **Testimonial detail.** The card plus email, permission evidence (exact consent_text, version and time, or "No permission given"), withdrawn time, review note and reviewer, published_at, the invitation it came from with its private note, the private link with Copy (moderators and admins), and the history: every event with actor, time and note. Reject and Record withdrawal open a dialog for the note.
3. **Invitations.** List: customer, company, created by, status, created, reminded, expires; Copy link and Cancel on open ones. New invitation: name, email, company, role, words they used, source, private note. In development: "Run scheduled job now" (section 12).
4. **Wall and embed.** Live preview using section 9, a minimum-rating picker (All ratings, 4 stars and up, 5 stars), a limit, both snippets with those options filled in, Copy buttons and a link to `/wall`.
5. **Admin: People.** Name, email, role, active; add, edit, deactivate. Nobody can deactivate themselves or change their own role.
6. **Admin: Settings.** The Settings fields, with the current permission version and the note "Changing this creates a new version. Testimonials already received keep the wording their authors agreed to."
7. **Admin: Outbox.** Every notification, newest first: time, to, kind, subject, status, error; click to read the body.
8. **Collection form**, public: `/share` and `/share/<token>` (sections 6 and 12).
9. **Thank-you page**, public (section 6).
10. **Private page**, public: `/t/<manage_token>` (section 6).
11. **Public wall**: `/wall` (section 9).
12. **Embeds**: `/embed/wall` and `/embed/featured` (section 9).

Development only, on every staff screen: an "Act as" switcher listing every person (inactive ones marked), "Reset to seed data" (deletes everything, reloads section 14 and resets the clock), and a clock control that moves the app's "now" forward by whole days.

## 11. Notifications

| Trigger | To | Kind | Subject and content |
|---|---|---|---|
| Submitted | Customer | submission_received | "We received your words". Whether permission was given, and the private link |
| Submitted | Active moderators and admins | new_submission | "New testimonial from Cy Patel (Acme)". The words, "4 stars. Permission to publish: yes.", a link |
| Invitation created | Customer | invitation | "Sam Okafor from Northwind asked for a few words". The link, and if pre-filled "We started it with what you told us. Change anything you like. Nothing is published without your permission." Reply-To: the creator |
| Invitation open 3 days | Customer | invitation_reminder | "Reminder: Sam Okafor from Northwind asked for a few words". Same link and the expiry date. Once |
| Published | Customer | published | "Your words are on Northwind's website". Links to `/wall` and the private page |
| Withdrawn (either way) | Customer | withdrawal_confirmed | "You withdrew permission". The date, and that the words will not be shown |
| Withdrawn | Active moderators and admins | withdrawn_alert | "Ben Adler withdrew permission". Plus "It was removed from the wall." or "Nothing is featured now." when true |

Write every notification to the outbox first, then send. With no email provider configured, set status logged instead of sending. Failed sends keep their error and are retried by the next job run. A notification problem never blocks or undoes an action.

## 12. Invitations, the scheduled job and time

**Invitations** turn a quote buried in an email or call notes into a testimonial. A team member enters the customer's details, pastes the words they used and says where. Saving creates an open invitation and queues its email. Opening `/share/<token>`:
- open and before expires_at: the form, headed "Sam Okafor from Northwind invited you to share a few words", pre-filled, with the permission box unticked. The customer can change anything.
- expired, or open at or after expires_at (mark it expired): "This link has expired. Ask Northwind for a new one."
- completed: "You've already sent your words. Thank you."
- cancelled: "This link is no longer active." Unknown token: "This link is not valid."

**Scheduled job** (hourly; on Vercel, a cron hitting `/api/cron/tick` with a `CRON_SECRET` header):
1. **Expire** open invitations whose expires_at has passed.
2. **Remind** open invitations created 72 hours or more ago with no reminded_at; set reminded_at. Expire runs first, so an expired invitation is never reminded.
3. **Retry** notifications that failed, or are still queued after 5 minutes.
4. **Prune** FormAttempt rows older than 24 hours.

**Time.** All server code reads the time through one function, which adds the development clock offset (section 10). Use real elapsed time: 3 days is 72 hours. Public pages and emails show dates in Settings.time_zone; staff screens use the viewer's time zone.

## 13. Edge cases

- The customer withdraws while a moderator publishes, or two moderators feature different testimonials at once: R12 and R7. The second action fails with a message ("Permission was withdrawn") and changes nothing.
- Someone submits under another person's name: approval is the check. The detail page shows the email, and invitation submissions came through a link sent to a known address. If in doubt, ask or reject.
- The same customer sends twice: both arrive pending. Publish one and reject the other with "Duplicate".
- A customer asks by email to be removed and has lost the link: a moderator records the withdrawal with the email as the note, or copies the private link from the detail page and replies with it.
- A customer asks for their data to be deleted: withdraw first if consent is true, then an admin deletes (R14).
- Your website's Content-Security-Policy blocks frames from your app: add your app's origin to its `frame-src`. The link to `/wall` still works.

## 14. Seed data

Northwind is a small software company that sells an approvals app to other small businesses. Staff emails end in `@northwind.example`. T is the moment the seed is loaded; "T − 40d" means 40 days earlier.

| Person | Role | Active |
|---|---|---|
| Maya Chen (Marketing lead) | admin | yes |
| Jo Park (Content marketer) | moderator | yes |
| Sam Okafor (Account manager) | member | yes |
| Alex Kim (Former contractor) | member | no |

Settings: company_name "Northwind", wall_title "What our customers say", form_intro "Tell us what changed for your team since you started using Northwind. We read every response.", permission_text version 1 (section 6), form_open true, time_zone "America/New_York".

| Customer | Role, company | Email | Rating | Consent | Status | Sent |
|---|---|---|---|---|---|---|
| Ana Moreno | Finance Manager, Harbor Studio | ana@harborstudio.example | 5 | yes | published, featured | T − 40d |
| Ben Adler | Operations Lead, Bluebird | ben@bluebird.example | 5 | yes | published | T − 30d |
| Rosa Lind | Founder, Olsen & Co | rosa@olsen.example | none | yes | published | T − 21d |
| Hugo Brandt | Finance Director, Kestrel Schools | hugo@kestrelschools.example | 4 | yes | published | T − 14d |
| Theo Grant | Office Manager, Pine Street Dental | theo@pinestreetdental.example | 3 | yes | published | T − 9d |
| Omar Haddad | IT Manager, Fieldstone Labs | omar@fieldstonelabs.example | 4 | yes | approved | T − 5d |
| Cy Patel | Office Manager, Acme | cy@acme.example | 4 | yes | pending | T − 2d |
| Lee Hart | Director, Ridgeway | lee@ridgeway.example | none | no | pending | T − 1d |
| Felix Wong | Owner, Bramble Bakery | felix@bramblebakery.example | 5 | yes | rejected | T − 12d |
| Kai Jensen | COO, Larkspur Labs | kai@larkspurlabs.example | 5 | withdrawn | withdrawn | T − 60d |

Consent "yes" means consent_text is the version 1 wording, consent_version 1 and consent_at the sent time. Lee Hart has none. Kai Jensen keeps that version 1 evidence from T − 60d, with consent false and withdrawn_at T − 3d.

Their words:
- **Ana Moreno**: "Northwind saved us a week every month. Month-end used to mean chasing approvals by email. Now every approval is in one place, with a name and a time next to it."
- **Ben Adler**: "We set it up in one afternoon. The next morning the whole team was using it, and nobody asked for a training session."
- **Rosa Lind**: "Our approvals finally have a paper trail. When our accountant asked who signed off on a purchase, we found it in ten seconds."
- **Hugo Brandt**: "Rolling it out to forty staff took a week, mostly because we were careful. It has been reliable ever since."
- **Theo Grant**: "It does the job. The reports could be more flexible, but approvals no longer get lost, which is what we needed."
- **Omar Haddad**: "Single sign-on worked the first time, and our IT team has not had a single ticket about it since."
- **Cy Patel**: "The team actually uses it, which is a first for us. Filtering requests on a phone is fiddly, but on a laptop it is quick and clear."
- **Lee Hart**: "Please keep this private. Our first two weeks were rough because the import kept failing, but your support team fixed it within a day."
- **Felix Wong**: "We approve every order for our biggest client, Harbor Foods, about $40,000 a month, and nothing slips through."
- **Kai Jensen**: "Approvals that took days now take minutes. I would recommend Northwind to any operations team."

History (seed the matching events): Ana was approved and published by Jo at T − 39d and featured by Maya the same day. Ben came from Sam's invitation and was approved and published by Jo at T − 29d. Rosa, Hugo and Theo were approved and published by Jo one day after they were sent. Omar was approved by Jo at T − 4d with the note "Good for the IT page." Felix was rejected by Jo at T − 11d with the note "Names a client and their spend. We can't publish that." Kai was approved and published by Jo at T − 59d and withdrew on his private page at T − 3d. Cy and Lee have only a `submitted` event.

| Invitation for | Created by | Words they used | Source, private note | Status | Created |
|---|---|---|---|---|---|
| Ben Adler, Operations Lead, Bluebird (ben@bluebird.example) | Sam Okafor | "We set it up in one afternoon." | call, "Renewal call, said this unprompted" | completed at T − 30d | T − 32d |
| Nora Quinn, Head of Finance, Lumen Studio (nora@lumenstudio.example) | Sam Okafor | "Approvals don't get lost in Slack anymore." | email, "Reply to our renewal email" | open, not reminded | T − 1d |

The outbox starts empty.

## 15. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Press Reset to seed data before each phase's checks, and open public pages in a private window.

### Phase 1: Foundation

```
Using the Testimonial Wall blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Person, Settings, Testimonial, Invitation, Event, Notification, FormAttempt) with a real database.
2. Add staff sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you." Customers never sign in.
3. Build Admin: People and Admin: Settings (section 10, screens 5 and 6), admin only, enforced on the server. Changing the permission wording follows R15.
4. Build the Queue and Testimonial detail (screens 1 and 2) read-only, with filters, search, permission evidence and history.
5. Load the seed data from section 14, including each testimonial's history events.
6. Add the development-only tools in section 10: "Act as", "Reset to seed data" and the clock control. Read the time through one function (section 12).

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Act as lists Maya Chen (admin), Jo Park (moderator), Sam Okafor (member) and Alex Kim (inactive). Choosing Alex shows "Ask an admin to add you."
- [ ] Acting as Sam, the Admin pages are not in the menu and their URLs return 403. Acting as Maya, both open.
- [ ] The Queue opens on Pending with Cy Patel, then Lee Hart, whose card says "Private: no permission" and "No rating". All shows 10 testimonials.
- [ ] Under All, searching "bluebird" shows only Ben Adler. Withdrawn shows only Kai Jensen.
- [ ] Kai Jensen's detail page shows the version 1 wording given 60 days ago, "Permission withdrawn" 3 days ago, and the history submitted, approved, published, withdrawn.
- [ ] Acting as Maya, adding Rui Costa (rui@northwind.example) as a member works and he appears in Act as. Another person with jo@northwind.example is refused. Maya cannot deactivate herself.
- [ ] Moving the clock 2 days ahead makes Cy Patel's card say "Sent 4 days ago". Reset to seed data brings back "Sent 2 days ago" and removes Rui.

### Phase 2: Collecting testimonials

```
Using the Testimonial Wall blueprint above, build Phase 2 only.

1. Build the collection form, the thank-you page and the private page (section 10, screens 8 to 10) exactly as section 6 describes, with the server steps in that order. No sign-in on these pages.
2. Implement Submit and Withdraw (section 7) with R1, R2, R8, R11, R12, R15 and R16, enforced on the server.
3. Build Invitations (screen 3) and the invitation link as section 12 describes, with R17.
4. Write the emails in section 11 for these actions to the outbox and build Admin: Outbox (screen 7). If no email provider is configured, mark emails logged instead of sending.
5. Add the section 9 headers for the form, the invitation link and the private page.
6. Add automated tests for field validation, the honeypot, the rate limit and the permission-version check.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed out, submit /share as Ivy Moss (ivy@pinewood.example) with the words "Great tool." The form says "Please write at least 20 characters." and keeps her name and email. Nothing is added to the Queue.
- [ ] Resubmit with "Our support tickets dropped by half in the first month." and the box unticked. The thank-you page says only the team will read it. Acting as Jo, Ivy Moss is pending with "No rating" and "Private: no permission".
- [ ] Submit Grace Holm (grace@birch.example, Office Manager, Birch & Co, 5 stars, "Month-end close went from five days to two, and nobody chases signatures anymore.") with the box ticked. Admin: Outbox has "We received your words" to Grace with a /t/ link, and "New testimonial from Grace Holm (Birch & Co)" to Maya and Jo, none to Sam. Her detail page shows the version 1 wording and time.
- [ ] Grace's /t/ link says "Waiting for review." Withdraw and confirm: it now says she withdrew permission today, the Queue shows her Withdrawn with the wording kept, and the Outbox has "You withdrew permission" to Grace and "Grace Holm withdrew permission" to Maya and Jo.
- [ ] With the browser's developer tools, add `<input name="status" value="published">` to the form and submit Paul Diaz (paul@copperlane.example) with the box ticked. Paul is pending, not published.
- [ ] Acting as Sam, invite Nina Shah (nina@copperlane.example, Copper Lane) with the words "We stopped losing purchase requests in email." The Outbox has "Sam Okafor from Northwind asked for a few words" to Nina. Signed out, her link shows the form pre-filled with the box unticked. After she submits with the box ticked, the Queue shows "Invitation from Sam Okafor", the invitation is Completed, and the link says "You've already sent your words. Thank you."
- [ ] Signed out, fill in /share as Rita Cole (rita@harborfoods.example) with the box ticked, without submitting. Acting as Maya, change the permission wording; Settings shows version 2. Rita's submit is refused with "Our permission wording changed while you were writing..." with her words kept and the box unticked. Resubmitted, her detail page shows the version 2 wording; Ana Moreno's still shows version 1.
- [ ] Acting as Maya, turn off Form open. Signed out, /share shows "We're not collecting testimonials right now.", while Nora Quinn's invitation link (Copy link on Invitations) still shows the form.

### Phase 3: Review, publishing and the public wall

```
Using the Testimonial Wall blueprint above, build Phase 3 only.

1. Implement Approve, Reject, Publish, Unpublish, Feature, Unfeature and Record withdrawal (section 7) with R3 to R8 and R11 to R13. Enforce every permission on the server, not only by hiding buttons.
2. Add these actions to screens 1 and 2, showing exactly the actions in the worked-examples table in section 7.
3. Implement the selection in section 9 as one pure function, with unit tests for every row of its worked-examples table.
4. Build /wall (screen 11) with that function, R9, R10, R18 and the section 9 headers.
5. Do every status check and update in one transaction (R12) and enforce the single featured testimonial in the database (R7).
6. Send the published and withdrawal emails in section 11 through the outbox.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Acting as Sam, Cy Patel's card has no Approve button, and a direct request to the approve endpoint returns 403. Cy stays pending.
- [ ] Signed out, /wall shows "What our customers say" and five cards: Ana Moreno (featured, full width), Theo Grant, Hugo Brandt, Rosa Lind, Ben Adler. Rosa's card has no stars, and there is no count or average rating.
- [ ] Acting as Jo, approve Cy Patel: /wall still has five cards. Publish her: /wall shows Ana (featured), Cy, Theo, Hugo, Rosa, Ben, and the Outbox has "Your words are on Northwind's website" to cy@acme.example.
- [ ] On Lee Hart, Approve is disabled with "No permission to publish". Reject with an empty note is refused; with "Private feedback, passed to support" Lee shows Rejected.
- [ ] Jo features Ben Adler. /wall shows Ben first as the featured card and Ana as an ordinary card. Ana's history shows "unfeatured" and Ben's "featured", both by Jo.
- [ ] /wall?min_rating=4 says "Showing 4 and 5 star ratings only." and shows Ben (featured), Cy, Hugo, Ana. /wall?min_rating=5 shows Ben and Ana. Rosa Lind appears only under All ratings.
- [ ] Jo unpublishes Hugo Brandt: he leaves /wall, shows Approved and has a Publish button again.
- [ ] Copy Ben Adler's private link from his detail page and open it signed out: it says "On our website since" with the date 29 days ago. Withdraw and confirm. /wall no longer shows Ben and has no featured card. Ben's detail page keeps his version 1 wording and consent time, has no Publish button, and a direct publish request is refused.
- [ ] Jo records a withdrawal on Rosa Lind with an empty note: refused. With "Rosa asked by email to be removed": Rosa is Withdrawn, her history shows Jo and the note, and the Outbox has "You withdrew permission" to rosa@olsen.example.

### Phase 4: Embed, reminders, export and deletion

```
Using the Testimonial Wall blueprint above, build Phase 4 only.

1. Build /embed/wall, /embed/featured and /embed.js exactly as section 9 describes, with the height messages and headers.
2. Build the Wall and embed screen (section 10, screen 4).
3. Build the scheduled job in section 12 at /api/cron/tick, protected by a CRON_SECRET header, plus the development-only "Run scheduled job now" button on Invitations. The job uses the app's clock, including the development offset.
4. Add Export CSV for admins on the Queue, enforced on the server: one row per testimonial with name, email, company, job_title, rating, quote, status, consent (yes or no), consent_text, consent_version, consent_at, withdrawn_at, published_at, featured, source and submitted_at. ISO 8601 UTC times. Quote fields so commas and line breaks stay in one cell.
5. Add Delete for admins (R14), with a confirmation that names the customer.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] On Wall and embed, choose "4 stars and up" and limit 3. The script snippet's URL ends in `/embed/wall?min_rating=4&limit=3`, and the preview shows Ana (featured), Hugo, Ben.
- [ ] Paste that snippet into a new file, test.html, on your computer and open it in the browser. It shows the same three cards and "Showing 4 and 5 star ratings only.", and the frame grows to fit with no inner scroll bar.
- [ ] Add `<iframe src="https://<your-app>/"></iframe>` to test.html and reload. The browser refuses to show the staff app in that frame, while the testimonials still show.
- [ ] Withdraw Ana Moreno from her private link and reload test.html: it shows Hugo and Ben only, and /embed/featured is empty. The page source of /embed/wall contains "Bluebird" but not "bluebird.example".
- [ ] Move the clock 3 days ahead and press Run scheduled job now. Nora Quinn's invitation shows a reminded time, and the Outbox has exactly one "Reminder: Sam Okafor from Northwind asked for a few words" to nora@lumenstudio.example. At 4 days ahead, running the job again adds no second reminder.
- [ ] Move the clock 14 days ahead and run the job. Nora's invitation shows Expired, and her link says "This link has expired. Ask Northwind for a new one."
- [ ] Acting as Maya, Export CSV has a header and 10 rows. Ana's quote is in one cell exactly as written, and Kai Jensen's row has status withdrawn, consent no, and consent_at and withdrawn_at filled. Acting as Jo, there is no Export button and the export URL returns 403.
- [ ] Acting as Maya, copy Felix Wong's private link, then delete Felix (rejected). He disappears from All, and his link says "This link is not valid." Hugo Brandt (published) has no Delete action.

## 16. Variations

- Ask happy customers automatically after a support ticket closes: create an invitation from your help desk's webhook.
- Video testimonials recorded in the browser, behind the same permission step.
- Different walls per product or page: tag testimonials and add a `tag` parameter to the embeds.
- Customer photos and company logos, uploaded on the form and named in the permission wording.
- Let a customer approve a shorter excerpt from their private page instead of submitting again (R3).
- Bulk invitations from a CSV of customers.
