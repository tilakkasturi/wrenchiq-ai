/**
 * WrenchIQ — RO Advisor runtime parity
 *
 * The RO Advisor is the only real tool-calling agent in the repo, and until now
 * the only thing under test was the gateway beneath it: the gateway suites prove
 * a `content: null` + `tool_calls` turn survives the round trip, but nothing
 * proved the *loop* builds that turn, sums usage across turns, or emits the
 * dataSourced counters the Sidecar's Agent Trace tab prices off.
 *
 * So this suite runs the whole agent against a scripted stub provider and
 * asserts on the wire, in the same style as the gateway suites. It is
 * parameterised over LLM_ENGINE so it reads as a parity check between the
 * hand-rolled loop and the LangChain createAgent runtime rather than a
 * description of either one.
 *
 * Every run passes `db: null`, so each of the six data fetchers takes its
 * documented fallback path (DEMO_NOTES_FALLBACK, DEFAULT_SHOP_PROFILE, [], the
 * curated TSB set). No MongoDB, no VPN, and the counters are deterministic.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { startStubProvider, cannedCompletion, cannedToolCall, authHeadersOf } from './helpers/stubProvider.js';
import { makeProfiles } from './helpers/loadGateway.js';
import { loadROAdvisor, makeRO, makeVehicle, advisorJSON } from './helpers/loadROAdvisor.js';

/**
 * Both runtimes must satisfy every assertion in here. `undefined` exercises the
 * module default, so the suite also proves the default is the LangChain
 * runtime rather than only testing explicit values — same convention as
 * ENGINES in helpers/engines.js.
 */
const RUNTIMES = ['loop', 'langchain', undefined];
const runtimeLabel = (runtime) => `LLM_ENGINE=${runtime ?? '(default)'}`;

/** What db: null makes every fetcher return — pinned so a silent change is caught. */
const EXPECTED_DATA_SOURCED = {
  historyVisits: 0,          // fetchCustomerHistory returns [] without a db
  objectivesCount: 6,        // DEMO_NOTES_FALLBACK
  cannedJobsCount: 0,        // getCannedJobs returns [] without a db
  seasonalTrendsAvailable: false,
  tsbCount: 2,               // curated set: 2021 Toyota Camry has two entries
};

/**
 * Every scripted turn gets its own completion id, because a real provider issues
 * one per completion — and because LangGraph's message state is a reducer keyed
 * on that id, so reusing it makes a later turn overwrite an earlier one instead
 * of appending. Sharing `chatcmpl-test` across turns would test a conversation
 * that cannot happen.
 */
let turnId = 0;
const uniqueId = () => ({ id: `chatcmpl-test-${++turnId}` });

const toolCallTurn = () => cannedToolCall(
  [{ id: 'call_1', name: 'get_customer_history', args: { customerId: 'cust-001' } }],
  uniqueId(),
);

const finalTurn = (content = advisorJSON()) => cannedCompletion({
  ...uniqueId(),
  choices: [{ index: 0, message: { role: 'assistant', content, refusal: null }, finish_reason: 'stop', logprobs: null }],
});

