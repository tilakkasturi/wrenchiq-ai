/**
 * WrenchIQ — 3C Narrative Score & Rewrite
 *
 * "3C" = the Complaint / Cause / Correction narrative a technician writes on
 * a repair order. Seeded demo ROs sometimes carry deliberately weak 3C text
 * (e.g. "Customer states noise.") to model a real coaching problem — this
 * service scores whatever narrative is actually on file (not a canned
 * fixture number) and can draft an improved rewrite.
 *
 * Two single-call LLM skills, same shape as roScoreAgent.js — no tool loop.
 *
 * Grounding rule for rewriteThreeC(): the rewrite may ONLY restate, expand
 * the phrasing of, or organize facts already present in the context passed
 * in (concern text, DTCs, vehicle, services/parts on the RO). It must never
 * invent a DTC, TSB, part number, measurement, or customer statement that
 * isn't in that context — where a fact a Gold Standard narrative would
 * normally include (a diagnostic reading, a part number) is simply missing,
 * the rewrite says so ("not yet documented") instead of fabricating one.
 */

import { createHash } from 'crypto';
import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';

// Score cache, keyed by a hash of the exact scoring inputs — this is what
// actually guarantees repeated calls agree, not temperature alone.
// temperature: 0 (below) makes a single backend more likely to answer the
// same way twice, but inference servers with continuous batching (vLLM and
// similar) can still introduce tiny nondeterminism run to run — the only
// real guarantee is never asking the model twice for the same input. Kept
// in memory (cleared on server restart) since it exists purely for
// consistency, not freshness — an unchanged narrative should always score
// the same, indefinitely, so there's no TTL to expire it on.
const scoreCache = new Map();

function scoreCacheKey({ concern, diagnosis, correction, vehicle, dtcs, services }) {
  const stable = JSON.stringify({
    concern: concern || '',
    diagnosis: diagnosis || '',
    correction: correction || '',
    vehicle: vehicle ? { year: vehicle.year, make: vehicle.make, model: vehicle.model } : null,
    dtcs: [...(dtcs || [])].sort(),
    services: (services || []).map(s => s.name).filter(Boolean).sort(),
  });
  return createHash('sha256').update(stable).digest('hex');
}

function formatContext({ concern, diagnosis, correction, vehicle, dtcs, services }) {
  const vehicleStr = vehicle
    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'unknown vehicle'
    : 'unknown vehicle';
  const dtcStr = (dtcs || []).length ? (dtcs || []).join(', ') : 'none on file';
  const servicesStr = (services || []).map(s => s.name).filter(Boolean).join(', ') || 'none listed';

  return `Vehicle:    ${vehicleStr}
DTCs on file: ${dtcStr}
Services on RO: ${servicesStr}

Complaint (as written): ${concern || 'not recorded'}
Cause (as written):     ${diagnosis || 'not recorded'}
Correction (as written): ${correction || 'not recorded'}`;
}

