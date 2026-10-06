import { useEffect, useRef, useState } from 'react';
import { S } from '../state';
import { bringPartstechBack, loadPartstechCard, checkPartstechReturn, sendPartsToPartstech, roPartList } from '../harness';
import { inTauri, placePartstechView, hidePartstechView } from '../partstechView';
import { partstechFilteredUrl, policy } from '../partPolicy';

// The PartsTech tab: PartsTech's own screens next to Shop profile / Repair order / Agent trace.
// In a browser, a frame; in the Tauri Sidecar, a native webview laid over the same area
// (partstechView.js), because a frame loses PartsTech's sign-in there. Kept loaded (hidden) while
// another tab is in front, so the advisor's search and cart survive switching tabs. Parts come
// back to the repair order's PartsTech card.

const bare = n => n.replace(/\s*\(.*?\)\s*/g, ' ').trim();

/** In the Sidecar: keep the native PartsTech view over the frame area while the tab is open. */
function useNativeView(slot, card, open) {
  useEffect(() => {
    if (!inTauri()) return undefined;
    if (!open || !card || !slot.current) { hidePartstechView(); return undefined; }
    const place = () => {
      const r = slot.current && slot.current.getBoundingClientRect();
      if (r) placePartstechView(card, { x: Math.round(r.left), y: Math.round(r.top), width: Math.round(r.width), height: Math.round(r.height) });
    };
    place();
    const ro = new ResizeObserver(place);
    ro.observe(slot.current);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => { ro.disconnect(); window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); hidePartstechView(); };
  }, [card, open, slot]);
}

/**
 * Browser: the session link in a frame signs PartsTech in; once that page has loaded, switch the frame
 * to the same search with the shop's filter (the session link drops any filter added to it).
 */
function PartstechFrame({ card }) {
  const then = partstechFilteredUrl(card);
  const [src, setSrc] = useState(card.redirectUrl);
  return <iframe className="pt-frame" title={'PartsTech: ' + card.names.map(bare).join(', ')} src={src} allow="clipboard-write"
    onLoad={() => { if (then && src !== then) setSrc(then); }} />;
}

export default function PartstechPanel() {
  const card = S.pt.card, native = inTauri();
  const slot = useRef(null);
  useNativeView(slot, card, S.pt.open);
  // PartsTech's "send to repair order" lands on our return page (server stamps returnedAt): close and go back
  useEffect(() => {
    if (!S.pt.open || !card) return undefined;
    const t = setInterval(() => checkPartstechReturn(card), 2000);
    return () => clearInterval(t);
  }, [card, S.pt.open]);
  return (
    <div className="stage single pt-stage" style={S.pt.open ? undefined : { display: 'none' }} aria-hidden={!S.pt.open}>
      <section className="panel pt-panel" aria-label="PartsTech">
        <div className="head pt-head">
          <span className="label">PartsTech</span>
          {card ? <span className="small">{card.names.length} part{card.names.length > 1 ? 's' : ''} · {card.fit}{card.preferredSupplier ? ' · ' + card.preferredSupplier.supplier + ' first' : ''}{policy().rule === 'availability_then_price' && card.searchUrl ? ' · Fastest Delivery' : ''}</span> : null}
          <span style={{ flex: 1 }} />
          {card && <>
            <button className="btn sm" onClick={() => loadPartstechCard(card, true)}>{card.status === 'loading' ? 'Reading cart…' : 'Refresh cart'}{card.rows.length ? ' (' + card.rows.length + ')' : ''}</button>
            {!native && <a className="btn ghost sm" href={card.redirectUrl} target="_blank" rel="noopener noreferrer" title="If PartsTech does not load here (sign-in blocked in this browser), open it in its own browser tab">Open in browser</a>}
            <button className="btn sm primary" onClick={bringPartstechBack}>Send to repair order</button>
          </>}
        </div>
        {!card
          ? <div style={{ padding: 16 }}>
              <p className="small muted">{roPartList().length ? roPartList().length + ' part' + (roPartList().length > 1 ? 's' : '') + ' on the repair order: ' + roPartList().map(x => bare(x.name).toLowerCase()).join(', ') + '.' : 'No parts on the repair order yet. Add a repair that needs parts, or name a part in the Parts box.'}</p>
              {roPartList().length > 0 && <button className="btn sm primary" onClick={() => sendPartsToPartstech()}>Send them to PartsTech</button>}
            </div>
          : native
            ? <div ref={slot} className="pt-frame" aria-label={'PartsTech: ' + card.names.map(bare).join(', ')} />
            : <PartstechFrame key={card.ref} card={card} />}
      </section>
    </div>
  );
}