describe.each(RUNTIMES.map((r) => [runtimeLabel(r), r]))('RO Advisor [%s]', (_label, runtime) => {
  let stub;
  const run = async ({ responses, skipTools } = {}) => {
    const { service, logCalls } = await loadROAdvisor({
      profiles: makeProfiles({ baseV1: stub.baseV1, baseDeployment: stub.baseDeployment }),
      engine: runtime,
      skipTools,
    });
    const result = await service.runROAdvisorAgent({
      ro: makeRO(),
      customer: { id: 'cust-001' },
      vehicle: makeVehicle(),
      shopId: 'shop-001',
      db: null,
    });
    return { result, logCalls };
  };

  const startWith = async (responses) => { stub = await startStubProvider({ responses }); };

  afterEach(async () => { await stub?.close(); stub = null; });

  describe('a two-turn run: one tool round, then the JSON synthesis', () => {
    beforeEach(async () => { await startWith([toolCallTurn(), finalTurn()]); });

    it('makes exactly one LLM call per turn and stops once the JSON arrives', async () => {
      await run();
      expect(stub.seen).toHaveLength(2);
    });

    it('offers all six tools on the first turn, byte-intact', async () => {
      await run();
      const { tools } = stub.seen[0].body;

      expect(tools.map((t) => t.function.name)).toEqual([
        'get_customer_history',
        'get_shop_objectives',
        'get_mileage_services',
        'get_canned_jobs',
        'get_seasonal_trends',
        'get_tsbs',
      ]);
      expect(tools.every((t) => t.type === 'function')).toBe(true);
      // No key the caller did not ask for — `strict` in particular changes how a
      // provider validates arguments, so it must not appear by accident.
      expect('strict' in tools[0].function).toBe(false);
      expect(Object.keys(tools[0].function).sort()).toEqual(['description', 'name', 'parameters']);
    });

    it('sends the system prompt and the seed user turn, and no JSON mode', async () => {
      await run();
      const body = stub.seen[0].body;

      expect(body.messages[0].role).toBe('system');
      expect(body.messages[0].content).toContain('You are WrenchIQ Intelligence');
      expect(body.messages[1]).toEqual({
        role: 'user',
        content: 'Analyze this repair order and produce recommendations for the service advisor.',
      });
      expect(body.max_tokens).toBe(1200);
      expect('response_format' in body).toBe(false);
      expect('stream' in body).toBe(false);
    });

    it('sends no request or message field beyond what the loop sends', async () => {
      await run();

      // A framework that quietly adds `parallel_tool_calls`, `tool_choice`, or a
      // graph-node `name` onto a message is the failure mode this pins: harmless
      // against a permissive provider, a 400 against a strict self-hosted one.
      for (const request of stub.seen) {
        expect(Object.keys(request.body).sort()).toEqual(['max_tokens', 'messages', 'model', 'tools']);
      }
      const replayed = stub.seen[1].body.messages;
      expect(Object.keys(replayed.find((m) => m.role === 'assistant')).sort())
        .toEqual(['content', 'role', 'tool_calls']);
      expect(Object.keys(replayed.find((m) => m.role === 'tool')).sort())
        .toEqual(['content', 'role', 'tool_call_id']);
      // A plain string, not the content-block array LangChain serialises to.
      expect(typeof stub.seen[0].body.messages[0].content).toBe('string');
    });

    it('grounds the system prompt in this RO, and lists its existing line items', async () => {
      await run();
      const prompt = stub.seen[0].body.messages[0].content;

      expect(prompt).toContain('Sarah Chen');
      expect(prompt).toContain('2021 Toyota Camry');
      expect(prompt).toContain('52,000 miles');
      expect(prompt).toContain('AC not blowing cold');
      expect(prompt).toContain('a/c system diagnosis & pressure test');
    });

    it('replays the assistant turn with content: null and its tool_calls', async () => {
      await run();
      const assistant = stub.seen[1].body.messages.find((m) => m.role === 'assistant');

      expect(assistant.content).toBeNull();
      expect(assistant.tool_calls).toHaveLength(1);
      expect(assistant.tool_calls[0].id).toBe('call_1');
      expect(assistant.tool_calls[0].function.name).toBe('get_customer_history');
      // A string, not a parsed object — the wire format the provider expects.
      expect(typeof assistant.tool_calls[0].function.arguments).toBe('string');
    });

    it('feeds the tool result back as a role:tool turn carrying JSON text', async () => {
      await run();
      const toolTurn = stub.seen[1].body.messages.find((m) => m.role === 'tool');

      expect(toolTurn.tool_call_id).toBe('call_1');
      expect(typeof toolTurn.content).toBe('string');
      expect(JSON.parse(toolTurn.content)).toEqual({
        customerId: 'cust-001',
        historyCount: 0,
        visits: [],
      });
    });

    it('keeps offering the tools on the second turn', async () => {
      await run();
      expect(stub.seen[1].body.tools).toHaveLength(6);
    });

    it('sends no auth header for the keyless default profile', async () => {
      await run();
      for (const request of stub.seen) expect(authHeadersOf(request)).toEqual({});
    });

    it('sums token usage across both turns rather than reading the last response', async () => {
      const { result } = await run();
      // cannedCompletion reports 7/2/9 per call, so anything that reads only the
      // final response would report 7/2/9 here instead of double.
      expect(result.usage).toEqual({ promptTokens: 14, completionTokens: 4, totalTokens: 18 });
    });

    it('reports the model the provider answered with', async () => {
      const { result } = await run();
      expect(result.model).toBe('stub-model');
    });

    it('emits every dataSourced counter the Agent Trace tab reads', async () => {
      const { result } = await run();
      expect(result.dataSourced).toEqual(EXPECTED_DATA_SOURCED);
    });

    it('returns the parsed advisor payload with a generatedAt timestamp', async () => {
      const { result } = await run();

      expect(result.advisorBrief).toContain('brake fluid flush');
      expect(result.alerts).toEqual([{ type: 'dtc', message: 'P0300 present — random misfire.' }]);
      expect(result.ings).toHaveLength(1);
      expect(result.suggestedCustomerMessage).toContain('Hi Sarah');
      expect(Number.isNaN(Date.parse(result.generatedAt))).toBe(false);
    });

    it('drops a recommendation that is already a line item on this RO', async () => {
      const { result } = await run();
      // The model was told to return both; "A/C System Diagnosis" duplicates the
      // RO's "A/C System Diagnosis & Pressure Test" and must not survive.
      expect(result.serviceRecommendations.map((r) => r.service)).toEqual(['Brake Fluid Flush']);
    });

    it('logs one llm_request_log row per LLM call, tagged with the agent route', async () => {
      const { logCalls } = await run();

      expect(logCalls).toHaveLength(2);
      for (const entry of logCalls) {
        expect(entry.route).toBe('/api/agent/ro-advisor');
        expect(entry.provider).toBe('llm');
        expect(entry.status).toBe('ok');
        expect(entry.totalTokens).toBe(9);
      }
    });
  });

  describe('fallbacks', () => {
    it('falls back to the single-pass prompt when the final turn is not JSON', async () => {
      await startWith([toolCallTurn(), finalTurn('I am afraid I cannot help with that.'), finalTurn()]);
      const { result } = await run();

      expect(stub.seen).toHaveLength(3);
      // The single-pass path is the only one that asks for JSON mode, and it
      // inlines the data instead of offering tools.
      const fallback = stub.seen[2].body;
      expect(fallback.response_format).toEqual({ type: 'json_object' });
      expect('tools' in fallback).toBe(false);
      expect(fallback.messages).toHaveLength(1);
      expect(fallback.messages[0].content).toContain('DATA ALREADY LOADED');

      // Still a complete envelope, and usage covers all three calls.
      expect(result.advisorBrief).toContain('brake fluid flush');
      expect(result.dataSourced).toEqual(EXPECTED_DATA_SOURCED);
      expect(result.usage.totalTokens).toBe(27);
    });

    it('skips tools entirely when LLM_SKIP_TOOLS is set', async () => {
      await startWith([finalTurn()]);
      const { result } = await run({ skipTools: true });

      expect(stub.seen).toHaveLength(1);
      expect('tools' in stub.seen[0].body).toBe(false);
      expect(stub.seen[0].body.response_format).toEqual({ type: 'json_object' });
      expect(result.serviceRecommendations.map((r) => r.service)).toEqual(['Brake Fluid Flush']);
      expect(result.dataSourced).toEqual(EXPECTED_DATA_SOURCED);
    });

    it('falls back to the single-pass prompt when the tool turn never resolves', async () => {
      // Four tool_call turns in a row exhausts the loop's round budget without a
      // JSON answer, which must degrade rather than return nothing.
      await startWith([toolCallTurn(), toolCallTurn(), toolCallTurn(), toolCallTurn(), finalTurn()]);
      const { result } = await run();

      expect(stub.seen).toHaveLength(5);
      expect(stub.seen[4].body.response_format).toEqual({ type: 'json_object' });
      expect(result.advisorBrief).toContain('brake fluid flush');
    });
  });
});
