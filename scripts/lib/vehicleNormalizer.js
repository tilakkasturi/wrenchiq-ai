/**
 * Predii VCdb Vehicle Normalizer
 *
 * Resolves raw year/make/model text from repair order source data into
 * canonical AutoCare VCdb IDs (BaseVehicleID, VehicleID, EngineBaseID).
 *
 * Data source: AutoCare VCdb NA LDPS — pipe-delimited flat files.
 * Default snapshot: 20260226 (latest available).
 *
 * Matching pipeline (per field):
 *   Make  → 1) alias table  2) exact lowercase  3) token-overlap Jaccard ≥ 0.50
 *   Model → 1) exact lowercase (within resolved make)  2) token-overlap F1 ≥ 0.45
 *   Year  → direct integer match (YearID = calendar year in VCdb)
 *
 * Because source ROs carry no engine field, the normalizer returns
 * possible_engine_configs[] — all engine options for the resolved vehicle(s).
 * When actual engine data is available, callers can filter this list.
 *
 * TODO(predii-api): Replace this entire module with:
 *   POST /v1/normalize/ymm { year, make, model } → { base_vehicle_id, vehicle_ids, ... }
 *   The local implementation is a faithful fallback for offline/demo use.
 *
 * Usage:
 *   import { loadVCdb, normalize } from './lib/vehicleNormalizer.js';
 *   const vcdb = await loadVCdb('/path/to/vcdb', '20260226');
 *   const result = normalize(2019, 'LINCOLN', 'NAUTILUS', vcdb);
 */

import { readFileSync, readdirSync } from 'fs';
import { join }                       from 'path';

// ── Constants ─────────────────────────────────────────────────────────────────

const VCDB_DEFAULT_DIR    = '/opt/predii/external-resources/rawdata/AutoCare_VCdb_NA_LDPS_enUS_ASCII_Current';
const VCDB_DEFAULT_PREFIX = '20260226';

/** Common make name aliases from raw source data → canonical VCdb MakeName */
const MAKE_ALIASES = {
  'chevy':        'Chevrolet',
  'chev':         'Chevrolet',
  'vw':           'Volkswagen',
  'vw/audi':      'Volkswagen',
  'mercedes':     'Mercedes-Benz',
  'mercedes benz':'Mercedes-Benz',
  'mb':           'Mercedes-Benz',
  'benz':         'Mercedes-Benz',
  'land rover':   'Land Rover',
  'landrover':    'Land Rover',
  'range rover':  'Land Rover',
  'alfa':         'Alfa Romeo',
  'alfa romeo':   'Alfa Romeo',
  'infinity':     'Infiniti',
  'caddy':        'Cadillac',
  'cadi':         'Cadillac',
  'olds':         'Oldsmobile',
  'oldsmobile':   'Oldsmobile',
  'saturn':       'Saturn',
  'pontiac':      'Pontiac',
  'ram':          'Ram',
  'dodge ram':    'Ram',
  'isuzu':        'Isuzu',
  'scion':        'Scion',
  'genesis':      'Genesis',
  'rivian':       'Rivian',
  'lucid':        'Lucid',
  'polestar':     'Polestar',
};

const STOP_WORDS = new Set(['a','an','the','and','or','of','with','for','by','in','on','to']);

// ── Vehicle origin classification ─────────────────────────────────────────────
const JAPANESE_MAKES = new Set([
  'Toyota','Honda','Nissan','Mazda','Subaru','Mitsubishi','Lexus','Acura','Infiniti','Scion','Isuzu',
]);
const GERMAN_MAKES = new Set([
  'BMW','Mercedes-Benz','Audi','Volkswagen','Porsche','Opel','Smart',
]);

// ── Text utilities ────────────────────────────────────────────────────────────

function tokenize(str) {
  if (!str) return [];
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0 && !STOP_WORDS.has(t));
}

