/**
 * WrenchIQ — Analytics Routes
 *
 * Exposes live aroAnalytics.js aggregations (shop-wide ELR, per-tech
 * efficiency, ARO trend) for AnalyticsScreen.jsx and DashboardScreen.jsx to
 * replace hardcoded demo figures with real numbers computed against the
 * wrenchiq_ro collection.
 *
 * GET /api/analytics/elr?shopId=shop-001
 *   → { shop: { elr, postedRate, gapPct, totalLaborRev, totalActualHrs, totalFlatHrs },
 *       byTech: [{ techId, name, elr, efficiencyPct, roCount }] }
 *
 * GET /api/analytics/aro-trend?shopId=shop-001&months=12
 *   → [{ year, month, label, totalRevenue, roCount, avgARO, avgLaborCost }]
 */

import { Router } from 'express';
import { getShopELR, getTechELR, getARОTrend } from '../services/aroAnalytics.js';

const router = Router();

// ── GET /api/analytics/elr ────────────────────────────────────────────────────
router.get('/elr', async (req, res) => {
  const db = req.db;
  if (!db) return res.status(503).json({ error: 'Database not connected' });

  const shopId = req.query.shopId || 'shop-001';

  try {
    const [shop, techRows] = await Promise.all([
      getShopELR(db, shopId),
      getTechELR(db, shopId),
    ]);

    const gapPct = shop.postedRate > 0
      ? Math.round(((shop.postedRate - shop.elr) / shop.postedRate) * 1000) / 10
      : 0;

    const byTech = techRows.map(t => ({
      techId:        t.techId,
      name:          t.name,
      elr:           t.elr,
      efficiencyPct: Math.round((t.efficiency || 0) * 100),
      roCount:       t.roCount,
      totalActualHrs: t.totalActualHrs,
    }));

    res.json({
      shop: { ...shop, gapPct },
      byTech,
    });
  } catch (err) {
    console.error('[analytics] elr error:', err.message);
    res.status(503).json({ error: 'Failed to compute ELR analytics', detail: err.message });
  }
});

// ── GET /api/analytics/aro-trend ──────────────────────────────────────────────
router.get('/aro-trend', async (req, res) => {
  const db = req.db;
  if (!db) return res.status(503).json({ error: 'Database not connected' });

  const shopId = req.query.shopId || 'shop-001';
  const months = Number(req.query.months) || 12;

  try {
    const trend = await getARОTrend(db, shopId, months);
    res.json(trend);
  } catch (err) {
    console.error('[analytics] aro-trend error:', err.message);
    res.status(503).json({ error: 'Failed to compute ARO trend', detail: err.message });
  }
});

export default router;
