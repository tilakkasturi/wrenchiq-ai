import { useState } from "react";
import {
  Sparkles, Send, Zap, ChevronUp, ChevronDown, X,
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
      { type: "alert", icon: "🏦", text: "Worldpac Net-30 bill ($743) due Thursday — 2 days. O'Reilly ($1,104) due Friday. Both in Xero AP aging.", action: "Pay now", value: "$1,847 due", color: COLORS.warning },
      { type: "alert", icon: "📦", text: "3 parts ordered but not yet delivered: Walker 16468 (CR-V), BMW brake rotors (x2), Subaru head gasket set. Jobber ETA overdue on rotors.", action: "Track orders", value: "3 pending", color: COLORS.danger },
      { type: "upsell", icon: "🎯", text: "Mike Reeves efficiency dropped to 85% — assign him lighter jobs this PM", action: "Reassign", value: "Recover 1.2 hrs", color: "#7C3AED" },
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
  social: {
    label: "Watching: Social Inbox",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "⚠️", text: "Diana Moss (Facebook) — angry post, 3 hrs ago. No response yet. Google review risk HIGH.", action: "Respond Now", value: "Urgent", color: COLORS.danger },
      { type: "revenue", icon: "🔥", text: "Jasmine Torres (Instagram) — brake grinding, HOT lead. AI draft ready in 1 click.", action: "Send Draft", value: "+$280–620", color: COLORS.accent },
      { type: "upsell", icon: "📱", text: "Marcus Webb (TikTok) — discovered via your oil change video. First-time customer opportunity.", action: "Convert", value: "New cust.", color: "#7C3AED" },
      { type: "revenue", icon: "📅", text: "Robert Chen (Google) — booked AC service for Tuesday. Prep: RAV4 R-134a refrigerant, no open TSBs.", action: "Prep Job", value: "$129 booked", color: COLORS.success },
    ],
  },
  network: {
    label: "Watching: 100 Locations",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "🔴", text: "2 locations in alert status — Phoenix 7 and Dallas 4. Combined Google drop: 3.6★ avg.", action: "Review Locations", value: "Action needed", color: COLORS.danger },
      { type: "revenue", icon: "💰", text: "Network hit $2.1M this week — top 10 locations drove 34% of revenue. Houston 3 is #1.", action: "See Top 10", value: "$2.1M", color: COLORS.success },
      { type: "upsell", icon: "📦", text: "Cross-location parts transfer approved — $12,400 in excess inventory redistributed.", action: "Track Transfer", value: "$12,400 saved", color: "#3B82F6" },
      { type: "alert", icon: "🎯", text: "59 locations haven't enabled pre-arrival AI message. Enable all to increase approval rate by 23%.", action: "Enable All", value: "+23% ARO", color: COLORS.warning },
    ],
  },
  trust: {
    label: "Watching: Trust Engine",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "⚡", text: "James Park estimate pending 2 hrs — HIGH LTV ($12,450). Send TSB reference text NOW.", action: "Text James", value: "$1,847 at risk", color: COLORS.danger },
      { type: "upsell", icon: "⭐", text: "David Kim hasn't left a review in 9 visits. Post-job approval rate 4★ — ideal time to ask.", action: "Send Review Request", value: "5★ potential", color: "#F59E0B" },
      { type: "alert", icon: "📉", text: "Maria Santos trust score dropped 12 pts — 2 declined items. Call her personally before she goes to a dealer.", action: "Call Maria", value: "At-Risk", color: COLORS.warning },
      { type: "revenue", icon: "❤️", text: "Sarah Chen referred 3 customers = $6,840 in additional revenue. Send thank-you gift card.", action: "Send Gift", value: "Champion", color: COLORS.success },
    ],
  },
  health: {
    label: "Watching: Health Report",
    customerFocus: {
      name: "Sarah Chen",
      vehicle: "2022 Tesla Model 3",
      roId: "RO-2024-1192",
      status: "Report sent · awaiting approval",
      statusColor: COLORS.warning,
    },
    suggestions: [
      { type: "alert", icon: "⏳", text: "Sarah opened the health report 2× but hasn't approved. She uses text — send 1-tap approve link.", action: "Send Approve Link", value: "+$287–420", color: COLORS.warning },
      { type: "upsell", icon: "🎥", text: "DeShawn's inspection video for front brakes is 47s. Customers who watch approve 31% more often.", action: "Resend with Video", value: "+31% approval", color: "#3B82F6" },
      { type: "revenue", icon: "💡", text: "Dealer comparison showing $333 savings is visible on her report. This is your strongest close.", action: "View Report", value: "Save $333", color: COLORS.success },
    ],
  },
  scheduling: {
    label: "Watching: Schedule",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "🕐", text: "Bay 5 & 6 empty after 1 PM — $890 in AI-suggested revenue ready to book in 2 taps.", action: "Book AI Slots", value: "+$890", color: COLORS.accent },
      { type: "revenue", icon: "📊", text: "Today's schedule 71% utilization. Top days are 88%+. 3 AI suggestions can close the gap.", action: "Fill Schedule", value: "+17% util", color: COLORS.success },
      { type: "alert", icon: "⚠️", text: "James Park's BMW rotors delayed 1 day (Worldpac Oakland). His 2 PM slot may need reshuffling.", action: "Reschedule", value: "Parts delayed", color: COLORS.warning },
      { type: "upsell", icon: "🔄", text: "Angela Martinez hasn't been in 8 months — send recall/service reminder for pre-failure Outback check.", action: "Send Reminder", value: "+$165", color: "#7C3AED" },
    ],
  },
  parts: {
    label: "Watching: Parts",
    customerFocus: null,
    suggestions: [
      { type: "alert", icon: "🚚", text: "BMW X3 brake rotors — 1 day late from Worldpac. James Park's job blocked. Call Worldpac rep.", action: "Track Order", value: "Parts late", color: COLORS.danger },
      { type: "revenue", icon: "💰", text: "WrenchIQ pick for David's CR-V cat converter: Akebono via Worldpac — saves $44 vs O'Reilly and ships same day.", action: "Order Now", value: "Save $44", color: COLORS.success },
      { type: "alert", icon: "📦", text: "3 inventory items below minimum — cabin filter, brake pads, wiper blades (0 in stock).", action: "Auto-Reorder", value: "3 items low", color: COLORS.warning },
      { type: "upsell", icon: "📈", text: "Parts margin this month: 48.2% — below your 53% target. Switch 2 jobs to Worldpac to recover $420.", action: "Optimize Margin", value: "-$420 margin", color: "#7C3AED" },
    ],
  },
  techview: {
    label: "Watching: Tech Mobile",
    customerFocus: {
      name: "DeShawn Williams",
      vehicle: "Bay 1 — Tesla Model 3",
      roId: "RO-2024-1192",
      status: "Inspection in progress",
      statusColor: "#3B82F6",
    },
    suggestions: [
      { type: "ok", icon: "✅", text: "DeShawn completed tire rotation + brake inspection on Sarah's Tesla. 2/6 checklist items done.", action: "View Progress", value: "On track", color: COLORS.success },
      { type: "alert", icon: "⚡", text: "TSB-2024-22-004 (ADAS phantom braking) not yet checked for Sarah's Tesla. Remind DeShawn.", action: "Send Reminder", value: "TSB pending", color: COLORS.warning },
      { type: "revenue", icon: "💡", text: "David Kim's CR-V waiting on part (ETA 4 PM). DeShawn available — move Kevin Liu's PPI forward.", action: "Reassign", value: "Fill bay", color: "#3B82F6" },
      { type: "ok", icon: "📊", text: "DeShawn efficiency today: 91% — 3.5 billed hrs vs 3.8 available. Trending to finish strong.", action: null, value: "91% eff.", color: COLORS.success },
    ],
  },
  integrations: {
    label: "Watching: Integrations Hub",
    customerFocus: null,
    suggestions: [
      { type: "ok", icon: "✅", text: "18 of 18 configured integrations healthy. Last sync 4 min ago.", action: null, value: "All green", color: COLORS.success },
      { type: "revenue", icon: "💰", text: "Social integrations (Instagram + TikTok) attributed $8,240 in revenue this month. 47 leads.", action: "View Attribution", value: "$8,240", color: COLORS.accent },
      { type: "upsell", icon: "🚗", text: "Sunbit BNPL not yet connected — 90% approval rate could increase avg ticket on large jobs by 28%.", action: "Connect Sunbit", value: "+28% ticket", color: "#F59E0B" },
      { type: "ok", icon: "📦", text: "PartsTech saved $847 this month searching 31 vendors vs single-source ordering.", action: "View Savings", value: "$847 saved", color: COLORS.success },
    ],
  },
};

