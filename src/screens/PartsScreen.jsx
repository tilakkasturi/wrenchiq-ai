import { Search, Car, Brain, Star } from "lucide-react";
import { COLORS } from "../theme/colors";
import { partsComparison } from "../data/sampleData";

export default function PartsScreen() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Parts Intelligence</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "#F9FAFB", borderRadius: 10, padding: "8px 14px", border: "1px solid #E5E7EB", width: 400 }}>
          <Search size={16} color={COLORS.textMuted} />
          <input placeholder="Search by part #, description, or vehicle..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1 }} />
        </div>
      </div>

      {/* Active Search */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "16px 20px", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <Car size={18} color={COLORS.primary} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>2019 Honda CR-V EX-L — Catalytic Converter</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>RO #4582 • David Chen • Bay 2</div>
          </div>
        </div>

        {/* AI Recommendation Banner */}
        <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Brain size={18} color={COLORS.success} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.success }}>AI Recommendation: Walker 16468</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Best value — $189 cheaper than OEM, 4.7★ rating, immediate availability, strong warranty. Used in 12 installs by your shop with zero returns.</div>
          </div>
        </div>

        {/* Comparison Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#F9FAFB" }}>
                {["Part", "Supplier", "Your Cost", "Customer Price", "Availability", "Rating", "Delivery", "Warranty"].map(h => (
                  <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontWeight: 600, color: COLORS.textSecondary, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partsComparison.map((p, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #F3F4F6", background: i === 0 ? "#F0FDF410" : "transparent" }}>
                  <td style={{ padding: "12px", fontWeight: i === 0 ? 600 : 400 }}>
                    {i === 0 && <span style={{ fontSize: 10, background: COLORS.success, color: "#fff", borderRadius: 4, padding: "1px 6px", marginRight: 6 }}>BEST</span>}
                    {p.part}
                  </td>
                  <td style={{ padding: "12px" }}>{p.supplier}</td>
                  <td style={{ padding: "12px", fontWeight: 600 }}>${p.price}</td>
                  <td style={{ padding: "12px", fontWeight: 600, color: COLORS.primary }}>${p.markup.toFixed(2)}</td>
                  <td style={{ padding: "12px" }}>
                    <span style={{ color: p.avail === "Backorder" ? COLORS.danger : COLORS.success, fontWeight: 600 }}>{p.avail}</span>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={12} color="#F59E0B" fill="#F59E0B" /> {p.rating}
                    </div>
                  </td>
                  <td style={{ padding: "12px", color: COLORS.textSecondary }}>{p.delivery}</td>
                  <td style={{ padding: "12px" }}>{p.warranty}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Parts Margin Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500, marginBottom: 6 }}>Parts Margin (This Week)</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>48.2%</div>
          <div style={{ fontSize: 12, color: COLORS.warning, fontWeight: 600, marginTop: 4 }}>Target: 50%</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500, marginBottom: 6 }}>Orders Pending</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>3</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>$1,247 total value</div>
        </div>
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "16px 20px" }}>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500, marginBottom: 6 }}>Avg Delivery Time</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>1.4h</div>
          <div style={{ fontSize: 12, color: COLORS.success, fontWeight: 600, marginTop: 4 }}>↓ 22% vs last month</div>
        </div>
      </div>
    </div>
  );
}
