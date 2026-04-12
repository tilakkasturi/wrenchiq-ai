/**
 * WrenchIQ — Repair Order Service
 * Fetches live RO data from the API server (wrenchiq_ro collection),
 * returning null on any failure so the screen falls back to demo data.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Fetch 10 demo-day ROs spread across all 6 Kanban stages.
 * Data comes from wrenchiq_ro; server assigns synthetic Kanban positions.
 * Returns array of ROs already normalized by the server, or null on error.
 */
export async function fetchActiveRepairOrders() {
  try {
    const url = `${API_BASE}/api/repair-orders/demo`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.warn('[repairOrderService] HTTP error', res.status);
      return null;
    }
    const json = await res.json();
    return json.data;
  } catch (err) {
    console.error('[repairOrderService] fetch failed:', err);
    return null;
  }
}

/**
 * Update a repair order's Kanban stage.
 * @param {string} roId  - ro_number (e.g. "RO-PA-2025-00001")
 * @param {string} status - one of the 6 kanban stages
 */
export async function updateROStatus(roId, status) {
  const res = await fetch(`${API_BASE}/api/repair-orders/${roId}/status`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(`Failed to update status: ${res.statusText}`);
  return res.json();
}
