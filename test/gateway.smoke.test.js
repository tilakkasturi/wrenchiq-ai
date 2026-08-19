/**
 * WrenchIQ — gateway harness smoke test (AE-1286, step 1)
 *
 * The point of this file is not coverage, it is proving the harness itself
 * works before any migration code exists:
 *
 *   - importing the gateway does NOT boot server/index.js (port 3001 / Mongo),
 *   - synthetic profiles can be injected in place of real credentials,
 *   - the stub provider records what actually went on the wire,
 *   - logLLMRequest calls can be captured.
 *
 * If this file fails, every later step is blocked.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider, authHeadersOf } from './helpers/stubProvider.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
});

describe('test harness', () => {
  it('imports the gateway without booting server/index.js', async () => {
    const { gateway } = await loadGateway();
    expect(typeof gateway.callAzureOpenAI).toBe('function');
    expect(typeof gateway.getTextFromResponse).toBe('function');
    expect(typeof gateway.checkLLMHealth).toBe('function');
  });

  it('scrubs provider credentials from the environment', () => {
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    expect(process.env.AZURE_OPENAI_API_KEY).toBeUndefined();
    expect(process.env.LANGSMITH_GATEWAY).toBeUndefined();
  });

  it('fails loudly on an unexpected non-loopback network call', () => {
    expect(() => globalThis.fetch('https://api.openai.com/v1/chat/completions'))
      .toThrow(/unexpected non-loopback network call/);
  });
});

describe('getTextFromResponse', () => {
  it('extracts assistant content', async () => {
    const { gateway } = await loadGateway();
    expect(gateway.getTextFromResponse({
      choices: [{ message: { content: 'hello' } }],
    })).toBe('hello');
  });

  it('returns empty string for null content, a missing choice, or an empty object', async () => {
    const { gateway } = await loadGateway();
    expect(gateway.getTextFromResponse({ choices: [{ message: { content: null } }] })).toBe('');
    expect(gateway.getTextFromResponse({ choices: [] })).toBe('');
    expect(gateway.getTextFromResponse({})).toBe('');
  });
});

describe('callAzureOpenAI against the stub provider', () => {
  it('reaches the stub, returns the raw envelope, and logs one ok entry', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway, logCalls } = await loadGateway({ profiles });

    const data = await gateway.callAzureOpenAI({
      system: 'You are a test.',
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 128,
      _route: '/api/smoke',
    });

    // Raw provider envelope, unwrapped — this is the contract all 15 call sites rely on.
    expect(data.choices[0].message.content).toBe('pong');
    expect(data.choices[0].finish_reason).toBe('stop');
    expect(data.usage.total_tokens).toBe(9);
    expect(data.id).toBe('chatcmpl-test');

    // What actually went on the wire.
    expect(stub.seen).toHaveLength(1);
    const req = stub.seen[0];
    expect(req.url).toBe('/v1/chat/completions');
    expect(req.body.model).toBe('stub-model');
    expect(req.body.max_tokens).toBe(128);
    expect(req.body.messages).toEqual([
      { role: 'system', content: 'You are a test.' },
      { role: 'user', content: 'ping' },
    ]);
    // The live default profile has no API key: no auth header at all.
    expect(authHeadersOf(req)).toEqual({});

    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toMatchObject({
      provider: 'llm',
      route: '/api/smoke',
      model: 'stub-model',
      status: 'ok',
      promptTokens: 7,
      completionTokens: 2,
      totalTokens: 9,
    });
  });

  it('throws the documented error shape and logs an error entry on a non-2xx', async () => {
    stub = await startStubProvider({ status: 429, errorBody: 'rate limited' });
    const profiles = makeProfiles(stub);
    const { gateway, logCalls } = await loadGateway({ profiles });

    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      _route: '/api/smoke',
    })).rejects.toThrow(/^LLM error 429: /);

    expect(logCalls).toHaveLength(1);
    expect(logCalls[0]).toMatchObject({ provider: 'llm', route: '/api/smoke', status: 'error' });
  });

  it('throws for a profileKey with no baseUrl, before any request is made', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway, logCalls } = await loadGateway({ profiles });

    await expect(gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      profileKey: 'unconfigured',
      _route: '/api/smoke',
    })).rejects.toThrow(/is not configured/);

    expect(stub.seen).toHaveLength(0);
    expect(logCalls).toHaveLength(0);
  });
});
