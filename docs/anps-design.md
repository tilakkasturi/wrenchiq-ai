# Agentic NPS (ANPS) — Design

**Status:** design only, not yet implemented. Written 2026-08-13, in response to a review of the RO Value/Opportunity Score formula (`server/services/roValueScoreService.js`) and a proposal to build a survey-free NPS proxy.

## Why this exists

The original Trust Engine spec (2026-03-22, Confluence: *WrenchIQ — Trust Engine & Customer Retention Specification*) already planned an "Advocacy" component (20% weight) built from *"NPS + reviews left + referrals made"*, with NPS sourced from a **post-service survey**. That survey was never built, and none of Advocacy's three inputs (NPS, reviews, referrals) exist in the live `trustScoreService.js` today — Trust Score currently only computes Visit Recency/Frequency, LTV, and Approval Rate.

ANPS replaces the never-shipped "survey NPS" with an inferred promoter/passive/detractor classification built from behavior — no survey required. "Agentic" refers specifically to Tier 3 below: an LLM agent reading real customer text for advocacy/detractor language, the same way `roAdvisorService.js`'s ReAct loop reads tool outputs, rather than a purely static formula.

## What NOT to reuse

`roValueScoreService.js`'s formula (`trustScore/100×65 + min(estimate,$2000)/$2000×35`) is a **sales-opportunity** score — bigger tickets score higher regardless of whether the customer is happy. That's the wrong shape for NPS: ticket size has no relationship to advocacy, and folding it in would mislabel big-spenders as promoters regardless of actual sentiment. ANPS does not use estimate/ticket size as an input anywhere.

## Data reality check (as of 2026-08-13)

| Signal | Status | Notes |
|---|---|---|
| Visit recency/frequency (`dateIn` history) | **REAL** | Already computed in `trustScoreService.js` |
| Approval rate (`declinedServices[]` vs performed) | **REAL formula, thin data** | Genuine calculation, but `declinedServices[]` is empty on most seeded cornerstone ROs, so it renders ~100% for nearly everyone today |
| Spend trend (`invoice`/estimate over time) | **REAL** | Derivable from existing RO history, not currently computed anywhere |
| Comeback-for-same-issue | **ABSENT** | `trustScoreService.js` hardcodes `comebackCount: 0` — no field captures this anywhere |
| Referral tracking | **ABSENT** | `TrustEngineScreen.jsx`'s referral count/timeline/button are UI mock only, no backing field |
| Customer-side chat/text/review sentiment | **ABSENT** | The data model is one-directional (shop → customer). RO Chat and SMS write-back only draft/send outbound text; no inbound customer reply is ever stored. `SocialInboxScreen.jsx`'s customer messages are hardcoded mock, not persisted. |

This table is why ANPS ships in phases rather than all at once — Tier 2/3 below need new instrumentation, not just a new formula.

## Design

### Output shape
```js
{
  customerId,
  anpsBucket: "promoter" | "passive" | "detractor" | "insufficient_data",
  anpsScore: -100..100 | null,   // null when insufficient_data — never a guessed neutral value
  confidence: "low" | "medium" | "high",
  rationale: string,             // agent-generated, human-readable — mirrors advisorBrief in roAdvisorService.js
  signalsUsed: string[],         // e.g. ["visit_retention", "approval_rate", "spend_trend"]
}
```

Core rule, carried over from this session's cabin-air-filter/ings fix and the critique of Trust Score's approval-rate default: **a missing signal is `insufficient_data`, never silently folded in as neutral or positive.** A customer with zero real signals gets no score, not a fake 50.

### Tier 1 — Deterministic, buildable now (real data only)

1. **Visit retention** — is the customer on-cadence, or silently overdue well past their typical interval with no visit and no decline-and-leave event? Silent churn is a classic "unhappy but never told you" detractor pattern — inferable without a survey.
2. **Approval rate, gated on sample size** — only counted once a customer has enough recommendation history (e.g. ≥2 ROs with at least one recommendation each) to mean something; otherwise excluded rather than defaulting to 100% the way `trustScoreService.js` does today.
3. **Spend trend** — rising average ticket over successive visits leans promoter; declining/erratic leans detractor. Not currently computed, but derivable from existing `invoice`/`dateIn` fields with no new instrumentation.

Each signal normalizes to a −1..+1 lean and only contributes when its data requirement is met. Zero qualifying signals → `insufficient_data`.

### Tier 2 — Needs new instrumentation (not built)

- **Comeback-for-same-issue** — add a `comebackForRoId` (or similar) field set when a new RO's concern matches a recently-closed RO's completed work for the same vehicle. This is the single strongest detractor signal available once it exists.
- **Referral tracking** — add a `referredByCustomerId` field on new customer records, captured at intake. Single strongest promoter signal once it exists — a real "told a friend" event, not a survey answer about intent to do so.
- **Review/rating capture** — if/when a real Google/Yelp integration lands (tracked as DEMO in the Master Implementation Status page), star rating + review text is close to a literal NPS proxy and should feed directly into Tier 1's spend-trend-style signal set.

### Tier 3 — The agentic layer

Once Tier 2 lands, a small tool-calling agent (same ReAct shape as `roAdvisorService.js`) reads actual customer-side text — chat replies, SMS responses, review text — via a `get_customer_communications(customerId)` tool, and classifies tone: explicit promoter language ("I'll tell my friends," "best shop I've been to"), explicit detractor language ("never coming back," "way overpriced"), or neutral/transactional. It produces the `rationale` field above in first person for the advisor, and falls back cleanly to the Tier 1 score alone when there's no text to read — the same fail-open convention every other agent in this codebase already follows (see `roAdvisorService.js`'s TSB/canned-job/seasonal-trends fetchers).

### Shop-level ANPS

Aggregate the same way real NPS is aggregated: `%Promoters − %Detractors`, computed only over customers with a non-null `anpsScore` — `insufficient_data` customers are excluded from the denominator entirely, not counted as passive, so the number isn't diluted by "we don't know" customers.

## Rollout phases

1. **Phase 1 (buildable now):** Tier 1 only. Ships as a labeled "ANPS (beta) — behavioral proxy, partial signal" field on the Trust Engine customer profile, with a visible confidence indicator, replacing the spec's original (never-built) "NPS from post-service survey" row.
2. **Phase 2:** Add comeback + referral schema fields (Tier 2) — most improves accuracy, no LLM needed yet.
3. **Phase 3:** Add the agentic text-sentiment layer (Tier 3) once real customer-side text capture exists — this closes a genuine product gap (the model is currently one-directional), not just a data-population gap.
