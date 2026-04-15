/**
 * WrenchIQ — Repair Order Routes
 *
 * Source collections:
 *   wrenchiq_ro   — snake_case batch seeder ROs (Peninsula Precision demo)
 *   RepairOrder   — camelCase story ROs (April 18 demo: Cornerstone + Ridgeline)
 *
 * GET  /api/repair-orders/demo              10 diverse ROs (generic demo)
 * GET  /api/repair-orders/demo?shopId=X     story ROs for named shop (cornerstone|ridgeline)
 * GET  /api/repair-orders/story-ro/:roId    single story RO with full agentic fields
 * GET  /api/repair-orders/elr-summary       ELR aggregation by tech, vehicle origin, shop
 * GET  /api/repair-orders/:id               single RO (wrenchiq_ro collection)
 * PATCH /api/repair-orders/:id/status       update kanban stage
 * PATCH /api/repair-orders/:id              partial update (agentic text status, 3C fields)
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

// ── Demo board ────────────────────────────────────────────────────────────────
//  Without shopId: returns 10 diverse ROs from wrenchiq_ro (generic Peninsula demo)
//  With ?shopId=cornerstone|ridgeline: returns story ROs from RepairOrder collection
router.get('/demo', async (req, res) => {
  try {
    const db = req.db;
    const { shopId } = req.query;

    // ── Story ROs path (April 18 demo shops) ────────────────────────────────
    if (shopId && (shopId === 'cornerstone' || shopId === 'ridgeline')) {
      const docs = await db.collection('RepairOrder')
        .find({ shopId, isStoryRO: true })
        .sort({ dateIn: 1 })
        .toArray();

      // Rebase dates to today so "just checked in this morning" is always true
      const today = new Date().toISOString().slice(0, 10);
      const rebased = docs.map(doc => {
        const rebase = (iso) => {
          if (!iso) return iso;
          const t = new Date(iso).toTimeString().slice(0, 8);
          return `${today}T${t}`;
        };
        return { ...doc, dateIn: rebase(doc.dateIn), dateOut: rebase(doc.dateOut) };
      });

      return res.json({ count: rebased.length, data: rebased.map(normalizeStoryRO) });
    }

    // ── Generic demo path (Peninsula Precision — wrenchiq_ro collection) ────
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

// ── Story RO — single RO with full agentic fields ──────────────────────────
//  Used by Job 1/2/3 screens to fetch full story data including aiInsights,
//  agenticUpsells, agenticCustomerText, threeCRewriteSuggestion
router.get('/story-ro/:roId', async (req, res) => {
  try {
    const doc = await req.db.collection('RepairOrder').findOne({
      roNumber: req.params.roId,
      isStoryRO: true,
    });
    if (!doc) return res.status(404).json({ error: `Story RO not found: ${req.params.roId}` });
    res.json(normalizeStoryRO(doc));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Partial update for story ROs (agentic text status, 3C apply rewrite) ────
router.patch('/story-ro/:roId', async (req, res) => {
  try {
    const ALLOWED_FIELDS = [
      'agenticTextStatus', 'threeCConcern', 'threeCDiagnosis',
      'threeCCorrection', 'threeCScore', 'kanbanStatus',
    ];
    const update = {};
    for (const f of ALLOWED_FIELDS) {
      if (req.body[f] !== undefined) update[f] = req.body[f];
    }
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields in request body' });
    }
    update.updatedAt = new Date().toISOString();

    const result = await req.db.collection('RepairOrder').findOneAndUpdate(
      { roNumber: req.params.roId, isStoryRO: true },
      { $set: update },
      { returnDocument: 'after' }
    );
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(normalizeStoryRO(result));
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

// ── Normalizer: RepairOrder (camelCase story RO) → UI shape ──────────────────
//  Passes through all agentic fields so UI can consume them directly.
function normalizeStoryRO(doc) {
  const jobs = doc.repairJobs || [];
  const services = jobs.map(j => ({
    name:      j.description || '',
    laborHrs:  j.laborHours || 0,
    actualHrs: j.actualLaborHours || 0,
    partsCost: (j.parts || []).reduce((s, p) => s + (p.lineCost || 0), 0),
    laborCost: j.lineCost || 0,
    status:    j.status || 'pending',
    clockIn:   j.clockIn || null,
  }));

  const ltt = doc.laborTimeTracking || {};

  return {
    // Identity
    id:        doc.roNumber,
    roNumber:  doc.roNumber,
    shopId:    doc.shopId,

    // Status
    status:        doc.kanbanStatus || 'checked_in',
    workflowStatus: doc.status || 'open',
    kanbanStatus:   doc.kanbanStatus || 'checked_in',

    // Customer + vehicle (nested for easy access)
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
    customer: doc.customer,
    vehicle:  doc.vehicle,

    // Assignment
    bay:         doc.bay,
    techId:      doc.tech?.id,
    techName:    doc.tech?.name,
    advisorId:   doc.advisor?.id,
    advisorName: doc.advisor?.name,
    dateIn:      doc.dateIn,
    promisedDate: doc.dateOut,

    // Service summary
    serviceType:    doc.serviceCategory,
    vehicleOrigin:  doc.vehicleOrigin,
    services,
    customerConcern: doc.customerConcern || '',

    // Financials
    totalEstimate: doc.invoice || doc.totalEstimate || 0,
    totalLabor:    ltt.totalActualHrs ? ltt.totalActualHrs * (ltt.elr || 0) : 0,
    totalParts:    0,
    progress:      doc.progress || 0,

    // Labor tracking
    effectiveLaborRate: ltt.elr || 0,
    totalActualHrs:     ltt.totalActualHrs || 0,
    totalFlaggedHrs:    ltt.totalFlatHrs || 0,
    laborTimeTracking:  ltt,

    // ── Agentic fields (passed through in full) ────────────────────────────
    dtcs:                  doc.dtcs || [],
    aiInsights:            doc.aiInsights || [],
    agenticUpsells:        doc.agenticUpsells || [],
    agenticCustomerText:   doc.agenticCustomerText || null,
    agenticTextStatus:     doc.agenticTextStatus || null,

    // 3C fields
    threeCScore:              doc.threeCScore || null,
    threeCConcern:            doc.threeCConcern || '',
    threeCDiagnosis:          doc.threeCDiagnosis || '',
    threeCCorrection:         doc.threeCCorrection || '',
    threeCRewriteSuggestion:  doc.threeCRewriteSuggestion || null,
  };
}

export default router;
