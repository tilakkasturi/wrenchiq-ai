/**
 * WrenchIQ — LLM Provider Config Routes
 *
 * GET   /api/llm-provider-config — active profile + configured profiles (no key values)
 * PATCH /api/llm-provider-config — switch active profile ({ activeProfile })
 */

import { Router } from 'express';
import { setActiveProfile, getPublicStatus } from '../services/llmProviderConfig.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(getPublicStatus());
});

router.patch('/', async (req, res) => {
  try {
    const { activeProfile } = req.body || {};
    if (!activeProfile) {
      return res.status(400).json({ error: 'activeProfile is required' });
    }
    const status = await setActiveProfile(req.db, activeProfile);
    res.json(status);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
