import React from "react";
import { AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const RAW = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/video";
const HOOK = `${RAW}/shorts/simple-crm-v1/hook-norm.mp4`;
const OUTRO = `${RAW}/host/outro-generic-v2-norm.mp4`;
const SITE = "https://personalsoftwarefactory.com";
const NARR = {"fps":30,"total":4287,"scenes":[{"id":"spec","from":0,"frames":516,"voiceFrom":8,"cues":[29,167,242,318,401]},{"id":"rule","from":516,"frames":533,"voiceFrom":8,"cues":[102,172,204,297,406]},{"id":"phases","from":1049,"frames":579,"voiceFrom":8,"cues":[91,184,282,326,452]},{"id":"screens","from":1628,"frames":537,"voiceFrom":8,"cues":[45,159,265,341,458]},{"id":"result","from":2165,"frames":206,"voiceFrom":8,"cues":[85,139]},{"id":"gaps","from":2371,"frames":644,"voiceFrom":8,"cues":[107,210,347,452,560]},{"id":"untested","from":3015,"frames":337,"voiceFrom":8,"cues":[109,134,164,203,230]},{"id":"cost","from":3352,"frames":650,"voiceFrom":8,"cues":[80,167,221,305,451]},{"id":"cta","from":4002,"frames":285,"voiceFrom":8,"cues":[57,81,228]}]};
const INTRO = 231, OUTRO_F = 230;
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
  const words = "Here's how to reverse engineer HubSpot from a written spec.".split(" ");
  const a = useEnter(100);
  const b = useEnter(160);
  return (
    <Frame label="THE TEARDOWN" n={1}>
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [6 + i * 4, 16 + i * 4], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "HubSpot" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, ...a }}>
        <Check size={52} p={lin(frame, 104, 124)} />27 / 27 checks passed
      </div>
      <div style={{ position: "absolute", left: 80, top: 740, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, color: SIGNAL, ...b }}>
        <div style={{ width: 52, height: 52, background: SIGNAL }} />8 gaps found in the spec
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
      <div style={{ position: "absolute", left: 80, top: 490, fontSize: 34, color: INK3, ...sub }}>/blueprints/simple-crm</div>
      <div style={{ position: "absolute", left: 80, top: 640, width: 940, fontSize: 40, lineHeight: 1.4, color: INK2, ...sub }}>Build it, then tell me what broke.</div>
      <HostCard src={OUTRO} frames={OUTRO_F} label="SAM CLAASSEN" />
    </Frame>
  );
};

