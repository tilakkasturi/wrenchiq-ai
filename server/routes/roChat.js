/**
 * WrenchIQ — RO Chat Assistant Routes
 *
 * Small bilingual (EN/ES) chat scoped to the active RO — rewrites rough
 * text into "automotive speak" in either direction. See roChatService.js
 * for the system prompt and agent logic.
 *
 * POST /api/ro-chat                — send a message, get a reply
 * POST /api/ro-chat/system-prompt  — preview the exact system prompt for a given RO/shop context
 * GET  /api/ro-chat/frontier-info  — which model the frontier tier actually points at (no secrets)
 * POST /api/ro-chat/translate      — translate one already-generated reply into English
 */

import { Router } from 'express';
import { buildChatSystemPrompt, runROChatAgent } from '../services/roChatService.js';
import { getCannedJobs } from '../services/cannedJobsService.js';
import { getShopProfileSnapshot } from '../services/shopProfileSnapshotService.js';
import { fetchCustomerHistory } from '../services/roAdvisorService.js';
import { getVoiceSettings } from './shopVoiceSettings.js';
import { LLM_PROFILES, isProfileConfigured } from '../services/llmProviderConfig.js';
import { listCustomerNotes } from '../services/customerNotesService.js';
import { translateToEnglish } from '../services/translateService.js';

const router = Router();

// The frontend's "Frontier model" toggle should reflect whatever's actually
// configured in .env.local (e.g. gpt-5.4-mini today, gpt-5.5 before that)
// rather than a hardcoded label that drifts out of sync.
router.get('/frontier-info', (_req, res) => {
  res.json({
    model: LLM_PROFILES.frontier.model || null,
    configured: isProfileConfigured('frontier'),
  });
});

// Canned job pricing and the Shop Profile are both looked up server-side
// from the shop's own persisted data, not trusted from the client — same
// sources Predii Learn's own tabs read (cannedJobsService.js /
// shopProfileSnapshotService.js).
function resolveShopId({ ro, shop }) {
  return ro?.shopId || shop?.id || 'cornerstone';
}

async function loadCannedJobs(req, ctx) {
  return getCannedJobs(req.db, resolveShopId(ctx)).catch(() => []);
}

async function loadShopProfile(req, ctx) {
  const doc = await getShopProfileSnapshot(req.db, resolveShopId(ctx)).catch(() => null);
  return doc?.profile || null;
}

// Reuses the ARO Advisor's own customer-history lookup (past ROs from
// MongoDB) so "summarize this customer's past visits" answers from the
// same real data the advisor briefing already relies on.
async function loadCustomerHistory(req, { ro, customer }) {
  const customerId = customer?.id || ro?.customerId || ro?._customer?.id;
  if (!customerId) return [];
  return fetchCustomerHistory(customerId, req.db, resolveShopId({ ro })).catch(() => []);
}

// Personal notes an advisor saved about this customer (see
// customerNotesService.js) — folded into the chat's own context the same
// way customerHistory is, so "remembering" a note actually means the
// assistant can use it, not just that it's stored somewhere.
async function loadCustomerNotes(req, { ro, customer }) {
  const customerId = customer?.id || ro?.customerId || ro?._customer?.id;
  if (!customerId) return [];
  return listCustomerNotes(req.db, { shopId: resolveShopId({ ro }), customerId }).catch(() => []);
}

router.post('/system-prompt', async (req, res) => {
  try {
    const { ro, customer, vehicle, shop } = req.body || {};
    const cannedJobs = await loadCannedJobs(req, { ro, shop });
    const shopProfile = await loadShopProfile(req, { ro, shop });
    const customerHistory = await loadCustomerHistory(req, { ro, customer });
    const customerNotes = await loadCustomerNotes(req, { ro, customer });
    const voice = await getVoiceSettings(req.db, resolveShopId({ ro, shop }));
    res.json({ systemPrompt: buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, customerNotes, voice }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { message, history, ro, customer, vehicle, shop, modelTier, language, maxTokens } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const cannedJobs = await loadCannedJobs(req, { ro, shop });
    const shopProfile = await loadShopProfile(req, { ro, shop });
    const customerHistory = await loadCustomerHistory(req, { ro, customer });
    const customerNotes = await loadCustomerNotes(req, { ro, customer });
    const voice = await getVoiceSettings(req.db, resolveShopId({ ro, shop }));
    const result = await runROChatAgent({ message, history, ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, customerNotes, voice, modelTier, language, maxTokens });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Structured (not LLM-summarized) past-visit history for this customer —
// dates, services, cost — for the RO Chat "Visit history" task to render
// as a real timeline instead of asking the model to restate dates from
// prose. Same underlying lookup the chat's own grounding already uses.
router.get('/customer-history', async (req, res) => {
  const { customerId, shopId } = req.query;
  if (!customerId) return res.status(400).json({ error: 'customerId is required' });
  try {
    const history = await fetchCustomerHistory(customerId, req.db, shopId);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/translate', async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ error: 'text is required' });
  try {
    const translation = await translateToEnglish(text);
    res.json({ translation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
