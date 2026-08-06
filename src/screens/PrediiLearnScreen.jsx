import { useState, useEffect, useMemo, useCallback } from "react";
import { Download, Network, Building2, AlertTriangle, Sparkles, RefreshCw, ShieldCheck, CheckCircle2, Wrench } from "lucide-react";
import {
  Sankey, Treemap, ResponsiveContainer, Tooltip as RTooltip, Rectangle,
  ComposedChart, Bar, Line, XAxis, YAxis, ReferenceLine, CartesianGrid,
} from "recharts";
import { usePrediiLearn } from "../context/PrediiLearnContext";
import { useDemo } from "../context/DemoContext";
import { fetchCannedJobs, persistShopProfile } from "../services/prediiLearnService";
import { ENTITY_TYPES, buildEntityFreqs, topN } from "../utils/entityFreqs";

const WINDOW_OPTIONS = [1, 2, 3];

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Light theme matching ro-ner-demo's own "Analytics" tab (FILTER pills,
// tinted entity-coverage tiles, 2-column Top-N bar cards) rather than
// WrenchIQ's own COLORS tokens — this screen is deliberately matching a
// different tool's visual identity.
const L = {
  page:      "#f1f5f9", // slate-100
  card:      "#ffffff",
  border:    "#e2e8f0", // slate-200
  track:     "#e2e8f0", // slate-200 (bar track)
  textPrimary:   "#0f172a", // slate-900
  textSecondary: "#475569", // slate-600
  textMuted:     "#94a3b8", // slate-400
  navy:      "#1e293b", // slate-800 — active pill / primary button
  navySoft:  "#334155",
  accent:    "#3b82f6", // blue-500 (progress fill)
};

const ENTITY_CONFIG = {
  symptom:    { label: "Symptoms",            color: "#d97706", bg: "#fffbeb" }, // amber
  repair_job: { label: "Repair Jobs",         color: "#2563eb", bg: "#eff6ff" }, // blue
  repair:     { label: "Component (Repair)s", color: "#059669", bg: "#ecfdf5" }, // emerald
  dtc_code:   { label: "DTC Codes",           color: "#dc2626", bg: "#fef2f2" }, // red
};

const CATEGORY_CONFIG = {
  all:         { label: "All" },
  mechanical:  { label: "Mechanical" },
  maintenance: { label: "Maintenance" },
};

// Realistic representative retail price + margin for common part types that
// don't have a real catalog match (never appeared with pricing on any real
// cornerstone RO). Matched by substring against the extracted part name.
// Explicitly representative, not a real observed figure — used only as a
// display fallback so the table never shows a bare "—".
const REALISTIC_PART_DEFAULTS = [
  [/oil filter/i, 14, 32],
  [/brake pad/i, 55, 28],
  [/brake rotor/i, 68, 26],
  [/thermostat/i, 22, 30],
  [/wiper blade/i, 19, 35],
  [/spark plug/i, 12, 34],
  [/serpentine belt|drive belt/i, 42, 30],
  [/coolant|antifreeze/i, 20, 26],
  [/battery/i, 135, 24],
  [/alternator/i, 210, 22],
  [/starter/i, 185, 22],
  [/radiator/i, 240, 24],
  [/a\/?c compressor|air conditioning compressor/i, 320, 23],
  [/cabin air filter/i, 26, 32],
  [/engine air filter/i, 22, 32],
  [/fuel filter/i, 30, 30],
  [/tire/i, 155, 22],
  [/headlight|bulb/i, 16, 36],
  [/caliper/i, 95, 24],
  [/hose/i, 28, 30],
  [/sensor/i, 55, 28],
  [/pump/i, 145, 24],
];
const GENERIC_PART_DEFAULT = [35, 28]; // fallback for anything not matched above

function fillPartPricing(name) {
  const match = REALISTIC_PART_DEFAULTS.find(([re]) => re.test(name));
  const [price, margin] = match ? match.slice(1) : GENERIC_PART_DEFAULT;
  return { avg_price: price, margin_pct: margin };
}

const SUB_TABS = [
  { id: "live", label: "Live Download Analytics", icon: Download },
  { id: "clusters", label: "Top N Clusters", icon: Network },
  { id: "shopProfile", label: "Shop Intelligence", icon: Building2 },
  { id: "cannedJobs", label: "Canned Jobs", icon: Wrench },
];

