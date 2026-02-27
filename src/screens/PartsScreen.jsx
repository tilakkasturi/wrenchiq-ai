import { useState } from "react";
import {
  Search,
  Star,
  Sparkles,
  ShoppingCart,
  CheckCircle,
  Clock,
  TrendingDown,
  Package,
  AlertCircle,
  Truck,
  Award,
  ChevronRight,
  Zap,
  BarChart2,
  Car,
  Tag,
  ExternalLink,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { partsComparison, SHOP } from "../data/demoData";

// ── Helper: star renderer ──────────────────────────────────
function StarRating({ rating, size = 12 }) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          fill={i <= full ? "#F59E0B" : "none"}
          stroke={
            i <= full
              ? "#F59E0B"
              : i === full + 1 && half
              ? "#F59E0B"
              : "#D1D5DB"
          }
          strokeWidth={1.5}
        />
      ))}
      <span
        style={{
          marginLeft: 4,
          fontSize: 11,
          color: COLORS.textSecondary,
          fontWeight: 600,
        }}
      >
        {rating.toFixed(1)}
      </span>
    </span>
  );
}

// ── Monthly spend sparkline data ───────────────────────────
const monthlySpend = [
  { month: "Jul", spend: 8200 },
  { month: "Aug", spend: 9400 },
  { month: "Sep", spend: 7800 },
  { month: "Oct", spend: 11200 },
  { month: "Nov", spend: 9600 },
];

