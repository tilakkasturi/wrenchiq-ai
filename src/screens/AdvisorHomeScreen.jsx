/**
 * AdvisorHomeScreen — WrenchIQ Overlay layout
 *
 * Split-screen:
 *   Left 65%  — SMS mock: 4-column kanban board (Queue / Diagnosing / Approval / Pickup)
 *   Right 35% — WrenchIQ Agent: per-RO intelligence when selected, queue overview otherwise
 */

import { useState, useEffect } from "react";
import {
  Clock, CheckCircle, Sparkles, Brain, Zap,
  DollarSign, TrendingUp, User, Car, Target,
  AlertTriangle, MessageSquare, Phone, Mail,
  Star, ChevronRight,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { customers, vehicles } from "../data/demoData";
import { useShopObjectives } from "../context/ShopObjectivesContext";
import { filterIngsByRO } from "../services/ingEntityExtractor";

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
        "High approval rate (88%) — present upsells confidently; James rarely declines aligned recommendations.",
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

const CONTACT_ICON = { text: MessageSquare, call: Phone, email: Mail };

function fmtMoney(n) { return n != null ? `$${Number(n).toLocaleString()}` : "—"; }

// ── Live KG Intelligence panel ────────────────────────────────────────────────

function KGPanel() {
  const [loading, setLoading]   = useState(true);
  const [bullets, setBullets]   = useState([]);
  const [error, setError]       = useState(false);

  useEffect(() => {
    fetch("/api/knowledge-graph/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: "In 3 short bullet points, what are the top service patterns and upsell opportunities we should prioritize at intake today based on our repair order database?",
        history: [],
      }),
    })
      .then(r => r.text())
      .then(text => {
        const data = text ? JSON.parse(text) : {};
        if (!data.answer) throw new Error();
        const lines = data.answer
          .split(/\n/)
          .map(l => l.replace(/^[•\-\*\d\.\s]+/, "").trim())
          .filter(l => l.length > 20)
          .slice(0, 4);
        setBullets(lines);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderLeft: "3px solid #60A5FA",
      borderRadius: 8, padding: "12px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Brain size={13} color="#60A5FA" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          Live Shop Intelligence
        </span>
      </div>
      {loading && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
          Analyzing repair order database…
        </div>
      )}
      {error && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
          Connect MongoDB to enable live intelligence.
        </div>
      )}
      {!loading && !error && bullets.map((b, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start",
          padding: "5px 0",
          borderBottom: i < bullets.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
        }}>
          <Zap size={11} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function AdvisorHomeScreen({ onRoSelect, ros, showIntelligencePanel = true } = {}) {
  const { smsName, shopName, smsHeaderColor } = useDemo();
  const [selectedRoNum, setSelectedRoNum] = useState(null);
  const { ings } = useShopObjectives();
  const [checkedIngs, setCheckedIngs] = useState(new Set());
  const [agentData, setAgentData]       = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);

  // Optional externally-driven RO list (e.g. a data feed simulator). Falls
  // back to the static demo board so this screen keeps working standalone
  // with zero behavior change when the prop isn't passed.
  const BOARD_ROS = ros || STATIC_BOARD_ROS;

  const selected = BOARD_ROS.find(r => r.roNum === selectedRoNum) || null;

  function selectRO(ro) {
    const next = selectedRoNum === ro?.roNum ? null : ro;
    setSelectedRoNum(next?.roNum || null);
    setAgentData(null);

    if (next) {
      const veh = vehicles.find(v => v.customerId === next.custId);
      const cust = customers.find(c => c.id === next.custId);
      onRoSelect?.({ ...next, shopId: "cornerstone", _vehicle: veh || null });

      // Fire RO Advisor Agent
      setAgentLoading(true);
      const apiBase = (import.meta.env.VITE_API_BASE || "");
      fetch(`${apiBase}/api/ro-advisor`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ro: {
            ...(next._liveRO || {}),
            customerId:  next.custId,
            serviceType: next._liveRO?.serviceType || next.column,
            roNum:       next.roNum,
          },
          customer: cust || null,
          vehicle:  veh  || null,
          shopId:   "shop-001",
        }),
      })
        .then(r => r.json())
        .then(data => { setAgentData(data); setAgentLoading(false); })
        .catch(() => { setAgentLoading(false); });
    } else {
      onRoSelect?.(null);
    }
  }

  // Derived stats
  const approvalROs      = BOARD_ROS.filter(r => r.column === "approval");
  const revenueAtRisk    = approvalROs.reduce((s, r) => s + (r._liveRO?.totalEstimate || 0), 0);
  const pickupROs        = BOARD_ROS.filter(r => r.column === "pickup");
  const totalRevenue     = BOARD_ROS.reduce((s, r) => s + (r._liveRO?.totalEstimate || 0), 0);
  const avgOpenTime      = Math.round(BOARD_ROS.reduce((s, r) => s + r.minAgo, 0) / BOARD_ROS.length);
  const avgApproval      = Math.round(
    BOARD_ROS.reduce((s, r) => s + (r._liveRO?.customerApprovalRate || 0), 0) / BOARD_ROS.length * 100
  );

  // ── RO card (inside kanban column) ──────────────────────────────────────────

  function ROCard({ ro }) {
    const cust    = customers.find(c => c.id === ro.custId);
    const veh     = vehicles.find(v => v.customerId === ro.custId);
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
          {cust ? `${cust.firstName} ${cust.lastName}` : "Unknown"}
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

  // ── Right panel: selected RO intelligence ───────────────────────────────────

  function SelectedROPanel({ ro }) {
    const cust    = customers.find(c => c.id === ro.custId);
    const veh     = vehicles.find(v => v.customerId === ro.custId);
    const lro     = ro._liveRO;
    const colCfg  = BOARD_COLUMNS.find(c => c.id === ro.column);
    const loyalty = LOYALTY_CONFIG[lro?.loyaltyTier] || LOYALTY_CONFIG.regular;
    const ContactIcon = CONTACT_ICON[lro?.preferredContact] || MessageSquare;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Customer card */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 10,
          borderLeft: `3px solid ${colCfg?.color || COLORS.accent}`,
          padding: "14px 16px",
        }}>
          {/* Column badge + RO num */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: colCfg?.color,
              background: "rgba(255,255,255,0.07)", borderRadius: 4,
              padding: "2px 7px", letterSpacing: "0.06em",
            }}>
              {colCfg?.label.toUpperCase()}
            </span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)" }}>
              {ro.roNum}
            </span>
          </div>

          {/* Customer name + loyalty */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#F1F5F9" }}>
              {cust ? `${cust.firstName} ${cust.lastName}` : "Unknown"}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 700, color: loyalty.color,
              background: "rgba(255,255,255,0.08)", borderRadius: 4,
              padding: "2px 8px", textTransform: "uppercase", letterSpacing: "0.06em",
            }}>
              {lro?.loyaltyTier}
            </span>
          </div>

          {/* Vehicle */}
          {veh && (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 10 }}>
              {veh.year} {veh.make} {veh.model}
            </div>
          )}

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "LTV", value: fmtMoney(lro?.customerLTV), color: "#4ADE80" },
              { label: "Visits",  value: lro?.customerVisitCount, color: "#60A5FA" },
              { label: "Approval", value: `${Math.round((lro?.customerApprovalRate || 0) * 100)}%`, color: "#A78BFA" },
            ].map(k => (
              <div key={k.label} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 6,
                padding: "7px 8px", textAlign: "center",
              }}>
                <div style={{ fontSize: 15, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact + concern */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "11px 13px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <ContactIcon size={12} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Prefers {lro?.preferredContact}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
            "{lro?.customerConcern}"
          </p>
        </div>

        {/* Services */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, overflow: "hidden",
        }}>
          <div style={{
            padding: "8px 13px",
            borderBottom: "1px solid rgba(255,255,255,0.07)",
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)",
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            Services · {fmtMoney(lro?.totalEstimate)}
          </div>
          {(lro?.services || []).map((svc, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "8px 13px",
              borderBottom: i < (lro.services.length - 1) ? "1px solid rgba(255,255,255,0.05)" : "none",
            }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", flex: 1, marginRight: 8 }}>
                {svc.name}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", flexShrink: 0 }}>
                {fmtMoney((svc.laborCost || 0) + (svc.partsCost || 0))}
              </span>
            </div>
          ))}
          {lro?.declinedTotal > 0 && (
            <div style={{
              padding: "7px 13px", background: "rgba(245,158,11,0.08)",
              borderTop: "1px solid rgba(245,158,11,0.2)",
              fontSize: 11, color: "#FCD34D", fontWeight: 600,
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <AlertTriangle size={11} color="#FCD34D" />
              {fmtMoney(lro.declinedTotal)} in declined services
            </div>
          )}
        </div>

        {/* WrenchIQ Intelligence — live agent output */}
        <div style={{
          background: "rgba(34,197,94,0.06)",
          border: `1px solid ${agentLoading ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.18)"}`,
          borderRadius: 8, padding: "12px 14px",
          transition: "border-color 0.3s",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkles size={13} color="#4ADE80" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                WrenchIQ Intelligence
              </span>
            </div>
            {agentLoading && (
              <span style={{ fontSize: 10, color: "#86EFAC", opacity: 0.7 }}>Analyzing…</span>
            )}
          </div>

          {/* Loading state */}
          {agentLoading && !agentData && (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {[80, 60, 90].map((w, i) => (
                <div key={i} style={{
                  height: 10, borderRadius: 4,
                  background: "rgba(34,197,94,0.12)",
                  width: `${w}%`,
                  animation: "pulse 1.4s ease-in-out infinite",
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
            </div>
          )}

          {/* Agent brief */}
          {agentData?.advisorBrief && (
            <div style={{
              fontSize: 12, color: "#86EFAC", lineHeight: 1.55, marginBottom: 10,
              fontStyle: "italic", padding: "8px 10px",
              background: "rgba(34,197,94,0.08)", borderRadius: 6,
            }}>
              {agentData.advisorBrief}
            </div>
          )}

          {/* Upsells */}
          {(agentData?.upsells || []).length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(134,239,172,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Upsell Opportunities
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(agentData.upsells || []).map((u, i) => (
                  <div key={i} style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 6, padding: "9px 11px",
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", flex: 1, marginRight: 8 }}>
                        {u.service}
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent }}>
                          ~${u.estimatedCost}
                        </span>
                        <span style={{
                          fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                          background: u.confidence === "high" ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.12)",
                          color:      u.confidence === "high" ? "#4ADE80"               : "#FBBF24",
                        }}>
                          {u.confidence}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.4 }}>
                      {u.reason}
                    </div>
                    {u.talkTrack && (
                      <div style={{
                        fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5,
                        fontStyle: "italic",
                        borderLeft: "2px solid rgba(255,107,53,0.4)",
                        paddingLeft: 8,
                      }}>
                        "{u.talkTrack}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alerts */}
          {(agentData?.alerts || []).length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(252,211,77,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Alerts
              </div>
              {(agentData.alerts || []).map((a, i) => (
                <div key={i} style={{
                  display: "flex", gap: 7, alignItems: "flex-start",
                  padding: "5px 0",
                  borderBottom: i < agentData.alerts.length - 1 ? "1px solid rgba(252,211,77,0.08)" : "none",
                }}>
                  <AlertTriangle size={11} color="#FCD34D" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{a.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Fallback: hardcoded aiInsights when agent hasn't responded yet */}
          {!agentData && !agentLoading && (lro?.aiInsights || []).map((ins, i) => (
            <div key={i} style={{
              display: "flex", gap: 8, alignItems: "flex-start",
              padding: "6px 0",
              borderBottom: i < lro.aiInsights.length - 1 ? "1px solid rgba(34,197,94,0.1)" : "none",
            }}>
              <Zap size={11} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>{ins}</span>
            </div>
          ))}
        </div>

        {/* ings — filtered by vehicle conditions */}
        {ings.length > 0 && (() => {
          const roForFilter = veh ? { _vehicle: veh } : null;
          const relevantIngs = filterIngsByRO(ings, roForFilter);
          const activeIngs   = relevantIngs.filter(n => n.active);
          if (activeIngs.length === 0) return null;
          const unchecked = activeIngs.filter(n => !checkedIngs.has(n._id));
          return (
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ings — Don't Forget
                </div>
                {unchecked.length === 0
                  ? <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>All done</div>
                  : <div style={{ fontSize: 10, color: "#F97316", fontWeight: 700 }}>{unchecked.length} remaining</div>
                }
              </div>
              <div style={{ padding: "6px 8px" }}>
                {activeIngs.map(ing => {
                  const done  = checkedIngs.has(ing._id);
                  const label = ing.entityData?.displayLabel;
                  const disc  = ing.entityData?.discount;
                  return (
                    <div key={ing._id}
                      onClick={() => setCheckedIngs(prev => {
                        const s = new Set(prev);
                        done ? s.delete(ing._id) : s.add(ing._id);
                        return s;
                      })}
                      style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 4px", cursor: "pointer", borderRadius: 5, opacity: done ? 0.45 : 1, transition: "opacity 0.15s" }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${done ? "#10B981" : "rgba(255,255,255,0.3)"}`, background: done ? "#10B981" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: done ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.85)", lineHeight: 1.35, textDecoration: done ? "line-through" : "none" }}>
                          {ing.note}
                        </div>
                        {(label || disc) && !done && (
                          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                            {label && <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", borderRadius: 3, padding: "1px 5px", letterSpacing: "0.04em" }}>{label}</span>}
                            {disc  && <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(74,222,128,0.15)", color: "#4ADE80", borderRadius: 3, padding: "1px 5px" }}>{disc} off</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

      </div>
    );
  }

  // ── Right panel: queue overview (no RO selected) ─────────────────────────────

  function QueueOverviewPanel() {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

        {/* KPIs */}
        <div style={{
          background: "rgba(255,255,255,0.05)",
          borderRadius: 10, borderLeft: "3px solid #60A5FA",
          padding: "14px 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, color: "#60A5FA",
              background: "rgba(96,165,250,0.12)", borderRadius: 4,
              padding: "2px 7px", letterSpacing: "0.06em",
            }}>TODAY</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F5F9" }}>Queue Overview</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            {[
              { label: "ROs Today", value: BOARD_ROS.length,           color: "#60A5FA" },
              { label: "Avg Open Time", value: `${avgOpenTime}m`,      color: "#F1F5F9" },
              { label: "Today's Revenue", value: fmtMoney(totalRevenue), color: "#4ADE80" },
              { label: "Approval Rate", value: `${avgApproval}%`,       color: "#A78BFA" },
            ].map(k => (
              <div key={k.label} style={{
                background: "rgba(255,255,255,0.04)", borderRadius: 7,
                padding: "10px 12px",
              }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.color }}>{k.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Revenue at risk */}
          {revenueAtRisk > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 7, padding: "9px 12px",
            }}>
              <AlertTriangle size={14} color="#FCD34D" />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FCD34D" }}>
                  {fmtMoney(revenueAtRisk)} pending approval
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>
                  {approvalROs.length} RO{approvalROs.length > 1 ? "s" : ""} awaiting customer decision
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ready for pickup */}
        {pickupROs.length > 0 && (
          <div style={{
            background: "rgba(34,197,94,0.07)",
            border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 8, padding: "11px 13px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <CheckCircle size={13} color="#4ADE80" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Ready for Pickup ({pickupROs.length})
              </span>
            </div>
            {pickupROs.map((ro, i) => {
              const cust = customers.find(c => c.id === ro.custId);
              return (
                <div
                  key={ro.roNum}
                  onClick={() => selectRO(ro)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 0", cursor: "pointer",
                    borderBottom: i < pickupROs.length - 1 ? "1px solid rgba(34,197,94,0.12)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#F1F5F9" }}>
                      {cust ? `${cust.firstName} ${cust.lastName}` : ro.roNum}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{ro.job}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#4ADE80" }}>
                      {fmtMoney(ro._liveRO?.totalEstimate)}
                    </span>
                    <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Live KG intelligence */}
        <KGPanel />

        {/* ings — Don't Forget (all active ings, no vehicle filter when no RO selected) */}
        {ings.length > 0 && (() => {
          const activeIngs = ings.filter(n => n.active);
          if (activeIngs.length === 0) return null;
          const unchecked = activeIngs.filter(n => !checkedIngs.has(n._id));
          return (
            <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
              <div style={{ background: "rgba(255,255,255,0.06)", padding: "6px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  ings — Don't Forget
                </div>
                {unchecked.length === 0
                  ? <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700 }}>All done</div>
                  : <div style={{ fontSize: 10, color: "#F97316", fontWeight: 700 }}>{unchecked.length} remaining</div>
                }
              </div>
              <div style={{ padding: "6px 8px" }}>
                {activeIngs.map(ing => {
                  const done  = checkedIngs.has(ing._id);
                  const label = ing.entityData?.displayLabel;
                  const disc  = ing.entityData?.discount;
                  return (
                    <div key={ing._id}
                      onClick={() => setCheckedIngs(prev => {
                        const s = new Set(prev);
                        done ? s.delete(ing._id) : s.add(ing._id);
                        return s;
                      })}
                      style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "5px 4px", cursor: "pointer", borderRadius: 5, opacity: done ? 0.45 : 1, transition: "opacity 0.15s" }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${done ? "#10B981" : "rgba(255,255,255,0.3)"}`, background: done ? "#10B981" : "transparent", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, color: done ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.85)", lineHeight: 1.35, textDecoration: done ? "line-through" : "none" }}>
                          {ing.note}
                        </div>
                        {(label || disc) && !done && (
                          <div style={{ display: "flex", gap: 4, marginTop: 3 }}>
                            {label && <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)", borderRadius: 3, padding: "1px 5px", letterSpacing: "0.04em" }}>{label}</span>}
                            {disc  && <span style={{ fontSize: 8, fontWeight: 700, background: "rgba(74,222,128,0.15)", color: "#4ADE80", borderRadius: 3, padding: "1px 5px" }}>{disc} off</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Click hint */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          padding: "10px 0",
          fontSize: 11, color: "rgba(255,255,255,0.25)",
        }}>
          <Target size={11} color="rgba(255,255,255,0.25)" />
          Click any RO for per-customer intelligence
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

      {/* ── LEFT: SMS kanban (65%, or 100% when the intelligence panel is hidden) ── */}
      <div style={{
        width: showIntelligencePanel ? "65%" : "100%", display: "flex", flexDirection: "column",
        borderRight: showIntelligencePanel ? `1px solid ${COLORS.border}` : "none", overflow: "hidden",
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
            { label: `${avgApproval}% Approval Rate`,           color: COLORS.textSecondary },
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

      {/* ── RIGHT: WrenchIQ Agent panel (35%) — omitted entirely when this screen is
           hosted as the standalone SMS/DMS Representative UI (Surface C), which must
           show only the shop's own system, not a WrenchIQ sidecar ─────────────────── */}
      {showIntelligencePanel && (
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
              {selected && (
                <button
                  onClick={() => selectRO(null)}
                  style={{
                    marginLeft: "auto", background: "none", border: "none",
                    cursor: "pointer", fontSize: 11, color: "rgba(255,255,255,0.35)",
                    padding: 0,
                  }}
                >
                  ← Queue view
                </button>
              )}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingLeft: 34 }}>
              {selected
                ? `${selected.roNum} · ${BOARD_COLUMNS.find(c => c.id === selected.column)?.label}`
                : `Queue Intelligence — ${shopName}`}
            </div>
          </div>

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
            {selected ? <SelectedROPanel ro={selected} /> : <QueueOverviewPanel />}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 18px 14px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            display: "flex", alignItems: "center", gap: 6,
            fontSize: 10, color: "rgba(255,255,255,0.25)",
          }}>
            <Target size={11} color="rgba(255,255,255,0.25)" />
            WrenchIQ reads {smsName} — never writes to it
          </div>
        </div>
      )}
    </div>
  );
}
