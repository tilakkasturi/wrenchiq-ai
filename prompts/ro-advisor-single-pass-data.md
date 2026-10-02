<!-- Loaded by server/services/roAdvisorService.js runSinglePassAgent() via prompt('ro-advisor-single-pass-data', vars) — the one-shot fallback for LLMs without tool_calls (and for a failed tool loop). Sent as the single user message; JSON mode.
     Vars: system (rendered ro-advisor-system), historyCount, history, objectives, mileage (formatted), dueServices, cannedJobs, season, seasonRoCount, seasonalTopJobs, tsbs, existingServiceNames (all lists are pretty-printed JSON). -->
{{system}}

DATA ALREADY LOADED (no tool calls needed):

Customer history ({{historyCount}} prior visits):
{{history}}

Shop objectives/ings (active today):
{{objectives}}

Mileage-appropriate services (vehicle at {{mileage}} miles):
{{dueServices}}

Shop's priced canned-job menu (use totalPrice as estimatedCost for any match):
{{cannedJobs}}

Shop's own top repair jobs for the current season ({{season}}, {{seasonRoCount}} ROs historically — empty means no Shop Profile persisted yet, fall back to general seasonal domain knowledge):
{{seasonalTopJobs}}

Active NHTSA Technical Service Bulletins for this exact vehicle year/make/model (empty means NHTSA has nothing on file, or the vehicle year/make/model is unknown — do not invent a TSB):
{{tsbs}}

Services already on this RO (do NOT recommend any of these — see alreadyOnRO flag above and Rules):
{{existingServiceNames}}

Now produce the JSON recommendation object.
