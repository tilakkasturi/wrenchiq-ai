# WrenchIQ — Simulated Data & Fake API Match Inventory

**Purpose:** a complete inventory of every place in this codebase that fakes/simulates a real external data source or API call, so each one can be found and swapped for a real integration later without re-auditing the whole app. This is a superset, at code level, of the screen-level MOCK/SYNTH/DEMO/LIVE tracker in `docs/IMPLEMENTATION_STATUS.md` (Confluence: *WrenchIQ.ai — Master Implementation Status*) — that doc tracks *which screens* aren't live yet; this one tracks *which functions/files* are doing the faking and how.

Last reviewed: 2026-08-11.

---

## Parts / Labor Pricing

| # | Location | What it fakes | Real integration it stands in for |
|---|---|---|---|
| 1 | `simulateCatalogMatch()` — `src/screens/WrenchIQSidecarScreen.jsx:84` (called at recommendation-accept time) | Deterministic hash-based fake parts/labor catalog match: hashes the service name into a stable `candidateCount` (3–6), `laborHrs` (0.3–1.4), a fake `partNumber` (`WRQ-#####`), and a 60/40 parts/labor cost split. Own doc comment: *"stands in for a real DE (parts/labor data) integration until one is scoped and identified (see WrenchIQ Product Spec v3.0 §4/§7)."* Deterministic (not random) so the same service always resolves the same way across renders. Only reached when `matchCannedJob()` (the shop's own real, priced canned-job menu) finds no match. |
| 2 | `TransferSimulationModal.jsx:96` | Discloses in-UI that "part/labor details were resolved via WrenchIQ's simulated catalog search at accept time"; the modal itself only simulates sending accepted recommendations to the SMS/DMS — never writes to a real system. | Downstream consumer of #1; would need a real SMS/DMS write-back API. |
| 3 | `PART_SEARCH_RESULTS` — `src/screens/PartsIntelligenceScreen.jsx:64` | UI claims *"Compare 6 vendors in real-time"* — not real. Hardcoded object keyed by literal search strings (e.g. `"brake pads honda crv 2019"`) mapping to 5 fixed vendor rows (Worldpac, O'Reilly, eBay Motors, NAPA, RockAuto) with static prices/ratings/ETAs. `PARTS_ORDERS` (order history/tracking) is likewise static fixture data. | A real parts-aggregator API (PartsTech-style multi-vendor search). |
| 4 | `OEM_PARTS` — `src/data/oemDemoData.js`, consumed by `src/screens/OEMPartsScreen.jsx:13` | Static fixture parts catalog with fabricated diagnostic narratives referencing real-looking TSB/recall numbers. | Live OEM parts lookup. |

## TSB / Recalls

| # | Location | What it fakes | Real integration it stands in for |
|---|---|---|---|
| 5 | `server/services/nhtsaTsbService.js` (`fetchTSBPayload`, line 48) | Calls `${NHTSA_TSB_API_BASE}/manufacturerCommunications?...`. **This endpoint does not exist** — confirmed live via direct `curl` against `api.nhtsa.gov` in this session: it 403s ("Missing Authentication Token", the AWS API Gateway stock response for an unmatched route), while the sibling `/makes` and `/models` endpoints under the same `/products/vehicle` namespace do work. NHTSA has no simple public flat TSB-by-vehicle endpoint the way it does for recalls/complaints. Fails open to `[]` on any error. | A working NHTSA TSB endpoint (path not yet found — needs further NHTSA API research) or a licensed TSB data provider (e.g. Mitchell1, ALLDATA). |
| 6 | `fetchTSBs()` — `server/services/roAdvisorService.js` | Calls #5 first; when the live result is empty/errors, falls back to this repo's own curated `src/data/tsbData.js` static set, reshaped to match the NHTSA field schema (`nhtsaNumber`/`manufacturerNumber`/`component`/`summary`). Added this session specifically because #5 never returns real data today. | Once #5 (or a licensed provider) is fixed, this fallback becomes a true fallback instead of the only path. |
| 7 | `src/data/tsbData.js` | Own header: *"NHTSA doesn't have a clean TSB API, so we use curated data."* Hand-written TSB/recall records for a subset of demo vehicles (Camry, CR-V, X3, F-150, Outback, RAV4, Highlander, Silverado 1500). | Backing data source for #6 until a real TSB feed exists. |
| 8 | `src/services/am3cTSBService.js` ("AM 3C TSB Match Integration Service — AE-878") | `PREDII_TSB_API_BASE = 'https://api.predii.com/v1/tsb'` is defined but never called — the real `fetch()` is commented out (line ~208: *"Mock the fetch — in production this would POST to PREDII_TSB_API_BASE"*). Demo mode resolves matches from `DEMO_REGISTRY` (`src/data/am3cDemoRegistry.js`, keyed by VIN or year/make/model/engine) with `_randomDelay()` faking network latency. A second, separate simulated fallback path exists in the same file for an "ALLDATA / Mitchell1 fallback TSB lookup." | The real Predii TSB API (`PREDII_TSB_API_BASE`), gated behind `PREDII_API_KEY` which isn't configured in this environment. |
| 9 | `server/models/TSBCache.js` | Not itself fake — a Mongo cache (`nhtsa_tsb_cache`) added specifically to avoid hammering NHTSA's real endpoint once it's fixed. Listed here as the piece that will matter once #5 is repaired. | N/A — infra for the real integration, not a simulation itself. |

## Vehicle Data (VIN Decode / DTC / Classification)

| # | Location | What it fakes | Real integration it stands in for |
|---|---|---|---|
| 10 | `decodeVIN(vin, demoMode)` — `src/services/am3cVINService.js:236` | Real NHTSA vPIC call exists (`vpic.nhtsa.dot.gov/api/vehicles/DecodeVin`) with a 3s timeout, but `demoMode=true` returns deterministic `DEMO_VIN_DATA`, and any unknown VIN or live-fetch failure silently falls back to `buildDMSFallback()` rather than surfacing the real decode result or a clear error. | Nothing extra needed — the real vPIC call exists; the fallback-on-failure behavior should be revisited once this ships live (surface the failure instead of masking it). |
| 11 | `src/services/nhtsaService.js` | A second, independent VIN/recalls/complaints client (`decodeVIN`, `batchDecodeVINs`) hitting the same NHTSA endpoints as #10 through a separate code path. Not simulated itself, but a duplicate integration surface worth consolidating. | N/A — dedup candidate, not a fake. |
| 12 | `enrichDTC(dtcCode, demoMode = true)` — `src/services/am3cDTCService.js:299` | Fakes 200–400ms "OBD-II adapter / cloud API" latency and returns from a hardcoded `DTC_LIBRARY` in demo mode. Live mode is an **explicit unimplemented stub**: `throw new Error('Live DTC enrichment not yet implemented. Use demoMode=true.')`. | A real DTC enrichment API/OBD-II data provider — not started yet. |
| 13 | `src/services/am3cClassificationService.js` ("AM 3C Classification Service — AE-868") | Own header: *"Demo mode only — simulates LLM classification via heuristics. No real API calls are made in this prototype."* `_simulatedDelay()` fakes 100–400ms LLM latency; heuristic seeded-random logic stands in for an actual classification model call. | A real LLM classification call (this pipeline stage doesn't hit an LLM at all today). |

## Recommendations Engine

| # | Location | What it fakes | Real integration it stands in for |
|---|---|---|---|
| 14 | `src/services/recommendationFallback.js` | Rule-based engine that reproduces the real `/api/recommendations` LLM response shape, used client-side when that endpoint returns 503/times out (`server/routes/recommendations.js`, backed by `server/services/recommendationLLM.js`). Not calling any external API itself — a deterministic fallback for when the real LLM path fails. | N/A by design — this is meant to remain a fallback, not be replaced; flagged here because it's easy to mistake its output for a real LLM recommendation if the 503 path isn't visible in the UI. |
| 15 | `writebackToSMS(..., demoMode = true, ...)` — `src/services/am3cSMSWritebackService.js:145` | In demo mode, simulates 500–800ms network latency and returns a synthetic `SYNCED` status without contacting any SMS. Live-mode branch is an **explicit stub**: *"Live mode — real API call (stubbed; replace fetch with actual HTTP client)"* — the actual `fetch()` is commented out. | A real SMS/DMS write-back API (Mitchell1, Tekmetric, Shop-Ware, etc.). |

## Other (Shop Activity / Trust / Demo Surfaces)

| # | Location | What it fakes | Real integration it stands in for |
|---|---|---|---|
| 16 | `useInsightNotifier()` — `src/services/insightNotifier.js` | Own header: *"simulates shop activity / WrenchIQ insight events."* Randomly emits one of 4 canned insight templates for a random customer on an interval — a fabricated activity feed, not backed by any real event stream. | A real shop-event stream (RO stage changes, new recommendations, overdue approvals, new DTC/TSB matches) pushed from the SMS/DMS. |
| 17 | `useDataFeedSimulator()` — `src/services/dataFeedSimulator.js` | Own header: *"stand-in for a real shop's periodic SMS/DMS data feed."* On each interval tick, picks a random RO and advances it one Kanban column. Contrast with `src/services/liveBoardFeed.js` (`useLiveBoardROs`), which is the real polled implementation (`/api/data-feed/customers` + `/api/repair-orders/story-ro/:roId`) — check which screens still use the simulator vs. the real feed. | The real Data Feed Model (`liveBoardFeed.js` already exists — this is a migration/cutover task, not a from-scratch integration). |
| 18 | `server/services/trustScoreService.js` | Computes Trust Score from real `RepairOrder` data (replacing an old static `CUSTOMERS_TRUST` mock) but documents concrete data-quality gaps it works around: `wrenchiq_ro`'s `customer.id` is a hardcoded 25-entry pool cycled across 100K ROs (not real per-customer identity — this is why it deliberately queries `RepairOrder`/`cornerstone` instead); `declinedServices[]` is unpopulated on all current `cornerstone` ROs so approval rate defaults to 100%; "comeback" count is hardcoded to 0 (no real field exists yet); "last contact"/"response rate" are proxies derived from RO recency, not a real communication log. | Real declined-service tracking, comeback tracking, and a real communication log, once those fields exist in the source system. |
| 19 | `CUSTOMERS_TRUST` — `src/screens/TrustEngineScreen.jsx:101` | Explicit comment: *"STATIC FALLBACK — Used only while the live /api/trust-score/customers call is loading, or if it errors out."* | Already backed by #18 when the live call succeeds — this is the loading/error fallback only. |
| 20 | `LEADS` — `src/screens/SocialInboxScreen.jsx:11` | Header: *"Mock Social Leads Data."* Fully fabricated Instagram/social DM leads (names, messages, AI-drafted replies). | Instagram / Google Business Messages inbound integration (tracked as DEMO in the Master Implementation Status doc). |
| 21 | `src/screens/CustomerDocumentScreen.jsx:611` and `src/screens/AM3CStoryWriterScreen.jsx:624` | Explicit in-UI banner on both screens: *"Demo Mode — All data is simulated."* | Whatever each screen's underlying real data source ends up being — these banners are the honest disclosure already in place. |
| 22 | Canned "system health"/activity strings in `src/components/WrenchIQAgent.jsx` (e.g. *"NHTSA VIN Decoder responding normally — 142ms avg"*, *"VIN decoded — no open recalls for this Tesla"*) and `src/screens/TechDVIScreen.jsx:778` (*"VIN decoded — no open recalls for this Tesla, all TSBs cross-referenced"*) and `src/screens/AICopilotScreen.jsx:58` (*"Cross-referencing NHTSA TSB database... Found TSB-19-052..."*) | Hardcoded display strings presented as if they were live decode/TSB-query results — they are not derived from any real call at render time. | Once VIN decode (#10/#11) and TSB lookup (#5–#8) are real end-to-end, these strings should be generated from actual results instead of hand-written. |

---

## How to use this doc

When a real integration for any row above ships:
1. Replace the simulated function/data with the real call, keeping the same return shape where practical so downstream consumers (UI cards, LLM tool results) don't need to change.
2. Delete the row from this table (or move it to a "Retired" section) so the doc stays a live todo-list, not a permanent record of debt.
3. If the real integration itself needs a fallback for outages, keep that fallback — but re-verify it still points at something sane (see row 6, which only exists because row 5 is currently the *only* path, not a true fallback).
