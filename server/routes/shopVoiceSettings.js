/**
 * WrenchIQ — Shop Voice Settings Routes (V5 feedback B3)
 *
 * Collection: shop_voice_settings
 * Single document per shopId holding tone-of-voice knobs consumed by every
 * LLM copy-generation prompt builder (recommendations, ARO agent, RO chat).
 *
 * GET   /api/shop-voice-settings/:shopId — Get voice settings (auto-seeds defaults)
 * PATCH /api/shop-voice-settings/:shopId — Update voice setting fields
 */

import { Router } from 'express';

const router = Router();
const COLL = 'shop_voice_settings';

export const DEFAULT_VOICE_SETTINGS = {
  register: 'professional',      // 'professional' | 'neighborhood'
  length: 'medium',               // 'short' | 'medium'
  shareEvidence: true,             // cite data/evidence backing a recommendation
  pressureLevel: 'medium',         // 'low' | 'medium' | 'high'
};

const ALLOWED_FIELDS = ['register', 'length', 'shareEvidence', 'pressureLevel'];

// ── GET /:shopId — Get voice settings ────────────────────────────────────────
router.get('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { shopId } = req.params;

    let doc = await col.findOne({ shopId });
    if (!doc) {
      const now = new Date().toISOString();
      doc = { shopId, ...DEFAULT_VOICE_SETTINGS, createdAt: now, updatedAt: now };
      await col.insertOne(doc);
    }
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:shopId — Update voice setting fields ─────────────────────────────
router.patch('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { shopId } = req.params;

    const updates = {};
    for (const f of ALLOWED_FIELDS) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid voice-setting fields provided' });
    }

    updates.updatedAt = new Date().toISOString();

    const insertDefaults = { ...DEFAULT_VOICE_SETTINGS };
    for (const key of Object.keys(updates)) delete insertDefaults[key];

    const result = await col.findOneAndUpdate(
      { shopId },
      {
        $set: updates,
        $setOnInsert: { shopId, createdAt: updates.updatedAt, ...insertDefaults },
      },
      { upsert: true, returnDocument: 'after' }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Server-side helper for prompt builders — fetches voice settings with
 * defaults, without an HTTP round-trip.
 */
export async function getVoiceSettings(db, shopId) {
  try {
    const doc = await db.collection(COLL).findOne({ shopId });
    return { ...DEFAULT_VOICE_SETTINGS, ...(doc || {}) };
  } catch {
    return { ...DEFAULT_VOICE_SETTINGS };
  }
}

export default router;
