// ============================================================
// WrenchIQ — Rule-Based Recommendation Fallback Engine
// ============================================================
// Runs client-side when /api/recommendations returns 503 or times out.
// Produces the same output shape as the backend Recommendations API.
//
// Usage:
//   import { generateFallbackRecommendations } from './recommendationFallback';
//   const { recommendations } = generateFallbackRecommendations(snapshot, edition, persona);
// ============================================================

/**
 * Generate a stable-ish unique ID for a fallback recommendation.
 * @param {string} domain
 * @returns {string}
 */
function makeId(domain) {
  return `fallback-${domain}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Return minutes elapsed since an ISO timestamp string.
 * Returns Infinity if the timestamp is missing or unparseable.
 * @param {string|null|undefined} isoString
 * @returns {number}
 */
function minutesSince(isoString) {
  if (!isoString) return Infinity;
  const ts = Date.parse(isoString);
  if (isNaN(ts)) return Infinity;
  return (Date.now() - ts) / 60000;
}

/**
 * Format a decimal number of minutes into a human-readable string.
 * e.g. 95 -> "1 hr 35 min", 60 -> "1 hr", 45 -> "45 min"
 * @param {number} minutes
 * @returns {string}
 */
function formatWaitTime(minutes) {
  const m = Math.round(minutes);
  if (m < 60) return `${m} min`;
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  if (rem === 0) return `${hrs} hr`;
  return `${hrs} hr ${rem} min`;
}

/**
 * Format a dollar amount with no cents if whole, or 2 decimal places.
 * @param {number} amount
 * @returns {string}
 */
function formatDollars(amount) {
  if (!amount && amount !== 0) return '$0';
  const rounded = Math.round(amount * 100) / 100;
  return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2)}`;
}

// ── Rule implementations ─────────────────────────────────────

/**
 * UTILIZATION — customer has been waiting > 90 minutes.
 * Generates one recommendation per qualifying RO (de-duplicated later by limit).
 * @param {object[]} openROs
 * @param {string} edition
 * @returns {object[]}
 */
function ruleCustomerWaiting(openROs, edition) {
  const results = [];

  for (const ro of openROs) {
    const waited = minutesSince(ro.waitingSince);
    if (waited <= 90) continue;

    const waitLabel = formatWaitTime(waited);
    const roNum = ro.id || ro.roNumber || 'unknown';
    const bay = ro.bay ? `Bay ${ro.bay}` : 'the shop';

    results.push({
      id: makeId('utilization'),
      domain: 'utilization',
      priority: 'high',
      screenContext: ['orders'],
      roNumber: roNum,
      personas: {
        owner: {
          headline: 'Customer wait time critical',
          explanation: `A vehicle has been waiting ${waitLabel}. Late delivery risks a negative review and loyalty loss.`,
          metrics: { waitMinutes: Math.round(waited) },
        },
        advisor: {
          headline: 'Check in with waiting customer',
          explanation: `RO #${roNum} customer has been waiting ${waitLabel} — call or text an update now.`,
          metrics: { waitMinutes: Math.round(waited) },
        },
        tech: {
          headline: 'Prioritize waiting bay',
          explanation: `${bay} vehicle needs attention — customer has been waiting ${waitLabel}.`,
          metrics: { waitMinutes: Math.round(waited) },
        },
      },
      signal: { roNumber: roNum, waitingSince: ro.waitingSince, waitMinutes: Math.round(waited) },
    });
  }

  return results;
}

/**
 * UTILIZATION — actual ELR is < 85% of target ELR.
 * @param {object} metrics
 * @param {string} edition
 * @returns {object[]}
 */
