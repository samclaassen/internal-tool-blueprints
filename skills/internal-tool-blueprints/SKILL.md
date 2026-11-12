---
name: internal-tool-blueprints
description: "Choose and build the right internal tool for a small team instead of paying per seat for SaaS: CRM, help desk, approval workflow, expense reports, timesheets, hiring pipeline, bug tracker, OKRs and 30 more, each from a build-tested blueprint. Use when someone asks whether to build or buy a business tool, wants an internal tool built with AI, or names a SaaS product (HubSpot, Zendesk, Jira, Expensify, BambooHR, Monday.com...) they want to replace."
license: MIT
metadata:
  author: Personal Software Factory
  source: https://personalsoftwarefactory.com/blueprints
---

# Internal tool blueprints

37 free blueprints for the internal tools a small team can build with an AI coding agent instead of renting them per seat. Each is a single Markdown spec with a data model, business rules, seed data, a four-phase build plan and acceptance checks. Most are build-tested: an AI builder followed the prompts and every check was run in a real browser.

## How to use

1. Match the user's need to a row in the table below (by the tool, the product it replaces, or the problem they describe). If nothing matches, say so; do not stretch a blueprint to fit.
2. If the matching skill is installed (for example `simple-crm`), use it. Otherwise install it with `npx skills add samclaassen/internal-tool-blueprints --skill <name>`, or fetch the spec directly from `https://raw.githubusercontent.com/samclaassen/internal-tool-blueprints/main/blueprints/<name>.md`.
3. Before building, check the build-or-buy fit: team size inside the blueprint's range, and none of the spec's "deliberately leaves out" features are must-haves. The guide at https://personalsoftwarefactory.com/guides/build-vs-buy-saas covers the trade-off; current SaaS prices are at https://personalsoftwarefactory.com/guides/saas-pricing-for-small-teams.
4. Build phase by phase, run each phase's acceptance checks, and record spec gaps, as the individual skill describes.

## Blueprints

| Skill | Tool | Replaces | Team size | Status |
|---|---|---|---|---|
| `contract-tracker` | Contract Tracker | ContractSafe | 5–200 people | Spec |
| `document-requests` | Document Requests | Content Snare | 2–50 people | Spec |
| `expense-reports` | Expense Reports | Expensify | 5–100 people | Build-tested |
| `invoice-reminders` | Invoice Reminders | Chaser | 2–50 people | Build-tested |
| `saas-spend-tracker` | SaaS Spend Tracker | Zylo | 10–200 people | Build-tested |
| `timesheets` | Timesheets | Harvest | 5–100 people | Build-tested |
| `content-calendar` | Content Calendar | CoSchedule | 2–15 people | Build-tested |
| `link-shortener` | Link Shortener | Bitly | 2–50 people | Build-tested |
| `testimonial-wall` | Testimonial Wall | Senja | 1–10 people | Build-tested |
| `approval-workflow` | Approval Workflow | Kissflow | 5–100 people | Build-tested |
| `async-standups` | Async Standups | Geekbot | 4–40 people | Build-tested |
| `capacity-planner` | Capacity Planner | Float | 5–40 people | Build-tested |
| `client-onboarding-tracker` | Client Onboarding Tracker | Rocketlane | 2–25 people | Build-tested |
| `equipment-tracker` | Equipment Tracker | Asset Panda | 10–200 people | Build-tested |
| `inspections` | Inspections | SafetyCulture | 5–200 people | Spec |
| `knowledge-base` | Internal Knowledge Base | Guru | 5–80 people | Build-tested |
| `inventory-tracker` | Inventory Tracker | Sortly | 5–50 people | Build-tested |
| `maintenance-requests` | Maintenance Requests | MaintainX | 5–200 people | Spec |
| `project-status-board` | Project Status Board | Monday.com | 5–50 people | Build-tested |
| `room-booking` | Room Booking | Skedda | 10–200 people | Spec |
| `training-manual` | Training Manual | Trainual | 5–200 people | Spec |
| `visitor-sign-in` | Visitor Sign-In | Envoy | 10–200 people | Spec |
| `employee-onboarding` | Employee Onboarding | BambooHR | 5–150 people | Build-tested |
| `hiring-pipeline` | Hiring Pipeline | Greenhouse | 5–75 people | Build-tested |
| `okr-tracker` | OKR Tracker | Perdoo | 5–100 people | Build-tested |
| `performance-reviews` | Performance Reviews | Lattice | 10–200 people | Build-tested |
| `shift-scheduling` | Shift Scheduling | When I Work | 10–100 staff | Build-tested |
| `pto-tracker` | Time-Off Tracker | Timetastic | 5–100 people | Build-tested |
| `commission-calculator` | Commission Calculator | QuotaPath | 3–30 reps | Build-tested |
| `quote-builder` | Quote Builder | PandaDoc | 1–20 people | Build-tested |
| `simple-crm` | Simple CRM | HubSpot | 1–15 people | Build-tested |
| `bug-tracker` | Bug Tracker | Jira | 5–30 people | Build-tested |
| `feedback-inbox` | Customer Feedback Inbox | Productboard | 3–50 people | Build-tested |
| `feature-requests` | Feature Requests | Canny | 2–50 people | Spec |
| `help-desk` | Help Desk | Zendesk | 2–25 people | Build-tested |
| `nps-surveys` | NPS Surveys | Delighted | 2–100 people | Spec |
| `status-page` | Status Page | Statuspage | 2–50 people | Build-tested |

Pages with drawings, demos and test results: https://personalsoftwarefactory.com/blueprints
