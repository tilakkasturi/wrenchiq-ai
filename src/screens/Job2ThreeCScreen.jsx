/**
 * Job2ThreeCScreen.jsx
 * WrenchIQ demo screen — GWG Job 2: 3C Narrative Quality
 *
 * Split-screen layout:
 *   Left 65% — SMS panel (before / after 3C narrative states)
 *   Right 35% — WrenchIQ Agent panel (dark teal)
 */

import { useState, useEffect } from "react";
import {
  Sparkles,
  ClipboardCopy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  RotateCcw,
  FileText,
  Gauge,
  ShieldCheck,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { fetchStoryRO, updateStoryRO } from "../services/repairOrderService";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Map shopId → story RO id for Job 2
const JOB2_RO_MAP = {
  cornerstone: "RO-2026-0403",  // Brenda Okafor / F-150 (Marcus Webb 31/100)
  ridgeline:   "RO-2026-0502",  // Karen Tso / Silverado (Sofia 28/100)
};

// ─── Fallback narrative content ───────────────────────────────────────────────

const BEFORE_NARRATIVE_FALLBACK = `car makes weird noise at highway speed
engine light on
replaced catalytic converter - fixed`;

const AFTER_NARRATIVE = `COMPLAINT: Customer reports unusual noise at highway speed accompanied by malfunction indicator lamp illumination. Customer states condition began approximately one week ago and is consistent across driving conditions above 65 mph.

CAUSE: Diagnostic scan revealed DTC P0420 (Catalyst Efficiency Below Threshold, Bank 1). Per TSB-2021-0144, upstream oxygen sensor degradation is confirmed at 58,420 miles — consistent with known failure pattern in 2.5L 4-cylinder Camry engines between 45K–70K miles. Catalytic converter inspected and confirmed structurally intact. O2 sensor output confirmed lean bias via live data.

CORRECTION: Replaced upstream oxygen sensor (P/N: 89467-06170). Cleared DTC P0420. Performed extended test drive (12 miles, including sustained highway operation above 65 mph). All OBD-II monitors completed. No DTCs present. Noise eliminated. Vehicle returned to customer.`;

const AFTER_NARRATIVE_PREVIEW =
  "COMPLAINT: Customer reports unusual noise at highway speed accompanied by MIL illumination — condition above 65 mph for ~1 week. CAUSE: DTC P0420 per TSB-2021-0144…";

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScoreBadge({ score, color }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 10px",
        borderRadius: 12,
        background: color === "red" ? "#FEE2E2" : "#DCFCE7",
        color: color === "red" ? "#DC2626" : "#16A34A",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      <Gauge size={12} />
      Score: {score}/100
    </span>
  );
}

