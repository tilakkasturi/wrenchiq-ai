import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../src/core/partsApi.js', () => ({ searchNapa: async () => ({ ok: true, priceBasis: 'NAPA catalog list price', retrievedAt: new Date().toISOString(), parts: [] }) }));

import { S, newRO } from '../src/core/state.js';
import { REP, REPMAP, parseLaborXml, buildLaborGuide } from '../src/core/laborGuide.js';
import { checkAdd, sameJob, covers, auditLabor, orphanedCombos, addOnsFor, followOnsFor, relKey } from '../src/core/laborRules.js';
import { talkFor } from '../src/core/talkTrack.js';
import { computeRepairs, orderTotals } from '../src/core/logic.js';
import { acceptItem, removeItem, Cr } from '../src/core/harness.js';
import RULES from '../resources/labor_guide/labor_guide_rules.json';

const settle = () => Cr.run(async () => {});
const said = () => S.chats.ro.items.filter(i => i.kind === 'agent').map(i => i.text).join(' ');
const cardsOf = type => S.chats.ro.items.filter(i => i.kind === 'cards' && i.card.type === type).map(i => i.card);
const on = () => [...S.ro.accepted].sort();

beforeEach(() => {
  S.profile = {};
  S.ro = { ...newRO(), started: true };
  S.chats.ro = { items: [], chips: [], nextId: 1 };
});

describe('labor guide is loaded from resources/labor_guide', () => {
  it('reads every XML row: real exports, the demo rows and the synthetic systems', () => {
    expect(REP.filter(r => r.file === 'cv_axle_labor_5TDYZ3DC2JS901691.xml')).toHaveLength(14);
    expect(REP.filter(r => r.file === 'brake_caliper_labor_5TDYZ3DC2JS901691.xml')).toHaveLength(22);
    expect(REP.filter(r => r.file === 'synthetic_core_demo_labor.xml')).toHaveLength(55);
    expect(REP.filter(r => r.synthetic && r.file !== 'synthetic_core_demo_labor.xml')).toHaveLength(120);
    expect(REP.some(r => /scheduled_maintenance/.test(r.file))).toBe(false);
  });
  it('matches every row to its enrichment (id, name, keywords) and keeps the XML hours', () => {
    expect(REP.every(r => !r.row.startsWith('XML-'))).toBe(true);
    expect(REPMAP['brk-front']).toMatchObject({ hours: 1.8, ref: 'LG-BRK-F-0142', component: 'DISC BRAKE ROTOR' });
    expect(REPMAP['axle-asm-fwd-right']).toMatchObject({ hours: 2.1, warranty: '1.7', skill: 'B', laborType: 'OPERATION' });
  });
  it('every COMBINATION row has a customer talk track, and every rule id exists', () => {
    REP.filter(r => r.laborType === 'COMBINATION').forEach(r => expect(r.talk, r.id).toMatchObject({ kind: expect.any(String), plain: expect.any(String), why: expect.any(String) }));
    const ids = [...RULES.sameGroups.flat(), ...RULES.samePairs.flat(), ...Object.keys(RULES.includes), ...Object.values(RULES.includes).flat(), ...Object.keys(RULES.bothSides), ...Object.values(RULES.bothSides).flat()];
    ids.filter(id => !id.startsWith('sm:')).forEach(id => expect(REPMAP[id], id).toBeDefined());
  });
  it('a row with no enrichment still loads, with a slug id and no keywords', () => {
    const xml = '<labor_list><labor><Note>REPLACE WIDGET &amp; BRACKET</Note><Skill/><LaborHours>0.7</LaborHours><Warranty/><LaborTypeName>OPERATION</LaborTypeName><LaborComponent>WIDGET</LaborComponent></labor></labor_list>';
    expect(parseLaborXml(xml)[0]).toMatchObject({ note: 'REPLACE WIDGET & BRACKET', hours: 0.7, skill: '', warranty: '' });
    const [r] = buildLaborGuide({ '/resources/labor_guide/x.xml': xml }, []);
    expect(r).toMatchObject({ id: 'widget-replace-widget-bracket', hours: 0.7, kw: [], synthetic: false });
  });
});

