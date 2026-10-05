// Mock of the Core harness. In production the harness (the agent) decides each turn: what to
// say, which cards to show, which question to ask next and why, and what to change on the
// repair order. The UI only renders what comes back. Here, keyword rules stand in for the agent.
// This file is the seam: replace turn handling with a streaming call and the UI stays as is.
import { S, notify, newRO, persistProfile } from './state';
import { createChat } from './chat';
import { PQ, PQMAP, FIXED, FIXEDMAP, SHOP, QBY, QWHY, SAMPLE_MSG, ALLKW } from './data';
import { matchOne } from './match';
import {
  money, ITEM, hrs, rate, miles, vehicleLine, vehicleOk, saveFact, parseFor,
  applicableQs, shownRepairs, maintState, extractVehicle, hasContent, findItem, explain,
  partOn, qtyFromName, combinationsFor, partQty, rankingDetail,
} from './logic';
import { checkAdd, orphanedCombos, followOnsFor } from './laborRules';
import { searchNapa, getNapaConfig } from './partsApi';
import { shopPick } from './partPolicy';
import { engineSpec } from './engineCylinders';
import { runRoAgent } from './roAgent';
import { useLineOps } from './roTools';
import { DEMOS } from './demoScenarios';
import { profileContext, offlineAnswer, exampleQuestions } from './howItWorks';
import { agentStep } from './agentApi';
import { interpretMaint } from './maintAdvice';
import { flow, resetFlow, nextStep, applyAnswers, recordPicked, MAX_ROUNDS, buildRecs } from './recommend';
import { maintMode, settingOption, orderAddOns } from './shopSettings';
import { buildPackage, packageLevels, packageLevel, prefetchPackageParts } from './packages';
import { partsFor, pricedPartNames } from './maintParts';
import { onResourceChange } from './liveResource';
import { beginTurn, endTurn, trace } from './trace';
import { prompt } from '../services/promptLoader';
import { policy, rankParts, pickReason } from './partPolicy';

const handlers = {};
export const Cp = createChat('profile', () => handlers.profile);
export const Cr = createChat('ro', () => runRo);

/** What a chat token stands for, as a turn title in the Agent trace. */
function turnTitle(t) {
  if (t.indexOf('__engine__') === 0) return 'Engine chosen: ' + t.slice(10);
  if (t.indexOf('__add__') === 0) return 'Add ' + (ITEM(t.slice(7)) ? ITEM(t.slice(7)).name : t.slice(7));
  if (t.indexOf('__swap__') === 0) return 'Swap lines';
  if (t === '__refresh__') return 'Vehicle edited on the RO';
  if (t === '__refresh__concern') return 'Concern edited on the RO';
  if (t === '__sample__') return 'Sample message';
  if (t === '__demo_next__') return 'Demo step';
  return t;
}
/** One advisor message (typed or a chip) = one Agent trace turn. */
async function runRo(text) {
  const turn = beginTurn('scripted', turnTitle(String(text).trim()));
  try { return await handlers.ro(text); } finally { endTurn(turn); }
}

const harness = {
  nextQuestion() {
    const q = applicableQs().find(x => !S.ro.answers[x.id]);
    return q ? { id: q.id, ask: q.ask, options: q.opts.map(o => o.l), why: QWHY[q.id] } : null;
  },
};

