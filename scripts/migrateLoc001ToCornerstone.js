/**
 * WrenchIQ — Migrate loc-001 (Peninsula Precision Auto — Palo Alto) to cornerstone
 *
 * Reassigns the 270 real, distinct-customer ROs currently under
 * shopId 'shop-001' / locationId 'loc-001' to shopId 'cornerstone', and
 * normalizes their schema from the flat shop-001/Peninsula shape
 * (customerId/customerName, services[], locationId/locationName) to the
 * nested shape already used by cornerstone's story ROs (customer{id,name},
 * repairJobs[], shop{id,name,laborRate}) — so existing consumers
 * (trustScoreService.js, demoRO normalizers) read them correctly.
 *
 * The other 3 locations (Sunnyvale, Mountain View, Menlo Park — 810 ROs)
 * are left untouched under shop-001 for the ARO Agent's network dashboard.
 *
 * Usage:
 *   node scripts/migrateLoc001ToCornerstone.js           # run migration
 *   node scripts/migrateLoc001ToCornerstone.js --dry-run # preview only, no writes
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

const DRY_RUN = process.argv.includes('--dry-run');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME     = process.env.MONGODB_DB  || 'wrenchiq';
const COLLECTION  = 'RepairOrder';

function transform(doc) {
  // The source `services[]` only carries a lump-sum partsCost per service,
  // no itemized part names — so `parts: []` here, not a fabricated entry.
  // A synthetic placeholder name would otherwise get aggregated as if it
  // were a real, frequently-sold part in any part-name breakdown (Shop
  // Profile's Top Parts / Seasonal Trends).
  const repairJobs = (doc.services || []).map(s => ({
    description:      s.name || '',
    laborHours:       s.laborHrs || 0,
    actualLaborHours: s.actualHrs || 0,
    lineCost:         s.laborCost || 0,
    parts:            [],
    status:           s.status || 'completed',
  }));

  return {
    id:              doc.id,
    roNumber:        doc.id,
    shopId:          'cornerstone',
    shop:            { id: 'cornerstone', name: 'Cornerstone Auto Group', laborRate: 195 },
    customer:        { id: doc.customerId, name: doc.customerName, phone: null, email: null },
    vehicle: {
      vin:      doc.vehicle?.vin,
      year:     doc.vehicle?.year,
      make:     doc.vehicle?.make,
      model:    doc.vehicle?.model,
      odometer: doc.vehicle?.mileage,
    },
    vehicleOrigin:   doc.vehicleOrigin,
    serviceCategory: doc.repairCategory || '',
    kanbanStatus:    'ready',
    status:          doc.status,
    dateIn:          doc.dateIn,
    dateOut:         doc.closedDate,
    bay:             doc.bay,
    tech:            { id: doc.techId, name: doc.techName },
    advisor:         { id: doc.advisorId, name: doc.advisorName },
    customerConcern: '',
    dtcs:            [],
    repairJobs,
    // Already matches the nested {description, estimatedCost} shape used
    // elsewhere — no transform needed for declinedServices.
    declinedServices: doc.declinedServices || [],
    invoice:          doc.totalRevenue,
    progress:         doc.status === 'closed' ? 100 : 0,
    laborTimeTracking: doc.laborTimeTracking,
    aiInsights: [], agenticUpsells: [], agenticCustomerText: null, agenticTextStatus: null,
    threeCScore: null, threeCConcern: '', threeCDiagnosis: '', threeCCorrection: '', threeCRewriteSuggestion: null,
    isHistorical: true,
    isStoryRO:    false,
    migratedFrom: 'shop-001/loc-001',
    migratedAt:   new Date().toISOString(),
  };
}

async function main() {
  console.log(`Connecting to MongoDB: ${MONGODB_URI}${DRY_RUN ? ' (DRY RUN)' : ''}`);
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db   = client.db(DB_NAME);
    const coll = db.collection(COLLECTION);

    const docs = await coll.find({ shopId: 'shop-001', locationId: 'loc-001' }).toArray();
    console.log(`Found ${docs.length} ROs at shop-001/loc-001 to migrate.`);

    if (docs.length === 0) {
      console.log('Nothing to do.');
      return;
    }

    if (DRY_RUN) {
      console.log('Sample transformed doc:');
      console.log(JSON.stringify(transform(docs[0]), null, 2));
      console.log(`Would migrate ${docs.length} docs. Re-run without --dry-run to apply.`);
      return;
    }

    const oldFieldsToUnset = {
      customerId: '', customerName: '', techId: '', techName: '', techInitials: '',
      advisorId: '', advisorName: '', locationId: '', locationName: '',
      services: '', upsellFlag: '', upsellConverted: '', grossMarginPct: '',
      totalRevenue: '', partsRevenue: '', laborRevenue: '', taxAmount: '',
      createdAt: '', updatedAt: '', closedDate: '',
    };

    const ops = docs.map(doc => ({
      updateOne: {
        filter: { _id: doc._id },
        update: {
          $set: transform(doc),
          $unset: oldFieldsToUnset,
        },
      },
    }));

    const result = await coll.bulkWrite(ops, { ordered: false });
    console.log(`Migrated ${result.modifiedCount} ROs from shop-001/loc-001 to cornerstone.`);

    const newCount = await coll.countDocuments({ shopId: 'cornerstone' });
    const remaining = await coll.countDocuments({ shopId: 'shop-001' });
    console.log(`cornerstone now has ${newCount} ROs total. shop-001 has ${remaining} remaining (Sunnyvale/Mountain View/Menlo Park).`);
  } finally {
    await client.close();
  }
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
