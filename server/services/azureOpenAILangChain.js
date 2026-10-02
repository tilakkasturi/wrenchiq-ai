/**
 * WrenchIQ — LangChain LLM gateway (AE-1286)
 *
 * Builds the same request and returns the same raw OpenAI-compatible JSON as
 * azureOpenAILegacy.js, but goes through @langchain/openai instead of fetch.
 * Everything here that looks fussy is preserving a behaviour the legacy path
 * had; the notes say which.
 *
 * Three choices worth knowing about before editing:
 *
 * 1. ChatOpenAICompletions, not ChatOpenAI or AzureChatOpenAI.
 *    ChatOpenAI v1 is a dispatcher that silently switches to the Responses API
 *    for model names containing "-pro" or "codex", which would change the wire
 *    protocol based on a config string. AzureChatOpenAI throws when no API key
 *    is present (our live default profile has none), falls back to reading
 *    AZURE_OPENAI_* from the environment, and wants instance/deployment
 *    components rather than the single opaque base URL our profiles store.
 *
 * 2. The OpenAI client is cached; the LangChain model is not.
 *    max_tokens and temperature are constructor fields on the chat model, not
 *    call options, so a shared model instance cannot serve calls with different
 *    budgets — a fresh one per call is unavoidable, and is only field assignment.
 *    The client is cached to avoid rebuilding and re-validating its options on
 *    every call. Note it is NOT what pools sockets: because a custom fetch is
 *    supplied below, connection reuse belongs to Node's global undici agent and
 *    is unaffected by how many clients exist.
 *
 * 3. A normalising fetch shim sits under the client.
 *    LangChain's message converter rewrites an assistant turn's `content: null`
 *    to `[]`, and always emits `stream: false`. Both would change the wire body
 *    relative to the legacy path — the first one inside the RO Advisor tool
 *    loop, where the assistant turn is fed back in verbatim.
 */

import { ChatOpenAICompletions } from '@langchain/openai';
import OpenAI from 'openai';

import { logLLMRequest } from './llmLogger.js';
import { getActiveLLMProfile, getDefaultProfile, LLM_PROFILES } from './llmProviderConfig.js';

/**
 * The chat model's apiKey field falls back to process.env.OPENAI_API_KEY when
 * given null or undefined, so it is never left empty. A non-empty placeholder
 * blocks that fallback deterministically; the real credential (or the absence
 * of one) is applied through headers, which take precedence on the wire.
 */
const API_KEY_PLACEHOLDER = 'wrenchiq-auth-is-set-via-headers';

/** Bounded so a future per-call model override cannot grow this without limit. */
const MAX_CACHED_CLIENTS = 16;
const _clientCache = new Map();

/** Test seam, and the hook to call if profile switching ever needs to invalidate. */
export function clearLLMClientCache() {
  _clientCache.clear();
}

/** Diagnostic: how many distinct endpoints have a client. */
export function getLLMClientCacheSize() {
  return _clientCache.size;
}

/**
 * Resolve which profile this call uses — identical rules to the legacy path.
 * Exported so roAdvisorLangChainAgent.js (the createAgent-based tool loop,
 * which builds its own chat model rather than calling
 * callAzureOpenAILangChain) shares this instead of keeping its own copy.
 */
export function resolveProfile({ profileKey, useConfiguredProvider } = {}) {
  if (profileKey) {
    const profile = { profileKey, ...LLM_PROFILES[profileKey] };
    if (!profile.baseUrl) {
      throw new Error(`LLM profile "${profileKey}" is not configured — set its base URL/key in .env.local`);
    }
    return profile;
  }
  return useConfiguredProvider
    ? getActiveLLMProfile()
    : getDefaultProfile();
}

/**
 * Endpoints ending in /v1 are OpenAI-compatible: Bearer auth, no api-version.
 * Anything else is Azure deployment style: api-key header, api-version query.
 * A profile with no key gets no auth header at all — self-hosted servers reject
 * requests carrying a bogus one.
 *
 * Exported for roAdvisorLangChainAgent.js — see resolveProfile's export note.
 * That caller additionally nulls out defaultHeaders itself (createAgent has
 * no per-call options.headers the way chat.invoke() below does), so this
 * function stays a pure baseURL/header/query computation rather than baking
 * in a header-suppression strategy that wouldn't fit both callers.
 */
export function resolveEndpoint(profile) {
  const baseURL = profile.baseUrl.replace(/\/$/, '');
  const isV1Endpoint = baseURL.endsWith('/v1') || baseURL.endsWith('/openai/v1');

  const defaultHeaders = {};
  if (profile.apiKey) {
    if (isV1Endpoint) defaultHeaders.Authorization = `Bearer ${profile.apiKey}`;
    else defaultHeaders['api-key'] = profile.apiKey;
  }

  return {
    baseURL,
    isV1Endpoint,
    defaultHeaders,
    defaultQuery: isV1Endpoint ? undefined : { 'api-version': profile.apiVersion },
  };
}

