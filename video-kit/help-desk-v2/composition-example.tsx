import React from "react";
import { AbsoluteFill, Audio, Composition, Img, Sequence, interpolate, registerRoot, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";

// ---------------------------------------------------------------- data
const MEDIA = "https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/media/audio";
const SITE = "https://personalsoftwarefactory.com";
const TL = {"fps":30,"total":4530,"scenes":[{"id":"hook","from":0,"frames":323,"voiceFrom":8,"cues":[106,247]},{"id":"spec","from":323,"frames":634,"voiceFrom":8,"cues":[171,264,303,395,463]},{"id":"lifecycle","from":957,"frames":464,"voiceFrom":8,"cues":[46,137,246,305,397]},{"id":"phases","from":1421,"frames":493,"voiceFrom":8,"cues":[94,122,157,201,281]},{"id":"screens","from":1914,"frames":458,"voiceFrom":8,"cues":[45,161,312,396]},{"id":"result","from":2372,"frames":207,"voiceFrom":8,"cues":[73,126]},{"id":"gaps","from":2579,"frames":744,"voiceFrom":8,"cues":[74,201,256,380,536,673]},{"id":"untested","from":3323,"frames":357,"voiceFrom":8,"cues":[132,157,197,228,249]},{"id":"cost","from":3680,"frames":490,"voiceFrom":8,"cues":[47,178,282,373]},{"id":"cta","from":4170,"frames":360,"voiceFrom":8,"cues":[39,264]}]};
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
        <span><span style={{ display: "inline-block", width: 18, height: 18, background: SIGNAL, marginRight: 14, verticalAlign: -2 }} />PERSONAL SOFTWARE FACTORY · FIELD REPORT</span>
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

// ---------------------------------------------------------------- 1 hook
const Hook: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const words = "Can an AI build a Zendesk replacement from a written spec?".split(" ");
  const statuses = ["NEW", "OPEN", "PENDING", "SOLVED", "CLOSED"];
  const colors = [INK3, "#2563eb", AMBER, GREEN, INK];
  const idx = Math.min(statuses.length - 1, Math.floor(Math.max(0, frame - 30) / 60));
  const card = useSpring(20);
  const sub = useEnter(s.cues[0]);
  const end = useEnter(s.cues[1]);
  return (
    <Frame label="THE QUESTION" n={1}>
      <div style={{ position: "absolute", left: 80, top: 230, width: 1100, fontSize: 92, fontWeight: 600, lineHeight: 1.06, letterSpacing: -2 }}>
        {words.map((w, i) => {
          const p = interpolate(frame, [4 + i * 3, 14 + i * 3], [0, 1], clamp);
          const hi = w.startsWith("Zendesk");
          return <span key={i} style={{ display: "inline-block", marginRight: 22, opacity: p, transform: `translateY(${(1 - p) * 30}px)`, color: hi ? SIGNAL : INK }}>{w}</span>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 640, fontSize: 40, color: INK2, width: 1050, lineHeight: 1.35, ...sub }}>
        One Markdown file. <span style={{ color: SIGNAL, fontWeight: 600 }}>24 checks</span> in a real browser.
      </div>
      <div style={{ position: "absolute", left: 80, top: 760, fontSize: 40, fontWeight: 600, ...end }}>What passed, and what broke.</div>
      <div style={{ position: "absolute", right: 120, top: 300, width: 520, background: PAPER_HI, border: `2px solid ${INK}`, padding: 36, transform: `translateX(${(1 - card) * 700}px) rotate(${(1 - card) * 8}deg)`, boxShadow: "12px 12px 0 rgba(26,26,23,0.08)" }}>
        <div style={{ fontFamily: MONO, fontSize: 24, color: INK3 }}>TICKET #1042</div>
        <div style={{ fontSize: 36, fontWeight: 600, marginTop: 14, lineHeight: 1.2 }}>Export to CSV fails over 5,000 rows</div>
        <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
          <span style={{ fontFamily: MONO, fontSize: 24, color: "#fff", background: colors[idx], padding: "6px 14px" }}>{statuses[idx]}</span>
          <span style={{ fontFamily: MONO, fontSize: 22, color: INK2 }}>assigned · Ben Cho</span>
        </div>
        <div style={{ marginTop: 26, height: 10, background: LINE }}><div style={{ height: 10, width: `${Math.min(100, (frame / 3.4))}%`, background: SIGNAL }} /></div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: INK3, marginTop: 10 }}>FIRST RESPONSE TARGET</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 2 spec
const SPEC_LINES = ["# Help Desk", "", "## 6. Ticket lifecycle", "| New | Open | Pending | On-hold | Solved | Closed |", "", "## 8. Business rules", "- R1. A ticket is New until it is assigned", "- R4. Solving needs an owner", "- R7. Internal notes stay internal", "- R11. Threading by number and headers", "", "## 7. First-response targets", "Urgent 1 h · High 4 h · Normal 8 h · Low 24 h"];
const Spec: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const doc = useSpring(8);
  const chars = Math.floor(Math.max(0, frame - 14) * 3.2);
  let used = 0;
  const items: [string, string][] = [["6 statuses", "New → Open → Pending → On-hold → Solved → Closed"], ["1 owner", "No solving without an assignee"], ["Threading", "Replies land on the right ticket"], ["Notes", "Never emailed to the customer"], ["Targets", "Urgent 1 h · High 4 h · Normal 8 h · Low 24 h"]];
  return (
    <Frame label="THE SPEC" n={2}>
      <H>One file. The part of Zendesk a small team uses.</H>
      <div style={{ position: "absolute", left: 80, top: 270, width: 760, height: 700, background: INK, color: "#e9e6dc", fontFamily: MONO, fontSize: 24, padding: "28px 32px", lineHeight: 1.6, opacity: doc, transform: `scale(${0.96 + doc * 0.04})`, transformOrigin: "top left" }}>
        <div style={{ color: "#8b877c", marginBottom: 12 }}>help-desk.md</div>
        {SPEC_LINES.map((l, i) => {
          const start = used; used += l.length + 1;
          const shown = l.slice(0, Math.max(0, Math.min(l.length, chars - start)));
          const head = l.startsWith("#");
          return <div key={i} style={{ minHeight: 38, color: head ? "#f7b48f" : "#e9e6dc", whiteSpace: "pre" }}>{shown}{chars >= start && chars < start + l.length ? "▍" : ""}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 900, top: 290, width: 940 }}>
        {items.map(([k, v], i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 0", borderBottom: `1px solid ${LINE}`, opacity: sp, transform: `translateX(${(1 - sp) * 60}px)` }}>
              <Check p={interpolate(frame, [s.cues[i] + 6, s.cues[i] + 20], [0, 1], clamp)} />
              <div style={{ width: 210, fontSize: 36, fontWeight: 600 }}>{k}</div>
              <div style={{ fontSize: 30, color: INK2 }}>{v}</div>
            </div>
          );
        })}
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 3 lifecycle
const NODES: Record<string, [number, number]> = { NEW: [260, 560], OPEN: [700, 560], PENDING: [1140, 360], SOLVED: [1140, 760], CLOSED: [1580, 760] };
type Edge = { a: string; b: string; at: number; label: string; bend: number; color: string; lx: number; ly: number };
const qpt = (e: Edge, t: number): [number, number] => {
  const [x1, y1] = NODES[e.a], [x2, y2] = NODES[e.b];
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const cx = mx + (-(y2 - y1) / len) * e.bend, cy = my + ((x2 - x1) / len) * e.bend;
  const u = 1 - t;
  return [u * u * x1 + 2 * u * t * cx + t * t * x2, u * u * y1 + 2 * u * t * cy + t * t * y2];
};
const Lifecycle: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const edges: Edge[] = [
    { a: "NEW", b: "OPEN", at: c[0], label: "assigned", bend: 0, color: INK, lx: 0, ly: -26 },
    { a: "OPEN", b: "PENDING", at: c[1], label: "waiting on customer", bend: 120, color: INK, lx: 190, ly: 60 },
    { a: "PENDING", b: "OPEN", at: c[2], label: "customer replies", bend: 120, color: AMBER, lx: -160, ly: -40 },
    { a: "OPEN", b: "SOLVED", at: c[3] - 30, label: "solved", bend: 0, color: INK, lx: -70, ly: 10 },
    { a: "SOLVED", b: "CLOSED", at: c[3], label: "after 4 days", bend: 0, color: INK, lx: 0, ly: -26 },
  ];
  let pos: [number, number] = NODES.NEW;
  for (const e of edges) {
    const p = lin(frame, e.at, e.at + 24);
    if (p > 0) pos = qpt(e, p);
  }
  const lock = useSpring(c[4]);
  return (
    <Frame label="THE LIFECYCLE" n={3}>
      <H>Zendesk's ticket lifecycle, kept</H>
      <svg width="1920" height="1080" style={{ position: "absolute", left: 0, top: 0 }}>
        {edges.map((e, i) => {
          const p = lin(frame, e.at - 8, e.at + 16);
          const pts = Array.from({ length: 41 }, (_, k) => qpt(e, k / 40));
          const d = "M " + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");
          let len = 0;
          for (let k = 1; k < pts.length; k++) len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
          const [mx, my] = qpt(e, 0.5);
          return (
            <g key={i} opacity={0.25 + 0.75 * p}>
              <path d={d} fill="none" stroke={e.color} strokeWidth="4" strokeDasharray={len} strokeDashoffset={len * (1 - p)} />
              <text x={mx + e.lx} y={my + e.ly} textAnchor="middle" fontFamily={MONO} fontSize="24" fill={e.color === AMBER ? AMBER : INK2} opacity={p}>{e.label}</text>
            </g>
          );
        })}
        {Object.entries(NODES).map(([k, [x, y]]) => (
          <g key={k}>
            <rect x={x - 130} y={y - 46} width="260" height="92" fill={k === "CLOSED" ? INK : PAPER_HI} stroke={INK} strokeWidth="3" />
            <text x={x} y={y + 12} textAnchor="middle" fontFamily={MONO} fontSize="32" fontWeight="500" fill={k === "CLOSED" ? PAPER : INK}>{k}</text>
          </g>
        ))}
        <circle cx={pos[0]} cy={pos[1] - 66} r="18" fill={SIGNAL} />
        <text x={pos[0]} y={pos[1] - 96} textAnchor="middle" fontFamily={MONO} fontSize="22" fill={SIGNAL}>#1042</text>
        <g opacity={lock} transform={`translate(${NODES.CLOSED[0] + 150}, ${NODES.CLOSED[1] - 50}) scale(${0.6 + lock * 0.4})`}>
          <rect x="0" y="28" width="56" height="44" fill={RED} /><path d="M10 28 v-10 a18 18 0 0 1 36 0 v10" fill="none" stroke={RED} strokeWidth="7" />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 1180, top: 900, fontSize: 34, color: RED, fontWeight: 600, opacity: lock }}>Nobody closes a ticket by hand.</div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 4 phases
const Phases: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const ph: [string, string][] = [["Foundation", "Agents, seed data, the ticket model"], ["Queues and replies", "Five queues, replies, notes, targets"], ["Email in", "Inbound email, threading, follow-ups"], ["Close and report", "Auto-close, reports, CSV, deletion"]];
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
              <div style={{ fontSize: 42, fontWeight: 600, marginTop: 22, lineHeight: 1.1 }}>{t}</div>
              <div style={{ fontSize: 28, color: INK2, marginTop: 18, lineHeight: 1.35 }}>{d}</div>
              <div style={{ marginTop: 26, height: 10, background: LINE }}><div style={{ height: 10, width: `${fill * 100}%`, background: SIGNAL }} /></div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 670, width: 1760, height: 300, border: `2px solid ${INK}`, background: PAPER_HI, opacity: browser, transform: `translateY(${(1 - browser) * 60}px)` }}>
        <div style={{ height: 44, borderBottom: `2px solid ${INK}`, display: "flex", alignItems: "center", gap: 10, padding: "0 16px", fontFamily: MONO, fontSize: 20, color: INK3 }}>
          <span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} /><span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} /><span style={{ width: 14, height: 14, borderRadius: 7, background: LINE }} />
          <span style={{ marginLeft: 16 }}>acceptance checks · running in Chromium</span>
        </div>
        <div style={{ padding: "18px 28px", fontFamily: MONO, fontSize: 25, lineHeight: 1.7 }}>
          {["Unassigned shows #1001 first, Due soon", "Ben replies; the customer gets “Re: … [#1004]”", "An internal note is never emailed", "A reply to a closed ticket opens a follow-up"].map((t, i) => {
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
const SHOTS = [
  { src: `${SITE}/builds/help-desk/test-queues-all-open.webp`, cap: "The queue: first-response state for every ticket, overdue first", focus: [0.86, 0.3] },
  { src: `${SITE}/builds/help-desk/test-ticket-1004.webp`, cap: "A ticket: the email, replies, an internal note and its history", focus: [0.3, 0.6] },
  { src: `${SITE}/builds/help-desk/test-reports.webp`, cap: "Weekly reports: response times against target", focus: [0.5, 0.35] },
  { src: `${SITE}/builds/help-desk/test-admin-settings.webp`, cap: "Admin settings: targets by priority, auto-close after 4 days", focus: [0.35, 0.4] },
];
const Screens: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const starts = [0, s.cues[1] - 10, s.cues[2] - 10, s.cues[3] - 10, durationInFrames];
  return (
    <Frame label="THE TEST BUILD" n={5}>
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        if (frame < a - 12 || frame > b + 12) return null;
        const inP = interpolate(frame, [a - 12, a + 6], [0, 1], clamp);
        const outP = interpolate(frame, [b - 6, b + 12], [1, 0], clamp);
        const z = interpolate(frame, [a, b], [1, 1.35], clamp);
        const [fx, fy] = sh.focus;
        return (
          <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 130, height: 790, overflow: "hidden", border: `2px solid ${INK}`, background: "#fff", opacity: Math.min(inP, outP) }}>
            <Img src={sh.src} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top left", transform: `scale(${z})`, transformOrigin: `${fx * 100}% ${fy * 100}%` }} />
            <div style={{ position: "absolute", left: `${fx * 100 - 13}%`, top: `${fy * 100 - 14}%`, width: "26%", height: "28%", border: `4px solid ${SIGNAL}`, opacity: interpolate(frame, [a + 30, a + 45], [0, 1], clamp) * outP }} />
          </div>
        );
      })}
      {SHOTS.map((sh, i) => {
        const a = starts[i], b = starts[i + 1];
        const p = Math.min(interpolate(frame, [a, a + 12], [0, 1], clamp), interpolate(frame, [b - 8, b], [1, 0], clamp));
        return <div key={i} style={{ position: "absolute", left: 80, right: 80, top: 950, fontSize: 38, fontWeight: 500, opacity: p }}><span style={{ fontFamily: MONO, color: SIGNAL, marginRight: 18 }}>{i + 1}/4</span>{sh.cap}</div>;
      })}
    </Frame>
  );
};

