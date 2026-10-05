import AVAIL from '../../../resources/shop/parts_availability.json';
import MP from '../../../resources/scheduled_maintenance/maintenance_parts.json';
import { policy } from '../partPolicy';

// Shop profile: "show me the NAPA config". The connection comes from the server (what the catalog
// lookup actually sends); the shop-side rules come from the same resources the repair order uses.

const Row = ({ k, v, note }) => (
  <div className="napa-row"><span className="k">{k}</span><span className="v">{v}{note && <span className="small muted"> · {note}</span>}</span></div>
);
const setting = (s, unit) => (s ? <><span className="mono">{s.value}</span>{unit ? ' ' + unit : ''}{s.label ? ' (' + s.label + ')' : ''}</> : '—');

export function NapaConfigCard({ card }) {
  const c = card.config, n = c.connection;
  return (
    <>
      <div className="label" style={{ marginBottom: 6 }}>NAPA configuration for this shop</div>
      <article className="card napa">
        <section>
          <h3>Connection</h3>
          <Row k="Catalog" v={c.protocol} />
          <Row k="Endpoint" v={<span className="mono">{n.catalogApiUrl.value}</span>} note={n.catalogApiUrl.source} />
          <Row k="Sign-in" v={c.auth} />
          <Row k="Distribution center (DC ID)" v={setting(n.dcId)} note={n.dcId.source} />
          <Row k="Country ID" v={setting(n.countryId)} note={n.countryId.source} />
          <Row k="Customer type ID" v={setting(n.customerTypeId)} note={n.customerTypeId.source} />
          <Row k="Vehicle type ID" v={setting(n.vehicleTypeId)} note={n.vehicleTypeId.source} />
          <Row k="Store ID and password" v={c.storeCredentials.configured ? 'Configured (not shown)' : 'Not configured in WrenchIQ'} note={c.storeCredentials.usedBy} />
        </section>
        <section>
          <h3>How a part is looked up</h3>
          <ol className="small napa-steps">{c.lookup.steps.map(s => <li key={s}>{s}</li>)}</ol>
          <Row k="Results per part" v={'Up to ' + c.lookup.maxRows} />
          <Row k="Saved results" v={c.lookup.cacheTtlMinutes + ' minutes per vehicle and part'} />
          <Row k="Scope" v={c.lookup.readOnly} />
        </section>
        <section>
          <h3>Price and availability</h3>
          <Row k="Price" v={c.pricing} />
          <Row k="Availability" v={AVAIL.basis} note="from resources/shop/parts_availability.json; live stock needs NAPA's Price/Availability API" />
          <div className="small muted napa-tiers">{AVAIL.tiers.map(t => t.label + ' (' + t.short + ')').join(' · ')}</div>
        </section>
        <section>
          <h3>Your shop's rules</h3>
          <Row k="Parts choice" v={policy().label} note="Shop profile" />
          <Row k="Quantity" v={'"(n)" in a part name is the quantity; spark plugs and ignition coils are one per cylinder (resources/vehicle/engine_cylinders.json)'} />
          <Row k="Maintenance parts" v={Object.keys(MP.parts).length + ' schedule items mapped to parts'} note="resources/scheduled_maintenance/maintenance_parts.json" />
        </section>
        <details className="napa-terms">
          <summary className="small"><b>Part name → NAPA search term</b> <span className="muted">({c.terms.length} rules, first match wins)</span></summary>
          <table className="small"><tbody>{c.terms.map(t => <tr key={t.match}><td className="mono">{t.match}</td><td>{t.term}</td></tr>)}</tbody></table>
        </details>
      </article>
    </>
  );
}
