// The shop's parts policy (resources/shop/core_shop_profile.json → partsPolicy): how the assistant
// picks a part on the shop's behalf. Default rule: availability first (soonest ETA), then the
// lowest list price among those. Parts with no catalog price go last, since they cannot be added.
// Availability is SAMPLE data in this demo (server/services/partsAvailabilityService.js).
import { SHOP } from './data';

const DEFAULT = { rule: 'availability_then_price', label: 'Availability first, then lowest price' };
export const policy = () => SHOP.partsPolicy || DEFAULT;

const eta = r => (r.availability && Number.isFinite(r.availability.etaHours) ? r.availability.etaHours : Infinity);
const price = r => (typeof r.listPrice === 'number' ? r.listPrice : Infinity);

/** Rows in the order the shop would choose them. Does not change the input. */
export function rankParts(rows, rule = policy().rule) {
  const byPrice = (a, b) => price(a) - price(b), byEta = (a, b) => eta(a) - eta(b);
  const priced = r => (typeof r.listPrice === 'number' ? 0 : 1);
  return [...(rows || [])].sort((a, b) => priced(a) - priced(b)
    || (rule === 'price_then_availability' ? byPrice(a, b) || byEta(a, b) : byEta(a, b) || byPrice(a, b)));
}

/** The part the shop would pick, or null when none can be priced. */
export function shopPick(rows, rule) {
  const top = rankParts(rows, rule)[0];
  return top && typeof top.listPrice === 'number' ? top : null;
}

/** One short reason for the pick, e.g. "in stock, $94.60; lowest-priced option is $82.49 (tomorrow)". */
export function pickReason(rows, pick) {
  if (!pick) return '';
  const cheapest = [...rows].filter(r => typeof r.listPrice === 'number').sort((a, b) => a.listPrice - b.listPrice)[0];
  const at = r => (r.availability ? r.availability.short : 'availability unknown');
  let s = at(pick) + ' at $' + pick.listPrice.toFixed(2);
  if (cheapest && cheapest !== pick && cheapest.listPrice < pick.listPrice) s += '; the cheapest option is $' + cheapest.listPrice.toFixed(2) + ' but ' + at(cheapest);
  return s;
}
