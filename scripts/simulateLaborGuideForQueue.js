/**
 * WrenchIQ — Labor Guide Simulator for the Sidecar RO Queue
 *
 * For each open RO in the Sidecar's queue (kanbanStatus != 'ready', same
 * "8 ROs" the Health Check / ShopSnapshot screen counts as open) and each
 * repair job on that RO, asks the local "Predii LLM" endpoint (.110) to
 * fabricate a realistic /api/labors-shaped response — same structure as
 * docs/market_research/API_Request_Response_Samples.md, but entirely
 * synthetic content (no real part numbers/prices reproduced).
 *
 * Everything — the real sample file, the RO/job data, and every generated
 * labor-guide payload — is read/generated/written entirely within this
 * process and saved to resources/labor_guide_samples/. Only a structure
 * summary (keys/shape, no values) is printed to stdout, so the calling
 * agent never sees the actual sample or generated content.
 *
 * Usage:
 *   node --env-file=.env.local scripts/simulateLaborGuideForQueue.js [shopId]
 */

import { MongoClient } from 'mongodb';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prompt } from '../server/services/promptLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_PATH = join(__dirname, '..', 'docs', 'market_research', 'API_Request_Response_Samples.md');
const OUT_DIR = join(__dirname, '..', 'resources', 'labor_guide_samples');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL;
const shopId = process.argv[2] || 'cornerstone';

if (!MONGODB_URI || !MONGODB_DB || !LLM_BASE_URL || !LLM_MODEL) {
  console.error('MONGODB_URI/MONGODB_DB/LLM_BASE_URL/LLM_MODEL must be set — run with: node --env-file=.env.local scripts/simulateLaborGuideForQueue.js [shopId]');
  process.exit(1);
}

function extractSection(markdown, heading) {
  const lines = markdown.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (startIdx === -1) throw new Error(`Section "## ${heading}" not found in ${SAMPLES_PATH}`);
  let endIdx = lines.findIndex((l, i) => i > startIdx && /^## /.test(l));
  if (endIdx === -1) endIdx = lines.length;
  return lines.slice(startIdx, endIdx).join('\n');
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
}

/** Recursively collapse a JS value down to a type-only shape for the summary we print. */
function shapeOf(v) {
  if (Array.isArray(v)) return v.length ? [shapeOf(v[0])] : [];
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v)) out[k] = shapeOf(v[k]);
    return out;
  }
  if (v === null) return 'null';
  return typeof v;
}

async function callLLM(systemPrompt, userPrompt) {
  const res = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(LLM_API_KEY ? { Authorization: `Bearer ${LLM_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      model: LLM_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 1800,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`LLM request failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`LLM did not return JSON: ${text.slice(0, 200)}`);
  return JSON.parse(match[0]);
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const markdown = readFileSync(SAMPLES_PATH, 'utf8');
  const laborsTemplate = extractSection(markdown, '/api/labors');

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  const ros = await db.collection('RepairOrder')
    .find({
      shopId,
      isCannedJobCatalog: { $ne: true },
      $and: [
        { $or: [{ kanbanStatus: { $exists: true } }, { status: { $exists: true } }] },
      ],
    })
    .project({ roNumber: 1, vehicle: 1, kanbanStatus: 1, status: 1, repairJobs: 1 })
    .toArray();

  const openROs = ros.filter((r) => (r.kanbanStatus || r.status) !== 'ready');
  await client.close();

  console.log(`Found ${openROs.length} open RO(s) in the "${shopId}" queue.`);

  const systemPrompt = prompt('synthetic-labor-guide-system');

  const manifest = [];

  for (const ro of openROs) {
    const jobs = ro.repairJobs || [];
    // fields stringified so a missing one renders as before ("undefined") instead of throwing
    const vehicle = ro.vehicle
      ? Object.fromEntries(['year', 'make', 'model', 'vin'].map((k) => [k, String(ro.vehicle[k])]))
      : null;

    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const description = job.description || job.name || job.service || `job-${i}`;
      const userPrompt = prompt('synthetic-labor-guide-user', { laborsTemplate, vehicle, description });

      let result;
      try {
        result = await callLLM(systemPrompt, userPrompt);
      } catch (err) {
        console.log(`  [skip] ${ro.roNumber} job "${description}": ${err.message}`);
        continue;
      }

      const fileName = `${ro.roNumber}__${String(i).padStart(2, '0')}__${slugify(description)}.json`;
      const filePath = join(OUT_DIR, fileName);
      writeFileSync(filePath, JSON.stringify(result, null, 2));

      manifest.push({
        roNumber: ro.roNumber,
        job: description,
        file: `resources/labor_guide_samples/${fileName}`,
        structure: shapeOf(result),
      });
      console.log(`  [ok] ${ro.roNumber} — "${description}" → ${fileName}`);
    }
  }

  const manifestPath = join(OUT_DIR, '_manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\nGenerated ${manifest.length} labor-guide sample(s) in resources/labor_guide_samples/.`);
  console.log('\nStructure (one representative entry, values omitted):');
  console.log(JSON.stringify(manifest[0]?.structure || {}, null, 2));
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
