// AdminShell — shared left-nav-tab rail + content pane for the admin/settings
// screens (SettingsScreen, AMAdminScreen, OEMSettingsScreen). Extracted from
// the pattern common to all three: a 200px white rail with a bordered tab
// list, and a scrollable content pane. Each caller still owns its own tab
// array and content dispatch (conditional chain or lookup map) — this
// component only owns the shell/rail, not routing.
//
// Not yet wired into the existing screens (that's a separate migration);
// this is the foundation those screens will be rebuilt on.

import { COLORS } from "../theme/colors";

export default function AdminShell({ title, tabs, activeTab, onTabChange, content }) {
  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: COLORS.bg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left sidebar nav */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          background: "#fff",
          borderRight: `1px solid ${COLORS.border}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {title && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: COLORS.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              padding: "0 8px",
              marginBottom: 10,
            }}
          >
            {title}
          </div>
        )}
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                border: "none",
                background: isActive ? COLORS.primary : "transparent",
                color: isActive ? "#fff" : COLORS.textSecondary,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                textAlign: "left",
                width: "100%",
                transition: "all 0.12s",
              }}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 800 }}>{content}</div>
      </div>
    </div>
  );
}
