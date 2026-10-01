// The repair order agent loop. The model (Gemma, via the server) reads what the advisor said and the
// repair order snapshot, calls tools, and answers. The tools in roTools.js run here against the same
// state the rest of the UI shows, so the cards and the panel stay in step with what the agent did.
import { S, notify } from './state';
import { agentStep } from './agentApi';
import { TOOL_SCHEMAS, TOOLS, toolLabel } from './roTools';
import { ITEM, hrs, rate, miles } from './logic';
import { sleep, REDUCED } from './chat';

const MAX_STEPS = 6;

/** What the model sees of the repair order at the start of each turn. */
export function roContext() {
  const R = S.ro;
  return {
    vehicle: { year: R.year, make: R.make, model: R.model, engine: R.engine, mileage: miles() || '', vin: R.vin },
    concern: R.symptom,
    answers: R.answers,
    lines: [...R.accepted].map(ITEM).filter(Boolean).map(it => ({ name: it.name, hours: hrs(it).toFixed(1), source: it.src === 'lg' ? 'labor guide ' + it.ref : it.src === 'sm' ? 'schedule ' + it.ref : 'entered by advisor' })),
    parts: R.parts.added.map(x => ({ label: x.label, partNumber: x.lineCode + ' ' + x.partNumber, qty: x.qty })),
    laborRate: rate(),
  };
}

/** Pull the OPTIONS and WHY lines off the end of a reply. */
export function parseReply(raw) {
  let options = [], why = '';
  const keep = [];
  String(raw || '').split('\n').forEach(line => {
    const o = line.match(/^\s*OPTIONS\s*:\s*(.+)$/i), w = line.match(/^\s*WHY\s*:\s*(.+)$/i);
    if (o) options = o[1].split('|').map(s => s.trim()).filter(Boolean).slice(0, 5);
    else if (w) why = w[1].trim();
    else keep.push(line);
  });
  return { text: keep.join('\n').trim(), options, why };
}

/**
 * Run one advisor message through the agent.
 * @returns {Promise<{ok:boolean, message?:string}>} ok:false only if the model could not be reached
 *   on the first step, so the caller can fall back to the scripted flow.
 */
export async function runRoAgent(C, userText) {
  const hist = S.ro.agent.history;
  hist.push({ role: 'user', content: userText });
  const turn = [];
  let stop = C.typing();
  try {
    for (let step = 1; step <= MAX_STEPS; step++) {
      const out = await agentStep({ messages: [...hist.slice(-10), ...turn], context: roContext(), tools: TOOL_SCHEMAS });
      if (!out.ok) {
        stop();
        if (step === 1) { hist.pop(); return { ok: false, message: out.message }; }
        await C.agent(out.message);
        return { ok: true };
      }
      S.ro.agent.model = out.model || S.ro.agent.model;
      const msg = out.message, calls = msg.tool_calls || [];

      if (!calls.length) {
        stop();
        const { text, options, why } = parseReply(msg.content);
        const shown = text || 'I did not get that. Tell me the vehicle and what the customer is describing.';
        await C.agent(shown, why ? 'Why I ask: ' + why : undefined);
        if (options.length) C.chips(options.map(o => ({ t: o, text: o })));
        hist.push({ role: 'assistant', content: shown });
        return { ok: true };
      }

      turn.push({ role: 'assistant', content: msg.content || null, tool_calls: calls });
      stop();
      for (const tc of calls) {
        let args = {};
        try { args = JSON.parse(tc.function?.arguments || '{}'); } catch (_) { /* bad JSON from the model; the tool will report what is missing */ }
        const name = tc.function?.name;
        const label = toolLabel(name, args);
        C.event('Tool · ' + name + (label ? ' · ' + label : ''));
        let result;
        try {
          result = TOOLS[name] ? await TOOLS[name](args, C) : { error: 'Unknown tool: ' + name };
        } catch (err) {
          result = { error: 'tool failed: ' + err.message };
        }
        turn.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        await sleep(REDUCED ? 0 : 200);
      }
      stop = C.typing();
    }
    stop();
    await C.agent('I looked into that but could not finish. Try asking one thing at a time.');
    return { ok: true };
  } finally {
    notify();
  }
}
