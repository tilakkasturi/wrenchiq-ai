/**
 * WrenchIQ — Dynamic Cluster Builder
 *
 * Reads wrenchiq_ro, groups repair orders into vehicle and engine clusters,
 * computes repair job frequencies and part-affinity association rules, and
 * writes results to wrenchiq_clusters.
 *
 * Run AFTER importRepairOrders.js.
 *
 * Cluster types:
 *   vehicle_generation  — same normalized make+model, 4-year year bucket
 *   engine_similarity   — same cylinder count + liter band (±0.2L), cross-make
 *
 * Association rule methodology: Market Basket Analysis
 *   support    = P(job AND part)    = co_count / cluster_ro_count
 *   confidence = P(part | job)      = co_count / job_count
 *   lift       = confidence / P(part in cluster)
 *
 * TODO(incremental): At scale (>10k ROs), switch to per-cluster upsert with
 *   dirty-tracking via importedAt timestamp. Full rebuild is O(n_ros) — fine for demo.
 *
 * Usage:
 *   node scripts/buildClusters.js
 *   node scripts/buildClusters.js --dry-run
 */

import { MongoClient }             from 'mongodb';
import { readFileSync, existsSync } from 'fs';

// ── Load .env.local ───────────────────────────────────────────────────────────
for (const f of ['.env.local', '.env']) {
  if (existsSync(f)) {
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const eq = t.indexOf('='); if (eq < 0) continue;
      const k = t.slice(0, eq).trim();
      const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  }
}

const DST_URI  = process.env.MONGODB_URI || 'mongodb://172.16.80.7:27017';
const DST_DB   = process.env.MONGODB_DB  || 'wrenchiq';
const SRC_COLL = 'wrenchiq_ro';
const OUT_COLL = 'wrenchiq_clusters';

const DRY_RUN = process.argv.includes('--dry-run');

// ── Thresholds ────────────────────────────────────────────────────────────────
// At 100 ROs these are intentionally low to produce demo-visible output.
// TODO(scale): raise MIN_SUPPORT to 0.05, MIN_LIFT to 1.5 at >1k ROs.
const MIN_CLUSTER_SIZE = 2;   // min ROs in a cluster to emit any rules
const MIN_JOB_COUNT    = 1;   // min times a job must appear in cluster
const MIN_CO_COUNT     = 1;   // min co-occurrences for an association rule
const MIN_CONFIDENCE   = 0.20;
const MIN_LIFT         = 1.0;

// ── Year bucket formula ───────────────────────────────────────────────────────
// 4-year fixed buckets: 2014-2017, 2018-2021, 2022-2025 ...
// Deterministic — no RO falls into two buckets.
function yearBucket(year) {
  if (!year || isNaN(year)) return null;
  const base = Math.floor((parseInt(year) - 2) / 4) * 4 + 2;
  return { start: base, end: base + 3 };
}

// ── Engine liter rounding (nearest 0.2L) ─────────────────────────────────────
// Implements the ±0.2L engine-similarity band.
function roundLiter(liter) {
  if (!liter || isNaN(liter)) return null;
  return Math.round(parseFloat(liter) * 5) / 5;
}

// ── Cluster key builders ──────────────────────────────────────────────────────
function vehicleClusterKey(ro) {
  const make  = ro.vehicle?.vcdb?.normalized_make  || ro.vehicle?.make  || 'Unknown';
  const model = ro.vehicle?.vcdb?.normalized_model || ro.vehicle?.model || 'Unknown';
  const year  = ro.vehicle?.year;
  const bkt   = yearBucket(year);
  if (!bkt) return null;
  const m = make.replace(/\s+/g, '_').toUpperCase();
  const d = model.replace(/\s+/g, '_').toUpperCase();
  return `vgen:${m}_${d}_${bkt.start}`;
}

function engineClusterKeys(ro) {
  const configs = ro.vehicle?.vcdb?.possible_engine_configs ?? [];
  if (!configs.length) return [];
  const keys = new Set();
  for (const cfg of configs) {
    const cyl   = cfg.cylinders;
    const liter = roundLiter(cfg.liter);
    if (cyl != null && liter != null) {
      keys.add(`eng:${cyl}cyl_${liter.toFixed(1)}L`);
    }
  }
  return [...keys];
}

// ── Extract normalized items from an RO ──────────────────────────────────────
function extractJobs(ro) {
  return (ro.repair_jobs ?? [])
    .map(j => j.repair_job)
    .filter(Boolean);
}

