<!-- User message for every 3C Story Writer narrative mode. Loaded by src/services/am3cLLMService.js (buildUserMessage).
     Vars: roId, vehicleName ("2019 Toyota Camry SE", empty when no vehicle), vin, complaint, cause, correction,
     milOn (true when any DTC), dtcs ("P0420: desc; ..."), tsbs (one "id: title" per line, joined with "\n  "),
     dviRed ("finding; finding"), techNotes, laborLines ("  - desc" lines), partLines ("  - name | P/N: x | Qty: n" lines).
     Empty values fall back to the wording below. -->
RO: {{#if roId}}{{roId}}{{else}}N/A{{/if}}
Vehicle: {{#if vehicleName}}{{vehicleName}} (VIN: {{#if vin}}{{vin}}{{else}}N/A{{/if}}){{else}}Unknown vehicle{{/if}}

Current 3C (raw — rewrite this):
COMPLAINT: {{#if complaint}}{{complaint}}{{else}}(empty){{/if}}
CAUSE: {{#if cause}}{{cause}}{{else}}(empty){{/if}}
CORRECTION: {{#if correction}}{{correction}}{{else}}(empty){{/if}}

Diagnostic findings:
- Check Engine Light / MIL: {{#if milOn}}YES — MIL/CEL illuminated{{else}}No active DTCs — MIL off{{/if}}
- DTCs scanned: {{#if dtcs}}{{dtcs}}{{else}}None{{/if}}
- Applicable TSBs:
  {{#if tsbs}}{{tsbs}}{{else}}None{{/if}}
- DVI red items: {{#if dviRed}}{{dviRed}}{{else}}None{{/if}}
- Tech notes: {{#if techNotes}}{{techNotes}}{{else}}None{{/if}}

Work performed (procedures completed):
{{#if laborLines}}{{laborLines}}{{else}}  None provided{{/if}}

Parts installed/recommended (include in Correction with part numbers — no labor hours):
{{#if partLines}}{{partLines}}{{else}}  None provided{{/if}}

Rewrite the 3C narrative per the instructions. Return JSON only.
