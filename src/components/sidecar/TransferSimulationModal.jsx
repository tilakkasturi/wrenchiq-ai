/**
 * TransferSimulationModal — "Transfer to <SMS>" confirmation.
 *
 * Shows the payload that will be written to the shop's SMS/DMS (labor +
 * parts lines from every recommendation the advisor has Accepted) and waits
 * for an explicit OK before anything is marked transferred — Cancel (or the
 * X) backs out without touching the RO. Once confirmed, the parent
 * (WrenchIQSidecarScreen) marks these jobs "transferred" and PATCHes the
 * story RO; no separate network call happens here.
 */

import { useState } from "react";
import { X, ArrowRightLeft, Info, Check } from "lucide-react";
import { COLORS } from "../../theme/colors";

export default function TransferSimulationModal({ repairOrderId, acceptedJobs, smsName, onCancel, onConfirm }) {
  const [sending, setSending] = useState(false);
  const jobs = acceptedJobs || [];

  const laborLines = jobs.map((j) => ({
    service:   j.description,
    laborHrs:  j.laborHours ?? null,
    laborCost: j.lineCost || 0,
  }));

  const partLines = jobs.flatMap((j) =>
    (j.parts || []).map((p) => ({ description: p.description, unitPrice: p.lineCost, quantity: 1 }))
  );

  const payload = { repairOrderId, laborLines, partLines };

  async function handleConfirm() {
    setSending(true);
    try {
      await onConfirm();
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      onClick={sending ? undefined : onCancel}
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
            onClick={onCancel}
            disabled={sending}
            title="Close"
            style={{
              background: "transparent", border: "none", cursor: sending ? "default" : "pointer",
              padding: 4, display: "flex", color: "rgba(255,255,255,0.75)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "12px 14px", overflowY: "auto" }}>
          <div style={{
            display: "flex", gap: 7, alignItems: "flex-start",
            fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.5,
            marginBottom: 10, padding: "8px 10px",
            background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)",
            borderRadius: 7,
          }}>
            <Info size={13} color={COLORS.accent} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              The following will be sent to {smsName || "the shop management system"} once you click OK.
              Only the recommendations you've Accepted below are included; part/labor details were
              resolved via WrenchIQ's simulated catalog search at accept time.
            </span>
          </div>

          {jobs.length === 0 ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", padding: "10px 2px" }}>
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

        <div style={{
          display: "flex", justifyContent: "flex-end", gap: 8,
          padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
        }}>
          <button
            onClick={onCancel}
            disabled={sending}
            style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6, padding: "6px 12px", cursor: sending ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={sending || jobs.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: jobs.length === 0 ? "rgba(74,222,128,0.08)" : "rgba(74,222,128,0.18)",
              border: "1px solid rgba(74,222,128,0.4)",
              borderRadius: 6, padding: "6px 12px",
              cursor: sending || jobs.length === 0 ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, color: "#4ADE80",
            }}
          >
            <Check size={13} />
            {sending ? "Sending…" : `OK — Send to ${smsName || "SE"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
