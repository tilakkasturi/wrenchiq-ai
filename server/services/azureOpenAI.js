/**
 * WrenchIQ — LLM Gateway
 *
 * The single entry point for every server-side LLM call. Returns the raw
 * OpenAI-compatible chat-completions JSON: callers read choices[0].message
 * (content and tool_calls), finish_reason, usage.*_tokens and model directly,
 * so this stays a passthrough rather than normalising anything.
 *
 * LLM_ENGINE selects the client underneath — see server/config.js. Both engines
 * build the same request and return the same shape; the flag exists as a
 * rollback, not as a feature toggle.
 */

import { LLM_ENGINE } from '../config.js';
import { callAzureOpenAILegacy } from './azureOpenAILegacy.js';
import { callAzureOpenAILangChain } from './azureOpenAILangChain.js';

/**
 * Call the LLM chat-completions endpoint.
 *
 * @param {object} opts
 * @param {string}   opts.system      - System prompt (optional)
 * @param {Array}    opts.messages    - Chat messages [{role, content}]
 * @param {number}   opts.max_tokens  - Max tokens in response
 * @param {string}   [opts.model]     - Model override (defaults to the profile's model)
 * @param {boolean}  [opts.jsonMode]  - Set response_format to json_object
 * @param {Array}    [opts.tools]     - OpenAI-format tool definitions
 * @param {string}   [opts._route]    - Logging tag; the only observability key
 *   into llm_request_log, so keep it stable per call site.
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
 * @param {number}   [opts.temperature] - Omitted from the request entirely when
 *   undefined, so the backend's own default applies.
 * @returns {Promise<object>} Raw OpenAI-compatible response
 */
export async function callAzureOpenAI(opts) {
  if (LLM_ENGINE === 'loop') return callAzureOpenAILegacy(opts);
  return callAzureOpenAILangChain(opts);
}

/**
 * Extract text from a chat-completions response.
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
