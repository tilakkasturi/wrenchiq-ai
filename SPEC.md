# WrenchIQ Proactive Recommendations Engine — Specification

## Overview

The Proactive Recommendations Engine adds an AI-driven insight layer to the WrenchIQ Agent that
surfaces time-sensitive, actionable recommendations to shop staff without requiring them to ask.
Recommendations are computed by a new backend endpoint that receives a full shop snapshot, applies
LLM reasoning, and returns persona-aware insights covering bay utilization, revenue opportunities,
customer risk signals, and operational anomalies. Results are cached in MongoDB with a time-based
TTL, surfaced in the Agent panel as the hub, and echoed inline on relevant screens for high-priority
items. The feature targets all three WrenchIQ personas (Owner, Advisor, Tech) with content framed
differently per role even when the underlying signal is the same.

---

## Goals

- Surface at least one relevant recommendation within 1–3 seconds of the Agent panel opening.
- Cover all four signal domains: bay/tech utilization, revenue opportunities, customer risk, and
  operational anomalies.
- Present persona-aware content — same signal, different framing for Owner vs Advisor vs Tech.
- Inline high-priority recommendations contextually on the relevant screen (RO card, dashboard, etc.)
  in addition to the Agent panel hub.
- Gracefully degrade to rule-based frontend fallback when the backend is unavailable.
- Cache results in MongoDB with a TTL so subsequent loads within the window are instant.

---

## Non-Goals

- Users cannot configure or tune which signals they care about.
- No push notifications, mobile alerts, or email — in-app display only.
- The agent does not execute actions (no sending texts, updating ROs, or assigning bays) — insights
  only.
- No per-user dismissal history or "snooze" functionality.
- No real-time streaming or websocket push of new recommendations mid-session.

---

## Users & Personas

| Persona | Context | Framing |
|---------|---------|---------|
| **Owner** | Desktop, strategic view — cares about margin, ELR, throughput | Revenue/margin language: "You're leaving $X on the table", "ELR is 12% below target" |
| **Advisor** | Desktop at service desk, customer-facing — cares about satisfaction, upsell, wait time | Customer/relationship language: "Sarah Chen has been waiting 2.4 hrs — check in now", "3 declined services this week from repeat customers" |
| **Tech** | Mobile-first, job execution — cares about workload fairness and clarity | Workload language: "Bay 3 has been idle 40 min — you have an unassigned job matching your certifications" |

All three personas see recommendations when they open the Agent panel. The signal detection logic is
shared; only the copy/framing changes per persona.

---

## User Flows

### Flow 1 — Agent Panel Hub

1. User opens the WrenchIQ Agent panel (bottom-right fixed panel).
2. App fires `POST /api/recommendations` with the current shop snapshot.
3. A skeleton loader appears in the recommendations section (1–3 second wait).
4. Backend returns a ranked list of recommendations; the panel renders them.
5. User clicks a recommendation card to expand the drill-down view.
6. Drill-down shows: LLM-generated natural language explanation + key supporting metrics inline.
7. User reads the insight and acts manually elsewhere in the app.
8. User collapses the drill-down or opens another recommendation.

### Flow 2 — Contextual Inline (High-Priority)

1. When the recommendations response arrives, items flagged `priority: high` are injected into
   the relevant screen component (e.g. a revenue alert badge on a specific RO card in
   RepairOrderScreen, an efficiency callout on the DashboardScreen bay grid).
2. Inline items are visually distinct (accent border, icon) but non-blocking.
3. Clicking the inline item opens the drill-down detail in the Agent panel.
4. An X button on the badge dismisses it for the session (React context only — clears on page reload).

### Flow 3 — Backend Unavailable (Fallback)

1. `POST /api/recommendations` fails or times out (>3 seconds).
2. Frontend silently runs the rule-based fallback engine against `demoData`.
3. Fallback recommendations are displayed with no error state shown to the user.
4. A small "Offline mode" label appears only in dev/debug builds.

---

## Data Model

### Recommendation Object

```js
{
  id: String,               // UUID
  shopId: String,           // e.g. "peninsula-precision"
  generatedAt: ISO8601,     // when this batch was computed
  ttlExpiresAt: ISO8601,    // generatedAt + TTL (e.g. 15 min)
  recommendations: [
    {
      id: String,           // UUID per item
      domain: Enum,         // "utilization" | "revenue" | "customer_risk" | "anomaly"
      priority: Enum,       // "high" | "medium" | "low"
      screenContext: [String], // screen IDs where this should surface inline, e.g. ["orders", "dashboard"]
      personas: {
        owner:   { headline: String, explanation: String, metrics: Object },
        advisor: { headline: String, explanation: String, metrics: Object },
        tech:    { headline: String, explanation: String, metrics: Object }
      },
      signal: Object        // raw signal data that triggered this (for fallback parity)
    }
  ]
}
```

