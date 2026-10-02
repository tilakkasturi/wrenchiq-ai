// OEM scheduled-maintenance data, replacing the fabricated MI/MAINTMAP interval table in data.js.
// Spec: https://predii.atlassian.net/wiki/spaces/prediiv2/pages/4318887937/ScheduledMaintenance
//
// Data source selection (the part of the spec this module implements): a VIN that matches one of
// the Toyota VIN masks uses the real Toyota OEM schedule; a Toyota make with no matching VIN falls
// back to a representative Toyota family (the one the LaborGuide/NAPA demo data is keyed to); any
// other make uses the generic all-makes schedule (a de-duplicated union of the Toyota data, since
// that's the only OEM schedule we have — labeled as generic in the UI, never passed off as brand-specific).
//
// Out of scope for now (left as the fabricated-data era's known gaps, see the spec's "Open
// questions"): driving-condition overlays, service-history de-duplication, the months-since-
// in-service time trigger (no in-service date is collected anywhere in the app today), and
// LaborGuide-sourced labor hours for these items (hours below are still demo estimates).
import toyotaCsv from '../../resources/scheduled_maintenance/toyota_maintenance_5TDYZ.csv?raw';
import genericCsv from '../../resources/scheduled_maintenance/scheduled_maintenance_all_makes.csv?raw';

function parseCsv(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false; }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* ignore, \n terminates the row */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toRecords(csvText) {
  const rows = parseCsv(csvText.trim());
  const header = rows[0];
  return rows.slice(1).map(r => {
    const o = {};
    header.forEach((h, i) => { o[h] = (r[i] || '').trim(); });
    o.MileageAmt = o.MileageAmt ? parseInt(o.MileageAmt, 10) : null;
    o.TimeAmt = o.TimeAmt ? parseInt(o.TimeAmt, 10) : null;
    return o;
  });
}

const TOYOTA_ROWS = toRecords(toyotaCsv);
const GENERIC_ROWS = toRecords(genericCsv);
const TOYOTA_MASKS = Array.from(new Set(TOYOTA_ROWS.map(r => r.VINCode)));
// 2018 Sienna family (5TDYZ3DC2JS901691) — the VIN the LaborGuide/NAPA demo data is keyed to.
const TOYOTA_DEFAULT_MASK = '5TDYZ3DC_JS______';

function specificity(mask) { return mask.split('').filter(c => c !== '_').length; }
function vinMatchesMask(vin, mask) {
  if (vin.length !== mask.length) return false;
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] !== '_' && mask[i].toUpperCase() !== vin[i].toUpperCase()) return false;
  }
  return true;
}

/** Pick the Toyota VIN mask, the Toyota default family, or the generic all-makes fallback. */
export function resolveSchedule({ vin, make }) {
  if (vin && vin.length === 17) {
    let best = null, bestSpec = -1;
    TOYOTA_MASKS.forEach(mask => {
      if (vinMatchesMask(vin, mask)) { const s = specificity(mask); if (s > bestSpec) { bestSpec = s; best = mask; } }
    });
    if (best) return { source: 'toyota_maintenance_5TDYZ', match: 'VIN_MASK', vinMask: best, rows: TOYOTA_ROWS.filter(r => r.VINCode === best) };
  }
  if (make && /toyota/i.test(make)) {
    return { source: 'toyota_maintenance_5TDYZ', match: 'MAKE_TOYOTA_DEFAULT', vinMask: TOYOTA_DEFAULT_MASK, rows: TOYOTA_ROWS.filter(r => r.VINCode === TOYOTA_DEFAULT_MASK) };
  }
  return { source: 'scheduled_maintenance_all_makes', match: 'GENERIC', vinMask: '*', rows: GENERIC_ROWS };
}

// Demo labor-hour estimates, same ballpark as the old MI table (no LaborGuide row exists for most
// of these yet — see the spec's "Open questions"). Falls back to a flat estimate by OperationType.
const HOUR_ESTIMATE = { 'engine oil+engine oil filter': 0.5, tires: 0.3, 'cabin air filter': 0.3, 'engine air filter': 0.2 };
const HOUR_DEFAULT = { REPLACE: 0.4, ROTATE: 0.3, CLEAN: 0.3, RETORQUE: 0.3, INSPECT: 0.5, CHECK: 0.3, TIGHTEN: 0.3, RESET: 0.1 };
const SERVICE_OPS = new Set(['REPLACE', 'ROTATE', 'CLEAN', 'RETORQUE']);
const INSPECTION_OPS = new Set(['INSPECT', 'CHECK', 'TIGHTEN']);

const dedupeKey = r => (r.PreferredTerm || r.Component) + '|' + r.OperationType;

/** Builds the due-maintenance result for the resolved schedule at the given mileage. Mileage-only
 * for now (see module header) — milestones are matched by MileageAmt alone, not time-since-in-service. */
