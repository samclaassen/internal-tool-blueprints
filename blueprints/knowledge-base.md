<!-- Mirrored from https://personalsoftwarefactory.com/blueprints/knowledge-base . The page has a labelled drawing and build-or-buy notes. Free to copy and adapt for your own team. -->

# Internal Knowledge Base

Blueprint BP-039 · Department: Ops · Replaces: Guru (verified knowledge cards), pinned Slack messages, the stale wiki page
For teams of 5 to 80 people.

> How to use this file: paste this whole document into your AI builder (Claude, ChatGPT, Cursor, Lovable, Replit, Type) as context. Then send the build prompts in section 16 one at a time. Do not move to the next phase until the acceptance checks for the current phase pass.

---

## 1. The problem

"The same questions get asked in Slack every week, and the answers keep changing."

Someone asks in #general how to connect to the VPN. Three people answer, two of them with last quarter's answer. The right answer lives in a thread that scrolls away, the wiki page is from last year, and nobody owns it, so nobody updates it when the answer changes.

This blueprint is a small knowledge base built around four rules: every answer is a card with one owner; every card says whether it is verified and when it next needs review; anyone can flag a card as wrong and the owner is told; and every change is a new version with a note saying what changed.

## 2. What the real product does

Research basis: Guru's home, pricing and verification pages (getguru.com, getguru.com/pricing, getguru.com/features/verification) and help center articles (help.getguru.com/docs/how-to-create-edit-and-publish-guru-cards, /verifying-and-unverifying-cards, /guru-roles-admin-collection-owner-author-read-only, /creating-and-managing-folders-in-guru, /commenting-on-guru-cards, /sending-and-receiving-announcements-in-guru, /searching-guru-in-slack, /creating-and-adding-to-guru-cards-in-slack, /viewing-knowledge-usage-analytics, /intro-to-knowledge-agents), October 2026.

What we verified:

1. **Cards, Collections and Folders.** Knowledge lives in Cards, published into a Collection and a Folder within it, with optional tags. Collection Owners create and edit Cards; drafts can be shared with collaborators, published now, scheduled, or sent for approval. Each Card keeps a revision history that can be compared with the current version.
2. **Verification.** Every Card has a verifier (a person or a Group) and a verification interval: does not expire, 30, 60 or 90 days, 6 months or 1 year. A Card shows who last verified it and when. When someone other than the verifier edits a Card, it becomes unverified and a verification request goes to the verifier. Anyone can unverify a Card to request verification. Unverified Cards still appear in search.
3. **Knowledge Agents.** AI agents answer questions with citations from Guru Cards and connected sources (Google Drive, Confluence, Slack, Salesforce and more), and can verify or unverify content automatically once a day from usage and content rules, with a 7-day cooldown and a quality log.
4. **Slack.** In channels connected to a Knowledge Agent, Guru suggests answers to questions and answers `@guru`. The `/guru` command searches Cards and can post one to the channel, "Answer with Card" replies to a message with a Card, and "Create Card" turns a Slack message or thread into a Card.
5. **Feedback and announcements.** Users highlight text to comment and @mention people. Collection Owners can send a Card as an announcement to Groups or people, who confirm with "I read it"; Guru follows up automatically after 3 days.
6. **Permissions.** Roles are Admin and Creator for the workspace, and Owner and Viewer on Collections, Pages, Sources and Knowledge Agents, assigned to users or Groups, plus custom roles.
7. **Analytics.** Card views, most viewed and followed Cards, searches that returned no results, and a verification score over time; Guru recommends keeping it above 80%. Reports list unverified Cards by verifier and the most-viewed unverified Cards.
8. **Pricing** (getguru.com/pricing). No prices are published. Guru's FAQ says it is a platform and expertise solution rather than a per-seat tool, with the investment tailored to an organization's scale and scoped on a call with its team. The package includes the platform, a team of solution engineers, and enterprise governance such as SOC 2 Type II, SSO and SCIM. Eligible 501(c)(3) nonprofits can get reduced pricing through Guru for Good.

### What this blueprint keeps

Cards with a question-style title, a Markdown answer, alternate phrasings and tags, in collections that everyone or only some teams can see; one owner per card who verifies it on an interval (30, 90, 180 or 365 days, or never); edits by anyone but the owner turning a card unverified until the owner checks it; flags with a reason; versions with change notes and a line-by-line comparison; followers told when a card changes; search with a fixed, explainable ranking where verified cards win ties; a list of searches that found nothing; a verification score; review reminders by email; a `/kb` Slack command to search and post cards; and CSV export.

### What this blueprint deliberately leaves out

AI answers and Knowledge Agents, automatic verification, connected sources (Google Drive, Confluence, Slack history), folders, custom roles and groups beyond one team per person, comments on highlighted text, announcements with read receipts, card templates, scheduled publishing and approval workflows, creating cards from Slack messages, automatic answers in Slack channels, the browser extension, view analytics, SSO and SCIM, and the API and MCP server. These matter to companies where hundreds of people rely on AI answers drawn from many systems. If you need AI answers across your existing documents, or compliance controls such as SOC 2 and HIPAA, talk to Guru.

## 3. Scope of v1

- One company and one team time zone (Settings; default America/New_York). "Today" is today in that zone, and every date and time is shown in it.
- Each person belongs to one team. A collection is visible to everyone or to chosen teams. Admins see everything.
- A card answers one question. Its trust is computed: Verified or Unverified, always with a reason.
- Email through an outbox. If no email provider is configured, emails are logged, not sent.
- An optional Slack slash command, `/kb`. Web app that works on a phone.

## 4. Roles

| Role | Who | Can do |
|---|---|---|
| Admin | One or more people | Manage people, teams and collections (visibility and editors). See every collection. Count as editors of every collection. Change any card's owner. Insights, export, outbox, Slack linking. |
| Editor | People listed as editors of a collection | Create, publish, edit, archive and restore cards in that collection. Be picked as a card's owner. |
| Owner | The editor named on a card | Verify the card. Hand it to another editor. |
| Reader | Every active person | Search and read published cards in collections they can see. Follow and flag cards. |

A person can hold several roles. Only a card's owner verifies it, admins included (R7). The server enforces every permission (R1).

## 5. Data model

All timestamps are UTC. Dates are calendar dates in the team time zone (`YYYY-MM-DD`). All IDs are strings (UUID or similar).

**Settings** (one row)
- company_name (required, max 60), time_zone (IANA name, default America/New_York)
- last_daily_run_at (nullable timestamp; written only by the scheduled job)

