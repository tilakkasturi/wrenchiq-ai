/**
 * WrenchIQ — RO Value/Opportunity Score (V5 feedback C3)
 *
 * A second, independent score for the RO queue alongside the existing Gold
 * Standard hygiene score (server/routes/roGoldStandardScore.js, left as-is).
 * Where Gold Standard measures "did the advisor follow process on this RO,"
 * this measures "how likely is this customer to say yes" — value-based-
 * selling opportunity, not process compliance.
 *
 * Deterministic weighted formula (no LLM call) combining:
 *   - the customer's existing Trust Score (approval history, loyalty tier —
 *     see trustScoreService.js)
 *   - this RO's estimate size (bigger tickets are worth more selling effort)
 *
 * Collection: ro_value_score — cached per RO so the queue doesn't recompute
 * customer trust aggregations on every render; recomputed on demand via
 * computeValueScoresForShop.
 */

import { getCustomerTrustScores } from './trustScoreService.js';

const COLL = 'ro_value_score';
const ESTIMATE_CAP = 2000; // $ beyond this no longer adds estimate-size points

/**
 * @param {number} trustScore   0-100, from trustScoreService
 * @param {number} totalEstimate  this RO's dollar estimate
 * @returns {{score:number, band:string, components:object}}
 */
function scoreOne(trustScore, totalEstimate) {
  // Trust carries the heavier weight — a customer's track record of saying
  // yes is the stronger predictor than any single RO's ticket size.
  const trustContribution    = Math.round((trustScore / 100) * 65);
  const estimateContribution = Math.round((Math.min(totalEstimate || 0, ESTIMATE_CAP) / ESTIMATE_CAP) * 35);

  const score = Math.max(0, Math.min(100, trustContribution + estimateContribution));
  const band = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';

  return {
    score,
    band,
    components: {
      trustScoreContribution: trustContribution,
      approvalHistoryContribution: trustContribution, // trust score already weighs approval rate heavily — see trustScoreService.js
      estimateSizeContribution: estimateContribution,
    },
  };
}

/**
 * Computes value scores for every customer on file for a shop, keyed by
 * customerId — the RO queue joins this against each visible RO's
 * customerId + totalEstimate.
 *
 * @param {import('mongodb').Db} db
 * @param {string} shopId
 * @returns {Promise<Map<string, {trustScore:number, tier:string}>>}
 */
export async function getTrustByCustomerId(db, shopId) {
  const trustRows = await getCustomerTrustScores(db, shopId, 1000);
  return new Map(trustRows.map(r => [r.customerId, r]));
}

/**
 * Score a single RO given its customerId + totalEstimate, caching the
 * result so repeat queue renders don't re-run the trust aggregation.
 */
export async function getValueScore(db, shopId, { roNumber, customerId, totalEstimate }) {
  const cached = await db.collection(COLL).findOne({ shopId, roNumber });
  // Cache for 15 minutes — long enough to avoid recomputing on every queue
  // render, short enough to reflect a customer's trust score moving.
  if (cached && Date.now() - new Date(cached.computedAt).getTime() < 15 * 60 * 1000) {
    return cached;
  }

  const trustMap = await getTrustByCustomerId(db, shopId);
  const trust = trustMap.get(customerId);
  const trustScore = trust?.trustScore ?? 50; // no trust data on file → neutral midpoint, not 0

  const { score, band, components } = scoreOne(trustScore, totalEstimate);
  const doc = {
    shopId, roNumber, customerId,
    score, band, components,
    trustScore, tier: trust?.tier || null,
    computedAt: new Date().toISOString(),
  };

  await db.collection(COLL).findOneAndUpdate(
    { shopId, roNumber },
    { $set: doc },
    { upsert: true }
  );

  return doc;
}

/**
 * Batch score every RO in a list (e.g. the queue/Kanban) in one pass —
 * fetches the shop's trust scores once, avoiding N+1 aggregations.
 *
 * @param {import('mongodb').Db} db
 * @param {string} shopId
 * @param {Array<{roNumber:string, customerId:string, totalEstimate:number}>} ros
 * @returns {Promise<object>} map of roNumber -> value score doc
 */
export async function getValueScoresForROs(db, shopId, ros) {
  const trustMap = await getTrustByCustomerId(db, shopId);
  const now = new Date().toISOString();

  const results = {};
  const bulkOps = [];

  for (const ro of ros) {
    if (!ro.roNumber) continue;
    const trust = trustMap.get(ro.customerId);
    const trustScore = trust?.trustScore ?? 50;
    const { score, band, components } = scoreOne(trustScore, ro.totalEstimate);
    const doc = {
      shopId, roNumber: ro.roNumber, customerId: ro.customerId,
      score, band, components,
      trustScore, tier: trust?.tier || null,
      computedAt: now,
    };
    results[ro.roNumber] = doc;
    bulkOps.push({
      updateOne: {
        filter: { shopId, roNumber: ro.roNumber },
        update: { $set: doc },
        upsert: true,
      },
    });
  }

  if (bulkOps.length) {
    await db.collection(COLL).bulkWrite(bulkOps).catch(err => {
      console.warn('[roValueScoreService] cache write failed:', err.message);
    });
  }

  return results;
}
