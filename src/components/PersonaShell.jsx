// PersonaShell — wraps each persona with their own nav + top bar
import { useState } from "react";
import {
  Wrench, ClipboardList, ClipboardCheck, Package, Shield, Calendar,
  BarChart3, Settings, Building2, Sparkles, Bell, Search,
  LogOut, Hammer, CheckSquare, BarChart, Users, Truck,
  Home, Smartphone, Menu,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP } from "../data/demoData";
import WrenchIQAgent from "./WrenchIQAgent";

// ── Per-persona nav configs ──────────────────────────────────

const PERSONA_NAV = {
  advisor: [
    { id: "advisorHome", label: "RO Queue & Board", icon: ClipboardList },
    { id: "parts",       label: "Parts Intelligence", icon: Package },
    { id: "scheduling",  label: "Scheduling",         icon: Calendar },
    { id: "trust",       label: "Trust Engine",       icon: Shield },
  ],
  advisorLite: [],
  tech: [
    { id: "techHome", label: "My Jobs",    icon: Hammer },
    { id: "health",   label: "Reports",    icon: ClipboardCheck },
  ],
  owner: [
    { id: "ownerHome",  label: "Today",      icon: Home },
    { id: "analytics",  label: "Reports",    icon: BarChart3 },
    { id: "network",    label: "Locations",  icon: Building2 },
    { id: "trust",      label: "Customers",  icon: Shield },
    { id: "settings",   label: "Settings",   icon: Settings },
  ],
  customer: [],
  // OEM personas
  fixedOps: [
    { id: "fixedOpsHome",      label: "Warranty Dashboard", icon: BarChart3 },
    { id: "warrantyAnalytics", label: "Analytics",          icon: BarChart },
    { id: "oemNetwork",        label: "Dealer Group",       icon: Building2 },
    { id: "oemSettings",       label: "Settings",           icon: Settings },
  ],
  oemAdvisor: [
    { id: "roWriter",          label: "RO Story Writer",    icon: ClipboardList },
    { id: "oemParts",          label: "OEM Parts Lane",     icon: Package },
    { id: "oemSettings",       label: "Settings",           icon: Settings },
  ],
  oemTech: [
    { id: "oemTechHome",       label: "My Jobs",            icon: Hammer },
  ],
};

const PERSONA_LABELS = {
  advisor:     "Service Advisor",
  advisorLite: "Intelligent RO",
  tech:        "Technician",
  owner:       "Shop Owner",
  customer:    "Car Owner",
  fixedOps:    "Fixed Ops Director",
  oemAdvisor:  "Service Advisor",
  oemTech:     "Technician",
};

const PERSONA_COLORS = {
  advisor:     "#2563EB",
  advisorLite: COLORS.accent,
  tech:        "#16A34A",
  owner:       COLORS.accent,
  customer:    "#7C3AED",
  fixedOps:    "#0D3B45",
  oemAdvisor:  "#2563EB",
  oemTech:     "#16A34A",
};

// ── Tech name for persona top bar ───────────────────────────

const PERSONA_USER = {
  advisor:     { name: "James K.", initials: "JK" },
  advisorLite: { name: "Service Advisor", initials: "SA" },
  tech:        { name: "Marcus Williams", initials: "MW" },
  owner:       { name: SHOP.owner, initials: SHOP.ownerInitials },
  customer:    { name: "Monica R.", initials: "MR" },
  fixedOps:    { name: "Ryan Cho", initials: "RC" },
  oemAdvisor:  { name: "Jessica Torres", initials: "JT" },
  oemTech:     { name: "Marcus Williams", initials: "MW" },
};

// ── Shell component ─────────────────────────────────────────

// ── PrediiPowered wordmark ───────────────────────────────────
function PrediiPoweredMark({ size = "md" }) {
  const isSmall = size === "sm";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: isSmall ? 4 : 6 }}>
      {/* Predii 3-curves SVG */}
      <svg width={isSmall ? 14 : 18} height={isSmall ? 14 : 18} viewBox="0 0 24 24" fill="none">
        <path d="M4 8 Q12 2 20 8"  stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M4 12 Q12 6 20 12" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M4 16 Q12 10 20 16" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
      </svg>
      <span style={{ fontSize: isSmall ? 11 : 13, fontWeight: 800, letterSpacing: -0.3, color: "#0D3B45" }}>
        Predii<span style={{ color: "#FF6B35" }}>Powered</span>
        <sup style={{ fontSize: isSmall ? 7 : 8, color: "#9CA3AF", fontWeight: 600 }}>™</sup>
      </span>
    </div>
  );
}

