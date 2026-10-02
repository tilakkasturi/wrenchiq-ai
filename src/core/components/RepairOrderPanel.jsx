import { useState, useRef, useEffect } from 'react';
import { useCore, S } from '../state';
import { PQMAP } from '../data';
import { ITEM, hrs, rate, miles, vehicleLine, vehicleOk, concern, money, roSummary, partsTotals, orderTotals } from '../logic';
import { saveVehicle, saveConcern, removeItem, lineWhy, addManual, changeHours, searchPart, removePart, setPartQty } from '../harness';
import { useFlash } from './useFlash';
import { customerWhy } from '../talkTrack';
import { parentsOnOrder } from '../laborRules';

/**
 * The Why? button: a popover with what to tell the customer about this line. Opens on hover or
 * focus, stays open when clicked, closes on Escape or a click elsewhere.
 */
function WhyPop({ it }) {
  const R = S.ro, [hover, setHover] = useState(false), [pinned, setPinned] = useState(false), [copied, setCopied] = useState(false);
  const box = useRef(null), btn = useRef(null), timer = useRef(null), [pos, setPos] = useState(null);
  const open = hover || pinned;
  // The lines table scrolls sideways, which would clip an absolutely placed card; place it against the window.
  useEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const r = btn.current && btn.current.getBoundingClientRect();
      if (!r) return;
      const w = Math.min(340, window.innerWidth - 24);
      setPos({ top: r.bottom + 8, left: Math.max(12, Math.min(r.left, window.innerWidth - w - 12)), width: w, arrow: Math.max(10, r.left - Math.max(12, Math.min(r.left, window.innerWidth - w - 12)) + 12) });
    };
    place();
    window.addEventListener('scroll', place, true); window.addEventListener('resize', place);
    return () => { window.removeEventListener('scroll', place, true); window.removeEventListener('resize', place); };
  }, [open]);
  useEffect(() => {
    if (!pinned) return undefined;
    const away = e => { if (box.current && !box.current.contains(e.target)) setPinned(false); };
    const esc = e => { if (e.key === 'Escape') { setPinned(false); setHover(false); } };
    document.addEventListener('mousedown', away); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', away); document.removeEventListener('keydown', esc); };
  }, [pinned]);
  useEffect(() => () => clearTimeout(timer.current), []);
  const enter = () => { clearTimeout(timer.current); setHover(true); };
  const leave = () => { timer.current = setTimeout(() => setHover(false), 150); };
  const w = open ? customerWhy(it, { hours: hrs(it), rate: rate(), concern: R.symptom, parent: parentsOnOrder(it.id, [...R.accepted])[0] }) : null;
  const copy = () => {
    try { navigator.clipboard.writeText(w.text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); } catch (_) { /* clipboard blocked */ }
  };
  return (
    <span className="why-pop" ref={box} onMouseEnter={enter} onMouseLeave={leave}>
      <button ref={btn} className="btn ghost sm" aria-expanded={open} aria-haspopup="dialog" onFocus={enter} onBlur={leave} onClick={() => setPinned(p => !p)}>Why?</button>
      {open && pos && (
        <div className="why-card" role="dialog" style={{ top: pos.top, left: pos.left, width: pos.width, '--arrow': pos.arrow + 'px' }} aria-label={'Customer talk track for ' + it.name}>
          <div className="why-head"><span className="label">Customer-friendly talk track</span><span className="tag adv">{w.title}</span></div>
          <p className="why-text">{w.text}</p>
          <div className="why-foot">
            <span className="small muted mono">{w.basis}</span>
            <span>
              <button className="btn ghost sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
              <button className="btn ghost sm" onClick={() => { setPinned(false); setHover(false); lineWhy(it.id); }}>Explain in chat</button>
            </span>
          </div>
        </div>
      )}
    </span>
  );
}

function Section({ sig, children }) {
  const flash = useFlash(sig);
  return <div className={'ro-sec' + (flash ? ' flash' : '')}>{children}</div>;
}

