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
  Send,
  Sparkles,
  Shield,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { fetchStoryRO, updateStoryRO } from "../services/repairOrderService";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Map shopId → story RO id for Job 3
const JOB3_RO_MAP = {
  cornerstone: "RO-2026-0402",  // Frank Delgado / CR-V upsell
  ridgeline:   "RO-2026-0501",  // Dan Whitfield / RAM 1500 upsell
};

function buildTalkTrack(name, vehicleStr, mileage) {
  const make  = vehicleStr.split(" ")[1] || "your vehicle";
  const miles = mileage ? Number(mileage).toLocaleString() : "45,000";
  return `"${name}, your ${make} is coming up on ${miles} miles — that's when ${make} recommends a transmission fluid exchange. We see 82% of ${make} owners at this mileage get this done. Your cabin filter hasn't been replaced recently either — we can knock both out while we've got it up on the lift. Want me to add those?"`;
}

export default function Job3UpsellScreen() {
  const { smsName, primaryCustomer, activeShopId } = useDemo();
  const [showResult, setShowResult] = useState(false);
  const [roData, setRoData] = useState(null);
  const [storyRO, setStoryRO] = useState(null);
  // G-1/G-2: staged text states
  const [textStatus, setTextStatus] = useState("staged");  // "staged" | "sending" | "sent"
  const [undoTimer, setUndoTimer] = useState(null);       // G-2: 5-sec undo countdown
  const [undoCount, setUndoCount] = useState(5);
  const [showUndo, setShowUndo] = useState(false);

  // Load legacy demo/ros data (fallback)
  useEffect(() => {
    fetch(`${API_BASE}/api/demo/ros`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.job3) setRoData(d.job3); })
      .catch(() => {});
  }, []);

  // Load story RO from MongoDB (primary — Agentic Moment 2)
  useEffect(() => {
    const roId = JOB3_RO_MAP[activeShopId] || JOB3_RO_MAP.cornerstone;
    fetchStoryRO(roId).then(ro => {
      if (ro) {
        setStoryRO(ro);
        setTextStatus(ro.agenticTextStatus || "staged");
      }
    }).catch(() => {});
  }, [activeShopId]);

  // Prefer story RO data when available
  const activeRO = storyRO || roData;
  const ro = roData;  // legacy compat

  const vehicleStr = storyRO
    ? `${storyRO._vehicle.year} ${storyRO._vehicle.make} ${storyRO._vehicle.model}`
    : ro ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : "2022 Ford F-150 XLT";
  const mileage    = storyRO?._vehicle?.mileage || ro?.vehicle?.odometer || 44800;
  const mileageStr = `${Number(mileage).toLocaleString()} mi`;
  const roNumber   = storyRO?.roNumber || ro?.roNumber || "2851";
  const customerName = storyRO
    ? `${storyRO._customer.firstName} ${storyRO._customer.lastName}`
    : primaryCustomer;
  const baseServices = ro?.jobs?.slice(0, 2).map(j => [j.name, `$${j.totalCost?.toFixed(2) || "79.99"}`])
    || [["Full Synthetic Oil Change 5W-30", "$79.99"], ["Tire Rotation", "$29.99"]];
  const baseTotal  = ro?.jobs?.slice(0, 2).reduce((s, j) => s + (j.totalCost || 0), 0) || 109.98;
  const talkTrack  = buildTalkTrack(customerName, vehicleStr, mileage);
  const [addedFlash, setAddedFlash] = useState(false);
  const [copiedLeft, setCopiedLeft] = useState(false);
  const [copiedRight, setCopiedRight] = useState(false);

  // Agentic customer text from story RO (G-1: "Draft — review before sending")
  const agenticText = storyRO?.agenticCustomerText || null;

  // G-2: 5-second undo countdown after approve tap
  function startUndoTimer() {
    setShowUndo(true);
    setUndoCount(5);
    let count = 5;
    const t = setInterval(() => {
      count -= 1;
      setUndoCount(count);
      if (count <= 0) {
        clearInterval(t);
        setShowUndo(false);
        setUndoTimer(null);
        setTextStatus("sent");
        // Persist to server
        const roId = storyRO?.roNumber || JOB3_RO_MAP[activeShopId];
        if (roId) updateStoryRO(roId, { agenticTextStatus: "sent" }).catch(() => {});
      }
    }, 1000);
    setUndoTimer(t);
  }

  function handleApproveAndSend() {
    setTextStatus("sending");
    startUndoTimer();
  }

  function handleUndo() {
    if (undoTimer) {
      clearInterval(undoTimer);
      setUndoTimer(null);
    }
    setShowUndo(false);
    setTextStatus("staged");
  }

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
            background: smsName?.toLowerCase().includes("mitchell") ? COLORS.smsHeaderMitchell1 : COLORS.smsHeaderProtractor,
            color: "#fff",
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
            {smsName} &nbsp;&middot;&nbsp; RO #{roNumber} &nbsp;&middot;&nbsp; {primaryCustomer} &nbsp;&middot;&nbsp; {vehicleStr}
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

          {/* ── AGENTIC MOMENT 2: Staged Customer Text ─────────────────────────
              G-1: labeled "Draft — review before sending", button says "Approve & Send"
              G-2: 5-sec undo toast before committing
              G-3: "AI suggested · Advisor approved" label once sent
          ── */}
          {agenticText && (
            <div
              style={{
                background: textStatus === "sent" ? "#F0FDF4" : "#F8F6FF",
                border: `1px solid ${textStatus === "sent" ? "#86EFAC" : "#C4B5FD"}`,
                borderRadius: 10,
                padding: "14px 16px",
              }}
            >
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Sparkles size={13} color={textStatus === "sent" ? "#22C55E" : "#7C3AED"} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: textStatus === "sent" ? "#15803D" : "#5B21B6", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    {textStatus === "sent" ? "AI suggested · Advisor approved" : "Draft — review before sending"}
                  </span>
                </div>
                {textStatus === "staged" && (
                  <span style={{ fontSize: 10, color: "#7C3AED", background: "#EDE9FE", borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>
                    Staged
                  </span>
                )}
              </div>

              {/* Text bubble */}
              <div style={{
                background: textStatus === "sent" ? "#DCFCE7" : "#EDE9FE",
                border: `1px solid ${textStatus === "sent" ? "#BBF7D0" : "#DDD6FE"}`,
                borderRadius: 8,
                padding: "11px 14px",
                fontSize: 13,
                lineHeight: "1.55",
                color: textStatus === "sent" ? "#15803D" : "#3730A3",
                marginBottom: 12,
              }}>
                {agenticText}
              </div>

              {/* G-2: Undo toast */}
              {showUndo && (
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "#1E1B4B", borderRadius: 7, padding: "9px 14px", marginBottom: 10,
                }}>
                  <span style={{ fontSize: 12, color: "#C4B5FD" }}>
                    Sending in {undoCount}s — committing when timer expires
                  </span>
                  <button
                    onClick={handleUndo}
                    style={{
                      background: "#7C3AED", border: "none", borderRadius: 5,
                      color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "4px 12px", cursor: "pointer",
                    }}
                  >
                    Undo
                  </button>
                </div>
              )}

              {/* Action button */}
              {textStatus === "staged" && (
                <button
                  onClick={handleApproveAndSend}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    width: "100%", padding: "10px 0",
                    background: "#7C3AED", border: "none", borderRadius: 7,
                    color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer",
                  }}
                >
                  <Send size={14} />
                  Approve &amp; Send
                </button>
              )}
              {textStatus === "sent" && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#15803D", fontWeight: 600 }}>
                  <CheckCircle size={14} color="#22C55E" />
                  Sent · AI suggested · Advisor approved
                </div>
              )}
            </div>
          )}

          {/* Talk track box */}
          <div
            style={{
              background: COLORS.smsBg,
              border: `1px solid ${COLORS.smsBorder}`,
              borderRadius: 10,
              padding: "16px 18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    background: COLORS.smsButtonMuted,
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
                <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textSecondary }}>
                  Customer Talk Track
                </span>
              </div>
              <button
                onClick={() => handleCopy("left")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: copiedLeft ? COLORS.borderLight : "transparent",
                  border: `1px solid ${COLORS.smsBorder}`,
                  borderRadius: 6,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLORS.smsButtonMuted,
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
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: COLORS.textSecondary }}>
              {talkTrack}
            </p>
          </div>
        </div>

        {/* SMS footer */}
        <div
          style={{
            padding: "8px 24px",
            borderTop: `1px solid ${COLORS.smsBorder}`,
            background: COLORS.smsBg,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 10, color: COLORS.smsLabel }}>
            {smsName} — Peninsula Precision Auto &nbsp;&middot;&nbsp; WrenchIQ reads {smsName} — never writes to it
          </span>
        </div>
      </div>

      {/* ── RIGHT PANEL: WrenchIQ Agent ── */}
      <div
        style={{
          flex: "0 0 35%",
          background: COLORS.navyDark,
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
        }}
      >
        {/* Panel header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${COLORS.navyBorder}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Wrench size={16} color={COLORS.gold} />
            <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.intelText }}>
              WrenchIQ
            </span>
            <span style={{ fontSize: 12, color: COLORS.intelMuted, marginLeft: 2 }}>
              · Job 3: Smart Upsell
            </span>
          </div>
        </div>

        <div style={{ flex: 1, padding: "18px 18px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Smart Upsell card */}
          <div
            style={{
              background: COLORS.navyMid,
              border: `1px solid ${COLORS.navyBorder}`,
              borderLeft: `3px solid ${COLORS.gold}`,
              borderRadius: 10,
              padding: "14px 16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <div
                style={{
                  background: COLORS.gold,
                  color: "#1A1A1A",
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
                    <Wind size={14} color={COLORS.gold} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.intelText }}>
                      Cabin Air Filter
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>
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
                    <Droplets size={14} color={COLORS.gold} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.intelText }}>
                      Transmission Fluid Exchange
                    </span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.gold }}>
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
              background: COLORS.navyMid,
              border: `1px solid ${COLORS.navyBorder}`,
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
              background: COLORS.navyMid,
              border: `1px solid ${COLORS.navyBorder}`,
              borderRadius: 10,
              padding: "13px 15px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
              <DollarSign size={13} color={COLORS.gold} />
              <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.gold, textTransform: "uppercase", letterSpacing: "0.06em" }}>
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
              background: `rgba(201,162,39,0.12)`,
              border: `1px solid rgba(201,162,39,0.25)`,
              borderRadius: 7,
              padding: "8px 12px",
            }}
          >
            <ChevronRight size={12} color={COLORS.gold} />
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.goldHover }}>
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
              background: showResult ? COLORS.success : addedFlash ? COLORS.success : COLORS.gold,
              border: "none",
              borderRadius: 9,
              color: showResult || addedFlash ? "#fff" : "#1A1A1A",
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
