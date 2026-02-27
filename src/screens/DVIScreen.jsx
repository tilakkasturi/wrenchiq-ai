import { useState } from "react";
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Camera,
  Sparkles,
  FileText,
  Shield,
  DollarSign,
  Send,
  ClipboardList,
  Cpu,
  Info,
  Wrench,
  CarFront,
} from "lucide-react";
import {
  dviInspection,
  getCustomer,
  getVehicle,
  getTech,
  SHOP,
} from "../data/demoData";
import { getTSBsForVehicle } from "../data/tsbData";
import { COLORS } from "../theme/colors";

// ── Photo placeholder gradients by label ─────────────────────
const PHOTO_GRADIENTS = {
  brake_pad_front_left: "linear-gradient(135deg, #8B6914 0%, #3D2B06 100%)",
  brake_pad_front_right: "linear-gradient(135deg, #8B6914 0%, #3D2B06 100%)",
  brake_pad_rear: "linear-gradient(135deg, #7A5C10 0%, #2E2005 100%)",
  air_filter: "linear-gradient(135deg, #D4C5A0 0%, #5C4A28 100%)",
  serpentine_belt: "linear-gradient(135deg, #2D2D2D 0%, #1A1A1A 100%)",
  cabin_filter: "linear-gradient(135deg, #B8A882 0%, #7A6B4F 100%)",
};

// ── Wear bar gradient by wear percentage ─────────────────────
function wearBarGradient(wearPct) {
  if (wearPct >= 80)
    return `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.warning} 50%, ${COLORS.danger} 100%)`;
  if (wearPct >= 55)
    return `linear-gradient(90deg, ${COLORS.success} 0%, ${COLORS.warning} 100%)`;
  return `linear-gradient(90deg, ${COLORS.success} 0%, #86EFAC 100%)`;
}

// ── Status helpers ────────────────────────────────────────────
function statusLabel(status) {
  if (status === "urgent") return "URGENT";
  if (status === "monitor") return "MONITOR";
  return "GOOD";
}

function statusColor(status) {
  if (status === "urgent") return COLORS.danger;
  if (status === "monitor") return COLORS.warning;
  return COLORS.success;
}

function statusBgColor(status) {
  if (status === "urgent") return "#FEF2F2";
  if (status === "monitor") return "#FFFBEB";
  return "#F0FDF4";
}

function statusBorderColor(status) {
  if (status === "urgent") return "#FECACA";
  if (status === "monitor") return "#FDE68A";
  return "#BBF7D0";
}

// ── StatusIcon ────────────────────────────────────────────────
function StatusIcon({ status, size = 18 }) {
  if (status === "urgent") {
    return (
      <AlertCircle
        size={size}
        style={{ color: COLORS.danger, flexShrink: 0 }}
      />
    );
  }
  if (status === "monitor") {
    return (
      <AlertTriangle
        size={size}
        style={{ color: COLORS.warning, flexShrink: 0 }}
      />
    );
  }
  return (
    <CheckCircle
      size={size}
      style={{ color: COLORS.success, flexShrink: 0 }}
    />
  );
}

// ── SeverityBadge ─────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const map = {
    high: { bg: "#FEF2F2", color: COLORS.danger, label: "HIGH" },
    moderate: { bg: "#FFFBEB", color: COLORS.warning, label: "MODERATE" },
    low: { bg: "#F0FDF4", color: COLORS.success, label: "LOW" },
  };
  const s = map[severity] || map.low;
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 4,
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
    >
      {s.label}
    </span>
  );
}

