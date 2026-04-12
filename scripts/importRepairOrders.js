/**
 * WrenchIQ — Repair Order Import Script (v3)
 *
 * Source:  SOURCE_MONGODB_URI / SOURCE_MONGODB_DB / repair_orders
 * Dest:    MONGODB_URI / wrenchiq / wrenchiq_ro
 *
 * What this script does:
 *  1. Samples 50,000 stratified ROs (40,000 from source + 10,000 synthetic factory OEM)
 *       brake=10000, ac=6500, transmission=6500, other_mechanical=7000, maintenance=10000, factory_oem=10000
 *  2. Spreads repair dates over last 12 months from today
 *  3. Assigns to 4 Bay Area rooftops managed by Bay Auto Care Group
 *  4. Predii Normalizer (local semantic matching — future: Predii API):
 *       P-lines: notes → repair_parts  via resources/merged_parts.txt
 *       L-lines: notes → repair_job    via source repairs[] + curated taxonomy
 *  5. Assigns demo customers, technicians, advisors per rooftop
 *  6. Adds Knowledge Graph stub per RO (per rooftop, across chain)
 *
 * Usage:
 *   node scripts/importRepairOrders.js
 *   node scripts/importRepairOrders.js --dry-run
 *   node scripts/importRepairOrders.js --limit 5000        # write only N docs (scales strata proportionally)
 *   node scripts/importRepairOrders.js --save-cache        # save transformed docs to scripts/cache/ros.ndjson
 *   node scripts/importRepairOrders.js --from-cache        # skip source fetch+transform; load from cache
 *   node scripts/importRepairOrders.js --from-cache --limit 5000
 *   node scripts/importRepairOrders.js --append            # append to existing collection (no drop)
 */

import { MongoClient }                            from 'mongodb';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname }                        from 'path';
import { fileURLToPath }            from 'url';
import { loadVCdb, normalize as normalizeVehicle, vehicleOrigin } from './lib/vehicleNormalizer.js';

const __dir = dirname(fileURLToPath(import.meta.url));

// ── Load .env.local / .env ────────────────────────────────────────────────────
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

// ── Config ────────────────────────────────────────────────────────────────────
const SRC_URI    = process.env.SOURCE_MONGODB_URI || 'mongodb://172.16.80.16:27017/';
const SRC_DB     = process.env.SOURCE_MONGODB_DB  || 'QA_synthetic_22022025';
const SRC_COLL   = 'repair_orders';

const DST_URI    = process.env.MONGODB_URI || 'mongodb://172.16.80.7:27017';
const DST_DB     = process.env.MONGODB_DB  || 'wrenchiq';
const DST_COLL   = 'wrenchiq_ro';

const PARTS_FILE = resolve(__dir, '../resources/merged_parts.txt');
const VCDB_DIR   = '/opt/predii/external-resources/rawdata/AutoCare_VCdb_NA_LDPS_enUS_ASCII_Current';

const TODAY = new Date('2026-03-30');

const TARGET     = 50000;
const BATCH_SIZE = 500;

// ── CLI args ──────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const DRY_RUN    = args.includes('--dry-run');
const SAVE_CACHE = args.includes('--save-cache');
const FROM_CACHE = args.includes('--from-cache');
const APPEND     = args.includes('--append');
const limitArg   = args.indexOf('--limit');
const LIMIT      = limitArg >= 0 ? (parseInt(args[limitArg + 1]) || TARGET) : TARGET;
const CACHE_FILE = resolve(__dir, 'cache/ros.ndjson');

// ── Date window (after APPEND is defined) ────────────────────────────────────
// --append: use prior 12-month window (2024-04 → 2025-03) so dates don't overlap existing batch
const WINDOW_END   = APPEND ? new Date('2025-03-30') : TODAY;
const WINDOW_START = new Date(WINDOW_END); WINDOW_START.setFullYear(WINDOW_END.getFullYear() - 1);

// ── Chain & Rooftops ─────────────────────────────────────────────────────────
const CHAIN = {
  id:     'chain-001',
  name:   'Bay Auto Care Group',
  region: 'San Francisco Bay Area',
};

const ROOFTOPS = [
  { id:'shop-001', name:'Bay Auto Care — Palo Alto',     city:'Palo Alto',     state:'CA', zip:'94301', phone:'(650) 555-1001', labor_rate:195 },
  { id:'shop-002', name:'Bay Auto Care — Sunnyvale',     city:'Sunnyvale',     state:'CA', zip:'94087', phone:'(408) 555-1002', labor_rate:185 },
  { id:'shop-003', name:'Bay Auto Care — Mountain View', city:'Mountain View', state:'CA', zip:'94041', phone:'(650) 555-1003', labor_rate:190 },
  { id:'shop-004', name:'Bay Auto Care — San Jose',      city:'San Jose',      state:'CA', zip:'95112', phone:'(408) 555-1004', labor_rate:175 },
];

// ── Staff (per rooftop) ───────────────────────────────────────────────────────
const TECHNICIANS = {
  'shop-001': [{ id:'tech-101', name:'James Kowalski' }, { id:'tech-102', name:'David Park'    }],
  'shop-002': [{ id:'tech-201', name:'Mike Reeves'    }, { id:'tech-202', name:'Ana Torres'    }],
  'shop-003': [{ id:'tech-301', name:'Carlos Mendez'  }, { id:'tech-302', name:'Yuki Tanaka'   }],
  'shop-004': [{ id:'tech-401', name:'Lisa Nguyen'    }, { id:'tech-402', name:'Ryan Patel'    }],
};
const ADVISORS = {
  'shop-001': [{ id:'adv-101', name:'Tilak Kasturi'  }],
  'shop-002': [{ id:'adv-201', name:'Rachel Torres'  }],
  'shop-003': [{ id:'adv-301', name:'Marcus Webb'    }],
  'shop-004': [{ id:'adv-401', name:'Priya Mehta'    }],
};

// ── 25 Demo Customers ─────────────────────────────────────────────────────────
const CUSTOMERS = [
  { id:'cust-001', name:'Sarah Chen',         phone:'(650) 555-0101', email:'sarah.chen@stanford.edu',       visits:8 },
  { id:'cust-002', name:'David Kim',          phone:'(408) 555-0102', email:'david.kim@google.com',          visits:7 },
  { id:'cust-003', name:'Monica Rodriguez',   phone:'(650) 555-0103', email:'monica@venturebloom.io',        visits:6 },
  { id:'cust-004', name:'James Park',         phone:'(650) 555-0104', email:'james.park@sequoiacap.com',     visits:6 },
  { id:'cust-005', name:'Angela Martinez',    phone:'(650) 555-0105', email:'a.martinez@pausd.org',          visits:5 },
  { id:'cust-006', name:'Robert Taylor',      phone:'(650) 555-0106', email:'rtaylor.retired@gmail.com',     visits:5 },
  { id:'cust-007', name:'Priya Sharma',       phone:'(408) 555-0107', email:'priya.sharma@apple.com',        visits:5 },
  { id:'cust-008', name:'Tom Wallace',        phone:'(650) 555-0108', email:'twallace@wflaw.com',            visits:4 },
  { id:'cust-009', name:'Lisa Chen',          phone:'(415) 555-0109', email:'lchen@cisco.com',               visits:4 },
  { id:'cust-010', name:'Kevin Park',         phone:'(650) 555-0110', email:'kevin.park@salesforce.com',     visits:4 },
  { id:'cust-011', name:'Rachel Green',       phone:'(650) 555-0111', email:'rgreen.pa@gmail.com',           visits:4 },
  { id:'cust-012', name:'Marcus Johnson',     phone:'(408) 555-0112', email:'mjohnson@netflix.com',          visits:4 },
  { id:'cust-013', name:'Jennifer Kim',       phone:'(650) 555-0113', email:'jkim.menlopark@gmail.com',      visits:3 },
  { id:'cust-014', name:'Carlos Ruiz',        phone:'(408) 555-0114', email:'cruiz.sj@gmail.com',            visits:3 },
  { id:'cust-015', name:'Emily Zhang',        phone:'(408) 555-0115', email:'ezhang@adobe.com',              visits:3 },
  { id:'cust-016', name:'Nathan Hill',        phone:'(650) 555-0116', email:'nhill.rw@gmail.com',            visits:3 },
  { id:'cust-017', name:'Stephanie Lee',      phone:'(408) 555-0117', email:'slee.sunnyvale@gmail.com',      visits:3 },
  { id:'cust-018', name:'Brian Murphy',       phone:'(650) 555-0118', email:'bmurphy.redwoodcity@gmail.com', visits:2 },
  { id:'cust-019', name:'Yasmine Hassan',     phone:'(408) 555-0119', email:'yhassan@linkedin.com',          visits:2 },
  { id:'cust-020', name:'Christopher Young',  phone:'(650) 555-0120', email:'cyoung.atherton@gmail.com',     visits:2 },
  { id:'cust-021', name:'Melissa Turner',     phone:'(408) 555-0121', email:'mturner.lv@gmail.com',          visits:2 },
  { id:'cust-022', name:'Jason White',        phone:'(650) 555-0122', email:'jwhite@tesla.com',              visits:2 },
  { id:'cust-023', name:'Laura Martinez',     phone:'(408) 555-0123', email:'lmartinez.mv@gmail.com',        visits:2 },
  { id:'cust-024', name:'Daniel Brown',       phone:'(650) 555-0124', email:'dbrown@oracle.com',             visits:2 },
  { id:'cust-025', name:'Ashley Taylor',      phone:'(408) 555-0125', email:'ataylor.cupertino@gmail.com',   visits:2 },
];

