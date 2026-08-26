/**
 * WrenchIQ — Reply Translation
 *
 * A single-call LLM skill (same shape as threeCScoreService.js) that
 * translates one already-generated chat reply into English for an advisor
 * reading the RO Chat/Ask WrenchIQ transcript — not a general translator,
 * and not the reply-language selection itself (roChatService.js's
 * `language` param). This exists for the opposite direction: the advisor
 * picked (or the model auto-detected) a non-English reply language to
 * communicate with the customer, but still needs to understand what was
 * actually said.
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';

export async function translateToEnglish(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  const prompt = `Translate the following text into English. Respond with ONLY the translation — no quotes, no explanation, no "Here's the translation:" preamble.

Text:
${trimmed}`;

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content: prompt }],
    max_tokens: Math.max(200, trimmed.length * 2),
    temperature: 0,
    _route:     '/api/ro-chat/translate',
  });

  return getTextFromResponse(data).trim();
}
