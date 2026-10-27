#!/usr/bin/env python3
"""Find, review and download openly licensed images and video clips for a video, with a credits manifest.

There is no product footage in these projects, so every visual is either the brand's own photo/video
(add it with `add`) or a curated, openly licensed asset from:
  openverse  - images, CC0 / public domain / CC BY / CC BY-SA (no key)
  wikimedia  - Wikimedia Commons images AND videos (webm/ogv), same licences (no key)
  pexels     - stock photos and videos, Pexels licence (needs $PEXELS_API_KEY)
  pixabay    - stock photos and videos, Pixabay licence (needs $PIXABAY_API_KEY)

Usage
  curate_media.py search "<query>" [--kind image|video] [--sources openverse,wikimedia,pexels,pixabay]
                         [--n 12] [--min-width 1600] [--out candidates.json]
      Appends candidates (url, preview, size, title, creator, licence, source page, attribution) to --out
      and builds <out>.sheet.jpg, a numbered contact sheet of the new candidates. LOOK at the sheet
      before picking: reject watermarks, visible logos, AI-looking images, wrong era/style, people's faces
      that aren't model-released stock, and anything that doesn't show what the narration says.

  curate_media.py fetch candidates.json --pick 3,7,12 --dir assets/ [--id-prefix scene2]
      Downloads the picked candidates (videos converted to H.264 MP4, max 1920 wide, no audio; images to
      JPEG max 2400 wide), and appends their entries to assets/credits.json.

  curate_media.py add <file> --dir assets/ --credit "Photo: Brand Name" [--source URL]
      Registers the brand's own photo or clip (licence "owned").

  curate_media.py credits assets/credits.json
      Prints the description-ready credit block (one line per asset, in order of use) and checks every
      entry has a licence, creator and source. Exit 1 if any is missing.

Licence rules: only licences listed in brand.json curation.allowed_licenses (default cc0, pdm, by, by-sa)
plus pexels/pixabay/owned. Never use NC or ND assets (videos are commercial and edited), never use
"all rights reserved" images found by search engines, never use AI-generated images as if they were real.
"""
import argparse
import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import brand  # noqa: E402
    CUR = brand.load().get("curation", {})
except SystemExit:
    CUR = {}
ALLOWED = set(CUR.get("allowed_licenses", ["cc0", "pdm", "by", "by-sa"]))
UA = "aeo-video-engine/1.0 (curation script; contact via repo)"


def get(url, headers=None, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def jget(url, headers=None):
    return json.loads(get(url, headers))


def norm_license(s):
    s = (s or "").lower().replace("cc ", "").replace("cc-", "").strip()
    if s in ("cc0", "zero", "cc0 1.0"):
        return "cc0"
    if "public domain" in s or s in ("pdm", "pd", "public domain mark"):
        return "pdm"
    s = re.sub(r"\s*\d(\.\d)?$", "", s).replace(" ", "-")
    return s


# ---------- sources ----------

def openverse(q, kind, n, minw):
    if kind != "image":
        return []
    lic = ",".join(x for x in ALLOWED if x in ("cc0", "pdm", "by", "by-sa"))
    url = ("https://api.openverse.org/v1/images/?" +
           urllib.parse.urlencode({"q": q, "license": lic, "page_size": min(n * 2, 40), "mature": "false"}))
    out = []
    for r in jget(url).get("results", []):
        if r.get("width") and r["width"] < minw:      # Flickr results are often 1024 wide: use --min-width 1000
            continue                                    # for Ken Burns insets, not full-frame shots
        out.append({"source": "openverse", "kind": "image", "url": r["url"], "preview": r.get("thumbnail") or r["url"],
                    "width": r.get("width"), "height": r.get("height"), "title": r.get("title") or "",
                    "creator": r.get("creator") or "unknown", "license": norm_license(r.get("license")),
                    "license_version": r.get("license_version"), "license_url": r.get("license_url"),
                    "page": r.get("foreign_landing_url") or r.get("url"), "attribution": r.get("attribution")})
    return out[:n]


def wikimedia(q, kind, n, minw):
    search = q + (" filetype:video" if kind == "video" else " filetype:bitmap")
    url = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search", "gsrnamespace": 6, "gsrsearch": search,
        "gsrlimit": min(n * 2, 40), "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata",
        "iiurlwidth": 640})
    pages = jget(url).get("query", {}).get("pages", {})
    out = []
    for p in sorted(pages.values(), key=lambda p: p.get("index", 0)):
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        val = lambda k: re.sub(r"<[^>]+>", "", md.get(k, {}).get("value", "")).strip()
        lic = norm_license(val("LicenseShortName"))
        ver = (re.findall(r"(\d\.\d)", val("LicenseShortName")) or [None])[0]
        if lic not in ALLOWED or (ii.get("width") or 0) < minw:
            continue
        out.append({"source": "wikimedia", "kind": kind, "url": ii.get("url"), "preview": ii.get("thumburl") or ii.get("url"),
                    "width": ii.get("width"), "height": ii.get("height"), "duration": ii.get("duration"),
                    "title": val("ObjectName") or p.get("title", ""), "creator": val("Artist") or "unknown",
                    "license": lic, "license_version": ver, "license_url": val("LicenseUrl"),
                    "page": ii.get("descriptionurl"), "attribution": None})
    return out[:n]


