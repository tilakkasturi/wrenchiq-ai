// Single source of truth for RO dollar totals — used by both the Sidecar
// (WrenchIQSidecarScreen.jsx) and the SMS/DMS RO Viewer
// (RepairOrderViewerScreen.jsx) so the two surfaces never disagree on what a
// story RO adds up to. Most US states don't tax labor on repair invoices but
// do tax parts — this shop's rate (Bay Area, CA) is applied to the parts
// subtotal only.
export const PARTS_TAX_RATE = 0.0875;

// Computes labor/parts/tax breakdown from a normalized RO's `services` array
// (see normalizeStoryRO in server/routes/repairOrders.js) — the shape both
// screens already read `ro.services` in.
export function computeRepairOrderTotal(services = []) {
  let laborSubtotal = 0;
  let partsSubtotal = 0;
  for (const s of services) {
    const hasLabor = (s.laborCost || 0) > 0 || (s.laborHrs || 0) > 0;
    if (hasLabor) laborSubtotal += Math.round(s.laborCost || 0);
    for (const p of (s.parts || [])) {
      partsSubtotal += Math.round(p.cost || 0);
    }
  }
  const subtotal = laborSubtotal + partsSubtotal;
  const tax = Math.round(partsSubtotal * PARTS_TAX_RATE);
  return { laborSubtotal, partsSubtotal, subtotal, tax, grandTotal: subtotal + tax };
}

// Same computation, but directly from raw `repairJobs` entries (the shape
// the Sidecar appends to before persisting — see normalizeStoryRO in
// server/routes/repairOrders.js for the 1:1 field rename into `services`:
// job.lineCost -> service.laborCost, job.parts[].lineCost -> service.parts[].cost).
// Lets the Sidecar show the live total (including this session's
// not-yet-refetched accepts) without waiting on a round trip.
export function computeRepairJobsTotal(repairJobs = []) {
  return computeRepairOrderTotal(
    repairJobs.map((j) => ({
      laborCost: j.lineCost || 0,
      laborHrs:  j.laborHours || 0,
      parts:     (j.parts || []).map((p) => ({ cost: p.lineCost || 0 })),
    }))
  );
}
