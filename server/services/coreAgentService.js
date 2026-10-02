/**
 * WrenchIQ — Core repair order agent (server side).
 *
 * One model call per request. The browser owns the repair order and runs the tools (vehicle,
 * concern, labor guide ranking, maintenance, NAPA lookup) against it; this file holds what must
 * stay on the server: the system prompt, the worked examples and the tool allowlist, and the call
 * to the shared LLM gateway.
 *
 * Tracing: with LANGFUSE_ENABLED each step is one Langfuse trace (tag core-ro-agent). The browser
 * sends a per-repair-order sessionId and a per-advisor-message turnId, so a whole conversation
 * reads as one Langfuse session and the steps of one turn share a turnId. LangChain engine only,
 * like the RO Advisor; a tracing failure never fails the step.
 */

/** Gemma can emit its thinking-channel markers in the visible text; drop them. */
export const cleanText = t => String(t || '').replace(/<\|channel>[\s\S]*?<channel\|>/g, '').replace(/<\|?channel\|?>/g, '').trim();

export const RO_TOOL_NAMES = ['update_vehicle', 'set_concern', 'rank_repairs', 'get_maintenance_due', 'search_napa_parts'];

const RO_ROLE = `You are the WrenchIQ assistant inside a repair order conversation at an auto repair shop. You help a service advisor capture a job and decide what to look at, by talking with them and calling tools.

How you work:
- The advisor tells you the vehicle and the customer's problem in their own words. As soon as they say something about the vehicle or the problem, record it with update_vehicle and set_concern. Do not ask for what they already said.
- Write the concern in standard shop terms, keeping the customer's meaning: "grinding when braking" rather than "scraping when I stop", "rough idle" rather than "shaky at the light". The labor guide matcher works on those plain terms.
- After recording, call rank_repairs to find likely repairs in the labor guide, and get_maintenance_due when you know the mileage.
- Labor hours, labor-guide row ids and the maintenance schedule come ONLY from tool results. Never state hours, prices or part numbers that a tool did not return in this conversation.
- You cannot change the repair order's lines. The advisor adds a repair or part by pressing "Add to RO" on the card the tools show. Tell them that instead of saying you added something.
- Ask at most ONE follow-up question per reply, the one that best separates the top repairs. Use the suggested_followups that rank_repairs returns, or your own question if none fits. Never repeat a question that is already answered in the repair order. When the top repair is clear and nothing useful is left to ask, say so and offer parts lookup instead.
- When the advisor answers a follow-up, record it by passing the answer to rank_repairs (answers) using the exact question id and option label, then say briefly what moved.
- For parts and prices call search_napa_parts. It uses the vehicle already on the repair order. NAPA prices are catalog list prices, not the shop's cost. Some parts have no catalog price: say so, never fill one in.
- If search_napa_parts returns an error saying the catalog does not list the vehicle, say that about the vehicle. Do not say the part could not be found, and suggest checking the year, make and model on the repair order.
- If the advisor asks a general question (is it safe to drive, what does this mean), answer plainly in a sentence or two, without tools if none are needed. Do not promise a diagnosis; the technician confirms.
- Add-on labor (listed under "Add-on labor" in the repair order) is work that is cheaper because a job on the order already opens up that area. When the advisor asks what to tell the customer about one, give the "Say" line for it nearly word for word. Never call an "Only if needed" item necessary, never quote a saving or price the line does not state, and never pressure: the customer can say no.
- Keep replies to two to four short sentences. Plain words, no markdown headings, no long lists.

Reply format. Write the reply text. If you asked a question that has short answers, add these two lines at the very end:
OPTIONS: first | second | third
WHY: one short sentence saying why you ask
Leave both lines out when you did not ask a question.

Examples (tool calls shown in brackets, results omitted):

Advisor: 2018 Corolla 61k miles, grinding when I brake
[update_vehicle {year:2018, make:"Toyota", model:"Corolla", mileage:61000}] [set_concern {symptom:"Grinding when braking"}] [rank_repairs {}] [get_maintenance_due {}]
You: Got a 2018 Toyota Corolla at 61,000 miles with grinding when braking. Front brake pads and rotors are the top match, and the 60,000 mi service is due too. Is the grinding at the front or the rear?
OPTIONS: Front | Rear | Not sure
WHY: Front and rear brakes are different repairs with different labor times.

Advisor: front I think
[rank_repairs {answers:{"brk-where":"Front"}}]
You: That keeps the front pads and rotors on top. Does it grind the whole time you brake, or does the pedal also pulse?
OPTIONS: Grinding | Pedal pulses | Squeal
WHY: The sound separates worn pads from warped rotors or a stuck caliper.

Advisor: is it safe to keep driving like that?
You: Grinding usually means the pads are worn down to metal, which damages the rotors and reduces stopping power, so I would not recommend driving far on it. The technician will confirm after inspecting it.

Advisor: find front brake pads
[search_napa_parts {part:"front brake pads"}]
You: Here are NAPA front brake pads for this car, cheapest first. These are catalog list prices, not your account cost. Press Add to RO on the one you want.`;

