/**
 * WrenchIQ — Tribal Notes Routes
 *
 * Collection: tribal_notes
 *
 * POST  /api/tribal-notes         — Create a new note
 * GET   /api/tribal-notes/:shopId — Get notes (active + unexpired by default)
 * PATCH /api/tribal-notes/:id     — Partial update
 * DELETE /api/tribal-notes/:id    — Delete by MongoDB _id
 */

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();
const COLL = 'tribal_notes';

let indexesEnsured = false;

async function ensureNoteIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const col = db.collection(COLL);
    await col.createIndex({ shopId: 1, locationId: 1, active: 1 });
    await col.createIndex({ expiresAt: 1 });
  } catch (err) {
    console.warn('tribal_notes index creation warning:', err.message);
  }
}

// Default Strategic Priorities every shop starts with — seeded into Mongo
// (not just held in this array) the first time a given shop's notes are
// fetched with zero results, so Surface A always shows a real baseline
// rather than an empty state for any shop, not just the original demo one.
const DEFAULT_NOTES_TEMPLATE = [
  // ── Objectives ─────────────────────────────────────────────
  {
    locationId: 'all', noteType: 'objective',
    note: 'Push cabin air filter on all vehicles — shop is overstocked 40 units',
    active: true, expiresAt: null, triggerType: 'any_ro',
  },
  {
    locationId: 'all', noteType: 'objective',
    note: 'Offer brake fluid flush on any vehicle over 50k miles',
    active: true, expiresAt: null, triggerType: 'mileage_range:50000-999999',
  },
  {
    locationId: 'all', noteType: 'objective',
    note: 'Check for timing belt service on Japanese vehicles 80k–100k miles',
    active: true, expiresAt: null, triggerType: 'vehicle_type:japanese',
  },
  // ── ings (per-RO advisor reminders) ────────────────────────
  {
    locationId: 'all', noteType: 'ing',
    note: 'Add shop supply fee ($29.95) to every RO before closing',
    active: true, expiresAt: null, triggerType: 'any_ro',
  },
  {
    locationId: 'all', noteType: 'ing',
    note: 'Offer alignment check on every tire rotation — alignment revenue is up 18% when presented',
    active: true, expiresAt: null, triggerType: 'any_ro',
  },
  {
    locationId: 'all', noteType: 'ing',
    note: 'Check cabin air filter on vehicles over 25K miles — we have 40 units in stock',
    active: true, expiresAt: null, triggerType: 'mileage_range:25000-999999',
  },
  {
    locationId: 'all', noteType: 'ing',
    note: 'Present Predii protection plan to first-time customers before checkout',
    active: true, expiresAt: null, triggerType: 'any_ro',
  },
  {
    locationId: 'all', noteType: 'ing',
    note: 'Remind customer about wiper blade replacement — offer both front + rear while vehicle is in',
    active: true, expiresAt: null, triggerType: 'any_ro',
  },
  {
    locationId: 'all', noteType: 'ing',
    note: 'Ford F-150: offer 10% off brake job — mention the promotion before presenting the estimate',
    active: true, expiresAt: null, triggerType: 'vehicle_make:ford',
  },
];

// ── POST / — Create a new note ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = req.db;
    await ensureNoteIndexes(db);
    const col = db.collection(COLL);

    const { shopId, locationId, note, active, expiresAt, triggerType, noteType } = req.body;

    if (!shopId || !note) {
      return res.status(400).json({ error: 'shopId and note are required.' });
    }

    const now = new Date().toISOString();
    const doc = {
      shopId,
      locationId: locationId || 'all',
      note,
      noteType: noteType || 'objective',
      active: active !== undefined ? Boolean(active) : true,
      expiresAt: expiresAt || null,
      triggerType: triggerType || 'any_ro',
      createdAt: now,
      updatedAt: now,
    };

    const result = await col.insertOne(doc);
    res.status(201).json({ ...doc, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:shopId — Get notes for a shop ──────────────────────────────────────
router.get('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    await ensureNoteIndexes(db);
    const col = db.collection(COLL);
    const { shopId } = req.params;
    const { includeInactive, includeExpired, noteType } = req.query;

    const count = await col.countDocuments({ shopId });

    // Auto-seed default Strategic Priorities for ANY shop with zero notes —
    // not just the original cornerstone demo shop — so Surface A always
    // shows a real Mongo-backed baseline for whichever shop it launches
    // against. Skip hierarchy scoping nodes (region/district ids) — those
    // aren't real shops and shouldn't get a shop-level baseline.
    if (count === 0) {
      const hierNode = await db.collection('location_hierarchy').findOne({ id: shopId }).catch(() => null);
      const isScopeNode = hierNode && hierNode.type !== 'shop';
      if (!isScopeNode) {
        const now = new Date().toISOString();
        await col.insertMany(DEFAULT_NOTES_TEMPLATE.map(n => ({ ...n, shopId, createdAt: now, updatedAt: now })));
      }
    }

    // Include notes scoped to this shop's district/region ancestors, so a
    // priority authored at district/region level (see /api/hierarchy) stays
    // visible from any descendant shop's Settings screen, matching what
    // get_shop_objectives resolves for the Sidecar (roAdvisorService.js).
    let scopeIds = [shopId];
    try {
      const hierCol = db.collection('location_hierarchy');
      const node = await hierCol.findOne({ id: shopId });
      let parentId = node?.parentId;
      while (parentId && !scopeIds.includes(parentId)) {
        scopeIds.push(parentId);
        const parent = await hierCol.findOne({ id: parentId });
        parentId = parent?.parentId;
      }
    } catch { /* fall back to exact shopId only */ }

    const filter = { shopId: { $in: scopeIds } };

    if (noteType) filter.noteType = noteType;

    if (includeInactive !== 'true') {
      filter.active = true;
    }

    if (includeExpired !== 'true') {
      const now = new Date().toISOString();
      filter.$or = [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ];
    }

    const notes = await col.find(filter).toArray();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:id — Partial update ───────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);

    let oid;
    try {
      oid = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid id format.' });
    }

    const ALLOWED_FIELDS = ['note', 'active', 'expiresAt', 'triggerType', 'locationId', 'noteType'];
    const update = {};
    for (const f of ALLOWED_FIELDS) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields in request body.' });
    }

    update.updatedAt = new Date().toISOString();

    const result = await col.findOneAndUpdate(
      { _id: oid },
      { $set: update },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Note not found.' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id — Delete by MongoDB _id ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);

    let oid;
    try {
      oid = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid id format.' });
    }

    const result = await col.deleteOne({ _id: oid });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Note not found.' });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
