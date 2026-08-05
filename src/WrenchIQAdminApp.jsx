// WrenchIQAdminApp — standalone shop-configuration shell.
// Plain admin app (not the persona-gateway/PersonaShell system) that hosts
// all admin/configuration screens, grouped into Learn / Configure /
// Advanced, separate from the main AI-assistant app.

import { useState } from "react";
import {
  FileText, Database, Building2, Map, Link,
  Users, Bell, Target, MessageSquare, ClipboardCheck, BookOpen, Sparkles, Gauge,
} from "lucide-react";
import { COLORS } from "./theme/colors";
import AdminShell from "./components/AdminShell";
import ResearchInsightsSection from "./components/admin/ResearchInsightsSection";
import { PrediiLearnProvider } from "./context/PrediiLearnContext";
import { useDemo } from "./context/DemoContext";

import {
  ShopProfileTab, IntegrationsTab, TeamTab, NotificationsTab,
  AROMarginTab, TribalKnowledgePanel, GoldStandardTab, PrediiScoreLogicTab,
} from "./screens/SettingsScreen";
import PrediiLearnScreen from "./screens/PrediiLearnScreen";
import AM3CAdminScreen, { DEFAULT_SETTINGS as AM3C_DEFAULT_SETTINGS } from "./screens/AM3CAdminScreen";
import AMAdminScreen from "./screens/AMAdminScreen";
import OEMSettingsScreen from "./screens/OEMSettingsScreen";
import HierarchyAdminScreen from "./screens/HierarchyAdminScreen";

// Legacy alias: the Tauri sidecar links to `?section=settings` (the old,
// pre-reorg id for the standalone Settings tab rail) — map it to the tab
// that rail defaulted to.
const LEGACY_SECTION_ALIASES = { settings: "integrations" };

const SECTIONS = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { id: "integrations", label: "Integrations", icon: Link },
      { id: "prediiLearn", label: "Predii Learn", icon: Sparkles },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      { id: "shop", label: "Shop Profile", icon: Building2 },
      { id: "team", label: "Team", icon: Users },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "aroMargin", label: "ARO, ELR & Margin", icon: Target },
      { id: "goldStandard", label: "Gold Standard", icon: ClipboardCheck },
      { id: "scoreLogic", label: "Predii Score Logic", icon: Gauge },
      { id: "tribal", label: "Strategic Priorities", icon: MessageSquare },
      { id: "researchInsights", label: "Research & Best Practices", icon: BookOpen },
    ],
  },
  {
    id: "advanced",
    label: "Advanced",
    items: [
      { id: "am3cAdmin", label: "3C Story Writer", icon: FileText },
      { id: "amAdmin", label: "AM Admin", icon: Database },
      { id: "oemSettings", label: "OEM Settings", icon: Building2 },
      { id: "hierarchy", label: "Location Hierarchy", icon: Map },
    ],
  },
];

const ALL_ITEMS = SECTIONS.flatMap((s) => s.items);

function initialScreenFromQuery() {
  const section = new URLSearchParams(window.location.search).get("section");
  const resolved = LEGACY_SECTION_ALIASES[section] || section;
  return ALL_ITEMS.some((item) => item.id === resolved) ? resolved : "integrations";
}

export default function WrenchIQAdminApp() {
  const { shopName, smsName } = useDemo();
  const [activeScreen, setActiveScreen] = useState(initialScreenFromQuery);
  const [am3cSettings, setAm3cSettings] = useState(AM3C_DEFAULT_SETTINGS);

  const active = ALL_ITEMS.find((item) => item.id === activeScreen) || ALL_ITEMS[0];

  function renderActiveScreen() {
    switch (activeScreen) {
      case "integrations":   return <IntegrationsTab />;
      case "prediiLearn":    return <PrediiLearnScreen />;
      case "shop":           return <ShopProfileTab />;
      case "team":           return <TeamTab />;
      case "notifications":  return <NotificationsTab />;
      case "aroMargin":      return <AROMarginTab />;
      case "goldStandard":   return <GoldStandardTab />;
      case "scoreLogic":     return <PrediiScoreLogicTab />;
      case "tribal":         return <TribalKnowledgePanel />;
      case "researchInsights": return <ResearchInsightsSection />;
      case "am3cAdmin":      return <AM3CAdminScreen settings={am3cSettings} onSave={setAm3cSettings} />;
      case "amAdmin":        return <AMAdminScreen />;
      case "oemSettings":    return <OEMSettingsScreen />;
      case "hierarchy":      return <HierarchyAdminScreen />;
      default:               return <IntegrationsTab />;
    }
  }

  return (
    <PrediiLearnProvider>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
        {/* Top bar */}
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            background: COLORS.bgCard,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{smsName || "Shop Management System"}</span>
            <span style={{ color: COLORS.border }}>|</span>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.5, color: COLORS.textPrimary }}>WrenchIQ</span>
            <span style={{ color: COLORS.border }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{active.label}</span>
            <span style={{ color: COLORS.border }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{shopName || "Repair Shop"}</span>
          </div>
        </div>

        {/* Sectioned nav + content */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <AdminShell
            sections={SECTIONS}
            activeId={activeScreen}
            onSelect={setActiveScreen}
            content={renderActiveScreen()}
            contentMaxWidth={activeScreen === "prediiLearn" ? "none" : 800}
          />
        </div>
      </div>
    </PrediiLearnProvider>
  );
}
