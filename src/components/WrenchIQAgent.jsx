import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Send, Zap, X,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { repairOrders, customers, vehicles, getCustomer, getVehicle } from "../data/demoData";
import { useRecommendations } from "../context/RecommendationsContext";
import RecommendationCard from "./RecommendationCard";

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

  // ── Persona-specific screen contexts ────────────────────────

  advisorHome: {
    label: "Watching: RO Queue & Board",
    customerFocus: null,
    suggestions: [
      { type: "revenue", icon: "⏳", text: "David's estimate pending 2h 15m — send a nudge text before end of day.", action: "Text David", value: "+$2,190", color: COLORS.warning },
      { type: "alert",   icon: "🔴", text: "Bay 3 idle 40 min — move Tom's Tucson forward to fill the gap.", action: "Reschedule", value: "Free bay", color: COLORS.danger },
      { type: "upsell",  icon: "💡", text: "Monica: 3 items pending $294 — 100% lifetime approval rate. Call now.", action: "Call Monica", value: "+$294", color: COLORS.accent },
      { type: "revenue", icon: "📊", text: "RO board: $5,842 today — need $658 more to hit daily target.", action: "View Board", value: "$658 gap", color: "#2563EB" },
    ],
  },

  techHome: {
    label: "Watching: My Jobs",
    customerFocus: {
      name: "David Kim",
      vehicle: "2019 Honda CR-V",
      roId: "RO-2024-1189",
      status: "Active — Bay 3",
      statusColor: COLORS.success,
    },
    suggestions: [
      { type: "alert",   icon: "⚠️", text: "TSB-2022-015 applies to David's CR-V cat converter — add reference before closing.", action: "Add TSB note", value: "Warranty ref", color: COLORS.warning },
      { type: "revenue", icon: "🔋", text: "Sarah's Tesla (UP NEXT): ADAS calibration TSB-2024-22-004 not yet flagged. Add to inspection.", action: "Flag TSB", value: "+$180", color: "#3B82F6" },
      { type: "ok",      icon: "📊", text: "Efficiency today: 89% — 2.3 billed hrs of 3.5 available. Strong pace.", action: null, value: "89% eff.", color: COLORS.success },
    ],
  },

  ownerHome: {
    label: "Watching: Command Center",
    customerFocus: null,
    suggestions: [
      { type: "alert",   icon: "🏁", text: "Revenue at $5,840 — need $1,660 more to hit daily target. 3 pending approvals can close the gap.", action: "View ROs", value: "$1,660 gap", color: COLORS.warning },
      { type: "alert",   icon: "🔴", text: "Bay 3 idle 45 min — move Tom's Tucson forward to recover $280 in labor.", action: "Reschedule", value: "Recover $280", color: COLORS.danger },
      { type: "upsell",  icon: "📊", text: "Mike Reeves efficiency at 85% this week — assign lighter jobs this afternoon.", action: "Reassign", value: "+1.2 hrs", color: "#7C3AED" },
      { type: "alert",   icon: "💰", text: "Worldpac Net-30 ($743) due Thursday · O'Reilly ($1,104) due Friday. Both in Xero.", action: "Pay Now", value: "$1,847 due", color: COLORS.danger },
    ],
  },

  am3cWriter: {
    label: "Watching: 3C Story Writer",
    customerFocus: null,
    suggestions: [
      { type: "revenue", icon: "📝", text: "David Kim's CR-V: P0420 narrative ready — TSB-19-052 reference improves approval rate 40%.", action: "Insert TSB", value: "+40% approval", color: "#2563EB" },
      { type: "alert",   icon: "⚠️", text: "Monica's Camry cause section is vague — add torque spec and part number for compliance.", action: "Enhance Cause", value: "Compliance risk", color: COLORS.warning },
      { type: "ok",      icon: "✅", text: "Last 5 narratives accepted by service manager without edits. AI quality score: 96%.", action: null, value: "96% quality", color: COLORS.success },
    ],
  },

  techDVI: {
    label: "Watching: DVI Inspection",
    customerFocus: {
      name: "Sarah Chen",
      vehicle: "2022 Tesla Model 3",
      roId: "RO-2024-1192",
      status: "Inspection in progress",
      statusColor: "#3B82F6",
    },
    suggestions: [
      { type: "alert",   icon: "📸", text: "Front brake finding — add photo to increase customer approval rate by 34% (shop avg).", action: "Take Photo", value: "+34% approval", color: COLORS.warning },
      { type: "upsell",  icon: "🔋", text: "Tesla HVAC cabin filter due at 24K — Sarah is at 22K. Add proactive recommendation.", action: "Add Finding", value: "+$68", color: COLORS.accent },
      { type: "ok",      icon: "✅", text: "VIN decoded — no open recalls for this Tesla. Items cross-referenced with TSB database.", action: null, value: "No recalls", color: COLORS.success },
    ],
  },

  aroAgent: {
    label: "Watching: ARO Agent",
    customerFocus: null,
    suggestions: [
      { type: "alert",   icon: "📉", text: "ARO is $108 below goal — 3 declined services account for $620 in recoverable revenue.", action: "Run Agent", value: "-$108 gap", color: COLORS.danger },
      { type: "revenue", icon: "💡", text: "Brake flush declined by 4 customers this week. Advisors converting at 38% — goal is 60%.", action: "View Details", value: "+$356 opp", color: COLORS.accent },
      { type: "upsell",  icon: "⚡", text: "Tech productivity: Marcus at 82% efficiency, goal 90%. 3 ROs flagged for review.", action: "Tech Report", value: "Efficiency gap", color: COLORS.warning },
    ],
  },
  aiAgent: {
    label: "Watching: AI Agent",
    customerFocus: null,
    suggestions: [
      { type: "revenue", icon: "🤖", text: "AI prepared 3 RO narratives this morning — $4,280 in labor written, 0 sent back for edits.", action: "View Narratives", value: "$4,280 written", color: COLORS.success },
      { type: "alert",   icon: "⚡", text: "David Kim RO pending advisor sign-off — AI flagged P0420 with TSB match. Review now.", action: "Review RO", value: "Flagged", color: COLORS.warning },
      { type: "upsell",  icon: "💬", text: "AI spotted 4 upsell opportunities in today's queue worth $920. 1-tap to add.", action: "Review Opps", value: "+$920", color: COLORS.accent },
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
  const borderMap = {
    revenue: COLORS.success,
    upsell: COLORS.warning,
    alert: COLORS.danger,
    ok: COLORS.success,
  };

  return (
    <div style={{
      background: COLORS.navyMid,
      borderRadius: 10,
      padding: "10px 11px",
      borderLeft: `3px solid ${borderMap[item.type] || COLORS.navyBorder}`,
      marginBottom: 6,
      border: `1px solid ${COLORS.navyBorder}`,
      borderLeftWidth: 3,
      borderLeftColor: borderMap[item.type] || COLORS.navyBorder,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 6 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11.5, color: COLORS.intelText, lineHeight: 1.4, marginBottom: item.action ? 6 : 0 }}>
            <span style={{ marginRight: 4 }}>{item.icon}</span>
            {item.text}
          </div>
          {item.action && (
            <button style={{
              fontSize: 10, fontWeight: 700, color: item.color || COLORS.intelMuted,
              background: "none", border: `1px solid ${item.color || COLORS.navyBorder}`,
              borderRadius: 5, padding: "3px 8px", cursor: "pointer",
            }}>
              {item.action}
            </button>
          )}
        </div>
        <div style={{
          fontSize: 10, fontWeight: 800, color: item.color || COLORS.intelMuted,
          background: "rgba(255,255,255,0.07)", borderRadius: 5, padding: "2px 6px", whiteSpace: "nowrap",
          border: `1px solid ${COLORS.navyBorder}`,
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
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: `1px solid ${COLORS.navyBorder}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.intelText }}>{opp.customer} · <span style={{ fontWeight: 400, color: COLORS.intelMuted }}>{opp.action}</span></div>
        <span style={{ fontSize: 9.5, color: cfg.color, background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "1px 5px", fontWeight: 600 }}>{cfg.label}</span>
      </div>
      <div style={{ fontSize: 12, fontWeight: 800, color: opp.status === "save" ? COLORS.success : COLORS.gold, flexShrink: 0 }}>
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

const TABS = [
  { id: "aiSuggest",       label: "Chat" },
  { id: "recommendations", label: "Recommendations" },
  { id: "revenue",         label: "Revenue" },
  { id: "liveFeed",        label: "Live Feed" },
];

export default function WrenchIQAgent({ activeScreen, persona = "admin", selectedRO = null, onHide }) {
  const [typedInput, setTypedInput] = useState("");
  const [activeTab, setActiveTab] = useState("aiSuggest");
  const [now, setNow] = useState(new Date());
  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const sessionIdRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Recommendations from context (null = provider not mounted)
  const recCtx = useRecommendations();

  // Persona-specific context override
  let ctx;
  if (persona === "owner") {
    ctx = OWNER_CONTEXT;
  } else if (persona === "advisor" && selectedRO?._liveRO) {
    // Narrow to selected RO's customer
    const liveRO = selectedRO._liveRO;
    const demoCust = customers.find(c => c.id === selectedRO.custId);
    const demoVeh  = vehicles.find(v => v.customerId === selectedRO.custId);
    const custSrc  = selectedRO._customer || demoCust;
    const vehSrc   = selectedRO._vehicle  || demoVeh;
    const custName = custSrc
      ? `${custSrc.firstName} ${custSrc.lastName}`
      : selectedRO.custId;
    const vehicle = vehSrc
      ? `${vehSrc.year} ${vehSrc.make} ${vehSrc.model}`
      : "Vehicle";
    ctx = {
      label: `Focused: ${custName} · ${vehicle}`,
      customerFocus: {
        name: custName,
        vehicle,
        roId: selectedRO.roNum,
        status: liveRO.customerConcern || selectedRO.job,
        statusColor: COLORS.warning,
      },
      suggestions: (liveRO.aiInsights || []).map((text, i) => ({
        type: i === 0 ? "alert" : i === (liveRO.aiInsights.length - 1) ? "revenue" : "upsell",
        icon: i === 0 ? "⚡" : i % 2 === 0 ? "🔧" : "💡",
        text,
        action: null,
        value: null,
        color: i === 0 ? COLORS.warning : i % 2 === 0 ? COLORS.accent : "#7C3AED",
      })),
    };
  } else {
    // Use screen-specific context if available, otherwise fall back to persona defaults
    ctx = SCREEN_CONTEXT[activeScreen]
      || (persona === "advisor" ? ADVISOR_CONTEXT : null)
      || SCREEN_CONTEXT.dashboard;
  }

  // Scroll chat to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = typedInput.trim();
    if (!text || isStreaming) return;
    setTypedInput("");
    setActiveTab("aiSuggest");

    const userMsgId = `u-${Date.now()}`;
    const agentMsgId = `a-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      { role: "user", text, id: userMsgId },
      { role: "agent", text: "", id: agentMsgId },
    ]);
    setIsStreaming(true);

    try {
      // Create session once per panel lifecycle
      if (!sessionIdRef.current) {
        const r = await fetch("/api/agent/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "WrenchIQ Chat" }),
        });
        const { sessionId } = await r.json();
        sessionIdRef.current = sessionId;
      }

      // Stream the response
      const res = await fetch(`/api/agent/sessions/${sessionIdRef.current}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          let data;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }
          if (data.type === "agent.message") {
            const chunk = (data.event?.content || [])
              .filter(b => b.type === "text")
              .map(b => b.text)
              .join("");
            if (chunk) {
              setMessages(prev => prev.map(m =>
                m.id === agentMsgId ? { ...m, text: m.text + chunk } : m
              ));
            }
          }
          if (data.type === "error") {
            setMessages(prev => prev.map(m =>
              m.id === agentMsgId ? { ...m, text: "Error: " + data.error } : m
            ));
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId ? { ...m, text: "Connection error: " + err.message } : m
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  const totalOppValue = REVENUE_OPPS.reduce((sum, o) => sum + o.value, 0);

  return (
    <div style={{
      width: 300,
      flexShrink: 0,
      height: "100%",
      background: COLORS.navyDark,
      borderLeft: `1px solid ${COLORS.navyBorder}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* ── Header ── */}
      <div style={{
        background: COLORS.navyDark,
        borderBottom: `1px solid ${COLORS.navyBorder}`,
        padding: "14px 14px 12px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `rgba(201,162,39,0.2)`, border: `1px solid rgba(201,162,39,0.4)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Sparkles size={14} color={COLORS.gold} />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: 0.2 }}>WrenchIQ <span style={{ color: COLORS.gold }}>AI</span></div>
              <div style={{ fontSize: 9, color: COLORS.intelMuted, marginTop: 0.5 }}>Intelligence Ready</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} />
            <button
              onClick={onHide}
              title="Hide AI panel"
              style={{ background: "rgba(255,255,255,0.12)", border: "none", borderRadius: 5, width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X size={12} color="rgba(255,255,255,0.7)" />
            </button>
          </div>
        </div>

        {/* Context chip + live clock */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 8px", flex: 1, minWidth: 0 }}>
            <Zap size={10} color={COLORS.accent} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ctx.label}</span>
          </div>
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: 0.5, fontVariantNumeric: "tabular-nums" }}>
              {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>
              {now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div style={{ display: "flex", gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                fontSize: 9, fontWeight: 700,
                padding: "5px 2px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                background: activeTab === tab.id ? COLORS.gold : "rgba(255,255,255,0.1)",
                color: activeTab === tab.id ? "#1A1A1A" : "rgba(255,255,255,0.5)",
                transition: "all 0.15s",
                letterSpacing: 0.2,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "10px 12px", background: COLORS.navyDark }}>

        {/* ── Chat tab ── */}
        {activeTab === "aiSuggest" && (
          <>
            {messages.length === 0 ? (
              /* No conversation yet — show screen-context suggestions as starter prompts */
              <>
                {ctx.customerFocus && (
                  <div style={{ background: COLORS.navyMid, borderRadius: 10, padding: "10px 11px", marginBottom: 10, border: `1.5px solid ${COLORS.navyBorder}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 14, background: COLORS.navyBorder, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 800 }}>
                        {ctx.customerFocus.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.intelText }}>{ctx.customerFocus.name}</div>
                        <div style={{ fontSize: 10, color: COLORS.intelMuted }}>{ctx.customerFocus.vehicle}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: ctx.customerFocus.statusColor }} />
                      <span style={{ fontSize: 10, color: ctx.customerFocus.statusColor, fontWeight: 600 }}>{ctx.customerFocus.status}</span>
                    </div>
                    <div style={{ fontSize: 9.5, color: COLORS.intelMuted, fontFamily: "monospace" }}>{ctx.customerFocus.roId}</div>
                  </div>
                )}
                <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.intelMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 }}>Suggested prompts</div>
                {ctx.suggestions.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { setTypedInput(item.text); }}
                    style={{
                      display: "block", width: "100%", textAlign: "left",
                      background: COLORS.navyMid, border: `1px solid ${COLORS.navyBorder}`,
                      borderRadius: 8, padding: "8px 10px", marginBottom: 6,
                      cursor: "pointer", fontSize: 11, color: COLORS.intelText,
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ marginRight: 5 }}>{item.icon}</span>{item.text}
                  </button>
                ))}
              </>
            ) : (
              /* Conversation history */
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.map(msg => (
                  <div key={msg.id} style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                  }}>
                    <div style={{
                      maxWidth: "88%",
                      background: msg.role === "user" ? COLORS.gold : COLORS.navyMid,
                      color: msg.role === "user" ? "#1A1A1A" : COLORS.intelText,
                      borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      padding: "8px 11px",
                      fontSize: 11.5,
                      lineHeight: 1.55,
                      whiteSpace: "pre-wrap",
                      border: msg.role === "user" ? "none" : `1px solid ${COLORS.navyBorder}`,
                    }}>
                      {msg.text || (msg.role === "agent" && isStreaming
                        ? <span style={{ opacity: 0.5 }}>Thinking…</span>
                        : null
                      )}
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            )}
          </>
        )}

        {/* ── Recommendations tab ── */}
        {activeTab === "recommendations" && (
          <>
            {recCtx?.loading
              ? (
                <div style={{ textAlign: "center", padding: "32px 12px", color: COLORS.intelMuted, fontSize: 12 }}>
                  Loading recommendations…
                </div>
              )
              : recCtx && recCtx.recommendations.length > 0
                ? [...recCtx.recommendations]
                    .sort((a, b) => {
                      const order = { high: 0, medium: 1, low: 2 };
                      return (order[a.priority] ?? 3) - (order[b.priority] ?? 3);
                    })
                    .map(rec => (
                      <RecommendationCard key={rec.id} recommendation={rec} persona={persona} />
                    ))
                : (
                  <div style={{ textAlign: "center", padding: "32px 12px", color: COLORS.intelMuted, fontSize: 12 }}>
                    No recommendations yet.
                  </div>
                )
            }
          </>
        )}

        {/* ── Revenue tab ── */}
        {activeTab === "revenue" && (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.intelMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Revenue Pipeline</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.gold }}>${totalOppValue.toLocaleString()}</span>
            </div>
            <div style={{ background: COLORS.navyMid, borderRadius: 10, padding: "4px 10px 2px", border: `1px solid ${COLORS.navyBorder}` }}>
              {REVENUE_OPPS.map((opp) => <OppRow key={opp.id} opp={opp} />)}
            </div>
          </>
        )}

        {/* ── Live Feed tab ── */}
        {activeTab === "liveFeed" && (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.intelMuted, letterSpacing: 0.5, textTransform: "uppercase" }}>Live Feed</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {FEED_ITEMS.map((item) => <FeedItem key={item.id} item={item} />)}
            </div>
          </>
        )}

      </div>

      {/* ── Ask Agent input ── */}
      <div style={{ borderTop: `1px solid ${COLORS.navyBorder}`, padding: "10px 12px", flexShrink: 0, background: COLORS.navyDark }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: COLORS.navyMid, borderRadius: 10, border: `1px solid ${isStreaming ? COLORS.gold : COLORS.navyBorder}`, padding: "7px 10px", transition: "border-color 0.15s" }}>
          <Sparkles size={12} color={isStreaming ? COLORS.gold : COLORS.intelMuted} style={{ flexShrink: 0 }} />
          <input
            value={typedInput}
            onChange={(e) => setTypedInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isStreaming ? "Agent is responding…" : "Ask WrenchIQ AI anything…"}
            disabled={isStreaming}
            style={{ flex: 1, border: "none", outline: "none", fontSize: 11, background: "transparent", color: COLORS.intelText }}
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !typedInput.trim()}
            style={{ background: typedInput.trim() && !isStreaming ? COLORS.gold : "rgba(255,255,255,0.1)", border: "none", borderRadius: 6, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", cursor: typedInput.trim() && !isStreaming ? "pointer" : "default", flexShrink: 0, transition: "background 0.15s" }}
          >
            <Send size={11} color={typedInput.trim() && !isStreaming ? "#1A1A1A" : "rgba(255,255,255,0.4)"} />
          </button>
        </div>
      </div>
    </div>
  );
}
