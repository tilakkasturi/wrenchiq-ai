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
import { prompt, promptSection } from './promptLoader.js';

// Wording: prompts/shop-intel-spotlight.md. Scalars go through String() so a missing value still
// reads "undefined", as the old template literal did.
function buildPrompt({ shop, locations, technicians, financials }) {
  const locationsStr = (locations || [])
    .map(l => promptSection('shop-intel-rows', 'location', { name: String(l.name), rank: String(l.rank), avgRO: String(l.avgRO), bays: String(l.bays), techs: String(l.techs), status: String(l.status), manager: String(l.manager) }))
    .join('\n');

  const techsStr = (technicians || [])
    .map(t => promptSection('shop-intel-rows', 'technician', { name: String(t.name), role: String(t.role), location: String(t.location), efficiency: String(t.efficiency), elr: String(t.elr), customerRating: String(t.customerRating), avgJobValue: String(t.avgJobValue), note: t.note || '' }))
    .join('\n');

  const fin = financials && {
    ytdRevenue:        String(financials.ytd?.totalRevenue),
    ytdAvgARO:         String(financials.ytd?.avgARO),
    ytdInvoices:       String(financials.ytd?.totalInvoices),
    ytdCarCount:       String(financials.ytd?.carCount),
    mtdGrossProfitPct: String(financials.mtd?.grossProfitPct),
    mtdLaborMargin:    String(financials.mtd?.laborMargin),
    mtdPartsMargin:    String(financials.mtd?.partsMargin),
    revenueByMonth:    (financials.revenueByMonth || []).map(m => `${m.month}: $${m.revenue} (target $${m.target})`).join('; '),
  };

  return prompt('shop-intel-spotlight', {
    shopName:        shop?.name || '',
    owner:           shop?.owner || '',
    targetElr:       String(shop?.targetElr),
    locationCount:   String(shop?.locations),
    network:         String(shop?.network),
    networkFullName: shop?.networkFullName || '',
    locations:       locationsStr,
    technicians:     techsStr,
    financials:      !!financials,
    fin,
  });
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
