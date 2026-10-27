import React from "react";
import {
  AbsoluteFill, Audio, Composition, Easing, Img, OffthreadVideo, Sequence, continueRender, delayRender, interpolate,
  registerRoot, spring, useCurrentFrame, useVideoConfig,
} from "remotion";

/* =====================================================================================================
   AEO explainer template: [host hook in a card] -> narrated scenes over curated photos / clips / cards
   -> [host outro]. Edit only the DATA block (and BRAND to match brand.json). Everything else is the kit.
   ===================================================================================================== */

// ------------------------------------------------------------------ BRAND (copy from brand.json)
const BRAND = {
  name: "Woodridge Cabinets", domain: "woodridgecabinets.com", series: "CABINET GUIDE", host: "Sam Claassen",
  disclosure: "AI avatar of Sam Claassen (HeyGen)",
  paper: "#faf6f0", paperHi: "#fdfaf5", ink: "#231a14", ink3: "#5e5d56", signal: "#b48b58", ok: "#4a6b47",
  sansFamily: "Inter", monoFamily: "IBM Plex Mono",
};

// ------------------------------------------------------------------ DATA
// Raw (CORS-open) base URLs on the media branch, from stage_media.py.
const AUDIO = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/woodridge/audio/SLUG-v1";      // per-scene narration mp3s
const ASSETS = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/woodridge/video/SLUG-v1";     // curated images + clips
const HOOK = { src: `${ASSETS}/hook-norm.mp4`, frames: 240 };                          // ffprobe seconds * 30
const OUTRO = { src: "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/woodridge/video/host/outro-norm.mp4", frames: 220 };
const MUSIC = { src: "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio/music/chill-wave-kevin-macleod.mp3", volume: 0.19 };

// Paste timeline.json (from heygen.py tts or voiceover.py) here on one line.
const TL = { fps: 30, total: 900, scenes: [
  { id: "answer", from: 0, frames: 300, voiceFrom: 8, cues: [60, 180] },
  { id: "why", from: 300, frames: 300, voiceFrom: 8, cues: [40, 150] },
  { id: "cta", from: 600, frames: 300, voiceFrom: 8, cues: [30] },
] };

// One visual per scene id. Shot times are frames from the scene start; a shot lasts until the next one.
// photo: rect = [x, y, w, h] in the image's own pixels (check with draw_rects.py), the camera pushes from
//        the full image to that rect. clip: from = seconds into the clip. Every asset needs its credit line.
type Shot =
  | { kind: "photo"; src: string; w: number; h: number; rect?: [number, number, number, number]; at: number; credit: string; label?: string }
  | { kind: "clip"; src: string; from: number; at: number; credit: string; label?: string };
type Visual =
  | { type: "shots"; title: string; shots: Shot[] }
  | { type: "stats"; title: string; items: { n: string; label: string; cue: number }[] }
  | { type: "list"; title: string; items: { text: string; cue: number }[] }
  | { type: "compare"; title: string; left: { head: string; rows: string[] }; right: { head: string; rows: string[] } }
  | { type: "cta"; title: string; lines: string[] };

const VISUALS: Record<string, Visual> = {
  answer: { type: "shots", title: "The short answer", shots: [
    { kind: "photo", src: `${ASSETS}/example.jpg`, w: 2400, h: 1600, rect: [800, 400, 900, 600], at: 0, credit: "Photo: Creator, CC BY 4.0 (Wikimedia Commons)" },
  ] },
  why: { type: "list", title: "What to check", items: [{ text: "First point", cue: 0 }, { text: "Second point", cue: 1 }] },
  cta: { type: "cta", title: "The full guide", lines: ["example.com/guide"] },
};

// ------------------------------------------------------------------ kit
const SANS = `"${BRAND.sansFamily}", "Helvetica Neue", Arial, sans-serif`;
const MONO = `"${BRAND.monoFamily}", ui-monospace, Menlo, monospace`;
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const INTRO = HOOK.frames + 12;                         // hook frames plus a short hold
const TOTAL = INTRO + TL.total + OUTRO.frames;
type TScene = (typeof TL.scenes)[number];

