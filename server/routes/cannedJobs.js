/**
 * WrenchIQ — Canned Jobs Route
 *
 * V5 feedback (A1): the shop's canned-job menu (labor price + priced parts
 * package per job), seeded into MongoDB by scripts/seedCannedJobsCornerstone.js
 * as a single RepairOrder-collection document tagged isCannedJobCatalog: true.
 *
 * GET /api/canned-jobs/:shopId — the shop's canned job catalog, or [] if none seeded.
 */

import { Router } from 'express';
import { getCannedJobs } from '../services/cannedJobsService.js';

const router = Router();

router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const jobs = await getCannedJobs(req.db, shopId);
    res.json({ shopId, jobs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
