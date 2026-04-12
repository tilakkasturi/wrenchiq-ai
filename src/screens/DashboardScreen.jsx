import { useState, useEffect, useRef } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Line,
} from "recharts";
import {
  DollarSign, Car, Target, Timer, UserCheck, Brain, Share2,
  Zap, Package, Send, ChevronRight, Sparkles, Database, ArrowRight,
} from "lucide-react";
import { useRecommendations } from "../context/RecommendationsContext";
import { COLORS } from "../theme/colors";
import {
  SHOP, repairOrders, customers, vehicles, technicians,
  bayStatus, revenueData, todayMetrics, getCustomer, getVehicle, getTech,
} from "../data/demoData";
import MetricCard from "../components/shared/MetricCard";
import StatusBadge from "../components/shared/StatusBadge";
import NewROWizard from "../components/NewROWizard";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const SAMPLE_QUESTIONS = [
  "What are the most common repairs across all vehicles?",
  "Which jobs are done together most often?",
  "What are the top repairs for Toyota vehicles?",
  "What parts are replaced during brake jobs?",
];

export default function DashboardScreen({ onNavigate }) {
  const [showNewRO, setShowNewRO] = useState(false);
  const m = todayMetrics;

  // ── AI Chat state ─────────────────────────────────────────────────────────
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedQs, setSuggestedQs] = useState(SAMPLE_QUESTIONS);
  const chatEndRef = useRef(null);

  // ── KG mini stats state ───────────────────────────────────────────────────
  const [kgStats, setKgStats]         = useState(null);
  const [topClusters, setTopClusters] = useState([]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch KG cluster summary on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/knowledge-graph/clusters`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const clusterNodes = (data.nodes || [])
          .filter(n => n.type === "vgen_cluster" || n.type === "eng_cluster")
          .sort((a, b) => (b.meta?.ro_count || 0) - (a.meta?.ro_count || 0))
          .slice(0, 5);
        setTopClusters(clusterNodes);
        setKgStats({ clusters: data.cluster_count, nodes: data.node_count });
      })
      .catch(() => {});

    fetch(`${API_BASE}/api/knowledge-graph?limit=1`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setKgStats(prev => ({ ...prev, ros: data.ro_count }));
      })
      .catch(() => {});
  }, []);

  // Send chat message to LLM
  const sendMessage = async (text) => {
    const q = (text || inputText).trim();
    if (!q || chatLoading) return;
    setInputText("");
    setMessages(prev => [...prev, { role: "user", content: q, ts: Date.now() }]);
    setChatLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res  = await fetch(`${API_BASE}/api/knowledge-graph/ask`, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ question: q, history }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `API ${res.status}`);
      setMessages(prev => [...prev, {
        role:      "assistant",
        content:   data.answer,
        data_used: data.data_used || [],
        ts:        Date.now(),
      }]);
      if (data.suggested_questions?.length) setSuggestedQs(data.suggested_questions);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}`, ts: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  };

  const todayROs = repairOrders.filter(ro => ro.status !== "scheduled");

  // Recommendations banner
  const recCtx = useRecommendations();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const dashInsights = recCtx ? recCtx.getForScreen("dashboard") : [];
  const showBanner = recCtx && !recCtx.loading && dashInsights.length > 0 && !bannerDismissed;

  return (
    <div style={{ padding: "24px 28px" }}>

      {/* AI Insights banner */}
      {showBanner && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#FFF7ED",
          border: "1px solid #FED7AA",
          borderLeft: "3px solid #FF6B35",
          borderRadius: 8,
          padding: "10px 16px",
          marginBottom: 16,
          gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={14} color="#FF6B35" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#9A3412" }}>
              {dashInsights.length} active AI insight{dashInsights.length > 1 ? "s" : ""} — view in agent panel
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                color: "#FF6B35",
                background: "rgba(255,107,53,0.1)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: 6,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              View
              <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Top Metrics */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <MetricCard icon={DollarSign} label="Today's Revenue"   value={`$${m.revenue.toLocaleString()}`}   change={`+${m.revenueTrend}%`}    positive sub={`Target: $${m.revenueTarget.toLocaleString()}`} onClick={() => onNavigate?.("analytics")} />
        <MetricCard icon={Car}        label="Car Count"          value={String(m.carCount)}                 change={`+${m.carCountTrend}`}     positive sub={`${m.carsScheduled} scheduled today`}           onClick={() => onNavigate?.("orders")} />
        <MetricCard icon={Target}     label="Avg Repair Order"   value={`$${m.avgRO}`}                      change={`+${m.aroTrend}%`}         positive sub={`Goal: $${m.aroGoal}`}                          onClick={() => onNavigate?.("orders")} />
        <MetricCard icon={Timer}      label="Bay Utilization"    value={`${m.bayUtilization}%`}             change={`${m.bayTrend}%`}                   sub={`${m.baysActive} of ${m.baysTotal} bays active`} onClick={() => onNavigate?.("orders")} />
        <MetricCard icon={UserCheck}  label="Tech Efficiency"    value={`${m.techEfficiency}%`}             change={`+${m.techTrend}%`}        positive sub="Billed vs. available hrs"                       onClick={() => onNavigate?.("orders")} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>

        {/* ── Left Column ───────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* AI Chat Panel */}
          <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "18px 22px", color: "#fff", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Sparkles size={18} color="#FF6B35" />
                </div>
                <div>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>WrenchIQ AI</span>
                  <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 8 }}>Ask anything about your shop data</span>
                </div>
              </div>
              <button
                onClick={() => onNavigate?.("knowledge")}
                style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                <Share2 size={11} />
                Full Graph
              </button>
            </div>

            {/* Message history */}
            <div style={{ minHeight: 160, maxHeight: 260, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, marginBottom: 12 }}>
              {messages.length === 0 && (
                <div style={{ opacity: 0.5, fontSize: 13, textAlign: "center", marginTop: 16 }}>
                  Ask a question or pick one below to get insights from your repair order data.
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} style={{
                  alignSelf:    msg.role === "user" ? "flex-end" : "flex-start",
                  maxWidth:     "88%",
                  background:   msg.role === "user" ? "rgba(255,107,53,0.25)" : "rgba(255,255,255,0.1)",
                  borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                  padding:      "10px 13px",
                  fontSize:     12,
                  lineHeight:   1.5,
                  whiteSpace:   "pre-wrap",
                }}>
                  {msg.content}
                  {msg.data_used?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 10, opacity: 0.55, display: "flex", alignItems: "center", gap: 4 }}>
                      <Database size={9} />
                      {msg.data_used.slice(0, 2).join(" · ")}
                    </div>
                  )}
                </div>
              ))}
              {chatLoading && (
                <div style={{ alignSelf: "flex-start", background: "rgba(255,255,255,0.1)", borderRadius: "10px 10px 10px 2px", padding: "10px 14px", fontSize: 12, opacity: 0.7 }}>
                  Thinking…
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggested questions */}
            {messages.length === 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {suggestedQs.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(q)}
                    style={{ fontSize: 11, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 6, padding: "5px 10px", cursor: "pointer", color: "rgba(255,255,255,0.85)", textAlign: "left" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendMessage()}
                placeholder="Ask about repairs, parts, customers, trends…"
                style={{
                  flex: 1, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                  borderRadius: 8, padding: "9px 13px", fontSize: 13, color: "#fff",
                  outline: "none",
                }}
              />
              <button
                onClick={() => sendMessage()}
                disabled={!inputText.trim() || chatLoading}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer",
                  background: inputText.trim() ? COLORS.accent : "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Send size={15} color="#fff" />
              </button>
            </div>
          </div>

          {/* Today's Board */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Today's Workflow</div>
              <button onClick={() => setShowNewRO(true)} style={{ fontSize: 12, background: COLORS.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontWeight: 600, cursor: "pointer" }}>+ New RO</button>
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
                    const veh  = getVehicle(ro.vehicleId);
                    const tech = ro.techId ? getTech(ro.techId) : null;
                    return (
                      <tr key={ro.id} onClick={() => onNavigate?.("orders")} style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.background="#F9FAFB"} onMouseLeave={e => e.currentTarget.style.background=""}>
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
                    <stop offset="5%"  stopColor={COLORS.primary} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="day"     tick={{ fontSize: 12, fill: COLORS.textSecondary }} />
                <YAxis                   tick={{ fontSize: 12, fill: COLORS.textSecondary }} tickFormatter={v => `$${(v / 1000).toFixed(1)}k`} />
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, ""]} />
                <Area type="monotone" dataKey="revenue" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#revGrad)" isAnimationActive={false} />
                <Line type="monotone" dataKey="target"  stroke={COLORS.accent}  strokeDasharray="5 5" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ── Right Sidebar ─────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Knowledge Graph mini panel */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Share2 size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Knowledge Graph</div>
                  {kgStats && (
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                      {kgStats.ros != null ? `${kgStats.ros.toLocaleString()} ROs` : ""}{kgStats.clusters ? ` · ${kgStats.clusters} clusters` : ""}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={() => onNavigate?.("knowledge")}
                style={{ fontSize: 11, fontWeight: 600, color: COLORS.primary, background: "transparent", border: `1px solid ${COLORS.primary}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
              >
                Open <ChevronRight size={11} />
              </button>
            </div>

            {/* Top clusters */}
            <div style={{ padding: "10px 18px 14px" }}>
              {topClusters.length === 0 && (
                <div style={{ fontSize: 12, color: COLORS.textMuted, padding: "8px 0" }}>
                  {kgStats === null ? "Loading clusters…" : "No cluster data — run import first."}
                </div>
              )}
              {topClusters.map((cluster, i) => {
                const roCount = cluster.meta?.ro_count || 0;
                const maxCount = topClusters[0]?.meta?.ro_count || 1;
                const pct = Math.round((roCount / maxCount) * 100);
                const isVgen = cluster.type === "vgen_cluster";
                return (
                  <div key={cluster.id} style={{ marginBottom: i < topClusters.length - 1 ? 10 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: "1px 5px", borderRadius: 3,
                          background: isVgen ? "#DBEAFE" : "#F0FDF4",
                          color:      isVgen ? "#1D4ED8" : "#15803D",
                        }}>
                          {isVgen ? "VGEN" : "ENG"}
                        </span>
                        <span style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: 500 }}>
                          {cluster.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>
                        {roCount.toLocaleString()}
                      </span>
                    </div>
                    <div style={{ height: 4, background: "#F3F4F6", borderRadius: 2 }}>
                      <div style={{ height: 4, width: `${pct}%`, background: isVgen ? COLORS.primary : COLORS.success, borderRadius: 2 }} />
                    </div>
                  </div>
                );
              })}

              {topClusters.length > 0 && (
                <button
                  onClick={() => onNavigate?.("knowledge")}
                  style={{ marginTop: 14, width: "100%", padding: "8px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#F9FAFB", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                >
                  <Share2 size={13} />
                  View Full Graph + Cluster Analysis
                </button>
              )}
            </div>
          </div>

          {/* Bay Status */}
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Bay Status</div>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{SHOP.bays} bays</span>
            </div>
            {bayStatus.map(b => {
              const tech = b.techId ? getTech(b.techId) : null;
              const ro   = b.roId ? repairOrders.find(r => r.id === b.roId) : null;
              const veh  = ro ? getVehicle(ro.vehicleId) : null;
              const statusColors = {
                working:          COLORS.success,
                inspecting:       COLORS.warning,
                waiting_approval: COLORS.accent,
                ready_to_start:   "#8B5CF6",
                available:        COLORS.textMuted,
              };
              const statusLabels = {
                working:          "Working",
                inspecting:       "Inspecting",
                waiting_approval: "Waiting Approval",
                ready_to_start:   "Ready to Start",
                available:        "Available",
              };
              const color = statusColors[b.status] || COLORS.textMuted;
              return (
                <div
                  key={b.bay}
                  onClick={() => onNavigate?.("orders")}
                  style={{ marginBottom: 14, paddingBottom: 14, borderBottom: b.bay < SHOP.bays ? "1px solid #F3F4F6" : "none", cursor: "pointer", borderRadius: 6, padding: "6px 4px" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
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

        </div>
      </div>

      {showNewRO && <NewROWizard onClose={() => setShowNewRO(false)} />}
    </div>
  );
}
