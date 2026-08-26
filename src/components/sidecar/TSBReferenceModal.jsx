/**
 * TSBReferenceModal — "View bulletin" popup for a TSB-category Service
 * Recommendation.
 *
 * Shows the full bulletin WrenchIQ actually pulled via get_tsbs (not just the
 * prose summary the LLM saw folded together), with the repair job the agent
 * extracted from it called out on its own so an advisor can eyeball whether
 * the extraction matches what the bulletin says. Curated demo bulletins
 * (src/data/tsbData.js) have no real external document, so no link is
 * fabricated for them; live NHTSA-sourced bulletins carry a real pdfUrl
 * (nhtsaTsbService.js) and get an "Open NHTSA document" link that opens in
 * the system browser via openExternalUrl, never navigated to in-app.
 */

import { X, FileText, ExternalLink, Sparkles } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { openExternalUrl } from "../../services/externalLink";

export default function TSBReferenceModal({ tsbRef, rec, onClose }) {
  const isCurated = /^[A-Za-z]/.test(tsbRef?.tsbNumber || "");

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
          width: "100%", maxWidth: 440, maxHeight: "80vh",
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
          <FileText size={14} color="#F0ABFC" />
          <span style={{ fontSize: 13, fontWeight: 800, color: "#fff", flex: 1 }}>
            TSB {tsbRef?.tsbNumber || rec?.tsbNumber}
          </span>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              padding: 4, display: "flex", color: "rgba(255,255,255,0.75)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: "12px 14px", overflowY: "auto" }}>
          {!tsbRef ? (
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
              No bulletin data was returned for this recommendation's TSB number.
            </div>
          ) : (
            <>
              {(tsbRef.component || tsbRef.dateCommunicationSent) && (
                <div style={{ display: "flex", gap: 10, fontSize: 10.5, color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>
                  {tsbRef.component && <span>Component: {tsbRef.component}</span>}
                  {tsbRef.dateCommunicationSent && <span>Issued: {tsbRef.dateCommunicationSent}</span>}
                </div>
              )}

              {/* What the agent extracted — called out above the raw bulletin
                  text so it's easy to eyeball against the source below. */}
              <div style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                fontSize: 11, lineHeight: 1.5, marginBottom: 12,
                padding: "8px 10px", background: "rgba(240,171,252,0.08)",
                border: "1px solid rgba(240,171,252,0.25)", borderRadius: 7,
              }}>
                <Sparkles size={13} color="#F0ABFC" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ color: "#fff", fontWeight: 700 }}>{rec?.service}</div>
                  {rec?.estimatedCost != null && (
                    <div style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                      Extracted repair job — priced ~${Math.round(rec.estimatedCost).toLocaleString()}
                      {typeof tsbRef.laborHours === "number" && typeof tsbRef.partsEstimate === "number"
                        ? ` (${tsbRef.laborHours} hr labor + $${tsbRef.partsEstimate} parts, from the bulletin's own figures)`
                        : ""}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>
                Bulletin text
              </div>
              <div style={{
                fontSize: 11.5, lineHeight: 1.55, color: "rgba(255,255,255,0.85)",
                background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 12px", whiteSpace: "pre-wrap",
              }}>
                {tsbRef.title && <div style={{ fontWeight: 700, color: "#fff", marginBottom: 5 }}>{tsbRef.title}</div>}
                {tsbRef.summary}
              </div>

              {tsbRef.pdfUrl ? (
                <button
                  onClick={() => openExternalUrl(tsbRef.pdfUrl)}
                  style={{
                    marginTop: 12, display: "flex", alignItems: "center", gap: 5,
                    background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)",
                    borderRadius: 6, padding: "6px 10px", cursor: "pointer",
                    fontSize: 11, fontWeight: 700, color: "#93C5FD",
                  }}
                >
                  <ExternalLink size={12} /> Open NHTSA document
                </button>
              ) : isCurated ? (
                <div style={{ marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
                  Curated demo bulletin — no external document to link to.
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
