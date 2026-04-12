import { useState, useRef, useEffect } from "react";
import {
  Database, Zap, Users, FileText, Settings2,
  Server, GitMerge, ArrowDown, ArrowRight,
  CheckCircle, AlertCircle, Key, Shield, Activity,
  Cpu, Globe, Lock, Sparkles, Send, ChevronRight,
  TrendingUp, Wrench, Package, MapPin, RotateCcw,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { useEditionName, useBranding } from "../context/BrandingContext";
import { SHOP, technicians, advisors } from "../data/demoData";
import IntegrationsScreen from "./IntegrationsScreen";

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "insights",     label: "AI Insights",       icon: Sparkles },
  { id: "architecture", label: "Architecture",      icon: GitMerge },
  { id: "api",          label: "API & Integrations", icon: Zap },
  { id: "team",         label: "Team",              icon: Users },
  { id: "audit",        label: "Audit Log",         icon: FileText },
  { id: "system",       label: "System",            icon: Settings2 },
];

// ── Advisor question library ───────────────────────────────────
const INSIGHT_CATEGORIES = [
  {
    id: "patterns",
    label: "Repair Patterns",
    icon: TrendingUp,
    color: COLORS.primary,
    questions: [
      "What are the most common repairs across all vehicles?",
      "Which repair jobs have the strongest association rules — what's always done together?",
      "What is the average mileage when vehicles come in for service?",
      "Which vehicle clusters have the highest repair volume?",
    ],
  },
  {
    id: "upsell",
    label: "Upsell & Bundling",
    icon: Package,
    color: COLORS.accent,
    questions: [
      "Show me oil change associations — what else gets done at the same visit?",
      "What parts have the highest affinity — frequently bought together?",
      "What should I recommend alongside a brake job?",
      "What are the best bundling opportunities for tire services?",
    ],
  },
  {
    id: "makes",
    label: "By Vehicle",
    icon: Wrench,
    color: "#8B5CF6",
    questions: [
      "What are the top repairs for Toyota vehicles?",
      "What are the top repairs for Honda vehicles?",
      "What are the top repairs for Ford vehicles?",
      "What are common issues with Jeep vehicles in our data?",
    ],
  },
  {
    id: "shop",
    label: "Shop Performance",
    icon: MapPin,
    color: "#0EA5E9",
    questions: [
      "Which shop location has the most repair orders?",
      "What are the most expensive parts used across all ROs?",
      "How does repair volume compare across our locations?",
      "Which locations have the highest average mileage at check-in?",
    ],
  },
];

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Answer formatter — renders LLM markdown for advisors ──────
function FormattedAnswer({ text }) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H1/H2 headings
    if (line.startsWith("# ")) {
      elements.push(
        <div key={i} style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary, marginTop: elements.length ? 16 : 0, marginBottom: 6 }}>
          {line.slice(2)}
        </div>
      );
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      const headText = line.replace(/^#{2,3}\s+/, "");
      const isWhy = headText.toLowerCase().includes("why");
      const isAction = headText.toLowerCase().includes("advisor") || headText.toLowerCase().includes("action");
      elements.push(
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 7,
          fontSize: 11, fontWeight: 700,
          color: isWhy ? "#7C3AED" : isAction ? COLORS.accent : COLORS.textMuted,
          textTransform: "uppercase", letterSpacing: "0.05em",
          marginTop: 18, marginBottom: 6,
          paddingTop: elements.length ? 14 : 0,
          borderTop: elements.length ? `1px solid ${COLORS.borderLight}` : "none",
        }}>
          {isWhy && <span style={{ fontSize: 13 }}>🔍</span>}
          {isAction && <span style={{ fontSize: 13 }}>✅</span>}
          {headText}
        </div>
      );
    }
    // Numbered list
    else if (/^\d+\.\s/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      const content = line.replace(/^\d+\.\s+\*?\*?/, "").replace(/\*\*$/, "");
      elements.push(
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{num}</span>
          </div>
          <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.6, flex: 1 }}>
            <InlineFormatted text={content} />
          </div>
        </div>
      );
    }
    // Bullet list — detect if we're inside a "Why" section for evidence styling
    else if (line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.slice(2);
      // Look back to see if the last heading was "Why"
      const lastHeadingEl = [...elements].reverse().find(el => el?.props?.style?.textTransform === "uppercase");
      const inWhy = lastHeadingEl?.props?.children?.some?.(c => typeof c === "string" && c.toLowerCase().includes("why"));
      const inAction = lastHeadingEl?.props?.children?.some?.(c => typeof c === "string" && (c.toLowerCase().includes("advisor") || c.toLowerCase().includes("action")));
      elements.push(
        <div key={i} style={{
          display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 6,
          padding: inWhy ? "5px 10px" : inAction ? "5px 10px" : "0",
          background: inWhy ? "#7C3AED08" : inAction ? `${COLORS.accent}08` : "transparent",
          borderRadius: inWhy || inAction ? 6 : 0,
          borderLeft: inWhy ? "2px solid #7C3AED40" : inAction ? `2px solid ${COLORS.accent}40` : "none",
        }}>
          <div style={{ width: 5, height: 5, borderRadius: 3, background: inWhy ? "#7C3AED" : inAction ? COLORS.accent : COLORS.primary, flexShrink: 0, marginTop: 7 }} />
          <div style={{ fontSize: 12, color: inWhy ? "#5B21B6" : COLORS.textSecondary, lineHeight: 1.6, flex: 1 }}>
            <InlineFormatted text={content} />
          </div>
        </div>
      );
    }
    // Follow-up question hint (ends with ?)
    else if (line.trim().startsWith(">") || (line.trim().endsWith("?") && line.length < 120 && i === lines.length - 1)) {
      const content = line.replace(/^>\s*/, "");
      elements.push(
        <div key={i} style={{ marginTop: 12, padding: "8px 12px", background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}20`, borderRadius: 8, fontSize: 12, color: COLORS.primary, fontStyle: "italic" }}>
          {content}
        </div>
      );
    }
    // Horizontal rule
    else if (line.trim() === "---") {
      elements.push(<div key={i} style={{ height: 1, background: COLORS.borderLight, margin: "12px 0" }} />);
    }
    // Empty line — spacer
    else if (line.trim() === "") {
      if (elements.length > 0) {
        elements.push(<div key={i} style={{ height: 4 }} />);
      }
    }
    // Normal paragraph
    else {
      elements.push(
        <div key={i} style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.7, marginBottom: 4 }}>
          <InlineFormatted text={line} />
        </div>
      );
    }
    i++;
  }

  return <div>{elements}</div>;
}

// Inline formatting: **bold**, percentages/numbers highlighted
function InlineFormatted({ text }) {
  // Split by **bold** patterns and highlight numbers
  const parts = [];
  let remaining = text;
  let key = 0;

  // Process **bold** spans
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(remaining)) !== null) {
    // Text before bold
    if (match.index > lastIndex) {
      parts.push(<NumHighlight key={key++} text={remaining.slice(lastIndex, match.index)} />);
    }
    // Bold content
    parts.push(
      <strong key={key++} style={{ color: COLORS.textPrimary, fontWeight: 700 }}>
        <NumHighlight text={match[1]} />
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < remaining.length) {
    parts.push(<NumHighlight key={key++} text={remaining.slice(lastIndex)} />);
  }

  return <>{parts}</>;
}

// Highlight standalone numbers / percentages with a soft chip
function NumHighlight({ text }) {
  const parts = text.split(/(\b\d+(?:\.\d+)?%|\b\d{2,}(?:,\d{3})*\b)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^(\d+(?:\.\d+)?%|\d{2,}(?:,\d{3})*)$/.test(p)) {
          return (
            <span key={i} style={{ display: "inline-block", background: `${COLORS.accent}15`, color: COLORS.accent, borderRadius: 4, padding: "0 4px", fontWeight: 700, fontSize: "0.95em" }}>
              {p}
            </span>
          );
        }
        return p;
      })}
    </>
  );
}

// ── AI Insights Tab ───────────────────────────────────────────
function AIInsightsTab() {
  const [activeCategory, setActiveCategory] = useState("patterns");
  const [messages, setMessages]     = useState([]);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loading, setLoading]       = useState(false);
  const [customInput, setCustomInput] = useState("");
  const answerRef = useRef(null);

  useEffect(() => {
    if (messages.length > 0) {
      answerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [messages]);

  const ask = async (question) => {
    if (loading) return;
    setActiveQuestion(question);
    setLoading(true);
    setMessages([]);
    setCustomInput("");
    try {
      const res = await fetch(`${API_BASE}/api/knowledge-graph/ask`, {
        method:  "POST",
        headers: { "content-type": "application/json" },
        body:    JSON.stringify({ question, history: [] }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `API ${res.status}`);
      setMessages([{ question, answer: data.answer, data_used: data.data_used || [] }]);
    } catch (e) {
      setMessages([{ question, answer: `Error: ${e.message}`, data_used: [] }]);
    } finally {
      setLoading(false);
    }
  };

  const cat = INSIGHT_CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div style={{ display: "flex", gap: 24, maxWidth: 1080, alignItems: "flex-start" }}>

      {/* ── Left: question browser ─────────────────────────────── */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>AI Insights</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Questions answered from your live repair order data.</div>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 18 }}>
          {INSIGHT_CATEGORIES.map(c => {
            const active = activeCategory === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 9, width: "100%",
                  padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer",
                  background: active ? `${c.color}12` : "transparent",
                  color: active ? c.color : COLORS.textSecondary,
                  fontSize: 12, fontWeight: active ? 700 : 500, textAlign: "left",
                  transition: "background 0.12s",
                }}
              >
                <c.icon size={13} />
                {c.label}
                {active && <ChevronRight size={12} style={{ marginLeft: "auto" }} />}
              </button>
            );
          })}
        </div>

        {/* Questions for active category */}
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.06em", marginBottom: 8 }}>
          {cat?.label.toUpperCase()}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {cat?.questions.map((q, i) => {
            const isActive = activeQuestion === q && messages.length > 0;
            return (
              <button key={i} onClick={() => ask(q)}
                style={{
                  textAlign: "left", padding: "9px 12px", borderRadius: 8,
                  border: `1px solid ${isActive ? cat.color : COLORS.border}`,
                  background: isActive ? `${cat.color}08` : "#fff",
                  fontSize: 12, color: isActive ? cat.color : COLORS.textSecondary,
                  cursor: "pointer", lineHeight: 1.5, fontWeight: isActive ? 600 : 400,
                  transition: "all 0.12s",
                }}
              >
                {q}
              </button>
            );
          })}
        </div>

        {/* Custom question input */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${COLORS.borderLight}` }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.06em", marginBottom: 8 }}>ASK YOUR OWN</div>
          <div style={{ position: "relative" }}>
            <textarea
              value={customInput}
              onChange={e => setCustomInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (customInput.trim()) ask(customInput.trim()); } }}
              placeholder="Ask anything about your data…"
              rows={3}
              style={{
                width: "100%", resize: "none", fontSize: 12, padding: "8px 10px",
                borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff",
                color: COLORS.textPrimary, fontFamily: "inherit", lineHeight: 1.5,
                outline: "none", boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => { if (customInput.trim()) ask(customInput.trim()); }}
              disabled={!customInput.trim() || loading}
              style={{
                position: "absolute", bottom: 7, right: 7, width: 26, height: 26,
                borderRadius: 6, border: "none", background: customInput.trim() ? COLORS.primary : COLORS.border,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: customInput.trim() ? "pointer" : "default",
              }}
            >
              <Send size={11} color="#fff" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: answer panel ────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Empty state */}
        {!loading && messages.length === 0 && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 40, textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}25`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Sparkles size={22} color={COLORS.primary} />
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 6 }}>Select a question to get started</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, maxWidth: 360, margin: "0 auto", lineHeight: 1.6 }}>
              Insights are generated from your actual repair orders and cluster patterns — not generic AI responses.
            </div>
            <div style={{ marginTop: 20, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
              {INSIGHT_CATEGORIES.map(c => (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20, background: `${c.color}10`, border: `1px solid ${c.color}25`, fontSize: 11, color: c.color }}>
                  <c.icon size={10} />
                  {c.label}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>QUESTION</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 24, lineHeight: 1.5 }}>{activeQuestion}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: COLORS.textMuted, fontSize: 13 }}>
              <div style={{ width: 16, height: 16, border: `2px solid ${COLORS.border}`, borderTopColor: COLORS.primary, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              Querying knowledge graph and generating insight…
            </div>
          </div>
        )}

        {/* Answer */}
        {!loading && messages.length > 0 && messages.map((msg, i) => (
          <div key={i} ref={answerRef} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>

            {/* Question header */}
            <div style={{ padding: "16px 22px", background: `${COLORS.primary}06`, borderBottom: `1px solid ${COLORS.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Sparkles size={12} color={COLORS.primary} />
                <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>AI Insight</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.5 }}>{msg.question}</div>
            </div>

            {/* Answer body */}
            <div style={{ padding: "22px 22px 16px" }}>
              <FormattedAnswer text={msg.answer} />
            </div>

            {/* Footer: data sources + re-ask */}
            <div style={{ padding: "12px 22px", borderTop: `1px solid ${COLORS.borderLight}`, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <Database size={11} color={COLORS.textMuted} />
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>Sources:</span>
              {msg.data_used.map((src, si) => (
                <span key={si} style={{ fontSize: 10, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, padding: "2px 7px" }}>
                  {src}
                </span>
              ))}
              <button
                onClick={() => ask(msg.question)}
                style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: "transparent", fontSize: 11, color: COLORS.textSecondary, cursor: "pointer" }}
              >
                <RotateCcw size={10} />
                Refresh
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Demo audit data ───────────────────────────────────────────
const AUDIT_ENTRIES = [
  { action: "Predii API key rotated",                user: "Tilak K.",     time: "March 24  9:02 AM",  detail: "" },
  { action: "Integration connected — Meta Business", user: "Marcus J.",    time: "March 21  3:17 PM",  detail: "" },
  { action: "Team member added — Priya Nair",        user: "Tilak K.",     time: "March 18  11:30 AM", detail: "" },
  { action: "AI settings updated — tone: friendly",  user: "Marcus J.",    time: "March 15  2:05 PM",  detail: "" },
  { action: "Twilio SMS limit increased to 5,000",   user: "Tilak K.",     time: "March 10  8:44 AM",  detail: "" },
  { action: "Shop profile updated — labor rate $195",user: "Tilak K.",     time: "March 1   9:00 AM",  detail: "" },
];

