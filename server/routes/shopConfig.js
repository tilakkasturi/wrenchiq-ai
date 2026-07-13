/**
 * WrenchIQ — Shop Config Routes
 *
 * Collection: shop_config
 * Single document per shopId holding operating variables used by margin
 * calculations (labor cost, preferred parts suppliers, parts margin target).
 *
 * GET   /api/shop-config/:shopId — Get margin config (auto-seeds defaults)
 * PATCH /api/shop-config/:shopId — Update margin config fields
 */

import { Router } from 'express';

const router = Router();
const COLL = 'shop_config';

const DEFAULT_MARGIN_CONFIG = {
  laborCost: 85,
  partsMarginTarget: 53,
  preferredSuppliers: ['Worldpac'],
};

// ── GET /:shopId — Get margin config ─────────────────────────────────────────
router.get('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { shopId } = req.params;

    let doc = await col.findOne({ shopId });
    if (!doc) {
      const now = new Date().toISOString();
      doc = { shopId, ...DEFAULT_MARGIN_CONFIG, createdAt: now, updatedAt: now };
      await col.insertOne(doc);
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:shopId — Update margin config fields ─────────────────────────────
router.patch('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { shopId } = req.params;

    const updates = {};
    if (req.body.laborCost !== undefined) {
      const val = Number(req.body.laborCost);
      if (!isNaN(val) && val >= 0) updates.laborCost = val;
    }
    if (req.body.partsMarginTarget !== undefined) {
      const val = Number(req.body.partsMarginTarget);
      if (!isNaN(val) && val >= 0 && val <= 100) updates.partsMarginTarget = val;
    }
    if (Array.isArray(req.body.preferredSuppliers)) {
      updates.preferredSuppliers = req.body.preferredSuppliers.filter(s => typeof s === 'string');
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid config fields provided' });
    }

    updates.updatedAt = new Date().toISOString();

    const insertDefaults = { ...DEFAULT_MARGIN_CONFIG };
    for (const key of Object.keys(updates)) delete insertDefaults[key];

    const result = await col.findOneAndUpdate(
      { shopId },
      {
        $set: updates,
        $setOnInsert: { shopId, createdAt: updates.updatedAt, ...insertDefaults },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