function ruleElrBelowThreshold(metrics, edition) {
  const { actualELR, targetELR } = metrics;
  if (!actualELR || !targetELR) return [];
  if (actualELR >= targetELR * 0.85) return [];

  const dashboardScreen = edition === 'oem' ? 'fixedOpsDashboard' : 'dashboard';
  const gap = formatDollars(targetELR - actualELR);
  const target = formatDollars(targetELR);
  const actual = formatDollars(actualELR);

  const ownerHeadline =
    edition === 'oem'
      ? `ELR ${gap} below Fixed Ops target (${target})`
      : `ELR ${gap} below target (${target})`;

  const ownerExplanation =
    edition === 'oem'
      ? `Fixed Ops effective labor rate is tracking at ${actual}, below the ${target}/hr target. Review flagged vs actual hours.`
      : `Effective labor rate is tracking at ${actual}, below the ${target}/hr target. Review flagged vs actual hours.`;

  return [
    {
      id: makeId('utilization'),
      domain: 'utilization',
      priority: 'medium',
      screenContext: [dashboardScreen, 'fixedOpsDashboard'],
      roNumber: null,
      personas: {
        owner: {
          headline: ownerHeadline,
          explanation: ownerExplanation,
          metrics: { actualELR, targetELR },
        },
        advisor: {
          headline: 'Labor rate opportunity',
          explanation: `Shop ELR is below target (${actual} vs ${target}). Upselling declined services would improve the rate.`,
          metrics: { actualELR, targetELR },
        },
        tech: {
          headline: 'Efficiency check',
          explanation: `Shop ELR is below target (${actual} vs ${target}). Ensure all hours are being clocked correctly.`,
          metrics: { actualELR, targetELR },
        },
      },
      signal: { actualELR, targetELR, gap: targetELR - actualELR },
    },
  ];
}

/**
 * REVENUE — highest declined total on any open RO > $150.
 * @param {object[]} openROs
 * @returns {object[]}
 */
function ruleDeclinedServices(openROs) {
  // Find RO with highest declinedTotal above threshold
  let best = null;
  for (const ro of openROs) {
    const declined = ro.declinedTotal ?? 0;
    if (declined > 150) {
      if (!best || declined > (best.declinedTotal ?? 0)) {
        best = ro;
      }
    }
  }
  if (!best) return [];

  const roNum = best.id || best.roNumber || 'unknown';
  const declinedAmt = formatDollars(best.declinedTotal);
  // Estimate re-presentation lift as one item (30% of declined total as heuristic)
  const liftAmt = formatDollars(Math.round(best.declinedTotal * 0.3));
  // Attempt to find the first declined service name
  const declinedServices = (best.services || []).filter(
    (s) => s.status === 'declined' || s.status === 'customer_declined',
  );
  const serviceName =
    declinedServices.length > 0
      ? declinedServices[0].name
      : 'declined service';

  return [
    {
      id: makeId('revenue'),
      domain: 'revenue',
      priority: 'high',
      screenContext: ['orders'],
      roNumber: roNum,
      personas: {
        owner: {
          headline: `${declinedAmt} in declined services today`,
          explanation: `RO #${roNum} has ${declinedAmt} in declined services. Re-presenting one item could lift ticket by ${liftAmt}.`,
          metrics: { declinedTotal: best.declinedTotal, liftEstimate: Math.round(best.declinedTotal * 0.3) },
        },
        advisor: {
          headline: 'Re-present declined service',
          explanation: `Customer declined ${serviceName}. Offer a bundled discount — this is a ${liftAmt} revenue opportunity.`,
          metrics: { declinedTotal: best.declinedTotal },
        },
        tech: {
          headline: 'Declined work on your RO',
          explanation: `Customer declined ${serviceName} on RO #${roNum}. Tech should note condition for next visit.`,
          metrics: { declinedTotal: best.declinedTotal },
        },
      },
      signal: { roNumber: roNum, declinedTotal: best.declinedTotal, serviceName },
    },
  ];
}

/**
 * REVENUE — ELR below target (gap rec, lower priority than threshold rec).
 * Only fires if actualELR < targetELR (broader than the 85% utilization rule).
 * @param {object} metrics
 * @param {string} edition
 * @returns {object[]}
 */
