// TechReviewScreen — AE-874
// Technician reviews, edits, and approves the complete 3C document before sending to customer.

import { useState } from "react";
import {
  ArrowLeft, Send, Edit2, GripVertical, CheckCircle,
  AlertTriangle, X, Eye, Clock, FileText,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Constants ─────────────────────────────────────────────────

const TAB_SECTIONS = ["Complaint", "Cause", "Correction", "Recommendations", "History"];

const SECTION_COLORS = {
  Complaint:       "#2563EB",
  Cause:           "#D97706",
  Correction:      "#16A34A",
  Recommendations: "#7C3AED",
  History:         COLORS.textSecondary,
};

function confidenceBadge(confidence) {
  if (confidence >= 0.90) return { label: "AUTO",   bg: "#DCFCE7", color: "#15803D" };
  if (confidence >= 0.70) return { label: "REVIEW", bg: "#FEF3C7", color: "#92400E" };
  return                         { label: "FLAG",   bg: "#FEE2E2", color: "#B91C1C" };
}

// ── Score Ring (SVG) ──────────────────────────────────────────

function ScoreRing({ score, size = 100 }) {
  const r = 36;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (score / 100) * circumference;
  const color = score >= 85 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#F3F4F6" strokeWidth={8} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeDasharray={`${filled} ${circumference - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={800} fill={color}>
        {score}
      </text>
      <text x={cx} y={cy + 13} textAnchor="middle" fontSize={9} fill={COLORS.textMuted} fontWeight={600}>
        PREDII SCORE
      </text>
    </svg>
  );
}

// ── Dimension Bar ─────────────────────────────────────────────

function DimBar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 10, color: COLORS.textSecondary, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color }}>
          {value}<span style={{ fontWeight: 400, color: COLORS.textMuted }}>/{max}</span>
        </span>
      </div>
      <div style={{ height: 5, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.4s" }} />
      </div>
    </div>
  );
}

// ── Sentence Card ─────────────────────────────────────────────

