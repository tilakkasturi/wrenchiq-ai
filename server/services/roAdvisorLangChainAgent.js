/**
 * WrenchIQ — RO Advisor tool loop over LangChain `createAgent`
 *
 * The same agent as roAdvisorService.js's hand-rolled loop — same six tools,
 * same pre-fetched data, same system prompt, same JSON contract — with the
 * orchestration handed to LangChain instead of a `for` loop dispatching on
 * `finish_reason`. Selected by default (LLM_ENGINE=langchain); see config.js.
 *
 * roAdvisorService.js still owns everything either runtime shares: the six-way
 * pre-fetch, the tool definitions and executor, the system prompt, the
 * already-on-this-RO filtering, and the single-pass fallback. This file owns
 * only the loop.
 *
 * ── Why the client is built here rather than imported ────────────────────────
 *
 * `createAgent` needs a LangChain chat model instance, which the gateway
 * (azureOpenAILangChain.js) deliberately does not expose — it exposes a
 * request/response function. Rather than widen that proven surface, the model is
 * constructed here, and every quirk the gateway documents is carried over
 * verbatim below with its reason. That duplication is the deliberate cost of
 * leaving the default gateway path untouched: **any fix to the profile,
 * endpoint, max-token or fetch-shim logic in azureOpenAILangChain.js must be
 * mirrored here.**
 *
 * One thing genuinely differs. The gateway suppresses the auth headers the
 * legacy path would not have sent by nulling them per request through
 * `options.headers`, which is not reachable when LangChain owns the invocation.
 * They are nulled on the OpenAI client's `defaultHeaders` instead: openai@6
 * deletes a header whose value is null (internal/headers.js), and orders
 * `defaultHeaders` after its own auth headers (client.js buildHeaders), so the
 * placeholder Bearer loses. Same bytes on the wire, asserted in
 * test/roAdvisor.agent.test.js.
 *
 * ── Known divergences from the hand-rolled loop ──────────────────────────────
 *
 * 1. Tool-argument validation. @langchain/core validates JSON-schema tool args
 *    and throws ToolInputParsingException on a mismatch, where the hand-rolled
 *    loop swallows unparsable arguments and lets executeTool compute from
 *    undefined. A model call that violates its own advertised schema therefore
 *    produces a tool-error turn here instead of a silently empty result.
 * 2. The round cap is a LangGraph recursion limit counted in graph steps
 *    (one model call + one tool round = two), not a loop counter. Exceeding it
 *    raises GraphRecursionError, which lands on the single-pass fallback — the
 *    same place the hand-rolled loop lands when it runs out of turns.
 * 3. `finish_reason: 'length'` is not inspected. The loop treats it as
 *    terminal-and-parse; here a turn is terminal when it carries no tool calls,
 *    which is the same outcome unless a response is truncated mid-tool-call.
 */

import { createAgent } from 'langchain';
import { tool } from '@langchain/core/tools';
import { ChatOpenAICompletions } from '@langchain/openai';
import OpenAI from 'openai';

import { logLLMRequest } from './llmLogger.js';
import { LLM_PROFILES } from './llmProviderConfig.js';
import { RO_TOOLS, executeTool, addUsage } from './roAdvisorService.js';

/** Same observability tag the hand-rolled loop logs under. */
const ROUTE = '/api/agent/ro-advisor';

/** Same budget the hand-rolled loop passes on every turn. */
const MAX_TOKENS = 1200;

/**
 * Four model calls, matching the `turn < 4` cap. LangGraph counts graph steps,
 * so a run that calls tools every time costs two steps per model call.
 */
const MAX_MODEL_CALLS = 4;

/**
 * The chat model's apiKey field falls back to process.env.OPENAI_API_KEY when
 * given null or undefined, so it is never left empty. A non-empty placeholder
 * blocks that fallback deterministically; the real credential (or the absence
 * of one) is applied through headers, which take precedence on the wire.
 */
const API_KEY_PLACEHOLDER = 'wrenchiq-auth-is-set-via-headers';

/**
 * One HTTP client per endpoint for the life of the process, so a shop running a
 * hundred ROs through the Sidecar does not open a hundred connection pools.
 * Bounded so a future per-call model override cannot grow it without limit.
 */
const MAX_CACHED_CLIENTS = 16;
const _clientCache = new Map();

