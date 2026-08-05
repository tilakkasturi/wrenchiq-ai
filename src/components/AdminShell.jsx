// AdminShell — shared left-nav rail + content pane for the admin/settings
// screens (SettingsScreen, WrenchIQAdminApp). A 200px white rail grouped
// into labeled sections (e.g. Learn / Configure / Advanced), each holding a
// flat list of nav items, plus a scrollable content pane. Sections with no
// items are simply not rendered.

import { COLORS } from "../theme/colors";

export default function AdminShell({ sections, activeId, onSelect, content, contentMaxWidth = 800 }) {
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
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {sections.filter((section) => section.items && section.items.length > 0).map((section) => (
          <div key={section.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLORS.textMuted,
                textTransform: "uppercase",
                letterSpacing: "0.6px",
                padding: "0 8px",
                marginBottom: 8,
              }}
            >
              {section.label}
            </div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = activeId === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelect(item.id)}
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
                  {item.label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: contentMaxWidth }}>{content}</div>
      </div>
    </div>
  );
}
