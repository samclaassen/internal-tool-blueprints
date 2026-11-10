---
name: document-requests
description: "Build a self-hosted Document Requests, a lightweight Content Snare alternative for finance teams of 2 to 50 people, from a complete blueprint (build test pending) with data model, business rules, seed data, phased build prompts and acceptance checks. Use when someone wants to build their own Document Requests, replace Content Snare with an internal tool, or says: 'Every year-end we chase clients for the same twelve documents, one email at a time.'"
license: MIT
metadata:
  author: Personal Software Factory
  source: https://personalsoftwarefactory.com/blueprints/document-requests
  status: "Full spec; build test pending"
---

# Document Requests

> "Every year-end we chase clients for the same twelve documents, one email at a time."

A complete, build-ready blueprint for an internal document requests that a finance team of 2 to 50 people can run instead of paying per seat for Content Snare, document checklists sent by email, "did you get my attachment?". The full spec is in [references/spec.md](references/spec.md): the problem, what the paid product actually does (checked on the vendor's own pages), what v1 keeps and leaves out, roles, data model, business rules, screens, edge cases, seed data, a four-phase build plan with acceptance checks, and build notes.

This is a full spec that has not yet been build-tested end to end. Expect a few ambiguities; record each one as a spec gap (step 5).

## When to use

- The user wants to build a Document Requests (or replace Content Snare) with an AI coding agent.
- The user describes the problem above, or asks whether to build or buy this kind of tool.

Do not use it for a large enterprise rollout that needs the features listed under "What this blueprint deliberately leaves out" in section 2 of the spec; say so and recommend the paid product instead.

## How to build it

1. **Read the whole spec first**: [references/spec.md](references/spec.md). Treat its rules, data model and acceptance checks as the contract. Do not add features the spec leaves out unless the user asks.
2. **Pick the stack.** Use the user's existing project or stack if there is one. Otherwise use a small full-stack web app (for example Next.js with SQLite in development and Postgres in production). Keep the spec's configuration values (team time zone, currency and so on) as environment variables.
3. **Build one phase at a time**, using the prompts in section 13 of the spec:
   - Phase 1: Foundation, templates and requests
   - Phase 2: The client view
   - Phase 3: Review, reminders and completion
   - Phase 4: Download, retention and export
4. **Run that phase's acceptance checks before moving on.** Reset to the seed data in section 12 before each phase's checks. Run the checks in a browser (or with browser automation such as Playwright) and write automated tests for the business rules and worked examples. Fix every failure before starting the next phase.
5. **Record spec gaps.** Whenever you have to interpret or guess something the spec does not say, write it down in a `SPEC-GAPS.md` file in the project and tell the user at the end of each phase. Do not silently invent behaviour.
6. **Report honestly.** When done, list which checks passed and what was not tested. Do not claim production readiness: production sign-in, real email delivery, scheduled jobs and hosting need their own testing (see section 15 of the spec).

## Links

- Blueprint page, with a labelled drawing, build-or-buy notes and test results: https://personalsoftwarefactory.com/blueprints/document-requests
- All 37 blueprints: https://personalsoftwarefactory.com/blueprints
- Report a spec gap: https://github.com/samclaassen/internal-tool-blueprints/issues/new
