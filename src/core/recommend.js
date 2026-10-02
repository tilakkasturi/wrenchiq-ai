// The repair order flow before recommendations, and the recommendations themselves.
//
// Flow: once the concern is in, the assistant asks ONE combined question with everything it still
// needs (missing vehicle details, then the follow-ups that best separate the likely repairs), and
// shows recommendations once nothing is left to ask or after two answer rounds, whichever is first.
//
// Recommendations come in three separate sections, each with a customer talk track:
//   1. likely repairs (labor-guide rows ranked against the concern),
//   2. scheduled maintenance (the OEM schedule, interpreted in maintAdvice.js),
//   3. labor-guide recommendations (add-on labor and not-included follow-ons for the top repair).
import { S } from './state';
import { QB } from './data';
import { REPMAP } from './laborGuide';
import {
  ITEM, rate, miles, vehicleOk, shownRepairs, applicableQs, maintState, conf, concern, combinationsFor, extractVehicle,
} from './logic';
import { matchOne } from './match';
import { followOnsFor } from './laborRules';
import { talkFor, plainJob } from './talkTrack';
import { interpretMaint } from './maintAdvice';
import { laborMode, KIND_ORDER, isLeadKind } from './shopSettings';

export const MAX_ROUNDS = 2;   // advisor answers before recommendations show regardless
const MAX_PARTS = 3;           // parts in the one combined question

const dollars = n => '$' + Math.round(n).toLocaleString();
const joinAnd = l => (l.length <= 1 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);

/** Flow state on the repair order; reset whenever the concern is replaced. */
export const flow = () => S.ro.flow || (S.ro.flow = { rounds: 0, askedRound: -1, shown: false });
export const resetFlow = () => { S.ro.flow = { rounds: 0, askedRound: -1, shown: false }; };

/**
 * What is still worth asking, as the parts of one question: vehicle gaps first, then the follow-up
 * questions whose answers move the top repairs (most repairs moved first).
 */
export function pendingQuestions() {
  const R = S.ro, parts = [];
  if (!vehicleOk()) parts.push({ id: 'veh', kind: 'text', short: 'Vehicle', ask: 'Year, make and model?', placeholder: 'e.g. 2018 Toyota Sienna, or the VIN' });
  if (!miles()) parts.push({ id: 'mi', kind: 'text', short: 'Mileage', ask: 'Mileage?', placeholder: 'e.g. 61,000' });
  const top = shownRepairs().slice(0, 5).map(x => x.id);
  const qs = applicableQs()
    .filter(q => q.id !== 'dur' && !R.answers[q.id])
    .map(q => ({ q, moves: new Set(q.opts.flatMap(o => Object.keys(o.b)).filter(id => top.includes(id))).size }))
    .filter(x => x.moves > 0)
    .sort((a, b) => b.moves - a.moves);
  qs.forEach(({ q }) => { if (parts.length < MAX_PARTS) parts.push({ id: q.id, kind: 'choice', short: q.short, ask: q.ask, options: q.opts.map(o => o.l) }); });
  return parts;
}

/**
 * Read one free-text reply against every open part: vehicle details by the usual extractor, each
 * choice by its options (the reply split on commas, "and", slashes and dots, so "front, grinding"
 * answers two questions). Returns what was recorded.
 */
export function applyAnswers(text, parts = pendingQuestions()) {
  const R = S.ro, got = [];
  if (parts.some(p => p.kind === 'text')) {
    const ex = extractVehicle(text);
    if (ex.changed.length) got.push({ id: 'vehicle', value: ex.changed.join(', ') });
  }
  const bits = String(text).split(/[,;/·]|\band\b|\.\s/i).map(s => s.trim()).filter(Boolean);
  parts.filter(p => p.kind === 'choice' && !R.answers[p.id]).forEach(p => {
    for (const b of bits.concat([text])) {
      const m = matchOne(p.options, b);
      if (m && m.o) { R.answers[p.id] = m.o; got.push({ id: p.id, value: m.o }); return; }
    }
  });
  return got;
}

/** Record answers picked on the question card: { [part id]: option label or typed text }. */
export function recordPicked(picked) {
  const R = S.ro, got = [];
  Object.entries(picked).forEach(([id, v]) => {
    const val = String(v || '').trim();
    if (!val) return;
    if (id === 'veh' || id === 'mi') {
      const ex = extractVehicle(id === 'mi' && /^\d[\d,.]*k?$/i.test(val) ? val + ' miles' : val);
      if (ex.changed.length) got.push({ id, value: val });
      return;
    }
    const q = QB.find(x => x.id === id);
    if (q && q.opts.some(o => o.l === val)) { R.answers[id] = val; got.push({ id, value: val }); }
  });
  return got;
}

/** What the flow should do next: ask the combined question, show recommendations, or wait. */
export function nextStep() {
  const R = S.ro, f = flow();
  if (!R.symptom.trim() || f.shown) return { do: 'none' };
  const parts = pendingQuestions();
  // a second round only when it still matters: vehicle details missing, or the top repair not yet a clear match
  const top = shownRepairs()[0];
  const worthAnother = f.rounds === 0 || parts.some(p => p.kind === 'text') || !(top && conf(top.score)[0] === 'high');
  // an advisor who already put work on the order has decided; do not hold the recommendations back
  if (parts.length && worthAnother && f.rounds < MAX_ROUNDS && R.accepted.size === 0) {
    return f.askedRound === f.rounds ? { do: 'wait' } : { do: 'ask', parts, round: f.rounds + 1 };
  }
  return { do: 'show' };
}

