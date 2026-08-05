/**
 * WrenchIQ — Customer Lookup Service
 *
 * Finds a shop's customers by (partial, case-insensitive) name — used by the
 * shop-wide "Ask WrenchIQ" chat so an advisor can reference a customer by
 * name without needing their ID or an open RO. Real MongoDB data (the same
 * `RepairOrder.customer` subdocument fetchCustomerHistory reads), not a
 * fixture.
 */

export async function findCustomersByName(db, shopId, nameQuery) {
  if (!db || !shopId || !nameQuery?.trim()) return [];

  const words = nameQuery.trim().split(/\s+/).filter(Boolean).map(escapeRegExp);
  if (words.length === 0) return [];
  const pattern = words.join('.*');
  const regex = new RegExp(pattern, 'i');

  const docs = await db.collection('RepairOrder').aggregate([
    { $match: { shopId, 'customer.name': { $regex: regex } } },
    { $group: { _id: '$customer.id', name: { $first: '$customer.name' } } },
    { $limit: 5 },
  ]).toArray();

  return docs.map((d) => ({ id: d._id, name: d.name }));
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
