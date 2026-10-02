/**
 * WrenchIQ — ROAgent Routes
 *
 * POST /api/ro-agent/draft
 *   Takes an inbound lead (social DM, SMS, etc.) and uses the LLM to extract
 *   structured repair intent: symptoms, recommended services, urgency, ARO estimate.
 *   Returns a prefill payload for NewROWizard.
 *
 * A single-call extraction skill, not an agent — fixed input, one completion,
 * parsed output, no tool-calling or multi-step decision-making. See
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md.
 */

import { Router } from 'express';
import { AZURE_OPENAI_API_KEY } from '../config.js';
import { callAzureOpenAI, getTextFromResponse } from '../services/azureOpenAI.js';
import { prompt } from '../services/promptLoader.js';

const router = Router();

// Wording: prompts/ro-intake-extract-system.md (system) + prompts/ro-intake-extract-user.md (user).

// ── POST /api/ro-agent/draft ──────────────────────────────────────────────────
router.post('/draft', async (req, res) => {
  const { customerName, phone, channel, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!AZURE_OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AZURE_OPENAI_API_KEY not configured' });
  }

  try {
    const userPrompt = prompt('ro-intake-extract-user', {
      channel: channel || '', customerName: customerName || '', phone: phone || '', message,
    });
    const data = await callAzureOpenAI({
      system:     prompt('ro-intake-extract-system'),
      messages:   [{ role: 'user', content: userPrompt }],
      max_tokens: 512,
      _route: '/api/ro-agent',
    });

    const raw = getTextFromResponse(data) || '{}';

    let draft;
    try {
      draft = JSON.parse(raw);
    } catch {
      console.error('[roAgent] JSON parse error, raw:', raw);
      return res.status(500).json({ error: 'Failed to parse LLM response', raw });
    }

    res.json({
      customerName,
      phone,
      channel,
      message,
      draft,
    });
  } catch (err) {
    console.error('[roAgent] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
