import { useState } from "react";
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  MapPin,
  Filter,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_DEALER_GROUP } from "../data/oemDemoData";

// ── Helpers ──────────────────────────────────────────────────
function formatDollars(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}

function statusDot(status) {
  const colors = { good: COLORS.success, warning: COLORS.warning, critical: COLORS.danger };
  return colors[status] || COLORS.textMuted;
}

function statusBorderColor(status) {
  if (status === "critical") return COLORS.danger;
  if (status === "warning") return COLORS.warning;
  return "transparent";
}

function approvalColor(rate) {
  if (rate >= 90) return COLORS.success;
  if (rate >= 80) return COLORS.warning;
  return COLORS.danger;
}

function complianceColor(score) {
  if (score >= 85) return COLORS.success;
  if (score >= 70) return COLORS.warning;
  return COLORS.danger;
}

// ── Sub-components ────────────────────────────────────────────
function KPICard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: "20px 24px",
        flex: 1,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color: color || COLORS.textPrimary, lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MakesBadge({ make }) {
  const palette = {
    Toyota: { bg: "#EFF6FF", color: "#1D4ED8" },
    Ford: { bg: "#FFF7ED", color: "#C2410C" },
    Honda: { bg: "#F0FDF4", color: "#15803D" },
    Chevrolet: { bg: "#FDF4FF", color: "#7E22CE" },
    GMC: { bg: "#FDF4FF", color: "#7E22CE" },
    Lincoln: { bg: "#F8FAFC", color: "#334155" },
  };
  const p = palette[make] || { bg: COLORS.borderLight, color: COLORS.textSecondary };
  return (
    <span
      style={{
        display: "inline-block",
        background: p.bg,
        color: p.color,
        borderRadius: 12,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 600,
        marginRight: 4,
      }}
    >
      {make}
    </span>
  );
}

function DMSBadge({ dms }) {
  const short = { "Reynolds & Reynolds": "R&R", CDK: "CDK", Dealertrack: "DT" };
  return (
    <span
      style={{
        display: "inline-block",
        background: COLORS.borderLight,
        color: COLORS.textSecondary,
        borderRadius: 4,
        padding: "2px 7px",
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {short[dms] || dms}
    </span>
  );
}

function DealerCard({ dealer }) {
  const borderColor = statusBorderColor(dealer.status);
  return (
    <div
      style={{
        background: COLORS.bgCard,
        border: `1px solid ${COLORS.border}`,
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: 12,
        padding: "20px 20px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: statusDot(dealer.status),
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
              {dealer.name}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: COLORS.textSecondary, fontSize: 12 }}>
            <MapPin size={11} />
            {dealer.city}
          </div>
        </div>
        <DMSBadge dms={dealer.dms} />
      </div>

      {/* Makes */}
      <div>
        {dealer.makes.map((m) => (
          <MakesBadge key={m} make={m} />
        ))}
      </div>

      {/* KPI grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "8px 16px",
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Approval Rate</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: approvalColor(dealer.approvalRate) }}>
            {dealer.approvalRate}%
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Compliance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: complianceColor(dealer.complianceScore) }}>
            {dealer.complianceScore}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>ROs Today</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>{dealer.rosToday}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>$ Submitted</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary }}>
            {formatDollars(dealer.dollarSubmitted)}
          </div>
        </div>
      </div>

      {/* View button */}
      <button
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: COLORS.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "9px 0",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          width: "100%",
        }}
      >
        View Dashboard <ChevronRight size={14} />
      </button>
    </div>
  );
}

