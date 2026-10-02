// Sample data for the Core assistant prototype: shop-profile questions and the follow-up question
// bank, made up for the demo. The labor guide (laborGuide.js) and scheduled maintenance
// (maintenanceSchedule.js) are loaded from resources/.

import SHOP_PROFILE from '../../resources/shop/core_shop_profile.json';
import { liveStore, refillArray, refillObject, resourceLoaded, onResourceChange } from './liveResource';

const live = liveStore('data', () => ({ SHOP: {}, FIXED: [], FIXEDMAP: {}, ALLKW: [] }));

/** The shop the assistant runs as, from resources/shop. Stated, not asked; the advisor cannot change it in chat. */
export const SHOP = refillObject(live.SHOP, SHOP_PROFILE);
export const FIXED = refillArray(live.FIXED, [
  { key: 'shop.identity', label: 'Shop', value: SHOP.name + ', ' + SHOP.address, say: 'Your shop: ' + SHOP.name + ', ' + SHOP.address + '.' },
  { key: 'parts.supplier', label: 'Parts supplier', value: SHOP.partsSupplier, say: 'Your parts supplier is set to ' + SHOP.partsSupplier + '.', why: 'I look up parts and list prices in the ' + SHOP.partsSupplier + ' catalog for the vehicle on the repair order.' },
  ...(SHOP.partsPolicy ? [{ key: 'parts.policy', label: 'Parts choice', value: SHOP.partsPolicy.label, say: SHOP.partsPolicy.say, why: SHOP.partsPolicy.why }] : []),
]);
export const FIXEDMAP = refillObject(live.FIXEDMAP, Object.fromEntries(FIXED.map(f => [f.key, f])));

// Shop preferences the assistant recognizes when the advisor mentions them. It does not ask for them;
// anything else the advisor says about the shop is kept as a note.
export const PQ = [
  { key: 'shop.labor_rate', label: 'Labor rate', ask: "What's your standard labor rate per hour?", why: 'I multiply labor-guide hours by it to price labor on the repair order.', hint: 'Give me a number, like 145, or say "145 an hour".', type: 'number', min: 10, max: 1000, fmt: v => '$' + v + '/hr' },
  { key: 'shop.diag_rate', label: 'Diagnostic rate', ask: 'Do you charge a different rate for diagnostic time? Say "same" if not.', why: 'Diagnostic hours are often billed apart from repair labor.', hint: 'Give me a number, or say "same".', type: 'number', min: 10, max: 1000, fmt: v => '$' + v + '/hr' },
  { key: 'parts.markup', label: 'Parts markup', ask: "What's your typical parts markup?", why: 'Used to shape parts pricing once part costs are connected.', hint: 'Give me a percentage, like 40.', type: 'number', min: 0, max: 500, fmt: v => v + '%' },
  { key: 'comms.tone', label: 'Message tone', ask: 'How should messages to your customers sound?', why: 'I write customer messages in this voice.', hint: 'Friendly, formal, or short and direct.', type: 'choice', options: ['Friendly and plain', 'Formal', 'Short and direct'] },
  { key: 'comms.languages', label: 'Customer languages', ask: 'Which languages do your customers use?', why: 'I offer translations for these.', hint: 'Name them, like "English and Spanish".', type: 'multi', options: ['English', 'Spanish', 'Vietnamese', 'Chinese', 'Other'] },
  { key: 'upsell.not_offered', label: 'Services you never offer', ask: 'Are there services you never offer?', why: 'I drop these from suggestions so you never see them.', hint: 'Name them, or say "none".', type: 'multi', options: ['Tires', 'Transmission rebuild', 'Body work', 'A/C service', 'Alignment', 'Diesel', 'None'] },
];
export const PQMAP = Object.fromEntries(PQ.map(q => [q.key, q]));

// The labor guide comes from resources/labor_guide (XML rows + enrichment JSON) — see laborGuide.js.
import { REP } from './laborGuide';
export { REP, REPMAP } from './laborGuide';

