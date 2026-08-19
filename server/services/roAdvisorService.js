/**
 * WrenchIQ — RO Advisor Agent
 *
 * Tool-calling agent that briefs a human service advisor on a specific RO.
 * Consults customer history, shop ings/objectives, mileage-appropriate
 * services, the shop's own priced canned-job menu, and this shop's own
 * seasonal repair-job patterns — grounded in the shop's labor-rate/margin
 * profile — then produces concrete, evidence-based service recommendations
 * (canned jobs, maintenance, and seasonal recommendations) with advisor
 * talk tracks.
 *
 * Called every time an advisor selects an RO in the queue.
 *
 * Tools:
 *   get_customer_history(customerId)       — past ROs from MongoDB (fallback: demo data)
 *   get_shop_objectives(shopId)            — active ings from tribal_notes collection
 *   get_mileage_services(make, model, mileage) — standard interval services due at this mileage
 *   get_canned_jobs()                      — shop's priced canned-job menu (cannedJobsService.js)
 *   get_seasonal_trends()                  — this shop's own top repair jobs for the current
 *                                             season, from its persisted Predii Learn Shop
 *                                             Profile (shopProfileSnapshotService.js)
 *   get_tsbs(make, model, year)             — active Technical Service Bulletins for this
 *                                             exact YMM. Tries the free public NHTSA API first
 *                                             (nhtsaTsbService.js, cached in Mongo); NHTSA has
 *                                             no clean TSB-payload endpoint (confirmed against
 *                                             the live API, not just a sandbox assumption), so
 *                                             an empty/failed NHTSA result falls back to this
 *                                             repo's own curated set (src/data/tsbData.js).
 *                                             Every TSB returned is surfaced as a recommendation
 *                                             regardless of relevance to the RO's stated concern
 *                                             — see the TSB rule in buildSystemPrompt below.
 *
 * The shop profile (labor cost/hr, parts margin target — the same
 * `shop_config` values roAdvisor.js uses for marginCheck) is injected
 * directly into the system prompt as static context rather than a tool,
 * since it's small and always relevant to how recommendations are priced.
 *
 * Returns:
 *   { advisorBrief, serviceRecommendations[], ings[], alerts[], confidence, generatedAt }
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { LLM_SKIP_TOOLS } from '../config.js';
import { getCannedJobs } from './cannedJobsService.js';
import { getShopProfileSnapshot } from './shopProfileSnapshotService.js';
import { getTSBsForVehicle } from './nhtsaTsbService.js';
// NHTSA has no clean public REST endpoint for TSB payloads (the manufacturer
// Communications lookup 404s against their real API — verified live, not a
// sandbox-network assumption) — nhtsaTsbService.js fails open to [] when that
// happens, same as every other fetcher in this file. tsbData.js's curated set
// is this repo's existing, deliberate substitute (see its own header comment)
// — only reached on that empty/[] outcome, never overriding a real NHTSA hit.
import { getTSBsForVehicle as getCuratedTSBs } from '../../src/data/tsbData.js';

// ── Fallback data (used when MongoDB is unreachable) ─────────────────────────

const DEMO_NOTES_FALLBACK = [
  { note: 'Add shop supply fee ($29.95) to every RO before closing', triggerType: 'any_ro' },
  { note: 'Offer alignment check on every tire rotation', triggerType: 'any_ro' },
  { note: 'Check cabin air filter on vehicles over 25K miles — 40 units in stock', triggerType: 'mileage_range:25000-999999' },
  { note: 'Present Predii protection plan to first-time customers before checkout', triggerType: 'any_ro' },
  { note: 'Remind customer about wiper blade replacement — offer front + rear while in', triggerType: 'any_ro' },
  { note: 'Ford F-150: offer 10% off brake job — mention before presenting estimate', triggerType: 'vehicle_make:ford' },
];

// ── Data fetchers (each tolerates MongoDB failure gracefully) ─────────────────

export async function fetchCustomerHistory(customerId, db) {
  if (!db || !customerId) return [];
  try {
    const query   = { 'customer.id': customerId };
    const [ros, wqros] = await Promise.all([
      db.collection('RepairOrder')
        .find(query)
        .sort({ dateIn: -1 })
        .limit(8)
        .project({ roNumber: 1, dateIn: 1, serviceCategory: 1, repairJobs: 1, invoice: 1, dtcs: 1 })
        .toArray(),
      db.collection('wrenchiq_ro')
        .find(query)
        .sort({ date_in: -1 })
        .limit(8)
        .project({ ro_number: 1, date_in: 1, service_category: 1, repair_jobs: 1, invoice: 1 })
        .toArray(),
    ]);

    const normalize = (ro, isWQ) => ({
      roNumber:         isWQ ? ro.ro_number    : ro.roNumber,
      date:             isWQ ? ro.date_in      : ro.dateIn,
      serviceType:      isWQ ? ro.service_category : ro.serviceCategory,
      services:         isWQ
        ? (ro.repair_jobs || []).map(j => j.repair_job || j.description || '').filter(Boolean)
        : (ro.repairJobs  || []).map(j => j.description || j.name || j.service || '').filter(Boolean),
      declinedServices: [],
      totalEstimate:    typeof ro.invoice === 'number' ? ro.invoice : (ro.invoice?.total || 0),
      dtcs:             ro.dtcs || [],
    });

    const all = [
      ...ros.map(r => normalize(r, false)),
      ...wqros.map(r => normalize(r, true)),
    ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

    return all;
  } catch (err) {
    console.warn('[roAdvisor] fetchCustomerHistory error:', err.message);
    return [];
  }
}

// Walk the location_hierarchy tree upward from shopId to collect ancestor
// district/region ids, so a note scoped to a district or region (stored with
// that node's id as its shopId) is also picked up for any descendant shop.
async function fetchAncestorScopeIds(shopId, db) {
  try {
    const col  = db.collection('location_hierarchy');
    const node = await col.findOne({ id: shopId });
    const ids  = [shopId];
    let parentId = node?.parentId;
    while (parentId && !ids.includes(parentId)) {
      ids.push(parentId);
      const parent = await col.findOne({ id: parentId });
      parentId = parent?.parentId;
    }
    return ids;
  } catch {
    return [shopId];
  }
}

async function fetchShopObjectives(shopId, db) {
  if (!db) return DEMO_NOTES_FALLBACK;
  try {
    const scopeIds = await fetchAncestorScopeIds(shopId, db);
    const col  = db.collection('tribal_notes');
    const docs = await col.find({ shopId: { $in: scopeIds }, active: true }).toArray();
    return docs.length > 0 ? docs : DEMO_NOTES_FALLBACK;
  } catch {
    return DEMO_NOTES_FALLBACK;
  }
}

// Same `shop_config` collection/defaults roAdvisor.js reads for marginCheck
// (see DEFAULT_MARGIN_CONFIG there) — kept as its own fallback here so this
// agent stays self-sufficient for any caller that doesn't already have it.
const DEFAULT_SHOP_PROFILE = { laborCost: 85, partsMarginTarget: 53 };

async function fetchShopProfile(shopId, db) {
  if (!db) return DEFAULT_SHOP_PROFILE;
  try {
    const doc = await db.collection('shop_config').findOne({ shopId });
    return doc ? { ...DEFAULT_SHOP_PROFILE, ...doc } : DEFAULT_SHOP_PROFILE;
  } catch {
    return DEFAULT_SHOP_PROFILE;
  }
}

const SEASON_MONTHS = {
  Winter: [12, 1, 2],
  Spring: [3, 4, 5],
  Summer: [6, 7, 8],
  Fall:   [9, 10, 11],
};

function getCurrentSeasonName(date = new Date()) {
  const month = date.getMonth() + 1;
  return Object.keys(SEASON_MONTHS).find(name => SEASON_MONTHS[name].includes(month)) || 'Fall';
}

// seasonal_profile comes from the shop's persisted Predii Learn Shop Profile
// (PrediiLearnScreen.jsx's "Persist Shop Profile" action) — empty until an
// advisor has run that at least once for this shop, same as the fallback
// pattern for tribal_notes/canned jobs above.
async function fetchSeasonalTrends(shopId, db) {
  if (!db) return [];
  try {
    const snapshot = await getShopProfileSnapshot(db, shopId);
    return snapshot?.profile?.seasonal_profile || [];
  } catch {
    return [];
  }
}

// Reshapes a curated tsbData.js entry into the same field names the NHTSA
// path produces (nhtsaNumber/manufacturerNumber/component/summary/
// dateCommunicationSent) so executeTool/runSinglePassAgent/the system prompt
// never need to know which source a TSB came from. Labor hours and parts
// estimate are folded into the summary text itself — get_tsbs' tool
// description already tells the LLM to price a TSB off its summary/component
// when there's no canned-job match, so this is what it reads for that.
function normalizeCuratedTSB(t) {
  const partsNote = t.partsNeeded?.length ? `, parts ~$${t.partsEstimate} (${t.partsNeeded.join(', ')})` : ', no parts';
  return {
    nhtsaNumber: t.bulletinNumber,
    manufacturerNumber: t.bulletinNumber,
    component: t.component,
    summary: `${t.title}. ${t.description} Typical fix: ~${t.laborHours} labor hr${partsNote}.`,
    dateCommunicationSent: t.publishDate,
  };
}

async function fetchTSBs(make, model, year, db) {
  if (!make || !model || !year) return [];
  try {
    const live = await getTSBsForVehicle(year, make, model, db);
    if (live.length > 0) return live;
  } catch (err) {
    console.warn('[roAdvisor] fetchTSBs error:', err.message);
  }
  // Live NHTSA came back empty (or errored) — fall back to this repo's own
  // curated TSB set rather than leaving get_tsbs empty for every vehicle.
  try {
    return getCuratedTSBs(make, model, year).map(normalizeCuratedTSB);
  } catch (err) {
    console.warn('[roAdvisor] curated TSB fallback error:', err.message);
    return [];
  }
}

// Standard automotive maintenance intervals — domain knowledge, not shop logic.
// `category: 'year_round'` marks items that recur on a mileage/time interval
// year-round (e.g. oil + filter) as opposed to `'seasonal'` items tied to a
// calendar season (e.g. AC service before summer, coolant before winter).
// Lube/oil/filter jobs must always be 'year_round' — never 'seasonal' — per
// WrenchIQ Product Spec v3.0 requirement S1.
function getMileageServices(make = '', model = '', mileage = 0) {
  const services = [];
  const m = mileage;
  const mk = make.toLowerCase();

  if (m >= 3000)                        services.push({ service: 'Lube, Oil & Filter',       interval: 'every 5k-7.5k mi', estimatedCost: 55,  category: 'year_round' });
  if (m >= 3000  && m % 5000   < 3000) services.push({ service: 'Engine Air Filter',        interval: 'every 15-20k mi', estimatedCost: 45,  category: 'year_round' });
  if (m >= 15000)                       services.push({ service: 'Cabin Air Filter',          interval: 'every 15-20k mi', estimatedCost: 65,  category: 'year_round' });
  if (m >= 30000)                       services.push({ service: 'Brake Fluid Flush',         interval: 'every 30k mi',    estimatedCost: 89,  category: 'year_round' });
  if (m >= 45000)                       services.push({ service: 'Transmission Fluid Service',interval: 'every 45-60k mi', estimatedCost: 175, category: 'year_round' });
  if (m >= 50000)                       services.push({ service: 'Battery Test',              interval: '50k+ or 4 years', estimatedCost: 25,  category: 'year_round' });
  if (m >= 60000 && (mk.includes('honda') || mk.includes('acura') || mk.includes('toyota') || mk.includes('subaru')))
                                        services.push({ service: 'Timing Belt Inspection',    interval: '60-90k mi (non-chain engines)', estimatedCost: 150, category: 'year_round' });
  if (m >= 75000)                       services.push({ service: 'Spark Plugs (iridium)',     interval: '75-100k mi',      estimatedCost: 195, category: 'year_round' });
  if (m >= 80000)                       services.push({ service: 'Coolant System Flush',      interval: 'every 5 years/80k mi', estimatedCost: 130, category: 'year_round' });

  return services;
}

// ── Existing-RO-service matching (WrenchIQ Product Spec v3.0 — requirement S3) ─
//
// A recommendation must never re-flag a service that's already a line item on
// this RO. Reuses the same case-insensitive substring match convention used
// elsewhere in this codebase (see knowledgeGraph.js) so a recommendation like
// "Brake Fluid Flush" is excluded whether the RO line reads "Brake Fluid
// Flush", "Brake Fluid Flush & Bleed", or just "Brake Fluid".

function getExistingServiceNames(ro) {
  const camelCase = (ro?.services || []).map(s => (typeof s === 'string' ? s : (s?.name || s?.description || s?.service || ''))).filter(Boolean);
  const snakeCase = (ro?.repair_jobs || []).map(j => (typeof j === 'string' ? j : (j?.repair_job || j?.description || ''))).filter(Boolean);
  const repairJobsCamel = (ro?.repairJobs || []).map(j => (typeof j === 'string' ? j : (j?.description || j?.name || j?.service || ''))).filter(Boolean);
  return [...camelCase, ...snakeCase, ...repairJobsCamel].map(s => s.toLowerCase().trim()).filter(Boolean);
}

function isAlreadyOnRO(serviceName, existingNames) {
  const svc = (serviceName || '').toLowerCase().trim();
  if (!svc) return false;
  return existingNames.some(existing => existing.includes(svc) || svc.includes(existing));
}

// A shop objective/"ing" is a full sentence ("Check cabin air filter on
// vehicles over 25K miles — 40 units in stock"), not a short service name, so
// isAlreadyOnRO's plain substring check never matches it against a line item
// like "Cabin Air Filter Replacement". Stripping the generic action word off
// the existing line item first ("cabin air filter") and checking whether
// that core noun phrase appears anywhere in the ing's note text catches this
// — same pragmatic substring-match philosophy as isAlreadyOnRO, just applied
// to prose instead of a short name.
function ingAlreadyCovered(note, existingNames) {
  const text = (note || '').toLowerCase();
  if (!text) return false;
  return existingNames.some(existing => {
    const core = existing.replace(/\b(replacement|replace|service|serviced|flush|check|inspection|inspect|test|change)\b/g, '').replace(/\s+/g, ' ').trim();
    return core.length > 3 && text.includes(core);
  });
}

function filterExistingServices(result, ro) {
  if (!result) return result;
  const existingNames = getExistingServiceNames(ro);
  if (existingNames.length === 0) return result;
  return {
    ...result,
    serviceRecommendations: Array.isArray(result.serviceRecommendations)
      ? result.serviceRecommendations.filter(rec => !isAlreadyOnRO(rec.service, existingNames))
      : result.serviceRecommendations,
    // Strategic Priorities (ings) get the same "don't re-suggest what's
    // already on the RO" treatment — e.g. a standing "check cabin air filter"
    // objective must not keep surfacing once a cabin air filter job is
    // already a line item on this RO.
    ings: Array.isArray(result.ings)
      ? result.ings.filter(ing => !ingAlreadyCovered(ing.note, existingNames))
      : result.ings,
  };
}

// Matches a stray list-numbering artifact the LLM sometimes leaves behind —
// a bare "50." / "4)" marker, either on its own line or inline mid-sentence
// (e.g. "...for you. 50) to keep everything lubricated.") — from drafting
// the recommendations as a numbered list internally and having a fragment
// of that leak into the final prose. Deliberately requires a preceding
// boundary (start of string/line or whitespace after a word) so it never
// matches a real price like "$50." or a decimal like "12.5".
const STRAY_LIST_MARKER = /(^|[\s.])\d{1,3}[.)](?=\s|$)/;

// Builds a plain, deterministic customer message straight from the
// structured serviceRecommendations — used as a safety-net replacement when
// the LLM's own prose came back with a stray list-marker artifact, since at
// that point the surrounding words may also have been dropped/garbled and
// patching the string in place would still read broken.
function buildFallbackCustomerMessage(result, ro) {
  const recs = result.serviceRecommendations || [];
  const firstName = (ro.customerName || '').split(' ')[0] || 'there';
  const advisorFirstName = (ro.advisorName || '').split(' ')[0];
  const signOff = advisorFirstName ? `— ${advisorFirstName}` : '— the team';

  if (!recs.length) {
    return `Hi ${firstName}, we're taking a look at your vehicle for you. Let me know if you'd like the technician to check anything else while it's in the shop.\n\n${signOff}`;
  }

  const items = recs.map((r) => `${r.service} (${r.confidence === 'high' ? 'worth doing soon' : 'can wait until your next visit'})`);
  const itemList = items.length > 1
    ? `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
    : items[0];

  return `Hi ${firstName}, we're taking a look at ${ro.customerConcern ? `"${ro.customerConcern}"` : 'your vehicle'} for you. While we're at it, a few maintenance items are worth mentioning: ${itemList}. Let me know if you'd like the technician to take care of any of these while it's in the shop.\n\n${signOff}`;
}

function cleanCustomerMessage(result, ro) {
  if (!result || typeof result.suggestedCustomerMessage !== 'string') return result;
  if (STRAY_LIST_MARKER.test(result.suggestedCustomerMessage)) {
    console.warn('[roAdvisor] stray list-marker artifact in suggestedCustomerMessage — rebuilding from serviceRecommendations');
    return { ...result, suggestedCustomerMessage: buildFallbackCustomerMessage(result, ro) };
  }
  return result;
}

// ── Tool definitions (OpenAI format) ─────────────────────────────────────────

const RO_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_customer_history',
      description:
        'Fetch the customer\'s last 8 repair orders from the shop\'s database. ' +
        'Returns services performed, declined services, DTCs, and total spend. ' +
        'Always call this first — it tells you what the customer has had done, ' +
        'what they have deferred, and how loyal they are.',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'The customer ID from the current RO' },
        },
        required: ['customerId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_shop_objectives',
      description:
        'Fetch today\'s active shop ings and advisor reminders. ' +
        'These are set by the shop owner and include: mandatory RO items (shop supply fee), ' +
        'promotions (10% off brakes for F-150s), and inventory pushes (40 cabin filters in stock). ' +
        'Filter these against the current vehicle before surfacing them.',
      parameters: {
        type: 'object',
        properties: {
          shopId: { type: 'string', description: 'Shop ID for scoping objectives' },
        },
        required: ['shopId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_mileage_services',
      description:
        'Return standard maintenance services that are typically due at this vehicle\'s current mileage. ' +
        'Use make and model to adjust for manufacturer-specific intervals (e.g. timing belt on non-chain engines). ' +
        'Each result has a "category" (\'year_round\' for mileage/time-interval items like oil + filter, or \'seasonal\' ' +
        'for calendar-season items) and an "alreadyOnRO" flag — never recommend an item where alreadyOnRO is true. ' +
        'Cross-reference with customer history to avoid recommending something just done.',
      parameters: {
        type: 'object',
        properties: {
          make:    { type: 'string',  description: 'Vehicle make (e.g. Ford, Toyota)' },
          model:   { type: 'string',  description: 'Vehicle model (e.g. F-150, Highlander)' },
          mileage: { type: 'number',  description: 'Current odometer reading' },
        },
        required: ['mileage'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_canned_jobs',
      description:
        'Fetch this shop\'s priced canned-job menu (labor price + priced parts package per job) — ' +
        'the shop\'s real, on-file pricing, not an estimate. Each result has an "alreadyOnRO" flag — ' +
        'never recommend one where alreadyOnRO is true. When a recommendation matches one of these jobs, ' +
        'use its exact totalPrice as estimatedCost instead of guessing.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_seasonal_trends',
      description:
        'Fetch this shop\'s own historical top repair jobs for the CURRENT season (e.g. AC repairs ' +
        'spiking in summer, coolant flushes in fall), from its persisted Predii Learn Shop Profile — ' +
        'real ROs this shop has closed in that season, not a generic seasonal assumption. Use this to ' +
        'ground a "seasonal" category recommendation in this shop\'s own pattern. Each job has an ' +
        '"alreadyOnRO" flag — never recommend one where alreadyOnRO is true. Returns an empty list if ' +
        'this shop hasn\'t persisted a Shop Profile yet (Settings → Predii Learn) — in that case, fall ' +
        'back to general domain knowledge for seasonal items instead.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_tsbs',
      description:
        'Fetch active NHTSA Technical Service Bulletins (Manufacturer Communications) filed for ' +
        'this exact vehicle year/make/model — real manufacturer bulletins, not a generic guess. ' +
        'Each result has a component, a summary of the condition/fix, and an "alreadyOnRO" flag — ' +
        'never recommend one where alreadyOnRO is true. A TSB has no price on file: when it matches ' +
        'an entry from get_canned_jobs use that price, otherwise estimate labor hours/cost from the ' +
        'TSB\'s component and summary text (e.g. a software reflash is typically 0.3-1 hr, a part ' +
        'replacement follows the scope described in the summary). Cite the TSB number in the reason ' +
        'and set tsbNumber on the recommendation. Returns an empty list if NHTSA has nothing on file ' +
        'for this vehicle, or if the lookup fails — in that case simply don\'t recommend a TSB fix.',
      parameters: {
        type: 'object',
        properties: {
          make:  { type: 'string', description: 'Vehicle make (e.g. Ford, Toyota)' },
          model: { type: 'string', description: 'Vehicle model (e.g. F-150, Highlander)' },
          year:  { type: 'number', description: 'Vehicle model year' },
        },
        required: ['make', 'model', 'year'],
      },
    },
  },
];

// ── System prompt ─────────────────────────────────────────────────────────────

function buildSystemPrompt(ro, vehicle, shopName, shopProfile) {
  const vehicleStr = vehicle
    ? `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} — ${(vehicle.mileage || 0).toLocaleString()} miles`
    : 'vehicle details not available';

  const existingServiceNames = getExistingServiceNames(ro);
  const profile = shopProfile || DEFAULT_SHOP_PROFILE;

  return `You are WrenchIQ Intelligence, an AI agent briefing a human service advisor before they walk out to greet a customer.

Current RO:
  Customer: ${ro.customerName || ro.customerId || 'Unknown'}
  Vehicle:  ${vehicleStr}
  In for:   ${ro.customerConcern || ro.serviceType || 'General service'}
  DTCs:     ${(ro.dtcs || []).join(', ') || 'none'}
  Shop:     ${shopName || 'Cornerstone Auto Group'}
  Advisor:  ${ro.advisorName || 'not on file'}

Shop profile (Settings → ARO & Margin — for your situational awareness only, not something to quote to the customer):
  Labor rate:          $${profile.laborCost}/hr (the shop's internal cost basis, NOT the price billed to the customer)
  Parts margin target: ${profile.partsMarginTarget}%
Use this only to judge whether a service you're about to recommend is realistically priced for this shop — never state these numbers directly to the customer, and never treat the labor rate as a price to charge.

Line items already on this RO's job list (do NOT recommend any of these, or anything that describes the same work in different words — e.g. don't re-recommend "AC diagnostic" if "A/C System Diagnosis & Pressure Test" is already listed):
${existingServiceNames.length ? existingServiceNames.map(s => `  - ${s}`).join('\n') : '  (none)'}

Your job:
1. Call get_customer_history to understand this customer's visit history and any declined services.
2. Call get_shop_objectives to get today's active ings and promotions.
3. Call get_mileage_services to identify what's due at this vehicle's mileage.
4. Call get_canned_jobs to see the shop's real priced job menu.
5. Call get_seasonal_trends to see what's historically busy at this shop right now.
6. Call get_tsbs to check for active manufacturer Technical Service Bulletins filed for this exact vehicle year/make/model.
7. Cross-reference all six sources to produce a prioritized, non-redundant recommendation set.

Rules:
- If the customer declined a service in the last 12 months, flag it as an alert — don't recommend it as a fresh service recommendation.
- Only surface ings that apply to this specific vehicle (honor triggerType filters: vehicle_make, mileage_range, any_ro).
- Every note returned by get_shop_objectives (both noteType "ing" and noteType "objective" — including time-bound campaigns) belongs only in the "ings" output array. Never restate one as an "alerts" entry — "alerts" is reserved strictly for declined/overdue/pattern/dtc findings about this specific customer or vehicle, not shop-wide objectives or promotions.
- Talk tracks must sound natural — written in first-person for the advisor to say to the customer.
- Confidence = high if backed by specific data (declined service, exact mileage overdue), medium if mileage-based estimate.
- Service recommendations must be evidence-based — backed by the RO, customer history, mileage interval, or this shop's own seasonal pattern — covering canned jobs, maintenance recommendations, and seasonal jobs, not just incremental upsell. Keep the year_round/seasonal recommendations to the 4 most impactful — do not produce more than 4 of those two categories combined. This cap does NOT apply to category "tsb" — see the TSB rule below.
- When a recommendation matches an entry from get_canned_jobs, use that job's exact totalPrice as estimatedCost — this is the shop's real on-file price, never estimate one for something already on the menu. Only estimate a cost for items with no canned-job match (e.g. a mileage-interval item not on the menu).
- A "seasonal" recommendation should cite get_seasonal_trends data when it returns real jobs for the current season (reference the shop's own historical count in the reason) — only fall back to generic seasonal domain knowledge (e.g. AC before summer) when that tool comes back empty.
- Every TSB get_tsbs returns for this exact vehicle is real manufacturer guidance, not domain-knowledge guesswork — include ALL of them as "tsb"-category recommendations, uncapped and regardless of whether they relate to this RO's stated concern or DTCs. Do not filter a TSB out just because it's unrelated to why the car is in today — a known issue for this exact vehicle is worth surfacing on its own. If the TSB's own summary mentions a mileage/age threshold, only include it once this vehicle is at or near that point (use the "In for" mileage above); if it mentions no threshold, include it regardless of mileage. When a TSB *does* plausibly explain this RO's DTCs or concern, say so explicitly in reason and set confidence "high" instead of "medium" — otherwise phrase reason as a proactive heads-up (e.g. "known issue for this model at this mileage — not related to today's visit") and use confidence "medium". Set tsbNumber to the TSB's nhtsaNumber (fall back to manufacturerNumber if nhtsaNumber is absent) and cite the TSB number in reason (e.g. "per TSB 10214582 — reflash addresses reported MIL/P0300"). category = "tsb". Price it from get_canned_jobs if the described fix matches a menu item; otherwise estimate labor hours/cost from the TSB's own component and summary text (e.g. a software reflash is typically 0.3-1 hr labor with no parts; a component replacement follows the parts/labor scope the summary describes) — never invent a number unrelated to what the bulletin actually describes.
- NEVER recommend a service that is already a line item on the current RO (see "Line items already on this RO" above, or any due service/canned job/seasonal job/TSB flagged alreadyOnRO) — the recommendation engine must exclude anything already on this RO's job list, even if you'd word it differently.
- category = "year_round" for anything that recurs on a mileage/time interval regardless of season — this always includes oil changes, lube/oil filter service, and engine oil filter jobs. Never classify these as "seasonal" and never invent a MOTOR-sourced "Oil Service" seasonal line item. category = "seasonal" only for genuinely calendar-season-driven work (e.g. AC performance check before summer, coolant/antifreeze check before winter, or anything surfaced by get_seasonal_trends).

Gold Standard tone for suggestedCustomerMessage — this is a text/SMS the advisor sends directly to the customer, so it must read as warm and human, never salesy:
- Warm, first-name, plain language — no jargon, no exclamation-point energy.
- Reference every non-"tsb" item in serviceRecommendations by name (up to the 4 you produced) — the customer should see the full picture in this one message, not a partial teaser. A "tsb" item that's unrelated to today's concern is an internal advisor heads-up, not something to text the customer proactively — only mention a TSB here when it's the one explaining their actual concern (confidence "high" per the TSB rule above).
- For each one, give a timing suggestion in plain terms: today/now, worth scheduling soon, or fine to wait until the next visit — based on its confidence and how overdue it is. Don't invent urgency that isn't in the data.
- Explain the "why" behind each item in a short clause (root cause, not just "it's due") so the customer understands, not just complies.
- Do NOT oversell: no exclamation points, no "don't miss out," no bundling everything as equally urgent, no piling on adjectives. State each item plainly and let the customer decide. If a declined-service alert exists, do not re-push it here — that's a separate conversation.
- Frame urgency truthfully — safety issues get real urgency, everything else gets "worth doing" or "can wait" framing, never scare tactics or artificial pressure.
- Write it as flowing prose sentences, never as a numbered or bulleted list — do not include any bare list marker like "1.", "2)", etc. anywhere in the text, even mid-sentence. Weave each item into a sentence instead of enumerating it.
- State prices as estimates, and end with one easy, low-pressure way to say yes or no to all of it.
- Sign off with the advisor's actual first name from "Advisor" above (e.g. "— James"). If the advisor isn't on file, sign off as "— the team at ${shopName || 'the shop'}" instead. Never write a placeholder like "[Advisor Name]" or "[Your Name]".

Respond ONLY with valid JSON — no prose, no markdown fences. Schema:
{
  "advisorBrief": string,          // one punchy sentence the advisor reads before walking out
  "serviceRecommendations": [
    {
      "service":       string,     // service name, 3-6 words
      "reason":        string,     // why this applies — specific data point
      "estimatedCost": number,     // integer USD — exact canned-job totalPrice when matched, otherwise a reasonable estimate
      "confidence":    "high" | "medium",
      "category":      "year_round" | "seasonal" | "tsb",  // year_round for mileage/time-interval items (oil + filter, etc.); seasonal only for calendar-season work; tsb for a get_tsbs-driven fix
      "tsbNumber":     string | null,  // NHTSA/manufacturer TSB number when category is "tsb", else null
      "talkTrack":     string      // what the advisor says to the customer, first person, 2-3 sentences
    }
  ],
  "ings": [
    {
      "note":    string,           // the ing text
      "applies": boolean,          // true if relevant to this vehicle/customer
      "reason":  string            // why it applies (or why not)
    }
  ],
  "alerts": [
    {
      "type":    "declined" | "overdue" | "pattern" | "dtc",
      "message": string            // specific alert for the advisor
    }
  ],
  "suggestedCustomerMessage": string  // a ready-to-send SMS to the customer, following the Gold Standard tone rules above — references every serviceRecommendations item by name with a timing suggestion, stays plain and low-pressure, signed with the real advisor name from the RO (never a placeholder)
}`;
}

// ── Tool executor (synchronous — data pre-loaded) ─────────────────────────────

function executeTool(name, args, preloaded) {
  switch (name) {
    case 'get_customer_history':
      return {
        customerId:  args.customerId,
        historyCount: preloaded.history.length,
        visits:      preloaded.history.map(ro => ({
          date:             ro.dateIn?.toString().slice(0, 10),
          serviceType:      ro.serviceType,
          services:         (ro.services || []).map(s => s.name),
          declinedServices: ro.declinedServices || [],
          totalSpend:       ro.totalEstimate || 0,
          dtcs:             ro.dtcs || [],
        })),
      };

    case 'get_shop_objectives':
      return {
        shopId:     args.shopId,
        objectives: preloaded.objectives.map(o => ({
          note:        o.note,
          triggerType: o.triggerType || 'any_ro',
          noteType:    o.noteType    || 'ing',
        })),
      };

    case 'get_mileage_services': {
      const dueServices = getMileageServices(args.make, args.model, args.mileage);
      const existing = getExistingServiceNames(preloaded.ro);
      return {
        make:     args.make,
        model:    args.model,
        mileage:  args.mileage,
        // Flag items already on this RO so the LLM never re-recommends them
        // (WrenchIQ Product Spec v3.0 — requirement S3).
        dueServices: dueServices.map(s => ({ ...s, alreadyOnRO: isAlreadyOnRO(s.service, existing) })),
      };
    }

    case 'get_canned_jobs': {
      const existing = getExistingServiceNames(preloaded.ro);
      return {
        jobs: (preloaded.cannedJobs || []).map(j => ({
          description: j.description,
          category:    j.category,
          laborHours:  j.laborHours,
          laborCost:   j.laborCost,
          parts:       (j.parts || []).map(p => ({ description: p.description, cost: p.lineCost })),
          totalPrice:  j.totalPrice,
          // Flag items already on this RO so the LLM never re-recommends them
          // (WrenchIQ Product Spec v3.0 — requirement S3).
          alreadyOnRO: isAlreadyOnRO(j.description, existing),
        })),
      };
    }

    case 'get_seasonal_trends': {
      const existing = getExistingServiceNames(preloaded.ro);
      const seasonData = (preloaded.seasonalTrends || []).find(s => s.name === preloaded.currentSeason);
      return {
        season: preloaded.currentSeason,
        roCountThisSeasonHistorically: seasonData?.ro_count ?? 0,
        // Flag items already on this RO so the LLM never re-recommends them
        // (WrenchIQ Product Spec v3.0 — requirement S3).
        topRepairJobs: (seasonData?.top_repair_jobs || []).map(j => ({
          job:         j.job,
          count:       j.count,
          alreadyOnRO: isAlreadyOnRO(j.job, existing),
        })),
      };
    }

    case 'get_tsbs': {
      const existing = getExistingServiceNames(preloaded.ro);
      return {
        tsbs: (preloaded.tsbs || []).map(t => ({
          nhtsaNumber:        t.nhtsaNumber,
          manufacturerNumber: t.manufacturerNumber,
          component:          t.component,
          summary:            t.summary,
          dateCommunicationSent: t.dateCommunicationSent,
          // Flag if a fix already matching this TSB's component is already on
          // the RO, so the LLM never re-recommends it (WrenchIQ Product Spec
          // v3.0 — requirement S3, same convention as every other tool here).
          alreadyOnRO: isAlreadyOnRO(t.component || '', existing),
        })),
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── Single-pass fallback (for LLMs that don't support tool_calls) ─────────────

async function runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile) {
  const history    = preloaded.history.map(r => ({
    date: r.dateIn?.toString().slice(0, 10),
    services: (r.services || []).map(s => s.name),
    declined: r.declinedServices || [],
    spend: r.totalEstimate,
  }));
  const objectives = preloaded.objectives.map(o => o.note);
  const mileage    = vehicle?.mileage || 0;
  const existingServiceNames = getExistingServiceNames(ro);
  const dueServices = getMileageServices(vehicle?.make, vehicle?.model, mileage)
    .map(s => ({ ...s, alreadyOnRO: isAlreadyOnRO(s.service, existingServiceNames) }));
  const cannedJobs = (preloaded.cannedJobs || []).map(j => ({
    description: j.description,
    category:    j.category,
    totalPrice:  j.totalPrice,
    alreadyOnRO: isAlreadyOnRO(j.description, existingServiceNames),
  }));
  const currentSeason = preloaded.currentSeason;
  const seasonData = (preloaded.seasonalTrends || []).find(s => s.name === currentSeason);
  const seasonalTopJobs = (seasonData?.top_repair_jobs || []).map(j => ({
    job: j.job,
    count: j.count,
    alreadyOnRO: isAlreadyOnRO(j.job, existingServiceNames),
  }));
  const tsbs = (preloaded.tsbs || []).map(t => ({
    nhtsaNumber:        t.nhtsaNumber,
    manufacturerNumber: t.manufacturerNumber,
    component:          t.component,
    summary:            t.summary,
    alreadyOnRO:        isAlreadyOnRO(t.component || '', existingServiceNames),
  }));

  const prompt = `${buildSystemPrompt(ro, vehicle, shopName, shopProfile)}

DATA ALREADY LOADED (no tool calls needed):

Customer history (${history.length} prior visits):
${JSON.stringify(history, null, 2)}

Shop objectives/ings (active today):
${JSON.stringify(objectives, null, 2)}

Mileage-appropriate services (vehicle at ${mileage.toLocaleString()} miles):
${JSON.stringify(dueServices, null, 2)}

Shop's priced canned-job menu (use totalPrice as estimatedCost for any match):
${JSON.stringify(cannedJobs, null, 2)}

Shop's own top repair jobs for the current season (${currentSeason}, ${seasonData?.ro_count ?? 0} ROs historically — empty means no Shop Profile persisted yet, fall back to general seasonal domain knowledge):
${JSON.stringify(seasonalTopJobs, null, 2)}

Active NHTSA Technical Service Bulletins for this exact vehicle year/make/model (empty means NHTSA has nothing on file, or the vehicle year/make/model is unknown — do not invent a TSB):
${JSON.stringify(tsbs, null, 2)}

Services already on this RO (do NOT recommend any of these — see alreadyOnRO flag above and Rules):
${JSON.stringify(existingServiceNames, null, 2)}

Now produce the JSON recommendation object.`;

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content: prompt }],
    max_tokens: 1200,
    jsonMode:   true,
    _route: '/api/agent/ro-advisor',
  });

  const raw  = getTextFromResponse(data) || '{}';
  const json = raw.match(/\{[\s\S]*\}/)?.[0] || raw;
  return { result: JSON.parse(json), usage: addUsage(null, data.usage), model: data.model };
}

// ── Token usage tracking (for the Agent Trace / cost-projection UI) ──────────
//
// Accumulates prompt/completion/total tokens across every LLM call in a
// single agent run — the tool-calling loop makes one call per turn (5 tool
// rounds + 1 synthesis round is typical), so usage must be summed, not just
// read off the last response.
function addUsage(running, usage) {
  const u = usage || {};
  const base = running || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  return {
    promptTokens:     base.promptTokens     + (u.prompt_tokens     || 0),
    completionTokens: base.completionTokens + (u.completion_tokens || 0),
    totalTokens:      base.totalTokens      + (u.total_tokens      || 0),
  };
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Run the RO Advisor Agent for a specific repair order.
 *
 * @param {object} ro        - Current repair order object
 * @param {object} customer  - Customer record
 * @param {object} vehicle   - Vehicle record
 * @param {string} shopId
 * @param {object} db        - MongoDB db handle (may be null if not connected)
 * @param {object} [shopProfile] - Pre-fetched shop_config (laborCost, partsMarginTarget). If
 *   omitted (e.g. no caller has already fetched it), fetched internally so this agent stays
 *   self-sufficient. roAdvisor.js passes its own already-fetched shopConfig to avoid a duplicate query.
 * @returns {Promise<{ advisorBrief, serviceRecommendations, ings, alerts, generatedAt }>}
 */
