import { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line,
} from "recharts";
import {
  DollarSign, Car, Target, Timer, UserCheck, Brain, AlertTriangle,
  Zap, Package, MessageSquare, Phone, ClipboardList, ChevronRight,
  ChevronUp, ChevronDown, Shield, Sparkles,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import {
  SHOP, repairOrders, customers, vehicles, technicians,
  bayStatus, revenueData, todayMetrics, getCustomer, getVehicle, getTech,
} from "../data/demoData";
import { getRecallsForVehicle } from "../data/tsbData";
import MetricCard from "../components/shared/MetricCard";
import StatusBadge from "../components/shared/StatusBadge";

export default function DashboardScreen() {
  const [aiExpanded, setAiExpanded] = useState(true);
  const m = todayMetrics;

  // Build today's appointments from active repair orders
  const todayROs = repairOrders.filter(ro => ro.status !== "scheduled");

  // Check for vehicle recalls
  const recallAlerts = [];
  repairOrders.forEach(ro => {
    const veh = getVehicle(ro.vehicleId);
    if (veh) {
      const recalls = getRecallsForVehicle(veh.make, veh.model, veh.year);
      recalls.forEach(r => recallAlerts.push({ ...r, vehicle: veh, customer: getCustomer(ro.customerId) }));
    }
  });

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* Recall Alert Banner */}
      {recallAlerts.length > 0 && (
        <div style={{
          background: "linear-gradient(90deg, #DC2626 0%, #B91C1C 100%)",
          borderRadius: 12,
          padding: "12px 18px",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          color: "#fff",
        }}>
          <Shield size={20} />
          <div style={{ flex: 1 }}>
            <span style={{ fontWeight: 700, fontSize: 13 }}>NHTSA RECALL ALERT</span>
            {recallAlerts.slice(0, 2).map((r, i) => (
              <div key={i} style={{ fontSize: 12, opacity: 0.95, marginTop: 2 }}>
                {r.customer?.firstName} {r.customer?.lastName}'s {r.vehicle.year} {r.vehicle.make} {r.vehicle.model} — {r.component} (#{r.nhtsaCampaignNumber}). {r.remedy?.split(".")[0]}.
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 10px", fontWeight: 600, whiteSpace: "nowrap" }}>
            via NHTSA API
          </div>
        </div>
      )}

      {/* Top Metrics */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <MetricCard icon={DollarSign} label="Today's Revenue" value={`$${m.revenue.toLocaleString()}`} change={`+${m.revenueTrend}%`} positive sub={`Target: $${m.revenueTarget.toLocaleString()}`} />
        <MetricCard icon={Car} label="Car Count" value={String(m.carCount)} change={`+${m.carCountTrend}`} positive sub={`${m.carsScheduled} scheduled today`} />
        <MetricCard icon={Target} label="Avg Repair Order" value={`$${m.avgRO}`} change={`+${m.aroTrend}%`} positive sub={`Goal: $${m.aroGoal}`} />
        <MetricCard icon={Timer} label="Bay Utilization" value={`${m.bayUtilization}%`} change={`${m.bayTrend}%`} sub={`${m.baysActive} of ${m.baysTotal} bays active`} />
        <MetricCard icon={UserCheck} label="Tech Efficiency" value={`${m.techEfficiency}%`} change={`+${m.techTrend}%`} positive sub="Billed vs. available hrs" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* AI Insights Panel */}
          <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "18px 22px", color: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain size={18} color="#FF6B35" />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>WrenchIQ AI Copilot</span>
                  <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>4 insights for today</span>
                </div>
                <span style={{ fontSize: 9, background: "rgba(255,255,255,0.15)", borderRadius: 4, padding: "2px 8px", fontWeight: 600, marginLeft: 4 }}>
                  <Sparkles size={10} style={{ verticalAlign: "middle", marginRight: 3 }} />Sonnet 4.6
                </span>
              </div>
              <button onClick={() => setAiExpanded(!aiExpanded)} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", color: "#fff" }}>
                {aiExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {aiExpanded && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { icon: AlertTriangle, color: "#F59E0B", title: "James Park's BMW X3 — estimate waiting 2 hrs", body: "Brake noise investigation estimate ($1,847) sent at 10:15 AM. High-LTV customer ($12,450). SIB-34-16-20 applies — front brake vibration is known at 60-65K miles. Send follow-up with TSB reference to build trust." },
                  { icon: Zap, color: "#22C55E", title: "TSB match: David Kim's CR-V — oil dilution", body: "TSB-19-052 applies to the 1.5T engine. Honda extended warranty was 6yr/80K — David's at 87.4K/6.5yr, just outside. Recommend attempting goodwill claim. P0420 catalytic code is likely related." },
                  { icon: Package, color: "#60A5FA", title: "Parts savings: eBay Motors vs O'Reilly", body: "Walker 16468 catalytic converter for David's CR-V: $298 on eBay Motors (AutoPartsWarehouse_CA, 99.2% seller rating) vs $342 at O'Reilly. Same part, $44 savings, ships from Sacramento." },
                  { icon: DollarSign, color: "#A78BFA", title: "Xero alert: 3 invoices overdue ($3,215)", body: "Sarah Chen's brake service ($1,890) is 14 days past due. David Kim's diagnostic ($785) 7 days. Tom Wallace's oil change ($540) 3 days. Recommend automated SMS reminders." },
                ].map((insight, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <insight.icon size={16} color={insight.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{insight.title}</div>
                      <div style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{insight.body}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Today's Board */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Workflow</div>
              <button style={{ fontSize: 12, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>+ New RO</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["RO #", "Customer", "Vehicle", "Service", "Bay", "Tech", "Status", ""].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: COLORS.textSecondary, fontSize: 11, textTransform: "uppercase", letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {todayROs.map(ro => {
                    const cust = getCustomer(ro.customerId);
                    const veh = getVehicle(ro.vehicleId);
                    const tech = ro.techId ? getTech(ro.techId) : null;
                    return (
                      <tr key={ro.id} style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                        <td style={{ padding: "12px 14px", fontWeight: 600, color: COLORS.primary, fontSize: 12 }}>{ro.id}</td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{cust?.firstName} {cust?.lastName}</div>
                          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{cust?.phone}</div>
                        </td>
                        <td style={{ padding: "12px 14px" }}>
                          <div style={{ color: COLORS.textSecondary }}>{veh?.year} {veh?.make} {veh?.model}</div>
                          <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>VIN ...{veh?.vin?.slice(-6)}</div>
                        </td>
                        <td style={{ padding: "12px 14px", maxWidth: 200 }}>
                          <div style={{ color: COLORS.textSecondary }}>{ro.serviceType}</div>
                          {ro.isOemService && (
                            <span style={{ fontSize: 9, background: "#DBEAFE", color: "#1D4ED8", borderRadius: 3, padding: "1px 5px", fontWeight: 600 }}>OEM {ro.oemMilestone}</span>
                          )}
                        </td>
                        <td style={{ padding: "12px 14px", textAlign: "center" }}>
                          {ro.bay
                            ? <span style={{ background: COLORS.primary, color: "#fff", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>{ro.bay}</span>
                            : <span style={{ color: COLORS.textMuted }}>—</span>}
                        </td>
                        <td style={{ padding: "12px 14px", color: COLORS.textSecondary, fontSize: 12 }}>{tech?.name?.split(" ").map(n => n[0] + ".").join(" ") || "—"}</td>
                        <td style={{ padding: "12px 14px" }}><StatusBadge status={ro.status} /></td>
                        <td style={{ padding: "12px 14px" }}>
                          {ro.aiInsights?.length > 0 && (
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <Brain size={12} color={COLORS.accent} />
                              <span style={{ fontSize: 11, color: COLORS.accent, fontWeight: 500 }}>AI</span>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue Chart */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "18px 20px" }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>This Week's Revenue</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                <YAxis tick={{ fontSize: 12, fill: COLORS.textSecondary }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#revGrad)" isAnimationActive={false} />
                <Line type="monotone" dataKey="target" stroke={COLORS.accent} strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bay Status */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Bay Status</div>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{SHOP.bays} bays</span>
            </div>
            {bayStatus.map(b => {
              const tech = b.techId ? getTech(b.techId) : null;
              const ro = b.roId ? repairOrders.find(r => r.id === b.roId) : null;
              const veh = ro ? getVehicle(ro.vehicleId) : null;
              const statusColors = {
                working: COLORS.success,
                inspecting: COLORS.warning,
                waiting_approval: COLORS.accent,
                ready_to_start: "#8B5CF6",
                available: COLORS.textMuted,
              };
              const statusLabels = {
                working: "Working",
                inspecting: "Inspecting",
                waiting_approval: "Waiting Approval",
                ready_to_start: "Ready to Start",
                available: "Available",
              };
              const color = statusColors[b.status] || COLORS.textMuted;
              return (
                <div key={b.bay} style={{ marginBottom: 14, paddingBottom: 14, borderBottom: b.bay < SHOP.bays ? "1px solid #F3F4F6" : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: color + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color }}>{b.bay}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{tech?.name?.split(" ")[0] || "—"} {tech?.name?.split(" ")[1]?.[0] || ""}.</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>{veh ? `${veh.year} ${veh.make} ${veh.model}` : "—"}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color }}>{statusLabels[b.status]}</span>
                  </div>
                  {b.progress > 0 && (
                    <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2 }}>
                      <div style={{ height: 4, background: color, borderRadius: 2, width: `${b.progress}%`, transition: "width 0.5s" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Quick Actions</div>
            {[
              { icon: MessageSquare, label: "Follow up with James P. — BMW estimate", color: COLORS.accent },
              { icon: Phone, label: "Call David K. — TSB-19-052 discussion", color: COLORS.success },
              { icon: ClipboardList, label: "Assign Bay 5 to Robert's F-150", color: COLORS.warning },
              { icon: Package, label: "Confirm eBay Motors parts order", color: COLORS.primary },
            ].map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, cursor: "pointer", marginBottom: 4, background: i === 0 ? a.color + "08" : "transparent" }}>
                <a.icon size={16} color={a.color} />
                <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{a.label}</span>
                <ChevronRight size={14} color={COLORS.textMuted} style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>

          {/* Live Feed */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px" }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Live Feed</div>
            {[
              { time: "2 min ago", text: "Monica R. approved brake inspection upsell — 60K service", type: "success" },
              { time: "8 min ago", text: "NHTSA VIN decode: 5NMJFCAE3PH264144 — 2023 Hyundai Tucson SEL confirmed", type: "info" },
              { time: "15 min ago", text: "AI DVI analysis complete — Bay 1 Camry: 2 urgent, 4 monitor items", type: "info" },
              { time: "32 min ago", text: "eBay Motors: Walker 16468 order confirmed — ships from Sacramento", type: "info" },
              { time: "1 hr ago", text: "Xero sync: 3 invoices overdue ($3,215 total AR)", type: "neutral" },
            ].map((n, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < 4 ? "1px solid #F9FAFB" : "none" }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, marginTop: 6, flexShrink: 0, background: n.type === "success" ? COLORS.success : n.type === "info" ? COLORS.primary : COLORS.textMuted }} />
                <div>
                  <div style={{ fontSize: 12, color: COLORS.textPrimary }}>{n.text}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
