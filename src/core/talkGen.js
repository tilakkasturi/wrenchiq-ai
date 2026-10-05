// Customer talk tracks written by the model, checked by code, with the template wording as the
// fallback. The model gets each talk track's facts (from the same data the templates use) and the
// template text as a reference, and returns one text per track (prompt: prompts/core-talk-track.md).
// Every text is validated before it is shown:
//   - every number and price in it appears in that track's facts or reference (nothing invented);
//   - no banned wording ("labor guide", promises, obligations);
//   - it keeps the required points (approval or choice; inspection for a repair; estimate when priced);
//   - a sensible length;
//   - the source line is set here: whatever source the model wrote is removed and the right one
//     appended, so a provider is never misattributed.
// A track that fails, or a call that fails, shows the template text. Results are cached by facts,
// so a track is regenerated only when what it says would change.
import { S, notify } from './state';
import { agentStep } from './agentApi';
import { trace } from './trace';

const cache = new Map();   // facts key -> { text, ok, problems }
const inflight = new Set(); // batch keys being generated

const keyOf = t => t.id + '|' + JSON.stringify(t.facts) + '|' + t.reference;

const BANNED = [
  [/labou?r guide/i, 'says "labor guide"'],
  [/\bguarantee/i, 'promises a guarantee'],
  [/\bwill (fail|break|leave you|not stop|ruin)/i, 'predicts a failure'],
  [/\bsaves? you\b/i, 'promises a saving'],
  [/\b(must|need to|needs to|have to|has to|required to)\b/i, 'states an obligation'],
  [/\b(definitely|certainly|for sure|100%|always fixes)\b/i, 'overstates certainty'],
  [/\bthe problem is\b|\bthe cause is\b|\bit is (the|your) \w+ that\b/i, 'states a diagnosis'],
];

/** The numbers in a text, normalized: "$1,250" -> "1250", "0.40" -> "0.4". */
const numbersIn = s => (String(s).match(/\d[\d,]*(?:\.\d+)?/g) || []).map(n => String(parseFloat(n.replace(/,/g, ''))));

/** Remove any source line the model wrote; the right one is appended by code. */
const stripSource = s => String(s).replace(/\s*\((?:source|repair times|maintenance times)[^)]*\)\s*\.?/gi, ' ').replace(/\s+/g, ' ').trim();

/**
 * Check one generated text against its track. Returns { ok, text, problems }: text has the
 * source line set by code; problems lists every check that failed.
 */
export function validateTalk(track, raw) {
  const problems = [];
  let text = stripSource(raw);
  if (text.length < 40) problems.push('too short');
  if (text.length > 1200) problems.push('too long');
  const allowed = new Set(numbersIn(JSON.stringify(track.facts) + ' ' + track.reference));
  const extra = numbersIn(text).filter(n => !allowed.has(n));
  if (extra.length) problems.push('numbers not in the facts: ' + [...new Set(extra)].join(', '));
  BANNED.forEach(([rx, why]) => { if (rx.test(text)) problems.push(why); });
  if (/mitchell/i.test(text)) problems.push('names a provider outside the source line');
  (track.require || []).forEach(([rx, why]) => { if (!new RegExp(rx, 'i').test(text)) problems.push('missing: ' + why); });
  if (track.source) text = text.replace(/\s*$/, '') + ' ' + track.source;
  return { ok: problems.length === 0, text, problems };
}

/** The checked model text for a track, or its template text. */
export function talkText(track) {
  const hit = track && cache.get(keyOf(track));
  return hit && hit.ok ? hit.text : track ? track.reference + (track.source ? ' ' + track.source : '') : '';
}
/** 'checked' (model text passed every check), 'template' (fallback), or 'pending' (being written). */
export function talkState(track) {
  if (!track) return 'template';
  const hit = cache.get(keyOf(track));
  if (hit) return hit.ok ? 'checked' : 'template';
  return inflight.size ? 'pending' : 'template';
}

/** Pull the {id: text} object out of the model reply (tolerates a code fence or prose around it). */
export function parseTracks(content) {
  const s = String(content || '');
  const m = s.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { const o = JSON.parse(m[0]); return o && typeof o === 'object' ? (o.tracks && typeof o.tracks === 'object' ? o.tracks : o) : null; } catch (_) { return null; }
}

/**
 * Ask the model for every track not cached yet (one call), validate each, cache the result.
 * Agent mode only; scripted mode and failures keep the template text.
 */
export async function generateTalk(tracks) {
  if (!S.useAgent) return;
  const todo = tracks.filter(t => t && !cache.has(keyOf(t)));
  if (!todo.length) return;
  const batch = todo.map(keyOf).join('\n');
  if (inflight.has(batch)) return;
  inflight.add(batch);
  notify();
  try {
    const out = await agentStep({
      messages: [{ role: 'user', content: 'Write the customer talk tracks for these ' + todo.length + ' items.' }],
      context: { mode: 'talk', tracks: todo.map(t => ({ id: t.id, kind: t.kind, facts: t.facts, reference: t.reference })) },
      tools: [],
    });
    const got = out.ok ? parseTracks(out.message && out.message.content) : null;
    const results = todo.map(t => {
      const raw = got && got[t.id];
      const r = raw ? validateTalk(t, raw) : { ok: false, text: '', problems: [out.ok ? 'no text for this item' : 'model unavailable'] };
      cache.set(keyOf(t), r);
      return { id: t.id, ok: r.ok, problems: r.problems };
    });
    trace('rule', 'Talk tracks (model, checked)', results.filter(r => r.ok).length + ' of ' + results.length + ' passed; the rest use standard wording',
      { rule: 'Model text is shown only if every number is in the facts, no banned wording, the required points are there, and the source line is set by code (prompts/core-talk-track.md).', model: out.model, results });
  } finally {
    inflight.delete(batch);
    notify();
  }
}

export const clearTalkCache = () => cache.clear();
