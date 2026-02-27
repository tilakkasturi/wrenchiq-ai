import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Send, TrendingUp, AlertTriangle, CheckCircle,
  Clock, DollarSign, MessageCircle, ChevronDown, ChevronUp,
  Zap, Target, BarChart2, User, Car,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { repairOrders, customers, vehicles, getCustomer, getVehicle } from "../data/demoData";

// ── Per-screen agent content ───────────────────────────────

const SCREEN_CONTEXT = {
  dashboard: {
    label: "Watching: Shop Overview",
    customerFocus: null,
    suggestions: [
      { type: "revenue", icon: "💰", text: "David's estimate pending 2h 15m — send a nudge text", action: "Text David", value: "+$2,190", color: COLORS.warning },
      { type: "upsell", icon: "🔧", text: "Angela's Outback hasn't been in since May — head gasket check is overdue", action: "Schedule", value: "+$165", color: COLORS.accent },
      { type: "alert", icon: "🔴", text: "Bay 3 idle 40 min — move Tom's Tucson forward to fill the gap", action: "Reschedule", value: "Free bay", color: COLORS.danger },
      { type: "upsell", icon: "📊", text: "Today's RO total $6,842 — need $658 more to hit daily target", action: "View ROs", value: "$658 gap", color: "#7C3AED" },
    ],
  },
  orders: {
    label: "Watching: Repair Orders",
    customerFocus: null,
    suggestions: [
      { type: "upsell", icon: "🔧", text: "Monica hasn't approved cabin filter ($81) — follow up before she leaves", action: "Text Monica", value: "+$81", color: COLORS.accent },
      { type: "alert", icon: "⚠️", text: "David's P0420 diagnostic — TSB-19-052 applies. Mention Honda goodwill claim.", action: "Add TSB note", value: "Save $450", color: COLORS.warning },
      { type: "revenue", icon: "💡", text: "Robert's F-150: add wiper blades to oil service — easy add-on at check-in", action: "Add to RO", value: "+$45", color: "#2563EB" },
      { type: "upsell", icon: "🔩", text: "James Park's BMW — brake fluid flush due at 64K, add to estimate", action: "Add service", value: "+$185", color: COLORS.accent },
    ],
  },
  customer: {
    label: "Watching: Customer Portal",
    customerFocus: {
      name: "Monica Rodriguez",
      vehicle: "2021 Toyota Camry SE",
      roId: "RO-2024-1187",
      status: "Awaiting approval on 3 items",
      statusColor: COLORS.warning,
    },
    suggestions: [
      { type: "alert", icon: "⏳", text: "Monica's approval pending 35 min — she's a busy founder, send a 1-tap approve link", action: "Send SMS", value: "+$294", color: COLORS.warning },
      { type: "upsell", icon: "💬", text: "She's never declined a recommendation (7 visits, 100% approval rate) — add tire rotation", action: "Add to portal", value: "+$95", color: COLORS.accent },
      { type: "revenue", icon: "📱", text: "Portal opened 3 times — customer is engaged, now is the right time to call", action: "Call Monica", value: "Close faster", color: "#2563EB" },
    ],
  },
  analytics: {
    label: "Watching: Analytics & Finance",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "📉", text: "Parts margin at 48.2% — below your 53% target. BMW X3 brake job used OEM at low markup.", action: "Review parts", value: "-$420 margin", color: COLORS.danger },
      { type: "revenue", icon: "💳", text: "Sarah Chen's $1,890 invoice is 14 days overdue — Xero shows no payment activity", action: "Send reminder", value: "$1,890 AR", color: COLORS.warning },
      { type: "upsell", icon: "🎯", text: "Mike Reeves efficiency dropped to 85% — assign him lighter jobs this PM", action: "Reassign", value: "Recover 1.2 hrs", color: "#7C3AED" },
      { type: "revenue", icon: "📊", text: "November on track for $178K but December has 3 fewer shop days — book ahead now", action: "View schedule", value: "Dec forecast", color: "#2563EB" },
    ],
  },
  settings: {
    label: "Watching: Integrations",
    customerFocus: null,
    suggestions: [
      { type: "ok", icon: "✅", text: "Xero sync is live — last synced 4 min ago. 3 new invoices posted.", action: "View Xero", value: "Synced", color: COLORS.success },
      { type: "ok", icon: "✅", text: "NHTSA VIN Decoder responding normally — 142ms avg. All 10 vehicles decoded.", action: null, value: "Active", color: COLORS.success },
      { type: "alert", icon: "💡", text: "Twilio SMS not configured — customers can't receive portal links via text", action: "Connect Twilio", value: "Setup needed", color: COLORS.warning },
      { type: "ok", icon: "✅", text: "eBay Motors connected — 3 parts orders this week. Saved $147 vs O'Reilly.", action: "View orders", value: "Saved $147", color: COLORS.success },
    ],
  },
};

// ── Live activity feed items ───────────────────────────────

