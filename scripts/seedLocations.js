/**
 * WrenchIQ — 4-Location 90-Day Seed Script (AE-947)
 *
 * Seeds ~270 closed ROs per location across 4 Peninsula Precision Auto shops.
 * All dates are already in the last 90 days relative to seed time — no rebasing needed.
 *
 * Usage:
 *   node scripts/seedLocations.js              # seeds all 4 locations (append)
 *   node scripts/seedLocations.js --reset      # drops ROs for these shopIds, re-seeds
 *   node scripts/seedLocations.js --location loc-002   # seeds only Sunnyvale
 *   node scripts/seedLocations.js --list       # shows what would be seeded
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

// ── CLI args ──────────────────────────────────────────────────────────────────
const args     = process.argv.slice(2);
const RESET    = args.includes('--reset');
const LIST     = args.includes('--list');
const locArg   = args.indexOf('--location');
const ONLY_LOC = locArg >= 0 ? args[locArg + 1] : null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';
const ROS_PER_LOC = 270; // ~3/day × 90 days

// ── Vehicle origin classification ─────────────────────────────────────────────
const JAPANESE_MAKES = new Set([
  'Toyota','Honda','Nissan','Mazda','Subaru','Mitsubishi','Lexus','Acura','Infiniti','Scion',
]);
const GERMAN_MAKES = new Set([
  'BMW','Mercedes-Benz','Audi','Volkswagen','Porsche',
]);
const DOMESTIC_MAKES = new Set([
  'Ford','Chevrolet','GMC','Dodge','Ram','Jeep','Chrysler','Cadillac',
  'Buick','Lincoln','Tesla','Rivian','Lucid',
]);

function vehicleOriginFromMake(make) {
  if (!make) return 'OTHER';
  if (JAPANESE_MAKES.has(make)) return 'JAPANESE';
  if (GERMAN_MAKES.has(make))   return 'GERMAN';
  if (DOMESTIC_MAKES.has(make)) return 'DOMESTIC_US';
  return 'OTHER';
}

// ── Location definitions ──────────────────────────────────────────────────────
const LOCATIONS = [
  {
    id: 'loc-001', shopId: 'shop-001',
    name: 'Peninsula Precision Auto — Palo Alto',
    city: 'Palo Alto', laborRate: 195, targetElr: 185, targetAvgRO: 487,
    technicians: [
      { id:'tech-pa-001', name:'James Kowalski', initials:'JK', specialty:'European Imports', rate: 65, efficiency: 0.96 },
      { id:'tech-pa-002', name:'Mike Reeves',    initials:'MR', specialty:'Honda / Toyota',   rate: 58, efficiency: 0.85 },
      { id:'tech-pa-003', name:'Carlos Mendez',  initials:'CM', specialty:'Ford / Subaru',    rate: 52, efficiency: 0.92 },
      { id:'tech-pa-004', name:'Lisa Nguyen',    initials:'LN', specialty:'Maintenance',      rate: 48, efficiency: 0.78 },
    ],
    advisors: [
      { id:'adv-pa-001', name:'Tilak Kasturi',  initials:'TK' },
      { id:'adv-pa-002', name:'Rachel Torres',  initials:'RT' },
    ],
    // 25% Toyota/Honda/Lexus, 30% German, 20% Tesla/EV, 25% other
    makePool: [
      ...Array(9).fill('Toyota'), ...Array(7).fill('Honda'),  ...Array(5).fill('Lexus'),
      ...Array(9).fill('BMW'),    ...Array(7).fill('Mercedes-Benz'), ...Array(6).fill('Audi'), ...Array(3).fill('Porsche'),
      ...Array(10).fill('Tesla'), ...Array(4).fill('Rivian'),
      ...Array(4).fill('Subaru'), ...Array(4).fill('Ford'), ...Array(3).fill('Chevrolet'),
      ...Array(3).fill('Mazda'),  ...Array(3).fill('Nissan'), ...Array(3).fill('Volkswagen'),
    ],
  },
  {
    id: 'loc-002', shopId: 'shop-002',
    name: 'Peninsula Precision Auto — Sunnyvale',
    city: 'Sunnyvale', laborRate: 175, targetElr: 165, targetAvgRO: 341,
    technicians: [
      { id:'tech-sv-001', name:'Diego Hernandez', initials:'DH', specialty:'Toyota/Honda',    rate: 50, efficiency: 0.88 },
      { id:'tech-sv-002', name:'Alice Park',       initials:'AP', specialty:'Maintenance',    rate: 44, efficiency: 0.82 },
      { id:'tech-sv-003', name:'Brian Okafor',     initials:'BO', specialty:'Diagnostics',    rate: 53, efficiency: 0.91 },
      { id:'tech-sv-004', name:'Mei Lin',           initials:'ML', specialty:'Asian Imports', rate: 46, efficiency: 0.85 },
    ],
    advisors: [
      { id:'adv-sv-001', name:'Sandra Kim',  initials:'SK' },
      { id:'adv-sv-002', name:'Tony Perez',  initials:'TP' },
    ],
    // 45% Toyota/Honda/Nissan, 15% German, 10% domestic, 30% other Asian
    makePool: [
      ...Array(18).fill('Toyota'), ...Array(14).fill('Honda'), ...Array(7).fill('Nissan'),
      ...Array(5).fill('Mazda'),   ...Array(4).fill('Subaru'), ...Array(4).fill('Lexus'), ...Array(3).fill('Acura'),
      ...Array(4).fill('BMW'),     ...Array(3).fill('Volkswagen'), ...Array(3).fill('Mercedes-Benz'),
      ...Array(4).fill('Ford'),    ...Array(3).fill('Chevrolet'),
      ...Array(3).fill('Kia'),     ...Array(3).fill('Hyundai'), ...Array(3).fill('Infiniti'),
      ...Array(3).fill('Mitsubishi'),
    ],
  },
  {
    id: 'loc-003', shopId: 'shop-003',
    name: 'Peninsula Precision Auto — Mountain View',
    city: 'Mountain View', laborRate: 185, targetElr: 175, targetAvgRO: 412,
    technicians: [
      { id:'tech-mv-001', name:'Eric Johansson', initials:'EJ', specialty:'European/Domestic', rate: 56, efficiency: 0.90 },
      { id:'tech-mv-002', name:'Nina Santos',    initials:'NS', specialty:'Toyota/Honda',      rate: 50, efficiency: 0.86 },
      { id:'tech-mv-003', name:'Omar Rashid',    initials:'OR', specialty:'Diagnostics',       rate: 54, efficiency: 0.93 },
      { id:'tech-mv-004', name:'Kim Watanabe',   initials:'KW', specialty:'Maintenance',       rate: 46, efficiency: 0.79 },
      { id:'tech-mv-005', name:'Fred Collins',   initials:'FC', specialty:'Suspension/Brakes', rate: 52, efficiency: 0.88 },
    ],
    advisors: [
      { id:'adv-mv-001', name:'Laura Chen',  initials:'LC' },
      { id:'adv-mv-002', name:'Marcus Webb', initials:'MW' },
    ],
    // 35% Toyota/Honda, 20% German, 15% domestic, 30% mixed
    makePool: [
      ...Array(13).fill('Toyota'), ...Array(11).fill('Honda'), ...Array(5).fill('Lexus'),
      ...Array(3).fill('Mazda'),   ...Array(3).fill('Acura'),
      ...Array(6).fill('BMW'),     ...Array(5).fill('Audi'),   ...Array(4).fill('Mercedes-Benz'), ...Array(2).fill('Volkswagen'),
      ...Array(5).fill('Ford'),    ...Array(5).fill('Chevrolet'), ...Array(3).fill('Tesla'),
      ...Array(4).fill('Subaru'),  ...Array(3).fill('Nissan'), ...Array(3).fill('Hyundai'),
    ],
  },
  {
    id: 'loc-004', shopId: 'shop-004',
    name: 'Peninsula Precision Auto — Menlo Park',
    city: 'Menlo Park', laborRate: 190, targetElr: 180, targetAvgRO: 456,
    technicians: [
      { id:'tech-mp-001', name:'Trevor Hayes', initials:'TH', specialty:'Tesla/EV',         rate: 60, efficiency: 0.94 },
      { id:'tech-mp-002', name:'Grace Obi',    initials:'GO', specialty:'European Imports', rate: 58, efficiency: 0.89 },
      { id:'tech-mp-003', name:'Sam Trevino',  initials:'ST', specialty:'Toyota/Honda',     rate: 52, efficiency: 0.87 },
      { id:'tech-mp-004', name:'Priya Iyer',   initials:'PI', specialty:'Maintenance',      rate: 46, efficiency: 0.80 },
    ],
    advisors: [
      { id:'adv-mp-001', name:'Ryan Scott',   initials:'RS' },
      { id:'adv-mp-002', name:'Diane Flores', initials:'DF' },
    ],
    // 30% Toyota/Honda, 20% German, 25% Tesla, 25% mixed
    makePool: [
      ...Array(12).fill('Toyota'), ...Array(8).fill('Honda'),  ...Array(5).fill('Lexus'),
      ...Array(6).fill('BMW'),     ...Array(5).fill('Mercedes-Benz'), ...Array(4).fill('Audi'), ...Array(2).fill('Porsche'),
      ...Array(13).fill('Tesla'),  ...Array(3).fill('Rivian'),
      ...Array(4).fill('Subaru'),  ...Array(4).fill('Mazda'),  ...Array(3).fill('Ford'),
      ...Array(3).fill('Volkswagen'), ...Array(3).fill('Nissan'), ...Array(2).fill('Chevrolet'),
    ],
  },
];

// ── Service name templates (used for decorating ROs, not driving revenue) ────
const SERVICE_NAMES_BY_REVENUE = {
  low: [   // $50-200
    'Engine Oil & Filter Change (Synthetic)',
    'Oil Change + Tire Rotation + Inspection',
    'Cabin Air Filter Replacement',
    'Wiper Blade Replacement + Fluid Top-Off',
    'Battery Load Test & Replacement',
    'Tire Rotation & Pressure Adjustment',
    'Multi-Point Safety Inspection',
    'Air Filter + Cabin Filter Service',
  ],
  mid: [   // $200-500
    'Front Brake Pads & Rotors',
    'Check Engine Light Diagnostic & Repair',
    'A/C System Service & Recharge',
    'Transmission Fluid Exchange',
    'Cooling System Flush & Thermostat',
    'Front Brakes + Alignment',
    'Battery Replacement + Electrical Check',
    'Suspension Inspection & Sway Bar Links',
    'Wheel Bearing Replacement (LF/RF)',
    'Spark Plug Set Replacement',
  ],
  high: [  // $500-1100
    '60K Mile Major Service Package',
    'Timing Belt / Water Pump Package',
    'Full Brake Overhaul (4-Wheel)',
    'Suspension Overhaul + Alignment',
    'Engine Diagnostic & Valve Cover Gasket',
    'AC Compressor Replacement',
    'Strut Assembly + Alignment Package',
    'Pre-Purchase Inspection + Oil Service',
    'EV Health Check + Brake Service Package',
    'Rear Differential + Transmission Service',
  ],
};

// ── Customer name pools ───────────────────────────────────────────────────────
const FIRST_NAMES = [
  'James','Sarah','David','Monica','Jennifer','Carlos','Emily','Kevin','Rachel','Marcus',
  'Lisa','Angela','Robert','Priya','Tom','Alice','Brian','Diana','Eric','Hector',
  'Nina','Omar','Kim','Fred','Trevor','Grace','Sam','Ryan','Laura','Sandra',
  'Tony','Diego','Mei','Ravi','Akira','Sofia','Lucas','Maria','Ethan','Aisha',
  'Noah','Yuki','Ben','Claire','Raj','Nadia','Kyle','Jordan','Casey','Morgan',
];
const LAST_NAMES = [
  'Chen','Kim','Rodriguez','Park','Martinez','Taylor','Sharma','Wallace','Johnson','Green',
  'Nguyen','Torres','Hernandez','Santos','Rashid','Watanabe','Collins','Iyer','Hayes','Obi',
  'Trevino','Scott','Flores','Webb','Lin','Johansson','Perez','Reeves','Mendez','Chang',
  'Wu','Patel','Gupta','Singh','Lee','Yamamoto','Garcia','Lopez','Brown','Davis',
  'Wilson','Moore','Anderson','Jackson','White','Thomas','Harris','Martin','Clark','Lewis',
];

// ── Vehicle model pools per make ──────────────────────────────────────────────
const VEHICLE_MODELS = {
  'Toyota':        [['Camry',2019,2023],['RAV4',2019,2023],['Corolla',2019,2022],['Highlander',2020,2023],['Tacoma',2019,2022],['Sienna',2020,2023]],
  'Honda':         [['Accord',2019,2023],['CR-V',2019,2023],['Civic',2019,2023],['Pilot',2020,2023],['HR-V',2020,2023]],
  'BMW':           [['3 Series',2019,2023],['5 Series',2019,2022],['X3',2020,2023],['X5',2019,2022],['330i',2020,2023]],
  'Mercedes-Benz': [['C-Class',2019,2022],['E-Class',2019,2022],['GLC',2020,2023],['GLE',2020,2022]],
  'Audi':          [['A4',2019,2022],['Q5',2020,2023],['Q7',2019,2022],['A6',2020,2022]],
  'Tesla':         [['Model 3',2020,2024],['Model Y',2020,2024],['Model S',2019,2022],['Model X',2019,2022]],
  'Rivian':        [['R1T',2022,2024],['R1S',2022,2024]],
  'Lexus':         [['RX',2020,2023],['ES',2019,2022],['NX',2020,2023],['IS',2019,2022]],
  'Subaru':        [['Outback',2019,2023],['Forester',2019,2022],['Impreza',2019,2022],['Crosstrek',2020,2023]],
  'Mazda':         [['CX-5',2020,2023],['Mazda3',2019,2022],['CX-9',2020,2022]],
  'Nissan':        [['Altima',2019,2022],['Rogue',2020,2023],['Sentra',2020,2022],['Pathfinder',2020,2022]],
  'Volkswagen':    [['Jetta',2019,2022],['Tiguan',2020,2023],['Atlas',2020,2022]],
  'Porsche':       [['Cayenne',2019,2022],['Macan',2020,2023]],
  'Ford':          [['F-150',2020,2023],['Mustang',2019,2022],['Explorer',2020,2022],['Escape',2020,2023]],
  'Chevrolet':     [['Silverado 1500',2020,2023],['Equinox',2020,2023],['Malibu',2019,2021]],
  'Hyundai':       [['Tucson',2020,2023],['Sonata',2020,2022],['Santa Fe',2020,2023]],
  'Acura':         [['MDX',2020,2023],['RDX',2020,2023]],
  'Kia':           [['Telluride',2020,2023],['Sportage',2021,2023],['Sorento',2021,2023]],
  'Infiniti':      [['Q50',2019,2022],['QX60',2020,2022]],
  'Mitsubishi':    [['Outlander',2020,2023],['Eclipse Cross',2020,2022]],
};

// ── Declined services pool ────────────────────────────────────────────────────
const DECLINE_POOL = [
  { name:'Engine Air Filter Replacement',  estimatedCost: 72  },
  { name:'Cabin Air Filter Replacement',   estimatedCost: 65  },
  { name:'Transmission Fluid Exchange',    estimatedCost: 240 },
  { name:'Coolant System Flush',           estimatedCost: 175 },
  { name:'Brake Fluid Flush',              estimatedCost: 110 },
  { name:'Wiper Blade Replacement',        estimatedCost: 55  },
  { name:'Fuel Injector Cleaning Service', estimatedCost: 188 },
  { name:'PCV Valve & Hose Replacement',   estimatedCost: 92  },
  { name:'Power Steering Flush',           estimatedCost: 120 },
  { name:'Differential Fluid Service',     estimatedCost: 158 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick  = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Box-Muller normal distribution
function randNormal(mean, stddev) {
  let u, v;
  do { u = Math.random(); } while (u === 0);
  do { v = Math.random(); } while (v === 0);
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * stddev;
}

// Generate a target total revenue for this RO using a normal distribution
// centered on the location's targetAvgRO, with stddev = avg * 0.42
function targetRevenue(loc) {
  const mean   = loc.targetAvgRO;
  const stddev = mean * 0.42;
  let v;
  do { v = Math.round(randNormal(mean, stddev)); }
  while (v < 60 || v > mean * 3); // clamp to realistic range
  return v;
}

// Build service lines that sum to approximately the target revenue
// by working backwards from the target
function buildServices(targetTotal, laborRate) {
  const LABOR_FRACTION = 0.50 + Math.random() * 0.18; // 50-68% of ticket is labor
  const targetLabor = Math.round(targetTotal * LABOR_FRACTION);
  const targetParts = targetTotal - targetLabor;

  // Determine number of service lines: $60-200 = 1-2 lines, $200-500 = 2-4, $500+ = 3-6
  let numLines;
  if      (targetTotal < 200) numLines = randInt(1, 2);
  else if (targetTotal < 500) numLines = randInt(2, 4);
  else                        numLines = randInt(3, 6);

  // Pick a service name from the appropriate tier
  let nameTier;
  if      (targetTotal < 200) nameTier = 'low';
  else if (targetTotal < 500) nameTier = 'mid';
  else                        nameTier = 'high';

  const mainServiceName = pick(SERVICE_NAMES_BY_REVENUE[nameTier]);

  // Distribute labor and parts evenly across lines with jitter
  const lines = [];
  let laborRemaining = targetLabor;
  let partsRemaining = targetParts;

  for (let i = 0; i < numLines; i++) {
    const isLast = i === numLines - 1;
    const lf = isLast ? 1.0 : (0.3 + Math.random() * 0.5) * (1 / (numLines - i));
    const lineLabor = isLast ? laborRemaining : Math.round(laborRemaining * lf);
    const lineParts = isLast ? partsRemaining : Math.round(partsRemaining * lf);
    const laborHrs  = Math.round((lineLabor / laborRate) * 100) / 100;
    const actualHrs = laborHrs === 0 ? 0 : Math.round(laborHrs * (0.85 + Math.random() * 0.30) * 100) / 100;

    lines.push({
      lineNumber: i + 1,
      name:       i === 0 ? mainServiceName : (nameTier === 'high' ? 'Additional Service & Parts' : 'Labor & Parts'),
      laborHrs,
      actualHrs,
      laborRate,
      laborCost:  lineLabor,
      partsCost:  lineParts,
      status:     'completed',
    });

    laborRemaining -= lineLabor;
    partsRemaining -= lineParts;
  }

  return lines;
}

function buildVehicle(make, locationId, roSeq) {
  const pool = VEHICLE_MODELS[make];
  if (!pool) {
    return { year: 2020, make, model: 'Vehicle', vin: `VIN${String(roSeq).padStart(14,'0')}` };
  }
  const [model, minYear, maxYear] = pick(pool);
  const year    = randInt(minYear, maxYear);
  const vinBase = `${locationId.replace(/-/g,'').toUpperCase()}${year}${String(roSeq).padStart(6,'0')}`;
  const vin     = vinBase.slice(0, 17).padEnd(17, '0');
  return { year, make, model, vin };
}

// ── Generate a single RO ──────────────────────────────────────────────────────
function generateRO(loc, seqNum, custNum, dateIn) {
  const tech    = pick(loc.technicians);
  const advisor = pick(loc.advisors);
  const make    = pick(loc.makePool);
  const vehicle = buildVehicle(make, loc.id, seqNum);

  const ageYears  = new Date().getFullYear() - vehicle.year;
  const mileage   = Math.round((8500 + Math.random() * 11000) * Math.max(1, ageYears) + Math.random() * 4000);

  // Revenue driven by distribution around target avg
  const totalRevenue  = targetRevenue(loc);
  const laborRevenue  = Math.round(totalRevenue * (0.50 + Math.random() * 0.18) * 100) / 100;
  const partsRevenue  = Math.round((totalRevenue - laborRevenue) * 100) / 100;
  const taxAmount     = Math.round(partsRevenue * 0.0875 * 100) / 100;

  const services = buildServices(totalRevenue, loc.laborRate);

  const totalFlatHrs   = Math.round(services.reduce((s, l) => s + l.laborHrs, 0) * 100) / 100;
  const totalActualHrs = Math.round(services.reduce((s, l) => s + l.actualHrs, 0) * 100) / 100;
  const laborCostShop  = Math.round(services.reduce((s, l) => s + l.actualHrs * tech.rate, 0) * 100) / 100;
  const elr = totalActualHrs > 0
    ? Math.round((laborRevenue / totalActualHrs) * 100) / 100
    : loc.laborRate;

  const grossMarginPct = totalRevenue > 0
    ? Math.min(58, Math.max(42, Math.round(((totalRevenue - laborCostShop) / totalRevenue) * 1000) / 10))
    : 50;

  // Declined services: ~35% of ROs have 1-2 declined items
  const declinedServices = [];
  if (Math.random() < 0.35) {
    const numDeclined = Math.random() < 0.4 ? 2 : 1;
    const pool = [...DECLINE_POOL];
    for (let d = 0; d < numDeclined; d++) {
      const idx = Math.floor(Math.random() * pool.length);
      declinedServices.push(pool.splice(idx, 1)[0]);
    }
  }

  const upsellFlag      = declinedServices.length > 0;
  const upsellConverted = upsellFlag && Math.random() < 0.40;

  const closedDate = new Date(dateIn.getTime() + (Math.random() < 0.8 ? 0 : 86400000));

  const fn = pick(FIRST_NAMES);
  const ln = pick(LAST_NAMES);

  return {
    id:          `RO-${loc.shopId}-${dateIn.getFullYear()}-${String(seqNum).padStart(4, '0')}`,
    shopId:      loc.shopId,
    locationId:  loc.id,
    locationName: loc.name,
    status:      'closed',
    dateIn:      dateIn.toISOString(),
    closedDate:  closedDate.toISOString(),
    bay:         randInt(1, 6),

    techId:       tech.id,
    techName:     tech.name,
    techInitials: tech.initials,
    advisorId:    advisor.id,
    advisorName:  advisor.name,

    customerId:   `cust-${loc.id}-${String(custNum).padStart(3, '0')}`,
    customerName: `${fn} ${ln}`,

    vehicle: {
      year:    vehicle.year,
      make:    vehicle.make,
      model:   vehicle.model,
      vin:     vehicle.vin,
      mileage,
    },
    vehicleOrigin: vehicleOriginFromMake(make),

    services,
    declinedServices,
    upsellFlag,
    upsellConverted,

    laborTimeTracking: {
      totalFlatHrs,
      totalActualHrs,
      elr,
      postedRate: loc.laborRate,
    },

    grossMarginPct,
    totalRevenue,
    partsRevenue,
    laborRevenue,
    taxAmount,

    createdAt: dateIn.toISOString(),
    updatedAt: closedDate.toISOString(),
  };
}

// ── Generate all ROs for a location ──────────────────────────────────────────
function generateLocationROs(loc) {
  const now          = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const ros          = [];
  let   custSeq      = 1;

  for (let i = 0; i < ROS_PER_LOC; i++) {
    // Spread dates randomly across last 90 days, skip Sundays
    let dateIn;
    do {
      dateIn = new Date(now - Math.random() * ninetyDaysMs);
    } while (dateIn.getDay() === 0);

    ros.push(generateRO(loc, i + 1, custSeq, dateIn));

    // Advance customer sequence (simulate ~35% repeat visits)
    if (Math.random() < 0.65) custSeq++;
  }

  return ros;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const locationsToSeed = ONLY_LOC
    ? LOCATIONS.filter(l => l.id === ONLY_LOC)
    : LOCATIONS;

  if (ONLY_LOC && locationsToSeed.length === 0) {
    console.error(`Unknown location: ${ONLY_LOC}`);
    console.error(`Valid IDs: ${LOCATIONS.map(l => l.id).join(', ')}`);
    process.exit(1);
  }

  // ── --list mode ────────────────────────────────────────────────────────────
  if (LIST) {
    console.log('\nLocations available to seed:\n');
    for (const loc of LOCATIONS) {
      const mark = (!ONLY_LOC || loc.id === ONLY_LOC) ? '*' : ' ';
      console.log(`  ${mark} ${loc.id}  ${loc.city.padEnd(15)} shopId=${loc.shopId}  laborRate=$${loc.laborRate}  targetAvgRO=$${loc.targetAvgRO}  techs=${loc.technicians.length}`);
    }
    console.log(`\n  Total ROs if all seeded: ${LOCATIONS.length * ROS_PER_LOC}\n`);
    return;
  }

  // ── Connect ────────────────────────────────────────────────────────────────
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  const db   = client.db(DB_NAME);
  const coll = db.collection(COLLECTION);
  console.log(`\nConnected to MongoDB (db: ${DB_NAME})`);

  // ── --reset: remove existing docs for targeted shopIds ───────────────────
  if (RESET) {
    const shopIds = locationsToSeed.map(l => l.shopId);
    const deleted = await coll.deleteMany({ shopId: { $in: shopIds } });
    console.log(`  Removed ${deleted.deletedCount} existing ROs for shopIds: ${shopIds.join(', ')}`);
  }

  // ── Ensure indexes ────────────────────────────────────────────────────────
  await db.createCollection(COLLECTION).catch(() => {});
  await coll.createIndex({ id: 1 },         { unique: true }).catch(() => {});
  await coll.createIndex({ shopId: 1 }).catch(() => {});
  await coll.createIndex({ locationId: 1 }).catch(() => {});
  await coll.createIndex({ dateIn: -1 }).catch(() => {});
  await coll.createIndex({ status: 1 }).catch(() => {});

  // ── Generate & insert per location ───────────────────────────────────────
  let totalInserted = 0;
  const summary     = [];

  for (const loc of locationsToSeed) {
    const ros = generateLocationROs(loc);

    const result = await coll.insertMany(ros, { ordered: false }).catch(err => {
      if (err.code === 11000) {
        const n = err.result?.insertedCount ?? err.result?.nInserted ?? 0;
        console.warn(`  ${loc.city}: ${n} inserted; some duplicate IDs skipped.`);
        return { insertedCount: n };
      }
      throw err;
    });

    const inserted = result.insertedCount;
    const revenues = ros.map(r => r.totalRevenue);
    const avgRO    = Math.round(revenues.reduce((s, v) => s + v, 0) / revenues.length);
    const dates    = ros.map(r => new Date(r.dateIn)).sort((a, b) => a - b);
    const minDate  = dates[0].toISOString().slice(0, 10);
    const maxDate  = dates[dates.length - 1].toISOString().slice(0, 10);

    summary.push({ loc, inserted, avgRO, minDate, maxDate });
    totalInserted += inserted;
    console.log(`Seeded ${loc.id} (${loc.city}): ${inserted} ROs, avg $${avgRO}, date range ${minDate} → ${maxDate}`);
  }

  console.log(`\nTotal: ${totalInserted} ROs inserted`);

  // ── Variance warning ───────────────────────────────────────────────────────
  for (const s of summary) {
    const diff = Math.abs(s.avgRO - s.loc.targetAvgRO);
    if (diff > 50) {
      console.warn(`  Warning: ${s.loc.city} avg $${s.avgRO} is $${diff} from target $${s.loc.targetAvgRO}`);
    }
  }

  await client.close();
}

main().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
