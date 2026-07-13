/**
 * AdvisorHomeScreen — SMS mock: 4-column kanban board (Queue / Diagnosing /
 * Approval / Pickup). Represents the shop's own RO board — WrenchIQ observes
 * it read-only via the Data Feed Model; it does not render WrenchIQ
 * intelligence itself (see WrenchIQSidecarScreen.jsx, Surface B, for that).
 */

import { useState } from "react";
import { Clock } from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { customers, vehicles } from "../data/demoData";

// ── Data ─────────────────────────────────────────────────────────────────────

const BOARD_COLUMNS = [
  { id: "queue",    label: "In Queue",          color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { id: "diagnosing", label: "Diagnosing",      color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { id: "approval", label: "Awaiting Approval", color: "#FF6B35", bg: "#FFF7F4", border: "#FDCBB3" },
  { id: "pickup",   label: "Ready for Pickup",  color: "#22C55E", bg: "#F0FDF4", border: "#BBF7D0" },
];

export const STATIC_BOARD_ROS = [
  {
    roNum: "RO-2024-1187", custId: "cust-004",
    job: "Brake service + 65K inspection",
    column: "queue", minAgo: 4,
    _liveRO: {
      customerConcern: "Brakes feel spongy, squealing at low speed",
      loyaltyTier: "loyal", preferredContact: "text",
      customerApprovalRate: 0.88, customerVisitCount: 9, customerLTV: 6840,
      totalEstimate: 892.50, totalLabor: 390.00, totalPartsCharged: 412.50,
      grossMarginDollars: 318.75, grossMarginPct: 36,
      effectiveLaborRate: 198, declinedTotal: 0,
      services: [
        { name: "Front Brake Pad & Rotor Replacement", laborHrs: 1.4, laborCost: 273, partsCost: 178.50 },
        { name: "Rear Brake Pad Replacement",          laborHrs: 0.6, laborCost: 117, partsCost: 89.00  },
        { name: "65K Multi-Point Inspection",          laborHrs: 0.3, laborCost: 58.50, partsCost: 0   },
      ],
      aiInsights: [
        "Loyal customer (9 visits, $6,840 LTV) — prioritize throughput and a smooth pickup experience.",
        "BMW X3 brakes: verify brake fluid condition. Flush ($189) has 78% acceptance at this mileage.",
        "65K inspection may surface cabin filter (last 20K ago) and DSC sensor — flag before customer waits.",
        "High approval rate (88%) — present service recommendations confidently; James rarely declines aligned recommendations.",
      ],
    },
  },
  {
    roNum: "RO-2026-0408", custId: "cust-006",
    job: "Engine Diagnostic — Timing Chain Stretch (P0016+P0017)",
    column: "approval", minAgo: 1440,
    _liveRO: {
      customerConcern: "Check engine light on for 2 weeks. Hesitation under acceleration. Rough idle on cold start.",
      loyaltyTier: "loyal", preferredContact: "call",
      customerApprovalRate: 0.82, customerVisitCount: 24, customerLTV: 16400,
      totalEstimate: 2480, totalLabor: 1662.50, totalPartsCharged: 690,
      grossMarginDollars: 868, grossMarginPct: 35,
      effectiveLaborRate: 175, declinedTotal: 0,
      dtcs: ["P0016", "P0017"],
      services: [
        { name: "Engine Diagnostic & DTC Analysis",                    laborHrs: 1.0, laborCost: 175,    partsCost: 0   },
        { name: "Timing Chain Kit Replacement (TSB PIP5765G)",         laborHrs: 8.0, laborCost: 1400,   partsCost: 638 },
        { name: "Engine Oil & Filter Change — Post-Timing (0W-20 8qt)",laborHrs: 0.5, laborCost: 87.50,  partsCost: 52  },
      ],
      aiInsights: [
        "TSB PIP5765G: GM Gen V EcoTec3 5.3L/6.2L timing chain stretch — P0016+P0017 at 80-100K mi. Ray's Silverado at 88.4K. Stretch confirmed on inspection.",
        "P0016 + P0017 together = Bank 1 intake AND exhaust cam offset. Both VVT solenoids must be replaced with the chain — prevents callback within 20K mi.",
        "Ray is your most loyal customer (24 visits, $16.4K LTV). He negotiates — show him the chain comparison photo (stretched vs new). He'll approve when he sees it.",
        "Estimate sent yesterday at 4:30 PM. No response yet — suggest follow-up call this morning. Ray likes to talk shop.",
      ],
    },
  },
  {
    roNum: "RO-2024-1189", custId: "cust-003",
    job: "Check engine — P0420 cat converter",
    column: "queue", minAgo: 19,
    _liveRO: {
      customerConcern: "Check engine light on 3 days ago, no performance issues",
      loyaltyTier: "vip", preferredContact: "call",
      customerApprovalRate: 0.94, customerVisitCount: 17, customerLTV: 14320,
      totalEstimate: 1640.00, totalLabor: 520.00, totalPartsCharged: 960.00,
      grossMarginDollars: 621.60, grossMarginPct: 38,
      effectiveLaborRate: 204, declinedTotal: 0,
      dtcs: ["P0420"],
      services: [
        { name: "Catalytic Converter Replacement (OEM-equiv)", laborHrs: 2.2, laborCost: 429, partsCost: 785.00 },
        { name: "O2 Sensor Upstream (verify)",                 laborHrs: 0.4, laborCost: 78,  partsCost: 98.00  },
        { name: "Exhaust Inspection",                          laborHrs: 0.2, laborCost: 39,  partsCost: 0      },
      ],
      aiInsights: [
        "VIP — 17 visits, $14,320 LTV. Highest-priority handling; consider complimentary loaner or Lyft voucher.",
        "P0420 at this mileage — verify upstream O2 sensor first to avoid unnecessary cat replacement.",
        "TSB SB-0115-21 covers partial warranty extension to 80K miles — could save Monica $400+.",
        "94% approval rate. Explain the diagnosis clearly and she will approve. Follow up within 24 hrs of pickup.",
      ],
    },
  },
  {
    roNum: "RO-2024-1190", custId: "cust-008",
    job: "60K major service + alignment",
    column: "queue", minAgo: 37,
    _liveRO: {
      customerConcern: "60K service due, steering vibrates at highway speed",
      loyaltyTier: "regular", preferredContact: "text",
      customerApprovalRate: 0.81, customerVisitCount: 5, customerLTV: 3890,
      totalEstimate: 1245.00, totalLabor: 680.00, totalPartsCharged: 445.00,
      grossMarginDollars: 460.65, grossMarginPct: 37,
      effectiveLaborRate: 193, declinedTotal: 280,
      services: [
        { name: "60K Major Service (oil, filters, plugs, fluids)", laborHrs: 2.5, laborCost: 487.50, partsCost: 312.00 },
        { name: "4-Wheel Alignment",                               laborHrs: 0.7, laborCost: 136.50, partsCost: 0      },
        { name: "Tire Balance (4 wheels)",                         laborHrs: 0.4, laborCost: 78,     partsCost: 0      },
      ],
      aiInsights: [
        "Steering vibration — address wheel balance before alignment for accurate results.",
        "Toyota RAV4 60K: timing check, serpentine belt, and differential fluid often missed. Add to estimate proactively.",
        "Priya declined brake fluid ($140) and cabin filter ($89) at last visit — $280 outstanding opportunity.",
        "81% approval rate — responds well to text updates with photos. Send inspection photo via SMS when done.",
      ],
    },
  },
  {
    roNum: "RO-2024-1192", custId: "cust-002",
    job: "A/C recharge + cabin filter",
    column: "approval", minAgo: 58,
    _liveRO: {
      customerConcern: "A/C not blowing cold, musty smell from vents",
      loyaltyTier: "vip", preferredContact: "text",
      customerApprovalRate: 0.91, customerVisitCount: 14, customerLTV: 11250,
      totalEstimate: 468.00, totalLabor: 195.00, totalPartsCharged: 218.00,
      grossMarginDollars: 178.60, grossMarginPct: 38,
      effectiveLaborRate: 201, declinedTotal: 195,
      services: [
        { name: "A/C Evac & Recharge (R-134a)",  laborHrs: 0.8, laborCost: 156,   partsCost: 88.00  },
        { name: "Cabin Air Filter Replacement",   laborHrs: 0.2, laborCost: 39,    partsCost: 48.00  },
        { name: "A/C Leak Check & Dye Test",      laborHrs: 0.5, laborCost: 97.50, partsCost: 82.00  },
      ],
      aiInsights: [
        "VIP (14 visits, $11,250 LTV) — David's approval is pending. Send a personal text update with the estimate link now.",
        "Musty smell = dirty evaporator core — recommend A/C disinfectant treatment ($59) alongside cabin filter.",
        "TSB 19-048: Honda CR-V A/C compressor oil consumption. Flag if refrigerant loss exceeds spec.",
        "David declined serpentine belt ($195) at 65K — now at 72K, re-present with urgency. 91% approval rate.",
      ],
    },
  },
  {
    roNum: "RO-2024-1183", custId: "cust-007",
    job: "Transmission fluid + spark plugs",
    column: "approval", minAgo: 74,
    _liveRO: {
      customerConcern: "Rough shifting at low speed, due for 90K service",
      loyaltyTier: "loyal", preferredContact: "call",
      customerApprovalRate: 0.79, customerVisitCount: 8, customerLTV: 5620,
      totalEstimate: 724.50, totalLabor: 390.00, totalPartsCharged: 248.50,
      grossMarginDollars: 261.00, grossMarginPct: 36,
      effectiveLaborRate: 196, declinedTotal: 340,
      services: [
        { name: "Transmission Fluid Service (CVT)", laborHrs: 1.2, laborCost: 234, partsCost: 118.50 },
        { name: "Spark Plug Replacement (4 cyl)",    laborHrs: 0.8, laborCost: 156, partsCost: 68.00  },
        { name: "90K Multi-Point Inspection",        laborHrs: 0.3, laborCost: 58.50, partsCost: 0   },
      ],
      aiInsights: [
        "Rough CVT shifting at 90K — verify fluid condition and check TSB 21-AT-002 before approving transmission service.",
        "Tom declined timing belt ($185) and coolant flush ($155) at last 2 visits — $340 opportunity. Re-present as safety item.",
        "Loyal customer, prefers a phone call for estimates — call Tom directly to boost approval likelihood.",
        "If CVT fluid is dark, recommend extended flush ($120 add-on) to protect against further wear.",
      ],
    },
  },
  {
    roNum: "RO-2024-1179", custId: "cust-001",
    job: "Strut replacement + wheel alignment",
    column: "pickup", minAgo: 192,
    _liveRO: {
      customerConcern: "Clunking noise over bumps, front end bouncy",
      loyaltyTier: "vip", preferredContact: "text",
      customerApprovalRate: 0.96, customerVisitCount: 21, customerLTV: 18940,
      totalEstimate: 1380.00, totalLabor: 780.00, totalPartsCharged: 480.00,
      grossMarginDollars: 524.40, grossMarginPct: 38,
      effectiveLaborRate: 205, declinedTotal: 0,
      services: [
        { name: "Front Strut Assembly Replacement (pair)", laborHrs: 2.8, laborCost: 546,    partsCost: 392.00 },
        { name: "4-Wheel Alignment Post-Strut",            laborHrs: 0.7, laborCost: 136.50, partsCost: 0     },
        { name: "Sway Bar End Link Inspection",            laborHrs: 0.2, laborCost: 39,     partsCost: 88.00 },
      ],
      aiInsights: [
        "Highest-LTV customer ($18,940, 21 visits) — send pickup notification text immediately.",
        "Sway bar end links were marginal — deferred ($240). Mention verbally at pickup to plant the seed.",
        "Sarah's 2022 Tesla (veh-007) is also due for tire rotation — schedule while she's here if she has time.",
        "Send satisfaction check-in text tomorrow morning to maintain loyalty and invite a Google review.",
      ],
    },
  },
  {
    roNum: "RO-2024-1181", custId: "cust-005",
    job: "Brake pad + rotor replacement",
    column: "pickup", minAgo: 247,
    _liveRO: {
      customerConcern: "Grinding noise when braking, brake pedal pulsating",
      loyaltyTier: "loyal", preferredContact: "text",
      customerApprovalRate: 0.85, customerVisitCount: 7, customerLTV: 5100,
      totalEstimate: 892.00, totalLabor: 468.00, totalPartsCharged: 328.00,
      grossMarginDollars: 320.40, grossMarginPct: 36,
      effectiveLaborRate: 197, declinedTotal: 185,
      services: [
        { name: "Front & Rear Brake Pad Replacement", laborHrs: 1.6, laborCost: 312,   partsCost: 218.00 },
        { name: "Front Rotor Resurfacing",             laborHrs: 0.8, laborCost: 156,   partsCost: 110.00 },
        { name: "Brake Fluid Flush",                   laborHrs: 0.3, laborCost: 58.50, partsCost: 38.00  },
      ],
      aiInsights: [
        "Angela's Outback has been waiting 4+ hours — notify her now to avoid dissatisfaction.",
        "Angela declined serpentine belt ($185) — at 95K on a 2018 Outback, this is an imminent failure risk. Mention at pickup.",
        "Brake job complete: rear wheel bearing inspection recommended — listen for noise during final road test.",
        "Loyal customer ($5,100 LTV) — a quick personal call at pickup vs. just a text will reinforce trust.",
      ],
    },
  },
];

// ── Loyalty helpers ───────────────────────────────────────────────────────────

const LOYALTY_CONFIG = {
  vip:     { label: "VIP",     color: "#7C3AED", bg: "rgba(124,58,237,0.15)" },
  loyal:   { label: "Loyal",   color: "#0D9488", bg: "rgba(13,148,136,0.15)" },
  regular: { label: "Regular", color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
};

function fmtMoney(n) { return n != null ? `$${Number(n).toLocaleString()}` : "—"; }

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdvisorHomeScreen({ onRoSelect, ros } = {}) {
  const { smsName, shopName, smsHeaderColor } = useDemo();
  const [selectedRoNum, setSelectedRoNum] = useState(null);

  // Optional externally-driven RO list (e.g. a data feed simulator). Falls
  // back to the static demo board so this screen keeps working standalone
  // with zero behavior change when the prop isn't passed.
  const BOARD_ROS = ros || STATIC_BOARD_ROS;

  function selectRO(ro) {
    const next = selectedRoNum === ro?.roNum ? null : ro;
    setSelectedRoNum(next?.roNum || null);

    if (next) {
      const veh = next._liveVehicle || vehicles.find(v => v.customerId === next.custId);
      onRoSelect?.({ ...next, shopId: "cornerstone", _vehicle: veh || null });
    } else {
      onRoSelect?.(null);
    }
  }

  // Derived stats (KPI strip)
  const totalRevenue = BOARD_ROS.reduce((s, r) => s + (r._liveRO?.totalEstimate || 0), 0);
  const avgOpenTime  = Math.round(BOARD_ROS.reduce((s, r) => s + r.minAgo, 0) / BOARD_ROS.length);
  const approvalRates = BOARD_ROS.map(r => r._liveRO?.customerApprovalRate).filter(v => v != null);
  const avgApproval  = approvalRates.length
    ? Math.round(approvalRates.reduce((s, v) => s + v, 0) / approvalRates.length * 100)
    : null;

  // ── RO card (inside kanban column) ──────────────────────────────────────────

  function ROCard({ ro }) {
    const cust    = ro._liveCustomerName ? null : customers.find(c => c.id === ro.custId);
    const veh     = ro._liveVehicle || vehicles.find(v => v.customerId === ro.custId);
    const colCfg  = BOARD_COLUMNS.find(c => c.id === ro.column);
    const loyalty = LOYALTY_CONFIG[ro._liveRO?.loyaltyTier] || LOYALTY_CONFIG.regular;
    const isSelected = selectedRoNum === ro.roNum;

    return (
      <div
        onClick={() => selectRO(isSelected ? null : ro)}
        style={{
          background: isSelected ? colCfg.bg : COLORS.bgCard,
          border: `1.5px solid ${isSelected ? colCfg.color : COLORS.border}`,
          borderLeft: `3px solid ${colCfg.color}`,
          borderRadius: 8, padding: "10px 12px",
          marginBottom: 8, cursor: "pointer",
          boxShadow: isSelected ? `0 0 0 2px ${colCfg.color}30` : "0 1px 3px rgba(0,0,0,0.06)",
          transition: "all 0.15s",
        }}
      >
        {/* RO num + loyalty */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: COLORS.textMuted, fontWeight: 600 }}>
            {ro.roNum.slice(-4)}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: loyalty.color,
            background: loyalty.bg, borderRadius: 3, padding: "1px 6px",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {ro._liveRO?.loyaltyTier}
          </span>
        </div>

        {/* Customer name */}
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>
          {ro._liveCustomerName || (cust ? `${cust.firstName} ${cust.lastName}` : "Unknown")}
        </div>

        {/* Vehicle */}
        {veh && (
          <div style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 4 }}>
            {veh.year} {veh.make} {veh.model}
          </div>
        )}

        {/* Job */}
        <div style={{
          fontSize: 11, color: COLORS.textSecondary,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          marginBottom: 7,
        }}>
          {ro.job}
        </div>

        {/* Footer: time + estimate */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          paddingTop: 7, borderTop: `1px solid ${COLORS.borderLight}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={10} color={ro.minAgo > 60 ? "#D97706" : COLORS.textMuted} />
            <span style={{
              fontSize: 10,
              color: ro.minAgo > 60 ? "#D97706" : COLORS.textMuted,
              fontWeight: ro.minAgo > 60 ? 600 : 400,
            }}>
              {ro.minAgo < 60 ? `${ro.minAgo}m` : `${Math.floor(ro.minAgo / 60)}h ${ro.minAgo % 60}m`}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
            {fmtMoney(ro._liveRO?.totalEstimate)}
          </span>
        </div>
      </div>
    );
  }

  // ── Layout ──────────────────────────────────────────────────────────────────

  return (
    <div style={{
      display: "flex", height: "100%", minHeight: 0,
      background: COLORS.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
    }}>

      {/* SMS kanban board — full width; this screen has no WrenchIQ intelligence
          panel of its own (see WrenchIQSidecarScreen.jsx, Surface B, for that) ── */}
      <div style={{
        width: "100%", display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>

        {/* SMS chrome header */}
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
            {smsName} — RO Board
          </div>
          <div style={{
            fontSize: 10, fontWeight: 600,
            color: smsHeaderColor ? "rgba(255,255,255,0.5)" : COLORS.textMuted,
          }}>
            {shopName}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          padding: "10px 16px",
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", gap: 16, flexShrink: 0,
        }}>
          {[
            { label: `${BOARD_ROS.length} ROs Today`,          color: COLORS.textSecondary },
            { label: `${avgOpenTime} min Avg Open Time`,        color: COLORS.textSecondary },
            { label: avgApproval != null ? `${avgApproval}% Approval Rate` : "Approval Rate — n/a", color: COLORS.textSecondary },
            { label: `${fmtMoney(totalRevenue)} Today's Revenue`, color: COLORS.textSecondary },
          ].map((k, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {i > 0 && <div style={{ width: 1, height: 14, background: COLORS.border }} />}
              <span style={{ fontSize: 12, fontWeight: 700, color: k.color }}>{k.label}</span>
            </div>
          ))}
        </div>

        {/* 4-column kanban */}
        <div style={{
          flex: 1, overflowX: "auto", overflowY: "hidden",
          padding: "12px 14px",
          display: "flex", gap: 10,
        }}>
          {BOARD_COLUMNS.map(col => {
            const colROs = BOARD_ROS.filter(r => r.column === col.id);
            const colTotal = colROs.reduce((s, r) => s + (r._liveRO?.totalEstimate || 0), 0);
            return (
              <div key={col.id} style={{
                flex: "1 1 0", minWidth: 180,
                display: "flex", flexDirection: "column",
              }}>
                {/* Column header */}
                <div style={{
                  background: col.bg, border: `1px solid ${col.border}`,
                  borderRadius: "8px 8px 0 0", padding: "8px 12px",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: col.color,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}>
                      {col.label}
                    </span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: "#fff",
                      background: col.color, borderRadius: 10,
                      padding: "1px 7px", minWidth: 20, textAlign: "center",
                    }}>
                      {colROs.length}
                    </span>
                  </div>
                  {colROs.length > 0 && (
                    <div style={{ fontSize: 10, color: col.color, fontWeight: 500 }}>
                      {fmtMoney(colTotal)} est.
                    </div>
                  )}
                </div>

                {/* Cards area */}
                <div style={{
                  flex: 1, overflowY: "auto",
                  background: col.bg + "55",
                  border: `1px solid ${col.border}`,
                  borderTop: "none",
                  borderRadius: "0 0 8px 8px",
                  padding: "8px 8px 6px",
                  minHeight: 120,
                }}>
                  {colROs.length === 0 ? (
                    <div style={{
                      textAlign: "center", padding: "24px 8px",
                      color: COLORS.textMuted, fontSize: 11, fontStyle: "italic",
                    }}>
                      Empty
                    </div>
                  ) : (
                    colROs.map(ro => <ROCard key={ro.roNum} ro={ro} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
