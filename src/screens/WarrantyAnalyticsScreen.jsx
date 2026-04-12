import { useState } from "react";
import { AlertTriangle, TrendingDown, FileText, Download, ChevronDown, Filter } from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_ADVISORS, REJECTION_HISTORY, WARRANTY_CLAIMS, OEM_DEALER } from "../data/oemDemoData";
import { useEditionName } from "../context/BrandingContext";

const PRIMARY = "#0D3B45";
const ACCENT = "#FF6B35";
const TEXT_DARK = "#111827";

const CATEGORY_COLORS = {
  narrative: { bg: "#DBEAFE", text: "#1D4ED8", label: "Narrative",  bar: "#1D4ED8" },
  opcode:    { bg: "#EDE9FE", text: "#6D28D9", label: "Op Code",    bar: "#6D28D9" },
  parts:     { bg: "#FFEDD5", text: "#C2410C", label: "Parts",      bar: "#C2410C" },
  preauth:   { bg: "#FEE2E2", text: "#B91C1C", label: "Pre-Auth",   bar: "#B91C1C" },
  duplicate: { bg: "#F3F4F6", text: "#4B5563", label: "Duplicate",  bar: "#9CA3AF" },
};

function CategoryBadge({ category }) {
  const cfg = CATEGORY_COLORS[category] || CATEGORY_COLORS.duplicate;
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 8px",
      borderRadius: 4,
      fontSize: 11,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.text,
      whiteSpace: "nowrap",
    }}>
      {cfg.label}
    </span>
  );
}

