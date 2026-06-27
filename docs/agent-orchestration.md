# WrenchIQ Agent Orchestration & Design

**Last updated:** 2026-06-26  
**Project:** WrenchIQ.ai (next-gen)  
**Jira Epic:** AE-676

---

## Overview

WrenchIQ runs six specialized AI agents, each scoped to a distinct workflow stage in the shop management lifecycle. All agents share a unified LLM gateway (`azureOpenAI.js`) and write structured logs to MongoDB. The frontend never sees provider differences — the Claude proxy translates all responses to Anthropic format.

---

## Agent Inventory

| Agent | Entry Point | LLM Pattern | Primary Output |
|-------|-------------|-------------|----------------|
| Managed Agent | `POST /api/agent/sessions` | Anthropic Managed Agents (SSE stream) | Conversational assistant |
| RO Agent | `POST /api/ro-agent/draft` | Single LLM call, JSON mode | Structured repair intent |
| ARO Agent | `POST /api/aro-agent/run` | Tool-calling loop (pre-fetch) | Performance analysis JSON |
| Knowledge Graph Q&A | `POST /api/knowledge-graph/ask` | Parallel queries + single LLM | Service advisor answer |
| Recommendation Engine | `POST /api/recommendations` | Single LLM call, TTL cache | 4 persona-scoped recs |
| 3C Story Writer | Client-side pipeline | Progressive 7-stage pipeline | Narrative (short/verbose/pro) |
| Entity Extractor | Client-side, browser | Fallback chain (3 levels) | Structured promo metadata |

---

## Agent 1: Managed Agent (Anthropic API)

**Files:** `server/services/managedAgent.js`, `server/routes/agent.js`

**Purpose:** Full-featured conversational assistant using Anthropic's Managed Agents beta API (`managed-agents-2026-04-01`). Handles multi-turn shop Q&A, RO analysis, and 3C guidance.

**Bootstrap (singleton):**
- On server start, reuses or creates an Anthropic agent + environment
- Sessions are created per conversation, reused across turns

**API:**
```
POST /api/agent/sessions              → create session
POST /api/agent/sessions/:id/stream   → SSE stream of agent events
```

**System Prompt (condensed):**
> You are WrenchIQ, an AI-powered shop management assistant for Peninsula Precision Auto. Help with RO analysis, technician efficiency, DTCs/TSBs, 3C narratives, upsell opportunities, and shop performance metrics.

**Tools:** `agent_toolset_20260401` (Anthropic built-in toolset)

**Data Flow:**
```
Client creates session
  → POST /api/agent/sessions/:id/stream (user message)
  → Anthropic backend streams events (tool calls included)
  → Client re-renders on each SSE event
```

---

## Agent 2: RO Agent (Inbound Lead Triage)

**Files:** `server/routes/roAgent.js`

**Purpose:** Extracts structured repair intent from unstructured inbound messages (social DM, SMS, voicemail) to pre-populate NewROWizard.

**API:**
```
POST /api/ro-agent/draft
Body: { customerName, phone, channel, message }
Returns: { draft: { symptom, urgency, estimatedARO, services[], advisorNote, readyToDraft } }
```

**System Prompt:** Strict JSON extraction mode — outputs `symptom` (3–8 words), `urgency` (high/medium/low), `estimatedARO` (USD int), `services[]` (1–3 items with name + cost), `advisorNote`, `readyToDraft`.

**LLM:** Azure OpenAI via `azureOpenAI.js`

**Data Flow:**
```
ROAgentPanel (demo leads queue)
  → POST /api/ro-agent/draft
  → callAzureOpenAI() with lead text
  → JSON response
  → pre-populates NewROWizard
```

---

## Agent 3: ARO Agent (Performance Monitoring)

**Files:** `server/services/aroAgentService.js`, `server/routes/aroAgent.js`

**Purpose:** Autonomous monitoring of Average Repair Order vs. shop goals. Processes 100K+ RO datasets efficiently using pre-fetch + tool-loop pattern (never loads raw docs into RAM).

**API:**
```
GET  /api/aro-agent/status       → fast KPI math, no LLM
POST /api/aro-agent/run          → full tool-loop agent analysis
GET  /api/aro-agent/config/:id   → shop goal config
POST /api/aro-agent/config/:id   → update shop goals
```

