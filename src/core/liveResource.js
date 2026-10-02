// The Core assistant's data comes from resources/** (labor guide XML/JSON, rules, shop profile,
// demos, maintenance CSVs), imported at build time. In the dev server, which the Tauri app runs on,
// an edit to one of those files is pushed to the open window: the module that reads it re-runs
// (it self-accepts its hot update) and refills the same arrays and objects the rest of the app
// already holds, then the UI re-renders. The conversation and the repair order are kept.
import { notify } from './state';

const G = globalThis.__wiqResources || (globalThis.__wiqResources = { stores: {}, loaded: {}, listeners: {} });

/** One object per name that outlives its module re-running, so importers keep seeing current data. */
export const liveStore = (name, init) => G.stores[name] || (G.stores[name] = init());

export function refillArray(arr, items) {
  arr.length = 0;
  for (const x of items) arr.push(x); // a loop, not push(...items): the maintenance CSVs have thousands of rows
  return arr;
}
export function refillObject(obj, src) {
  Object.keys(obj).forEach(k => { delete obj[k]; });
  return Object.assign(obj, src);
}

/** Run fn(name) after any resource reloads. A key replaces its earlier listener, so re-runs do not stack. */
export const onResourceChange = (key, fn) => { G.listeners[key] = fn; };

/** Call at the end of a module that read a resource: a no-op the first time, a reload signal after that. */
export function resourceLoaded(name) {
  if (!G.loaded[name]) { G.loaded[name] = true; return; }
  Object.values(G.listeners).forEach(fn => { try { fn(name); } catch (e) { console.error('[resources] ' + name + ':', e); } });
  notify();
}
