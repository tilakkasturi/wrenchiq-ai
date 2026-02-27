import { Brain } from "lucide-react";
import { COLORS } from "../theme/colors";

const hours = ["7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM"];
const bays = ["Bay 1", "Bay 2", "Bay 3", "Bay 4"];
const bayUsage = [75, 85, 60, 40];

const appointments = [
  { bay: 0, start: 1, duration: 3, customer: "Maria R.", service: "Brakes + Filter", color: "#7C3AED" },
  { bay: 1, start: 1, duration: 4, customer: "David C.", service: "CEL Diagnostic", color: COLORS.accent },
  { bay: 2, start: 2, duration: 3, customer: "Sarah J.", service: "60K Service", color: COLORS.primary },
  { bay: 0, start: 5, duration: 2, customer: "Angela M.", service: "Head Gasket Check", color: "#E11D48" },
  { bay: 3, start: 3, duration: 2, customer: "James W.", service: "AC Repair", color: COLORS.success },
  { bay: 1, start: 6, duration: 3, customer: "Robert T.", service: "Steering Noise", color: "#0D9488" },
];

export default function SchedulingScreen() {
  return (
    <div style={{ padding: "24px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Bay Scheduler</div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>Wednesday, February 25, 2026</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "6px 14px" }}>
            <Brain size={14} color={COLORS.success} />
            <span style={{ fontSize: 12, color: COLORS.success, fontWeight: 600 }}>AI: 2 open slots optimally fit a brake job + oil change</span>
          </div>
          <button style={{ padding: "8px 16px", borderRadius: 8, background: COLORS.accent, color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Schedule Appointment
          </button>
        </div>
      </div>

      {/* Capacity Bars */}
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        {bays.map((bay, i) => {
          const usage = bayUsage[i];
          const usageColor = usage >= 80 ? COLORS.danger : usage >= 60 ? COLORS.warning : COLORS.success;
          return (
            <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 10, padding: "12px 16px", border: "1px solid #E5E7EB" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{bay}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: usageColor }}>{usage}%</span>
              </div>
              <div style={{ height: 6, background: "#F3F4F6", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${usage}%`, background: usageColor }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Grid */}
      <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", borderBottom: "1px solid #E5E7EB" }}>
          <div style={{ padding: "10px", background: "#F9FAFB", borderRight: "1px solid #E5E7EB" }} />
          {bays.map((b, i) => (
            <div key={i} style={{ padding: "10px 14px", background: "#F9FAFB", fontWeight: 700, fontSize: 13, textAlign: "center", borderRight: i < 3 ? "1px solid #E5E7EB" : "none" }}>{b}</div>
          ))}
        </div>

        {/* Time rows */}
        <div style={{ position: "relative" }}>
          {hours.map((h, hi) => (
            <div key={hi} style={{ display: "grid", gridTemplateColumns: "80px repeat(4, 1fr)", borderBottom: "1px solid #F3F4F6", height: 48 }}>
              <div style={{ padding: "12px 10px", fontSize: 11, color: COLORS.textMuted, borderRight: "1px solid #E5E7EB", textAlign: "right", paddingRight: 12 }}>{h}</div>
              {bays.map((_, bi) => (
                <div key={bi} style={{ borderRight: bi < 3 ? "1px solid #F3F4F6" : "none", position: "relative" }}>
                  {appointments.filter(a => a.bay === bi && a.start === hi).map((a, ai) => (
                    <div key={ai} style={{
                      position: "absolute", top: 2, left: 4, right: 4,
                      height: a.duration * 48 - 4,
                      background: a.color + "15",
                      border: `2px solid ${a.color}`,
                      borderRadius: 8, padding: "6px 10px", cursor: "pointer",
                      zIndex: 2, overflow: "hidden",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: a.color }}>{a.customer}</div>
                      <div style={{ fontSize: 11, color: COLORS.textSecondary }}>{a.service}</div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
