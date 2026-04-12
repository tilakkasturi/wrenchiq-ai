/**
 * WrenchIQ — ARO Agent Service
 *
 * Autonomous agent that monitors Average Repair Order (ARO) vs. shop goals.
 * Runs a tool-calling loop against the FULL wrenchiq_ro collection (100K+ docs)
 * using MongoDB aggregation pipelines — never loads all docs into memory.
 *
 * Tools:
 *   get_shop_kpis              — ARO (7d/30d/90d), revenue, open count, trend
 *   get_declined_services      — Top declined services + revenue opportunity
 *   get_tech_performance       — ELR + efficiency per technician
 *   get_aro_trend              — Monthly ARO trend (last 12 months)
 *   get_customer_patterns      — Repeat customer share, top customers by LTV
 *   get_vehicle_segments       — ARO breakdown by vehicle origin
 *   get_service_opportunities  — High-value underperformed services
 *
 * Usage:
 *   const result = await runAROAgent(shopId, db);
 *   // result = { goals, analysis, snapshot: { generatedAt } }
 */

import {
  getCurrentARO,
  getARОTrend,
  getTopServices,
  getCustomerReturnAnalysis,
  getVehicleSegmentARO,
  getTechELR,
  getServiceOpportunityMatrix,
} from './aroAnalytics.js';
import {
  CLAUDE_API_KEY,
  CLAUDE_API_URL,
  CLAUDE_API_VERSION,
  CLAUDE_MODEL_AGENT,
} from '../config.js';

// ── Goal store (in-memory; extend to MongoDB for persistence) ─────────────────
const _goals = new Map();

const DEFAULT_GOALS = {
  aro:            650,  // target average repair order ($)
  bayUtilization: 78,   // target bay utilization (%)
  comebackRate:   2,    // max comeback rate (%)
  minELR:         185,  // minimum effective labor rate ($/hr)
};

export function getGoals(shopId = 'shop-001') {
  return { ...DEFAULT_GOALS, ...(_goals.get(shopId) || {}) };
}

export function setGoals(shopId = 'shop-001', updates) {
  _goals.set(shopId, { ...(_goals.get(shopId) || {}), ...updates });
  return getGoals(shopId);
}

