// IntelligentROScreen — Single-screen Intelligent RO
// Advisor selects customer + enters concern; everything else is agentic
import { useState, useEffect, useRef } from "react";
import {
  CheckCircle, Clock, Sparkles, X, Mic,
  MessageSquare, Mail, RotateCcw, Package,
  ChevronDown, Bot, Zap, Send,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { customers, vehicles } from "../data/demoData";

// ── Queue ─────────────────────────────────────────────────────
const QUEUE = [
  { custId: "cust-001", waitMin: 2,  concern: "Check engine light on, runs rough at idle" },
  { custId: "cust-002", waitMin: 14, concern: "90K service + brake inspection" },
  { custId: "cust-005", waitMin: 22, concern: "A/C blowing warm air" },
  { custId: "cust-007", waitMin: 31, concern: "Oil change + tire rotation" },
];

// ── Concern presets ───────────────────────────────────────────
const CONCERN_PRESETS = [
  { label: "Brake noise",        text: "Brakes squealing or grinding when stopping" },
  { label: "Check engine light", text: "Check engine light on, rough idle" },
  { label: "Oil change",         text: "Oil change and multi-point inspection" },
  { label: "A/C not cooling",    text: "A/C blowing warm air, not cooling properly" },
  { label: "Won't start",        text: "Vehicle won't start, possible dead battery" },
  { label: "Vibration",          text: "Vibration and shaking at highway speeds" },
  { label: "Tire rotation",      text: "Tire rotation and balance" },
  { label: "90K service",        text: "90,000 mile major service interval" },
  { label: "Transmission slip",  text: "Transmission slipping, rough shifts" },
  { label: "Coolant leak",       text: "Coolant leak, temperature running high" },
];

// ── Diagnosis engine ──────────────────────────────────────────
const DIAGNOSES = [
  {
    match: /brake|squeal|grind|pad|rotor|stopping/i,
    badge: "Brake System", badgeColor: "#DC2626", badgeBg: "#FEF2F2",
    code: "MECH-BRK", cause: "Worn brake pads / scored rotors — front axle likely",
    labor: "1.5 hrs", parts: "$180–$380", note: null,
    agentSteps: [
      "Pulling vehicle brake service history…",
      "Checking OEM pad/rotor specs for vehicle…",
      "Querying Worldpac, O'Reilly for best pad pricing…",
      "Calculating labor time from ALLDATA…",
      "Assembling estimate with 54% avg margin…",
    ],
    lines: [
      { id: 1, description: "Front Brake Pad Set (OEM-equiv)", custPrice: 180, cost: 82,  margin: 54, vendor: "Worldpac" },
      { id: 2, description: "Front Rotors (pair)",             custPrice: 220, cost: 98,  margin: 55, vendor: "O'Reilly" },
      { id: 3, description: "Labor — 1.5 hrs @ $195/hr",       custPrice: 293, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /check engine|p0420|catalytic|cat|rough idle|misfire/i,
    badge: "Powertrain", badgeColor: "#D97706", badgeBg: "#FFFBEB",
    code: "P0420", cause: "Catalyst System Efficiency Below Threshold (Bank 1)",
    labor: "1.5 hrs", parts: "$380–$680", note: "TSB-2021-0144",
    agentSteps: [
      "Running OBD-II fault code lookup for vehicle…",
      "Found TSB-2021-0144 — catalytic converter campaign…",
      "Querying Worldpac for OEM-equiv cat converter…",
      "Cross-referencing 3 vendor pricing and availability…",
      "Flagging 48% margin on parts — within target range…",
    ],
    lines: [
      { id: 1, description: "Diagnostic Fee",                   custPrice: 150, cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "Catalytic Converter (OEM-equiv)",  custPrice: 420, cost: 218, margin: 48,  vendor: "Worldpac" },
      { id: 3, description: "Labor — 1.5 hrs @ $195/hr",        custPrice: 293, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /oil|lube|oil change/i,
    badge: "Maintenance", badgeColor: "#16A34A", badgeBg: "#F0FDF4",
    code: "MAINT-OIL", cause: "Scheduled oil & filter change + multi-point inspection",
    labor: "0.5 hrs", parts: "$40–$75", note: null,
    agentSteps: [
      "Checking last oil change date and mileage…",
      "Confirming correct oil spec for vehicle engine…",
      "Querying O'Reilly for synthetic oil + filter pricing…",
      "Verifying multi-point inspection checklist…",
      "Estimate ready — 0.5 hr labor…",
    ],
    lines: [
      { id: 1, description: "Synthetic Oil (5 qts)",            custPrice: 55,  cost: 22,  margin: 60,  vendor: "In-house" },
      { id: 2, description: "OEM Oil Filter",                   custPrice: 18,  cost: 7,   margin: 61,  vendor: "O'Reilly" },
      { id: 3, description: "Labor — 0.5 hrs @ $195/hr",        custPrice: 98,  cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /a\/c|ac |air.?con|cool.*air|warm air/i,
    badge: "HVAC", badgeColor: "#0891B2", badgeBg: "#ECFEFF",
    code: "HVAC-134", cause: "Low refrigerant charge / possible compressor clutch wear",
    labor: "1.0–2.0 hrs", parts: "$120–$380", note: null,
    agentSteps: [
      "Pulling A/C system history for vehicle…",
      "Checking R-134a refrigerant spec and current price…",
      "Querying labor time for A/C recharge procedure…",
      "No open recalls on A/C system found…",
      "Estimate assembled — diagnostic + recharge…",
    ],
    lines: [
      { id: 1, description: "A/C Diagnostic + Leak Check",      custPrice: 120, cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "R-134a Refrigerant Recharge",       custPrice: 145, cost: 48,  margin: 67,  vendor: "In-house" },
      { id: 3, description: "Labor — 1.0 hr @ $195/hr",          custPrice: 195, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /won.t start|dead battery|no start|won't start/i,
    badge: "Electrical", badgeColor: "#7C3AED", badgeBg: "#F5F3FF",
    code: "ELEC-BAT", cause: "Battery failure or charging system fault",
    labor: "0.5 hrs", parts: "$120–$250", note: null,
    agentSteps: [
      "Checking battery install date from service history…",
      "Verifying Group 35 battery spec for vehicle…",
      "Querying O'Reilly for OEM-spec battery pricing…",
      "Flagging alternator check — standard with no-start…",
      "Estimate ready — load test + battery replacement…",
    ],
    lines: [
      { id: 1, description: "Battery Load Test + Diagnosis",     custPrice: 60,  cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "OEM-spec Battery (Group 35)",       custPrice: 195, cost: 88,  margin: 55,  vendor: "O'Reilly" },
      { id: 3, description: "Labor — 0.5 hrs @ $195/hr",         custPrice: 98,  cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /vibrat|shake|shimmy|highway/i,
    badge: "Chassis", badgeColor: "#0D9488", badgeBg: "#F0FDFA",
    code: "CHAS-WHL", cause: "Wheel imbalance or worn CV axle / tie rod",
    labor: "1.0–1.5 hrs", parts: "$80–$220", note: null,
    agentSteps: [
      "Checking wheel balance and alignment history…",
      "Flagging CV axle mileage — near service interval…",
      "Querying Worldpac for CV axle pricing…",
      "Calculating labor for balance + inspect…",
      "Estimate assembled — balance first, inspect axle…",
    ],
    lines: [
      { id: 1, description: "4-Wheel Balance",                   custPrice: 85,  cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "Front CV Axle (if needed)",         custPrice: 220, cost: 98,  margin: 55,  vendor: "Worldpac" },
      { id: 3, description: "Labor — 1.0 hr @ $195/hr",          custPrice: 195, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /tire|rotation|balance/i,
    badge: "Tires", badgeColor: "#475569", badgeBg: "#F8FAFC",
    code: "MAINT-TIRE", cause: "Tire rotation + balance, inspect tread depth & pressure",
    labor: "0.5 hrs", parts: "$0", note: null,
    agentSteps: [
      "Checking last tire rotation date from history…",
      "Verifying TPMS sensor status on vehicle…",
      "Confirming rotation pattern for drivetrain type…",
      "Adding tread depth inspection to checklist…",
      "Estimate ready — rotation + balance…",
    ],
    lines: [
      { id: 1, description: "Tire Rotation (4 wheels)",          custPrice: 40,  cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "4-Wheel Balance",                   custPrice: 80,  cost: 0,   margin: 100, vendor: "In-house" },
      { id: 3, description: "Labor — 0.5 hrs @ $195/hr",         custPrice: 98,  cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /90.?k|90.?000|major service/i,
    badge: "Major Service", badgeColor: "#2563EB", badgeBg: "#EFF6FF",
    code: "MAINT-90K", cause: "90K major service — spark plugs, fluids, belts, filters",
    labor: "3.5 hrs", parts: "$280–$480", note: null,
    agentSteps: [
      "Pulling 90K service checklist for vehicle model…",
      "Querying PartsTech for iridium spark plug pricing…",
      "Checking belt inspection interval — due at 90K…",
      "Adding brake fluid flush to service package…",
      "3.5 hr estimate assembled across 4 line items…",
    ],
    lines: [
      { id: 1, description: "Spark Plugs (iridium, set of 4)",   custPrice: 120, cost: 48,  margin: 60,  vendor: "PartsTech" },
      { id: 2, description: "Cabin + Engine Air Filters",        custPrice: 65,  cost: 22,  margin: 66,  vendor: "O'Reilly" },
      { id: 3, description: "Brake Fluid Flush",                 custPrice: 95,  cost: 18,  margin: 81,  vendor: "In-house" },
      { id: 4, description: "Labor — 3.5 hrs @ $195/hr",         custPrice: 683, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /transmission|trans|slip|shift/i,
    badge: "Drivetrain", badgeColor: "#B45309", badgeBg: "#FFFBEB",
    code: "DRV-TRANS", cause: "Transmission fluid degraded or solenoid fault",
    labor: "1.5–3.0 hrs", parts: "$120–$600", note: "P0700 likely present",
    agentSteps: [
      "Checking transmission fluid change history…",
      "Scanning for P0700-range codes on vehicle…",
      "Querying correct transmission fluid spec…",
      "Estimating labor — flush + solenoid inspect…",
      "Flagging P0700 note for technician board…",
    ],
    lines: [
      { id: 1, description: "Transmission Diagnostic Scan",      custPrice: 120, cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "Transmission Fluid Flush",          custPrice: 180, cost: 48,  margin: 73,  vendor: "In-house" },
      { id: 3, description: "Labor — 1.5 hrs @ $195/hr",         custPrice: 293, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
  {
    match: /coolant|overhe|temp|radiator|leak/i,
    badge: "Cooling System", badgeColor: "#0369A1", badgeBg: "#F0F9FF",
    code: "COOL-LEAK", cause: "Coolant leak — hose, water pump, or head gasket suspect",
    labor: "1.0–4.0 hrs", parts: "$80–$600", note: null,
    agentSteps: [
      "Checking coolant flush history for vehicle…",
      "Flagging water pump mileage — near interval…",
      "Querying pressure test labor time from ALLDATA…",
      "Estimating coolant flush + refill cost…",
      "Estimate ready — pressure test first, then flush…",
    ],
    lines: [
      { id: 1, description: "Cooling System Pressure Test",      custPrice: 95,  cost: 0,   margin: 100, vendor: "In-house" },
      { id: 2, description: "Coolant Flush + Refill",            custPrice: 120, cost: 32,  margin: 73,  vendor: "In-house" },
      { id: 3, description: "Labor — 1.0 hr @ $195/hr",          custPrice: 195, cost: 0,   margin: 100, vendor: "In-house" },
    ],
  },
];

function getDiagnosis(text) {
  if (!text || text.trim().length < 4) return null;
  return DIAGNOSES.find(d => d.match.test(text)) || null;
}

const VENDOR_COLORS = {
  "Worldpac":  { bg: "#EFF6FF", color: "#2563EB" },
  "O'Reilly":  { bg: "#FFF7ED", color: "#EA580C" },
  "PartsTech": { bg: "#F5F3FF", color: "#7C3AED" },
  "In-house":  { bg: "#F0FDF4", color: "#16A34A" },
};

function initials(first, last) { return `${first[0]}${last[0]}`.toUpperCase(); }
function getVehicle(custId)     { return vehicles.find(v => v.customerId === custId) || null; }

function Avatar({ first, last, size = 38 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: COLORS.primary, color: "#fff",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.33, flexShrink: 0,
    }}>
      {initials(first, last)}
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────
function Section({ num, title, badge, locked, children }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 14,
      border: `1px solid ${locked ? "#E5E7EB" : COLORS.border}`,
      overflow: "hidden",
      opacity: locked ? 0.45 : 1,
      transition: "opacity 0.3s",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 20px",
        borderBottom: locked ? "none" : `1px solid ${COLORS.borderLight}`,
        background: locked ? "#FAFAFA" : "#fff",
      }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: locked ? "#E5E7EB" : `${COLORS.accent}18`,
          border: locked ? "none" : `1.5px solid ${COLORS.accent}35`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 800,
          color: locked ? COLORS.textMuted : COLORS.accent,
          flexShrink: 0,
        }}>
          {num}
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: locked ? COLORS.textMuted : COLORS.textPrimary }}>
          {title}
        </span>
        {badge && (
          <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, borderRadius: 5, padding: "2px 8px", marginLeft: "auto" }}>
            {badge.label}
          </span>
        )}
      </div>
      {!locked && (
        <div style={{ padding: "16px 20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Agent Activity Feed ───────────────────────────────────────
function AgentFeed({ messages }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [messages.length]);

  return (
    <div style={{
      background: "#0D1117", borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.08)",
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,107,53,0.08)",
      }}>
        <Bot size={14} color={COLORS.accent} />
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.6 }}>
          WrenchIQ Agents
        </span>
        {messages.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginLeft: "auto" }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
            <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 600 }}>Active</span>
          </div>
        )}
      </div>
      <div ref={ref} style={{ padding: "12px 16px", minHeight: 80, maxHeight: 140, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.length === 0 ? (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>
            Agents standing by — select a customer to begin…
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 1, fontFamily: "monospace" }}>
                {m.ts}
              </span>
              <span style={{ fontSize: 12, color: i === messages.length - 1 ? "#E2E8F0" : "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                {m.icon && <span style={{ marginRight: 5 }}>{m.icon}</span>}
                {m.text}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Main screen ───────────────────────────────────────────────
export default function IntelligentROScreen({ initialCust = null, initialStep = 1 }) {
  const [selectedCust, setSelectedCust]   = useState(initialCust);
  const [complaint,    setComplaint]      = useState("");
  const [diagnosis,    setDiagnosis]      = useState(null);
  const [agentMsgs,    setAgentMsgs]      = useState([]);
  const [sentSMS,      setSentSMS]        = useState(false);
  const [sentEmail,    setSentEmail]      = useState(false);
  const [roOpened,     setRoOpened]       = useState(false);
  const [queueOpen,    setQueueOpen]      = useState(!initialCust);
  const diagTimerRef = useRef(null);

  const now = () => new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });

  // Push an agent message
  const pushMsg = (text, icon = null) => {
    setAgentMsgs(prev => [...prev, { ts: now(), text, icon }]);
  };

  // When customer is selected
  const handleSelectCust = (c) => {
    setSelectedCust(c);
    setQueueOpen(false);
    setComplaint("");
    setDiagnosis(null);
    setSentSMS(false);
    setSentEmail(false);
    setRoOpened(false);
    const veh = getVehicle(c.id);
    setAgentMsgs([
      { ts: now(), text: `Customer selected: ${c.firstName} ${c.lastName}`, icon: "👤" },
      { ts: now(), text: `Pulling service history — ${c.visits} visits, LTV $${c.ltv.toLocaleString()}`, icon: "📋" },
      { ts: now(), text: veh ? `Vehicle confirmed: ${veh.year} ${veh.make} ${veh.model} · ${veh.mileage.toLocaleString()} mi` : "No vehicle on file", icon: "🚗" },
    ]);
  };

  // When complaint changes — run diagnosis with delay + stream agent steps
  useEffect(() => {
    if (diagTimerRef.current) clearTimeout(diagTimerRef.current);
    if (!complaint || complaint.trim().length < 4) {
      setDiagnosis(null);
      return;
    }
    const matched = getDiagnosis(complaint);
    if (!matched) { setDiagnosis(null); return; }

    // Stream agent steps one by one
    let delay = 300;
    matched.agentSteps.forEach((step, i) => {
      diagTimerRef.current = setTimeout(() => {
        pushMsg(step, i === matched.agentSteps.length - 1 ? "✅" : "⚙️");
        if (i === matched.agentSteps.length - 1) setDiagnosis(matched);
      }, delay);
      delay += 380;
    });

    return () => clearTimeout(diagTimerRef.current);
  }, [complaint]);

  const handleSend = (type) => {
    if (type === "sms") {
      setSentSMS(true);
      pushMsg(`SMS approval link sent to ${selectedCust?.firstName} ${selectedCust?.lastName} · ${getVehicle(selectedCust?.id)?.licensePlate}`, "📱");
    } else {
      setSentEmail(true);
      pushMsg(`Approval email sent to ${selectedCust?.email || "customer"}`, "📧");
    }
    setTimeout(() => {
      setRoOpened(true);
      pushMsg("RO opened on technician board — awaiting customer approval", "✅");
    }, 700);
  };

  const reset = () => {
    setSelectedCust(null);
    setComplaint("");
    setDiagnosis(null);
    setAgentMsgs([]);
    setSentSMS(false);
    setSentEmail(false);
    setRoOpened(false);
    setQueueOpen(true);
  };

  const lines   = diagnosis?.lines || [];
  const total   = lines.reduce((s, l) => s + l.custPrice, 0);
  const avgMargin = lines.length ? Math.round(lines.reduce((s, l) => s + l.margin, 0) / lines.length) : 0;
  const veh     = getVehicle(selectedCust?.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#F3F4F6" }}>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "24px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ maxWidth: 700, width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Section 1: Select Customer ── */}
          <Section num="1" title="Select Customer from Queue" badge={selectedCust ? { label: "Customer Selected ✓", color: "#16A34A", bg: "#F0FDF4" } : null}>
            {/* Selected customer compact strip */}
            {selectedCust && !queueOpen && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar first={selectedCust.firstName} last={selectedCust.lastName} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>{selectedCust.firstName} {selectedCust.lastName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                    {veh ? `${veh.year} ${veh.make} ${veh.model} · ${veh.licensePlate} · ${veh.mileage.toLocaleString()} mi` : "No vehicle"}
                  </div>
                </div>
                <button
                  onClick={() => setQueueOpen(true)}
                  style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, background: `${COLORS.accent}10`, border: `1px solid ${COLORS.accent}30`, borderRadius: 8, padding: "5px 12px", cursor: "pointer" }}
                >
                  Change
                </button>
              </div>
            )}

            {/* Full queue */}
            {queueOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>
                  {QUEUE.length} customers waiting
                </div>
                {QUEUE.map((q) => {
                  const c   = customers.find(x => x.id === q.custId);
                  if (!c) return null;
                  const v   = getVehicle(c.id);
                  const sel = selectedCust?.id === c.id;
                  return (
                    <div
                      key={q.custId}
                      onClick={() => handleSelectCust(c)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 14px", borderRadius: 10, cursor: "pointer",
                        border: sel ? `2px solid ${COLORS.accent}` : `1.5px solid ${COLORS.border}`,
                        background: sel ? `${COLORS.accent}06` : "#FAFAFA",
                        transition: "all 0.12s",
                      }}
                    >
                      <Avatar first={c.firstName} last={c.lastName} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{c.firstName} {c.lastName}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>
                          {v ? `${v.year} ${v.make} ${v.model} · ${v.licensePlate}` : "No vehicle"}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: "italic", marginTop: 1 }}>"{q.concern}"</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700, color: q.waitMin > 20 ? "#DC2626" : "#16A34A", flexShrink: 0 }}>
                        <Clock size={11} />
                        {q.waitMin}m
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          {/* ── Section 2: Concern ── */}
          <Section num="2" title="Customer Concern" locked={!selectedCust}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10 }}>
              Common concerns
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14 }}>
              {CONCERN_PRESETS.map(p => {
                const active = complaint === p.text;
                return (
                  <button
                    key={p.label}
                    onClick={() => setComplaint(active ? "" : p.text)}
                    style={{
                      padding: "6px 13px", borderRadius: 20, cursor: "pointer",
                      fontSize: 12, fontWeight: 600,
                      border: active ? `1.5px solid ${COLORS.accent}` : `1.5px solid ${COLORS.border}`,
                      background: active ? `${COLORS.accent}12` : "#F9FAFB",
                      color: active ? COLORS.accent : COLORS.textSecondary,
                      display: "flex", alignItems: "center", gap: 5,
                      transition: "all 0.12s",
                    }}
                  >
                    {p.label}
                    {active && <X size={10} />}
                  </button>
                );
              })}
            </div>
            <div style={{ position: "relative" }}>
              <textarea
                value={complaint}
                onChange={e => setComplaint(e.target.value)}
                placeholder="e.g. no start, runs rough, hot air, brake noise, check engine light…"
                rows={3}
                style={{
                  width: "100%", padding: "11px 40px 11px 14px",
                  borderRadius: 10, border: `1.5px solid ${diagnosis ? COLORS.accent : COLORS.border}`,
                  fontSize: 13, outline: "none", resize: "none",
                  boxSizing: "border-box", fontFamily: "inherit",
                  transition: "border-color 0.2s",
                }}
              />
              <Mic size={15} color={COLORS.textMuted} style={{ position: "absolute", right: 12, top: 13, cursor: "pointer" }} />
            </div>
          </Section>

          {/* ── Section 3: AI Diagnosis + Estimate ── */}
          <Section
            num="3"
            title="Diagnosis & Estimate"
            locked={!diagnosis}
            badge={diagnosis ? { label: diagnosis.badge, color: diagnosis.badgeColor, bg: diagnosis.badgeBg } : null}
          >
            {diagnosis && (
              <>
                {/* Diagnosis cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                  {[
                    ["Code / Ref",     diagnosis.code],
                    ["Likely Cause",   diagnosis.cause],
                    ["Labor",          diagnosis.labor],
                    ["Parts Range",    diagnosis.parts],
                  ].map(([label, val]) => (
                    <div key={label} style={{ background: "#F9FAFB", borderRadius: 8, padding: "10px 12px", border: `1px solid ${COLORS.borderLight}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginTop: 3, lineHeight: 1.4 }}>{val}</div>
                    </div>
                  ))}
                </div>
                {diagnosis.note && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
                    <span style={{ fontSize: 10, background: "#FEF9C3", color: "#A16207", border: "1px solid #FDE68A", borderRadius: 5, padding: "2px 8px", fontWeight: 700 }}>{diagnosis.note}</span>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>applicable reference found</span>
                  </div>
                )}

                {/* Estimate table */}
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <Package size={12} color={COLORS.accent} />
                  AI Estimate — {[...new Set(lines.map(l => l.vendor))].filter(v => v !== "In-house").join(", ")} queried
                </div>
                <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 55px 85px", background: COLORS.primary, padding: "7px 14px" }}>
                    {["Description", "Customer", "Cost", "Margin", "Vendor"].map(h => (
                      <div key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
                    ))}
                  </div>
                  {lines.map((line, idx) => {
                    const vc = VENDOR_COLORS[line.vendor] || VENDOR_COLORS["In-house"];
                    return (
                      <div key={line.id} style={{
                        display: "grid", gridTemplateColumns: "1fr 80px 70px 55px 85px",
                        padding: "10px 14px", alignItems: "center", background: "#fff",
                        borderBottom: idx < lines.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                      }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary }}>{line.description}</div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>${line.custPrice}</div>
                        <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{line.cost > 0 ? `$${line.cost}` : "—"}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: line.margin >= 60 ? COLORS.success : COLORS.warning }}>{line.margin}%</div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: vc.color, background: vc.bg, borderRadius: 5, padding: "2px 6px", justifySelf: "start" }}>{line.vendor}</span>
                      </div>
                    );
                  })}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 70px 55px 85px", padding: "10px 14px", background: COLORS.primary }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>Total</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>${total}</div>
                    <div />
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#FF8F66" }}>{avgMargin}%</div>
                    <div />
                  </div>
                </div>
              </>
            )}
          </Section>

          {/* ── Section 4: Send for Approval ── */}
          <Section num="4" title="Send for Approval" locked={!diagnosis}>
            {diagnosis && (
              <>
                {!roOpened ? (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      onClick={() => handleSend("sms")}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "13px", borderRadius: 10,
                        background: sentSMS ? COLORS.success : COLORS.primary,
                        color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700,
                      }}
                    >
                      <MessageSquare size={15} />
                      {sentSMS ? "SMS Sent ✓" : `SMS to ${selectedCust?.firstName}`}
                    </button>
                    <button
                      onClick={() => handleSend("email")}
                      style={{
                        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        padding: "13px", borderRadius: 10,
                        background: sentEmail ? COLORS.success : "#fff",
                        color: sentEmail ? "#fff" : COLORS.primary,
                        border: `1.5px solid ${sentEmail ? COLORS.success : COLORS.border}`,
                        cursor: "pointer", fontSize: 13, fontWeight: 700,
                      }}
                    >
                      <Mail size={15} />
                      {sentEmail ? "Email Sent ✓" : "Send Email"}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#F0FDF4", border: "2px solid #22C55E", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CheckCircle size={20} color="#22C55E" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#15803D" }}>RO Opened on Tech Board</div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>Approval link sent · Awaiting customer confirmation</div>
                    </div>
                    <button
                      onClick={reset}
                      style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                    >
                      <RotateCcw size={13} />
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </Section>

          {/* ── Agent Activity Feed ── */}
          <AgentFeed messages={agentMsgs} />

        </div>
      </div>
    </div>
  );
}
