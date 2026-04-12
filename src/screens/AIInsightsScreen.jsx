/**
 * WrenchIQ — AI Insights Screen
 *
 * Full-screen advisor intelligence hub:
 *   - RO distribution charts (by shop, top jobs, top makes)
 *   - Location + customer filters
 *   - LLM Q&A with advisor-friendly formatted answers
 *   - True fullscreen expand mode
 */

import { useState, useEffect, useRef, useCallback } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Cell,
} from "recharts";
import {
  Sparkles, Send, TrendingUp, Package, Wrench, MapPin,
  ChevronRight, Database, RotateCcw, Maximize2, Minimize2,
  User, X, Filter,
} from "lucide-react";
import { COLORS } from "../theme/colors";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Question library ───────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "patterns", label: "Repair Patterns", icon: TrendingUp, color: COLORS.primary,
    questions: [
      "Which engine size generates the most repair work?",
      "What jobs are almost always done at the same visit?",
      "What are the most common repairs across all vehicles?",
      "What mileage do most vehicles come in at?",
    ],
  },
  {
    id: "upsell", label: "Upsell & Bundling", icon: Package, color: COLORS.accent,
    questions: [
      "What else usually gets done during an oil change visit?",
      "What should I recommend alongside a brake job?",
      "When a customer comes in for A/C service, what else should I check?",
      "What are the most expensive parts we use?",
    ],
  },
  {
    id: "makes", label: "By Vehicle", icon: Wrench, color: "#8B5CF6",
    questions: [
      "What are the top repairs for Ford vehicles?",
      "What are the top repairs for Toyota vehicles?",
      "What are the top repairs for Chevrolet vehicles?",
      "What are the top repairs for Honda vehicles?",
    ],
  },
  {
    id: "shop", label: "Shop Performance", icon: MapPin, color: "#0EA5E9",
    questions: [
      "Which shop location has the most repair orders?",
      "Which vehicle makes are most profitable to service?",
      "What parts do we go through the highest volume on?",
      "How does repair volume compare across our locations?",
    ],
  },
];

// ── Answer formatter ───────────────────────────────────────────────────────────
function AdvisorAnswer({ text }) {
  if (!text) return null;

  // Parse sections
  const sections = [];
  let currentSection = null;
  let currentLines = [];

  const flush = () => {
    if (currentSection !== null) {
      sections.push({ type: currentSection, lines: currentLines });
      currentLines = [];
    }
  };

  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("**Bottom Line:**")) {
      flush(); currentSection = "headline"; currentLines = [line.replace("**Bottom Line:**", "").trim()];
    } else if (line.startsWith("**What the data shows:**")) {
      flush(); currentSection = "findings"; currentLines = [];
    } else if (line.startsWith("**Why this answer:**")) {
      flush(); currentSection = "evidence"; currentLines = [];
    } else if (line.startsWith("**At the counter:**")) {
      flush(); currentSection = "action"; currentLines = [];
    } else if (currentSection !== null) {
      if (line.trim()) currentLines.push(line);
    }
  }
  flush();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {sections.map((sec, i) => <Section key={i} sec={sec} />)}
    </div>
  );
}

