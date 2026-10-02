// Mock of the Core harness. In production the harness (the agent) decides each turn: what to
// say, which cards to show, which question to ask next and why, and what to change on the
// repair order. The UI only renders what comes back. Here, keyword rules stand in for the agent.
// This file is the seam: replace turn handling with a streaming call and the UI stays as is.
import { S, notify, newRO, persistProfile } from './state';
import { createChat } from './chat';
import { PQ, PQMAP, QBY, QWHY, SAMPLE_MSG, ALLKW } from './data';
import { matchOne } from './match';
import {
  money, ITEM, hrs, rate, miles, vehicleLine, vehicleOk, saveFact, nextProfileQ, parseFor,
  applicableQs, shownRepairs, maintState, extractVehicle, hasContent, findItem, explain,
  partOn, qtyFromName, combinationsFor,
} from './logic';
import { checkAdd, orphanedCombos, followOnsFor } from './laborRules';
import { searchNapa } from './partsApi';
import { runRoAgent } from './roAgent';

const handlers = {};
export const Cp = createChat('profile', () => handlers.profile);
export const Cr = createChat('ro', () => handlers.ro);

const harness = {
  nextQuestion() {
    const q = applicableQs().find(x => !S.ro.answers[x.id]);
    return q ? { id: q.id, ask: q.ask, options: q.opts.map(o => o.l), why: QWHY[q.id] } : null;
  },
};

/* ================= shop profile mode ================= */
function chipsFor(q) {
  if (q.type === 'number') return [{ t: 'Skip', text: 'skip' }];
  if (q.type === 'multi') return q.options.map(o => ({ t: o, text: o, toggle: true })).concat([{ t: 'Send selection', done: true, text: '__done__' }, { t: 'Skip', text: 'skip' }]);
  return q.options.map(o => ({ t: o, text: o })).concat([{ t: 'Skip', text: 'skip' }]);
}
async function askProfile(q) {
  S.pro.awaiting = q.key;
  await Cp.agent(q.ask, 'Why I ask: ' + q.why);
  Cp.chips(chipsFor(q));
}
async function askNextProfile() {
  const q = nextProfileQ();
  if (!q) {
    S.pro.awaiting = null;
    await Cp.agent('That covers it. I will use these on the repair order. You can tell me a change any time, for example "labor rate is 160", or switch to Repair order mode to try it.');
    Cp.chips([{ t: 'Go to Repair order', text: '__goro__', silent: true }]);
    return;
  }
  return askProfile(q);
}
handlers.profile = async function (text) {
  const t = text.trim();
  if (t === '__goro__') { setMode('ro'); return; }
  const q = S.pro.awaiting ? PQMAP[S.pro.awaiting] : null;
  if (q && /^(skip|pass|later|next|no thanks)\b/i.test(t)) {
    S.skipped.add(q.key); notify();
    await Cp.agent('Skipped. You can come back to it from the list.');
    return askNextProfile();
  }
  const saved = [];
  if (q) {
    const r = parseFor(q, t, true);
    if (r && r.amb) { await Cp.agent('Do you mean ' + r.amb.join(' or ') + '?'); Cp.chips(r.amb.map(o => ({ t: o, text: o }))); return; }
    if (r) { saveFact(q, r); saved.push(q); }
  }
  PQ.forEach(o => {
    if (saved.includes(o) || (q && o.key === q.key)) return;
    const r = parseFor(o, t, false);
    if (r && !r.amb) { saveFact(o, r); saved.push(o); }
  });
  if (!saved.length) {
    if (q) { await Cp.agent("I didn't catch that. " + q.hint); Cp.chips(chipsFor(q)); }
    else await Cp.agent('Tell me something about your shop, like "labor rate is 150", or tap a Change button on the right.');
    return;
  }
  notify();
  saved.forEach(o => Cp.event('Saved to shop memory · ' + o.key + ' = ' + S.profile[o.key].display));
  await Cp.agent(saved.length > 1 ? 'Got both, saved.' : 'Got it, saved.');
  return askNextProfile();
};
async function startProfile() {
  if (S.pro.started) return;
  S.pro.started = true;
  const n = PQ.filter(q => S.profile[q.key]).length;
  await Cp.agent("Hi, I'm the shop assistant. I'll ask a few quick questions about how your shop works and remember the answers, so my suggestions and pricing match you. Answer in your own words. You can skip anything.");
  if (n) await Cp.agent('Welcome back. ' + n + ' fact' + (n > 1 ? 's are' : ' is') + ' already saved for this shop.');
  return askNextProfile();
}

