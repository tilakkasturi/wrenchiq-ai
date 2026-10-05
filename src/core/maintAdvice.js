// Interprets a scheduled-maintenance milestone for the service advisor instead of listing it:
// groups the due items by severity (safety, protects the engine, comfort), says why each matters,
// notes what today's repair lines already cover, and writes the script the advisor can read to the
// customer. The knowledge (tiers, wording, inspection groups) is in
// resources/scheduled_maintenance/maintenance_advice.json; this file only applies it.
import ADVICE from '../../resources/scheduled_maintenance/maintenance_advice.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';
import { getMaintItem } from './maintenanceSchedule';
import { REPMAP } from './laborGuide';
import { sameJob, covers } from './laborRules';
import { SRC, scheduleCite } from './talkSources';

const A = refillObject(liveStore('maintAdvice', () => ({})), ADVICE);

const dollars = n => '$' + Math.round(n).toLocaleString();
const joinAnd = l => (l.length <= 1 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);
const lineName = id => (REPMAP[id] || getMaintItem(id) || {}).name || id;
/** "sm:<mask>:<miles>:<terms>:<op>" -> the schedule's part terms, e.g. ["engine oil", "engine oil filter"]. */
const termsOf = id => { const p = String(id).split(':'); return p.length === 5 ? p[3].split('+') : []; };

/**
 * @param ms   maintState() result
 * @param ctx  { rate, accepted: ids on the order, make }
 * @returns {{ headline, status, tiers: object[], inspection: object|null, recommendedIds: string[], allIds: string[],
 *   recommended: {hours:number, price:number|null}, scriptLines: string[], script: string } | null}
 */
export function interpretMaint(ms, { rate = null, accepted = [], make = '' } = {}) {
  if (!ms || !ms.ids.length) return null;
  const tiers = A.tiers.map(t => ({ id: t.id, label: t.label, say: t.say, recommend: !!t.recommend, items: [] }));
  let inspection = null;
  ms.ids.forEach(id => {
    const it = getMaintItem(id);
    if (!it) return;
    const onOrder = accepted.includes(id);
    // a repair line already doing this job (e.g. spark plugs with a valve cover job)
    const by = !onOrder && accepted.find(a => a !== id && (sameJob(a, id) || covers(a, id)));
    if (/:inspection-bundle$/.test(id)) {
      const checks = it.checks || [];
      const groups = A.inspectionGroups.filter(g => checks.some(c => new RegExp(g.match, 'i').test(c))).map(g => g.label);
      // the brakes are already apart today when a brake repair is on the order
      const brakeJob = accepted.find(a => REPMAP[a] && /brake|caliper|rotor/i.test(REPMAP[a].name));
      inspection = { id, name: it.name, hours: it.hours, price: rate ? it.hours * rate : null, count: checks.length, groups, onOrder, brakeJob: brakeJob ? lineName(brakeJob) : null };
      return;
    }
    const adv = A.items[termsOf(id)[0]] || {};
    const tier = tiers.find(t => t.id === adv.tier) || tiers.find(t => t.id === A.defaultTier);
    tier.items.push({
      id, name: it.name, hours: it.hours, price: rate ? it.hours * rate : null, extended: !!it.extended,
      say: adv.say || it.name.toLowerCase(), why: adv.why || '', skip: adv.skip || '', onOrder, coveredBy: by ? lineName(by) : null,
    });
  });
  const shown = tiers.filter(t => t.items.length);
  shown.forEach(t => { const open = t.items.filter(i => !i.coveredBy); t.hours = open.reduce((s, i) => s + i.hours, 0); t.price = rate ? t.hours * rate : null; });

  const open = i => !i.onOrder && !i.coveredBy;
  const recommendedIds = shown.filter(t => t.recommend).flatMap(t => t.items.filter(open).map(i => i.id))
    .concat(inspection && !inspection.onOrder ? [inspection.id] : []);
  const allIds = shown.flatMap(t => t.items.filter(open).map(i => i.id)).concat(inspection && !inspection.onOrder ? [inspection.id] : []);
  const recHours = recommendedIds.reduce((s, id) => s + getMaintItem(id).hours, 0);

  const statusLabel = ms.status === 'COMING_UP' ? 'Coming up' : 'Due now';
  const who = scheduleCite(ms.match, make); // e.g. "Toyota's factory (OEM) maintenance schedule" 
  const out = {
    headline: ms.at.toLocaleString() + ' mi service', status: statusLabel, tiers: shown, inspection, recommendedIds, allIds,
    recommended: { hours: recHours, price: rate ? recHours * rate : null },
    // one line per point, in the order to say them; script is the same as one paragraph (for Copy)
    scriptLines: buildScript(ms, who, shown, inspection, recHours, rate),
  };
  out.script = out.scriptLines.join(' ');
  return out;
}

