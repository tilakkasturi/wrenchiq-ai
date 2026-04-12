import { useState } from "react";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Users, Clock, Download, ChevronRight, Sparkles, ArrowRight } from "lucide-react";
import { useRecommendations } from "../context/RecommendationsContext";
import { COLORS } from "../theme/colors";
import { OEM_ADVISORS, WARRANTY_CLAIMS, REJECTION_HISTORY, OEM_DEALER } from "../data/oemDemoData";
import { useEditionName } from "../context/BrandingContext";

const PRIMARY = "#0D3B45";
const ACCENT = "#FF6B35";
const TEXT_DARK = "#111827";

const CATEGORY_COLORS = {
  narrative: { bg: "#DBEAFE", text: "#1D4ED8", label: "Narrative" },
  opcode:    { bg: "#EDE9FE", text: "#6D28D9", label: "Op Code" },
  parts:     { bg: "#FFEDD5", text: "#C2410C", label: "Parts" },
  preauth:   { bg: "#FEE2E2", text: "#B91C1C", label: "Pre-Auth" },
  duplicate: { bg: "#F3F4F6", text: "#4B5563", label: "Duplicate" },
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

function KPICard({ icon: Icon, label, value, sub, valueColor, accent }) {
  return (
    <div style={{
      flex: 1,
      background: "#fff",
      border: `1px solid #E5E7EB`,
      borderRadius: 10,
      padding: "20px 24px",
      display: "flex",
      flexDirection: "column",
      gap: 6,
      minWidth: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: accent ? `${ACCENT}18` : `${PRIMARY}12`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={16} color={accent ? ACCENT : PRIMARY} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 500, color: "#6B7280" }}>{label}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: valueColor || TEXT_DARK, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: "#6B7280" }}>{sub}</div>
    </div>
  );
}