/**
 * The RO Advisor is pinned to the 'default' Predii LLM profile regardless of the
 * Settings → Integrations toggle — see the useConfiguredProvider note in
 * azureOpenAI.js. So there is nothing to resolve, only to validate.
 */
function resolveProfile() {
  const profile = { profileKey: 'default', ...LLM_PROFILES.default };
  if (!profile.baseUrl) {
    throw new Error('LLM profile "default" is not configured — set its base URL/key in .env.local');
  }
  return profile;
}

/**
 * Endpoints ending in /v1 are OpenAI-compatible: Bearer auth, no api-version.
 * Anything else is Azure deployment style: api-key header, api-version query.
 * A profile with no key gets no auth header at all — self-hosted servers reject
 * requests carrying a bogus one, and the SDK would otherwise attach the
 * placeholder, so the header is explicitly nulled rather than merely omitted.
 */
function resolveEndpoint(profile) {
  const baseURL = profile.baseUrl.replace(/\/$/, '');
  const isV1Endpoint = baseURL.endsWith('/v1') || baseURL.endsWith('/openai/v1');

  const defaultHeaders = {};
  if (profile.apiKey) {
    if (isV1Endpoint) defaultHeaders.Authorization = `Bearer ${profile.apiKey}`;
    else defaultHeaders['api-key'] = profile.apiKey;
  }
  if (!(profile.apiKey && isV1Endpoint)) defaultHeaders.Authorization = null;
  if (!profile.apiKey) defaultHeaders['api-key'] = null;

  return {
    baseURL,
    defaultHeaders,
    defaultQuery: isV1Endpoint ? undefined : { 'api-version': profile.apiVersion },
  };
}

/**
 * Restore the exact bytes the hand-rolled loop sent.
 *
 * createAgent reshapes the conversation more than a bare chat.invoke does, so
 * this does more than the gateway's shim of the same name:
 *
 * - Text content blocks (`[{type:'text',text}]`) back to a plain string. The
 *   agent builds a real SystemMessage from `systemPrompt`, which serialises as
 *   blocks; the loop sent `{role:'system', content:'<prompt>'}`.
 * - Empty assistant content alongside tool_calls back to `content: null`. The
 *   provider sent null, LangChain's converter rewrites it, and this loop feeds
 *   that turn straight back into the next request, so the difference compounds.
 *   Assistant content that is empty *without* tool calls is left alone — there
 *   the provider really did send an empty string.
 * - Drop `name` from assistant and tool turns. It is LangChain's own graph-node
 *   label ("model", or the tool's name), never anything the caller set, and the
 *   loop's bodies never carried it — a strict self-hosted server has no reason
 *   to accept a field the API contract does not require.
 * - Drop `stream: false`, which LangChain always emits and the loop never did.
 */
function makeNormalizingFetch(baseFetch) {
  return async (url, init = {}) => {
    if (typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        if (normalizeBody(body)) init = { ...init, body: JSON.stringify(body) };
      } catch {
        // Not JSON — leave it alone.
      }
    }
    return baseFetch(url, init);
  };
}

/** Rewrites `body` in place; returns whether anything changed. */
function normalizeBody(body) {
  let changed = false;

  for (const message of Array.isArray(body.messages) ? body.messages : []) {
    // Flattens `[]` to `''` too, which the next rule then nulls where it should.
    if (Array.isArray(message.content) && message.content.every((part) => part?.type === 'text')) {
      message.content = message.content.map((part) => part.text).join('');
      changed = true;
    }
    if (message.role === 'assistant' && message.tool_calls?.length && message.content === '') {
      message.content = null;
      changed = true;
    }
    if ((message.role === 'assistant' || message.role === 'tool') && 'name' in message) {
      delete message.name;
      changed = true;
    }
  }

  if (body.stream === false) {
    delete body.stream;
    changed = true;
  }

  return changed;
}

