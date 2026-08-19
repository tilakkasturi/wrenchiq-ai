/**
 * WrenchIQ — gateway error and logging behaviour (AE-1286, step 3)
 *
 * Error handling here is load-bearing, not incidental: roAdvisorService falls
 * back to a single-pass agent on ANY throw, roScoreAgent returns all-'unclear',
 * threeCScoreService returns a null score, and shopIntelFactsService 503s. So
 * the gateway must keep throwing where it throws today.
 *
 * logLLMRequest is the only observability into LLM traffic — `_route` plus the
 * error string is the entire debugging surface — so its arguments are asserted
 * as carefully as the responses.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider, cannedCompletion } from './helpers/stubProvider.js';
import { ENGINES } from './helpers/engines.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
});

describe.each(ENGINES)('%s — error paths', (engine) => {
  it.each([400, 401, 429, 500, 503])('throws on HTTP %i and logs one error entry', async (status) => {
    stub = await startStubProvider({ status, errorBody: 'upstream said no' });
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 32,
      _route: '/api/test',
    })).rejects.toThrow(new RegExp(`^LLM error ${status}: `));

    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toMatchObject({
      provider: 'llm',
      route: '/api/test',
      model: 'stub-model',
      status: 'error',
    });
    expect(logCalls[0].error).toMatch(new RegExp(`^${status}: `));
    expect(typeof logCalls[0].durationMs).toBe('number');
  });

  it('makes exactly one attempt — no retries', async () => {
    // A retrying client would blow through checkLLMHealth's 5s race and turn
    // roAdvisor's fast fallback into a multi-second stall.
    stub = await startStubProvider({ status: 500 });
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 32,
      _route: '/api/test',
    })).rejects.toThrow();

    expect(stub.seen).toHaveLength(1);
  });

  it('throws and logs on a network failure', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const closedPort = stub.port;
    await stub.close();
    stub = undefined;
    profiles.default = { ...profiles.default, baseUrl: `http://127.0.0.1:${closedPort}/v1` };

    const { gateway, logCalls } = await loadGateway({ profiles, engine });
    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 32,
      _route: '/api/test',
    })).rejects.toThrow();

    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toMatchObject({ provider: 'llm', route: '/api/test', status: 'error' });
    expect(logCalls[0].error).toBeTruthy();
  });

  it('throws before any request when a forced profile has no baseUrl', async () => {
    stub = await startStubProvider();
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 32,
      profileKey: 'unconfigured',
      _route: '/api/test',
    })).rejects.toThrow(/LLM profile "unconfigured" is not configured/);

    // Nothing was sent and nothing was logged — this failure predates the run.
    expect(stub.seen).toHaveLength(0);
    expect(logCalls).toHaveLength(0);
  });
});

describe.each(ENGINES)('%s — success logging', (engine) => {
  it('logs provider, route, model, token counts and duration', async () => {
    stub = await startStubProvider();
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 64,
      _route: '/api/three-c-score/rewrite',
    });

    expect(logCalls).toHaveLength(1);
    const entry = logCalls[0];
    // 'llm' is hardcoded and the /api/llm-log dashboard groups on it — a change
    // here splits historical data across two provider buckets.
    expect(entry.provider).toBe('llm');
    expect(entry.route).toBe('/api/three-c-score/rewrite');
    expect(entry.model).toBe('stub-model');
    expect(entry.status).toBe('ok');
    expect(entry.promptTokens).toBe(7);
    expect(entry.completionTokens).toBe(2);
    expect(entry.totalTokens).toBe(9);
    expect(typeof entry.durationMs).toBe('number');
  });

  it('logs the effective model when the caller overrides it', async () => {
    stub = await startStubProvider();
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 64,
      model: 'override-model',
      _route: '/api/test',
    });

    expect(logCalls[0].model).toBe('override-model');
  });

  it('does not throw when the response has no usage block', async () => {
    const response = cannedCompletion();
    delete response.usage;
    stub = await startStubProvider({ response });
    const { gateway, logCalls } = await loadGateway({ profiles: makeProfiles(stub), engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 64,
      _route: '/api/test',
    });

    expect(logCalls[0].status).toBe('ok');
    expect(logCalls[0].totalTokens).toBeUndefined();
  });
});
