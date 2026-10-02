// Labor-guide guardrails: keep a repair order from billing the same labor twice. The relations
// (same job, one job includes another, left + right = both sides) live in
// resources/labor_guide/labor_guide_rules.json; COMBINATION rows tie to their OPERATION by
// LaborComponent, as in the labor-guide export. Every function here is pure over the list of ids on
// the order, so the scripted flow, the cards and the tests all get the same answer.
import RULES from '../../resources/labor_guide/labor_guide_rules.json';
import { REP, REPMAP } from './laborGuide';
import { getMaintItem } from './maintenanceSchedule';

/**
 * Maintenance lines have ids like "sm:<vinMask>:<miles>:<terms>:<op>". The rules name them by the
 * part that does not change between vehicles and milestones: "sm:<terms>:<op>".
 */
export const relKey = id => {
  const p = String(id).split(':');
  return p[0] === 'sm' && p.length === 5 ? 'sm:' + p[3] + ':' + p[4] : id;
};

const GROUP = new Map();
(RULES.sameGroups || []).forEach((g, i) => g.forEach(id => GROUP.set(id, (GROUP.get(id) || []).concat(i))));
const PAIRS = new Set((RULES.samePairs || []).flatMap(([a, b]) => [a + '\u0000' + b, b + '\u0000' + a]));
const INCLUDES = RULES.includes || {};
const BOTH = RULES.bothSides || {};

/** Two different ids that are the same job, so only one belongs on the order. */
export function sameJob(a, b) {
  const x = relKey(a), y = relKey(b);
  if (x === y) return false;
  if (PAIRS.has(x + '\u0000' + y)) return true;
  const gx = GROUP.get(x), gy = GROUP.get(y);
  return !!(gx && gy && gx.some(i => gy.includes(i)));
}
/** a's labor hours already cover b. */
export const covers = (a, b) => (INCLUDES[relKey(a)] || []).includes(relKey(b));

const row = id => REPMAP[id];
const isCombo = id => row(id) && row(id).laborType === 'COMBINATION';
const isOp = id => row(id) && row(id).laborType === 'OPERATION';
export const standalonesOf = id => { const s = row(id) && row(id).talk && row(id).talk.standalone; return s ? [].concat(s) : []; };

/** COMBINATION rows that go with an OPERATION (same LaborComponent). */
export const combosOf = opId => (isOp(opId) ? REP.filter(r => r.laborType === 'COMBINATION' && r.component === row(opId).component).map(r => r.id) : []);

/** The accepted OPERATION rows that make a COMBINATION row valid: its own, or one whose add-on is the same job. */
export function parentsOnOrder(comboId, accepted) {
  return accepted.filter(id => isOp(id) && combosOf(id).some(c => c === comboId || sameJob(c, comboId)));
}

const line = id => row(id) || getMaintItem(id);
const name = id => (line(id) ? line(id).name : id);
const hoursOf = id => (line(id) ? line(id).hours : 0);
const round1 = n => Math.round(n * 10) / 10;

/**
 * What adding `id` to an order that already has `accepted` should do.
 * @returns {{action:'add'} |
 *   {action:'block', kind:'duplicate'|'covered'|'orphan', by?:string, reason:string, offer?:string} |
 *   {action:'substitute', id:string, parent:string, saves:number, reason:string} |
 *   {action:'replace', id:string, remove:string[], kind:'supersedes'|'bothSides', saves:number, reason:string}}
 */
