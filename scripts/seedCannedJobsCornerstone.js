/**
 * WrenchIQ — Seed the Cornerstone canned-job catalog
 *
 * V5 feedback (A1): Predii Learn should surface the shop's canned jobs —
 * each with a labor price for the line item and the parts included in the
 * package, with their pricing. Real MongoDB data, not a UI fixture: this
 * seeds one catalog document into the same `RepairOrder` collection
 * cornerstone's story ROs live in, tagged `isCannedJobCatalog: true` /
 * `isStoryRO: false` so the Kanban/story routes (which filter
 * { isStoryRO: true }) are unaffected — only the new
 * GET /api/canned-jobs/:shopId route reads this document.
 *
 * Usage:
 *   node scripts/seedCannedJobsCornerstone.js
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';

const SHOP_ID    = 'cornerstone';
const LABOR_RATE = 195; // cornerstone's posted labor rate — see migrateLoc001ToCornerstone.js / ingestRoNerDemoCornerstone.js

const laborCost = (hrs) => Math.round(hrs * LABOR_RATE * 100) / 100;

// Straight from the V5 feedback doc's example list, grouped the same way.
const CANNED_JOBS = [
  // ── Routine Maintenance ───────────────────────────────────────────────────
  { category: 'Routine Maintenance', description: 'Oil and Filter Change', laborHours: 0.5,
    parts: [{ description: 'Full Synthetic Oil + OEM Filter Kit', lineCost: 52 }] },
  { category: 'Routine Maintenance', description: 'Tire Rotation and Balance', laborHours: 0.5,
    parts: [{ description: 'Wheel Weights (set)', lineCost: 6 }] },
  { category: 'Routine Maintenance', description: 'Cabin and Engine Air Filter Replacement', laborHours: 0.4,
    parts: [
      { description: 'Cabin Air Filter', lineCost: 26 },
      { description: 'Engine Air Filter', lineCost: 22 },
    ] },
  { category: 'Routine Maintenance', description: 'Spark Plug Replacement', laborHours: 1.0,
    parts: [{ description: 'Iridium Spark Plugs (set of 4)', lineCost: 72 }] },
  { category: 'Routine Maintenance', description: 'State Safety and Emissions Inspection', laborHours: 0.5,
    parts: [{ description: 'State Inspection Fee', lineCost: 45 }] },

  // ── Brake and Suspension Services ─────────────────────────────────────────
  { category: 'Brake and Suspension Services', description: 'Front or Rear Brake Pad and Rotor Replacement', laborHours: 1.4,
    parts: [
      { description: 'Brake Pads (axle set)', lineCost: 68.5 },
      { description: 'Brake Rotors (pair)', lineCost: 110 },
    ] },
  { category: 'Brake and Suspension Services', description: 'Brake Fluid Flush', laborHours: 0.5,
    parts: [{ description: 'DOT 4 Brake Fluid', lineCost: 18 }] },
  { category: 'Brake and Suspension Services', description: 'Wheel Alignment', laborHours: 1.0,
    parts: [] },

  // ── Fluid and System Services ──────────────────────────────────────────────
  { category: 'Fluid and System Services', description: 'Coolant Flush and Replacement', laborHours: 0.8,
    parts: [{ description: 'Coolant (OEM-spec)', lineCost: 34 }] },
  { category: 'Fluid and System Services', description: 'Transmission Fluid Service', laborHours: 1.0,
    parts: [{ description: 'Transmission Fluid (OEM-spec)', lineCost: 58 }] },
  { category: 'Fluid and System Services', description: 'A/C System Recharge and Performance Inspection', laborHours: 0.8,
    parts: [{ description: 'R-134a Refrigerant', lineCost: 68 }] },
  { category: 'Fluid and System Services', description: 'Battery Replacement and Terminal Service', laborHours: 0.5,
    parts: [
      { description: 'Battery', lineCost: 145 },
      { description: 'Terminal Cleaning Kit', lineCost: 8 },
    ] },
].map((job) => ({
  ...job,
  laborCost: laborCost(job.laborHours),
  totalPrice: laborCost(job.laborHours) + job.parts.reduce((s, p) => s + p.lineCost, 0),
  status: 'canned',
}));

async function main() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const coll = db.collection(COLLECTION);

  const doc = {
    id: 'cornerstone-canned-jobs',
    roNumber: 'CANNED-JOBS-CORNERSTONE',
    shopId: SHOP_ID,
    shop: { id: SHOP_ID, name: 'Cornerstone Auto Group', laborRate: LABOR_RATE },
    isCannedJobCatalog: true,
    isStoryRO: false,
    repairJobs: CANNED_JOBS,
    updatedAt: new Date().toISOString(),
  };

  await coll.updateOne(
    { shopId: SHOP_ID, isCannedJobCatalog: true },
    { $set: doc },
    { upsert: true }
  );

  console.log(`Seeded ${CANNED_JOBS.length} canned jobs for shopId=${SHOP_ID} in ${COLLECTION}.`);
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
