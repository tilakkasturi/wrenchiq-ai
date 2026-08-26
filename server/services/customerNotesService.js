/**
 * WrenchIQ — Customer Notes Service
 *
 * Per-customer "remember this" notes an advisor jots down between visits
 * (e.g. "prefers texts over calls", "picky about noise complaints",
 * "always brings coffee for the team") — distinct from tribal_notes.js's
 * shop-wide objectives/ings, which are never customer-specific.
 *
 * Collection: customer_notes — one doc per note (not one doc per customer)
 * so notes have their own createdAt/author and can be deleted individually.
 */

import { ObjectId } from 'mongodb';

const COLL = 'customer_notes';

let indexEnsured = false;

async function ensureIndex(db) {
  if (indexEnsured || !db) return;
  indexEnsured = true;
  try {
    await db.collection(COLL).createIndex({ shopId: 1, customerId: 1, createdAt: -1 });
  } catch (err) {
    console.warn('customer_notes index creation warning:', err.message);
  }
}

const DAY_MS = 24 * 60 * 60 * 1000;

// Seeded once per customer the first time their notes are fetched with zero
// results — same "seed into Mongo on first empty fetch" pattern as
// tribalNotes.js's DEFAULT_NOTES_TEMPLATE — so the demo shows a realistic
// "the advisor already knows this customer" baseline instead of an empty
// notes panel for every story-RO customer on day one. createdAt is resolved
// relative to seed time (agoDays) rather than a literal baked-in date, same
// reasoning as tribalNotes.js's expiresInDays.
const DEFAULT_NOTES_BY_CUSTOMER = {
  'cust-001': [ // Elena Vasquez — 2020 Toyota Highlander
    { note: 'Prefers text over phone calls — works nights, sleeps mornings.', agoDays: 40 },
    { note: 'Daily 45-min commute in the Highlander — good candidate for proactive maintenance offers given the mileage pace.', agoDays: 12 },
  ],
  'cust-002': [ // Frank Delgado — 2018 Honda CR-V
    { note: 'Price-conscious — asks for the cheapest option first, but approves once the safety reasoning is clear.', agoDays: 65 },
    { note: 'Declined the cabin air filter last visit over cost — worth re-offering at the next appointment.', agoDays: 20 },
  ],
  'cust-003': [ // Brenda Okafor — 2021 Ford F-150
    { note: 'Tows on weekends — ask about towing frequency before setting brake/cooling service intervals.', agoDays: 30 },
  ],
  'cust-004': [ // Gary Strickland — 2020 BMW X3
    { note: 'Detail-oriented — appreciates a full written explanation of diagnostic findings, not just a verbal summary.', agoDays: 50 },
  ],
  'cust-005': [ // Denise Howell — 2018 Subaru Outback
    { note: 'Long-time customer, refers friends often — thank her for referrals when she comes in.', agoDays: 90 },
  ],
  'cust-006': [ // Ray Bosworth — 2019 Chevy Silverado 1500
    { note: 'Retired mechanic — knows the terminology, prefers technical detail over simplified explanations.', agoDays: 25 },
  ],
  'cust-007': [ // Tom Wallace — 2023 Hyundai Tucson
    { note: 'New lease, still under factory warranty on some components — check coverage before recommending paid work.', agoDays: 15 },
  ],
  'cust-008': [ // Priya Sharma — 2020 Toyota RAV4
    { note: 'Asked to be reminded ahead of her next 60K service interval rather than waiting for her to call in.', agoDays: 8 },
  ],
};

async function seedDefaultNotesIfEmpty(db, { shopId, customerId }) {
  const templates = DEFAULT_NOTES_BY_CUSTOMER[customerId];
  if (!templates) return;
  const now = Date.now();
  const docs = templates.map((t) => ({
    shopId: shopId || null,
    customerId,
    customerName: null,
    note: t.note,
    createdAt: new Date(now - t.agoDays * DAY_MS).toISOString(),
  }));
  try {
    await db.collection(COLL).insertMany(docs);
  } catch (err) {
    console.warn('customer_notes default-seed warning:', err.message);
  }
}

export async function listCustomerNotes(db, { shopId, customerId }) {
  if (!db || !customerId) return [];
  await ensureIndex(db);
  const query = { customerId, ...(shopId ? { shopId } : {}) };
  let docs = await db.collection(COLL).find(query).sort({ createdAt: -1 }).toArray();
  if (docs.length === 0) {
    await seedDefaultNotesIfEmpty(db, { shopId, customerId });
    docs = await db.collection(COLL).find(query).sort({ createdAt: -1 }).toArray();
  }
  return docs.map((d) => ({ ...d, _id: String(d._id) }));
}

export async function addCustomerNote(db, { shopId, customerId, customerName, note }) {
  await ensureIndex(db);
  const doc = {
    shopId: shopId || null,
    customerId,
    customerName: customerName || null,
    note,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection(COLL).insertOne(doc);
  return { ...doc, _id: String(result.insertedId) };
}

export async function deleteCustomerNote(db, id) {
  if (!ObjectId.isValid(id)) return;
  await db.collection(COLL).deleteOne({ _id: new ObjectId(id) });
}
