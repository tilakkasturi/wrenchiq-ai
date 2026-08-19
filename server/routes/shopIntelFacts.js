/**
 * WrenchIQ — Shop Intelligence Spotlight
 *
 * POST /api/shop-intel-facts
 *   body: { shopId, shop, locations, technicians, financials }
 *   -> { facts: [{icon, title, detail}], generatedAt } or 503 if the LLM
 *      call failed (client falls back to a static fact list)
 *
 * Cached in Mongo per shopId for 15 minutes — same TTL as the
 * recommendations cache (server/models/Recommendation.js) — since the
 * underlying shop data doesn't change between page loads.
 */

import { Router } from 'express';
import { generateShopIntelFacts } from '../services/shopIntelFactsService.js';

const router = Router();
const COLL = 'shop_intel_facts_cache';
const TTL_MS = 15 * 60 * 1000;

router.post('/', async (req, res) => {
  try {
    const { shopId, shop, locations, technicians, financials } = req.body || {};
    const db = req.db;
    const cacheKey = shopId || shop?.id || 'default';

    if (db) {
      const cached = await db.collection(COLL).findOne({ shopId: cacheKey });
      if (cached && Date.now() - new Date(cached.generatedAt).getTime() < TTL_MS) {
        return res.json({ facts: cached.facts, generatedAt: cached.generatedAt, cached: true });
      }
    }

    const facts = await generateShopIntelFacts({ shop, locations, technicians, financials });
    if (!facts || facts.length === 0) {
      return res.status(503).json({ error: 'Shop Intelligence Spotlight is unavailable right now.' });
    }

    const generatedAt = new Date().toISOString();
    if (db) {
      await db.collection(COLL).updateOne(
        { shopId: cacheKey },
        { $set: { shopId: cacheKey, facts, generatedAt } },
        { upsert: true }
      );
    }

    res.json({ facts, generatedAt, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
