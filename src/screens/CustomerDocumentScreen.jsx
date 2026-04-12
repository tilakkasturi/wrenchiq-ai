// CustomerDocumentScreen — AE-875
// Read-only customer-facing 3C document with approval workflow.
// Accessed via tokenized URL (e.g. /docs/abc123).
// Centered, mobile-responsive, max-width 680px.

import { useState } from "react";
import {
  MessageCircle, Search, Wrench, Star,
  CheckCircle, X, ChevronDown, ChevronUp, Shield,
  MapPin, Clock, User,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Constants ──────────────────────────────────────────────────

const DEFAULT_SHOP = {
  name: "Peninsula Precision Auto",
  logoColor: COLORS.accent,
  city: "Palo Alto, CA",
};

const SECTION_CONFIG = [
  {
    key: "complaint",
    heading: "What You Told Us",
    Icon: MessageCircle,
    iconColor: "#2563EB",
    iconBg: "#EFF6FF",
  },
  {
    key: "cause",
    heading: "What We Found",
    Icon: Search,
    iconColor: "#D97706",
    iconBg: "#FFFBEB",
  },
  {
    key: "correction",
    heading: "What We Did",
    Icon: Wrench,
    iconColor: "#16A34A",
    iconBg: "#F0FDF4",
  },
  {
    key: "recommendations",
    heading: "What We Recommend",
    Icon: Star,
    iconColor: "#7C3AED",
    iconBg: "#F5F3FF",
  },
];

const SCORE_THRESHOLDS = [
  { min: 85, label: "Excellent", color: "#16A34A" },
  { min: 70, label: "Good",      color: "#2563EB" },
  { min: 55, label: "Fair",      color: "#D97706" },
  { min: 0,  label: "Needs Review", color: "#DC2626" },
];

function scoreConfig(score) {
  return SCORE_THRESHOLDS.find(t => score >= t.min) || SCORE_THRESHOLDS[SCORE_THRESHOLDS.length - 1];
}

// ── Sub-components ─────────────────────────────────────────────

// Wrench logo mark — matches project branding
function ShopLogo({ color }) {
  return (
    <div style={{
      width: 40, height: 40, borderRadius: 10,
      background: color || COLORS.accent,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Wrench size={22} color="#fff" style={{ transform: "rotate(-45deg)" }} />
    </div>
  );
}

// Inline superscript reference span
function Ref({ n }) {
  return (
    <sup style={{
      fontSize: "0.65em",
      color: COLORS.textMuted,
      fontWeight: 600,
      marginLeft: 1,
      verticalAlign: "super",
      lineHeight: 0,
    }}>
      [{n}]
    </sup>
  );
}

// Render text with [N] tokens converted to <Ref> spans
function SectionText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\[\d+\])/);
  return (
    <p style={{
      fontSize: 15, lineHeight: 1.7,
      color: COLORS.textPrimary,
      margin: 0,
    }}>
      {parts.map((part, i) => {
        const match = part.match(/^\[(\d+)\]$/);
        if (match) return <Ref key={i} n={match[1]} />;
        return part;
      })}
    </p>
  );
}

// Single recommendation item with Approve / Decline buttons
function RecommendationItem({ item, decision, onDecide }) {
  const decided = decision === "approved" || decision === "declined";

  return (
    <div style={{
      background: "#FAFAFA",
      border: `1px solid ${decided
        ? (decision === "approved" ? "#BBF7D0" : "#E5E7EB")
        : COLORS.border}`,
      borderRadius: 10,
      padding: "12px 14px",
      marginBottom: 8,
    }}>
      <div style={{ marginBottom: decided ? 8 : 10, fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.4 }}>
        {item.description || item.name || item}
      </div>

      {decided ? (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "4px 12px", borderRadius: 20,
          background: decision === "approved" ? "#DCFCE7" : "#F3F4F6",
          color: decision === "approved" ? "#15803D" : COLORS.textSecondary,
          fontSize: 12, fontWeight: 700,
        }}>
          {decision === "approved"
            ? <CheckCircle size={13} />
            : <X size={13} />}
          {decision === "approved" ? "Approved" : "Declined"}
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onDecide(item.id, "approved")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
              background: "#16A34A", color: "#fff",
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <CheckCircle size={14} />
            Approve
          </button>
          <button
            onClick={() => onDecide(item.id, "declined")}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: "#F3F4F6", color: COLORS.textSecondary,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <X size={14} />
            Decline
          </button>
        </div>
      )}
    </div>
  );
}

