import { useState } from 'react';
import { useCore, S } from '../state';
import { clearTrace } from '../trace';

// Agent trace tab: each turn (an advisor message or a button press) with its model calls, tool
// calls and the rules behind each recommendation, newest first. Read-only; data from trace.js.

const KIND = {
  model: { tag: 'adv', label: 'Model' },
  tool: { tag: 'high', label: 'Tool' },
  rule: { tag: 'med', label: 'Rule' },
  note: { tag: 'low', label: 'Note' },
};
const SOURCE = { agent: 'Agent', scripted: 'Scripted', ui: 'Button' };
const FILTERS = [['all', 'All'], ['model', 'Model'], ['tool', 'Tools'], ['rule', 'Rules']];

const clock = ms => new Date(ms).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });

function Step({ s }) {
  const k = KIND[s.kind] || KIND.note;
  const { rule, ...rest } = s.data && typeof s.data === 'object' && !Array.isArray(s.data) ? s.data : { _: s.data };
  const detail = rest._ === undefined ? rest : rest._;
  const hasDetail = detail !== null && !(typeof detail === 'object' && !Object.keys(detail).length);
  return (
    <li className="tr-step">
      <div className="tr-row">
        <span className={'tag ' + k.tag}>{k.label}</span>
        <b>{s.title}</b>
        <span className="small muted mono tr-t">+{s.t} ms</span>
      </div>
      {s.summary && <div className="small tr-sum">{s.summary}</div>}
      {rule && <div className="small tr-rule"><b>Rule:</b> {rule}</div>}
      {hasDetail && (
        <details className="tr-detail">
          <summary className="small muted">Details</summary>
          <pre className="mono">{JSON.stringify(detail, null, 2)}</pre>
        </details>
      )}
    </li>
  );
}

function Turn({ turn, filter, open }) {
  const steps = filter === 'all' ? turn.steps : turn.steps.filter(s => s.kind === filter);
  const counts = ['model', 'tool', 'rule'].map(k => [k, turn.steps.filter(s => s.kind === k).length]).filter(([, n]) => n);
  return (
    <details className="card tr-turn" open={open}>
      <summary>
        <span className="small muted mono">{clock(turn.at)}</span>
        <span className="tag low">{SOURCE[turn.source] || turn.source}</span>
        <span className="tr-title">{turn.text || '(no text)'}</span>
        <span className="small muted mono tr-meta">
          {counts.map(([k, n]) => n + ' ' + (KIND[k].label.toLowerCase() + (n > 1 ? 's' : ''))).join(' · ') || 'no steps'}
          {turn.ms !== null ? ' · ' + turn.ms + ' ms' : ' · running'}
        </span>
      </summary>
      {turn.langfuse && (
        <p className="small muted tr-lf">Langfuse: session <span className="mono">{turn.langfuse.sessionId}</span>{turn.langfuse.turnId && <> · turnId <span className="mono">{turn.langfuse.turnId}</span></>}</p>
      )}
      {steps.length ? <ol className="tr-steps">{steps.map((s, i) => <Step key={i} s={s} />)}</ol>
        : <p className="small muted">No {filter === 'all' ? '' : FILTERS.find(f => f[0] === filter)[1].toLowerCase() + ' '}steps in this turn.</p>}
    </details>
  );
}

export default function TracePanel() {
  useCore();
  const [filter, setFilter] = useState('all');
  const [copied, setCopied] = useState(false);
  const turns = S.trace ? S.trace.turns : [];
  const copy = async () => {
    try { await navigator.clipboard.writeText(JSON.stringify(turns, null, 2)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) { /* clipboard blocked */ }
  };
  return (
    <section className="panel tr-panel" aria-label="Agent trace">
      <div className="tr-head">
        <div>
          <div className="label">Agent trace</div>
          <p className="small muted" style={{ margin: '4px 0 0' }}>Every turn on the repair order: model calls, tool calls, and the rules behind each recommendation. Newest first, last 40 turns, this session only.</p>
        </div>
        <div className="tr-actions">
          <div className="seg" role="group" aria-label="Show">
            {FILTERS.map(([k, l]) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
          </div>
          <button className="btn sm" onClick={copy} disabled={!turns.length}>{copied ? 'Copied' : 'Copy JSON'}</button>
          <button className="btn sm" onClick={clearTrace} disabled={!turns.length}>Clear</button>
        </div>
      </div>
      {turns.length
        ? turns.map((t, i) => <Turn key={t.id} turn={t} filter={filter} open={i === 0} />)
        : <p className="small muted">Nothing traced yet. Work a repair order in the Repair order tab and each message or button press shows up here.</p>}
    </section>
  );
}
