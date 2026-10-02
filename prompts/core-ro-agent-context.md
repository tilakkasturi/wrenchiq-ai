<!--
Core repair order agent: the repair order snapshot appended to the system prompt each turn.
Loaded by server/services/coreAgentService.js buildRoPrompt(context). Variables (from the browser's roContext()):
  vehicle   year make model engine, or empty     mileage  odometer, or empty     vin  VIN, or empty
  concern   customer concern, or empty           answers  "id=label, ..." follow-up answers, or empty
  lines     rendered rows (core-ro-agent-rows.md#line), or empty
  parts     rendered rows (core-ro-agent-rows.md#part), or empty
  laborRate shop labor rate, or empty
  addOns    rendered rows (core-ro-agent-rows.md#add_on), or empty
  laborPresentation  the shop's instruction for presenting add-on labor (Shop profile setting), or empty
-->

CURRENT REPAIR ORDER (a snapshot at the start of this turn; tool results are newer)
Vehicle: {{#if vehicle}}{{vehicle}}{{else}}(not set){{/if}}{{#if mileage}}, {{mileage}} mi{{/if}}{{#if vin}}, VIN {{vin}}{{/if}}
Customer concern: {{#if concern}}{{concern}}{{else}}(not set){{/if}}
Follow-up answers so far: {{#if answers}}{{answers}}{{else}}(none){{/if}}
Lines on the order:
{{#if lines}}{{lines}}{{else}}(none){{/if}}
Parts on the order:
{{#if parts}}{{parts}}{{else}}(none){{/if}}
Shop labor rate: {{#if laborRate}}${{laborRate}}/h{{else}}not set{{/if}}
Add-on labor:
{{#if addOns}}{{addOns}}{{else}}(none){{/if}}
{{#if laborPresentation}}How the shop wants add-on labor presented: {{laborPresentation}}{{/if}}