// Scheduled maintenance now comes from the real OEM data in resources/scheduled_maintenance —
// see src/core/maintenanceSchedule.js (resolveSchedule / computeMaintenanceDue / getMaintItem).

export const QB = [
  { id: 'brk-where', short: 'Location', when: ['brake', 'braking', 'grinding', 'squeal', 'stopping', 'pedal'], ask: 'Where do you hear or feel it, front or rear?', opts: [{ l: 'Front', b: { 'brk-front': 3 } }, { l: 'Rear', b: { 'brk-rear': 3 } }, { l: 'Not sure', b: { 'brk-front': 1, 'brk-rear': 1 } }] },
  { id: 'brk-sound', short: 'Sound', when: ['brake', 'braking', 'grinding', 'squeal', 'squeak', 'pedal'], ask: 'What does it sound or feel like?', opts: [{ l: 'Grinding', b: { 'brk-front': 3, 'brk-rear': 2 } }, { l: 'Squeal', b: { 'brk-front': 2, 'brk-rear': 2 } }, { l: 'Pedal pulses', b: { 'brk-front': 3 } }, { l: 'Clunk', b: { caliper: 3 } }] },
  { id: 'noise-when', short: 'When', when: ['noise', 'clunk', 'knock', 'rattle', 'bump', 'hum', 'growl'], ask: 'When does the noise happen?', opts: [{ l: 'Over bumps', b: { strut: 3, sway: 3 } }, { l: 'When turning', b: { bearing: 3 } }, { l: 'Constant while driving', b: { bearing: 3 } }, { l: 'Only when braking', b: { 'brk-front': 2 } }] },
  { id: 'cel-flash', short: 'Warning light', when: ['check engine', 'engine light', 'misfire'], ask: 'Is the warning light flashing or steady?', opts: [{ l: 'Flashing', b: { coil: 3, plugs: 3 } }, { l: 'Steady', b: { o2: 2, evap: 2 } }] },
  { id: 'rough', short: 'Idle', when: ['check engine', 'engine light', 'misfire', 'rough', 'hesitat', 'idle'], ask: 'Any rough idle or hesitation?', opts: [{ l: 'Yes', b: { coil: 2, plugs: 2 } }, { l: 'No', b: { o2: 1, evap: 1 } }] },
  { id: 'coolant', short: 'Coolant', when: ['overheat', 'running hot', 'temperature', 'coolant', 'steam'], ask: 'Any coolant leak or low level?', opts: [{ l: 'Yes', b: { pump: 2, hose: 3 } }, { l: 'No', b: { thermo: 3 } }] },
  { id: 'crank', short: 'Key turn', unless: ['a/c', 'air conditioning'], when: ["won't start", 'no start', 'dead', 'crank', 'click', 'battery'], ask: 'What happens when you turn the key?', opts: [{ l: 'Nothing at all', b: { battery: 3, alt: 1 } }, { l: 'Clicking', b: { starter: 2, battery: 2 } }, { l: 'Slow crank', b: { battery: 3 } }] },
  { id: 'acq', short: 'A/C', when: ['a/c', 'air conditioning', 'not cold', 'warm air'], ask: 'How does the A/C behave?', opts: [{ l: 'Blows but never gets cold', b: { acrecharge: 3, accomp: 1 } }, { l: 'Cold at first, then warm', b: { accomp: 3 } }] },
  { id: 'vib', short: 'Shake', when: ['vibration', 'shake', 'shimmy', 'wobble'], ask: 'When does it shake?', opts: [{ l: 'Highway speeds', b: { balance: 3, align: 1 } }, { l: 'Only when braking', b: { 'brk-front': 3 } }, { l: 'All the time', b: { align: 2, bearing: 2 } }] },
  { id: 'leak', short: 'Leak', when: ['leak', 'drip', 'puddle', 'oil smell'], ask: 'Where is the leak?', opts: [{ l: 'Top of engine', b: { valvecover: 3 } }, { l: 'Under the engine', b: { oilpan: 3 } }] },
  { id: 'brk-when', short: 'Squeak timing', when: ['squeak', 'squeal', 'screech'], ask: 'When does the brake squeak happen?', opts: [{ l: 'Only when braking', b: { 'brk-pads-f': 2, 'brk-front': 1, 'brk-service': 1 } }, { l: 'All the time while driving', b: { 'brk-service': 2, caliper: 2, bearing: 2 } }, { l: 'Light braking at low speed', b: { 'brk-service': 3, 'brk-pads-f': 1 } }] },
  { id: 'eng-what', short: 'Engine', when: ['engine not working', "engine isn't working", 'engine problem', "won't run", 'stalls', 'stalling', 'stalled', 'engine dies', 'cuts out', 'runs rough', 'loses power'], ask: 'What is the engine doing?', opts: [{ l: 'Does not crank', b: { battery: 3, starter: 2, battcable: 2 } }, { l: 'Cranks but will not start', b: { fuelpump: 3, 'crk-sensor': 2, fuelfilt: 2, 'diag-engine': 2 } }, { l: 'Stalls or dies while driving', b: { maf: 2, 'crk-sensor': 2, fuelpump: 2, throttle: 2, alt: 1 } }, { l: 'Runs rough or loses power', b: { coil: 2, plugs: 2, maf: 2, injector: 1, vacleak: 2 } }] },
  { id: 'cel-drive', short: 'Driving', when: ['check engine', 'engine light'], ask: 'Has the car been driving any differently since the light came on?', opts: [{ l: 'Drives normally', b: { gascap: 3, evap: 2, o2: 1, 'diag-cel': 1 } }, { l: 'Rough or low power', b: { coil: 2, plugs: 2, maf: 2, injector: 1 } }, { l: 'Worse fuel economy', b: { o2: 3, maf: 1, cat: 1 } }] },
  { id: 'ac-air', short: 'Airflow', when: ['a/c', 'air conditioning', 'not cold', 'warm air', 'hot air', 'no cold air', 'vents'], ask: 'How is the airflow from the vents?', opts: [{ l: 'Weak airflow', b: { blower: 3, 'blower-res': 2, 'cabin-filt': 3 } }, { l: 'Strong but warm', b: { acrecharge: 2, 'ac-leak': 2, accomp: 1, 'ac-cond': 1 } }, { l: 'No air at all', b: { blower: 3, 'blower-res': 3 } }] },
  { id: 'ac-noise', short: 'A/C noise', when: ['a/c', 'air conditioning', 'not cold', 'warm air'], ask: 'Any noise from the compressor, or clicking when the A/C is switched on?', opts: [{ l: 'Loud noise', b: { accomp: 3, 'ac-clutch': 2 } }, { l: 'Clicks but does not engage', b: { 'ac-clutch': 3, 'ac-switch': 2 } }, { l: 'No noise', b: { 'ac-leak': 2, acrecharge: 1 } }] },
];
export const QWHY = { 'brk-when': 'The timing separates worn pads from dry hardware or a bearing.', 'eng-what': 'No crank, crank without start, stalling and rough running each point to different systems.', 'cel-drive': 'A light with no change in driving is often a cap or emissions item; rough running points to ignition or air.', 'ac-air': 'Weak airflow points to the blower or a clogged filter; warm but strong air points to the refrigerant side.', 'ac-noise': 'Compressor noise or a clutch that clicks without engaging separates a bad compressor or clutch from a low charge.', 'brk-where': 'Front and rear brakes are different repairs with different labor times.', 'brk-sound': 'The sound separates worn pads from rotors, calipers and other causes.', 'noise-when': 'When the noise happens points to suspension, bearings or brakes.', 'cel-flash': 'A flashing light means active misfires, which changes what to check first.', rough: 'Rough running separates ignition problems from emissions sensors.', coolant: 'A coolant leak points to hoses or the water pump, no leak points to the thermostat.', crank: 'What the engine does when you turn the key separates a battery from a starter.', acq: 'This separates a low charge from a failing compressor.', vib: 'Speed and braking narrow a shake down to tires, alignment or brakes.', leak: 'Where the leak is decides which gasket to check.', dur: 'How long it has been going on helps the advisor judge urgency.' };
export const QDUR = { id: 'dur', short: 'Duration', when: [], ask: 'How long has this been going on?', opts: [{ l: 'Just started', b: {} }, { l: 'A few days', b: {} }, { l: 'Weeks or more', b: {} }] };
export const QBY = Object.fromEntries(QB.concat([QDUR]).map(q => [q.id, q]));
const allKeywords = () => {
  const s = new Set();
  REP.forEach(r => r.strong.concat(r.kw).forEach(k => s.add(k)));
  QB.forEach(q => q.when.forEach(k => s.add(k)));
  return Array.from(s);
};
export const ALLKW = refillArray(live.ALLKW, allKeywords());
// labor-guide keywords change when its files do
onResourceChange('data.allkw', name => { if (name === 'labor guide') refillArray(ALLKW, allKeywords()); });
export const BLOCK = { 'A/C service': ['acrecharge', 'accomp'], Alignment: ['align'], Tires: ['balance'] };

