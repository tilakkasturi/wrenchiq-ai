// Shop settings: instructions the shop gives the assistant about how to present its work, with a
// default from resources/shop/core_shop_profile.json and the shop's choice kept in shop memory
// (S.profile, persisted like other facts). Changed in the Shop profile panel.
import { S, notify, persistProfile } from './state';
import { SHOP } from './data';
import { getMaintItem } from './maintenanceSchedule';
import { interpretMaint } from './maintAdvice';
import { REPMAP } from './laborGuide';
import { SRC, scheduleCite } from './talkSources';
import { promptSection } from '../services/promptLoader';

// The wording of each setting (label, why, each option's label and instruction) is in
// prompts/shop-settings.md: the option's instruction is what the Core agent is told to follow.
const words = key => promptSection('shop-settings', key);
const defineSetting = (key, defaultValue, values) => ({
  key, defaultValue, label: words(key + '.label'), why: words(key + '.why'),
  options: values.map(value => ({ value, label: words(key + '.' + value + '.label'), say: words(key + '.' + value + '.say') })),
});

export const SETTINGS = [
  defineSetting('maint.presentation', () => SHOP.maintenancePresentation || 'prioritized', ['prioritized', 'all']),
  defineSetting('package.severity', () => SHOP.packageSeverity || 'medium', ['high', 'medium', 'low']),
  {
    key: 'labor.presentation',
    label: 'Labor guide recommendations',
    why: 'How I present the add-on labor the labor guide pairs with a repair.',
    defaultValue: () => SHOP.laborGuidePresentation || 'prioritized',
    options: [
      {
        value: 'prioritized',
        label: 'WrenchIQ presents what matters most',
        say: 'Lead with add-on labor that is part of the job or recommended with it. Offer "only if needed" and optional add-ons separately, as conditional on what the technician finds or what the customer wants.',
      },
      {
        value: 'all',
        label: 'Present every add-on the labor guide lists',
        say: 'List every add-on labor row the labor guide pairs with the repair, in the guide\'s order, without ranking or splitting them.',
      },
    ],
  },
];

/**
 * Which parts supplier the repair order uses: NAPA (catalog lookup, the shop pick goes on the RO) or
 * PartsTech (punch-out: the advisor picks parts in PartsTech). Kept apart from SETTINGS, which are
 * about how work is presented; asked in the Shop profile chat and shown in its own section.
 */
export const SUPPLIER_SETTING = defineSetting('parts.supplier', () => (String(SHOP.partsSupplier || 'NAPA').toLowerCase() === 'partstech' ? 'partstech' : 'napa'), ['napa', 'partstech']);
export const SETTINGMAP = Object.fromEntries(SETTINGS.concat(SUPPLIER_SETTING).map(s => [s.key, s]));

/** The shop's choice for a setting, or the default. */
export function setting(key) {
  const def = SETTINGMAP[key], v = S.profile[key] && S.profile[key].value;
  return def && def.options.some(o => o.value === v) ? v : def ? def.defaultValue() : undefined;
}
export const settingOption = key => SETTINGMAP[key].options.find(o => o.value === setting(key));
export const isDefault = key => !S.profile[key] || S.profile[key].value === SETTINGMAP[key].defaultValue();

export function setSetting(key, value) {
  const def = SETTINGMAP[key], opt = def && def.options.find(o => o.value === value);
  if (!opt) return;
  S.profile[key] = { value, display: opt.label, at: Date.now() };
  persistProfile();
  notify();
}

/** 'napa' (default from resources/shop) or 'partstech'. */
export const supplierKey = () => setting('parts.supplier');
/** Display name of the shop's parts supplier: "NAPA" or "PartsTech". */
export const supplierName = () => settingOption('parts.supplier').label;
/** Whether the shop has chosen a supplier (vs. still on the default). */
export const supplierChosen = () => !!(S.profile['parts.supplier'] && SUPPLIER_SETTING.options.some(o => o.value === S.profile['parts.supplier'].value));

/** 'prioritized' (default) or 'all'. */
export const maintMode = () => setting('maint.presentation');
/** 'prioritized' (default) or 'all', for labor-guide add-on labor. */
export const laborMode = () => setting('labor.presentation');

/** Add-on kinds in the order to bring them up (talkTrack.js kinds). */
export const KIND_ORDER = ['required', 'recommended', 'if-needed', 'optional'];
export const isLeadKind = kind => kind === 'required' || kind === 'recommended';
const kindOf = id => (REPMAP[id] && REPMAP[id].talk && REPMAP[id].talk.kind) || 'recommended';
/** Add-on labor ids in the order the shop setting wants them: what matters first, or the guide's order. */
export const orderAddOns = ids => (laborMode() === 'all' ? ids : ids.slice().sort((a, b) => KIND_ORDER.indexOf(kindOf(a)) - KIND_ORDER.indexOf(kindOf(b))));

const joinAnd = l => (l.length <= 1 ? l.join('') : l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1]);

/**
 * The milestone as the schedule lists it, for the 'all' setting: every item in schedule order, no
 * tiers. Uses interpretMaint for what today's repairs already cover, so nothing is sold twice.
 */
export function fullSchedule(ms, ctx = {}) {
  const adv = interpretMaint(ms, ctx);
  if (!adv) return null;
  const known = new Map(adv.tiers.flatMap(t => t.items).map(i => [i.id, i]));
  if (adv.inspection) known.set(adv.inspection.id, { ...adv.inspection, name: adv.inspection.name });
  const items = ms.ids.map(id => known.get(id) || (getMaintItem(id) && { id, name: getMaintItem(id).name, hours: getMaintItem(id).hours, price: ctx.rate ? getMaintItem(id).hours * ctx.rate : null })).filter(Boolean);
  const open = items.filter(i => !i.onOrder && !i.coveredBy);
  const hours = open.reduce((s, i) => s + i.hours, 0);
  const script = 'According to ' + scheduleCite(ms.match, ctx.make) + ', the ' + ms.at.toLocaleString() + ' mile service recommends: ' + joinAnd(items.map(i => i.name.toLowerCase())) + '. '
    + 'That is ' + items.length + ' item' + (items.length > 1 ? 's' : '') + (hours ? ', estimated at about ' + hours.toFixed(1) + ' hours of labor' + (ctx.rate ? ' ($' + Math.round(hours * ctx.rate).toLocaleString() + ')' : '') + ', ' + SRC.estimate : '') + '. ' + SRC.approval;
  return { headline: adv.headline, status: adv.status, items, openIds: open.map(i => i.id), hours, price: ctx.rate ? hours * ctx.rate : null, script };
}
