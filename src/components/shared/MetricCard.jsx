import { TrendingUp, TrendingDown } from "lucide-react";
import { COLORS } from "../../theme/colors";

export default function MetricCard({ icon: Icon, label, value, change, positive, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "#fff", borderRadius: 12, padding: "18px 20px",
        border: "1px solid #E5E7EB", flex: 1, minWidth: 180,
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500, marginBottom: 6 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 10,
          background: COLORS.primary + "10",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={COLORS.primary} />
        </div>
      </div>
      {change && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 8 }}>
          {positive
            ? <TrendingUp size={13} color={COLORS.success} />
            : <TrendingDown size={13} color={COLORS.danger} />}
          <span style={{ fontSize: 12, fontWeight: 600, color: positive ? COLORS.success : COLORS.danger }}>{change}</span>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>vs last week</span>
        </div>
      )}
    </div>
  );
}
