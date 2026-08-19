/**
 * WrenchIQ — ARO Analysis
 *
 * Monitors Average Repair Order (ARO) vs. shop goals, computed against the
 * FULL wrenchiq_ro collection (100K+ docs) via MongoDB aggregation pipelines
 * — never loads all docs into memory.
 *
 * Single-pass, not a tool-calling agent: all 7 analytics views below are
 * pre-fetched and reshaped up front, then inlined directly into one prompt
 * for one LLM completion. There was previously a tool-calling loop here, but
 * every "tool" was zero-argument and only reshaped data that had already
 * been fetched before the loop started — the loop bought smaller prompts,
 * never fewer DB hits or different data, so it added latency without adding
 * capability (see docs/wrenchiq-agent-architecture-consolidation-proposal.md).
 *
 * Analytics views inlined into the prompt:
 *   shop_kpis              — ARO (7d/30d/90d), revenue, open count, trend
 *   aro_trend              — Monthly ARO trend (last 12 months)
 *   tech_performance       — ELR + efficiency per technician
 *   customer_patterns      — Repeat customer share, top customers by LTV
 *   vehicle_segments       — ARO breakdown by vehicle origin
 *   declined_services      — Top declined services + revenue opportunity
 *   service_opportunities  — High-value underperformed services
 *
 * Usage:
 *   const result = await runAROAgent(shopId, db);
 *   // result = { goals, analysis, analytics: { ...summaries for charts } }
 */

import {
  getCurrentARO,
  getShopELR,
  getARОTrend,
  getTopServices,
  getCustomerReturnAnalysis,
  getVehicleSegmentARO,
  getTechELR,
  getServiceOpportunityMatrix,
} from './aroAnalytics.js';
import {
  AZURE_OPENAI_API_KEY,
} from '../config.js';
import { callAzureOpenAI, getTextFromResponse } from './azureOpenAI.js';
import { getVoiceSettings } from '../routes/shopVoiceSettings.js';
import { buildVoiceDirective } from './voicePrompt.js';

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

// ── Standing priorities (V5 B2) ────────────────────────────────────────────
// Shops can swap in whatever they actually care about instead of only ARO/
// ELR/margin — read straight from tribal_notes rather than round-tripping
// through the goals store, since Settings' TribalKnowledgePanel already owns
// that collection (see server/routes/tribalNotes.js).
async function getActiveStandingPriorities(db, shopId) {
  try {
    const now = new Date().toISOString();
    const isObj = { $or: [{ noteType: 'objective' }, { noteType: { $exists: false } }] };
    // Legacy notes predate priorityKind — no expiresAt reads as "standing"
    // (mirrors the isStanding() fallback in SettingsScreen.jsx).
    const isStanding = { $or: [{ priorityKind: 'standing' }, { priorityKind: { $exists: false }, expiresAt: null }] };
    const notExpired = { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] };
    const notes = await db.collection('tribal_notes').find({
      shopId,
      active: true,
      $and: [isObj, isStanding, notExpired],
    }).toArray();
    return notes;
  } catch (err) {
    console.warn('[aroAgent] failed to fetch standing priorities:', err.message);
    return [];
  }
}

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

// ── Reshape pre-fetched analytics into the views the model reads ─────────────
// Same reshaping this file always did — previously exposed one view per tool
// call, now inlined as one JSON object in the single-pass prompt.
function buildAnalyticsViews(data, goals) {
  const { currentARO, aroTrend, topServices, customerPatterns, vehicleSegments, techELR, serviceOpportunities } = data;

  const recent = aroTrend.slice(-3).map(m => ({ label: m.label, aro: m.avgARO, ros: m.roCount }));
  const oldest = aroTrend[0]?.avgARO || 0;
  const newest = aroTrend[aroTrend.length - 1]?.avgARO || 0;
  const flaggedTechs = techELR.filter(t => t.elr > 0 && t.elr < goals.minELR);
  const bestSegment = vehicleSegments[0] || null;

  return {
    shop_kpis: {
      aro_7d:       currentARO.aro7d,
      aro_30d:      currentARO.aro30d,
      aro_90d:      currentARO.aro90d,
      revenue_7d:   currentARO.rev7d,
      revenue_30d:  currentARO.rev30d,
      ro_count_7d:  currentARO.count7d,
      ro_count_30d: currentARO.count30d,
      trend:        currentARO.trend,
      goal_aro:     goals.aro,
      gap_7d:       currentARO.aro7d - goals.aro,
      gap_pct_7d:   goals.aro > 0 ? Math.round(((currentARO.aro7d - goals.aro) / goals.aro) * 100) : 0,
    },
    aro_trend: {
      monthly_trend:           aroTrend,
      recent_3_months:         recent,
      change_oldest_to_newest: newest - oldest,
      months_captured:         aroTrend.length,
    },
    tech_performance: {
      techs:          techELR,
      tech_count:     techELR.length,
      below_elr_goal: flaggedTechs.map(t => ({ name: t.name || t.techId, elr: t.elr, efficiency: t.efficiency })),
      min_elr_goal:   goals.minELR,
    },
    customer_patterns: {
      total_unique_customers: customerPatterns.totalUniqueCustomers,
      repeat_customer_share:  customerPatterns.repeatCustomerShare,
      top_customers_by_ltv:   customerPatterns.topCustomersByLTV.slice(0, 10),
      visit_frequency:        customerPatterns.visitFrequency,
    },
    vehicle_segments: {
      segments:            vehicleSegments,
      highest_aro_segment: bestSegment ? { origin: bestSegment.origin, avg_aro: bestSegment.avgARO } : null,
    },
    // We don't have a separate declined list in the aggregation; surface the
    // top services by revenue as the upsell opportunity set.
    declined_services: {
      top_revenue_services: topServices.slice(0, 8).map(s => ({
        service:     s.service,
        performed:   s.count,
        avg_revenue: s.avgCost,
        total_rev:   s.totalRevenue,
      })),
      note: 'Based on full RO history — services with the highest average revenue per visit.',
    },
    service_opportunities: {
      opportunities: serviceOpportunities.slice(0, 10),
      total_found:   serviceOpportunities.length,
      note: 'Services with high average revenue but low frequency — best candidates for service campaigns.',
    },
  };
}

