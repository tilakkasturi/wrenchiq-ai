import { useState } from "react";
import {
  Wrench, Brain, ClipboardList, Eye, Smartphone, Package,
  Calendar, BarChart3, Home, Search, Bell, ChevronLeft, ChevronRight,
} from "lucide-react";
import { COLORS } from "./theme/colors";
import { SHOP } from "./data/demoData";
import DashboardScreen from "./screens/DashboardScreen";
import AICopilotScreen from "./screens/AICopilotScreen";
import RepairOrderScreen from "./screens/RepairOrderScreen";
import DVIScreen from "./screens/DVIScreen";
import CustomerPortalScreen from "./screens/CustomerPortalScreen";
import PartsScreen from "./screens/PartsScreen";
import SchedulingScreen from "./screens/SchedulingScreen";
import AnalyticsScreen from "./screens/AnalyticsScreen";

const screens = [
  { id: "dashboard", label: "Command Center", icon: Home, component: DashboardScreen },
  { id: "copilot", label: "AI Copilot", icon: Brain, component: AICopilotScreen },
  { id: "orders", label: "Repair Orders", icon: ClipboardList, component: RepairOrderScreen },
  { id: "dvi", label: "Vehicle Inspection", icon: Eye, component: DVIScreen },
  { id: "customer", label: "Customer Portal", icon: Smartphone, component: CustomerPortalScreen },
  { id: "parts", label: "Parts Intelligence", icon: Package, component: PartsScreen },
  { id: "schedule", label: "Bay Scheduler", icon: Calendar, component: SchedulingScreen },
  { id: "analytics", label: "Analytics", icon: BarChart3, component: AnalyticsScreen },
];

export default function WrenchIQApp() {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const ActiveComponent = screens.find(s => s.id === activeScreen)?.component || DashboardScreen;

  return (
    <div style={{ display: "flex", height: "100vh", background: COLORS.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarCollapsed ? 64 : 220,
        background: COLORS.bgDark,
        display: "flex", flexDirection: "column",
        transition: "width 0.2s ease",
        flexShrink: 0,
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: sidebarCollapsed ? "18px 12px" : "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Wrench size={18} color="#fff" style={{ transform: "rotate(-45deg)" }} />
          </div>
          {!sidebarCollapsed && (
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 15, letterSpacing: 0.5 }}>WrenchIQ</div>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, letterSpacing: 0.5 }}>AI SHOP OS</div>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <div style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
          {screens.map(s => {
            const active = activeScreen === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveScreen(s.id)}
                title={sidebarCollapsed ? s.label : undefined}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: sidebarCollapsed ? "10px 12px" : "10px 14px",
                  borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? "rgba(255,107,53,0.15)" : "transparent",
                  color: active ? COLORS.accent : "rgba(255,255,255,0.6)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  transition: "all 0.15s",
                  width: "100%", textAlign: "left",
                  justifyContent: sidebarCollapsed ? "center" : "flex-start",
                  whiteSpace: "nowrap",
                }}
              >
                <s.icon size={18} style={{ flexShrink: 0 }} />
                {!sidebarCollapsed && s.label}
                {!sidebarCollapsed && s.id === "copilot" && (
                  <span style={{ marginLeft: "auto", fontSize: 9, background: COLORS.accent, color: "#fff", borderRadius: 4, padding: "2px 6px", fontWeight: 700 }}>AI</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Collapse Toggle */}
        <div style={{ padding: "12px 8px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "8px", borderRadius: 8, border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)",
              width: "100%", fontSize: 12,
            }}
          >
            {sidebarCollapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /> Collapse</>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top Bar */}
        <div style={{ height: 64, background: "#fff", borderBottom: "1px solid #E5E7EB", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "#F9FAFB", borderRadius: 10, padding: "8px 14px", width: 360, border: "1px solid #E5E7EB" }}>
            <Search size={16} color={COLORS.textMuted} />
            <input
              placeholder="Search customers, vehicles, ROs..."
              style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1, color: COLORS.textPrimary }}
            />
            <div style={{ fontSize: 10, color: COLORS.textMuted, background: "#E5E7EB", borderRadius: 4, padding: "2px 6px" }}>⌘K</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", cursor: "pointer" }}>
              <Bell size={20} color={COLORS.textSecondary} />
              <div style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 4, background: COLORS.accent, border: "2px solid #fff" }} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{SHOP.ownerInitials}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{SHOP.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>Palo Alto, CA</div>
              </div>
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          <ActiveComponent />
        </div>

        {/* Footer */}
        <div style={{
          flexShrink: 0,
          borderTop: "1px solid #E5E7EB",
          background: "#fff",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          {/* Predii Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <svg width="44" height="22" viewBox="0 0 44 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Gray curve */}
              <path d="M2 18 C6 18, 10 15, 14 12 C18 9, 22 5, 28 3 C32 1.5, 36 1, 42 1"
                stroke="#B8BEC8" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              {/* Navy curve */}
              <path d="M2 20 C6 20, 10 17, 14 14 C18 11, 22 7, 28 5 C32 3.5, 36 3, 42 3"
                stroke="#1B3461" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              {/* Gold curve */}
              <path d="M2 22 C6 22, 10 19, 14 16 C18 13, 22 9, 28 7 C32 5.5, 36 5, 42 5"
                stroke="#F5B800" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            </svg>
            <span style={{ fontSize: 13, fontWeight: 300, letterSpacing: 4, color: "#1B3461", fontFamily: "'Inter', sans-serif" }}>
              PREDII
            </span>
          </div>

          {/* Legal */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 11, color: "#9CA3AF" }}>
            <span>© {new Date().getFullYear()} Predii, Inc. All rights reserved.</span>
            <span style={{ color: "#E5E7EB" }}>|</span>
            <span style={{ fontWeight: 600, color: "#6B7280", letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
