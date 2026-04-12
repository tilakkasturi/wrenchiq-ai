/**
 * WrenchIQ — AI Agent Screen (Service Advisor Copilot)
 *
 * Autonomous KG-powered agent that:
 *  - Auto-briefs the advisor on load (no click needed)
 *  - Runs a full conversational thread with history
 *  - Shows step-by-step thinking + elapsed time
 *  - Surfaces structured advisor answers from the Knowledge Graph
 */

import { useState, useEffect, useRef } from "react";
import { Brain, Send, Zap, RotateCcw, Database, Sparkles } from "lucide-react";
import { COLORS } from "../theme/colors";
import AIInsightsStrip from "../components/AIInsightsStrip";

const API_BASE = import.meta.env.VITE_API_BASE || "";

const INITIAL_BRIEF =
  "As a service advisor starting my day, briefly tell me the most important repair patterns, upsell opportunities, and anything unusual in the recent repair history I should know about. Be specific with numbers and actionable.";

const QUICK_ACTIONS = [
  { label: "Today's trends",      q: "What repair patterns are trending and what should I watch for today?" },
  { label: "Bundle opportunities", q: "What are the best upsell and bundling opportunities I should pitch to customers?" },
  { label: "By make",             q: "Which vehicle makes are coming in most and what do they typically need?" },
  { label: "Brake insights",      q: "What should I know about brake jobs — what else comes up at the same visit?" },
  { label: "Top revenue jobs",    q: "What are the highest value repair jobs and which customers tend to need them?" },
  { label: "Oil change upsells",  q: "When a customer comes in for an oil change, what should I recommend alongside it?" },
];

const LOADING_STEPS = [
  "Connecting to knowledge graph…",
  "Analyzing repair clusters…",
  "Scanning vehicle patterns…",
  "Generating insights…",
  "Formatting your briefing…",
];

// ── Answer parser + renderer ────────────────────────────────────────────────

function parseAnswer(text) {
  const sections = [];
  let type = null;
  let lines = [];
  const flush = () => { if (type) { sections.push({ type, lines }); lines = []; } };
  for (const raw of text.split("\n")) {
    const line = raw.trimEnd();
    if (line.startsWith("**Bottom Line:**"))        { flush(); type = "headline"; lines = [line.replace("**Bottom Line:**", "").trim()]; }
    else if (line.startsWith("**What the data shows:**")) { flush(); type = "findings"; lines = []; }
    else if (line.startsWith("**Why this answer:**"))     { flush(); type = "evidence"; lines = []; }
    else if (line.startsWith("**At the counter:**"))      { flush(); type = "action";   lines = []; }
    else if (type && line.trim()) lines.push(line);
  }
  flush();
  return sections;
}

function AgentAnswer({ text }) {
  const sections = parseAnswer(text);
  if (!sections.length) {
    return <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{text}</div>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {sections.map((sec, i) => <AnswerSection key={i} sec={sec} />)}
    </div>
  );
}

