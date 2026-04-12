// BrandWordmark — renders WrenchIQ.ai or PrediiPowered based on global branding context.
// size: "nav" (icon only, 32px), "bar" (icon+text, 24px), "sm" (icon+text, 18px)

import { Wrench } from "lucide-react";
import { useBranding } from "../context/BrandingContext";
import { COLORS } from "../theme/colors";

const PREDII_CURVES = (w, h) => (
  <svg width={w} height={h} viewBox="0 0 24 24" fill="none">
    <path d="M4 8 Q12 2 20 8"  stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M4 12 Q12 6 20 12" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M4 16 Q12 10 20 16" stroke="#FF6B35" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
  </svg>
);

export default function BrandWordmark({ size = "bar" }) {
  const { brand } = useBranding();

  if (brand === "PrediiPowered") {
    if (size === "xl") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {PREDII_CURVES(36, 36)}
          <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.8, color: "#fff" }}>
            Predii<span style={{ color: "#FF6B35" }}>Powered</span>
            <sup style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>™</sup>
          </span>
        </div>
      );
    }
    if (size === "nav") {
      // Icon-only for left nav
      return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32 }}>
          {PREDII_CURVES(28, 28)}
        </div>
      );
    }
    if (size === "sm") {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {PREDII_CURVES(16, 16)}
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: -0.3, color: "#0D3B45" }}>
            Predii<span style={{ color: "#FF6B35" }}>Powered</span>
            <sup style={{ fontSize: 7, color: "#9CA3AF", fontWeight: 600 }}>™</sup>
          </span>
        </div>
      );
    }
    // "bar" (default)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {PREDII_CURVES(20, 20)}
        <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.4, color: "#0D3B45" }}>
          Predii<span style={{ color: "#FF6B35" }}>Powered</span>
          <sup style={{ fontSize: 8, color: "#9CA3AF", fontWeight: 600 }}>™</sup>
        </span>
      </div>
    );
  }

  // WrenchIQ branding
  if (size === "xl") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wrench size={19} color="#fff" style={{ transform: "rotate(-45deg)" }} />
        </div>
        <span style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.8, color: "#fff" }}>
          WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
        </span>
      </div>
    );
  }
  if (size === "nav") {
    return (
      <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Wrench size={18} color="#fff" style={{ transform: "rotate(-45deg)" }} />
      </div>
    );
  }
  if (size === "sm") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
        <div style={{ width: 18, height: 18, borderRadius: 5, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Wrench size={10} color="#fff" style={{ transform: "rotate(-45deg)" }} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: -0.3, color: COLORS.textPrimary }}>
          WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
        </span>
      </div>
    );
  }
  // "bar" (default)
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Wrench size={13} color="#fff" style={{ transform: "rotate(-45deg)" }} />
      </div>
      <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.5, color: COLORS.textPrimary }}>
        WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
      </span>
    </div>
  );
}
