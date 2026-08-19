/**
 * WrenchIQ — Grounded Chat Completion (shared primitive)
 *
 * The one piece that was actually identical between shopChatService.js and
 * roChatService.js: build a bounded message array from history + the new
 * message, call the LLM gateway, and extract/trim the reply text. Each
 * service still owns its own system-prompt construction (grounding differs
 * meaningfully — RO context, voice directive, customer-label logic — see
 * docs/wrenchiq-agent-architecture-consolidation-proposal.md for why that
 * part stays separate) and, for RO Chat, its own model-tier resolution.
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';

/**
 * @param {object} opts
 * @param {string} opts.system
 * @param {Array<{role:'user'|'assistant', text:string}>} [opts.history]
 * @param {string} opts.message
 * @param {number} opts.maxTokens
 * @param {string} opts.route - passed through as callAzureOpenAI's `_route`
 * @param {string} [opts.profileKey] - e.g. 'frontier'; omit for the default profile
 * @param {boolean} [opts.useConfiguredProvider]
 * @returns {Promise<string>} the trimmed reply text
 */
export async function runGroundedChatCompletion({ system, history = [], message, maxTokens, route, profileKey, useConfiguredProvider }) {
  // RO Chat's "compare models" feature stores a "comparison"-role history
  // entry (predii/frontier fields, no .text) instead of a normal assistant
  // reply — filter those out rather than mapping them to a null/missing
  // `content`, which stricter schema validation (Azure/OpenAI, unlike the
  // self-hosted model) rejects outright.
  const messages = [
    ...history.filter((m) => typeof m.text === 'string').slice(-8)
      .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.text })),
    { role: 'user', content: message },
  ];

  const data = await callAzureOpenAI({
    system,
    messages,
    max_tokens: maxTokens,
    profileKey,
    _route: route,
    useConfiguredProvider,
  });

  return (getTextFromResponse(data) || '').trim();
}
