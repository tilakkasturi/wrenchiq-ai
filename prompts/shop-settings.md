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

## package.severity.label
Severity (High, Medium, Low) Package Estimates

## package.severity.why
How much I put in the severity package estimate. The advisor still confirms positions (front or rear), quantities and the engine before the final estimate.

## package.severity.high.label
Severity high: only what cannot wait

## package.severity.high.say
Package the customer's concern, safety maintenance and work that is part of the job. The smallest total; everything else is offered separately.

## package.severity.medium.label
Severity medium: what cannot wait, plus what protects the vehicle

## package.severity.medium.say
Package the high items plus engine-protecting maintenance, the inspection, recommended add-on labor and jobs the repair does not include (such as an alignment). Comfort and "only if needed" items are offered separately.

## package.severity.low.label
Severity low: everything recommended

## package.severity.low.say
Package every recommendation: the high and medium items plus comfort maintenance and "only if needed" or optional add-on labor. The largest total.

## parts.supplier.label
Parts supplier

## parts.supplier.why
Where I look up parts for the repair order. Asked once in Shop profile and kept in shop memory.

## parts.supplier.napa.label
NAPA

## parts.supplier.napa.say
Look up parts in the NAPA catalog for the vehicle on the repair order and put the shop pick on the RO at NAPA list price, availability first, then lowest price.

## parts.supplier.partstech.label
PartsTech

## parts.supplier.partstech.say
Open PartsTech for the vehicle on the repair order so the advisor can compare suppliers there and pick parts; the parts they pick come back to the RO at the shop's cost from that supplier. Nothing is added to the RO until the advisor picks it.
