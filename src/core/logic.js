// Repair order and shop profile logic, ported from the prototype. Reads the session store.
import { S, persistProfile } from './state';
import {
  PQMAP, REP, REPMAP, QB, QDUR, BLOCK, ALLKW,
  MAKES, MODELS, MAKE_RX, MODEL_RX,
} from './data';
import { stems, matchOne, scoreOpts, words, numIn } from './match';
import { resolveSchedule, computeMaintenanceDue, getMaintItem } from './maintenanceSchedule';
import { sameJob, addOnsFor } from './laborRules';
import { engineSpec, perCylinder } from './engineCylinders';

export const money = n => '$' + n.toFixed(2);
export const ITEM = id => REPMAP[id] || getMaintItem(id) || S.ro.custom[id];
export const hrs = it => (S.ro.hoursOv[it.id] !== undefined ? S.ro.hoursOv[it.id] : it.hours);
export const rate = () => { const f = S.profile['shop.labor_rate']; return f ? Number(f.value) : null; };
export const miles = () => { const n = parseInt(String(S.ro.mileage).replace(/\D/g, ''), 10); return isNaN(n) ? 0 : n; };
export const vehicleLine = () => [S.ro.year, S.ro.make, S.ro.model, S.ro.engine].filter(Boolean).join(' ');
export const vehicleOk = () => !!(S.ro.year && S.ro.make && S.ro.model);
/** Customers and advisors say the same thing many ways; reduce it to the words the labor guide uses. */
export function normalizeSymptom(raw) {
  return String(raw).toLowerCase()
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/\bwont\b/g, "won't").replace(/\bdoesnt\b/g, "doesn't").replace(/\bisnt\b/g, "isn't")
    .replace(/\b(?:doesn't|does not|won't|will not|wouldn't|isn't|is not|not) (?:start|starting|turn over|crank)\b|\bno start\b/g, "won't start")
    .replace(/\bcranks? (?:but|and) (?:won't|doesn't|will not|does not|isn't|not)\b/g, 'cranks but won')
    .replace(/\bcel\b|\bmil\b|service engine soon|malfunction indicator|check engine/g, 'check engine')
    .replace(/\ba\.?\s?\/?\s?c\b(?!\w)/g, 'a/c')
    .replace(/\bair ?con\b|\baircon\b/g, 'air conditioning')
    .replace(/\ba\/c (?:is )?(?:not|isn't|doesn't|won't) (?:working|work)\b/g, 'a/c not working')
    .replace(/\ba\/c (?:stopped|quit)(?: working)?\b/g, 'a/c stopped')
    .replace(/\bnot (?:blowing|getting|staying|putting out) (?:cold|cool)\b/g, 'not cold')
    .replace(/\bno (?:cold )?air(?: coming)? (?:from|out of|through) (?:the )?vents?\b/g, 'no air vents')
    .replace(/\bengine (?:is )?(?:not|isn't|doesn't|won't) work(?:ing)?\b/g, 'engine not working');
}
const symptomText = () => normalizeSymptom(S.ro.symptom);

export function saveFact(q, r) {
  S.profile[q.key] = { value: r.value, display: r.display, label: q.label, at: Date.now() };
  S.skipped.delete(q.key);
  persistProfile();
}

/* ---------- shop profile parsing ---------- */
const NUM_CUE = {
  'shop.labor_rate': t => /rate|hour|hr\b|\/\s*h|labou?r/.test(t) && !/diag/.test(t),
  'shop.diag_rate': t => /diag/.test(t),
  'parts.markup': t => /mark ?up/.test(t),
};

export function parseFor(q, text, active) {
  const t = text.toLowerCase();
  if (q.type === 'number') {
    const own = NUM_CUE[q.key](t);
    // If the answer names a different number fact, it is not an answer to this one.
    if (!own && Object.keys(NUM_CUE).some(k => k !== q.key && NUM_CUE[k](t))) return null;
    if (q.key === 'shop.diag_rate' && /\b(same|no|not different|don'?t|equal)\b/.test(t) && (active || own)) {
      const lr = rate();
      return { value: 'same', display: 'Same as labor rate' + (lr ? ' ($' + lr + '/hr)' : '') };
    }
    if (!active && !own) return null;
    const v = numIn(t);
    if (v === null || v < q.min || v > q.max) return null;
    return { value: v, display: q.fmt(v) };
  }
  if (q.type === 'choice') {
    const cue = /tone|sound|friendly|formal|short and|direct/;
    if (!active && !cue.test(t)) return null;
    const m = matchOne(q.options, text);
    if (!m) return null;
    if (m.amb) return { amb: m.amb };
    return { value: m.o, display: m.o };
  }
  if (q.type === 'multi') {
    const cue = q.key === 'comms.languages'
      ? /speak|language|spanish|vietnamese|chinese|english/
      : /never|don'?t|do not|no\s+(?:tires|body|diesel)|we (?:skip|avoid)|not offer/;
    if (!active && !cue.test(t)) return null;
    const sc = scoreOpts(q.options, text);
    if (!sc.length) return null;
    let sel = sc.map(x => x.o);
    if (sel.length > 1) sel = sel.filter(o => o !== 'None');
    return { value: sel, display: sel.join(', ') };
  }
  return null;
}

/* ---------- repair order ---------- */
export function applicableQs() {
  const t = symptomText().trim();
  if (!t) return [];
  const l = QB.filter(q => q.when.some(k => t.includes(k)) && !(q.unless || []).some(k => t.includes(k)));
  l.push(QDUR);
  return l;
}
const notOffered = () => { const f = S.profile['upsell.not_offered']; return f && Array.isArray(f.value) ? f.value : []; };

export function computeRepairs() {
  const t = symptomText();
  if (t.trim().length < 3) return [];
  const blocked = new Set();
  notOffered().forEach(n => (BLOCK[n] || []).forEach(i => blocked.add(i)));
  const out = [];
  REP.forEach(r => {
    // COMBINATION rows (LaborTypeName) are incremental add-on labor offered once the related
    // OPERATION is accepted (see combinationsFor/suggestCombinations in harness.js) — they are
    // not independently ranked against the customer's stated concern.
    if (r.laborType === 'COMBINATION') return;
    if (blocked.has(r.id)) return;
    let score = 0;
    const why = [];
    r.strong.forEach(k => { if (t.includes(k)) { score += 4; why.push('Symptom mentions "' + k + '"'); } });
    r.kw.forEach(k => { if (t.includes(k)) { score += 1; why.push('Symptom mentions "' + k + '"'); } });
    applicableQs().forEach(q => {
      const a = S.ro.answers[q.id];
      if (!a) return;
      const o = q.opts.find(x => x.l === a);
      if (o && o.b[r.id]) { score += o.b[r.id]; why.push(q.short + ': ' + a); }
    });
    if (score > 0) out.push({ id: r.id, score, why });
  });
  // The same job can come from more than one labor-guide file (a demo row and a synthetic one, say):
  // show the better match once. sort() is stable, so ties keep the labor guide's file order.
  out.sort((a, b) => b.score - a.score);
  const kept = [];
  out.forEach(x => { if (!kept.some(k => sameJob(k.id, x.id))) kept.push(x); });
  return kept.slice(0, 8);
}
export const shownRepairs = () => computeRepairs().filter(x => !S.ro.dismissed.has(x.id));

/** For the Agent trace: how the labor-guide ranking scored this concern. */
export function rankingDetail(list = shownRepairs()) {
  return {
    rule: 'Score each labor-guide OPERATION row: +4 per strong keyword in the concern, +1 per keyword, plus the boost each follow-up answer gives that row; drop services the shop never offers and rows set aside; keep the best of rows that are the same job; top 8.',
    concern: symptomText(),
    answers: { ...S.ro.answers },
    ranked: list.map(x => ({ id: x.id, name: REPMAP[x.id] ? REPMAP[x.id].name : x.id, guide_row: REPMAP[x.id] ? REPMAP[x.id].ref : '', hours: REPMAP[x.id] ? REPMAP[x.id].hours : null, score: x.score, match: conf(x.score)[1], why: x.why })),
  };
}
export const conf = s => (s >= 7 ? ['high', 'High match'] : s >= 4 ? ['med', 'Medium match'] : ['low', 'Possible']);

/**
 * COMBINATION (add-on) labor rows to offer once an OPERATION row is on the order. They tie to it by
 * LaborComponent, the only linkage the labor-guide export gives. laborRules.js drops any that are
 * already covered, duplicated by another line, or set aside.
 */
export const combinationsFor = id => addOnsFor(id, [...S.ro.accepted, id], [...S.ro.dismissed]);

export function maintState() {
  const m = miles();
  if (!m) return null;
  const schedule = resolveSchedule({ vin: S.ro.vin, make: S.ro.make });
  return computeMaintenanceDue(m, schedule);
}

export function concern() {
  const s = S.ro.symptom.trim();
  if (!s) return '';
  let t = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/[.!?]$/.test(t)) t += '.';
  const ans = applicableQs().filter(q => S.ro.answers[q.id]).map(q => q.short + ': ' + S.ro.answers[q.id]);
  return 'Customer states: ' + t + (ans.length ? ' Reported: ' + ans.join('; ') + '.' : '');
}

/** Model year from a VIN's 10th character (2010-2026 cycle). */
export const yearFromVin = vin => ({ A: 2010, B: 2011, C: 2012, D: 2013, E: 2014, F: 2015, G: 2016, H: 2017, J: 2018, K: 2019, L: 2020, M: 2021, N: 2022, P: 2023, R: 2024, S: 2025, T: 2026 })[String(vin).toUpperCase().charAt(9)] || null;

export function extractVehicle(text) {
  const R = S.ro, ch = [];
  let w = ' ' + text + ' ', m, mi = null;
  if ((m = w.match(/\b[A-HJ-NPR-Za-hj-npr-z0-9]{17}\b/)) && /\d/.test(m[0]) && /[a-z]/i.test(m[0])) { R.vin = m[0].toUpperCase(); ch.push('VIN'); w = w.replace(m[0], ' '); }
  if ((m = w.match(/(\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?)\s*(?:k|thousand)\b(?:\s*(?:mi|miles?)\b)?/i))) { mi = Math.round(parseFloat(m[1].replace(/,/g, '')) * 1000); w = w.replace(m[0], ' '); }
  else if ((m = w.match(/(\d{1,3}(?:,\d{3})+|\d{3,7})\s*(?:mi|miles?|mileage)\b/i))) { mi = parseInt(m[1].replace(/,/g, ''), 10); w = w.replace(m[0], ' '); }
  else if ((m = w.match(/(?:mileage|odometer|odo)\D{0,6}(\d[\d,]*)/i))) { mi = parseInt(m[1].replace(/,/g, ''), 10); w = w.replace(m[0], ' '); }
  else if ((m = w.match(/\b(\d{2,3},\d{3}|\d{5,6})\b/))) { mi = parseInt(m[1].replace(/,/g, ''), 10); w = w.replace(m[0], ' '); }
  if (mi && mi > 0 && mi < 1000000) { R.mileage = String(mi); ch.push('mileage'); }
  if ((m = w.match(/\b(19[89]\d|20[0-2]\d)\b/))) { R.year = m[1]; ch.push('year'); w = w.replace(m[0], ' '); }
  if ((m = w.match(MODEL_RX))) { const md = MODELS[m[1].toLowerCase()]; R.model = md[0]; if (!R.make || !MAKE_RX.test(w)) R.make = md[1]; ch.push('model'); w = w.replace(m[0], ' '); }
  if ((m = w.match(MAKE_RX))) { R.make = MAKES[m[1].toLowerCase()]; if (ch.indexOf('make') < 0) ch.push('make'); w = w.replace(m[0], ' '); }
  if ((m = w.match(/\b(\d\.\d)\s?l\b(?:\s?(i4|v6|v8|i3|i6|turbo|hybrid|diesel))?/i))) { R.engine = m[1] + 'L' + (m[2] ? ' ' + m[2].toUpperCase().replace('TURBO', 'Turbo').replace('HYBRID', 'Hybrid').replace('DIESEL', 'Diesel') : ''); ch.push('engine'); w = w.replace(m[0], ' '); }
  else if ((m = w.match(/\b(v6|v8|i4)\b/i))) { R.engine = m[1].toUpperCase(); ch.push('engine'); w = w.replace(m[0], ' '); }
  if (R.vin && !R.year && ch.indexOf('VIN') >= 0) {
    const y = yearFromVin(R.vin);
    if (y) { R.year = String(y); ch.push('year (from VIN)'); }
  }
  let rest = w.replace(/\s+/g, ' ').replace(/^[\s,.;:\-–]+|[\s,.;:\-–]+$/g, '');
  for (let i = 0; i < 4; i++) rest = rest.replace(/^(and|with|it has|it's|its|a|an|the|has|is|for|,|\.)\s+/i, '');
  rest = rest.replace(/^[\s,.;:\-–]+|[\s,.;:\-–]+$/g, '').replace(/\s+\./g, '.');
  return { changed: ch, rest };
}
export const hasContent = r => { const t = r.toLowerCase(); return words(r).length >= 2 || ALLKW.some(k => t.includes(k)); };

/**
 * Lines whose names match the words in t, best first. Shown suggestions, due maintenance and add-ons
 * for jobs on the order get a small bonus; outside those, any labor-guide job can match.
 */
export function rankItems(t, scope) {
  const tl = t.toLowerCase();
  let pool = [];
  if (scope === 'accepted') pool = [...S.ro.accepted];
  else {
    pool = shownRepairs().map(x => x.id); const ms = maintState(); if (ms) pool = pool.concat(ms.ids);
    // add-on labor for jobs already on the order, so "add the axle boot" finds it
    [...S.ro.accepted].forEach(a => { pool = pool.concat(combinationsFor(a)); });
  }
  const out = [];
  const score = (id, bonus) => {
    const it = ITEM(id);
    if (!it || out.some(o => o.id === id)) return;
    let s = 0;
    new Set(stems(it.name)).forEach(x => { if (tl.includes(x)) s++; });
    if (/\bbrakes?\b/.test(tl) && /brake/i.test(it.name)) s++;
    if (s > 0) out.push({ id, s: s + bonus });
  };
  pool.forEach(id => score(id, 0.5));
  // An advisor who names a job wants it even if it is not in today's suggestions; the shown ones win ties.
  if (scope !== 'accepted') REP.forEach(r => { if (r.laborType !== 'COMBINATION') score(r.id, 0); });
  return out.sort((a, b) => b.s - a.s);
}

export function findItem(t, scope) {
  if (/\b(top|first|best|main|that one|it)\b/i.test(t) && scope !== 'accepted') { const top = shownRepairs()[0]; if (top) return top.id; }
  const r = rankItems(t, scope);
  return r.length ? r[0].id : null;
}

export function explain(id) {
  const it = ITEM(id), x = computeRepairs().find(y => y.id === id);
  let s = it.name + '.';
  if (x) s += ' ' + x.why.slice(0, 4).join('. ') + '.';
  return s + ' Labor time ' + it.hours.toFixed(1) + ' h comes from ' + (it.src === 'lg' ? 'labor guide row ' : it.src === 'sm' ? 'schedule row ' : 'your entry ') + it.ref + '. Open the source chip on the card to see it.';
}

export function partsTotals() {
  const a = S.ro.parts.added, cost = a.reduce((x, i) => x + i.each * i.qty, 0), mk = S.profile['parts.markup'];
  const pct = mk && typeof mk.value === 'number' ? mk.value : null;
  return { count: a.length, cost, markup: pct, sell: pct !== null ? cost * (1 + pct / 100) : null };
}
/**
 * Labor plus parts for the repair order. Labor is priced only when the shop's labor rate is known;
 * parts are NAPA list prices. Tax and shop fees are not included.
 */
export function orderTotals() {
  const r = S.ro, rt = rate(), lines = [...r.accepted].map(ITEM).filter(Boolean);
  const hours = lines.reduce((a, it) => a + hrs(it), 0);
  const labor = rt ? hours * rt : null;
  const pt = partsTotals();
  const total = (labor || 0) + pt.cost;
  return {
    lineCount: lines.length, hours, rate: rt, labor,
    laborMissing: lines.length > 0 && !rt,
    partsCount: pt.count, parts: pt.cost, markup: pt.markup,
    total,
    totalWithMarkup: pt.markup !== null && pt.count ? (labor || 0) + pt.sell : null,
    empty: lines.length === 0 && pt.count === 0,
  };
}
export const partOn = key => S.ro.parts.added.some(x => x.key === key);

/** Quantity for a suggested part name: "(2)" in the name, else 1. */
export const qtyFromName = name => { const m = String(name).match(/\((\d+)\)/); return m ? parseInt(m[1], 10) : 1; };

/**
 * Quantity for a part on a line. Spark plugs and ignition coils on replace-all jobs are one per
 * cylinder (engineCylinders.js); qty is null while the engine is unknown (need: 'ask' with the
 * vehicle's engines as options, or 'unknown') and 0 on a diesel (need: 'diesel').
 */
export function partQty(name, line) {
  if (!perCylinder(name, line)) return { qty: qtyFromName(name), perCyl: false };
  const sp = engineSpec();
  if (sp.diesel) return { qty: 0, perCyl: true, need: 'diesel' };
  if (!sp.cylinders) return { qty: null, perCyl: true, need: sp.source, options: sp.options };
  return { qty: sp.cylinders, perCyl: true };
}

export function roSummary() {
  const r = S.ro, rt = rate(), lines = [...r.accepted].map(ITEM).filter(Boolean);
  let t = 'REPAIR ORDER (DRAFT)\n' + (vehicleLine() || 'Vehicle not entered') + '\nVIN: ' + (r.vin || '-') + '  Mileage: ' + (miles() ? miles().toLocaleString() : '-') + '\n\n' + (concern() || 'No concern entered') + '\n\n';
  let th = 0, tot = 0;
  lines.forEach(it => {
    const h = hrs(it);
    th += h;
    const p = rt ? h * rt : null;
    if (p) tot += p;
    t += '- ' + it.name + ' | ' + h.toFixed(1) + ' h' + (p ? ' | ' + money(p) : '') + ' | source ' + it.ref + '\n';
  });
  if (!lines.length) t += '(no lines)\n';
  t += '\nTotal labor: ' + th.toFixed(1) + ' h' + (rt ? ' | ' + money(tot) : '');
  if (r.parts.added.length) {
    t += '\n\nPARTS (NAPA catalog list price)\n';
    r.parts.added.forEach(x => { t += '- ' + x.label + ' | NAPA ' + x.lineCode + ' ' + x.partNumber + ' | qty ' + x.qty + ' | ' + money(x.each * x.qty) + '\n'; });
    t += 'Parts at list price: ' + money(partsTotals().cost);
  }
  const o = orderTotals();
  if (!o.empty) {
    t += '\n\nESTIMATED TOTAL: ' + money(o.total) + (o.laborMissing ? ' (parts only, labor not priced: no labor rate set)' : '');
    if (o.totalWithMarkup !== null) t += '\nWith ' + o.markup + '% parts markup: ' + money(o.totalWithMarkup);
    t += '\nParts at NAPA list price. Tax and shop fees not included.';
  }
  return t;
}
