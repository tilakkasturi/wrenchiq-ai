// TechDVIScreen.jsx — AE-780, AE-781
// Full-screen 8-point DVI inspection workflow with AI suggestions

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Camera, Mic, Sparkles, CheckCircle, Video, X, Clock } from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Inspection Data ────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: "tires",
    label: "Tires",
    items: [
      {
        id: "tread",
        name: "Tire tread depth (LF, RF, LR, RR)",
        detail: "LR reading 3/32\" — approaching wear limit",
        defaultStatus: "WATCH",
        aiSuggestion: null,
      },
      { id: "pressure", name: "Tire pressure", detail: "All 4 at spec (35 PSI)", defaultStatus: "YES", aiSuggestion: null },
      { id: "wheels", name: "Wheel condition", detail: "No cracks or damage observed", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
  {
    id: "brakes",
    label: "Brakes",
    items: [
      {
        id: "front_pads",
        name: "Front brake pads",
        detail: "2mm — below minimum (3mm)",
        defaultStatus: "NO",
        aiSuggestion: {
          code: "B001",
          description: "Brake Pad Replacement",
          parts: "Front brake pads (D1296-8366) · $85/axle",
          time: "1.2 hrs",
        },
      },
      {
        id: "rear_pads",
        name: "Rear brake pads",
        detail: "4mm — monitor at next service",
        defaultStatus: "WATCH",
        aiSuggestion: null,
      },
      { id: "brake_fluid", name: "Brake fluid", detail: "Clear, at full level", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
  {
    id: "suspension",
    label: "Suspension",
    items: [
      { id: "ball_joints", name: "Ball joints", detail: "No play, no noise", defaultStatus: "YES", aiSuggestion: null },
      {
        id: "shocks",
        name: "Shock absorbers",
        detail: "Minor seep rear-left — monitor",
        defaultStatus: "WATCH",
        aiSuggestion: null,
      },
    ],
  },
  {
    id: "fluids",
    label: "Fluids",
    items: [
      { id: "engine_oil", name: "Engine oil", detail: "Full, clean", defaultStatus: "YES", aiSuggestion: null },
      { id: "coolant", name: "Coolant", detail: "At min/max, correct color", defaultStatus: "YES", aiSuggestion: null },
      {
        id: "trans_fluid",
        name: "Transmission fluid",
        detail: "Dark color — recommend service",
        defaultStatus: "WATCH",
        aiSuggestion: null,
      },
      {
        id: "air_filter",
        name: "Engine air filter",
        detail: "Heavy debris, severely restricted",
        defaultStatus: "NO",
        aiSuggestion: {
          code: "F201",
          description: "Engine Air Filter Replacement",
          parts: "OEM air filter (17220-5AA-A00) · $28",
          time: "0.2 hrs",
        },
      },
    ],
  },
  {
    id: "belts",
    label: "Belts",
    items: [
      {
        id: "serp_belt",
        name: "Serpentine belt",
        detail: "Cracking visible on 3 ribs",
        defaultStatus: "NO",
        aiSuggestion: {
          code: "E301",
          description: "Serpentine Belt Replacement",
          parts: "Gates K060882 serpentine belt · $45",
          time: "0.8 hrs",
        },
      },
      { id: "rad_hoses", name: "Radiator hoses", detail: "Pliable, no cracks or bulging", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
  {
    id: "battery",
    label: "Battery",
    items: [
      { id: "battery", name: "Battery", detail: "CCA 520 / 550 rated — good", defaultStatus: "YES", aiSuggestion: null },
      { id: "alternator", name: "Alternator output", detail: "14.2V at idle — normal", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
  {
    id: "lights",
    label: "Lights",
    items: [
      { id: "headlights", name: "Headlights", detail: "Both functional, properly aimed", defaultStatus: "YES", aiSuggestion: null },
      {
        id: "wipers",
        name: "Wiper blades",
        detail: "Streaking on passenger side",
        defaultStatus: "WATCH",
        aiSuggestion: null,
      },
      { id: "brake_lights", name: "Brake lights", detail: "All 3 functional", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
  {
    id: "engine",
    label: "Engine",
    items: [
      { id: "oil_leaks", name: "Engine oil leaks", detail: "No leaks observed", defaultStatus: "YES", aiSuggestion: null },
      { id: "exhaust", name: "Exhaust", detail: "No smoke, no leaks, quiet", defaultStatus: "YES", aiSuggestion: null },
    ],
  },
];

// Build initial state from defaults
function buildInitialState() {
  const state = {};
  SECTIONS.forEach((sec) => {
    sec.items.forEach((item) => {
      state[item.id] = item.defaultStatus;
    });
  });
  return state;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusButton({ label, color, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 60,
        height: 44,
        borderRadius: 8,
        border: `2px solid ${color}`,
        background: active ? color : "transparent",
        color: active ? "#fff" : color,
        fontSize: 13,
        fontWeight: 700,
        cursor: "pointer",
        letterSpacing: "0.04em",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function AISuggestionCard({ suggestion, itemId, accepted, onAccept, onSkip }) {
  if (!suggestion) return null;

  return (
    <div
      style={{
        background: "#FFF5F5",
        borderLeft: `4px solid ${COLORS.accent}`,
        borderRadius: "0 10px 10px 0",
        padding: "14px 16px",
        marginTop: 6,
        marginLeft: 24,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <Sparkles size={15} color={COLORS.accent} />
        <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>AI Suggestion</span>
      </div>

      <div style={{ fontSize: 13, color: COLORS.textPrimary, marginBottom: 4 }}>
        <strong>{suggestion.code}</strong> — {suggestion.description}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>
        Parts: {suggestion.parts}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12 }}>
        <Clock size={12} color={COLORS.textMuted} />
        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Estimated time: {suggestion.time}</span>
      </div>

      {!accepted ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onAccept}
            style={{
              padding: "8px 14px",
              background: COLORS.success,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Accept → Push to Advisor
          </button>
          <button
            onClick={onSkip}
            style={{
              padding: "8px 14px",
              background: "transparent",
              color: COLORS.textSecondary,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Skip
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CheckCircle size={15} color={COLORS.success} />
          <span style={{ fontSize: 13, color: COLORS.success, fontWeight: 600 }}>
            Sent to advisor upsell queue
          </span>
        </div>
      )}
    </div>
  );
}

function InspectionItem({ item, status, onStatusChange, accepted, onAccept, onSkip }) {
  const showSuggestion = status === "NO" && item.aiSuggestion;

  return (
    <div
      style={{
        background: COLORS.bgCard,
        borderRadius: 10,
        border: `1px solid ${COLORS.border}`,
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Item name + detail */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary }}>{item.name}</div>
            {item.detail && (
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>{item.detail}</div>
            )}
          </div>

          {/* Photo + voice buttons */}
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bgCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Add photo"
          >
            <Camera size={15} color={COLORS.textMuted} />
          </button>
          <button
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              border: `1px solid ${COLORS.border}`,
              background: COLORS.bgCard,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
            title="Voice note"
          >
            <Mic size={15} color={COLORS.textMuted} />
          </button>

          {/* YES / WATCH / NO buttons */}
          <div style={{ display: "flex", gap: 6 }}>
            <StatusButton
              label="YES"
              color={COLORS.success}
              active={status === "YES"}
              onClick={() => onStatusChange(item.id, "YES")}
            />
            <StatusButton
              label="WATCH"
              color={COLORS.warning}
              active={status === "WATCH"}
              onClick={() => onStatusChange(item.id, "WATCH")}
            />
            <StatusButton
              label="NO"
              color={COLORS.danger}
              active={status === "NO"}
              onClick={() => onStatusChange(item.id, "NO")}
            />
          </div>
        </div>
      </div>

      {showSuggestion && (
        <div style={{ padding: "0 16px 14px 16px" }}>
          <AISuggestionCard
            suggestion={item.aiSuggestion}
            itemId={item.id}
            accepted={accepted}
            onAccept={onAccept}
            onSkip={onSkip}
          />
        </div>
      )}
    </div>
  );
}

// ─── Video Walkaround Modal ──────────────────────────────────────────────────

function VideoModal({ onClose }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saved, setSaved] = useState(false);
  const intervalRef = useRef(null);

  const startRecording = () => {
    setRecording(true);
    setSeconds(0);
    intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  };

  const stopRecording = () => {
    clearInterval(intervalRef.current);
    setRecording(false);
    setSaved(true);
  };

  useEffect(() => {
    startRecording();
    return () => clearInterval(intervalRef.current);
  }, []);

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.88)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          background: "rgba(255,255,255,0.1)",
          border: "none",
          borderRadius: 8,
          padding: 10,
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <X size={20} color="#fff" />
      </button>

      {saved ? (
        <div style={{ textAlign: "center" }}>
          <CheckCircle size={56} color={COLORS.success} />
          <div style={{ color: "#fff", fontSize: 20, fontWeight: 700, marginTop: 16 }}>
            Video saved to RO
          </div>
          <div style={{ color: "#aaa", fontSize: 15, marginTop: 8 }}>0:47 walkaround · RO-2024-1189</div>
          <button
            onClick={onClose}
            style={{
              marginTop: 24,
              padding: "12px 32px",
              background: COLORS.accent,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Done
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: "50%",
              background: recording ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.1)",
              border: `3px solid ${recording ? COLORS.danger : "#555"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Video size={40} color={recording ? COLORS.danger : "#aaa"} />
          </div>

          <div style={{ color: "#fff", fontSize: 32, fontWeight: 700, fontFamily: "monospace" }}>
            {recording ? `Recording ${fmt(seconds)}` : "Ready"}
          </div>

          {recording && (
            <button
              onClick={stopRecording}
              style={{
                padding: "14px 36px",
                background: COLORS.danger,
                color: "#fff",
                border: "none",
                borderRadius: 12,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Stop & Save
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Complete Inspection Modal ───────────────────────────────────────────────

function CompleteModal({ flaggedCount, pushedCount, onSubmit, onClose }) {
  const [laborTime, setLaborTime] = useState("1.5");
  const [bayCleared, setBayCleared] = useState(false);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
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
          padding: 32,
          width: 420,
          boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <CheckCircle size={28} color={COLORS.success} />
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>
            Inspection Complete
          </h2>
        </div>

        <div
          style={{
            background: COLORS.bg,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 20,
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.7,
          }}
        >
          <div>
            <strong style={{ color: COLORS.textPrimary }}>8/11</strong> items checked
          </div>
          <div>
            <strong style={{ color: COLORS.danger }}>{flaggedCount}</strong> flagged
          </div>
          <div>
            <strong style={{ color: COLORS.success }}>{pushedCount}</strong> pushed to advisor
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
            Actual labor time (hrs)
          </label>
          <input
            type="text"
            value={laborTime}
            onChange={(e) => setLaborTime(e.target.value)}
            style={{
              width: "100%",
              height: 42,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "0 12px",
              fontSize: 15,
              color: COLORS.textPrimary,
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <input
            type="checkbox"
            id="bay-clear"
            checked={bayCleared}
            onChange={(e) => setBayCleared(e.target.checked)}
            style={{ width: 18, height: 18, cursor: "pointer", accentColor: COLORS.primary }}
          />
          <label htmlFor="bay-clear" style={{ fontSize: 14, color: COLORS.textPrimary, cursor: "pointer" }}>
            Mark Bay 3 as clear
          </label>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              height: 46,
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            style={{
              flex: 2,
              height: 46,
              background: COLORS.accent,
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Submit Inspection
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: "50%",
        transform: "translateX(-50%)",
        background: COLORS.primary,
        color: "#fff",
        padding: "12px 24px",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        zIndex: 2000,
        boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
        whiteSpace: "nowrap",
      }}
    >
      {message}
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const DEFAULT_RO = {
  rONumber: "RO-2024-1189",
  vehicle: "2019 Honda CR-V",
  customer: "David Kim",
};

export default function TechDVIScreen({ roData = DEFAULT_RO, onComplete, onBack }) {
  const ro = roData || DEFAULT_RO;

  const [activeSection, setActiveSection] = useState("tires");
  const [statuses, setStatuses] = useState(buildInitialState());
  const [acceptedSuggestions, setAcceptedSuggestions] = useState({});
  const [skippedSuggestions, setSkippedSuggestions] = useState({});
  const [showVideo, setShowVideo] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleStatusChange = (itemId, status) => {
    setStatuses((prev) => ({ ...prev, [itemId]: status }));
  };

  const handleAccept = (itemId) => {
    setAcceptedSuggestions((prev) => ({ ...prev, [itemId]: true }));
    setToast("Sent to advisor upsell queue");
  };

  const handleSkip = (itemId) => {
    setSkippedSuggestions((prev) => ({ ...prev, [itemId]: true }));
  };

  const flaggedCount = Object.values(statuses).filter((s) => s === "NO").length;
  const pushedCount = Object.keys(acceptedSuggestions).length;

  // Total items across all sections
  const totalItems = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);

  // Progress: items that are not default (touched)
  const touchedItems = Object.values(statuses).filter((s) => s !== null).length;
  const progressPct = Math.round((touchedItems / totalItems) * 100);

  const currentSection = SECTIONS.find((s) => s.id === activeSection);

  const handleSubmit = () => {
    setShowComplete(false);
    setSubmitted(true);
    setToast("Inspection submitted successfully");
    if (onComplete) onComplete({ statuses, acceptedSuggestions });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, position: "relative" }}>
      {/* ── Header ── */}
      <div
        style={{
          background: COLORS.primary,
          color: "#fff",
          padding: "0 20px",
          height: 64,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "none",
            borderRadius: 8,
            padding: 8,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <ArrowLeft size={18} color="#fff" />
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: "monospace", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
              {ro.rONumber}
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ fontSize: 15, fontWeight: 700 }}>{ro.vehicle}</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>·</span>
            <span style={{ fontSize: 14, color: "rgba(255,255,255,0.8)" }}>{ro.customer}</span>
          </div>
        </div>

        {/* Flagged counter */}
        {flaggedCount > 0 && (
          <div
            style={{
              background: COLORS.danger,
              color: "#fff",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {flaggedCount} flagged
          </div>
        )}

        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 80,
              height: 6,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 3,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: COLORS.accent,
                borderRadius: 3,
                transition: "width 0.3s",
              }}
            />
          </div>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{progressPct}%</span>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div
        style={{
          background: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          display: "flex",
          overflowX: "auto",
          flexShrink: 0,
          padding: "0 16px",
          scrollbarWidth: "none",
        }}
      >
        {SECTIONS.map((sec) => {
          const sectionFlagged = sec.items.some((item) => statuses[item.id] === "NO");
          const isActive = sec.id === activeSection;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                padding: "0 16px",
                height: 44,
                border: "none",
                borderBottom: isActive ? `3px solid ${COLORS.accent}` : "3px solid transparent",
                background: "transparent",
                color: isActive ? COLORS.accent : COLORS.textSecondary,
                fontSize: 14,
                fontWeight: isActive ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
              }}
            >
              {sec.label}
              {sectionFlagged && (
                <span
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 4,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: COLORS.danger,
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Items ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
        }}
      >
        {currentSection && (
          <div>
            <h3
              style={{
                margin: "0 0 14px 0",
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.textPrimary,
              }}
            >
              {currentSection.label}
            </h3>
            {currentSection.items.map((item) => (
              <InspectionItem
                key={item.id}
                item={item}
                status={statuses[item.id]}
                onStatusChange={handleStatusChange}
                accepted={!!acceptedSuggestions[item.id]}
                onAccept={() => handleAccept(item.id)}
                onSkip={() => handleSkip(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Bottom action bar ── */}
      <div
        style={{
          background: COLORS.bgCard,
          borderTop: `1px solid ${COLORS.border}`,
          padding: "12px 20px",
          display: "flex",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setShowVideo(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 20px",
            height: 48,
            background: COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Video size={16} />
          Record Walkaround
        </button>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowComplete(true)}
          style={{
            padding: "0 28px",
            height: 48,
            background: COLORS.accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Complete Inspection
        </button>
      </div>

      {/* ── Modals & overlays ── */}
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {showComplete && (
        <CompleteModal
          flaggedCount={flaggedCount}
          pushedCount={pushedCount}
          onSubmit={handleSubmit}
          onClose={() => setShowComplete(false)}
        />
      )}

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
