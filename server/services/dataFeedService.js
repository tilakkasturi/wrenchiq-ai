/**
 * WrenchIQ — Data Feed Service
 *
 * Read-only abstraction over the shop's existing MongoDB datasource (the
 * "Data Feed Model" — no live SMS trigger, no writes). Surfaces:
 *   - the most-recently-updated customer/RO (default selection for ARO,
 *     Job Flow, Intelligent RO, Copilot)
 *   - a ranked list of recently-active customers (for the Customer Selector)
 *
 * Reads from the same two collections snapshotBuilder.js already reads:
 *   RepairOrder   (camelCase — AM demo primary; story ROs + batch-seeded ROs)
 *   wrenchiq_ro   (snake_case — production import / OEM edition / fallback)
 */

const CAMEL_COLL = 'RepairOrder';
const SNAKE_COLL = 'wrenchiq_ro';

// Rebase a story RO's timestamp to today, keeping the original time-of-day —
// same logic as repairOrders.js's /demo route — so "just checked in this
// morning" and wait-time stats derived from dateIn stay honest instead of
// reading however many days old the underlying seed data actually is.
function rebaseToToday(iso) {
  if (!iso) return iso;
  const today = new Date().toISOString().slice(0, 10);
  const t = new Date(iso).toTimeString().slice(0, 8);
  return `${today}T${t}`;
}

/** Normalize a doc from either collection into one feed-record shape. */
function normalizeFeedRecord(doc, source) {
  const customerName = doc.customer?.name || doc.customerName || null;
  const customerId   = doc.customer?.id   || doc.customerId   || null;
  const vehicle = doc.vehicle ? {
    year:  doc.vehicle.year  ?? null,
    make:  doc.vehicle.make  ?? null,
    model: doc.vehicle.model ?? null,
    vin:   doc.vehicle.vin   ?? null,
  } : null;
  const isStoryRO = source === CAMEL_COLL && doc.isStoryRO;
  const rawDateIn    = doc.dateIn    || doc.date_in    || null;
  const rawUpdatedAt = doc.updatedAt || rawDateIn        || null;
  const dateIn    = isStoryRO ? rebaseToToday(rawDateIn)    : rawDateIn;
  const updatedAt = isStoryRO ? rebaseToToday(rawUpdatedAt) : rawUpdatedAt;

  return {
    source,
    roId:       String(doc._id),
    roNumber:   doc.roNumber || doc.ro_number || doc.id || null,
    shopId:     doc.shopId || doc.shop?.id || null,
    customerId,
    customerName,
    status:     doc.kanbanStatus || doc.kanban_status || doc.status || null,
    // V5 feedback (C3): estimate size feeds the RO value/opportunity score
    // (see roValueScoreService.js) alongside customer trust.
    totalEstimate: doc.invoice ?? doc.totalEstimate ?? doc.total_estimate ?? 0,
    vehicle,
    dateIn,
    updatedAt,
  };
}

/** Collections to query for a given edition, in priority order. */
function collectionsForEdition(edition) {
  if (edition === 'oem') return [SNAKE_COLL];
  if (edition === 'am')  return [CAMEL_COLL];
  return [CAMEL_COLL, SNAKE_COLL];
}

function shopFilter(coll, shopId) {
  if (!shopId) return {};
  return coll === SNAKE_COLL ? { 'shop.id': shopId } : { shopId };
}

const HAS_CUSTOMER = {
  $or: [
    { customerName: { $exists: true, $ne: null } },
    { 'customer.name': { $exists: true, $ne: null } },
  ],
};

/**
 * Most-recently-updated customer/RO across the configured datasource.
 * Returns null if no matching record exists.
 *
 * storyOnly: see listActiveCustomers below — same reasoning applies to
 * "default selection" callers (ARO, Job Flow, Copilot) that resolve the
 * pick via /story-ro/:roId.
 */
async function getMostRecentCustomer(db, { shopId, edition, storyOnly = false } = {}) {
  for (const coll of collectionsForEdition(edition)) {
    const query = {
      ...shopFilter(coll, shopId),
      ...HAS_CUSTOMER,
      ...(storyOnly && coll === CAMEL_COLL ? { isStoryRO: true } : {}),
    };
    const docs = await db.collection(coll)
      .find(query)
      .sort({ updatedAt: -1, dateIn: -1, date_in: -1 })
      .limit(1)
      .toArray();

    if (docs.length) return normalizeFeedRecord(docs[0], coll);
  }
  return null;
}

/**
 * Recently-active customers, most-recently-updated first, deduplicated by
 * customerId (falling back to name when no id is present).
 *
 * storyOnly: restrict to RepairOrder docs with isStoryRO:true — for callers
 * that resolve each result to its full record via /story-ro/:roId (that
 * endpoint 404s on anything else). Some shops (e.g. cornerstone) mix a small
 * number of real isStoryRO:true ROs into a much larger set of
 * isStoryRO:false seasonal gap-fill ROs whose dates can outrank the real
 * ones in the default sort — without this filter, storyOnly callers would
 * get back gap-fill IDs that can never resolve.
 */
async function listActiveCustomers(db, { shopId, edition, limit = 25, storyOnly = false } = {}) {
  const records = [];

  for (const coll of collectionsForEdition(edition)) {
    const query = {
      ...shopFilter(coll, shopId),
      ...HAS_CUSTOMER,
      ...(storyOnly && coll === CAMEL_COLL ? { isStoryRO: true } : {}),
    };
    const docs = await db.collection(coll)
      .find(query)
      .sort({ updatedAt: -1, dateIn: -1, date_in: -1 })
      .limit(limit * 4) // over-fetch since multiple ROs share a customer
      .toArray();

    records.push(...docs.map(doc => normalizeFeedRecord(doc, coll)));
  }

  records.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  const seen = new Set();
  const deduped = [];
  for (const rec of records) {
    const key = rec.customerId || rec.customerName;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(rec);
    if (deduped.length >= limit) break;
  }

  return deduped;
}

export { getMostRecentCustomer, listActiveCustomers };