function ruleElrGap(metrics, edition) {
  const { actualELR, targetELR } = metrics;
  if (!actualELR || !targetELR) return [];
  // Only fire if NOT already covered by ruleElrBelowThreshold (i.e. between 85-100%)
  if (actualELR < targetELR * 0.85) return [];
  if (actualELR >= targetELR) return [];

  const dashboardScreen = edition === 'oem' ? 'fixedOpsDashboard' : 'dashboard';
  const gap = formatDollars(targetELR - actualELR);
  const target = formatDollars(targetELR);
  const actual = formatDollars(actualELR);

  const ownerHeadline =
    edition === 'oem'
      ? `Fixed Ops ELR gap: ${gap} below target`
      : `ELR gap: ${gap} below target`;

  const ownerExplanation =
    edition === 'oem'
      ? `Fixed Ops ELR is ${actual} vs target ${target}. Small improvements in service presentation can close this gap.`
      : `Shop ELR is ${actual} vs target ${target}. Small improvements in service presentation can close this gap.`;

  return [
    {
      id: makeId('revenue'),
      domain: 'revenue',
      priority: 'medium',
      screenContext: [dashboardScreen, 'fixedOpsDashboard'],
      roNumber: null,
      personas: {
        owner: {
          headline: ownerHeadline,
          explanation: ownerExplanation,
          metrics: { actualELR, targetELR },
        },
        advisor: {
          headline: 'Opportunity to improve ELR',
          explanation: `ELR is ${actual} vs target ${target}. Each upsold service brings the rate closer to target.`,
          metrics: { actualELR, targetELR },
        },
        tech: {
          headline: 'ELR slightly below target',
          explanation: `Shop ELR is ${actual} vs target ${target}. Accurate clock-in/out helps close the gap.`,
          metrics: { actualELR, targetELR },
        },
      },
      signal: { actualELR, targetELR, gap: targetELR - actualELR },
    },
  ];
}

/**
 * CUSTOMER_RISK — VIP/loyal customer awaiting estimate approval.
 * @param {object[]} openROs
 * @param {string} edition
 * @returns {object[]}
 */
function ruleLoyalCustomerAwaiting(openROs, edition) {
  const results = [];

  for (const ro of openROs) {
    const isLoyalTier =
      ro.loyaltyTier === 'vip' || ro.loyaltyTier === 'loyal';
    const isWaitingForApproval =
      ro.status === 'estimate' ||
      ro.status === 'estimate_sent' ||
      ro.status === 'awaiting_approval';

    if (!isLoyalTier || !isWaitingForApproval) continue;

    const roNum = ro.id || ro.roNumber || 'unknown';
    const tierLabel = ro.loyaltyTier === 'vip' ? 'VIP' : 'loyal';

    const ownerHeadline =
      edition === 'oem'
        ? `${tierLabel.toUpperCase()} customer awaiting estimate`
        : `Loyal customer awaiting estimate`;

    const ownerExplanation =
      edition === 'oem'
        ? `A ${tierLabel} customer on RO #${roNum} is waiting for estimate approval. Prioritize follow-up to protect Fixed Ops CSI score.`
        : `A ${tierLabel} customer on RO #${roNum} is waiting for estimate approval. Prompt follow-up protects loyalty and referrals.`;

    results.push({
      id: makeId('customer_risk'),
      domain: 'customer_risk',
      priority: 'medium',
      screenContext: ['orders'],
      roNumber: roNum,
      personas: {
        owner: {
          headline: ownerHeadline,
          explanation: ownerExplanation,
          metrics: { loyaltyTier: ro.loyaltyTier },
        },
        advisor: {
          headline: `Follow up with ${tierLabel} customer`,
          explanation: `RO #${roNum} belongs to a ${tierLabel} customer waiting on estimate approval. Call or text now to stay ahead of frustration.`,
          metrics: { loyaltyTier: ro.loyaltyTier },
        },
        tech: {
          headline: `${tierLabel.toUpperCase()} customer — prioritize`,
          explanation: `The ${tierLabel} customer on RO #${roNum} is awaiting approval. Be ready to start immediately once approved.`,
          metrics: { loyaltyTier: ro.loyaltyTier },
        },
      },
      signal: { roNumber: roNum, loyaltyTier: ro.loyaltyTier, status: ro.status },
    });
  }

  return results;
}

/**
 * CUSTOMER_RISK — average wait time across shop > 120 minutes.
 * @param {object} metrics
 * @param {string} edition
 * @returns {object[]}
 */