describe('labor guardrails: no labor billed twice', () => {
  it('blocks the same job from two labor-guide files', () => {
    expect(checkAdd('syn-ac-comp', ['accomp'])).toMatchObject({ action: 'block', kind: 'duplicate', by: 'accomp' });
  });
  it('one A/C evacuate & recharge per order, even with two A/C parts replaced', () => {
    const a = ['syn-ac-comp', 'syn-ac-comp-evac', 'syn-ac-cond'];
    expect(addOnsFor('syn-ac-cond', a)).not.toContain('syn-ac-cond-evac');
    expect(checkAdd('syn-ac-cond-evac', a).action).toBe('block');
  });
  it('blocks labor a line already includes, and replaces lines a new one includes', () => {
    expect(checkAdd('caliper-rr-one', ['brake-sys-rr-all'])).toMatchObject({ action: 'block', kind: 'covered' });
    expect(checkAdd('brake-sys-rr-all', ['caliper-rr-one', 'brk-front'])).toMatchObject({ action: 'replace', kind: 'supersedes', remove: ['caliper-rr-one', 'brk-front'] });
  });
  it('replace-axle-shaft equals assembly R&I + add-on, so it cannot be stacked on them', () => {
    expect(REPMAP['axle-shaft-fwd-left'].hours).toBeCloseTo(REPMAP['axle-asm-fwd-left'].hours + REPMAP['axle-shaft-each'].hours);
    expect(checkAdd('axle-shaft-fwd-left', ['axle-asm-fwd-left', 'axle-shaft-each'])).toMatchObject({ action: 'replace', remove: ['axle-asm-fwd-left', 'axle-shaft-each'] });
  });
  it('left + right becomes the cheaper both-sides row', () => {
    const d = checkAdd('axle-asm-fwd-right', ['axle-asm-fwd-left']);
    expect(d).toMatchObject({ action: 'replace', kind: 'bothSides', id: 'axle-asm-fwd-both', remove: ['axle-asm-fwd-left'] });
    expect(d.saves).toBeCloseTo(2.0 + 2.1 - 3.5);
  });
  it('add-on labor needs its job on the order, and offers the standalone job instead', () => {
    expect(checkAdd('syn-wpump-thermo', [])).toMatchObject({ action: 'block', kind: 'orphan', offer: 'syn-thermo' });
  });
  it('a standalone job becomes the cheaper add-on when the related job is already on', () => {
    expect(checkAdd('syn-thermo', ['syn-wpump'])).toMatchObject({ action: 'substitute', id: 'syn-wpump-thermo', parent: 'syn-wpump', saves: 0.6 });
    expect(checkAdd('syn-plugs', ['syn-vc-rear'])).toMatchObject({ action: 'substitute', id: 'syn-vc-plugs' });
  });
  it('a repair and its scheduled-maintenance twin are the same job, at any milestone', () => {
    expect(relKey('sm:5TDYZ3DC_JS______:60000:spark plug:REPLACE')).toBe('sm:spark plug:REPLACE');
    expect(sameJob('plugs', 'sm:*:120000:spark plug:REPLACE')).toBe(true);
    expect(covers('syn-wpump', 'sm:5TDYZ3DC_JS______:100000:engine coolant:REPLACE')).toBe(true);
  });
  it('the audit finds the same problems on an order built some other way', () => {
    const kinds = auditLabor(['accomp', 'syn-ac-comp', 'axle-asm-fwd-left', 'axle-asm-fwd-right', 'syn-wpump-thermo']).map(i => i.kind).sort();
    expect(kinds).toEqual(['bothSides', 'duplicate', 'orphan']);
  });
  it('suggests the alignment the guide says a strut job leaves out', () => {
    expect(followOnsFor('syn-strut-f-both', ['syn-strut-f-both']).map(f => f.id)).toEqual(['syn-align']);
    expect(followOnsFor('syn-strut-f-both', ['syn-strut-f-both', 'align'])).toEqual([]);
  });
  it('ranking shows one row per job when two files have the same job', () => {
    S.ro.symptom = 'A/C blows warm air, compressor noise';
    const ids = computeRepairs().map(x => x.id);
    ids.forEach((a, i) => ids.slice(i + 1).forEach(b => expect(sameJob(a, b), a + ' ~ ' + b).toBe(false)));
  });
});