// ---------------------------------------------------------------- spec
const SPEC_LINES = ["# Simple CRM", "Replaces: HubSpot (free CRM), Pipedrive", "", "## 5. Data model", "Person · Company · Contact · Deal", "Activity · DigestLog", "", "## 6. Business rules", "- R1. Every contact has one next follow-up", "- R3. Overdue first, oldest first", "- R5. Logging always sets the next date"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(s.cues[0] - 10);
  const chars = Math.floor(Math.max(0, frame - s.cues[0]) * 3.2);
  let used = 0;
  const items: [string, string][] = [["Contacts", "People and companies, with an owner"], ["Pipeline", "One board, with stage probabilities"], ["Activity log", "Every call, email and meeting"], ["CSV import", "A preview before anything is saved"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. The CRM part of HubSpot.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>simple-crm.md</div>
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
  const card = useSpring(c[0] - 10);
  const noClear = useSpring(c[1]);
  const list = useSpring(c[2] - 6);
  const log = useSpring(c[3]);
  const grace = lin(frame, c[4], c[4] + 14);
  const rows: [string, string, "over" | "today", string][] = [["Grace Kim", "Harbor", "over", "Overdue 6d"], ["Priya Shah", "Bluebird", "over", "Overdue 3d"], ["Hana Sato", "Pine Labs", "over", "Overdue 2d"], ["Rosa Diaz", "Acme", "over", "Overdue 1d"], ["Kim Olsen", "Olsen & Co", "today", "Today"], ["Nina Patel", "Ridgeway", "today", "Today"]];
  return (
    <Frame label="THE CORE RULE" n={3}>
      <H>Every contact has a next follow-up</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, border: `2px solid ${INK}`, background: PAPER_HI, padding: "28px 36px", opacity: card, transform: `translateY(${(1 - card) * 40}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3 }}>CONTACT · PRIYA SHAH</div>
        <div style={{ display: "flex", alignItems: "center", height: 70, marginTop: 14, fontSize: 32, borderBottom: `1px solid ${LINE}` }}>
          <span style={{ width: 300, color: INK2 }}>Next follow-up</span><span style={{ fontWeight: 600 }}>Required</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, height: 70, fontSize: 30, opacity: noClear }}>
          <span style={{ width: 300, color: INK2 }}>Move it</span><Check size={34} />
          <span style={{ marginLeft: 40, color: INK2 }}>Clear it</span><Cross size={34} />
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, top: 560, width: 760, border: `2px solid ${INK}`, background: PAPER_HI, padding: "24px 36px", opacity: log, transform: `translateY(${(1 - log) * 40}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3 }}>LOG ACTIVITY · CALL</div>
        <div style={{ fontSize: 28, marginTop: 14, color: INK2 }}>Next follow-up (required)</div>
        <div style={{ display: "flex", gap: 14, marginTop: 16 }}>
          {["Tomorrow", "3 days", "1 week", "2 weeks"].map((t) => (
            <span key={t} style={{ fontSize: 26, padding: "8px 18px", border: `2px solid ${t === "3 days" ? SIGNAL : LINE}`, color: t === "3 days" ? SIGNAL : INK2, fontWeight: t === "3 days" ? 600 : 400, whiteSpace: "nowrap" }}>{t}</span>
          ))}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: INK3, marginTop: 14 }}>DEFAULT: 3 DAYS</div>
      </div>
      <div style={{ position: "absolute", left: 940, top: 270, width: 900, border: `2px solid ${INK}`, background: "#fff", opacity: list, transform: `translateX(${(1 - list) * 60}px)` }}>
        <div style={{ display: "flex", height: 56, alignItems: "center", padding: "0 28px", fontFamily: MONO, fontSize: 20, color: INK3, borderBottom: `2px solid ${INK}` }}>
          <span style={{ width: 300 }}>CONTACT</span><span style={{ width: 280 }}>COMPANY</span><span>NEXT FOLLOW-UP</span>
        </div>
        {rows.map(([n, co, k, b], i) => {
          const p = lin(frame, c[2] + i * 6, c[2] + 10 + i * 6);
          const hi = i === 0 ? grace : 0;
          return (
            <div key={n} style={{ display: "flex", height: 92, alignItems: "center", padding: "0 28px", borderBottom: `1px solid ${LINE}`, fontSize: 32, opacity: p, background: hi > 0 ? `rgba(240,80,15,${0.10 * hi})` : "transparent", boxShadow: hi > 0 ? `inset 6px 0 0 rgba(240,80,15,${hi})` : "none" }}>
              <span style={{ width: 300, fontWeight: i === 0 ? 600 : 500, whiteSpace: "nowrap" }}>{n}</span>
              <span style={{ width: 280, color: INK2, fontSize: 28, whiteSpace: "nowrap" }}>{co}</span>
              <Badge kind={k}>{b}</Badge>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 940, top: 900, fontSize: 32, fontWeight: 600, color: SIGNAL, opacity: grace }}>First name on Sam's Today screen</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Team, companies and contacts"], ["Follow-ups", "Activities, Today and search"], ["Pipeline", "Deals and the board totals"], ["Import", "CSV in and out, daily digest"]];
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
          {["Sam's Today: Grace Kim overdue 6 days, Priya Shah overdue 3 days", "Logging with next follow-up today is refused", "Board: open pipeline $108,400, weighted $61,220", "Sample paste: 2 Ready, 1 Duplicate, 3 Errors"].map((t, i) => {
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
  { src: `${SITE}/builds/simple-crm/test-contacts.webp`, iw: 1440, ih: 1050, cap: "Contacts: late follow-ups first, with the days overdue", box: [121, 280, 1198, 238] },
  { src: `${SITE}/builds/simple-crm/test-pipeline.webp`, iw: 1440, ih: 1050, cap: "The pipeline: open and weighted totals for every stage", box: [121, 158, 1198, 190] },
  { src: `${SITE}/builds/simple-crm/test-contact-detail.webp`, iw: 1440, ih: 1050, cap: "A logged call sets Priya Shah's next follow-up", box: [137, 622, 598, 48] },
  { src: `${SITE}/builds/simple-crm/test-import-preview.webp`, iw: 1440, ih: 1050, cap: "Import preview: 2 ready, 1 duplicate, 3 errors", box: [1022, 588, 300, 382] },
  { src: `${SITE}/builds/simple-crm/test-phone-today.webp`, iw: 390, ih: 844, cap: "Sam's Today screen on a phone: who to call first", box: [10, 280, 370, 270] },
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
          <div key={i} style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, overflow: "hidden", border: `2px solid ${INK}`, background: i === 4 ? "#f3f4f6" : "#fff", opacity: Math.min(inP, outP) }}>
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
  const n = Math.round(27 * p);
  const t = Math.round(91 * lin(frame, s.cues[1], s.cues[1] + 40));
  const r = 210, C = 2 * Math.PI * r;
  const tests = useEnter(s.cues[1]);
  return (
    <Frame label="THE RESULT" n={6}>
      <H>Final run, fresh database</H>
      <svg width="560" height="560" style={{ position: "absolute", left: 140, top: 300 }}>
        <circle cx="280" cy="280" r={r} fill="none" stroke={LINE} strokeWidth="28" />
        <circle cx="280" cy="280" r={r} fill="none" stroke={GREEN} strokeWidth="28" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 280 280)" />
        <text x="280" y="300" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="600" fill={INK}>{n}</text>
        <text x="280" y="370" textAnchor="middle" fontFamily={MONO} fontSize="30" fill={INK3}>OF 27 CHECKS</text>
      </svg>
      <div style={{ position: "absolute", left: 860, top: 420, ...tests }}>
        <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -4 }}>{t}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: INK3 }}>AUTOMATED TESTS PASSING</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- gaps
