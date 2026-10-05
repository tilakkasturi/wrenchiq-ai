// How the assistant explains itself in the Shop profile chat: the shop's current settings and the
// topics in resources/shop/how_it_works.json (labor guide, scheduled maintenance, parts, flow, talk
// tracks, memory), with the live settings filled in. The same text is the model's knowledge in agent
// mode and the answer itself when the model is offline.
import HOW from '../../resources/shop/how_it_works.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';
import { S } from './state';
import { SHOP, FIXED, PQ } from './data';
import { SETTINGS, setting, settingOption, isDefault } from './shopSettings';
import { rate } from './logic';

export const HOW_IT_WORKS = refillObject(liveStore('howItWorks', () => ({})), HOW);

const lowerFirst = s => s.charAt(0).toLowerCase() + s.slice(1);

/** The settings as the shop has them now: fixed facts, the presentation settings, what the shop told us. */
export function currentSettings() {
  const fixed = FIXED.map(f => ({ label: f.label, value: (S.profile[f.key] && S.profile[f.key].display) || f.value }));
  const parts = SHOP.partsPolicy ? [{ label: 'Parts choice', value: SHOP.partsPolicy.label, say: SHOP.partsPolicy.say }] : [];
  const pres = SETTINGS.map(s => ({ label: s.label, value: settingOption(s.key).label + (isDefault(s.key) ? ' (default)' : ''), say: settingOption(s.key).say }));
  const facts = PQ.filter(q => S.profile[q.key]).map(q => ({ label: q.label, value: S.profile[q.key].display }))
    .concat(Object.keys(S.profile).filter(k => k.startsWith('note.')).sort().map(k => ({ label: 'Note', value: S.profile[k].display })));
  return { settings: fixed.concat(parts, pres), facts };
}

function vars() {
  const lr = rate();
  return {
    shop: SHOP.name + ', ' + SHOP.address,
    supplier: SHOP.partsSupplier,
    partsRule: SHOP.partsPolicy ? SHOP.partsPolicy.say : '',
    partsWhy: SHOP.partsPolicy ? SHOP.partsPolicy.why : '',
    maintSetting: '"' + settingOption('maint.presentation').label + '": ' + lowerFirst(settingOption('maint.presentation').say),
    laborSetting: '"' + settingOption('labor.presentation').label + '": ' + lowerFirst(settingOption('labor.presentation').say),
    laborRate: lr ? '$' + lr + ' an hour' : 'not set yet; tell me, for example "labor rate is 150"',
  };
}
const fill = (text, v) => String(text).replace(/\{\{(\w+)\}\}/g, (m, k) => (v[k] !== undefined ? v[k] : m));

/** "Your current settings" as a short readable list. */
export function settingsAnswer() {
  const { settings, facts } = currentSettings();
  const line = x => '- ' + x.label + ': ' + x.value;
  return 'Here is what is set up for ' + SHOP.name + ':\n' + settings.map(line).join('\n')
    + (facts.length ? '\nWhat you have told me:\n' + facts.map(line).join('\n') : '\nYou have not told me any other preferences yet.');
}

/** Every topic with the live settings filled in: the model's knowledge, and the offline answers. */
export function knowledge() {
  const v = vars();
  return HOW_IT_WORKS.topics.map(t => ({ id: t.id, title: t.title, answer: t.id === 'settings' ? settingsAnswer() : fill(t.answer, v) }));
}

/** What the Shop profile agent gets with each question. */
export function profileContext() {
  const { settings, facts } = currentSettings();
  return { mode: 'profile', shop: SHOP.name + ', ' + SHOP.address, supplier: SHOP.partsSupplier, settings, facts, knowledge: knowledge() };
}

/** The answer when the model is not used: the topics the question matches (at most two), else the overview. */
export function offlineAnswer(question) {
  const q = String(question).toLowerCase(), all = knowledge();
  const hit = HOW_IT_WORKS.topics.filter(t => new RegExp(t.match, 'i').test(q)).slice(0, 2).map(t => all.find(k => k.id === t.id));
  if (hit.length) return hit.map(h => h.answer).join('\n\n');
  return 'I can explain how I work and what is set up. Ask me about your settings, how I use the labor guide, scheduled maintenance, how I pick parts, or what I tell your customers.';
}

export const exampleQuestions = () => HOW_IT_WORKS.questions || [];

resourceLoaded('how it works');
if (import.meta.hot) import.meta.hot.accept();
