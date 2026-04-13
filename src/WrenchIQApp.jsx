import { useState } from "react";
import { useAppVersion } from "./hooks/useAppVersion";
import {
  Wrench, Home, ClipboardList, Smartphone, BarChart3, Settings,
  Search, Bell, Camera, Sparkles, MessageSquare,
  Shield, Zap, Building2, FileText, Calendar, Package, Cpu, Menu, Database, Share2,
} from "lucide-react";
import SpecificationsPanel from "./components/SpecificationsPanel";
import { COLORS } from "./theme/colors";
import { SHOP } from "./data/demoData";
import BrandWordmark from "./components/BrandWordmark";
import { RecommendationsProvider } from "./context/RecommendationsContext";


// ── Screens ──────────────────────────────────────────────────
import DashboardScreen from "./screens/DashboardScreen";
import DVIScreen from "./screens/DVIScreen";
import RepairOrderScreen from "./screens/RepairOrderScreen";
import CustomerPortalScreen from "./screens/CustomerPortalScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";
import SettingsScreen from "./screens/SettingsScreen";
import WrenchIQAgent from "./components/WrenchIQAgent";
import SocialInboxScreen from "./screens/SocialInboxScreen";
import MultiLocationScreen from "./screens/MultiLocationScreen";
import TrustEngineScreen from "./screens/TrustEngineScreen";
import HealthReportScreen from "./screens/HealthReportScreen";
import IntegrationsScreen from "./screens/IntegrationsScreen";
import SmartSchedulingScreen from "./screens/SmartSchedulingScreen";
import PartsIntelligenceScreen from "./screens/PartsIntelligenceScreen";
import TechMobileScreen from "./screens/TechMobileScreen";
import IntelligentROScreen from "./screens/IntelligentROScreen";
import AMAdminScreen from "./screens/AMAdminScreen";
import AM3CStoryWriterScreen from "./screens/AM3CStoryWriterScreen";
import KnowledgeGraphScreen from "./screens/KnowledgeGraphScreen";
import AIInsightsScreen from "./screens/AIInsightsScreen";
import AIAgentScreen from "./screens/AIAgentScreen";
import AROAgentScreen from "./screens/AROAgentScreen";

// ── Persona screens ───────────────────────────────────────────
import LoginScreen from "./screens/LoginScreen";
import PersonaGatewayScreen from "./screens/PersonaGatewayScreen";
import PersonaShell from "./components/PersonaShell";
import AdvisorHomeScreen from "./screens/AdvisorHomeScreen";
import TechHomeScreen from "./screens/TechHomeScreen";
import TechDVIScreen from "./screens/TechDVIScreen";
import OwnerCommandCenterScreen from "./screens/OwnerCommandCenterScreen";

// ── OEM screens ───────────────────────────────────────────────
import OEMGatewayScreen from "./screens/OEMGatewayScreen";
import ROStoryWriterScreen from "./screens/ROStoryWriterScreen";
import FixedOpsDashboardScreen from "./screens/FixedOpsDashboardScreen";
import WarrantyAnalyticsScreen from "./screens/WarrantyAnalyticsScreen";
import OEMDealerGroupScreen from "./screens/OEMDealerGroupScreen";
import OEMTechScreen from "./screens/OEMTechScreen";
import OEMPartsScreen from "./screens/OEMPartsScreen";
import OEMSettingsScreen from "./screens/OEMSettingsScreen";
import GWGCorporateScreen            from "./screens/GWGCorporateScreen";
import Job1IntakeScreen              from "./screens/Job1IntakeScreen";
import Job2ThreeCScreen              from "./screens/Job2ThreeCScreen";
import Job3UpsellScreen              from "./screens/Job3UpsellScreen";
import OperationalIntelligenceScreen from "./screens/OperationalIntelligenceScreen";
import ImpactDashboardScreen         from "./screens/ImpactDashboardScreen";

// ── Admin screen registry ────────────────────────────────────

