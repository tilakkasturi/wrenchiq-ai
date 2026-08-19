/**
 * WrenchIQ — Legacy raw-fetch LLM gateway
 *
 * The original implementation of callAzureOpenAI, moved here unchanged when the
 * LangChain path landed (AE-1286). Reachable by setting LLM_ENGINE=legacy, as a
 * no-rebuild rollback.
 *
 * Do not add features here. Fixes belong in azureOpenAI.js; this file exists to
 * be deleted once the LangChain path has proven itself in the demo.
 */

import { logLLMRequest } from './llmLogger.js';
import { getActiveLLMProfile, LLM_PROFILES } from './llmProviderConfig.js';

/**
 * Call the LLM chat-completions endpoint over raw fetch.
 * Signature and return value are identical to callAzureOpenAI — see
 * azureOpenAI.js for the parameter documentation.
 *
 * @returns {object} Raw OpenAI-compatible chat-completions response
 */
export async function callAzureOpenAILegacy({ system, messages, max_tokens, model, jsonMode = false, tools, _route, useConfiguredProvider = false, profileKey, temperature }) {
  let profile;
  if (profileKey) {
    profile = { profileKey, ...LLM_PROFILES[profileKey] };
    if (!profile.baseUrl) {
      throw new Error(`LLM profile "${profileKey}" is not configured — set its base URL/key in .env.local`);
    }
  } else {
    profile = useConfiguredProvider ? getActiveLLMProfile() : { profileKey: 'default', ...LLM_PROFILES.default };
  }
  const effectiveModel = model || profile.model;
  // Strip trailing slash, then append the path.
  // Endpoints ending in /v1 are OpenAI-compatible (Bearer auth, no api-version param).
  // Azure deployment-style endpoints use api-key header + api-version query param.
  const base = profile.baseUrl.replace(/\/$/, '');
  const isV1Endpoint = base.endsWith('/v1') || base.endsWith('/openai/v1');
  const url = isV1Endpoint
    ? `${base}/chat/completions`
    : `${base}/chat/completions?api-version=${profile.apiVersion}`;

  const oaiMessages = [];
  if (system) oaiMessages.push({ role: 'system', content: system });
  oaiMessages.push(...messages);

  const body = {
    model:      effectiveModel,
    messages:   oaiMessages,
    // Newer OpenAI-family models (gpt-5.x, o1, o3, ...) reject `max_tokens`
    // and require `max_completion_tokens` instead — the API's error is
    // explicit about this, so match on model name rather than guessing.
    ...(/^(gpt-5|o1|o3)/i.test(effectiveModel) ? { max_completion_tokens: max_tokens } : { max_tokens }),
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  // Explicit opt-in only — most callers (chat, recommendations) want the
  // backend's default sampling. temperature: 0 alone doesn't *guarantee*
  // bit-identical output on every inference backend (continuous-batching
  // servers like vLLM can still introduce tiny nondeterminism), so callers
  // that need real agreement across repeated calls (e.g. threeCScoreService)
  // cache by input hash on top of this rather than relying on it alone.
  if (temperature !== undefined) {
    body.temperature = temperature;
  }

  if (tools?.length) {
    body.tools = tools;
  }

  // OpenAI-compatible (/v1) uses Bearer auth; Azure deployment-style uses api-key header.
  // Local servers with no key: omit the auth header entirely to avoid rejected requests.
  const authHeader = profile.apiKey
    ? isV1Endpoint
      ? { 'Authorization': `Bearer ${profile.apiKey}` }
      : { 'api-key': profile.apiKey }
    : {};

  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, {
      method:  'POST',
      headers: {
        ...authHeader,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    });
  } catch (fetchErr) {
    const dur = Date.now() - t0;
    logLLMRequest({ provider: 'llm', route: _route, model: effectiveModel, durationMs: dur, status: 'error', error: fetchErr.message }).catch(() => {});
    throw fetchErr;
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)');
    const dur = Date.now() - t0;
    logLLMRequest({ provider: 'llm', route: _route, model: effectiveModel, durationMs: dur, status: 'error', error: `${res.status}: ${errBody}` }).catch(() => {});
    throw new Error(`LLM error ${res.status}: ${errBody}`);
  }

  const data = await res.json();
  const dur = Date.now() - t0;
  const usage = data.usage || {};
  logLLMRequest({
    provider: 'llm',
    route: _route,
    model: effectiveModel,
    promptTokens: usage.prompt_tokens,
    completionTokens: usage.completion_tokens,
    totalTokens: usage.total_tokens,
    durationMs: dur,
    status: 'ok',
  }).catch(() => {});

  return data;
}