export default function PersonaShell({
  persona,
  activeScreen,
  onNavigate,
  onExitPersona,
  onOpenSpecs,
  children,
  showAgent = true,
  showWrenchIQBranding = true,
}) {
  const [agentVisible, setAgentVisible] = useState(persona === "owner" || persona === "advisor");
  const navItems = PERSONA_NAV[persona] || [];
  const personaColor = PERSONA_COLORS[persona] || COLORS.primary;
  const personaLabel = PERSONA_LABELS[persona] || persona;
  const user = PERSONA_USER[persona] || { name: "User", initials: "U" };

  // Customer persona: no shell chrome at all
  if (persona === "customer") {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Minimal customer top strip */}
        <div style={{
          height: 40,
          background: COLORS.primary,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 18, height: 18, borderRadius: 5, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={10} color="#fff" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span></span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {onOpenSpecs && (
              <button
                onClick={onOpenSpecs}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}
              >
                <Menu size={11} />
                Specs
              </button>
            )}
            <button
              onClick={onExitPersona}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", color: "rgba(255,255,255,0.6)", fontSize: 11 }}
            >
              Exit
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Left Nav ── */}
      <div style={{
        width: 60,
        background: COLORS.bgDark,
        display: "flex", flexDirection: "column",
        flexShrink: 0,
      }}>
        {/* Logo — click to return to gateway */}
        <div style={{
          padding: "14px 0",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <button
            onClick={onExitPersona}
            title="Back to home"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={18} color="#fff" style={{ transform: "rotate(-45deg)" }} />
            </div>
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "8px 7px", display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map((item) => {
            const active = activeScreen === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                title={item.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? `${personaColor}28` : "transparent",
                  color: active ? personaColor : "rgba(255,255,255,0.45)",
                  transition: "all 0.15s",
                  width: "100%",
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        {/* Exit persona button */}
        <div style={{ padding: "10px 7px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={onExitPersona}
            title="Switch persona"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "transparent",
              color: "rgba(255,255,255,0.3)",
              transition: "all 0.15s",
              width: "100%",
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* ── Main area ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Top bar */}
        <div style={{
          height: 56, background: "#fff",
          borderBottom: "1px solid #E5E7EB",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Wordmark — click to return to gateway */}
            <button
              onClick={onExitPersona}
              title="Back to home"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showWrenchIQBranding ? (
                <>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={13} color="#fff" style={{ transform: "rotate(-45deg)" }} />
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, color: COLORS.textPrimary }}>
                    WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
                  </span>
                </>
              ) : (
                <PrediiPoweredMark size="md" />
              )}
            </button>

            {/* Persona badge */}
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
              color: personaColor,
              background: `${personaColor}14`,
              border: `1px solid ${personaColor}35`,
              borderRadius: 6, padding: "3px 8px",
            }}>
              {personaLabel}
            </span>

            {/* Breadcrumb */}
            <span style={{ fontSize: 12, color: COLORS.textMuted }}>
              {navItems.find(n => n.id === activeScreen)?.label || ""}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Search (not for tech) */}
            {persona !== "tech" && (
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "#F9FAFB", borderRadius: 10, padding: "6px 12px",
                width: 220, border: "1px solid #E5E7EB",
              }}>
                <Search size={13} color={COLORS.textMuted} />
                <input
                  placeholder="Search customers, VINs, ROs…"
                  style={{ border: "none", outline: "none", background: "transparent", fontSize: 11, flex: 1, color: COLORS.textPrimary }}
                />
              </div>
            )}

            {/* AI toggle (not for tech) */}
            {showAgent && persona !== "tech" && (
              <button
                onClick={() => setAgentVisible(v => !v)}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 10px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: agentVisible ? "rgba(255,107,53,0.12)" : "#F3F4F6",
                  color: agentVisible ? COLORS.accent : COLORS.textSecondary,
                  fontSize: 12, fontWeight: 600,
                }}
              >
                <Sparkles size={13} />
                AI
              </button>
            )}

            {/* Specs */}
            {onOpenSpecs && (
              <button
                onClick={onOpenSpecs}
                title="Specifications"
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid #E5E7EB", cursor: "pointer", background: "#F9FAFB", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600 }}
              >
                <Menu size={14} />
                Specs
              </button>
            )}

            {/* Notifications */}
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={18} color={COLORS.textSecondary} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: COLORS.accent, border: "2px solid #fff" }} />
            </div>

            {/* User */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: personaColor,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 11, fontWeight: 700,
              }}>
                {user.initials}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>
                  {["fixedOps", "oemAdvisor", "oemTech"].includes(persona) ? "Palo Alto Toyota" : SHOP.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {children}
        </div>

        {/* Footer — pinned to bottom */}
        <div style={{
          borderTop: "1px solid #E5E7EB",
          background: "#fff",
          padding: "6px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {showWrenchIQBranding ? (
              <>
                <div style={{ width: 18, height: 18, borderRadius: 5, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={10} color="#fff" style={{ transform: "rotate(-45deg)" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: -0.3, color: COLORS.textPrimary }}>
                  WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
                </span>
              </>
            ) : (
              <PrediiPoweredMark size="sm" />
            )}
            {["fixedOps", "oemAdvisor", "oemTech"].includes(persona) ? (
              <span style={{ fontSize: 9, fontWeight: 800, background: "#E0F2F1", color: "#0D3B45", border: "1px solid #80CBC4", borderRadius: 4, padding: "1px 5px" }}>OEM</span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 800, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 4, padding: "1px 5px" }}>AM</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>
            <span style={{ fontWeight: 600, color: "#6B7280", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
          </div>
        </div>
      </div>

      {/* Floating AI Agent */}
      {agentVisible && persona !== "tech" && (
        <WrenchIQAgent
          activeScreen={activeScreen}
          persona={persona}
          onHide={() => setAgentVisible(false)}
        />
      )}
    </div>
  );
}
