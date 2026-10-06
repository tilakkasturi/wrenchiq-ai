import { describe, it, expect, vi, afterEach } from 'vitest';
import { startPartstech } from '../src/core/partsApi.js';

// The Core tests mock partsApi.js; this checks the real client sends what the server needs.
describe('PartsTech client', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('sends the whole parts list for a multi-part PartsTech session', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ref: 'r1', redirectUrl: 'u', requested: [] }) }));
    vi.stubGlobal('fetch', fetchMock);
    const r = await startPartstech({ vin: '2T1BURHE3JC012345', year: '2018', make: 'Toyota', model: 'Corolla', parts: ['Front brake pads', 'Spark plugs'] });
    expect(r).toMatchObject({ ok: true, ref: 'r1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/partstech\/sessions$/);
    expect(JSON.parse(init.body)).toMatchObject({ vin: '2T1BURHE3JC012345', parts: ['Front brake pads', 'Spark plugs'] });
  });
  it('reports the server error message instead of failing silently', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 400, json: async () => ({ error: 'no_part', message: 'A part name or partTypeIds are needed.' }) })));
    expect(await startPartstech({ vin: 'x', parts: [] })).toEqual({ ok: false, code: 'no_part', message: 'A part name or partTypeIds are needed.' });
  });
});
