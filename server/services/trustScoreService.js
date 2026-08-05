/**
 * WrenchIQ — Trust Score Service (Product Spec v3.0, S7.4 + S6)
 *
 * Computes per-customer Trust Score, loyalty tier, and approval rate from
 * actual RO history in the `RepairOrder` collection (camelCase, AM edition) —
 * replacing the static CUSTOMERS_TRUST mock array that used to live in
 * TrustEngineScreen.jsx.
 *
 * ── Why RepairOrder + 'cornerstone', not wrenchiq_ro + 'shop-001' ──────────
 * This originally queried `wrenchiq_ro` (the bulk production-import
 * collection), but that dataset's `customer.id` values come from a hardcoded
 * 25-entry pool in scripts/importRepairOrders.js, cycled via
 * `custPool[i % custPool.length]` across all 100,000 ROs — a deliberate
 * bulk-volume-test dataset, not real per-customer identity (confirmed by
 * code inspection, not just a low-cardinality *symptom*). No query-side fix
 * can make that collection produce realistic per-customer trust data.
 *
 * `RepairOrder`'s `cornerstone` shop (the real default single-shop identity —
 * see DemoContext.activeShopId, and the project's cornerstone/ridgeline vs.
 * shop-001 distinction: cornerstone/ridgeline are real single-shop ids,
 * shop-001 is a network-aggregate sentinel used only by aroAnalytics.js) has
 * a genuine 1:1 customer.id-to-RO mapping today (verified live: 8 ROs, 8
 * distinct customer.id values, no repeats). That's the right dataset for a
 * per-customer trust feature — this service now targets it by default.
 *
 * ── Known schema facts (verified against a live cornerstone RO doc) ────────
 *   - customer.id / customer.name
 *   - repairJobs[]        — services actually performed on that visit
 *   - invoice             — RO total (used as revenue; no separate line-item
 *                             cost breakdown is reliably populated on every
 *                             cornerstone RO)
 *   - dateIn              — visit timestamp
 *   - declinedServices[]  — field exists in the schema but is not populated
 *                             on any current cornerstone RO (verified: all 8
 *                             are `undefined`). Approval rate therefore
 *                             defaults to 100% for every customer today —
 *                             an honest reflection of "no decline data on
 *                             file yet," not a fabricated number.
 *   - no comebackRO-equivalent field exists on this collection — comeback
 *     count is hardcoded to 0 until real repeat-visit-for-same-issue data
 *     is captured. Flagged here rather than silently omitted.
 *
 * ── Known limitation (small-N, not fake-N) ─────────────────────────────────
 * cornerstone currently has exactly 1 RO per customer (8 customers total).
 * That means "visits" will show 1 and recency will match the single RO's
 * date for every customer until more repair history is seeded — a real,
 * small dataset (accurate, if thin) rather than the wrenchiq_ro problem
 * (a large, fake-uniform one). LTV/trust-score still differentiates
 * meaningfully because each customer's actual invoice total differs
 * ($145–$2,413 across the 8 current cornerstone ROs).
 *
 * ── Known schema gap: no communication/SMS history ─────────────────────────
 * There is no communication/SMS history field anywhere in this collection.
 * "Last contact" and "response rate" are derived as PROXIES from RO recency
 * and approval behavior, not a real communication log — called out at each
 * computation site.
 */

const COLL = 'RepairOrder';
const DEFAULT_SHOP_ID = 'cornerstone';

export const DATA_CARDINALITY_NOTE =
  "Demo dataset note: cornerstone currently has one repair order per customer " +
  "(8 customers total) and no declined-service history on file yet. Trust " +
  "scores/tiers below are real, live aggregations of that data — LTV and " +
  "approval-rate differentiation will deepen as more repair history and " +
  "declined-service records are captured for these customers.";

