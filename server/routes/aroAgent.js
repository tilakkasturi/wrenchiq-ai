/**
 * WrenchIQ — ARO Agent Routes
 *
 * GET  /api/aro-agent/status          — Fast ARO snapshot (no Claude)
 * POST /api/aro-agent/run             — Full agent mission (Claude tool loop)
 * GET  /api/aro-agent/config/:shopId  — Get shop goals
 * POST /api/aro-agent/config/:shopId  — Update shop goals
 */

import { Router } from 'express';
import { runAROAgent, getAROStatus, getGoals, setGoals } from '../services/aroAgentService.js';

const router = Router();

// ── GET /api/aro-agent/status ─────────────────────────────────────────────────
// Fast math-only ARO check — returns current KPIs vs goal without Claude.
router.get('/status', async (req, res) => {
  const shopId = req.query.shopId || 'shop-001';
  try {
    const status = await getAROStatus(shopId, req.db);
    res.json(status);
  } catch (err) {
    console.error('[aroAgent] status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/aro-agent/run ───────────────────────────────────────────────────
// Full agent mission: Claude tool-calling loop → structured analysis.
router.post('/run', async (req, res) => {
  const shopId = req.body?.shopId || 'shop-001';
  try {
    const result = await runAROAgent(shopId, req.db);
    res.json(result);
  } catch (err) {
    console.error('[aroAgent] run error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/aro-agent/config/:shopId ────────────────────────────────────────
router.get('/config/:shopId', (req, res) => {
  res.json(getGoals(req.params.shopId));
});

// ── POST /api/aro-agent/config/:shopId ───────────────────────────────────────
// Body: { aro, bayUtilization, comebackRate, minELR }
router.post('/config/:shopId', (req, res) => {
  const allowed = ['aro', 'bayUtilization', 'comebackRate', 'minELR'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      const val = Number(req.body[key]);
      if (!isNaN(val) && val > 0) updates[key] = val;
    }
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid goal fields provided' });
  }
  res.json(setGoals(req.params.shopId, updates));
});

export default router;
