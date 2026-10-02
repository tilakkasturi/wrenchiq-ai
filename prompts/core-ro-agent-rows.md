<!--
Core repair order agent: one row of each list in core-ro-agent-context.md.
Loaded by server/services/coreAgentService.js buildRoPrompt() with promptSection().
  line:   name, hours, source
  part:   label, partNumber, qty
  add_on: id, name, for, hours, kind, onOrder (boolean), say
-->

## line
- {{name}} ({{hours}} h, {{source}})

## part
- {{label}}: {{partNumber}} x{{qty}}

## add_on
- [{{id}}] {{name}} with {{for}} (+{{hours}} h, {{kind}}{{#if onOrder}}, on the order{{/if}}). Say: {{say}}
