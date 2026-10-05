import { useEffect, useState } from 'react';
import { S } from '../state';
import { REPMAP } from '../data';
import { getMaintItem } from '../maintenanceSchedule';
import { hrs, rate, conf, money, partOn, vehicleOk } from '../logic';
import { acceptItem, removeItem, dismissItem, restoreItem, addAllMaint, searchPart, addPart, removePart, swapPart } from '../harness';
import { talkFor } from '../talkTrack';
import { talkText, talkState } from '../talkGen';
import { TalkTag } from './TalkTag';
import { interpretMaint } from '../maintAdvice';
import { maintMode, fullSchedule, settingOption } from '../shopSettings';
import { partPrice, prefetchPartPrices } from '../partPrices';
import { policy, rankParts, shopPick } from '../partPolicy';
import { engineSpec, perCylinder } from '../engineCylinders';

/** The chip's price text: the shop's pick (availability first, then price) once known. */
function chipPrice(n, it) {
  const p = partPrice(n);
  if (!p || p.status === 'error') return 'price';
  if (p.status === 'loading') return 'checking…';
  if (p.status !== 'ok') return 'no NAPA price';
  const a = p.pick.availability;
  if (perCylinder(n, it)) {
    const sp = engineSpec();
    if (sp.diesel) return 'not on a diesel';
    return money(p.pick.listPrice) + ' ea' + (sp.cylinders ? ' × ' + sp.cylinders : ', 1 per cylinder') + (a ? ' · ' + a.short : '');
  }
  return money(p.pick.listPrice) + (a ? ' · ' + a.short : '');
}

function Cite({ it }) {
  const label = it.src === 'lg' ? (it.synthetic ? 'Labor guide (synthetic)' : 'Labor guide') : 'Scheduled maintenance';
  return (
    <details className="cite">
      <summary><b>{label}</b><span className="mono">{it.ref}</span><span className="mono">{it.hours.toFixed(1)} h</span></summary>
      <div className="cite-body">{it.detail}</div>
    </details>
  );
}

