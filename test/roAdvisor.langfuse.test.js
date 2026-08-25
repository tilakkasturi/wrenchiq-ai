/**
 * WrenchIQ — RO Advisor Langfuse wiring (AE-1319)
 *
 * langfuseTracing.test.js proves buildLangfuseHandler()'s own env-gating and
 * OTEL bootstrap in isolation. This file proves the other half: that the
 * LangChain runtime's createAgent loop (roAdvisorLangChainAgent.js) actually
 * calls it and threads the result into agent.invoke's callbacks — by mocking
 * only langfuseTracing.js (our own module) and running the real tool loop
 * against a stub provider, the same way roAdvisor.agent.test.js does.
 *
 * LLM_ENGINE=loop is not exercised here: that runtime never calls
 * buildLangfuseHandler at all, which is the point of scoping this to
 * LangChain only.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';

import { startStubProvider, cannedCompletion, cannedToolCall } from './helpers/stubProvider.js';
import { makeProfiles } from './helpers/loadGateway.js';
import { loadROAdvisor, makeRO, makeVehicle, advisorJSON } from './helpers/loadROAdvisor.js';

let turnId = 0;
const uniqueId = () => ({ id: `chatcmpl-langfuse-${++turnId}` });

const toolCallTurn = () => cannedToolCall(
  [{ id: 'call_1', name: 'get_customer_history', args: { customerId: 'cust-001' } }],
  uniqueId(),
);

const finalTurn = () => cannedCompletion({
  ...uniqueId(),
  choices: [{ index: 0, message: { role: 'assistant', content: advisorJSON(), refusal: null }, finish_reason: 'stop', logprobs: null }],
});

describe('RO Advisor Langfuse wiring (LLM_ENGINE=langchain)', () => {
  let stub;
  afterEach(async () => { await stub?.close(); stub = null; });

  const run = async ({ buildLangfuseHandler }) => {
    stub = await startStubProvider({ responses: [toolCallTurn(), finalTurn()] });
    const { service } = await loadROAdvisor({
      profiles: makeProfiles({ baseV1: stub.baseV1, baseDeployment: stub.baseDeployment }),
      engine: 'langchain',
      buildLangfuseHandler,
    });
    return service.runROAdvisorAgent({
      ro: makeRO(),
      customer: { id: 'cust-001' },
      vehicle: makeVehicle(),
      shopId: 'shop-001',
      db: null,
    });
  };

  it('asks langfuseTracing for a handler tagged ro-advisor, and feeds it into the tool loop', async () => {
    const fakeHandler = { handleLLMStart: vi.fn(), handleLLMEnd: vi.fn() };
    const buildLangfuseHandler = vi.fn(async () => fakeHandler);

    const result = await run({ buildLangfuseHandler });

    expect(buildLangfuseHandler).toHaveBeenCalledWith({ tags: ['ro-advisor'] });
    // The handler was actually threaded into agent.invoke's callbacks (not just
    // constructed and discarded) — LangChain calls it on every model turn.
    expect(fakeHandler.handleLLMStart).toHaveBeenCalled();
    expect(fakeHandler.handleLLMEnd).toHaveBeenCalled();
    // Tracing is additive: the run's own contract is unaffected.
    expect(result.advisorBrief).toContain('brake fluid flush');
  });

  it('runs normally when langfuseTracing returns null (tracing off/misconfigured)', async () => {
    const buildLangfuseHandler = vi.fn(async () => null);

    const result = await run({ buildLangfuseHandler });

    expect(buildLangfuseHandler).toHaveBeenCalledWith({ tags: ['ro-advisor'] });
    expect(result.advisorBrief).toContain('brake fluid flush');
  });
});
