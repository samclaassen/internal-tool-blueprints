#!/usr/bin/env python3
"""Narration -> per-scene MP3s + a frame-accurate timeline for a Remotion explainer video.

Usage:
  voiceover.py <script.json> <out_dir> [--model kokoro-v1.0.onnx] [--voices voices-v1.0.bin] [--fps 30]

script.json:
  {
    "voice": "af_heart",          # Kokoro voice (af_heart is warm, clear US English)
    "speed": 1.12,                # Kokoro speaking rate; 1.12 + tempo 1.04 is the approved pace
    "tempo": 1.04,                # extra ffmpeg atempo after trimming pauses (1.0 = off)
    "scenes": [
      {"id": "hook", "text": "Can an AI build ...", "cues": ["checked twenty-four", "what broke"]}
    ]
  }
  Each cue is a phrase copied exactly from that scene's text. Its frame is where the phrase starts,
  estimated from its character position (good to about a quarter second). Use cues to time animations.

Writes:
  <out_dir>/<id>.mp3     mono 44.1 kHz, -16 LUFS, long pauses trimmed
  <out_dir>/timings.json [{"id", "file", "seconds"}]
  <out_dir>/timeline.json {"fps", "total", "scenes": [{"id", "from", "frames", "voiceFrom", "cues": [frame offsets within the scene]}]}

Needs ffmpeg and, in the Python env, kokoro-onnx + soundfile (uv venv with Python 3.12:
  uv venv /tmp/tts-venv -p 3.12 && uv pip install -p /tmp/tts-venv kokoro-onnx soundfile).
Model files: https://github.com/thewh1teagle/kokoro-onnx/releases (kokoro-v1.0.onnx, voices-v1.0.bin).
"""
import argparse
import json
import os
import subprocess
import sys

VOICE_FROM = 8   # frames of silence before the voice starts in each scene
TAIL = 16        # frames held after the voice ends, before the next scene


def ff(*args):
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], check=True)


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("script")
    ap.add_argument("out")
    ap.add_argument("--model", default="/tmp/kokoro/kokoro-v1.0.onnx")
    ap.add_argument("--voices", default="/tmp/kokoro/voices-v1.0.bin")
    ap.add_argument("--fps", type=int, default=30)
    a = ap.parse_args()

    cfg = json.load(open(a.script))
    scenes = cfg["scenes"]
    ids = [s["id"] for s in scenes]
    if len(set(ids)) != len(ids) or not all(i.replace("-", "").isalnum() for i in ids):
        sys.exit("scene ids must be unique and use letters, digits and dashes")
    for s in scenes:
        for c in s.get("cues", []):
            if c not in s["text"]:
                sys.exit(f'cue "{c}" is not in the text of scene {s["id"]}')

    import soundfile as sf
    from kokoro_onnx import Kokoro

    os.makedirs(a.out, exist_ok=True)
    k = Kokoro(a.model, a.voices)
    tempo = float(cfg.get("tempo", 1.0))
    timings, tl, cursor = [], [], 0
    for s in scenes:
        samples, sr = k.create(s["text"], voice=cfg.get("voice", "af_heart"), speed=float(cfg.get("speed", 1.0)), lang="en-us")
        wav = os.path.join(a.out, s["id"] + ".wav")
        mp3 = os.path.join(a.out, s["id"] + ".mp3")
        sf.write(wav, samples, sr)
        # Trim pauses longer than 0.28 s down to 0.2 s, speed up slightly without changing pitch, then
        # normalise to -16 LUFS (EBU R128), the usual level for spoken web video.
        chain = ["silenceremove=stop_periods=-1:stop_duration=0.28:stop_threshold=-45dB:stop_silence=0.2"]
        if abs(tempo - 1.0) > 1e-6:
            chain.append(f"atempo={tempo}")
        chain.append("loudnorm=I=-16:TP=-1.5:LRA=11")
        ff("-i", wav, "-af", ",".join(chain), "-ar", "44100", "-ac", "1", "-b:a", "160k", mp3)
        os.remove(wav)
        sec = duration(mp3)
        voice_frames = round(sec * a.fps)
        frames = VOICE_FROM + voice_frames + TAIL
        cues = [VOICE_FROM + round(voice_frames * s["text"].index(c) / len(s["text"])) for c in s.get("cues", [])]
        timings.append({"id": s["id"], "file": s["id"] + ".mp3", "seconds": round(sec, 3)})
        tl.append({"id": s["id"], "from": cursor, "frames": frames, "voiceFrom": VOICE_FROM, "cues": cues})
        cursor += frames
        print(f'{s["id"]:<12} {sec:6.2f}s  cues {cues}', flush=True)

    json.dump(timings, open(os.path.join(a.out, "timings.json"), "w"), indent=1)
    timeline = {"fps": a.fps, "total": cursor, "scenes": tl}
    # Compact separators: the timeline is pasted into the composition as a one-line constant.
    json.dump(timeline, open(os.path.join(a.out, "timeline.json"), "w"), separators=(",", ":"))
    print(f"total {cursor} frames = {cursor / a.fps:.1f}s")


if __name__ == "__main__":
    main()
