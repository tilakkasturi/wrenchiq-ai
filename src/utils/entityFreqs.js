/**
 * Entity frequency helpers — ported from ro-ner-demo's ner_app.html
 * (RelationshipsTab / "Top N Clusters" tab), so WrenchIQ can compute the same
 * Pareto-style breakdowns client-side from /api/predii-learn/run results
 * without a dedicated clustering endpoint.
 */

export const ENTITY_TYPES = ["symptom", "repair_job", "repair", "dtc_code"];

export function topN(items, n = 10) {
  const freq = {};
  items.forEach((v) => { freq[v] = (freq[v] || 0) + 1; });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, value]) => ({ name, value }));
}

export function buildEntityFreqs(results) {
  const all = Object.fromEntries(ENTITY_TYPES.map((t) => [t, []]));
  results.forEach((r) => {
    ENTITY_TYPES.forEach((t) => {
      (r.entities?.[t] || []).forEach((v) => all[t].push(v.toLowerCase().trim()));
    });
  });
  return all;
}
