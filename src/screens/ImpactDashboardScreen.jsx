import {
  TrendingUp,
  CheckCircle,
  DollarSign,
  FileCheck,
  Stethoscope,
  ShieldCheck,
  Tag,
  BarChart2,
  Download,
  Zap,
  AlertTriangle,
  Target,
  ChevronUp,
  Activity,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

// ── ARO Trend Data ──────────────────────────────────────────
const trendData = [
  { week: "Jan W1", aro: 392 },
  { week: "Jan W2", aro: 387 },
  { week: "Jan W3", aro: 401 },
  { week: "Jan W4", aro: 395 },
  { week: "Feb W1", aro: 412 },
  { week: "Feb W2", aro: 428 },
  { week: "Feb W3", aro: 447 },
  { week: "Feb W4", aro: 463 },
  { week: "Mar W1", aro: 471 },
  { week: "Mar W2", aro: 489 },
  { week: "Mar W3", aro: 501 },
  { week: "Mar W4", aro: 519 },
  { week: "Apr W1", aro: 542 },
];

// ── Helpers ─────────────────────────────────────────────────
function fmt(n) {
  return "$" + n.toLocaleString();
}

// ── Sub-components ───────────────────────────────────────────

function SummaryCard({ icon: Icon, iconColor, label, value, valueSub, valueColor }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "20px 24px",
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: iconColor + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={iconColor} />
        </div>
        <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          color: valueColor || COLORS.textPrimary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {valueSub && (
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>{valueSub}</div>
      )}
    </div>
  );
}

function MetricRow({ icon: Icon, label, value, note, noteColor, bold }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 0",
        borderBottom: `1px solid ${COLORS.borderLight || "#F3F4F6"}`,
      }}
    >
      <Icon size={14} color={COLORS.textMuted} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
      <span
        style={{
          fontSize: 13,
          fontWeight: bold ? 700 : 600,
          color: noteColor || COLORS.textPrimary,
        }}
      >
        {value}
      </span>
      {note && (
        <span
          style={{
            fontSize: 11,
            color: COLORS.textMuted,
            textDecoration: "line-through",
            marginLeft: 4,
          }}
        >
          {note}
        </span>
      )}
    </div>
  );
}

function StatCallout({ text, color }) {
  return (
    <div
      style={{
        marginTop: 12,
        background: (color || COLORS.accent) + "12",
        border: `1px solid ${(color || COLORS.accent) + "40"}`,
        borderRadius: 8,
        padding: "8px 12px",
        fontSize: 13,
        fontWeight: 700,
        color: color || COLORS.accent,
        textAlign: "center",
      }}
    >
      {text}
    </div>
  );
}

function ProgressBar({ value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginTop: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>Progress to target</span>
        <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
          {pct}%
        </span>
      </div>
      <div
        style={{
          height: 6,
          background: COLORS.border,
          borderRadius: 99,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: color || COLORS.accent,
            borderRadius: 99,
          }}
        />
      </div>
    </div>
  );
}

function JobCard({ jobNum, title, borderColor, children, callout, calloutColor }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: borderColor,
            background: borderColor + "15",
            border: `1px solid ${borderColor + "40"}`,
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          JOB {jobNum}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
          {title}
        </span>
      </div>
      {children}
      <StatCallout text={callout} color={calloutColor || borderColor} />
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: COLORS.bgDark,
        border: "none",
        borderRadius: 8,
        padding: "8px 14px",
        color: "#fff",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
      <div>
        ARO:{" "}
        <span style={{ color: COLORS.accent, fontWeight: 700 }}>
          {fmt(payload[0].value)}
        </span>
      </div>
    </div>
  );
}

// ── Main Screen ──────────────────────────────────────────────

