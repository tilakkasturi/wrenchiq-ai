<!--
Core repair order agent: the user message sent to the agent when the advisor edits the repair order
on the panel instead of in the chat. Loaded by src/core/harness.js (handlers.ro, '__refresh__').
Variables: concern — true when the customer concern was edited, false for the vehicle details.
-->

I edited {{#if concern}}the customer concern{{else}}the vehicle details{{/if}} on the repair order. Re-check the likely repairs and maintenance for the updated order.
