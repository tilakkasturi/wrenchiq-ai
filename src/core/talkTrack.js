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
