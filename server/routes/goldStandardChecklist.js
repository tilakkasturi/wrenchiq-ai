/**
 * WrenchIQ — Gold Standard Checklist Routes
 *
 * Collection: gold_standard_checklist
 *
 * GET   /api/gold-standard-checklist/:shopId       — Get checklist for a shop (auto-seeds default on first read)
 * PATCH /api/gold-standard-checklist/:shopId/:itemId — Update one guideline's fields
 */

import { Router } from 'express';

const router = Router();
const COLL = 'gold_standard_checklist';

let indexesEnsured = false;

async function ensureChecklistIndexes(db) {
  if (indexesEnsured) return;
  indexesEnsured = true;
  try {
    const col = db.collection(COLL);
    await col.createIndex({ shopId: 1, id: 1 }, { unique: true });
  } catch (err) {
    console.warn('gold_standard_checklist index creation warning:', err.message);
  }
}

// Default Gold Standard checklist — used to auto-seed every shop's first read.
export const DEFAULT_GOLD_STANDARD_CHECKLIST = [
  {
    id: 'G1',
    guideline: 'Multi-Point Inspection',
    appliesTo: 'RO',
    whatA5LooksLike: 'Full MPI done, photos attached, findings documented for every vehicle/device, not just the stated concern.',
  },
  {
    id: 'G2',
    guideline: 'Transparent Itemized Estimate',
    appliesTo: 'RO',
    whatA5LooksLike: 'Written/digital estimate with parts, labor, and price broken out; customer approval captured before work starts.',
  },
  {
    id: 'G3',
    guideline: 'Proactive Communication Cadence',
    appliesTo: 'Conversation',
    whatA5LooksLike: 'Customer updated at each milestone (received/diagnosed/approved/in-progress/ready) within ~2 hrs of status change, unprompted.',
  },
  {
    id: 'G4',
    guideline: 'Good/Better/Best Options',
    appliesTo: 'Conversation',
    whatA5LooksLike: 'Tiered part/repair options presented (economy/OEM/premium) with clear tradeoffs.',
  },
  {
    id: 'G5',
    guideline: 'Root-Cause Diagnosis Explained',
    appliesTo: 'Conversation',
    whatA5LooksLike: 'Advisor/tech explains WHY the failure happened and flags related wear items proactively.',
  },
  {
    id: 'G6',
    guideline: 'Warranty & Follow-Up Documented',
    appliesTo: 'RO',
    whatA5LooksLike: 'Warranty terms explained clearly at pickup; follow-up contact scheduled within 3-5 days and logged.',
  },
  {
    id: 'G7',
    guideline: 'Effective Labor Rate & Margin Tracked',
    appliesTo: 'RO',
    whatA5LooksLike: 'ELR and parts margin calculated and within shop target for this RO.',
  },
  {
    id: 'G8',
    guideline: 'Ticket Value / Mix Balance',
    appliesTo: 'RO',
    whatA5LooksLike: 'RO value reflects full scope of legitimate needed work; not artificially minimized to close fast.',
  },
  {
    id: 'G9',
    guideline: 'Empathetic, No-Pressure Communication',
    appliesTo: 'Conversation',
    whatA5LooksLike: 'Urgency framed honestly (safety/critical vs can-wait); no scare tactics or pressure language.',
  },
  {
    id: 'G10',
    guideline: 'Declined Work Closed the Loop',
    appliesTo: 'RO',
    whatA5LooksLike: 'Prior declined recommendations re-presented and logged at this visit if still relevant.',
  },
];

// ── GET /:shopId — Get checklist for a shop (auto-seeds default) ────────────
router.get('/:shopId', async (req, res) => {
  try {
    const db = req.db;
    await ensureChecklistIndexes(db);
    const col = db.collection(COLL);
    const { shopId } = req.params;

    const count = await col.countDocuments({ shopId });

    if (count === 0) {
      const now = new Date().toISOString();
      await col.insertMany(
        DEFAULT_GOLD_STANDARD_CHECKLIST.map(item => ({
          ...item,
          shopId,
          createdAt: now,
          updatedAt: now,
        }))
      );
    }

    const items = await col.find({ shopId }, { projection: { _id: 0 } }).toArray();
    items.sort((a, b) => parseInt(a.id.replace(/\D/g, ''), 10) - parseInt(b.id.replace(/\D/g, ''), 10));
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /:shopId/:itemId — Update one guideline's fields ──────────────────
router.patch('/:shopId/:itemId', async (req, res) => {
  try {
    const db = req.db;
    const col = db.collection(COLL);
    const { shopId, itemId } = req.params;
    const { guideline, appliesTo, whatA5LooksLike } = req.body;

    const update = { updatedAt: new Date().toISOString() };
    if (guideline !== undefined) update.guideline = guideline;
    if (appliesTo !== undefined) update.appliesTo = appliesTo;
    if (whatA5LooksLike !== undefined) update.whatA5LooksLike = whatA5LooksLike;

    const result = await col.findOneAndUpdate(
      { shopId, id: itemId },
      { $set: update },
      { returnDocument: 'after', projection: { _id: 0 } }
    );

    if (!result) {
      return res.status(404).json({ error: 'Checklist item not found.' });
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
