/**
 * WrenchIQ — DVI Simulator for the Sidecar RO Queue
 *
 * DVI (Digital Vehicle Inspection) data is currently entirely decoupled
 * from the Sidecar's live RO model — src/data/demoData.js's `dviInspection`
 * is one static fixture tied to a single hardcoded RO, and `RepairOrder`
 * Mongo docs have no `dviInspection` field at all. This generates a
 * synthetic-but-realistic DVI report per open RO in the queue (same "8
 * ROs" set as simulateLaborGuideForQueue.js), scoped to component-repair
 * items only (brakes, suspension, steering, drivetrain, belts/hoses,
 * battery/electrical, filters) — no pure fluid-level/cosmetic checks.
 *
 * The real fixture (read locally, for structure only), each RO's vehicle
 * + repair jobs, and every generated report are read/generated/written
 * entirely within this process to resources/dvi_samples/. Only status
 * counts and the names of "urgent" (needs-replacement) items are printed
 * to stdout — never the full generated record.
 *
 * Usage:
 *   node --env-file=.env.local scripts/simulateDviForQueue.js [shopId]
 */

import { MongoClient } from 'mongodb';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prompt } from '../server/services/promptLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEMO_DATA_PATH = join(__dirname, '..', 'src', 'data', 'demoData.js');
const OUT_DIR = join(__dirname, '..', 'resources', 'dvi_samples');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB;
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL;
const shopId = process.argv[2] || 'cornerstone';

if (!MONGODB_URI || !MONGODB_DB || !LLM_BASE_URL || !LLM_MODEL) {
  console.error('MONGODB_URI/MONGODB_DB/LLM_BASE_URL/LLM_MODEL must be set — run with: node --env-file=.env.local scripts/simulateDviForQueue.js [shopId]');
  process.exit(1);
}

/** Pull just the `dviInspection = { ... }` object literal out of demoData.js
 *  as a text template — read locally, never surfaced to the calling agent. */
function extractDviTemplate(source) {
  const startIdx = source.indexOf('export const dviInspection = {');
  if (startIdx === -1) throw new Error('dviInspection fixture not found in demoData.js');
  const braceStart = source.indexOf('{', startIdx);
  let depth = 0;
  for (let i = braceStart; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(braceStart, i + 1);
    }
  }
  throw new Error('Could not find matching closing brace for dviInspection fixture');
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
      max_tokens: 2200,
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

  const demoSource = readFileSync(DEMO_DATA_PATH, 'utf8');
  const dviTemplate = extractDviTemplate(demoSource);

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);

  const ros = await db.collection('RepairOrder')
    .find({ shopId, isCannedJobCatalog: { $ne: true } })
    .project({ roNumber: 1, vehicle: 1, kanbanStatus: 1, status: 1, repairJobs: 1 })
    .toArray();

  const openROs = ros.filter((r) => (r.kanbanStatus || r.status) !== 'ready');
  await client.close();

  console.log(`Found ${openROs.length} open RO(s) in the "${shopId}" queue.`);

  const systemPrompt = prompt('synthetic-dvi-system');

  const manifest = [];

  for (const ro of openROs) {
    const jobs = (ro.repairJobs || []).map((j) => j.description || j.name || j.service).filter(Boolean);
    // fields stringified so a missing one renders as before ("undefined") instead of throwing
    const vehicle = ro.vehicle
      ? Object.fromEntries(['year', 'make', 'model', 'mileage', 'vin'].map((k) => [k, String(ro.vehicle[k])]))
      : null;
    const userPrompt = prompt('synthetic-dvi-user', {
      dviTemplate,
      vehicle,
      roNumber: String(ro.roNumber),
      jobs: jobs.join(', '),
    });

    let result;
    try {
      result = await callLLM(systemPrompt, userPrompt);
    } catch (err) {
      console.log(`  [skip] ${ro.roNumber}: ${err.message}`);
      continue;
    }

    const fileName = `${ro.roNumber}.json`;
    writeFileSync(join(OUT_DIR, fileName), JSON.stringify(result, null, 2));

    const counts = { good: 0, monitor: 0, urgent: 0 };
    const urgentItems = [];
    for (const cat of result.categories || []) {
      for (const item of cat.items || []) {
        if (counts[item.status] != null) counts[item.status]++;
        if (item.status === 'urgent') urgentItems.push(item.name);
      }
    }

    manifest.push({ roNumber: ro.roNumber, file: `resources/dvi_samples/${fileName}`, counts, urgentItems });
    console.log(`  [ok] ${ro.roNumber} — good:${counts.good} monitor:${counts.monitor} urgent:${counts.urgent}`);
  }

  writeFileSync(join(OUT_DIR, '_manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(`\nGenerated ${manifest.length} DVI report(s) in resources/dvi_samples/.\n`);
  console.log('Items needing replacement (status "urgent"), by RO:');
  for (const entry of manifest) {
    console.log(`  ${entry.roNumber}: ${entry.urgentItems.length ? entry.urgentItems.join(', ') : '(none)'}`);
  }
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
