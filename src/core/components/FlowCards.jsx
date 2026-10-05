import { useState } from 'react';
import { S } from '../state';
import { money, rate } from '../logic';
import { acceptItem, removeItem, answerQuestions } from '../harness';
import { buildRecs } from '../recommend';
import { MaintCard } from './Cards';
import { settingOption } from '../shopSettings';

/**
 * The one combined question: every part on one card. Pick an option per part or type it; Send
 * records it all as one answer. The advisor can also just type the answers in the chat.
 */
export function QuestionsCard({ card }) {
  const [picked, setPicked] = useState({});
  const f = S.ro.flow || {};
  const done = f.shown || f.askedRound !== card.askedAt || f.rounds > card.askedAt; // answered, or a newer round is out
  const set = (id, v) => setPicked(p => ({ ...p, [id]: p[id] === v ? '' : v }));
  const any = Object.values(picked).some(v => String(v || '').trim());
  return (
    <article className={'card qcard' + (done ? ' off' : '')}>
      <div className="top-row"><h3>{card.parts.length > 1 ? 'A few quick questions' : 'One quick question'}</h3><span className="tag low">{'Round ' + card.round + ' of 2'}</span></div>
      <p className="why-line">So I recommend the right work for this vehicle. Answer what you know; I will go ahead after this{card.round < 2 ? ' or one more answer' : ''}.</p>
      <ol className="qparts">
        {card.parts.map(p => (
          <li key={p.id}>
            <div className="qask">{p.ask}</div>
            {p.kind === 'choice' ? (
              <div className="qopts" role="radiogroup" aria-label={p.ask}>
                {p.options.map(o => (
                  <button key={o} type="button" role="radio" aria-checked={picked[p.id] === o} disabled={done}
                    className={'chip' + (picked[p.id] === o ? ' on' : '')} onClick={() => set(p.id, o)}>{o}</button>
                ))}
              </div>
            ) : (
              <input className="qtext" disabled={done} placeholder={p.placeholder} aria-label={p.ask} value={picked[p.id] || ''}
                onChange={e => setPicked(x => ({ ...x, [p.id]: e.target.value }))} />
            )}
          </li>
        ))}
      </ol>
      {!done && (
        <div className="actions">
          <button className="btn primary" disabled={!any} onClick={() => answerQuestions(picked, card.parts)}>Send answers</button>
          <button className="btn" onClick={() => answerQuestions({}, card.parts)}>Skip, show recommendations</button>
        </div>
      )}
    </article>
  );
}

const Price = ({ h, p }) => <span className="mono small muted">{h.toFixed(1)} h{p !== null && p !== undefined ? ' · ' + money(p) : ''}</span>;

function AddBtn({ id, on }) {
  return on
    ? <button className="btn sm" onClick={e => { e.preventDefault(); removeItem(id); }}>Remove</button>
    : <button className="btn sm primary" onClick={e => { e.preventDefault(); acceptItem(id); }}>Add</button>;
}

function Say({ lines }) {
  const [copied, setCopied] = useState(false);
  const list = [].concat(lines).filter(Boolean);
  if (!list.length) return null;
  const copy = () => { try { navigator.clipboard.writeText(list.join(' ')).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }, () => {}); } catch (_) { /* clipboard blocked */ } };
  return (
    <div className="recs-say">
      <div className="label">What to say to the customer</div>
      {list.map((l, i) => <p key={i}>{l}</p>)}
      <button className="btn ghost sm" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
    </div>
  );
}

/** One expandable line: the summary row says what and how much; opening it shows why. */
function Drill({ title, tag, tagClass, h, p, id, on, children }) {
  return (
    <details className="drill">
      <summary>
        <span className="drill-name">{title}</span>
        {tag && <span className={'tag ' + (tagClass || 'low')}>{tag}</span>}
        <Price h={h} p={p} />
        <span className="drill-act"><AddBtn id={id} on={on} /></span>
      </summary>
      <div className="drill-body">{children}</div>
    </details>
  );
}

function Section({ n, title, count, hint, open, children }) {
  return (
    <details className="recs-sec" open={open}>
      <summary><span className="recs-n">{n}</span><span className="recs-title">{title}</span><span className="small muted">{hint}</span><span className="tag low">{count}</span></summary>
      <div className="recs-body">{children}</div>
    </details>
  );
}

