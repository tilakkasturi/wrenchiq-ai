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
import { prompt } from './promptLoader.js';

export async function translateToEnglish(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return '';

  const content = prompt('reply-translate-to-english', { text: trimmed });

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content }],
    max_tokens: Math.max(200, trimmed.length * 2),
    temperature: 0,
    _route:     '/api/ro-chat/translate',
  });

  return getTextFromResponse(data).trim();
}
