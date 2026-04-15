// OwnerCommandCenterScreen.jsx
// Implements: AE-782 (Owner Command Center), AE-783 (Proactive Agent Alerts),
//             AE-784 (Supplier Rebates), AE-785 (Bay Management)

import { useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Clock,
  Cpu,
  Package,
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  ChevronRight,
  MessageSquare,
  RotateCcw,
} from "lucide-react";
import AIInsightsStrip from "../components/AIInsightsStrip";
import { COLORS } from "../theme/colors";
import { SHOP } from "../data/demoData";

// ─── Shared sub-components ───────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        color: COLORS.textMuted,
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 12,
        border: `1px solid ${COLORS.border}`,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Pill({ children, color = COLORS.textSecondary, bg = COLORS.borderLight }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 20,
        padding: "2px 8px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function ActionButton({ children, onClick, variant = "primary", style = {} }) {
  const base = {
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 6,
    padding: "5px 12px",
    cursor: "pointer",
    border: "none",
    ...style,
  };
  const variants = {
    primary: { background: COLORS.accent, color: "#fff" },
    secondary: {
      background: "transparent",
      color: COLORS.textSecondary,
      border: `1px solid ${COLORS.border}`,
    },
    danger: { background: COLORS.danger, color: "#fff" },
    success: { background: COLORS.success, color: "#fff" },
  };
  return (
    <button style={{ ...base, ...variants[variant] }} onClick={onClick}>
      {children}
    </button>
  );
}

