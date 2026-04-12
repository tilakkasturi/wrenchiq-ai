/**
 * WrenchIQ — One-Time Production Import
 *
 * Reads from: repair_smith_prod-PDRMS-Cluster-Production-Backup.repair_orders
 * Writes to:  wrenchiq.RepairOrder
 *
 * Strategy:
 *  1. Stream a date-bounded window of line items (using _timestamp index)
 *  2. Group by fileName (= unique RO identifier) in memory
 *  3. Keep ROs with 4+ service lines
 *  4. Sample 100 of them, assign our 25 demo customers, spread dates 3 years
 *  5. Insert into wrenchiq.RepairOrder
 *
 * Usage:
 *   node scripts/importFromProd.js
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

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://172.16.80.7:27017';
const SRC_DB      = 'repair_smith_prod-PDRMS-Cluster-Production-Backup';
const SRC_COLL    = 'repair_orders';
const DST_DB      = process.env.MONGODB_DB || 'wrenchiq';
const DST_COLL    = 'RepairOrder';

const TARGET_ROS      = 100;
const MIN_LINES       = 4;
const SCAN_BATCH_SIZE = 50000;   // line items to scan per pass
const SHOP_ID_FILTER  = null;    // set to a string like "1033028" to limit to one shop

// ── 25 Demo Customers ─────────────────────────────────────────────────────────
const CUSTOMERS = [
  { id:'cust-001', name:'Sarah Chen',        phone:'(650) 555-0101', email:'sarah.chen@stanford.edu',      visits:10 },
  { id:'cust-002', name:'David Kim',         phone:'(408) 555-0102', email:'david.kim@google.com',         visits:9  },
  { id:'cust-003', name:'Monica Rodriguez',  phone:'(650) 555-0103', email:'monica@venturebloom.io',       visits:7  },
  { id:'cust-004', name:'James Park',        phone:'(650) 555-0104', email:'james.park@sequoiacap.com',    visits:7  },
  { id:'cust-005', name:'Angela Martinez',   phone:'(650) 555-0105', email:'a.martinez@pausd.org',         visits:6  },
  { id:'cust-006', name:'Robert Taylor',     phone:'(650) 555-0106', email:'rtaylor.retired@gmail.com',    visits:6  },
  { id:'cust-007', name:'Priya Sharma',      phone:'(408) 555-0107', email:'priya.sharma@apple.com',       visits:5  },
  { id:'cust-008', name:'Tom Wallace',       phone:'(650) 555-0108', email:'twallace@wflaw.com',           visits:5  },
  { id:'cust-009', name:'Lisa Chen',         phone:'(415) 555-0109', email:'lchen@cisco.com',              visits:4  },
  { id:'cust-010', name:'Kevin Park',        phone:'(650) 555-0110', email:'kevin.park@salesforce.com',    visits:5  },
  { id:'cust-011', name:'Rachel Green',      phone:'(650) 555-0111', email:'rgreen.pa@gmail.com',          visits:4  },
  { id:'cust-012', name:'Marcus Johnson',    phone:'(408) 555-0112', email:'mjohnson@netflix.com',         visits:5  },
  { id:'cust-013', name:'Jennifer Kim',      phone:'(650) 555-0113', email:'jkim.menlopark@gmail.com',     visits:3  },
  { id:'cust-014', name:'Carlos Ruiz',       phone:'(408) 555-0114', email:'cruiz.sj@gmail.com',           visits:3  },
  { id:'cust-015', name:'Emily Zhang',       phone:'(408) 555-0115', email:'ezhang@adobe.com',             visits:3  },
  { id:'cust-016', name:'Nathan Hill',       phone:'(650) 555-0116', email:'nhill.rw@gmail.com',           visits:2  },
  { id:'cust-017', name:'Stephanie Lee',     phone:'(408) 555-0117', email:'slee.sunnyvale@gmail.com',     visits:2  },
  { id:'cust-018', name:'Brian Murphy',      phone:'(650) 555-0118', email:'bmurphy.redwoodcity@gmail.com',visits:2  },
  { id:'cust-019', name:'Yasmine Hassan',    phone:'(408) 555-0119', email:'yhassan@linkedin.com',         visits:2  },
  { id:'cust-020', name:'Christopher Young', phone:'(650) 555-0120', email:'cyoung.atherton@gmail.com',    visits:2  },
  { id:'cust-021', name:'Melissa Turner',    phone:'(408) 555-0121', email:'mturner.lv@gmail.com',         visits:3  },
  { id:'cust-022', name:'Jason White',       phone:'(650) 555-0122', email:'jwhite@tesla.com',             visits:2  },
  { id:'cust-023', name:'Laura Martinez',    phone:'(408) 555-0123', email:'lmartinez.mv@gmail.com',       visits:1  },
  { id:'cust-024', name:'Daniel Brown',      phone:'(650) 555-0124', email:'dbrown@oracle.com',            visits:1  },
  { id:'cust-025', name:'Ashley Taylor',     phone:'(408) 555-0125', email:'ataylor.cupertino@gmail.com',  visits:1  },
];

const TECHNICIANS = [
  { id:'tech-001', name:'James Kowalski', efficiency: 0.96, rate: 65 },
  { id:'tech-002', name:'Mike Reeves',    efficiency: 0.85, rate: 58 },
  { id:'tech-003', name:'Carlos Mendez',  efficiency: 0.92, rate: 52 },
  { id:'tech-004', name:'Lisa Nguyen',    efficiency: 0.78, rate: 48 },
];
const ADVISORS = [
  { id:'adv-001', name:'Tilak Kasturi' },
  { id:'adv-002', name:'Rachel Torres' },
];

// ── Vehicle origin classification ─────────────────────────────────────────────
const JAPANESE_MAKES = new Set([
  'Toyota','Honda','Nissan','Mazda','Subaru','Mitsubishi','Lexus','Acura','Infiniti','Scion','Isuzu',
]);
const GERMAN_MAKES = new Set([
  'BMW','Mercedes-Benz','Audi','Volkswagen','Porsche','Opel','Smart',
]);

function vehicleOriginFromMake(make) {
  if (!make) return 'OTHER';
  if (JAPANESE_MAKES.has(make)) return 'JAPANESE';
  if (GERMAN_MAKES.has(make))   return 'GERMAN';
  if (['Ford','Chevrolet','GMC','Dodge','Ram','Jeep','Chrysler','Cadillac',
       'Buick','Lincoln','Tesla','Rivian','Lucid','Pontiac','Saturn'].includes(make)) return 'DOMESTIC_US';
  return 'OTHER';
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

// ── Parts markup: 40-70% depending on cost tier ───────────────────────────────
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

// ── Helpers ──────────────────────────────────────────────────────────────────
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}

/** Spread `count` dates over [start..end] with slight random jitter */
function spreadDates(count, start, end) {
  const span = end - start;
  const seg  = span / count;
  const out  = [];
  for (let i = 0; i < count; i++) {
    const base   = start + seg * (i + 0.5);
    const jitter = (Math.random() - 0.5) * 20 * 86400000; // ±10 days
    const d = new Date(Math.max(start, Math.min(end, base + jitter)));
    // push off weekend
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    out.push(d);
  }
  return out.sort((a, b) => a - b);
}