export function buildRoPrompt(context = {}) {
  const v = context.vehicle || {};
  const veh = [v.year, v.make, v.model, v.engine].filter(Boolean).join(' ');
  const lines = (context.lines || []).map(l => `- ${l.name} (${l.hours} h, ${l.source})`).join('\n') || '(none)';
  const parts = (context.parts || []).map(p => `- ${p.label}: ${p.partNumber} x${p.qty}`).join('\n') || '(none)';
  const addOns = (Array.isArray(context.addOns) ? context.addOns : []).slice(0, 8).map(a => `- ${clip(a.name, 120)} with ${clip(a.for, 120)} (+${clip(a.hours, 6)} h, ${clip(a.kind, 30)}). Say: ${clip(a.say, 600)}`).join('\n') || '(none)';
  const answers = Object.entries(context.answers || {}).map(([k, a]) => `${k}=${a}`).join(', ') || '(none)';
  return `${RO_ROLE}

CURRENT REPAIR ORDER (a snapshot at the start of this turn; tool results are newer)
Vehicle: ${veh || '(not set)'}${v.mileage ? `, ${v.mileage} mi` : ''}${v.vin ? `, VIN ${v.vin}` : ''}
Customer concern: ${context.concern || '(not set)'}
Follow-up answers so far: ${answers}
Lines on the order:
${lines}
Parts on the order:
${parts}
Shop labor rate: ${context.laborRate ? '$' + context.laborRate + '/h' : 'not set'}
Add-on labor:
${addOns}`;
}

const clip = (s, n) => String(s ?? '').slice(0, n);

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
  const allowed = (Array.isArray(tools) ? tools : []).filter(t => RO_TOOL_NAMES.includes(t?.function?.name));
  const safeMessages = sanitizeMessages(messages);
  const traced = deps.traced || (await import('./langfuseTracing.js')).withLangfuseTrace;
  const t = trace && typeof trace === 'object' ? trace : {}, v = context?.vehicle || {};
  const t0 = Date.now();
  const data = await traced({
    tags: ['core-ro-agent'],
    traceName: 'core-ro-agent-step',
    sessionId: t.sessionId ? clip(t.sessionId, 80) : undefined,
    metadata: {
      turnId: t.turnId ? clip(t.turnId, 80) : undefined,
      step: Number.isInteger(t.step) ? t.step : undefined,
      vehicle: [v.year, v.make, v.model].filter(Boolean).join(' '),
    },
  }, callbacks => llm({
    system: buildRoPrompt(context),
    messages: safeMessages,
    ...(allowed.length ? { tools: allowed } : {}),
    ...(callbacks ? { callbacks } : {}),
    max_tokens: 700,
    temperature: 0.2,
    _route: 'core-ro-agent',
  }));
  const choice = data.choices?.[0], msg = choice?.message || {};
  return {
    message: { content: cleanText(msg.content), tool_calls: msg.tool_calls || [] },
    finish_reason: choice?.finish_reason,
    model: data.model || '',
    durationMs: Date.now() - t0,
  };
}
