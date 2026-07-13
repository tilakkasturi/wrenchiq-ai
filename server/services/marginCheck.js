/**
 * WrenchIQ — RO Margin Checker
 *
 * Deterministic margin computation for the active RO — no LLM involved, this
 * is plain arithmetic against config the shop has already entered (Settings
 * → ARO & Margin tab, `shop_config` collection).
 *
 * `service.laborCost`/`service.partsCost` on a story RO (see
 * repairOrders.js normalizeStoryRO) are BILLED amounts, not the shop's cost
 * basis — the cost basis comes from `shop_config.laborCost` ($/hr) for labor,
 * and a 52% COGS proxy for parts (no per-RO `grossMarginPct` exists today;
 * this proxy already backs the 90-day snapshot's partsMargin — see
 * snapshotBuilder.js).
 */

const PARTS_COGS_PROXY = 0.52;
const AT_RISK_BUFFER_PTS = 2;

export function computeMarginCheck(ro, shopConfig) {
  const services = ro.services || [];

  const laborRevenue = services.reduce((s, svc) => s + (svc.laborCost || 0), 0);
  const laborActualHrs = services.reduce((s, svc) => s + (svc.actualHrs || svc.laborHrs || 0), 0);
  const laborCostBasis = laborActualHrs * (shopConfig.laborCost || 0);

  const partsRevenue = services.reduce((s, svc) => s + (svc.partsCost || 0), 0);
  const partsCostBasis = partsRevenue * PARTS_COGS_PROXY;

  const totalRevenue = laborRevenue + partsRevenue;
  const totalCost = laborCostBasis + partsCostBasis;
  const marginPct = totalRevenue > 0 ? Math.round(((totalRevenue - totalCost) / totalRevenue) * 1000) / 10 : null;

  const target = shopConfig.partsMarginTarget;
  let status = null;
  if (marginPct != null && typeof target === 'number') {
    if (marginPct >= target) status = 'on-target';
    else if (marginPct >= target - AT_RISK_BUFFER_PTS) status = 'at-risk';
    else status = 'below-target';
  }

  return { marginPct, target, status, laborRevenue, partsRevenue, totalRevenue };
}