function GapRow({ text, passed }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
        padding: "5px 0",
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}
    >
      {passed ? (
        <CheckCircle size={14} color="#22C55E" style={{ flexShrink: 0, marginTop: 1 }} />
      ) : (
        <XCircle size={14} color="#F87171" style={{ flexShrink: 0, marginTop: 1 }} />
      )}
      <span
        style={{
          fontSize: 12,
          color: passed ? "#86EFAC" : "#FCA5A5",
          lineHeight: "1.4",
        }}
      >
        {text}
      </span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Job2ThreeCScreen() {
  const { smsName, activeShopId } = useDemo();
  const [showResult, setShowResult] = useState(false);
  const [copied, setCopied] = useState(false);
  const [roData, setRoData] = useState(null);
  const [storyRO, setStoryRO] = useState(null);
  const [applyFlash, setApplyFlash] = useState(false);

  // Legacy fallback
  useEffect(() => {
    fetch(`${API_BASE}/api/demo/ros`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.job2) setRoData(d.job2); })
      .catch(() => {});
  }, []);

  // Load story RO (primary)
  useEffect(() => {
    const roId = JOB2_RO_MAP[activeShopId] || JOB2_RO_MAP.cornerstone;
    fetchStoryRO(roId).then(ro => { if (ro) setStoryRO(ro); }).catch(() => {});
  }, [activeShopId]);

  const ro = roData;
  const s  = storyRO;

  // Prefer story RO data
  const customerName    = s?._customer ? `${s._customer.firstName} ${s._customer.lastName}` : ro?.customer?.name || "Robert Taylor";
  const vehicleStr      = s?._vehicle  ? `${s._vehicle.year} ${s._vehicle.make} ${s._vehicle.model}` : ro ? `${ro.vehicle.year} ${ro.vehicle.make} ${ro.vehicle.model}` : "2021 Toyota Camry SE";
  const roNumber        = s?.roNumber || ro?.roNumber || "2847";
  const techName        = s?.techName?.split(" ")[0] || ro?.tech?.name?.split(" ")[0] || "Mike R.";
  const mileageStr      = s?._vehicle ? Number(s._vehicle.mileage).toLocaleString() : ro ? Number(ro.vehicle.odometer).toLocaleString() : "58,420";

  // 3C before/after from story RO, fallback to static
  const beforeScore     = s?.threeCScore || 31;
  const beforeNarrative = s?.threeCConcern || ro?.techNotes || BEFORE_NARRATIVE_FALLBACK;
  const afterNarrative  = s?.threeCRewriteSuggestion?.concern
    ? `COMPLAINT: ${s.threeCRewriteSuggestion.concern}\n\nCAUSE: ${s.threeCRewriteSuggestion.diagnosis || "Pending inspection."}\n\nCORRECTION: ${s.threeCRewriteSuggestion.correction || "Pending diagnostic completion."}`
    : AFTER_NARRATIVE;
  const afterScore      = s?.threeCRewriteSuggestion?.score || 89;

  function handleCopy() {
    navigator.clipboard.writeText(afterNarrative).catch(() => {});
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowResult(true);
    }, 1500);
  }

  function handleApplyRewrite() {
    setApplyFlash(true);
    // Persist to server (update threeCConcern with rewrite)
    if (s?.roNumber && s?.threeCRewriteSuggestion) {
      updateStoryRO(s.roNumber, {
        threeCConcern: s.threeCRewriteSuggestion.concern,
        threeCDiagnosis: s.threeCRewriteSuggestion.diagnosis,
        threeCScore: s.threeCRewriteSuggestion.score,
      }).catch(() => {});
    }
    setTimeout(() => {
      setApplyFlash(false);
      setShowResult(true);
    }, 800);
  }

  function handleReset() {
    setShowResult(false);
    setCopied(false);
    setApplyFlash(false);
  }

  const isAfter = showResult;

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        fontFamily:
          "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        background: COLORS.bg,
      }}
    >
      {/* ── LEFT PANEL: SMS ──────────────────────────────────────────────── */}
      <div
        style={{
          flex: "0 0 65%",
          display: "flex",
          flexDirection: "column",
          borderRight: `1px solid ${COLORS.border}`,
          overflow: "hidden",
        }}
      >
        {/* SMS header bar */}
        <div
          style={{
            background: COLORS.primary,
            padding: "12px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: COLORS.accent,
                borderRadius: 6,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FileText size={15} color="#fff" />
            </div>
            <div>
              <div
                style={{
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 14,
                  lineHeight: "1.2",
                }}
              >
                {smsName}
              </div>
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}>
                RO #{roNumber} · {vehicleStr}
              </div>
            </div>
          </div>

          {/* Gray toolbar chips */}
          <div style={{ display: "flex", gap: 6 }}>
            {["Save Draft", "Print RO", "Send to Tech"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  borderRadius: 5,
                  padding: "4px 10px",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 11,
                  cursor: "default",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Vehicle / RO meta strip */}
          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            {[
              ["Customer", customerName],
              ["Vehicle", vehicleStr],
              ["Mileage", mileageStr],
              ["Tech", techName],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  background: COLORS.bgCard,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: "8px 14px",
                  minWidth: 110,
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: COLORS.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* State toggle label */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                background: isAfter ? "#DCFCE7" : "#FEF2F2",
                border: `1px solid ${isAfter ? "#86EFAC" : "#FECACA"}`,
                borderRadius: 6,
                padding: "3px 12px",
                fontSize: 11,
                fontWeight: 700,
                color: isAfter ? "#15803D" : "#B91C1C",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {isAfter ? "AFTER — REWRITTEN BY WRENCHIQ" : "BEFORE — ORIGINAL TECH NOTES"}
            </div>
            {isAfter && (
              <button
                onClick={handleReset}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "none",
                  border: "none",
                  color: COLORS.textMuted,
                  fontSize: 11,
                  cursor: "pointer",
                  padding: "2px 0",
                }}
              >
                <RotateCcw size={11} />
                Reset
              </button>
            )}
          </div>

          {/* Narrative textarea block */}
          <div
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${isAfter ? "#86EFAC" : "#FECACA"}`,
              borderRadius: 10,
              overflow: "hidden",
              boxShadow: isAfter
                ? "0 0 0 3px rgba(34,197,94,0.08)"
                : "0 0 0 3px rgba(239,68,68,0.07)",
            }}
          >
            {/* Textarea header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 16px",
                background: isAfter ? "#F0FDF4" : "#FFF1F2",
                borderBottom: `1px solid ${isAfter ? "#BBF7D0" : "#FECACA"}`,
              }}
            >
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: isAfter ? "#15803D" : "#B91C1C",
                }}
              >
                {isAfter ? "3C Narrative" : "Tech Notes / 3C Narrative"}
              </div>
              <ScoreBadge score={isAfter ? afterScore : beforeScore} color={isAfter ? "green" : "red"} />
            </div>

            {/* Textarea content */}
            <div
              style={{
                padding: "16px",
                background: isAfter ? "#F0FDF4" : "#FFF5F5",
                minHeight: 180,
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: 12.5,
                lineHeight: "1.7",
                color: isAfter ? "#14532D" : "#9B1C1C",
                fontStyle: isAfter ? "normal" : "italic",
                whiteSpace: "pre-wrap",
                userSelect: "text",
              }}
            >
              {isAfter ? afterNarrative : beforeNarrative}
            </div>
          </div>

          {/* Warning / success banner */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "12px 16px",
              background: isAfter ? "#F0FDF4" : "#FFF1F2",
              border: `1px solid ${isAfter ? "#86EFAC" : "#FECACA"}`,
              borderLeft: `4px solid ${isAfter ? "#22C55E" : "#EF4444"}`,
              borderRadius: 8,
            }}
          >
            {isAfter ? (
              <ShieldCheck size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
            ) : (
              <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
            )}
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                color: isAfter ? "#15803D" : "#B91C1C",
                lineHeight: "1.5",
              }}
            >
              {isAfter
                ? "Narrative meets GWG compliance standard. TSB referenced. Part number documented. Test verification included."
                : "Narrative incomplete — missing complaint context, DTC reference, TSB citation, part numbers, and test verification. Risk: warranty rejection."}
            </p>
          </div>

          {/* Flow indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              background: "#F9FAFB",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
            }}
          >
            <div
              style={{
                background: COLORS.primary,
                borderRadius: 5,
                padding: "3px 9px",
                fontSize: 11,
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "0.04em",
              }}
            >
              WrenchIQ
            </div>
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>rewrites</span>
            <ChevronRight size={13} color={COLORS.textMuted} />
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
              Advisor copies &amp; pastes into
            </span>
            <div
              style={{
                background: "#F3F4F6",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 5,
                padding: "3px 9px",
                fontSize: 11,
                fontWeight: 600,
                color: COLORS.textSecondary,
              }}
            >
              {smsName}
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: WrenchIQ Agent ──────────────────────────────────── */}
      <div
        style={{
          flex: "0 0 35%",
          background: COLORS.bgDark,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Agent header */}
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: COLORS.accent,
                borderRadius: 6,
                width: 26,
                height: 26,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Sparkles size={13} color="#fff" />
            </div>
            <span
              style={{
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.01em",
              }}
            >
              WrenchIQ
            </span>
            <span
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 12,
                fontWeight: 400,
              }}
            >
              · Job 2: 3C Compliance
            </span>
          </div>
          <div
            style={{
              background: isAfter ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
              border: `1px solid ${isAfter ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"}`,
              borderRadius: 12,
              padding: "2px 9px",
              fontSize: 10,
              fontWeight: 700,
              color: isAfter ? "#86EFAC" : "#FCA5A5",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {isAfter ? "COMPLIANT" : "ACTION NEEDED"}
          </div>
        </div>

        {/* Scrollable agent body */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          {/* Quality Alert card */}
          <div
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderLeft: `4px solid ${isAfter ? "#22C55E" : "#EF4444"}`,
              borderRadius: 8,
              padding: "14px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span
                  style={{
                    background: COLORS.accent,
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 9,
                    fontWeight: 800,
                    color: "#fff",
                    letterSpacing: "0.08em",
                  }}
                >
                  JOB 2
                </span>
                <span
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Narrative Quality Check
                </span>
              </div>
            </div>

            {/* Big score */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: 40,
                  fontWeight: 800,
                  lineHeight: "1",
                  color: isAfter ? "#4ADE80" : "#F87171",
                  letterSpacing: "-0.02em",
                }}
              >
                {isAfter ? "91" : "34"}
              </span>
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.4)",
                }}
              >
                /100
              </span>
              <span
                style={{
                  marginLeft: 4,
                  fontSize: 11,
                  color: isAfter ? "#86EFAC" : "#FCA5A5",
                  fontWeight: 600,
                }}
              >
                {isAfter ? "GWG Compliant" : "Below threshold (80)"}
              </span>
            </div>

            <div
              style={{
                height: 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 3,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${isAfter ? 91 : 34}%`,
                  background: isAfter
                    ? "linear-gradient(90deg, #22C55E, #4ADE80)"
                    : "linear-gradient(90deg, #EF4444, #F87171)",
                  borderRadius: 3,
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>

          {/* Gap analysis */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Compliance Checklist
            </div>
            <GapRow text="Complaint context documented" passed={isAfter} />
            <GapRow text="DTC code referenced (P0420)" passed={isAfter} />
            <GapRow text="TSB citation included (TSB-2021-0144)" passed={isAfter} />
            <GapRow text="Part number documented (P/N: 89467-06170)" passed={isAfter} />
            <GapRow text="Test verification recorded (12-mi drive)" passed={isAfter} />
          </div>

          {/* AI Rewrite block — shown in both states, changes label post-copy */}
          <div
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 8,
              padding: "14px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Sparkles size={13} color="#4ADE80" />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#86EFAC",
                  letterSpacing: "0.02em",
                }}
              >
                {isAfter ? "Rewrite Applied" : "AI Rewrite Ready"}
              </span>
            </div>

            <p
              style={{
                margin: "0 0 12px 0",
                fontSize: 11,
                color: "rgba(255,255,255,0.55)",
                lineHeight: "1.6",
                fontStyle: "italic",
              }}
            >
              {s?.threeCRewriteSuggestion?.concern
                ? s.threeCRewriteSuggestion.concern.slice(0, 120) + "…"
                : AFTER_NARRATIVE_PREVIEW}
            </p>

            {/* Apply Rewrite button (G-3: "AI suggested · Advisor approved" once applied) */}
            <button
              onClick={isAfter ? undefined : handleApplyRewrite}
              style={{
                width: "100%",
                padding: "9px 0",
                background: isAfter
                  ? "rgba(34,197,94,0.2)"
                  : applyFlash
                  ? "rgba(34,197,94,0.25)"
                  : COLORS.accent,
                border: isAfter
                  ? "1px solid rgba(34,197,94,0.35)"
                  : "none",
                borderRadius: 7,
                color: isAfter ? "#86EFAC" : "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: isAfter ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                letterSpacing: "0.02em",
                transition: "background 0.2s",
              }}
            >
              {isAfter ? (
                <>
                  <CheckCircle size={13} />
                  AI suggested · Advisor approved
                </>
              ) : applyFlash ? (
                <>
                  <CheckCircle size={13} />
                  Applying…
                </>
              ) : (
                <>
                  <ClipboardCopy size={13} />
                  Apply Rewrite
                </>
              )}
            </button>
          </div>

          {/* Why this matters */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              padding: "12px 14px",
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "rgba(255,255,255,0.4)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 8,
              }}
            >
              Why This Matters
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                lineHeight: "1.6",
              }}
            >
              At 200 ROs/month, a 60%→85% compliance lift prevents ~$1,800/month
              in rejected warranty claims. GWG network average at top locations:{" "}
              <strong style={{ color: "#FCD34D" }}>82%+</strong>
            </p>
          </div>

          {/* GWG Objective */}
          <div
            style={{
              background: "rgba(255,107,53,0.1)",
              border: "1px solid rgba(255,107,53,0.25)",
              borderRadius: 8,
              padding: "11px 14px",
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
            }}
          >
            <ShieldCheck size={14} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 4,
                }}
              >
                GWG Objective — Job 2
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: 11.5,
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: "1.5",
                }}
              >
                All brake / diagnostic ROs must achieve ≥ 80% 3C score with TSB
                references to qualify for GWG certification renewal.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