function VehicleSection() {
  const R = S.ro, veh = vehicleLine();
  const [draft, setDraft] = useState(null);
  const start = () => setDraft({ year: R.year, make: R.make, model: R.model, engine: R.engine, mileage: R.mileage, vin: R.vin });
  const fld = (k, label, extra) => (
    <div className="fld" key={k}>
      <label htmlFor={'ev-' + k}>{label}</label>
      <input id={'ev-' + k} value={draft[k]} onChange={e => setDraft({ ...draft, [k]: e.target.value })} {...extra} />
    </div>
  );
  if (draft) {
    return (
      <Section sig="veh-edit">
        <div className="head"><span className="label">Vehicle</span></div>
        <div className="fields">
          {fld('year', 'Year', { inputMode: 'numeric', maxLength: 4 })}{fld('make', 'Make')}{fld('model', 'Model')}
          {fld('engine', 'Engine')}{fld('mileage', 'Mileage', { inputMode: 'numeric' })}{fld('vin', 'VIN', { maxLength: 17, className: 'mono' })}
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button className="btn primary sm" onClick={() => { saveVehicle(draft); setDraft(null); }}>Save</button>
          <button className="btn sm" onClick={() => setDraft(null)}>Cancel</button>
        </div>
      </Section>
    );
  }
  return (
    <Section sig={[R.year, R.make, R.model, R.engine, R.mileage, R.vin].join('|')}>
      <div className="head"><span className="label">Vehicle</span><button className="btn ghost sm" onClick={start}>Edit</button></div>
      <p>{veh || <span className="muted">Not entered yet</span>}</p>
      <p className="mono small muted">{R.vin ? 'VIN ' + R.vin : 'VIN not entered'} · {miles() ? miles().toLocaleString() + ' mi' : 'mileage not entered'}</p>
    </Section>
  );
}

function ConcernSection() {
  const R = S.ro, cn = concern();
  const [draft, setDraft] = useState(null);
  if (draft !== null) {
    return (
      <Section sig="concern-edit">
        <div className="head"><span className="label">Customer concern</span></div>
        <div className="fld">
          <label htmlFor="ec-text">Symptom, in the customer's words</label>
          <textarea id="ec-text" rows={3} value={draft} onChange={e => setDraft(e.target.value)} />
        </div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <button className="btn primary sm" onClick={() => { saveConcern(draft); setDraft(null); }}>Save</button>
          <button className="btn sm" onClick={() => setDraft(null)}>Cancel</button>
        </div>
      </Section>
    );
  }
  return (
    <Section sig={cn}>
      <div className="head"><span className="label">Customer concern</span><button className="btn ghost sm" onClick={() => setDraft(R.symptom)}>Edit</button></div>
      <p>{cn || <span className="muted">Waiting for a symptom</span>}</p>
    </Section>
  );
}

function HoursInput({ it }) {
  const h = hrs(it);
  const commit = e => { const v = parseFloat(e.target.value); if (v !== h) changeHours(it.id, v); };
  return (
    <input
      key={it.id + ':' + h} className="hrs mono" type="number" min="0" max="99" step="0.1"
      defaultValue={h.toFixed(1)} aria-label={'Hours for ' + it.name}
      onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }}
    />
  );
}

