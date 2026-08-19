# Shop Intelligence Continuous Learning — v6

**Scope of this plan:** the event emitter + delta-update collection only (item 1 + first half of item 2 from the continuous-learning strategy). Pattern-mining batch triggers, recommendation-acceptance tracking, and snapshot versioning are follow-on work, not covered here.

## Problem

`buildSnapshot()` in `server/services/snapshotBuilder.js` recomputes shop stats (ELR, revenue, tech efficiency, open-RO detail) from a full Mongo scan every time `/api/recommendations` gets a cache miss (15-min TTL). RO writes in `server/routes/repairOrders.js` are plain `PATCH`/`updateOne` calls with no signal to anything else. Two consequences:

- Stats are only ever as fresh as the last cache miss, and are wrong the moment an RO closes mid-window.
- Every refresh pays the cost of rescanning all ROs for the shop, even though only one RO changed.

## Target architecture

```
repairOrders.js (PATCH /:id/status, PATCH /:id)
        │  RO write commits to Mongo
        ▼
  roEvents.emit('ro:closed' | 'ro:updated', { shopId, roId, before, after })
        │
        ▼
server/services/shopIntelligenceLive.js
  applyDelta(shopId, event)  →  updateOne(shop_intelligence_live, { $inc / $set })
        │
        ▼
  shop_intelligence_live collection (one doc per shopId, running totals)
        │
        ▼
snapshotBuilder.buildSnapshot() reads this doc instead of rescanning
  RepairOrder for the aggregate fields; still queries Mongo directly
  for the open-RO detail list (unavoidable — needs current row data).
```

## 1. Event emitter (`server/services/roEvents.js` — new file)

- A single `EventEmitter` instance, in-process (no message broker needed at current scale/single-server deployment).
- Emitted from `server/routes/repairOrders.js` at the two mutation points that currently write directly to Mongo:
  - `PATCH /:id/status` (kanban_status / status transitions) → emit `ro:statusChanged`
  - `PATCH /:id` (line items, labor hours, declined lines) → emit `ro:updated`
  - Both emits happen **after** the Mongo write succeeds, and carry `{ shopId, roId, before, after }` (the pre- and post-update documents, already available in the route since it does a `findOneAndUpdate`).
- Emission is fire-and-forget (`setImmediate` or plain sync emit) — must never block or fail the HTTP response. Wrap the listener side in try/catch, not the emit side.

## 2. Delta-update collection (`shop_intelligence_live`)

One document per `shopId`:

```js
{
  shopId: "cornerstone",
  updatedAt: ISODate,
  todayRevenue: 4820,
  last7DaysRevenue: 31200,
  openROCount: 12,
  closedTodayCount: 3,
  declinedRevenueOpen: 1150,
  techStats: {
    "tech-003": { flaggedHrs: 142.5, actualHrs: 138.0, roCount: 41 }
  },
  elrRunning: { flaggedHrs: 812.0, revenue: 158340 }  // actualELR = revenue / flaggedHrs
}
```

- `server/services/shopIntelligenceLive.js` exports `applyDelta(db, event)`:
  - `ro:statusChanged` to `closed`: `$inc` closedTodayCount, `$inc` last7DaysRevenue/todayRevenue by the RO's total, `$inc` elrRunning fields by the RO's flagged/actual hours, decrement `openROCount`.
  - `ro:statusChanged` to `open`/reopen: inverse increment.
  - `ro:updated` (declined line added/removed while still open): adjust `declinedRevenueOpen` by the delta between before/after declined totals.
  - Every branch uses `$inc`/`$set` with the numeric delta (before/after diff), never a recompute — that's the whole point.
- Day boundaries (`todayRevenue`, `closedTodayCount`) need a rollover: cheapest correct option is to key by date and check `updatedAt`'s date in `applyDelta` — if the stored date != today, reset the daily fields to 0 before applying the delta, rather than running a cron to zero them out.

## 3. Wire into `snapshotBuilder.js`

- `buildSnapshot()` reads `shop_intelligence_live` for the aggregate numbers (ELR, revenue, declined total, tech efficiency) instead of computing them from a full closed-RO scan.
- It still queries `RepairOrder` directly for the **open RO detail list** (customer name, vehicle, wait time per RO) — that's inherently row-level and cheap (already limited to 50).
- Fallback: if `shop_intelligence_live` has no doc for the shop yet (new shop, or migrating existing shops), fall back to the current full-scan path once and write the result as the seed document. This makes rollout backward-compatible with zero manual backfill step.

## 4. Backfill script (`scripts/seedShopIntelligenceLive.js` — new)

- One-time script to seed `shop_intelligence_live` for existing shops (cornerstone/ridgeline demo shops + any real shop-* ids) by running the equivalent of the current full `buildSnapshot` scan once and writing the aggregate fields. Needed so the first request after deploy isn't the fallback path for every shop simultaneously.
- Per repo convention (script-sync rule in CLAUDE.md), this is a new script, not a modification to the existing four import/normalization scripts — it doesn't touch demoData.js schema, so no sync needed there.

## Implementation checklist

- [ ] `server/services/roEvents.js` — EventEmitter singleton, typed emit helpers (`emitROStatusChanged`, `emitROUpdated`)
- [ ] `server/services/shopIntelligenceLive.js` — `applyDelta()`, `getLiveIntelligence(shopId)`, day-rollover logic
- [ ] `server/routes/repairOrders.js` — emit events post-write in both PATCH handlers
- [ ] Wire a listener at server startup (`server/index.js`) that subscribes `roEvents` → `shopIntelligenceLive.applyDelta`
- [ ] `server/services/snapshotBuilder.js` — read aggregate fields from `shop_intelligence_live`, keep open-RO detail query, add fallback-seed path
- [ ] `scripts/seedShopIntelligenceLive.js` — one-time backfill for existing shops
- [ ] Mongo index: `shop_intelligence_live.shopId` unique index
- [ ] Manual verification: close an RO via the kanban UI, confirm `shop_intelligence_live` doc updates without a full-scan, confirm `/api/recommendations` (post cache-expiry) reflects the new numbers

## Risks / open questions

- **Drift risk**: delta updates can drift from ground truth over time (missed event, race condition on concurrent PATCHes). Mitigate with a periodic reconciliation job (nightly, out of scope here) that recomputes from scratch and logs/corrects any divergence — don't build it now, but leave a TODO comment in `shopIntelligenceLive.js` pointing at this doc.
- **Multi-instance deployment**: if the API ever runs as more than one process, the in-process `EventEmitter` won't fan out across instances — each instance's writes only update its own emitter. At current single-process deployment this is fine; flagged here so it's not silently wrong later. A Mongo Change Stream on the `RepairOrder`/`wrenchiq_ro` collection would remove this constraint if/when the API scales horizontally, at the cost of one more moving part.
- **Two RO schemas**: `snapshotBuilder.js` already handles both camelCase `RepairOrder` (AM demo) and snake_case `wrenchiq_ro` (OEM import). `applyDelta` needs the same before/after field-name handling — reuse whatever normalization `snapshotBuilder.js` already does rather than duplicating it.
