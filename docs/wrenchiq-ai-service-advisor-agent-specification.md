# WrenchIQ AI Service Advisor Agent — Product Specification

**Product:** WrenchIQ AI Service Advisor (Add-On)
**Version:** 1.0 (product vision) + Current Implementation Addendum
**Date:** 2026-03-27 (updated 2026-08-11)
**Owner:** Predii, Inc.
**Classification:** PREDII CONFIDENTIAL

---

> **How this doc is organized.** Sections 1–13 are the original v1.0 product vision
> (multi-SMS, phased rollout, autonomous 24/7 monitoring). That is the north star,
> not what runs today. **Section 0** below is the current-state addendum: the exact
> agentic flow that exists in this repo right now — trigger, tool calls, decision
> logic, TSB integration, Shop Intelligence chat, and Transfer-to-SMS — each claim
> cited to file:line. Read Section 0 first if you want "what actually happens when
> an advisor opens an RO in the Sidecar today."

---

## 0. Current Implementation — Exact Agentic Flow (as of this repo, 2026-08-11)

### 0.1 What exists today vs. the v1.0 vision

The shipped system is a **single-shop, Tauri Sidecar app** (`WrenchIQSidecarScreen.jsx`),
not the multi-SMS-adapter, autonomous-24/7 monitoring product described in Sections 1–13.
There is no polling loop, no daily digest, no autonomous alert queue, and no live SMS
write-back. The agent is **request/response**, triggered synchronously when an advisor
opens an RO — not a background monitor.

| Vision (Sections 1–13) | Reality (this repo) |
|---|---|
| Multi-SMS adapters (Tekmetric, Mitchell1, etc.) | One internal RO store (`RepairOrder` / `wrenchiq_ro` Mongo collections) |
| Autonomous monitoring loop, every 5 min | Triggered once per advisor RO-selection (`WrenchIQSidecarScreen.jsx`) |
| `send_customer_message`, `update_ro_status`, `create_appointment` write-back tools | No write-back tools exist. The agent only *reads* and *drafts text* |
| "Transfer to SMS" implies a real DMS/SMS push | **Fully simulated** — an internal RO PATCH dressed up as a transfer (§0.6) |
| Daily digest, insight catalog (REV/CX/OPS/VEH/FIN codes) | Not implemented. No insight-ID catalog exists in code |

### 0.1a System context — where this agent sits (merged from Confluence orchestration doc)