/**
 * Restore the exact bytes the legacy fetch path sent.
 *
 * - assistant `content: []` back to `content: null`. LangChain's converter
 *   rewrites null content on an assistant turn; roAdvisorService feeds that turn
 *   straight back into the next request, so the difference compounds across the
 *   tool loop.
 * - drop `stream: false`, which LangChain always emits and the legacy body
 *   never contained.
 */
function makeNormalizingFetch(baseFetch) {
  return async (url, init = {}) => {
    if (typeof init.body === 'string') {
      try {
        const body = JSON.parse(init.body);
        let changed = false;

        if (Array.isArray(body.messages)) {
          for (const message of body.messages) {
            if (message.role === 'assistant' && Array.isArray(message.content) && message.content.length === 0) {
              message.content = null;
              changed = true;
            }
          }
        }
        if (body.stream === false) {
          delete body.stream;
          changed = true;
        }

        if (changed) init = { ...init, body: JSON.stringify(body) };
      } catch {
        // Not JSON — leave it alone.
      }
    }
    return baseFetch(url, init);
  };
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

/**
 * @langchain/openai's own isReasoningModel, mirrored so the two can be compared.
 * It disagrees with ours in three places: gpt-5-chat, o4/o5-family names, and
 * capitalised model names (theirs is case-sensitive).
 */
const langchainWantsCompletionTokens = (model) =>
  /^o\d/.test(model) || (model.startsWith('gpt-5') && !model.startsWith('gpt-5-chat'));

/**
 * Put the token budget on the key the legacy gateway would have used.
 *
 * The chat model writes its own choice of key from `this.maxTokens` AFTER
 * spreading modelKwargs, so modelKwargs alone cannot win. When both rules agree,
 * set maxTokens and let it write. When they disagree, leave maxTokens unset —
 * it then writes its key as undefined, which JSON.stringify drops — and supply
 * the legacy key through modelKwargs.
 */
export function maxTokenFields(model, maxTokens) {
  const legacyKey = legacyWantsCompletionTokens(model) ? 'max_completion_tokens' : 'max_tokens';
  const langchainKey = langchainWantsCompletionTokens(model) ? 'max_completion_tokens' : 'max_tokens';

  return legacyKey === langchainKey
    ? { maxTokens }
    : { modelKwargs: { [legacyKey]: maxTokens } };
}

/**
 * Qwen3's "thinking" mode is on by default on vLLM/sglang and spends the
 * completion budget on hidden <think> reasoning before any visible content
 * — confirmed against the sglang-served Qwen3.8-27B-FP8 secondary endpoint:
 * a multi-tool-result synthesis call hit finish_reason "length" with empty
 * content well before reasoning finished, silently producing an
 * empty-but-valid JSON result (see "sglang vs vLLM Endpoint Handling" on
 * Confluence for the full writeup). Both vLLM and sglang accept this
 * OpenAI-compatible extension to turn it off; harmless no-op for
 * servers/models that ignore unknown body fields. Exported so
 * roAdvisorLangChainAgent.js shares this rather than keeping its own copy.
 */
export function thinkingModeFields(model) {
  return /qwen3/i.test(model) ? { chat_template_kwargs: { enable_thinking: false } } : {};
}

/**
 * Rebuild the OpenAI envelope from the typed message.
 *
 * Only reached if a future @langchain/openai stops populating
 * __includeRawResponse. It is lossy — id, created and logprobs are not exposed,
 * and empty content cannot be distinguished from null — so it degrades rather
 * than crashes, and says so loudly.
 */
let _warnedAboutFallback = false;
function reconstructEnvelope(message) {
  if (!_warnedAboutFallback) {
    _warnedAboutFallback = true;
    console.warn(
      '[azureOpenAI] LangChain no longer returns __raw_response; falling back to a lossy ' +
      'envelope rebuild. Pin @langchain/openai and check the gateway tests.',
    );
  }

  const meta = message.response_metadata || {};
  const toolCalls = message.additional_kwargs?.tool_calls;

  return {
    id: message.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: meta.model_name,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: typeof message.content === 'string' && message.content !== '' ? message.content : null,
        ...(toolCalls ? { tool_calls: toolCalls } : {}),
      },
      finish_reason: meta.finish_reason ?? null,
    }],
    usage: meta.usage ?? {
      prompt_tokens: message.usage_metadata?.input_tokens,
      completion_tokens: message.usage_metadata?.output_tokens,
      total_tokens: message.usage_metadata?.total_tokens,
    },
    ...(meta.system_fingerprint ? { system_fingerprint: meta.system_fingerprint } : {}),
  };
}