function ProgressBar({ pct, color = COLORS.accent, height = 8 }) {
  return (
    <div
      style={{
        background: COLORS.borderLight,
        borderRadius: 99,
        height,
        overflow: "hidden",
        width: "100%",
      }}
    >
      <div
        style={{
          width: `${Math.min(pct, 100)}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
          transition: "width 0.4s ease",
        }}
      />
    </div>
  );
}

// ─── TAB 1: TODAY ────────────────────────────────────────────────────────────

const BAYS_DATA = [
  {
    id: 1,
    status: "occupied",
    vehicle: "2019 Honda CR-V",
    ro: "RO-1189",
    tech: "Marcus W.",
    hrs: 1.2,
    projectedDone: "2:15 PM",
  },
  {
    id: 2,
    status: "occupied",
    vehicle: "2022 Tesla Model 3",
    ro: "RO-1192",
    tech: "DeShawn W.",
    hrs: 0.5,
    projectedDone: "1:30 PM",
  },
  {
    id: 3,
    status: "idle",
    idleMin: 45,
  },
  {
    id: 4,
    status: "occupied",
    vehicle: "2018 BMW X3",
    ro: "RO-1188",
    tech: "Kevin L.",
    hrs: 2.8,
    projectedDone: "3:45 PM",
  },
  {
    id: 5,
    status: "occupied",
    vehicle: "2021 Ford F-150",
    ro: "RO-1185",
    tech: "Marcus W.",
    hrs: 0.4,
    projectedDone: "1:00 PM",
  },
  {
    id: 6,
    status: "idle",
    idleMin: 0,
  },
];

const AGENT_ALERTS = [
  {
    id: 1,
    urgency: "red",
    icon: AlertTriangle,
    text: "RO-2024-1041 has been waiting for customer approval 48 minutes — Tom Wallace. High LTV $8,200.",
    actions: [{ label: "Nudge via SMS", variant: "primary" }],
    badge: "+$1,340 at risk",
    badgeColor: COLORS.danger,
    badgeBg: "#FEF2F2",
  },
  {
    id: 2,
    urgency: "yellow",
    icon: TrendingUp,
    text: "Tech Marcus averaging 2.1 hrs on jobs estimated at 1.5 hrs. 3 consecutive jobs over estimate.",
    actions: [{ label: "View Performance", variant: "secondary" }],
    badge: "Pattern forming",
    badgeColor: COLORS.warning,
    badgeBg: "#FFFBEB",
  },
  {
    id: 3,
    urgency: "orange",
    icon: Zap,
    text: "You're $1,660 short of today's target. 3 customers in queue — offer a Quick Lane special?",
    actions: [{ label: "Create Quick Lane Offer", variant: "primary" }],
    badge: "$1,660 gap",
    badgeColor: COLORS.accent,
    badgeBg: "#FFF7F4",
  },
  {
    id: 4,
    urgency: "yellow",
    icon: Package,
    text: "O'Reilly rebate cycle ends Sunday. $1,240 in eligible purchases this month. Threshold: $1,500.",
    actions: [{ label: "Order $260 more", variant: "secondary" }],
    badge: "$187 rebate at risk",
    badgeColor: COLORS.warning,
    badgeBg: "#FFFBEB",
  },
];

const URGENCY_BORDER = {
  red: COLORS.danger,
  yellow: COLORS.warning,
  orange: COLORS.accent,
  green: COLORS.success,
};

function TodayTab() {
  const [actedAlerts, setActedAlerts] = useState({});
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

      <AIInsightsStrip label="WrenchIQ Operational Briefing" insights={[
        { icon: "⚡", text: "Bay 3 idle 45 min — tech available. Reassign Tom's Tucson to recover lost capacity", action: "Reassign", value: "1.5hr recovered", color: "#F59E0B" },
        { icon: "📋", text: "3 estimates pending approval — 2 over 1 hour. Follow-up may help convert", action: "View ROs", value: "2 aging", color: "#EF4444" },
        { icon: "📊", text: "Marcus efficiency 85% this week — pattern forming. Assign lighter jobs this afternoon", action: "Reassign", value: "Pattern forming", color: "#7C3AED" },
        { icon: "3C", text: "Marcus Webb: 3 complaints under 40/100 this week. Location 3 compliance needs attention", action: "Coach", value: "34/100 avg", color: "#EF4444" },
      ]} />

      {/* Shop Health Hero — operational framing, not accounting P&L */}
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24 }}>
          {/* Left */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>
              Today's Shop Throughput
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: COLORS.textPrimary,
                lineHeight: 1,
                marginBottom: 4,
              }}
            >
              12 ROs
            </div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>
              Daily capacity: 16 ROs · 3 vehicles still in progress
            </div>
            <ProgressBar pct={78} color={COLORS.accent} height={10} />
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 8 }}>
              <span style={{ fontWeight: 700, color: COLORS.accent }}>4 ROs remaining</span> · Bay utilization on track · 2 awaiting approval
            </div>
          </div>
          {/* Right: utilization ring */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: `conic-gradient(${COLORS.accent} 0% 78%, ${COLORS.borderLight} 78% 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              position: "relative",
            }}
          >
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: "50%",
                background: COLORS.bgCard,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.accent, lineHeight: 1 }}>
                78%
              </div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>capacity</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Metric Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          {
            label: "Avg Repair Time",
            value: "2.4hr",
            delta: "-0.3hr vs last week",
            up: true,
          },
          {
            label: "Customer Approval Rate",
            value: "87%",
            delta: "+3% this week",
            up: true,
          },
          {
            label: "Bay Utilization",
            value: "76%",
            delta: "-5% vs target",
            up: false,
          },
          {
            label: "First-Visit Fix Rate",
            value: "94%",
            delta: "30d avg",
            up: true,
            neutral: true,
          },
        ].map((m) => (
          <Card key={m.label} style={{ padding: 14 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{m.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
              {m.value}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: m.neutral
                  ? COLORS.textMuted
                  : m.up
                  ? COLORS.success
                  : COLORS.danger,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              {!m.neutral && (m.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />)}
              {m.delta}
            </div>
          </Card>
        ))}
      </div>

      {/* AI Agent Alerts */}
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: COLORS.success,
              boxShadow: `0 0 0 3px ${COLORS.success}33`,
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            WrenchIQ AI · 4 alerts
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {AGENT_ALERTS.map((alert) => {
            const Icon = alert.icon;
            return (
              <div
                key={alert.id}
                style={{
                  background: COLORS.bgCard,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.border}`,
                  borderLeft: `4px solid ${URGENCY_BORDER[alert.urgency]}`,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                }}
              >
                <Icon
                  size={16}
                  style={{ color: URGENCY_BORDER[alert.urgency], marginTop: 2, flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, color: COLORS.textPrimary, marginBottom: 8, lineHeight: 1.4 }}
                  >
                    {alert.text}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {actedAlerts[alert.id] ? (
                      <Pill color={COLORS.success} bg="#F0FDF4">Done ✓</Pill>
                    ) : (
                      alert.actions.map((a) => (
                        <ActionButton
                          key={a.label}
                          variant={a.variant}
                          onClick={() => setActedAlerts(prev => ({ ...prev, [alert.id]: true }))}
                        >
                          {a.label}
                        </ActionButton>
                      ))
                    )}
                    <Pill color={alert.badgeColor} bg={alert.badgeBg}>
                      {alert.badge}
                    </Pill>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Bay Mini-Grid */}
      <div>
        <SectionHeader>Live Bay Status</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {BAYS_DATA.map((bay) => (
            <Card
              key={bay.id}
              style={{
                padding: 12,
                borderLeft: `3px solid ${
                  bay.status === "idle" ? (bay.idleMin > 0 ? COLORS.warning : COLORS.border) : COLORS.success
                }`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 6,
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted }}>
                  Bay {bay.id}
                </span>
                <Pill
                  color={bay.status === "occupied" ? COLORS.success : COLORS.textMuted}
                  bg={bay.status === "occupied" ? "#F0FDF4" : COLORS.borderLight}
                >
                  {bay.status === "occupied" ? "OCCUPIED" : "IDLE"}
                </Pill>
              </div>
              {bay.status === "occupied" ? (
                <>
                  <div
                    style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}
                  >
                    {bay.vehicle}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 }}>
                    {bay.ro} · {bay.tech}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Clock size={10} />
                    {bay.hrs} hrs in bay
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: 12,
                    color: bay.idleMin > 0 ? COLORS.warning : COLORS.textMuted,
                    fontWeight: bay.idleMin > 0 ? 600 : 400,
                  }}
                >
                  {bay.idleMin > 0 ? `${bay.idleMin} min idle` : "Available"}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 2: BAYS ─────────────────────────────────────────────────────────────

function BaysTab() {
  const [reassignMode, setReassignMode] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [reassigned, setReassigned] = useState(false);
  const [assignedBays, setAssignedBays] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
          Bay Management · Live View
        </div>
        <ActionButton
          variant={reassignMode ? "danger" : "secondary"}
          onClick={() => setReassignMode((v) => !v)}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <RotateCcw size={12} />
            {reassignMode ? "Exit Reassign Mode" : "Reassign Mode"}
          </span>
        </ActionButton>
      </div>

      {/* Bay Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {BAYS_DATA.map((bay) => (
          <Card
            key={bay.id}
            style={{
              borderLeft: `4px solid ${
                bay.status === "idle"
                  ? bay.idleMin > 0
                    ? COLORS.warning
                    : COLORS.border
                  : COLORS.success
              }`,
              outline: reassignMode ? `2px dashed ${COLORS.accent}44` : "none",
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}
            >
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: COLORS.textMuted,
                  lineHeight: 1,
                  marginBottom: 8,
                }}
              >
                Bay {bay.id}
              </div>
              <Pill
                color={bay.status === "occupied" ? COLORS.success : COLORS.textMuted}
                bg={bay.status === "occupied" ? "#F0FDF4" : COLORS.borderLight}
              >
                {bay.status === "occupied" ? "OCCUPIED" : "IDLE"}
              </Pill>
            </div>

            {bay.status === "occupied" ? (
              <div>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 4 }}
                >
                  {bay.vehicle}
                </div>
                {/* Tech avatar */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: COLORS.primaryLight,
                      color: "#fff",
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {bay.tech
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{bay.tech}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    fontSize: 12,
                    color: COLORS.textMuted,
                    marginBottom: 4,
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} />
                    {bay.hrs} hrs in bay
                  </span>
                  <span>{bay.ro}</span>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Projected done: <strong style={{ color: COLORS.textPrimary }}>{bay.projectedDone}</strong>
                </div>
              </div>
            ) : (
              <div>
                <div
                  style={{
                    fontSize: 13,
                    color: bay.idleMin > 0 ? COLORS.warning : COLORS.textMuted,
                    fontWeight: bay.idleMin > 0 ? 600 : 400,
                    marginBottom: 12,
                  }}
                >
                  {bay.idleMin > 0 ? `Idle for ${bay.idleMin} minutes` : "Available — no vehicle assigned"}
                </div>
                <ActionButton
                  variant={assignedBays[bay.id] ? "success" : "secondary"}
                  onClick={() => setAssignedBays(prev => ({ ...prev, [bay.id]: true }))}
                >
                  {assignedBays[bay.id] ? "Assigned ✓" : "Assign Vehicle"}
                </ActionButton>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* AI Reassignment Suggestion */}
      {!dismissed && (
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            borderLeft: `4px solid ${COLORS.accent}`,
            background: "#FFF7F4",
            padding: "14px 16px",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <Zap size={16} style={{ color: COLORS.accent, marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.accent,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 4,
              }}
            >
              AI Suggestion
            </div>
            <div style={{ fontSize: 13, color: COLORS.textPrimary, marginBottom: 10, lineHeight: 1.5 }}>
              Bay 3 has been idle 45 min. Tech Kevin in Bay 4 is ahead of schedule on RO-1188 (BMW).
              Consider moving Tom Wallace's Tacoma (RO-1041) to Bay 3.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {reassigned ? (
                <Pill color={COLORS.success} bg="#F0FDF4">Reassignment complete ✓</Pill>
              ) : (
                <ActionButton variant="primary" onClick={() => setReassigned(true)}>
                  Execute Reassignment
                </ActionButton>
              )}
              <ActionButton variant="secondary" onClick={() => setDismissed(true)}>
                Dismiss
              </ActionButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TAB 3: SUPPLIERS ────────────────────────────────────────────────────────

const SUPPLIERS = [
  {
    name: "Worldpac",
    spend: 3240,
    threshold: 4000,
    rebatePct: "3%",
    earned: 97,
    atThreshold: 120,
    expiry: "March 31",
    urgent: false,
    reached: false,
    badge: "Need $760 more to unlock $120 rebate",
    badgeColor: COLORS.textSecondary,
    badgeBg: COLORS.borderLight,
    primaryAction: "View Orders",
    primaryVariant: "secondary",
  },
  {
    name: "O'Reilly Auto Parts",
    spend: 1240,
    threshold: 1500,
    rebatePct: null,
    earned: null,
    atThreshold: 187,
    expiry: "March 23 (This Sunday!)",
    urgent: true,
    reached: false,
    badge: "URGENT — Ends Sunday",
    badgeColor: COLORS.danger,
    badgeBg: "#FEF2F2",
    primaryAction: "Order $260 more now",
    primaryVariant: "primary",
  },
  {
    name: "PartsTech",
    spend: 890,
    threshold: 800,
    rebatePct: null,
    earned: 95,
    atThreshold: 95,
    expiry: "March 31",
    urgent: false,
    reached: true,
    badge: "Rebate earned!",
    badgeColor: COLORS.success,
    badgeBg: "#F0FDF4",
    primaryAction: "Claim Rebate",
    primaryVariant: "success",
  },
];

const SPEND_BARS = [
  { vendor: "Worldpac", amount: 3240, color: COLORS.accent },
  { vendor: "O'Reilly", amount: 1240, color: "#3B82F6" },
  { vendor: "PartsTech", amount: 890, color: "#8B5CF6" },
  { vendor: "Advance Auto", amount: 340, color: COLORS.textMuted },
];

const MARGIN_LEAKS = [
  {
    text: "3 ROs this week used Advance Auto for brake pads when Worldpac was $22/ea cheaper — estimated leak: $66",
    action: "Set vendor priority",
  },
  {
    text: "Labor matrix not updated since January — 2 jobs under-billed by $95 combined",
    action: "Fix labor matrix",
  },
  {
    text: "Parts margin this month: 48.2% vs 53% target. Switching 2 recurring jobs to Worldpac recovers ~$420",
    action: "Optimize routing",
  },
];

function SuppliersTab() {
  const maxSpend = Math.max(...SPEND_BARS.map((s) => s.amount));
  const [orderedSuppliers, setOrderedSuppliers] = useState({});
  const [fixedLeaks, setFixedLeaks] = useState({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader>Vendor Rebate Tracker</SectionHeader>

      {/* Rebate Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {SUPPLIERS.map((s) => {
          const pct = Math.min((s.spend / s.threshold) * 100, 100);
          return (
            <Card
              key={s.name}
              style={{
                borderLeft: s.urgent
                  ? `4px solid ${COLORS.danger}`
                  : s.reached
                  ? `4px solid ${COLORS.success}`
                  : `4px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    Expires: {s.expiry}
                  </div>
                </div>
                <Pill color={s.badgeColor} bg={s.badgeBg}>
                  {s.badge}
                </Pill>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 24,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  marginBottom: 10,
                }}
              >
                <span>
                  Monthly spend:{" "}
                  <strong style={{ color: COLORS.textPrimary }}>
                    ${s.spend.toLocaleString()}
                  </strong>{" "}
                  / ${s.threshold.toLocaleString()} threshold
                </span>
                <span>
                  Rebate:{" "}
                  <strong style={{ color: COLORS.textPrimary }}>
                    {s.reached
                      ? `$${s.atThreshold} earned`
                      : `$${s.atThreshold} at threshold`}
                  </strong>
                </span>
              </div>
              <ProgressBar
                pct={pct}
                color={s.urgent ? COLORS.danger : s.reached ? COLORS.success : COLORS.accent}
                height={8}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                }}
              >
                <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {pct.toFixed(0)}% to threshold
                </span>
                {orderedSuppliers[s.name] ? (
                  <Pill color={COLORS.success} bg="#F0FDF4">Ordered ✓</Pill>
                ) : (
                  <ActionButton
                    variant={s.primaryVariant}
                    onClick={() => setOrderedSuppliers(prev => ({ ...prev, [s.name]: true }))}
                  >
                    {s.primaryAction}
                  </ActionButton>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Monthly Spend Chart */}
      <Card>
        <SectionHeader>Monthly Parts Spend by Vendor</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {SPEND_BARS.map((item) => (
            <div key={item.vendor} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 90, fontSize: 12, color: COLORS.textSecondary, flexShrink: 0 }}>
                {item.vendor}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    width: `${(item.amount / maxSpend) * 100}%`,
                    height: 20,
                    background: item.color,
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 8,
                    minWidth: 40,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Margin Leak Alerts */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <AlertTriangle size={14} style={{ color: COLORS.danger }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.danger }}>
            Margin Leak Alerts
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MARGIN_LEAKS.map((leak, i) => (
            <div
              key={i}
              style={{
                background: COLORS.bgCard,
                borderRadius: 10,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `3px solid ${fixedLeaks[i] ? COLORS.success : COLORS.danger}`,
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <div style={{ flex: 1, fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.4 }}>
                {leak.text}
              </div>
              {fixedLeaks[i] ? (
                <Pill color={COLORS.success} bg="#F0FDF4">Fixed ✓</Pill>
              ) : (
                <ActionButton
                  variant="secondary"
                  style={{ flexShrink: 0 }}
                  onClick={() => setFixedLeaks(prev => ({ ...prev, [i]: true }))}
                >
                  {leak.action}
                </ActionButton>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── TAB 4: TEAM ─────────────────────────────────────────────────────────────

const TECHS = [
  {
    name: "Marcus Williams",
    initials: "MW",
    jobs: 2,
    completed: 1,
    billedHrs: 2.4,
    efficiency: 89,
    upsell: 67,
    low: false,
    bays: [1, 5],
  },
  {
    name: "DeShawn Jackson",
    initials: "DJ",
    jobs: 2,
    completed: 0,
    billedHrs: 0.8,
    efficiency: 94,
    upsell: 72,
    low: false,
    bays: [2],
  },
  {
    name: "Kevin Liu",
    initials: "KL",
    jobs: 1,
    completed: 0,
    billedHrs: 2.8,
    efficiency: 71,
    upsell: 45,
    low: true,
    bays: [4],
  },
];

function TeamTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tech Performance Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <SectionHeader>Tech Performance Today</SectionHeader>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: COLORS.borderLight }}>
                {["Tech", "Jobs Today", "Completed", "Billed Hrs", "Efficiency", "Upsell Conv."].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        padding: "10px 14px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.textMuted,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {TECHS.map((t, i) => (
                <tr
                  key={t.name}
                  style={{
                    borderTop: i > 0 ? `1px solid ${COLORS.borderLight}` : "none",
                    background: t.low ? "#FEF2F2" : "transparent",
                  }}
                >
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: t.low ? COLORS.danger : COLORS.primaryLight,
                          color: "#fff",
                          fontSize: 11,
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {t.initials}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: t.low ? COLORS.danger : COLORS.textPrimary,
                        }}
                      >
                        {t.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary }}>
                    {t.jobs}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary }}>
                    {t.completed}
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary }}>
                    {t.billedHrs} hrs
                  </td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: t.low ? COLORS.danger : t.efficiency >= 90 ? COLORS.success : COLORS.textPrimary,
                      }}
                    >
                      {t.efficiency}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary }}>
                    {t.upsell}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Insight */}
      <div
        style={{
          borderRadius: 10,
          border: `1px solid ${COLORS.border}`,
          borderLeft: `4px solid ${COLORS.danger}`,
          background: "#FEF2F2",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <AlertTriangle size={15} style={{ color: COLORS.danger, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: COLORS.textPrimary }}>
          <strong>AI Insight:</strong> Kevin is 29% below efficiency today. 3rd consecutive slow day.
          Consider scheduling check-in.
        </span>
      </div>

      {/* Bay Assignments */}
      <Card>
        <SectionHeader>Bay Assignments</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {TECHS.map((t) => (
            <div
              key={t.name}
              style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: t.low ? COLORS.danger : COLORS.primaryLight,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {t.initials}
              </div>
              <span style={{ color: COLORS.textPrimary, fontWeight: 500 }}>{t.name}</span>
              <span style={{ color: COLORS.textMuted }}>—</span>
              <span style={{ color: COLORS.textSecondary }}>
                Bay{t.bays.length > 1 ? "s" : ""} {t.bays.join(" & ")}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── TAB 5: REPORTS ──────────────────────────────────────────────────────────

const REPORT_CARDS = [
  {
    icon: BarChart3,
    title: "Revenue Report",
    target: "analytics",
  },
  {
    icon: Shield,
    title: "Customer Trust Report",
    target: "trust",
  },
  {
    icon: Package,
    title: "Parts Margin Analysis",
    target: "parts",
  },
  {
    icon: Cpu,
    title: "Tech Efficiency Report",
    target: "analytics",
  },
];

function ReportsTab({ onNavigate }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <SectionHeader>Quick-Access Reports</SectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {REPORT_CARDS.map((r) => {
          const Icon = r.icon;
          return (
            <Card
              key={r.title}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                cursor: "pointer",
                transition: "box-shadow 0.15s",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: COLORS.borderLight,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={20} style={{ color: COLORS.primary }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
                  {r.title}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>Last updated: Today</div>
              </div>
              <div
                onClick={() => onNavigate && onNavigate(r.target)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  color: COLORS.accent,
                  cursor: "pointer",
                }}
              >
                View <ChevronRight size={13} />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN SCREEN ─────────────────────────────────────────────────────────────

const TABS = [
  { id: "today", label: "Today" },
  { id: "bays", label: "Bays" },
  { id: "suppliers", label: "Suppliers" },
  { id: "team", label: "Team" },
  { id: "reports", label: "Reports" },
];

export default function OwnerCommandCenterScreen({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("today");

  return (
    <div style={{ background: COLORS.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Page header */}
      <div
        style={{
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "16px 24px 0",
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary }}>
            Owner Command Center
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
            {SHOP.name} · {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>

        {/* Tab sub-nav */}
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 18px",
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? COLORS.accent : COLORS.textSecondary,
                background: "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                marginBottom: -1,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: 24 }}>
        {activeTab === "today" && <TodayTab />}
        {activeTab === "bays" && <BaysTab />}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "reports" && <ReportsTab onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
