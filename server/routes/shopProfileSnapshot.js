/**
 * WrenchIQ — Shop Profile Snapshot Routes
 *
 * Lets the Predii Learn Shop Profile tab persist whatever it's currently
 * showing (live-run results or the static external-service profile — both
 * already normalized to the same shape client-side) so it survives past
 * this session, and lets other features (RO Chat) read it back without
 * needing a fresh Predii Learn run.
 *
 * POST /api/shop-profile-snapshot/:shopId  — persist { profile }
 * GET  /api/shop-profile-snapshot/:shopId  — read it back, or { profile: null } if never saved
 */

import { Router } from 'express';
import { saveShopProfileSnapshot, getShopProfileSnapshot } from '../services/shopProfileSnapshotService.js';

const router = Router();

router.post('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { profile } = req.body || {};
    if (!profile) return res.status(400).json({ error: 'profile is required' });
    const doc = await saveShopProfileSnapshot(req.db, shopId, profile);
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:shopId', async (req, res) => {
  try {
    const { shopId } = req.params;
    const doc = await getShopProfileSnapshot(req.db, shopId);
    res.json({ profile: doc?.profile || null, savedAt: doc?.savedAt || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
