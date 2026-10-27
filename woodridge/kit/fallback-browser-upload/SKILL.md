---
name: youtube-upload-from-cloud-browser
description: |-
  Upload and publish a video to the signed-in YouTube channel from Type's cloud browser, without an API key or OAuth app. Use when a rendered video (for example a Type video artifact's MP4) needs to go on YouTube and the browser's file-picker upload fails with "File unreadable". Stages the file on a public GitHub repo's media branch, loads it into YouTube Studio as an in-page file, then sets title, description, audience and visibility.
---

# YouTube Upload from Cloud Browser

The cloud browser's file-picker upload (`browser/use` `stage_file` + `upload`) fails in YouTube Studio with "File unreadable". This skill avoids it: it puts the video somewhere the Studio page can download with CORS, builds a `File` in the page, and gives that to YouTube's uploader.

Proven on 2026-10-18 by publishing https://youtu.be/xJyAHBgxnkk to a brand channel.

## Prerequisites

- The cloud browser is signed in to the Google account that owns the channel. YouTube may ask "Verify it's you" (a phone prompt); hand that to the person with `browser/use` `handoff`, then continue.
- A public GitHub repo the `gh` CLI can push to (the `media_repo` in brand.json; files go on its `media` branch, never `main`).
- The video as a local file in the managed sandbox, under 100 MB. For a Type file, use `managed-sandbox/materialize_attachment` with its file ID.
- Approved title, description and visibility. Uploading publishes under the person's name; don't publish without their approval.

## 1. Stage the file

Materialize this skill (`managed-sandbox/materialize_skill`) and run, with the returned directory as `cwd`:

```
python3 stage_video.py <owner/repo> <local-video-path> <target-filename.mp4>
```

It prints `{"url": "https://raw.githubusercontent.com/<owner/repo>/media/<name>", "bytes": N}` once the raw URL serves the whole file (this can take a minute on a new branch). It refuses private repos, files of 100 MB or more, and unsafe filenames, and it doesn't commit an identical file twice.

## 2. Load the file into YouTube Studio

With `browser/use`, open `https://studio.youtube.com` (add `?authuser=N` if several Google accounts are signed in) and check the channel name. Then `eval`:

```js
fetch('<raw URL>').then(r => r.blob())
  .then(b => { window.__video = new File([b], '<name>.mp4', {type: 'video/mp4'}); return 'ok ' + b.size })
```

The size must match the `bytes` from step 1. Type's own temporary file URLs don't work here because they send no CORS header.

Open the uploader (the **Create** button, then **Upload videos**), then `eval`:

```js
(() => { const i = document.querySelector('input[type=file]'); const dt = new DataTransfer();
  dt.items.add(window.__video); i.files = dt.files;
  i.dispatchEvent(new Event('change', {bubbles: true})); return i.files[0].name })()
```

Within about 10 seconds the dialog shows "Upload complete" and a `youtu.be` link. Record that link straight away.

## 3. Details and publish

- **Title and description:** the fields are contenteditable `#textbox` elements. Click the title, press Control+A and Backspace, then `type`; click the description and `type`. Read both back with `eval` on `ytcp-uploads-dialog #textbox`.
- **Audience:** click "No, it's not made for kids" unless it is.
- **Next** three times to reach Visibility. Choose the approved visibility with `eval` (`document.querySelector('tp-yt-paper-radio-button[name=PUBLIC]').click()`; the names are `PRIVATE`, `UNLISTED` and `PUBLIC`), then click **Publish** (or **Save** for private).
- **Verify:** "Video published" appears in the dialog, and `curl "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<id>&format=json"` from the sandbox returns the title for a public video.

## Recovery

- If an upload attempt fails, close the dialog and check the Content list for a leftover draft with the same title before retrying. Never create duplicate uploads.
- If the Studio page can't fetch the raw URL, check that the repo is public and the raw URL returns 200 in the sandbox.
- If several Google accounts are signed in, confirm the channel in the account menu before uploading.

## Improving this skill

Reuse `stage_video.py`. If YouTube changes its upload dialog, update the selectors here after a working run. If a run finds a better hosting option or a new failure, update the script, re-run it on an existing file (it's idempotent), and save it.