// WrenchIQ-OEM — Standalone entry point
// Boots directly into the OEM gateway, bypassing the combined AM+OEM PersonaGateway.
// Also accessible via the main WrenchIQ app through onOpenOEM in PersonaGatewayScreen.

import { useState, useEffect, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 32, fontFamily: "monospace", background: "#FEF2F2", minHeight: "100vh" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#DC2626", marginBottom: 12 }}>React Render Error</div>
          <pre style={{ fontSize: 12, color: "#7F1D1D", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {this.state.error.message}{"\n\n"}{this.state.error.stack}
          </pre>
          <button onClick={() => this.setState({ error: null })} style={{ marginTop: 16, padding: "8px 16px", cursor: "pointer" }}>Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}
import OEMGatewayScreen from "./screens/OEMGatewayScreen";
import PersonaShell from "./components/PersonaShell";
import ROStoryWriterScreen from "./screens/ROStoryWriterScreen";
import FixedOpsDashboardScreen from "./screens/FixedOpsDashboardScreen";
import WarrantyAnalyticsScreen from "./screens/WarrantyAnalyticsScreen";
import OEMDealerGroupScreen from "./screens/OEMDealerGroupScreen";
import OEMTechScreen from "./screens/OEMTechScreen";
import OEMPartsScreen from "./screens/OEMPartsScreen";
import OEMSettingsScreen from "./screens/OEMSettingsScreen";

const PERSONA_DEFAULT_SCREEN = {
  fixedOps:   "fixedOpsHome",
  oemAdvisor: "roWriter",
  oemTech:    "oemTechHome",
};

function resolveOEMScreen(persona, screenId, showWrenchIQBranding, onToggleBranding) {
  if (persona === "fixedOps") {
    if (screenId === "fixedOpsHome")      return <FixedOpsDashboardScreen />;
    if (screenId === "warrantyAnalytics") return <WarrantyAnalyticsScreen />;
    if (screenId === "oemNetwork")        return <OEMDealerGroupScreen />;
    if (screenId === "oemSettings")       return <OEMSettingsScreen showWrenchIQBranding={showWrenchIQBranding} onToggleBranding={onToggleBranding} />;
  }
  if (persona === "oemAdvisor") {
    if (screenId === "roWriter")   return <ROStoryWriterScreen />;
    if (screenId === "oemParts")   return <OEMPartsScreen />;
    if (screenId === "oemSettings") return <OEMSettingsScreen showWrenchIQBranding={showWrenchIQBranding} onToggleBranding={onToggleBranding} />;
  }
  if (persona === "oemTech") {
    if (screenId === "oemTechHome") return <OEMTechScreen />;
  }
  return <ROStoryWriterScreen />;
}

export default function WrenchIQOEMApp() {
  const [activePersona, setActivePersona] = useState(null);
  const [activeScreen, setActiveScreen]   = useState("roWriter");
  const [showWrenchIQBranding, setShowWrenchIQBranding] = useState(true);

  useEffect(() => {
    document.title = showWrenchIQBranding
      ? "WrenchIQ-OEM — 3C Story Writer"
      : "PrediiPowered OEM — 3C Story Writer";
  }, [showWrenchIQBranding]);

  // Boot directly into OEM gateway — no combined AM+OEM gateway
  if (!activePersona) {
    return (
      <OEMGatewayScreen
        onSelectPersona={(personaId) => {
          setActivePersona(personaId);
          setActiveScreen(PERSONA_DEFAULT_SCREEN[personaId] || "roWriter");
        }}
        standaloneMode={true}
      />
    );
  }

  return (
    <ErrorBoundary>
      <PersonaShell
        persona={activePersona}
        activeScreen={activeScreen}
        onNavigate={(id) => setActiveScreen(id)}
        onExitPersona={() => {
          setActivePersona(null);
          setActiveScreen("roWriter");
        }}
        showWrenchIQBranding={showWrenchIQBranding}
      >
        {resolveOEMScreen(activePersona, activeScreen, showWrenchIQBranding, setShowWrenchIQBranding)}
      </PersonaShell>
    </ErrorBoundary>
  );
}