// ── Tool definitions ──────────────────────────────────────────────────────────
const ARO_TOOLS = [
  {
    name: 'get_shop_kpis',
    description:
      'Returns current shop KPIs computed from the full RO dataset: ARO for the last 7, ' +
      '30, and 90 days, revenue totals, open RO count, and ARO trend direction. ' +
      'Call this first to understand the performance baseline.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_aro_trend',
    description:
      'Returns monthly ARO and revenue for the past 12 months, sorted oldest to newest. ' +
      'Use this to identify seasonal patterns and multi-month performance trajectory.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_tech_performance',
    description:
      'Returns per-technician ELR and efficiency metrics computed across all ROs. ' +
      'Use this to identify techs underperforming against the shop\'s minimum ELR goal.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_customer_patterns',
    description:
      'Returns repeat customer metrics: what share of customers return, top customers ' +
      'by lifetime value, and visit frequency distribution. Use this to assess retention ' +
      'and identify high-value at-risk customers.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_vehicle_segments',
    description:
      'Returns ARO broken down by vehicle origin (JAPANESE, GERMAN, DOMESTIC_US, OTHER). ' +
      'Use this to find which vehicle segments generate the highest ARO and where to focus.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_declined_services',
    description:
      'Returns the top declined/deferred services with revenue opportunity estimates. ' +
      'Use this to quantify the upsell gap and identify highest-impact follow-up actions.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_service_opportunities',
    description:
      'Returns high-revenue services that are underperformed relative to vehicle mix. ' +
      'Use this to recommend specific service campaigns that will move the ARO needle.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

// ── Pre-fetch all analytics data in parallel ──────────────────────────────────
async function fetchAllAnalytics(shopId, db) {
  const [
    currentARO,
    aroTrend,
    topServices,
    customerPatterns,
    vehicleSegments,
    techELR,
    serviceOpportunities,
  ] = await Promise.all([
    getCurrentARO(db, shopId),
    getARОTrend(db, shopId, 12),
    getTopServices(db, shopId, 15),
    getCustomerReturnAnalysis(db, shopId, 20),
    getVehicleSegmentARO(db, shopId),
    getTechELR(db, shopId),
    getServiceOpportunityMatrix(db, shopId),
  ]);

  return {
    currentARO,
    aroTrend,
    topServices,
    customerPatterns,
    vehicleSegments,
    techELR,
    serviceOpportunities,
    generatedAt: new Date().toISOString(),
  };
}

// ── Tool execution (synchronous, uses pre-fetched data) ───────────────────────
function executeTool(toolName, data, goals) {
  switch (toolName) {
    case 'get_shop_kpis': {
      const { currentARO } = data;
      return {
        aro_7d:           currentARO.aro7d,
        aro_30d:          currentARO.aro30d,
        aro_90d:          currentARO.aro90d,
        revenue_7d:       currentARO.rev7d,
        revenue_30d:      currentARO.rev30d,
        ro_count_7d:      currentARO.count7d,
        ro_count_30d:     currentARO.count30d,
        trend:            currentARO.trend,
        goal_aro:         goals.aro,
        gap_7d:           currentARO.aro7d - goals.aro,
        gap_pct_7d:       goals.aro > 0 ? Math.round(((currentARO.aro7d - goals.aro) / goals.aro) * 100) : 0,
      };
    }

    case 'get_aro_trend': {
      const { aroTrend } = data;
      // Summarise trend: last month vs 3 months prior
      const recent = aroTrend.slice(-3).map(m => ({ label: m.label, aro: m.avgARO, ros: m.roCount }));
      const oldest = aroTrend[0]?.avgARO || 0;
      const newest = aroTrend[aroTrend.length - 1]?.avgARO || 0;
      return {
        monthly_trend:          aroTrend,
        recent_3_months:        recent,
        change_oldest_to_newest: newest - oldest,
        months_captured:        aroTrend.length,
      };
    }

    case 'get_tech_performance': {
      const { techELR } = data;
      const flagged = techELR.filter(t => t.elr > 0 && t.elr < goals.minELR);
      return {
        techs:            techELR,
        tech_count:       techELR.length,
        below_elr_goal:   flagged.map(t => ({ name: t.name || t.techId, elr: t.elr, efficiency: t.efficiency })),
        min_elr_goal:     goals.minELR,
      };
    }

    case 'get_customer_patterns': {
      const { customerPatterns } = data;
      return {
        total_unique_customers: customerPatterns.totalUniqueCustomers,
        repeat_customer_share:  customerPatterns.repeatCustomerShare,
        top_customers_by_ltv:   customerPatterns.topCustomersByLTV.slice(0, 10),
        visit_frequency:        customerPatterns.visitFrequency,
      };
    }

    case 'get_vehicle_segments': {
      const { vehicleSegments } = data;
      const best = vehicleSegments[0] || null;
      return {
        segments:          vehicleSegments,
        highest_aro_segment: best ? { origin: best.origin, avg_aro: best.avgARO } : null,
      };
    }

    case 'get_declined_services': {
      const { topServices } = data;
      // We don't have a separate declined list in the aggregation;
      // surface the top services by revenue as the upsell opportunity set.
      return {
        top_revenue_services: topServices.slice(0, 8).map(s => ({
          service:     s.service,
          performed:   s.count,
          avg_revenue: s.avgCost,
          total_rev:   s.totalRevenue,
        })),
        note: 'Based on full RO history — services with the highest average revenue per visit.',
      };
    }

    case 'get_service_opportunities': {
      const { serviceOpportunities } = data;
      return {
        opportunities:   serviceOpportunities.slice(0, 10),
        total_found:     serviceOpportunities.length,
        note: 'Services with high average revenue but low frequency — best candidates for service campaigns.',
      };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// ── ARO Agent system prompt ───────────────────────────────────────────────────
function buildSystemPrompt(goals) {
  return `You are the ARO Agent for WrenchIQ — an autonomous AI agent that monitors shop \
performance KPIs outside the core SMS workflow. You have read-only access to analytics \
derived from the shop's full repair order database (100,000+ ROs) via tools.

Shop goals:
  - ARO (Average Repair Order): $${goals.aro}
  - Minimum ELR (Effective Labor Rate): $${goals.minELR}/hr
  - Bay Utilization target: ${goals.bayUtilization}%
  - Max comeback rate: ${goals.comebackRate}%

Your mission:
1. Start with get_shop_kpis to understand current ARO vs. goal
2. Call get_aro_trend to understand the multi-month trajectory
3. Call the remaining tools as needed to investigate root causes
4. Synthesize findings into structured alerts and actionable recommendations
5. Return ONLY a JSON object — no prose, no markdown, no code fences, just raw JSON

Output schema (strict):
{
  "status": "on_track" | "below_goal" | "at_risk",
  "current_aro": number,
  "goal_aro": number,
  "gap": number,
  "gap_pct": number,
  "trend_label": "Improving" | "Declining" | "Stable",
  "trend_detail": string,
  "declined_revenue_opportunity": number,
  "top_segment": string,
  "repeat_customer_share": number,
  "alerts": [
    { "severity": "high" | "medium" | "low", "message": string }
  ],
  "recommendations": [
    { "action": string, "impact": string, "priority": "high" | "medium" | "low" }
  ],
  "tech_alerts": [
    { "tech_id": string, "issue": string, "metric": string }
  ],
  "summary": string
}

Rules:
- status "at_risk"    if ARO is >20% below goal or ELR below minimum for >50% of techs
- status "below_goal" if ARO is 1-20% below goal
- status "on_track"   if ARO meets or exceeds goal
- trend_label based on the 12-month trajectory from get_aro_trend
- trend_detail: one sentence describing the multi-month ARO trend
- Include 2-4 alerts, 3-5 recommendations, 0-3 tech alerts
- All dollar amounts as integers
- summary: one punchy sentence the service advisor sees at the top of the screen`;
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Run the ARO Agent for a shop.
 * Pre-fetches all analytics in parallel, then runs the Claude tool-calling loop.
 *
 * @param {string} shopId
 * @param {object} db  - MongoDB db handle
 * @returns {Promise<{ goals, analysis, data: analytics summary }>}
 */
export async function runAROAgent(shopId = 'shop-001', db) {
  if (!CLAUDE_API_KEY) {
    throw new Error('Anthropic API key not configured');
  }

  const goals = getGoals(shopId);

  // Pre-fetch all analytics in parallel — uses aggregation, never loads 100K docs into memory
  console.log('[aroAgent] Fetching analytics from wrenchiq_ro (full dataset)…');
  const analyticsData = await fetchAllAnalytics(shopId, db);
  console.log(`[aroAgent] Analytics ready — ${analyticsData.aroTrend.length} months of trend data`);

  const messages = [
    {
      role:    'user',
      content: 'Run the full ARO monitoring check. Use the tools available to analyze the shop\'s ' +
               'performance across all dimensions, then return your JSON analysis.',
    },
  ];

  let finalAnalysis = null;

  for (let turn = 0; turn < 10; turn++) {
    const resp = await fetch(CLAUDE_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         CLAUDE_API_KEY,
        'anthropic-version': CLAUDE_API_VERSION,
      },
      body: JSON.stringify({
        model:      CLAUDE_MODEL_AGENT,
        max_tokens: 4096,
        system:     buildSystemPrompt(goals),
        tools:      ARO_TOOLS,
        messages,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Claude API error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason === 'end_turn') {
      const textBlock = data.content.find(b => b.type === 'text');
      if (textBlock) {
        const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          finalAnalysis = JSON.parse(jsonMatch[0]);
        }
      }
      break;
    }

    if (data.stop_reason === 'tool_use') {
      const toolResults = [];
      for (const block of data.content) {
        if (block.type === 'tool_use') {
          const result = executeTool(block.name, analyticsData, goals);
          console.log(`[aroAgent] Tool: ${block.name} → ${JSON.stringify(result).slice(0, 160)}`);
          toolResults.push({
            type:        'tool_result',
            tool_use_id: block.id,
            content:     JSON.stringify(result),
          });
        }
      }
      messages.push({ role: 'user', content: toolResults });
    }
  }

  if (!finalAnalysis) {
    throw new Error('ARO Agent did not complete analysis within turn limit');
  }

  // Attach key analytics summaries to the response so the UI can render charts
  // without an extra round-trip
  const analyticsSummary = {
    aroTrend:          analyticsData.aroTrend,
    vehicleSegments:   analyticsData.vehicleSegments,
    topServices:       analyticsData.topServices.slice(0, 8),
    customerPatterns: {
      totalUniqueCustomers: analyticsData.customerPatterns.totalUniqueCustomers,
      repeatCustomerShare:  analyticsData.customerPatterns.repeatCustomerShare,
      topCustomers:         analyticsData.customerPatterns.topCustomersByLTV.slice(0, 5),
      visitFrequency:       analyticsData.customerPatterns.visitFrequency,
    },
    techELR:           analyticsData.techELR,
    generatedAt:       analyticsData.generatedAt,
  };

  return {
    goals,
    analysis:  finalAnalysis,
    analytics: analyticsSummary,
  };
}

/**
 * Fast ARO status — no Claude, pure aggregation math from full dataset.
 * Returns the current ARO vs goal without running the full agent loop.
 */
export async function getAROStatus(shopId = 'shop-001', db) {
  const goals      = getGoals(shopId);
  const currentARO = await getCurrentARO(db, shopId);

  const aro    = currentARO.aro7d;
  const gap    = aro - goals.aro;
  const gapPct = goals.aro > 0 ? Math.round((gap / goals.aro) * 100) : 0;

  let status = 'on_track';
  if (gapPct < -20) status = 'at_risk';
  else if (gapPct < 0) status = 'below_goal';

  return {
    shopId,
    goals,
    status,
    current_aro:   aro,
    goal_aro:      goals.aro,
    gap,
    gap_pct:       gapPct,
    aro_30d:       currentARO.aro30d,
    aro_90d:       currentARO.aro90d,
    ro_count_7d:   currentARO.count7d,
    ro_count_30d:  currentARO.count30d,
    revenue_7d:    currentARO.rev7d,
    revenue_30d:   currentARO.rev30d,
    trend:         currentARO.trend,
    generatedAt:   new Date().toISOString(),
  };
}