def pexels(q, kind, n, minw):
    key = os.environ.get(CUR.get("pexels_env", "PEXELS_API_KEY"))
    if not key:
        return []
    base = "https://api.pexels.com/videos/search?" if kind == "video" else "https://api.pexels.com/v1/search?"
    d = jget(base + urllib.parse.urlencode({"query": q, "per_page": min(n, 40), "orientation": "landscape"}),
             {"Authorization": key})
    out = []
    for r in d.get("videos" if kind == "video" else "photos", []):
        if kind == "video":
            files = sorted([f for f in r.get("video_files", []) if (f.get("width") or 0) >= minw and f.get("file_type") == "video/mp4"],
                           key=lambda f: f["width"])
            if not files:
                continue
            f = files[0]
            out.append({"source": "pexels", "kind": "video", "url": f["link"], "preview": r.get("image"),
                        "width": f["width"], "height": f["height"], "duration": r.get("duration"),
                        "title": r.get("url", "").rstrip("/").split("/")[-1], "creator": r.get("user", {}).get("name", "unknown"),
                        "license": "pexels", "license_url": "https://www.pexels.com/license/", "page": r.get("url")})
        else:
            if (r.get("width") or 0) < minw:
                continue
            out.append({"source": "pexels", "kind": "image", "url": r["src"]["original"], "preview": r["src"]["medium"],
                        "width": r["width"], "height": r["height"], "title": r.get("alt") or "",
                        "creator": r.get("photographer", "unknown"), "license": "pexels",
                        "license_url": "https://www.pexels.com/license/", "page": r.get("url")})
    return out[:n]


def pixabay(q, kind, n, minw):
    key = os.environ.get(CUR.get("pixabay_env", "PIXABAY_API_KEY"))
    if not key:
        return []
    base = "https://pixabay.com/api/videos/?" if kind == "video" else "https://pixabay.com/api/?"
    d = jget(base + urllib.parse.urlencode({"key": key, "q": q, "per_page": max(3, min(n, 50)), "safesearch": "true"}))
    out = []
    for r in d.get("hits", []):
        if kind == "video":
            v = r.get("videos", {}).get("large") or r.get("videos", {}).get("medium") or {}
            if (v.get("width") or 0) < minw:
                continue
            out.append({"source": "pixabay", "kind": "video", "url": v["url"], "preview": v.get("thumbnail") or "",
                        "width": v["width"], "height": v["height"], "duration": r.get("duration"), "title": r.get("tags", ""),
                        "creator": r.get("user", "unknown"), "license": "pixabay",
                        "license_url": "https://pixabay.com/service/license-summary/", "page": r.get("pageURL")})
        else:
            if (r.get("imageWidth") or 0) < minw:
                continue
            out.append({"source": "pixabay", "kind": "image", "url": r.get("largeImageURL"), "preview": r.get("webformatURL"),
                        "width": r["imageWidth"], "height": r["imageHeight"], "title": r.get("tags", ""),
                        "creator": r.get("user", "unknown"), "license": "pixabay",
                        "license_url": "https://pixabay.com/service/license-summary/", "page": r.get("pageURL")})
    return out[:n]


SOURCES = {"openverse": openverse, "wikimedia": wikimedia, "pexels": pexels, "pixabay": pixabay}


def credit_line(e):
    if e["license"] == "owned":
        return e.get("credit") or "Own footage"
    lic = {"cc0": "CC0", "pdm": "Public domain", "by": "CC BY", "by-sa": "CC BY-SA",
           "pexels": "Pexels licence", "pixabay": "Pixabay licence"}.get(e["license"], e["license"].upper())
    if e.get("license_version") and e["license"] in ("by", "by-sa"):
        lic += " " + e["license_version"]
    title = (e.get("title") or "").strip()
    title = f'"{title[:80]}" ' if title else ""
    return f'{title}by {e.get("creator") or "unknown"} ({e["source"]}), {lic}: {e.get("page")}'


