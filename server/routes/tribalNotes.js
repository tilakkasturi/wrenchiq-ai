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

const DEMO_NOTES = [
  {
    shopId: 'shop-001',
    locationId: 'all',
    note: 'Push cabin air filter on all vehicles — shop is overstocked 40 units',
    active: true,
    expiresAt: null,
    triggerType: 'any_ro',
  },
  {
    shopId: 'shop-001',
    locationId: 'all',
    note: 'Offer brake fluid flush on any vehicle over 50k miles',
    active: true,
    expiresAt: null,
    triggerType: 'mileage_range:50000-999999',
  },
  {
    shopId: 'shop-001',
    locationId: 'all',
    note: 'Check for timing belt service on Japanese vehicles 80k–100k miles',
    active: true,
    expiresAt: null,
    triggerType: 'vehicle_type:japanese',
  },
];

// ── POST / — Create a new note ────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = req.db;
    await ensureNoteIndexes(db);
    const col = db.collection(COLL);

    const { shopId, locationId, note, active, expiresAt, triggerType } = req.body;

    if (!shopId || !note) {
      return res.status(400).json({ error: 'shopId and note are required.' });
    }

    const now = new Date().toISOString();
    const doc = {
      shopId,
      locationId: locationId || 'all',
      note,
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
    const { includeInactive, includeExpired } = req.query;

    const count = await col.countDocuments({ shopId });

    // Auto-seed demo notes for shop-001 if empty
    if (count === 0 && shopId === 'shop-001') {
      const now = new Date().toISOString();
      await col.insertMany(DEMO_NOTES.map(n => ({ ...n, createdAt: now, updatedAt: now })));
    }

    const filter = { shopId };

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

    const ALLOWED_FIELDS = ['note', 'active', 'expiresAt', 'triggerType', 'locationId'];
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
