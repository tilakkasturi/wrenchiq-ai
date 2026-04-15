/**
 * RepairOrderScreen — WrenchIQ Overlay layout
 *
 * Split-screen:
 *   Left 65%  — SMS mock: compact RO queue list with status columns
 *   Right 35% — WrenchIQ Agent dark panel: queue intelligence + flags + revenue
 */

import { useState, useEffect } from "react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { useRecommendations } from "../context/RecommendationsContext";
import {
  repairOrders as demoRepairOrders,
  getCustomer,
  getVehicle,
  getTech,
  SHOP,
} from "../data/demoData";
import { fetchActiveRepairOrders } from "../services/repairOrderService";
import {
  Plus,
  Clock,
  CheckCircle,
  Search,
  Wrench,
  Car,
  AlertTriangle,
  Sparkles,
  Camera,
  DollarSign,
  ChevronRight,
  TrendingUp,
  Zap,
  Brain,
  Target,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import DVIScreen from "./DVIScreen";
import NewROWizard from "../components/NewROWizard";
import CheckoutModal from "../components/CheckoutModal";
import ROAgentPanel from "../components/ROAgentPanel";

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  checked_in:    { label: "Checked In",    color: "#3B82F6", bg: "#EFF6FF" },
  inspecting:    { label: "Inspecting",    color: "#F97316", bg: "#FFF7ED" },
  estimate_sent: { label: "Estimate Sent", color: "#D97706", bg: "#FFFBEB" },
  approved:      { label: "Approved",      color: "#0D9488", bg: "#F0FDFA" },
  in_progress:   { label: "In Progress",   color: "#7C3AED", bg: "#F5F3FF" },
  ready:         { label: "Ready",         color: "#16A34A", bg: "#F0FDF4" },
  scheduled:     { label: "Scheduled",     color: "#6B7280", bg: "#F9FAFB" },
};

