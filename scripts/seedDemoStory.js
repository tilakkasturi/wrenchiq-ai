/**
 * WrenchIQ — Demo Story Seed Script
 *
 * Seeds exactly 6 story ROs across 2 shops for the April 18, 2026 sales demos.
 *   shopId "cornerstone"  — Taylor Mitchell (GWG / Protractor) demo
 *   shopId "ridgeline"    — Brad Lewis (Mitchell1) demo
 *
 * Usage:
 *   node scripts/seedDemoStory.js              # seeds both shops
 *   node scripts/seedDemoStory.js --shop cornerstone
 *   node scripts/seedDemoStory.js --shop ridgeline
 *   node scripts/seedDemoStory.js --reset      # drop story ROs, reseed both
 *
 * Seeds into collection: RepairOrder (camelCase schema, per project convention)
 */

import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';

// ── Load .env.local ──────────────────────────────────────────────────────────
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

// ── CLI args ─────────────────────────────────────────────────────────────────
const args   = process.argv.slice(2);
const RESET  = args.includes('--reset');
const shopArg = args.indexOf('--shop');
const SHOP_FILTER = shopArg >= 0 ? args[shopArg + 1] : null;  // null = both

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';

// ── Rebase today helper ───────────────────────────────────────────────────────
// Makes RO dates appear as today so "just checked in this morning" is always true
function todayAt(hhmm) {
  const d = new Date();
  const [hh, mm] = hhmm.split(':').map(Number);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}
function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

// ── STORY ROS ─────────────────────────────────────────────────────────────────