// Load the brand fonts before any frame renders (otherwise text can be missing on some frames).
const FONT_CSS = `https://fonts.googleapis.com/css2?family=${BRAND.monoFamily.replace(/ /g, "+")}:wght@400;500&family=${BRAND.sansFamily.replace(/ /g, "+")}:wght@400;500;600;700&display=block`;
if (typeof document !== "undefined" && !document.getElementById("brand-fonts")) {
  const handle = delayRender("brand fonts");
  const link = document.createElement("link");
  link.id = "brand-fonts"; link.rel = "stylesheet"; link.href = FONT_CSS;
  const done = () => continueRender(handle);
  link.onload = () => {
    Promise.all(["400", "500", "600", "700"].map((w) => document.fonts.load(`${w} 40px "${BRAND.sansFamily}"`))
      .concat(["400", "500"].map((w) => document.fonts.load(`${w} 40px "${BRAND.monoFamily}"`)))).then(done, done);
  };
  link.onerror = done;
  document.head.appendChild(link);
}
const Fonts: React.FC = () => null;
const useSpring = (at: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 170, mass: 0.7 } });
};
const useEnter = (at: number) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const s = useSpring(at);
  const out = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return { opacity: Math.min(s, out), transform: `translateY(${(1 - s) * 28}px)` };
};
const Grid: React.FC = () => (
  <AbsoluteFill style={{ backgroundImage: "linear-gradient(rgba(0,0,0,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.16) 1px, transparent 1px)", backgroundSize: "48px 48px", opacity: 0.35 }} />
);
const Header: React.FC<{ right?: string }> = ({ right }) => (
  <div style={{ position: "absolute", left: 80, right: 80, top: 48, height: 50, borderBottom: `2px solid ${BRAND.ink}`, display: "flex", alignItems: "center", gap: 16, fontFamily: MONO, fontSize: 22, color: BRAND.ink3, letterSpacing: "0.06em" }}>
    <div style={{ width: 18, height: 18, background: BRAND.signal }} />
    <div>{`${BRAND.name} · ${BRAND.series}`.toUpperCase()}</div>
    <div style={{ marginLeft: "auto" }}>{right ?? BRAND.domain}</div>
  </div>
);
const Frame: React.FC<{ children: React.ReactNode; right?: string }> = ({ children, right }) => (
  <AbsoluteFill style={{ background: BRAND.paper, fontFamily: SANS, color: BRAND.ink }}>
    <Fonts /><Grid /><Header right={right} />{children}
  </AbsoluteFill>
);
const Title: React.FC<{ text: string }> = ({ text }) => {
  const e = useEnter(0);
  return <div style={{ ...e, position: "absolute", left: 80, top: 128, fontSize: 60, fontWeight: 600, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{text}</div>;
};
const Credit: React.FC<{ text: string }> = ({ text }) => (
  <div style={{ position: "absolute", right: 80, bottom: 34, fontFamily: MONO, fontSize: 18, color: BRAND.ink3, background: BRAND.paper, padding: "4px 10px", maxWidth: 1100, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{text}</div>
);

// Stage for photos/clips: 1760x790 box under the title.
const VX = 80, VY = 220, VW = 1760, VH = 790;

/** Ken Burns towards an exact rect: the image and the rect move together, so the push always lands on it. */
const Photo: React.FC<{ s: Extract<Shot, { kind: "photo" }>; len: number }> = ({ s, len }) => {
  const frame = useCurrentFrame();
  const base = Math.max(VW / s.w, VH / s.h);                       // cover the stage at the start
  const [rx, ry, rw, rh] = s.rect ?? [0, 0, s.w, s.h];
  const target = Math.max(base, Math.min((VW * 0.7) / rw, (VH * 0.7) / rh));   // rect fills ~70%
  const t = interpolate(frame, [0, len], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const k = base + (target - base) * t;
  const cx = (rx + rw / 2) * k, cy = (ry + rh / 2) * k;
  const tx = Math.min(0, Math.max(VW - s.w * k, VW / 2 - cx));
  const ty = Math.min(0, Math.max(VH - s.h * k, VH / 2 - cy));
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade, overflow: "hidden" }}>
      <Img src={s.src} style={{ position: "absolute", left: 0, top: 0, width: s.w, height: s.h, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${k})` }} />
    </div>
  );
};
const Clip: React.FC<{ s: Extract<Shot, { kind: "clip" }> }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = interpolate(frame, [0, 10], [0, 1], clamp);
  return <OffthreadVideo src={s.src} startFrom={Math.round(s.from * fps)} muted style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: fade }} />;
};
const Shots: React.FC<{ v: Extract<Visual, { type: "shots" }>; sc: TScene }> = ({ v, sc }) => (
  <Frame>
    <Title text={v.title} />
    <div style={{ position: "absolute", left: VX, top: VY, width: VW, height: VH, border: `3px solid ${BRAND.ink}`, overflow: "hidden", background: "#000" }}>
      {v.shots.map((s, i) => {
        const end = i + 1 < v.shots.length ? v.shots[i + 1].at : sc.frames;
        const len = Math.max(1, end - s.at);
        return (
          <Sequence key={i} from={s.at} durationInFrames={len} layout="none">
            {s.kind === "photo" ? <Photo s={s} len={len} /> : <Clip s={s} />}
            {s.label ? <div style={{ position: "absolute", left: 24, bottom: 24, background: BRAND.paperHi, border: `3px solid ${BRAND.ink}`, padding: "10px 18px", fontSize: 34, fontWeight: 600 }}>{s.label}</div> : null}
          </Sequence>
        );
      })}
    </div>
    {v.shots.map((s, i) => {
      const end = i + 1 < v.shots.length ? v.shots[i + 1].at : sc.frames;
      return <Sequence key={"c" + i} from={s.at} durationInFrames={Math.max(1, end - s.at)} layout="none"><Credit text={s.credit} /></Sequence>;
    })}
  </Frame>
);
const Stats: React.FC<{ v: Extract<Visual, { type: "stats" }>; sc: TScene }> = ({ v, sc }) => (
  <Frame>
    <Title text={v.title} />
    <div style={{ position: "absolute", left: 80, right: 80, top: 330, display: "flex", gap: 40 }}>
      {v.items.map((it, i) => <StatCard key={i} n={it.n} label={it.label} at={sc.cues[it.cue] ?? 0} />)}
    </div>
  </Frame>
);
const StatCard: React.FC<{ n: string; label: string; at: number }> = ({ n, label, at }) => {
  const e = useEnter(at);
  return (
    <div style={{ ...e, flex: 1, background: BRAND.paperHi, border: `3px solid ${BRAND.ink}`, boxShadow: `12px 12px 0 ${BRAND.ink}`, padding: "40px 44px" }}>
      <div style={{ height: 150, fontSize: 130, fontWeight: 700, lineHeight: 1, color: BRAND.signal, whiteSpace: "nowrap" }}>{n}</div>
      <div style={{ height: 80, fontFamily: MONO, fontSize: 28, textTransform: "uppercase", color: BRAND.ink3, marginTop: 20 }}>{label}</div>
    </div>
  );
};
const ListItem: React.FC<{ text: string; at: number; i: number }> = ({ text, at, i }) => {
  const e = useEnter(at);
  return (
    <div style={{ ...e, display: "flex", alignItems: "center", gap: 28, height: 110, borderBottom: `2px solid rgba(0,0,0,.12)` }}>
      <div style={{ width: 64, height: 64, background: BRAND.signal, color: BRAND.paper, fontFamily: MONO, fontSize: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</div>
      <div style={{ fontSize: 48, fontWeight: 500, whiteSpace: "nowrap" }}>{text}</div>
    </div>
  );
};
const List: React.FC<{ v: Extract<Visual, { type: "list" }>; sc: TScene }> = ({ v, sc }) => (
  <Frame>
    <Title text={v.title} />
    <div style={{ position: "absolute", left: 80, right: 80, top: 260 }}>
      {v.items.map((it, i) => <ListItem key={i} i={i} text={it.text} at={sc.cues[it.cue] ?? 0} />)}
    </div>
  </Frame>
);
const Panel: React.FC<{ head: string; rows: string[]; at: number; tone: string }> = ({ head, rows, at, tone }) => {
  const e = useEnter(at);
  return (
    <div style={{ ...e, flex: 1, background: BRAND.paperHi, border: `3px solid ${BRAND.ink}`, padding: "32px 40px" }}>
      <div style={{ height: 70, fontSize: 44, fontWeight: 700, color: tone, whiteSpace: "nowrap" }}>{head}</div>
      {rows.map((r, i) => <div key={i} style={{ height: 76, fontSize: 36, borderTop: "2px solid rgba(0,0,0,.12)", display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>{r}</div>)}
    </div>
  );
};
const Compare: React.FC<{ v: Extract<Visual, { type: "compare" }>; sc: TScene }> = ({ v, sc }) => (
  <Frame>
    <Title text={v.title} />
    <div style={{ position: "absolute", left: 80, right: 80, top: 260, display: "flex", gap: 40, alignItems: "flex-start" }}>
      <Panel head={v.left.head} rows={v.left.rows} at={sc.cues[0] ?? 0} tone={BRAND.ink} />
      <Panel head={v.right.head} rows={v.right.rows} at={sc.cues[1] ?? 20} tone={BRAND.signal} />
    </div>
  </Frame>
);
const Cta: React.FC<{ v: Extract<Visual, { type: "cta" }>; sc: TScene }> = ({ v, sc }) => {
  const e = useEnter(sc.cues[0] ?? 0);
  return (
    <Frame>
      <div style={{ ...e, position: "absolute", left: 80, right: 80, top: 340, textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 700 }}>{v.title}</div>
        {v.lines.map((l, i) => <div key={i} style={{ fontFamily: MONO, fontSize: 44, color: BRAND.signal, marginTop: 28 }}>{l}</div>)}
      </div>
    </Frame>
  );
};
const SceneView: React.FC<{ sc: TScene }> = ({ sc }) => {
  const v = VISUALS[sc.id];
  if (!v) throw new Error(`no visual for scene ${sc.id}`);   // every scene needs a visual for its whole length
  if (v.type === "shots") return <Shots v={v} sc={sc} />;
  if (v.type === "stats") return <Stats v={v} sc={sc} />;
  if (v.type === "list") return <List v={v} sc={sc} />;
  if (v.type === "compare") return <Compare v={v} sc={sc} />;
  return <Cta v={v} sc={sc} />;
};

/** Host clip (hook or outro) in the square card with the brand panel beside it. */
const HostCard: React.FC<{ src: string; kicker: string; line: string }> = ({ src, kicker, line }) => (
  <Frame right={BRAND.disclosure}>
    <div style={{ position: "absolute", left: 92, top: 192, width: 760, height: 760, background: "rgba(0,0,0,.08)" }} />
    <div style={{ position: "absolute", left: 80, top: 180, width: 760, height: 760, border: `3px solid ${BRAND.ink}`, overflow: "hidden", background: "#000" }}>
      <OffthreadVideo src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
    <div style={{ position: "absolute", left: 940, top: 200, right: 80 }}>
      <div style={{ fontFamily: MONO, fontSize: 26, color: BRAND.signal, textTransform: "uppercase" }}>{kicker}</div>
      <div style={{ width: 60, height: 4, background: BRAND.signal, margin: "18px 0 30px" }} />
      <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.15 }}>{line}</div>
      <div style={{ position: "absolute", top: 660, fontSize: 36, fontWeight: 600 }}>{BRAND.host}</div>
      <div style={{ position: "absolute", top: 708, fontFamily: MONO, fontSize: 22, color: BRAND.ink3 }}>{BRAND.name}</div>
    </div>
  </Frame>
);

// Kicker and big line shown beside the host. Keep the line to 3-6 words (the question the video answers).
const HOOK_CARD = { kicker: "The question", line: "What is the question?" };
const OUTRO_CARD = { kicker: "Full guide", line: BRAND.domain };

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const musicVol = interpolate(frame, [INTRO, INTRO + 45, INTRO + TL.total - 60, INTRO + TL.total], [0, MUSIC.volume, MUSIC.volume, 0], clamp);
  return (
    <AbsoluteFill style={{ background: BRAND.paper }}>
      <Sequence from={0} durationInFrames={INTRO}><HostCard src={HOOK.src} {...HOOK_CARD} /></Sequence>
      {TL.scenes.map((sc) => (
        <Sequence key={sc.id} from={INTRO + sc.from} durationInFrames={sc.frames}>
          <SceneView sc={sc} />
          <Sequence from={sc.voiceFrom} layout="none"><Audio src={`${AUDIO}/${sc.id}.mp3`} /></Sequence>
        </Sequence>
      ))}
      <Sequence from={INTRO + TL.total} durationInFrames={OUTRO.frames}><HostCard src={OUTRO.src} {...OUTRO_CARD} /></Sequence>
      <Audio src={MUSIC.src} volume={musicVol} />
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="type-video" component={Video} durationInFrames={TOTAL} fps={TL.fps} width={1920} height={1080} />;
registerRoot(Root);
