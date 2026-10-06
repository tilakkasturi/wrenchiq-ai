import { describe, it, expect, beforeEach, vi } from 'vitest';

const searchNapa = vi.fn();
vi.mock('../src/core/partsApi.js', () => ({ searchNapa: (...a) => searchNapa(...a) }));

import { S, newRO } from '../src/core/state.js';
import { acceptItem, removeItem, swapPart, Cr } from '../src/core/harness.js';

const row = (n, price) => ({ supplier: 'NAPA', lineCode: 'AAA', partNumber: n, description: n + ' desc', brand: 'NAPA', quality: '', listPrice: price, core: 0, perCarQty: 1, warranty: '' });
const ok = parts => ({ ok: true, supplier: 'NAPA', priceBasis: 'NAPA catalog list price', retrievedAt: new Date().toISOString(), parts });

const settle = () => Cr.run(async () => {});
const items = () => S.chats.ro.items;
const cards = () => items().filter(i => i.kind === 'cards' && i.card.type === 'parts').map(i => i.card);
const said = () => items().filter(i => i.kind === 'agent').map(i => i.text);

beforeEach(() => {
  S.profile = { 'parts.supplier': { value: 'napa' } }; // these tests price parts from NAPA's catalog; the shop default is PartsTech
  S.ro = { ...newRO(), started: true };
  S.chats.ro = { items: [], chips: [], nextId: 1 };
  searchNapa.mockReset();
});

describe('adding a repair prices its parts from NAPA', () => {
  it('looks up each part the repair lists and shows a card per match, none for no-match', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockImplementation(async ({ part }) => (/hardware/i.test(part) ? ok([]) : ok([row(part, 82.49)])));
    acceptItem('brk-front');
    await settle();
    expect(searchNapa).toHaveBeenCalledTimes(3);
    expect(searchNapa.mock.calls.map(c => c[0].part)).toEqual(['Front brake pads (set)', 'Front brake rotors (2)', 'Brake hardware kit']);
    expect(searchNapa.mock.calls[0][0]).toMatchObject({ year: '2018', make: 'Toyota', model: 'Corolla' });
    expect(cards()).toHaveLength(2);
    expect(cards().every(c => c.type === 'parts' && !c.readOnly)).toBe(true);
    expect(cards()[1].qty).toBe(2); // "Front brake rotors (2)"
    expect(said().join(' ')).toMatch(/Not on the RO, no NAPA price to use: Brake hardware kit/);
    expect(S.ro.accepted.has('brk-front')).toBe(true);
    // the shop decides: the pick for each priced part goes on the RO, tied to the line
    expect(S.ro.parts.added.map(p => [p.label, p.qty, p.forLine])).toEqual([['Front brake pads (set)', 1, 'brk-front'], ['Front brake rotors (2)', 2, 'brk-front']]);
  });
  it('adds the shop pick (availability first), not the cheapest part', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockImplementation(async ({ part }) => (/pads/i.test(part)
      ? ok([{ ...row('CHEAP', 82.49), availability: { etaHours: 24, short: 'tomorrow' } }, { ...row('NOW', 94.6), availability: { etaHours: 0, short: 'in stock' } }])
      : ok([])));
    acceptItem('brk-front'); await settle();
    expect(S.ro.parts.added.map(p => p.partNumber)).toEqual(['NOW']);
    expect(said().join(' ')).toMatch(/shop picks .* AAA NOW, \$94\.60, in stock/);
  });
  it('removing the repair takes its parts off, and a swap keeps the part tied to the line', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockImplementation(async ({ part }) => ok([row(part.slice(0, 5), 50), row(part.slice(0, 4) + 'Z', 60)]));
    acceptItem('brk-front'); await settle();
    const pads = S.ro.parts.added[0];
    swapPart(pads.key, row('Front' + 'Z', 60), pads.label, 1, pads.fit);
    expect(S.ro.parts.added.find(p => p.label === pads.label)).toMatchObject({ partNumber: 'FrontZ', forLine: 'brk-front' });
    S.ro.parts.added.push({ key: 'MANUAL|1', label: 'Wiper blade', each: 20, qty: 1 }); // added by hand, no line
    removeItem('brk-front');
    expect(S.ro.parts.added.map(p => p.key)).toEqual(['MANUAL|1']);
  });
  it('does not look up again when the same repair is re-added', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockResolvedValue(ok([row('X1', 10)]));
    acceptItem('brk-front'); await settle();
    S.ro.accepted.delete('brk-front');
    acceptItem('brk-front'); await settle();
    expect(searchNapa).toHaveBeenCalledTimes(3);
  });
  it('asks for the vehicle instead of guessing when it is incomplete', async () => {
    acceptItem('brk-front'); await settle();
    expect(searchNapa).not.toHaveBeenCalled();
    expect(said().join(' ')).toMatch(/year, make and model/);
    expect(cards()).toHaveLength(0);
  });
  it('says so, with no prices, when NAPA cannot be reached, and tries again next time', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockResolvedValue({ ok: false, code: 'napa_unavailable', message: 'NAPA did not answer: down' });
    acceptItem('brk-front'); await settle();
    expect(cards()).toHaveLength(0);
    expect(said().join(' ')).toMatch(/NAPA did not answer/);
    expect(S.ro.autoPriced.has('brk-front')).toBe(false);
  });
  it('maintenance items and repairs without parts do not trigger a lookup', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    acceptItem('sm-oil'); acceptItem('align'); await settle();
    expect(searchNapa).not.toHaveBeenCalled();
  });
});