/** Generate a plausible-looking 17-char VIN from year+make */
function syntheticVin(year, make) {
  const WMI = { Toyota:'4T1', Honda:'1HG', Ford:'1FT', Chevrolet:'1GC', BMW:'WBA',
                Dodge:'1C3', Nissan:'1N4', Subaru:'4S4', Jeep:'1J4', Hyundai:'5NP',
                Mazda:'JM3', Volkswagen:'3VW', Tesla:'5YJ', Kia:'5XY', Audi:'WAU',
                GMC:'1GT', Ram:'1C6', Chrysler:'2C3', Cadillac:'1G6', Lexus:'JTH',
                Acura:'19U', Infiniti:'JNK', Mercedes:'WDD', Volvo:'YV1',
              };
  const wmi   = WMI[make] || '1ZZ';
  const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ0123456789';
  const rand9 = Array.from({length:9}, () => chars[randInt(0, chars.length-1)]).join('');
  const yChar = { 2018:'J', 2019:'K', 2020:'L', 2021:'M', 2022:'N', 2023:'P', 2024:'R', 2025:'S' };
  const yr    = yChar[year] || 'M';
  return (wmi + rand9 + yr + chars[randInt(0,chars.length-1)]).slice(0, 17).padEnd(17, '0');
}

function statusToKanban(status) {
  return { open:'checked_in', estimate:'estimate_sent', approved:'in_progress', closed:'ready' }[status];
}

