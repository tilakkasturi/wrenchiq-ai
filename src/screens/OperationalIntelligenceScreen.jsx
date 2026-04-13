import { useState } from "react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import {
  Sparkles,
  RefreshCw,
  CheckSquare,
  AlertCircle,
  AlertTriangle,
  TrendingUp,
  Square,
} from "lucide-react";

// ─── KPI data ────────────────────────────────────────────────────────────────

const KPI_CARDS = [
  {
    job: "JOB 1",
    label: "Diagnosis Accuracy",
    value: "88%",
    target: "> 90%",
    status: "Needs Attention",
    statusColor: COLORS.warning,
    borderColor: COLORS.warning,
    valueColor: COLORS.warning,
  },
  {
    job: "JOB 2",
    label: "3C Compliance",
    value: "67%",
    target: "80%",
    status: "Off-Track",
    statusColor: COLORS.danger,
    borderColor: COLORS.danger,
    valueColor: COLORS.danger,
  },
  {
    job: "JOB 3",
    label: "ARO Upsell Lift",
    value: "+$42",
    target: "+$75",
    status: "In Progress",
    statusColor: "#3B82F6",
    borderColor: "#3B82F6",
    valueColor: "#3B82F6",
  },
  {
    job: "JOB 4",
    label: "Approval Rate",
    value: "87%",
    target: "> 75%",
    status: "On Track",
    statusColor: COLORS.success,
    borderColor: COLORS.success,
    valueColor: COLORS.success,
  },
];

// ─── Insight cards ────────────────────────────────────────────────────────────

const INSIGHT_CARDS = [
  {
    severity: "critical",
    borderColor: COLORS.danger,
    dotColor: COLORS.danger,
    title: "3C Compliance is Your Biggest Gap",
    detail:
      "Brake narratives averaging 54% completeness. Root cause: Marcus and DeShawn entering single-line causes without DVI references. Top GWG locations average 82%+. Warranty rejection risk is high.",
    metric: "54% avg score vs 80% target",
    metricColor: COLORS.danger,
    action: "Enable Auto-Scoring for Brake Category →",
  },
  {
    severity: "warning",
    borderColor: COLORS.warning,
    dotColor: COLORS.warning,
    title: "BMW Brake Jobs Dragging Parts Margin",
    detail:
      "Running 38% parts margin vs. 53% target on BMW brake jobs. OEM rotors low markup. Equivalent aftermarket option at 51% margin with same warranty coverage and customer outcome.",
    metric: "38% margin vs. 53% target",
    metricColor: COLORS.warning,
    action: "Review Parts Selection on Next BMW RO →",
  },
  {
    severity: "opportunity",
    borderColor: COLORS.success,
    dotColor: COLORS.success,
    title: "James Kowalski Is Your MVP — Replicate His Approach",
    detail:
      "96% efficiency, $545 avg job revenue, 4.8\u2605 customer rating. His 3C narratives score 91% consistently. Marcus and DeShawn are at 54% and 61%. Share James\u2019s templates.",
    metric: "$545/job avg vs $387 shop avg",
    metricColor: COLORS.success,
    action: "Share James\u2019s 3C Templates with Team \u2192",
  },
];

// ─── Action items ─────────────────────────────────────────────────────────────

