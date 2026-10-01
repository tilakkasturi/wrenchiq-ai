/**
 * WrenchIQ — Core repair order agent route. See services/coreAgentService.js.
 */

import { Router } from 'express';
import { runCoreStep } from '../services/coreAgentService.js';

const router = Router();

/**
 * POST /api/core/agent/step   { messages, context, tools }
 *   -> { message: {content, tool_calls}, finish_reason, model, durationMs }
 *
 * One model call for the repair order agent. The browser runs the tools and loops; the prompt,
 * examples and tool allowlist live in services/coreAgentService.js.
 */
router.post('/step', async (req, res) => {
  const { messages, context, tools } = req.body || {};
  if (!Array.isArray(messages) || !messages.length) return res.status(400).json({ error: 'bad_request', message: 'messages is required.' });
  try {
    res.json(await runCoreStep({ messages, context, tools }));
  } catch (err) {
    console.error('[core/agent/step] failed:', err.message);
    res.status(502).json({ error: 'llm_unavailable', message: 'The assistant could not reach its language model.' });
  }
});

export default router;
