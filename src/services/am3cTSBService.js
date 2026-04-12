// ============================================================
// AM 3C TSB Match Integration Service — AE-878
// Queries Predii TSB corpus to match Technical Service Bulletins
// to vehicle and symptoms. Supports demo mode with DEMO_REGISTRY.
// No external dependencies — uses native fetch only.
// ============================================================

import { DEMO_REGISTRY } from '../data/am3cDemoRegistry.js';

// ============================================================
// Constants
// ============================================================

const PREDII_TSB_API_BASE = 'https://api.predii.com/v1/tsb';

const MIN_DELAY_MS = 300;
const MAX_DELAY_MS = 600;

const TOP_N = 3;

// Common English stop words for keyword extraction
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'it', 'as', 'be', 'was', 'are',
  'been', 'has', 'have', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'not',
  'no', 'nor', 'so', 'yet', 'both', 'either', 'neither', 'than',
  'that', 'this', 'these', 'those', 'which', 'who', 'what', 'when',
  'where', 'how', 'why', 'all', 'any', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'up', 'out', 'if', 'about', 'also', 'into',
  'then', 'there', 'they', 'their', 'them', 'its', 'my', 'our', 'your',
  'his', 'her', 'we', 'he', 'she', 'i', 'me', 'us', 'you', 'him',
  'very', 'just', 'been', 'much', 'now', 'only', 'well', 'too', 'over',
  'after', 'before', 'during', 'while', 'since', 'until', 'under',
  'between', 'through', 'against', 'around', 'without', 'within',
  'along', 'following', 'across', 'behind', 'beyond', 'plus', 'except',
  'but', 'up', 'down', 'off', 'per', 'via', 'set', 'get', 'got',
]);

// ============================================================
// Internal helpers
// ============================================================

/**
 * Return a random integer between min and max (inclusive).
 */
function _randomDelay() {
  return MIN_DELAY_MS + Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1));
}

/**
 * Sleep for a given number of milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function _sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Normalize a string for comparison — lowercase, trim.
 * @param {string} str
 * @returns {string}
 */
function _normalize(str) {
  return (str || '').toLowerCase().trim();
}

/**
 * Score how well a registry TSBMatch entry matches the query.
 * Uses the TSB's own relevanceScore as the primary signal, then
 * applies a small keyword overlap bonus so callers who supply
 * complaintKeywords or dtcCodes get better ordering.
 *
 * @param {object} tsb - TSBMatch from DEMO_REGISTRY
 * @param {object} query - { dtcCodes, complaintKeywords }
 * @returns {number} 0–1 composite score
 */
function _scoreMatch(tsb, query) {
  const base = typeof tsb.relevanceScore === 'number' ? tsb.relevanceScore : 0.5;

  const searchTerms = [
    ...(query.dtcCodes || []).map(_normalize),
    ...(query.complaintKeywords || []).map(_normalize),
  ];

  if (searchTerms.length === 0) return base;

  const haystack = _normalize(
    `${tsb.tsbNumber} ${tsb.title} ${tsb.affectedCondition}`
  );

  const matchCount = searchTerms.filter(term => term && haystack.includes(term)).length;
  const bonus = matchCount > 0 ? (matchCount / searchTerms.length) * 0.05 : 0;

  return Math.min(1, base + bonus);
}

/**
 * Resolve the demo registry key from a query object.
 * Prefers an exact VIN hit; falls back to YMME string matching.
 *
 * @param {object} query - { vin, ymme: { year, make, model } }
 * @returns {string|null} Registry key (VIN) or null if not found
 */
function _resolveDemoKey(query) {
  const { vin, ymme } = query;

  // Direct VIN match
  if (vin && DEMO_REGISTRY[vin.trim().toUpperCase()]) {
    return vin.trim().toUpperCase();
  }

  // YMME fallback — find first entry whose vehicle matches year/make/model
  if (ymme && (ymme.year || ymme.make || ymme.model)) {
    for (const [key, entry] of Object.entries(DEMO_REGISTRY)) {
      const v = entry.vehicle || {};
      const yearMatch  = !ymme.year  || String(v.year)  === String(ymme.year);
      const makeMatch  = !ymme.make  || _normalize(v.make)  === _normalize(ymme.make);
      const modelMatch = !ymme.model || _normalize(v.model) === _normalize(ymme.model);
      if (yearMatch && makeMatch && modelMatch) return key;
    }
  }

  return null;
}

