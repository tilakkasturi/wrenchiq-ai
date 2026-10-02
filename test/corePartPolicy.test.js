import { describe, it, expect } from 'vitest';
import { rankParts, shopPick, pickReason, policy } from '../src/core/partPolicy.js';
import { FIXEDMAP } from '../src/core/data.js';
import { withSampleAvailability, tierFor } from '../server/services/partsAvailabilityService.js';

const row = (partNumber, listPrice, etaHours, short) => ({ lineCode: 'X', partNumber, listPrice, availability: etaHours === undefined ? undefined : { etaHours, short } });

describe('shop parts policy', () => {
  it('is in the default shop profile as a fixed fact', () => {
    expect(policy().rule).toBe('availability_then_price');
    expect(FIXEDMAP['parts.policy']).toMatchObject({ label: 'Parts choice', value: 'Availability first, then lowest price' });
  });
  it('ranks availability first, then price; unpriced parts last', () => {
    const rows = [row('cheap-late', 40, 24, 'tomorrow'), row('nop', null, 0, 'in stock'), row('mid-now', 60, 0, 'in stock'), row('low-now', 55, 0, 'in stock')];
    expect(rankParts(rows).map(r => r.partNumber)).toEqual(['low-now', 'mid-now', 'cheap-late', 'nop']);
    expect(rows[0].partNumber).toBe('cheap-late'); // input untouched
  });
  it('the price-first rule is supported too', () => {
    const rows = [row('late', 40, 24), row('now', 60, 0)];
    expect(shopPick(rows, 'price_then_availability').partNumber).toBe('late');
  });
  it('picks nothing when no option has a price, and explains a pick that is not the cheapest', () => {
    expect(shopPick([row('a', null, 0)])).toBeNull();
    const rows = [row('late', 82.49, 24, 'tomorrow'), row('now', 94.6, 0, 'in stock')];
    expect(pickReason(rows, shopPick(rows))).toBe('in stock at $94.60; the cheapest option is $82.49 but tomorrow');
  });
});

describe('sample availability', () => {
  const cfg = { basis: 'Sample', overrides: { 'PFB|1': 3 }, tiers: [
    { tier: 0, label: 'In stock', short: 'in stock', etaHours: 0, weight: 5 },
    { tier: 3, label: 'Special order', short: '2-3 days', etaHours: 60, weight: 1 },
  ] };
  it('is stable per part number, honours overrides, and is always marked sample', () => {
    expect(tierFor('NAP|123', cfg)).toBe(tierFor('NAP|123', cfg));
    const out = withSampleAvailability({ parts: [{ lineCode: 'PFB', partNumber: '1', listPrice: 9 }] }, cfg);
    expect(out.availabilityBasis).toBe('Sample');
    expect(out.parts[0].availability).toEqual({ sample: true, tier: 3, label: 'Special order', short: '2-3 days', etaHours: 60 });
  });
  it('reads the shipped tiers file', () => {
    const out = withSampleAvailability({ parts: [{ lineCode: 'A', partNumber: 'B', listPrice: 1 }] });
    expect(out.parts[0].availability.sample).toBe(true);
    expect(out.availabilityBasis).toMatch(/not live stock/);
  });
});
