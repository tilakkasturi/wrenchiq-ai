/**
 * WrenchIQ — SAMPLE parts availability for the Core assistant.
 *
 * NAPA's catalog search carries list prices but no stock, and the shop's parts policy is
 * availability first (resources/shop/core_shop_profile.json → partsPolicy). Until a real source
 * is connected, resources/shop/parts_availability.json supplies demo tiers: an explicit override
 * per "LINE|PARTNUMBER", otherwise a stable weighted pick from the part number, so the same part
 * always shows the same availability. Every value is marked `sample: true` and the response
 * carries `availabilityBasis`, so the UI and the agent never present it as live stock.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILE = fileURLToPath(new URL('../../resources/shop/parts_availability.json', import.meta.url));

/** Read per call: the file is small and editing it should not need a server restart. */
function load() {
  return JSON.parse(readFileSync(FILE, 'utf8'));
}

/** FNV-1a: a stable, well-spread hash of the part key. */
function hash(s) {
  let h = 0x811c9dc5;
  for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

export function tierFor(key, cfg) {
  const byTier = Object.fromEntries(cfg.tiers.map(t => [t.tier, t]));
  if (cfg.overrides?.[key] !== undefined && byTier[cfg.overrides[key]]) return byTier[cfg.overrides[key]];
  const total = cfg.tiers.reduce((a, t) => a + (t.weight || 1), 0);
  let n = hash(key) % total;
  for (const t of cfg.tiers) { n -= t.weight || 1; if (n < 0) return t; }
  return cfg.tiers.at(-1);
}

/** A copy of a parts lookup result with sample availability on every row. */
export function withSampleAvailability(result, cfg = load()) {
  return {
    ...result,
    availabilityBasis: cfg.basis,
    parts: (result.parts || []).map(row => {
      const t = tierFor(row.lineCode + '|' + row.partNumber, cfg);
      return { ...row, availability: { sample: true, tier: t.tier, label: t.label, short: t.short, etaHours: t.etaHours } };
    }),
  };
}
