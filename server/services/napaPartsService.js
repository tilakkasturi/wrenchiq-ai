/**
 * WrenchIQ — NAPA parts lookup for the Core assistant.
 *
 * Takes a part name as the Core assistant suggests it (e.g. "Front brake pads (set)") plus the
 * vehicle's year/make/model, and returns NAPA catalog parts that fit that vehicle with their
 * LIST price. Built on napa/searchParts.js (NAPA XML Parts Catalog Server), keeping the
 * keyword each part came from so a front-pad search does not return rear pads or rotor kits.
 *
 * Read-only: look up only. Prices are NAPA catalog list prices, not the shop's account cost,
 * and are never estimated: if NAPA does not answer or has no match, the caller gets an error
 * or an empty list, never a made-up number.
 */

import { listMakes, listModels, findKeywords, lookupPartsByKeyword } from '../../napa/searchParts.js';

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_ROWS = 8;

const cache = new Map();            // key -> { at, value }
const makeLists = new Map();          // year -> [{id, desc}]
const modelLists = new Map();         // `${year}|${makeId}` -> [{id, desc}]

export class NapaLookupError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

// Part name (as suggested in the repair order) -> NAPA search term. First match wins.
const TERMS = [
  [/brake hose/, 'brake hose'],
  [/master cylinder/, 'brake master cylinder'],
  [/pads?/, 'brake pad'],
  [/rotors?/, 'rotor'],
  [/caliper/, 'brake caliper'],
  [/strut mount/, 'strut mount'],
  [/strut/, 'strut'],
  [/end ?links?|sway/, 'sway bar link'],
  [/bearing|hub/, 'wheel bearing'],
  [/ignition coil|coil/, 'ignition coil'],
  [/spark ?plugs?/, 'spark plug'],
  [/oxygen|\bo2\b/, 'oxygen sensor'],
  [/purge|evap/, 'purge valve'],
  [/thermostat/, 'thermostat'],
  [/coolant|antifreeze/, 'antifreeze'],
  [/water pump/, 'water pump'],
  [/cooling fan/, 'engine cooling fan'],
  [/radiator$|^radiator\b/, 'radiator'],
  [/radiator hose|upper hose/, 'radiator hose'],
  [/battery cable/, 'battery cable'],
  [/battery/, 'battery'],
  [/fuel pump/, 'fuel pump'],
  [/fuel filter/, 'fuel filter'],
  [/crankshaft/, 'crankshaft position sensor'],
  [/camshaft/, 'camshaft position sensor'],
  [/mass air|\bmaf\b/, 'mass air flow sensor'],
  [/injector/, 'fuel injector'],
  [/catalytic/, 'catalytic converter'],
  [/\begr\b/, 'egr valve'],
  [/gas cap|fuel cap/, 'fuel tank cap'],
  [/ignition switch/, 'ignition switch'],
  [/starter/, 'starter'],
  [/alternator/, 'alternator'],
  [/serpentine|drive belt/, 'serpentine belt'],
  [/compressor oil/, 'compressor oil'],
  [/compressor clutch|a\/c clutch/, 'air conditioning clutch'],
  [/compressor/, 'air conditioning compressor'],
  [/condenser/, 'air conditioning condenser'],
  [/expansion valve/, 'expansion valve'],
  [/pressure switch/, 'air conditioning pressure switch'],
  [/door actuator|blend door/, 'air conditioning door actuator'],
  [/blower motor resistor|blower resistor/, 'blower motor resistor'],
  [/blower/, 'blower motor'],
  [/cabin/, 'cabin air filter'],
  [/receiver|drier/, 'receiver drier'],
  [/refrigerant/, 'refrigerant'],
  [/valve cover/, 'valve cover gasket'],
  [/oil pan/, 'oil pan gasket'],
  [/engine oil|motor oil/, 'motor oil'],
  [/wheel weight/, 'wheel weight'],
  [/hardware/, 'brake hardware'],
];

export function searchTermFor(partName) {
  const clean = String(partName).toLowerCase().replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const hit = TERMS.find(([rx]) => rx.test(clean));
  if (hit) return hit[1];
  return clean.replace(/\b(front|rear|left|right|set|kit|assembly|assemblies)\b/g, ' ').replace(/\s+/g, ' ').trim().replace(/s$/, '');
}

export function positionOf(partName) {
  const t = String(partName).toLowerCase();
  if (/\bfront\b/.test(t)) return 'front';
  if (/\brear\b/.test(t)) return 'rear';
  return null;
}