// ── Curated Labor Job Taxonomy ────────────────────────────────────────────────
// Used when source ro_line.repairs[] is empty.
// TODO(predii-api): Replace LABOR_JOBS keyword taxonomy with:
//   POST /v1/normalize/repair-job { description, vehicle } → { labor_op_code, name, category }
//   Until then, keyword matching provides ~86% coverage on demo data.
const LABOR_JOBS = [
  { name:'Oil & Filter Change',             keywords:['oil', 'lof', 'lube', 'filter', 'drain', 'fill'] },
  { name:'Multi-Point Inspection',          keywords:['inspect', 'inspection', 'check', 'mpi', 'veh inspection'] },
  { name:'Tire Rotation',                   keywords:['rotat', 'tire rotat'] },
  { name:'Wheel Alignment',                 keywords:['align', 'alignment', 'camber', 'toe', 'caster'] },
  { name:'Tire Mount & Balance',            keywords:['mount', 'balance', 'mount and balance', 'dismount'] },
  { name:'Brake Pad Replacement',           keywords:['brake pad', 'pad replac', 'front brake', 'rear brake'] },
  { name:'Brake Rotor Service',             keywords:['rotor', 'resurface', 'disc', 'brake rotor'] },
  { name:'Brake Flush / Fluid Service',     keywords:['brake fluid', 'brake flush', 'bleed brake'] },
  { name:'Battery Replacement',             keywords:['battery', 'batt replac', 'batt test', 'jump start'] },
  { name:'Engine Diagnostic / Scan',        keywords:['scan', 'diagnostic', 'check engine', 'cel', 'dtc', 'code', 'scope'] },
  { name:'Spark Plug Replacement',          keywords:['spark plug', 'plug replac', 'tune up', 'ignition'] },
  { name:'Serpentine Belt Replacement',     keywords:['serpentine', 'drive belt', 'belt replac'] },
  { name:'Timing Belt / Chain Service',     keywords:['timing belt', 'timing chain', 'timing kit'] },
  { name:'Coolant Flush',                   keywords:['coolant', 'antifreeze', 'coolant flush', 'radiator flush'] },
  { name:'Transmission Fluid Service',      keywords:['transmission fluid', 'trans fluid', 'atf', 'trans service'] },
  { name:'Differential Fluid Service',      keywords:['differential', 'diff fluid', 'gear oil'] },
  { name:'Power Steering Fluid Flush',      keywords:['power steering', 'ps fluid', 'steering fluid'] },
  { name:'Air Filter Replacement',          keywords:['air filter', 'engine air', 'intake filter'] },
  { name:'Cabin Air Filter Replacement',    keywords:['cabin air', 'cabin filter', 'pollen filter', 'hvac filter'] },
  { name:'Fuel System Service',             keywords:['fuel inject', 'fuel induct', 'throttle body', 'fuel service'] },
  { name:'A/C Service',                     keywords:['ac', 'a/c', 'air condition', 'recharge', 'refrigerant', 'freon'] },
  { name:'Alternator Replacement',          keywords:['alternator', 'alt replac', 'charging'] },
  { name:'Starter Replacement',             keywords:['starter', 'starter replac'] },
  { name:'Water Pump Replacement',          keywords:['water pump', 'wp replac'] },
  { name:'Thermostat Replacement',          keywords:['thermostat', 'tstat'] },
  { name:'Radiator Replacement',            keywords:['radiator', 'rad replac'] },
  { name:'Oxygen Sensor Replacement',       keywords:['o2 sensor', 'oxygen sensor', 'o2 replac', 'lambda'] },
  { name:'Catalytic Converter Replacement', keywords:['catalytic', 'cat convert', 'cat replac'] },
  { name:'EVAP System Repair',              keywords:['evap', 'purge valve', 'vapor', 'evap leak'] },
  { name:'EGR Valve Service',               keywords:['egr', 'exhaust gas recircul'] },
  { name:'Tie Rod Replacement',             keywords:['tie rod', 'tie rod end', 'inner tie', 'outer tie'] },
  { name:'Ball Joint Replacement',          keywords:['ball joint', 'ball joint replac'] },
  { name:'CV Axle / CV Boot Replacement',   keywords:['cv axle', 'cv boot', 'cv joint', 'axle shaft'] },
  { name:'Wheel Bearing Replacement',       keywords:['wheel bearing', 'hub bearing', 'bearing hub'] },
  { name:'Strut / Shock Replacement',       keywords:['strut', 'shock absorb', 'shock replac'] },
  { name:'Sway Bar / End Link Replacement', keywords:['sway bar', 'end link', 'stabilizer', 'anti-roll'] },
  { name:'Control Arm Replacement',         keywords:['control arm', 'lower control', 'upper control'] },
  { name:'Fuel Pump Replacement',           keywords:['fuel pump', 'fp replac'] },
  { name:'Fuel Filter Replacement',         keywords:['fuel filter', 'ff replac'] },
  { name:'Wiper Blade Replacement',         keywords:['wiper', 'wiper blade', 'windshield wiper'] },
  { name:'Headlight / Bulb Replacement',    keywords:['headlight', 'bulb replac', 'light replac', 'lamp replac'] },
  { name:'Window Regulator / Motor',        keywords:['window regul', 'window motor', 'power window'] },
  { name:'Engine Mount Replacement',        keywords:['engine mount', 'motor mount'] },
  { name:'Transmission Service / Rebuild',  keywords:['transmission rebuild', 'trans rebuild', 'trans replac'] },
];

// ── Factory OEM Milestone Data ────────────────────────────────────────────────

