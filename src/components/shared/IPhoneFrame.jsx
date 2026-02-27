import React from "react";

/**
 * iPhone 15 Pro frame component
 * Wraps children in a realistic device mockup
 * Inner viewport: 393 x 852 (logical points)
 */
export default function IPhoneFrame({ children, scale = 0.85 }) {
  const frameWidth = 393;
  const frameHeight = 852;

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      padding: "20px 0",
    }}>
      <div style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        borderRadius: 55 * scale,
        border: `${3 * scale}px solid #1a1a1a`,
        background: "#1a1a1a",
        boxShadow: `
          0 0 0 ${2 * scale}px #333,
          0 ${20 * scale}px ${60 * scale}px rgba(0,0,0,0.3),
          inset 0 0 ${3 * scale}px rgba(255,255,255,0.05)
        `,
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: "absolute",
          top: 10 * scale,
          left: "50%",
          transform: "translateX(-50%)",
          width: 126 * scale,
          height: 37 * scale,
          borderRadius: 20 * scale,
          background: "#000",
          zIndex: 20,
        }} />

        {/* Status bar */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 54 * scale,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: `0 ${28 * scale}px`,
          zIndex: 15,
          color: "#fff",
          fontSize: 14 * scale,
          fontWeight: 600,
        }}>
          <span>9:41</span>
          <div style={{ display: "flex", gap: 5 * scale, alignItems: "center" }}>
            {/* Signal bars */}
            <svg width={17 * scale} height={12 * scale} viewBox="0 0 17 12">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#fff" />
              <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#fff" />
              <rect x="9" y="2" width="3" height="10" rx="0.5" fill="#fff" />
              <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#fff" />
            </svg>
            {/* WiFi */}
            <svg width={16 * scale} height={12 * scale} viewBox="0 0 16 12">
              <path d="M8 11.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" fill="#fff" />
              <path d="M4.5 7.5c2-2 5-2 7 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M2 4.5c3.3-3.3 8.7-3.3 12 0" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
            {/* Battery */}
            <svg width={27 * scale} height={12 * scale} viewBox="0 0 27 12">
              <rect x="0" y="0.5" width="23" height="11" rx="2" stroke="#fff" strokeWidth="1" fill="none" />
              <rect x="24" y="3.5" width="2.5" height="5" rx="1" fill="#fff" opacity="0.4" />
              <rect x="1.5" y="2" width="18" height="8" rx="1" fill="#34C759" />
            </svg>
          </div>
        </div>

        {/* Screen content area */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          borderRadius: 52 * scale,
          overflow: "hidden",
          background: "#fff",
        }}>
          <div style={{
            paddingTop: 54 * scale,
            height: "100%",
            boxSizing: "border-box",
            overflowY: "auto",
            overflowX: "hidden",
            WebkitOverflowScrolling: "touch",
          }}>
            {children}
          </div>
        </div>

        {/* Home indicator */}
        <div style={{
          position: "absolute",
          bottom: 8 * scale,
          left: "50%",
          transform: "translateX(-50%)",
          width: 134 * scale,
          height: 5 * scale,
          borderRadius: 3 * scale,
          background: "#000",
          zIndex: 20,
        }} />

        {/* Side buttons */}
        {/* Power button — right side */}
        <div style={{
          position: "absolute",
          right: -3 * scale,
          top: 160 * scale,
          width: 3 * scale,
          height: 65 * scale,
          background: "#333",
          borderRadius: `0 ${2 * scale}px ${2 * scale}px 0`,
        }} />
        {/* Volume up — left side */}
        <div style={{
          position: "absolute",
          left: -3 * scale,
          top: 130 * scale,
          width: 3 * scale,
          height: 35 * scale,
          background: "#333",
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
        }} />
        {/* Volume down — left side */}
        <div style={{
          position: "absolute",
          left: -3 * scale,
          top: 175 * scale,
          width: 3 * scale,
          height: 35 * scale,
          background: "#333",
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
        }} />
        {/* Action button — left side */}
        <div style={{
          position: "absolute",
          left: -3 * scale,
          top: 95 * scale,
          width: 3 * scale,
          height: 22 * scale,
          background: "#333",
          borderRadius: `${2 * scale}px 0 0 ${2 * scale}px`,
        }} />
      </div>
    </div>
  );
}
