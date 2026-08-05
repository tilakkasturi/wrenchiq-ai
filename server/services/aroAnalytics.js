/**
 * WrenchIQ — ARO Analytics Service
 *
 * MongoDB aggregation pipelines that run against the full wrenchiq_ro collection
 * (100K+ documents). Never loads all docs into memory — pure server-side aggregation.
 *
 * All functions accept a MongoDB db handle and return plain JS objects.
 */

const COLL = 'wrenchiq_ro';

// ROs imported without per-job cost breakdown (confirmed: every RO dated Apr 2025
// onward) carry no repair_jobs[].line_cost / parts[].unit_price at all — only a
// lump-sum `invoice` total. When line-item data is absent, labor revenue is
// approximated as this share of `invoice`. Value is measured, not assumed: on the
// 20,000 ROs where both invoice and line_cost are populated simultaneously, the
// observed labor share of invoice is 0.619.
const LABOR_SHARE_FALLBACK = 0.619;

// ── Shared revenue expression ─────────────────────────────────────────────────
// Computes total RO revenue from repair_jobs (labor + parts) in aggregation,
// falling back to the RO-level `invoice` total when no line-item data exists.
const LINE_ITEM_REVENUE_EXPR = {
  $reduce: {
    input:        { $ifNull: ['$repair_jobs', []] },
    initialValue: 0,
    in: {
      $add: [
        '$$value',
        { $ifNull: ['$$this.line_cost', 0] },
        {
          $reduce: {
            input:        { $ifNull: ['$$this.parts', []] },
            initialValue: 0,
            in: {
              $add: [
                '$$value',
                {
                  $multiply: [
                    { $ifNull: ['$$this.unit_price', 0] },
                    { $ifNull: ['$$this.quantity',   1] },
                  ],
                },
              ],
            },
          },
        },
      ],
    },
  },
};

const REVENUE_EXPR = {
  $let: {
    vars: { lineItemRevenue: LINE_ITEM_REVENUE_EXPR },
    in: {
      $cond: [
        { $gt: ['$$lineItemRevenue', 0] },
        { $add: ['$$lineItemRevenue', { $ifNull: ['$tax_amount', 0] }] },
        { $ifNull: ['$invoice', 0] },
      ],
    },
  },
};

// ── 1. ARO trend — monthly averages over N months ─────────────────────────────
/**
 * Returns monthly ARO, revenue, and RO count for the past `months` months.
 * Sorted oldest → newest.
 */