// ── Live activity feed items ───────────────────────────────

// priority: "red" = urgent/problem, "yellow" = needs attention, "green" = positive/done
const FEED_ITEMS = [
  { id: 1, icon: "✅", text: "Monica approved Air Filter + Serpentine Belt", meta: "2 min ago", value: "+$213", priority: "green" },
  { id: 2, icon: "⚠️", text: "NHTSA decoded David Kim's CR-V VIN — 2 recalls found", meta: "8 min ago", value: "2 recalls", priority: "red" },
  { id: 3, icon: "📦", text: "eBay Motors: Walker 16468 catalytic converter ordered", meta: "22 min ago", value: "Saved $44", priority: "green" },
  { id: 4, icon: "🔴", text: "Bay 3 idle since 11:00 AM — James K. available", meta: "40 min ago", value: "Bay idle", priority: "red" },
  { id: 5, icon: "💰", text: "James Park approved brake service estimate", meta: "1 hr ago", value: "+$1,892", priority: "green" },
  { id: 6, icon: "⏳", text: "Tom Wallace opened portal 3× — hasn't approved yet", meta: "1.5 hrs ago", value: "Pending", priority: "yellow" },
  { id: 7, icon: "⏰", text: "Worldpac bill $743 due in 2 days — Xero AP aging alert", meta: "2 hrs ago", value: "AP due", priority: "yellow" },
  { id: 8, icon: "🚚", text: "BMW X3 brake rotors — delivery overdue 1 day. Jobber: Worldpac #W-88421.", meta: "3 hrs ago", value: "Parts late", priority: "red" },
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

const FEED_PRIORITY_STYLES = {
  red:    { border: "#EF4444", bg: "#FEF2F2", valueColor: "#DC2626" },
  yellow: { border: "#F59E0B", bg: "#FFFBEB", valueColor: "#D97706" },
  green:  { border: "#22C55E", bg: "#F0FDF4", valueColor: "#16A34A" },
};

function FeedItem({ item }) {
  const pStyle = FEED_PRIORITY_STYLES[item.priority] || FEED_PRIORITY_STYLES.green;
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 8,
      marginBottom: 6,
      background: pStyle.bg,
      borderRadius: 8,
      borderLeft: `3px solid ${pStyle.border}`,
      padding: "8px 9px",
    }}>
      <span style={{ fontSize: 12, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, color: COLORS.textPrimary, lineHeight: 1.4 }}>{item.text}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
          <span style={{ fontSize: 9.5, color: COLORS.textMuted }}>{item.meta}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: pStyle.valueColor }}>{item.value}</span>
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

