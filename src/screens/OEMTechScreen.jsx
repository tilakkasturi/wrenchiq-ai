import { useState } from "react";
import {
  Hammer,
  Mic,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Car,
  Hash,
  Wrench,
  Shield,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_TECH_JOBS, OEM_DEALER, OP_CODES } from "../data/oemDemoData";

// ── Helpers ──────────────────────────────────────────────────
const DTC_DESCRIPTIONS = {
  P0171: "System Too Lean — Bank 1",
  P0420: "Catalyst System Efficiency Below Threshold — Bank 1",
  P0301: "Cylinder 1 Misfire Detected",
  P0300: "Random / Multiple Cylinder Misfire Detected",
};

const JOB_STATUSES = ["In Diagnosis", "Repair In Progress", "Complete"];

function statusConfig(status) {
  switch (status) {
    case "In Diagnosis":
      return { bg: "#FEF3C7", color: "#92400E", dot: COLORS.warning };
    case "Repair In Progress":
      return { bg: "#EFF6FF", color: "#1D4ED8", dot: "#3B82F6" };
    case "Complete":
      return { bg: "#F0FDF4", color: "#15803D", dot: COLORS.success };
    default:
      return { bg: COLORS.borderLight, color: COLORS.textSecondary, dot: COLORS.textMuted };
  }
}

function StatusBadge({ status }) {
  const c = statusConfig(status);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.color,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
          display: "inline-block",
        }}
      />
      {status}
    </span>
  );
}

function WarrantyBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#EFF6FF",
        color: "#1D4ED8",
        borderRadius: 12,
        padding: "2px 8px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <Shield size={10} /> WARRANTY
    </span>
  );
}

// ── Job List Item ─────────────────────────────────────────────
function JobListItem({ job, selected, onClick }) {
  const c = statusConfig(job.status);
  return (
    <div
      onClick={onClick}
      style={{
        minHeight: 70,
        padding: "12px 16px",
        borderBottom: `1px solid ${COLORS.border}`,
        cursor: "pointer",
        background: selected ? "#F0F7F9" : COLORS.bgCard,
        borderLeft: selected ? `3px solid ${COLORS.primary}` : "3px solid transparent",
        display: "flex",
        flexDirection: "column",
        gap: 5,
        transition: "background 0.15s",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.primary, fontFamily: "monospace" }}>
          {job.roId}
        </span>
        <StatusBadge status={job.status} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
        {job.year} {job.make} {job.model}
      </div>
      <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{job.customer}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <span
          style={{
            fontSize: 11,
            color: COLORS.textMuted,
            background: COLORS.borderLight,
            borderRadius: 4,
            padding: "1px 6px",
          }}
        >
          {job.bay}
        </span>
        {job.dtcs.length > 0 && (
          <span
            style={{
              fontSize: 11,
              color: COLORS.warning,
              background: "#FEF3C7",
              borderRadius: 4,
              padding: "1px 6px",
              fontWeight: 600,
            }}
          >
            {job.dtcs.length} DTC{job.dtcs.length > 1 ? "s" : ""}
          </span>
        )}
        {job.isWarranty && (
          <span
            style={{
              fontSize: 10,
              color: "#1D4ED8",
              background: "#EFF6FF",
              borderRadius: 4,
              padding: "1px 6px",
              fontWeight: 700,
            }}
          >
            W
          </span>
        )}
      </div>
    </div>
  );
}