export async function runROAdvisorAgent({ ro, customer, vehicle, shopId = 'shop-001', db, shopProfile }) {
  const customerId = customer?.id || customer?.customerId || ro?.customerId;
  const shopName   = 'Cornerstone Auto Group';

  // Story ROs store the odometer reading as `vehicle.odometer`; only the
  // Kanban-normalized `_vehicle` shape uses `mileage`. Normalize here so
  // every downstream read (system prompt, get_mileage_services) sees a
  // real number instead of silently defaulting to 0.
  vehicle = vehicle ? { ...vehicle, mileage: vehicle.mileage ?? vehicle.odometer ?? 0 } : vehicle;

  const currentSeason = getCurrentSeasonName();

  // Pre-fetch data in parallel — each is tolerant of failure
  const [history, objectives, cannedJobs, resolvedShopProfile, seasonalTrends, tsbs] = await Promise.all([
    fetchCustomerHistory(customerId, db),
    fetchShopObjectives(shopId, db),
    getCannedJobs(db, shopId),
    shopProfile ? Promise.resolve(shopProfile) : fetchShopProfile(shopId, db),
    fetchSeasonalTrends(shopId, db),
    fetchTSBs(vehicle?.make, vehicle?.model, vehicle?.year, db),
  ]);
  shopProfile = resolvedShopProfile;

  const preloaded = { history, objectives, cannedJobs, seasonalTrends, tsbs, currentSeason, ro };

  // If the LLM server doesn't support tool_calls, go straight to single-pass
  if (LLM_SKIP_TOOLS) {
    console.log('[roAdvisor] LLM_SKIP_TOOLS=true — using single-pass prompt');
    const single = await runSinglePassAgent(ro, vehicle, 'Cornerstone Auto Group', preloaded, shopProfile);
    const result = cleanCustomerMessage(filterExistingServices(single.result, ro), ro);
    return {
      ...result,
      generatedAt: new Date().toISOString(),
      dataSourced: { historyVisits: history.length, objectivesCount: objectives.length, cannedJobsCount: cannedJobs.length, seasonalTrendsAvailable: seasonalTrends.length > 0, tsbCount: tsbs.length },
      usage: single.usage,
      model: single.model,
    };
  }

  const messages = [
    {
      role:    'user',
      content: 'Analyze this repair order and produce recommendations for the service advisor.',
    },
  ];

  let result = null;
  let usage  = null;
  let model  = null;

  // Tool-calling loop (max 4 rounds)
  for (let turn = 0; turn < 4; turn++) {
    let data;
    try {
      data = await callAzureOpenAI({
        system:     buildSystemPrompt(ro, vehicle, shopName, shopProfile),
        messages,
        max_tokens: 1200,
        tools:      RO_TOOLS,
        _route:     '/api/agent/ro-advisor',
      });
    } catch (err) {
      console.warn('[roAdvisor] LLM call failed, trying single-pass fallback:', err.message);
      const single = await runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile);
      result = single.result;
      usage  = addUsage(usage, { prompt_tokens: single.usage?.promptTokens, completion_tokens: single.usage?.completionTokens, total_tokens: single.usage?.totalTokens });
      model  = model || single.model;
      break;
    }

    usage = addUsage(usage, data.usage);
    model = model || data.model;

    const choice       = data.choices?.[0];
    const finishReason = choice?.finish_reason;
    const msg          = choice?.message;

    // Append assistant turn to history
    messages.push({
      role:        'assistant',
      content:     msg?.content ?? null,
      tool_calls:  msg?.tool_calls,
    });

    if (finishReason === 'stop' || finishReason === 'length') {
      const text = msg?.content || '{}';
      const json = text.match(/\{[\s\S]*\}/)?.[0] || text;
      try {
        result = JSON.parse(json);
      } catch {
        // LLM didn't produce valid JSON — run single-pass with data injected
        const single = await runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile);
        result = single.result;
        usage  = addUsage(usage, { prompt_tokens: single.usage?.promptTokens, completion_tokens: single.usage?.completionTokens, total_tokens: single.usage?.totalTokens });
        model  = model || single.model;
      }
      break;
    }

    if (finishReason === 'tool_calls') {
      const toolCalls = msg?.tool_calls || [];
      for (const tc of toolCalls) {
        let toolArgs = {};
        try { toolArgs = JSON.parse(tc.function?.arguments || '{}'); } catch {}
        const toolResult = executeTool(tc.function?.name, toolArgs, preloaded);
        console.log(`[roAdvisor] tool: ${tc.function?.name} → ${JSON.stringify(toolResult).slice(0, 120)}`);
        messages.push({
          role:         'tool',
          tool_call_id: tc.id,
          content:      JSON.stringify(toolResult),
        });
      }
      continue;
    }

    // Unknown finish reason — fall back to single-pass
    const single = await runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile);
    result = single.result;
    usage  = addUsage(usage, { prompt_tokens: single.usage?.promptTokens, completion_tokens: single.usage?.completionTokens, total_tokens: single.usage?.totalTokens });
    model  = model || single.model;
    break;
  }

  if (!result) {
    const single = await runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile);
    result = single.result;
    usage  = addUsage(usage, { prompt_tokens: single.usage?.promptTokens, completion_tokens: single.usage?.completionTokens, total_tokens: single.usage?.totalTokens });
    model  = model || single.model;
  }

  result = cleanCustomerMessage(filterExistingServices(result, ro), ro);

  return {
    ...result,
    generatedAt:   new Date().toISOString(),
    dataSourced: {
      historyVisits:   history.length,
      objectivesCount: objectives.length,
      cannedJobsCount: cannedJobs.length,
      seasonalTrendsAvailable: seasonalTrends.length > 0,
      tsbCount: tsbs.length,
    },
    usage,
    model,
  };
}
