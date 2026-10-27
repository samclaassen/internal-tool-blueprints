# Daily AEO video automation (paste into the new project's scheduled task)

Replace every {PLACEHOLDER}. Suggested schedule: daily, 10:30 in the owner's timezone. Attach the "AEO Explainer Video" skill to the space and mention it at the end of the instructions.

---

Goal: every day one fully optimised long explainer video goes live on the {BRAND} YouTube channel ({CHANNEL_HANDLE}, {CHANNEL_ID}) at 09:00 {TIMEZONE}, followed by a vertical Short at 13:00, and every published long video is embedded on the site page it answers on {DOMAIN}. The goal is AI-answer (AEO) visibility and YouTube views. {OWNER} approved this as a standing daily publish on {DATE}, so do not wait for per-video approval, except for the first video of each new format and the first video overall (render it, do not upload, and ask {OWNER} to approve it in the space). Every video must pass QA before upload.

Follow the "AEO Explainer Video" skill (aeo-explainer-video) for every step: question-first scripts, the host's Avatar V hook clip opening every long video and every Short, narration in the host's cloned voice (heygen.py tts), the reusable outro, curated openly licensed visuals with credit lines (curate_media.py) plus the brand's own media, Ken Burns rects checked with draw_rects.py, the template composition, QA, metadata, captions, playlists, Shorts and the site embed. Use the HeyGen custom API connection for heygen.py and the YouTube custom API connection for yt_upload.py and every other YouTube call (run_integration_command). brand.json lives at {BRAND_JSON_LOCATION}.

Hook required: every long video and every Short opens with an Avatar V hook clip of the host. Check `python3 heygen.py balance` at the start (≈$0.65–0.85 per hook, two hooks a day). Under $10, still make today's clips but say how many days are left and ask {OWNER} to top up. If a clip can't be made, render and QA everything else, set the entry to "held" (reason "no hook") and upload held items first on the next run.

Visuals: no AI-generated images presented as real, no NC/ND or all-rights-reserved assets, no images taken from retailers or search results. Every curated asset has its credit on screen and in the description. {BRAND-SPECIFIC VISUAL RULES, e.g. "period-correct archival images only for history topics", "show the brand's own product photos in the CTA scene"}.

State lives in space data key {PROJECT}/video/status: F entries for long videos, S entries for Shorts. Read it first and write it back (with the read version) after every change. Never re-upload or re-ship something already recorded as done.

## Part A: put published videos on the site
For every F entry with state "scheduled" whose publish time has passed:
1. `videos.list` (part=status,contentDetails,snippet). If public, continue. If still private after publishAt, don't ship; tell {OWNER} to set it Public in Studio (or that the API audit is needed) and note it on the entry.
2. In {SITE_REPO}, on a new branch, add the video to {VIDEO_REGISTRY_FILE}: id, current YouTube title, 2–3 sentence description, uploadDate (actual publish time with offset), duration, page slug, transcript (hook text, scene texts from the video's script.json, outro text), credits (music + curated assets).
3. Run the tests and build, open a PR "{Topic} video on its page", merge it, wait for the production deploy, then load the page and confirm the embed, transcript, VideoObject JSON-LD and "Watch on YouTube" link. Mark the entry "posted" with the PR number.
Also mark S entries whose publish time has passed as "posted" after checking they are public.

## Part B: make and schedule the next long video
1. Pick today's question (skill section 1): the highest-value question with a matching page on {DOMAIN} and no F entry yet. Priority: {QUESTION SOURCE, e.g. "content/answers/*.json with no video", "PromptWatch prompts where we aren't cited", "the topic queue in space data {PROJECT}/video/queue"}. Rotate formats per Part D. If nothing is left, skip Part B and say the queue is empty.
2. Facts only from the matching page and its cited sources. Never invent numbers, dates or prices.
3. Make the video (skill sections 2–5): script with cues and a visual plan, curated visuals with credits, hook clip, narration, staged media in new folders (audio/<slug>-v1, video/<slug>-v1), composition from the template, rendered as a Type video artifact titled "<Topic>: explainer video", and a thumbnail.
4. QA (skill section 6). Fix and re-render until it passes.
5. Metadata (skill section 8): question-first title ≤100 chars; first two description lines = the direct answer; chapters; page link; AI disclosure; credits block; music credit; 10–15 tags; categoryId {CATEGORY_ID}; language {LANG}; not made for kids; containsSyntheticMedia true.
6. Upload with yt_upload.py as private with publishAt = 09:00 {TIMEZONE} on the next day with no scheduled long video, with the thumbnail. Confirm status and processing.
7. Playlists: the format playlist and the topic-cluster playlist ({PLAYLIST NAMES}); create missing ones.
8. Captions from the exact spoken text (skill section 8).
9. Record the F entry: url, slug, page, format, title, publishAt, video artifact id, audio folder, hook path, playlists, captions yes/no, state "scheduled".

## Part C: Shorts
1. Make the Short for today's long video (skill section 10), reusing its hook and the outro; schedule 13:00 {TIMEZONE} on the long video's publish day. Record an S entry.
2. Backfill: if an earlier F video has no Short, make one for the oldest (new hook clip) and schedule it 17:00 on the next free day. At most one backfill a day.
3. QA every Short with a contact sheet before upload; it must open with the host's hook.

## Part D: formats
Formats for this market: {e.g. "explainer / how to tell", "X vs Y comparison", "what it really costs", "mistakes to avoid", "history / why"}. Approved now: {LIST}. Rotate day by day among approved formats. A new format's first video is rendered but not uploaded; ask {OWNER} to approve it ("approved" in the space).

## Finish
Post a short summary: what went live today (long + Short) and whether it is on its page (URL), the next video's title, link, publish time and artifact, Shorts scheduled, the HeyGen balance and today's spend, and anything {OWNER} must do (stuck-private video, held item, captions scope, format approval, top-up). If any step fails, stop before publishing anything unverified, leave notes on the F or S entry, and say what is blocked.

/aeo-explainer-video
