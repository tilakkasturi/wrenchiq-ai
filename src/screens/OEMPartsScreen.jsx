import { useState } from "react";
import {
  Package,
  Search,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Info,
  Tag,
  Shield,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_PARTS } from "../data/oemDemoData";

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  return n.toFixed(2);
}

const FILTER_OPTIONS = ["All Parts", "Warranty Eligible", "Non-Warranty"];

// ── Sub-components ────────────────────────────────────────────
function WarrantyBadge({ eligible }) {
  if (eligible) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          background: "#F0FDF4",
          color: "#15803D",
          borderRadius: 12,
          padding: "3px 9px",
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <CheckCircle size={10} /> Warranty Eligible
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: COLORS.borderLight,
        color: COLORS.textMuted,
        borderRadius: 12,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      Not Covered
    </span>
  );
}

function PreAuthBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#FEF2F2",
        color: "#991B1B",
        borderRadius: 12,
        padding: "3px 9px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <AlertTriangle size={10} /> Pre-Auth Required
    </span>
  );
}

function SupersededBanner({ newPartNo }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: "#FFF7ED",
        border: `1px solid #FED7AA`,
        borderRadius: 6,
        padding: "5px 10px",
        fontSize: 11,
        color: "#92400E",
        fontWeight: 600,
        marginTop: 4,
      }}
    >
      <AlertTriangle size={11} color="#F59E0B" />
      Superseded — use{" "}
      <span style={{ fontFamily: "monospace", fontWeight: 700, color: COLORS.accent }}>
        {newPartNo}
      </span>{" "}
      instead
    </div>
  );
}

