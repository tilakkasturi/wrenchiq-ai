// Customer talk track for COMBINATION (add-on) labor and for any line on the order. The words come
// from the labor guide's enrichment file (kind, plain, why, standalone in labor_guide_enrichment.json)
// and the sources file (talkSources.js); this file only puts them in a fixed sentence shape, written
// to keep the shop's liability low:
// - hours are "the standard repair time" (owners do not know "labor guide"), with the source as a
//   reference at the end (Mitchell 1 for real export rows, "standard estimates" for synthetic ones);
//   every price is an estimate;
// - a lower add-on time is quoted only when the guide has the same job as a standalone row, and is
//   stated as what the guide lists, never as a promise of savings;
// - "if-needed" items depend on the technician's inspection, never presented as a must;
// - nothing is said to be needed or caused without the inspection, and nothing is done without approval.
import { REPMAP } from './laborGuide';
import { componentSay } from './laborRules';
import { SRC, timeSay, timeSource, scheduleCite, cap } from './talkSources';

export const KIND_LABEL = { required: 'Part of the job', recommended: 'Recommended', 'if-needed': 'Only if needed', optional: 'Optional' };

const dollars = n => '$' + Math.round(n).toLocaleString();

/** What to call the main job when talking to the customer, e.g. "axle" or "water pump". */
export function jobSay(opId) {
  const p = REPMAP[opId];
  if (!p) return 'repair';
  return componentSay(p.component) || p.name.split(/[,(]/)[0].trim().toLowerCase();
}

/**
 * @returns {{kind:string, label:string, hours:number, price:number|null, saves:number|null, text:string}|null}
 */
export function talkFor(comboId, opId, rate) {
  const c = REPMAP[comboId];
  if (!c || !c.talk) return null;
  const { kind = 'recommended', plain, why } = c.talk;
  const job = jobSay(opId), h = c.hours, price = rate ? h * rate : null, ref = timeSource(c);
  const cost = h.toFixed(1) + ' hours of labor' + (price !== null ? ' (an estimated ' + dollars(price) + ')' : '');
  const alone = [].concat(c.talk.standalone || []).map(id => REPMAP[id]).find(s => s && s.hours > h);
  const saves = alone ? Math.round((alone.hours - h) * 10) / 10 : null;
  // hours are "the standard repair time" to the owner; where they come from is the reference at the end
  const value = alone
    ? 'Because the area is already open, ' + timeSay() + ' for it is ' + cost + ', instead of ' + alone.hours.toFixed(1) + ' hours if it is done separately later.'
    : 'Because the area is already open, ' + timeSay() + ' for it is ' + cost + '.';

  let text;
  if (kind === 'required') text = 'The recommended procedure for the ' + job + ' job includes a step to ' + plain + ', so we include it in the estimate. ' + why + ' ' + cap(timeSay()) + ' for it is ' + cost + '.';
  else if (kind === 'if-needed') text = 'During the ' + job + ' work, we recommend the technician inspect this area. If the inspection shows wear or damage, we would recommend that we ' + plain + '. ' + why + ' ' + value + ' We will show you what we find, and the decision is yours.';
  else if (kind === 'optional') text = 'Since we will already be working on the ' + job + ', you may want to consider having us ' + plain + '. ' + why + ' ' + value + ' This is optional, and it is fine to decline it today.';
  else text = 'While we are working on the ' + job + ', we recommend that we also ' + plain + '. ' + why + ' ' + value + ' ' + SRC.approval;
  text += ' ' + ref;
  return { kind, label: KIND_LABEL[kind] || KIND_LABEL.recommended, hours: h, price, saves, text };
}

/* ---------- customer talk track for any line on the order (the Why? popover) ---------- */

const VERB = [[/overhaul/i, 'rebuild'], [/replace|r&r/i, 'replace'], [/install/i, 'install'], [/inspect|check/i, 'inspect'], [/flush/i, 'flush'],
  [/test/i, 'test'], [/clean/i, 'clean'], [/adjust/i, 'adjust'], [/bleed/i, 'bleed'], [/repair/i, 'repair'], [/rotate/i, 'rotate'],
  [/balance/i, 'balance'], [/resurface/i, 'resurface'], [/evacuate/i, 'evacuate and recharge'], [/burnish/i, 'bed in']];

/** "Axle shaft assembly, remove & install/replace (FWD, left side)" -> "replace the axle shaft assembly (left side)". */
export function plainJob(name) {
  const [noun, ...rest] = String(name).split(',');
  const tail = rest.join(',');
  const qual = (tail.match(/\(([^)]*)\)/) || [])[1];
  const q = qual ? qual.split(/[,;]/).map(x => x.trim()).filter(x => x && !/^(fwd|awd|rwd)$/i.test(x)).join(', ') : '';
  const v = VERB.find(([rx]) => rx.test(tail));
  if (!tail || !v) return String(name).replace(/^diagnostic:\s*/i, 'diagnose the ').toLowerCase();
  return v[1] + ' the ' + noun.trim().toLowerCase() + (q ? ' (' + q.toLowerCase() + ')' : '');
}

const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);

/**
 * A short, plain explanation of one line for the customer, from the same facts the order shows.
 * @param {object} it        the line (ITEM)
 * @param {object} ctx       { hours, rate, concern (the customer's own words), parent (job id an add-on goes with), make }
 * @returns {{title:string, text:string, basis:string}}
 */
export function customerWhy(it, { hours, rate, concern, parent, make } = {}) {
  const h = hours ?? it.hours, cost = h.toFixed(1) + ' hours of labor' + (rate ? ' (an estimated ' + dollars(h * rate) + ')' : '');
  if (it.src === 'lg' && it.laborType === 'COMBINATION' && parent) {
    const t = talkFor(it.id, parent, rate);
    if (t) return { title: t.label, text: t.text, basis: 'Add-on labor with ' + REPMAP[parent].name.toLowerCase() + ' · labor guide ' + it.ref };
  }
  if (it.src === 'lg') {
    const said = String(concern || '').trim().replace(/[.!?]+$/, '');
    const text = (said ? 'You told us: "' + said + '". Based on that description, the repair most often associated with that symptom is to ' : 'The repair we would recommend looking at is to ') + plainJob(it.name) + '. '
      + SRC.confirm + ' '
      + cap(timeSay()) + ' for this job is ' + cost + ', ' + SRC.estimate + '. ' + timeSource(it);
    return { title: 'Repair', text, basis: (it.synthetic ? 'Labor guide (synthetic) ' : 'Labor guide ') + it.ref };
  }
  if (it.src === 'sm') {
    const at = (String(it.ref).match(/@\s*([\d,]+)\s*mi/) || [])[1];
    const who = cap(scheduleCite(/GENERIC/.test(it.detail || '') ? 'GENERIC' : 'OEM', make));
    const est = 'Estimated labor is ' + h.toFixed(1) + ' hours' + (rate ? ' (' + dollars(h * rate) + ')' : '');
    const text = who + ' recommends that we ' + plainJob(it.name).replace(/^(\w+) the (.*)$/, '$1 the $2') + (at ? ' at ' + at + ' miles' : '') + ', and we recommend it at this visit. ' + est + ', ' + SRC.estimate + '. ' + SRC.approval;
    return { title: 'Scheduled maintenance', text, basis: 'Schedule ' + it.ref };
  }
  return { title: 'Added by your advisor', text: it.name + '. ' + cost.charAt(0).toUpperCase() + cost.slice(1) + '.', basis: 'Entered by the advisor' };
}