/* ================= shop profile mode ================= */
// Free flowing: the assistant states the shop (resources/shop) and keeps whatever the advisor says
// about how the shop works. Preferences it recognizes (PQ) become named facts; anything else is a note.
const isQuestion = t => /\?\s*$/.test(t) || /^(what|what's|whats|how|which|who|why|where|when|do|does|is|are|can|show|list|explain|tell me|describe|walk me)\b/i.test(t);
const userFacts = () => Object.keys(S.profile).filter(k => !FIXEDMAP[k] && (PQMAP[k] || k.startsWith('note.')));

function saveFixed() {
  FIXED.forEach(f => { if (!S.profile[f.key] || S.profile[f.key].value !== f.value) saveFact(f, { value: f.value, display: f.value }); });
}

function profileSummary() {
  const lines = FIXED.map(f => f.label + ': ' + f.value)
    .concat(userFacts().map(k => (S.profile[k].label || 'Note') + ': ' + S.profile[k].display));
  return 'Here is your shop profile.\n' + lines.map(l => '- ' + l).join('\n');
}

// "show me the NAPA config", "how are we connected to NAPA", "napa settings": the real configuration
const NAPA_CONFIG_RX = /\bnapa\b/i, CONFIG_WORDS_RX = /\b(config\w*|settings?|set ?up|connect\w*|catalog|credentials?|account|how)\b/i;

handlers.profile = async function (text) {
  const t = text.trim();
  if (t === '__goro__') { setMode('ro'); return; }
  if (!t) return;
  if (NAPA_CONFIG_RX.test(t) && CONFIG_WORDS_RX.test(t)) return showNapaConfig(Cp);
  const saved = [];
  // the answer to "do you mean A or B?" counts for that preference
  const q = S.pro.awaiting ? PQMAP[S.pro.awaiting] : null;
  S.pro.awaiting = null;
  if (q) { const r = parseFor(q, t, true); if (r && !r.amb) { saveFact(q, r); saved.push(q); } }
  for (const o of PQ) {
    if (saved.includes(o)) continue;
    const r = parseFor(o, t, false);
    if (r && r.amb) { S.pro.awaiting = o.key; await Cp.agent('Do you mean ' + r.amb.join(' or ') + '?'); Cp.chips(r.amb.map(x => ({ t: x, text: x }))); return; }
    if (r) { saveFact(o, r); saved.push(o); }
  }
  if (!saved.length) {
    if (isQuestion(t)) return answerAboutShop(t);
    if (t.split(/\s+/).length < 3) return Cp.agent('Tell me a bit more about how your shop works, like "labor rate is 165" or "we never do body work", and I will keep it in shop memory.');
    // not a preference I know by name: keep it as the advisor said it
    const key = 'note.' + Date.now();
    saveFact({ key, label: 'Note' }, { value: t, display: t });
    notify();
    Cp.event('Saved to shop memory · note');
    return Cp.agent('Saved to your shop profile as a note: "' + t + '".');
  }
  notify();
  saved.forEach(o => Cp.event('Saved to shop memory · ' + o.key + ' = ' + S.profile[o.key].display));
  return Cp.agent('Saved to your shop profile: ' + saved.map(o => o.label.toLowerCase() + ' ' + S.profile[o.key].display).join(', ') + '.');
};

/**
 * A question about the assistant or the shop's setup. Agent mode: the model answers from the
 * explanations in resources/shop/how_it_works.json and the current settings; offline or scripted:
 * those explanations answer by topic.
 */
async function answerAboutShop(t) {
  const turn = beginTurn(S.useAgent ? 'agent' : 'scripted', t);
  try {
    if (S.useAgent) {
      const hist = S.pro.history || (S.pro.history = []);
      hist.push({ role: 'user', content: t });
      const stop = Cp.typing();
      const out = await agentStep({ messages: hist.slice(-8), context: profileContext(), tools: [] });
      stop();
      const text = out.ok && out.message && String(out.message.content || '').trim();
      if (text) {
        hist.push({ role: 'assistant', content: text });
        trace('model', 'Shop profile answer', out.model || 'model', { question: t, answer: text, source: 'resources/shop/how_it_works.json + current settings' });
        return Cp.agent(text);
      }
      hist.pop();
      Cp.event('Assistant offline, answering from the built-in explanations');
    }
    const ans = offlineAnswer(t);
    trace('rule', 'Shop profile answer (offline)', 'Matched by topic in how_it_works.json', { question: t, answer: ans });
    return Cp.agent(ans);
  } finally { endTurn(turn); }
}

async function startProfile() {
  if (S.pro.started) return;
  S.pro.started = true;
  saveFixed();
  notify();
  for (const f of FIXED) await Cp.agent(f.say, f.why);
  const n = userFacts().length;
  await Cp.agent(n
    ? 'Welcome back. ' + n + ' thing' + (n > 1 ? 's are' : ' is') + ' saved in your shop profile. Tell me anything else about how you run the shop and I will keep it.'
    : 'Tell me anything about how you run the shop, in your own words: your labor rate, parts markup, how you talk to customers, work you never take. I will keep it in shop memory and use it on repair orders. You can also ask me how I work, like how I use the labor guide or scheduled maintenance.');
  Cp.chips(exampleQuestions().slice(0, 3).map(x => ({ t: x, text: x })).concat(SHOP.examples.slice(0, 2).map(x => ({ t: x, text: x })), [{ t: 'Go to Repair order', text: '__goro__', silent: true }]));
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
  // vehicle details and follow-ups are asked together on the question card (advanceFlow)
  if (!flow().shown) return;
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
      const out = await runRoAgent(C, prompt('core-ro-agent-edit-notice', { concern: t === '__refresh__concern' }));
      if (out.ok) { await advanceFlow(C); return; }
    }
    return work({ refresh: true, symptomAdded: t === '__refresh__concern' });
  }
  if (t === '__demo_next__') { demoStep(); return; }
  // a reply while the question card is open is an answer round, typed or not
  const F = flow();
  if (t.indexOf('__') !== 0 && R.symptom.trim() && !F.shown && F.askedRound === F.rounds) {
    F.rounds++;
    const got = applyAnswers(t, F.parts);
    if (got.length && t.split(/\s+/).length <= 8) {
      notify();
      C.event('Answers recorded · ' + got.map(g => g.value).join(', '));
      await C.agent('Thanks, noted: ' + got.map(g => g.value.toLowerCase()).join(', ') + '.');
      if (!(await advanceFlow(C))) await nextPrompt();
      return;
    }
  }
  if (t.indexOf('__engine__') === 0) {
    R.engine = t.slice(10);
    C.user(R.engine); // the chip is silent so its token is not shown; show the answer instead
    C.event('Vehicle updated · engine ' + R.engine);
    const said = cylSaid(resolveCylinderParts(C));
    notify();
    return C.agent('Got it, ' + R.engine + '.' + (said ? ' ' + said : ''));
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
      await afterPlace(res, C);
      return advanceFlow(C); // work on the order means the advisor has decided: recommendations now
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
    // the model records and rewrites; asking the combined question and showing recommendations is the app's
    if (out.ok) { await advanceFlow(C); return; }
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
  if (ex.changed.length) { const said = cylSaid(resolveCylinderParts(C)); if (said) await C.agent(said); }
  return work({ symptomAdded, answeredQ, beforeTop });
};

