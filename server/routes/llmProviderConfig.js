/**
 * WrenchIQ — LLM Provider Config Routes
 *
 * GET   /api/llm-provider-config — active profile/endpoint + configured options (no key values)
 * PATCH /api/llm-provider-config — switch active profile ({ activeProfile }) and/or
 *                                   active physical endpoint ({ activeEndpoint }: 'primary'|'secondary')
 */

import { Router } from 'express';
import { setActiveProfile, setActiveEndpoint, getPublicStatus } from '../services/llmProviderConfig.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(getPublicStatus());
});

router.patch('/', async (req, res) => {
  try {
    const { activeProfile, activeEndpoint } = req.body || {};
    if (!activeProfile && !activeEndpoint) {
      return res.status(400).json({ error: 'activeProfile or activeEndpoint is required' });
    }
    let status;
    if (activeProfile) status = await setActiveProfile(req.db, activeProfile);
    if (activeEndpoint) status = await setActiveEndpoint(req.db, activeEndpoint);
    res.json(status);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