function LinesSection() {
  const R = S.ro, rt = rate(), lines = [...R.accepted].map(ITEM).filter(Boolean);
  const [name, setName] = useState('');
  const [hours, setHours] = useState('');
  const [msg, setMsg] = useState('');
  let tot = 0, th = 0;
  lines.forEach(it => { const h = hrs(it); th += h; if (rt) tot += h * rt; });
  const add = () => {
    if (!name.trim()) { setMsg('Type what the line is'); return; }
    setMsg('');
    addManual(name.trim(), parseFloat(hours));
    setName(''); setHours('');
  };
  const sig = lines.map(it => it.id + ':' + hrs(it)).join('|') + '|' + rt;
  return (
    <Section sig={sig}>
      <div className="label">Lines</div>
      {!lines.length ? (
        <p className="muted">No lines yet. Say "add the front brakes", tap a card in the chat, or add a line below.</p>
      ) : (
        <>
          <div className="tablewrap">
            <table className="lines">
              <thead><tr><th>Operation</th><th className="n">Hours</th><th className="n">Labor</th></tr></thead>
              <tbody>
                {lines.map(it => {
                  const edited = R.hoursOv[it.id] !== undefined && it.src !== 'manual';
                  const badge = it.src === 'lg' ? 'LABOR GUIDE' : it.src === 'sm' ? 'SCHEDULE' : 'ENTERED';
                  return (
                    <tr key={it.id}>
                      <td>
                        {it.name}<br />
                        <span className="srcbadge">{badge}</span> <span className="mono small muted">{it.ref}</span>
                        {edited && <> <span className="tag med">edited, guide {it.hours.toFixed(1)} h</span></>}
                        <br />
                        <WhyPop it={it} />
                        <button className="btn ghost sm" onClick={() => removeItem(it.id)}>Remove</button>
                      </td>
                      <td className="n"><HoursInput it={it} /></td>
                      <td className="n mono">{rt ? money(hrs(it) * rt) : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="totals"><span>Total labor</span><span className="mono">{th.toFixed(1)} h{rt ? ' · ' + money(tot) : ''}</span></div>
          {!rt && <p className="small" style={{ marginTop: 8 }}>Labor price needs your rate. Tell me in the chat, for example "labor rate is 145".</p>}
        </>
      )}
      <div className="manual">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Add a line, e.g. Diagnostic time" aria-label="New line description" onKeyDown={e => { if (e.key === 'Enter') add(); }} />
        <input className="hrs mono" type="number" min="0" max="99" step="0.1" placeholder="h" value={hours} onChange={e => setHours(e.target.value)} aria-label="Hours for new line" onKeyDown={e => { if (e.key === 'Enter') add(); }} />
        <button className="btn sm" onClick={add}>Add</button>
      </div>
      {msg && <p className="small" role="status" style={{ marginTop: 6 }}>{msg}</p>}
    </Section>
  );
}

function PartsSection() {
  const R = S.ro, fl = vehicleLine(), pt = partsTotals();
  const [q, setQ] = useState('');
  const names = [];
  [...R.accepted].map(ITEM).filter(Boolean).forEach(it => (it.parts || []).forEach(n => { if (!names.includes(n)) names.push(n); }));
  const go = () => { const t = q.trim(); if (!t) return; setQ(''); searchPart(t); };
  const sig = R.parts.added.map(x => x.key + ':' + x.qty).join('|');
  return (
    <Section sig={sig}>
      <div className="head"><span className="label">Parts</span><span className="tag adv">NAPA LIST PRICE</span></div>
      <p className="small">Fitment: {vehicleOk() ? fl : <span className="muted">enter year, make and model first</span>}</p>
      <div className="manual">
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Part name, like front brake pads" aria-label="Part name"
          onKeyDown={e => { if (e.key === 'Enter') go(); }} />
        <button className="btn sm" disabled={!vehicleOk()} onClick={go}>Price</button>
      </div>
      {names.length > 0 && (
        <div className="pchips">
          <span className="small muted">From your lines:</span>
          {names.slice(0, 6).map(n => <button key={n} type="button" className="pchip" disabled={!vehicleOk()} onClick={() => searchPart(n)}>{n}</button>)}
        </div>
      )}
      {R.parts.added.length > 0 && (
        <>
          <div className="label" style={{ marginTop: 14 }}>Parts on this order</div>
          <div className="tablewrap">
            <table className="lines">
              <thead><tr><th>Part</th><th className="n">Qty</th><th className="n">Price</th></tr></thead>
              <tbody>
                {R.parts.added.map(x => (
                  <tr key={x.key}>
                    <td>
                      {x.description}<br />
                      <span className="srcbadge">NAPA</span> <span className="mono small muted">{x.lineCode} {x.partNumber}</span>
                      {x.fit !== fl && <> <span className="tag med">checked for {x.fit}</span></>}
                      <br /><button className="btn ghost sm" onClick={() => removePart(x.key)}>Remove</button>
                    </td>
                    <td className="n">
                      <input key={x.key + ':' + x.qty} className="hrs mono" type="number" min="1" max="99" step="1" defaultValue={x.qty}
                        aria-label={'Quantity for ' + x.label}
                        onBlur={e => { const n = parseInt(e.target.value, 10); if (n !== x.qty) setPartQty(x.key, n); }}
                        onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur(); }} />
                    </td>
                    <td className="n mono">{money(x.each * x.qty)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="totals"><span>Parts at list price</span><span className="mono">{money(pt.cost)}</span></div>
          {pt.sell !== null && <p className="small muted">With your {pt.markup}% markup: {money(pt.sell)} <span className="tag adv">advisory</span></p>}
        </>
      )}
    </Section>
  );
}

function TotalCard() {
  const o = orderTotals();
  const flash = useFlash(o.total + '|' + o.labor + '|' + o.parts);
  return (
    <div className={'total-card' + (flash ? ' flash-solid' : '')} aria-label="Order total">
      <div className="trow">
        <span>Labor <span className="muted small">{o.lineCount ? o.hours.toFixed(1) + ' h' + (o.rate ? ' @ $' + o.rate + '/hr' : '') : ''}</span></span>
        <span className="mono">{o.labor !== null ? money(o.labor) : o.laborMissing ? <span className="small muted">needs rate</span> : money(0)}</span>
      </div>
      <div className="trow">
        <span>Parts <span className="muted small">{o.partsCount ? o.partsCount + ' · NAPA list price' : ''}</span></span>
        <span className="mono">{money(o.parts)}</span>
      </div>
      <div className="trow grand">
        <span>{o.laborMissing ? 'Total (parts only)' : 'Estimated total'}</span>
        <span className="mono">{money(o.total)}</span>
      </div>
      {o.laborMissing && <p className="small muted">Labor isn't priced yet. Tell me your rate in the chat, for example "labor rate is 145".</p>}
      {o.totalWithMarkup !== null && <p className="small muted">With your {o.markup}% parts markup: <span className="mono">{money(o.totalWithMarkup)}</span> <span className="tag adv">advisory</span></p>}
      <p className="small muted">{o.empty ? 'Nothing on the order yet.' : 'Tax and shop fees not included.'}</p>
    </div>
  );
}

function CopyBox() {
  const [text, setText] = useState(null);
  const [done, setDone] = useState(false);
  const copy = async () => {
    const t = roSummary();
    try { await navigator.clipboard.writeText(t); setText(null); setDone(true); setTimeout(() => setDone(false), 2000); }
    catch (_) { setText(t); }
  };
  return (
    <div className="ro-sec">
      <button className="btn" onClick={copy}>{done ? 'Copied' : 'Copy summary'}</button>
      {text !== null && <textarea className="copybox" readOnly value={text} aria-label="Repair order summary" onFocus={e => e.target.select()} autoFocus />}
      <p className="small muted">Draft only. Core advises and never writes to a shop system.</p>
    </div>
  );
}

export default function RepairOrderPanel() {
  useCore();
  const mem = [];
  if (rate()) mem.push('Labor rate ' + S.profile['shop.labor_rate'].display);
  ['parts.supplier', 'comms.tone'].forEach(k => { if (S.profile[k]) mem.push(PQMAP[k].label + ': ' + S.profile[k].display); });
  return (
    <aside className="panel side" aria-label="Repair order">
      <div className="head"><h2 className="label">Repair order</h2><span className="live">Live</span><span className="tag adv">Draft</span></div>
      <VehicleSection />
      <ConcernSection />
      <LinesSection />
      <PartsSection />
      <div className="ro-sec">
        <div className="label">Shop memory applied <span className="tag adv">advisory</span></div>
        <p className="small">{mem.length ? mem.join(' · ') : <span className="muted">None yet. Set facts in Shop profile mode.</span>}</p>
      </div>
      <CopyBox />
      <TotalCard />
    </aside>
  );
}