function AddToROButton() {
  const [added, setAdded] = useState(false);
  function handle() {
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }
  return (
    <button
      onClick={handle}
      style={{
        background: added ? COLORS.success : "none",
        color: added ? "#fff" : COLORS.primary,
        border: `1px solid ${added ? COLORS.success : COLORS.primary}`,
        borderRadius: 6,
        padding: "5px 12px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {added ? "Added" : "Add to RO"}
    </button>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function OEMPartsScreen() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Parts");
  const [vin, setVin] = useState("");
  const [vinFiltered, setVinFiltered] = useState(false);

  const filtered = OEM_PARTS.filter((p) => {
    const term = search.toLowerCase();
    const matchesSearch =
      !term ||
      p.partNo.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term);

    const matchesFilter =
      filter === "All Parts" ||
      (filter === "Warranty Eligible" && p.warrantyEligible) ||
      (filter === "Non-Warranty" && !p.warrantyEligible);

    return matchesSearch && matchesFilter;
  });

  function handleVinFilter() {
    if (vin.trim()) setVinFiltered(true);
    else setVinFiltered(false);
  }

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100%",
        background: COLORS.bg,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: COLORS.primary,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Package size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, margin: 0 }}>
              OEM Parts Lane
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 46 }}>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Dealer-Net Pricing · Warranty Eligibility
            </span>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                background: "#EFF6FF",
                color: "#1D4ED8",
                borderRadius: 20,
                padding: "2px 9px",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              edition=OEM
            </span>
          </div>
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, paddingTop: 6 }}>March 21, 2026</div>
      </div>

      {/* ── Search & Filters ── */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Main search row */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {/* Search input */}
          <div
            style={{
              flex: "1 1 300px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: `1.5px solid ${COLORS.primary}`,
              borderRadius: 8,
              padding: "10px 14px",
              background: "#fff",
            }}
          >
            <Search size={16} color={COLORS.textMuted} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by part number, description, or DTC/symptom…"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 14,
                color: COLORS.textPrimary,
                background: "transparent",
              }}
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, fontSize: 16, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </div>

          {/* Filter dropdown */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "10px 14px",
              fontSize: 13,
              color: COLORS.textPrimary,
              background: "#fff",
              cursor: "pointer",
              outline: "none",
              minWidth: 160,
            }}
          >
            {FILTER_OPTIONS.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        {/* VIN filter row */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              padding: "8px 12px",
              background: "#fff",
              flex: "0 1 320px",
            }}
          >
            <Tag size={13} color={COLORS.textMuted} />
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="Filter by VIN"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 13,
                color: COLORS.textPrimary,
                background: "transparent",
                fontFamily: "monospace",
              }}
            />
          </div>
          <button
            onClick={handleVinFilter}
            style={{
              background: COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Apply
          </button>
          {vinFiltered && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "#EFF6FF",
                color: "#1D4ED8",
                borderRadius: 8,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <CheckCircle size={12} /> Filtered for: 2024 Camry 2.5L
              <button
                onClick={() => { setVinFiltered(false); setVin(""); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#1D4ED8", fontSize: 14, marginLeft: 2 }}
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div style={{ fontSize: 12, color: COLORS.textMuted }}>
          {filtered.length} {filtered.length === 1 ? "result" : "results"} found
        </div>
      </div>

      {/* ── Parts Table ── */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
            <thead>
              <tr style={{ background: COLORS.borderLight }}>
                {["Part Number", "Description", "Dealer-Net", "MSRP", "Core", "Warranty", "Pre-Auth", ""].map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: COLORS.textMuted,
                        padding: "10px 14px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{ textAlign: "center", padding: "32px 0", color: COLORS.textMuted, fontSize: 14 }}
                  >
                    No parts match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((part, i) => (
                  <tr
                    key={part.partNo}
                    style={{
                      borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderLight}`,
                      background: part.supersededBy ? "#FFFBF0" : "#fff",
                    }}
                  >
                    {/* Part Number */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div
                        style={{
                          fontFamily: "monospace",
                          fontSize: 13,
                          fontWeight: 700,
                          color: COLORS.accent,
                          marginBottom: 2,
                        }}
                      >
                        {part.partNo}
                      </div>
                      {part.supersededBy && (
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 3,
                            background: "#FEF3C7",
                            color: "#92400E",
                            borderRadius: 4,
                            padding: "1px 5px",
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          <AlertTriangle size={9} /> SUPERSEDED
                        </div>
                      )}
                    </td>

                    {/* Description */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 13, color: COLORS.textPrimary, maxWidth: 240 }}>
                        {part.description}
                      </div>
                      {part.supersededBy && (
                        <SupersededBanner newPartNo={part.supersededBy} />
                      )}
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 3 }}>{part.fitment}</div>
                    </td>

                    {/* Dealer-Net */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary }}>
                        ${fmt(part.dealerNet)}
                      </div>
                    </td>

                    {/* MSRP */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                      <div
                        style={{
                          fontSize: 13,
                          color: COLORS.textMuted,
                          textDecoration: "line-through",
                        }}
                      >
                        ${fmt(part.msrp)}
                      </div>
                    </td>

                    {/* Core */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top", whiteSpace: "nowrap" }}>
                      {part.coreCharge > 0 ? (
                        <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                          +${fmt(part.coreCharge)} core
                        </span>
                      ) : (
                        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Warranty */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <WarrantyBadge eligible={part.warrantyEligible} />
                    </td>

                    {/* Pre-Auth */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      {part.requiresPreAuth ? (
                        <PreAuthBadge />
                      ) : (
                        <span style={{ color: COLORS.textMuted, fontSize: 12 }}>—</span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px 14px", verticalAlign: "top" }}>
                      <AddToROButton />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Info Bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: COLORS.borderLight,
          borderRadius: 8,
          fontSize: 12,
          color: COLORS.textMuted,
        }}
      >
        <Info size={13} />
        Dealer-Net pricing as of March 2026 · Toyota OEM catalog · Updated 2026-03-21 ·{" "}
        <span style={{ fontFamily: "monospace", fontWeight: 600, color: COLORS.textSecondary }}>
          edition=OEM
        </span>{" "}
        required
      </div>
    </div>
  );
}
