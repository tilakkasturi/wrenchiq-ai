// AIInsightsStrip — reusable horizontal AI insights bar, injected into every persona screen
import { Sparkles } from "lucide-react";

export default function AIInsightsStrip({ insights = [], label = "AI Insights" }) {
  return (
    <div style={{
      background: "linear-gradient(90deg, #0D3B45 0%, #0D2A40 100%)",
      borderBottom: "1px solid rgba(255,107,53,0.18)",
      padding: "8px 20px",
      display: "flex", alignItems: "center", gap: 10,
      flexShrink: 0, overflowX: "auto",
      scrollbarWidth: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
        <Sparkles size={11} color="#FF6B35" />
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 0.9, textTransform: "uppercase" }}>{label}</span>
      </div>
      {insights.map((ins, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 7, padding: "4px 10px", flexShrink: 0,
        }}>
          <span style={{ fontSize: 11 }}>{ins.icon}</span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.68)" }}>{ins.text}</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: ins.color,
            background: `${ins.color}20`,
            border: `1px solid ${ins.color}28`,
            borderRadius: 4, padding: "1px 5px", flexShrink: 0,
          }}>{ins.value}</span>
          {ins.action && (
            <button style={{
              fontSize: 10, fontWeight: 700, color: "#fff",
              background: "rgba(255,107,53,0.28)", border: "none",
              borderRadius: 5, padding: "2px 8px", cursor: "pointer", flexShrink: 0,
            }}>
              {ins.action}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