export function RepairsCard({ card }) {
  const rt = rate(), R = S.ro, ready = vehicleOk();
  const partNames = card.snap.flatMap(x => (REPMAP[x.id] ? REPMAP[x.id].parts : []));
  useEffect(() => {
    if (ready) prefetchPartPrices(partNames);
  }, [ready, R.year, R.make, R.model, partNames.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
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
                    title={vehicleOk() ? 'Shop pick: ' + policy().label.toLowerCase() + '. NAPA list price; availability is sample data. Click for all options.' : 'Enter year, make and model first'}
                    onClick={() => searchPart(n)}>{n} · {vehicleOk() ? chipPrice(n, it) : 'price'}</button>
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

const SCHEDULE_LABEL = { VIN_MASK: 'Toyota schedule (VIN match)', MAKE_TOYOTA_DEFAULT: 'Toyota schedule (default family)', GENERIC: 'Generic schedule' };

/**
 * Add-on (COMBINATION) labor for a job on the order. Each row shows what it adds and a line the
 * advisor can read to the customer; nothing is pre-selected.
 */
export function CombosCard({ card }) {
  const rt = rate(), parent = REPMAP[card.parent];
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>Goes with {parent ? parent.name.toLowerCase() : 'this job'}</div>
      <div className="card">
        {card.ids.map(id => {
          const it = REPMAP[id], on = S.ro.accepted.has(id), tk = talkFor(id, card.parent, rt);
          if (!it) return null;
          return (
            <div className="maint-item combo" key={id}>
              <div>
                <div style={{ fontWeight: 500 }}>{it.name} <span className="mono small muted">+{it.hours.toFixed(1)} h{rt ? ' · ' + money(it.hours * rt) : ''}</span></div>
                {tk && <span className={'tag ' + (tk.kind === 'required' ? 'adv' : tk.kind === 'if-needed' || tk.kind === 'optional' ? 'low' : 'med')}>{tk.label}</span>}
                {tk && <p className="say"><span className="small muted">Say to the customer: </span>{tk.text}</p>}
                <Cite it={it} />
              </div>
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

const TIER_TAG = { safety: 'med', protect: 'adv', comfort: 'low' };

/**
 * Scheduled maintenance, interpreted (maintAdvice.js): what is due grouped by severity with why it
 * matters, what today's repairs already cover, and the script the advisor can read to the customer.
 */
/** embedded: shown inside the Recommendations card's maintenance section, without its own label and frame. */
export function MaintCard({ card, embedded = false, talk = null }) {
  const ms = card.ms, rt = rate();
  const [copied, setCopied] = useState(false);
  const all = maintMode() === 'all'; // shop setting: the full schedule as is, not prioritized
  const adv = interpretMaint(ms, { rate: rt, accepted: [...S.ro.accepted], make: S.ro.make });
  if (!adv) return null;
  const full = all ? fullSchedule(ms, { rate: rt, accepted: [...S.ro.accepted], make: S.ro.make }) : null;
  const left = adv.recommendedIds.length;
  const script = all ? [full.script] : adv.scriptLines;
  const copy = () => { try { navigator.clipboard.writeText(all ? full.script : adv.script).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); } catch (_) { /* clipboard blocked */ } };
  const row = (it, extra) => {
    const on = S.ro.accepted.has(it.id);
    return (
      <div className="maint-item" key={it.id}>
        <div>
          <div style={{ fontWeight: 500 }}>{it.name} <span className="mono small muted">{it.hours.toFixed(1)} h{it.price !== null && it.price !== undefined ? ' · ' + money(it.price) : ''}</span>{it.extended && <span className="tag low" style={{ marginLeft: 6 }}>Extended schedule</span>}</div>
          {extra}
        </div>
        <div>{it.coveredBy
          ? <span className="small muted">In today's {it.coveredBy.toLowerCase()}</span>
          : on ? <button className="btn sm" onClick={() => removeItem(it.id)}>Remove</button>
            : <button className="btn sm primary" onClick={() => acceptItem(it.id)}>Add</button>}</div>
      </div>
    );
  };
  return (
    <>
      {!embedded && <div className="label" style={{ marginBottom: 6 }}>Scheduled maintenance</div>}
      <div className={embedded ? 'maint embedded' : 'card maint'}>
        <div className="top-row">
          <h3>{adv.headline} <span className={'tag ' + (adv.status === 'Due now' ? 'med' : 'low')}>{adv.status}</span></h3>
          <span className="maint-actions">
            {!all && left > 0 && <button className="btn sm primary" onClick={() => addAllMaint('recommended')}>Add recommended ({left})</button>}
            <button className={'btn sm' + (all && full.openIds.length ? ' primary' : '')} onClick={() => addAllMaint('all')}>Add all{all ? ' (' + full.openIds.length + ')' : ''}</button>
          </span>
        </div>
        <p className="why-line">{ms.note} · {SCHEDULE_LABEL[ms.match] || ms.source}{all
          ? (full.hours ? ' · ' + full.hours.toFixed(1) + ' h' + (full.price !== null ? ' · ' + money(full.price) : '') : '')
          : (adv.recommended.hours ? ' · recommended ' + adv.recommended.hours.toFixed(1) + ' h' + (adv.recommended.price !== null ? ' · ' + money(adv.recommended.price) : '') : '')}</p>
        <p className="why-line small muted">Shop setting: {settingOption('maint.presentation').label}. Change it in Shop profile.</p>

        <details className="maint-script" open>
          <summary><span className="label">What to say to the customer</span> {talk && <TalkTag track={talk} />}</summary>
          {(talk && talkState(talk) === 'checked' ? [talkText(talk)] : script).map((l, i) => <p key={i}>{l}</p>)}
          <button className="btn ghost sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
        </details>

        {all && <section className="maint-tier">{full.items.map(it => row(it, null))}</section>}
        {!all && adv.tiers.map(t => (
          <section className="maint-tier" key={t.id}>
            <div className="maint-tier-head"><span className={'tag ' + TIER_TAG[t.id]}>{t.label}</span><span className="small muted">{t.recommend ? 'Recommend today' : 'Optional'}</span></div>
            {t.items.map(it => row(it, it.why && <p className="why-line" title={it.skip ? 'If skipped: ' + it.skip : undefined}>{it.why}</p>))}
          </section>
        ))}
        {!all && adv.inspection && (
          <section className="maint-tier">
            <div className="maint-tier-head"><span className="tag low">Inspection</span><span className="small muted">Included checks</span></div>
            {row(adv.inspection, <p className="why-line">{adv.inspection.count ? adv.inspection.count + ' checks' : 'Multi-point checks'}{adv.inspection.groups.length ? ': ' + adv.inspection.groups.join(', ') : ''}. We call the customer before any extra work.</p>)}
          </section>
        )}
      </div>
    </>
  );
}

export function PartsCard({ card }) {
  const { res, part, fit, readOnly } = card;
  // one per cylinder: follows the engine on the RO, so the card is right once the engine is known
  const sp = card.perCyl ? engineSpec() : null;
  const qty = card.perCyl ? (sp.diesel ? 0 : sp.cylinders) : card.qty;
  const when = new Date(res.retrievedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const rows = rankParts(res.parts), pick = shopPick(res.parts);
  return (
    <article className="card">
      <div className="top-row"><h3>{part.replace(/\s*\(.*?\)\s*/g, ' ').trim()}</h3><span className="tag adv">NAPA</span></div>
      <p className="why-line">Fits {fit}{qty > 1 ? ' · need ' + qty + (card.perCyl ? ' (one per cylinder)' : '') : ''} · {res.priceBasis}, retrieved {when}. Not your account cost.</p>
      {card.perCyl && !qty && <p className="why-line">{qty === 0 ? 'Not needed: the engine is a diesel.' : 'One per cylinder. Tell me the engine and I will set the quantity.'}</p>}
      <p className="why-line">Ordered by your rule: {policy().label.toLowerCase()}.{res.availabilityBasis ? ' ' + res.availabilityBasis + '.' : ''}</p>
      {rows.map(row => {
        const key = row.lineCode + '|' + row.partNumber, on = partOn(key);
        const other = !on && S.ro.parts.added.find(x => x.label === part); // another option is on the RO for this need
        return (
          <div className="pit" key={key}>
            <div>
              <div className="nm">{row.description}{row === pick && <> <span className="tag high">Shop pick</span></>}</div>
              <div className="small muted">
                {row.brand ? row.brand + ' · ' : ''}<span className="mono">{row.lineCode} {row.partNumber}</span>
                {row.quality ? ' · ' + row.quality : ''}{row.availability ? ' · ' + row.availability.label : ''}{row.warranty ? ' · ' + (row.warranty.length > 40 ? row.warranty.slice(0, 40) + '…' : row.warranty) : ''}
              </div>
            </div>
            <div className="pr mono">{row.listPrice === null ? <span className="small muted">No catalog price</span> : <>{money(row.listPrice)}{qty > 1 && <span className="small muted"> ea</span>}</>}</div>
            <div className="small muted">{row.listPrice === null ? '' : qty > 1 ? qty + ' needed = ' + money(row.listPrice * qty) : (row.core ? 'Core ' + money(row.core) : '')}</div>
            <div style={{ textAlign: 'right' }}>
              {row.listPrice === null || !qty ? null : readOnly ? null : on
                ? <button className="btn sm" onClick={() => removePart(key)}>Remove</button>
                : other
                  ? <button className="btn sm" title={'Replaces NAPA ' + other.lineCode + ' ' + other.partNumber + ' on the RO'} onClick={() => swapPart(other.key, row, part, qty, fit)}>Use this instead</button>
                  : <button className="btn sm primary" onClick={() => addPart(row, part, qty, fit)}>Add to RO</button>}
            </div>
          </div>
        );
      })}
    </article>
  );
}