describe('talk track for add-on labor', () => {
  it('quotes the add-on price and a saving only when the guide has the standalone job', () => {
    const t = talkFor('syn-wpump-thermo', 'syn-wpump', 150);
    expect(t).toMatchObject({ kind: 'recommended', label: 'Recommended', hours: 0.4, price: 60, saves: 0.6 });
    expect(t.text).toMatch(/water pump/);
    expect(t.text).toMatch(/0\.4 hours, about \$60/);
    expect(t.text).toMatch(/on its own later it would be 1\.0 hours \(about \$150\)/);
  });
  it('frames only-if-needed work as conditional, and required work as part of the job', () => {
    expect(talkFor('axle-boot-each', 'axle-asm-fwd-left', null).text).toMatch(/only replace the CV axle boot if it is worn.*show you what we find/);
    const req = talkFor('syn-ac-comp-evac', 'syn-ac-comp', 140).text;
    expect(req).toMatch(/^To do the A\/C compressor job right/);
    expect(req).toMatch(/part of the job, not an extra/);
    expect(talkFor('axle-boot-each', 'axle-asm-fwd-left', null).saves).toBeNull();
  });
});

describe('repair order flow uses the guardrails', () => {
  it('adding a job offers its add-ons with talk tracks; nothing is pre-selected', async () => {
    acceptItem('axle-asm-fwd-left'); await settle();
    const [c] = cardsOf('combos');
    expect(c.parent).toBe('axle-asm-fwd-left');
    expect(c.ids).toEqual(expect.arrayContaining(['axle-boot-each', 'cv-joint-each']));
    expect(c.ids).not.toContain('axle-boot-io-each'); // same job as axle-boot-each: offered once
    expect(on()).toEqual(['axle-asm-fwd-left']);
  });
  it('adding the other side swaps in the both-sides row and says how much it saves', async () => {
    S.profile['shop.labor_rate'] = { value: 100 };
    acceptItem('axle-asm-fwd-left'); await settle();
    acceptItem('axle-asm-fwd-right'); await settle();
    expect(on()).toEqual(['axle-asm-fwd-both']);
    expect(orderTotals().hours).toBeCloseTo(3.5);
    expect(said()).toMatch(/Both sides together is one job.*0\.6 h \(\$60\.00\) off the bill/);
  });
  it('removing a job takes off its add-on labor too', async () => {
    acceptItem('axle-asm-fwd-left'); acceptItem('cv-joint-each'); await settle();
    expect(on()).toEqual(['axle-asm-fwd-left', 'cv-joint-each']);
    removeItem('axle-asm-fwd-left'); await settle();
    expect(on()).toEqual([]);
    expect(said()).toMatch(/also took off cv/i);
  });
  it('a blocked add leaves the order and the totals unchanged', async () => {
    acceptItem('accomp'); await settle();
    const before = orderTotals().hours;
    acceptItem('syn-ac-comp'); await settle();
    expect(on()).toEqual(['accomp']);
    expect(orderTotals().hours).toBe(before);
    expect(said()).toMatch(/same job as A\/C compressor, replace/);
    expect(orphanedCombos(on())).toEqual([]);
  });
});

import { plainJob, customerWhy } from '../src/core/talkTrack.js';
import { TOOLS } from '../src/core/roTools.js';
import { ITEM } from '../src/core/logic.js';
import { runDemo, demoList } from '../src/core/harness.js';
import DEMOS from '../resources/demo/core_demo_scenarios.json';

describe('Why? popover: a customer talk track for every line', () => {
  it('turns guide names into plain jobs', () => {
    expect(plainJob('Axle shaft assembly, remove & install/replace (FWD, left side)')).toBe('replace the axle shaft assembly (left side)');
    expect(plainJob('Brake caliper, remove, install & overhaul (front, both)')).toBe('rebuild the brake caliper (front, both)');
  });
  it('a repair ties back to the customer\'s own words and the guide hours', () => {
    const w = customerWhy(ITEM('brk-front'), { hours: 1.8, rate: 100, concern: 'Grinding noise when I brake.' });
    expect(w.text).toMatch(/^You told us: "Grinding noise when I brake"\. Based on that, the most likely fix is to replace the front brake pads and rotors\./);
    expect(w.text).toMatch(/1\.8 hours of labor, about \$180/);
    expect(w.basis).toMatch(/LG-BRK-F-0142/);
  });
  it('an add-on uses its labor-guide talk track; a manual line just says what it is', () => {
    expect(customerWhy(ITEM('syn-wpump-thermo'), { rate: 150, parent: 'syn-wpump' }).title).toBe('Recommended');
    expect(customerWhy({ id: 'x1', name: 'Diagnostic time', hours: 1, src: 'manual' }, {}).text).toBe('Diagnostic time. 1.0 hours of labor.');
  });
});

