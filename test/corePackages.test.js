import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/core/partsApi.js', () => ({ searchNapa: vi.fn(async ({ part }) => ({ ok: true, parts: [{ lineCode: 'A', partNumber: part, listPrice: 50, availability: { etaHours: 0, short: 'in stock' } }] })) }));

import { S, newRO } from '../src/core/state.js';
import { SHOP } from '../src/core/data.js';
import { setSetting } from '../src/core/shopSettings.js';
import { buildPackage, packageCandidates, packageLevel, LEVELS } from '../src/core/packages.js';
import { prefetchPartPrices } from '../src/core/partPrices.js';

const brakes = () => {
  S.profile = { 'shop.labor_rate': { value: 150, display: '$150/hr' }, 'parts.supplier': { value: 'napa' } }; // these tests price parts from NAPA's catalog; the shop default is PartsTech
  S.ro = { ...newRO(), started: true, year: '2018', make: 'Toyota', model: 'Corolla', mileage: '61000', symptom: 'Grinding noise when braking' };
};
beforeEach(brakes);

describe('prepackaged estimate', () => {
  it('defaults to medium from the shop profile resource, and the shop can change it', () => {
    expect(SHOP.packageSeverity).toBe('medium');
    expect(packageLevel()).toBe('medium');
    setSetting('package.severity', 'high');
    expect(packageLevel()).toBe('high');
  });
  it('gives every recommendation a severity: the concern and safety items are high', () => {
    const c = packageCandidates();
    expect(c[0]).toMatchObject({ id: 'brk-front', severity: 'high', source: 'repair' });
    const sev = Object.fromEntries(c.map(x => [x.source + ':' + x.severity, true]));
    expect(sev['maintenance:high']).toBe(true);   // tire rotation is safety
    expect(sev['maintenance:medium']).toBe(true); // oil, plugs, inspection
    expect(sev['maintenance:low']).toBe(true);    // air filters are comfort
  });
  it('each level holds its severity and above; lower levels are supersets with higher totals', () => {
    const p = Object.fromEntries(LEVELS.map(l => [l, buildPackage(l)]));
    expect(p.high.items.every(i => i.severity === 'high')).toBe(true);
    expect(p.medium.items.every(i => i.severity !== 'low')).toBe(true);
    const ids = l => p[l].items.map(i => i.id);
    expect(ids('medium')).toEqual(expect.arrayContaining(ids('high')));
    expect(ids('low')).toEqual(expect.arrayContaining(ids('medium')));
    expect(p.high.total).toBeLessThan(p.medium.total);
    expect(p.medium.total).toBeLessThan(p.low.total);
    expect(p.high.labor).toBeCloseTo(p.high.hours * 150);
  });
  it('lists what the advisor still decides: an unconfirmed position and "each" quantities', () => {
    const p = buildPackage('low');
    const what = p.confirm.map(c => c.line + ': ' + c.what).join('\n');
    expect(what).toMatch(/Front brake pads and rotors, replace: Confirm front/);
    expect(what).toMatch(/How many: priced as 1/);
    S.ro.answers['brk-where'] = 'Front';
    expect(buildPackage('low').confirm.some(c => /Confirm front/.test(c.what))).toBe(false);
  });
  it('does not package a line already on the order twice, and the total still counts it', () => {
    const before = buildPackage('high');
    S.ro.accepted.add('brk-front');
    const after = buildPackage('high');
    expect(after.items.filter(i => i.id === 'brk-front')).toHaveLength(1);
    expect(after.items.find(i => i.id === 'brk-front').onOrder).toBe(true);
    expect(after.hours).toBeCloseTo(before.hours);
  });
  it('parts priced at the shop pick fill the total once the lookups land', async () => {
    const p0 = buildPackage('high');
    expect(p0.partsPending).toBeGreaterThan(0);
    prefetchPartPrices(['Front brake pads (set)', 'Front brake rotors (2)', 'Brake hardware kit']);
    await new Promise(r => setTimeout(r, 0));
    const p1 = buildPackage('high');
    expect(p1.parts).toBe(50 + 2 * 50 + 50);
    expect(p1.partsPending).toBe(0);
  });
});

import { partsFor } from '../src/core/maintParts.js';
import { maintState, ITEM } from '../src/core/logic.js';
import { addPackage, Cr } from '../src/core/harness.js';