/** F1 of coverage × precision with prefix bonus (min 3 chars). */
function tokenF1(queryToks, candidateToks) {
  if (!queryToks.length || !candidateToks.length) return 0;
  const qSet = new Set(queryToks);
  let covHits = 0;
  for (const ct of candidateToks) {
    if (qSet.has(ct) || queryToks.some(qt =>
        (qt.length >= 3 && ct.startsWith(qt)) || (ct.length >= 3 && qt.startsWith(ct)))) {
      covHits++;
    }
  }
  const cov  = covHits / candidateToks.length;
  const cSet = new Set(candidateToks);
  let precHits = 0;
  for (const qt of queryToks) {
    if (cSet.has(qt) || candidateToks.some(ct =>
        (qt.length >= 3 && ct.startsWith(qt)) || (ct.length >= 3 && qt.startsWith(ct)))) {
      precHits++;
    }
  }
  const prec = precHits / queryToks.length;
  if (cov + prec === 0) return 0;
  return 2 * cov * prec / (cov + prec);
}

// ── File loading ──────────────────────────────────────────────────────────────

function parsePipe(filePath) {
  const raw  = readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  if (!lines.length) return [];
  const header = lines[0].replace(/\r$/, '').split('|');
  const rows   = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, '').trim();
    if (!line) continue;
    const cols = line.split('|');
    const obj  = {};
    for (let j = 0; j < header.length; j++) obj[header[j]] = cols[j] ?? '';
    rows.push(obj);
  }
  return rows;
}

function filePath(dir, prefix, table) {
  return join(dir, `${prefix}_${table}.txt`);
}

/**
 * Classify a canonical make name into vehicle origin category.
 * Used for ELR bucketing and tech specialization matching.
 *
 * @param {string} make - normalized make name (output of resolveMake)
 * @returns {'JAPANESE'|'GERMAN'|'DOMESTIC_US'|'OTHER'}
 */
export function vehicleOrigin(make) {
  if (!make) return 'OTHER';
  if (JAPANESE_MAKES.has(make)) return 'JAPANESE';
  if (GERMAN_MAKES.has(make))   return 'GERMAN';
  if (['Ford','Chevrolet','GMC','Dodge','Ram','Jeep','Chrysler','Cadillac',
       'Buick','Lincoln','Tesla','Rivian','Lucid','Pontiac','Oldsmobile',
       'Saturn','Hummer','Saturn'].includes(make)) return 'DOMESTIC_US';
  return 'OTHER';
}

/** Auto-detect the most recent date prefix in a VCdb directory. */
export function detectLatestPrefix(dir) {
  try {
    const files   = readdirSync(dir);
    const prefixes = [...new Set(files.map(f => f.split('_')[0]))].filter(p => /^\d{8}$/.test(p));
    return prefixes.sort().at(-1) ?? VCDB_DEFAULT_PREFIX;
  } catch {
    return VCDB_DEFAULT_PREFIX;
  }
}

// ── Loader ────────────────────────────────────────────────────────────────────

/**
 * Load VCdb tables from flat files and build in-memory indexes.
 * Call once at script startup; the returned object is passed to normalize().
 *
 * @param {string} dir      - Path to VCdb directory (pipe-delimited files)
 * @param {string} [prefix] - Date prefix e.g. '20260226'. Auto-detected if omitted.
 */