async function work(o) {
  const R = S.ro, C = Cr, hasSym = R.symptom.trim().length >= 3, ms = maintState();
  if (hasSym && (o.symptomAdded || o.answeredQ || !R.lastTop.length)) {
    await C.trace(['Read concern', 'Match repairs', 'Check labor guide', 'Check schedule', 'Harness picks follow-up']);
    const list = shownRepairs(), ids = list.map(x => x.id);
    // the repairs are shown in the Recommendations card once the question round is done
    if (!list.length && !(ms && ms.due)) await C.agent('Nothing in the labor guide matches that yet. Can you describe it a bit more?');
    trace('rule', 'Rank repairs (labor guide)', list.length ? 'Top: ' + list.slice(0, 3).map(x => ITEM(x.id).name + ' (' + x.score + ')').join(', ') : 'No labor-guide row matches', rankingDetail(list));
    R.lastTop = ids;
  }
  if (ms) {
    const key = ms.at + '|' + ms.due;
    if (R.shownMaint !== key) {
      R.shownMaint = key;
      trace('rule', 'Maintenance schedule', (ms.due ? ms.at.toLocaleString() + ' mi service due: ' + ms.ids.length + ' items' : 'Nothing due; next ' + ms.at.toLocaleString() + ' mi') + ' · ' + ms.source,
        { rule: 'Pick the schedule by VIN mask, else the make default, else generic; due when mileage is within the window of a milestone. Presented per the shop setting: ' + settingOption('maint.presentation').label + '.', presentation: maintMode(), mileage: miles(), source: ms.source, match: ms.match, vinMask: ms.vinMask, interval_mi: ms.at, due: ms.due, items: ms.ids.map(i => ITEM(i) ? ITEM(i).name : i) });
      // shown in the Recommendations card's maintenance section
    }
  }
  if (hasSym && !rate() && !R.rateNudged && R.accepted.size === 0) {
    R.rateNudged = true;
    await C.agent('One more thing. I do not know your labor rate yet, so I can only show hours. Tell me your rate here, like "labor rate is 145", and I will price every line.');
  }
  if (await advanceFlow(C)) return;
  return nextPrompt();
}

/* ----- the flow before recommendations: one combined question, at most two rounds (recommend.js) ----- */
const RECS_CHIPS = () => [{ t: 'Add the top repair', text: 'add the top repair' }].concat(
  maintState() && maintState().due ? [{ t: 'Add all due maintenance', text: 'add all due maintenance' }] : [],
  [{ t: "What's the total?", text: "what's the total" }]);

/** Ask the combined question or show the recommendations, whichever is next. True if it posted. */
async function advanceFlow(C) {
  const st = nextStep(), f = flow();
  if (st.do === 'ask') {
    f.askedRound = f.rounds; f.parts = st.parts;
    trace('rule', 'Combined question', 'Round ' + st.round + ': ' + st.parts.map(p => p.short).join(' · '),
      { rule: 'One question with everything still needed: vehicle details first, then the follow-ups that move the most top repairs. Recommendations show when nothing is left or after ' + MAX_ROUNDS + ' answer rounds.', round: st.round, parts: st.parts });
    await C.agent(st.parts.length > 1 ? 'Before I recommend anything, ' + st.parts.length + ' quick questions. Answer on the card, or type it all in one line.' : 'Before I recommend anything, one quick question.');
    C.card({ type: 'questions', parts: st.parts, askedAt: f.rounds, round: st.round });
    return true;
  }
  if (st.do === 'show') {
    f.shown = true;
    trace('rule', 'Recommendations', 'Shown after ' + f.rounds + ' answer round' + (f.rounds === 1 ? '' : 's'),
      { rule: 'Three sections: likely repairs, scheduled maintenance, labor-guide recommendations, each with a customer talk track.', rounds: f.rounds, answers: { ...S.ro.answers } });
    // the prepackaged estimate first (the shop's severity level), then each recommendation on its own
    const pk = hasPackage();
    await C.agent(pk
      ? 'Here is the prepackaged estimate at your shop\'s severity level, then each recommendation on its own: likely repairs, scheduled maintenance, and labor-guide recommendations, with what to say to the customer.'
      : 'Here is what I recommend, in three parts: likely repairs, scheduled maintenance, and labor-guide recommendations. Each has what to say to the customer; open any line for the detail.');
    if (pk) postPackage(C);
    C.card({ type: 'recs', individual: pk });
    C.chips(RECS_CHIPS());
    return true;
  }
  return false;
}

/** Answers picked on the question card. Nothing picked (Skip) shows the recommendations now. */
export function answerQuestions(picked, parts) {
  const f = flow();
  const got = recordPicked(picked);
  Cr.user(got.length ? got.map(g => g.value).join(' · ') : 'Skip the questions');
  f.rounds = got.length ? f.rounds + 1 : MAX_ROUNDS;
  if (got.some(g => g.id === 'veh' || g.id === 'mi')) Cr.event('Repair order updated · vehicle');
  if (got.length) Cr.event('Answers recorded · ' + got.map(g => g.value).join(', '));
  notify();
  Cr.run(async () => {
    if (got.length) await Cr.agent('Thanks, noted: ' + got.map(g => g.value.toLowerCase()).join(', ') + '.');
    if (!(await advanceFlow(Cr))) await nextPrompt();
  });
}