export function computeMaintenanceDue(mileage, schedule) {
  const normal = schedule.rows.filter(r => r.MaintenanceDescription === '' && r.MileageAmt);
  const milestones = Array.from(new Set(normal.map(r => r.MileageAmt))).sort((a, b) => a - b);
  if (!milestones.length) return null;

  let nearest = milestones[0], bestDelta = Math.abs(mileage - milestones[0]);
  milestones.forEach(ms => { const d = Math.abs(mileage - ms); if (d < bestDelta) { bestDelta = d; nearest = ms; } });
  const delta = mileage - nearest;
  const dueNow = Math.abs(delta) <= 1000;
  const comingUp = !dueNow && delta < 0 && -delta <= 3000;
  const status = dueNow ? 'DUE_NOW' : comingUp ? 'COMING_UP' : 'NOT_DUE';

  const atRows = normal.filter(r => r.MileageAmt === nearest);
  const seen = new Map();
  atRows.forEach(r => { if (!seen.has(dedupeKey(r))) seen.set(dedupeKey(r), r); });
  const rowsAtMilestone = Array.from(seen.values());

  // Pair engine oil + filter into one line, as the spec's worked example does.
  const oil = rowsAtMilestone.filter(r => r.PreferredTerm === 'engine oil' || r.PreferredTerm === 'engine oil filter');
  const rest = rowsAtMilestone.filter(r => !(r.PreferredTerm === 'engine oil' || r.PreferredTerm === 'engine oil filter'));
  const grouped = oil.length ? [{ group: oil, label: 'Engine oil & filter, replace', terms: oil.map(r => r.PreferredTerm) }, ...rest.map(r => ({ group: [r], label: null, terms: [r.PreferredTerm || r.Component] }))]
    : rest.map(r => ({ group: [r], label: null, terms: [r.PreferredTerm || r.Component] }));

  const services = [];
  const inspectionItems = [];
  grouped.forEach(g => {
    const op = g.group[0].OperationType;
    const name = g.label || (g.group[0].PreferredTerm ? g.group[0].PreferredTerm.charAt(0).toUpperCase() + g.group[0].PreferredTerm.slice(1) : titleCase(g.group[0].Component)) + opSuffix(op);
    const extended = g.group.some(r => r.ExtendedFlag === 'Yes');
    const key = 'sm:' + schedule.vinMask + ':' + nearest + ':' + g.terms.join('+') + ':' + op;
    const hours = g.terms.length > 1 ? HOUR_ESTIMATE[g.terms.join('+')] ?? HOUR_DEFAULT[op] : HOUR_ESTIMATE[g.terms[0]] ?? HOUR_DEFAULT[op];
    const ref = schedule.vinMask + ' @ ' + nearest.toLocaleString() + ' mi';
    const detail = 'OEM scheduled maintenance (' + schedule.match + ', source ' + schedule.source + '). '
      + g.group.map(r => r.ServiceDescription).join('; ') + '. Labor time ' + hours.toFixed(1) + ' h (demo estimate, not yet a LaborGuide row).'
      + (extended ? ' Extended schedule (beyond the standard 120,000 mi table).' : '');
    const item = { id: key, name, hours, src: 'sm', ref, detail, extended };
    MAINT_ITEM_CACHE.set(key, item);
    if (SERVICE_OPS.has(op)) services.push(key);
    else if (INSPECTION_OPS.has(op)) inspectionItems.push({ key, item });
  });

  let inspectionId = null;
  if (inspectionItems.length) {
    inspectionId = 'sm:' + schedule.vinMask + ':' + nearest + ':inspection-bundle';
    const names = inspectionItems.map(x => x.item.name.replace(/, (inspect|check|tighten)$/i, ''));
    MAINT_ITEM_CACHE.set(inspectionId, {
      id: inspectionId, name: nearest.toLocaleString() + ' mi multi-point inspection (' + inspectionItems.length + ' checks)',
      hours: HOUR_DEFAULT.INSPECT, src: 'sm',
      ref: schedule.vinMask + ' @ ' + nearest.toLocaleString() + ' mi',
      detail: 'OEM scheduled maintenance (' + schedule.match + ', source ' + schedule.source + '). Bundled inspection: ' + names.join(', ') + '.',
    });
  }

  const ids = status === 'NOT_DUE' ? [] : [...services, ...(inspectionId ? [inspectionId] : [])];
  const next = milestones.find(ms => ms > mileage);
  return {
    due: status !== 'NOT_DUE',
    status,
    at: nearest,
    note: status === 'DUE_NOW'
      ? (delta >= 0 ? delta.toLocaleString() + ' mi past the ' + nearest.toLocaleString() + ' mi service' : 'due in ' + (-delta).toLocaleString() + ' mi')
      : status === 'COMING_UP'
        ? 'coming up in ' + (-delta).toLocaleString() + ' mi'
        : (next ? (next - mileage).toLocaleString() + ' mi away' : 'at ' + nearest.toLocaleString() + ' mi'),
    ids,
    source: schedule.source,
    match: schedule.match,
    vinMask: schedule.vinMask,
  };
}

function titleCase(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase()); }
function opSuffix(op) { return op === 'REPLACE' ? ', replace' : op === 'ROTATE' ? ', rotate' : op === 'CLEAN' ? ', clean' : op === 'RETORQUE' ? ', retorque' : ''; }

const MAINT_ITEM_CACHE = new Map();
export const getMaintItem = id => MAINT_ITEM_CACHE.get(id);
