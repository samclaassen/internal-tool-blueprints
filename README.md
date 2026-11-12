# Internal tool blueprints for AI app builders

Free, build-tested specs for the internal tools a small team can build with an AI app builder (Claude, ChatGPT, Cursor, Claude Code, Lovable, Replit or Type) instead of paying per seat for SaaS: a CRM instead of HubSpot, an approval workflow instead of Kissflow, a help desk instead of Zendesk, and more.

- **37 blueprints**, each one Markdown file you can paste into an AI builder.
- **28 build-tested**: an AI builder followed the phase prompts and every acceptance check was run in a real browser. 701 acceptance checks passed in the final runs, the builds include 2,814 automated tests, and the builds exposed **996 gaps in the specs**, all fixed here.
- Every price and feature claim about the paid product was checked on the vendor's own pages, with the month checked.

Mirrored from **[Personal Software Factory](https://personalsoftwarefactory.com)** (personalsoftwarefactory.com), where each blueprint also has a labelled drawing and build-or-buy notes, many have a live demo, and tested ones show their build-test results and what was not tested.

## Quick start

1. Pick a blueprint below and open its `.md` file. Paste the whole file into your AI builder as context.
2. Send the Phase 1 prompt from its Build plan section. Build only that phase.
3. Run the phase's acceptance checks by clicking through the app. Fix anything that fails.
4. Repeat for each of the four phases. When the builder says it had to interpret something, that is a gap in the spec: fix it in your copy, and tell us.

## Use them as agent skills

Every blueprint is also packaged as an [agent skill](https://agentskills.io/) for Claude Code, Codex, Cursor, Gemini CLI, Copilot and other coding agents, listed on [skills.sh](https://skills.sh/samclaassen/internal-tool-blueprints). Each skill bundles the full spec and tells the agent to build it one phase at a time, run the acceptance checks, and log any spec gaps.

```bash
npx skills add samclaassen/internal-tool-blueprints                      # pick from the list
npx skills add samclaassen/internal-tool-blueprints --skill simple-crm   # one blueprint
```

Then ask your agent something like "build us a simple CRM" or "replace our Zendesk with something we own". The `internal-tool-blueprints` skill helps the agent pick the right blueprint. Skills live in [`skills/`](skills) and are generated from [`blueprints/`](blueprints) by `scripts/generate-skills.py`.

## What "build-tested" means

The same AI builder (Claude, working in Type) wrote each test build and its test scripts, following the spec one phase at a time; every acceptance check was then run in Chromium on fresh seed data. It is evidence that the spec is complete enough to build from, not an independent human audit, a comparison of AI builders, or a production-readiness guarantee. None of the test builds tested production sign-in, real email delivery or hosting; each blueprint's build notes list what was not tested. Method: https://personalsoftwarefactory.com/how-we-test

## Blueprints

| Blueprint | Replaces | Team | Team size | Status | Spec | Page |
|---|---|---|---|---|---|---|
| **Simple CRM**: We pay for a giant CRM and use about ten percent of it. | HubSpot | Sales | 1–15 people | Build-tested 2026-10-15, 27/27 acceptance checks passed | [simple-crm.md](blueprints/simple-crm.md) | [page](https://personalsoftwarefactory.com/blueprints/simple-crm) |
| **Commission Calculator**: Every month-end we spend two days arguing over the commission spreadsheet. | QuotaPath | Sales | 3–30 reps | Build-tested 2026-10-15, 24/24 acceptance checks passed | [commission-calculator.md](blueprints/commission-calculator.md) | [page](https://personalsoftwarefactory.com/blueprints/commission-calculator) |
| **Quote Builder**: Writing a custom quote takes an hour, every single time. | PandaDoc | Sales | 1–20 people | Build-tested 2026-10-15, 29/29 acceptance checks passed | [quote-builder.md](blueprints/quote-builder.md) | [page](https://personalsoftwarefactory.com/blueprints/quote-builder) |
| **Content Calendar**: Our content plan lives in four different docs and nobody trusts any of them. | CoSchedule | Marketing | 2–15 people | Build-tested 2026-10-15, 27/27 acceptance checks passed | [content-calendar.md](blueprints/content-calendar.md) | [page](https://personalsoftwarefactory.com/blueprints/content-calendar) |
| **Testimonial Wall**: Our best customer quotes are buried in emails and call notes. | Senja | Marketing | 1–10 people | Build-tested 2026-10-17, 32/32 acceptance checks passed | [testimonial-wall.md](blueprints/testimonial-wall.md) | [page](https://personalsoftwarefactory.com/blueprints/testimonial-wall) |
| **Link Shortener**: Our UTM tags are a mess and nobody knows which links still work. | Bitly | Marketing | 2–50 people | Build-tested 2026-11-04, 19/19 acceptance checks passed | [link-shortener.md](blueprints/link-shortener.md) | [page](https://personalsoftwarefactory.com/blueprints/link-shortener) |
| **Client Onboarding Tracker**: Client onboarding lives in one person's head, and things fall through the cracks. | Rocketlane | Ops | 2–25 people | Build-tested 2026-10-29, 28/28 acceptance checks passed | [client-onboarding-tracker.md](blueprints/client-onboarding-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/client-onboarding-tracker) |
| **Approval Workflow**: Purchase requests get lost in Slack, and nobody knows who approved what. | Kissflow | Ops | 5–100 people | Build-tested 2026-10-12, 20/20 acceptance checks passed | [approval-workflow.md](blueprints/approval-workflow.md) | [page](https://personalsoftwarefactory.com/blueprints/approval-workflow) |
| **Project Status Board**: Every Monday I rebuild the same status report from scratch. | Monday.com | Ops | 5–50 people | Build-tested 2026-10-16, 28/28 acceptance checks passed | [project-status-board.md](blueprints/project-status-board.md) | [page](https://personalsoftwarefactory.com/blueprints/project-status-board) |
| **Equipment Tracker**: Nobody knows who has which laptop, or when its warranty ends. | Asset Panda | Ops | 10–200 people | Build-tested 2026-11-10, 21/21 acceptance checks passed | [equipment-tracker.md](blueprints/equipment-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/equipment-tracker) |
| **Inventory Tracker**: We find out we're out of something when someone needs it. | Sortly | Ops | 5–50 people | Build-tested 2026-11-05, 21/21 acceptance checks passed | [inventory-tracker.md](blueprints/inventory-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/inventory-tracker) |
| **Visitor Sign-In**: Visitors sign a paper book at reception, and nobody knows who's in the building. | Envoy | Ops | 10–200 people | Full spec; build test pending | [visitor-sign-in.md](blueprints/visitor-sign-in.md) | [page](https://personalsoftwarefactory.com/blueprints/visitor-sign-in) |
| **Room Booking**: Two meetings turn up for the same room, and the big room sits empty because someone stopped coming. | Skedda | Ops | 10–200 people | Full spec; build test pending | [room-booking.md](blueprints/room-booking.md) | [page](https://personalsoftwarefactory.com/blueprints/room-booking) |
| **Training Manual**: Every new hire learns the job from whoever happens to be on shift. | Trainual | Ops | 5–200 people | Full spec; build test pending | [training-manual.md](blueprints/training-manual.md) | [page](https://personalsoftwarefactory.com/blueprints/training-manual) |
| **Maintenance Requests**: The walk-in cooler was warm for two days because the request was a text to someone on holiday. | MaintainX | Ops | 5–200 people | Full spec; build test pending | [maintenance-requests.md](blueprints/maintenance-requests.md) | [page](https://personalsoftwarefactory.com/blueprints/maintenance-requests) |
| **Inspections**: The audit says the fire exit was blocked again, and nobody fixed it after last month's audit either. | SafetyCulture | Ops | 5–200 people | Full spec; build test pending | [inspections.md](blueprints/inspections.md) | [page](https://personalsoftwarefactory.com/blueprints/inspections) |
| **Async Standups**: Our daily standup takes 30 minutes, and half the team is in another time zone. | Geekbot | Ops | 4–40 people | Build-tested 2026-11-11, 32/32 acceptance checks passed | [async-standups.md](blueprints/async-standups.md) | [page](https://personalsoftwarefactory.com/blueprints/async-standups) |
| **Capacity Planner**: We say yes to new projects without knowing who actually has time. | Float | Ops | 5–40 people | Build-tested 2026-11-12, 33/33 acceptance checks passed | [capacity-planner.md](blueprints/capacity-planner.md) | [page](https://personalsoftwarefactory.com/blueprints/capacity-planner) |
| **Internal Knowledge Base**: The same questions get asked in Slack every week, and the answers keep changing. | Guru | Ops | 5–80 people | Build-tested 2026-11-01, 31/31 acceptance checks passed | [knowledge-base.md](blueprints/knowledge-base.md) | [page](https://personalsoftwarefactory.com/blueprints/knowledge-base) |
| **SaaS Spend Tracker**: Nobody knows how many software tools we're actually paying for. | Zylo | Finance | 10–200 people | Build-tested 2026-10-16, 31/31 acceptance checks passed | [saas-spend-tracker.md](blueprints/saas-spend-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/saas-spend-tracker) |
| **Expense Reports**: Receipts pile up in email and reimbursements take weeks. | Expensify | Finance | 5–100 people | Build-tested 2026-10-15, 24/24 acceptance checks passed | [expense-reports.md](blueprints/expense-reports.md) | [page](https://personalsoftwarefactory.com/blueprints/expense-reports) |
| **Timesheets**: Every month-end I chase people for their hours before I can invoice. | Harvest | Finance | 5–100 people | Build-tested 2026-10-30, 21/21 acceptance checks passed | [timesheets.md](blueprints/timesheets.md) | [page](https://personalsoftwarefactory.com/blueprints/timesheets) |
| **Invoice Reminders**: Every Friday I go through the overdue list and write the same polite emails by hand. | Chaser | Finance | 2–50 people | Build-tested 2026-11-06, 18/18 acceptance checks passed | [invoice-reminders.md](blueprints/invoice-reminders.md) | [page](https://personalsoftwarefactory.com/blueprints/invoice-reminders) |
| **Document Requests**: Every year-end we chase clients for the same twelve documents, one email at a time. | Content Snare | Finance | 2–50 people | Full spec; build test pending | [document-requests.md](blueprints/document-requests.md) | [page](https://personalsoftwarefactory.com/blueprints/document-requests) |
| **Contract Tracker**: We found out the contract had renewed for another year when the invoice arrived. | ContractSafe | Finance | 5–200 people | Full spec; build test pending | [contract-tracker.md](blueprints/contract-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/contract-tracker) |
| **Time-Off Tracker**: I can never tell who's out next week until they're already gone. | Timetastic | People | 5–100 people | Build-tested 2026-10-15, 32/32 acceptance checks passed | [pto-tracker.md](blueprints/pto-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/pto-tracker) |
| **Hiring Pipeline**: We're hiring for three roles and tracking candidates in a spreadsheet. | Greenhouse | People | 5–75 people | Build-tested 2026-10-15, 29/29 acceptance checks passed | [hiring-pipeline.md](blueprints/hiring-pipeline.md) | [page](https://personalsoftwarefactory.com/blueprints/hiring-pipeline) |
| **Employee Onboarding**: Every new hire's first week depends on who remembers what. | BambooHR | People | 5–150 people | Build-tested 2026-11-02, 20/20 acceptance checks passed | [employee-onboarding.md](blueprints/employee-onboarding.md) | [page](https://personalsoftwarefactory.com/blueprints/employee-onboarding) |
| **Shift Scheduling**: The schedule lives in a spreadsheet and every change happens by text. | When I Work | People | 10–100 staff | Build-tested 2026-11-07, 20/20 acceptance checks passed | [shift-scheduling.md](blueprints/shift-scheduling.md) | [page](https://personalsoftwarefactory.com/blueprints/shift-scheduling) |
| **OKR Tracker**: We set OKRs in January and looked at them again in March. | Perdoo | People | 5–100 people | Build-tested 2026-11-08, 19/19 acceptance checks passed | [okr-tracker.md](blueprints/okr-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/okr-tracker) |
| **Performance Reviews**: Reviews live in Google Docs, half of them are late, and nobody can find last year's. | Lattice | People | 10–200 people | Build-tested 2026-11-09, 17/17 acceptance checks passed | [performance-reviews.md](blueprints/performance-reviews.md) | [page](https://personalsoftwarefactory.com/blueprints/performance-reviews) |
| **Customer Feedback Inbox**: Customer feedback is scattered across email, calls and support tickets. | Productboard | Support | 3–50 people | Build-tested 2026-10-28, 25/25 acceptance checks passed | [feedback-inbox.md](blueprints/feedback-inbox.md) | [page](https://personalsoftwarefactory.com/blueprints/feedback-inbox) |
| **Help Desk**: Support requests land in a shared inbox and nobody knows who is answering what. | Zendesk | Support | 2–25 people | Build-tested 2026-10-15, 24/24 acceptance checks passed | [help-desk.md](blueprints/help-desk.md) | [page](https://personalsoftwarefactory.com/blueprints/help-desk) |
| **Status Page**: When something breaks, half our support queue is people asking if it's down. | Statuspage | Support | 2–50 people | Build-tested 2026-11-03, 18/18 acceptance checks passed | [status-page.md](blueprints/status-page.md) | [page](https://personalsoftwarefactory.com/blueprints/status-page) |
| **NPS Surveys**: We send an NPS survey once a year from a form tool, and nobody reads the comments. | Delighted | Support | 2–100 people | Full spec; build test pending | [nps-surveys.md](blueprints/nps-surveys.md) | [page](https://personalsoftwarefactory.com/blueprints/nps-surveys) |
| **Feature Requests**: Feature requests arrive in emails, calls and chats, and we can't say what customers want most. | Canny | Support | 2–50 people | Full spec; build test pending | [feature-requests.md](blueprints/feature-requests.md) | [page](https://personalsoftwarefactory.com/blueprints/feature-requests) |
| **Bug Tracker**: Bugs get reported in five places, and nobody knows which ones are fixed. | Jira | Support | 5–30 people | Build-tested 2026-10-17, 31/31 acceptance checks passed | [bug-tracker.md](blueprints/bug-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/bug-tracker) |

The full catalog, with live demos and test results, is at https://personalsoftwarefactory.com/blueprints.

## Field reports

- [Is an AI-built internal tool ready for production? What our 26 build tests didn't test](https://personalsoftwarefactory.com/guides/ai-built-tools-production-readiness)
- [Field report: building a Zendesk replacement with AI, 24 checks and 21 spec gaps](https://personalsoftwarefactory.com/guides/zendesk-replacement-build-test)
- [Field report: building a Greenhouse replacement with AI, 29 checks and 18 spec gaps](https://personalsoftwarefactory.com/guides/greenhouse-replacement-build-test)
- [Field report: building a Jira replacement with AI, 31 checks and 5 spec gaps](https://personalsoftwarefactory.com/guides/jira-replacement-build-test)
- [Field report: building a Senja replacement with AI, 32 checks and 11 spec gaps](https://personalsoftwarefactory.com/guides/senja-replacement-build-test)
- [Field report: building a Zylo replacement with AI, 31 checks and 6 spec gaps](https://personalsoftwarefactory.com/guides/zylo-replacement-build-test)
- [Field report: building a QuotaPath replacement with AI, 24 checks and 10 spec gaps](https://personalsoftwarefactory.com/guides/quotapath-replacement-build-test)
- [Field report: building a Monday.com replacement with AI, 28 checks and 6 spec gaps](https://personalsoftwarefactory.com/guides/monday-replacement-build-test)
- [Field report: building a Kissflow replacement with AI, 20 checks and 9 spec gaps](https://personalsoftwarefactory.com/guides/kissflow-replacement-build-test)
- [Field report: building a Timetastic replacement with AI, 32 checks and 7 spec gaps](https://personalsoftwarefactory.com/guides/timetastic-replacement-build-test)
- [Field report: building an Expensify replacement with AI, 24 checks and 9 spec gaps](https://personalsoftwarefactory.com/guides/expensify-replacement-build-test)
- [Field report: building a CoSchedule replacement with AI, 27 checks and 8 spec gaps](https://personalsoftwarefactory.com/guides/coschedule-replacement-build-test)
- [Field report: building a PandaDoc replacement with AI, 29 checks and 8 spec gaps](https://personalsoftwarefactory.com/guides/pandadoc-replacement-build-test)
- [Field report: building a HubSpot replacement with AI, 27 checks and 8 spec gaps](https://personalsoftwarefactory.com/guides/hubspot-replacement-build-test)
- [Field report: building a Productboard replacement with AI, 25 checks and 20 spec gaps](https://personalsoftwarefactory.com/guides/productboard-replacement-build-test)
- [Field report: building a Rocketlane replacement with AI, 28 checks and 18 spec gaps](https://personalsoftwarefactory.com/guides/rocketlane-replacement-build-test)
- [Field report: building a Harvest replacement with AI, 21 checks and 21 spec gaps](https://personalsoftwarefactory.com/guides/harvest-replacement-build-test)
- [Field report: building a Guru replacement with AI, 31 checks and 30 spec gaps](https://personalsoftwarefactory.com/guides/guru-replacement-build-test)
- [Field report: building a BambooHR replacement with AI, 20 checks and 44 spec gaps](https://personalsoftwarefactory.com/guides/bamboohr-replacement-build-test)
- [Field report: building a Statuspage replacement with AI, 18 checks and 58 spec gaps](https://personalsoftwarefactory.com/guides/statuspage-replacement-build-test)
- [Field report: building a Bitly replacement with AI, 19 checks and 69 spec gaps](https://personalsoftwarefactory.com/guides/bitly-replacement-build-test)
- [Field report: building a Sortly replacement with AI, 21 checks and 63 spec gaps](https://personalsoftwarefactory.com/guides/sortly-replacement-build-test)
- [Field report: building a Chaser replacement with AI, 18 checks and 83 spec gaps](https://personalsoftwarefactory.com/blueprints/invoice-reminders#field-report)
- [Field report: building a When I Work replacement with AI, 20 checks and 84 spec gaps](https://personalsoftwarefactory.com/blueprints/shift-scheduling#field-report)
- [Field report: building a Perdoo replacement with AI, 19 checks and 72 spec gaps](https://personalsoftwarefactory.com/blueprints/okr-tracker#field-report)
- [Field report: building a Lattice replacement with AI, 17 checks and 64 spec gaps](https://personalsoftwarefactory.com/blueprints/performance-reviews#field-report)
- [Field report: building an Asset Panda replacement with AI, 21 checks and 82 spec gaps](https://personalsoftwarefactory.com/blueprints/equipment-tracker#field-report)
- [Field report: building a Geekbot replacement with AI, 32 checks and 73 spec gaps](https://personalsoftwarefactory.com/blueprints/async-standups#field-report)
- [Field report: building a Float replacement with AI, 33 checks and 89 spec gaps](https://personalsoftwarefactory.com/blueprints/capacity-planner#field-report)

Short videos of the build tests, with what passed and what broke, are on YouTube at [@personalsoftwarefactory](https://www.youtube.com/@personalsoftwarefactory).

## Guides

- [Which AI app builder can run your internal tool? Lovable, Bolt, Replit, v0, Claude Code and Cursor compared](https://personalsoftwarefactory.com/guides/ai-app-builders-for-internal-tools)
- [A spec template for AI app builders](https://personalsoftwarefactory.com/guides/ai-app-spec-template)
- [Build or buy: when to replace a SaaS tool with one you build with AI](https://personalsoftwarefactory.com/guides/build-vs-buy-saas)
- [How to build an internal tool with AI that your team can rely on](https://personalsoftwarefactory.com/guides/how-to-build-internal-tools-with-ai)
- [What 36 business SaaS tools cost a 10-person team (October 2026)](https://personalsoftwarefactory.com/guides/saas-pricing-for-small-teams)
- [The hidden limits in SaaS pricing: caps, minimums and metered features in 36 tools](https://personalsoftwarefactory.com/guides/saas-pricing-limits)
- [What AI app builders get wrong: 834 spec gaps from 26 build tests](https://personalsoftwarefactory.com/guides/what-ai-builders-get-wrong)
- [What is a personal software factory?](https://personalsoftwarefactory.com/guides/what-is-a-personal-software-factory)

## Contributing

Found a gap in a spec, built one of these with a different AI builder, or want a blueprint for a tool that isn't here? [Open an issue](https://github.com/samclaassen/internal-tool-blueprints/issues/new). Fixes are made on the site first and mirrored here, and credited in the blueprint's build notes.

## Terms

The blueprints are released under the [MIT License](LICENSE): free to copy, adapt and reuse, including commercially. If you share or publish them, a link to https://personalsoftwarefactory.com is appreciated. Product names are trademarks of their owners and are used only to describe what each blueprint is an alternative to. Personal Software Factory is independent and not affiliated with any vendor named here. No affiliate links.
