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

  const systemPrompt = [
    'You generate SYNTHETIC, entirely fictional Digital Vehicle Inspection',
    '(DVI) reports for a demo/simulation environment.',
    '',
    'You will be given a real DVI report as a STRUCTURE TEMPLATE ONLY, plus',
    'a specific vehicle and its open repair jobs on this visit. Produce ONE',
    'new DVI report matching the template\'s exact JSON shape (same keys,',
    'same nesting: roId, vehicleId, techId, inspectedAt, categories[].name,',
    'categories[].items[] each with id, name, status, measurement, newSpec,',
    'minSpec, wearPct, hasPhoto, photoLabel, aiAnalysis {model, confidence,',
    'finding, recommendation, reasoning}).',
    '',
    'Scope — COMPONENT REPAIRS ONLY:',
    '- Only include categories/items for physical, replaceable components:',
    '  brakes, suspension, steering, drivetrain/CV joints/axles, belts &',
    '  hoses, battery & electrical components (terminals, alternator belt,',
    '  starter), and physical filters (air, cabin, fuel).',
    '- Do NOT include pure fluid-level/top-off checks (oil level, coolant',
    '  level, washer fluid) or purely cosmetic checks (wiper blade streaking',
    '  alone, interior cleanliness) unless describing a worn PHYSICAL part.',
    '',
    'Rules:',
    '- status is one of "good" | "monitor" | "urgent". "urgent" means the',
    '  component needs replacement now.',
    '- Every value must be FABRICATED but realistic for the given vehicle,',
    '  mileage, and its open repair jobs (e.g. if the vehicle is in for a',
    '  brake job, brake-category items should plausibly include an "urgent"',
    '  finding on the same component being repaired).',
    '- Include 3-6 categories, 2-4 items per category, a realistic mix of',
    '  statuses (not all urgent, not all good).',
    '- Do NOT reuse any value from the template verbatim — it is structure',
    '  reference only.',
    '- Output valid JSON only, no prose, no markdown fences.',
  ].join('\n');

  const manifest = [];

  for (const ro of openROs) {
    const jobs = (ro.repairJobs || []).map((j) => j.description || j.name || j.service).filter(Boolean);
    const vehicleDesc = ro.vehicle
      ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}, ${ro.vehicle.mileage} mi, VIN ${ro.vehicle.vin}`
      : 'unknown vehicle';

    const userPrompt = [
      'Structure template (real DVI fixture — for shape reference only):',
      dviTemplate,
      '',
      'Now generate a synthetic DVI report for:',
      `Vehicle: ${vehicleDesc}`,
      `RO: ${ro.roNumber}`,
      `Open repair jobs this visit: ${jobs.join(', ') || '(none listed)'}`,
    ].join('\n');

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