const tokens = s => String(s).toLowerCase().split(/[^a-z0-9]+/).filter(w => w.length >= 3);
const OTHER = { front: 'rear', rear: 'front' };
const PARTIAL = /\b(kit|connector|wire|boot|cap|bracket|brace|plate|tool box|manifold)\b/i;
// Catalog rows that sit under the right keyword but are accessories, not the part itself.
const ACCESSORY = /\b(connector|retaining ring|dust cap|boot|bracket|harness|pigtail|socket|adapter|cable|terminal|pulley|relay|cap|switch|resistor|fuse|clamp|hose|gasket|seal)\b/gi;
// Heavy-duty and truck-body keywords share words like "brake" and "hardware" with car parts.
const HEAVY_DUTY = /\b(air brake|truck|tool box|trailer)\b/i;
const NOTHING_FOUND = /StatusCode=2\b|No Items found|No keywords/i;

/** Pick the NAPA keyword(s) that best match the term and the front/rear position. */
export function pickKeywords(keywords, term, position) {
  const want = tokens(term);
  const scored = keywords.map(k => {
    const desc = k.KeywordDesc, d = tokens(desc), dl = desc.toLowerCase();
    let score = want.filter(w => d.some(x => x === w || x.startsWith(w) || w.startsWith(x))).length;
    if (position && new RegExp('\\b' + position + '\\b').test(dl)) score += 3;
    if (position && new RegExp('\\b' + OTHER[position] + '\\b').test(dl)) score -= 5;
    if (PARTIAL.test(desc) && !want.some(w => PARTIAL.test(w))) score -= 2;
    if (HEAVY_DUTY.test(desc)) score -= 10;
    return { k, score };
  });
  const best = Math.max(...scored.map(s => s.score), 0);
  if (best <= 0) return [];
  return scored.filter(s => s.score === best).slice(0, 2).map(s => s.k.KeywordDesc);
}

function attr(part, name) {
  const m = String(part.Attribute || '').match(new RegExp('(?:^|;)\\s*' + name + '\\s*:\\s*([^;]+)', 'i'));
  return m ? m[1].trim() : '';
}

export function toRow(part, keyword) {
  const sub = attr(part, 'Sub Brand'), brand = attr(part, 'Brand');
  return {
    supplier: 'NAPA',
    lineCode: String(part.LineCode ?? ''),
    partNumber: String(part.PartNumber ?? ''),
    description: String(part.Description ?? ''),
    brand: [brand, sub].filter(Boolean).join(' · '),
    quality: attr(part, 'Quality Level'),
    // NAPA's catalog search carries a list price for only some parts; 0 means "not in the catalog".
    listPrice: Number(part.ListPrice) > 0 ? Number(part.ListPrice) : null,
    core: Number(part.Core) || 0,
    perCarQty: Number(part.PerCarQty) || 1,
    warranty: String(part.Warranty ?? ''),
    note: String(part.Comment ?? '').replace(/@[^@]*@/g, '').replace(/\s*;\s*;/g, ';').replace(/^[\s;]+|[\s;]+$/g, ''),
    keyword,
  };
}

const norm = x => String(x).toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Pick NAPA's model entry for what the advisor typed. NAPA's names are long ("F150 1/2 Ton - Pickup",
 * "Silverado 1500 1/2 Ton", "3" for the Mazda3), so match on a normalized prefix, not equality.
 * Light-duty entries win when several share a prefix.
 */
export function matchModel(models, typed, makeName = '') {
  let q = norm(typed);
  const mk = norm(makeName);
  if (mk && q.startsWith(mk) && q.length > mk.length) q = q.slice(mk.length); // "Mazda3" -> "3"
  if (!q) return null;
  const exact = models.find(m => norm(m.desc) === q);
  if (exact) return exact;
  // The first one to three words of NAPA's name equal what was typed ("F150" in "F150 1/2 Ton - Pickup",
  // "Silverado 1500" in "Silverado 1500 1/2 Ton"), or its first word starts with it ("Transit" in "Transit-150").
  const prefix = models.filter(m => {
    const words = String(m.desc).split(/\s+/);
    for (let k = 1; k <= 3 && k <= words.length; k++) if (norm(words.slice(0, k).join(' ')) === q) return true;
    return norm(words[0]).startsWith(q);
  });
  if (!prefix.length) return null;
  const light = prefix.filter(m => /1500|1\/2 ton|\b150\b/i.test(m.desc));
  return (light.length ? light : prefix).sort((a, b) => a.desc.length - b.desc.length)[0];
}

