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

function buildPrompt(ro, customer, vehicle, agentData, guidelines) {
  const servicesList = (ro.services || []).map(s => {
    const photoNote = (s.photos || []).length > 0 ? `, ${s.photos.length} photo(s) attached` : '';
    return `- ${s.name} — labor $${s.laborCost || 0}, parts $${s.partsCost || 0}, status: ${s.status || 'pending'}${photoNote}`;
  }).join('\n') || 'none listed';

  const guidelineList = guidelines
    .map(g => `${g.id}. ${g.guideline} [applies to: ${g.appliesTo}] — Gold Standard: ${g.whatA5LooksLike}`)
    .join('\n');

  return `You are WrenchIQ Intelligence, scoring one repair order (RO) against the shop's Gold Standard checklist using every signal on file — the RO record, the advisor/customer conversation, and prior WrenchIQ findings.

Repair Order:
  RO #:             ${ro.roNumber}
  Customer:         ${customer?.firstName || ''} ${customer?.lastName || ''}
  Vehicle:          ${vehicle?.year || ''} ${vehicle?.make || ''} ${vehicle?.model || ''} (${vehicle?.mileage ?? vehicle?.odometer ?? 'unknown'} mi)
  Customer concern: ${ro.customerConcern || 'none recorded'}
  Services on RO:
${servicesList}
  Total estimate:   $${ro.totalEstimate || 0}

Diagnostic / conversation record on file:
  Concern (3C):         ${ro.threeCConcern || 'not recorded'}
  Diagnosis (3C):       ${ro.threeCDiagnosis || 'not recorded'}
  Correction (3C):      ${ro.threeCCorrection || 'not recorded'}
  Customer text status: ${ro.agenticTextStatus || 'none staged'}
  Customer text sent:   ${agentData?.suggestedCustomerMessage || ro.agenticCustomerText || 'none on file'}

WrenchIQ Intelligence findings already produced for this RO:
  Advisor brief:  ${agentData?.advisorBrief || 'n/a'}
  Margin check:   ${agentData?.marginCheck ? `${agentData.marginCheck.status} — ${agentData.marginCheck.marginPct}% vs ${agentData.marginCheck.target}% target` : 'n/a'}
  ARO gap:        ${agentData?.aroGap?.gapAmount ? `$${agentData.aroGap.gapAmount} below target, recommendations cover $${agentData.aroGap.recommendationsCoverAmount || 0}` : 'n/a'}
  Alerts:         ${(agentData?.alerts || []).map(a => `[${a.type}] ${a.message}`).join('; ') || 'none'}
  Recommendations offered: ${(agentData?.serviceRecommendations || []).map(r => r.service).join(', ') || 'none'}

Gold Standard guidelines to assess:
${guidelineList}

For EACH guideline id, decide:
  "met"      — the record/conversation shows clear evidence this guideline was satisfied for this RO
  "not_met"  — there's evidence it was missed or skipped
  "unclear"  — not enough information on file to tell either way

Be conservative: only mark "met" when the data actually shows it, not because it's merely plausible. A guideline with zero supporting data is "unclear", not "met". Cite the specific data point behind your call in "evidence" (one sentence); if there's no data, say "no data on file for this RO".

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "items": [
    { "id": "G1", "status": "met" | "not_met" | "unclear", "evidence": string }
  ]
}`;
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