/** What the advisor can say, most important first. Built only from the schedule and the advice file. */
function buildScript(ms, who, tiers, insp, recHours, rate) {
  const out = [];
  const pending = tiers.some(t => t.recommend && t.items.some(i => !i.onOrder && !i.coveredBy));
  const svc = 'the ' + ms.at.toLocaleString() + ' mile service';
  if (!pending && tiers.some(t => t.recommend)) out.push('The items ' + who + ' recommends most for ' + svc + ' are on today\'s order.');
  else out.push(ms.status === 'COMING_UP'
    ? 'According to ' + who + ', ' + svc + ' is coming up soon; we can recommend doing it while the vehicle is here, if you would like.'
    : 'According to ' + who + ', ' + svc + ' is due at this mileage. Here is what it recommends, most important first.');
  const pick = id => (tiers.find(t => t.id === id) || { items: [] }).items.filter(i => !i.onOrder && !i.coveredBy);
  // one line per item to say, even when two schedule rows share it (oil + filter)
  const uniq = items => items.filter((i, k) => items.findIndex(j => j.say === i.say) === k);
  const safety = uniq(pick('safety')), protect = uniq(pick('protect')), comfort = uniq(pick('comfort'));
  if (safety.length) out.push('For safety, the schedule recommends that we ' + joinAnd(safety.map(i => i.say)) + '. ' + safety.map(i => i.why).join(' '));
  if (protect.length) out.push('To help protect the engine, it also recommends that we ' + joinAnd(protect.map(i => i.say)) + '. ' + protect.map(i => i.why).join(' '));
  const covered = tiers.flatMap(t => t.items.filter(i => i.coveredBy));
  if (covered.length) out.push('We already plan to ' + joinAnd(uniq(covered).map(i => i.say)) + ' as part of today\'s ' + covered[0].coveredBy.toLowerCase() + ', so it is not charged twice.');
  if (insp && !insp.onOrder) {
    const g = insp.groups.length > 3 ? insp.groups.slice(0, 3).concat('more') : insp.groups;
    out.push('The schedule also recommends a multi-point inspection' + (g.length ? ', covering the ' + g.join('; ').replace(/; ([^;]*)$/, ' and $1').replace(/; /g, ', ') : '') + '. If it finds anything else, we will contact you with a recommendation before any additional work.'
      + (insp.brakeJob ? ' The brakes are already being worked on today.' : ''));
  }
  if (recHours > 0) out.push('Estimated labor for these recommended items is about ' + recHours.toFixed(1) + ' hours' + (rate ? ' (' + dollars(recHours * rate) + ')' : '') + ', ' + SRC.estimate + '. ' + SRC.approval);
  if (comfort.length) out.push('The schedule also lists items you may choose to do now or at a later visit: ' + joinAnd(comfort.map(i => i.say)) + '. ' + comfort.map(i => i.why).join(' ') + ' These are optional.');
  return out;
}

resourceLoaded('maintenance advice');
if (import.meta.hot) import.meta.hot.accept();
