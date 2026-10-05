// Client for the server-side parts lookups: NAPA (server/routes/coreParts.js) and PartsTech
// (server/routes/partstech.js). The browser never talks to either supplier: NAPA's catalog is plain
// HTTP only the server can reach, and PartsTech's keys stay on the server.
const API_BASE = import.meta.env.VITE_API_BASE || '';

/** @returns {Promise<{ok:true, ...result} | {ok:false, code:string, message:string}>} */
export async function searchNapa({ year, make, model, part, refresh = false }) {
  try {
    const res = await fetch(`${API_BASE}/api/core/parts/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year, make, model, part, refresh }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, code: body.error || 'error', message: body.message || 'The parts lookup failed.' };
    return { ok: true, ...body };
  } catch (_) {
    return { ok: false, code: 'network', message: 'Could not reach the WrenchIQ server, so I have no prices to show.' };
  }
}

/** How WrenchIQ connects to the NAPA catalog (server/routes/coreParts.js GET /config; no secrets). */
export async function getNapaConfig() {
  try {
    const res = await fetch(`${API_BASE}/api/core/parts/config`);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: body.message || 'Could not read the NAPA configuration.' };
    return { ok: true, config: body };
  } catch (_) {
    return { ok: false, message: 'Could not reach the WrenchIQ server to read the NAPA configuration.' };
  }
}

/* ----- PartsTech (server/routes/partstech.js): punch-out, the advisor picks parts in PartsTech ----- */

async function call(path, init, fallback) {
  try {
    const res = await fetch(`${API_BASE}${path}`, init);
    const body = await res.json().catch(() => ({}));
    // no JSON error: usually an API server started before /api/partstech existed (404 page)
    if (!res.ok) return { ok: false, code: body.error || 'http_' + res.status, message: body.message || fallback + ' The WrenchIQ server answered HTTP ' + res.status + (res.status === 404 ? ': it has no PartsTech route, restart the API server.' : '.') };
    return { ok: true, ...body };
  } catch (_) {
    return { ok: false, code: 'network', message: 'Could not reach the WrenchIQ server, so PartsTech cannot be opened.' };
  }
}

/** Open a PartsTech session for the vehicle + part: { ref, sessionId, redirectUrl, parts: [] }. */
export const startPartstech = ({ vin, year, make, model, part, roId }) =>
  call('/api/partstech/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vin: vin || undefined, year, make, model, part, roId }) }, 'Could not open PartsTech.');

/** The parts picked so far in a PartsTech session; refresh re-reads the cart from PartsTech. */
export const getPartstechSession = (ref, refresh = false) =>
  call(`/api/partstech/sessions/${encodeURIComponent(ref)}${refresh ? '?refresh=1' : ''}`, undefined, 'Could not read the PartsTech cart.');

/** How WrenchIQ connects to PartsTech (GET /api/partstech/config; no secrets). */
export async function getPartstechConfig() {
  const r = await call('/api/partstech/config', undefined, 'Could not read the PartsTech configuration.');
  if (!r.ok) return r;
  const { ok, ...config } = r;
  return { ok: true, config };
}
