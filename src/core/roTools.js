// Tools the repair order agent can call. They run in the browser against the repair order held in
// state.js, so the facts (hours, guide rows, the maintenance schedule, NAPA prices) come from the
// same deterministic code the scripted flow uses. The model decides which to call; these decide
// what is true. None of them adds a line to the repair order: the advisor does that from a card.
import { S, notify } from './state';
import { QB, QBY, MAKES, MODELS, MAKE_RX, MODEL_RX, REPMAP, MAINTMAP } from './data';
import {
  miles, vehicleLine, vehicleOk, computeRepairs, shownRepairs, applicableQs, maintState, conf, qtyFromName,
} from './logic';
import { searchNapa } from './partsApi';

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
    if (m) { const md = MODELS[m[1].toLowerCase()]; out.model = md[0]; if (!out.make) out.make = md[1]; } else out.model = clean(a.model);
  }
  return out;
}

const maintSummary = ms => (ms ? {
  due_now: ms.due, interval_mi: ms.at, note: ms.note,
  items: ms.ids.map(id => ({ id, name: MAINTMAP[id].name, hours: MAINTMAP[id].hours, schedule_row: MAINTMAP[id].ref })),
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
  return '';
};