// ── Owner persona: proactive alert context (AE-783) ────────

const OWNER_CONTEXT = {
  label: "Shop Owner · Proactive Intelligence",
  customerFocus: null,
  suggestions: [
    { type: "alert",   icon: "⏳", text: "RO-1041 (Tom Wallace, $1,340) waiting 48 min for approval. High LTV customer.", action: "Nudge via SMS", value: "+$1,340 risk", color: COLORS.danger },
    { type: "alert",   icon: "📊", text: "Tech Marcus averaging 2.1 hrs on 1.5-hr jobs — 3 consecutive pattern.", action: "View Performance", value: "Pattern forming", color: COLORS.warning },
    { type: "revenue", icon: "💰", text: "You're $1,660 short of today's target. 3 customers in queue — Quick Lane special?", action: "Create Quick Lane", value: "$1,660 gap", color: COLORS.accent },
    { type: "alert",   icon: "📦", text: "O'Reilly rebate cycle ends Sunday. $1,240 eligible — need $260 more for $187 rebate.", action: "Order $260 more", value: "$187 rebate risk", color: COLORS.warning },
  ],
};

// ── Owner persona: NL command responses (AE-788) ───────────

const NL_RESPONSES = [
  { match: ["best tech", "top tech", "who is best"], response: "Best tech today: DeShawn Jackson — 94% efficiency, 72% upsell conversion on 2 jobs. Marcus at 89%. Kevin at 71% (below threshold)." },
  { match: ["volvo", "bay 2", "move"], response: "Bay assignment updated — Volvo moved to Bay 2. Tech Kevin Liu notified." },
  { match: ["open approval", "approvals", "pending approval"], response: "3 open approvals: Tom Wallace ($1,340) · 48 min, Angela Martinez ($287) · 22 min, Robert Taylor ($45) · 5 min." },
  { match: ["worldpac", "spend", "parts spend"], response: "Worldpac spend: $3,240 this month vs $2,890 last month (+12%). You're 81% to the $4,000 rebate threshold." },
  { match: ["revenue", "today", "target"], response: "Today: $5,840 / $7,500 target (78%). Need $1,660 more. 3 vehicles still in shop. On pace for $7,100 by close." },
  { match: ["bay", "utilization", "bays"], response: "Bay utilization: 67%. Bays 1, 2, 4, 5 occupied. Bays 3 and 6 idle. Bay 3 idle 45+ min — reassignment recommended." },
];

