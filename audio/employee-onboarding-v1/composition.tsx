import React from "react";
import { AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const RAW = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/video";
const HOOK = `${RAW}/shorts/employee-onboarding-v1/hook-norm.mp4`;
const OUTRO = `${RAW}/host/outro-generic-v2-norm.mp4`;
const SITE = "https://personalsoftwarefactory.com";
const NARR = {"fps":30,"total":4486,"scenes":[{"id":"spec","from":0,"frames":591,"voiceFrom":8,"cues":[31,205,285,458,514]},{"id":"rule","from":591,"frames":510,"voiceFrom":8,"cues":[41,98,186,299,431]},{"id":"phases","from":1101,"frames":522,"voiceFrom":8,"cues":[95,180,233,277,397]},{"id":"screens","from":1623,"frames":690,"voiceFrom":8,"cues":[42,230,323,488,561]},{"id":"result","from":2313,"frames":218,"voiceFrom":8,"cues":[90,140]},{"id":"gaps","from":2531,"frames":653,"voiceFrom":8,"cues":[103,201,349,436,572]},{"id":"untested","from":3184,"frames":397,"voiceFrom":8,"cues":[112,148,190,248,286]},{"id":"cost","from":3581,"frames":630,"voiceFrom":8,"cues":[112,257,359,411,530]},{"id":"cta","from":4211,"frames":275,"voiceFrom":8,"cues":[57,79,214]}]};
const INTRO = 290, OUTRO_F = 230;
const TL = { fps: 30, total: INTRO + NARR.total + OUTRO_F };
type Scene = (typeof NARR.scenes)[number];
const N_SCENES = 11;

// ---------------------------------------------------------------- style
const PAPER = "#f4f1ea", PAPER_HI = "#faf8f3", INK = "#1a1a17", INK2 = "#4d4a43", INK3 = "#6e6a60";
const SIGNAL = "#f0500f", GREEN = "#2f7d4f", AMBER = "#b7791f", RED = "#c0392b", LINE = "rgba(26,26,23,0.16)";
const SANS = '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const Fonts: React.FC = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=block');`}</style>
);

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
const lin = (frame: number, a: number, b: number) => interpolate(frame, [a, b], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });

const Grid: React.FC = () => (
  <AbsoluteFill style={{ backgroundImage: `linear-gradient(${LINE} 1px, transparent 1px), linear-gradient(90deg, ${LINE} 1px, transparent 1px)`, backgroundSize: "48px 48px", opacity: 0.35 }} />
);

const Frame: React.FC<{ label: string; n: number; children: React.ReactNode }> = ({ label, n, children }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const progress = frame / durationInFrames;
  return (
    <AbsoluteFill style={{ background: PAPER, color: INK, fontFamily: SANS }}>
      <Fonts />
      <Grid />
      <div style={{ position: "absolute", left: 80, top: 52, right: 80, display: "flex", justifyContent: "space-between", fontFamily: MONO, fontSize: 22, color: INK3, letterSpacing: 1 }}>
        <span><span style={{ display: "inline-block", width: 18, height: 18, background: SIGNAL, marginRight: 14, verticalAlign: -2 }} />PERSONAL SOFTWARE FACTORY · BUILD TEST</span>
        <span>{String(n).padStart(2, "0")} / {N_SCENES} · {label}</span>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 96, height: 2, background: INK }} />
      <div style={{ position: "absolute", left: 80, top: 96, height: 2, width: `${progress * 1760}px`, background: SIGNAL }} />
      {children}
    </AbsoluteFill>
  );
};

const H: React.FC<{ at?: number; children: React.ReactNode; top?: number; size?: number }> = ({ at = 0, children, top = 150, size = 64 }) => {
  const s = useEnter(at);
  return <div style={{ position: "absolute", left: 80, top, fontSize: size, fontWeight: 600, letterSpacing: -1, ...s }}>{children}</div>;
};

const Check: React.FC<{ size?: number; color?: string; p?: number }> = ({ size = 36, color = GREEN, p = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" />
    <path d="M10 18.5 L16 24 L26 12" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - p)} /></svg>
);
const Cross: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = RED }) => (
  <svg width={size} height={size} viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" />
    <path d="M12 12 L24 24 M24 12 L12 24" stroke={color} strokeWidth="3.5" strokeLinecap="round" /></svg>
);
const Badge: React.FC<{ kind: "over" | "today" | "date"; children: React.ReactNode }> = ({ kind, children }) => {
  const c = kind === "over" ? RED : kind === "today" ? AMBER : INK3;
  return <span style={{ fontFamily: MONO, fontSize: 22, padding: "4px 12px", border: `2px solid ${c}`, color: c, whiteSpace: "nowrap" }}>{children}</span>;
};

// ---------------------------------------------------------------- host card (hook and outro)
const HostCard: React.FC<{ src: string; frames: number; label: string }> = ({ src, frames, label }) => {
  const frame = useCurrentFrame();
  const inP = useSpring(0, 20);
  const out = interpolate(frame, [frames - 10, frames], [1, 0], clamp);
  return (
    <div style={{ position: "absolute", left: 1100, top: 150, width: 720, opacity: Math.min(inP, out), transform: `translateY(${(1 - inP) * 30}px)` }}>
      <div style={{ width: 720, height: 720, border: `3px solid ${INK}`, overflow: "hidden", background: "#222", boxShadow: "14px 14px 0 rgba(26,26,23,0.10)" }}>
        <OffthreadVideo src={src} style={{ width: 720, height: 720 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 18, fontFamily: MONO, fontSize: 22, color: INK3 }}>
        <span><span style={{ display: "inline-block", width: 12, height: 12, borderRadius: 6, background: SIGNAL, marginRight: 10 }} />{label}</span>
        <span>AI AVATAR · HEYGEN</span>
      </div>
    </div>
  );
};

const Intro: React.FC = () => {
  const frame = useCurrentFrame();
  const words = "Here's how to reverse engineer BambooHR from a written spec.".split(" ");
  const a = useEnter(100);
  const b = useEnter(160);
  return (
    <Frame label="THE TEARDOWN" n={1}>
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [6 + i * 4, 16 + i * 4], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "BambooHR" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, ...a }}>
        <Check size={52} p={lin(frame, 104, 124)} />20 / 20 checks passed
      </div>
      <div style={{ position: "absolute", left: 80, top: 740, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, color: SIGNAL, ...b }}>
        <div style={{ width: 52, height: 52, background: SIGNAL }} />44 gaps found in the spec
      </div>
      <HostCard src={HOOK} frames={INTRO} label="SAM CLAASSEN" />
    </Frame>
  );
};

const Outro: React.FC = () => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const url = "personalsoftwarefactory.com";
  const typed = url.slice(0, Math.max(0, Math.floor((frame - 10) / 1.4)));
  const sub = useEnter(70);
  return (
    <Frame label="SEE YOU TOMORROW" n={N_SCENES}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 84, fontWeight: 600, letterSpacing: -2, ...a }}>The full spec is free.</div>
      <div style={{ position: "absolute", left: 80, top: 400, fontFamily: MONO, fontSize: 50, color: SIGNAL }}>{typed}<span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span></div>
      <div style={{ position: "absolute", left: 80, top: 490, fontSize: 34, color: INK3, ...sub }}>/blueprints/employee-onboarding</div>
      <div style={{ position: "absolute", left: 80, top: 640, width: 940, fontSize: 40, lineHeight: 1.4, color: INK2, ...sub }}>Build it, then tell me what broke.</div>
      <HostCard src={OUTRO} frames={OUTRO_F} label="SAM CLAASSEN" />
    </Frame>
  );
};

// ---------------------------------------------------------------- spec
const SPEC_LINES = ["# Employee Onboarding", "Replaces: BambooHR (onboarding checklist)", "", "## 5. Data model", "Person · Template · TemplateTask", "Onboarding · Task · Event · Settings", "", "## 6. Due dates", "- R2. due = start date + offset", "## 8. Business rules", "- R3. Owners come from roles"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(s.cues[0] - 10);
  const chars = Math.floor(Math.max(0, frame - s.cues[0]) * 3.2);
  let used = 0;
  const items: [string, string][] = [["Templates", "A start date becomes dated tasks"], ["Owners", "One person per task, by role"], ["Overdue", "Late tasks are flagged"], ["Digest", "One email a day each"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. What a small team needs from BambooHR.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>employee-onboarding.md</div>
        {SPEC_LINES.map((l, i) => {
          const start = used; used += l.length + 1;
          const shown = l.slice(0, Math.max(0, Math.min(l.length, chars - start)));
          const head = l.startsWith("#");
          return <div key={i} style={{ minHeight: 38, color: head ? "#f7b48f" : "#e9e6dc", whiteSpace: "pre" }}>{shown}{chars >= start && chars < start + l.length ? "▍" : ""}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 900, top: 300, width: 940 }}>
        {items.map(([k, v], i) => {
          const sp = useSpring(s.cues[i + 1]);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 24, padding: "26px 0", borderBottom: `1px solid ${LINE}`, opacity: sp, transform: `translateX(${(1 - sp) * 60}px)` }}>
              <Check p={interpolate(frame, [s.cues[i + 1] + 6, s.cues[i + 1] + 20], [0, 1], clamp)} />
              <div style={{ width: 250, fontSize: 36, fontWeight: 600, whiteSpace: "nowrap" }}>{k}</div>
              <div style={{ fontSize: 29, color: INK2, width: 580, whiteSpace: "nowrap" }}>{v}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- rule
const Rule: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const note = useSpring(c[0]);
  const weekend = useSpring(c[2]);
  const move = useSpring(c[4]);
  const rows: [string, string, string, string, boolean][] = [["Order laptop", "−7", "Mon Oct 19", "Mon Oct 19", false], ["Prepare desk", "−1", "Sun Oct 25", "Fri Oct 23", true], ["Welcome meeting", "0", "Mon Oct 26", "Mon Oct 26", false], ["90-day review", "+90", "Sun Jan 24", "Fri Jan 22, 2027", true]];
  const W = [380, 130, 250, 300];
  const cell = (t: string, w: number, st: React.CSSProperties = {}) => <span style={{ width: w, whiteSpace: "nowrap", ...st }}>{t}</span>;
  return (
    <Frame label="THE CORE RULE" n={3}>
      <H>Due dates follow the start date</H>
      <div style={{ position: "absolute", left: 80, top: 252, height: 40, fontFamily: MONO, fontSize: 24, color: SIGNAL, whiteSpace: "nowrap", opacity: note }}>R2 · DUE = START DATE + OFFSET · START MON OCT 26</div>
      <div style={{ position: "absolute", left: 80, top: 320, width: 1080 }}>
        <div style={{ display: "flex", fontFamily: MONO, fontSize: 22, color: INK3, height: 44, alignItems: "center", opacity: useSpring(c[1] - 8) }}>
          {cell("TASK", W[0])}{cell("OFFSET", W[1])}{cell("RAW DATE", W[2])}{cell("DUE DATE", W[3])}
        </div>
        {rows.map(([t, o, raw, due, wk], i) => {
          const sp = useSpring(c[1] + i * 10);
          const hot = wk && frame >= c[2];
          const desk = i === 1 && frame >= c[3];
          const strike = wk ? lin(frame, c[2] + 6 + (i === 1 ? 0 : 20), c[2] + 18 + (i === 1 ? 0 : 20)) : 0;
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", height: 100, borderBottom: `1px solid ${LINE}`, fontSize: 34, opacity: sp, transform: `translateX(${(1 - sp) * 50}px)`, background: desk ? "rgba(240,80,15,0.08)" : "transparent", outline: desk ? `3px solid ${SIGNAL}` : "none" }}>
              {cell(t, W[0], { fontWeight: desk ? 600 : 500, paddingLeft: 12 })}
              {cell(o, W[1], { fontFamily: MONO, fontSize: 28, color: INK2 })}
              <span style={{ width: W[2], whiteSpace: "nowrap", fontFamily: MONO, fontSize: 28, color: hot ? RED : INK2, position: "relative" }}>{raw}{wk && <span style={{ position: "absolute", left: 0, top: "50%", height: 3, width: `${strike * 170}px`, background: RED }} />}</span>
              {cell(due, W[3], { fontFamily: MONO, fontSize: 28, fontWeight: 500, color: wk ? (strike > 0.5 ? GREEN : INK) : INK })}
            </div>
          );
        })}
        <div style={{ marginTop: 26, display: "flex", alignItems: "center", gap: 18, fontSize: 30, color: INK2, opacity: weekend, whiteSpace: "nowrap" }}>
          <span style={{ fontFamily: MONO, fontSize: 24, color: RED, border: `2px solid ${RED}`, padding: "4px 12px" }}>SAT / SUN</span>moves to the Friday before
        </div>
      </div>
      <div style={{ position: "absolute", left: 1220, top: 320, width: 620, height: 560, border: `3px solid ${AMBER}`, background: PAPER_HI, padding: "32px 36px", opacity: move, transform: `translateY(${(1 - move) * 50}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3, height: 40, whiteSpace: "nowrap" }}>R5 · THE START DATE MOVES</div>
        <div style={{ fontFamily: MONO, fontSize: 30, fontWeight: 500, height: 60, whiteSpace: "nowrap" }}>Mon Oct 26 → <span style={{ color: SIGNAL }}>Mon Nov 2</span></div>
        {[["Order laptop", "Mon Oct 19 → Mon Oct 26"], ["Prepare desk", "Fri Oct 23 → Fri Oct 30"]].map(([k, v], i) => (
          <div key={k} style={{ marginTop: 26, opacity: lin(frame, c[4] + 18 + i * 14, c[4] + 30 + i * 14) }}>
            <div style={{ fontSize: 30, fontWeight: 600, height: 42, whiteSpace: "nowrap" }}>{k}</div>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK2, height: 40, whiteSpace: "nowrap" }}>{v}</div>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 28, opacity: lin(frame, c[4] + 50, c[4] + 64), whiteSpace: "nowrap" }}><Check size={34} p={lin(frame, c[4] + 54, c[4] + 70)} />Every open task moves</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Templates, people, sign-in"], ["Onboardings", "Tasks, dates, owners"], ["New hire view", "My first weeks"], ["Job and export", "Digests and the CSV"]];
  const browser = useSpring(s.cues[4]);
  return (
    <Frame label="THE BUILD" n={4}>
      <H>Four phases, one prompt each</H>
      <div style={{ position: "absolute", left: 80, right: 80, top: 280, display: "flex", gap: 32 }}>
        {ph.map(([t, d], i) => {
          const sp = useSpring(s.cues[i]);
          const fill = lin(frame, s.cues[i] + 4, (s.cues[i + 1] ?? s.cues[i] + 60) + 20);
          return (
            <div key={t} style={{ flex: 1, background: PAPER_HI, border: `2px solid ${INK}`, padding: 32, height: 330, opacity: sp, transform: `translateY(${(1 - sp) * 80}px)` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 40 }}>
                <span style={{ fontFamily: MONO, fontSize: 26, color: SIGNAL }}>PHASE {i + 1}</span>
                <Check size={34} p={interpolate(fill, [0.9, 1], [0, 1], clamp)} />
              </div>
              <div style={{ fontSize: 40, fontWeight: 600, marginTop: 22, lineHeight: "48px", height: 48, whiteSpace: "nowrap" }}>{t}</div>
              <div style={{ fontSize: 28, color: INK2, marginTop: 18, lineHeight: "38px", height: 76, overflow: "hidden" }}>{d}</div>
              <div style={{ marginTop: 26, height: 10, background: LINE }}><div style={{ height: 10, width: `${fill * 100}%`, background: SIGNAL }} /></div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 670, width: 1760, height: 300, border: `2px solid ${INK}`, background: PAPER_HI, opacity: browser, transform: `translateY(${(1 - browser) * 60}px)` }}>
        <div style={{ height: 44, borderBottom: `2px solid ${INK}`, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontFamily: MONO, fontSize: 20, color: INK3 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} /><span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} /><span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} />
          <span style={{ marginLeft: 16 }}>acceptance checks · real browser · fresh seed data</span>
        </div>
        <div style={{ padding: "18px 28px", fontFamily: MONO, fontSize: 25, lineHeight: 1.7 }}>
          {["Prepare desk or ship equipment: due Fri Oct 23", "Ana Lima opens Leo Grant's onboarding: Not found", "Leo asks for his 30-day check-in note: refused", "Job at 08:00: Leo's digest lists his overdue training"].map((t, i) => {
            const at = s.cues[4] + 8 + i * 14;
            const p = interpolate(frame, [at, at + 10], [0, 1], clamp);
            return <div key={i} style={{ opacity: p, display: "flex", gap: 16, whiteSpace: "nowrap" }}><span style={{ color: GREEN }}>PASS</span><span>{t}</span></div>;
          })}
        </div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- screens
const VW = 1760, VH = 790;
type Box = [number, number, number, number];
const SHOTS: { src: string; cap: string; iw: number; ih: number; box: Box; box2?: Box; at2?: number }[] = [
  { src: `${SITE}/builds/employee-onboarding/test-onboarding.webp`, iw: 1440, ih: 1050, cap: "Priya Nair: manager, buddy, and Ben's laptop task due Mon Nov 9", box: [246, 221, 330, 46], box2: [238, 688, 962, 96], at2: 125 },
  { src: `${SITE}/builds/employee-onboarding/test-onboardings.webp`, iw: 1440, ih: 1050, cap: "Onboardings: Leo Grant in progress, 10 of 15, 2 overdue", box: [238, 298, 962, 36] },
  { src: `${SITE}/builds/employee-onboarding/test-preview.webp`, iw: 1440, ih: 1050, cap: "New onboarding for Rosa Diaz: 4 tasks already overdue", box: [254, 16, 932, 44] },
  { src: `${SITE}/builds/employee-onboarding/test-my-tasks.webp`, iw: 1440, ih: 1050, cap: "Ben Cho's tasks: Overdue, Today, This week, Later", box: [230, 172, 150, 310] },
  { src: `${SITE}/builds/employee-onboarding/test-first-weeks.webp`, iw: 1440, ih: 1050, cap: "Leo's first weeks: what others do for him, first names only", box: [236, 745, 964, 300] },
];
const axis = (s: number, view: number, size: number, c: number) => (s * size <= view ? (view - s * size) / 2 : Math.min(0, Math.max(view - s * size, view / 2 - s * c)));
const Screens: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const starts = [0, s.cues[1] - 10, s.cues[2] - 10, s.cues[3] - 10, s.cues[4] - 10, durationInFrames];
  return (
    <Frame label="THE TEST BUILD" n={5}>
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        if (frame < a - 12 || frame > b + 12) return null;
        const inP = i === 0 ? 1 : interpolate(frame, [a - 12, a + 6], [0, 1], clamp);
        const outP = i === SHOTS.length - 1 ? interpolate(frame, [b - 10, b], [1, 0], clamp) : interpolate(frame, [b - 6, b + 12], [1, 0], clamp);
        const s0 = sh.iw / sh.ih > VW / VH ? VW / sh.iw : Math.min(VW / sh.iw, VH / sh.ih, 1.4);
        const scaleFor = (bx: Box) => Math.max(s0, Math.min((VW * 0.72) / bx[2], (VH * 0.72) / bx[3], 2.6));
        const Z = Math.min(32, (b - a) * 0.25);
        const t = lin(frame, a + 4, a + 4 + Z);
        const pan = sh.box2 && sh.at2 ? lin(frame, sh.at2 - 14, sh.at2 + 10) : 0;
        const b1 = sh.box, b2 = sh.box2 ?? sh.box;
        const toS = scaleFor(b1) + (scaleFor(b2) - scaleFor(b1)) * pan;
        const cx = (b1[0] + b1[2] / 2) + ((b2[0] + b2[2] / 2) - (b1[0] + b1[2] / 2)) * pan;
        const cy = (b1[1] + b1[3] / 2) + ((b2[1] + b2[3] / 2) - (b1[1] + b1[3] / 2)) * pan;
        const sc = s0 + (toS - s0) * t;
        const tx = axis(sc, VW, sh.iw, cx);
        const ty = axis(sc, VH, sh.ih, cy);
        const boxP = lin(frame, a + 4 + Z * 0.6, a + 14 + Z * 0.6) * outP;
        const pad = 10;
        const boxEl = (bx: Box, op: number) => <div style={{ position: "absolute", left: bx[0] - pad, top: bx[1] - pad, width: bx[2] + pad * 2, height: bx[3] + pad * 2, border: `${4 / sc}px solid ${SIGNAL}`, borderRadius: 6, opacity: op }} />;
        return (
          <div key={i} style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, overflow: "hidden", border: `2px solid ${INK}`, background: "#f6f7f9", opacity: Math.min(inP, outP) }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: sh.iw, height: sh.ih, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${sc})` }}>
              <Img src={sh.src} style={{ position: "absolute", left: 0, top: 0, width: sh.iw, height: sh.ih }} />
              {boxEl(b1, boxP * (1 - pan))}
              {sh.box2 && boxEl(sh.box2, boxP * pan)}
            </div>
          </div>
        );
      })}
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        const p = Math.min(interpolate(frame, [a, a + 12], [0, 1], clamp), interpolate(frame, [b - 8, b], [1, 0], clamp));
        return <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: p, whiteSpace: "nowrap" }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>{i + 1}/5</span>{sh.cap}</div>;
      })}
    </Frame>
  );
};

// ---------------------------------------------------------------- result
const Result: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const p = lin(frame, s.cues[0] - 20, s.cues[0] + 30);
  const n = Math.round(20 * p);
  const t = Math.round(109 * lin(frame, s.cues[1], s.cues[1] + 40));
  const r = 210, C = 2 * Math.PI * r;
  const tests = useEnter(s.cues[1]);
  const fresh = useEnter(20);
  return (
    <Frame label="THE RESULT" n={6}>
      <H>Final browser run</H>
      <svg width="560" height="560" style={{ position: "absolute", left: 140, top: 300 }}>
        <circle cx="280" cy="280" r={r} fill="none" stroke={LINE} strokeWidth="28" />
        <circle cx="280" cy="280" r={r} fill="none" stroke={GREEN} strokeWidth="28" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 280 280)" />
        <text x="280" y="300" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="600" fill={INK}>{n}</text>
        <text x="280" y="370" textAnchor="middle" fontFamily={MONO} fontSize="30" fill={INK3}>OF 20 CHECKS</text>
      </svg>
      <div style={{ position: "absolute", left: 860, top: 360, ...tests }}>
        <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -4 }}>{t}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: INK3 }}>AUTOMATED TESTS PASSING</div>
      </div>
      <div style={{ position: "absolute", left: 860, top: 720, display: "flex", alignItems: "center", gap: 20, fontSize: 38, ...fresh }}>
        <Check size={44} p={lin(frame, 24, 38)} />One run, on a fresh database
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- gaps
const Gaps: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const showCount = Math.round(44 * lin(frame, c[0] - 10, c[0] + 26));
  const g1 = c[1] - 10, g2 = c[2] - 10, g3 = c[3] - 10;
  const stage = frame < g1 ? 0 : frame < g2 ? 1 : frame < g3 ? 2 : frame < c[4] ? 3 : 4;
  const stageIn = (at: number) => lin(frame, at - 4, at + 12);
  const fixed = useSpring(c[4]);
  const examples = ["Anyone could own a private check-in", "The people team could remove themselves", "A title starting with = ran as a formula"];
  const field = (k: string, v: React.ReactNode, col: string = INK) => (
    <div style={{ display: "flex", height: 62, alignItems: "center", fontSize: 30, borderBottom: `1px solid ${LINE}` }}><span style={{ width: 300, fontFamily: MONO, fontSize: 24, color: INK3 }}>{k}</span><span style={{ color: col, whiteSpace: "nowrap" }}>{v}</span></div>
  );
  const panel = (at: number, head: string, k1: string, v1: React.ReactNode, k2: string, v2: string, fix: string) => (
    <div style={{ opacity: stageIn(at) }}>
      <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>{head}</div>
      <div style={{ marginTop: 22 }}>
        {field(k1, v1)}
        {field(k2, <span style={{ opacity: lin(frame, at + 16, at + 30) }}>{v2}</span>, RED)}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, at + 40, at + 54), whiteSpace: "nowrap" }}><Check />{fix}</div>
    </div>
  );
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 800 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, width: 760 }}>
          {Array.from({ length: 44 }, (_, i) => <div key={i} style={{ width: 50, height: 50, background: i < showCount ? (i === 10 || i === 14 || i === 41 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
        </div>
        <div style={{ marginTop: 40 }}>
          {examples.map((t, i) => {
            const on = stage === i + 1, seen = stage > i;
            return <div key={t} style={{ fontSize: 32, padding: "14px 0", borderBottom: `1px solid ${LINE}`, color: on ? SIGNAL : INK2, fontWeight: on ? 600 : 400, opacity: seen ? 1 : 0.25, whiteSpace: "nowrap" }}>{i + 1}. {t}</div>;
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 960, top: 270, width: 880, height: 640, border: `2px solid ${INK}`, background: PAPER_HI, padding: 44 }}>
        {stage === 0 && <div style={{ fontSize: 40, color: INK2, lineHeight: 1.4, opacity: lin(frame, c[0] + 10, c[0] + 26) }}>Places where Claude had to guess, because the spec was silent, ambiguous, or contradicted itself.</div>}
        {stage === 1 && panel(g1, "R8 · 30, 60 AND 90-DAY CHECK-INS", "NOTE READERS", "The manager and the people team", "OWNER COULD BE", "Any role, even the buddy", "Fix: check-ins are manager or people tasks")}
        {stage === 2 && panel(g2, "R12 · ADMIN → PEOPLE", "DEACTIVATE", "Dana Ruiz, herself", "THE SPEC SAID", "Nothing about it", "Fix: refused, never an empty people team")}
        {stage === 3 && panel(g3, "PHASE 4 · CSV EXPORT", "TASK TITLE", <span style={{ fontFamily: MONO }}>starts with =</span>, "IN A SPREADSHEET", "Runs as a formula", "Fix: such cells start with an apostrophe")}
        {stage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: fixed, transform: `scale(${0.8 + 0.2 * fixed})` }}>
            <Check size={160} p={fixed} />
            <div style={{ fontSize: 52, fontWeight: 600, marginTop: 30 }}>All 44 fixed in the spec</div>
          </div>
        )}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Production sign-in", "Real email delivery", "Hourly job on a real scheduler", "Other time zones", "Hosting"];
  const end = useEnter(s.cues[4] + 30);
  return (
    <Frame label="NOT TESTED" n={8}>
      <H>Passing isn't production-ready</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 1100 }}>
        {items.map((t, i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, height: 110, borderBottom: `1px solid ${LINE}`, opacity: 0.22 + 0.78 * sp, transform: `translateX(${(1 - sp) * 24}px)` }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${AMBER}` }} />
              <div style={{ fontSize: 40, fontWeight: 500, whiteSpace: "nowrap" }}>{t}</div>
              <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 24, color: AMBER }}>NOT TESTED</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1260, top: 380, width: 580, fontSize: 40, lineHeight: 1.35, color: INK2, ...end }}>
        Check these yourself before your team relies on it.
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL, marginTop: 30 }}>personalsoftwarefactory.com/guides/ai-built-tools-production-readiness</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- cost
const Cost: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const card = useSpring(c[0] - 6);
  const call = useEnter(c[2]);
  const pay = useEnter(c[3]);
  const build = useEnter(c[4]);
  const rows: [string, string, number][] = [["Core, up to 25 people", "$250 a month", c[0]], ["Pro / Elite, up to 25", "$425 / $650", c[0] + 18], ["Core, above 25 people", "$10.25 / person", c[1]]];
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 940, height: 330, border: `2px solid ${INK}`, background: PAPER_HI, padding: "28px 36px", opacity: card, transform: `translateY(${(1 - card) * 50}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
          <span style={{ fontSize: 44, fontWeight: 600 }}>BambooHR</span>
          <span style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL, whiteSpace: "nowrap" }}>PER MONTH</span>
        </div>
        {rows.map(([k, v, at]) => (
          <div key={k} style={{ display: "flex", height: 70, alignItems: "center", marginTop: 8, fontSize: 30, borderBottom: `1px solid ${LINE}`, opacity: lin(frame, at, at + 12) }}>
            <span style={{ width: 460, color: INK2, whiteSpace: "nowrap" }}>{k}</span><span style={{ fontFamily: MONO, fontSize: 28, whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, top: 612, width: 940, fontSize: 24, color: INK3, opacity: card }}>Source: bamboohr.com/pricing, checked October 2026.</div>
      <div style={{ position: "absolute", left: 80, top: 670, width: 940, display: "flex", alignItems: "baseline", gap: 24, ...call }}>
        <span style={{ fontSize: 56, fontWeight: 600, color: SIGNAL, whiteSpace: "nowrap" }}>A whole HR system</span>
        <span style={{ fontSize: 30, color: INK2, whiteSpace: "nowrap" }}>onboarding is one part</span>
      </div>
      <div style={{ position: "absolute", left: 80, top: 790, width: 940, ...pay }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>BUY IT IF YOU NEED</div>
        <div style={{ fontSize: 32, marginTop: 14, lineHeight: 1.45, whiteSpace: "nowrap" }}>Records, time off, payroll and benefits</div>
      </div>
      <div style={{ position: "absolute", left: 1080, top: 270, width: 760, height: 640, border: `3px solid ${SIGNAL}`, background: PAPER_HI, padding: 44, ...build }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL }}>BUILD IT IF</div>
        {["Onboarding keeps slipping", "No HR system yet", "Several owners per new hire"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, fontSize: 36, whiteSpace: "nowrap" }}><Check />{t}</div>
        ))}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "13 rules", "Seed data", "4 phase prompts", "20 checks", "44 fixes included"];
  return (
    <Frame label="EVERYTHING IN ONE FILE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 100, fontWeight: 600, letterSpacing: -3, ...a }}>Everything is in one file.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 14);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${i === 5 ? SIGNAL : INK}`, color: i === 5 ? SIGNAL : INK, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 40, color: INK3, opacity: lin(frame, s.cues[2], s.cues[2] + 20) }}>employee-onboarding.md · free</div>
    </Frame>
  );
};

