/**
 * WrenchIQ — Knowledge Graph Visualization
 *
 * Two views:
 *   RO Graph    — force-directed graph of vehicle/customer/job/part/rooftop nodes
 *   Clusters    — Pareto chart: cluster volume + cumulative coverage + top-job breakdown
 *
 * Right panel: LLM chat powered by real KG data (POST /api/knowledge-graph/ask)
 */

import { useState, useEffect, useRef, useCallback } from "react";
import ForceGraph2D from "react-force-graph-2d";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  Share2, Filter, RefreshCw, ZoomIn, ZoomOut, Maximize2, Minimize2, X,
  Send, ChevronRight, Database, Sparkles,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Node type config ──────────────────────────────────────────────────────────

const NODE_CONFIG = {
  vehicle:      { color: COLORS.primary,      radius: 7,  label: "Vehicle" },
  customer:     { color: "#8B5CF6",            radius: 6,  label: "Customer" },
  repair_job:   { color: COLORS.accent,        radius: 6,  label: "Repair Job" },
  part:         { color: COLORS.success,       radius: 5,  label: "Part" },
  rooftop:      { color: COLORS.warning,       radius: 10, label: "Rooftop" },
  vgen_cluster: { color: COLORS.primary,       radius: 12, label: "Vehicle Gen Cluster" },
  eng_cluster:  { color: "#0EA5E9",            radius: 12, label: "Engine Cluster" },
};

const LINK_CONFIG = {
  OWNS:            { color: "rgba(139,92,246,0.4)",  dash: false },
  HAD_REPAIR:      { color: "rgba(255,107,53,0.35)", dash: false },
  USED_PART:       { color: "rgba(34,197,94,0.3)",   dash: true  },
  SERVICED_AT:     { color: "rgba(245,158,11,0.3)",  dash: false },
  TOP_JOB:         { color: "rgba(255,107,53,0.5)",  dash: false },
  ASSOCIATED_WITH: { color: "rgba(14,165,233,0.6)",  dash: true  },
  IN_CLUSTER:      { color: "rgba(13,59,69,0.3)",    dash: false },
};

const SAMPLE_QUESTIONS = [
  "What are the most common repairs across all vehicles?",
  "Which jobs are done together most often?",
  "What parts have the highest affinity?",
  "Which shop has the most repair orders?",
  "What are the top repairs for Toyota vehicles?",
  "What parts are replaced during brake jobs?",
  "Show me oil change associations",
  "What are the most expensive parts?",
];

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── KnowledgeGraphScreen ──────────────────────────────────────────────────────

