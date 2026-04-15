/**
 * WrenchIQ — Repair Order Service
 * Fetches live RO data from the API server, returning null on any failure
 * so screens fall back to demoData.js.
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

/**
 * Fetch demo-day ROs for the active shop.
 *
 * shopId = "cornerstone" | "ridgeline" → returns story ROs from RepairOrder collection
 * shopId = null/undefined              → returns generic 10-RO board from wrenchiq_ro
 *
 * Returns array of normalized ROs, or null on error (triggers fallback to demoData.js).
 */
export async function fetchActiveRepairOrders(shopId) {
  try {
    const url = shopId
      ? `${API_BASE}/api/repair-orders/demo?shopId=${encodeURIComponent(shopId)}`
      : `${API_BASE}/api/repair-orders/demo`;
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
 * Fetch a single story RO by ID (includes full agentic fields).
 * Used by Job 1/2/3 screens. Returns null on error.
 */
export async function fetchStoryRO(roId) {
  try {
    const url = `${API_BASE}/api/repair-orders/story-ro/${encodeURIComponent(roId)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.warn('[repairOrderService] story-ro HTTP error', res.status);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[repairOrderService] fetchStoryRO failed:', err);
    return null;
  }
}

/**
 * Partial update a story RO (agenticTextStatus, 3C fields).
 */
export async function updateStoryRO(roId, updates) {
  const res = await fetch(`${API_BASE}/api/repair-orders/story-ro/${encodeURIComponent(roId)}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Failed to update story RO: ${res.statusText}`);
  return res.json();
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
