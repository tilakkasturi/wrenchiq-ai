<!-- Canned task messages sent as the advisor's message from the Sidecar RO Chat "Common tasks" menu.
     Loaded by src/screens/WrenchIQSidecarScreen.jsx (buildPresetTasks) via promptSection.
     lookUpPrice: primaryService (first service on the RO, may be empty)
     lookUpSymptom: concern (customer concern, may be empty)
     talkingPoints: customerName (customer first name, may be empty) -->

## lookUpPrice
{{#if primaryService}}What's our shop's typical price for "{{primaryService}}"? Use our canned job pricing if we have one on file for it.{{else}}What's our shop's typical price for an oil change? Use our canned job pricing if we have one on file.{{/if}}

## lookUpSymptom
{{#if concern}}A customer describes this symptom: "{{concern}}". Based on our shop profile, what's the likely related repair, and do we have a canned job for it?{{else}}A customer says their car makes a grinding noise when braking. What's the likely related repair, and do we have a canned job for it?{{/if}}

## talkingPoints
Based on {{#if customerName}}{{customerName}}{{else}}this customer{{/if}}'s full visit history, give me specific talking points for my conversation with them today: any recurring issue worth mentioning, previously declined work worth re-offering, their tenure/loyalty if it's notable, and anything to watch for. Write it as short bullet points I can glance at while talking to them — not a script to read verbatim.
