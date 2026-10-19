import React from "react";
import { AbsoluteFill, Audio, Composition, Img, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const SITE = "https://personalsoftwarefactory.com";
const TL = {"fps":30,"total":4856,"scenes":[{"id":"hook","from":0,"frames":322,"voiceFrom":8,"cues":[136,186,260,288]},{"id":"spec","from":322,"frames":584,"voiceFrom":8,"cues":[166,206,320,502]},{"id":"rule","from":906,"frames":489,"voiceFrom":8,"cues":[65,202,251,361]},{"id":"phases","from":1395,"frames":576,"voiceFrom":8,"cues":[94,177,258,305,452]},{"id":"screens","from":1971,"frames":549,"voiceFrom":8,"cues":[45,187,325,476]},{"id":"result","from":2520,"frames":211,"voiceFrom":8,"cues":[82,148]},{"id":"gaps","from":2731,"frames":826,"voiceFrom":8,"cues":[111,215,376,584,750]},{"id":"untested","from":3557,"frames":391,"voiceFrom":8,"cues":[134,159,197,266]},{"id":"cost","from":3948,"frames":551,"voiceFrom":8,"cues":[69,163,335]},{"id":"cta","from":4499,"frames":357,"voiceFrom":8,"cues":[40,215,281]}]};
type Scene = (typeof TL.scenes)[number];

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
        <span>{String(n).padStart(2, "0")} / 10 · {label}</span>
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

// ---------------------------------------------------------------- 1 hook
const Hook: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const words = "Here's how to reverse engineer Greenhouse from a written spec.".split(" ");
  const stages = ["APPLIED", "SCREEN", "INTERVIEW", "OFFER", "HIRED"];
  const colors = [INK3, BLUE, AMBER, SIGNAL, GREEN];
  const idx = Math.min(stages.length - 1, Math.floor(Math.max(0, frame - 30) / 55));
  const card = useSpring(20);
  const sub = useEnter(s.cues[0]);
  const end = useEnter(s.cues[2]);
  const sc = Math.min(2, Math.floor(Math.max(0, frame - 120) / 70));
  return (
    <Frame label="THE TEARDOWN" n={1}>
      <div style={{ position: "absolute", left: 80, top: 200, width: 1100, fontSize: 84, fontWeight: 600, lineHeight: 1.06, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [4 + i * 3, 14 + i * 3], [0, 1], clamp);
          return <span key={i} style={{ display: "inline-block", marginRight: 22, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: w === "Greenhouse" ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, fontSize: 40, color: INK2, width: 1050, lineHeight: 1.35, ...sub }}>
        One Markdown file. <span style={{ color: SIGNAL, fontWeight: 600, opacity: lin(frame, s.cues[1] - 6, s.cues[1] + 6) }}>29 checks</span> in a real browser.
      </div>
      <div style={{ position: "absolute", left: 80, top: 760, fontSize: 40, fontWeight: 600, ...end }}>What passed, and <span style={{ color: SIGNAL, opacity: lin(frame, s.cues[3] - 6, s.cues[3] + 6) }}>what broke.</span></div>
      <div style={{ position: "absolute", right: 120, top: 300, width: 520, background: PAPER_HI, border: `2px solid ${INK}`, padding: 36, transform: `translateX(${(1 - card) * 700}px) rotate(${(1 - card) * 8}deg)`, boxShadow: "12px 12px 0 rgba(26,26,23,0.08)" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>APPLICATION · ACCOUNT EXECUTIVE</div>
        <div style={{ fontSize: 40, fontWeight: 600, marginTop: 14 }}>Sora Ito</div>
        <div style={{ display: "flex", gap: 12, marginTop: 26, alignItems: "center" }}>
          <Pill c={colors[idx]} fill>{stages[idx]}</Pill>
          <span style={{ fontFamily: MONO, fontSize: 22, color: INK2 }}>referral</span>
        </div>
        <div style={{ marginTop: 26, display: "flex", gap: 10 }}>
          {[0, 1].map((k) => <div key={k} style={{ flex: 1, height: 12, background: k < sc ? GREEN : LINE }} />)}
        </div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: INK3, marginTop: 10 }}>SCORECARDS · {sc} OF 2 SUBMITTED</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 2 spec
const SPEC_LINES = ["# Hiring Pipeline", "Replaces: Greenhouse, the candidate spreadsheet", "", "## 6. Stages and lifecycle", "Applied → Screen → Interview → Offer → Hired", "+ Rejected (with a reason) · Withdrawn", "", "## 8. Business rules", "- R7. Feedback before Offer", "- R11. Feedback independence", "- R14. Retention"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(8);
  const chars = Math.floor(Math.max(0, frame - 14) * 3.2);
  let used = 0;
  const items: [string, string][] = [["Careers page", "Public form, privacy notice the candidate ticks"], ["5 stages", "Applied to Hired, plus Rejected and Withdrawn"], ["Scorecards", "One per interviewer, Strong yes to Definitely not"], ["Retention", "Closed applications anonymized after a set time"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. The part of Greenhouse a small team uses.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>hiring-pipeline.md</div>
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
              <div style={{ width: 250, fontSize: 36, fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 29, color: INK2, width: 560 }}>{v}</div>
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
  const cards = useSpring(c[0] - 10);
  const hm = useSpring(c[1]);
  const gate = useSpring(c[2]);
  const refuse = lin(frame, c[2] + 30, c[2] + 44);
  const score = useSpring(c[3]);
  const strike = lin(frame, c[3] + 24, c[3] + 40);
  return (
    <Frame label="THE CORE RULE" n={3}>
      <H>Honest feedback, enforced</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 980, display: "flex", gap: 36, opacity: cards, transform: `translateY(${(1 - cards) * 50}px)` }}>
        <div style={{ flex: 1, border: `2px solid ${INK}`, background: PAPER_HI, padding: 30, height: 360 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 34 }}>Ben Cho</b><Pill c={GREEN}>SUBMITTED</Pill></div>
          <div style={{ marginTop: 26, filter: "blur(8px)" }}>
            {["Discovery questions · 3 Good", "Product knowledge · 3 Good", "Written follow-up · 2 Mixed", "Recommendation · Yes"].map((t) => <div key={t} style={{ fontFamily: MONO, fontSize: 24, lineHeight: 1.9 }}>{t}</div>)}
          </div>
        </div>
        <div style={{ flex: 1, border: `2px solid ${SIGNAL}`, background: PAPER_HI, padding: 30, height: 360 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}><b style={{ fontSize: 34 }}>Sam Okafor</b><Pill c={AMBER}>PENDING</Pill></div>
          <div style={{ marginTop: 18, opacity: hm, transform: `scale(${0.8 + 0.2 * hm})`, transformOrigin: "left" }}><Pill c={SIGNAL} fill>HIRING MANAGER</Pill></div>
          <div style={{ fontSize: 30, color: INK2, marginTop: 34, lineHeight: 1.35 }}>Submit your scorecard to see the others.</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 80, top: 690, width: 980, opacity: gate, transform: `translateY(${(1 - gate) * 40}px)` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ background: BLUE, color: "#fff", fontSize: 32, fontWeight: 600, padding: "16px 28px" }}>Advance to Offer</div>
          <div style={{ opacity: refuse }}><Cross size={48} /></div>
        </div>
        <div style={{ fontSize: 30, color: RED, marginTop: 22, opacity: refuse }}>Refused: Sam Okafor's scorecard is still pending.</div>
      </div>
      <div style={{ position: "absolute", left: 1160, top: 300, width: 680, height: 560, border: `2px solid ${INK}`, background: PAPER_HI, padding: 44, opacity: score, transform: `scale(${0.9 + 0.1 * score})` }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>WHAT THE APP NEVER DOES</div>
        {["Overall score: 3.4 / 4", "Ranked #1 of 3", "Suggested: hire"].map((t, i) => (
          <div key={t} style={{ position: "relative", fontSize: 40, marginTop: i ? 26 : 40, color: INK2 }}>
            {t}
            <div style={{ position: "absolute", left: 0, top: 26, height: 5, background: RED, width: `${100 * strike}%` }} />
          </div>
        ))}
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 50, opacity: strike }}>The decision stays with the team.</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 4 phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Sign-in, people, roles, settings"], ["Careers and board", "Careers page, applications, the board"], ["Scorecards", "Interviews, scorecards, the Offer gate"], ["Retention", "Digest, reminders, retention, export"]];
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
              {/* Fixed-height rows so title, description and bar line up across every card. Titles must fit on one line. */}
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
          {["Sam sees “1 of 2 submitted”, not Ben's ratings", "Advance to Offer is refused while a scorecard is pending", "Ben opens an application he isn't on: Not found", "Leo's scorecard stays read-only until the interview starts"].map((t, i) => {
            const at = s.cues[4] + 14 + i * 20;
            const p = interpolate(frame, [at, at + 10], [0, 1], clamp);
            return <div key={i} style={{ opacity: p, display: "flex", gap: 16 }}><span style={{ color: GREEN }}>PASS</span><span>{t}</span></div>;
          })}
        </div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 5 screens
// Screenshots are 1440x1050. Boxes are exact element rects in those pixels: [x, y, w, h].
// The camera starts width-fit on the first box and pushes in until the box fills ~70% of the frame.
const VW = 1760, VH = 790, IW = 1440, IHT = 1050;
type Box = [number, number, number, number];
const SHOTS: { src: string; cap: string; boxes: Box[] }[] = [
  { src: `${SITE}/builds/hiring-pipeline/test-board.webp`, cap: "The board: every candidate by stage, with days in stage and scorecards", boxes: [[585, 208, 268, 300]] },
  { src: `${SITE}/builds/hiring-pipeline/test-application-scorecards.webp`, cap: "An application: scorecards, stage actions and the activity log", boxes: [[125, 465, 712, 430]] },
  { src: `${SITE}/builds/hiring-pipeline/test-scorecard-form.webp`, cap: "A scorecard: each attribute rated, and no default recommendation", boxes: [[385, 335, 675, 365], [385, 915, 675, 85]] },
];
const cam = (s: number, cx: number, cy: number) => {
  const tx = Math.min(0, Math.max(VW - s * IW, VW / 2 - s * cx));
  const ty = Math.min(0, Math.max(VH - s * IHT, VH / 2 - s * cy));
  return { tx, ty };
};
const Screens: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const starts = [0, s.cues[1] - 10, s.cues[2] - 10, s.cues[3] - 10, durationInFrames];
  const phoneIn = useSpring(starts[3]);
  const phoneOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], clamp);
  return (
    <Frame label="THE TEST BUILD" n={5}>
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        if (frame < a - 12 || frame > b + 12) return null;
        const inP = interpolate(frame, [a - 12, a + 6], [0, 1], clamp);
        const outP = interpolate(frame, [b - 6, b + 12], [1, 0], clamp);
        const seg = (b - a) / sh.boxes.length;
        const k = Math.min(sh.boxes.length - 1, Math.max(0, Math.floor((frame - a) / seg)));
        const segStart = a + k * seg;
        const box = sh.boxes[k];
        const prev = sh.boxes[Math.max(0, k - 1)];
        const s0 = VW / IW;
        const fit = (bx: Box) => Math.max(s0, Math.min((VW * 0.72) / bx[2], (VH * 0.72) / bx[3], 2.6));
        const t = k === 0 ? lin(frame, a + 8, a + 50) : lin(frame, segStart, segStart + 24);
        const fromS = k === 0 ? s0 : fit(prev), toS = fit(box);
        const fromC = k === 0 ? [box[0] + box[2] / 2, box[1] + box[3] / 2] : [prev[0] + prev[2] / 2, prev[1] + prev[3] / 2];
        const toC = [box[0] + box[2] / 2, box[1] + box[3] / 2];
        const sc = fromS + (toS - fromS) * t;
        const { tx, ty } = cam(sc, fromC[0] + (toC[0] - fromC[0]) * t, fromC[1] + (toC[1] - fromC[1]) * t);
        const boxP = (k === 0 ? lin(frame, a + 44, a + 56) : lin(frame, segStart + 20, segStart + 30)) * outP;
        const pad = 10;
        return (
          <div key={i} style={{ position: "absolute", left: 80, top: 130, width: VW, height: VH, overflow: "hidden", border: `2px solid ${INK}`, background: "#fff", opacity: Math.min(inP, outP) }}>
            <div style={{ position: "absolute", left: 0, top: 0, width: IW, height: IHT, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${sc})` }}>
              <Img src={sh.src} style={{ position: "absolute", left: 0, top: 0, width: IW, height: IHT }} />
              <div style={{ position: "absolute", left: box[0] - pad, top: box[1] - pad, width: box[2] + pad * 2, height: box[3] + pad * 2, border: `${4 / sc}px solid ${SIGNAL}`, borderRadius: 6, opacity: boxP }} />
            </div>
          </div>
        );
      })}
      {frame >= starts[3] - 12 && (
        <div style={{ position: "absolute", left: 0, right: 0, top: 120, display: "flex", justifyContent: "center", gap: 90, alignItems: "center", opacity: Math.min(phoneIn, phoneOut) }}>
          <div style={{ width: 390, height: 800, border: `10px solid ${INK}`, borderRadius: 48, overflow: "hidden", background: "#fff", transform: `translateY(${(1 - phoneIn) * 120}px)` }}>
            <Img src={`${SITE}/builds/hiring-pipeline/test-phone-application-form.webp`} style={{ width: 370, display: "block", transform: `translateY(${-interpolate(frame, [starts[3] + 20, durationInFrames - 20], [0, 180], clamp)}px)` }} />
          </div>
          <div style={{ width: 640, fontSize: 40, lineHeight: 1.35, color: INK2 }}>The public application form, on a phone. The privacy checkbox is never pre-ticked.</div>
        </div>
      )}
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        const p = Math.min(interpolate(frame, [a, a + 12], [0, 1], clamp), interpolate(frame, [b - 8, b], [1, 0], clamp));
        return <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: p }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>{i + 1}/4</span>{sh.cap}</div>;
      })}
      <div style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: Math.min(phoneIn, phoneOut) }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>4/4</span>Candidates apply from the careers page</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 6 result
const Result: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const p = lin(frame, s.cues[0] - 20, s.cues[0] + 30);
  const n = Math.round(29 * p);
  const t = Math.round(65 * lin(frame, s.cues[1], s.cues[1] + 40));
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
  const showCount = Math.round(18 * lin(frame, c[0] - 10, c[0] + 26));
  const stage = frame < c[1] - 10 ? 0 : frame < c[2] - 10 ? 1 : frame < c[3] - 10 ? 2 : frame < c[4] - 10 ? 3 : 4;
  const stageIn = (st: number, at: number) => (stage === st ? lin(frame, at - 10, at + 8) : 0);
  const fixed = useSpring(c[4]);
  const examples = ["Export leaked hidden scorecards", "Retention wiped live contact details", "A rule no screen could reach"];
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 700 }}>
          {Array.from({ length: 18 }, (_, i) => <div key={i} style={{ width: 58, height: 58, background: i < showCount ? (i === 15 || i === 12 || i === 8 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
        </div>
        <div style={{ marginTop: 56 }}>
          {examples.map((t, i) => {
            const on = stage === i + 1, seen = stage > i;
            return <div key={t} style={{ fontSize: 32, padding: "14px 0", borderBottom: `1px solid ${LINE}`, color: on ? SIGNAL : INK2, fontWeight: on ? 600 : 400, opacity: seen ? 1 : 0.25 }}>{i + 1}. {t}</div>;
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 960, top: 270, width: 880, height: 640, border: `2px solid ${INK}`, background: PAPER_HI, padding: 44 }}>
        {stage === 0 && <div style={{ fontSize: 40, color: INK2, lineHeight: 1.4, opacity: lin(frame, c[0] + 10, c[0] + 26) }}>Places where Claude had to guess, because the spec was silent, ambiguous, or contradicted itself.</div>}
        {stage === 1 && (
          <div style={{ opacity: stageIn(1, c[1]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>CSV EXPORT · SAM HAS A PENDING SCORECARD</div>
            <div style={{ fontFamily: MONO, fontSize: 26, marginTop: 34, background: "#fff", border: `1px solid ${LINE}`, padding: 22, lineHeight: 1.7 }}>
              name,stage,yes,no<br />Sora Ito,interview,<span style={{ color: RED, fontWeight: 600 }}>1</span>,<span style={{ color: RED, fontWeight: 600 }}>0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30, fontSize: 30, color: RED }}><Cross />Counts reveal what the rule hides</div>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 30, fontSize: 30, opacity: lin(frame, c[1] + 70, c[1] + 90) }}><Check />Fix: export says “hidden”</div>
          </div>
        )}
        {stage === 2 && (
          <div style={{ opacity: stageIn(2, c[2]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>ONE CANDIDATE, TWO APPLICATIONS</div>
            <div style={{ marginTop: 30, display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ border: `2px solid ${INK3}`, padding: "16px 22px", fontSize: 28, color: INK3 }}>Product Designer · rejected long ago · <b>anonymized</b></div>
              <div style={{ border: `2px solid ${GREEN}`, padding: "16px 22px", fontSize: 28 }}>Account Executive · <b style={{ color: GREEN }}>still open</b></div>
            </div>
            <div style={{ position: "relative", fontFamily: MONO, fontSize: 30, marginTop: 34 }}>
              Phone: +1 212 555 0187
              <div style={{ position: "absolute", left: 0, top: 20, height: 5, background: RED, width: `${520 * lin(frame, c[2] + 40, c[2] + 60)}px` }} />
            </div>
            <div style={{ fontSize: 28, color: INK2, marginTop: 30, opacity: lin(frame, c[2] + 120, c[2] + 140) }}>Fix: contact details clear only when nothing is still open.</div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ opacity: stageIn(3, c[3]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>RULE: MOVE ONE STAGE AT A TIME</div>
            <svg width="800" height="220" style={{ marginTop: 30 }}>
              {["APPLIED", "SCREEN", "INTERVIEW", "OFFER"].map((t, i) => (
                <g key={t}><rect x={i * 200} y="120" width="180" height="70" fill="#fff" stroke={INK} strokeWidth="3" /><text x={i * 200 + 90} y="163" textAnchor="middle" fontFamily={MONO} fontSize="22" fill={INK}>{t}</text></g>
              ))}
              <path d={`M 90 115 Q 290 ${115 - 110 * lin(frame, c[3], c[3] + 30)} 490 115`} fill="none" stroke={RED} strokeWidth="5" strokeDasharray="12 8" />
              <text x="290" y="40" textAnchor="middle" fontFamily={MONO} fontSize="24" fill={RED} opacity={lin(frame, c[3] + 20, c[3] + 34)}>no screen could even try this</text>
            </svg>
            <div style={{ fontSize: 30, color: INK2, marginTop: 24, opacity: lin(frame, c[3] + 90, c[3] + 110) }}>Fix: a “Move to stage” control, so the refusal can be tested.</div>
          </div>
        )}
        {stage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: fixed, transform: `scale(${0.8 + 0.2 * fixed})` }}>
            <Check size={160} p={fixed} />
            <div style={{ fontSize: 52, fontWeight: 600, marginTop: 30 }}>All 18 fixed in the spec</div>
          </div>
        )}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 8 untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Real sign-in", "Real email delivery", "The hourly job, on a real scheduler", "Hosting"];
  const end = useEnter(s.cues[3] + 30);
  return (
    <Frame label="NOT TESTED" n={8}>
      <H>Passing isn't production-ready</H>
      <div style={{ position: "absolute", left: 80, top: 300, width: 1100 }}>
        {items.map((t, i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, padding: "26px 0", borderBottom: `1px solid ${LINE}`, opacity: 0.22 + 0.78 * sp, transform: `translateX(${(1 - sp) * 24}px)` }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${AMBER}` }} />
              <div style={{ fontSize: 44, fontWeight: 500 }}>{t}</div>
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
  const c = s.cues;
  const pay = useEnter(c[1]);
  const build = useEnter(c[2]);
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 270, display: "flex", gap: 28 }}>
        {["Core", "Plus", "Pro"].map((p, i) => {
          const sp = useSpring(c[0] + i * 8);
          return (
            <div key={p} style={{ width: 300, height: 260, border: `2px solid ${INK}`, background: PAPER_HI, padding: 28, opacity: sp, transform: `translateY(${(1 - sp) * 50}px)` }}>
              <div style={{ fontSize: 40, fontWeight: 600 }}>{p}</div>
              <div style={{ fontFamily: MONO, fontSize: 30, color: INK3, marginTop: 14 }}>$ —</div>
              <div style={{ marginTop: 34, background: INK, color: PAPER, fontSize: 26, padding: "12px 18px", display: "inline-block" }}>Get a demo</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 560, width: 940, fontSize: 28, lineHeight: 1.4, color: INK3, opacity: useSpring(c[0] + 30) }}>No published prices. Plans from greenhouse.com/pricing, October 2026.</div>
      <div style={{ position: "absolute", left: 80, top: 660, width: 840, ...pay }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>PAY FOR GREENHOUSE IF YOU NEED</div>
        <div style={{ fontSize: 36, marginTop: 16, lineHeight: 1.5 }}>EEOC reporting · Scheduling automation · Job board reach</div>
      </div>
      <div style={{ position: "absolute", left: 1080, top: 270, width: 760, height: 640, border: `3px solid ${SIGNAL}`, background: PAPER_HI, padding: 44, ...build }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: SIGNAL }}>BUILD IT IF YOU HIRE FOR A FEW ROLES</div>
        {["The board", "Honest scorecards", "A decision on every candidate"].map((t) => (
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
  const list = ["Data model", "18 rules", "Seed data", "4 phase prompts", "29 checks", "18 fixes included"];
  const url = "personalsoftwarefactory.com";
  const typed = url.slice(0, Math.max(0, Math.floor((frame - s.cues[2]) / 1.6)));
  return (
    <Frame label="THE SPEC IS FREE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 110, fontWeight: 600, letterSpacing: -3, ...a }}>The spec is free.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 14);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${INK}`, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 64, color: SIGNAL }}>{typed}<span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span></div>
      <div style={{ position: "absolute", left: 80, top: 790, fontSize: 30, color: INK3, opacity: lin(frame, s.cues[2] + 40, s.cues[2] + 60) }}>blueprints/hiring-pipeline</div>
    </Frame>
  );
};

const SCENES: Record<string, React.FC<{ s: Scene }>> = { hook: Hook, spec: Spec, rule: Rule, phases: Phases, screens: Screens, result: Result, gaps: Gaps, untested: Untested, cost: Cost, cta: Cta };

const Video: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <Audio src={`${MEDIA}/music/chill-wave-kevin-macleod.mp3`} volume={(f) => interpolate(f, [0, 45, TL.total - 90, TL.total], [0, 0.19, 0.19, 0], clamp)} />
      {TL.scenes.map((sc) => {
        const C = SCENES[sc.id];
        return (
          <Sequence key={sc.id} from={sc.from} durationInFrames={sc.frames}>
            <C s={sc} />
            <Sequence from={sc.voiceFrom}>
              <Audio src={`${MEDIA}/hiring-pipeline-v2/${sc.id}.mp3`} />
            </Sequence>
          </Sequence>
        );
      })}
      <span style={{ display: "none" }}>{frame}</span>
    </AbsoluteFill>
  );
};

const Root: React.FC = () => <Composition id="type-video" component={Video} durationInFrames={TL.total} fps={TL.fps} width={1920} height={1080} />;
registerRoot(Root);