export async function loadVCdb(dir = VCDB_DEFAULT_DIR, prefix) {
  const pfx = prefix ?? detectLatestPrefix(dir);
  process.stdout.write(`  Loading VCdb (${pfx}) from ${dir}...\n`);

  // ── Load raw tables ───────────────────────────────────────────────────────
  const makeRows    = parsePipe(filePath(dir, pfx, 'Make'));
  const modelRows   = parsePipe(filePath(dir, pfx, 'Model'));
  const bvRows      = parsePipe(filePath(dir, pfx, 'BaseVehicle'));
  const vehRows     = parsePipe(filePath(dir, pfx, 'Vehicle'));
  const engBaseRows = parsePipe(filePath(dir, pfx, 'EngineBase'));
  const engCfgRows  = parsePipe(filePath(dir, pfx, 'EngineConfig'));
  const vtecRows    = parsePipe(filePath(dir, pfx, 'VehicleToEngineConfig'));

  process.stdout.write(
    `  Rows: ${makeRows.length} makes, ${modelRows.length} models, ` +
    `${bvRows.length} baseVehicles, ${vehRows.length} vehicles, ` +
    `${engBaseRows.length} engineBases\n`
  );

  // ── Make indexes ──────────────────────────────────────────────────────────
  const makeById   = new Map();   // MakeID(int) → MakeName
  const makeByName = new Map();   // normalized name → MakeID
  const makeTokens = [];          // [{ id, name, toks }] for fuzzy fallback

  for (const r of makeRows) {
    const id   = parseInt(r.MakeID);
    const name = r.MakeName.trim();
    makeById.set(id, name);
    makeByName.set(name.toLowerCase(), id);
    makeTokens.push({ id, name, toks: tokenize(name) });
  }

  // ── Model indexes ─────────────────────────────────────────────────────────
  const modelById   = new Map();  // ModelID(int) → { name, vehicleTypeID }
  const modelByName = new Map();  // normalized name → [ModelID, ...]
  const modelTokens = [];         // for fuzzy fallback

  for (const r of modelRows) {
    const id  = parseInt(r.ModelID);
    const name = r.ModelName.trim();
    modelById.set(id, { name, vehicleTypeID: parseInt(r.VehicleTypeID) });
    const key = name.toLowerCase();
    if (!modelByName.has(key)) modelByName.set(key, []);
    modelByName.get(key).push(id);
    modelTokens.push({ id, name, toks: tokenize(name) });
  }

  // ── BaseVehicle: (year, makeID, modelID) → BaseVehicleID ─────────────────
  const bvByKey  = new Map();   // `${year}_${makeID}_${modelID}` → BaseVehicleID
  const bvById   = new Map();   // BaseVehicleID → { year, makeID, modelID }
  // makeID → Set<ModelID> that have at least one BaseVehicle entry
  const makeModelIds = new Map();

  for (const r of bvRows) {
    const bvId    = parseInt(r.BaseVehicleID);
    const year    = parseInt(r.YearID);
    const makeId  = parseInt(r.MakeID);
    const modelId = parseInt(r.ModelID);
    const key     = `${year}_${makeId}_${modelId}`;
    bvByKey.set(key, bvId);
    bvById.set(bvId, { year, makeId, modelId });
    if (!makeModelIds.has(makeId)) makeModelIds.set(makeId, new Set());
    makeModelIds.get(makeId).add(modelId);
  }

  // ── Vehicle: BaseVehicleID → [VehicleID, ...] ────────────────────────────
  const vehByBase = new Map();  // BaseVehicleID → [VehicleID, ...]

  for (const r of vehRows) {
    const vid  = parseInt(r.VehicleID);
    const bvId = parseInt(r.BaseVehicleID);
    if (!vehByBase.has(bvId)) vehByBase.set(bvId, []);
    vehByBase.get(bvId).push(vid);
  }

  // ── EngineBase ────────────────────────────────────────────────────────────
  const engBaseById = new Map();  // EngineBaseID → { liter, cylinders, blockType }
  for (const r of engBaseRows) {
    const id = parseInt(r.EngineBaseID);
    engBaseById.set(id, {
      engine_base_id: id,
      liter:          parseFloat(r.Liter)     || null,
      cylinders:      parseInt(r.Cylinders)   || null,
      block_type:     r.BlockType?.trim()      || null,
      cid:            r.CID !== '-' ? parseInt(r.CID) : null,
    });
  }

  // ── EngineConfig: EngineConfigID → EngineBaseID ───────────────────────────
  const engCfgToBase = new Map();
  for (const r of engCfgRows) {
    engCfgToBase.set(parseInt(r.EngineConfigID), parseInt(r.EngineBaseID));
  }

  // ── VehicleToEngineConfig: VehicleID → [EngineConfigID, ...] ─────────────
  const vtecByVehicle = new Map();
  for (const r of vtecRows) {
    const vid   = parseInt(r.VehicleID);
    const ecId  = parseInt(r.EngineConfigID);
    if (!vtecByVehicle.has(vid)) vtecByVehicle.set(vid, []);
    vtecByVehicle.get(vid).push(ecId);
  }

  process.stdout.write(`  VCdb loaded. BaseVehicles: ${bvByKey.size.toLocaleString()}\n`);

  return {
    pfx,
    makeById, makeByName, makeTokens,
    modelById, modelByName, modelTokens,
    bvByKey, bvById, makeModelIds,
    vehByBase,
    engBaseById, engCfgToBase, vtecByVehicle,
  };
}

