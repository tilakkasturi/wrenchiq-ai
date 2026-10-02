<!--
RO intake extraction — user message carrying the inbound lead for POST /api/ro-agent/draft.
Loaded by: server/routes/roAgent.js (the /draft handler), via prompt('ro-intake-extract-user', vars).
Variables:
  channel        where the lead came from (instagram, sms, ...); empty = not given
  customerName   the customer's name; empty = not given
  phone          the customer's phone number; empty = not given
  message        the customer's message text, verbatim
-->
Inbound lead from {{#if channel}}{{channel}}{{else}}unknown channel{{/if}}:
Customer name: {{#if customerName}}{{customerName}}{{else}}Unknown{{/if}}
Phone: {{#if phone}}{{phone}}{{else}}Not provided{{/if}}
Message: "{{message}}"

Extract the repair intent and return structured JSON.
