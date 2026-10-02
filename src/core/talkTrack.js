// Customer talk track for COMBINATION (add-on) labor. The words come from the labor guide's
// enrichment file (kind, plain, why, standalone in labor_guide_enrichment.json); this file only puts
// them in a fixed sentence shape so every claim is one the data supports:
// - the price is the add-on's own guide hours at the shop's rate, never a rounded-up "deal";
// - a saving is quoted only when the guide has the same job as a standalone row with more hours;
// - "if-needed" items are framed as "only if the technician finds it worn", never as a must;
// - "required" items are explained as part of doing the main job right, not as an extra.
import { REPMAP } from './laborGuide';
import { componentSay } from './laborRules';

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
  const job = jobSay(opId), h = c.hours, price = rate ? h * rate : null;
  const cost = price !== null ? h.toFixed(1) + ' hours, about ' + dollars(price) : h.toFixed(1) + ' hours';
  const alone = [].concat(c.talk.standalone || []).map(id => REPMAP[id]).find(s => s && s.hours > h);
  const saves = alone ? Math.round((alone.hours - h) * 10) / 10 : null;
  const value = alone
    ? 'Done now it is ' + cost + ' of labor; on its own later it would be ' + alone.hours.toFixed(1) + ' hours' + (rate ? ' (about ' + dollars(alone.hours * rate) + ')' : '') + '.'
    : 'Done now it adds ' + cost + ' of labor, because getting to it is already part of today\'s job.';

  let text;
  if (kind === 'required') text = 'To do the ' + job + ' job right, we also need to ' + plain + '. ' + why + ' That is part of the job, not an extra: ' + cost + '.';
  else if (kind === 'if-needed') text = 'While the ' + job + ' is apart, the technician will check it, and we would only ' + plain + ' if it is worn. ' + why + ' ' + value + ' We will show you what we find before doing anything.';
  else if (kind === 'optional') text = 'Since the ' + job + ' will already be apart, we can also ' + plain + '. ' + why + ' ' + value + ' It is your call, and it is fine to skip it today.';
  else text = 'While we are working on the ' + job + ', we would also ' + plain + '. ' + why + ' ' + value;
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
 * @param {object} ctx       { hours, rate, concern (the customer's own words), parent (job id an add-on goes with) }
 * @returns {{title:string, text:string, basis:string}}
 */
export function customerWhy(it, { hours, rate, concern, parent } = {}) {
  const h = hours ?? it.hours, cost = h.toFixed(1) + ' hours of labor' + (rate ? ', about ' + dollars(h * rate) : '');
  if (it.src === 'lg' && it.laborType === 'COMBINATION' && parent) {
    const t = talkFor(it.id, parent, rate);
    if (t) return { title: t.label, text: t.text, basis: 'Add-on labor with ' + REPMAP[parent].name.toLowerCase() + ' · labor guide ' + it.ref };
  }
  if (it.src === 'lg') {
    const said = String(concern || '').trim().replace(/[.!?]+$/, '');
    const text = (said ? 'You told us: "' + said + '". Based on that, the most likely fix is to ' : 'We recommend we ') + plainJob(it.name) + '. '
      + 'The technician confirms it before any work starts, and we will call you if they find something different. '
      + 'It is ' + cost + ', the standard time the labor guide lists for this job.';
    return { title: 'Repair', text, basis: (it.synthetic ? 'Labor guide (synthetic) ' : 'Labor guide ') + it.ref };
  }
  if (it.src === 'sm') {
    const at = (String(it.ref).match(/@\s*([\d,]+)\s*mi/) || [])[1];
    const who = /GENERIC/.test(it.detail || '') ? 'The recommended maintenance schedule' : 'Your vehicle maker\'s maintenance schedule';
    const text = who + ' lists ' + lowerFirst(it.name) + (at ? ' at ' + at + ' miles' : '') + '. Doing it on time keeps small wear items from turning into bigger repairs. It is ' + cost + '.';
    return { title: 'Scheduled maintenance', text, basis: 'Schedule ' + it.ref };
  }
  return { title: 'Added by your advisor', text: it.name + '. ' + cost.charAt(0).toUpperCase() + cost.slice(1) + '.', basis: 'Entered by the advisor' };
}
