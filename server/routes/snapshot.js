/**
 * WrenchIQ — 90-day Snapshot Routes
 *
 * GET  /api/snapshot/90d/:shopId                — shop-level snapshot (locationId='all')
 * GET  /api/snapshot/90d/:shopId/:locationId    — location-level snapshot
 * POST /api/snapshot/refresh                    — force re-compute { shopId, locationId? }
 *
 * Results are cached in the shop_snapshot_90d MongoDB collection with a 15-min TTL.
 */

import { Router } from 'express';
import { upsertSnapshot90d } from '../services/snapshotBuilder.js';

const router = Router();

const TTL_MS = 15 * 60 * 1000; // 15 minutes

const DEMO_SNAPSHOT = {
  shopId: 'shop-001', locationId: 'all', period: '90d',
  generatedAt: null, // set at runtime
  roCount: 0,
  avgRO: { overall: 419, byLocation: { 'loc-001': 487, 'loc-002': 341, 'loc-003': 412, 'loc-004': 456 } },
  bayUtilization: {
    overall: 64,
    byDay:   { Mon: 71, Tue: 78, Wed: 68, Thu: 74, Fri: 82, Sat: 41, Sun: 0 },
    byHour:  { '08': 12, '09': 28, '10': 31, '11': 24, '12': 18, '13': 22, '14': 29, '15': 26, '16': 19, '17': 11 },
    byLocation: { 'loc-001': 72, 'loc-002': 51, 'loc-003': 64, 'loc-004': 69 },
  },
  upsell: {
    opportunities: 312, conversions: 121, rate: 38.8,
    topMissed: ['Cabin air filter', 'Wiper blades', 'Brake fluid flush'],
  },
  elr: {
    overall: 178,
    byTech: [
      { techId: 'tech-001', techName: 'James Kowalski', elr: 201, roCount: 89 },
      { techId: 'tech-002', techName: 'Mike Reeves',    elr: 163, roCount: 94 },
      { techId: 'tech-003', techName: 'Carlos Mendez',  elr: 189, roCount: 81 },
      { techId: 'tech-004', techName: 'Lisa Nguyen',    elr: 147, roCount: 72 },
    ],
  },
  partsMargin: 48.2,
  advisorPerformance: [],
  revenueByMonth: [
    { month: 'Jan 2026', revenue: 58400 },
    { month: 'Feb 2026', revenue: 61200 },
    { month: 'Mar 2026', revenue: 63800 },
  ],
};

async function getOrBuildSnapshot(shopId, locationId, db) {
  const locId = locationId || 'all';

  // Check cache in MongoDB
  try {
    const cached = await db.collection('shop_snapshot_90d').findOne({ shopId, locationId: locId });
    if (cached) {
      const age = Date.now() - new Date(cached.generatedAt).getTime();
      if (age < TTL_MS) {
        return cached;
      }
    }
  } catch (err) {
    console.warn('snapshot: cache read failed:', err.message);
  }

  // Check whether any ROs exist for this shop (to decide on demo fallback)
  let hasData = false;
  try {
    const count = await db.collection('RepairOrder').countDocuments(
      shopId !== 'all' ? { shopId, status: 'closed' } : { status: 'closed' },
      { limit: 1 }
    );
    hasData = count > 0;
  } catch (err) {
    console.warn('snapshot: countDocuments failed:', err.message);
  }

  if (!hasData) {
    return { ...DEMO_SNAPSHOT, shopId, locationId: locId, generatedAt: new Date().toISOString() };
  }

  return await upsertSnapshot90d(shopId, locId, db);
}

// ── GET /90d/:shopId ──────────────────────────────────────────────────────────
router.get('/90d/:shopId', async (req, res) => {
  try {
    const snapshot = await getOrBuildSnapshot(req.params.shopId, 'all', req.db);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /90d/:shopId/:locationId ──────────────────────────────────────────────
router.get('/90d/:shopId/:locationId', async (req, res) => {
  try {
    const snapshot = await getOrBuildSnapshot(req.params.shopId, req.params.locationId, req.db);
    res.json(snapshot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /refresh ─────────────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  try {
    const { shopId, locationId } = req.body || {};
    if (!shopId) {
      return res.status(400).json({ error: 'shopId is required' });
    }

    if (locationId) {
      const snapshot = await upsertSnapshot90d(shopId, locationId, req.db);
      return res.json(snapshot);
    }

    // No locationId — refresh 'all' + each distinct locationId in RepairOrder
    const distinctLocs = await req.db.collection('RepairOrder').distinct('locationId', { shopId });

    const results = await Promise.all([
      upsertSnapshot90d(shopId, 'all', req.db),
      ...distinctLocs.filter(Boolean).map(loc => upsertSnapshot90d(shopId, loc, req.db)),
    ]);

    // Return the 'all' snapshot as primary result
    res.json(results[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
