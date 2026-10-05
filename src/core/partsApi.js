// Client for the server-side NAPA lookup (server/routes/coreParts.js). The browser never talks
// to NAPA: the catalog is plain HTTP and only the server can reach it.
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
