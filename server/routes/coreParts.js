/**
 * WrenchIQ — Core assistant parts lookup.
 *
 * POST /api/core/parts/search   { year, make, model, part, refresh? }
 *   -> { supplier, priceBasis, availabilityBasis, retrievedAt, fit, part, term, keywords, parts: [...] }
 *
 * Read-only NAPA catalog lookup with fitment for the given vehicle. No cart, no ordering.
 * Errors carry a `code` (no_vehicle, fitment_not_found, napa_unavailable) so the UI can say
 * what happened. A price is never estimated. Each row carries SAMPLE availability (see
 * services/partsAvailabilityService.js) for the shop's availability-first parts policy.
 */

import { Router } from 'express';
import { lookupNapaParts, NapaLookupError } from '../services/napaPartsService.js';
import { withSampleAvailability } from '../services/partsAvailabilityService.js';

const router = Router();

router.post('/search', async (req, res) => {
  try {
    const { year, make, model, part, refresh } = req.body || {};
    res.json(withSampleAvailability(await lookupNapaParts({ year, make, model, part, refresh: !!refresh })));
  } catch (err) {
    if (err instanceof NapaLookupError) {
      const status = err.code === 'napa_unavailable' ? 502 : err.code === 'fitment_not_found' ? 404 : 400;
      return res.status(status).json({ error: err.code, message: err.message });
    }
    console.error('[core/parts] unexpected error:', err);
    res.status(500).json({ error: 'internal', message: 'Parts lookup failed.' });
  }
});

export default router;