// ── PhotoThumbnail ────────────────────────────────────────────
function PhotoThumbnail({ photoLabel }) {
  const gradient =
    PHOTO_GRADIENTS[photoLabel] ||
    "linear-gradient(135deg, #374151 0%, #1F2937 100%)";

  return (
    <div
      style={{
        width: 76,
        height: 58,
        borderRadius: 6,
        background: gradient,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.18)",
        boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
      }}
    >
      {/* Simulated film-grain / scan lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.05) 2px, rgba(0,0,0,0.05) 4px)",
        }}
      />
      <Camera
        size={17}
        style={{
          color: "rgba(255,255,255,0.55)",
          position: "relative",
          zIndex: 1,
        }}
      />
    </div>
  );
}

// ── AIAnalysisPanel ───────────────────────────────────────────
function AIAnalysisPanel({ aiAnalysis }) {
  const [expanded, setExpanded] = useState(false);
  const [reasoningOpen, setReasoningOpen] = useState(false);

  if (!aiAnalysis) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "linear-gradient(90deg, #0D3B45 0%, #1A5C6B 100%)",
          border: "none",
          borderRadius: 6,
          padding: "5px 11px",
          cursor: "pointer",
          color: "#FFFFFF",
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <Sparkles size={13} />
        AI Analysis by Sonnet 4.6
        {expanded ? (
          <ChevronDown size={12} />
        ) : (
          <ChevronRight size={12} />
        )}
      </button>

      {expanded && (
        <div
          style={{
            marginTop: 8,
            background: "linear-gradient(135deg, #F0FDFA 0%, #E0F2FE 100%)",
            border: "1px solid #BAE6FD",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          {/* Model + confidence row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: COLORS.primary,
                borderRadius: 6,
                padding: "3px 9px",
              }}
            >
              <Sparkles size={11} style={{ color: "#7DD3FC" }} />
              <span
                style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 700 }}
              >
                Claude Sonnet 4.6
              </span>
            </div>
            <div
              style={{
                background: "#DCFCE7",
                border: "1px solid #86EFAC",
                borderRadius: 6,
                padding: "3px 9px",
                fontSize: 11,
                fontWeight: 700,
                color: "#15803D",
              }}
            >
              {aiAnalysis.confidence}% confidence
            </div>
          </div>

          {/* Finding */}
          <div style={{ marginBottom: 8 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 3,
              }}
            >
              Finding
            </div>
            <div
              style={{
                fontSize: 13,
                color: COLORS.textPrimary,
                lineHeight: 1.55,
              }}
            >
              {aiAnalysis.finding}
            </div>
          </div>

          {/* Recommendation */}
          <div style={{ marginBottom: 10 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: 3,
              }}
            >
              Recommendation
            </div>
            <div
              style={{
                fontSize: 13,
                color: COLORS.textPrimary,
                fontWeight: 700,
                lineHeight: 1.55,
              }}
            >
              {aiAnalysis.recommendation}
            </div>
          </div>

          {/* Reasoning toggle */}
          {aiAnalysis.reasoning && (
            <div>
              <button
                onClick={() => setReasoningOpen((v) => !v)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: "1px solid #BAE6FD",
                  borderRadius: 5,
                  padding: "4px 9px",
                  cursor: "pointer",
                  color: "#0284C7",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                <Cpu size={11} />
                {reasoningOpen ? "Hide reasoning" : "Show reasoning"}
                {reasoningOpen ? (
                  <ChevronDown size={11} />
                ) : (
                  <ChevronRight size={11} />
                )}
              </button>

              {reasoningOpen && (
                <div
                  style={{
                    marginTop: 8,
                    background: "#0F172A",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: 11,
                    color: "#7DD3FC",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    overflowX: "auto",
                  }}
                >
                  <span style={{ color: "#64748B", fontWeight: 700 }}>
                    {"// Claude Sonnet 4.6 — Chain-of-Thought\n"}
                  </span>
                  {aiAnalysis.reasoning}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── InspectionItem ────────────────────────────────────────────
function InspectionItem({ item }) {
  return (
    <div
      style={{
        background: statusBgColor(item.status),
        border: `1px solid ${statusBorderColor(item.status)}`,
        borderRadius: 8,
        padding: "12px 14px",
        marginBottom: 8,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ marginTop: 2 }}>
          <StatusIcon status={item.status} size={18} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Name + status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 8,
              marginBottom: 5,
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.textPrimary,
              }}
            >
              {item.name}
            </span>
            <span
              style={{
                display: "inline-block",
                padding: "1px 7px",
                borderRadius: 4,
                background: statusColor(item.status),
                color: "#FFFFFF",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.06em",
              }}
            >
              {statusLabel(item.status)}
            </span>
          </div>

          {/* Measurement + specs */}
          {item.measurement && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                flexWrap: "wrap",
                marginBottom:
                  item.wearPct !== undefined && item.wearPct !== null ? 8 : 4,
              }}
            >
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                Measured:{" "}
                <strong style={{ color: COLORS.textPrimary }}>
                  {item.measurement}
                </strong>
              </span>
              {item.newSpec && (
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                  New: {item.newSpec}
                </span>
              )}
              {item.minSpec && (
                <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Min: {item.minSpec}
                </span>
              )}
            </div>
          )}

          {/* Wear bar */}
          {item.wearPct !== undefined && item.wearPct !== null && (
            <div style={{ marginBottom: 6 }}>
              <div
                style={{
                  fontSize: 11,
                  color: COLORS.textMuted,
                  marginBottom: 3,
                }}
              >
                Wear: {item.wearPct}%
              </div>
              <div
                style={{
                  height: 6,
                  background: "#E5E7EB",
                  borderRadius: 3,
                  overflow: "hidden",
                  maxWidth: 260,
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${Math.min(item.wearPct, 100)}%`,
                    background: wearBarGradient(item.wearPct),
                    borderRadius: 3,
                  }}
                />
              </div>
            </div>
          )}

          {/* Photo + AI analysis */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              marginTop: 4,
            }}
          >
            {item.hasPhoto && item.photoLabel && (
              <PhotoThumbnail photoLabel={item.photoLabel} />
            )}
            <div style={{ flex: 1 }}>
              {item.aiAnalysis && (
                <AIAnalysisPanel aiAnalysis={item.aiAnalysis} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CategorySection ───────────────────────────────────────────
function CategorySection({ category }) {
  const [open, setOpen] = useState(true);

  const urgentCount = category.items.filter((i) => i.status === "urgent")
    .length;
  const monitorCount = category.items.filter((i) => i.status === "monitor")
    .length;
  const goodCount = category.items.filter((i) => i.status === "good").length;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        marginBottom: 14,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      {/* Category header button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "linear-gradient(90deg, #F8FAFB 0%, #FFFFFF 100%)",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? `1px solid ${COLORS.border}` : "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {open ? (
            <ChevronDown size={18} style={{ color: COLORS.textSecondary }} />
          ) : (
            <ChevronRight size={18} style={{ color: COLORS.textSecondary }} />
          )}
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            {category.name}
          </span>
          <span
            style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500 }}
          >
            {category.items.length} items
          </span>
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          {urgentCount > 0 && (
            <span
              style={{
                background: "#FEF2F2",
                border: "1px solid #FECACA",
                color: COLORS.danger,
                borderRadius: 5,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {urgentCount} urgent
            </span>
          )}
          {monitorCount > 0 && (
            <span
              style={{
                background: "#FFFBEB",
                border: "1px solid #FDE68A",
                color: "#B45309",
                borderRadius: 5,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {monitorCount} monitor
            </span>
          )}
          {goodCount > 0 && (
            <span
              style={{
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                color: "#15803D",
                borderRadius: 5,
                padding: "2px 8px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {goodCount} good
            </span>
          )}
        </div>
      </button>

      {open && (
        <div style={{ padding: "14px 18px" }}>
          {category.items.map((item) => (
            <InspectionItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── TSBPanel ──────────────────────────────────────────────────
function TSBPanel({ tsbs }) {
  const [open, setOpen] = useState(true);

  if (!tsbs || tsbs.length === 0) return null;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        marginBottom: 16,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "linear-gradient(90deg, #FFF7ED 0%, #FFFBEB 100%)",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid #FDE68A" : "none",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {open ? (
            <ChevronDown size={18} style={{ color: "#B45309" }} />
          ) : (
            <ChevronRight size={18} style={{ color: "#B45309" }} />
          )}
          <FileText size={17} style={{ color: "#B45309" }} />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: COLORS.textPrimary,
            }}
          >
            Technical Service Bulletins
          </span>
          <span
            style={{
              background: "#FEF3C7",
              border: "1px solid #FDE68A",
              color: "#B45309",
              borderRadius: 5,
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {tsbs.length} applicable
          </span>
        </div>
      </button>

      {open && (
        <div style={{ padding: "14px 18px" }}>
          {/* AI callout */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              background: "linear-gradient(90deg, #EFF6FF 0%, #F0FDFA 100%)",
              border: "1px solid #BAE6FD",
              borderRadius: 8,
              padding: "10px 14px",
              marginBottom: 14,
            }}
          >
            <Sparkles
              size={15}
              style={{ color: "#0284C7", marginTop: 1, flexShrink: 0 }}
            />
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0284C7",
                  display: "block",
                  marginBottom: 3,
                }}
              >
                WrenchIQ AI — TSB Match
              </span>
              <span
                style={{
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  lineHeight: 1.55,
                }}
              >
                WrenchIQ AI identified{" "}
                <strong>TSB-0077-21</strong> may relate to this vehicle's{" "}
                <strong>58,200 mile service interval</strong>. An oil
                consumption check is recommended during the 60K service.
              </span>
            </div>
          </div>

          {tsbs.map((tsb) => (
            <div
              key={tsb.bulletinNumber}
              style={{
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "12px 14px",
                marginBottom: 10,
                background: "#FAFAF8",
              }}
            >
              {/* Bulletin header row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Courier New', Courier, monospace",
                      fontSize: 12,
                      fontWeight: 700,
                      color: COLORS.primary,
                      background: "#E0F2FE",
                      borderRadius: 5,
                      padding: "2px 8px",
                    }}
                  >
                    {tsb.bulletinNumber}
                  </span>
                  <SeverityBadge severity={tsb.severity} />
                  <span
                    style={{
                      fontSize: 11,
                      color: COLORS.textMuted,
                      background: COLORS.borderLight,
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    {tsb.component} / {tsb.system}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 14,
                    flexShrink: 0,
                  }}
                >
                  {tsb.laborHours > 0 && (
                    <span
                      style={{ fontSize: 12, color: COLORS.textSecondary }}
                    >
                      <strong>{tsb.laborHours}h</strong> labor
                    </span>
                  )}
                  {tsb.partsEstimate > 0 && (
                    <span
                      style={{ fontSize: 12, color: COLORS.textSecondary }}
                    >
                      Parts est:{" "}
                      <strong>${tsb.partsEstimate}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                  marginBottom: 5,
                  lineHeight: 1.4,
                }}
              >
                {tsb.title}
              </div>

              <div
                style={{
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  lineHeight: 1.6,
                  marginBottom: tsb.laborNote ? 6 : 0,
                }}
              >
                {tsb.description.length > 220
                  ? tsb.description.slice(0, 220) + "…"
                  : tsb.description}
              </div>

              {tsb.laborNote && (
                <div
                  style={{
                    fontSize: 11,
                    color: COLORS.textMuted,
                    fontStyle: "italic",
                  }}
                >
                  Labor note: {tsb.laborNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── AutoEstimateBanner ────────────────────────────────────────
function AutoEstimateBanner() {
  const urgentItems = [
    { name: "Engine Air Filter Replacement", cost: 87 },
    { name: "Serpentine Belt Replacement", cost: 126 },
  ];
  const recommendedItems = [
    { name: "Cabin Air Filter", cost: 81 },
    { name: "Brake Fluid Flush", cost: 97 },
    { name: "60K Transmission Fluid Exchange", cost: 280 },
    { name: "Front Brake Pads (deferred)", cost: 0 },
  ];

  const urgentTotal = urgentItems.reduce((s, i) => s + i.cost, 0);
  const recommendedTotal = recommendedItems
    .filter((i) => i.cost > 0)
    .reduce((s, i) => s + i.cost, 0);
  const grandTotal = urgentTotal + recommendedTotal;

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)",
        borderRadius: 12,
        padding: "18px 22px",
        marginBottom: 22,
        color: "#FFFFFF",
        boxShadow: "0 4px 16px rgba(13,59,69,0.3)",
      }}
    >
      {/* Top row: total + actions */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}
          >
            <Sparkles size={15} style={{ color: "#7DD3FC" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#7DD3FC",
                letterSpacing: "0.07em",
                textTransform: "uppercase",
              }}
            >
              AI Auto-Estimate — Claude Sonnet 4.6
            </span>
          </div>
          <div
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#FFFFFF",
              lineHeight: 1.1,
            }}
          >
            ${grandTotal.toLocaleString()}
          </div>
          <div style={{ fontSize: 13, color: "#BAE6FD", marginTop: 3 }}>
            Total recommended — based on DVI findings
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: COLORS.accent,
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              cursor: "pointer",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              boxShadow: "0 2px 10px rgba(255,107,53,0.4)",
            }}
          >
            <Send size={14} />
            Send to Customer
          </button>
          <button
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.28)",
              borderRadius: 8,
              padding: "10px 18px",
              cursor: "pointer",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            <ClipboardList size={14} />
            Review Estimate
          </button>
        </div>
      </div>

      {/* Breakdown cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {/* Urgent */}
        <div
          style={{
            flex: "1 1 200px",
            background: "rgba(239,68,68,0.14)",
            border: "1px solid rgba(239,68,68,0.28)",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <AlertCircle size={13} style={{ color: "#FCA5A5" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#FCA5A5",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              2 Urgent — ${urgentTotal}
            </span>
          </div>
          {urgentItems.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#FEE2E2",
                marginBottom: 3,
              }}
            >
              <span>{item.name}</span>
              <span style={{ fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                ${item.cost}
              </span>
            </div>
          ))}
        </div>

        {/* Recommended */}
        <div
          style={{
            flex: "1 1 260px",
            background: "rgba(245,158,11,0.11)",
            border: "1px solid rgba(245,158,11,0.24)",
            borderRadius: 8,
            padding: "10px 14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
            }}
          >
            <AlertTriangle size={13} style={{ color: "#FCD34D" }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#FCD34D",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Recommended — ${recommendedTotal}
            </span>
          </div>
          {recommendedItems.map((item) => (
            <div
              key={item.name}
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: "#FEF3C7",
                marginBottom: 3,
              }}
            >
              <span>{item.name}</span>
              <span style={{ fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                {item.cost > 0 ? `$${item.cost}` : "Deferred"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── VINRow ────────────────────────────────────────────────────
function VINRow({ vin }) {
  const [verified, setVerified] = useState(false);

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginTop: 5,
      }}
    >
      <span style={{ fontSize: 12, color: "#BAE6FD" }}>VIN:</span>
      <span
        style={{
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: 13,
          fontWeight: 600,
          color: "#FFFFFF",
          background: "rgba(255,255,255,0.12)",
          borderRadius: 5,
          padding: "3px 9px",
          letterSpacing: "0.05em",
          border: "1px solid rgba(255,255,255,0.18)",
        }}
      >
        {vin}
      </span>
      <button
        onClick={() => setVerified(true)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 5,
          background: verified ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.15)",
          border: verified
            ? "1px solid rgba(34,197,94,0.45)"
            : "1px solid rgba(255,255,255,0.3)",
          borderRadius: 5,
          padding: "4px 10px",
          cursor: "pointer",
          color: verified ? "#86EFAC" : "#FFFFFF",
          fontSize: 11,
          fontWeight: 700,
          transition: "all 0.2s ease",
        }}
      >
        <Shield size={11} />
        {verified ? "NHTSA Verified" : "Decode VIN"}
      </button>
    </div>
  );
}

// ── SummaryBar ────────────────────────────────────────────────
function SummaryBar({ summary }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 20,
      }}
    >
      {/* Urgent */}
      <div
        style={{
          flex: "1 1 120px",
          background: "#FEF2F2",
          border: "2px solid #FECACA",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <AlertCircle size={24} style={{ color: COLORS.danger, flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.danger,
              lineHeight: 1,
            }}
          >
            {summary.urgent}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#B91C1C",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Urgent
          </div>
        </div>
      </div>

      {/* Monitor */}
      <div
        style={{
          flex: "1 1 120px",
          background: "#FFFBEB",
          border: "2px solid #FDE68A",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <AlertTriangle size={24} style={{ color: COLORS.warning, flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.warning,
              lineHeight: 1,
            }}
          >
            {summary.monitor}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#B45309",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Monitor
          </div>
        </div>
      </div>

      {/* Good */}
      <div
        style={{
          flex: "1 1 120px",
          background: "#F0FDF4",
          border: "2px solid #BBF7D0",
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <CheckCircle size={24} style={{ color: COLORS.success, flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.success,
              lineHeight: 1,
            }}
          >
            {summary.good}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#15803D",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Good
          </div>
        </div>
      </div>

      {/* Total */}
      <div
        style={{
          flex: "1 1 120px",
          background: COLORS.bgCard,
          border: `2px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <ClipboardList size={24} style={{ color: COLORS.textSecondary, flexShrink: 0 }} />
        <div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: COLORS.textPrimary,
              lineHeight: 1,
            }}
          >
            {summary.totalItems}
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.textSecondary,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Total Items
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DVIScreen (main export) ───────────────────────────────────
export default function DVIScreen() {
  const inspection = dviInspection;
  const vehicle = getVehicle(inspection.vehicleId);
  const customer = vehicle ? getCustomer(vehicle.customerId) : null;
  const tech = getTech(inspection.techId);

  const tsbs = vehicle
    ? getTSBsForVehicle(vehicle.make, vehicle.model, vehicle.year)
    : [];

  const vehicleLabel = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
    : "Unknown Vehicle";

  const customerName = customer
    ? `${customer.firstName} ${customer.lastName}`
    : "Unknown Customer";

  const inspectedDate = new Date(inspection.inspectedAt).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );
  const inspectedTime = new Date(inspection.inspectedAt).toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)",
          padding: "16px 24px",
          boxShadow: "0 2px 12px rgba(13,59,69,0.28)",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Breadcrumb + Analyzed-by badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                flexWrap: "wrap",
              }}
            >
              <Wrench size={14} style={{ color: "#7DD3FC" }} />
              <span style={{ fontSize: 12, color: "#7DD3FC" }}>
                {SHOP.name}
              </span>
              <span style={{ fontSize: 12, color: "rgba(125,211,252,0.45)" }}>
                /
              </span>
              <span style={{ fontSize: 12, color: "#BAE6FD" }}>
                Digital Vehicle Inspection
              </span>
            </div>

            {/* Prominent "Analyzed by" badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(125,211,252,0.12)",
                border: "1px solid rgba(125,211,252,0.35)",
                borderRadius: 20,
                padding: "6px 14px",
              }}
            >
              <Sparkles size={14} style={{ color: "#7DD3FC" }} />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#7DD3FC",
                  letterSpacing: "0.01em",
                }}
              >
                Analyzed by Claude Sonnet 4.6
              </span>
            </div>
          </div>

          {/* Vehicle title row */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 8,
                }}
              >
                <CarFront size={22} style={{ color: "#FFFFFF", flexShrink: 0 }} />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#FFFFFF",
                    margin: 0,
                    lineHeight: 1.2,
                  }}
                >
                  {vehicleLabel}
                </h1>
                <span
                  style={{
                    fontSize: 15,
                    color: "#BAE6FD",
                    fontWeight: 500,
                  }}
                >
                  — {customerName}
                </span>
              </div>

              {/* Chips */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    color: "#FFFFFF",
                    fontWeight: 600,
                  }}
                >
                  Bay 1
                </span>
                <span
                  style={{
                    background: "rgba(255,107,53,0.22)",
                    border: "1px solid rgba(255,107,53,0.4)",
                    borderRadius: 6,
                    padding: "3px 10px",
                    fontSize: 12,
                    color: "#FED7AA",
                    fontWeight: 600,
                  }}
                >
                  {inspection.roId}
                </span>
                {tech && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      color: "#E0F2FE",
                    }}
                  >
                    Tech: {tech.name}
                  </span>
                )}
                {vehicle && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      color: "#E0F2FE",
                    }}
                  >
                    {vehicle.mileage.toLocaleString()} mi
                  </span>
                )}
                {vehicle && (
                  <span
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      color: "#E0F2FE",
                    }}
                  >
                    {vehicle.engine}
                  </span>
                )}
              </div>

              {/* VIN */}
              {vehicle && <VINRow vin={vehicle.vin} />}
            </div>

            {/* Inspection timestamp card */}
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.18)",
                borderRadius: 8,
                padding: "10px 16px",
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              <div style={{ fontSize: 11, color: "#BAE6FD", marginBottom: 3 }}>
                Inspected
              </div>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}
              >
                {inspectedDate}
              </div>
              <div style={{ fontSize: 12, color: "#BAE6FD" }}>
                {inspectedTime}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ───────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "24px 24px 48px",
        }}
      >
        {/* AI Auto-Estimate Banner */}
        <AutoEstimateBanner />

        {/* Summary Bar */}
        <SummaryBar summary={inspection.summary} />

        {/* Vehicle detail strip */}
        {vehicle && (
          <div
            style={{
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              padding: "12px 18px",
              marginBottom: 20,
              display: "flex",
              gap: 18,
              flexWrap: "wrap",
              alignItems: "center",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Transmission
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                }}
              >
                {vehicle.transmission}
              </div>
            </div>
            <div
              style={{ width: 1, height: 30, background: COLORS.border }}
            />
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Drivetrain
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                }}
              >
                {vehicle.drivetrain}
              </div>
            </div>
            <div
              style={{ width: 1, height: 30, background: COLORS.border }}
            />
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Color
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.textPrimary,
                }}
              >
                {vehicle.color}
              </div>
            </div>
            <div
              style={{ width: 1, height: 30, background: COLORS.border }}
            />
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Next Service
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLORS.accent,
                }}
              >
                {vehicle.nextServiceType} @{" "}
                {vehicle.nextServiceMiles.toLocaleString()} mi
              </div>
            </div>
            {customer && (
              <>
                <div
                  style={{
                    width: 1,
                    height: 30,
                    background: COLORS.border,
                  }}
                />
                <div style={{ flex: 1, minWidth: 180 }}>
                  <div
                    style={{ fontSize: 11, color: COLORS.textMuted }}
                  >
                    Customer Note
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: COLORS.textSecondary,
                      lineHeight: 1.45,
                    }}
                  >
                    {customer.notes}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Inspection results section heading */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            marginBottom: 14,
          }}
        >
          <ClipboardList size={19} style={{ color: COLORS.primary }} />
          <h2
            style={{
              fontSize: 19,
              fontWeight: 700,
              color: COLORS.textPrimary,
              margin: 0,
            }}
          >
            Inspection Results
          </h2>
          <span
            style={{
              fontSize: 12,
              color: COLORS.textMuted,
              fontStyle: "italic",
            }}
          >
            56-point multi-point inspection
          </span>
        </div>

        {/* Category sections */}
        {inspection.categories.map((cat) => (
          <CategorySection key={cat.name} category={cat} />
        ))}

        {/* TSB Panel */}
        <TSBPanel tsbs={tsbs} />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            paddingTop: 22,
            borderTop: `1px solid ${COLORS.border}`,
          }}
        >
          <Sparkles size={13} style={{ color: COLORS.textMuted }} />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>
            AI inspection analysis powered by{" "}
            <strong style={{ color: COLORS.primary }}>
              Claude Sonnet 4.6
            </strong>{" "}
            — {SHOP.name} · WrenchIQ DVI v2.0
          </span>
        </div>
      </div>
    </div>
  );
}
