#!/usr/bin/env python3
"""Build a vertical YouTube Short (1080x1920, 30 fps) from an explainer video, the host's avatar clips and their
cloned-voice narration. Brand colours, fonts, domain and host name come from brand.json. Pure ffmpeg + Pillow; no render service.

Usage: make_short.py <short.json>
Fonts: copy the site repo's assets/fonts/*.ttf to ~/.fonts and run fc-cache -f (captions use IBM Plex Sans Medium).

short.json (paths relative to the file):
{
  "out": "short.mp4",
  "kicker": "BUILD TEST · KISSFLOW ALTERNATIVE",       # small orange line at the top
  "title": "Can Claude replace Kissflow?",               # big line under it (keep to ~28 characters)
  "badge_image": "../sam_photo.jpg",                     # the host's avatar photo for the badge on product shots
                                                         # (or "badge_from": "hook.mp4" to take a frame)
  "music": "music.mp3", "music_volume": 0.08,            # optional bed under the whole Short
  "words": "tts/words.json",                             # from heygen.py tts (captions for narration segments)
  "highlight": ["Kissflow", "twenty", "nine"],           # caption words drawn in the signal orange
  "segments": [
    {"type": "avatar", "video": "hook.mp4", "text": "Here's how to ..."},           # host on camera, its own audio
    {"type": "product", "scene": "build", "audio": "tts/build.mp3",              # narration over footage
     "source": "long.mp4", "from": 63.4,                                           # seconds into the source video
     "crop": [260, 110, 1400, 900]},       # optional source rect [x, y, w, h]; shown at 1080 wide (zoom in on what matters)
    {"type": "avatar", "video": "outro.mp4", "text": "The full spec is free ..."}
  ]
}
Avatar captions are timed by character position across the clip (good to about a quarter second);
narration captions use HeyGen's character timestamps. Check a contact sheet before uploading.
"""
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
B = brand.load()

W, H, FPS = 1080, 1920, 30
PAPER, PAPER_HI, INK, INK3, SIGNAL = (brand.color(k) for k in ("paper", "paper_hi", "ink", "ink3", "signal"))
SANS, MONO = B["fonts"]["sans_ttf"], B["fonts"]["mono_ttf"]
FONT_DIRS = [os.path.expanduser("~/.fonts"), "/usr/share/fonts/truetype/dejavu"]
AV_Y, AV_SIZE = 330, 960          # avatar square, centred
PR_Y = 330                         # product footage, full width, height from the crop
CAP_Y_AVATAR = 1370


def font(name, size):
    for d in FONT_DIRS:
        p = os.path.join(d, name)
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", size)


def run(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True, check=True).stdout)


