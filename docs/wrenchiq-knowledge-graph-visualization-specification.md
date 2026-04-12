# WrenchIQ.ai — Knowledge Graph Visualization Specification

**Version:** 1.0
**Date:** 2026-03-29
**Author:** Predii, Inc.
**Status:** Draft
**Confluence:** NextGen Project Hub > Knowledge Graph Visualization

---

## 1. Design Philosophy

The Predii Knowledge Graph contains hundreds of nodes and edges per repair order. The challenge of visualization is not showing everything — it is showing the *right fragment* at the *right moment* to the *right persona*.

### Core Principle: Two Surfaces, One Graph

| Surface | Purpose | Scope | User |
|---------|---------|-------|------|
| **Service Advisor Agent — Contextual Cards** | Real-time, task-relevant graph fragments embedded in the workflow | Current RO / Customer / Vehicle | Service Advisor, Technician |
| **Knowledge Graph Explorer — Dedicated Screen** | Interactive deep-dive, aggregate analytics, management visibility | Full shop graph | Owner, Manager, Advisor (deep research) |

The two surfaces draw from the same PKG. The Agent surface is *narrow and focused*; the Explorer is *wide and navigable*. The agent can deeplink into the Explorer when the advisor needs more.

---

## 2. Surface 1: Service Advisor Agent — Contextual Graph Cards

### 2.1 Placement and Layout

The Service Advisor Agent panel is fixed at the bottom-right of every screen (300px wide). The existing panel sections — AI Suggestions, Revenue Pipeline, Live Feed — are augmented with a **Graph Context** section that renders contextual mini-cards.

```
┌─────────────────────────────┐
│  WrenchIQ Agent             │
│  ─────────────────────────  │
│  AI Suggestions             │  ← existing
│  ─────────────────────────  │
│  Graph Context          [▾] │  ← NEW section
│  ┌─────────────────────┐    │
│  │ [Card: Customer]    │    │
│  │ [Card: Vehicle]     │    │
│  │ [Card: Bay + Tech]  │    │
│  │ [Card: TSBs]        │    │
│  │ [Card: Parts Risk]  │    │
│  └─────────────────────┘    │
│  ─────────────────────────  │
│  Revenue Pipeline           │  ← existing
│  ─────────────────────────  │
│  Live Feed                  │  ← existing
└─────────────────────────────┘
```

The **Graph Context** section is collapsible. Cards are rendered in priority order based on active AI insights and current screen context.

---

### 2.2 Contextual Graph Card Types

Each card is a compact (60–80px tall) summary of one graph node cluster, rendered with an icon, key metrics, and a deeplink arrow.

---

#### Card 1 — Customer Graph Card

**Trigger:** Any screen with an active customer or RO.

```
┌─────────────────────────────────┐
│ 👤 Sarah Chen                   │
│ 14 visits · $8,420 LTV          │
│ ████████░░  Trust: 92           │
│ Next due: Sep 2024 · Low churn  │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** Customer → RO history summary → ChurnRiskScore → nextServiceDueAt

**Deeplink:** Opens Customer timeline view in the Knowledge Graph Explorer, pre-filtered to this customer.

---

#### Card 2 — Vehicle Graph Card

**Trigger:** Any screen with an active vehicle/RO.

```
┌─────────────────────────────────┐
│ 🚗 2021 Honda Civic EX          │
│ 62,402 mi · Japanese · FWD      │
│ ⚠ 1 Open TSB · 60k svc due     │
│ Avg RO value: $520              │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** Vehicle → YMME → open TSBs (count + severity) → nextOMS

**Deeplink:** Opens Per-RO subgraph in the Explorer, centered on this vehicle.

**Inline expand (click ⚠):** Expands TSB list inline within the card — title, severity, labor hours, one-click "Add to RO".

---

#### Card 3 — Bay + Technician Assignment Card

**Trigger:** Any active RO with a BayAssignment.

