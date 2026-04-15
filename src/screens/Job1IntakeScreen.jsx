import { useState, useEffect } from "react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import {
  Search,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Copy,
  RotateCcw,
  ChevronRight,
  Cpu,
  Target,
  Sparkles,
} from "lucide-react";
import { fetchStoryRO } from "../services/repairOrderService";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Map shopId → story RO id for Job 1
const JOB1_RO_MAP = {
  cornerstone: "RO-2026-0401",  // Elena Vasquez / Highlander P0420
  ridgeline:   "RO-2026-0501",  // Dan Whitfield / RAM 1500 P0301 (also Job 3 for Ridgeline)
};

// ─── Static fallback data ────────────────────────────────────────────────────

const CUSTOMER_FALLBACK = {
  name: "Robert Taylor",
  vehicle: "2021 Toyota Camry LE",
  mileage: "58,420 mi",
  phone: "(650) 555-0142",
};

const CONCERN_FALLBACK = "Engine light on, unusual noise at highway speed";

const AFTER_DATA = {
  findings:
    "DTC P0420 confirmed — catalyst efficiency below threshold. TSB-2021-0144 match: upstream O2 sensor degradation at 58K mi typical for 2.5L Camry. Physical inspection: O2 sensor reading lean bias. Catalytic converter integrity intact.",
  repair:
    "Replace upstream oxygen sensor (P/N: 89467-06170). Clear DTC P0420. Road test to verify catalyst monitor completion.",
  total: "$412.00 (Labor: $195 × 1.2hr + Parts: $177)",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: COLORS.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          minWidth: 72,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}

function FormField({ label, value, filled, placeholder, multiline }) {
  const emptyStyle = {
    border: `1.5px dashed ${COLORS.border}`,
    background: "#FAFAF8",
    color: COLORS.textMuted,
  };
  const filledStyle = {
    border: `1.5px solid #22C55E`,
    background: "#F0FDF4",
    color: COLORS.textPrimary,
  };
  const neutralStyle = {
    border: `1.5px solid ${COLORS.border}`,
    background: "#FAFAF8",
    color: COLORS.textPrimary,
  };

  const style =
    value && filled ? filledStyle : value ? neutralStyle : emptyStyle;

  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: COLORS.textSecondary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          ...style,
          borderRadius: 6,
          padding: "10px 12px",
          fontSize: 13,
          lineHeight: "1.55",
          minHeight: multiline ? 72 : 38,
          display: "flex",
          alignItems: multiline ? "flex-start" : "center",
          position: "relative",
        }}
      >
        {value ? (
          <>
            {filled && (
              <CheckCircle
                size={13}
                color="#22C55E"
                style={{ marginRight: 6, marginTop: 1, flexShrink: 0 }}
              />
            )}
            <span>{value}</span>
          </>
        ) : (
          <span style={{ color: COLORS.textMuted, fontStyle: "italic" }}>
            {placeholder}
          </span>
        )}
      </div>
    </div>
  );
}