function SentenceCard({
  sentence,
  violations,
  editingId,
  editText,
  onEditStart,
  onEditChange,
  onEditSave,
  onEditCancel,
  onResolve,
}) {
  const badge = confidenceBadge(sentence.confidence ?? 1);
  const myViolations = violations.filter(v => v.sentenceId === sentence.id && !v.resolved);
  const isEditing = editingId === sentence.id;

  return (
    <div style={{
      background: myViolations.length > 0 ? "#FFFBEB" : "#FAFAF8",
      border: `1px solid ${myViolations.length > 0 ? "#FDE68A" : COLORS.border}`,
      borderRadius: 8,
      padding: "10px 12px",
      marginBottom: 8,
      position: "relative",
    }}>
      {/* Top row: source badge, confidence, drag, edit */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        {/* Drag handle */}
        <GripVertical size={14} color={COLORS.textMuted} style={{ cursor: "grab", flexShrink: 0 }} />

        {/* Source reference */}
        {sentence.source && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
            background: "#F3F4F6", color: COLORS.textSecondary,
            borderRadius: 4, padding: "2px 5px",
          }}>
            {sentence.source}
          </span>
        )}

        {/* Confidence badge */}
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 0.4,
          background: badge.bg, color: badge.color,
          borderRadius: 4, padding: "2px 5px",
        }}>
          {badge.label}
        </span>

        {/* Edit button */}
        {!isEditing && (
          <button
            onClick={() => onEditStart(sentence.id, sentence.text)}
            style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
              padding: "3px 8px", border: `1px solid ${COLORS.border}`,
              borderRadius: 5, background: "#fff", cursor: "pointer",
              fontSize: 10, fontWeight: 600, color: COLORS.textSecondary,
            }}
          >
            <Edit2 size={10} /> Edit
          </button>
        )}
      </div>

      {/* Sentence text or inline editor */}
      {isEditing ? (
        <div>
          <textarea
            value={editText}
            onChange={e => onEditChange(e.target.value)}
            rows={3}
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              border: `1px solid ${COLORS.primary}`,
              borderRadius: 6, padding: "7px 10px",
              fontSize: 12, lineHeight: 1.6,
              fontFamily: "inherit", outline: "none",
              color: COLORS.textPrimary, background: "#fff",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button
              onClick={onEditSave}
              style={{
                padding: "4px 10px", borderRadius: 5, border: "none",
                background: COLORS.primary, color: "#fff",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
              }}
            >
              Save
            </button>
            <button
              onClick={onEditCancel}
              style={{
                padding: "4px 10px", borderRadius: 5,
                border: `1px solid ${COLORS.border}`,
                background: "#fff", color: COLORS.textSecondary,
                fontSize: 11, fontWeight: 600, cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: COLORS.textPrimary }}>
          {sentence.text}
        </p>
      )}

      {/* Inline violations */}
      {myViolations.map(v => (
        <div key={v.id} style={{
          marginTop: 8, display: "flex", alignItems: "flex-start", gap: 6,
          background: v.severity === "blocking" ? "#FEF2F2" : "#FFFBEB",
          border: `1px solid ${v.severity === "blocking" ? "#FECACA" : "#FDE68A"}`,
          borderRadius: 6, padding: "6px 8px",
        }}>
          <AlertTriangle size={12} color={v.severity === "blocking" ? COLORS.danger : COLORS.warning} style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: v.severity === "blocking" ? "#991B1B" : "#92400E", flex: 1, lineHeight: 1.4 }}>
            {v.message}
          </span>
          <button
            onClick={() => onResolve(v.id)}
            style={{
              padding: "2px 8px", borderRadius: 4, border: "none",
              background: v.severity === "blocking" ? "#FEE2E2" : "#FEF3C7",
              color: v.severity === "blocking" ? "#991B1B" : "#92400E",
              fontSize: 10, fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}
          >
            Mark Resolved
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Section Tab Content ───────────────────────────────────────

function SectionContent({ tab, document, violations, editingId, editText, onEditStart, onEditChange, onEditSave, onEditCancel, onResolve }) {
  const color = SECTION_COLORS[tab] || COLORS.textSecondary;
  const sentences = (document?.sections?.[tab.toLowerCase()] || document?.sections?.[tab] || []);

  if (tab === "History") {
    const revisions = document?.revisions || [];
    return (
      <div style={{ padding: "16px 0" }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
          textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 14,
        }}>
          Document Revisions
        </div>
        {revisions.length === 0 ? (
          <div style={{ fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" }}>
            No revision history yet.
          </div>
        ) : (
          revisions.map((rev, i) => (
            <div key={i} style={{
              display: "flex", gap: 10, marginBottom: 12,
              paddingBottom: 12,
              borderBottom: i < revisions.length - 1 ? `1px solid ${COLORS.border}` : "none",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14, background: "#F3F4F6",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Clock size={13} color={COLORS.textMuted} />
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>
                  {rev.summary || "Document updated"}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {rev.author || "Technician"} &nbsp;·&nbsp; {rev.timestamp || "—"}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 0" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 14,
      }}>
        <div style={{ width: 4, height: 20, borderRadius: 2, background: color, flexShrink: 0 }} />
        <span style={{
          fontSize: 13, fontWeight: 800, color: COLORS.textPrimary,
          textTransform: "capitalize",
        }}>
          {tab}
        </span>
        <span style={{ fontSize: 11, color: COLORS.textMuted }}>
          {sentences.length} sentence{sentences.length !== 1 ? "s" : ""}
        </span>
      </div>

      {sentences.length === 0 ? (
        <div style={{
          padding: 16, borderRadius: 8,
          border: `1px dashed ${COLORS.border}`,
          fontSize: 12, color: COLORS.textMuted, textAlign: "center",
          fontStyle: "italic",
        }}>
          No content in this section yet.
        </div>
      ) : (
        sentences.map(sentence => (
          <SentenceCard
            key={sentence.id}
            sentence={sentence}
            violations={violations}
            editingId={editingId}
            editText={editText}
            onEditStart={onEditStart}
            onEditChange={onEditChange}
            onEditSave={onEditSave}
            onEditCancel={onEditCancel}
            onResolve={onResolve}
          />
        ))
      )}
    </div>
  );
}

// ── Preview Modal ─────────────────────────────────────────────

function PreviewModal({ document, score, onClose }) {
  const sections = document?.sections || {};
  const sectionKeys = ["complaint", "cause", "correction", "recommendations"];
  const allRefs = [];

  sectionKeys.forEach(key => {
    const sentences = sections[key] || sections[key.charAt(0).toUpperCase() + key.slice(1)] || [];
    sentences.forEach(s => {
      if (s.source && !allRefs.includes(s.source)) allRefs.push(s.source);
    });
  });

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        background: "#fff", borderRadius: 14,
        width: "100%", maxWidth: 640,
        maxHeight: "85vh", display: "flex", flexDirection: "column",
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      }}>
        {/* Modal header */}
        <div style={{
          padding: "16px 20px",
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={16} color={COLORS.primary} />
            <span style={{ fontSize: 14, fontWeight: 800, color: COLORS.textPrimary }}>
              Customer View Preview
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 14, border: "none",
              background: "#F3F4F6", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} color={COLORS.textSecondary} />
          </button>
        </div>

        {/* Modal body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* Vehicle info */}
          {document?.vehicle && (
            <div style={{
              marginBottom: 20, padding: "10px 14px",
              background: "#F9FAFB", borderRadius: 8,
              fontSize: 12, color: COLORS.textSecondary,
            }}>
              <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>
                {document.vehicle.year} {document.vehicle.make} {document.vehicle.model}
              </span>
              {document.vehicle.vin && (
                <span style={{ marginLeft: 8 }}>VIN: {document.vehicle.vin}</span>
              )}
            </div>
          )}

          {/* Sections in plain language */}
          {sectionKeys.map(key => {
            const displayKey = key.charAt(0).toUpperCase() + key.slice(1);
            const sentences = sections[key] || sections[displayKey] || [];
            if (sentences.length === 0) return null;
            const color = SECTION_COLORS[displayKey] || COLORS.textSecondary;
            return (
              <div key={key} style={{ marginBottom: 20 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
                }}>
                  <div style={{ width: 4, height: 16, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: COLORS.textPrimary, textTransform: "capitalize" }}>
                    {displayKey}
                  </span>
                </div>
                <p style={{
                  margin: 0, fontSize: 13, lineHeight: 1.7,
                  color: COLORS.textPrimary,
                }}>
                  {sentences.map(s => s.text).join(" ")}
                </p>
              </div>
            );
          })}

          {/* Reference list */}
          {allRefs.length > 0 && (
            <div style={{
              marginTop: 16, paddingTop: 14,
              borderTop: `1px solid ${COLORS.border}`,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
              }}>
                References
              </div>
              {allRefs.map((ref, i) => (
                <div key={i} style={{
                  fontSize: 11, color: COLORS.textSecondary, marginBottom: 3,
                  display: "flex", gap: 6,
                }}>
                  <span style={{
                    fontWeight: 700, background: "#F3F4F6",
                    borderRadius: 4, padding: "1px 5px",
                    fontSize: 10, color: COLORS.textSecondary,
                  }}>
                    {ref}
                  </span>
                  <span>{document?.references?.[ref] || ref}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal footer — Predii Score */}
        <div style={{
          padding: "12px 20px",
          borderTop: `1px solid ${COLORS.border}`,
          background: "#FAFAF8",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
          borderBottomLeftRadius: 14, borderBottomRightRadius: 14,
        }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>
            Powered by Predii AI &nbsp;·&nbsp; Predii Confidential
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: COLORS.textSecondary }}>Predii Score</span>
            <span style={{
              fontSize: 14, fontWeight: 800,
              color: score >= 85 ? COLORS.success : score >= 60 ? COLORS.warning : COLORS.danger,
            }}>
              {score}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────

export default function TechReviewScreen({
  document,
  violations: violationsProp = [],
  onSendToCustomer,
  onBack,
  minScore = 60,
}) {
  const [activeTab, setActiveTab]         = useState("Complaint");
  const [editingId, setEditingId]         = useState(null);
  const [editText, setEditText]           = useState("");
  const [showPreview, setShowPreview]     = useState(false);
  const [localViolations, setLocalViolations] = useState(() =>
    violationsProp.map(v => ({ ...v, resolved: false }))
  );

  // ── Derived state ──────────────────────────────────────────

  // Editable sentences map — keyed by id
  const [sentenceOverrides, setSentenceOverrides] = useState({});

  function getResolvedSentences(sectionKey) {
    const raw = document?.sections?.[sectionKey] ||
                document?.sections?.[sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)] ||
                [];
    return raw.map(s => sentenceOverrides[s.id] ? { ...s, text: sentenceOverrides[s.id] } : s);
  }

  // Build document view with overrides applied
  const resolvedDocument = document ? {
    ...document,
    sections: Object.fromEntries(
      Object.keys(document.sections || {}).map(k => [k, getResolvedSentences(k)])
    ),
  } : null;

  // Score dimensions
  const allSections = document?.sections || {};
  const complaintSentences = allSections.complaint || allSections.Complaint || [];
  const correctionSentences = allSections.correction || allSections.Correction || [];
  const hasComplaint = complaintSentences.length > 0;
  const hasCorrection = correctionSentences.length > 0;

  const unresolvedViolations = localViolations.filter(v => !v.resolved);
  const blockingUnresolved   = unresolvedViolations.filter(v => v.severity === "blocking");

  const score = document?.score ?? 0;

  // Dimension scores
  const sourceCoverage     = document?.dimensions?.sourceCoverage     ?? Math.round(score * 0.40);
  const factualCompliance  = document?.dimensions?.factualCompliance  ?? Math.round(score * 0.40);
  const completeness       = document?.dimensions?.completeness       ?? Math.round(score * 0.20);

  const canSend = (
    blockingUnresolved.length === 0 &&
    hasComplaint &&
    hasCorrection &&
    score >= minScore
  );

  // ── Handlers ───────────────────────────────────────────────

  function handleEditStart(id, text) {
    setEditingId(id);
    setEditText(text);
  }

  function handleEditSave() {
    if (editingId && editText.trim()) {
      setSentenceOverrides(prev => ({ ...prev, [editingId]: editText.trim() }));
    }
    setEditingId(null);
    setEditText("");
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditText("");
  }

  function handleResolve(violationId) {
    setLocalViolations(prev =>
      prev.map(v => v.id === violationId ? { ...v, resolved: true } : v)
    );
  }

  const ro    = document?.roId    || "—";
  const ymme  = document?.vehicle
    ? [
        document.vehicle.year,
        document.vehicle.make,
        document.vehicle.model,
        document.vehicle.engine || document.vehicle.trim,
      ].filter(Boolean).join(" ")
    : "—";

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100%", overflow: "hidden",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Header bar ── */}
      <div style={{
        background: COLORS.primary,
        padding: "0 20px",
        height: 52,
        display: "flex", alignItems: "center", gap: 14,
        flexShrink: 0,
      }}>
        {/* Back */}
        <button
          onClick={onBack}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "rgba(255,255,255,0.12)", border: "none",
            borderRadius: 7, padding: "5px 10px",
            cursor: "pointer", color: "#fff", fontSize: 12, fontWeight: 600,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Title */}
        <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>
          Tech Review
        </span>

        {/* RO ID */}
        <span style={{
          fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)",
          background: "rgba(255,255,255,0.10)",
          borderRadius: 5, padding: "3px 8px",
          fontFamily: "monospace",
        }}>
          {ro}
        </span>

        {/* YMME */}
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
          {ymme}
        </span>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Send to Customer */}
        <button
          onClick={canSend ? onSendToCustomer : undefined}
          disabled={!canSend}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "8px 16px", borderRadius: 8, border: "none",
            cursor: canSend ? "pointer" : "not-allowed",
            background: canSend ? COLORS.accent : "#6B7280",
            color: "#fff",
            fontSize: 13, fontWeight: 700,
            transition: "background 0.15s",
          }}
        >
          <Send size={14} />
          Send to Customer
        </button>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── Left panel ── */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          overflow: "hidden", minWidth: 0,
        }}>
          {/* Tab bar */}
          <div style={{
            display: "flex", alignItems: "center", gap: 2,
            padding: "10px 20px 0",
            borderBottom: `1px solid ${COLORS.border}`,
            background: "#fff",
            flexShrink: 0,
          }}>
            {TAB_SECTIONS.map(tab => {
              const isActive = tab === activeTab;
              const color = SECTION_COLORS[tab] || COLORS.textSecondary;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: "7px 14px",
                    border: "none", borderRadius: "6px 6px 0 0",
                    cursor: "pointer",
                    background: isActive ? COLORS.bg : "transparent",
                    color: isActive ? color : COLORS.textSecondary,
                    fontWeight: isActive ? 800 : 500,
                    fontSize: 12,
                    borderBottom: isActive ? `2px solid ${color}` : "2px solid transparent",
                    transition: "all 0.12s",
                  }}
                >
                  {tab}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
            <SectionContent
              tab={activeTab}
              document={resolvedDocument}
              violations={localViolations}
              editingId={editingId}
              editText={editText}
              onEditStart={handleEditStart}
              onEditChange={setEditText}
              onEditSave={handleEditSave}
              onEditCancel={handleEditCancel}
              onResolve={handleResolve}
            />
          </div>
        </div>

        {/* ── Right score panel ── */}
        <div style={{
          width: 240, flexShrink: 0,
          background: "#fff",
          borderLeft: `1px solid ${COLORS.border}`,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 20px" }}>

            {/* Score ring */}
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              marginBottom: 18,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
              }}>
                Predii Score
              </div>
              <ScoreRing score={score} size={110} />
            </div>

            {/* Dimension bars */}
            <div style={{ marginBottom: 18 }}>
              <DimBar
                label="Source Coverage"
                value={sourceCoverage}
                max={40}
                color={COLORS.success}
              />
              <DimBar
                label="Factual Compliance"
                value={factualCompliance}
                max={40}
                color={COLORS.warning}
              />
              <DimBar
                label="Completeness"
                value={completeness}
                max={20}
                color="#7C3AED"
              />
            </div>

            {/* Violations */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: COLORS.textSecondary,
                textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8,
              }}>
                Violations
              </div>

              {localViolations.length === 0 ? (
                <div style={{
                  fontSize: 11, color: COLORS.success,
                  display: "flex", alignItems: "center", gap: 5,
                }}>
                  <CheckCircle size={12} /> No violations
                </div>
              ) : (
                localViolations.map(v => (
                  <div key={v.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 7,
                    marginBottom: 8,
                  }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 3,
                      background: v.severity === "blocking" ? COLORS.danger : COLORS.warning,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, color: v.resolved ? COLORS.textMuted : COLORS.textPrimary,
                        fontWeight: v.resolved ? 400 : 600,
                        lineHeight: 1.4,
                        textDecoration: v.resolved ? "line-through" : "none",
                      }}>
                        {v.name || v.message}
                      </div>
                    </div>
                    {v.resolved && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, letterSpacing: 0.3,
                        background: "#DCFCE7", color: "#15803D",
                        borderRadius: 4, padding: "2px 5px", flexShrink: 0,
                      }}>
                        Resolved
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Preview button */}
            <button
              onClick={() => setShowPreview(true)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "9px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`,
                background: "#F9FAFB", cursor: "pointer",
                fontSize: 12, fontWeight: 700, color: COLORS.primary,
                transition: "background 0.12s",
              }}
            >
              <Eye size={13} />
              Preview Customer View
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview modal ── */}
      {showPreview && (
        <PreviewModal
          document={resolvedDocument}
          score={score}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
