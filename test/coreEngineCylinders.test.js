import { describe, it, expect, beforeEach, vi } from 'vitest';

const searchNapa = vi.fn();
vi.mock('../src/core/partsApi.js', () => ({ searchNapa: (...a) => searchNapa(...a) }));

import { S, newRO } from '../src/core/state.js';
import { REPMAP } from '../src/core/data.js';
import { cylindersInText, engineSpec, perCylinder, enginesFor } from '../src/core/engineCylinders.js';
import { acceptItem, saveVehicle, Cr } from '../src/core/harness.js';

const ro = v => Object.assign(S.ro, { year: '', make: '', model: '', engine: '' }, v);
const row = (n, price) => ({ supplier: 'NAPA', lineCode: 'NGK', partNumber: n, description: n, brand: 'NGK', listPrice: price, availability: { etaHours: 0, short: 'in stock' } });
const settle = () => Cr.run(async () => {});
const said = () => S.chats.ro.items.filter(i => i.kind === 'agent').map(i => i.text).join(' ');
const plugs = () => S.ro.parts.added.find(p => /spark plug/i.test(p.label));

beforeEach(() => {
  S.profile = {};
  S.useAgent = false; // scripted flow: no model in tests
  S.ro = { ...newRO(), started: true };
  S.chats.ro = { items: [], chips: [], nextId: 1 };
  searchNapa.mockReset();
  searchNapa.mockImplementation(async ({ part }) => ({ ok: true, parts: [row(part, 9.5)] }));
});

describe('engine cylinders resource', () => {
  it('reads the layout from the engine text', () => {
    expect(['3.5L V6', '2.5L I4', 'I-4', '2.5L H4', '2.5L I5', '6-cyl', '8 cylinders'].map(cylindersInText)).toEqual([6, 4, 4, 4, 5, 6, 8]);
    expect(cylindersInText('2.5L')).toBeNull();
  });
  it('uses the vehicle list when every engine has the same count, and matches displacement', () => {
    expect(engineSpec(ro({ year: '2018', make: 'Toyota', model: 'Corolla' }))).toMatchObject({ cylinders: 4, source: 'vehicle' });
    expect(engineSpec(ro({ year: '2016', make: 'Toyota', model: 'Camry', engine: '3.5L' }))).toMatchObject({ cylinders: 6, source: 'engine' });
    expect(engineSpec(ro({ year: '2022', make: 'Ford', model: 'F-150', engine: '' }))).toMatchObject({ cylinders: null, source: 'ask' });
  });
  it('asks with the vehicle engines when they differ, and knows nothing about unlisted vehicles', () => {
    const sp = engineSpec(ro({ year: '2016', make: 'Toyota', model: 'Camry' }));
    expect(sp.cylinders).toBeNull();
    expect(sp.options.map(e => e.engine)).toEqual(['2.5L I4', '3.5L V6']);
    expect(engineSpec(ro({ year: '2016', make: 'Tesla', model: 'Model S' }))).toMatchObject({ cylinders: null, source: 'unknown' });
  });
  it('flags diesels', () => {
    expect(engineSpec(ro({ year: '2018', make: 'Ford', model: 'F-150', engine: '3.0L' }))).toMatchObject({ cylinders: 6, diesel: true });
    expect(enginesFor(2020, 'chevrolet', 'silverado').some(e => e.fuel === 'diesel')).toBe(true);
  });
  it('only replace-all plug and coil jobs are per cylinder', () => {
    expect(perCylinder('Spark plugs (set)', REPMAP.plugs)).toBe(true);
    expect(perCylinder('Ignition coil', REPMAP.coil)).toBe(true);
    expect(perCylinder('Ignition coil', REPMAP['syn-coil-front'])).toBe(false); // front bank, one
    expect(perCylinder('Spark plug', REPMAP['syn-coil-plug-each'])).toBe(false);
    expect(perCylinder('Front brake pads (set)', REPMAP['brk-front'])).toBe(false);
  });
});

describe('spark plug quantity on the RO', () => {
  it('sets one per cylinder when the vehicle has one engine size', async () => {
    ro({ year: '2018', make: 'Toyota', model: 'Corolla' });
    acceptItem('plugs'); await settle();
    expect(plugs()).toMatchObject({ qty: 4, perCyl: true });
  });
  it('asks which engine, then adds the plugs; an engine change updates the quantity', async () => {
    ro({ year: '2016', make: 'Toyota', model: 'Camry', mileage: '60000' });
    acceptItem('plugs'); await settle();
    expect(plugs()).toBeUndefined();
    expect(said()).toMatch(/Which engine does the 2016 Toyota Camry have/);
    expect(S.chats.ro.chips.map(c => c.t)).toEqual(['2.5L I4 (4 cyl)', '3.5L V6 (6 cyl)']);
    Cr.send('__engine__3.5L V6'); await settle();
    expect(plugs()).toMatchObject({ qty: 6, forLine: 'plugs' });
    expect(said()).toMatch(/6 cylinders, one per cylinder/);
    saveVehicle({ year: '2016', make: 'Toyota', model: 'Camry', engine: '2.5L I4', mileage: '60000', vin: '' }); await settle();
    expect(plugs().qty).toBe(4);
  }, 20000); // the vehicle edit re-runs the scripted flow, whose replies are paced like typing
  it('adds no spark plugs on a diesel', async () => {
    ro({ year: '2018', make: 'Ford', model: 'F-150', engine: '3.0L Power Stroke Diesel' });
    acceptItem('plugs'); await settle();
    expect(plugs()).toBeUndefined();
    expect(said()).toMatch(/is a diesel/);
  });
});