def background(spec, path, badge=None):
    im = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(im)
    d.text((60, 92), spec["kicker"].upper(), font=font(MONO, 30), fill=SIGNAL)
    size = 76                                    # shrink long titles until they fit inside the margins
    while size > 48 and font(SANS, size).getlength(spec["title"]) > W - 120:
        size -= 2
    d.text((60, 140 + (76 - size) // 2), spec["title"], font=font(SANS, size), fill=INK)
    d.line([(60, 262), (W - 60, 262)], fill=INK, width=3)
    d.text((60, H - 112), B["domain"], font=font(MONO, 32), fill=INK3)
    if badge:
        b = Image.open(badge).convert("RGB").resize((150, 150))
        mask = Image.new("L", (150, 150), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, 149, 149], fill=255)
        x, y = W - 60 - 150, H - 330
        im.paste(b, (x, y), mask)
        d.ellipse([x - 2, y - 2, x + 151, y + 151], outline=INK, width=3)
        d.text((x - 20, y + 52), B["host_name"], font=font(SANS, 34), fill=INK, anchor="ra")
    im.save(path)


def ass_time(t):
    t = max(0.0, t)
    h, m = int(t // 3600), int(t % 3600 // 60)
    s = t - h * 3600 - m * 60
    return f"{h}:{m:02d}:{s:05.2f}"


def chunks(words, max_words=3, max_chars=20):
    out, cur = [], []
    for w in words:
        if cur and (len(cur) >= max_words or len(" ".join(x[0] for x in cur + [w])) > max_chars
                    or cur[-1][0].endswith((".", ",", "?", "!", ":"))):
            out.append(cur)
            cur = []
        cur.append(w)
    if cur:
        out.append(cur)
    return out


def main():
    spec_path = sys.argv[1]
    base = os.path.dirname(os.path.abspath(spec_path))
    spec = json.load(open(spec_path))
    P = lambda p: os.path.join(base, p)
    tmp = P("_short_tmp")
    os.makedirs(tmp, exist_ok=True)
    words_all = json.load(open(P(spec["words"]))) if spec.get("words") else []
    hl = {h.lower() for h in spec.get("highlight", [])}

    badge = os.path.join(tmp, "badge.jpg")
    if spec.get("badge_image"):      # a photo of the host (preferred: no mid-word frame)
        im = Image.open(P(spec["badge_image"])).convert("RGB")
        side = min(im.size)
        fx, fy = spec.get("badge_center", [0.5, 0.52])          # face centre as fractions of the photo
        side = int(side * float(spec.get("badge_zoom", 0.6)))
        x0 = min(max(0, int(im.width * fx - side / 2)), im.width - side)
        y0 = min(max(0, int(im.height * fy - side / 2)), im.height - side)
        im.crop((x0, y0, x0 + side, y0 + side)).resize((300, 300)).save(badge)
    else:
        run("-ss", "1.0", "-i", P(spec["badge_from"]), "-frames:v", "1", "-vf", "crop=iw*0.5:iw*0.5:iw*0.25:ih*0.12,scale=300:300", badge)
    bg_av, bg_pr = os.path.join(tmp, "bg_av.png"), os.path.join(tmp, "bg_pr.png")
    background(spec, bg_av)
    background(spec, bg_pr, badge=badge)

    seg_files, events, t0 = [], [], 0.0
    for i, s in enumerate(spec["segments"]):
        out = os.path.join(tmp, f"seg{i:02d}.mp4")
        if s["type"] == "avatar":
            v = P(s["video"])
            d = dur(v)
            run("-loop", "1", "-i", bg_av, "-i", v,
                "-filter_complex",
                f"[1:v]scale={AV_SIZE}:{AV_SIZE},setsar=1[a];[0:v][a]overlay={(W - AV_SIZE) // 2}:{AV_Y}:shortest=1,"
                f"drawbox=x={(W - AV_SIZE) // 2 - 3}:y={AV_Y - 3}:w={AV_SIZE + 6}:h={AV_SIZE + 6}:color={INK}:t=3,fps={FPS},format=yuv420p[v];"
                f"[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[aud]",
                "-map", "[v]", "-map", "[aud]", "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-c:a", "aac", "-b:a", "160k", "-ac", "2", out)
            text = s["text"].split()
            n = sum(len(x) + 1 for x in text)
            pos, ws = 0, []
            for x in text:
                st = d * pos / n
                pos += len(x) + 1
                ws.append((x, st, d * pos / n))
            cap_y = CAP_Y_AVATAR
        else:
            a = P(s["audio"])
            d = dur(a) + 0.35
            cx, cy, cw, chh = s.get("crop", [0, 0, 1920, 1080])
            ph = min(1000, round(chh * W / cw / 2) * 2)
            run("-loop", "1", "-i", bg_pr, "-ss", f'{s["from"]:.3f}', "-t", f"{d:.3f}", "-i", P(s["source"]), "-i", a,
                "-filter_complex",
                f"[1:v]crop={cw}:{chh}:{cx}:{cy},scale={W}:{ph},setsar=1[p];[0:v][p]overlay=0:{PR_Y}:shortest=1,"
                f"drawbox=x=0:y={PR_Y - 3}:w={W}:h=3:color={INK}:t=fill,drawbox=x=0:y={PR_Y + ph}:w={W}:h=3:color={INK}:t=fill,"
                f"fps={FPS},format=yuv420p[v];[2:a]apad,aresample=44100[aud]",
                "-map", "[v]", "-map", "[aud]", "-t", f"{d:.3f}", "-c:v", "libx264", "-preset", "medium", "-crf", "20",
                "-c:a", "aac", "-b:a", "160k", "-ac", "2", out)
            ws = [(w["word"], w["start"], w["end"]) for w in words_all if w["scene"] == s["scene"]]
            if not ws:
                sys.exit(f'no words for scene {s["scene"]} in {spec["words"]}')
            cap_y = PR_Y + ph + 70
        groups = chunks(ws)
        for gi, g in enumerate(groups):
            st = t0 + g[0][1]
            en = t0 + (groups[gi + 1][0][1] if gi + 1 < len(groups) else min(d, g[-1][2] + 0.3))
            txt = " ".join(
                ("{\\c&H0F50F0&}" + w + "{\\c&H171A1A&}") if w.strip(".,?!:;'\"").lower() in hl else w
                for w, _, _ in g)
            events.append((st, en, cap_y, txt))
        seg_files.append(out)
        t0 += dur(out)
        print(f"segment {i} {s['type']:<8} {dur(out):5.2f}s", flush=True)

    lst = os.path.join(tmp, "list.txt")
    open(lst, "w").write("".join(f"file '{f}'\n" for f in seg_files))
    joined = os.path.join(tmp, "joined.mp4")
    run("-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", joined)

    ass = os.path.join(tmp, "captions.ass")
    with open(ass, "w") as f:
        f.write("[Script Info]\nScriptType: v4.00+\nPlayResX: 1080\nPlayResY: 1920\nWrapStyle: 2\n\n"
                "[V4+ Styles]\nFormat: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, "
                "Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, "
                "MarginL, MarginR, MarginV, Encoding\n"
                "Style: Cap,IBM Plex Sans Medium,86,&H00171A1A,&H00171A1A,&H00F3F8FA,&H00F3F8FA,0,0,0,0,100,100,0,0,3,18,0,8,60,60,0,1\n\n"
                "[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n")
        for st, en, y, txt in events:
            f.write(f"Dialogue: 0,{ass_time(st)},{ass_time(en)},Cap,,0,0,{y},,{txt}\n")

    total = dur(joined)
    out = P(spec["out"])
    fc = f"[0:v]ass={ass}[v]"
    args = ["-i", joined]
    if spec.get("music"):
        vol = float(spec.get("music_volume", 0.10))
        args += ["-stream_loop", "-1", "-i", P(spec["music"])]
        fc += (f";[1:a]volume={vol},atrim=0:{total:.3f},afade=t=in:d=1,afade=t=out:st={max(0, total - 1.5):.3f}:d=1.5[m];"
               f"[0:a][m]amix=inputs=2:duration=first:normalize=0[a]")
    else:
        fc += ";[0:a]anull[a]"
    run(*args, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-t", f"{total:.3f}",
        "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out)
    print(json.dumps({"out": out, "seconds": round(dur(out), 2), "captions": len(events)}))


if __name__ == "__main__":
    main()
