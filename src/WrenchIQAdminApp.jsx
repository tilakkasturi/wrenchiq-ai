// WrenchIQAdminApp — standalone shop-configuration shell.
// Plain left-nav app (not the persona-gateway/PersonaShell system) that hosts
// only the admin/configuration screens, separate from the main AI-assistant app.

import { useState } from "react";
import { Settings, Zap, FileText, Database, Building2, Users } from "lucide-react";
import { COLORS } from "./theme/colors";
import BrandWordmark from "./components/BrandWordmark";

import SettingsScreen from "./screens/SettingsScreen";
import IntegrationsScreen from "./screens/IntegrationsScreen";
import AM3CAdminScreen, { DEFAULT_SETTINGS as AM3C_DEFAULT_SETTINGS } from "./screens/AM3CAdminScreen";
import AMAdminScreen from "./screens/AMAdminScreen";
import OEMSettingsScreen from "./screens/OEMSettingsScreen";
import GWGCorporateScreen from "./screens/GWGCorporateScreen";

const NAV_SCREENS = [
  { id: "settings",     label: "Settings",           icon: Settings,  component: SettingsScreen },
  { id: "integrations", label: "Integrations",       icon: Zap,       component: IntegrationsScreen },
  { id: "am3cAdmin",    label: "3C Story Writer",     icon: FileText,  component: AM3CAdminScreen },
  { id: "amAdmin",      label: "AM Admin",            icon: Database,  component: AMAdminScreen },
  { id: "oemSettings",  label: "OEM Settings",        icon: Building2, component: OEMSettingsScreen },
  { id: "gwgCorporate", label: "GWG Corporate",       icon: Users,     component: GWGCorporateScreen },
];

export default function WrenchIQAdminApp() {
  const [activeScreen, setActiveScreen] = useState("settings");
  const [am3cSettings, setAm3cSettings] = useState(AM3C_DEFAULT_SETTINGS);

  const active = NAV_SCREENS.find((s) => s.id === activeScreen) || NAV_SCREENS[0];

  function renderActiveScreen() {
    if (activeScreen === "settings") {
      return <SettingsScreen onNavigate={setActiveScreen} />;
    }
    if (activeScreen === "am3cAdmin") {
      return <AM3CAdminScreen settings={am3cSettings} onSave={setAm3cSettings} />;
    }
    if (activeScreen === "gwgCorporate") {
      return <GWGCorporateScreen onExitPersona={() => setActiveScreen("settings")} />;
    }
    const ActiveComponent = active.component;
    return <ActiveComponent />;
  }

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Left Nav */}
      <div style={{ width: 60, background: COLORS.bgDark, display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ padding: "14px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BrandWordmark size="nav" />
        </div>

        <div style={{ flex: 1, padding: "8px 7px", display: "flex", flexDirection: "column", gap: 4, overflowY: "auto" }}>
          {NAV_SCREENS.map((s) => {
            const isActive = activeScreen === s.id;
            const Icon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScreen(s.id)}
                title={s.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 46,
                  height: 46,
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  background: isActive ? "rgba(255,255,255,0.14)" : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.55)",
                }}
              >
                <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
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

        {/* Screen content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {renderActiveScreen()}
        </div>
      </div>
    </div>
  );
}
