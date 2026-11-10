#!/usr/bin/env python3
"""Generate agent skills (skills/<slug>/SKILL.md + references/spec.md) from blueprints/*.md."""
import os, re, shutil, sys

repo = sys.argv[1]
demo_slugs = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else set()
SITE = "https://personalsoftwarefactory.com"
readme = open(os.path.join(repo, "README.md")).read()

rows = {}
for line in readme.splitlines():
    m = re.match(r"\| \*\*(.+?)\*\*: (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| \[(.+?)\.md\]", line)
    if m:
        title, problem, replaces, team, size, status, slug = m.groups()
        rows[slug] = dict(title=title, problem=problem, replaces=replaces, team=team, size=size, status=status)

out_root = os.path.join(repo, "skills")
if os.path.exists(out_root):
    shutil.rmtree(out_root)

index_lines = []
for slug, r in sorted(rows.items(), key=lambda kv: (kv[1]["team"], kv[1]["title"])):
    src = os.path.join(repo, "blueprints", f"{slug}.md")
    spec = open(src).read()
    hdr = re.search(r"Replaces: (.+)", spec)
    replaces_full = hdr.group(1).strip() if hdr else r["replaces"]
    phases = re.findall(r"^### (Phase \d+: .+)$", spec, re.M)
    tested = r["status"].startswith("Build-tested")
    name = slug
    page = f"{SITE}/blueprints/{slug}"
    alt_names = [a.split("(")[0].strip() for a in replaces_full.split(",")]
    vendors = [a for a in alt_names if a and a[0].isupper() and not a.lower().startswith("the ")][:3]
    vend = " / ".join(vendors) if vendors else r["replaces"]
    size_txt = r["size"].replace("–", " to ")
    team_l = r["team"].lower() if r["team"] != "People" else "people-ops"
    proof = (f"a build-tested blueprint ({r['status'].split(', ',1)[1]})" if tested else "a complete blueprint (build test pending)")
    desc = (f"Build a self-hosted {r['title']}, a lightweight {vend} alternative for {team_l} teams of {size_txt}, "
            f"from {proof} with data model, business rules, seed data, phased build prompts and acceptance checks. "
            f"Use when someone wants to build their own {r['title']}, replace {vendors[0] if vendors else r['replaces']} with an internal tool, "
            f"or says: \"{r['problem']}\"")
    desc = desc.replace('"', "'")
    if len(desc) > 1000:
        desc = desc[:997] + "..."
    phase_list = "\n".join(f"   - {p}" for p in phases) or "   - (see section 13 of the spec)"
    demo = f"\n- Live demo with sample data: {page}/demo" if slug in demo_slugs else ""
    evidence = (f"This spec was build-tested: an AI builder followed the phase prompts and every acceptance check was run in a real browser ({r['status']}). "
                "Gaps the test exposed are already fixed in the spec. Read section 15 for what was not tested (typically production sign-in, real email delivery and hosting)."
                if tested else
                "This is a full spec that has not yet been build-tested end to end. Expect a few ambiguities; record each one as a spec gap (step 5).")
    body = f"""---
name: {name}
description: "{desc}"
license: MIT
metadata:
  author: Personal Software Factory
  source: {page}
  status: "{r['status']}"
---

# {r['title']}

> "{r['problem']}"

A complete, build-ready blueprint for an internal {r['title'].lower()} that a {team_l} team of {size_txt} can run instead of paying per seat for {replaces_full}. The full spec is in [references/spec.md](references/spec.md): the problem, what the paid product actually does (checked on the vendor's own pages), what v1 keeps and leaves out, roles, data model, business rules, screens, edge cases, seed data, a four-phase build plan with acceptance checks, and build notes.

{evidence}

## When to use

- The user wants to build a {r['title']} (or replace {vend}) with an AI coding agent.
- The user describes the problem above, or asks whether to build or buy this kind of tool.

Do not use it for a large enterprise rollout that needs the features listed under "What this blueprint deliberately leaves out" in section 2 of the spec; say so and recommend the paid product instead.

## How to build it

1. **Read the whole spec first**: [references/spec.md](references/spec.md). Treat its rules, data model and acceptance checks as the contract. Do not add features the spec leaves out unless the user asks.
2. **Pick the stack.** Use the user's existing project or stack if there is one. Otherwise use a small full-stack web app (for example Next.js with SQLite in development and Postgres in production). Keep the spec's configuration values (team time zone, currency and so on) as environment variables.
3. **Build one phase at a time**, using the prompts in section 13 of the spec:
{phase_list}
4. **Run that phase's acceptance checks before moving on.** Reset to the seed data in section 12 before each phase's checks. Run the checks in a browser (or with browser automation such as Playwright) and write automated tests for the business rules and worked examples. Fix every failure before starting the next phase.
5. **Record spec gaps.** Whenever you have to interpret or guess something the spec does not say, write it down in a `SPEC-GAPS.md` file in the project and tell the user at the end of each phase. Do not silently invent behaviour.
6. **Report honestly.** When done, list which checks passed and what was not tested. Do not claim production readiness: production sign-in, real email delivery, scheduled jobs and hosting need their own testing (see section 15 of the spec).

## Links

- Blueprint page, with a labelled drawing, build-or-buy notes and test results: {page}{demo}
- All 37 blueprints: {SITE}/blueprints
- Report a spec gap: https://github.com/samclaassen/internal-tool-blueprints/issues/new
"""
    d = os.path.join(out_root, slug)
    os.makedirs(os.path.join(d, "references"))
    open(os.path.join(d, "SKILL.md"), "w").write(body)
    shutil.copy(src, os.path.join(d, "references", "spec.md"))
    index_lines.append((r["team"], f"| `{slug}` | {r['title']} | {r['replaces']} | {r['size']} | {'Build-tested' if tested else 'Spec'} |"))

