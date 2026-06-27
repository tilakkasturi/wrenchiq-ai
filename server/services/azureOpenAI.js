/**
 * WrenchIQ — Azure OpenAI Helper
 *
 * Thin fetch wrapper for Azure OpenAI chat completions.
 * Uses the OpenAI-compatible endpoint on Azure.
 */

import {
  LLM_BASE_URL,
  LLM_API_KEY,
  LLM_MODEL,
  AZURE_OPENAI_API_VERSION,
} from '../config.js';
import { logLLMRequest } from './llmLogger.js';

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
 * @returns {object} Raw Azure OpenAI response
 */
export async function callAzureOpenAI({ system, messages, max_tokens, model, jsonMode = false, tools, _route }) {
  const effectiveModel = model || LLM_MODEL;
  // Strip trailing slash, then append the path.
  // Endpoints ending in /v1 are OpenAI-compatible (Bearer auth, no api-version param).
  // Azure deployment-style endpoints use api-key header + api-version query param.
  const base = LLM_BASE_URL.replace(/\/$/, '');
  const isV1Endpoint = base.endsWith('/v1') || base.endsWith('/openai/v1');
  const url = isV1Endpoint
    ? `${base}/chat/completions`
    : `${base}/chat/completions?api-version=${AZURE_OPENAI_API_VERSION}`;

  const oaiMessages = [];
  if (system) oaiMessages.push({ role: 'system', content: system });
  oaiMessages.push(...messages);

  const body = {
    model:      effectiveModel,
    messages:   oaiMessages,
    max_tokens,
  };

  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  if (tools?.length) {
    body.tools = tools;
  }

  // OpenAI-compatible (/v1) uses Bearer auth; Azure deployment-style uses api-key header.
  // Local servers with no key: omit the auth header entirely to avoid rejected requests.
  const authHeader = LLM_API_KEY
    ? isV1Endpoint
      ? { 'Authorization': `Bearer ${LLM_API_KEY}` }
      : { 'api-key': LLM_API_KEY }
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
