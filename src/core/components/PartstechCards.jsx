import { policy } from '../partPolicy';

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
