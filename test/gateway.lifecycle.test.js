/**
 * WrenchIQ — LangChain client lifecycle (AE-1286, step 7)
 *
 * LangChain-path-only concerns, so these do not run over ENGINES.
 *
 * The chat model carries max_tokens and temperature as constructor fields, so it
 * cannot be shared between calls with different budgets — but the OpenAI client
 * underneath owns the socket pool and must be. These tests pin that split, and
 * pin the environment-driven behaviours that would otherwise only show up in
 * production.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider, authHeadersOf } from './helpers/stubProvider.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
  delete process.env.LANGSMITH_GATEWAY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_BASE_URL;
});

describe('LangChain client cache', () => {
  it('reuses one client across calls with different token budgets and temperatures', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine: 'langchain' });

    for (const [max_tokens, temperature] of [[100, undefined], [500, 0], [1200, undefined], [4096, 0.7]]) {
      await gateway.callAzureOpenAI({
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens,
        ...(temperature !== undefined ? { temperature } : {}),
        _route: '/api/test',
      });
    }

    expect(stub.seen).toHaveLength(4);
    // Each call still gets its own budget on the wire...
    expect(stub.seen.map((r) => r.body.max_tokens)).toEqual([100, 500, 1200, 4096]);
    // ...and temperature is only present where it was passed.
    expect(stub.seen.map((r) => 'temperature' in r.body)).toEqual([false, true, false, true]);
    expect(stub.seen[1].body.temperature).toBe(0);
  });

  it('keeps separate clients per profile, with no auth bleed between them', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, engine: 'langchain' });

    // Keyless default, then keyed Azure, then back to the keyless default. If
    // clients or headers were shared, the third call would carry Azure's key.
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'a' }], max_tokens: 8, _route: '/api/test' });
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'b' }], max_tokens: 8, profileKey: 'azure', _route: '/api/test' });
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'c' }], max_tokens: 8, _route: '/api/test' });

    expect(authHeadersOf(stub.seen[0])).toEqual({});
    expect(authHeadersOf(stub.seen[1])).toEqual({ 'api-key': 'AZ-TEST-KEY' });
    expect(authHeadersOf(stub.seen[2])).toEqual({});
  });

  it('builds one client for repeated calls on the same profile', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine: 'langchain' });
    const langchain = await import('../server/services/azureOpenAILangChain.js');
    langchain.clearLLMClientCache();

    for (const max_tokens of [16, 32, 64, 128, 256]) {
      await gateway.callAzureOpenAI({
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens,
        _route: '/api/test',
      });
    }

    expect(stub.seen).toHaveLength(5);
    expect(langchain.getLLMClientCacheSize()).toBe(1);
  });

  it('keys the cache per endpoint, not per call', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, engine: 'langchain' });
    const langchain = await import('../server/services/azureOpenAILangChain.js');
    langchain.clearLLMClientCache();

    // Same host, two profiles: different auth, so two distinct clients — and
    // returning to the first must not build a third.
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'a' }], max_tokens: 8, _route: '/api/test' });
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'b' }], max_tokens: 8, profileKey: 'azure', _route: '/api/test' });
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'c' }], max_tokens: 8, _route: '/api/test' });

    expect(stub.seen).toHaveLength(3);
    expect(langchain.getLLMClientCacheSize()).toBe(2);
  });

  it('exposes a cache clear that forces a rebuild without changing behaviour', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine: 'langchain' });
    const langchain = await import('../server/services/azureOpenAILangChain.js');

    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'a' }], max_tokens: 8, _route: '/api/test' });
    langchain.clearLLMClientCache();
    await gateway.callAzureOpenAI({ messages: [{ role: 'user', content: 'b' }], max_tokens: 8, _route: '/api/test' });

    expect(stub.seen).toHaveLength(2);
    expect(authHeadersOf(stub.seen[1])).toEqual({});
  });
});

describe('LangChain environment isolation', () => {
  it('is not hijacked by LANGSMITH_GATEWAY', async () => {
    // The chat model rewrites its base URL to the LangSmith gateway when this is
    // set and no explicit baseURL was given. We always pass one — this proves it.
    process.env.LANGSMITH_GATEWAY = 'true';
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine: 'langchain' });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      _route: '/api/test',
    });

    expect(stub.seen).toHaveLength(1);
    expect(stub.seen[0].url).toBe('/v1/chat/completions');
  });

  it('ignores OPENAI_API_KEY and OPENAI_BASE_URL from the environment', async () => {
    // Both are read as fallbacks by the SDK. A developer with these set must not
    // get different behaviour, and must never have the key leak onto a request
    // bound for the keyless self-hosted profile.
    process.env.OPENAI_API_KEY = 'sk-should-never-be-used';
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1';

    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine: 'langchain' });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      _route: '/api/test',
    });

    expect(stub.seen).toHaveLength(1);
    expect(stub.seen[0].url).toBe('/v1/chat/completions');
    expect(authHeadersOf(stub.seen[0])).toEqual({});
  });
});
