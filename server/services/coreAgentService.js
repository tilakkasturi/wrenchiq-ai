/**
 * WrenchIQ — Core repair order agent (server side).
 *
 * One model call per request. The browser owns the repair order and runs the tools (vehicle,
 * concern, labor guide ranking, maintenance, NAPA lookup) against it; this file holds what must
 * stay on the server: the tool allowlist, assembling the prompt (its wording is in /prompts:
 * core-ro-agent-system, -examples, -context, -rows) and the call to the shared LLM gateway.
 *
 * Tracing: with LANGFUSE_ENABLED each step is one Langfuse trace (tag core-ro-agent). The browser
 * sends a per-repair-order sessionId and a per-advisor-message turnId, so a whole conversation
 * reads as one Langfuse session and the steps of one turn share a turnId. LangChain engine only,
 * like the RO Advisor; a tracing failure never fails the step.
 */

import { prompt, promptSection } from './promptLoader.js';

/** Gemma can emit its thinking-channel markers in the visible text; drop them. */
export const cleanText = t => String(t || '').replace(/<\|channel>[\s\S]*?<channel\|>/g, '').replace(/<\|?channel\|?>/g, '').trim();

export const RO_TOOL_NAMES = ['update_vehicle', 'set_concern', 'rank_repairs', 'get_maintenance_due', 'add_repair_line', 'search_napa_parts'];

/** System prompt for one step: role and rules, worked examples, then this turn's repair order (all in /prompts). */
export function buildRoPrompt(context = {}) {
  const v = context.vehicle || {};
  const rows = (key, list) => list.map(x => promptSection('core-ro-agent-rows', key, x)).join('\n');
  const addOns = (Array.isArray(context.addOns) ? context.addOns : []).slice(0, 10)
    .map(a => ({ id: clip(a.id, 60), name: clip(a.name, 120), for: clip(a.for, 120), hours: clip(a.hours, 6), kind: clip(a.kind, 30), onOrder: !!a.onOrder, say: clip(a.say, 600) }));
  const snapshot = prompt('core-ro-agent-context', {
    vehicle: [v.year, v.make, v.model, v.engine].filter(Boolean).join(' '),
    mileage: v.mileage || '', vin: v.vin || '',
    concern: context.concern || '',
    answers: Object.entries(context.answers || {}).map(([k, a]) => `${k}=${a}`).join(', '),
    lines: rows('line', (context.lines || []).map(l => ({ name: l.name, hours: l.hours, source: l.source }))),
    parts: rows('part', (context.parts || []).map(p => ({ label: p.label, partNumber: p.partNumber, qty: p.qty }))),
    laborRate: context.laborRate || '',
    addOns: rows('add_on', addOns),
    laborPresentation: clip(context.laborPresentation, 400),
  });
  return prompt('core-ro-agent-system') + '\n\n' + prompt('core-ro-agent-examples') + '\n\n' + snapshot;
}

const clip = (s, n) => String(s ?? '').slice(0, n);

/** System prompt for writing customer talk tracks (prompts/core-talk-track.md); validated in the browser. */
export function buildTalkPrompt(context = {}) {
  const tracks = (Array.isArray(context.tracks) ? context.tracks : []).slice(0, 20)
    .map(t => ({ id: clip(t.id, 80), kind: clip(t.kind, 60), facts: t.facts && typeof t.facts === 'object' ? t.facts : {}, reference: clip(t.reference, 1500) }));
  return prompt('core-talk-track', { tracks: clip(JSON.stringify(tracks, null, 1), 24000) });
}

/** System prompt for the Shop profile chat: how the assistant works and what is set up (prompts/core-shop-profile-system.md). */
export function buildProfilePrompt(context = {}) {
  const list = (a, n) => (Array.isArray(a) ? a : []).slice(0, n);
  return prompt('core-shop-profile-system', {
    shop: clip(context.shop, 200),
    supplier: clip(context.supplier, 60),
    settings: list(context.settings, 12).map(x => `- ${clip(x.label, 60)}: ${clip(x.value, 120)}${x.say ? ' — ' + clip(x.say, 400) : ''}`).join('\n'),
    facts: list(context.facts, 30).map(x => `- ${clip(x.label, 60)}: ${clip(x.value, 300)}`).join('\n'),
    knowledge: list(context.knowledge, 12).map(x => `## ${clip(x.title, 80)}\n${clip(x.answer, 1500)}`).join('\n\n'),
  });
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || !messages.length) throw new Error('messages is required');
  const out = messages.slice(-30).map(m => {
    if (m.role === 'user' || m.role === 'assistant' || m.role === 'tool') {
      const base = { role: m.role, content: m.content === null ? null : clip(m.content, 8000) };
      if (m.role === 'assistant' && Array.isArray(m.tool_calls)) base.tool_calls = m.tool_calls.slice(0, 6).map(tc => ({ id: clip(tc.id, 80), type: 'function', function: { name: clip(tc.function?.name, 60), arguments: clip(tc.function?.arguments, 2000) } }));
      if (m.role === 'tool') base.tool_call_id = clip(m.tool_call_id, 80);
      return base;
    }
    throw new Error('bad message role');
  });
  return out;
}

/**
 * @param {{messages: object[], context?: object, tools: object[], trace?: {sessionId?: string, turnId?: string, step?: number}}} input
 * @param {{llm?: Function, traced?: Function}} [deps]
 */
export async function runCoreStep({ messages, context, tools, trace }, deps = {}) {
  const llm = deps.llm || (await import('./azureOpenAI.js')).callAzureOpenAI;
  // the Shop profile chat answers questions about the assistant: its own prompt, no tools
  const profile = context && context.mode === 'profile';
  const talk = context && context.mode === 'talk'; // customer talk tracks, checked by the browser before use
  const allowed = profile || talk ? [] : (Array.isArray(tools) ? tools : []).filter(t => RO_TOOL_NAMES.includes(t?.function?.name));
  const safeMessages = sanitizeMessages(messages);
  const traced = deps.traced || (await import('./langfuseTracing.js')).withLangfuseTrace;
  const t = trace && typeof trace === 'object' ? trace : {}, v = context?.vehicle || {};
  const t0 = Date.now();
  const data = await traced({
    tags: [talk ? 'core-talk-track' : profile ? 'core-shop-profile' : 'core-ro-agent'],
    traceName: talk ? 'core-talk-track-step' : profile ? 'core-shop-profile-step' : 'core-ro-agent-step',
    sessionId: t.sessionId ? clip(t.sessionId, 80) : undefined,
    metadata: {
      turnId: t.turnId ? clip(t.turnId, 80) : undefined,
      step: Number.isInteger(t.step) ? t.step : undefined,
      vehicle: [v.year, v.make, v.model].filter(Boolean).join(' '),
    },
  }, callbacks => llm({
    system: talk ? buildTalkPrompt(context) : profile ? buildProfilePrompt(context) : buildRoPrompt(context),
    messages: safeMessages,
    ...(allowed.length ? { tools: allowed } : {}),
    ...(callbacks ? { callbacks } : {}),
    max_tokens: talk ? 2500 : 700,
    temperature: talk ? 0.3 : 0.2,
    _route: talk ? 'core-talk-track' : profile ? 'core-shop-profile' : 'core-ro-agent',
  }));
  const choice = data.choices?.[0], msg = choice?.message || {};
  return {
    message: { content: cleanText(msg.content), tool_calls: msg.tool_calls || [] },
    finish_reason: choice?.finish_reason,
    model: data.model || '',
    durationMs: Date.now() - t0,
  };
}
