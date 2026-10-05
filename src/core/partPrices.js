// The shop's pick per part name (partPolicy.js: availability first, then lowest price), for the
// price on the Likely Repairs part chips. One lookup
// per vehicle + part for the session (the server also caches NAPA for 5 minutes); the chip shows
// whatever is known and re-renders through notify() when a lookup lands.
import { S, notify } from './state';
import { searchNapa } from './partsApi';
import { shopPick } from './partPolicy';
import { supplierKey } from './shopSettings';

const cache = new Map(); // key -> { status: 'loading' | 'ok' | 'none' | 'error', pick?: row }

const keyFor = (R, part) => [R.year, R.make, R.model, part].join('|').toLowerCase();

/** What is known about a part's price on the current vehicle, or undefined if never looked up. */
export function partPrice(part) {
  if (supplierKey() === 'partstech') return { status: 'partstech' };
  return cache.get(keyFor(S.ro, part));
}

/** Start lookups for any of these parts not yet priced on the current vehicle. */
export function prefetchPartPrices(parts) {
  const R = S.ro, { year, make, model } = R;
  parts.forEach(part => {
    const k = keyFor(R, part);
    if (cache.has(k)) return;
    // PartsTech is punch-out: there is no price until the advisor picks the part in PartsTech
    if (supplierKey() === 'partstech') return;
    cache.set(k, { status: 'loading' });
    searchNapa({ year, make, model, part }).then(res => {
      const pick = res.ok ? shopPick(res.parts) : null;
      // a failure is cached too, so a re-render does not retry it in a loop; clicking the chip
      // still runs a full lookup, and a vehicle change starts fresh keys
      cache.set(k, !res.ok ? { status: 'error' } : pick ? { status: 'ok', pick } : { status: 'none' });
      notify();
    });
  });
}
