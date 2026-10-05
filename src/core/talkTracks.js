// The talk tracks on screen, as facts for the model plus the template text (talkGen.js). Built from
// the same recommendations the cards show, so the reference, the facts and the fallback agree.
// Each track: { id, kind, facts, reference, source, require } — source is the line code appends
// after validation; require lists [regex, what] the text must keep.
import { S } from './state';
import { rate } from './logic';
import { buildRecs } from './recommend';
import { buildPackage, packageLevel, packageTalk } from './packages';
import { REPMAP } from './laborGuide';
import { SRC } from './talkSources';

const SOURCE_RX = /\s*\((?:Source|Repair times)[^)]*\)\.?\s*$/;
const dollars = n => (n === null || n === undefined ? null : '$' + Math.round(n).toLocaleString());
const APPROVAL = ['approv|decision|decide|your choice|optional|up to you', 'the customer decides (approval or choice)'];

function mk(id, kind, facts, template, require = []) {
  const m = String(template).match(SOURCE_RX);
  return { id, kind, facts, reference: String(template).replace(SOURCE_RX, '').trim(), source: m ? m[0].trim() : '', require };
}

/** Every customer talk track the Recommendations and package cards show right now. */
export function talkTracks(recs = buildRecs()) {
  const rt = rate(), out = [];
  const r = recs.repairs;
  if (r.items.length) {
    const t = r.items[0], base = i => i.name.split(',')[0].toLowerCase();
    const next = r.items.slice(1).find(i => base(i) !== base(t));
    out.push(mk('repairs', 'likely repair', {
      customer_said: S.ro.symptom, repair_most_often_associated: t.name, next_to_check: next ? base(next) : null,
      hours: t.hours, estimated_labor: dollars(t.price), price_basis: SRC.estimate, standard_lines: [SRC.confirm],
    }, r.say, [['inspect', 'an inspection first'], APPROVAL].concat(t.price !== null ? [['estimat', 'that the price is an estimate']] : [])));
  }

  const l = recs.labor;
  if (l.anchor) {
    out.push(mk('labor', 'labor-guide recommendations', {
      main_job: l.anchorName, on_order: l.anchorOnOrder, recommended: l.lead.filter(i => !i.on).map(i => i.plain),
      conditional_count: l.more.length, not_included: l.followOns.map(f => f.name), presentation: l.mode,
    }, l.say, [APPROVAL]));
    l.items.forEach(i => {
      const it = REPMAP[i.id], alone = [].concat((it.talk && it.talk.standalone) || []).map(id => REPMAP[id]).find(s => s && s.hours > it.hours);
      out.push(mk('addon:' + i.id, 'add-on: ' + i.kind, {
        main_job: l.anchorName, action: i.plain, kind: i.kind, reason: it.talk && it.talk.why, hours: i.hours,
        estimated_labor: dollars(i.price), hours_if_done_separately: alone ? alone.hours : null,
      }, i.say, [APPROVAL].concat(i.kindId === 'if-needed' ? [['inspect', 'that it depends on the inspection']] : [])));
    });
  }

  const m = recs.maint;
  if (m.adv) {
    const a = m.adv, open = i => !i.onOrder && !i.coveredBy, say = i => i.say;
    out.push(mk('maint', 'scheduled maintenance', {
      schedule: a.scriptLines[0], service: a.headline, status: a.status,
      safety: (a.tiers.find(t => t.id === 'safety') || { items: [] }).items.filter(open).map(i => ({ action: say(i), why: i.why })),
      protect: (a.tiers.find(t => t.id === 'protect') || { items: [] }).items.filter(open).map(i => ({ action: say(i), why: i.why })),
      optional: (a.tiers.find(t => t.id === 'comfort') || { items: [] }).items.filter(open).map(i => ({ action: say(i), why: i.why })),
      already_in_todays_work: a.tiers.flatMap(t => t.items.filter(i => i.coveredBy).map(say)),
      inspection_covers: a.inspection ? a.inspection.groups : [], recommended_hours: Math.round(a.recommended.hours * 10) / 10,
      estimated_labor: dollars(a.recommended.price), price_basis: SRC.estimate,
    }, a.scriptLines.join(' '), [APPROVAL]));
  }

  const level = packageLevel(), pk = buildPackage(level, recs);
  if (pk.items.length) {
    const t = packageTalk(pk, recs);
    out.push(mk('package:' + level, 'severity package (' + level + ')', {
      level, lines: pk.items.map(i => ({ name: i.name, severity: i.severity, why: i.why })),
      hours: Math.round(pk.hours * 10) / 10, estimated_total: dollars(pk.total), parts_pending: pk.partsPending, price_basis: SRC.estimate,
    }, t.say.join(' '), [APPROVAL].concat(pk.items.some(i => i.source === 'repair') ? [['inspect', 'an inspection first for the concern']] : [])));
  }
  return out;
}

export const trackById = (tracks, id) => tracks.find(t => t.id === id);
