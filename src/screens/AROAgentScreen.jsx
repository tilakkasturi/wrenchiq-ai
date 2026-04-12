/**
 * AROAgentScreen — ARO Agent Mission Control
 *
 * The pilot screen for WrenchIQ's Observer Layer.
 * Monitors Average Repair Order vs. shop goals using the full 100K RO dataset.
 * Surfaces AI-generated alerts, recommendations, trend charts, and segment breakdowns.
 */

import { useState, useEffect } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Activity, Target, TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle, Zap, Settings, RefreshCw,
  Users, Car, Loader,
} from "lucide-react";
import { COLORS } from "../theme/colors";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001";
const SHOP_ID  = "shop-001";
const GOLD_HEX = "#C6A86C";

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  on_track:   { label: "On Track",    color: "#16A34A", bg: "#F0FDF4", icon: CheckCircle },
  below_goal: { label: "Below Goal",  color: "#EA580C", bg: "#FFF7ED", icon: TrendingDown },
  at_risk:    { label: "At Risk",     color: "#DC2626", bg: "#FEF2F2", icon: AlertTriangle },
};

const SEVERITY_COLOR = {
  high:   { text: "#DC2626", bg: "#FEF2F2" },
  medium: { text: "#EA580C", bg: "#FFF7ED" },
  low:    { text: "#16A34A", bg: "#F0FDF4" },
};

const PRIORITY_COLOR = {
  high:   "#DC2626",
  medium: "#EA580C",
  low:    "#6B7280",
};

const SEGMENT_COLORS = {
  JAPANESE:    "#2563EB",
  GERMAN:      "#7C3AED",
  DOMESTIC_US: "#EA580C",
  OTHER:       "#6B7280",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, color = COLORS.textPrimary, accent }) {
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 12,
      padding: "16px 20px",
      flex: 1,
      minWidth: 130,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
          {sub}
        </div>
      )}
      {accent && (
        <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: accent.color }}>
          {accent.text}
        </div>
      )}
    </div>
  );
}

function ARORing({ current, goal, status }) {
  const pct = Math.min((current / Math.max(goal, 1)) * 100, 130);
  const cfg  = STATUS_CFG[status] || STATUS_CFG.on_track;
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = Math.min((pct / 100) * circ, circ);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <div style={{ position: "relative", width: 140, height: 140 }}>
        <svg width={140} height={140} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={70} cy={70} r={r} fill="none" stroke="#E5E7EB" strokeWidth={10} />
          <circle
            cx={70} cy={70} r={r} fill="none"
            stroke={cfg.color} strokeWidth={10}
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          gap: 2,
        }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>
            ${current.toLocaleString()}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600 }}>
            ARO
          </div>
        </div>
      </div>
      <div style={{
        fontSize: 12, fontWeight: 700,
        color: cfg.color, background: cfg.bg,
        borderRadius: 8, padding: "3px 10px",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        <cfg.icon size={11} />
        {cfg.label}
      </div>
      <div style={{ fontSize: 11, color: COLORS.textMuted }}>
        Goal: ${goal.toLocaleString()}
      </div>
    </div>
  );
}

function GoalEditor({ goals, onSave, saving }) {
  const [local, setLocal] = useState(goals);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[
        { key: "aro",            label: "ARO Goal ($)",         prefix: "$" },
        { key: "minELR",         label: "Min ELR ($/hr)",       prefix: "$" },
        { key: "bayUtilization", label: "Bay Utilization (%)",  suffix: "%" },
        { key: "comebackRate",   label: "Max Comeback Rate (%)", suffix: "%" },
      ].map(({ key, label, prefix, suffix }) => (
        <div key={key} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 12, color: COLORS.textSecondary, width: 160, flexShrink: 0 }}>
            {label}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {prefix && <span style={{ fontSize: 12, color: COLORS.textMuted }}>{prefix}</span>}
            <input
              type="number"
              value={local[key] || ""}
              onChange={e => setLocal(p => ({ ...p, [key]: Number(e.target.value) }))}
              style={{
                width: 80,
                padding: "5px 8px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            />
            {suffix && <span style={{ fontSize: 12, color: COLORS.textMuted }}>{suffix}</span>}
          </div>
        </div>
      ))}
      <button
        onClick={() => onSave(local)}
        disabled={saving}
        style={{
          marginTop: 4,
          padding: "8px 16px",
          background: COLORS.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          alignSelf: "flex-start",
        }}
      >
        {saving ? "Saving..." : "Save Goals"}
      </button>
    </div>
  );
}

