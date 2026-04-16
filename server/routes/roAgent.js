/**
 * WrenchIQ — ROAgent Routes
 *
 * POST /api/ro-agent/draft
 *   Takes an inbound lead (social DM, SMS, etc.) and uses the LLM to extract
 *   structured repair intent: symptoms, recommended services, urgency, ARO estimate.
 *   Returns a prefill payload for NewROWizard.
 */

import { Router } from 'express';
import { AZURE_OPENAI_API_KEY } from '../config.js';
import { callAzureOpenAI, getTextFromResponse } from '../services/azureOpenAI.js';

const router = Router();

const SYSTEM_PROMPT = `You are ROAgent, an AI assistant for an auto repair shop (Peninsula Precision Auto, Palo Alto CA).
Your job is to read inbound customer messages (from social media, SMS, or phone voicemail transcripts)
and extract structured repair intent so the service advisor can create a Repair Order immediately.

Respond ONLY with valid JSON — no prose, no markdown fences, just the raw JSON object.

Output schema:
{
  "symptom": string,          // 3-8 word symptom phrase for the RO search field (e.g. "brake grinding front wheels")
  "urgency": "high" | "medium" | "low",  // high = safety risk or customer in distress
  "estimatedARO": number,     // estimated average repair order value in USD (integer)
  "services": [               // 1-3 likely services, each with name + estimated cost
    { "name": string, "estimatedCost": number }
  ],
  "advisorNote": string,      // one sentence note for the advisor about this customer or situation
  "readyToDraft": boolean     // true if enough info to start an RO, false if advisor needs to call first
}`;

// ── POST /api/ro-agent/draft ──────────────────────────────────────────────────
router.post('/draft', async (req, res) => {
  const { customerName, phone, channel, message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  if (!AZURE_OPENAI_API_KEY) {
    return res.status(503).json({ error: 'AZURE_OPENAI_API_KEY not configured' });
  }

  const userPrompt = `Inbound lead from ${channel || 'unknown channel'}:
Customer name: ${customerName || 'Unknown'}
Phone: ${phone || 'Not provided'}
Message: "${message}"

Extract the repair intent and return structured JSON.`;

  try {
    const data = await callAzureOpenAI({
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: userPrompt }],
      max_tokens: 512,
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
