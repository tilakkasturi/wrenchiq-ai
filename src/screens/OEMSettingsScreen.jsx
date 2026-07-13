import { useState } from "react";
import { useBranding, useEditionName } from "../context/BrandingContext";
import {
  Settings,
  AlertCircle,
  Users,
  FileText,
  Database,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_DEALER, OEM_ADVISORS, OP_CODES } from "../data/oemDemoData";

// ── Nav config ────────────────────────────────────────────────
const TABS = [
  { id: "edition",     label: "Edition",          icon: Settings },
  { id: "team",        label: "Team",              icon: Users },
  { id: "audit",       label: "Audit Log",         icon: FileText },
  { id: "admin",       label: "Op Codes",          icon: Database },
];

const AUDIT_ENTRIES = [
  { action: "DMS Push — RO-2861 to CDK",                  user: "Amy Chen",      time: "March 21  10:14 AM", detail: "" },
  { action: "Compliance Override — RO-2798",               user: "Carlos Reyes",  time: "March 17  2:31 PM",  detail: "Reason: \"Customer needed RO same day\"" },
  { action: "Settings Change — Compliance threshold updated", user: "Ryan Cho",   time: "March 15  9:08 AM",  detail: "" },
  { action: "DMS Push — RO-2791 to CDK",                  user: "Jessica Torres",time: "March 15  11:22 AM", detail: "" },
  { action: "User Added — Priya Nair",                     user: "Ryan Cho",      time: "March 1  8:45 AM",   detail: "" },
];

