/**
 * WrenchIQ — Ingest ro-ner-demo's synthetic Cornerstone corpus into MongoDB
 *
 * Reads /opt/predii/ro-ner-demo/datasources/cornerstone/{repair_orders,
 * customers, vehicles}.jsonl (a Faker-generated, ~1-year, 4-bay-shop corpus
 * built for NER benchmarking — see ro-ner-demo/build_shop_synthetic.py) and
 * transforms + bulk-inserts all ~1,854 ROs into WrenchIQ's `RepairOrder`
 * Mongo collection under shopId 'cornerstone', normalized to the same
 * nested schema (customer{id,name}, vehicle{}, repairJobs[], shop{}) used
 * by cornerstone's story ROs and the loc-001 migration.
 *
 * Tagged isStoryRO: false so the main demo Kanban/story routes (which
 * filter { isStoryRO: true }) are completely unaffected — only broad
 * shop.id-scoped features (Trust Engine, Customer Connection Dashboard)
 * see this data.
 *
 * Known data-shape limitations, not papered over:
 *   - No per-job labor hours in the source corpus (only RO-level
 *     labor_revenue $) — repairJobs[].laborHours/actualLaborHours are 0.
 *   - No advisor field in the source corpus — advisor.id/name are null.
 *   - No declined-service data in the source corpus — declinedServices: [].
 *
 * Usage:
 *   node scripts/ingestRoNerDemoCornerstone.js            # run ingestion
 *   node scripts/ingestRoNerDemoCornerstone.js --dry-run  # preview only
 */

import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import { vehicleOrigin } from './lib/vehicleNormalizer.js';

for (const f of ['.env.local', '.env']) {
  if (existsSync(f)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('=');
      if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  }
}

const DRY_RUN = process.argv.includes('--dry-run');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';

const SRC_DIR   = '/opt/predii/ro-ner-demo/datasources/cornerstone';
const ROS_PATH  = `${SRC_DIR}/repair_orders.jsonl`;
const CUST_PATH = `${SRC_DIR}/customers.jsonl`;
const VEH_PATH  = `${SRC_DIR}/vehicles.jsonl`;
const SHOP_PATH = `${SRC_DIR}/shop.json`;

function readJsonl(path) {
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter(l => l.trim())
    .map(l => JSON.parse(l));
}

function titleCase(s) {
  return (s || '').replace(/\b\w/g, c => c.toUpperCase());
}

function bayNumber(bayId) {
  const m = /BAY-(\d+)/.exec(bayId || '');
  return m ? Number(m[1]) : null;
}

