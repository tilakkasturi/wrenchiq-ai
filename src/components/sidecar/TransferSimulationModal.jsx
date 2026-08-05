/**
 * TransferSimulationModal — "Transfer to <SMS>" simulation.
 *
 * Renders a pop-up showing the JSON payload that *would* be written to the
 * shop's real SMS/DMS if a live write-back existed — no network call is
 * made. Only covers recommendations the advisor has explicitly Accepted
 * (ServiceRecommendationCard's accept flow) — each accepted job already
 * carries a resolved part number/labor time from that flow's simulated
 * catalog match, so this payload is the same repairJobs-shaped data that
 * was already appended to the story RO, not a fresh guess.
 */

import { X, ArrowRightLeft, Info } from "lucide-react";
import { COLORS } from "../../theme/colors";

export default function TransferSimulationModal({ repairOrderId, acceptedJobs, smsName, onClose }) {
  const jobs = acceptedJobs || [];

  const laborLines = jobs.map((j) => ({
    service:   j.description,
    laborHrs:  j.laborHours ?? null,
    laborCost: j.lineCost - (j.parts || []).reduce((s, p) => s + (p.lineCost || 0), 0),
  }));

  const partLines = jobs.flatMap((j) =>
    (j.parts || []).map((p) => ({ description: p.description, unitPrice: p.lineCost, quantity: 1 }))
  );

  const payload = { repairOrderId, laborLines, partLines };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 420, maxHeight: "80vh",
          display: "flex", flexDirection: "column",
          background: COLORS.navyMid,
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
          boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
          overflow: "hidden",
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
        }}>
          <ArrowRightLeft size={14} color={COLORS.accent} />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", flex: 1 }}>
            Transfer to {smsName || "SE"} — Simulation
          </span>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, display: "flex", color: "rgba(255,255,255,0.5)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "12px 14px", overflowY: "auto" }}>
          <div style={{
            display: "flex", gap: 7, alignItems: "flex-start",
            fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.5,
            marginBottom: 10, padding: "8px 10px",
            background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: 7,
          }}>
            <Info size={13} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              This is a simulation — no write to {smsName || "the shop management system"} happens yet.
              Only the recommendations you've Accepted below are included; part/labor details were
              resolved via WrenchIQ's simulated catalog search at accept time.
            </span>
          </div>

          {jobs.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", padding: "10px 2px" }}>
              No recommendations accepted yet — click Accept on one below, then transfer.
            </div>
          ) : (
            <pre style={{
              margin: 0, fontSize: 11, lineHeight: 1.5, color: "#86EFAC",
              background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8, padding: "10px 12px", overflowX: "auto",
              fontFamily: "monospace", whiteSpace: "pre",
            }}>
              {JSON.stringify(payload, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