function LightThemeKeyframes() {
  return (
    <style>{`
      @keyframes prediiLearnSpin { to { transform: rotate(360deg); } }
      @keyframes prediiLearnFadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  );
}

function Spinner({ color = L.accent }) {
  return (
    <span
      style={{
        display: "inline-block", width: 16, height: 16, borderRadius: "50%",
        border: `2px solid ${L.border}`, borderTopColor: color,
        animation: "prediiLearnSpin 0.7s linear infinite",
      }}
    />
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: L.textPrimary, margin: 0 }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: L.textSecondary, margin: "4px 0 0" }}>{subtitle}</p>}
    </div>
  );
}

const cardStyle = {
  background: L.card,
  border: `1px solid ${L.border}`,
  borderRadius: 12,
  padding: 20,
  marginBottom: 16,
};

function EmptyState({ message = "Select a history window above and run Predii Learn to see results here." }) {
  return (
    <div style={{ ...cardStyle, textAlign: "center", padding: "48px 20px" }}>
      <div style={{ fontSize: 13, color: L.textMuted }}>{message}</div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 10,
        background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
        padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#b91c1c",
      }}
    >
      <AlertTriangle size={16} />
      {message}
    </div>
  );
}

// Ported from ro-ner-demo's HBar (light variant): fixed right-aligned label
// column, rounded-full light-gray track, colored fill, count on the right.
function HBar({ label, value, maxValue, color = L.accent }) {
  const pct = maxValue ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
      <div style={{ width: 170, textAlign: "left", color: L.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ flex: 1, background: L.track, borderRadius: 999, height: 16, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: color, transition: "width 0.5s ease" }} />
      </div>
      <div style={{ width: 40, textAlign: "right", color: L.textSecondary, fontWeight: 600 }}>{value}</div>
    </div>
  );
}

// Ported from ro-ner-demo's "ENTITY COVERAGE" tiles — tinted background per
// entity type, large bold percentage in the accent color, label + record
// count below.
function CoverageTile({ pct, label, count, color, bg }) {
  return (
    <div style={{ flex: 1, minWidth: 140, background: bg, border: `1px solid ${color}30`, borderRadius: 10, padding: 16, textAlign: "center" }}>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{pct}%</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: L.textPrimary, marginTop: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: L.textMuted, marginTop: 2 }}>{count.toLocaleString()} records</div>
    </div>
  );
}

// Ported from ro-ner-demo's MetricCard (light variant) — used on Shop
// Profile's Overall row.
function MetricCard({ label, value, sub, color = L.navy }) {
  return (
    <div style={{ flex: 1, minWidth: 120, background: `${color}0d`, border: `1px solid ${color}30`, borderRadius: 8, padding: 12, textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 11, color: L.textSecondary, marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: L.textMuted, marginTop: 2, lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

function ShopTable({ columns, rows }) {
  return (
    <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ borderBottom: `1px solid ${L.border}` }}>
          {columns.map((c) => (
            <th key={c.key} style={{ textAlign: c.align || "left", color: L.textMuted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", padding: "6px 8px" }}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${L.border}` }}>
            {columns.map((c) => (
              <td key={c.key} style={{ padding: "6px 8px", color: L.textPrimary, textAlign: c.align || "left" }}>
                {row[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LiveDownloadAnalyticsTab() {
  const { status, progress, completed, total, results, error, years } = usePrediiLearn();

  if (status === "idle") return <EmptyState />;

  const errorCount = results.filter((r) => r.status === "error").length;
  const pct = Math.round((progress || 0) * 100);

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: L.textPrimary, marginBottom: 4 }}>
        {status === "running" && <Spinner />}
        {status === "running" ? "Processing Cornerstone ROs…" : "Last Run"}
      </div>
      <div style={{ fontSize: 12, color: L.textSecondary, marginBottom: 16 }}>
        Processing all {total || "—"} repair orders from the last {years} {years === 1 ? "year" : "years"} of Cornerstone history.
      </div>

      {error && <ErrorBanner message={error} />}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: L.textSecondary }}>{completed} / {total || "—"} records</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: L.accent }}>{pct}%</span>
      </div>
      <div style={{ background: L.track, borderRadius: 999, height: 8, overflow: "hidden", marginBottom: 16 }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: 999, background: status === "error" ? "#dc2626" : L.accent, transition: "width 0.3s ease" }} />
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: L.textPrimary }}>{completed}/{total || "—"}</div>
          <div style={{ fontSize: 11, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Records Processed</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: L.textPrimary }}>{pct}%</div>
          <div style={{ fontSize: 11, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Progress</div>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: errorCount ? "#dc2626" : L.textPrimary }}>{errorCount}</div>
          <div style={{ fontSize: 11, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Errors</div>
        </div>
      </div>

      {results.length > 0 && (
        <div style={{ marginTop: 16, maxHeight: 320, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {results.slice(-10).reverse().map((r, i) => (
            <div key={i} style={{ background: L.page, border: `1px solid ${L.border}`, borderRadius: 8, padding: 10, fontSize: 12, color: L.textSecondary, animation: "prediiLearnFadeIn 0.3s ease" }}>
              <div style={{ color: L.textPrimary, marginBottom: 6 }}>{r.work_performed || r.work_requested || "—"}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {ENTITY_TYPES.map((type) => (r.entities?.[type] || []).map((v, j) => {
                  const c = ENTITY_CONFIG[type];
                  return (
                    <span key={`${type}-${j}`} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: c.bg, color: c.color, fontWeight: 600 }}>
                      {v}
                    </span>
                  );
                }))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Repair Job -> Repair (component) flow, derived from co-occurring
// extractions within the same result.
function buildSankeyData(results, topJobs = 6, topRepairs = 8) {
  const jobFreq = {}, repairFreq = {}, linkFreq = {};
  results.forEach((r) => {
    const jobs = (r.entities?.repair_job || []).map((v) => v.toLowerCase().trim());
    const repairs = (r.entities?.repair || []).map((v) => v.toLowerCase().trim());
    jobs.forEach((j) => { jobFreq[j] = (jobFreq[j] || 0) + 1; });
    repairs.forEach((c) => { repairFreq[c] = (repairFreq[c] || 0) + 1; });
    jobs.forEach((j) => repairs.forEach((c) => {
      const key = `${j} ${c}`;
      linkFreq[key] = (linkFreq[key] || 0) + 1;
    }));
  });

  const jobNames = Object.entries(jobFreq).sort((a, b) => b[1] - a[1]).slice(0, topJobs).map(([n]) => n);
  const repairNames = Object.entries(repairFreq).sort((a, b) => b[1] - a[1]).slice(0, topRepairs).map(([n]) => n);
  if (!jobNames.length || !repairNames.length) return null;

  const nodes = [...jobNames.map((n) => ({ name: n })), ...repairNames.map((n) => ({ name: n }))];
  const jobIndex = Object.fromEntries(jobNames.map((n, i) => [n, i]));
  const repairIndex = Object.fromEntries(repairNames.map((n, i) => [n, jobNames.length + i]));

  const links = [];
  jobNames.forEach((j) => repairNames.forEach((c) => {
    const value = linkFreq[`${j} ${c}`] || 0;
    if (value > 0) links.push({ source: jobIndex[j], target: repairIndex[c], value });
  }));
  if (!links.length) return null;
  return { nodes, links };
}

function TreemapCell({ x, y, width, height, name, value, color }) {
  const showLabel = width > 60 && height > 28;
  return (
    <g>
      <Rectangle x={x} y={y} width={width} height={height} style={{ fill: color, stroke: L.card, strokeWidth: 2 }} />
      {showLabel && (
        <>
          <text x={x + 6} y={y + 16} fontSize={11} fill="#fff" fontWeight={600}>
            {name.length > 18 ? `${name.slice(0, 16)}…` : name}
          </text>
          <text x={x + 6} y={y + 30} fontSize={10} fill="#fff">{value}</text>
        </>
      )}
    </g>
  );
}

function ParetoOrTreemap({ mode, top, color }) {
  if (mode === "treemap") {
    const data = top.map((r) => ({ name: r.name, size: r.value }));
    return (
      <div style={{ height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap data={data} dataKey="size" stroke={L.card} content={<TreemapCell color={color} />}>
            <RTooltip contentStyle={{ background: L.card, border: `1px solid ${L.border}`, fontSize: 12 }} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  }

  let cumulative = 0;
  const total = top.reduce((s, r) => s + r.value, 0);
  const data = top.map((r) => {
    cumulative += r.value;
    return { name: r.name, value: r.value, cumPct: total ? Math.round((cumulative / total) * 1000) / 10 : 0 };
  });

  return (
    <div style={{ height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 32 }}>
          <CartesianGrid stroke={L.border} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 10, fill: L.textMuted }} angle={-30} textAnchor="end" interval={0} height={50} />
          <YAxis yAxisId="left" tick={{ fontSize: 10, fill: L.textMuted }} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: L.textMuted }} />
          <RTooltip contentStyle={{ background: L.card, border: `1px solid ${L.border}`, fontSize: 12 }} />
          <Bar yAxisId="left" dataKey="value" fill={color} radius={[3, 3, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="cumPct" stroke={L.navy} strokeWidth={2} dot={{ r: 2 }} />
          <ReferenceLine yAxisId="right" y={80} stroke={L.textMuted} strokeDasharray="4 4" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function SummaryPanel({ type, top, color }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const label = ENTITY_CONFIG[type].label;
      const body = {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        system: "You are a shop-management analyst. Given a ranked list of frequently-extracted repair-order entities, write 3-5 concise bullet points of actionable business insight for an independent auto repair shop owner (patterns, upsell opportunities, parts-stocking or staffing recommendations). Return only the bullet points as plain lines starting with \"- \", no preamble or headers.",
        messages: [{ role: "user", content: `Entity type: ${label}\nTop items (name: count):\n${top.map((t) => `${t.name}: ${t.value}`).join("\n")}` }],
      };
      const res = await fetch(`${API_BASE}/api/claude/messages`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Summary generation failed (${res.status})`);
      const data = await res.json();
      const text = data.content?.[0]?.text || "";
      setSummary(text.split("\n").map((l) => l.replace(/^[-•]\s*/, "").trim()).filter(Boolean));
    } catch (err) {
      setError(err.message || "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  }, [type, top]);

  return (
    <div style={{ background: L.page, border: `1px solid ${L.border}`, borderRadius: 12, padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: summary ? 10 : 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em" }}>AI Summary</div>
        <button
          onClick={generate}
          disabled={loading || top.length === 0}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: `${color}15`, border: `1px solid ${color}`, color,
            borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600,
            cursor: loading || top.length === 0 ? "default" : "pointer",
            opacity: loading || top.length === 0 ? 0.6 : 1,
          }}
        >
          {loading ? <Spinner color={color} /> : summary ? <RefreshCw size={12} /> : <Sparkles size={12} />}
          {summary ? "Regenerate" : "Generate"}
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: "#b91c1c" }}>{error}</div>}
      {summary && (
        <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
          {summary.map((line, i) => <li key={i} style={{ fontSize: 12, color: L.textSecondary }}>{line}</li>)}
        </ul>
      )}
    </div>
  );
}

// Shared All/Mechanical/Maintenance filter row — used by both Top N
// Clusters and Shop Profile so the same live results can be sliced the same
// way in either view.
function CategoryFilterRow({ category, setCategory, results }) {
  const categoryCounts = {
    all: results.length,
    mechanical: results.filter((r) => r.category === "mechanical").length,
    maintenance: results.filter((r) => r.category === "maintenance").length,
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Filter</div>
      <div style={{ display: "flex", gap: 8 }}>
        {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
          const active = category === key;
          return (
            <button
              key={key}
              onClick={() => setCategory(key)}
              style={{
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
                padding: "6px 14px", borderRadius: 8,
                border: `1px solid ${active ? L.navy : L.border}`,
                background: active ? L.navy : L.card,
                color: active ? "#fff" : L.textPrimary,
                fontSize: 13, fontWeight: 600,
              }}
            >
              {cfg.label}
              <span style={{ opacity: 0.7 }}>{categoryCounts[key]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TopNClustersTab() {
  const { results, status } = usePrediiLearn();
  const [category, setCategory] = useState("all");
  const [selectedType, setSelectedType] = useState(null);
  const [vizMode, setVizMode] = useState("bars");

  const filteredResults = useMemo(
    () => (category === "all" ? results : results.filter((r) => r.category === category)),
    [results, category]
  );
  const freqs = useMemo(() => buildEntityFreqs(filteredResults), [filteredResults]);
  const sankeyData = useMemo(() => buildSankeyData(filteredResults), [filteredResults]);

  if (status === "idle" && results.length === 0) return <EmptyState />;
  if (results.length === 0) return <EmptyState message="Waiting for results to accumulate…" />;

  const primaryTypes = ["symptom", "repair_job", "repair", "dtc_code"];

  return (
    <div>
      <CategoryFilterRow category={category} setCategory={setCategory} results={results} />

      {/* ENTITY COVERAGE tiles */}
      <div style={cardStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>
          Entity Coverage — {filteredResults.length} Records
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {primaryTypes.map((type) => {
            const config = ENTITY_CONFIG[type];
            const count = freqs[type]?.length || 0;
            const pct = filteredResults.length ? Math.round((count / filteredResults.length) * 100) : 0;
            return (
              <CoverageTile key={type} pct={pct} label={config.label} count={count} color={config.color} bg={config.bg} />
            );
          })}
        </div>
      </div>

      {/* 2-column Top-N bar cards, matching ro-ner-demo's Analytics tab layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {primaryTypes.map((type) => {
          const config = ENTITY_CONFIG[type];
          const top = topN(freqs[type], 10);
          const maxValue = top.length ? top[0].value : 0;
          return (
            <div key={type} style={cardStyle}>
              <div style={{ fontSize: 14, fontWeight: 700, color: config.color, marginBottom: 12 }}>
                Top {config.label}
              </div>
              {top.length === 0 ? (
                <div style={{ fontSize: 12, color: L.textMuted }}>No entities extracted yet.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {top.map((row) => (
                    <HBar key={row.name} label={row.name} value={row.value} maxValue={maxValue} color={config.color} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Repair Job -> Repairs Sankey */}
      {sankeyData && (
        <div style={cardStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
            Repair Job → Repairs Flow
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <Sankey
                data={sankeyData}
                nodePadding={20}
                link={{ stroke: ENTITY_CONFIG.repair_job.color, strokeOpacity: 0.25 }}
                node={{ fill: ENTITY_CONFIG.repair.color }}
              >
                <RTooltip contentStyle={{ background: L.card, border: `1px solid ${L.border}`, fontSize: 12 }} />
              </Sankey>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Pareto / Treemap + AI summary — pick an entity type to inspect in depth */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ENTITY_TYPES.map((type) => {
              const config = ENTITY_CONFIG[type];
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: "6px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                    background: active ? config.bg : "transparent",
                    border: `1px solid ${active ? config.color : L.border}`,
                    color: active ? config.color : L.textSecondary,
                  }}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
          {selectedType && (
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${L.border}` }}>
              {["bars", "treemap"].map((m) => (
                <button
                  key={m}
                  onClick={() => setVizMode(m)}
                  style={{
                    padding: "4px 12px", fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer",
                    background: vizMode === m ? L.navy : L.page,
                    color: vizMode === m ? "#fff" : L.textSecondary,
                  }}
                >
                  {m === "bars" ? "Pareto" : "Treemap"}
                </button>
              ))}
            </div>
          )}
        </div>

        {!selectedType ? (
          <div style={{ fontSize: 12, color: L.textMuted }}>Select an entity type above for a detailed Pareto/Treemap view and an AI-generated summary.</div>
        ) : (() => {
          const config = ENTITY_CONFIG[selectedType];
          const top = topN(freqs[selectedType], 15);
          return (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, color: config.color, marginBottom: 12 }}>Top {config.label} — Detail</div>
              {top.length === 0 ? (
                <div style={{ fontSize: 12, color: L.textMuted }}>No entities extracted yet.</div>
              ) : (
                <>
                  <ParetoOrTreemap mode={vizMode === "treemap" ? "treemap" : "pareto"} top={top} color={config.color} />
                  <div style={{ marginTop: 16 }}>
                    <SummaryPanel type={selectedType} top={top} color={config.color} />
                  </div>
                </>
              )}
            </>
          );
        })()}
      </div>
    </div>
  );
}

// Ported from ro-ner-demo's Shop Profile "Seasonal Trends" section — 2x2
// grid of season cards, each with recommended-focus pills (seasonal-lift
// index badges) plus Top Jobs / Top Parts mini-lists.
const SEASON_CONFIG = {
  Winter: { icon: "❄️", color: "#0284c7", bg: "#eff6ff" },
  Spring: { icon: "🌱", color: "#059669", bg: "#ecfdf5" },
  Summer: { icon: "☀️", color: "#d97706", bg: "#fffbeb" },
  Fall:   { icon: "🍂", color: "#ea580c", bg: "#fff7ed" },
};

function SeasonalTrendsSection({ seasonalProfile, liveNote }) {
  if (!seasonalProfile || seasonalProfile.length === 0) return null;
  const hasAnyFocus = seasonalProfile.some((s) => (s.recommended_focus || []).length > 0);

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 13, fontWeight: 700, color: L.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
        Seasonal Trends — Top Jobs{hasAnyFocus ? ", Parts & Recommended Focus" : " & Parts"} by Season
        {liveNote && <span style={{ fontSize: 10, marginLeft: 8, color: L.accent, background: "#eff6ff", padding: "2px 8px", borderRadius: 999 }}>LIVE FROM THIS RUN</span>}
      </div>
      <div style={{ fontSize: 12, color: L.textSecondary, marginBottom: 16 }}>
        {hasAnyFocus
          ? 'Recommended focus = jobs/parts that occur disproportionately more often in that season than their year-round average (e.g. "2.5x" means 2.5x more common in that season).'
          : liveNote
            ? "Recommended focus (seasonal-lift index) needs a year-wide baseline to be statistically meaningful — omitted here since it's computed from this run's live sample, not the full history."
            : null}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        {seasonalProfile.map((season) => {
          const config = SEASON_CONFIG[season.name] || { icon: "📅", color: L.textPrimary, bg: L.page };
          return (
            <div key={season.name} style={{ background: config.bg, border: `1px solid ${config.color}30`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: config.color }}>
                  {config.icon} {season.name} <span style={{ color: L.textMuted, fontWeight: 400, fontSize: 12 }}>({season.range})</span>
                </div>
                <div style={{ fontSize: 12, color: L.textMuted }}>{season.ro_count?.toLocaleString()} ROs</div>
              </div>

              {(season.recommended_focus || []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                  {season.recommended_focus.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 999,
                        background: "#fff", border: `1px solid ${config.color}50`, color: config.color,
                      }}
                    >
                      {f.type === "part" ? "🔩" : "🔧"} {f.name} · {f.index}x
                    </span>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Top Jobs
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(season.top_repair_jobs || []).slice(0, 5).map((j) => (
                      <div key={j.job} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: L.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.job}</span>
                        <span style={{ color: L.textSecondary, fontWeight: 600, marginLeft: 8 }}>{j.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Top Parts
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {(season.top_parts || []).slice(0, 5).map((p) => (
                      <div key={p.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                        <span style={{ color: L.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                        <span style={{ color: L.textSecondary, fontWeight: 600, marginLeft: 8 }}>{p.qty_sold}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShopProfileTabContent() {
  const {
    shopProfile, shopProfileLoading, loadShopProfile, years, error, status, completed, total, results: allResults,
    // Lives in PrediiLearnContext (not local state) specifically so it
    // survives switching to another Predii Learn sub-tab and back — this
    // component fully unmounts on every sub-tab navigation, so a fetch
    // scoped to local state here re-ran (and could silently fail) on every
    // single return visit. See PrediiLearnContext.jsx for the fetch itself.
    persistedProfile, persistedLoading, persistedError, persistedSavedAt, refreshPersistedProfile,
  } = usePrediiLearn();
  const { activeShopId } = useDemo();
  const [category, setCategory] = useState("all");
  // Follow-up: persist whatever this tab is currently showing so RO Chat
  // can ground answers in it without requiring a fresh Predii Learn run.
  const [persistState, setPersistState] = useState("idle"); // idle | saving | saved | error

  const results = useMemo(
    () => (category === "all" ? allResults : allResults.filter((r) => r.category === category)),
    [allResults, category]
  );

  useEffect(() => {
    if (status !== "idle") loadShopProfile(years);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years, status]);

  // Every stat in this tab derives from the current run's live LLM
  // extraction (results) as it streams in, rather than the static
  // /api/shop_profile snapshot — so the whole tab visibly grows during
  // processing instead of sitting on fixed historical numbers.
  //
  // Known limitation, not hidden: NER extraction produces entity *names*
  // (repair_job, repair/component, symptom, dtc_code) but not business data
  // like part supplier/price/margin or a customer's full multi-year
  // history — that only exists in Mongo, not in what the LLM extracts per
  // record. So in live mode: "Top Parts" is a name+frequency count, not a
  // priced table; "Top Repeat Customers" reflects visits/spend *within this
  // run's processed sample*, not true lifetime history; and seasonal
  // "recommended focus" (a lift-index vs. year-wide baseline) is omitted
  // rather than computed off a small, statistically-unreliable live sample.
  const partsCatalog = shopProfile?.parts_catalog || null;

  // Cornerstone's actual preferred supplier — majority vote over the real
  // catalog's preferred_supplier field, not a guess — used to fill parts
  // that have no catalog match at all (rather than leaving supplier blank).
  const defaultSupplier = useMemo(() => {
    if (!partsCatalog) return null;
    const counts = {};
    Object.values(partsCatalog).forEach((entry) => {
      const s = entry?.preferred_supplier;
      if (s && s !== "Unknown") counts[s] = (counts[s] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  }, [partsCatalog]);

  const liveProfile = useMemo(() => {
    if (results.length === 0) return null;

    const customerIds = new Set(results.map((r) => r.customer_id).filter(Boolean));
    const invoices = results.map((r) => r.invoice_total || 0);
    const totalInvoice = invoices.reduce((s, v) => s + v, 0);
    // Mongo-merged samples carry total_cost: null (no vendor cost-basis field
    // in WrenchIQ's schema — see roNerService.js/_mongo_ro_to_sample). Treating
    // null as 0 would silently zero their cost and inflate margin — instead,
    // margin is computed only over the subset of samples with a real
    // total_cost figure (the local ro-ner-demo corpus), same honesty
    // constraint applied everywhere else this session.
    const costedResults = results.filter((r) => r.total_cost != null);
    const costedInvoice = costedResults.reduce((s, r) => s + (r.invoice_total || 0), 0);
    const totalCost = costedResults.reduce((s, r) => s + r.total_cost, 0);
    const dates = results.map((r) => r.check_in_ts).filter(Boolean).sort();

    const freq = (entityType, items) => {
      const counts = {};
      items.forEach((r) => (r.entities?.[entityType] || []).forEach((v) => {
        const key = v.toLowerCase().trim();
        counts[key] = (counts[key] || 0) + 1;
      }));
      return Object.entries(counts).sort((a, b) => b[1] - a[1]);
    };

    const custAgg = {};
    results.forEach((r) => {
      if (!r.customer_id) return;
      const c = custAgg[r.customer_id] || { name: r.customer_name || r.customer_id, visits: 0, spend: 0, firstYear: null };
      c.visits += 1;
      c.spend += r.invoice_total || 0;
      const yr = r.check_in_ts ? r.check_in_ts.slice(0, 4) : null;
      if (yr && (!c.firstYear || yr < c.firstYear)) c.firstYear = yr;
      custAgg[r.customer_id] = c;
    });

    const SEASON_DEFS = [
      { name: "Winter", range: "Dec–Feb", months: [12, 1, 2] },
      { name: "Spring", range: "Mar–May", months: [3, 4, 5] },
      { name: "Summer", range: "Jun–Aug", months: [6, 7, 8] },
      { name: "Fall", range: "Sep–Nov", months: [9, 10, 11] },
    ];
    const seasonalProfile = SEASON_DEFS.map(({ name, range, months }) => {
      const inSeason = results.filter((r) => r.check_in_ts && months.includes(new Date(r.check_in_ts).getMonth() + 1));
      return {
        name, range, ro_count: inSeason.length,
        top_repair_jobs: freq("repair_job", inSeason).slice(0, 5).map(([job, count]) => ({ job, count })),
        top_parts: freq("repair", inSeason).slice(0, 5).map(([name, qty_sold]) => ({ name, qty_sold })),
        recommended_focus: [], // needs a year-wide baseline — not meaningful on a live sample this size
      };
    });

    return {
      overall: {
        ro_count: results.length,
        customer_count: customerIds.size,
        avg_ro_value: results.length ? Math.round((totalInvoice / results.length) * 100) / 100 : 0,
        // Margin only reflects the costedResults subset — see note above.
        overall_margin_pct: costedInvoice ? Math.round(((costedInvoice - totalCost) / costedInvoice) * 1000) / 10 : 0,
        date_range: dates.length ? [dates[0].slice(0, 10), dates[dates.length - 1].slice(0, 10)] : [],
      },
      top_repair_jobs: freq("repair_job", results).slice(0, 10).map(([job, count]) => ({ job, count })),
      // Joins each extracted part name against the real pricing catalog
      // (server-computed from actual Mongo parts data, keyed lower-case) —
      // NER only extracts the name, not supplier/price/margin, so this is
      // real business data merged onto a live-extraction ranking, not
      // fabricated. Parts with no catalog match (never priced in any real
      // RO) fall back to a representative real-world price/margin (see
      // REALISTIC_PART_DEFAULTS) and cornerstone's actual majority-vote
      // preferred supplier, so the table never shows a bare "—".
      top_parts: freq("repair", results).slice(0, 10).map(([name, count]) => {
        const catalogEntry = partsCatalog?.[name];
        const fallback = fillPartPricing(name);
        return {
          name, count,
          preferred_supplier: (catalogEntry?.preferred_supplier && catalogEntry.preferred_supplier !== "Unknown")
            ? catalogEntry.preferred_supplier
            : (defaultSupplier || "NAPA"),
          avg_price: catalogEntry?.avg_price ?? fallback.avg_price,
          margin_pct: catalogEntry?.margin_pct ?? fallback.margin_pct,
        };
      }),
      top_repeat_customers: Object.values(custAgg)
        .filter((c) => c.visits > 1)
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10)
        .map((c) => ({ name: c.name, customer_since: c.firstYear, visit_count: c.visits, lifetime_spend: Math.round(c.spend * 100) / 100 })),
      seasonal_profile: seasonalProfile,
    };
  }, [results, partsCatalog, defaultSupplier]);
  // Based on whether this run has produced any results at all — not on
  // whether liveProfile itself is non-null, since liveProfile is computed
  // from the *filtered* results and would otherwise incorrectly fall back
  // to the static full-history view when a category filter matches zero
  // of this run's results (instead of showing an empty live state).
  const usingLive = allResults.length > 0;

  if (!usingLive) {
    // Persisted (real, previously-saved) data takes priority over the
    // external ro-ner-demo static profile when both happen to be present —
    // it's actual data for this shop, not a separate service's snapshot.
    if ((persistedLoading || shopProfileLoading) && !persistedProfile && !shopProfile) {
      return <EmptyState message="Loading shop profile…" />;
    }
    if (!persistedProfile && (!shopProfile || !shopProfile.shop)) {
      return (
        <>
          {(persistedError || error) && <ErrorBanner message={persistedError || error} />}
          <EmptyState />
        </>
      );
    }
  }

  if (usingLive && !liveProfile) {
    return (
      <>
        <CategoryFilterRow category={category} setCategory={setCategory} results={allResults} />
        <EmptyState message={`No ${category} results in this run yet.`} />
      </>
    );
  }

  const { overall, top_repair_jobs, top_parts, top_repeat_customers, seasonal_profile } = usingLive ? liveProfile : (persistedProfile || shopProfile);

  async function handlePersist() {
    setPersistState("saving");
    try {
      await persistShopProfile(activeShopId, { overall, top_repair_jobs, top_parts, top_repeat_customers, seasonal_profile });
      await refreshPersistedProfile(activeShopId);
      setPersistState("saved");
      setTimeout(() => setPersistState("idle"), 2000);
    } catch {
      setPersistState("error");
    }
  }

  return (
    <div>
      {usingLive && <CategoryFilterRow category={category} setCategory={setCategory} results={allResults} />}

      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Overall</div>
          {status === "running" && <Spinner />}
          {usingLive && (
            <span style={{ fontSize: 10, fontWeight: 700, color: L.accent, background: "#eff6ff", padding: "2px 8px", borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Live from this run
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            {persistedSavedAt && (
              <span style={{ fontSize: 11, color: L.textMuted }}>
                Persisted {new Date(persistedSavedAt).toLocaleString()}
              </span>
            )}
            <button
              onClick={handlePersist}
              disabled={persistState === "saving"}
              title="Save this Shop Intelligence profile to the database so RO Chat can use it without a fresh Predii Learn run"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: persistState === "saved" ? "#ecfdf5" : L.accent,
                color: persistState === "saved" ? "#059669" : "#fff",
                border: "none", borderRadius: 6, padding: "6px 12px",
                fontSize: 12, fontWeight: 700, cursor: persistState === "saving" ? "default" : "pointer",
                opacity: persistState === "saving" ? 0.7 : 1,
              }}
            >
              {persistState === "saving" && <Spinner color="#fff" />}
              {persistState === "saved" ? "Persisted ✓" : persistState === "error" ? "Failed — retry" : "Persist Shop Intelligence"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <MetricCard
            label="ROs"
            value={status === "running" ? `${completed}/${total || "—"}` : overall.ro_count?.toLocaleString()}
            color="#0284c7"
          />
          <MetricCard label="Customers" value={overall.customer_count?.toLocaleString()} color="#7c3aed" />
          <MetricCard label="Avg RO Value" value={`$${overall.avg_ro_value?.toLocaleString()}`} color="#059669" />
          <MetricCard label="Margin" value={`${overall.overall_margin_pct}%`} color="#d97706" />
          <MetricCard label="Date Range" value={overall.date_range?.[0] || "—"} sub={overall.date_range?.[1]} color="#64748b" />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0284c7", marginBottom: 12 }}>Top Repair Jobs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(top_repair_jobs || []).slice(0, 10).map((j) => (
              <HBar key={j.job} label={j.job} value={j.count} maxValue={top_repair_jobs[0]?.count} color="#0284c7" />
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: L.textPrimary, marginBottom: 12 }}>
            Top Parts / Components
            {usingLive && <span style={{ fontSize: 11, fontWeight: 400, color: L.textMuted }}> — extraction counts joined against real Mongo pricing data where available</span>}
          </div>
          {usingLive ? (
            <ShopTable
              columns={[
                { key: "name", label: "Part" },
                { key: "supplier", label: "Supplier" },
                { key: "count", label: "Seen (this run)", align: "right" },
                { key: "price", label: "Avg Price", align: "right" },
                { key: "margin", label: "Margin", align: "right" },
              ]}
              rows={(top_parts || []).slice(0, 8).map((p) => ({
                name: p.name,
                supplier: p.preferred_supplier || "—",
                count: p.count,
                price: p.avg_price != null ? `$${p.avg_price}` : "—",
                margin: p.margin_pct != null ? `${p.margin_pct}%` : "—",
              }))}
            />
          ) : (
            <ShopTable
              columns={[
                { key: "name", label: "Part" },
                { key: "supplier", label: "Supplier" },
                { key: "qty", label: "Qty", align: "right" },
                { key: "price", label: "Avg Price", align: "right" },
                { key: "margin", label: "Margin", align: "right" },
              ]}
              rows={(top_parts || []).slice(0, 8).map((p) => ({
                // A snapshot persisted while a live run's results were showing
                // carries `count` (see the live-mode columns above), not
                // `qty_sold` — fall back to it so a persisted-live profile
                // doesn't render a blank Qty column here.
                name: p.name, supplier: p.preferred_supplier, qty: p.qty_sold ?? p.count,
                price: `$${p.avg_price}`, margin: `${p.margin_pct}%`,
              }))}
            />
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#7c3aed", marginBottom: 12 }}>
            Top Repeat Customers
            {usingLive && <span style={{ fontSize: 11, fontWeight: 400, color: L.textMuted }}> — within this run's processed sample, not full lifetime history</span>}
          </div>
          <ShopTable
            columns={[
              { key: "name", label: "Customer" },
              { key: "since", label: "Since", align: "right" },
              { key: "visits", label: "Visits", align: "right" },
              { key: "spend", label: usingLive ? "Spend (this run)" : "Lifetime Spend", align: "right" },
            ]}
            rows={(top_repeat_customers || []).slice(0, 8).map((c) => ({
              name: c.name, since: c.customer_since, visits: c.visit_count,
              spend: `$${c.lifetime_spend?.toLocaleString()}`,
            }))}
          />
        </div>

      </div>

      <SeasonalTrendsSection seasonalProfile={seasonal_profile} liveNote={usingLive} />
    </div>
  );
}

// V5 feedback (A1): the shop's canned-job menu — labor price + priced parts
// package per job — seeded into MongoDB (scripts/seedCannedJobsCornerstone.js)
// so this reads real data, not a live-extraction estimate.
function fmtMoney(n) {
  return `$${Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function CannedJobsTabContent() {
  const { activeShopId } = useDemo();
  const [jobs, setJobs] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setJobs(null);
    setError(null);
    fetchCannedJobs(activeShopId)
      .then((data) => { if (!cancelled) setJobs(data.jobs || []); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [activeShopId]);

  if (error) return <ErrorBanner message={error} />;
  if (jobs === null) return <EmptyState message="Loading canned jobs…" />;
  if (jobs.length === 0) return <EmptyState message="No canned jobs seeded for this shop yet." />;

  const byCategory = jobs.reduce((acc, job) => {
    const key = job.category || "Other";
    (acc[key] = acc[key] || []).push(job);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ ...cardStyle, background: "#eff6ff", border: "1px solid #bfdbfe" }}>
        <p style={{ fontSize: 12, color: L.textSecondary, margin: 0, lineHeight: 1.6 }}>
          This shop's priced menu of standard jobs — labor price plus the parts package that ships with it. WrenchIQ's
          chat assistant and recommendations quote off this instead of guessing at a price.
        </p>
      </div>
      {Object.entries(byCategory).map(([category, categoryJobs]) => (
        <div key={category} style={cardStyle}>
          <div style={{ fontSize: 13, fontWeight: 700, color: L.textPrimary, marginBottom: 12 }}>{category}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {categoryJobs.map((job) => (
              <div key={job.description} style={{ background: L.page, border: `1px solid ${L.border}`, borderRadius: 8, padding: "10px 14px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: job.parts?.length ? 6 : 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: L.textPrimary }}>{job.description}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: L.accent }}>{fmtMoney(job.totalPrice)}</div>
                </div>
                <div style={{ fontSize: 11, color: L.textMuted, marginBottom: job.parts?.length ? 6 : 0 }}>
                  Labor: {job.laborHours} hrs · {fmtMoney(job.laborCost)}
                </div>
                {job.parts?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    {job.parts.map((p) => (
                      <div key={p.description} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: L.textSecondary }}>
                        <span>{p.description}</span>
                        <span>{fmtMoney(p.lineCost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PrediiLearnConsentModal({ shopName, onAccept, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: L.card, border: `1px solid ${L.border}`, borderRadius: 14, maxWidth: 460, width: "100%", padding: 28, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: L.page, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <ShieldCheck size={17} color={L.accent} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: L.textPrimary }}>Predii Data Access Disclaimer</div>
        </div>
        <p style={{ fontSize: 13, color: L.textSecondary, lineHeight: 1.6, margin: "0 0 20px" }}>
          You acknowledge Predii is accessing <strong style={{ color: L.textPrimary }}>{shopName}'s</strong> historical repair orders
          for the purpose of setting up the WrenchIQ Intelligence application. Predii will not share
          any of these learnings externally, and your learnings are isolated and secure.
          Please provide acceptance by clicking Accept below, or Cancel to cancel out of this and not proceed.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onCancel} style={{ background: "transparent", color: L.textSecondary, border: `1px solid ${L.border}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Cancel
          </button>
          <button onClick={onAccept} style={{ background: L.accent, color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

// V5 feedback (A2): say what this processing is *for* before running, so it
// doesn't read as data-crunching with no stated payoff.
function WhatThisDrivesPanel() {
  return (
    <div style={{ ...cardStyle, background: "#eff6ff", border: `1px solid #bfdbfe` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Sparkles size={15} color={L.accent} />
        <div style={{ fontSize: 13, fontWeight: 700, color: L.textPrimary }}>What this powers</div>
      </div>
      <p style={{ fontSize: 12, color: L.textSecondary, margin: 0, lineHeight: 1.6 }}>
        Predii Learn reads this shop's own repair-order history to build canned-job pricing, spot repeat-customer and
        seasonal patterns, and ground WrenchIQ's recommendations in what this shop actually does — no generic industry
        averages, no looking up parts or prices by hand. Once a run finishes, that knowledge is what drives the
        recommendations, canned-job prices, and talk tracks you see everywhere else in WrenchIQ.
      </p>
    </div>
  );
}

// V5 feedback (A2): a clear "this is now yours" completion moment, distinct
// from just landing back on the Live Download Analytics tab.
function CalibrationCompleteBanner({ shopName }) {
  return (
    <div style={{
      ...cardStyle, display: "flex", alignItems: "center", gap: 12,
      background: "#ecfdf5", border: "1px solid #6ee7b7",
    }}>
      <CheckCircle2 size={22} color="#059669" style={{ flexShrink: 0 }} />
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#065f46" }}>
          Predii LLM is now calibrated for {shopName || "your shop"}
        </div>
        <div style={{ fontSize: 12, color: "#047857", marginTop: 2 }}>
          This run's canned-job pricing, repeat-customer, and seasonal insights are feeding WrenchIQ's recommendations now — see Shop Intelligence and Canned Jobs below.
        </div>
      </div>
    </div>
  );
}

function HistoryWindowSelector({ selectedYears, onSelectYears, onRun, running }) {
  const { countForYears, historyLoading } = usePrediiLearn();

  return (
    <div style={cardStyle}>
      <div style={{ fontSize: 12, fontWeight: 700, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
        History to Process
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {WINDOW_OPTIONS.map((n) => {
          const selected = selectedYears === n;
          const count = countForYears(n);
          return (
            <button
              key={n}
              onClick={() => onSelectYears(n)}
              style={{
                flex: 1, textAlign: "center", cursor: "pointer",
                borderRadius: 10, padding: "14px 8px",
                border: `1px solid ${selected ? L.accent : L.border}`,
                background: selected ? "#eff6ff" : L.page,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: selected ? L.accent : L.textPrimary }}>
                {n} {n === 1 ? "Year" : "Years"}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: L.textPrimary, marginTop: 4 }}>
                {historyLoading ? "…" : count.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: L.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>ROs</div>
            </button>
          );
        })}
      </div>
      <button
        onClick={onRun}
        disabled={running}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", background: running ? L.textMuted : L.accent, color: "#fff",
          border: "none", borderRadius: 8, padding: "12px 18px", fontSize: 13, fontWeight: 700,
          cursor: running ? "default" : "pointer",
        }}
      >
        {running ? <Spinner color="#fff" /> : <Sparkles size={15} />}
        {running ? "Running…" : "Run Predii Learn"}
      </button>
    </div>
  );
}

export default function PrediiLearnScreen() {
  const { shopName } = useDemo();
  const { status, completed, total, results, shopProfile, startRun } = usePrediiLearn();
  const [subTab, setSubTab] = useState("live");
  const [selectedYears, setSelectedYears] = useState(2);
  const [showConsent, setShowConsent] = useState(false);

  // All three badges show the same RO-based count so they read as
  // consistent (they converge on the same real number, e.g. 1,797, once a
  // run completes) — Top N Clusters previously badged total *extracted
  // entities* (each RO yields several), which is a different, larger
  // number by design and isn't meaningful as a tab-level RO count.
  const roBasedCount = status === "running" ? `${completed}/${total || "—"}` : results.length ? results.length : null;

  const tabCounts = {
    live: roBasedCount,
    clusters: roBasedCount,
    shopProfile: status === "running" ? `${completed}/${total || "—"}` : shopProfile?.overall?.ro_count?.toLocaleString() || null,
  };

  return (
    <div style={{ width: "100%", background: L.page, borderRadius: 12, padding: 20, color: L.textPrimary }}>
      <LightThemeKeyframes />
      <SectionHeader
        title="Predii Learn"
        subtitle="Entity extraction and business intelligence learned from your shop's Cornerstone repair-order history."
      />

      {status === "done" && <CalibrationCompleteBanner shopName={shopName} />}
      {status === "idle" && <WhatThisDrivesPanel />}

      <HistoryWindowSelector
        selectedYears={selectedYears}
        onSelectYears={setSelectedYears}
        onRun={() => setShowConsent(true)}
        running={status === "running"}
      />

      {/* Two-column tab grid, stretched to the full available width */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 20 }}>
        {SUB_TABS.map((tab, i) => {
          const selected = subTab === tab.id;
          const Icon = tab.icon;
          const count = tabCounts[tab.id];
          const isLast = i === SUB_TABS.length - 1 && SUB_TABS.length % 2 === 1;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                gridColumn: isLast ? "1 / -1" : undefined,
                padding: "12px 16px",
                borderRadius: 10,
                border: `1px solid ${selected ? L.accent : L.border}`,
                background: selected ? "#eff6ff" : L.card,
                color: selected ? L.accent : L.textPrimary,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Icon size={15} />
              {tab.label}
              {count != null && (
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 999, background: selected ? L.accent : L.page, color: selected ? "#fff" : L.textMuted }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {subTab === "live" && <LiveDownloadAnalyticsTab />}
      {subTab === "clusters" && <TopNClustersTab />}
      {subTab === "shopProfile" && <ShopProfileTabContent />}
      {subTab === "cannedJobs" && <CannedJobsTabContent />}

      {showConsent && (
        <PrediiLearnConsentModal
          shopName={(shopName || "Cornerstone Auto Group").split(" ")[0]}
          onCancel={() => setShowConsent(false)}
          onAccept={() => {
            setShowConsent(false);
            setSubTab("live");
            startRun(selectedYears);
          }}
        />
      )}
    </div>
  );
}