const KANBAN_STATUSES = [
  "checked_in", "inspecting", "estimate_sent",
  "approved", "in_progress", "ready",
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWaitHours(waitingSince) {
  if (!waitingSince) return 0;
  const diff = (new Date("2024-11-15T12:00:00") - new Date(waitingSince)) / 3600000;
  return Math.round(diff * 10) / 10;
}

function fmtMoney(n) {
  return n != null ? `$${Number(n).toLocaleString()}` : "—";
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const cfg = STATUS_CONFIG[status] || { color: "#9CA3AF" };
  return (
    <span style={{
      display: "inline-block",
      width: 8, height: 8,
      borderRadius: "50%",
      background: cfg.color,
      flexShrink: 0,
    }} />
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
      color: cfg.color, background: cfg.bg,
      borderRadius: 5, padding: "2px 7px",
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

// ── Left panel: single RO row ─────────────────────────────────────────────────

function RORow({ ro, selected, onSelect, onDVI, onCheckout, paidRos }) {
  const customer = ro._customer || getCustomer(ro.customerId);
  const vehicle  = ro._vehicle  || getVehicle(ro.vehicleId);
  const tech     = getTech(ro.techId);
  const [hov, setHov] = useState(false);
  const isPaid = paidRos?.[ro.id];
  const isReady = ro.status === "ready";
  const waitHrs = ro.status === "estimate_sent" ? getWaitHours(ro.waitingSince) : 0;

  const custName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : ro.customerName || "Unknown";
  const vehStr = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
    : `${ro.year || ""} ${ro.make || ""} ${ro.model || ""}`.trim() || "—";

  return (
    <div
      onClick={() => onSelect(ro.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "grid",
        gridTemplateColumns: "26px 130px 1fr 120px 80px 90px 100px",
        alignItems: "center",
        gap: 8,
        padding: "10px 16px",
        borderBottom: `1px solid ${COLORS.borderLight}`,
        background: selected
          ? `${STATUS_CONFIG[ro.status]?.bg || "#F9FAFB"}`
          : hov ? COLORS.borderLight : "transparent",
        cursor: "pointer",
        transition: "background 0.1s",
        borderLeft: selected ? `3px solid ${STATUS_CONFIG[ro.status]?.color || COLORS.primary}` : "3px solid transparent",
      }}
    >
      {/* Status dot */}
      <StatusDot status={ro.status} />

      {/* RO number + badges */}
      <div>
        <div style={{ fontSize: 11, fontFamily: "monospace", fontWeight: 600, color: COLORS.textSecondary }}>
          {ro.id}
        </div>
        {waitHrs > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
            <Clock size={9} color="#D97706" />
            <span style={{ fontSize: 10, color: "#D97706", fontWeight: 600 }}>{waitHrs}h</span>
          </div>
        )}
      </div>

      {/* Customer + vehicle */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.3 }}>
          {custName}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
          <Car size={10} color={COLORS.textMuted} />
          <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{vehStr}</span>
        </div>
      </div>

      {/* Service */}
      <div style={{
        fontSize: 11, color: COLORS.textSecondary,
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {ro.serviceType || "—"}
      </div>

      {/* Tech */}
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        {tech ? (
          <>
            <div style={{
              width: 22, height: 22, borderRadius: "50%",
              background: STATUS_CONFIG[ro.status]?.bg || "#F3F4F6",
              border: `1px solid ${STATUS_CONFIG[ro.status]?.color || COLORS.border}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700,
              color: STATUS_CONFIG[ro.status]?.color || COLORS.textSecondary,
              flexShrink: 0,
            }}>
              {tech.initials}
            </div>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{tech.name.split(" ")[0]}</span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic" }}>—</span>
        )}
      </div>

      {/* Estimate */}
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, textAlign: "right" }}>
        {isPaid
          ? <span style={{ fontSize: 11, color: "#16A34A", fontWeight: 700 }}>PAID</span>
          : fmtMoney(ro.totalEstimate)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <button
          onClick={e => { e.stopPropagation(); onDVI(ro.id); }}
          style={{
            padding: "4px 8px", fontSize: 10, fontWeight: 600,
            border: "1px solid #BAE6FD", borderRadius: 5,
            background: "#F0F9FF", color: "#0369A1", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 3,
          }}
        >
          <Camera size={10} />
          DVI
        </button>
        {isReady && !isPaid && (
          <button
            onClick={e => { e.stopPropagation(); onCheckout(ro.id); }}
            style={{
              padding: "4px 8px", fontSize: 10, fontWeight: 700,
              border: "none", borderRadius: 5,
              background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
              color: "#fff", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 3,
            }}
          >
            <DollarSign size={10} />
            Pay
          </button>
        )}
      </div>
    </div>
  );
}

// ── Right panel: Flag card ────────────────────────────────────────────────────

function FlagCard({ icon: Icon, iconColor, borderColor, title, sub, action }) {
  return (
    <div style={{
      display: "flex", gap: 10, alignItems: "flex-start",
      padding: "10px 12px",
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderLeft: `3px solid ${borderColor}`,
      borderRadius: 8,
      marginBottom: 8,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 6, flexShrink: 0,
        background: "rgba(255,255,255,0.07)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon size={13} color={iconColor} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#F1F5F9", lineHeight: 1.4 }}>
          {title}
        </div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{sub}</div>}
      </div>
      {action && (
        <div style={{
          fontSize: 10, fontWeight: 700, color: COLORS.accent,
          background: "rgba(255,107,53,0.12)", border: "1px solid rgba(255,107,53,0.25)",
          borderRadius: 4, padding: "3px 7px", whiteSpace: "nowrap", flexShrink: 0,
          alignSelf: "center",
        }}>
          {action}
        </div>
      )}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function RepairOrderScreen() {
  const { smsName, shopName, activeShopId, smsHeaderColor } = useDemo();
  const [searchQuery, setSearchQuery]     = useState("");
  const [selectedRoId, setSelectedRoId]  = useState(null);
  const [dviRoId, setDviRoId]            = useState(null);
  const [showNewRO, setShowNewRO]        = useState(false);
  const [checkoutRoId, setCheckoutRoId]  = useState(null);
  const [paidRos, setPaidRos]            = useState({});
  const [activeTab, setActiveTab]        = useState("queue");
  const [liveROs, setLiveROs]            = useState(null);
  const [dbConnected, setDbConnected]    = useState(false);

  useEffect(() => {
    // Pass activeShopId — fetches story ROs for demo shops (cornerstone/ridgeline)
    // or falls back to generic wrenchiq_ro board for other shops
    fetchActiveRepairOrders(activeShopId).then(ros => {
      if (ros?.length > 0) { setLiveROs(ros); setDbConnected(true); }
    });
  }, [activeShopId]);

  const repairOrders  = liveROs || demoRepairOrders;
  const kanbanROs     = repairOrders.filter(ro => KANBAN_STATUSES.includes(ro.status));
  const scheduledROs  = repairOrders.filter(ro => ro.status === "scheduled");

  // Search filter
  const filterROs = (ros) => {
    if (!searchQuery.trim()) return ros;
    const q = searchQuery.toLowerCase();
    return ros.filter(ro => {
      const cust = ro._customer || getCustomer(ro.customerId);
      const veh  = ro._vehicle  || getVehicle(ro.vehicleId);
      const cn   = cust ? `${cust.firstName} ${cust.lastName}`.toLowerCase() : (ro.customerName || "").toLowerCase();
      const vs   = veh  ? `${veh.year} ${veh.make} ${veh.model}`.toLowerCase() : "";
      return ro.id.toLowerCase().includes(q) || cn.includes(q) || vs.includes(q) || (ro.serviceType || "").toLowerCase().includes(q);
    });
  };

  const displayROs = filterROs(activeTab === "queue" ? kanbanROs : scheduledROs);

  // ── Right panel derived stats ────────────────────────────────────────────────

  const estimateSentROs   = kanbanROs.filter(ro => ro.status === "estimate_sent");
  const revenueAtRisk     = estimateSentROs.reduce((s, ro) => s + (ro.totalEstimate || 0), 0);
  const longWaitROs       = estimateSentROs.filter(ro => getWaitHours(ro.waitingSince) > 1);
  const readyROs          = kanbanROs.filter(ro => ro.status === "ready" && !paidRos[ro.id]);
  const unassignedROs     = kanbanROs.filter(ro => !ro.techId && ro.status !== "ready");
  const inProgressROs     = kanbanROs.filter(ro => ro.status === "in_progress");

  const queueScore = Math.min(100, Math.max(0,
    100 - longWaitROs.length * 15 - unassignedROs.length * 10 + readyROs.length * 5
  ));
  const scoreColor = queueScore >= 75 ? "#22C55E" : queueScore >= 50 ? "#F59E0B" : "#EF4444";

  const totalActiveRevenue = kanbanROs.reduce((s, ro) => s + (ro.totalEstimate || 0), 0);

  // ── Flags ─────────────────────────────────────────────────────────────────────

  const flags = [];
  longWaitROs.forEach(ro => {
    const cust = ro._customer || getCustomer(ro.customerId);
    const hrs  = getWaitHours(ro.waitingSince);
    const name = cust ? `${cust.firstName} ${cust.lastName}` : ro.id;
    flags.push({
      icon: Clock, iconColor: "#F59E0B", borderColor: "#F59E0B",
      title: `${name} waiting ${hrs}h for approval`,
      sub: `${fmtMoney(ro.totalEstimate)} estimate — follow up now`,
      action: "Text Now",
    });
  });
  readyROs.slice(0, 2).forEach(ro => {
    const cust = ro._customer || getCustomer(ro.customerId);
    const name = cust ? `${cust.firstName} ${cust.lastName}` : ro.id;
    flags.push({
      icon: CheckCircle, iconColor: "#22C55E", borderColor: "#22C55E",
      title: `${name}'s vehicle is ready`,
      sub: `${fmtMoney(ro.totalEstimate)} — ready for checkout`,
      action: "Checkout",
    });
  });
  unassignedROs.slice(0, 2).forEach(ro => {
    const cust = ro._customer || getCustomer(ro.customerId);
    const name = cust ? `${cust.firstName} ${cust.lastName}` : ro.id;
    flags.push({
      icon: AlertTriangle, iconColor: "#F87171", borderColor: "#EF4444",
      title: `${name} — no tech assigned`,
      sub: ro.serviceType || "Service unassigned",
      action: "Assign",
    });
  });

  // ── AI proactive briefing — built from live RO aiInsights (Agentic Moment 1) ──
  // When story ROs are loaded, show their PROACTIVE insights at the top of the panel.
  // This fires before the advisor clicks any RO — "WrenchIQ already read them all."
  const proactiveInsights = [];
  if (liveROs) {
    for (const ro of liveROs) {
      const cust = ro._customer;
      if (!cust || !ro.aiInsights?.length) continue;
      const proactive = ro.aiInsights.filter(i => i.startsWith('PROACTIVE'));
      if (proactive.length === 0) continue;
      proactiveInsights.push({
        name: `${cust.firstName} ${cust.lastName}`,
        text: proactive[0].replace(/^PROACTIVE\s*[—-]\s*/, ''),
        vehicle: ro._vehicle ? `${ro._vehicle.year} ${ro._vehicle.make} ${ro._vehicle.model}` : '',
        roId: ro.id,
      });
    }
  }

  // Static fallback suggestions for non-story-RO demos
  const suggestions = proactiveInsights.length === 0 ? [
    { text: "David's P0420 — TSB-19-052 applies, mention Honda goodwill", value: "Save $450" },
    { text: "Monica's cabin filter ($81) has been pending — text her", value: "+$81" },
    { text: "James' BMW due for brake fluid flush at 64K, add to estimate", value: "+$185" },
  ] : [];

  // ── DVI overlay ───────────────────────────────────────────────────────────────

  if (dviRoId) {
    return (
      <div style={{ position: "relative", height: "100%" }}>
        <DVIScreen />
        <button
          onClick={() => setDviRoId(null)}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 100,
            background: COLORS.primary, color: "#fff",
            border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          }}
        >
          <RotateCcw size={13} /> Back to Queue
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Modals */}
      {showNewRO && (
        <NewROWizard
          onClose={() => setShowNewRO(false)}
          onCreated={() => setShowNewRO(false)}
        />
      )}
      {checkoutRoId && (
        <CheckoutModal
          roId={checkoutRoId}
          repairOrders={repairOrders}
          onClose={() => setCheckoutRoId(null)}
          onPaid={(roId, result) => {
            setPaidRos(p => ({ ...p, [roId]: result }));
            setCheckoutRoId(null);
          }}
        />
      )}

      {/* Split layout */}
      <div style={{
        display: "flex", height: "100%", minHeight: 0,
        background: COLORS.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}>

        {/* ── LEFT: SMS panel (65%) ──────────────────────────────────────────── */}
        <div style={{
          width: "65%", display: "flex", flexDirection: "column",
          borderRight: `1px solid ${COLORS.border}`, overflow: "hidden",
        }}>

          {/* SMS chrome header — skin color driven by smsProvider */}
          <div style={{
            background: smsHeaderColor || "#F3F4F6",
            borderBottom: `1px solid ${smsHeaderColor ? "rgba(0,0,0,0.15)" : COLORS.border}`,
            padding: "0 16px",
            display: "flex", alignItems: "center", height: 44, gap: 8,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 5 }}>
              {["#EF4444", "#F59E0B", "#22C55E"].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{
              flex: 1, textAlign: "center",
              fontSize: 12, fontWeight: 600,
              color: smsHeaderColor ? "rgba(255,255,255,0.85)" : COLORS.textSecondary,
              letterSpacing: "0.02em",
            }}>
              {smsName} — Repair Order Queue
            </div>
            {dbConnected && (
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 10, fontWeight: 600, color: "#4ADE80",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", display: "inline-block" }} />
                Live
              </div>
            )}
          </div>

          {/* Toolbar */}
          <div style={{
            padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 10,
            borderBottom: `1px solid ${COLORS.border}`,
            background: COLORS.bgCard, flexShrink: 0,
          }}>
            {/* Tabs */}
            <div style={{ display: "flex", gap: 2 }}>
              {[
                { id: "queue", label: `Queue (${kanbanROs.length})` },
                { id: "scheduled", label: `Scheduled (${scheduledROs.length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "5px 12px", fontSize: 12, fontWeight: 600,
                    borderRadius: 6, border: "none", cursor: "pointer",
                    background: activeTab === tab.id ? COLORS.primary : "transparent",
                    color: activeTab === tab.id ? "#fff" : COLORS.textSecondary,
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center",
              gap: 7, background: "#F9FAFB",
              border: `1px solid ${COLORS.border}`, borderRadius: 7,
              padding: "6px 10px",
            }}>
              <Search size={13} color={COLORS.textMuted} />
              <input
                placeholder="Search customer, vehicle, RO…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  border: "none", background: "transparent",
                  fontSize: 12, color: COLORS.textPrimary,
                  outline: "none", flex: 1,
                }}
              />
            </div>

            {/* New RO */}
            <button
              onClick={() => setShowNewRO(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 14px",
                background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
                color: "#fff", border: "none", borderRadius: 7,
                fontSize: 12, fontWeight: 700, cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Plus size={13} />
              New RO
            </button>
          </div>

          {/* Table header */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "26px 130px 1fr 120px 80px 90px 100px",
            gap: 8, padding: "7px 16px",
            background: "#F9FAFB",
            borderBottom: `1px solid ${COLORS.border}`,
            flexShrink: 0,
          }}>
            {["", "RO #", "Customer / Vehicle", "Service", "Tech", "Est.", ""].map((h, i) => (
              <span key={i} style={{
                fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
                textTransform: "uppercase", letterSpacing: "0.06em",
                textAlign: i === 5 ? "right" : "left",
              }}>
                {h}
              </span>
            ))}
          </div>

          {/* RO rows */}
          <div style={{ flex: 1, overflowY: "auto", background: COLORS.bgCard }}>
            {displayROs.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", height: 180,
                color: COLORS.textMuted, gap: 8,
              }}>
                <Wrench size={28} color={COLORS.border} />
                <span style={{ fontSize: 13 }}>No repair orders found</span>
              </div>
            ) : (
              displayROs.map(ro => (
                <RORow
                  key={ro.id}
                  ro={ro}
                  selected={selectedRoId === ro.id}
                  onSelect={setSelectedRoId}
                  onDVI={setDviRoId}
                  onCheckout={setCheckoutRoId}
                  paidRos={paidRos}
                />
              ))
            )}
          </div>

          {/* Status summary footer */}
          <div style={{
            borderTop: `1px solid ${COLORS.border}`,
            background: "#F9FAFB",
            padding: "8px 16px",
            display: "flex", alignItems: "center", gap: 16,
            flexShrink: 0,
          }}>
            {KANBAN_STATUSES.map(s => {
              const count = kanbanROs.filter(ro => ro.status === s).length;
              const cfg   = STATUS_CONFIG[s];
              if (count === 0) return null;
              return (
                <div key={s} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <StatusDot status={s} />
                  <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 500 }}>
                    {cfg.label}: <strong style={{ color: cfg.color }}>{count}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: WrenchIQ Agent panel (35%) ─────────────────────────────── */}
        <div style={{
          width: "35%", display: "flex", flexDirection: "column",
          background: COLORS.navyDark, overflow: "hidden",
        }}>

          {/* Panel header */}
          <div style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <div style={{
                width: 26, height: 26, background: COLORS.gold,
                borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={13} color="#fff" />
              </div>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                WrenchIQ
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingLeft: 34 }}>
              Queue Intelligence — {shopName}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>

            {/* Queue Health score */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              borderLeft: `3px solid ${scoreColor}`,
              padding: "14px 16px",
              marginBottom: 14,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, color: "#60A5FA",
                  background: "rgba(96,165,250,0.12)", borderRadius: 4,
                  padding: "2px 7px", letterSpacing: "0.06em",
                }}>
                  QUEUE
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>
                  Health Score
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontSize: 44, fontWeight: 800, lineHeight: 1,
                  color: scoreColor, letterSpacing: "-0.02em",
                }}>
                  {queueScore}
                </span>
                <span style={{ fontSize: 20, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>/100</span>
              </div>

              <div style={{
                height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 3, overflow: "hidden", marginBottom: 12,
              }}>
                <div style={{
                  height: "100%", width: `${queueScore}%`,
                  background: `linear-gradient(90deg, ${scoreColor}AA, ${scoreColor})`,
                  borderRadius: 3, transition: "width 0.6s ease",
                }} />
              </div>

              {/* Mini KPIs */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Active ROs", value: kanbanROs.length, color: "#60A5FA" },
                  { label: "In Progress", value: inProgressROs.length, color: "#A78BFA" },
                  { label: "Ready", value: readyROs.length, color: "#4ADE80" },
                ].map(k => (
                  <div key={k.label} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 7, padding: "8px 10px", textAlign: "center",
                  }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{k.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue snapshot */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "12px 14px", marginBottom: 14,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
              }}>
                Revenue Snapshot
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 3 }}>Active Pipeline</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#F1F5F9" }}>{fmtMoney(totalActiveRevenue)}</div>
                </div>
                {revenueAtRisk > 0 && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 3 }}>
                      <AlertTriangle size={10} color="#F59E0B" />
                      <span style={{ fontSize: 10, color: "#FCD34D" }}>Pending Approval</span>
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#FCD34D" }}>{fmtMoney(revenueAtRisk)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Flags */}
            {flags.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
                  textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
                }}>
                  Needs Attention ({flags.length})
                </div>
                {flags.map((f, i) => <FlagCard key={i} {...f} />)}
              </div>
            )}

            {/* AI Proactive Briefing (Agentic Moment 1) — or static suggestions fallback */}
            <div>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <Brain size={12} color="rgba(255,255,255,0.35)" />
                {proactiveInsights.length > 0 ? "Proactive Briefing" : "AI Suggestions"}
              </div>

              {/* Proactive briefing cards from live story ROs */}
              {proactiveInsights.map((p, i) => (
                <div key={p.roId} style={{
                  background: "rgba(255,107,53,0.07)",
                  border: "1px solid rgba(255,107,53,0.18)",
                  borderLeft: `3px solid ${COLORS.accent}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 8,
                }}>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: COLORS.accent,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    marginBottom: 4, display: "flex", alignItems: "center", gap: 5,
                  }}>
                    <Sparkles size={11} color={COLORS.accent} />
                    {p.name} · {p.vehicle}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.45 }}>
                    {p.text}
                  </div>
                </div>
              ))}

              {/* Static fallback suggestions */}
              {suggestions.map((s, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  padding: "9px 0",
                  borderBottom: i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                }}>
                  <Zap size={12} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
                      {s.text}
                    </div>
                  </div>
                  <div style={{
                    fontSize: 10, fontWeight: 700, color: "#4ADE80",
                    background: "rgba(34,197,94,0.12)",
                    border: "1px solid rgba(34,197,94,0.25)",
                    borderRadius: 4, padding: "2px 7px",
                    whiteSpace: "nowrap", flexShrink: 0, alignSelf: "center",
                  }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: ROAgentPanel trigger */}
          <div style={{
            padding: "12px 18px 16px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              marginBottom: 6,
              fontSize: 10, color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase", letterSpacing: "0.07em",
            }}>
              <Target size={11} color="rgba(255,255,255,0.3)" />
              WrenchIQ reads {smsName} — never writes to it
            </div>
            <ROAgentPanel />
          </div>
        </div>
      </div>
    </>
  );
}
