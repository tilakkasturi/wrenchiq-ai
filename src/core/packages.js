// Prepackaged estimate: WrenchIQ picks the best set of recommendations for the shop's severity
// level (Shop profile → "WrenchIQ chooses the best option by severity and total budget") and
// totals it. The items come from the same recommendations the Recommendations card shows
// (recommend.js buildRecs); each gets a severity:
//   high    the customer's concern (top likely repair), safety maintenance, add-on labor that is
//           part of the job
//   medium  engine-protecting maintenance and the inspection, recommended add-on labor, jobs the
//           labor guide says are not included (e.g. alignment)
//   low     comfort maintenance, "only if needed" and optional add-on labor
// A package at a level holds every item at that severity or higher, run through the same labor
// rules as Add to RO (no duplicates, nothing a line already covers, add-ons only with their job).
// Totals are labor at the shop rate plus parts at the shop's parts pick; what the advisor still has
// to decide (front or rear, how many of an "each" item, the engine for spark plugs) is listed.
import { S } from './state';
import { ITEM, rate, partQty } from './logic';
import { checkAdd } from './laborRules';
import { buildRecs } from './recommend';
import { setting } from './shopSettings';
import { partPrice, prefetchPartPrices } from './partPrices';
import { partsFor, pricedPartNames } from './maintParts';

export const LEVELS = ['high', 'medium', 'low'];
const RANK = { high: 0, medium: 1, low: 2 };
const MAINT_SEVERITY = { safety: 'high', protect: 'medium', comfort: 'low' };
const KIND_SEVERITY = { required: 'high', recommended: 'medium', 'if-needed': 'low', optional: 'low' };
const POSITION = /\b(front|rear|left|right)\b/i;

/** The shop's level: 'high', 'medium' or 'low'. */
export const packageLevel = () => setting('package.severity');

/** Every recommendation with its severity and why, most severe first (stable within a level). */
export function packageCandidates(recs = buildRecs()) {
  const out = [];
  const top = recs.repairs.items[0];
  if (top) out.push({ id: top.id, severity: 'high', source: 'repair', why: "The customer's concern (" + top.match.toLowerCase() + ')' });
  const adv = recs.maint.adv;
  if (adv) {
    adv.tiers.forEach(t => t.items.forEach(i => {
      if (i.coveredBy) return;
      out.push({ id: i.id, severity: MAINT_SEVERITY[t.id] || 'medium', source: 'maintenance', why: t.label + ' maintenance' });
    }));
    if (adv.inspection) out.push({ id: adv.inspection.id, severity: 'medium', source: 'maintenance', why: 'Scheduled inspection' });
  }
  recs.labor.items.forEach(i => out.push({ id: i.id, severity: KIND_SEVERITY[i.kindId] || 'medium', source: 'add-on', why: 'Add-on labor: ' + i.kind.toLowerCase() }));
  recs.labor.followOns.forEach(f => out.push({ id: f.id, severity: 'medium', source: 'follow-on', why: 'Not included in the repair: ' + f.why }));
  const seen = new Set();
  return out.filter(c => ITEM(c.id) && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}

/** What the advisor still has to settle for this line before the estimate is final. */
function toConfirm(it) {
  const out = [];
  const pos = (it.name.match(POSITION) || [])[1];
  // a position the follow-up answers did not settle ("Not sure", or never asked)
  const answered = Object.values(S.ro.answers || {}).some(a => pos && a.toLowerCase() === pos.toLowerCase());
  if (pos && !answered) out.push('Confirm ' + pos.toLowerCase() + ' (not confirmed by the customer\'s answers)');
  if (/\beach\b/i.test(it.name) || /\bEach\b/.test(it.note || '')) out.push('How many: priced as 1');
  return out;
}

/**
 * The package for one level.
 * @returns {{level, items: object[], skipped: object[], labor: number|null, parts: number, partsPending: number,
 *   total: number|null, hours: number, confirm: {line: string, what: string}[]}}
 */
export function buildPackage(level = packageLevel(), recs = buildRecs()) {
  const rt = rate(), R = S.ro;
  const accepted = [...R.accepted], items = [], skipped = [], confirm = [];
  packageCandidates(recs).filter(c => RANK[c.severity] <= RANK[level]).forEach(c => {
    const d = R.accepted.has(c.id) ? { action: 'on' } : checkAdd(c.id, accepted);
    if (d.action === 'block') { skipped.push({ ...c, name: ITEM(c.id).name, reason: d.reason }); return; }
    const id = d.action === 'substitute' || d.action === 'replace' ? d.id : c.id;
    if (d.action === 'replace') d.remove.forEach(x => { const k = accepted.indexOf(x); if (k >= 0) accepted.splice(k, 1); });
    if (d.action !== 'on') accepted.push(id);
    const it = ITEM(id);
    const parts = partsFor(it).map(mp => {
      const n = mp.name, q = partQty(n, it);
      if (mp.price === false) return { name: n, qty: q.qty, perCyl: false, need: 'manual', each: null, status: 'manual', availability: null, confirm: mp.confirm };
      const p = partPrice(n);
      const each = p && p.status === 'ok' ? p.pick.listPrice : null;
      return { name: n, qty: q.qty, perCyl: q.perCyl, need: q.need, each, status: p ? p.status : 'unpriced', availability: p && p.pick && p.pick.availability ? p.pick.availability.short : null, confirm: mp.confirm };
    });
    parts.forEach(p => {
      if (p.need === 'ask' || p.need === 'unknown') confirm.push({ line: it.name, what: 'Engine: ' + p.name.toLowerCase().replace(/\s*\(.*?\)/g, '') + ' are one per cylinder' });
      else if (p.status === 'none' || p.status === 'error') confirm.push({ line: it.name, what: 'No NAPA price for ' + p.name.toLowerCase() });
      if (p.confirm) confirm.push({ line: it.name, what: p.confirm });
    });
    toConfirm(it).forEach(what => confirm.push({ line: it.name, what }));
    items.push({ ...c, id, name: it.name, hours: it.hours, onOrder: R.accepted.has(id), note: d.action === 'substitute' || d.action === 'replace' ? d.reason : null, parts });
  });
  // the whole package, whether or not its lines are on the RO yet, so the total stays put after Add
  const hours = items.reduce((s, i) => s + i.hours, 0);
  let parts = 0, partsPending = 0;
  items.forEach(i => i.parts.forEach(p => {
    if (p.each !== null && p.qty) parts += p.each * p.qty;
    else if (p.need !== 'diesel' && p.status !== 'none' && p.status !== 'manual') partsPending++;
  }));
  const labor = rt ? hours * rt : null;
  // package lines on the RO whose parts were never looked up (added before the package, e.g. by Add all)
  const partsMissing = items.filter(i => i.onOrder && pricedPartNames(ITEM(i.id)).length && !R.autoPriced.has(i.id)).length;
  return { level, items, skipped, hours, labor, parts, partsPending, partsMissing, total: labor === null ? null : labor + parts, confirm };
}

/** All three levels, for the totals shown next to the shop's package. */
export function packageLevels(recs = buildRecs()) {
  return Object.fromEntries(LEVELS.map(l => [l, buildPackage(l, recs)]));
}

/** Start NAPA lookups for every part any level could include, so totals fill in. */
export function prefetchPackageParts(recs = buildRecs()) {
  const names = new Set();
  packageCandidates(recs).forEach(c => pricedPartNames(ITEM(c.id)).forEach(n => names.add(n)));
  if (names.size && S.ro.year && S.ro.make && S.ro.model) prefetchPartPrices([...names]);
}
