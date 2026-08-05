/**
 * WrenchIQ — Shop Profile Snapshot Service
 *
 * Persists a point-in-time copy of the Predii Learn Shop Profile (top repair
 * jobs, top parts, top repeat customers, seasonal trends) so it survives
 * page refreshes / app restarts and can ground other features (RO Chat)
 * without requiring a fresh "Run Predii Learn" pass every time.
 *
 * Deliberately a plain snapshot of whatever the Shop Profile tab is showing
 * when the advisor clicks "Persist" — live-run results and the static
 * external-service profile are both already normalized to the same shape
 * client-side (PrediiLearnScreen.jsx), so this service doesn't need to know
 * which source it came from.
 *
 * Collection: shop_profile_snapshot (one doc per shopId, upserted)
 */

const COLL = 'shop_profile_snapshot';

export async function saveShopProfileSnapshot(db, shopId, profile) {
  const doc = { shopId, profile, savedAt: new Date().toISOString() };
  await db.collection(COLL).updateOne(
    { shopId },
    { $set: doc },
    { upsert: true }
  );
  return doc;
}

export async function getShopProfileSnapshot(db, shopId) {
  if (!db || !shopId) return null;
  return db.collection(COLL).findOne({ shopId });
}