function LeaderboardTable({ dealers, title, ascending }) {
  const sorted = [...dealers].sort((a, b) =>
    ascending ? a.approvalRate - b.approvalRate : b.approvalRate - a.approvalRate
  );
  const shown = sorted.slice(0, 5);

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>
        {title}
      </div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}` }}>
              Dealer
            </th>
            <th style={{ textAlign: "right", fontSize: 11, color: COLORS.textMuted, fontWeight: 600, paddingBottom: 6, borderBottom: `1px solid ${COLORS.border}` }}>
              Approval
            </th>
          </tr>
        </thead>
        <tbody>
          {shown.map((d, i) => (
            <tr key={d.id}>
              <td style={{ padding: "7px 0 7px 0", fontSize: 12, color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <span style={{ color: COLORS.textMuted, marginRight: 6, fontSize: 11 }}>{i + 1}.</span>
                {d.name}
              </td>
              <td style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: approvalColor(d.approvalRate), borderBottom: `1px solid ${COLORS.borderLight}` }}>
                {d.approvalRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function OEMDealerGroupScreen() {
  const [approvalThreshold, setApprovalThreshold] = useState(80);
  const [complianceThreshold, setComplianceThreshold] = useState(70);
  const [saved, setSaved] = useState(false);

  const totalROs = OEM_DEALER_GROUP.reduce((s, d) => s + d.rosToday, 0);
  const totalDollars = OEM_DEALER_GROUP.reduce((s, d) => s + d.dollarSubmitted, 0);
  const avgApproval = Math.round(
    OEM_DEALER_GROUP.reduce((s, d) => s + d.approvalRate, 0) / OEM_DEALER_GROUP.length
  );
  const avgCompliance = Math.round(
    OEM_DEALER_GROUP.reduce((s, d) => s + d.complianceScore, 0) / OEM_DEALER_GROUP.length
  );

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100%",
        background: COLORS.bg,
        boxSizing: "border-box",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
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
              <Building2 size={20} color="#fff" />
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary, margin: 0 }}>
              Multi-Dealer Group Command Center
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.textSecondary, fontSize: 13, paddingLeft: 46 }}>
            <MapPin size={13} />
            8 Locations · Bay Area, CA
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>March 21, 2026</div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              background: "#EFF6FF",
              color: "#1D4ED8",
              borderRadius: 20,
              padding: "3px 10px",
              fontSize: 11,
              fontWeight: 600,
              marginTop: 4,
            }}
          >
            edition=OEM
          </div>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "flex", gap: 16, marginBottom: 28, flexWrap: "wrap" }}>
        <KPICard
          label="Group Approval Rate"
          value={`${avgApproval}%`}
          sub="Average across all dealers"
          color={approvalColor(avgApproval)}
        />
        <KPICard
          label="Total $ Submitted Today"
          value={formatDollars(totalDollars)}
          sub="All 8 locations combined"
          color={COLORS.textPrimary}
        />
        <KPICard
          label="Total ROs Today"
          value={totalROs}
          sub="Across all locations"
          color={COLORS.textPrimary}
        />
        <KPICard
          label="Avg Compliance Score"
          value={avgCompliance}
          sub="Group average"
          color={complianceColor(avgCompliance)}
        />
      </div>

      {/* ── Dealer Grid ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {OEM_DEALER_GROUP.map((dealer) => (
          <DealerCard key={dealer.id} dealer={dealer} />
        ))}
      </div>

      {/* ── Bottom Sections ── */}
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {/* Leaderboard */}
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            flex: "1 1 420px",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <TrendingUp size={16} color={COLORS.primary} />
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
              Location Leaderboard — Approval Rate
            </span>
          </div>
          <div style={{ display: "flex", gap: 32 }}>
            <LeaderboardTable dealers={OEM_DEALER_GROUP} title="Top 5" ascending={false} />
            <div style={{ width: 1, background: COLORS.border, flexShrink: 0 }} />
            <LeaderboardTable dealers={OEM_DEALER_GROUP} title="Bottom 5" ascending={true} />
          </div>
        </div>

        {/* Alert Configuration */}
        <div
          style={{
            background: COLORS.bgCard,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            padding: "20px 24px",
            flex: "1 1 300px",
            minWidth: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <AlertTriangle size={16} color={COLORS.warning} />
            <span style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>
              Alert Configuration
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                Alert when approval rate drops below
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(e.target.value)}
                  style={{
                    width: 72,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>% approval rate</span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 6 }}>
                Alert when compliance score drops below
              </label>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="number"
                  value={complianceThreshold}
                  onChange={(e) => setComplianceThreshold(e.target.value)}
                  style={{
                    width: 72,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: "6px 10px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: COLORS.textPrimary,
                    outline: "none",
                  }}
                />
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>compliance score</span>
              </div>
            </div>

            <div
              style={{
                background: COLORS.borderLight,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 12,
                color: COLORS.textSecondary,
              }}
            >
              Alerts sent via email to Fixed Ops Directors and Regional VP.
              <br />
              Currently monitoring: <strong style={{ color: COLORS.textPrimary }}>8 locations</strong>
            </div>

            <button
              onClick={handleSave}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                background: saved ? COLORS.success : COLORS.primary,
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 0",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              {saved ? (
                <>
                  <CheckCircle size={14} /> Thresholds Saved
                </>
              ) : (
                "Save Thresholds"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
