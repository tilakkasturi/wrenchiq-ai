// WrenchIQAdminApp — standalone shop-configuration shell.
// Plain admin app (not the persona-gateway/PersonaShell system) that hosts
// all admin/configuration screens, grouped into Learn / Configure /
// Advanced, separate from the main AI-assistant app.

import { useState } from "react";
import {
  FileText, Database, Building2, Map, Link, History,
  Users, Bell, Target, MessageSquare,
} from "lucide-react";
import { COLORS } from "./theme/colors";
import BrandWordmark from "./components/BrandWordmark";
import AdminShell from "./components/AdminShell";

import {
  ShopProfileTab, IntegrationsTab, TeamTab, NotificationsTab,
  AROMarginTab, TribalKnowledgePanel,
} from "./screens/SettingsScreen";
import HistoricalROsScreen from "./screens/HistoricalROsScreen";
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
      { id: "historicalROs", label: "Historical ROs", icon: History },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      { id: "shop", label: "Shop Profile", icon: Building2 },
      { id: "team", label: "Team", icon: Users },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "aroMargin", label: "ARO & Margin", icon: Target },
      { id: "tribal", label: "Strategic Priorities", icon: MessageSquare },
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
  const [activeScreen, setActiveScreen] = useState(initialScreenFromQuery);
  const [am3cSettings, setAm3cSettings] = useState(AM3C_DEFAULT_SETTINGS);

  const active = ALL_ITEMS.find((item) => item.id === activeScreen) || ALL_ITEMS[0];

  function renderActiveScreen() {
    switch (activeScreen) {
      case "integrations":   return <IntegrationsTab />;
      case "historicalROs":  return <HistoricalROsScreen />;
      case "shop":           return <ShopProfileTab />;
      case "team":           return <TeamTab />;
      case "notifications":  return <NotificationsTab />;
      case "aroMargin":      return <AROMarginTab />;
      case "tribal":         return <TribalKnowledgePanel />;
      case "am3cAdmin":      return <AM3CAdminScreen settings={am3cSettings} onSave={setAm3cSettings} />;
      case "amAdmin":        return <AMAdminScreen />;
      case "oemSettings":    return <OEMSettingsScreen />;
      case "hierarchy":      return <HierarchyAdminScreen />;
      default:               return <IntegrationsTab />;
    }
  }

  return (
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
          <BrandWordmark size="bar" />
          <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textSecondary }}>Admin</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{active.label}</span>
      </div>

      {/* Sectioned nav + content */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AdminShell
          sections={SECTIONS}
          activeId={activeScreen}
          onSelect={setActiveScreen}
          content={renderActiveScreen()}
        />
      </div>
    </div>
  );
}