/** One OpenAI client per resolved endpoint. */
function getClient(endpoint) {
  const key = JSON.stringify([endpoint.baseURL, endpoint.defaultHeaders, endpoint.defaultQuery ?? null]);

  const cached = _clientCache.get(key);
  if (cached) return cached;

  const client = new OpenAI({
    apiKey: API_KEY_PLACEHOLDER,
    baseURL: endpoint.baseURL,
    defaultHeaders: endpoint.defaultHeaders,
    ...(endpoint.defaultQuery ? { defaultQuery: endpoint.defaultQuery } : {}),
    maxRetries: 0,
    // Bound late so a test that swaps globalThis.fetch is still honoured.
    fetch: (url, init) => makeNormalizingFetch(globalThis.fetch)(url, init),
  });

  if (_clientCache.size >= MAX_CACHED_CLIENTS) {
    _clientCache.delete(_clientCache.keys().next().value);
  }
  _clientCache.set(key, client);
  return client;
}

/** Newer OpenAI-family models reject max_tokens — the legacy gateway's rule. */
const legacyWantsCompletionTokens = (model) => /^(gpt-5|o1|o3)/i.test(model);

/** @langchain/openai's own isReasoningModel, mirrored so the two can be compared. */
const langchainWantsCompletionTokens = (model) =>
  /^o\d/.test(model) || (model.startsWith('gpt-5') && !model.startsWith('gpt-5-chat'));

/**
 * Put the token budget on the key the legacy gateway would have used. The chat
 * model writes its own choice of key from `this.maxTokens` after spreading
 * modelKwargs, so modelKwargs alone cannot win.
 */
function maxTokenFields(model, maxTokens) {
  const legacyKey = legacyWantsCompletionTokens(model) ? 'max_completion_tokens' : 'max_tokens';
  const langchainKey = langchainWantsCompletionTokens(model) ? 'max_completion_tokens' : 'max_tokens';

  return legacyKey === langchainKey
    ? { maxTokens }
    : { modelKwargs: { [legacyKey]: maxTokens } };
}

function buildChatModel() {
  const profile = resolveProfile();
  const endpoint = resolveEndpoint(profile);

  const chat = new ChatOpenAICompletions({
    model: profile.model,
    apiKey: API_KEY_PLACEHOLDER,
    maxRetries: 0,       // LangChain's caller retries 6 times by default, which
                         // would turn this agent's fast fallback into a stall.
    streaming: false,
    __includeRawResponse: true,
    ...maxTokenFields(profile.model, MAX_TOKENS),
    configuration: {
      baseURL: endpoint.baseURL,
      defaultHeaders: endpoint.defaultHeaders,
      ...(endpoint.defaultQuery ? { defaultQuery: endpoint.defaultQuery } : {}),
    },
  });
  chat.client = getClient(endpoint);

  return { chat, model: profile.model };
}

/**
 * Wrap the existing OpenAI-format tool definitions as LangChain tools.
 *
 * `parameters` is handed to `schema` unchanged — @langchain/core accepts a JSON
 * Schema there, so the tool payload on the wire stays byte-identical to what the
 * hand-rolled loop sends and no second schema definition has to be maintained.
 *
 * The result is stringified because the hand-rolled loop pushes
 * `content: JSON.stringify(toolResult)`; returning the object would let
 * LangChain serialise it differently and change the prompt.
 */
function buildTools(preloaded) {
  return RO_TOOLS.map(({ function: fn }) => tool(
    (args) => {
      const result = executeTool(fn.name, args, preloaded);
      console.log(`[roAdvisor] tool: ${fn.name} → ${JSON.stringify(result).slice(0, 120)}`);
      return JSON.stringify(result);
    },
    { name: fn.name, description: fn.description, schema: fn.parameters },
  ));
}

/** The provider's untouched envelope, stashed by __includeRawResponse. */
function rawOf(message) {
  return message?.additional_kwargs?.__raw_response;
}

/**
 * Accumulate usage, capture the model, and write one llm_request_log row per LLM
 * call — the things the gateway does around `chat.invoke` and that nothing else
 * would do now that this path no longer goes through it. Dropping the log would
 * blind the very query config.js names as the bar for retiring LLM_ENGINE.
 *
 * Accumulating here rather than by walking the final state also means usage
 * survives a run that ends in an error, matching the hand-rolled loop's habit of
 * keeping the tokens spent on turns that led nowhere.
 */
