import { AlertTriangle, CheckCircle, Camera, Send, Activity } from "lucide-react";
import { COLORS } from "../theme/colors";

const serviceItems = [
  { name: "Front Brake Pads", price: "$340", urgency: "Urgent", desc: "Only 2mm remaining — safety concern", photos: 2, urgencyColor: COLORS.danger },
  { name: "Engine Air Filter", price: "$65", urgency: "Urgent", desc: "70% blocked — affects performance & fuel economy", photos: 1, urgencyColor: COLORS.danger },
  { name: "Rear Tires (2)", price: "$420", urgency: "Soon", desc: "3/32\" tread — recommend within 5,000 miles", photos: 2, urgencyColor: COLORS.warning },
  { name: "Serpentine Belt", price: "$185", urgency: "Can Wait", desc: "Minor cracking — plan for next visit", photos: 1, urgencyColor: COLORS.textMuted },
];

export default function CustomerPortalScreen() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "24px 28px", background: "#F3F4F6", minHeight: "calc(100vh - 64px)" }}>
      <div style={{ width: 375, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 20px 60px rgba(0,0,0,0.12)", border: "8px solid #1A1A1A" }}>
        {/* Phone Status Bar */}
        <div style={{ background: COLORS.primary, padding: "12px 20px 0", color: "#fff" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginBottom: 12 }}>
            <span>9:41</span>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <Activity size={12} /> <span>5G</span>
            </div>
          </div>
          <div style={{ textAlign: "center", paddingBottom: 20 }}>
            <div style={{ fontSize: 11, opacity: 0.7, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>WrenchIQ Auto Care</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Your Vehicle Update</div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>2021 Toyota Camry SE</div>
          </div>
        </div>

        {/* Status Timeline */}
        <div style={{ padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", marginBottom: 24 }}>
            <div style={{ position: "absolute", top: 11, left: 12, right: 12, height: 2, background: "#E5E7EB" }} />
            <div style={{ position: "absolute", top: 11, left: 12, width: "60%", height: 2, background: COLORS.success }} />
            {["Checked In", "Inspected", "Your Approval", "Repair", "Ready"].map((step, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 1, width: 56 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
                  background: i < 2 ? COLORS.success : i === 2 ? COLORS.accent : "#E5E7EB",
                  border: i === 2 ? "3px solid #FFF7ED" : "none",
                }}>
                  {i < 2
                    ? <CheckCircle size={14} color="#fff" />
                    : i === 2
                      ? <span style={{ color: "#fff", fontSize: 10 }}>●</span>
                      : <span style={{ width: 8, height: 8, borderRadius: 4, background: "#D1D5DB", display: "inline-block" }} />}
                </div>
                <div style={{ fontSize: 9, color: i <= 2 ? COLORS.textPrimary : COLORS.textMuted, marginTop: 6, textAlign: "center", fontWeight: i === 2 ? 700 : 400 }}>{step}</div>
              </div>
            ))}
          </div>

          {/* Action Needed Banner */}
          <div style={{ background: "#FFF7ED", borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <AlertTriangle size={16} color={COLORS.accent} />
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.accent }}>Action Needed</div>
            </div>
            <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6 }}>
              Hi Maria, we've completed the inspection on your Camry. Here's what we found:
            </div>
          </div>

          {/* Service Items */}
          {serviceItems.map((s, i) => (
            <div key={i} style={{ background: "#F9FAFB", borderRadius: 10, padding: 14, marginBottom: 10, border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 10, fontWeight: 700, color: s.urgencyColor, textTransform: "uppercase" }}>{s.urgency}</span>
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginTop: 2 }}>{s.name}</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{s.price}</div>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>{s.desc}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: COLORS.primary }}>
                <Camera size={12} /> {s.photos} photo{s.photos > 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={{ flex: 1, padding: "8px", borderRadius: 8, background: COLORS.success, color: "#fff", border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Approve
                </button>
                <button style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#fff", color: COLORS.textSecondary, border: "1px solid #E5E7EB", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  Decline
                </button>
              </div>
            </div>
          ))}

          {/* Total */}
          <div style={{ background: COLORS.primary, borderRadius: 12, padding: 16, marginTop: 16, color: "#fff", textAlign: "center" }}>
            <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 4 }}>Estimated Total (if all approved)</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>$1,010</div>
            <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>Includes parts, labor, and shop supplies</div>
            <button style={{ width: "100%", padding: "12px", borderRadius: 10, background: COLORS.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, marginTop: 14, cursor: "pointer" }}>
              Approve Selected & Pay Deposit
            </button>
          </div>

          {/* Chat */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 0", marginTop: 12 }}>
            <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 20, padding: "10px 16px", fontSize: 13, color: COLORS.textMuted }}>
              Message your service advisor...
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 18, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Send size={16} color="#fff" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
