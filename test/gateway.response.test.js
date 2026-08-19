/**
 * WrenchIQ — gateway response envelope (AE-1286, step 3)
 *
 * Callers reach directly into the raw provider JSON: choices[0].message.content,
 * .tool_calls, finish_reason, usage.*_tokens, and data.model. The gateway is a
 * passthrough, and must stay one — any normalisation would silently change
 * fifteen call sites.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { loadGateway, makeProfiles } from './helpers/loadGateway.js';
import { startStubProvider, cannedCompletion } from './helpers/stubProvider.js';
import { ENGINES } from './helpers/engines.js';
import { RO_TOOLS } from './fixtures/callSites.js';

let stub;
afterEach(async () => {
  if (stub) { await stub.close(); stub = undefined; }
});

async function callReturning(engine, response) {
  stub = await startStubProvider({ response });
  const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });
  return gateway.callAzureOpenAI({
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 64,
    _route: '/api/test',
  });
}

describe.each(ENGINES)('%s — response envelope', (engine) => {
  it('returns the provider JSON unchanged', async () => {
    const response = cannedCompletion();
    const data = await callReturning(engine, response);
    expect(data).toEqual(response);
  });

  it('preserves every field the call sites read', async () => {
    const data = await callReturning(engine, cannedCompletion());
    expect(data.choices[0].message.content).toBe('pong');
    expect(data.choices[0].finish_reason).toBe('stop');
    expect(data.usage).toEqual({ prompt_tokens: 7, completion_tokens: 2, total_tokens: 9 });
    expect(data.model).toBe('stub-model');
    expect(data.id).toBe('chatcmpl-test');
  });

  it('preserves a null content with tool_calls and finish_reason tool_calls', async () => {
    // This is exactly what the RO Advisor loop inspects to decide whether to
    // execute tools and continue. `arguments` must remain a JSON string.
    const toolCalls = [{
      id: 'call_1',
      type: 'function',
      function: { name: 'get_customer_history', arguments: '{"customerId":"cust-001"}' },
    }];
    const data = await callReturning(engine, cannedCompletion({
      choices: [{
        index: 0,
        message: { role: 'assistant', content: null, tool_calls: toolCalls },
        finish_reason: 'tool_calls',
      }],
    }));

    expect(data.choices[0].message.content).toBeNull();
    expect(data.choices[0].message.tool_calls).toEqual(toolCalls);
    expect(typeof data.choices[0].message.tool_calls[0].function.arguments).toBe('string');
    expect(data.choices[0].finish_reason).toBe('tool_calls');
  });

  it('preserves finish_reason length, which recommendationLLM treats as an error', async () => {
    const data = await callReturning(engine, cannedCompletion({
      choices: [{ index: 0, message: { role: 'assistant', content: 'trunc' }, finish_reason: 'length' }],
    }));
    expect(data.choices[0].finish_reason).toBe('length');
  });

  it('preserves a zero completion_tokens rather than dropping the key', async () => {
    // Token accounting feeds a cost-projection UI; a dropped zero reads as
    // "unknown" rather than "none".
    const data = await callReturning(engine, cannedCompletion({
      usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
    }));
    expect(data.usage.completion_tokens).toBe(0);
    expect('completion_tokens' in data.usage).toBe(true);
  });

  it('survives a response with no usage block', async () => {
    const response = cannedCompletion();
    delete response.usage;
    const data = await callReturning(engine, response);
    expect(data.usage).toBeUndefined();
    expect(data.choices[0].message.content).toBe('pong');
  });

  it('returns tool_calls from a request that sent tools', async () => {
    stub = await startStubProvider({
      response: cannedCompletion({
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: null,
            tool_calls: [{ id: 'c1', type: 'function', function: { name: 'get_shop_objectives', arguments: '{}' } }],
          },
          finish_reason: 'tool_calls',
        }],
      }),
    });
    const { gateway } = await loadGateway({ profiles: makeProfiles(stub), engine });
    const data = await gateway.callAzureOpenAI({
      system: 'SYS',
      messages: [{ role: 'user', content: 'advise' }],
      max_tokens: 1200,
      tools: RO_TOOLS,
      _route: '/api/agent/ro-advisor',
    });
    expect(data.choices[0].message.tool_calls[0].function.name).toBe('get_shop_objectives');
  });
});

describe.each(ENGINES)('%s — getTextFromResponse', (engine) => {
  it('extracts content and degrades to empty string', async () => {
    const { gateway } = await loadGateway({ engine });
    expect(gateway.getTextFromResponse(cannedCompletion())).toBe('pong');
    expect(gateway.getTextFromResponse({ choices: [{ message: { content: null } }] })).toBe('');
    expect(gateway.getTextFromResponse({ choices: [] })).toBe('');
    expect(gateway.getTextFromResponse({})).toBe('');
  });
});
