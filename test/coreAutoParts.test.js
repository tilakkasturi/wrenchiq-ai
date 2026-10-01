import { describe, it, expect, beforeEach, vi } from 'vitest';

const searchNapa = vi.fn();
vi.mock('../src/core/partsApi.js', () => ({ searchNapa: (...a) => searchNapa(...a) }));

import { S, newRO } from '../src/core/state.js';
import { acceptItem, Cr } from '../src/core/harness.js';

const row = (n, price) => ({ supplier: 'NAPA', lineCode: 'AAA', partNumber: n, description: n + ' desc', brand: 'NAPA', quality: '', listPrice: price, core: 0, perCarQty: 1, warranty: '' });
const ok = parts => ({ ok: true, supplier: 'NAPA', priceBasis: 'NAPA catalog list price', retrievedAt: new Date().toISOString(), parts });

const settle = () => Cr.run(async () => {});
const items = () => S.chats.ro.items;
const cards = () => items().filter(i => i.kind === 'cards').map(i => i.card);
const said = () => items().filter(i => i.kind === 'agent').map(i => i.text);

beforeEach(() => {
  S.profile = {};
  S.ro = { ...newRO(), started: true };
  S.chats.ro = { items: [], chips: [], nextId: 1 };
  searchNapa.mockReset();
});

describe('adding a repair prices its parts from NAPA', () => {
  it('looks up each part the repair lists and shows a card per match, none for no-match', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    searchNapa.mockImplementation(async ({ part }) => (/hardware/i.test(part) ? ok([]) : ok([row(part.slice(0, 5), 82.49)])));
    acceptItem('brk-front');
    await settle();
    expect(searchNapa).toHaveBeenCalledTimes(3);
    expect(searchNapa.mock.calls.map(c => c[0].part)).toEqual(['Front brake pads (set)', 'Front brake rotors (2)', 'Brake hardware kit']);
    expect(searchNapa.mock.calls[0][0]).toMatchObject({ year: '2018', make: 'Toyota', model: 'Corolla' });
    expect(cards()).toHaveLength(2);
    expect(cards().every(c => c.type === 'parts' && !c.readOnly)).toBe(true);
    expect(cards()[1].qty).toBe(2); // "Front brake rotors (2)"
    expect(said().join(' ')).toMatch(/No NAPA match for: Brake hardware kit/);
    expect(S.ro.accepted.has('brk-front')).toBe(true);
    expect(S.ro.parts.added).toHaveLength(0); // nothing is added until the advisor presses Add to RO
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
