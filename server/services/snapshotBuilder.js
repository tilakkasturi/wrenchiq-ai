/**
 * WrenchIQ — Snapshot Builder
 *
 * Builds a unified shop snapshot from MongoDB for the recommendation engine.
 * Reads from two collections:
 *   - RepairOrder  (camelCase, rich demo data — AM edition primary)
 *   - wrenchiq_ro  (snake_case, production import — OEM edition / fallback)
 *
 * Returns a normalized snapshot object consumed by recommendationLLM.js.
 */

const CAMEL_COLL = 'RepairOrder';
const SNAKE_COLL = 'wrenchiq_ro';
const TARGET_ELR = 195; // posted labor rate for shop-001

/**
 * Normalize a camelCase RepairOrder document into unified snapshot shape.
 */
function normalizeCalmelRO(ro) {
  const svc = (ro.services || []);
  const declinedTotal = (ro.declinedServices || []).reduce((s, d) => s + (d.estimatedCost || 0), 0);
  const laborRevenue  = svc.reduce((s, l) => s + (l.laborCost || l.laborTotal || 0), 0);
  const partsRevenue  = svc.reduce((s, l) => s + (l.partsCost || l.partsCharged || 0), 0);
  const totalRevenue  = laborRevenue + partsRevenue + (ro.taxAmount || 0);

  const ltt = ro.laborTimeTracking || {};

  return {
    roNumber:          ro.id || ro.roNumber || '',
    status:            ro.status || '',
    bay:               ro.bay || null,
    dateIn:            ro.dateIn || null,
    closedDate:        ro.closedDate || null,
    waitingSince:      ro.waitingSince || ro.dateIn || null,
    techId:            ro.techId || null,
    techName:          ro.techName || null,
    advisorId:         ro.advisorId || null,
    advisorName:       ro.advisorName || null,
    locationId:        ro.locationId || null,
    upsellFlag:        ro.upsellFlag || false,
    upsellConverted:   ro.upsellConverted || false,
    customerId:        ro.customerId || null,
    loyaltyTier:       ro.loyaltyTier || null,
    customerVisitCount: ro.customerVisitCount || null,
    vehicleOrigin:     ro.vehicleOrigin || null,
    effectiveLaborRate: ltt.elr || 0,
    totalActualHrs:    ltt.totalActualHrs || svc.reduce((s, l) => s + (l.actualHrs || 0), 0),
    totalFlaggedHrs:   ltt.totalFlatHrs   || svc.reduce((s, l) => s + (l.laborHrs  || 0), 0),
    laborRevenue,
    partsRevenue,
    totalRevenue,
    declinedTotal,
    grossMarginPct:    ro.grossMarginPct || null,
    services: svc.map(s => ({
      description:  s.name || s.description || '',
      laborHrs:     s.laborHrs  || 0,
      actualHrs:    s.actualHrs || 0,
      laborCost:    s.laborCost || s.laborTotal || 0,
      partsCost:    s.partsCost || s.partsCharged || 0,
      status:       s.status || '',
    })),
    declinedServices: (ro.declinedServices || []).map(d => ({
      description:    d.name || d.description || '',
      estimatedCost:  d.estimatedCost || 0,
    })),
  };
}

/**
 * Normalize a snake_case wrenchiq_ro document into unified snapshot shape.
 */
