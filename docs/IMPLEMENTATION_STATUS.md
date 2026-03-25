# WrenchIQ.ai — Master Implementation Status

**Owner:** Predii, Inc.
**Last Updated:** March 2026
**Edition Scope:** WrenchIQ-AM (unless noted)

---

## How to Read This Document

Each feature is tracked against four implementation levels. Levels are cumulative — reaching a higher level implies all prior levels are complete.

| Level | Badge | Meaning |
|-------|-------|---------|
| UI Mock | `MOCK` | Screen or component built with static placeholder content only — no dynamic state, no data source |
| Synthetic Data | `SYNTH` | Hardcoded fake data inline in the component — demonstrates data shape but not realistic scenarios |
| Demo Data | `DEMO` | Connected to `src/data/demoData.js` — realistic named customers, vehicles, jobs, and shop scenarios |
| Live API | `LIVE` | Real third-party API integrated, authenticated, and returning production or sandbox data |

---

## Screens — WrenchIQ-AM

| Screen | File | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|--------|------|:------:|:-------:|:------:|:------:|-------|
| Dashboard — Command Center | DashboardScreen.jsx | ✅ | ✅ | ✅ | ❌ | All metrics from demoData.js |
| Social Inbox | SocialInboxScreen.jsx | ✅ | ✅ | ✅ | ❌ | Meta + TikTok DMs simulated; no webhook |
| Smart Scheduling | SmartSchedulingScreen.jsx | ✅ | ✅ | ✅ | ❌ | Bay calendar from demoData; no Google Calendar sync |
| DVI — Digital Inspection | DVIScreen.jsx | ✅ | ✅ | ✅ | ❌ | AI photo analysis UI present; no vision API call |
| Health Report | HealthReportScreen.jsx | ✅ | ✅ | ✅ | ❌ | Customer approval flow simulated; no Twilio send |
| Repair Orders | RepairOrderScreen.jsx | ✅ | ✅ | ✅ | ❌ | Kanban fully interactive with demo RO data |
| Intelligent RO Wizard | NewROWizard.jsx | ✅ | ✅ | ✅ | ❌ | Plate lookup + job search against demoData |
| Parts Intelligence | PartsIntelligenceScreen.jsx | ✅ | ✅ | ✅ | ❌ | 6-vendor price comparison from sampleData.js |
| Tech Mobile | TechMobileScreen.jsx | ✅ | ✅ | ✅ | ❌ | Phone mockup; no native app |
| Trust Engine | TrustEngineScreen.jsx | ✅ | ✅ | ✅ | ❌ | Trust scores and LTV from demoData |
| Customer Portal | CustomerPortalScreen.jsx | ✅ | ✅ | ✅ | ❌ | Magic link flow simulated; no real auth |
| Analytics | AnalyticsScreen.jsx | ✅ | ✅ | ✅ | ❌ | recharts graphs from demoData revenue figures |
| Multi-Location | MultiLocationScreen.jsx | ✅ | ✅ | ✅ | ❌ | 100-location network from demoData |
| Integrations | IntegrationsScreen.jsx | ✅ | ❌ | ❌ | ❌ | Shows 18 partner tiles; no live status |
| Settings | SettingsScreen.jsx | ✅ | ✅ | ✅ | ❌ | SHOP config from demoData; changes not persisted |
| AI Copilot | AICopilotScreen.jsx | ✅ | ✅ | ✅ | ❌ | PrediiAgent responses hardcoded; no Claude API call |

---

## Components / Shared Features

| Component | File | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|-----------|------|:------:|:-------:|:------:|:------:|-------|
| WrenchIQ Agent Panel | WrenchIQAgent.jsx | ✅ | ✅ | ✅ | ❌ | Context-aware per screen; 14 SCREEN_CONTEXT entries; responses hardcoded |
| Intelligent RO Wizard | NewROWizard.jsx | ✅ | ✅ | ✅ | ❌ | Plate → vehicle lookup, symptom → job search, Uber tracker, tech card |
| Persona Gateway / Role Routing | (not built) | ❌ | ❌ | ❌ | ❌ | Spec in wrenchiq-persona-ux-specification.md |

---

## User Flows — End-to-End Demo Status

| Flow | Personas | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|------|---------|:------:|:-------:|:------:|:------:|-------|
| Social Lead → First Visit | Advisor | ✅ | ✅ | ✅ | ❌ | Social Inbox → scheduling; no live DM |
| Check-In → Intelligent RO → Estimate Approval | Advisor, Customer | ✅ | ✅ | ✅ | ❌ | Full flow: plate lookup → jobs → Uber tracker → approve |
| DVI → Health Report → Customer Approval | Tech, Advisor, Customer | ✅ | ✅ | ✅ | ❌ | AI photo analysis simulated |
| Parts Price Comparison + Order | Advisor | ✅ | ✅ | ✅ | ❌ | 6 vendors shown; no live order |
| Corporate Group Ops Review | VP Ops, CFO | ✅ | ✅ | ✅ | ❌ | Multi-Location screen |
| Upset Customer Recovery | Advisor, Customer | ✅ | ✅ | ✅ | ❌ | Trust Engine → customer portal |
| AI Copilot Full Conversation | Owner, Advisor | ✅ | ✅ | ✅ | ❌ | AICopilot screen; no live Claude API |

