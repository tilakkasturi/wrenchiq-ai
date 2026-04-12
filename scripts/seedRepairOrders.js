/**
 * WrenchIQ — Batch Seed Script
 *
 * Seeds 100 Repair Orders for a batch of 25 customers.
 * Each batch APPENDS to wrenchiq.RepairOrder without touching existing data.
 *
 * Usage:
 *   node scripts/seedRepairOrders.js              # batch 1 (customers 1-25)
 *   node scripts/seedRepairOrders.js --batch 2    # customers 26-50
 *   node scripts/seedRepairOrders.js --batch 3    # customers 51-75
 *   node scripts/seedRepairOrders.js --batch 4    # customers 76-100
 *   node scripts/seedRepairOrders.js --list       # show all batches & customers
 *   node scripts/seedRepairOrders.js --reset      # drop collection then seed batch 1
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
const args    = process.argv.slice(2);
const batchArg = args.indexOf('--batch');
const BATCH   = batchArg >= 0 ? parseInt(args[batchArg + 1]) || 1 : 1;
const RESET   = args.includes('--reset');
const LIST    = args.includes('--list');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';
const BATCH_SIZE  = 25;   // customers per batch
const ROS_PER_BATCH = 100;

// ── Shop & staff ─────────────────────────────────────────────────────────────
const SHOP = { id: 'shop-001', name: 'Peninsula Precision Auto', laborRate: 195, targetElr: 185 };

const TECHNICIANS = [
  { id:'tech-001', name:'James Kowalski', initials:'JK', specialty:'European Imports', rate: 65, efficiency: 0.96 },
  { id:'tech-002', name:'Mike Reeves',    initials:'MR', specialty:'Honda / Toyota',   rate: 58, efficiency: 0.85 },
  { id:'tech-003', name:'Carlos Mendez',  initials:'CM', specialty:'Ford / Subaru',    rate: 52, efficiency: 0.92 },
  { id:'tech-004', name:'Lisa Nguyen',    initials:'LN', specialty:'Maintenance',      rate: 48, efficiency: 0.78 },
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
const ADVISORS = [
  { id:'adv-001', name:'Tilak Kasturi',  initials:'TK' },
  { id:'adv-002', name:'Rachel Torres',  initials:'RT' },
];

// ── Master Customer Pool (100 customers, 4 batches of 25) ────────────────────
// visits = how many ROs this customer contributes.
// Each batch of 25 should total ~100 visits.
//
// Vehicle fields embedded per customer for self-contained batch slicing.

const CUSTOMER_POOL = [

  // ══════════════════════════════════════════════════════════════
  //  BATCH 1 — customers 1-25 (original batch)
  // ══════════════════════════════════════════════════════════════
  { id:'cust-001', batch:1, firstName:'Sarah',       lastName:'Chen',      phone:'(650) 555-0101', email:'sarah.chen@stanford.edu',       address:'742 Waverley St, Palo Alto, CA 94301',      occupation:'Stanford Professor, CS',            since:'2022-06-01', visits:10,
    vehicles:[
      { id:'veh-m-001', vin:'4T1B11HK5MU246813', year:2021, make:'Toyota',    model:'Camry',    trim:'SE',              color:'Celestial Silver',  baseMileage:28000, milesPerYear:13000 },
      { id:'veh-m-002', vin:'5YJ3E1EB4RF183294', year:2022, make:'Tesla',     model:'Model 3',  trim:'Long Range AWD',  color:'Pearl White',        baseMileage:8000,  milesPerYear:11000 },
    ]},
  { id:'cust-002', batch:1, firstName:'David',       lastName:'Kim',       phone:'(408) 555-0102', email:'david.kim@google.com',           address:'1580 Hamilton Ave, San Jose, CA 95125',     occupation:'Senior SWE, Google',               since:'2022-08-15', visits:9,
    vehicles:[
      { id:'veh-m-003', vin:'5J6RW2H85KA014928', year:2019, make:'Honda',     model:'CR-V',     trim:'EX-L',            color:'Obsidian Blue Pearl', baseMileage:44000, milesPerYear:14000 },
    ]},
  { id:'cust-003', batch:1, firstName:'Monica',      lastName:'Rodriguez', phone:'(650) 555-0103', email:'monica@venturebloom.io',         address:'3201 Alma St, Palo Alto, CA 94306',         occupation:'Startup Founder, VentureBloom',     since:'2022-09-20', visits:7,
    vehicles:[
      { id:'veh-m-004', vin:'4T1BF1FK8EU846129', year:2018, make:'Toyota',    model:'Camry',    trim:'XSE V6',          color:'Midnight Black',     baseMileage:52000, milesPerYear:12000 },
    ]},
  { id:'cust-004', batch:1, firstName:'James',       lastName:'Park',      phone:'(650) 555-0104', email:'james.park@sequoiacap.com',      address:'890 University Ave, Palo Alto, CA 94301',   occupation:'Partner, Sequoia Capital',          since:'2022-07-10', visits:7,
    vehicles:[
      { id:'veh-m-005', vin:'5UX43DP04LL839271', year:2020, make:'BMW',       model:'X3',       trim:'sDrive30i',       color:'Phytonic Blue',      baseMileage:31000, milesPerYear:12000 },
      { id:'veh-m-006', vin:'WBA3A5C55CF256921', year:2022, make:'BMW',       model:'M440i',    trim:'xDrive Gran Coupe', color:'Mineral White',    baseMileage:5000,  milesPerYear:9000  },
    ]},
  { id:'cust-005', batch:1, firstName:'Angela',      lastName:'Martinez',  phone:'(650) 555-0105', email:'a.martinez@pausd.org',           address:'456 Middlefield Rd, Palo Alto, CA 94301',   occupation:'Teacher, PAUSD',                   since:'2022-10-01', visits:6,
    vehicles:[
      { id:'veh-m-007', vin:'4S4BSACC5J3308906', year:2018, make:'Subaru',    model:'Outback',  trim:'2.5i Premium',    color:'Wilderness Green',   baseMileage:55000, milesPerYear:13000 },
    ]},
  { id:'cust-006', batch:1, firstName:'Robert',      lastName:'Taylor',    phone:'(650) 555-0106', email:'rtaylor.retired@gmail.com',      address:'1100 Channing Ave, Palo Alto, CA 94301',    occupation:'Retired VP Engineering, HP',        since:'2022-12-05', visits:6,
    vehicles:[
      { id:'veh-m-008', vin:'1FTFW1E55NFA28437', year:2022, make:'Ford',      model:'F-150',    trim:'XLT SuperCrew',   color:'Iconic Silver',      baseMileage:18000, milesPerYear:14000 },
    ]},
  { id:'cust-007', batch:1, firstName:'Priya',       lastName:'Sharma',    phone:'(408) 555-0107', email:'priya.sharma@apple.com',         address:'19800 Stevens Creek Blvd, Cupertino, CA',   occupation:'Hardware Engineer, Apple',          since:'2023-01-10', visits:5,
    vehicles:[
      { id:'veh-m-009', vin:'2T3P1RFV4LW284937', year:2020, make:'Toyota',    model:'RAV4',     trim:'XLE AWD',         color:'Lunar Rock',         baseMileage:33000, milesPerYear:13000 },
    ]},
  { id:'cust-008', batch:1, firstName:'Tom',         lastName:'Wallace',   phone:'(650) 555-0108', email:'twallace@wflaw.com',             address:'2200 Sand Hill Rd, Menlo Park, CA 94025',   occupation:'Attorney, Wallace & Franco LLP',    since:'2023-02-08', visits:5,
    vehicles:[
      { id:'veh-m-010', vin:'5NMJFCAE3PH264144', year:2023, make:'Hyundai',   model:'Tucson',   trim:'SEL',             color:'Amazon Gray',        baseMileage:7000,  milesPerYear:12000 },
    ]},
  { id:'cust-009', batch:1, firstName:'Lisa',        lastName:'Chen',      phone:'(415) 555-0109', email:'lchen@cisco.com',                address:'3625 El Camino Real, Palo Alto, CA 94306',  occupation:'Product Manager, Cisco',            since:'2023-01-20', visits:4,
    vehicles:[
      { id:'veh-m-011', vin:'1HGCV1F3XLA046827', year:2020, make:'Honda',     model:'Accord',   trim:'Sport 2.0T',      color:'Sonic Gray Pearl',   baseMileage:29000, milesPerYear:12000 },
    ]},
  { id:'cust-010', batch:1, firstName:'Kevin',       lastName:'Park',      phone:'(650) 555-0110', email:'kevin.park@salesforce.com',      address:'55 2nd St, San Francisco, CA 94105',        occupation:'Solutions Engineer, Salesforce',    since:'2023-02-28', visits:5,
    vehicles:[
      { id:'veh-m-012', vin:'JM3KFBBM4M0421873', year:2021, make:'Mazda',     model:'CX-5',     trim:'Carbon Edition',  color:'Polymetal Gray',     baseMileage:22000, milesPerYear:13000 },
    ]},
  { id:'cust-011', batch:1, firstName:'Rachel',      lastName:'Green',     phone:'(650) 555-0111', email:'rgreen.pa@gmail.com',            address:'200 Hamilton Ave, Palo Alto, CA 94301',     occupation:'Graphic Designer',                 since:'2023-03-15', visits:4,
    vehicles:[
      { id:'veh-m-013', vin:'2T1BURHE4JC992847', year:2019, make:'Toyota',    model:'Corolla',  trim:'LE',              color:'Super White',        baseMileage:41000, milesPerYear:11000 },
    ]},
  { id:'cust-012', batch:1, firstName:'Marcus',      lastName:'Johnson',   phone:'(408) 555-0112', email:'mjohnson@netflix.com',           address:'9085 Prunedale Ave, San Jose, CA',          occupation:'Data Scientist, Netflix',           since:'2023-04-01', visits:5,
    vehicles:[
      { id:'veh-m-014', vin:'1GCRYDED8NZ182456', year:2022, make:'Chevrolet', model:'Silverado 1500', trim:'LT Crew Cab', color:'Northsky Blue',  baseMileage:14000, milesPerYear:15000 },
    ]},
  { id:'cust-013', batch:1, firstName:'Jennifer',    lastName:'Kim',       phone:'(650) 555-0113', email:'jkim.menlopark@gmail.com',       address:'1450 El Camino Real, Menlo Park, CA',        occupation:'Realtor, Compass',                 since:'2023-04-10', visits:3,
    vehicles:[
      { id:'veh-m-015', vin:'2HGFC2F69MH564831', year:2021, make:'Honda',     model:'Civic',    trim:'EX',              color:'Aegean Blue',        baseMileage:19000, milesPerYear:11000 },
    ]},
  { id:'cust-014', batch:1, firstName:'Carlos',      lastName:'Ruiz',      phone:'(408) 555-0114', email:'cruiz.sj@gmail.com',             address:'1040 Blossom Hill Rd, San Jose, CA 95123',  occupation:'Construction Manager',             since:'2023-05-01', visits:3,
    vehicles:[
      { id:'veh-m-016', vin:'1FA6P8TH8J5162734', year:2018, make:'Ford',      model:'Mustang GT', trim:'Premium',       color:'Race Red',           baseMileage:48000, milesPerYear:8000  },
    ]},
  { id:'cust-015', batch:1, firstName:'Emily',       lastName:'Zhang',     phone:'(408) 555-0115', email:'ezhang@adobe.com',               address:'5501 Great America Pkwy, Santa Clara, CA',  occupation:'UX Designer, Adobe',               since:'2023-05-15', visits:3,
    vehicles:[
      { id:'veh-m-017', vin:'WBA5R7C50LAG93821', year:2020, make:'BMW',       model:'3 Series', trim:'330i xDrive',     color:'Alpine White',       baseMileage:27000, milesPerYear:11000 },
    ]},
  { id:'cust-016', batch:1, firstName:'Nathan',      lastName:'Hill',      phone:'(650) 555-0116', email:'nhill.rw@gmail.com',             address:'455 University Ave, Palo Alto, CA 94301',   occupation:'Financial Advisor, Morgan Stanley', since:'2023-06-01', visits:2,
    vehicles:[
      { id:'veh-m-018', vin:'JF2SKAEC6MH401928', year:2021, make:'Subaru',    model:'Forester', trim:'Premium',         color:'Crystal Black',      baseMileage:21000, milesPerYear:12000 },
    ]},
  { id:'cust-017', batch:1, firstName:'Stephanie',   lastName:'Lee',       phone:'(408) 555-0117', email:'slee.sunnyvale@gmail.com',       address:'1088 Borelli Ave, Sunnyvale, CA 94086',     occupation:'Nurse Practitioner, Stanford Hospital', since:'2023-06-15', visits:2,
    vehicles:[
      { id:'veh-m-019', vin:'JTDKARFU6L3124987', year:2020, make:'Toyota',    model:'Prius',    trim:'XLE AWD-e',       color:'Blueprint',          baseMileage:26000, milesPerYear:14000 },
    ]},
  { id:'cust-018', batch:1, firstName:'Brian',       lastName:'Murphy',    phone:'(650) 555-0118', email:'bmurphy.redwoodcity@gmail.com',  address:'2600 El Camino Real, Redwood City, CA',      occupation:'Commercial Photographer',          since:'2023-07-01', visits:2,
    vehicles:[
      { id:'veh-m-020', vin:'1GNSKBKC9KR149283', year:2019, make:'Chevrolet', model:'Tahoe',    trim:'LT 4WD',          color:'Iridescent Pearl',   baseMileage:57000, milesPerYear:13000 },
    ]},
  { id:'cust-019', batch:1, firstName:'Yasmine',     lastName:'Hassan',    phone:'(408) 555-0119', email:'yhassan@linkedin.com',           address:'1000 W Maude Ave, Sunnyvale, CA 94085',     occupation:'Engineering Manager, LinkedIn',     since:'2023-07-10', visits:2,
    vehicles:[
      { id:'veh-m-021', vin:'1N4BL4CV6MN348921', year:2021, make:'Nissan',    model:'Altima',   trim:'SV',              color:'Gun Metallic',       baseMileage:22000, milesPerYear:13000 },
    ]},
  { id:'cust-020', batch:1, firstName:'Christopher', lastName:'Young',     phone:'(650) 555-0120', email:'cyoung.atherton@gmail.com',      address:'44 Dinkelspiel Station Ln, Atherton, CA',   occupation:'VC Partner, Andreessen Horowitz',  since:'2023-08-01', visits:2,
    vehicles:[
      { id:'veh-m-022', vin:'1C4RJFBG4LC249817', year:2020, make:'Jeep',      model:'Grand Cherokee', trim:'Limited 4WD', color:'Billet Silver', baseMileage:32000, milesPerYear:11000 },
    ]},
  { id:'cust-021', batch:1, firstName:'Melissa',     lastName:'Turner',    phone:'(408) 555-0121', email:'mturner.lv@gmail.com',           address:'110 N 14th St, San Jose, CA 95112',          occupation:'School Principal',                 since:'2023-08-20', visits:3,
    vehicles:[
      { id:'veh-m-023', vin:'3VVFB7AX9NM128476', year:2022, make:'Volkswagen',model:'Tiguan',   trim:'SE R-Line',       color:'Deep Black Pearl',   baseMileage:13000, milesPerYear:11000 },
    ]},
  { id:'cust-022', batch:1, firstName:'Jason',       lastName:'White',     phone:'(650) 555-0122', email:'jwhite@tesla.com',               address:'3500 Deer Creek Rd, Palo Alto, CA 94304',    occupation:'Engineer, Tesla',                  since:'2023-09-05', visits:2,
    vehicles:[
      { id:'veh-m-024', vin:'7SAYGDEF9NF428731', year:2022, make:'Tesla',     model:'Model Y',  trim:'Long Range AWD',  color:'Midnight Silver',    baseMileage:9000,  milesPerYear:12000 },
    ]},
  { id:'cust-023', batch:1, firstName:'Laura',       lastName:'Martinez',  phone:'(408) 555-0123', email:'lmartinez.mv@gmail.com',         address:'890 Castro St, Mountain View, CA 94041',    occupation:'Chef, Restaurant Owner',            since:'2023-10-15', visits:1,
    vehicles:[
      { id:'veh-m-025', vin:'5XYPG4A52LG048291', year:2020, make:'Kia',       model:'Sorento',  trim:'EX AWD',          color:'Snow White Pearl',   baseMileage:38000, milesPerYear:12000 },
    ]},
  { id:'cust-024', batch:1, firstName:'Daniel',      lastName:'Brown',     phone:'(650) 555-0124', email:'dbrown@oracle.com',              address:'500 Oracle Pkwy, Redwood City, CA 94065',    occupation:'Principal Engineer, Oracle',       since:'2023-11-01', visits:1,
    vehicles:[
      { id:'veh-m-026', vin:'WAUENAF44KN012847', year:2019, make:'Audi',      model:'A4',       trim:'Premium Plus',    color:'Daytona Gray Pearl', baseMileage:51000, milesPerYear:10000 },
    ]},
  { id:'cust-025', batch:1, firstName:'Ashley',      lastName:'Taylor',    phone:'(408) 555-0125', email:'ataylor.cupertino@gmail.com',    address:'20950 Stevens Creek Blvd, Cupertino, CA',   occupation:'Marketing Manager, Apple',          since:'2023-12-01', visits:1,
    vehicles:[
      { id:'veh-m-027', vin:'5FNYF5H53MB091384', year:2021, make:'Honda',     model:'Pilot',    trim:'EX-L AWD',        color:'Lunar Silver',       baseMileage:23000, milesPerYear:12000 },
    ]},

  // ══════════════════════════════════════════════════════════════
  //  BATCH 2 — customers 26-50 (East Bay + South Bay professionals)
  // ══════════════════════════════════════════════════════════════
  { id:'cust-026', batch:2, firstName:'Amir',        lastName:'Patel',     phone:'(510) 555-0126', email:'amir.patel@uber.com',            address:'1515 3rd St, San Francisco, CA 94158',      occupation:'Engineering Director, Uber',        since:'2024-01-05', visits:9,
    vehicles:[
      { id:'veh-m-028', vin:'5UXCR6C09M9D38471', year:2021, make:'BMW',       model:'X5',       trim:'xDrive40i',       color:'Carbon Black',       baseMileage:24000, milesPerYear:13000 },
      { id:'veh-m-029', vin:'JN8AT3BB5LW003219', year:2020, make:'Nissan',    model:'Pathfinder',trim:'SL 4WD',         color:'Pearl White',        baseMileage:37000, milesPerYear:12000 },
    ]},
  { id:'cust-027', batch:2, firstName:'Grace',       lastName:'Okafor',    phone:'(510) 555-0127', email:'grace.okafor@airbnb.com',        address:'888 Brannan St, San Francisco, CA 94103',   occupation:'Staff Engineer, Airbnb',            since:'2024-01-18', visits:8,
    vehicles:[
      { id:'veh-m-030', vin:'KMHGN4JE5LU082471', year:2020, make:'Genesis',   model:'G80',      trim:'3.8 AWD',         color:'Himalayan Gray',     baseMileage:31000, milesPerYear:10000 },
    ]},
  { id:'cust-028', batch:2, firstName:'Derek',       lastName:'Nguyen',    phone:'(408) 555-0128', email:'derek.nguyen@intuit.com',        address:'2700 Coast Ave, Mountain View, CA 94043',   occupation:'Senior PM, Intuit',                since:'2024-02-10', visits:7,
    vehicles:[
      { id:'veh-m-031', vin:'3VWFE21C04M000319', year:2019, make:'Volkswagen',model:'Jetta',    trim:'SEL Premium',     color:'Platinum Gray',      baseMileage:52000, milesPerYear:13000 },
    ]},
  { id:'cust-029', batch:2, firstName:'Camille',     lastName:'Dubois',    phone:'(650) 555-0129', email:'cdubois.lp@gmail.com',           address:'3180 Alpine Rd, Portola Valley, CA 94028',  occupation:'Architect, Dubois Partners',        since:'2024-02-22', visits:7,
    vehicles:[
      { id:'veh-m-032', vin:'YV1612FH4D2193847', year:2022, make:'Volvo',     model:'XC60',     trim:'T6 Inscription',  color:'Crystal White',      baseMileage:17000, milesPerYear:10000 },
      { id:'veh-m-033', vin:'WP0AA2A76KL129384', year:2019, make:'Porsche',   model:'Macan',    trim:'S',               color:'Agate Gray',         baseMileage:44000, milesPerYear:9000  },
    ]},
  { id:'cust-030', batch:2, firstName:'Marcus',      lastName:'Bell',      phone:'(415) 555-0130', email:'mbell@stripe.com',               address:'510 Townsend St, San Francisco, CA 94103',  occupation:'Infrastructure Engineer, Stripe',  since:'2024-03-01', visits:6,
    vehicles:[
      { id:'veh-m-034', vin:'1G1ZD5ST5LF147291', year:2020, make:'Chevrolet', model:'Malibu',   trim:'LT',              color:'Mosaic Black',       baseMileage:35000, milesPerYear:12000 },
    ]},
  { id:'cust-031', batch:2, firstName:'Nadia',       lastName:'Volkov',    phone:'(650) 555-0131', email:'nvolkov@palantir.com',           address:'100 Hamilton Ave, Palo Alto, CA 94301',     occupation:'Data Engineer, Palantir',           since:'2024-03-15', visits:6,
    vehicles:[
      { id:'veh-m-035', vin:'WVGZZZ7PZMD021847', year:2021, make:'Volkswagen',model:'Touareg',  trim:'V6 SE',           color:'Tungsten Silver',    baseMileage:19000, milesPerYear:11000 },
    ]},
  { id:'cust-032', batch:2, firstName:'Ethan',       lastName:'Brooks',    phone:'(408) 555-0132', email:'ebrooks@qualcomm.com',           address:'3165 Porter Dr, Palo Alto, CA 94304',       occupation:'Silicon Design Engineer, Qualcomm', since:'2024-04-01', visits:5,
    vehicles:[
      { id:'veh-m-036', vin:'SALJR2FX3LA261938', year:2020, make:'Land Rover',model:'Range Rover Sport', trim:'HSE', color:'Santorini Black',    baseMileage:39000, milesPerYear:10000 },
    ]},
  { id:'cust-033', batch:2, firstName:'Isabella',    lastName:'Santos',    phone:'(650) 555-0133', email:'isantos@lyft.com',               address:'185 Berry St, San Francisco, CA 94158',     occupation:'Operations Lead, Lyft',             since:'2024-04-12', visits:5,
    vehicles:[
      { id:'veh-m-037', vin:'2C3CCAGG9LH218374', year:2020, make:'Chrysler',  model:'300S',     trim:'S AWD',           color:'Gloss Black',        baseMileage:41000, milesPerYear:12000 },
    ]},
  { id:'cust-034', batch:2, firstName:'Kenji',       lastName:'Nakamura',  phone:'(408) 555-0134', email:'knakamura@zoom.us',             address:'55 Almaden Blvd, San Jose, CA 95113',        occupation:'Product Designer, Zoom',            since:'2024-05-01', visits:4,
    vehicles:[
      { id:'veh-m-038', vin:'JM1GL1VY4L1502938', year:2020, make:'Mazda',     model:'Mazda6',   trim:'Grand Touring',   color:'Machine Gray',       baseMileage:33000, milesPerYear:11000 },
    ]},
  { id:'cust-035', batch:2, firstName:'Talia',       lastName:'Reeves',    phone:'(415) 555-0135', email:'treeves@slack.com',             address:'500 Howard St, San Francisco, CA 94105',     occupation:'Customer Success, Slack',           since:'2024-05-18', visits:5,
    vehicles:[
      { id:'veh-m-039', vin:'4T1G11AK8MU019384', year:2021, make:'Toyota',    model:'Camry',    trim:'XSE',             color:'Midnight Black',     baseMileage:21000, milesPerYear:13000 },
    ]},
  { id:'cust-036', batch:2, firstName:'Omar',        lastName:'Khalil',    phone:'(510) 555-0136', email:'okhalil@doordash.com',          address:'303 2nd St, San Francisco, CA 94107',        occupation:'Analytics Engineer, DoorDash',      since:'2024-06-01', visits:4,
    vehicles:[
      { id:'veh-m-040', vin:'5NPE34AF7LH073829', year:2020, make:'Hyundai',   model:'Sonata',   trim:'SEL Plus',        color:'Quartz White',       baseMileage:28000, milesPerYear:12000 },
    ]},
  { id:'cust-037', batch:2, firstName:'Sophia',      lastName:'Fischer',   phone:'(650) 555-0137', email:'sfischer@snowflake.com',        address:'450 Concar Dr, San Mateo, CA 94402',          occupation:'Solutions Architect, Snowflake',    since:'2024-06-15', visits:4,
    vehicles:[
      { id:'veh-m-041', vin:'WBA3B3C56FK128394', year:2022, make:'BMW',       model:'3 Series', trim:'330i M-Sport',    color:'Brooklyn Gray',      baseMileage:14000, milesPerYear:11000 },
    ]},
  { id:'cust-038', batch:2, firstName:'Diego',       lastName:'Vasquez',   phone:'(408) 555-0138', email:'dvasquez@nvidia.com',           address:'2788 San Tomas Expwy, Santa Clara, CA',      occupation:'GPU Architect, NVIDIA',             since:'2024-07-01', visits:3,
    vehicles:[
      { id:'veh-m-042', vin:'JF2GTABC5LH128374', year:2020, make:'Subaru',    model:'Crosstrek',trim:'Sport',           color:'Cool Gray Khaki',    baseMileage:27000, milesPerYear:12000 },
    ]},
  { id:'cust-039', batch:2, firstName:'Alexis',      lastName:'Moreau',    phone:'(650) 555-0139', email:'amoreau.woodside@gmail.com',    address:'3100 Woodside Rd, Woodside, CA 94062',       occupation:'Veterinarian, Peninsula Animal Hospital', since:'2024-07-12', visits:3,
    vehicles:[
      { id:'veh-m-043', vin:'1FMCU9H61LUC18374', year:2020, make:'Ford',      model:'Escape',   trim:'SEL AWD',         color:'Star White',         baseMileage:36000, milesPerYear:12000 },
    ]},
  { id:'cust-040', batch:2, firstName:'Brendan',     lastName:'Walsh',     phone:'(415) 555-0140', email:'bwalsh@figma.com',              address:'760 Market St, San Francisco, CA 94102',     occupation:'Design Systems Lead, Figma',        since:'2024-08-01', visits:3,
    vehicles:[
      { id:'veh-m-044', vin:'3FADP4AJXLM183729', year:2020, make:'Ford',      model:'Fusion',   trim:'SE Hybrid',       color:'Iconic Silver',      baseMileage:44000, milesPerYear:13000 },
    ]},
  { id:'cust-041', batch:2, firstName:'Priscilla',   lastName:'Moore',     phone:'(408) 555-0141', email:'pmoore@vmware.com',             address:'3401 Hillview Ave, Palo Alto, CA 94304',     occupation:'Cloud Architect, VMware',           since:'2024-08-15', visits:3,
    vehicles:[
      { id:'veh-m-045', vin:'KNAGM4A76G5612938', year:2022, make:'Kia',       model:'Stinger',  trim:'GT2 AWD',         color:'Runway Red',         baseMileage:16000, milesPerYear:10000 },
    ]},
  { id:'cust-042', batch:2, firstName:'Ryan',        lastName:'Okonkwo',   phone:'(510) 555-0142', email:'rokonkwo@waymo.com',            address:'1600 Amphitheatre Pkwy, Mountain View, CA',  occupation:'Robotics Engineer, Waymo',          since:'2024-09-01', visits:2,
    vehicles:[
      { id:'veh-m-046', vin:'5YJYGDEE5LF048293', year:2020, make:'Tesla',     model:'Model Y',  trim:'Performance AWD', color:'Solid Black',        baseMileage:28000, milesPerYear:14000 },
    ]},
  { id:'cust-043', batch:2, firstName:'Heather',     lastName:'Kim',       phone:'(650) 555-0143', email:'hkim.belmont@gmail.com',        address:'1900 Ralston Ave, Belmont, CA 94002',        occupation:'Pharmacist, CVS',                  since:'2024-09-12', visits:2,
    vehicles:[
      { id:'veh-m-047', vin:'5J6RW2H81LA001938', year:2020, make:'Honda',     model:'CR-V',     trim:'Touring AWD',     color:'Aegean Blue',        baseMileage:30000, milesPerYear:11000 },
    ]},
  { id:'cust-044', batch:2, firstName:'Victor',      lastName:'Chen',      phone:'(408) 555-0144', email:'vchen@fortinet.com',            address:'899 Kifer Rd, Sunnyvale, CA 94086',          occupation:'Network Security Architect, Fortinet', since:'2024-10-01', visits:2,
    vehicles:[
      { id:'veh-m-048', vin:'WAUFFAFL0LN028374', year:2020, make:'Audi',      model:'A6',       trim:'Premium Plus',    color:'Florett Silver',     baseMileage:34000, milesPerYear:11000 },
    ]},
  { id:'cust-045', batch:2, firstName:'Amara',       lastName:'Diallo',    phone:'(415) 555-0145', email:'adiallo@twitter.com',           address:'1355 Market St, San Francisco, CA 94103',   occupation:'Communications Manager, X/Twitter', since:'2024-10-15', visits:2,
    vehicles:[
      { id:'veh-m-049', vin:'5GAKVBKD1CJ239481', year:2021, make:'Buick',     model:'Enclave',  trim:'Premium AWD',     color:'Summit White',       baseMileage:19000, milesPerYear:11000 },
    ]},
  { id:'cust-046', batch:2, firstName:'Liam',        lastName:'Donnelly',  phone:'(650) 555-0146', email:'ldonnelly@paloaltonetworks.com',address:'3000 Tannery Way, Santa Clara, CA 95054',    occupation:'Threat Intelligence Analyst, PAN',  since:'2024-11-01', visits:2,
    vehicles:[
      { id:'veh-m-050', vin:'1GNSKBKC4KR283740', year:2019, make:'Chevrolet', model:'Tahoe',    trim:'LTZ 4WD',         color:'Black',              baseMileage:61000, milesPerYear:13000 },
    ]},
  { id:'cust-047', batch:2, firstName:'Yuki',        lastName:'Tanaka',    phone:'(408) 555-0147', email:'ytanaka@nintendo.com',          address:'4600 Silver Creek Valley Rd, San Jose, CA',  occupation:'Localization Lead, Nintendo',       since:'2024-11-15', visits:2,
    vehicles:[
      { id:'veh-m-051', vin:'JA4AZ3A32LZ028492', year:2020, make:'Mitsubishi',model:'Outlander',trim:'SEL S-AWC',       color:'Labrador Black',     baseMileage:38000, milesPerYear:12000 },
    ]},
  { id:'cust-048', batch:2, firstName:'Serena',      lastName:'Park',      phone:'(650) 555-0148', email:'serena.park.pa@gmail.com',      address:'380 Forest Ave, Palo Alto, CA 94301',        occupation:'Physical Therapist, PAMF',          since:'2024-12-01', visits:1,
    vehicles:[
      { id:'veh-m-052', vin:'KMHGN4JE3DU003948', year:2022, make:'Genesis',   model:'GV70',     trim:'2.5T Standard',   color:'Uyuni White',        baseMileage:11000, milesPerYear:10000 },
    ]},
  { id:'cust-049', batch:2, firstName:'Max',         lastName:'Reinhardt', phone:'(415) 555-0149', email:'mreinhardt@cloudflare.com',     address:'101 Townsend St, San Francisco, CA 94107',  occupation:'Security Researcher, Cloudflare',   since:'2024-12-10', visits:1,
    vehicles:[
      { id:'veh-m-053', vin:'WP0AB2A73LL048293', year:2020, make:'Porsche',   model:'Cayenne',  trim:'S',               color:'Jet Black',          baseMileage:43000, milesPerYear:9000  },
    ]},
  { id:'cust-050', batch:2, firstName:'Claire',      lastName:'Fontaine',  phone:'(650) 555-0150', email:'cfontaine.mp@gmail.com',        address:'555 Middlefield Rd, Menlo Park, CA 94025',  occupation:'Civil Engineer, AECOM',             since:'2024-12-20', visits:1,
    vehicles:[
      { id:'veh-m-054', vin:'2T1BURHE1JC128493', year:2022, make:'Toyota',    model:'Corolla',  trim:'SE Nightshade',   color:'Supersonic Red',     baseMileage:9000,  milesPerYear:11000 },
    ]},

  // ══════════════════════════════════════════════════════════════
  //  BATCH 3 — customers 51-75 (families, trades, local businesses)
  // ══════════════════════════════════════════════════════════════
  { id:'cust-051', batch:3, firstName:'Gerald',      lastName:'Thompson',  phone:'(650) 555-0151', email:'gthompson.plumbing@gmail.com',  address:'450 El Camino Real, Los Altos, CA 94022',   occupation:'Master Plumber, Thompson Plumbing',since:'2025-01-05', visits:9,
    vehicles:[
      { id:'veh-m-055', vin:'1GT49REY9LF228394', year:2020, make:'GMC',       model:'Sierra 2500', trim:'Denali 4WD',   color:'Onyx Black',         baseMileage:49000, milesPerYear:16000 },
      { id:'veh-m-056', vin:'1FTBF2B69LEA28394', year:2020, make:'Ford',      model:'F-250',    trim:'XLT SRW 4WD',    color:'Agate Black',        baseMileage:54000, milesPerYear:15000 },
    ]},
  { id:'cust-052', batch:3, firstName:'Sandra',      lastName:'Ortega',    phone:'(408) 555-0152', email:'sortega.daycare@gmail.com',     address:'2150 Alum Rock Ave, San Jose, CA 95116',    occupation:'Daycare Director, Sunshine Center', since:'2025-01-18', visits:8,
    vehicles:[
      { id:'veh-m-057', vin:'5TDKZ3DC4LS013847', year:2020, make:'Toyota',    model:'Sienna',   trim:'XSE AWD',        color:'Midnight Black',     baseMileage:38000, milesPerYear:14000 },
    ]},
  { id:'cust-053', batch:3, firstName:'Jerome',      lastName:'Banks',     phone:'(510) 555-0153', email:'jbanks.oakland@gmail.com',      address:'4000 Broadway, Oakland, CA 94611',           occupation:'Electrician, Banks Electric',       since:'2025-02-01', visits:7,
    vehicles:[
      { id:'veh-m-058', vin:'1GC1KSEYXKF238491', year:2019, make:'Chevrolet', model:'Silverado 2500', trim:'LTZ 4WD', color:'Summit White',       baseMileage:67000, milesPerYear:15000 },
    ]},
  { id:'cust-054', batch:3, firstName:'Fatima',      lastName:'Al-Rashid', phone:'(650) 555-0154', email:'falrashid.fw@gmail.com',        address:'1200 Fremont Ave, Los Altos, CA 94024',     occupation:'Pediatrician, Stanford Medical',    since:'2025-02-15', visits:7,
    vehicles:[
      { id:'veh-m-059', vin:'5TDBY5G18LS028394', year:2020, make:'Toyota',    model:'Sequoia',  trim:'Platinum 4WD',   color:'Blizzard Pearl',     baseMileage:32000, milesPerYear:12000 },
    ]},
  { id:'cust-055', batch:3, firstName:'Pete',        lastName:'Hawkins',   phone:'(408) 555-0155', email:'pete.hawkins.hvac@gmail.com',   address:'780 N 1st St, San Jose, CA 95112',           occupation:'HVAC Technician, Hawkins Cooling', since:'2025-03-01', visits:6,
    vehicles:[
      { id:'veh-m-060', vin:'3TMGZ5AN5LM028394', year:2020, make:'Toyota',    model:'Tacoma',   trim:'TRD Sport 4x4',  color:'Army Green',         baseMileage:43000, milesPerYear:14000 },
    ]},
  { id:'cust-056', batch:3, firstName:'Valentina',   lastName:'Cruz',      phone:'(415) 555-0156', email:'vcruz.sf.dentist@gmail.com',    address:'2100 Webster St, San Francisco, CA 94115',  occupation:'Dentist, Pacific Dental Associates',since:'2025-03-15', visits:6,
    vehicles:[
      { id:'veh-m-061', vin:'ZFFXW3AB5L0248394', year:2020, make:'Ferrari',   model:'Portofino',trim:'Base',            color:'Rosso Corsa',        baseMileage:8000,  milesPerYear:5000  },
      { id:'veh-m-062', vin:'5TDGRRAH4LS028394', year:2020, make:'Toyota',    model:'Highlander',trim:'Platinum AWD',  color:'Magnetic Gray',      baseMileage:27000, milesPerYear:12000 },
    ]},
  { id:'cust-057', batch:3, firstName:'Collin',      lastName:'Marsh',     phone:'(650) 555-0157', email:'cmarsh.realtor@gmail.com',      address:'700 Main St, Redwood City, CA 94063',        occupation:'Commercial Realtor, CBRE',          since:'2025-04-01', visits:5,
    vehicles:[
      { id:'veh-m-063', vin:'1GNSCRKD9LR120394', year:2020, make:'Chevrolet', model:'Suburban', trim:'LT 4WD',         color:'Black',              baseMileage:48000, milesPerYear:14000 },
    ]},
  { id:'cust-058', batch:3, firstName:'Diane',       lastName:'Wolfe',     phone:'(408) 555-0158', email:'dwolfe.saratoga@gmail.com',     address:'14420 Big Basin Way, Saratoga, CA 95070',    occupation:'Retired Teacher',                   since:'2025-04-15', visits:5,
    vehicles:[
      { id:'veh-m-064', vin:'1HGCV2F55LA028394', year:2020, make:'Honda',     model:'Accord',   trim:'EX-L V6',        color:'Platinum White',     baseMileage:29000, milesPerYear:9000  },
    ]},
  { id:'cust-059', batch:3, firstName:'Rodrigo',     lastName:'Estrada',   phone:'(408) 555-0159', email:'restrada.landscaping@gmail.com',address:'1100 Sunnyvale-Saratoga Rd, Sunnyvale, CA',  occupation:'Landscaper, Estrada Gardens',       since:'2025-05-01', visits:4,
    vehicles:[
      { id:'veh-m-065', vin:'1FTEX1EB4LKF28394', year:2020, make:'Ford',      model:'F-150',    trim:'XL Regular Cab', color:'Oxford White',       baseMileage:58000, milesPerYear:18000 },
    ]},
  { id:'cust-060', batch:3, firstName:'Wei',         lastName:'Liang',     phone:'(408) 555-0160', email:'wliang.cupertino@gmail.com',    address:'22100 Stevens Creek Blvd, Cupertino, CA',   occupation:'Software Engineer, Apple',          since:'2025-05-15', visits:5,
    vehicles:[
      { id:'veh-m-066', vin:'5YJ3E1EB7RF028394', year:2022, make:'Tesla',     model:'Model 3',  trim:'Standard Range',  color:'Deep Blue',          baseMileage:12000, milesPerYear:13000 },
    ]},
  { id:'cust-061', batch:3, firstName:'Ingrid',      lastName:'Johansson', phone:'(650) 555-0161', email:'ingrid.j.ericsson@gmail.com',   address:'6300 Hollister Ave, Santa Barbara, CA',     occupation:'Telecom Engineer, Ericsson',        since:'2025-06-01', visits:4,
    vehicles:[
      { id:'veh-m-067', vin:'YV4162UM4N2048394', year:2022, make:'Volvo',     model:'XC40',     trim:'Recharge Pure Electric', color:'Fjord Blue',  baseMileage:14000, milesPerYear:10000 },
    ]},
  { id:'cust-062', batch:3, firstName:'Tyrone',      lastName:'Washington', phone:'(510) 555-0162', email:'twashington.contractor@gmail.com', address:'1800 Adeline St, Oakland, CA 94607',    occupation:'General Contractor',               since:'2025-06-15', visits:4,
    vehicles:[
      { id:'veh-m-068', vin:'3GCPCREC0LG028394', year:2020, make:'Chevrolet', model:'Silverado 1500', trim:'LT Trail Boss', color:'Black',          baseMileage:52000, milesPerYear:16000 },
    ]},
  { id:'cust-063', batch:3, firstName:'Penelope',    lastName:'Quinn',     phone:'(650) 555-0163', email:'pquinn.attorney@gmail.com',     address:'2600 El Camino Real, Burlingame, CA 94010',  occupation:'Family Law Attorney',               since:'2025-07-01', visits:3,
    vehicles:[
      { id:'veh-m-069', vin:'WDDWJ8JB5LF128394', year:2020, make:'Mercedes-Benz', model:'C300', trim:'4MATIC',         color:'Selenite Gray',      baseMileage:32000, milesPerYear:11000 },
    ]},
  { id:'cust-064', batch:3, firstName:'Alfonso',     lastName:'Reyes',     phone:'(408) 555-0164', email:'areyes.chef@gmail.com',         address:'15 S Murphy Ave, Sunnyvale, CA 94086',       occupation:'Executive Chef, Adega Restaurant',  since:'2025-07-15', visits:3,
    vehicles:[
      { id:'veh-m-070', vin:'5FNYF8H90LB028394', year:2020, make:'Honda',     model:'Pilot',    trim:'Touring AWD',    color:'Lunar Silver',       baseMileage:37000, milesPerYear:13000 },
    ]},
  { id:'cust-065', batch:3, firstName:'Brianna',     lastName:'Scott',     phone:'(415) 555-0165', email:'bscott.nurse@gmail.com',        address:'1250 16th Ave, San Francisco, CA 94122',    occupation:'RN, UCSF Medical Center',           since:'2025-08-01', visits:3,
    vehicles:[
      { id:'veh-m-071', vin:'KM8J3CA43LU028394', year:2020, make:'Hyundai',   model:'Tucson',   trim:'SEL',             color:'Typhoon Silver',     baseMileage:33000, milesPerYear:12000 },
    ]},
  { id:'cust-066', batch:3, firstName:'Paul',        lastName:'Whitfield', phone:'(650) 555-0166', email:'pwhitfield.finance@gmail.com',  address:'220 Portage Ave, Palo Alto, CA 94306',       occupation:'CPA, Whitfield & Associates',       since:'2025-08-15', visits:2,
    vehicles:[
      { id:'veh-m-072', vin:'WDDHF8JB1LA028394', year:2019, make:'Mercedes-Benz', model:'E350', trim:'4MATIC',         color:'Iridium Silver',     baseMileage:47000, milesPerYear:10000 },
    ]},
  { id:'cust-067', batch:3, firstName:'Mei',         lastName:'Huang',     phone:'(408) 555-0167', email:'mei.huang.teacher@gmail.com',   address:'100 W Washington Ave, Sunnyvale, CA 94086',  occupation:'Math Teacher, Cupertino High',      since:'2025-09-01', visits:2,
    vehicles:[
      { id:'veh-m-073', vin:'2T1BURHE5JC028394', year:2019, make:'Toyota',    model:'Corolla',  trim:'LE',              color:'Blue Crush',         baseMileage:45000, milesPerYear:11000 },
    ]},
  { id:'cust-068', batch:3, firstName:'Zachary',     lastName:'Cole',      phone:'(510) 555-0168', email:'zcole.mechanic@gmail.com',      address:'800 Hegenberger Rd, Oakland, CA 94621',      occupation:'Machinist, Oakland Precision',      since:'2025-09-15', visits:2,
    vehicles:[
      { id:'veh-m-074', vin:'1D7RB1GT0AS028394', year:2019, make:'Ram',       model:'1500',     trim:'Sport Crew Cab',  color:'Bright Silver',      baseMileage:72000, milesPerYear:15000 },
    ]},
  { id:'cust-069', batch:3, firstName:'Ingrid',      lastName:'Voss',      phone:'(650) 555-0169', email:'ivoss.interior@gmail.com',      address:'680 Oak Grove Ave, Menlo Park, CA 94025',   occupation:'Interior Designer',                since:'2025-10-01', visits:2,
    vehicles:[
      { id:'veh-m-075', vin:'WDDZF4KB8LA028394', year:2020, make:'Mercedes-Benz', model:'GLC300', trim:'4MATIC',       color:'Iridium Silver',     baseMileage:28000, milesPerYear:9000  },
    ]},
  { id:'cust-070', batch:3, firstName:'Damian',      lastName:'Wells',     phone:'(415) 555-0170', email:'dwells.writer@gmail.com',       address:'2525 16th St, San Francisco, CA 94103',      occupation:'Freelance Tech Writer',             since:'2025-10-15', visits:2,
    vehicles:[
      { id:'veh-m-076', vin:'3FADP4FJ5KM028394', year:2019, make:'Ford',      model:'Escape',   trim:'SE FWD',          color:'Magnetic',           baseMileage:51000, milesPerYear:11000 },
    ]},
  { id:'cust-071', batch:3, firstName:'Anastasia',   lastName:'Kozlov',    phone:'(650) 555-0171', email:'akozlov.stanford@gmail.com',    address:'780 Arastradero Rd, Palo Alto, CA 94306',   occupation:'Postdoctoral Researcher, Stanford', since:'2025-11-01', visits:3,
    vehicles:[
      { id:'veh-m-077', vin:'WAUZZZ8V9LA028394', year:2020, make:'Audi',      model:'Q5',       trim:'Premium Plus',    color:'Navarra Blue',       baseMileage:30000, milesPerYear:11000 },
    ]},
  { id:'cust-072', batch:3, firstName:'Winston',     lastName:'Hayes',     phone:'(408) 555-0172', email:'whayes.insurance@gmail.com',    address:'900 S Winchester Blvd, San Jose, CA 95128',  occupation:'Insurance Broker, State Farm',      since:'2025-11-15', visits:2,
    vehicles:[
      { id:'veh-m-078', vin:'1HGCR2F55LA028394', year:2020, make:'Honda',     model:'Accord',   trim:'Sport',           color:'Sonic Gray',         baseMileage:31000, milesPerYear:12000 },
    ]},
  { id:'cust-073', batch:3, firstName:'Gabriela',    lastName:'Flores',    phone:'(408) 555-0173', email:'gflores.np@gmail.com',          address:'3280 Story Rd, San Jose, CA 95127',          occupation:'Nurse Practitioner, Kaiser',        since:'2025-12-01', visits:1,
    vehicles:[
      { id:'veh-m-079', vin:'5YJSA1E68LF028394', year:2020, make:'Tesla',     model:'Model S',  trim:'Long Range',      color:'Midnight Silver',    baseMileage:35000, milesPerYear:12000 },
    ]},
  { id:'cust-074', batch:3, firstName:'Evan',        lastName:'Larson',    phone:'(650) 555-0174', email:'elarson.engineer@gmail.com',    address:'1 Hacker Way, Menlo Park, CA 94025',         occupation:'Systems Engineer, Meta',            since:'2025-12-10', visits:1,
    vehicles:[
      { id:'veh-m-080', vin:'JN8AT3BB3LW028394', year:2020, make:'Nissan',    model:'Pathfinder',trim:'SL 4WD',         color:'Pearl White',        baseMileage:36000, milesPerYear:11000 },
    ]},
  { id:'cust-075', batch:3, firstName:'Renee',       lastName:'Dupont',    phone:'(415) 555-0175', email:'rdupont.therapist@gmail.com',   address:'3100 Fillmore St, San Francisco, CA 94123',  occupation:'Licensed Therapist, Private Practice', since:'2025-12-20', visits:1,
    vehicles:[
      { id:'veh-m-081', vin:'WBAKJ4C52BC028394', year:2022, make:'BMW',       model:'5 Series', trim:'530i xDrive',     color:'Mineral White',      baseMileage:12000, milesPerYear:9000  },
    ]},

  // ══════════════════════════════════════════════════════════════
  //  BATCH 4 — customers 76-100 (South Bay, academics, medical)
  // ══════════════════════════════════════════════════════════════
  { id:'cust-076', batch:4, firstName:'Hector',      lastName:'Ramirez',   phone:'(408) 555-0176', email:'hramirez.auto@gmail.com',       address:'600 E Brokaw Rd, San Jose, CA 95112',        occupation:'Auto Parts Distributor',            since:'2026-01-05', visits:9,
    vehicles:[
      { id:'veh-m-082', vin:'1FTFW1E88LKE28394', year:2020, make:'Ford',      model:'F-150',    trim:'Lariat SuperCrew', color:'Velocity Blue',     baseMileage:61000, milesPerYear:18000 },
      { id:'veh-m-083', vin:'1GCVKSEC8LZ028394', year:2020, make:'Chevrolet', model:'Silverado 1500', trim:'High Country', color:'Northsky Blue',  baseMileage:55000, milesPerYear:16000 },
    ]},
  { id:'cust-077', batch:4, firstName:'Diana',       lastName:'Chong',     phone:'(408) 555-0177', email:'diana.chong.cfo@gmail.com',     address:'3550 Stevens Creek Blvd, Santa Clara, CA',   occupation:'CFO, MedTech Startup',              since:'2026-01-18', visits:8,
    vehicles:[
      { id:'veh-m-084', vin:'5UX33DT09N9E28394', year:2022, make:'BMW',       model:'X7',       trim:'xDrive40i',       color:'Sparkling Copper',   baseMileage:14000, milesPerYear:11000 },
    ]},
  { id:'cust-078', batch:4, firstName:'Otis',        lastName:'Freeman',   phone:'(510) 555-0178', email:'ofreeman.music@gmail.com',      address:'2025 Broadway, Oakland, CA 94612',           occupation:'Music Producer, Freeway Sound',     since:'2026-02-01', visits:7,
    vehicles:[
      { id:'veh-m-085', vin:'1C4RJFLGXLC028394', year:2020, make:'Jeep',      model:'Grand Cherokee', trim:'Overland 4WD', color:'Sting-Gray',     baseMileage:44000, milesPerYear:12000 },
    ]},
  { id:'cust-079', batch:4, firstName:'Xiomara',     lastName:'Vega',      phone:'(650) 555-0179', email:'xvega.biomed@gmail.com',        address:'1291 Middlefield Rd, Palo Alto, CA 94301',  occupation:'Biomedical Engineer, Genentech',    since:'2026-02-15', visits:7,
    vehicles:[
      { id:'veh-m-086', vin:'SADFP2BV4LA028394', year:2020, make:'Land Rover',model:'Discovery',trim:'SE',              color:'Santorini Black',    baseMileage:36000, milesPerYear:11000 },
    ]},
  { id:'cust-080', batch:4, firstName:'Stanley',     lastName:'Nguyen',    phone:'(408) 555-0180', email:'snguyen.bakery@gmail.com',      address:'1288 Blossom Hill Rd, San Jose, CA 95118',   occupation:'Bakery Owner, Saigon Patisserie',   since:'2026-03-01', visits:6,
    vehicles:[
      { id:'veh-m-087', vin:'3TMGZ5AN5NM028394', year:2022, make:'Toyota',    model:'Tacoma',   trim:'SR5 4x4',         color:'Cement Gray',        baseMileage:19000, milesPerYear:14000 },
    ]},
  { id:'cust-081', batch:4, firstName:'Celeste',     lastName:'Morgan',    phone:'(415) 555-0181', email:'cmorgan.nonprofit@gmail.com',   address:'1600 7th Ave, San Francisco, CA 94122',      occupation:'Executive Director, Bay Area NPO',  since:'2026-01-08', visits:6,
    vehicles:[
      { id:'veh-m-088', vin:'5TDYZ3DC2LS028394', year:2020, make:'Toyota',    model:'Sienna',   trim:'XLE AWD',         color:'Predawn Gray',       baseMileage:42000, milesPerYear:13000 },
    ]},
  { id:'cust-082', batch:4, firstName:'Hugo',        lastName:'Steinberg', phone:'(650) 555-0182', email:'hsteinberg.invest@gmail.com',   address:'3000 Sand Hill Rd, Menlo Park, CA 94025',    occupation:'Investment Manager, Kleiner Perkins',since:'2026-01-22', visits:5,
    vehicles:[
      { id:'veh-m-089', vin:'WP1BA2AY5LDA28394', year:2020, make:'Porsche',   model:'Cayenne',  trim:'E-Hybrid',        color:'Moonlight Blue',     baseMileage:24000, milesPerYear:9000  },
    ]},
  { id:'cust-083', batch:4, firstName:'Latoya',      lastName:'Hamilton',  phone:'(510) 555-0183', email:'lhamilton.judge@gmail.com',     address:'661 Washington St, Oakland, CA 94607',       occupation:'Administrative Judge, EEOC',        since:'2026-02-05', visits:5,
    vehicles:[
      { id:'veh-m-090', vin:'1LNHM93R09Y028394', year:2019, make:'Lincoln',   model:'Town Car', trim:'Executive L',     color:'Cashmere Tri-coat',  baseMileage:58000, milesPerYear:9000  },
    ]},
  { id:'cust-084', batch:4, firstName:'Finn',        lastName:'O\'Brien',  phone:'(650) 555-0184', email:'fobrien.biotech@gmail.com',     address:'1700 Owens St, San Francisco, CA 94158',     occupation:'Scientist, Genentech',              since:'2026-02-18', visits:4,
    vehicles:[
      { id:'veh-m-091', vin:'1G1ZB5ST3LF028394', year:2020, make:'Chevrolet', model:'Malibu',   trim:'Premier',         color:'Summit White',       baseMileage:32000, milesPerYear:11000 },
    ]},
  { id:'cust-085', batch:4, firstName:'Monique',     lastName:'Petit',     phone:'(415) 555-0185', email:'mpetit.restaurant@gmail.com',   address:'690 Van Ness Ave, San Francisco, CA 94102',  occupation:'Restaurateur, Brasserie 69',        since:'2026-03-01', visits:5,
    vehicles:[
      { id:'veh-m-092', vin:'ZFF82ENA0J0228394', year:2020, make:'Ferrari',   model:'Roma',     trim:'Base',            color:'Argento Nurburgring', baseMileage:11000, milesPerYear:5000  },
      { id:'veh-m-093', vin:'WDD2130231A028394', year:2019, make:'Mercedes-Benz', model:'Sprinter', trim:'2500 Passenger Van', color:'Arctic White', baseMileage:81000, milesPerYear:18000 },
    ]},
  { id:'cust-086', batch:4, firstName:'Alicia',      lastName:'Hammond',   phone:'(408) 555-0186', email:'ahammond.principal@gmail.com',  address:'7700 Almaden Expwy, San Jose, CA 95120',     occupation:'School Principal, SJUSD',           since:'2026-01-12', visits:4,
    vehicles:[
      { id:'veh-m-094', vin:'5TDKZ3DC6LS028394', year:2020, make:'Toyota',    model:'Sienna',   trim:'LE FWD',          color:'Celestial Silver',   baseMileage:38000, milesPerYear:12000 },
    ]},
  { id:'cust-087', batch:4, firstName:'Reuben',      lastName:'Goldstein', phone:'(650) 555-0187', email:'rgoldstein.optometry@gmail.com',address:'2200 El Camino Real, Palo Alto, CA 94306',   occupation:'Optometrist, Peninsula Eye Care',   since:'2026-01-28', visits:4,
    vehicles:[
      { id:'veh-m-095', vin:'WAUZZZGY5LA028394', year:2020, make:'Audi',      model:'Q7',       trim:'Premium Plus',    color:'Mythos Black',       baseMileage:29000, milesPerYear:11000 },
    ]},
  { id:'cust-088', batch:4, firstName:'Layla',       lastName:'Hassan',    phone:'(408) 555-0188', email:'lhassan.pharmacist@gmail.com',  address:'1100 W El Camino Real, Sunnyvale, CA 94087', occupation:'Pharmacist, Walgreens',             since:'2026-02-08', visits:3,
    vehicles:[
      { id:'veh-m-096', vin:'2HKRW2H84LH028394', year:2020, make:'Honda',     model:'CR-V',     trim:'EX AWD',          color:'Lunar Silver',       baseMileage:27000, milesPerYear:11000 },
    ]},
  { id:'cust-089', batch:4, firstName:'Douglas',     lastName:'Chan',      phone:'(415) 555-0189', email:'dchan.architect@gmail.com',     address:'2000 Market St, San Francisco, CA 94114',   occupation:'Architect, Gensler',                since:'2026-02-22', visits:3,
    vehicles:[
      { id:'veh-m-097', vin:'WVGZZZ5NZLD028394', year:2020, make:'Volkswagen',model:'Touareg',  trim:'V8 TD',           color:'Deep Black',         baseMileage:34000, milesPerYear:10000 },
    ]},
  { id:'cust-090', batch:4, firstName:'Carmen',      lastName:'Delgado',   phone:'(408) 555-0190', email:'cdelgado.dental@gmail.com',     address:'4800 Almaden Expwy, San Jose, CA 95118',     occupation:'Dental Hygienist, Smile Design',    since:'2026-03-05', visits:3,
    vehicles:[
      { id:'veh-m-098', vin:'5TDGRRAH3LS028394', year:2020, make:'Toyota',    model:'Highlander',trim:'XSE AWD',        color:'Wind Chill Pearl',   baseMileage:31000, milesPerYear:13000 },
    ]},
  { id:'cust-091', batch:4, firstName:'Bart',        lastName:'Nielsen',   phone:'(650) 555-0191', email:'bnielsen.phd@gmail.com',        address:'370 Panama Mall, Stanford, CA 94305',        occupation:'Associate Professor, Stanford EE',  since:'2026-01-15', visits:2,
    vehicles:[
      { id:'veh-m-099', vin:'WBA5R7C52LA028394', year:2019, make:'BMW',       model:'330i',     trim:'M-Sport',         color:'Jet Black',          baseMileage:41000, milesPerYear:10000 },
    ]},
  { id:'cust-092', batch:4, firstName:'Keisha',      lastName:'Powell',    phone:'(510) 555-0192', email:'kpowell.social.worker@gmail.com',address:'3800 Market St, Oakland, CA 94608',         occupation:'Social Worker, Alameda County',     since:'2026-01-29', visits:2,
    vehicles:[
      { id:'veh-m-100', vin:'1G1ZD5ST2LF028394', year:2019, make:'Chevrolet', model:'Malibu',   trim:'LT',              color:'Iridescent Pearl',   baseMileage:48000, milesPerYear:12000 },
    ]},
  { id:'cust-093', batch:4, firstName:'Tomas',       lastName:'Eriksson',  phone:'(650) 555-0193', email:'teriksson.ericsson@gmail.com',  address:'900 Chelys Ave, Palo Alto, CA 94303',        occupation:'RF Engineer, Ericsson',             since:'2026-02-12', visits:2,
    vehicles:[
      { id:'veh-m-101', vin:'YV4BR0DK5L2028394', year:2020, make:'Volvo',     model:'XC90',     trim:'T6 Inscription',  color:'Onyx Black',         baseMileage:27000, milesPerYear:10000 },
    ]},
  { id:'cust-094', batch:4, firstName:'Nichelle',    lastName:'Barnes',    phone:'(408) 555-0194', email:'nbarnes.manager@gmail.com',     address:'500 McCarthy Blvd, Milpitas, CA 95035',      occupation:'Operations Manager, Cisco',         since:'2026-02-25', visits:2,
    vehicles:[
      { id:'veh-m-102', vin:'2HKRW1H5XLH028394', year:2020, make:'Honda',     model:'CR-V',     trim:'LX FWD',          color:'Obsidian Blue',      baseMileage:33000, milesPerYear:12000 },
    ]},
  { id:'cust-095', batch:4, firstName:'Gerald',      lastName:'Fong',      phone:'(415) 555-0195', email:'gfong.cpa@gmail.com',           address:'345 Spear St, San Francisco, CA 94105',      occupation:'CPA, Fong & Associates',            since:'2026-03-08', visits:2,
    vehicles:[
      { id:'veh-m-103', vin:'WAUZZZ4G0LA028394', year:2019, make:'Audi',      model:'A8 L',     trim:'55 TFSI',         color:'Florett Silver',     baseMileage:44000, milesPerYear:9000  },
    ]},
  { id:'cust-096', batch:4, firstName:'Nadine',      lastName:'Osei',      phone:'(510) 555-0196', email:'nosei.professor@gmail.com',     address:'200 Oxford St, Berkeley, CA 94720',          occupation:'Professor, UC Berkeley Sociology',  since:'2026-01-20', visits:1,
    vehicles:[
      { id:'veh-m-104', vin:'JM3KE4DY0L0028394', year:2020, make:'Mazda',     model:'CX-9',     trim:'Grand Touring AWD', color:'Polymetal Gray',   baseMileage:29000, milesPerYear:11000 },
    ]},
  { id:'cust-097', batch:4, firstName:'Trevor',      lastName:'Ashford',   phone:'(650) 555-0197', email:'tashford.finance@gmail.com',    address:'3000 El Camino Real, Atherton, CA 94027',    occupation:'Hedge Fund Manager, Atherton Capital',since:'2026-01-30', visits:1,
    vehicles:[
      { id:'veh-m-105', vin:'WBAKJ4C58BC028394', year:2023, make:'BMW',       model:'7 Series', trim:'760i xDrive',     color:'Sophisto Gray',      baseMileage:7000,  milesPerYear:8000  },
    ]},
  { id:'cust-098', batch:4, firstName:'Miriam',      lastName:'Goldberg',  phone:'(415) 555-0198', email:'mgoldberg.attorney@gmail.com',  address:'180 Maiden Ln, San Francisco, CA 94108',    occupation:'Patent Attorney, Wilson Sonsini',   since:'2026-02-14', visits:1,
    vehicles:[
      { id:'veh-m-106', vin:'WDDWJ8JB2LF028394', year:2019, make:'Mercedes-Benz', model:'C43', trim:'AMG 4MATIC',      color:'Obsidian Black',     baseMileage:52000, milesPerYear:9000  },
    ]},
  { id:'cust-099', batch:4, firstName:'Alejandro',   lastName:'Fuentes',   phone:'(408) 555-0199', email:'afuentes.chef@gmail.com',       address:'3000 Alum Rock Ave, San Jose, CA 95116',     occupation:'Sous Chef, Noma San Jose',           since:'2026-02-28', visits:1,
    vehicles:[
      { id:'veh-m-107', vin:'3TMAZ5CN5LM028394', year:2019, make:'Toyota',    model:'Tacoma',   trim:'TRD Off-Road',    color:'Cavalry Blue',       baseMileage:58000, milesPerYear:14000 },
    ]},
  { id:'cust-100', batch:4, firstName:'Isabelle',    lastName:'Leclercq',  phone:'(650) 555-0200', email:'ileclercq.wine@gmail.com',      address:'800 Spring St, Saratoga, CA 95070',          occupation:'Wine Educator, Villa Montalvo',      since:'2026-03-18', visits:1,
    vehicles:[
      { id:'veh-m-108', vin:'VF1RJA00XK8028394', year:2019, make:'Renault',   model:'Koleos',   trim:'Intens',          color:'Pearl White',        baseMileage:36000, milesPerYear:10000 },
    ]},
];

// ── Service Line Templates ────────────────────────────────────────────────────
const SERVICE_PACKAGES = [
  { type:'oil_maintenance',    serviceType:'Oil Change + Maintenance Inspection',
    lines:[
      { opCode:'LOF-SYN', description:'Engine Oil & Filter Change (Full Synthetic)',        laborHrs:0.5, partsCost:48 },
      { opCode:'TIR-ROT', description:'Tire Rotation & Balance (4-Wheel)',                  laborHrs:0.5, partsCost:0  },
      { opCode:'MPI-56',  description:'56-Point Multi-Point Safety Inspection',             laborHrs:0.5, partsCost:0  },
      { opCode:'CAB-FLT', description:'Cabin Air Filter Replacement',                       laborHrs:0.3, partsCost:24 },
      { opCode:'FLU-TOP', description:'Fluid Level Top-Off (Washer / Coolant / PS)',        laborHrs:0.2, partsCost:12 },
    ]},
  { type:'major_service',      serviceType:'60K Major Service', isOemService:true, oemMilestone:'60,000 miles',
    lines:[
      { opCode:'LOF-SYN', description:'Engine Oil & Filter Change (Full Synthetic)',        laborHrs:0.5, partsCost:48 },
      { opCode:'SPK-PLG', description:'Spark Plug Replacement (Set of 4)',                  laborHrs:1.2, partsCost:72 },
      { opCode:'AIR-FLT', description:'Engine Air Filter Replacement',                     laborHrs:0.3, partsCost:28 },
      { opCode:'CAB-FLT', description:'Cabin Air Filter Replacement',                       laborHrs:0.3, partsCost:24 },
      { opCode:'BRK-FLD', description:'Brake Fluid Flush (DOT 3/4)',                       laborHrs:0.5, partsCost:18 },
      { opCode:'CLT-FLS', description:'Coolant Flush & Fill',                              laborHrs:0.8, partsCost:34 },
      { opCode:'TIR-ROT', description:'Tire Rotation & Balance (4-Wheel)',                  laborHrs:0.5, partsCost:0  },
      { opCode:'MPI-56',  description:'56-Point Multi-Point Safety Inspection',             laborHrs:0.5, partsCost:0  },
      { opCode:'SRP-BLT', description:'Serpentine Belt Inspection',                        laborHrs:0.3, partsCost:0  },
    ]},
  { type:'brake_service',      serviceType:'Brake Service — Front & Rear',
    lines:[
      { opCode:'BRK-DX',  description:'Brake System Diagnostic & Measurement',             laborHrs:0.5, partsCost:0   },
      { opCode:'BRK-FPD', description:'Front Brake Pads (OEM-Grade)',                       laborHrs:1.0, partsCost:125 },
      { opCode:'BRK-FRT', description:'Front Brake Rotors (Drilled/Slotted)',               laborHrs:0.0, partsCost:195 },
      { opCode:'BRK-RPD', description:'Rear Brake Pads',                                   laborHrs:0.8, partsCost:105 },
      { opCode:'BRK-FLD', description:'Brake Fluid Flush (DOT 4)',                         laborHrs:0.5, partsCost:22  },
      { opCode:'BRK-HWK', description:'Brake Hardware & Anti-Squeal Kit',                  laborHrs:0.2, partsCost:32  },
    ]},
  { type:'ac_service',         serviceType:'A/C System Service & Recharge',
    lines:[
      { opCode:'AC-DX',   description:'A/C System Performance Diagnostic',                 laborHrs:0.5, partsCost:0  },
      { opCode:'AC-RCH',  description:'A/C Refrigerant Recharge (R-134a)',                 laborHrs:0.5, partsCost:68 },
      { opCode:'AC-CLN',  description:'Evaporator & Condenser Coil Cleaning',              laborHrs:0.5, partsCost:24 },
      { opCode:'CAB-FLT', description:'Cabin Air Filter Replacement',                       laborHrs:0.3, partsCost:24 },
      { opCode:'AC-BLW',  description:'Blower Motor Resistor Inspection',                  laborHrs:0.3, partsCost:0  },
    ]},
  { type:'diagnostic_cel',     serviceType:'Check Engine Light Diagnostic & Repair',
    lines:[
      { opCode:'DX-SCAN', description:'OBD-II Diagnostic Scan & Code Retrieval',           laborHrs:0.5, partsCost:0  },
      { opCode:'DX-INS',  description:'Comprehensive Engine Systems Inspection',           laborHrs:1.0, partsCost:0  },
      { opCode:'O2-SEN',  description:'Oxygen Sensor Replacement (Downstream Bank 1)',     laborHrs:0.8, partsCost:95 },
      { opCode:'CAT-INS', description:'Catalytic Converter Efficiency Test',               laborHrs:0.5, partsCost:0  },
      { opCode:'VCP-CLN', description:'Throttle Body & VVT Solenoid Cleaning',             laborHrs:0.8, partsCost:38 },
      { opCode:'DX-RES',  description:'System Re-scan & Road Test Verification',           laborHrs:0.5, partsCost:0  },
    ]},
  { type:'suspension',         serviceType:'Suspension Inspection & Strut Replacement',
    lines:[
      { opCode:'SUS-DX',  description:'Suspension & Steering Diagnostic',                  laborHrs:0.5, partsCost:0   },
      { opCode:'STR-FR',  description:'Front Strut Assembly (Pair) — OEM Spec',            laborHrs:2.0, partsCost:380 },
      { opCode:'STR-MNT', description:'Strut Mount & Bearing Plate Kit',                   laborHrs:0.0, partsCost:72  },
      { opCode:'SWY-LNK', description:'Sway Bar End Links (Pair)',                         laborHrs:0.5, partsCost:58  },
      { opCode:'ALN-4WL', description:'4-Wheel Alignment (Thrust Alignment)',              laborHrs:1.0, partsCost:0   },
      { opCode:'TIR-ROT', description:'Tire Rotation & Pressure Adjustment',               laborHrs:0.5, partsCost:0   },
    ]},
  { type:'transmission',       serviceType:'Transmission Fluid Service',
    lines:[
      { opCode:'TRN-DX',  description:'Transmission Operation & Fluid Analysis',           laborHrs:0.5, partsCost:0  },
      { opCode:'TRN-FLD', description:'Transmission Fluid Exchange (Drain & Fill)',        laborHrs:1.0, partsCost:92 },
      { opCode:'TRN-FLT', description:'Transmission Filter & Pan Gasket',                 laborHrs:0.0, partsCost:45 },
      { opCode:'DRF-SVC', description:'Differential Fluid Service (Rear)',                 laborHrs:0.5, partsCost:38 },
      { opCode:'TRN-TRD', description:'Road Test & Shift Quality Verification',            laborHrs:0.5, partsCost:0  },
    ]},
  { type:'cooling_system',     serviceType:'Cooling System Service & Thermostat',
    lines:[
      { opCode:'CLT-DX',  description:'Cooling System Pressure Test & Leak Inspection',   laborHrs:0.5, partsCost:0  },
      { opCode:'CLT-FLS', description:'Coolant Flush & Fill (OEM Spec Coolant)',           laborHrs:0.8, partsCost:48 },
      { opCode:'THR-REP', description:'Thermostat & Housing Replacement',                  laborHrs:1.0, partsCost:85 },
      { opCode:'RAD-CAP', description:'Radiator Cap & Overflow Reservoir Inspection',      laborHrs:0.2, partsCost:18 },
      { opCode:'HOS-INS', description:'Upper/Lower Radiator Hose Inspection',              laborHrs:0.3, partsCost:0  },
    ]},
  { type:'tire_alignment',     serviceType:'New Tires & Alignment',
    lines:[
      { opCode:'TIR-MNT', description:'Tire Mounting & Balancing (4 Tires)',               laborHrs:1.0, partsCost:0   },
      { opCode:'TIR-NEW', description:'Michelin Defender2 Tires (Set of 4)',               laborHrs:0.0, partsCost:720 },
      { opCode:'ALN-4WL', description:'4-Wheel Alignment (Computerized)',                  laborHrs:1.0, partsCost:0   },
      { opCode:'VLV-STM', description:'TPMS Valve Stems & Service Kit (Set of 4)',         laborHrs:0.0, partsCost:48  },
    ]},
  { type:'battery_electrical', serviceType:'Battery Replacement & Electrical Inspection',
    lines:[
      { opCode:'BAT-TST', description:'Battery Load Test & Charging System Diagnostic',   laborHrs:0.3, partsCost:0   },
      { opCode:'BAT-REP', description:'AGM Battery Replacement (Group 48)',               laborHrs:0.5, partsCost:198 },
      { opCode:'ALT-TST', description:'Alternator Output & Ripple Test',                   laborHrs:0.3, partsCost:0   },
      { opCode:'CLN-TRM', description:'Battery Terminal Cleaning & Corrosion Treatment',  laborHrs:0.2, partsCost:12  },
      { opCode:'ELC-INS', description:'Electrical Grounds & Fusebox Inspection',           laborHrs:0.3, partsCost:0   },
    ]},
  { type:'engine_repair',      serviceType:'Engine Diagnostic & Valve Cover Gasket',
    lines:[
      { opCode:'ENG-DX',  description:'Engine Performance Diagnostic (Compression Test)', laborHrs:1.0, partsCost:0  },
      { opCode:'VCG-REP', description:'Valve Cover Gasket Replacement',                    laborHrs:1.5, partsCost:65 },
      { opCode:'SPK-PLG', description:'Spark Plug Replacement (Set of 6)',                 laborHrs:1.5, partsCost:95 },
      { opCode:'IGN-COL', description:'Ignition Coil Replacement (Cylinder 3)',            laborHrs:0.5, partsCost:72 },
      { opCode:'PCV-SYS', description:'PCV Valve & Hose Replacement',                     laborHrs:0.3, partsCost:28 },
      { opCode:'INJ-CLN', description:'Fuel Injector Cleaning Service (6 injectors)',      laborHrs:0.5, partsCost:65 },
      { opCode:'ENG-OIL', description:'Oil Change with Fresh Filter (Post-Repair)',        laborHrs:0.5, partsCost:55 },
    ]},
  { type:'wheel_bearing',      serviceType:'Wheel Bearing & Hub Assembly',
    lines:[
      { opCode:'WHL-DX',  description:'Wheel Bearing Noise Diagnostic & Road Test',       laborHrs:0.5, partsCost:0   },
      { opCode:'HUB-LF',  description:'LF Hub & Bearing Assembly Replacement',            laborHrs:1.5, partsCost:145 },
      { opCode:'HUB-RF',  description:'RF Hub & Bearing Assembly Replacement',            laborHrs:1.5, partsCost:145 },
      { opCode:'ALN-4WL', description:'4-Wheel Alignment Post-Repair',                    laborHrs:1.0, partsCost:0   },
      { opCode:'TIR-ROT', description:'Tire Rotation & Pressure Check',                   laborHrs:0.5, partsCost:0   },
    ]},
  { type:'pre_trip_inspection', serviceType:'Pre-Trip Safety Inspection + Oil Change',
    lines:[
      { opCode:'LOF-SYN', description:'Engine Oil & Filter Change (Full Synthetic)',        laborHrs:0.5, partsCost:48 },
      { opCode:'MPI-56',  description:'56-Point Multi-Point Safety Inspection',             laborHrs:0.5, partsCost:0  },
      { opCode:'TIR-INS', description:'Tire Tread Depth & Pressure Inspection (4 Tires)',  laborHrs:0.3, partsCost:0  },
      { opCode:'BRK-INS', description:'Brake System Visual Inspection',                    laborHrs:0.3, partsCost:0  },
      { opCode:'WPR-REP', description:'Wiper Blade Replacement (Front Pair)',               laborHrs:0.2, partsCost:34 },
      { opCode:'FLU-TOP', description:'All Fluid Top-Off (Coolant / Washer / PS)',          laborHrs:0.2, partsCost:15 },
    ]},
];

// ── Customer concern text by package type ─────────────────────────────────────
const CUSTOMER_CONCERNS = {
  oil_maintenance:     'Due for oil change, also want a general safety check',
  major_service:       'Hitting 60K miles soon, want the full service done right',
  brake_service:       'Brakes are squealing when I stop, pedal feels a bit soft',
  ac_service:          'A/C stopped blowing cold air, just warm air now',
  diagnostic_cel:      'Check engine light came on, car feels rough at idle',
  suspension:          'Car bounces a lot and pulls to one side on the freeway',
  transmission:        'Feeling hesitation when it shifts, vibration at highway speed',
  cooling_system:      'Temperature gauge running high, saw a little steam once',
  tire_alignment:      'Tires look worn unevenly, car drifts to the right',
  battery_electrical:  'Car was slow to start this morning, battery light came on',
  engine_repair:       'Notice oil dripping, idle is rough, check engine light on',
  wheel_bearing:       'Humming noise from the front end, gets worse at higher speeds',
  pre_trip_inspection: 'Road trip coming up, want oil change and full safety check',
};

// ── DTC codes seeded for diagnostic-type packages ─────────────────────────────
const PACKAGE_DTCS = {
  diagnostic_cel:    [['P0420'],['P0171','P0174'],['P0300','P0301'],['P0442','P0455'],['P0128']],
  engine_repair:     [['P0301','P0316'],['P0011','P0012'],['P0521'],['P0302','P0303']],
  transmission:      [['P0700','P0730'],['P0715'],['P0741'],['P0868']],
  cooling_system:    [['P0116','P0128'],['P0217'],['P0115']],
  battery_electrical:[['P0562','P0563'],['P0540'],['B1000']],
};

// ── Declined service pool (items advisors recommend but customers decline) ────
const DECLINE_POOL = [
  { opCode:'AIR-FLT', description:'Engine Air Filter Replacement',     partsCost:28,  laborHrs:0.3 },
  { opCode:'CAB-FLT', description:'Cabin Air Filter Replacement',      partsCost:24,  laborHrs:0.3 },
  { opCode:'TRN-FLD', description:'Transmission Fluid Exchange',       partsCost:92,  laborHrs:1.0 },
  { opCode:'CLT-FLS', description:'Coolant System Flush',              partsCost:34,  laborHrs:0.8 },
  { opCode:'BRK-FLD', description:'Brake Fluid Flush (DOT 3)',         partsCost:18,  laborHrs:0.5 },
  { opCode:'WPR-REP', description:'Wiper Blade Replacement (Rear)',    partsCost:18,  laborHrs:0.2 },
  { opCode:'FUL-INJ', description:'Fuel Injector Cleaning Service',    partsCost:65,  laborHrs:0.5 },
  { opCode:'PCV-SYS', description:'PCV Valve & Hose Replacement',      partsCost:28,  laborHrs:0.3 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

// Parts markup: 40-55% on high-cost parts, 50-70% on low-cost consumables
function calcPartsCharged(cost) {
  if (cost === 0) return 0;
  const markup = cost > 100 ? 0.38 + Math.random() * 0.12 : 0.50 + Math.random() * 0.20;
  return Math.round(cost * (1 + markup) * 100) / 100;
}

function loyaltyTier(visits) {
  if (visits >= 9) return 'vip';
  if (visits >= 6) return 'loyal';
  if (visits >= 3) return 'regular';
  return 'new';
}

// Preferred contact derived from occupation keywords
function preferredContact(occupation = '') {
  const occ = occupation.toLowerCase();
  if (['attorney','doctor','nurse','physician','surgeon'].some(k => occ.includes(k))) return 'phone';
  if (['engineer','swe','developer','designer','scientist','product','tech','data'].some(k => occ.includes(k))) return 'sms';
  return 'email';
}

// Historical approval rate by loyalty tier
function approvalRate(tier) {
  return { vip: 0.93, loyal: 0.85, regular: 0.74, new: 0.61 }[tier];
}

// Approval time in minutes based on tier and contact preference
function approvalTimeMin(tier, contact) {
  const base = { vip: 12, loyal: 28, regular: 52, new: 95 }[tier];
  const jitter = Math.round((Math.random() - 0.5) * base * 0.6);
  // SMS approvers are faster
  const multiplier = contact === 'sms' ? 0.6 : contact === 'phone' ? 1.1 : 1.0;
  return Math.max(3, Math.round((base + jitter) * multiplier));
}

function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }

function spreadDates(count, start, end) {
  const span = end - start, seg = span / count;
  const out = [];
  for (let i = 0; i < count; i++) {
    const base = start + seg * (i + 0.5);
    const jitter = (Math.random() - 0.5) * 20 * 86400000;
    const d = new Date(Math.max(start, Math.min(end, base + jitter)));
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    if (d.getDay() === 6) d.setDate(d.getDate() - 1);
    out.push(d);
  }
  return out.sort((a, b) => a - b);
}

function getMileage(vehicle, visitDate, visitIndex) {
  const origin = new Date(`${vehicle.year}-07-01`);
  const yrs = (visitDate - origin) / (365.25 * 86400000);
  return Math.max(Math.round(vehicle.baseMileage + yrs * vehicle.milesPerYear + visitIndex * randInt(200, 600)), 500);
}

function pickPackage(vehicle, mileageIn, visitIndex) {
  if (visitIndex % 5 === 0) return pick(['major_service', 'transmission', 'engine_repair']);
  const mod = mileageIn % 10000;
  if (mod < 1500 || mod > 8500) return pick(['major_service', 'oil_maintenance', 'pre_trip_inspection']);
  const make = vehicle.make;
  if (['BMW','Audi','Mercedes-Benz','Porsche','Land Rover'].includes(make))
    return pick(['brake_service','suspension','engine_repair','diagnostic_cel','oil_maintenance']);
  if (['Toyota','Honda','Subaru'].includes(make))
    return pick(['oil_maintenance','oil_maintenance','brake_service','transmission','cooling_system']);
  return pick(['oil_maintenance','brake_service','ac_service','diagnostic_cel','suspension',
               'tire_alignment','battery_electrical','cooling_system','wheel_bearing','pre_trip_inspection']);
}

function statusToKanban(status) {
  return { open:'checked_in', estimate:'estimate_sent', approved:'in_progress', closed:'ready' }[status];
}

function buildLines(pkg, dateIn = new Date()) {
  // Build lines with clock times; cursor advances through the day starting 30min after check-in
  let clockCursor = dateIn.getTime() + 30 * 60000;
  return pkg.lines.map((l, i) => {
    const laborTotal   = Math.round(l.laborHrs * SHOP.laborRate * 100) / 100;
    const charged      = calcPartsCharged(l.partsCost);
    // Actual time spent: techs run 85-115% of flagged time
    const actualHrs    = l.laborHrs === 0 ? 0
      : Math.round(l.laborHrs * (0.85 + Math.random() * 0.30) * 100) / 100;
    let clockIn = null, clockOut = null;
    if (actualHrs > 0) {
      clockIn  = new Date(clockCursor).toISOString();
      clockCursor += Math.round(actualHrs * 3600000);
      clockOut = new Date(clockCursor).toISOString();
      clockCursor += 5 * 60000;  // 5-min transition gap
    }
    return {
      lineNumber:    i + 1,
      opCode:        l.opCode,
      description:   l.description,
      type:          'labor',
      laborHrs:      l.laborHrs,       // flagged (book) hours
      actualHrs,                        // actual time tech spent
      ...(clockIn  ? { clockIn  } : {}),
      ...(clockOut ? { clockOut } : {}),
      laborRate:     SHOP.laborRate,
      laborTotal,                       // billed to customer (flagged hrs × rate)
      partsCost:     l.partsCost,       // shop cost
      partsCharged:  charged,           // retail price to customer
      total:         Math.round((laborTotal + charged) * 100) / 100,
      status:        'complete',
    };
  });
}

// ── AI Insight generator ──────────────────────────────────────────────────────
function generateInsights(ro, cust, vehicle, pkg) {
  const insights = [];
  const mi = ro.mileageIn;

  // 1. Customer relationship
  if (ro.loyaltyTier === 'vip') {
    insights.push(`VIP customer — ${cust.visits} visits, $${ro.customerLTV.toLocaleString()} LTV. Prioritize fast turnaround and flag for advisor follow-up.`);
  } else if (ro.loyaltyTier === 'loyal') {
    insights.push(`Loyal customer (${cust.visits} visits). Strong candidate for maintenance plan enrollment.`);
  } else if (ro.loyaltyTier === 'new') {
    insights.push(`New customer — first impression opportunity. Complimentary multi-point inspection recommended.`);
  }

  // 2. Preferred contact / approval coaching
  if (ro.preferredContact === 'sms') {
    insights.push(`Prefers SMS. Send estimate via text link for fastest approval — average approval time ${Math.round(ro.customerApprovalRate * 100)}% at this tier.`);
  } else if (ro.preferredContact === 'phone') {
    insights.push(`Prefers phone. Call to walk through estimate before sending — this customer approves ${Math.round(ro.customerApprovalRate * 100)}% of the time.`);
  }

  // 3. DTC-based diagnostic guidance
  if (ro.dtcs.includes('P0420')) {
    insights.push('P0420 (cat efficiency): Test upstream O2 sensor first — $95 fix vs $800+ converter. Verify with live data before recommending cat replacement.');
  }
  if (ro.dtcs.includes('P0171') || ro.dtcs.includes('P0174')) {
    insights.push('Lean codes (P0171/P0174): Inspect MAF sensor and intake boot for cracks before ordering parts. Common $0-$85 root cause.');
  }
  if (ro.dtcs.some(d => ['P0300','P0301','P0302','P0303'].includes(d))) {
    insights.push('Misfire code: Test individual ignition coils first ($85 each). Confirm cylinder before recommending injector service.');
  }
  if (ro.dtcs.some(d => ['P0700','P0730','P0741'].includes(d))) {
    insights.push('Transmission codes: Verify fluid level and condition before scheduling teardown. Fluid exchange may resolve shift quality at this mileage.');
  }

  // 4. Mileage milestone upsell
  const nextMilestone = Math.ceil(mi / 30000) * 30000;
  if (nextMilestone - mi < 3000 && nextMilestone <= mi + 3000) {
    insights.push(`Vehicle at ${mi.toLocaleString()} mi — ${nextMilestone.toLocaleString()} mi service due soon. Bundle transmission fluid + differential service while vehicle is in.`);
  }

  // 5. Vehicle make-specific
  const make = vehicle.make;
  if (['BMW','Audi','Mercedes-Benz','Porsche'].includes(make)) {
    insights.push(`European vehicle — use OEM-spec fluids only (LL-01/229.5). Verify part numbers match chassis code before ordering.`);
  }
  if (make === 'Subaru' && mi > 70000) {
    insights.push(`Subaru at ${mi.toLocaleString()} mi — inspect for external head gasket seep. EJ25 engines commonly show seepage at this mileage. Catch early before coolant loss.`);
  }
  if (make === 'Ford' && vehicle.model.includes('F-1')) {
    insights.push(`F-150 high-use truck — check transfer case fluid and differential at this mileage. Often overlooked on fleet/work trucks.`);
  }

  // 6. Declined services re-present
  if (ro.declinedServices.length > 0) {
    const item = ro.declinedServices[0];
    insights.push(`Re-present opportunity: ${item.description} was previously declined. Value: $${item.totalIfDone}. Customer concern was likely cost — offer bundled discount.`);
  }

  // 7. Margin / profitability flag
  if (ro.grossMarginPct < 52) {
    insights.push(`Low-margin RO (${ro.grossMarginPct}%). Consider upselling ${ro.declinedTotal > 0 ? `$${ro.declinedTotal} in declined services` : 'additional maintenance items'} to improve ticket.`);
  }

  // 8. Labor efficiency
  if (ro.totalActualHrs > ro.totalFlaggedHrs * 1.10) {
    const over = Math.round((ro.totalActualHrs - ro.totalFlaggedHrs) * 10) / 10;
    insights.push(`Tech ran ${over}h over flagged time — effective rate dropped to $${ro.effectiveLaborRate}/hr. Review with tech before closing.`);
  }

  // Return top 4 insights
  return insights.slice(0, 4);
}

// ── Generate 100 ROs for a given set of 25 customers ─────────────────────────
function generateBatchROs(customers, roStartIndex) {
  const ACTIVE_COUNT = 15;
  const HIST_COUNT   = ROS_PER_BATCH - ACTIVE_COUNT;

  // Build flat visit list from customers.visits counts
  const custAssignments = [];
  for (const c of customers) {
    for (let i = 0; i < c.visits; i++) custAssignments.push(c);
  }
  // Shuffle
  for (let i = custAssignments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [custAssignments[i], custAssignments[j]] = [custAssignments[j], custAssignments[i]];
  }
  // Trim or pad to exactly ROS_PER_BATCH
  while (custAssignments.length < ROS_PER_BATCH) custAssignments.push(pick(customers));
  custAssignments.splice(ROS_PER_BATCH);

  const histDates   = spreadDates(HIST_COUNT,   new Date('2023-04-01').getTime(), new Date('2026-02-20').getTime());
  const activeDates = spreadDates(ACTIVE_COUNT, new Date('2026-03-18').getTime(), new Date('2026-03-26').getTime());
  const dates       = [...histDates, ...activeDates];

  // Track visit index per customer for mileage continuity
  const visitCounts = {};

  return custAssignments.map((cust, idx) => {
    const visitIdx = visitCounts[cust.id] = (visitCounts[cust.id] || 0) + 1;
    const date     = dates[idx];
    const vehicle  = cust.vehicles[(visitIdx - 1) % cust.vehicles.length];
    const mileageIn = getMileage(vehicle, date, visitIdx);

    const pkgKey = pickPackage(vehicle, mileageIn, visitIdx);
    const pkg    = SERVICE_PACKAGES.find(p => p.type === pkgKey) || SERVICE_PACKAGES[0];

    const now     = new Date('2026-03-27');
    const daysAgo = (now - date) / 86400000;
    let status;
    if      (daysAgo < 1)  status = pick(['open', 'open', 'estimate']);
    else if (daysAgo < 3)  status = pick(['open', 'estimate', 'estimate']);
    else if (daysAgo < 6)  status = pick(['estimate', 'approved', 'approved']);
    else if (daysAgo < 10) status = pick(['approved', 'approved', 'estimate']);
    else                   status = 'closed';

    const lines       = buildLines(pkg, date);
    if (status !== 'closed') {
      lines.forEach((l, i) => {
        l.status = i === 0 ? 'in_progress' : 'pending';
        // Remove clockOut for in_progress lines; remove both for pending
        if (i === 0) { delete l.clockOut; }
        else         { delete l.clockIn; delete l.clockOut; }
      });
    }

    const tech    = pick(TECHNICIANS);
    const advisor = pick(ADVISORS);

    // ── Financials ───────────────────────────────────────────────────────────
    const laborTotal        = lines.reduce((s, l) => s + l.laborTotal, 0);
    const totalPartsCost    = lines.reduce((s, l) => s + l.partsCost, 0);
    const totalPartsCharged = lines.reduce((s, l) => s + l.partsCharged, 0);
    const totalActualHrs    = Math.round(lines.reduce((s, l) => s + l.actualHrs, 0) * 100) / 100;
    const laborCost         = Math.round(lines.reduce((s, l) => s + l.actualHrs * tech.rate, 0) * 100) / 100;
    const effectiveLaborRate = totalActualHrs > 0
      ? Math.round((laborTotal / totalActualHrs) * 100) / 100
      : SHOP.laborRate;
    const shopSupplies      = Math.round((laborTotal * 0.02 + 8) * 100) / 100;
    const tax               = Math.round(totalPartsCharged * 0.0875 * 100) / 100;
    const grandTotal        = Math.round((laborTotal + totalPartsCharged + shopSupplies + tax) * 100) / 100;
    const partsMargin       = Math.round((totalPartsCharged - totalPartsCost) * 100) / 100;
    const laborMargin       = Math.round((laborTotal - laborCost) * 100) / 100;
    const grossMarginDollars = Math.round((partsMargin + laborMargin) * 100) / 100;
    const grossMarginPct    = grandTotal > 0
      ? Math.round((grossMarginDollars / grandTotal) * 1000) / 10
      : 0;

    // ── Customer intelligence ─────────────────────────────────────────────────
    const tier        = loyaltyTier(cust.visits);
    const prefContact = preferredContact(cust.occupation);
    const approvalRt  = approvalRate(tier);

    // ── Declined services (30% of ROs have 1-2 declined items) ───────────────
    const declinedServices = [];
    if (Math.random() < 0.30) {
      const numDeclined = Math.random() < 0.4 ? 2 : 1;
      const pool = [...DECLINE_POOL];
      for (let d = 0; d < numDeclined; d++) {
        const idx2 = Math.floor(Math.random() * pool.length);
        const item = pool.splice(idx2, 1)[0];
        const dCharged = calcPartsCharged(item.partsCost);
        const dLabor   = Math.round(item.laborHrs * SHOP.laborRate * 100) / 100;
        declinedServices.push({
          opCode:        item.opCode,
          description:   item.description,
          partsCost:     item.partsCost,
          partsCharged:  dCharged,
          laborHrs:      item.laborHrs,
          laborTotal:    dLabor,
          totalIfDone:   Math.round((dCharged + dLabor) * 100) / 100,
        });
      }
    }
    const declinedTotal = Math.round(declinedServices.reduce((s, d) => s + d.totalIfDone, 0) * 100) / 100;

    // ── Diagnostic codes ──────────────────────────────────────────────────────
    const dtcPool = PACKAGE_DTCS[pkg.type];
    const dtcs    = dtcPool ? pick(dtcPool) : [];

    // ── Approval workflow timing ──────────────────────────────────────────────
    const estimateSentAt = (status === 'estimate' || status === 'approved' || status === 'closed')
      ? addDays(date, 0).toISOString() : null;
    const approvalMin    = (status === 'approved' || status === 'closed')
      ? approvalTimeMin(tier, prefContact) : null;

    // ── RO metadata ──────────────────────────────────────────────────────────
    const roNum      = `RO-${date.getFullYear()}-${String(roStartIndex + idx + 1).padStart(4, '0')}`;
    const closedDate = status === 'closed' ? addDays(date, randInt(0, 2)).toISOString() : null;
    const progress   = status === 'closed' ? 100
      : status === 'approved' ? randInt(35, 75)
      : status === 'estimate' ? randInt(10, 30)
      : randInt(0, 15);

    return {
      id: roNum, roNumber: roNum, shopId: SHOP.id,
      status, kanbanStatus: statusToKanban(status),

      // Customer
      customerId: cust.id, customerName: `${cust.firstName} ${cust.lastName}`,
      customerPhone: cust.phone, customerEmail: cust.email,
      customerConcern: CUSTOMER_CONCERNS[pkg.type] || 'General service',
      preferredContact: prefContact,
      loyaltyTier: tier,
      customerVisitCount: cust.visits,
      customerApprovalRate: approvalRt,

      // Vehicle
      vehicleId: vehicle.id, vin: vehicle.vin,
      year: vehicle.year, make: vehicle.make, model: vehicle.model,
      trim: vehicle.trim, color: vehicle.color,
      vehicleOrigin: vehicleOriginFromMake(vehicle.make),
      mileageIn, mileageOut: status === 'closed' ? mileageIn + randInt(5, 55) : null,

      // Staff
      techId: tech.id, techName: tech.name, techRate: tech.rate,
      advisorId: advisor.id, advisorName: advisor.name,
      bay: randInt(1, 6),

      // Scheduling
      dateIn: date.toISOString(), promisedDate: addDays(date, 1).toISOString(), closedDate,
      appointmentType: Math.random() < 0.65 ? 'appointment' : 'walk_in',
      comebackRO: false,

      // Service
      serviceType: pkg.serviceType, isOemService: !!pkg.isOemService, oemMilestone: pkg.oemMilestone || null,
      services: lines,
      dtcs,
      declinedServices,
      declinedTotal,

      // Financials — customer-facing
      totalEstimate:      grandTotal,
      totalLabor:         Math.round(laborTotal * 100) / 100,
      totalPartsCharged,
      shopSupplies, tax,

      // Financials — shop cost & margin
      totalPartsCost:     Math.round(totalPartsCost * 100) / 100,
      laborCost,
      grossMarginDollars,
      grossMarginPct,
      partsMargin,
      laborMargin,

      // Labor efficiency (top-level for quick queries)
      totalFlaggedHrs:    Math.round(lines.reduce((s, l) => s + l.laborHrs, 0) * 100) / 100,
      totalActualHrs,
      effectiveLaborRate,

      // Nested laborTimeTracking — consistent with demoData and ELR API schema
      laborTimeTracking: {
        totalFlatHrs:    Math.round(lines.reduce((s, l) => s + l.laborHrs, 0) * 100) / 100,
        totalActualHrs,
        elr:             effectiveLaborRate,
        postedRate:      SHOP.laborRate,
      },

      // Workflow
      progress,
      waitingSince:       status === 'estimate' ? date.toISOString() : null,
      estimateSentAt,
      approvalTimeMin:    approvalMin,

      aiInsights: [],   // filled by post-process below
      createdAt: date.toISOString(),
      updatedAt: closedDate || date.toISOString(),
      batchNumber: BATCH,
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  // ── --list mode ─────────────────────────────────────────────
  if (LIST) {
    const batches = [...new Set(CUSTOMER_POOL.map(c => c.batch))].sort();
    for (const b of batches) {
      const bCustomers = CUSTOMER_POOL.filter(c => c.batch === b);
      const totalVisits = bCustomers.reduce((s, c) => s + c.visits, 0);
      console.log(`\nBatch ${b} — ${bCustomers.length} customers, ${totalVisits} ROs`);
      for (const c of bCustomers) {
        console.log(`  ${c.id}  ${c.firstName.padEnd(12)} ${c.lastName.padEnd(15)} ${c.visits} visits  ${c.occupation}`);
      }
    }
    console.log();
    return;
  }

  // ── Validate batch ───────────────────────────────────────────
  const batchCustomers = CUSTOMER_POOL.filter(c => c.batch === BATCH);
  if (batchCustomers.length === 0) {
    console.error(`No customers defined for batch ${BATCH}. Available batches: ${[...new Set(CUSTOMER_POOL.map(c=>c.batch))].join(', ')}`);
    process.exit(1);
  }
  const totalVisits = batchCustomers.reduce((s, c) => s + c.visits, 0);
  if (totalVisits !== ROS_PER_BATCH) {
    console.warn(`Warning: batch ${BATCH} has ${totalVisits} total visits (expected ${ROS_PER_BATCH}). Adjusting.`);
  }

  // ── Connect ──────────────────────────────────────────────────
  const client = new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db   = client.db(DB_NAME);
  const coll = db.collection(COLLECTION);
  console.log(`\nConnected to ${MONGODB_URI.replace(/:\/\/.*@/, '://<credentials>@')}`);

  // ── --reset: drop collection ─────────────────────────────────
  if (RESET) {
    const n = await coll.estimatedDocumentCount().catch(() => 0);
    if (n > 0) { await coll.drop(); console.log(`  Dropped existing ${COLLECTION} collection (${n} docs).`); }
  }

  // ── Ensure indexes exist ─────────────────────────────────────
  await db.createCollection(COLLECTION).catch(() => {}); // no-op if exists
  await coll.createIndex({ id: 1 },          { unique: true }).catch(() => {});
  await coll.createIndex({ customerId: 1 }).catch(() => {});
  await coll.createIndex({ status: 1 }).catch(() => {});
  await coll.createIndex({ kanbanStatus: 1 }).catch(() => {});
  await coll.createIndex({ dateIn: -1 }).catch(() => {});
  await coll.createIndex({ batchNumber: 1 }).catch(() => {});

  // ── Find current max RO sequence to avoid collisions ────────
  const lastRO = await coll.find({}).sort({ roNumber: -1 }).limit(1).toArray();
  let roStartIndex = 0;
  if (lastRO.length > 0) {
    const m = lastRO[0].roNumber?.match(/-(\d+)$/);
    if (m) roStartIndex = parseInt(m[1]);
  }

  // ── Generate & insert ────────────────────────────────────────
  console.log(`\nBatch ${BATCH}: ${batchCustomers.length} customers → ${ROS_PER_BATCH} ROs`);
  console.log(`  RO sequence starts at ${roStartIndex + 1}`);

  const ros = generateBatchROs(batchCustomers, roStartIndex);

  // ── Post-process: compute customerLTV then generate AI insights ─────────────
  const ltvMap = {};
  for (const ro of ros) {
    if (ro.status === 'closed') {
      ltvMap[ro.customerId] = (ltvMap[ro.customerId] || 0) + ro.totalEstimate;
    }
  }
  for (const ro of ros) {
    ro.customerLTV = Math.round((ltvMap[ro.customerId] || 0) * 100) / 100;
    const cust    = batchCustomers.find(c => c.id === ro.customerId);
    const vehicle = cust?.vehicles.find(v => v.id === ro.vehicleId) || cust?.vehicles[0];
    const pkg     = SERVICE_PACKAGES.find(p => p.serviceType === ro.serviceType) || SERVICE_PACKAGES[0];
    ro.aiInsights = generateInsights(ro, cust, vehicle, pkg);
  }

  const result = await coll.insertMany(ros, { ordered: false }).catch(err => {
    // ordered:false lets partial inserts succeed; report duplicates
    if (err.code === 11000) {
      console.warn(`  ${err.result?.nInserted || 0} inserted; some duplicate IDs skipped.`);
      return { insertedCount: err.result?.nInserted || 0 };
    }
    throw err;
  });
  console.log(`  Inserted ${result.insertedCount} repair orders.\n`);

  // ── Summary ──────────────────────────────────────────────────
  const statusCount = {}, yearCount = {};
  for (const ro of ros) {
    statusCount[ro.status] = (statusCount[ro.status] || 0) + 1;
    const yr = new Date(ro.dateIn).getFullYear();
    yearCount[yr] = (yearCount[yr] || 0) + 1;
  }
  console.log('  Status:');
  for (const [s, n] of Object.entries(statusCount)) console.log(`    ${s.padEnd(12)} ${n}`);
  console.log('\n  Years:');
  for (const [y, n] of Object.entries(yearCount).sort()) console.log(`    ${y}  ${n} ROs`);

  const total = await coll.estimatedDocumentCount();
  console.log(`\n  Total in ${COLLECTION}: ${total}\n`);

  await client.close();
}

main().catch(err => { console.error('Seed failed:', err.message); process.exit(1); });
