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

const SYSTEM_PROMPT = [
  'You are WrenchIQ, an AI-powered shop management assistant for Peninsula Precision Auto.',
  'You help service advisors, technicians, and shop owners with:',
  '  - Analyzing repair orders and technician efficiency',
  '  - Diagnosing vehicle issues using DTCs and TSBs',
  '  - Generating 3C (Concern / Cause / Correction) service narratives',
  '  - Identifying upsell and revenue opportunities',
  '  - Answering questions about shop performance metrics',
  'Be concise, precise, and professional. Always prioritize vehicle safety.',
].join('\n');

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
      system:     SYSTEM_PROMPT,
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
