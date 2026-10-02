import { describe, it, expect, beforeEach, vi } from 'vitest';

const searchNapa = vi.fn();
vi.mock('../src/core/partsApi.js', () => ({ searchNapa: (...a) => searchNapa(...a) }));

import { S, newRO } from '../src/core/state.js';
import { beginTurn, endTurn, trace, clearTrace } from '../src/core/trace.js';
import { acceptItem, Cr } from '../src/core/harness.js';

const settle = () => Cr.run(async () => {});
const titles = turn => turn.steps.map(s => s.kind + ':' + s.title);

beforeEach(() => {
  S.profile = {};
  S.useAgent = false;
  S.ro = { ...newRO(), started: true };
  S.chats.ro = { items: [], chips: [], nextId: 1 };
  clearTrace();
  searchNapa.mockReset();
  searchNapa.mockImplementation(async ({ part }) => ({ ok: true, availabilityBasis: 'Sample', parts: [
    { lineCode: 'A', partNumber: part + '-cheap', listPrice: 50, availability: { etaHours: 24, short: 'tomorrow', label: 'Next day' } },
    { lineCode: 'A', partNumber: part + '-now', listPrice: 60, availability: { etaHours: 0, short: 'in stock', label: 'In stock' } },
  ] }));
});

describe('agent trace', () => {
  it('a step with no turn open becomes its own closed turn; turns are newest first and capped', () => {
    trace('note', 'Lonely', 'x');
    expect(S.trace.open).toBeNull();
    for (let i = 0; i < 45; i++) { beginTurn('ui', 'n' + i); endTurn(); }
    expect(S.trace.turns).toHaveLength(40);
    expect(S.trace.turns[0].text).toBe('n44');
  });
  it('snapshots data so later changes to the order do not rewrite the trace', () => {
    const t = beginTurn('ui', 'snap');
    const o = { ids: new Set(['a']) };
    trace('rule', 'R', '', o);
    o.ids.add('b');
    endTurn(t);
    expect(S.trace.turns[0].steps[0].data).toEqual({ ids: ['a'] });
  });
  it('a scripted message traces the ranking, maintenance and the combined question', async () => {
    Cr.send('2018 Toyota Corolla 61k miles, grinding when braking'); await settle();
    const turn = S.trace.turns[0];
    expect(turn).toMatchObject({ source: 'scripted', text: '2018 Toyota Corolla 61k miles, grinding when braking' });
    expect(turn.ms).not.toBeNull();
    expect(titles(turn)).toEqual(expect.arrayContaining(['rule:Rank repairs (labor guide)', 'rule:Maintenance schedule', 'rule:Combined question']));
    const rank = turn.steps.find(s => s.title === 'Rank repairs (labor guide)');
    expect(rank.data.ranked[0]).toMatchObject({ id: 'brk-front', score: expect.any(Number) });
    expect(rank.data.rule).toMatch(/\+4 per strong keyword/);
  }, 20000);
  it('Add to RO traces the labor rules, the add-on selection and each parts pick with its quantity rule', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Corolla' });
    acceptItem('brk-front'); await settle();
    const turn = S.trace.turns[0];
    expect(turn).toMatchObject({ source: 'ui', text: 'Add to RO · Front brake pads and rotors, replace' });
    expect(titles(turn)).toEqual(expect.arrayContaining(['rule:Labor rules · Front brake pads and rotors, replace', 'rule:Add-on labor for Front brake pads and rotors, replace', 'rule:Parts pick · Front brake rotors (2)']));
    const rotors = turn.steps.find(s => s.title === 'Parts pick · Front brake rotors (2)');
    expect(rotors.data).toMatchObject({ pick: 'A Front brake rotors (2)-now', quantity_rule: '2 from "(2)" in the part name' });
    const addOns = turn.steps.find(s => s.title.startsWith('Add-on labor'));
    expect(addOns.data.component).toBe('DISC BRAKE ROTOR');
  }, 20000);
});
