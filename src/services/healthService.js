/**
 * WrenchIQ — Health Service
 * Fetches LLM/SMS dependency health for the Sidecar's startup Health Check
 * screen. Returns null on any failure so the screen can render an honest
 * "couldn't reach the server" state instead of crashing.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function fetchDetailedHealth() {
  try {
    const res = await fetch(`${API_BASE}/api/health/detailed`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) {
      console.warn('[healthService] HTTP error', res.status);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[healthService] fetchDetailedHealth failed:', err);
    return null;
  }
}
