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
| Repair Orders | RepairOrderScreen.jsx | ✅ | ✅ | ✅ | ❌ | Kanban fully interactive with demo RO data; "Finalize & Checkout" button on Ready cards |
| Intelligent RO Wizard | NewROWizard.jsx | ✅ | ✅ | ✅ | ❌ | Plate lookup + job search against demoData |
| **AM 3C Story Writer** | **AM3CStoryWriterScreen.jsx** | ✅ | ✅ | ✅ | ✅ | **Customer-pay 3C narrative builder. NHTSA recall API live. Available standalone (`/am-3c.html`), in admin shell, and in Advisor persona.** |
| Parts Intelligence | PartsIntelligenceScreen.jsx | ✅ | ✅ | ✅ | ❌ | 6-vendor price comparison from sampleData.js |
| Tech Mobile | TechMobileScreen.jsx | ✅ | ✅ | ✅ | ❌ | Phone mockup; no native app |
| Trust Engine | TrustEngineScreen.jsx | ✅ | ✅ | ✅ | ❌ | Trust scores and LTV from demoData |
| Customer Portal | CustomerPortalScreen.jsx | ✅ | ✅ | ✅ | ❌ | Magic link flow simulated; no real auth |
| Analytics | AnalyticsScreen.jsx | ✅ | ✅ | ✅ | ❌ | recharts graphs from demoData revenue figures |
| Multi-Location | MultiLocationScreen.jsx | ✅ | ✅ | ✅ | ❌ | 100-location network from demoData |
| **Checkout & Payment** | **CheckoutModal.jsx** | ✅ | ✅ | ✅ | ❌ | **Square pay link + customer pay page mockup + cash flow; Xero GL post simulated. On Ready cards in RepairOrderScreen + AdvisorHomeScreen. AE-890.** |
| Integrations | IntegrationsScreen.jsx | ✅ | ❌ | ❌ | ❌ | Shows 18 partner tiles; no live status |
| Settings | SettingsScreen.jsx | ✅ | ✅ | ✅ | ❌ | SHOP config from demoData; changes not persisted |
| AI Copilot | AICopilotScreen.jsx | ✅ | ✅ | ✅ | ❌ | PrediiAgent responses hardcoded; no Claude API call |
| **Knowledge Graph** | **KnowledgeGraphScreen.jsx** | ✅ | ❌ | ❌ | ✅ | **Force-directed graph via react-force-graph. RO Graph view (vehicle/customer/job/part/rooftop nodes) + Cluster view (vgen+engine clusters + association rules). Reads live from wrenchiq_ro + wrenchiq_clusters via /api/knowledge-graph. Requires API server running.** |

---

## Components / Shared Features

| Component | File | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|-----------|------|:------:|:-------:|:------:|:------:|-------|
| WrenchIQ Agent Panel | WrenchIQAgent.jsx | ✅ | ✅ | ✅ | ❌ | Context-aware per screen; 14 SCREEN_CONTEXT entries; responses hardcoded |
| Intelligent RO Wizard | NewROWizard.jsx | ✅ | ✅ | ✅ | ❌ | Plate → vehicle lookup, symptom → job search, Uber tracker, tech card |
| Persona Gateway / Role Routing | PersonaGatewayScreen.jsx, PersonaShell.jsx | ✅ | ✅ | ✅ | ❌ | All 8 personas routed; AM + OEM gateways operational |
| **OEM White-Label Branding Toggle** | **OEMSettingsScreen.jsx (Admin tab), PersonaShell.jsx** | ✅ | ✅ | ✅ | ❌ | **Toggle in OEM Admin: WrenchIQ.ai (default) or PrediiPowered™. Swaps wordmark in top bar + footer across all OEM personas. State in WrenchIQOEMApp.** |
| WrenchIQ-AM Standalone App | WrenchIQAMApp.jsx, main.am3c.jsx, am-3c.html | ✅ | ✅ | ✅ | ❌ | Standalone AM 3C Story Writer at `/am-3c.html` — no persona gateway required |

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
| **Square Payments API** | **Payments** | **AM** | ✅ | ✅ | ✅ | ❌ | **Primary payment processor. Pay link + in-shop terminal + tap-to-pay. Demo flow in CheckoutModal.jsx.** |
| DigniFi | Payments | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Sunbit | Payments | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| QuickBooks Online | Accounting | AM | ✅ | ❌ | ❌ | ❌ | Referenced in WrenchIQ Agent alerts |
| **Xero** | **Accounting** | **AM** | ✅ | ✅ | ✅ | ❌ | **GL sync simulated in CheckoutModal — invoice lifecycle + payment posting + credit notes. Chart-of-accounts mapping in spec.** |
| Gusto | Accounting | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| Worldpac | Parts | AM | ✅ | ✅ | ✅ | ❌ | Parts price comparison screen |
| O'Reilly Auto Parts API | Parts | AM | ✅ | ✅ | ✅ | ❌ | Parts price comparison screen |
| PartsTech | Parts | AM | ✅ | ❌ | ❌ | ❌ | Tile only |
| NHTSA API | Vehicle Data | AM + OEM | ✅ | ✅ | ✅ | ✅ | Live NHTSA recall API active in OEM 3C Story Writer and AM 3C Story Writer |
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
| Service Advisor (AM) | ✅ PersonaShell | ✅ RO Queue & Board | ✅ Intelligent RO + **3C Story Writer** | ⚠️ Desktop only | ✅ |
| Technician (AM) | ✅ PersonaShell | ✅ My Jobs | ✅ DVI entry | ✅ Phone mockup | ✅ |
| Car Owner | ✅ PersonaShell | ✅ Customer Portal | ✅ Approval flow | ✅ Mobile layout | ✅ |
| Shop Owner | ✅ PersonaShell | ✅ Owner Command Center | ✅ Analytics + AI Copilot | ⚠️ Desktop only | ✅ |
| VP Ops (100-loc) | ✅ PersonaShell | ✅ Multi-Location screen | ✅ Network overview | ⚠️ Desktop only | ✅ |
| Fixed Ops Director (OEM) | ✅ OEM Gateway | ✅ Warranty Dashboard | ✅ Analytics + Dealer Group | ⚠️ Desktop only | ✅ |
| Service Advisor (OEM) | ✅ OEM Gateway | ✅ RO Story Writer | ✅ 3C Narrative + DMS Push | ⚠️ Desktop only | ✅ |
| Technician (OEM) | ✅ OEM Gateway | ✅ My Jobs | ✅ OEM job view | ⚠️ Desktop only | ✅ |

