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
      recommendations = await generateRecommendations(snapshot, edition);
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

export default router;
