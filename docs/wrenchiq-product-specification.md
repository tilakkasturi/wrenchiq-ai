# WrenchIQ.ai — Product Specification v1.0
## "The Dealership's Intelligence. The Neighborhood's Trust."

**Status:** Pre-Launch Specification
**Date:** March 2026
**Prepared by:** Predii, Inc.
**Domain:** WrenchIQ.ai

---

## IMPLEMENTATION STATUS

> Full detail in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Summary for modules covered by this specification:

| Level | Badge | Meaning |
|-------|-------|---------|
| UI Mock | `MOCK` | Static placeholder UI only |
| Synthetic Data | `SYNTH` | Hardcoded fake data inline in component |
| Demo Data | `DEMO` | Connected to `src/data/demoData.js` |
| Live API | `LIVE` | Real third-party API integrated |

| Module | Screen / Component | `MOCK` | `SYNTH` | `DEMO` | `LIVE` |
|--------|--------------------|:------:|:-------:|:------:|:------:|
| Module 1 — Social Command Center | SocialInboxScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 2 — Command Center | DashboardScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 3 — Multi-Location Hub | MultiLocationScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 4 — Trust Engine / Health Report | TrustEngineScreen.jsx, HealthReportScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 5 — 3C Story Writer | NewROWizard.jsx (Intelligent RO) | ✅ | ✅ | ✅ | ❌ |
| Module 6 — AI Repair Advisor | WrenchIQAgent.jsx, AICopilotScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 7 — Technician Mobile | TechMobileScreen.jsx, DVIScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 8 — Smart Scheduling | SmartSchedulingScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Module 9 — Parts Intelligence | PartsIntelligenceScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Integration Ecosystem (all 18 APIs) | IntegrationsScreen.jsx | ✅ | ❌ | ❌ | ❌ |
| Customer Portal | CustomerPortalScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Analytics | AnalyticsScreen.jsx | ✅ | ✅ | ✅ | ❌ |
| Settings | SettingsScreen.jsx | ✅ | ✅ | ✅ | ❌ |

| Edition | Short Name | Target Market |
|---------|-----------|---------------|
| WrenchIQ Aftermarket | **WrenchIQ-AM** | Independent shops, multi-location groups, franchises |
| WrenchIQ OEM | **WrenchIQ-OEM** | Franchise dealerships (Toyota, Ford, GM, Honda, etc.) |

> **Naming rule:** Use **WrenchIQ-AM** and **WrenchIQ-OEM** in all product collateral, API documentation, pricing sheets, and partner agreements. Do not use "Aftermarket" or "OEM Dealership" as standalone product names.

---

## THE ONE THING

> **"WrenchIQ is the first shop management platform built backwards from the customer's phone screen — not the service advisor's desk."**

Every other shop management system (Mitchell 1, Shop-Ware, Tekmetric, AutoLeap) was designed for the advisor or owner. WrenchIQ is designed for the *customer first* — earning their trust before they arrive, during the repair, and for the lifetime of their vehicle. The shop wins because the customer wins.

**Tagline:** *Every repair builds trust. Every trust builds loyalty.*

---

## PRODUCT SCOPE: WrenchIQ-OEM + WrenchIQ-AM

WrenchIQ-OEM and WrenchIQ-AM are **separate products** serving distinct markets. They are not bundles of each other. They share no UI, no buyer journey, and no sales motion. They do share an underlying foundational intelligence layer — and that convergence will deepen over time.

| Segment | Edition | Buyer | What They Buy |
|---------|---------|-------|---------------|
| OEM Dealerships | **WrenchIQ-OEM** | Fixed Ops Director, Service Manager | **3C Story Writer** — standalone AI-powered repair narrative engine, plugs into existing DMS |
| Aftermarket / Independent | **WrenchIQ-AM** | Shop Owner, GM of multi-location group | **Full WrenchIQ SMS** — complete shop management platform replacing Mitchell1, Tekmetric, Shop-Ware |

### Why They Stay Separate

OEM dealerships already have infrastructure: CDK, Reynolds & Reynolds, or Dealertrack as their DMS; manufacturer portals for warranty; OEM-mandated tooling for CSI and scheduling. They are not buying a shop management system — they are buying a specific capability (warranty documentation quality) that plugs into what they already have.

Independent shops have none of that infrastructure. They need the full platform.

Bundling the two would confuse both buyers and create a product that serves neither well.

### Modularity Principle

Every module — 3C Story Writer, DVI, Scheduling, Trust Engine, Parts Intelligence, Social Inbox — is built edition-agnostic internally. No module contains hardcoded OEM or AM logic. Edition-specific behavior is always a parameter, not a branch.

```
Module (edition-agnostic logic)
    │
    └── edition: "OEM" | "AM"   ← controls output style, compliance rules, DMS target
```

This means any module can be assigned to either edition, both, or neither — without refactoring the module itself. Today's OEM-only modules can be activated for AM (and vice versa) by adding them to the edition's module registry.

### Foundational Stack — Convergence Roadmap

The Predii AI engine and core data services are the shared foundation beneath both editions. As both products mature, these layers will be explicitly extracted into a common platform that both editions consume as services.

```
┌─────────────────────────────┐   ┌─────────────────────────────┐
│       WrenchIQ-OEM          │   │       WrenchIQ-AM            │
│                             │   │                              │
│  3C Story Writer            │   │  Full SMS (all modules)      │
│  DMS Push (CDK, R&R, etc.)  │   │  Social Inbox                │
│  OEM Warranty Portals        │   │  Multi-Location Hub          │
│  Recall / Campaign Mgmt      │   │  Trust Engine                │
└──────────────┬──────────────┘   └──────────────┬───────────────┘
               │                                  │
               └──────────────┬───────────────────┘
                              │
               ┌──────────────▼───────────────────┐
               │     Predii Foundational Stack     │
               │                                   │
               │  VIN Intelligence + OEM Spec DB   │
               │  3C Narrative Assembly Engine     │
               │  TSB / Recall / DTC Knowledge     │
               │  Repair Knowledge Graph           │
               │  Vehicle Health Prediction        │
               │  Shared API Layer (REST + OAuth)  │
               └───────────────────────────────────┘
```

**Current state:** Foundational stack is shared but not formally extracted — both editions call the same Predii APIs.

**Roadmap:** Formally extract foundational stack into a versioned common platform. Both editions become consumers, not owners, of that layer. This enables third-party integrations and partner SDK access without edition coupling.

### 3C Story Writer — Current Status

- **WrenchIQ-OEM:** 3C Story Writer is the primary product. Autonomous agentic flow, VIN-driven OEM spec, shorthand input expansion, DMS push, OEM warranty portal submission.
- **WrenchIQ-AM:** 3C Story Writer is on the roadmap (Phase 5). Narrative style shifts to customer-facing clarity and independent shop workflows. Same module, different `edition` parameter.

### Module Registry