// ── Small helpers ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value, mono }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <div
        style={{
          background: COLORS.borderLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 13,
          color: COLORS.textPrimary,
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Btn({ label, variant = "primary", onClick }) {
  const styles = {
    primary: { bg: COLORS.primary, color: "#fff", border: "none" },
    success: { bg: COLORS.success, color: "#fff", border: "none" },
    danger:  { bg: "#fff", color: COLORS.danger, border: `1px solid ${COLORS.danger}` },
    outline: { bg: "#fff", color: COLORS.primary, border: `1px solid ${COLORS.primary}` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      style={{
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: 7,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ── Tab Contents ──────────────────────────────────────────────

function TabEdition() {
  const oemName = useEditionName("OEM");
  return (
    <div>
      <div
        style={{
          background: COLORS.primary,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>WrenchIQ Edition</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            {oemName}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            Locked · Managed by Predii account provisioning
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontFamily: "monospace",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          edition=OEM
        </div>
      </div>

      <SectionLabel>Dealer Information</SectionLabel>
      <ReadOnlyField label="Dealer Name" value={OEM_DEALER.name} />
      <ReadOnlyField label="Dealer Code" value={OEM_DEALER.dealerCode} mono />
      <ReadOnlyField label="Address" value={OEM_DEALER.address} />
      <ReadOnlyField label="DMS System" value={OEM_DEALER.dms} />

      <SectionLabel>API Edition Field</SectionLabel>
      <div
        style={{
          background: "#1E293B",
          borderRadius: 8,
          padding: "14px 18px",
          fontFamily: "monospace",
          fontSize: 13,
          color: "#7DD3FC",
          marginBottom: 14,
        }}
      >
        <span style={{ color: "#94A3B8" }}>// All API requests include:</span>
        {"\n"}
        <span style={{ color: "#F8FAFC" }}>{"{ "}</span>
        <span style={{ color: "#86EFAC" }}>"edition"</span>
        <span style={{ color: "#F8FAFC" }}>: </span>
        <span style={{ color: "#FCA5A5" }}>"OEM"</span>
        <span style={{ color: "#F8FAFC" }}>{" }"}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "#FFF7ED",
          border: `1px solid #FED7AA`,
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 12,
          color: "#92400E",
        }}
      >
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        This setting is managed by Predii account provisioning. Contact your Predii account manager to change your edition.
      </div>
    </div>
  );
}

function TabTeam() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <SectionLabel>Team Members</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn label="+ Add User" variant="primary" />
        </div>
      </div>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.borderLight }}>
              {["Team Member", "Role", "Compliance", "Approval Rate", ""].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.textMuted,
                    padding: "10px 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OEM_ADVISORS.map((adv, i) => {
              const compColor =
                adv.complianceScore >= 85 ? COLORS.success :
                adv.complianceScore >= 70 ? COLORS.warning : COLORS.danger;
              const approveColor =
                adv.approvalRate >= 90 ? COLORS.success :
                adv.approvalRate >= 80 ? COLORS.warning : COLORS.danger;
              return (
                <tr key={adv.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: COLORS.primary,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {adv.initials}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                        {adv.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textSecondary }}>
                    {adv.role}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: compColor }}>
                      {adv.complianceScore}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: approveColor }}>
                      {adv.approvalRate}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Btn label="Remove" variant="danger" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabAuditLog() {
  const actionColor = (action) => {
    if (action.startsWith("DMS Push")) return { bg: "#EFF6FF", color: "#1D4ED8" };
    if (action.startsWith("Compliance Override")) return { bg: "#FEF3C7", color: "#92400E" };
    if (action.startsWith("Settings Change")) return { bg: "#F0FDF4", color: "#15803D" };
    if (action.startsWith("User Added")) return { bg: "#F5F3FF", color: "#5B21B6" };
    return { bg: COLORS.borderLight, color: COLORS.textSecondary };
  };

  return (
    <div>
      <SectionLabel>Audit Log</SectionLabel>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.borderLight }}>
              {["Action", "User", "Timestamp", "Details"].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.textMuted,
                    padding: "10px 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_ENTRIES.map((entry, i) => {
              const c = actionColor(entry.action);
              return (
                <tr key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: c.bg,
                        color: c.color,
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.textPrimary }}>
                    {entry.user}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {entry.time}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textSecondary, fontStyle: entry.detail ? "italic" : "normal" }}>
                    {entry.detail || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Admin Tab ─────────────────────────────────────────────────

function TabAdmin() {
  const [activeOpMake, setActiveOpMake] = useState(Object.keys(OP_CODES)[0]);
  const { brand, setBrand } = useBranding();
  const showWrenchIQBranding = brand === "WrenchIQ";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Header banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
        borderRadius: 12, padding: "18px 24px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <Database size={22} color="#FF6B35" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
            Op Codes — Branding & Op Code Registry
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Shop-level branding and the OEM-specific op code registry used for compliance checks.
          </div>
        </div>
      </div>

      {/* ── Branding Control ── */}
      <div>
        <SectionLabel>Branding</SectionLabel>
        <div style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "18px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
              WrenchIQ.ai Branding
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, maxWidth: 480 }}>
              When enabled, the WrenchIQ.ai wordmark is displayed throughout the shell. When disabled, the interface shows <strong>PrediiPowered™</strong> instead — suitable for white-label or co-branded deployments.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => setBrand(showWrenchIQBranding ? "PrediiPowered" : "WrenchIQ")}
              style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: showWrenchIQBranding ? "#FF6B35" : "#D1D5DB",
                position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: showWrenchIQBranding ? 26 : 4,
                width: 20, height: 20, borderRadius: 10,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: 10, fontWeight: 700, color: showWrenchIQBranding ? "#FF6B35" : COLORS.textMuted }}>
              {showWrenchIQBranding ? "WrenchIQ.ai" : "PrediiPowered™"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Op Code Registry by OEM ── */}
      <div>
        <SectionLabel>Op Code Registry by OEM</SectionLabel>

        {/* Make tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {Object.keys(OP_CODES).map((make) => (
            <button
              key={make}
              onClick={() => setActiveOpMake(make)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: activeOpMake === make ? COLORS.primary : COLORS.borderLight,
                color: activeOpMake === make ? "#fff" : COLORS.textSecondary,
                transition: "all 0.13s",
              }}
            >
              {make}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.borderLight, borderBottom: `1px solid ${COLORS.border}` }}>
                {["Op Code", "Description", "Flat Rate Hrs", "Pre-Auth", "Notes"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(OP_CODES[activeOpMake] || []).map((op, i) => (
                <tr key={op.code} style={{
                  borderBottom: i < OP_CODES[activeOpMake].length - 1 ? `1px solid ${COLORS.border}` : "none",
                  background: i % 2 === 0 ? "#fff" : COLORS.borderLight,
                }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 800, color: COLORS.primary, whiteSpace: "nowrap" }}>
                    {op.code}
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.textPrimary, lineHeight: 1.4 }}>
                    {op.description}
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.textSecondary, textAlign: "center", whiteSpace: "nowrap" }}>
                    {op.flatRateHrs} hrs
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    {op.preAuthThreshold ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
                        borderRadius: 4, padding: "2px 7px",
                      }}>
                        ${op.preAuthThreshold.toLocaleString()}+
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: COLORS.textMuted, fontStyle: op.notes ? "normal" : "italic" }}>
                    {op.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
          {(OP_CODES[activeOpMake] || []).length} op codes for {activeOpMake} &nbsp;·&nbsp;
          {Object.values(OP_CODES).flat().length} total op codes across {Object.keys(OP_CODES).length} makes &nbsp;·&nbsp;
          Source: Predii Normalized Content (demo data)
        </div>
      </div>

    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function OEMSettingsScreen() {
  const oemName = useEditionName("OEM");
  const [activeTab, setActiveTab] = useState("edition");

  const tabContent = {
    edition:    <TabEdition />,
    team:       <TabTeam />,
    audit:      <TabAuditLog />,
    admin:      <TabAdmin />,
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100%",
        background: COLORS.bg,
        boxSizing: "border-box",
      }}
    >
      {/* ── Left vertical tab nav ── */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          background: COLORS.bgCard,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        {/* Nav header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 20px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            marginBottom: 8,
          }}
        >
          <Settings size={16} color={COLORS.primary} />
          <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Settings</span>
        </div>

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                border: "none",
                background: active ? "#F0F7F9" : "transparent",
                color: active ? COLORS.primary : COLORS.textSecondary,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
                borderLeft: active ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                borderRight: "none",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 20px", fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
          {oemName}
          <br />
          {OEM_DEALER.name}
          <br />
          Predii, Inc.
        </div>
      </div>

      {/* ── Right content ── */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, margin: "0 0 4px" }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {OEM_DEALER.name} · {oemName}
          </div>
        </div>

        {tabContent[activeTab]}
      </div>
    </div>
  );
}
