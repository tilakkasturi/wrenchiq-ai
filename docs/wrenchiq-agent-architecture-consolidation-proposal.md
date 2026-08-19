# WrenchIQ Agent Architecture — Consolidation Proposal

**Status:** Proposal — not yet implemented
**Date:** 2026-08-11
**Owner:** Predii, Inc.
**Classification:** PREDII CONFIDENTIAL
**Relates to:** [WrenchIQ — Agent Orchestration & Design (Implemented)](https://predii.atlassian.net/wiki/spaces/prediiv2/pages/4091412481) (Confluence, "ten agents" framing) and [RO Advisor Agent — Exact Agentic Flow Today](https://predii.atlassian.net/wiki/spaces/prediiv2/pages/4175888387)

---

## 1. The question this doc answers

The Orchestration page currently documents "ten specialized AI agents." That framing was
audited against the actual code and doesn't hold up: most of these aren't agents in any
load-bearing sense — they're single LLM calls with assembled context, given "Agent N"
billing because they live in separate route/service files, not because they reason or act
differently from each other. Only one does genuine multi-step tool-calling over
conditionally-relevant data. This doc proposes collapsing the ten into a smaller, honestly
labeled set of primitives, and separates that from a second, lower-stakes question — the
actual API surface (`/api/shop-chat`, `/api/ro-chat`, etc.) doesn't have to change for the
service-layer cleanup to pay off.

## 2. What "agent" should mean here

Three different things have all been called "agent" on the Orchestration page. Worth
naming them separately so future additions get classified correctly:

| Term | Definition | Who actually qualifies today |
|---|---|---|
| **Agent** | Given a goal and a set of tools, decides *which* tools to call and *when*, across multiple rounds, because the right data source depends on what it finds | RO Advisor Agent only |
| **Single-call skill** | Fixed input → context assembly (deterministic code, no branching) → one LLM completion → parsed/streamed output. No decision-making about what to fetch — the caller already decided | Everything else that touches an LLM |
| **Workflow / state machine** | Deterministic app logic that happens to invoke a skill at certain steps | 3C Story Writer's stage pipeline |

## 3. Current state, audited

| Current "Agent N" | What it actually is | Evidence |
|---|---|---|
| 1. Managed Agent | Single-call chat skill with session history, no tools | `managedAgent.js` passes no `tools` param; header comment admits the Anthropic-Managed-Agents naming is a holdover |
| 2. RO Agent | Single-call extraction skill | `roAgent.js` — one `callAzureOpenAI()`, JSON parsed with try/catch |
| 3. ARO Agent | **Tool loop that doesn't earn its keep** | `aroAgentService.js` pre-fetches all 7 aggregations via `Promise.all` *before* the loop starts; the "tools" just index into already-fetched data — the loop buys smaller prompts, not fewer DB hits or better decisions. `/status` already proves the KPI math needs no LLM at all |
| 4. RO Advisor Agent | **The one real agent** | 6 tools, model decides which to call over up to 4 rounds, because relevance is genuinely conditional per RO (mileage table only matters if something's due; seasonal trends only if a Shop Profile exists; TSBs only for specific YMMs) |
| 5. Knowledge Graph Q&A | Single-call chat skill | Parallel DB queries (deterministic, not tool calls) → one `callAzureOpenAI()` |
| 6. Recommendation Engine | Single-call generation skill, cached | One call + 15-min Mongo TTL cache |
| 7. 3C Story Writer | Workflow (state machine) invoking a generation skill at specific stages | `am3cPipelineService.js` stage advancement is plain app state; only `am3cLLMService.generateNarrative()` touches an LLM |
| 8. Entity Extractor | Single-call extraction skill | 3-level fallback chain, one completion per batch |
| 9. Shop Chat | Single-call chat skill | One call, no tools, always default Predii LLM |
| 10. RO Chat | Single-call chat skill + a parameter (frontier tier, PII guard) | Same shape as Shop Chat plus `resolveModelTier()` |

**Concrete cost of the current split, not just a naming complaint:** `shopChatService.js`
and `roChatService.js` each define their own copies of `formatCannedJobsList()` and
`formatShopProfileSummary()` — identical logic, duplicated because they're two separate
"agents" instead of one chat skill parameterized by scope. Any future fix to how canned
jobs are formatted has to be applied twice and can silently drift.

## 4. Proposed architecture

```
┌─────────────────────────────────────────────────────────────┐
│  RO Advisor Agent  (the one real agent — unchanged)          │
│  6 tools, ≤4 rounds, conditionally-relevant data per RO       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Chat primitive  (one skill, parameterized by scope)          │
│  scope: session | graph | shop-wide | ro-scoped                │
│  → replaces: Managed Agent, KG Q&A, Shop Chat, RO Chat         │
│  → scope-specific bits become parameters, not separate files: │
│      session history (Managed Agent)                          │
│      graph query context (KG Q&A)                             │
│      shop-wide grounding, no RO (Shop Chat)                   │
│      RO-scoped grounding + frontier tier + PII guard (RO Chat) │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ARO analysis  (single call, tool loop dropped)                │
│  same 7 pre-fetched aggregations, same output shape,           │
│  one callAzureOpenAI() instead of a ≤N-round loop              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Skills  (invocable by the chat primitive, RO Advisor Agent,  │
│           or directly from a UI action — not agents)          │
│  • 3C narrative generation (am3cLLMService.js)                │
│  • Entity extraction (ingEntityExtractor.js)                  │
│  • Recommendation generation (recommendationLLM.js)           │
│  • RO Score checklist scoring (roScoreAgent.js)                │
│  • TSB lookup (nhtsaTsbService.js — already skill-shaped,      │
│    no LLM at all, just relabel it out of "agent" framing)      │
└─────────────────────────────────────────────────────────────┘
```

Net count: **1 agent + 1 chat primitive + 1 analysis call + 5 skills**, instead of 10
separately-branded agents — and the 5 skills were never agents to begin with, so the
real change is 10 → 3 in the "agent" column, plus an honest name for the rest.

### Why RO Advisor Agent stays as-is

It's the only case where the tool set is large (6 sources) and each one is genuinely
conditional per RO — letting the model pick what it needs keeps the prompt from bloating
with irrelevant data (e.g. seasonal trends when no Shop Profile has been persisted, or a
timing-belt check on a make that doesn't need one). This is the pattern the other nine
were being credited for without earning it.

### Why ARO loses its loop but keeps its LLM call

The narrative/recommendation layer on top of the KPI math is still worth an LLM call —
turning `{aro: 610, goal: 650, techs: [...]}` into an advisor-readable brief with specific
recommendations is real value. What isn't earning its keep is *how* that call is made:
tool-calling round-trips over data that was already fully fetched before the loop began.
Collapse `runAroAgent()`'s tool loop into the same single-pass shape
`roAdvisorService.js`'s own `runSinglePassAgent()` fallback already proves works — all 7
aggregations inlined into one prompt, one completion, done.

### Why the four chat surfaces become one skill, not one endpoint

This is a service-layer consolidation, not an API redesign. `/api/agent/sessions`,
`/api/knowledge-graph/ask`, `/api/shop-chat`, and `/api/ro-chat` can all keep their current
routes and request/response shapes — the frontend doesn't need to change. What collapses
is the *implementation underneath*: one `buildChatPrompt({ scope, ...groundingForScope })`
+ one `runChatSkill()` instead of four services each re-deriving canned-job formatting,
Shop Profile formatting, and history-slicing logic. Session history (Managed Agent),
graph-query context (KG Q&A), shop-wide-vs-RO-scoped grounding, and the frontier-tier/PII
guard (RO Chat-only today) all become parameters passed into one function rather than
four independently-maintained files.

## 5. Migration map

| Today | File(s) | Becomes |
|---|---|---|
| Managed Agent | `managedAgent.js`, `routes/agent.js` | Chat primitive, `scope: 'session'` |
| Knowledge Graph Q&A | `routes/knowledgeGraph.js` | Chat primitive, `scope: 'graph'` (parallel DB queries stay as pre-fetch, unchanged) |
| Shop Chat | `shopChatService.js`, `routes/shopChat.js` | Chat primitive, `scope: 'shop'` |
| RO Chat | `roChatService.js`, `routes/roChat.js` | Chat primitive, `scope: 'ro'`, carries the frontier-tier + PII-guard parameters forward unchanged |
| RO Advisor Agent | `roAdvisorService.js`, `routes/roAdvisor.js` | **Unchanged** |
| ARO Agent | `aroAgentService.js`, `routes/aroAgent.js` | Same routes, `POST /run` drops its tool loop for a single pass; `GET /status` unchanged (already no-LLM) |
| RO Agent (lead triage) | `routes/roAgent.js` | Skill: extraction, unchanged internals, reclassified only |
| Recommendation Engine | `recommendationLLM.js`, `routes/recommendations.js` | Skill: generation, unchanged internals |
| Entity Extractor | `ingEntityExtractor.js` | Skill: extraction, unchanged internals |
| 3C Story Writer | `am3cPipelineService.js`, `am3cLLMService.js` | Workflow (unchanged state machine) invoking Skill: 3C narrative generation |
| RO Score Agent | `roScoreAgent.js` | Skill: checklist scoring (was already "related but separate," now formally in the skill bucket) |
| TSB lookup | `nhtsaTsbService.js`, `routes/tsbLookup.js` | Skill (no LLM) — relabeled out of agent framing entirely |

**No frontend changes required.** Every existing endpoint keeps its path, request body,
and response shape. This is purely a backend service-layer consolidation.

## 6. Risks and open questions

- **Chat primitive parameterization risk:** RO Chat's frontier-tier/PII guard is the one
  place real behavioral logic lives outside "assemble context, call LLM." Folding four
  services into one must keep that guard scoped to `scope: 'ro'` only — Shop Chat has
  no frontier tier today and shouldn't silently gain one as a side effect of sharing code.
- **Format-helper drift:** `shopChatService.js` and `roChatService.js`'s duplicated
  `formatCannedJobsList`/`formatShopProfileSummary` may have already drifted subtly
  (worth a diff before merging) — pick the more correct version deliberately rather than
  assuming they're identical.
- **ARO single-pass regression risk:** confirm the single-pass version's output quality
  matches the tool-loop version on a sample of real shops before cutting the loop —
  `roAdvisorService.js`'s own fallback existing doesn't guarantee ARO's narrative quality
  transfers 1:1, since the two prompts aren't the same.
- **Sequencing:** the migration map's changes are independent of each other — they can
  land as separate PRs in any order, including one at a time with nothing shipped until
  each is verified against the existing endpoint's current behavior.

## 7. What this doc does not propose

- No change to RO Advisor Agent's tool-calling loop, TSB integration, or the Transfer-to-SMS
  simulation — those are working as designed and out of scope here.
- No endpoint renames, request/response shape changes, or frontend rework.
- No change to which LLM profile (default Predii vs. frontier) any given surface uses today.