// Section card — handles complaint/cause/correction and recommendations
function SectionCard({ config, document, decisions, onDecide }) {
  const { key, heading, Icon, iconColor, iconBg } = config;

  const sectionData = document?.sections?.[key];
  // Prefer structured section text; fall back to flat customerDocument field
  const text = sectionData?.text ?? (key === "complaint" ? document?.customerDocument : null);

  // Recommendations section has special treatment
  const isRecommendations = key === "recommendations";
  const items = isRecommendations
    ? (document?.recommendations ?? sectionData?.items ?? [])
    : null;

  const hasContent = isRecommendations ? (items && items.length > 0) : !!text;

  if (!hasContent && !isRecommendations) return null;

  return (
    <div style={{
      background: "#fff",
      border: `1px solid ${COLORS.border}`,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Card header */}
      <div style={{
        padding: "14px 18px",
        borderBottom: hasContent ? `1px solid ${COLORS.borderLight}` : "none",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 9,
          background: iconBg,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>
          {heading}
        </span>
      </div>

      {/* Card body */}
      {hasContent && (
        <div style={{ padding: "16px 18px" }}>
          {isRecommendations ? (
            items.length > 0 ? (
              items.map((item, i) => {
                const itemId = item.id ?? `rec-${i}`;
                const normalizedItem = typeof item === "string"
                  ? { id: itemId, description: item }
                  : { ...item, id: itemId };
                return (
                  <RecommendationItem
                    key={itemId}
                    item={normalizedItem}
                    decision={decisions[itemId]}
                    onDecide={onDecide}
                  />
                );
              })
            ) : (
              <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>
                No additional recommendations at this time.
              </p>
            )
          ) : (
            <SectionText text={text} />
          )}
        </div>
      )}

      {isRecommendations && !hasContent && (
        <div style={{ padding: "16px 18px" }}>
          <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: 0 }}>
            No additional recommendations at this time.
          </p>
        </div>
      )}
    </div>
  );
}

// Predii Score footer card
function PrediScoreCard({ score, explanation }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = scoreConfig(score ?? 0);

  return (
    <div style={{
      border: `2px solid ${COLORS.primary}`,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 20,
    }}>
      {/* Score row */}
      <div style={{
        padding: "18px 20px",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: `${cfg.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Shield size={26} color={cfg.color} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
            <span style={{ fontSize: 32, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>
              {score ?? "—"}
            </span>
            <span style={{ fontSize: 14, fontWeight: 700, color: cfg.color }}>
              {cfg.label}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            {explanation || "This score reflects your vehicle's overall health based on our inspection."}
          </p>
        </div>
      </div>

      {/* Expandable explainer */}
      <div style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{
            width: "100%", padding: "12px 20px",
            background: "transparent", border: "none",
            display: "flex", alignItems: "center", gap: 8,
            cursor: "pointer", textAlign: "left",
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.primary, flex: 1 }}>
            What is the Predii Score?
          </span>
          {expanded
            ? <ChevronUp size={16} color={COLORS.textMuted} />
            : <ChevronDown size={16} color={COLORS.textMuted} />}
        </button>

        {expanded && (
          <div style={{ padding: "0 20px 16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>
              The Predii Score (0–100) is a composite assessment of your vehicle's health across three dimensions:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Safety Readiness", desc: "Brakes, tires, lights, and systems critical to safe operation." },
                { label: "Mechanical Health", desc: "Engine, drivetrain, fluids, and service interval compliance." },
                { label: "Maintenance Currency", desc: "How up-to-date your vehicle is on manufacturer-recommended services." },
              ].map(({ label, desc }) => (
                <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.primary, flexShrink: 0, marginTop: 6 }} />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{label}: </span>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: "12px 0 0", fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
              Scores are generated by Predii's AI analysis engine using inspection data, OEM maintenance schedules, and historical vehicle data.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vehicle Status Card ────────────────────────────────────────

const STATUS_STEPS = [
  { id: "checked_in", label: "Checked In" },
  { id: "in_queue",   label: "In Queue"   },
  { id: "in_bay",     label: "In Bay"     },
  { id: "ready",      label: "Ready"      },
];

function bayStatusToStep(vehicleStatus) {
  if (!vehicleStatus || vehicleStatus === "checked_in") return "checked_in";
  if (vehicleStatus === "complete") return "ready";
  if (["in_use", "inspecting", "working", "waiting_approval"].includes(vehicleStatus)) return "in_bay";
  if (["ready_to_start", "starting"].includes(vehicleStatus)) return "in_queue";
  return "checked_in";
}

function VehicleStatusCard({ bayAssignment }) {
  if (!bayAssignment) return null;

  const currentStep = bayStatusToStep(bayAssignment.vehicleStatus);
  const stepIndex   = STATUS_STEPS.findIndex(s => s.id === currentStep);

  const subtitle =
    currentStep === "in_bay"     ? `Actively being serviced in ${bayAssignment.bayName}` :
    currentStep === "ready"      ? "Your vehicle is ready for pickup" :
    currentStep === "in_queue"   ? "Queued — technician assigned shortly" :
                                   "Vehicle checked in";

  return (
    <div style={{
      background: "#fff",
      border: `1.5px solid ${COLORS.primary}30`,
      borderRadius: 14,
      overflow: "hidden",
      marginBottom: 16,
    }}>
      {/* Header band */}
      <div style={{
        background: `linear-gradient(135deg, ${COLORS.primary} 0%, #0a4d5c 100%)`,
        padding: "14px 18px",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: "rgba(255,255,255,0.15)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <MapPin size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Your Vehicle Status</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 1 }}>{subtitle}</div>
        </div>
      </div>

      {/* Progress steps */}
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
          {STATUS_STEPS.map((step, idx) => {
            const done   = idx < stepIndex;
            const active = idx === stepIndex;
            return (
              <div key={step.id} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                  <div style={{
                    flex: 1, height: 2,
                    background: idx === 0 ? "transparent" : (done || active) ? COLORS.primary : "#E5E7EB",
                  }} />
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: done ? COLORS.primary : active ? COLORS.accent : "#F3F4F6",
                    border: active ? `2px solid ${COLORS.accent}` : "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {done   ? <CheckCircle size={12} color="#fff" strokeWidth={2.5} /> :
                     active ? <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} /> :
                     null}
                  </div>
                  <div style={{
                    flex: 1, height: 2,
                    background: idx === STATUS_STEPS.length - 1 ? "transparent" : done ? COLORS.primary : "#E5E7EB",
                  }} />
                </div>
                <div style={{
                  fontSize: 9, marginTop: 5, textAlign: "center", lineHeight: 1.3,
                  fontWeight: active ? 700 : done ? 600 : 400,
                  color: active ? COLORS.accent : done ? COLORS.primary : "#9CA3AF",
                  maxWidth: 56,
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bay / tech / est ready pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {bayAssignment.bayName && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8,
              background: `${COLORS.primary}08`,
              border: `1px solid ${COLORS.primary}25`,
            }}>
              <MapPin size={12} color={COLORS.primary} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.primary }}>
                {bayAssignment.bayName}
              </span>
            </div>
          )}
          {bayAssignment.tech && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8,
              background: "#F9FAFB",
              border: `1px solid ${COLORS.border}`,
            }}>
              <User size={12} color={COLORS.textSecondary} />
              <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                {bayAssignment.tech}
              </span>
            </div>
          )}
          {bayAssignment.estReady && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: 8,
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
            }}>
              <Clock size={12} color="#16A34A" />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>
                Est. ready {bayAssignment.estReady}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Not Found State ────────────────────────────────────────────

function DocumentNotFound({ shopName }) {
  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <div style={{
        maxWidth: 480, textAlign: "center",
        background: "#fff", borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        padding: "48px 32px",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: 14,
          background: "#FEF2F2",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <X size={28} color="#DC2626" />
        </div>
        <h2 style={{ margin: "0 0 12px", fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>
          Document Not Found
        </h2>
        <p style={{ margin: "0 0 20px", fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.6 }}>
          This document has expired or the link is invalid. Please contact{" "}
          {shopName || "your shop"} for a new copy.
        </p>
        <div style={{
          padding: "12px 16px",
          background: COLORS.bg, borderRadius: 10,
          fontSize: 13, color: COLORS.textMuted,
        }}>
          Documents are accessible for 90 days after the repair order closes.
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────

export default function CustomerDocumentScreen({
  document = null,
  shopBranding = DEFAULT_SHOP,
  tokenizedUrl = "/docs/demo",
  onRecommendationResponse = null,
}) {
  const [decisions, setDecisions] = useState({});

  const shop = { ...DEFAULT_SHOP, ...shopBranding };

  if (!document) {
    return <DocumentNotFound shopName={shop.name} />;
  }

  // Vehicle display string
  const vehicle = document.vehicle ?? {};
  const ymme = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean).join(" ");

  // Date display
  const dateStr = document.date
    ? new Date(document.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  // Predii score
  const score = document.prediiScore ?? document.score ?? null;
  const scoreExplanation = document.scoreExplanation ?? null;

  // References
  const references = document.references ?? [];

  function handleDecide(itemId, decision) {
    setDecisions(prev => ({ ...prev, [itemId]: decision }));
    if (typeof onRecommendationResponse === "function") {
      onRecommendationResponse(itemId, decision);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      padding: "24px 16px 48px",
    }}>
      <div style={{
        maxWidth: 680, margin: "0 auto",
      }}>

        {/* ── Demo Mode Banner ── */}
        <div style={{
          background: "#FFFBEB",
          border: "1px solid #FDE68A",
          borderRadius: 10,
          padding: "10px 16px",
          marginBottom: 20,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: "#F59E0B", flexShrink: 0,
          }} />
          <span style={{ fontSize: 13, color: "#92400E", fontWeight: 600 }}>
            Demo Mode
          </span>
          <span style={{ fontSize: 13, color: "#92400E" }}>
            — All data is simulated
          </span>
        </div>

        {/* ── Header ── */}
        <div style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: "20px 22px",
          marginBottom: 16,
        }}>
          {/* Shop identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <ShopLogo color={shop.logoColor} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>
                {shop.name}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                {shop.city}
              </div>
            </div>
          </div>

          {/* Report heading */}
          <h1 style={{
            margin: "0 0 6px",
            fontSize: 22, fontWeight: 900,
            color: COLORS.textPrimary, lineHeight: 1.2,
          }}>
            Vehicle Inspection Report
          </h1>

          {/* Vehicle + date */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px" }}>
            {ymme && (
              <span style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: 500 }}>
                {ymme}
              </span>
            )}
            <span style={{ fontSize: 14, color: COLORS.textMuted }}>
              {dateStr}
            </span>
            {tokenizedUrl && (
              <span style={{ fontSize: 12, color: COLORS.textMuted, fontFamily: "monospace" }}>
                {tokenizedUrl}
              </span>
            )}
          </div>
        </div>

        {/* ── Vehicle Status ── */}
        <VehicleStatusCard bayAssignment={document.bayAssignment ?? null} />

        {/* ── 3C Section Cards ── */}
        {SECTION_CONFIG.map(config => (
          <SectionCard
            key={config.key}
            config={config}
            document={document}
            decisions={decisions}
            onDecide={handleDecide}
          />
        ))}

        {/* ── Predii Score ── */}
        {score !== null && (
          <PrediScoreCard score={score} explanation={scoreExplanation} />
        )}

        {/* ── Document Footer ── */}
        <div style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 14,
          padding: "18px 20px",
        }}>
          {/* References */}
          {references.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
                References
              </div>
              <ol style={{ margin: 0, paddingLeft: 20 }}>
                {references.map((ref, i) => (
                  <li key={i} style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6, marginBottom: 3 }}>
                    {ref}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Expiry notice */}
          <div style={{
            padding: "10px 14px",
            background: COLORS.bg,
            borderRadius: 8,
            marginBottom: 14,
          }}>
            <p style={{ margin: 0, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
              Document accessible for 90 days after RO close. Link:{" "}
              <span style={{ fontFamily: "monospace", color: COLORS.textSecondary }}>
                {tokenizedUrl}
              </span>
            </p>
          </div>

          {/* Powered by */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>
              {shop.name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>Powered by</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.primary }}>
                WrenchIQ
                <span style={{ color: COLORS.accent }}>.ai</span>
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