```
┌─────────────────────────────────┐
│ 🔧 Bay 3 · Marco Rivera         │
│ In bay: 1h 24m                  │
│ Est. completion: 12:45pm        │
│ Tech expertise: Japanese ★★★★★  │
│ German ★★★☆☆ · Elec ★★★★☆      │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** BayAssignment → Bay → Technician (expertise scores for current vehicle origin)

**Color coding:**
- Green: expertise score ≥ 8.0 for current vehicle origin
- Yellow: 6.0–7.9
- Red: < 6.0 → triggers `TECHNICIAN_MISMATCH` insight

**Deeplink:** Opens Technician expertise radar chart in the Explorer.

**Inline action (if mismatch):** Shows "Reassign?" button that opens tech selector overlay.

---

#### Card 4 — Open TSB Card

**Trigger:** Vehicle with one or more open TSBs.

```
┌─────────────────────────────────┐
│ ⚠ TSB 21-064 — Honda Fuel Pump  │
│ Severity: SAFETY                │
│ 2020–2022 Civic 1.5T            │
│ Est. labor: 2.0hr · Not billed  │
│ [Add to RO]          [→ Full]   │
└─────────────────────────────────┘
```

**Graph nodes rendered:** TSB → applicableYMMe → laborHours → isRecall

**Deeplink:** Opens TSB detail in Explorer with YMME match history.

**Inline action:** "Add to RO" creates a RepairJob node pre-populated with TSB data.

---

#### Card 5 — Parts Risk Card

**Trigger:** Parts screen, or when a RepairJob has parts with pattern-failure alerts.

```
┌─────────────────────────────────┐
│ ⚠ Parts Risk: 1 alert           │
│ Raybestos Disc Brake Pad Set    │
│ 5.1% comeback · 2019–21 Civic   │
│ → Switch to ATE (Worldpac)      │
│ +$5 spiff · +$3.20 rebate       │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** Part → PartTerm (PTN) → PartFailurePattern → alternative Supplier + Rebate + Spiff

**Deeplink:** Opens Parts Intelligence view in Explorer.

**Inline action:** "Switch" replaces the flagged part with the recommended alternative in one click.

---

#### Card 6 — Rebate Pipeline Card

**Trigger:** Parts screen, or when shop is within 20% of a rebate threshold.

```
┌─────────────────────────────────┐
│ 💰 Worldpac Q1 Rebate           │
│ $4,820 / $5,000 ████████████░   │
│ $180 to go · Ends Mar 31        │
│ This RO: +$3.20 if ATE used     │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** Rebate → currentSpend → thresholdAmount → periodEnd → linked parts on current RO

**Deeplink:** Opens Supplier Rebate dashboard in Explorer.

---

#### Card 7 — Shop Bay Status Card (Dashboard / Home screen only)

**Trigger:** Advisor home screen or dashboard.

```
┌─────────────────────────────────┐
│ 🏭 Bay Status                   │
│ Bay 1 ● Marco · Brakes  1h 20m  │
│ Bay 2 ● James · Engine  0h 45m  │
│ Bay 3 ○ AVAILABLE               │
│ Bay 4 ● Diana · Elec    2h 10m  │
│ Bay 5 ⊘ OUT OF SERVICE          │
│                        [→ Full] │
└─────────────────────────────────┘
```

**Graph nodes rendered:** All Bay nodes → current BayAssignment → Technician → repair category

**Color coding:**
- ● Green: OCCUPIED, on pace
- ● Orange: OCCUPIED, running over estimated time
- ○ Gray: AVAILABLE
- ⊘ Red: OUT_OF_SERVICE

**Deeplink:** Opens Bay utilization heatmap in Explorer.

---

### 2.3 Card Rendering Rules

Cards are rendered dynamically based on context:

| Screen | Cards Shown (in order) |
|--------|----------------------|
| Advisor Home | Bay Status, Rebate Pipeline, Customer VIP alerts |
| New RO / Write-up | Customer, Vehicle, Open TSBs, Bay + Tech |
| DVI Screen | Vehicle, Open TSBs, Customer (declined items history) |
| Parts Screen | Parts Risk, Rebate Pipeline |
| Repair Order Kanban | Bay + Tech (per card), Customer |
| RO Detail | Customer, Vehicle, Bay + Tech, Open TSBs, Parts Risk |

**Max cards visible at once:** 3 (scrollable). Prioritized by active AI insight severity: SAFETY > IMMEDIATE > HIGH > MEDIUM > LOW.

---

### 2.4 Graph Context Panel — Collapsed State

When no active RO is open, the Graph Context section collapses to a single summary line:

```
Graph Context: 3 open TSBs · 2 parts risks · 4/6 bays occupied   [▸]
```

---

### 2.5 Agent Chat with Graph Awareness

When the advisor asks the agent a natural language question, the agent can render a **mini graph answer** inline in the chat bubble — not just text.

**Example:**

```
Advisor: "Which techs are available for a German electrical job?"

