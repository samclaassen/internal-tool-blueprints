import React from "react";
import { AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const RAW = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/video";
const HOOK = `${RAW}/shorts/feedback-inbox-v1/hook-norm.mp4`;
const OUTRO = `${RAW}/host/outro-generic-v2-norm.mp4`;
const SITE = "https://personalsoftwarefactory.com";
const NARR = {"fps":30,"total":4364,"scenes":[{"id":"spec","from":0,"frames":538,"voiceFrom":8,"cues":[29,163,267,343,436]},{"id":"rule","from":538,"frames":558,"voiceFrom":8,"cues":[38,84,291,418,480]},{"id":"phases","from":1096,"frames":596,"voiceFrom":8,"cues":[95,194,274,365,475]},{"id":"screens","from":1692,"frames":613,"voiceFrom":8,"cues":[45,217,288,400,493]},{"id":"result","from":2305,"frames":245,"voiceFrom":8,"cues":[94,153]},{"id":"gaps","from":2550,"frames":539,"voiceFrom":8,"cues":[100,201,318,376,462]},{"id":"untested","from":3089,"frames":358,"voiceFrom":8,"cues":[100,135,175,250]},{"id":"cost","from":3447,"frames":627,"voiceFrom":8,"cues":[98,137,299,501]},{"id":"cta","from":4074,"frames":290,"voiceFrom":8,"cues":[57,84,232]}]};
const INTRO = 267, OUTRO_F = 230;
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
  const words = "Here's how to reverse engineer Productboard from a written spec.".split(" ");
  const a = useEnter(100);
  const b = useEnter(160);
  return (
    <Frame label="THE TEARDOWN" n={1}>
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [6 + i * 4, 16 + i * 4], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "Productboard" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, ...a }}>
        <Check size={52} p={lin(frame, 104, 124)} />25 / 25 checks passed
      </div>
      <div style={{ position: "absolute", left: 80, top: 740, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, color: SIGNAL, ...b }}>
        <div style={{ width: 52, height: 52, background: SIGNAL }} />20 gaps found in the spec
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
      <div style={{ position: "absolute", left: 80, top: 490, fontSize: 34, color: INK3, ...sub }}>/blueprints/feedback-inbox</div>
      <div style={{ position: "absolute", left: 80, top: 640, width: 940, fontSize: 40, lineHeight: 1.4, color: INK2, ...sub }}>Build it, then tell me what broke.</div>
      <HostCard src={OUTRO} frames={OUTRO_F} label="SAM CLAASSEN" />
    </Frame>
  );
};

