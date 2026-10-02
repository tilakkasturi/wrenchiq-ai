// Tools the repair order agent can call. They run in the browser against the repair order held in
// state.js, so the facts (hours, guide rows, the maintenance schedule, NAPA prices) come from the
// same deterministic code the scripted flow uses. The model decides which to call; these decide
// what is true. Only add_repair_line changes the order's lines, and it goes through the same
// labor-guide guardrails (laborRules.js) as the Add buttons.
import { policy, rankParts, shopPick, pickReason } from './partPolicy';
import { engineSpec } from './engineCylinders';
import { trace } from './trace';
import { S, notify } from './state';
import { QB, QBY, MAKES, MODELS, MAKE_RX, MODEL_RX, REPMAP } from './data';
import {
  miles, vehicleLine, vehicleOk, computeRepairs, shownRepairs, applicableQs, maintState, conf, qtyFromName, partQty, rankingDetail,
  ITEM, hrs, rate, rankItems, combinationsFor, yearFromVin,
} from './logic';
import { getMaintItem } from './maintenanceSchedule';
import { searchNapa } from './partsApi';
import { standalonesOf, parentsOnOrder, sameJob } from './laborRules';
import { interpretMaint } from './maintAdvice';
import { pendingQuestions, resetFlow } from './recommend';
import { maintMode, fullSchedule, settingOption } from './shopSettings';
import { promptSection } from '../services/promptLoader';

// The harness owns how a line is placed and announced; it hands those in here so this module does
// not import harness.js (which imports the agent, which imports this).
let LINES = null;
export const useLineOps = ops => { LINES = ops; };

const questionCatalog = QB.map(q => `${q.id}: ${q.opts.map(o => o.l).join(' | ')}`).join('; ');

// Structure only: every description the model reads is in prompts/core-ro-agent-tools.md.
const SCHEMA = [
  ['update_vehicle', { year: 'integer', make: 'string', model: 'string', engine: 'string', mileage: 'integer', vin: 'string' }],
  ['set_concern', { symptom: 'string', append: 'boolean' }, ['symptom']],
  ['rank_repairs', { answers: 'object' }],
  ['get_maintenance_due', {}],
  ['add_repair_line', { id: 'string', name: 'string' }],
  ['search_napa_parts', { part: 'string' }, ['part']],
];
const describe = key => promptSection('core-ro-agent-tools', key, { questionCatalog });

export const TOOL_SCHEMAS = SCHEMA.map(([name, props, required]) => ({
  type: 'function',
  function: {
    name,
    description: describe(name),
    parameters: {
      type: 'object',
      properties: Object.fromEntries(Object.entries(props).map(([k, type]) => [k, { type, description: describe(name + '.' + k) }])),
      ...(required ? { required } : {}),
    },
  },
}));

const clean = v => (typeof v === 'string' ? v.trim() : v);

/** "toyota" -> "Toyota", "corolla" -> Corolla (and its make). Unknown values are kept as typed. */
function canonVehicle(a) {
  const out = {};
  if (a.make) { const m = String(a.make).match(MAKE_RX); out.make = m ? MAKES[m[1].toLowerCase()] : clean(a.make); }
  if (a.model) {
    const m = String(a.model).match(MODEL_RX);
    // a known model fixes a missing or wrong make ("make: Highlander" -> Toyota)
    if (m) { const md = MODELS[m[1].toLowerCase()]; out.model = md[0]; if (!out.make || !MAKE_RX.test(String(a.make || ''))) out.make = md[1]; } else out.model = clean(a.model);
  }
  return out;
}

/** The schedule interpreted for the advisor (maintAdvice.js): items by severity, and the customer script. */
const maintSummary = ms => {
  if (!ms) return null;
  const base = { due_now: ms.due, status: ms.status, interval_mi: ms.at, note: ms.note, schedule: { source: ms.source, match: ms.match, vin_mask: ms.vinMask } };
  const adv = ms.ids.length && interpretMaint(ms, { rate: rate(), accepted: [...S.ro.accepted], make: S.ro.make });
  if (!adv) return { ...base, items: [] };
  const presentation = { setting: maintMode(), instruction: settingOption('maint.presentation').say };
  if (presentation.setting === 'all') {
    const full = fullSchedule(ms, { rate: rate(), accepted: [...S.ro.accepted], make: S.ro.make });
    return {
      ...base, presentation,
      items: full.items.map(i => ({ id: i.id, name: i.name, hours: i.hours, already_in: i.coveredBy || undefined, on_order: i.onOrder || undefined })),
      all_ids: full.openIds, hours: Math.round(full.hours * 10) / 10,
      advisor_script: full.script,
    };
  }
  return {
    ...base, presentation,
    by_severity: adv.tiers.map(t => ({ tier: t.label, recommend_today: t.recommend, items: t.items.map(i => ({ id: i.id, name: i.name, hours: i.hours, why: i.why, if_skipped: i.skip || undefined, already_in: i.coveredBy || undefined, on_order: i.onOrder || undefined })) })),
    inspection: adv.inspection && { id: adv.inspection.id, name: adv.inspection.name, checks: adv.inspection.count, covers: adv.inspection.groups },
    recommended: { ids: adv.recommendedIds, hours: Math.round(adv.recommended.hours * 10) / 10 },
    advisor_script: adv.script,
  };
};