function buildActions(smsName) {
  return [
    {
      num: 1,
      title: "Review 3C auto-scoring",
      detail:
        "Enable automatic 3C scoring for brake category. Est. impact: +18 pts compliance in 30 days.",
      job: "JOB 2",
    },
    {
      num: 2,
      title: "Coach Marcus using James\u2019s examples",
      detail:
        "3 specific ROs where James scored 91%+ vs. Marcus\u2019s 54%. Review together.",
      job: "JOB 2",
    },
    {
      num: 3,
      title: `Check Xero: 3 overdue invoices`,
      detail: `3 invoices totaling $3,215 overdue 30+ days. SMS ${smsName} follow-up recommended.`,
      job: "JOB 4",
    },
  ];
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ card }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        background: COLORS.bgCard,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${card.borderColor}`,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* Job tag */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: card.borderColor,
          background: `${card.borderColor}15`,
          borderRadius: 4,
          padding: "2px 7px",
          alignSelf: "flex-start",
        }}
      >
        {card.job}
      </span>

      {/* Value */}
      <div
        style={{
          fontSize: 36,
          fontWeight: 800,
          color: card.valueColor,
          lineHeight: 1.1,
          marginTop: 4,
        }}
      >
        {card.value}
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.textPrimary,
        }}
      >
        {card.label}
      </div>

      {/* Target */}
      <div
        style={{
          fontSize: 12,
          color: COLORS.textSecondary,
          marginTop: 2,
        }}
      >
        Target: {card.target}
      </div>

      {/* Status badge */}
      <span
        style={{
          marginTop: 8,
          alignSelf: "flex-start",
          fontSize: 11,
          fontWeight: 600,
          color: card.statusColor,
          background: `${card.statusColor}15`,
          borderRadius: 20,
          padding: "3px 10px",
        }}
      >
        {card.status}
      </span>
    </div>
  );
}

function InsightCard({ card }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${card.borderColor}`,
        borderRadius: 10,
        padding: "20px 20px 16px",
        flex: 1,
        minWidth: 260,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Severity dot */}
      <div
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 10,
          height: 10,
          borderRadius: "50%",
          background: card.dotColor,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.textPrimary,
          paddingRight: 20,
          lineHeight: 1.35,
        }}
      >
        {card.title}
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: 13,
          color: COLORS.textSecondary,
          lineHeight: 1.6,
        }}
      >
        {card.detail}
      </div>

      {/* Metric callout */}
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: card.metricColor,
          background: `${card.metricColor}12`,
          borderRadius: 6,
          padding: "5px 10px",
          alignSelf: "flex-start",
        }}
      >
        {card.metric}
      </div>

      {/* Action button */}
      <button
        style={{
          marginTop: 4,
          alignSelf: "flex-start",
          fontSize: 12,
          fontWeight: 600,
          color: card.borderColor,
          background: "transparent",
          border: `1.5px solid ${card.borderColor}`,
          borderRadius: 6,
          padding: "6px 12px",
          cursor: "pointer",
        }}
      >
        {card.action}
      </button>
    </div>
  );
}