/**
 * Recommendations in three separate sections: likely repairs, scheduled maintenance and labor-guide
 * recommendations. Each has a talk track; each item opens for the detail. Rebuilt from the repair
 * order every render, so adding a line updates every section.
 */
export function RecsCard({ card } = {}) {
  const r = buildRecs(), rt = rate();
  const { repairs, maint, labor } = r;
  const addOnDrill = it => (
    <Drill key={it.id} title={it.name} tag={it.kind} tagClass={it.kind === 'Part of the job' ? 'adv' : it.kind === 'Recommended' ? 'med' : 'low'} h={it.hours} p={it.price} id={it.id} on={it.on}>
      {it.say && <p className="say">{it.say}</p>}
      {it.saves ? <p className="why-line"><b>Saves</b> {it.saves.toFixed(1)} h{rt ? ' (' + money(it.saves * rt) + ')' : ''} against doing it on its own.</p> : null}
      <p className="why-line mono small">Add-on labor · labor guide {it.ref}</p>
    </Drill>
  );
  // open the first section that has something in it
  const first = repairs.items.length ? 1 : maint.adv ? 2 : labor.anchor ? 3 : 1;
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>{card && card.individual ? 'Individual recommendations' : 'Recommendations'}</div>
      <div className="card recs">
        {r.concern && <p className="why-line" style={{ marginTop: 0 }}>{r.concern}</p>}

        <Section n="1" title="Likely repairs" count={repairs.items.length} hint="from the customer's concern" open={first === 1}>
          {repairs.empty ? <p className="why-line">{repairs.empty}</p> : <Say lines={repairs.say} />}
          {repairs.items.map((it, i) => (
            <Drill key={it.id} title={it.name} tag={i === 0 ? 'Top match' : it.match} tagClass={it.level} h={it.hours} p={it.price} id={it.id} on={it.on}>
              <p className="why-line"><b>Why it matches:</b> {it.why.join('. ') || 'Matches the concern'}.</p>
              {it.parts.length > 0 && <p className="why-line"><b>Parts:</b> {it.parts.join(', ')}</p>}
              <p className="why-line mono small">{it.synthetic ? 'Labor guide (synthetic) ' : 'Labor guide '}{it.ref}</p>
            </Drill>
          ))}
        </Section>

        <Section n="2" title="Scheduled maintenance" count={maint.count} hint={maint.adv ? maint.adv.headline + ' · ' + maint.adv.status.toLowerCase() : 'not due'} open={first === 2}>
          {maint.adv ? <MaintCard card={{ ms: maint.ms }} embedded /> : <p className="why-line">{maint.empty}</p>}
        </Section>

        <Section n="3" title="Labor guide recommendations" count={labor.items.length + labor.followOns.length} hint={labor.anchor ? 'with ' + labor.anchorName.toLowerCase().replace(/,.*$/, '') : 'add-on labor'} open={first === 3}>
          {labor.anchor ? <Say lines={labor.say} /> : <p className="why-line">{labor.empty}</p>}
          {labor.anchor && !labor.anchorOnOrder && <p className="why-line small muted">These apply once {labor.anchorName.toLowerCase()} is on the order.</p>}
          {labor.anchor && <p className="why-line small muted">Shop setting: {settingOption('labor.presentation').label}. Change it in Shop profile.</p>}
          {labor.lead.map(addOnDrill)}
          {labor.more.length > 0 && (
            <details className="recs-more">
              <summary><span className="small">Only if needed or optional ({labor.more.length})</span><span className="small muted">offered as conditional</span></summary>
              {labor.more.map(addOnDrill)}
            </details>
          )}
          {labor.followOns.map(f => (
            <Drill key={f.id} title={f.name} tag="Not included" h={f.hours} p={f.price} id={f.id} on={f.on}>
              <p className="say">{f.why}</p>
              <p className="why-line small muted">The labor guide says {labor.anchorName.toLowerCase()} does not include this.</p>
            </Drill>
          ))}
        </Section>
      </div>
    </>
  );
}