function ruleLongShopWaitTime(metrics, edition) {
  const { avgWaitTime } = metrics;
  if (!avgWaitTime || avgWaitTime <= 120) return [];

  const waitLabel = formatWaitTime(avgWaitTime);
  const dashboardScreen = edition === 'oem' ? 'fixedOpsDashboard' : 'dashboard';

  const ownerHeadline =
    edition === 'oem'
      ? `Shop avg wait ${waitLabel} — Fixed Ops CSI at risk`
      : `Shop avg wait time ${waitLabel}`;

  const ownerExplanation =
    edition === 'oem'
      ? `Average customer wait time is ${waitLabel}. Elevated wait times damage Fixed Ops CSI scores and OEM standing.`
      : `Average customer wait time is ${waitLabel}. This is above the 2-hour threshold and risks negative reviews.`;

  return [
    {
      id: makeId('customer_risk'),
      domain: 'customer_risk',
      priority: 'medium',
      screenContext: [dashboardScreen, 'orders'],
      roNumber: null,
      personas: {
        owner: {
          headline: ownerHeadline,
          explanation: ownerExplanation,
          metrics: { avgWaitTime },
        },
        advisor: {
          headline: 'Proactive customer communication needed',
          explanation: `Shop average wait is ${waitLabel}. Proactively reach out to customers about status to prevent frustration.`,
          metrics: { avgWaitTime },
        },
        tech: {
          headline: 'Clear bay backlog',
          explanation: `Average wait time is ${waitLabel}. Focus on completing in-progress jobs to reduce the queue.`,
          metrics: { avgWaitTime },
        },
      },
      signal: { avgWaitTime },
    },
  ];
}

/**
 * ANOMALY — ELR in last 7 days dropped > 10% vs the prior average embedded in history.
 * Uses metrics.last7DaysELR vs metrics.actualELR as a proxy for prior-period average.
 * Falls back to comparing last7DaysELR against targetELR if actualELR isn't meaningful.
 * @param {object} metrics
 * @param {object[]} history  - last 7 days closed ROs
 * @param {string} edition
 * @returns {object[]}
 */
function ruleElrAnomalyDrop(metrics, history, edition) {
  const { last7DaysELR, actualELR, targetELR } = metrics;
  if (!last7DaysELR) return [];

  // Compute a "prior" reference: average ELR from history if available,
  // otherwise use actualELR (today's) as the benchmark.
  let priorELR = null;

  if (history && history.length > 0) {
    const elrValues = history
      .map((ro) => ro.laborTimeTracking?.elr)
      .filter((v) => typeof v === 'number' && v > 0);
    if (elrValues.length > 0) {
      priorELR = elrValues.reduce((sum, v) => sum + v, 0) / elrValues.length;
    }
  }

  // Fallback: use actualELR as prior benchmark
  if (!priorELR && actualELR) priorELR = actualELR;
  // Last fallback: use target
  if (!priorELR && targetELR) priorELR = targetELR;
  if (!priorELR) return [];

  const dropRatio = (priorELR - last7DaysELR) / priorELR;
  if (dropRatio <= 0.1) return [];

  const dropPct = Math.round(dropRatio * 100);
  const dashboardScreen = edition === 'oem' ? 'fixedOpsDashboard' : 'dashboard';
  const last7 = formatDollars(last7DaysELR);
  const prior = formatDollars(priorELR);

  const ownerHeadline =
    edition === 'oem'
      ? `Fixed Ops ELR dropped ${dropPct}% over 7 days`
      : `ELR anomaly: ${dropPct}% drop this week`;

  const ownerExplanation =
    edition === 'oem'
      ? `7-day ELR is ${last7} vs prior average of ${prior} — a ${dropPct}% decline. Investigate labor mix and Fixed Ops efficiency.`
      : `7-day ELR is ${last7} vs prior average of ${prior} — a ${dropPct}% decline. Investigate labor mix and advisor performance.`;

  return [
    {
      id: makeId('anomaly'),
      domain: 'anomaly',
      priority: 'medium',
      screenContext: [dashboardScreen, 'fixedOpsDashboard'],
      roNumber: null,
      personas: {
        owner: {
          headline: ownerHeadline,
          explanation: ownerExplanation,
          metrics: { last7DaysELR, priorELR, dropPct },
        },
        advisor: {
          headline: `ELR trend down ${dropPct}% this week`,
          explanation: `Shop ELR has fallen from ${prior} to ${last7} over the past 7 days. Focus on presenting full-scope work.`,
          metrics: { last7DaysELR, priorELR, dropPct },
        },
        tech: {
          headline: `ELR declining — clock accuracy matters`,
          explanation: `7-day ELR is down ${dropPct}% (${prior} to ${last7}). Verify all hours are clocked to the correct RO.`,
          metrics: { last7DaysELR, priorELR, dropPct },
        },
      },
      signal: { last7DaysELR, priorELR, dropPct },
    },
  ];
}

