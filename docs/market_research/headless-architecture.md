# WrenchIQ as a Headless Intelligence Layer — Embedded Design for a New Shop Management System

**Working assumption** (state it so we can correct it fast): "newly designed SMS" means a shop management system — yours or a partner's (myKaarma, Yonder/RO Writer-adjacent) — being built from scratch, where WrenchIQ is not a bolt-on integration like it is today with Mitchell1/ALLDATA/Snap-on, but the native intelligence substrate the SMS is built around from day one. If the target is actually "retrofit WrenchIQ deeper into an existing incumbent SMS," most of this still applies but §8 (migration) becomes the primary section instead of a footnote.

The core design move: stop thinking of WrenchIQ as an application that has a UI and gets connected to other systems, and start thinking of it as a library the SMS imports. The Python analogy: `requests` doesn't ship a browser, and `sqlalchemy` doesn't ship a database admin panel — they expose clean call surfaces and let the calling application own presentation and workflow. WrenchIQ should be your `requests`: the SMS is the application that imports it, calls it synchronously when it needs a decision, and subscribes to it when it needs to react to something that happened elsewhere. The moment WrenchIQ ships even one screen of its own UI, it stops being headless and starts competing with the SMS for screen real estate you don't want to own.

---

## 1. Design Philosophy

Three commitments, in priority order:

1. **No WrenchIQ-branded UI, ever, in the embedded product.** Every surface the shop's service advisor or technician sees belongs to the SMS's design system. WrenchIQ's job ends at a JSON payload or a typed SDK object. This is what makes it embeddable in *a* newly designed SMS as opposed to *your* newly designed SMS — the same service layer has to work whether the front end is built by you, myKaarma, or someone else three years from now.
2. **Decision boundary, not data boundary.** The SMS owns the repair order (RO) lifecycle, the customer record, and the technician workflow state machine. WrenchIQ owns *decisions about* those things — recommend this repair, flag this RO as high-warranty-risk, surface this TSB, price this labor line. It never owns the record of truth for anything the SMS already owns. This keeps the migration/adoption conversation simple for a partner SMS: "you keep your data model, we sit next to it."
3. **Every embedding point is metered from day one**, because the outcome-based/per-decision pricing model already in motion for enterprise customers only works if the unit of value (a decision, a recommendation, a surfaced insight) is instrumented at the API boundary, not reconstructed later from logs.

---

## 2. Service Decomposition

Break WrenchIQ into bounded services along decision type, not along your current org chart. Each is independently deployable, independently versioned, and — critically — independently embeddable, so an SMS partner can adopt one service before committing to all of them.

| Service | Decision it makes | Primary caller pattern |
|---|---|---|
| **RO Ingestion & Entity Extraction** | Structures raw RO/inbox/SMS-email text into typed entities (parts, labor, complaint, cause, correction) | Async, event-driven — fires on RO create/update |
| **Repair History Intelligence** | "What's the likely diagnosis/fix given this vehicle + complaint + history?" | Sync, request/response — called when advisor opens an RO |
| **Proactive Recommendations Engine** | "What should we recommend to this customer now, and through what channel?" | Async, scheduled/event-driven — fires off ingestion + service history triggers |
| **Warranty & TSB Matching** | "Is this a warranty claim, and which TSB/recall applies?" | Sync, called at RO write-up or at parts-order time |
| **Estimation Agent** | "Given a VIN/YMME and a requested component, what's the full related job — labor ops, parts, and price?" | Sync, called at estimate build; reasons over labor guide notes, shop-specific part pricing, canned jobs, and this YMME's historical estimates |
| **Shop Intelligence** *(added §12)* | "What does this specific shop's own history say about this canned job / recommendation / price point?" — acceptance rates, discount patterns, decay/retirement tracking, benchmarking | Sync, queried internally by the Estimation Agent and Proactive Recommendations; also the source feeding §9's manager rollups |

Each row is a service boundary you can actually put a contract around. The reason to insist on this decomposition rather than shipping one big "WrenchIQ API": a new SMS building v1 will want RO Ingestion and Repair History Intelligence on day one and will not want to also stand up TSB matching before they've shipped anything. Coupling adoption to the whole surface kills the "embed early, expand later" sales motion you need with a partner SMS.

---

## 3. Embedding Patterns

Three call patterns, matched to the table above — resist the temptation to make everything one pattern:

- **Synchronous decision API** (REST or gRPC, your call — gRPC if the SMS is going to call this in a hot path like RO write-up, REST if it's more occasional). Contract: request carries a tenant ID, an idempotency key, and a typed payload; response carries the decision plus a confidence/explanation object, because an SMS embedding a recommendation into someone else's UI will get asked "why did it suggest that" by shop owners and needs something to show.
- **Event subscription** (webhook, or better, a message bus topic the SMS's own event system can subscribe to — this matters more once the SMS itself is event-driven internally, which most modern ones are). WrenchIQ publishes `recommendation.created`, `warranty_risk.flagged`, etc. The SMS decides whether/how/where to surface them. This is the pattern that makes the Proactive Recommendations Engine genuinely headless — today it likely has its own notion of "send this reminder," which has to become "emit this event and let the SMS's own comms layer decide the channel," otherwise you've just rebuilt a bolt-on with extra steps.
- **Embeddable UI fragment, as an escape hatch, not a default.** Some decisions (an inline "3 similar repairs, here's what worked" panel) are genuinely easier to ship as a versioned web component the SMS mounts inside its own page than to have every partner reimplement rendering logic for a payload with ten fields. Keep this to a strict minimum and treat every one as a concession, not the architecture.

---

## 4. Data & Tenancy Model

Preserve the pattern that already works commercially for you: production inference runs inside the customer's own Azure/GCP tenant, so the SMS operator (or the shop's ultimate enterprise customer, depending who's the "customer" in this new SMS's contract) keeps data sovereignty, and Predii retains the intelligence layer as versioned, updatable service code rather than a static export.

For an embedded-in-a-new-SMS scenario specifically, add one more boundary decision up front: **does WrenchIQ ingest a copy of RO/customer data into its own tenant-scoped store (your current CosmosDB multi-RAG-pipeline pattern), or does it query the SMS's data store directly at decision time?** Recommend the former even here — a pull-and-index model where WrenchIQ maintains its own tenant-scoped index built from events the SMS emits, rather than being granted live query access into the SMS's primary datastore. It keeps the coupling at the event/API layer (versionable, contractable) instead of at the schema layer (which breaks the instant the SMS evolves its own data model, and a *new* SMS will evolve its schema constantly in year one).

---

## 5. API Contract Essentials

Non-negotiables for the contract, because this is the layer a partner SMS's engineering team will actually integration-test against:

- Tenant ID and idempotency key on every mutating or decision-triggering call.
- Every response includes a machine-readable confidence/explanation field — not optional, because "why" is the first question any embedding partner's support team will get from a shop owner about a surfaced recommendation.
- Explicit API version in the path or header, with a stated deprecation window (suggest minimum 12 months for a partner building commercial software on top of you — shorter than that and you become a integration-risk item in their own board decks).
- A sandbox/shadow-mode call for every sync endpoint: the SMS can call it in "score only, don't count toward metering, don't fire side effects" mode during their own development, which matters a lot for a new SMS that's still iterating on its own workflow.

---

## 6. Deployment Topology

Extend, don't replace, your existing pattern: containerized services, ArgoCD-managed Kubernetes rollout, deployed per-tenant inside the customer's Azure/GCP account. For the embedded-in-new-SMS case, the one new wrinkle is that "tenant" may now mean the *SMS operator's* tenant serving many shops underneath it (multi-tenant-within-a-tenant), rather than one shop or one enterprise customer directly. Design the tenant ID in every contract (§5) to be hierarchical from the start — `sms_operator_id / shop_id` — so you're not retrofitting a second ID dimension into every service six months in.

---

## 7. Pricing/Metering Instrumentation

Since per-decision/outcome-based pricing is already the direction for enterprise deals, every sync API call and every emitted event needs a metering event fired at the API gateway layer — not reconstructed from application logs after the fact. Two counters worth separating from the start: *decisions served* (every sync call, whether or not the SMS acted on it) versus *decisions acted on* (the SMS's own event, if you can get them to emit "recommendation accepted/shown to customer/customer converted" back to you). The second is worth negotiating into the partnership contract even though it costs you leverage to ask for it, because outcome-based pricing without an acted-on signal degrades into volume pricing with extra steps, and you lose the pricing story you actually want.

---

## 8. Migration Path (existing bolt-on customers → headless model)

Your current integrations with ALLDATA, Snap-on, Mitchell1, and MSX are bolt-on by necessity — you don't control their SMS's architecture. Two options, not mutually exclusive:

- **Wrap, don't rewrite.** Stand up the new headless service boundary (§2–§5) as the actual implementation, and keep the current integration surface with existing partners as a compatibility adapter translating their existing calls into the new internal contract. This means the new-SMS embedding work strengthens your existing relationships instead of forking your codebase into "old WrenchIQ" and "new WrenchIQ."
- **Offer the new contract as an upgrade path** to existing partners once it's proven with the new SMS — ALLDATA or Mitchell1 adopting the event-driven Proactive Recommendations pattern instead of whatever bespoke integration they have today is a natural expansion conversation, not a migration you force.

---

## 9. Shop Manager Console Endpoint (Read-Aggregate Service)

The shop manager persona is different from the advisor persona §2's sync APIs assume. An advisor works one RO at a time and needs a decision at write-up. A manager works the queue — they need "what needs my attention across the whole shop right now," not five separate calls to five separate services. So the manager-facing surface isn't another sync decision API — it's a read-optimized aggregation service sitting on top of the five services in §2.

Python analogy: don't hand the manager's dashboard five raw API responses and make its front end `pd.merge` them at render time. Precompute the equivalent of `df.groupby(shop_id).agg(...)` server-side and hand back one denormalized document per request. This is a CQRS read model — a materialized view over the underlying decision services — not a pass-through proxy.

**Endpoint**

`GET /v1/shops/{shop_id}/manager/console`

- Auth: bearer token scoped `role=shop_manager`. This is a distinct RBAC scope from the advisor token in §5 — the manager sees margin/cost fields, cross-RO conversion rollups, and technician-capacity data an advisor token has no reason to carry. `sms_operator_id` comes from the token claims, not the URL, so the path itself stays shop-scoped and cacheable.
- Query params: `since` (cursor/timestamp for incremental refresh instead of re-pulling the whole payload), `priority_min` (drop anything below a severity threshold), `include` (comma list — `recommendations`, `warranty_risk`, `aging_ros`, `technician_capacity`, `revenue_rollup` — so a single dashboard widget can request one slice instead of the whole console).

**Response shape**

```json
{
  "shop_id": "shop_9142",
  "generated_at": "2026-09-07T14:03:00Z",
  "attention_queue": [
    {
      "type": "warranty_risk",
      "ro_id": "ro_88213",
      "priority": "high",
      "summary": "Likely OEM warranty claim — TSB 24-01-03 matched, not yet filed",
      "confidence": 0.87,
      "action_url": "/ros/88213"
    },
    {
      "type": "recommendation_opportunity",
      "ro_id": "ro_88240",
      "priority": "medium",
      "summary": "Brake service recommended, not yet presented to customer",
      "confidence": 0.74,
      "action_url": "/ros/88240"
    }
  ],
  "rollups": {
    "recommendations": {"served": 214, "shown": 190, "accepted": 61, "converted": 47, "revenue_captured_usd": 8420},
    "warranty_catches": {"count": 6, "estimated_savings_usd": 3100},
    "ro_aging": {"p50_hours": 4.2, "p90_hours": 19.5, "stuck_count": 3},
    "technician_capacity": [{"tech_id": "t_04", "utilization_pct": 92, "open_ro_count": 6}]
  },
  "cursor": "eyJvZmZzZXQiOjIxNH0="
}
```

**Keeping it live, not just fetchable.** A manager glances at this dashboard continuously through a shift — pure polling on the GET is the wrong primary mechanism. Pair the endpoint with a `manager.console.delta` topic (the event pattern from §3): WrenchIQ pushes deltas the moment an underlying service produces a new `attention_queue` item, and the SMS's dashboard patches its local state instead of re-fetching the full console payload. The GET stays for initial load and for reconnect-after-offline — it's the snapshot; the event stream is what makes it feel live.

**Metering discipline.** The console read itself isn't a new billable event — it's aggregating decisions already metered where they were served (§7). What *does* need its own event: a manager acting on an `attention_queue` item (approve, dismiss, escalate) re-emits as a normal decision-acted-on signal, feeding the same outcome tracking §7 depends on. Don't double-meter a decision just because it surfaced once to an advisor and again, rolled up, to a manager.

**Update after §12:** now that Shop Intelligence is a WrenchIQ-owned service rather than an inbound dependency, this console's `rollups` block isn't a bespoke aggregation the console endpoint computes on its own — it's a thin read against Shop Intelligence's own per-shop output. The console stays the manager's *entry point*, but Shop Intelligence is where the actual acceptance-rate/benchmarking computation lives, which means the two need to be versioned and evolved together rather than letting the console's rollup shape drift from what Shop Intelligence actually tracks.

---

## 10. Advisor Interaction Model

The manager console in §9 is a materialized rollup because a manager works a queue. The advisor is the opposite persona: one RO, one customer, in a live conversation (at the counter or on the phone), where every call is inline and every millisecond of latency is felt as an awkward pause in front of the customer. So the advisor doesn't get a dashboard — they get a sequence of synchronous, in-line calls that fire as the SMS's own RO write-up screens progress. Python analogy: the manager console was a `groupby().agg()` batch job; the advisor's interaction is closer to calling a handful of small functions inline inside a request handler — `validate()`, `price()`, `explain()` — each one has to return before the next line of the UI can render, so each has to be fast and each has to be independently callable, not bundled into one mega-response.

**Token scope.** `role=advisor` is its own RBAC scope, distinct from `role=shop_manager` (§9) — the advisor token carries customer-facing explanation copy and per-RO decision detail, not shop-wide margin rollups or technician-capacity data. This matters because the same underlying decision (say, a recommended repair) needs two different renderings: an internal rationale for the manager's rollup, and a customer-safe explanation the advisor can say out loud or show on a screen.

**Walk-through of one RO, in call order:**

| Stage | Advisor action in the SMS | WrenchIQ call | Latency budget |
|---|---|---|---|
| Check-in | Opens/creates the RO, enters the customer's stated complaint | `POST /v1/ros/{ro_id}/diagnose` (sync, Repair History Intelligence) — returns likely diagnosis + confidence + supporting prior-repair references. Fired in parallel: async `ro.created` event to RO Ingestion & Entity Extraction, so the structured entities are ready before write-up finishes. | p95 < 500ms |
| Write-up / diagnosis entry | Enters technician's cause/correction notes | `POST /v1/ros/{ro_id}/warranty-check` (sync, Warranty & TSB Matching) — must return before the advisor quotes the customer, since a missed warranty match here is a margin/goodwill mistake, not just a missed upsell. | p95 < 500ms |
| Estimate build | Adds labor lines | `POST /v1/estimates/{estimate_id}/estimate-component` (sync, Estimation Agent), called once per component as the advisor requests it, not batched at the end — a VIN or bare YMME plus a component, expanded via labor guide reasoning into the full related job (parts, related labor ops, combination repairs) before the total updates. | p95 < 300ms per line |
| Presenting to the customer | Advisor is ready to discuss the estimate | `GET /v1/ros/{ro_id}/recommendations` — pulls whatever the Proactive Recommendations Engine has already computed asynchronously ahead of this moment (§2), ranked, each with a customer-safe explanation string ("last service noted brake wear at 80%") distinct from the internal confidence/rationale object used for the manager's rollup. This is read-only against precomputed results — it should never trigger a fresh inference call live in front of the customer. | p95 < 200ms |
| Close-out | Customer accepts/declines line items | `POST /v1/ros/{ro_id}/decisions/{decision_id}/outcome` — advisor records accepted/declined/deferred per recommendation and per warranty flag. This is the decision-acted-on event §7's outcome-based pricing depends on, and it's the same event type the manager's console (§9) re-emits when *they're* the one acting instead. | Fire-and-forget, non-blocking |

**Where the embeddable UI fragment earns its keep.** §3 treats the web-component escape hatch as a concession, not the default — but the advisor's "presenting to the customer" moment is the one place it's actually justified: an inline "here's why we're suggesting this" panel, with the vehicle's own repair history rendered as a small timeline, is real UI complexity that every partner SMS would otherwise reimplement identically. If you ship exactly one embeddable fragment in v1, this is the one — everything else in the advisor flow should stay pure JSON-in, render-it-yourself.

**What the advisor never sees.** No shop-wide rollups, no technician capacity, no aggregate conversion metrics — those are the manager's view (§9). The advisor's WrenchIQ surface is deliberately narrow: diagnose, warranty-check, price, recommend, record-outcome. Keeping it to five calls is what makes this embeddable in a partner SMS's write-up flow without asking their engineers to understand the whole service catalog in §2 — they wire up the one screen their advisor works from.

---

## 11. RO Journey Deep Dive: Estimate → Recommendations

§10 listed estimate-build and recommendation-presentation as two rows in a table. They're not actually independent — an upsell recommendation and a manually-added estimate line are the same real-world thing looked at from two different moments, and if the two calls don't talk to each other you get the advisor's screen recommending brake service the advisor already quoted five minutes ago. This section is the reconciliation logic between them, plus the timing question underneath it: recommendations aren't computed live, so what actually happens between "the engine decided this" and "the advisor sees it."

**Timeline — when each thing actually runs**

```
T-48h   RO scheduled (or prior visit closes out)          → Proactive Recommendations Engine triggered
        async, on ingestion event, using service history,
        mileage/interval data, prior declined items
T-2h    Pre-visit refresh (if mileage/telematics updated
        since scheduling)                                  → recommendation set re-scored, not re-created
T0      Check-in                                            → diagnose() sync call (§10)
T0+5m   Write-up                                             → warranty-check() sync call (§10)
T0+10m  Estimate build, component by component                → estimate-component() sync call per component + RECONCILE (below)
T0+18m  Advisor ready to talk totals                          → GET recommendations, filtered by reconcile state
T0+22m  Customer decides                                      → outcome() per item, fire-and-forget
T0+30m  RO closes                                             → outcome events roll into §7 metering AND
                                                                 feed back into the history store for next time
```

The precompute step at T-48h is the important detail: by the time the advisor is standing at the counter, the recommendation set already exists. `GET /v1/ros/{ro_id}/recommendations` in §10 is a read against that precomputed set — it is not, and should never become, a live inference call made while a customer is standing there. That's a hard latency and a hard trust constraint: an advisor cannot be seen waiting on a spinner to tell a customer why they should get their brakes done.

**The reconciliation problem: walk-ins and cache misses.** The T-48h precompute assumes a scheduled appointment. A walk-in customer has no lead time — there's no warm recommendation set waiting. Python analogy: this is exactly the `functools.lru_cache` miss case, and the design has to decide what happens on a miss rather than let the advisor's screen show an empty state. Recommended behavior: `GET recommendations` on a cache miss triggers a synchronous, deliberately cheaper fallback pass (rules/heuristics plus whatever ingestion has managed to extract in the few minutes since check-in — mileage-interval logic, open recalls, anything in the already-indexed repair history) rather than the full async-pipeline scoring, and returns within the same latency budget as the diagnose() call. It will produce a thinner set of recommendations than a scheduled visit gets, and that's fine — it should never return nothing when the alternative is a ten-second wait.

**The reconciliation problem: dedup against the estimate.** As the advisor adds lines during estimate build (T0+10m), each `estimate-component` call should carry enough of the component's identity (service/part code, system — brakes, cooling, etc.) for WrenchIQ to match it against the precomputed recommendation set and flip that recommendation's state rather than leave two copies of the same suggestion alive. This needs an explicit state machine per recommendation, not just a boolean:

```
pending → matched_to_estimate → presented → accepted / declined / deferred
   ↑                                              |
   └──────────────── deferred (re-enters pending for next visit) ──┘
```

- **pending**: computed, not yet touched.
- **matched_to_estimate**: the advisor independently added a line WrenchIQ recognizes as fulfilling this recommendation — it should now render (if at all) as a confirmation ("this is the brake service we'd have suggested anyway") rather than a fresh pitch.
- **presented**: the advisor pulled it via `GET recommendations` *and* explicitly marked it shown — see below, this has to be a deliberate action, not implied by the GET.
- **accepted / declined / deferred**: the customer's actual decision, from the `outcome()` call in §10.

**Why "presented" has to be its own explicit event.** §9's manager rollup reports `served` vs `shown` vs `accepted` as separate counts, and that distinction only means something if "shown" reflects a real human moment, not an API call. An advisor calling `GET recommendations` to glance at the list is not the same as the advisor actually saying it to the customer — those are different events with different pricing implications under an outcome-based model. So the SMS's write-up UI needs its own affirmative action (a "discuss with customer" button, or equivalent) that fires a `presented` event distinct from the read. Skipping this and treating every `GET` as "shown" is the single easiest way to quietly inflate the served-vs-shown ratio and undermine the pricing story in §7.

**Closing the loop.** Every `outcome()` call — accepted, declined, *and* deferred — doesn't just feed §7's metering, it writes back into the tenant-scoped history store from §4 that the Repair History Intelligence and Proactive Recommendations services read from. A declined recommendation isn't discarded — it reappears (state resets to `pending`) scored against the next visit, now informed by the fact that it was already offered and declined once, so the engine doesn't pitch the identical thing the same way twice. This is the difference between a service that recommends and a service that's actually watching each shop's outcomes: the loop only exists if decline/defer are wired back with the same rigor as accept.

---

## 12. Canned Jobs (Inbound) and Shop Intelligence (WrenchIQ-Owned)

**Resolved:** Predii builds Shop Intelligence. That flips half of this section from the original framing — Shop Intelligence is a sixth WrenchIQ service (§2), not an inbound dependency on something the SMS owns. Canned jobs stay the other way: the working assumption is still that the canned-job *catalog* (the menu of predefined labor+parts packages — "Front Brake Pad Replacement," "30K Mile Service") is a standard SMS concept the shop maintains inside the SMS itself, so that half stays an inbound query unless told otherwise.

**Third embedding pattern, not a fourth — and only for canned jobs.** §3 defined three WrenchIQ-to-SMS patterns (sync decision, event, embeddable fragment). Canned jobs still need the reverse: `GET` against the SMS's catalog at decision time, read-only, the same spirit as a function taking a keyword argument that changes its behavior without owning the data behind it. That's the one genuinely inbound dependency left in the design — spec it with its own latency budget and versioning, same rigor §5 puts on the outbound contract, pointed the other way. Shop Intelligence no longer needs this treatment: it's WrenchIQ's own service now, called the same way the Estimation Agent or Recommendations call any other internal service.

**What Shop Intelligence is built from.** This is the useful consequence of Predii owning it: WrenchIQ already ingests everything Shop Intelligence needs. Every `outcome()` call (§10, §11 — accepted/declined/deferred), every `estimate-component` and `canned-jobs/apply` call, and the RO Ingestion & Entity Extraction stream (§2) are already flowing through WrenchIQ's own tenant-scoped store (§4). Shop Intelligence is a derived/analytics layer computed from data WrenchIQ already has, not a reason to instrument the SMS further. That's worth saying plainly to a partner SMS in a sales conversation: adopting Shop Intelligence costs them zero net-new integration work beyond what §10's five calls already require.

**Sovereignty tension worth resolving before this gets built.** Everything else in this design deploys per-tenant inside the customer's own Azure/GCP account, preserving the data-sovereignty commitment the whole commercial model rests on. Shop Intelligence computed *per shop, within that shop's own tenant* fits that model cleanly — it's just another service reading from the store it already has access to. Shop Intelligence computed *across shops* — benchmarking this shop's brake-job acceptance rate against a regional or national baseline, which is a genuinely more valuable product than single-shop analytics — requires aggregating signal across tenant boundaries, and that's a different, harder conversation: either a separate cross-tenant aggregation service with its own (probably anonymized/aggregated-only) data-sharing agreement, or benchmarking gets scoped out of v1 entirely. Decide which one you're building before the service contract gets written, because the tenancy model in §4 and §6 was designed assuming single-tenant isolation, and cross-shop benchmarking is the one feature in this whole document that wants to break that assumption on purpose.

**Canned jobs change what gets recommended, not just what gets priced.** Today's design has Repair History Intelligence and Proactive Recommendations surface raw diagnoses and let the Estimation Agent price them component by component (§10's `estimate-component`, called once per component). With a canned-job catalog available, the right sequence flips: check the catalog for a matching package *before* falling back to line-by-line reasoning — the same shape as checking `CANNED_JOBS.get(diagnosis_code)` before computing a price from scratch. Concretely:

- Recommendation objects (§9's `attention_queue`, §10's `GET recommendations`) gain an optional `canned_job_id` field. When Repair History Intelligence's diagnosis matches a canned job in the shop's catalog, the recommendation *is* the canned job, not a set of raw lines — that's what the advisor will actually add, and it's a cleaner thing to show a customer than an itemized parts-and-labor breakdown.
- New endpoint: `POST /v1/estimates/{estimate_id}/canned-jobs/{canned_job_id}/apply` — replaces the per-line loop in §10 for anything catalog-backed. It returns the priced job in one call rather than N calls to `estimate-component`, and it's the call that consults shop intelligence (below) before returning a number.
- `estimate-component` doesn't go away — it's the fallback for genuinely custom repairs with no matching canned job, and it's also what canned-job pricing decomposes into internally if a shop wants a line-item breakdown on the printed estimate.

**Shop intelligence informs the price and the ranking, not just the display.** When `canned-jobs/{id}/apply` is called, WrenchIQ should query shop intelligence for that specific shop and job before returning a number — this shop's historical acceptance rate for this package, typical discount off list, current parts lead time. A canned job with a 30% historical acceptance rate at this shop and a 90% rate at another isn't the same recommendation, even though the labor guide math is identical. Same signal feeds ranking in the Proactive Recommendations Engine: a canned job this specific shop's customers routinely decline should rank lower in `attention_queue` and `GET recommendations`, or get bundled differently (offered alongside something with a higher accept rate), rather than surfaced with the same confidence every time regardless of this shop's own track record with it.

**Reconciliation gets simpler, not harder.** §11's dedup logic matched estimate lines against recommendations by service/part code, which is fragile — codes can be entered differently by different advisors. Matching on `canned_job_id` is exact-key matching, not fuzzy matching: when the advisor calls `canned-jobs/{id}/apply`, that id is the same one the recommendation carried, so the `pending → matched_to_estimate` transition in §11's state machine becomes a direct lookup instead of an inference. Line-by-line dedup (§11's original logic) is still needed as a fallback for the custom-repair case where no canned job existed to begin with.

**Latency note.** `canned-jobs/{id}/apply` is doing two things `estimate-component` didn't — a catalog lookup and a shop-intelligence query — so budget it separately: p95 < 400ms, not the 350ms-per-component figure in §10, and treat the shop-intelligence call as the one most likely to need a cached/stale-tolerant fallback (last-known stats, refreshed asynchronously) rather than blocking the advisor's estimate on a live analytics query.

---

## 13. Orchestration Model: Loop vs Graph

Worth deciding explicitly, because the answer changes whether WrenchIQ needs to own any orchestration logic at all — and "own orchestration logic" is exactly the kind of scope creep that turns a headless service layer back into an application. The honest answer is that it's neither a single loop nor a single graph — it's two different graphs at two different scopes, and they need different treatment. Conflating them is what makes the question feel harder than it is.

**Graph 1 — the per-RO call sequence (§10), which is really a DAG, not a loop.** Check-in → write-up → estimate → present → close-out never revisits an earlier stage within one RO; the only branch points are static (canned job vs custom at estimate build, precomputed vs fallback at presentation, both from §11/§12). The important design call here: **WrenchIQ should not orchestrate this DAG at all.** Each edge is just the SMS's own UI moving to its next screen and calling the next endpoint — if WrenchIQ owned this sequence as an internal workflow (a Temporal-style durable execution, a state engine tracking "which stage is this RO in"), it would be modeling the SMS's own UI flow, which is precisely the kind of thing §1's decision-boundary principle says should live on the SMS side. So Graph 1 doesn't need a graph engine — it needs a contract clear enough (§5, §10) that the SMS can implement the DAG itself, one endpoint call per screen transition.

**Graph 2 — the per-recommendation lifecycle (§11's state machine, extended by §12), which genuinely cycles.** `pending → matched_to_estimate/presented → declined/deferred → pending` again — but not later in the same RO, at the *next* RO for the same vehicle, potentially months out. This is a real cycle in the graph-theory sense, with multiple entry edges (initial creation from Repair History Intelligence, re-entry from decline/defer, re-scoring triggered by a shop-intelligence change). But it doesn't need a *running* process either — because transitions are triggered by discrete, far-apart events (an RO closes, a new visit starts), the right model is state-as-data: store current state plus a short history on the recommendation entity itself in the §4 tenant-scoped store, and let each triggering event look up and transition it. That's the distinction worth being precise about — a cycle in the state graph, without a process sitting in a while-loop waiting for it.

**Fan-out is graph structure too, and the design already has it.** `ro.created` firing both the synchronous `diagnose()` call and the async ingestion event (§10) is a one-to-many edge — the design should keep treating that as explicit graph structure (one trigger, multiple independent consumers) rather than assuming everything is a single-threaded call chain, especially as more services get added under §2.

**The decision this actually forces: cycle-safety on Graph 2.** Since it truly cycles, without a cap a repeatedly-declined recommendation nags the same customer forever. Recommend a decay/retirement rule as an explicit business decision, not a default: for example, two consecutive declines at the same or lower confidence retires the recommendation until a genuinely new signal reopens it — a new TSB, a mileage threshold crossed, a fresh technician diagnosis, or a meaningful shop-intelligence shift (a price change, say). Worth setting this deliberately rather than discovering the "recommend forever" version of it from an annoyed shop owner. Now that Shop Intelligence (§12) is a WrenchIQ-owned service already tracking per-shop, per-job decline history, it's the natural owner of this decay computation — Proactive Recommendations should call it to ask "is this one still live," rather than reimplementing the same decline-counting logic twice.

**One-line summary:** Graph 1 (per-RO) is a contract the SMS implements, not code WrenchIQ runs. Graph 2 (per-recommendation) is a state graph stored as data with an explicit decay rule, not a process. Neither is "just a loop," and treating either one as a simple loop is what would eventually force WrenchIQ into owning orchestration it shouldn't.

---

## 14. One Service or Many? Structured Decisions vs. a Generative Layer

Short answer: partially yes, and the "partially" is the useful part. "Rewrite CCC" (cleaning up a technician's raw notes into proper Complaint/Cause/Correction text) and "chat" are a genuinely different kind of request from "recommend," "price," or "warranty-check" — and that difference, not a preference for fewer services, is what should decide whether they collapse into one endpoint.

**Two tiers, not one flat list.** Everything in §2's table — Repair History Intelligence, Warranty & TSB Matching, the Estimation Agent, Proactive Recommendations, Shop Intelligence — is a **structured decision**: fixed input shape, fixed output shape, a confidence/rationale field, a specific latency budget, a specific place in §7's metering model. Python analogy: these are typed function calls — `estimate_component(query: ComponentQuery) -> EstimatedJob` — where you want the contract enforced, because a partner SMS's engineers are wiring a specific screen to a specific response shape, and because different decisions have wildly different latency needs (an `estimate-component` call in front of a customer can't share a code path with something that might take ten seconds).

"Chat" and "rewrite CCC" are **generative requests**: free-form context in, generated text out, no fixed schema on either side, and a much more relaxed latency/reliability bar (chat is inherently a back-and-forth; nobody expects sub-300ms turns in a conversation the way they expect it from a live price lookup). That's a real, structural reason these two can share one endpoint even though "recommend" and "price" shouldn't: `POST /v1/wrenchiq/generate` with a `task` field (`rewrite_ccc`, `chat`, maybe later `summarize_history`, `draft_customer_message`) is the Python equivalent of one `dispatch(task: str, **kwargs) -> str` function instead of a typed method per task — you skip paying the structured-contract cost for every generative ask, because there isn't a fixed shape to enforce in the first place.

**The generative layer sits on top of the structured services, not beside them.** The interesting design implication: chat, especially, is going to need to *answer* using facts the structured services already computed — "why did you recommend this brake job" should pull the actual confidence/rationale object Recommendations already returned (§10), not re-derive an answer from scratch. So the cleanest model is an agent layer that has the five/six structured services as callable tools internally, and "chat" is the one request type where WrenchIQ genuinely looks like a single conversational service — because underneath, it's still calling the same bounded services, just orchestrating them itself instead of leaving that orchestration to the SMS (this is the one place in the whole design where WrenchIQ *should* own some internal orchestration, precisely because it's WrenchIQ's own reasoning being exposed conversationally, not the SMS's UI flow from §13's Graph 1).

**What doesn't collapse.** Adoption motion (§2 — a partner adopts Repair History Intelligence without also taking Warranty Matching), latency isolation (a slow chat turn must never share a resource pool with a synchronous `estimate-component` call happening at the counter), and metering (§7) all still want the structured services kept separate underneath, even if chat and rewrite-CCC get a shared front door. So: one mental model, not one deployment — "WrenchIQ" can be marketed and integrated against as if it were a single intelligent service with a handful of request types, while the actual architecture keeps the six structured decisions bounded per §2 and adds exactly one new generative/agentic surface on top.

---

## 15. Worked Example: One Chat Request Through the Agent Graph

§14 said chat should be an agent with the structured services as callable tools, and that this is the one place WrenchIQ should own real orchestration. Here's what that actually looks like end to end, with one concrete request, so "graph" isn't just a word.

**Setup.** A 2019 Corolla was in a month ago with squeaking brakes. Repair History Intelligence diagnosed pad wear; Proactive Recommendations Engine created a `front_brake_pads` recommendation; the customer declined it (RO `ro_88001`, Aug 5). The car's back today for an oil change. The advisor, mid-write-up, types into the SMS's embedded chat widget: *"why are we suggesting the brake job again, didn't they say no last time?"*

**The graph:**

```
[router] --intent=explain_recommendation--> [context assembly]
                                                    |
                                                    v
                                          [tool selection] --fan-out--> [call: Recommendations.get()]
                                                    |                    [call: ShopIntelligence.decay_status()]
                                                    v                              |
                                          [decision node] <---------------------- +
                                           /              \
                             still_active=true      still_active=false
                                    |                        |
                                    v                        v
                        [synthesize: affirm+explain]  [synthesize: acknowledge retirement]
                                    \                        /
                                     \                      /
                                      v                    v
                                       [respond to advisor] --> (advisor asks follow-up) --loop back--> [router]
```

**Step by step:**

1. **Router.** Classifies the message: intent = `explain_recommendation`, entity = "brake job." The `ro_id`/`vehicle_id`/`shop_id` don't come from the message text — the SMS's chat widget passes them in as context because the advisor is already sitting on that RO's screen. This is the same session-context pattern the rest of the design assumes; the chat layer isn't exempt from it.
2. **Context assembly.** Resolves "the brake job" to a specific recommendation id (`rec_4421`) rather than guessing from free text — if the vehicle had two open recommendations, this is where ambiguity would get caught (see the loop-back note below).
3. **Tool selection + fan-out.** Same fan-out structure as `ro.created` triggering two consumers back in §10 — this router decides it needs two tool calls, and fires them together, not sequentially: `Recommendations.get(vehicle_id, job=front_brake_pads)` and `ShopIntelligence.decay_status(shop_id, job_id)`.
4. **Tool results, concretely:**
   - Recommendations: `{"state": "pending", "confidence": 0.81, "reason": "pad wear ~15% remaining per last inspection", "history": [{"ro_id": "ro_88001", "outcome": "declined", "date": "2026-08-05"}]}`
   - Shop Intelligence: `{"decline_count": 1, "retirement_threshold": 2, "still_active": true, "shop_avg_acceptance_rate": 0.62}`
5. **Decision node — a genuine conditional edge, decided by the tool results, not by static structure.** `decline_count (1) < retirement_threshold (2)`, so `still_active = true` and the graph routes to the "affirm and explain" branch instead of "acknowledge retirement." This is exactly the §13 decay rule from earlier being read live, not reimplemented — the chat layer doesn't recompute retirement logic, it asks Shop Intelligence for the answer.
6. **Synthesis.** The LLM composes the reply grounded in the tool outputs, not from its own memory of the conversation: *"Yes — declined once, on Aug 5th. It's still active because retirement only kicks in after two declines, and the pad wear estimate hasn't changed. This shop accepts this job about 62% of the time, for reference."* The response carries a citation object referencing `rec_4421` and `ro_88001` — the same confidence/rationale requirement §5 put on every structured decision applies here too, just attached to generated text instead of a typed field.
7. **The loop-back edge — why this is a graph and not a DAG.** If the advisor's next message is ambiguous ("what about the other one?"), the router re-enters with the prior turn's state still attached, and can route to a clarifying-question node before resolving anything, then loop back through tool selection once the advisor answers. §13's Graph 1 (the per-RO sequence) never revisits a node — this graph does, on purpose, within a single conversation. That's the structural difference: Graph 1 and Graph 2 are graphs about *data* (an RO's progress, a recommendation's lifecycle); this one is a graph about *reasoning*, and reasoning legitimately backtracks.

Python analogy for the whole thing: this isn't a fixed call chain like `a() then b() then c()`, it's closer to a dict-dispatch event loop — `while True: event = router(state); handler = HANDLERS[event.intent]; state = handler(state)` — where the loop only exits when a synthesis node produces a final response instead of routing to another node. The structured services (§2) stay exactly what they were: typed functions the graph calls as tools. Nothing about adding this graph changes their contracts — it's a new caller, not a new peer.

---

## 16. Autonomous Agentic Helper: Same Graph, a Different Trigger, and an Authority Gate

§15 walked through chat: a human asks, the graph runs, a human reads the answer. "Autonomous" doesn't mean a different architecture — it's the same graph (router → tool selection → tool calls → decision node → synthesis) with two things changed: what triggers it, and what happens after synthesis produces an answer. Python analogy: the difference between a request handler and a registered event callback — a Flask view function only runs when a request hits it; a file-watcher or a cron job runs the same kind of function unprompted, on its own schedule or trigger. Reactive chat is the request handler. Autonomous is the callback. The handler logic can be identical; what's new is the trigger and, critically, a permission gate before anything with real-world side effects executes.

**The trigger changes from a human message to an event.** Instead of the router firing because an advisor typed something, it fires on the same kind of event §2's async services already respond to — an RO closes, new mileage/telematics data lands, a shop-intelligence stat crosses a threshold. That part isn't new; Proactive Recommendations and Warranty Matching are already event-triggered. What's new is a graph that can chain *multiple* tool calls and reach a multi-step conclusion autonomously, the way §15's chat conversation did, rather than a single tool call producing a single flag.

**What's genuinely new: an authority gate after synthesis, before anything happens.** §15 always ended with "respond to the advisor" — a human was already in the loop by construction, because a human asked the question. An autonomous trigger has no human waiting, so before the graph's conclusion becomes an action, it has to pass through a policy check that decides how much authority this action type has:

| Tier | What it means | Example | Human involvement |
|---|---|---|---|
| **0 — Surface only** | Conclusion becomes information in the manager console `attention_queue` (§9) or advisor's recommendation list (§10). No action taken. | Warranty risk flagged; recommendation created. | Reviews and decides everything — this is what's already built. |
| **1 — Draft & propose** | The agent prepares a concrete artifact — rewritten CCC text, a drafted customer message, a filled-out warranty claim form — but doesn't send or file it. Sits as a pending-approval item. | "Draft ready: reminder text to send this customer about the brake job, given new mileage data." | One-click approve/edit/reject before anything leaves WrenchIQ's boundary. |
| **2 — Act within guardrails** | The agent executes directly, no approval step, for actions that are low-stakes and reversible. | Re-scoring/re-prioritizing a recommendation's rank in the queue; retiring a recommendation per §13's decay rule (already effectively autonomous today). | None at execution time — reviewed after the fact via the audit trail (below), and revertible. |
| **3 — Out of scope for v1** | Anything irreversible or that commits the shop or customer to money/liability without a human — actually filing an OEM warranty claim, sending a customer a specific price commitment, modifying a customer-facing estimate. | — | Always required, regardless of confidence. Worth stating this as an explicit non-goal rather than an oversight. |

**Worked example, continuing §15's Corolla.** No advisor asked anything this time. New mileage/inspection data lands from an unrelated visit, and the graph fires on that event instead of a chat message: router → context assembly → tool selection fans out to Recommendations and Shop Intelligence, same as before, but now the tool results show pad wear at 8% remaining (worse than the 15% from before) — a materially new signal. Decision node concludes this warrants proactive customer outreach before the next scheduled visit. Authority gate checks the policy for `action=customer_outreach` at this shop: configured as **Tier 1**. Result: a drafted reminder message appears in the manager console as a pending-approval item, not an autonomous text sent to the customer. If the same shop had `action=recommendation_reprioritize` configured as **Tier 2**, the graph would also silently bump this recommendation's priority in the queue directly, no approval needed, because that action was pre-authorized as low-stakes.

**The tier mapping is a policy object per shop, not a constant in the codebase.** `{"customer_outreach": "tier1", "recommendation_reprioritize": "tier2", "warranty_claim_file": "tier3"}` — configurable per shop or per SMS-operator default, because how much autonomy a shop wants to grant is a trust decision that should visibly belong to the shop owner, not something WrenchIQ decides unilaterally. This is also a real commercial lever: start every new partner at conservative defaults (mostly Tier 0/1), and let shops earn their way into Tier 2 for specific action types as the recommendation history proves out — the same trust-building arc as any autonomous system, made explicit and shop-controlled instead of implicit.

**Auditability is non-negotiable once anything executes without a human present.** Every Tier 1 or Tier 2 action carries the same citation trail as §15's chat answers — which tool calls ran, what data they returned, which policy tier authorized the outcome — plus, for Tier 2 specifically, a defined revert path, since "autonomous and irreversible" is exactly the combination Tier 3 exists to prevent, and a Tier 2 action that turns out to have been wrong still needs an undo, not just an apology.

---

## 17. The Agentic Runtime

§15 and §16 described a graph and how it gets triggered. This section is the thing that actually runs the graph — a deployable component, per tenant like everything else in this design, that the SMS talks to through one defined interface regardless of whether the trigger behind it was a chat message or an autonomous event.

**What the runtime owns, that the graph description alone didn't cover:**

```
┌──────────────────────────────────────────────────────────────────┐
│                 Agentic Runtime  (deployed per tenant, §4/§6)     │
│                                                                    │
│  SMS chat message ──▶  Entry Router  ◀── SMS/internal event       │
│                            │                                      │
│                            ▼                                      │
│                     Graph Executor                                │
│                     (router → tool-selection → tool calls →       │
│                      decision → synthesis; cycle-guarded)         │
│                       │                    │                      │
│                       ▼                    ▼                      │
│                 Tool Registry        Authority Gate (§16)         │
│                 (typed wrappers            │                     │
│                  around §2's six           ▼                     │
│                  structured services) Pending-Action Store        │
│                       │              (Tier 1 drafts)              │
│                       ▼                                           │
│              Audit/Trace Store ──▶ Metering Emitter (§7)          │
└──────────────────────────────────────────────────────────────────┘
```

- **Entry router** — the one thing that differs between reactive and autonomous (§16): it normalizes both a chat message and an event into the same internal "run request" shape before handing off to the graph executor. Neither the executor nor the tools downstream need to know which kind of trigger started the run.
- **Graph executor** — runs §15's graph with a hard guard the conceptual walkthrough didn't need to mention: a max-iteration cap (recommend 6 router re-entries) and a wall-clock timeout. A conversation that can loop needs a defined way to stop looping — on cap-out, the run terminates with status `escalate_to_human` rather than spinning, and that failure mode is itself logged, not silently swallowed.
- **Tool registry** — the six structured services from §2, plus the canned-job and shop-intelligence lookups, registered with typed schemas (this is literally what makes "tool selection" in §15 possible — the graph needs to know each tool's input/output shape to call it generically rather than having bespoke glue code per tool). Tools stay pure request/response, exactly as specified everywhere else in this design; the runtime is what holds state *across* calls to them, which keeps §1's decision-boundary principle intact — statefulness lives in the runtime layer, not pushed down into the structured services.
- **Authority gate + pending-action store** — implements §16's tier lookup and, for Tier 1, holds drafted actions until a human approves or rejects them via the interface below.
- **Audit/trace store + metering emitter** — every run's node path, tool calls, and policy decisions get written to the tenant-scoped store (§4), addressable by a `run_id`/`trace_id`; the metering emitter is where §7's and §14's still-open billing-unit question actually gets resolved in code, once decided.

**The defined interface.** Language-agnostic first — this should be an OpenAPI/protobuf contract, not a Python-specific one, since §9's still-open question (who builds the SMS) means the caller's stack isn't guaranteed to be Python. The core surface:

| Call | Purpose |
|---|---|
| `POST /v1/agent/runs` | Start or continue a run from a chat message (§15's reactive path). Body: `{tenant_id, shop_id, ro_id, session_id, message, context}`. Returns synchronously for fast runs, or a `run_id` to poll/stream for slower ones. |
| `GET /v1/agent/runs/{run_id}` | Poll a run's status and result — `completed`, `pending_approval`, `escalate_to_human`, or `failed`. |
| `POST /v1/agent/events` | Ingest an event that should trigger an autonomous run (§16), if the SMS pushes rather than the runtime subscribing directly to the bus from §3. |
| `GET /v1/agent/actions?status=pending` | List Tier 1 drafted actions awaiting human approval — surfaces in the manager console (§9) or advisor view (§10) as just another attention-queue item. |
| `POST /v1/agent/actions/{action_id}/approve` / `.../reject` | The human-in-the-loop gate for Tier 1 (§16). |
| `GET` / `PUT /v1/agent/policy/{shop_id}` | Read or set the per-shop autonomy tier mapping (§16) — this is the shop-owner-facing control surface, and probably the one part of this whole runtime a shop owner should be able to see directly. |

**What it looks like from the Python side** (a reference client, since that's how Predii's own tooling will call it, even if a partner SMS calls the REST contract directly in their own language):

```python
from typing import Protocol, Literal
from dataclasses import dataclass

@dataclass
class Citation:
    source_type: str   # "recommendation" | "warranty_flag" | "shop_intelligence" | ...
    source_id: str

@dataclass
class ProposedAction:
    action_id: str
    action_type: str   # "customer_outreach", "recommendation_reprioritize", ...
    tier: Literal["tier0", "tier1", "tier2", "tier3"]
    draft: str | None  # populated for tier1 drafts

@dataclass
class AgentRunResult:
    run_id: str
    status: Literal["completed", "pending_approval", "escalate_to_human", "failed"]
    response_text: str | None
    citations: list[Citation]
    proposed_actions: list[ProposedAction]
    trace_id: str

class WrenchIQAgentClient(Protocol):
    def start_run(self, *, tenant_id: str, shop_id: str, ro_id: str,
                   session_id: str, message: str, context: dict) -> AgentRunResult: ...
    def get_run(self, run_id: str) -> AgentRunResult: ...
    def approve_action(self, action_id: str) -> None: ...
    def reject_action(self, action_id: str, reason: str | None = None) -> None: ...
    def get_autonomy_policy(self, shop_id: str) -> dict: ...
    def set_autonomy_policy(self, shop_id: str, policy: dict) -> None: ...
```

This is deliberately a thin `Protocol` — five verbs, matched one-to-one to the REST surface above — because the value of the runtime is entirely in what happens behind `start_run`, not in a wide surface area the SMS has to learn. Same discipline §10 applied to the advisor's five calls: keep the embeddable interface narrow enough that a partner's engineers can wire it up without understanding the graph executor, the tool registry, or the authority gate underneath it.

---

## 18. Warranty & TSB Matching: How It Actually Integrates

This service has been in §2's table since the start, but only ever mentioned in passing — one sync call at write-up. Here's how it actually plugs into everything built since: the advisor flow, the tool registry, the agent graph, the tier gate, and the pricing step that comes right after it.

**Where it sits today (recap).** §10: `POST /v1/ros/{ro_id}/warranty-check`, called at write-up, p95 < 500ms, must return before the advisor quotes the customer. Input: complaint/cause codes, vehicle VIN/mileage. Output: `{is_warranty: bool, tsb_id, confidence, rationale}`.

**As a registered tool in the agentic runtime (§17).** Same typed wrapper as every other structured service — input/output schema registered in the tool registry so the graph executor can call it generically, not through bespoke glue code. This is what makes it usable from chat and from autonomous runs without writing two separate integrations.

**Reactive trace.** A Camry comes in with a transmission shudder complaint. The advisor isn't sure if this is TSB-covered and types into chat: *"is this shudder complaint likely covered under warranty?"* Router classifies intent = `warranty_lookup`; tool selection calls `WarrantyMatching.check(vin, complaint_code)` (not Recommendations or Shop Intelligence this time — different intent, different tool selected, same graph). Result: `{is_warranty: true, tsb_id: "TSB-23-0071", confidence: 0.88, rationale: "matches known shudder pattern for this transmission, TSB issued 2023"}`. Synthesis grounds the answer in that result and cites `TSB-23-0071` — same citation discipline as §15's brake-job example, different tool behind it.

**The propagation gap this closes.** §10 established that `warranty-check` runs *before* estimate build, but never specified what carries the result *into* estimate build — a real gap. The fix: the `is_warranty`/`tsb_id` result from `warranty-check` has to be passed into the subsequent `estimate-component` or `canned-jobs/{id}/apply` call (§12) as a parameter, not just displayed to the advisor and forgotten. A warranty-covered line prices against a warranty rate table (often zero customer cost), not the customer-pay canned-job path — the Estimation Agent needs `warranty_match_id` as an input specifically so it knows which rate table applies. Without this, the advisor sees "this looks warranty-covered" as a chat answer or a flag, and then the estimate still quotes the customer full price — which is the whole failure mode this service exists to prevent.

**Autonomous trigger — and a genuinely new event shape.** Every autonomous trigger described so far (§16) fires on a single-entity event — one RO closes, one vehicle's mileage updates. Warranty & TSB Matching has a second, different trigger worth naming explicitly: **an OEM publishes a new TSB.** That's not a per-RO event, it's a catalog update that should retroactively re-scan every recently-serviced vehicle of that make/model for a match against complaints already on file — a fan-out over many existing records at once, not one. This doesn't fit the per-entity event model the rest of the design assumes, and it needs its own throttling story (batch-scored overnight, not triggered live per publish) rather than being bolted onto the existing event bus as if it were the same shape.

**Where the tier gate actually bites.** §16's table already used "filing an OEM warranty claim" as the canonical Tier 3 example — this is where that becomes concrete. The match itself (`is_warranty: true`) is Tier 0, surfaced same as any other flag. Drafting the claim paperwork — pre-filling the OEM's form from the RO's data — is a reasonable Tier 1: propose the draft, a service manager reviews it before anything leaves the shop. Actually submitting it to the OEM stays Tier 3 without exception, because a wrong autonomous submission isn't reversible the way a mis-prioritized queue item is.

**Closing a second feedback loop.** §11 closed the loop on recommendations — accept/decline feeds back into future scoring. Warranty matching has the same opportunity and doesn't have it yet: whether the OEM ultimately approved or denied a filed claim is the ground truth for whether the match was actually right, and that outcome should feed back into Warranty & TSB Matching's confidence calibration the same way declines feed back into Recommendations. The catch, worth flagging rather than assuming away: that outcome usually lives inside the OEM's own warranty system, not the SMS, so getting it back to WrenchIQ may require the shop or advisor to manually record the claim result rather than an automatic event — a real data-availability gap, not just an integration detail.

---

## 19. Estimation Agent: How It Actually Integrates

Unlike Warranty Matching in §18, this one's already touched by nearly every layer added since §10 — it's the most heavily-integrated service in the whole design, so this is as much a consolidation as a walkthrough. It's also the one structured service that earns the word "agent" in its name: given a VIN (or a bare YMME when there's no VIN yet — a phone quote, a fleet estimate) and a requested component, it doesn't return one priced line, it reasons over the labor guide's own notes to surface the whole related job — a "rear disc brake pad" request pulls back labor for both rear wheels plus whatever combination operation (a rotor resurface, say) the guide's notes tie to that job — cross-checked against this shop's own part pricing, its canned-job catalog, and how it has actually priced that exact combination before.

**Where it sits today (recap across sections).** Two entry points, not one: `POST /v1/estimates/{estimate_id}/estimate-component` for a VIN/YMME + component query (§10, per-component, p95 < 350ms, called incrementally as the advisor works the estimate) and `POST /v1/estimates/{estimate_id}/canned-jobs/{canned_job_id}/apply` for catalog-backed jobs (§12, p95 < 400ms, consults Shop Intelligence for this shop's acceptance rate and discount pattern before returning a number). §18 added a third input to both: `warranty_match_id`, so a warranty-covered line prices against the warranty rate table instead of customer-pay. `estimate-component`'s own response carries the reasoning explicitly: `matched_operations` (each tagged `labor_guide_notes` or `combination_repair`), plus `local_part_price`, `canned_job_match`, and `historical_estimates_for_ymme` — the same four sources §2 lists it as reasoning across.

**As a registered tool (§17).** Same typed wrapper as everything else — both endpoints registered with schemas so the graph executor can call either one generically from chat or an autonomous run, same as Warranty Matching in §18.

**Reactive trace — pricing needs an *explain*, not just a *compute*.** A customer balks at a $150 alignment quote and the advisor asks chat: *"why is this priced at $150, they said their old shop charged less?"* Router classifies intent = `pricing_explain`; tool selection calls the Estimation Agent, but not with the same request shape `estimate-component` uses for computing a fresh number — it needs the rationale behind a number *already* returned, which means the Estimation Agent's tool interface needs an explain-mode alongside its compute-mode: `{labor_hours: 1.2, regional_rate: 110, shop_surcharge: 15, applicable_discount: none — "first-time customer discount already used on a prior visit"}`. Synthesis turns that into something the advisor can actually say out loud. This is the same confidence/rationale requirement §5 put on every structured decision, but it's worth calling out that "explain a decision already made" is a distinct capability from "make a new decision," and the tool registry needs to expose both.

**A real gap: bundle pricing doesn't fit the per-component/per-job call shape.** Every estimation call so far is deliberately stateless and independent — that's what makes "update live as the advisor works the estimate" work (§10), and that holds even once one `estimate-component` call can return several matched operations at once. But it still can't express "10% off if the customer takes brakes and rotors together" *across* two separately-requested components, because no single call sees the whole estimate. Proposed fix: a `POST /v1/estimates/{estimate_id}/finalize-pricing` call, made once right before the advisor presents the total — it sees every component/canned-job already priced individually and applies any bundle-level adjustment on top, rather than trying to make every incremental call aware of everything else on the estimate. This keeps the live-editing UX from §10 intact while still allowing bundle logic somewhere.

**Autonomous trigger — and a boundary worth being precise about.** Shop Intelligence (§12) tracks acceptance-rate trends per canned job; a real trend (this job's acceptance rate has been sliding for three months) is a legitimate autonomous trigger. But there are two different actions this could suggest, and they sit at different tiers, which is worth being exact about given §16's table already named "modifying a customer-facing estimate" as the canonical Tier 3 example: **repricing an estimate a customer has already been quoted is Tier 3, full stop, never autonomous** — that's someone's already-presented number. **Proposing a change to the shop's forward-looking menu price for that canned job** — the price the *next* customer sees — is a different, lower-stakes action, and a reasonable Tier 1: draft the suggested new price with the acceptance-rate trend as justification, let the shop manager approve it before it takes effect. Same service, same underlying signal, genuinely different tier depending on whether it touches a quote that already exists or one that hasn't been made yet.

**Feedback loop — this one's already closed, unlike Warranty's.** §18 flagged that warranty-claim outcomes need a new, possibly-manual feedback path. The Estimation Agent doesn't have that problem: whether a price was accepted already flows back through the existing `outcome()` call (§10, §11) and into Shop Intelligence's acceptance-rate tracking (§12) — the same plumbing that lets it check "how many times has this shop priced this exact combination" also carries the acceptance signal back for free. Worth noting as the counter-example: not every service needs a new loop invented for it, and it's worth checking what already covers a service before assuming it needs its own.

---

## 20. Open Decisions Worth Forcing Now

- Who is the commercial counterparty for the new SMS — is Predii building it, or is a partner (myKaarma-shaped, or Yonder/RO Writer-shaped) building it with WrenchIQ inside? This changes who owns the UI decisions in §1 and who owns the pricing relationship with the shop in §7. Worth nailing down before the service contracts in §5 get written, since "who's the customer" changes what the confidence/explanation payload needs to contain (a shop owner needs different justification than an SMS product manager does).
- How much of the current Proactive Recommendations Engine spec (the Confluence page) survives the move from "WrenchIQ decides the channel and sends the reminder" to "WrenchIQ emits an event and the SMS decides the channel." That's a real product capability you'd be handing to the SMS — worth deciding deliberately rather than by default.
- Whether the embeddable-UI-fragment escape hatch in §3 gets used at all in v1, or whether you hold the line at API-only for the first partner SMS to prove the discipline holds before you ship a single web component.
- The decay/retirement threshold on Graph 2 (§13) — how many declines, over what window, before a recommendation retires — is a real product/policy call, not just an engineering default, and it's worth picking a number rather than leaving it implicit.
- Single-shop vs. cross-shop Shop Intelligence (§12) — single-shop analytics fits the existing per-tenant sovereignty model cleanly; cross-shop benchmarking is more valuable but requires aggregating across tenant boundaries, which nothing else in this design does on purpose. Worth deciding which one v1 actually builds before the service contract for Shop Intelligence gets written, since the two have materially different data-sharing and deployment implications.
- Whether the canned-job *catalog* itself stays purely SMS-owned (§12) or whether Predii ends up wanting to standardize/normalize canned jobs across partner SMSs over time — the same kind of ownership question Shop Intelligence just resolved, one level down.
- How chat/generative requests (§14) get metered under §7's outcome-based model — a structured decision is one clean billable unit, but a chat conversation may internally call three or four structured services as tools before producing one answer. Worth deciding whether the billable unit is the conversation, the tool calls underneath it, or something else, before this ships rather than after a partner asks why their bill doesn't match their mental model of "one decision, one charge."
- Where default autonomy tiers (§16) start for a brand-new shop — the safe default is almost certainly "everything Tier 0/1 until a shop explicitly opts a specific action into Tier 2," but that's a trust and liability decision worth making explicitly rather than defaulting by whatever the engineering team finds easiest to ship first.
- Who is liable when a Tier 2 autonomous action turns out wrong (§16) — a mis-prioritized queue item is low-stakes, but the liability question needs an answer before Tier 2 covers anything with even modest downside, and that answer likely differs depending on whether Predii or the SMS operator is the commercial counterparty (the same question raised in the first item on this list).
- The graph executor's iteration cap and timeout values (§17) — 6 re-entries is a placeholder, not a researched number; worth setting deliberately once there's real conversation data to look at, since too low a cap escalates to a human too eagerly and too high one risks a slow, expensive run before anyone notices.
- How the "new TSB published" broadcast trigger (§18) gets scoped and throttled — re-scanning every recently-serviced matching vehicle on every OEM TSB publish could mean a large, expensive batch job with no natural per-RO boundary; worth deciding the batching window and rate limit before this ships, not after the first OEM update triggers an unexpectedly large run.
- Whether warranty-claim outcome (approved/denied by the OEM) is realistically obtainable at all (§18) — if it lives entirely inside OEM systems WrenchIQ has no access to, the confidence-calibration feedback loop depends on the shop manually recording outcomes, which is a workflow ask worth validating with actual advisors before designing around it.
- Whether the defined interface (§17) ships as a REST/OpenAPI contract only, or also as a Predii-maintained SDK per language — a Python client is trivial to justify given your own stack, but a partner SMS built on something else either writes their own thin client against the OpenAPI spec or waits on Predii to maintain one for them, and that's a support-burden decision worth making before the first partner integration starts.
- Whether bundle/package pricing (§19's `finalize-pricing`) is actually in scope for v1 or gets deferred — it's real added complexity for a capability no shop has asked for yet in this document; worth confirming it's wanted before building the call rather than speculatively supporting bundle discounts.
- Whether autonomously proposing menu-price changes (§19) is a capability shops actually want from WrenchIQ, even gated at Tier 1 — pricing strategy is core business judgment for a shop owner in a way that "should we send this reminder" isn't, and it's worth checking that assumption before building toward it rather than after a shop owner reacts badly to an AI second-guessing their prices.