function TrendChart({ data }) {
  const rates = data.map(d => d.rate);
  const minRate = Math.min(...rates) - 5;
  const maxRate = Math.max(...rates) + 5;
  const range = maxRate - minRate;
  const W = 500;
  const H = 140;
  const padL = 36, padR = 16, padT = 12, padB = 28;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const xStep = chartW / (data.length - 1);

  const points = data.map((d, i) => {
    const x = padL + i * xStep;
    const y = padT + chartH - ((d.rate - minRate) / range) * chartH;
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const gridRates = [79, 82, 85, 88];

  return (
    <div style={{
      background: "#fff",
      border: "1px solid #E5E7EB",
      borderRadius: 10,
      padding: "20px 24px",
      marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>
            Warranty Approval Rate — 6 Month Trend
          </div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
            Palo Alto Toyota · Oct 2025 – Mar 2026
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#F0FDF4", border: "1px solid #BBF7D0",
          borderRadius: 6, padding: "4px 10px",
        }}>
          <TrendingUp size={13} color="#16A34A" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#16A34A" }}>+3% vs Oct</span>
        </div>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
        {/* Grid lines */}
        {gridRates.map(r => {
          const y = padT + chartH - ((r - minRate) / range) * chartH;
          return (
            <g key={r}>
              <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#F3F4F6" strokeWidth={1} />
              <text x={padL - 4} y={y + 4} textAnchor="end" fontSize={9} fill="#9CA3AF">{r}%</text>
            </g>
          );
        })}
        {/* Area fill */}
        <path
          d={`${pathD} L ${points[points.length - 1].x} ${padT + chartH} L ${points[0].x} ${padT + chartH} Z`}
          fill={`${ACCENT}18`}
        />
        {/* Line */}
        <path d={pathD} fill="none" stroke={ACCENT} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={4} fill="#fff" stroke={ACCENT} strokeWidth={2} />
            <text x={p.x} y={padT + chartH + 16} textAnchor="middle" fontSize={10} fill="#6B7280">{p.month}</text>
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={9} fill={ACCENT} fontWeight="600">{p.rate}%</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function ComplianceBar({ score }) {
  const color = score >= 90 ? "#16A34A" : score >= 75 ? "#D97706" : "#DC2626";
  const bg = score >= 90 ? "#F0FDF4" : score >= 75 ? "#FFFBEB" : "#FEF2F2";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 80, height: 6, background: "#F3F4F6", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{
        fontSize: 12, fontWeight: 700, color,
        background: bg, borderRadius: 4, padding: "1px 6px",
      }}>
        {score}
      </span>
    </div>
  );
}

function AdvisorLeaderboard({ advisors }) {
  const sorted = [...advisors]
    .filter(a => a.id !== "adv-001")
    .sort((a, b) => b.complianceScore - a.complianceScore);

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>Advisor Performance — March 2026</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>Sorted by compliance score</div>
        </div>
        <Users size={16} color="#6B7280" />
      </div>
      {/* Table header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.6fr 0.9fr",
        padding: "8px 20px",
        background: "#F9FAFB",
        borderBottom: "1px solid #F3F4F6",
      }}>
        {["Advisor", "Compliance Score", "Approval Rate", "ROs", "Rejected", "Avg Write-up"].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
            {h}
          </div>
        ))}
      </div>
      {sorted.map(adv => {
        const isHighRisk = adv.complianceScore < 70;
        const rowBg = isHighRisk ? "#FEF2F2" : "#fff";
        return (
          <div
            key={adv.id}
            style={{
              display: "grid",
              gridTemplateColumns: "1.6fr 1.2fr 1fr 0.8fr 0.6fr 0.9fr",
              padding: "12px 20px",
              borderBottom: "1px solid #F9FAFB",
              background: rowBg,
              alignItems: "center",
            }}
          >
            {/* Advisor */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%",
                background: isHighRisk ? "#DC2626" : PRIMARY,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>
                {adv.initials}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: TEXT_DARK }}>{adv.name}</div>
                {isHighRisk && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: "#DC2626",
                    background: "#FEE2E2", borderRadius: 3, padding: "1px 5px",
                  }}>
                    HIGH RISK
                  </span>
                )}
              </div>
            </div>
            {/* Compliance */}
            <ComplianceBar score={adv.complianceScore} />
            {/* Approval Rate */}
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: adv.approvalRate >= 90 ? "#16A34A" : adv.approvalRate >= 80 ? "#D97706" : "#DC2626",
            }}>
              {adv.approvalRate}%
            </div>
            {/* ROs */}
            <div style={{ fontSize: 13, color: TEXT_DARK }}>{adv.rosThisMonth}</div>
            {/* Rejected */}
            <div style={{
              fontSize: 13, fontWeight: 600,
              color: adv.rejected > 8 ? "#DC2626" : adv.rejected > 4 ? "#D97706" : "#16A34A",
            }}>
              {adv.rejected}
            </div>
            {/* Write-up time */}
            <div style={{ fontSize: 13, color: "#6B7280" }}>
              {adv.avgWriteUpMin ? `${adv.avgWriteUpMin} min` : "—"}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RejectionCauses() {
  const causes = [
    { label: "Narrative gaps",   count: 4, color: "#1D4ED8" },
    { label: "Op code errors",   count: 2, color: "#6D28D9" },
    { label: "Parts compliance", count: 2, color: "#C2410C" },
    { label: "Pre-auth missing", count: 2, color: "#B91C1C" },
    { label: "Duplicate claim",  count: 1, color: "#4B5563" },
  ];
  const total = causes.reduce((s, c) => s + c.count, 0);

  return (
    <div style={{
      background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10,
      padding: "16px 20px", marginBottom: 16,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK, marginBottom: 14 }}>
        Rejection Root Cause
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {causes.map(c => (
          <div key={c.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 120, fontSize: 12, color: "#374151", flexShrink: 0 }}>{c.label}</div>
            <div style={{ flex: 1, height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: `${(c.count / total) * 100}%`,
                height: "100%",
                background: c.color,
                borderRadius: 4,
              }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: c.color, minWidth: 20, textAlign: "right" }}>
              {c.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DollarsAtRisk({ history }) {
  const overridden = history.filter((_, i) => i < 3);
  const total = overridden.reduce((s, r) => s + r.amount, 0);

  return (
    <div style={{
      background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 10,
      padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <AlertTriangle size={15} color="#D97706" />
        <div style={{ fontSize: 14, fontWeight: 600, color: "#92400E" }}>
          Dollars at Risk — Overridden Flags
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {overridden.map(r => {
          const adv = OEM_ADVISORS.find(a => a.id === r.advisorId);
          return (
            <div key={r.id} style={{
              background: "#fff", border: "1px solid #FDE68A", borderRadius: 7,
              padding: "10px 14px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_DARK }}>{r.roId}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: ACCENT }}>
                  ${r.amount.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: 11, color: "#6B7280", marginTop: 2 }}>
                {adv?.name} · <CategoryBadge category={r.category} />
              </div>
              <div style={{ fontSize: 11, color: "#92400E", marginTop: 4 }}>
                {r.reason.length > 55 ? r.reason.slice(0, 55) + "…" : r.reason}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        marginTop: 12, paddingTop: 10, borderTop: "1px solid #FDE68A",
        display: "flex", justifyContent: "space-between",
        fontSize: 13, fontWeight: 700,
      }}>
        <span style={{ color: "#92400E" }}>Total at Risk</span>
        <span style={{ color: ACCENT }}>${total.toLocaleString()}</span>
      </div>
    </div>
  );
}

function RecentRejectionsTable({ history }) {
  const recent = [...history].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden" }}>
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #F3F4F6",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: TEXT_DARK }}>Recent Rejections</div>
          <div style={{ fontSize: 12, color: "#6B7280", marginTop: 1 }}>Last 5 Toyota warranty rejections</div>
        </div>
        <button style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "#F9FAFB", border: "1px solid #E5E7EB",
          borderRadius: 7, padding: "6px 12px", cursor: "pointer",
          fontSize: 12, fontWeight: 500, color: "#374151",
        }}>
          <Download size={13} />
          Export
        </button>
      </div>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "100px 90px 1.2fr 90px 100px 1fr",
        padding: "8px 20px",
        background: "#F9FAFB",
        borderBottom: "1px solid #F3F4F6",
      }}>
        {["Date", "RO #", "Advisor", "Amount", "Category", "Reason"].map(h => (
          <div key={h} style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: 0.4 }}>
            {h}
          </div>
        ))}
      </div>
      {recent.map(r => {
        const adv = OEM_ADVISORS.find(a => a.id === r.advisorId);
        return (
          <div key={r.id} style={{
            display: "grid",
            gridTemplateColumns: "100px 90px 1.2fr 90px 100px 1fr",
            padding: "11px 20px",
            borderBottom: "1px solid #F9FAFB",
            alignItems: "center",
          }}>
            <div style={{ fontSize: 12, color: "#6B7280" }}>
              {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY }}>{r.roId}</div>
            <div style={{ fontSize: 12, color: TEXT_DARK }}>{adv?.name || "—"}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#DC2626" }}>
              ${r.amount.toLocaleString()}
            </div>
            <CategoryBadge category={r.category} />
            <div style={{ fontSize: 12, color: "#6B7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {r.reason}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FixedOpsDashboardScreen() {
  const oemName = useEditionName("OEM");
  const advisors = OEM_ADVISORS.filter(a => a.id !== "adv-001");
  const avgCompliance = Math.round(
    advisors.reduce((s, a) => s + a.complianceScore, 0) / advisors.length
  );
  const { thisMonth, trend } = WARRANTY_CLAIMS;

  // Recommendations banner
  const recCtx = useRecommendations();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const oemInsights = recCtx ? recCtx.getForScreen("fixedOpsDashboard") : [];
  const showBanner = recCtx && !recCtx.loading && oemInsights.length > 0 && !bannerDismissed;

  return (
    <div style={{
      background: "#F9FAFB",
      minHeight: "100vh",
      padding: "24px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: TEXT_DARK,
    }}>
      {/* Fixed Ops AI Insights banner */}
      {showBanner && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FFF7ED",
          border: "1px solid #FED7AA",
          borderLeft: "3px solid #FF6B35",
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 16,
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="#FF6B35" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#9A3412" }}>
              {oemInsights.length} Fixed Ops insight{oemInsights.length > 1 ? "s" : ""} available
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "#FF6B35",
                background: "rgba(255,107,53,0.1)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              View
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <BarChart3 size={20} color={ACCENT} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: TEXT_DARK }}>
            Fixed Ops Dashboard
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

      {/* KPI Bar */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <KPICard
          icon={CheckCircle}
          label="Warranty Approval Rate"
          value={`${thisMonth.approvalRate}%`}
          sub="vs 83% last month ↑"
          valueColor="#16A34A"
        />
        <KPICard
          icon={Users}
          label="Avg Compliance Score"
          value={avgCompliance}
          sub="per advisor write-up"
        />
        <KPICard
          icon={DollarSign}
          label="Warranty $ Submitted"
          value={`$${(thisMonth.dollarSubmitted / 1000).toFixed(1)}K`}
          sub={`${thisMonth.submitted} claims this month`}
        />
        <KPICard
          icon={AlertTriangle}
          label="Dollars at Risk"
          value={`$${thisMonth.dollarPending.toLocaleString()}`}
          sub="4 overridden flags"
          valueColor={ACCENT}
          accent
        />
      </div>

      {/* Trend Chart */}
      <TrendChart data={trend} />

      {/* Two-column section */}
      <div style={{ display: "flex", gap: 20, marginBottom: 24 }}>
        {/* Left: Leaderboard */}
        <div style={{ flex: "0 0 60%", minWidth: 0 }}>
          <AdvisorLeaderboard advisors={OEM_ADVISORS} />
        </div>
        {/* Right: Causes + Dollars at Risk */}
        <div style={{ flex: "0 0 calc(40% - 20px)", minWidth: 0 }}>
          <RejectionCauses />
          <DollarsAtRisk history={REJECTION_HISTORY} />
        </div>
      </div>

      {/* Recent Rejections */}
      <RecentRejectionsTable history={REJECTION_HISTORY} />
    </div>
  );
}