export const TOOLS = {
  async update_vehicle(args, C) {
    const R = S.ro, changed = [];
    const y = parseInt(args.year, 10);
    if (args.year !== undefined) {
      if (y >= 1980 && y <= 2030) { R.year = String(y); changed.push('year'); } else return { error: 'year must be between 1980 and 2030' };
    }
    const c = canonVehicle(args);
    if (c.make) { R.make = c.make; changed.push('make'); }
    if (c.model) { R.model = c.model; changed.push('model'); }
    if (args.engine) { R.engine = String(args.engine).trim(); changed.push('engine'); }
    if (args.mileage !== undefined) {
      const m = parseInt(args.mileage, 10);
      if (m > 0 && m < 1000000) { R.mileage = String(m); changed.push('mileage'); } else return { error: 'mileage must be a positive number under 1,000,000' };
    }
    if (args.vin) {
      const v = String(args.vin).toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (v.length === 17) {
        R.vin = v; changed.push('vin');
        // the model often passes the VIN without the year; the VIN carries it
        if (!R.year && yearFromVin(v)) { R.year = String(yearFromVin(v)); changed.push('year (from VIN)'); }
      } else return { error: 'a VIN has 17 characters' };
    }
    let cyl;
    if (changed.length) { C.event('Repair order updated · vehicle'); cyl = LINES && LINES.cylinders ? LINES.cylinders(C) : null; notify(); }
    const sp = engineSpec();
    return {
      vehicle: vehicleLine() || null, mileage: miles() || null, vehicle_complete: vehicleOk(), changed,
      cylinders: sp.cylinders || undefined, diesel: sp.diesel || undefined,
      parts_added: cyl && cyl.added.length ? cyl.added : undefined,
      parts_qty_changed: cyl && cyl.updated.length ? cyl.updated.map(l => l + ' now ' + cyl.cylinders) : undefined,
      parts_removed: cyl && cyl.removed.length ? cyl.removed : undefined,
    };
  },

  async set_concern(args, C) {
    const text = String(args.symptom || '').trim();
    if (!text) return { error: 'symptom is empty' };
    const R = S.ro;
    R.symptom = args.append && R.symptom ? R.symptom.replace(/[.!?]?$/, '.') + ' ' + text : text;
    if (!args.append) resetFlow(); // a new concern gets its own question round and recommendations
    notify();
    C.event('Repair order updated · concern');
    return { concern: R.symptom };
  },

  async rank_repairs(args, C) {
    const R = S.ro, bad = [];
    if (!R.symptom.trim()) return { error: 'No concern recorded yet. Call set_concern first.' };
    const before = computeRepairs().map(x => x.id);
    Object.entries(args.answers || {}).forEach(([qid, label]) => {
      const q = QBY[qid], opt = q && q.opts.find(o => o.l.toLowerCase() === String(label).toLowerCase());
      if (opt) R.answers[qid] = opt.l; else bad.push(qid + '=' + label);
    });
    const list = shownRepairs(), ids = list.map(x => x.id);
    if (!list.length) { notify(); return { matches: [], note: 'Nothing in the labor guide matches this concern.', rejected_answers: bad }; }
    // no card here: the app shows the combined question, then the Recommendations card (recommend.js)
    R.lastTop = ids;
    trace('rule', 'Rank repairs (labor guide)', 'Top: ' + list.slice(0, 3).map(x => REPMAP[x.id].name + ' (' + x.score + ')').join(', '), rankingDetail(list));
    notify();
    const pending = pendingQuestions().filter(p => p.kind === 'choice').map(p => ({ id: p.id, ask: p.ask, options: p.options }));
    return {
      matches: list.slice(0, 5).map(x => ({ id: x.id, name: REPMAP[x.id].name, hours: REPMAP[x.id].hours, guide_row: REPMAP[x.id].ref, match: conf(x.score)[1], why: x.why.slice(0, 3) })),
      answers_so_far: R.answers,
      pending_questions: pending.length ? pending : undefined, // the app asks these on one card; record answers, do not ask them
      rejected_answers: bad.length ? bad : undefined,
    };
  },

  async get_maintenance_due(_args, C) {
    const ms = maintState();
    if (!ms) return { error: 'No mileage recorded yet. Call update_vehicle with the mileage first.' };
    const R = S.ro, key = ms.at + '|' + ms.due;
    if (R.shownMaint !== key) { R.shownMaint = key; notify(); } // shown in the Recommendations card's maintenance section
    return maintSummary(ms);
  },

  async add_repair_line(args, C) {
    if (!LINES) return { error: 'adding lines is not available' };
    const want = String(args.id || '').trim(), named = String(args.name || '').trim();
    let id = want && ITEM(want) ? want : null;
    if (!id) {
      // a name has to match clearly: two words of the job's name, or one word of a job already in play
      const cands = rankItems(named || want, 'suggest');
      const tied = cands.filter(c => c.s === (cands[0] && cands[0].s));
      // clear: two words of the job's name, a job already in play, or every equal match is the same job
      if (cands.length && (cands[0].s >= 1.5 || tied.every(c => c.id === cands[0].id || sameJob(c.id, cands[0].id)))) id = cands[0].id;
      else {
        return {
          result: 'not_added',
          error: 'No line clearly matches "' + (named || want) + '". Nothing was added. Pass an id from rank_repairs or the Add-on labor list, or the corrected job name (e.g. "A/C condenser").',
          candidates: cands.slice(0, 4).map(c => ({ id: c.id, name: ITEM(c.id).name })),
        };
      }
    }
    const res = LINES.place(id);
    notify();
    const after = await LINES.after(res, C, { quiet: true });
    const line = res.added && ITEM(res.added);
    // an add-on picked directly is still cheaper than the same job on its own: say so
    if (res.action === 'add' && line && line.laborType === 'COMBINATION') {
      const alone = standalonesOf(line.id).map(x => ITEM(x)).find(x => x && x.hours > line.hours), parent = parentsOnOrder(line.id, [...S.ro.accepted])[0];
      if (alone && parent) Object.assign(res, { action: 'substitute', saves: Math.round((alone.hours - line.hours) * 10) / 10, reason: 'Added as add-on labor to ' + ITEM(parent).name + ': ' + line.hours.toFixed(1) + ' h instead of ' + alone.hours.toFixed(1) + ' h on its own.' });
    }
    return {
      result: res.action === 'block' ? 'not_added' : res.action === 'add' ? 'added' : res.action === 'substitute' ? 'added_as_add_on' : 'replaced_lines',
      line: line ? { id: line.id, name: line.name, hours: hrs(line) } : undefined,
      reason: res.reason,
      hours_saved: res.saves > 0 ? res.saves : undefined,
      removed: res.remove ? res.remove.map(x => (ITEM(x) ? ITEM(x).name : x)) : undefined,
      order_now: [...S.ro.accepted].map(x => ITEM(x)).filter(Boolean).map(it => it.name + ' (' + hrs(it).toFixed(1) + ' h)'),
      add_ons_offered: line ? combinationsFor(line.id).map(c => ({ id: c, name: ITEM(c).name, hours: ITEM(c).hours })) : undefined,
      parts_added: after?.parts?.added.length ? after.parts.added : undefined,
      parts_not_priced: after?.parts?.notPriced.length ? after.parts.notPriced : undefined,
      parts_waiting_for_engine: after?.parts?.waitingForEngine || undefined,
      parts_not_needed_diesel: after?.parts?.diesel?.length ? after.parts.diesel : undefined,
    };
  },

  async search_napa_parts(args, C) {
    const part = String(args.part || '').trim();
    if (!part) return { error: 'part is empty' };
    if (!vehicleOk()) return { error: 'Year, make and model are not all recorded yet. Ask the advisor, then call update_vehicle.' };
    const R = S.ro;
    const res = await searchNapa({ year: R.year, make: R.make, model: R.model, part });
    if (!res.ok) return { error: res.code, message: res.message };
    R.parts.lastQ = part;
    const q = partQty(part);
    if (res.parts.length) C.card({ type: 'parts', res, part, qty: q.qty, perCyl: q.perCyl, fit: vehicleLine() });
    const pick = shopPick(res.parts);
    return {
      part, fits: vehicleLine(), price_basis: res.priceBasis, availability_basis: res.availabilityBasis,
      shop_rule: policy().label,
      quantity: q.perCyl ? (q.qty === null ? 'one per cylinder; engine not known yet, ask which engine: ' + (q.options || []).map(e => e.engine + ' (' + e.cylinders + ' cyl)').join(' | ') : q.qty === 0 ? 'none: diesel engine' : q.qty + ' (one per cylinder)') : q.qty,
      shop_pick: pick ? { part_number: pick.lineCode + ' ' + pick.partNumber, why: pickReason(res.parts, pick) } : undefined,
      matches: rankParts(res.parts).map(p => ({ brand: p.brand || p.lineCode, part_number: p.lineCode + ' ' + p.partNumber, description: p.description, list_price_usd: p.listPrice ?? 'not in the NAPA catalog data', availability: p.availability?.label, quality: p.quality || undefined })),
      note: res.parts.length ? undefined : 'NAPA has no matching part for this vehicle.',
    };
  },
};

export const toolLabel = (name, a = {}) => {
  if (name === 'update_vehicle') return [a.year, a.make, a.model, a.mileage ? a.mileage + ' mi' : ''].filter(Boolean).join(' ');
  if (name === 'set_concern') return '"' + String(a.symptom || '').slice(0, 50) + '"';
  if (name === 'rank_repairs') return Object.keys(a.answers || {}).length ? JSON.stringify(a.answers) : 'labor guide';
  if (name === 'search_napa_parts') return '"' + (a.part || '') + '"';
  if (name === 'add_repair_line') return a.id || a.name || '';
  return '';
};