// Weighted to reflect source make distribution:
// Ford ~15%, Toyota ~14%, Chevrolet ~11%, Honda ~9%, Nissan ~5%, Subaru ~4%, Jeep ~4%
const OEM_VEHICLES = [
  // Ford (5 entries ~15%)
  { year: 2019, make: 'Ford',       model: 'F-150' },
  { year: 2020, make: 'Ford',       model: 'Explorer' },
  { year: 2018, make: 'Ford',       model: 'Escape' },
  { year: 2021, make: 'Ford',       model: 'F-250 Super Duty' },
  { year: 2019, make: 'Ford',       model: 'Edge' },
  // Toyota (5 entries ~14%)
  { year: 2020, make: 'Toyota',     model: 'Camry' },
  { year: 2019, make: 'Toyota',     model: 'Corolla' },
  { year: 2021, make: 'Toyota',     model: 'RAV4' },
  { year: 2018, make: 'Toyota',     model: 'Tacoma' },
  { year: 2020, make: 'Toyota',     model: 'Highlander' },
  // Chevrolet (4 entries ~11%)
  { year: 2021, make: 'Chevrolet',  model: 'Silverado 1500' },
  { year: 2019, make: 'Chevrolet',  model: 'Equinox' },
  { year: 2020, make: 'Chevrolet',  model: 'Malibu' },
  { year: 2018, make: 'Chevrolet',  model: 'Colorado' },
  // Honda (3 entries ~9%)
  { year: 2020, make: 'Honda',      model: 'Accord' },
  { year: 2017, make: 'Honda',      model: 'Civic' },
  { year: 2019, make: 'Honda',      model: 'CR-V' },
  // Nissan (2 entries ~5%)
  { year: 2019, make: 'Nissan',     model: 'Altima' },
  { year: 2021, make: 'Nissan',     model: 'Rogue' },
  // Subaru (1 entry ~4%)
  { year: 2021, make: 'Subaru',     model: 'Outback' },
  // Jeep (1 entry ~4%)
  { year: 2020, make: 'Jeep',       model: 'Grand Cherokee' },
  // GMC (1 entry ~3%)
  { year: 2018, make: 'GMC',        model: 'Sierra 1500' },
  // Dodge/Ram (1 entry ~4%)
  { year: 2019, make: 'Ram',        model: 'Ram 1500' },
  // Hyundai (1 entry ~3%)
  { year: 2020, make: 'Hyundai',    model: 'Sonata' },
  // Lexus (1 entry ~3%)
  { year: 2018, make: 'Lexus',      model: 'ES350' },
  // BMW (1 entry ~2%)
  { year: 2019, make: 'BMW',        model: '330i' },
  // Mazda (1 entry ~2%)
  { year: 2021, make: 'Mazda',      model: 'CX-5' },
  // Volkswagen (1 entry ~2%)
  { year: 2020, make: 'Volkswagen', model: 'Jetta' },
  // Kia (1 entry ~2%)
  { year: 2019, make: 'Kia',        model: 'Sorento' },
  // Acura (1 entry ~1%)
  { year: 2018, make: 'Acura',      model: 'MDX' },
];

const OEM_MILESTONES = [
  {
    milestone: '30K',
    mileage:   30000,
    lines: [
      { type:'L', notes:'Engine oil & filter change (0W-20 synthetic)',   labor_hours:0.5 },
      { type:'P', notes:'Engine Oil 0W-20 Full Synthetic (5 qt)',          unit_price:49.95, quantity:1 },
      { type:'P', notes:'Oil Filter',                                       unit_price:11.95, quantity:1 },
      { type:'L', notes:'Tire rotation and pressure check',                labor_hours:0.3 },
      { type:'L', notes:'30K multi-point vehicle inspection',              labor_hours:0.5 },
      { type:'L', notes:'Cabin air filter replacement',                    labor_hours:0.3 },
      { type:'P', notes:'Cabin Air Filter',                                unit_price:28.00, quantity:1 },
      { type:'L', notes:'Engine air filter replacement',                   labor_hours:0.3 },
      { type:'P', notes:'Engine Air Filter',                               unit_price:31.00, quantity:1 },
    ],
  },
  {
    milestone: '45K',
    mileage:   45000,
    lines: [
      { type:'L', notes:'Engine oil & filter change (0W-20 synthetic)',   labor_hours:0.5 },
      { type:'P', notes:'Engine Oil 0W-20 Full Synthetic (5 qt)',          unit_price:49.95, quantity:1 },
      { type:'P', notes:'Oil Filter',                                       unit_price:11.95, quantity:1 },
      { type:'L', notes:'Tire rotation and pressure check',                labor_hours:0.3 },
      { type:'L', notes:'45K multi-point vehicle inspection',              labor_hours:0.5 },
      { type:'L', notes:'Fuel system induction service',                   labor_hours:0.5 },
      { type:'P', notes:'Fuel Induction Cleaner',                          unit_price:29.95, quantity:1 },
      { type:'L', notes:'Brake fluid flush — DOT3',                        labor_hours:0.5 },
      { type:'P', notes:'Brake Fluid DOT 3 (32 oz)',                       unit_price:18.95, quantity:2 },
    ],
  },
  {
    milestone: '60K',
    mileage:   60000,
    lines: [
      { type:'L', notes:'Engine oil & filter change (0W-20 synthetic)',   labor_hours:0.5 },
      { type:'P', notes:'Engine Oil 0W-20 Full Synthetic (5 qt)',          unit_price:49.95, quantity:1 },
      { type:'P', notes:'Oil Filter',                                       unit_price:11.95, quantity:1 },
      { type:'L', notes:'Tire rotation and pressure check',                labor_hours:0.3 },
      { type:'L', notes:'60K major service inspection',                    labor_hours:0.5 },
      { type:'L', notes:'Spark plug replacement (set of 4)',               labor_hours:1.5 },
      { type:'P', notes:'Spark Plug (Iridium)',                            unit_price:14.95, quantity:4 },
      { type:'L', notes:'Coolant flush and fill',                          labor_hours:0.7 },
      { type:'P', notes:'Coolant/Antifreeze (gallon)',                     unit_price:24.95, quantity:2 },
      { type:'L', notes:'Transmission fluid service (ATF)',                labor_hours:0.8 },
      { type:'P', notes:'Automatic Transmission Fluid',                    unit_price:12.95, quantity:4 },
    ],
  },
  {
    milestone: '75K',
    mileage:   75000,
    lines: [
      { type:'L', notes:'Engine oil & filter change (0W-20 synthetic)',   labor_hours:0.5 },
      { type:'P', notes:'Engine Oil 0W-20 Full Synthetic (5 qt)',          unit_price:49.95, quantity:1 },
      { type:'P', notes:'Oil Filter',                                       unit_price:11.95, quantity:1 },
      { type:'L', notes:'Tire rotation and pressure check',                labor_hours:0.3 },
      { type:'L', notes:'75K multi-point vehicle inspection',              labor_hours:0.5 },
      { type:'L', notes:'Serpentine belt replacement',                     labor_hours:0.8 },
      { type:'P', notes:'Serpentine Belt',                                 unit_price:42.95, quantity:1 },
      { type:'L', notes:'Power steering fluid flush',                      labor_hours:0.4 },
      { type:'P', notes:'Power Steering Fluid (12 oz)',                    unit_price:16.95, quantity:2 },
      { type:'L', notes:'Differential fluid service',                      labor_hours:0.5 },
      { type:'P', notes:'Differential Gear Oil (quart)',                   unit_price:13.95, quantity:2 },
    ],
  },
  {
    milestone: '90K',
    mileage:   90000,
    lines: [
      { type:'L', notes:'Engine oil & filter change (0W-20 synthetic)',   labor_hours:0.5 },
      { type:'P', notes:'Engine Oil 0W-20 Full Synthetic (5 qt)',          unit_price:49.95, quantity:1 },
      { type:'P', notes:'Oil Filter',                                       unit_price:11.95, quantity:1 },
      { type:'L', notes:'Tire rotation and pressure check',                labor_hours:0.3 },
      { type:'L', notes:'90K major service inspection',                    labor_hours:0.5 },
      { type:'L', notes:'Timing belt, water pump and tensioner service',   labor_hours:4.0 },
      { type:'P', notes:'Timing Belt Kit',                                 unit_price:89.95, quantity:1 },
      { type:'P', notes:'Water Pump',                                      unit_price:55.95, quantity:1 },
      { type:'L', notes:'Coolant flush and fill',                          labor_hours:0.7 },
      { type:'P', notes:'Coolant/Antifreeze (gallon)',                     unit_price:24.95, quantity:2 },
      { type:'L', notes:'Spark plug replacement (set of 4)',               labor_hours:1.5 },
      { type:'P', notes:'Spark Plug (Iridium)',                            unit_price:14.95, quantity:4 },
      { type:'L', notes:'Cabin air filter replacement',                    labor_hours:0.3 },
      { type:'P', notes:'Cabin Air Filter',                                unit_price:28.00, quantity:1 },
    ],
  },
];

