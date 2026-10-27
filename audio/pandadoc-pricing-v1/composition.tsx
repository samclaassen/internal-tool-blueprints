import React from "react";
import { AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// PandaDoc pricing explainer (first pricing-explainer format, 2026-10-27)
// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const RAW = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/video";
const HOOK = `${RAW}/shorts/pandadoc-pricing-v1/hook-norm.mp4`;
const OUTRO = `${RAW}/host/outro-generic-v2-norm.mp4`;
const SITE = "https://personalsoftwarefactory.com";
const NARR = {"fps":30,"total":2688,"scenes":[{"id":"plans","from":0,"frames":497,"voiceFrom":8,"cues":[39,86,210,386]},{"id":"team","from":497,"frames":372,"voiceFrom":8,"cues":[33,118,246]},{"id":"limits","from":869,"frames":472,"voiceFrom":8,"cues":[79,107,210,276]},{"id":"uses","from":1341,"frames":306,"voiceFrom":8,"cues":[97,126,208,264]},{"id":"verdict","from":1647,"frames":419,"voiceFrom":8,"cues":[18,82,113,236,328]},{"id":"build","from":2066,"frames":410,"voiceFrom":8,"cues":[25,68,153,231,344]},{"id":"cta","from":2476,"frames":212,"voiceFrom":8,"cues":[30,68,120]}]};
const INTRO = 261, OUTRO_F = 230;
const TL = { fps: 30, total: INTRO + NARR.total + OUTRO_F };
type Scene = (typeof NARR.scenes)[number];
const N_SCENES = 9;

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
        <span><span style={{ display: "inline-block", width: 18, height: 18, background: SIGNAL, marginRight: 14, verticalAlign: -2 }} />PERSONAL SOFTWARE FACTORY · PRICING EXPLAINED</span>
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
  return <div style={{ position: "absolute", left: 80, top, fontSize: size, fontWeight: 600, letterSpacing: -1, whiteSpace: "nowrap", ...s }}>{children}</div>;
};

const Check: React.FC<{ size?: number; color?: string; p?: number }> = ({ size = 36, color = GREEN, p = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" />
    <path d="M10 18.5 L16 24 L26 12" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="30" strokeDashoffset={30 * (1 - p)} /></svg>
);
const Cross: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = RED }) => (
  <svg width={size} height={size} viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3" />
    <path d="M12 12 L24 24 M24 12 L12 24" stroke={color} strokeWidth="3.5" strokeLinecap="round" /></svg>
);

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
  const words = "What PandaDoc really costs a small team".split(" ");
  const a = useEnter(140);
  const b = useEnter(175);
  return (
    <Frame label="THE REAL PRICE" n={1}>
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [6 + i * 4, 16 + i * 4], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "PandaDoc" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 600, fontFamily: MONO, fontSize: 26, color: INK3, ...a }}>10 SEATS · BUSINESS PLAN</div>
      <div style={{ position: "absolute", left: 80, top: 645, fontSize: 120, fontWeight: 600, letterSpacing: -3, color: SIGNAL, ...a }}>$5,880<span style={{ fontSize: 48, color: INK2, letterSpacing: 0 }}> / year</span></div>
      <div style={{ position: "absolute", left: 80, top: 810, fontSize: 34, color: INK2, ...b }}>And when you don't need it.</div>
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
      <div style={{ position: "absolute", left: 80, top: 490, fontSize: 34, color: INK3, ...sub }}>/alternatives/pandadoc</div>
      <div style={{ position: "absolute", left: 80, top: 640, width: 940, fontSize: 40, lineHeight: 1.4, color: INK2, ...sub }}>Build it, then tell me what broke.</div>
      <HostCard src={OUTRO} frames={OUTRO_F} label="SAM CLAASSEN" />
    </Frame>
  );
};