/* ----- adding a repair also prices the parts it needs ----- */
async function autoPriceParts(it, quiet = false) {
  const R = S.ro, C = Cr;
  // labor-guide rows list their parts; maintenance lines get them from maintenance_parts.json
  const names = pricedPartNames(it);
  if (!names.length || R.autoPriced.has(it.id)) return { added: [], notPriced: [] };
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
  // The shop decides: put the shop pick for each part on the RO (availability first, then lowest
  // price). A part already on the RO for the same need (e.g. a hardware kit shared with another
  // brake job) is not added twice.
  const added = [], unpriced = [], waiting = [], diesel = [];
  let ask = null;
  found.forEach(r => {
    const pick = shopPick(r.res.parts), q = partQty(r.n, it);
    traceParts(r.n, r.res, pick, q, it);
    if (!pick) { unpriced.push(r.n.replace(/\s*\(.*?\)\s*/g, ' ').trim()); return; }
    if (R.parts.added.some(x => x.label === r.n || x.key === pick.lineCode + '|' + pick.partNumber)) return;
    if (q.need === 'diesel') { diesel.push(r.n); return; }
    // one per cylinder, and the engine is not known yet: hold the part until it is
    if (q.qty === null) { R.needCyl.push({ forLine: it.id, part: r.n, res: r.res, fit }); waiting.push(r.n); ask = q; return; }
    addPart(pick, r.n, q.qty, fit, it.id, q.perCyl);
    added.push({ part: r.n, part_number: pick.lineCode + ' ' + pick.partNumber, qty: q.qty, each: pick.listPrice, availability: pick.availability ? pick.availability.short : undefined, per_cylinder: q.perCyl || undefined });
  });
  if (!quiet) {
    if (added.length) {
      await C.agent('I put the shop picks for ' + it.name.toLowerCase() + ' on the RO, by your rule (availability first, then lowest price): '
        + added.map(a => a.part.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase() + ' ' + a.part_number + (a.qty > 1 ? ', ' + a.qty + ' x ' : ', ') + money(a.each) + (a.availability ? ', ' + a.availability : '')).join('; ')
        + '. The other NAPA options are below if you want to swap one.');
    } else {
      await C.agent('Here are NAPA options for the parts ' + it.name.toLowerCase() + ' needs on the ' + fit + ', ordered by your rule: availability first, then lowest price.');
    }
  }
  found.forEach(r => { const q = partQty(r.n, it); C.card({ type: 'parts', res: r.res, part: r.n, qty: q.qty, perCyl: q.perCyl, fit }); });
  const none = missing.concat(unpriced);
  if (none.length && !quiet) await C.agent('Not on the RO, no NAPA price to use: ' + none.join(', ') + '. Add it by hand if the job needs it.');
  const manual = partsFor(it).filter(p => p.price === false);
  if (manual.length && !quiet) await C.agent('Add by hand: ' + manual.map(p => p.confirm || p.name).join('; ') + '.');
  if (diesel.length && !quiet) await C.agent('No ' + diesel.map(n => n.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase()).join(' or ') + ' on the RO: the ' + (S.ro.engine || 'engine') + ' is a diesel.');
  if (waiting.length && !quiet) await askEngine(C, waiting, ask);
  return { added, notPriced: none, waitingForEngine: waiting.length ? { parts: waiting, options: (ask.options || []).map(e => e.engine + ' (' + e.cylinders + ' cyl)') } : null, diesel };
}

/** Agent trace: how the shop pick and the quantity were chosen for one part. */
function traceParts(part, res, pick, q, line) {
  const sp = q.perCyl ? engineSpec() : null;
  const qtyRule = q.perCyl
    ? (q.need === 'diesel' ? 'none: diesel engine' : q.qty === null ? 'one per cylinder; engine unknown (' + q.need + '), asking which engine' : 'one per cylinder: ' + q.qty + ' (from ' + (sp.source === 'engine' ? 'the engine on the RO' : 'engine_cylinders.json, every engine for this vehicle') + ')')
    : (q.qty > 1 ? q.qty + ' from "(' + q.qty + ')" in the part name' : '1');
  trace('rule', 'Parts pick · ' + part, pick ? (pick.lineCode + ' ' + pick.partNumber + ' · ' + money(pick.listPrice) + (pick.availability ? ' · ' + pick.availability.short : '') + ' · qty ' + (q.qty === null ? '?' : q.qty)) : 'No NAPA option with a price',
    { rule: 'Shop parts policy: ' + policy().label + '. Unpriced options last. Availability is ' + (res.availabilityBasis || 'not provided') + '.',
      for_line: line ? line.name : null, quantity_rule: qtyRule, pick: pick ? pick.lineCode + ' ' + pick.partNumber : null, why: pickReason(res.parts, pick),
      ranked: rankParts(res.parts).map(r => ({ part_number: r.lineCode + ' ' + r.partNumber, brand: r.brand, list_price: r.listPrice, availability: r.availability ? r.availability.label : null })) });
}

/** Ask which engine, because spark plugs and coils are one per cylinder. Options come from the resource. */
async function askEngine(C, parts, q) {
  const names = parts.map(n => n.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase()).join(' and ');
  await C.agent('Which engine does the ' + vehicleLine() + ' have? I need the cylinder count for the ' + names + ', one per cylinder.',
    q && q.options && q.options.length ? 'Why I ask: this vehicle came with engines of different cylinder counts.' : 'Why I ask: I do not have this vehicle in the engine list.');
  const opts = q && q.options && q.options.length
    ? q.options.map(e => ({ t: e.engine + ' (' + e.cylinders + ' cyl)', text: '__engine__' + e.engine, silent: true }))
    : [4, 6, 8].map(n => ({ t: n + ' cylinders', text: '__engine__' + n + '-cyl', silent: true }));
  C.chips(opts);
}

/**
 * The engine changed or became known: set every per-cylinder part on the RO to one per cylinder
 * (none on a diesel) and add the parts that were waiting for it.
 */
