// Agent trace for the Core assistant: what happened on each turn and why. A turn is one advisor
// message or one button press. Its steps are the model calls (agent mode), the tool calls with
// their arguments and results, and the rules behind each recommendation (labor-guide ranking,
// labor guardrails, add-on selection, the shop's parts pick, per-cylinder quantities, maintenance
// schedule, follow-up questions). Kept in the session store, newest first, for the Agent trace tab.
import { S, notify, newId } from './state';

const MAX_TURNS = 40;

if (!S.trace) S.trace = { turns: [], open: null };

/** Start a turn. The previous one, if still open, is closed. */
export function beginTurn(source, text) {
  const T = S.trace;
  if (T.open) endTurn(T.open);
  const turn = {
    id: newId(), at: Date.now(), source, text: String(text || ''), steps: [], ms: null,
    // the ids the server tags its Langfuse traces with, to find this turn there
    langfuse: source === 'agent' ? { sessionId: S.ro.agent.sessionId, turnId: null } : null,
  };
  T.turns.unshift(turn);
  if (T.turns.length > MAX_TURNS) T.turns.length = MAX_TURNS;
  T.open = turn;
  notify();
  return turn;
}

export function endTurn(turn = S.trace.open) {
  if (!turn) return;
  if (turn.ms === null) turn.ms = Date.now() - turn.at;
  if (S.trace.open === turn) S.trace.open = null;
  notify();
}

/** Mark the open turn as answered by the agent, with the Langfuse turn id it was sent under. */
export function markAgentTurn(turnId) {
  const t = S.trace.open;
  if (!t) return;
  t.source = 'agent';
  t.langfuse = { sessionId: S.ro.agent.sessionId, turnId };
}

/**
 * Add a step to the open turn, or to a new 'ui' turn when nothing is open (a button press).
 * kind: 'model' | 'tool' | 'rule' | 'note'. summary is the one line shown collapsed; data is the detail.
 */
export function trace(kind, title, summary, data) {
  const own = !S.trace.open; // nothing open: this step is its own turn, closed right away
  const turn = S.trace.open || beginTurn('ui', title);
  turn.steps.push({ kind, title, summary: summary || '', data: data === undefined ? null : clone(data), t: Date.now() - turn.at });
  if (own) endTurn(turn); else notify();
}

export function clearTrace() {
  S.trace.turns = [];
  S.trace.open = null;
  notify();
}

// Snapshot, so later edits to the repair order do not rewrite what the trace showed at the time.
function clone(x) {
  try { return JSON.parse(JSON.stringify(x, (_k, v) => (v instanceof Set ? [...v] : v))); } catch (_) { return String(x); }
}
