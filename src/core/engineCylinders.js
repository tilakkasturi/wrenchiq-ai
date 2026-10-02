// Engine cylinder counts, from resources/vehicle/engine_cylinders.json. Spark plugs and ignition
// coils on replace-all jobs are one per cylinder, so their quantity comes from here.
// Order of trust: the engine on the repair order (its cylinder layout, e.g. "V6", "2.5L I4", or its
// displacement matched against this vehicle's engines), then this file when every engine the
// vehicle came with has the same count. Otherwise the count is unknown and the assistant asks which
// engine, offering this vehicle's engines from the file. Nothing is guessed.
import DATA from '../../resources/vehicle/engine_cylinders.json';
import { S } from './state';
import { liveStore, refillArray, resourceLoaded } from './liveResource';

const live = liveStore('engineCylinders', () => ({ VEHICLES: [] }));
export const VEHICLES = refillArray(live.VEHICLES, DATA.vehicles);

const lc = s => String(s || '').trim().toLowerCase();
const norm = s => lc(s).replace(/[^a-z0-9]/g, '');

/** Cylinders stated by the engine text itself: V6, I4, H4, I5, W12, "6-cyl", "4 cylinder". */
export function cylindersInText(engine) {
  const e = String(engine || '');
  let m = e.match(/\b[VIHLW]-?(\d{1,2})\b/i);
  if (m) return parseInt(m[1], 10);
  m = e.match(/\b(\d{1,2})\s*-?\s*cyl(?:inders?)?\b/i);
  return m ? parseInt(m[1], 10) : null;
}

/** This vehicle's engines from the file, or [] when it is not listed. */
export function enginesFor(year, make, model) {
  const y = parseInt(year, 10);
  const v = VEHICLES.find(x => lc(x.make) === lc(make) && norm(x.model) === norm(model) && y >= x.from && y <= x.to);
  return v ? v.engines : [];
}

const isDiesel = (engine, known) => /diesel|tdi|duramax|power ?stroke|ecodiesel/i.test(engine || '') || (known && known.fuel === 'diesel');

/**
 * What is known about the current vehicle's cylinders.
 * @returns {{cylinders: number|null, diesel: boolean, source: string, options: {engine:string, cylinders:number, fuel?:string}[]}}
 */
export function engineSpec(R = S.ro) {
  const engines = enginesFor(R.year, R.make, R.model);
  const stated = cylindersInText(R.engine);
  // the engine on the RO, matched to a listed engine by displacement when it gives no layout
  const disp = (String(R.engine || '').match(/(\d\.\d)\s*l/i) || [])[1];
  const byDisp = disp ? engines.filter(e => e.engine.startsWith(disp + 'L')) : [];
  const known = byDisp.length === 1 ? byDisp[0] : null;
  if (stated) return { cylinders: stated, diesel: isDiesel(R.engine, known), source: 'engine', options: [] };
  if (known) return { cylinders: known.cylinders, diesel: isDiesel(R.engine, known), source: 'engine', options: [] };
  const counts = [...new Set(engines.map(e => e.cylinders))];
  if (counts.length === 1) return { cylinders: counts[0], diesel: engines.every(e => e.fuel === 'diesel'), source: 'vehicle', options: [] };
  return { cylinders: null, diesel: false, source: engines.length ? 'ask' : 'unknown', options: engines };
}

/**
 * Parts that come one per cylinder: spark plugs and ignition coils, unless the labor row is for
 * one coil or plug ("each", "one", "each additional").
 */
export function perCylinder(partName, line) {
  if (!/\bspark plugs?\b|\bignition coils?\b/i.test(String(partName || ''))) return false;
  if (line) return !/\b(each|one)\b/i.test((line.note || '') + ' ' + (line.name || ''));
  // looked up by name with no line: only the plural ("spark plugs", "ignition coils") is a full set
  return /\bplugs\b|\bcoils\b|\(set\)/i.test(partName);
}

resourceLoaded('engine cylinders');
if (import.meta.hot) import.meta.hot.accept();
