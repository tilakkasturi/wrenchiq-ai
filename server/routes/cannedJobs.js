/**
 * WrenchIQ — Canned Jobs Route
 *
 * V5 feedback (A1): the shop's canned-job menu (labor price + priced parts
 * package per job), seeded into MongoDB by scripts/seedCannedJobsCornerstone.js
 * as a single RepairOrder-collection document tagged isCannedJobCatalog: true.
 *
 * GET  /api/canned-jobs/:shopId             — the shop's canned job catalog, or [] if none seeded.
 * GET  /api/canned-jobs/:shopId/candidates   — recurring RO jobs not yet on the menu (see cannedJobCandidatesService.js).
 * POST /api/canned-jobs/:shopId              — add one job to the catalog { description, laborHours, laborCost, parts, totalPrice }.
 */

import { Router } from 'express';
import { getCannedJobs, addCannedJob } from '../services/cannedJobsService.js';
import { findCannedJobCandidates } from '../services/cannedJobCandidatesService.js';

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

router.get('/:shopId/candidates', async (req, res) => {
  try {
    const candidates = await findCannedJobCandidates(req.db, req.params.shopId);
    res.json({ candidates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:shopId', async (req, res) => {
  const { description, laborHours, laborCost, parts, totalPrice } = req.body || {};
  if (!description) return res.status(400).json({ error: 'description is required' });
  try {
    const partsList = Array.isArray(parts) ? parts : [];
    const job = {
      description,
      laborHours: laborHours || 0,
      laborCost: laborCost || 0,
      parts: partsList,
      totalPrice: totalPrice ?? (laborCost || 0) + partsList.reduce((s, p) => s + (p.lineCost || 0), 0),
    };
    const jobs = await addCannedJob(req.db, req.params.shopId, job);
    res.json({ shopId: req.params.shopId, jobs, added: job });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
