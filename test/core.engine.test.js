import { describe, it, expect, beforeEach } from 'vitest';
import { S, newRO } from '../src/core/state.js';
import { parseFor, extractVehicle, maintState, computeRepairs, findItem, normalizeSymptom, applicableQs, orderTotals, roSummary } from '../src/core/logic.js';
import { PQMAP, SAMPLE_MSG, REP, QB, REPMAP } from '../src/core/data.js';
import { matchOne } from '../src/core/match.js';

beforeEach(() => { S.profile = {}; S.ro = newRO(); });

describe('core: shop profile parsing', () => {
  it('reads a labor rate when asked for it', () => {
    expect(parseFor(PQMAP['shop.labor_rate'], '145 an hour', true).value).toBe(145);
  });
  it('does not take "labor rate is 160" as the diagnostic rate', () => {
    expect(parseFor(PQMAP['shop.diag_rate'], 'labor rate is 160', true)).toBeNull();
    expect(parseFor(PQMAP['shop.labor_rate'], 'labor rate is 160', false).value).toBe(160);
  });
  it('does not take "diagnostic rate is 180" as the labor rate', () => {
    expect(parseFor(PQMAP['shop.labor_rate'], 'diagnostic rate is 180', true)).toBeNull();
    expect(parseFor(PQMAP['shop.diag_rate'], 'diagnostic rate is 180', false).value).toBe(180);
  });
  it('accepts "same" for diagnostic rate even without a labor rate', () => {
    expect(parseFor(PQMAP['shop.diag_rate'], 'same', true).display).toMatch(/Same as labor/);
  });
  it('rejects out-of-range numbers', () => {
    expect(parseFor(PQMAP['shop.labor_rate'], '5', true)).toBeNull();
  });
  it('reads multi-select answers and drops None when others are chosen', () => {
    expect(parseFor(PQMAP['upsell.not_offered'], 'Tires and Alignment', true).value).toEqual(['Tires', 'Alignment']);
  });
});

describe('core: vehicle extraction', () => {
  it('reads the sample message', () => {
    const ex = extractVehicle(SAMPLE_MSG);
    expect(S.ro).toMatchObject({ year: '2018', make: 'Toyota', model: 'Corolla', engine: '1.8L', mileage: '61000' });
    expect(ex.rest).toMatch(/^Grinding noise/);
  });
  it('reads "88,000 miles"', () => {
    extractVehicle('2016 Honda Civic 88,000 miles, check engine light');
    expect(S.ro).toMatchObject({ year: '2016', make: 'Honda', model: 'Civic', mileage: '88000' });
  });
});

describe('core: maintenance and ranking', () => {
  it('lists the 60k service at 61k miles', () => {
    S.ro.mileage = '61000';
    const ms = maintState();
    expect(ms.due).toBe(true);
    expect(ms.at).toBe(60000);
    expect(ms.ids).toContain('sm-plug');
  });
  it('is not due far from an interval', () => {
    S.ro.mileage = '67500';
    expect(maintState().due).toBe(false);
  });
  it('ranks front brakes first for a grinding brake symptom, and "front" keeps it there', () => {
    S.ro.symptom = 'Grinding noise when I brake';
    expect(computeRepairs()[0].id).toBe('brk-front');
    S.ro.answers['brk-where'] = 'Front';
    expect(computeRepairs()[0].id).toBe('brk-front');
  });
  it('hides services the shop never offers', () => {
    S.profile['upsell.not_offered'] = { value: ['Alignment'], display: 'Alignment' };
    S.ro.symptom = 'steering pulls and drifts';
    expect(computeRepairs().some(x => x.id === 'align')).toBe(false);
  });
  it('finds "the front brakes" by name', () => {
    S.ro.symptom = 'Grinding noise when I brake';
    expect(findItem('add the front brakes', 'suggest')).toBe('brk-front');
  });
  it('answers choice questions and flags ambiguity', () => {
    expect(matchOne(['Front', 'Rear', 'Not sure'], 'front').o).toBe('Front');
    expect(matchOne(['Front', 'Rear'], 'xyz')).toBeNull();
  });
});

const top = (symptom, n = 1) => { S.ro.symptom = symptom; return computeRepairs().slice(0, n).map(x => x.id); };

