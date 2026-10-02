<!-- Loaded by server/services/roAdvisorService.js RO_TOOLS via promptSection('ro-advisor-tools', key). One "## tool_name" section per tool description and one "## tool_name.param" section per parameter description; the schema structure stays in code. No variables. -->

## get_customer_history
Fetch the customer's last 8 repair orders from the shop's database. Returns services performed, declined services, DTCs, and total spend. Always call this first — it tells you what the customer has had done, what they have deferred, and how loyal they are.

## get_customer_history.customerId
The customer ID from the current RO

## get_shop_objectives
Fetch today's active shop ings and advisor reminders. These are set by the shop owner and include: mandatory RO items (shop supply fee), promotions (10% off brakes for F-150s), and inventory pushes (40 cabin filters in stock). Filter these against the current vehicle before surfacing them.

## get_shop_objectives.shopId
Shop ID for scoping objectives

## get_mileage_services
Return standard maintenance services that are typically due at this vehicle's current mileage. Use make and model to adjust for manufacturer-specific intervals (e.g. timing belt on non-chain engines). Each result has a "category" ('year_round' for mileage/time-interval items like oil + filter, or 'seasonal' for calendar-season items) and an "alreadyOnRO" flag — never recommend an item where alreadyOnRO is true. Cross-reference with customer history to avoid recommending something just done.

## get_mileage_services.make
Vehicle make (e.g. Ford, Toyota)

## get_mileage_services.model
Vehicle model (e.g. F-150, Highlander)

## get_mileage_services.mileage
Current odometer reading

## get_canned_jobs
Fetch this shop's priced canned-job menu (labor price + priced parts package per job) — the shop's real, on-file pricing, not an estimate. Each result has an "alreadyOnRO" flag — never recommend one where alreadyOnRO is true. When a recommendation matches one of these jobs, use its exact totalPrice as estimatedCost instead of guessing.

## get_seasonal_trends
Fetch this shop's own historical top repair jobs for the CURRENT season (e.g. AC repairs spiking in summer, coolant flushes in fall), from its persisted Predii Learn Shop Profile — real ROs this shop has closed in that season, not a generic seasonal assumption. Use this to ground a "seasonal" category recommendation in this shop's own pattern. Each job has an "alreadyOnRO" flag — never recommend one where alreadyOnRO is true. Returns an empty list if this shop hasn't persisted a Shop Profile yet (Settings → Predii Learn) — in that case, fall back to general domain knowledge for seasonal items instead.

## get_tsbs
Fetch active NHTSA Technical Service Bulletins (Manufacturer Communications) filed for this exact vehicle year/make/model — real manufacturer bulletins, not a generic guess. Each result has a component, a summary of the condition/fix, and an "alreadyOnRO" flag — never recommend one where alreadyOnRO is true. A TSB has no price on file: when it matches an entry from get_canned_jobs use that price, otherwise estimate labor hours/cost from the TSB's component and summary text (e.g. a software reflash is typically 0.3-1 hr, a part replacement follows the scope described in the summary). Cite the TSB number in the reason and set tsbNumber on the recommendation. Returns an empty list if NHTSA has nothing on file for this vehicle, or if the lookup fails — in that case simply don't recommend a TSB fix.

## get_tsbs.make
Vehicle make (e.g. Ford, Toyota)

## get_tsbs.model
Vehicle model (e.g. F-150, Highlander)

## get_tsbs.year
Vehicle model year
