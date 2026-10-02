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
import { prompt, promptSection } from './promptLoader.js';
import { LLM_SKIP_TOOLS, LLM_ENGINE } from '../config.js';
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

// customerId is NOT globally unique across every demo dataset in this repo —
// the hand-authored Cornerstone story customers (cust-001..008) collide with
// small-integer customer ids reused by the separately-seeded multi-location
// network dataset in wrenchiq_ro (different shops, different chains, often a
// different actual person). Without a shopId filter, a Cornerstone
// customer's "history" could silently include an unrelated customer's
// visits from a totally different shop — wrong service categories, wrong
// totals, sometimes even a different name. Both collection queries below
// are scoped to shopId (flat on RepairOrder, nested under shop.id on
// wrenchiq_ro) whenever the caller has one, which every real call site does.
export async function fetchCustomerHistory(customerId, db, shopId) {
  if (!db || !customerId) return [];
  try {
    const roQuery = { 'customer.id': customerId, ...(shopId ? { shopId } : {}) };
    const wqQuery = { 'customer.id': customerId, ...(shopId ? { 'shop.id': shopId } : {}) };
    const [ros, wqros] = await Promise.all([
      db.collection('RepairOrder')
        .find(roQuery)
        .sort({ dateIn: -1 })
        .limit(8)
        .project({ roNumber: 1, dateIn: 1, serviceCategory: 1, repairJobs: 1, invoice: 1, dtcs: 1 })
        .toArray(),
      db.collection('wrenchiq_ro')
        .find(wqQuery)
        .sort({ date_in: -1 })
        .limit(8)
        .project({ ro_number: 1, date_in: 1, service_category: 1, repair_jobs: 1, invoice: 1 })
        .toArray(),
    ]);

    // Falls back to summing labor + parts line costs when a record has no
    // aggregate invoice total on file (some bulk-imported records price
    // every part individually but never rolled a total up) — so a visit
    // that genuinely was priced doesn't display as $0 just because one
    // summary field is missing.
    const sumJobsCost = (jobs, isWQ) => (jobs || []).reduce((sum, j) => {
      const labor = (isWQ ? j.line_cost : j.lineCost) || 0;
      const parts = (j.parts || []).reduce((s, p) => s + ((isWQ ? p.line_cost : p.lineCost) || 0), 0);
      return sum + labor + parts;
    }, 0);

    const normalize = (ro, isWQ) => {
      const jobs = isWQ ? ro.repair_jobs : ro.repairJobs;
      const invoiceTotal = typeof ro.invoice === 'number' ? ro.invoice : ro.invoice?.total;
      return {
        roNumber:         isWQ ? ro.ro_number    : ro.roNumber,
        date:             isWQ ? ro.date_in      : ro.dateIn,
        serviceType:      isWQ ? ro.service_category : ro.serviceCategory,
        services:         (jobs || []).map(j => (isWQ ? (j.repair_job || j.description) : (j.description || j.name || j.service)) || '').filter(Boolean),
        declinedServices: [],
        totalEstimate:    typeof invoiceTotal === 'number' ? invoiceTotal : sumJobsCost(jobs, isWQ),
        dtcs:             ro.dtcs || [],
      };
    };

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
    title: t.title,
    summary: `${t.title}. ${t.description} Typical fix: ~${t.laborHours} labor hr${partsNote}.`,
    dateCommunicationSent: t.publishDate,
    // Kept as structured numbers (not just folded into summary's prose)
    // so reconcileTSBRecommendations can price a TSB recommendation
    // deterministically instead of trusting the LLM's each-run-different
    // parse of "~2.5 labor hr, parts ~$380" — see that function for why.
    // undefined for live NHTSA bulletins (normalizeTSB in
    // nhtsaTsbService.js has no such fields; real manufacturer
    // communications don't come with a clean labor/parts breakdown).
    laborHours: t.laborHours,
    partsEstimate: t.partsEstimate,
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
  if (m >= 50000)                       services.push({ service: 'Battery Test',              interval: '50k+ or 4 years', estimatedCost: 0,   category: 'year_round' });
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

// Generic action/diagnostic words stripped before comparing a recommended
// service name against a TSB's own title — same "strip the verb, compare
// the noun phrase" approach as ingAlreadyCovered above, extended with
// diagnostic-only verbs ("inspection", "diagnostic", "diagnosis", "test")
// since those are exactly the words a scope-downgrade substitutes for
// "replacement"/"repair" — the mismatch this function exists to catch.
const TSB_SCOPE_STOPWORDS = /\b(replacement|replace|repair|service|serviced|flush|check|inspection|inspect|diagnostic|diagnosis|test|performance|system|assembly)\b/g;

// Significant words only (>=4 chars) — short tokens like "ac" or "oil" are
// common enough that a substring/short-word check would call almost any two
// automotive phrases "overlapping," defeating the point of this check.
function coreWords(text) {
  return (text || '')
    .toLowerCase()
    // Strip non-alphanumerics first so formatting differences alone
    // ("A/C" vs "AC") never produce a spurious non-match.
    .replace(/[^a-z0-9\s]/g, '')
    .replace(TSB_SCOPE_STOPWORDS, '')
    .split(/\s+/)
    .filter(w => w.length >= 4);
}

// The specific downgrade observed in practice: the part/system stays right
// ("condenser") but the verb quietly shrinks from "replace" to "inspect" —
// which coreWords' noun-overlap check alone does NOT catch, since the
// shared noun ("condenser") makes the two phrases look like they overlap.
// Catches it directly: a TSB whose own title/summary specifies a concrete
// repair action, recommended under a purely diagnostic verb with no repair
// verb alongside it.
const REPAIR_SCOPE_RE = /\b(replace|replacement|repair)\b/i;
const DIAGNOSTIC_ONLY_RE = /\b(inspect|inspection|check|diagnostic|diagnosis|test|performance)\b/i;

/**
 * Corrects two failure modes observed in "tsb"-category recommendations,
 * both stemming from the same root cause: the system prompt tells the LLM
 * to "estimate labor hours/cost from the TSB's component and summary text"
 * rather than handing it a firm number, so the same TSB produces a
 * different cost on every run, and the model is free to substitute a
 * lesser diagnostic step (e.g. "AC Performance Inspection") for the fix the
 * bulletin actually specifies (e.g. TSB-20-009's condenser *replacement*) —
 * technically still "citing" the TSB, but misrepresenting what it says.
 *
 * Both are fixed the same way the codebase already fixes margin/ARO
 * numbers: deterministically, from the same source data the tool result
 * exposed to the model, rather than trusting LLM arithmetic or LLM fidelity
 * for something the code can just compute or check directly. Only applies
 * when the matched TSB carries structured laborHours/partsEstimate — i.e.
 * this repo's curated fallback set (src/data/tsbData.js). Live NHTSA
 * bulletins have no such numbers, so those recommendations are left as the
 * LLM priced/scoped them (nothing to reconcile against).
 */
function reconcileTSBRecommendations(result, tsbs, shopProfile) {
  if (!result || !Array.isArray(result.serviceRecommendations)) return result;
  const laborCost = shopProfile?.laborCost ?? DEFAULT_SHOP_PROFILE.laborCost;
  const matchedTsbs = []; // curated TSBs actually matched to a rec, for the dedup pass below

  const priced = result.serviceRecommendations.map(rec => {
    if (rec.category !== 'tsb' || !rec.tsbNumber) return rec;
    const tsb = tsbs.find(t => t.nhtsaNumber === rec.tsbNumber || t.manufacturerNumber === rec.tsbNumber);
    if (!tsb || typeof tsb.laborHours !== 'number' || typeof tsb.partsEstimate !== 'number') return rec;
    matchedTsbs.push(tsb);

    const estimatedCost = Math.round(tsb.laborHours * laborCost + tsb.partsEstimate);

    // Two independent ways a recommendation can misrepresent its own cited
    // TSB: (a) topic drift — no significant word in common with the TSB's
    // title at all — or (b) same part, downgraded verb — "Condenser
    // Inspection" for a TSB whose fix is a condenser *replacement*, which
    // (a) alone misses because "condenser" is still shared between the two.
    const titleWords = coreWords(tsb.title);
    const serviceWords = new Set(coreWords(rec.service));
    const noSharedTopic = titleWords.length > 0 && !titleWords.some(w => serviceWords.has(w));

    const tsbSpecifiesRepair = REPAIR_SCOPE_RE.test(tsb.title || '') || REPAIR_SCOPE_RE.test(tsb.summary || '');
    const downgradedToDiagnosticOnly = DIAGNOSTIC_ONLY_RE.test(rec.service) && !REPAIR_SCOPE_RE.test(rec.service);

    const scopeMismatch = noSharedTopic || (tsbSpecifiesRepair && downgradedToDiagnosticOnly);

    return {
      ...rec,
      estimatedCost,
      ...(scopeMismatch ? { service: tsb.title } : {}),
    };
  });

  // Deterministic backstop for the system prompt's "don't double-recommend
  // your own overlapping work" rule — the model complies inconsistently
  // (observed: present in roughly half of otherwise-identical runs against
  // Frank Delgado/TSB-20-009), because judging semantic overlap between two
  // free-text recommendations is exactly the kind of thing sampling
  // variance affects. Narrow and literal on purpose: only fires when a
  // curated TSB's own fix text and another recommendation's service name
  // both say "recharge" — the specific, demonstrated failure signature
  // (a condenser-replacement TSB's built-in "evacuate/recharge" step vs. a
  // separately-recommended "A/C recharge" seasonal item) — rather than a
  // broad same-system heuristic that would risk dropping genuinely
  // distinct AC-adjacent work.
  const tsbTextMentionsRecharge = matchedTsbs.some(t => /recharge/i.test(t.summary || ''));
  const serviceRecommendations = tsbTextMentionsRecharge
    ? priced.filter(rec => rec.category === 'tsb' || !/recharge/i.test(rec.service || ''))
    : priced;

  return { ...result, serviceRecommendations };
}

// Catches the shop-objective equivalent of the TSB pricing bug: a "tribal
// knowledge" note that embeds a dollar threshold in its own text (e.g.
// "Follow up within 24 hours on any estimate over $1,500") is a plain
// numeric comparison against ro.totalEstimate — a number the code already
// has — not something that needs an LLM to read and compare. Observed
// wrong in practice: a $2,314 RO evaluated against this exact $1,500 rule
// came back applies:false with reason "Current estimate is likely below
// this threshold," which is simply false, not a judgment call the model
// got right or wrong on a coin flip — the number was sitting right there.
// Deliberately narrow (only fires when the note actually names a dollar
// figure next to one of these comparison words) so it never overrides a
// genuinely qualitative objective the LLM is better positioned to judge.
const DOLLAR_THRESHOLD_RE = /\b(?:over|above|exceed(?:s|ing)?|more than)\s*\$([\d,]+(?:\.\d{1,2})?)/i;

function reconcileDollarThresholdIngs(result, ro) {
  if (!result || !Array.isArray(result.ings)) return result;
  const totalEstimate = ro?.totalEstimate || 0;

  const ings = result.ings.map(ing => {
    const match = DOLLAR_THRESHOLD_RE.exec(ing.note || '');
    const threshold = match ? parseFloat(match[1].replace(/,/g, '')) : NaN;
    if (!Number.isFinite(threshold)) return ing;

    const applies = totalEstimate > threshold;
    return {
      ...ing,
      applies,
      reason: applies
        ? `This RO's current estimate ($${totalEstimate.toLocaleString()}) is over the $${threshold.toLocaleString()} threshold.`
        : `This RO's current estimate ($${totalEstimate.toLocaleString()}) is at or below the $${threshold.toLocaleString()} threshold.`,
    };
  });

  return { ...result, ings };
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

// Structure here, wording in prompts/ro-advisor-tools.md ("## tool" and "## tool.param" sections).
const toolText = key => promptSection('ro-advisor-tools', key);

function roTool(name, properties = {}, required) {
  return {
    type: 'function',
    function: {
      name,
      description: toolText(name),
      parameters: {
        type: 'object',
        properties: Object.fromEntries(Object.entries(properties).map(([param, type]) =>
          [param, { type, description: toolText(`${name}.${param}`) }])),
        ...(required ? { required } : {}),
      },
    },
  };
}

export const RO_TOOLS = [
  roTool('get_customer_history', { customerId: 'string' }, ['customerId']),
  roTool('get_shop_objectives',  { shopId: 'string' }, ['shopId']),
  roTool('get_mileage_services', { make: 'string', model: 'string', mileage: 'number' }, ['mileage']),
  roTool('get_canned_jobs'),
  roTool('get_seasonal_trends'),
  roTool('get_tsbs',             { make: 'string', model: 'string', year: 'number' }, ['make', 'model', 'year']),
];

// ── System prompt ─────────────────────────────────────────────────────────────

export function buildSystemPrompt(ro, vehicle, shopName, shopProfile) {
  const existingServiceNames = getExistingServiceNames(ro);
  const profile = shopProfile || DEFAULT_SHOP_PROFILE;

  return prompt('ro-advisor-system', systemPromptVars({
    customer:    ro.customerName || ro.customerId,
    vehicle:     vehicle && { year: vehicle.year, make: vehicle.make, model: vehicle.model, mileage: vehicle.mileage || 0 },
    inFor:       ro.customerConcern || ro.serviceType,
    dtcs:        ro.dtcs,
    shopName,
    advisorName: ro.advisorName,
    laborCost:   profile.laborCost,
    partsMarginTarget: profile.partsMarginTarget,
    existingServiceNames,
  }));
}

/**
 * The variables prompts/ro-advisor-system.md takes, from plain values. Missing values become ''
 * so the prompt file's {{else}} fallbacks apply. WrenchIQSidecarScreen.jsx's read-only prompt
 * view (buildDisplaySystemPrompt) builds the same shapes — keep the two in step.
 */
function systemPromptVars({ customer, vehicle, inFor, dtcs, shopName, advisorName, laborCost, partsMarginTarget, existingServiceNames }) {
  return {
    customer:    customer || '',
    vehicle:     vehicle
      ? { year: vehicle.year || '', make: vehicle.make || '', model: vehicle.model || '', miles: (vehicle.mileage || 0).toLocaleString() }
      : null,
    inFor:       inFor || '',
    dtcs:        (dtcs || []).join(', '),
    shopName:    shopName || '',
    advisorName: advisorName || '',
    laborCost:   `${laborCost}`,
    partsMarginTarget: `${partsMarginTarget}`,
    existingServices: (existingServiceNames || []).map(s => `  - ${s}`).join('\n'),
  };
}

// ── Tool executor (synchronous — data pre-loaded) ─────────────────────────────

export function executeTool(name, args, preloaded) {
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
          title:              t.title,
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

  const singlePassPrompt = prompt('ro-advisor-single-pass-data', {
    system:          buildSystemPrompt(ro, vehicle, shopName, shopProfile),
    historyCount:    history.length,
    history:         JSON.stringify(history, null, 2),
    objectives:      JSON.stringify(objectives, null, 2),
    mileage:         mileage.toLocaleString(),
    dueServices:     JSON.stringify(dueServices, null, 2),
    cannedJobs:      JSON.stringify(cannedJobs, null, 2),
    season:          `${currentSeason}`,
    seasonRoCount:   seasonData?.ro_count ?? 0,
    seasonalTopJobs: JSON.stringify(seasonalTopJobs, null, 2),
    tsbs:            JSON.stringify(tsbs, null, 2),
    existingServiceNames: JSON.stringify(existingServiceNames, null, 2),
  });

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content: singlePassPrompt }],
    // See the matching comment on the tool-loop call above — reasoning
    // models need headroom beyond the visible JSON for hidden chain-of-thought.
    max_tokens: 3000,
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
export function addUsage(running, usage) {
  const u = usage || {};
  const base = running || { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  return {
    promptTokens:     base.promptTokens     + (u.prompt_tokens     || 0),
    completionTokens: base.completionTokens + (u.completion_tokens || 0),
    totalTokens:      base.totalTokens      + (u.total_tokens      || 0),
  };
}

// ── Shared setup and teardown (both runtimes) ────────────────────────────────

const SHOP_NAME = 'Cornerstone Auto Group';

/**
 * Everything both runtimes need before the first LLM call: a normalized vehicle,
 * a resolved shop profile, and the pre-fetched bundle executeTool reads.
 *
 * @returns {Promise<{ vehicle: object, shopProfile: object, preloaded: object }>}
 */
async function preloadAdvisorContext({ ro, customer, vehicle, shopId = 'shop-001', db, shopProfile }) {
  const customerId = customer?.id || customer?.customerId || ro?.customerId;

  // Story ROs store the odometer reading as `vehicle.odometer`; only the
  // Kanban-normalized `_vehicle` shape uses `mileage`. Normalize here so
  // every downstream read (system prompt, get_mileage_services) sees a
  // real number instead of silently defaulting to 0.
  const normalizedVehicle = vehicle
    ? { ...vehicle, mileage: vehicle.mileage ?? vehicle.odometer ?? 0 }
    : vehicle;

  const currentSeason = getCurrentSeasonName();

  // Pre-fetch data in parallel — each is tolerant of failure
  const [history, objectives, cannedJobs, resolvedShopProfile, seasonalTrends, tsbs] = await Promise.all([
    fetchCustomerHistory(customerId, db, shopId),
    fetchShopObjectives(shopId, db),
    getCannedJobs(db, shopId),
    shopProfile ? Promise.resolve(shopProfile) : fetchShopProfile(shopId, db),
    fetchSeasonalTrends(shopId, db),
    fetchTSBs(normalizedVehicle?.make, normalizedVehicle?.model, normalizedVehicle?.year, db),
  ]);

  return {
    vehicle: normalizedVehicle,
    shopProfile: resolvedShopProfile,
    preloaded: { history, objectives, cannedJobs, seasonalTrends, tsbs, currentSeason, ro },
  };
}

/**
 * Shape a raw LLM result into the response envelope every caller depends on.
 *
 * WrenchIQSidecarScreen.jsx reads every field here — its Agent Trace tab prices
 * off `usage.promptTokens`/`usage.completionTokens`/`model` and renders the five
 * `dataSourced` counters — so this is the contract, not a convenience.
 */
function finishAdvisorResult(result, ro, preloaded, usage, model, shopProfile) {
  const reconciled = reconcileDollarThresholdIngs(reconcileTSBRecommendations(result, preloaded.tsbs, shopProfile), ro);
  const cleaned = cleanCustomerMessage(filterExistingServices(reconciled, ro), ro);

  return {
    ...cleaned,
    generatedAt: new Date().toISOString(),
    dataSourced: {
      historyVisits:           preloaded.history.length,
      objectivesCount:         preloaded.objectives.length,
      cannedJobsCount:         preloaded.cannedJobs.length,
      seasonalTrendsAvailable: preloaded.seasonalTrends.length > 0,
      tsbCount:                preloaded.tsbs.length,
    },
    // Full bulletin data for every TSB get_tsbs fetched for this vehicle —
    // not just the ones that became a "tsb"-category recommendation. The
    // LLM only ever sees `summary` (a prose string); this is the same
    // underlying data with the fields the client needs to render a
    // "View bulletin" popup kept as separate fields rather than re-parsed
    // out of that prose. pdfUrl is only ever populated for live
    // NHTSA-sourced bulletins (nhtsaTsbService.js's documents[].pdfUrl) —
    // curated bulletins (src/data/tsbData.js) have no real external
    // document, so this repo never fabricates one for them.
    tsbReferences: (preloaded.tsbs || []).map(t => ({
      tsbNumber:             t.nhtsaNumber || t.manufacturerNumber,
      title:                 t.title || null,
      summary:               t.summary,
      component:             t.component,
      dateCommunicationSent: t.dateCommunicationSent,
      pdfUrl:                t.documents?.[0]?.pdfUrl || null,
    })),
    usage,
    model,
  };
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Run the RO Advisor Agent for a specific repair order.
 *
 * Dispatches on LLM_ENGINE: runLangChainROAdvisorAgent by default, or the
 * hand-rolled tool loop below when the flag selects 'loop' as a rollback.
 * Both produce the same envelope — see config.js.
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
export async function runROAdvisorAgent(opts) {
  if (LLM_ENGINE === 'langchain') return runLangChainROAdvisorAgent(opts);

  const { ro } = opts;
  const shopName = SHOP_NAME;
  const { vehicle, shopProfile, preloaded } = await preloadAdvisorContext(opts);

  // If the LLM server doesn't support tool_calls, go straight to single-pass
  if (LLM_SKIP_TOOLS) {
    console.log('[roAdvisor] LLM_SKIP_TOOLS=true — using single-pass prompt');
    const single = await runSinglePassAgent(ro, vehicle, shopName, preloaded, shopProfile);
    return finishAdvisorResult(single.result, ro, preloaded, single.usage, single.model, shopProfile);
  }

  const messages = [
    {
      role:    'user',
      content: prompt('ro-advisor-kickoff'),
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
        // Reasoning models (e.g. Qwen3 thinking mode on sglang) spend part of
        // this budget on hidden chain-of-thought before writing any visible
        // content — 1200 was tuned against non-reasoning models (gemma/vLLM)
        // and left the post-tool-calls synthesis turn truncated (finish_reason
        // "length", empty content) on a reasoning model, silently dropping
        // advisorBrief/serviceRecommendations. See ROBUST_RESULT check below
        // for the defense-in-depth half of this fix.
        max_tokens: 3000,
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
      let parsed = null;
      try {
        parsed = JSON.parse(json);
      } catch {
        // fall through to the single-pass fallback below via parsed === null
      }
      // A reasoning model that gets truncated mid-thought (finish_reason
      // "length" with empty visible content — see max_tokens comment above)
      // parses successfully as "{}", which is valid JSON but not a usable
      // result: treat "no advisorBrief and no serviceRecommendations" the
      // same as a parse failure rather than silently returning an empty
      // brief to the advisor.
      const usable = parsed && (parsed.advisorBrief || (parsed.serviceRecommendations || []).length > 0);
      if (usable) {
        result = parsed;
      } else {
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

  return finishAdvisorResult(result, ro, preloaded, usage, model, shopProfile);
}

/**
 * Run the RO Advisor Agent with the tool loop driven by LangChain's createAgent
 * instead of the hand-rolled loop above — same tools, same prompt, same
 * envelope. Selected by default (LLM_ENGINE=langchain); LLM_ENGINE=loop
 * selects the hand-rolled loop above instead.
 *
 * Takes the same arguments and honours the same LLM_SKIP_TOOLS short-circuit and
 * single-pass fallback, so it is a drop-in substitute rather than a variant.
 * See roAdvisorLangChainAgent.js for the loop itself and its known divergences.
 *
 * @param {object} opts - Identical to runROAdvisorAgent.
 */
export async function runLangChainROAdvisorAgent(opts) {
  const { ro } = opts;
  const { vehicle, shopProfile, preloaded } = await preloadAdvisorContext(opts);

  if (LLM_SKIP_TOOLS) {
    console.log('[roAdvisor] LLM_SKIP_TOOLS=true — using single-pass prompt');
    const single = await runSinglePassAgent(ro, vehicle, SHOP_NAME, preloaded, shopProfile);
    return finishAdvisorResult(single.result, ro, preloaded, single.usage, single.model, shopProfile);
  }

  // Imported lazily so the default path never loads langchain/langgraph at all.
  const { runCreateAgentLoop } = await import('./roAdvisorLangChainAgent.js');

  const run = await runCreateAgentLoop({
    system: buildSystemPrompt(ro, vehicle, SHOP_NAME, shopProfile),
    preloaded,
  });

  if (run.result) {
    return finishAdvisorResult(run.result, ro, preloaded, run.usage, run.model, shopProfile);
  }

  // No parseable JSON — same degradation as the hand-rolled loop, and the tokens
  // the failed run already spent are carried into the total rather than dropped.
  const single = await runSinglePassAgent(ro, vehicle, SHOP_NAME, preloaded, shopProfile);
  const usage = addUsage(run.usage, {
    prompt_tokens:     single.usage?.promptTokens,
    completion_tokens: single.usage?.completionTokens,
    total_tokens:      single.usage?.totalTokens,
  });
  return finishAdvisorResult(single.result, ro, preloaded, usage, run.model || single.model, shopProfile);
}