export async function getARОTrend(db, shopId, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const pipeline = [
    {
      $match: {
        status:  'closed',
        date_in: { $gte: since.toISOString() },
        ...(shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {}),
      },
    },
    {
      $addFields: { _revenue: REVENUE_EXPR },
    },
    {
      $group: {
        _id: {
          year:  { $year:  { $toDate: '$date_in' } },
          month: { $month: { $toDate: '$date_in' } },
        },
        totalRevenue: { $sum: '$_revenue' },
        roCount:      { $sum: 1 },
        avgARO:       { $avg: '$_revenue' },
        avgLaborCost: {
          $avg: {
            $reduce: {
              input:        { $ifNull: ['$repair_jobs', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.line_cost', 0] }] },
            },
          },
        },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    {
      $project: {
        _id:          0,
        year:         '$_id.year',
        month:        '$_id.month',
        label: {
          $concat: [
            { $arrayElemAt: [
              ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
              { $subtract: ['$_id.month', 1] },
            ]},
            ' ',
            { $toString: '$_id.year' },
          ],
        },
        totalRevenue: { $round: ['$totalRevenue', 0] },
        roCount:      1,
        avgARO:       { $round: ['$avgARO', 0] },
        avgLaborCost: { $round: ['$avgLaborCost', 0] },
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}

// ── 2. Top services — most performed + revenue contribution ───────────────────
/**
 * Returns the top N repair services by frequency and total revenue.
 */
export async function getTopServices(db, shopId, limit = 15) {
  const pipeline = [
    {
      $match: shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {},
    },
    { $unwind: '$repair_jobs' },
    {
      $group: {
        _id:          '$repair_jobs.repair_job',
        count:        { $sum: 1 },
        totalRevenue: { $sum: { $ifNull: ['$repair_jobs.line_cost', 0] } },
        avgCost:      { $avg: { $ifNull: ['$repair_jobs.line_cost', 0] } },
        avgLaborHrs:  { $avg: { $ifNull: ['$repair_jobs.labor_hours', 0] } },
      },
    },
    { $match: { _id: { $ne: null }, count: { $gte: 2 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
    {
      $project: {
        _id:          0,
        service:      '$_id',
        count:        1,
        totalRevenue: { $round: ['$totalRevenue', 0] },
        avgCost:      { $round: ['$avgCost', 0] },
        avgLaborHrs:  { $round: ['$avgLaborHrs', 2] },
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}

// ── 3. Customer return analysis — repeat visit patterns ───────────────────────
/**
 * Returns repeat customer metrics: visit frequency distribution, top customers by LTV.
 */
export async function getCustomerReturnAnalysis(db, shopId, limit = 20) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const [freqData, topCustomers] = await Promise.all([
    // Visit frequency distribution
    db.collection(COLL).aggregate([
      { $match: match },
      { $group: { _id: '$customer.id', visits: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      {
        $bucket: {
          groupBy: '$visits',
          boundaries: [1, 2, 3, 5, 10, 20, 100],
          default: '20+',
          output: { customerCount: { $sum: 1 }, totalVisits: { $sum: '$visits' } },
        },
      },
    ]).toArray(),

    // Top customers by LTV
    db.collection(COLL).aggregate([
      { $match: match },
      { $addFields: { _revenue: REVENUE_EXPR } },
      {
        $group: {
          _id:        '$customer.id',
          name:       { $first: '$customer.name' },
          visits:     { $sum: 1 },
          totalSpend: { $sum: '$_revenue' },
          avgARO:     { $avg: '$_revenue' },
          lastVisit:  { $max: '$date_in' },
          firstVisit: { $min: '$date_in' },
        },
      },
      { $match: { _id: { $ne: null }, visits: { $gte: 2 } } },
      { $sort: { totalSpend: -1 } },
      { $limit: limit },
      {
        $project: {
          _id:        0,
          customerId: '$_id',
          name:       1,
          visits:     1,
          totalSpend: { $round: ['$totalSpend', 0] },
          avgARO:     { $round: ['$avgARO', 0] },
          lastVisit:  1,
          firstVisit: 1,
        },
      },
    ]).toArray(),
  ]);

  const totalCustomers = await db.collection(COLL).distinct('customer.id', match);
  const repeatCount = topCustomers.length;

  return {
    totalUniqueCustomers: totalCustomers.length,
    visitFrequency:       freqData,
    topCustomersByLTV:    topCustomers,
    repeatCustomerShare:  totalCustomers.length > 0
      ? Math.round((repeatCount / totalCustomers.length) * 100)
      : 0,
  };
}

// ── 4. Vehicle segment analysis — ARO by origin ───────────────────────────────
export async function getVehicleSegmentARO(db, shopId) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const pipeline = [
    { $match: match },
    { $addFields: { _revenue: REVENUE_EXPR } },
    {
      $group: {
        _id:          '$vehicle_origin',
        roCount:      { $sum: 1 },
        totalRevenue: { $sum: '$_revenue' },
        avgARO:       { $avg: '$_revenue' },
      },
    },
    { $match: { _id: { $ne: null } } },
    { $sort: { totalRevenue: -1 } },
    {
      $project: {
        _id:          0,
        origin:       '$_id',
        roCount:      1,
        totalRevenue: { $round: ['$totalRevenue', 0] },
        avgARO:       { $round: ['$avgARO', 0] },
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}

// ── 5. Advisor performance — ARO and conversion by advisor ────────────────────
export async function getAdvisorPerformance(db, shopId) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const pipeline = [
    { $match: { ...match, status: 'closed' } },
    { $addFields: { _revenue: REVENUE_EXPR } },
    {
      $group: {
        _id:          '$advisor.id',
        name:         { $first: '$advisor.name' },
        roCount:      { $sum: 1 },
        totalRevenue: { $sum: '$_revenue' },
        avgARO:       { $avg: '$_revenue' },
      },
    },
    { $match: { _id: { $ne: null }, roCount: { $gte: 3 } } },
    { $sort: { avgARO: -1 } },
    {
      $project: {
        _id:          0,
        advisorId:    '$_id',
        name:         1,
        roCount:      1,
        totalRevenue: { $round: ['$totalRevenue', 0] },
        avgARO:       { $round: ['$avgARO', 0] },
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}

// ── 6a. Shop-wide ELR — same formula as getTechELR, grouped across all techs ──
// ELR = Total Labor Revenue ÷ Total Actual Hours Worked (industry-standard
// Effective Labor Rate — what the shop actually realizes per wrench-hour,
// as opposed to the posted/flat-rate labor price).
export async function getShopELR(db, shopId) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        _laborRevenue: {
          $let: {
            vars: {
              lineItemLaborRev: {
                $reduce: {
                  input:        { $ifNull: ['$repair_jobs', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.line_cost', 0] }] },
                },
              },
            },
            in: {
              $cond: [
                { $gt: ['$$lineItemLaborRev', 0] },
                '$$lineItemLaborRev',
                { $multiply: [{ $ifNull: ['$invoice', 0] }, LABOR_SHARE_FALLBACK] },
              ],
            },
          },
        },
        _actualHrs: {
          $ifNull: ['$labor_time_tracking.totalActualHrs', {
            $reduce: {
              input:        { $ifNull: ['$repair_jobs', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.actual_labor_hours', 0] }] },
            },
          }],
        },
        _flatHrs: {
          $ifNull: ['$labor_time_tracking.totalFlatHrs', {
            $reduce: {
              input:        { $ifNull: ['$repair_jobs', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.labor_hours', 0] }] },
            },
          }],
        },
      },
    },
    // Exclude ROs with no tracked hours (confirmed: ~95% of Apr 2025 - Jan 2026
    // closed ROs have labor_time_tracking.totalActualHrs/totalFlatHrs explicitly
    // 0 — hours were never recorded for them). Including them would divide
    // real/estimated revenue by a near-zero hours base and inflate ELR well
    // above the posted rate, which is not a meaningful $/hr figure.
    { $match: { _actualHrs: { $gt: 0 } } },
    {
      $group: {
        _id:            null,
        totalLaborRev:  { $sum: '$_laborRevenue' },
        totalActualHrs: { $sum: '$_actualHrs' },
        totalFlatHrs:   { $sum: '$_flatHrs' },
        avgPostedRate:  { $avg: '$shop.labor_rate' },
      },
    },
  ];

  const [result] = await db.collection(COLL).aggregate(pipeline).toArray();
  if (!result) return { elr: 0, totalLaborRev: 0, totalActualHrs: 0, totalFlatHrs: 0, postedRate: 0 };

  const elr = result.totalActualHrs > 0 ? result.totalLaborRev / result.totalActualHrs : 0;

  return {
    elr:            Math.round(elr),
    totalLaborRev:  Math.round(result.totalLaborRev),
    totalActualHrs: Math.round(result.totalActualHrs * 10) / 10,
    totalFlatHrs:   Math.round(result.totalFlatHrs * 10) / 10,
    postedRate:     Math.round(result.avgPostedRate || 0),
  };
}

// ── 6. Tech ELR performance ───────────────────────────────────────────────────
export async function getTechELR(db, shopId) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const pipeline = [
    { $match: match },
    {
      $addFields: {
        _laborRevenue: {
          $let: {
            vars: {
              lineItemLaborRev: {
                $reduce: {
                  input:        { $ifNull: ['$repair_jobs', []] },
                  initialValue: 0,
                  in: { $add: ['$$value', { $ifNull: ['$$this.line_cost', 0] }] },
                },
              },
            },
            in: {
              $cond: [
                { $gt: ['$$lineItemLaborRev', 0] },
                '$$lineItemLaborRev',
                { $multiply: [{ $ifNull: ['$invoice', 0] }, LABOR_SHARE_FALLBACK] },
              ],
            },
          },
        },
        _actualHrs: {
          $ifNull: ['$labor_time_tracking.totalActualHrs', {
            $reduce: {
              input:        { $ifNull: ['$repair_jobs', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.actual_labor_hours', 0] }] },
            },
          }],
        },
        _flatHrs: {
          $ifNull: ['$labor_time_tracking.totalFlatHrs', {
            $reduce: {
              input:        { $ifNull: ['$repair_jobs', []] },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.labor_hours', 0] }] },
            },
          }],
        },
      },
    },
    // Exclude ROs with no tracked hours (confirmed: ~95% of Apr 2025 - Jan 2026
    // closed ROs have labor_time_tracking.totalActualHrs/totalFlatHrs explicitly
    // 0 — hours were never recorded for them). Including them would divide
    // real/estimated revenue by a near-zero hours base and inflate ELR well
    // above the posted rate, which is not a meaningful $/hr figure.
    { $match: { _actualHrs: { $gt: 0 } } },
    {
      $group: {
        _id:          '$tech.id',
        name:         { $first: '$tech.name' },
        roCount:      { $sum: 1 },
        totalLaborRev: { $sum: '$_laborRevenue' },
        totalActualHrs: { $sum: '$_actualHrs' },
        totalFlatHrs:  { $sum: '$_flatHrs' },
      },
    },
    { $match: { _id: { $ne: null }, roCount: { $gte: 3 } } },
    {
      $addFields: {
        elr:        { $cond: [{ $gt: ['$totalActualHrs', 0] }, { $divide: ['$totalLaborRev', '$totalActualHrs'] }, 0] },
        efficiency: { $cond: [{ $gt: ['$totalActualHrs', 0] }, { $divide: ['$totalFlatHrs', '$totalActualHrs'] }, 0] },
      },
    },
    { $sort: { elr: -1 } },
    {
      $project: {
        _id:            0,
        techId:         '$_id',
        name:           1,
        roCount:        1,
        totalLaborRev:  { $round: ['$totalLaborRev', 0] },
        totalActualHrs: { $round: ['$totalActualHrs', 1] },
        totalFlatHrs:   { $round: ['$totalFlatHrs',  1] },
        elr:            { $round: ['$elr',        0] },
        efficiency:     { $round: ['$efficiency', 2] },
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}

// ── 7. Current ARO (last 30 and 7 days) ──────────────────────────────────────
/**
 * Fast ARO calculation from the full dataset using aggregation.
 * Returns ARO for the last 7 and 30 days plus overall closed RO metrics.
 */
export async function getCurrentARO(db, shopId) {
  const baseMatch = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  // Anchor the rolling windows to the most recent closed RO date in the dataset
  // rather than wall-clock "now". The demo dataset's latest RO can predate the
  // environment's actual current date (e.g. dataset ends Jan 2026, env clock is
  // Aug 2026) — computing "last 7/30/90 days" off wall-clock time would then
  // match zero ROs. This mirrors snapshotBuilder.js's approach of rebasing
  // relative to the latest RO date rather than trusting wall-clock time.
  const [latestDoc] = await db.collection(COLL)
    .find({ ...baseMatch, status: 'closed', date_in: { $exists: true, $ne: null } })
    .project({ date_in: 1 })
    .sort({ date_in: -1 })
    .limit(1)
    .toArray();

  const anchorNow = latestDoc?.date_in ? new Date(latestDoc.date_in) : new Date();

  const sevenAgo   = new Date(anchorNow.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString();
  const thirtyAgo  = new Date(anchorNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const ninetyAgo  = new Date(anchorNow.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const pipeline = [
    { $match: { ...baseMatch, status: 'closed' } },
    { $addFields: { _revenue: REVENUE_EXPR } },
    {
      $facet: {
        last7: [
          { $match: { date_in: { $gte: sevenAgo  } } },
          { $group: { _id: null, avg: { $avg: '$_revenue' }, total: { $sum: '$_revenue' }, count: { $sum: 1 } } },
        ],
        last30: [
          { $match: { date_in: { $gte: thirtyAgo } } },
          { $group: { _id: null, avg: { $avg: '$_revenue' }, total: { $sum: '$_revenue' }, count: { $sum: 1 } } },
        ],
        last90: [
          { $match: { date_in: { $gte: ninetyAgo } } },
          { $group: { _id: null, avg: { $avg: '$_revenue' }, total: { $sum: '$_revenue' }, count: { $sum: 1 } } },
        ],
        openCount: [
          { $match: { ...baseMatch, status: { $ne: 'closed' } } },
          { $count: 'n' },
        ],
      },
    },
  ];

  const [result] = await db.collection(COLL).aggregate(pipeline).toArray();

  const extract = (arr) => arr[0] || { avg: 0, total: 0, count: 0 };
  const d7  = extract(result.last7);
  const d30 = extract(result.last30);
  const d90 = extract(result.last90);

  return {
    aro7d:    Math.round(d7.avg  || 0),
    aro30d:   Math.round(d30.avg || 0),
    aro90d:   Math.round(d90.avg || 0),
    rev7d:    Math.round(d7.total  || 0),
    rev30d:   Math.round(d30.total || 0),
    count7d:  d7.count  || 0,
    count30d: d30.count || 0,
    count90d: d90.count || 0,
    // Trend: compare last 7d ARO to prior 7d
    trend: (() => {
      if (!d7.avg || !d30.avg) return 'stable';
      const delta = d7.avg - d30.avg;
      if (delta >  20) return 'improving';
      if (delta < -20) return 'declining';
      return 'stable';
    })(),
  };
}

// ── 8. Service opportunity matrix — high-value services underperformed ─────────
/**
 * Finds service categories with high average revenue but low frequency relative
 * to vehicle count. These are the upsell opportunities the ARO Agent highlights.
 */
export async function getServiceOpportunityMatrix(db, shopId) {
  const match = shopId && shopId !== 'shop-001' ? { 'shop.id': shopId } : {};

  const pipeline = [
    { $match: match },
    { $unwind: '$repair_jobs' },
    {
      $group: {
        _id:         '$repair_jobs.repair_job',
        count:       { $sum: 1 },
        avgRevenue:  { $avg: { $ifNull: ['$repair_jobs.line_cost', 0] } },
        totalRev:    { $sum: { $ifNull: ['$repair_jobs.line_cost', 0] } },
        avgLaborHrs: { $avg: { $ifNull: ['$repair_jobs.labor_hours', 0] } },
        categories:  { $addToSet: '$service_category' },
      },
    },
    { $match: { _id: { $ne: null }, count: { $gte: 5 }, avgRevenue: { $gte: 50 } } },
    { $sort: { avgRevenue: -1 } },
    { $limit: 20 },
    {
      $project: {
        _id:         0,
        service:     '$_id',
        count:       1,
        avgRevenue:  { $round: ['$avgRevenue', 0] },
        totalRev:    { $round: ['$totalRev',   0] },
        avgLaborHrs: { $round: ['$avgLaborHrs', 2] },
        categories:  1,
      },
    },
  ];

  return db.collection(COLL).aggregate(pipeline).toArray();
}