const FEED_ITEMS = [
  { id: 1, icon: "✅", text: "Monica approved Air Filter + Serpentine Belt", meta: "2 min ago", value: "+$213", valueColor: COLORS.success },
  { id: 2, icon: "🔍", text: "NHTSA decoded David Kim's CR-V VIN — 2 recalls found", meta: "8 min ago", value: "2 recalls", valueColor: COLORS.danger },
  { id: 3, icon: "📦", text: "eBay Motors: Walker 16468 catalytic converter ordered", meta: "22 min ago", value: "Saved $44", valueColor: COLORS.success },
  { id: 4, icon: "🔴", text: "Bay 3 idle since 11:00 AM — James K. available", meta: "40 min ago", value: "Bay idle", valueColor: COLORS.warning },
  { id: 5, icon: "💰", text: "James Park approved brake service estimate", meta: "1 hr ago", value: "+$1,892", valueColor: COLORS.success },
  { id: 6, icon: "📱", text: "Tom Wallace opened portal 3× — viewed wiper blades item", meta: "1.5 hrs ago", value: "Engaged", valueColor: "#7C3AED" },
  { id: 7, icon: "🔄", text: "Xero synced — 2 new invoices posted for today's completions", meta: "2 hrs ago", value: "Synced", valueColor: COLORS.success },
];

// ── Revenue opportunities (always visible) ─────────────────

const REVENUE_OPPS = [
  { id: "opp-1", customer: "Monica R.", vehicle: "Camry", action: "Cabin filter approval", value: 81, status: "pending" },
  { id: "opp-2", customer: "Robert T.", vehicle: "F-150", action: "Add wiper blades", value: 45, status: "quick-add" },
  { id: "opp-3", customer: "Angela M.", vehicle: "Outback", action: "Schedule head gasket check", value: 165, status: "schedule" },
  { id: "opp-4", customer: "James P.", vehicle: "BMW X3", action: "Add brake fluid flush", value: 185, status: "add-to-estimate" },
  { id: "opp-5", customer: "David K.", vehicle: "CR-V", action: "Goodwill warranty claim", value: 450, status: "save" },
];

// ── Sub-components ─────────────────────────────────────────

function SuggestionCard({ item }) {
  const bgMap = {
    revenue: "#F0FDF4",
    upsell: "#FFF7ED",
    alert: "#FEF2F2",
    ok: "#F0FDF4",
  };
  const borderMap = {
    revenue: COLORS.success,
    upsell: COLORS.accent,
    alert: COLORS.danger,
    ok: COLORS.success,
  };

  return (
    <div style={{
      background: bgMap[item.type] || "#F9FAFB",
      borderRadius: 10,
      padding: "10px 11px",
      borderLeft: `3px solid ${borderMap[item.type] || "#E5E7EB"}`,
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: COLORS.textPrimary, lineHeight: 1.4, marginBottom: item.action ? 6 : 0 }}>
            <span style={{ marginRight: 4 }}>{item.icon}</span>
            {item.text}
          </div>
          {item.action && (
            <button style={{
              fontSize: 10, fontWeight: 700, color: item.color || COLORS.primary,
              background: "none", border: `1px solid ${item.color || COLORS.primary}`,
              borderRadius: 5, padding: "3px 8px", cursor: "pointer",
            }}>
              {item.action}
            </button>
          )}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 800, color: item.color || COLORS.textMuted,
          background: "#fff", borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap",
          border: `1px solid ${item.color || "#E5E7EB"}20`,
          flexShrink: 0,
        }}>
          {item.value}
        </div>
      </div>
    </div>
  );
}

function FeedItem({ item }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" }}>
      <span style={{ fontSize: 13, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: COLORS.textPrimary, lineHeight: 1.4 }}>{item.text}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 2 }}>
          <span style={{ fontSize: 9.5, color: COLORS.textMuted }}>{item.meta}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: item.valueColor || COLORS.textMuted }}>{item.value}</span>
        </div>
      </div>
    </div>
  );
}

function OppRow({ opp }) {
  const statusConfig = {
    pending: { label: "Pending", color: COLORS.warning, bg: "#FFFBEB" },
    "quick-add": { label: "Quick add", color: "#2563EB", bg: "#EFF6FF" },
    schedule: { label: "Schedule", color: COLORS.accent, bg: "#FFF7ED" },
    "add-to-estimate": { label: "Add to RO", color: "#7C3AED", bg: "#F5F3FF" },
    save: { label: "Save customer", color: COLORS.success, bg: "#F0FDF4" },
  };
  const cfg = statusConfig[opp.status] || statusConfig.pending;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid #F9FAFB" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>{opp.customer} · <span style={{ fontWeight: 400, color: COLORS.textSecondary }}>{opp.action}</span></div>
        <span style={{ fontSize: 9.5, color: cfg.color, background: cfg.bg, borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: opp.status === "save" ? COLORS.success : COLORS.accent, flexShrink: 0 }}>
        {opp.status === "save" ? `Save $${opp.value}` : `+$${opp.value}`}
      </div>
    </div>
  );
}

