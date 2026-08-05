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
 */

import { Router } from 'express';
import { buildChatSystemPrompt, runROChatAgent } from '../services/roChatService.js';
import { getCannedJobs } from '../services/cannedJobsService.js';
import { getShopProfileSnapshot } from '../services/shopProfileSnapshotService.js';
import { fetchCustomerHistory } from '../services/roAdvisorService.js';
import { getVoiceSettings } from './shopVoiceSettings.js';
import { LLM_PROFILES, isProfileConfigured } from '../services/llmProviderConfig.js';

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
  return fetchCustomerHistory(customerId, req.db).catch(() => []);
}

router.post('/system-prompt', async (req, res) => {
  try {
    const { ro, customer, vehicle, shop } = req.body || {};
    const cannedJobs = await loadCannedJobs(req, { ro, shop });
    const shopProfile = await loadShopProfile(req, { ro, shop });
    const customerHistory = await loadCustomerHistory(req, { ro, customer });
    const voice = await getVoiceSettings(req.db, resolveShopId({ ro, shop }));
    res.json({ systemPrompt: buildChatSystemPrompt({ ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, voice }) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { message, history, ro, customer, vehicle, shop, modelTier, maxTokens } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const cannedJobs = await loadCannedJobs(req, { ro, shop });
    const shopProfile = await loadShopProfile(req, { ro, shop });
    const customerHistory = await loadCustomerHistory(req, { ro, customer });
    const voice = await getVoiceSettings(req.db, resolveShopId({ ro, shop }));
    const result = await runROChatAgent({ message, history, ro, customer, vehicle, shop, cannedJobs, shopProfile, customerHistory, voice, modelTier, maxTokens });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