// ---------------------------------------------------------------- spec
const SPEC_LINES = ["# Customer Feedback Inbox", "Replaces: Productboard (feedback, insights)", "", "## 5. Data model", "Customer · Feedback · Theme · Vote", "StatusChange · FollowUp · Event", "", "## 6. Theme metrics", "- Evidence · Accounts · MRR · Votes", "## 8. Business rules", "- R9. Follow-up list when shipped"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(s.cues[0] - 10);
  const chars = Math.floor(Math.max(0, frame - s.cues[0]) * 3.2);
  let used = 0;
  const items: [string, string][] = [["One inbox", "In the customer's own words"], ["Accounts", "Each quote tied to its MRR"], ["Themes", "Evidence, revenue and votes"], ["Follow-ups", "Who to tell when it ships"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. What a small team needs from Productboard.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>feedback-inbox.md</div>
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
  const q1 = useSpring(c[1]), q2 = useSpring(c[1] + 40);
  const theme = useSpring(c[2] - 10);
  const once = useSpring(c[3]);
  const vote = useSpring(c[4]);
  const quote = (p: number, top: number, src: string, who: string, text: string) => (
    <div style={{ position: "absolute", left: 80, top, width: 820, height: 170, border: `2px solid ${INK}`, background: PAPER_HI, padding: "20px 30px", opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", height: 40, fontFamily: MONO, fontSize: 22, color: INK3 }}>
        <span style={{ whiteSpace: "nowrap" }}>ACME CORP · $2,400 / MONTH</span><span style={{ whiteSpace: "nowrap" }}>{src}</span>
      </div>
      <div style={{ fontSize: 30, lineHeight: "40px", height: 40, whiteSpace: "nowrap", marginTop: 8 }}>{text}</div>
      <div style={{ fontSize: 24, color: INK3, marginTop: 14, whiteSpace: "nowrap" }}>{who}</div>
    </div>
  );
  const row = (k: string, v: React.ReactNode, col: string = INK, extra?: React.ReactNode) => (
    <div style={{ display: "flex", alignItems: "center", height: 74, fontSize: 32, borderBottom: `1px solid ${LINE}` }}>
      <span style={{ width: 230, color: INK2, whiteSpace: "nowrap" }}>{k}</span>
      <span style={{ fontFamily: MONO, fontSize: 32, color: col, whiteSpace: "nowrap", width: 200 }}>{v}</span>
      <span style={{ fontFamily: MONO, fontSize: 22, color: INK3, whiteSpace: "nowrap" }}>{extra}</span>
    </div>
  );
  return (
    <Frame label="THE CORE RULE" n={3}>
      <H>Revenue counts once per account</H>
      {quote(q1, 290, "TICKET", "Priya Shah", "“We need SSO before we can roll this out…”")}
      {quote(q2, 490, "CALL", "Tom Becker", "“IT keeps asking when we'll support SSO…”")}
      <div style={{ position: "absolute", left: 80, top: 700, width: 820, height: 170, border: `2px dashed ${INK3}`, padding: "20px 30px", opacity: vote, transform: `translateY(${(1 - vote) * 30}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3, height: 40, whiteSpace: "nowrap" }}>HARBOR STUDIO · VOTE</div>
        <div style={{ fontSize: 30, marginTop: 8, whiteSpace: "nowrap" }}>A vote adds a vote, never revenue</div>
      </div>
      <div style={{ position: "absolute", left: 1000, top: 290, width: 840, height: 580, border: `3px solid ${INK}`, background: PAPER_HI, padding: "28px 40px", opacity: theme, transform: `translateY(${(1 - theme) * 40}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3, height: 36 }}>THEME</div>
        <div style={{ fontSize: 46, fontWeight: 600, height: 70, whiteSpace: "nowrap" }}>Single sign-on</div>
        {row("Evidence", "2", INK, "two quotes")}
        {row("Accounts", "1", INK, "Acme Corp")}
        {row("MRR", "$2,400", GREEN, <span style={{ opacity: once }}>not <span style={{ textDecoration: "line-through", color: RED }}>$4,800</span></span>)}
        {row("Votes", <span>{frame >= c[4] ? 2 : 1}</span>, INK, <span style={{ opacity: vote }}>+0 MRR</span>)}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Customers, people, outbox"], ["Capture", "Inbound endpoint, triage"], ["Themes", "Votes, promotion, roadmap"], ["Close the loop", "Follow-ups, CSV export"]];
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
          {["Admin: Customers lists four customers, company total $3,929", "Inbound POST with the wrong secret: 401, nothing saved", "Another vote for Harbor Studio is refused; MRR stays $2,400", "Shipping Single sign-on lists Acme Corp and Harbor Studio"].map((t, i) => {
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
const SHOTS: { src: string; cap: string; iw: number; ih: number; box: Box }[] = [
  { src: `${SITE}/builds/feedback-inbox/test-themes.webp`, iw: 1440, ih: 1050, cap: "Themes: Single sign-on first, 2 pieces of evidence, $2,400, 2 votes", box: [248, 354, 946, 42] },
  { src: `${SITE}/builds/feedback-inbox/test-theme.webp`, iw: 1440, ih: 1050, cap: "Single sign-on: Under review, then Planned, with notes", box: [258, 652, 924, 160] },
  { src: `${SITE}/builds/feedback-inbox/test-inbox.webp`, iw: 1440, ih: 1050, cap: "Inbox: each quote with its customer, MRR and source", box: [246, 360, 948, 204] },
  { src: `${SITE}/builds/feedback-inbox/test-roadmap.webp`, iw: 1440, ih: 1050, cap: "Roadmap: five lanes, an owner on every card", box: [246, 260, 948, 214] },
  { src: `${SITE}/builds/feedback-inbox/test-follow-ups.webp`, iw: 1440, ih: 1050, cap: "Follow-ups: every account to tell when it ships", box: [240, 524, 958, 342] },
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
        const box = sh.box;
        const s0 = sh.iw / sh.ih > VW / VH ? VW / sh.iw : Math.min(VW / sh.iw, VH / sh.ih, 1.4);
        const toS = Math.max(s0, Math.min((VW * 0.72) / box[2], (VH * 0.72) / box[3], 2.6));
        const Z = Math.min(32, (b - a) * 0.25);
        const t = lin(frame, a + 4, a + 4 + Z);
        const sc = s0 + (toS - s0) * t;
        const tx = axis(sc, VW, sh.iw, box[0] + box[2] / 2);
        const ty = axis(sc, VH, sh.ih, box[1] + box[3] / 2);
        const boxP = lin(frame, a + 4 + Z * 0.6, a + 14 + Z * 0.6) * outP;
        const pad = 10;
        return (
          <div key={i} style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, overflow: "hidden", border: `2px solid ${INK}`, background: "#f6f7f9", opacity: Math.min(inP, outP) }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: sh.iw, height: sh.ih, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${sc})` }}>
              <Img src={sh.src} style={{ position: "absolute", left: 0, top: 0, width: sh.iw, height: sh.ih }} />
              <div style={{ position: "absolute", left: box[0] - pad, top: box[1] - pad, width: box[2] + pad * 2, height: box[3] + pad * 2, border: `${4 / sc}px solid ${SIGNAL}`, borderRadius: 6, opacity: boxP }} />
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
  const n = Math.round(25 * p);
  const t = Math.round(157 * lin(frame, s.cues[1], s.cues[1] + 40));
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
        <text x="280" y="370" textAnchor="middle" fontFamily={MONO} fontSize="30" fill={INK3}>OF 25 CHECKS</text>
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
  const showCount = Math.round(20 * lin(frame, c[0] - 10, c[0] + 26));
  const g1 = c[1] - 10, g2 = c[2] - 10, g3 = c[3] - 10;
  const stage = frame < g1 ? 0 : frame < g2 ? 1 : frame < g3 ? 2 : frame < c[4] ? 3 : 4;
  const stageIn = (at: number) => lin(frame, at - 4, at + 12);
  const fixed = useSpring(c[4]);
  const examples = ["Outbox in no phase prompt", "Seed people had no emails", "CSV exports: no exact columns"];
  const field = (k: string, v: React.ReactNode, col: string = INK) => (
    <div style={{ display: "flex", height: 62, alignItems: "center", fontSize: 30, borderBottom: `1px solid ${LINE}` }}><span style={{ width: 300, fontFamily: MONO, fontSize: 24, color: INK3 }}>{k}</span><span style={{ color: col, whiteSpace: "nowrap" }}>{v}</span></div>
  );
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 800 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 700 }}>
          {Array.from({ length: 20 }, (_, i) => <div key={i} style={{ width: 58, height: 58, background: i < showCount ? (i === 0 || i === 2 || i === 18 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
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
        {stage === 1 && (
          <div style={{ opacity: stageIn(g1) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>ADMIN: OUTBOX</div>
            <div style={{ marginTop: 22 }}>
              {field("BUILT IN", <span style={{ opacity: lin(frame, g1 + 20, g1 + 34) }}>No phase prompt</span>, RED)}
              {field("READ BY", "Phase 3 and 4 checks")}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, g1 + 50, g1 + 64) }}><Check />Fix: Phase 1 now builds it</div>
          </div>
        )}
        {stage === 2 && (
          <div style={{ opacity: stageIn(g2) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>SEED DATA · PEOPLE</div>
            <div style={{ marginTop: 22 }}>
              {field("NAMES", "Dana, Maya, Sam, Jo, Ben")}
              {field("EMAILS", <span style={{ opacity: lin(frame, g2 + 14, g2 + 28) }}>None given</span>, RED)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, g2 + 34, g2 + 48) }}><Check />Fix: every person has one</div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ opacity: stageIn(g3) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>CSV EXPORT</div>
            <div style={{ marginTop: 22 }}>
              {field("HEADERS", <span style={{ opacity: lin(frame, g3 + 14, g3 + 28) }}>Not specified</span>, RED)}
              {field("FORMATS", <span style={{ opacity: lin(frame, g3 + 14, g3 + 28) }}>Not specified</span>, RED)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, g3 + 40, g3 + 54) }}><Check />Fix: exact columns in Phase 4</div>
          </div>
        )}
        {stage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: fixed, transform: `scale(${0.8 + 0.2 * fixed})` }}>
            <Check size={160} p={fixed} />
            <div style={{ fontSize: 52, fontWeight: 600, marginTop: 30 }}>All 20 fixed in the spec</div>
          </div>
        )}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Production sign-in", "Real email delivery", "Hourly retry job on a real scheduler", "Hosting"];
  const end = useEnter(s.cues[3] + 30);
  return (
    <Frame label="NOT TESTED" n={8}>
      <H>Passing isn't production-ready</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 1100 }}>
        {items.map((t, i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, height: 120, borderBottom: `1px solid ${LINE}`, opacity: 0.22 + 0.78 * sp, transform: `translateX(${(1 - sp) * 24}px)` }}>
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
  const pay = useEnter(c[2]);
  const build = useEnter(c[3]);
  const plans: [string, string][] = [["Business", "Request demo · min. 5 makers"], ["Enterprise", "Contact sales"]];
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 940, height: 320, border: `2px solid ${INK}`, background: PAPER_HI, padding: 36, opacity: card, transform: `translateY(${(1 - card) * 50}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 56 }}>
          <span style={{ fontSize: 44, fontWeight: 600 }}>Productboard</span>
          <span style={{ fontFamily: MONO, fontSize: 26, color: SIGNAL, opacity: lin(frame, c[0], c[0] + 12), whiteSpace: "nowrap" }}>NO PUBLISHED PRICES</span>
        </div>
        {plans.map(([k, v], i) => (
          <div key={k} style={{ display: "flex", height: 70, alignItems: "center", marginTop: 14, fontSize: 30, opacity: lin(frame, c[1] + i * 20, c[1] + 12 + i * 20) }}>
            <span style={{ width: 300, color: INK2, whiteSpace: "nowrap" }}>{k}</span><span style={{ fontFamily: MONO, fontSize: 27, whiteSpace: "nowrap" }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, top: 605, width: 940, fontSize: 24, color: INK3, opacity: card }}>Source: productboard.com/pricing, checked October 2026.</div>
      <div style={{ position: "absolute", left: 80, top: 700, width: 940, ...pay }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>BUY PRODUCTBOARD IF YOU NEED</div>
        <div style={{ fontSize: 34, marginTop: 16, lineHeight: 1.5 }}>Native Zendesk, Gong or Salesforce integrations · A portal where customers vote</div>
      </div>
      <div style={{ position: "absolute", left: 1080, top: 270, width: 760, height: 640, border: `3px solid ${SIGNAL}`, background: PAPER_HI, padding: 44, ...build }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL }}>BUILD IT IF</div>
        {["You need to know who asked", "And who to tell when it ships", "A demo-sold platform is too much"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, fontSize: 38, whiteSpace: "nowrap" }}><Check />{t}</div>
        ))}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "15 rules", "Seed data", "4 phase prompts", "25 checks", "20 fixes included"];
  return (
    <Frame label="EVERYTHING IN ONE FILE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 100, fontWeight: 600, letterSpacing: -3, ...a }}>Everything is in one file.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 14);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${i === 5 ? SIGNAL : INK}`, color: i === 5 ? SIGNAL : INK, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 40, color: INK3, opacity: lin(frame, s.cues[2], s.cues[2] + 20) }}>feedback-inbox.md · free</div>
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
              <Audio src={`${MEDIA}/feedback-inbox-v1/${sc.id === "screens" ? "screens2" : sc.id}.mp3`} />
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