async function resolveVehicle(year, make, model) {
  let makes = makeLists.get(year);
  if (!makes) {
    try { makes = await listMakes(year); } catch (err) {
      if (NOTHING_FOUND.test(err.message)) throw new NapaLookupError('fitment_not_found', `NAPA's catalog has no vehicles for model year ${year}.`);
      throw err;
    }
    makeLists.set(year, makes);
  }
  const mk = make.toLowerCase();
  // "Ford" and also "Ford Truck": trucks, SUVs and vans are listed under their own make.
  const candidates = makes.filter(m => m.desc.toLowerCase() === mk || m.desc.toLowerCase().startsWith(mk + ' '))
    .sort((a, b) => (a.desc.toLowerCase() === mk ? -1 : 0) - (b.desc.toLowerCase() === mk ? -1 : 0));
  if (!candidates.length) throw new NapaLookupError('fitment_not_found', `NAPA's catalog does not list a ${year} ${make}, so no part can be checked for it.`);
  for (const cand of candidates) {
    const key = `${year}|${cand.id}`;
    let models = modelLists.get(key);
    if (!models) {
      models = await listModels(year, cand.id).catch(err => (NOTHING_FOUND.test(err.message) ? [] : Promise.reject(err)));
      modelLists.set(key, models);
    }
    const hit = matchModel(models, model, cand.desc);
    if (hit) return { VehYear: year, MakeID: cand.id, ModelID: hit.id };
  }
  throw new NapaLookupError('fitment_not_found', `NAPA's catalog does not list a ${year} ${make} ${model}, so no part can be checked for it.`);
}

/**
 * @param {{year:number|string, make:string, model:string, part:string, refresh?:boolean}} q
 * @returns {Promise<{supplier:string, priceBasis:string, retrievedAt:string, cached:boolean,
 *   fit:{year:number,make:string,model:string}, part:string, term:string, keywords:string[], parts:object[]}>}
 */
export async function lookupNapaParts({ year, make, model, part, refresh = false }) {
  const y = Number(year);
  if (!y || !make || !model) throw new NapaLookupError('no_vehicle', 'Year, make and model are needed to check fitment.');
  if (!part || !String(part).trim()) throw new NapaLookupError('no_part', 'A part name is needed.');

  const term = searchTermFor(part), position = positionOf(part);
  if (term === 'gasket') throw new NapaLookupError('part_too_generic', 'Name the gasket, for example "valve cover gasket".');
  const key = [y, make, model, term, position].join('|').toLowerCase();
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.at < CACHE_TTL_MS) return { ...hit.value, cached: true };

  let vehicle;
  try { vehicle = await resolveVehicle(y, make, model); }
  catch (err) {
    if (err instanceof NapaLookupError) throw err;
    throw new NapaLookupError('napa_unavailable', `NAPA did not answer: ${err.message}`);
  }

  let keywords, rows;
  try {
    const all = await findKeywords(term, vehicle).catch(err => (NOTHING_FOUND.test(err.message) ? [] : Promise.reject(err)));
    keywords = pickKeywords(all, term, position);
    const lists = await Promise.all(keywords.map(k => lookupPartsByKeyword(k, vehicle)
      .then(ps => ps.map(p => toRow(p, k)))
      .catch(err => (NOTHING_FOUND.test(err.message) ? [] : Promise.reject(err)))));
    rows = lists.flat();
  } catch (err) {
    throw new NapaLookupError('napa_unavailable', `NAPA did not answer: ${err.message}`);
  }

  const wantsKit = /\bkit\b/i.test(part);
  const seen = new Set();
  const termWords = term.toLowerCase().split(' ').map(w => w.slice(0, 4));
  const noun = termWords[termWords.length - 1];
  rows = rows.filter(r => {
    const id = r.lineCode + '|' + r.partNumber;
    if (seen.has(id)) return false;
    seen.add(id);
    // an accessory word in the row (connector, cap, hose, gasket...) is fine only if the advisor asked for that word
    const acc = r.description.match(ACCESSORY) || [];
    if (acc.some(w => !part.toLowerCase().includes(w.toLowerCase()))) return false;
    if (!wantsKit && /\bkit\b/i.test(r.description)) return false;
    const d = r.description.toLowerCase();
    if (position && d.includes(OTHER[position]) && !d.includes(position)) return false;
    return d.includes(noun); // e.g. a pad listed under a rotor keyword is not a rotor
  });
  // NAPA files related parts under one keyword (door actuator motors under "Blower Motor"). Prefer rows
  // whose description has every word of the part name; if none do, fall back to the looser match.
  const strict = rows.filter(r => termWords.every(w => r.description.toLowerCase().includes(w)));
  // No row has every word: accept rows with at least two of the words (three-word names such as "sway bar link"), never just one.
  const loose = rows.filter(r => termWords.filter(w => r.description.toLowerCase().includes(w)).length >= Math.min(2, termWords.length));
  rows = (strict.length ? strict : loose).sort((a, b) => (a.listPrice ?? Infinity) - (b.listPrice ?? Infinity)).slice(0, MAX_ROWS);

  const value = {
    supplier: 'NAPA',
    priceBasis: 'NAPA catalog list price',
    retrievedAt: new Date().toISOString(),
    cached: false,
    fit: { year: y, make, model },
    part: String(part),
    term,
    keywords,
    parts: rows,
  };
  cache.set(key, { at: Date.now(), value });
  return value;
}
