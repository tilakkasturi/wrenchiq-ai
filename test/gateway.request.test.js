/**
 * WrenchIQ — gateway request parity (AE-1286, step 3)
 *
 * Asserts what goes on the wire for every production call site, across every
 * endpoint shape. This is the contract the LangChain migration must not break.
 *
 * Bodies are compared with toEqual (order-insensitive) rather than by string,
 * because key ordering is an implementation detail of whichever HTTP client is
 * underneath. Headers are compared through an allowlist: transport headers
 * (User-Agent, Accept, X-Stainless-*) legitimately differ between clients, auth
 * headers absolutely must not.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider, authHeadersOf } from './helpers/stubProvider.js';
import { ENGINES, engineLabel } from './helpers/engines.js';
import { CALL_SITES } from './fixtures/callSites.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
});

/** The request body the legacy fetch path builds, derived from the call args. */
function expectedBody(args, { model }) {
  const messages = [];
  if (args.system) messages.push({ role: 'system', content: args.system });
  messages.push(...args.messages);

  const wantsCompletionTokens = /^(gpt-5|o1|o3)/i.test(model);
  return {
    model,
    messages,
    ...(wantsCompletionTokens
      ? { max_completion_tokens: args.max_tokens }
      : { max_tokens: args.max_tokens }),
    ...(args.jsonMode ? { response_format: { type: 'json_object' } } : {}),
    ...(args.temperature !== undefined ? { temperature: args.temperature } : {}),
    ...(args.tools?.length ? { tools: args.tools } : {}),
  };
}

describe.each(ENGINES)('%s — request parity', (engine) => {
  describe.each(Object.entries(CALL_SITES))('call site %s', (slug, { args, notes }) => {
    it(`sends the expected body and endpoint (${notes})`, async () => {
      stub = await startStubProvider();
      const profiles = makeProfiles(stub);
      const { gateway } = await loadGateway({ profiles, engine });

      await gateway.callAzureOpenAI(args);

      expect(stub.seen).toHaveLength(1);
      const req = stub.seen[0];

      // Which profile did this call site resolve to?
      const profileKey = args.profileKey ?? (args.useConfiguredProvider ? 'default' : 'default');
      const profile = profiles[profileKey];

      expect(req.method).toBe('POST');
      expect(req.body).toEqual(expectedBody(args, { model: profile.model }));

      // Endpoint ends in /v1 => OpenAI-compatible path, no api-version query.
      expect(req.url).toBe('/v1/chat/completions');

      // Bearer when a key exists, nothing at all when it doesn't.
      expect(authHeadersOf(req)).toEqual(
        profile.apiKey ? { authorization: `Bearer ${profile.apiKey}` } : {},
      );
    });
  });
});

describe.each(ENGINES)('%s — endpoint shapes', (engine) => {
  it('uses api-key header and api-version query for Azure deployment style', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 64,
      profileKey: 'azure',
      _route: '/api/test',
    });

    const req = stub.seen[0];
    expect(req.url).toBe('/openai/deployments/d1/chat/completions?api-version=2024-12-01-preview');
    expect(authHeadersOf(req)).toEqual({ 'api-key': 'AZ-TEST-KEY' });
    expect(req.body.model).toBe('gpt-4o');
  });

  it('omits the auth header entirely when the profile has no key', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 64,
      _route: '/api/test',
    });

    // This is the live demo path: a self-hosted server with no key, which
    // rejects requests that carry a bogus Authorization header.
    expect(authHeadersOf(stub.seen[0])).toEqual({});
  });

  it('strips a trailing slash from the base URL', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    profiles.default = { ...profiles.default, baseUrl: `${profiles.default.baseUrl}/` };
    const { gateway } = await loadGateway({ profiles, engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      _route: '/api/test',
    });

    expect(stub.seen[0].url).toBe('/v1/chat/completions');
  });

  it('honours an explicit model override without changing the endpoint', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      model: 'override-model',
      _route: '/api/test',
    });

    expect(stub.seen[0].body.model).toBe('override-model');
    expect(stub.seen[0].url).toBe('/v1/chat/completions');
  });

  it('resolves useConfiguredProvider against the active profile', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, activeProfile: 'azure', engine });

    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      useConfiguredProvider: true,
      _route: '/api/ro-chat',
    });

    expect(stub.seen[0].url).toContain('/openai/deployments/d1/chat/completions');
    expect(authHeadersOf(stub.seen[0])).toEqual({ 'api-key': 'AZ-TEST-KEY' });
  });

  it('pins non-chat callers to the default profile even when another is active', async () => {
    stub = await startStubProvider();
    const profiles = makeProfiles(stub);
    const { gateway } = await loadGateway({ profiles, activeProfile: 'azure', engine });

    // Explicit product requirement: only chat opts into the Settings toggle.
    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'ping' }],
      max_tokens: 8,
      _route: '/api/recommendations',
    });

    expect(stub.seen[0].url).toBe('/v1/chat/completions');
    expect(authHeadersOf(stub.seen[0])).toEqual({});
  });
});
