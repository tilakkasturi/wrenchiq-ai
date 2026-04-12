// BrandToggle — fixed floating pill to switch between WrenchIQ and PrediiPowered branding.
import { useBranding } from "../context/BrandingContext";

export default function BrandToggle() {
  const { brand, setBrand } = useBranding();
  const isPredii = brand === "PrediiPowered";

  return (
    <div
      style={{
        position: "fixed",
        bottom: 48,
        left: 16,
        zIndex: 9999,
      }}
    >
      <button
        onClick={() => setBrand(isPredii ? "WrenchIQ" : "PrediiPowered")}
        title={`Switch to ${isPredii ? "WrenchIQ" : "PrediiPowered"}`}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "8px 14px",
          borderRadius: 20,
          border: `1.5px solid ${isPredii ? "#0D3B45" : "#FF6B35"}`,
          cursor: "pointer",
          background: "#fff",
          boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          fontSize: 12, fontWeight: 700,
          letterSpacing: 0.2,
          color: isPredii ? "#0D3B45" : "#FF6B35",
          whiteSpace: "nowrap",
          transition: "all 0.2s",
        }}
      >
        <span style={{ fontSize: 14, lineHeight: 1 }}>⚡</span>
        {isPredii ? "PrediiPowered" : "WrenchIQ"}
        <span style={{
          fontSize: 9, fontWeight: 600,
          background: isPredii ? "#0D3B4518" : "#FF6B3518",
          borderRadius: 4, padding: "1px 5px",
          letterSpacing: 0.5,
        }}>
          BRAND
        </span>
      </button>
    </div>
  );
}