function ActionItem({ item, done, onToggle }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 16,
        background: done ? COLORS.borderLight : COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 10,
        padding: "16px 18px",
        opacity: done ? 0.6 : 1,
        transition: "opacity 0.2s",
      }}
    >
      {/* Number circle */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: COLORS.primary,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          fontWeight: 700,
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        {item.num}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.textPrimary,
            textDecoration: done ? "line-through" : "none",
            marginBottom: 4,
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: COLORS.textSecondary,
            lineHeight: 1.55,
          }}
        >
          {item.detail}
        </div>
        <span
          style={{
            display: "inline-block",
            marginTop: 8,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.07em",
            color: COLORS.accent,
            background: `${COLORS.accent}15`,
            borderRadius: 4,
            padding: "2px 8px",
          }}
        >
          {item.job}
        </span>
      </div>

      {/* Done toggle */}
      <button
        onClick={() => onToggle(item.num)}
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 12,
          fontWeight: 600,
          color: done ? COLORS.success : COLORS.textSecondary,
          background: "transparent",
          border: `1.5px solid ${done ? COLORS.success : COLORS.border}`,
          borderRadius: 6,
          padding: "5px 10px",
          cursor: "pointer",
          marginTop: 2,
          whiteSpace: "nowrap",
        }}
      >
        {done ? (
          <CheckSquare size={14} color={COLORS.success} />
        ) : (
          <Square size={14} color={COLORS.textMuted} />
        )}
        {done ? "Done" : "Mark Done"}
      </button>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function OperationalIntelligenceScreen() {
  const { shopName, smsName } = useDemo();
  const [doneItems, setDoneItems] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const actions = buildActions(smsName);

  function handleToggle(num) {
    setDoneItems((prev) => ({ ...prev, [num]: !prev[num] }));
  }

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "20px 32px 0",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 16,
          }}
        >
          {/* Left */}
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: COLORS.textPrimary,
                letterSpacing: "-0.02em",
              }}
            >
              {shopName}
            </div>
            <div
              style={{
                fontSize: 13,
                color: COLORS.textSecondary,
                marginTop: 2,
              }}
            >
              Operational Intelligence &middot;{" "}
              <span style={{ color: COLORS.accent, fontWeight: 600 }}>
                Powered by Predii
              </span>
            </div>
          </div>

          {/* Right */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                textAlign: "right",
                lineHeight: 1.5,
              }}
            >
              Analyzing {shopName} &middot; 2,400 ROs
              <br />
              <span style={{ color: COLORS.success, fontWeight: 600 }}>
                {smsName} Connected
              </span>
            </div>
            <button
              onClick={handleRefresh}
              title="Refresh analysis"
              style={{
                background: "transparent",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "7px 9px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                color: COLORS.textSecondary,
              }}
            >
              <RefreshCw
                size={15}
                style={{
                  transition: "transform 0.8s ease",
                  transform: refreshing ? "rotate(360deg)" : "rotate(0deg)",
                }}
              />
            </button>
          </div>
        </div>

        {/* Analysis strip */}
        <div
          style={{
            background: `${COLORS.primary}08`,
            borderTop: `1px solid ${COLORS.border}`,
            padding: "7px 0",
            fontSize: 11.5,
            color: COLORS.textSecondary,
            letterSpacing: "0.01em",
          }}
        >
          <span style={{ fontWeight: 600, color: COLORS.primary }}>
            Last analysis:
          </span>{" "}
          Today 9:14 AM &nbsp;&middot;&nbsp;{" "}
          <span style={{ fontWeight: 600, color: COLORS.primary }}>Next:</span>{" "}
          Tomorrow 9:00 AM
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          flex: 1,
          padding: "28px 32px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 32,
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
          boxSizing: "border-box",
        }}
      >
        {/* ── KPI Cards ── */}
        <section>
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {KPI_CARDS.map((card) => (
              <KpiCard key={card.job} card={card} />
            ))}
          </div>
        </section>

        {/* ── What's Going On ── */}
        <section>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <Sparkles size={18} color={COLORS.accent} />
              <span
                style={{
                  fontSize: 17,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-0.01em",
                }}
              >
                What&rsquo;s Going On
              </span>
            </div>
            <span
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                marginLeft: 4,
              }}
            >
              Predii analyzed 2,400 ROs + {smsName} data
            </span>
          </div>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "stretch",
            }}
          >
            {INSIGHT_CARDS.map((card, i) => (
              <InsightCard key={i} card={card} />
            ))}
          </div>
        </section>

        {/* ── Do These Today ── */}
        <section>
          {/* Section header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <CheckSquare size={18} color={COLORS.primary} />
            <span
              style={{
                fontSize: 17,
                fontWeight: 800,
                color: COLORS.textPrimary,
                letterSpacing: "-0.01em",
              }}
            >
              Do These Today
            </span>
            <span
              style={{
                fontSize: 12,
                color: COLORS.textMuted,
                marginLeft: 4,
              }}
            >
              Ranked by objective gap impact
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {actions.map((item) => (
              <ActionItem
                key={item.num}
                item={item}
                done={!!doneItems[item.num]}
                onToggle={handleToggle}
              />
            ))}
          </div>
        </section>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.bgCard,
          padding: "14px 32px",
          fontSize: 11.5,
          color: COLORS.textMuted,
          textAlign: "center",
        }}
      >
        Operational intelligence powered by{" "}
        <span style={{ fontWeight: 700, color: COLORS.primary }}>Predii</span>{" "}
        &middot; {shopName} &middot; Connected to{" "}
        <span style={{ fontWeight: 600, color: COLORS.success }}>{smsName}</span>
      </div>
    </div>
  );
}
