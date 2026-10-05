import { useEffect, useRef, useState } from 'react';
import { useCore, S } from '../state';
import { Cp, Cr } from '../harness';
import { RepairsCard, MaintCard, PartsCard, CombosCard } from './Cards';
import { QuestionsCard, RecsCard } from './FlowCards';
import { PackageCard } from './PackageCard';
import { NapaConfigCard } from './NapaConfigCard';
import { PartstechCard, PartstechConfigCard } from './PartstechCards';

const CHATS = { profile: Cp, ro: Cr };

function Trace({ item }) {
  return (
    <ol className="tr">
      {item.labels.map((l, i) => (
        <li key={l} className={i < item.done ? 'done' : i === item.run ? 'run' : ''}>{l}</li>
      ))}
    </ol>
  );
}

// The model writes light markdown; show **bold** as bold and leave the rest as plain text.
const rich = text => String(text).split(/(\*\*[^*]+\*\*)/g).map((part, i) => (/^\*\*[^*]+\*\*$/.test(part) ? <strong key={i}>{part.slice(2, -2)}</strong> : part));

function Item({ item }) {
  switch (item.kind) {
    case 'user': return <div className="msg user">{item.text}</div>;
    case 'agent': return <div className="msg agent">{rich(item.text)}{item.why && <span className="why">{item.why}</span>}</div>;
    case 'event': return <div className="event">{item.text}</div>;
    case 'typing': return <div className="typing"><i /><i /><i /></div>;
    case 'trace': return <Trace item={item} />;
    case 'cards': return (
      <div className="cardgroup">
        {item.card.type === 'repairs' ? <RepairsCard card={item.card} />
          : item.card.type === 'parts' ? <PartsCard card={item.card} />
          : item.card.type === 'combos' ? <CombosCard card={item.card} />
          : item.card.type === 'questions' ? <QuestionsCard card={item.card} />
          : item.card.type === 'recs' ? <RecsCard card={item.card} />
          : item.card.type === 'package' ? <PackageCard />
          : item.card.type === 'napaConfig' ? <NapaConfigCard card={item.card} />
          : item.card.type === 'partstech' ? <PartstechCard card={item.card} />
          : item.card.type === 'partstechConfig' ? <PartstechConfigCard card={item.card} />
          : <MaintCard card={item.card} />}
      </div>
    );
    default: return null;
  }
}

export default function ChatPanel({ mode, title, note, placeholder, action }) {
  useCore();
  const chat = CHATS[mode], { items, chips } = S.chats[mode];
  const [value, setValue] = useState('');
  const [sel, setSel] = useState([]);
  const [toast, setToast] = useState('');
  const scroller = useRef(null);
  const input = useRef(null);

  // Follow new messages only when the reader is already at the bottom, or just sent something.
  // Re-rendering for any other reason (a card button, an edit) must not move the scroll position.
  const atBottom = useRef(true);
  const forceScroll = useRef(true); // true on first show, so the chat opens at the latest message
  const lastId = items.length ? items[items.length - 1].id : 0;
  useEffect(() => {
    const el = scroller.current;
    if (el && (forceScroll.current || atBottom.current)) el.scrollTop = el.scrollHeight;
    forceScroll.current = false;
  }, [items.length, lastId, chips]); // quick replies change the chat's height, so they count too
  const onScroll = () => { const el = scroller.current; atBottom.current = !el || el.scrollHeight - el.scrollTop - el.clientHeight < 160; };
  useEffect(() => { setSel([]); }, [chips]);
  useEffect(() => { const el = input.current; if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; } }, [value]);

  const submit = () => {
    const t = value.trim();
    if (!t) return;
    setValue('');
    forceScroll.current = true;
    chat.send(t);
  };
  const clickChip = c => {
    if (c.toggle) {
      setSel(s => {
        if (s.includes(c.text)) return s.filter(x => x !== c.text);
        return c.text === 'None' ? ['None'] : s.filter(x => x !== 'None').concat(c.text);
      });
      return;
    }
    if (c.text === '__done__') {
      if (!sel.length) { setToast('Pick at least one, or skip'); setTimeout(() => setToast(''), 2200); return; }
      forceScroll.current = true;
      chat.send(sel.join(' and '));
      return;
    }
    forceScroll.current = !c.silent;
    chat.send(c.text, { silent: !!c.silent });
  };

  return (
    <section className="panel chatpanel" aria-label={title}>
      <div className="chathead">
        <h2 className="label">{title}</h2>
        {note}
        {action}
      </div>
      <div className="scroll" ref={scroller} onScroll={onScroll}>
        <div className="thread" aria-live="polite">
          {items.map(it => <Item key={it.id} item={it} />)}
        </div>
      </div>
      <div className="quick">
        {chips.map(c => (
          <button
            key={c.t} type="button"
            className={'chip' + (c.done ? ' done' : '')}
            aria-pressed={c.toggle ? sel.includes(c.text) : undefined}
            onClick={() => clickChip(c)}
          >{c.t}</button>
        ))}
      </div>
      {toast && <div className="chat-toast" role="status">{toast}</div>}
      <form className="composer" onSubmit={e => { e.preventDefault(); submit(); }}>
        <textarea
          ref={input} rows={1} value={value} placeholder={placeholder} aria-label="Your message"
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); } }}
        />
        <button className="btn primary" type="submit">Send</button>
      </form>
    </section>
  );
}
