/**
 * WrenchIQ — Recommendation Closed-Loop Tracking (V5 feedback C2)
 *
 * Collection: recommendationEvents (append-only)
 *
 * `Recommendation` (server/models/Recommendation.js, collection
 * `recommendations`) is a TTL-expiring generation cache — it answers "what
 * did we generate," not "what happened to it." This is a separate,
 * non-expiring event log answering the latter, so a shop's conversion rate
 * survives past any individual batch's 15-minute cache window.
 *
 * Event types:
 *   shown                — recommendation was returned to a client
 *   accepted             — advisor/owner explicitly accepted it
 *   dismissed            — advisor/owner explicitly dismissed it
 *   implemented_untracked — the recommended action appears to have happened
 *                           on the RO without an explicit accept click
 *                           (best-effort match, not a causal guarantee)
 */

const COLL = 'recommendationEvents';

/**
 * @param {import('mongodb').Db} db
 * @param {object} event
 * @param {string} event.shopId
 * @param {string} event.recommendationId
 * @param {string} [event.roNumber]
 * @param {string} [event.domain]
 * @param {'shown'|'accepted'|'dismissed'|'implemented_untracked'} event.event
 * @param {string} [event.persona]
 */
export async function logRecommendationEvent(db, event) {
  const { shopId, recommendationId, event: eventType } = event;
  if (!shopId || !recommendationId || !eventType) return;

  try {
    await db.collection(COLL).insertOne({
      shopId,
      recommendationId,
      roNumber: event.roNumber || null,
      domain: event.domain || null,
      event: eventType,
      persona: event.persona || null,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[recommendationEventsService] log failed:', err.message);
  }
}

export async function logRecommendationEventsBatch(db, events) {
  if (!events?.length) return;
  try {
    await db.collection(COLL).insertMany(events.map(e => ({
      shopId: e.shopId,
      recommendationId: e.recommendationId,
      roNumber: e.roNumber || null,
      domain: e.domain || null,
      event: e.event,
      persona: e.persona || null,
      timestamp: new Date().toISOString(),
    })));
  } catch (err) {
    console.warn('[recommendationEventsService] batch log failed:', err.message);
  }
}

/**
 * Best-effort "implemented without an explicit accept" detection — call when
 * an RO's estimate is approved. Any recommendation attached to that RO
 * (roNumber match) that was shown but never explicitly accepted or dismissed
 * gets logged as implemented_untracked. This is a coarse RO-level proxy, not
 * exact line-item matching — the RO's estimate being approved is a real
 * revenue signal even without knowing exactly which recommended line drove it.
 */
export async function logImplementedIfUntracked(db, { shopId, roNumber }) {
  if (!roNumber) return;
  try {
    const col = db.collection(COLL);
    const shownRecs = await col.distinct('recommendationId', { roNumber, event: 'shown', ...(shopId ? { shopId } : {}) });
    if (shownRecs.length === 0) return;

    const resolvedRecs = await col.distinct('recommendationId', {
      roNumber, event: { $in: ['accepted', 'dismissed', 'implemented_untracked'] },
    });
    const resolvedSet = new Set(resolvedRecs);
    const untracked = shownRecs.filter(id => !resolvedSet.has(id));

    if (untracked.length === 0) return;
    await logRecommendationEventsBatch(db, untracked.map(recommendationId => ({
      shopId, recommendationId, roNumber, event: 'implemented_untracked',
    })));
  } catch (err) {
    console.warn('[recommendationEventsService] implemented-untracked check failed:', err.message);
  }
}

/**
 * Shown → (accepted OR implemented_untracked) conversion rate for a shop,
 * counted by distinct recommendationId (a recommendation can be shown to
 * multiple personas but should only count once toward conversion).
 */
export async function getRecommendationConversionRate(db, shopId) {
  const col = db.collection(COLL);
  const match = shopId ? { shopId } : {};

  const [shown, accepted, dismissed, implementedUntracked] = await Promise.all([
    col.distinct('recommendationId', { ...match, event: 'shown' }),
    col.distinct('recommendationId', { ...match, event: 'accepted' }),
    col.distinct('recommendationId', { ...match, event: 'dismissed' }),
    col.distinct('recommendationId', { ...match, event: 'implemented_untracked' }),
  ]);

  const convertedSet = new Set([...accepted, ...implementedUntracked]);
  const shownCount = shown.length;
  const convertedCount = shown.filter(id => convertedSet.has(id)).length;

  return {
    shopId: shopId || null,
    shownCount,
    acceptedCount: accepted.length,
    dismissedCount: dismissed.length,
    implementedUntrackedCount: implementedUntracked.length,
    convertedCount,
    conversionRatePct: shownCount > 0 ? Math.round((convertedCount / shownCount) * 100) : 0,
  };
}
