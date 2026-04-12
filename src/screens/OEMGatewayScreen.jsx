// AE-791 — WrenchIQ-OEM: Dealer Persona Gateway
import { useState } from "react";
import { Wrench, ChevronRight, BarChart3, ClipboardList, Hammer, Shield, Building2, CheckCircle } from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_DEALER, WARRANTY_CLAIMS } from "../data/oemDemoData";
import { useEditionName } from "../context/BrandingContext";

const OEM_PERSONAS = [
  {
    id: "fixedOps",
    label: "Fixed Ops Director",
    tagline: "Warranty Performance Command Center",
    detail: "Warranty approval rate · Per-advisor compliance scores · Dollars at risk · Rejection root causes · Multi-dealer rollup",
    accent: "#0D3B45",
    bg: "rgba(13,59,69,0.08)",
    icon: BarChart3,
    badge: `${WARRANTY_CLAIMS.thisMonth.approvalRate}% approval rate`,
    defaultScreen: "fixedOpsHome",
  },
  {
    id: "oemAdvisor",
    label: "Service Advisor",
    tagline: "3C Story Writer — OEM-Compliant Narratives",
    detail: "AI-generated complaint/cause/correction · Op code matching · Warranty compliance checker · One-click DMS push to CDK, R&R, Dealertrack",
    accent: "#2563EB",
    bg: "rgba(37,99,235,0.06)",
    icon: ClipboardList,
    badge: "3 ROs pending write-up",
    defaultScreen: "roWriter",
  },
  {
    id: "oemTech",
    label: "Technician",
    tagline: "OEM Bay View — Op Codes & TSB Match",
    detail: "Assigned jobs · TSB auto-match by VIN + complaint · OEM op code lookup · DTC entry · Voice note → RO Story Writer · Warranty flag",
    accent: "#16A34A",
    bg: "rgba(22,163,74,0.06)",
    icon: Hammer,
    badge: "2 active jobs",
    defaultScreen: "oemTechHome",
  },
];

export default function OEMGatewayScreen({ onSelectPersona, onBack, standaloneMode = false }) {
  const amName  = useEditionName("AM");
  const oemName = useEditionName("OEM");
  const [hovered, setHovered] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(160deg, #0D2A3A 0%, #0D1F2D 55%, #111827 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 24px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Wordmark */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wrench size={19} color="#fff" style={{ transform: "rotate(-45deg)" }} />
        </div>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.8, color: "#fff" }}>
          WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
        </span>
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
          color: "#0D3B45", background: "#E0F2F1",
          border: "1px solid #80CBC4",
          borderRadius: 5, padding: "2px 8px",
        }}>OEM</span>
      </div>

      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8, fontWeight: 400 }}>
        {OEM_DEALER.name} · {OEM_DEALER.address.split(",").slice(1, 3).join(",").trim()}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginBottom: 36, display: "flex", alignItems: "center", gap: 10 }}>
        <span>Dealer Code: {OEM_DEALER.dealerCode}</span>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        <span>DMS: {OEM_DEALER.dms}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#4ADE80" }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: "#4ADE80" }} />
          Connected
        </span>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>|</span>
        <span>{OEM_DEALER.bays} bays · {OEM_DEALER.advisorCount} advisors</span>
      </div>

      {/* Quick stats bar */}
      <div style={{
        display: "flex", gap: 12, marginBottom: 28,
        width: "100%", maxWidth: 780,
      }}>
        {[
          { label: "This Month — Submitted",    value: `$${(WARRANTY_CLAIMS.thisMonth.dollarSubmitted / 1000).toFixed(0)}K`,  sub: `${WARRANTY_CLAIMS.thisMonth.submitted} claims`, color: "rgba(255,255,255,0.7)" },
          { label: "Approved",                  value: `$${(WARRANTY_CLAIMS.thisMonth.dollarApproved / 1000).toFixed(0)}K`,  sub: `${WARRANTY_CLAIMS.thisMonth.approved} claims`, color: "#4ADE80" },
          { label: "Approval Rate",             value: `${WARRANTY_CLAIMS.thisMonth.approvalRate}%`,                          sub: "vs 83% last month",     color: "#4ADE80" },
          { label: "Rejected",                  value: `$${(WARRANTY_CLAIMS.thisMonth.dollarRejected / 1000).toFixed(0)}K`,  sub: `${WARRANTY_CLAIMS.thisMonth.rejected} claims`, color: "#FCA5A5" },
        ].map((s) => (
          <div key={s.label} style={{
            flex: 1, background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12, padding: "12px 16px",
          }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 0.6, textTransform: "uppercase", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, letterSpacing: -0.5 }}>{s.value}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Persona cards */}
      <div style={{ display: "flex", gap: 14, width: "100%", maxWidth: 780, marginBottom: 28 }}>
        {OEM_PERSONAS.map((p) => {
          const isHov = hovered === p.id;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPersona(p.id, { defaultScreen: p.defaultScreen })}
              onMouseEnter={() => setHovered(p.id)}
              onMouseLeave={() => setHovered(null)}
              style={{
                flex: 1,
                background: isHov ? "#fff" : "rgba(255,255,255,0.04)",
                border: isHov ? `2px solid ${p.accent}` : "1.5px solid rgba(255,255,255,0.1)",
                borderRadius: 16, padding: "20px 18px",
                cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
                transform: isHov ? "translateY(-2px)" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: isHov ? `${p.accent}18` : "rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={20} color={isHov ? p.accent : "rgba(255,255,255,0.6)"} />
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700,
                  color: isHov ? p.accent : "rgba(255,255,255,0.4)",
                  background: isHov ? `${p.accent}14` : "rgba(255,255,255,0.07)",
                  borderRadius: 5, padding: "2px 8px",
                }}>{p.badge}</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isHov ? "#111827" : "#fff", marginBottom: 4 }}>{p.label}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: isHov ? p.accent : "rgba(255,255,255,0.5)", marginBottom: 8 }}>{p.tagline}</div>
              <div style={{ fontSize: 10, color: isHov ? "#6B7280" : "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>{p.detail}</div>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <ChevronRight size={14} color={isHov ? p.accent : "rgba(255,255,255,0.2)"} />
              </div>
            </button>
          );
        })}
      </div>

      {/* What OEM edition includes */}
      <div style={{
        width: "100%", maxWidth: 780,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: "14px 20px",
        display: "flex", alignItems: "center", gap: 28,
        marginBottom: 24,
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.6, textTransform: "uppercase", whiteSpace: "nowrap" }}>OEM Edition includes</div>
        {[
          "3C Story Writer",
          "CDK / R&R / Dealertrack Push",
          "Warranty Compliance Checker",
          "OEM Op Code Matching",
          "Multi-Dealer Group Hub",
          "Technician Mobile Bay View",
        ].map((f) => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <CheckCircle size={11} color="#4ADE80" />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{f}</span>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {!standaloneMode && (
          <button
            onClick={onBack}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 8, padding: "7px 16px", cursor: "pointer", color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}
          >
            ← Switch to {amName}
          </button>
        )}
        <button
          onClick={() => onSelectPersona("oemAdmin")}
          style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 16px", cursor: "pointer", color: "rgba(255,255,255,0.28)", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}
        >
          <Shield size={11} />
          OEM Admin View
        </button>
      </div>

      <div style={{ position: "absolute", bottom: 16, right: 20, fontSize: 10, color: "rgba(255,255,255,0.15)" }}>
        © {new Date().getFullYear()} Predii, Inc. · PREDII CONFIDENTIAL
      </div>
    </div>
  );
}