function transform(ro, customersById, vehiclesById, techNameById) {
  const customer = customersById.get(ro.customer_id) || {};
  const vehicle   = vehiclesById.get(ro.vehicle_id) || {};
  const make      = titleCase(vehicle.make);
  const model     = titleCase(vehicle.model);

  // One repairJobs[] entry per distinct job — not joined into a single
  // run-on string. labor_revenue (the only $ figure this corpus carries,
  // no per-job breakdown) is split evenly across the jobs; all parts
  // attach to the first job only, since the source has no per-job part
  // attribution either and splitting parts too would double-count revenue.
  // ~65% of ROs have no repair_jobs list at all — real (not fabricated)
  // shop-note text, but raw and lowercase, so title-cased and cut to the
  // first clause (~60 chars at a word boundary) instead of a 120-char
  // run-on fragment that reads like a disclaimer rather than a job name.
  const jobNames = (ro.repair_jobs && ro.repair_jobs.length)
    ? ro.repair_jobs
    : [titleCase((ro.notes || '').slice(0, 60).replace(/\s+\S*$/, ''))];
  const laborPerJob = Math.round(((ro.labor_revenue || 0) / jobNames.length) * 100) / 100;

  return {
    id:              ro.ro_id,
    roNumber:        ro.ro_id,
    shopId:          'cornerstone',
    shop:            { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id:    ro.customer_id,
      name:  customer.name || 'Unknown Customer',
      phone: customer.phone || null,
      email: customer.email || null,
    },
    vehicle: {
      vin:      vehicle.vin || null,
      year:     vehicle.year || null,
      make,
      model,
      odometer: ro.odometer || null,
    },
    vehicleOrigin:   vehicleOrigin(make),
    serviceCategory: ro.repair_category || '',
    kanbanStatus:    'ready',
    status:          ro.status === 'completed' ? 'closed' : ro.status,
    dateIn:          ro.check_in_ts,
    dateOut:         ro.completed_ts,
    bay:             bayNumber(ro.bay_id),
    tech:            { id: ro.tech_id, name: techNameById.get(ro.tech_id) || null },
    // No advisor field exists in this corpus — null, not fabricated.
    advisor:         { id: null, name: null },
    customerConcern: (ro.symptoms || []).join('; '),
    dtcs:            ro.codes || [],
    repairJobs: jobNames.map((name, i) => ({
      description:      name,
      // No per-job hours in this corpus, only RO-level $ revenue.
      laborHours:       0,
      actualLaborHours: 0,
      lineCost:         laborPerJob,
      parts: i === 0
        ? (ro.parts || []).map(p => ({
            description: p.name,
            lineCost:    Math.round((p.unit_price || 0) * (p.qty || 1) * 100) / 100,
          }))
        : [],
      status: 'completed',
    })),
    declinedServices: [],
    invoice:          ro.invoice_total || 0,
    progress:         100,
    laborTimeTracking: { totalFlatHrs: 0, totalActualHrs: 0, elr: 0, postedRate: 175 },
    aiInsights: [], agenticUpsells: [], agenticCustomerText: null, agenticTextStatus: null,
    threeCScore: null, threeCConcern: '', threeCDiagnosis: '', threeCCorrection: '', threeCRewriteSuggestion: null,
    isHistorical: true,
    isStoryRO:    false,
    source:       'ro-ner-demo-synthetic-corpus',
    ingestedAt:   new Date().toISOString(),
  };
}

async function main() {
  console.log(`Reading source corpus from ${SRC_DIR}`);
  const ros       = readJsonl(ROS_PATH);
  const customers = readJsonl(CUST_PATH);
  const vehicles  = readJsonl(VEH_PATH);
  const shop      = JSON.parse(readFileSync(SHOP_PATH, 'utf8'));

  const customersById = new Map(customers.map(c => [c.customer_id, c]));
  const vehiclesById  = new Map(vehicles.map(v => [v.vehicle_id, v]));
  const techNameById  = new Map(shop.technicians.map(t => [t.tech_id, t.name]));

  console.log(`Loaded ${ros.length} ROs, ${customers.length} customers, ${vehicles.length} vehicles.`);

  const docs = ros.map(ro => transform(ro, customersById, vehiclesById, techNameById));

  console.log(`Connecting to MongoDB: ${MONGODB_URI}${DRY_RUN ? ' (DRY RUN)' : ''}`);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db   = client.db(DB_NAME);
    const coll = db.collection(COLLECTION);

    if (DRY_RUN) {
      console.log('Sample transformed doc:');
      console.log(JSON.stringify(docs[0], null, 2));
      console.log(`Would insert ${docs.length} docs. Re-run without --dry-run to apply.`);
      return;
    }

    const BATCH = 500;
    let inserted = 0;
    for (let i = 0; i < docs.length; i += BATCH) {
      const batch = docs.slice(i, i + BATCH);
      const result = await coll.insertMany(batch, { ordered: false });
      inserted += result.insertedCount;
      console.log(`  Inserted ${inserted}/${docs.length}...`);
    }

    console.log(`Done. Inserted ${inserted} ROs from the ro-ner-demo synthetic corpus.`);
    const total = await coll.countDocuments({ shopId: 'cornerstone' });
    console.log(`cornerstone now has ${total} ROs total.`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});
