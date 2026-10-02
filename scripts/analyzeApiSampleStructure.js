/**
 * WrenchIQ — API Sample Structure Analyzer
 *
 * Extracts one API section (by its "## /api/..." heading) from
 * docs/market_research/API_Request_Response_Samples.md and asks the local
 * "Predii LLM" endpoint (LLM_BASE_URL, e.g. the self-hosted box at .110) to
 * derive its structural shape — field names, nesting, types — WITHOUT
 * echoing back real sample values (VINs, part numbers, prices, etc).
 *
 * This keeps the raw sample data out of the calling agent's context: only
 * the file (read locally) and the LLM ever see the actual JSON payload;
 * this process prints just the derived structure to stdout.
 *
 * Usage:
 *   node --env-file=.env.local scripts/analyzeApiSampleStructure.js /api/labors
 *   node --env-file=.env.local scripts/analyzeApiSampleStructure.js /api/parts
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { prompt } from '../server/services/promptLoader.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES_PATH = join(__dirname, '..', 'docs', 'market_research', 'API_Request_Response_Samples.md');

const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_MODEL = process.env.LLM_MODEL;

if (!LLM_BASE_URL || !LLM_MODEL) {
  console.error('LLM_BASE_URL / LLM_MODEL not set — run with: node --env-file=.env.local scripts/analyzeApiSampleStructure.js <section>');
  process.exit(1);
}

const section = process.argv[2];
if (!section) {
  console.error('Usage: node --env-file=.env.local scripts/analyzeApiSampleStructure.js <section>  (e.g. /api/labors)');
  process.exit(1);
}

function extractSection(markdown, heading) {
  const lines = markdown.split('\n');
  const startIdx = lines.findIndex((l) => l.trim() === `## ${heading}`);
  if (startIdx === -1) {
    throw new Error(`Section "## ${heading}" not found in ${SAMPLES_PATH}`);
  }
  let endIdx = lines.findIndex((l, i) => i > startIdx && /^## /.test(l));
  if (endIdx === -1) endIdx = lines.length;
  return lines.slice(startIdx, endIdx).join('\n');
}

async function main() {
  const markdown = readFileSync(SAMPLES_PATH, 'utf8');
  const sectionText = extractSection(markdown, section);

  const systemPrompt = prompt('api-sample-structure-system');

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
        { role: 'user', content: prompt('api-sample-structure-user', { section, sectionText }) },
      ],
      max_tokens: 2000,
      temperature: 0,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`LLM request failed: ${res.status} ${body}`);
  }

  const data = await res.json();
  const structure = data.choices?.[0]?.message?.content || '(no content returned)';

  console.log(`Structure for ${section} (model: ${LLM_MODEL}):\n`);
  console.log(structure);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
