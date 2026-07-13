/**
 * WrenchIQ — LLM Proxy
 *
 * POST /api/claude/messages
 *
 * Accepts Anthropic-format request bodies from the browser,
 * translates them to OpenAI-compatible format, calls the LLM configured
 * via LLM_BASE_URL / LLM_MODEL in server/config.js (self-hosted vLLM Qwen
 * by default, Azure OpenAI as fallback), and returns an Anthropic-format
 * response so the frontend is unchanged.
 *
 * Anthropic body shape: { model, max_tokens, system?, messages, ... }
 * OpenAI body shape:    { model, max_tokens, messages: [{role,content}] }
 *
 * Anthropic response:   { content: [{ type: "text", text: "..." }], stop_reason, ... }
 * OpenAI response:      { choices: [{ message: { content: "..." }, finish_reason }] }
 */

import { Router } from 'express';
import { callAzureOpenAI, getTextFromResponse } from '../services/azureOpenAI.js';
import { LLM_BASE_URL } from '../config.js';

const router = Router();

router.post('/messages', async (req, res) => {
  if (!LLM_BASE_URL) {
    return res.status(503).json({ error: 'LLM_BASE_URL not configured on server' });
  }

  try {
    const { system, messages = [], max_tokens } = req.body;

    const data = await callAzureOpenAI({
      system,
      messages,
      max_tokens: max_tokens || 1024,
      _route: '/api/claude/messages',
    });

    const text        = getTextFromResponse(data);
    const finishReason = data.choices?.[0]?.finish_reason;

    // Return Anthropic-compatible response so frontend code is unchanged
    const anthropicShape = {
      id:           `msg_azure_${Date.now()}`,
      type:         'message',
      role:         'assistant',
      content:      [{ type: 'text', text }],
      stop_reason:  finishReason === 'length' ? 'max_tokens' : 'end_turn',
      usage: {
        input_tokens:  data.usage?.prompt_tokens     || 0,
        output_tokens: data.usage?.completion_tokens || 0,
      },
    };

    res.json(anthropicShape);
  } catch (err) {
    console.error('[claudeProxy] Azure error:', err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
