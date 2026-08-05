/**
 * WrenchIQ — RO Value/Opportunity Score Routes (V5 feedback C3)
 *
 * A second, independent score for the RO queue alongside the existing Gold
 * Standard hygiene score (roGoldStandardScore.js, unchanged) — see
 * roValueScoreService.js for the scoring formula.
 *
 * GET  /api/ro-value-score/:shopId/:roNumber?customerId=&totalEstimate=
 *   — single RO score (cached 15 min)
 * POST /api/ro-value-score/:shopId/batch
 *   — body: { ros: [{roNumber, customerId, totalEstimate}] } — scores a
 *     whole queue/Kanban view in one aggregation pass
 */

import { Router } from 'express';
import { getValueScore, getValueScoresForROs } from '../services/roValueScoreService.js';

const router = Router();

router.get('/:shopId/:roNumber', async (req, res) => {
  try {
    const db = req.db;
    const { shopId, roNumber } = req.params;
    const { customerId, totalEstimate } = req.query;

    const doc = await getValueScore(db, shopId, {
      roNumber,
      customerId,
      totalEstimate: Number(totalEstimate) || 0,
    });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:shopId/batch', async (req, res) => {
  try {
    const db = req.db;
    const { shopId } = req.params;
    const { ros } = req.body || {};

    if (!Array.isArray(ros) || ros.length === 0) {
      return res.status(400).json({ error: 'ros[] is required' });
    }

    const scores = await getValueScoresForROs(db, shopId, ros);
    res.json({ shopId, scores });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
