import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/core/partsApi.js', () => ({
  searchNapa: vi.fn(async ({ part }) => {
    if (part === 'down') return { ok: false, code: 'network', message: 'offline' };
    if (part === 'ghost') return { ok: true, parts: [] };
    return { ok: true, parts: [
      { partNumber: 'A', listPrice: 82.49, availability: { etaHours: 24, short: 'tomorrow' } },
      { partNumber: 'B', listPrice: null, availability: { etaHours: 0, short: 'in stock' } },
      { partNumber: 'C', listPrice: 94.6, availability: { etaHours: 0, short: 'in stock' } },
    ] };
  }),
}));

import { S, newRO } from '../src/core/state.js';
import { searchNapa } from '../src/core/partsApi.js';
import { partPrice, prefetchPartPrices } from '../src/core/partPrices.js';

const flush = () => new Promise(r => setTimeout(r, 0));

describe('part chip prices', () => {
  beforeEach(() => { S.profile = { 'parts.supplier': { value: 'napa' } }; S.ro = { ...newRO(), year: '2018', make: 'Toyota', model: 'Corolla' }; searchNapa.mockClear(); }); // these tests price parts from NAPA's catalog; the shop default is PartsTech

  it('keeps the shop pick: soonest available priced part, not the cheapest', async () => {
    prefetchPartPrices(['Front brake pads (set)']);
    expect(partPrice('Front brake pads (set)')).toEqual({ status: 'loading' });
    await flush();
    expect(partPrice('Front brake pads (set)')).toMatchObject({ status: 'ok', pick: { partNumber: 'C', listPrice: 94.6 } });
  });
  it('looks each part up once per vehicle, and again for a different vehicle', async () => {
    prefetchPartPrices(['Rotor']); prefetchPartPrices(['Rotor']); await flush();
    expect(searchNapa).toHaveBeenCalledTimes(1);
    S.ro.model = 'Camry';
    expect(partPrice('Rotor')).toBeUndefined();
    prefetchPartPrices(['Rotor']); await flush();
    expect(searchNapa).toHaveBeenCalledTimes(2);
  });
  it('records no match and failures without retrying them on every render', async () => {
    prefetchPartPrices(['ghost', 'down']); await flush();
    expect(partPrice('ghost')).toEqual({ status: 'none' });
    expect(partPrice('down')).toEqual({ status: 'error' });
    prefetchPartPrices(['ghost', 'down']); await flush();
    expect(searchNapa).toHaveBeenCalledTimes(2);
  });
});
