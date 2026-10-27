#!/usr/bin/env python3
"""The host's cloned voice and avatar through the HeyGen API (no browser). IDs come from brand.json (heygen.*).

Run it inside run_integration_command on the HeyGen connection, which injects TYPE_CUSTOM_API_SECRET
(sent as the X-Api-Key header, verbatim). Never print the key.

  heygen.py tts  <script.json> <out_dir> [--fps 30] [--model heygen-voice-1-turbo-free]
      Same input and output as voiceover.py (per-scene MP3s at -16 LUFS + timeline.json with cue frames),
      but in the host's cloned voice. Cues are placed at the real character timestamps HeyGen returns.
      Also writes words.json: [{"scene", "word", "start", "end"}] (seconds within the scene's MP3) for captions.
      turbo-free is free until 2026-11-30; on 429/500 it retries, then falls back to paid heygen-voice-1.

  heygen.py clip <text> <out.mp4> [--aspect 1:1] [--look digital_twin|photo] [--engine avatar_v] [--title ...]
      The host's avatar speaking <text> in their cloned voice. 1080p. Polls until done (3 to 12 min),
      downloads, prints duration and the wallet charge. Cost seen on 2026-10-24: about $0.06-0.075 per second.
      Engine: avatar_v (default). On the original project Avatar IV produced unnatural faces (head tilts, droopy
      eyes, eye-rolls) and Avatar III drifted out of frame. Avatar V keeps the digital twin steady and natural.
      Run clips in the foreground: a background process loses the injected key when the command returns.

  heygen.py balance
"""
import argparse
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request

API = "https://api.heygen.com"
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import brand  # noqa: E402
_H = brand.load()["heygen"]
VOICE = _H["voice_id"]                                   # host voice clone
LOOKS = {k: v for k, v in _H["looks"].items() if v and not v.startswith("TODO")}  # avatar looks
VOICE_FROM, TAIL = 8, 16


def call(method, path, body=None, timeout=120):
    req = urllib.request.Request(API + path, method=method,
                                 data=json.dumps(body).encode() if body is not None else None,
                                 headers={"X-Api-Key": os.environ["TYPE_CUSTOM_API_SECRET"],
                                          "Accept": "application/json", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read() or b"{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read() or b"{}")
        except Exception:
            return e.code, {}


def balance():
    code, d = call("GET", "/v3/users/me")
    return d.get("data", {}).get("wallet", {}).get("remaining_balance") if code == 200 else None


def ff(*a):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *a], check=True)


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True, check=True).stdout)


def fetch(url, path):
    subprocess.run(["curl", "-sSL", "--fail", "-o", path, url], check=True)


def speak(text, model):
    """One TTS request with retries; returns data {audio_url, duration, original_characters}."""
    models = [model] + (["heygen-voice-1"] if model != "heygen-voice-1" else [])
    for m in models:
        for attempt in range(5):
            code, d = call("POST", "/v3/models/audio/tts",
                           {"model": m, "voice_id": VOICE, "text": text, "language": "en",
                            "expressiveness_boost": 0.5, "with_timestamps": True}, timeout=180)
            if code == 200:
                d["data"]["model"] = m
                return d["data"]
            if code in (429, 500, 503):
                time.sleep(min(60, 5 * 2 ** attempt))
                continue
            sys.exit(f"tts failed: HTTP {code} {json.dumps(d)[:300]}")
        print(f"{m}: still failing after retries, trying the next model", file=sys.stderr)
    sys.exit("tts failed on every model")


def words_from_chars(chars):
    """[{text,start_time,end_time}] per character -> [(word, start, end)]."""
    out, cur, st, en = [], "", None, None
    for c in chars:
        t = c["text"]
        if t.isspace():
            if cur:
                out.append((cur, st, en))
            cur, st = "", None
            continue
        if st is None:
            st = c["start_time"]
        cur += t
        en = c["end_time"]
    if cur:
        out.append((cur, st, en))
    return out


