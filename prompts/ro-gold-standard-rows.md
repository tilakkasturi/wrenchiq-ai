<!--
RO Gold Standard score: one row of the services and guidelines lists in ro-gold-standard-score.md.
Loaded by server/services/roScoreAgent.js buildPrompt() with promptSection().
  service:   name, labor, parts, status (may be empty), photos (count, 0 when none)
  guideline: id, guideline, appliesTo, whatA5LooksLike
-->

## service
- {{name}} — labor ${{labor}}, parts ${{parts}}, status: {{#if status}}{{status}}{{else}}pending{{/if}}{{#if photos}}, {{photos}} photo(s) attached{{/if}}

## guideline
{{id}}. {{guideline}} [applies to: {{appliesTo}}] — Gold Standard: {{whatA5LooksLike}}