describe('agent add_repair_line goes through the guardrails', () => {
  it('adds by id, and swaps a standalone job for the cheaper add-on when its job is on', async () => {
    let r = await TOOLS.add_repair_line({ id: 'syn-wpump' }, Cr);
    expect(r.result).toBe('added');
    r = await TOOLS.add_repair_line({ name: 'thermostat' }, Cr);
    expect(r).toMatchObject({ result: 'added_as_add_on', line: { id: 'syn-wpump-thermo' }, hours_saved: expect.any(Number) });
    expect(on()).toEqual(['syn-wpump', 'syn-wpump-thermo']);
  });
  it('reports a refused duplicate without changing the order', async () => {
    await TOOLS.add_repair_line({ id: 'accomp' }, Cr);
    const r = await TOOLS.add_repair_line({ id: 'syn-ac-comp' }, Cr);
    expect(r.result).toBe('not_added');
    expect(r.reason).toMatch(/same job/);
    expect(on()).toEqual(['accomp']);
  });
});

describe('click-through demos', () => {
  it('every scenario loads from resources/demo: short owner fragments, then advisor shorthand', () => {
    expect(demoList().map(d => d.id)).toEqual(['cv-axle', 'ac', 'water-pump', 'valve-cover']);
    DEMOS.starters.forEach(st => { expect(st.text, st.text).toMatch(/^\d\d [a-z0-9]+ \d+k /); expect(st.text.length, st.text).toBeLessThan(70); });
    DEMOS.scenarios.forEach(d => d.steps.forEach((st, i) => {
      expect(st.text.length, st.text).toBeLessThan(100);
      expect(/^\s*(please\s+)?(add|include)\b/i.test(st.text), st.text).toBe(false); // so the model, not the keyword rule, reads it
    }));
  });
  it('starting a demo resets the order, turns the agent on and prices at a session-only rate', async () => {
    S.ro.accepted.add('brk-front'); S.useAgent = false;
    runDemo('cv-axle'); await settle();
    expect(on()).toEqual([]);
    expect(S.useAgent).toBe(true);
    expect(S.profile['shop.labor_rate'].value).toBe(150);
    expect(S.chats.ro.chips[0]).toMatchObject({ text: '__demo_next__', silent: true });
    S.demo = null;
  });
});

import { textToolCalls } from '../src/core/roAgent.js';
describe('agent loop: tool calls written as text', () => {
  it('turns "[add_repair_line {id: ...}]" into a real call and drops it from the reply', () => {
    const r = textToolCalls('I will add those now.\n[add_repair_line {id: "syn-vc-plugs"}]');
    expect(r.calls).toHaveLength(1);
    expect(r.calls[0].function).toEqual({ name: 'add_repair_line', arguments: '{"id":"syn-vc-plugs"}' });
    expect(r.rest).toBe('I will add those now.');
    expect(textToolCalls('[not_a_tool {x: 1}] and [Front] brakes').calls).toHaveLength(0);
  });
});

import { setMode, Cp } from '../src/core/harness.js';
describe('shop profile: free flowing, starts with the shop', () => {
  const fresh = () => { S.pro = { awaiting: null, started: false }; S.chats.profile = { items: [], chips: [], nextId: 1 }; };
  const saidP = () => S.chats.profile.items.filter(i => i.kind === 'agent').map(i => i.text);
  it('states the shop and supplier from resources/shop, asks no questions', async () => {
    S.profile = {}; fresh();
    setMode('profile'); await Cp.run(async () => {});
    expect(saidP()[0]).toBe('Your shop: Cornerstone Automotive, 2341 El Camino Real, Sunnyvale, California.');
    expect(saidP()[1]).toBe('Your parts supplier is set to NAPA.');
    expect(saidP().join(' ')).not.toMatch(/\?/);
    expect(S.profile['shop.identity'].value).toMatch(/^Cornerstone Automotive/);
    expect(S.pro.awaiting).toBeNull();
    S.mode = 'ro';
  });
  it('keeps a recognized preference as a named fact and anything else as a note', async () => {
    S.profile = {}; fresh(); S.pro.started = true;
    await Cp.send('our labor rate is 165 an hour'); await Cp.run(async () => {});
    expect(S.profile['shop.labor_rate']).toMatchObject({ value: 165, label: 'Labor rate' });
    await Cp.send('we close early on fridays and always road test brake jobs'); await Cp.run(async () => {});
    const note = Object.keys(S.profile).find(k => k.startsWith('note.'));
    expect(S.profile[note].display).toBe('we close early on fridays and always road test brake jobs');
    await Cp.send("what's in my profile?"); await Cp.run(async () => {});
    expect(saidP().at(-1)).toMatch(/Labor rate: \$165\/hr/);
    S.mode = 'ro';
  });
});

