<!--
Shop settings: the label, explanation and instruction for each option. Shown in Shop profile and
returned to the Core agent as get_maintenance_due's presentation.instruction, which
core-ro-agent-system.md tells it to follow.
Loaded by src/core/shopSettings.js with promptSection(). Section keys: <setting key>.why,
<setting key>.<option>.label, <setting key>.<option>.say. No variables.
-->

## maint.presentation.why
How I present the maintenance schedule to the advisor and the customer.

## maint.presentation.label
Scheduled maintenance

## maint.presentation.prioritized.label
WrenchIQ presents what matters most

## maint.presentation.prioritized.say
Lead with the items that matter by severity (safety, then protecting the engine) and offer comfort items as optional. Do not hand the vehicle owner a long list of everything the schedule names.

## maint.presentation.all.label
Present the full schedule as is

## maint.presentation.all.say
List every item the schedule names for this milestone, in schedule order, without ranking or calling anything optional.