export default function PartsScreen() {
  const [searchQuery, setSearchQuery] = useState(
    "2019 Honda CR-V EX-L — Catalytic Converter (P0420)"
  );
  const [selectedRow, setSelectedRow] = useState(0); // O'Reilly AI pick selected by default

  const { results, metrics } = partsComparison;
  const maxSpend = Math.max(...monthlySpend.map((d) => d.spend));

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: COLORS.bg,
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: COLORS.textPrimary,
      }}
    >
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <div
        style={{
          backgroundColor: COLORS.bgCard,
          borderBottom: `1px solid ${COLORS.border}`,
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Title block */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={18} color="#fff" />
          </div>
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: COLORS.textPrimary,
                letterSpacing: "-0.3px",
                lineHeight: 1.2,
              }}
            >
              Parts Intelligence
            </h1>
            <p style={{ margin: 0, fontSize: 11, color: COLORS.textSecondary }}>
              {SHOP.name}
            </p>
          </div>
        </div>

        {/* Search bar */}
        <div style={{ flex: 1, minWidth: 280, position: "relative" }}>
          <Search
            size={15}
            color={COLORS.textMuted}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 14px 9px 36px",
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 13,
              color: COLORS.textPrimary,
              backgroundColor: COLORS.bg,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* eBay Motors connected badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#F9F0FF",
            border: "1.5px solid #C084FC",
            borderRadius: 8,
            padding: "7px 14px",
            flexShrink: 0,
          }}
        >
          {/* eBay logo as styled text */}
          <span
            style={{
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: "-0.4px",
              lineHeight: 1,
            }}
          >
            <span style={{ color: "#E53238" }}>e</span>
            <span style={{ color: "#0064D2" }}>B</span>
            <span style={{ color: "#F5AF02" }}>a</span>
            <span style={{ color: "#86B817" }}>y</span>
          </span>
          <span
            style={{
              fontSize: 12,
              color: COLORS.textSecondary,
              fontWeight: 600,
            }}
          >
            Motors
          </span>
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: COLORS.success,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: "#7C3AED",
              fontWeight: 700,
              letterSpacing: "0.2px",
            }}
          >
            Connected
          </span>
        </div>
      </div>

      {/* ── ACTIVE SEARCH CONTEXT ──────────────────────────────────── */}
      <div
        style={{
          backgroundColor: "#EFF6FF",
          borderBottom: "1px solid #BFDBFE",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Car size={14} color="#2563EB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1D4ED8" }}>
            2019 Honda CR-V EX-L
          </span>
          <span style={{ fontSize: 13, color: "#3B82F6" }}>
            — Catalytic Converter
          </span>
          <span
            style={{
              backgroundColor: "#FEF3C7",
              color: "#92400E",
              fontSize: 11,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              border: "1px solid #FDE68A",
            }}
          >
            P0420
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginLeft: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Tag size={12} color={COLORS.textSecondary} />
            <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
              RO-2024-1188
            </span>
          </div>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              backgroundColor: COLORS.textMuted,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
            David Kim
          </span>
          <span
            style={{
              width: 3,
              height: 3,
              borderRadius: "50%",
              backgroundColor: COLORS.textMuted,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>Bay 2</span>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ──────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 272px",
          gap: 20,
          padding: "20px 24px",
          alignItems: "start",
        }}
      >
        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* ── PARTS COMPARISON TABLE ──────────────────────────────── */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              overflow: "hidden",
            }}
          >
            {/* Table header bar */}
            <div
              style={{
                padding: "13px 20px",
                borderBottom: `1px solid ${COLORS.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                Parts Comparison
              </h2>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {results.length} suppliers · Live pricing
              </span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table
                style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}
              >
                <thead>
                  <tr style={{ backgroundColor: COLORS.borderLight }}>
                    {[
                      "Supplier",
                      "Part #",
                      "Brand",
                      "Cost",
                      "Cust. Price",
                      "Markup",
                      "Availability",
                      "Delivery",
                      "Rating",
                      "Warranty",
                      "",
                    ].map((col) => (
                      <th
                        key={col}
                        style={{
                          padding: "9px 12px",
                          textAlign: "left",
                          fontWeight: 600,
                          color: COLORS.textSecondary,
                          fontSize: 11,
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, idx) => {
                    const isEbay = row.supplier === "eBay Motors";
                    const isOreilly = row.supplier === "O'Reilly Auto Parts";
                    const isOem = row.supplier === "Honda Direct (OEM)";
                    const isMagna = row.brand === "MagnaFlow";
                    const isSelected = selectedRow === idx;

                    let rowBg = idx % 2 === 0 ? "#fff" : "#FAFAF8";
                    if (isEbay) rowBg = "#FFFBEB";
                    if (isSelected && isOreilly) rowBg = "#F0FDF4";
                    if (isSelected && isEbay) rowBg = "#FFF8EC";
                    if (isSelected && !isOreilly && !isEbay) rowBg = "#F0F9FF";

                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRow(idx)}
                        style={{
                          backgroundColor: rowBg,
                          cursor: "pointer",
                          borderTop: `1px solid ${
                            isEbay ? "#FDE68A" : COLORS.borderLight
                          }`,
                          borderBottom: isEbay ? "1px solid #FDE68A" : "none",
                          outline: isSelected
                            ? `2px solid ${
                                isEbay ? COLORS.warning : COLORS.success
                              }`
                            : "none",
                          outlineOffset: -2,
                          transition: "background 0.1s",
                        }}
                      >
                        {/* Supplier cell */}
                        <td style={{ padding: "12px 12px", fontWeight: 600 }}>
                          {isEbay ? (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 3,
                              }}
                            >
                              {/* eBay logo text */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 800,
                                    fontSize: 14,
                                    letterSpacing: "-0.4px",
                                    lineHeight: 1,
                                  }}
                                >
                                  <span style={{ color: "#E53238" }}>e</span>
                                  <span style={{ color: "#0064D2" }}>B</span>
                                  <span style={{ color: "#F5AF02" }}>a</span>
                                  <span style={{ color: "#86B817" }}>y</span>
                                </span>
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: COLORS.textSecondary,
                                    fontWeight: 600,
                                  }}
                                >
                                  Motors
                                </span>
                              </div>
                              {/* Seller name + rating badge */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: COLORS.textMuted,
                                    maxWidth: 110,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {row.sellerName}
                                </span>
                                <span
                                  style={{
                                    backgroundColor: "#DCFCE7",
                                    color: "#166534",
                                    fontSize: 10,
                                    fontWeight: 700,
                                    padding: "1px 5px",
                                    borderRadius: 3,
                                    flexShrink: 0,
                                  }}
                                >
                                  {row.sellerRating}% Pos
                                </span>
                              </div>
                              {/* Compatibility verified */}
                              {row.compatibilityVerified && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 3,
                                  }}
                                >
                                  <CheckCircle
                                    size={10}
                                    color={COLORS.success}
                                    fill={COLORS.success}
                                  />
                                  <span
                                    style={{
                                      fontSize: 10,
                                      color: COLORS.success,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Compatibility Verified
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span
                              style={{ fontSize: 13, color: COLORS.textPrimary }}
                            >
                              {row.supplier}
                            </span>
                          )}
                        </td>

                        {/* Part # */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <div
                            style={{ display: "flex", flexDirection: "column", gap: 2 }}
                          >
                            <span
                              style={{
                                fontFamily: "monospace",
                                fontWeight: 700,
                                fontSize: 12,
                                color: COLORS.primary,
                              }}
                            >
                              {row.partNumber}
                            </span>
                            {isEbay && (
                              <span
                                style={{ fontSize: 10, color: COLORS.textMuted }}
                              >
                                Item #{row.ebayItemId}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Brand */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                            {row.brand}
                          </span>
                        </td>

                        {/* Cost */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 13,
                              color: isEbay ? "#16A34A" : COLORS.textPrimary,
                            }}
                          >
                            ${row.price.toFixed(2)}
                          </span>
                        </td>

                        {/* Customer price */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: COLORS.textPrimary,
                            }}
                          >
                            ${row.customerPrice.toFixed(2)}
                          </span>
                        </td>

                        {/* Markup */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <span
                            style={{
                              backgroundColor: "#EFF6FF",
                              color: "#1D4ED8",
                              fontSize: 11,
                              fontWeight: 700,
                              padding: "3px 7px",
                              borderRadius: 5,
                            }}
                          >
                            {row.markup}%
                          </span>
                        </td>

                        {/* Availability */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          {isOem ? (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                backgroundColor: "#FEE2E2",
                                color: COLORS.danger,
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "3px 7px",
                                borderRadius: 5,
                              }}
                            >
                              <AlertCircle size={10} />
                              BACKORDERED
                            </span>
                          ) : (
                            <span
                              style={{
                                backgroundColor: "#DCFCE7",
                                color: "#166534",
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "3px 7px",
                                borderRadius: 5,
                              }}
                            >
                              {row.availability}
                            </span>
                          )}
                        </td>

                        {/* Delivery */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Truck size={11} color={COLORS.textMuted} />
                            <span
                              style={{ fontSize: 12, color: COLORS.textSecondary }}
                            >
                              {row.delivery}
                            </span>
                          </div>
                        </td>

                        {/* Rating */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          <StarRating rating={row.rating} />
                        </td>

                        {/* Warranty */}
                        <td style={{ padding: "12px 12px", whiteSpace: "nowrap" }}>
                          {isMagna ? (
                            <span
                              style={{
                                display: "inline-block",
                                backgroundColor: "#FFF7ED",
                                color: "#C2410C",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "3px 7px",
                                borderRadius: 4,
                                border: "1px solid #FDBA74",
                              }}
                            >
                              LIFETIME WARRANTY
                            </span>
                          ) : (
                            <span
                              style={{ fontSize: 12, color: COLORS.textSecondary }}
                            >
                              {row.warranty}
                            </span>
                          )}
                        </td>

                        {/* Badge column */}
                        <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 4,
                              alignItems: "flex-end",
                            }}
                          >
                            {isOreilly && row.isAiPick && (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  backgroundColor: "#FFFBEB",
                                  border: "1.5px solid #F59E0B",
                                  borderRadius: 6,
                                  padding: "4px 9px",
                                }}
                              >
                                <Sparkles size={11} color="#F59E0B" />
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 800,
                                    color: "#B45309",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  AI BEST PICK
                                </span>
                              </div>
                            )}
                            {isEbay && (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 4,
                                  alignItems: "flex-end",
                                }}
                              >
                                <div
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 4,
                                    backgroundColor: "#F0FDF4",
                                    border: "1.5px solid #86EFAC",
                                    borderRadius: 6,
                                    padding: "4px 9px",
                                  }}
                                >
                                  <TrendingDown size={11} color={COLORS.success} />
                                  <span
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 800,
                                      color: "#166534",
                                    }}
                                  >
                                    BEST PRICE
                                  </span>
                                </div>
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#16A34A",
                                    fontWeight: 600,
                                  }}
                                >
                                  $44 less than O'Reilly
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── AI RECOMMENDATION PANEL ─────────────────────────────── */}
          <div
            style={{
              background: `linear-gradient(135deg, ${COLORS.primary} 0%, #1A5C6B 55%, #0F4A54 100%)`,
              borderRadius: 12,
              padding: "20px 24px",
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -40,
                right: -40,
                width: 180,
                height: 180,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -50,
                right: 80,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                pointerEvents: "none",
              }}
            />

            {/* Panel header */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 5,
                  }}
                >
                  <Sparkles size={15} color={COLORS.warning} />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: COLORS.warning,
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                    }}
                  >
                    AI Recommendation
                  </span>
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#fff",
                    letterSpacing: "-0.3px",
                  }}
                >
                  WrenchIQ AI recommends{" "}
                  <span style={{ color: "#93EBFB" }}>Walker 16468</span>
                </h3>
              </div>

              {/* Model badge */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 6,
                  padding: "5px 11px",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  flexShrink: 0,
                }}
              >
                <Zap size={11} color="#93EBFB" />
                <span
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.85)",
                    fontWeight: 600,
                  }}
                >
                  Sonnet 4.6
                </span>
              </div>
            </div>

            {/* 4-card reasoning grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
                marginBottom: 18,
              }}
            >
              {/* Card 1 — Best value */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  padding: "13px 15px",
                  borderLeft: `3px solid ${COLORS.success}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Tag size={12} color="#86EFAC" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#86EFAC",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Best Value
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#fff" }}>$342</strong> cost at O'Reilly
                  · <strong style={{ color: "#fff" }}>45% markup</strong> = $496.90
                  customer price. Or{" "}
                  <strong style={{ color: "#86EFAC" }}>$298 via eBay Motors</strong>{" "}
                  (2–3 day shipping from Sacramento).
                </p>
              </div>

              {/* Card 2 — Proven track record */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  padding: "13px 15px",
                  borderLeft: `3px solid ${COLORS.warning}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Star size={12} color="#FDE68A" fill="#FDE68A" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#FDE68A",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Proven Track Record
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#FDE68A" }}>4.7★</strong> rating ·{" "}
                  <strong style={{ color: "#fff" }}>12 installs</strong> at our
                  shop with{" "}
                  <strong style={{ color: "#86EFAC" }}>zero returns</strong>.
                  Consistent performance on Honda 1.5T applications.
                </p>
              </div>

              {/* Card 3 — Warranty advantage */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  padding: "13px 15px",
                  borderLeft: "3px solid #93EBFB",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Award size={12} color="#93EBFB" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#93EBFB",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Warranty Advantage
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.55,
                  }}
                >
                  <strong style={{ color: "#fff" }}>5yr / 50K mi</strong> warranty
                  vs{" "}
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>3yr/36K</span>{" "}
                  (Dorman) or{" "}
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>
                    OEM backorder
                  </span>
                  . Strongest customer-facing coverage in the comparison.
                </p>
              </div>

              {/* Card 4 — Delivery options */}
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  borderRadius: 9,
                  padding: "13px 15px",
                  borderLeft: `3px solid ${COLORS.accent}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <Clock size={12} color="#FCA5A5" />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#FCA5A5",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Delivery Options
                  </span>
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.55,
                  }}
                >
                  O'Reilly:{" "}
                  <strong style={{ color: "#fff" }}>same-day pickup</strong> to
                  hit today's promise time. eBay Motors:{" "}
                  <strong style={{ color: "#86EFAC" }}>save $44</strong> if
                  scheduling allows 2–3 day lead time (RO promised tomorrow).
                </p>
              </div>
            </div>

            {/* Order action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: COLORS.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
                onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <ShoppingCart size={14} />
                Order from O'Reilly
                <span
                  style={{
                    backgroundColor: "rgba(255,255,255,0.22)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Same Day
                </span>
              </button>

              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  backgroundColor: "rgba(255,255,255,0.10)",
                  color: "#fff",
                  border: "1.5px solid rgba(255,255,255,0.28)",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.16)")
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)")
                }
              >
                {/* Inline eBay logo text */}
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: 12,
                    letterSpacing: "-0.3px",
                    lineHeight: 1,
                  }}
                >
                  <span style={{ color: "#E53238" }}>e</span>
                  <span style={{ color: "#7ECBF5" }}>B</span>
                  <span style={{ color: "#F5AF02" }}>a</span>
                  <span style={{ color: "#86B817" }}>y</span>
                </span>
                Order from eBay Motors
                <span
                  style={{
                    backgroundColor: "rgba(134,239,172,0.22)",
                    color: "#86EFAC",
                    borderRadius: 4,
                    padding: "2px 7px",
                    fontSize: 11,
                    fontWeight: 700,
                    border: "1px solid rgba(134,239,172,0.4)",
                  }}
                >
                  Save $44
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR ────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Parts Margin gauge */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Parts Margin
              </span>
              <BarChart2 size={14} color={COLORS.textMuted} />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 6,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {metrics.partsMargin}%
              </span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                / {metrics.targetMargin}% target
              </span>
            </div>

            {/* Progress bar */}
            <div
              style={{
                height: 8,
                backgroundColor: COLORS.borderLight,
                borderRadius: 4,
                overflow: "hidden",
                marginBottom: 5,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${(metrics.partsMargin / metrics.targetMargin) * 100}%`,
                  background: "linear-gradient(90deg, #F59E0B, #FBBF24)",
                  borderRadius: 4,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: COLORS.textMuted,
                marginBottom: 10,
              }}
            >
              <span>0%</span>
              <span style={{ color: COLORS.warning, fontWeight: 600 }}>
                {metrics.partsMargin}%
              </span>
              <span>{metrics.targetMargin}%</span>
            </div>

            <div
              style={{
                padding: "7px 10px",
                backgroundColor: "#FFF7ED",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={11} color={COLORS.warning} />
              <span style={{ fontSize: 11, color: "#92400E" }}>
                {(metrics.targetMargin - metrics.partsMargin).toFixed(1)}% below
                target
              </span>
            </div>
          </div>

          {/* Orders Pending */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Orders Pending
              </span>
              <Package size={14} color={COLORS.textMuted} />
            </div>

            <div
              style={{ display: "flex", alignItems: "baseline", gap: 10 }}
            >
              <span
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {metrics.ordersPending}
              </span>
              <div>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}
                >
                  ${metrics.ordersValue.toLocaleString()}
                </span>
                <br />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                  total value
                </span>
              </div>
            </div>

            <div
              style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}
            >
              {["Walker 16468", "Spark Plugs ×4", "CVT Fluid"].map((item) => (
                <span
                  key={item}
                  style={{
                    backgroundColor: COLORS.borderLight,
                    color: COLORS.textSecondary,
                    fontSize: 10,
                    fontWeight: 500,
                    padding: "3px 7px",
                    borderRadius: 4,
                  }}
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          {/* Avg Delivery Time */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Avg Delivery
              </span>
              <Truck size={14} color={COLORS.textMuted} />
            </div>

            <div
              style={{ display: "flex", alignItems: "baseline", gap: 6 }}
            >
              <span
                style={{
                  fontSize: 30,
                  fontWeight: 800,
                  color: COLORS.textPrimary,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                }}
              >
                {metrics.avgDeliveryTime}
              </span>
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>
                hrs
              </span>
            </div>

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                marginTop: 8,
                backgroundColor: "#F0FDF4",
                borderRadius: 6,
                padding: "5px 9px",
              }}
            >
              <TrendingDown size={11} color={COLORS.success} />
              <span
                style={{ fontSize: 11, fontWeight: 700, color: COLORS.success }}
              >
                {Math.abs(metrics.deliveryTrend)}% faster vs last month
              </span>
            </div>
          </div>

          {/* Monthly parts spend bar chart */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: "16px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.textSecondary,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Monthly Parts Spend
              </span>
            </div>

            {/* Bars */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: 68,
              }}
            >
              {monthlySpend.map((d, i) => {
                const barH = Math.max(
                  6,
                  Math.round((d.spend / maxSpend) * 62)
                );
                const isLast = i === monthlySpend.length - 1;
                return (
                  <div
                    key={d.month}
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        height: barH,
                        backgroundColor: isLast
                          ? COLORS.primary
                          : COLORS.borderLight,
                        borderRadius: "3px 3px 0 0",
                        border: `1px solid ${
                          isLast ? COLORS.primaryLight : COLORS.border
                        }`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 9,
                        color: isLast ? COLORS.primary : COLORS.textMuted,
                        fontWeight: isLast ? 700 : 500,
                      }}
                    >
                      {d.month}
                    </span>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 8,
              }}
            >
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>
                5-month trend
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.textPrimary,
                }}
              >
                $
                {monthlySpend[
                  monthlySpend.length - 1
                ].spend.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick-action links */}
          <div
            style={{
              backgroundColor: COLORS.bgCard,
              borderRadius: 12,
              border: `1px solid ${COLORS.border}`,
              padding: "8px",
            }}
          >
            {[
              { label: "View eBay item listing", icon: ExternalLink },
              { label: "Check supplier account", icon: ChevronRight },
              { label: "Order history (Walker)", icon: ChevronRight },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  padding: "8px 10px",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 12,
                  color: COLORS.textSecondary,
                  fontWeight: 500,
                  textAlign: "left",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.backgroundColor = COLORS.borderLight)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                {label}
                <Icon size={12} color={COLORS.textMuted} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
