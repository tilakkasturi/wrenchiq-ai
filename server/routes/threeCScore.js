/**
 * WrenchIQ — 3C Narrative Score & Rewrite
 *
 * Live LLM scoring/rewriting of a repair order's Complaint/Cause/Correction
 * narrative — see server/services/threeCScoreService.js for the grounding
 * rule the rewrite is held to.
 *
 * POST /api/three-c-score/score
 *   body: { concern, diagnosis, correction, vehicle, dtcs, services }
 *   -> { score, rationale, gaps }
 * POST /api/three-c-score/rewrite-and-score
 *   body: same
 *   -> { before, rewritten, after }
 * POST /api/three-c-score/rewrite-concern
 *   body: { concern, vehicle }
 *   -> { concern }
 */

import { Router } from 'express';
import { scoreThreeC, scoreAndRewriteThreeC, rewriteConcern } from '../services/threeCScoreService.js';

const router = Router();

router.post('/score', async (req, res) => {
  try {
    const { concern, diagnosis, correction, vehicle, dtcs, services } = req.body || {};
    const result = await scoreThreeC({ concern, diagnosis, correction, vehicle, dtcs, services });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rewrite-and-score', async (req, res) => {
  try {
    const { concern, diagnosis, correction, vehicle, dtcs, services } = req.body || {};
    const result = await scoreAndRewriteThreeC({ concern, diagnosis, correction, vehicle, dtcs, services });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/rewrite-concern', async (req, res) => {
  try {
    const { concern, vehicle } = req.body || {};
    const result = await rewriteConcern({ concern, vehicle });
    if (!result) return res.status(502).json({ error: 'Rewrite unavailable' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
