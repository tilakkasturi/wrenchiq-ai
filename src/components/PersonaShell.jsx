// PersonaShell — wraps each persona with their own nav + top bar
import { useState } from "react";
import { useAppVersion, useAppBuilt } from "../hooks/useAppVersion";
import {
  Wrench, ClipboardList, ClipboardCheck, Package, Shield, Calendar,
  BarChart3, Settings, Building2, Sparkles, Bell, Search,
  LogOut, Hammer, CheckSquare, BarChart, Users, Truck,
  Home, Smartphone, Menu, FileText, Brain, Activity, SlidersHorizontal,
  Stethoscope, TrendingUp, ShoppingCart, LineChart, Zap, ArrowLeftRight,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import CustomerSelector from "./CustomerSelector";
import { SHOP } from "../data/demoData";
import WrenchIQAgent from "./WrenchIQAgent";
import BrandWordmark from "./BrandWordmark";
import PoweredByPredii from "./PoweredByPredii";
import { useBranding } from "../context/BrandingContext";
import { useDemo } from "../context/DemoContext";
import DemoConfigPanel from "./DemoConfigPanel";

// ── Per-persona nav configs ──────────────────────────────────
// moduleId maps each nav item to a MODULE_REGISTRY id so it can be
// hidden when that module is disabled in demo config.

const PERSONA_NAV = {
  advisor: [
    { id: "advisorHome",  label: "RO Queue & Board",   icon: ClipboardList, moduleId: "repairOrders" },
    { id: "job1Intake",   label: "Intake & Diagnosis",  icon: Stethoscope,   moduleId: "repairOrders" },
    { id: "job2ThreeC",   label: "3C Compliance",       icon: FileText,      moduleId: "storyWriter"  },
    { id: "job3Upsell",   label: "Smart Upsell",        icon: ShoppingCart,  moduleId: "roAdvisor"    },
    { id: "am3cWriter",   label: "3C Story Writer",     icon: CheckSquare,   moduleId: "storyWriter"  },
  ],
  advisorLite: [],
  tech: [
    { id: "techHome", label: "My Jobs",    icon: Hammer,        moduleId: "techMobile" },
    { id: "health",   label: "Reports",    icon: ClipboardCheck, moduleId: "dvi"       },
  ],
  owner: [
    { id: "ownerProtractor", label: "Daily View",               icon: Home,     moduleId: "dashboard" },
    { id: "opIntel",         label: "Operational Intelligence",  icon: Zap,      moduleId: "dashboard" },
    { id: "impactDash",      label: "Impact Dashboard",          icon: TrendingUp, moduleId: "analytics" },
    { id: "analytics",       label: "Reports",                   icon: BarChart3,  moduleId: "analytics" },
    { id: "settings",        label: "Settings",                  icon: Settings,   moduleId: "settings"  },
  ],
  customer: [],
  // OEM personas
  fixedOps: [
    { id: "fixedOpsHome",      label: "Warranty Dashboard", icon: BarChart3,  moduleId: "dashboard"      },
    { id: "warrantyAnalytics", label: "Analytics",          icon: BarChart,   moduleId: "analytics"      },
    { id: "oemNetwork",        label: "Dealer Group",       icon: Building2,  moduleId: "multiLocation"  },
    { id: "oemSettings",       label: "Settings",           icon: Settings,   moduleId: "settings"       },
  ],
  oemAdvisor: [
    { id: "roWriter",          label: "RO Story Writer",    icon: ClipboardList, moduleId: "storyWriter" },
    { id: "oemParts",          label: "OEM Parts Lane",     icon: Package,       moduleId: "parts"       },
    { id: "oemSettings",       label: "Settings",           icon: Settings,      moduleId: "settings"    },
  ],
  oemTech: [
    { id: "oemTechHome",       label: "My Jobs",            icon: Hammer,        moduleId: "techMobile"  },
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

export default function PersonaShell({
  persona,
  activeScreen,
  selectedRO = null,
  onNavigate,
  onExitPersona,
  onSwitchEdition,
  onLogout,
  onOpenSpecs,
  children,
  showAgent = true,
  embedded = false,
  embeddedScreens = null, // Set of screen IDs to show; null = all
}) {
  // In embedded mode (Chrome extension side panel), never show the agent panel —
  // the extension itself is the agent. Also hide demo/specs noise.
  const OEM_PERSONAS = ["fixedOps", "oemAdvisor", "oemTech"];
  const [agentVisible, setAgentVisible] = useState(
    !embedded && persona !== "tech" && persona !== "advisor" && !OEM_PERSONAS.includes(persona)
  );
  const [demoOpen, setDemoOpen] = useState(false);
  const { brand } = useBranding();
  const { shopName, ownerName, ownerInitials, smsName, moduleConfig } = useDemo();
  const appVersion = useAppVersion();
  const appBuilt = useAppBuilt();
  // Filter nav: embedded screens first, then disabled modules
  const enabledModules = moduleConfig?.modules ?? {};
  const allNavItems = PERSONA_NAV[persona] || [];
  const navItems = allNavItems.filter(item => {
    if (embedded && embeddedScreens && !embeddedScreens.has(item.id)) return false;
    if (item.moduleId && enabledModules[item.moduleId] === false) return false;
    return true;
  });
  const personaColor = PERSONA_COLORS[persona] || COLORS.primary;
  const personaLabel = PERSONA_LABELS[persona] || persona;
  const baseUser = PERSONA_USER[persona] || { name: "User", initials: "U" };
  // For owner/advisor personas use the demo-configurable name
  const user = (persona === "owner")
    ? { name: ownerName, initials: ownerInitials }
    : baseUser;

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
            <BrandWordmark size="sm" />
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
            <BrandWordmark size="nav" />
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

      {/* ── Main area + AI panel ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minWidth: 0 }}>

      {/* Screen content column */}
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
                <BrandWordmark size="bar" />
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

            {/* Powered by Predii — AM personas only, not embedded */}
            {!embedded && !OEM_PERSONAS.includes(persona) && (
              <PoweredByPredii variant="topbar" showSmsName />
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Customer Selector — Data Feed Model override (not for tech) */}
            {persona !== "tech" && <CustomerSelector />}

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

            {/* Edition switcher — AM ↔ OEM */}
            {!embedded && onSwitchEdition && (() => {
              const isOEM = OEM_PERSONAS.includes(persona);
              return (
                <button
                  onClick={onSwitchEdition}
                  title={isOEM ? "Switch to WrenchIQ-AM" : "Switch to WrenchIQ-OEM"}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 10px", borderRadius: 8, cursor: "pointer",
                    border: "1px solid #E5E7EB",
                    background: "#F9FAFB",
                    color: COLORS.textSecondary,
                    fontSize: 12, fontWeight: 600,
                  }}
                >
                  <ArrowLeftRight size={13} />
                  {isOEM ? "AM" : "OEM"}
                </button>
              );
            })()}

            {/* Demo config (hidden in embedded mode) */}
            {!embedded && <button
              onClick={() => setDemoOpen(v => !v)}
              title="Demo Setup"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: `1px solid ${demoOpen ? COLORS.accent : "#E5E7EB"}`, cursor: "pointer", background: demoOpen ? `${COLORS.accent}12` : "#F9FAFB", color: demoOpen ? COLORS.accent : COLORS.textSecondary, fontSize: 12, fontWeight: 600 }}
            >
              <SlidersHorizontal size={13} />
              Demo
            </button>}

            {/* Specs (hidden in embedded mode) */}
            {!embedded && onOpenSpecs && (
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "default" }}>
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
                    {["fixedOps", "oemAdvisor", "oemTech"].includes(persona) ? "Palo Alto Toyota" : shopName}
                  </div>
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Log out"
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "4px 6px", borderRadius: 6,
                    color: COLORS.textMuted,
                    display: "flex", alignItems: "center",
                    transition: "color 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#EF4444"}
                  onMouseLeave={e => e.currentTarget.style.color = COLORS.textMuted}
                >
                  <LogOut size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          {children}
        </div>

        {/* Footer — pinned to bottom (hidden in embedded mode) */}
        {!embedded && <div style={{
          borderTop: "1px solid #E5E7EB",
          background: "#fff",
          padding: "6px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BrandWordmark size="sm" />
            {["fixedOps", "oemAdvisor", "oemTech"].includes(persona) ? (
              <span style={{ fontSize: 9, fontWeight: 800, background: "#E0F2F1", color: "#0D3B45", border: "1px solid #80CBC4", borderRadius: 4, padding: "1px 5px" }}>OEM</span>
            ) : (
              <span style={{ fontSize: 9, fontWeight: 800, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 4, padding: "1px 5px" }}>AM</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>
            <span style={{ fontWeight: 600, color: "#6B7280", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
            {appVersion && <span style={{ color: "#D1D5DB", marginLeft: 8 }}>{appVersion}{appBuilt ? ` · ${appBuilt}` : ""}</span>}
          </div>
        </div>}
      </div>{/* end screen content column */}

      {/* AI Panel — right column, full height (hidden in embedded mode) */}
      {!embedded && agentVisible && persona !== "tech" && (
        <WrenchIQAgent
          activeScreen={activeScreen}
          persona={persona}
          selectedRO={selectedRO}
          onHide={() => setAgentVisible(false)}
        />
      )}

      </div>{/* end main area + AI panel */}

      {/* Demo config panel */}
      {demoOpen && <DemoConfigPanel onClose={() => setDemoOpen(false)} />}
    </div>
  );
}