function getNLResponse(query) {
  const q = query.toLowerCase();
  for (const r of NL_RESPONSES) {
    if (r.match.some(m => q.includes(m))) return r.response;
  }
  return "I can answer questions about revenue, tech performance, bays, parts spend, and approvals. Try: 'What's my best tech?' or 'Show open approvals'.";
}

// ── Advisor persona context ─────────────────────────────────

const ADVISOR_CONTEXT = {
  label: "Advisor · Front Desk Intelligence",
  customerFocus: null,
  suggestions: [
    { type: "alert",   icon: "⏳", text: "Monica Rodriguez estimate pending 35 min — 100% approval history. Send 1-tap approve link.", action: "Send SMS", value: "+$265", color: COLORS.warning },
    { type: "upsell",  icon: "🔧", text: "David Kim's CR-V: AI detected TSB-19-052 applies. Mention Honda goodwill claim opportunity.", action: "Add TSB note", value: "Save $450", color: COLORS.accent },
    { type: "revenue", icon: "💡", text: "3 customers in queue — average wait 12 min. Sarah Chen next. Estimated RO: $420.", action: "Start Intake", value: "+$420", color: "#2563EB" },
    { type: "upsell",  icon: "📋", text: "Robert Taylor (22 visits, $15.8K LTV) — brake fluid due at 64K. Add to estimate.", action: "Add to RO", value: "+$185", color: COLORS.accent },
  ],
};

// ── Main agent component ───────────────────────────────────