---

## Recently Completed

| Item | Delivered | Notes |
|------|-----------|-------|
| Persona routing / gateway | ✅ March 2026 | All 8 AM + OEM personas routed via PersonaGatewayScreen + PersonaShell |
| AM 3C Story Writer — standalone UI | ✅ March 2026 | AM3CStoryWriterScreen.jsx; accessible at `/am-3c.html`, in admin shell, and in Advisor persona |
| OEM white-label branding toggle (PrediiPowered™) | ✅ March 2026 | OEM Admin settings → toggle WrenchIQ.ai / PrediiPowered™ across all OEM personas |
| NHTSA Recall API — live integration | ✅ March 2026 | Live in both OEM 3C Story Writer and AM 3C Story Writer |
| **Checkout & Payment Processing (AE-890)** | **✅ March 2026** | **Square pay link + customer pay page + cash flow + Xero GL mock. CheckoutModal.jsx. "Finalize & Checkout" on Ready cards in RepairOrderScreen + AdvisorHomeScreen.** |
| Checkout & Payment spec | ✅ March 2026 | wrenchiq-checkout-payment-specification.md + Confluence page |

## What's Next — Prioritized Implementation Gaps

| Priority | Item | From Level | To Level | Spec Reference |
|----------|------|-----------|----------|----------------|
| P1 | Claude API — PrediiAgent live calls | Demo Data | Live API | wrenchiq-product-specification.md §Module 6 |
| P1 | Square Payments API — live integration | Demo | Live API | wrenchiq-checkout-payment-specification.md §5 |
| P1 | Xero — live OAuth + GL posting | Demo | Live API | wrenchiq-checkout-payment-specification.md §6 |
| P2 | Twilio SMS — approval + notifications | Demo Data | Live API | wrenchiq-user-flows-specification.md |
| P2 | Meta Graph API — Instagram/Facebook live | Demo Data | Live API | wrenchiq-product-specification.md §Module 1 |
| P2 | Customer pay page `/pay/:token` — real route | Demo (modal) | Live | wrenchiq-checkout-payment-specification.md §4 |
| P3 | TikTok Business API | Demo Data | Live API | wrenchiq-product-specification.md §Module 1 |
| P3 | Worldpac API live pricing | Demo Data | Live API | wrenchiq-product-specification.md §Module 9 |
| P4 | CDK Global DMS push (OEM) | Mock | Live API | wrenchiq-product-specification.md §Module 5 |
| P4 | AM 3C Story Writer — Predii Score API live | Demo | Live API | AM3CStoryWriterScreen.jsx |
| P4 | Advisor mobile-responsive layout | Mock | Demo Data | wrenchiq-persona-ux-specification.md |
| P4 | Square Terminal API — live pairing + checkout | Demo | Live API | wrenchiq-checkout-payment-specification.md §5.2 |

---

*WrenchIQ.ai — Predii Confidential*
