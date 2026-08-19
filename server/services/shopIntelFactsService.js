/**
 * WrenchIQ — Shop Intelligence Spotlight
 *
 * Generates the "fun facts about this shop" cards shown in the Predii Learn
 * → Shop Intelligence → Spotlight view. Facts must be grounded strictly in
 * the shop/location/technician/financial data passed in — no invented
 * numbers, names, or comparisons that aren't derivable from that data.
 *
 * A single-call scoring/writing skill, same shape as roScoreAgent.js.
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';

function buildPrompt({ shop, locations, technicians, financials }) {
  const locationsStr = (locations || [])
    .map(l => `- ${l.name}: rank #${l.rank}, avg RO $${l.avgRO}, ${l.bays} bays, ${l.techs} techs, status "${l.status}", manager ${l.manager}`)
    .join('\n') || 'none provided';

  const techsStr = (technicians || [])
    .map(t => `- ${t.name} (${t.role}, ${t.location}): efficiency ${t.efficiency}%, ELR $${t.elr}, customer rating ${t.customerRating}, avg job value $${t.avgJobValue}. Note: ${t.note || 'none'}`)
    .join('\n') || 'none provided';

  const finStr = financials
    ? `YTD revenue: $${financials.ytd?.totalRevenue}, avg ARO: $${financials.ytd?.avgARO}, invoices: ${financials.ytd?.totalInvoices}, car count: ${financials.ytd?.carCount}
MTD gross profit: ${financials.mtd?.grossProfitPct}%, labor margin: ${financials.mtd?.laborMargin}%, parts margin: ${financials.mtd?.partsMargin}%
Revenue by month: ${(financials.revenueByMonth || []).map(m => `${m.month}: $${m.revenue} (target $${m.target})`).join('; ')}`
    : 'none provided';

  return `You are WrenchIQ Intelligence, writing a "Shop Intelligence Spotlight" — a short list of genuinely interesting, fun-to-read facts about this shop, surfaced after a Predii Learn run over its data.

STRICT GROUNDING RULE: every fact must be directly derivable from the data given below. Do not invent a number, name, ranking, or comparison that isn't supported by this data. Where you compute something (a gap, a ratio, a "highest/lowest"), the underlying numbers must come straight from what's given.

Shop: ${shop?.name || 'this shop'}, owner ${shop?.owner || 'unknown'}, target ELR $${shop?.targetElr}, ${shop?.locations} locations, network "${shop?.network}" (${shop?.networkFullName || ''}).

Locations:
${locationsStr}

Technicians:
${techsStr}

Financials:
${finStr}

Write 6-9 facts. Favor genuinely surprising or noteworthy juxtapositions over generic summaries (e.g. a name repeated in two roles, a technician's rating beating a more senior peer's, a target nobody is hitting, a location's rank vs. a specific problem it has) — but only if the data actually supports it. Each fact needs a short punchy title (under 10 words) and a 1-2 sentence detail that cites the actual numbers/names behind it. Pick one emoji per fact that fits its content.

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "facts": [
    { "icon": "emoji", "title": string, "detail": string }
  ]
}`;
}

/**
 * @returns {Promise<Array<{icon:string, title:string, detail:string}>>}
 */
export async function generateShopIntelFacts({ shop, locations, technicians, financials }) {
  const prompt = buildPrompt({ shop, locations, technicians, financials });

  let data;
  try {
    data = await callAzureOpenAI({
      messages:   [{ role: 'user', content: prompt }],
      max_tokens: 1200,
      jsonMode:   true,
      _route:     '/api/shop-intel-facts',
    });
  } catch (err) {
    console.warn('[shopIntelFactsService] LLM call failed:', err.message);
    return null;
  }

  const raw = getTextFromResponse(data) || '{}';
  const json = raw.match(/\{[\s\S]*\}/)?.[0] || raw;

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  const facts = Array.isArray(parsed.facts) ? parsed.facts : [];
  return facts
    .filter(f => f && f.title && f.detail)
    .map(f => ({ icon: f.icon || '✨', title: f.title, detail: f.detail }));
}
