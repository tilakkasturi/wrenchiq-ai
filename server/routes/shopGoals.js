/**
 * WrenchIQ — Shop Goals Routes
 *
 * Collection: shop_goals
 *
 * POST /api/shop-goals         — Create or upsert a goal (max 4 per shop)
 * GET  /api/shop-goals/:shopId — Get all goals for a shop (auto-seeds demo data)
 * DELETE /api/shop-goals/:id   — Delete a goal by MongoDB _id
 */

import { Router } from 'express';
import { ObjectId } from 'mongodb';

const router = Router();
const COLL = 'shop_goals';

let indexesEnsured = false;

async function ensureGoalIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const col = db.collection(COLL);
    await col.createIndex({ shopId: 1, metric: 1 });
    await col.createIndex({ shopId: 1, locationId: 1 });
  } catch (err) {
    console.warn('shop_goals index creation warning:', err.message);
  }
}

const DEMO_GOALS = [
  {
    shopId: 'shop-001',
    locationId: 'all',
    metric: 'avg_ro',
    target: 480,
    baseline: 390,
    targetDate: '2026-07-01',
    trackDaily: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    shopId: 'shop-001',
    locationId: 'loc-002',
    metric: 'bay_utilization',
    target: 72,
    baseline: 58,
    targetDate: '2026-07-01',
    trackDaily: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ── POST / — Create or upsert a goal ─────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = req.db;
    await ensureGoalIndexes(db);
    const col = db.collection(COLL);

    const { shopId, locationId, metric, target, baseline, targetDate, trackDaily } = req.body;

    if (!shopId || !locationId || !metric) {
      return res.status(400).json({ error: 'shopId, locationId, and metric are required.' });
    }

    // Check if this metric already exists for this shop (would be an update, not new)
    const existing = await col.findOne({ shopId, locationId, metric });

    if (!existing) {
      // Count distinct metrics currently stored for this shop
      const distinctMetrics = await col.distinct('metric', { shopId });
      if (distinctMetrics.length >= 4) {
        return res.status(409).json({ error: 'Goal limit reached. Maximum 4 active goals per shop.' });
      }
    }

    const now = new Date().toISOString();
    const update = {
      shopId,
      locationId,
      metric,
      target: Number(target),
      baseline: Number(baseline),
      targetDate: targetDate || null,
      trackDaily: trackDaily !== undefined ? Boolean(trackDaily) : false,
      updatedAt: now,
    };

    const result = await col.findOneAndUpdate(
      { shopId, locationId, metric },
      {
        $set: update,
        $setOnInsert: { createdAt: now },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /:shopId — Get all goals for a shop ───────────────────────────────────
router.get('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    await ensureGoalIndexes(db);
    const col = db.collection(COLL);
    const { shopId } = req.params;

    const count = await col.countDocuments({ shopId });

    // Auto-seed demo goals for shop-001 if empty
    if (count === 0 && shopId === 'shop-001') {
      await col.insertMany(DEMO_GOALS.map(g => ({ ...g, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() })));
    }

    const goals = await col.find({ shopId }).toArray();
    res.json(goals);
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
      return res.status(404).json({ error: 'Goal not found.' });
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
