import { useState, useEffect } from "react";
import {
  MessageSquare,
  Clipboard,
  CheckCircle,
  TrendingUp,
  Wrench,
  ChevronRight,
  RotateCcw,
  DollarSign,
  Wind,
  Droplets,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";

const API_BASE = import.meta.env.VITE_API_BASE || "";

function buildTalkTrack(name, vehicleStr, mileage) {
  const make  = vehicleStr.split(" ")[1] || "your vehicle";
  const miles = mileage ? Number(mileage).toLocaleString() : "45,000";
  return `"${name}, your ${make} is coming up on ${miles} miles — that's when ${make} recommends a transmission fluid exchange. We see 82% of ${make} owners at this mileage get this done. Your cabin filter hasn't been replaced recently either — we can knock both out while we've got it up on the lift. Want me to add those?"`;
}

export default function Job3UpsellScreen() {
  const { smsName, primaryCustomer } = useDemo();
  const [showResult, setShowResult] = useState(false);
  const [roData, setRoData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/demo/ros`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.job3) setRoData(d.job3); })
      .catch(() => {});
  }, []);

  const ro = roData;
  const vehicleStr = ro ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : "2022 Ford F-150 XLT";
  const mileage    = ro?.vehicle?.odometer || 44800;
  const mileageStr = `${Number(mileage).toLocaleString()} mi`;
  const roNumber   = ro?.roNumber || "2851";
  const baseServices = ro?.jobs?.slice(0, 2).map(j => [j.name, `$${j.totalCost?.toFixed(2) || "79.99"}`])
    || [["Full Synthetic Oil Change 5W-30", "$79.99"], ["Tire Rotation", "$29.99"]];
  const baseTotal  = ro?.jobs?.slice(0, 2).reduce((s, j) => s + (j.totalCost || 0), 0) || 109.98;
  const talkTrack  = buildTalkTrack(primaryCustomer, vehicleStr, mileage);
  const [addedFlash, setAddedFlash] = useState(false);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  function handleAddToRO() {
    setAddedFlash(true);
    setTimeout(() => {
      setAddedFlash(false);
      setShowResult(true);
    }, 1500);
  }

  function handleCopy(side) {
    if (side === "left") {
      setCopiedLeft(true);
      setTimeout(() => setCopiedLeft(false), 1500);
    } else {
      setCopiedRight(true);
      setTimeout(() => setCopiedRight(false), 1500);
    }
  }

  function handleReset() {
    setShowResult(false);
    setAddedFlash(false);
    setCopiedLeft(false);
    setCopiedRight(false);
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        fontFamily: "'Inter', system-ui, sans-serif",
        background: COLORS.bg,
      }}
    >
      {/* ── LEFT PANEL: SMS mock ── */}
      <div
        style={{
          flex: "0 0 65%",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${COLORS.border}`,
          background: "#F9FAFB",
          overflow: "auto",
        }}
      >
        {/* SMS Header bar */}
        <div
          style={{
            background: COLORS.primary,
            color: "#fff",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              background: COLORS.accent,
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            {smsName}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>
            RO #{roNumber} &nbsp;&middot;&nbsp; {primaryCustomer} &nbsp;&middot;&nbsp; {vehicleStr}
          </span>
          {showResult && (
            <button
              onClick={handleReset}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.35)",
                borderRadius: 6,
                color: "rgba(255,255,255,0.8)",
                fontSize: 12,
                padding: "3px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <RotateCcw size={12} /> Reset
            </button>
          )}
        </div>

        {/* Customer / vehicle row */}
        <div
          style={{
            background: "#fff",
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "12px 20px",
            display: "flex",
            gap: 32,
            flexShrink: 0,
          }}
        >
          {[
            ["Customer", primaryCustomer],
            ["Vehicle", vehicleStr],
            ["Mileage", mileageStr],
            ["Appointment", ro?.jobs?.[0]?.name || "Oil Change"],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 20 }}>
          {/* RO Line items table */}
          <div
            style={{
              background: "#fff",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {/* Table header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "10px 16px",
                background: "#F3F4F6",
                borderBottom: `1px solid ${COLORS.border}`,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Service
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Price
              </span>
            </div>

            {/* Base rows (always shown) */}
            {baseServices.map(([service, price]) => (
              <div
                key={service}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "11px 16px",
                  borderBottom: `1px solid ${COLORS.borderLight}`,
                }}
              >
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{service}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{price}</span>
              </div>
            ))}

            {/* AFTER rows */}
            {showResult && (
              <>
                {[
                  ["Cabin Air Filter Replacement", "$49.99"],
                  ["Transmission Fluid Exchange", "$189.99"],
                ].map(([service, price]) => (
                  <div
                    key={service}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "11px 16px",
                      borderBottom: `1px solid #D1FAE5`,
                      background: "#F0FDF4",
                    }}
                  >
                    <span style={{ fontSize: 13, color: "#15803D", display: "flex", alignItems: "center", gap: 6 }}>
                      <CheckCircle size={14} color="#22C55E" />
                      {service}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>{price}</span>
                  </div>
                ))}
              </>
            )}

            {/* Subtotal / Total row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 16px",
                background: showResult ? "#F0FDF4" : "#F9FAFB",
                borderTop: `2px solid ${showResult ? "#86EFAC" : COLORS.border}`,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: showResult ? "#15803D" : COLORS.textPrimary }}>
                {showResult ? "Total" : "Subtotal"}
              </span>
              <span style={{ fontSize: 15, fontWeight: 800, color: showResult ? "#15803D" : COLORS.textPrimary }}>
                {showResult ? `$${(baseTotal + 239.98).toFixed(2)}` : `$${baseTotal.toFixed(2)}`}
              </span>
            </div>
          </div>

          {/* Status line */}
          {showResult ? (
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                borderRadius: 8,
                padding: "10px 16px",
                fontSize: 13,
                fontWeight: 600,
                color: "#15803D",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={16} color="#22C55E" />
              +$239.99 added to RO &nbsp;&middot;&nbsp; ARO lift: +$240 &nbsp;&middot;&nbsp; GWG target: +$75 ✓
            </div>
          ) : (
            <div style={{ fontSize: 13, color: COLORS.textSecondary, paddingLeft: 2 }}>
              Ready to finalize?
            </div>
          )}

          {/* Talk track box */}
          <div
            style={{
              background: "#FFF7ED",
              border: `1px solid #FED7AA`,
              borderRadius: 10,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: COLORS.accent,
                    color: "#fff",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: 4,
                  }}
                >
                  Talk Track
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#92400E" }}>
                  Customer Talk Track
                </span>
              </div>
              <button
                onClick={() => handleCopy("left")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: copiedLeft ? "#FED7AA" : "transparent",
                  border: `1px solid #FED7AA`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#C2410C",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {copiedLeft ? (
                  <><CheckCircle size={11} /> Copied!</>
                ) : (
                  <><Clipboard size={11} /> Copy Talk Track</>
                )}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "#92400E" }}>
              {talkTrack}
            </p>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: WrenchIQ Agent ── */}
      <div
        style={{
          flex: "0 0 35%",
          background: COLORS.bgDark,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wrench size={16} color={COLORS.accent} />
            <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>
              WrenchIQ
            </span>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginLeft: 2 }}>
              · Job 3: Smart Upsell
            </span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Smart Upsell card */}
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderLeft: "3px solid #3B82F6",
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  background: "#3B82F6",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  padding: "2px 7px",
                  borderRadius: 4,
                }}
              >
                JOB 3
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
                Upsell Opportunities
              </span>
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>
              {vehicleStr} &nbsp;&middot;&nbsp; {mileageStr} &nbsp;&middot;&nbsp; Oil change visit
            </div>

            {/* Recommended services */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Cabin Air Filter */}
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "12px 13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Wind size={14} color={COLORS.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      Cabin Air Filter
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                    $49.99
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                  Never replaced (34K since last)
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#4ADE80",
                  }}
                >
                  <TrendingUp size={9} />
                  74% acceptance at oil change visits
                </div>
              </div>

              {/* Transmission Fluid */}
              <div
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "12px 13px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <Droplets size={14} color={COLORS.accent} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      Transmission Fluid Exchange
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
                    $189.99
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>
                  Ford recommends at 45K mi
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    background: "rgba(34,197,94,0.15)",
                    border: "1px solid rgba(34,197,94,0.3)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "#4ADE80",
                  }}
                >
                  <TrendingUp size={9} />
                  82% of F-150 owners at this mileage
                </div>
              </div>
            </div>
          </div>

          {/* Customer Talk Track */}
          <div
            style={{
              background: "rgba(59,130,246,0.1)",
              border: "1px solid rgba(59,130,246,0.25)",
              borderRadius: 10,
              padding: "14px 15px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={13} color="#93C5FD" />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Customer Talk Track
                </span>
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                What to say →
              </span>
            </div>
            <p
              style={{
                margin: "0 0 12px",
                fontSize: 12,
                lineHeight: 1.65,
                color: "rgba(255,255,255,0.75)",
              }}
            >
              {talkTrack}
            </p>
            <button
              onClick={() => handleCopy("right")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "transparent",
                border: "1px solid rgba(147,197,253,0.4)",
                borderRadius: 6,
                padding: "5px 12px",
                fontSize: 11,
                fontWeight: 600,
                color: "#93C5FD",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {copiedRight ? (
                <><CheckCircle size={11} /> Copied!</>
              ) : (
                <><Clipboard size={11} /> Copy Talk Track</>
              )}
            </button>
          </div>

          {/* Why this matters */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.09)",
              borderRadius: 10,
              padding: "13px 15px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <DollarSign size={13} color={COLORS.accent} />
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Why this matters
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "rgba(255,255,255,0.6)" }}>
              GWG target: +$75 ARO on oil change visits. This upsell delivers +$240. At 50 oil changes/month, lifting 25% acceptance = <strong style={{ color: "rgba(255,255,255,0.85)" }}>+$3,000/month incremental.</strong>
            </p>
          </div>

          {/* GWG tag */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,107,53,0.12)",
              border: "1px solid rgba(255,107,53,0.25)",
              borderRadius: 7,
              padding: "8px 12px",
            }}
          >
            <ChevronRight size={12} color={COLORS.accent} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#FCA98A" }}>
              GWG Job 3: Oil change ARO +$75 &nbsp;&middot;&nbsp; 30% acceptance target
            </span>
          </div>

          {/* Add to RO button */}
          <button
            onClick={handleAddToRO}
            disabled={showResult || addedFlash}
            style={{
              width: "100%",
              padding: "13px 0",
              background: showResult ? "#22C55E" : addedFlash ? "#22C55E" : COLORS.accent,
              border: "none",
              borderRadius: 9,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: showResult ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.3s",
              opacity: showResult ? 0.85 : 1,
            }}
          >
            {showResult ? (
              <><CheckCircle size={16} /> Added to RO</>
            ) : addedFlash ? (
              <><CheckCircle size={16} /> Added!</>
            ) : (
              <>Add to RO — +$239.99</>
            )}
          </button>

          {showResult && (
            <button
              onClick={handleReset}
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.35)",
                fontSize: 11,
                cursor: "pointer",
                textDecoration: "underline",
                padding: "0 0 4px",
                alignSelf: "center",
              }}
            >
              Reset demo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