### MongoDB Collection: `recommendations`

- One document per shop per TTL window.
- Index on `{ shopId: 1, ttlExpiresAt: 1 }`.
- Backend checks TTL on read; recomputes and overwrites if expired.

---

## MongoDB Source Collections

The snapshot is built server-side from two live collections in the `wrenchiq` database at `172.16.80.7:27017`.

| Collection | Schema style | Purpose |
|---|---|---|
| `RepairOrder` | camelCase | Primary source — rich demo data with all numeric fields populated (margins, ELR, declined services, customer enrichment) |
| `wrenchiq_ro` | snake_case | Imported production data — has vehicle VCDB normalization, `service_category`, and `knowledge_graph`, but many numeric fields are NULL (see Data Gaps below) |

The backend query merges both: `RepairOrder` supplies operational/financial signals; `wrenchiq_ro` supplies `vehicle.vcdb.vehicle_origin`, `service_category`, and `knowledge_graph` joined on `ro_number`.

---

## API / Interface Contract

### `POST /api/recommendations`

**Request body** — field names match the `RepairOrder` collection exactly:
```json
{
  "shopId": "shop-001",
  "persona": "owner" | "advisor" | "tech",
  "snapshot": {
    "repairOrders": [
      {
        "id": "RO-2023-0001",
        "roNumber": "RO-2023-0001",
        "status": "open" | "closed" | "waiting",
        "kanbanStatus": "string",
        "bay": Number,
        "dateIn": "ISO8601",
        "promisedDate": "ISO8601",
        "waitingSince": "ISO8601 | null",
        "techId": "tech-002",
        "techName": "Mike Reeves",
        "techRate": Number,
        "advisorId": "adv-001",
        "customerName": "string",          // re-injected client-side, NOT sent to LLM
        "customerId": "cust-003",
        "loyaltyTier": "loyal" | "returning" | "new",
        "customerVisitCount": Number,
        "customerApprovalRate": Number,    // 0–1
        "customerLTV": Number,
        "serviceType": "string",
        "comebackRO": Boolean,
        "services": [
          {
            "opCode": "LOF-SYN",
            "description": "string",
            "laborHrs": Number,            // book/flat hours
            "actualHrs": Number,           // clocked hours — SYNTHETIC (see Data Gaps)
            "clockIn": "ISO8601 | null",   // MISSING FROM DB — needs synthetic backfill
            "clockOut": "ISO8601 | null",  // MISSING FROM DB — needs synthetic backfill
            "laborRate": Number,
            "laborTotal": Number,
            "partsCost": Number,
            "partsCharged": Number,
            "total": Number,
            "status": "complete" | "in_progress" | "pending"
          }
        ],
        "declinedServices": [
          {
            "opCode": "string",
            "description": "string",
            "laborHrs": Number,
            "laborTotal": Number,
            "partsCharged": Number,
            "totalIfDone": Number
          }
        ],
        "declinedTotal": Number,
        "totalFlaggedHrs": Number,
        "totalActualHrs": Number,
        "effectiveLaborRate": Number,
        "totalEstimate": Number,
        "totalLabor": Number,
        "totalPartsCharged": Number,
        "totalPartsCost": Number,
        "grossMarginDollars": Number,
        "grossMarginPct": Number,
        "partsMargin": Number,
        "laborMargin": Number,
        "approvalTimeMin": Number,
        "dtcs": ["string"],
        "vehicle_origin": "JAPANESE" | "GERMAN" | "DOMESTIC_US" | "OTHER",  // from wrenchiq_ro join
        "service_category": "string"                                          // from wrenchiq_ro join
      }
    ],
    "repairOrderHistory": [ /* same shape, last 7 days of closed ROs */ ],
    "parts": [
      {
        "description": "string",
        "parts_category": "string",
        "parts_subcategory": "string",
        "unit_price": Number,              // NULL in wrenchiq_ro — SYNTHETIC (see Data Gaps)
        "quantity": Number,
        "line_cost": Number                // NULL in wrenchiq_ro — SYNTHETIC (see Data Gaps)
      }
    ],
    "metrics": {
      "shopLaborRate": 195,                // shop.labor_rate from wrenchiq_ro
      "targetELR": Number,                 // from SHOP config in demoData
      "actualELR": Number,                 // computed from RepairOrder.effectiveLaborRate
      "avgWaitTime": Number,               // computed from waitingSince for open ROs
      "last7DaysRevenue": [Number],        // daily totals, oldest → newest, from RepairOrder
      "last7DaysELR": [Number]
    }
  }
}
```

**Response (200):**
```json
{
  "cached": Boolean,
  "generatedAt": "ISO8601",
  "ttlExpiresAt": "ISO8601",
  "recommendations": [ ...RecommendationItem ]
}
```