/* ================= repair order mode ================= */
async function nextPrompt() {
  const R = S.ro;
  if (!R.symptom.trim()) {
    R.awaiting = null;
    await Cr.agent("What's the customer describing? Their own words are fine.");
    Cr.chips([{ t: 'Grinding when braking', text: 'grinding noise when braking' }, { t: 'Check engine light on', text: 'check engine light is on and it idles rough' }, { t: "Won't start", text: "won't start, just clicks" }]);
    return;
  }
  if (!vehicleOk()) { R.awaiting = null; await Cr.agent("What's the year, make and model? I match the labor guide to the exact vehicle. A VIN works too."); return; }
  if (!miles()) { R.awaiting = null; await Cr.agent("What's the mileage? I check the maintenance schedule with it."); return; }
  const q = harness.nextQuestion();
  if (q) { R.awaiting = q.id; await Cr.agent(q.ask, 'Why I ask: ' + q.why); Cr.chips(q.options.map(o => ({ t: o, text: o }))); return; }
  R.awaiting = null;
  await Cr.agent("That's everything I need. Add anything you want to the repair order, or ask me for the total or why I suggested something.");
  const ms = maintState();
  Cr.chips([{ t: 'Add the top repair', text: 'add the top repair' }].concat(
    ms && ms.due ? [{ t: 'Add all due maintenance', text: 'add all due maintenance' }] : [],
    [{ t: "What's the total?", text: "what's the total" }, { t: 'Why the top pick?', text: 'why the top pick' }],
  ));
}

const ADD_RX = /\b(add|include|put|insert|throw in|yes add|go ahead and add)\b/i;
const REM_RX = /\b(remove|delete|take (?:it |that )?off|drop)\b/i;
const mentionsSymptom = t => ALLKW.some(k => t.includes(k));

