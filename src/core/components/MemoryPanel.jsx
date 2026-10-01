import { useCore, S } from '../state';
import { PQ } from '../data';
import { editFact, resetProfile } from '../harness';
import { useFlash } from './useFlash';

function Row({ q }) {
  const f = S.profile[q.key];
  const flash = useFlash(f && f.at);
  return (
    <li className={flash ? 'flash' : ''}>
      <div>
        <div className="k">{q.key}</div>
        <div className={'v' + (f ? '' : ' none')}>{q.label}: {f ? f.display : S.skipped.has(q.key) ? 'Skipped' : 'Not set'}</div>
      </div>
      <button className="btn sm" onClick={() => editFact(q.key)}>{f ? 'Change' : 'Answer'}</button>
    </li>
  );
}

export default function MemoryPanel() {
  useCore();
  return (
    <aside className="panel side" aria-label="Shop memory">
      <div className="head">
        <h2 className="label">Stored in shop memory</h2>
        <span className="live">Live</span>
        <button className="btn sm" onClick={resetProfile}>Clear all</button>
      </div>
      <p className="small muted" style={{ margin: '0 0 6px' }}>
        Tenant: <span className="mono">demo-shop</span> (sample). These facts shape drafts and pricing. Hours always come from the labor guide.
      </p>
      <ul className="mem">{PQ.map(q => <Row key={q.key} q={q} />)}</ul>
    </aside>
  );
}