WrenchIQ runs **ten specialized agents** behind one shared LLM gateway
(`server/services/azureOpenAI.js` → `callAzureOpenAI()`), all logged to Mongo's
`llm_request_log`. Source: Confluence — [WrenchIQ — Agent Orchestration & Design
(Implemented)](https://predii.atlassian.net/wiki/spaces/prediiv2/pages/4091412481).
The RO Advisor Agent covered in this doc is **Agent 4** in that inventory:

| Agent | Entry point | Pattern |
|---|---|---|
| 1. Managed Agent | `POST /api/agent/sessions` | In-memory session + SSE stream (name is a holdover — does not call Anthropic's Managed Agents API) |
| 2. RO Agent | `POST /api/ro-agent/draft` | Single call, JSON-by-prompt-instruction |
| 3. ARO Agent | `POST /api/aro-agent/run` | Pre-fetch + tool-calling loop |
| **4. RO Advisor Agent (this doc)** | `POST /api/ro-advisor` | Pre-fetch + tool-calling loop, run in parallel with a deterministic margin/ARO calc |
| 5. Knowledge Graph Q&A | `POST /api/knowledge-graph/ask` | Parallel DB queries + single LLM call |
| 6. Recommendation Engine | `POST /api/recommendations` | Single call, 15-min Mongo TTL cache |
| 7. 3C Story Writer | client-side pipeline | Progressive 7-stage pipeline |
| 8. Entity Extractor | client-side, browser | 3-level fallback chain |
| 9. Shop Chat (Ask WrenchIQ) | `POST /api/shop-chat` | Single call, no tool loop, always default Predii LLM |
| 10. RO Chat | `POST /api/ro-chat` | Single call, no tool loop, optional frontier tier + PII guard |

The RO Advisor Agent is the orchestration doc's canonical example of the
**"agent + deterministic calc, run in parallel"** pattern: the LLM tool-calling loop
produces judgment-based recommendations while `marginCheck.js`'s plain arithmetic
checks the RO against the same `shop_config` numbers — neither branch waits on the
other, and the LLM is only ever given the labor-rate/margin-target numbers as
read-only pricing context, never asked to compute margin or ARO itself.

**Token budget**: 1200 max tokens (JSON recommendation object, tool loop) — smaller
than ARO Agent's 4096 (bigger analytics payload) but larger than RO Agent's 512
(short triage JSON).

**Two real chat surfaces reuse this agent's own data-access helpers and are now
Agents 9 and 10 in the Confluence orchestration inventory** — "Ask WrenchIQ" (Shop
Chat) and RO Chat, added there 2026-08-11 — see §0.7.

**Related, separate, user-triggered agent on the same RO**: `roScoreAgent.js`
(`runROScoreAgent()`) scores the RO against the shop's Gold Standard checklist,
using the RO record, 3C conversation fields, staged/sent customer text, **and this
agent's own prior output** (`advisorBrief`, `marginCheck`, `alerts`,
`serviceRecommendations`) as additional evidence. Single-call JSON mode, no tool
loop; only ever suggests `aiStatus`/`aiEvidence` — the advisor's own checklist status
always wins. Runs on the Sidecar's "RO Score" tab, not automatically alongside the
RO Advisor call.

### 0.2 Trigger and entry point

- Advisor selects a customer/RO in the Sidecar → `runAdvisorFetch(roId)` in
  `WrenchIQSidecarScreen.jsx` fetches the RO detail (`GET /api/repair-orders/story-ro/:roId`)
  and then calls `POST /api/ro-advisor` with `{ ro, customer, vehicle, shopId }`.
- Server route `server/routes/roAdvisor.js` handles it. Header comment: *"Called every
  time an advisor selects an RO in the queue."* (`roAdvisorService.js:12`)
- The frontend guards against races with an incrementing `advisorRequestRef` so a stale
  response never overwrites a newer RO's data. Refetch is also manually triggerable via
  a refresh button in `IntelligencePanel`.

### 0.3 Data gathering — parallel pre-fetch, then tool-calling loop

`runROAdvisorAgent({ ro, customer, vehicle, shopId, db, shopProfile })`
(`roAdvisorService.js:756`) does **not** let the LLM freely query the database. Instead
it pre-fetches six data sources in one `Promise.all` (each individually fail-open,
returns `[]`/fallback on error, never throws):

1. **`fetchCustomerHistory`** — past ROs for this customer from Mongo (`RepairOrder` and
   `wrenchiq_ro` collections), merged/normalized/sorted, capped to 8.
2. **`fetchShopObjectives`** — active "ings" (tribal-knowledge action items) from the
   `tribal_notes` collection, walking up the shop's `location_hierarchy` so
   district/region-scoped notes apply too. Falls back to a hardcoded demo set if empty.
3. **`getCannedJobs`** — shop's own priced canned-job menu (`cannedJobsService.js`).
4. **`fetchShopProfile`** — `shop_config` doc, merged over `DEFAULT_SHOP_PROFILE =
   {laborCost: 85, partsMarginTarget: 53}`. Skipped if the route already passed one in.
5. **`fetchSeasonalTrends`** — this shop's own persisted "Predii Learn" seasonal profile
   (`shopProfileSnapshotService.js`); empty if the shop hasn't run that workflow.
6. **`fetchTSBs(make, model, year, db)`** — see §0.5.

These pre-fetched results are then handed to the LLM as **tool results on demand** —
the 6 tools (`get_customer_history`, `get_shop_objectives`, `get_mileage_services`,
`get_canned_jobs`, `get_seasonal_trends`, `get_tsbs`) are executed synchronously against
already-fetched data (`executeTool`, `roAdvisorService.js:557-649`); calling a "tool"
does **not** trigger a new DB round-trip. The tool-calling shape exists so the LLM can
selectively pull only what it needs into context, not because the data is fetched lazily.

### 0.4 Decision logic — what's deterministic vs. LLM-driven

Most of the "should we recommend this" judgment is delegated to the LLM via a large
system prompt (`buildSystemPrompt`, `roAdvisorService.js:465-553`). But several pieces
are hard-coded, non-LLM rules:

- **Mileage-interval table** (`getMileageServices`, `:226-243`) — deterministic
  thresholds, not DB- or LLM-driven: oil/filter ≥3,000 mi, engine air filter every
  15–20k, cabin air filter ≥15,000 mi, brake fluid flush ≥30,000 mi, transmission
  fluid ≥45,000 mi, battery test ≥50,000 mi, timing belt inspection ≥60,000 mi
  (Honda/Acura/Toyota/Subaru only), spark plugs ≥75,000 mi, coolant flush ≥80,000 mi.
  All tagged `category: 'year_round'` — never `'seasonal'` by design.
- **"Already on this RO" exclusion** — `filterExistingServices` (`:283-300`) is a
  **post-LLM filter**, applied to the final JSON regardless of whether the LLM obeyed
  the "don't recommend what's already on the RO" instruction in the prompt.
- **Customer-message sanitizer** — `cleanCustomerMessage` (`:334-341`) detects stray
  numbered-list artifacts in the LLM's drafted SMS and replaces them with a
  deterministic fallback message (`buildFallbackCustomerMessage`, `:316-332`) if found.
- **marginCheck / aroGap** — computed in `roAdvisor.js`, not the LLM: `marginCheck.js`
  compares the RO against `shop_config` labor cost/margin target; `aroGap` reads a
  shop's average-RO-value target from `shop_goals` (intentionally read from the
  network-aggregate sentinel shop `shop-001`, not the real active shop — matching the
  convention already used by `SettingsScreen.jsx`'s ARO & Margin tab) and computes
  `gapAmount = max(0, target - ro.totalEstimate)`.

Everything else — which services to actually recommend, confidence level, whether a
canned-job price should override an LLM estimate (canned-job price always wins when
matched), TSB relevance framing, alerts, and the advisor talk track — is LLM output,
constrained by explicit rules in the system prompt:

- Anything the customer declined in the last 12 months → goes to `alerts`, never a
  fresh recommendation.
- Shop objectives are filtered by `triggerType` (`vehicle_make`, `mileage_range`, `any_ro`).
- Cap of **4** combined `year_round` + `seasonal` recommendations. **TSB-category
  recommendations are uncapped** and always surfaced — see §0.5.
- `suggestedCustomerMessage` must read as warm, non-listy prose, mention every
  non-TSB recommendation with a timing suggestion, never oversell, and sign off with
  the advisor's real first name or "— the team at {shop}" (never a placeholder).

### 0.4a Exact detector for the stray-list-marker bug (merged from Confluence deep-dive)

The Confluence deep-dive page for this agent documents the precise root cause and
fix (shipped 2026-08-05) for a real customer-facing defect: the LLM occasionally
left a stray list-numbering artifact in `suggestedCustomerMessage` — e.g. a bare
`"50."` on its own line, or `"50)"` dropped mid-sentence ("...for you. 50) to keep
everything lubricated.") — from having internally drafted the 4 recommendations as
a numbered list, with a fragment leaking into the final prose and sometimes eating
the words around it.

`STRAY_LIST_MARKER = /(^|[\s.])\d{1,3}[.)](?=\s|$)/` detects this — the leading
boundary is deliberate so it never fires on a real price (`"$50."`) or a decimal
(`"12.5"`). When it matches, the string is **not** patched in place (surrounding
words may already be missing, so a regex patch would still read broken). Instead
`buildFallbackCustomerMessage()` rebuilds the message from scratch from the
structured `serviceRecommendations` array, signed with the real advisor's first
name from the RO (or "— the team" if none on file). Same two-layer pattern as the
"already on RO" filter: reduce the chance at the prompt level, then deterministically
catch and repair what still gets through.

### 0.5 TSB integration — exact flow

Two independent entry points both call into `nhtsaTsbService.js`:

1. **Standalone lookup**: `GET /api/tsbs?make=&model=&year=` (`server/routes/tsbLookup.js`)
   — callable by any screen directly. Not currently called by the Sidecar screen.
2. **Embedded in the RO Advisor**: `fetchTSBs(make, model, year, db)`
   (`roAdvisorService.js:202-218`), part of the pre-fetch in §0.3, feeding the `get_tsbs` tool.

**Lookup chain** (`nhtsaTsbService.js`):
- Cache-first: Mongo `nhtsa_tsb_cache` collection, key `{year, make, model}`
  (lowercased/trimmed), read with a `ttlExpiresAt: {$gt: now}` filter.
- On miss/expiry: live call to NHTSA's public `manufacturerCommunications` endpoint
  (params: `modelYear`, `make`, `model`, `issueType=t`) → `normalizeTSB()` reshapes each
  result into `{id, nhtsaNumber, manufacturerNumber, component, summary,
  dateCommunicationSent, documents[]}`. PDF URLs are synthesized client-side (NHTSA
  doesn't return them inline).
- Result written back to `nhtsa_tsb_cache` via `replaceOne(..., {upsert: true})` with a
  TTL from `config.js`'s `NHTSA_TSB_CACHE_TTL_HOURS`. A Mongo TTL index on
  `ttlExpiresAt` auto-deletes expired cache docs; a unique index on `{year, make, model}`
  prevents duplicate cache rows.
- **Fail-open**: any NHTSA fetch error returns `[]`, never throws.
- Note: **VIN is not used anywhere in this path** — matching is by year/make/model only.
- Code comment flags that the exact NHTSA endpoint path has been confirmed against the
  live API (not a sandbox assumption) precisely because NHTSA has no clean dedicated
  TSB-payload endpoint — this is the best available public source, not a guarantee of
  completeness.

**Curated fallback**: only inside `roAdvisorService.js`'s `fetchTSBs()` — if the NHTSA
path returns empty, it falls back to a curated static list in `src/data/tsbData.js`,
reshaped by `normalizeCuratedTSB()` to fold labor hours/parts estimate into the summary
text. The standalone `/api/tsbs` route has no curated fallback.

**How it reaches the advisor**: every TSB returned for the exact YMM is surfaced as a
`category: "tsb"` recommendation — uncapped, and **regardless of relevance to the RO's
stated concern** (an explicit, deliberate design choice stated in both the service
header comment and the system prompt itself). Confidence is "high" only when the LLM
ties the TSB directly to the RO's DTCs/stated concern; otherwise "medium," phrased as a
proactive heads-up rather than a diagnosis. In the Sidecar UI, TSB recommendations
render in their own "Technical Service Bulletins" sub-section under the blue Service
Recommendations panel, separate from mileage/seasonal recs.

### 0.6 Sidecar UI — how the output is surfaced, and "Transfer to SMS"

`IntelligencePanel` in `WrenchIQSidecarScreen.jsx` renders the agent's output:
customer-concern quote, advisor brief, `marginCheck` badge, `aroGap` note, `alerts`,
the drafted customer SMS (`StagedCustomerText`), a blue **Service Recommendations**
panel (mileage/seasonal recs plus the separate TSB sub-section), and a purple
**Strategic Priorities** panel for the `ings[]` (shop objectives), sorted so
currently-applicable items float to the top.

**While loading** (shipped 2026-08-05): the "Live agent output" box shows
`AgentThinkingStatus` — a cosmetic status line that cycles every 1.4s through 3
lines seeded from the RO number (so the same RO always shows the same sequence):
*"Agent is triggering tools to pull {toolA}, {toolB}…"* → *"Cross-referencing
{toolC} and {toolD}…"* → *"PrediiLLM is now reasoning with the data, providing
personalized recommendations for {customer's first name}…"*. The cycling tool
names are drawn from a fixed cosmetic list (service history, open TSBs, parts
pricing, labor time guide, warranty coverage, shop margin targets, DTC codes,
vehicle build data) — this is purely a perceived-latency treatment. The real
call is a single `POST /api/ro-advisor`, not literally 3 separate visible
round-trips.

**Accept a recommendation**: clicking Accept on a `ServiceRecommendationCard` simulates
a 700 ms lookup, then resolves pricing/parts either via a real match against the shop's
canned-job menu (`matchCannedJob`) or — if no canned job matches — via
`simulateCatalogMatch`, a deterministic hash-based fake parts/labor lookup explicitly
commented in code as *"stands in for a real DE (parts/labor data) integration until one
is scoped."* Accepted jobs are appended to local state and best-effort PATCHed onto the
story RO.

**Transfer to SMS — confirmed simulated, not a real integration.** Once at least one
recommendation is accepted, a "Transfer to {smsName}" button appears. Clicking it opens
`TransferSimulationModal.jsx`, whose own name and header comment are explicit:

> "Shows the payload that will be written to the shop's SMS/DMS... Once confirmed, the
> parent marks these jobs 'transferred' and PATCHes the story RO; **no separate network
> call happens here**."

Concretely: the modal builds a JSON payload (`{repairOrderId, laborLines, partLines}`)
purely for on-screen display — it is never sent as an HTTP request to a real
Mitchell1/Tekmetric/DMS system. Confirming just calls back into the Sidecar's
`confirmTransfer()`, which marks the accepted jobs `status: "transferred"`, recomputes
the RO total, PATCHes the **story RO in this app's own Mongo**, and fires
`notifyROUpdated(roId)` over a same-origin `BroadcastChannel`
(`roUpdatesChannel.js`) so the separate SMS/DMS Representative window (Surface C)
refetches immediately instead of waiting on its normal 60-second poll
(`liveBoardFeed.js`'s `useLiveBoardROs`). There is no external SMS/DMS write-back
anywhere in this flow — "Transfer to SMS" is an internal RO mutation plus a same-tab
notification, and the modal discloses this to the user in its own copy ("part/labor
details were resolved via WrenchIQ's simulated catalog search at accept time").
The target SMS/DMS name shown in the button/modal comes from Settings → Predii
Learn → Integrations (default: Mitchell1 ShopManager SE) — that setting only
controls the display name, not an actual connection.

### 0.7 Chat with Shop Intelligence

There is no single feature literally named "Shop Intelligence" in the code — two real,
LLM-backed chat surfaces exist in the Sidecar, both grounded in the same live Mongo data
the RO Advisor uses:

- **"Ask WrenchIQ"** (`ShopChatScreen`) — shop-wide chat, no RO required. Reached via
  the message-square icon in the Sidecar header (tooltip: *"Ask WrenchIQ — shop-wide
  chat grounded in canned jobs, Shop Profile, and any named customer's history"*).
  Calls `POST /api/shop-chat` with `{message, history, shopId, shopName, customerId?,
  customerName?}` → `server/routes/shopChat.js` → `runShopChatAgent()` in
  `shopChatService.js`, which reuses `fetchCustomerHistory` from `roAdvisorService.js`
  for the same real customer-history grounding as the RO Advisor.
- **RO-scoped Chat tab** — narrower in purpose: a bilingual (EN/ES) rewrite assistant
  scoped to the currently-open RO, turning an advisor's rough notes into "automotive
  speak." Calls `POST /api/ro-chat` → `runROChatAgent()` in `roChatService.js`, same
  customer-history grounding reuse.

Neither chat surface can write back to the RO or trigger a transfer — both are
read-only conversational tools layered on the same data the advisor brief uses.

### 0.8 Supporting services — roles, not agent logic

- `src/services/roTotals.js` — pure math (labor/parts/tax/grand total,
  `PARTS_TAX_RATE = 0.0875` on parts only). Single source of truth for RO dollar totals
  across the Sidecar and the SMS/DMS RO Viewer. No API calls, no agent involvement.
- `src/services/roUpdatesChannel.js` — a same-origin `BroadcastChannel` used solely to
  tell the SMS/DMS Representative window to refetch right after a Transfer confirms. It
  is **not** how the Sidecar gets RO Advisor results — the advisor agent has no
  relationship to this channel.
- `src/services/externalLink.js` — window-tiling helper (opens/tiles the SMS/DMS
  Representative window next to the Sidecar). Unrelated to the Transfer data flow.
- `src/services/liveBoardFeed.js` — polling hook (`useLiveBoardROs`, 60 s interval +
  BroadcastChannel nudge) used by the SMS/DMS Representative surface, not by the Sidecar
  itself; the Sidecar drives RO selection through its own customer-selector context.

### 0.9 Summary — real vs. simulated

| Piece | Status |
|---|---|
| RO Advisor LLM recommendation generation | **Real** — Azure/Predii LLM, tool-calling loop, max 4 turns, single-pass fallback |
| Customer history, shop objectives, canned jobs, seasonal trends | **Real** Mongo reads |
| Mileage-interval "due services" | **Real deterministic rule table** — not LLM, not DB-driven |
| TSB lookup | **Real** live NHTSA API + Mongo TTL cache; VIN not used (YMM only); falls back to a curated static file when NHTSA returns empty |
| marginCheck / aroGap | **Real deterministic** computation from `shop_config` / `shop_goals` |
| Parts/labor catalog match on Accept | **Simulated** when no canned-job match exists (hash-based fake data), disclosed to the user in the Transfer modal's own copy |
| "Transfer to SMS/DMS" | **Fully simulated** — no external SMS/DMS API call; an internal RO PATCH plus a same-origin BroadcastChannel notification |
| "Ask WrenchIQ" shop chat | **Real** LLM call, grounded in real data |
| RO-scoped Chat tab | **Real** LLM call, narrow bilingual-rewrite scope |
| Autonomous monitoring / daily digest / insight catalog (Sections 6–7 below) | **Not implemented** — vision only |

---

## 1. Executive Summary

WrenchIQ AI Service Advisor is a stand-alone intelligence layer that attaches to any existing Shop Management System (SMS). It does not replace the shop's current SMS — it augments it with autonomous AI capabilities: continuous monitoring of repair orders, proactive revenue and operational insights, customer experience intelligence, and a conversational service advisor agent with persistent memory.

The core premise is that most SMS platforms are excellent record-keeping tools but passive — they store data, they do not think. WrenchIQ AI Service Advisor acts as the "thinking layer" on top, watching every RO in real time and surfacing the right action to the right person at the right moment.

**Key differentiator:** Zero SMS replacement friction. Any shop on Mitchell1, Tekmetric, Shop-Ware, R.O. Writer, AutoFluent, or CDK/Reynolds can activate this add-on in under a day.

---

## 2. Product Vision

> "Your best service advisor — available 24/7, never misses a follow-up, and gets smarter every week."

The agent operates autonomously between SMS events. It reads normalized repair order data from the WrenchIQ MongoDB layer, applies AI reasoning across shop-configured rules and historical patterns, and pushes prioritized actions to the service advisor's queue or directly to the customer (where authorized).

---

## 3. Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                  Existing Shop SMS                           │
│  (Mitchell1 / Tekmetric / Shop-Ware / R.O. Writer / CDK)    │
└──────────────────┬───────────────────────────────────────────┘
                   │  SMS Adapter (read + optional write-back)
                   ▼
┌──────────────────────────────────────────────────────────────┐
│           WrenchIQ Normalization Layer                       │
│  • Parses SMS-native RO format                               │
│  • Maps to Universal WrenchIQ RO Schema                     │
│  • Stores normalized ROs in MongoDB (wrenchiq db)            │
│  • Real-time via webhook or polling (configurable)           │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│        AI Service Advisor Agent (Autonomous)                 │
│                                                              │
│  Memory Layer          Tool Access           Monitoring Loop │
│  ─────────────         ───────────           ─────────────── │
│  • Shop prefs          • RO data             • Every 5 min   │
│  • SMS config          • Customer history    • Event-driven  │
│  • Staff profiles      • Vehicle data        • Daily digest  │
│  • Historical KPIs     • Parts pricing       • Alert queue   │
│  • Rule library        • Recalls / TSBs                      │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│              Delivery Channels                               │
│  • WrenchIQ Service Advisor UI (web / mobile)                │
│  • SMS / push notification to advisor                        │
│  • Optional: customer-facing text / email                    │
│  • Optional: write-back to source SMS                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Integration Prerequisites

Before the AI Service Advisor Agent can begin adding value, the following integration gates must be satisfied. These are organized into four phases — the agent activates incrementally as each phase is completed.

### Phase 0 — Identity & Configuration (Day 0, Required)

These are the minimum required before any agent functionality is enabled.

| Requirement | Description | Source |
|-------------|-------------|--------|
| Shop profile | Name, address, timezone, labor rate, bay count, brand flags | Manual onboarding form |
| SMS platform identifier | Which SMS is being connected (e.g., `tekmetric`, `mitchell1`) | Manual selection |
| Operator credentials | API key or OAuth token for the SMS platform | SMS admin panel |
| MongoDB connection | WrenchIQ MongoDB URI with write access to `wrenchiq` database | Predii provisioned |
| Staff roster | Advisor names, roles, and contact info (for alert routing) | SMS import or manual |
| Notification preferences | How/when to alert advisors (SMS, push, email, in-app) | Onboarding wizard |

### Phase 1 — Repair Order Read Access (Day 1, Core Value)

Enables: RO monitoring, revenue insights, bay status, completion tracking.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Active RO stream | Real-time or near-real-time access to open ROs | RO number, status, vehicle, customer, line items, labor, parts, totals, advisor assigned, open date, promised time |
| RO status transitions | Events when RO moves: created → in progress → waiting parts → complete → invoiced | Status + timestamp |
| Line item details | Individual labor ops, parts, sublet, fees with status (approved / declined / pending) | Op code, description, qty, price, status |
| Customer contact | Name, phone, email linked to each RO | Name, primary phone, email |
| Technician assignment | Which tech is on each RO or labor line | Tech ID, name |

### Phase 2 — Vehicle & History Access (Day 3–7, Intelligence Amplifier)

Enables: predictive maintenance flags, TSB matching, recall detection, deferred service escalation.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Vehicle profile | Year, make, model, trim, engine, VIN for each vehicle | All YMME fields + VIN |
| RO history | Prior visits and services for the vehicle | Past RO summaries, service dates, mileage at service |
| Declined services | Previously declined line items with dates | Op code, description, decline date, decline reason if captured |
| Current mileage | Odometer at current visit | Odometer reading |
| Customer vehicle list | All vehicles tied to a customer | Vehicle IDs linked to customer |

### Phase 3 — Financial & Scheduling Access (Day 7–14, Operational Intelligence)

Enables: revenue pipeline, collection alerts, scheduling optimization, parts delay detection.

| Requirement | Description | Minimum Data Fields |
|-------------|-------------|---------------------|
| Invoice / payment status | Whether an RO has been paid, payment method, balance due | Invoice date, amount, payment method, balance |
| Appointment schedule | Upcoming appointments with vehicle and service type | Appointment date/time, vehicle, stated concern |
| Parts orders | Parts ordered for each RO, ETA, received status | Part number, vendor, order date, ETA, received flag |
| Warranty claims | Open warranty ROs or claim submissions | Claim type, status, authorization number |

### Phase 4 — Write-Back Capability (Optional, Advanced)

Enables: agent-initiated customer communications, status updates pushed back to SMS, appointment creation.

| Requirement | Description | Risk Level |
|-------------|-------------|------------|
| SMS RO status update API | Agent can push status changes back to source SMS | Medium — requires SMS support |
| Appointment creation API | Agent can book follow-up appointments | Medium |
| Customer communication API | Agent can trigger texts/emails via SMS or third-party (Twilio, Podium) | Low — separate from SMS |
| Declined service re-quote | Agent can create a new RO or estimate for declined items | Medium |

---

## 5. Universal WrenchIQ Normalized RO Schema

All SMS adapters convert their native format into this schema before writing to MongoDB. The agent only reads from this normalized layer — it never reads the source SMS format directly.

```json
{
  "ro_id": "string (WrenchIQ internal UUID)",
  "source_sms": "string (tekmetric | mitchell1 | shopware | rowriter | autofluent | cdk | rr | other)",
  "source_ro_number": "string (native RO number in the SMS)",
  "shop_id": "string",
  "advisor_id": "string",
  "tech_ids": ["string"],

  "status": "string (open | in_progress | waiting_parts | waiting_customer | complete | invoiced | void)",
  "promised_time": "ISO8601 datetime",
  "opened_at": "ISO8601 datetime",
  "closed_at": "ISO8601 datetime | null",

  "customer": {
    "id": "string",
    "name": "string",
    "phone": "string",
    "email": "string",
    "loyalty_tier": "string | null",
    "visit_count": "number",
    "last_visit_date": "ISO8601 date | null"
  },

  "vehicle": {
    "id": "string",
    "vin": "string",
    "year": "number",
    "make": "string",
    "model": "string",
    "trim": "string | null",
    "engine": "string | null",
    "odometer": "number",
    "color": "string | null",
    "plate": "string | null"
  },

  "stated_concern": "string",

  "line_items": [
    {
      "line_id": "string",
      "type": "string (labor | part | sublet | fee | fluid | tire)",
      "op_code": "string | null",
      "description": "string",
      "status": "string (approved | declined | pending | recommended)",
      "quantity": "number",
      "unit_price": "number",
      "extended_price": "number",
      "tech_id": "string | null",
      "estimated_hours": "number | null",
      "actual_hours": "number | null",
      "part_number": "string | null",
      "vendor": "string | null",
      "part_received": "boolean | null",
      "part_eta": "ISO8601 datetime | null"
    }
  ],

  "totals": {
    "labor": "number",
    "parts": "number",
    "sublet": "number",
    "fees": "number",
    "tax": "number",
    "discount": "number",
    "total": "number",
    "balance_due": "number"
  },

  "payment": {
    "status": "string (unpaid | partial | paid)",
    "method": "string | null",
    "paid_at": "ISO8601 datetime | null"
  },

  "flags": {
    "has_recall": "boolean",
    "has_open_tsb": "boolean",
    "has_declined_services": "boolean",
    "is_first_visit": "boolean",
    "is_fleet": "boolean",
    "is_warranty": "boolean"
  },

  "ai_metadata": {
    "insights_generated_at": "ISO8601 datetime | null",
    "active_insights": ["string (insight IDs)"],
    "sentiment_score": "number | null (0–1)",
    "upsell_probability": "number | null (0–1)",
    "churn_risk": "number | null (0–1)",
    "estimated_lifetime_value": "number | null"
  },

  "sync_metadata": {
    "last_synced_at": "ISO8601 datetime",
    "sync_version": "number",
    "adapter_version": "string"
  }
}
```

---

## 6. AI Service Advisor Agent — Capabilities

### 6.1 Agent Memory Architecture

The agent maintains three tiers of memory, all stored in MongoDB:

| Memory Tier | Scope | Contents | TTL |
|-------------|-------|----------|-----|
| **Shop Memory** | Persistent | Labor rate, bay count, brands, staff roster, service menu, common op codes, vendor preferences, communication preferences, escalation rules | Permanent |
| **Pattern Memory** | Rolling 12 months | Historical RO averages, common decline reasons, seasonal trends, top upsells that converted, customer re-visit rates by service type | 12 months rolling |
| **Session Memory** | Per-RO lifecycle | Current RO state, conversation history with advisor/customer, pending actions, last insight delivered | RO lifetime + 30 days |

### 6.2 Agent Tool Access

| Tool | Description | Phase Required |
|------|-------------|----------------|
| `get_active_ros` | Fetch all open ROs for the shop | Phase 1 |
| `get_ro_detail` | Fetch full normalized RO by ID | Phase 1 |
| `get_customer_history` | Fetch all ROs for a customer/vehicle | Phase 2 |
| `get_declined_services` | Fetch unresolved declined services for a vehicle | Phase 2 |
| `lookup_recall` | Query NHTSA recall API by VIN | Phase 2 |
| `lookup_tsb` | Query ALLDATA/Mitchell1 TSB by YMME + symptom | Phase 2 |
| `get_parts_status` | Check parts ETA for an RO | Phase 3 |
| `get_appointment_queue` | Fetch upcoming scheduled appointments | Phase 3 |
| `get_revenue_pipeline` | Aggregate declined services $ by advisor/period | Phase 3 |
| `send_advisor_alert` | Push a prioritized insight to the advisor | Phase 1 |
| `send_customer_message` | Send authorized text/email to customer | Phase 4 |
| `update_ro_status` | Write status back to source SMS | Phase 4 |
| `create_appointment` | Book a follow-up in the SMS | Phase 4 |

> **Current implementation note:** the tools actually implemented today
> (`get_customer_history`, `get_shop_objectives`, `get_mileage_services`,
> `get_canned_jobs`, `get_seasonal_trends`, `get_tsbs` — see §0.3) are a
> narrower, differently-named set scoped to a single shop's own Mongo data.
> None of the Phase 3/4 write-back tools in this table exist in code.

---

## 7. AI Insights Catalog — Ongoing Monitoring

This is the complete catalog of insights the agent monitors. Each insight has a trigger condition, priority level, and default delivery target.

> **Current implementation note:** none of the insight IDs below (`REV-*`, `CX-*`,
> `OPS-*`, `VEH-*`, `FIN-*`, `DIG-*`) exist in code today. There is no autonomous
> monitoring loop and no insight-ID system — this catalog remains the target design
> for the v2 autonomous-monitoring product.

### Category A — Revenue Recovery (Highest ROI)

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `REV-001` | Declined Service Follow-Up | Customer has declined services from last visit; vehicle back in shop OR 30/60/90 days elapsed | P1 | Advisor |
| `REV-002` | Approval Pending Too Long | A recommended service line has been in `pending` status > 2 hours with customer unreachable | P1 | Advisor |
| `REV-003` | High-Value Upsell Opportunity | Vehicle mileage triggers manufacturer-recommended service not yet on the RO (timing belt, transmission service, coolant flush) | P2 | Advisor |
| `REV-004` | Deferred Service Escalation | A service declined 90+ days ago is now overdue per manufacturer interval | P1 | Advisor |
| `REV-005` | Fleet Revenue Concentration Risk | >30% of month's revenue from a single fleet account; flag for diversification conversation | P3 | Owner |
| `REV-006` | Below-Average RO Value | Active RO total is >25% below shop average for the same service category | P2 | Advisor |
| `REV-007` | Quick-Win Add-On Detected | Vehicle is due for wiper blades, cabin filter, or air filter — high-margin, fast-approval items | P2 | Advisor |

### Category B — Customer Experience

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `CX-001` | Customer Not Updated | No outbound contact logged in > 3 hours on an open RO | P1 | Advisor |
| `CX-002` | Vehicle Ready, Not Picked Up | RO marked complete but customer has not arrived in > 2 hours | P1 | Advisor |
| `CX-003` | Promise Time At Risk | Estimated completion time will exceed promised time based on current labor progress | P1 | Advisor |
| `CX-004` | First-Time Customer Detected | Customer has 0 prior visits — flag for high-touch onboarding experience | P2 | Advisor |
| `CX-005` | Returning Customer After Lapse | Customer has not visited in > 12 months — flag for re-engagement | P2 | Advisor |
| `CX-006` | Negative Sentiment Signal | Customer message or note contains frustration language (agent NLP analysis) | P1 | Advisor + Owner |
| `CX-007` | Approval Obtained, Tech Not Notified | Customer approved a service but tech has no updated assignment | P1 | Advisor |
| `CX-008` | Multi-Vehicle Household Opportunity | Customer has another vehicle in the household with overdue services | P3 | Advisor |

### Category C — Operational Intelligence

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `OPS-001` | Bay Bottleneck Detected | >2 ROs waiting for same tech; parallel reallocation possible | P2 | Advisor |
| `OPS-002` | Parts Delay Will Miss Promise | Ordered part ETA exceeds RO promised time | P1 | Advisor |
| `OPS-003` | Parts Not Ordered Yet | Approved parts line item has no associated PO after 30 minutes | P1 | Advisor |
| `OPS-004` | Tech Idle With Open ROs Waiting | A tech has no active assignment but there are open, approved ROs | P2 | Advisor |
| `OPS-005` | Labor Hours Creep | Actual hours on an op have exceeded estimated by > 50% | P2 | Advisor |
| `OPS-006` | Sublet Overdue | Sublet job was sent out > promised turnaround time ago with no return confirmation | P1 | Advisor |
| `OPS-007` | High Bay Load Approaching | Shop is at >85% bay capacity for tomorrow's appointments | P2 | Owner |
| `OPS-008` | Same-Day Capacity Opening | A cancellation or fast job completion has created an open bay slot | P3 | Advisor |

### Category D — Vehicle Intelligence

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `VEH-001` | Open Safety Recall Detected | VIN match to active NHTSA recall not yet addressed | P1 | Advisor (required disclosure) |
| `VEH-002` | TSB Match to Stated Concern | ALLDATA/Mitchell1 TSB matches the customer's stated complaint for this YMME | P2 | Advisor + Tech |
| `VEH-003` | Inspection Flag Unresolved | Prior DVI flagged a safety item (red) that has not been addressed in 2+ visits | P1 | Advisor |
| `VEH-004` | Seasonal Risk Flag | Region + season + vehicle type match a predictive failure pattern (e.g., battery in cold weather, AC in summer) | P2 | Advisor |
| `VEH-005` | High-Mileage Threshold Reached | Vehicle crosses a major mileage milestone (30K / 60K / 90K / 100K) | P2 | Advisor |
| `VEH-006` | Maintenance Plan Deviation | Vehicle has skipped a scheduled maintenance interval based on manufacturer guide | P2 | Advisor |

### Category E — Financial & Compliance

| Insight ID | Name | Trigger | Priority | Target |
|------------|------|---------|----------|--------|
| `FIN-001` | Same-Day Collection Opportunity | RO completed and invoiced but no payment collected; customer still on-site | P1 | Advisor |
| `FIN-002` | High Balance Due on Departure | Customer leaving with balance > $500 without payment arrangement | P1 | Advisor |
| `FIN-003` | Warranty Claim Eligibility | RO type and vehicle qualify for OEM/extended warranty coverage not yet filed | P2 | Advisor |
| `FIN-004` | Coupon/Promotion Not Applied | Shop has active promo matching services on this RO; not applied | P2 | Advisor |
| `FIN-005` | Labor Recovery Below Threshold | Tech efficiency for this RO < 70% — flag for coaching conversation | P3 | Owner |
| `FIN-006` | Missing Authorization Signature | RO total exceeds state-required written auth threshold; no signed authorization recorded | P1 | Advisor (compliance) |
| `FIN-007` | Cash RO Above Reporting Threshold | Cash payment > $10,000 on a single RO — flag for IRS Form 8300 compliance | P1 | Owner |

### Category F — Daily Digest (Owner / Manager)

Delivered once per day (configurable: morning briefing or end-of-day summary):

| Insight ID | Name | Contents |
|------------|------|---------|
| `DIG-001` | Morning Shop Brief | Appointments today, bay availability, parts arriving, staff on duty, open ROs from prior day |
| `DIG-002` | Revenue Pipeline | Total value of all declined services in last 30/60/90 days, segmented by category |
| `DIG-003` | Tech Efficiency Scorecard | Actual vs. estimated hours by tech for the week |
| `DIG-004` | Customer Experience Score | Count of CX alerts triggered, response times, promise-time miss rate |
| `DIG-005` | Top Opportunities This Week | 5 highest-value follow-up opportunities with customer name, vehicle, declined service, value |

---

## 8. SMS Adapter Specifications

> **Current implementation note:** none of these adapters exist. "Transfer to SMS"
> in the current Sidecar is a simulated internal RO mutation, not a call to any of
> the platforms below — see §0.6.

### Supported SMS Platforms (v1.0)

| Platform | Integration Method | Sync Mode | Write-Back |
|----------|-------------------|-----------|------------|
| Tekmetric | REST API (OAuth2) | Real-time webhook + polling fallback | Yes (v2) |
| Shop-Ware | REST API (API key) | Real-time webhook | Yes (v2) |
| Mitchell1 | REST API + SOAP legacy | Polling (5 min) | Partial |
| R.O. Writer | REST API (API key) | Polling (5 min) | Planned |
| AutoFluent | REST API | Polling (10 min) | Planned |
| CDK Drive | REST API (OAuth2) | Real-time event stream | Yes (v2) |
| Reynolds & Reynolds | ERA-IGNITE API | Polling (15 min) | Planned |
| Generic CSV/FTP | Flat file export | Batch (hourly) | No |

### Adapter Interface Contract

Each SMS adapter must implement this interface:

```typescript
interface SMSAdapter {
  // Return all ROs modified since the given timestamp
  fetchUpdatedROs(since: Date): Promise<NativeRO[]>;

  // Convert native RO to WrenchIQ normalized schema
  normalizeRO(native: NativeRO): WrenchIQNormalizedRO;

  // Optional: push status update back to SMS
  updateROStatus?(roId: string, status: string): Promise<void>;

  // Optional: send customer message via SMS platform
  sendCustomerMessage?(customerId: string, message: string): Promise<void>;

  // Health check
  ping(): Promise<{ connected: boolean; latencyMs: number }>;
}
```

---

## 9. Agent Configuration Schema

Stored in MongoDB `shop_config` collection per shop:

```json
{
  "shop_id": "string",
  "sms_platform": "string",
  "sms_credentials": { "encrypted": true },
  "labor_rate": "number",
  "bay_count": "number",
  "timezone": "string (IANA)",
  "business_hours": {
    "monday": { "open": "08:00", "close": "18:00" },
    "...": "..."
  },
  "advisor_alert_preferences": {
    "channel": "string (in_app | sms | email | push)",
    "quiet_hours": { "start": "18:00", "end": "08:00" },
    "min_priority": "string (P1 | P2 | P3)"
  },
  "enabled_insights": ["REV-001", "REV-002", "..."],
  "disabled_insights": [],
  "custom_thresholds": {
    "customer_update_interval_hours": 3,
    "vehicle_ready_pickup_alert_hours": 2,
    "declined_service_followup_days": [30, 60, 90]
  },
  "write_back_enabled": false,
  "customer_messaging_enabled": false,
  "digest_delivery_time": "07:30",
  "digest_recipients": ["owner@shop.com"]
}
```

> **Current implementation note:** the real `shop_config` collection today only
> carries `laborCost` / `partsMarginTarget` (used by `roAdvisor.js` for marginCheck)
> plus whatever `fetchShopProfile` in `roAdvisorService.js` merges in — the
> alert-routing, insight-toggle, and digest fields above are not implemented.

---

## 10. Onboarding Flow (Time to First Insight)

```
Hour 0    Shop selects SMS platform + enters API credentials
          Agent runs connectivity health check
          Shop profile filled (labor rate, bay count, timezone, staff)

Hour 1    First RO sync completes
          Normalization layer populates MongoDB
          Agent activates Phase 1 insights (REV, CX, OPS categories)
          First advisor alert delivered

Day 3     Vehicle history sync complete (if SMS supports it)
          VEH insights activated (recall detection, TSB matching)
          Declined service pipeline populated

Day 7     Financial data connected
          FIN insights activated
          Daily digest begins

Day 30    Pattern memory populated with 30 days of shop behavior
          AI thresholds auto-calibrated to shop's own baseline
          Upsell probability and churn risk scoring activated
```

---

## 11. Security & Data Governance

| Requirement | Implementation |
|-------------|----------------|
| Credential storage | AES-256 encrypted at rest in MongoDB; never logged |
| Data isolation | Each shop's data is namespaced by `shop_id`; no cross-shop data access |
| PII handling | Customer PII encrypted at field level; masked in logs |
| SMS token rotation | OAuth tokens refreshed automatically; API keys rotated on schedule |
| Audit trail | Every agent action logged with timestamp, insight ID, and delivery confirmation |
| Data retention | Normalized ROs retained 3 years; raw sync payloads retained 30 days |
| GDPR/CCPA | Customer data deletion request triggers purge across normalized layer |

---

## 12. Success Metrics

| Metric | Target (90-day post-activation) |
|--------|--------------------------------|
| Declined service recovery rate | >15% of flagged declined services converted |
| Promise time accuracy | >90% of ROs completed within promised window |
| Customer update compliance | <5% of ROs trigger CX-001 (no update in 3 hrs) |
| Recall disclosure rate | 100% of VIN-matched recalls disclosed on visit |
| Advisor response to P1 alerts | >80% acknowledged within 15 minutes |
| Daily digest open rate | >70% of digest recipients opening within 2 hours |
| Time to first insight | < 1 hour from SMS credentials entered |

---

## 13. Future Roadmap (v2+)

| Feature | Description | Phase |
|---------|-------------|-------|
| Voice agent | Inbound customer calls handled by AI service advisor | v2 |
| Technician co-pilot | Agent pushes TSBs and repair guidance to tech mobile | v2 |
| Multi-location aggregation | Insights rolled up across shop group | v2 |
| Predictive scheduling | Agent proposes optimal appointment slots based on bay load + job mix | v2 |
| Customer-facing agent | Autonomous customer portal with RO status, approvals, and messaging | v2 |
| OEM integration | Connect to OEM warranty and recall systems directly | v3 |
| Insurance integration | Detect and initiate insurance claims for qualifying repairs | v3 |
| **Real SMS/DMS transfer** | Replace the current simulated Transfer flow (§0.6) with a live write-back to the shop's actual SMS/DMS | v2 |
| **Real parts/labor catalog** | Replace `simulateCatalogMatch` (§0.6) with a live DE (parts/labor data) integration | v2 |
