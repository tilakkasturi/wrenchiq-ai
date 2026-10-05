import { useEffect, useState } from 'react';
import { S } from '../state';
import { money, rate } from '../logic';
import { buildRecs } from '../recommend';
import { LEVELS, buildPackage, packageLevel, prefetchPackageParts, packageTalk } from '../packages';
import { SETTINGMAP } from '../shopSettings';
import { addPackage } from '../harness';
import { talkTracks, trackById } from '../talkTracks';
import { talkText, talkState } from '../talkGen';
import { TalkTag } from './TalkTag';

const TAG = { high: 'med', medium: 'adv', low: 'low' };
const NAME = { high: 'High', medium: 'Medium', low: 'Low' };
const cost = (n, pending) => (n === null ? 'needs labor rate' : money(n) + (pending ? ' + parts' : ''));

/**
 * The severity package estimate: WrenchIQ's pick at the shop's severity level (Shop profile), with the
 * totals of the other levels one tap away. Recomputed on every render, so prices that arrive later,
 * an engine answer or a changed setting show up in place.
 */
export function PackageCard() {
  const shopLevel = packageLevel();
  const [view, setView] = useState(null);
  const level = view || shopLevel;
  const recs = buildRecs();
  const all = Object.fromEntries(LEVELS.map(l => [l, buildPackage(l, recs)]));
  const pk = all[level], rt = rate();
  const talk = packageTalk(pk, recs);
  // the shop-level package's talk track is model-written when it passed the checks (generated with the Recommendations card)
  const ptrack = level === shopLevel ? trackById(talkTracks(recs), 'package:' + level) : null;
  const [copied, setCopied] = useState(false);
  const copy = () => { try { navigator.clipboard.writeText(talk.say.join(' ')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); } catch (_) { /* clipboard blocked */ } };
  // prices for every part any level could include (cached per vehicle + part)
  useEffect(() => { prefetchPackageParts(recs); }, [S.ro.year, S.ro.make, S.ro.model, S.ro.engine, level, pk.items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!pk.items.length) return null;
  const open = pk.items.filter(i => !i.onOrder);
  const confirm = [...new Map(pk.confirm.map(c => [c.line + '|' + c.what, c])).values()];
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>Severity (High, Medium, Low) Package Estimates</div>
      <article className="card pkg">
        <div className="top-row">
          <h3>Severity {NAME[level].toLowerCase()} <span className={'tag ' + TAG[level]}>{pk.items.length} line{pk.items.length === 1 ? '' : 's'}{open.length < pk.items.length ? (open.length ? ' · ' + (pk.items.length - open.length) + ' on the RO' : ' · all on the RO') : ''}</span></h3>
          <button className="btn sm primary" disabled={!open.length && !pk.partsMissing} onClick={() => addPackage(level)}>{open.length ? 'Add package to RO' : pk.partsMissing ? 'Add the package parts' : 'Package is on the RO'}</button>
        </div>

        <div className="seg pkg-levels" role="group" aria-label="Severity level">
          {LEVELS.map(l => (
            <button key={l} aria-pressed={l === level} onClick={() => setView(l)} title={l === shopLevel ? 'Your shop setting' : undefined}>
              {NAME[l]}{l === shopLevel ? ' ★' : ''} · <span className="mono">{all[l].total === null ? all[l].hours.toFixed(1) + ' h' : money(all[l].total)}</span>
            </button>
          ))}
        </div>

        <p className="pkg-hl">{talk.highlight}</p>
        <details className="pkg-detail">
          <summary><span className="small">What to say, why these lines, and what to confirm</span></summary>
          <div className="recs-say">
            <div className="label">What to say to the customer {ptrack && <TalkTag track={ptrack} />}</div>
            {(ptrack && talkState(ptrack) === 'checked' ? [talkText(ptrack)] : talk.say).map((l, k) => <p key={k}>{l}</p>)}
            <button className="btn ghost sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="why-line">WrenchIQ picked this by severity: {SETTINGMAP['package.severity'].options.find(o => o.value === level).label.replace(/^Severity \w+: /, '')}{level !== shopLevel ? ' (viewing; your shop setting is ' + NAME[shopLevel].toLowerCase() + ')' : ''}. Change the default in Shop profile.</p>

        {LEVELS.filter(l => pk.items.some(i => i.severity === l)).map(l => (
          <section className="pkg-group" key={l}>
            <div className="maint-tier-head"><span className={'tag ' + TAG[l]}>{NAME[l]} severity</span></div>
            {pk.items.filter(i => i.severity === l).map(i => (
              <div className="pkg-item" key={i.id}>
                <div>
                  <div style={{ fontWeight: 500 }}>{i.name} <span className="mono small muted">{i.hours.toFixed(1)} h{rt ? ' · ' + money(i.hours * rt) : ''}</span></div>
                  <div className="small muted">{i.why}{i.note ? ' · ' + i.note : ''}</div>
                  {i.parts.length > 0 && (
                    <div className="small pkg-parts">Parts: {i.parts.map(p => (
                      <span key={p.name}>{p.name}{' '}
                        <span className="mono">{p.need === 'diesel' ? 'not on a diesel' : p.each === null ? (p.status === 'loading' ? 'pricing…' : p.status === 'none' ? 'no NAPA price' : p.status === 'manual' ? 'add by hand' : 'no price yet') : (p.qty ? p.qty + ' × ' : '? × ') + money(p.each)}</span>
                        {p.availability ? ' · ' + p.availability : ''}</span>
                    )).reduce((a, b) => [a, '; ', b])}</div>
                  )}
                </div>
                <div className="small muted">{i.onOrder ? 'On the RO' : ''}</div>
              </div>
            ))}
          </section>
        ))}

        <div className="pkg-total">
          <div><span>Labor {pk.hours.toFixed(1)} h</span><span className="mono">{pk.labor === null ? 'needs rate' : money(pk.labor)}</span></div>
          <div><span>Parts at the shop pick{pk.partsPending ? ' (' + pk.partsPending + ' not priced yet)' : ''}</span><span className="mono">{money(pk.parts)}</span></div>
          <div className="grand"><span>Package total</span><span className="mono">{cost(pk.total, pk.partsPending)}</span></div>
        </div>

        {confirm.length > 0 && (
          <div className="pkg-confirm">
            <div className="label">Confirm before the final estimate</div>
            <ul>{confirm.map(c => <li key={c.line + c.what} className="small"><b>{c.line}:</b> {c.what}</li>)}</ul>
          </div>
        )}
        {pk.skipped.length > 0 && <p className="why-line small muted">Left out by the labor rules: {pk.skipped.map(i => i.name + ' (' + i.reason + ')').join('; ')}</p>}
        {!S.ro.year && <p className="why-line small muted">Add the vehicle to price parts.</p>}
        </details>
      </article>
    </>
  );
}