**Orchestration Pattern — Pre-fetch + Tool Loop:**
1. `fetchAllAnalytics()` runs 7 MongoDB aggregation pipelines in parallel
2. System prompt is built with shop goals (ARO $650, min ELR $185, bay util 78%, comeback <2%)
3. LLM enters tool-calling loop — each tool call returns from pre-fetched data (no extra DB hits)
4. Loop exits when `finish_reason === "stop"`; response parsed as strict JSON

**Tools:**
```
get_shop_kpis         get_aro_trend          get_tech_performance
get_customer_patterns get_vehicle_segments   get_declined_services
get_service_opportunities
```

**Output Schema (strict JSON, no prose):**
```json
{
  "status": "on_track | below_goal | at_risk",
  "current_aro": 0,
  "goal_aro": 650,
  "gap": 0,
  "gap_pct": 0,
  "trend_label": "Improving | Declining | Stable",
  "alerts": [{ "severity": "high|medium|low", "message": "" }],
  "recommendations": [{ "action": "", "impact": "", "priority": "" }],
  "tech_alerts": [{ "tech_id": "", "issue": "", "metric": "" }],
  "summary": ""
}
```

**Status Rules:**
- `at_risk` — ARO >20% below goal OR >50% techs below min ELR
- `below_goal` — 1–20% below goal
- `on_track` — meets or exceeds goal

---

## Agent 4: Knowledge Graph Q&A

**Files:** `server/routes/knowledgeGraph.js`

**Purpose:** LLM-powered conversational Q&A over repair history. Responds in service-advisor voice grounded in real shop data.

**API:**
```
GET  /api/knowledge-graph               → full graph (nodes + links)
GET  /api/knowledge-graph/clusters      → cluster summaries
GET  /api/knowledge-graph/stats         → RO distribution
POST /api/knowledge-graph/ask           → conversational Q&A
  Body: { question, history?, location?, customer_name? }
  Returns: { answer, data_used, suggested_questions }
```

**Graph Schema:**

| Node Types | Link Types |
|-----------|------------|
| rooftop, customer, vehicle, repair_job, part, cluster | OWNS, SERVICED_AT, HAD_REPAIR, USED_PART, IN_CLUSTER, TOP_JOB, ASSOCIATED_WITH |

**Q&A Orchestration — Parallel Intent Queries:**
1. Parse question for intent signals (make, job type, revenue, parts affinity, shop, customer)
2. Fire all matching MongoDB queries in parallel (`Promise.all`)
3. Build `extraContext` from results
4. Build system prompt: top 10 clusters + extra context + service advisor persona
5. Call `callAzureOpenAI()` with last 6 messages of history

**Response Format (enforced by prompt):**
```
**Bottom Line:** One plain-English takeaway
**What the data shows:** 1–4 findings with real numbers
**Why this answer:** 1–2 evidence points
**At the counter:** One actionable script for today
```

**Rule:** Uses ONLY data provided — no invented numbers. Floor language, not report language.

---

## Agent 5: Recommendation Engine

**Files:** `server/services/recommendationLLM.js`, `server/routes/recommendations.js`

**Purpose:** Generate 4 shop recommendations (utilization, revenue, customer_risk, anomaly) from a live shop snapshot. Each recommendation has 3 persona variants (owner, advisor, tech).

**API:**
```
POST /api/recommendations
Body: { shopId, edition: 'am' | 'oem', persona? }
Returns: { cached, generatedAt, ttlExpiresAt, recommendations[] }
```

**Cache:** MongoDB `wrenchiq_recommendations` — 15-minute TTL per `shopId + edition`.

**Snapshot Inputs:**
```
targetELR, actualELR, todayRevenue, last7DaysRevenue,
avgWaitTimeMinutes, totalDeclinedRevenue,
openROCount, closedROCount,
techStats[], openROs[{ declinedServices[] }],
last7DaysClosedSummary
```

**Edition-Aware Prompting:**
- **AM:** ELR, declined service upsell, customer loyalty, bay utilization
- **OEM:** warranty capture, fixed ops efficiency, service compliance