**Error responses:**
- `503` — LLM/compute failure; frontend triggers rule-based fallback.
- `400` — Malformed snapshot; frontend triggers rule-based fallback.

---

## UI/UX Spec

### Agent Panel — Recommendations Section

- **Loading state:** Three skeleton cards (gray shimmer) while awaiting backend response.
- **Loaded state:** Vertical list of recommendation cards, sorted by `priority` (high → low).
  - Card: domain icon + headline (persona-aware) + priority badge.
  - High-priority cards have an accent-left border in `#FF6B35`.
- **Drill-down state:** Card expands in-place (no modal) to show explanation + metrics.
  - Metrics rendered as small inline stat chips (e.g. "ELR: $147 / target $165").
  - Collapse on second click or clicking another card.
- **Empty state:** "No active recommendations — shop is running smoothly." with a refresh icon.
- **Fallback state:** Identical to loaded state; no visual differentiation from backend results.

### Contextual Inline (High-Priority Only)

- A small pill/badge appears on the relevant card or section header.
- Example: RepairOrderScreen Kanban — an RO card with a declined-service revenue opportunity shows
  an orange `$` badge in the top-right corner.
- Clicking the badge opens the Agent panel scrolled to that recommendation's drill-down.

---

## Technical Architecture

```
Browser (React)
│
├── WrenchIQAgent.jsx
│   ├── useRecommendations(shopSnapshot, persona)
│   │   ├── POST /api/recommendations  ──→  server/routes/recommendations.js
│   │   │                                    ├── Check MongoDB cache (TTL)
│   │   │                                    ├── If fresh: return cached doc
│   │   │                                    └── If stale/missing:
│   │   │                                         ├── Call LLM (Claude API)
│   │   │                                         ├── Write to MongoDB
│   │   │                                         └── Return response
│   │   └── On failure (503/timeout): run ruleBasedFallback(shopSnapshot)
│   │
│   └── RecommendationCard.jsx (expandable drill-down)
│
├── Screen components (RepairOrderScreen, DashboardScreen, etc.)
│   └── Consume recommendations context → render inline badges for priority:high items
│
└── RecommendationsContext.jsx  (React context — shares fetched results across components)

Server
├── routes/recommendations.js    POST handler
├── services/recommendationLLM.js  Claude API call + prompt construction
└── models/Recommendation.js     Mongoose schema

Frontend fallback
└── src/services/recommendationFallback.js  Pure JS rule engine against demoData
```

---

## Edge Cases & Error Handling

| Scenario | Handling |
|----------|----------|
| Backend responds in >3s | Abort request; run `recommendationFallback.js` |
| Backend returns 503 | Run fallback; no error shown to user |
| Backend returns 400 (bad snapshot) | Log to console; run fallback |
| MongoDB write fails | Still return the LLM response to the user; log the write failure |
| LLM returns malformed JSON | Backend catches parse error, returns 503; frontend falls back |
| Snapshot is empty (new shop, no ROs) | Backend returns empty recommendations array; frontend shows "running smoothly" empty state |
| Persona not in response for a domain | Omit that recommendation item; don't render a broken card |
| TTL window is active but LLM was wrong | No mechanism to force-refresh in v1 — user must wait for TTL to expire |

---

## Security & Permissions

- The `/api/recommendations` endpoint is internal — same auth as all other server routes (session
  cookie or API key, consistent with existing server setup).
- Shop snapshots contain PII (customer names, vehicle data) — must not be logged at the server layer
  beyond debug mode.
- LLM prompts must not include raw customer PII; use anonymized identifiers (customer ID, not name)
  in the prompt, with names re-injected client-side from the snapshot for display.
- MongoDB documents should be encrypted at rest consistent with existing shop data policy.

---

## Performance & Scale

| Metric | Target |
|--------|--------|
| End-to-end latency (cache hit) | < 200ms |
| End-to-end latency (cache miss / LLM call) | 1–3 seconds |
| TTL window | 15 minutes (configurable via env `RECOMMENDATIONS_TTL_MIN`) |
| Model | claude-haiku-4-5-20251001 |
| LLM token budget per request | ~3,500 tokens input (snapshot + 7-day history) / ~500 tokens output |
| Concurrent requests | Low — single-shop demo context; no rate-limit concern in v1 |

Cache strategy: read-through. On request, check MongoDB for a non-expired document for `shopId`.
If found, return immediately. If not, compute synchronously (blocking the request), write to
MongoDB, and return. No background job needed in v1.

**Decisions locked:**
- Model: `claude-haiku-4-5-20251001`
- TTL: 15 minutes (`RECOMMENDATIONS_TTL_MIN=15`)
- Snapshot window: today's ROs + 7-day history + parts/inventory
- Inline badges: dismissible per-item via an X button; dismissed state stored in React context (session-only, not persisted to MongoDB)

