# WrenchIQ.ai — Persona-Based UX Redesign Specification

**Version:** 1.0
**Date:** 2026-03-21
**Author:** WrenchIQ Product Team
**Status:** Draft

---

## IMPLEMENTATION STATUS

> Full detail in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md). Summary for persona features covered by this specification:

| Level | Badge | Meaning |
|-------|-------|---------|
| UI Mock | `MOCK` | Static placeholder UI only |
| Synthetic Data | `SYNTH` | Hardcoded fake data inline in component |
| Demo Data | `DEMO` | Connected to `src/data/demoData.js` |
| Live API | `LIVE` | Real third-party API integrated |

| Persona Feature | Component / Screen | `MOCK` | `SYNTH` | `DEMO` | `LIVE` | Notes |
|----------------|-------------------|:------:|:-------:|:------:|:------:|-------|
| Persona gateway / role routing | (not built) | ❌ | ❌ | ❌ | ❌ | P1 priority |
| Advisor home + Intelligent RO | RepairOrderScreen.jsx, NewROWizard.jsx | ✅ | ✅ | ✅ | ❌ | Full plate→job→approve flow |
| Advisor mobile layout | — | ❌ | ❌ | ❌ | ❌ | Desktop only currently |
| Technician home (iPad) | TechMobileScreen.jsx | ✅ | ✅ | ✅ | ❌ | Phone mockup only |
| Tech DVI entry | DVIScreen.jsx | ✅ | ✅ | ✅ | ❌ | AI photo analysis simulated |
| Car owner magic link auth | — | ❌ | ❌ | ❌ | ❌ | Simulated only |
| Customer portal | CustomerPortalScreen.jsx | ✅ | ✅ | ✅ | ❌ | |
| Customer approval flow | HealthReportScreen.jsx | ✅ | ✅ | ✅ | ❌ | No Twilio send |
| Owner command center | DashboardScreen.jsx | ✅ | ✅ | ✅ | ❌ | |
| Owner AI agent | WrenchIQAgent.jsx, AICopilotScreen.jsx | ✅ | ✅ | ✅ | ❌ | Responses hardcoded |
| VP Ops 100-location view | MultiLocationScreen.jsx | ✅ | ✅ | ✅ | ❌ | |

---

## Executive Summary

The current WrenchIQ UI attempts to surface every capability at once, creating cognitive overload for all user types. This spec defines a **persona-first entry architecture** inspired by Google's philosophy: a single, calm, purposeful entry point that routes each user to a focused, role-optimized experience.

**Design Principle:** The system knows who you are. Show only what you need. Hide everything else.

---

## The Problem

The existing interface presents a 14-screen left-nav shell to every user equally. A technician on an iPad sees the same nav as a shop owner at their desk. A car owner checking their vehicle's status sees full shop management tools. The result: everyone is overwhelmed, and no one feels at home.

---

## The Solution: Persona Gateway Architecture

### Entry Experience

When a user arrives at WrenchIQ.ai, they see a **single, minimal landing screen** — no nav, no dashboard, no noise. Just the WrenchIQ wordmark, a greeting, and a role selector (or auto-detection via credentials).

```
┌──────────────────────────────────────────┐
│                                          │
│          WrenchIQ.ai                     │
│                                          │
│     Good morning, Peninsula Precision    │
│                                          │
│     ┌──────────┐  ┌──────────┐          │
│     │ Advisor  │  │   Tech   │          │
│     └──────────┘  └──────────┘          │
│     ┌──────────┐  ┌──────────┐          │
│     │  Owner   │  │ My Car   │          │
│     └──────────┘  └──────────┘          │
│                                          │
└──────────────────────────────────────────┘
```

On login, the system auto-detects role from credentials and routes directly. The role picker appears only for multi-role users or unauthenticated demos.

---

## Persona 1: Service Advisor

### Who They Are
Front-desk staff whose entire job is: greet customers, write estimates, open ROs, and get approvals — fast. They are not managing the shop. They are running the counter.

### Design Philosophy
One screen. One flow. The rest is automatic.

### Landing View: Advisor Home

```
┌─────────────────────────────────────────────────┐
│  WrenchIQ.ai          Peninsula Precision   [TK] │
├─────────────────────────────────────────────────┤
│                                                   │
│  Good morning, Alex.  4 vehicles in queue.        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Next Up: Sarah Chen — 2019 Honda Accord    │ │
│  │  "Check engine light on"                    │ │
│  │           [Start Intake]                    │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Today's Board                                    │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐            │
│  │ In   │ │Diag  │ │Appro-│ │Ready │            │
│  │Queue │ │nosing│ │val   │ │Pickup│            │
│  │  2   │ │  3   │ │  1   │ │  2   │            │
│  └──────┘ └──────┘ └──────┘ └──────┘            │
│                                                   │
└─────────────────────────────────────────────────┘
```

