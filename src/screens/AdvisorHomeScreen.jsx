// AdvisorHomeScreen.jsx — AE-776 (Advisor Home) + AE-777 (5-Step RO Wizard)
import { useState, useEffect } from "react";
import {
  User, Car, Clock, ChevronRight, Plus, Search, Mic,
  CheckCircle, Send, MessageSquare, Mail, X, ChevronLeft,
  Wrench, BarChart2, FileText, AlertCircle, Zap
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { customers, vehicles } from "../data/demoData";

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
    custId: "cust-005",
    waitMin: 22,
    concern: "A/C blowing warm air",
  },
  {
    custId: "cust-007",
    waitMin: 31,
    concern: "Oil change + tire rotation",
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
  },
  {
    roNum: "RO-2024-1188",
    custId: "cust-006",
    job: "Oil change + tire rotation",
    column: "queue",
    minAgo: 9,
  },
  {
    roNum: "RO-2024-1189",
    custId: "cust-003",
    job: "Check engine — P0420 cat converter",
    column: "diagnosing",
    minAgo: 23,
  },
  {
    roNum: "RO-2024-1190",
    custId: "cust-008",
    job: "60K major service + alignment",
    column: "diagnosing",
    minAgo: 41,
  },
  {
    roNum: "RO-2024-1192",
    custId: "cust-002",
    job: "A/C recharge + cabin filter",
    column: "approval",
    minAgo: 58,
  },
  {
    roNum: "RO-2024-1183",
    custId: "cust-007",
    job: "Transmission fluid + spark plugs",
    column: "approval",
    minAgo: 74,
  },
  {
    roNum: "RO-2024-1179",
    custId: "cust-001",
    job: "Strut replacement + wheel alignment",
    column: "pickup",
    minAgo: 192,
  },
  {
    roNum: "RO-2024-1181",
    custId: "cust-005",
    job: "Brake pad + rotor replacement",
    column: "pickup",
    minAgo: 247,
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

function QueueCard({ item, isFirst, onStart }) {
  const cust = customers.find((c) => c.id === item.custId);
  const veh = getVehicleForCustomer(item.custId);
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

function ROCard({ ro }) {
  const cust = customers.find((c) => c.id === ro.custId);
  const veh = getVehicleForCustomer(ro.custId);
  if (!cust || !veh) return null;

  const hr = Math.floor(ro.minAgo / 60);
  const min = ro.minAgo % 60;
  const timeLabel = hr > 0 ? `${hr}h ${min}m` : `${min}m`;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        padding: "10px 12px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.3 }}>
          {ro.roNum}
        </span>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>{timeLabel}</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary, marginTop: 4 }}>
        {cust.firstName} {cust.lastName}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
        {veh.year} {veh.make} {veh.model}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 3 }}>{ro.job}</div>
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

export default function AdvisorHomeScreen() {
  const [activeTab, setActiveTab] = useState("queue");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardPreloadCustId, setWizardPreloadCustId] = useState(null);

  const nextUp = QUEUE[0];
  const nextUpCust = customers.find((c) => c.id === nextUp.custId);
  const nextUpVeh = getVehicleForCustomer(nextUp.custId);

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

          {/* Queue section */}
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
            Waiting Queue · {QUEUE.length} customers
          </div>
          {QUEUE.map((item, i) => (
            <QueueCard
              key={item.custId}
              item={item}
              isFirst={i === 0}
              onStart={(id) => openWizard(id)}
            />
          ))}
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
              const colROs = BOARD_ROS.filter((r) => r.column === col.id);
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
                    <ROCard key={ro.roNum} ro={ro} />
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
    </div>
  );
}