function Section({ sec }) {
  if (sec.type === "headline") {
    const txt = sec.lines.join(" ").trim();
    return (
      <div style={{ background: `${COLORS.primary}08`, border: `1.5px solid ${COLORS.primary}25`, borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Bottom Line</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.6 }}>
          <RichText text={txt} />
        </div>
      </div>
    );
  }

  if (sec.type === "findings") {
    return (
      <div>
        <SectionLabel color={COLORS.textMuted}>What the data shows</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sec.lines.map((line, i) => {
            const num = line.match(/^(\d+)\.\s+/)?.[1];
            const content = num ? line.replace(/^\d+\.\s+/, "") : line.replace(/^[-*]\s+/, "");
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                {num ? (
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{num}</span>
                  </div>
                ) : (
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: COLORS.primary, flexShrink: 0, marginTop: 8 }} />
                )}
                <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.7 }}>
                  <RichText text={content} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (sec.type === "evidence") {
    return (
      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 10, padding: "12px 16px" }}>
        <SectionLabel color="#7C3AED">Why this answer</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {sec.lines.map((line, i) => {
            const content = line.replace(/^[-*]\s+/, "");
            return (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <Database size={11} color="#7C3AED" style={{ flexShrink: 0, marginTop: 3 }} />
                <div style={{ fontSize: 12, color: "#5B21B6", lineHeight: 1.6 }}>
                  <RichText text={content} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (sec.type === "action") {
    const txt = sec.lines.join(" ").replace(/^[-*>]\s+/, "").trim();
    return (
      <div style={{ background: `${COLORS.accent}08`, border: `1.5px solid ${COLORS.accent}30`, borderRadius: 10, padding: "14px 18px" }}>
        <SectionLabel color={COLORS.accent}>At the counter</SectionLabel>
        <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.7, fontStyle: "italic" }}>
          <RichText text={txt} />
        </div>
      </div>
    );
  }

  return null;
}

function SectionLabel({ children, color }) {
  return (
    <div style={{ fontSize: 10, fontWeight: 700, color: color || COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
      {children}
    </div>
  );
}

// Bold + number highlight inline renderer
function RichText({ text }) {
  const parts = [];
  let key = 0;
  const boldRe = /\*\*([^*]+)\*\*/g;
  let last = 0, m;
  while ((m = boldRe.exec(text)) !== null) {
    if (m.index > last) parts.push(<NumHighlight key={key++} text={text.slice(last, m.index)} />);
    parts.push(<strong key={key++} style={{ color: COLORS.textPrimary, fontWeight: 700 }}><NumHighlight text={m[1]} /></strong>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<NumHighlight key={key++} text={text.slice(last)} />);
  return <>{parts}</>;
}

function NumHighlight({ text }) {
  const parts = text.split(/(\b\d+(?:\.\d+)?%|\b\d{2,}(?:,\d{3})*\b|\b\d+ out of \d+\b)/g);
  return (
    <>
      {parts.map((p, i) =>
        /^\d/.test(p) ? (
          <span key={i} style={{ background: `${COLORS.accent}18`, color: COLORS.accent, borderRadius: 4, padding: "0 4px", fontWeight: 700 }}>{p}</span>
        ) : p
      )}
    </>
  );
}

// ── Distribution chart tooltip ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 12 }}>
      <div style={{ fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>{label}</div>
      <div style={{ color: COLORS.textMuted }}>{payload[0]?.value} ROs</div>
    </div>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────────
const LOADING_STEPS = [
  "Querying repair database…",
  "Analyzing patterns across clusters…",
  "Matching vehicle data…",
  "Generating insights…",
  "Formatting your answer…",
];

export default function AIInsightsScreen() {
  const [stats, setStats]               = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("patterns");
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [answer, setAnswer]             = useState(null);
  const [answerError, setAnswerError]   = useState(null);
  const [dataSources, setDataSources]   = useState([]);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [elapsed, setElapsed]           = useState(0);
  const [loadStep, setLoadStep]         = useState(0);
  const [customInput, setCustomInput]   = useState("");
  const [location, setLocation]         = useState("");
  const [customer, setCustomer]         = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [fullscreen, setFullscreen]     = useState(false);
  const answerRef = useRef(null);
  const elapsedRef = useRef(null);

  // Fetch stats on mount and when filters change
  useEffect(() => {
    setStatsLoading(true);
    fetch(`${API_BASE}/api/knowledge-graph/stats`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setStats(d))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  useEffect(() => {
    if (answer) answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [answer]);

  const ask = useCallback(async (question) => {
    if (answerLoading) return;
    setActiveQuestion(question);
    setAnswer(null);
    setAnswerError(null);
    setDataSources([]);
    setAnswerLoading(true);
    setElapsed(0);
    setLoadStep(0);
    setCustomInput("");

    // Elapsed timer + rotating step label
    let secs = 0;
    elapsedRef.current = setInterval(() => {
      secs++;
      setElapsed(secs);
      setLoadStep(Math.min(Math.floor(secs / 3), LOADING_STEPS.length - 1));
    }, 1000);

    try {
      const res = await fetch(`${API_BASE}/api/knowledge-graph/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          history: [],
          ...(location && { location }),
          ...(customer && { customer_name: customer }),
        }),
      });
      const text = await res.text();
      let data = {};
      try { data = text ? JSON.parse(text) : {}; } catch (_) { /* non-JSON proxy error */ }
      if (!res.ok) {
        const msg = data.error || (res.status === 500 && !text
          ? "AI Insights service is offline — run `npm run server` to start the API server"
          : `Server returned ${res.status}`);
        throw new Error(msg);
      }
      setAnswer(data.answer);
      setDataSources(data.data_used || []);
    } catch (e) {
      setAnswerError(e.message);
    } finally {
      clearInterval(elapsedRef.current);
      setAnswerLoading(false);
    }
  }, [answerLoading, location, customer]);

  const cat = CATEGORIES.find(c => c.id === activeCategory);

  // Distribution chart data
  const shopData = stats?.ro_by_shop?.slice(0, 6) || [];
  const makeData = stats?.top_makes?.slice(0, 6) || [];

  // Merge LOF SERVICE + Oil & Filter Change, then split into Maintenance vs Mechanical
  const MAINTENANCE_KEYWORDS = ['lof', 'oil', 'multi-point', 'multipoint', 'mpi', 'tire rotation', 'mount balance', 'rotate tire'];
  const MERGE_OIL_PATTERNS   = ['lof service', 'oil & filter change', 'oil and filter change', 'oil change', 'lof'];

  const rawJobs = stats?.top_jobs || [];
  const mergedJobs = (() => {
    const oilCount = rawJobs
      .filter(j => MERGE_OIL_PATTERNS.some(p => j.job?.toLowerCase().includes(p)))
      .reduce((sum, j) => sum + j.count, 0);
    const others = rawJobs.filter(j => !MERGE_OIL_PATTERNS.some(p => j.job?.toLowerCase().includes(p)));
    const merged = oilCount > 0 ? [{ job: 'Oil Change / LOF', count: oilCount }, ...others] : others;
    return merged.sort((a, b) => b.count - a.count);
  })();

  const isMaintenance = (job) => MAINTENANCE_KEYWORDS.some(k => job?.toLowerCase().includes(k));
  const maintenanceJobs = mergedJobs.filter(j => isMaintenance(j.job)).slice(0, 5);
  const mechanicalJobs  = mergedJobs.filter(j => !isMaintenance(j.job)).slice(0, 5);
  const customers = stats?.customers || [];
  const filteredCustomers = customers.filter(c =>
    !customerSearch || c.name?.toLowerCase().includes(customerSearch.toLowerCase())
  ).slice(0, 12);

  const container = fullscreen
    ? { position: "fixed", inset: 0, zIndex: 200, background: COLORS.bg }
    : { height: "100%", background: COLORS.bg };

  return (
    <div style={{ ...container, display: "flex", flexDirection: "column", overflow: "hidden", fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 24px 12px", background: "#fff", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>AI Insights</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                {statsLoading ? "Loading…" : stats ? `${stats.ro_by_shop?.reduce((s,r)=>s+r.count,0) || 0} ROs · ${stats.ro_by_shop?.length || 0} locations · ${stats.top_makes?.length || 0} makes` : "Questions answered from your live repair data"}
              </div>
            </div>
          </div>

          {/* Filters + expand */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Filter size={13} color={COLORS.textMuted} />

            {/* Location filter */}
            <select
              value={location}
              onChange={e => setLocation(e.target.value)}
              style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, border: `1px solid ${location ? COLORS.primary : COLORS.border}`, color: location ? COLORS.primary : COLORS.textSecondary, background: location ? `${COLORS.primary}08` : "#fff", fontWeight: location ? 600 : 400 }}
            >
              <option value="">All Locations</option>
              {shopData.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>

            {/* Customer filter */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowCustomerPicker(p => !p)}
                style={{ fontSize: 12, padding: "5px 10px", borderRadius: 7, border: `1px solid ${customer ? "#8B5CF6" : COLORS.border}`, color: customer ? "#8B5CF6" : COLORS.textSecondary, background: customer ? "#8B5CF608" : "#fff", display: "flex", alignItems: "center", gap: 5, cursor: "pointer", fontWeight: customer ? 600 : 400 }}
              >
                <User size={11} />
                {customer || "All Customers"}
                {customer && <X size={10} onClick={(e) => { e.stopPropagation(); setCustomer(""); setCustomerSearch(""); }} />}
              </button>
              {showCustomerPicker && (
                <div style={{ position: "absolute", top: 34, right: 0, width: 240, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 50, overflow: "hidden" }}>
                  <div style={{ padding: "8px 10px", borderBottom: `1px solid ${COLORS.borderLight}` }}>
                    <input
                      autoFocus
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      placeholder="Search customers…"
                      style={{ width: "100%", fontSize: 12, padding: "4px 8px", borderRadius: 6, border: `1px solid ${COLORS.border}`, outline: "none" }}
                    />
                  </div>
                  <div style={{ maxHeight: 200, overflowY: "auto" }}>
                    <div
                      onClick={() => { setCustomer(""); setShowCustomerPicker(false); setCustomerSearch(""); }}
                      style={{ padding: "8px 12px", fontSize: 12, color: COLORS.textMuted, cursor: "pointer", borderBottom: `1px solid ${COLORS.borderLight}` }}
                    >
                      All Customers
                    </div>
                    {filteredCustomers.map(c => (
                      <div key={c.id} onClick={() => { setCustomer(c.name); setShowCustomerPicker(false); setCustomerSearch(""); }}
                        style={{ padding: "8px 12px", fontSize: 12, color: COLORS.textPrimary, cursor: "pointer", display: "flex", justifyContent: "space-between", borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <span>{c.name}</span>
                        <span style={{ color: COLORS.textMuted }}>{c.ro_count} ROs</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setFullscreen(f => !f)}
              title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              style={{ width: 30, height: 30, borderRadius: 7, border: `1px solid ${COLORS.border}`, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {fullscreen ? <Minimize2 size={13} color={COLORS.textSecondary} /> : <Maximize2 size={13} color={COLORS.textSecondary} />}
            </button>
          </div>
        </div>

        {/* Active filter chips */}
        {(location || customer) && (
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            {location && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: `${COLORS.primary}12`, color: COLORS.primary, border: `1px solid ${COLORS.primary}30`, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={9} /> {location}
                <X size={9} style={{ cursor: "pointer" }} onClick={() => setLocation("")} />
              </span>
            )}
            {customer && (
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#8B5CF612", color: "#8B5CF6", border: "1px solid #8B5CF630", display: "flex", alignItems: "center", gap: 4 }}>
                <User size={9} /> {customer}
                <X size={9} style={{ cursor: "pointer" }} onClick={() => setCustomer("")} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Distribution row ─────────────────────────────────────────────────── */}
      {statsLoading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr 1fr", gap: 0, borderBottom: `1px solid ${COLORS.border}`, background: "#fff", flexShrink: 0 }}>
          {[110, 180, 110].map((h, i) => (
            <div key={i} style={{ padding: "12px 16px 10px", borderRight: i < 2 ? `1px solid ${COLORS.border}` : "none" }}>
              <div style={{ height: 10, width: 80, borderRadius: 4, marginBottom: 10, background: `linear-gradient(90deg,${COLORS.borderLight} 25%,#e5e7eb 50%,${COLORS.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite" }} />
              <div style={{ height: h, borderRadius: 6, background: `linear-gradient(90deg,${COLORS.borderLight} 25%,#e5e7eb 50%,${COLORS.borderLight} 75%)`, backgroundSize: "200% 100%", animation: "shimmer 1.4s ease infinite" }} />
            </div>
          ))}
        </div>
      )}
      {!statsLoading && stats && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr 1fr", gap: 0, borderBottom: `1px solid ${COLORS.border}`, background: "#fff", flexShrink: 0 }}>

          {/* ROs by location */}
          <div style={{ padding: "12px 16px 8px", borderRight: `1px solid ${COLORS.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>ROs by Location</div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={shopData} layout="vertical" margin={{ left: 4, right: 24, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: COLORS.textMuted }} width={110} tickFormatter={v => v?.length > 16 ? v.slice(0, 14) + "…" : v} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[0, 3, 3, 0]}>
                  {shopData.map((d, i) => (
                    <Cell key={i}
                      fill={location === d.name ? COLORS.accent : COLORS.primary}
                      cursor="pointer"
                      onClick={() => setLocation(l => l === d.name ? "" : d.name)}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top repair jobs — Maintenance | Mechanical */}
          <div style={{ padding: "12px 16px 8px", borderRight: `1px solid ${COLORS.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Maintenance", jobs: maintenanceJobs, color: COLORS.primary },
              { label: "Mechanical",  jobs: mechanicalJobs,  color: COLORS.accent  },
            ].map(({ label, jobs, color }) => {
              const maxCount = jobs[0]?.count || 1;
              return (
                <div key={label}>
                  <div style={{ fontSize: 10, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{label}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    {jobs.map((j, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <div style={{ fontSize: 9, color: COLORS.textSecondary, width: 82, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={j.job}>
                          {j.job?.length > 14 ? j.job.slice(0, 13) + "…" : j.job}
                        </div>
                        <div style={{ flex: 1, height: 6, background: COLORS.borderLight, borderRadius: 3 }}>
                          <div style={{ width: `${(j.count / maxCount) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 9, color: COLORS.textMuted, width: 36, textAlign: "right", flexShrink: 0 }}>
                          {j.count >= 1000 ? `${(j.count / 1000).toFixed(1)}k` : j.count}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vehicle makes */}
          <div style={{ padding: "12px 16px 8px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>By Make</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {makeData.slice(0, 5).map((m, i) => {
                const maxCount = makeData[0]?.count || 1;
                return (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 10, color: COLORS.textSecondary, width: 64, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.make}</div>
                    <div style={{ flex: 1, height: 8, background: COLORS.borderLight, borderRadius: 4 }}>
                      <div style={{ width: `${(m.count / maxCount) * 100}%`, height: "100%", background: "#8B5CF6", borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: 10, color: COLORS.textMuted, width: 20, textAlign: "right", flexShrink: 0 }}>{m.count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Main Q&A area ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Question panel */}
        <div style={{ width: 260, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", background: "#fff", flexShrink: 0, overflowY: "auto" }}>
          {/* Category nav */}
          <div style={{ padding: "12px 10px 8px" }}>
            {CATEGORIES.map(c => {
              const active = activeCategory === c.id;
              return (
                <button key={c.id} onClick={() => setActiveCategory(c.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 10px", borderRadius: 7, border: "none", cursor: "pointer", background: active ? `${c.color}10` : "transparent", color: active ? c.color : COLORS.textSecondary, fontSize: 12, fontWeight: active ? 700 : 400, marginBottom: 2, textAlign: "left" }}
                >
                  <c.icon size={12} />
                  {c.label}
                  {active && <ChevronRight size={11} style={{ marginLeft: "auto" }} />}
                </button>
              );
            })}
          </div>

          {/* Questions for active category */}
          <div style={{ padding: "0 10px 10px", flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.06em", padding: "4px 10px 8px", textTransform: "uppercase" }}>{cat?.label}</div>
            {cat?.questions.map((q, i) => {
              const isActive = activeQuestion === q && answer;
              return (
                <button key={i} onClick={() => ask(q)}
                  style={{ display: "block", width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 7, border: `1px solid ${isActive ? cat.color : COLORS.borderLight}`, background: isActive ? `${cat.color}08` : "transparent", fontSize: 11, color: isActive ? cat.color : COLORS.textSecondary, cursor: "pointer", marginBottom: 5, lineHeight: 1.5, fontWeight: isActive ? 600 : 400 }}
                >
                  {q}
                </button>
              );
            })}
          </div>

          {/* Custom input */}
          <div style={{ padding: "10px", borderTop: `1px solid ${COLORS.borderLight}` }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.06em", marginBottom: 6, textTransform: "uppercase" }}>Custom question</div>
            <div style={{ position: "relative" }}>
              <textarea
                value={customInput}
                onChange={e => setCustomInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (customInput.trim()) ask(customInput.trim()); } }}
                placeholder="Ask anything about your data…"
                rows={3}
                style={{ width: "100%", resize: "none", fontSize: 11, padding: "7px 32px 7px 8px", borderRadius: 7, border: `1px solid ${COLORS.border}`, background: "#F9FAFB", color: COLORS.textPrimary, fontFamily: "inherit", lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
              />
              <button onClick={() => { if (customInput.trim()) ask(customInput.trim()); }} disabled={!customInput.trim() || answerLoading}
                style={{ position: "absolute", bottom: 6, right: 6, width: 22, height: 22, borderRadius: 5, border: "none", background: customInput.trim() ? COLORS.primary : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: customInput.trim() ? "pointer" : "default" }}>
                <Send size={10} color="#fff" />
              </button>
            </div>
          </div>
        </div>

        {/* Answer panel */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, minWidth: 0 }} onClick={() => setShowCustomerPicker(false)}>

          {/* Empty state */}
          {!answerLoading && !answer && (
            <div style={{ maxWidth: 560, margin: "40px auto", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                <Sparkles size={26} color={COLORS.primary} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>What would you like to know?</div>
              <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7, marginBottom: 24 }}>
                Answers come from your real repair order data — {stats?.ro_by_shop?.reduce((s,r)=>s+r.count,0) || "…"} ROs across {stats?.ro_by_shop?.length || "…"} locations. Use the filters above to scope by location or customer.
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {CATEGORIES.map(c => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: `${c.color}10`, border: `1px solid ${c.color}25`, fontSize: 11, color: c.color }}>
                    <c.icon size={10} /> {c.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {answerLoading && (
            <div style={{ maxWidth: 680 }}>
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Question</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.6 }}>{activeQuestion}</div>
              </div>

              {/* Animated progress card */}
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 0.2, 0.4].map(d => (
                        <div key={d} style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.primary, animation: `bounce 0.9s ease infinite ${d}s` }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      {LOADING_STEPS[loadStep]}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>
                    {elapsed}s
                  </span>
                </div>

                {/* Step progress bar */}
                <div style={{ display: "flex", gap: 4 }}>
                  {LOADING_STEPS.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= loadStep ? COLORS.primary : COLORS.borderLight, transition: "background 0.4s" }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  <span style={{ fontSize: 9, color: COLORS.textMuted }}>Step {loadStep + 1} of {LOADING_STEPS.length}</span>
                  <span style={{ fontSize: 9, color: COLORS.textMuted }}>AI responses typically take 8–15s</span>
                </div>

                {/* Shimmer lines */}
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[100, 85, 92, 70].map((w, i) => (
                    <div key={i} style={{ height: 12, borderRadius: 6, background: `linear-gradient(90deg, ${COLORS.borderLight} 25%, #e5e7eb 50%, ${COLORS.borderLight} 75%)`, backgroundSize: "200% 100%", animation: `shimmer 1.4s ease infinite ${i * 0.1}s`, width: `${w}%` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error card */}
          {!answerLoading && answerError && (
            <div ref={answerRef} style={{ maxWidth: 680 }}>
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0", padding: "16px 22px", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.5 }}>{activeQuestion}</div>
              </div>
              <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px 22px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Could not get an answer</div>
                <div style={{ fontSize: 13, color: "#7F1D1D", lineHeight: 1.6, marginBottom: 16 }}>{answerError}</div>
                <button onClick={() => ask(activeQuestion)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #FECACA", background: "#fff", fontSize: 12, fontWeight: 600, color: "#DC2626", cursor: "pointer" }}>
                  <RotateCcw size={11} /> Try again
                </button>
              </div>
            </div>
          )}

          {/* Answer card */}
          {!answerLoading && answer && (
            <div ref={answerRef} style={{ maxWidth: 680 }}>
              {/* Question header */}
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: "12px 12px 0 0", padding: "16px 22px", borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                  <Sparkles size={11} color={COLORS.primary} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    AI Insight {location && `· ${location}`} {customer && `· ${customer}`}
                  </span>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.5 }}>{activeQuestion}</div>
              </div>

              {/* Answer body */}
              <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderTop: "none", borderRadius: "0 0 12px 12px", padding: "20px 22px" }}>
                <AdvisorAnswer text={answer} />
              </div>

              {/* Footer */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <Database size={10} color={COLORS.textMuted} />
                <span style={{ fontSize: 10, color: COLORS.textMuted }}>Sources:</span>
                {dataSources.map((s, i) => (
                  <span key={i} style={{ fontSize: 10, color: COLORS.textMuted, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, padding: "2px 7px" }}>{s}</span>
                ))}
                <button onClick={() => ask(activeQuestion)}
                  style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "#fff", fontSize: 11, color: COLORS.textSecondary, cursor: "pointer" }}>
                  <RotateCcw size={10} /> Refresh
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
