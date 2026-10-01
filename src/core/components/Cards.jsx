import { S } from '../state';
import { REPMAP, MAINTMAP } from '../data';
import { hrs, rate, conf, money, partOn, vehicleOk } from '../logic';
import { acceptItem, removeItem, dismissItem, restoreItem, addAllMaint, searchPart, addPart, removePart } from '../harness';

function Cite({ it }) {
  const label = it.src === 'lg' ? 'Labor guide' : 'Scheduled maintenance';
  return (
    <details className="cite">
      <summary><b>{label}</b><span className="mono">{it.ref}</span><span className="mono">{it.hours.toFixed(1)} h</span></summary>
      <div className="cite-body">{it.detail}</div>
    </details>
  );
}

export function RepairsCard({ card }) {
  const rt = rate();
  return (
    <>
      <div className="label" style={{ marginBottom: 8 }}>{card.title}</div>
      {card.snap.map(x => {
        const it = REPMAP[x.id], on = S.ro.accepted.has(it.id), off = S.ro.dismissed.has(it.id), c = conf(x.score);
        if (off) {
          return (
            <article className="card off" key={it.id}>
              <div className="top-row"><h3>{it.name}</h3><button className="btn ghost sm" onClick={() => restoreItem(it.id)}>Undo</button></div>
              <p className="why-line">Set aside.</p>
            </article>
          );
        }
        return (
          <article className={'card' + (on ? ' on' : '')} key={it.id}>
            <div className="top-row"><h3>{it.name}</h3><span className={'tag ' + c[0]}>{c[1]}</span></div>
            {x.mv && <p className="why-line mv">{x.mv}</p>}
            <p className="why-line">Why: {x.why.slice(0, 3).join('. ')}</p>
            <Cite it={it} />
            {it.parts.length > 0 && (
              <div className="parts">
                <span>Parts:</span>
                {it.parts.map(n => (
                  <button key={n} type="button" className="pchip" disabled={!vehicleOk()}
                    title={vehicleOk() ? 'Look up NAPA price and fitment' : 'Enter year, make and model first'}
                    onClick={() => searchPart(n)}>{n} · price</button>
                ))}
              </div>
            )}
            <div className="actions">
              {on ? (
                <>
                  <button className="btn" onClick={() => removeItem(it.id)}>Remove from RO</button>
                  <span className="small muted" style={{ alignSelf: 'center' }}>On the RO{rt ? ' · ' + money(hrs(it) * rt) : ''}</span>
                </>
              ) : (
                <>
                  <button className="btn primary" onClick={() => acceptItem(it.id)}>Add to RO</button>
                  <button className="btn" onClick={() => dismissItem(it.id)}>Not this</button>
                </>
              )}
            </div>
          </article>
        );
      })}
    </>
  );
}

export function MaintCard({ card }) {
  const ms = card.ms;
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>Scheduled maintenance</div>
      <div className="card">
        <div className="top-row"><h3>{ms.at.toLocaleString()} mi service</h3><button className="btn sm" onClick={addAllMaint}>Add all due</button></div>
        <p className="why-line">{ms.note}. Sample interval table.</p>
        {ms.ids.map(id => {
          const it = MAINTMAP[id], on = S.ro.accepted.has(id);
          return (
            <div className="maint-item" key={id}>
              <div><div style={{ fontWeight: 500 }}>{it.name}</div><Cite it={it} /></div>
              <div>{on
                ? <button className="btn sm" onClick={() => removeItem(id)}>Remove</button>
                : <button className="btn sm primary" onClick={() => acceptItem(id)}>Add</button>}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function PartsCard({ card }) {
  const { res, part, qty, fit, readOnly } = card;
  const when = new Date(res.retrievedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <article className="card">
      <div className="top-row"><h3>{part.replace(/\s*\(.*?\)\s*/g, ' ').trim()}</h3><span className="tag adv">NAPA</span></div>
      <p className="why-line">Fits {fit}{qty > 1 ? ' · need ' + qty : ''} · {res.priceBasis}, retrieved {when}. Not your account cost.</p>
      {res.parts.map(row => {
        const key = row.lineCode + '|' + row.partNumber, on = partOn(key);
        return (
          <div className="pit" key={key}>
            <div>
              <div className="nm">{row.description}</div>
              <div className="small muted">
                {row.brand ? row.brand + ' · ' : ''}<span className="mono">{row.lineCode} {row.partNumber}</span>
                {row.quality ? ' · ' + row.quality : ''}{row.warranty ? ' · ' + (row.warranty.length > 40 ? row.warranty.slice(0, 40) + '…' : row.warranty) : ''}
              </div>
            </div>
            <div className="pr mono">{row.listPrice === null ? <span className="small muted">No catalog price</span> : <>{money(row.listPrice)}{qty > 1 && <span className="small muted"> ea</span>}</>}</div>
            <div className="small muted">{row.listPrice === null ? '' : qty > 1 ? qty + ' needed = ' + money(row.listPrice * qty) : (row.core ? 'Core ' + money(row.core) : '')}</div>
            <div style={{ textAlign: 'right' }}>
              {row.listPrice === null ? null : readOnly ? null : on
                ? <button className="btn sm" onClick={() => removePart(key)}>Remove</button>
                : <button className="btn sm primary" onClick={() => addPart(row, part, qty, fit)}>Add to RO</button>}
            </div>
          </div>
        );
      })}
    </article>
  );
}
