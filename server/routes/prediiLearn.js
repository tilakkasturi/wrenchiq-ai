/**
 * WrenchIQ — Predii Learn Routes
 *
 * Proxies to the separate ro-ner-demo service (see server/services/roNerService.js).
 *
 * GET  /api/predii-learn/health         — is ro-ner-demo reachable?
 * GET  /api/predii-learn/shop-profile   — aggregated shop metrics, optionally windowed by ?years=
 * POST /api/predii-learn/run            — kicks off a batch NER run, streamed back as SSE
 */

import { Router } from 'express';
import { checkHealth, getShopProfile, streamBatch } from '../services/roNerService.js';

const router = Router();

router.get('/health', async (_req, res) => {
  try {
    const health = await checkHealth();
    res.json(health);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/shop-profile', async (req, res) => {
  try {
    const years = req.query.years ? parseInt(req.query.years, 10) : undefined;
    const profile = await getShopProfile({ years });
    res.json(profile);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.post('/run', async (req, res) => {
  try {
    const { years, n = 20 } = req.body || {};
    await streamBatch({ years, n, datasources: ['cornerstone'] }, res);
  } catch (err) {
    if (res.headersSent) {
      res.end();
    } else {
      res.status(502).json({ error: err.message });
    }
  }
});

export default router;
