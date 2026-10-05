import { S } from '../state';
import { bringPartstechBack, loadPartstechCard, showPartstech } from '../harness';

// The PartsTech tab: PartsTech's own screens in a frame, next to Shop profile / Repair order /
// Agent trace. Kept mounted (hidden) while another tab is in front, so the advisor's search and
// cart survive switching tabs. Parts come back to the repair order's PartsTech card.

const bare = n => n.replace(/\s*\(.*?\)\s*/g, ' ').trim();
const sessions = () => S.chats.ro.items.filter(i => i.kind === 'cards' && i.card.type === 'partstech').map(i => i.card);

export default function PartstechPanel() {
  const card = S.pt.card, all = sessions();
  return (
    <div className="stage single pt-stage" style={S.pt.open ? undefined : { display: 'none' }} aria-hidden={!S.pt.open}>
      <section className="panel pt-panel" aria-label="PartsTech">
        <div className="head pt-head">
          <span className="label">PartsTech</span>
          {card ? <span className="small">{bare(card.part)} · {card.fit}</span> : null}
          {all.length > 1 && (
            <select className="demo-pick" aria-label="PartsTech search" value={card ? card.ref : ''} onChange={e => { const c = all.find(x => x.ref === e.target.value); if (c) showPartstech(c); }}>
              {all.map(c => <option key={c.ref} value={c.ref}>{bare(c.part)}</option>)}
            </select>
          )}
          <span style={{ flex: 1 }} />
          {card && <>
            <button className="btn sm" onClick={() => loadPartstechCard(card, true)}>{card.status === 'loading' ? 'Reading cart…' : 'Refresh cart'}</button>
            <a className="btn ghost sm" href={card.redirectUrl} target="_blank" rel="noopener noreferrer" title="If PartsTech does not load here (sign-in blocked in this window), open it in your browser">Open in browser</a>
            <button className="btn sm primary" onClick={bringPartstechBack}>Done: bring parts to the RO</button>
          </>}
        </div>
        {card
          ? <iframe key={card.ref} className="pt-frame" title={'PartsTech: ' + bare(card.part)} src={card.redirectUrl} allow="clipboard-write" />
          : <p className="small muted" style={{ padding: 16 }}>No PartsTech search yet. Ask for a part on the repair order (or add a repair that needs parts) and press Open PartsTech on its card.</p>}
      </section>
    </div>
  );
}