def contact_sheet(cands, start, path):
    from PIL import Image, ImageDraw
    import io
    tiles = []
    for i, c in enumerate(cands):
        try:
            im = Image.open(io.BytesIO(get(c["preview"], timeout=30))).convert("RGB")
        except Exception:
            im = Image.new("RGB", (320, 200), "#888")
        im.thumbnail((320, 220))
        t = Image.new("RGB", (330, 260), "white")
        t.paste(im, ((330 - im.width) // 2, 4))
        d = ImageDraw.Draw(t)
        d.text((6, 232), f'#{start + i} {c["source"]} {c["kind"]} {c.get("width")}x{c.get("height")} {c["license"]}', fill="black")
        tiles.append(t)
    if not tiles:
        return
    cols = 4
    rows = (len(tiles) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * 330, rows * 260), "white")
    for i, t in enumerate(tiles):
        sheet.paste(t, ((i % cols) * 330, (i // cols) * 260))
    sheet.save(path, quality=85)
    print(f"sheet {path}")


def cmd_search(a):
    out = json.load(open(a.out)) if os.path.exists(a.out) else []
    start = len(out)
    new = []
    for s in a.sources.split(","):
        try:
            got = SOURCES[s](a.query, a.kind, a.n, a.min_width)
            print(f"{s}: {len(got)}", flush=True)
            new += got
        except Exception as e:
            print(f"{s}: failed ({e})", flush=True)
    for c in new:
        c["query"] = a.query
    out += new
    json.dump(out, open(a.out, "w"), indent=1)
    for i, c in enumerate(new):
        print(f'#{start + i:<3} {c["source"]:<9} {c["kind"]:<5} {c.get("width")}x{c.get("height")} {c["license"]:<7} {c["title"][:60]}')
    contact_sheet(new, start, a.out + ".sheet.jpg")


def cmd_fetch(a):
    cands = json.load(open(a.candidates))
    os.makedirs(a.dir, exist_ok=True)
    cpath = os.path.join(a.dir, "credits.json")
    credits = json.load(open(cpath)) if os.path.exists(cpath) else []
    for k in [int(x) for x in a.pick.split(",")]:
        c = dict(cands[k])
        if c["license"] not in ALLOWED | {"pexels", "pixabay"}:
            sys.exit(f"#{k}: licence {c['license']} is not allowed")
        stem = f"{a.id_prefix + '-' if a.id_prefix else ''}{c['source']}-{k}"
        raw = os.path.join(a.dir, stem + ".src")
        open(raw, "wb").write(get(c["url"], timeout=300))
        if c["kind"] == "video":
            dst = os.path.join(a.dir, stem + ".mp4")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-an", "-vf",
                            "scale='min(1920,iw)':-2,fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "20",
                            "-preset", "medium", "-movflags", "+faststart", dst], check=True)
        else:
            from PIL import Image
            dst = os.path.join(a.dir, stem + ".jpg")
            im = Image.open(raw).convert("RGB")
            im.thumbnail((2400, 2400))
            im.save(dst, quality=90)
        os.remove(raw)
        c["file"] = os.path.basename(dst)
        c["credit_line"] = credit_line(c)
        credits.append(c)
        print(f"#{k} -> {dst}")
    json.dump(credits, open(cpath, "w"), indent=1)


def cmd_add(a):
    os.makedirs(a.dir, exist_ok=True)
    cpath = os.path.join(a.dir, "credits.json")
    credits = json.load(open(cpath)) if os.path.exists(cpath) else []
    e = {"source": "own", "kind": "video" if a.file.lower().endswith((".mp4", ".mov", ".webm")) else "image",
         "file": os.path.basename(a.file), "license": "owned", "credit": a.credit, "page": a.source, "creator": a.credit}
    e["credit_line"] = credit_line(e)
    credits.append(e)
    json.dump(credits, open(cpath, "w"), indent=1)
    print(json.dumps(e))


def cmd_credits(a):
    credits = json.load(open(a.file))
    bad = 0
    for e in credits:
        missing = [k for k in ("license", "creator", "page") if not e.get(k)] if e["license"] != "owned" else []
        if missing:
            bad += 1
            print(f"MISSING {missing}: {e.get('file')}", file=sys.stderr)
    seen = set()
    for e in credits:
        line = e.get("credit_line") or credit_line(e)
        if line not in seen:
            seen.add(line)
            print(line)
    sys.exit(1 if bad else 0)


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    s = sp.add_parser("search"); s.add_argument("query"); s.add_argument("--kind", default="image", choices=["image", "video"])
    s.add_argument("--sources", default="openverse,wikimedia,pexels,pixabay"); s.add_argument("--n", type=int, default=12)
    s.add_argument("--min-width", type=int, default=1600); s.add_argument("--out", default="candidates.json")
    f = sp.add_parser("fetch"); f.add_argument("candidates"); f.add_argument("--pick", required=True)
    f.add_argument("--dir", default="assets"); f.add_argument("--id-prefix", default="")
    d = sp.add_parser("add"); d.add_argument("file"); d.add_argument("--dir", default="assets")
    d.add_argument("--credit", required=True); d.add_argument("--source")
    c = sp.add_parser("credits"); c.add_argument("file")
    a = ap.parse_args()
    {"search": cmd_search, "fetch": cmd_fetch, "add": cmd_add, "credits": cmd_credits}[a.cmd](a)


if __name__ == "__main__":
    main()