export default function KnowledgeGraphScreen() {
  const [fullscreen, setFullscreen]   = useState(false);
  const [view, setView]               = useState("ro");
  const [graphData, setGraphData]     = useState({ nodes: [], links: [] });
  const [clusterData, setClusterData] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [stats, setStats]             = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const [rooftopFilter, setRooftopFilter] = useState("all");
  const [rooftops, setRooftops]       = useState([]);
  const [limitROs, setLimitROs]       = useState(50);

  // Chat state
  const [chatOpen, setChatOpen]       = useState(false);
  const [messages, setMessages]       = useState([]);
  const [inputText, setInputText]     = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [suggestedQs, setSuggestedQs] = useState(SAMPLE_QUESTIONS.slice(0, 4));
  const chatEndRef = useRef(null);

  // Pareto expand
  const [expandedCluster, setExpandedCluster] = useState(null);

  const graphRef = useRef();

  // ── Fetch graph data ──────────────────────────────────────────────────────
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      if (view === "ro") {
        const params = new URLSearchParams({ limit: limitROs });
        if (rooftopFilter !== "all") params.set("rooftop", rooftopFilter);
        const res  = await fetch(`${API_BASE}/api/knowledge-graph?${params}`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        setGraphData({ nodes: data.nodes, links: data.links });
        setStats({ nodes: data.node_count, links: data.link_count, ros: data.ro_count });
        const rt = data.nodes
          .filter(n => n.type === "rooftop" && n.id !== "rooftop:unknown")
          .map(n => ({ id: n.id.replace("rooftop:", ""), label: n.label }));
        if (rt.length) setRooftops(rt);
      } else {
        const res  = await fetch(`${API_BASE}/api/knowledge-graph/clusters`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        setStats({ nodes: data.node_count, links: data.link_count, clusters: data.cluster_count });
        // Build Pareto dataset from raw cluster nodes
        const clusterNodes = data.nodes.filter(n => n.type === "vgen_cluster" || n.type === "eng_cluster");
        clusterNodes.sort((a, b) => (b.meta?.ro_count || 0) - (a.meta?.ro_count || 0));
        const total = clusterNodes.reduce((s, n) => s + (n.meta?.ro_count || 0), 0);
        let cumSum = 0;
        const paretoRows = clusterNodes.map(n => {
          cumSum += (n.meta?.ro_count || 0);
          return {
            id:        n.id,
            name:      n.label,
            type:      n.type,
            ro_count:  n.meta?.ro_count || 0,
            rules:     n.meta?.rule_count || 0,
            makes:     (n.meta?.makes || []).join(", "),
            quality:   n.meta?.data_quality || "",
            cumPct:    Math.round((cumSum / total) * 100),
          };
        });
        setClusterData(paretoRows);
        // Also store links for job detail lookup
        setGraphData({ nodes: data.nodes, links: data.links });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [view, rooftopFilter, limitROs]);

  useEffect(() => { fetchGraph(); }, [fetchGraph]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Node paint ────────────────────────────────────────────────────────────
  const paintNode = useCallback((node, ctx, globalScale) => {
    const cfg     = NODE_CONFIG[node.type] || NODE_CONFIG.vehicle;
    const r       = cfg.radius;
    const isSelected = selectedNode?.id === node.id;

    if (isSelected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
      ctx.fillStyle = "rgba(255,107,53,0.25)";
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
    ctx.fillStyle = cfg.color;
    ctx.fill();
    if (globalScale > 1.4 || isSelected) {
      const label     = node.label || node.id;
      const fontSize  = Math.max(3.5, 10 / globalScale);
      ctx.font        = `${fontSize}px Inter, sans-serif`;
      ctx.textAlign   = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle   = "#fff";
      ctx.fillText(label.length > 18 ? label.slice(0, 16) + "…" : label, node.x, node.y + r + fontSize + 1);
    }
  }, [selectedNode]);

  const paintLink = useCallback((link, ctx) => {
    const cfg   = LINK_CONFIG[link.type] || { color: "rgba(150,150,150,0.3)", dash: false };
    const start = link.source;
    const end   = link.target;
    if (!start?.x || !end?.x) return;
    ctx.beginPath();
    ctx.strokeStyle = cfg.color;
    ctx.lineWidth   = link.type === "ASSOCIATED_WITH" ? 2 : 1;
    if (cfg.dash) ctx.setLineDash([3, 3]);
    else          ctx.setLineDash([]);
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x,   end.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }, []);

  // ── Zoom ──────────────────────────────────────────────────────────────────
  const zoomIn  = () => graphRef.current?.zoom(graphRef.current.zoom() * 1.4, 400);
  const zoomOut = () => graphRef.current?.zoom(graphRef.current.zoom() / 1.4, 400);
  const fitView = () => graphRef.current?.zoomToFit(400, 40);

  const onNodeClick = useCallback((node) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);

  // ── Chat send ─────────────────────────────────────────────────────────────
  const sendMessage = async (text) => {
    const q = (text || inputText).trim();
    if (!q || chatLoading) return;
    setInputText("");
    const userMsg = { role: "user", content: q, ts: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    try {
      const history = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch(`${API_BASE}/api/knowledge-graph/ask`, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ question: q, history }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API ${res.status}`);
      setMessages(prev => [...prev, {
        role:       "assistant",
        content:    data.answer,
        data_used:  data.data_used || [],
        ts:         Date.now(),
      }]);
      if (data.suggested_questions?.length) setSuggestedQs(data.suggested_questions);
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}`, ts: Date.now() }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ── Top jobs for an expanded cluster ─────────────────────────────────────
  const getTopJobsForCluster = (clusterId) => {
    const clusterLinks = graphData.links.filter(l => {
      const src = typeof l.source === "object" ? l.source.id : l.source;
      return src === clusterId && l.type === "TOP_JOB";
    });
    return clusterLinks.map(l => {
      const tgtId = typeof l.target === "object" ? l.target.id : l.target;
      const jobNode = graphData.nodes.find(n => n.id === tgtId);
      return { label: jobNode?.label || tgtId, frequency: l.frequency };
    }).sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  };

  // ── Pareto custom tooltip ─────────────────────────────────────────────────
  const ParetoTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 11 }}>
        <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>{d?.name}</div>
        <div style={{ color: COLORS.textMuted }}>RO Count: <b style={{ color: COLORS.textPrimary }}>{d?.ro_count}</b></div>
        <div style={{ color: COLORS.textMuted }}>Rules: <b style={{ color: COLORS.textPrimary }}>{d?.rules}</b></div>
        <div style={{ color: COLORS.textMuted }}>Makes: {d?.makes}</div>
        <div style={{ color: COLORS.textMuted }}>Cumulative: <b style={{ color: COLORS.accent }}>{d?.cumPct}%</b></div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const containerStyle = fullscreen
    ? { position: "fixed", inset: 0, zIndex: 200, display: "flex", flexDirection: "column", background: COLORS.bg, overflow: "hidden" }
    : { height: "100%", display: "flex", flexDirection: "column", background: COLORS.bg, overflow: "hidden" };

  return (
    <div style={containerStyle}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: "16px 20px 12px", background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Share2 size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Knowledge Graph</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                {loading ? "Loading…" : error ? "Error" : `${stats.nodes || 0} nodes · ${stats.links || 0} edges${stats.ros ? ` · ${stats.ros} ROs` : ""}${stats.clusters ? ` · ${stats.clusters} clusters` : ""}`}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {["ro", "clusters"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{
                padding: "5px 12px", borderRadius: 6, border: `1px solid ${view === v ? COLORS.primary : COLORS.border}`,
                background: view === v ? COLORS.primary : "transparent",
                color: view === v ? "#fff" : COLORS.textSecondary,
                fontSize: 12, fontWeight: 600, cursor: "pointer",
              }}>
                {v === "ro" ? "RO Graph" : "Cluster Analysis"}
              </button>
            ))}
            <button onClick={fetchGraph} title="Refresh" style={{ padding: 6, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
              <RefreshCw size={14} color={COLORS.textSecondary} />
            </button>
            <button onClick={() => setFullscreen(f => !f)} title={fullscreen ? "Exit fullscreen" : "Fullscreen"} style={{ padding: 6, borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", cursor: "pointer", display: "flex" }}>
              {fullscreen ? <Minimize2 size={14} color={COLORS.textSecondary} /> : <Maximize2 size={14} color={COLORS.textSecondary} />}
            </button>
            <button
              onClick={() => setChatOpen(o => !o)}
              title="Ask a question"
              style={{
                padding: "5px 10px", borderRadius: 6, border: `1px solid ${chatOpen ? COLORS.accent : COLORS.border}`,
                background: chatOpen ? `${COLORS.accent}15` : "transparent",
                color: chatOpen ? COLORS.accent : COLORS.textSecondary,
                fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <Sparkles size={13} />
              Ask AI
            </button>
          </div>
        </div>

        {/* Filters row (RO view only) */}
        {view === "ro" && (
          <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
            <Filter size={13} color={COLORS.textMuted} />
            <select value={rooftopFilter} onChange={e => setRooftopFilter(e.target.value)}
              style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, background: COLORS.bgCard }}>
              <option value="all">All Rooftops</option>
              {rooftops.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
            <select value={limitROs} onChange={e => setLimitROs(Number(e.target.value))}
              style={{ fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary, background: COLORS.bgCard }}>
              {[25, 50, 100].map(n => <option key={n} value={n}>Last {n} ROs</option>)}
            </select>
          </div>
        )}

        {/* Legend */}
        {view === "ro" && (
          <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap" }}>
            {Object.entries(NODE_CONFIG).filter(([k]) => !k.includes("cluster")).map(([type, cfg]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: cfg.color }} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Main body ──────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Content area (graph or chart) ───────────────────────────────── */}
        <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, background: "rgba(250,250,248,0.8)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 36, height: 36, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 10px" }} />
                <div style={{ fontSize: 13, color: COLORS.textMuted }}>{view === "ro" ? "Building graph…" : "Loading clusters…"}</div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 24, textAlign: "center", maxWidth: 320 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.danger, marginBottom: 8 }}>Failed to load</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 14 }}>{error}</div>
                <button onClick={fetchGraph} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: COLORS.primary, color: "#fff", fontSize: 12, cursor: "pointer" }}>Retry</button>
              </div>
            </div>
          )}

          {/* ── RO Force Graph ─────────────────────────────────────────────── */}
          {!loading && !error && view === "ro" && (
            <>
              {graphData.nodes.length === 0 ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center", color: COLORS.textMuted }}>
                    <Share2 size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                    <div style={{ fontSize: 13 }}>No graph data. Run importRepairOrders.js first.</div>
                  </div>
                </div>
              ) : (
                <ForceGraph2D
                  ref={graphRef}
                  graphData={graphData}
                  nodeCanvasObject={paintNode}
                  nodeCanvasObjectMode={() => "replace"}
                  linkCanvasObject={paintLink}
                  linkCanvasObjectMode={() => "replace"}
                  onNodeClick={onNodeClick}
                  nodeLabel={node => `${node.label} (${node.type})`}
                  backgroundColor={COLORS.bg}
                  d3AlphaDecay={0.02}
                  d3VelocityDecay={0.3}
                  cooldownTicks={200}
                  onEngineStop={fitView}
                  width={undefined}
                  height={undefined}
                />
              )}
              {/* Zoom controls */}
              <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 6, zIndex: 5 }}>
                {[{ icon: ZoomIn, fn: zoomIn }, { icon: ZoomOut, fn: zoomOut }, { icon: Maximize2, fn: fitView }].map(({ icon: Icon, fn }, i) => (
                  <button key={i} onClick={fn} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.bgCard, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                    <Icon size={14} color={COLORS.textSecondary} />
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ── Cluster Pareto View ───────────────────────────────────────── */}
          {!loading && !error && view === "clusters" && clusterData.length > 0 && (
            <div style={{ height: "100%", overflowY: "auto", padding: 20 }}>

              {/* Pareto chart */}
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 8px 8px", marginBottom: 16 }}>
                <div style={{ paddingLeft: 12, marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Cluster Volume — Pareto</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Bars = RO count · Line = cumulative coverage</div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={clusterData} margin={{ top: 4, right: 44, bottom: 60, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.borderLight} vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 9, fill: COLORS.textMuted }}
                      angle={-38}
                      textAnchor="end"
                      interval={0}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 10, fill: COLORS.textMuted }} width={28} />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: COLORS.textMuted }} width={36} />
                    <Tooltip content={<ParetoTooltip />} />
                    <Bar yAxisId="left" dataKey="ro_count" name="RO Count" radius={[3,3,0,0]}>
                      {clusterData.map(d => (
                        <Cell
                          key={d.id}
                          fill={expandedCluster === d.id ? COLORS.accent : (d.type === "vgen_cluster" ? COLORS.primary : "#0EA5E9")}
                          cursor="pointer"
                          onClick={() => setExpandedCluster(prev => prev === d.id ? null : d.id)}
                        />
                      ))}
                    </Bar>
                    <Line yAxisId="right" type="monotone" dataKey="cumPct" name="Cumulative %" stroke={COLORS.accent} strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div style={{ display: "flex", gap: 16, paddingLeft: 20, paddingBottom: 4 }}>
                  {[["Vehicle Gen", COLORS.primary], ["Engine Similarity", "#0EA5E9"], ["Selected", COLORS.accent]].map(([label, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: color }} />
                      <span style={{ fontSize: 10, color: COLORS.textMuted }}>{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cluster detail rows */}
              <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, paddingLeft: 2 }}>
                CLUSTERS — click a bar or row to expand
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {clusterData.map((d, i) => {
                  const isExpanded = expandedCluster === d.id;
                  const topJobs    = isExpanded ? getTopJobsForCluster(d.id) : [];
                  return (
                    <div key={d.id}
                      onClick={() => setExpandedCluster(prev => prev === d.id ? null : d.id)}
                      style={{
                        background: COLORS.bgCard, border: `1px solid ${isExpanded ? COLORS.primary : COLORS.border}`,
                        borderRadius: 8, padding: "10px 14px", cursor: "pointer",
                        transition: "border-color 0.15s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {/* Rank badge */}
                        <div style={{ width: 22, height: 22, borderRadius: 6, background: i < 3 ? COLORS.primary : COLORS.bgMuted || "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: i < 3 ? "#fff" : COLORS.textMuted }}>#{i+1}</span>
                        </div>
                        {/* Name + type chip */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
                          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                            <span style={{ fontSize: 9, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: d.type === "vgen_cluster" ? `${COLORS.primary}20` : "#0EA5E920", color: d.type === "vgen_cluster" ? COLORS.primary : "#0EA5E9" }}>
                              {d.type === "vgen_cluster" ? "VEHICLE GEN" : "ENGINE"}
                            </span>
                            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{d.makes}</span>
                          </div>
                        </div>
                        {/* Stats */}
                        <div style={{ display: "flex", gap: 16, flexShrink: 0 }}>
                          {[["ROs", d.ro_count], ["Rules", d.rules], ["Coverage", `${d.cumPct}%`]].map(([lbl, val]) => (
                            <div key={lbl} style={{ textAlign: "right" }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{val}</div>
                              <div style={{ fontSize: 9, color: COLORS.textMuted }}>{lbl}</div>
                            </div>
                          ))}
                        </div>
                        <ChevronRight size={14} color={COLORS.textMuted} style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }} />
                      </div>

                      {/* Expanded: top repair jobs */}
                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.borderLight}` }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8 }}>TOP REPAIR JOBS</div>
                          {topJobs.length === 0 ? (
                            <div style={{ fontSize: 11, color: COLORS.textMuted }}>No job data available</div>
                          ) : topJobs.map((job, ji) => (
                            <div key={ji} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                              <div style={{ flex: 1, fontSize: 11, color: COLORS.textPrimary }}>{job.label}</div>
                              <div style={{ fontSize: 10, color: COLORS.textMuted, flexShrink: 0 }}>{job.frequency ? `${(job.frequency * 100).toFixed(0)}%` : ""}</div>
                              <div style={{ width: 80, height: 6, background: COLORS.borderLight, borderRadius: 3, flexShrink: 0 }}>
                                <div style={{ width: `${Math.min(100, (job.frequency || 0) * 100)}%`, height: "100%", background: COLORS.accent, borderRadius: 3 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Node detail panel (RO view) ──────────────────────────────────── */}
        {selectedNode && view === "ro" && (
          <div style={{ position: "absolute", top: 130, left: chatOpen ? undefined : undefined, right: chatOpen ? 332 : 16, width: 240, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: NODE_CONFIG[selectedNode.type]?.color || COLORS.primary }} />
                  <span style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{selectedNode.type.replace(/_/g, " ")}</span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, lineHeight: 1.3 }}>{selectedNode.label}</div>
              </div>
              <button onClick={() => setSelectedNode(null)} style={{ padding: 2, background: "none", border: "none", cursor: "pointer" }}>
                <X size={14} color={COLORS.textMuted} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {selectedNode.meta && Object.entries(selectedNode.meta).filter(([, v]) => v != null && v !== "").map(([k, v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                  <span style={{ color: COLORS.textMuted }}>{k.replace(/_/g, " ")}</span>
                  <span style={{ color: COLORS.textPrimary, fontWeight: 500, maxWidth: 120, textAlign: "right", wordBreak: "break-all" }}>
                    {typeof v === "number" ? (Number.isInteger(v) ? v : v.toFixed(3)) : String(v)}
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${COLORS.borderLight}`, fontSize: 10, color: COLORS.textMuted }}>
              {selectedNode.id}
            </div>
          </div>
        )}

        {/* ── Chat panel ──────────────────────────────────────────────────── */}
        {chatOpen && (
          <div style={{ width: 316, borderLeft: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", background: COLORS.bgCard, flexShrink: 0 }}>
            {/* Chat header */}
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Sparkles size={14} color={COLORS.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Ask the Graph</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ padding: 2, background: "none", border: "none", cursor: "pointer" }}>
                <X size={13} color={COLORS.textMuted} />
              </button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ marginTop: 4 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                    Ask questions about your repair shop data. Answers are pulled directly from the Knowledge Graph.
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: COLORS.textMuted, marginBottom: 6 }}>SUGGESTED QUESTIONS</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                    {suggestedQs.map((q, i) => (
                      <button key={i} onClick={() => sendMessage(q)}
                        style={{ textAlign: "left", padding: "7px 10px", borderRadius: 7, border: `1px solid ${COLORS.border}`, background: "transparent", fontSize: 11, color: COLORS.textSecondary, cursor: "pointer", lineHeight: 1.4 }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "88%", padding: "8px 11px", borderRadius: msg.role === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                    background: msg.role === "user" ? COLORS.primary : COLORS.bg,
                    border: msg.role === "assistant" ? `1px solid ${COLORS.border}` : "none",
                    fontSize: 12, lineHeight: 1.5,
                    color: msg.role === "user" ? "#fff" : COLORS.textPrimary,
                  }}>
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.data_used?.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      <Database size={9} color={COLORS.textMuted} />
                      {msg.data_used.slice(0, 2).map((s, si) => (
                        <span key={si} style={{ fontSize: 9, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, padding: "1px 5px", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 11px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary, animation: "bounce 0.8s ease infinite 0s" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary, animation: "bounce 0.8s ease infinite 0.15s" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.primary, animation: "bounce 0.8s ease infinite 0.3s" }} />
                </div>
              )}

              {/* Suggested follow-ups after at least one answer */}
              {messages.length > 0 && !chatLoading && suggestedQs.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: COLORS.textMuted, marginBottom: 4 }}>FOLLOW-UP</div>
                  {suggestedQs.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      style={{ display: "block", width: "100%", textAlign: "left", padding: "5px 8px", borderRadius: 6, border: `1px solid ${COLORS.borderLight}`, background: "transparent", fontSize: 10, color: COLORS.textMuted, cursor: "pointer", marginBottom: 4, lineHeight: 1.4 }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div style={{ padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 7, alignItems: "flex-end" }}>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  placeholder="Ask about repairs, parts, clusters…"
                  rows={2}
                  style={{
                    flex: 1, resize: "none", fontSize: 12, padding: "7px 10px", borderRadius: 8,
                    border: `1px solid ${COLORS.border}`, background: COLORS.bg,
                    color: COLORS.textPrimary, fontFamily: "inherit", lineHeight: 1.4, outline: "none",
                  }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={chatLoading || !inputText.trim()}
                  style={{
                    width: 34, height: 34, borderRadius: 8, border: "none",
                    background: inputText.trim() ? COLORS.primary : COLORS.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: inputText.trim() ? "pointer" : "default", flexShrink: 0,
                    transition: "background 0.15s",
                  }}
                >
                  <Send size={14} color="#fff" />
                </button>
              </div>
              <div style={{ fontSize: 9, color: COLORS.textMuted, marginTop: 5, textAlign: "center" }}>
                Powered by Claude · Real KG data
              </div>
            </div>
          </div>
        )}
      </div>

      {/* keyframes */}
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      `}</style>
    </div>
  );
}
