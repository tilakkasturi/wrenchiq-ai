// WrenchIQ-AM 3C Story Writer — Standalone entry point
// Boots directly into the AM 3C Story Writer without the full persona gateway.

import { useState } from "react";
import { useAppVersion } from "./hooks/useAppVersion";
import { FileText, Settings } from "lucide-react";
import AM3CStoryWriterScreen from "./screens/AM3CStoryWriterScreen";
import TechReviewScreen from "./screens/TechReviewScreen";
import CustomerDocumentScreen from "./screens/CustomerDocumentScreen";
import AM3CAdminScreen, { DEFAULT_SETTINGS } from "./screens/AM3CAdminScreen";
import { COLORS } from "./theme/colors";
import BrandWordmark from "./components/BrandWordmark";
import BrandToggle from "./components/BrandToggle";

export default function WrenchIQAMApp() {
  const appVersion = useAppVersion();
  const [currentScreen, setCurrentScreen] = useState("main"); // 'main' | 'review' | 'customer' | 'admin'
  const [currentDocument, setCurrentDocument] = useState(null);
  const [currentViolations, setCurrentViolations] = useState([]);
  const [adminSettings, setAdminSettings] = useState(DEFAULT_SETTINGS);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: COLORS.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        height: 52, background: "#fff",
        borderBottom: "1px solid #E5E7EB",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandWordmark size="bar" />
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: 0.3,
            color: COLORS.accent, background: `${COLORS.accent}14`,
            border: `1px solid ${COLORS.accent}35`,
            borderRadius: 6, padding: "3px 8px",
          }}>
            AM
          </span>
          <span style={{
            display: "flex", alignItems: "center", gap: 5,
            fontSize: 12, color: COLORS.textMuted,
            borderLeft: `1px solid ${COLORS.border}`, paddingLeft: 10, marginLeft: 2,
          }}>
            <FileText size={13} />
            3C Story Writer
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <BrandToggle />
          <button
            onClick={() => setCurrentScreen("admin")}
            title="Settings"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 32, height: 32, borderRadius: 7, border: "none",
              cursor: "pointer",
              background: currentScreen === "admin" ? `${COLORS.primary}12` : "transparent",
              color: currentScreen === "admin" ? COLORS.primary : COLORS.textSecondary,
              transition: "all 0.15s",
            }}
          >
            <Settings size={16} />
          </button>
          <div style={{ fontSize: 10, fontWeight: 600, color: "#9CA3AF", letterSpacing: 0.5 }}>
            PREDII CONFIDENTIAL
          </div>
        </div>
      </div>

      {/* Screen */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        {currentScreen === "main" && (
          <AM3CStoryWriterScreen
            onOpenReview={(doc, violations) => {
              setCurrentDocument(doc);
              setCurrentViolations(violations || []);
              setCurrentScreen("review");
            }}
            onOpenAdmin={() => setCurrentScreen("admin")}
          />
        )}
        {currentScreen === "review" && (
          <TechReviewScreen
            document={currentDocument}
            violations={currentViolations}
            onBack={() => setCurrentScreen("main")}
            onSendToCustomer={() => setCurrentScreen("customer")}
            minScore={adminSettings.delivery.minScoreToSend}
          />
        )}
        {currentScreen === "customer" && (
          <CustomerDocumentScreen
            document={currentDocument}
            shopBranding={{ name: "Peninsula Precision Auto", city: "Palo Alto, CA" }}
            onRecommendationResponse={(id, decision) => console.log("Customer response:", id, decision)}
          />
        )}
        {currentScreen === "admin" && (
          <AM3CAdminScreen
            settings={adminSettings}
            onSave={(s) => setAdminSettings(s)}
            onBack={() => setCurrentScreen("main")}
          />
        )}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: "1px solid #E5E7EB",
        background: "#fff",
        padding: "5px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <BrandWordmark size="sm" />
          <span style={{ fontSize: 9, fontWeight: 800, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 4, padding: "1px 5px" }}>AM</span>
        </div>
        <div style={{ fontSize: 10, color: "#9CA3AF", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 600, color: "#6B7280", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
          {appVersion && <span style={{ color: "#D1D5DB" }}>{appVersion}</span>}
        </div>
      </div>
    </div>
  );
}
