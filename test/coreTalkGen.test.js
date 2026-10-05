import { describe, it, expect, beforeEach, vi } from 'vitest';

const agentStep = vi.fn();
vi.mock('../src/core/agentApi.js', () => ({ agentStep: (...a) => agentStep(...a) }));
vi.mock('../src/core/partsApi.js', () => ({ searchNapa: async () => ({ ok: true, priceBasis: 'NAPA catalog list price', retrievedAt: new Date().toISOString(), parts: [] }) }));

import { S, newRO } from '../src/core/state.js';
import { validateTalk, parseTracks, generateTalk, talkText, talkState, clearTalkCache } from '../src/core/talkGen.js';
import { talkTracks, trackById } from '../src/core/talkTracks.js';
import { buildTalkPrompt } from '../server/services/coreAgentService.js';

const sienna = () => {
  S.ro = { ...newRO(), started: true, year: '2018', make: 'Toyota', model: 'Sienna', vin: '5TDYZ3DC2JS901691', mileage: '60000', symptom: 'Clicking when turning and grease on the inside of the front left tire.' };
  S.profile = { 'shop.labor_rate': { value: 150, display: '$150/hr' } };
};
beforeEach(() => { sienna(); S.useAgent = true; clearTalkCache(); agentStep.mockReset(); });

describe('talk tracks: facts for the model, template as fallback', () => {
  it('builds a track for every talk track on screen, with the source split off for code to append', () => {
    const ids = talkTracks().map(t => t.id);
    expect(ids).toEqual(expect.arrayContaining(['repairs', 'labor', 'maint', 'package:medium']));
    expect(ids.some(id => id.startsWith('addon:'))).toBe(true);
    const r = trackById(talkTracks(), 'repairs');
    expect(r.source).toBe('(Source: Mitchell 1 repair times.)');
    expect(r.reference).not.toMatch(/Source:/);
    expect(r.facts).toMatchObject({ hours: 3.5, estimated_labor: '$525' });
  });
  it('the prompt comes from prompts/ with every track and no unfilled placeholders', () => {
    const p = buildTalkPrompt({ tracks: talkTracks() });
    expect(p).toMatch(/You write what a service advisor says to a vehicle owner/);
    expect(p).toMatch(/"id": "repairs"/);
    expect(p).not.toMatch(/\{\{/);
  });
});

describe('validation', () => {
  const r = () => trackById(talkTracks(), 'repairs');
  const good = 'Based on what you described, we recommend an inspection first to confirm the cause. If it is confirmed, the repair most often associated with that is replacing the axle shaft assembly, with a standard repair time of 3.5 hours, an estimated $525 plus parts, applicable fees and taxes. Nothing is added without your approval.';
  it('accepts a faithful rewrite and sets the source line itself', () => {
    const v = validateTalk(r(), good + ' (Source: something else.)');
    expect(v.ok).toBe(true);
    expect(v.text.endsWith('(Source: Mitchell 1 repair times.)')).toBe(true);
    expect(v.text).not.toMatch(/something else/);
  });
  it('rejects an invented number, banned wording, a missing point, or a named provider', () => {
    expect(validateTalk(r(), good.replace('$525', '$499')).problems.join()).toMatch(/numbers not in the facts: 499/);
    expect(validateTalk(r(), good + ' The labor guide lists it.').problems.join()).toMatch(/labor guide/);
    expect(validateTalk(r(), good + ' We need to do it today.').problems.join()).toMatch(/obligation/);
    expect(validateTalk(r(), good + ' It will fail soon.').problems.join()).toMatch(/failure/);
    expect(validateTalk(r(), good.replace('an inspection first to confirm the cause. If it is confirmed, ', '')).problems.join()).toMatch(/missing: an inspection first/);
    expect(validateTalk(r(), good.replace('Nothing is added without your approval.', 'Thanks.')).problems.join()).toMatch(/missing: the customer decides/);
    expect(validateTalk(r(), good + ' Per Mitchell 1 data.').problems.join()).toMatch(/provider/);
  });
  it('reads the model reply even with prose or a code fence around the JSON', () => {
    expect(parseTracks('Here you go:\n```json\n{"tracks":{"repairs":"x"}}\n```')).toEqual({ repairs: 'x' });
    expect(parseTracks('not json')).toBeNull();
  });
});

describe('generation: one call, each track checked, template on failure', () => {
  it('shows checked model text, keeps the template for a track that failed, and records it in the trace', async () => {
    const tracks = talkTracks();
    const out = {};
    tracks.forEach(t => { out[t.id] = t.reference.replace(/^/, '') + ' ' + 'The decision is yours.'; });
    out.repairs = 'Based on what you described, we recommend an inspection first to confirm the cause. If confirmed, the repair most often associated with it is replacing the axle shaft assembly: 3.5 hours at the standard repair time, an estimated $525 plus parts, applicable fees and taxes. Nothing is added without your approval.';
    out.labor = 'This will fail without it, so we need to add it.';
    agentStep.mockResolvedValue({ ok: true, model: 'test', message: { content: JSON.stringify({ tracks: out }) } });
    await generateTalk(tracks);
    expect(agentStep).toHaveBeenCalledTimes(1);
    expect(agentStep.mock.calls[0][0].context.mode).toBe('talk');
    const rep = trackById(tracks, 'repairs'), lab = trackById(tracks, 'labor');
    expect(talkState(rep)).toBe('checked');
    expect(talkText(rep)).toMatch(/^Based on what you described.*\(Source: Mitchell 1 repair times\.\)$/);
    expect(talkState(lab)).toBe('template');
    expect(talkText(lab)).toBe(lab.reference + ' ' + lab.source);
    const step = S.trace.turns.flatMap(t => t.steps).find(s => s.title === 'Talk tracks (model, checked)');
    expect(step.data.results.find(x => x.id === 'labor').problems.join()).toMatch(/obligation|failure/);
    await generateTalk(tracks); // cached by facts: no second call
    expect(agentStep).toHaveBeenCalledTimes(1);
  });
  it('model unavailable: every track keeps the template; scripted mode never calls the model', async () => {
    agentStep.mockResolvedValue({ ok: false, message: 'offline' });
    const tracks = talkTracks();
    await generateTalk(tracks);
    tracks.forEach(t => expect(talkText(t)).toBe(t.reference + (t.source ? ' ' + t.source : '')));
    clearTalkCache(); agentStep.mockReset(); S.useAgent = false;
    await generateTalk(talkTracks());
    expect(agentStep).not.toHaveBeenCalled();
  });
});