const SCENES: Record<string, React.FC<{ s: Scene }>> = { spec: Spec, rule: Rule, phases: Phases, screens: Screens, result: Result, gaps: Gaps, untested: Untested, cost: Cost, cta: Cta };

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const endNarr = INTRO + NARR.total;
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Audio src={`${MEDIA}/music/chill-wave-kevin-macleod.mp3`} volume={(f) => interpolate(f, [INTRO - 10, INTRO + 35, endNarr - 30, endNarr + 10], [0, 0.19, 0.19, 0], clamp)} />
      <Sequence from={0} durationInFrames={INTRO}>
        <Intro />
      </Sequence>
      {NARR.scenes.map((sc) => {
        const C = SCENES[sc.id];
        return (
          <Sequence key={sc.id} from={INTRO + sc.from} durationInFrames={sc.frames}>
            <C s={sc} />
            <Sequence from={sc.voiceFrom}>
              <Audio src={`${MEDIA}/employee-onboarding-v1/${sc.id}.mp3`} />
            </Sequence>
          </Sequence>
        );
      })}
      <Sequence from={endNarr} durationInFrames={OUTRO_F}>
        <Outro />
      </Sequence>
      <span style={{ display: "none" }}>{frame}</span>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="type-video" component={Video} durationInFrames={TL.total} fps={TL.fps} width={1920} height={1080} />;
registerRoot(Root);
