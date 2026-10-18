# Internal tool blueprints for AI app builders

Free, build-tested specs for the internal tools a small team can build with an AI app builder (Claude, ChatGPT, Cursor, Claude Code, Lovable, Replit or Type) instead of paying per seat for SaaS: a CRM instead of HubSpot, an approval workflow instead of Kissflow, a help desk instead of Zendesk, and more.

- **1 blueprints**, each one Markdown file you can paste into an AI builder.
- **1 build-tested**: an AI builder followed the phase prompts and every acceptance check was run in a real browser. 24 acceptance checks passed in the final runs, the builds include 64 automated tests, and the builds exposed **21 gaps in the specs**, all fixed here.
- Every price and feature claim about the paid product was checked on the vendor's own pages, with the month checked.

Mirrored from **[Personal Software Factory](https://personalsoftwarefactory.com)** (personalsoftwarefactory.com), where each blueprint also has a labelled drawing and build-or-buy notes, many have a live demo, and tested ones show their build-test results and what was not tested.

## Quick start

1. Pick a blueprint below and open its `.md` file. Paste the whole file into your AI builder as context.
2. Send the Phase 1 prompt from its Build plan section. Build only that phase.
3. Run the phase's acceptance checks by clicking through the app. Fix anything that fails.
4. Repeat for each of the four phases. When the builder says it had to interpret something, that is a gap in the spec: fix it in your copy, and tell us.

## What "build-tested" means

The same AI builder (Claude, working in Type) wrote each test build and its test scripts, following the spec one phase at a time; every acceptance check was then run in Chromium on fresh seed data. It is evidence that the spec is complete enough to build from, not an independent human audit, a comparison of AI builders, or a production-readiness guarantee. None of the test builds tested production sign-in, real email delivery or hosting; each blueprint's build notes list what was not tested. Method: https://personalsoftwarefactory.com/how-we-test

## Blueprints

| Blueprint | Replaces | Team | Team size | Status | Spec | Page |
|---|---|---|---|---|---|---|
| **Help Desk**: Support requests land in a shared inbox and nobody knows who is answering what. | Zendesk | Support | 2–25 people | Build-tested 2026-10-15, 24/24 acceptance checks passed | [help-desk.md](blueprints/help-desk.md) | [page](https://personalsoftwarefactory.com/blueprints/help-desk) |

The full catalog, with live demos and test results, is at https://personalsoftwarefactory.com/blueprints.

## Field reports

- [Is an AI-built internal tool ready for production? What our 13 build tests didn't test](https://personalsoftwarefactory.com/guides/ai-built-tools-production-readiness)
- [Field report: building a Zendesk replacement with AI, 24 checks and 21 spec gaps](https://personalsoftwarefactory.com/guides/zendesk-replacement-build-test)

Short videos of the build tests, with what passed and what broke, are on YouTube at [@personalsoftwarefactory](https://www.youtube.com/@personalsoftwarefactory).

## Guides

- [Which AI app builder can run your internal tool? Lovable, Bolt, Replit, v0, Claude Code and Cursor compared](https://personalsoftwarefactory.com/guides/ai-app-builders-for-internal-tools)
- [A spec template for AI app builders](https://personalsoftwarefactory.com/guides/ai-app-spec-template)
- [Build or buy: when to replace a SaaS tool with one you build with AI](https://personalsoftwarefactory.com/guides/build-vs-buy-saas)
- [How to build an internal tool with AI that your team can rely on](https://personalsoftwarefactory.com/guides/how-to-build-internal-tools-with-ai)
- [What 36 business SaaS tools cost a 10-person team (October 2026)](https://personalsoftwarefactory.com/guides/saas-pricing-for-small-teams)
- [The hidden limits in SaaS pricing: caps, minimums and metered features in 36 tools](https://personalsoftwarefactory.com/guides/saas-pricing-limits)
- [What AI app builders get wrong: 126 spec gaps from 13 build tests](https://personalsoftwarefactory.com/guides/what-ai-builders-get-wrong)
- [What is a personal software factory?](https://personalsoftwarefactory.com/guides/what-is-a-personal-software-factory)

## Contributing

Found a gap in a spec, built one of these with a different AI builder, or want a blueprint for a tool that isn't here? [Open an issue](https://github.com/samclaassen/internal-tool-blueprints/issues/new). Fixes are made on the site first and mirrored here, and credited in the blueprint's build notes.

## Terms

The blueprints are free to copy and adapt for your own team. If you share or publish them, please link to https://personalsoftwarefactory.com. Product names are trademarks of their owners and are used only to describe what each blueprint is an alternative to. Personal Software Factory is independent and not affiliated with any vendor named here. No affiliate links.
