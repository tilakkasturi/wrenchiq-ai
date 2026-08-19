/**
 * RepairOrderQueue — Sidecar launch step 2 / in-context toggle (WrenchIQ
 * Product Spec v4.0 §2-3). One canonical queue view used both as the
 * landing screen after the health check and as what "show queue" navigates
 * back to from inside a selected RO — not two separate list UIs.
 *
 * Sourced from useSelectedCustomer()'s `customers`, already polled from
 * GET /api/data-feed/customers by SelectedCustomerContext — this list *is*
 * the shop's working-progress queue already (dataFeedService.js only
 * returns recently-active records; there's no "completed/invoiced" status
 * in this data model left to filter out).
 */

import { useState, useEffect } from "react";
import { Search, Wrench, Sparkles } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { useSelectedCustomer } from "../../context/SelectedCustomerContext";
import { useDemo } from "../../context/DemoContext";
import { fetchValueScores } from "../../services/roValueScoreService";

const VALUE_BAND_COLOR = { high: "#4ADE80", medium: "#FBBF24", low: "rgba(255,255,255,0.35)" };

const STATUS_LABEL = {
  checked_in:    { label: "Checked In",    color: "#60A5FA" },
  inspecting:    { label: "Inspecting",    color: "#FB923C" },
  estimate_sent: { label: "Estimate Sent", color: "#FBBF24" },
  approved:      { label: "Approved",      color: "#2DD4BF" },
  in_progress:   { label: "In Progress",   color: "#C084FC" },
  ready:         { label: "Ready",         color: "#4ADE80" },
};

export default function RepairOrderQueue({ onSelect }) {
  const { customers, loading } = useSelectedCustomer();
  const { activeShopId } = useDemo();
  const [query, setQuery] = useState("");
  // V5 feedback (C3): a second, independent "value/opportunity" score
  // alongside the Gold Standard hygiene score shown once an RO is open —
  // this is the queue-level view of it (see roValueScoreService.js).
  const [valueScores, setValueScores] = useState({});
  const [sortByValue, setSortByValue] = useState(false);

  useEffect(() => {
    if (customers.length === 0) return;
    const ros = customers.map(c => ({
      roNumber: c.roNumber, customerId: c.customerId, totalEstimate: c.totalEstimate || 0,
    }));
    fetchValueScores(activeShopId || "cornerstone", ros).then(setValueScores);
  }, [activeShopId, customers]);

  const filtered = customers.filter((c) =>
    (c.customerName || "").toLowerCase().includes(query.toLowerCase())
    || (c.roNumber || "").toLowerCase().includes(query.toLowerCase())
  );
  const sortedFiltered = sortByValue
    ? [...filtered].sort((a, b) => (valueScores[b.roNumber]?.score || 0) - (valueScores[a.roNumber]?.score || 0))
    : filtered;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <div style={{ padding: "16px 18px 10px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <Wrench size={14} color={COLORS.accent} />
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>Repair Order Queue</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 2, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: 2 }}>
            <button
              onClick={() => setSortByValue(false)}
              title="Sort by check-in order"
              style={{
                display: "flex", alignItems: "center", gap: 3, cursor: "pointer",
                padding: "3px 8px", borderRadius: 5, border: "none",
                background: !sortByValue ? "rgba(255,255,255,0.12)" : "transparent",
                color: !sortByValue ? "#fff" : "rgba(255,255,255,0.4)",
                fontSize: 9.5, fontWeight: 700,
              }}
            >
              Queue
            </button>
            <button
              onClick={() => setSortByValue(true)}
              title="Sort by value/opportunity score — how likely this customer is to say yes"
              style={{
                display: "flex", alignItems: "center", gap: 3, cursor: "pointer",
                padding: "3px 8px", borderRadius: 5, border: "none",
                background: sortByValue ? "rgba(196,181,253,0.2)" : "transparent",
                color: sortByValue ? "#C4B5FD" : "rgba(255,255,255,0.4)",
                fontSize: 9.5, fontWeight: 700,
              }}
            >
              <Sparkles size={10} />
              Score
            </button>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={13} color="rgba(255,255,255,0.35)" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer or RO #…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px 8px 30px",
              background: "rgba(255,255,255,0.05)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              outline: "none", fontSize: 12,
            }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 18px 16px" }}>
        {loading && customers.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", padding: "12px 0" }}>Loading queue…</div>
        )}
        {!loading && sortedFiltered.length === 0 && (
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", padding: "12px 0" }}>
            {query ? `No ROs match "${query}"` : "No active repair orders in the queue."}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sortedFiltered.map((c) => {
            const statusMeta = STATUS_LABEL[c.status] || { label: c.status || "Open", color: "rgba(255,255,255,0.8)" };
            const vehicleLine = c.vehicle?.make
              ? `${c.vehicle.year || ""} ${c.vehicle.make} ${c.vehicle.model || ""}`.trim()
              : null;
            const valueScore = valueScores[c.roNumber];
            return (
              <button
                key={c.customerId || c.roNumber}
                onClick={() => onSelect(c.customerId)}
                style={{
                  display: "block", width: "100%", textAlign: "left", cursor: "pointer",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "10px 12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: "#F1F5F9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.customerName || "Unknown customer"}
                  </span>
                  <span style={{
                    flexShrink: 0, fontSize: 9, fontWeight: 700, borderRadius: 4, padding: "2px 7px",
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    background: "rgba(255,255,255,0.06)", color: statusMeta.color,
                  }}>
                    {statusMeta.label}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
                  <span style={{ fontFamily: "monospace" }}>{c.roNumber || "—"}</span>
                  {vehicleLine && <><span>·</span><span>{vehicleLine}</span></>}
                  {valueScore && (
                    <span
                      title={`Value/opportunity score: ${valueScore.score}/100 (trust ${valueScore.trustScore ?? "—"})`}
                      style={{
                        marginLeft: "auto", flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 3,
                        padding: "1px 6px", borderRadius: 4,
                        background: `${VALUE_BAND_COLOR[valueScore.band]}18`,
                        border: `1px solid ${VALUE_BAND_COLOR[valueScore.band]}40`,
                      }}
                    >
                      <Sparkles size={9} color={VALUE_BAND_COLOR[valueScore.band]} />
                      <span style={{ fontSize: 9.5, fontWeight: 700, color: VALUE_BAND_COLOR[valueScore.band] }}>
                        {valueScore.score}
                      </span>
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
