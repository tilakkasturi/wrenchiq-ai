/**
 * WrenchIQ — Location Hierarchy Routes
 *
 * Collection: location_hierarchy
 * Flat nodes forming a region → district → shop tree, used to scope
 * Strategic Priorities (tribal_notes) above the single-shop level. Shop
 * nodes' `id` is a real shopId (cornerstone/ridgeline) — this hierarchy is
 * built over the real shops, not the synthetic 100-location demo dataset in
 * MultiLocationScreen.jsx (see v2.0 spec plan for why).
 *
 * GET    /api/hierarchy      — full tree (auto-seeds one region/district
 *                               over the two real shops on first read)
 * POST   /api/hierarchy      — create a node { id, type, name, parentId }
 * PATCH  /api/hierarchy/:id  — rename / reparent a node
 * DELETE /api/hierarchy/:id  — delete a node (blocked if it has children)
 */

import { Router } from 'express';

const router = Router();
const COLL = 'location_hierarchy';
const TYPES = ['region', 'district', 'shop'];

const DEFAULT_NODES = [
  { id: 'region-west', type: 'region', name: 'West Coast', parentId: null },
  { id: 'district-bayarea', type: 'district', name: 'Bay Area', parentId: 'region-west' },
  { id: 'cornerstone', type: 'shop', name: 'Cornerstone Auto Group', parentId: 'district-bayarea' },
  { id: 'ridgeline', type: 'shop', name: 'Ridgeline Auto Service', parentId: 'district-bayarea' },
];

// ── GET / — full tree (auto-seeds) ───────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);

    const count = await col.countDocuments({});
    if (count === 0) {
      const now = new Date().toISOString();
      await col.insertMany(DEFAULT_NODES.map(n => ({ ...n, createdAt: now, updatedAt: now })));
    }

    const nodes = await col.find({}).toArray();
    res.json(nodes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST / — create a node ───────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { id, type, name, parentId } = req.body;

    if (!id || !type || !name) {
      return res.status(400).json({ error: 'id, type, and name are required.' });
    }
    if (!TYPES.includes(type)) {
      return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
    }

    const existing = await col.findOne({ id });
    if (existing) {
      return res.status(409).json({ error: `Node with id "${id}" already exists.` });
    }

    if (parentId) {
      const parent = await col.findOne({ id: parentId });
      if (!parent) {
        return res.status(400).json({ error: `Parent node "${parentId}" not found.` });
      }
    }

    const now = new Date().toISOString();
    const doc = { id, type, name, parentId: parentId || null, createdAt: now, updatedAt: now };
    await col.insertOne(doc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:id — rename / reparent ───────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { id } = req.params;

    const updates = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) updates.name = req.body.name.trim();
    if (req.body.parentId !== undefined) {
      if (req.body.parentId === id) {
        return res.status(400).json({ error: 'A node cannot be its own parent.' });
      }
      if (req.body.parentId) {
        const parent = await col.findOne({ id: req.body.parentId });
        if (!parent) return res.status(400).json({ error: `Parent node "${req.body.parentId}" not found.` });
      }
      updates.parentId = req.body.parentId || null;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields provided.' });
    }
    updates.updatedAt = new Date().toISOString();

    const result = await col.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: 'after' });
    if (!result) return res.status(404).json({ error: 'Node not found.' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /:id — blocked if children exist ─────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { id } = req.params;

    const childCount = await col.countDocuments({ parentId: id });
    if (childCount > 0) {
      return res.status(409).json({ error: `Cannot delete — ${childCount} child node(s) depend on this one.` });
    }

    const result = await col.deleteOne({ id });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Node not found.' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
