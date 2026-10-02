<!-- Loaded by server/services/threeCScoreService.js formatContext() via prompt('three-c-context', vars); embedded as {{context}} in three-c-score, three-c-rewrite and three-c-grounding-check.
     Vars: vehicle ("year make model", '' when unknown), hasDtcs, dtcs (comma-joined, '' when none), services (comma-joined, '' when none), concern, diagnosis, correction. -->
Vehicle:    {{#if vehicle}}{{vehicle}}{{else}}unknown vehicle{{/if}}
DTCs on file: {{#if hasDtcs}}{{dtcs}}{{else}}none on file{{/if}}
Services on RO: {{#if services}}{{services}}{{else}}none listed{{/if}}

Complaint (as written): {{#if concern}}{{concern}}{{else}}not recorded{{/if}}
Cause (as written):     {{#if diagnosis}}{{diagnosis}}{{else}}not recorded{{/if}}
Correction (as written): {{#if correction}}{{correction}}{{else}}not recorded{{/if}}