**Output Schema (4 items, strict JSON):**
```json
{
  "id": "rec-{domain}-{n}",
  "domain": "utilization|revenue|customer_risk|anomaly",
  "priority": "high|medium|low",
  "screenContext": ["dashboard", "orders"],
  "personas": {
    "owner":   { "headline": "", "explanation": "", "metrics": {} },
    "advisor": { "headline": "", "explanation": "", "metrics": {} },
    "tech":    { "headline": "", "explanation": "", "metrics": {} }
  },
  "signal": { "description": "", "dataPoints": ["", ""] }
}
```

**Parse + Validation:** Strips markdown fences, validates schema, filters meta-commentary patterns (`/cannot advise/i`, `/insufficient data/i`, customer ID references).

---

## Agent 6: 3C Story Writer Pipeline

**Files:** `src/services/am3cPipelineService.js`, `src/services/am3cLLMService.js`

**Purpose:** Progressive, 7-stage pipeline for building structured 3C service narratives (Complaint / Cause / Correction). Immutable stage advancement with full audit trail.

**Pipeline Stages:**

| Stage | Required | Description |
|-------|----------|-------------|
| `customer_intake` | Yes | Complaint + vehicle intake |
| `mpi_dvi` | No | DVI findings |
| `tsb_match` | No | TSB matches |
| `diagnostic_scan` | No | DTC codes |
| `tech_notes` | Yes | Technician notes |
| `work_performed` | Yes | Parts + labor operations |
| `final_review` | Yes | Assembled document |

**Key Functions:**
```javascript
createROContext(roId, vehicleVin)           // fresh RO context
advanceStage(roContext, stageId, stageData) // immutable, arrays append
skipStage(roContext, stageId, reason)        // throws if stage required
canFinalizeDocument(roContext)               // true if required stages done
getStageProgress(roContext)                  // { completed, total, percentage }
```

**Narrative Generation — 3 Modes:**

| Mode | Style | Use Case |
|------|-------|----------|
| `short` | 1–2 sentences/section | Quick DTC + TSB# citations |
| `verbose` | 3–5 sentences, plain English | Customer-friendly |
| `llm` (rewrite) | OEM/insurance professional standard | Warranty, legal |

**Professional (rewrite) format:**
```
COMPLAINT: 2 sentences
CAUSE: 3–5 sentences (DTCs, TSBs, test results)
CORRECTION:
  SECTION A — Work Performed (parts with part#, qty, verification test)
  SECTION B — Work Recommended (pending auth, parts with part# only)
```

**Fallback:** If Azure proxy unavailable (503), applies local text transformations.

---

## Agent 7: Entity Extractor (Shop Reminders / Promotions)

**Files:** `src/services/ingEntityExtractor.js`

**Purpose:** Extracts structured metadata from freeform shop reminder/promotion rules to enable smart matching against active ROs (make, model, mileage, service type).

**Fallback Chain (3 levels):**
1. `VITE_LLM_BASE_URL` — local OpenAI-compatible endpoint
2. `VITE_ANTHROPIC_API_KEY` — direct browser call to Anthropic
3. `/api/claude/messages` — server proxy fallback

**Model:** `claude-haiku-4-5-20251001`

**Output per entity:**
```json
{
  "promotionType": "generic|make_specific|model_specific|mileage_based|service_based|customer_segment",
  "conditions": { "vehicleMake": "", "vehicleModel": "", "mileageMin": 0, "mileageMax": 0, "serviceType": "" },
  "action": "≤10 words, imperative",
  "discount": "10% | $20 off | null",
  "displayLabel": "≤20 chars badge"
}
```

**Caching:** `localStorage` keyed by `ing._id` (key: `WRENCHIQ_ING_ENTITY_CACHE_V1`). Only uncached ings hit the LLM.

**Filtering:** `filterIngsByRO(ings, selectedRO)` — matches by make/model/mileage range against selected RO vehicle.

---

## Unified LLM Gateway

**File:** `server/services/azureOpenAI.js`

All server-side agents call `callAzureOpenAI()`. It handles:
- **Endpoint detection:** `/v1` suffix → Bearer auth; Azure deployment → `api-key` header + `api-version` query
- **JSON mode:** `jsonMode: true` sets `response_format: { type: "json_object" }`
- **Tool calling:** passes OpenAI-format tool definitions
- **Logging:** records to `wrenchiq_llm_logs` (provider, model, tokens, duration, route, status)

