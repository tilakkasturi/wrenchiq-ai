/**
 * WrenchIQ — RO Gold Standard Score
 *
 * Per-RO checklist status against the shop's Gold Standard guidelines
 * (definitions live in gold_standard_checklist / goldStandardChecklist.js).
 * Lets an advisor use the Gold Standard as a live checklist/reminder while
 * working a specific RO — separate from the shop-level guideline text.
 *
 * Collection: ro_gold_standard_score
 *
 * GET   /api/ro-gold-standard-score/:shopId/:roNumber
 *   — Guideline definitions merged with this RO's status (defaults to "pending")
 *     plus any cached AI suggestion (aiStatus/aiEvidence/aiScoredAt).
 * POST  /api/ro-gold-standard-score/:shopId/:roNumber/auto-score
 *   — Ask WrenchIQ to assess this RO against every guideline (using the RO,
 *     conversation fields, and Intelligence findings in the request body).
 *     Writes aiStatus/aiEvidence only — never touches the advisor's status.
 * PATCH /api/ro-gold-standard-score/:shopId/:roNumber/:itemId
 *   — Set { status: "pending" | "done" | "na" } for one guideline on this RO.
 */

import { Router } from 'express';
import { DEFAULT_GOLD_STANDARD_CHECKLIST } from './goldStandardChecklist.js';
import { runROScoreAgent } from '../services/roScoreAgent.js';

const router = Router();
const COLL = 'ro_gold_standard_score';

let indexesEnsured = false;

async function ensureIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    await db.collection(COLL).createIndex({ shopId: 1, roNumber: 1, itemId: 1 }, { unique: true });
  } catch (err) {
    console.warn('ro_gold_standard_score index creation warning:', err.message);
  }
}

async function loadGuidelines(db, shopId) {
  const checklistCol = db.collection('gold_standard_checklist');
  let guidelines = await checklistCol.find({ shopId }, { projection: { _id: 0 } }).toArray();
  if (guidelines.length === 0) {
    guidelines = DEFAULT_GOLD_STANDARD_CHECKLIST;
  }
  return [...guidelines].sort(
    (a, b) => parseInt(a.id.replace(/\D/g, ''), 10) - parseInt(b.id.replace(/\D/g, ''), 10)
  );
}

async function mergeItems(db, shopId, roNumber, guidelines) {
  await ensureIndexes(db);
  const scoreCol = db.collection(COLL);
  const scores = await scoreCol.find({ shopId, roNumber }, { projection: { _id: 0 } }).toArray();
  const scoreByItem = Object.fromEntries(scores.map(s => [s.itemId, s]));

  return guidelines.map(g => ({
    id:               g.id,
    guideline:        g.guideline,
    appliesTo:        g.appliesTo,
    whatA5LooksLike:  g.whatA5LooksLike,
    status:           scoreByItem[g.id]?.status || 'pending',
    checkedAt:        scoreByItem[g.id]?.checkedAt || null,
    aiStatus:         scoreByItem[g.id]?.aiStatus || null,
    aiEvidence:       scoreByItem[g.id]?.aiEvidence || null,
    aiScoredAt:       scoreByItem[g.id]?.aiScoredAt || null,
  }));
}

// ── GET /:shopId/:roNumber — guideline defs + this RO's status ──────────────
router.get('/:shopId/:roNumber', async (req, res) => {
  try {
    const db = req.db;
    const { shopId, roNumber } = req.params;
    const guidelines = await loadGuidelines(db, shopId);
    const items = await mergeItems(db, shopId, roNumber, guidelines);
    res.json({ shopId, roNumber, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /:shopId/:roNumber/auto-score — WrenchIQ assesses every guideline ──
router.post('/:shopId/:roNumber/auto-score', async (req, res) => {
  try {
    const db = req.db;
    const { shopId, roNumber } = req.params;
    const { ro, customer, vehicle, agentData } = req.body || {};

    const guidelines = await loadGuidelines(db, shopId);
    const aiItems = await runROScoreAgent({ ro: ro || {}, customer, vehicle, agentData, guidelines });

    await ensureIndexes(db);
    const scoreCol = db.collection(COLL);
    const now = new Date().toISOString();

    await Promise.all(aiItems.map(item => scoreCol.findOneAndUpdate(
      { shopId, roNumber, itemId: item.id },
      {
        $set:        { aiStatus: item.status, aiEvidence: item.evidence, aiScoredAt: now },
        $setOnInsert: { shopId, roNumber, itemId: item.id, status: 'pending', createdAt: now },
      },
      { upsert: true }
    )));

    const items = await mergeItems(db, shopId, roNumber, guidelines);
    res.json({ shopId, roNumber, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:shopId/:roNumber/:itemId — set status for one guideline ─────────
router.patch('/:shopId/:roNumber/:itemId', async (req, res) => {
  try {
    const db = req.db;
    await ensureIndexes(db);
    const col = db.collection(COLL);
    const { shopId, roNumber, itemId } = req.params;
    const { status } = req.body;

    if (!['pending', 'done', 'na'].includes(status)) {
      return res.status(400).json({ error: 'status must be one of: pending, done, na' });
    }

    const now = new Date().toISOString();
    const result = await col.findOneAndUpdate(
      { shopId, roNumber, itemId },
      { $set: { status, checkedAt: now }, $setOnInsert: { shopId, roNumber, itemId, createdAt: now } },
      { upsert: true, returnDocument: 'after', projection: { _id: 0 } }
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
