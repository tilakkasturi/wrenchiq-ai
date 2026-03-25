import { useState } from "react";
import {
  ChevronLeft, ChevronRight, Plus, Brain, Clock, Car, User,
  Zap, DollarSign, AlertTriangle, CheckCircle, Calendar,
  TrendingUp, Target, Repeat, ArrowRight, Bell,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Time slots & bays ────────────────────────────────────────
const HOURS = ["7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM"];
const BAYS = [
  { id: 1, name: "Bay 1", tech: "DeShawn W.", specialty: "Engine / Brakes" },
  { id: 2, name: "Bay 2", tech: "Marcus R.", specialty: "Electrical / Diagnostics" },
  { id: 3, name: "Bay 3", tech: "James K.", specialty: "General Service" },
  { id: 4, name: "Bay 4", tech: "Sofia L.", specialty: "Transmission / Drivetrain" },
  { id: 5, name: "Bay 5", tech: "Unassigned", specialty: "Open" },
  { id: 6, name: "Bay 6", tech: "Unassigned", specialty: "Open" },
];

// startHour (0=7AM index), duration (hours), color, revenue
const APPOINTMENTS = [
  { id: "a1",  bay: 1, startHour: 0, duration: 1.5, customer: "Sarah Chen",     vehicle: "2022 Tesla Model 3",    service: "Annual Service",          revenue: 487, status: "in-progress", type: "service" },
  { id: "a2",  bay: 1, startHour: 2, duration: 2.5, customer: "James Park",     vehicle: "2020 BMW X3",           service: "Brake Vibration Diag.",   revenue: 1847,status: "scheduled",   type: "brake" },
  { id: "a3",  bay: 1, startHour: 5, duration: 1,   customer: "Kevin Liu",      vehicle: "2019 Toyota Camry",     service: "Pre-Purchase Inspection", revenue: 149, status: "scheduled",   type: "inspection" },
  { id: "a4",  bay: 2, startHour: 0, duration: 3,   customer: "David Kim",      vehicle: "2019 Honda CR-V",       service: "90K Service + P0420",     revenue: 780, status: "in-progress", type: "diagnostic" },
  { id: "a5",  bay: 2, startHour: 4, duration: 2,   customer: "Priya Nair",     vehicle: "2021 Hyundai Sonata",   service: "CEL Diagnostic + Repair", revenue: 490, status: "scheduled",   type: "diagnostic" },
  { id: "a6",  bay: 3, startHour: 1, duration: 1,   customer: "Robert Chen",    vehicle: "2020 Toyota RAV4",      service: "AC Recharge",             revenue: 129, status: "completed",   type: "service" },
  { id: "a7",  bay: 3, startHour: 2.5, duration: 2, customer: "Monica Santos",  vehicle: "2021 Toyota Camry",     service: "Air Filter + Belt",       revenue: 213, status: "in-progress", type: "service" },
  { id: "a8",  bay: 3, startHour: 5, duration: 1.5, customer: "Diana Moss",     vehicle: "2018 Honda Accord",     service: "Oil Change + Rotation",   revenue: 149, status: "scheduled",   type: "oil" },
  { id: "a9",  bay: 4, startHour: 0, duration: 4,   customer: "Marcus Webb",    vehicle: "2017 Ford F-150",       service: "Transmission Service",    revenue: 420, status: "in-progress", type: "transmission" },
  { id: "a10", bay: 5, startHour: 2, duration: 1,   customer: "Elena Park",     vehicle: "2023 Kia Telluride",    service: "Tire Rotation + Balance", revenue: 89,  status: "scheduled",   type: "tire" },
];

// AI suggested appointments (not yet placed)
const AI_SUGGESTIONS = [
  {
    id: "s1",
    customer: "Angela Martinez",
    vehicle: "2018 Subaru Outback",
    service: "Head Gasket Inspection (Overdue)",
    revenue: 165,
    urgency: "high",
    aiReason: "Last visit was 8 months ago. P0300 code pattern matches pre-failure symptom. Recommend proactive check.",
    suggestedBay: 6,
    suggestedTime: "1 PM",
    confidence: 94,
  },
  {
    id: "s2",
    customer: "Tom Wallace",
    vehicle: "2020 Jeep Tucson",
    service: "Oil Change (Overdue 2,100 mi)",
    revenue: 89,
    urgency: "medium",
    aiReason: "Customer opened portal 3× this week. Due for oil change — ideal fill for Bay 6 at 3 PM.",
    suggestedBay: 6,
    suggestedTime: "3 PM",
    confidence: 87,
  },
  {
    id: "s3",
    customer: "Robert Chen",
    vehicle: "2020 Toyota RAV4",
    service: "Post-AC Service Follow-up",
    revenue: 0,
    urgency: "low",
    aiReason: "AC recharge completed this AM. Customer mentioned possible cabin filter issue. Quick add-on check while in area.",
    suggestedBay: 3,
    suggestedTime: "4 PM",
    confidence: 72,
  },
];

const STATUS_COLORS = {
  "in-progress": { bg: "#DBEAFE", border: "#93C5FD", text: "#1D4ED8", dot: "#3B82F6" },
  "scheduled":   { bg: "#FEF9C3", border: "#FDE68A", text: "#92400E", dot: "#F59E0B" },
  "completed":   { bg: "#D1FAE5", border: "#6EE7B7", text: "#065F46", dot: "#10B981" },
  "ai-suggest":  { bg: "#F0EFFF", border: "#C4B5FD", text: "#5B21B6", dot: "#8B5CF6" },
};

const TYPE_COLORS = {
  brake:        "#EF4444",
  diagnostic:   "#8B5CF6",
  service:      "#3B82F6",
  oil:          "#10B981",
  transmission: "#F97316",
  tire:         "#0EA5E9",
  inspection:   "#6366F1",
};

// ─── Day Stats ────────────────────────────────────────────────
function DayStats() {
  const totalRev = APPOINTMENTS.reduce((s, a) => s + a.revenue, 0);
  const aiRev = AI_SUGGESTIONS.reduce((s, a) => s + a.revenue, 0);
  const filled = APPOINTMENTS.length;
  const capacity = BAYS.length * HOURS.length;
  const utilPct = Math.round((APPOINTMENTS.reduce((s, a) => s + a.duration, 0) / (BAYS.length * 10)) * 100);

  const stats = [
    { label: "Today's Revenue", value: `$${totalRev.toLocaleString()}`, sub: `+$${aiRev} AI opportunities`, icon: DollarSign, color: "#059669" },
    { label: "Bay Utilization", value: `${utilPct}%`, sub: `${APPOINTMENTS.length} jobs booked`, icon: Target, color: "#3B82F6" },
    { label: "AI Opportunities", value: `+$${aiRev}`, sub: `${AI_SUGGESTIONS.length} slots suggested`, icon: Brain, color: "#8B5CF6" },
    { label: "Est. Daily Target", value: "$7,500", sub: `$${(7500 - totalRev).toLocaleString()} gap`, icon: TrendingUp, color: COLORS.accent },
  ];

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
      {stats.map((s, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "12px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, marginTop: 2 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: s.color, fontWeight: 600, marginTop: 2 }}>{s.sub}</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: s.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <s.icon size={17} color={s.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Appointment Block ────────────────────────────────────────
function ApptBlock({ appt, totalHours, onClick, selected }) {
  const left = (appt.startHour / totalHours) * 100;
  const width = (appt.duration / totalHours) * 100;
  const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
  const typeColor = TYPE_COLORS[appt.type] || "#6B7280";

  return (
    <div
      onClick={() => onClick(appt)}
      title={`${appt.customer} · ${appt.service} · $${appt.revenue}`}
      style={{
        position: "absolute",
        left: `${left}%`,
        width: `calc(${width}% - 4px)`,
        top: 4,
        bottom: 4,
        background: sc.bg,
        border: `1.5px solid ${selected ? typeColor : sc.border}`,
        borderRadius: 8,
        padding: "4px 6px",
        cursor: "pointer",
        overflow: "hidden",
        boxShadow: selected ? `0 0 0 2px ${typeColor}` : "none",
        transition: "box-shadow 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 1 }}>
        <div style={{ width: 6, height: 6, borderRadius: 3, background: typeColor, flexShrink: 0 }} />
        <div style={{ fontSize: 10, fontWeight: 700, color: sc.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {appt.customer.split(" ")[0]}
        </div>
        <div style={{ fontSize: 9, color: COLORS.textMuted, marginLeft: "auto", flexShrink: 0 }}>${appt.revenue}</div>
      </div>
      {appt.duration >= 1 && (
        <div style={{ fontSize: 9, color: COLORS.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {appt.service}
        </div>
      )}
    </div>
  );
}

// ─── AI Suggestion Card ───────────────────────────────────────
function AISuggestionCard({ suggestion, onBook }) {
  const urgencyColors = {
    high: { color: "#EF4444", bg: "#FEF2F2" },
    medium: { color: "#F59E0B", bg: "#FFFBEB" },
    low: { color: "#6B7280", bg: "#F9FAFB" },
  };
  const uc = urgencyColors[suggestion.urgency] || urgencyColors.low;

  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "12px 14px", marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#F5F3FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Brain size={16} color="#8B5CF6" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{suggestion.customer}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{suggestion.vehicle}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: uc.color }} />
          <span style={{ fontSize: 10, fontWeight: 600, color: uc.color }}>{suggestion.urgency}</span>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{suggestion.service}</div>

      <div style={{ background: "#F5F3FF", borderRadius: 8, padding: "6px 8px", marginBottom: 8 }}>
        <div style={{ fontSize: 10, color: "#6D28D9", lineHeight: 1.4 }}>
          <strong>AI:</strong> {suggestion.aiReason}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: COLORS.textMuted }}>
          Suggested: Bay {suggestion.suggestedBay} · {suggestion.suggestedTime}
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: suggestion.revenue > 0 ? "#059669" : COLORS.textMuted }}>
          {suggestion.revenue > 0 ? `+$${suggestion.revenue}` : "Goodwill"}
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8 }}>
        <div style={{ flex: 1, height: 4, background: "#F3F4F6", borderRadius: 2 }}>
          <div style={{ height: 4, background: "#8B5CF6", borderRadius: 2, width: `${suggestion.confidence}%` }} />
        </div>
        <span style={{ fontSize: 10, color: "#8B5CF6", fontWeight: 700 }}>{suggestion.confidence}% confidence</span>
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => onBook(suggestion)}
          style={{ flex: 1, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}
        >
          <Calendar size={12} /> Book Now
        </button>
        <button style={{ flex: 1, background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 8, padding: "7px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          Send Invite
        </button>
      </div>
    </div>
  );
}

// ─── Selected Appointment Detail ──────────────────────────────
function ApptDetail({ appt }) {
  if (!appt) return (
    <div style={{ padding: "20px", textAlign: "center", color: COLORS.textMuted }}>
      <Calendar size={24} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
      <div style={{ fontSize: 13 }}>Click any appointment to see details</div>
    </div>
  );

  const sc = STATUS_COLORS[appt.status] || STATUS_COLORS.scheduled;
  const typeColor = TYPE_COLORS[appt.type] || "#6B7280";

  const startHour = 7 + Math.floor(appt.startHour);
  const startMin = (appt.startHour % 1) * 60;
  const endDecimal = appt.startHour + appt.duration;
  const endHour = 7 + Math.floor(endDecimal);
  const endMin = (endDecimal % 1) * 60;
  const fmt = (h, m) => `${h > 12 ? h - 12 : h}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;

  return (
    <div style={{ padding: "14px" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ width: 10, height: 10, borderRadius: 3, background: typeColor, marginTop: 4, flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>{appt.customer}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{appt.vehicle}</div>
        </div>
      </div>

      <div style={{ background: sc.bg, borderRadius: 8, padding: "8px 10px", marginBottom: 10, fontSize: 12, fontWeight: 600, color: sc.text }}>
        {appt.service}
      </div>

      {[
        { label: "Bay", value: `Bay ${appt.bay}` },
        { label: "Time", value: `${fmt(startHour, startMin)} – ${fmt(endHour, endMin)}` },
        { label: "Duration", value: `${appt.duration} hrs` },
        { label: "Revenue", value: `$${appt.revenue}`, bold: true, color: "#059669" },
        { label: "Status", value: appt.status.replace("-", " "), color: sc.dot },
      ].map((row, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
          <span style={{ color: COLORS.textMuted }}>{row.label}</span>
          <span style={{ fontWeight: row.bold ? 800 : 600, color: row.color || COLORS.textPrimary }}>{row.value}</span>
        </div>
      ))}

      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
        <button style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Open RO
        </button>
        <button style={{ background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Reassign Bay
        </button>
        <button style={{ background: "#FEF2F2", color: "#DC2626", border: "none", borderRadius: 8, padding: "8px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Cancel Appointment
        </button>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function SmartSchedulingScreen() {
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [bookedSuggestions, setBookedSuggestions] = useState([]);
  const totalHours = HOURS.length;
  const now = new Date();

  const handleBook = (suggestion) => {
    setBookedSuggestions(prev => [...prev, suggestion.id]);
  };

  const remainingSuggestions = AI_SUGGESTIONS.filter(s => !bookedSuggestions.includes(s.id));

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>Smart Scheduling</h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            Thursday, March 5, 2026 · {BAYS.length} bays · AI-optimized for max revenue
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 2 }}>
            {["Day", "Week"].map(v => (
              <button key={v} style={{ padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: v === "Day" ? "#fff" : "transparent", color: v === "Day" ? COLORS.textPrimary : COLORS.textMuted, boxShadow: v === "Day" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                {v}
              </button>
            ))}
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <Plus size={14} /> New Appointment
          </button>
        </div>
      </div>

      {/* Stats */}
      <DayStats />

      {/* Main layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16 }}>

        {/* Calendar Grid */}
        <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
          {/* Time Header */}
          <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", borderBottom: "1px solid #E5E7EB" }}>
            <div style={{ padding: "10px 12px", borderRight: "1px solid #F3F4F6", background: "#F9FAFB" }} />
            <div style={{ display: "flex", position: "relative" }}>
              {HOURS.map((h, i) => (
                <div key={h} style={{ flex: 1, padding: "8px 0", textAlign: "center", fontSize: 10, fontWeight: 600, color: COLORS.textMuted, borderRight: "1px solid #F3F4F6" }}>
                  {h}
                </div>
              ))}
            </div>
          </div>

          {/* Bay Rows */}
          {BAYS.map((bay, bayIdx) => {
            const bayAppts = APPOINTMENTS.filter(a => a.bay === bay.id);
            return (
              <div key={bay.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr", borderBottom: bayIdx < BAYS.length - 1 ? "1px solid #F3F4F6" : "none" }}>
                {/* Bay Label */}
                <div style={{ padding: "12px", borderRight: "1px solid #F3F4F6", background: "#FAFAFA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary }}>{bay.name}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>{bay.tech.split(" ")[0]}</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 1, lineHeight: 1.3 }}>{bay.specialty}</div>
                </div>

                {/* Timeline */}
                <div style={{ position: "relative", height: 70 }}>
                  {/* Hour grid lines */}
                  {HOURS.map((_, i) => (
                    <div key={i} style={{ position: "absolute", left: `${(i / HOURS.length) * 100}%`, top: 0, bottom: 0, width: 1, background: "#F3F4F6" }} />
                  ))}

                  {/* Current time indicator */}
                  {(() => {
                    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
                    const shopStartHour = 7;
                    const shopEndHour = 18;
                    if (currentHourDecimal >= shopStartHour && currentHourDecimal <= shopEndHour) {
                      const pct = ((currentHourDecimal - shopStartHour) / HOURS.length) * 100;
                      return (
                        <div style={{ position: "absolute", left: `${pct}%`, top: 0, bottom: 0, width: 2, background: "#EF4444", zIndex: 10, opacity: 0.7 }}>
                          <div style={{ position: "absolute", top: 0, left: -3, width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Appointment blocks */}
                  {bayAppts.map(appt => (
                    <ApptBlock
                      key={appt.id}
                      appt={appt}
                      totalHours={HOURS.length}
                      onClick={setSelectedAppt}
                      selected={selectedAppt?.id === appt.id}
                    />
                  ))}

                  {/* AI Suggested slot for this bay */}
                  {remainingSuggestions.filter(s => s.suggestedBay === bay.id).map(s => {
                    const timeIndex = ["7 AM","8 AM","9 AM","10 AM","11 AM","12 PM","1 PM","2 PM","3 PM","4 PM","5 PM"].indexOf(s.suggestedTime);
                    if (timeIndex < 0) return null;
                    return (
                      <div
                        key={s.id}
                        title={`AI Suggestion: ${s.customer} · ${s.service}`}
                        style={{
                          position: "absolute",
                          left: `${(timeIndex / HOURS.length) * 100}%`,
                          width: `${(1 / HOURS.length) * 100 - 0.5}%`,
                          top: 4, bottom: 4,
                          background: "#F5F3FF",
                          border: "1.5px dashed #A78BFA",
                          borderRadius: 8,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 9,
                          color: "#7C3AED",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        AI ✦
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

          {/* Selected Appt Detail */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6", fontWeight: 700, fontSize: 13 }}>
              Appointment Detail
            </div>
            <ApptDetail appt={selectedAppt} />
          </div>

          {/* AI Scheduling Suggestions */}
          {remainingSuggestions.length > 0 && (
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 8, alignItems: "center" }}>
                <Brain size={15} color="#8B5CF6" />
                <div style={{ fontWeight: 700, fontSize: 13 }}>AI Schedule Suggestions</div>
                <div style={{ marginLeft: "auto", background: "#F5F3FF", color: "#7C3AED", borderRadius: 4, padding: "1px 6px", fontSize: 10, fontWeight: 700 }}>
                  {remainingSuggestions.length} open
                </div>
              </div>
              <div style={{ padding: "12px 14px" }}>
                {remainingSuggestions.map(s => (
                  <AISuggestionCard key={s.id} suggestion={s} onBook={handleBook} />
                ))}
              </div>
            </div>
          )}

          {bookedSuggestions.length > 0 && (
            <div style={{ background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 8, alignItems: "center" }}>
              <CheckCircle size={16} color="#059669" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>{bookedSuggestions.length} AI appointment{bookedSuggestions.length > 1 ? "s" : ""} booked</div>
                <div style={{ fontSize: 11, color: "#047857" }}>Customers notified via SMS</div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "12px 14px" }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Service Types</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
                  <span style={{ fontSize: 10, color: COLORS.textSecondary, textTransform: "capitalize" }}>{type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