// ARO trend chart — recharts AreaChart
function AROTrendChart({ data, goalARO }) {
  if (!data?.length) return null;
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: "16px 20px",
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 14 }}>
        ARO Trend  ·  12-Month History
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="aroGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.25} />
              <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 10, fill: "#9CA3AF" }} tickLine={false} axisLine={false}
            tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
          <Tooltip
            formatter={v => [`$${Math.round(v)}`, "Avg ARO"]}
            contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${COLORS.border}` }}
          />
          {goalARO && (
            <ReferenceLine y={goalARO} stroke={COLORS.accent} strokeDasharray="4 4"
              label={{ value: `Goal $${goalARO}`, fontSize: 10, fill: COLORS.accent, position: "insideTopRight" }} />
          )}
          <Area type="monotone" dataKey="avgARO" stroke={COLORS.primary} strokeWidth={2.5}
            fill="url(#aroGrad)" dot={{ r: 3, fill: COLORS.primary }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Vehicle segment bar chart
function VehicleSegmentChart({ data }) {
  if (!data?.length) return null;
  const chartData = data.map(d => ({
    origin: d.origin || "OTHER",
    avgARO: d.avgARO,
    roCount: d.roCount,
    color: SEGMENT_COLORS[d.origin] || "#6B7280",
  }));

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: "16px 20px",
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Car size={13} color={COLORS.textMuted} />
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
          ARO by Vehicle Origin
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {chartData.map(seg => (
          <div key={seg.origin} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 80, fontSize: 11, fontWeight: 600, color: COLORS.textSecondary, flexShrink: 0 }}>
              {seg.origin.replace("_", " ")}
            </div>
            <div style={{ flex: 1, height: 20, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${Math.min((seg.avgARO / 1200) * 100, 100)}%`,
                background: seg.color,
                borderRadius: 4,
                transition: "width 0.6s ease",
              }} />
            </div>
            <div style={{ width: 48, fontSize: 12, fontWeight: 700, color: seg.color, textAlign: "right", flexShrink: 0 }}>
              ${seg.avgARO}
            </div>
            <div style={{ width: 50, fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}>
              {seg.roCount.toLocaleString()} ROs
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Customer patterns panel
function CustomerPatternsPanel({ data }) {
  if (!data) return null;
  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.border}`,
      borderRadius: 14,
      padding: "16px 20px",
      flex: 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <Users size={13} color={COLORS.textMuted} />
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
          Customer Patterns
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.primary }}>
            {data.totalUniqueCustomers?.toLocaleString() || "—"}
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Unique Customers</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#16A34A" }}>
            {data.repeatCustomerShare || 0}%
          </div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Return Rate</div>
        </div>
      </div>

      {/* Top customers by LTV */}
      {data.topCustomers?.length > 0 && (
        <>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Top Customers by Lifetime Value
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {data.topCustomers.slice(0, 4).map((c, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  background: `${COLORS.primary}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: COLORS.primary, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, fontSize: 12, color: COLORS.textPrimary, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {c.name || c.customerId}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#16A34A", flexShrink: 0 }}>
                  ${(c.totalSpend / 1000).toFixed(1)}k
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}>
                  {c.visits}v
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AROAgentScreen() {
  const [status,        setStatus]        = useState(null);
  const [analysis,      setAnalysis]      = useState(null);
  const [analytics,     setAnalytics]     = useState(null);  // enriched data from agent run
  const [goals,         setGoals]         = useState(null);
  const [running,       setRunning]       = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [savingGoals,   setSavingGoals]   = useState(false);
  const [error,         setError]         = useState(null);
  const [showGoals,     setShowGoals]     = useState(false);
  const [agentLog,      setAgentLog]      = useState([]);

  useEffect(() => {
    loadStatus();
    loadGoals();
  }, []);

  async function loadStatus() {
    setLoadingStatus(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/aro-agent/status?shopId=${SHOP_ID}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      setStatus(data);
      setGoals(prev => prev || data.goals);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingStatus(false);
    }
  }

  async function loadGoals() {
    try {
      const res = await fetch(`${API_BASE}/api/aro-agent/config/${SHOP_ID}`);
      if (res.ok) setGoals(await res.json());
    } catch { /* non-critical */ }
  }

  async function handleSaveGoals(updated) {
    setSavingGoals(true);
    try {
      const res = await fetch(`${API_BASE}/api/aro-agent/config/${SHOP_ID}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(updated),
      });
      if (res.ok) {
        setGoals(await res.json());
        setShowGoals(false);
        loadStatus();
      }
    } finally {
      setSavingGoals(false);
    }
  }

  async function runAgent() {
    setRunning(true);
    setAnalysis(null);
    setAnalytics(null);
    setError(null);
    setAgentLog(["Initializing ARO Agent...", "Connecting to wrenchiq_ro (100K ROs)..."]);

    try {
      const timers = [
        setTimeout(() => setAgentLog(l => [...l, "Running MongoDB aggregation pipelines..."]),   1200),
        setTimeout(() => setAgentLog(l => [...l, "Tool: get_shop_kpis — computing 7d/30d/90d ARO"]), 2400),
        setTimeout(() => setAgentLog(l => [...l, "Tool: get_aro_trend — building 12-month history"]), 3800),
        setTimeout(() => setAgentLog(l => [...l, "Tool: get_customer_patterns — analyzing repeat visits"]), 5200),
        setTimeout(() => setAgentLog(l => [...l, "Tool: get_vehicle_segments — segmenting by origin"]), 6400),
        setTimeout(() => setAgentLog(l => [...l, "Tool: get_service_opportunities — identifying upsell gaps"]), 7600),
        setTimeout(() => setAgentLog(l => [...l, "Synthesizing recommendations..."]), 9000),
      ];

      const res = await fetch(`${API_BASE}/api/aro-agent/run`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ shopId: SHOP_ID }),
      });

      timers.forEach(clearTimeout);

      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        try { const e = await res.json(); errMsg = e.error || errMsg; } catch {}
        throw new Error(errMsg);
      }

      const data = await res.json();
      setAgentLog(l => [...l, "Analysis complete — 100K ROs processed."]);
      setAnalysis(data.analysis);
      setAnalytics(data.analytics);
      setGoals(data.goals);
    } catch (err) {
      setError(err.message);
      setAgentLog(l => [...l, `Error: ${err.message}`]);
    } finally {
      setRunning(false);
    }
  }

  const display    = analysis || status;
  const cfg        = display ? (STATUS_CFG[display.status] || STATUS_CFG.on_track) : null;
  const trendIcon  = analysis?.trend_label === "Improving" ? TrendingUp
                   : analysis?.trend_label === "Declining" ? TrendingDown
                   : Minus;

  // Map the status fields (new names) to display values
  const currentARO = display?.current_aro || 0;
  const goalARO    = display?.goal_aro || goals?.aro || 650;
  const gap        = display?.gap || 0;
  const revStr     = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v || 0}`;
  const rev7d      = display?.revenue_7d  || display?.total_revenue_7d  || 0;
  const count7d    = display?.ro_count_7d || 0;
  const aro30d     = display?.aro_30d;
  const aro90d     = display?.aro_90d;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", background: COLORS.bgMain, overflowY: "auto" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: COLORS.bgCard,
        borderBottom: `1px solid ${COLORS.border}`,
        padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.primary}, #0A5068)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Activity size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>
              ARO Agent
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              Observer Layer  ·  Read-only  ·  Peninsula Precision Auto  ·  100K ROs
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setShowGoals(g => !g)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              background: "transparent",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            <Settings size={13} />
            Goals
          </button>

          <button
            onClick={loadStatus}
            disabled={loadingStatus}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 14px",
              background: "transparent",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={13} style={{ animation: loadingStatus ? "spin 1s linear infinite" : "none" }} />
            Refresh
          </button>

          <button
            onClick={runAgent}
            disabled={running}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "10px 20px",
              background: running
                ? "#F3F4F6"
                : `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
              color: running ? COLORS.textMuted : "#fff",
              border: "none",
              borderRadius: 10,
              fontWeight: 800,
              fontSize: 14,
              cursor: running ? "not-allowed" : "pointer",
              boxShadow: running ? "none" : "0 4px 14px rgba(255,107,53,0.35)",
            }}
          >
            {running
              ? <><Loader size={14} style={{ animation: "spin 1s linear infinite" }} /> Running Agent...</>
              : <><Zap size={14} /> Run ARO Agent</>
            }
          </button>
        </div>
      </div>

      <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── Goal editor ────────────────────────────────────────────────────── */}
        {showGoals && goals && (
          <div style={{
            background: "#fff",
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 14,
            padding: "16px 20px",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 12 }}>
              Shop Goals — Peninsula Precision Auto
            </div>
            <GoalEditor goals={goals} onSave={handleSaveGoals} saving={savingGoals} />
          </div>
        )}

        {/* ── Error banner ────────────────────────────────────────────────────── */}
        {error && (
          <div style={{
            padding: "10px 16px",
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 10,
            fontSize: 13, color: "#DC2626",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {/* ── Status summary bar ────────────────────────────────────────────── */}
        {display && cfg && (
          <div style={{
            background: cfg.bg,
            border: `1.5px solid ${cfg.color}30`,
            borderRadius: 12,
            padding: "12px 18px",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <cfg.icon size={16} color={cfg.color} />
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 700, color: cfg.color, fontSize: 13 }}>
                {cfg.label}
              </span>
              {analysis?.summary && (
                <span style={{ fontSize: 13, color: COLORS.textSecondary, marginLeft: 8 }}>
                  — {analysis.summary}
                </span>
              )}
              {analysis?.trend_detail && (
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>
                  {analysis.trend_detail}
                </div>
              )}
            </div>
            {analysis?.trend_label && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: COLORS.textMuted }}>
                {(() => { const T = trendIcon; return <T size={13} />; })()}
                {analysis.trend_label}
              </div>
            )}
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              {display.generatedAt
                ? new Date(display.generatedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                : ""}
            </div>
          </div>
        )}

        {/* ── KPI row + ARO ring ────────────────────────────────────────────── */}
        {(display || loadingStatus) && (
          <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>

            {/* ARO ring */}
            <div style={{
              background: "#fff",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 14,
              padding: "20px 24px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              {display
                ? <ARORing current={currentARO} goal={goalARO} status={display.status} />
                : <div style={{ width: 140, height: 140, background: "#F3F4F6", borderRadius: "50%" }} />
              }
            </div>

            {/* KPI cards */}
            <div style={{ flex: 1, display: "flex", gap: 10, flexWrap: "wrap", alignContent: "flex-start" }}>
              {display ? <>
                <KPICard
                  label="ARO Gap"
                  value={`${gap >= 0 ? "+" : ""}$${Math.abs(gap)}`}
                  sub="vs. goal (7-day)"
                  color={gap >= 0 ? "#16A34A" : "#DC2626"}
                />
                <KPICard
                  label="7-Day Revenue"
                  value={revStr(rev7d)}
                  sub={`${count7d} ROs closed`}
                />
                {aro30d !== undefined && (
                  <KPICard
                    label="30-Day ARO"
                    value={`$${aro30d}`}
                    sub="trailing average"
                    color={aro30d >= goalARO ? "#16A34A" : COLORS.textPrimary}
                  />
                )}
                {aro90d !== undefined && (
                  <KPICard
                    label="90-Day ARO"
                    value={`$${aro90d}`}
                    sub="baseline"
                    color={COLORS.textPrimary}
                  />
                )}
                {analysis?.declined_revenue_opportunity > 0 && (
                  <KPICard
                    label="Upsell Opp."
                    value={revStr(analysis.declined_revenue_opportunity)}
                    sub="recoverable revenue"
                    color={COLORS.accent}
                  />
                )}
                {analysis?.repeat_customer_share > 0 && (
                  <KPICard
                    label="Return Rate"
                    value={`${analysis.repeat_customer_share}%`}
                    sub="customers returning"
                    color="#16A34A"
                  />
                )}
              </> : [1,2,3,4].map(i => (
                <div key={i} style={{ flex: 1, minWidth: 130, height: 90, background: "#F3F4F6", borderRadius: 12 }} />
              ))}
            </div>
          </div>
        )}

        {/* ── ARO Trend Chart (shown after agent run) ───────────────────────── */}
        {analytics?.aroTrend?.length > 0 && (
          <AROTrendChart data={analytics.aroTrend} goalARO={goalARO} />
        )}

        {/* ── Vehicle segments + Customer patterns ─────────────────────────── */}
        {analytics && (analytics.vehicleSegments?.length > 0 || analytics.customerPatterns) && (
          <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
            {analytics.vehicleSegments?.length > 0 && (
              <VehicleSegmentChart data={analytics.vehicleSegments} />
            )}
            {analytics.customerPatterns && (
              <CustomerPatternsPanel data={analytics.customerPatterns} />
            )}
          </div>
        )}

        {/* ── Agent log (while running) ─────────────────────────────────────── */}
        {running && agentLog.length > 0 && (
          <div style={{
            background: COLORS.primary,
            borderRadius: 12,
            padding: "14px 18px",
            fontFamily: "monospace",
            fontSize: 12,
          }}>
            <div style={{ color: GOLD_HEX, fontWeight: 700, marginBottom: 8, fontSize: 11 }}>
              ARO AGENT  ·  ACTIVE  ·  100K ROs
            </div>
            {agentLog.map((line, i) => (
              <div key={i} style={{
                color: i === agentLog.length - 1 ? "#fff" : "#8BB8C0",
                marginBottom: 3,
              }}>
                {i === agentLog.length - 1 && "→ "}{line}
              </div>
            ))}
            <span style={{ display: "inline-block", color: COLORS.accent, animation: "blink 1s step-end infinite" }}>▋</span>
          </div>
        )}

        {/* ── Analysis results ──────────────────────────────────────────────── */}
        {analysis && (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>

            {/* Alerts */}
            <div style={{
              flex: 1,
              background: "#fff",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: 13, fontWeight: 700,
                color: COLORS.textPrimary,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <AlertTriangle size={14} color={COLORS.accent} />
                Alerts
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "#fff",
                  background: COLORS.accent, borderRadius: 8, padding: "1px 6px", marginLeft: 2,
                }}>
                  {(analysis.alerts || []).length}
                </span>
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {(analysis.alerts || []).length === 0
                  ? <div style={{ fontSize: 12, color: COLORS.textMuted, padding: 8 }}>No active alerts</div>
                  : (analysis.alerts || []).map((alert, i) => {
                      const sev = SEVERITY_COLOR[alert.severity] || SEVERITY_COLOR.low;
                      return (
                        <div key={i} style={{
                          padding: "8px 12px",
                          background: sev.bg,
                          borderRadius: 8,
                          fontSize: 12, color: sev.text,
                          fontWeight: alert.severity === "high" ? 700 : 500,
                        }}>
                          {alert.severity === "high" && "⚠ "}{alert.message}
                        </div>
                      );
                    })
                }
              </div>
            </div>

            {/* Recommendations */}
            <div style={{
              flex: "1.4",
              background: "#fff",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px",
                borderBottom: `1px solid ${COLORS.border}`,
                fontSize: 13, fontWeight: 700,
                color: COLORS.textPrimary,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Zap size={14} color={COLORS.accent} />
                Recommendations
              </div>
              <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {(analysis.recommendations || []).map((rec, i) => (
                  <div key={i} style={{
                    padding: "10px 14px",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 10,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: PRIORITY_COLOR[rec.priority] || "#6B7280",
                      marginTop: 5, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                        {rec.action}
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                        {rec.impact}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: PRIORITY_COLOR[rec.priority] || "#6B7280",
                      flexShrink: 0,
                    }}>
                      {rec.priority?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tech alerts ───────────────────────────────────────────────────── */}
        {analysis?.tech_alerts?.length > 0 && (
          <div style={{
            background: "#fff",
            border: `1.5px solid ${COLORS.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}>
            <div style={{
              padding: "12px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              fontSize: 13, fontWeight: 700,
              color: COLORS.textPrimary,
            }}>
              Technician Alerts
            </div>
            <div style={{ padding: "10px 12px", display: "flex", gap: 8, flexWrap: "wrap" }}>
              {analysis.tech_alerts.map((ta, i) => (
                <div key={i} style={{
                  padding: "8px 14px",
                  background: "#FFF7ED",
                  border: "1px solid #FED7AA",
                  borderRadius: 8,
                  fontSize: 12, color: "#EA580C",
                }}>
                  <span style={{ fontWeight: 700 }}>{ta.tech_id}</span>
                  {" — "}{ta.issue}
                  {ta.metric && <span style={{ color: "#9A3412", marginLeft: 6 }}>({ta.metric})</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!display && !loadingStatus && !error && (
          <div style={{
            flex: 1,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 12, padding: 40,
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16,
              background: `linear-gradient(135deg, ${COLORS.primary}, #0A5068)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Activity size={26} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
              ARO Agent Ready
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, textAlign: "center", maxWidth: 360 }}>
              Click "Run ARO Agent" to analyze the shop's performance against your goals
              across 100,000 repair orders. No workflow changes — read-only Observer Layer.
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes blink { 0%, 100% { opacity: 1; }           50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