function SummaryBar() {
  const { thisMonth } = WARRANTY_CLAIMS;
  const cards = [
    {
      label: "Total Rejections",
      value: thisMonth.rejected,
      sub: `Out of ${thisMonth.submitted} claims submitted`,
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
      icon: <AlertTriangle size={16} color="#DC2626" />,
    },
    {
      label: "Total $ Rejected",
      value: `$${thisMonth.dollarRejected.toLocaleString()}`,
      sub: `$${Math.round(thisMonth.dollarRejected / thisMonth.rejected).toLocaleString()} avg per rejection`,
      color: ACCENT,
      bg: "#FFF7ED",
      border: "#FED7AA",
      icon: <TrendingDown size={16} color={ACCENT} />,
    },
    {
      label: "Most Common Cause",
      value: "Narrative Gaps",
      sub: "4 rejections — 29% of total",
      color: "#1D4ED8",
      bg: "#EFF6FF",
      border: "#BFDBFE",
      icon: <FileText size={16} color="#1D4ED8" />,
    },
  ];

  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{
          flex: 1,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 10,
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            {c.icon}
            <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{c.label}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, color: c.color, lineHeight: 1 }}>{c.value}</div>
          <div style={{ fontSize: 11, color: "#6B7280" }}>{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

function RejectionLog({ history }) {
  const [hovered, setHovered] = useState(null);
  const sorted = [...history].sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 10, overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>Rejection Log</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
            All {history.length} warranty rejections — March 2026
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            borderRadius: 7, padding: "6px 12px", cursor: "pointer",
            fontSize: 12, fontWeight: 500, color: "#374151",
          }}>
            <Filter size={12} />
            Filter
          </button>
          <button style={{
            display: "flex", alignItems: "center", gap: 5,
            background: "#F9FAFB", border: "1px solid #E5E7EB",
            borderRadius: 7, padding: "6px 12px", cursor: "pointer",
            fontSize: 12, fontWeight: 500, color: "#374151",
          }}>
            <Download size={12} />
            Export
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "90px 80px 1.1fr 80px 100px 1fr",
        padding: "8px 20px",
        background: "#F9FAFB",
        borderBottom: "1px solid #F3F4F6",
      }}>
        {[
          { label: "Date", icon: <ChevronDown size={10} /> },
          { label: "RO #" },
          { label: "Advisor" },
          { label: "Amount", icon: <ChevronDown size={10} /> },
          { label: "Category" },
          { label: "Reason" },
        ].map(h => (
          <div
            key={h.label}
            style={{
              fontSize: 11, fontWeight: 600, color: "#6B7280",
              textTransform: "uppercase", letterSpacing: 0.4,
              display: "flex", alignItems: "center", gap: 3, cursor: "default",
            }}
          >
            {h.label}
            {h.icon && <span style={{ color: "#9CA3AF" }}>{h.icon}</span>}
          </div>
        ))}
      </div>

      {/* Rows */}
      {sorted.map(r => {
        const adv = OEM_ADVISORS.find(a => a.id === r.advisorId);
        const isHovered = hovered === r.id;
        return (
          <div
            key={r.id}
            onMouseEnter={() => setHovered(r.id)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "90px 80px 1.1fr 80px 100px 1fr",
              padding: "11px 20px",
              borderBottom: "1px solid #F9FAFB",
              alignItems: "center",
              background: isHovered ? "#F9FAFB" : "#fff",
              transition: "background 0.15s",
              cursor: "default",
            }}
          >
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>{r.roId}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 26, height: 26, borderRadius: "50%",
                background: adv?.complianceScore < 70 ? "#DC2626" : PRIMARY,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {adv?.initials}
              </div>
              <span style={{ fontSize: 12, color: TEXT_DARK }}>{adv?.name || "—"}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
              ${r.amount.toLocaleString()}
            </div>
            <CategoryBadge category={r.category} />
            <div style={{ fontSize: 11, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.reason}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RootCauseBreakdown() {
  const causes = [
    { label: "Narrative gaps",   count: 4, category: "narrative" },
    { label: "Op code mismatch", count: 2, category: "opcode"    },
    { label: "Parts compliance", count: 2, category: "parts"     },
    { label: "Pre-auth missing", count: 2, category: "preauth"   },
    { label: "Duplicate claim",  count: 1, category: "duplicate" },
  ];
  const total = causes.reduce((s, c) => s + c.count, 0);

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 10, padding: "16px 20px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 14 }}>
        Root Cause Breakdown
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {causes.map(c => {
          const cfg = CATEGORY_COLORS[c.category];
          const pct = Math.round((c.count / total) * 100);
          return (
            <div key={c.label}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: TEXT_DARK, fontWeight: 500 }}>{c.label}</span>
                  <CategoryBadge category={c.category} />
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  <span style={{ fontWeight: 700, color: cfg.text }}>{c.count}</span>
                  <span style={{ marginLeft: 4 }}>({pct}%)</span>
                </div>
              </div>
              <div style={{ height: 7, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${pct}%`,
                  height: "100%",
                  background: cfg.bar,
                  borderRadius: 4,
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HighRiskAdvisorCard() {
  const tyler = OEM_ADVISORS.find(a => a.id === "adv-005");
  return (
    <div style={{
      background: "#FEF2F2", border: "2px solid #FECACA",
      borderRadius: 10, padding: "16px 20px", marginBottom: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertTriangle size={15} color="#DC2626" />
        <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B" }}>
          High-Risk Advisor Alert
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%",
          background: "#DC2626", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff",
          flexShrink: 0,
        }}>
          TB
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{tyler?.name}</div>
          <div style={{ fontSize: 12, color: "#DC2626", fontWeight: 600 }}>
            {tyler?.approvalRate}% approval rate
            <span style={{ color: "#6B7280", fontWeight: 400 }}> · threshold: 80%</span>
          </div>
        </div>
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 10, marginBottom: 14,
      }}>
        {[
          { label: "ROs This Month", value: tyler?.rosThisMonth },
          { label: "Rejected", value: tyler?.rejected },
          { label: "Compliance", value: tyler?.complianceScore },
        ].map(s => (
          <div key={s.label} style={{
            background: "#fff", border: "1px solid #FECACA",
            borderRadius: 7, padding: "8px 12px", textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#DC2626" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "#6B7280", marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <button style={{
        width: "100%", padding: "9px 0",
        background: "#DC2626", color: "#fff",
        border: "none", borderRadius: 7,
        fontSize: 13, fontWeight: 600, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <FileText size={13} />
        Send Coaching Report
      </button>
    </div>
  );
}

function VehicleModelBreakdown() {
  const models = [
    { model: "Toyota Camry",   count: 3 },
    { model: "Toyota Tacoma",  count: 2 },
    { model: "Toyota RAV4",    count: 1 },
    { model: "Toyota 4Runner", count: 1 },
    { model: "Others",         count: 7 },
  ];
  const total = models.reduce((s, m) => s + m.count, 0);

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 10, padding: "16px 20px",
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 12 }}>
        Vehicle Model Breakdown
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Model", "Rejections", "Share"].map(h => (
              <th key={h} style={{
                textAlign: "left", fontSize: 10, fontWeight: 600,
                color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4,
                paddingBottom: 8, borderBottom: "1px solid #F3F4F6",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {models.map(m => (
            <tr key={m.model}>
              <td style={{ padding: "7px 0", fontSize: 12, color: TEXT_DARK }}>{m.model}</td>
              <td style={{ padding: "7px 0", fontSize: 12, fontWeight: 600, color: "#DC2626" }}>{m.count}</td>
              <td style={{ padding: "7px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 50, height: 5, background: "#F3F4F6", borderRadius: 3 }}>
                    <div style={{
                      width: `${(m.count / total) * 100}%`,
                      height: "100%", background: ACCENT, borderRadius: 3,
                    }} />
                  </div>
                  <span style={{ fontSize: 11, color: "#6B7280" }}>
                    {Math.round((m.count / total) * 100)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CoachingExportSection() {
  const advisorData = [
    {
      id: "adv-005",
      initials: "TB",
      name: "Tyler Beck",
      complianceScore: 62,
      approvalRate: 71,
      topPattern: "Narrative gaps (3 rejections) — correction sections consistently too vague",
      rejected: 11,
      rosThisMonth: 39,
      color: "#DC2626",
      bg: "#FEF2F2",
      border: "#FECACA",
    },
    {
      id: "adv-007",
      initials: "CR",
      name: "Carlos Reyes",
      complianceScore: 73,
      approvalRate: 79,
      topPattern: "Op code errors (2 rejections) + duplicate claim — process training needed",
      rejected: 9,
      rosThisMonth: 44,
      color: "#D97706",
      bg: "#FFFBEB",
      border: "#FDE68A",
    },
  ];

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB",
      borderRadius: 10, padding: "20px 24px",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>
            Coaching Export — Per Advisor Summary
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>
            Advisors flagged for coaching based on March 2026 performance
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        {advisorData.map(adv => (
          <div key={adv.id} style={{
            flex: 1,
            background: adv.bg,
            border: `1px solid ${adv.border}`,
            borderRadius: 10,
            padding: "16px 18px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: adv.color, display: "flex",
                alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {adv.initials}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: TEXT_DARK }}>{adv.name}</div>
                <div style={{ fontSize: 11, color: adv.color, fontWeight: 600 }}>
                  {adv.approvalRate}% approval · Score {adv.complianceScore}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: 11, color: TEXT_DARK, lineHeight: 1.5,
              background: "#fff", border: `1px solid ${adv.border}`,
              borderRadius: 6, padding: "8px 12px", marginBottom: 12,
            }}>
              <span style={{ fontWeight: 600 }}>Top Pattern: </span>
              {adv.topPattern}
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[
                { label: "ROs", value: adv.rosThisMonth },
                { label: "Rejected", value: adv.rejected },
                { label: "Rejection Rate", value: `${Math.round((adv.rejected / adv.rosThisMonth) * 100)}%` },
              ].map(s => (
                <div key={s.label} style={{
                  flex: 1, background: "#fff", border: `1px solid ${adv.border}`,
                  borderRadius: 6, padding: "6px 8px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: adv.color }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.3 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>

            <button style={{
              width: "100%", padding: "8px 0",
              background: "#fff", color: adv.color,
              border: `1.5px solid ${adv.color}`,
              borderRadius: 7, fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}>
              <Download size={12} />
              Export PDF
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WarrantyAnalyticsScreen() {
  const oemName = useEditionName("OEM");
  return (
    <div style={{
      background: "#F9FAFB",
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: TEXT_DARK,
    }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <TrendingDown size={20} color="#DC2626" />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>
            Warranty Analytics
          </h1>
          <span style={{
            fontSize: 11, fontWeight: 600, color: "#6B7280",
            background: "#F3F4F6", borderRadius: 4, padding: "2px 8px",
          }}>
            {oemName}
          </span>
        </div>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          {OEM_DEALER.name} · {OEM_DEALER.address} · March 2026
        </div>
      </div>

      {/* Summary KPI bar */}
      <SummaryBar />

      {/* Two-column body */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
        {/* Left: Rejection Log */}
        <div style={{ flex: "0 0 55%", minWidth: 0 }}>
          <RejectionLog history={REJECTION_HISTORY} />
        </div>

        {/* Right: Root Cause + High Risk + Models */}
        <div style={{ flex: "0 0 calc(45% - 20px)", minWidth: 0 }}>
          <RootCauseBreakdown />
          <HighRiskAdvisorCard />
          <VehicleModelBreakdown />
        </div>
      </div>

      {/* Coaching Export */}
      <CoachingExportSection />
    </div>
  );
}