// ---------------------------------------------------------------- plans
const Plans: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const plans: [string, string, string, number][] = [["Starter", "$19", "Up to 5 templates", c[1]], ["Business", "$49", "Unlimited templates", c[2]]];
  const src = useEnter(c[3]);
  return (
    <Frame label="THE PLANS" n={2}>
      <H at={c[0] - 20}>PandaDoc's published plans</H>
      <div style={{ position: "absolute", left: 80, top: 280, display: "flex", gap: 60 }}>
        {plans.map(([name, price, lim, at], i) => {
          const sp = useSpring(at - 4);
          return (
            <div key={name} style={{ width: 820, height: 520, border: `${i === 1 ? 3 : 2}px solid ${i === 1 ? SIGNAL : INK}`, background: PAPER_HI, padding: "40px 48px", boxSizing: "border-box", opacity: sp, transform: `translateY(${(1 - sp) * 50}px)` }}>
              <div style={{ height: 40, fontFamily: MONO, fontSize: 26, color: i === 1 ? SIGNAL : INK3 }}>PLAN {i + 1}</div>
              <div style={{ height: 80, fontSize: 60, fontWeight: 600, whiteSpace: "nowrap" }}>{name}</div>
              <div style={{ height: 170, display: "flex", alignItems: "baseline", gap: 18, whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 140, fontWeight: 600, letterSpacing: -4 }}>{price}</span>
                <span style={{ fontSize: 34, color: INK2 }}>per seat / month</span>
              </div>
              <div style={{ height: 2, background: LINE, margin: "30px 0" }} />
              <div style={{ height: 60, display: "flex", alignItems: "center", gap: 20, fontSize: 40, whiteSpace: "nowrap", opacity: lin(frame, at + 70, at + 84) }}>
                {i === 0 ? <div style={{ width: 36, height: 36, border: `3px solid ${AMBER}` }} /> : <Check />}{lim}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 860, fontFamily: MONO, fontSize: 28, color: INK3, ...src }}>Source: pandadoc.com/pricing · checked October 2026</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- team cost
const Team: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const rows: [string, number, string, number][] = [["Starter × 10 seats", 2280, "$2,280 / year", c[1]], ["Business × 10 seats", 5880, "$5,880 / year", c[1] + 40]];
  const extra = useEnter(c[2]);
  return (
    <Frame label="A TEAM OF TEN" n={3}>
      <H at={0}>Priced per seat: the bill grows with the team</H>
      <div style={{ position: "absolute", left: 80, top: 280, display: "flex", gap: 22 }}>
        {Array.from({ length: 10 }).map((_, i) => {
          const sp = useSpring(c[0] + i * 4);
          return (
            <div key={i} style={{ width: 100, height: 120, opacity: sp, transform: `scale(${0.7 + 0.3 * sp})` }}>
              <svg width="100" height="120" viewBox="0 0 100 120"><circle cx="50" cy="34" r="24" fill="none" stroke={INK} strokeWidth="4" /><path d="M10 116 C10 80 90 80 90 116" fill="none" stroke={INK} strokeWidth="4" /></svg>
            </div>
          );
        })}
        <div style={{ alignSelf: "center", marginLeft: 20, fontFamily: MONO, fontSize: 30, color: INK3, opacity: useSpring(c[0] + 44) }}>10 seats</div>
      </div>
      <div style={{ position: "absolute", left: 80, top: 470, width: 1760 }}>
        {rows.map(([k, v, label, at], i) => {
          const p = lin(frame, at, at + 30);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", height: 120, borderBottom: `1px solid ${LINE}` }}>
              <div style={{ width: 460, fontSize: 38, fontWeight: 500, whiteSpace: "nowrap", opacity: lin(frame, at - 10, at) }}>{k}</div>
              <div style={{ width: 900, height: 56, background: "rgba(26,26,23,0.05)" }}>
                <div style={{ height: 56, width: `${(v / 5880) * 100 * p}%`, background: i === 1 ? SIGNAL : INK }} />
              </div>
              <div style={{ marginLeft: 40, fontFamily: MONO, fontSize: 38, fontWeight: 500, whiteSpace: "nowrap", color: i === 1 ? SIGNAL : INK, opacity: lin(frame, at + 20, at + 32) }}>{label}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 770, display: "flex", alignItems: "center", gap: 28, ...extra }}>
        <div style={{ fontSize: 46, fontWeight: 600, border: `3px solid ${SIGNAL}`, color: SIGNAL, padding: "10px 26px", whiteSpace: "nowrap" }}>+$588 / year</div>
        <div style={{ fontSize: 38, color: INK2, whiteSpace: "nowrap" }}>for every extra person on Business ($49 × 12)</div>
      </div>
      <div style={{ position: "absolute", left: 80, top: 930, fontFamily: MONO, fontSize: 24, color: INK3 }}>Published per-seat prices × 12 months · pandadoc.com/pricing, October 2026</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- limits
const Limits: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const six = lin(frame, c[2] - 50, c[2] - 30);
  const up = useEnter(c[2]);
  const prop = useEnter(c[3]);
  return (
    <Frame label="WHAT PUSHES YOU UP A TIER" n={4}>
      <H at={0}>The limit that matters: templates</H>
      <div style={{ position: "absolute", left: 80, top: 280, fontFamily: MONO, fontSize: 26, color: INK3, opacity: lin(frame, c[0], c[0] + 10) }}>STARTER · UP TO 5 TEMPLATES</div>
      <div style={{ position: "absolute", left: 80, top: 330, display: "flex", gap: 24 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const isSix = i === 5;
          const sp = isSix ? six : lin(frame, c[1] - 20 + i * 5, c[1] - 8 + i * 5);
          return (
            <div key={i} style={{ width: 230, height: 280, border: `3px ${isSix ? "dashed" : "solid"} ${isSix ? RED : INK}`, background: isSix ? "rgba(192,57,43,0.06)" : PAPER_HI, opacity: sp, transform: `translateY(${(1 - sp) * 30}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18 }}>
              <div style={{ fontFamily: MONO, fontSize: 28, color: isSix ? RED : INK3 }}>TEMPLATE</div>
              <div style={{ fontSize: 90, fontWeight: 600, color: isSix ? RED : INK }}>{i + 1}</div>
              {isSix ? <Cross size={44} /> : <Check size={44} />}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 660, fontSize: 40, fontWeight: 600, display: "flex", alignItems: "center", gap: 20, whiteSpace: "nowrap", ...up }}>
        <span style={{ color: RED }}>More than 5 kinds of quote</span><span style={{ color: INK3 }}>→</span><span style={{ color: SIGNAL }}>Business, $49 per seat</span>
      </div>
      <div style={{ position: "absolute", left: 80, top: 760, width: 1760, height: 170, border: `2px solid ${INK}`, background: PAPER_HI, padding: "28px 40px", boxSizing: "border-box", ...prop }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>SIMILAR TOOL · PROPOSIFY · proposify.com/pricing, October 2026</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 30, marginTop: 14, whiteSpace: "nowrap" }}>
          <span style={{ fontSize: 44, fontWeight: 600 }}>Discount approvals: Grow plan</span>
          <span style={{ fontFamily: MONO, fontSize: 38, color: SIGNAL }}>$325 / month for 5 seats</span>
        </div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- uses
const Uses: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const steps: [string, string, string, number][] = [
    ["1", "Price line items", "From your price list", c[1]],
    ["2", "Apply a discount", "Within the rules", c[2]],
    ["3", "Get a yes", "The client accepts", c[3]],
  ];
  const job = useEnter(c[0] - 6);
  return (
    <Frame label="WHAT A SMALL TEAM USES" n={5}>
      <H at={0}>What a small team actually uses</H>
      <div style={{ position: "absolute", left: 80, top: 260, fontFamily: MONO, fontSize: 30, color: SIGNAL, ...job }}>OFTEN, IT'S ONE JOB</div>
      <div style={{ position: "absolute", left: 80, top: 340, display: "flex", gap: 40 }}>
        {steps.map(([n, t, d, at], i) => {
          const sp = useSpring(at - 4);
          return (
            <div key={n} style={{ width: 553, height: 420, border: `2px solid ${i === 2 ? SIGNAL : INK}`, background: PAPER_HI, padding: "40px 44px", boxSizing: "border-box", opacity: sp, transform: `translateY(${(1 - sp) * 50}px)` }}>
              <div style={{ height: 120, fontSize: 100, fontWeight: 600, color: i === 2 ? SIGNAL : INK3 }}>{n}</div>
              <div style={{ height: 70, fontSize: 48, fontWeight: 600, whiteSpace: "nowrap" }}>{t}</div>
              <div style={{ height: 50, fontSize: 32, color: INK2, whiteSpace: "nowrap" }}>{d}</div>
              <div style={{ marginTop: 60 }}>{i === 2 ? <Check size={56} p={lin(frame, at + 6, at + 20)} /> : <div style={{ height: 56 }} />}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- verdict
const Verdict: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const buy: [string, number][] = [["Legally binding e-signatures", c[1]], ["Payment collection", c[2]], ["CRM sync", 144], ["A drag-and-drop document designer", 185]];
  const build: [string, number][] = [["Quotes from a known price list", 264], ["A typed-name acceptance is enough", c[4]]];
  const L = useEnter(c[0] - 6);
  const R = useEnter(c[3] - 6);
  const col = (title: string, items: [string, number][], color: string, st: React.CSSProperties, left: number, icon: (p: number) => React.ReactNode) => (
    <div style={{ position: "absolute", left, top: 270, width: 830, height: 640, border: `3px solid ${color}`, background: PAPER_HI, padding: "36px 44px", boxSizing: "border-box", ...st }}>
      <div style={{ height: 50, fontFamily: MONO, fontSize: 28, color, whiteSpace: "nowrap" }}>{title}</div>
      {items.map(([t, at]) => (
        <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, height: 110, borderBottom: `1px solid ${LINE}`, fontSize: 36, whiteSpace: "nowrap", opacity: lin(frame, at - 4, at + 8) }}>
          {icon(lin(frame, at, at + 14))}{t}
        </div>
      ))}
    </div>
  );
  return (
    <Frame label="BUY OR BUILD" n={6}>
      <H at={0}>Buy it, or build it?</H>
      {col("BUY PANDADOC IF YOU NEED", buy, INK, L, 80, () => <div style={{ width: 36, height: 36, border: `3px solid ${INK}` }} />)}
      {col("BUILD IT IF", build, SIGNAL, R, 1010, (p) => <Check p={p} />)}
    </Frame>
  );
};

// ---------------------------------------------------------------- build (real screenshots)
const VW = 1760, VH = 790;
type Box = [number, number, number, number];
const SHOTS: { src: string; cap: string; iw: number; ih: number; box: Box }[] = [
  { src: `${SITE}/builds/quote-builder/test-editor-live-totals.webp`, iw: 1440, ih: 1050, cap: "Line items, discounts, tax and live totals", box: [1000, 316, 290, 176] },
  { src: `${SITE}/builds/quote-builder/test-quote-awaiting-approval.webp`, iw: 1440, ih: 1050, cap: "A manager approves any discount over the limit", box: [966, 348, 336, 268] },
  { src: `${SITE}/builds/quote-builder/test-phone-client-page.webp`, iw: 390, ih: 844, cap: "The client link: accept or decline", box: [18, 478, 354, 222] },
];
const axis = (s: number, view: number, size: number, c: number) => (s * size <= view ? (view - s * size) / 2 : Math.min(0, Math.max(view - s * size, view / 2 - s * c)));
const Build: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const starts = [0, s.cues[2] - 10, s.cues[3] - 10, s.cues[4] - 14];
  const res = useSpring(s.cues[4] - 14);
  const resOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  const n = Math.round(29 * lin(frame, s.cues[4] - 10, s.cues[4] + 20));
  return (
    <Frame label="THE FREE BLUEPRINT" n={7}>
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        if (frame < a - 12 || frame > b + 12) return null;
        const inP = i === 0 ? 1 : interpolate(frame, [a - 12, a + 6], [0, 1], clamp);
        const outP = interpolate(frame, [b - 6, b + 12], [1, 0], clamp);
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
          <div key={i} style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, overflow: "hidden", border: `2px solid ${INK}`, background: i === 2 ? "#f4f2ee" : "#fff", opacity: Math.min(inP, outP) }}>
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
        return <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: p, whiteSpace: "nowrap" }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>QUOTE BUILDER</span>{sh.cap}</div>;
      })}
      <div style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, border: `2px solid ${INK}`, background: PAPER_HI, opacity: Math.min(res, resOut), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Check size={130} p={lin(frame, s.cues[4], s.cues[4] + 20)} />
        <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -3, marginTop: 20 }}>{n} / 29</div>
        <div style={{ fontSize: 44, color: INK2, marginTop: 10 }}>acceptance checks passed in Claude's build</div>
      </div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: Math.min(res, resOut), whiteSpace: "nowrap" }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>QUOTE BUILDER</span>Built from one Markdown spec</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "Rules", "4 phase prompts", "29 checks"];
  return (
    <Frame label="THE FREE SPEC" n={8}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 100, fontWeight: 600, letterSpacing: -3, ...a }}>One Markdown file. Free.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[1] + i * 12);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${i === 3 ? SIGNAL : INK}`, color: i === 3 ? SIGNAL : INK, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, fontFamily: MONO, fontSize: 32, color: INK3, opacity: lin(frame, s.cues[2], s.cues[2] + 20) }}>quote-builder.md · personalsoftwarefactory.com/blueprints/quote-builder</div>
    </Frame>
  );
};

const SCENES: Record<string, React.FC<{ s: Scene }>> = { plans: Plans, team: Team, limits: Limits, uses: Uses, verdict: Verdict, build: Build, cta: Cta };

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
              <Audio src={`${MEDIA}/pandadoc-pricing-v1/${sc.id}.mp3`} />
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
