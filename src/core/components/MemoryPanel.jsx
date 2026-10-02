import { useCore, S } from '../state';
import { FIXED, PQ, SHOP } from '../data';
import { forgetFact, resetProfile } from '../harness';
import { useFlash } from './useFlash';

function Row({ k, label, f, fixed }) {
  const flash = useFlash(f && f.at);
  return (
    <li className={flash ? 'flash' : ''}>
      <div>
        <div className="k">{label}</div>
        <div className="v">{f ? f.display : ''}</div>
      </div>
      {fixed
        ? <span className="small muted">Set by WrenchIQ</span>
        : <button className="btn ghost sm" onClick={() => forgetFact(k)} aria-label={'Remove ' + label}>Remove</button>}
    </li>
  );
}

/** Shop memory: the shop itself, then whatever the advisor has told the assistant about how it runs. */
export default function MemoryPanel() {
  useCore();
  const prefs = PQ.filter(q => S.profile[q.key]).map(q => ({ k: q.key, label: q.label }));
  const notes = Object.keys(S.profile).filter(k => k.startsWith('note.')).sort().map(k => ({ k, label: 'Note' }));
  const mine = prefs.concat(notes);
  return (
    <aside className="panel side" aria-label="Shop memory">
      <div className="head">
        <h2 className="label">Shop profile</h2>
        <span className="live">Live</span>
        {mine.length > 0 && <button className="btn sm" onClick={resetProfile}>Clear mine</button>}
      </div>
      <p className="small muted" style={{ margin: '0 0 6px' }}>
        Stored in shop memory for <span className="mono">{SHOP.shopId}</span>. It shapes drafts and pricing; hours always come from the labor guide.
      </p>
      <ul className="mem">
        {FIXED.map(f => <Row key={f.key} k={f.key} label={f.label} f={S.profile[f.key] || { display: f.value }} fixed />)}
        {mine.map(m => <Row key={m.k} k={m.k} label={m.label} f={S.profile[m.k]} />)}
      </ul>
      {!mine.length && <p className="small muted" style={{ marginTop: 8 }}>Nothing else yet. Tell me about your shop in the chat, like your labor rate or work you never take.</p>}
    </aside>
  );
}
