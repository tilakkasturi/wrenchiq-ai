/**
 * WrenchIQ — RO Advisor Agent Route
 *
 * POST /api/agent/ro-advisor
 *
 * Body: { ro, customer, vehicle, shopId }
 * Returns: { advisorBrief, serviceRecommendations[], ings[], alerts[], marginCheck, aroGap, generatedAt }
 *
 * The agent consults customer RO history, active shop ings, and
 * mileage-appropriate service intervals to brief the advisor before
 * they walk out to greet the customer. `marginCheck` and `aroGap` are
 * deterministic (non-LLM) computations composed in here from `shop_config`
 * and `shop_goals` — see marginCheck.js.
 */

import { Router } from 'express';
import { runROAdvisorAgent } from '../services/roAdvisorService.js';
import { computeMarginCheck } from '../services/marginCheck.js';

const router = Router();

const DEFAULT_MARGIN_CONFIG = { laborCost: 85, partsMarginTarget: 53, preferredSuppliers: ['Worldpac'] };

// ARO target is intentionally read from the network-aggregate sentinel
// 'shop-001', not the real active shopId — matches the convention already
// established by SettingsScreen.jsx's ARO & Margin tab for this same goal.
const ARO_GOAL_SHOP_ID = 'shop-001';

async function fetchShopConfig(shopId, db) {
  if (!db) return DEFAULT_MARGIN_CONFIG;
  try {
    const doc = await db.collection('shop_config').findOne({ shopId });
    return doc ? { ...DEFAULT_MARGIN_CONFIG, ...doc } : DEFAULT_MARGIN_CONFIG;
  } catch {
    return DEFAULT_MARGIN_CONFIG;
  }
}

async function fetchAroTarget(db) {
  if (!db) return null;
  try {
    const doc = await db.collection('shop_goals').findOne({ shopId: ARO_GOAL_SHOP_ID, metric: 'avg_ro' });
    return doc?.target ?? null;
  } catch {
    return null;
  }
}

function computeAroGap(ro, aroTarget, serviceRecommendations) {
  if (typeof aroTarget !== 'number') return null;
  const current = ro.totalEstimate || 0;
  const gapAmount = Math.max(0, aroTarget - current);
  const recommendationsCoverAmount = (serviceRecommendations || [])
    .reduce((s, r) => s + (r.estimatedCost || 0), 0);
  return { target: aroTarget, current, gapAmount, recommendationsCoverAmount };
}

router.post('/', async (req, res) => {
  const { ro, customer, vehicle, shopId } = req.body;

  if (!ro) {
    return res.status(400).json({ error: 'ro is required' });
  }

  const resolvedShopId = shopId || ro.shopId || 'shop-001';

  try {
    // Fetched first (not in parallel with the agent) so the same shopConfig
    // used for marginCheck below is also what the agent sees as its shop
    // profile context — one query, one source of truth, instead of the
    // agent independently re-fetching shop_config for itself.
    const [shopConfig, aroTarget] = await Promise.all([
      fetchShopConfig(resolvedShopId, req.db),
      fetchAroTarget(req.db),
    ]);

    const result = await runROAdvisorAgent({
      ro,
      customer: customer || null,
      vehicle:  vehicle  || null,
      shopId:   resolvedShopId,
      db:       req.db   || null,
      shopProfile: shopConfig,
    });

    const marginCheck = computeMarginCheck(ro, shopConfig);
    const aroGap = computeAroGap(ro, aroTarget, result.serviceRecommendations);

    res.json({ ...result, marginCheck, aroGap });
  } catch (err) {
    console.error('[roAdvisor] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