// ---------------------------------------------------------------- 6 result
const Result: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const p = lin(frame, s.cues[0] - 20, s.cues[0] + 30);
  const n = Math.round(24 * p);
  const t = Math.round(64 * lin(frame, s.cues[1], s.cues[1] + 40));
  const r = 210, C = 2 * Math.PI * r;
  const tests = useEnter(s.cues[1]);
  return (
    <Frame label="THE RESULT" n={6}>
      <H>Final run, fresh database</H>
      <svg width="560" height="560" style={{ position: "absolute", left: 140, top: 300 }}>
        <circle cx="280" cy="280" r={r} fill="none" stroke={LINE} strokeWidth="28" />
        <circle cx="280" cy="280" r={r} fill="none" stroke={GREEN} strokeWidth="28" strokeDasharray={C} strokeDashoffset={C * (1 - p)} transform="rotate(-90 280 280)" />
        <text x="280" y="300" textAnchor="middle" fontFamily={SANS} fontSize="150" fontWeight="600" fill={INK}>{n}</text>
        <text x="280" y="370" textAnchor="middle" fontFamily={MONO} fontSize="30" fill={INK3}>OF 24 CHECKS</text>
      </svg>
      <div style={{ position: "absolute", left: 860, top: 420, ...tests }}>
        <div style={{ fontSize: 150, fontWeight: 600, letterSpacing: -4 }}>{t}</div>
        <div style={{ fontFamily: MONO, fontSize: 30, color: INK3 }}>AUTOMATED TESTS PASSING</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 7 gaps
const GROUPS: [string, number][] = [["Seed data", 4], ["Boundaries", 3], ["Contradictions", 4], ["Undefined", 4], ["Email", 6]];
const Gaps: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const c = s.cues;
  const showCount = Math.round(21 * interpolate(frame, [4, 36], [0, 1], clamp));
  const groupsP = lin(frame, c[1] - 10, c[1] + 30);
  const stage = frame < c[2] - 10 ? 0 : frame < c[3] - 10 ? 1 : frame < c[4] - 10 ? 2 : frame < c[5] - 10 ? 3 : 4;
  const stageIn = (st: number, at: number) => (stage === st ? lin(frame, at - 10, at + 8) : 0);
  const fixed = useSpring(c[5]);
  let x = 0;
  return (
    <Frame label="WHAT BROKE" n={7}>
      <H><span style={{ color: SIGNAL }}>{showCount}</span> gaps in the spec</H>
      <div style={{ position: "absolute", left: 80, top: 260, width: 760 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, width: 700 }}>
          {Array.from({ length: 21 }, (_, i) => <div key={i} style={{ width: 58, height: 58, background: i < showCount ? (i >= 15 ? SIGNAL : INK) : LINE, opacity: i < showCount ? 1 : 0.5 }} />)}
        </div>
        <div style={{ marginTop: 48, opacity: groupsP }}>
          {GROUPS.map(([g, k]) => {
            const w = 520 * (k / 6) * groupsP;
            const email = g === "Email";
            return (
              <div key={g} style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 14 }}>
                <div style={{ width: 230, fontSize: 28, fontWeight: email ? 600 : 400, color: email ? SIGNAL : INK }}>{g}</div>
                <div style={{ height: 30, width: w, background: email ? SIGNAL : INK2 }} />
                <div style={{ fontFamily: MONO, fontSize: 26 }}>{k}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div style={{ position: "absolute", left: 960, top: 260, width: 880, height: 640, border: `2px solid ${INK}`, background: PAPER_HI, padding: 44 }}>
        {stage === 0 && <div style={{ fontSize: 40, color: INK2, lineHeight: 1.4, opacity: lin(frame, 8, 24) }}>Places where Claude had to guess, because the spec was silent, ambiguous, or contradicted itself.</div>}
        {stage === 1 && (
          <div style={{ opacity: stageIn(1, c[2]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>INBOUND EMAIL ENDPOINT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40, fontFamily: MONO, fontSize: 32 }}><Cross />Authorization: Bearer …</div>
            <div style={{ fontSize: 30, color: INK2, marginTop: 16 }}>Common email providers can't send it.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 50, fontFamily: MONO, fontSize: 32, opacity: lin(frame, c[2] + 50, c[2] + 70) }}><Check />Also accept HTTP Basic</div>
          </div>
        )}
        {stage === 2 && (
          <div style={{ opacity: stageIn(2, c[3]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>THREADING</div>
            <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 50 }}>
              <div style={{ border: `2px solid ${INK}`, padding: "18px 22px", fontSize: 28, background: "#fff" }}>✉ stranger@other.example<br /><span style={{ fontFamily: MONO, fontSize: 22, color: INK3 }}>In-Reply-To: &lt;#1004&gt;</span></div>
              <svg width="160" height="40"><line x1="0" y1="20" x2={140 * lin(frame, c[3], c[3] + 30)} y2="20" stroke={RED} strokeWidth="5" /><path d="M128 8 L150 20 L128 32" fill="none" stroke={RED} strokeWidth="5" opacity={lin(frame, c[3] + 25, c[3] + 30)} /></svg>
              <div style={{ border: `2px solid ${RED}`, padding: "18px 22px", fontSize: 28, color: RED }}>Ticket #1004<br /><span style={{ fontSize: 22 }}>Priya's ticket</span></div>
            </div>
            <div style={{ fontSize: 30, color: INK2, marginTop: 44 }}>Fix: only the ticket's own requester can reply into it.</div>
          </div>
        )}
        {stage === 3 && (
          <div style={{ opacity: stageIn(3, c[4]) }}>
            <div style={{ fontFamily: MONO, fontSize: 26, color: INK3 }}>A WORKED EXAMPLE ON THE LINE</div>
            <svg width="780" height="200" style={{ marginTop: 40 }}>
              <line x1="20" y1="100" x2="760" y2="100" stroke={INK} strokeWidth="4" />
              <rect x="20" y="70" width="555" height="60" fill={GREEN} opacity="0.18" /><rect x="575" y="70" width="185" height="60" fill={AMBER} opacity="0.25" />
              <line x1="575" y1="40" x2="575" y2="160" stroke={AMBER} strokeWidth="4" strokeDasharray="8 6" />
              <text x="300" y="60" fontFamily={MONO} fontSize="22" fill={GREEN} textAnchor="middle">DUE IN …</text>
              <text x="668" y="60" fontFamily={MONO} fontSize="22" fill={AMBER} textAnchor="middle">DUE SOON</text>
              <circle cx={interpolate(frame, [c[4], c[4] + 40], [120, 575], clamp)} cy="100" r="18" fill={SIGNAL} />
            </svg>
            <div style={{ fontSize: 30, color: INK2, marginTop: 20 }}>Exactly 25% of the target left: both answers were defensible.</div>
          </div>
        )}
        {stage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: fixed, transform: `scale(${0.8 + 0.2 * fixed})` }}>
            <Check size={160} p={fixed} />
            <div style={{ fontSize: 52, fontWeight: 600, marginTop: 30 }}>All 21 fixed in the spec</div>
          </div>
        )}
      </div>
      <span style={{ display: "none" }}>{x}</span>
    </Frame>
  );
};

// ---------------------------------------------------------------- 8 untested
const Untested: React.FC<{ s: Scene }> = ({ s }) => {
  const items = ["Real sign-in", "Real email, in and out", "A real scheduler", "Hosting"];
  const end = useEnter(s.cues[4]);
  return (
    <Frame label="NOT TESTED" n={8}>
      <H>Passing isn't production-ready</H>
      <div style={{ position: "absolute", left: 80, top: 300, width: 1100 }}>
        {items.map((t, i) => {
          const sp = useSpring(s.cues[i]);
          return (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 28, padding: "26px 0", borderBottom: `1px solid ${LINE}`, opacity: 0.22 + 0.78 * sp, transform: `translateX(${(1 - sp) * 24}px)` }}>
              <div style={{ width: 40, height: 40, border: `3px solid ${AMBER}` }} />
              <div style={{ fontSize: 46, fontWeight: 500 }}>{t}</div>
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
  const a = lin(frame, c[1] - 10, c[1] + 30);
  const b = lin(frame, c[3] - 10, c[3] + 30);
  const price = useEnter(c[0]);
  const build = useEnter(c[2]);
  const H_MAX = 520, MAXV = 3300;
  const bar = (v: number, p: number, color: string, label: string, x: number) => (
    <>
      <div style={{ position: "absolute", left: x, bottom: 1080 - 960, width: 260, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        <div style={{ fontSize: 48, fontWeight: 600, opacity: p, marginBottom: 12 }}>${Math.round(v * p).toLocaleString("en-US")}</div>
        <div style={{ height: H_MAX * (v / MAXV) * p, background: color }} />
      </div>
      <div style={{ position: "absolute", left: x, top: 976, width: 300, fontFamily: MONO, fontSize: 22, color: INK3, lineHeight: 1.4, opacity: p }}>{label}</div>
    </>
  );
  return (
    <Frame label="THE COST" n={9}>
      <H>Is it worth building?</H>
      <div style={{ position: "absolute", left: 80, top: 260, fontSize: 38, color: INK2, ...price }}>Zendesk Support Team: <b style={{ color: INK }}>$19</b> per agent per month, paid yearly</div>
      <div style={{ position: "absolute", left: 80, right: 80, top: 960, height: 2, background: INK }} />
      {bar(1140, a, INK2, "SUPPORT TEAM · 5 AGENTS · YEAR", 180)}
      {bar(3300, b, SIGNAL, "SUITE TEAM $55 · 5 AGENTS · YEAR", 560)}
      <div style={{ position: "absolute", left: 1000, top: 420, width: 840, fontSize: 40, lineHeight: 1.4, ...build }}>
        Building wins most clearly when you'd otherwise need <span style={{ color: SIGNAL, fontWeight: 600 }}>the Suite plan</span>, or rules your plan doesn't offer.
        <div style={{ fontSize: 26, color: INK3, marginTop: 24 }}>Prices from zendesk.com/pricing, October 2026.</div>
      </div>
    </Frame>
  );
};

// ---------------------------------------------------------------- 10 cta
const Cta: React.FC<{ s: Scene }> = ({ s }) => {
  const frame = useCurrentFrame();
  const a = useEnter(0);
  const list = ["Data model", "15 rules", "Seed data", "4 phase prompts", "24 checks", "21 fixes included"];
  const url = "personalsoftwarefactory.com";
  const typed = url.slice(0, Math.max(0, Math.floor((frame - s.cues[1]) / 1.6)));
  return (
    <Frame label="THE SPEC IS FREE" n={10}>
      <div style={{ position: "absolute", left: 80, top: 230, fontSize: 110, fontWeight: 600, letterSpacing: -3, ...a }}>The spec is free.</div>
      <div style={{ position: "absolute", left: 80, top: 420, display: "flex", flexWrap: "wrap", gap: 18, width: 1500 }}>
        {list.map((t, i) => {
          const sp = useSpring(s.cues[0] + i * 12);
          return <div key={t} style={{ fontSize: 36, border: `2px solid ${INK}`, padding: "12px 22px", background: PAPER_HI, opacity: sp, transform: `scale(${0.85 + 0.15 * sp})` }}>{t}</div>;
        })}
      </div>
      <div style={{ position: "absolute", left: 80, top: 680, fontFamily: MONO, fontSize: 64, color: SIGNAL }}>{typed}<span style={{ opacity: frame % 30 < 15 ? 1 : 0 }}>▍</span></div>
      <div style={{ position: "absolute", left: 80, top: 790, fontSize: 30, color: INK3, opacity: lin(frame, s.cues[1] + 40, s.cues[1] + 60) }}>blueprints/help-desk</div>
    </Frame>
  );
};

const SCENES: Record<string, React.FC<{ s: Scene }>> = { hook: Hook, spec: Spec, lifecycle: Lifecycle, phases: Phases, screens: Screens, result: Result, gaps: Gaps, untested: Untested, cost: Cost, cta: Cta };

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
              <Audio src={`${MEDIA}/zendesk-v2b/${sc.id}.mp3`} />
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
