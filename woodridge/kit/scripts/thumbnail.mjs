// Render a 1280x720 YouTube thumbnail in the site's style.
// Usage: node thumbnail.mjs <spec.json> <out.png>
// spec.json: { "title": "Claude built a Zendesk replacement", "stats": [{"n":"24/24","label":"checks passed","tone":"ok"},{"n":"21","label":"spec gaps found","tone":"signal"}], "shot": "/abs/path/screenshot.webp", "kicker": "Build test · Help desk" }
// Needs playwright-core and Chromium (/usr/bin/chromium by default, override with CHROMIUM).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const [specPath, out] = process.argv.slice(2);
if (!specPath || !out) {
  console.error("usage: node thumbnail.mjs <spec.json> <out.png>");
  process.exit(2);
}
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));
// Brand: $BRAND_JSON, ./brand.json or ../brand.json
const brandPath = [process.env.BRAND_JSON, "brand.json", "../brand.json", path.join(path.dirname(new URL(import.meta.url).pathname), "..", "brand.json")].find((p) => p && fs.existsSync(p));
if (!brandPath) { console.error("brand.json not found"); process.exit(2); }
const B = JSON.parse(fs.readFileSync(brandPath, "utf8"));
const C = B.colors, SANS = B.fonts.sans_family, MONO = B.fonts.mono_family;
const gf = (f, w) => f.replace(/ /g, "+") + ":wght@" + w;
// Resolve playwright-core from the current directory first (a Next.js repo usually has it), then from here.
const req = createRequire(path.join(process.cwd(), "noop.js"));
let chromium;
try {
  ({ chromium } = req("playwright-core"));
} catch {
  ({ chromium } = await import("playwright-core"));
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const shot = spec.shot ? `data:image/${path.extname(spec.shot).slice(1).replace("jpg", "jpeg")};base64,${fs.readFileSync(spec.shot).toString("base64")}` : null;
const tone = { ok: C.ok, signal: C.signal, ink: C.ink };

const html = `<!doctype html><html><head>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=${gf(MONO, "500")}&family=${gf(SANS, "500;600;700")}&display=block" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0}
body{width:1280px;height:720px;overflow:hidden;background:${C.paper};font-family:'${SANS}',sans-serif;color:${C.ink};position:relative}
.grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,0,0,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,.07) 1px,transparent 1px);background-size:40px 40px}
.brand{position:absolute;left:64px;top:52px;display:flex;align-items:center;gap:14px;font-weight:600;font-size:26px}
.logo{width:40px;height:40px;border:3px solid ${C.ink};border-radius:4px;position:relative;background:${C.paper}}
.logo:after{content:"";position:absolute;right:3px;bottom:3px;width:20px;height:20px;background:${C.signal}}
.kicker{position:absolute;left:64px;top:130px;font-family:'${MONO}',monospace;font-size:24px;letter-spacing:.08em;text-transform:uppercase;color:${C.ink3}}
h1{position:absolute;left:60px;top:176px;width:${shot ? 620 : 1100}px;font-size:${spec.titleSize ?? 78}px;line-height:1.02;font-weight:700;letter-spacing:-.025em}
.stats{position:absolute;left:64px;bottom:64px;display:flex;gap:22px}
.stat{background:${C.paper_hi};border:3px solid ${C.ink};padding:14px 22px 16px;min-width:230px}
.n{font-size:68px;font-weight:700;line-height:1;letter-spacing:-.03em}
.l{font-family:'${MONO}',monospace;font-size:20px;text-transform:uppercase;letter-spacing:.05em;margin-top:8px;color:${C.ink3}}
.shot{position:absolute;right:-70px;top:120px;width:620px;border:3px solid ${C.ink};box-shadow:18px 18px 0 ${C.ink};transform:rotate(-2.5deg);background:#fff}
.shot img{display:block;width:100%}
</style></head><body><div class="grid"></div>
<div class="brand"><div class="logo"></div>${esc(B.brand_name)}</div>
${spec.kicker ? `<div class="kicker">${esc(spec.kicker)}</div>` : ""}
<h1>${esc(spec.title)}</h1>
${shot ? `<div class="shot"><img src="${shot}"></div>` : ""}
<div class="stats">${(spec.stats ?? []).map((s) => `<div class="stat"><div class="n" style="color:${tone[s.tone] ?? tone.ink}">${esc(s.n)}</div><div class="l">${esc(s.label)}</div></div>`).join("")}</div>
</body></html>`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/usr/bin/chromium", args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: out, type: out.endsWith(".jpg") ? "jpeg" : "png", quality: out.endsWith(".jpg") ? 92 : undefined });
await browser.close();
console.log(JSON.stringify({ out, bytes: fs.statSync(out).size }));