/** Build `count` synthetic factory OEM source-shaped docs cycling through milestones. */
function buildOEMDocs(count) {
  const docs = [];
  for (let i = 0; i < count; i++) {
    const milestone = OEM_MILESTONES[i % OEM_MILESTONES.length];
    const vehicle   = OEM_VEHICLES[i % OEM_VEHICLES.length];
    const odometer  = milestone.mileage + randInt(-2000, 2000);
    docs.push({
      _id:      `oem-synthetic-${String(i + 1).padStart(4, '0')}`,
      ro_lines: milestone.lines.map((l, idx) => ({
        repair_type:       l.type,
        notes:             l.notes,
        labor_hours:       l.labor_hours    ?? null,
        labor_rate:        null,
        unit_price:        l.unit_price     ?? null,
        quantity:          l.quantity       ?? null,
        year:              vehicle.year,
        make:              vehicle.make,
        model:             vehicle.model,
        odometer,
        lineid:            String(idx + 1),
        repairs:           [],
        components:        [],
        repair_components: [],
        codes:             [],
        detected_codes:    [],
        symptoms:          [],
      })),
      codes:        [],
      symptoms:     [],
      repairs:      [`${milestone.milestone} Factory Scheduled Maintenance`],
      p_notes:      milestone.lines.filter(l => l.type === 'P').map(l => l.notes),
      l_notes:      milestone.lines.filter(l => l.type === 'L').map(l => l.notes),
      p_components: [],
      components:   [],
    });
  }
  return docs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function pick(arr)          { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max)  { return min + Math.floor(Math.random() * (max - min + 1)); }

/** Spread `count` dates evenly between start and end, skipping weekends. */
function spreadDates(count, start, end) {
  const span = end.getTime() - start.getTime();
  const seg  = span / count;
  return Array.from({ length: count }, (_, i) => {
    const base   = start.getTime() + seg * (i + 0.5);
    const jitter = (Math.random() - 0.5) * 12 * 86400000; // ±6 days
    const d = new Date(Math.max(start.getTime(), Math.min(end.getTime(), base + jitter)));
    if (d.getDay() === 0) d.setDate(d.getDate() + 1); // Sun → Mon
    if (d.getDay() === 6) d.setDate(d.getDate() - 1); // Sat → Fri
    return d;
  }).sort((a, b) => a - b);
}

/** Derive RO status from how many days ago it was opened. */
function deriveStatus(dateIn) {
  const daysAgo = (TODAY - dateIn) / 86400000;
  if (daysAgo < 1)  return pick(['open',     'open',     'estimate']);
  if (daysAgo < 4)  return pick(['open',     'estimate', 'estimate']);
  if (daysAgo < 8)  return pick(['estimate', 'approved', 'approved']);
  if (daysAgo < 14) return pick(['approved', 'approved', 'closed']);
  return 'closed';
}

const KANBAN = { open:'checked_in', estimate:'estimate_sent', approved:'in_progress', closed:'ready' };

function parseInvoice(raw) {
  const n = parseFloat(raw);
  return isFinite(n) ? Math.round(n * 100) / 100 : null;
}

// ── Predii Normalizer ─────────────────────────────────────────────────────────

const STOP_WORDS = new Set(['a','an','the','for','of','with','and','or','in','on','to','at',
                            'by','from','is','are','was','were','be','as','its','it','this',
                            'that','has','have','had','do','does','per','vs','via','w']);

function tokenize(str) {
  if (!str) return [];
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1 && !STOP_WORDS.has(t));
}

/**
 * Score how well candidateTokens match queryTokens.
 * Uses F1 of coverage (candidate words found in query) and
 * precision (query words found in candidate), with prefix bonus.
 */
function matchScore(queryToks, candidateToks) {
  if (!queryToks.length || !candidateToks.length) return 0;
  const qSet = new Set(queryToks);
  let covHits = 0;
  for (const ct of candidateToks) {
    const hit = qSet.has(ct) ||
      queryToks.some(qt => (qt.length >= 3 && ct.startsWith(qt)) ||
                           (ct.length >= 3 && qt.startsWith(ct)));
    if (hit) covHits++;
  }
  const coverage  = covHits / candidateToks.length;
  let   precHits  = 0;
  const cSet = new Set(candidateToks);
  for (const qt of queryToks) {
    const hit = cSet.has(qt) ||
      candidateToks.some(ct => (qt.length >= 3 && ct.startsWith(qt)) ||
                               (ct.length >= 3 && qt.startsWith(ct)));
    if (hit) precHits++;
  }
  const precision = precHits / queryToks.length;
  if (coverage + precision === 0) return 0;
  return 2 * coverage * precision / (coverage + precision);
}

/**
 * Load resources/merged_parts.txt and build:
 * TODO(predii-api): Replace this loader with Predii Parts Normalization API:
 *   POST /v1/normalize/part { description } → { ptn_id, ptn_name, category, confidence }
 *   The merged_parts.txt index is a local fallback providing ~80% match rate on demo data.
 *   - entries[]: { name, tokens, category, subcategory }
 *   - wordIndex: word → [entry_idx, ...]
 *
 * Each PartTerminologyName, Alias, and OldName is indexed separately
 * but all map to the same canonical PartTerminologyName.
 *
 * Future: replace with Predii Normalization API call.
 */
function buildPartsNormalizer(filePath) {
  console.log(`  Loading parts taxonomy from ${filePath}...`);
  const raw = readFileSync(filePath, 'utf8').split('\n');
  const entries   = [];
  const wordIndex = new Map();

  for (const line of raw.slice(1)) {  // skip header
    const cols = line.split('|');
    if (cols.length < 6) continue;
    const canonName   = cols[1]?.trim();
    const category    = cols[4]?.trim() || null;
    const subcategory = cols[5]?.trim() || null;
    const aliases     = (cols[7] || '').split(';').map(s => s.trim()).filter(Boolean);
    const oldNames    = (cols[8] || '').split(';').map(s => s.trim()).filter(Boolean);
    if (!canonName) continue;

    for (const term of [canonName, ...aliases, ...oldNames]) {
      const toks = tokenize(term);
      if (!toks.length) continue;
      const idx = entries.length;
      entries.push({ name: canonName, tokens: toks, category, subcategory });
      for (const t of toks) {
        if (!wordIndex.has(t)) wordIndex.set(t, []);
        wordIndex.get(t).push(idx);
      }
    }
  }

  console.log(`  Indexed ${entries.length.toLocaleString()} part terms from ${raw.length.toLocaleString()} lines.`);
  return { entries, wordIndex };
}

/**
 * Normalize a part description against the parts taxonomy.
 * Returns the canonical PartTerminologyName and match metadata.
 *
 * TODO(predii-api): Replace with POST /v1/normalize/part { description }
 *   Response fields: ptn_id, ptn_name, category, subcategory, confidence
 *   Change match_method sentinel from 'local_merged_parts' → 'predii_api'.
 */
function normalizePart(description, normalizer) {
  const { entries, wordIndex } = normalizer;
  const qToks = tokenize(description);
  if (!qToks.length) return { repair_parts: null, match_score: 0, match_method: 'none' };

  // Gather candidate entry indices via inverted word index
  const candidateSet = new Set();
  for (const qt of qToks) {
    const exact = wordIndex.get(qt);
    if (exact) for (const i of exact) candidateSet.add(i);
  }

  // Score candidates
  let best = null, bestScore = 0;
  for (const i of candidateSet) {
    const s = matchScore(qToks, entries[i].tokens);
    if (s > bestScore) { bestScore = s; best = entries[i]; }
  }

  const THRESHOLD = 0.45;
  if (best && bestScore >= THRESHOLD) {
    return {
      repair_parts:   best.name,
      parts_category: best.category,
      parts_subcategory: best.subcategory,
      match_score:    Math.round(bestScore * 1000) / 1000,
      match_method:   'local_merged_parts',  // TODO(predii-api): becomes 'predii_api'
    };
  }
  return { repair_parts: null, match_score: Math.round(bestScore * 1000) / 1000, match_method: 'none' };
}