**Config keys (all from `.env.local`):**
```
LLM_BASE_URL           LLM_API_KEY           LLM_MODEL
AZURE_OPENAI_API_VERSION
CLAUDE_MAX_TOKENS_CHAT          (default: 800)
CLAUDE_MAX_TOKENS_RECOMMENDATIONS (default: 2048)
```

---

## Claude Proxy (Format Translation)

**File:** `server/routes/claudeProxy.js`  
**Endpoint:** `POST /api/claude/messages`

Translates Anthropic-format requests from browser clients to the Azure OpenAI gateway and wraps responses back into Anthropic format:

```json
{
  "id": "msg_azure_{timestamp}",
  "type": "message",
  "role": "assistant",
  "content": [{ "type": "text", "text": "..." }],
  "stop_reason": "end_turn | max_tokens",
  "usage": { "input_tokens": 0, "output_tokens": 0 }
}
```

This means all frontend code uses Anthropic SDK conventions regardless of the actual LLM provider.

---

## Orchestration Patterns Reference

| Pattern | Used By | Why |
|---------|---------|-----|
| Singleton bootstrap | Managed Agent | Reuse Anthropic agent + environment across sessions |
| Pre-fetch + tool loop | ARO Agent | Avoid loading 100K docs; tools return pre-fetched data |
| 15-min TTL cache (MongoDB) | Recommendation Engine | Avoid redundant LLM calls within same session window |
| Parallel intent queries | Knowledge Graph Q&A | Fire all relevant DB queries concurrently before LLM call |
| Immutable pipeline stages | 3C Story Writer | Full audit trail; idempotent re-submission per stage |
| Fallback chain | Entity Extractor, 3C | Degrade gracefully when LLM endpoint is unavailable |
| Format translation proxy | Claude Proxy | Frontend stays provider-agnostic |

---

## Token Budgets

| Agent | Max Tokens | Note |
|-------|-----------|------|
| Managed Agent | (streaming, no cap) | Anthropic manages |
| RO Agent | 512 | Short JSON response |
| ARO Agent | 1024 | JSON analysis |
| KG Q&A | 800 | `CLAUDE_MAX_TOKENS_CHAT` |
| Recommendations | 2048 | `CLAUDE_MAX_TOKENS_RECOMMENDATIONS` |
| 3C Narratives | 1024 | Per narrative mode |
| Entity Extractor | 1024 | Per batch |

---

## End-to-End Data Flows

### Inbound Lead → Draft RO
```
ROAgentPanel (demo leads)
  → POST /api/ro-agent/draft
  → callAzureOpenAI() (JSON mode)
  → { symptom, urgency, estimatedARO, services, advisorNote }
  → pre-populates NewROWizard
```

### RO → 3C Narrative
```
NewROWizard → RO in MongoDB
  → ROStoryWriterScreen
  → am3cPipelineService.advanceStage() (x4 required stages)
  → am3cLLMService.generateNarrative(mode, context)
  → POST /api/claude/messages (claudeProxy)
  → JSON { complaint, cause, correction }
  → render short / verbose / professional tabs
```

### Performance Monitoring (ARO Agent)
```
AROAgentScreen
  → POST /api/aro-agent/run
  → fetchAllAnalytics() — 7 parallel aggregations
  → callAzureOpenAI() with ARO_TOOLS
  → tool-calling loop (pre-fetched data, no extra DB hits)
  → JSON { status, alerts, recommendations, analytics }
  → render ring chart, trend, tech alerts, revenue opportunities
```

### Knowledge Graph Q&A
```
User question + optional filters
  → POST /api/knowledge-graph/ask
  → detect intent (make, job, revenue, parts, shop, customer)
  → Promise.all([relevant queries])
  → build extraContext
  → callAzureOpenAI() (history + service advisor system prompt)
  → { answer, data_used, suggested_questions }
  → render Bottom Line → Findings → Evidence → Counter script
```

### Shop Recommendations
```
Dashboard / Analytics
  → POST /api/recommendations { shopId, edition }
  → MongoDB cache check (15-min TTL)
  → [cache miss] buildSnapshot() → callAzureOpenAI() (edition-aware)
  → parseRecommendations() — validate + filter meta-commentary
  → write to MongoDB + return
  → 4 recs × 3 personas → render per active persona
```
