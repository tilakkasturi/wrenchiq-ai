/**
 * WrenchIQ — RO Value/Opportunity Score Service (V5 feedback C3)
 * Fetches a second, independent per-RO score (value-based-selling
 * opportunity) alongside the existing Gold Standard hygiene score.
 * See server/services/roValueScoreService.js for the scoring formula.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Batch-fetch value scores for a set of ROs in one call.
 * @param {string} shopId
 * @param {Array<{roNumber:string, customerId:string, totalEstimate:number}>} ros
 * @returns {Promise<object>} map of roNumber -> {score, band, ...}, or {} on failure
 */
export async function fetchValueScores(shopId, ros) {
  if (!shopId || !ros?.length) return {};
  try {
    const res = await fetch(`${API_BASE}/api/ro-value-score/${encodeURIComponent(shopId)}/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ros }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return {};
    const json = await res.json();
    return json.scores || {};
  } catch (err) {
    console.warn('[roValueScoreService] fetchValueScores failed:', err);
    return {};
  }
}
