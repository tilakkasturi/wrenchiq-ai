<!-- Loaded by scripts/simulateDviForQueue.js via prompt('synthetic-dvi-user', { dviTemplate, vehicle, roNumber, jobs }).
     dviTemplate: the dviInspection object literal from src/data/demoData.js (text);
     vehicle: { year, make, model, mileage, vin } as strings, or null when the RO has no vehicle;
     roNumber: the RO number; jobs: the RO's repair job names joined with ", " ("" when none). -->
Structure template (real DVI fixture — for shape reference only):
{{dviTemplate}}

Now generate a synthetic DVI report for:
Vehicle: {{#if vehicle}}{{vehicle.year}} {{vehicle.make}} {{vehicle.model}}, {{vehicle.mileage}} mi, VIN {{vehicle.vin}}{{else}}unknown vehicle{{/if}}
RO: {{roNumber}}
Open repair jobs this visit: {{#if jobs}}{{jobs}}{{else}}(none listed){{/if}}