/** Build a wrenchiq RepairOrder document from source line-item array */
function buildRO(fileName, lines, roIndex, assignedDate, customerId, customerName, customerPhone, customerEmail) {
  const first      = lines[0];
  const year       = parseInt(first.year)  || 2020;
  const make       = first.make  || 'Toyota';
  const model      = first.model || 'Camry';
  const trim       = first.trim  || '';
  const mileageIn  = parseInt(first.mileage) || randInt(20000, 90000);
  const mileageOut = mileageIn + randInt(5, 60);
  const vin        = syntheticVin(year, make);

  // Status based on recency
  const now     = new Date('2026-03-27');
  const daysAgo = (now - assignedDate) / 86400000;
  let status;
  if (daysAgo < 1)        status = pick(['open', 'open', 'estimate']);
  else if (daysAgo < 3)   status = pick(['open', 'estimate', 'estimate']);
  else if (daysAgo < 6)   status = pick(['estimate', 'approved', 'approved']);
  else if (daysAgo < 10)  status = pick(['approved', 'approved', 'estimate']);
  else                    status = 'closed';

  const LABOR_RATE = 195;
  const services = lines.map((l, i) => {
    const name  = [l.title, l.description].filter(Boolean).join(' — ').slice(0, 100) || `Service Line ${i+1}`;
    const partsCost = (l.partComponents && l.partComponents.length)
      ? l.partComponents.reduce((s, p) => s + (parseFloat(p.price) || 0), 0)
      : randInt(0, 120);
    const partsCharged = calcPartsCharged(partsCost);
    const hrs   = parseFloat(l.labor_hours) || (randInt(3, 18) / 10);
    const laborCost = Math.round(hrs * LABOR_RATE * 100) / 100;
    const lineStatus = status === 'closed' ? 'complete'
      : i === 0 ? 'in_progress' : 'pending';
    return {
      lineNumber:   i + 1,
      opCode:       l.repair_item_id ? `OP-${l.repair_item_id}` : `LINE-${i+1}`,
      description:  name,
      type:         'labor',
      laborHrs:     hrs,
      laborRate:    LABOR_RATE,
      laborTotal:   laborCost,
      partsCost:    Math.round(partsCost * 100) / 100,
      partsCharged: Math.round(partsCharged * 100) / 100,
      total:        Math.round((laborCost + partsCharged) * 100) / 100,
      status:       lineStatus,
      // Preserve source 3C fields
      concern:      l.title        || '',
      cause:        l.description  || '',
      correction:   (l.repairs     || []).join('; '),
      recommends:   (l.recommends  || []).join('; '),
    };
  });

  const laborTotal        = services.reduce((s, l) => s + l.laborTotal, 0);
  const totalPartsCost    = Math.round(services.reduce((s, l) => s + (l.partsCost    || 0), 0) * 100) / 100;
  const totalPartsCharged = Math.round(services.reduce((s, l) => s + (l.partsCharged || 0), 0) * 100) / 100;
  const shopSupplies      = Math.round((laborTotal * 0.015 + 7.95) * 100) / 100;
  const tax               = Math.round(totalPartsCharged * 0.0875 * 100) / 100;
  const grandTotal        = Math.round((laborTotal + totalPartsCharged + shopSupplies + tax) * 100) / 100;

  const yr    = assignedDate.getFullYear();
  const roNum = `RO-${yr}-${String(1100 + roIndex).padStart(4, '0')}`;

  const tech    = pick(TECHNICIANS);
  const advisor = pick(ADVISORS);
  const promisedDate = addDays(assignedDate, 1);
  const closedDate   = status === 'closed' ? addDays(assignedDate, randInt(0, 2)).toISOString() : null;

  const progress = status === 'closed' ? 100
    : status === 'approved' ? randInt(35, 75)
    : status === 'estimate' ? randInt(10, 30)
    : randInt(0, 15);

  const origin = vehicleOriginFromMake(make);

  // ── Labor time tracking ────────────────────────────────────────────────────
  // Compute actualHrs per service line using tech efficiency; add clockIn/clockOut.
  const efficiency = tech.efficiency || 0.85;
  let clockCursor  = assignedDate.getTime() + 30 * 60000;  // start 30 min after check-in
  const servicesWithTime = services.map(svc => {
    const isTracked = svc.status === 'complete' || svc.status === 'in_progress';
    const actualHrs = svc.laborHrs === 0 ? 0 : Math.round(svc.laborHrs / efficiency * 100) / 100;
    let clockIn = null, clockOut = null;
    if (isTracked && svc.laborHrs > 0) {
      clockIn  = new Date(clockCursor).toISOString();
      if (svc.status === 'complete') {
        clockCursor += Math.round(actualHrs * 3600000);
        clockOut = new Date(clockCursor).toISOString();
        clockCursor += 5 * 60000;  // 5-min gap between jobs
      }
    }
    return clockIn ? { ...svc, actualHrs, clockIn, ...(clockOut ? { clockOut } : {}) } : svc;
  });

  const trackedSvcs    = servicesWithTime.filter(s => s.actualHrs != null && s.laborHrs > 0 &&
                           (s.status === 'complete' || s.status === 'in_progress'));
  const totalFlatHrs   = Math.round(trackedSvcs.reduce((s, l) => s + l.laborHrs, 0) * 100) / 100;
  const totalActualHrs = Math.round(trackedSvcs.reduce((s, l) => s + l.actualHrs, 0) * 100) / 100;
  const trackedLabor   = Math.round(trackedSvcs.reduce((s, l) => s + l.laborTotal, 0) * 100) / 100;
  const elr            = totalActualHrs > 0
    ? Math.round(trackedLabor / totalActualHrs * 100) / 100 : 0;

  // ── Declined services ──────────────────────────────────────────────────────
  const existingOpCodes = new Set(servicesWithTime.map(s => s.opCode));
  const numDeclined = Math.random() < 0.60 ? (Math.random() < 0.4 ? 2 : 1) : 0;
  const shuffledDecline = [...DECLINE_POOL].sort(() => Math.random() - 0.5);
  const declinedServices = shuffledDecline
    .filter(d => !existingOpCodes.has(d.opCode))
    .slice(0, numDeclined)
    .map(d => ({
      opCode:       d.opCode,
      description:  d.description,
      laborHrs:     d.laborHrs,
      laborTotal:   Math.round(d.laborHrs * LABOR_RATE * 100) / 100,
      partsCost:    d.partsCost,
      partsCharged: calcPartsCharged(d.partsCost),
      totalIfDone:  Math.round((d.laborHrs * LABOR_RATE + calcPartsCharged(d.partsCost)) * 100) / 100,
    }));
  const declinedTotal = Math.round(declinedServices.reduce((s, d) => s + d.totalIfDone, 0) * 100) / 100;

  // ── Gross margin ───────────────────────────────────────────────────────────
  const laborCostEst       = Math.round(totalActualHrs * 45 * 100) / 100;
  const partsMarginDollars = Math.round((totalPartsCharged - totalPartsCost) * 100) / 100;
  const grossMarginDollars = Math.round((grandTotal - totalPartsCost - laborCostEst) * 100) / 100;
  const grossMarginPct     = grandTotal > 0 ? Math.round(grossMarginDollars / grandTotal * 1000) / 10 : 0;

  // ── Customer intelligence ──────────────────────────────────────────────────
  const cust            = CUSTOMERS.find(c => c.id === customerId) || CUSTOMERS[0];
  const tier            = loyaltyTier(cust.visits);
  const custApprovalRate = approvalRate(tier);
  const customerLTV     = Math.round(cust.visits * grandTotal * (0.9 + Math.random() * 0.3) * 100) / 100;

  return {
    id:            roNum,
    roNumber:      roNum,
    shopId:        'shop-001',

    // Workflow status
    status,
    kanbanStatus: statusToKanban(status),

    // Customer (from our demo customer list)
    customerId,
    customerName,
    customerPhone,
    customerEmail,

    // Vehicle (from source data)
    vehicleId:    `veh-${fileName.replace(/[^a-z0-9]/gi, '').slice(0, 12)}`,
    vin,
    year,
    make,
    model,
    trim,
    color:        pick(['Silver', 'White', 'Black', 'Gray', 'Blue', 'Red']),
    mileageIn,
    mileageOut:   status === 'closed' ? mileageOut : null,

    // Source ref
    sourceFileName:    fileName,
    sourceShopId:      first.shop_id,
    sourceRoId:        first.repair_order_id,
    sourceState:       first.state || '',

    // Assignment
    techId:       tech.id,
    techName:     tech.name,
    techRate:     tech.rate || 55,
    advisorId:    advisor.id,
    advisorName:  advisor.name,
    bay:          randInt(1, 6),

    // Scheduling
    dateIn:       assignedDate.toISOString(),
    promisedDate: promisedDate.toISOString(),
    closedDate,
    approvalTimeMin: Math.round(15 + Math.random() * 60),

    // Service
    serviceType:   servicesWithTime[0]?.description?.slice(0, 60) || 'Service Visit',
    isOemService:  false,
    oemMilestone:  null,
    services:      servicesWithTime,
    vehicleOrigin: origin,
    declinedServices,
    declinedTotal,

    // Labor time tracking (ELR)
    laborTimeTracking: { totalFlatHrs, totalActualHrs, elr, postedRate: LABOR_RATE },

    // Financials — customer-facing
    totalEstimate:      grandTotal,
    totalLabor:         Math.round(laborTotal * 100) / 100,
    totalPartsCharged,
    totalPartsCost,
    shopSupplies,
    tax,

    // Financials — shop margin
    partsMargin:         partsMarginDollars,
    laborMargin:         Math.round(laborTotal * 100) / 100,
    grossMarginDollars,
    grossMarginPct,
    totalFlaggedHrs:     totalFlatHrs,

    // Customer intelligence
    customerVisitCount:   cust.visits,
    loyaltyTier:          tier,
    customerApprovalRate: custApprovalRate,
    customerLTV,
    comebackRO:           Math.random() < 0.05,

    progress,
    waitingSince:  status === 'estimate' ? assignedDate.toISOString() : null,

    // AI (to be filled by ServiceAdvisor agent)
    aiInsights: [],

    // Timestamps
    createdAt: assignedDate.toISOString(),
    updatedAt: closedDate || assignedDate.toISOString(),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  console.log(`\nConnected to ${MONGODB_URI}`);

  const srcDb  = client.db(SRC_DB);
  const dstDb  = client.db(DST_DB);
  const srcColl = srcDb.collection(SRC_COLL);

  // ── Step 1: Scan a window of source line items to build candidate RO groups ──
  console.log(`\nScanning ${SCAN_BATCH_SIZE.toLocaleString()} line items from ${SRC_COLL} (using _timestamp index)...`);

  const query = SHOP_ID_FILTER ? { shop_id: SHOP_ID_FILTER } : {};
  const cursor = srcColl.find(query)
    .sort({ _timestamp: -1 })        // newest first — uses _timestamp_1 index
    .limit(SCAN_BATCH_SIZE);

  const groups = new Map();          // fileName → line[]
  let scanned = 0;

  for await (const doc of cursor) {
    const key = doc.fileName;
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(doc);
    scanned++;
  }
  await cursor.close();
  console.log(`  Scanned ${scanned.toLocaleString()} line items → ${groups.size.toLocaleString()} unique ROs`);

  // ── Step 2: Filter ROs with MIN_LINES+ lines ─────────────────────────────────
  const eligible = [...groups.entries()].filter(([, lines]) => lines.length >= MIN_LINES);
  console.log(`  ROs with ${MIN_LINES}+ lines: ${eligible.length.toLocaleString()}`);

  if (eligible.length < TARGET_ROS) {
    console.warn(`  WARNING: Only ${eligible.length} eligible ROs found. Needed ${TARGET_ROS}.`);
    console.warn(`  Increase SCAN_BATCH_SIZE or reduce MIN_LINES.`);
  }

  // ── Step 3: Sample TARGET_ROS candidates (random shuffle) ────────────────────
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }
  const selected = eligible.slice(0, TARGET_ROS);
  console.log(`  Selected ${selected.length} ROs for import.`);

  // ── Step 4: Assign 25 customers across 100 ROs ───────────────────────────────
  // Build a flat assignment list: [cust-001 x10, cust-002 x9, ...] shuffled
  const custAssignments = [];
  for (const c of CUSTOMERS) {
    for (let i = 0; i < c.visits; i++) custAssignments.push(c);
  }
  // Shuffle
  for (let i = custAssignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [custAssignments[i], custAssignments[j]] = [custAssignments[j], custAssignments[i]];
  }

  // ── Step 5: Spread dates over 3 years ────────────────────────────────────────
  // Historical ROs (closed): 2023-04-01 → 2026-02-20
  // Active ROs  (open/estimate/approved): 2026-03-10 → 2026-03-26  (last 15)
  const ACTIVE_COUNT = 15;
  const HIST_COUNT   = selected.length - ACTIVE_COUNT;
  const histDates    = spreadDates(HIST_COUNT,   new Date('2023-04-01').getTime(), new Date('2026-02-20').getTime());
  // Active window: last 10 days only, so all get open/estimate/approved
  const activeDates  = spreadDates(ACTIVE_COUNT, new Date('2026-03-18').getTime(), new Date('2026-03-26').getTime());
  const dates        = [...histDates, ...activeDates];

  // ── Step 6: Transform to wrenchiq schema ─────────────────────────────────────
  console.log('\nTransforming to wrenchiq schema...');
  const ros = selected.map(([fileName, lines], idx) => {
    const cust = custAssignments[idx] || pick(CUSTOMERS);
    const date = dates[idx];
    return buildRO(fileName, lines, idx + 1, date, cust.id, cust.name, cust.phone, cust.email);
  });

  // ── Step 7: Write to wrenchiq.RepairOrder ─────────────────────────────────────
  const dstColl = dstDb.collection(DST_COLL);

  // Drop existing
  const existing = await dstColl.estimatedDocumentCount().catch(() => 0);
  if (existing > 0) {
    await dstColl.drop();
    console.log(`  Dropped existing ${DST_COLL} collection (${existing} docs).`);
  }

  await dstDb.createCollection(DST_COLL);
  await dstColl.createIndex({ id: 1 },          { unique: true });
  await dstColl.createIndex({ customerId: 1 });
  await dstColl.createIndex({ status: 1 });
  await dstColl.createIndex({ kanbanStatus: 1 });
  await dstColl.createIndex({ dateIn: -1 });
  await dstColl.createIndex({ vin: 1 });
  await dstColl.createIndex({ sourceFileName: 1 });
  console.log('  Indexes created.');

  const result = await dstColl.insertMany(ros);
  console.log(`  Inserted ${result.insertedCount} repair orders.\n`);

  // ── Summary ───────────────────────────────────────────────────────────────────
  const statusCount = {};
  const yearCount   = {};
  const custCount   = {};
  for (const ro of ros) {
    statusCount[ro.status] = (statusCount[ro.status] || 0) + 1;
    const yr = new Date(ro.dateIn).getFullYear();
    yearCount[yr] = (yearCount[yr] || 0) + 1;
    custCount[ro.customerName] = (custCount[ro.customerName] || 0) + 1;
  }

  console.log('Status distribution:');
  for (const [s, n] of Object.entries(statusCount)) console.log(`  ${s.padEnd(12)} ${n}`);

  console.log('\nYear distribution:');
  for (const [y, n] of Object.entries(yearCount).sort()) console.log(`  ${y}  ${n} ROs`);

  const avgLines = ros.reduce((s, ro) => s + ro.services.length, 0) / ros.length;
  console.log(`\nAvg service lines per RO : ${avgLines.toFixed(1)}`);
  console.log(`Source DB                : ${SRC_DB}`);
  console.log(`Destination              : ${DST_DB}.${DST_COLL}`);
  console.log('\nImport complete.\n');

  await client.close();
}

run().catch(err => {
  console.error('\nImport failed:', err.message);
  process.exit(1);
});