// ── Confidence Bar ────────────────────────────────────────────
function ConfidenceBar({ pct }) {
  const color = pct >= 90 ? COLORS.success : pct >= 75 ? COLORS.warning : COLORS.danger;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: COLORS.borderLight,
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 30, textAlign: "right" }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Job Detail Panel ──────────────────────────────────────────
function JobDetail({ job, onStatusChange }) {
  const [warrantyFlagged, setWarrantyFlagged] = useState(job.isWarranty);
  const [warrantySent, setWarrantySent] = useState(false);
  const [recording, setRecording] = useState(false);

  const opCodeEntry = OP_CODES.Toyota.find((o) => o.code === job.suggestedOpCode);

  function handleWarrantyToggle() {
    const next = !warrantyFlagged;
    setWarrantyFlagged(next);
    if (next) {
      setTimeout(() => setWarrantySent(true), 800);
    } else {
      setWarrantySent(false);
    }
  }

  return (
    <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
      {/* Vehicle header */}
      <div
        style={{
          background: COLORS.primary,
          borderRadius: 12,
          padding: "16px 20px",
          marginBottom: 20,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Car size={16} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              {job.year} {job.make} {job.model}
            </span>
          </div>
          {job.isWarranty && <WarrantyBadge />}
        </div>
        <div
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.05em",
          }}
        >
          VIN: {job.vin}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
          {job.customer} · {job.bay}
        </div>
      </div>

      {/* Customer concern */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
          Customer Concern
        </div>
        <div style={{ fontSize: 14, color: COLORS.textPrimary, lineHeight: 1.5 }}>{job.concern}</div>
      </div>

      {/* TSB Matches */}
      {job.tsbs.length > 0 && (
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            TSB Matches
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {job.tsbs.map((tsb) => (
              <div key={tsb.number}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <div>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLORS.primary,
                        marginRight: 8,
                      }}
                    >
                      TSB #{tsb.number}
                    </span>
                    <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{tsb.title}</span>
                  </div>
                  <button
                    style={{
                      background: "none",
                      border: `1px solid ${COLORS.primary}`,
                      color: COLORS.primary,
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      marginLeft: 8,
                    }}
                  >
                    View TSB
                  </button>
                </div>
                <ConfidenceBar pct={tsb.confidence} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DTC Codes */}
      {job.dtcs.length > 0 && (
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            DTC Codes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {job.dtcs.map((dtc) => (
              <div
                key={dtc}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    background: "#FEF3C7",
                    color: "#92400E",
                    borderRadius: 6,
                    padding: "4px 10px",
                    fontFamily: "monospace",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {dtc}
                </span>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
                  {DTC_DESCRIPTIONS[dtc] || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Op Code Lookup */}
      {opCodeEntry && (
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 10,
            padding: "14px 16px",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
            Op Code Lookup
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 16,
                fontWeight: 700,
                color: COLORS.accent,
              }}
            >
              {opCodeEntry.code}
            </span>
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{opCodeEntry.description}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
            Flat Rate: <strong style={{ color: COLORS.textPrimary }}>{opCodeEntry.flatRateHrs} hrs</strong>
            {opCodeEntry.preAuthThreshold && (
              <span style={{ marginLeft: 12, color: COLORS.danger }}>
                Pre-auth required &gt;${opCodeEntry.preAuthThreshold}
              </span>
            )}
          </div>
          <button
            style={{
              background: COLORS.success,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Confirm Op Code
          </button>
        </div>
      )}

      {/* Warranty Claim Flag */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${warrantyFlagged ? "#BFDBFE" : COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Warranty Claim
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Shield size={15} color={warrantyFlagged ? "#1D4ED8" : COLORS.textMuted} />
            <span style={{ fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>
              Mark as Warranty Applicable
            </span>
          </div>
          <button
            onClick={handleWarrantyToggle}
            style={{
              width: 44,
              height: 24,
              borderRadius: 12,
              border: "none",
              background: warrantyFlagged ? "#1D4ED8" : COLORS.border,
              position: "relative",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 3,
                left: warrantyFlagged ? 23 : 3,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
              }}
            />
          </button>
        </div>
        {warrantySent && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#DCFCE7",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "#15803D",
              fontWeight: 600,
            }}
          >
            <CheckCircle size={13} /> Warranty flag sent to advisor
          </div>
        )}
      </div>

      {/* Voice Note */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Voice Note
        </div>
        <button
          onClick={() => setRecording((r) => !r)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            background: recording ? COLORS.danger : COLORS.accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "14px 0",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
            animation: recording ? "pulse 1.2s infinite" : "none",
          }}
        >
          <Mic size={18} />
          {recording ? "Recording… tap to stop" : "Record Diagnostic Note"}
        </button>
        {recording && (
          <div
            style={{
              marginTop: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: COLORS.danger,
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: COLORS.danger,
                display: "inline-block",
              }}
            />
            Live — recording in progress
          </div>
        )}
      </div>

      {/* Job Status Selector */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "14px 16px",
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
          Job Status
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {JOB_STATUSES.map((s) => {
            const c = statusConfig(s);
            const active = job.status === s;
            return (
              <button
                key={s}
                style={{
                  background: active ? c.bg : COLORS.bgCard,
                  color: active ? c.color : COLORS.textSecondary,
                  border: `1px solid ${active ? c.dot : COLORS.border}`,
                  borderRadius: 20,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function OEMTechScreen() {
  const [selectedJobId, setSelectedJobId] = useState(OEM_TECH_JOBS[0]?.id || null);

  const selectedJob = OEM_TECH_JOBS.find((j) => j.id === selectedJobId) || null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: COLORS.bg,
      }}
    >
      {/* Top bar */}
      <div
        style={{
          background: COLORS.primary,
          padding: "14px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              background: "rgba(255,255,255,0.15)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Hammer size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>Marcus Williams · Toyota Master</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>Bay 4 Active · {OEM_TECH_JOBS.length} Jobs Today</div>
          </div>
        </div>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,255,255,0.15)",
            color: "#fff",
            borderRadius: 20,
            padding: "4px 12px",
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          edition=OEM
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left: Job list */}
        <div
          style={{
            width: 280,
            flexShrink: 0,
            borderRight: `1px solid ${COLORS.border}`,
            overflowY: "auto",
            background: COLORS.bgCard,
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              borderBottom: `1px solid ${COLORS.border}`,
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              background: COLORS.borderLight,
            }}
          >
            Today's Jobs
          </div>
          {OEM_TECH_JOBS.map((job) => (
            <JobListItem
              key={job.id}
              job={job}
              selected={job.id === selectedJobId}
              onClick={() => setSelectedJobId(job.id)}
            />
          ))}
        </div>

        {/* Right: Job detail */}
        <div style={{ flex: 1, overflowY: "auto", background: COLORS.bg }}>
          {selectedJob ? (
            <JobDetail job={selectedJob} />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: COLORS.textMuted,
                fontSize: 14,
              }}
            >
              Select a job to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
