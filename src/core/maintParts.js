// Parts for any line on the order: a labor-guide row lists its own (labor_guide_enrichment.json);
// a scheduled-maintenance line gets them from resources/scheduled_maintenance/maintenance_parts.json
// by the schedule's terms, for REPLACE operations only.
import MP from '../../resources/scheduled_maintenance/maintenance_parts.json';
import { liveStore, refillObject, resourceLoaded } from './liveResource';

const store = refillObject(liveStore('maintParts', () => ({})), MP);

/** Maintenance line ids are "sm:<vinMask>:<miles>:<terms joined by +>:<operation>". */
function termsAndOp(id) {
  const p = String(id).split(':');
  return p[0] === 'sm' && p.length === 5 ? { terms: p[3].split('+'), op: p[4] } : null;
}

/**
 * @returns {{name: string, confirm?: string, price?: boolean}[]} at most 3 parts; price false means
 *   list it for the advisor to add by hand, do not look it up.
 */
export function partsFor(it) {
  if (!it) return [];
  if (it.src === 'lg') return (it.parts || []).slice(0, 3).map(name => ({ name }));
  if (it.src !== 'sm') return [];
  const t = termsAndOp(it.id);
  if (!t || !(store.operations || []).includes(t.op)) return [];
  const out = [];
  t.terms.forEach(term => (store.parts[term] || []).forEach(p => { if (!out.some(o => o.name === p.name)) out.push(p); }));
  return out.slice(0, 3);
}

/** Names to look up at NAPA. */
export const pricedPartNames = it => partsFor(it).filter(p => p.price !== false).map(p => p.name);

resourceLoaded('maintenance parts');
if (import.meta.hot) import.meta.hot.accept();
