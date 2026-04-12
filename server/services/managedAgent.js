/**
 * WrenchIQ — Managed Agent Service
 *
 * Wraps Anthropic's Managed Agents API (beta).
 * Handles agent + environment bootstrapping (created once, reused) and
 * per-conversation session lifecycle.
 *
 * Beta header: anthropic-beta: managed-agents-2026-04-01
 */

import Anthropic from '@anthropic-ai/sdk';
import { CLAUDE_API_KEY, CLAUDE_MODEL_AGENT } from '../config.js';

const client = new Anthropic({
  apiKey: CLAUDE_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'managed-agents-2026-04-01',
  },
});

// ── Singleton bootstrap ───────────────────────────────────────────────────────
// Agent definition and environment are created once and reused across sessions.
let _agentId = null;
let _envId   = null;

async function bootstrap() {
  if (_agentId && _envId) return { agentId: _agentId, envId: _envId };

  // Reuse an existing active agent if one exists, otherwise create a new one
  const existing = await client.beta.agents.list();
  const active = existing.data.find(a => !a.archived);

  let agent;
  if (active) {
    agent = active;
    console.log(`[managedAgent] Reusing agent: ${agent.id}`);
  } else {
    agent = await client.beta.agents.create({
      name:   'WrenchIQ Shop Assistant',
      model:  CLAUDE_MODEL_AGENT,
      system: [
        'You are WrenchIQ, an AI-powered shop management assistant for Peninsula Precision Auto.',
        'You help service advisors, technicians, and shop owners with:',
        '  - Analyzing repair orders and technician efficiency',
        '  - Diagnosing vehicle issues using DTCs and TSBs',
        '  - Generating 3C (Concern / Cause / Correction) service narratives',
        '  - Identifying upsell and revenue opportunities',
        '  - Answering questions about shop performance metrics',
        'Be concise, precise, and professional. Always prioritize vehicle safety.',
      ].join('\n'),
      tools: [{ type: 'agent_toolset_20260401' }],
    });
    console.log(`[managedAgent] Agent created: ${agent.id}`);
  }

  _agentId = agent.id;

  // Reuse an existing environment if one exists, otherwise create a new one
  const existingEnvs = await client.beta.environments.list();
  let env;
  if (existingEnvs.data.length > 0) {
    env = existingEnvs.data[0];
    console.log(`[managedAgent] Reusing environment: ${env.id}`);
  } else {
    env = await client.beta.environments.create({
      name:   'wrenchiq-env',
      config: {
        type:       'cloud',
        networking: { type: 'unrestricted' },
      },
    });
    console.log(`[managedAgent] Environment created: ${env.id}`);
  }

  _envId = env.id;

  return { agentId: _agentId, envId: _envId };
}

// ── Session management ────────────────────────────────────────────────────────

/**
 * Create a new agent session for a conversation.
 * Returns { sessionId }.
 */
export async function createSession(title = 'WrenchIQ Session') {
  const { agentId, envId } = await bootstrap();

  const session = await client.beta.sessions.create({
    agent:          agentId,
    environment_id: envId,
    title,
  });

  console.log(`[managedAgent] Session created: ${session.id}`);
  return { sessionId: session.id };
}

/**
 * Send a user message to an existing session and stream events back.
 * Calls onEvent(event) for each SSE event from the agent.
 * Resolves when the agent reaches idle state.
 */
export async function streamMessage(sessionId, message, onEvent) {
  // Open the SSE stream (await resolves the APIPromise → Stream object)
  const stream = await client.beta.sessions.events.stream(sessionId);

  await client.beta.sessions.events.send(sessionId, {
    events: [
      {
        type:    'user.message',
        content: [{ type: 'text', text: message }],
      },
    ],
  });

  for await (const event of stream) {
    onEvent(event);

    // Agent finished its turn
    if (event.type === 'session.status_idle') {
      break;
    }
  }
}

/**
 * Get the current Anthropic client (for advanced usage).
 */
export { client };