| Module | WrenchIQ-OEM | WrenchIQ-AM | Notes |
|--------|:------------:|:-----------:|-------|
| 3C Story Writer | ✅ Current | ⏳ Phase 5 | Same module — `edition` controls OEM vs. AM narrative style |
| VIN / Vehicle Intelligence | ✅ | ✅ | Shared foundational service |
| DMS Push (CDK, R&R, Dealertrack) | ✅ | ❌ | OEM only — AM shops don't use enterprise DMS |
| OEM Warranty Portal Submission | ✅ | ❌ | OEM only |
| Digital Vehicle Inspection (DVI) | ❌ | ✅ | AM only today; OEM consideration on roadmap |
| Social Inbox | ❌ | ✅ | AM only — dealerships use OEM-provided CRM |
| Smart Scheduling | ❌ | ✅ | AM only — OEM dealers use manufacturer scheduling tools |
| Trust Engine | ❌ | ✅ | AM only today |
| Multi-Location Hub | ❌ | ✅ | AM only today |
| Parts Intelligence | ❌ | ✅ | AM only — OEM dealers source through OEM channels |
| Technician Mobile | ✅ | ✅ | Shared module — `edition` controls OEM op codes vs. AM labor guide view |
| Customer Portal | ❌ | ✅ | AM only today |
| AI Repair Advisor | ✅ | ✅ | Shared; OEM context = warranty + TSB; AM context = estimate + upsell |

### API Consistency Policy

All API endpoints expose identical signatures, authentication schemes, and response schemas across both editions. Edition-specific behavior is controlled by a single `edition` field in the request payload — not by separate API versions, URL paths, or codebases.

| API Layer | WrenchIQ-AM | WrenchIQ-OEM | Notes |
|-----------|:-----------:|:------------:|-------|
| 3C Story Writer (`/v1/ro/generate-narrative`) | ⏳ Roadmap | ✅ | `edition` param controls narrative style and compliance rules |
| Vehicle / VIN lookup | ✅ | ✅ | Shared NHTSA + ALLDATA integration |
| TSB / Recall match | ✅ | ✅ | Shared — OEM edition returns OEM-specific bulletin data |
| DTC Enrichment | ✅ | ✅ | Shared knowledge graph — OEM overlay applied when `edition=OEM` |
| DMS push (CDK, R&R, Dealertrack) | ❌ | ✅ | OEM only |
| OEM Warranty Portal submission | ❌ | ✅ | OEM only |
| Social Inbox | ✅ | ❌ | AM only |
| Multi-location intelligence | ✅ | ❌ | AM only today |
| Technician mobile | ✅ | ✅ | Shared — `edition` controls UI context |

---

## THE PROBLEM WE'RE SOLVING

### Independent Shops Are Losing to Dealerships — Not on Expertise, But on Perception

- 68% of car owners believe dealerships are more trustworthy (even though they charge 40% more)
- Independent shops have the expertise but not the *theater* of trust
- OEM dealers have: certified technicians badges, digital inspection videos, live tracking, loaner cars, branded communications
- Independent shops have: better people, better prices, but the experience of 1995

### The Inbound Crisis
- 2.1B auto-related videos viewed on TikTok monthly
- Instagram drives 31% of under-35 first-time shop discovery
- Shops have no system for converting social followers into appointments
- Google reviews are reactive; WrenchIQ makes trust proactive

### The Multi-Location Problem
- 100-location operators (like Great Water 360 Auto Care) run 100 versions of the same chaos
- No single source of truth across locations
- Corporate sees P&L, not operational reality
- Tech quality varies wildly; no cross-location intelligence sharing

---

## MARKET

### WrenchIQ-OEM (RO Story Writer — Dealerships)
- 16,000+ franchised new-car dealers in USA
- Service lanes processing 30–150 ROs/day
- Decision maker: Fixed Ops Director, Service Manager, Controller
- Pain: warranty claim rejections, advisor write-up inconsistency, DMS integration complexity, technician productivity in documentation
- Product: RO Story Writer standalone — does not include the WrenchIQ SMS modules

### WrenchIQ-AM: The 100-Location Corporate Group (SMS — Current)
- 12,000+ multi-location shop groups in USA
- Great Water 360, Midas, Meineke, Christian Brothers, Firestone (independent franchisees)
- Decision maker: VP Operations, CFO, CEO
- Pain: fragmented systems, inconsistent customer experience, no AI insight across locations

### WrenchIQ-AM: The Ambitious Single-Shop Owner (SMS — Current)
- 168,000 independent repair shops in USA
- Owner-operators doing $1M–$5M/year
- Decision maker: Owner
- Pain: competing with dealers on $150K/year budget

### WrenchIQ-AM: RO Story Writer (Roadmap)
- Same 168,000+ independent and multi-location shops
- Need professional RO narratives for customer trust, insurance claims, and internal QA
- Pain: advisors write inconsistent notes; no standard format; time-consuming

---

## COMPETITIVE POSITIONING

| Feature | WrenchIQ-AM | WrenchIQ-OEM | Tekmetric | Shop-Ware | Mitchell1 | Dealership DMS |
|---------|------------|--------------|-----------|-----------|-----------|----------------|
| AI-native (not bolt-on) | ✅ Core | ✅ Core | ❌ None | ❌ None | ⚠️ Add-on | ⚠️ Add-on |
| RO Story Writer | ⏳ Roadmap | ✅ Current | ❌ | ❌ | ❌ | ⚠️ Manual |
| Social media lead capture | ✅ Built-in | ❌ | ❌ | ❌ | ❌ | ❌ |
| Customer trust score | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-location intelligence | ✅ Native | ✅ Native | ⚠️ Basic | ❌ | ⚠️ Basic | ✅ |
| Mobile-first technician | ✅ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| TSB/recall AI matching | ✅ Real-time | ✅ Real-time | ❌ | ❌ | ⚠️ Manual | ✅ |
| No-code AI configuration | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Customer-facing app | ✅ White-label | ✅ White-label | ⚠️ Basic | ⚠️ Basic | ⚠️ | ✅ |
| OEM DMS integration (CDK, R&R) | ❌ | ✅ | ❌ | ❌ | ⚠️ | ✅ |
| Consistent API schema across editions | ✅ | ✅ | N/A | N/A | N/A | N/A |

---

## PERSONAS

### 1. Sofia Reyes — Shop Owner, Great Water 360 Auto Care (VP Operations, 100 locations)
- Age: 48, MBA, former AutoNation regional director
- Checks P&L from her phone at 6 AM
- Her nightmare: "Why did Location 47 have a 2.9-star Google week while Location 12 had 4.9?"
- Her dream: "Show me which locations need coaching before a bad review happens"
- WrenchIQ Promise: Real-time quality signals across all 100 locations, unified