describe('maintenance lines carry their parts', () => {
  it('REPLACE lines get parts from maintenance_parts.json; inspections and rotations get none', () => {
    const ms = maintState();
    const byName = Object.fromEntries(ms.ids.map(id => [ITEM(id).name, partsFor(ITEM(id)).map(p => p.name)]));
    expect(byName['Engine oil & filter, replace']).toEqual(['Motor oil, quart (5)', 'Oil filter']);
    expect(byName['Spark plug, replace']).toEqual(['Spark plugs (set)']);
    expect(byName['Tires, rotate']).toEqual([]);
  });
  it('the package prices them, with the oil quantity and spark plugs per cylinder', () => {
    S.ro.symptom = '';
    const p = buildPackage('medium');
    const oil = p.items.find(i => i.name === 'Engine oil & filter, replace');
    expect(oil.parts.map(x => [x.name, x.qty])).toEqual([['Motor oil, quart (5)', 5], ['Oil filter', 1]]);
    expect(p.items.find(i => i.name === 'Spark plug, replace').parts[0]).toMatchObject({ qty: 4, perCyl: true }); // a Corolla is 4 cylinders
    expect(p.confirm.some(c => /priced as 5 quarts/.test(c.what))).toBe(true);
  });
  it('Add package to RO puts the maintenance parts on at the shop pick', async () => {
    S.ro.symptom = '';
    S.chats.ro = { items: [], chips: [], nextId: 1 };
    addPackage('medium');
    await Cr.run(async () => {});
    const labels = S.ro.parts.added.map(x => x.label + ' x' + x.qty);
    expect(labels).toEqual(expect.arrayContaining(['Motor oil, quart (5) x5', 'Oil filter x1', 'Spark plugs (set) x4']));
  }, 20000);
});

import { addAllMaint } from '../src/core/harness.js';

describe('package after lines are already on the RO', () => {
  it('keeps its total once its lines are on the RO', () => {
    S.ro.symptom = '';
    const before = buildPackage('medium');
    before.items.forEach(i => S.ro.accepted.add(i.id));
    const after = buildPackage('medium');
    expect(after.items.every(i => i.onOrder)).toBe(true);
    expect(after.hours).toBeCloseTo(before.hours);
    expect(after.labor).toBeCloseTo(before.labor);
  });
  it('Add all due maintenance puts the lines\' parts on too', async () => {
    S.ro.symptom = '';
    S.chats.ro = { items: [], chips: [], nextId: 1 };
    addAllMaint('all');
    await Cr.run(async () => {});
    expect(S.ro.parts.added.map(x => x.label)).toEqual(expect.arrayContaining(['Motor oil, quart (5)', 'Oil filter']));
  }, 20000);
  it('the package fills in parts for lines that were added without them', async () => {
    S.ro.symptom = '';
    S.chats.ro = { items: [], chips: [], nextId: 1 };
    const oil = buildPackage('medium').items.find(i => i.name === 'Engine oil & filter, replace');
    S.ro.accepted.add(oil.id); // on the RO, parts never looked up
    expect(buildPackage('medium').partsMissing).toBeGreaterThan(0);
    addPackage('medium');
    await Cr.run(async () => {});
    expect(S.ro.parts.added.map(x => x.label)).toEqual(expect.arrayContaining(['Motor oil, quart (5)', 'Oil filter']));
    expect(buildPackage('medium').partsMissing).toBe(0);
  }, 20000);
});

import { packageTalk, buildPackage as bp2 } from '../src/core/packages.js';
describe('package talk track: why the package holds what it does', () => {
  it('explains each group with its reason, the estimate, what can wait, and asks for approval', () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Sienna', vin: '5TDYZ3DC2JS901691', mileage: '60000', symptom: 'Clicking when turning and grease on the inside of the front left tire.' });
    S.profile['shop.labor_rate'] = { value: 150 };
    const high = packageTalk(bp2('high')), med = packageTalk(bp2('medium')), low = packageTalk(bp2('low'));
    expect(high.say[0]).toBe('For this visit, we recommend starting with what should not wait.');
    expect(high.say.join(' ')).toMatch(/For your concern, we recommend an inspection first; if it confirms the cause, we recommend that we replace the axle shaft assembly/);
    expect(high.say.join(' ')).toMatch(/For safety, Toyota's factory \(OEM\) maintenance schedule recommends that we rotate the tires/);
    expect(high.say.join(' ')).toMatch(/other recommendations are lower priority and can be scheduled for a later visit/);
    expect(med.say.join(' ')).toMatch(/help protect the vehicle/);
    expect(low.say.join(' ')).toMatch(/Also included, as optional items/);
    expect(low.say.join(' ')).not.toMatch(/lower priority/);
    [high, med, low].forEach(t => { expect(t.say.at(-1)).toMatch(/^These are recommendations; nothing is added without your approval\./); expect(t.highlight.length).toBeLessThan(200); });
    expect(med.highlight).toMatch(/^Medium severity · \d+ lines · about \$\d/);
    expect(med.say.at(-1)).toMatch(/\(Source: Mitchell 1 repair times; maintenance times are standard estimates\.\)$/);
  });
});