export default function ImpactDashboardScreen() {
  const { shopName, smsName } = useDemo();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100%",
        background: "#F3F4F6",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          background: COLORS.bgDark,
          padding: "28px 32px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Impact Dashboard
          </h1>
          <p style={{ fontSize: 14, color: "#94A3B8", margin: "4px 0 0" }}>
            {shopName} · Last 30 Days
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              background: COLORS.accent,
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.06em",
              borderRadius: 20,
              padding: "6px 14px",
            }}
          >
            POWERED BY PREDII
          </div>
          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.35)",
              color: "#fff",
              borderRadius: 8,
              padding: "7px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={14} />
            Export Report
          </button>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────── */}
      <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* ── Summary KPI Cards ───────────────────────────── */}
        <div style={{ display: "flex", gap: 16 }}>
          <SummaryCard
            icon={Zap}
            iconColor={COLORS.accent}
            label="Recommendations"
            value="347"
            valueSub="across all 4 jobs"
          />
          <SummaryCard
            icon={CheckCircle}
            iconColor="#3B82F6"
            label="Acted On"
            value="78%"
            valueSub="adoption rate"
            valueColor="#3B82F6"
          />
          <SummaryCard
            icon={DollarSign}
            iconColor={COLORS.success}
            label="Revenue Impact"
            value="+$14,200"
            valueSub="incremental this month"
            valueColor={COLORS.success}
          />
          <SummaryCard
            icon={FileCheck}
            iconColor="#8B5CF6"
            label="3C Compliance"
            value="+27 pts"
            valueSub="64% → 91%"
            valueColor="#8B5CF6"
          />
        </div>

        {/* ── Impact by Job ────────────────────────────────── */}
        <div>
          <h2
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: "0 0 14px",
            }}
          >
            Impact by Job
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
          >
            {/* JOB 1 — Intake & Diagnosis */}
            <JobCard
              jobNum={1}
              title="Intake & Diagnosis"
              borderColor="#3B82F6"
              callout="↓ 2.6 pts comeback rate"
              calloutColor="#3B82F6"
            >
              <MetricRow icon={Zap} label="Recommendations generated" value="89" />
              <MetricRow icon={Target} label="Accuracy vs. final diagnosis" value="91%" />
              <MetricRow
                icon={AlertTriangle}
                label="Comeback rate"
                value="3.2%"
                note="5.8%"
              />
              <MetricRow
                icon={DollarSign}
                label="Est. cost saved"
                value="$2,600"
                noteColor={COLORS.success}
                bold
              />
            </JobCard>

            {/* JOB 2 — 3C Compliance */}
            <JobCard
              jobNum={2}
              title="3C Compliance"
              borderColor={COLORS.success}
              callout="+25 pts compliance"
              calloutColor={COLORS.success}
            >
              <MetricRow
                icon={FileCheck}
                label="ROs flagged / rewritten"
                value="142 / 128"
                note=""
              />
              <MetricRow icon={ShieldCheck} label="Acceptance rate" value="90%" />
              <MetricRow
                icon={ChevronUp}
                label="Compliance score"
                value="89%"
                note="64%"
              />
              <MetricRow
                icon={Activity}
                label="Warranty rejections"
                value="0 this month"
                noteColor={COLORS.success}
                bold
              />
            </JobCard>

            {/* JOB 3 — Smart Upsell */}
            <JobCard
              jobNum={3}
              title="Smart Upsell"
              borderColor={COLORS.accent}
              callout="+$8,400 incremental rev"
              calloutColor={COLORS.accent}
            >
              <MetricRow icon={Zap} label="Recommendations / accepted" value="116 / 28%" />
              <MetricRow
                icon={DollarSign}
                label="Incremental revenue"
                value="+$8,400"
                noteColor={COLORS.success}
                bold
              />
              <MetricRow icon={Tag} label="Top upsell" value="Cabin filter + brake insp." />
              <div style={{ paddingTop: 4 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: COLORS.textSecondary }}>ARO lift</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                    +$42{" "}
                    <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 400 }}>
                      (target $75)
                    </span>
                  </span>
                </div>
                <ProgressBar value={42} max={75} color={COLORS.accent} />
              </div>
            </JobCard>

            {/* JOB 4 — Operational Intelligence */}
            <JobCard
              jobNum={4}
              title="Operational Intelligence"
              borderColor={COLORS.success}
              callout="8/12 insights acted on"
              calloutColor={COLORS.success}
            >
              <MetricRow icon={BarChart2} label="Root-cause insights surfaced" value="12" />
              <MetricRow
                icon={CheckCircle}
                label="Insights acted on"
                value="8 / 12"
                noteColor={COLORS.success}
              />
              <MetricRow icon={Activity} label="Action rate" value="67%" />
              <MetricRow
                icon={TrendingUp}
                label="Approval rate held"
                value="87%"
                noteColor="#3B82F6"
              />
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  background: COLORS.success + "10",
                  border: `1px solid ${COLORS.success + "30"}`,
                  borderRadius: 6,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                <span style={{ fontWeight: 700, color: COLORS.success }}>Biggest win: </span>
                Marcus 3C coaching: 54 → 78 score in 3 weeks
              </div>
            </JobCard>
          </div>
        </div>

        {/* ── 90-Day ARO Trend Chart ───────────────────────── */}
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "20px 24px",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
              ARO Trend — 90 Days
            </h2>
            <p style={{ fontSize: 12, color: COLORS.textMuted, margin: "3px 0 0" }}>
              WrenchIQ deployment marked
            </p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart
              data={trendData}
              margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="aroGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[300, 700]}
                tickFormatter={(v) => `$${v}`}
                tick={{ fontSize: 11, fill: COLORS.textMuted }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<ChartTooltip />} />
              {/* Deployment marker */}
              <ReferenceLine
                x="Feb W1"
                stroke={COLORS.accent}
                strokeWidth={2}
                strokeDasharray="4 3"
                label={{
                  value: "WrenchIQ Live",
                  position: "insideTopRight",
                  fill: COLORS.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  dy: -6,
                }}
              />
              {/* Goal line */}
              <ReferenceLine
                y={650}
                stroke={COLORS.accent}
                strokeWidth={1.5}
                strokeDasharray="6 4"
                label={{
                  value: "Goal $650",
                  position: "right",
                  fill: COLORS.accent,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              />
              <Area
                type="monotone"
                dataKey="aro"
                stroke={COLORS.primary}
                strokeWidth={2.5}
                fill="url(#aroGradient)"
                dot={{ r: 3, fill: COLORS.primary, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: COLORS.accent, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────── */}
      <div
        style={{
          background: COLORS.bgDark,
          padding: "14px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, color: "#94A3B8" }}>
          WrenchIQ &nbsp;·&nbsp; {shopName} &nbsp;·&nbsp;{" "}
          <span style={{ color: COLORS.accent, fontWeight: 600 }}>{smsName} Connected</span>
          &nbsp;·&nbsp; Impact data powered by Predii
        </span>
      </div>
    </div>
  );
}
