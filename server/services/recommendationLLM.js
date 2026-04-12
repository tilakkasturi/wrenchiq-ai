/**
 * WrenchIQ — Recommendation LLM Service
 *
 * Calls Claude to generate shop recommendations from a snapshot.
 * Model and token settings are read from server/config.js (set via .env.local).
 */

import {
  CLAUDE_API_KEY,
  CLAUDE_API_URL,
  CLAUDE_API_VERSION,
  CLAUDE_MODEL_RECOMMENDATIONS,
  CLAUDE_MAX_TOKENS_RECOMMENDATIONS,
} from '../config.js';

/**
 * Build the system prompt for the recommendations engine.
 */
function buildSystemPrompt(edition) {
  const editionContext = edition === 'oem'
    ? `This is an OEM dealership fixed-ops edition. Emphasize:
- Warranty capture rates and warranty labor hours
- Fixed ops efficiency (hours sold per RO, tech productivity)
- Service contract and maintenance schedule compliance
- Recall and TSB follow-through
- Customer pay vs warranty mix optimization`
    : `This is an aftermarket independent shop edition. Emphasize:
- Effective Labor Rate (ELR) vs posted rate — revenue leakage
- Declined service upsell opportunities
- Customer loyalty and retention signals
- Multi-point inspection conversion rates
- Bay utilization and tech efficiency`;

  return `You are a shop analytics engine for WrenchIQ.
${editionContext}

Analyze the shop snapshot. Return a JSON array of exactly 4 recommendations (one per domain: utilization, revenue, customer_risk, anomaly).

STRICT RULES:
- Raw JSON array only — absolutely no markdown, fences, or prose
- Never reference customer IDs, tech IDs, or internal database identifiers in any text — use RO numbers only
- headline: max 8 words
- explanation: max 20 words
- metrics: max 2 key-value pairs
- signal.dataPoints: max 2 items, each max 10 words
- Priority: high|medium|low
- screenContext: 1-2 items from [dashboard,orders,analytics,dvi,advisor,scheduling]
- roNumber: include only if a specific RO triggered this
- NEVER generate recommendations about data quality, missing data, system limitations, or inability to advise — only actionable shop insights
- If a domain has insufficient data, substitute the closest available actionable insight from another signal

Compact schema (follow exactly):
{"id":"rec-utilization-1","domain":"utilization","priority":"high","screenContext":["dashboard"],"personas":{"owner":{"headline":"short","explanation":"short","metrics":{"k":"v"}},"advisor":{"headline":"short","explanation":"short","metrics":{"k":"v"}},"tech":{"headline":"short","explanation":"short","metrics":{"k":"v"}}},"signal":{"description":"short","dataPoints":["dp1","dp2"]}}`;
}

/**
 * Build the user message containing the shop snapshot.
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

  return `Shop snapshot:\n${JSON.stringify(payload)}`;
}

/**
 * Parse Claude's response and validate it is a proper recommendations array.
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
    throw new Error(`Claude returned invalid JSON: ${e.message}. Raw: ${text.slice(0, 200)}`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`Claude returned non-array JSON. Got: ${typeof parsed}`);
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
 * Generate recommendations from a shop snapshot using Claude Haiku.
 *
 * @param {object} snapshot  - Output of buildSnapshot()
 * @param {string} edition   - 'am' | 'oem'
 * @returns {Array}          - recommendations[]
 * @throws                   - On API error or JSON parse failure (caller returns 503)
 */
export async function generateRecommendations(snapshot, edition) {
  if (!CLAUDE_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured — set it in .env.local');
  }

  const systemPrompt  = buildSystemPrompt(edition);
  const userMessage   = buildSnapshotMessage(snapshot);

  const body = {
    model:      CLAUDE_MODEL_RECOMMENDATIONS,
    max_tokens: CLAUDE_MAX_TOKENS_RECOMMENDATIONS,
    system:     systemPrompt,
    messages:   [
      { role: 'user',      content: userMessage },
      { role: 'assistant', content: '[' },  // prefill to force raw JSON array, no fences
    ],
  };

  let claudeRes;
  try {
    claudeRes = await fetch(CLAUDE_API_URL, {
      method:  'POST',
      headers: {
        'x-api-key':         CLAUDE_API_KEY,
        'anthropic-version': CLAUDE_API_VERSION,
        'content-type':      'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (fetchErr) {
    throw new Error(`Claude API network error: ${fetchErr.message}`);
  }

  if (!claudeRes.ok) {
    const errBody = await claudeRes.text().catch(() => '(no body)');
    throw new Error(`Claude API error ${claudeRes.status}: ${errBody}`);
  }

  const claudeData = await claudeRes.json();
  const rawText    = claudeData.content?.[0]?.text || '';
  const stopReason = claudeData.stop_reason;

  if (!rawText) {
    throw new Error('Claude returned empty response');
  }

  if (stopReason === 'max_tokens') {
    throw new Error(`Claude response truncated (max_tokens hit). Input tokens: ${claudeData.usage?.input_tokens}. Increase CLAUDE_MAX_TOKENS_RECOMMENDATIONS or reduce snapshot size.`);
  }

  // The assistant prefill started with '[', so prepend it to complete the JSON array
  const fullText = '[' + rawText;

  // parseRecommendations throws on failure — caller catches and returns 503
  return parseRecommendations(fullText);
}