function makeCollector(fallbackModel) {
  const startedAt = new Map();
  const collected = { usage: null, model: null };

  const handler = {
    // A chat model starts with handleChatModelStart, and the callback manager
    // falls back to handleLLMStart when a handler does not implement it — which
    // is the only reason one hook covers both. There is no handleChatModelEnd,
    // so the end of the call always arrives as handleLLMEnd.
    handleLLMStart(_llm, _prompts, runId) {
      startedAt.set(runId, Date.now());
    },
    handleLLMEnd(output, runId) {
      const raw = rawOf(output?.generations?.[0]?.[0]?.message);
      const usage = raw?.usage || {};

      collected.usage = addUsage(collected.usage, usage);
      collected.model = collected.model || raw?.model || fallbackModel;

      logLLMRequest({
        provider: 'llm',
        route: ROUTE,
        model: raw?.model || fallbackModel,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        durationMs: elapsed(startedAt, runId),
        status: 'ok',
      }).catch(() => {});
    },
    handleLLMError(err, runId) {
      collected.model = collected.model || fallbackModel;
      logLLMRequest({
        provider: 'llm',
        route: ROUTE,
        model: fallbackModel,
        durationMs: elapsed(startedAt, runId),
        status: 'error',
        error: err?.message ?? String(err),
      }).catch(() => {});
    },
  };

  return { handler, collected };
}

function elapsed(startedAt, runId) {
  const t0 = startedAt.get(runId);
  startedAt.delete(runId);
  return t0 === undefined ? null : Date.now() - t0;
}

/**
 * Run the tool loop through createAgent.
 *
 * @param {object} opts
 * @param {string} opts.system     - The system prompt (buildSystemPrompt output).
 * @param {object} opts.preloaded  - The pre-fetched bundle executeTool reads.
 * @returns {Promise<{ result: object|null, usage: object|null, model: string|null }>}
 *   `result` is null whenever the run produced no parseable JSON — a thrown
 *   error, a recursion limit, or prose instead of an object — which is the
 *   caller's signal to fall back to the single-pass prompt. Usage and model are
 *   still returned in that case, so the tokens already spent are not lost.
 */
export async function runCreateAgentLoop({ system, preloaded }) {
  const { chat, model } = buildChatModel();
  const { handler, collected } = makeCollector(model);

  const agent = createAgent({
    model: chat,
    tools: buildTools(preloaded),
    systemPrompt: system,
  });

  let state;
  try {
    state = await agent.invoke(
      {
        messages: [{
          role: 'user',
          content: 'Analyze this repair order and produce recommendations for the service advisor.',
        }],
      },
      { recursionLimit: MAX_MODEL_CALLS * 2, callbacks: [handler] },
    );
  } catch (err) {
    console.warn('[roAdvisor] createAgent run failed, falling back to single-pass:', err.message);
    return { result: null, usage: collected.usage, model: collected.model };
  }

  const synthesis = findSynthesisTurn(state?.messages);
  // Prefer the provider's own content string so the text parsed here is byte-for
  // byte what the hand-rolled loop would have parsed.
  const text = rawOf(synthesis)?.choices?.[0]?.message?.content ?? textOf(synthesis) ?? '';

  try {
    const json = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return { result: JSON.parse(json), usage: collected.usage, model: collected.model };
  } catch {
    console.warn('[roAdvisor] createAgent produced no parseable JSON, falling back to single-pass');
    return { result: null, usage: collected.usage, model: collected.model };
  }
}

/**
 * The turn that answered rather than asked for tools — the last assistant turn
 * carrying no tool calls.
 *
 * Deliberately not `messages[messages.length - 1]`. The agent's message state is
 * a reducer keyed on message id, so an assistant turn can be replaced in place
 * rather than appended, leaving a tool result sitting in the final slot. Reading
 * that slot blind would hand a tool payload to JSON.parse, which succeeds — the
 * worst kind of wrong, since it looks like a valid result.
 */
function findSynthesisTurn(messages) {
  if (!Array.isArray(messages)) return undefined;
  return messages
    .filter((m) => typeOf(m) === 'ai' && !m?.tool_calls?.length)
    .at(-1);
}

/** LangChain message type tag, across the core versions that renamed it. */
function typeOf(message) {
  return message?.getType?.() ?? message?._getType?.();
}

/** Message content as a string, whether it arrived as text or as content blocks. */
function textOf(message) {
  if (typeof message?.text === 'string') return message.text;
  const content = message?.content;
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter((part) => part?.type === 'text').map((part) => part.text).join('');
  }
  return null;
}