export function checkAdd(id, accepted) {
  if (accepted.includes(id)) return { action: 'block', kind: 'duplicate', by: id, reason: name(id) + ' is already on the repair order.' };

  // Done on its own while a related job is on the order, this has a cheaper add-on version.
  if (!isCombo(id)) {
    for (const p of accepted.filter(isOp)) {
      const c = combosOf(p).find(cid => (standalonesOf(cid).includes(id) || sameJob(cid, id)) && hoursOf(cid) < hoursOf(id));
      if (c && !accepted.includes(c) && !accepted.some(a => sameJob(a, c))) {
        return { action: 'substitute', id: c, parent: p, saves: round1(hoursOf(id) - hoursOf(c)), reason: name(p) + ' is already on the order, so this is add-on labor: ' + hoursOf(c).toFixed(1) + ' h instead of ' + hoursOf(id).toFixed(1) + ' h on its own.' };
      }
    }
  }

  const twin = accepted.find(a => sameJob(a, id));
  if (twin) return { action: 'block', kind: 'duplicate', by: twin, reason: 'That is the same job as ' + name(twin) + ', which is already on the order.' };

  const cover = accepted.find(a => covers(a, id));
  if (cover) return { action: 'block', kind: 'covered', by: cover, reason: name(cover) + ' already includes this labor.' };

  if (isCombo(id) && !parentsOnOrder(id, accepted).length) {
    const alone = standalonesOf(id).find(s => row(s));
    return { action: 'block', kind: 'orphan', reason: name(id) + ' is add-on labor: its ' + hoursOf(id).toFixed(1) + ' h assume ' + (row(id).component || 'the related part').toLowerCase() + ' work is already apart. Add that job first' + (alone ? ', or quote ' + name(alone) + ' (' + hoursOf(alone).toFixed(1) + ' h) on its own.' : '.'), offer: alone };
  }

  for (const [both, sides] of Object.entries(BOTH)) {
    if (sides.includes(id)) {
      const other = sides.find(s => s !== id);
      if (accepted.includes(other) && row(both)) {
        return { action: 'replace', id: both, remove: [other], kind: 'bothSides', saves: round1(hoursOf(other) + hoursOf(id) - hoursOf(both)), reason: 'Both sides together is one job: ' + name(both) + ' at ' + hoursOf(both).toFixed(1) + ' h, not ' + (hoursOf(other) + hoursOf(id)).toFixed(1) + ' h.' };
      }
    }
  }

  const covered = accepted.filter(a => covers(id, a));
  if (covered.length) {
    return { action: 'replace', id, remove: covered, kind: 'supersedes', saves: round1(covered.reduce((s, a) => s + hoursOf(a), 0)), reason: name(id) + ' already includes ' + covered.map(name).join(', ') + ', so ' + (covered.length > 1 ? 'those lines come' : 'that line comes') + ' off.' };
  }
  return { action: 'add' };
}

/** Add-on rows left on the order with no job to attach to (after a removal). */
export const orphanedCombos = accepted => accepted.filter(id => isCombo(id) && !parentsOnOrder(id, accepted).length);

/** COMBINATION rows worth offering after `opId` is on the order: not already covered, duplicated or dismissed. */
export function addOnsFor(opId, accepted, dismissed = []) {
  const out = [];
  combosOf(opId).forEach(c => {
    // near-duplicate rows in the export (e.g. two axle-boot rows) are one offer
    if (!dismissed.includes(c) && checkAdd(c, accepted).action === 'add' && !out.some(o => sameJob(o, c))) out.push(c);
  });
  return out;
}

/** Jobs the guide says are not included (e.g. wheel alignment) and are not on the order yet. */
export function followOnsFor(id, accepted) {
  const r = row(id);
  if (!r || !r.note) return [];
  return (RULES.followOn || [])
    .filter(f => r.note.toLowerCase().includes(f.noteContains.toLowerCase()) && row(f.suggest))
    .filter(f => checkAdd(f.suggest, accepted).action === 'add')
    .map(f => ({ id: f.suggest, why: f.why }));
}

/** Everything wrong with an order as it stands: the same rules, applied pairwise. */
export function auditLabor(accepted) {
  const issues = [];
  accepted.forEach((a, i) => accepted.slice(i + 1).forEach(b => {
    if (sameJob(a, b)) issues.push({ kind: 'duplicate', ids: [a, b] });
    else if (covers(a, b) || covers(b, a)) issues.push({ kind: 'covered', ids: covers(a, b) ? [a, b] : [b, a] });
  }));
  orphanedCombos(accepted).forEach(id => issues.push({ kind: 'orphan', ids: [id] }));
  Object.entries(BOTH).forEach(([both, sides]) => { if (sides.every(s => accepted.includes(s))) issues.push({ kind: 'bothSides', ids: [...sides, both] }); });
  return issues;
}

export const componentSay = component => (RULES.componentSay || {})[component];