export const MAKES = { toyota: 'Toyota', honda: 'Honda', ford: 'Ford', chevrolet: 'Chevrolet', chevy: 'Chevrolet', nissan: 'Nissan', hyundai: 'Hyundai', kia: 'Kia', subaru: 'Subaru', mazda: 'Mazda', volkswagen: 'Volkswagen', vw: 'Volkswagen', bmw: 'BMW', mercedes: 'Mercedes-Benz', audi: 'Audi', jeep: 'Jeep', ram: 'Ram', gmc: 'GMC', dodge: 'Dodge', lexus: 'Lexus', acura: 'Acura' };
export const MODELS = { corolla: ['Corolla', 'Toyota'], camry: ['Camry', 'Toyota'], rav4: ['RAV4', 'Toyota'], tacoma: ['Tacoma', 'Toyota'], sienna: ['Sienna', 'Toyota'], highlander: ['Highlander', 'Toyota'], prius: ['Prius', 'Toyota'], tundra: ['Tundra', 'Toyota'], '4runner': ['4Runner', 'Toyota'], odyssey: ['Odyssey', 'Honda'], pilot: ['Pilot', 'Honda'], civic: ['Civic', 'Honda'], accord: ['Accord', 'Honda'], 'cr-v': ['CR-V', 'Honda'], crv: ['CR-V', 'Honda'], 'f-150': ['F-150', 'Ford'], f150: ['F-150', 'Ford'], escape: ['Escape', 'Ford'], explorer: ['Explorer', 'Ford'], silverado: ['Silverado', 'Chevrolet'], malibu: ['Malibu', 'Chevrolet'], equinox: ['Equinox', 'Chevrolet'], altima: ['Altima', 'Nissan'], sentra: ['Sentra', 'Nissan'], elantra: ['Elantra', 'Hyundai'], sonata: ['Sonata', 'Hyundai'], outback: ['Outback', 'Subaru'], forester: ['Forester', 'Subaru'], mazda3: ['Mazda3', 'Mazda'], 'cx-5': ['CX-5', 'Mazda'], golf: ['Golf', 'Volkswagen'], jetta: ['Jetta', 'Volkswagen'], wrangler: ['Wrangler', 'Jeep'] };
const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export const MAKE_RX = new RegExp('\\b(' + Object.keys(MAKES).map(rxEsc).join('|') + ')\\b', 'i');
export const MODEL_RX = new RegExp('\\b(' + Object.keys(MODELS).map(rxEsc).join('|') + ')\\b', 'i');
export const SAMPLE_MSG = '2018 Toyota Corolla 1.8L, 61k miles. Grinding noise when I brake and the steering wheel shakes on the highway.';

resourceLoaded('shop profile');
if (import.meta.hot) import.meta.hot.accept();
