import { useState } from "react";
import {
  Users, FileText, Settings2,
  CheckCircle, Key,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useEditionName, useBranding } from "../context/BrandingContext";
import { SHOP, technicians, advisors } from "../data/demoData";

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "team",         label: "Team",              icon: Users },
  { id: "audit",        label: "Audit Log",         icon: FileText },
  { id: "system",       label: "System",            icon: Settings2 },
];

// ── Demo audit data ───────────────────────────────────────────
const AUDIT_ENTRIES = [
  { action: "Predii API key rotated",                user: "Tilak K.",     time: "March 24  9:02 AM",  detail: "" },
  { action: "Integration connected — Meta Business", user: "Marcus J.",    time: "March 21  3:17 PM",  detail: "" },
  { action: "Team member added — Priya Nair",        user: "Tilak K.",     time: "March 18  11:30 AM", detail: "" },
  { action: "AI settings updated — tone: friendly",  user: "Marcus J.",    time: "March 15  2:05 PM",  detail: "" },
  { action: "Shop profile updated — labor rate $195",user: "Tilak K.",     time: "March 1   9:00 AM",  detail: "" },
];

// ── Helpers ───────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────
function TeamTab() {
  const allMembers = [
    ...advisors.map(a => ({ ...a, role: "Service Advisor" })),
    ...technicians.map(t => ({ ...t, role: "Technician" })),
  ];
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Team Members</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{SHOP.name} · {allMembers.length} members</div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Invite Member
        </button>
      </div>
      <Card style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>NAME</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>ROLE</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                      {m.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: COLORS.textSecondary }}>{m.role}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#15803D", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: "#22c55e" }} />
                    Active
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────
function AuditTab() {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Audit Log</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>All admin actions · 90-day retention</div>
      </div>
      <Card style={{ padding: 0 }}>
        {AUDIT_ENTRIES.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < AUDIT_ENTRIES.length - 1 ? `1px solid ${COLORS.borderLight}` : "none" }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: COLORS.accent, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{e.action}</div>
              {e.detail && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{e.detail}</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{e.user}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{e.time}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────
function SystemTab() {
  const { brand, setBrand } = useBranding();
  const isPredii = brand === "PrediiPowered";
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>System</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Edition config, API credentials, Predii connection</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Brand */}
        <Card>
          <SectionLabel>Branding</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                PrediiPowered mode
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {isPredii
                  ? "Showing Predii branding — logo, wordmark, and footer reflect the Predii identity."
                  : "Showing WrenchIQ branding. Enable to switch to PrediiPowered identity."}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0, marginLeft: 24 }}>
              <div
                onClick={() => setBrand(isPredii ? "WrenchIQ" : "PrediiPowered")}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: isPredii ? COLORS.primary : COLORS.border,
                  position: "relative", cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: isPredii ? 21 : 3,
                  width: 16, height: 16, borderRadius: 8, background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isPredii ? COLORS.primary : COLORS.textMuted }}>
                {isPredii ? "On" : "Off"}
              </span>
            </label>
          </div>
        </Card>

        {/* Edition */}
        <Card>
          <SectionLabel>Product Edition</SectionLabel>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, border: `2px solid ${COLORS.accent}`, borderRadius: 8, padding: 14, background: `${COLORS.accent}08` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle size={14} color={COLORS.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{amName}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Aftermarket · Independent shops & corporate groups · Full SMS platform</div>
            </div>
            <div style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, opacity: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${COLORS.border}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>{oemName}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>OEM Dealerships · RO Story Writer only · DMS integrations</div>
            </div>
          </div>
        </Card>

        {/* Predii connection */}
        <Card>
          <SectionLabel>Predii Core Connection</SectionLabel>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Key size={13} /> Rotate API Key
          </button>
        </Card>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AMAdminScreen() {
  const amName  = useEditionName("AM");
  const oemName = useEditionName("OEM");
  const [tab, setTab] = useState("team");

  return (
    <div style={{ display: "flex", height: "100%", background: COLORS.bg }}>

      {/* Left sidebar */}
      <div style={{ width: 200, background: "#fff", borderRight: `1px solid ${COLORS.border}`, padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Admin</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{amName}</div>
        </div>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 16px", border: "none", cursor: "pointer",
                background: active ? `${COLORS.accent}12` : "transparent",
                color: active ? COLORS.accent : COLORS.textSecondary,
                borderRight: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                fontSize: 13, fontWeight: active ? 600 : 400,
                textAlign: "left",
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {tab === "team"         && <TeamTab />}
        {tab === "audit"        && <AuditTab />}
        {tab === "system"       && <SystemTab />}
      </div>
    </div>
  );
}