def cmd_tts(a):
    cfg = json.load(open(a.script))
    scenes = cfg["scenes"]
    for s in scenes:
        for c in s.get("cues", []):
            if c not in s["text"]:
                sys.exit(f'cue "{c}" is not in the text of scene {s["id"]}')
    os.makedirs(a.out, exist_ok=True)
    tl, timings, allwords, cursor = [], [], [], 0
    for s in scenes:
        d = speak(s["text"], a.model)
        wav = os.path.join(a.out, s["id"] + ".wav")
        mp3 = os.path.join(a.out, s["id"] + ".mp3")
        fetch(d["audio_url"], wav)
        chars = d.get("original_characters") or []
        lead = chars[0]["start_time"] if chars else 0.0
        lead = max(0.0, lead - 0.05)
        # Trim leading silence only (timestamps shift by `lead`), normalise to -16 LUFS like voiceover.py.
        ff("-ss", f"{lead:.3f}", "-i", wav, "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", "44100", "-ac", "1", "-b:a", "160k", mp3)
        os.remove(wav)
        sec = dur(mp3)
        vf = round(sec * a.fps)
        cues = []
        for c in s.get("cues", []):
            i = s["text"].index(c)
            t = (chars[i]["start_time"] - lead) if i < len(chars) else sec * i / len(s["text"])
            cues.append(VOICE_FROM + round(max(0.0, t) * a.fps))
        for w, ws, we in words_from_chars(chars):
            allwords.append({"scene": s["id"], "word": w, "start": round(ws - lead, 3), "end": round(we - lead, 3)})
        frames = VOICE_FROM + vf + TAIL
        tl.append({"id": s["id"], "from": cursor, "frames": frames, "voiceFrom": VOICE_FROM, "cues": cues})
        timings.append({"id": s["id"], "file": s["id"] + ".mp3", "seconds": round(sec, 3), "model": d["model"]})
        cursor += frames
        print(f'{s["id"]:<12} {sec:6.2f}s  {d["model"]}  cues {cues}', flush=True)
    json.dump(timings, open(os.path.join(a.out, "timings.json"), "w"), indent=1)
    json.dump(allwords, open(os.path.join(a.out, "words.json"), "w"))
    json.dump({"fps": a.fps, "total": cursor, "scenes": tl}, open(os.path.join(a.out, "timeline.json"), "w"), separators=(",", ":"))
    print(f"total {cursor} frames = {cursor / a.fps:.1f}s")


def cmd_clip(a):
    b0 = balance()
    body = {"type": "avatar", "title": a.title or a.text[:60], "avatar_id": LOOKS[a.look], "voice_id": VOICE,
            "script": a.text, "aspect_ratio": a.aspect, "resolution": "1080p", "engine": {"type": a.engine}}
    code, d = call("POST", "/v3/videos", body)
    if code != 200:
        sys.exit(f"create failed: HTTP {code} {json.dumps(d)[:300]}")
    vid = d["data"]["video_id"]
    print(f"video_id {vid}", flush=True)
    for _ in range(80):
        time.sleep(15)
        code, d = call("GET", f"/v3/videos/{vid}")
        st = d.get("data", {}).get("status")
        if st == "completed":
            break
        if st == "failed":
            sys.exit(f"generation failed: {json.dumps(d)[:400]}")
    else:
        sys.exit("timed out after 20 minutes; poll GET /v3/videos/" + vid)
    fetch(d["data"]["video_url"], a.out)
    b1 = balance()
    cost = round(b0 - b1, 2) if (b0 is not None and b1 is not None) else None
    print(json.dumps({"video_id": vid, "file": a.out, "seconds": round(dur(a.out), 2), "cost_usd": cost, "balance": b1}))


def main():
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    t = sp.add_parser("tts"); t.add_argument("script"); t.add_argument("out")
    t.add_argument("--fps", type=int, default=30); t.add_argument("--model", default="heygen-voice-1-turbo-free")
    c = sp.add_parser("clip"); c.add_argument("text"); c.add_argument("out")
    c.add_argument("--aspect", default="1:1"); c.add_argument("--look", default=next(iter(LOOKS), "digital_twin"), choices=list(LOOKS) or ["digital_twin"])
    c.add_argument("--title")
    c.add_argument("--engine", default=_H.get("engine", "avatar_v"), choices=["avatar_iii", "avatar_iv", "avatar_v"])
    sp.add_parser("balance")
    a = ap.parse_args()
    if a.cmd == "tts":
        cmd_tts(a)
    elif a.cmd == "clip":
        cmd_clip(a)
    else:
        print(json.dumps({"balance_usd": balance()}))


if __name__ == "__main__":
    main()