// ── Predii API endpoints ──────────────────────────────────────
const PREDII_APIS = [
  { endpoint: "POST /v1/intake/contextualize",  purpose: "VIN + complaint → pre-filled RO",               status: "live" },
  { endpoint: "POST /v1/ro/generate-narrative", purpose: "RO data → 3C narrative (AM format)",             status: "live" },
  { endpoint: "GET  /v1/tsb/match",             purpose: "VIN + DTCs → ranked TSB list",                  status: "live" },
  { endpoint: "POST /v1/health/predict",        purpose: "Vehicle history → health score + predictions",   status: "live" },
  { endpoint: "GET  /v1/labor/estimate",        purpose: "VIN + op code → labor time range",              status: "live" },
  { endpoint: "POST /v1/parts/recommend",       purpose: "VIN + diagnosis → parts options with quality",  status: "live" },
  { endpoint: "GET  /v1/recall/active",         purpose: "VIN → active recalls",                          status: "live" },
  { endpoint: "POST /v1/feedback/outcome",      purpose: "Closed RO → nightly feedback to engine",        status: "live" },
];

// ── Helpers ───────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// ── Architecture Tab ──────────────────────────────────────────
function ArchitectureTab() {
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          WrenchIQ + Predii Architecture
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
          Two distinct technology layers with a clean API boundary. WrenchIQ is the application platform; Predii is the intelligence engine.
        </div>
      </div>

      {/* Layer diagram */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 28 }}>

        {/* WrenchIQ Layer */}
        <Card style={{ borderColor: COLORS.accent, borderWidth: 2, borderRadius: "10px 10px 0 0", background: `${COLORS.accent}08` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>WrenchIQ Application Layer</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Shop workflows · Customer UX · Scheduling · Billing · Multi-location ops</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 5, padding: "3px 8px" }}>AM</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              "Social Inbox", "Smart Scheduling", "DVI / Health Report", "Repair Orders",
              "Parts Intelligence", "Trust Engine", "Customer Portal", "Multi-Location Hub",
            ].map(m => (
              <div key={m} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: COLORS.textSecondary, textAlign: "center" }}>
                {m}
              </div>
            ))}
          </div>
        </Card>

        {/* API boundary arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", border: `1px solid ${COLORS.border}`, borderTop: "none", borderBottom: "none", padding: "10px 20px", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "5px 14px" }}>
            <Lock size={11} color={COLORS.textMuted} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>REST API · OAuth 2.0 · versioned · edition-aware</span>
            <ArrowDown size={11} color={COLORS.textMuted} />
          </div>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Predii Layer */}
        <Card style={{ borderColor: COLORS.primary, borderWidth: 2, borderRadius: "0 0 10px 10px", background: `${COLORS.primary}06` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Predii Core Intelligence Layer</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Contextual Engine · RO Story Writer · Repair Knowledge Graph · Health Prediction</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e", boxShadow: "0 0 6px #22c55e88" }} />
              <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600 }}>Connected</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              "Contextual Engine", "RO Story Writer", "Knowledge Graph", "TSB/DTC Matching",
              "Health Prediction", "Labor Estimator", "Parts Recommender", "Outcome Feedback",
            ].map(m => (
              <div key={m} style={{ background: `${COLORS.primary}0d`, border: `1px solid ${COLORS.primary}25`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: COLORS.primary, textAlign: "center" }}>
                {m}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Separation principles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <Card>
          <SectionLabel>WrenchIQ Owns</SectionLabel>
          {["Shop workflows & customer UX", "Scheduling, billing, notifications", "Third-party integration hub", "Multi-location ops", "LLM: advisor copilot & comms drafts"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={COLORS.accent} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{item}</span>
            </div>
          ))}
        </Card>
        <Card>
          <SectionLabel>Predii Owns</SectionLabel>
          {["Repair intelligence & pattern matching", "Historical knowledge graph (10M+ ROs)", "Contextual RO intake engine", "Vehicle health prediction models", "RO narrative generation (AM format)"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={COLORS.primary} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{item}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Predii API surface */}
      <Card>
        <SectionLabel>Predii API Surface</SectionLabel>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 }}>
          All Predii intelligence is consumed via versioned REST APIs. WrenchIQ is a first-party API consumer — same as any enterprise partner.
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: "42%" }}>Endpoint</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Purpose</th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: 70 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {PREDII_APIS.map((api, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: COLORS.primary, background: `${COLORS.primary}04` }}>
                  {api.endpoint}
                </td>
                <td style={{ padding: "9px 12px", color: COLORS.textSecondary }}>{api.purpose}</td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", color: "#15803D", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: "#22c55e" }} />
                    Live
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, display: "flex", gap: 20, fontSize: 11, color: COLORS.textMuted }}>
          <span>Protocol: REST / HTTPS</span>
          <span>Auth: OAuth 2.0 client_credentials</span>
          <span>SLA: P95 &lt; 500ms</span>
          <span>Edition: <code style={{ background: COLORS.borderLight, padding: "1px 5px", borderRadius: 3 }}>edition=AM</code></span>
        </div>
      </Card>

      {/* Integration flow */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <SectionLabel>Integration Data Flow</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
            {[
              { label: "3rd-Party Systems", sub: "Twilio · Meta · Stripe · NHTSA · ALLDATA", color: "#64748b", bg: "#F1F5F9" },
              null,
              { label: "WrenchIQ Integration Layer", sub: "Normalizes all data before passing to Predii", color: COLORS.accent, bg: `${COLORS.accent}10` },
              null,
              { label: "Predii APIs", sub: "Stateless · WrenchIQ owns all shop state", color: COLORS.primary, bg: `${COLORS.primary}0d` },
            ].map((item, i) => item === null ? (
              <div key={i} style={{ padding: "0 6px", flexShrink: 0 }}>
                <ArrowRight size={16} color={COLORS.textMuted} />
              </div>
            ) : (
              <div key={i} style={{ flex: 1, background: item.bg, border: `1px solid ${item.color}30`, borderRadius: 8, padding: "12px 16px", minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} /> Predii API keys are server-only — never exposed to browser or mobile</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Activity size={10} /> Failed Predii calls degrade gracefully — shop workflow never blocked</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────
function TeamTab() {
  const allMembers = [
    ...advisors.map(a => ({ ...a, role: "Service Advisor" })),
    ...technicians.map(t => ({ ...t, role: "Technician" })),
  ];
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Team Members</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{SHOP.name} · {allMembers.length} members</div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Invite Member
        </button>
      </div>
      <Card style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>NAME</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>ROLE</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                      {m.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: COLORS.textSecondary }}>{m.role}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#15803D", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: "#22c55e" }} />
                    Active
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────
function AuditTab() {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Audit Log</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>All admin actions · 90-day retention</div>
      </div>
      <Card style={{ padding: 0 }}>
        {AUDIT_ENTRIES.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < AUDIT_ENTRIES.length - 1 ? `1px solid ${COLORS.borderLight}` : "none" }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: COLORS.accent, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{e.action}</div>
              {e.detail && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{e.detail}</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{e.user}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{e.time}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────
function SystemTab() {
  const { brand, setBrand } = useBranding();
  const isPredii = brand === "PrediiPowered";
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>System</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Edition config, API credentials, Predii connection</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Brand */}
        <Card>
          <SectionLabel>Branding</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 2 }}>
                PrediiPowered mode
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
                {isPredii
                  ? "Showing Predii branding — logo, wordmark, and footer reflect the Predii identity."
                  : "Showing WrenchIQ branding. Enable to switch to PrediiPowered identity."}
              </div>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", flexShrink: 0, marginLeft: 24 }}>
              <div
                onClick={() => setBrand(isPredii ? "WrenchIQ" : "PrediiPowered")}
                style={{
                  width: 40, height: 22, borderRadius: 11,
                  background: isPredii ? COLORS.primary : COLORS.border,
                  position: "relative", cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", top: 3, left: isPredii ? 21 : 3,
                  width: 16, height: 16, borderRadius: 8, background: "#fff",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                  transition: "left 0.2s",
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: isPredii ? COLORS.primary : COLORS.textMuted }}>
                {isPredii ? "On" : "Off"}
              </span>
            </label>
          </div>
        </Card>

        {/* Edition */}
        <Card>
          <SectionLabel>Product Edition</SectionLabel>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, border: `2px solid ${COLORS.accent}`, borderRadius: 8, padding: 14, background: `${COLORS.accent}08` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle size={14} color={COLORS.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>{amName}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Aftermarket · Independent shops & corporate groups · Full SMS platform</div>
            </div>
            <div style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, opacity: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${COLORS.border}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>{oemName}</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>OEM Dealerships · RO Story Writer only · DMS integrations</div>
            </div>
          </div>
        </Card>

        {/* Predii connection */}
        <Card>
          <SectionLabel>Predii Core Connection</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e", boxShadow: "0 0 8px #22c55e88" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Connected — All 8 APIs healthy</div>
              <div style={{ fontSize: 11, color: "#16a34a" }}>Last sync: today 8:14 AM · P95 latency: 312ms</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "API Base URL", value: "https://api.predii.com/v1", mono: true },
              { label: "Edition", value: "AM", mono: true },
              { label: "Auth", value: "OAuth 2.0 client_credentials", mono: false },
              { label: "Key rotation", value: "90 days · Next: May 2026", mono: false },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>{f.label}</div>
                <div style={{ background: COLORS.borderLight, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, fontFamily: f.mono ? "monospace" : "inherit", color: COLORS.textPrimary }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
          <button style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Key size={13} /> Rotate API Key
          </button>
        </Card>

        {/* Cloud infra */}
        <Card>
          <SectionLabel>Cloud Infrastructure</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Platform", value: "AWS · us-east-1" },
              { label: "Database", value: "PostgreSQL RDS Multi-AZ" },
              { label: "Cache", value: "Redis ElastiCache" },
              { label: "Media", value: "S3 · CloudFront CDN" },
              { label: "Realtime", value: "WebSocket · EventBridge" },
              { label: "Build", value: "React + Vite · ECS/Fargate" },
            ].map(f => (
              <div key={f.label} style={{ background: "#F8FAFC", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{f.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AMAdminScreen() {
  const amName  = useEditionName("AM");
  const oemName = useEditionName("OEM");
  const [tab, setTab] = useState("insights");

  return (
    <div style={{ display: "flex", height: "100%", background: COLORS.bg }}>

      {/* Left sidebar */}
      <div style={{ width: 200, background: "#fff", borderRight: `1px solid ${COLORS.border}`, padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Admin</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>{amName}</div>
        </div>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 16px", border: "none", cursor: "pointer",
                background: active ? `${COLORS.accent}12` : "transparent",
                color: active ? COLORS.accent : COLORS.textSecondary,
                borderRight: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                fontSize: 13, fontWeight: active ? 600 : 400,
                textAlign: "left",
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {tab === "insights"     && <AIInsightsTab />}
        {tab === "architecture" && <ArchitectureTab />}
        {tab === "api"          && <IntegrationsScreen embedded />}
        {tab === "team"         && <TeamTab />}
        {tab === "audit"        && <AuditTab />}
        {tab === "system"       && <SystemTab />}
      </div>
    </div>
  );
}