// ── Shared revenue expression ─────────────────────────────────────────────────
// RepairOrder's `invoice` field is the RO-level total and is populated on
// every current cornerstone RO ($145.50-$2,413 across the 8 on file) — used
// directly as revenue, with a repairJobs[]/parts line-item sum as a fallback
// for any future RO where `invoice` is missing.
const REVENUE_EXPR = {
  $let: {
    vars: {
      lineItemRevenue: {
        $reduce: {
          input:        { $ifNull: ['$repairJobs', []] },
          initialValue: 0,
          in: {
            $add: [
              '$$value',
              { $ifNull: ['$$this.lineCost', 0] },
              {
                $reduce: {
                  input:        { $ifNull: ['$$this.parts', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.lineCost', 0] }] },
                },
              },
            ],
          },
        },
      },
    },
    in: {
      $cond: [
        { $gt: ['$invoice', 0] },
        { $ifNull: ['$invoice', 0] },
        '$$lineItemRevenue',
      ],
    },
  },
};

// ── Tunables for the trust score formula ──────────────────────────────────────
// All weights are documented inline at the point of use below. Caps exist so
// a single whale visit or a single very-frequent customer can't blow past a
// component's share of the 0-100 scale.
const VISIT_CAP           = 15;     // visits beyond this no longer add frequency points
const LTV_CAP             = 10000;  // $ beyond this no longer add LTV points
const RECENCY_FULL_DAYS   = 90;     // last visit within this window = full recency bonus
const RECENCY_HALF_DAYS   = 180;    // last visit within this window = half recency bonus
const COMEBACK_PENALTY    = 8;      // points deducted per comeback RO (comebackRO flag)
const COMEBACK_PENALTY_MAX = 20;    // cap total comeback penalty
const VIP_LTV_THRESHOLD   = 5000;   // $ LTV threshold for the VIP tier override

/**
 * Aggregates per-customer trust data from actual RO history.
 *
 * @param {import('mongodb').Db} db
 * @param {string} [shopId] - defaults to 'cornerstone' (the default single-shop identity)
 * @param {number} [limit]  - max customers to return, sorted by trust score desc
 * @returns {Promise<Array>} one record per customer
 */
export async function getCustomerTrustScores(db, shopId, limit = 50) {
  const match = { 'shop.id': shopId || DEFAULT_SHOP_ID };

  const pipeline = [
    { $match: { ...match, 'customer.id': { $ne: null } } },
    { $addFields: {
        _revenue: REVENUE_EXPR,
        _declinedValue: { $sum: { $map: {
          input: { $ifNull: ['$declinedServices', []] },
          as: 'd',
          in: { $ifNull: ['$$d.estimatedCost', 0] },
        } } },
      } },
    {
      $group: {
        _id:              '$customer.id',
        name:             { $first: '$customer.name' },
        vehicleYear:      { $first: '$vehicle.year' },
        vehicleMake:      { $first: '$vehicle.make' },
        vehicleModel:     { $first: '$vehicle.model' },
        visits:           { $sum: 1 },
        totalSpend:       { $sum: '$_revenue' },
        lastVisit:        { $max: '$dateIn' },
        firstVisit:       { $min: '$dateIn' },
        // Real (not synthetic) service-acceptance signal: jobs actually
        // performed vs. services the customer declined, summed across every
        // RO on file for this customer. declinedServices is currently
        // unpopulated on every cornerstone RO (see file header) — this will
        // read as 100% approval until real decline data is captured, which
        // is accurate to the data on file, not a placeholder.
        performedJobs:    { $sum: { $size: { $ifNull: ['$repairJobs', []] } } },
        declinedItems:    { $sum: { $size: { $ifNull: ['$declinedServices', []] } } },
        declinedValue:    { $sum: '$_declinedValue' },
        // No comebackRO-equivalent field exists on this collection yet —
        // hardcoded to 0 rather than fabricating a signal that isn't there.
        comebackCount:    { $sum: 0 },
        // Most recent RO's declined items — used by the S6 dashboard to flag
        // an "outstanding follow-up" (see getConnectionDashboard below).
        lastDeclinedValue: { $last: '$_declinedValue' },
      },
    },
    { $sort: { totalSpend: -1 } },
    { $limit: Math.max(limit, 1) * 3 }, // over-fetch; final sort is by trust score, not spend
  ];

  const rows = await db.collection(COLL).aggregate(pipeline).toArray();

  const now = Date.now();

  const scored = rows.map(r => {
    const approvalRate = (r.performedJobs + r.declinedItems) > 0
      ? r.performedJobs / (r.performedJobs + r.declinedItems)
      : 1; // no declines on record → treat as fully accepting (no negative evidence)

    // Clamped at 0: a same-day visit whose stored timestamp is later in the
    // day than "now" (e.g. a story RO rebased to today at a fixed clock time
    // like 14:00, queried at 08:00) would otherwise floor to -1 — a same-day
    // visit is "today" (0 days since), never in the future.
    const daysSinceLastVisit = r.lastVisit
      ? Math.max(0, Math.floor((now - new Date(r.lastVisit).getTime()) / 86400000))
      : null;

    // ── Trust score formula (0-100), weighted combination ──────────────────
    // base(5) + frequency(25) + LTV(25) + approval(30) + recency(10) - comebacks
    // Frequency, LTV, and recency are capped so no single factor dominates;
    // approval rate carries the heaviest weight because it's the strongest
    // real signal of whether the customer trusts the shop's recommendations.
    const frequencyScore = Math.min(r.visits, VISIT_CAP) / VISIT_CAP * 25;
    const ltvScore       = Math.min(r.totalSpend, LTV_CAP) / LTV_CAP * 25;
    const approvalScore  = approvalRate * 30;
    const recencyScore   = daysSinceLastVisit === null ? 0
      : daysSinceLastVisit <= RECENCY_FULL_DAYS ? 10
      : daysSinceLastVisit <= RECENCY_HALF_DAYS ? 5
      : 0;
    const comebackPenalty = Math.min(r.comebackCount * COMEBACK_PENALTY, COMEBACK_PENALTY_MAX);

    const rawScore = 5 + frequencyScore + ltvScore + approvalScore + recencyScore - comebackPenalty;
    const trustScore = Math.max(0, Math.min(100, Math.round(rawScore)));

    // ── Tier assignment ─────────────────────────────────────────────────────
    // At-Risk overrides everything else: a low trust score or an active
    // comeback (a car that came back for the same problem) is the one signal
    // that should never be masked by high spend or long tenure.
    // Champion: near-max trust score (high frequency + high approval + recent).
    // VIP: high lifetime value that isn't already a Champion — big spenders
    //   deserve white-glove treatment even if they visit less often.
    // Loyal: everyone else in good standing — the default healthy-relationship tier.
    let tier;
    if (trustScore < 45 || r.comebackCount > 0) tier = 'At-Risk';
    else if (trustScore >= 88) tier = 'Champion';
    else if (r.totalSpend >= VIP_LTV_THRESHOLD) tier = 'VIP';
    else tier = 'Loyal';

    return {
      customerId: r._id,
      name: r.name || 'Unknown Customer',
      vehicle: [r.vehicleYear, r.vehicleMake, r.vehicleModel].filter(Boolean).join(' ') || null,
      visits: r.visits,
      ltv: Math.round(r.totalSpend),
      avgTicket: r.visits > 0 ? Math.round(r.totalSpend / r.visits) : 0,
      trustScore,
      tier,
      approvalRate: Math.round(approvalRate * 100), // e.g. 82 → "82%"
      lastVisit: r.lastVisit,
      firstVisit: r.firstVisit,
      daysSinceLastVisit,
      comebackCount: r.comebackCount,
      declinedItems: r.declinedItems,
      declinedValue: Math.round(r.declinedValue),
      // PROXY (S6): no communication log exists, so "outstanding follow-up"
      // is inferred from the customer's most recent RO having declined
      // services on file that were never subsequently re-presented/closed.
      hasOutstandingFollowUp: (r.lastDeclinedValue || 0) > 0,
    };
  });

  scored.sort((a, b) => b.trustScore - a.trustScore);
  return scored.slice(0, limit);
}

/**
 * S6 — Customer Connection Dashboard (aggregate view, v1 scope).
 *
 * Per the product spec, a full Customer Connection Dashboard needs a
 * dedicated scoping session (real communication-history data doesn't exist
 * yet). This is the reasonable v1: an aggregate summary strip plus a
 * customer list, built from getCustomerTrustScores() + explicit proxies for
 * the fields we don't have real data for.
 *
 * @param {import('mongodb').Db} db
 * @param {string} [shopId]
 * @param {number} [limit]
 */
export async function getConnectionDashboard(db, shopId, limit = 100) {
  const customers = await getCustomerTrustScores(db, shopId, limit);

  const total = customers.length;
  const avgTrustScore = total > 0
    ? Math.round(customers.reduce((s, c) => s + c.trustScore, 0) / total)
    : 0;

  // PROXY (S6): "recent contact" = an RO visit (the only timestamped
  // customer-touch event in the schema) within the last 90 days. There is no
  // separate communication/SMS timestamp to use instead.
  const recentContactCount = customers.filter(
    c => c.daysSinceLastVisit !== null && c.daysSinceLastVisit <= RECENCY_FULL_DAYS
  ).length;

  const outstandingFollowUps = customers.filter(c => c.hasOutstandingFollowUp).length;

  return {
    summary: {
      totalCustomers: total,
      avgTrustScore,
      pctRecentContact: total > 0 ? Math.round((recentContactCount / total) * 100) : 0,
      outstandingFollowUps,
    },
    customers: customers.map(c => ({
      customerId: c.customerId,
      name: c.name,
      tier: c.tier,
      trustScore: c.trustScore,
      lastVisit: c.lastVisit,               // proxy for "last contact"
      daysSinceLastVisit: c.daysSinceLastVisit,
      approvalRate: c.approvalRate,          // proxy for "response rate"
      hasOutstandingFollowUp: c.hasOutstandingFollowUp,
      declinedValue: c.declinedValue,
    })),
  };
}