handlers.ro = async function (text) {
  const R = S.ro, t = text.trim(), C = Cr;
  if (t === '__sample__') return handlers.ro(SAMPLE_MSG);
  if (t.indexOf('__refresh__') === 0) {
    notify();
    if (S.useAgent) {
      const what = t === '__refresh__concern' ? 'the customer concern' : 'the vehicle details';
      const out = await runRoAgent(C, 'I edited ' + what + ' on the repair order. Re-check the likely repairs and maintenance for the updated order.');
      if (out.ok) return;
    }
    return work({ refresh: true, symptomAdded: t === '__refresh__concern' });
  }
  if (t.indexOf('__add__') === 0) { const res = placeLine(t.slice(7)); notify(); return afterPlace(res, C); }
  if (t.indexOf('__swap__') === 0) {
    const [from, to] = t.slice(8).split('|');
    takeOff(from, C);
    const res = placeLine(to); notify();
    return afterPlace(res, C);
  }
  if (/^(new (job|ro|repair order|vehicle|customer)|start over|reset)\b/i.test(t)) { resetRO(); return startRO(); }
  if (/^(thanks|thank you|thx)\b/i.test(t)) return C.agent('Anytime.');
  if (/^(help|\?)$/i.test(t)) return C.agent('Tell me the vehicle and the symptom in one sentence, answer my follow-ups, and say things like "add the front brakes", "remove the alignment", "why the top pick" or "what\'s the total".');

  // With the agent on, only clear commands skip it; looser wording goes to the model.
  const cmd = S.useAgent;
  if ((cmd ? /^\s*(?:please\s+)?(?:remove|delete|take off|drop)\b/i : REM_RX).test(t) && !/\b(noise|leak)\b/i.test(t)) {
    const id = findItem(t, 'accepted');
    if (id) { const nm = ITEM(id).name; takeOff(id, C); notify(); return C.agent('Removed ' + nm + '.'); }
    return C.agent(R.accepted.size ? 'Which line? Say part of its name.' : 'There is nothing on the repair order yet.');
  }
  if ((cmd ? /^\s*(?:please\s+)?(?:add|include)\b/i : ADD_RX).test(t) && !/^\s*add\s*$/i.test(t)) {
    if (/\b(all|every|both)\b/i.test(t) && /\b(maint|due|schedule|service)/i.test(t)) {
      const ms = maintState();
      if (ms && ms.due) { const r = placeMaint(ms); notify(); return C.agent(maintSaid(r, ms)); }
      return C.agent('Nothing is due on the schedule yet. I need the mileage first.');
    }
    const id = findItem(t, 'suggest');
    if (id) {
      const res = placeLine(id);
      notify();
      if (res.action === 'add') await C.agent('Added. ' + (rate() ? '' : 'Tell me your labor rate and I will price it.'));
      return afterPlace(res, C);
    }
    const top = shownRepairs().slice(0, 3);
    if (!top.length) return C.agent("I don't have any suggestions to add yet. Describe the symptom first.");
    await C.agent('Which one?');
    return C.chips(top.map(x => ({ t: ITEM(x.id).name, text: 'add ' + ITEM(x.id).name })));
  }
  if (/\b(total|how much|price|cost|estimate|what do i owe)\b/i.test(t) && !mentionsSymptom(t.toLowerCase()) && (!cmd || t.split(/\s+/).length <= 6)) {
    const lines = [...R.accepted].map(ITEM).filter(Boolean), rt = rate();
    if (!lines.length) return C.agent('Nothing is on the repair order yet. Add a repair first.');
    const th = lines.reduce((a, i) => a + hrs(i), 0);
    return C.agent('Labor so far is ' + th.toFixed(1) + ' hours across ' + lines.length + ' line' + (lines.length > 1 ? 's' : '') + (rt ? ', which is ' + money(th * rt) + ' at your rate of $' + rt + ' an hour.' : '. I can price it once I know your labor rate. Say "labor rate is 145" or set it in Shop profile mode.') + ' Parts prices are not connected yet.');
  }
  if (/^why\b|\bwhy (is|are|did|does|the)\b|\bexplain\b|\bwhere.*(come|from)\b|\bsource\b/i.test(t)) {
    const id = findItem(t, 'suggest') || (shownRepairs()[0] && shownRepairs()[0].id);
    if (id) return C.agent(explain(id));
    return C.agent('I have no suggestions to explain yet.');
  }

  // a shop fact said in this conversation is saved to memory
  let mm, memNote = null;
  if ((mm = t.match(/(?:labou?r|shop)\s*rate\D{0,14}\$?\s*(\d+(?:\.\d+)?)/i)) || (mm = t.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:an hour|\/\s*h(?:ou)?r|per hour)/i))) {
    const v = parseFloat(mm[1]), q = PQMAP['shop.labor_rate'];
    if (v >= q.min && v <= q.max) {
      saveFact(q, { value: v, display: q.fmt(v) });
      memNote = 'Saved to shop memory · shop.labor_rate = ' + q.fmt(v);
      if (!/[a-z]{3,}.*[a-z]{3,}.*[a-z]{3,}/i.test(t.replace(mm[0], ''))) {
        C.event(memNote); notify();
        return C.agent('Got it. Labor is now priced at ' + q.fmt(v) + '.');
      }
    }
  }

  // Everything else goes to the agent. If the model cannot be reached, the scripted rules below take over.
  if (S.useAgent) {
    const out = await runRoAgent(C, t);
    if (out.ok) return;
    C.event('Assistant offline, using the scripted flow');
  }
  const PS = t.match(/^(?:please\s+|can you\s+|could you\s+)?(?:find|search(?:\s+for)?|look\s*up|lookup|quote|price\s+(?:of|for)|check\s+(?:the\s+)?price\s+(?:of|for)|what(?:'s|\s+is)\s+the\s+price\s+(?:of|for))\s+(?:me\s+)?(.+?)\s*$/i);
  if (PS && !/\btotal\b/i.test(t)) {
    const rest = PS[1].replace(/[.?!]+$/, '').trim();
    const pf = rest.match(/^parts?\s+(?:for|on)\s+(.+)$/i);
    if (pf) {
      const id = findItem(pf[1], 'accepted') || findItem(pf[1], 'suggest'), it = id && ITEM(id);
      if (!it || !it.parts.length) return C.agent('I could not tell which repair you mean, or it has no parts listed. Name the part instead, like "find brake pads".');
      for (const n of it.parts.slice(0, 3)) await runParts(n);
      return;
    }
    if (/^(?:the\s+|some\s+)?parts?$/i.test(rest)) {
      const names = [];
      [...R.accepted].map(ITEM).filter(Boolean).forEach(i => (i.parts || []).forEach(n => { if (!names.includes(n)) names.push(n); }));
      const top = shownRepairs()[0];
      if (!names.length && top) ITEM(top.id).parts.forEach(n => names.push(n));
      await C.agent('Which part? Type its name, or pick one from your repair.');
      return C.chips(names.slice(0, 5).map(n => ({ t: n, text: 'find ' + n })));
    }
    return runParts(rest.replace(/^(?:a|an|the|some)\s+/i, ''));
  }
  // vehicle, symptom and answers to the open question
  const beforeTop = shownRepairs().map(x => x.id);
  const ex = extractVehicle(mm && memNote ? t.replace(mm[0], ' ') : t);
  let rest = ex.rest, answeredQ = null, symptomAdded = false;
  if (R.awaiting) {
    const q = QBY[R.awaiting], m = matchOne(q.opts.map(o => o.l), rest || t);
    if (m && m.amb) { await C.agent('Do you mean ' + m.amb.join(' or ') + '?'); return C.chips(m.amb.map(o => ({ t: o, text: o }))); }
    if (m && m.o) { R.answers[q.id] = m.o; answeredQ = q; rest = ''; R.awaiting = null; }
  }
  if (!answeredQ && rest && hasContent(rest)) {
    const s = rest.replace(/^[a-z]/, c => c.toLowerCase());
    if (!R.symptom.toLowerCase().includes(s.toLowerCase())) { R.symptom = (R.symptom ? R.symptom.replace(/[.!?]?$/, '.') + ' ' : '') + rest; symptomAdded = true; }
  }
  if (!ex.changed.length && !answeredQ && !symptomAdded && !memNote) {
    await C.agent('I didn\'t catch a vehicle detail or a symptom in that. Try something like "2016 Civic, 88k miles, check engine light is on".');
    return C.chips([{ t: 'Use a sample', text: '__sample__', silent: true }]);
  }
  const say = [];
  if ((vehicleLine() || miles()) && ex.changed.length) say.push('Got it' + (vehicleLine() ? ': ' + vehicleLine() : '') + (miles() ? (vehicleLine() ? ', ' : ': ') + miles().toLocaleString() + ' mi' : '') + '.');
  if (symptomAdded) say.push('Noted the symptom.');
  if (answeredQ) say.push('Thanks, noted: ' + answeredQ.short.toLowerCase() + ' is ' + R.answers[answeredQ.id].toLowerCase() + '.');
  if (say.length) await C.agent(say.join(' '));
  const upd = [];
  if (ex.changed.length) upd.push('vehicle');
  if (symptomAdded || answeredQ) upd.push('concern');
  if (memNote) C.event(memNote);
  notify();
  if (upd.length) C.event('Repair order updated · ' + upd.join(', '));
  return work({ symptomAdded, answeredQ, beforeTop });
};

async function work(o) {
  const R = S.ro, C = Cr, hasSym = R.symptom.trim().length >= 3, ms = maintState();
  if (hasSym && (o.symptomAdded || o.answeredQ || !R.lastTop.length)) {
    await C.trace(['Read concern', 'Match repairs', 'Check labor guide', 'Check schedule', 'Harness picks follow-up']);
    const list = shownRepairs(), ids = list.map(x => x.id), beforeTop = o.beforeTop || [];
    if (!list.length) {
      await C.agent('Nothing in the labor guide matches that yet. Can you describe it a bit more?');
    } else if (o.answeredQ && R.lastTop.length) {
      const top = list.slice(0, 3).map(x => {
        const oi = R.lastTop.indexOf(x.id), ni = ids.indexOf(x.id);
        let mv = null;
        if (oi < 0) mv = 'New in the top three'; else if (ni < oi) mv = 'Moved up'; else if (ni > oi) mv = 'Moved down';
        return { mv, ...x };
      });
      const changedTop = beforeTop[0] !== ids[0];
      await C.agent(changedTop ? 'That moves ' + ITEM(ids[0]).name.toLowerCase() + ' to the top.' : ITEM(ids[0]).name + ' stays on top, and the match is stronger.');
      C.card({ type: 'repairs', snap: top, title: 'Updated ranking' });
    } else {
      const top = list.slice(0, 3).map(x => ({ mv: null, ...x }));
      await C.agent(o.refresh ? 'I re-checked the labor guide with your change.' : 'Here are the most likely repairs. Each one shows where the labor time comes from.');
      C.card({ type: 'repairs', snap: top, title: 'Likely repairs' });
    }
    R.lastTop = ids;
  }
  if (ms) {
    const key = ms.at + '|' + ms.due;
    if (R.shownMaint !== key) {
      R.shownMaint = key;
      if (ms.due) {
        if (!hasSym) await C.trace(['Check schedule']);
        await C.agent('At ' + miles().toLocaleString() + ' mi the ' + ms.at.toLocaleString() + ' mi service is due. Here is what the schedule lists.');
        C.card({ type: 'maint', ms });
      } else {
        await C.agent('Nothing is due on the maintenance schedule at ' + miles().toLocaleString() + ' mi. The next interval is ' + ms.at.toLocaleString() + ' mi, ' + ms.note + '.');
      }
    }
  }
  if (hasSym && !rate() && !R.rateNudged && R.accepted.size === 0) {
    R.rateNudged = true;
    await C.agent('One more thing. I do not know your labor rate yet, so I can only show hours. Tell me your rate here, like "labor rate is 145", and I will price every line.');
  }
  if (o.refresh && R.awaiting && vehicleOk() && miles()) return;
  return nextPrompt();
}

/* ----- adding a repair also prices the parts it needs ----- */
async function autoPriceParts(it) {
  const R = S.ro, C = Cr;
  const names = (it.parts || []).slice(0, 3);
  if (!names.length || R.autoPriced.has(it.id)) return;
  if (!vehicleOk()) {
    await C.agent('Once I have the year, make and model I can price the parts for ' + it.name.toLowerCase() + ' from NAPA.');
    return;
  }
  R.autoPriced.add(it.id);
  const fit = vehicleLine();
  await C.trace(['Read vehicle fitment', 'Look up ' + names.length + ' part' + (names.length > 1 ? 's' : '') + ' at NAPA', 'Read prices']);
  const results = await Promise.all(names.map(n => searchNapa({ year: R.year, make: R.make, model: R.model, part: n }).then(res => ({ n, res }))));
  const bad = results.find(r => !r.res.ok);
  if (bad && results.every(r => !r.res.ok)) {
    R.autoPriced.delete(it.id); // let a later add try again
    await C.agent(bad.res.message + ' No prices to show for ' + it.name.toLowerCase() + '.');
    return;
  }
  const found = results.filter(r => r.res.ok && r.res.parts.length);
  const missing = results.filter(r => !r.res.ok || !r.res.parts.length).map(r => r.n.replace(/\s*\(.*?\)\s*/g, ' ').trim());
  if (!found.length) {
    await C.agent('NAPA has no match on a ' + fit + ' for the parts this repair lists (' + missing.join(', ') + '). You can search by another name from the Parts box.');
    return;
  }
  await C.agent('Here are NAPA options for the parts ' + it.name.toLowerCase() + ' needs on the ' + fit + ', lowest list price first. Press Add to RO on the ones you want.');
  found.forEach(r => C.card({ type: 'parts', res: r.res, part: r.n, qty: qtyFromName(r.n), fit }));
  if (missing.length) await C.agent('No NAPA match for: ' + missing.join(', ') + '.');
}

/* ----- parts: look up the parts a repair suggests, priced from the NAPA catalog ----- */
async function runParts(part) {
  const R = S.ro, C = Cr;
  if (!vehicleOk()) {
    await C.agent('I need the year, make and model to check fitment first. A VIN works too.');
    return;
  }
  R.parts.lastQ = part;
  await C.trace(['Read vehicle fitment', 'Look up at NAPA', 'Match by part name', 'Read prices']);
  const res = await searchNapa({ year: R.year, make: R.make, model: R.model, part });
  if (!res.ok) {
    // Never show an estimate in place of a price.
    const hint = res.code === 'fitment_not_found' ? ' Check the year, make and model on the repair order.' : '';
    await C.agent(res.message + hint);
    return;
  }
  if (!res.parts.length) {
    await C.agent('NAPA has no match for "' + part + '" on a ' + vehicleLine() + '. Try the part name in other words, like "brake pads" or "oxygen sensor".');
    return;
  }
  const qty = qtyFromName(part);
  await C.agent('Here is ' + part.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase() + ' for the ' + vehicleLine() + ' from NAPA, lowest list price first.' + (res.cached ? ' (Saved result, under 5 minutes old.)' : ''));
  C.card({ type: 'parts', res, part, qty, fit: vehicleLine() });
}
export function searchPart(part) { Cr.send('find ' + part); }

function resetRO() {
  S.ro = { ...newRO(), started: true };
  Cr.clear();
}
async function startRO() {
  S.ro.started = true;
  await Cr.agent('Tell me about the vehicle and what\'s wrong, in your own words. For example: "2018 Corolla, 61k miles, grinding when I brake". You can also paste a VIN.');
  Cr.chips([{ t: 'Try a sample', text: '__sample__', silent: true }, { t: '2016 Civic, 88k, check engine light', text: '2016 Honda Civic 88,000 miles, check engine light is on and it idles rough' }]);
}

/* ================= actions called from the UI ================= */
export function boot() {
  if (S.booted) return;
  S.booted = true;
  setMode('profile');
}
export function setMode(m) {
  S.mode = m;
  notify();
  if (m === 'ro' && !S.ro.started) { S.ro.started = true; Cr.run(startRO); }
  if (m === 'profile' && !S.pro.started) Cp.run(startProfile);
}
export function editFact(key) {
  const q = PQMAP[key];
  S.skipped.delete(key);
  setMode('profile');
  Cp.user('Change ' + q.label.toLowerCase());
  Cp.run(() => askProfile(q));
}
export function resetProfile() {
  S.profile = {}; S.skipped = new Set(); persistProfile();
  S.pro.started = false; S.pro.awaiting = null;
  Cp.clear(); Cp.run(startProfile);
}
export function setUseAgent(on) {
  S.useAgent = on;
  Cr.event('Assistant · ' + (on ? 'agent (Gemma with tools)' : 'scripted rules'));
  notify();
}
export function newJob() { resetRO(); Cr.run(startRO); }

/* ----- labor guardrails: every line goes onto the order through checkAdd (laborRules.js) ----- */
function logAdd(id, extra = '') {
  const it = ITEM(id), rt = rate();
  Cr.event('Added to RO · ' + it.name + ' · ' + hrs(it).toFixed(1) + ' h' + (rt ? ' · ' + money(hrs(it) * rt) : '') + extra);
}

/**
 * Put a line on the order, or not, by the labor-guide rules: never the same job twice, never labor a
 * line already includes, add-on labor only next to its job, both sides as one job, and a standalone
 * job swapped for its cheaper add-on version when the related job is on the order. Changes the
 * order right away; afterPlace() says what happened.
 */
function placeLine(id) {
  if (!ITEM(id)) return { action: 'block', kind: 'unknown', reason: 'I could not find that line.' };
  const R = S.ro, d = checkAdd(id, [...R.accepted]);
  if (d.action === 'block') { Cr.event('Not added · ' + ITEM(id).name + ' · ' + d.reason); return { ...d, want: id }; }
  if (d.action === 'substitute') { R.accepted.add(d.id); logAdd(d.id, ' · add-on to ' + ITEM(d.parent).name); return { ...d, added: d.id }; }
  if (d.action === 'replace') {
    d.remove.forEach(x => R.accepted.delete(x));
    R.accepted.add(d.id);
    Cr.event('Replaced ' + d.remove.map(x => ITEM(x).name).join(', ') + ' with ' + ITEM(d.id).name + (d.saves > 0 ? ' · ' + d.saves.toFixed(1) + ' h less' : ''));
    return { ...d, added: d.id };
  }
  R.accepted.add(id);
  logAdd(id);
  return { action: 'add', added: id };
}

const hoursMoney = h => h.toFixed(1) + ' h' + (rate() ? ' (' + money(h * rate()) + ')' : '');

/** Tell the advisor what placeLine did, then offer what goes with the new line. */
async function afterPlace(res, C) {
  if (res.action === 'block') {
    await C.agent(res.reason);
    // the advisor may prefer the other row for the same job, e.g. a more specific one
    if (res.kind === 'duplicate' && res.by !== res.want) C.chips([{ t: 'Use ' + ITEM(res.want).name + ' instead', text: '__swap__' + res.by + '|' + res.want, silent: true }]);
    if (res.kind === 'orphan' && res.offer) C.chips([{ t: 'Quote ' + ITEM(res.offer).name + ' (' + ITEM(res.offer).hours.toFixed(1) + ' h)', text: '__add__' + res.offer, silent: true }]);
    return;
  }
  if (res.action === 'substitute' || res.action === 'replace') {
    await C.agent(res.reason + (res.saves > 0 ? ' That keeps ' + hoursMoney(res.saves) + ' off the bill.' : ''));
  }
  const it = ITEM(res.added);
  if (it.src === 'lg') await autoPriceParts(it);
  await offerAddOns(res.added, C);
}

/** Add-on labor for a job just added, each with a line the advisor can read to the customer. */
async function offerAddOns(id, C) {
  const ids = combinationsFor(id);
  if (ids.length) {
    await C.agent('This labor goes with ' + ITEM(id).name.toLowerCase() + ' and is cheaper to do now than on a separate visit. Each one has a line you can read to the customer.');
    C.card({ type: 'combos', parent: id, ids });
  }
  for (const f of followOnsFor(id, [...S.ro.accepted])) {
    await C.agent(ITEM(id).name + ' does not include ' + ITEM(f.id).name.toLowerCase() + '. ' + f.why);
    C.chips([{ t: 'Add ' + ITEM(f.id).name, text: '__add__' + f.id, silent: true }]);
  }
}

/** Take a line off, and any add-on labor that no longer has a job to go with. */
function takeOff(id, C) {
  const R = S.ro;
  if (!R.accepted.delete(id)) return;
  C.event('Removed from RO · ' + ITEM(id).name);
  const left = orphanedCombos([...R.accepted]);
  if (!left.length) return;
  left.forEach(x => { R.accepted.delete(x); C.event('Removed from RO · ' + ITEM(x).name + ' · add-on to ' + ITEM(id).name); });
  C.run(() => C.agent('I also took off ' + left.map(x => ITEM(x).name.toLowerCase()).join(', ') + ': add-on labor only applies while ' + ITEM(id).name.toLowerCase() + ' is on the order.'));
}

/** Add every due maintenance item through the same rules; report what was skipped and why. */
function placeMaint(ms) {
  const added = [], skipped = [];
  ms.ids.forEach(i => { const r = placeLine(i); (r.added ? added : skipped).push({ id: i, r }); });
  return { added, skipped };
}
const maintSaid = (r, ms) => 'Added ' + r.added.length + ' item' + (r.added.length === 1 ? '' : 's') + ' due at the ' + ms.at.toLocaleString() + ' mi service.'
  + (r.skipped.length ? ' Skipped ' + r.skipped.map(x => ITEM(x.id).name.toLowerCase() + ' (' + x.r.reason.replace(/\.$/, '') + ')').join('; ') + '.' : '');

export function acceptItem(id) {
  const res = placeLine(id);
  notify();
  Cr.run(() => afterPlace(res, Cr));
}
export function removeItem(id) { takeOff(id, Cr); notify(); }
export function dismissItem(id) { S.ro.dismissed.add(id); Cr.event('Set aside · ' + ITEM(id).name); notify(); }
export function restoreItem(id) { S.ro.dismissed.delete(id); notify(); }
export function addAllMaint() {
  const ms = maintState();
  if (!ms || !ms.due) return;
  const r = placeMaint(ms);
  notify();
  Cr.run(() => Cr.agent(maintSaid(r, ms)));
}
export function saveVehicle(v) {
  const R = S.ro;
  R.year = v.year.replace(/\D/g, '').slice(0, 4); R.make = v.make.trim(); R.model = v.model.trim(); R.engine = v.engine.trim();
  R.mileage = v.mileage.replace(/\D/g, ''); R.vin = v.vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  Cr.event('Vehicle edited by you · ' + (vehicleLine() || 'cleared'));
  notify();
  Cr.run(() => handlers.ro('__refresh__'));
}
export function saveConcern(symptom) {
  const R = S.ro;
  R.symptom = symptom.trim(); R.answers = {}; R.awaiting = null; R.lastTop = [];
  Cr.event('Concern edited by you');
  notify();
  Cr.run(() => handlers.ro('__refresh__concern'));
}
export function lineWhy(id) { Cr.user('Why is ' + ITEM(id).name + ' on the repair order?'); Cr.run(() => Cr.agent(explain(id))); }
export function addManual(name, hours) {
  const R = S.ro, id = 'x' + (R.nextCustom++), hv = isNaN(hours) || hours < 0 ? 0 : hours;
  R.custom[id] = { id, name, hours: hv, src: 'manual', ref: 'Entered by you', parts: [], detail: 'Entered by you. No labor-guide source.' };
  R.accepted.add(id);
  Cr.event('Added to RO · ' + name + ' · ' + hv.toFixed(1) + ' h · entered by you');
  notify();
}
export function addPart(row, label, qty, fit) {
  const key = row.lineCode + '|' + row.partNumber;
  if (partOn(key)) return;
  S.ro.parts.added.push({ key, label, description: row.description, lineCode: row.lineCode, partNumber: row.partNumber, brand: row.brand, quality: row.quality, each: row.listPrice, qty, fit });
  Cr.event('Added to RO · ' + label + ' · NAPA ' + row.lineCode + ' ' + row.partNumber + ' · ' + money(row.listPrice * qty));
  notify();
}
export function removePart(key) {
  const x = S.ro.parts.added.find(y => y.key === key);
  S.ro.parts.added = S.ro.parts.added.filter(y => y.key !== key);
  if (x) Cr.event('Removed from RO · ' + x.label + ' · NAPA ' + x.partNumber);
  notify();
}
export function setPartQty(key, n) {
  const x = S.ro.parts.added.find(y => y.key === key);
  if (!x || isNaN(n) || n < 1) { notify(); return; }
  const old = x.qty;
  x.qty = n;
  if (old !== n) Cr.event('Quantity changed · ' + x.label + ' · ' + old + ' to ' + n);
  notify();
}
export function changeHours(id, v) {
  const it = ITEM(id);
  if (!it || isNaN(v) || v < 0) { notify(); return; }
  const old = hrs(it);
  if (it.src === 'manual') it.hours = v; else S.ro.hoursOv[id] = v;
  const far = it.src !== 'manual' && it.hours > 0 && Math.abs(v - it.hours) / it.hours > 0.5;
  if (Math.abs(old - v) > 1e-9) Cr.event('Hours changed · ' + it.name + ' · ' + old.toFixed(1) + ' to ' + v.toFixed(1) + ' h' + (it.src === 'manual' ? '' : ' (guide says ' + it.hours.toFixed(1) + ' h)') + (far ? ' · more than 50% off the guide, check it' : ''));
  notify();
}
