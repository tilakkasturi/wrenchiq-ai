/**
 * WrenchIQ — Fill Cornerstone's seasonal RO gap with NorCal-weighted synthetic ROs
 *
 * The ro-ner-demo corpus ingested by ingestRoNerDemoCornerstone.js is a static
 * ~1-year Faker snapshot that ends around April 2026 — it has no knowledge of
 * "today" and can't grow. As real time has moved past that window, cornerstone
 * has a hard gap: May 2026 onward has ~0 ROs, so Fall never shows up in any
 * trailing-window view.
 *
 * This script backfills that gap (see TARGET_MONTHS below) by sampling real
 * job/pricing templates per serviceCategory from the existing corpus (so the
 * language and $ amounts stay consistent with the rest of cornerstone's data)
 * and reassembling them onto new dates, customers, and vehicles — with the
 * category mix for each month weighted to match real Northern California
 * seasonal repair demand (mild, dry summers → AC/cooling season; wet
 * Oct–Mar winters → brakes/wipers/battery season). See SEASONALITY below.
 *
 * Usage:
 *   node scripts/seedSeasonalGapCornerstone.js            # dry run (prints plan + sample docs)
 *   node scripts/seedSeasonalGapCornerstone.js --apply     # actually insert
 *   node scripts/seedSeasonalGapCornerstone.js --cleanup   # delete any already-inserted
 *                                                            gap-fill RO with a future dateIn
 *
 * IMPORTANT: this script backfills PAST visit history — every generated RO must have
 * dateIn <= the real clock at run time. TARGET_MONTHS below is filtered against
 * `new Date()` for exactly this reason (see the 2026-08 incident: hardcoding months
 * through November assumed "today" would already be past that point by the time this
 * ran; it wasn't, so ~370 customers got a "most recent visit" dated months in the
 * future — surfaced via RO Chat's customer-history summary before anyone caught it).
 */

import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';

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

const APPLY        = process.argv.includes('--apply');
const CLEANUP      = process.argv.includes('--cleanup');
const MONGODB_URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME      = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION   = 'RepairOrder';
const SHOP_ID      = 'cornerstone';
const SOURCE_TAG   = 'seasonal-gap-fill-synthetic';

// ── Target months + volume ────────────────────────────────────────────────
// Continues cornerstone's existing ~100-150/month cadence, with a mild bump
// in peak-driving-season months (pre-summer road trips, back-to-school).
//
// Filtered against the real clock at run time — never generate a month that
// hasn't happened yet. This is what let ~370 customers end up with a "most
// recent visit" dated months in the future (see file header).
const now = new Date();
const ALL_TARGET_MONTHS = [
  { year: 2026, month: 5,  count: 120 }, // May
  { year: 2026, month: 6,  count: 125 }, // Jun
  { year: 2026, month: 7,  count: 120 }, // Jul
  { year: 2026, month: 8,  count: 125 }, // Aug
  { year: 2026, month: 9,  count: 115 }, // Sep
  { year: 2026, month: 10, count: 120 }, // Oct
  { year: 2026, month: 11, count: 115 }, // Nov
];
const TARGET_MONTHS = ALL_TARGET_MONTHS.filter(({ year, month }) =>
  year < now.getFullYear() || (year === now.getFullYear() && month <= now.getMonth() + 1)
);

// ── Northern California seasonality weights per serviceCategory ────────────
// Relative weight by calendar month (1=Jan..12=Dec). Reflects Bay Area
// climate: mild, rarely-freezing winters (wet, Oct-Mar) and dry, warm-to-hot
// summers (Jun-Sep, with September often the hottest "Indian summer" month).
const SEASONALITY = {
  climate_control:   [0.3, 0.3, 0.5, 0.7, 1.1, 1.5, 1.8, 1.9, 1.6, 0.9, 0.4, 0.3],
  cooling_system:    [0.5, 0.5, 0.6, 0.8, 1.0, 1.3, 1.6, 1.7, 1.4, 0.9, 0.6, 0.5],
  battery_starting:  [1.6, 1.3, 0.9, 0.7, 0.6, 0.8, 1.1, 1.3, 1.0, 0.8, 1.0, 1.5],
  brakes:            [1.2, 1.1, 1.0, 0.8, 0.7, 0.7, 0.8, 0.8, 0.9, 1.2, 1.3, 1.3],
  tires_wipers:      [1.2, 1.0, 0.9, 0.8, 1.1, 1.1, 0.8, 0.8, 0.9, 1.4, 1.4, 1.2],
  engine_emissions:  [1.2, 1.1, 1.0, 0.9, 0.9, 0.9, 0.9, 1.1, 1.1, 0.9, 0.9, 0.9],
  general:           [0.9, 0.9, 1.0, 1.0, 1.2, 1.2, 1.0, 1.0, 1.0, 1.0, 1.1, 1.0],
};
const CATEGORIES = Object.keys(SEASONALITY);

