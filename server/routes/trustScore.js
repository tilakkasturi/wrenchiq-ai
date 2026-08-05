/**
 * WrenchIQ — Trust Score Routes (Product Spec v3.0, S7.4 + S6)
 *
 * GET /api/trust-score/customers   — per-customer Trust Score, tier, approval
 *                                     rate (live, computed from RepairOrder)
 * GET /api/trust-score/dashboard   — S6 Customer Connection Dashboard:
 *                                     aggregate summary + customer list
 *
 * Query params (both routes): shopId (optional, defaults to 'cornerstone' —
 * the default single-shop identity, see DemoContext.activeShopId), limit
 */

import { Router } from 'express';
import { getCustomerTrustScores, getConnectionDashboard, DATA_CARDINALITY_NOTE } from '../services/trustScoreService.js';

const router = Router();

router.get('/customers', async (req, res) => {
  const shopId = req.query.shopId || 'cornerstone';
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  try {
    const data = await getCustomerTrustScores(req.db, shopId, limit);
    res.json({ count: data.length, data, dataNote: DATA_CARDINALITY_NOTE });
  } catch (err) {
    console.error('[trustScore] customers error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard', async (req, res) => {
  const shopId = req.query.shopId || 'cornerstone';
  const limit = Math.min(Number(req.query.limit) || 100, 300);
  try {
    const result = await getConnectionDashboard(req.db, shopId, limit);
    res.json({ ...result, dataNote: DATA_CARDINALITY_NOTE });
  } catch (err) {
    console.error('[trustScore] dashboard error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