// ============================================================
// Public API
// ============================================================

/**
 * @typedef {Object} TSBMatch
 * @property {string}       tsbNumber        - TSB identifier (e.g. "T-SB-0197-18")
 * @property {string}       title            - Short title of the bulletin
 * @property {string}       affectedCondition - Description of the condition addressed
 * @property {number}       relevanceScore   - 0–1 match confidence
 * @property {string}       source           - Data source (e.g. "Toyota Technical")
 * @property {boolean|null} accepted         - null = pending, true = accepted, false = dismissed
 * @property {string}       [dismissalReason]- Reason for dismissal (set by dismissTSB)
 */

/**
 * @typedef {Object} TSBQueryResult
 * @property {TSBMatch[]}  matches         - Ordered list of TSB matches (up to TOP_N)
 * @property {boolean}     noMatch         - True when no applicable TSBs were found
 * @property {string}      [noMatchReason] - Human-readable reason when noMatch is true
 */

/**
 * Query the Predii TSB corpus for bulletins matching the vehicle and complaint.
 *
 * In demo mode, results are resolved from DEMO_REGISTRY keyed by VIN or YMME.
 * In live mode, a Predii API call is simulated (returns empty — requires API key).
 *
 * A 300–600 ms simulated network delay is added in all modes.
 *
 * @param {{ vin?: string, ymme?: { year?: number|string, make?: string, model?: string }, dtcCodes?: string[], complaintKeywords?: string[] }} query
 * @param {boolean} [demoMode=true]
 * @returns {Promise<TSBQueryResult>}
 */
export async function queryTSBCorpus(query = {}, demoMode = true) {
  await _sleep(_randomDelay());

  // ---- Demo mode ----
  if (demoMode) {
    const key = _resolveDemoKey(query);

    if (!key) {
      return {
        matches: [],
        noMatch: true,
        noMatchReason: 'No applicable TSBs found for this YMME and complaint',
      };
    }

    const entry = DEMO_REGISTRY[key];
    const raw = Array.isArray(entry.tsbMatches) ? entry.tsbMatches : [];

    if (raw.length === 0) {
      return {
        matches: [],
        noMatch: true,
        noMatchReason: 'No applicable TSBs found for this YMME and complaint',
      };
    }

    // Score, sort descending, take top N, attach accepted: null
    const matches = raw
      .map(tsb => ({ ...tsb, _score: _scoreMatch(tsb, query) }))
      .sort((a, b) => b._score - a._score)
      .slice(0, TOP_N)
      .map(({ _score, ...tsb }) => ({
        tsbNumber: tsb.tsbNumber,
        title: tsb.title,
        affectedCondition: tsb.affectedCondition,
        relevanceScore: _score,
        source: tsb.source,
        accepted: null,
      }));

    return { matches, noMatch: false };
  }

  // ---- Live mode (mocked — requires API key) ----
  console.warn(
    '[am3cTSBService] Live mode: Predii TSB API call requires a valid API key. ' +
    'Returning empty result. Configure PREDII_API_KEY to enable live queries.'
  );

  try {
    // Mock the fetch — in production this would POST to PREDII_TSB_API_BASE
    // with { vin, ymme, dtcCodes, complaintKeywords } and parse TSBMatch[]
    // from the response body.
    //
    // Example (not executed — no API key available):
    //   const resp = await fetch(`${PREDII_TSB_API_BASE}/match`, {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${process.env.PREDII_API_KEY}`,
    //     },
    //     body: JSON.stringify(query),
    //   });
    //   const data = await resp.json();
    //   return { matches: data.matches || [], noMatch: data.matches?.length === 0 };

    return {
      matches: [],
      noMatch: true,
      noMatchReason: 'No applicable TSBs found for this YMME and complaint',
    };
  } catch (err) {
    console.error('[am3cTSBService] Live API error:', err);
    return {
      matches: [],
      noMatch: true,
      noMatchReason: 'No applicable TSBs found for this YMME and complaint',
    };
  }
}