function AnswerSection({ sec }) {
  if (sec.type === "headline") {
    return (
      <div style={{ background: `${COLORS.primary}08`, border: `1.5px solid ${COLORS.primary}22`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Bottom Line</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary, lineHeight: 1.6 }}>{sec.lines.join(" ")}</div>
      </div>
    );
  }
  if (sec.type === "findings") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>What the data shows</div>
        {sec.lines.map((line, i) => {
          const num = line.match(/^(\d+)\.\s+/)?.[1];
          const content = num ? line.replace(/^\d+\.\s+/, "") : line.replace(/^[-*]\s+/, "");
          return (
            <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              {num ? (
                <div style={{ width: 20, height: 20, borderRadius: 5, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{num}</span>
                </div>
              ) : (
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: COLORS.primary, flexShrink: 0, marginTop: 7 }} />
              )}
              <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.65 }}>{content}</div>
            </div>
          );
        })}
      </div>
    );
  }
  if (sec.type === "evidence") {
    return (
      <div style={{ background: "#F5F3FF", border: "1px solid #DDD6FE", borderRadius: 9, padding: "10px 14px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#7C3AED", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Why this answer</div>
        {sec.lines.map((line, i) => (
          <div key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 4 }}>
            <Database size={10} color="#7C3AED" style={{ flexShrink: 0, marginTop: 3 }} />
            <div style={{ fontSize: 11, color: "#5B21B6", lineHeight: 1.55 }}>{line.replace(/^[-*]\s+/, "")}</div>
          </div>
        ))}
      </div>
    );
  }
  if (sec.type === "action") {
    return (
      <div style={{ background: `${COLORS.accent}08`, border: `1.5px solid ${COLORS.accent}28`, borderRadius: 10, padding: "12px 16px" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.accent, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>At the counter</div>
        <div style={{ fontSize: 13, color: COLORS.textPrimary, lineHeight: 1.7, fontStyle: "italic" }}>
          {sec.lines.join(" ").replace(/^[-*>]\s+/, "")}
        </div>
      </div>
    );
  }
  return null;
}

// ── Agent badge ────────────────────────────────────────────────────────────

function AgentBadge() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${COLORS.primary}10`, border: `1px solid ${COLORS.primary}20`, borderRadius: 6, padding: "3px 9px" }}>
      <Brain size={10} color={COLORS.primary} />
      <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.primary }}>WrenchIQ AI</span>
    </div>
  );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function AIAgentScreen() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadStep, setLoadStep] = useState(0);
  const [elapsed, setElapsed]   = useState(0);
  const [input, setInput]       = useState("");
  const [roCount, setRoCount]   = useState(null);

  const threadEndRef = useRef(null);
  const elapsedRef   = useRef(null);
  const didBrief     = useRef(false);

  // Fetch RO count for the header
  useEffect(() => {
    fetch(`${API_BASE}/api/knowledge-graph/clusters?limit=1`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.total_ros) setRoCount(d.total_ros); })
      .catch(() => {});
  }, []);

  // Auto-brief on mount
  useEffect(() => {
    if (didBrief.current) return;
    didBrief.current = true;
    sendToAgent(INITIAL_BRIEF, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendToAgent(question, isAuto = false) {
    if (loading) return;

    const history = messages
      .filter(m => !m.auto)
      .slice(-8)
      .map(m => ({ role: m.role === "agent" ? "assistant" : "user", content: m.content }));

    setMessages(prev => [...prev, { role: "user", content: question, auto: isAuto }]);
    setLoading(true);
    setElapsed(0);
    setLoadStep(0);
    setInput("");

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
        body: JSON.stringify({ question, history }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setMessages(prev => [...prev, {
        role: "agent",
        content: data.answer,
        dataSources: data.data_used || [],
        elapsed: secs,
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "agent", content: null, error: e.message }]);
    } finally {
      clearInterval(elapsedRef.current);
      setLoading(false);
    }
  }

  function handleSubmit() {
    const q = input.trim();
    if (!q || loading) return;
    sendToAgent(q);
  }

  const showQuickActions = messages.length <= 2 && !loading;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#F8FAFC", fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
      <AIInsightsStrip insights={[
        { icon: "🤖", text: "AI wrote 3 RO narratives this morning — $4,280 in labor documented, 0 sent back for edits", value: "$4,280 written", color: "#22C55E" },
        { icon: "⚡", text: "David Kim RO: AI flagged P0420 with TSB match — pending advisor sign-off", action: "Review RO", value: "Flagged", color: "#F59E0B" },
        { icon: "💬", text: "4 upsell opportunities in today's queue totaling $920 — 1-tap to add to estimates", action: "Review Opps", value: "+$920", color: "#FF6B35" },
        { icon: "📊", text: "Knowledge Graph queried 14 times today — avg response 1.2s", value: "14 queries", color: "#3B82F6" },
      ]} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div style={{ background: COLORS.primary, padding: "13px 22px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff" }}>WrenchIQ AI Agent</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
              Service Advisor Copilot · Knowledge Graph
              {roCount ? ` · ${roCount.toLocaleString()} ROs` : ""}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "5px 12px" }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
          <span style={{ fontSize: 11, color: "#86EFAC", fontWeight: 600 }}>Live</span>
        </div>
      </div>

      {/* ── Thread ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 22 }}>

        {messages.map((msg, i) => {

          // User bubble (skip auto-brief)
          if (msg.role === "user" && !msg.auto) {
            return (
              <div key={i} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ maxWidth: "72%", background: COLORS.primary, borderRadius: "12px 12px 2px 12px", padding: "10px 14px", fontSize: 13, color: "#fff", lineHeight: 1.5 }}>
                  {msg.content}
                </div>
              </div>
            );
          }

          // Agent answer
          if (msg.role === "agent") {
            // Error state
            if (msg.error) {
              return (
                <div key={i} style={{ maxWidth: 680 }}>
                  <AgentBadge />
                  <div style={{ marginTop: 8, background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#DC2626", marginBottom: 6 }}>Could not get a response</div>
                    <div style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.6, marginBottom: 12 }}>{msg.error}</div>
                    <button
                      onClick={() => {
                        const prev = messages.slice(0, i).filter(m => m.role === "user").pop();
                        if (prev) sendToAgent(prev.content, prev.auto);
                      }}
                      style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, color: "#DC2626", background: "#fff", border: "1px solid #FECACA", borderRadius: 6, padding: "5px 12px", cursor: "pointer" }}>
                      <RotateCcw size={10} /> Retry
                    </button>
                  </div>
                </div>
              );
            }

            // Normal answer
            return (
              <div key={i} style={{ maxWidth: 720 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <AgentBadge />
                  {msg.elapsed > 0 && (
                    <span style={{ fontSize: 10, color: COLORS.textMuted }}>{msg.elapsed}s</span>
                  )}
                  {i === 1 && (
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontStyle: "italic" }}>Daily briefing</span>
                  )}
                </div>
                <div style={{ background: "#fff", borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: "18px 22px" }}>
                  <AgentAnswer text={msg.content} />
                </div>
                {msg.dataSources?.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 7, flexWrap: "wrap" }}>
                    <Database size={9} color={COLORS.textMuted} />
                    {msg.dataSources.slice(0, 3).map((s, j) => (
                      <span key={j} style={{ fontSize: 9, color: COLORS.textMuted, background: "#fff", border: `1px solid ${COLORS.borderLight}`, borderRadius: 4, padding: "2px 6px" }}>{s}</span>
                    ))}
                    <button
                      onClick={() => sendToAgent(messages[i - 1]?.content || INITIAL_BRIEF)}
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: COLORS.textSecondary, background: "transparent", border: `1px solid ${COLORS.borderLight}`, borderRadius: 5, padding: "2px 8px", cursor: "pointer" }}>
                      <RotateCcw size={9} /> Refresh
                    </button>
                  </div>
                )}
              </div>
            );
          }

          return null;
        })}

        {/* Loading bubble */}
        {loading && (
          <div style={{ maxWidth: 680 }}>
            <AgentBadge />
            <div style={{ marginTop: 8, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[0, 0.2, 0.4].map(d => (
                      <div key={d} style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.primary, animation: `agentBounce 0.9s ease infinite ${d}s` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: COLORS.textSecondary, fontWeight: 500 }}>
                    {LOADING_STEPS[loadStep]}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: COLORS.textMuted, fontVariantNumeric: "tabular-nums" }}>{elapsed}s</span>
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
                {LOADING_STEPS.map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, background: i <= loadStep ? COLORS.primary : COLORS.borderLight, transition: "background 0.3s" }} />
                ))}
              </div>
              {[100, 82, 91, 67].map((w, i) => (
                <div key={i} style={{ height: 11, borderRadius: 5, width: `${w}%`, marginBottom: 7, background: `linear-gradient(90deg,${COLORS.borderLight} 25%,#e5e7eb 50%,${COLORS.borderLight} 75%)`, backgroundSize: "200% 100%", animation: `agentShimmer 1.4s ease infinite ${i * 0.1}s` }} />
              ))}
            </div>
          </div>
        )}

        <div ref={threadEndRef} />
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────────── */}
      {showQuickActions && (
        <div style={{ padding: "10px 24px 0", borderTop: `1px solid ${COLORS.border}`, background: "#fff", flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>
            Quick questions
          </div>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap", paddingBottom: 12 }}>
            {QUICK_ACTIONS.map(a => (
              <button key={a.label} onClick={() => sendToAgent(a.q)}
                style={{ fontSize: 11, fontWeight: 500, padding: "5px 13px", borderRadius: 20, background: `${COLORS.primary}08`, border: `1px solid ${COLORS.primary}22`, color: COLORS.primary, cursor: "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
                <Zap size={9} color={COLORS.accent} />
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input ────────────────────────────────────────────────────────────── */}
      <div style={{ padding: "12px 20px 14px", borderTop: `1px solid ${COLORS.border}`, background: "#fff", flexShrink: 0, display: "flex", gap: 10, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Ask anything about your repair data…"
          rows={2}
          disabled={loading}
          style={{ flex: 1, resize: "none", fontSize: 13, padding: "9px 13px", borderRadius: 10, border: `1px solid ${COLORS.border}`, background: "#F9FAFB", color: COLORS.textPrimary, fontFamily: "inherit", lineHeight: 1.5, outline: "none", boxSizing: "border-box", opacity: loading ? 0.6 : 1 }}
        />
        <button
          onClick={handleSubmit}
          disabled={!input.trim() || loading}
          style={{ width: 42, height: 42, borderRadius: 10, border: "none", background: input.trim() && !loading ? COLORS.primary : COLORS.border, display: "flex", alignItems: "center", justifyContent: "center", cursor: input.trim() && !loading ? "pointer" : "default", flexShrink: 0, transition: "background 0.15s" }}>
          <Send size={16} color="#fff" />
        </button>
      </div>

      <style>{`
        @keyframes agentBounce  { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
        @keyframes agentShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>
    </div>
  );
}
