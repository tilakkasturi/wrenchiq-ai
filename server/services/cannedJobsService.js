/**
 * WrenchIQ — Canned Jobs Service
 *
 * Shared lookup for a shop's canned-job catalog (labor price + priced parts
 * package per job), seeded into the `RepairOrder` collection as a single
 * document tagged isCannedJobCatalog: true — see
 * scripts/seedCannedJobsCornerstone.js. Used by both the
 * GET /api/canned-jobs/:shopId route (Predii Learn's Canned Jobs tab) and
 * the RO Chat assistant (so "look up a price/symptom" answers ground in the
 * real menu instead of the model guessing).
 */

export async function getCannedJobs(db, shopId) {
  if (!db || !shopId) return [];
  const doc = await db.collection('RepairOrder').findOne({ shopId, isCannedJobCatalog: true });
  return doc?.repairJobs || [];
}

// Appends one job to the shop's catalog doc, creating it (upsert) if this
// shop has never had one seeded — $push + upsert:true still sets the filter
// fields (shopId, isCannedJobCatalog) on the newly-inserted doc, so a shop
// with no catalog yet gets a proper one-job catalog rather than an error.
export async function addCannedJob(db, shopId, job) {
  if (!db || !shopId) throw new Error('shopId is required');
  await db.collection('RepairOrder').updateOne(
    { shopId, isCannedJobCatalog: true },
    { $push: { repairJobs: job } },
    { upsert: true }
  );
  return getCannedJobs(db, shopId);
}