/**
 * ANOMALY — open RO flagged as a comeback repair.
 * @param {object[]} openROs
 * @returns {object[]}
 */
function ruleComebackRO(openROs) {
  const results = [];

  for (const ro of openROs) {
    if (!ro.comebackRO) continue;

    const roNum = ro.id || ro.roNumber || 'unknown';

    results.push({
      id: makeId('anomaly'),
      domain: 'anomaly',
      priority: 'high',
      screenContext: ['orders'],
      roNumber: roNum,
      personas: {
        owner: {
          headline: 'Comeback vehicle in shop',
          explanation: `RO #${roNum} is a comeback repair. Review what was missed and consider waiving labor.`,
          metrics: {},
        },
        advisor: {
          headline: 'Handle comeback with care',
          explanation: `This vehicle returned for a related issue. Waive labor and over-communicate to protect the relationship.`,
          metrics: {},
        },
        tech: {
          headline: 'Comeback repair assigned',
          explanation: `RO #${roNum} is a comeback. Review the prior repair before proceeding.`,
          metrics: {},
        },
      },
      signal: { roNumber: roNum, comebackRO: true },
    });
  }

  return results;
}

// ── Main export ──────────────────────────────────────────────

/**
 * Generate rule-based recommendations when the backend API is unavailable.
 *
 * @param {object} snapshot
 * @param {object[]} snapshot.repairOrders        - Today's open ROs (camelCase schema)
 * @param {object[]} snapshot.repairOrderHistory  - Last 7 days closed ROs
 * @param {object}  snapshot.metrics              - Shop-level KPIs
 * @param {number}  snapshot.metrics.shopLaborRate
 * @param {number}  snapshot.metrics.targetELR
 * @param {number}  snapshot.metrics.actualELR
 * @param {number}  snapshot.metrics.avgWaitTime   - in minutes
 * @param {number}  snapshot.metrics.last7DaysRevenue
 * @param {number}  snapshot.metrics.last7DaysELR
 *
 * @param {string} edition  - 'am' (aftermarket) | 'oem'
 * @param {string} persona  - 'owner' | 'advisor' | 'tech' (for future filtering; not used to prune here)
 *
 * @returns {{ recommendations: object[] }}
 */
export function generateFallbackRecommendations(snapshot, edition = 'am', persona = 'owner') {
  const openROs = (snapshot && snapshot.repairOrders) || [];
  const history = (snapshot && snapshot.repairOrderHistory) || [];
  const metrics = (snapshot && snapshot.metrics) || {};
  const ed = edition === 'oem' ? 'oem' : 'am';

  const all = [
    // high priority rules first (comeback + waiting)
    ...ruleComebackRO(openROs),
    ...ruleCustomerWaiting(openROs, ed),
    ...ruleDeclinedServices(openROs),
    // medium priority rules
    ...ruleElrBelowThreshold(metrics, ed),
    ...ruleLoyalCustomerAwaiting(openROs, ed),
    ...ruleLongShopWaitTime(metrics, ed),
    ...ruleElrGap(metrics, ed),
    ...ruleElrAnomalyDrop(metrics, history, ed),
  ];

  // Sort: high > medium > low, then preserve original rule ordering within tier
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  all.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  // Return at most 6 recommendations
  const recommendations = all.slice(0, 6);

  return { recommendations };
}
