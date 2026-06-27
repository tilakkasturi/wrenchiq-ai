/**
 * WrenchIQ — RO Advisor Agent Route
 *
 * POST /api/agent/ro-advisor
 *
 * Body: { ro, customer, vehicle, shopId }
 * Returns: { advisorBrief, upsells[], ings[], alerts[], generatedAt }
 *
 * The agent consults customer RO history, active shop ings, and
 * mileage-appropriate service intervals to brief the advisor before
 * they walk out to greet the customer.
 */

import { Router } from 'express';
import { runROAdvisorAgent } from '../services/roAdvisorService.js';

const router = Router();

router.post('/', async (req, res) => {
  const { ro, customer, vehicle, shopId } = req.body;

  if (!ro) {
    return res.status(400).json({ error: 'ro is required' });
  }

  try {
    const result = await runROAdvisorAgent({
      ro,
      customer: customer || null,
      vehicle:  vehicle  || null,
      shopId:   shopId   || ro.shopId || 'shop-001',
      db:       req.db   || null,
    });

    res.json(result);
  } catch (err) {
    console.error('[roAdvisor] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
