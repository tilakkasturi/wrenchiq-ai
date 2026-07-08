// CustomerSelector — cross-cutting override for the Data Feed Model's
// default-to-most-recently-updated-customer behavior. Shared by ARO, the
// Advisor Job Flow, Intelligent RO, and Copilot via SelectedCustomerContext.
import { useState, useRef, useEffect } from "react";
import { useSelectedCustomer } from "../context/SelectedCustomerContext";
import { COLORS } from "../theme/colors";

export default function CustomerSelector() {
  const { activeCustomer, customers, selectedCustomerId, selectCustomer, clearSelection, loading } = useSelectedCustomer();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const filtered = customers.filter(c =>
    (c.customerName || "").toLowerCase().includes(query.toLowerCase())
  );

  const label = loading
    ? "Loading…"
    : activeCustomer?.customerName || "No active customer";

  return (
    <div ref={rootRef} style={{ position: "relative", fontSize: 13 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Switch the active customer (defaults to most recently updated)"
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 12px",
          borderRadius: 8,
          border: `1px solid ${COLORS.border}`,
          background: COLORS.bgCard,
          cursor: "pointer",
          minWidth: 180,
          textAlign: "left",
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: "50%",
          background: selectedCustomerId ? COLORS.accent : COLORS.success,
          flexShrink: 0,
        }} />
        <span style={{ flex: 1, color: COLORS.textPrimary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {label}
        </span>
        {!selectedCustomerId && !loading && activeCustomer && (
          <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, letterSpacing: 0.3 }}>
            MOST RECENT
          </span>
        )}
        <span style={{ color: COLORS.textMuted, fontSize: 10 }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          minWidth: 280,
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          zIndex: 1000,
          overflow: "hidden",
        }}>
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search customers…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 12px",
              border: "none", borderBottom: `1px solid ${COLORS.borderLight}`,
              outline: "none",
              fontSize: 13,
            }}
          />

          <div
            onClick={() => { clearSelection(); setOpen(false); setQuery(""); }}
            style={{
              padding: "8px 12px",
              cursor: "pointer",
              fontWeight: 600,
              color: !selectedCustomerId ? COLORS.accent : COLORS.textSecondary,
              background: !selectedCustomerId ? `${COLORS.accent}0F` : "transparent",
              borderBottom: `1px solid ${COLORS.borderLight}`,
            }}
          >
            Most recent customer (default)
          </div>

          <div style={{ maxHeight: 280, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "12px", color: COLORS.textMuted, fontSize: 12 }}>
                No customers match "{query}"
              </div>
            )}
            {filtered.map(c => (
              <div
                key={c.customerId}
                onClick={() => { selectCustomer(c.customerId); setOpen(false); setQuery(""); }}
                style={{
                  padding: "8px 12px",
                  cursor: "pointer",
                  background: selectedCustomerId === c.customerId ? `${COLORS.accent}0F` : "transparent",
                }}
                onMouseEnter={e => { if (selectedCustomerId !== c.customerId) e.currentTarget.style.background = COLORS.borderLight; }}
                onMouseLeave={e => { if (selectedCustomerId !== c.customerId) e.currentTarget.style.background = "transparent"; }}
              >
                <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{c.customerName}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {c.roNumber}
                  {c.vehicle && ` · ${c.vehicle.year || ""} ${c.vehicle.make || ""} ${c.vehicle.model || ""}`.trim()}
                  {c.status && ` · ${c.status.replace(/_/g, " ")}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
