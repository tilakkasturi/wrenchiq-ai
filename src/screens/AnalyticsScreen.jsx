import { useState } from "react";
import {
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Zap,
  Target,
  Users,
  BarChart2,
  RefreshCw,
  FileText,
  Activity,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { financials, technicians, SHOP } from "../data/demoData";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// ── Helpers ────────────────────────────────────────────────
function fmt(n) {
  return "$" + n.toLocaleString();
}

function pct(n) {
  return n + "%";
}

// ── Sub-components ─────────────────────────────────────────

function XeroBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#E8F7FE",
        border: "1px solid #B3E5FC",
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 13,
        fontWeight: 600,
        color: "#0277BD",
      }}
    >
      <div
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#13B5EA",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "-0.5px",
          lineHeight: 1,
        }}
      >
        x
      </div>
      <span>
        Connected to{" "}
        <span style={{ fontStyle: "italic", fontWeight: 700, color: "#13B5EA" }}>
          xero
        </span>
      </span>
    </div>
  );
}

function AIBadge() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        background: "linear-gradient(135deg, #1A3A4A 0%, #0D3B45 100%)",
        border: "1px solid rgba(255,107,53,0.3)",
        borderRadius: 20,
        padding: "4px 12px",
        fontSize: 12,
        fontWeight: 600,
        color: "#FF6B35",
      }}
    >
      <Zap size={11} />
      <span>Sonnet 4.6</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {Icon && <Icon size={18} color={COLORS.accent} />}
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: COLORS.textPrimary,
            letterSpacing: "-0.3px",
          }}
        >
          {title}
        </h2>
      </div>
      {subtitle && (
        <p
          style={{
            margin: "3px 0 0 26px",
            fontSize: 12,
            color: COLORS.textMuted,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Card({ children, style }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 14,
        border: `1px solid ${COLORS.border}`,
        padding: "18px 20px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Financial Health Banner ────────────────────────────────

function FinancialHealthBanner() {
  const { mtd } = financials;
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)",
        borderRadius: 16,
        padding: "22px 24px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* decorative circle */}
      <div
        style={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 160,
          height: 160,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.04)",
          pointerEvents: "none",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
        <TrendingUp size={14} color="#22C55E" />
        <span style={{ fontSize: 12, color: "#86EFAC", fontWeight: 600 }}>
          MTD Performance — November 2024
        </span>
      </div>

      {/* Key metrics row */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20 }}>
        {[
          { label: "MTD Revenue", value: fmt(mtd.totalRevenue), sub: null },
          {
            label: "Gross Profit",
            value: fmt(mtd.grossProfit),
            sub: pct(mtd.grossProfitPct),
          },
          {
            label: "Net Profit",
            value: fmt(mtd.netProfit),
            sub: pct(mtd.netProfitPct),
          },
        ].map((m, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              paddingRight: i < 2 ? 16 : 0,
              borderRight:
                i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none",
              marginRight: i < 2 ? 16 : 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 3,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: "-0.5px",
                lineHeight: 1.1,
              }}
            >
              {m.value}
            </div>
            {m.sub && (
              <div
                style={{
                  fontSize: 12,
                  color: "#86EFAC",
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {m.sub} margin
              </div>
            )}
          </div>
        ))}
      </div>

      {/* AI summary */}
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          borderRadius: 10,
          padding: "12px 14px",
          borderLeft: "3px solid #FF6B35",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
          <Zap
            size={13}
            color="#FF6B35"
            style={{ marginTop: 1, flexShrink: 0 }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.5,
            }}
          >
            You're tracking{" "}
            <strong style={{ color: "#86EFAC" }}>8.2% above last month</strong>.
            ARO is <strong style={{ color: "#fff" }}>$870</strong>, above your
            $850 goal. Parts margin at{" "}
            <strong style={{ color: "#86EFAC" }}>53%</strong> — on target.
          </p>
        </div>
      </div>

      {/* Xero sync */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <RefreshCw size={11} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          Data synced from Xero • Last sync: 2 min ago
        </span>
      </div>
    </div>
  );
}

// ── P&L Summary ───────────────────────────────────────────

function PLSummaryCard() {
  const rows = [
    { label: "Labor Revenue", value: financials.mtd.laborRevenue, type: "income" },
    { label: "Parts Revenue", value: financials.mtd.partsRevenue, type: "income" },
    { label: "Other Revenue", value: financials.mtd.otherRevenue, type: "income" },
    { label: "Total Revenue", value: financials.mtd.totalRevenue, type: "total" },
    { label: "Cost of Goods Sold", value: -73200, type: "expense" },
    { label: "Gross Profit", value: financials.mtd.grossProfit, type: "subtotal" },
    { label: "Operating Expenses", value: -91800, type: "expense" },
    { label: "Net Profit", value: financials.mtd.netProfit, type: "total" },
  ];

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <BarChart2 size={16} color={COLORS.primary} />
          <span
            style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}
          >
            P&L Summary
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            background: "#E8F7FE",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 11,
            fontWeight: 600,
            color: "#13B5EA",
          }}
        >
          <div
            style={{
              width: 13,
              height: 13,
              borderRadius: "50%",
              background: "#13B5EA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 8,
              fontWeight: 800,
            }}
          >
            x
          </div>
          xero
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <tbody>
          {rows.map((row, i) => {
            const isTotal = row.type === "total";
            const isSubtotal = row.type === "subtotal";
            const isExpense = row.type === "expense";
            const isFirstTotal = i === 3;
            return (
              <tr
                key={i}
                style={{
                  borderTop:
                    isTotal || isSubtotal || isFirstTotal
                      ? `1px solid ${COLORS.border}`
                      : "none",
                  background: isTotal ? COLORS.borderLight : "transparent",
                }}
              >
                <td
                  style={{
                    padding: "7px 8px",
                    fontSize: isTotal ? 13 : 12,
                    fontWeight: isTotal || isSubtotal ? 700 : 400,
                    color: isTotal ? COLORS.textPrimary : COLORS.textSecondary,
                    borderRadius: isTotal ? "6px 0 0 6px" : 0,
                  }}
                >
                  {row.label}
                </td>
                <td
                  style={{
                    padding: "7px 8px",
                    textAlign: "right",
                    fontSize: isTotal ? 14 : 13,
                    fontWeight: isTotal || isSubtotal ? 700 : 500,
                    color: isExpense
                      ? COLORS.danger
                      : isTotal && row.value > 0
                      ? COLORS.success
                      : isSubtotal
                      ? COLORS.primary
                      : COLORS.textPrimary,
                    borderRadius: isTotal ? "0 6px 6px 0" : 0,
                  }}
                >
                  {row.value < 0
                    ? `-${fmt(Math.abs(row.value))}`
                    : fmt(row.value)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${COLORS.borderLight}`,
          fontSize: 11,
          color: COLORS.textMuted,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <RefreshCw size={10} />
        Xero P&L Report — November 2024 MTD
      </div>
    </Card>
  );
}

// ── Revenue Chart ──────────────────────────────────────────

function RevenueChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: COLORS.textPrimary,
            marginBottom: 4,
          }}
        >
          {label}
        </div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: {fmt(p.value)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function RevenueChart() {
  const data = financials.revenueByMonth;
  return (
    <Card>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.textPrimary,
          }}
        >
          Monthly Revenue vs Target
        </div>
        <div
          style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}
        >
          Jan – Nov 2024 • Source: Xero
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: COLORS.textMuted }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<RevenueChartTooltip />} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill={COLORS.primary}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
          <Bar
            dataKey="target"
            name="Target"
            fill={COLORS.borderLight}
            radius={[4, 4, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
        {[
          { color: COLORS.primary, label: "Actual Revenue", border: null },
          {
            color: COLORS.borderLight,
            label: "Target",
            border: COLORS.border,
          },
        ].map((l, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              color: COLORS.textSecondary,
            }}
          >
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: l.color,
                border: l.border ? `1px solid ${l.border}` : "none",
              }}
            />
            {l.label}
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Expense Breakdown ──────────────────────────────────────

function ExpenseBreakdown() {
  const exp = financials.expenses;
  const expenseData = [
    { name: "Payroll", value: exp.payroll },
    { name: "Rent", value: exp.rent },
    { name: "Insurance", value: exp.insurance },
    { name: "Marketing", value: exp.marketing },
    { name: "Equipment", value: exp.equipment },
    { name: "Shop Supplies", value: exp.shopSupplies },
    { name: "Utilities", value: exp.utilities },
    { name: "Software", value: exp.software },
    { name: "Other", value: exp.waste + exp.misc },
  ];
  const total = expenseData.reduce((s, d) => s + d.value, 0);
  const PIE_COLORS = [
    COLORS.primary,
    "#1A5C6B",
    COLORS.accent,
    COLORS.warning,
    "#3B82F6",
    "#8B5CF6",
    "#10B981",
    "#EC4899",
    COLORS.textMuted,
  ];

  return (
    <Card>
      <div style={{ marginBottom: 14 }}>
        <div
          style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}
        >
          Expense Breakdown
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
          November MTD — Total: {fmt(total)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flexShrink: 0 }}>
          <PieChart width={130} height={130}>
            <Pie
              data={expenseData}
              cx={60}
              cy={60}
              innerRadius={35}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
              isAnimationActive={false}
            >
              {expenseData.map((_, i) => (
                <Cell
                  key={i}
                  fill={PIE_COLORS[i % PIE_COLORS.length]}
                />
              ))}
            </Pie>
          </PieChart>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: 5,
          }}
        >
          {expenseData.map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: PIE_COLORS[i % PIE_COLORS.length],
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: COLORS.textSecondary }}>
                  {item.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {fmt(item.value)}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    width: 30,
                    textAlign: "right",
                  }}
                >
                  {Math.round((item.value / total) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── AI Insights (What's Going On) ─────────────────────────

function WhatsGoingOn() {
  const insights = [
    {
      dot: COLORS.success,
      text: (
        <>
          Revenue up <strong>$8,400 vs last month</strong>. Brake jobs are 24%
          of services — your November brake promotion is working.
        </>
      ),
    },
    {
      dot: COLORS.success,
      text: (
        <>
          <strong>James Kowalski</strong> is your MVP: 96% efficiency, $545/job
          avg, 4.8★ customer rating.
        </>
      ),
    },
    {
      dot: COLORS.warning,
      text: (
        <>
          <strong>Mike Reeves</strong> efficiency dipped to{" "}
          <strong>85%</strong> (was 90% last month). Time management coaching
          recommended.
        </>
      ),
    },
    {
      dot: COLORS.warning,
      text: (
        <>
          Xero shows <strong>3 invoices overdue</strong> totaling $3,215. Sarah
          Chen's brake service ($1,890) is 14 days past due.
        </>
      ),
    },
    {
      dot: COLORS.danger,
      text: (
        <>
          Parts margin on <strong>BMW X3 brake job was only 38%</strong> — OEM
          rotors at low markup. Use aftermarket for non-safety items to hit 50%
          target.
        </>
      ),
    },
  ];

  return (
    <Card>
      <SectionHeader
        icon={Zap}
        title="What's Going On"
        subtitle="AI analysis of your shop performance"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {insights.map((item, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
          >
            <div
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: item.dot,
                marginTop: 4,
                flexShrink: 0,
                boxShadow: `0 0 6px ${item.dot}60`,
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 1.55,
              }}
            >
              {item.text}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Do These Today ────────────────────────────────────────

function DoTheseToday() {
  const actions = [
    {
      icon: "📞",
      title: "Call Sarah Chen",
      detail: "$1,890 invoice — 14 days overdue",
      source: "Xero AR Aging",
      color: COLORS.danger,
      bg: "#FEF2F2",
      border: "#FECACA",
    },
    {
      icon: "✅",
      title: "Approve Monica's serpentine belt upsell",
      detail: "$185 additional revenue — Bay 1 waiting",
      source: "RO-2024-1187",
      color: COLORS.success,
      bg: "#F0FDF4",
      border: "#BBF7D0",
    },
    {
      icon: "📋",
      title: "Assign Bay 5 to Robert Taylor's F-150",
      detail: "Oil + tire rotation, 1.5hr — assign Lisa",
      source: "RO-2024-1190",
      color: COLORS.primary,
      bg: "#F0F9FF",
      border: "#BAE6FD",
    },
  ];

  return (
    <Card>
      <SectionHeader
        icon={Target}
        title="Do These Today"
        subtitle="3 actions that move the needle"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {actions.map((a, i) => (
          <div
            key={i}
            style={{
              background: a.bg,
              border: `1px solid ${a.border}`,
              borderRadius: 10,
              padding: "12px 14px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              cursor: "default",
            }}
          >
            <div style={{ fontSize: 22, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: a.color,
                  marginBottom: 2,
                }}
              >
                {a.title}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {a.detail}
              </div>
              <div
                style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}
              >
                Source: {a.source}
              </div>
            </div>
            <ChevronRight
              size={14}
              color={a.color}
              style={{ flexShrink: 0 }}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── This Week, Focus On ───────────────────────────────────

function WeekFocus() {
  const items = [
    {
      icon: "🔍",
      title: "Add brake inspection to every oil change",
      detail:
        "4 oil changes scheduled this week. At 60% conversion, that's +$540 in additional brake service revenue.",
      color: COLORS.accent,
    },
    {
      icon: "⭐",
      title: "Ask 3 happiest customers for Google reviews",
      detail:
        "James K.'s customers average 4.8★. One Google review request email takes 2 minutes and compounds for years.",
      color: COLORS.warning,
    },
  ];

  return (
    <Card>
      <SectionHeader
        icon={TrendingUp}
        title="This Week, Focus On"
        subtitle="2 high-leverage opportunities"
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              borderLeft: `3px solid ${item.color}`,
              paddingLeft: 14,
              paddingTop: 2,
              paddingBottom: 2,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: COLORS.textPrimary,
                marginBottom: 4,
              }}
            >
              <span style={{ marginRight: 6 }}>{item.icon}</span>
              {item.title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: COLORS.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {item.detail}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Team Section ──────────────────────────────────────────

function TechCard({ tech }) {
  const effColor =
    tech.efficiency >= 90
      ? COLORS.success
      : tech.efficiency >= 80
      ? COLORS.warning
      : COLORS.danger;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 24 }}>{tech.emoji}</div>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.textPrimary,
              }}
            >
              {tech.name}
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>
              {tech.role}
            </div>
          </div>
        </div>
        <div
          style={{
            background: effColor + "18",
            border: `1px solid ${effColor}40`,
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 700,
            color: effColor,
            flexShrink: 0,
          }}
        >
          {tech.efficiency}%
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: 0, marginBottom: 10 }}>
        {[
          { label: "Avg Job", value: fmt(tech.avgJobValue) },
          { label: "Rating", value: tech.customerRating + "★" },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              paddingLeft: i > 0 ? 12 : 0,
              borderLeft:
                i > 0 ? `1px solid ${COLORS.borderLight}` : "none",
              marginLeft: i > 0 ? 12 : 0,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.4px",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: COLORS.textPrimary,
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Efficiency bar */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            height: 5,
            background: COLORS.borderLight,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${tech.efficiency}%`,
              background: effColor,
              borderRadius: 3,
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginTop: 3,
          }}
        >
          <span style={{ fontSize: 10, color: COLORS.textMuted }}>
            Efficiency
          </span>
          <span
            style={{ fontSize: 10, color: effColor, fontWeight: 600 }}
          >
            {tech.efficiency}%
          </span>
        </div>
      </div>

      {/* AI note */}
      <div
        style={{
          background: COLORS.borderLight,
          borderRadius: 7,
          padding: "7px 10px",
          display: "flex",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <Zap
          size={11}
          color={COLORS.accent}
          style={{ marginTop: 1, flexShrink: 0 }}
        />
        <span
          style={{
            fontSize: 11,
            color: COLORS.textSecondary,
            lineHeight: 1.45,
          }}
        >
          {tech.note}
        </span>
      </div>
    </div>
  );
}

function TeamSection() {
  return (
    <Card>
      <SectionHeader
        icon={Users}
        title="Your Team"
        subtitle="Technician performance this month"
      />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
        }}
      >
        {technicians.map((tech) => (
          <TechCard key={tech.id} tech={tech} />
        ))}
      </div>
    </Card>
  );
}

// ── AR Aging ──────────────────────────────────────────────

function ARAgingSection() {
  const { arAging } = financials;
  const total = arAging.reduce((s, r) => s + r.amount, 0);

  function urgencyColor(days) {
    if (days >= 14) return COLORS.danger;
    if (days >= 7) return COLORS.warning;
    return COLORS.textSecondary;
  }

  function rowBg(days) {
    if (days >= 14) return "#FEF2F2";
    if (days >= 7) return "#FFFBEB";
    return COLORS.borderLight;
  }

  function rowBorder(days) {
    if (days >= 14) return "#FECACA";
    if (days >= 7) return "#FDE68A";
    return COLORS.border;
  }

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={18} color={COLORS.accent} />
          <h2
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: COLORS.textPrimary,
              letterSpacing: "-0.3px",
            }}
          >
            Overdue Invoices
          </h2>
        </div>
        <div
          style={{
            background: "#FEF2F2",
            border: "1px solid #FECACA",
            borderRadius: 20,
            padding: "3px 10px",
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.danger,
          }}
        >
          {fmt(total)} overdue
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {arAging.map((inv, i) => {
          const urg = urgencyColor(inv.daysPastDue);
          return (
            <div
              key={i}
              style={{
                background: rowBg(inv.daysPastDue),
                border: `1px solid ${rowBorder(inv.daysPastDue)}`,
                borderRadius: 10,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: COLORS.textPrimary,
                    marginBottom: 2,
                  }}
                >
                  {inv.customer}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textMuted,
                    marginBottom: 3,
                  }}
                >
                  {inv.service}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  Invoice {inv.invoice}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: urg,
                  }}
                >
                  {fmt(inv.amount)}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: urg,
                    marginTop: 3,
                    background: urg + "15",
                    borderRadius: 20,
                    padding: "2px 8px",
                    display: "inline-block",
                  }}
                >
                  {inv.daysPastDue}d overdue
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${COLORS.borderLight}`,
          display: "flex",
          alignItems: "center",
          gap: 5,
          fontSize: 11,
          color: COLORS.textMuted,
        }}
      >
        <RefreshCw size={10} />
        Source: Xero Aged Receivables — synced 2 min ago
      </div>
    </Card>
  );
}

// ── Main Screen ───────────────────────────────────────────

function ViewToggle({ view, onViewChange }) {
  const tabs = [
    { key: "summary", label: "Summary", icon: FileText },
    { key: "charts", label: "Charts & Data", icon: Activity },
  ];

  return (
    <div
      style={{
        display: "inline-flex",
        background: COLORS.borderLight,
        borderRadius: 10,
        padding: 3,
        gap: 2,
      }}
    >
      {tabs.map((tab) => {
        const isActive = view === tab.key;
        const Icon = tab.icon;
        return (
          <button
            key={tab.key}
            onClick={() => onViewChange(tab.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: isActive ? 700 : 500,
              color: isActive ? "#fff" : COLORS.textSecondary,
              background: isActive
                ? COLORS.primary
                : "transparent",
              transition: "all 0.2s ease",
            }}
          >
            <Icon size={14} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default function AnalyticsScreen() {
  const [view, setView] = useState("summary");
  const ownerFirstName = SHOP.owner.split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: "100vh",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "0 20px 60px",
        }}
      >
        {/* ── HEADER ── */}
        <div style={{ paddingTop: 40, paddingBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-0.5px",
                  lineHeight: 1.2,
                }}
              >
                Here's how your shop is doing, {ownerFirstName}
              </h1>
              <p
                style={{
                  margin: "6px 0 0",
                  fontSize: 13,
                  color: COLORS.textMuted,
                }}
              >
                {today}
              </p>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <XeroBadge />
              <AIBadge />
            </div>
          </div>

          {/* ── VIEW TOGGLE ── */}
          <div style={{ marginTop: 20 }}>
            <ViewToggle view={view} onViewChange={setView} />
          </div>
        </div>

        {/* ── FINANCIAL HEALTH BANNER (always visible) ── */}
        <div style={{ marginBottom: 24 }}>
          <FinancialHealthBanner />
        </div>

        {/* ── SUMMARY VIEW ── */}
        {view === "summary" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <WhatsGoingOn />
            </div>
            <div style={{ marginBottom: 24 }}>
              <DoTheseToday />
            </div>
            <div style={{ marginBottom: 24 }}>
              <WeekFocus />
            </div>
            <div style={{ marginBottom: 24 }}>
              <TeamSection />
            </div>
            <div style={{ marginBottom: 24 }}>
              <ARAgingSection />
            </div>
          </>
        )}

        {/* ── CHARTS VIEW ── */}
        {view === "charts" && (
          <>
            <div style={{ marginBottom: 24 }}>
              <PLSummaryCard />
            </div>
            <div style={{ marginBottom: 24 }}>
              <RevenueChart />
            </div>
            <div style={{ marginBottom: 24 }}>
              <ExpenseBreakdown />
            </div>
            <div style={{ marginBottom: 24 }}>
              <TeamSection />
            </div>
            <div style={{ marginBottom: 24 }}>
              <ARAgingSection />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