/**
 * Restore the legacy error contract.
 *
 * Downstream code falls back on any throw, but llm_request_log's error string is
 * the whole debugging surface, so the `LLM error <status>: <body>` prefix is
 * preserved. The body text cannot be byte-identical — the legacy path logged the
 * raw response text, and the SDK gives back a parsed object.
 */
function normalizeError(err) {
  const status = err?.status ?? err?.response?.status;
  if (!status) {
    // Network-level failure: legacy rethrew the original error untouched.
    return { error: err, logMessage: err?.message ?? String(err) };
  }

  let detail = '';
  if (typeof err.error === 'string') detail = err.error;
  else if (err.error) detail = JSON.stringify(err.error);
  else detail = err.message ?? '';

  return {
    error: new Error(`LLM error ${status}: ${detail}`),
    logMessage: `${status}: ${detail}`,
  };
}

/**
 * Call the LLM chat-completions endpoint through LangChain.
 * Signature and return value are identical to callAzureOpenAI — see
 * azureOpenAI.js for parameter documentation.
 */
export async function callAzureOpenAILangChain({
  system, messages, max_tokens, model, jsonMode = false, tools,
  _route, useConfiguredProvider = false, profileKey, temperature, callbacks,
}) {
  // Throws before any client is built, matching the legacy ordering: an
  // unconfigured profile is a configuration error, not a request failure, so
  // nothing is sent and nothing is logged.
  const profile = resolveProfile({ profileKey, useConfiguredProvider });
  const effectiveModel = model || profile.model;
  const endpoint = resolveEndpoint(profile);

  const tokenFields = maxTokenFields(effectiveModel, max_tokens);
  const modelKwargs = { ...tokenFields.modelKwargs, ...thinkingModeFields(effectiveModel) };

  const chat = new ChatOpenAICompletions({
    model: effectiveModel,
    apiKey: API_KEY_PLACEHOLDER,
    maxRetries: 0,       // LangChain's caller retries 6 times by default, which
                         // would break checkLLMHealth's 5s race and turn the RO
                         // Advisor's fast fallback into a multi-second stall.
    streaming: false,
    __includeRawResponse: true,
    ...(tokenFields.maxTokens !== undefined ? { maxTokens: tokenFields.maxTokens } : {}),
    ...(Object.keys(modelKwargs).length ? { modelKwargs } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    configuration: {
      baseURL: endpoint.baseURL,
      defaultHeaders: endpoint.defaultHeaders,
      ...(endpoint.defaultQuery ? { defaultQuery: endpoint.defaultQuery } : {}),
    },
  });
  chat.client = getClient(endpoint);

  const lcMessages = [];
  if (system) lcMessages.push({ role: 'system', content: system });
  lcMessages.push(...messages);

  // The SDK always attaches `Authorization: Bearer <apiKey>` from the placeholder,
  // so every auth header the legacy path would NOT have sent has to be suppressed
  // explicitly. Nulling per request is the only way that works: header values set
  // through `configuration.defaultHeaders` are filtered to strings, so a null
  // there is silently dropped and the SDK then refuses to send at all.
  const headerNulls = {};
  if (!(profile.apiKey && endpoint.isV1Endpoint)) headerNulls.Authorization = null;
  if (!profile.apiKey) headerNulls['api-key'] = null;

  const callOptions = {
    ...(tools?.length ? { tools } : {}),
    ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    ...(Object.keys(headerNulls).length ? { options: { headers: headerNulls } } : {}),
    // Observers only (e.g. a Langfuse handler); they never touch the request body.
    ...(callbacks?.length ? { callbacks } : {}),
  };

  const t0 = Date.now();
  let aiMessage;
  try {
    aiMessage = await chat.invoke(lcMessages, callOptions);
  } catch (err) {
    const { error, logMessage } = normalizeError(err);
    logLLMRequest({
      provider: 'llm', route: _route, model: effectiveModel, baseUrl: endpoint.baseURL,
      durationMs: Date.now() - t0, status: 'error', error: logMessage,
    }).catch(() => {});
    throw error;
  }

  const data = aiMessage.additional_kwargs?.__raw_response ?? reconstructEnvelope(aiMessage);
  const usage = data.usage || {};
  logLLMRequest({
    provider: 'llm',
    route: _route,
    model: effectiveModel,
    baseUrl: endpoint.baseURL,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    durationMs: Date.now() - t0,
    status: 'ok',
  }).catch(() => {});

  return data;
}
