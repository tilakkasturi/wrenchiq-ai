<!--
Core repair order agent: tool and parameter descriptions sent with every step.
Loaded by src/core/roTools.js (TOOL_SCHEMAS) with promptSection(). Section keys: <tool> and <tool>.<param>.
Variables: rank_repairs takes questionCatalog ("id: Option | Option; ..." from the follow-up question bank).
The schema structure (names, types, required) stays in roTools.js.
-->

## update_vehicle
Record vehicle details the advisor stated. Pass only the fields that were stated. Use this as soon as the advisor mentions the vehicle.

## update_vehicle.year
Model year, e.g. 2018

## update_vehicle.make
e.g. Toyota

## update_vehicle.model
e.g. Corolla

## update_vehicle.engine
e.g. "2.5L I4" or "3.5L V6". Include the layout (I4, V6, V8) when known: spark plugs and ignition coils are one per cylinder.

## update_vehicle.mileage
Odometer in miles, e.g. 61000 for "61k"

## update_vehicle.vin
17-character VIN

## set_concern
Record the customer's problem in their own words. Use append=true to add detail to what is already recorded.

## set_concern.symptom
The customer's complaint, e.g. 'Grinding when braking'

## set_concern.append
Add to the existing concern instead of replacing it

## rank_repairs
Match the recorded concern against the labor guide and return the likely repairs with labor hours and guide row ids, plus follow-up questions that would separate them. Optionally record answers to earlier follow-up questions. Valid question ids and option labels: {{questionCatalog}}.

## rank_repairs.answers
Map of question id to the exact option label, e.g. {"brk-where":"Front"}

## get_maintenance_due
Look up the scheduled maintenance due at the current mileage from the interval table. Needs the mileage to be recorded.

## add_repair_line
Put a repair, maintenance item or add-on labor on the repair order. Only when the advisor asks to add something. Pass the id from rank_repairs, get_maintenance_due or the Add-on labor list; if you only know what they called it, pass name. The labor-guide rules decide what actually goes on: they may use a cheaper add-on version, replace lines it covers, or refuse a duplicate. Tell the advisor what the result says.

## add_repair_line.id
Line id, e.g. "axle-asm-fwd-left"

## add_repair_line.name
The job name with spelling corrected, e.g. "right axle shaft assembly" for "rite axel", when no id is known

## search_napa_parts
Look up a part with the shop's parts supplier for the vehicle on the repair order. With NAPA it returns catalog parts with list prices; with PartsTech it opens PartsTech for the advisor to pick parts and returns no prices (supplier "PartsTech"). Needs year, make and model recorded. Call once per part.

## search_napa_parts.part
Part name as a mechanic says it, e.g. "front brake pads"