function normalizeSnakeRO(ro) {
  const jobs = (ro.repair_jobs || []);
  const laborRevenue  = jobs.reduce((s, j) => s + (j.labor_cost || 0), 0);
  const partsRevenue  = jobs.reduce((s, j) =>
    s + (j.parts || []).reduce((ps, p) => ps + ((p.unit_price || 0) * (p.quantity || 1)), 0), 0);
  const totalRevenue  = laborRevenue + partsRevenue;
  const ltt = ro.labor_time_tracking || {};

  return {
    roNumber:          ro.ro_number || ro.id || '',
    status:            ro.status || '',
    bay:               ro.bay || null,
    dateIn:            ro.date_in || null,
    closedDate:        ro.closed_date || null,
    waitingSince:      ro.waiting_since || ro.date_in || null,
    techId:            ro.tech?.id || null,
    techName:          ro.tech?.name || null,
    customerId:        ro.customer?.id || null,
    loyaltyTier:       ro.customer?.loyaltyTier || null,
    customerVisitCount: ro.customer?.visitCount || null,
    vehicleOrigin:     ro.vehicle_origin || null,
    effectiveLaborRate: ltt.elr || 0,
    totalActualHrs:    ltt.totalActualHrs || jobs.reduce((s, j) => s + (j.actual_labor_hours || 0), 0),
    totalFlaggedHrs:   ltt.totalFlatHrs   || jobs.reduce((s, j) => s + (j.labor_hours || 0), 0),
    laborRevenue,
    partsRevenue,
    totalRevenue,
    declinedTotal:     0,  // snake_case schema does not carry declined services
    grossMarginPct:    null,
    services: jobs.map(j => ({
      description: j.repair_job || j.description || '',
      laborHrs:    j.labor_hours || 0,
      actualHrs:   j.actual_labor_hours || 0,
      laborCost:   j.labor_cost || 0,
      partsCost:   (j.parts || []).reduce((s, p) => s + ((p.unit_price || 0) * (p.quantity || 1)), 0),
      status:      j.status || '',
    })),
    declinedServices: [],
  };
}

/**
 * Compute wall-clock wait minutes from an ISO timestamp to now.
 */
function minutesSince(isoStr) {
  if (!isoStr) return null;
  const diff = Date.now() - new Date(isoStr).getTime();
  return diff > 0 ? Math.round(diff / 60000) : 0;
}

/**
 * Rebase stale open RO timestamps to today so demo data is always current.
 *
 * If the most recent open RO dateIn is older than 2 days, all open ROs are
 * rebased to today using fixed realistic intra-day offsets (minutes from 7 AM).
 * Estimates get a waitingSince matching their rebased dateIn.
 * Approved/in-progress ROs get waitingSince = null (work is underway).
 *
 * This is idempotent — if dates are already fresh, no changes are made.
 */
