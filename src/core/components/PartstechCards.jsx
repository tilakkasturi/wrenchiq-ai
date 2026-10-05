import { useEffect } from 'react';
import { S } from '../state';
import { money, partOn } from '../logic';
import { loadPartstechCard, addPartstechPart, removePart, swapPart, showPartstech } from '../harness';
import { policy } from '../partPolicy';

// PartsTech (punch-out): the advisor picks parts in PartsTech's own screens, shown in the PartsTech
// tab (PartstechPanel.jsx), never in place of WrenchIQ. The card shows what came back: on the return
// page's postMessage, on "Done: bring parts to the RO" in the tab, or on Refresh.

const bare = n => n.replace(/\s*\(.*?\)\s*/g, ' ').trim();

export function PartstechCard({ card }) {
  // the return page (server/routes/partstech.js) posts {type:'partstech:parts', ref} to this window
  useEffect(() => {
    const onMsg = e => { if (e.data && e.data.type === 'partstech:parts' && e.data.ref === card.ref) loadPartstechCard(card, false); };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [card]);

  const rows = card.rows || [];
  const qtyFor = row => card.qty || row.cartQty || 1;
  return (
    <article className="card">
      <div className="top-row"><h3>{bare(card.part)}</h3><span className="tag adv">PartsTech</span></div>
      <p className="why-line">Fits {card.fit}. Open PartsTech (its own tab, next to Agent trace), compare suppliers, add what you want to the PartsTech cart, then press Done to bring them back here. Prices are your cost from the supplier you pick.</p>
      <div className="row" style={{ display: 'flex', gap: 8, margin: '6px 0' }}>
        <button className="btn sm primary" onClick={() => showPartstech(card)}>Open PartsTech</button>
        <button className="btn sm" disabled={card.status === 'loading'} onClick={() => loadPartstechCard(card, true)}>{card.status === 'loading' ? 'Reading cart…' : 'Refresh from PartsTech'}</button>
      </div>
      {card.status === 'error' && <p className="why-line">{card.error}</p>}
      {card.status !== 'loading' && card.status !== 'error' && !rows.length && <p className="why-line small muted">Nothing picked in PartsTech yet.</p>}
      {rows.length > 0 && <p className="why-line">Picked in PartsTech{card.at ? ', read ' + new Date(card.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''}. Your shop rule ({policy().label.toLowerCase()}) is applied by you in PartsTech.</p>}
      {rows.map(row => {
        const key = row.lineCode + '|' + row.partNumber, on = partOn(key), qty = qtyFor(row);
        const other = !on && S.ro.parts.added.find(x => x.label === card.part);
        return (
          <div className="pit" key={key}>
            <div>
              <div className="nm">{row.description}</div>
              <div className="small muted">
                {row.brand ? row.brand + ' · ' : ''}<span className="mono">{row.partNumber}</span> · {row.availability.label}{row.cartQty ? ' · ' + row.cartQty + ' in PartsTech cart' : ''}
              </div>
            </div>
            <div className="pr mono">{row.listPrice === null ? <span className="small muted">No price</span> : <>{money(row.listPrice)}{qty > 1 && <span className="small muted"> ea</span>}</>}</div>
            <div className="small muted">{row.list ? 'List ' + money(row.list) : ''}{row.core ? ' · Core ' + money(row.core) : ''}{qty > 1 && row.listPrice !== null ? ' · ' + qty + ' = ' + money(row.listPrice * qty) : ''}</div>
            <div style={{ textAlign: 'right' }}>
              {row.listPrice === null ? null : on
                ? <button className="btn sm" onClick={() => removePart(key)}>Remove</button>
                : other
                  ? <button className="btn sm" title={'Replaces ' + other.lineCode + ' ' + other.partNumber + ' on the RO'} onClick={() => swapPart(other.key, row, card.part, qty, card.fit)}>Use this instead</button>
                  : <button className="btn sm primary" onClick={() => addPartstechPart(card, row)}>Add to RO</button>}
            </div>
          </div>
        );
      })}
    </article>
  );
}

const Row = ({ k, v, note }) => (
  <div className="napa-row"><span className="k">{k}</span><span className="v">{v}{note && <span className="small muted"> · {note}</span>}</span></div>
);
const val = s => (s && s.value ? <span className="mono">{s.value}</span> : <span className="muted">not set</span>);

/** Shop profile: "show me the PartsTech config". Keys are never sent to the browser. */
export function PartstechConfigCard({ card }) {
  const c = card.config, n = c.connection;
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>PartsTech configuration for this shop</div>
      <article className="card napa">
        <section>
          <h3>Connection</h3>
          <Row k="API" v={c.protocol} />
          <Row k="Endpoint" v={val(n.apiUrl)} note={n.apiUrl.source} />
          <Row k="Sign-in" v={c.auth} />
          <Row k="Partner ID" v={val(n.partnerId)} note={n.partnerId.source} />
          <Row k="Shop user ID" v={val(n.userId)} note={n.userId.source} />
          <Row k="Keys" v={n.keysConfigured ? 'Configured (not shown)' : 'Not configured: set PARTSTECH_PARTNER_KEY and PARTSTECH_USER_KEY on the server'} />
          <Row k="Callbacks" v={c.callbacks.enabled ? <span className="mono">{c.callbacks.publicBaseUrl}</span> : 'Off'} note={c.callbacks.note} />
        </section>
        <section>
          <h3>How a part is looked up</h3>
          <ol className="small napa-steps">{c.lookup.steps.map(s => <li key={s}>{s}</li>)}</ol>
          <Row k="Mode" v={c.lookup.mode} />
          <Row k="Ordering" v={c.lookup.ordering} />
        </section>
        <section>
          <h3>Price and availability</h3>
          <Row k="Price" v={c.pricing} />
          <Row k="Availability" v="Live stock per store from the supplier the advisor picked, as PartsTech reports it" />
        </section>
        <section>
          <h3>Your shop's rules</h3>
          <Row k="Parts choice" v={policy().label} note="applied by the advisor when picking in PartsTech" />
          <Row k="Quantity" v={'The RO\'s quantity when known ("(n)" in a part name, one per cylinder for spark plugs and coils), else the quantity in the PartsTech cart'} />
        </section>
      </article>
    </>
  );
}
