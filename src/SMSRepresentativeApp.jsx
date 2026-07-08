/**
 * SMSRepresentativeApp — standalone shell for the "shop's own SMS/DMS" demo.
 *
 * This is explicitly NOT a WrenchIQ-branded surface. It plays the role of a
 * third-party Shop/Dealer Management System (Tekmetric, Mitchell1, Protractor…)
 * that WrenchIQ observes read-only via the Data Feed Model. AdvisorHomeScreen
 * is a pure Kanban board with no WrenchIQ intelligence of its own (that lives
 * in WrenchIQSidecarScreen.jsx, Surface B) — here we host it full-screen with
 * a thin, distinctly non-WrenchIQ title bar and feed it a simulated stream of
 * RO activity in place of live shop data.
 */

import AdvisorHomeScreen, { STATIC_BOARD_ROS } from "./screens/AdvisorHomeScreen";
import { useDemo } from "./context/DemoContext";
import { useDataFeedSimulator } from "./services/dataFeedSimulator";

export default function SMSRepresentativeApp() {
  const { smsName, shopName, smsHeaderColor } = useDemo();
  const [ros] = useDataFeedSimulator(STATIC_BOARD_ROS);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw", overflow: "hidden" }}>
      {/* Thin title bar identifying this as the shop's own system, not WrenchIQ */}
      <div style={{
        height: 36, flexShrink: 0,
        background: smsHeaderColor || "#1F2937",
        color: "rgba(255,255,255,0.85)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
      }}>
        {smsName || "Shop Management System"} · {shopName || "Repair Shop"} (Representative — read-only feed to WrenchIQ)
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <AdvisorHomeScreen ros={ros} />
      </div>
    </div>
  );
}
