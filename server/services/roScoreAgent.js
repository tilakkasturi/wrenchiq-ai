/**
 * WrenchIQ — RO Score Agent
 *
 * Assesses a single repair order against the shop's Gold Standard checklist
 * (server/routes/goldStandardChecklist.js), using whatever signal is on
 * file for that RO: the repair order itself (services, estimate, photos),
 * the 3C conversation fields (concern/diagnosis/correction), the staged/
 * sent customer text, and the WrenchIQ Intelligence findings already
 * produced for this RO (advisor brief, margin check, alerts).
 *
 * This is a suggestion layer only — it never sets the advisor-owned
 * checklist status directly. Callers merge its output as "aiStatus" /
 * "aiEvidence" alongside the advisor's own "status", which always wins.
 *
 * Returns: [{ id, status: "met"|"not_met"|"unclear", evidence }]
 *
 * A single-call scoring skill, not an agent — one JSON-mode completion per
 * call, no tool-calling loop. See
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md.
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { prompt as renderPrompt, promptSection } from './promptLoader.js';

// Code computes the data rows; the wording lives in prompts/ro-gold-standard-score.md.
function buildPrompt(ro, customer, vehicle, agentData, guidelines) {
  const servicesList = (ro.services || []).map(s => promptSection('ro-gold-standard-rows', 'service', {
    name: String(s.name), labor: String(s.laborCost || 0), parts: String(s.partsCost || 0), status: s.status || '', photos: (s.photos || []).length,
  })).join('\n');

  const guidelineList = guidelines
    .map(g => promptSection('ro-gold-standard-rows', 'guideline', { id: String(g.id), guideline: String(g.guideline), appliesTo: String(g.appliesTo), whatA5LooksLike: String(g.whatA5LooksLike) }))
    .join('\n');

  const mileage = vehicle?.mileage ?? vehicle?.odometer;
  const mc = agentData?.marginCheck;
  const aro = agentData?.aroGap;

  // Template literals (not raw values) wherever the old inline prompt interpolated a
  // possibly-missing field, so "undefined" renders exactly as it did instead of throwing.
  return renderPrompt('ro-gold-standard-score', {
    roNumber:         `${ro.roNumber}`,
    customerFirst:    customer?.firstName || '',
    customerLast:     customer?.lastName || '',
    vehicleYear:      vehicle?.year || '',
    vehicleMake:      vehicle?.make || '',
    vehicleModel:     vehicle?.model || '',
    hasMileage:       mileage != null,
    mileage:          `${mileage}`,
    concern:          ro.customerConcern || '',
    servicesList,
    totalEstimate:    ro.totalEstimate || 0,
    threeCConcern:    ro.threeCConcern || '',
    threeCDiagnosis:  ro.threeCDiagnosis || '',
    threeCCorrection: ro.threeCCorrection || '',
    textStatus:       ro.agenticTextStatus || '',
    textSent:         agentData?.suggestedCustomerMessage || ro.agenticCustomerText || '',
    advisorBrief:     agentData?.advisorBrief || '',
    marginCheck:      mc ? { status: `${mc.status}`, marginPct: `${mc.marginPct}`, target: `${mc.target}` } : null,
    aroGap:           aro?.gapAmount ? { gapAmount: `${aro.gapAmount}`, coverAmount: aro.recommendationsCoverAmount || 0 } : null,
    alerts:           (agentData?.alerts || []).map(a => `[${a.type}] ${a.message}`).join('; '),
    recommendations:  (agentData?.serviceRecommendations || []).map(r => r.service).join(', '),
    guidelineList,
  });
}

/**
 * @param {object} opts
 * @param {object} opts.ro          - Current RO (services[], customerConcern, totalEstimate, threeC* fields, agenticCustomerText, agenticTextStatus)
 * @param {object} opts.customer    - Customer record (firstName, lastName)
 * @param {object} opts.vehicle     - Vehicle record (year, make, model, mileage/odometer)
 * @param {object} opts.agentData   - Output of runROAdvisorAgent for this RO (advisorBrief, marginCheck, aroGap, alerts, serviceRecommendations, suggestedCustomerMessage)
 * @param {Array}  opts.guidelines  - Gold Standard checklist definitions [{id, guideline, appliesTo, whatA5LooksLike}]
 * @returns {Promise<Array<{id, status, evidence}>>}
 */
export async function runROScoreAgent({ ro, customer, vehicle, agentData, guidelines }) {
  const prompt = buildPrompt(ro, customer, vehicle, agentData, guidelines);

  let data;
  try {
    data = await callAzureOpenAI({
      messages:   [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      jsonMode:   true,
      _route:     '/api/ro-gold-standard-score/auto-score',
    });
  } catch (err) {
    console.warn('[roScoreAgent] LLM call failed:', err.message);
    return guidelines.map(g => ({ id: g.id, status: 'unclear', evidence: 'WrenchIQ could not reach the scoring model.' }));
  }

  const raw  = getTextFromResponse(data) || '{}';
  const json = raw.match(/\{[\s\S]*\}/)?.[0] || raw;

  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch {
    return guidelines.map(g => ({ id: g.id, status: 'unclear', evidence: 'WrenchIQ returned an unparsable response.' }));
  }

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const byId = Object.fromEntries(items.map(it => [it.id, it]));

  // Guarantee one result per guideline, even if the LLM skipped one.
  return guidelines.map(g => byId[g.id]
    ? { id: g.id, status: byId[g.id].status || 'unclear', evidence: byId[g.id].evidence || '' }
    : { id: g.id, status: 'unclear', evidence: 'Not assessed.' });
}
