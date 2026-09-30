// Shared wait-time math for the RO queue — used by HealthCheckScreen's
// ShopSnapshot and RepairOrderQueue's wait-time badge (full window mode),
// both reading the same `dateIn` field already returned by
// GET /api/data-feed/customers (see server/services/dataFeedService.js).
export function hoursSince(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, (Date.now() - new Date(dateStr).getTime()) / 3600000);
}

export function formatWaitTime(hours) {
  if (!hours || hours < 1) return `${Math.round((hours || 0) * 60)}m`;
  return `${hours.toFixed(1)}h`;
}
