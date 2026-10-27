#!/usr/bin/env python3
"""Upload a video (or Short) to the brand channel (brand.json youtube.channel_id) through the YouTube Data API and schedule it.

Run inside run_integration_command on the YouTube connection (TYPE_CUSTOM_API_SECRET is the OAuth bearer
token, sent verbatim in the Authorization header). Never print it.

Usage: yt_upload.py <meta.json>
meta.json:
{
  "file": "short.mp4",
  "short": true,                                  # only changes the printed URL
  "title": "...", "description": "...", "tags": ["..."], "categoryId": "28",
  "publishAt": "2026-10-24T20:00:00Z",          # omit to upload as private without a schedule
  "thumbnail": "thumb.jpg",                       # optional (long videos only; Shorts use a frame)
  "playlists": ["PL..."]                          # optional full playlist ids
}
Prints {"id", "url", "privacyStatus", "publishAt", "uploadStatus", "processing"} after confirming with videos.list.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request

TOKEN = os.environ["TYPE_CUSTOM_API_SECRET"]
API = "https://www.googleapis.com/youtube/v3"


def req(method, url, body=None, headers=None, raw=None):
    h = {"Authorization": f"Bearer {TOKEN}"}
    h.update(headers or {})
    data = raw if raw is not None else (json.dumps(body).encode() if body is not None else None)
    if body is not None and raw is None:
        h["Content-Type"] = "application/json; charset=UTF-8"
    r = urllib.request.Request(url, method=method, data=data, headers=h)
    try:
        with urllib.request.urlopen(r, timeout=600) as resp:
            return resp.status, dict(resp.headers), resp.read()
    except urllib.error.HTTPError as e:
        return e.code, dict(e.headers), e.read()


def main():
    meta_path = sys.argv[1]
    base = os.path.dirname(os.path.abspath(meta_path))
    m = json.load(open(meta_path))
    path = os.path.join(base, m["file"])
    size = os.path.getsize(path)
    status = {"privacyStatus": "private", "selfDeclaredMadeForKids": False, "containsSyntheticMedia": True, "embeddable": True}
    if m.get("publishAt"):
        status["publishAt"] = m["publishAt"]
    body = {"snippet": {"title": m["title"], "description": m["description"], "tags": m.get("tags", []),
                        "categoryId": m.get("categoryId", "28"), "defaultLanguage": "en", "defaultAudioLanguage": "en"},
            "status": status}
    assert len(m["title"]) <= 100, "title over 100 characters"
    code, hdrs, out = req("POST", "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status",
                          body=body, headers={"X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": str(size)})
    if code != 200:
        sys.exit(f"init failed {code}: {out[:400]!r}")
    loc = hdrs.get("Location") or hdrs.get("location")
    code, _, out = req("PUT", loc, raw=open(path, "rb").read(), headers={"Content-Type": "video/mp4"})
    if code not in (200, 201):
        sys.exit(f"upload failed {code}: {out[:400]!r}")
    vid = json.loads(out)["id"]
    if m.get("thumbnail"):
        tp = os.path.join(base, m["thumbnail"])
        c, _, o = req("POST", f"https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId={vid}",
                      raw=open(tp, "rb").read(), headers={"Content-Type": "image/jpeg"})
        print(f"thumbnail {c}", file=sys.stderr)
    for pl in m.get("playlists", []):
        for attempt in range(3):
            c, _, o = req("POST", f"{API}/playlistItems?part=snippet",
                          body={"snippet": {"playlistId": pl, "resourceId": {"kind": "youtube#video", "videoId": vid}}})
            if c == 200:
                break
            time.sleep(5)
        print(f"playlist {pl}: {c}", file=sys.stderr)
    info = {}
    for _ in range(20):
        c, _, o = req("GET", f"{API}/videos?part=status,processingDetails&id={vid}")
        it = json.loads(o).get("items", [{}])[0]
        info = {"id": vid, "url": f"https://youtube.com/shorts/{vid}" if m.get("short") else f"https://youtu.be/{vid}",
                "privacyStatus": it.get("status", {}).get("privacyStatus"), "publishAt": it.get("status", {}).get("publishAt"),
                "uploadStatus": it.get("status", {}).get("uploadStatus"),
                "processing": it.get("processingDetails", {}).get("processingStatus")}
        if info["uploadStatus"] == "processed":
            break
        time.sleep(15)
    print(json.dumps(info))


if __name__ == "__main__":
    main()
