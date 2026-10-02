<!-- Loaded by server/services/threeCScoreService.js verifyThreeCGrounding() via prompt('three-c-grounding-check', vars). Vars: context (rendered three-c-context of the ORIGINAL narrative), rewritten.concern, rewritten.diagnosis, rewritten.correction ('' when missing). JSON mode, temperature 0. -->
You are a strict fact-checker reviewing a rewritten repair-order narrative for fabrication.

ORIGINAL CONTEXT (the only source of truth):
{{context}}

REWRITE TO CHECK:
Complaint: {{rewritten.concern}}
Cause: {{rewritten.diagnosis}}
Correction: {{rewritten.correction}}

Flag any statement in the rewrite that asserts a fact — a DTC, TSB number, part name/number, measurement, test result, specific customer statement, or other concrete claim — that is NOT present in the original context above, even if it sounds like a plausible detail for this kind of repair. Rephrasing, reorganizing, or elaborating on the *style* of something already in the context is fine and is not a fabrication. A generic phrase like "diagnosis is pending" or "not yet documented" is also fine.

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "grounded": boolean,
  "fabrications": string[]
}
