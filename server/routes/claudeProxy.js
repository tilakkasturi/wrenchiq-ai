/**
 * WrenchIQ — Claude API Proxy
 *
 * POST /api/claude/messages
 *
 * Proxies Anthropic API calls from the browser through the server.
 * This avoids CORS issues when the browser calls api.anthropic.com directly.
 * The server reads ANTHROPIC_API_KEY (or VITE_ANTHROPIC_API_KEY) from env.
 *
 * Body: same shape as Anthropic /v1/messages
 * Response: same as Anthropic (streamed or JSON)
 */

import { Router } from 'express';

const router = Router();

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

router.post('/messages', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY
    || process.env.VITE_ANTHROPIC_API_KEY;

  if (!apiKey) {
    return res.status(503).json({ error: 'No Anthropic API key configured on server' });
  }

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method:  'POST',
      headers: {
        'x-api-key':          apiKey,
        'anthropic-version':  ANTHROPIC_VERSION,
        'content-type':       'application/json',
      },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error('[claudeProxy] Anthropic error:', upstream.status, data);
      return res.status(upstream.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error('[claudeProxy] fetch error:', err);
    res.status(502).json({ error: `Upstream fetch failed: ${err.message}` });
  }
});

export default router;
