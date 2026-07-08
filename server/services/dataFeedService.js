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
  const dateIn    = doc.dateIn    || doc.date_in    || null;
  const updatedAt = doc.updatedAt || dateIn          || null;

  return {
    source,
    roId:       String(doc._id),
    roNumber:   doc.roNumber || doc.ro_number || doc.id || null,
    shopId:     doc.shopId || doc.shop?.id || null,
    customerId,
    customerName,
    status:     doc.kanbanStatus || doc.kanban_status || doc.status || null,
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
 */
async function getMostRecentCustomer(db, { shopId, edition } = {}) {
  for (const coll of collectionsForEdition(edition)) {
    const query = { ...shopFilter(coll, shopId), ...HAS_CUSTOMER };
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
 */
async function listActiveCustomers(db, { shopId, edition, limit = 25 } = {}) {
  const records = [];

  for (const coll of collectionsForEdition(edition)) {
    const query = { ...shopFilter(coll, shopId), ...HAS_CUSTOMER };
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
