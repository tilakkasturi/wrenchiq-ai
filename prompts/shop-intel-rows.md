<!--
Shop intel spotlight: one row of the locations and technicians lists in shop-intel-spotlight.md.
Loaded by server/services/shopIntelFactsService.js buildPrompt() with promptSection().
  location:   name, rank, avgRO, bays, techs, status, manager
  technician: name, role, location, efficiency, elr, customerRating, avgJobValue, note (may be empty)
-->

## location
- {{name}}: rank #{{rank}}, avg RO ${{avgRO}}, {{bays}} bays, {{techs}} techs, status "{{status}}", manager {{manager}}

## technician
- {{name}} ({{role}}, {{location}}): efficiency {{efficiency}}%, ELR ${{elr}}, customer rating {{customerRating}}, avg job value ${{avgJobValue}}. Note: {{#if note}}{{note}}{{else}}none{{/if}}