const ADMIN_SCREENS = [
  { id: "dashboard",    label: "Command Center",    icon: Home,          component: DashboardScreen,         group: "shop" },
  { id: "social",       label: "Social Inbox",       icon: MessageSquare, component: SocialInboxScreen,       group: "shop", badge: 4 },
  { id: "scheduling",   label: "Smart Scheduling",   icon: Calendar,      component: SmartSchedulingScreen,   group: "shop" },
  { id: "dvi",          label: "Inspection",         icon: Camera,        component: DVIScreen,               group: "shop" },
  { id: "health",       label: "Health Report",      icon: FileText,      component: HealthReportScreen,      group: "shop" },
  { id: "orders",       label: "Repair Orders",      icon: ClipboardList, component: RepairOrderScreen,       group: "shop" },
  { id: "parts",        label: "Parts Intelligence", icon: Package,       component: PartsIntelligenceScreen, group: "shop" },
  { id: "techview",     label: "Tech Mobile",        icon: Cpu,           component: TechMobileScreen,        group: "shop" },
  { id: "trust",        label: "Trust Engine",       icon: Shield,        component: TrustEngineScreen,       group: "shop" },
  { id: "customer",     label: "Customer Portal",    icon: Smartphone,    component: CustomerPortalScreen,    group: "shop" },
  { id: "analytics",    label: "Analytics",          icon: BarChart3,     component: AnalyticsScreen,         group: "insights" },
  { id: "network",      label: "Network (100 Loc)",  icon: Building2,     component: MultiLocationScreen,     group: "insights" },
  { id: "aiInsights",   label: "AI Insights",        icon: Sparkles,      component: AIInsightsScreen,        group: "insights" },
  { id: "knowledge",    label: "Knowledge Graph",    icon: Share2,        component: KnowledgeGraphScreen,    group: "insights" },
  { id: "am3cWriter",   label: "3C Story Writer",    icon: FileText,      component: AM3CStoryWriterScreen,   group: "shop" },
  { id: "settings",     label: "Settings",           icon: Settings,      component: SettingsScreen,          group: "system" },
  { id: "amAdmin",      label: "Admin",              icon: Database,      component: AMAdminScreen,           group: "admin" },
];

// ── Persona screen resolvers ─────────────────────────────────

function resolvePersonaScreen(persona, screenId, extraProps) {
  // Advisor persona screens
  if (persona === "advisor") {
    if (screenId === "advisorHome") return <AdvisorHomeScreen {...extraProps} />;
    if (screenId === "aiAgent")     return <AIAgentScreen />;
    if (screenId === "aroAgent")    return <AROAgentScreen />;
    if (screenId === "am3cWriter")  return <AM3CStoryWriterScreen />;
    if (screenId === "orders")     return <RepairOrderScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "parts")      return <PartsIntelligenceScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "scheduling") return <SmartSchedulingScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "trust")      return <TrustEngineScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "job1Intake") return <Job1IntakeScreen />;
    if (screenId === "job2ThreeC") return <Job2ThreeCScreen />;
    if (screenId === "job3Upsell") return <Job3UpsellScreen />;
  }

  // Tech persona screens
  if (persona === "tech") {
    if (screenId === "techHome")  return <TechHomeScreen onOpenDVI={extraProps.onOpenDVI} />;
    if (screenId === "techDVI")   return <TechDVIScreen roData={extraProps.roData} onBack={extraProps.onBack} onComplete={extraProps.onComplete} />;
    if (screenId === "health")    return <HealthReportScreen onNavigate={extraProps.onNavigate} />;
  }

  // Owner persona screens
  if (persona === "owner") {
    if (screenId === "ownerHome")  return <OwnerCommandCenterScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "analytics")  return <AnalyticsScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "network")    return <MultiLocationScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "trust")      return <TrustEngineScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "settings")      return <SettingsScreen onNavigate={extraProps.onNavigate} />;
    if (screenId === "opIntel")       return <OperationalIntelligenceScreen />;
    if (screenId === "impactDash")    return <ImpactDashboardScreen />;
  }

  // Advisor Lite persona (Intelligent RO only)
  if (persona === "advisorLite") {
    return <IntelligentROScreen initialCust={extraProps.roInitialCust} initialStep={extraProps.roInitialStep} />;
  }

  // Customer persona
  if (persona === "customer") {
    return <CustomerPortalScreen standaloneMode={true} />;
  }

  // OEM — Fixed Ops Director
  if (persona === "fixedOps") {
    if (screenId === "fixedOpsHome")      return <FixedOpsDashboardScreen />;
    if (screenId === "warrantyAnalytics") return <WarrantyAnalyticsScreen />;
    if (screenId === "oemNetwork")        return <OEMDealerGroupScreen />;
    if (screenId === "oemSettings")       return <OEMSettingsScreen />;
  }

  // OEM — Service Advisor
  if (persona === "oemAdvisor") {
    if (screenId === "roWriter")   return <ROStoryWriterScreen />;
    if (screenId === "oemParts")   return <OEMPartsScreen />;
    if (screenId === "oemSettings") return <OEMSettingsScreen />;
  }

  // OEM — Technician
  if (persona === "oemTech") {
    if (screenId === "oemTechHome") return <OEMTechScreen />;
  }

  // GWG Corporate
  if (persona === "gwgCorporate") {
    return <GWGCorporateScreen />;
  }

  return <DashboardScreen onNavigate={extraProps.onNavigate} />;
}

// ── Default screen per persona ───────────────────────────────

