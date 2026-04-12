// ROActivePanel.jsx — AE-873
// Collapsible right-side panel showing the 3C document building in real time.
// Used in AM3CStoryWriterScreen. Receives all data via props — no service imports.

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Car,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  FileText,
} from "lucide-react";
import { COLORS } from "../../theme/colors";

// ── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS = [
  "Intake",
  "DVI",
  "Scan",
  "TSB",
  "Classify",
  "Score",
  "Review",
];

const SECTION_META = [
  { key: "complaint",        label: "Complaint",       borderColor: "#2563EB", stageLine: "Stage: Customer Intake" },
  { key: "cause",            label: "Cause",           borderColor: "#D97706", stageLine: "Stage: DVI, TSB, Scan" },
  { key: "correction",       label: "Correction",      borderColor: "#16A34A", stageLine: "Stage: Work Performed" },
  { key: "recommendations",  label: "Recommendations", borderColor: "#7C3AED", stageLine: "Stage: Deferred Items" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function confBadge(confidence) {
  if (confidence >= 0.9)  return { label: "AUTO",   bg: "#DCFCE7", color: "#15803D" };
  if (confidence >= 0.7)  return { label: "REVIEW",  bg: "#FEF3C7", color: "#92400E" };
  return                           { label: "FLAG",   bg: "#FEE2E2", color: "#991B1B" };
}

function countSections(roContext, fallback = {}) {
  const notes = roContext?.classifiedNotes || [];
  const dvi   = roContext?.dviFindings      || [];
  const tsb   = roContext?.tsbMatches       || [];
  const dtc   = roContext?.dtcCodes         || [];
  const parts = roContext?.partsInstalled   || [];
  const labor = roContext?.laborOps         || [];

  const pipelineComplaint =
    (roContext?.intake ? 1 : 0) +
    notes.filter(n => n.section === "complaint").length;
  const pipelineCause =
    dvi.filter(f => f.routed_to === "cause").length +
    tsb.filter(t => t.accepted).length +
    dtc.length +
    notes.filter(n => n.section === "cause").length;
  const pipelineCorrection =
    parts.length +
    labor.length +
    notes.filter(n => n.section === "correction").length;

  return {
    complaint:      pipelineComplaint      || (fallback.complaint      ? 1 : 0),
    cause:          pipelineCause          || (fallback.cause          ? 1 : 0),
    correction:     pipelineCorrection     || (fallback.correction     ? 1 : 0),
    recommendations:
      dvi.filter(f => f.routed_to === "recommendations").length +
      notes.filter(n => n.section === "recommendation").length,
  };
}

function sentencesForSection(roContext, sectionKey, fallback = {}) {
  const notes = roContext?.classifiedNotes || [];

  if (sectionKey === "complaint") {
    const items = [];
    if (roContext?.intake) {
      items.push({ text: roContext.intake.concern || roContext.intake.text || "Customer intake recorded.", confidence: 0.95 });
    }
    notes.filter(n => n.section === "complaint").forEach(n => {
      items.push({ text: n.text || n.note || JSON.stringify(n), confidence: n.confidence ?? 0.75 });
    });
    if (items.length === 0 && fallback.complaint) {
      items.push({ text: fallback.complaint, confidence: 0.9, source: "editor" });
    }
    return items;
  }

  if (sectionKey === "cause") {
    const items = [];
    (roContext?.dviFindings || []).filter(f => f.routed_to === "cause").forEach(f => {
      items.push({ text: f.finding || f.text || JSON.stringify(f), confidence: f.confidence ?? 0.8 });
    });
    (roContext?.tsbMatches || []).filter(t => t.accepted).forEach(t => {
      items.push({ text: `TSB ${t.id || ""}: ${t.title || t.summary || "Matched TSB"}`, confidence: t.confidence ?? 0.85 });
    });
    (roContext?.dtcCodes || []).forEach(d => {
      items.push({ text: `DTC ${d.code || d}: ${d.description || "Fault code detected"}`, confidence: 0.92 });
    });
    notes.filter(n => n.section === "cause").forEach(n => {
      items.push({ text: n.text || n.note || JSON.stringify(n), confidence: n.confidence ?? 0.75 });
    });
    if (items.length === 0 && fallback.cause) {
      items.push({ text: fallback.cause, confidence: 0.85, source: "editor" });
    }
    return items;
  }

  if (sectionKey === "correction") {
    const items = [];
    (roContext?.partsInstalled || []).forEach(p => {
      items.push({ text: `Part installed: ${p.name || p.partNumber || JSON.stringify(p)}`, confidence: 0.95 });
    });
    (roContext?.laborOps || []).forEach(l => {
      items.push({ text: `Labor: ${l.description || l.op || JSON.stringify(l)}`, confidence: 0.92 });
    });
    notes.filter(n => n.section === "correction").forEach(n => {
      items.push({ text: n.text || n.note || JSON.stringify(n), confidence: n.confidence ?? 0.75 });
    });
    if (items.length === 0 && fallback.correction) {
      items.push({ text: fallback.correction, confidence: 0.88, source: "editor" });
    }
    return items;
  }

  if (sectionKey === "recommendations") {
    const items = [];
    (roContext?.dviFindings || []).filter(f => f.routed_to === "recommendations").forEach(f => {
      items.push({ text: f.finding || f.text || JSON.stringify(f), confidence: f.confidence ?? 0.78 });
    });
    notes.filter(n => n.section === "recommendation").forEach(n => {
      items.push({ text: n.text || n.note || JSON.stringify(n), confidence: n.confidence ?? 0.7 });
    });
    return items;
  }

  return [];
}

function scoreLabelText(score) {
  if (score === null || score === undefined) return "Pending";
  if (score >= 88) return "Excellent";
  if (score >= 72) return "Good";
  if (score >= 55) return "Fair";
  return "Needs Review";
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StageBar({ currentStage }) {
  // currentStage is 0-based index (0–6)
  return (
    <div style={{ padding: "10px 14px 8px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 0 }}>
        {STAGE_LABELS.map((label, idx) => {
          const isCompleted = idx < currentStage;
          const isCurrent   = idx === currentStage;
          const isPending   = idx > currentStage;

          let circleBg    = "#E5E7EB";
          let circleColor = "#9CA3AF";
          let circleBorder = "none";

          if (isCompleted) {
            circleBg    = COLORS.primary;
            circleColor = "#fff";
          } else if (isCurrent) {
            circleBg    = COLORS.accent;
            circleColor = "#fff";
          } else if (isPending) {
            circleBg    = "#fff";
            circleColor = "#D1D5DB";
            circleBorder = "1.5px solid #D1D5DB";
          }

          return (
            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* connector + circle row */}
              <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                {/* left connector */}
                <div style={{
                  flex: 1, height: 1,
                  background: idx === 0 ? "transparent" : (isCompleted || isCurrent ? COLORS.primary : "#E5E7EB"),
                }} />
                {/* circle */}
                <div style={{
                  width: 18, height: 18, borderRadius: "50%", flexShrink: 0,
                  background: circleBg,
                  border: circleBorder,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {isCompleted ? (
                    <CheckCircle size={10} color="#fff" strokeWidth={2.5} />
                  ) : isCurrent ? (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                  ) : (
                    <X size={8} color="#D1D5DB" strokeWidth={2} />
                  )}
                </div>
                {/* right connector */}
                <div style={{
                  flex: 1, height: 1,
                  background: idx === STAGE_LABELS.length - 1 ? "transparent" : (isCompleted ? COLORS.primary : "#E5E7EB"),
                }} />
              </div>
              {/* label */}
              <div style={{
                fontSize: 8, marginTop: 3, textAlign: "center",
                color: isCurrent ? COLORS.accent : isCompleted ? COLORS.primary : "#9CA3AF",
                fontWeight: isCurrent || isCompleted ? 700 : 400,
                lineHeight: 1.2,
                maxWidth: 32,
                wordBreak: "break-word",
              }}>
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SectionCard({ meta, count, sentences, expanded, onToggle }) {
  return (
    <div style={{
      background: "#FAFAFA",
      borderRadius: 8,
      borderLeft: `3px solid ${meta.borderColor}`,
      border: `1px solid ${COLORS.border}`,
      borderLeftWidth: 3,
      overflow: "hidden",
      marginBottom: 6,
    }}>
      {/* Card header — always visible */}
      <div
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "8px 10px",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }}>
            {meta.label}
          </div>
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 1 }}>
            {meta.stageLine}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            fontSize: 11, fontWeight: 800,
            color: count > 0 ? meta.borderColor : COLORS.textMuted,
            minWidth: 16, textAlign: "right",
          }}>
            {count}
          </span>
          <span style={{ fontSize: 9, color: COLORS.textMuted, marginRight: 2 }}>items</span>
          {expanded ? (
            <ChevronUp size={12} color={COLORS.textMuted} />
          ) : (
            <ChevronDown size={12} color={COLORS.textMuted} />
          )}
        </div>
      </div>

      {/* Expanded sentence list */}
      {expanded && (
        <div style={{
          borderTop: `1px solid ${COLORS.border}`,
          maxHeight: 160,
          overflowY: "auto",
        }}>
          {sentences.length === 0 ? (
            <div style={{ padding: "8px 10px", fontSize: 10, color: COLORS.textMuted, fontStyle: "italic" }}>
              No items yet.
            </div>
          ) : (
            sentences.map((s, i) => {
              const badge = confBadge(s.confidence);
              return (
                <div key={i} style={{
                  padding: "6px 10px",
                  borderBottom: i < sentences.length - 1 ? `1px solid ${COLORS.borderLight}` : "none",
                  display: "flex", alignItems: "flex-start", gap: 6,
                }}>
                  <div style={{ flex: 1, fontSize: 10, color: COLORS.textPrimary, lineHeight: 1.4 }}>
                    {s.text}
                  </div>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: 0.3,
                    background: badge.bg, color: badge.color,
                    borderRadius: 3, padding: "2px 4px",
                    flexShrink: 0, marginTop: 1,
                  }}>
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function ScoreGauge({ prediiScore }) {
  const size     = 80;
  const cx       = size / 2;
  const cy       = size / 2;
  const r        = 30;
  const circumf  = 2 * Math.PI * r;

  const scoreVal  = prediiScore?.overall ?? null;
  const label     = scoreLabelText(scoreVal);
  const pct       = scoreVal !== null ? Math.min(100, Math.max(0, scoreVal)) / 100 : 0;
  const dashArray = `${pct * circumf} ${circumf}`;

  const gaugeColor =
    scoreVal === null    ? "#E5E7EB" :
    scoreVal >= 88       ? "#16A34A" :
    scoreVal >= 72       ? "#D97706" :
    scoreVal >= 55       ? "#F59E0B" : "#EF4444";

  // Dimension bars: completeness, accuracy, compliance (or from prediiScore)
  const dims = [
    { label: "Completeness", val: prediiScore?.completeness ?? null, color: "#2563EB" },
    { label: "Accuracy",     val: prediiScore?.accuracy     ?? null, color: "#D97706" },
    { label: "Compliance",   val: prediiScore?.compliance   ?? null, color: "#7C3AED" },
  ];

  return (
    <div style={{ padding: "10px 14px 8px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
        Predii Score
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {/* Ring */}
        <svg width={size} height={size} style={{ flexShrink: 0 }}>
          {/* Track */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="#F3F4F6"
            strokeWidth={8}
          />
          {/* Progress */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={8}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            strokeDashoffset={circumf * 0.25}
            transform={`rotate(-90 ${cx} ${cy})`}
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
          {/* Score text */}
          <text
            x={cx} y={cy - 4}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={scoreVal !== null ? 16 : 14}
            fontWeight={800}
            fill={scoreVal !== null ? gaugeColor : "#9CA3AF"}
            fontFamily="Inter, sans-serif"
          >
            {scoreVal !== null ? scoreVal : "—"}
          </text>
          <text
            x={cx} y={cy + 12}
            textAnchor="middle"
            fontSize={7}
            fontWeight={600}
            fill="#9CA3AF"
            fontFamily="Inter, sans-serif"
          >
            {label}
          </text>
        </svg>

        {/* Dimension bars */}
        <div style={{ flex: 1 }}>
          {dims.map(({ label: dimLabel, val, color }) => (
            <div key={dimLabel} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: COLORS.textMuted }}>{dimLabel}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: val !== null ? color : COLORS.textMuted }}>
                  {val !== null ? val : "—"}
                </span>
              </div>
              <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: val !== null ? `${Math.min(100, val)}%` : "0%",
                  background: color,
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ROActivePanel({
  roContext,
  prediiScore,
  selectedRO,
  complaint,
  cause,
  correction,
  onOpenFullReview,
  collapsed,
  onToggleCollapse,
}) {
  const [expandedSection, setExpandedSection] = useState(null);

  function handleToggleSection(key) {
    setExpandedSection(prev => (prev === key ? null : key));
  }

  const fallback = { complaint, cause, correction };
  const counts   = countSections(roContext, fallback);
  const vehicle  = roContext?.vehicle || selectedRO?.vehicle || null;

  // Derive current stage from available data
  let currentStage = 0;
  if (roContext) {
    if (roContext.intake)                                              currentStage = Math.max(currentStage, 1);
    if ((roContext.dviFindings || []).length > 0)                     currentStage = Math.max(currentStage, 2);
    if ((roContext.dtcCodes || []).length > 0)                        currentStage = Math.max(currentStage, 3);
    if ((roContext.tsbMatches || []).length > 0)                      currentStage = Math.max(currentStage, 4);
    if ((roContext.classifiedNotes || []).length > 0)                 currentStage = Math.max(currentStage, 5);
    if (prediiScore)                                                  currentStage = Math.max(currentStage, 6);
  }

  // ── Collapsed state: show only a thin vertical header bar ────────────────
  if (collapsed) {
    return (
      <div style={{
        width: 36,
        flexShrink: 0,
        background: "#fff",
        borderLeft: `1px solid ${COLORS.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 10,
        cursor: "pointer",
      }} onClick={onToggleCollapse}>
        <ChevronLeft size={16} color={COLORS.textSecondary} />
        <div style={{
          marginTop: 14,
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          transform: "rotate(180deg)",
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.textSecondary,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          userSelect: "none",
        }}>
          3C Build Panel
        </div>
      </div>
    );
  }

  // ── Expanded state ────────────────────────────────────────────────────────
  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: "#fff",
      borderLeft: `1px solid ${COLORS.border}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>

      {/* Header */}
      <div style={{
        padding: "10px 12px",
        borderBottom: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <FileText size={13} color={COLORS.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
            3C Build Panel
          </span>
        </div>
        <button
          onClick={onToggleCollapse}
          style={{
            border: "none", background: "transparent", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 4, borderRadius: 4,
            color: COLORS.textSecondary,
          }}
          title="Collapse panel"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto" }}>

        {/* RO + Vehicle header */}
        <div style={{
          padding: "10px 12px 8px",
          borderBottom: `1px solid ${COLORS.borderLight}`,
        }}>
          {selectedRO && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <FileText size={11} color={COLORS.accent} />
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, fontFamily: "monospace" }}>
                {selectedRO.id}
              </span>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>·</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: COLORS.textPrimary }}>
                {selectedRO.customerName}
              </span>
            </div>
          )}
          {vehicle ? (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6,
                background: `${COLORS.primary}12`,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <Car size={12} color={COLORS.primary} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.3 }}>
                  {[vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ")}
                </div>
                {vehicle.vin && (
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 2, fontFamily: "monospace", letterSpacing: 0.3 }}>
                    VIN: {vehicle.vin}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <AlertTriangle size={12} color="#F59E0B" />
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>No vehicle loaded</span>
            </div>
          )}
        </div>

        {/* 7-stage progress bar */}
        <div style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
          <StageBar currentStage={currentStage} />
        </div>

        {/* Section cards */}
        <div style={{ padding: "8px 10px" }}>
          {SECTION_META.map(meta => (
            <SectionCard
              key={meta.key}
              meta={meta}
              count={counts[meta.key]}
              sentences={sentencesForSection(roContext, meta.key, fallback)}
              expanded={expandedSection === meta.key}
              onToggle={() => handleToggleSection(meta.key)}
            />
          ))}
        </div>

        {/* Predii Score gauge */}
        <div style={{ borderTop: `1px solid ${COLORS.borderLight}` }}>
          <ScoreGauge prediiScore={prediiScore} />
        </div>
      </div>

      {/* Footer: Open Full Review button */}
      <div style={{
        padding: "10px 12px",
        borderTop: `1px solid ${COLORS.border}`,
        flexShrink: 0,
      }}>
        <button
          onClick={onOpenFullReview}
          disabled={!roContext}
          style={{
            width: "100%",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "8px 12px",
            borderRadius: 7,
            border: "none",
            cursor: roContext ? "pointer" : "not-allowed",
            background: roContext ? COLORS.primary : "#F3F4F6",
            color: roContext ? "#fff" : COLORS.textMuted,
            fontSize: 12, fontWeight: 700,
            transition: "background 0.15s",
          }}
        >
          <FileText size={13} />
          Open Full Review
        </button>
      </div>
    </div>
  );
}
