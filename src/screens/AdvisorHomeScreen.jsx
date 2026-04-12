// AdvisorHomeScreen.jsx — AE-776 (Advisor Home) + AE-777 (5-Step RO Wizard)
import { useState, useEffect } from "react";
import {
  User, Car, Clock, ChevronRight, Plus, Search, Mic,
  CheckCircle, Send, MessageSquare, Mail, X, ChevronLeft,
  Wrench, BarChart2, FileText, AlertCircle, Zap, Brain, Sparkles
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { customers, vehicles, repairOrders } from "../data/demoData";
import { fetchActiveRepairOrders } from "../services/repairOrderService";
import CheckoutModal from "../components/CheckoutModal";
import AIInsightsStrip from "../components/AIInsightsStrip";
import { DollarSign } from "lucide-react";

// ── helpers ─────────────────────────────────────────────────────────────────

function initials(first, last) {
  return `${first[0]}${last[0]}`.toUpperCase();
}

function getVehicleForCustomer(customerId) {
  return vehicles.find((v) => v.customerId === customerId) || null;
}

// ── Static queue & board data ─────────────────────────────────────────────

const QUEUE = [
  {
    custId: "cust-001",
    waitMin: 2,
    concern: "Check engine light on, runs rough at idle",
  },
  {
    custId: "cust-002",
    waitMin: 14,
    concern: "90K service + brake inspection",
  },
  {
    custId: "cust-003",
    waitMin: 19,
    concern: "Check engine light came on 3 days ago",
  },
  {
    custId: "cust-005",
    waitMin: 22,
    concern: "A/C blowing warm air",
  },
  {
    custId: "cust-007",
    waitMin: 31,
    concern: "Oil change + tire rotation",
  },
  {
    custId: "cust-008",
    waitMin: 37,
    concern: "60K service + steering vibration at highway speed",
  },
];

const BOARD_COLUMNS = [
  {
    id: "queue",
    label: "In Queue",
    color: "#3B82F6",
    bgColor: "#EFF6FF",
    borderColor: "#BFDBFE",
  },
  {
    id: "diagnosing",
    label: "Diagnosing",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  {
    id: "approval",
    label: "Awaiting Approval",
    color: "#FF6B35",
    bgColor: "#FFF7F4",
    borderColor: "#FDCBB3",
  },
  {
    id: "pickup",
    label: "Ready for Pickup",
    color: "#22C55E",
    bgColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
];

const BOARD_ROS = [
  {
    roNum: "RO-2024-1187",
    custId: "cust-004",
    job: "Brake service + 65K inspection",
    column: "queue",
    minAgo: 4,
    _liveRO: {
      customerConcern: "Brakes feel spongy, squealing at low speed",
      loyaltyTier: "loyal",
      preferredContact: "text",
      customerApprovalRate: 0.88,
      customerVisitCount: 9,
      customerLTV: 6840,
      totalEstimate: 892.50,
      totalLabor: 390.00,
      totalPartsCharged: 412.50,
      grossMarginDollars: 318.75,
      grossMarginPct: 36,
      effectiveLaborRate: 198,
      totalFlaggedHrs: 2.0,
      totalActualHrs: 1.97,
      declinedTotal: 0,
      dtcs: [],
      services: [
        { name: "Front Brake Pad & Rotor Replacement", laborHrs: 1.4, laborCost: 273, partsCost: 178.50 },
        { name: "Rear Brake Pad Replacement", laborHrs: 0.6, laborCost: 117, partsCost: 89.00 },
        { name: "65K Multi-Point Inspection", laborHrs: 0.3, laborCost: 58.50, partsCost: 0 },
      ],
      aiInsights: [
        "James is a loyal customer (9 visits, $6,840 LTV) — prioritize throughput and a smooth pickup experience.",
        "BMW X3 brakes: verify brake fluid condition while in. Flush ($189) has 78% acceptance rate on European vehicles at this mileage.",
        "65K inspection may reveal cabin filter (last replaced 20K ago) and DSC sensor — flag before customer waits.",
        "High approval rate (88%) — present any upsells confidently; James rarely declines aligned recommendations.",
      ],
    },
  },
  {
    roNum: "RO-2024-1188",
    custId: "cust-006",
    job: "Oil change + tire rotation",
    column: "queue",
    minAgo: 9,
    _liveRO: {
      customerConcern: "Due for oil change, tires pulling slightly left",
      loyaltyTier: "regular",
      preferredContact: "email",
      customerApprovalRate: 0.72,
      customerVisitCount: 4,
      customerLTV: 2210,
      totalEstimate: 189.95,
      totalLabor: 97.50,
      totalPartsCharged: 68.45,
      grossMarginDollars: 72.80,
      grossMarginPct: 38,
      effectiveLaborRate: 187,
      totalFlaggedHrs: 0.8,
      totalActualHrs: 0.52,
      declinedTotal: 149,
      dtcs: [],
      services: [
        { name: "Full Synthetic Oil Change (5W-20)", laborHrs: 0.4, laborCost: 52, partsCost: 38.45 },
        { name: "Tire Rotation & Balance", laborHrs: 0.4, laborCost: 52, partsCost: 30.00 },
      ],
      aiInsights: [
        "Robert's F-150 is pulling left — check alignment while on the lift. Alignment ($149) declined at last visit; re-present with photo evidence from inspection.",
        "2022 F-150 at ~48K miles: brake inspection and cabin air filter are overdue. Add to MPI checklist.",
        "Regular tier customer (4 visits) — this is a trust-building visit. Fast turnaround + text update will increase loyalty score.",
        "Tire tread depth check: F-150 owners drive high mileage annually — proactive tire recommendation could convert to a $1,200+ sale.",
      ],
    },
  },
  {
    roNum: "RO-2024-1189",
    custId: "cust-003",
    job: "Check engine — P0420 cat converter",
    column: "queue",
    minAgo: 19,
    _liveRO: {
      customerConcern: "Check engine light came on 3 days ago, no performance issues noticed",
      loyaltyTier: "vip",
      preferredContact: "call",
      customerApprovalRate: 0.94,
      customerVisitCount: 17,
      customerLTV: 14320,
      totalEstimate: 1640.00,
      totalLabor: 520.00,
      totalPartsCharged: 960.00,
      grossMarginDollars: 621.60,
      grossMarginPct: 38,
      effectiveLaborRate: 204,
      totalFlaggedHrs: 2.8,
      totalActualHrs: 2.55,
      declinedTotal: 0,
      dtcs: ["P0420"],
      services: [
        { name: "Catalytic Converter Replacement (OEM-equiv)", laborHrs: 2.2, laborCost: 429, partsCost: 785.00 },
        { name: "O2 Sensor Upstream (verify)", laborHrs: 0.4, laborCost: 78, partsCost: 98.00 },
        { name: "Exhaust Inspection", laborHrs: 0.2, laborCost: 39, partsCost: 0 },
      ],
      aiInsights: [
        "VIP customer — Monica has 17 visits and $14,320 LTV. Highest-priority handling; consider complimentary loaner or Lyft voucher.",
        "P0420 on a 2021 Camry at this mileage often indicates early catalyst degradation — verify upstream O2 sensor first to avoid unnecessary cat replacement.",
        "94% approval rate: Monica trusts your recommendations implicitly. Explain the diagnosis clearly and she will approve.",
        "Camry catalytic converter: check for active TSB (SB-0115-21) covering partial warranty extension to 80K miles — could save Monica $400+.",
        "High LTV customer: follow up within 24 hrs of pickup with a personal text to reinforce trust and ensure satisfaction.",
      ],
    },
  },
  {
    roNum: "RO-2024-1190",
    custId: "cust-008",
    job: "60K major service + alignment",
    column: "queue",
    minAgo: 37,
    _liveRO: {
      customerConcern: "60K service due, steering wheel vibrates at highway speed",
      loyaltyTier: "regular",
      preferredContact: "text",
      customerApprovalRate: 0.81,
      customerVisitCount: 5,
      customerLTV: 3890,
      totalEstimate: 1245.00,
      totalLabor: 680.00,
      totalPartsCharged: 445.00,
      grossMarginDollars: 460.65,
      grossMarginPct: 37,
      effectiveLaborRate: 193,
      totalFlaggedHrs: 3.5,
      totalActualHrs: 3.52,
      declinedTotal: 280,
      dtcs: [],
      services: [
        { name: "60K Major Service (oil, filters, plugs, fluids)", laborHrs: 2.5, laborCost: 487.50, partsCost: 312.00 },
        { name: "4-Wheel Alignment", laborHrs: 0.7, laborCost: 136.50, partsCost: 0 },
        { name: "Tire Balance (4 wheels)", laborHrs: 0.4, laborCost: 78, partsCost: 0 },
      ],
      aiInsights: [
        "Steering vibration at highway speed points to wheel balance or tire issue — address before alignment for accurate results.",
        "Toyota RAV4 60K: timing check, serpentine belt inspection, and differential fluid are often overlooked. Add to estimate proactively.",
        "Priya declined brake fluid flush ($140) and cabin filter ($89) at last visit — re-present with updated mileage context ($280 opportunity).",
        "81% approval rate: Priya responds well to text updates with photos. Send inspection photo via SMS when diagnosis is complete.",
      ],
    },
  },
  {
    roNum: "RO-2024-1192",
    custId: "cust-002",
    job: "A/C recharge + cabin filter",
    column: "approval",
    minAgo: 58,
    _liveRO: {
      customerConcern: "A/C not blowing cold, musty smell from vents",
      loyaltyTier: "vip",
      preferredContact: "text",
      customerApprovalRate: 0.91,
      customerVisitCount: 14,
      customerLTV: 11250,
      totalEstimate: 468.00,
      totalLabor: 195.00,
      totalPartsCharged: 218.00,
      grossMarginDollars: 178.60,
      grossMarginPct: 38,
      effectiveLaborRate: 201,
      totalFlaggedHrs: 1.5,
      totalActualHrs: 1.0,
      declinedTotal: 195,
      dtcs: [],
      services: [
        { name: "A/C Evac & Recharge (R-134a)", laborHrs: 0.8, laborCost: 156, partsCost: 88.00 },
        { name: "Cabin Air Filter Replacement", laborHrs: 0.2, laborCost: 39, partsCost: 48.00 },
        { name: "A/C Leak Check & Dye Test", laborHrs: 0.5, laborCost: 97.50, partsCost: 82.00 },
      ],
      aiInsights: [
        "VIP customer (14 visits, $11,250 LTV) — David's approval is pending. Send a text update with the estimate link now.",
        "Musty smell indicates a likely dirty evaporator core — recommend A/C disinfectant treatment ($59) alongside cabin filter for complete fix.",
        "2019 Honda CR-V A/C: check for known compressor oil consumption issue (TSB 19-048). Flag if refrigerant loss exceeds spec.",
        "David declined the serpentine belt replacement ($195) at 65K — now at 72K, belt risk is elevated. Re-present with urgency framing.",
        "91% approval rate: David is highly receptive. Personal text from advisor typically converts 20% better than automated messages.",
      ],
    },
  },
  {
    roNum: "RO-2024-1183",
    custId: "cust-007",
    job: "Transmission fluid + spark plugs",
    column: "approval",
    minAgo: 74,
    _liveRO: {
      customerConcern: "Rough shifting at low speed, due for 90K service",
      loyaltyTier: "loyal",
      preferredContact: "call",
      customerApprovalRate: 0.79,
      customerVisitCount: 8,
      customerLTV: 5620,
      totalEstimate: 724.50,
      totalLabor: 390.00,
      totalPartsCharged: 248.50,
      grossMarginDollars: 261.00,
      grossMarginPct: 36,
      effectiveLaborRate: 196,
      totalFlaggedHrs: 2.5,
      totalActualHrs: 2.0,
      declinedTotal: 340,
      dtcs: [],
      services: [
        { name: "Transmission Fluid Service (CVT)", laborHrs: 1.2, laborCost: 234, partsCost: 118.50 },
        { name: "Spark Plug Replacement (4 cyl)", laborHrs: 0.8, laborCost: 156, partsCost: 68.00 },
        { name: "90K Multi-Point Inspection", laborHrs: 0.3, laborCost: 58.50, partsCost: 0 },
      ],
      aiInsights: [
        "Rough CVT shifting at 90K is a known pattern on Hyundai Tucson — verify fluid condition and check for TSB 21-AT-002 before approving transmission service.",
        "Tom declined timing belt check ($185) and coolant flush ($155) at last two visits — $340 outstanding opportunity. Re-present as a safety item at 90K.",
        "Loyal customer (8 visits) — prefers a phone call for estimates. Call Tom directly with the diagnosis to boost approval likelihood.",
        "If CVT fluid is dark or has a burnt smell, recommend extended transmission service flush ($120 add-on) to protect against further wear.",
      ],
    },
  },
  {
    roNum: "RO-2024-1179",
    custId: "cust-001",
    job: "Strut replacement + wheel alignment",
    column: "pickup",
    minAgo: 192,
    _liveRO: {
      customerConcern: "Clunking noise over bumps, front end bouncy",
      loyaltyTier: "vip",
      preferredContact: "text",
      customerApprovalRate: 0.96,
      customerVisitCount: 21,
      customerLTV: 18940,
      totalEstimate: 1380.00,
      totalLabor: 780.00,
      totalPartsCharged: 480.00,
      grossMarginDollars: 524.40,
      grossMarginPct: 38,
      effectiveLaborRate: 205,
      totalFlaggedHrs: 4.0,
      totalActualHrs: 3.81,
      declinedTotal: 0,
      dtcs: [],
      services: [
        { name: "Front Strut Assembly Replacement (pair)", laborHrs: 2.8, laborCost: 546, partsCost: 392.00 },
        { name: "4-Wheel Alignment Post-Strut", laborHrs: 0.7, laborCost: 136.50, partsCost: 0 },
        { name: "Sway Bar End Link Inspection", laborHrs: 0.2, laborCost: 39, partsCost: 88.00 },
      ],
      aiInsights: [
        "Sarah is your highest-LTV customer ($18,940, 21 visits) — vehicle is ready. Send pickup notification text immediately.",
        "Sway bar end links were marginal during inspection — replacement was deferred ($240). Mention this verbally at pickup to plant the seed for next visit.",
        "Sarah's 2022 Tesla Model 3 (veh-007) is also due for tire rotation — schedule while she's here if she has time.",
        "VIP follow-up: send a satisfaction check-in text tomorrow morning to maintain Sarah's loyalty and invite a Google review.",
      ],
    },
  },
  {
    roNum: "RO-2024-1181",
    custId: "cust-005",
    job: "Brake pad + rotor replacement",
    column: "pickup",
    minAgo: 247,
    _liveRO: {
      customerConcern: "Grinding noise when braking, brake pedal pulsating",
      loyaltyTier: "loyal",
      preferredContact: "text",
      customerApprovalRate: 0.85,
      customerVisitCount: 7,
      customerLTV: 5100,
      totalEstimate: 892.00,
      totalLabor: 468.00,
      totalPartsCharged: 328.00,
      grossMarginDollars: 320.40,
      grossMarginPct: 36,
      effectiveLaborRate: 197,
      totalFlaggedHrs: 2.4,
      totalActualHrs: 2.38,
      declinedTotal: 185,
      dtcs: [],
      services: [
        { name: "Front & Rear Brake Pad Replacement", laborHrs: 1.6, laborCost: 312, partsCost: 218.00 },
        { name: "Front Rotor Resurfacing", laborHrs: 0.8, laborCost: 156, partsCost: 110.00 },
        { name: "Brake Fluid Flush", laborHrs: 0.3, laborCost: 58.50, partsCost: 38.00 },
      ],
      aiInsights: [
        "Angela's Subaru Outback is ready — vehicle has been waiting 4+ hours. Notify now to avoid dissatisfaction.",
        "Angela declined the serpentine belt replacement ($185) at intake — at 95K miles on a 2018 Outback, this is an imminent failure risk. Mention at pickup.",
        "Brake job complete: 2018 Outback at 95K may also need rear wheel bearing inspection — listen for noise during final road test.",
        "Loyal customer with strong LTV ($5,100) — a quick personal call at pickup (vs. just a text) will significantly reinforce trust.",
      ],
    },
  },
];

// ── Wizard step data ──────────────────────────────────────────────────────

const WIZARD_STEPS = [
  "Customer",
  "Vehicle",
  "Complaint",
  "Estimate",
  "Approval",
];

const SAMPLE_ESTIMATE_LINES = [
  {
    id: 1,
    description: "Diagnostic Fee",
    custPrice: 150,
    cost: 0,
    margin: 100,
    vendor: "In-house",
    accepted: true,
  },
  {
    id: 2,
    description: "Catalytic Converter (OEM-equiv)",
    custPrice: 420,
    cost: 218,
    margin: 48,
    vendor: "Worldpac",
    accepted: true,
  },
  {
    id: 3,
    description: "Labor — 1.5 hrs @ $195/hr",
    custPrice: 293,
    cost: 0,
    margin: 100,
    vendor: "In-house",
    accepted: true,
  },
];

// ── Sub-components ────────────────────────────────────────────────────────

function Avatar({ first, last, size = 40, color = COLORS.primary }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.35,
        flexShrink: 0,
      }}
    >
      {initials(first, last)}
    </div>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        background: bg,
        borderRadius: 4,
        padding: "2px 7px",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        padding: "14px 18px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: accent ? COLORS.accent : COLORS.primary,
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
        {label}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function KGIntakePanel() {
  const [loading, setLoading] = useState(true);
  const [bullets, setBullets] = useState([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    const question =
      "In 3 short bullet points, what are the top service patterns and upsell opportunities we should prioritize at intake today based on our repair order database?";
    fetch("/api/knowledge-graph/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, history: [] }),
    })
      .then((r) => r.text())
      .then((text) => {
        const data = text ? JSON.parse(text) : {};
        if (!data.answer) throw new Error("no answer");
        const lines = data.answer
          .split(/\n/)
          .map((l) => l.replace(/^[•\-\*\d\.\s]+/, "").trim())
          .filter((l) => l.length > 20)
          .slice(0, 4);
        setBullets(lines);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        marginTop: 16,
        background: "linear-gradient(160deg, #0D3B45 0%, #0a2c35 100%)",
        borderRadius: 12,
        padding: "14px 16px",
        border: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
        <Brain size={13} color={COLORS.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, letterSpacing: 0.5, textTransform: "uppercase" }}>
          KG Intake Intelligence
        </span>
        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.07)", borderRadius: 3, padding: "1px 5px" }}>
          LIVE
        </span>
      </div>

      {loading && (
        <div>
          {[95, 80, 88].map((w, i) => (
            <div key={i} style={{ height: 9, background: "rgba(255,255,255,0.09)", borderRadius: 4, marginBottom: 7, width: `${w}%`, animation: "kgFade 1.4s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
          <style>{`@keyframes kgFade { 0%,100% { opacity:0.4 } 50% { opacity:0.85 } }`}</style>
        </div>
      )}

      {error && (
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>KG unavailable — start server to enable</div>
      )}

      {!loading && !error && bullets.map((b, i) => (
        <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
          <span style={{ color: COLORS.accent, fontSize: 13, lineHeight: 1.3, flexShrink: 0, marginTop: 1 }}>›</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>{b}</span>
        </div>
      ))}
    </div>
  );
}

function QueueCard({ item, isFirst, onStart }) {
  const cust = customers.find((c) => c.id === item.custId) || item._customer;
  const veh = getVehicleForCustomer(item.custId) || item._vehicle;
  if (!cust || !veh) return null;

  return (
    <div
      style={{
        background: isFirst ? "#FFF7F4" : COLORS.bgCard,
        border: `1px solid ${isFirst ? COLORS.accent : COLORS.border}`,
        borderRadius: 10,
        padding: "12px 14px",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 8,
      }}
    >
      <Avatar
        first={cust.firstName}
        last={cust.lastName}
        size={38}
        color={isFirst ? COLORS.accent : COLORS.primaryLight}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>
            {cust.firstName} {cust.lastName}
          </span>
          <Badge
            label={`${item.waitMin} min`}
            color={item.waitMin > 20 ? COLORS.danger : COLORS.warning}
            bg={item.waitMin > 20 ? "#FEF2F2" : "#FFFBEB"}
          />
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
          {veh.year} {veh.make} {veh.model} · {veh.mileage.toLocaleString()} mi
        </div>
        <div
          style={{
            fontSize: 12,
            color: COLORS.textMuted,
            marginTop: 3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {item.concern}
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0, marginTop: 2 }}>
        <button
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textSecondary,
            background: COLORS.borderLight,
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          View
        </button>
        <button
          onClick={() => onStart(item.custId)}
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            background: COLORS.primary,
            border: "none",
            borderRadius: 6,
            padding: "5px 10px",
            cursor: "pointer",
          }}
        >
          Start
        </button>
      </div>
    </div>
  );
}

function ROCard({ ro, colId, onCheckout, paidRos, onSelect, selected }) {
  const cust = customers.find((c) => c.id === ro.custId) || ro._customer;
  const veh = getVehicleForCustomer(ro.custId) || ro._vehicle;
  if (!cust || !veh) return null;

  const hr = Math.floor(ro.minAgo / 60);
  const min = ro.minAgo % 60;
  const timeLabel = hr > 0 ? `${hr}h ${min}m` : `${min}m`;
  const paid = paidRos && paidRos[ro.roNum];
  const [hovered, setHovered] = useState(false);
  const aiCount = ro._liveRO?.aiInsights?.length || 0;

  return (
    <div
      onClick={() => onSelect?.(ro.roNum)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: selected ? "#F5F3FF" : COLORS.bgCard,
        border: `1px solid ${selected ? "#7C3AED" : paid ? "#86EFAC" : hovered ? COLORS.primaryLight : COLORS.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: selected ? "0 0 0 2px #EDE9FE" : hovered ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.3 }}>
          {ro.roNum}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {aiCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", background: "#EDE9FE", border: "1px solid #C4B5FD", borderRadius: 4, padding: "1px 5px" }}>
              AI {aiCount}
            </span>
          )}
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{timeLabel}</span>
        </div>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginTop: 4 }}>
        {cust.firstName} {cust.lastName}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
        {veh.year} {veh.make} {veh.model}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{ro.job}</div>

      {/* Paid badge */}
      {paid && (
        <div style={{ marginTop: 8, padding: "5px 8px", background: "#DCFCE7", border: "1px solid #86EFAC", borderRadius: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <CheckCircle size={11} color="#16A34A" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803D" }}>
            PAID ${paid.amount} &mdash; {paid.method}
          </span>
        </div>
      )}

      {/* Finalize & Checkout — only on Ready for Pickup */}
      {colId === "pickup" && !paid && (
        <button
          onClick={() => onCheckout(ro.roNum)}
          style={{
            marginTop: 8, width: "100%",
            padding: "7px 0",
            background: `linear-gradient(135deg, ${COLORS.accent}, #E85D26)`,
            color: "#fff", border: "none", borderRadius: 6,
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            boxShadow: "0 3px 10px rgba(255,107,53,0.3)",
          }}
        >
          <DollarSign size={12} />
          Finalize &amp; Checkout
        </button>
      )}
    </div>
  );
}

// ── Wizard Steps ──────────────────────────────────────────────────────────

function WizardStep1({ selectedCust, setSelectedCust, onNext }) {
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newCust, setNewCust] = useState({ name: "", phone: "", email: "" });

  const filtered = query.length > 1
    ? customers.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          c.phone.includes(query)
      )
    : [];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: COLORS.textMuted,
            }}
          />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone..."
            style={{
              width: "100%",
              padding: "10px 12px 10px 38px",
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {filtered.length > 0 && (
        <div
          style={{
            border: `1px solid ${COLORS.border}`,
            borderRadius: 8,
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          {filtered.map((c, i) => {
            const veh = getVehicleForCustomer(c.id);
            const isSelected = selectedCust?.id === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedCust(c)}
                style={{
                  padding: "10px 14px",
                  borderBottom: i < filtered.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                  cursor: "pointer",
                  background: isSelected ? "#EFF6FF" : COLORS.bgCard,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <Avatar first={c.firstName} last={c.lastName} size={34} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>
                    {c.firstName} {c.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    {c.phone} · {veh ? `${veh.year} ${veh.make} ${veh.model}` : "No vehicle on file"}
                  </div>
                </div>
                {isSelected && <CheckCircle size={16} color={COLORS.success} />}
              </div>
            );
          })}
        </div>
      )}

      {selectedCust && (
        <div
          style={{
            background: "#F0FDF4",
            border: `1px solid #BBF7D0`,
            borderRadius: 8,
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 12,
          }}
        >
          <Zap size={14} color={COLORS.success} />
          <span style={{ fontSize: 12, color: "#15803D", fontWeight: 600 }}>
            AI matched via phone history · {selectedCust.visits} prior visits · LTV ${selectedCust.ltv.toLocaleString()}
          </span>
        </div>
      )}

      <button
        onClick={() => setShowNew(!showNew)}
        style={{
          fontSize: 13,
          color: COLORS.primary,
          background: "none",
          border: `1px dashed ${COLORS.border}`,
          borderRadius: 8,
          padding: "9px 14px",
          width: "100%",
          cursor: "pointer",
          textAlign: "left",
          fontWeight: 600,
        }}
      >
        + New Customer (walk-in)
      </button>

      {showNew && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          {["name", "phone", "email"].map((field) => (
            <input
              key={field}
              placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
              value={newCust[field]}
              onChange={(e) => setNewCust({ ...newCust, [field]: e.target.value })}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                fontSize: 13,
                outline: "none",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function WizardStep2({ selectedCust, onNext }) {
  const veh = selectedCust ? getVehicleForCustomer(selectedCust.id) : null;
  if (!veh) return <div style={{ color: COLORS.textSecondary }}>No vehicle on file.</div>;

  return (
    <div>
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: COLORS.borderLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Car size={22} color={COLORS.primary} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: COLORS.textPrimary }}>
              {veh.year} {veh.make} {veh.model} {veh.trim}
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              {veh.mileage.toLocaleString()} miles · Last visit{" "}
              {new Date(veh.lastService).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>
        <div
          style={{
            marginTop: 14,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
          }}
        >
          {[
            ["VIN", veh.vin],
            ["Engine", veh.engine],
            ["Transmission", veh.transmission],
            ["License", veh.licensePlate],
          ].map(([label, val]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {label}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textPrimary, marginTop: 1 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 8,
          padding: "10px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <Zap size={15} color={COLORS.warning} style={{ marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 12, color: "#92400E" }}>AI Service Insight</div>
          <div style={{ fontSize: 12, color: "#78350F", marginTop: 2 }}>
            Due for oil change + tire rotation ({veh.mileage.toLocaleString()} mi). Next major service:{" "}
            {veh.nextServiceType} at {veh.nextServiceMiles.toLocaleString()} mi.
          </div>
        </div>
      </div>

      <button
        style={{
          fontSize: 13,
          color: COLORS.textSecondary,
          background: "none",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          padding: "8px 14px",
          cursor: "pointer",
        }}
      >
        Edit Vehicle Details
      </button>
    </div>
  );
}

function WizardStep3() {
  const [complaint, setComplaint] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    if (complaint.length < 8) {
      setAnalysis(null);
      return;
    }
    setAnalyzing(true);
    const timer = setTimeout(() => {
      setAnalysis({
        code: "P0420",
        cause: "Catalyst System Efficiency Below Threshold (Bank 1)",
        labor: "1.5 hr labor",
        parts: "$380–$680 parts",
        tsb: "TSB-2021-0144",
      });
      setAnalyzing(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [complaint]);

  return (
    <div>
      <div style={{ position: "relative", marginBottom: 14 }}>
        <textarea
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
          placeholder="Describe customer complaint in their own words..."
          rows={4}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 8,
            border: `1px solid ${COLORS.border}`,
            fontSize: 14,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            fontFamily: "inherit",
          }}
        />
        <Mic
          size={16}
          color={COLORS.textMuted}
          style={{ position: "absolute", right: 12, bottom: 12 }}
        />
      </div>

      {analyzing && (
        <div style={{ fontSize: 13, color: COLORS.textSecondary, padding: "10px 0" }}>
          AI analyzing complaint...
        </div>
      )}

      {analysis && !analyzing && (
        <div
          style={{
            background: "#F0F9FF",
            border: "1px solid #BAE6FD",
            borderRadius: 10,
            padding: "14px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Zap size={14} color="#0284C7" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0284C7" }}>AI Translation</span>
            <Badge label={analysis.code} color="#0284C7" bg="#E0F2FE" />
          </div>
          <div style={{ fontSize: 13, color: "#0C4A6E", fontWeight: 600, marginBottom: 4 }}>
            {analysis.cause}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "#0369A1" }}>
              <Clock size={11} style={{ marginRight: 4 }} />{analysis.labor}
            </span>
            <span style={{ fontSize: 12, color: "#0369A1" }}>
              <FileText size={11} style={{ marginRight: 4 }} />{analysis.parts}
            </span>
            <Badge label={`TSB: ${analysis.tsb}`} color="#7C3AED" bg="#F5F3FF" />
          </div>
        </div>
      )}
    </div>
  );
}

function WizardStep4({ lines, setLines }) {
  const total = lines.reduce((sum, l) => sum + (l.accepted ? l.custPrice : 0), 0);
  const avgMargin = Math.round(
    lines.filter((l) => l.accepted).reduce((sum, l) => sum + l.margin, 0) /
      lines.filter((l) => l.accepted).length
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Zap size={14} color={COLORS.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>
          AI-assembled estimate · 3 vendors queried
        </span>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {["Worldpac", "O'Reilly", "PartsTech"].map((v) => (
            <span
              key={v}
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: COLORS.borderLight,
                color: COLORS.textSecondary,
                padding: "3px 7px",
                borderRadius: 4,
              }}
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 8,
          overflow: "hidden",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 90px 80px 60px 90px 100px",
            background: COLORS.borderLight,
            padding: "8px 14px",
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textMuted,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          <span>Description</span>
          <span style={{ textAlign: "right" }}>Price</span>
          <span style={{ textAlign: "right" }}>Cost</span>
          <span style={{ textAlign: "right" }}>Margin</span>
          <span style={{ textAlign: "center" }}>Vendor</span>
          <span style={{ textAlign: "center" }}>Action</span>
        </div>

        {lines.map((line, i) => (
          <div
            key={line.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 90px 80px 60px 90px 100px",
              padding: "10px 14px",
              borderTop: `1px solid ${COLORS.borderLight}`,
              alignItems: "center",
              background: line.accepted ? "#FAFFF9" : "#FAFAFA",
            }}
          >
            <span style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 600 }}>
              {line.description}
            </span>
            <span style={{ fontSize: 13, color: COLORS.textPrimary, textAlign: "right" }}>
              ${line.custPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: 13, color: COLORS.textSecondary, textAlign: "right" }}>
              {line.cost === 0 ? "—" : `$${line.cost}`}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: line.margin > 50 ? COLORS.success : COLORS.warning,
                textAlign: "right",
              }}
            >
              {line.margin}%
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textSecondary,
                textAlign: "center",
                background: COLORS.borderLight,
                borderRadius: 4,
                padding: "2px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {line.vendor}
            </span>
            <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
              <button
                onClick={() =>
                  setLines(lines.map((l) => (l.id === line.id ? { ...l, accepted: true } : l)))
                }
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: line.accepted ? "#fff" : COLORS.success,
                  background: line.accepted ? COLORS.success : "transparent",
                  border: `1px solid ${COLORS.success}`,
                  borderRadius: 5,
                  padding: "3px 9px",
                  cursor: "pointer",
                }}
              >
                Accept
              </button>
              <button
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Override
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: 24,
          padding: "12px 14px",
          background: COLORS.primary,
          borderRadius: 8,
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
          Avg margin: <strong style={{ color: "#fff" }}>{avgMargin}%</strong>
        </span>
        <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
          Total: ${total.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

function WizardStep5({ selectedCust, lines, onClose }) {
  const [smsState, setSmsState] = useState("idle"); // idle | sending | sent
  const [emailState, setEmailState] = useState("idle");
  const [roOpened, setRoOpened] = useState(false);
  const total = lines.reduce((sum, l) => sum + (l.accepted ? l.custPrice : 0), 0);
  const veh = selectedCust ? getVehicleForCustomer(selectedCust.id) : null;

  function handleSend(channel) {
    if (channel === "sms") {
      setSmsState("sending");
      setTimeout(() => { setSmsState("sent"); setRoOpened(true); }, 1400);
    } else {
      setEmailState("sending");
      setTimeout(() => { setEmailState("sent"); setRoOpened(true); }, 1400);
    }
  }

  const btnLabel = (state, base) =>
    state === "sending" ? "Sending..." : state === "sent" ? `${base} Sent` : base;

  return (
    <div>
      <div
        style={{
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 800, fontSize: 15, color: COLORS.textPrimary, marginBottom: 8 }}>
          Estimate Summary
        </div>
        {selectedCust && (
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
            Customer: <strong>{selectedCust.firstName} {selectedCust.lastName}</strong>
            {" · "}{selectedCust.phone}
          </div>
        )}
        {veh && (
          <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 }}>
            Vehicle: <strong>{veh.year} {veh.make} {veh.model}</strong>
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.accent, marginTop: 8 }}>
          Total: ${total.toLocaleString()}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <button
          onClick={() => handleSend("sms")}
          disabled={smsState !== "idle"}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 10,
            border: "none",
            background: smsState === "sent" ? COLORS.success : COLORS.primary,
            color: "#fff",
            fontWeight: 700,
            fontSize: 14,
            cursor: smsState === "idle" ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {smsState === "sent" ? <CheckCircle size={16} /> : <MessageSquare size={16} />}
          {btnLabel(smsState, "Send SMS")}
        </button>
        <button
          onClick={() => handleSend("email")}
          disabled={emailState !== "idle"}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: 10,
            border: `2px solid ${COLORS.primary}`,
            background: emailState === "sent" ? COLORS.success : "transparent",
            color: emailState === "sent" ? "#fff" : COLORS.primary,
            fontWeight: 700,
            fontSize: 14,
            cursor: emailState === "idle" ? "pointer" : "default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {emailState === "sent" ? <CheckCircle size={16} /> : <Mail size={16} />}
          {btnLabel(emailState, "Send Email")}
        </button>
      </div>

      {roOpened && (
        <div
          style={{
            background: "#F0FDF4",
            border: "1px solid #BBF7D0",
            borderRadius: 10,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckCircle size={20} color={COLORS.success} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#15803D" }}>
              RO Opened · Appearing on Tech Board
            </div>
            <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
              RO-2024-{1193 + Math.floor(Math.random() * 3)} created. Customer notified.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Wizard Modal ──────────────────────────────────────────────────────────

function WizardModal({ onClose, preloadCustId }) {
  const [step, setStep] = useState(1);
  const [selectedCust, setSelectedCust] = useState(
    preloadCustId ? customers.find((c) => c.id === preloadCustId) || null : null
  );
  const [estimateLines, setEstimateLines] = useState(SAMPLE_ESTIMATE_LINES);

  const canNext = () => {
    if (step === 1) return selectedCust !== null;
    return true;
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: COLORS.bgCard,
          borderRadius: 16,
          width: 720,
          maxWidth: "calc(100vw - 40px)",
          maxHeight: "calc(100vh - 60px)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px 16px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Step dots */}
          <div style={{ display: "flex", gap: 6 }}>
            {WIZARD_STEPS.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i + 1 < step ? 8 : i + 1 === step ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  background:
                    i + 1 < step
                      ? COLORS.success
                      : i + 1 === step
                      ? COLORS.primary
                      : COLORS.border,
                  transition: "width 0.2s ease",
                }}
              />
            ))}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>
              Step {step} of {WIZARD_STEPS.length}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>
              {step === 1 && "Customer Lookup"}
              {step === 2 && "Confirm Vehicle"}
              {step === 3 && "Complaint Entry"}
              {step === 4 && "Intelligent Estimate"}
              {step === 5 && "Send Approval & Open RO"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: COLORS.borderLight,
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <X size={16} color={COLORS.textSecondary} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", overflowY: "auto", flex: 1, minHeight: 360 }}>
          {step === 1 && (
            <WizardStep1
              selectedCust={selectedCust}
              setSelectedCust={setSelectedCust}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && <WizardStep2 selectedCust={selectedCust} />}
          {step === 3 && <WizardStep3 />}
          {step === 4 && (
            <WizardStep4 lines={estimateLines} setLines={setEstimateLines} />
          )}
          {step === 5 && (
            <WizardStep5
              selectedCust={selectedCust}
              lines={estimateLines}
              onClose={onClose}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <button
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              color: COLORS.textSecondary,
              background: "none",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={14} />
            {step === 1 ? "Cancel" : "Back"}
          </button>

          {step < 5 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canNext()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: canNext() ? COLORS.primary : COLORS.border,
                border: "none",
                borderRadius: 8,
                padding: "9px 18px",
                cursor: canNext() ? "pointer" : "default",
              }}
            >
              Next: {WIZARD_STEPS[step]}
              <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={onClose}
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#fff",
                background: COLORS.success,
                border: "none",
                borderRadius: 8,
                padding: "9px 20px",
                cursor: "pointer",
              }}
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────

const KANBAN_TO_COLUMN = {
  checked_in:   'queue',
  inspecting:   'diagnosing',
  estimate_sent: 'approval',
  approved:     'diagnosing',
  in_progress:  'diagnosing',
  ready:        'pickup',
};

export default function AdvisorHomeScreen({ onRoSelect }) {
  const [activeTab, setActiveTab] = useState("queue");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPreloadCustId, setWizardPreloadCustId] = useState(null);
  const [checkoutRoId, setCheckoutRoId] = useState(null);
  const [paidRos, setPaidRos] = useState({});
  const [liveROs, setLiveROs] = useState(null);
  const [selectedRoNum, setSelectedRoNum] = useState(null);

  useEffect(() => {
    fetchActiveRepairOrders().then(ros => {
      if (ros && ros.length > 0) setLiveROs(ros);
    });
  }, []);

  const activeQueue = liveROs
    ? liveROs
        .filter(ro => ro.status === 'checked_in')
        .map(ro => ({
          custId:    ro.customerId,
          waitMin:   ro.dateIn ? Math.max(1, Math.round((Date.now() - new Date(ro.dateIn)) / 60000)) : 5,
          concern:   ro.serviceType || ro.services?.[0]?.name || 'Service',
          _customer: ro._customer,
          _vehicle:  ro._vehicle,
        }))
    : QUEUE;

  const activeBoardROs = liveROs
    ? liveROs.map(ro => ({
        roNum:     ro.id,
        custId:    ro.customerId,
        job:       ro.serviceType || ro.services?.[0]?.name || 'Service',
        column:    KANBAN_TO_COLUMN[ro.status] || 'queue',
        minAgo:    ro.dateIn ? Math.max(0, Math.round((Date.now() - new Date(ro.dateIn)) / 60000)) : 0,
        _customer: ro._customer,
        _vehicle:  ro._vehicle,
        _liveRO:   ro,
      }))
    : BOARD_ROS;

  const nextUp = activeQueue[0];
  const nextUpCust = nextUp
    ? (customers.find((c) => c.id === nextUp.custId) || nextUp._customer)
    : null;
  const nextUpVeh = nextUp
    ? (getVehicleForCustomer(nextUp.custId) || nextUp._vehicle)
    : null;

  function openWizard(custId = null) {
    setWizardPreloadCustId(custId);
    setWizardOpen(true);
  }

  const TABS = [
    { id: "queue", label: "Queue" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: COLORS.bg }}>
      {/* Sub-nav */}
      <div
        style={{
          height: 48,
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 4,
          flexShrink: 0,
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              fontSize: 13,
              fontWeight: activeTab === tab.id ? 700 : 500,
              color: activeTab === tab.id ? COLORS.primary : COLORS.textSecondary,
              background: activeTab === tab.id ? COLORS.borderLight : "none",
              border: "none",
              borderRadius: 6,
              padding: "6px 14px",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? `2px solid ${COLORS.primary}` : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          onClick={() => openWizard()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: "#fff",
            background: COLORS.accent,
            border: "none",
            borderRadius: 8,
            padding: "7px 14px",
            cursor: "pointer",
          }}
        >
          <Plus size={15} />
          New RO
        </button>
      </div>

      <AIInsightsStrip label="Recommendations" insights={[
        { icon: "⏳", text: "David's estimate pending 2h 15m — send nudge to close", action: "Text David", value: "+$2,190", color: "#F59E0B" },
        { icon: "🔴", text: "Bay 3 idle 40 min — reassign Tom's Tucson to fill", action: "Reschedule", value: "Free bay", color: "#EF4444" },
        { icon: "💡", text: "Monica: 3 items pending — 100% lifetime approval rate", action: "Call Monica", value: "+$294", color: "#FF6B35" },
        { icon: "📊", text: "Today $5,842 — need $658 more to hit daily target", action: "View Board", value: "$658 gap", color: "#3B82F6" },
      ]} />

      {/* Two-column body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", gap: 0 }}>
        {/* Left: Queue */}
        <div
          style={{
            width: 350,
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            overflowY: "auto",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: 0,
          }}
        >
          {/* Next Up card */}
          {nextUp && nextUpCust && nextUpVeh ? (
          <div
            style={{
              background: COLORS.primary,
              borderRadius: 12,
              padding: "16px",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
              Next Up
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <Avatar
                first={nextUpCust.firstName}
                last={nextUpCust.lastName}
                size={44}
                color={COLORS.accent}
              />
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>
                  {nextUpCust.firstName} {nextUpCust.lastName}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  {nextUpVeh.year} {nextUpVeh.make} {nextUpVeh.model}
                </div>
              </div>
              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.accent }}>
                  {nextUp.waitMin}m
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>waiting</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>
              {nextUp.concern}
            </div>
            <button
              onClick={() => openWizard(nextUp.custId)}
              style={{
                width: "100%",
                padding: "11px",
                borderRadius: 8,
                border: "none",
                background: COLORS.accent,
                color: "#fff",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Wrench size={15} />
              Start Intake
            </button>
          </div>
          ) : (
          <div style={{ background: COLORS.primary, borderRadius: 12, padding: "16px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>Next Up</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>No customers waiting</div>
          </div>
          )}

          {/* Queue section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Waiting Queue · {activeQueue.length} customers
          </div>
          {activeQueue.map((item, i) => (
            <QueueCard
              key={item.custId}
              item={item}
              isFirst={i === 0}
              onStart={(id) => openWizard(id)}
            />
          ))}

          <KGIntakePanel />
        </div>

        {/* Right: Board */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
          {/* Stats row */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <StatCard label="ROs Today" value="8" sub="2 ahead of pace" />
            <StatCard label="Avg Open Time" value="18 min" sub="Target: 20 min" />
            <StatCard label="Approval Rate" value="87%" sub="+4% this week" />
            <StatCard label="Today's Revenue" value="$4,240" accent sub="est. at close: $6,800" />
          </div>

          {/* Kanban board */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {BOARD_COLUMNS.map((col) => {
              const colROs = activeBoardROs.filter((r) => r.column === col.id);
              return (
                <div key={col.id}>
                  {/* Column header */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 10,
                      padding: "8px 12px",
                      background: col.bgColor,
                      border: `1px solid ${col.borderColor}`,
                      borderRadius: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: col.color,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 700, fontSize: 12, color: col.color, flex: 1 }}>
                      {col.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        background: col.color,
                        color: "#fff",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {colROs.length}
                    </span>
                  </div>

                  {/* RO cards */}
                  {colROs.map((ro) => (
                    <ROCard key={ro.roNum} ro={ro} colId={col.id} onCheckout={setCheckoutRoId} paidRos={paidRos} onSelect={(roNum) => {
                          const next = roNum === selectedRoNum ? null : roNum;
                          setSelectedRoNum(next);
                          const boardRo = next ? activeBoardROs.find(r => r.roNum === next) : null;
                          if (onRoSelect) onRoSelect(boardRo || null);
                        }}
                        selected={selectedRoNum === ro.roNum} />
                  ))}

                  {colROs.length === 0 && (
                    <div
                      style={{
                        border: `1px dashed ${COLORS.border}`,
                        borderRadius: 8,
                        padding: "20px",
                        textAlign: "center",
                        fontSize: 12,
                        color: COLORS.textMuted,
                      }}
                    >
                      Empty
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Wizard modal */}
      {wizardOpen && (
        <WizardModal
          onClose={() => setWizardOpen(false)}
          preloadCustId={wizardPreloadCustId}
        />
      )}

      {/* Checkout modal */}
      {checkoutRoId && (() => {
        const boardRo = activeBoardROs.find(r => r.roNum === checkoutRoId);
        const fullRo = repairOrders.find(r => r.id === checkoutRoId);
        if (!boardRo) return null;
        const cust = customers.find(c => c.id === boardRo.custId) || boardRo._customer;
        const veh = getVehicleForCustomer(boardRo.custId) || boardRo._vehicle;
        // Build a minimal RO shape if the full RO isn't in demoData
        const ro = fullRo || {
          id: boardRo.roNum,
          services: [{ name: boardRo.job, laborCost: 195, partsCost: 0, status: "complete" }],
          totalLabor: 195,
          totalParts: 0,
          shopSupplies: 19.95,
        };
        return (
          <CheckoutModal
            ro={ro}
            customer={cust}
            vehicle={veh}
            onClose={() => setCheckoutRoId(null)}
            onPaid={(roId, amount, method) => {
              setPaidRos(prev => ({ ...prev, [roId]: { amount, method } }));
              setCheckoutRoId(null);
            }}
          />
        );
      })()}

    </div>
  );
}
