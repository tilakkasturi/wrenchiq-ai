/**
 * WrenchIQ — Shop Chat Routes
 *
 * Shop-wide free-form chat — no RO needs to be open. Ask anything grounded
 * in the shop's canned-job menu, its persisted Shop Profile, and (if named)
 * a specific customer's real visit history. Always the default Predii LLM.
 *
 * POST /api/shop-chat                — send a message, get a reply
 * POST /api/shop-chat/system-prompt  — preview the exact system prompt
 */

import { Router } from 'express';
import { buildShopChatSystemPrompt, runShopChatAgent } from '../services/shopChatService.js';
import { getCannedJobs } from '../services/cannedJobsService.js';
import { getShopProfileSnapshot } from '../services/shopProfileSnapshotService.js';
import { findCustomersByName } from '../services/customerLookupService.js';
import { fetchCustomerHistory } from '../services/roAdvisorService.js';

const router = Router();

// customerId (from an explicit dropdown selection) is an exact match — no
// name-search ambiguity. customerName alone (a typed name, no ID) still
// falls back to the fuzzy search. No customer at all means "shop-wide" —
// canned jobs + Shop Profile only, no customer history block.
async function loadContext(req, { shopId, customerId, customerName }) {
  const [cannedJobs, snapshot, customerMatches] = await Promise.all([
    getCannedJobs(req.db, shopId).catch(() => []),
    getShopProfileSnapshot(req.db, shopId).catch(() => null),
    customerId
      ? Promise.resolve([{ id: customerId, name: customerName || customerId }])
      : customerName ? findCustomersByName(req.db, shopId, customerName).catch(() => []) : Promise.resolve([]),
  ]);

  let customerHistory = null;
  if (customerMatches.length > 0) {
    customerHistory = await fetchCustomerHistory(customerMatches[0].id, req.db).catch(() => []);
  }

  return { cannedJobs, shopProfile: snapshot?.profile || null, customerMatches, customerHistory };
}

router.post('/system-prompt', async (req, res) => {
  try {
    const { shopId = 'cornerstone', shopName, customerId, customerName } = req.body || {};
    const { cannedJobs, shopProfile, customerMatches, customerHistory } = await loadContext(req, { shopId, customerId, customerName });
    res.json({
      systemPrompt: buildShopChatSystemPrompt({ shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches }),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { message, history, shopId = 'cornerstone', shopName, customerId, customerName } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }
    const { cannedJobs, shopProfile, customerMatches, customerHistory } = await loadContext(req, { shopId, customerId, customerName });
    const result = await runShopChatAgent({ message, history, shopName, cannedJobs, shopProfile, customerName, customerHistory, customerMatches });
    res.json({ ...result, customerMatches });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
