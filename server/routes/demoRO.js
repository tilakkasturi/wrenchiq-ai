/**
 * WrenchIQ — Demo RO Route
 *
 * GET /api/demo/ros
 *
 * Returns 3 real ROs from wrenchiq_ro, purpose-selected for the Job demo screens:
 *   job1 — open RO with diagnostic/multi-service work (Job 1: Intake & Diagnosis)
 *   job2 — closed RO with repair work (Job 2: 3C Compliance — raw description as poor tech notes)
 *   job3 — open RO with oil change as first service (Job 3: Smart Upsell)
 *
 * Schema note: wrenchiq_ro has no complaint/vin/tech_notes fields.
 * Customer concern and tech notes are derived from repair_jobs[].description.
 */

import { Router } from 'express';

const router = Router();
const COLL   = 'wrenchiq_ro';

// ── Revenue helper ────────────────────────────────────────────────────────────
function calcRevenue(repair_jobs = []) {
  return repair_jobs.reduce((sum, job) => {
    const laborCost  = job.labor_cost || (job.labor_hours || 0) * 175;
    const partsCost  = (job.parts || []).reduce((s, p) =>
      s + (p.unit_price || 0) * (p.quantity || 1), 0);
    return sum + laborCost + partsCost;
  }, 0);
}

// ── Normalize a raw wrenchiq_ro doc into demo-friendly shape ──────────────────
function normalize(doc, role) {
  if (!doc) return null;

  const jobs = (doc.repair_jobs || []).map(j => ({
    name:      j.repair_job || j.description || 'Service',
    desc:      j.description || '',
    laborHrs:  j.labor_hours || 0,
    laborCost: Math.round((j.labor_cost || (j.labor_hours || 0) * (doc.shop?.labor_rate || 175)) * 100) / 100,
    parts:     (j.parts || []).map(p => ({
      name:  p.description || p.repair_parts || 'Part',
      price: p.unit_price || 0,
      qty:   p.quantity || 1,
    })),
    totalCost: Math.round((
      (j.labor_cost || (j.labor_hours || 0) * (doc.shop?.labor_rate || 175)) +
      (j.parts || []).reduce((s, p) => s + (p.unit_price || 0) * (p.quantity || 1), 0)
    ) * 100) / 100,
  }));

  return {
    roNumber:    doc.ro_number,
    status:      doc.status,
    dateIn:      doc.date_in,
    customer: {
      name:    doc.customer?.name  || 'Customer',
      phone:   doc.customer?.phone || '',
      email:   doc.customer?.email || '',
    },
    vehicle: {
      year:     doc.vehicle?.year  || '',
      make:     doc.vehicle?.make  || '',
      model:    doc.vehicle?.model || '',
      odometer: doc.vehicle?.odometer || 0,
      origin:   doc.vehicle_origin || doc.vehicle?.vcdb?.vehicle_origin || '',
    },
    tech: {
      name: doc.tech?.name    || 'Technician',
      id:   doc.tech?.id      || '',
    },
    advisor: {
      name: doc.advisor?.name || 'Advisor',
    },
    shop: {
      name:      doc.shop?.name       || '',
      laborRate: doc.shop?.labor_rate || 175,
    },
    jobs,
    totalRevenue: Math.round(calcRevenue(doc.repair_jobs) * 100) / 100,
    // Derived fields for demo screens
    concern: jobs[0]?.desc || `${jobs.map(j => j.name).join(', ')}`,
    techNotes: jobs.map(j => j.desc).filter(Boolean).join('\n') ||
               jobs.map(j => j.name).join(' / '),
    serviceCategory: doc.service_category || '',
  };
}

// ── GET /api/demo/ros ─────────────────────────────────────────────────────────
router.get('/ros', async (req, res) => {
  const db = req.db;
  if (!db) return res.status(503).json({ error: 'Database not connected' });

  try {
    const [job1doc, job2doc, job3doc] = await Promise.all([

      // Job 1: open RO with meaningful repair work (prefer diagnostic / multi-job)
      db.collection(COLL).findOne(
        {
          status: 'open',
          job_count: { $gte: 2 },
          'vehicle.make': { $exists: true },
          'customer.name': { $exists: true },
        },
        { sort: { date_in: -1 } }
      ),

      // Job 2: closed RO with brake or diagnostic work — use description as "poor tech notes"
      db.collection(COLL).findOne(
        {
          status: 'closed',
          'repair_jobs.repair_job': { $regex: /brake|diagnos|check engine|transmission|engine/i },
          'vehicle.make': { $exists: true },
          'customer.name': { $exists: true },
        },
        { sort: { date_in: -1 } }
      ),

      // Job 3: open RO with oil change as first service (prime upsell scenario)
      db.collection(COLL).findOne(
        {
          status: 'open',
          'repair_jobs.repair_job': { $regex: /oil/i },
          'vehicle.make': { $exists: true },
          'customer.name': { $exists: true },
        },
        { sort: { 'vehicle.odometer': -1 } }  // highest mileage = best upsell story
      ),
    ]);

    res.json({
      job1: normalize(job1doc, 'job1'),
      job2: normalize(job2doc, 'job2'),
      job3: normalize(job3doc, 'job3'),
    });
  } catch (err) {
    console.error('[demoRO] error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;