const Gaps: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const showCount = Math.round(8 * lin(frame, c[0] - 10, c[0] + 26));
  const g1 = c[1] - 10, g2 = c[2] - 10, g3 = c[3] - 10;
  const stage = frame < g1 ? 0 : frame < g2 ? 1 : frame < g3 ? 2 : frame < c[4] ? 3 : 4;
  const stageIn = (at: number) => lin(frame, at - 4, at + 12);
  const fixed = useSpring(c[4]);
  const examples = ["Owner-only buttons were hidden", "Unarchiving with no follow-up date", "The digest and daylight saving"];
  const field = (k: string, v: React.ReactNode, col: string = INK) => (
    <div style={{ display: "flex", height: 62, alignItems: "center", fontSize: 30, borderBottom: `1px solid ${LINE}` }}><span style={{ width: 300, fontFamily: MONO, fontSize: 24, color: INK3 }}>{k}</span><span style={{ color: col, whiteSpace: "nowrap" }}>{v}</span></div>
  );
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 800 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 700 }}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ width: 58, height: 58, background: i < showCount ? (i === 0 || i === 2 || i === 6 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
        </div>
        <div style={{ marginTop: 56 }}>
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
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>GRACE KIM · ACTING AS LEE PARK</div>
            <div style={{ display: "flex", gap: 14, marginTop: 26 }}>
              {["Edit", "Reschedule", "Archive"].map((t) => <span key={t} style={{ fontSize: 28, padding: "8px 18px", border: `2px dashed ${LINE}`, color: INK3, opacity: 1 - lin(frame, g1 + 70, g1 + 84) * 0 }}>{t}</span>)}
            </div>
            <div style={{ fontSize: 30, color: AMBER, marginTop: 18, fontWeight: 600, opacity: lin(frame, g1 + 20, g1 + 34) }}>Hidden, so the check couldn't try them</div>
            <div style={{ marginTop: 28, fontSize: 27, background: "#fff", border: `1px solid ${LINE}`, padding: "16px 22px", lineHeight: 1.4, opacity: lin(frame, g1 + 50, g1 + 64) }}>"Only Sam Okafor (the owner) or an admin can change this contact."</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 26, fontSize: 30, opacity: lin(frame, g1 + 70, g1 + 84) }}><Check />Fix: shown to all, refused on the server</div>
          </div>
        )}
        {stage === 2 && (
          <div style={{ opacity: stageIn(g2) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>UNARCHIVE · RUTH ADAMS</div>
            <div style={{ marginTop: 22 }}>
              {field("STATUS", "Archived → Active")}
              {field("STORED DATE", "none", RED)}
              {field("NEXT FOLLOW-UP", <span style={{ color: lin(frame, g2 + 60, g2 + 74) > 0.5 ? GREEN : AMBER }}>{lin(frame, g2 + 60, g2 + 74) > 0.5 ? "Today" : "Not said"}</span>)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, g2 + 60, g2 + 74) }}><Check />Fix: R14 now sets it to today</div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ opacity: stageIn(g3) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>DAILY DIGEST · 08:00 TEAM TIME</div>
            <div style={{ marginTop: 22 }}>
              {field("SCHEDULER", "Fixed time in UTC")}
              {field("DAYLIGHT SAVING", <span style={{ opacity: lin(frame, g3 + 20, g3 + 34) }}>Email moves by an hour</span>, RED)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 34, fontSize: 30, opacity: lin(frame, g3 + 60, g3 + 74) }}><Check />Fix: section 10 now covers it</div>
          </div>
        )}
        {stage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: fixed, transform: `scale(${0.8 + 0.2 * fixed})` }}>
            <Check size={160} p={fixed} />
            <div style={{ fontSize: 52, fontWeight: 600, marginTop: 30 }}>All 8 fixed in the spec</div>
          </div>
        )}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Real sign-in", "Sending email", "The scheduled 08:00 run", "Real phones", "Hosting"];
  const end = useEnter(s.cues[4] + 20);
  return (
    <Frame label="NOT TESTED" n={8}>
      <H>Passing isn't production-ready</H>
      <div style={{ position: "absolute", left: 80, top: 280, width: 1100 }}>
        {items.map((t, i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, height: 108, borderBottom: `1px solid ${LINE}`, opacity: 0.22 + 0.78 * sp, transform: `translateX(${(1 - sp) * 24}px)` }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${AMBER}` }} />
              <div style={{ fontSize: 42, fontWeight: 500, whiteSpace: "nowrap" }}>{t}</div>
              <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 24, color: AMBER }}>NOT TESTED</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 1260, top: 380, width: 580, fontSize: 40, lineHeight: 1.35, color: INK2, ...end }}>
        Check these yourself before a team relies on it.
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
  const pay = useEnter(c[3]);
  const build = useEnter(c[4]);
  const lines: [string, string, number][] = [["HubSpot free CRM", "Free for up to 2 users", c[0]], ["HubSpot Starter", "$15 / seat / month", c[1]], ["Pipedrive Lite", "$14 / seat / month, no free tier", c[2]]];
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 940, height: 320, border: `2px solid ${INK}`, background: PAPER_HI, padding: 36, opacity: card, transform: `translateY(${(1 - card) * 50}px)` }}>
        <div style={{ fontSize: 44, fontWeight: 600 }}>HubSpot and Pipedrive</div>
        {lines.map(([k, v, at]) => (
          <div key={k} style={{ display: "flex", height: 60, alignItems: "center", marginTop: 8, fontSize: 30, opacity: lin(frame, at, at + 12) }}>
            <span style={{ width: 330, color: INK2, whiteSpace: "nowrap" }}>{k}</span><span style={{ fontFamily: MONO, fontSize: 27, whiteSpace: "nowrap", color: at === c[1] ? SIGNAL : INK }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, top: 605, width: 940, fontSize: 24, color: INK3, opacity: card }}>Sources: hubspot.com/pricing/crm, pipedrive.com/en/pricing (annual billing), checked October 2026.</div>
      <div style={{ position: "absolute", left: 80, top: 700, width: 940, ...pay }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>PAY FOR HUBSPOT IF YOU NEED</div>
        <div style={{ fontSize: 34, marginTop: 16, lineHeight: 1.5 }}>Email sync · Sequences · Forecasting</div>
      </div>
      <div style={{ position: "absolute", left: 1080, top: 270, width: 760, height: 640, border: `3px solid ${SIGNAL}`, background: PAPER_HI, padding: 44, ...build }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL }}>BUILD IT FOR A TEAM OF 1 TO 15</div>
        {["The contact list", "The pipeline board", "The follow-up reminder"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, fontSize: 40, whiteSpace: "nowrap" }}><Check />{t}</div>
        ))}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "21 rules", "Seed data", "4 phase prompts", "27 checks", "8 fixes included"];
  return (
    <Frame label="EVERYTHING IN ONE FILE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 100, fontWeight: 600, letterSpacing: -3, ...a }}>Everything is in one file.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 14);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${i === 5 ? SIGNAL : INK}`, color: i === 5 ? SIGNAL : INK, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 40, color: INK3, opacity: lin(frame, s.cues[2], s.cues[2] + 20) }}>simple-crm.md · free</div>
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
              <Audio src={`${MEDIA}/simple-crm-v1/${sc.id}.mp3`} />
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