# Router skill
teams = {}
for t, l in index_lines:
    teams.setdefault(t, []).append(l)
table = "| Skill | Tool | Replaces | Team size | Status |\n|---|---|---|---|---|\n" + "\n".join(l for _, l in index_lines)
router = f"""---
name: internal-tool-blueprints
description: "Choose and build the right internal tool for a small team instead of paying per seat for SaaS: CRM, help desk, approval workflow, expense reports, timesheets, hiring pipeline, bug tracker, OKRs and 30 more, each from a build-tested blueprint. Use when someone asks whether to build or buy a business tool, wants an internal tool built with AI, or names a SaaS product (HubSpot, Zendesk, Jira, Expensify, BambooHR, Monday.com...) they want to replace."
license: MIT
metadata:
  author: Personal Software Factory
  source: {SITE}/blueprints
---

# Internal tool blueprints

{len(index_lines)} free blueprints for the internal tools a small team can build with an AI coding agent instead of renting them per seat. Each is a single Markdown spec with a data model, business rules, seed data, a four-phase build plan and acceptance checks. Most are build-tested: an AI builder followed the prompts and every check was run in a real browser.

## How to use

1. Match the user's need to a row in the table below (by the tool, the product it replaces, or the problem they describe). If nothing matches, say so; do not stretch a blueprint to fit.
2. If the matching skill is installed (for example `simple-crm`), use it. Otherwise install it with `npx skills add samclaassen/internal-tool-blueprints --skill <name>`, or fetch the spec directly from `https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/main/blueprints/<name>.md`.
3. Before building, check the build-or-buy fit: team size inside the blueprint's range, and none of the spec's "deliberately leaves out" features are must-haves. The guide at {SITE}/guides/build-vs-buy-saas covers the trade-off; current SaaS prices are at {SITE}/guides/saas-pricing-for-small-teams.
4. Build phase by phase, run each phase's acceptance checks, and record spec gaps, as the individual skill describes.

## Blueprints

{table}

Pages with drawings, demos and test results: {SITE}/blueprints
"""
d = os.path.join(out_root, "internal-tool-blueprints")
os.makedirs(d)
open(os.path.join(d, "SKILL.md"), "w").write(router)
print(len(index_lines), "skills + router")
