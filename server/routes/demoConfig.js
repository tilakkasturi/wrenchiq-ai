/**
 * WrenchIQ — Demo SMS/DMS Config Routes
 *
 * GET   /api/demo-config — current SMS/DMS name + provider key
 * PATCH /api/demo-config — set it ({ smsName, smsProvider })
 */

import { Router } from 'express';
import { getDemoConfig, setDemoConfig } from '../services/demoConfig.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(getDemoConfig());
});

router.patch('/', async (req, res) => {
  try {
    const { smsName, smsProvider } = req.body || {};
    const config = await setDemoConfig(req.db, { smsName, smsProvider });
    res.json(config);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