// ── Make resolver ─────────────────────────────────────────────────────────────

function resolveMake(rawMake, vcdb) {
  if (!rawMake) return { makeId: null, normalizedMake: null, makeMethod: 'no_input' };
  const lower = rawMake.trim().toLowerCase();

  // 1. Alias table
  const aliased = MAKE_ALIASES[lower];
  if (aliased) {
    const id = vcdb.makeByName.get(aliased.toLowerCase());
    if (id != null) return { makeId: id, normalizedMake: aliased, makeMethod: 'alias' };
  }

  // 2. Exact lowercase match
  const exactId = vcdb.makeByName.get(lower);
  if (exactId != null) {
    return { makeId: exactId, normalizedMake: vcdb.makeById.get(exactId), makeMethod: 'exact' };
  }

  // 3. Token-overlap fuzzy match (Jaccard threshold 0.50)
  const qToks = tokenize(rawMake);
  let bestId = null, bestScore = 0, bestName = null;
  for (const { id, name, toks } of vcdb.makeTokens) {
    const s = tokenF1(qToks, toks);
    if (s > bestScore) { bestScore = s; bestId = id; bestName = name; }
  }
  if (bestScore >= 0.50) {
    return { makeId: bestId, normalizedMake: bestName, makeMethod: 'token_fuzzy', makeScore: bestScore };
  }

  return { makeId: null, normalizedMake: null, makeMethod: 'no_make_match' };
}

// ── Model resolver ────────────────────────────────────────────────────────────

function resolveModel(rawModel, makeId, vcdb) {
  if (!rawModel || makeId == null) {
    return { modelId: null, normalizedModel: null, modelMethod: 'no_input' };
  }
  const lower = rawModel.trim().toLowerCase();

  // Candidate model IDs valid for this make (have a BaseVehicle entry)
  const validModelIds = vcdb.makeModelIds.get(makeId) ?? new Set();

  // 1. Exact lowercase match within valid models
  const exactCandidates = (vcdb.modelByName.get(lower) ?? []).filter(id => validModelIds.has(id));
  if (exactCandidates.length > 0) {
    const id   = exactCandidates[0];
    const name = vcdb.modelById.get(id)?.name ?? rawModel;
    return { modelId: id, normalizedModel: name, modelMethod: 'exact' };
  }

  // 2. Token-overlap fuzzy match within valid models (F1 threshold 0.45)
  const qToks = tokenize(rawModel);
  let bestId = null, bestScore = 0, bestName = null;
  for (const { id, name, toks } of vcdb.modelTokens) {
    if (!validModelIds.has(id)) continue;
    const s = tokenF1(qToks, toks);
    if (s > bestScore) { bestScore = s; bestId = id; bestName = name; }
  }
  if (bestScore >= 0.45) {
    return { modelId: bestId, normalizedModel: bestName, modelMethod: 'token_fuzzy', modelScore: bestScore };
  }

  return { modelId: null, normalizedModel: null, modelMethod: 'no_model_match' };
}