function extractJson(raw) {
  const json = (raw || '{}').match(/\{[\s\S]*\}/)?.[0] || raw || '{}';
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/**
 * Score a 3C narrative's quality, 0-100, against what a Gold Standard
 * complaint/cause/correction write-up looks like (specific onset/frequency
 * in the complaint, DTCs+diagnostic reasoning in the cause, parts+
 * verification in the correction) — not a style/grammar check.
 *
 * @returns {Promise<{score:number, rationale:string, gaps:string[]}>}
 */
export async function scoreThreeC({ concern, diagnosis, correction, vehicle, dtcs, services }) {
  const cacheKey = scoreCacheKey({ concern, diagnosis, correction, vehicle, dtcs, services });
  if (scoreCache.has(cacheKey)) {
    return scoreCache.get(cacheKey);
  }

  const context = formatContext({ concern, diagnosis, correction, vehicle, dtcs, services });

  const prompt = `You are WrenchIQ Intelligence, grading the quality of a technician's Complaint / Cause / Correction (3C) narrative on a repair order, 0-100.

A Gold Standard 3C narrative:
- Complaint: the customer's own words, with onset, frequency, and conditions — not a one-line paraphrase
- Cause: names every DTC pulled and what it means, cites test results or inspection findings, and references a TSB if one applies
- Correction: lists the parts installed (or diagnostic steps performed) and states how the repair was verified

Score DOWN hard for a single vague sentence like "Customer states noise" with no detail. Score UP for narratives that are specific and cite real diagnostic data. If Cause or Correction is empty because the RO hasn't reached that stage yet, do not penalize those sections — mention that instead in gaps as "not yet reached" rather than treating it as a quality failure equivalent to a vague write-up.

Repair order context:
${context}

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "score": number (0-100),
  "rationale": string (1-2 sentences explaining the score),
  "gaps": string[] (specific missing elements, empty array if none)
}`;

  let data;
  try {
    data = await callAzureOpenAI({
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  500,
      jsonMode:    true,
      temperature: 0,
      _route:      '/api/three-c-score/score',
    });
  } catch (err) {
    console.warn('[threeCScoreService] score call failed:', err.message);
    return { score: null, rationale: 'WrenchIQ could not reach the scoring model.', gaps: [] };
  }

  const parsed = extractJson(getTextFromResponse(data));
  if (!parsed) {
    return { score: null, rationale: 'WrenchIQ returned an unparsable response.', gaps: [] };
  }

  const result = {
    score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null,
    rationale: parsed.rationale || '',
    gaps: Array.isArray(parsed.gaps) ? parsed.gaps : [],
  };
  // Only cache a genuine parsed result — a transient LLM outage shouldn't
  // lock in "could not reach the scoring model" for this input forever.
  if (result.score !== null) {
    scoreCache.set(cacheKey, result);
  }
  return result;
}

/**
 * Rewrite a 3C narrative to Gold Standard quality — strictly grounded in
 * the context provided. See module docstring for the no-fabrication rule.
 *
 * @returns {Promise<{concern:string, diagnosis:string, correction:string}>}
 */
export async function rewriteThreeC({ concern, diagnosis, correction, vehicle, dtcs, services }) {
  const context = formatContext({ concern, diagnosis, correction, vehicle, dtcs, services });

  const prompt = `You are an expert automotive service writer improving a technician's Complaint / Cause / Correction (3C) narrative for this repair order.

STRICT GROUNDING RULE — this is the most important instruction: use ONLY the facts given in "Repair order context" below. Do not invent a DTC, TSB number, part name/number, measurement, test result, or customer statement that isn't already there. You may rephrase, expand, and organize what's given into professional language, but if a Gold Standard narrative would normally include something (e.g. a diagnostic reading) and it simply isn't in the context, write "not yet documented" for that piece instead of making one up.

Repair order context:
${context}

Write an improved version of each section:
- Complaint: restate the customer's concern in clear, specific language — keep any onset/frequency detail already given, don't add new detail that wasn't stated
- Cause: if DTCs are listed, name them and state what they indicate; if a cause/diagnosis was already recorded, expand its phrasing without adding new claims; if nothing is recorded yet, say diagnosis is pending
- Correction: if a correction was already recorded, restate it clearly; if none yet, say correction is pending diagnostic completion

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{ "concern": string, "diagnosis": string, "correction": string }`;

  let data;
  try {
    data = await callAzureOpenAI({
      messages:   [{ role: 'user', content: prompt }],
      max_tokens: 700,
      jsonMode:   true,
      _route:     '/api/three-c-score/rewrite',
    });
  } catch (err) {
    console.warn('[threeCScoreService] rewrite call failed:', err.message);
    return null;
  }

  const parsed = extractJson(getTextFromResponse(data));
  if (!parsed) return null;

  return {
    concern: parsed.concern || concern || '',
    diagnosis: parsed.diagnosis || diagnosis || '',
    correction: parsed.correction || correction || '',
  };
}

// Lines the Sidecar's inspection-findings dropdown appends onto
// customerConcern (see WrenchIQSidecarScreen.jsx's handleInspectionItemSelect)
// — technician-authored, not the customer's own words. The rewrite below
// must never paraphrase or merge these into the customer's sentence (an LLM
// asked to "clean up the customer's concern" will happily fold them in and
// drop the specific component/measurement, even under a grounding rule that
// only forbids *inventing* facts, not reorganizing existing ones) — so they
// are held out of the LLM call entirely and re-appended verbatim after.
const INSPECTION_NOTE_PREFIX = 'Inspection finding:';

function splitConcernNotes(concern) {
  const lines = (concern || '').split('\n');
  const customerLines = lines.filter((l) => !l.startsWith(INSPECTION_NOTE_PREFIX));
  const inspectionLines = lines.filter((l) => l.startsWith(INSPECTION_NOTE_PREFIX));
  return { customerText: customerLines.join('\n').trim(), inspectionLines };
}

/**
 * Rewrite just the customer's intake concern (ro.customerConcern) — grounded
 * the same way as rewriteThreeC() (clarity/grammar only, no invented
 * symptoms, DTCs, or parts), but scoped to the concern text alone since it
 * has no diagnosis/correction/DTC context at intake time. Any
 * technician-appended "Inspection finding:" lines are preserved verbatim,
 * not sent through the rewrite (see splitConcernNotes above).
 *
 * @returns {Promise<{concern: string}|null>}
 */
export async function rewriteConcern({ concern, vehicle }) {
  const { customerText, inspectionLines } = splitConcernNotes(concern);
  const reattach = (rewrittenCustomerText) =>
    [rewrittenCustomerText, ...inspectionLines].filter(Boolean).join('\n');

  if (!customerText) {
    // Nothing but inspection notes (or empty) — no customer wording to rewrite.
    return { concern: reattach('') };
  }

  const vehicleStr = vehicle
    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim() || 'unknown vehicle'
    : 'unknown vehicle';

  const prompt = `You are an expert automotive service writer cleaning up a customer's stated concern for a repair order intake.

STRICT GROUNDING RULE — this is the most important instruction: use ONLY what the customer actually said below. Do not invent a symptom, DTC, part, measurement, or detail that isn't already there. You may fix grammar, spelling, and organize the wording into clear, professional language, but do not add new claims.

Vehicle: ${vehicleStr}
Customer's concern (as written): ${customerText}

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{ "concern": string }`;

  let data;
  try {
    data = await callAzureOpenAI({
      messages:   [{ role: 'user', content: prompt }],
      max_tokens: 300,
      jsonMode:   true,
      _route:     '/api/three-c-score/rewrite-concern',
    });
  } catch (err) {
    console.warn('[threeCScoreService] rewriteConcern call failed:', err.message);
    return null;
  }

  const parsed = extractJson(getTextFromResponse(data));
  if (!parsed) return null;

  return { concern: reattach(parsed.concern || customerText) };
}

/**
 * Independent fact-check of a rewrite against the same context it was
 * supposed to be grounded in — a second LLM call whose only job is to
 * catch fabrication the rewrite prompt's own grounding instruction failed
 * to prevent. This is deliberately an LLM judge rather than a deterministic
 * check: unlike TSB pricing/scope (where a structured ground-truth number
 * exists to compute against), a free-form narrative rewrite has no
 * structured field to diff against — spotting "this claim isn't supported
 * by the source text" is a judgment call, which is exactly what an LLM
 * judge is for and a regex/deterministic check is not.
 *
 * @returns {Promise<{grounded: boolean|null, fabrications: string[]}>}
 *   grounded is null (not false) when the judge call itself failed — an
 *   unreachable model isn't evidence of fabrication.
 */
export async function verifyThreeCGrounding({ rewritten, concern, diagnosis, correction, vehicle, dtcs, services }) {
  const context = formatContext({ concern, diagnosis, correction, vehicle, dtcs, services });

  const prompt = `You are a strict fact-checker reviewing a rewritten repair-order narrative for fabrication.

ORIGINAL CONTEXT (the only source of truth):
${context}

REWRITE TO CHECK:
Complaint: ${rewritten.concern || ''}
Cause: ${rewritten.diagnosis || ''}
Correction: ${rewritten.correction || ''}

Flag any statement in the rewrite that asserts a fact — a DTC, TSB number, part name/number, measurement, test result, specific customer statement, or other concrete claim — that is NOT present in the original context above, even if it sounds like a plausible detail for this kind of repair. Rephrasing, reorganizing, or elaborating on the *style* of something already in the context is fine and is not a fabrication. A generic phrase like "diagnosis is pending" or "not yet documented" is also fine.

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "grounded": boolean,
  "fabrications": string[]
}`;

  let data;
  try {
    data = await callAzureOpenAI({
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  400,
      jsonMode:    true,
      temperature: 0,
      _route:      '/api/three-c-score/verify-grounding',
    });
  } catch (err) {
    console.warn('[threeCScoreService] grounding verification call failed:', err.message);
    return { grounded: null, fabrications: [] };
  }

  const parsed = extractJson(getTextFromResponse(data));
  if (!parsed) return { grounded: null, fabrications: [] };

  return {
    grounded: typeof parsed.grounded === 'boolean' ? parsed.grounded : null,
    fabrications: Array.isArray(parsed.fabrications) ? parsed.fabrications.filter(Boolean) : [],
  };
}

/**
 * Score the narrative as-is, rewrite it (grounded-only), then score the
 * rewrite — so the "before" and "after" numbers both come from the same
 * live judge rather than one live score next to a hardcoded "after" — and
 * independently verify the rewrite's grounding (see verifyThreeCGrounding).
 */
export async function scoreAndRewriteThreeC(input) {
  const before = await scoreThreeC(input);
  const rewritten = await rewriteThreeC(input);
  if (!rewritten) {
    return { before, rewritten: null, after: null, grounding: null };
  }
  const [after, grounding] = await Promise.all([
    scoreThreeC({ ...input, ...rewritten }),
    verifyThreeCGrounding({ rewritten, ...input }),
  ]);
  return { before, rewritten, after, grounding };
}