describe('core: common complaints in the sample labor guide', () => {
  it('every repair has hours, a unique id and a guide row', () => {
    expect(new Set(REP.map(r => r.id)).size).toBe(REP.length);
    expect(new Set(REP.map(r => r.row)).size).toBe(REP.length);
    REP.forEach(r => { expect(r.hours).toBeGreaterThan(0); expect(r.hours).toBeLessThan(10); });
  });
  it('every follow-up answer boosts a repair that exists', () => {
    QB.forEach(q => q.opts.forEach(o => Object.keys(o.b).forEach(id => expect(REPMAP[id], q.id + ':' + id).toBeDefined())));
  });
  it('brake squeaking: pads-only and brake service rank above pads and rotors', () => {
    const t = top('brakes squeaking', 4);
    expect(t[0]).toBe('brk-pads-f');
    expect(t).toContain('brk-service');
    expect(t.indexOf('brk-pads-f')).toBeLessThan(t.indexOf('brk-front'));
    expect(REPMAP['brk-pads-f'].hours).toBeLessThan(REPMAP['brk-front'].hours);
  });
  it('grinding still points to pads and rotors', () => {
    expect(top('grinding noise when I brake')).toEqual(['brk-front']);
  });
  it('engine not working starts with a diagnostic and asks what the engine is doing', () => {
    expect(top('engine not working')).toEqual(['diag-engine']);
    S.ro.symptom = 'engine not working';
    expect(applicableQs()[0].id).toBe('eng-what');
  });
  it('"cranks but won\'t start" points to the fuel pump; "just clicks" to battery, starter or cables', () => {
    expect(top("engine cranks but wont start")).toEqual(['fuelpump']);
    expect(top("wont start just clicks", 5)).toEqual(expect.arrayContaining(['battery', 'starter', 'battcable']));
  });
  it('check engine light starts with the scan-and-test diagnostic, however it is worded', () => {
    ['check engine light on', 'CEL is on', 'service engine soon light', 'engine light came on'].forEach(w => expect(top(w), w).toEqual(['diag-cel']));
    expect(REPMAP['diag-cel'].hours).toBe(0.8);
  });
  it('a flashing-light answer pushes ignition parts up', () => {
    S.ro.symptom = 'check engine light on';
    S.ro.answers['cel-flash'] = 'Flashing';
    const t = computeRepairs().slice(0, 3).map(x => x.id);
    expect(t).toEqual(expect.arrayContaining(['coil', 'plugs']));
  });
  it('A/C not working: diagnostic first, then answers narrow it down', () => {
    expect(top('ac not working')).toEqual(['diag-ac']);
    S.ro.symptom = 'ac not working';
    S.ro.answers['ac-air'] = 'Weak airflow';
    expect(computeRepairs().slice(0, 4).map(x => x.id)).toEqual(expect.arrayContaining(['blower', 'cabin-filt']));
  });
  it('"A/C blows warm air" points to a recharge; "no air from the vents" to the blower motor', () => {
    expect(top('A/C blows warm air')).toEqual(['acrecharge']);
    expect(top('no air coming from the vents')).toEqual(['blower']);
  });
  it('an A/C complaint with clicking is not asked about turning the key', () => {
    S.ro.symptom = 'ac is not cold and makes a clicking noise';
    expect(applicableQs().map(q => q.id)).not.toContain('crank');
    expect(computeRepairs().slice(0, 3).map(x => x.id)).toContain('ac-clutch');
  });
  it('"ac is not cold" keeps the "not cold" meaning', () => {
    expect(normalizeSymptom('AC is not cold')).toBe('a/c is not cold');
    expect(normalizeSymptom('the A/C is not working')).toContain('a/c not working');
  });
});

describe('core: order total (labor plus parts)', () => {
  const part = (price, qty = 1) => ({ key: 'k' + price, label: 'p', description: 'd', lineCode: 'AAA', partNumber: String(price), each: price, qty });
  it('is empty with nothing on the order', () => {
    expect(orderTotals()).toMatchObject({ empty: true, total: 0, labor: null, laborMissing: false });
  });
  it('adds priced labor and parts', () => {
    S.profile['shop.labor_rate'] = { value: 30, display: '$30/hr' };
    S.ro.accepted.add('brk-pads-f'); // 1.1 h
    S.ro.accepted.add('brk-service'); // 0.8 h
    S.ro.parts.added.push(part(94.6), part(66.42, 2));
    const o = orderTotals();
    expect(o.hours).toBeCloseTo(1.9);
    expect(o.labor).toBeCloseTo(57);
    expect(o.parts).toBeCloseTo(94.6 + 132.84);
    expect(o.total).toBeCloseTo(57 + 227.44);
    expect(o.totalWithMarkup).toBeNull();
  });
  it('uses edited hours', () => {
    S.profile['shop.labor_rate'] = { value: 100, display: '$100/hr' };
    S.ro.accepted.add('brk-front');
    S.ro.hoursOv['brk-front'] = 2.5;
    expect(orderTotals().labor).toBe(250);
  });
  it('without a labor rate the total is parts only, and says so', () => {
    S.ro.accepted.add('brk-front');
    S.ro.parts.added.push(part(50));
    const o = orderTotals();
    expect(o).toMatchObject({ labor: null, laborMissing: true, total: 50 });
    expect(roSummary()).toMatch(/ESTIMATED TOTAL: \$50\.00 \(parts only, labor not priced/);
  });
  it('shows a marked-up total as an extra, not instead', () => {
    S.profile['shop.labor_rate'] = { value: 30, display: '$30/hr' };
    S.profile['parts.markup'] = { value: 40, display: '40%' };
    S.ro.accepted.add('brk-pads-f');
    S.ro.parts.added.push(part(100));
    const o = orderTotals();
    expect(o.total).toBeCloseTo(33 + 100);
    expect(o.totalWithMarkup).toBeCloseTo(33 + 140);
    expect(roSummary()).toMatch(/With 40% parts markup/);
  });
});