export default function WrenchIQAgent({ activeScreen, persona = "admin", onHide }) {
  const [typedInput, setTypedInput] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [nlResponse, setNlResponse] = useState(null);

  // Persona-specific context override
  let ctx;
  if (persona === "owner") {
    ctx = OWNER_CONTEXT;
  } else if (persona === "advisor") {
    ctx = ADVISOR_CONTEXT;
  } else {
    ctx = SCREEN_CONTEXT[activeScreen] || SCREEN_CONTEXT.dashboard;
  }

  const handleSend = () => {
    if (!typedInput.trim()) return;
    if (persona === "owner") {
      setNlResponse(getNLResponse(typedInput));
    }
    setTypedInput("");
  };

  const totalOppValue = REVENUE_OPPS.reduce((sum, o) => sum + o.value, 0);

  const panelHeight = expanded ? "calc(100vh - 72px)" : (persona === "owner" ? 420 : 390);

  return (
    <div style={{
      position: "fixed",
      right: 16,
      bottom: 16,
      width: 300,
      height: panelHeight,
      background: "#fff",
      borderRadius: 14,
      boxShadow: "0 8px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10)",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      zIndex: 1000,
      transition: "height 0.25s ease",
      border: "1px solid #E5E7EB",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg, #1B3461 0%, #0D2A4A 100%)",
        padding: "14px 14px 12px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(255,107,53,0.2)", border: "1px solid rgba(255,107,53,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={14} color={COLORS.accent} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.2 }}>WrenchIQ <span style={{ color: "#FF6B35" }}>AI</span></div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 0.5 }}>Revenue Intelligence</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} />
            <button
              onClick={() => setExpanded(e => !e)}
              title={expanded ? "Collapse" : "Expand"}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 5, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              {expanded ? <ChevronDown size={13} color="rgba(255,255,255,0.7)" /> : <ChevronUp size={13} color="rgba(255,255,255,0.7)" />}
            </button>
            <button
              onClick={onHide}
              title="Hide agent"
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 5, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={12} color="rgba(255,255,255,0.7)" />
            </button>
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
          <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase", paddingBottom: 6 }}>
            AI Suggestions
          </div>
          {ctx.suggestions.map((item, i) => (
            <SuggestionCard key={i} item={item} />
          ))}
        </div>

        {/* Revenue opportunities */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Revenue Pipeline</span>
            <span style={{ fontSize: 10, fontWeight: 800, color: COLORS.accent }}>${totalOppValue.toLocaleString()}</span>
          </div>
          <div style={{ background: "#FAFAFA", borderRadius: 10, padding: "4px 10px 2px", border: "1px solid #F3F4F6" }}>
            {REVENUE_OPPS.map((opp) => <OppRow key={opp.id} opp={opp} />)}
          </div>
        </div>

        {/* Live activity feed */}
        <div style={{ marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, paddingBottom: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E" }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Live Feed</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FEED_ITEMS.map((item) => <FeedItem key={item.id} item={item} />)}
          </div>
        </div>
      </div>

      {/* ── NL response (AE-788 owner natural language commands) ── */}
      {nlResponse && (
        <div style={{ margin: "0 12px 0", padding: "8px 10px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0", borderLeft: `3px solid ${COLORS.success}` }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.success, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 4 }}>AI Response</div>
          <div style={{ fontSize: 11, color: COLORS.textPrimary, lineHeight: 1.5 }}>{nlResponse}</div>
          <button onClick={() => setNlResponse(null)} style={{ fontSize: 9, color: COLORS.textMuted, background: "none", border: "none", cursor: "pointer", marginTop: 4, padding: 0 }}>Dismiss</button>
        </div>
      )}

      {/* ── Ask Agent input ── */}
      <div style={{ borderTop: "1px solid #E5E7EB", padding: "10px 12px", flexShrink: 0, background: "#FAFAFA" }}>
        {persona === "owner" && (
          <div style={{ fontSize: 9, color: COLORS.textMuted, marginBottom: 5 }}>
            Try: "What's my best tech?" · "Show open approvals" · "Worldpac spend"
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", borderRadius: 10, border: "1px solid #E5E7EB", padding: "7px 10px" }}>
          <Sparkles size={12} color={COLORS.accent} style={{ flexShrink: 0 }} />
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={persona === "owner" ? "Ask anything about your shop…" : "Ask WrenchIQ AI anything…"}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 11, background: "transparent", color: COLORS.textPrimary }}
          />
          <button
            onClick={handleSend}
            style={{ background: typedInput ? COLORS.accent : "#E5E7EB", border: "none", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0, transition: "background 0.15s" }}
          >
            <Send size={11} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