/**
 * Normalize a labor line to a standardized repair job name.
 * Priority:
 *   1. Source repairs[] field (already Predii-normalized if present)
 *   2. Keyword match against LABOR_JOBS taxonomy
 *
 * TODO(predii-api): Replace keyword fallback with:
 *   POST /v1/normalize/repair-job { description, vehicle_context }
 *   Change match_method sentinel from 'local_keyword' → 'predii_api'.
 */
function normalizeJob(description, sourceRepairs) {
  // Priority 1: use existing Predii-normalized repairs from source
  if (Array.isArray(sourceRepairs) && sourceRepairs.length > 0) {
    const cleaned = sourceRepairs[0].trim();
    if (cleaned) return { repair_job: cleaned, match_method: 'source_repairs' };
  }

  // Priority 2: keyword match against curated taxonomy
  const lower = (description || '').toLowerCase();
  let best = null, bestHits = 0;
  for (const job of LABOR_JOBS) {
    const hits = job.keywords.filter(kw => lower.includes(kw)).length;
    if (hits > bestHits) { bestHits = hits; best = job; }
  }
  if (best && bestHits > 0) {
    return { repair_job: best.name, match_method: 'local_keyword' }; // TODO(predii-api): becomes 'predii_api'
  }

  return { repair_job: null, match_method: 'none' };
}

// ── Labor hours estimator (fills null labor_hours from source) ─────────────────
const LABOR_HRS_BY_KEYWORD = [
  { hrs: 0.5, kws: ['oil','lof','lube','filter','drain','battery','wiper','cabin air','check'] },
  { hrs: 0.8, kws: ['brake fluid','flush','coolant','transmission fluid','power steering'] },
  { hrs: 1.0, kws: ['brake pad','rotor','alignment','wheel bearing','mount'] },
  { hrs: 1.5, kws: ['spark plug','alternator','starter','water pump','strut','shock'] },
  { hrs: 2.5, kws: ['timing belt','head gasket','engine','transmission rebuild'] },
];

function estimateLaborHrs(description) {
  const lower = (description || '').toLowerCase();
  for (const { hrs, kws } of LABOR_HRS_BY_KEYWORD) {
    if (kws.some(kw => lower.includes(kw))) return hrs;
  }
  return 0.5; // default
}

// ── Parts cost estimator (fills null unit_price from source) ──────────────────
const PARTS_COST_BY_CATEGORY = {
  'Oil, Fluids and Chemicals': { min: 8,  max: 55  },
  'Filters':                   { min: 12, max: 45  },
  'Brake Parts':               { min: 45, max: 185 },
  'Electrical':                { min: 25, max: 120 },
  'Suspension':                { min: 55, max: 320 },
  'Engine Parts':              { min: 35, max: 150 },
  'Tires':                     { min: 95, max: 220 },
};

function estimateUnitPrice(category) {
  const range = PARTS_COST_BY_CATEGORY[category] || { min: 15, max: 85 };
  return Math.round((range.min + Math.random() * (range.max - range.min)) * 100) / 100;
}

// ── Declined service pool ─────────────────────────────────────────────────────
const DECLINE_POOL = [
  { opCode:'AIR-FLT', description:'Engine Air Filter Replacement',   partsCost:28, laborHrs:0.3 },
  { opCode:'CAB-FLT', description:'Cabin Air Filter Replacement',    partsCost:24, laborHrs:0.3 },
  { opCode:'TRN-FLD', description:'Transmission Fluid Exchange',     partsCost:92, laborHrs:1.0 },
  { opCode:'CLT-FLS', description:'Coolant System Flush',            partsCost:34, laborHrs:0.8 },
  { opCode:'BRK-FLD', description:'Brake Fluid Flush (DOT 3)',       partsCost:18, laborHrs:0.5 },
  { opCode:'FUL-INJ', description:'Fuel Injector Cleaning Service',  partsCost:65, laborHrs:0.5 },
  { opCode:'PCV-SYS', description:'PCV Valve & Hose Replacement',    partsCost:28, laborHrs:0.3 },
  { opCode:'WPR-REP', description:'Wiper Blade Replacement (Rear)',  partsCost:18, laborHrs:0.2 },
];

function calcPartsCharged(cost) {
  if (cost === 0) return 0;
  const markup = cost > 100 ? 0.38 + Math.random() * 0.12 : 0.50 + Math.random() * 0.20;
  return Math.round(cost * (1 + markup) * 100) / 100;
}

// ── Customer loyalty helpers ───────────────────────────────────────────────────
function loyaltyTier(visits) {
  if (visits >= 9) return 'vip';
  if (visits >= 6) return 'loyal';
  if (visits >= 3) return 'regular';
  return 'new';
}

function approvalRate(tier) {
  return { vip: 0.93, loyal: 0.85, regular: 0.74, new: 0.61 }[tier];
}

// ── Line builders ─────────────────────────────────────────────────────────────

function buildPart(line, normalizer) {
  const { repair_parts, parts_category, parts_subcategory, match_score, match_method } =
    normalizePart(line.notes, normalizer);
  return {
    line_id:              line.lineid            || line._id || null,
    source_id:            line._id               || null,
    description:          line.notes             || null,
    components:           line.components        || [],
    repairs:              line.repairs           || [],
    repair_components:    line.repair_components || [],
    codes:                line.codes             || [],
    ...((() => {
      const unit_price = line.unit_price ?? estimateUnitPrice(parts_category);
      const quantity   = line.quantity   ?? 1;
      return {
        unit_price,
        quantity,
        line_cost: Math.round(unit_price * quantity * 100) / 100,
      };
    })()),
    // Predii Normalizer output
    repair_parts,
    parts_category,
    parts_subcategory,
    normalizer_score:     match_score,
    normalizer_method:    match_method,
  };
}

function buildJob(line, parts, normalizer, techEfficiency = 0.85, rooftopLaborRate = 185) {
  const { repair_job, match_method } = normalizeJob(line.notes, line.repairs);
  const labor_hours = line.labor_hours ?? estimateLaborHrs(line.notes || line.description || '');
  const labor_rate  = line.labor_rate  ?? rooftopLaborRate;
  const line_cost   = Math.round(labor_rate * labor_hours * 100) / 100;
  // Actual hours: flat-rate hours divided by tech efficiency factor
  const actual_labor_hours = labor_hours > 0
    ? Math.round(labor_hours / techEfficiency * 100) / 100 : null;

  return {
    line_id:              line.lineid            || line._id || null,
    source_id:            line._id               || null,
    description:          line.notes             || null,
    components:           line.components        || [],
    repairs:              line.repairs           || [],
    repair_jobs:          line.repair_jobs       || [],
    repair_components:    line.repair_components || [],
    codes:                line.codes             || [],
    detected_codes:       line.detected_codes    || [],
    symptoms:             line.symptoms          || [],
    labor_rate,
    labor_hours,
    actual_labor_hours,    // clocked hours (flat ÷ efficiency); null for parts-only lines
    line_cost,
    // Predii Normalizer output
    repair_job,
    normalizer_method:    match_method,
    parts,
  };
}

// ── RO Transformer ────────────────────────────────────────────────────────────

// ── Tech efficiency map (flat-rate → actual hours) ────────────────────────────
// Mirrors demoData technicians; applied when building job actual_labor_hours.
const TECH_EFFICIENCY = {
  'tech-101': 0.96, 'tech-201': 0.85, 'tech-301': 0.92, 'tech-401': 0.78,
  'tech-102': 0.85, 'tech-202': 0.88, 'tech-302': 0.90, 'tech-402': 0.82,
};