export function resolveCylinderParts(C = Cr) {
  const R = S.ro, sp = engineSpec(), out = { cylinders: sp.cylinders, diesel: sp.diesel, updated: [], added: [], removed: [] };
  if (!sp.cylinders && !sp.diesel) return out;
  if (R.needCyl.length || R.parts.added.some(x => x.perCyl)) {
    trace('rule', 'Cylinder count', (sp.diesel ? 'Diesel' : sp.cylinders + ' cylinders') + ' · from ' + (sp.source === 'engine' ? 'engine ' + R.engine : 'engine_cylinders.json'),
      { rule: 'Engine layout on the RO (V6, I4, ...), else its displacement matched in engine_cylinders.json, else the file when every engine for the vehicle has the same count. Spark plugs and ignition coils on replace-all jobs are one per cylinder; none on a diesel.', engine: R.engine, spec: sp, waiting: R.needCyl.map(x => x.part) });
  }
  if (sp.diesel) {
    R.parts.added.filter(x => x.perCyl).forEach(x => { out.removed.push(x.label); C.event('Removed from RO · ' + x.label + ' · diesel engine'); });
    R.parts.added = R.parts.added.filter(x => !x.perCyl);
    R.needCyl = [];
    return out;
  }
  R.parts.added.forEach(x => {
    if (x.perCyl && x.qty !== sp.cylinders) {
      C.event('Quantity changed · ' + x.label + ' · ' + x.qty + ' to ' + sp.cylinders + ' (one per cylinder)');
      x.qty = sp.cylinders; out.updated.push(x.label);
    }
  });
  const pend = R.needCyl;
  R.needCyl = [];
  pend.forEach(p => {
    if (!R.accepted.has(p.forLine)) return;
    const pick = shopPick(p.res.parts);
    if (!pick || partOn(pick.lineCode + '|' + pick.partNumber)) return;
    addPart(pick, p.part, sp.cylinders, p.fit, p.forLine, true);
    out.added.push({ part: p.part, part_number: pick.lineCode + ' ' + pick.partNumber, qty: sp.cylinders, each: pick.listPrice, availability: pick.availability ? pick.availability.short : undefined });
  });
  return out;
}

/** One sentence on what resolveCylinderParts did, or '' when nothing changed. */
function cylSaid(o) {
  if (o.diesel) return o.removed.length ? 'That is a diesel, so I took the ' + o.removed.join(', ').toLowerCase() + ' off the RO.' : '';
  const bits = o.added.map(a => a.part.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase() + ' ' + a.part_number + ', ' + a.qty + ' x ' + money(a.each) + (a.availability ? ', ' + a.availability : ''))
    .concat(o.updated.map(l => l.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase() + ' now ' + o.cylinders));
  return bits.length ? o.cylinders + ' cylinders, one per cylinder: ' + bits.join('; ') + '.' : '';
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
  const q = partQty(part), qty = q.qty;
  traceParts(part, res, shopPick(res.parts), q, null);
  await C.agent('Here is ' + part.replace(/\s*\(.*?\)\s*/g, ' ').trim().toLowerCase() + ' for the ' + vehicleLine() + ' from NAPA, availability first, then lowest price. The shop pick is marked.' + (res.cached ? ' (Saved result, under 5 minutes old.)' : ''));
  C.card({ type: 'parts', res, part, qty, perCyl: q.perCyl, fit: vehicleLine() });
  if (q.need === 'ask' || q.need === 'unknown') await askEngine(C, [part], q);
}
export function searchPart(part) { Cr.send('find ' + part); }

function resetRO() {
  S.ro = { ...newRO(), started: true };
  Cr.clear();
}
async function startRO() {
  S.ro.started = true;
  await Cr.agent('Tell me about the vehicle and what\'s wrong, in your own words. For example: "2018 Corolla, 61k miles, grinding when I brake". You can also paste a VIN.');
  // one-click openers from resources/demo: each sends an advisor-style message, typos and all
  Cr.chips((DEMOS.starters || []).map(x => ({ t: x.label, text: x.text })));
}

/* ================= click-through demos (resources/demo/core_demo_scenarios.json) ================= */
export const demoList = () => DEMOS.scenarios.map(d => ({ id: d.id, title: d.title }));
const demoNow = () => S.demo && DEMOS.scenarios.find(d => d.id === S.demo.id);

/** Send the demo's next message as if the advisor typed it, then offer the step after it. */
function demoStep() {
  const d = demoNow();
  const st = d && d.steps[S.demo.step];
  if (!st) return;
  S.demo.step++;
  Cr.send(st.text).then(() => {
    if (demoNow() !== d) return; // another demo or a new job started meanwhile
    const nx = d.steps[S.demo.step];
    if (nx) Cr.chips([{ t: 'Next: ' + nx.label, text: '__demo_next__', silent: true }, ...S.chats.ro.chips]);
    else { Cr.event('Demo finished · ' + d.title); S.demo = null; }
  });
}