import { liveStore, refillArray, refillObject, onResourceChange, resourceLoaded } from '../src/core/liveResource.js';
describe('resources reload in place (dev server / Tauri hot update)', () => {
  it('a re-run refills the same objects and tells listeners, only after the first load', () => {
    const a = liveStore('t', () => ({ rows: [], map: {} }));
    const keep = a.rows, keepMap = a.map;
    refillArray(a.rows, [1, 2]); refillObject(a.map, { x: 1 });
    const heard = [];
    onResourceChange('t.listener', n => heard.push(n));
    resourceLoaded('test resource');            // first load: quiet
    const b = liveStore('t', () => ({ rows: [], map: {} }));
    refillArray(b.rows, [3]); refillObject(b.map, { y: 2 });
    resourceLoaded('test resource');            // a reload
    expect(b.rows).toBe(keep); expect(b.map).toBe(keepMap);
    expect(keep).toEqual([3]); expect(keepMap).toEqual({ y: 2 });
    expect(heard).toEqual(['test resource']);
  });
});

describe('update_vehicle: year from the VIN', () => {
  it('fills the model year from the 10th character when the model passes only the VIN', async () => {
    const r = await TOOLS.update_vehicle({ make: 'Toyota', model: 'Sienna', vin: '5TDYZ3DC2JS901691', mileage: 60000 }, Cr);
    expect(S.ro.year).toBe('2018');
    expect(r.changed).toContain('year (from VIN)');
  });
});