### Core Workflow: Guided RO Creation

The advisor taps "Start Intake" and enters a **linear, wizard-style flow** — never a blank form.

**Step 1 — Customer Lookup / New Customer**
- Type name or phone → instant match from history
- If new: minimal form (name, phone, email — 3 fields only)
- AI pre-fills likely vehicle from phone number (via VIN history)

**Step 2 — Vehicle Confirm**
- Shows vehicle card: year/make/model, mileage, last visit
- One-tap confirm or quick edit
- AI surfaces: "Last visit 6 months ago — due for oil change + tire rotation"

**Step 3 — Complaint Entry**
- Voice-to-text or typed concern
- AI immediately translates to: likely cause, estimated labor time, typical parts
- Example: "Check engine light" → P0420 Cat Converter, 1.5hr labor, $380–$680 parts range

**Step 4 — Intelligent Estimate (Automatic)**

This is the "Intelligent 2.0" feature. No manual parts lookup.

- AI auto-queries all connected parts vendors (Worldpac, O'Reilly, PartsTech, etc.)
- Displays best price, availability, and margin for each line item
- Advisor sees: Customer Price | Your Cost | Margin %
- Can override or accept with one tap
- Estimate assembles in real time as lines are added

```
┌─────────────────────────────────────────────────┐
│  Estimate — Sarah Chen / Honda Accord            │
├─────────────────────────────────────────────────┤
│  Line 1: Catalytic Converter                    │
│    Parts: $387 (Worldpac) ← best price          │
│    Labor: 1.5hr @ $195 = $292                   │
│    Margin: 42%  [Edit]                          │
│                                                  │
│  Line 2: O2 Sensor (upstream)                   │
│    Parts: $89 (O'Reilly)                        │
│    Labor: 0.5hr @ $195 = $97                    │
│    Margin: 38%  [Edit]                          │
│                                                  │
│  Total: $865        [Send to Customer]           │
└─────────────────────────────────────────────────┘
```

**Step 5 — Approval & RO Open**
- One-tap SMS or email to customer with estimate link
- Customer approves on phone (CustomerPortal experience)
- RO auto-opens and appears on tech board — advisor's job is done

### What's Hidden from Advisor
- Analytics, multi-location, supplier rebates, bay management
- Settings, integrations configuration
- Parts catalog raw browse (only AI-assisted lookup)

---

## Persona 2: Technician

### Who They Are
Working in a bay, hands dirty, using an iPad or large-screen phone. They need to see their jobs and log inspection findings — fast, with minimal typing.

### Design Philosophy
Large touch targets. Voice-first. Zero navigation. The work comes to them.

### Landing View: Tech Home (iPad-Optimized)

```
┌─────────────────────────────────────────────────────────┐
│  WrenchIQ                    Marcus   Bay 3   10:42am   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│   My Jobs Today                                          │
│                                                          │
│  ┌───────────────────────┐  ┌───────────────────────┐   │
│  │ RO-1042               │  │ RO-1038               │   │
│  │ 2019 Honda Accord     │  │ 2021 Toyota Camry     │   │
│  │ Cat Converter + O2    │  │ Oil Change + Rotate   │   │
│  │ ● Active              │  │ ○ Up Next             │   │
│  │    [Open DVI]         │  │    [Start]            │   │
│  └───────────────────────┘  └───────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Core Workflow: Multi-Point Inspection (MPI) / DVI Entry

Tapping "Open DVI" launches the inspection workflow — designed for one-handed use on an iPad.

**Inspection Screen Layout**
- Full-screen, category-by-category
- Large YES / WATCH / NO buttons (green/yellow/red) — no small checkboxes
- Camera button on every line item — tap to photograph
- Voice note button on every line item — tap to record

```
┌─────────────────────────────────────────────────────────┐
│  DVI — RO-1042 / Sarah Chen / Honda Accord              │
│  ████████░░░░░░░░  Section 3 of 8: Brakes              │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Front Brake Pads                                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  ✓ Good  │  │ ⚠ Watch  │  │ ✗ Needs  │              │
│  │          │  │          │  │  Service │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                          [📷]  [🎤]     │
│                                                          │
│  Rear Brake Pads                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │  ✓ Good  │  │ ⚠ Watch  │  │ ✗ Needs  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                          [📷]  [🎤]     │
│                                                          │
│              [← Back]         [Next Section →]          │
└─────────────────────────────────────────────────────────┘
```

**AI Assistance for Techs**
- After marking an item "Needs Service," AI auto-suggests: labor code, typical parts, estimated time
- Tech can accept with one tap → instantly appears on advisor's screen as an upsell opportunity
- No typing. The AI writes the recommendation.

**Inspection Sections (Standard 8-Point)**
1. Tires & Wheels
2. Brakes
3. Suspension & Steering
4. Fluids & Filters
5. Belts & Hoses
6. Battery & Electrical
7. Lights & Wipers
8. Engine & Exhaust

**Video DVI**
- "Record Walkaround" button at top — 60-second video attached to RO
- Auto-transcribed and appended to customer health report
- Stored in RO, accessible to customer portal

**Completing the Job**
- "Mark Complete" button when work done
- Prompts for: actual labor time (pre-filled from estimate, adjust if needed)
- Parts used: tap to confirm from estimate or add ad-hoc
- Bay cleared automatically

### What's Hidden from Tech
- Pricing, margins, customer financials
- Multi-location, supplier management
- Customer contact info (name + vehicle only)

---

## Persona 3: Car Owner

### Who They Are
A customer who dropped off their car and is now at work, at home, or getting coffee nearby. They want to know: what's wrong, how much, and when can I pick it up — on their phone, in under 30 seconds.

### Design Philosophy
DoorDash for your car. Real-time, visual, mobile-first. No login friction.

### Entry: Magic Link (No App Required)
- Customer receives SMS: "Your Honda Accord is checked in at Peninsula Precision. Track progress here: [link]"
- Link opens a mobile web view — no app download, no account creation
- Optionally save to home screen as PWA

### Customer Portal Layout (Mobile)

```
┌────────────────────────┐
│  WrenchIQ.ai           │
│  Peninsula Precision   │
├────────────────────────┤
│                        │
│  Your Accord           │
│  2019 Honda Accord     │
│  Lic: 7ABC123          │
│                        │
│  ●───●───○───○         │
│  In   Diag  Appr  Ready│
│                        │
│  Status: Being Diagnosed│
│  Tech: Marcus           │
│  Est. Ready: 2:30 PM   │
│                        │
├────────────────────────┤
│  What We Found         │
│                        │
│  ⚠ Needs Service (2)  │
│  ┌──────────────────┐  │
│  │ Catalytic Conv.  │  │
│  │ $865 est.        │  │
│  │ [View Details]   │  │
│  └──────────────────┘  │
│  ┌──────────────────┐  │
│  │ Front Brake Pads │  │
│  │ $320 est.        │  │
│  │ [View Details]   │  │
│  └──────────────────┘  │
│                        │
│  ✅ All Good (14)      │
│  [See full report]     │
│                        │
├────────────────────────┤
│  Total Estimate        │
│  $1,185                │
│  ┌──────────────────┐  │
│  │  APPROVE ALL     │  │
│  └──────────────────┘  │
│  [Approve selected]    │
│  [Decline for now]     │
│  [Call shop]           │
│                        │
├────────────────────────┤
│  Pickup Options        │
│  [Request Lyft]        │
│  [Notify when ready]   │
└────────────────────────┘
```

### Real-Time Progress
- Each status change triggers an SMS push notification (no app required)
- Progress bar updates live on the page
- "Tech is performing your inspection now" → shows live (anonymized) tech activity feed

### Approval Flow
- Customer taps "Approve All" or selects individual items
- Digital signature on phone
- Confirmation SMS + email
- RO status updates instantly in shop

### Customer-Facing Health Report
- Clean, visual (no shop jargon)
- Traffic-light system: Green / Yellow / Red
- Each red/yellow item has: what it is, why it matters, cost, and a 1-sentence plain-English explanation
- Video from tech walkaround embedded (30-60 sec)
- Can share report with family member for second opinion

### What's NOT Shown to Car Owner
- Shop's cost, margins, parts vendors
- Other customers' vehicles
- Internal RO details, tech names/last names
- Any financial data beyond their own estimate

---

## Persona 4: Shop Owner

### Who They Are
The owner of a 1–100 location operation. They think in dollars, efficiency, and customer relationships. They are not doing intake or inspections — they are commanding the business.

### Design Philosophy
An intelligent agent that manages the shop for you. You ask questions. It answers. You give direction. It executes.

### Landing View: Owner Command Center

```
┌─────────────────────────────────────────────────────────┐
│  WrenchIQ.ai — Peninsula Precision        Tilak  Sat    │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Today at a Glance             ← refreshes every 60s    │
│                                                          │
│  Revenue            Vehicles       Avg Ticket           │
│  $4,280 / $6,500    9 in shop      $475                 │
│  ████████░░ 66%     3 in queue     ▲ $42 vs last Sat    │
│                                                          │
│  Bay Utilization    Approval Rate  CSI (30d)            │
│  5/6 bays active    87%            4.8 ★                │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  WrenchIQ Agent                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │ "You're on track for your best Saturday in      │    │
│  │ 3 months. RO-1041 (David Kim, Volvo) has been   │    │
│  │ waiting for approval 47 min — want me to send   │    │
│  │ a nudge? Also, O'Reilly has a rebate expiring   │    │
│  │ Sunday — you've ordered $1,240 eligible."       │    │
│  └─────────────────────────────────────────────────┘    │
│  [Yes, send nudge]  [Show rebate]  [Ask something else] │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  Live Bay View                                           │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐            │
│  │ B1 │ │ B2 │ │ B3 │ │ B4 │ │ B5 │ │ B6 │            │
│  │ RO │ │ RO │ │ RO │ │ RO │ │ RO │ │OPEN│            │
│  │1042│ │1038│ │1041│ │1039│ │1044│ │    │            │
│  │ 2h │ │45m │ │ 3h │ │30m │ │ 1h │ │    │            │
│  └────┘ └────┘ └────┘ └────┘ └────┘ └────┘            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Agent Interaction Model

The WrenchIQ Agent for the shop owner works as a **proactive advisor + command executor**.

**Proactive alerts (pushed to owner):**
- "RO-1041 has been waiting for customer approval 45+ minutes. Nudge?"
- "Tech Mike is averaging 2.1 hrs on jobs estimated at 1.5 hrs. Pattern forming."
- "You're $1,800 short of today's target. 3 customers in queue — want to offer a Quick Lane special?"
- "O'Reilly rebate cycle ends Sunday. $1,240 eligible purchases this month."

**Natural language commands:**
- "What's my best tech today?" → ranked by efficiency + upsell conversion
- "Move the Volvo to Bay 2" → bay assignment updated
- "Pull up all open approvals" → approval queue shown
- "What's my Worldpac spend this month vs last?" → inline chart

### Module: Supplier & Rebate Management

Accessible via "Suppliers" tab or agent command.

```
┌─────────────────────────────────────────────────────────┐
│  Supplier Intelligence                                   │
├─────────────────────────────────────────────────────────┤
│  Active Rebates                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ O'Reilly — March Promo            Expires Mar 22   │ │
│  │ Eligible spend: $1,240 / $1,500 threshold          │ │
│  │ Rebate: $75 cash back                              │ │
│  │ [View items]  [Order $260 more to qualify]         │ │
│  └────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Worldpac — Q1 Volume Bonus                         │ │
│  │ YTD spend: $18,400 / $20,000 threshold             │ │
│  │ Bonus: $400 at quarter end                         │ │
│  │ [View terms]                                       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  Spend by Vendor (March)                                 │
│  Worldpac  ████████████ $6,200                          │
│  O'Reilly  ████████     $4,100                          │
│  PartsTech ████         $1,900                          │
│  NAPA      ██           $890                            │
└─────────────────────────────────────────────────────────┘
```

### Module: Margin Management

```
┌─────────────────────────────────────────────────────────┐
│  Margin Dashboard                                        │
├─────────────────────────────────────────────────────────┤
│  This Week          Target     Actual    Delta           │
│  Parts Margin       45%        41%       ▼ -4%          │
│  Labor Margin       78%        76%       ▼ -2%          │
│  Blended            62%        58%       ▼ -4%          │
│                                                          │
│  Margin Leaks (AI-detected)                             │
│  ● 3 ROs used Advance Auto when Worldpac was $22/ea     │
│    cheaper — estimated leak: $66 this week              │
│  ● 2 labor jobs under-estimated — actual 2.3hr avg      │
│    vs 1.8hr booked. Recommend updating labor matrix.    │
│                                                          │
│  [Fix labor matrix]  [Set vendor priority rules]        │
└─────────────────────────────────────────────────────────┘
```

### Module: Bay Management

Visual drag-and-drop bay scheduler (same as SmartSchedulingScreen but owner-focused with capacity metrics).

- View: current occupancy, projected completion times, queue depth
- Action: reassign vehicles, mark bay as out-of-service, add lift notes
- AI recommendation: "Bay 3 tech is behind — suggest moving RO-1041 to Bay 6 (Marcus is ahead)"

### Module: Customer Queue & Trust

- Full queue with priority flags (VIP customers, long-wait alerts, unapproved estimates)
- Customer trust scores visible at a glance
- "At-risk" customers flagged (e.g., second complaint, long wait, declined service)
- One-tap: send personal message from owner to customer

### What's Accessible Only to Owner
- Revenue targets and actuals
- Margin and pricing configuration
- Tech performance benchmarks
- Supplier rebate management
- Multi-location roll-up (if applicable)
- Staff management (hours, bay assignments)

---

## Routing Architecture

### Authentication & Role Detection

```
Login
  ↓
Role from credentials?
  ├── advisor   → Advisor Home (guided flow)
  ├── tech      → Tech Home (job list + DVI)
  ├── owner     → Owner Command Center
  └── customer  → Customer Portal (magic link, no login)

Multi-role user (e.g., owner who also writes estimates):
  → Role picker on login, remembers last selection
```

### URL Structure

| Route | Persona |
|-------|---------|
| `/advisor` | Service Advisor home |
| `/tech` | Technician home (iPad) |
| `/owner` | Shop Owner command center |
| `/car/:token` | Customer portal (magic link) |
| `/admin` | Full legacy UI (power users / IT) |

The `/admin` route preserves the full 14-screen experience for advanced users and system configuration. It is not promoted in any persona flow.

---

## Navigation Philosophy

### Persona-Specific Navigation

Each persona has its own minimal navigation — never the full 14-screen left nav.

**Advisor nav (5 items max):**
Queue | Active ROs | Estimates | Messages | [+ New RO]

**Tech nav (3 items max):**
My Jobs | Completed | [Scan VIN]

**Owner nav (5 items max):**
Today | Bays | Suppliers | Team | Reports

**Customer:** No navigation — single-page progressive disclosure

### Accessing Other Capabilities

Each persona has an escape hatch — a discrete "More" or settings icon that reveals additional tools. It is never the default view. The default is always the most important 20% of features.

---

## AI Integration Points by Persona

| Feature | Advisor | Tech | Owner | Customer |
|---------|---------|------|-------|----------|
| Parts auto-pricing | Primary | — | Visibility | — |
| Complaint → diagnosis | Primary | Reference | — | — |
| Inspection AI suggestions | — | Primary | — | — |
| Revenue forecasting | — | — | Primary | — |
| Margin leak detection | — | — | Primary | — |
| Rebate optimization | — | — | Primary | — |
| Approval nudges | Notified | — | Controls | — |
| Plain-English report | — | — | — | Primary |
| Wait time estimates | Secondary | — | — | Primary |

---

## Key Metrics for Success

| Metric | Baseline Goal |
|--------|---------------|
| Time to open new RO | < 3 minutes (from greeting to sent estimate) |
| Tech DVI completion rate | > 90% of inspections fully documented |
| Customer approval rate | > 85% same-day approvals |
| Owner daily logins | > 5 sessions/day (ambient monitoring) |
| Parts margin capture | +3–5% improvement from auto-pricing |
| Rebate capture rate | > 80% of eligible rebates redeemed |

---

## Implementation Notes

### Phase 1 — Persona Routing (Foundation)
- Auth-based role detection and routing
- Advisor home + guided RO wizard
- Customer portal (magic link, progress tracking)

### Phase 2 — Tech DVI (Workflow)
- iPad-optimized inspection UI
- Voice notes, photo capture
- AI-suggested line items from inspection findings

### Phase 3 — Owner Intelligence (Agent)
- Command center dashboard
- WrenchIQ Agent proactive alerts
- Supplier rebate module
- Margin intelligence

### Phase 4 — Full Persona Maturity
- Natural language owner commands
- Cross-persona notifications (tech finding → advisor upsell → customer approval loop)
- Multi-location owner roll-up

---

## Open Questions

1. **Single-app vs separate apps:** Should Technician be a separate PWA optimized for iPad, or a responsive route within the main app? Recommendation: responsive route first, extract to standalone PWA in Phase 2.

2. **Owner multi-location:** Should the Owner persona auto-detect single-shop vs multi-location and adjust the command center accordingly? Yes — same shell, different data scope.

3. **Advisor vs Service Writer title:** Some shops use "Service Writer" — UI copy should be configurable per shop.

4. **Customer portal authentication:** Magic link is frictionless but expires. For repeat customers, offer optional account creation post-visit for history access.
