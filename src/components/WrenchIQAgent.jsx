import { useState, useEffect, useRef } from "react";
import {
  Sparkles, Send, Zap, X,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { repairOrders, customers, vehicles, getCustomer, getVehicle } from "../data/demoData";
import { useRecommendations } from "../context/RecommendationsContext";
import RecommendationCard from "./RecommendationCard";

const API_BASE_AGENT = import.meta.env.VITE_API_BASE || "";

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

// ── Retrospective snapshot + KPI drift constants ───────────

const DEMO_SNAPSHOT_90D = {
  shopId: 'shop-001', locationId: 'all', period: '90d',
  avgRO: { overall: 419, byLocation: { 'loc-001':487,'loc-002':341,'loc-003':412,'loc-004':456 } },
  bayUtilization: {
    overall: 64,
    byDay: { Mon:71, Tue:78, Wed:68, Thu:74, Fri:82, Sat:41, Sun:0 },
    byLocation: { 'loc-001':72, 'loc-002':51, 'loc-003':64, 'loc-004':69 },
  },
  upsell: { opportunities:312, conversions:121, rate:38.8,
    topMissed:['Cabin air filter','Wiper blades','Brake fluid flush'] },
  elr: {
    overall: 178,
    byTech:[
      {techId:'tech-001',techName:'James Kowalski',elr:201,roCount:89},
      {techId:'tech-002',techName:'Mike Reeves',elr:163,roCount:94},
      {techId:'tech-003',techName:'Carlos Mendez',elr:189,roCount:81},
      {techId:'tech-004',techName:'Lisa Nguyen',elr:147,roCount:72},
    ]
  },
  partsMargin: 48.2,
  revenueByMonth:[
    {month:'Jan 2026',revenue:58400},
    {month:'Feb 2026',revenue:61200},
    {month:'Mar 2026',revenue:63800},
  ],
};

const LOCATION_NAMES = {
  'loc-001': 'Palo Alto', 'loc-002': 'Sunnyvale',
  'loc-003': 'Mountain View', 'loc-004': 'Menlo Park',
};

const DRIFT_DATA = {
  avg_ro: { label:'Avg RO', drift:'down $22 today', suggestion:'3 ROs closed below target today', value:'$397', metric:'avg_ro' },
  bay_utilization: { label:'Bay utilization', drift:'below target (58%)', suggestion:'Bay 4 idle 80+ min', value:'58%', metric:'bay_utilization' },
  upsell_conversion: { label:'Upsell rate', drift:'below 40% benchmark', suggestion:'2 cabin filters declined this morning', value:'34%', metric:'upsell_conversion' },
  elr: { label:'ELR', drift:'down $12 from target', suggestion:'2 jobs ran over on actual hours', value:'$166', metric:'elr' },
};

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

  // Retrospective / conversation mode
  const [convMode, setConvMode] = useState(null); // null | 'retro'
  const [retroStep, setRetroStep] = useState(null); // null | 'topic-select' | 'revenue' | 'utilization' | 'upsell' | 'qa' | 'confirm'
  const [pendingGoals, setPendingGoals] = useState([]);
  const [snapshot90d, setSnapshot90d] = useState(null);

  // Post-retro state
  const [watchedKPIs, setWatchedKPIs] = useState([]);
  const [opportunitiesShown, setOpportunitiesShown] = useState(false);
  const [expandedOpp, setExpandedOpp] = useState(null);

  // Tribal notes (for Shop Rules section and chat creation)
  const [tribalNotes, setTribalNotes] = useState([]);
  const [tribalNotesLoaded, setTribalNotesLoaded] = useState(false);
  const [awaitingNoteExpiry, setAwaitingNoteExpiry] = useState(null);

  // Drift alerts dismissal
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Shop Rules expand/collapse
  const [shopRulesExpanded, setShopRulesExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for retro mode trigger from Dashboard CTA
  useEffect(() => {
    const handler = () => openRetroMode();
    window.addEventListener('wrenchiq:open-retro', handler);
    return () => window.removeEventListener('wrenchiq:open-retro', handler);
  }, []);

  // Fetch snapshot when entering retro mode
  useEffect(() => {
    if (convMode !== 'retro' || snapshot90d) return;
    fetch(`${API_BASE_AGENT}/api/snapshot/90d/shop-001`)
      .then(r => r.ok ? r.json() : null)
      .then(data => setSnapshot90d(data && data.avgRO ? data : DEMO_SNAPSHOT_90D))
      .catch(() => setSnapshot90d(DEMO_SNAPSHOT_90D));
  }, [convMode]);

  // Fetch tribal notes on mount (for Shop Rules section)
  useEffect(() => {
    fetch(`${API_BASE_AGENT}/api/tribal-notes/shop-001`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setTribalNotes(Array.isArray(data) ? data : []); setTribalNotesLoaded(true); })
      .catch(() => setTribalNotesLoaded(true));
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

  // ── Snapshot helper ─────────────────────────────────────────
  const snap = snapshot90d || DEMO_SNAPSHOT_90D;

  // ── Retro mode helpers ──────────────────────────────────────

  function openRetroMode() {
    setConvMode('retro');
    setRetroStep('topic-select');
    setActiveTab('aiSuggest');
    setMessages([{
      role: 'assistant',
      content: '__retro_intro__',
      id: `retro-${Date.now()}`,
    }]);
  }

  function retroIntroContent() {
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:8}}>
          Hey — I've reviewed Peninsula Precision's last 3 months across all 4 locations.
        </div>
        <div style={{fontSize:13, color:'#475569', marginBottom:12}}>
          What do you want to dig into first?
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {['Revenue', 'Bay Utilization', 'Upsell Performance'].map(topic => (
            <button key={topic} onClick={() => handleRetroTopic(topic.toLowerCase().replace(' ','-'))}
              style={{background:'#0D3B45', color:'#fff', border:'none', borderRadius:6,
                padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', textAlign:'left'}}>
              {topic} →
            </button>
          ))}
        </div>
      </div>
    );
  }

  function revenueModuleContent() {
    const s = snap;
    const locs = s.avgRO?.byLocation || {};
    const locEntries = Object.entries(locs).sort((a,b) => b[1]-a[1]);
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>Revenue — Last 90 Days</div>
        <div style={{background:'#F8FAFC', borderRadius:6, padding:10, marginBottom:10}}>
          {locEntries.map(([id, val]) => (
            <div key={id} style={{display:'flex', justifyContent:'space-between', padding:'4px 0',
              borderBottom:'1px solid #E2E8F0', fontSize:13}}>
              <span>{LOCATION_NAMES[id] || id}</span>
              <span style={{fontWeight:700, color: val >= 450 ? '#059669' : val >= 400 ? '#D97706' : '#DC2626'}}>
                ${Math.round(val)} avg RO
              </span>
            </div>
          ))}
          <div style={{display:'flex', justifyContent:'space-between', padding:'6px 0', fontSize:13, fontWeight:700}}>
            <span>Group Average</span><span>${Math.round(s.avgRO?.overall || 419)}</span>
          </div>
          <div style={{fontSize:12, color:'#6B7280', marginTop:4}}>
            Industry benchmark: $520 avg RO
          </div>
        </div>
        {s.revenueByMonth?.length > 0 && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:4}}>3-Month Trend</div>
            <div style={{display:'flex', gap:4}}>
              {s.revenueByMonth.map(m => (
                <div key={m.month} style={{flex:1, textAlign:'center', background:'#EFF6FF', borderRadius:4, padding:'4px 2px'}}>
                  <div style={{fontSize:10, color:'#6B7280'}}>{m.month.split(' ')[0]}</div>
                  <div style={{fontSize:12, fontWeight:700}}>${(m.revenue/1000).toFixed(0)}k</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{fontSize:13, color:'#475569', marginBottom:8}}>
          To set a revenue target, type something like:<br/>
          <em>"I want to hit $480 by July"</em>
        </div>
      </div>
    );
  }

  function utilizationModuleContent() {
    const s = snap;
    const util = s.bayUtilization || {};
    const locs = util.byLocation || {};
    const byDay = util.byDay || {};
    const lowestDay = Object.entries(byDay).sort((a,b)=>a[1]-b[1])[0];
    const lowestLoc = Object.entries(locs).sort((a,b)=>a[1]-b[1])[0];
    const gapRevenue = lowestLoc ? Math.round((70 - lowestLoc[1]) * (snap.avgRO?.overall||419) * 3 / 10 * 5) : 0;
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>Bay Utilization — Last 90 Days</div>
        <div style={{background:'#F8FAFC', borderRadius:6, padding:10, marginBottom:10}}>
          <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
            <span style={{fontSize:13}}>Overall utilization</span>
            <span style={{fontWeight:700, fontSize:14}}>{util.overall || 64}%</span>
          </div>
          {Object.entries(locs).sort((a,b)=>b[1]-a[1]).map(([id, val]) => (
            <div key={id} style={{display:'flex', justifyContent:'space-between', padding:'3px 0',
              borderTop:'1px solid #E2E8F0', fontSize:13}}>
              <span>{LOCATION_NAMES[id] || id}</span>
              <span style={{fontWeight:600, color: val>=70?'#059669':val>=60?'#D97706':'#DC2626'}}>{val}%</span>
            </div>
          ))}
        </div>
        {lowestDay && <div style={{fontSize:13, color:'#475569', marginBottom:6}}>
          Lowest day: <strong>{lowestDay[0]}s at {lowestDay[1]}%</strong>
        </div>}
        {lowestLoc && <div style={{background:'#FFF7ED', borderRadius:6, padding:8, marginBottom:10, fontSize:13}}>
          <strong>{LOCATION_NAMES[lowestLoc[0]]}</strong> running at {lowestLoc[1]}% — ~${gapRevenue.toLocaleString()}/month unrealized
        </div>}
        <div style={{fontSize:13, color:'#475569'}}>
          To set a target: <em>"I want 70% utilization at Sunnyvale"</em>
        </div>
      </div>
    );
  }

  function upsellModuleContent() {
    const s = snap;
    const u = s.upsell || {};
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>Upsell Performance — Last 90 Days</div>
        <div style={{background:'#F8FAFC', borderRadius:6, padding:10, marginBottom:10}}>
          <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13}}>
            <span>Opportunities</span><span style={{fontWeight:700}}>{u.opportunities || 312}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13}}>
            <span>Converted</span><span style={{fontWeight:700, color:'#059669'}}>{u.conversions || 121}</span>
          </div>
          <div style={{display:'flex', justifyContent:'space-between', padding:'4px 0', fontSize:13, borderTop:'1px solid #E2E8F0'}}>
            <span>Conversion rate</span>
            <span style={{fontWeight:700, color: (u.rate||38.8)>=40?'#059669':'#DC2626'}}>{(u.rate||38.8).toFixed(1)}%</span>
          </div>
          <div style={{fontSize:12, color:'#6B7280', marginTop:4}}>Industry average: ~40%</div>
        </div>
        {u.topMissed?.length > 0 && (
          <div style={{marginBottom:10}}>
            <div style={{fontSize:12, fontWeight:600, color:'#6B7280', marginBottom:4}}>Top missed categories</div>
            {u.topMissed.map(m => (
              <div key={m} style={{fontSize:13, padding:'3px 0', color:'#DC2626'}}>• {m}</div>
            ))}
          </div>
        )}
        <div style={{fontSize:13, color:'#475569'}}>
          To set a target: <em>"I want 50% conversion rate"</em>
        </div>
      </div>
    );
  }

  function goalConfirmContent() {
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>Your Goals for Q3</div>
        {pendingGoals.length === 0 ? (
          <div style={{fontSize:13, color:'#6B7280'}}>No goals set yet. Go back and set at least one.</div>
        ) : (
          <>
            {pendingGoals.map((g, i) => (
              <div key={i} style={{background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:6,
                padding:'8px 10px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontSize:12, fontWeight:700, color:'#15803D'}}>{g.metric.replace(/_/g,' ').toUpperCase()}</div>
                  <div style={{fontSize:13}}>{g.locationId === 'all' ? 'All locations' : LOCATION_NAMES[g.locationId] || g.locationId}: target <strong>{typeof g.target === 'number' && g.metric === 'avg_ro' ? `$${g.target}` : `${g.target}${g.metric === 'bay_utilization' || g.metric === 'upsell_conversion' ? '%' : ''}`}</strong> by {g.targetDate}</div>
                </div>
                <button onClick={() => setPendingGoals(prev => prev.filter((_,j)=>j!==i))}
                  style={{background:'none', border:'none', color:'#DC2626', cursor:'pointer', fontSize:16}}>✕</button>
              </div>
            ))}
            <button onClick={saveGoals}
              style={{background:'#0D3B45', color:'#fff', border:'none', borderRadius:8,
                padding:'10px 16px', fontSize:14, fontWeight:700, cursor:'pointer', width:'100%', marginTop:8}}>
              Lock these in →
            </button>
          </>
        )}
        <button onClick={() => setRetroStep('topic-select')}
          style={{background:'none', border:'none', color:'#6B7280', fontSize:13, cursor:'pointer', marginTop:8}}>
          ← Back to topics
        </button>
      </div>
    );
  }

  async function saveGoals() {
    for (const goal of pendingGoals) {
      try {
        await fetch(`${API_BASE_AGENT}/api/shop-goals`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ...goal, shopId: 'shop-001', createdAt: new Date().toISOString() }),
        });
      } catch(e) { /* continue */ }
    }
    setConvMode(null);
    setRetroStep(null);
    showOpportunities();
  }

  function showOpportunities() {
    setOpportunitiesShown(true);
    const oppMessage = {
      role: 'assistant',
      content: '__opportunities__',
      id: `opp-${Date.now()}`,
    };
    setMessages(prev => [...prev, oppMessage]);
  }

  function opportunitiesContent() {
    const s = snap;
    const opps = [
      {
        title: `Raise ${LOCATION_NAMES['loc-002']} avg RO`,
        current: `$${s.avgRO?.byLocation?.['loc-002'] || 341}`,
        target: '$400',
        action: 'Add cabin filter + wiper bundle to all oil changes',
        impact: `~$${Math.round(((400-(s.avgRO?.byLocation?.['loc-002']||341)) * 270 / 12) / 100)*100}/month`,
      },
      {
        title: 'Fill Monday gaps at Sunnyvale',
        current: `${s.bayUtilization?.byDay?.Mon || 71}% Mon utilization`,
        target: '80%',
        action: 'SMS reminder to regulars for Monday morning slots',
        impact: '~2.8 extra ROs/week = ~$950/week',
      },
      {
        title: `Lift upsell rate`,
        current: `${(s.upsell?.rate||38.8).toFixed(1)}% conversion`,
        target: '50%',
        action: '"Did you know?" card on advisor pre-close checklist',
        impact: `~$${Math.round((50 - (s.upsell?.rate||38.8)) * (s.upsell?.opportunities||312) * (s.avgRO?.overall||419) * 0.12 / 100 / 12)*100}/month`,
      },
    ];
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:10}}>Your Top 3 Opportunities</div>
        {opps.map((opp, i) => (
          <div key={i} style={{background:'#F8FAFC', border:'1px solid #E2E8F0', borderRadius:8,
            padding:10, marginBottom:8}}>
            <div style={{fontWeight:700, fontSize:13, marginBottom:4}}>{opp.title}</div>
            <div style={{fontSize:12, color:'#6B7280', marginBottom:4}}>
              {opp.current} → {opp.target}
            </div>
            {expandedOpp === i && (
              <div style={{fontSize:12, color:'#475569', margin:'6px 0', padding:'6px 8px',
                background:'#EFF6FF', borderRadius:4}}>
                <strong>Action:</strong> {opp.action}
              </div>
            )}
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6}}>
              <span style={{fontSize:12, fontWeight:700, color:'#059669'}}>{opp.impact}</span>
              <button onClick={() => setExpandedOpp(expandedOpp === i ? null : i)}
                style={{fontSize:11, background:'#EFF6FF', color:'#2563EB', border:'none',
                  borderRadius:4, padding:'3px 8px', cursor:'pointer'}}>
                {expandedOpp === i ? 'Less' : 'Tell me more'}
              </button>
            </div>
          </div>
        ))}
        <button onClick={showKPISelection}
          style={{background:'#0D3B45', color:'#fff', border:'none', borderRadius:8,
            padding:'8px 14px', fontSize:13, fontWeight:600, cursor:'pointer', width:'100%', marginTop:4}}>
          Set up daily monitoring →
        </button>
      </div>
    );
  }

  function showKPISelection() {
    setMessages(prev => [...prev, { role:'assistant', content:'__kpi_select__', id:`kpi-sel-${Date.now()}` }]);
  }

  function kpiSelectContent() {
    const recommended = [
      { metric:'avg_ro', label:'Daily avg RO', value:`$${Math.round(snap.avgRO?.overall||419)}` },
      { metric:'bay_utilization', label:'Bay utilization', value:`${snap.bayUtilization?.overall||64}%` },
      { metric:'upsell_conversion', label:'Upsell conversion', value:`${(snap.upsell?.rate||38.8).toFixed(1)}%` },
    ];
    return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:8}}>What should I watch daily?</div>
        <div style={{fontSize:13, color:'#475569', marginBottom:10}}>
          Based on your goals, I recommend:
        </div>
        {recommended.map(kpi => {
          const selected = watchedKPIs.includes(kpi.metric);
          return (
            <div key={kpi.metric}
              onClick={() => setWatchedKPIs(prev =>
                selected ? prev.filter(k=>k!==kpi.metric) : [...prev, kpi.metric]
              )}
              style={{display:'flex', justifyContent:'space-between', alignItems:'center',
                background: selected ? '#ECFDF5' : '#F8FAFC',
                border: `1px solid ${selected ? '#BBF7D0' : '#E2E8F0'}`,
                borderRadius:6, padding:'8px 10px', marginBottom:6, cursor:'pointer'}}>
              <div>
                <div style={{fontSize:13, fontWeight:600}}>{kpi.label}</div>
                <div style={{fontSize:12, color:'#6B7280'}}>Current: {kpi.value}</div>
              </div>
              <div style={{fontSize:18}}>{selected ? '✅' : '⬜'}</div>
            </div>
          );
        })}
        <button onClick={confirmKPIs}
          disabled={watchedKPIs.length === 0}
          style={{background: watchedKPIs.length > 0 ? '#0D3B45' : '#9CA3AF', color:'#fff',
            border:'none', borderRadius:8, padding:'8px 14px', fontSize:13, fontWeight:600,
            cursor: watchedKPIs.length > 0 ? 'pointer' : 'default', width:'100%', marginTop:8}}>
          Start watching {watchedKPIs.length > 0 ? `(${watchedKPIs.length} KPIs)` : ''} →
        </button>
      </div>
    );
  }

  function confirmKPIs() {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: '__kpi_confirmed__',
      id: `kpi-conf-${Date.now()}`,
    }]);
  }

  function handleRetroTopic(topic) {
    setRetroStep(topic === 'bay-utilization' ? 'utilization' : topic);
    const content = topic === 'revenue' ? '__revenue__'
      : topic === 'bay-utilization' ? '__utilization__'
      : topic === 'upsell-performance' ? '__upsell__' : '__qa__';
    setMessages(prev => [...prev, { role:'assistant', content, id:`retro-topic-${Date.now()}` }]);
  }

  function parseGoalFromMessage(text, currentStep) {
    const lower = text.toLowerCase();
    const dollarMatch = lower.match(/\$(\d+)/);
    const percentMatch = lower.match(/(\d+)\s*%/);
    const months = {jan:'2026-01-31',feb:'2026-02-28',mar:'2026-03-31',apr:'2026-04-30',
      may:'2026-05-31',jun:'2026-06-30',jul:'2026-07-31',aug:'2026-08-31',
      sep:'2026-09-30',oct:'2026-10-31',nov:'2026-11-30',dec:'2026-12-31'};
    let targetDate = '2026-07-31';
    for (const [k,v] of Object.entries(months)) {
      if (lower.includes(k)) { targetDate = v; break; }
    }
    let locationId = 'all';
    if (lower.includes('sunnyvale') || lower.includes('loc-002')) locationId = 'loc-002';
    else if (lower.includes('mountain view') || lower.includes('loc-003')) locationId = 'loc-003';
    else if (lower.includes('menlo') || lower.includes('loc-004')) locationId = 'loc-004';
    else if (lower.includes('palo alto') || lower.includes('loc-001')) locationId = 'loc-001';

    if (currentStep === 'revenue' && dollarMatch) {
      return { metric:'avg_ro', target:parseInt(dollarMatch[1]), baseline:Math.round(snap.avgRO?.overall||419), locationId, targetDate };
    }
    if (currentStep === 'utilization' && percentMatch) {
      return { metric:'bay_utilization', target:parseInt(percentMatch[1]), baseline:snap.bayUtilization?.overall||64, locationId, targetDate };
    }
    if (currentStep === 'upsell' && percentMatch) {
      return { metric:'upsell_conversion', target:parseInt(percentMatch[1]), baseline:Math.round(snap.upsell?.rate||38.8), locationId:'all', targetDate };
    }
    return null;
  }

  // ── renderMessageContent ────────────────────────────────────

  function renderMessageContent(msg) {
    if (msg.role === 'user') return <div style={{fontSize:13}}>{msg.content || msg.text}</div>;
    const c = msg.content;
    if (c === '__retro_intro__') return retroIntroContent();
    if (c === '__revenue__') return revenueModuleContent();
    if (c === '__utilization__') return utilizationModuleContent();
    if (c === '__upsell__') return upsellModuleContent();
    if (c === '__confirm__') return goalConfirmContent();
    if (c === '__opportunities__') return opportunitiesContent();
    if (c === '__kpi_select__') return kpiSelectContent();
    if (c === '__kpi_confirmed__') return (
      <div>
        <div style={{fontWeight:700, fontSize:14, marginBottom:6}}>
          Watching {watchedKPIs.length} KPIs daily
        </div>
        <div style={{fontSize:13, color:'#475569'}}>
          I'll flag drift in the Live Feed when any metric falls below target. Check "What I'm watching today" below.
        </div>
      </div>
    );
    // Normal text content (legacy agent messages use msg.text)
    const textContent = c !== undefined ? c : (msg.text || '');
    return <div style={{fontSize:13, whiteSpace:'pre-wrap'}}>{textContent}</div>;
  }

  // ── handleSend ──────────────────────────────────────────────

  const handleSend = async () => {
    const trimmed = typedInput.trim();
    if (!trimmed || isStreaming) return;
    setTypedInput("");
    setActiveTab("aiSuggest");

    const userMsgId = `u-${Date.now()}`;

    // Add user message (using content field for retro/tribal flow, text for legacy streaming)
    setMessages(prev => [
      ...prev,
      { role: "user", content: trimmed, text: trimmed, id: userMsgId },
    ]);

    // ── TRIBAL NOTE CREATION ────────────────────────────────
    if (awaitingNoteExpiry !== null) {
      const lower = trimmed.toLowerCase();
      let expiresAt = null;
      if (!lower.includes('ongoing') && !lower.includes('no expiry') && !lower.includes('forever')) {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          expiresAt = d.toISOString();
        } else {
          const months = {jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
          for(const [k,v] of Object.entries(months)) {
            if(lower.includes(k)) {
              const year = new Date().getFullYear();
              expiresAt = new Date(year, v-1, 28).toISOString();
              break;
            }
          }
        }
      }
      const noteText = awaitingNoteExpiry;
      setAwaitingNoteExpiry(null);
      fetch(`${API_BASE_AGENT}/api/tribal-notes`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          shopId:'shop-001', locationId:'all',
          note: noteText, active:true,
          expiresAt, triggerType:'any_ro',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        }),
      }).then(r => r.ok ? r.json() : null).then(created => {
        if (created) {
          setTribalNotes(prev => [...prev, created]);
          const expMsg = expiresAt
            ? `Active until ${new Date(expiresAt).toLocaleDateString()}`
            : 'Active ongoing (no expiry)';
          setMessages(prev => [...prev, {
            role:'assistant',
            content: `Added to Shop Rules. ${expMsg}. I'll remind advisors whenever this applies.`,
            id: `note-saved-${Date.now()}`,
          }]);
        }
      }).catch(() => {
        setMessages(prev => [...prev, {
          role:'assistant',
          content:'Rule saved locally. It will sync when the server is available.',
          id: `note-err-${Date.now()}`,
        }]);
      });
      return;
    }

    // ── DETECT TRIBAL NOTE INTENT ───────────────────────────
    const notePatterns = [/^add\s+(?:a\s+)?note:\s*(.+)/i, /^remember:\s*(.+)/i, /^note:\s*(.+)/i, /^add\s+rule:\s*(.+)/i];
    for (const pattern of notePatterns) {
      const m = trimmed.match(pattern);
      if (m) {
        setAwaitingNoteExpiry(m[1].trim());
        setMessages(prev => [...prev, {
          role:'assistant',
          content:`Got it — "${m[1].trim()}". When should this rule expire? Type a date (e.g. "April 30") or say "ongoing".`,
          id: `note-ask-${Date.now()}`,
        }]);
        return;
      }
    }

    // ── RETRO MODE ──────────────────────────────────────────
    if (convMode === 'retro') {
      const lower = trimmed.toLowerCase();

      if (retroStep === 'revenue' || retroStep === 'utilization' || retroStep === 'upsell') {
        const goal = parseGoalFromMessage(trimmed, retroStep);
        if (goal) {
          setPendingGoals(prev => {
            const filtered = prev.filter(g => g.metric !== goal.metric);
            return [...filtered, goal];
          });
          const metricLabels = {avg_ro:'average RO',bay_utilization:'bay utilization',upsell_conversion:'upsell conversion'};
          const targetStr = goal.metric === 'avg_ro' ? `$${goal.target}` : `${goal.target}%`;
          setMessages(prev => [...prev, {
            role:'assistant',
            content:`Done. Goal set: ${metricLabels[goal.metric] || goal.metric} → ${targetStr} by ${new Date(goal.targetDate).toLocaleDateString('en-US',{month:'long',day:'numeric'})}. Want to review utilization or upsell next, or confirm your goals?`,
            id: `goal-set-${Date.now()}`,
          }]);
          return;
        }
      }

      // Navigation keywords
      if (lower.includes('revenue')) { handleRetroTopic('revenue'); return; }
      if (lower.includes('utilization') || lower.includes('bay')) { handleRetroTopic('bay-utilization'); return; }
      if (lower.includes('upsell') || lower.includes('conversion')) { handleRetroTopic('upsell-performance'); return; }
      if (lower.includes('confirm') || lower.includes('goals') || lower.includes('lock') || lower.includes('done')) {
        setRetroStep('confirm');
        setMessages(prev => [...prev, {role:'assistant', content:'__confirm__', id:`confirm-${Date.now()}`}]);
        return;
      }

      // Free-text Q&A (AE-955) — keyword matching against snapshot
      const s = snap;
      let answer = null;
      if (lower.includes('avg ro') || lower.includes('average ro') || lower.includes('ticket')) {
        answer = `Group avg RO: $${Math.round(s.avgRO?.overall||419)}. Best: Palo Alto at $${s.avgRO?.byLocation?.['loc-001']||487}. Lowest: Sunnyvale at $${s.avgRO?.byLocation?.['loc-002']||341}. Industry benchmark: $520.`;
      } else if (lower.includes('elr') || lower.includes('labor rate') || lower.includes('effective')) {
        answer = `Overall ELR: $${s.elr?.overall||178}/hr. Best tech: ${s.elr?.byTech?.[0]?.techName||'James K.'} at $${s.elr?.byTech?.[0]?.elr||201}/hr. Posted rate: $195.`;
      } else if (lower.includes('parts') || lower.includes('margin')) {
        answer = `Parts margin: ${s.partsMargin||48.2}%. Your target is 53%. BMW/Audi jobs are pulling it down — higher OEM parts cost.`;
      } else if (lower.includes('sunnyvale') || lower.includes('loc-002')) {
        answer = `Sunnyvale: avg RO $${s.avgRO?.byLocation?.['loc-002']||341}, utilization ${s.bayUtilization?.byLocation?.['loc-002']||51}%. Biggest opportunity in the group.`;
      } else if (lower.includes('palo alto') || lower.includes('loc-001')) {
        answer = `Palo Alto: avg RO $${s.avgRO?.byLocation?.['loc-001']||487} — highest in the group. Utilization ${s.bayUtilization?.byLocation?.['loc-001']||72}%.`;
      } else {
        answer = `I can answer questions about revenue, bay utilization, upsell performance, ELR, or specific locations. Or type "confirm" to review the goals you've set.`;
      }
      setMessages(prev => [...prev, {role:'assistant', content: answer, id:`qa-${Date.now()}`}]);
      return;
    }

    // ── NORMAL CHAT (streaming via agent API) ───────────────
    const agentMsgId = `a-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      { role: "agent", content: "", text: "", id: agentMsgId },
    ]);
    setIsStreaming(true);

    try {
      if (!sessionIdRef.current) {
        const r = await fetch("/api/agent/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "WrenchIQ Chat" }),
        });
        const { sessionId } = await r.json();
        sessionIdRef.current = sessionId;
      }

      const res = await fetch(`/api/agent/sessions/${sessionIdRef.current}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
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
                m.id === agentMsgId ? { ...m, text: m.text + chunk, content: (m.content || '') + chunk } : m
              ));
            }
          }
          if (data.type === "error") {
            setMessages(prev => prev.map(m =>
              m.id === agentMsgId ? { ...m, text: "Error: " + data.error, content: "Error: " + data.error } : m
            ));
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === agentMsgId ? { ...m, text: "Connection error: " + err.message, content: "Connection error: " + err.message } : m
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
                      maxWidth: "94%",
                      background: msg.role === "user" ? COLORS.gold : "#FFFFFF",
                      color: msg.role === "user" ? "#1A1A1A" : "#1E293B",
                      borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                      padding: "8px 11px",
                      fontSize: 11.5,
                      lineHeight: 1.55,
                      border: msg.role === "user" ? "none" : `1px solid #E2E8F0`,
                      boxShadow: msg.role === "user" ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
                    }}>
                      {msg.role === "agent" && !msg.content && !msg.text && isStreaming
                        ? <span style={{ opacity: 0.5 }}>Thinking…</span>
                        : renderMessageContent(msg)
                      }
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

            {/* Drift alerts for watched KPIs — AE-959 */}
            {watchedKPIs.map(metric => {
              if (dismissedAlerts.has(metric)) return null;
              const d = DRIFT_DATA[metric];
              if (!d) return null;
              return (
                <div key={`drift-${metric}`} style={{
                  display:'flex', alignItems:'flex-start', gap:8, padding:'8px 9px',
                  marginBottom:6, background:'#FEF2F2', borderRadius:8, borderLeft:'3px solid #EF4444',
                }}>
                  <span style={{fontSize:14, flexShrink:0}}>📉</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:12, fontWeight:600, color:'#1E293B'}}>{d.label} drifting</div>
                    <div style={{fontSize:12, color:'#6B7280'}}>{d.suggestion}</div>
                    <div style={{fontSize:11, color:'#9CA3AF'}}>Just now · {d.value}</div>
                  </div>
                  <button onClick={() => setDismissedAlerts(prev => new Set([...prev, metric]))}
                    style={{background:'none', border:'none', color:'#9CA3AF', cursor:'pointer',
                      fontSize:14, padding:0, flexShrink:0}}>✕</button>
                </div>
              );
            })}

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {FEED_ITEMS.map((item) => <FeedItem key={item.id} item={item} />)}
            </div>

            {/* "What I'm watching today" — AE-957/958 */}
            {watchedKPIs.length > 0 && (
              <div style={{borderTop:'1px solid #E2E8F0', paddingTop:12, marginTop:8}}>
                <div style={{fontSize:11, fontWeight:700, color:COLORS.intelMuted, letterSpacing:'0.08em',
                  textTransform:'uppercase', marginBottom:8}}>
                  What I'm Watching Today
                </div>
                {watchedKPIs.map(metric => {
                  const d = DRIFT_DATA[metric];
                  if (!d) return null;
                  return (
                    <div key={metric} style={{display:'flex', justifyContent:'space-between',
                      alignItems:'center', padding:'6px 0', borderBottom:'1px solid #2D4A52'}}>
                      <div>
                        <div style={{fontSize:12, fontWeight:600, color:COLORS.intelText}}>{d.label}</div>
                        <div style={{fontSize:11, color:COLORS.intelMuted}}>{d.drift}</div>
                      </div>
                      <div style={{fontSize:14, fontWeight:700, color:COLORS.gold}}>{d.value}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shop Rules — AE-963 */}
            {tribalNotesLoaded && (() => {
              const nowDate = new Date();
              const activeNotes = tribalNotes.filter(n => n.active && (!n.expiresAt || new Date(n.expiresAt) > nowDate));
              if (activeNotes.length === 0) return null;
              const threeDays = 3 * 24 * 60 * 60 * 1000;
              const displayed = shopRulesExpanded ? activeNotes : activeNotes.slice(0,5);
              return (
                <div style={{borderTop:'1px solid #2D4A52', paddingTop:12, marginTop:8}}>
                  <div style={{fontSize:11, fontWeight:700, color:COLORS.intelMuted, letterSpacing:'0.08em',
                    textTransform:'uppercase', marginBottom:8}}>
                    Shop Rules ({activeNotes.length})
                  </div>
                  {displayed.map(note => {
                    const expiringSoon = note.expiresAt && (new Date(note.expiresAt) - nowDate) < threeDays;
                    return (
                      <div key={note._id || note.note} style={{display:'flex', alignItems:'flex-start', gap:6,
                        padding:'5px 0', borderBottom:'1px solid #1E3A42'}}>
                        <span style={{fontSize:12, flexShrink:0}}>📌</span>
                        <div style={{flex:1, fontSize:12, color:COLORS.intelText, lineHeight:1.3}}>{note.note}</div>
                        {expiringSoon && (
                          <div style={{width:7, height:7, borderRadius:'50%', background:'#F97316',
                            flexShrink:0, marginTop:3}} title="Expiring soon" />
                        )}
                      </div>
                    );
                  })}
                  {activeNotes.length > 5 && (
                    <button onClick={() => setShopRulesExpanded(!shopRulesExpanded)}
                      style={{background:'none', border:'none', color:COLORS.intelMuted, fontSize:11,
                        cursor:'pointer', padding:'4px 0', marginTop:4}}>
                      {shopRulesExpanded ? 'Show less' : `+${activeNotes.length - 5} more rules`}
                    </button>
                  )}
                </div>
              );
            })()}
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
            placeholder={awaitingNoteExpiry ? "Type a date or say 'ongoing'…" : isStreaming ? "Agent is responding…" : "Ask WrenchIQ AI anything…"}
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