import { interpretMaint } from '../src/core/maintAdvice.js';
import { maintState } from '../src/core/logic.js';
import { addAllMaint } from '../src/core/harness.js';
describe('scheduled maintenance, interpreted for the advisor', () => {
  const at60 = () => { Object.assign(S.ro, { vin: '5TDYZ3DC2JS901691', year: '2018', make: 'Toyota', model: 'Sienna', mileage: '60000' }); return maintState(); };
  it('groups the 60k service by severity, with why each matters', () => {
    const a = interpretMaint(at60(), { rate: 150, make: 'Toyota' });
    const tier = id => a.tiers.find(t => t.id === id).items.map(i => i.name);
    expect(tier('safety')).toEqual(['Tires, rotate']);
    expect(tier('protect')).toEqual(expect.arrayContaining(['Engine oil & filter, replace', 'Spark plug, replace']));
    expect(tier('comfort')).toEqual(expect.arrayContaining(['Cabin air filter, replace', 'Engine air filter, replace']));
    expect(a.tiers.find(t => t.id === 'comfort').recommend).toBe(false);
    expect(a.inspection.groups).toEqual(expect.arrayContaining(['brakes', 'steering and suspension']));
    expect(a.tiers.flatMap(t => t.items).every(i => i.why)).toBe(true);
  });
  it('writes a script that leads with what matters and offers comfort items as optional', () => {
    const { script } = interpretMaint(at60(), { rate: 150, make: 'Toyota' });
    expect(script).toMatch(/^At this mileage Toyota's factory maintenance schedule calls for the 60,000 mile service/);
    expect(script.indexOf('For safety')).toBeLessThan(script.indexOf('To protect the engine'));
    expect(script).toMatch(/change the oil and filter and replace the spark plugs/);
    expect(script).toMatch(/If you would like, we can also replace the (cabin|engine) air filter and replace the (cabin|engine) air filter\..*can wait/);
    expect(script).toMatch(/multi-point inspection, covering the brakes, steering and suspension, cooling system and fluids and more/);
    expect((script.match(/change the oil and filter/g) || []).length).toBe(1); // oil + filter rows said once
  });
  it('a repair already doing a scheduled job is not sold twice', () => {
    const ms = at60();
    S.ro.accepted.add('syn-vc-rear'); S.ro.accepted.add('syn-vc-plugs');
    const a = interpretMaint(ms, { rate: 150, accepted: [...S.ro.accepted], make: 'Toyota' });
    const plug = a.tiers.flatMap(t => t.items).find(i => /spark plug/i.test(i.name));
    expect(plug.coveredBy).toMatch(/spark plugs/i);
    expect(a.recommendedIds).not.toContain(plug.id);
    expect(a.script).toMatch(/already going to replace the spark plugs as part of today's/);
  });
  it('"Add recommended" adds safety and engine items and the inspection, not comfort items', async () => {
    const ms = at60();
    addAllMaint('recommended'); await settle();
    const names = [...S.ro.accepted].map(id => ITEM(id).name);
    expect(names).toEqual(expect.arrayContaining(['Tires, rotate', 'Engine oil & filter, replace', 'Spark plug, replace']));
    expect(names.some(n => /cabin air filter/i.test(n))).toBe(false);
    expect(names.some(n => /inspection/i.test(n))).toBe(true);
    expect(ms.ids.length).toBeGreaterThan(names.length);
  });
});
describe('maintenance script after the recommended work is on the order', () => {
  it('says the recommended work is on the order and offers only what is left', () => {
    Object.assign(S.ro, { vin: '5TDYZ3DC2JS901691', make: 'Toyota', mileage: '60000' });
    const ms = maintState();
    const first = interpretMaint(ms, { make: 'Toyota' });
    first.recommendedIds.forEach(id => S.ro.accepted.add(id));
    const a = interpretMaint(ms, { accepted: [...S.ro.accepted], make: 'Toyota' });
    expect(a.scriptLines[0]).toBe('The recommended work for the 60,000 mile service is on today\'s order.');
    expect(a.script).not.toMatch(/For safety|To protect the engine/);
    expect(a.script).toMatch(/If you would like, we can also/);
    expect(ms.note).toBe('right at the 60,000 mi service');
  });
});

describe('resource reloads are debugging detail', () => {
  it('go to the Agent trace, not the chat', () => {
    S.chats.ro = { items: [], chips: [], nextId: 1 }; S.chats.profile = { items: [], chips: [], nextId: 1 };
    resourceLoaded('trace probe'); resourceLoaded('trace probe'); // first load is quiet, the second is a reload
    const steps = S.trace.turns.flatMap(t => t.steps);
    expect(steps.some(s => s.kind === 'note' && s.title === 'Reloaded trace probe')).toBe(true);
    const chat = [...S.chats.ro.items, ...S.chats.profile.items].map(i => i.text || '').join(' ');
    expect(chat).not.toMatch(/Reloaded/);
  });
});

import { pendingQuestions, applyAnswers, nextStep, buildRecs, flow } from '../src/core/recommend.js';
import { answerQuestions } from '../src/core/harness.js';
describe('before recommendations: one combined question, at most two rounds', () => {
  const cards = type => S.chats.ro.items.filter(i => i.kind === 'cards' && i.card.type === type).map(i => i.card);
  beforeEach(() => { S.useAgent = false; });
  it('asks vehicle gaps and the follow-ups that move the top repairs, in one card', async () => {
    await Cr.send('grinding when I brake'); await settle();
    const q = cards('questions');
    expect(q).toHaveLength(1);
    expect(q[0].parts.map(p => p.id)).toEqual(['veh', 'mi', expect.any(String)]);
    expect(q[0].parts.length).toBeLessThanOrEqual(3);
    expect(cards('recs')).toHaveLength(0); // nothing recommended yet
    expect(cards('repairs')).toHaveLength(0);
  });
  it('one typed line can answer several parts; recommendations come by the second round at the latest', async () => {
    await Cr.send('2018 Toyota Corolla, grinding when I brake'); await settle();
    expect(cards('questions')).toHaveLength(1);
    await Cr.send('61k, front, grinding'); await settle();
    expect(S.ro.mileage).toBe('61000');
    expect(S.ro.answers['brk-where']).toBe('Front');
    const left = pendingQuestions().length;
    if (left) { expect(cards('questions')).toHaveLength(2); await Cr.send('not sure'); await settle(); }
    expect(cards('recs')).toHaveLength(1);
    expect(flow().rounds).toBeLessThanOrEqual(2);
  });
  it('Skip on the card shows the recommendations now', async () => {
    await Cr.send('2018 Toyota Corolla 61k, grinding when I brake'); await settle();
    answerQuestions({}, cards('questions')[0].parts); await settle();
    expect(cards('recs')).toHaveLength(1);
  });
  it('the three sections each have a customer talk track', async () => {
    Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Sienna', vin: '5TDYZ3DC2JS901691', mileage: '60000', symptom: 'Clicking when turning and grease on the inside of the front left tire.' });
    S.profile['shop.labor_rate'] = { value: 150 };
    const r = buildRecs();
    expect(r.repairs.items.length).toBeGreaterThan(0);
    expect(r.repairs.say).toMatch(/^You told us: "Clicking when turning/);
    expect(r.maint.say[0]).toMatch(/60,000 mile service/);
    expect(r.labor.anchor).toMatch(/^axle-asm/);
    expect(r.labor.items.length).toBeGreaterThan(0);
    expect(r.labor.items.every(i => i.say)).toBe(true);
    expect(r.labor.say).toMatch(/costs much less to do at the same time/);
  });
  it('an advisor who adds work skips the questions', async () => {
    await Cr.send('2018 Toyota Corolla 61k, grinding when I brake'); await settle();
    acceptItem('brk-front'); await settle();
    expect(nextStep().do).not.toBe('ask');
    expect(cards('recs')).toHaveLength(1);
  }, 20000);
});
describe('second question round only when it still matters', () => {
  beforeEach(() => { S.useAgent = false; });
  it('a clear top repair after round one goes straight to recommendations', async () => {
    await Cr.send('2018 Toyota Corolla 61k, grinding when I brake and the steering wheel shakes on the highway'); await settle();
    await Cr.send('front, grinding, highway speeds'); await settle();
    const types = S.chats.ro.items.filter(i => i.kind === 'cards').map(i => i.card.type);
    expect(types.filter(t => t === 'questions')).toHaveLength(1);
    expect(types).toContain('recs');
  }, 20000);
});

import { laborMode, setSetting, orderAddOns } from '../src/core/shopSettings.js';
import { SHOP } from '../src/core/data.js';
import { roContext } from '../src/core/roAgent.js';
import { buildRoPrompt } from '../server/services/coreAgentService.js';
describe('shop setting: how labor-guide recommendations are presented', () => {
  const axle = () => { Object.assign(S.ro, { year: '2018', make: 'Toyota', model: 'Sienna', mileage: '90000', symptom: 'Clicking when turning and grease on the inside of the front left tire.' }); S.ro.accepted.add('axle-asm-fwd-left'); };
  it('defaults to prioritized from the shop profile resource', () => {
    expect(SHOP.laborGuidePresentation).toBe('prioritized');
    expect(laborMode()).toBe('prioritized');
  });
  it('prioritized: part-of-the-job and recommended first, the rest offered as conditional', () => {
    axle();
    const l = buildRecs().labor;
    expect(l.mode).toBe('prioritized');
    expect(l.lead.every(i => ['required', 'recommended'].includes(i.kindId))).toBe(true);
    expect(l.lead.map(i => i.id)).toContain('transaxle-seal-each');
    expect(l.more.length).toBeGreaterThan(0);
    expect(l.more.every(i => ['if-needed', 'optional'].includes(i.kindId))).toBe(true);
    expect(l.say).toMatch(/With this job we would also put in a new transmission output seal\./);
    expect(l.say).toMatch(/only done if the technician finds they are needed/);
    expect(orderAddOns(['axle-boot-each', 'transaxle-seal-each'])).toEqual(['transaxle-seal-each', 'axle-boot-each']);
  });
  it('all: every add-on in the guide order, one list, nothing marked conditional', () => {
    axle();
    setSetting('labor.presentation', 'all');
    const l = buildRecs().labor;
    expect(l.more).toEqual([]);
    expect(l.lead.map(i => i.id)).toEqual(l.items.map(i => i.id));
    expect(l.say).toMatch(/The labor guide lists \d+ items with this job/);
    expect(orderAddOns(['axle-boot-each', 'transaxle-seal-each'])).toEqual(['axle-boot-each', 'transaxle-seal-each']);
  });
  it('the agent is told the shop setting in the repair order snapshot', () => {
    axle();
    const p = buildRoPrompt(roContext());
    expect(p).toMatch(/How the shop wants add-on labor presented: Lead with add-on labor that is part of the job/);
  });
});
