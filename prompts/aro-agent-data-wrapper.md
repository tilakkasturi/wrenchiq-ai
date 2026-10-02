<!--
ARO Agent user message: the instructions plus the pre-fetched analytics, and the notes embedded in that data.
Loaded by server/services/aroAgentService.js (runAROAgent, buildAnalyticsViews).
Sections:
  message                      Variables: instructions (aro-agent-instructions.md), analyticsJson (views, pretty JSON)
  declined-services-note       the "note" field of the declined_services view (no variables)
  service-opportunities-note   the "note" field of the service_opportunities view (no variables)
-->

## message
{{instructions}}

DATA ALREADY LOADED (no tool calls available):

{{analyticsJson}}

Now produce the JSON analysis object.

## declined-services-note
Based on full RO history — services with the highest average revenue per visit.

## service-opportunities-note
Services with high average revenue but low frequency — best candidates for service campaigns.