function extractParts(ro) {
  const parts = [];
  for (const job of (ro.repair_jobs ?? [])) {
    for (const p of (job.parts ?? [])) {
      if (p.repair_parts) parts.push({ part: p.repair_parts, job: job.repair_job ?? null });
    }
  }
  for (const p of (ro.orphan_parts ?? [])) {
    if (p.repair_parts) parts.push({ part: p.repair_parts, job: null });
  }
  return parts;
}

// ── Frequency counter ─────────────────────────────────────────────────────────
function freq(items) {
  const map = new Map();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return map;
}

// ── Association rules: job → parts ───────────────────────────────────────────
/**
 * For each repair job in the cluster, compute:
 *   - how often each part co-occurs with that job across cluster ROs
 *   - support, confidence, lift
 * Returns part_affinity[]: { repair_job, parts: [{ repair_parts, support, confidence, lift }] }
 */
function computePartAffinity(clusterRos) {
  const n = clusterRos.length;

  // Global part frequencies in this cluster (for lift denominator)
  const allParts = clusterRos.flatMap(ro => extractParts(ro).map(p => p.part));
  const partFreq = freq(allParts);

  // Per-job: count ROs where job appears, count ROs where job+part both appear
  const jobRoCount    = new Map();  // job → count of ROs containing it
  const jobPartCount  = new Map();  // `${job}|||${part}` → co-occurrence count

  for (const ro of clusterRos) {
    const jobs  = new Set(extractJobs(ro));
    const parts = new Set(extractParts(ro).map(p => p.part));

    for (const job of jobs) {
      jobRoCount.set(job, (jobRoCount.get(job) ?? 0) + 1);
      for (const part of parts) {
        const key = `${job}|||${part}`;
        jobPartCount.set(key, (jobPartCount.get(key) ?? 0) + 1);
      }
    }
  }

  const affinity = [];
  for (const [job, jobCount] of jobRoCount) {
    if (jobCount < MIN_JOB_COUNT) continue;
    const partRules = [];
    for (const [part, partCount] of partFreq) {
      const coKey  = `${job}|||${part}`;
      const coCount = jobPartCount.get(coKey) ?? 0;
      if (coCount < MIN_CO_COUNT) continue;
      const support    = coCount / n;
      const confidence = coCount / jobCount;
      const lift       = confidence / (partCount / n);
      if (confidence < MIN_CONFIDENCE || lift < MIN_LIFT) continue;
      partRules.push({
        repair_parts: part,
        co_count:     coCount,
        support:      Math.round(support    * 1000) / 1000,
        confidence:   Math.round(confidence * 1000) / 1000,
        lift:         Math.round(lift       * 1000) / 1000,
      });
    }
    // Sort by confidence desc, then lift desc
    partRules.sort((a, b) => b.confidence - a.confidence || b.lift - a.lift);
    if (partRules.length) {
      affinity.push({ repair_job: job, parts: partRules });
    }
  }
  return affinity;
}

/**
 * Job-to-job association rules (co-occurrence of repair jobs within same RO).
 * Returns association_rules[]: { antecedent, consequent, support, confidence, lift }
 */
function computeJobAssociations(clusterRos) {
  const n = clusterRos.length;
  const jobFreq   = new Map();  // job → RO count
  const pairFreq  = new Map();  // `${A}|||${B}` → co-count (A < B lexically)

  for (const ro of clusterRos) {
    const jobs = [...new Set(extractJobs(ro))];
    for (const j of jobs) jobFreq.set(j, (jobFreq.get(j) ?? 0) + 1);
    for (let i = 0; i < jobs.length; i++) {
      for (let k = i + 1; k < jobs.length; k++) {
        const [a, b] = jobs[i] < jobs[k] ? [jobs[i], jobs[k]] : [jobs[k], jobs[i]];
        const key = `${a}|||${b}`;
        pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
      }
    }
  }

  const rules = [];
  for (const [pair, coCount] of pairFreq) {
    if (coCount < MIN_CO_COUNT) continue;
    const [a, b] = pair.split('|||');
    const support = coCount / n;
    // A → B
    const confAB = coCount / (jobFreq.get(a) ?? 1);
    const liftAB = confAB / ((jobFreq.get(b) ?? 1) / n);
    if (confAB >= MIN_CONFIDENCE && liftAB >= MIN_LIFT) {
      rules.push({ antecedent: a, consequent: b,
        support: Math.round(support * 1000) / 1000,
        confidence: Math.round(confAB * 1000) / 1000,
        lift: Math.round(liftAB * 1000) / 1000 });
    }
    // B → A
    const confBA = coCount / (jobFreq.get(b) ?? 1);
    const liftBA = confBA / ((jobFreq.get(a) ?? 1) / n);
    if (confBA >= MIN_CONFIDENCE && liftBA >= MIN_LIFT) {
      rules.push({ antecedent: b, consequent: a,
        support: Math.round(support * 1000) / 1000,
        confidence: Math.round(confBA * 1000) / 1000,
        lift: Math.round(liftBA * 1000) / 1000 });
    }
  }
  return rules.sort((a, b) => b.lift - a.lift);
}