function rebaseDemoOpenROs(openROs, now) {
  if (openROs.length === 0) return openROs;

  const twoDaysAgo = now.getTime() - 2 * 24 * 60 * 60 * 1000;
  const mostRecent = openROs.reduce((max, ro) => {
    const t = ro.dateIn ? new Date(ro.dateIn).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  if (mostRecent >= twoDaysAgo) return openROs; // already fresh

  // Minutes from 7:00 AM today. Negative = before 7 AM (i.e. yesterday afternoon).
  // Approved ROs (in bay): spread through morning; one complex job from yesterday (-1080 = yesterday 1 PM).
  // Estimate ROs (awaiting approval): all from this morning — 2 to 6 hour waits.
  // Sort order: approved first (indices 0-6), estimates last (indices 7-9).
  const OFFSETS = [30, 60, 105, 135, 210, 240, -1080, 90, 120, 165];

  const todayOpen = new Date(now);
  todayOpen.setHours(7, 0, 0, 0); // 7:00 AM today

  // Sort: approved first (come in earlier), estimates after
  const sorted = [...openROs].sort((a, b) => {
    const order = { approved: 0, active: 0, in_progress: 0, estimate: 1, estimate_sent: 1 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2);
  });

  return sorted.map((ro, i) => {
    const offsetMin = OFFSETS[i] ?? (30 + i * 30);
    const newDateIn = new Date(todayOpen.getTime() + offsetMin * 60 * 1000).toISOString();
    const isEstimate = ro.status === 'estimate' || ro.status === 'estimate_sent' || ro.status === 'awaiting_approval';
    return {
      ...ro,
      dateIn:       newDateIn,
      waitingSince: isEstimate ? newDateIn : null,
    };
  });
}

/**
 * Build a shop snapshot for the AI recommendation engine.
 *
 * @param {string} shopId   - e.g. 'shop-001'
 * @param {string} edition  - 'am' | 'oem'
 * @param {object} db       - MongoDB Db instance (from req.db)
 * @returns {object} snapshot
 */
/**
 * Rebase stale closed RO closedDates to within the last 7 days so revenue
 * metrics always show data regardless of when the demo is run.
 *
 * Distributes closed ROs evenly across the last 7 days, preserving their
 * original relative order. Only triggers when the most recent closedDate
 * is older than 7 days.
 */
function rebaseDemoClosedROs(closedROs, now) {
  if (closedROs.length === 0) return closedROs;

  const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const mostRecent = closedROs.reduce((max, ro) => {
    const t = ro.closedDate ? new Date(ro.closedDate).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  if (mostRecent >= sevenDaysAgo) return closedROs; // already within window

  // Spread ROs across the last 7 days: earliest gets day-7, latest gets today
  const sorted = [...closedROs].sort((a, b) =>
    new Date(a.closedDate || 0).getTime() - new Date(b.closedDate || 0).getTime()
  );

  const count = sorted.length;
  const windowMs = 7 * 24 * 60 * 60 * 1000;

  return sorted.map((ro, i) => {
    // Spread evenly; bias toward earlier in the window for most, a few today
    const fraction = count > 1 ? i / (count - 1) : 1;
    const offsetMs = Math.round(fraction * windowMs);
    const newClosedDate = new Date(sevenDaysAgo + offsetMs).toISOString();
    return { ...ro, closedDate: newClosedDate };
  });
}

// ── Helper: arithmetic mean ───────────────────────────────────────────────────
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + (v || 0), 0) / arr.length;
}

// ── Helper: group array by key function ──────────────────────────────────────
function groupBy(arr, keyFn) {
  const map = {};
  for (const item of arr) {
    const k = keyFn(item);
    if (k == null) continue;
    if (!map[k]) map[k] = [];
    map[k].push(item);
  }
  return map;
}

/**
 * Build a 90-day analytics snapshot for a shop/location.
 *
 * @param {string} shopId      - e.g. 'shop-001' or 'all'
 * @param {string} locationId  - e.g. 'loc-001' or 'all'
 * @param {object} db          - MongoDB Db instance
 * @returns {object} snapshot
 */
export async function buildSnapshot90d(shopId, locationId, db) {
  const ninety = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const query = {
    status: 'closed',
    $or: [
      { closedDate: { $gte: ninety.toISOString() } },
      { dateIn:     { $gte: ninety.toISOString() } },
    ],
  };
  if (shopId !== 'all')                      query.shopId = shopId;
  if (locationId && locationId !== 'all')    query.locationId = locationId;

  let rawDocs = [];
  try {
    rawDocs = await db.collection(CAMEL_COLL).find(query).toArray();
  } catch (err) {
    console.warn('buildSnapshot90d: query failed:', err.message);
  }

  const ros = rawDocs.map(normalizeCalmelRO);

  // ── avgRO ────────────────────────────────────────────────────────────────────
  const byLocGroup = groupBy(ros, r => r.locationId || 'all');
  const byLocation = {};
  for (const [loc, group] of Object.entries(byLocGroup)) {
    byLocation[loc] = Math.round(mean(group.map(r => r.totalRevenue)));
  }
  const avgRO = {
    overall: Math.round(mean(ros.map(r => r.totalRevenue))),
    byLocation,
  };

  // ── bayUtilization ──────────────────────────────────────────────────────────
  const DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dowCounts  = { Sun:0, Mon:0, Tue:0, Wed:0, Thu:0, Fri:0, Sat:0 };
  const hourCounts = {};
  const locROCounts = {};

  for (const ro of ros) {
    const dt = ro.dateIn ? new Date(ro.dateIn) : null;
    if (dt && !isNaN(dt)) {
      const dow  = DOW_NAMES[dt.getDay()];
      const hour = String(dt.getHours()).padStart(2, '0');
      dowCounts[dow]++;
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const loc = ro.locationId || 'all';
    locROCounts[loc] = (locROCounts[loc] || 0) + 1;
  }

  const totalDays = 90;
  const byDay = {};
  for (const [dow, cnt] of Object.entries(dowCounts)) {
    const daysOfType = Math.ceil(totalDays / 7);
    byDay[dow] = Math.min(100, Math.round((cnt / daysOfType) * 100));
  }

  const uniqueLocs = Object.keys(locROCounts);
  const numLocations = Math.max(uniqueLocs.length, 1);
  const byLocUtil = {};
  for (const [loc, cnt] of Object.entries(locROCounts)) {
    byLocUtil[loc] = Math.min(100, Math.round((cnt / (totalDays * 3)) * 100));
  }
  const overallUtil = Math.min(100, Math.round((ros.length / (totalDays * 3 * numLocations)) * 100));

  const bayUtilization = {
    overall: overallUtil,
    byDay,
    byHour: hourCounts,
    byLocation: byLocUtil,
  };

  // ── upsell ───────────────────────────────────────────────────────────────────
  const opportunities = ros.filter(r => r.upsellFlag || r.declinedTotal > 0).length;
  const conversions   = ros.filter(r => r.upsellConverted).length;
  const upsellRate    = opportunities > 0 ? Math.round((conversions / opportunities) * 1000) / 10 : 0;

  // Top missed: count frequency of declined service names
  const declinedFreq = {};
  for (const ro of ros) {
    for (const ds of (ro.declinedServices || [])) {
      const name = ds.description || '';
      if (name) declinedFreq[name] = (declinedFreq[name] || 0) + 1;
    }
  }
  const topMissed = Object.entries(declinedFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);

  const upsell = { opportunities, conversions, rate: upsellRate, topMissed };

  // ── elr ──────────────────────────────────────────────────────────────────────
  const totalLaborRev = ros.reduce((s, r) => s + r.laborRevenue, 0);
  const totalActHrs   = ros.reduce((s, r) => s + r.totalActualHrs, 0);
  const overallELR    = totalActHrs > 0 ? Math.round(totalLaborRev / totalActHrs) : 0;

  const techGroups = groupBy(ros, r => r.techId);
  const byTech = Object.entries(techGroups).map(([techId, group]) => {
    const techName    = group[0].techName || techId;
    const labRev      = group.reduce((s, r) => s + r.laborRevenue, 0);
    const actHrs      = group.reduce((s, r) => s + r.totalActualHrs, 0);
    return {
      techId,
      techName,
      elr:     actHrs > 0 ? Math.round(labRev / actHrs) : 0,
      roCount: group.length,
    };
  });

  const elr = { overall: overallELR, byTech };

  // ── partsMargin ──────────────────────────────────────────────────────────────
  const totalPartsRev = ros.reduce((s, r) => s + r.partsRevenue, 0);
  let partsMargin = 48.2;
  if (totalPartsRev > 0) {
    // Estimate COGS: use grossMarginPct if available, otherwise 52% COGS proxy
    const totalCOGS = ros.reduce((s, r) => {
      if (r.grossMarginPct != null) {
        return s + r.partsRevenue * (1 - r.grossMarginPct / 100);
      }
      return s + r.partsRevenue * 0.52;
    }, 0);
    partsMargin = Math.round(((totalPartsRev - totalCOGS) / totalPartsRev) * 1000) / 10;
  }

  // ── advisorPerformance ───────────────────────────────────────────────────────
  const advisorGroups = groupBy(ros, r => r.advisorId || null);
  delete advisorGroups['null']; // exclude ROs without advisorId
  const advisorPerformance = Object.entries(advisorGroups).map(([advisorId, group]) => {
    const advisorName   = group[0].advisorName || advisorId;
    const advOpp        = group.filter(r => r.upsellFlag || r.declinedTotal > 0).length;
    const advConv       = group.filter(r => r.upsellConverted).length;
    return {
      advisorId,
      advisorName,
      roCount:    group.length,
      avgRO:      Math.round(mean(group.map(r => r.totalRevenue))),
      upsellRate: advOpp > 0 ? Math.round((advConv / advOpp) * 1000) / 10 : 0,
    };
  });

  // ── revenueByMonth (last 3 calendar months) ──────────────────────────────────
  const now = new Date();
  const revenueByMonth = [];
  for (let i = 2; i >= 0; i--) {
    const monthDate  = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd   = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
    const label      = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const revenue    = ros
      .filter(r => {
        const d = r.closedDate ? new Date(r.closedDate) : null;
        return d && d >= monthStart && d < monthEnd;
      })
      .reduce((s, r) => s + r.totalRevenue, 0);
    revenueByMonth.push({ month: label, revenue: Math.round(revenue) });
  }

  return {
    shopId,
    locationId:   locationId || 'all',
    generatedAt:  new Date().toISOString(),
    period:       '90d',
    roCount:      ros.length,
    avgRO,
    bayUtilization,
    upsell,
    elr,
    partsMargin,
    advisorPerformance,
    revenueByMonth,
  };
}

/**
 * Upsert a 90-day snapshot into the shop_snapshot_90d collection.
 */
export async function upsertSnapshot90d(shopId, locationId, db) {
  const snapshot = await buildSnapshot90d(shopId, locationId, db);
  await db.collection('shop_snapshot_90d').updateOne(
    { shopId, locationId: locationId || 'all' },
    { $set: snapshot },
    { upsert: true }
  );
  return snapshot;
}

export async function buildSnapshot(shopId, edition, db) {
  const now   = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // ── Query RepairOrder (camelCase) ────────────────────────────────────────────
  let openROs   = [];
  let closedROs = [];

  try {
    const [openDocs, closedDocs] = await Promise.all([
      db.collection(CAMEL_COLL).find({
        status: { $ne: 'closed' },
      }).limit(50).toArray(),

      db.collection(CAMEL_COLL).find({
        status: 'closed',
      }).sort({ closedDate: -1 }).limit(100).toArray(),
    ]);

    openROs   = openDocs.map(normalizeCalmelRO);
    closedROs = closedDocs.map(normalizeCalmelRO);
  } catch (err) {
    console.warn('snapshotBuilder: RepairOrder query failed:', err.message);
  }

  // ── Fallback to wrenchiq_ro for OEM or when RepairOrder is empty ─────────────
  if (edition === 'oem' || (openROs.length === 0 && closedROs.length === 0)) {
    try {
      const [openSnake, closedSnake] = await Promise.all([
        db.collection(SNAKE_COLL).find({
          'shop.id': shopId,
          status: { $ne: 'closed' },
        }).limit(50).toArray(),

        db.collection(SNAKE_COLL).find({
          'shop.id': shopId,
          status:    'closed',
        }).sort({ date_in: -1 }).limit(100).toArray(),
      ]);

      if (edition === 'oem') {
        openROs   = openSnake.map(normalizeSnakeRO);
        closedROs = closedSnake.map(normalizeSnakeRO);
      } else {
        // Fallback: merge if camelCase was empty
        if (openROs.length === 0)   openROs   = openSnake.map(normalizeSnakeRO);
        if (closedROs.length === 0) closedROs = closedSnake.map(normalizeSnakeRO);
      }
    } catch (err) {
      console.warn('snapshotBuilder: wrenchiq_ro query failed:', err.message);
    }
  }

  // ── Rebase stale demo dates to today so the demo always looks live ────────────
  openROs   = rebaseDemoOpenROs(openROs, now);
  closedROs = rebaseDemoClosedROs(closedROs, now);

  // ── Aggregate metrics ────────────────────────────────────────────────────────

  // Today's revenue from closed ROs closed today
  const todayRevenue = closedROs
    .filter(ro => ro.closedDate && new Date(ro.closedDate) >= today)
    .reduce((s, ro) => s + ro.totalRevenue, 0);

  // Last 7 days revenue broken into days (index 0 = today, 6 = 6 days ago)
  const last7DaysRevenue = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    return closedROs
      .filter(ro => {
        const d = ro.closedDate ? new Date(ro.closedDate) : null;
        return d && d >= dayStart && d < dayEnd;
      })
      .reduce((s, ro) => s + ro.totalRevenue, 0);
  });

  // Actual ELR from closed ROs
  const totalLaborRev  = closedROs.reduce((s, ro) => s + ro.laborRevenue, 0);
  const totalActualHrs = closedROs.reduce((s, ro) => s + ro.totalActualHrs, 0);
  const actualELR      = totalActualHrs > 0 ? Math.round(totalLaborRev / totalActualHrs) : 0;

  // Average wait time for open ROs (minutes)
  const waitTimes = openROs
    .map(ro => minutesSince(ro.waitingSince))
    .filter(m => m !== null);
  const avgWaitTime = waitTimes.length > 0
    ? Math.round(waitTimes.reduce((s, m) => s + m, 0) / waitTimes.length)
    : 0;

  // Total declined revenue from open ROs
  const totalDeclinedRevenue = openROs.reduce((s, ro) => s + ro.declinedTotal, 0)
    + closedROs.reduce((s, ro) => s + ro.declinedTotal, 0);

  // Tech utilization: map techId → { totalActualHrs, totalFlaggedHrs, roCount }
  const techMap = {};
  for (const ro of [...openROs, ...closedROs]) {
    if (!ro.techId) continue;
    if (!techMap[ro.techId]) {
      techMap[ro.techId] = { techId: ro.techId, techName: ro.techName, totalActualHrs: 0, totalFlaggedHrs: 0, roCount: 0 };
    }
    techMap[ro.techId].totalActualHrs  += ro.totalActualHrs;
    techMap[ro.techId].totalFlaggedHrs += ro.totalFlaggedHrs;
    techMap[ro.techId].roCount++;
  }
  const techStats = Object.values(techMap).map(t => ({
    ...t,
    efficiency: t.totalActualHrs > 0 ? Math.round((t.totalFlaggedHrs / t.totalActualHrs) * 100) / 100 : 0,
    elr: t.totalActualHrs > 0
      ? Math.round(
          closedROs
            .filter(ro => ro.techId === t.techId)
            .reduce((s, ro) => s + ro.laborRevenue, 0) / t.totalActualHrs
        )
      : 0,
  }));

  return {
    shopId,
    edition,
    generatedAt:          now.toISOString(),
    targetELR:            shopId === 'shop-001' ? TARGET_ELR : 195,
    actualELR,
    todayRevenue:         Math.round(todayRevenue),
    last7DaysRevenue,
    avgWaitTimeMinutes:   avgWaitTime,
    totalDeclinedRevenue: Math.round(totalDeclinedRevenue),
    openROCount:          openROs.length,
    closedROCount:        closedROs.length,
    techStats,
    openROs:   openROs.map(ro => ({
      roNumber:          ro.roNumber,
      status:            ro.status,
      bay:               ro.bay,
      techId:            ro.techId,
      customerId:        ro.customerId,
      loyaltyTier:       ro.loyaltyTier,
      customerVisitCount: ro.customerVisitCount,
      vehicleOrigin:     ro.vehicleOrigin,
      waitMinutes:       minutesSince(ro.waitingSince),
      effectiveLaborRate: ro.effectiveLaborRate,
      totalActualHrs:    ro.totalActualHrs,
      totalFlaggedHrs:   ro.totalFlaggedHrs,
      declinedTotal:     ro.declinedTotal,
      services:          ro.services,
      declinedServices:  ro.declinedServices,
    })),
    last7DaysClosedSummary: {
      totalRevenue:       Math.round(closedROs.reduce((s, ro) => s + ro.totalRevenue, 0)),
      totalLaborRevenue:  Math.round(totalLaborRev),
      totalDeclined:      Math.round(closedROs.reduce((s, ro) => s + ro.declinedTotal, 0)),
      avgELR:             actualELR,
      roCount:            closedROs.length,
    },
  };
}