Agent:  ┌────────────────────────────────────┐
        │ Available for: German · Electrical  │
        │                                    │
        │ James Park    G:8.9 E:7.8  [Bay 3] │
        │ ████████░░  Available now           │
        │                                    │
        │ Diana Chen    G:7.1 E:6.4  [Bay 5] │
        │ ███████░░░  Free in ~2hr            │
        │                                    │
        │ Marco Rivera  G:6.2 E:8.1  [Bay 1] │
        │ ██████░░░░  Available now           │
        └────────────────────────────────────┘
        James is the strongest match. Assign? [Assign James] [See all]
```

This is a **graph-grounded response** rendered as a structured card instead of a wall of text. The agent pulls Technician expertise scores and BayAssignment status live from the PKG.

---

## 3. Surface 2: Knowledge Graph Explorer — Dedicated Screen

### 3.1 Screen Placement

The Knowledge Graph Explorer is a full-screen dedicated view accessible from:
1. Any "→ Full" deeplink from a Contextual Card in the Agent panel
2. The left navigation as "Graph" (icon: network nodes)
3. Owner/Manager analytics hub

### 3.2 Explorer Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  Knowledge Graph Explorer                   [Search nodes...]  [Filter▾] │
│  ─────────────────────────────────────────────────────────────────── │
│  View:  [Per-RO] [Per-Customer] [Bay Map] [Shop Aggregate] [AI Insights] │
│  ─────────────────────────────────────────────────────────────────── │
│                                                                      │
│                    ┌────────────────────────────────┐               │
│                    │                                │               │
│                    │        GRAPH CANVAS            │               │
│                    │      (interactive)             │               │
│                    │                                │               │
│                    └────────────────────────────────┘               │
│                                                                      │
│  ─────────────────────────────────────────────────────────────────── │
│  Selected Node: [node detail panel — right sidebar, 280px]          │
└──────────────────────────────────────────────────────────────────────┘
```

---

### 3.3 View 1 — Per-RO Subgraph

Centered on one repair order. Shows the complete node neighborhood: customer, vehicle, repair jobs, parts, technician, bay, TSBs, payments.

**Layout:** Force-directed graph with the RepairOrder node at the center.

```
                        [Customer]
                           |
                [Vehicle] ─── [RepairOrder] ─── [Payment]
                   |               |
                 [TSBs]     [RepairJob × N]
                              /     \
                      [LaborOp]   [Part × N]
                          |           |
                    [Technician]  [Supplier]
                          |
                        [Bay]
```

