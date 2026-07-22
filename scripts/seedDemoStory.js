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
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-001',
      name: 'Elena Vasquez',
      phone: '(650) 555-0201',
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
    invoice: 233,
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
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-002',
      name: 'Frank Delgado',
      phone: '(650) 555-0202',
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
    invoice: 398,
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
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-003',
      name: 'Brenda Okafor',
      phone: '(650) 555-0203',
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
    invoice: 351,
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
      concern: 'Customer states: intermittent ticking/knocking noise from engine bay, most noticeable on cold start and at idle. Noise persists approximately 2–3 minutes after startup, then diminishes at operating temperature. Customer reports condition present for approximately 2 weeks. No malfunction indicator lamp (MIL/CEL) illuminated. Customer confirmed oil level at full mark on dipstick prior to visit.',
      diagnosis: 'Diagnostic scan performed — no active or pending DTCs retrieved; MIL not illuminated. Oil pressure test results: 42 PSI at idle, 64 PSI at 2,000 RPM (within OEM specification of 25–65 PSI at idle; no bearing or oil pump concern). Cold-start audible inspection performed per TSB-22-2346 (Ford Motor Company — 5.0L Coyote V8: Variable Cam Timing solenoid cold-start rattle at 40–50K miles). Bank 1 intake VCT solenoid rattle confirmed audibly on two consecutive cold-start cycles at ambient temperature 68°F. Symptom matches TSB-22-2346 criteria at 41,000 miles.',
      correction: 'WORK PERFORMED (per approved estimate): Engine Noise Diagnostic and Oil Pressure Test completed. Oil pressure confirmed within OEM specification (42 PSI at idle). No parts installed at this stage. WORK RECOMMENDED (based on inspection findings): Per TSB-22-2346 diagnosis, recommend replacement of Bank 1 intake Variable Cam Timing (VCT) solenoid — Ford OEM P/N BL3Z-6M280-A, qty 1. Post-repair verification: two cold-start cycles to confirm noise absent before vehicle return. Pending customer authorization.',
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

  // ── RO 4: A/C Failure — Gary Strickland — 2020 BMW X3 sDrive30i ─────────────
  {
    roNumber: 'RO-2026-0404',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-004',
      name: 'Gary Strickland',
      phone: '(650) 555-0204',
      email: 'gstrickland@fwpd.gov',
    },
    vehicle: {
      vin: '5UX43DP04LL839271',
      year: 2020,
      make: 'BMW',
      model: 'X3',
      trim: 'sDrive30i B48 2.0T',
      color: 'Phytonic Blue Metallic',
      odometer: 64100,
    },
    vehicleOrigin: 'GERMAN',
    serviceCategory: 'ac',
    kanbanStatus: 'checked_in',
    status: 'open',
    dateIn: todayAt('08:30'),
    dateOut: todayAt('16:00'),
    bay: null,
    tech: { id: 'tech-003', name: 'Tony Archer' },
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: "A/C blows warm air above 80°F ambient. Compressor clutch cycles on then immediately cuts out.",
    dtcs: ['4B75', '4B73'],
    repairJobs: [
      {
        description: 'A/C System Diagnosis & Pressure Test',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [],
        status: 'pending',
      },
      {
        description: 'Evaporator Outlet Fitting O-Ring Replacement (per TSB 64 13 24)',
        laborHours: 2.5,
        actualLaborHours: 0,
        lineCost: 437.50,
        parts: [
          { description: 'Evaporator Outlet O-Ring Kit — BMW OEM 64-53-6-935-922', lineCost: 24 },
          { description: 'UV Dye Injection Kit', lineCost: 18 },
        ],
        status: 'pending',
      },
      {
        description: 'A/C System Evacuation, Recharge & Performance Test (R-134a, 1.35 lbs)',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [
          { description: 'R-134a Refrigerant 1.35 lbs — BMW OEM 82-29-0-492-065', lineCost: 65 },
        ],
        status: 'pending',
      },
    ],
    invoice: 834,
    progress: 0,
    laborTimeTracking: { totalFlatHrs: 4.1, totalActualHrs: 0, elr: 0, postedRate: 175 },
    aiInsights: [
      "DTCs 4B75 + 4B73 (IHKA module): A/C refrigerant pressure below minimum threshold — both codes confirm low-side pressure fault. Tied directly to TSB 64 13 24 (BMW B48 evaporator outlet O-ring leak, 2018-2022 X3/X1 at 55-75K mi). Gary is at 64.1K — textbook pattern.",
      "Low-side pressure: 15 PSI (spec 28-35 PSI). Compressor is healthy — 4B75/4B73 are pressure switch faults, not compressor faults. Do not misdiagnose.",
      "Gary is platinum loyalty (18 visits, $9.8K LTV). Prefers OEM parts only. Quick upsell: cabin filter 28K miles overdue — $87.",
      "After recharge, clear 4B75 and 4B73, document vent outlet temp (target ≤45°F at 85°F ambient) for the RO correction line.",
    ],
    agenticUpsells: [
      {
        id: 'upsell-004a',
        description: 'Cabin Air Filter Replacement',
        rationale: 'Last replaced at ~36K (28K miles ago). BMW recommends 15K interval. Simple add-on while HVAC system is open.',
        laborHrs: 0.3,
        partsCost: 48,
        laborCost: 52.50,
        addedRevenue: 100.50,
        status: 'staged',
      },
    ],
    agenticCustomerText: "Hi Gary, your X3 A/C is in. Scan pulled codes 4B75 and 4B73 from the IHKA module — both point to low refrigerant pressure. We found a slow leak at the evaporator outlet fitting; BMW issued a TSB on this exact pattern for your engine. Not the compressor. Repair: ~$912, should have you out by 4 PM. Also noticed your cabin filter is 28K past interval — $87 add-on if you'd like. — James @ Cornerstone",
    agenticTextStatus: 'staged',
    threeCScore: null,
    threeCConcern: "Customer states A/C not cooling — blows warm air when ambient temperature exceeds 80°F. Compressor clutch audibly cycles on and immediately cuts out. Condition has worsened progressively over 3 weeks.",
    threeCDiagnosis: "Chassis/HVAC scan retrieved DTCs 4B75 (IHKA — A/C refrigerant pressure switch: signal below minimum threshold) and 4B73 (IHKA — A/C high-pressure switch: signal implausible). Both codes confirm refrigerant charge critically low. Low-side pressure measured: 15 PSI (OEM spec: 28–35 PSI). UV dye injected; leak confirmed at evaporator outlet line fitting. Per TSB 64 13 24 (BMW — B48 engine: A/C evaporator outlet fitting O-ring leak on 2018-2022 X3/X1 at 55–75K mi), DTCs 4B75 and 4B73 are the documented fault signature for this O-ring failure pattern. Compressor tested — cycles normally under adequate pressure, consistent with pressure-cutoff behavior, not compressor failure.",
    threeCCorrection: '',
    threeCRewriteSuggestion: {
      score: 91,
      concern: "Customer states A/C system not cooling — blows warm air when ambient temperature exceeds 80°F. Compressor clutch cycles on then immediately disengages. Customer reports condition has progressively worsened over the past 3 weeks.",
      diagnosis: "HVAC/chassis scan retrieved DTCs 4B75 (IHKA module — A/C refrigerant pressure switch: signal below minimum threshold) and 4B73 (IHKA module — A/C high-pressure switch: signal implausible). Both codes indicate refrigerant charge critically depleted. Low-side pressure measured at 15 PSI (OEM specification: 28–35 PSI). Per TSB 64 13 24 (BMW — B48 2.0T engine: evaporator outlet fitting O-ring leak confirmed on 2018-2022 X3 and X1 models at 55,000–75,000 miles), DTCs 4B75 and 4B73 are the documented fault code signature for evaporator outlet O-ring failure at this mileage. UV dye injection confirmed leak source at evaporator outlet line fitting. Compressor integrity verified — cycling behavior is pressure-switch-driven cutoff, not mechanical failure.",
      correction: "WORK PERFORMED (per approved estimate): A/C system diagnosis completed. Full HVAC scan performed; DTCs 4B75 and 4B73 retrieved and documented. Low-side pressure test and UV dye inspection completed. No parts installed at this stage. WORK RECOMMENDED (based on inspection findings per TSB 64 13 24): Replace evaporator outlet O-ring kit — BMW OEM P/N 64-53-6-935-922, qty 1. Recharge system with R-134a refrigerant — BMW OEM P/N 82-29-0-492-065, 1.35 lbs. Post-repair: clear DTCs 4B75 and 4B73, verify low-side pressure within spec (28–35 PSI), document vent outlet temperature (target ≤45°F at 85°F ambient). Pending customer authorization.",
      status: 'staged',
    },
  },

  // ── RO 5: Rear Brake Grinding — Denise Howell — 2018 Subaru Outback 2.5i ───
  {
    roNumber: 'RO-2026-0405',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-005',
      name: 'Denise Howell',
      phone: '(408) 555-0205',
      email: 'd.howell@tarrant.edu',
    },
    vehicle: {
      vin: '4S4BSACC5J3308906',
      year: 2018,
      make: 'Subaru',
      model: 'Outback',
      trim: '2.5i Premium FB25',
      color: 'Wilderness Green Metallic',
      odometer: 92300,
    },
    vehicleOrigin: 'JAPANESE',
    serviceCategory: 'brake',
    kanbanStatus: 'in_progress',
    status: 'open',
    dateIn: todayAt('07:30'),
    dateOut: todayAt('13:00'),
    bay: 4,
    tech: { id: 'tech-002', name: 'DeShawn Carter' },
    advisor: { id: 'adv-002', name: 'Dave Kowalski' },
    customerConcern: "Grinding noise from rear brakes when stopping. Pedal feels spongy at low speed.",
    dtcs: [],
    repairJobs: [
      {
        description: 'Brake System Diagnostic & Road Test',
        laborHours: 0.5,
        actualLaborHours: 0.52,
        clockIn: todayAt('07:30'),
        clockOut: todayAt('08:01'),
        lineCost: 87.50,
        parts: [],
        status: 'complete',
      },
      {
        description: 'Rear Brake Pad Replacement — Akebono OE-spec (per TSB 05-187-20R)',
        laborHours: 1.5,
        actualLaborHours: 0.9,
        clockIn: todayAt('08:05'),
        lineCost: 262.50,
        parts: [
          { description: 'Rear Brake Pads Akebono Pro-ACT ACT1087', lineCost: 89 },
        ],
        status: 'in_progress',
      },
      {
        description: 'Rear Brake Rotor Replacement x2 (heat-cracked, non-resurfaceable)',
        laborHours: 0,
        actualLaborHours: 0,
        lineCost: 0,
        parts: [
          { description: 'Rear Rotor LH Brembo OE 26700AJ070', lineCost: 89 },
          { description: 'Rear Rotor RH Brembo OE 26700AJ080', lineCost: 89 },
        ],
        status: 'in_progress',
      },
      {
        description: 'Brake Fluid Flush — DOT 3 (4.1% moisture content)',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [
          { description: 'Brake Fluid DOT 3 1qt SOA868V9210', lineCost: 22 },
        ],
        status: 'pending',
      },
    ],
    invoice: 805,
    progress: 35,
    laborTimeTracking: { totalFlatHrs: 2.8, totalActualHrs: 1.42, elr: 154.23, postedRate: 175 },
    aiInsights: [
      "TSB 05-187-20R: Subaru FB25 rear brake premature wear (2015-2020 Outback/Legacy) — subframe flex accelerates pad contact angle at 90K+. Cite in 3C correction for warranty/documentation.",
      "Rear pads at 1mm — metal-on-metal. Rotors heat-cracked and blued. Replace, do not resurface.",
      "Brake fluid moisture: 4.1% (shop threshold: 3%). Document moisture reading in 3C correction line.",
      "Denise is budget-conscious. Frame as safety: grinding brakes on a 92K Subaru are a liability. She approves safety items.",
    ],
    agenticUpsells: [],
    agenticCustomerText: null,
    agenticTextStatus: null,
    threeCScore: null,
    threeCConcern: "Customer reports grinding noise from rear brakes during stops and pedal sponginess at low speed. Noise began approximately 3 weeks ago and has worsened progressively.",
    threeCDiagnosis: '',
    threeCCorrection: '',
    threeCRewriteSuggestion: null,
  },

  // ── RO 6: Front Suspension Clunk — Tom Wallace — 2023 Hyundai Tucson SEL ───
  {
    roNumber: 'RO-2026-0406',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-007',
      name: 'Tom Wallace',
      phone: '(650) 555-0177',
      email: 'twallace@wflaw.com',
    },
    vehicle: {
      vin: '5NMJFCAE3PH264144',
      year: 2023,
      make: 'Hyundai',
      model: 'Tucson',
      trim: 'SEL 2.5L Smartstream',
      color: 'Amazon Gray',
      odometer: 28900,
    },
    vehicleOrigin: 'JAPANESE',
    serviceCategory: 'suspension',
    kanbanStatus: 'approved',
    status: 'open',
    dateIn: todayAt('09:00'),
    dateOut: todayAt('15:30'),
    bay: 6,
    tech: { id: 'tech-001', name: 'Marcus Webb' },
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: "Clunking and knocking from front suspension over bumps and speed bumps. Slight pull to the left.",
    dtcs: ['C1611', 'C1604'],
    repairJobs: [
      {
        description: 'Suspension Diagnostic & Chassis Inspection',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [],
        status: 'pending',
      },
      {
        description: 'Front Strut Mount Replacement LH & RH — OEM Revised Kit (per TSB 54-ST-013H)',
        laborHours: 2.2,
        actualLaborHours: 0,
        lineCost: 385,
        parts: [
          { description: 'Front Strut Mount Kit LH OEM Revised 54610-N9100', lineCost: 92 },
          { description: 'Front Strut Mount Kit RH OEM Revised 54620-N9100', lineCost: 92 },
        ],
        status: 'pending',
      },
      {
        description: 'Front Sway Bar End Link Replacement — Both Sides',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [
          { description: 'Sway Bar End Link LH 54830-D3000', lineCost: 38 },
          { description: 'Sway Bar End Link RH 54840-D3000', lineCost: 38 },
        ],
        status: 'pending',
      },
      {
        description: '4-Wheel Alignment (post-suspension repair)',
        laborHours: 1.0,
        actualLaborHours: 0,
        lineCost: 175,
        parts: [],
        status: 'pending',
      },
    ],
    invoice: 1123,
    progress: 0,
    laborTimeTracking: { totalFlatHrs: 4.8, totalActualHrs: 0, elr: 0, postedRate: 175 },
    aiInsights: [
      "DTCs C1611 + C1604 (ESC/ESP module): C1611 = Steering angle sensor offset not calibrated; C1604 = Steering angle sensor signal error. Both codes are secondary effects of the strut mount failure — alignment drift caused steering angle sensor to lose reference. Root cause is TSB 54-ST-013H (Hyundai Tucson 2022-2024: front strut mount creak/clunk, revised OEM mount kit issued).",
      "Left front toe: -0.4° (spec 0° ± 0.15°). Strut mount replacement + 4-wheel alignment + steering angle sensor recalibration will resolve C1611 and C1604.",
      "Tom is at 28.9K — check Hyundai 5yr/60K warranty before billing. TSB 54-ST-013H may be covered.",
      "Confirm all 4 parts in stock (strut mounts + end links) before promising same-day. Tom drove from Menlo Park.",
    ],
    agenticUpsells: [],
    agenticCustomerText: null,
    agenticTextStatus: null,
    threeCScore: null,
    threeCConcern: "Customer reports clunking and knocking noise from front suspension over bumps and speed bumps. Vehicle also pulls slightly to the left on a flat, straight road.",
    threeCDiagnosis: "Chassis/ESC scan retrieved DTCs C1611 (Steering Angle Sensor — offset value not learned) and C1604 (Steering Angle Sensor — signal error) from the ESC/ESP module. Both codes are secondary effects of strut mount-induced alignment drift: left front toe measured at -0.4° (OEM spec: 0° ± 0.15°), causing the steering angle sensor to lose its calibrated straight-ahead reference. Physical inspection per TSB 54-ST-013H (Hyundai — 2022-2024 Tucson: front strut mount creak/clunk under 30,000 miles, revised OEM mount hardware issued) confirmed cracked strut mount bearing LH and RH with excessive lateral compliance. Front sway bar end links: excessive lateral play measured on both sides. Strut mount failure is confirmed root cause of alignment drift, clunking, left pull, and DTCs C1611/C1604.",
    threeCCorrection: '',
    threeCRewriteSuggestion: {
      score: 92,
      concern: "Customer reports clunking and knocking noise from front suspension when driving over bumps and speed bumps. Vehicle also pulls to the left when driving straight on a level road surface.",
      diagnosis: "Chassis/ESC scan retrieved DTCs C1611 (ESC module — Steering Angle Sensor: offset value not learned) and C1604 (ESC module — Steering Angle Sensor: signal error). Both codes are secondary effects of strut mount failure causing alignment drift: left front toe measured at -0.4° (OEM specification: 0° ± 0.15°), shifting the steering angle sensor outside its calibrated reference window. Per TSB 54-ST-013H (Hyundai Motor Company — 2022-2024 Tucson 2.5L: front strut mount creak, clunk, and noise under 30,000 miles; revised OEM mount hardware issued), physical inspection confirmed cracked strut mount bearing LH and RH with excessive lateral compliance consistent with the documented failure pattern at 28,900 miles. Front sway bar end links: excessive lateral play confirmed bilaterally. Strut mount failure is the confirmed root cause of the clunking, left pull, alignment drift, and DTCs C1611 and C1604.",
      correction: "WORK PERFORMED (per approved estimate): Suspension diagnostic, full chassis/ESC scan (DTCs C1611 and C1604 retrieved and documented), alignment measurement, and physical inspection completed. No parts installed at this stage. WORK RECOMMENDED (based on inspection findings per TSB 54-ST-013H): Replace front strut mount LH — Hyundai OEM P/N 54610-N9100, qty 1; replace front strut mount RH — Hyundai OEM P/N 54620-N9100, qty 1; replace front sway bar end link LH — P/N 54830-D3000, qty 1; replace front sway bar end link RH — P/N 54840-D3000, qty 1. Perform 4-wheel alignment; recalibrate steering angle sensor to clear DTCs C1611 and C1604. Pending customer authorization.",
      status: 'staged',
    },
  },

  // ── RO 7: 60K Major Service — Priya Sharma — 2020 Toyota RAV4 XLE AWD ───────
  {
    roNumber: 'RO-2026-0407',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-008',
      name: 'Priya Sharma',
      phone: '(408) 555-0344',
      email: 'priya.sharma@email.com',
    },
    vehicle: {
      vin: '2T3P1RFV4LW284937',
      year: 2020,
      make: 'Toyota',
      model: 'RAV4',
      trim: 'XLE AWD 2.5L A25A-FKS',
      color: 'Lunar Rock',
      odometer: 60200,
    },
    vehicleOrigin: 'JAPANESE',
    serviceCategory: 'factory_oem',
    kanbanStatus: 'inspecting',
    status: 'open',
    dateIn: todayAt('08:00'),
    dateOut: todayAt('14:00'),
    bay: 5,
    tech: { id: 'tech-002', name: 'DeShawn Carter' },
    advisor: { id: 'adv-001', name: 'James Kowalski' },
    customerConcern: "Scheduled 60K service per Toyota maintenance schedule. No complaints. Mileage: 60,200.",
    dtcs: [],
    repairJobs: [
      {
        description: 'Engine Oil & Filter Change (0W-20 Full Synthetic, 4.8qt)',
        laborHours: 0.5,
        actualLaborHours: 0.3,
        clockIn: todayAt('08:10'),
        lineCost: 87.50,
        parts: [{ description: 'Toyota 0W-20 Full Synthetic + OEM Filter kit 04152-YZZA6', lineCost: 52 }],
        status: 'in_progress',
      },
      {
        description: 'Transmission Fluid Exchange (Toyota WS ATF, 4qt drain-and-fill)',
        laborHours: 1.0,
        actualLaborHours: 0,
        lineCost: 175,
        parts: [{ description: 'Toyota WS ATF 1qt × 4 — 00289-ATFWS', lineCost: 88 }],
        status: 'pending',
      },
      {
        description: 'Rear Differential Fluid Replacement — AWD (per TSB 0095-21)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [{ description: 'Toyota Rear Diff Fluid GL-5 1.5qt × 2 — 08885-02506', lineCost: 36 }],
        status: 'pending',
      },
      {
        description: 'Spark Plug Replacement x4 (NGK Iridium ILZKR7A-11S — OEM spec)',
        laborHours: 1.0,
        actualLaborHours: 0,
        lineCost: 175,
        parts: [{ description: 'NGK Iridium ILZKR7A-11S × 4 — part# 97506', lineCost: 68 }],
        status: 'pending',
      },
      {
        description: 'Engine Air Filter Replacement',
        laborHours: 0.3,
        actualLaborHours: 0,
        lineCost: 52.50,
        parts: [{ description: 'Toyota OEM Engine Air Filter 17801-31090', lineCost: 38 }],
        status: 'pending',
      },
      {
        description: 'Cabin Air Filter Replacement',
        laborHours: 0.3,
        actualLaborHours: 0,
        lineCost: 52.50,
        parts: [{ description: 'Toyota OEM Cabin Air Filter 87139-0E040', lineCost: 32 }],
        status: 'pending',
      },
      {
        description: 'Brake Fluid Flush (Toyota DOT 3)',
        laborHours: 0.8,
        actualLaborHours: 0,
        lineCost: 140,
        parts: [{ description: 'Toyota DOT 3 Brake Fluid 32oz — 00475-1BF02', lineCost: 22 }],
        status: 'pending',
      },
      {
        description: 'Tire Rotation & Balance (4-wheel)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [],
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
    invoice: 1313,
    progress: 15,
    laborTimeTracking: { totalFlatHrs: 4.9, totalActualHrs: 0.3, elr: 0, postedRate: 175 },
    aiInsights: [
      "TSB 0095-21: Toyota RAV4 AWD 2019-2022 — rear differential fluid must be replaced at 60K. Commonly omitted by shops. Skipping it voids Toyota AWD warranty coverage. Priya will ask about this specifically.",
      "Spark plugs: use only NGK ILZKR7A-11S for A25A-FKS (2.5L 4-cyl). Do not substitute Denso or generic — Priya cross-checks OEM parts.",
      "Priya follows OEM schedule exactly. Present the full Toyota 60K checklist with each item checked off. She brought her own printout.",
      "Post-service upsell: 4-wheel alignment measurement at 60K catches wear-induced drift. Easy add — $105.",
    ],
    agenticUpsells: [
      {
        id: 'upsell-007a',
        description: '4-Wheel Alignment Measurement',
        rationale: 'At 60K/Texas roads, toe and camber drift is common. One check shows the data. If in-spec: proof of care. If out: upsell the adjustment.',
        laborHrs: 1.0,
        partsCost: 0,
        laborCost: 175,
        addedRevenue: 175,
        status: 'staged',
      },
    ],
    agenticCustomerText: null,
    agenticTextStatus: null,
    threeCScore: null,
    threeCConcern: "Customer states vehicle is due for scheduled 60,000-mile maintenance per Toyota maintenance schedule. No performance complaints. Customer tracks OEM service intervals closely.",
    threeCDiagnosis: '',
    threeCCorrection: '',
    threeCRewriteSuggestion: null,
  },

  // ── RO 8: Timing Chain Stretch — Ray Bosworth — 2019 Chevy Silverado 1500 LTZ ──
  {
    roNumber: 'RO-2026-0408',
    shopId: 'cornerstone',
    shop: { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer: {
      id: 'cust-006',
      name: 'Ray Bosworth',
      phone: '(650) 555-0206',
      email: 'ray.bosworth@gmail.com',
    },
    vehicle: {
      vin: '3GCUKREC6KG184723',
      year: 2019,
      make: 'Chevrolet',
      model: 'Silverado 1500',
      trim: 'LTZ CrewCab 5.3L V8 EcoTec3 4WD',
      color: 'Silver Ice Metallic',
      odometer: 88400,
    },
    vehicleOrigin: 'DOMESTIC_US',
    serviceCategory: 'other_mechanical',
    kanbanStatus: 'estimate_sent',
    status: 'open',
    dateIn: todayAt('07:00'),
    dateOut: todayAt('17:00'),
    bay: null,
    tech: { id: 'tech-002', name: 'DeShawn Carter' },
    advisor: { id: 'adv-002', name: 'Dave Kowalski' },
    customerConcern: "Check engine light on for 2 weeks. Hesitation under acceleration. Rough idle on cold start.",
    dtcs: [
      { code: 'P0016', description: 'Crankshaft/Camshaft Position Correlation — Bank 1 Sensor A' },
      { code: 'P0017', description: 'Crankshaft/Camshaft Position Correlation — Bank 1 Sensor B (Exhaust)' },
    ],
    repairJobs: [
      {
        description: 'Engine Diagnostic & DTC Analysis',
        laborHours: 1.0,
        actualLaborHours: 1.1,
        clockIn: todayAt('07:05'),
        clockOut: todayAt('08:10'),
        lineCost: 175,
        parts: [],
        status: 'complete',
      },
      {
        description: 'Timing Chain Kit Replacement — Primary & Secondary (per TSB PIP5765G)',
        laborHours: 8.0,
        actualLaborHours: 0,
        lineCost: 1400,
        parts: [
          { description: 'Timing Chain Kit Melling TK-015 (Primary + Secondary + Guides)', lineCost: 485 },
        ],
        status: 'approved',
      },
      {
        description: 'VVT Solenoid Replacement x2 — Intake & Exhaust Bank 1',
        laborHours: 0,
        actualLaborHours: 0,
        lineCost: 0,
        parts: [
          { description: 'VVT Solenoid Intake ACDelco 12655421', lineCost: 52 },
          { description: 'VVT Solenoid Exhaust ACDelco 12655430', lineCost: 52 },
        ],
        status: 'approved',
      },
      {
        description: 'Engine Oil & Filter Change — Post-Timing (Mobil 1 0W-20, 8qt)',
        laborHours: 0.5,
        actualLaborHours: 0,
        lineCost: 87.50,
        parts: [
          { description: 'Mobil 1 0W-20 8qt + ACDelco PF63E Filter', lineCost: 101 },
        ],
        status: 'pending',
      },
    ],
    invoice: 2413,
    progress: 10,
    laborTimeTracking: { totalFlatHrs: 9.5, totalActualHrs: 1.1, elr: 159.09, postedRate: 175 },
    aiInsights: [
      "TSB PIP5765G: GM Gen V EcoTec3 5.3L/6.2L (L83/L86) timing chain stretch — P0016+P0017 at 80-100K mi. Ray's Silverado at 88.4K. Stretch confirmed beyond OEM tolerance on tech inspection.",
      "P0016 + P0017 together = Bank 1 intake AND exhaust cam timing offset. Replace both VVT solenoids with the chain — prevents repeat callback within 20K miles.",
      "Ray is your most loyal customer (24 visits, $16.4K LTV). He negotiates — show him the chain comparison photo (stretched vs. new). He'll approve when he sees it.",
      "Estimate sent yesterday at 4:30 PM. No response yet. Suggest follow-up call this morning — Ray likes to talk shop with Dave directly.",
    ],
    agenticUpsells: [],
    agenticCustomerText: "Hi Ray, wanted to check in on the Silverado estimate I sent yesterday. We confirmed the timing chain is stretched past spec — that's what's triggering the P0016/P0017 codes and the hesitation. It's a $2,413 job but it's the right fix. DeShawn's standing by. Give me a call if you want to talk through it. — Dave @ Cornerstone",
    agenticTextStatus: 'staged',
    tsbMatches: [
      {
        id: 'PIP5765G',
        title: 'GM Gen V EcoTec3 5.3L/6.2L (L83/L86) — Timing Chain Stretch P0016/P0017 at 80–100K Miles',
        description: 'On Gen V EcoTec3 engines, timing chain stretch beyond OEM tolerance causes camshaft correlation DTCs P0016 and P0017. Replace primary and secondary timing chain kit and both VVT solenoids as an assembly.',
        accepted: true,
      },
    ],
    threeCScore: 89,
    threeCConcern: "Customer states check engine light has been on for approximately 2 weeks. Reports noticeable hesitation under hard acceleration and occasional rough idle on cold start.",
    threeCDiagnosis: "DTCs P0016 and P0017 retrieved — Crankshaft-Camshaft Position Correlation Bank 1 Sensor A and B. MIL/CEL illuminated. Physical timing chain inspection confirmed stretch beyond OEM tolerance per TSB PIP5765G (GM Gen V 5.3L EcoTec3). Intake VVT solenoid response time measured at 380ms (spec ≤200ms) — clogged from oil sludge accumulation.",
    threeCCorrection: 'Timing chain kit (primary + secondary) and both VVT solenoids replaced per TSB PIP5765G. Post-repair DTC scan confirmed P0016 and P0017 cleared. Road test performed — no hesitation, CEL off.',
    threeCRewriteSuggestion: {
      score: 89,
      complaint: "Customer states check engine light (MIL) has been illuminated for approximately 2 weeks. Vehicle exhibits noticeable hesitation under hard acceleration and intermittent rough idle on cold start, worsening progressively.",
      cause: "Diagnostic scan retrieved DTCs P0016 (Crankshaft/Camshaft Position Correlation — Bank 1 Sensor A) and P0017 (Crankshaft/Camshaft Position Correlation — Bank 1 Sensor B/Exhaust). MIL/check engine light confirmed on at time of inspection. Both codes are the documented fault signature for timing chain stretch on GM Gen V EcoTec3 engines per TSB PIP5765G (GM Gen V EcoTec3 5.3L/6.2L L83/L86 — Timing Chain Stretch P0016/P0017 at 80–100K Miles). Physical inspection confirmed primary and secondary timing chain stretch beyond OEM tolerance at 88,400 miles. Intake VVT solenoid actuator response measured at 380ms — GM specification is ≤200ms, indicating oil sludge restriction.",
      correction: "SECTION A — Work Performed (per approved estimate):\nTiming Chain Kit (primary and secondary chains, tensioners, guides) — Melling TK-015, qty 1. VVT Solenoid Intake — ACDelco 12655421, qty 1. VVT Solenoid Exhaust — ACDelco 12655430, qty 1. Engine Oil & Filter — Mobil 1 0W-20 8qt + ACDelco PF63E, qty 1 set. Post-repair DTC scan confirmed P0016 and P0017 cleared. Road test completed — no hesitation, MIL off, idle normal.\n\nSECTION B — Work Recommended (based on inspection findings):\nBased on inspection, recommend: Spark Plug Set (8 plugs) — ACDelco 41-162, qty 8. Last service interval not on record; iridium plugs recommended at 88K miles. Pending customer authorization.",
    },
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
    invoice: 167,
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
    invoice: 2356,
    totalEstimate: 2356,
    progress: 15,
    laborTimeTracking: { totalFlatHrs: 8.5, totalActualHrs: 1.2, elr: 185, postedRate: 185 },

    aiInsights: [
      'TSB-17-0144: 3.5L EcoBoost timing chain stretch at 75–90K mi — cold-start rattle confirms pattern.',
      'Repair: timing chain set + guides + tensioners. Labor: 8.5hr. Parts: ~$620–$780. Total: ~$1,760–$1,965 estimate.',
      'High-value job (~$2,356 estimate). Marco\'s approval rate on prior high-value estimates: 83%. High probability.',
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
