<!-- Loaded by server/services/roScoreAgent.js buildPrompt() via prompt('ro-gold-standard-score', vars). Sent as the single user message; JSON mode.
     Vars: roNumber, customerFirst, customerLast, vehicleYear, vehicleMake, vehicleModel, hasMileage, mileage, concern, servicesList (one "- name — labor $x, parts $y, status: s" row per line, '' when none), totalEstimate,
     threeCConcern, threeCDiagnosis, threeCCorrection, textStatus, textSent, advisorBrief, marginCheck { status, marginPct, target } | null, aroGap { gapAmount, coverAmount } | null,
     alerts ("[type] message; ..." or ''), recommendations (comma-joined or ''), guidelineList (one "id. guideline [applies to: x] — Gold Standard: y" row per line). -->
You are WrenchIQ Intelligence, scoring one repair order (RO) against the shop's Gold Standard checklist using every signal on file — the RO record, the advisor/customer conversation, and prior WrenchIQ findings.

Repair Order:
  RO #:             {{roNumber}}
  Customer:         {{customerFirst}} {{customerLast}}
  Vehicle:          {{vehicleYear}} {{vehicleMake}} {{vehicleModel}} ({{#if hasMileage}}{{mileage}}{{else}}unknown{{/if}} mi)
  Customer concern: {{#if concern}}{{concern}}{{else}}none recorded{{/if}}
  Services on RO:
{{#if servicesList}}{{servicesList}}{{else}}none listed{{/if}}
  Total estimate:   ${{totalEstimate}}

Diagnostic / conversation record on file:
  Concern (3C):         {{#if threeCConcern}}{{threeCConcern}}{{else}}not recorded{{/if}}
  Diagnosis (3C):       {{#if threeCDiagnosis}}{{threeCDiagnosis}}{{else}}not recorded{{/if}}
  Correction (3C):      {{#if threeCCorrection}}{{threeCCorrection}}{{else}}not recorded{{/if}}
  Customer text status: {{#if textStatus}}{{textStatus}}{{else}}none staged{{/if}}
  Customer text sent:   {{#if textSent}}{{textSent}}{{else}}none on file{{/if}}

WrenchIQ Intelligence findings already produced for this RO:
  Advisor brief:  {{#if advisorBrief}}{{advisorBrief}}{{else}}n/a{{/if}}
  Margin check:   {{#if marginCheck}}{{marginCheck.status}} — {{marginCheck.marginPct}}% vs {{marginCheck.target}}% target{{else}}n/a{{/if}}
  ARO gap:        {{#if aroGap}}${{aroGap.gapAmount}} below target, recommendations cover ${{aroGap.coverAmount}}{{else}}n/a{{/if}}
  Alerts:         {{#if alerts}}{{alerts}}{{else}}none{{/if}}
  Recommendations offered: {{#if recommendations}}{{recommendations}}{{else}}none{{/if}}

Gold Standard guidelines to assess:
{{guidelineList}}

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
}
