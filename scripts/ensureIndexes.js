/**
 * WrenchIQ — Ensure Indexes
 *
 * Adds all required indexes to wrenchiq_ro and wrenchiq_clusters
 * without dropping or re-importing data. Safe to run multiple times
 * (createIndex is idempotent).
 *
 * Usage:
 *   node scripts/ensureIndexes.js
 */

import { MongoClient }             from 'mongodb';
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

const URI = process.env.MONGODB_URI || 'mongodb://172.16.80.7:27017';
const DB  = process.env.MONGODB_DB  || 'wrenchiq';

const client = new MongoClient(URI);

async function run() {
  await client.connect();
  const db = client.db(DB);

  // ── wrenchiq_ro ───────────────────────────────────────────────────────────
  console.log('\nEnsuring indexes on wrenchiq_ro...');
  const ro = db.collection('wrenchiq_ro');

  await Promise.all([
    // Single-field (idempotent — already created by import, safe to re-run)
    ro.createIndex({ ro_number:                        1 }, { unique: true }),
    ro.createIndex({ 'chain.id':                       1 }),
    ro.createIndex({ 'shop.id':                        1 }),
    ro.createIndex({ 'customer.id':                    1 }),
    ro.createIndex({ 'vehicle.make':                   1 }),
    ro.createIndex({ 'vehicle.year':                   1 }),
    ro.createIndex({ status:                           1 }),
    ro.createIndex({ date_in:                         -1 }),
    ro.createIndex({ 'knowledge_graph.status':         1 }),
    ro.createIndex({ 'repair_jobs.repair_job':         1 }),
    ro.createIndex({ 'repair_jobs.parts.repair_parts': 1 }),
    ro.createIndex({ 'vehicle.vcdb.base_vehicle_id':   1 }),
    ro.createIndex({ 'vehicle.vcdb.normalized_make':   1 }),
    ro.createIndex({ 'vehicle.vcdb.normalized_model':  1 }),
    ro.createIndex({ 'vehicle.vcdb.match_method':      1 }),
    ro.createIndex({ service_category:                 1 }),
    ro.createIndex({ vehicle_origin:                   1 }),
    // Compound — for filtered + sorted queries (LLM context, KG endpoint, list API)
    ro.createIndex({ 'shop.id':                        1, date_in: -1 }),
    ro.createIndex({ service_category:                 1, date_in: -1 }),
    ro.createIndex({ vehicle_origin:                   1, date_in: -1 }),
    ro.createIndex({ status:                           1, date_in: -1 }),
    ro.createIndex({ 'vehicle.vcdb.normalized_make':   1, date_in: -1 }),
    ro.createIndex({ 'vehicle.make':                   1, date_in: -1 }),
    ro.createIndex({ 'repair_jobs.repair_job':         1, date_in: -1 }),
  ]);

  const roIndexes = await ro.listIndexes().toArray();
  console.log(`  wrenchiq_ro: ${roIndexes.length} indexes`);
  for (const idx of roIndexes) console.log(`    ${idx.name}`);

  // ── wrenchiq_ro — snapshot builder compound (shop.id + status + date_in) ─
  await Promise.all([
    ro.createIndex({ 'shop.id': 1, status: 1             }),
    ro.createIndex({ 'shop.id': 1, status: 1, date_in: -1 }),
  ]);
  console.log('  wrenchiq_ro: snapshot builder indexes ensured.');

  // ── RepairOrder ───────────────────────────────────────────────────────────
  console.log('\nEnsuring indexes on RepairOrder...');
  const ror = db.collection('RepairOrder');

  await Promise.all([
    // Primary lookup
    ror.createIndex({ id:           1 }, { unique: true }),
    // Snapshot builder: open ROs (status != closed)
    ror.createIndex({ status:       1 }),
    // Snapshot builder: closed ROs filtered by closedDate
    ror.createIndex({ status: 1, closedDate: -1 }),
    // List API + kanban: sort by dateIn
    ror.createIndex({ dateIn:      -1 }),
    ror.createIndex({ status:       1, dateIn: -1 }),
    ror.createIndex({ kanbanStatus: 1, dateIn: -1 }),
    ror.createIndex({ customerId:   1, dateIn: -1 }),
    // ELR aggregate: dateIn range scan
    ror.createIndex({ dateIn: -1, vehicleOrigin: 1 }),
    // ELR aggregate: by tech
    ror.createIndex({ techId:       1, dateIn: -1 }),
  ]);

  const rorIndexes = await ror.listIndexes().toArray();
  console.log(`  RepairOrder: ${rorIndexes.length} indexes`);
  for (const idx of rorIndexes) console.log(`    ${idx.name}`);

  // ── recommendations ───────────────────────────────────────────────────────
  console.log('\nEnsuring indexes on recommendations...');
  const rec = db.collection('recommendations');

  await Promise.all([
    // Cache lookup: shopId + edition + ttlExpiresAt > now
    rec.createIndex({ shopId: 1, edition: 1, ttlExpiresAt: 1 }),
    // Upsert filter: shopId + edition
    rec.createIndex({ shopId: 1, edition: 1 }, { unique: true }),
    // Auto-expire stale cache docs (MongoDB TTL index — runs every 60s)
    rec.createIndex({ ttlExpiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  const recIndexes = await rec.listIndexes().toArray();
  console.log(`  recommendations: ${recIndexes.length} indexes`);
  for (const idx of recIndexes) console.log(`    ${idx.name}`);

  // ── wrenchiq_clusters ────────────────────────────────────────────────────
  console.log('\nEnsuring indexes on wrenchiq_clusters...');
  const cl = db.collection('wrenchiq_clusters');

  await Promise.all([
    cl.createIndex({ ro_count:                           -1 }),
    cl.createIndex({ cluster_type:                        1, ro_count: -1 }),
    cl.createIndex({ 'top_repair_jobs.repair_job':        1 }),
    cl.createIndex({ 'association_rules.antecedent':      1 }),
    cl.createIndex({ 'association_rules.consequent':      1 }),
    cl.createIndex({ 'part_affinity':                     1 }),
    cl.createIndex({ data_quality:                        1 }),
  ]);

  const clIndexes = await cl.listIndexes().toArray();
  console.log(`  wrenchiq_clusters: ${clIndexes.length} indexes`);
  for (const idx of clIndexes) console.log(`    ${idx.name}`);

  await client.close();
  console.log('\nDone.\n');
}

run().catch(err => {
  console.error('ensureIndexes failed:', err.message);
  process.exit(1);
});