// ── ARO Agent system prompt ───────────────────────────────────────────────────
function buildSystemPrompt(goals, standingPriorities = [], voice) {
  const customBlock = standingPriorities.length
    ? `\n\nShop-defined standing priorities (this shop's own free-form targets — weigh these \
alongside the numeric goals above when synthesizing recommendations):\n${
        standingPriorities.map(p => `  - ${p.note}`).join('\n')
      }`
    : '';

  return `You are the ARO Agent for WrenchIQ — an AI that monitors shop performance KPIs \
outside the core SMS workflow. All analytics below are already computed from the shop's \
full repair order database (100,000+ ROs) — there are no tools to call, everything you \
need is provided.

Shop goals:
  - ARO (Average Repair Order): $${goals.aro}
  - Minimum ELR (Effective Labor Rate): $${goals.minELR}/hr
  - Bay Utilization target: ${goals.bayUtilization}%
  - Max comeback rate: ${goals.comebackRate}%${customBlock}

Your mission:
1. Review the KPI, trend, technician, customer, vehicle-segment, and service-opportunity
   data provided below to understand current ARO vs. goal and the root causes of any gap
2. Synthesize findings into structured alerts and actionable recommendations
3. Return ONLY a JSON object — no prose, no markdown, no code fences, just raw JSON

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
- summary: one punchy sentence the service advisor sees at the top of the screen${buildVoiceDirective(voice)}`;
}

// ── Main agent runner ─────────────────────────────────────────────────────────

/**
 * Run ARO analysis for a shop.
 * Pre-fetches all analytics in parallel, reshapes them into the views the
 * model reads, and makes one single-pass LLM completion — no tool-calling
 * loop (model configured via LLM_BASE_URL / LLM_MODEL in server/config.js).
 *
 * @param {string} shopId
 * @param {object} db  - MongoDB db handle
 * @returns {Promise<{ goals, analysis, analytics: analytics summary }>}
 */
export async function runAROAgent(shopId = 'shop-001', db) {
  if (!AZURE_OPENAI_API_KEY) {
    throw new Error('AZURE_OPENAI_API_KEY not configured — set it in .env.local');
  }

  const goals = getGoals(shopId);
  const standingPriorities = await getActiveStandingPriorities(db, shopId);
  const voice = await getVoiceSettings(db, shopId);

  // Pre-fetch all analytics in parallel — uses aggregation, never loads 100K docs into memory
  console.log('[aroAgent] Fetching analytics from wrenchiq_ro (full dataset)…');
  const analyticsData = await fetchAllAnalytics(shopId, db);
  console.log(`[aroAgent] Analytics ready — ${analyticsData.aroTrend.length} months of trend data`);

  const analyticsViews = buildAnalyticsViews(analyticsData, goals);
  const prompt = `${buildSystemPrompt(goals, standingPriorities, voice)}

DATA ALREADY LOADED (no tool calls available):

${JSON.stringify(analyticsViews, null, 2)}

Now produce the JSON analysis object.`;

  const data = await callAzureOpenAI({
    messages:   [{ role: 'user', content: prompt }],
    max_tokens: 4096,
    jsonMode:   true,
    _route:     '/api/aro-agent',
  });

  const raw       = getTextFromResponse(data) || '';
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  let finalAnalysis;
  try {
    finalAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (err) {
    throw new Error(`ARO Agent returned malformed JSON: ${err.message}`);
  }

  if (!finalAnalysis) {
    throw new Error('ARO Agent did not return a parseable analysis');
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
 * Fast ARO status — no LLM call, pure aggregation math from full dataset.
 * Returns the current ARO vs goal without running the full agent loop.
 */
export async function getAROStatus(shopId = 'shop-001', db) {
  const goals      = getGoals(shopId);
  const [currentARO, shopELR] = await Promise.all([
    getCurrentARO(db, shopId),
    getShopELR(db, shopId),
  ]);

  const aro    = currentARO.aro7d;
  const gap    = aro - goals.aro;
  const gapPct = goals.aro > 0 ? Math.round((gap / goals.aro) * 100) : 0;

  const elrGap = shopELR.elr - goals.minELR;

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
    // Effective Labor Rate: Total Labor Revenue ÷ Total Actual Hours Worked
    current_elr:      shopELR.elr,
    goal_elr:         goals.minELR,
    elr_gap:          elrGap,
    elr_total_labor_revenue: shopELR.totalLaborRev,
    elr_total_actual_hours:  shopELR.totalActualHrs,
    generatedAt:   new Date().toISOString(),
  };
}
