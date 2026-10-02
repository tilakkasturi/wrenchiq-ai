// Tools the repair order agent can call. They run in the browser against the repair order held in
// state.js, so the facts (hours, guide rows, the maintenance schedule, NAPA prices) come from the
// same deterministic code the scripted flow uses. The model decides which to call; these decide
// what is true. Only add_repair_line changes the order's lines, and it goes through the same
// labor-guide guardrails (laborRules.js) as the Add buttons.
import { S, notify } from './state';
import { QB, QBY, MAKES, MODELS, MAKE_RX, MODEL_RX, REPMAP } from './data';
import {
  miles, vehicleLine, vehicleOk, computeRepairs, shownRepairs, applicableQs, maintState, conf, qtyFromName,
  ITEM, hrs, rankItems, combinationsFor,
} from './logic';
import { getMaintItem } from './maintenanceSchedule';
import { searchNapa } from './partsApi';
import { standalonesOf, parentsOnOrder, sameJob } from './laborRules';

// The harness owns how a line is placed and announced; it hands those in here so this module does
// not import harness.js (which imports the agent, which imports this).
let LINES = null;
export const useLineOps = ops => { LINES = ops; };

const questionCatalog = QB.map(q => `${q.id}: ${q.opts.map(o => o.l).join(' | ')}`).join('; ');

export const TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'update_vehicle',
      description: 'Record vehicle details the advisor stated. Pass only the fields that were stated. Use this as soon as the advisor mentions the vehicle.',
      parameters: {
        type: 'object',
        properties: {
          year: { type: 'integer', description: 'Model year, e.g. 2018' },
          make: { type: 'string', description: 'e.g. Toyota' },
          model: { type: 'string', description: 'e.g. Corolla' },
          engine: { type: 'string', description: 'e.g. 1.8L' },
          mileage: { type: 'integer', description: 'Odometer in miles, e.g. 61000 for "61k"' },
          vin: { type: 'string', description: '17-character VIN' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_concern',
      description: "Record the customer's problem in their own words. Use append=true to add detail to what is already recorded.",
      parameters: {
        type: 'object',
        properties: {
          symptom: { type: 'string', description: "The customer's complaint, e.g. 'Grinding when braking'" },
          append: { type: 'boolean', description: 'Add to the existing concern instead of replacing it' },
        },
        required: ['symptom'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'rank_repairs',
      description: 'Match the recorded concern against the labor guide and return the likely repairs with labor hours and guide row ids, plus follow-up questions that would separate them. '
        + 'Optionally record answers to earlier follow-up questions. Valid question ids and option labels: ' + questionCatalog + '.',
      parameters: {
        type: 'object',
        properties: {
          answers: { type: 'object', description: 'Map of question id to the exact option label, e.g. {"brk-where":"Front"}' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_maintenance_due',
      description: 'Look up the scheduled maintenance due at the current mileage from the interval table. Needs the mileage to be recorded.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_repair_line',
      description: 'Put a repair, maintenance item or add-on labor on the repair order. Only when the advisor asks to add something. '
        + 'Pass the id from rank_repairs, get_maintenance_due or the Add-on labor list; if you only know what they called it, pass name. '
        + 'The labor-guide rules decide what actually goes on: they may use a cheaper add-on version, replace lines it covers, or refuse a duplicate. Tell the advisor what the result says.',
      parameters: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'Line id, e.g. "axle-asm-fwd-left"' },
          name: { type: 'string', description: 'The job name with spelling corrected, e.g. "right axle shaft assembly" for "rite axel", when no id is known' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_napa_parts',
      description: 'Look up NAPA catalog parts with list prices for the vehicle on the repair order. Needs year, make and model recorded. Call once per part.',
      parameters: {
        type: 'object',
        properties: { part: { type: 'string', description: 'Part name as a mechanic says it, e.g. "front brake pads"' } },
        required: ['part'],
      },
    },
  },
];

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

const maintSummary = ms => (ms ? {
  due_now: ms.due, status: ms.status, interval_mi: ms.at, note: ms.note,
  schedule: { source: ms.source, match: ms.match, vin_mask: ms.vinMask },
  items: ms.ids.map(id => { const it = getMaintItem(id); return { id, name: it.name, hours: it.hours, schedule_row: it.ref }; }),
} : null);

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
      if (v.length === 17) { R.vin = v; changed.push('vin'); } else return { error: 'a VIN has 17 characters' };
    }
    if (changed.length) { notify(); C.event('Repair order updated · vehicle'); }
    return { vehicle: vehicleLine() || null, mileage: miles() || null, vehicle_complete: vehicleOk(), changed };
  },

  async set_concern(args, C) {
    const text = String(args.symptom || '').trim();
    if (!text) return { error: 'symptom is empty' };
    const R = S.ro;
    R.symptom = args.append && R.symptom ? R.symptom.replace(/[.!?]?$/, '.') + ' ' + text : text;
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
    const same = ids.join() === R.lastTop.join() && !Object.keys(args.answers || {}).length;
    if (!same) {
      const first = !R.lastTop.length;
      const top = list.slice(0, 3).map(x => {
        const oi = R.lastTop.indexOf(x.id), ni = ids.indexOf(x.id);
        let mv = null;
        if (!first) mv = oi < 0 ? 'New in the top three' : ni < oi ? 'Moved up' : ni > oi ? 'Moved down' : null;
        return { mv, ...x };
      });
      C.card({ type: 'repairs', snap: top, title: first ? 'Likely repairs' : 'Updated ranking' });
    }
    R.lastTop = ids;
    notify();
    const followups = applicableQs().filter(q => !R.answers[q.id]).slice(0, 2).map(q => ({ id: q.id, ask: q.ask, options: q.opts.map(o => o.l) }));
    return {
      matches: list.slice(0, 5).map(x => ({ id: x.id, name: REPMAP[x.id].name, hours: REPMAP[x.id].hours, guide_row: REPMAP[x.id].ref, match: conf(x.score)[1], why: x.why.slice(0, 3) })),
      answers_so_far: R.answers,
      suggested_followups: followups,
      rejected_answers: bad.length ? bad : undefined,
    };
  },

  async get_maintenance_due(_args, C) {
    const ms = maintState();
    if (!ms) return { error: 'No mileage recorded yet. Call update_vehicle with the mileage first.' };
    const R = S.ro, key = ms.at + '|' + ms.due;
    if (ms.due && R.shownMaint !== key) { R.shownMaint = key; C.card({ type: 'maint', ms }); notify(); }
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
    await LINES.after(res, C, { quiet: true });
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
    if (res.parts.length) C.card({ type: 'parts', res, part, qty: qtyFromName(part), fit: vehicleLine() });
    return {
      part, fits: vehicleLine(), price_basis: res.priceBasis,
      matches: res.parts.map(p => ({ brand: p.brand || p.lineCode, part_number: p.lineCode + ' ' + p.partNumber, description: p.description, list_price_usd: p.listPrice ?? 'not in the NAPA catalog data', quality: p.quality || undefined })),
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
