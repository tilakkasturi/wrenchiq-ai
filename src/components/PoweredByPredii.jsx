/**
 * PoweredByPredii — co-branding badge that appears alongside SMS vendor name.
 *
 * Variants:
 *   "topbar"  — inline strip in the top bar (white bg, small)
 *   "badge"   — pill badge (primary bg, white text)
 *   "sm"      — very small, for use inside cards / footers
 *   "footer"  — medium, for screen footers
 */

import { useDemo } from "../context/DemoContext";
import { SMS_VENDOR_CONFIG } from "../context/DemoContext";

const PREDII_CURVES = ({ size = 14, color = "#FF6B35" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M4 8 Q12 2 20 8"  stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
    <path d="M4 12 Q12 6 20 12" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
    <path d="M4 16 Q12 10 20 16" stroke={color} strokeWidth="2.8" strokeLinecap="round" fill="none"/>
  </svg>
);

export default function PoweredByPredii({ variant = "topbar", showSmsName = false }) {
  const { smsName, smsProvider } = useDemo();
  const vendorConfig = SMS_VENDOR_CONFIG[smsProvider] || SMS_VENDOR_CONFIG.other;

  if (!vendorConfig.poweredByPredii) return null;

  if (variant === "topbar") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 8px 3px 6px",
        background: "#F8FAFC",
        border: "1px solid #E5E7EB",
        borderRadius: 6,
        flexShrink: 0,
      }}>
        {showSmsName && (
          <span style={{ fontSize: 11, fontWeight: 700, color: "#374151" }}>
            {smsName}
          </span>
        )}
        {showSmsName && (
          <span style={{ fontSize: 10, color: "#D1D5DB", fontWeight: 400 }}>|</span>
        )}
        <PREDII_CURVES size={12} color="#FF6B35" />
        <span style={{ fontSize: 10, fontWeight: 600, color: "#6B7280", letterSpacing: 0.1 }}>
          Powered by{" "}
          <span style={{ color: "#0D3B45", fontWeight: 800 }}>Predii</span>
        </span>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px 4px 7px",
        background: "#0D3B45",
        borderRadius: 20,
        flexShrink: 0,
      }}>
        <PREDII_CURVES size={13} color="#FF6B35" />
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: 0.2 }}>
          Powered by Predii
        </span>
      </div>
    );
  }

  if (variant === "sm") {
    return (
      <div style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        <PREDII_CURVES size={10} color="#FF6B35" />
        <span style={{ fontSize: 9, fontWeight: 700, color: "#6B7280" }}>
          Powered by <span style={{ color: "#0D3B45" }}>Predii</span>
        </span>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "8px 14px",
        background: "#F9FAFB",
        border: "1px solid #E5E7EB",
        borderRadius: 10,
      }}>
        <PREDII_CURVES size={18} color="#FF6B35" />
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: "#0D3B45" }}>
            Powered by Predii
          </div>
          <div style={{ fontSize: 10, color: "#9CA3AF" }}>
            Your AI assistant for fixed ops · predii.com
          </div>
        </div>
      </div>
    );
  }

  return null;
}
