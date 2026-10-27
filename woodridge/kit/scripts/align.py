#!/usr/bin/env python3
"""One continuous narration take (e.g. the host's HeyGen voice clone) + script.json -> per-scene MP3s + timeline.json.

Usage: /tmp/wh-venv/bin/python align.py <script.json> <narration.wav|mp3|mp4> <out_dir> [--fps 30]
Setup: uv venv /tmp/wh-venv -p 3.12 && uv pip install -p /tmp/wh-venv faster-whisper

Transcribes with faster-whisper (word timestamps), aligns words to the script text, cuts the take
at scene boundaries (midway through the pause between scenes), normalises each scene to -16 LUFS,
and places each cue at the real start time of its phrase. Output format matches voiceover.py.
"""
import argparse, difflib, json, os, re, subprocess, sys

VOICE_FROM, TAIL = 8, 16


def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())


def toks(text):
    return [t for t in (norm(w) for w in re.split(r"[\s\-]+", text)) if t]


def ff(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True, check=True).stdout)


ap = argparse.ArgumentParser()
ap.add_argument("script"); ap.add_argument("audio"); ap.add_argument("out")
ap.add_argument("--fps", type=int, default=30)
a = ap.parse_args()
os.makedirs(a.out, exist_ok=True)
scenes = json.load(open(a.script))["scenes"]

wav = os.path.join(a.out, "_take.wav")
ff("-i", a.audio, "-vn", "-ac", "1", "-ar", "16000", wav)
from faster_whisper import WhisperModel
import numpy as np
m = WhisperModel("small.en", device="cpu", compute_type="int8")
# Pass raw PCM: faster-whisper's own decoder breaks with some PyAV versions.
pcm = np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", wav, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout, dtype=np.float32)
segs, _ = m.transcribe(pcm, word_timestamps=True, beam_size=5, vad_filter=False)
words = []
for s in segs:
    for w in s.words:
        for piece in re.split(r"[\s\-]+", w.word):
            if norm(piece):
                words.append((norm(piece), w.start, w.end))
print(f"whisper words: {len(words)}", file=sys.stderr)

stoks, scene_start_tok = [], []
for s in scenes:
    scene_start_tok.append(len(stoks))
    stoks += toks(s["text"])

sm = difflib.SequenceMatcher(a=stoks, b=[w[0] for w in words], autojunk=False)
tmap = {}
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        tmap[blk.a + k] = blk.b + k
print(f"aligned {len(tmap)}/{len(stoks)} script words", file=sys.stderr)


def tok_time(ti, end=False):
    """Time of script token ti; falls back to the nearest aligned neighbour."""
    for d in range(0, 40):
        for c in ((ti + d, ti - d) if not end else (ti - d, ti + d)):
            if c in tmap:
                w = words[tmap[c]]
                return w[2] if end else w[1]
    raise SystemExit(f"cannot place token {ti}")


bounds = []
for i, s in enumerate(scenes):
    st = scene_start_tok[i]
    en = (scene_start_tok[i + 1] if i + 1 < len(scenes) else len(stoks)) - 1
    bounds.append([tok_time(st), tok_time(en, end=True)])
total_len = dur(wav)
cuts = [max(0.0, bounds[0][0] - 0.12)]
for i in range(len(scenes) - 1):
    cuts.append((bounds[i][1] + bounds[i + 1][0]) / 2)
cuts.append(min(total_len, bounds[-1][1] + 0.35))

tl, cursor = [], 0
for i, s in enumerate(scenes):
    c0, c1 = cuts[i], cuts[i + 1]
    mp3 = os.path.join(a.out, s["id"] + ".mp3")
    ff("-ss", f"{c0:.3f}", "-to", f"{c1:.3f}", "-i", a.audio, "-vn",
       "-af", "afade=t=in:d=0.02,loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1", "-b:a", "160k", mp3)
    sec = c1 - c0
    vf = round(sec * a.fps)
    frames = VOICE_FROM + vf + TAIL
    sc_toks = toks(s["text"])
    cues = []
    for c in s.get("cues", []):
        ct = toks(c)
        pos = next((j for j in range(len(sc_toks)) if sc_toks[j:j + len(ct)] == ct), None)
        if pos is None:
            raise SystemExit(f'cue "{c}" not found in scene {s["id"]}')
        t = tok_time(scene_start_tok[i] + pos)
        cues.append(VOICE_FROM + round((t - c0) * a.fps))
    tl.append({"id": s["id"], "from": cursor, "frames": frames, "voiceFrom": VOICE_FROM, "cues": cues})
    cursor += frames
    print(f'{s["id"]:<10} {sec:6.2f}s cues {cues}', file=sys.stderr)

os.remove(wav)
json.dump({"fps": a.fps, "total": cursor, "scenes": tl}, open(os.path.join(a.out, "timeline.json"), "w"), separators=(",", ":"))
print(f"total {cursor} frames = {cursor / a.fps:.1f}s", file=sys.stderr)