**Node colors:**
- RepairOrder: dark teal (#0D3B45)
- Customer: blue
- Vehicle: slate gray
- RepairJob: orange (#FF6B35) — the 3C atom
- Part: purple
- Technician: green
- Bay: cyan
- TSB: red
- Payment: gold

**Edge labels:** Shown on hover (`HAS_JOB`, `PERFORMED_IN_BAY`, `NORMALIZED_TO`, etc.)

**Click behavior:** Clicking any node opens its full schema in the right sidebar detail panel.

**Actions from Per-RO view:**
- Click RepairJob → view full 3C, add/edit complaint/cause/correction
- Click Part → swap supplier (Parts Intelligence overlay)
- Click TSB → add to RO one-click
- Click Bay → reassign bay
- Click Technician → reassign tech

---

### 3.4 View 2 — Per-Customer Timeline

A horizontal timeline view showing the complete repair history for one customer across all vehicles.

```
     2019        2020        2021        2022        2023        2024
      |           |           |           |           |           |
  ────●───────────●───────────●───────────●───────────●───────────●────
     $320        $485        $890        $240        $650        $936
    Oil chg    Tires      Brakes     Wipers    Suspension   Brakes
               Alignment  Oil chg               Oil chg    Oil chg

  [Honda Civic ──────────────────────────────────────────────────────]
  [Ford Mustang ─────────────────────────────────────────]
```

**Each dot (RO):** Color-coded by repair category. Size = ticket value.

**Hover tooltip:** RO summary — date, mileage, tech, bay, total, 3C summary.

**Overlaid indicators:**
- Red flag: comeback RO
- Orange diamond: declined DVI item (follow-up opportunity)
- Blue pin: open TSB addressed
- Gray pin: open TSB missed

**Below timeline:** Customer metrics bar — LTV, avg ticket, visit frequency, churn score, trust score.

---

### 3.5 View 3 — Bay Map

A visual floor plan of the shop with real-time bay status.

```
┌─────────────────────────────────────────────────────────────────┐
│  Shop Floor — Peninsula Precision Auto                          │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  BAY 1   │  │  BAY 2   │  │  BAY 3   │  │  BAY 4   │       │
│  │ ●OCCUPIED│  │ ●OCCUPIED│  │ ○ AVAIL  │  │⊘ OOS     │       │
│  │  Marco   │  │  James   │  │          │  │ (lift     │       │
│  │  Brakes  │  │  Engine  │  │          │  │  repair)  │       │
│  │  1h 24m  │  │  0h 45m  │  │          │  │           │       │
│  │  ██████░ │  │  ████░░░ │  │          │  │           │       │
│  │  est.done│  │  est.done│  │          │  │           │       │
│  │  12:45pm │  │  11:30am │  │          │  │           │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│                                                                 │
│  ┌──────────┐  ┌──────────┐                                     │
│  │  BAY 5   │  │  BAY 6   │                                     │
│  │ ●PENDING │  │ ●OCCUPIED│                                     │
│  │  Diana   │  │  Carlos  │                                     │
│  │  Align.  │  │  HVAC    │                                     │
│  │  (waiting│  │  3h 10m  │                                     │
│  │   parts) │  │  ██████░ │                                     │
│  └──────────┘  └──────────┘                                     │
│                                                                 │
│  Utilization: 4/6 bays active (67%)  Avg cycle: 1h 42m         │
└─────────────────────────────────────────────────────────────────┘
```

**Progress bar inside each bay:** Time elapsed vs estimated completion (from LaborGuide flat-rate hours).

**Click on occupied bay:** Slides out a panel showing:
- Full RO summary (vehicle, customer, repair jobs in progress)
- Tech expertise match score for this job
- Parts ordered / awaiting
- Any active AI insights for this job

**Drag-and-drop:** Drag a vehicle from one bay to another — creates a BayAssignment reassignment event in the graph with an auto-prompted reason field.

**Historical mode:** Toggle to heatmap view — shows utilization % per bay per hour of day over the last 30/90 days. Identifies chronic idle periods and scheduling gaps.

---

### 3.6 View 4 — Shop Aggregate Graph

A macro-level graph showing the entire shop's entity relationships, filterable by time range, vehicle origin, and repair category.

**Default layout:** Clustered by entity type. Techs cluster together; vehicles cluster by origin (Japanese / German / US); parts cluster by PCdb category.

**Edge rendering:**
- Thick edges = high-volume relationships
- Orange edges = active AI insight (e.g., pattern failure)
- Red edges = comeback link

**Filters:**
- Date range (last 30 / 90 / 365 days)
- Vehicle origin (Japanese / German / US / Korean)
- Repair category (Brakes / Engine / Electrical / HVAC / Suspension)
- Technician
- Supplier

**Aggregate insight overlays** (toggle on/off):
- PTN nodes with comeback rate > 3% highlighted in red
- Technicians with ELR below target highlighted in orange
- Customers with churn risk = HIGH shown as pulsing nodes
- Supplier rebate gap shown as edge weight on Part → Supplier edges

---

### 3.7 View 5 — AI Insights Feed

A filterable, chronological feed of all active AI insight nodes, grouped by type.

```
┌─────────────────────────────────────────────────────────────────────┐
│  AI Insights                     Filter: [All ▾]  [Today ▾]        │
│  ─────────────────────────────────────────────────────────────────  │
│  ● TSB_MATCH (3)                                                    │
│  │  VH-1HGB.. · Honda TSB 21-064 · SAFETY · 3 vehicles in shop     │
│  │  VH-2T1B.. · Toyota TSB 22-011 · MONITOR · in shop today        │
│  │  VH-1FT7.. · Ford TSB 23-041 · SOON · in shop this week         │
│  ─────────────────────────────────────────────────────────────────  │
│  ● SUPPLIER_REBATE_NUDGE (1)                                        │
│  │  Worldpac Q1 · $180 to threshold · ends Mar 31 · 3 ROs today    │
│  ─────────────────────────────────────────────────────────────────  │
│  ● TECHNICIAN_MISMATCH (1)                                          │
│  │  RO-00157 · BMW 5-Series · Marco assigned · German score: 6.2   │
│  │  [Reassign to James Park (8.9)] [Keep Marco]                     │
│  ─────────────────────────────────────────────────────────────────  │
│  ● BAY_IDLE (1)                                                     │
│  │  Bay 3 · Idle 2h 15m during peak hours (9am–12pm)               │
│  ─────────────────────────────────────────────────────────────────  │
│  ● PATTERN_FAILURE (2)                                              │
│  │  PTN-5678 · Raybestos · 5.1% comeback · 2019–21 Civic           │
│  │  PTN-O2-sensor · Bosch · 6.2% comeback · Honda/Toyota           │
└─────────────────────────────────────────────────────────────────────┘
```

Each insight has **one-click actions** inline — no need to navigate to the RO to act.

---

## 4. Interaction Model: Agent ↔ Explorer

The Agent panel and the Explorer are deeply linked. The agent can:

1. **Deeplink into Explorer** — "→ Full" on any card navigates to the relevant Explorer view
2. **Answer graph questions** — when advisor asks "show me this customer's history", the agent renders a mini-timeline card inline, with a "→ Full Timeline" link
3. **Navigate from Explorer back to workflow** — clicking a RepairJob node in Explorer opens the RO detail screen in context
4. **Share graph context** — when the agent surfaces an insight, the advisor can click "Show in Graph" to see that node highlighted in the Explorer

```
Agent Card: [Customer Sarah Chen · 14 visits · $8,420]
                              ↓ "→ Full"
Explorer: Per-Customer Timeline (pre-filtered: Sarah Chen)
                              ↓ click RO dot
RO Detail Screen: RO-20240315-00142
                              ↓ "Ask Agent"
Agent Chat: pre-loaded with Sarah's full RO context
```

---

## 5. Component Architecture

### 5.1 Contextual Cards (Agent Panel)

| Component | Data Source | Update Frequency |
|-----------|-------------|-----------------|
| CustomerGraphCard | PKG: Customer node | On RO open |
| VehicleGraphCard | PKG: Vehicle + TSB nodes | On RO open |
| BayTechCard | PKG: BayAssignment + Bay + Technician | Real-time (30s poll) |
| TSBCard | PKG: TSB nodes matched to vehicle | On RO open |
| PartsRiskCard | PKG: PartFailurePattern + Rebate | On parts screen |
| RebatePipelineCard | PKG: Rebate nodes for shop | Real-time (5min) |
| BayStatusCard | PKG: All Bay nodes | Real-time (30s poll) |

### 5.2 Explorer Views

| View | Library | Key Interactions |
|------|---------|-----------------|
| Per-RO Subgraph | D3.js force-directed / Cytoscape.js | Click node → detail panel; drag to reposition |
| Per-Customer Timeline | Custom SVG (D3.js) | Hover dot → tooltip; click → RO detail |
| Bay Map | SVG floor plan + React state | Click bay → RO panel; drag RO → reassign |
| Shop Aggregate | Sigma.js (large graph) | Filter, cluster, zoom; edge weight = volume |
| AI Insights Feed | React list | One-click actions per insight |

### 5.3 Shared Graph Context Store

Both surfaces read from a shared in-memory context store populated by the PKG API:

```typescript
interface GraphContext {
  currentRO: RepairOrderNode | null;
  currentCustomer: CustomerNode | null;
  currentVehicle: VehicleNode | null;
  currentBayAssignment: BayAssignmentNode | null;
  activeTSBs: TSBNode[];
  activeInsights: InsightNode[];
  bayStatuses: BayNode[];
  partRisks: PartFailurePattern[];
  rebateGaps: RebateNode[];
}
```

The store refreshes on:
- RO open / status change
- DVI completion
- Parts screen open
- Every 30 seconds for Bay + BayAssignment (real-time occupancy)

---

## 6. Responsive Behavior

| Screen Size | Agent Cards | Explorer |
|-------------|-------------|---------|
| Desktop (≥1440px) | Full cards, 300px panel | Full graph canvas |
| Laptop (1024–1439px) | Compact cards, 260px panel | Scrollable graph canvas |
| Tablet (768–1023px) | Collapsed → icon strip | Explorer replaces main content |
| Mobile | Not shown | Bay Map only (tech mobile view) |

---

## 7. Implementation Phases

| Phase | Scope |
|-------|-------|
| **Phase 1** | CustomerGraphCard + VehicleGraphCard in Agent panel |
| **Phase 2** | BayTechCard + BayStatusCard + Bay Map Explorer view |
| **Phase 3** | TSBCard + PartsRiskCard + Per-RO Subgraph Explorer |
| **Phase 4** | RebatePipelineCard + Supplier Rebate Explorer |
| **Phase 5** | Per-Customer Timeline Explorer |
| **Phase 6** | Shop Aggregate Graph + AI Insights Feed Explorer |
| **Phase 7** | Agent Chat graph-grounded responses (inline structured cards) |
| **Phase 8** | Agent ↔ Explorer bidirectional deeplinks |