function transformRO(srcDoc, { rooftop, customer, tech, advisor, dateIn, roNumber, roIndex, serviceCategory }, normalizer, vcdb) {
  const techEfficiency = TECH_EFFICIENCY[tech.id] || 0.85;

  // Sort lines by sequential index
  const lines = (srcDoc.ro_lines || []).slice().sort((a, b) => {
    const ia = typeof a.index === 'number' ? a.index : parseInt(a.lineid) || 0;
    const ib = typeof b.index === 'number' ? b.index : parseInt(b.lineid) || 0;
    return ia - ib;
  });

  const firstLine = lines[0] || {};

  // Group lines: L opens a job, subsequent P lines attach to it
  const jobGroups  = [];
  const orphanParts = [];
  let   currentJob  = null;

  for (const line of lines) {
    const type = (line.repair_type || '').toUpperCase();
    if (type === 'L') {
      currentJob = { line, parts: [] };
      jobGroups.push(currentJob);
    } else if (type === 'P') {
      if (currentJob) currentJob.parts.push(buildPart(line, normalizer));
      else            orphanParts.push(buildPart(line, normalizer));
    }
  }

  const repairJobs = jobGroups.map(({ line, parts }) => buildJob(line, parts, normalizer, techEfficiency, rooftop.labor_rate));

  // Financials
  const invoice    = parseInvoice(firstLine.invoice);
  const status     = deriveStatus(dateIn);
  const dateOut    = status === 'closed' ? new Date(dateIn.getTime() + randInt(1, 3) * 86400000) : null;
  const progress   = status === 'closed' ? 100
                   : status === 'approved' ? randInt(30, 75)
                   : status === 'estimate' ? randInt(10, 30)
                   : randInt(0, 15);

  return {
    // ── Identifiers ──────────────────────────────────────────────────────
    ro_number:    roNumber,
    source_id:    srcDoc._id,
    source_coll:  SRC_COLL,

    // ── Chain & Rooftop ──────────────────────────────────────────────────
    chain: {
      id:     CHAIN.id,
      name:   CHAIN.name,
      region: CHAIN.region,
    },
    shop: {
      id:         rooftop.id,
      name:       rooftop.name,
      city:       rooftop.city,
      state:      rooftop.state,
      zip:        rooftop.zip,
      phone:      rooftop.phone,
      labor_rate: rooftop.labor_rate,
    },

    // ── Customer ─────────────────────────────────────────────────────────
    customer: {
      id:    customer.id,
      name:  customer.name,
      phone: customer.phone,
      email: customer.email,
    },

    // ── Staff ────────────────────────────────────────────────────────────
    tech:    { id: tech.id,    name: tech.name    },
    advisor: { id: advisor.id, name: advisor.name },
    bay:     randInt(1, 6),

    // ── Vehicle (from source + VCdb normalization) ───────────────────────────
    // TODO(predii-api): vcdb sub-doc → replace local normalizer with
    //   POST /v1/normalize/ymm { year, make, model } when Predii API is live.
    vehicle: (() => {
      const vcdbResult = vcdb
        ? normalizeVehicle(firstLine.year, firstLine.make, firstLine.model, vcdb)
        : null;
      return {
        year:     firstLine.year     || null,
        make:     firstLine.make     || null,
        model:    firstLine.model    || null,
        odometer: firstLine.odometer || null,
        vcdb:     vcdbResult,
      };
    })(),

    // ── Status & Timeline ────────────────────────────────────────────────
    status,
    kanban_status: KANBAN[status],
    progress,
    date_in:  dateIn.toISOString(),
    date_out: dateOut ? dateOut.toISOString() : null,

    // ── Financials ───────────────────────────────────────────────────────
    invoice,

    // ── Source RO metadata ───────────────────────────────────────────────
    ro_metadata: {
      roId:         srcDoc.roId          || null,
      repairDate:   firstLine.repairDate || null,
      source_file:  firstLine.file       || null,
      codes:        srcDoc.codes         || [],
      symptoms:     srcDoc.symptoms      || [],
      repairs:      srcDoc.repairs       || [],
      p_notes:      srcDoc.p_notes       || [],
      l_notes:      srcDoc.l_notes       || [],
      p_components: srcDoc.p_components  || [],
      components:   srcDoc.components    || [],
    },

    // ── Normalized repair jobs (with associated parts + normalizer fields) ─
    repair_jobs:   repairJobs,
    orphan_parts:  orphanParts,

    // ── Counts ───────────────────────────────────────────────────────────
    job_count:  repairJobs.length,
    part_count: repairJobs.reduce((s, j) => s + j.parts.length, 0) + orphanParts.length,
    line_count: lines.length,

    // ── Vehicle origin (denormalized for ELR bucketing + tech matching) ──
    vehicle_origin: vehicleOrigin(firstLine.make),

    // ── Service category (stratified import tag) ─────────────────────────
    service_category: serviceCategory || null,

    // ── Labor time tracking (ELR) ─────────────────────────────────────────
    labor_time_tracking: (() => {
      const trackedJobs    = repairJobs.filter(j => j.labor_hours > 0);
      const totalFlatHrs   = Math.round(trackedJobs.reduce((s, j) => s + j.labor_hours, 0) * 100) / 100;
      const totalActualHrs = Math.round(trackedJobs.reduce((s, j) => s + (j.actual_labor_hours || j.labor_hours), 0) * 100) / 100;
      const laborRevenue   = Math.round(trackedJobs.reduce((s, j) => s + (j.line_cost || 0), 0) * 100) / 100;
      const elr            = totalActualHrs > 0 ? Math.round(laborRevenue / totalActualHrs * 100) / 100 : 0;
      return { totalFlatHrs, totalActualHrs, elr, postedRate: rooftop.labor_rate, techEfficiency };
    })(),

    // ── Predii Knowledge Graph stub ──────────────────────────────────────
    // TODO(pkg): Replace stub with PKG builder call — scripts/buildKnowledgeGraph.js
    //   Inputs: vehicle.vcdb.base_vehicle_id, repair_jobs[].repair_job,
    //           repair_jobs[].parts[].repair_parts, chain.id, shop.id
    knowledge_graph: {
      status:   'pending',   // pending | building | ready
      ro_id:    roNumber,
      shop_id:  rooftop.id,
      chain_id: CHAIN.id,
      // nodes and edges populated by KG builder
      nodes: [],
      edges: [],
    },

    // ── Declined services ──────────────────────────────────────────────────
    ...(() => {
      const numDeclined = Math.random() < 0.60 ? (Math.random() < 0.4 ? 2 : 1) : 0;
      const shuffled = [...DECLINE_POOL].sort(() => Math.random() - 0.5);
      const declinedServices = shuffled.slice(0, numDeclined).map(d => ({
        opCode:       d.opCode,
        description:  d.description,
        laborHrs:     d.laborHrs,
        laborTotal:   Math.round(d.laborHrs * rooftop.labor_rate * 100) / 100,
        partsCost:    d.partsCost,
        partsCharged: calcPartsCharged(d.partsCost),
        totalIfDone:  Math.round((d.laborHrs * rooftop.labor_rate + calcPartsCharged(d.partsCost)) * 100) / 100,
      }));
      const declinedTotal = Math.round(declinedServices.reduce((s, d) => s + d.totalIfDone, 0) * 100) / 100;
      return { declinedServices, declinedTotal };
    })(),

    // ── Customer enrichment ────────────────────────────────────────────────
    customerVisitCount:   customer.visits || randInt(1, 8),
    customerLoyaltyTier:  loyaltyTier(customer.visits || 1),
    customerApprovalRate: approvalRate(loyaltyTier(customer.visits || 1)),
    comebackRO:           Math.random() < 0.05,

    importedAt: new Date(),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\nWrenchIQ — Repair Order Import (v3)`);
  if (DRY_RUN) console.log('  [DRY RUN — no writes]\n');

  // ── Load normalizers ──────────────────────────────────────────────────────
  console.log('\nStep 1 — Loading Predii Normalizers...');
  const normalizer = buildPartsNormalizer(PARTS_FILE);

  let vcdb = null;
  try {
    vcdb = await loadVCdb(VCDB_DIR);
  } catch (err) {
    console.warn(`  WARNING: VCdb load failed — vehicle.vcdb will be null. (${err.message})`);
  }

  // ── Connect to MongoDB ────────────────────────────────────────────────────
  const srcClient = FROM_CACHE ? null : new MongoClient(SRC_URI, { serverSelectionTimeoutMS: 10000 });
  const dstClient = new MongoClient(DST_URI, { serverSelectionTimeoutMS: 10000 });

  if (!FROM_CACHE) await srcClient.connect();
  if (!DRY_RUN) {
    await dstClient.connect();
  }

  // ── Cache load shortcut ───────────────────────────────────────────────────
  let ros;
  if (FROM_CACHE) {
    if (!existsSync(CACHE_FILE)) {
      console.error(`  Cache file not found: ${CACHE_FILE}`);
      console.error('  Run without --from-cache first, or with --save-cache to generate it.');
      process.exit(1);
    }
    console.log(`\nStep 2-4 — Loading from cache: ${CACHE_FILE}`);
    const lines = readFileSync(CACHE_FILE, 'utf8').trim().split('\n');
    ros = lines.map(l => JSON.parse(l));
    if (LIMIT < ros.length) {
      ros = ros.slice(0, LIMIT);
      console.log(`  Sliced to ${ros.length} ROs (--limit ${LIMIT})`);
    } else {
      console.log(`  Loaded ${ros.length} ROs from cache`);
    }
  }

  const srcColl = FROM_CACHE ? null : srcClient.db(SRC_DB).collection(SRC_COLL);

  if (!FROM_CACHE) {
  console.log(`\nStep 2 — Fetching source data`);
  console.log(`  Source : ${SRC_URI}${SRC_DB}.${SRC_COLL}`);
  if (!DRY_RUN) console.log(`  Dest   : ${DST_URI} → ${DST_DB}.${DST_COLL}`);

  // ── Stratified sampling ───────────────────────────────────────────────────
  // 40,000 from source (5 categories) + 10,000 synthetic factory OEM
  // 60% mechanical (brake+ac+trans+other), 20% maintenance, 20% factory OEM
  // Strata counts scale proportionally when --limit < TARGET
  const scale = LIMIT / TARGET;
  const STRATA = [
    {
      category: 'brake',
      count:    Math.round(10000 * scale),
      keywords: ['disc brake pad', 'brake pad', 'replace disc brake', 'brake rotor',
                 'brake caliper', 'brake fluid', 'brake flush', 'bleed brake'],
    },
    {
      category: 'ac',
      count:    Math.round(6500 * scale),
      keywords: ['refrigerant', 'a/c recharge', 'air condition', 'evaporator',
                 'ac compressor', 'change refrigerant', 'freon'],
    },
    {
      category: 'transmission',
      count:    Math.round(6500 * scale),
      keywords: ['transmission fluid', 'trans fluid', 'atf', 'cvt fluid',
                 'transmission service', 'trans service', 'transmission rebuild'],
    },
    {
      category: 'other_mechanical',
      count:    Math.round(7000 * scale),
      keywords: ['strut replac', 'wheel bearing', 'serpentine belt', 'battery replac',
                 'engine mount', 'tie rod', 'ball joint', 'cv axle', 'fuel pump',
                 'alternator', 'starter replac', 'control arm'],
    },
    {
      category: 'maintenance',
      count:    Math.round(10000 * scale),
      keywords: ['lof service', 'replace engine oil', 'oil change', 'lube oil',
                 'tire rotat', 'multi-point inspect'],
    },
  ];

  const allEntries = []; // { doc, category }

  console.log('  Stratified pull:');
  for (const stratum of STRATA) {
    const orClauses = stratum.keywords.map(kw => ({
      ro_lines: { $elemMatch: { repair_type: 'L', notes: { $regex: kw, $options: 'i' } } },
    }));
    const pipeline = [
      {
        $match: {
          $and: [
            { ro_lines: { $elemMatch: { repair_type: 'P' } } },
            { $or: orClauses },
          ],
        },
      },
      { $sample: { size: stratum.count * 3 } },
    ];

    const docs = [];
    const agg = srcColl.aggregate(pipeline, { allowDiskUse: true, batchSize: BATCH_SIZE });
    for await (const doc of agg) {
      docs.push(doc);
      if (docs.length >= stratum.count) break;
    }
    await agg.close();

    console.log(`    ${stratum.category.padEnd(20)} target:${String(stratum.count).padStart(3)}  fetched:${String(docs.length).padStart(3)}`);
    for (const doc of docs) allEntries.push({ doc, category: stratum.category });
  }

  // Synthetic factory OEM — 30K/45K/60K/75K/90K milestone packages
  const oemCount = Math.round(10000 * scale);
  const oemDocs = buildOEMDocs(oemCount);
  for (const doc of oemDocs) allEntries.push({ doc, category: 'factory_oem' });
  console.log(`    ${'factory_oem'.padEnd(20)} target:${oemCount}  synthetic:${oemCount}`);
  console.log(`\n  Total collected: ${allEntries.length}`);

  if (allEntries.length === 0) {
    console.error('  No eligible ROs found. Aborting.');
    await srcClient.close();
    if (!DRY_RUN) await dstClient.close();
    process.exit(1);
  }

  // ── Build assignment tables ───────────────────────────────────────────────
  console.log('\nStep 3 — Assigning rooftops, customers, dates...');

  const total = allEntries.length;

  // Dates: total dates spread over 12-month window (shifted back for --append)
  const dates = spreadDates(total, WINDOW_START, WINDOW_END);

  // Customers weighted by visits
  const custPool = [];
  for (const c of CUSTOMERS) for (let i = 0; i < c.visits; i++) custPool.push(c);
  // Shuffle custPool
  for (let i = custPool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [custPool[i], custPool[j]] = [custPool[j], custPool[i]];
  }

  // Rooftop assignment: rotate so each shop gets ~total/4 ROs
  const shopSeq = Array.from({ length: total }, (_, i) => ROOFTOPS[i % ROOFTOPS.length]);

  // RO number counters per shop — offset by existing max when appending
  const shopCounters = {};
  for (const s of ROOFTOPS) shopCounters[s.id] = 0;

  if (APPEND && !DRY_RUN) {
    console.log('  Calculating RO counter offsets for append...');
    const dstDb   = dstClient.db(DST_DB);
    const dstColl = dstDb.collection(DST_COLL);
    for (const s of ROOFTOPS) {
      const shopCode = s.city.slice(0, 2).toUpperCase();
      // Find the highest counter used for this shop across any year
      const last = await dstColl.find(
        { 'shop.id': s.id, ro_number: { $regex: `^RO-${shopCode}-` } },
        { projection: { ro_number: 1 } }
      ).sort({ ro_number: -1 }).limit(1).toArray();
      if (last.length > 0) {
        const parts = last[0].ro_number.split('-');
        const counter = parseInt(parts[parts.length - 1]) || 0;
        shopCounters[s.id] = counter;
        console.log(`    ${s.id}: starting counter at ${counter + 1}`);
      }
    }
  }

  const assignments = allEntries.map(({ category }, i) => {
    const rooftop  = shopSeq[i];
    const customer = custPool[i % custPool.length];
    const tech     = pick(TECHNICIANS[rooftop.id]);
    const advisor  = pick(ADVISORS[rooftop.id]);
    const dateIn   = dates[i];
    shopCounters[rooftop.id]++;
    const shopCode = rooftop.city.slice(0, 2).toUpperCase();
    const roNumber = `RO-${shopCode}-${dateIn.getFullYear()}-${String(shopCounters[rooftop.id]).padStart(5, '0')}`;
    return { rooftop, customer, tech, advisor, dateIn, roNumber, roIndex: i + 1, serviceCategory: category };
  });

  // ── Transform ─────────────────────────────────────────────────────────────
  console.log('\nStep 4 — Transforming + normalizing...');
  ros = allEntries.map(({ doc }, i) => transformRO(doc, assignments[i], normalizer, vcdb));

  // Normalizer stats
  let partMatches = 0, partTotal = 0, jobMatches = 0, jobTotal = 0;
  for (const ro of ros) {
    for (const job of ro.repair_jobs) {
      jobTotal++;
      if (job.repair_job) jobMatches++;
      for (const p of job.parts) {
        partTotal++;
        if (p.repair_parts) partMatches++;
      }
    }
    for (const p of ro.orphan_parts) {
      partTotal++;
      if (p.repair_parts) partMatches++;
    }
  }

  const avgJobs  = (ros.reduce((s, r) => s + r.job_count,  0) / ros.length).toFixed(1);
  const avgParts = (ros.reduce((s, r) => s + r.part_count, 0) / ros.length).toFixed(1);

  console.log(`  Avg repair_jobs per RO    : ${avgJobs}`);
  console.log(`  Avg parts per RO          : ${avgParts}`);
  console.log(`  Normalizer — parts matched: ${partMatches}/${partTotal} (${Math.round(partMatches/partTotal*100)}%)`);
  console.log(`  Normalizer — jobs matched : ${jobMatches}/${jobTotal} (${Math.round(jobMatches/jobTotal*100)}%)`);

  // VCdb vehicle match stats
  if (vcdb) {
    const vcdbMatched = ros.filter(r => r.vehicle.vcdb?.base_vehicle_id != null).length;
    const vcdbMethods = {};
    for (const r of ros) {
      const m = r.vehicle.vcdb?.match_method ?? 'no_vcdb';
      vcdbMethods[m] = (vcdbMethods[m] || 0) + 1;
    }
    console.log(`  VCdb — vehicles matched  : ${vcdbMatched}/${ros.length} (${Math.round(vcdbMatched/ros.length*100)}%)`);
    for (const [m, n] of Object.entries(vcdbMethods))
      console.log(`    ${m.padEnd(30)} ${n}`);
  }

  // ── Save cache ─────────────────────────────────────────────────────────────
  if (SAVE_CACHE) {
    const { mkdirSync } = await import('fs');
    mkdirSync(resolve(__dir, 'cache'), { recursive: true });
    writeFileSync(CACHE_FILE, ros.map(r => JSON.stringify(r)).join('\n'), 'utf8');
    console.log(`  Cache saved → ${CACHE_FILE}  (${ros.length} ROs)`);
  }

  } // end if (!FROM_CACHE) — Steps 2–4

  // ── Write ──────────────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample output:');
    const sample = ros[0];
    console.log(JSON.stringify({
      ro_number:    sample.ro_number,
      shop:         sample.shop,
      customer:     sample.customer,
      vehicle:      sample.vehicle,
      status:       sample.status,
      date_in:      sample.date_in,
      invoice:      sample.invoice,
      repair_jobs:  sample.repair_jobs.map(j => ({
        description: j.description?.slice(0, 60),
        repair_job:  j.repair_job,
        parts: j.parts.map(p => ({ description: p.description?.slice(0, 40), repair_parts: p.repair_parts })),
      })),
      knowledge_graph: sample.knowledge_graph,
    }, null, 2));
  } else {
    console.log(`\nStep 5 — Writing to ${DST_DB}.${DST_COLL}...`);
    const dstDb   = dstClient.db(DST_DB);
    const dstColl = dstDb.collection(DST_COLL);

    const existing = await dstColl.estimatedDocumentCount().catch(() => 0);
    if (APPEND) {
      console.log(`  --append mode: keeping existing ${existing} docs.`);
    } else if (existing > 0) {
      await dstColl.drop();
      console.log(`  Dropped existing collection (${existing} docs).`);
    }

    if (!APPEND) await dstDb.createCollection(DST_COLL);
    await Promise.all([
      dstColl.createIndex({ 'ro_number': 1 },                  { unique: true }),
      dstColl.createIndex({ 'chain.id': 1 }),
      dstColl.createIndex({ 'shop.id': 1 }),
      dstColl.createIndex({ 'customer.id': 1 }),
      dstColl.createIndex({ 'vehicle.make': 1 }),
      dstColl.createIndex({ 'vehicle.year': 1 }),
      dstColl.createIndex({ 'status': 1 }),
      dstColl.createIndex({ 'date_in': -1 }),
      dstColl.createIndex({ 'knowledge_graph.status': 1 }),
      dstColl.createIndex({ 'repair_jobs.repair_job': 1 }),
      dstColl.createIndex({ 'repair_jobs.parts.repair_parts': 1 }),
      dstColl.createIndex({ 'vehicle.vcdb.base_vehicle_id': 1 }),
      dstColl.createIndex({ 'vehicle.vcdb.normalized_make': 1 }),
      dstColl.createIndex({ 'vehicle.vcdb.normalized_model': 1 }),
      dstColl.createIndex({ 'vehicle.vcdb.match_method': 1 }),
      dstColl.createIndex({ 'service_category': 1 }),
      dstColl.createIndex({ 'vehicle_origin': 1 }),
      dstColl.createIndex({ 'shop.id': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'service_category': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'vehicle_origin': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'status': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'vehicle.vcdb.normalized_make': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'vehicle.make': 1, 'date_in': -1 }),
      dstColl.createIndex({ 'repair_jobs.repair_job': 1, 'date_in': -1 }),
    ]);
    console.log('  Indexes created.');

    const result = await dstColl.insertMany(ros, { ordered: false });
    console.log(`  Inserted ${result.insertedCount} repair orders.`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n── Summary ──────────────────────────────────────────────');

  const shopCounts     = {};
  const statusCounts   = {};
  const makeCounts     = {};
  const categoryCounts = {};
  for (const ro of ros) {
    shopCounts[ro.shop.city]           = (shopCounts[ro.shop.city]           || 0) + 1;
    statusCounts[ro.status]            = (statusCounts[ro.status]            || 0) + 1;
    const m = ro.vehicle.make || 'Unknown';
    makeCounts[m]                      = (makeCounts[m]                      || 0) + 1;
    const cat = ro.service_category || 'unknown';
    categoryCounts[cat]                = (categoryCounts[cat]                || 0) + 1;
  }

  console.log('\nService category distribution:');
  for (const [cat, n] of Object.entries(categoryCounts))
    console.log(`  ${cat.padEnd(20)} ${String(n).padStart(4)}  (${Math.round(n / ros.length * 100)}%)`);

  console.log('\nROs per rooftop:');
  for (const [city, n] of Object.entries(shopCounts))
    console.log(`  ${city.padEnd(16)} ${n}`);

  console.log('\nStatus distribution:');
  for (const [s, n] of Object.entries(statusCounts))
    console.log(`  ${s.padEnd(12)} ${n}`);

  console.log('\nTop vehicle makes:');
  Object.entries(makeCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .forEach(([m, n]) => console.log(`  ${m.padEnd(16)} ${n}`));

  const dateRange = `${WINDOW_START.toISOString().slice(0,10)} → ${TODAY.toISOString().slice(0,10)}`;
  console.log(`\nDate range : ${dateRange}`);
  console.log(`Chain      : ${CHAIN.name}`);
  console.log(`Total ROs  : ${ros.length}`);
  if (typeof partMatches !== 'undefined')
    console.log(`Normalizer : parts ${partMatches}/${partTotal} matched | jobs ${jobMatches}/${jobTotal} matched`);
  console.log(`Source     : ${SRC_URI}${SRC_DB}.${SRC_COLL}`);
  if (!DRY_RUN) console.log(`Dest       : ${DST_URI} → ${DST_DB}.${DST_COLL}`);
  console.log('\nDone.\n');

  await srcClient.close();
  if (!DRY_RUN) await dstClient.close();
}

run().catch(err => {
  console.error('\nImport failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
