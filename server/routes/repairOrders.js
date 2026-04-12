/**
 * WrenchIQ — Repair Order Routes
 *
 * Source collection: wrenchiq_ro (snake_case schema)
 *
 * GET  /api/repair-orders/demo          10 diverse ROs spread across all 6 Kanban stages
 * GET  /api/repair-orders/elr-summary   ELR aggregation by tech, vehicle origin, shop
 * GET  /api/repair-orders/:id           single RO
 * PATCH /api/repair-orders/:id/status   update kanban stage
 */

import { Router } from 'express';

const router = Router();
const COLL = 'wrenchiq_ro';

// Kanban stages assigned to the 10 demo slots (2-2-1-2-2-1 distribution)
const DEMO_STAGES = [
  'checked_in',
  'checked_in',
  'inspecting',
  'inspecting',
  'estimate_sent',
  'approved',
  'approved',
  'in_progress',
  'in_progress',
  'ready',
];

// ── Demo board — 10 diverse ROs spread across all 6 Kanban columns ───────────
//  Picks one RO per service category then fills remaining slots with varied
//  vehicle origins so the board looks realistic for a live demo.
router.get('/demo', async (req, res) => {
  try {
    const db = req.db;

    // One representative RO per service category (up to 6)
    const categories = ['maintenance', 'brake', 'transmission', 'ac', 'factory_oem', 'other_mechanical'];
    const byCategory = await Promise.all(
      categories.map(cat =>
        db.collection(COLL)
          .find({ service_category: cat, 'customer.name': { $exists: true } })
          .limit(1)
          .toArray()
          .then(docs => docs[0] || null)
      )
    );

    // Fill remaining slots (up to 10 total) with varied vehicle origins
    const usedIds = new Set(byCategory.filter(Boolean).map(d => String(d._id)));
    const filler = await db.collection(COLL)
      .find({
        'customer.name': { $exists: true },
        _id: { $nin: [...usedIds].map(id => id) },
      })
      .limit(20)
      .toArray();

    // Deduplicate customers so the board looks like 10 different people
    const seen = new Set();
    const pool = [...byCategory.filter(Boolean), ...filler].filter(doc => {
      const name = doc.customer?.name;
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    }).slice(0, 10);

    // Assign synthetic Kanban stages for demo day
    const today = new Date().toISOString().slice(0, 10);
    const docs = pool.map((doc, i) => ({
      ...doc,
      kanban_status: DEMO_STAGES[i],
      status: 'open',
      date_in: today,
    }));

    res.json({ count: docs.length, data: docs.map(normalizeRO) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── ELR Summary ──────────────────────────────────────────────────────────────
router.get('/elr-summary', async (req, res) => {
  try {
    const windowDays = Number(req.query.window) || 30;
    const since = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000).toISOString();

    const pipeline = [
      { $match: { date_in: { $gte: since } } },
      { $unwind: '$repair_jobs' },
      { $match: { 'repair_jobs.actual_labor_hours': { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: '$tech.id',
          techName:          { $first: '$tech.name' },
          totalLaborRevenue: { $sum: { $multiply: ['$repair_jobs.actual_labor_hours', '$shop.labor_rate'] } },
          totalActualHrs:    { $sum: '$repair_jobs.actual_labor_hours' },
          totalFlatHrs:      { $sum: '$repair_jobs.labor_hours' },
          roCount:           { $addToSet: '$ro_number' },
        },
      },
      {
        $project: {
          techId:            '$_id',
          techName:          1,
          totalLaborRevenue: 1,
          totalActualHrs:    1,
          totalFlatHrs:      1,
          roCount:           { $size: '$roCount' },
          elr: {
            $cond: [
              { $gt: ['$totalActualHrs', 0] },
              { $round: [{ $divide: ['$totalLaborRevenue', '$totalActualHrs'] }, 2] },
              0,
            ],
          },
        },
      },
      { $sort: { elr: -1 } },
    ];

    const byTech = await req.db.collection(COLL).aggregate(pipeline, { allowDiskUse: true }).toArray();

    const originPipeline = [
      { $match: { date_in: { $gte: since }, vehicle_origin: { $exists: true } } },
      { $unwind: '$repair_jobs' },
      { $match: { 'repair_jobs.actual_labor_hours': { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: '$vehicle_origin',
          totalLaborRevenue: { $sum: { $multiply: ['$repair_jobs.actual_labor_hours', '$shop.labor_rate'] } },
          totalActualHrs:    { $sum: '$repair_jobs.actual_labor_hours' },
        },
      },
      {
        $project: {
          vehicleOrigin:     '$_id',
          totalLaborRevenue: 1,
          totalActualHrs:    1,
          elr: {
            $cond: [
              { $gt: ['$totalActualHrs', 0] },
              { $round: [{ $divide: ['$totalLaborRevenue', '$totalActualHrs'] }, 2] },
              0,
            ],
          },
        },
      },
    ];

    const byOrigin = await req.db.collection(COLL).aggregate(originPipeline, { allowDiskUse: true }).toArray();

    const shopTotals = byTech.reduce(
      (acc, t) => {
        acc.totalLaborRevenue += t.totalLaborRevenue;
        acc.totalActualHrs    += t.totalActualHrs;
        acc.totalFlatHrs      += t.totalFlatHrs;
        return acc;
      },
      { totalLaborRevenue: 0, totalActualHrs: 0, totalFlatHrs: 0 }
    );
    const shopElr = shopTotals.totalActualHrs > 0
      ? Math.round((shopTotals.totalLaborRevenue / shopTotals.totalActualHrs) * 100) / 100
      : 0;

    res.json({
      windowDays,
      since,
      shop: { ...shopTotals, elr: shopElr, postedRate: 195 },
      byTech,
      byOrigin,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Single RO ────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const doc = await req.db.collection(COLL).findOne({ ro_number: req.params.id });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(normalizeRO(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Update Kanban status ──────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const VALID = ['checked_in', 'inspecting', 'estimate_sent', 'approved', 'in_progress', 'ready'];
    if (!VALID.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID.join(', ')}` });
    }

    const now = new Date().toISOString();
    const result = await req.db.collection(COLL).findOneAndUpdate(
      { ro_number: req.params.id },
      { $set: { kanban_status: status, updatedAt: now } },
      { returnDocument: 'after' }
    );

    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(normalizeRO(result));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Normalizer: wrenchiq_ro (snake_case) → Kanban screen (camelCase) ─────────
function normalizeRO(doc) {
  const jobs = doc.repair_jobs || [];
  const services = jobs.map(j => ({
    name:      j.description || j.repair_job || '',
    laborHrs:  j.labor_hours || 0,
    actualHrs: j.actual_labor_hours || 0,
    partsCost: (j.parts || []).reduce((s, p) => s + (p.line_cost || 0), 0),
    laborCost: j.line_cost || 0,
    status:    'in_progress',
  }));

  const ltt = doc.labor_time_tracking || {};

  return {
    id:           doc.ro_number,
    customerId:   doc.customer?.id,
    vehicleId:    doc.vehicle?.vin,

    status:        doc.kanban_status || 'checked_in',
    workflowStatus: doc.status || 'open',

    _customer: {
      id:        doc.customer?.id,
      firstName: (doc.customer?.name || '').split(' ')[0],
      lastName:  (doc.customer?.name || '').split(' ').slice(1).join(' '),
      phone:     doc.customer?.phone,
      email:     doc.customer?.email,
    },
    _vehicle: {
      id:      doc.vehicle?.vin,
      vin:     doc.vehicle?.vin,
      year:    doc.vehicle?.year,
      make:    doc.vehicle?.make,
      model:   doc.vehicle?.model,
      trim:    doc.vehicle?.trim,
      color:   doc.vehicle?.color,
      mileage: doc.vehicle?.odometer,
    },

    bay:          doc.bay,
    techId:       doc.tech?.id,
    techName:     doc.tech?.name,
    advisorId:    doc.advisor?.id,
    advisorName:  doc.advisor?.name,
    dateIn:       doc.date_in,
    promisedDate: doc.date_out,

    serviceType:   doc.service_category,
    vehicleOrigin: doc.vehicle_origin,
    services,

    totalEstimate: doc.invoice || 0,
    totalLabor:    ltt.elr ? ltt.totalActualHrs * ltt.elr : 0,
    totalParts:    0,

    progress:          doc.progress || 0,
    effectiveLaborRate: ltt.elr || 0,
    totalActualHrs:    ltt.totalActualHrs || 0,
    totalFlaggedHrs:   ltt.totalFlatHrs || 0,

    aiInsights: [],
    dtcs:       (doc.ro_metadata?.codes || []),
  };
}

export default router;
