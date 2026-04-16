/**
 * WrenchIQ — Azure OpenAI Helper
 *
 * Thin fetch wrapper for Azure OpenAI chat completions.
 * Uses the OpenAI-compatible endpoint on Azure.
 */

import {
  AZURE_OPENAI_API_KEY,
  AZURE_OPENAI_API_BASE,
  AZURE_OPENAI_API_VERSION,
  AZURE_OPENAI_MODEL,
} from '../config.js';

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
export async function callAzureOpenAI({ system, messages, max_tokens, model, jsonMode = false, tools }) {
  if (!AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY not configured — set it in .env.local');
  }

  const effectiveModel = model || AZURE_OPENAI_MODEL;
  // Strip trailing slash, then append the path.
  // The /openai/v1/ endpoint does NOT accept api-version; older deployment paths do.
  const base = AZURE_OPENAI_API_BASE.replace(/\/$/, '');
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

  const res = await fetch(url, {
    method:  'POST',
    headers: {
      'api-key':      AZURE_OPENAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)');
    throw new Error(`Azure OpenAI error ${res.status}: ${errBody}`);
  }

  return res.json();
}

/**
 * Extract text from an Azure OpenAI chat completions response.
 */
export function getTextFromResponse(data) {
  return data.choices?.[0]?.message?.content || '';
}
