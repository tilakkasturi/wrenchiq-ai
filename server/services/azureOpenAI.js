/**
 * WrenchIQ — Azure OpenAI Helper
 *
 * Thin fetch wrapper for Azure OpenAI chat completions.
 * Uses the OpenAI-compatible endpoint on Azure.
 */

import { logLLMRequest } from './llmLogger.js';
import { getActiveLLMProfile, LLM_PROFILES } from './llmProviderConfig.js';

/**
 * Call Azure OpenAI chat completions.
 *
 * @param {object} opts
 * @param {string}   opts.system      - System prompt (optional)
 * @param {Array}    opts.messages    - Chat messages [{role, content}]
 * @param {number}   opts.max_tokens  - Max tokens in response
 * @param {string}   [opts.model]     - Model override (defaults to AZURE_OPENAI_MODEL)
 * @param {boolean}  [opts.jsonMode]  - Set response_format to json_object
 * @param {Array}    [opts.tools]     - OpenAI-format tool definitions
 * @param {boolean}  [opts.useConfiguredProvider] - Only the Chat feature
 *   (roChatService.js) opts into the Settings → Integrations "AI Engine"
 *   provider toggle. Every other caller (recommendations, ARO Agent, RO
 *   Score Agent, Knowledge Graph, RO Advisor) always uses the "default"
 *   Predii LLM profile, regardless of what the toggle is set to — explicit
 *   product requirement, not an oversight.
 * @param {string}   [opts.profileKey] - Force a specific LLM_PROFILES entry
 *   (e.g. 'frontier') regardless of useConfiguredProvider — its own
 *   base URL/key/model, not just a model-name override on top of whichever
 *   profile the Settings toggle has active. Throws if that profile has no
 *   base URL configured, rather than silently falling through to a
 *   different endpoint that doesn't have the requested model.
 * @returns {object} Raw Azure OpenAI response
 */
export async function callAzureOpenAI({ system, messages, max_tokens, model, jsonMode = false, tools, _route, useConfiguredProvider = false, profileKey, temperature }) {
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

/**
 * Extract text from an Azure OpenAI chat completions response.
 */
export function getTextFromResponse(data) {
  return data.choices?.[0]?.message?.content || '';
}

/**
 * Health check for the LLM endpoint (WrenchIQ Product Spec v4.0 §1) — a
 * minimal completion call raced against a timeout, so a hung endpoint
 * reports 'error' rather than blocking the Sidecar's health screen.
 */
export async function checkLLMHealth() {
  const t0 = Date.now();
  try {
    await Promise.race([
      callAzureOpenAI({ messages: [{ role: 'user', content: 'ping' }], max_tokens: 5, _route: 'health-check' }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('LLM health check timed out')), 5000)),
    ]);
    const latencyMs = Date.now() - t0;
    return { status: latencyMs > 3000 ? 'degraded' : 'connected', latencyMs };
  } catch (err) {
    return { status: 'error', latencyMs: Date.now() - t0, error: err.message };
  }
}