/**
 * Accept a TSB match — marks it as relevant and confirmed by the technician.
 *
 * @param {TSBMatch} tsbMatch
 * @returns {TSBMatch} Updated match with accepted: true
 */
export function acceptTSB(tsbMatch) {
  return { ...tsbMatch, accepted: true };
}

/**
 * Dismiss a TSB match — marks it as not applicable with a reason.
 *
 * @param {TSBMatch} tsbMatch
 * @param {string}   reason - Why the TSB was dismissed
 * @returns {TSBMatch} Updated match with accepted: false and dismissalReason set
 */
export function dismissTSB(tsbMatch, reason) {
  return {
    ...tsbMatch,
    accepted: false,
    dismissalReason: reason || 'Dismissed by technician',
  };
}

/**
 * Format an accepted TSB match into a Cause section text snippet.
 *
 * Example output:
 *   "Per TSB [T-SB-0197-18]: Catalyst System Efficiency Below Threshold (Bank 1).
 *    Condition: MIL illuminated with P0420, vehicle may have no drivability concerns.
 *    Verified applicable to this vehicle and complaint. [T-SB-0197-18]"
 *
 * @param {TSBMatch} tsbMatch - An accepted TSBMatch (accepted: true)
 * @returns {string} Formatted cause text
 */
export function formatTSBForCause(tsbMatch) {
  const { tsbNumber, title, affectedCondition } = tsbMatch || {};
  const num = tsbNumber || 'UNKNOWN';
  const ttl = title || '';
  const cond = affectedCondition || '';

  return (
    `Per TSB [${num}]: ${ttl}. ` +
    `Condition: ${cond}. ` +
    `Verified applicable to this vehicle and complaint. [${num}]`
  );
}

/**
 * Simulate an ALLDATA / Mitchell1 fallback TSB lookup.
 * Returns an empty array — a real integration key is required for live queries.
 *
 * @param {{ vin?: string, ymme?: object, dtcCodes?: string[], complaintKeywords?: string[] }} query
 * @returns {Promise<{ matches: TSBMatch[], source: string, note: string }>}
 */
export async function queryFallback(query) {
  await _sleep(_randomDelay());

  console.warn(
    '[am3cTSBService] ALLDATA/Mitchell1 fallback: integration key required. ' +
    'Returning empty result.'
  );

  return {
    matches: [],
    source: 'alldata',
    note:
      'ALLDATA/Mitchell1 TSB lookup requires a valid integration key. ' +
      'Configure the integration in Shop Settings > Integrations to enable this feature.',
  };
}

/**
 * Extract significant keywords from a free-text complaint string.
 * Removes stop words and short tokens; returns unique terms sorted by length
 * (longer, more specific terms first).
 *
 * @param {string} complaintText
 * @returns {string[]} Significant keyword terms
 */
export function extractComplaintKeywords(complaintText) {
  if (!complaintText || typeof complaintText !== 'string') return [];

  const tokens = complaintText
    .toLowerCase()
    // Replace punctuation (but keep hyphens inside words like "P0420") with spaces
    .replace(/[^a-z0-9\-\s]/g, ' ')
    .split(/\s+/)
    .map(t => t.trim());

  const seen = new Set();
  const result = [];

  for (const token of tokens) {
    // Drop empty, stop words, and very short tokens (1–2 chars)
    if (!token || token.length < 3) continue;
    if (STOP_WORDS.has(token)) continue;
    // Drop pure-numeric tokens (mileage, years stand alone as context, not keywords)
    if (/^\d+$/.test(token)) continue;
    if (seen.has(token)) continue;

    seen.add(token);
    result.push(token);
  }

  // Sort: longer/more specific terms first
  result.sort((a, b) => b.length - a.length);

  return result;
}
