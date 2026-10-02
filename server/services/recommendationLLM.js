/**
 * WrenchIQ — Recommendation LLM Service
 *
 * Calls the configured LLM (see LLM_BASE_URL / LLM_MODEL in server/config.js)
 * to generate shop recommendations from a snapshot.
 * Model and token settings are read from server/config.js (set via .env.local).
 *
 * A single-call generation skill, not an agent — one completion per request
 * (cached 15 min per shopId+edition by the route), no tool-calling. See
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md.
 */

import {
  CLAUDE_MAX_TOKENS_RECOMMENDATIONS,
} from '../config.js';
import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { voiceDirectiveText } from './voicePrompt.js';
import { prompt } from './promptLoader.js';

/**
 * Build the system prompt for the recommendations engine
 * (prompts/recommendations-system.md).
 */
function buildSystemPrompt(edition, voice) {
  return prompt('recommendations-system', {
    oem: edition === 'oem',
    voiceDirective: voiceDirectiveText(voice),
  });
}

/**
 * Build the user message containing the shop snapshot
 * (prompts/recommendations-snapshot-user.md).
 */
function buildSnapshotMessage(snapshot) {
  const {
    shopId, edition, generatedAt,
    targetELR, actualELR, todayRevenue,
    last7DaysRevenue, avgWaitTimeMinutes, totalDeclinedRevenue,
    openROCount, closedROCount,
    techStats, openROs, last7DaysClosedSummary,
  } = snapshot;

  // Top declined items across all open ROs for revenue signal
  const topDeclined = openROs
    .flatMap(ro => (ro.declinedServices || []).map(d => ({
      roNumber: ro.roNumber, customerId: ro.customerId, desc: d.description, cost: d.estimatedCost,
    })))
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5);

  // ROs with longest wait — omit techId/customerId (IDs are internal, not useful to LLM)
  const longWaiters = openROs
    .filter(ro => ro.waitMinutes > 60)
    .sort((a, b) => b.waitMinutes - a.waitMinutes)
    .slice(0, 5)
    .map(ro => ({ roNumber: ro.roNumber, bay: ro.bay, waitMinutes: ro.waitMinutes }));

  // Loyalty-at-risk customers — send count + tier + wait, not raw IDs
  const loyaltyRiskROs = openROs
    .filter(ro => ro.loyaltyTier === 'vip' || ro.loyaltyTier === 'preferred')
    .filter(ro => ro.waitMinutes > 45)
    .slice(0, 3);
  const loyaltyRisk = {
    count: loyaltyRiskROs.length,
    tiers: loyaltyRiskROs.map(ro => ro.loyaltyTier),
    maxWaitMinutes: loyaltyRiskROs.reduce((max, ro) => Math.max(max, ro.waitMinutes || 0), 0),
    roNumbers: loyaltyRiskROs.map(ro => ro.roNumber),
  };

  const techSummary = techStats.slice(0, 6).map(t => ({
    efficiency: t.efficiency, elr: t.elr, roCount: t.roCount,
  }));

  const payload = {
    shopId, edition,
    laborRate: { target: targetELR, actual: actualELR, gap: targetELR - actualELR },
    revenue: {
      today: todayRevenue,
      last7Days: last7DaysClosedSummary.totalRevenue,
      last7DaysDeclined: last7DaysClosedSummary.totalDeclined,
      last7DaysAvgELR: last7DaysClosedSummary.avgELR,
      last7DaysROCount: last7DaysClosedSummary.roCount,
    },
    bays: { openROCount, avgWaitMinutes: avgWaitTimeMinutes, totalDeclinedRevenue },
    technicians: techSummary,
    topDeclinedItems: topDeclined,
    longWaitROs: longWaiters,
    loyaltyRisk,
  };

  return prompt('recommendations-snapshot-user', { snapshotJson: JSON.stringify(payload) });
}

/**
 * Parse the LLM's response and validate it is a proper recommendations array.
 * Throws if parsing fails.
 */
function parseRecommendations(text) {
  // Strip any accidental markdown code fences
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`LLM returned invalid JSON: ${e.message}. Raw: ${text.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`LLM returned non-array JSON. Got: ${typeof parsed}`);
  }

  // Light validation
  for (const rec of parsed) {
    if (!rec.id || !rec.domain || !rec.priority || !rec.personas) {
      throw new Error(`Recommendation missing required fields: ${JSON.stringify(rec).slice(0, 100)}`);
    }
  }

  // Strip meta-commentary recommendations (data quality / system limitation messages)
  const META_PATTERNS = [
    /cannot advise/i,
    /not capturing/i,
    /no data/i,
    /insufficient data/i,
    /system.{0,20}(not|unable|cannot)/i,
    /unable to (advise|recommend|assess)/i,
    /data.{0,20}(unavailable|missing|absent)/i,
    /\bcust-\d+\b/i,
    /\btech-\d+\b/i,
    /\bshop-\d+\b/i,
  ];

  const filtered = parsed.filter(rec => {
    const allText = Object.values(rec.personas || {})
      .flatMap(p => [p.headline || '', p.explanation || ''])
      .join(' ');
    return !META_PATTERNS.some(re => re.test(allText));
  });

  return filtered;
}

/**
 * Generate recommendations from a shop snapshot using the configured LLM
 * (self-hosted Qwen3-VL-32B-Instruct-FP8 by default, see server/config.js).
 *
 * @param {object} snapshot  - Output of buildSnapshot()
 * @param {string} edition   - 'am' | 'oem'
 * @param {object} [voice]   - Shop tone-of-voice settings, see shopVoiceSettings.js
 * @returns {Array}          - recommendations[]
 * @throws                   - On API error or JSON parse failure (caller returns 503)
 */
export async function generateRecommendations(snapshot, edition, voice) {
  const systemPrompt = buildSystemPrompt(edition, voice);
  const userMessage  = buildSnapshotMessage(snapshot);

  let data;
  try {
    data = await callAzureOpenAI({
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userMessage }],
      max_tokens: CLAUDE_MAX_TOKENS_RECOMMENDATIONS,
      jsonMode:   true,
      _route: '/api/recommendations',
    });
  } catch (fetchErr) {
    throw new Error(`Azure OpenAI network error: ${fetchErr.message}`);
  }

  const rawText    = getTextFromResponse(data);
  const finishReason = data.choices?.[0]?.finish_reason;

  if (!rawText) {
    throw new Error('Azure OpenAI returned empty response');
  }

  if (finishReason === 'length') {
    throw new Error(`Azure OpenAI response truncated (max_tokens hit). Increase CLAUDE_MAX_TOKENS_RECOMMENDATIONS or reduce snapshot size.`);
  }

  // Azure json_object mode returns a wrapper object: { "recommendations": [...] }
  // Parse and extract the array
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (e) {
    throw new Error(`Azure OpenAI returned invalid JSON: ${e.message}. Raw: ${rawText.slice(0, 200)}`);
  }

  const arr = Array.isArray(parsed) ? parsed : (parsed.recommendations || []);

  // parseRecommendations throws on failure — caller catches and returns 503
  return parseRecommendations(JSON.stringify(arr));
}
