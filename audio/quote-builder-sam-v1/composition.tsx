import React from "react";
import { AbsoluteFill, Audio, Composition, Img, OffthreadVideo, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const SITE = "https://personalsoftwarefactory.com";
const RAW = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/video";
const HOOK = `${RAW}/shorts/quote-builder-v1/hook-norm.mp4`;
const OUTRO = `${RAW}/host/outro-generic-v2-norm.mp4`;
const NARR = {"fps":30,"total":4325,"scenes":[{"id":"spec","from":0,"frames":514,"voiceFrom":8,"cues":[167,253,346,393]},{"id":"rule","from":514,"frames":556,"voiceFrom":8,"cues":[80,135,264,314,409,478]},{"id":"phases","from":1070,"frames":504,"voiceFrom":8,"cues":[94,189,225,297,371]},{"id":"screens","from":1574,"frames":580,"voiceFrom":8,"cues":[44,177,333,411,475]},{"id":"result","from":2154,"frames":204,"voiceFrom":8,"cues":[71,134]},{"id":"gaps","from":2358,"frames":622,"voiceFrom":8,"cues":[108,204,319,418,546]},{"id":"untested","from":2980,"frames":374,"voiceFrom":8,"cues":[108,134,164,237,262]},{"id":"cost","from":3354,"frames":677,"voiceFrom":8,"cues":[54,184,223,348,501]},{"id":"cta","from":4031,"frames":294,"voiceFrom":8,"cues":[57,84,240]}]};
const INTRO = 225, OUTRO_F = 230;
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

/** 0 → 1 spring starting at frame `at`. */
const useSpring = (at: number, damping = 18) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 170, mass: 0.7 } });
};
/** Fade in/up at `at`, fade out over the last 10 frames of the scene. */
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

const BLUE = "#2563eb";
const Pill: React.FC<{ c: string; children: React.ReactNode; fill?: boolean }> = ({ c, children, fill }) => (
  <span style={{ fontFamily: MONO, fontSize: 22, padding: "5px 12px", border: `2px solid ${c}`, color: fill ? "#fff" : c, background: fill ? c : "transparent" }}>{children}</span>
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
  const words = "Here's how to reverse engineer PandaDoc from a written spec.".split(" ");
  const a = useEnter(100);
  const b = useEnter(160);
  return (
    <Frame label="THE TEARDOWN" n={1}>
      <div style={{ position: "absolute", left: 80, top: 210, width: 960, fontSize: 76, fontWeight: 600, lineHeight: 1.08, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [6 + i * 4, 16 + i * 4], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 20, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "PandaDoc" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, display: "flex", alignItems: "center", gap: 22, fontSize: 44, fontWeight: 600, ...a }}>
        <Check size={52} p={lin(frame, 104, 124)} />29 / 29 checks passed
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
      <div style={{ position: "absolute", left: 80, top: 490, fontSize: 34, color: INK3, ...sub }}>/blueprints/quote-builder</div>
      <div style={{ position: "absolute", left: 80, top: 640, width: 940, fontSize: 40, lineHeight: 1.4, color: INK2, ...sub }}>Build it, then tell me what broke.</div>
      <HostCard src={OUTRO} frames={OUTRO_F} label="SAM CLAASSEN" />
    </Frame>
  );
};