/* ---------- the recommendations ---------- */

function likelyRepairs(rt) {
  const R = S.ro, list = shownRepairs().slice(0, 3);
  const items = list.map(x => {
    const it = ITEM(x.id), c = conf(x.score);
    return { id: x.id, name: it.name, hours: it.hours, price: rt ? it.hours * rt : null, match: c[1], level: c[0], why: x.why.slice(0, 4), parts: it.parts || [], ref: it.ref, synthetic: it.synthetic, on: R.accepted.has(x.id) };
  });
  const said = R.symptom.trim().replace(/[.!?]+$/, '');
  let say = '';
  if (items.length) {
    const t = items[0];
    say = 'You told us: "' + said + '". The most likely fix is to ' + plainJob(t.name) + '; the technician confirms it before any work starts.'
      + (items[1] ? ' If it turns out to be something else, the next thing we would look at is the ' + items[1].name.split(',')[0].toLowerCase() + '.' : '')
      + ' That repair is ' + t.hours.toFixed(1) + ' hours of labor' + (t.price !== null ? ', about ' + dollars(t.price) : '') + ', the standard time the labor guide lists.';
  }
  return { items, say, empty: items.length ? null : (said ? 'Nothing in the labor guide matches "' + said + '" as a repair. Maintenance below still applies.' : 'No repair concern on this order.') };
}

function laborGuideRecs(repairs, rt) {
  const R = S.ro;
  // anchor on the job the advisor has taken (a labor-guide operation), else the top likely repair
  const taken = [...R.accepted].find(id => REPMAP[id] && REPMAP[id].laborType === 'OPERATION' && combinationsFor(id).length);
  const anchor = taken || (repairs.items.find(i => combinationsFor(i.id).length) || {}).id;
  if (!anchor) return { anchor: null, mode: laborMode(), items: [], lead: [], more: [], followOns: [], say: '', empty: 'The labor guide pairs no add-on labor with ' + (repairs.items[0] ? repairs.items[0].name.toLowerCase() : 'this order') + '.' };
  const mode = laborMode();
  let items = combinationsFor(anchor).map(id => {
    const it = REPMAP[id], t = talkFor(id, anchor, rt);
    return { id, name: it.name, hours: it.hours, price: rt ? it.hours * rt : null, kindId: t ? t.kind : 'recommended', kind: t ? t.label : 'Add-on', plain: (it.talk && it.talk.plain) || it.name.toLowerCase(), saves: t ? t.saves : null, say: t ? t.text : '', ref: it.ref, on: R.accepted.has(id) };
  });
  // shop setting (Shop profile): what matters first, or every add-on in the guide's order
  if (mode !== 'all') items = items.slice().sort((x, y) => KIND_ORDER.indexOf(x.kindId) - KIND_ORDER.indexOf(y.kindId));
  const lead = mode === 'all' ? items : items.filter(i => isLeadKind(i.kindId));
  const more = mode === 'all' ? [] : items.filter(i => !isLeadKind(i.kindId));
  const followOns = followOnsFor(anchor, [...R.accepted]).map(f => ({ id: f.id, name: ITEM(f.id).name, hours: ITEM(f.id).hours, price: rt ? ITEM(f.id).hours * rt : null, why: f.why, on: R.accepted.has(f.id) }));
  const job = REPMAP[anchor].name.toLowerCase().replace(/,.*$/, '');
  const open = l => l.filter(i => !i.on);
  let say = (taken ? 'While we have it apart for the ' : 'If we do the ') + job + ', some related work costs much less to do at the same time, because the labor to get to it is already done.';
  if (mode === 'all') {
    say += ' The labor guide lists ' + items.length + ' item' + (items.length === 1 ? '' : 's') + ' with this job: ' + joinAnd(items.map(i => i.name.toLowerCase().replace(/,.*$/, ''))) + '. We only do what you approve.';
  } else {
    if (open(lead).length) say += ' With this job we would also ' + joinAnd(open(lead).map(i => i.plain)) + '.';
    if (more.length) say += ' ' + (more.length === 1 ? 'One more is' : 'A few more are') + ' only done if the technician finds ' + (more.length === 1 ? 'it is' : 'they are') + ' needed or you want ' + (more.length === 1 ? 'it' : 'them') + ', and we show you first.';
  }
  if (followOns.length) say += ' After this repair the ' + followOns.map(f => f.name.toLowerCase().replace(/,.*$/, '')).join(' and ') + ' should be checked too.';
  return { anchor, anchorName: REPMAP[anchor].name, anchorOnOrder: !!taken, mode, items, lead, more, followOns, say };
}

/** The three sections, each with its talk track and the items to drill into. */
export function buildRecs() {
  const R = S.ro, rt = rate(), ms = maintState();
  const repairs = likelyRepairs(rt);
  const adv = ms && ms.due ? interpretMaint(ms, { rate: rt, accepted: [...R.accepted], make: R.make }) : null;
  const maint = adv
    ? { ms, adv, say: adv.scriptLines, count: adv.tiers.reduce((n, t) => n + t.items.length, 0) + (adv.inspection ? 1 : 0) }
    : { ms, adv: null, say: [], count: 0, empty: ms ? 'Nothing on the maintenance schedule is due at ' + miles().toLocaleString() + ' mi; the next service is ' + ms.note + '.' : 'Add the mileage to check the maintenance schedule.' };
  const labor = laborGuideRecs(repairs, rt);
  return { concern: concern(), repairs, maint, labor };
}
