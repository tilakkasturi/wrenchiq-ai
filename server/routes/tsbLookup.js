/**
 * WrenchIQ — TSB Lookup Agent
 *
 * Standalone, deterministic lookup over NHTSA's free public Technical
 * Service Bulletin (Manufacturer Communications) API — no LLM involved, this
 * is a data-retrieval agent any screen can call directly for a given vehicle
 * year/make/model, independent of the RO Advisor Agent's get_tsbs tool
 * (roAdvisorService.js), which consumes the same underlying service
 * (nhtsaTsbService.js) but folds results into recommendations.
 *
 * GET /api/tsbs?make=&model=&year=       — active TSBs for a vehicle YMM
 * GET /api/tsbs/makes?year=              — makes that filed TSBs for a model year
 * GET /api/tsbs/models?year=&make=       — models filed under a make/year
 */

import { Router } from 'express';
import { getTSBsForVehicle, fetchMakesForYear, fetchModelsForYearMake } from '../services/nhtsaTsbService.js';

const router = Router();

router.get('/makes', async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'year is required' });
    const makes = await fetchMakesForYear(year);
    res.json({ year: Number(year), makes });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/models', async (req, res) => {
  try {
    const { year, make } = req.query;
    if (!year || !make) return res.status(400).json({ error: 'year and make are required' });
    const models = await fetchModelsForYearMake(year, make);
    res.json({ year: Number(year), make, models });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { make, model, year } = req.query;
    if (!make || !model || !year) {
      return res.status(400).json({ error: 'make, model, and year are all required' });
    }
    const tsbs = await getTSBsForVehicle(year, make, model, req.db);
    res.json({ make, model, year: Number(year), count: tsbs.length, tsbs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
