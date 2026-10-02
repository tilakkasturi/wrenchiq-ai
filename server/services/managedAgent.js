/**
 * WrenchIQ — Managed Agent Service
 *
 * Implements session-based conversational agent using the shared LLM gateway
 * (callAzureOpenAI). Sessions are kept in memory as conversation history.
 * Emits the same event types as the old Anthropic Managed Agents integration
 * so the route layer (agent.js) is unchanged.
 */

import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { LLM_MODEL } from '../config.js';
import { logLLMRequest } from './llmLogger.js';
import { prompt } from './promptLoader.js';

// System prompt wording: prompts/managed-agent-system.md (re-read when it changes).

// In-memory session store: sessionId → messages[]
const sessions = new Map();

function makeSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a new agent session. Returns { sessionId }.
 */
export async function createSession(title = 'WrenchIQ Session') {
  const sessionId = makeSessionId();
  sessions.set(sessionId, []);
  console.log(`[managedAgent] Session created: ${sessionId} — "${title}"`);
  return { sessionId };
}

/**
 * Send a user message and stream synthetic events back via onEvent.
 * Emits:
 *   { type: 'assistant.message', content: [{ type: 'text', text }] }
 *   { type: 'session.status_idle' }
 */
export async function streamMessage(sessionId, message, onEvent) {
  const history = sessions.get(sessionId);
  if (!history) {
    throw new Error(`Unknown session: ${sessionId}`);
  }

  history.push({ role: 'user', content: message });

  const t0 = Date.now();
  let responseText = '';

  try {
    const data = await callAzureOpenAI({
      system:     prompt('managed-agent-system'),
      messages:   history,
      max_tokens: 1024,
      _route:     '/api/agent (managed)',
    });

    responseText = getTextFromResponse(data);
  } catch (err) {
    const dur = Date.now() - t0;
    logLLMRequest({
      provider:   'llm',
      route:      '/api/agent (managed)',
      model:      LLM_MODEL,
      durationMs: dur,
      status:     'error',
      error:      err.message,
    }).catch(() => {});
    throw err;
  }

  history.push({ role: 'assistant', content: responseText });

  onEvent({
    type:    'assistant.message',
    content: [{ type: 'text', text: responseText }],
  });

  onEvent({ type: 'session.status_idle' });
}