function IntelRow({ icon: Icon, iconColor, label, value, sub }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 6,
          background: "rgba(255,255,255,0.07)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={14} color={iconColor || "#94A3B8"} />
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: 13, color: "#F1F5F9", fontWeight: 500, lineHeight: 1.4 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function Job1IntakeScreen() {
  const { smsName, activeShopId } = useDemo();
  const [showResult, setShowResult] = useState(false);
  const [copyLabel, setCopyLabel] = useState(null);
  const [roData, setRoData] = useState(null);
  const [storyRO, setStoryRO] = useState(null);

  // Legacy fallback
  useEffect(() => {
    fetch(`${API_BASE}/api/demo/ros`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.job1) setRoData(d.job1); })
      .catch(() => {});
  }, []);

  // Load story RO (primary — Agentic Moment 1)
  useEffect(() => {
    const roId = JOB1_RO_MAP[activeShopId] || JOB1_RO_MAP.cornerstone;
    fetchStoryRO(roId).then(ro => { if (ro) setStoryRO(ro); }).catch(() => {});
  }, [activeShopId]);

  const ro = roData;
  const s  = storyRO;

  const customerName = s?._customer ? `${s._customer.firstName} ${s._customer.lastName}` : ro?.customer?.name || CUSTOMER_FALLBACK.name;
  const vehicleStr   = s?._vehicle  ? `${s._vehicle.year} ${s._vehicle.make} ${s._vehicle.model}` : ro ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : CUSTOMER_FALLBACK.vehicle;
  const mileageStr   = s?._vehicle  ? `${Number(s._vehicle.mileage).toLocaleString()} mi` : ro ? `${Number(ro.vehicle.odometer).toLocaleString()} mi` : CUSTOMER_FALLBACK.mileage;
  const concern      = s?.customerConcern || ro?.concern || CONCERN_FALLBACK;
  const aiInsights   = s?.aiInsights || [];

  function handleCopy() {
    setShowResult(true);
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel(null), 1500);
  }

  function handleReset() {
    setShowResult(false);
    setCopyLabel(null);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        background: COLORS.bg,
        fontFamily: "'Inter', system-ui, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* ── LEFT: SMS panel (65%) ── */}
      <div
        style={{
          width: "65%",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        {/* SMS chrome header */}
        <div
          style={{
            background: "#F3F4F6",
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "0 20px",
            display: "flex",
            alignItems: "center",
            height: 44,
            gap: 8,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", gap: 5 }}>
            {["#EF4444", "#F59E0B", "#22C55E"].map((c) => (
              <div
                key={c}
                style={{ width: 10, height: 10, borderRadius: "50%", background: c }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              fontSize: 12,
              fontWeight: 600,
              color: COLORS.textSecondary,
              letterSpacing: "0.02em",
            }}
          >
            {smsName} — New Repair Order
          </div>
        </div>

        {/* Panel title bar */}
        <div
          style={{
            padding: "14px 24px 12px",
            borderBottom: `1px solid ${COLORS.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: COLORS.bgCard,
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
              Intake &amp; Diagnosis
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>
              Job 1 · New RO
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {showResult && (
              <button
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: 5,
                }}
              >
                <RotateCcw size={13} />
                Reset
              </button>
            )}
            <button
              onClick={() => setShowResult((v) => !v)}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: showResult ? COLORS.textSecondary : COLORS.primary,
                background: showResult ? "#F3F4F6" : "#EFF6FF",
                border: `1px solid ${showResult ? COLORS.border : "#BFDBFE"}`,
                borderRadius: 6,
                padding: "5px 12px",
                cursor: "pointer",
              }}
            >
              {showResult ? "Show Before" : "Show Result"}
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            background: COLORS.bgCard,
          }}
        >
          {/* Customer info card */}
          <div
            style={{
              background: "#F8FAFC",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "14px 16px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 10,
              }}
            >
              Customer &amp; Vehicle
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 24px" }}>
              <InfoRow label="Customer" value={customerName} />
              <InfoRow label="Vehicle" value={vehicleStr} />
              <InfoRow label="Mileage" value={mileageStr} />
              {ro?.customer?.phone && <InfoRow label="Phone" value={ro.customer.phone} />}
            </div>
          </div>

          {/* Form fields */}
          <FormField
            label="Customer Concern"
            value={concern}
            filled={false}
          />
          <FormField
            label="Diagnostic Findings"
            value={showResult ? AFTER_DATA.findings : ""}
            filled={showResult}
            placeholder="Enter diagnostic findings..."
            multiline
          />
          <FormField
            label="Recommended Repair"
            value={showResult ? AFTER_DATA.repair : ""}
            filled={showResult}
            placeholder="Enter recommended repair..."
            multiline
          />
          <FormField
            label="Estimated Total"
            value={showResult ? AFTER_DATA.total : ""}
            filled={showResult}
            placeholder="Enter estimate..."
          />

          {/* Result banner */}
          {showResult && (
            <div
              style={{
                background: "#F0FDF4",
                border: "1.5px solid #22C55E",
                borderRadius: 8,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginTop: 4,
              }}
            >
              <CheckCircle size={18} color="#22C55E" style={{ flexShrink: 0 }} />
              <div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: "#15803D" }}
                >
                  Predii Intelligence Applied
                </div>
                <div style={{ fontSize: 12, color: "#166534", marginTop: 2 }}>
                  Saved $820 vs. incorrect catalytic converter replacement
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: WrenchIQ Agent panel (35%) ── */}
      <div
        style={{
          width: "35%",
          display: "flex",
          flexDirection: "column",
          background: COLORS.bgDark,
          overflow: "hidden",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "16px 20px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <div
              style={{
                width: 24,
                height: 24,
                background: COLORS.accent,
                borderRadius: 5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cpu size={13} color="#FFFFFF" />
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
              }}
            >
              WrenchIQ
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", paddingLeft: 32 }}>
            Job 1: Intake &amp; Diagnosis
          </div>
        </div>

        {/* Scrollable agent content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {/* Main intelligence card */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 10,
              borderLeft: "3px solid #22C55E",
              padding: "14px 14px 6px",
              marginBottom: 14,
            }}
          >
            {/* Job badge + title */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#60A5FA",
                  background: "rgba(96,165,250,0.12)",
                  borderRadius: 4,
                  padding: "2px 7px",
                  letterSpacing: "0.06em",
                }}
              >
                JOB 1
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#F1F5F9" }}>
                Diagnosis Intelligence
              </span>
            </div>

            {/* Vehicle context */}
            <div
              style={{
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                marginBottom: 12,
                paddingLeft: 2,
              }}
            >
              {vehicleStr} · {mileageStr} · {s?.dtcs?.join(", ") || "P0420"} detected
            </div>

            {/* Intel rows */}
            <IntelRow
              icon={Search}
              iconColor="#60A5FA"
              label="Probable DTC"
              value="P0420 — Catalyst Efficiency Below Threshold"
            />
            <IntelRow
              icon={FileText}
              iconColor="#A78BFA"
              label="TSB Match"
              value="TSB-2021-0144"
              sub="O2 Sensor Degradation, 2.5L, 45K–70K mi"
            />
            <IntelRow
              icon={DollarSign}
              iconColor="#22C55E"
              label="O2 Sensor Repair Cost"
              value="$412 (Labor 1.2hr + Parts)"
            />
            <IntelRow
              icon={AlertTriangle}
              iconColor="#F59E0B"
              label="Alt. if wrong diagnosis"
              value="Catalytic converter = $1,232"
              sub="+$820 unnecessary spend"
            />
          </div>

          {/* Why this matters box */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "12px 13px",
              marginBottom: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 7,
              }}
            >
              Why this matters
            </div>
            <p
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Correct first-time diagnosis saves $820 and prevents a comeback.
              Predii matched this pattern in{" "}
              <strong style={{ color: "rgba(255,255,255,0.85)" }}>
                847 similar 2021 Camry ROs
              </strong>
              .
            </p>
          </div>

          {/* GWG target tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 18,
            }}
          >
            <Target size={12} color="#60A5FA" />
            <span style={{ fontSize: 11, color: "#60A5FA", fontWeight: 600 }}>
              GWG Job 1 Target: &gt;90% first-visit accuracy
            </span>
          </div>

          {/* Live AI insights from story RO (additional detail rows) */}
          {aiInsights.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                <Sparkles size={11} color="rgba(255,255,255,0.3)" />
                Additional Context
              </div>
              {aiInsights.slice(1).map((insight, i) => (
                <div key={i} style={{
                  fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: "1.5",
                  padding: "6px 0",
                  borderBottom: i < aiInsights.length - 2 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  {insight}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom action area */}
        <div
          style={{
            padding: "14px 18px 18px",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
          }}
        >
          <button
            onClick={handleCopy}
            style={{
              width: "100%",
              padding: "12px 0",
              background: copyLabel ? "#22C55E" : COLORS.accent,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 7,
              transition: "background 0.2s",
              letterSpacing: "0.01em",
            }}
          >
            {copyLabel ? (
              <>
                <CheckCircle size={15} />
                {copyLabel}
              </>
            ) : (
              <>
                <Copy size={15} />
                Copy to {smsName}
              </>
            )}
          </button>

          {showResult && !copyLabel && (
            <button
              onClick={handleReset}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "7px 0",
                background: "none",
                color: "rgba(255,255,255,0.35)",
                border: "none",
                fontSize: 11,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
              }}
            >
              <RotateCcw size={11} />
              Reset to before state
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
