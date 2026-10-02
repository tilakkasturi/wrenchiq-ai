// The repair order agent loop. The model (Gemma, via the server) reads what the advisor said and the
// repair order snapshot, calls tools, and answers. The tools in roTools.js run here against the same
// state the rest of the UI shows, so the cards and the panel stay in step with what the agent did.
import { S, notify, newId } from './state';
import { trace, markAgentTurn } from './trace';
import { prompt } from '../services/promptLoader';
import { agentStep } from './agentApi';
import { TOOL_SCHEMAS, TOOLS, toolLabel } from './roTools';
import { ITEM, hrs, rate, miles, combinationsFor } from './logic';
import { talkFor } from './talkTrack';
import { combosOf } from './laborRules';
import { flow } from './recommend';
import { settingOption, orderAddOns } from './shopSettings';
import { sleep, REDUCED } from './chat';

const MAX_STEPS = 6;
const CLAIMS_ADD = /\b(i(?:'ve| have)?|we(?:'ve| have)?)\s+(?:also\s+)?(?:added|put|thrown|included|swapped|replaced)\b|\b(?:added|is now on|are now on)\s+(?:it\s+)?(?:to\s+)?the\s+(?:repair\s+)?order\b/i;

const TOOL_NAMES = new Set(TOOL_SCHEMAS.map(t => t.function.name));
/** Pull "[tool_name {args}]" calls out of reply text; args may have unquoted keys. */
export function textToolCalls(content) {
  const calls = [];
  const rest = String(content || '').replace(/\[\s*([a-z_]+)\s*(\{[^\]]*\})?\s*\]/g, (all, name, args) => {
    if (!TOOL_NAMES.has(name)) return all;
    let a = {};
    if (args) {
      try { a = JSON.parse(args.replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"')); } catch (_) { return all; }
    }
    calls.push({ id: 'text-' + calls.length + '-' + Date.now(), type: 'function', function: { name, arguments: JSON.stringify(a) } });
    return '';
  }).trim();
  return { calls, rest };
}

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
    // add-on labor the advisor can still offer, with the customer talk track from the labor guide
    // ones already on the order are listed too, so "what do I tell the customer" still has the line
    laborPresentation: settingOption('labor.presentation').say,
    addOns: [...R.accepted].flatMap(id => orderAddOns([...combosOf(id).filter(c => R.accepted.has(c)), ...combinationsFor(id)]).map(c => {
      const tk = talkFor(c, id, rate());
      return tk && { id: c, for: ITEM(id).name, name: ITEM(c).name, hours: ITEM(c).hours.toFixed(1), kind: tk.label, say: tk.text, onOrder: R.accepted.has(c) };
    })).filter(Boolean).slice(0, 10),
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
  const hist = S.ro.agent.history, sessionId = S.ro.agent.sessionId, turnId = newId();
  markAgentTurn(turnId);
  hist.push({ role: 'user', content: userText });
  const turn = [];
  let stop = C.typing(), added = false, nudged = false;
  try {
    for (let step = 1; step <= MAX_STEPS; step++) {
      const req = () => agentStep({ messages: [...hist.slice(-10), ...turn], context: roContext(), tools: TOOL_SCHEMAS, trace: { sessionId, turnId, step } });
      const t0 = Date.now();
      let out = await req();
      // one retry on a dropped connection before falling back to the scripted rules
      if (!out.ok && step === 1) { trace('note', 'Retry', out.message); await sleep(REDUCED ? 0 : 800); out = await req(); }
      if (!out.ok) {
        trace('model', 'Model step ' + step, 'Failed: ' + out.message + (step === 1 ? ' · falling back to the scripted rules' : ''), { step, error: out.message, roundTripMs: Date.now() - t0 });
        stop();
        if (step === 1) { hist.pop(); return { ok: false, message: out.message }; }
        await C.agent(out.message);
        return { ok: true };
      }
      S.ro.agent.model = out.model || S.ro.agent.model;
      const msg = out.message;
      // Gemma sometimes writes a call as text in the prompt's example style, e.g.
      // [add_repair_line {id: "syn-vc-plugs"}]. Run those as real calls instead of showing them.
      if (!(msg.tool_calls || []).length) {
        const tc = textToolCalls(msg.content);
        if (tc.calls.length) { msg.tool_calls = tc.calls; msg.content = tc.rest || null; }
      }
      const calls = msg.tool_calls || [];
      trace('model', 'Model step ' + step, (calls.length ? 'Calls ' + calls.map(c => c.function?.name).join(', ') : 'Answers') + ' · ' + (out.model || 'model') + ' · ' + (out.durationMs ?? Date.now() - t0) + ' ms',
        { step, model: out.model, finish_reason: out.finish_reason, modelMs: out.durationMs, roundTripMs: Date.now() - t0, context: step === 1 ? roContext() : undefined,
          content: msg.content || null, tool_calls: calls.map(c => ({ name: c.function?.name, arguments: c.function?.arguments })) });

      // The model must not claim a change it did not make: if it says it added something but no
      // add_repair_line call succeeded this turn, send it back once to make the call or correct itself.
      if (!calls.length && !added && CLAIMS_ADD.test(msg.content || '')) {
        trace('note', 'Self-check', nudged ? 'Still claimed a change it did not make; reply replaced' : 'Reply claimed a line was added without a successful add_repair_line; sent back once');
        if (!nudged) {
          nudged = true;
          turn.push({ role: 'assistant', content: msg.content });
          turn.push({ role: 'user', content: prompt('core-ro-agent-claim-check') });
          continue;
        }
        // still claiming a change that did not happen: never show that as fact
        msg.content = 'Nothing was added yet. Press Add on the card, or tell me the job again.';
      }
      if (!calls.length) {
        stop();
        const reply = parseReply(msg.content), { text } = reply;
        // before recommendations the app's question card does the asking; the model's own options are dropped
        const asking = !flow().shown && S.ro.symptom.trim();
        const options = asking ? [] : reply.options, why = asking ? '' : reply.why;
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
        const tt = Date.now();
        try {
          result = TOOLS[name] ? await TOOLS[name](args, C) : { error: 'Unknown tool: ' + name };
        } catch (err) {
          result = { error: 'tool failed: ' + err.message };
        }
        trace('tool', name + (label ? ' · ' + label : ''), result && result.error ? 'Error: ' + (result.message || result.error) : (result && result.result ? result.result + ' · ' : 'OK · ') + (Date.now() - tt) + ' ms', { arguments: args, result, ms: Date.now() - tt });
        if (name === 'add_repair_line' && result && result.result && result.result !== 'not_added') added = true;
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