**Team**
- id, name (required, 1 to 40, unique ignoring case)

**Person**
- id, name (required, 1 to 80), email (required, unique, stored lowercase), team_id (required)
- is_admin (boolean, default false), active (boolean, default true)
- slack_user_id (nullable, unique), slack_lookup_error (nullable text)

**Collection**
- id, name (required, 1 to 60, unique ignoring case), description (optional, max 300)
- visibility: everyone | teams
- CollectionTeam rows (collection_id, team_id; unique) list the teams when visibility is teams; at least one is required.
- CollectionEditor rows (collection_id, person_id; unique) list the editors.

**Card**
- id, number (integer from 101, sequential, never reused; shown as "KB-101"), collection_id
- status: draft | published | archived (a new card is saved as a draft)
- title (5 to 120 characters, written as the question people ask), body (Markdown; 1 to 5,000 characters to publish)
- questions (0 to 5 alternate phrasings, 3 to 120 characters each), tags (0 to 8; lowercase letters, digits and hyphens, 2 to 30 characters)
- owner_id (required to publish), review_interval_days: 30 | 90 | 180 | 365, or empty for "doesn't expire" (default 90)
- verified_at, verified_by (nullable), verified_until (nullable date, section 6)
- needs_verification: empty | not_verified | edited | restored; needs_verification_by, needs_verification_at (nullable)
- version (integer; 0 until first published, then the current version number)
- created_by, created_at, updated_by, updated_at (the current version's author and time), archived_by, archived_at (nullable)
- reminder_sent_for, overdue_sent_for (nullable dates: the verified_until value each job notice was sent for, section 13)

**CardVersion** (written on every publish; never changed)
- id, card_id, number; unique (card_id, number)
- title, body, questions, tags (as published), change_note (empty for version 1), author_id, published_at

**Flag**
- id, card_id, person_id, reason (5 to 500 characters), created_at
- status: open | resolved; resolved_at, resolved_by, resolution: verified | archived | withdrawn
- At most one open flag per person per card.

**Follow**
- card_id, person_id, created_at; unique (card_id, person_id)

**CardEvent** (append-only; never edited or deleted, except with a deleted draft)
- id, card_id, actor_id (nullable for the system), created_at, data (JSON: version number, old and new owner, flags resolved)
- type: created | published | updated | verified | flagged | flag_withdrawn | owner_changed | archived | restored

**SearchLog** (no person is stored)
- id, query (the search terms joined by single spaces, max 200), result_count, created_at

**Notification** (outbox)
- id, kind: verify_request | card_updated | flagged | flag_resolved | review_due | review_overdue
- person_id, to_email, card_id, subject, body (plain text)
- status: queued | sent | logged | failed; attempts (integer, default 0; each send attempt adds 1), last_error, created_at, sent_at

## 6. Trust: verification and review

**Verifying.** When the owner verifies a published card: verified_at = now, verified_by = the owner, verified_until = the date of verified_at in the team time zone plus review_interval_days (empty when the card doesn't expire), needs_verification is cleared, and every open flag is resolved with resolution verified. The card's reminder_sent_for and overdue_sent_for are cleared.

**Trust** is computed every time it is shown, from the card, its open flags, its owner and today. It is never stored. For a published card, the first rule that matches gives Unverified and its reason:
1. The owner is inactive, or is no longer an editor of the collection (and not an admin): "Needs a new owner: Kai Brooks is inactive." or "Needs a new owner: Ben Cho is no longer an editor of IT & Accounts."
2. There is an open flag: "Flagged by Jo Park on Mon 12 Oct: The meal limit changed to $60 in October." (the oldest open flag; " (+1 more)" when there are others).
3. needs_verification is set: "Edited by Sam Okafor on Tue 13 Oct. Waiting for Ben Cho to verify.", "Not verified yet. Waiting for Ben Cho." or "Restored on Wed 14 Oct. Waiting for Ben Cho to verify."
4. The card has an interval and today is after verified_until: "Review was due Sun 4 Oct."

Otherwise it is Verified: "Verified by Ben Cho on Tue 13 Oct · next review by Mon 11 Jan 2027", or "· doesn't expire". A verified card is **due soon** when it has an interval and today is on or after verified_until minus 7 days. Drafts and archived cards have no trust.

The **verification score** of a set of published cards is the verified ones ÷ all of them, as a whole percentage rounded half up: floor((200 × verified + total) ÷ (2 × total)). With no cards, show "–".

### Worked examples (seed data in section 15; today is Wed 14 Oct 2026)

| Card | Facts | Trust shown |
|---|---|---|
| KB-101 | Verified by Ben Tue 13 Oct at 10:00, every 90 days | Verified by Ben Cho on Tue 13 Oct · next review by Mon 11 Jan 2027 |
| KB-103 | Verified Fri 4 Sep, every 30 days | Review was due Sun 4 Oct. |
| KB-104 | Verified by Ben Mon 3 Aug; Sam published version 2 on Tue 13 Oct | Edited by Sam Okafor on Tue 13 Oct. Waiting for Ben Cho to verify. |
| KB-105 | Verified Mon 14 Sep; Jo's flag open since Mon 12 Oct | Flagged by Jo Park on Mon 12 Oct: The meal limit changed to $60 in October. |
| KB-109 | Verified by Dana Mon 2 Mar, doesn't expire | Verified by Dana Ruiz on Mon 2 Mar · doesn't expire |
| KB-112 | Owner Kai Brooks is inactive; also past its review date | Needs a new owner: Kai Brooks is inactive. (rule 1 wins) |
| KB-107 | Verified Mon 27 Jul, every 90 days, so verified_until is Sun 25 Oct | Verified; due soon from Sun 18 Oct |

A verification at 03:30 UTC on Wed 14 Oct is on Tue 13 Oct in New York, so with a 30-day interval its review is due by Thu 12 Nov.

Score with the seed data: 6 of 10 published cards are verified (60%). By collection: IT & Accounts 2 of 5 (40%), People & Policies 2 of 3 (67%), Sales playbook 1 of 1 (100%), Finance 1 of 1 (100%).

## 7. Cards: lifecycle, versions and flags

| Action | Who | From | To | Side effects |
|---|---|---|---|---|
| Create | An editor of the collection | (none) | draft | Next number; event `created` |
| Edit draft | Editors of the collection | draft | draft | Nothing else |
| Publish | Editors of the collection | draft | published | Version 1; trust per R8; event `published` |
| Edit | Editors of the collection | published | published | New version with a change note (R6); trust per R8; followers told when "Notify followers" is ticked; event `updated` |
| Verify | The owner (R7) | published | published | Section 6; event `verified` with the number of flags resolved |
| Flag | A reader who isn't the owner (R9) | published | published | Event `flagged`; owner told |
| Withdraw flag | The person who flagged | published | published | Flag resolved as withdrawn; event `flag_withdrawn` |
| Change owner | The current owner or an admin (R10) | draft, published | unchanged | needs_verification = not_verified for published cards; event `owner_changed` |
| Archive | Editors of the collection, the owner | published | archived | Open flags resolved as archived; event `archived` |
| Restore | Editors of the collection | archived | published | needs_verification = restored; event `restored` |
| Delete | The draft's creator or an admin | draft | (removed) | The card, its events and follows are deleted; its number is not reused |

Admins count as editors of every collection, so they can take any editor action. Archived cards keep their page, with "Archived on Mon 5 Oct by Ben Cho.", so old links still explain themselves. Published and archived cards can't be deleted, and cards can't move between collections in v1.

**Versions.** Each publish writes a CardVersion with the title, body, questions and tags as published. A card shows "Updated Tue 13 Oct by Ben Cho: Moved from Cisco AnyConnect to Tailscale" for version 2 and later, or "Published Mon 6 Jul by Ben Cho" for version 1. History lists versions newest first: number, date, author and change note. Compare shows a version's body against the version before it, line by line: removed lines marked "-", added lines marked "+".

**Flags.** A flag says the card is wrong or out of date. It shows on the card with the person, the date and the reason until it is resolved, and makes the card Unverified (section 6). Verifying resolves every open flag; archiving resolves them as archived.

## 8. Search

**Words.** One function turns text into words, for queries and cards alike:
1. Lowercase. Remove hyphens and apostrophes between letters or digits ("Wi-Fi" becomes "wifi", "isn't" becomes "isnt").
2. Split on every character that is not a letter or a digit, and drop words shorter than 2 characters.
3. A word longer than 3 characters that ends in "s", but not in "ss", "us" or "is", loses the final "s" ("expenses" becomes "expense", "meals" becomes "meal", "pass" stays "pass").

**Terms.** A query's terms are its words without duplicates and without these stop words: a, an, and, are, as, at, be, by, can, do, does, for, from, get, how, i, in, is, it, me, my, of, on, or, our, the, to, we, what, when, where, who, why, with, you, your. A query with no terms shows "Type a word to search for." and is not logged.

**Matching and ranking.** Search covers published cards in collections the person can see (R2); drafts and archived cards never appear, for anyone. A term matches a field when it equals one of the field's words. For each term, a card scores 3 if it matches the title or an alternate question, otherwise 2 if it matches a tag, otherwise 1 if it matches the body. A card's score is the sum over the terms; cards scoring 0 are left out. Order: score, highest first; then Verified before Unverified; then title A to Z. Show at most 20 results.

**Logging.** Each submitted search with at least one term writes one SearchLog row with the terms and the number of results that person got (R14).

### Worked examples (signed in as Jo Park unless noted)

| Query | Terms | Results in order (score) |
|---|---|---|
| vpn not working | vpn, not, working | KB-101 (9: each term is in the alternate question "VPN not working") |
| password | password | KB-102 (3), KB-103 (3): equal scores, so the verified card comes first |
| laptop | laptop | KB-102 (3, title), KB-101 (1, body), KB-112 (1, body): KB-101 is verified |
| office | office | KB-103 (3, title), KB-109 (2, tag): the higher score wins over trust; draft KB-110 is not shown |
| How do I get reimbursed for meals? | reimbursed, meal | KB-105 (4: 3 for the alternate question, 1 for "Meals" in the body) |
| Wi-Fi | wifi | KB-103 (3) |
| discount | discount | None for Jo; KB-107 (3) for Lee Park, who is in Sales |
| parking pass | parking, pass | None while KB-110 is a draft; KB-110 (6) once it is published |

## 9. Business rules

- **R1. Server checks.** Every permission is enforced on the server for every action and API call. Hiding a button is not a permission check. Editor actions by anyone else: "Only editors of IT & Accounts can do this." An action on a card in the wrong state (section 7) is refused with "KB-103 is archived." or "KB-110 is a draft."
- **R2. Visibility.** A person can see a collection when its visibility is everyone, when their team is one of its teams, or when they are an admin. Cards in collections they can't see don't exist for them: card and collection pages and API calls return "Not found", and those cards are left out of search, Recently changed, Collections counts, Slack replies and notifications. Drafts are visible only to the collection's editors.
- **R3. Editors.** Admins add and remove editors in Admin → Collections. An editor must be active and able to see the collection: "Jo Park can't see Sales playbook, so they can't edit it." Changing a collection's visibility so that an editor could no longer see it is refused: "Ana Lima edits Finance and couldn't see it any more. Remove her as an editor first." Removing an editor leaves their cards with them; rule 1 of section 6 flags those cards.
- **R4. Card fields.** The limits in section 5, with these messages: "Write the title as a question of 5 to 120 characters.", "The answer needs 1 to 5,000 characters.", "Tags use lowercase letters, digits and hyphens.", "Pick how often this card is reviewed." The owner must be an active editor of the collection (or an admin): "Jo Park isn't an editor of IT & Accounts."
- **R5. Numbers.** Card numbers are assigned in order when a draft is created, starting at 101, and are never reused.
- **R6. Versions.** Every edit of a published card publishes a new version and needs a change note of 3 to 200 characters: "Say what changed in 3 to 200 characters." The edit form carries the version it was opened at; if the card has moved on, saving is refused: "Someone published a newer version (version 3 by Ben Cho) while you were editing. Copy your changes, reload and edit again." Versions are never changed or deleted.
- **R7. Verifying.** Only the card's owner can verify it, and only while it is published: "Only the card's owner, Ben Cho, can verify it." Verifying is allowed whatever the trust reason except rule 1 of section 6: "This card needs a new owner first."
- **R8. Publishing and trust.** When the person publishing or editing is the owner, the form offers "Verify now" (ticked by default): ticked, the card is verified as in section 6; unticked, needs_verification is set to edited (or not_verified for version 1). When anyone else publishes or edits, there is no "Verify now": needs_verification is set to not_verified for version 1 and to edited after that, with needs_verification_by and needs_verification_at, and the owner is asked to verify (section 11).
- **R9. Flags.** Anyone who can see a published card can flag it, except its owner: "You own this card. Edit or verify it instead." The reason needs 5 to 500 characters: "Explain what's wrong in 5 to 500 characters." One open flag per person per card: "You already flagged this card." Only the person who flagged can withdraw it.
- **R10. Owners.** The current owner or an admin can hand a card to another active editor of its collection (R4). The new owner verifies the cards they take over: a published card gets needs_verification = not_verified, and the new owner is told.
- **R11. Archive and delete.** Archiving needs no reason. Restoring makes the card Unverified until its owner verifies it. Only drafts can be deleted.
- **R12. Trust is computed.** Trust and the verification score are always computed as in section 6, never stored or cached past the request.
- **R13. Followers.** Anyone who can see a card can follow and unfollow it. Notifications go only to followers who are active and can still see the card when it changes.
- **R14. Search log.** Submitting a search (the search box, or `/kb` in Slack) writes one SearchLog row; typing does not. The log stores the terms, the result count and the time, never who searched. Rows older than 90 days are deleted by the daily job.
- **R15. People, teams and collections.** Admins add, edit, deactivate and reactivate people and manage teams and collections in Admin. There must always be at least one active admin: "At least one active admin is needed." A deactivated person can't sign in and gets no email; their flags stay open and their cards need a new owner. A team with people or collections can't be deleted: "Sales has 2 people and is used by 1 collection, so it can't be deleted." A collection with cards can't be deleted: "IT & Accounts has 6 cards, so it can't be deleted."
- **R16. Display.** Dates: "Tue 13 Oct", with the year when it isn't the current year ("Mon 11 Jan 2027"). Times: 24-hour "10:00", in the team time zone. Card numbers: "KB-101". Percentages: whole numbers ("67%"). Card bodies are rendered from Markdown (paragraphs, line breaks, bold, italics, lists, inline code and http or https links); raw HTML is shown as text.
- **R17. Notifications never block.** Every notification is written to the outbox in the same transaction as its action and sent after it commits. A failed send never blocks or undoes the action.
- **R18. Reading never writes.** Opening pages, cards, history and Insights never creates or changes rows. The only exception is the SearchLog row in R14.
- **R19. Events.** Every card action in section 7 writes exactly one CardEvent of the type listed, except deleting a draft. Events are never edited, and the card page lists them under Activity.

## 10. Screens

Navigation: Search, Collections, My cards, Insights (admins), Admin (admins). Admin pages and Insights show "Admins only" to everyone else.

1. **Search** (home). A search box. Results: number, title, collection, the trust badge (Verified or Unverified) with the trust text from section 6, and "Updated Tue 13 Oct". Empty states: "No cards match "parking pass"." and "Type a word to search for." With an empty box, **Recently changed**: the 10 most recently published versions of cards that are published now and that the person can see, newest first, as "KB-104 Who approves software purchases? · Tue 13 Oct · Sam Okafor · Added the $500 yearly limit" (version 1 shows "Published").
2. **Card.** Title, number, collection, trust badge and text, the body, alternate questions, tags, the update line from section 7, owner, open flags, Follow or Unfollow, Flag (with the reason box) and Withdraw for the person's own open flag. For editors: Edit, Archive or Restore, Change owner. For the owner: Verify and Change owner. For admins: Change owner. History (versions and Compare) and Activity (events, newest first). Archived cards show the archived line and no Flag or Follow.
3. **Collections.** Each collection the person can see: name, description and "5 cards · 2 verified (40%)" (published cards and their score). Opening one lists its published cards A to Z with their trust badge; editors also see a Drafts tab and an Archived tab, and New card.
4. **Card editor.** Title, body, alternate questions, tags, owner (a picker of the collection's active editors and admins), review interval. For a published card: change note, "Notify followers" (ticked by default) and, for the owner only, "Verify now". Buttons: Save draft (drafts only), Publish, Delete draft.
5. **My cards.** Cards the person owns, Unverified first with their reason, then due soon, then Verified; and drafts they created.
6. **Insights** (admins). The verification score overall and by collection; **Needs review**: unverified published cards grouped by owner (owner name A to Z, inactive owners marked "(inactive)"), each with its reason; **Searches with no results**: SearchLog rows with result_count 0 from the last 30 days, grouped by query, with the count and last searched date, ordered by count then most recent. People are never shown.
7. **Admin → People.** Name, email, team, admin, active, Slack (the linked ID, "not linked" or the lookup error). Add, edit, deactivate, reactivate; edit a Slack user ID by hand; Link Slack accounts (section 12). Teams are added, renamed and deleted here (R15).
8. **Admin → Collections.** Name, description, visibility and teams, and editors (inactive ones marked "(inactive)"). Create, edit, delete (R3, R15).
9. **Admin → Outbox.** Every notification, newest first: time, recipient, kind, subject, status, attempts and last error. Click a row to read the body.
10. **Admin → Export.** "Cards CSV" (`cards-2026-10-14.csv`, today's date): one row per card in any status, ordered by number. Columns: number, title, collection, status, trust (verified or unverified; empty for drafts and archived cards), trust_reason (empty when verified), owner, owner_email, review_interval_days (empty for doesn't expire), verified_at, verified_by, verified_until, version, updated_at, updated_by, open_flags, tags (joined with "|"), questions (joined with " | "). Timestamps are UTC ISO 8601 (`2026-10-13T14:00:00Z`), dates `YYYY-MM-DD`, missing values empty, and fields with commas, quotes or line breaks are quoted.

All screens must work on a phone. Text people type is always shown as text, never as HTML, apart from the Markdown in R16.

## 11. Notifications

| Trigger | Recipient | Kind | Subject (seed example) |
|---|---|---|---|
| Someone other than the owner publishes or edits a card | The owner | verify_request | "Sam Okafor edited KB-102. Please verify it." (version 1: "Ana Lima published KB-113 and made you its owner. Please verify it.") |
| The owner is changed (R10) | The new owner | verify_request | "You now own KB-112. Please verify it." |
| A new version with "Notify followers" ticked | Followers except the author (R13) | card_updated | "KB-101 updated: How do I connect to the VPN?" (body: the change note and a link) |
| A card is flagged | The owner, if active | flagged | "Tom Bennett flagged KB-106: How many vacation days do I get?" (body: the reason) |
| A flag is resolved by verifying or archiving | The person who flagged | flag_resolved | "Ana Lima verified KB-106 after your flag" or "Ben Cho archived KB-103 after your flag" |
| Review due soon (section 13) | The owner | review_due | "KB-107 needs review by Sun 25 Oct" |
| Review overdue (section 13) | The owner | review_overdue | "KB-103 is overdue for review (due Sun 4 Oct)" |

Every email links to the card. Each row starts queued. If no email provider is configured, set status logged instead of sending. If sending fails, set failed and last_error; every attempt adds 1 to attempts, and the scheduled job retries until attempts reaches 5. Nobody is emailed about their own action.

## 12. Slack command

**Setup** (once, by an admin):
1. Create a Slack app at api.slack.com/apps. Under Features → Slash Commands, click Create New Command: command `/kb`, Request URL `https://<your-app>/api/slack/command`, short description "Search the knowledge base", usage hint `[question] or post KB-101`.
2. Add the bot token scope `users:read.email` and install the app to the workspace. Store the app's bot token as `SLACK_BOT_TOKEN` and its Signing Secret (under Basic Info in the app settings) as `SLACK_SIGNING_SECRET`.
3. Link people: Admin → People → Link Slack accounts calls `GET https://slack.com/api/users.lookupByEmail?email=<email>` with `Authorization: Bearer <SLACK_BOT_TOKEN>` for each active person without a slack_user_id. When `ok` is true, store `user.id`; otherwise store the `error` in slack_lookup_error. Without a token: "Slack isn't configured. Set SLACK_BOT_TOKEN first."

**Handling a command** (`POST /api/slack/command`, `application/x-www-form-urlencoded` with `command`, `text`, `user_id`, `channel_id`, `team_id` and `response_url`):
1. Verify the request: build `v0:{X-Slack-Request-Timestamp}:{raw body}`, compute HMAC-SHA256 with the signing secret as a hex digest, prefix `v0=` and compare with `X-Slack-Signature` using a constant-time compare. Reply 401 and do nothing (no SearchLog row) if it doesn't match or the timestamp is more than 5 minutes from now.
2. Find the active person whose slack_user_id is `user_id`. If none, reply ephemerally: "Your Slack account isn't linked to the knowledge base. Ask an admin to link it in Admin → People."
3. Reply within 3 seconds with HTTP 200 and JSON `{"response_type": "...", "text": "..."}`. Every rule applies as in the web app, for that person (R2, R14).
   - Empty text or `help`: ephemeral usage text: "Try /kb how do I connect to the VPN, or /kb post KB-101."
   - `post KB-101` (or `post 101`; case doesn't matter): when the card is published, the person can see it, and its collection is visible to everyone, reply `in_channel` with four lines: "KB-101 How do I connect to the VPN?", the trust text, the body's first 300 characters (cut at a space, with "…" when longer), and the card's link. A card in a collection not everyone can see: ephemeral "KB-107 is in a collection not everyone can see, so it can't be posted to a channel." Unknown, draft, archived or hidden: ephemeral "No card KB-150 found."
   - Anything else is a search: ephemeral, "1 card matches "vpn not working":" (or "3 cards match …") and up to 3 lines like "KB-101 How do I connect to the VPN? · Verified · <link>". With none: "No cards match "discount"." With no terms: "Type a word to search for."

Slack doesn't allow slash commands in message threads, so people use `/kb` in a channel or a direct message.

## 13. Scheduled job and time

**Clock.** Every server-side use of the current time goes through one now() function. Today is the date of now() in Settings.time_zone.

**Development toolbar** (development only; it must not exist or respond in production):
- Sign in as any person.
- The clock: shows "Today: Wed 14 Oct 2026, 09:00 (America/New_York)", can be set to any date and time in the team zone, and has "+1 day". It is stored on the server and now() returns it.
- "Reset to seed data": deletes every row, loads section 15 and sets the clock to Wed 14 Oct 2026, 09:00 America/New_York.
- "Run scheduled job now" (Phase 4): runs the job with the development clock.
- "Slack command tester" (Phase 4): pick a person (their slack_user_id) or "Unlinked Slack user" (user_id U0NOBODY), type the text, and pick "Signed", "Wrong signature" or "Timestamp 10 minutes old". It sends a real request to /api/slack/command, signed with SLACK_SIGNING_SECRET (in development, "dev-signing-secret" when it isn't set), and shows the HTTP status and the JSON reply.

**Scheduled job.** Runs every hour; any scheduler that can call a URL works. It is `GET` or `POST /api/cron/tick` with the header `Authorization: Bearer <CRON_SECRET>`, where CRON_SECRET is an environment variable; a missing or wrong header gets 401 "Unauthorized" and nothing runs.
1. **Daily work**, once per date: when now is 08:00 or later in the team zone and last_daily_run_at is empty or on an earlier date there:
   - **Due soon.** For each published, verified card that is due soon (section 6) and whose reminder_sent_for isn't its verified_until: queue review_due to the owner and set reminder_sent_for to verified_until.
   - **Overdue.** For each published card with an interval, an active owner, today after verified_until, and overdue_sent_for not equal to verified_until: queue review_overdue and set overdue_sent_for to verified_until.
   - Delete SearchLog rows older than 90 days. Set last_daily_run_at to now.
2. **Retry** notifications that are queued or failed and have fewer than 5 attempts.

The markers mean each card gets at most one reminder and one overdue notice per review cycle; verifying clears them. A missed day is not caught up: the next daily run sends whatever is due then. Running the job twice in a day sends nothing new.

## 14. Edge cases

- An owner leaves: deactivating them makes their cards "Needs a new owner" (section 6, rule 1). Insights lists them under the inactive owner until an admin changes the owner.
- An editor is removed from a collection: their cards there show "Needs a new owner: … is no longer an editor of …" (R3).
- A collection is narrowed to one team (R3 permitting): people outside it lose the cards at once, in search, Slack and notifications; their follows and flags stay but have no effect for them.
- Two editors edit the same card: the second save gets the R6 version message and nothing is saved.
- Someone flags a card while its owner is publishing a fix: if the owner ticks "Verify now", the new flag is resolved too. The person who flagged is told and can flag again.
- A card is archived while flagged: the flags are resolved as archived and the people who flagged are told.
- A restored card stays Unverified until its owner verifies it, even if its review date is in the future.
- A search for something only in a restricted collection, by someone who can't see it, is logged with 0 results. The log never says who searched or what the hidden card is.
- A Slack user who is linked but inactive gets the "isn't linked" reply.
- Someone signs in whose email isn't in People, or who is inactive: "Ask an admin to add you."

## 15. Seed data

Company: Pinecrest Software, a 10-person software company. Time zone America/New_York. Reset sets the clock to Wed 14 Oct 2026, 09:00 New York time. Seed actions happen at 10:00 New York time on the dates shown unless a time is given. last_daily_run_at is empty (the job has never run), and the outbox is empty.

| Person | Email | Team | Admin | Slack user ID |
|---|---|---|---|---|
| Dana Ruiz (COO) | dana@pinecrest.example | Operations | yes | U0DANA |
| Ana Lima (Finance and People lead) | ana@pinecrest.example | Operations | no | U0ANA |
| Ben Cho (IT lead) | ben@pinecrest.example | Operations | yes | U0BEN |
| Sam Okafor (Engineering lead) | sam@pinecrest.example | Engineering | no | U0SAM |
| Jo Park (Engineer) | jo@pinecrest.example | Engineering | no | U0JO |
| Rosa Quinn (Sales lead) | rosa@pinecrest.example | Sales | no | U0ROSA |
| Lee Park (Account executive) | lee@pinecrest.example | Sales | no | U0LEE |
| Priya Nair (Support lead) | priya@pinecrest.example | Support | no | U0PRIYA |
| Tom Bennett (Support specialist) | tom@pinecrest.example | Support | no | U0TOM |
| Maya Chen (Designer) | maya@pinecrest.example | Design | no | none |
| Kai Brooks (former IT contractor) | kai@pinecrest.example | Operations | no | none; inactive |

| Collection | Visibility | Editors |
|---|---|---|
| IT & Accounts | everyone | Ben Cho, Sam Okafor, Kai Brooks (inactive) |
| People & Policies | everyone | Ana Lima, Dana Ruiz |
| Sales playbook | Sales | Rosa Quinn, Lee Park |
| Finance | Operations | Ana Lima |

Cards (body lines are separated by " / "; each line is its own line in the body):

| Card | Collection | Status | Owner | Interval | Title; alternate questions; tags; body |
|---|---|---|---|---|---|
| KB-101 | IT & Accounts | published | Ben Cho | 90 | "How do I connect to the VPN?"; "VPN not working", "Tailscale setup"; vpn, remote; "Install Tailscale from tailscale.com/download. / Sign in with your company Google account. / If your laptop isn't listed, message Ben Cho." |
| KB-102 | IT & Accounts | published | Ben Cho | 180 | "How do I reset my laptop password?"; "Locked out of my laptop"; laptop, password; "Restart the laptop and click Forgot password on the sign-in screen. / If that fails, message Ben Cho." |
| KB-103 | IT & Accounts | published | Ben Cho | 30 | "What is the office Wi-Fi password?"; none; wifi, office; "The network is Pinecrest-Guest. / The password is on the board by reception and changes on the first Monday of each month." |
| KB-104 | IT & Accounts | published | Ben Cho | 90 | "Who approves software purchases?"; "Can I buy a software subscription?"; software, purchasing; "Under $500 a year: your team lead approves. / $500 a year or more: send the quote to Ana Lima in Finance." |
| KB-105 | People & Policies | published | Ana Lima | 90 | "How do I submit an expense?"; "How do I get reimbursed?"; expenses, reimbursement; "Upload the receipt in Brex within 30 days. / Meals are reimbursed up to $50 per person." |
| KB-106 | People & Policies | published | Ana Lima | 365 | "How many vacation days do I get?"; "How much PTO do I have?"; vacation, pto, leave; "Everyone gets 20 vacation days a year, plus public holidays. / Book them in the Time-Off Tracker." |
| KB-107 | Sales playbook | published | Rosa Quinn | 90 | "What discount can we offer on annual plans?"; none; discount, pricing; "Up to 15% off an annual plan. / Anything above 15% needs Rosa Quinn's approval." |
| KB-108 | Finance | published | Ana Lima | 180 | "What is each team's card spending limit?"; none; card, budget; "Each team lead's card has a $2,000 monthly limit. / Ana Lima can raise it for one month." |
| KB-109 | People & Policies | published | Dana Ruiz | doesn't expire | "How do I book a meeting room?"; none; rooms, office; "Use the Rooms calendar in Google Calendar. / Rooms are first come, first served." |
| KB-110 | People & Policies | draft | Ana Lima | 90 | "How do I get a parking pass?"; none; parking, office; "Ask Dana Ruiz for a pass. / Passes last until the end of the year." |
| KB-111 | IT & Accounts | archived | Ben Cho | 90 | "Where is the old shared drive?"; none; drive; "The old shared drive moved to Google Drive in June." |
| KB-112 | IT & Accounts | published | Kai Brooks | 180 | "How do I set up two-factor sign-in?"; "Two-factor setup"; security, 2fa; "Install Google Authenticator on your phone. / Scan the code on your laptop's account page." |

History (each card has the versions and events its history implies; version 1 has no change note):
- KB-101: version 1 published Mon 6 Jul by Ben with the body "Install Cisco AnyConnect from the Self Service app. / Sign in with your company email and password." Priya Nair flagged it Mon 12 Oct at 15:00: "Cisco AnyConnect stopped working for me." Ben published version 2 (the body above) on Tue 13 Oct with the note "Moved from Cisco AnyConnect to Tailscale" and verified it at the same time, which resolved Priya's flag. Followers: Jo Park, Lee Park.
- KB-104: version 1 published and verified by Ben Mon 3 Aug with the body "Your team lead approves software purchases. / Send receipts to Ana Lima." Sam Okafor published version 2 (the body above) on Tue 13 Oct at 11:30 with the note "Added the $500 yearly limit", so needs_verification is edited by Sam at that time.
- KB-105: open flag by Jo Park, Mon 12 Oct: "The meal limit changed to $60 in October."
- KB-110: draft created by Ana Lima Tue 13 Oct. KB-111: archived by Ben Mon 5 Oct.
- Every other published card has one version, published and verified by its owner on its verified date: KB-102 Mon 20 Jul, KB-103 Fri 4 Sep, KB-105 Mon 14 Sep, KB-106 Thu 8 Jan, KB-107 Mon 27 Jul, KB-108 Mon 5 Oct, KB-109 Mon 2 Mar, KB-112 Mon 6 Apr (by Kai). KB-111 was published and verified Mon 2 Feb. All dates are in 2026.

Resulting verified_until: KB-101 Mon 11 Jan 2027, KB-102 Sat 16 Jan 2027, KB-103 Sun 4 Oct, KB-104 Sun 1 Nov, KB-105 Sun 13 Dec, KB-106 Fri 8 Jan 2027, KB-107 Sun 25 Oct, KB-108 Sat 3 Apr 2027, KB-109 empty, KB-112 Sat 3 Oct. reminder_sent_for and overdue_sent_for are empty on every card.

SearchLog (all with 0 results): "parking pass" Mon 12 Oct, Tue 13 Oct at 09:00 and Tue 13 Oct at 14:00; "payroll date" Fri 9 Oct and Tue 13 Oct; "dental plan" Wed 7 Oct and Mon 7 Sep (older than 30 days, so Insights doesn't count it).

## 16. Build plan

Send these prompts one at a time after pasting this file. Each phase ends with checks you can run by clicking through the app. Start each phase's checks from a fresh load of the seed (the reset button); checks within a phase run in order on the same data.

### Phase 1: Foundation

```
Using the Internal Knowledge Base blueprint above, build Phase 1 only.

1. Set up the data model from section 5 exactly (Settings, Team, Person, Collection with its team and editor rows, Card, CardVersion, Flag, Follow, CardEvent, SearchLog, Notification) with a real database.
2. Add sign-in. Use the platform's built-in auth or Google sign-in limited to our company email domain. A signed-in email must match an active Person; anyone else sees "Ask an admin to add you."
3. Build Admin → People (with teams) and Admin → Collections (section 10, screens 7 and 8). Only admins can open them ("Admins only" for everyone else), and the server refuses admin actions from anyone else. Enforce R3 and R15. Leave out the Slack linking button for now.
4. Load the seed data from section 15 exactly, including every card version, flag, follow, event and SearchLog row, with one script that the reset button also runs.
5. Add the development toolbar from section 13: sign in as, the clock (every server-side read of the current time must use it) and "Reset to seed data". None of it may exist or respond in production.

Do not build the card screens or search yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Dana, Admin → People lists 11 people: 10 active and Kai Brooks inactive, with the teams from section 15, Dana Ruiz and Ben Cho as admins, and Maya Chen's Slack shown as "not linked".
- [ ] Signed in as Jo, Admin → People shows "Admins only" (also when opened by URL) and a direct request to save a person is refused.
- [ ] Admin → Collections lists IT & Accounts (everyone; Ben Cho, Sam Okafor, Kai Brooks (inactive)), People & Policies (everyone; Ana Lima, Dana Ruiz), Sales playbook (Sales; Rosa Quinn, Lee Park) and Finance (Operations; Ana Lima).
- [ ] Adding Jo Park as an editor of Sales playbook is refused with "Jo Park can't see Sales playbook, so they can't edit it." Changing Finance to be visible to Sales only is refused with "Ana Lima edits Finance and couldn't see it any more. Remove her as an editor first."
- [ ] Deleting the Sales team is refused with "Sales has 2 people and is used by 1 collection, so it can't be deleted.", and deleting IT & Accounts with "IT & Accounts has 6 cards, so it can't be deleted."
- [ ] Dana removes Ben's admin flag, and removing her own is refused with "At least one active admin is needed." Deactivating Tom Bennett works, and signing in as Tom then shows "Ask an admin to add you."
- [ ] The toolbar shows "Today: Wed 14 Oct 2026, 09:00 (America/New_York)" and "+1 day" changes it to Thu 15 Oct. "Reset to seed data" sets it back, makes Ben an admin again and Tom active again.

### Phase 2: Cards, trust and flags

```
Using the Internal Knowledge Base blueprint above, build Phase 2 only.

1. Build the Card page, Collections, the Card editor and My cards (section 10, screens 2 to 5), with Markdown shown as R16 says.
2. Implement the trust calculation and verification score in section 6 as one pure server-side function, with unit tests for every row of the worked examples and the time zone example. Use it everywhere trust or a score is shown (R12).
3. Implement every action in section 7 except notifications, with R1, R2 and R4 to R11 and the events in R19, enforced on the server. Do the version check in R6 inside the same transaction as the save.
4. Build History with Compare (a line-by-line diff) and Activity on the Card page.

Write no notifications yet. When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks** (sign in as each person with the development toolbar)
- [ ] Signed in as Jo, Collections shows "IT & Accounts · 5 cards · 2 verified (40%)" and "People & Policies · 3 cards · 2 verified (67%)", and not Sales playbook or Finance; opening KB-107 by URL shows "Not found". Signed in as Lee, Sales playbook also shows "1 card · 1 verified (100%)".
- [ ] KB-101 shows "Verified by Ben Cho on Tue 13 Oct · next review by Mon 11 Jan 2027" and "Updated Tue 13 Oct by Ben Cho: Moved from Cisco AnyConnect to Tailscale". History lists version 2 and version 1, and Compare marks "Install Cisco AnyConnect from the Self Service app." with "-" and "Install Tailscale from tailscale.com/download." with "+".
- [ ] KB-103 shows "Review was due Sun 4 Oct.", KB-104 "Edited by Sam Okafor on Tue 13 Oct. Waiting for Ben Cho to verify.", KB-105 "Flagged by Jo Park on Mon 12 Oct: The meal limit changed to $60 in October.", KB-109 "Verified by Dana Ruiz on Mon 2 Mar · doesn't expire" and KB-112 "Needs a new owner: Kai Brooks is inactive."
- [ ] Signed in as Sam, KB-104 has no Verify button and a direct request to verify it is refused with "Only the card's owner, Ben Cho, can verify it." Signed in as Ben, Verify makes it "Verified by Ben Cho on Wed 14 Oct · next review by Tue 12 Jan 2027", and Collections shows "IT & Accounts · 5 cards · 3 verified (60%)".
- [ ] Signed in as Tom, flagging KB-106 with "Is this still 20 days after the new policy?" makes it "Flagged by Tom Bennett on Wed 14 Oct: Is this still 20 days after the new policy?". Flagging it again is refused with "You already flagged this card." Signed in as Ana, a direct request to flag KB-106 is refused with "You own this card. Edit or verify it instead."
- [ ] Signed in as Ana, publishing an edit of KB-105 without a change note is refused with "Say what changed in 3 to 200 characters." With the body changed from $50 to $60, the note "Meal limit is now $60" and "Verify now" ticked, it becomes version 2, shows "Verified by Ana Lima on Wed 14 Oct · next review by Tue 12 Jan 2027", and Jo's flag shows as resolved.
- [ ] Signed in as Sam, the editor for KB-102 has no "Verify now". After he publishes an edit with the note "Added the sign-in screen steps", KB-102 shows "Edited by Sam Okafor on Wed 14 Oct. Waiting for Ben Cho to verify." and its Activity lists the update by Sam Okafor.
- [ ] Signed in as Jo, opening the draft KB-110 by URL shows "Not found". Signed in as Ana, she publishes it as its owner with "Verify now" ticked: it shows Verified, and Collections shows "People & Policies · 4 cards · 3 verified (75%)".
- [ ] Signed in as Dana, a direct request to make Jo Park the owner of KB-112 is refused with "Jo Park isn't an editor of IT & Accounts." Changing its owner to Ben Cho shows "Not verified yet. Waiting for Ben Cho." Signed in as Ben, archiving KB-103 removes it from the IT & Accounts list and its page shows "Archived on Wed 14 Oct by Ben Cho."; restoring it shows "Restored on Wed 14 Oct. Waiting for Ben Cho to verify."

### Phase 3: Search, Insights and export

```
Using the Internal Knowledge Base blueprint above, build Phase 3 only.

1. Build Search with Recently changed (section 10, screen 1) and the word, term, matching and ranking rules in section 8 as one pure server-side function, with unit tests for every row of the worked examples.
2. Write SearchLog rows exactly as R14 says, and nowhere else (R18).
3. Build Insights (screen 6) and Admin → Export (screen 10). Both are admin-only on the server.

When you're done, list what you built and anything in the spec you had to interpret.
```

**Acceptance checks**
- [ ] Signed in as Jo, Search with an empty box shows Recently changed starting with "KB-104 Who approves software purchases? · Tue 13 Oct · Sam Okafor · Added the $500 yearly limit", then KB-101 with "Moved from Cisco AnyConnect to Tailscale", and ending with "KB-106 How many vacation days do I get? · Thu 8 Jan · Ana Lima · Published" as the 10th line (archived KB-111 is never listed).
- [ ] Signed in as Jo, "vpn not working" returns only KB-101, and "password" returns KB-102 and then KB-103, which shows "Review was due Sun 4 Oct."
- [ ] Signed in as Jo, "laptop" returns KB-102, KB-101 and KB-112 in that order, and "office" returns KB-103 and then KB-109, without KB-110.
- [ ] Signed in as Jo, "How do I get reimbursed for meals?" returns only KB-105, "Wi-Fi" returns KB-103, and "the and of" shows "Type a word to search for."
- [ ] Signed in as Jo, "discount" shows "No cards match "discount"." Signed in as Lee, "discount" returns KB-107.
- [ ] Signed in as Dana, Insights shows 6 of 10 verified (60%) with IT & Accounts 40%, People & Policies 67%, Sales playbook 100% and Finance 100%; Needs review lists Ana Lima: KB-105, Ben Cho: KB-103 and KB-104, and Kai Brooks (inactive): KB-112; Searches with no results lists parking pass 3, payroll date 2, discount 1 and dental plan 1, in that order, with no names.
- [ ] Signed in as Ben, "shared drive" shows "No cards match "shared drive"." even though KB-111 is archived in his collection. Signed in as Dana, Export downloads a Cards CSV with 12 rows: KB-103 has trust unverified, trust_reason "Review was due Sun 4 Oct." and verified_until 2026-10-04, KB-101 has verified_at 2026-10-13T14:00:00Z, and KB-110 has status draft, empty trust and version 0.

### Phase 4: Notifications, review reminders and Slack

```
Using the Internal Knowledge Base blueprint above, build Phase 4 only.

1. Write and send every notification in section 11 through the outbox, for the actions built in Phase 2, with R13 and R17. Email can use any provider we have; if none is configured, mark emails "logged". Build Admin → Outbox (section 10, screen 9).
2. Build the scheduled job in section 13 at /api/cron/tick with the Authorization header described there. Add "Run scheduled job now" to the development toolbar; it runs the same job with the development clock.
3. Build the Slack command in section 12 exactly: signature check, person lookup, help, search and post. Add Link Slack accounts to Admin → People, and the "Slack command tester" to the development toolbar. Add tests for a valid signature, a wrong signature and an old timestamp.

When you're done, list what you built and anything in the spec you had to interpret. Tell me the exact Slack app settings I need to enter.
```

**Acceptance checks** (read the outbox in Admin → Outbox, signed in as Dana)
- [ ] A request to /api/cron/tick without the Authorization header gets 401. "Run scheduled job now" at the seed clock adds one email, to Ben Cho: "KB-103 is overdue for review (due Sun 4 Oct)", with status logged. Running it again adds nothing.
- [ ] Set the clock to Mon 19 Oct 2026, 09:00 and run the job. The outbox gains exactly one email, to Rosa Quinn: "KB-107 needs review by Sun 25 Oct".
- [ ] In the Slack command tester, as Jo Park, "vpn not working" gets HTTP 200 with response_type ephemeral, "1 card matches "vpn not working":" and "KB-101 How do I connect to the VPN? · Verified". The request "payroll date" sent with "Wrong signature" gets 401, and so does one with "Timestamp 10 minutes old".
- [ ] In the tester, as Jo Park, "discount" replies "No cards match "discount"." and "post KB-101" replies with response_type in_channel and the line "Verified by Ben Cho on Tue 13 Oct". As Lee Park, "post KB-107" replies "KB-107 is in a collection not everyone can see, so it can't be posted to a channel." As an unlinked Slack user, any text replies "Your Slack account isn't linked to the knowledge base. Ask an admin to link it in Admin → People."
- [ ] Signed in as Tom, flagging KB-106 adds "Tom Bennett flagged KB-106: How many vacation days do I get?" for Ana Lima. Signed in as Ana, verifying KB-106 adds "Ana Lima verified KB-106 after your flag" for Tom Bennett.
- [ ] Signed in as Ben, publishing an edit of KB-101 with the note "Added the Linux client", "Verify now" and "Notify followers" ticked adds "KB-101 updated: How do I connect to the VPN?" for Jo Park and Lee Park, and nothing for Ben.
- [ ] Signed in as Sam, publishing an edit of KB-102 adds "Sam Okafor edited KB-102. Please verify it." for Ben Cho. Signed in as Dana, Link Slack accounts with no SLACK_BOT_TOKEN set shows "Slack isn't configured. Set SLACK_BOT_TOKEN first."
- [ ] Signed in as Dana, Insights now lists discount with 1 search (from the tester), and payroll date still with 2, because the request with the wrong signature wrote nothing.

## 17. Variations

- AI answers drafted from verified cards only, always shown with the cards they came from.
- Folders inside collections, and groups that cut across teams.
- Announcements: send a changed card to a team and track who confirmed reading it.
- Create a card from a Slack message or thread with a message shortcut.
- Comments on highlighted text, with @mentions.
- Moving cards between collections, with a check that the owner can edit the new one.
- View counts, to find the most-read unverified cards first.
- Scheduled publishing and an approval step before publishing.