/** Start a demo on a fresh repair order, with the agent on and a labor rate for pricing. */
export function runDemo(id) {
  const d = DEMOS.scenarios.find(x => x.id === id);
  if (!d) return;
  if (S.mode !== 'ro') { S.mode = 'ro'; }
  resetRO();
  S.useAgent = true;
  if (!rate()) {
    // session only: not written to shop memory
    S.profile['shop.labor_rate'] = { value: DEMOS.laborRate, display: '$' + DEMOS.laborRate + '/hr', at: Date.now() };
  }
  S.demo = { id, step: 0 };
  notify();
  Cr.run(async () => {
    await Cr.agent(d.intro);
    Cr.chips([{ t: 'Start: ' + d.steps[0].label, text: '__demo_next__', silent: true }]);
  });
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
/** Forget something the advisor told the shop profile. The shop itself and the supplier stay. */
export function forgetFact(key) {
  if (FIXEDMAP[key] || !S.profile[key]) return;
  const f = S.profile[key];
  delete S.profile[key];
  persistProfile();
  Cp.event('Removed from shop memory · ' + (f.label || key));
  notify();
}
export function resetProfile() {
  S.profile = {}; S.skipped = new Set(); persistProfile();
  S.pro.started = false; S.pro.awaiting = null;
  Cp.clear(); Cp.run(startProfile);
}
/**
 * Mock sign-in (SignIn.jsx): each login starts the shop profile fresh: nothing saved, settings at
 * their defaults, a new greeting on the Shop profile tab.
 */
export function signIn(email) {
  S.auth = { email, at: Date.now() };
  S.profile = {}; S.skipped = new Set(); persistProfile();
  S.pro = { awaiting: null, started: false, history: [] };
  Cp.clear();
  S.mode = 'profile';
  notify();
  // first login boots the assistant (CoreAssistantApp), which greets; later logins greet here
  if (S.booted) Cp.run(startProfile);
}
export function setUseAgent(on) {
  S.useAgent = on;
  Cr.event('Assistant · ' + (on ? 'agent (Gemma with tools)' : 'scripted rules'));
  notify();
}
export function newJob() { S.demo = null; resetRO(); Cr.run(startRO); }

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
  trace('rule', 'Labor rules · ' + ITEM(id).name, d.action === 'add' ? 'Added: no duplicate, covered or add-on conflict' : d.action + (d.kind ? ' (' + d.kind + ')' : '') + ': ' + d.reason,
    { rule: 'checkAdd: block duplicates and lines another line already covers; an add-on needs its main job on the order; a job with a cheaper add-on version while its main job is on the order is added as the add-on; a both-sides row replaces left + right.', line: ITEM(id).name, guide_row: ITEM(id).ref, on_order: [...R.accepted].map(x => ITEM(x) ? ITEM(x).name : x), decision: d });
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

/**
 * Tell the advisor what placeLine did, then offer what goes with the new line. quiet: the agent
 * will say it in its own reply, so only the cards and chips are posted here.
 */
async function afterPlace(res, C, { quiet = false } = {}) {
  if (res.action === 'block') {
    if (quiet) return;
    await C.agent(res.reason);
    // the advisor may prefer the other row for the same job, e.g. a more specific one
    if (res.kind === 'duplicate' && res.by !== res.want) C.chips([{ t: 'Use ' + ITEM(res.want).name + ' instead', text: '__swap__' + res.by + '|' + res.want, silent: true }]);
    if (res.kind === 'orphan' && res.offer) C.chips([{ t: 'Quote ' + ITEM(res.offer).name + ' (' + ITEM(res.offer).hours.toFixed(1) + ' h)', text: '__add__' + res.offer, silent: true }]);
    return;
  }
  if (!quiet && (res.action === 'substitute' || res.action === 'replace')) {
    await C.agent(res.reason + (res.saves > 0 ? ' That keeps ' + hoursMoney(res.saves) + ' off the bill.' : ''));
  }
  const it = ITEM(res.added);
  const parts = partsFor(it).length ? await autoPriceParts(it, quiet) : null;
  await offerAddOns(res.added, C, quiet);
  return { parts };
}

/** Add-on labor for a job just added, each with a line the advisor can read to the customer. */
async function offerAddOns(id, C, quiet = false) {
  const ids = orderAddOns(combinationsFor(id)); // shop setting: what matters first, or the guide's order
  if (ITEM(id) && ITEM(id).laborType === 'OPERATION') {
    trace('rule', 'Add-on labor for ' + ITEM(id).name, ids.length ? ids.length + ' offered: ' + ids.map(c => ITEM(c).name).join(', ') : 'None offered',
      { rule: 'COMBINATION rows in the labor guide with the same LaborComponent as this OPERATION, minus any already on the order, the same job as a line on the order, covered by one, or set aside. Labels and customer wording come from the enrichment file (talk.kind).', component: ITEM(id).component,
        offered: ids.map(c => ({ name: ITEM(c).name, guide_row: ITEM(c).ref, hours: ITEM(c).hours, kind: ITEM(c).talk ? ITEM(c).talk.kind : null })) });
  }
  if (ids.length) {
    if (!quiet) await C.agent('This labor goes with ' + ITEM(id).name.toLowerCase() + ' and is cheaper to do now than on a separate visit. Each one has a line you can read to the customer.');
    C.card({ type: 'combos', parent: id, ids });
  }
  for (const f of followOnsFor(id, [...S.ro.accepted])) {
    trace('rule', 'Not included: ' + ITEM(f.id).name, f.why, { rule: 'followOn: the labor row note says this job is not included, so it is offered separately.', for: ITEM(id).name, note: ITEM(id).note, suggest: ITEM(f.id).name });
    if (!quiet) await C.agent(ITEM(id).name + ' does not include ' + ITEM(f.id).name.toLowerCase() + '. ' + f.why);
    C.chips([{ t: 'Add ' + ITEM(f.id).name, text: '__add__' + f.id, silent: true }]);
  }
}

/** Take a line off, and any add-on labor that no longer has a job to go with. */
function takeOff(id, C) {
  const R = S.ro;
  if (!R.accepted.delete(id)) return;
  C.event('Removed from RO · ' + ITEM(id).name);
  // the parts picked for this line go with it; a re-add picks them again
  R.parts.added.filter(x => x.forLine === id).forEach(x => C.event('Removed from RO · ' + x.label + ' · NAPA ' + x.partNumber + ' · part for ' + ITEM(id).name));
  R.parts.added = R.parts.added.filter(x => x.forLine !== id);
  R.needCyl = R.needCyl.filter(x => x.forLine !== id);
  R.autoPriced.delete(id);
  const left = orphanedCombos([...R.accepted]);
  if (!left.length) return;
  left.forEach(x => { R.accepted.delete(x); C.event('Removed from RO · ' + ITEM(x).name + ' · add-on to ' + ITEM(id).name); });
  C.run(() => C.agent('I also took off ' + left.map(x => ITEM(x).name.toLowerCase()).join(', ') + ': add-on labor only applies while ' + ITEM(id).name.toLowerCase() + ' is on the order.'));
}

/** Add every due maintenance item through the same rules; report what was skipped and why. */
function placeMaint(ms, ids = ms.ids) {
  const added = [], skipped = [];
  ids.filter(i => !S.ro.accepted.has(i)).forEach(i => { const r = placeLine(i); (r.added ? added : skipped).push({ id: i, r }); });
  return { added, skipped };
}
const maintSaid = (r, ms) => 'Added ' + r.added.length + ' item' + (r.added.length === 1 ? '' : 's') + ' due at the ' + ms.at.toLocaleString() + ' mi service.'
  + (r.skipped.length ? ' Skipped ' + r.skipped.map(x => ITEM(x.id).name.toLowerCase() + ' (' + x.r.reason.replace(/\.$/, '') + ')').join('; ') + '.' : '');

useLineOps({ place: placeLine, after: afterPlace, cylinders: resolveCylinderParts });
// a file under resources/ changed and was reloaded: a debugging detail, so it goes to the Agent trace, not the chat
onResourceChange('harness.log', name => trace('note', 'Reloaded ' + name, 'from resources/ (dev server hot update)'));

export function acceptItem(id) {
  const turn = beginTurn('ui', 'Add to RO · ' + (ITEM(id) ? ITEM(id).name : id));
  const res = placeLine(id);
  notify();
  Cr.run(async () => { try { await afterPlace(res, Cr); await advanceFlow(Cr); } finally { endTurn(turn); } });
}
export function removeItem(id) { takeOff(id, Cr); notify(); }
export function dismissItem(id) { S.ro.dismissed.add(id); Cr.event('Set aside · ' + ITEM(id).name); notify(); }
export function restoreItem(id) { S.ro.dismissed.delete(id); notify(); }
/** Whether the shop's severity level has anything to package for this order. */
const hasPackage = () => buildPackage(packageLevel()).items.length > 0;

/** Shop profile: the NAPA configuration as the server uses it (secrets never sent to the browser). */
async function showNapaConfig(C) {
  await C.trace(['Read NAPA connection settings', 'Read shop parts rules']);
  const r = await getNapaConfig();
  if (!r.ok) { await C.agent(r.message); return; }
  trace('rule', 'NAPA configuration', r.config.connection.catalogApiUrl.value + ' · DC ' + r.config.connection.dcId.value, { config: { ...r.config, terms: r.config.terms.length + ' rules' } });
  await C.agent('Here is how WrenchIQ connects to NAPA for this shop: the catalog endpoint and account IDs it sends, how a part is looked up, how prices and availability are read, and your shop\'s parts rules. Store credentials are never shown.');
  C.card({ type: 'napaConfig', config: r.config });
}

/** The prepackaged estimate at the shop's severity level (packages.js), as a card with the totals. */
function postPackage(C) {
  const recs = buildRecs(), lv = packageLevel(), pk = buildPackage(lv, recs), all = packageLevels(recs);
  if (!pk.items.length) return;
  prefetchPackageParts(recs);
  trace('rule', 'Prepackaged estimate', settingOption('package.severity').label + ': ' + pk.items.length + ' lines' + (pk.total !== null ? ', ' + money(pk.total) + (pk.partsPending ? ' + parts pending' : '') : ''),
    { rule: 'Severity per line: high = the customer\'s concern, safety maintenance, add-ons that are part of the job; medium = engine-protecting maintenance, the inspection, recommended add-ons, jobs the repair does not include; low = comfort maintenance, if-needed and optional add-ons. A level packages its severity and above, through the same labor rules as Add to RO. Total = labor at the shop rate + parts at the shop pick.',
      level: lv, items: pk.items.map(i => ({ name: i.name, severity: i.severity, why: i.why })), skipped: pk.skipped.map(i => ({ name: i.name, reason: i.reason })), confirm: pk.confirm,
      totals: Object.fromEntries(Object.entries(all).map(([k, v]) => [k, { lines: v.items.length, hours: Math.round(v.hours * 10) / 10, total: v.total }])) });
  C.card({ type: 'package' });
}

/** Put every line of a package on the RO through the labor rules; parts follow as for Add to RO. */
export function addPackage(level = packageLevel()) {
  const pk = buildPackage(level);
  const turn = beginTurn('ui', 'Add package to RO · severity ' + level);
  const results = pk.items.filter(i => !i.onOrder).map(i => ({ i, res: placeLine(i.id) }));
  notify();
  Cr.run(async () => {
    try {
      const added = results.filter(r => r.res.added).map(r => ITEM(r.res.added).name);
      const notAdded = results.filter(r => !r.res.added).map(r => ITEM(r.i.id).name + ' (' + r.res.reason + ')');
      await Cr.agent((added.length || notAdded.length
        ? 'Added the ' + level + '-severity package: ' + added.length + ' line' + (added.length === 1 ? '' : 's') + '.'
        : 'The ' + level + '-severity package lines are already on the RO; adding their parts at the shop pick.') + (notAdded.length ? ' Not added: ' + notAdded.join('; ') + '.' : '')
        + (pk.confirm.length ? ' Before the final estimate, confirm: ' + [...new Set(pk.confirm.map(c => c.line.replace(/,.*$/, '') + ': ' + c.what.charAt(0).toLowerCase() + c.what.slice(1)))].join('; ') + '.' : ''));
      // parts at the shop's pick for each labor-guide line; add-ons are already in the package
      // parts for every line in the package, including lines that were already on the RO without them
      const lineIds = results.filter(r => r.res.added).map(r => r.res.added).concat(pk.items.filter(i => i.onOrder).map(i => i.id));
      for (const id of lineIds) { const it = ITEM(id); if (it && partsFor(it).length && S.ro.accepted.has(id)) await autoPriceParts(it, true); }
      if (S.ro.needCyl.length) await askEngine(Cr, S.ro.needCyl.map(x => x.part), { options: engineSpec().options });
    } finally { endTurn(turn); }
  });
}

/** which: 'recommended' (safety + engine items and the inspection, see maintAdvice.js) or 'all'. */
export function addAllMaint(which = 'all') {
  const ms = maintState();
  if (!ms || !ms.due) return;
  const turn = beginTurn('ui', which === 'recommended' ? 'Add recommended maintenance' : 'Add all due maintenance');
  const adv = which === 'recommended' && interpretMaint(ms, { rate: rate(), accepted: [...S.ro.accepted], make: S.ro.make });
  const r = placeMaint(ms, adv ? adv.recommendedIds : ms.ids);
  notify();
  Cr.run(async () => {
    try {
      await Cr.agent(maintSaid(r, ms));
      // the lines' parts at the shop pick, as for a single Add (maintenance_parts.json)
      for (const x of r.added) { const it = ITEM(x.r.added); if (it && partsFor(it).length) await autoPriceParts(it, true); }
      if (S.ro.needCyl.length) await askEngine(Cr, S.ro.needCyl.map(x => x.part), { options: engineSpec().options });
    } finally { endTurn(turn); }
  });
}
export function saveVehicle(v) {
  const R = S.ro;
  R.year = v.year.replace(/\D/g, '').slice(0, 4); R.make = v.make.trim(); R.model = v.model.trim(); R.engine = v.engine.trim();
  R.mileage = v.mileage.replace(/\D/g, ''); R.vin = v.vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
  Cr.event('Vehicle edited by you · ' + (vehicleLine() || 'cleared'));
  const said = cylSaid(resolveCylinderParts(Cr));
  notify();
  if (said) Cr.run(() => Cr.agent(said));
  Cr.run(() => runRo('__refresh__'));
}
export function saveConcern(symptom) {
  const R = S.ro;
  R.symptom = symptom.trim(); R.answers = {}; R.awaiting = null; R.lastTop = [];
  resetFlow();
  Cr.event('Concern edited by you');
  notify();
  Cr.run(() => runRo('__refresh__concern'));
}
export function lineWhy(id) { Cr.user('Why is ' + ITEM(id).name + ' on the repair order?'); Cr.run(() => Cr.agent(explain(id))); }
export function addManual(name, hours) {
  const R = S.ro, id = 'x' + (R.nextCustom++), hv = isNaN(hours) || hours < 0 ? 0 : hours;
  R.custom[id] = { id, name, hours: hv, src: 'manual', ref: 'Entered by you', parts: [], detail: 'Entered by you. No labor-guide source.' };
  R.accepted.add(id);
  Cr.event('Added to RO · ' + name + ' · ' + hv.toFixed(1) + ' h · entered by you');
  notify();
}
/** forLine: the repair line this part was picked for, so taking the line off takes its parts off too. */
export function addPart(row, label, qty, fit, forLine, perCyl = false) {
  const key = row.lineCode + '|' + row.partNumber;
  if (partOn(key)) return;
  S.ro.parts.added.push({ key, label, description: row.description, lineCode: row.lineCode, partNumber: row.partNumber, brand: row.brand, quality: row.quality, each: row.listPrice, qty, fit, forLine, perCyl, availability: row.availability });
  Cr.event('Added to RO · ' + label + ' · NAPA ' + row.lineCode + ' ' + row.partNumber + ' · ' + money(row.listPrice * qty) + (row.availability ? ' · ' + row.availability.short : ''));
  notify();
}
/** Put another NAPA option on the RO in place of the part already there for the same need. */
export function swapPart(oldKey, row, label, qty, fit) {
  const R = S.ro, old = R.parts.added.find(x => x.key === oldKey);
  R.parts.added = R.parts.added.filter(x => x.key !== oldKey);
  if (old) Cr.event('Removed from RO · ' + old.label + ' · NAPA ' + old.partNumber + ' · swapped');
  addPart(row, label, qty, fit, old && old.forLine, !!(old && old.perCyl));
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
