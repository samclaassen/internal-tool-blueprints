---
name: aeo-explainer-video
description: |-
  Turn one question people ask AI assistants about the brand's market into a 1.5–3 minute narrated YouTube explainer plus a vertical Short: an AI-avatar hook clip of the host (HeyGen), narration in the host's cloned voice, curated openly licensed photos and video clips (plus the brand's own media) with Ken Burns moves, a reusable outro, thumbnail, captions, chapters and AEO-optimised metadata. Publishes on the brand channel and embeds each video with VideoObject data on the matching site page.
---

# AEO Explainer Video: Woodridge Cabinets

## Woodridge Cabinets setup (read this first)

This copy of the kit is set up for **Woodridge Cabinets** (woodridgecabinets.com), a custom cabinet maker in Boulder County, CO, that builds on a CNC. `brand.json` in this skill holds the real values. Copy it next to the scripts (or set `BRAND_JSON`).

- **Host:** Sam Claassen. HeyGen digital twin look `5dc505d993b242e7a5159cd36198eaca` (Avatar V), voice clone `872d0d36d8eb44e1809eb29bbb1b6c3f`. This is the same HeyGen account and wallet as the Personal Software Factory videos, so both channels spend from one balance.
- **HeyGen:** the space's "HeyGen" custom API connection (X-Api-Key). Run `heygen.py` in the foreground through `run_integration_command` on that connection.
- **YouTube:** a **new Woodridge Cabinets channel** with its own YouTube custom API connection. The existing "YouTube" connection is authorised for the Personal Software Factory channel. **Never upload Woodridge videos through it.** Before any upload, call `channels.list?mine=true` and confirm the title is Woodridge Cabinets and the id matches `brand.json` youtube.channel_id. If they don't match, stop.
- **Media:** the public repo `samclaassen/internal-tool-blueprints`, `media` branch, always under the `woodridge/` prefix: `woodridge/audio/<slug>-v1`, `woodridge/video/<slug>-v1`, `woodridge/video/host/`, `woodridge/video/shorts/<slug>-v1`. The site repo is private, so it can't serve media. The music bed (`audio/music/chill-wave-kevin-macleod.mp3`) and Sam's badge photo (`video/host/sam-photo.jpg`) are shared with Software Factory.
- **Site:** the private repo `samclaassen/woodridge-cabinets` (Next.js, `src/app`, routes in `src/lib/routes.ts`, JSON-LD in `src/components/JsonLd.tsx`, `llms.txt` route). Read `AGENTS.md` before changing code. One-time setup: add `src/lib/videos.ts` (video registry) and a `VideoEmbed` section that renders the YouTube embed, the transcript, `VideoObject` JSON-LD and a "Watch on YouTube" link on the page each video answers. List videos in `llms.txt`. Ship it through a PR. Never commit straight to main.
- **Timezone:** America/Denver. **Cadence:** long videos publish Mon, Wed and Fri at 09:00 MT, and each video's Short publishes at 13:00 MT the same day.
- **Brand look:** warm paper `#faf6f0`, ink `#231a14`, oak accent `#b48b58`. Inter text (the site's headings are Fraunces). Series label "CABINET GUIDE". The composition template's BRAND block and media URLs are already filled in.
- **Spoken domain:** "woodridge cabinets dot com". **Outro** (make once, ~$0.70): `heygen.py clip "The full guide is free at woodridge cabinets dot com. I'm Sam, I build cabinets in Boulder County. See you next time." outro.mp4`. Then loudnorm it, stage it to `woodridge/video/host/outro-norm.mp4` and update `outro_clip_url`.

### Woodridge question sources (priority order)
1. Guides on the site with no video yet: `/guides/custom-cabinet-cost/`, `/guides/custom-vs-semi-custom-vs-stock/`, `/guides/frameless-vs-face-frame/`, `/guides/stock-cabinet-filler-strips/`, `/guides/cnc-made-cabinets/`, `/guides/matching-cabinets-every-room/`, plus any new guide in `src/lib/routes.ts`.
2. Single questions answered on `/faq/`, `/packages/`, `/process/` and the room pages (kitchen, vanities, mudroom, pantry), one question per video.
3. PromptWatch prompts where Woodridge isn't cited (see the AEO Master Doc in this space), but only when a site page already answers them.
Don't make a video for a page that doesn't exist yet. Area pages (Longmont, Boulder, etc.) are low priority: use them only for a real local question, e.g. Marshall Fire rebuild cabinets in Louisville or Superior.

### Woodridge formats
Approved for now: **explainer / "how to tell"**, **X vs Y comparison**, **what it really costs**. Each new format still needs one render that Sam approves: **mistakes to avoid**, **how it's made (CNC)**. Rotate through them.

### Woodridge facts and visual rules
- Prices only as published on the site: Essential from $750/ft, Select from $1,050/ft, Signature from $1,450/ft, installed, with pulls and knobs included. A typical 20 ft kitchen is about $15,000, $21,000 or $29,000. Third-party ranges only with the source and month the page gives (e.g. HomeGuide, checked October 2026). Re-read the page each run, because prices can change.
- Service area: Longmont, Boulder, Louisville, Lafayette, Erie, Niwot, Superior. Never claim jobs, reviews, years in business, certifications or a showroom that the site doesn't state.
- Sam approved (2026-10-27) using the site's illustrative example photos (`public/images/*.jpg` in the site repo: hero-kitchen, vanity, mudroom, pantry, cnc-shop, drawer-detail) when they help. Every such shot carries the on-screen credit "Illustrative example", and the narration never calls them Woodridge jobs or "our kitchens". Mix them with real, openly licensed photos and clips (CNC routers cutting plywood, Shaker doors, frameless vs face-frame boxes, Blum hinges, filler strips, kitchens) with credits. When Sam supplies real shop or job photos, use them with the credit "Photo: Woodridge Cabinets".
- No AI-generated images presented as real. No competitor logos, and no images from Home Depot, IKEA or other retailers.
- CTA scene: "Get an instant estimate at woodridge cabinets dot com", with the page URL on screen.

### State
Space data key `woodridge/video/status` (F entries for long videos, S entries for Shorts) and `woodridge/video/queue` (an optional ordered list of question slugs).

---


Generalised from a working daily pipeline (one long video a day at 09:00, its Short at 13:00, every video embedded on the page it answers). That project showed real build footage; this version is for brands **with no product footage**: every visual is either the brand's own photo/video or a **curated, openly licensed asset with a credit line**. The goal is the same: get the brand's pages and videos cited by AI answer engines (ChatGPT, Perplexity, Google AI Overviews, Gemini) and get YouTube views.

Format of every video: **host hook clip (AI avatar, ~8 s) → narrated scenes over curated visuals and simple cards → host outro clip (reused)**. Every Short opens with the same hook.

## Files

| File | What it does |
|---|---|
| `brand.example.json` | Copy to `brand.json` and fill in. Every script reads it (`$BRAND_JSON`, `./brand.json` or `../brand.json`). |
| `scripts/curate_media.py` | **New.** Searches Openverse + Wikimedia Commons (no key) and Pexels/Pixabay (optional keys) for images and video clips, makes a numbered contact sheet, downloads picks, keeps `credits.json`, prints the credit block. |
| `scripts/draw_rects.py` | **New.** Draws Ken Burns target rects + a pixel grid on a full-size image so you can check them. |
| `template/src/index.tsx`, `template/package.json` | **New.** Data-driven Remotion composition: host card intro, scenes of type `shots` (photos with Ken Burns towards an exact rect, or video clips), `stats`, `list`, `compare`, `cta`, host card outro, music bed, per-shot credit line. Edit only the BRAND and DATA blocks. |
| `scripts/heygen.py` | Host voice (`tts` → per-scene MP3s + `timeline.json` + `words.json`) and avatar clips (`clip`), `balance`. HeyGen API v3. |
| `scripts/voiceover.py` | Free fallback narration (Kokoro TTS) with the same output format. |
| `scripts/align.py` | One continuous narration take → per-scene MP3s + timeline (if the voice comes from a single video). |
| `scripts/stage_media.py` | Pushes files to the `media` branch of a public GitHub repo and prints raw (CORS-open) URLs for Remotion. |
| `scripts/make_short.py` | Builds the 1080x1920 Short from the long render, the hook, the outro and narration, with burned-in captions. |
| `scripts/thumbnail.mjs` | 1280x720 thumbnail in brand style from a small JSON spec (needs `playwright-core` + Chromium). |
| `scripts/yt_upload.py` | Resumable YouTube upload, schedule (`publishAt`), thumbnail, playlists. |
| `scripts/bg_cut.py`, `scripts/cutaways.py` | Optional host cutaways mid-video (costs extra avatar time; skip in scheduled runs). |
| `fallback-browser-upload/` | Upload through YouTube Studio in a browser if the API route is unavailable. |
| `AUTOMATION.md` | The daily scheduled-task instructions to paste into the new project's automation. |

## One-time setup per project

1. **brand.json**: name, domain (and how it is spoken: "legacy homeware dot com"), series label, host name, colours, fonts, HeyGen voice and look ids, YouTube channel id, media repo, music URL and credit. Mirror the colours/fonts in the BRAND block of `template/src/index.tsx`.
2. **Integrations** (Type custom API connections): HeyGen (`X-Api-Key`), YouTube Data API (OAuth bearer with `youtube.upload` + `youtube.force-ssl` scopes for captions). Run `heygen.py` and `yt_upload.py` inside `run_integration_command` on those connections (the key arrives as `$TYPE_CUSTOM_API_SECRET`; never print it). Optional: `PEXELS_API_KEY`, `PIXABAY_API_KEY` as environment variables for more video B-roll.
3. **Host avatar**: train a HeyGen digital twin of the host (2–5 min of clean, well-lit footage) and a voice clone. Use **engine Avatar V**; on the original project Avatar IV made the face look unnatural and Avatar III drifted out of frame. If the brand has no on-camera person, use a HeyGen stock avatar and say so in the disclosure.
4. **Media repo**: a public GitHub repo with a `media` branch (`audio/`, `video/`, `video/host/`, `video/shorts/`, `audio/music/`). Put the music bed there (e.g. a Kevin MacLeod CC BY track; keep its exact credit line).
5. **Reusable outro**: `heygen.py clip "The full guide is free at {domain spoken}. I'm {host}. See you tomorrow." outro.mp4`, loudnorm it (below), stage it to `video/host/outro-norm.mp4`, put its URL in brand.json.
6. **Site**: a video registry (e.g. `lib/videos.ts` or a JSON file) that renders the YouTube embed, the transcript and `VideoObject` JSON-LD on the page the video answers, and lists videos in `llms.txt`/sitemap. Build this once in the project's site repo.
7. **Fonts for the Pillow scripts**: copy the brand TTFs into `~/.fonts` and `fc-cache -f`.

## 1. Pick the question (this is the AEO part)

Each video answers **one question people actually ask AI assistants or search**, and that answer must already live (or be published the same day) on a page of the site. Sources, best first:
- The site's own question/answer content (FAQ, guides, answer JSON) that has no video yet.
- PromptWatch (or similar) prompts where the brand is not cited yet, if connected.
- Google autocomplete / "People also ask" / Reddit threads for the topic (directional only: autocomplete is not search volume).

Good formats for brands without product footage (pick per market, rotate):
- **Explainer / "how to tell"**: "How to tell if a doorknob is original Victorian", "What is wabi-sabi?"
- **Comparison**: "X vs Y: which should you choose?" (two-panel `compare` card + photos of each)
- **Buying guide / cost**: "What does X really cost?" (only verified prices with source and month)
- **Mistakes / checklist**: "5 mistakes when buying X" (`list` card + one photo per item)
- **History / origin**: "Why do old houses have X?" (archival and public-domain imagery shines here)

Title formula: put the exact question or the "<thing> vs <thing>" phrase first, then the promise: "How to tell if a doorknob is original: 5 checks (Victorian to Art Deco)". Under 100 characters, front-load the words people type.

## 2. Script (6–10 scenes, 300–420 words ≈ 1:45–2:45)

Structure: **hook clip** (the host states the question and the one-line answer or the surprising fact, 20–25 words, ends with a hand-off like "Here's how to tell.") → scene 1 the direct answer in two sentences (answer engines quote this) → 3–6 scenes of evidence, steps or comparisons → what most people get wrong → a narrated CTA scene with the specifics → reused outro.

- The narration never repeats the hook's sentences.
- Numbers as words ("nineteen twenties"), short sentences, contractions fine.
- Every fact, date, price and claim must come from the site's page or a cited source. Never invent prices.
- Add `cues` per scene: exact phrases where a visual should change. `heygen.py tts` / `voiceover.py` reject cues not found in the text.
- Write the visual plan next to the script: for every scene, which kind (`shots`/`stats`/`list`/`compare`/`cta`) and, for shots, what each image must show. Then curate.

## 3. Curate the visuals (replaces product screenshots)

For each `shots` scene, find 1–3 visuals that **show exactly what the narration says** at that moment.

```bash
python3 scripts/curate_media.py search "victorian mortise lock doorknob" --kind image --n 12
python3 scripts/curate_media.py search "pouring concrete countertop" --kind video --n 8 --min-width 1280
# look at candidates.json.sheet.jpg (upload it and view it), then:
python3 scripts/curate_media.py fetch candidates.json --pick 3,7 --dir assets/<slug> --id-prefix scene2
python3 scripts/curate_media.py add brand-photo.jpg --dir assets/<slug> --credit "Photo: Brand Name"   # own media
python3 scripts/curate_media.py credits assets/<slug>/credits.json    # description credit block; exits 1 if incomplete
```

Rules (from the earlier projects, keep them):
- Only CC0, public domain, CC BY, CC BY-SA, Pexels/Pixabay licence, or the brand's own media. **Never NC/ND, never "all rights reserved", never images lifted from retailers or Google Images.**
- **No AI-generated imagery presented as real**, and no generic AI-looking stock. Real, credited, specific images only. Archival/public-domain photos are great for history topics.
- Reject watermarks, competitor logos, wrong era/style, low resolution (full-frame photos ≥1600 px wide; Flickr-via-Openverse is often 1024 px: fine only with a gentle push), recognisable faces in non-stock photos.
- Every asset keeps its credit line: shown on screen in the shot's lower-right corner (the template does this) and listed in the description.
- Aim for a visual change every 4–8 s. Mix photos and clips. Never leave a scene without a visual.
- Ken Burns rect: give each photo shot an exact `rect` `[x, y, w, h]` in the image's own pixels around the detail the narration names, check it with `python3 scripts/draw_rects.py img.jpg 700,300,400,300` and look at the output. The camera pushes from the full image until the rect fills about 70% of the frame, so it always lands on it. Never use percentage focus points.

Stage the picked files: `python3 scripts/stage_media.py <owner/repo> video/<slug>-v1 assets/<slug>/*.jpg assets/<slug>/*.mp4`.

## 4. Voice, hook and outro (HeyGen)

1. `python3 scripts/heygen.py balance` first. Avatar V clips cost about $0.06–0.12 per second (≈$0.65–0.85 per 8 s hook). Under $10: keep going but warn the owner with days left.
2. Hook: `python3 scripts/heygen.py clip "<hook text>" hook.mp4 --title "<brand> hook: <slug>"` (square 1080x1080). **Run in the foreground** (a background process loses the injected key). Look at 3 frames: eyes open, head steady, centred, whole head in frame; regenerate once if not.
3. Narration: `python3 scripts/heygen.py tts script.json tts/` (or `voiceover.py` for free Kokoro). Output: per-scene MP3s at −16 LUFS, `timeline.json`, `words.json`.
4. Loudness: HeyGen clips are ~4 dB quieter than tts narration. `ffmpeg -i hook.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 hook-norm.mp4`.
5. Stage: narration to `audio/<slug>-v1/` (with `script.json` and `timeline.json` for the transcript later), `hook.mp4` + `hook-norm.mp4` to `video/<slug>-v1/`.
6. **The hook is required on every long video and Short.** If it can't be made (balance, API failing twice), render and QA the rest but hold the upload and tell the owner. Never fall back to a narrator-only opening.

## 5. Composition and render

Copy `template/` to a working folder under the home directory (Type's `create_video_artifact` rejects source folders in the system tmp dir; pass a relative path). In `src/index.tsx` edit only:
- `BRAND` (from brand.json), `AUDIO`, `ASSETS`, `HOOK` (`frames` = hook seconds × 30), `OUTRO`, `MUSIC` (0.19 long-video bed; 0.11 was too quiet before).
- `TL` = `timeline.json` on one line.
- `VISUALS`: one entry per scene id. For shots: `{kind:"photo", src, w, h, rect, at, credit, label?}` or `{kind:"clip", src, from, at, credit}` (`at` in frames from scene start; use cue frames from `TL`). Cards: `stats`, `list`, `compare`, `cta` items appear on `sc.cues[i]`.
- `HOOK_CARD.line`: the question in 3–6 words beside the host.

Rules carried over: text in side-by-side cards aligns (fixed row heights, titles `nowrap`; shorten copy rather than wrap), nothing overlaps or is cut off, every scene has a visual for its whole length, voice and music always present.

Check syntax before rendering: `npx -y esbuild src/index.tsx --bundle --external:remotion --external:react`. Then `create_video_artifact` (title "<Topic>: explainer video") and `wait_video_artifact_render` (~8 min; call it twice at 300 s). If a render sits in "rendering" far past 15 min, push a new revision with `set_video_artifact_files` (add a comment line) to start a fresh one.

## 6. QA (every time, before any upload)

Contact sheet of frames (hook, every scene and every shot, outro), uploaded and viewed. Check: opens with the host hook and ends with the outro; host's whole head in the card and face natural; every Ken Burns push lands on the named detail; every image/clip matches its sentence; credit line visible on every curated shot; no text overlap, wrap or cut-off; voice and music audible (`ffmpeg -af volumedetect`: mean around −20 dB, music clearly under voice); every number/date/price matches the source page. Fix and re-render until it passes. Look at the thumbnail too.

## 7. Thumbnail

`thumb.json`: `title` 3–5 words (the question's key phrase), `kicker`, up to two `stats` (`ok`/`signal` tones), `shot` = the strongest curated image (its licence must allow it; credit it in the description). `node scripts/thumbnail.mjs thumb.json thumb.jpg` from a folder that has `playwright-core`.

## 8. YouTube metadata (AEO-optimised)

- **Title**: the question or comparison phrase first (see section 1), ≤100 characters.
- **Description**: first two lines = the direct answer in plain sentences with the key entity names (answer engines and YouTube snippets quote this). Then a 2–3 sentence summary; chapters (00:00 first and including the hook, one per scene, each ≥10 s; merge short scenes); a link to the matching site page (the one with the full written answer) and 1–2 related pages; the AI disclosure: "The on-camera intro and outro are an AI avatar of {host}, and the narration is {host}'s AI voice clone (HeyGen). Images and clips are credited below."; the **credits block** from `curate_media.py credits`; the exact music credit line.
- **Tags** 10–15: the topic, the question phrasings, the comparison terms, the category, the brand.
- `categoryId` from brand.json (26 Howto & Style, 27 Education, 28 Science & Technology, 19 Travel & Events, 22 People & Blogs), `defaultLanguage`/`defaultAudioLanguage`, `selfDeclaredMadeForKids: false`, `containsSyntheticMedia: true`, `embeddable: true`.
- **Captions**: an SRT from the exact spoken text (hook, scenes, outro) and the timeline, one cue per sentence; `captions.insert` (name "English", isDraft false). If the token lacks `youtube.force-ssl`, skip and tell the owner.
- **Playlists**: one per format and one per topic cluster; create missing ones (public, one-line description linking the site). `playlistItems.insert` can fail right after creating a playlist: list it, wait a few seconds, retry without a position.

## 9. Upload and schedule

`python3 scripts/yt_upload.py meta.json` inside the YouTube connection: private with `publishAt` (UTC) for the scheduled slot, with thumbnail and playlists. Confirm `privacyStatus` private + `publishAt` and processing succeeded. The API can't replace a file: to fix a video, upload the new one, confirm it, then delete the old one. An unaudited Google Cloud project can lock API uploads private: after publish time check `videos.list`, and if still private tell the owner to make it Public in Studio (or request the API audit).

## 10. Short (every long video)

35–55 s: the same hook clip → 2–3 freshly written narrated segments (the direct answer; the most surprising point; the verdict/CTA) → the outro. `heygen.py tts short_script.json tts/`. Footage: crops from the long render (`get_file_temporary_url` on its render file); pick `from` times from a stills sheet of the render (renders can drift ~2 s from the timeline) and a `crop` `[x,y,w,h]` (w ≈ 900–1500 in 1920x1080 px) that zooms on the image, leaving out the credit/caption line. `make_short.py short.json` (kicker = series label, title = the question ≤ ~28 chars, highlight key words, music 0.08). QA a ~7-frame contact sheet (captions inside frame, crops readable, badge shows the host). Title "<question>? #shorts", description links the full video and the page, plus disclosure and credits. Schedule 4 hours after the long video. Stage inputs to `video/shorts/<slug>-v1/`.

## 11. Put it on the site

After the publish time, when `videos.list` says public: add the video to the site's registry with id, current YouTube title, 2–3 sentence description, `uploadDate` (actual publish time with offset), ISO `duration`, the page slug, `transcript` (hook text, scene texts from `script.json`, outro text, in order) and credits (music + curated assets). The page renders the embed, the transcript and `VideoObject` JSON-LD. Build, test, ship, then load the live page and confirm the embed, transcript and "Watch on YouTube" link.

## State

Keep one space-data record per project (e.g. `<project>/video/status`): `F` entries for long videos (url, slug, page, format, title, publishAt, video artifact id, audio folder, hook path, playlists, captions, state `scheduled|posted|held`, note) and `S` entries for Shorts (url, slug, parent F, publishAt, state). Read it first; write it back with the version you read after every change. Never re-upload something already recorded.
