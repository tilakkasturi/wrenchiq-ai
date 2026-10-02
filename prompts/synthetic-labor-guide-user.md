<!-- Loaded by scripts/simulateLaborGuideForQueue.js via prompt('synthetic-labor-guide-user', { laborsTemplate, vehicle, description }).
     laborsTemplate: the "## /api/labors" section of API_Request_Response_Samples.md;
     vehicle: { year, make, model, vin } as strings, or null when the RO has no vehicle;
     description: the repair job's description. -->
Structure template (/api/labors — real sample, for shape reference only):
{{laborsTemplate}}

Now generate a synthetic /api/labors response for:
Vehicle: {{#if vehicle}}{{vehicle.year}} {{vehicle.make}} {{vehicle.model}} (VIN {{vehicle.vin}}){{else}}unknown vehicle{{/if}}
Repair job: {{description}}