// ── Top repair jobs ───────────────────────────────────────────────────────────
function topJobs(clusterRos, topN = 10) {
  const n    = clusterRos.length;
  const jMap = freq(clusterRos.flatMap(ro => [...new Set(extractJobs(ro))]));
  return [...jMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([repair_job, count]) => ({
      repair_job,
      count,
      frequency: Math.round(count / n * 1000) / 1000,
    }));
}

// ── Build cluster document ────────────────────────────────────────────────────
function buildClusterDoc(clusterId, clusterType, clusterMeta, clusterRos, vcdbDate) {
  const n           = clusterRos.length;
  const dataQuality = n >= 10 ? 'sufficient' : n >= 5 ? 'limited' : 'insufficient';
  const years       = [...new Set(clusterRos.map(r => r.vehicle?.year).filter(Boolean))].sort();
  const makes       = [...new Set(clusterRos.map(r =>
    r.vehicle?.vcdb?.normalized_make || r.vehicle?.make).filter(Boolean))];

  return {
    cluster_id:        clusterId,
    cluster_type:      clusterType,
    ...clusterMeta,
    makes,
    ro_count:          n,
    vehicle_years:     years,
    data_quality:      dataQuality,
    top_repair_jobs:   topJobs(clusterRos),
    part_affinity:     computePartAffinity(clusterRos),
    association_rules: computeJobAssociations(clusterRos),
    source_ro_numbers: clusterRos.map(r => r.ro_number).filter(Boolean),
    built_at:          new Date(),
    vcdb_date:         vcdbDate ?? null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  console.log(`\nWrenchIQ — Cluster Builder`);
  if (DRY_RUN) console.log('  [DRY RUN — no writes]\n');

  const client = new MongoClient(DST_URI, { serverSelectionTimeoutMS: 10000 });
  await client.connect();
  console.log(`Connected: ${DST_URI} → ${DST_DB}`);

  const db      = client.db(DST_DB);
  const roColl  = db.collection(SRC_COLL);
  const outColl = db.collection(OUT_COLL);

  // ── Step 1: Fetch all ROs ─────────────────────────────────────────────────
  console.log(`\nStep 1 — Fetching all ROs from ${SRC_COLL}...`);
  const ros = await roColl.find({}).toArray();
  console.log(`  Fetched ${ros.length} repair orders.`);

  if (!ros.length) {
    console.error('  No ROs found. Run importRepairOrders.js first.');
    await client.close(); process.exit(1);
  }

  // Detect VCdb date from first RO with vcdb data
  const vcdbDate = ros.find(r => r.vehicle?.vcdb?.vcdb_date)?.vehicle?.vcdb?.vcdb_date ?? null;

  // ── Step 2: Assign ROs to clusters ────────────────────────────────────────
  console.log('\nStep 2 — Assigning ROs to clusters...');

  const vehicleClusters = new Map();  // clusterId → [ro, ...]
  const engineClusters  = new Map();

  for (const ro of ros) {
    // Vehicle generation cluster
    const vKey = vehicleClusterKey(ro);
    if (vKey) {
      if (!vehicleClusters.has(vKey)) vehicleClusters.set(vKey, []);
      vehicleClusters.get(vKey).push(ro);
    }

    // Engine similarity clusters (one RO may belong to multiple if vehicle has multiple engine options)
    for (const eKey of engineClusterKeys(ro)) {
      if (!engineClusters.has(eKey)) engineClusters.set(eKey, []);
      engineClusters.get(eKey).push(ro);
    }
  }

  console.log(`  Vehicle generation clusters : ${vehicleClusters.size}`);
  console.log(`  Engine similarity clusters  : ${engineClusters.size}`);

  // ── Step 3: Build cluster documents ──────────────────────────────────────
  console.log('\nStep 3 — Computing frequencies and association rules...');
  const clusterDocs = [];

  for (const [clusterId, clusterRos] of vehicleClusters) {
    if (clusterRos.length < MIN_CLUSTER_SIZE) continue;
    const ro0    = clusterRos[0];
    const make   = ro0.vehicle?.vcdb?.normalized_make  || ro0.vehicle?.make  || 'Unknown';
    const model  = ro0.vehicle?.vcdb?.normalized_model || ro0.vehicle?.model || 'Unknown';
    const bkt    = yearBucket(ro0.vehicle?.year) ?? { start: 0, end: 0 };
    clusterDocs.push(buildClusterDoc(clusterId, 'vehicle_generation', {
      normalized_make:   make,
      normalized_model:  model,
      year_bucket_start: bkt.start,
      year_bucket_end:   bkt.end,
    }, clusterRos, vcdbDate));
  }

  for (const [clusterId, clusterRos] of engineClusters) {
    if (clusterRos.length < MIN_CLUSTER_SIZE) continue;
    // Parse key: eng:8cyl_5.3L
    const parts  = clusterId.replace('eng:', '').split('_');
    const cyl    = parseInt(parts[0]);
    const liter  = parseFloat(parts[1]);
    clusterDocs.push(buildClusterDoc(clusterId, 'engine_similarity', {
      cylinders:  isNaN(cyl)   ? null : cyl,
      liter_band: isNaN(liter) ? null : liter,
    }, clusterRos, vcdbDate));
  }

  console.log(`  Cluster documents built: ${clusterDocs.length}`);

  // ── Step 4: Write ─────────────────────────────────────────────────────────
  if (DRY_RUN) {
    console.log('\n[DRY RUN] Sample cluster:');
    if (clusterDocs.length) {
      const sample = clusterDocs.find(c => c.ro_count >= MIN_CLUSTER_SIZE) ?? clusterDocs[0];
      console.log(JSON.stringify({
        cluster_id:      sample.cluster_id,
        cluster_type:    sample.cluster_type,
        normalized_make: sample.normalized_make,
        normalized_model:sample.normalized_model,
        ro_count:        sample.ro_count,
        data_quality:    sample.data_quality,
        top_repair_jobs: sample.top_repair_jobs.slice(0, 3),
        part_affinity:   sample.part_affinity.slice(0, 2),
        association_rules: sample.association_rules.slice(0, 2),
      }, null, 2));
    }
  } else {
    console.log(`\nStep 4 — Writing to ${DST_DB}.${OUT_COLL}...`);
    const existing = await outColl.estimatedDocumentCount().catch(() => 0);
    if (existing > 0) {
      await outColl.drop();
      console.log(`  Dropped existing collection (${existing} docs).`);
    }
    await db.createCollection(OUT_COLL);
    await Promise.all([
      outColl.createIndex({ cluster_id: 1 },                                   { unique: true }),
      outColl.createIndex({ cluster_type: 1 }),
      outColl.createIndex({ normalized_make: 1, normalized_model: 1, year_bucket_start: 1 }),
      outColl.createIndex({ cylinders: 1, liter_band: 1 }),
      outColl.createIndex({ 'top_repair_jobs.repair_job': 1 }),
      outColl.createIndex({ data_quality: 1 }),
      outColl.createIndex({ built_at: -1 }),
    ]);
    if (clusterDocs.length) {
      const result = await outColl.insertMany(clusterDocs);
      console.log(`  Inserted ${result.insertedCount} cluster documents.`);
    } else {
      console.log('  No clusters met minimum size threshold.');
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Summary ──────────────────────────────────────────────');

  const byType = { vehicle_generation: 0, engine_similarity: 0 };
  let totalRules = 0, totalAffinity = 0;
  for (const c of clusterDocs) {
    byType[c.cluster_type] = (byType[c.cluster_type] ?? 0) + 1;
    totalRules    += c.association_rules.length;
    totalAffinity += c.part_affinity.reduce((s, a) => s + a.parts.length, 0);
  }

  console.log(`\nClusters written:`);
  console.log(`  vehicle_generation  : ${byType.vehicle_generation}`);
  console.log(`  engine_similarity   : ${byType.engine_similarity}`);
  console.log(`  Total               : ${clusterDocs.length}`);
  console.log(`\nAssociation rules total      : ${totalRules}`);
  console.log(`Part-affinity rules total    : ${totalAffinity}`);

  // Show top 3 clusters by RO count
  console.log('\nTop clusters by RO count:');
  clusterDocs
    .sort((a, b) => b.ro_count - a.ro_count)
    .slice(0, 6)
    .forEach(c => {
      const label = c.cluster_type === 'vehicle_generation'
        ? `${c.normalized_make} ${c.normalized_model} ${c.year_bucket_start}-${c.year_bucket_end}`
        : `${c.cylinders}cyl ${c.liter_band}L`;
      console.log(`  ${label.padEnd(38)} ${c.ro_count} ROs | ${c.top_repair_jobs.length} jobs | ${c.association_rules.length} rules`);
    });

  console.log('\nDone.\n');
  await client.close();
}

run().catch(err => {
  console.error('\nCluster build failed:', err.message);
  console.error(err.stack);
  process.exit(1);
});