const STORY_ROS = [

  // ══════════════════════════════════════════════════════════════════
  //  SHOP: CORNERSTONE — Taylor Mitchell (GWG / Protractor) demo
  // ══════════════════════════════════════════════════════════════════

  // JOB 1 — Elena Vasquez / Highlander — Agentic Moment 1
  // WrenchIQ flags P0420 as O2 sensor (not cat converter) before advisor opens the RO
  {
    roNumber: 'RO-2026-0401',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 175 },
    customer: {
      id: 'cust-001',
      name: 'Elena Vasquez',
      phone: '(817) 555-0201',
      email: 'elena.vasquez@gmail.com',
    },
    vehicle: {
      vin: '5TDGZRBH5LS503482',
      year: 2020,
      make: 'Toyota',
      model: 'Highlander',
      trim: 'XLE 2.5L Hybrid',
      color: 'Midnight Black',
      odometer: 52400,
    },
    vehicleOrigin: 'JAPANESE',
    serviceCategory: 'maintenance',
    kanbanStatus: 'checked_in',
    status: 'open',
    dateIn: todayAt('07:48'),
    dateOut: todayAt('12:00'),
    bay: null,
    tech: { id: null, name: null },
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: '',  // intentionally blank — advisor hasn't typed yet (State 1)
    dtcs: ['P0420'],      // WrenchIQ pulled from vehicle history / OBD pattern
    repairJobs: [
      {
        description: 'Engine Oil & Filter Change (0W-20 Full Synthetic)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [{ description: 'Oil Filter + 6qt 0W-20', lineCost: 52 }],
        status: 'pending',
      },
      {
        description: 'Multi-Point Safety Inspection (56-pt)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [],
        status: 'pending',
      },
    ],
    invoice: 257,
    progress: 0,
    laborTimeTracking: { totalFlatHrs: 1.0, totalActualHrs: 0, elr: 0, postedRate: 175 },

    // Agentic fields
    aiInsights: [
      'PROACTIVE — P0420 pattern detected on 2020 Highlander 2.5L at 52K mi. Likely upstream O2 sensor (not catalytic converter).',
      'TSB-2021-0144: O2 sensor degradation on A25A-FXS 4-cyl — resolves P0420 in 91% of cases at this mileage.',
      'O2 sensor repair: ~$412 estimate (1.2hr labor + part). Cat converter: ~$1,232 estimate. Correct diagnosis saves Elena ~$820.',
      'Pattern match: 847 similar 2020 Highlander ROs in Predii network — 91% resolved with O2 sensor, not cat replacement.',
      'Talk track drafted: "Elena, your check engine light is showing a code we see often on Highlanders at this mileage — almost always the O2 sensor, not the catalytic converter. That\'s a $820 difference."',
    ],
    agenticUpsells: [],
    agenticCustomerText: null,
    agenticTextStatus: null,

    // 3C fields — not started
    threeCScore: null,
    threeCConcern: '',
    threeCDiagnosis: '',
    threeCCorrection: '',
    threeCRewriteSuggestion: null,
  },

  // JOB 3 — Frank Delgado / CR-V — Agentic Moment 2
  // WrenchIQ has already staged upsell talk track and drafted customer approval text
  {
    roNumber: 'RO-2026-0402',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 175 },
    customer: {
      id: 'cust-002',
      name: 'Frank Delgado',
      phone: '(817) 555-0202',
      email: 'frank.delgado@outlook.com',
    },
    vehicle: {
      vin: '2HKRW2H83JH607249',
      year: 2018,
      make: 'Honda',
      model: 'CR-V',
      trim: 'EX-L 1.5T AWD',
      color: 'Lunar Silver',
      odometer: 68200,
    },
    vehicleOrigin: 'JAPANESE',
    serviceCategory: 'brake',
    kanbanStatus: 'checked_in',
    status: 'open',
    dateIn: todayAt('08:15'),
    dateOut: todayAt('14:00'),
    bay: null,
    tech: { id: 'tech-003', name: 'Carlos Mendez' },
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: 'Brakes feel soft, slight squeal on left front when stopping.',
    dtcs: [],
    repairJobs: [
      {
        description: 'Brake System Diagnostic',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [],
        status: 'pending',
      },
      {
        description: 'Front Brake Pads (OEM-spec)',
        laborHours: 1.2,
        actualLaborHours: 0,
        lineCost: 210,
        parts: [{ description: 'Front Brake Pad Set OEM', lineCost: 92 }],
        status: 'pending',
      },
    ],
    invoice: 480,
    progress: 0,
    laborTimeTracking: { totalFlatHrs: 1.7, totalActualHrs: 0, elr: 0, postedRate: 175 },

    // Agentic fields — WrenchIQ pre-staged upsells and customer text
    aiInsights: [
      'PROACTIVE UPSELL — CVT fluid 8K mi overdue + cabin filter 38K mi overdue. Total incremental: ~$343 estimate.',
      'Frank\'s approval rate on maintenance items: 71% over 12 visits. High probability of acceptance.',
      'Draft — review before sending: customer text drafted and ready. Tap "Approve & Send" to deliver to Frank\'s cell.',
      'If Frank declines trans fluid today, flag for next visit — at 75K it becomes a safety conversation.',
    ],
    agenticUpsells: [
      {
        id: 'upsell-001',
        description: 'Transmission Fluid Exchange (CVT)',
        rationale: 'Honda CVT fluid last changed at 36K. Now at 68.2K. Honda interval: 60K. 8,200 miles overdue.',
        laborHrs: 1.0,
        partsCost: 88,
        laborCost: 175,
        addedRevenue: 263,
        status: 'staged',
      },
      {
        id: 'upsell-002',
        description: 'Cabin Air Filter Replacement',
        rationale: 'Last replaced at ~30K per service history. Now at 68.2K — 38K miles on filter.',
        laborHrs: 0.3,
        partsCost: 28,
        laborCost: 52.50,
        addedRevenue: 80.50,
        status: 'staged',
      },
    ],
    // G-4: confidence hedge ("almost always", "pattern suggests")
    // G-5: price labeled as estimate (~$343)
    agenticCustomerText: 'Hi Frank, your CR-V is in for brakes. While we have it in, we\'re seeing a pattern that suggests your CVT fluid is 8K miles past Honda\'s service interval, and your cabin filter is overdue. Both are quick adds — total ~$343 estimate. Want me to include them? — James @ Cornerstone',
    agenticTextStatus: 'staged',

    threeCScore: null,
    threeCConcern: 'Brakes feel soft, slight squeal on left front when stopping.',
    threeCDiagnosis: '',
    threeCCorrection: '',
    threeCRewriteSuggestion: null,
  },

  // JOB 2 — Brenda Okafor / F-150 — 3C Rewrite Demo
  // Marcus Webb wrote a single-line complaint. Score 31/100.
  // WrenchIQ rewrites to 89/100. Demo shows before/after.
  {
    roNumber: 'RO-2026-0403',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 175 },
    customer: {
      id: 'cust-003',
      name: 'Brenda Okafor',
      phone: '(817) 555-0203',
      email: 'brenda.okafor@yahoo.com',
    },
    vehicle: {
      vin: '1FTEW1EG7MFA12847',
      year: 2021,
      make: 'Ford',
      model: 'F-150',
      trim: 'XLT 5.0L V8 4WD',
      color: 'Carbonized Gray',
      odometer: 41000,
    },
    vehicleOrigin: 'DOMESTIC_US',
    serviceCategory: 'other_mechanical',
    kanbanStatus: 'in_progress',
    status: 'open',
    dateIn: todayAt('07:30'),
    dateOut: todayAt('15:00'),
    bay: 3,
    tech: { id: 'tech-001', name: 'Marcus Webb' },  // Location 3 problem child
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: 'Customer states noise.',  // Marcus wrote this — fails 3C at 31/100
    dtcs: [],
    repairJobs: [
      {
        description: 'Engine Noise Diagnostic',
        laborHours: 1.5,
        actualLaborHours: 1.72,
        clockIn: todayAt('07:30'),
        lineCost: 262.50,
        parts: [],
        status: 'in_progress',
      },
      {
        description: 'Oil Pressure Test',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [],
        status: 'pending',
      },
    ],
    invoice: 380,
    progress: 40,
    laborTimeTracking: { totalFlatHrs: 1.5, totalActualHrs: 1.72, elr: 152.91, postedRate: 175 },

    // 3C scoring — Marcus's failure
    threeCScore: 31,
    threeCConcern: 'Customer states noise.',
    threeCDiagnosis: '',
    threeCCorrection: '',

    // WrenchIQ rewrite (staged — advisor must approve)
    threeCRewriteSuggestion: {
      score: 89,
      concern: 'Customer states: intermittent ticking/knocking noise from engine bay, most noticeable on cold start and at idle. Noise persists approximately 2–3 minutes after startup, then diminishes. Has been occurring for approximately 2 weeks. No warning lights. Oil level checked by customer — reported as full.',
      diagnosis: 'Tech to verify: inspect for cam phaser tick per TSB-22-2346 (5.0L Coyote cold-start tick at 40–50K mi). Perform oil pressure test. Check for carbon buildup on intake valves.',
      correction: 'Pending diagnostic completion.',
      status: 'staged',
    },

    aiInsights: [
      '3C ALERT — Complaint quality: 31/100. Single-line complaint fails GWG 3C compliance standard (minimum 75).',
      'TSB-22-2346: Cold-start cam phaser tick on Ford 5.0L Coyote is documented at 40–50K miles. Cite in concern for warranty coverage.',
      'Rewrite drafted — 89/100 score. Click "Apply Rewrite" to replace Marcus\'s narrative before sending to tech.',
      'Marcus Webb\'s 3C avg this month: 34/100. This is the 4th sub-40 complaint from Location 3 this week.',
    ],
    agenticUpsells: [],
    agenticCustomerText: null,
    agenticTextStatus: null,
  },

  // ══════════════════════════════════════════════════════════════════
  //  SHOP: RIDGELINE — Brad Lewis (Mitchell1) demo
  // ══════════════════════════════════════════════════════════════════

  // JOB 1 — Dan Whitfield / RAM 1500 — P0301 pattern
  // Oil change appointment; WrenchIQ flags P0301 misfire on 5.7L HEMI
  {
    roNumber: 'RO-2026-0501',
    shopId: 'ridgeline',
    shop: { id: 'ridgeline', name: 'Ridgeline Auto Service', laborRate: 185 },
    customer: {
      id: 'cust-101',
      name: 'Dan Whitfield',
      phone: '(480) 555-0301',
      email: 'dan.whitfield@gmail.com',
    },
    vehicle: {
      vin: '1C6RR7LT5KS537204',
      year: 2019,
      make: 'Ram',
      model: '1500',
      trim: '5.7L HEMI BigHorn 4WD',
      color: 'Billet Silver',
      odometer: 61800,
    },
    vehicleOrigin: 'DOMESTIC_US',
    serviceCategory: 'maintenance',
    kanbanStatus: 'checked_in',
    status: 'open',
    dateIn: todayAt('07:55'),
    dateOut: todayAt('11:30'),
    bay: null,
    tech: { id: 'tech-201', name: 'Luis Fuentes' },
    advisor: { id: 'adv-201', name: 'Sofia Reyes' },
    customerConcern: 'Scheduled oil change.',
    dtcs: ['P0301'],  // Cylinder 1 misfire — WrenchIQ pattern matches spark plugs + coil pack
    repairJobs: [
      {
        description: 'Engine Oil & Filter Change (5W-20 Full Synthetic — 8qt)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 92.50,
        parts: [{ description: 'Oil Filter + 8qt 5W-20', lineCost: 68 }],
        status: 'pending',
      },
    ],
    invoice: 228,
    progress: 0,
    laborTimeTracking: { totalFlatHrs: 0.5, totalActualHrs: 0, elr: 0, postedRate: 185 },

    aiInsights: [
      'PROACTIVE — P0301 cylinder 1 misfire pattern on 5.7L HEMI at 61K mi. Spark plug degradation, not injector.',
      'TSB-18-065-20: Ram 5.7L spark plug/coil pack pattern at 55–65K mi — 89% resolved with plug set + coil.',
      'Upsell: spark plug set (8) + coil pack for cyl 1 = ~$520 estimate incremental. Talk track drafted.',
      'If misfire ignored: catalytic converter damage within 15K miles (~$1,400+ estimate). Frame as prevention.',
    ],
    agenticUpsells: [
      {
        id: 'upsell-101',
        description: 'Spark Plug Set (8 plugs, Mopar OEM)',
        rationale: '5.7L HEMI spark plug replacement interval is 30K for severe duty. At 61K mi, plugs are past interval. P0301 pattern on this engine is almost always spark plugs at this mileage.',
        laborHrs: 1.5,
        partsCost: 180,
        laborCost: 277.50,
        addedRevenue: 457.50,
        status: 'staged',
      },
      {
        id: 'upsell-102',
        description: 'Coil Pack Replacement (Cylinder 1)',
        rationale: 'P0301 specifically on cyl 1. Coil pack often degrades with spark plug fouling at this mileage.',
        laborHrs: 0.5,
        partsCost: 68,
        laborCost: 92.50,
        addedRevenue: 160.50,
        status: 'staged',
      },
    ],
    // G-4: confidence hedge — "almost always"
    // G-5: ~$520 estimate
    agenticCustomerText: 'Hi Dan, your RAM is in for oil — we\'re also seeing a cylinder 1 misfire code. On your 5.7L HEMI at 62K mi this is almost always spark plugs and a coil pack, ~$520 estimate total. Fixes the misfire and prevents catalytic damage down the road. Want me to add it? — Sofia @ Ridgeline',
    agenticTextStatus: 'staged',

    threeCScore: null,
    threeCConcern: 'Customer scheduled for oil change.',
    threeCDiagnosis: '',
    threeCCorrection: '',
    threeCRewriteSuggestion: null,
  },

  // JOB 2 — Karen Tso / Silverado — 3C Rewrite
  // Sofia wrote "Noise when braking" — fails 3C at 28/100
  {
    roNumber: 'RO-2026-0502',
    shopId: 'ridgeline',
    shop: { id: 'ridgeline', name: 'Ridgeline Auto Service', laborRate: 185 },
    customer: {
      id: 'cust-102',
      name: 'Karen Tso',
      phone: '(480) 555-0302',
      email: 'karen.tso@gmail.com',
    },
    vehicle: {
      vin: '1GCPACED8NZ143872',
      year: 2022,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LT 5.3L V8 4WD',
      color: 'Summit White',
      odometer: 38400,
    },
    vehicleOrigin: 'DOMESTIC_US',
    serviceCategory: 'brake',
    kanbanStatus: 'inspecting',
    status: 'open',
    dateIn: todayAt('08:30'),
    dateOut: todayAt('13:00'),
    bay: 2,
    tech: { id: 'tech-201', name: 'Luis Fuentes' },
    advisor: { id: 'adv-201', name: 'Sofia Reyes' },
    customerConcern: 'Noise when braking.',  // Sofia wrote this — fails 3C at 28/100
    dtcs: [],
    repairJobs: [
      {
        description: 'Brake System Inspection',
        laborHours: 0.7,
        actualLaborHours: 0.4,
        clockIn: todayAt('08:35'),
        lineCost: 129.50,
        parts: [],
        status: 'in_progress',
      },
    ],
    invoice: 130,
    progress: 25,
    laborTimeTracking: { totalFlatHrs: 0.7, totalActualHrs: 0.4, elr: 0, postedRate: 185 },

    // 3C — Sofia's single-line complaint
    threeCScore: 28,
    threeCConcern: 'Noise when braking.',
    threeCDiagnosis: '',
    threeCCorrection: '',

    threeCRewriteSuggestion: {
      score: 86,
      concern: 'Customer states: high-pitched squealing noise from front brakes when slowing from highway speeds. Occurs most on first application of brakes in the morning. Has been present for approximately 3 weeks. No grinding. No pull. Brake warning light not illuminated.',
      diagnosis: 'Tech to inspect: front brake pad thickness, rotor surface condition, caliper slide pins for sticking. Check for glazed pads (common on LT trucks with infrequent highway braking pattern).',
      correction: 'Pending diagnostic completion.',
      status: 'staged',
    },

    aiInsights: [
      '3C ALERT — Complaint quality: 28/100. "Noise when braking" fails minimum documentation standard.',
      'WrenchIQ rewrite: 86/100 — captures onset, frequency, brake conditions, and absence of grinding.',
      'Pattern: glazed front pads on 2022 Silverado LT at 35–42K mi with highway use — confirm at inspection.',
      'Sofia\'s 3C avg this month: 61/100. Coaching opportunity: condition capture specificity.',
    ],
    agenticUpsells: [],
    agenticCustomerText: null,
    agenticTextStatus: null,
  },

  // JOB 3 — Marco Esposito / F-150 EcoBoost — Timing chain high-value
  // Estimate already sent. High-value job with strong approval probability.
  {
    roNumber: 'RO-2026-0503',
    shopId: 'ridgeline',
    shop: { id: 'ridgeline', name: 'Ridgeline Auto Service', laborRate: 185 },
    customer: {
      id: 'cust-103',
      name: 'Marco Esposito',
      phone: '(480) 555-0303',
      email: 'marco.esposito@gmail.com',
    },
    vehicle: {
      vin: '1FTEX1EP9HFA74302',
      year: 2017,
      make: 'Ford',
      model: 'F-150',
      trim: 'XLT 3.5L EcoBoost 4WD',
      color: 'Magnetic Gray',
      odometer: 84200,
    },
    vehicleOrigin: 'DOMESTIC_US',
    serviceCategory: 'other_mechanical',
    kanbanStatus: 'estimate_sent',
    status: 'open',
    dateIn: todayAt('07:15'),
    dateOut: todayAt('17:00'),
    bay: 4,
    tech: { id: 'tech-201', name: 'Luis Fuentes' },
    advisor: { id: 'adv-201', name: 'Sofia Reyes' },
    customerConcern: 'Rattling noise on cold start, lasts about 30 seconds.',
    dtcs: [],
    repairJobs: [
      {
        description: 'Timing Chain Set + Guides + Tensioners (3.5L EcoBoost)',
        laborHours: 8.5,
        actualLaborHours: 0,
        lineCost: 1572.50,
        parts: [
          { description: 'Timing Chain Kit (OEM Ford)', lineCost: 420 },
          { description: 'Timing Chain Guides (set)', lineCost: 180 },
          { description: 'Tensioners (x2)', lineCost: 120 },
        ],
        status: 'approved',
      },
    ],
    invoice: 1847,
    totalEstimate: 1847,
    progress: 15,
    laborTimeTracking: { totalFlatHrs: 8.5, totalActualHrs: 1.2, elr: 185, postedRate: 185 },

    aiInsights: [
      'TSB-17-0144: 3.5L EcoBoost timing chain stretch at 75–90K mi — cold-start rattle confirms pattern.',
      'Repair: timing chain set + guides + tensioners. Labor: 8.5hr. Parts: ~$620–$780. Total: ~$1,760–$1,965 estimate.',
      'High-value job (~$1,847 estimate). Marco\'s approval rate on prior high-value estimates: 83%. High probability.',
      'Authorization required before teardown — get written approval. Cite TSB-17-0144 for customer confidence.',
    ],
    agenticUpsells: [
      {
        id: 'upsell-103',
        description: 'Water Pump Replacement (preventive)',
        rationale: 'Water pump accessed during timing chain service. Add-on cost minimal vs. standalone later (~$480 labor savings). Pattern suggests failure on 3.5L EcoBoost at 90–110K mi.',
        laborHrs: 0.5,
        partsCost: 140,
        laborCost: 92.50,
        addedRevenue: 232.50,
        status: 'staged',
      },
    ],
    agenticCustomerText: null,
    agenticTextStatus: null,

    threeCScore: 72,
    threeCConcern: 'Customer states rattling noise on cold start, lasts about 30 seconds.',
    threeCDiagnosis: 'DTC: none. Tech inspected timing system — confirmed timing chain stretch per TSB-17-0144 (3.5L EcoBoost pattern at 75–90K mi).',
    threeCCorrection: 'Pending customer authorization for timing chain set + guides + tensioners.',
    threeCRewriteSuggestion: null,
  },
];

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI}`);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db   = client.db(DB_NAME);
    const coll = db.collection(COLLECTION);

    // Filter to requested shop(s)
    const roNumbers = STORY_ROS
      .filter(ro => !SHOP_FILTER || ro.shopId === SHOP_FILTER)
      .map(ro => ro.roNumber);

    if (roNumbers.length === 0) {
      console.error(`Unknown shop filter: "${SHOP_FILTER}". Use "cornerstone" or "ridgeline".`);
      process.exit(1);
    }

    if (RESET) {
      const result = await coll.deleteMany({ roNumber: { $in: roNumbers } });
      console.log(`Reset: deleted ${result.deletedCount} story ROs`);
    }

    // Upsert all matching ROs
    const rosToSeed = STORY_ROS.filter(ro => !SHOP_FILTER || ro.shopId === SHOP_FILTER);
    let inserted = 0;
    let updated  = 0;

    for (const ro of rosToSeed) {
      const doc = {
        ...ro,
        // id field required by unique index (same as roNumber for story ROs)
        id: ro.roNumber,
        // Rebase dates to today every time we seed
        dateIn:  todayAt(new Date(ro.dateIn).toTimeString().slice(0, 5)),
        dateOut: todayAt(new Date(ro.dateOut).toTimeString().slice(0, 5)),
        seededAt: new Date().toISOString(),
        isStoryRO: true,  // marker so demo route can filter by this
      };

      const result = await coll.replaceOne(
        { roNumber: ro.roNumber },
        doc,
        { upsert: true }
      );

      if (result.upsertedCount > 0) inserted++;
      else updated++;

      console.log(`  ${result.upsertedCount > 0 ? 'INSERT' : 'UPDATE'} ${ro.roNumber}  ${ro.customer.name}  (${ro.shopId})`);
    }

    console.log(`\nDone. ${inserted} inserted, ${updated} updated.`);
    console.log(`\nVerification:`);
    console.log(`  GET /api/repair-orders/demo?shopId=cornerstone`);
    console.log(`  GET /api/repair-orders/demo?shopId=ridgeline`);
    console.log(`  GET /api/repair-orders/story-ro/RO-2026-0401`);

  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