---

## Integration API Status

| API | Category | Edition | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|-----|----------|---------|:------:|:-------:|:------:|:------:|-------|
| Twilio SMS/MMS | Communication | AM | ✅ | ✅ | ✅ | ❌ | Shown in Health Report + Customer Portal approval |
| Podium | Communication | AM | ✅ | ❌ | ❌ | ❌ | Tile only in Integrations screen |
| Google Business API | Communication | AM | ✅ | ✅ | ✅ | ❌ | Social Inbox shows Google DMs |
| Birdeye | Communication | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Meta Graph API | Social | AM | ✅ | ✅ | ✅ | ❌ | Instagram + Facebook DMs simulated |
| TikTok Business API | Social | AM | ✅ | ✅ | ✅ | ❌ | TikTok DMs simulated in Social Inbox |
| Stripe | Payments | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| DigniFi | Payments | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Sunbit | Payments | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| QuickBooks Online | Accounting | AM | ✅ | ❌ | ❌ | ❌ | Referenced in WrenchIQ Agent alerts |
| Xero | Accounting | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Gusto | Accounting | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Worldpac | Parts | AM | ✅ | ✅ | ✅ | ❌ | Parts price comparison screen |
| O'Reilly Auto Parts API | Parts | AM | ✅ | ✅ | ✅ | ❌ | Parts price comparison screen |
| PartsTech | Parts | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| NHTSA API | Vehicle Data | AM + OEM | ✅ | ✅ | ✅ | ❌ | TSB + recall data from tsbData.js |
| ALLDATA | Vehicle Data | AM + OEM | ✅ | ✅ | ✅ | ❌ | Repair procedures shown in DVI + RO |
| Mitchell ProDemand | Vehicle Data | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Lyft Business | Mobility | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Enterprise Rent-A-Car | Mobility | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Claude API (PrediiAgent) | AI | AM + OEM | ✅ | ✅ | ✅ | ❌ | AI Copilot screen uses hardcoded responses; no live API call |
| CDK Global | DMS | OEM only | ✅ | ❌ | ❌ | ❌ | OEM-only; not in AM build |
| Reynolds & Reynolds | DMS | OEM only | ✅ | ❌ | ❌ | ❌ | OEM-only |
| Dealertrack | DMS | OEM only | ✅ | ❌ | ❌ | ❌ | OEM-only |

---

## Persona Experience Status

| Persona | Routing / Login | Home View | Core Workflow | Mobile-Optimized | `DEMO` Level |
|---------|:--------------:|:---------:|:-------------:|:----------------:|:------------:|
| Service Advisor | ❌ (single mode) | ✅ Repair Orders | ✅ Intelligent RO full flow | ⚠️ Desktop only | ✅ |
| Technician | ❌ (single mode) | ✅ Tech Mobile screen | ✅ DVI entry | ✅ Phone mockup | ✅ |
| Car Owner | ❌ (single mode) | ✅ Customer Portal | ✅ Approval flow | ✅ Mobile layout | ✅ |
| Shop Owner | ❌ (single mode) | ✅ Dashboard | ✅ Analytics + AI Copilot | ⚠️ Desktop only | ✅ |
| VP Ops (100-loc) | ❌ (single mode) | ✅ Multi-Location screen | ✅ Network overview | ⚠️ Desktop only | ✅ |

---

## What's Next — Prioritized Implementation Gaps

| Priority | Item | From Level | To Level | Spec Reference |
|----------|------|-----------|----------|----------------|
| P1 | Persona routing / gateway | Not built | Demo Data | wrenchiq-persona-ux-specification.md |
| P1 | Claude API — PrediiAgent live calls | Demo Data | Live API | wrenchiq-product-specification.md §Module 6 |
| P2 | Twilio SMS — approval + notifications | Demo Data | Live API | wrenchiq-user-flows-specification.md |
| P2 | Meta Graph API — Instagram/Facebook live | Demo Data | Live API | wrenchiq-product-specification.md §Module 1 |
| P3 | TikTok Business API | Demo Data | Live API | wrenchiq-product-specification.md §Module 1 |
| P3 | Worldpac API live pricing | Demo Data | Live API | wrenchiq-product-specification.md §Module 9 |
| P3 | Stripe payments | Mock | Live API | wrenchiq-product-specification.md §Integrations |
| P4 | CDK Global DMS push (OEM) | Mock | Live API | wrenchiq-product-specification.md §Module 5 |
| P4 | Advisor mobile-responsive layout | Mock | Demo Data | wrenchiq-persona-ux-specification.md |

---

*WrenchIQ.ai — Predii Confidential*