---

## Open Questions

| Question | Owner | Notes |
|----------|-------|-------|
| None remaining | — | All decisions resolved. |

---

## Data Gaps — Synthetic Backfill Required

These fields are needed by the recommendations engine but are missing or null in the live MongoDB
collections. Each must be filled with realistic synthetic data and kept in sync via the import scripts.

### Fields missing from BOTH collections (net-new, highest priority)

| Field | Location | Why needed | Synthetic rule |
|---|---|---|---|
| `services[].clockIn` | `RepairOrder.services[]` | Bay utilization — is tech actively working? | For `in_progress` lines: `clockIn = dateIn + random(0–20min)`; no `clockOut` |
| `services[].clockOut` | `RepairOrder.services[]` | Elapsed time vs. book hours | For `complete` lines: `clockOut = clockIn + actualHrs * 3600s` |

### Fields null in `wrenchiq_ro` (need synthetic values in import scripts)

| Field | Path in `wrenchiq_ro` | Why needed | Synthetic rule |
|---|---|---|---|
| `labor_hours` | `repair_jobs[].labor_hours` | Book/flat hours per job line | Derive from `invoice` ÷ `shop.labor_rate`; distribute across jobs by description |
| `actual_labor_hours` | `repair_jobs[].actual_labor_hours` | Actual clocked hours | `labor_hours * tech_efficiency` (efficiency from TECHNICIANS map in import script) |
| `labor_rate` | `repair_jobs[].labor_rate` | Per-line labor rate | Copy from `shop.labor_rate` |
| `line_cost` | `repair_jobs[].line_cost` | Per-job revenue | `labor_rate * labor_hours` |
| `unit_price` | `repair_jobs[].parts[].unit_price` | Parts revenue | Estimate from `parts_category` lookup table (e.g. Oil/Fluids → $8–$45) |
| `line_cost` | `repair_jobs[].parts[].line_cost` | Parts line total | `unit_price * quantity` |
| `totalFlatHrs` | `labor_time_tracking.totalFlatHrs` | Total book hours for ELR | Sum of `repair_jobs[].labor_hours` |
| `totalActualHrs` | `labor_time_tracking.totalActualHrs` | Total actual hours for efficiency | Sum of `repair_jobs[].actual_labor_hours` |
| `elr` | `labor_time_tracking.elr` | Effective labor rate | `invoice / totalActualHrs` (guard divide-by-zero → 0) |

### Fields in `RepairOrder` missing from `wrenchiq_ro` (enrichment needed in import scripts)

| Field | Why needed | Synthetic rule |
|---|---|---|
| `declinedServices[]` | Revenue opportunity signal — highest-value recommendation domain | Generate 0–2 declined services per RO from a lookup table keyed by `service_category`; assign realistic `totalIfDone` values |
| `declinedTotal` | Aggregate declined revenue per RO | Sum of `declinedServices[].totalIfDone` |
| `customerVisitCount` | Customer loyalty / risk signal | Random 1–12; higher for `loyal` tier |
| `loyaltyTier` | Customer segmentation | Derive from `customerVisitCount`: 1 = new, 2–4 = returning, 5+ = loyal |
| `customerApprovalRate` | Measures how often customer approves estimates | Random 0.6–1.0; loyal customers skew higher |
| `customerLTV` | Total customer lifetime value | `customerVisitCount * avgInvoice * (0.9 + random*0.3)` |
| `comebackRO` | Operational quality signal | Random ~5% of ROs flagged true |
| `grossMarginDollars` | Owner revenue health signal | `invoice - (labor cost + parts cost)` |
| `grossMarginPct` | Margin as % | `grossMarginDollars / invoice * 100` |

### Import script changes required

| Script | Change |
|---|---|
| `scripts/importRepairOrders.js` | Backfill all null `repair_jobs[]` numeric fields using tech efficiency map; compute `labor_time_tracking` totals; add `declinedServices`, customer enrichment fields |
| `scripts/seedRepairOrders.js` | Add `clockIn`/`clockOut` to `services[]` for in-progress and complete lines; ensure `declinedServices` present on all seeded ROs |
| `scripts/importFromProd.js` | Same numeric backfill as `importRepairOrders.js` for prod source data |
| `scripts/lib/vehicleNormalizer.js` | No changes needed — `vehicle_origin` already populated correctly |

---

## Out of Scope

- User configuration or tuning of which signals surface.
- Push notifications, email alerts, or mobile OS notifications.
- Agent action execution (sending texts, updating RO status, assigning bays).
- Per-user dismissal history or snooze functionality.
- Real-time streaming / websocket delivery of new recommendations.
- Multi-shop / corporate rollup recommendations (single shop only in v1).
