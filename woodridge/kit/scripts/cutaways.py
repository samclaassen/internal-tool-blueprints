"""Overlay host cutaways (the host's lip-synced narration avatar) onto the rendered explainer.

Usage: python3 cutaways.py <main.mp4> <narration_avatar.mp4> <timeline.json> <cuts.json> <out.mp4>
(cuts.json = the take cut points align.py writes; narration_avatar.mp4 = the HeyGen take, Fit mode,
so the square avatar sits at x 420..1499 of the 1920x1080 frame.)
Each cutaway runs from the scene start until 10 frames before the scene's first cue, so it covers
the scene's opening sentence and hands over to the product visuals as they arrive. Needs bg_cut.py
and IBM Plex fonts in /tmp/tw/fonts (google/fonts ofl/ibmplexsans variable TTF + ibmplexmono).
Edit PLAN per video: pick scenes whose first sentence is commentary, not something on screen.
"""
import json, subprocess, sys

MAIN, AV, TLF, CUTSF, OUT = sys.argv[1:6]
tl = json.load(open(TLF)); cuts = json.load(open(CUTSF)); fps = tl["fps"]
ids = [s["id"] for s in tl["scenes"]]
PLAN = {  # scene id: (right header, kicker, statement) -- Testimonial Wall example
    "rule": ("03 / 10 · THE CORE RULE", "THE CORE RULE", "Permission."),
    "phases": ("04 / 10 · THE BUILD", "THE BUILD", "Four phases, one prompt each."),
    "gaps": ("07 / 10 · WHAT BROKE", "THE MORE USEFUL RESULT", "What broke."),
    "untested": ("08 / 10 · NOT TESTED", "A WARNING", "Passing isn't production-ready."),
    "cost": ("09 / 10 · THE COST", "THE QUESTION", "Is it worth building?"),
}
FADE = 0.2
inputs = ["-i", MAIN]
chains, last = [], "[0:v]"
n = 1
for sid, (right, kick, text) in PLAN.items():
    s = tl["scenes"][ids.index(sid)]
    i = ids.index(sid)
    start = s["from"] / fps
    dur = (s["cues"][0] - 10) / fps
    take = cuts[i] - s["voiceFrom"] / fps
    bg = f"/tmp/tw/host/cut_{sid}.png"
    subprocess.run(["python3", "/tmp/tw/bg_cut.py", right, kick, text, bg], check=True)
    inputs += ["-loop", "1", "-framerate", str(fps), "-t", f"{dur:.3f}", "-i", bg,
               "-ss", f"{max(0, take):.3f}", "-t", f"{dur:.3f}", "-i", AV]
    b, v = n, n + 1
    chains.append(
        f"[{v}:v]fps={fps},crop=1080:1080:420:0,scale=760:760:flags=lanczos,setsar=1[a{n}];"
        f"[{b}:v][a{n}]overlay=80:180:shortest=1,format=yuva420p,"
        f"fade=t=in:st=0:d={FADE}:alpha=1,fade=t=out:st={dur - FADE:.3f}:d={FADE}:alpha=1,"
        f"setpts=PTS+{start:.3f}/TB[c{n}];"
        f"{last}[c{n}]overlay=0:0:eof_action=pass[m{n}]")
    last = f"[m{n}]"
    print(f"{sid:<9} at {start:6.2f}s for {dur:4.2f}s (avatar take {take:6.2f}s)")
    n += 2
subprocess.run(["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(chains), "-map", last, "-map", "0:a",
                "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", OUT], check=True)