const PERSONA_DEFAULT_SCREEN = {
  advisor:      "advisorHome",
  advisorLite:  "intelligentRO",
  tech:         "techHome",
  owner:        "ownerHome",
  customer:     "customerPortal",
  fixedOps:     "fixedOpsHome",
  oemAdvisor:   "roWriter",
  oemTech:      "oemTechHome",
  gwgCorporate: "gwgCorporate",
};

// ── Main App ─────────────────────────────────────────────────

export default function WrenchIQApp() {
  const appVersion = useAppVersion();
  const [authenticated, setAuthenticated] = useState(false);
  const [activePersona, setActivePersona] = useState(null);
  const [activeScreen, setActiveScreen]   = useState("dashboard");
  const [agentVisible, setAgentVisible]   = useState(true);
  const [specsOpen, setSpecsOpen]         = useState(false);
  const [showOEMGateway, setShowOEMGateway] = useState(false);

  // Tech-specific DVI state (screen within screen)
  const [techDVIData, setTechDVIData] = useState(null);

  // Advisor RO selection — lifted so WrenchIQAgent can narrow its insights
  const [advisorSelectedRO, setAdvisorSelectedRO] = useState(null);

  // Intelligent RO pre-selection (from gateway queue)
  const [roInitialCust, setRoInitialCust] = useState(null);
  const [roInitialStep, setRoInitialStep] = useState(1);

  // ── Login gate ───────────────────────────────────────────────
  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  // ── Gateway (combined AM + OEM) ───────────────────────────
  if (!activePersona) {
    return (
      <>
        <PersonaGatewayScreen
          onSelectPersona={(p, opts = {}) => {
            setRoInitialCust(opts.initialCust || null);
            setRoInitialStep(opts.initialStep || 1);
            setActivePersona(p);
            if (p === "admin") {
              setActiveScreen("dashboard");
            } else {
              setActiveScreen(PERSONA_DEFAULT_SCREEN[p] || "dashboard");
            }
          }}
          onOpenSpecs={() => setSpecsOpen(true)}
          onOpenOEM={(personaId) => {
            // personaId is optional — defaults to oemAdvisor (RO Story Writer)
            const p = personaId || "oemAdvisor";
            setActivePersona(p);
            setActiveScreen(PERSONA_DEFAULT_SCREEN[p] || "roWriter");
          }}
        />
        {specsOpen && <SpecificationsPanel onClose={() => setSpecsOpen(false)} />}
      </>
    );
  }

  // ── Tech DVI screen (full-screen override within tech persona) ──
  const isTechDVI = activePersona === "tech" && techDVIData !== null;

  // ── Persona shells ────────────────────────────────────────
  if (activePersona !== "admin") {
    const effectiveScreen = isTechDVI ? "techDVI" : activeScreen;

    const extraProps = {
      roInitialCust,
      roInitialStep,
      onRoSelect: (boardRo) => setAdvisorSelectedRO(boardRo || null),
      onNavigate: (id) => {
        setTechDVIData(null);
        setActiveScreen(id);
      },
      // Tech DVI open/close
      onOpenDVI: (roData) => {
        setTechDVIData(roData);
        setActiveScreen("techDVI");
      },
      onBack: () => {
        setTechDVIData(null);
        setActiveScreen("techHome");
      },
      onComplete: () => {
        setTechDVIData(null);
        setActiveScreen("techHome");
      },
      roData: techDVIData,
    };

    // GWG Corporate has its own full-screen layout — render directly without PersonaShell
    if (activePersona === "gwgCorporate") {
      return (
        <div style={{ height: "100vh", overflow: "hidden" }}>
          <GWGCorporateScreen onExitPersona={() => {
            setActivePersona(null);
            setActiveScreen("dashboard");
          }} />
        </div>
      );
    }

    return (
      <RecommendationsProvider shopId="shop-001" edition="am" persona={activePersona}>
        <>
          <PersonaShell
            persona={activePersona}
            activeScreen={effectiveScreen}
            selectedRO={advisorSelectedRO}
            onNavigate={(id) => {
              setTechDVIData(null);
              setActiveScreen(id);
            }}
            onExitPersona={() => {
              setActivePersona(null);
              setTechDVIData(null);
              setActiveScreen("dashboard");
              setAdvisorSelectedRO(null);
            }}
            onOpenSpecs={() => setSpecsOpen(true)}
          >
            {resolvePersonaScreen(activePersona, effectiveScreen, extraProps)}
          </PersonaShell>
          {specsOpen && <SpecificationsPanel onClose={() => setSpecsOpen(false)} />}
        </>
      </RecommendationsProvider>
    );
  }

  // ── Admin shell (full 14-screen) ─────────────────────────
  const ActiveComponent = ADMIN_SCREENS.find(s => s.id === activeScreen)?.component || DashboardScreen;
  let lastGroup = null;

  return (
    <RecommendationsProvider shopId="shop-001" edition="am" persona="admin">
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {specsOpen && <SpecificationsPanel onClose={() => setSpecsOpen(false)} />}

      {/* Left Nav */}
      <div style={{ width: 60, background: COLORS.bgDark, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: "14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <button
            onClick={() => setActivePersona(null)}
            title="Back to persona gateway"
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <BrandWordmark size="nav" />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, padding: "8px 7px", display: "flex", flexDirection: "column", gap: 1, overflowY: "auto" }}>
          {ADMIN_SCREENS.map((s) => {
            const active = activeScreen === s.id;
            const showDivider = s.group !== lastGroup && lastGroup !== null;
            lastGroup = s.group;
            return (
              <div key={s.id}>
                {showDivider && <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "6px 4px" }} />}
                <button
                  onClick={() => setActiveScreen(s.id)}
                  title={s.label}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "9px", borderRadius: 8, border: "none", cursor: "pointer",
                    background: active ? "rgba(255,107,53,0.18)" : "transparent",
                    color: active ? COLORS.accent : "rgba(255,255,255,0.45)",
                    transition: "all 0.15s", width: "100%", position: "relative",
                  }}
                >
                  <s.icon size={18} />
                  {s.badge && !active && (
                    <div style={{ position: "absolute", top: 5, right: 5, width: 14, height: 14, borderRadius: 7, background: COLORS.accent, border: "1.5px solid #0D3B45", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: "#fff" }}>
                      {s.badge}
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar */}
        <div style={{ height: 56, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setActivePersona(null)}
              title="Back to home"
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              <BrandWordmark size="bar" />
              <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, background: "#F3F4F6", borderRadius: 4, padding: "2px 6px" }}>ADMIN</span>
            </button>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>
              {ADMIN_SCREENS.find(s => s.id === activeScreen)?.label}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F9FAFB", borderRadius: 10, padding: "6px 12px", width: 260, border: "1px solid #E5E7EB" }}>
              <Search size={14} color={COLORS.textMuted} />
              <input placeholder="Search customers, VINs, ROs…" style={{ border: "none", outline: "none", background: "transparent", fontSize: 12, flex: 1, color: COLORS.textPrimary }} />
              <div style={{ fontSize: 10, color: COLORS.textMuted, background: "#E5E7EB", borderRadius: 4, padding: "2px 5px" }}>⌘K</div>
            </div>
            <button
              onClick={() => setSpecsOpen(true)}
              title="Specifications"
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, border: "1px solid #E5E7EB", cursor: "pointer", background: "#F9FAFB", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600 }}
            >
              <Menu size={14} />
              Specs
            </button>
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
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={18} color={COLORS.textSecondary} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: COLORS.accent, border: "2px solid #fff" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>{SHOP.ownerInitials}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{SHOP.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>Palo Alto, CA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
          <ActiveComponent onNavigate={setActiveScreen} />
        </div>

        {/* Footer */}
        <div style={{ flexShrink: 0, borderTop: "1px solid #E5E7EB", background: "#fff", padding: "6px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <BrandWordmark size="sm" />
              <span style={{ fontSize: 9, fontWeight: 800, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 4, padding: "1px 5px" }}>AM</span>
            </div>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>powered by</span>
            <svg width="36" height="18" viewBox="0 0 44 22" fill="none">
              <path d="M2 18 C6 18, 10 15, 14 12 C18 9, 22 5, 28 3 C32 1.5, 36 1, 42 1" stroke="#B8BEC8" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <path d="M2 20 C6 20, 10 17, 14 14 C18 11, 22 7, 28 5 C32 3.5, 36 3, 42 3" stroke="#1B3461" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <path d="M2 22 C6 22, 10 19, 14 16 C18 13, 22 9, 28 7 C32 5.5, 36 5, 42 5" stroke="#F5B800" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 300, letterSpacing: 3, color: "#1B3461" }}>PREDII</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 10, color: "#9CA3AF" }}>
            <span>© {new Date().getFullYear()} Predii, Inc.</span>
            <span style={{ color: "#E5E7EB" }}>|</span>
            <span style={{ fontWeight: 600, color: "#6B7280", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
            {appVersion && <span style={{ color: "#D1D5DB", marginLeft: 8 }}>{appVersion}</span>}
          </div>
        </div>
      </div>

      {agentVisible && (
        <WrenchIQAgent
          activeScreen={activeScreen}
          persona="admin"
          onHide={() => setAgentVisible(false)}
        />
      )}
    </div>
    </RecommendationsProvider>
  );
}