function weightedCategoryForMonth(month /* 1-12 */) {
  const idx = month - 1;
  const weights = CATEGORIES.map(c => SEASONALITY[c][idx]);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < CATEGORIES.length; i++) {
    r -= weights[i];
    if (r <= 0) return CATEGORIES[i];
  }
  return CATEGORIES[CATEGORIES.length - 1];
}

// ── Business hours: Mon-Sat 07:00-18:00, closed Sunday (per shop profile) ──
function randomBusinessDateIn(year, month /* 1-12 */) {
  const daysInMonth = new Date(year, month, 0).getDate();
  let day, dow;
  do {
    day = 1 + Math.floor(Math.random() * daysInMonth);
    dow = new Date(year, month - 1, day).getDay(); // 0=Sun
  } while (dow === 0);
  const hour   = 7 + Math.floor(Math.random() * 11); // 7-17
  const minute = Math.floor(Math.random() * 60);
  const second = Math.floor(Math.random() * 60);
  return new Date(year, month - 1, day, hour, minute, second);
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI}${APPLY ? '' : ' (DRY RUN — pass --apply to insert)'}`);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db   = client.db(DB_NAME);
  const coll = db.collection(COLLECTION);

  // ── Remediation for the 2026-08 future-dated-RO incident: delete any
  // already-inserted gap-fill RO whose dateIn is still in the future,
  // regardless of which run created it.
  if (CLEANUP) {
    const result = await coll.deleteMany({
      shopId: SHOP_ID,
      source: SOURCE_TAG,
      dateIn: { $gt: now.toISOString() },
    });
    console.log(`Deleted ${result.deletedCount} future-dated gap-fill RO(s) (dateIn > ${now.toISOString()}).`);
    await client.close();
    return;
  }

  // ── Load templates per category from the existing ro-ner-demo corpus ─────
  const jobTemplatesByCategory = {};
  for (const cat of CATEGORIES) {
    const docs = await coll.aggregate([
      { $match: { shopId: SHOP_ID, serviceCategory: cat, source: 'ro-ner-demo-synthetic-corpus' } },
      { $sample: { size: 150 } },
      { $project: { repairJobs: 1, invoice: 1, dtcs: 1, customerConcern: 1 } },
    ]).toArray();
    jobTemplatesByCategory[cat] = docs;
    console.log(`  template pool: ${cat.padEnd(18)} ${docs.length} docs`);
  }

  // ── Load customer/vehicle pairs to draw from ──────────────────────────────
  const custVehDocs = await coll.aggregate([
    { $match: { shopId: SHOP_ID, 'customer.id': { $exists: true, $ne: null } } },
    { $group: { _id: '$customer.id', customer: { $first: '$customer' }, vehicle: { $first: '$vehicle' }, vehicleOrigin: { $first: '$vehicleOrigin' } } },
    { $sample: { size: 911 } },
  ]).toArray();
  console.log(`  customer/vehicle pool: ${custVehDocs.length}`);

  // ── Techs (from Predii Learn shop profile — Cornerstone has 4 bays, 5 techs)
  const TECHS = [
    { id: 'TECH-1', name: 'Allison Hill' },
    { id: 'TECH-2', name: 'Megan Mcclain' },
    { id: 'TECH-3', name: 'Allen Robinson' },
    { id: 'TECH-4', name: 'Cristian Santos' },
    { id: 'TECH-5', name: 'Kevin Pacheco' },
  ];

  const allDocs = [];
  const summary = {};

  for (const { year, month, count } of TARGET_MONTHS) {
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    summary[monthKey] = {};

    for (let i = 0; i < count; i++) {
      const category = weightedCategoryForMonth(month);
      const pool = jobTemplatesByCategory[category];
      if (!pool || pool.length === 0) continue;
      const template = pick(pool);
      const { customer, vehicle, vehicleOrigin } = pick(custVehDocs);
      const tech = pick(TECHS);

      const dateIn = randomBusinessDateIn(year, month);
      // Safety net for the current month specifically — TARGET_MONTHS already
      // excludes months entirely in the future, but a random day/hour within
      // the current month can still land later today than "now". Skip rather
      // than clamp so this doesn't skew the business-hours distribution.
      if (dateIn.getTime() > now.getTime()) continue;
      const dateOut = new Date(dateIn.getTime() + (20 + Math.floor(Math.random() * 70)) * 60 * 1000);
      // Deterministic, content-derived id (month + index-within-month) rather
      // than "1 + current max in DB" — that scheme produced a fresh, non-
      // colliding roNumber range on every run, so re-running just appended a
      // whole duplicate batch instead of overwriting the same records.
      const roNumber = `RO-GAPFILL-${monthKey}-${String(i).padStart(3, '0')}`;

      allDocs.push({
        id: roNumber,
        roNumber,
        shopId: SHOP_ID,
        shop: { id: SHOP_ID, name: 'Cornerstone Auto Group', laborRate: 195 },
        customer,
        vehicle,
        vehicleOrigin: vehicleOrigin || 'OTHER',
        serviceCategory: category,
        kanbanStatus: 'ready',
        status: 'closed',
        dateIn: dateIn.toISOString(),
        dateOut: dateOut.toISOString(),
        bay: 1 + Math.floor(Math.random() * 4),
        tech,
        advisor: { id: null, name: null },
        customerConcern: template.customerConcern || '',
        dtcs: template.dtcs || [],
        repairJobs: (template.repairJobs || []).map(j => ({ ...j })),
        declinedServices: [],
        invoice: template.invoice || 0,
        progress: 100,
        laborTimeTracking: { totalFlatHrs: 0, totalActualHrs: 0, elr: 0, postedRate: 175 },
        aiInsights: [], agenticUpsells: [], agenticCustomerText: null, agenticTextStatus: null,
        threeCScore: null, threeCConcern: '', threeCDiagnosis: '', threeCCorrection: '', threeCRewriteSuggestion: null,
        isHistorical: true,
        isStoryRO: false,
        source: SOURCE_TAG,
        ingestedAt: new Date().toISOString(),
      });

      summary[monthKey][category] = (summary[monthKey][category] || 0) + 1;
    }
  }

  console.log('\nPlanned inserts by month/category:');
  for (const [monthKey, cats] of Object.entries(summary)) {
    const total = Object.values(cats).reduce((s, n) => s + n, 0);
    console.log(`  ${monthKey}: ${total} total — ${Object.entries(cats).map(([c, n]) => `${c}:${n}`).join(', ')}`);
  }
  console.log(`\nTotal planned: ${allDocs.length}`);

  if (!APPLY) {
    console.log('\nSample doc:');
    console.log(JSON.stringify(allDocs[0], null, 2));
    console.log('\nDry run only — re-run with --apply to insert.');
    await client.close();
    return;
  }

  // Upsert by the deterministic roNumber — re-running the script with the
  // same TARGET_MONTHS always targets the same document identities, so it
  // overwrites/no-ops instead of appending a duplicate batch each time.
  const BATCH = 500;
  let upserted = 0, modified = 0;
  for (let i = 0; i < allDocs.length; i += BATCH) {
    const batch = allDocs.slice(i, i + BATCH);
    const ops = batch.map(doc => ({
      replaceOne: { filter: { roNumber: doc.roNumber }, replacement: doc, upsert: true },
    }));
    const result = await coll.bulkWrite(ops, { ordered: false });
    upserted += result.upsertedCount;
    modified += result.modifiedCount;
    console.log(`  Upserted ${upserted} new, updated ${modified} existing, of ${i + batch.length}/${allDocs.length}...`);
  }

  const total = await coll.countDocuments({ shopId: SHOP_ID });
  console.log(`Done. ${upserted} new, ${modified} updated. cornerstone now has ${total} ROs total.`);
  await client.close();
}

main().catch(err => {
  console.error('Seasonal gap-fill failed:', err);
  process.exit(1);
});
