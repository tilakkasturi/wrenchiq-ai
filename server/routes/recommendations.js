/**
 * WrenchIQ — Recommendations Route
 *
 * POST /api/recommendations
 * Body: { shopId, edition, persona }
 *
 * Flow:
 *   1. Check MongoDB recommendations cache (ttlExpiresAt > now)
 *   2. If hit  → return { cached: true, generatedAt, ttlExpiresAt, recommendations }
 *   3. If miss → buildSnapshot → generateRecommendations → write cache → return { cached: false, ... }
 *   4. On any error → 503
 *
 * TTL: 15 minutes per shop/edition.
 */

import { Router }                  from 'express';
import { buildSnapshot }            from '../services/snapshotBuilder.js';
import { generateRecommendations }  from '../services/recommendationLLM.js';
import { COLL }                     from '../models/Recommendation.js';
import { getVoiceSettings }         from './shopVoiceSettings.js';
import {
  logRecommendationEventsBatch,
  getRecommendationConversionRate,
} from '../services/recommendationEventsService.js';

function logShown(db, shopId, recommendations) {
  logRecommendationEventsBatch(db, (recommendations || []).map(r => ({
    shopId, recommendationId: r.id, roNumber: r.roNumber, domain: r.domain, event: 'shown',
  })));
}

const router = Router();
const CACHE_TTL_MINUTES = 15;

router.post('/recommendations', async (req, res) => {
  const { shopId, edition = 'am', persona } = req.body || {};

  if (!shopId) {
    return res.status(400).json({ error: 'shopId is required' });
  }

  const db = req.db;

  try {
    // ── 1. Check cache ──────────────────────────────────────────────────────────
    const now = new Date();
    const cached = await db.collection(COLL).findOne({
      shopId,
      edition,
      ttlExpiresAt: { $gt: now },
    });

    if (cached) {
      logShown(db, shopId, cached.recommendations);
      return res.json({
        cached:          true,
        generatedAt:     cached.generatedAt,
        ttlExpiresAt:    cached.ttlExpiresAt,
        recommendations: cached.recommendations,
      });
    }

    // ── 2. Build snapshot ───────────────────────────────────────────────────────
    let snapshot;
    try {
      snapshot = await buildSnapshot(shopId, edition, db);
    } catch (snapErr) {
      console.error('recommendations: snapshot build failed:', snapErr.message);
      return res.status(503).json({ error: 'Failed to build shop snapshot', detail: snapErr.message });
    }

    // ── 3. Generate recommendations via LLM ─────────────────────────────────────
    let recommendations;
    try {
      const voice = await getVoiceSettings(db, shopId);
      recommendations = await generateRecommendations(snapshot, edition, voice);
    } catch (llmErr) {
      console.error('recommendations: LLM call failed:', llmErr.message);
      return res.status(503).json({ error: 'Failed to generate recommendations', detail: llmErr.message });
    }

    // ── 4. Write to cache ───────────────────────────────────────────────────────
    const generatedAt  = now;
    const ttlExpiresAt = new Date(now.getTime() + CACHE_TTL_MINUTES * 60 * 1000);

    const doc = {
      shopId,
      edition,
      generatedAt,
      ttlExpiresAt,
      recommendations,
    };

    try {
      // Upsert: replace any stale doc for this shop/edition
      await db.collection(COLL).replaceOne(
        { shopId, edition },
        doc,
        { upsert: true }
      );
    } catch (dbErr) {
      // Cache write failure is non-fatal — still return the result
      console.warn('recommendations: cache write failed:', dbErr.message);
    }

    // ── 5. Return result ────────────────────────────────────────────────────────
    logShown(db, shopId, recommendations);
    return res.json({
      cached: false,
      generatedAt,
      ttlExpiresAt,
      recommendations,
    });

  } catch (err) {
    console.error('recommendations: unexpected error:', err.message);
    return res.status(503).json({ error: 'Recommendations service unavailable', detail: err.message });
  }
});

// ── POST /recommendations/event — log accepted/dismissed from the client ────
router.post('/recommendations/event', async (req, res) => {
  const { shopId, recommendationId, roNumber, domain, event, persona } = req.body || {};
  if (!shopId || !recommendationId || !['accepted', 'dismissed'].includes(event)) {
    return res.status(400).json({ error: 'shopId, recommendationId, and event (accepted|dismissed) are required' });
  }
  await logRecommendationEventsBatch(req.db, [{ shopId, recommendationId, roNumber, domain, event, persona }]);
  res.status(204).end();
});

// ── GET /recommendations/conversion-rate — closed-loop metric ────────────────
router.get('/recommendations/conversion-rate', async (req, res) => {
  try {
    const rate = await getRecommendationConversionRate(req.db, req.query.shopId);
    res.json(rate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