// ---------------------------------------------------------------- 2 spec
const SPEC_LINES = ["# Quote Builder", "Replaces: PandaDoc (quotes and proposals)", "", "## 6. Pricing math", "Line discounts, then the quote discount", "Tax on what's left, rounded per step", "", "## 8. Business rules", "- R3. A price-list line keeps its price", "- R4. Over the threshold needs approval", "- R5. Managers can't approve their own"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(8);
  const chars = Math.floor(Math.max(0, frame - 14) * 3.2);
  let used = 0;
  const items: [string, string][] = [["Price list", "The same price on every quote"], ["Line items", "Discounts, tax and live totals"], ["Templates", "Common packages in one click"], ["Client link", "Accept by typing a full name"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. The quoting part of PandaDoc.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>quote-builder.md</div>
        {SPEC_LINES.map((l, i) => {
          const start = used; used += l.length + 1;
          const shown = l.slice(0, Math.max(0, Math.min(l.length, chars - start)));
          const head = l.startsWith("#");
          return <div key={i} style={{ minHeight: 38, color: head ? "#f7b48f" : "#e9e6dc", whiteSpace: "pre" }}>{shown}{chars >= start && chars < start + l.length ? "▍" : ""}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 900, top: 300, width: 940 }}>
        {items.map(([k, v], i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 24, padding: "26px 0", borderBottom: `1px solid ${LINE}`, opacity: sp, transform: `translateX(${(1 - sp) * 60}px)` }}>
              <Check p={interpolate(frame, [s.cues[i] + 6, s.cues[i] + 20], [0, 1], clamp)} />
              <div style={{ width: 260, fontSize: 36, fontWeight: 600, whiteSpace: "nowrap" }}>{k}</div>
              <div style={{ fontSize: 29, color: INK2, width: 560, whiteSpace: "nowrap" }}>{v}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 3 rule
const Rule: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const head = useSpring(c[0]);
  const listP = useEnter(c[1]);
  const disc = useEnter(c[2]);
  const barIn = useSpring(c[3] - 10);
  const fillP = lin(frame, c[3], c[3] + 30);
  const pct = 17.2 * fillP;
  const appr = useSpring(c[4]);
  const own = useSpring(c[5]);
  const BW = 760, MAX = 25;
  const rows: [string, string, number][] = [["Team seat × 100 at $150", "$15,000", c[1]], ["Onboarding package", "$2,400", c[1] + 12]];
  return (
    <Frame label="THE CORE RULE" n={3}>
      <H>Big discounts need a manager</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 900, border: `2px solid ${INK}`, background: PAPER_HI, padding: "28px 36px", opacity: head, transform: `translateY(${(1 - head) * 40}px)` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", height: 50 }}>
          <span style={{ fontSize: 38, fontWeight: 600, whiteSpace: "nowrap" }}>Q-1040 · Ridgeway Partners</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: INK3 }}>OWNER LEE PARK</span>
        </div>
        <div style={{ marginTop: 20, borderTop: `2px solid ${INK}` }}>
          {rows.map(([n, v, at]) => (
            <div key={n} style={{ display: "flex", justifyContent: "space-between", height: 64, alignItems: "center", fontSize: 30, borderBottom: `1px solid ${LINE}`, opacity: lin(frame, at, at + 12) }}>
              <span>{n}</span><span style={{ fontFamily: MONO }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", height: 64, alignItems: "center", fontSize: 30, fontWeight: 600, ...listP }}>
            <span>List price</span><span style={{ fontFamily: MONO }}>$17,400</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", height: 64, alignItems: "center", fontSize: 30, color: SIGNAL, ...disc }}>
            <span>20% off the seats</span><span style={{ fontFamily: MONO }}>−$3,000</span>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, top: 760, width: 900, height: 150, border: `3px solid ${RED}`, background: PAPER_HI, padding: "20px 30px", display: "flex", alignItems: "center", gap: 24, opacity: own, transform: `translateY(${(1 - own) * 40}px)` }}>
        <Cross size={48} />
        <div style={{ fontSize: 30, lineHeight: 1.35 }}><b>R5.</b> No manager can approve a quote they own or submitted.</div>
      </div>
      <div style={{ position: "absolute", left: 1060, top: 270, width: 780, height: 640, border: `2px solid ${INK}`, background: PAPER_HI, padding: "34px 10px 34px 10px", opacity: barIn, transform: `translateX(${(1 - barIn) * 60}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 22, color: INK3, paddingLeft: 0 }}>TOTAL DISCOUNT ÷ LIST PRICE</div>
        <div style={{ fontSize: 110, fontWeight: 600, letterSpacing: -3, marginTop: 20, color: pct > 15 ? SIGNAL : INK }}>{pct.toFixed(1)}%</div>
        <div style={{ position: "relative", width: BW, height: 54, marginTop: 40, background: LINE }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: 54, width: (BW * pct) / MAX, background: pct > 15 ? SIGNAL : INK2 }} />
          <div style={{ position: "absolute", left: (BW * 15) / MAX - 2, top: -18, width: 4, height: 90, background: INK }} />
        </div>
        <div style={{ position: "relative", height: 40, marginTop: 30 }}>
          <span style={{ position: "absolute", left: (BW * 15) / MAX - 120, fontFamily: MONO, fontSize: 24, width: 240, textAlign: "center" }}>LIMIT 15%</span>
        </div>
        <div style={{ marginTop: 40, height: 90, background: AMBER, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 600, opacity: appr, transform: `scale(${0.9 + 0.1 * appr})` }}>Manager approval before sending</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 4 phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Clients, price list and settings"], ["Quotes", "Line items, pricing math, templates"], ["Approval", "Sending and the client page"], ["Expiry", "Print view and invoices"]];
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
          <span style={{ marginLeft: 16 }}>acceptance checks · real browser · seed data</span>
        </div>
        <div style={{ padding: "18px 28px", fontFamily: MONO, fontSize: 25, lineHeight: 1.7 }}>
          {["Acme quote: list $10,200, discounts $1,080, total $9,849.60", "A price-list line's unit price can't be edited", "Exactly 15.0% total discount sends without approval", "Create invoice on Q-1039 makes INV-2002 for $9,849.60"].map((t, i) => {
            const at = s.cues[4] + 8 + i * 14;
            const p = interpolate(frame, [at, at + 10], [0, 1], clamp);
            return <div key={i} style={{ opacity: p, display: "flex", gap: 16, whiteSpace: "nowrap" }}><span style={{ color: GREEN }}>PASS</span><span>{t}</span></div>;
          })}
        </div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 5 screens
// Boxes are exact element rects in each screenshot's own pixels: [x, y, w, h].
const VW = 1760, VH = 790;
type Box = [number, number, number, number];
const SHOTS: { src: string; cap: string; iw: number; ih: number; box: Box }[] = [
  { src: `${SITE}/builds/quote-builder/test-quotes-home.webp`, iw: 1440, ih: 1050, cap: "Quotes home: open quotes, approvals waiting and the win rate", box: [136, 190, 1168, 106] },
  { src: `${SITE}/builds/quote-builder/test-editor-live-totals.webp`, iw: 1440, ih: 1050, cap: "The editor: fixed list prices, live totals, an approval warning", box: [1002, 205, 284, 440] },
  { src: `${SITE}/builds/quote-builder/test-quote-awaiting-approval.webp`, iw: 1440, ih: 1050, cap: "Manager Dana sees the approval request beside the quote", box: [964, 346, 339, 272] },
  { src: `${SITE}/builds/quote-builder/test-templates.webp`, iw: 1440, ih: 1050, cap: "Templates: Starter, Growth and Enterprise bundles", box: [136, 190, 1168, 397] },
  { src: `${SITE}/builds/quote-builder/test-phone-client-page.webp`, iw: 390, ih: 844, cap: "On a phone: the client accepts by typing a full name", box: [17, 478, 356, 186] },
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

// ---------------------------------------------------------------- 6 result
const Result: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const p = lin(frame, s.cues[0] - 20, s.cues[0] + 30);
  const n = Math.round(29 * p);
  const t = Math.round(47 * lin(frame, s.cues[1], s.cues[1] + 40));
  const r = 210, C = 2 * Math.PI * r;
  const tests = useEnter(s.cues[1]);
  return (
    <Frame label="THE RESULT" n={6}>
      <H>Final run, fresh database</H>
      <svg width="560" height="560" style={{ position: "absolute", left: 140, top: 300 }}>
        <circle cx="280" cy="280" r={r} fill="none" stroke={LINE} strokeWidth="28" />
        <circle cx="280" cy="280" r={r} fill="none" stroke={GREEN} strokeWidth="28" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 280 280)" />
        <text x="280" y="300" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="600" fill={INK}>{n}</text>
        <text x="280" y="370" textAnchor="middle" fontFamily={MONO} fontSize="30" fill={INK3}>OF 29 CHECKS</text>
      </svg>
      <div style={{ position: "absolute", left: 860, top: 420, ...tests }}>
        <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -4 }}>{t}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: INK3 }}>AUTOMATED TESTS PASSING</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 7 gaps
const Gaps: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const showCount = Math.round(8 * lin(frame, c[0] - 10, c[0] + 26));
  const g1 = c[1] - 10, g2 = c[2] - 10, g3 = c[3] - 10;
  const stage = frame < g1 ? 0 : frame < g2 ? 1 : frame < g3 ? 2 : frame < c[4] ? 3 : 4;
  const stageIn = (at: number) => lin(frame, at - 4, at + 12);
  const fixed = useSpring(c[4]);
  const examples = ["Sign-in by email, but no emails", "What Duplicate copies", "No other manager to approve"];
  const field = (k: string, v: React.ReactNode, col: string = INK) => (
    <div style={{ display: "flex", height: 58, alignItems: "center", fontSize: 30, borderBottom: `1px solid ${LINE}` }}><span style={{ width: 300, fontFamily: MONO, fontSize: 24, color: INK3 }}>{k}</span><span style={{ color: col, whiteSpace: "nowrap" }}>{v}</span></div>
  );
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 700 }}>
          {Array.from({ length: 8 }, (_, i) => <div key={i} style={{ width: 58, height: 58, background: i < showCount ? (i === 0 || i === 2 || i === 5 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
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
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>SIGN-IN · SEED PEOPLE</div>
            <div style={{ marginTop: 26, fontSize: 32, background: "#fff", border: `1px solid ${LINE}`, padding: "18px 24px" }}>Signed in as <b>jo@northwind.example</b></div>
            <div style={{ marginTop: 18 }}>
              {field("PERSON", "Jo Park · rep")}
              {field("EMAIL", <span style={{ opacity: lin(frame, g1 + 30, g1 + 44) }}>missing in the seed</span>, RED)}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30, fontSize: 30, color: RED, opacity: lin(frame, g1 + 50, g1 + 64) }}><Cross />No one to match</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 22, fontSize: 30, opacity: lin(frame, g1 + 70, g1 + 84) }}><Check />Fix: the seed now lists every email</div>
          </div>
        )}
        {stage === 2 && (
          <div style={{ opacity: stageIn(g2) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>DUPLICATE Q-1039 · WHAT'S COPIED?</div>
            <div style={{ marginTop: 26 }}>
              {(["Client and lines", "Quote discount", "Tax rate", "Notes"] as const).map((k, i) => {
                const known = i === 0;
                const fixedNow = lin(frame, g2 + 70, g2 + 84);
                return (
                  <div key={k} style={{ display: "flex", alignItems: "center", height: 70, fontSize: 32, borderBottom: `1px solid ${LINE}`, opacity: lin(frame, g2 + 6 + i * 8, g2 + 16 + i * 8) }}>
                    <span style={{ width: 420 }}>{k}</span>
                    <span style={{ fontFamily: MONO, fontSize: 26, color: known || fixedNow > 0.5 ? GREEN : AMBER }}>{known || fixedNow > 0.5 ? "COPIED" : "NOT SAID"}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30, fontSize: 30, opacity: lin(frame, g2 + 70, g2 + 84) }}><Check />Fix: section 7 lists everything copied</div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ opacity: stageIn(g3) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>REQUEST APPROVAL · MANAGER'S OWN QUOTE</div>
            <div style={{ marginTop: 26, fontSize: 32, background: "#fff", border: `1px solid ${LINE}`, padding: "18px 24px" }}>No other active manager can approve this quote.</div>
            <div style={{ marginTop: 30, fontSize: 32, color: AMBER, fontWeight: 600, opacity: lin(frame, g3 + 30, g3 + 44) }}>Did the request go through?</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 40, fontSize: 32, opacity: lin(frame, g3 + 80, g3 + 94) }}><Check />Fix: the request is refused</div>
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

// ---------------------------------------------------------------- 8 untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Real sign-in", "Sending email", "The daily job on a real scheduler", "The browser's print dialog", "Hosting"];
  const end = useEnter(s.cues[4] + 30);
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

// ---------------------------------------------------------------- 9 cost
const Cost: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const card = useSpring(c[0] - 6);
  const pay = useEnter(c[3]);
  const build = useEnter(c[4]);
  const lines: [string, string, number][] = [["Starter", "$19 / seat / month, 5 templates", c[0]], ["Business", "$49 / seat / month", c[1]], ["10 seats on Business", "$5,880 a year", c[2]]];
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 940, height: 320, border: `2px solid ${INK}`, background: PAPER_HI, padding: 36, opacity: card, transform: `translateY(${(1 - card) * 50}px)` }}>
        <div style={{ fontSize: 44, fontWeight: 600 }}>PandaDoc</div>
        {lines.map(([k, v, at]) => (
          <div key={k} style={{ display: "flex", height: 60, alignItems: "center", marginTop: 8, fontSize: 30, opacity: lin(frame, at, at + 12) }}>
            <span style={{ width: 340, color: INK2, whiteSpace: "nowrap" }}>{k}</span><span style={{ fontFamily: MONO, fontSize: 28, whiteSpace: "nowrap", color: at === c[2] ? SIGNAL : INK }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 80, top: 605, width: 940, fontSize: 24, color: INK3, opacity: card }}>Source: pandadoc.com/pricing, checked October 2026.</div>
      <div style={{ position: "absolute", left: 80, top: 680, width: 940, ...pay }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>PAY FOR PANDADOC IF YOU NEED</div>
        <div style={{ fontSize: 34, marginTop: 16, lineHeight: 1.5 }}>Legally binding e-signatures · Payments · CRM sync</div>
      </div>
      <div style={{ position: "absolute", left: 1080, top: 270, width: 760, height: 640, border: `3px solid ${SIGNAL}`, background: PAPER_HI, padding: 44, ...build }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL }}>BUILD IT FOR A FEW QUOTES A WEEK</div>
        {["The price list", "The approval rule", "An accept link"].map((t) => (
          <div key={t} style={{ display: "flex", alignItems: "center", gap: 22, marginTop: 40, fontSize: 40 }}><Check />{t}</div>
        ))}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 10 cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "16 rules", "Seed data", "4 phase prompts", "29 checks", "8 fixes included"];
  return (
    <Frame label="EVERYTHING IN ONE FILE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 100, fontWeight: 600, letterSpacing: -3, ...a }}>Everything is in one file.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 14);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${i === 5 ? SIGNAL : INK}`, color: i === 5 ? SIGNAL : INK, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 40, color: INK3, opacity: lin(frame, s.cues[2], s.cues[2] + 20) }}>quote-builder.md · free</div>
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
              <Audio src={`${MEDIA}/quote-builder-sam-v1/${sc.id}.mp3`} />
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