### 2. Marcus Johnson — Service Advisor, Single Location
- Age: 31, 8 years as advisor
- Juggling 12 customers, 2 phone lines, a texting app, and his shop's Instagram DMs
- His nightmare: "Customer said they messaged us on Instagram 3 days ago about an appointment. I had no idea."
- His dream: "One screen for every customer touchpoint, everywhere they reached out"
- WrenchIQ Promise: Unified social + shop inbox, zero missed leads

### 3. Elena Park — Customer (The Modern Trust-Seeker)
- Age: 34, tech professional
- Researches everything, reads reviews before every purchase
- Trusts her mechanic more than her doctor but chose them from a TikTok video
- Her nightmare: "I have no idea what they're doing to my car or if it's real"
- Her dream: "Real-time updates, honest recommendations, feel as good as going to the dealer"
- WrenchIQ Promise: A beautiful, honest, real-time window into her car's health

### 4. DeShawn Williams — Master Technician (Aftermarket)
- Age: 42, ASE Master Certified, 19 years experience
- Knowledge locked in his head, not the system
- His nightmare: "I have to memorize every TSB. The system never helps me look smart."
- His dream: "AI that surfaces the TSB I need before the customer even checks in"
- WrenchIQ Promise: AI co-pilot in his pocket that makes him look like a genius every time

### 5. Ryan Cho — Fixed Ops Director, Toyota Dealership (OEM)
- Age: 44, 16 years in dealership fixed ops, runs a 22-bay service lane
- Manages 8 advisors; warranty claim rejections cost him $40K+/year
- His nightmare: "My advisors write-up is inconsistent — 3-word complaints on warranty ROs and I get clawed back by Toyota every month"
- His dream: "Every RO written right the first time. Zero warranty rejects. Advisors spending time with customers, not typing."
- WrenchIQ Promise: AI RO Story Writer (standalone, not the full SMS) — OEM-compliant narratives from technician voice notes in seconds, warranty approval rate 95%+

---

## CORE MODULES

### Module 1: Social Command Center (NEW — Differentiator)
**"Turn Followers into First Visits"**

The industry's first native social media-to-shop funnel:

**Channels monitored:**
- Instagram DMs and comments
- TikTok comments and DM (via TikTok Business API)
- Facebook Messenger
- Google Business Messages
- SMS/Text (Twilio)
- Email

**AI capabilities:**
- Intent detection: "How much for an oil change?" → auto-quotes + books
- Sentiment analysis: Flag angry comments before they become reviews
- Auto-reply drafts (human approves, then sends)
- Lead scoring: Hot/Warm/Cold based on message content + timing
- Appointment conversion tracking: Social lead → appointment → RO → revenue

**User Flow: Social Lead to Appointment**
1. Customer DMs on Instagram: "Hey, my check engine light is on, do I need an appointment?"
2. WrenchIQ detects intent → scores as "Hot Lead" → pops into Social Inbox
3. Advisor sees: customer name (if linked), lead score, suggested response
4. AI draft response: "Hi! Yes, we'd love to help. Can you tell me your vehicle year/make/model? We have openings tomorrow at 9 AM or 11 AM."
5. Customer replies with vehicle info → AI pre-creates customer profile
6. Appointment confirmed in-thread → added to schedule → prep sheet sent to technicians

---

### Module 2: WrenchIQ Command Center (Single Location)
**The Shop's Mission Control — Not a Dashboard, an Action Center**

Key metric panels (all clickable, all actionable):
- Live revenue vs. daily target (with AI projection)
- Bay utilization heat map (real-time)
- Customer trust score (location average, trending)
- Estimate approval rate with reasons
- Technician efficiency with coaching tips

**AI Insights Bar (persistent, ambient):**
- Proactive alerts before they become problems
- "Bay 4 has been idle 47 minutes — DeShawn's waiting on a part. Customer Maria hasn't been updated."
- "Your estimate approval rate dropped 8% this week. 3 customers declined without a reason. Want to see the common patterns?"

---

### Module 3: Multi-Location Intelligence Hub
**"100 Shops. One Brain."**

For corporate group operators with 2–500 locations:

**Location Health Score (0-100):**
- Composite of: Google rating, estimate approval rate, tech efficiency, customer trust score, comeback rate
- Color-coded map + list view
- Drill down to any location in one click
- Alert when any location drops below threshold

**Cross-Location Intelligence:**
- "Location 12 (Denver) has 40% comeback rate on transmission flushes. All 100 locations notified of the procedure gap."
- "Top revenue location this week: Houston 3 ($47,200). Here's what they did differently."
- Parts inventory sharing: "Location 8 has 3 extra alternators. Location 31 needs one. Save $127 + same-day availability."

**Benchmarking:**
- Each location sees their rank within the group (gamification for GMs)
- "You're #7 of 23 in your region. Here's the 3 things Locations 1-3 do differently."

---

### Module 4: Trust Engine (Digital Vehicle Health Report)
**"The moment a customer sees this, they never go to a dealership again."**

This is WrenchIQ's version of the DVI (Digital Vehicle Inspection) — but elevated to an art form:

**Customer-facing report (mobile-optimized):**
- Full-screen video thumbnails (click to play tech's video annotation)
- Color-coded health system (Red/Yellow/Green) with honest plain-language explanations
- AI-generated "What this means for you" explanations (no jargon)
- Side-by-side comparison: "What a dealership would charge: $847. Our price: $521."
- One-tap approval with Apple Pay / Google Pay
- Real-time progress bar ("Marcus is installing your brake pads right now")
- Photo gallery of the work done (before/after)

**Trust Score visible to customer:**
- "Peninsula Precision has completed 1,204 inspections. 97% accuracy rate."
- Customer's own vehicle history timeline
- "Based on your driving habits and 87K miles, your timing belt is likely due at 95K."

---

### Module 5: 3C Story Writer (AI Repair Order Narrative Engine)
**"Write every RO right the first time — in seconds, not minutes."**

AI-generated repair order narratives that meet OEM warranty standards and service documentation requirements. The 3C Story Writer is an **autonomous AI agent** embedded in the technician's workflow — it observes, ingests, and drafts the Concern / Cause / Correction narrative without waiting for forms to be filled.

---

#### WrenchIQ-OEM: 3C Story Writer — Agentic Workflow Specification

The 3C Story Writer agent runs continuously in the background from the moment an RO is opened to the moment it is submitted. The technician's only required actions are: **jot a short note or say a few words** and **approve the draft**. All documentation is handled autonomously.

##### Agent Lifecycle

```
RO Opened → [Agent Activates]
     │
     ├── Decodes VIN → loads full OEM spec (components, TSBs, recalls, labor ops, part numbers)
     ├── Ingests advisor shorthand/complaint → seeds Concern narrative
     └── Checks maintenance schedule → flags due services

Repair in Progress → [Agent Observes Continuously]
     │
     ├── Expands tech/advisor shorthand notes → structures into 3C fields
     ├── Listens to tech voice notes → extracts structured findings
     ├── Reads part barcode scans → auto-populates parts list
     ├── Ingests DVI photos/measurements → adds diagnostic evidence
     └── [Optional] Accepts DTC codes from scan tool if integration available

Diagnosis Complete → [Agent Drafts]
     │
     ├── Generates full 3C narrative draft (< 5 seconds)
     ├── Runs OEM compliance check autonomously
     ├── Surfaces blockers or clarifying questions (one at a time, voice-first)
     └── Presents draft to technician for review

Tech Reviews → [One-Tap Approve or Edit]
     │
     └── Agent submits to DMS + OEM warranty portal autonomously
```

##### A. Autonomous Intake (RO Activation)

When a new RO is opened, the agent acts immediately — no technician input required:

- **VIN decode:** Full vehicle profile (year, make, model, trim, engine, transmission) loaded from NHTSA + OEM catalog
- **OEM specification load:** VIN decode directly identifies the applicable OEM spec set — component names, torque values, fluid specifications, labor op codes, and part numbers for that exact vehicle are loaded automatically. No scanner required for this.
- **Vehicle history pull:** Prior ROs, DTCs, part replacements, and mileage history retrieved from DMS
- **TSB match:** Agent queries OEM TSB database and surfaces all applicable bulletins ranked by relevance to the stated complaint
- **Recall check:** Open safety recalls, CSNs, and RRTs flagged automatically with campaign numbers pre-populated
- **Maintenance detection:** Agent compares current mileage against service schedule; flags due or overdue services for advisor action
- **Concern seeding:** Advisor's write-up from intake is parsed and structured into the Concern field — no re-entry

##### B. Continuous Observation (During Repair)

The agent monitors all available inputs throughout the repair:

**VIN-Driven OEM Intelligence (Primary — Always Available)**

The VIN is the primary source of vehicle intelligence. Scanner integration is not required for the agent to operate fully:

- All OEM specifications — component identifiers, part numbers, torque specs, fluid types, labor op codes — are resolved from VIN at intake
- DTC codes entered via shorthand (e.g., `P0420`) are enriched using the VIN-decoded vehicle profile: description, applicable TSBs, OEM-specific diagnostic procedures, and freeze-frame interpretation
- The agent uses Predii's repair knowledge graph (built from millions of OEM repair records by VIN pattern) to surface the most probable cause and correction for the stated complaint + DTC combination — without needing live scanner data

**DTC Input via Shorthand (No Scanner Required)**
- Tech types or says the DTC code after scanning with their own tool: `P0420`, `P0087 P0193`
- Agent enriches each code using VIN context: full description, OEM-specific diagnostic path, applicable TSB, freeze-frame significance
- Multiple codes entered together are automatically cross-referenced and prioritized by root cause likelihood

**Scan Tool Integration (Optional — When Available)**
- If a scan tool with an open API is connected, the agent accepts a DTC stream passively
- OEM proprietary scanner protocols (Toyota Techstream, Ford IDS, GM MDI, Honda HDS) are not integrated directly — their closed architectures make real-time API integration impractical
- Generic OBD-II mode (SAE J1979) supported as an optional passive feed for non-proprietary code streams
- The agent does not require scan tool integration to produce a complete, compliant 3C narrative

**Shorthand Note Expansion — Advisor + Tech**

Both the service advisor (at write-up) and the technician (during repair) can enter brief, cryptic, shorthand notes at any time. The agent expands them into full OEM-compliant narrative language using the active RO context — VIN, DTCs, vehicle history, TSBs — as disambiguation. No grammar, no spelling, no complete sentences required.

Input accepted via: mobile keyboard (thumb-typing in the bay), desktop/tablet text field at the write-up desk, or inline edit on the draft review screen.

*Advisor shorthand — seeds the Concern field:*

| Advisor types | Agent expands to |
|---|---|
| `CEL on, rough idle cold` | "Customer states the Check Engine Light is illuminated. Vehicle exhibits a rough idle condition during cold start operation." |
| `noise front, worse turning left` | "Customer reports an audible noise originating from the front of the vehicle that increases in intensity when turning left." |
| `ac not cold, blows warm hwy` | "Customer states the air conditioning system is not cooling adequately. Condition is noted during highway driving — system blows warm air at speed." |
| `oil lite on, no leaks visible` | "Customer reports the Oil Pressure Warning Light is illuminated. No visible external leaks noted prior to arrival." |

*Tech shorthand — populates Cause and Correction fields:*

| Tech types | Agent expands to |
|---|---|
| `P0420 confirmed, upstream/downstream O2 comp, cat eff below thresh` | "Diagnostic Trouble Code P0420 — Catalyst System Efficiency Below Threshold (Bank 1) confirmed. Upstream and downstream oxygen sensor readings compared; catalytic converter efficiency measured below manufacturer specification." |
| `HPFP lkg @ retainer o-ring, UV dye confirms` | "High-pressure fuel pump found leaking at the retainer O-ring. Leak confirmed using ultraviolet dye inspection." |
| `repl HPFP & o-ring, torqued spec, bleed fuel, clrd codes, road test 12mi ok` | "Replaced high-pressure fuel pump assembly and retainer O-ring. Torqued all fasteners to OEM specification. Fuel system bled and primed. Fault codes cleared. Road test performed — 12 miles, no reoccurrence of original concern." |
| `byp vlv lkg lower ftg, coolant on blk, pressure test confirms` | "Coolant bypass valve found leaking at the lower fitting. Coolant residue present on engine block. Leak confirmed via cooling system pressure test." |

*Disambiguation using RO context:* when shorthand is ambiguous, the agent resolves using VIN + active DTCs + service history. For example, "pump" on a Ford 6.7L diesel maps to high-pressure fuel pump, not coolant pump, because of the active P0087 DTC in context. If confidence is low on a specific phrase, the agent highlights it and surfaces one clarifying question — not a form.

**Voice-First Tech Notes**
- Technician speaks naturally into the mobile app or bay tablet: "found the coolant bypass valve leaking at the lower fitting, coolant present on engine block"
- Agent transcribes, extracts structured entities (component, failure mode, location, evidence), and maps to OEM cause language
- Shorthand and voice work interchangeably — the agent treats both the same way

**Parts Auto-Detection**
- Tech scans part barcodes as they are pulled from inventory; agent logs part number, OEM designation, and quantity automatically
- Agent tracks "removed for access" separately from "replaced" — builds the parts narrative without a checklist
- Flags if a removed part is not logged as reinstalled or disposed

**DVI / Measurement Ingestion**
- If a Digital Vehicle Inspection is performed, agent ingests findings (photos, measurements, red/yellow/green status) and incorporates relevant items into the Cause narrative
- Pressure test results, brake measurements, fluid conditions captured as structured diagnostic evidence

##### C. Draft Generation (Diagnosis Complete)

When the technician signals diagnosis is complete (voice: "done diagnosing" / tap: "generate story"), the agent drafts the full 3C narrative autonomously:

- **Concern:** Constructed from advisor intake notes + any tech clarifications captured during inspection
- **Cause:** Built from DTC stream + voice notes + DVI measurements + TSB references — in full OEM-compliant language
- **Correction:** Assembled from part scan log + voice notes describing what was replaced and what supporting work was performed

The draft is presented to the technician as a **review screen**, not a form. The tech reads, edits any line with a tap, and approves. Median edit rate target: < 15% of lines touched.

**Proactive Clarification (Agent-Initiated)**
If the agent detects a gap that would fail OEM compliance — missing mileage, unresolved DTC, no road test result — it surfaces a single focused question:

> *"I didn't capture a road test result. Did the concern verify corrected, or is it still present?"*

One question at a time, voice-first. Never a form.

##### D. Specialized Scenario Handling

**No Problem Found (NPF) — Autonomous Detection**
- Agent detects NPF scenario automatically: DTC cleared without a confirmed mechanical failure, or tech voice note indicates "unable to reproduce"
- Switches to NPF narrative mode without technician prompting
- Drafts: conditions checked, diagnostic steps performed, road test distance and conditions, customer concern status
- Generates compliant "unable to duplicate" narrative meeting OEM warranty adjuster standards

**Maintenance — Auto-Identification**
- Agent identifies applicable maintenance interval from mileage and service history at RO activation — no template selection required
- During repair, voice notes and part scans populate the maintenance record automatically
- Generates: fluid specifications, torque values, tire tread measurements, brake measurements, maintenance indicator reset confirmation — all woven into the narrative
- Brand-specific format applied per OEM: Toyota Maintenance Required, Ford Intelligent Oil Life Monitor, GM Oil Life System, Honda Maintenance Minder, Stellantis oil indicator

**Recall / Campaign — Autonomous Routing**
- Agent detects open recall at intake via NHTSA VIN query; campaign number pre-populated
- Selects correct campaign type automatically: Safety Recall / CSN / RRT
- Monitors repair for recall-specific part usage and generates compliant completion documentation
- Checks VIN against completed campaign history before opening recall narrative — prevents duplicate claims

##### E. Compliance and Quality

**Autonomous Compliance Run**
Before surfacing the draft for tech review, the agent runs all OEM compliance checks without technician involvement:

| Check | Behavior |
|-------|----------|
| DTC reconciliation | Every DTC present at intake is addressed in Cause or NPF — unresolved codes block submission |
| Road test mileage | Mileage delta validated against OEM minimum per repair type — agent requests confirmation if missing |
| Parts removed for access | Agent verifies every removed part is accounted for in reinstalled or disposed log |
| Prior authorization | Flags repairs requiring OEM pre-auth before correction narrative is finalized |
| Minimum diagnostic evidence | Ensures Cause contains measured values (voltages, pressures, measurements) — not just observations |

Compliance issues surface as a prioritized list before the tech review screen — not inline red boxes. Blocking issues must be resolved; advisory issues show rationale and can be acknowledged.

**Zero-Error Output**
- All narratives run through OEM language normalization: full terms, no acronyms, no misspellings
- Brand capitalization enforced per OEM (SYNC, Uconnect, MyKey, ProPilot, etc.)
- Terminology libraries updated quarterly from OEM warranty bulletin releases

##### F. Post-Approval: Autonomous Submission

Once the technician approves the narrative:

- Agent writes the 3C narrative to the DMS (CDK Global, Reynolds & Reynolds ERA-IGNITE, Dealertrack, Tekion) — mapped to correct labor op code, cause code, and correction code fields
- For warranty ROs, agent submits to the OEM warranty portal (Toyota WAS, GM GWM, Ford WUPS, Honda WarrantyLink, Stellantis StarConnect)
- Push confirmation logged with timestamp; failed pushes queued with automatic retry and service manager alert
- Predii Score computed post-submission; rejection risk surfaced before OEM adjuster review

---

**Current: OEM Dealerships**
- Autonomous 3C narrative agent: voice input + DTC stream + parts scan → complete draft in < 5 seconds
- OEM compliance engine: Toyota, Ford, GM, Honda, Stellantis warranty format requirements
- Direct push to DMS: CDK Global, Reynolds & Reynolds, Dealertrack, Tekion
- Warranty approval predictor: Predii Score flags rejection risk before submission
- Labor op code auto-mapping: agent matches narrative to correct OEM op codes without advisor input
- Advisor write-up time reduced from ~8 minutes to under 60 seconds per RO

**Roadmap: Aftermarket Independent Shops**
- Narrative style optimized for customer-facing clarity and insurance documentation
- Integration with independent SMS platforms (Tekmetric, Shop-Ware, Mitchell1, AutoLeap)
- Labor guide integration: Mitchell ProDemand + ALLDATA labor times embedded in narrative
- Insurer-compliant format for collision and extended warranty claims
- Customer trust version: plain-language "what we found and why it matters" story auto-generated from the same tech input

---

### Module 6: AI Repair Advisor (WrenchIQ Agent)
**"An ASE Master Technician in every service advisor's pocket."**

Context-aware AI that knows:
- The vehicle's full history (VINs decoded, service records)
- Every active TSB and recall (NHTSA live feed)
- Parts pricing from 6 distributors in real-time
- Customer's communication preferences and history
- Local labor rates and competitive pricing

**Use cases:**
1. **Pre-appointment prep:** Night before, AI sends advisor: "Marcus has a 2019 Honda CR-V 90K service tomorrow. Here are the 3 TSBs relevant to his vehicle and what they mean for the estimate."
2. **Live estimate building:** Advisor describes symptom → AI suggests job, labor time, parts, TSB reference
3. **Upsell intelligence:** "David Kim has historically approved 89% of recommendations under $500. He's price-conscious over $800. Suggest the brake inspection at $89 diagnostic first."
4. **Post-repair follow-up:** AI drafts personalized follow-up texts with care reminders

---

### Module 7: Technician Mobile
**"Built for the bay, not the boardroom."**

Technician-first mobile app (iOS + Android):
- Voice-to-text notes ("this rotor is worn past service limit, checking other side")
- One-tap photo/video capture with auto-upload to RO
- Time clock with job code tracking
- TSB viewer with highlighted relevant sections
- Parts request to service advisor
- Flagging: "This vehicle has additional safety concern — needs advisor attention"

---

### Module 8: Smart Scheduling
**"Your calendar knows your capacity. WrenchIQ knows your profit."**

AI-optimized scheduling:
- Capacity-aware booking (knows each bay, each tech's specialty, expected job duration)
- Revenue optimization: "Slot the 4-hour brake job at 8 AM, not 2 PM"
- Recall/seasonal reminder campaigns: "17 customers in your database have the Honda oil dilution recall. Send reminder?"
- Online booking (embeds on website + Google Business Profile)
- Waitlist management with AI release

---

### Module 9: Parts Intelligence
**"Buy smarter. Sell faster."**

Real-time parts procurement AI:
- Multi-vendor price comparison (OEM, Worldpac, O'Reilly, NAPA, eBay Motors, RockAuto)
- Part quality scoring based on warranty claims data
- Core charge tracking and return automation
- Inventory optimization: "You order this part 3x/month. Stock 2 to save $47/month in rush fees."
- Vendor scorecards: delivery time, defect rate, return processing

---

## INTEGRATION ECOSYSTEM

### Customer Communication
| Partner | Purpose | Tier |
|---------|---------|------|
| Twilio | SMS/MMS, 2-way text | Core |
| Podium | Review management, webchat | Core |
| Birdeye | Multi-location review monitoring | Enterprise |
| Google Business API | Messages, reviews, hours | Core |

### Social Media
| Partner | Purpose | Tier |
|---------|---------|------|
| TikTok Business API | DM capture, lead tracking | Core |
| Meta Graph API | Instagram/Facebook DM + ads | Core |
| Sprout Social | Social scheduling/publishing | Enterprise |

### Payments
| Partner | Purpose | Tier |
|---------|---------|------|
| Stripe | Card processing, digital estimates | Core |
| PayRange | Contactless payment in-bay | Core |
| DigniFi | Customer financing | Core |
| Sunbit | BNPL for repairs | Premium |

### Accounting & Finance
| Partner | Purpose | Tier |
|---------|---------|------|
| QuickBooks Online | Bookkeeping, AP/AR | Core |
| Xero | Alternative accounting | Core |
| Gusto | Payroll | Core |

### Parts & Inventory
| Partner | Purpose | Tier |
|---------|---------|------|
| Worldpac | Parts ordering | Core |
| O'Reilly Auto Parts API | Parts ordering + pricing | Core |
| NAPA ProLink | Parts ordering | Core |
| eBay Motors API | Alternative parts sourcing | Core |
| PartsTech | Multi-vendor catalog | Premium |
| NexPart | Electronic parts ordering | Premium |

### Vehicle Data & Diagnostics
| Partner | Purpose | Tier |
|---------|---------|------|
| NHTSA API | Recalls + TSBs (live) | Core |
| ALLDATA | OEM repair data | Premium |
| Mitchell ProDemand | Labor times + procedures | Premium |
| AutoVitals | Vehicle inspection platform | Optional |
| Identifix | Diagnostic trouble shooting | Premium |

### Fleet & Specialty
| Partner | Purpose | Tier |
|---------|---------|------|
| Fleetio | Fleet customer management | Enterprise |
| Samsara | Telematics data from fleet vehicles | Enterprise |

### Scheduling & CRM
| Partner | Purpose | Tier |
|---------|---------|------|
| Google Calendar | Advisor/tech availability sync | Core |
| Calendly | Customer-facing booking | Core |
| HubSpot | Enterprise CRM for corp groups | Enterprise |

### Loaner & Mobility
| Partner | Purpose | Tier |
|---------|---------|------|
| Enterprise Rent-A-Car | Loaner car coordination | Premium |
| Lyft Business | Ride credit for waiting customers | Premium |

### OBD / Telematics
| Partner | Purpose | Tier |
|---------|---------|------|
| Automatic | OBD-II remote monitoring | Premium |
| Spireon | Fleet GPS + health monitoring | Enterprise |

---

## USER FLOWS

### Flow 1: Instagram DM → First Visit (5 minutes to booked)
```
[Customer DMs @ShopIG] "Hey, my car is shaking when I brake, how much would that cost?"
    ↓
[WrenchIQ Social Inbox] New lead detected — Intent: brake service — Score: Hot
    ↓
[AI Draft Response] "Hi! Brake shaking is usually rotors or pads — super common and we can
                     diagnose it for free! What's your vehicle year/make/model?"
    ↓
[Advisor clicks "Send" — 1 click]
    ↓
[Customer replies] "2022 Toyota Camry, about 45K miles"
    ↓
[WrenchIQ] Creates customer profile, vehicle, pre-estimates rotor/pad service $389–$520
    ↓
[Advisor texts] "Perfect! Rotors and pads on a Camry typically run $389–$520 depending
                 on condition. Our digital inspection is free. Can you come in tomorrow?"
    ↓
[Customer] "Yes, 10 AM works!"
    ↓
[WrenchIQ] Books appointment, sends confirmation, notifies techs, adds to prep sheet
    ↓
[RESULT: Social follower → booked appointment in 8 minutes]
```

### Flow 2: Vehicle Check-In → Estimate Approval (Zero paper, pure trust)
```
[Customer arrives]
    ↓
[Advisor] Scans license plate → Full customer + vehicle profile loads instantly
    ↓
[WrenchIQ] "Sarah Chen — 14 visits, $8,420 LTV. Her 2022 Tesla Model 3 is due for
             annual service. 2 open TSBs on this VIN. Her preference: text updates."
    ↓
[Tech gets mobile notification] "Sarah's Tesla assigned to Bay 4. TSB-2024-22-004
                                  (phantom braking) is relevant — check ADAS cameras."
    ↓
[Tech completes DVI on mobile] Takes 14 photos, 3 videos, marks 6 items
    ↓
[WrenchIQ AI] Generates inspection report with plain-language explanations in 15 seconds
    ↓
[Sarah receives text] "Your inspection is ready! 3 items need attention — tap to review."
    ↓
[Sarah opens link on iPhone — beautifully designed report]
    ↓
[AI explanation] "Your rear brake pads have 3mm left — about 8,000 miles.
                  Waiting risks rotor damage and a $400 higher repair bill."
    ↓
[Sarah taps "Approve All" → pays deposit with Apple Pay]
    ↓
[Tech gets notification] "Sarah approved everything. Parts ordered. Start when ready."
    ↓
[Sarah tracks progress in real-time on her phone]
    ↓
[Work complete] Sarah gets video of completed work + invoice → pays on phone
    ↓
[3 days later] WrenchIQ sends: "How's the ride feeling, Sarah? Rate your visit."
    ↓
[Sarah leaves 5-star Google review] [AI spots it] "New review posted! Boosted to Google."
```

### Flow 3: Multi-Location Ops Review (Corporate, 6 AM Monday)
```
[Sofia opens WrenchIQ on iPhone at 6 AM]
    ↓
[Location Health Map loads] 100 dots — 94 green, 4 yellow, 2 red
    ↓
[AI Morning Brief] "Good morning, Sofia. Weekend performance summary:
                   - Best: Denver 3 ($67K, 4.9★)
                   - Concern: Phoenix 7 (comeback rate up 12%, 2 negative reviews)
                   - Parts savings missed: 23 locations didn't use cross-location inventory"
    ↓
[Sofia taps Phoenix 7] Sees live RO board, Google reviews, tech efficiency, comeback log
    ↓
[AI recommendation] "Phoenix 7's comeback pattern is transmission flushes. Same issue
                      appeared at Houston 2 in 2024 — resolved with tech training video.
                      Send to Phoenix 7 GM?"
    ↓
[Sofia] Taps "Send coaching video" — delivered to GM + techs in-app instantly
    ↓
[Week later] Phoenix 7 comeback rate drops 8%
```

### Flow 4: Competing Against a Dealer
```
[Customer visits dealer for 60K service — charged $1,247]
    ↓
[Customer's neighbor used WrenchIQ-powered shop — paid $680]
[Neighbor shows customer the digital inspection report on her phone]
[Customer sees: same 22 check points, professional videos, before/after photos]
    ↓
[Customer books first appointment with WrenchIQ shop]
    ↓
[Check-in: advisor says] "I can see you've been going to Toyota of Palo Alto.
                          Welcome! I pulled your VIN — they did your timing belt
                          last year. We'd normally suggest that, but it's good.
                          Here's what we'll focus on today."
    ↓
[Customer realizes: independent shop has MORE information than the dealer]
    ↓
[Customer approves $430 service vs dealer's typical $780 for same work]
    ↓
[Customer gets same professional digital report as dealer — better actually]
    ↓
[Customer never goes back to the dealer]
```

---

## PRICING

### Starter (1 location)
- **$199/month**
- Up to 5 users (advisors + techs)
- Core modules: Command Center, RO Management, DVI, Customer Portal
- Social inbox: Instagram + Facebook only
- 500 customer text messages/month
- Basic analytics

### Growth (1 location)
- **$349/month**
- Unlimited users
- All modules including Social Inbox (all channels)
- WrenchIQ Agent (AI advisor)
- Parts intelligence (3 vendors)
- 2,000 text messages/month
- Advanced analytics

### Enterprise (2-100 locations)
- **$249/location/month** (volume discounts apply)
- All Growth features
- Multi-location intelligence hub
- Corporate dashboard
- API access
- Dedicated onboarding team
- Custom AI training on shop's history
- Unlimited text messages
- White-label customer app

### Custom (100+ locations)
- Custom pricing
- Dedicated AI infrastructure
- On-site implementation
- Custom integrations

---

## DESIGN PRINCIPLES

1. **Trust is visual.** Every screen communicates credibility before a word is read.
2. **AI is ambient.** The AI knows everything; it surfaces what's needed without being asked.
3. **It doesn't look like software.** It looks like a trusted advisor's workspace.
4. **Mobile-first everywhere.** Advisor on the shop floor. Tech in the bay. Customer in their car.
5. **One tap to action.** Every insight has a next step. No analysis paralysis.
6. **Radical transparency.** Customers see everything. Trust is built by showing, not telling.
7. **Speed builds confidence.** Under 3 seconds for any action the customer experiences.

---

## TECHNICAL ARCHITECTURE

---

### Architecture Overview: WrenchIQ + Predii Technology Separation

WrenchIQ and Predii are **two distinct technology layers** with a clean API boundary between them. WrenchIQ is the application platform; Predii is the intelligence engine. WrenchIQ never embeds Predii logic directly — it consumes Predii capabilities exclusively through versioned APIs.

```
┌─────────────────────────────────────────────────────────────────┐
│                        WrenchIQ Layer                           │
│                                                                 │
│   Shop UI / Advisor UI / Technician Mobile / Customer Portal    │
│   Scheduling · DVI · RO Board · Social Inbox · Analytics        │
│   Multi-Location Hub · Trust Engine · Parts Intelligence        │
│                                                                 │
│                     WrenchIQ Application APIs                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │  REST + WebSocket API calls
                           │  (authenticated, versioned, edition-aware)
┌──────────────────────────▼──────────────────────────────────────┐
│                        Predii Core Layer                        │
│                                                                 │
│   Contextual Engine · RO Story Writer · Intelligent RO Intake   │
│   Repair Knowledge Graph · TSB/DTC Matching · Health Prediction │
│                                                                 │
│            All capabilities exposed as Predii APIs              │
└─────────────────────────────────────────────────────────────────┘
```

**Separation rules:**
- WrenchIQ owns: shop workflows, customer UX, scheduling, billing, integrations, multi-location ops
- Predii owns: repair intelligence, historical knowledge base, contextual engine, AI models
- All Predii capabilities are accessed by WrenchIQ (and any third-party partner) through Predii APIs only — no direct library imports, no shared databases
- A third-party DMS (CDK, Tekmetric, etc.) can integrate with Predii APIs independently of WrenchIQ

---

### Predii Core: The Contextual Intelligence Engine

Predii's foundational capability is the **Contextual Engine** — a continuously learning knowledge base built from automotive repair data at scale.

#### Data Foundation
- **Daily Closed Repair Orders:** Every completed RO processed through Predii-connected shops is ingested nightly. Structured data extracted: vehicle, complaint, root cause, corrective action, parts used, labor time, outcome.
- **Historical Knowledge Graph:** Accumulated from millions of historical repair orders across makes, models, model years, mileage bands, and geographic regions. Encodes what commonly goes wrong, when, under what conditions, and what the correct repair path is.
- **TSB + DTC Corpus:** Live NHTSA feed + ALLDATA + Identifix — mapped and cross-referenced against the historical knowledge graph for pattern validation.
- **Outcome Feedback Loop:** Post-repair comebacks and warranty claims are fed back to the engine to continuously improve confidence scores.

#### Intelligent RO Intake (Powered by Contextual Engine)
The Contextual Engine is the core driver behind the Intelligent RO experience during check-in:

1. **Vehicle + Complaint Intake:** Customer describes concern (voice, text, or social DM). Predii receives VIN + complaint text.
2. **Contextual Matching:** Predii queries the historical knowledge graph — "for this vehicle, at this mileage, with this complaint, what are the top 5 probable root causes and their resolution paths?"
3. **Pre-populated RO:** WrenchIQ receives a structured, AI-drafted RO: complaint language, probable cause, suggested op codes, labor estimate range, relevant TSBs, and parts pre-staged for inquiry.
4. **Advisor Confirmation:** Service advisor reviews, adjusts, and confirms — they are not starting from a blank screen.
5. **Narrative Generation:** After tech confirms diagnosis, the RO Story Writer API generates the 3C narrative (Concern / Cause / Correction) in OEM or aftermarket format.

```
Customer Complaint + VIN
        │
        ▼
 Predii Contextual Engine API
        │
        ├── Historical RO Pattern Match (same vehicle + complaint class)
        ├── TSB/DTC Cross-Reference
        ├── Confidence Score per probable cause
        └── Parts + Labor estimate ranges
        │
        ▼
 Structured Pre-Built RO (returned to WrenchIQ)
        │
        ▼
 WrenchIQ Advisor Screen (editable, confirmable)
        │
        ▼
 Tech Confirms Diagnosis
        │
        ▼
 Predii RO Story Writer API → Final Narrative
```

---

### Predii API Surface

Every Predii capability is exposed as a versioned, authenticated REST API. WrenchIQ is a first-party consumer of these APIs — no different from any enterprise partner.

| Predii API | Purpose | Consumers |
|------------|---------|-----------|
| `POST /v1/intake/contextualize` | Submit VIN + complaint → receive structured RO pre-fill | WrenchIQ, DMS partners |
| `POST /v1/ro/generate-narrative` | Submit RO data → receive 3C narrative in OEM or AM format | WrenchIQ, CDK, R&R, Dealertrack |
| `GET /v1/tsb/match` | VIN + DTC codes → ranked TSB list with resolution summaries | WrenchIQ, any DMS |
| `POST /v1/health/predict` | Vehicle + mileage + service history → health score + upcoming service predictions | WrenchIQ, OBD/telematics partners |
| `GET /v1/labor/estimate` | VIN + op code → labor time range from historical data | WrenchIQ, estimating tools |
| `POST /v1/parts/recommend` | VIN + diagnosis → OEM and aftermarket part options with quality scores | WrenchIQ Parts Intelligence module |
| `GET /v1/recall/active` | VIN → active recalls and recommended action | WrenchIQ, customer-facing apps |
| `POST /v1/feedback/outcome` | Closed RO outcome → fed back into Contextual Engine | WrenchIQ (automatic nightly) |

**API Standards:**
- All APIs: REST over HTTPS, OAuth 2.0 (client_credentials flow for server-to-server)
- Versioned at URL level (`/v1/`, `/v2/`) — no breaking changes within a version
- Edition-aware behavior via `edition` field (`"AM"` or `"OEM"`) in request payload — single endpoint serves both products
- Rate-limited per API key; enterprise tiers have dedicated capacity
- Response times: P95 < 500ms for synchronous endpoints; async job queue for bulk operations

---

### WrenchIQ Application Architecture

WrenchIQ is the application layer. It owns the shop workflow, the customer experience, and all third-party integrations outside of repair intelligence.

#### Cloud Infrastructure
- **Platform:** AWS (primary) with multi-region failover (us-east-1 primary, us-west-2 standby)
- **Frontend:** React (web app) + React Native (mobile — technician + customer apps)
- **Backend:** Node.js microservices on ECS/Fargate — one service per domain (scheduling, RO, social, notifications, analytics)
- **Database:** PostgreSQL (RDS Multi-AZ) for transactional data; Redis (ElastiCache) for session + real-time state; S3 for media (DVI photos/videos)
- **Real-time:** WebSocket connections (API Gateway + Lambda) for live bay status and customer notifications
- **Event bus:** Amazon EventBridge — decouples services; all cross-service communication is event-driven

#### AI Stack (WrenchIQ Layer)
WrenchIQ uses LLM capabilities for customer-facing communication and advisor UX. This is distinct from Predii's repair intelligence:

| Capability | Provider | Purpose |
|------------|----------|---------|
| Advisor AI Copilot (conversational) | Anthropic Claude claude-sonnet-4-6 | In-app advisor suggestions, social reply drafts, customer summaries |
| Customer communication drafts | Anthropic Claude claude-sonnet-4-6 | Auto-draft texts, follow-ups, review responses |
| Social intent detection | Claude claude-sonnet-4-6 + fine-tuned classifier | Classify DM intent (appointment request, complaint, inquiry) |
| Repair intelligence (pre-fill, narrative) | **Predii API** | Consumed via API — not built in WrenchIQ |
| Vehicle health prediction | **Predii API** | Consumed via API |

#### Integration Architecture
WrenchIQ acts as the integration hub for all shop-facing third-party systems. Predii does not integrate directly with these — all data flows through WrenchIQ first:

```
Third-Party Systems          WrenchIQ Integration Layer         Predii APIs
─────────────────────        ──────────────────────────────     ───────────────
Twilio (SMS)            ──►  Communications Service        │
Meta Graph API          ──►  Social Inbox Service           │
TikTok Business API     ──►  Social Inbox Service           │
Stripe                  ──►  Payments Service               │
QuickBooks              ──►  Accounting Sync Service        ├──► Contextual Engine
NHTSA API               ──►  Vehicle Data Service           │    RO Story Writer
ALLDATA                 ──►  Vehicle Data Service           │    TSB Match API
Worldpac / O'Reilly     ──►  Parts Catalog Service          │    Health Prediction
CDK / R&R / Dealertrack ──►  DMS Push Service (OEM only)   │
Google Business API     ──►  Reviews + Scheduling Service  │
```

**Integration principles:**
- WrenchIQ normalizes all third-party data before passing to Predii (no raw third-party schemas in Predii)
- Predii APIs are stateless — WrenchIQ manages all shop, customer, and RO state
- Failed Predii API calls degrade gracefully — WrenchIQ falls back to unassisted RO creation, never blocks the shop workflow

---

### Security & Compliance

- SOC 2 Type II certified (both WrenchIQ and Predii independently)
- PCI-DSS compliant (payment processing — Stripe handles card data; WrenchIQ never stores raw card numbers)
- CCPA compliant (California customer data — right to deletion flows implemented)
- End-to-end encryption for customer PII in transit (TLS 1.3) and at rest (AES-256)
- Role-based access control (RBAC) down to field level — technicians cannot see financial data; customers see only their own records
- API key rotation policy: 90-day forced rotation for Predii API keys
- Predii API access is scoped — WrenchIQ production keys cannot access other Predii customers' data

---

## LAUNCH STRATEGY

### Phase 1 (Q1 2026): Foundation
- Core SMS — Aftermarket single location (RO management, DVI, scheduling)
- RO Story Writer — OEM Dealerships standalone (CDK, Reynolds & Reynolds, Dealertrack integration; no SMS modules)
- Social Inbox (Instagram + Facebook)
- WrenchIQ Agent v1
- Digital Inspection with video
- Stripe payment integration

### Phase 2 (Q2 2026): Trust Engine
- Customer-facing app (white-label)
- Trust Score launch
- Parts Intelligence (5 vendors)
- TikTok integration
- QuickBooks/Xero sync

### Phase 3 (Q3 2026): Multi-Location
- Enterprise dashboard
- Location Health Score
- Cross-location inventory sharing
- Franchise network tools
- DigniFi/Sunbit financing

### Phase 4 (Q4 2026): AI Native
- Predictive vehicle health
- AI-optimized scheduling
- Custom AI training per shop
- OBD-II telematics integration
- Fleet management

### Phase 5 (2027): RO Story Writer — Aftermarket Expansion
- RO Story Writer extended to independent shops and multi-location aftermarket groups
- Integration with Tekmetric, Shop-Ware, AutoLeap, Mitchell1 for direct RO push
- Customer-facing "repair story" auto-generated from same technician input
- Insurance and extended warranty claim narrative format
- Labor guide (ALLDATA, ProDemand) embedded op code and time suggestions
- Aftermarket warranty compliance rules engine (for shops offering in-house warranties)

---

*WrenchIQ.ai — Predii Confidential*
