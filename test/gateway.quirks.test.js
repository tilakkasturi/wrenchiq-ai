/**
 * WrenchIQ — gateway quirks (AE-1286, step 3)
 *
 * The small, load-bearing behaviours that are easy to lose in a client swap.
 * Each of these exists because a real provider rejected the alternative.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider } from './helpers/stubProvider.js';
import { ENGINES } from './helpers/engines.js';
import { RO_TOOLS } from './fixtures/callSites.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
});

async function callWithModel(engine, model, extra = {}) {
  stub = await startStubProvider();
  const profiles = makeProfiles(stub);
  profiles.default = { ...profiles.default, model };
  const { gateway } = await loadGateway({ profiles, engine });
  await gateway.callAzureOpenAI({
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 777,
    _route: '/api/test',
    ...extra,
  });
  return stub.seen[0].body;
}

describe.each(ENGINES)('%s — max_tokens vs max_completion_tokens', (engine) => {
  // Newer OpenAI-family models reject `max_tokens`. The gateway selects on model
  // name; LangChain has its own, DIFFERENT rule, so every class is pinned here.
  const cases = [
    ['gpt-4o-mini', 'max_tokens'],
    ['Firworks/gemma-4-26B-A4B-it-fp8', 'max_tokens'], // the live demo model
    ['gpt-5-chat', 'max_completion_tokens'],           // LangChain would disagree
    ['gpt-5.5-pro', 'max_completion_tokens'],
    ['o1-preview', 'max_completion_tokens'],
    ['O1-PREVIEW', 'max_completion_tokens'],           // legacy regex is case-insensitive
    ['o3-mini', 'max_completion_tokens'],
    ['o4-mini', 'max_tokens'],                         // LangChain would disagree
  ];

  it.each(cases)('%s uses %s', async (model, expectedKey) => {
    const body = await callWithModel(engine, model);
    const otherKey = expectedKey === 'max_tokens' ? 'max_completion_tokens' : 'max_tokens';
    expect(body[expectedKey]).toBe(777);
    expect(otherKey in body).toBe(false);
  });
});

describe.each(ENGINES)('%s — optional body fields', (engine) => {
  it('sets response_format only when jsonMode is true', async () => {
    const withJson = await callWithModel(engine, 'gpt-4o-mini', { jsonMode: true });
    expect(withJson.response_format).toEqual({ type: 'json_object' });

    await stub.close(); stub = undefined;
    const withoutJson = await callWithModel(engine, 'gpt-4o-mini', { jsonMode: false });
    expect('response_format' in withoutJson).toBe(false);
  });

  it('omits temperature entirely when it is undefined', async () => {
    const body = await callWithModel(engine, 'gpt-4o-mini');
    expect('temperature' in body).toBe(false);
  });

  it('sends temperature: 0 when explicitly requested', async () => {
    // threeCScoreService is the only caller that does this, and it relies on the
    // value actually reaching the provider.
    const body = await callWithModel(engine, 'gpt-4o-mini', { temperature: 0 });
    expect(body.temperature).toBe(0);
  });

  it('omits tools when absent or empty, and passes them byte-intact when present', async () => {
    const none = await callWithModel(engine, 'gpt-4o-mini');
    expect('tools' in none).toBe(false);

    await stub.close(); stub = undefined;
    const empty = await callWithModel(engine, 'gpt-4o-mini', { tools: [] });
    expect('tools' in empty).toBe(false);

    await stub.close(); stub = undefined;
    const withTools = await callWithModel(engine, 'gpt-4o-mini', { tools: RO_TOOLS });
    // Byte-intact matters: some clients inject a `strict` field, which changes
    // provider behaviour for tool calls.
    expect(withTools.tools).toEqual(RO_TOOLS);
    expect('strict' in withTools.tools[0].function).toBe(false);
  });

  it('does not add a stream key', async () => {
    const body = await callWithModel(engine, 'gpt-4o-mini');
    expect('stream' in body).toBe(false);
  });
});

describe.each(ENGINES)('%s — message passthrough', (engine) => {
  it('prepends the system prompt and preserves message order', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });
    await gateway.callAzureOpenAI({
      system: 'SYS',
      messages: [
        { role: 'user', content: 'one' },
        { role: 'assistant', content: 'two' },
        { role: 'user', content: 'three' },
      ],
      max_tokens: 32,
      _route: '/api/test',
    });
    expect(stub.seen[0].body.messages).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'one' },
      { role: 'assistant', content: 'two' },
      { role: 'user', content: 'three' },
    ]);
  });

  it('omits the system message entirely when no system prompt is given', async () => {
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });
    await gateway.callAzureOpenAI({
      messages: [{ role: 'user', content: 'only' }],
      max_tokens: 32,
      _route: '/api/test',
    });
    expect(stub.seen[0].body.messages).toEqual([{ role: 'user', content: 'only' }]);
  });

  it('round-trips an assistant tool_calls turn with null content', async () => {
    // The RO Advisor tool loop pushes the assistant turn back verbatim, including
    // content: null, and feeds tool results back as role: 'tool'. The arguments
    // field must stay a JSON *string* — the loop calls JSON.parse on it.
    stub = await startStubProvider();
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });

    const toolCalls = [{
      id: 'call_1',
      type: 'function',
      function: { name: 'get_customer_history', arguments: '{"customerId":"cust-001"}' },
    }];

    await gateway.callAzureOpenAI({
      system: 'SYS',
      messages: [
        { role: 'user', content: 'advise' },
        { role: 'assistant', content: null, tool_calls: toolCalls },
        { role: 'tool', tool_call_id: 'call_1', content: '{"visits":3}' },
      ],
      max_tokens: 1200,
      tools: RO_TOOLS,
      _route: '/api/agent/ro-advisor',
    });

    const sent = stub.seen[0].body.messages;
    expect(sent).toEqual([
      { role: 'system', content: 'SYS' },
      { role: 'user', content: 'advise' },
      { role: 'assistant', content: null, tool_calls: toolCalls },
      { role: 'tool', tool_call_id: 'call_1', content: '{"visits":3}' },
    ]);
    expect(typeof sent[2].tool_calls[0].function.arguments).toBe('string');
  });
});
