# Internal tool blueprints for AI app builders

Specs for the internal tools a small team can build with an AI app builder (Claude, ChatGPT, Cursor, Lovable, Replit or Type) instead of paying per seat for SaaS. Each blueprint is one Markdown file: the problem, what the paid product does and what this leaves out, roles, data model, business rules with worked examples, screens, edge cases, seed data, and a build plan split into phases, each with a prompt and acceptance checks.

These are mirrored from **[Personal Software Factory](https://personalsoftwarefactory.com)**, where each blueprint also has a labelled drawing, a live demo, build-or-buy notes and, once tested, the results of an independent build test. How testing works: https://personalsoftwarefactory.com/how-we-test

## How to use a blueprint

1. Open the blueprint's `.md` file and paste the whole thing into your AI builder as context.
2. Send the Phase 1 prompt from its Build plan section. Build only that phase.
3. Run the phase's acceptance checks by clicking through the app. Fix anything that fails.
4. Repeat for each phase. Read what the builder says it had to interpret; that is where specs have gaps.

## Blueprints

| Blueprint | Replaces | Team size | Status | Spec | Page |
|---|---|---|---|---|---|
| **Simple CRM**: We pay for a giant CRM and use about ten percent of it. | HubSpot | 1–15 people | Full spec with working demo; independent build test pending | [simple-crm.md](blueprints/simple-crm.md) | [page](https://personalsoftwarefactory.com/blueprints/simple-crm) |
| **Commission Calculator**: Every month-end we spend two days arguing over the commission spreadsheet. | QuotaPath | 3–30 reps | Full spec with working demo; independent build test pending | [commission-calculator.md](blueprints/commission-calculator.md) | [page](https://personalsoftwarefactory.com/blueprints/commission-calculator) |
| **Quote Builder**: Writing a custom quote takes an hour, every single time. | PandaDoc | 1–20 people | Full spec with working demo; independent build test pending | [quote-builder.md](blueprints/quote-builder.md) | [page](https://personalsoftwarefactory.com/blueprints/quote-builder) |
| **Content Calendar**: Our content plan lives in four different docs and nobody trusts any of them. | CoSchedule | 2–15 people | Full spec with working demo; independent build test pending | [content-calendar.md](blueprints/content-calendar.md) | [page](https://personalsoftwarefactory.com/blueprints/content-calendar) |
| **Testimonial Wall**: Our best customer quotes are buried in emails and call notes. | Senja | 1–10 people | Full spec with working demo; independent build test pending | [testimonial-wall.md](blueprints/testimonial-wall.md) | [page](https://personalsoftwarefactory.com/blueprints/testimonial-wall) |
| **Client Onboarding Tracker**: Client onboarding lives in one person's head, and things fall through the cracks. | Rocketlane | 2–25 people | Full spec with working demo; independent build test pending | [client-onboarding-tracker.md](blueprints/client-onboarding-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/client-onboarding-tracker) |
| **Approval Workflow**: Purchase requests get lost in Slack, and nobody knows who approved what. | Kissflow | 5–100 people | Build-tested 2026-10-12, 34/34 acceptance checks passed | [approval-workflow.md](blueprints/approval-workflow.md) | [page](https://personalsoftwarefactory.com/blueprints/approval-workflow) |
| **Project Status Board**: Every Monday I rebuild the same status report from scratch. | Monday.com | 5–50 people | Full spec with working demo; independent build test pending | [project-status-board.md](blueprints/project-status-board.md) | [page](https://personalsoftwarefactory.com/blueprints/project-status-board) |
| **Equipment Tracker**: Nobody knows who has which laptop, or when its warranty ends. | Asset Panda | 10–200 people | Full spec; build test pending | [equipment-tracker.md](blueprints/equipment-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/equipment-tracker) |
| **SaaS Spend Tracker**: Nobody knows how many software tools we're actually paying for. | Zylo | 10–200 people | Full spec with working demo; independent build test pending | [saas-spend-tracker.md](blueprints/saas-spend-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/saas-spend-tracker) |
| **Expense Reports**: Receipts pile up in email and reimbursements take weeks. | Expensify | 5–100 people | Full spec; build test pending | [expense-reports.md](blueprints/expense-reports.md) | [page](https://personalsoftwarefactory.com/blueprints/expense-reports) |
| **Time-Off Tracker**: I can never tell who's out next week until they're already gone. | Timetastic | 5–100 people | Full spec with working demo; independent build test pending | [pto-tracker.md](blueprints/pto-tracker.md) | [page](https://personalsoftwarefactory.com/blueprints/pto-tracker) |
| **Hiring Pipeline**: We're hiring for three roles and tracking candidates in a spreadsheet. | Greenhouse | 5–75 people | Full spec with working demo; independent build test pending | [hiring-pipeline.md](blueprints/hiring-pipeline.md) | [page](https://personalsoftwarefactory.com/blueprints/hiring-pipeline) |
| **Employee Onboarding**: Every new hire's first week depends on who remembers what. | BambooHR | 5–150 people | Full spec; build test pending | [employee-onboarding.md](blueprints/employee-onboarding.md) | [page](https://personalsoftwarefactory.com/blueprints/employee-onboarding) |
| **Customer Feedback Inbox**: Customer feedback is scattered across email, calls and support tickets. | Productboard | 3–50 people | Full spec with working demo; independent build test pending | [feedback-inbox.md](blueprints/feedback-inbox.md) | [page](https://personalsoftwarefactory.com/blueprints/feedback-inbox) |
| **Help Desk**: Support requests land in a shared inbox and nobody knows who is answering what. | Zendesk | 2–25 people | Full spec; build test pending | [help-desk.md](blueprints/help-desk.md) | [page](https://personalsoftwarefactory.com/blueprints/help-desk) |

The full catalog, with live demos and test results, is at https://personalsoftwarefactory.com/blueprints.

## Guides

- [How to build an internal tool with AI that your team can rely on](https://personalsoftwarefactory.com/guides/how-to-build-internal-tools-with-ai)
- [Build or buy: when to replace a SaaS tool with one you build with AI](https://personalsoftwarefactory.com/guides/build-vs-buy-saas)
- [A spec template for AI app builders](https://personalsoftwarefactory.com/guides/ai-app-spec-template)
- [What 18 business SaaS tools cost a 10-person team](https://personalsoftwarefactory.com/guides/saas-pricing-for-small-teams)

## Terms

The blueprints are free to copy and adapt for your own team. If you share or publish them, please link to https://personalsoftwarefactory.com. Product names are trademarks of their owners and are used only to describe what each blueprint is an alternative to. Personal Software Factory is independent and not affiliated with any vendor named here.

Found a gap in a spec? Open an issue, or use the form at https://personalsoftwarefactory.com/how-we-test.