// ── Main agent component ───────────────────────────────────

export default function WrenchIQAgent({ activeScreen }) {
  const [feedExpanded, setFeedExpanded] = useState(true);
  const [oppsExpanded, setOppsExpanded] = useState(true);
  const [suggestionsExpanded, setSuggestionsExpanded] = useState(true);
  const [input, setInput] = useState("");
  const [typedInput, setTypedInput] = useState("");

  const ctx = SCREEN_CONTEXT[activeScreen] || SCREEN_CONTEXT.dashboard;

  const totalOppValue = REVENUE_OPPS.reduce((sum, o) => sum + o.value, 0);

  return (
    <div style={{
      width: 296,
      flexShrink: 0,
      borderLeft: "1px solid #E5E7EB",
      background: "#fff",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B3461 0%, #0D2A4A 100%)",
        padding: "14px 14px 12px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={15} color={COLORS.accent} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.2 }}>WrenchIQ Agent</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 0.5 }}>Revenue Intelligence</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,107,53,0.2)", color: COLORS.accent, borderRadius: 4, padding: "2px 6px", border: "1px solid rgba(255,107,53,0.3)" }}>Sonnet 4.6</span>
          </div>
        </div>

        {/* Context chip */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 8px" }}>
          <Zap size={10} color={COLORS.accent} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{ctx.label}</span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>

        {/* Customer focus card (context-specific) */}
        {ctx.customerFocus && (
          <div style={{ background: "#F0F9FF", borderRadius: 10, padding: "10px 11px", marginBottom: 10, border: "1.5px solid #BAE6FD" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>
                {ctx.customerFocus.name.split(" ").map(n => n[0]).join("")}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{ctx.customerFocus.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textSecondary }}>{ctx.customerFocus.vehicle}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: ctx.customerFocus.statusColor }} />
              <span style={{ fontSize: 10, color: ctx.customerFocus.statusColor, fontWeight: 600 }}>{ctx.customerFocus.status}</span>
            </div>
            <div style={{ fontSize: 9.5, color: COLORS.textMuted, fontFamily: "monospace" }}>{ctx.customerFocus.roId}</div>
          </div>
        )}

        {/* Suggestions for this screen */}
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setSuggestionsExpanded(!suggestionsExpanded)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "0 0 6px", cursor: "pointer" }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>
              AI Suggestions
            </span>
            {suggestionsExpanded ? <ChevronUp size={12} color={COLORS.textMuted} /> : <ChevronDown size={12} color={COLORS.textMuted} />}
          </button>
          {suggestionsExpanded && ctx.suggestions.map((item, i) => (
            <SuggestionCard key={i} item={item} />
          ))}
        </div>

        {/* Revenue opportunities */}
        <div style={{ marginBottom: 10 }}>
          <button
            onClick={() => setOppsExpanded(!oppsExpanded)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "0 0 6px", cursor: "pointer" }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>
              Revenue Pipeline
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.accent }}>${totalOppValue.toLocaleString()}</span>
              {oppsExpanded ? <ChevronUp size={12} color={COLORS.textMuted} /> : <ChevronDown size={12} color={COLORS.textMuted} />}
            </div>
          </button>
          {oppsExpanded && (
            <div style={{ background: "#FAFAFA", borderRadius: 10, padding: "4px 10px 2px", border: "1px solid #F3F4F6" }}>
              {REVENUE_OPPS.map((opp) => <OppRow key={opp.id} opp={opp} />)}
            </div>
          )}
        </div>

        {/* Live activity feed */}
        <div style={{ marginBottom: 4 }}>
          <button
            onClick={() => setFeedExpanded(!feedExpanded)}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", background: "none", border: "none", padding: "0 0 6px", cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Live Feed</span>
            </div>
            {feedExpanded ? <ChevronUp size={12} color={COLORS.textMuted} /> : <ChevronDown size={12} color={COLORS.textMuted} />}
          </button>
          {feedExpanded && (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {FEED_ITEMS.map((item) => <FeedItem key={item.id} item={item} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Ask Agent input ── */}
      <div style={{ borderTop: "1px solid #E5E7EB", padding: "10px 12px", flexShrink: 0, background: "#FAFAFA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "7px 10px" }}>
          <Sparkles size={12} color={COLORS.accent} style={{ flexShrink: 0 }} />
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            placeholder="Ask WrenchIQ anything…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 11, background: "transparent", color: COLORS.textPrimary }}
          />
          <button
            onClick={() => setTypedInput("")}
            style={{ background: typedInput ? COLORS.accent : "#E5E7EB", border: "none", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
          >
            <Send size={11} color="#fff" />
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 5 }}>
          <Sparkles size={8} color={COLORS.textMuted} />
          <span style={{ fontSize: 9, color: COLORS.textMuted }}>Powered by Claude Sonnet 4.6</span>
        </div>
      </div>
    </div>
  );
}
