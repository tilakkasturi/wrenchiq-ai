/**
 * WrenchIQ — checkLLMHealth (AE-1286, step 3)
 *
 * Fronts /api/health/detailed and the Tauri Sidecar startup screen. It races a
 * 5-token completion against a 5s timeout so a hung endpoint reports 'error'
 * rather than blocking the health screen, and reports 'degraded' past 3s.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider } from './helpers/stubProvider.js';
import { ENGINES } from './helpers/engines.js';

let stub;
afterEach(async () => {
  vi.useRealTimers();
  if (stub) { await stub.close(); stub = undefined; }
});

describe.each(ENGINES)('%s — checkLLMHealth', (engine) => {
  it('reports connected on a fast response and sends a 5-token ping', async () => {
    stub = await startStubProvider();
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    const result = await gateway.checkLLMHealth();

    expect(result.status).toBe('connected');
    expect(typeof result.latencyMs).toBe('number');
    expect(result.error).toBeUndefined();

    // A deliberately tiny request — this runs on every health poll.
    const body = stub.seen[0].body;
    expect(body.max_tokens).toBe(5);
    expect(body.messages).toEqual([{ role: 'user', content: 'ping' }]);
    expect(logCalls[0].route).toBe('health-check');
  });

  it('reports error rather than throwing when the endpoint fails', async () => {
    stub = await startStubProvider({ status: 500 });
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });

    const result = await gateway.checkLLMHealth();

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/LLM error 500/);
    expect(typeof result.latencyMs).toBe('number');
  });

  it('reports error rather than throwing when the endpoint is unreachable', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const closedPort = stub.port;
    await stub.close();
    stub = undefined;
    profiles.default = { ...profiles.default, baseUrl: `http://127.0.0.1:${closedPort}/v1` };

    const { gateway } = await loadGateway({ profiles, engine });
    const result = await gateway.checkLLMHealth();

    expect(result.status).toBe('error');
    expect(result.error).toBeTruthy();
  });

  it('always resolves to one of the three documented statuses', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });
    const result = await gateway.checkLLMHealth();
    expect(['connected', 'degraded', 'error']).toContain(result.status);
  });
});