// ── Engine config resolver ────────────────────────────────────────────────────

/** Return unique EngineBase records for a set of VehicleIDs. */
function resolveEngineConfigs(vehicleIds, vcdb) {
  if (!vehicleIds?.length) return [];
  const seenBaseIds = new Set();
  const result = [];
  for (const vid of vehicleIds) {
    const ecIds = vcdb.vtecByVehicle.get(vid) ?? [];
    for (const ecId of ecIds) {
      const baseId = vcdb.engCfgToBase.get(ecId);
      if (baseId != null && !seenBaseIds.has(baseId)) {
        seenBaseIds.add(baseId);
        const eng = vcdb.engBaseById.get(baseId);
        if (eng) result.push(eng);
      }
    }
  }
  // Sort by liter asc for deterministic output
  return result.sort((a, b) => (a.liter ?? 0) - (b.liter ?? 0));
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Normalize a raw year/make/model to VCdb canonical IDs.
 *
 * @param {number|string} year
 * @param {string}        make  - raw make name (may be all-caps, abbreviated)
 * @param {string}        model - raw model name
 * @param {object}        vcdb  - returned by loadVCdb()
 * @returns {object}            - normalized vehicle record (see schema below)
 *
 * Return schema:
 * {
 *   input: { year, make, model },
 *   base_vehicle_id: number | null,
 *   vehicle_ids:     number[],
 *   normalized_make:  string | null,
 *   normalized_model: string | null,
 *   match_confidence: number,       // 0–1 composite
 *   match_method:     string,       // e.g. 'alias+exact', 'token_fuzzy+token_fuzzy'
 *   possible_engine_configs: [{ engine_base_id, liter, cylinders, block_type, cid }],
 *   vcdb_date: string,
 * }
 *
 * TODO(predii-api): Replace with POST /v1/normalize/ymm { year, make, model }
 */
export function normalize(year, make, model, vcdb) {
  const yr = parseInt(year);

  const { makeId, normalizedMake, makeMethod, makeScore } = resolveMake(make, vcdb);
  const { modelId, normalizedModel, modelMethod, modelScore } = resolveModel(model, makeId, vcdb);

  // BaseVehicle lookup: requires year + makeId + modelId all resolved
  let baseVehicleId  = null;
  let vehicleIds     = [];
  let possibleEngines = [];

  if (makeId != null && modelId != null && !isNaN(yr)) {
    const key = `${yr}_${makeId}_${modelId}`;
    baseVehicleId = vcdb.bvByKey.get(key) ?? null;
    if (baseVehicleId != null) {
      vehicleIds    = vcdb.vehByBase.get(baseVehicleId) ?? [];
      possibleEngines = resolveEngineConfigs(vehicleIds, vcdb);
    }
  }

  // Composite confidence: 0.5 * make_score + 0.5 * model_score
  const mScore = makeScore  ?? (makeId  != null ? 1.0 : 0.0);
  const dScore = modelScore ?? (modelId != null ? 1.0 : 0.0);
  const confidence = Math.round((mScore * 0.5 + dScore * 0.5) * 1000) / 1000;

  // match_method string: makeMethod + '+' + modelMethod
  const matchMethod = `${makeMethod}+${modelMethod}`;

  return {
    input:            { year: yr || null, make: make || null, model: model || null },
    base_vehicle_id:  baseVehicleId,
    vehicle_ids:      vehicleIds,
    normalized_make:  normalizedMake,
    normalized_model: normalizedModel,
    vehicle_origin:   vehicleOrigin(normalizedMake),
    match_confidence: confidence,
    match_method:     matchMethod,
    possible_engine_configs: possibleEngines,
    vcdb_date:        vcdb.pfx,
  };
}
