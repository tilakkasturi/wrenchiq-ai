import { useState } from "react";
import {
  Shield, Star, Heart, TrendingUp, MessageSquare, CheckCircle,
  Clock, Car, DollarSign, ChevronRight, Zap, Phone, Camera,
  ThumbsUp, AlertTriangle, User, BarChart3, Award, ArrowUp,
  FileText, Send, Bell, Repeat,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import AIInsightsStrip from "../components/AIInsightsStrip";

// ─── Customer Trust Data ──────────────────────────────────────
const CUSTOMERS_TRUST = [
  {
    id: "ct-001",
    name: "Sarah Chen",
    avatar: "SC",
    avatarBg: "#6366F1",
    since: "2019",
    visits: 14,
    ltv: 8420,
    trustScore: 97,
    npsScore: 10,
    googleReviews: 2,
    referrals: 3,
    lastVisit: "Feb 28, 2026",
    nextPredicted: "May 2026",
    vehicle: "2022 Tesla Model 3",
    mileage: "34,200 mi",
    approvalRate: "100%",
    avgTicket: 602,
    tier: "Champion",
    tierColor: "#F59E0B",
    tags: ["Always approves", "Refers friends", "Text preferred"],
    aiNote: "Sarah has referred 3 customers who together spent $6,840. She's due for Tesla annual service in May. Her trust score is maximum — a priority retention customer.",
    timeline: [
      { date: "Feb 28", event: "Annual Service", amount: 487, rating: 5, type: "visit" },
      { date: "Jan 15", event: "Tire Rotation + Alignment", amount: 189, rating: 5, type: "visit" },
      { date: "Nov 2025", event: "Left 5★ Google review", type: "review" },
      { date: "Oct 2025", event: "Referred David Park", type: "referral" },
      { date: "Sep 2025", event: "Brake Inspection + Pad Replace", amount: 620, rating: 5, type: "visit" },
    ],
  },
  {
    id: "ct-002",
    name: "David Kim",
    avatar: "DK",
    avatarBg: "#059669",
    since: "2020",
    visits: 9,
    ltv: 5230,
    trustScore: 71,
    npsScore: 7,
    googleReviews: 0,
    referrals: 0,
    lastVisit: "Feb 15, 2026",
    nextPredicted: "Apr 2026",
    vehicle: "2019 Honda CR-V",
    mileage: "87,400 mi",
    approvalRate: "73%",
    avgTicket: 581,
    tier: "Loyal",
    tierColor: "#3B82F6",
    tags: ["Price-conscious", "Declines $800+", "Email preferred"],
    aiNote: "David declines 27% of recommendations — pattern shows he hesitates above $800. Framing expensive work as 'Phase 1/Phase 2' increases approval. He has never left a review. A well-timed ask after this visit could unlock his first one.",
    timeline: [
      { date: "Feb 15", event: "90K Service + Diagnostic", amount: 780, rating: 4, type: "visit" },
      { date: "Aug 2025", event: "Oil Change + Tire Rotation", amount: 142, rating: 4, type: "visit" },
      { date: "Jan 2025", event: "Front Brakes", amount: 685, rating: 5, type: "visit" },
      { date: "Oct 2024", event: "Declined: Transmission Flush ($289)", type: "declined" },
    ],
  },
  {
    id: "ct-003",
    name: "Maria Santos",
    avatar: "MS",
    avatarBg: "#DC2626",
    since: "2023",
    visits: 3,
    ltv: 1240,
    trustScore: 45,
    npsScore: 5,
    googleReviews: 0,
    referrals: 0,
    lastVisit: "Jan 10, 2026",
    nextPredicted: "Jun 2026",
    vehicle: "2018 Toyota Camry",
    mileage: "62,100 mi",
    approvalRate: "55%",
    avgTicket: 413,
    tier: "At-Risk",
    tierColor: "#EF4444",
    tags: ["Recently declined work", "No review yet", "Spanish preferred"],
    aiNote: "Maria declined two recommendations in her last visit. Her trust score has dropped 12 points. She also mentioned she 'called around' for pricing before booking. Recommend a personal follow-up call with a bilingual advisor and a free tire pressure check offer.",
    timeline: [
      { date: "Jan 10", event: "Oil Change", amount: 89, rating: 3, type: "visit" },
      { date: "Jan 10", event: "Declined: Air Filter + Cabin Filter ($89)", type: "declined" },
      { date: "Sep 2025", event: "Brake Pads (approved after second ask)", amount: 420, rating: 4, type: "visit" },
      { date: "Jun 2025", event: "First Visit — Oil Change", amount: 89, rating: 4, type: "visit" },
    ],
  },
  {
    id: "ct-004",
    name: "James Park",
    avatar: "JP",
    avatarBg: "#7C3AED",
    since: "2021",
    visits: 7,
    ltv: 12450,
    trustScore: 88,
    npsScore: 9,
    googleReviews: 1,
    referrals: 1,
    lastVisit: "Mar 4, 2026",
    nextPredicted: "Jun 2026",
    vehicle: "2020 BMW X3",
    mileage: "58,900 mi",
    approvalRate: "91%",
    avgTicket: 1779,
    tier: "VIP",
    tierColor: "#8B5CF6",
    tags: ["High LTV", "BMW specialty", "Waiting estimate now"],
    aiNote: "James is waiting on a $1,847 estimate for brake vibration. He has been waiting 2 hours. Send a proactive update NOW — TSB 34-16-20 applies to his vehicle. Include the TSB reference in the message to demonstrate expertise. High risk of losing this estimate due to wait time.",
    timeline: [
      { date: "Mar 4", event: "In-Shop Now — Estimate Pending", type: "active", amount: 1847 },
      { date: "Dec 2025", event: "BMW Annual Service + Brakes", amount: 2340, rating: 5, type: "visit" },
      { date: "Sep 2025", event: "Coolant Flush + Inspection", amount: 890, rating: 5, type: "visit" },
      { date: "Jun 2025", event: "Left 5★ Google Review", type: "review" },
    ],
  },
];

const TIER_CONFIG = {
  Champion: { color: "#F59E0B", bg: "#FFFBEB", icon: Award },
  VIP: { color: "#8B5CF6", bg: "#F5F3FF", icon: Star },
  Loyal: { color: "#3B82F6", bg: "#EFF6FF", icon: Heart },
  "At-Risk": { color: "#EF4444", bg: "#FEF2F2", icon: AlertTriangle },
};

// ─── Trust Score Ring ─────────────────────────────────────────
function TrustScoreRing({ score, size = 80 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color = score >= 85 ? "#059669" : score >= 65 ? "#3B82F6" : score >= 45 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
        <div style={{ fontSize: size < 70 ? 14 : 18, fontWeight: 800, color, lineHeight: 1 }}>{score}</div>
        {size >= 70 && <div style={{ fontSize: 9, color: COLORS.textMuted }}>Trust</div>}
      </div>
    </div>
  );
}

// ─── Network Trust KPIs ───────────────────────────────────────
function TrustKPIs() {
  const avg = Math.round(CUSTOMERS_TRUST.reduce((s, c) => s + c.trustScore, 0) / CUSTOMERS_TRUST.length);
  const kpis = [
    { label: "Avg Trust Score", value: avg, sub: "Shop average", icon: Shield, color: "#059669" },
    { label: "Google Rating", value: "4.8★", sub: "↑ 0.2 this month", icon: Star, color: "#F59E0B" },
    { label: "NPS Score", value: "+71", sub: "Industry avg: +42", icon: ThumbsUp, color: "#3B82F6" },
    { label: "Repeat Rate", value: "78%", sub: "90-day return", icon: Repeat, color: "#8B5CF6" },
    { label: "Reviews (Month)", value: "23", sub: "17 organic, 6 prompted", icon: MessageSquare, color: COLORS.accent },
  ];

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary }}>{typeof k.value === "number" ? k.value : k.value}</div>
              <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>{k.sub}</div>
            </div>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={17} color={k.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Customer Card ────────────────────────────────────────────
function CustomerTrustCard({ customer, selected, onClick }) {
  const TierIcon = TIER_CONFIG[customer.tier]?.icon || Shield;
  const tierCfg = TIER_CONFIG[customer.tier] || TIER_CONFIG.Loyal;

  return (
    <div
      onClick={onClick}
      style={{
        padding: "14px 16px",
        borderBottom: "1px solid #F3F4F6",
        cursor: "pointer",
        background: selected ? "#FFF7F5" : "#fff",
        borderLeft: selected ? `3px solid ${COLORS.accent}` : "3px solid transparent",
      }}
      onMouseEnter={e => !selected && (e.currentTarget.style.background = "#F9FAFB")}
      onMouseLeave={e => !selected && (e.currentTarget.style.background = "#fff")}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: customer.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
          {customer.avatar}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{customer.name}</div>
            <TrustScoreRing score={customer.trustScore} size={42} />
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: tierCfg.color, background: tierCfg.bg, borderRadius: 4, padding: "1px 6px", display: "flex", alignItems: "center", gap: 3 }}>
              <TierIcon size={8} /> {customer.tier}
            </span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>{customer.visits} visits</span>
            <span style={{ fontSize: 10, color: COLORS.textMuted }}>·</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "#059669" }}>${customer.ltv.toLocaleString()} LTV</span>
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{customer.vehicle}</div>
        </div>
      </div>
      {customer.aiNote && (
        <div style={{ marginTop: 8, background: "linear-gradient(90deg, rgba(255,107,53,0.08), transparent)", borderRadius: 6, padding: "6px 8px", borderLeft: `2px solid ${COLORS.accent}` }}>
          <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4 }}>{customer.aiNote.slice(0, 90)}...</div>
        </div>
      )}
    </div>
  );
}

// ─── Timeline Event ───────────────────────────────────────────
function TimelineEvent({ event }) {
  const typeConfig = {
    visit: { color: COLORS.primary, bg: "#EFF6FF", icon: Car },
    review: { color: "#F59E0B", bg: "#FFFBEB", icon: Star },
    referral: { color: "#059669", bg: "#ECFDF5", icon: Heart },
    declined: { color: "#EF4444", bg: "#FEF2F2", icon: AlertTriangle },
    active: { color: COLORS.accent, bg: "#FFF7F5", icon: Clock },
  };
  const cfg = typeConfig[event.type] || typeConfig.visit;

  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingBottom: 14 }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <cfg.icon size={14} color={cfg.color} />
        </div>
        <div style={{ width: 1, flex: 1, background: "#F3F4F6", marginTop: 4, minHeight: 14 }} />
      </div>
      <div style={{ flex: 1, paddingTop: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{event.event}</div>
          {event.amount && (
            <span style={{ fontSize: 12, fontWeight: 700, color: event.type === "declined" ? "#EF4444" : "#059669" }}>
              {event.type === "declined" ? "Declined" : `$${event.amount.toLocaleString()}`}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 2, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{event.date}</span>
          {event.rating && (
            <div style={{ display: "flex", gap: 2 }}>
              {Array.from({ length: event.rating }).map((_, i) => <Star key={i} size={9} color="#F59E0B" fill="#F59E0B" />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Customer Detail Panel ────────────────────────────────────
function CustomerDetail({ customer }) {
  const tierCfg = TIER_CONFIG[customer.tier] || TIER_CONFIG.Loyal;
  const TierIcon = tierCfg.icon;

  const actions = [
    { label: "Send Review Request", icon: Star, color: "#F59E0B", action: "Twilio SMS template: review request" },
    { label: "Text Customer", icon: MessageSquare, color: "#3B82F6", action: "Open text composer" },
    { label: "Pre-Visit Prep Message", icon: Bell, color: "#8B5CF6", action: "Send AI pre-visit message" },
    { label: "Send Referral Link", icon: Heart, color: "#059669", action: "Create referral code" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile Header */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <div style={{ background: `linear-gradient(135deg, ${customer.avatarBg}20, ${customer.avatarBg}05)`, padding: "20px", borderBottom: "1px solid #F3F4F6" }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: customer.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
              {customer.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>{customer.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, color: tierCfg.color, background: tierCfg.bg, borderRadius: 5, padding: "2px 8px", display: "flex", alignItems: "center", gap: 4 }}>
                  <TierIcon size={9} /> {customer.tier}
                </span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Customer since {customer.since} · {customer.vehicle}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{customer.mileage}</div>
            </div>
            <TrustScoreRing score={customer.trustScore} size={72} />
          </div>
        </div>

        {/* Key Metrics */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderBottom: "1px solid #F3F4F6" }}>
          {[
            { label: "Lifetime Value", value: `$${customer.ltv.toLocaleString()}`, icon: DollarSign, color: "#059669" },
            { label: "Visits", value: customer.visits, icon: Car, color: "#3B82F6" },
            { label: "Approval Rate", value: customer.approvalRate, icon: CheckCircle, color: COLORS.accent },
            { label: "Avg Ticket", value: `$${customer.avgTicket}`, icon: FileText, color: "#8B5CF6" },
          ].map((m, i) => (
            <div key={i} style={{ padding: "12px 14px", borderRight: i < 3 ? "1px solid #F3F4F6" : "none", textAlign: "center" }}>
              <m.icon size={14} color={m.color} style={{ margin: "0 auto 4px", display: "block" }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{m.value}</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m.label}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        <div style={{ padding: "12px 16px", display: "flex", gap: 6, flexWrap: "wrap" }}>
          {customer.tags.map((tag, i) => (
            <span key={i} style={{ fontSize: 11, background: "#F3F4F6", borderRadius: 6, padding: "3px 8px", color: COLORS.textSecondary, fontWeight: 600 }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* AI Insight */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "14px 16px", color: "#fff" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <Zap size={14} color="#FF6B35" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35" }}>WrenchIQ AI INSIGHT</span>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>{customer.aiNote}</div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Quick Actions</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {actions.map((act, i) => (
            <button
              key={i}
              style={{ background: act.color + "10", border: `1px solid ${act.color}30`, borderRadius: 8, padding: "8px 12px", cursor: "pointer", display: "flex", gap: 8, alignItems: "center", fontSize: 12, fontWeight: 600, color: act.color }}
            >
              <act.icon size={14} />
              {act.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
        <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14 }}>Relationship Timeline</div>
        {customer.timeline.map((event, i) => (
          <TimelineEvent key={i} event={event} />
        ))}
      </div>

      {/* Next Service Prediction */}
      <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
          <Clock size={14} color="#8B5CF6" />
          <div style={{ fontWeight: 700, fontSize: 13 }}>Next Service Prediction</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", background: "#F5F3FF", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#7C3AED" }}>Predicted return: {customer.nextPredicted}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>Based on mileage pattern + service history</div>
          </div>
          <button style={{ background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 8, padding: "7px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            Send Reminder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function TrustEngineScreen() {
  const [selectedId, setSelectedId] = useState("ct-001");
  const [filter, setFilter] = useState("all");

  const selectedCustomer = CUSTOMERS_TRUST.find(c => c.id === selectedId);

  const FILTERS = [
    { key: "all", label: "All Customers" },
    { key: "Champion", label: "Champions" },
    { key: "VIP", label: "VIP" },
    { key: "Loyal", label: "Loyal" },
    { key: "At-Risk", label: "At-Risk" },
  ];

  const filtered = filter === "all"
    ? CUSTOMERS_TRUST
    : CUSTOMERS_TRUST.filter(c => c.tier === filter);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <AIInsightsStrip insights={[
        { icon: "⚡", text: "James Park estimate pending 2 hrs — HIGH LTV ($12,450). Send TSB reference text NOW", action: "Text James", value: "$1,847 at risk", color: "#EF4444" },
        { icon: "⭐", text: "David Kim hasn't left a review in 9 visits — 4★ avg, ideal time to ask", action: "Send Review Request", value: "5★ potential", color: "#F59E0B" },
        { icon: "📉", text: "Maria Santos trust score dropped 12 pts — 2 declined items. Call before she goes to a dealer", action: "Call Maria", value: "At-Risk", color: "#EF4444" },
        { icon: "❤️", text: "Sarah Chen referred 3 customers = $6,840 in additional revenue — send thank-you gift card", action: "Send Gift", value: "Champion", color: "#22C55E" },
      ]} />
    <div style={{ padding: "24px 28px 0", display: "flex", flexDirection: "column", flex: 1 }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: COLORS.textPrimary }}>Trust Engine</h1>
          <div style={{ background: "linear-gradient(90deg, #F59E0B, #EF4444)", borderRadius: 20, padding: "2px 12px", fontSize: 11, fontWeight: 700, color: "#fff" }}>DIFFERENTIATOR</div>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
          Every customer relationship quantified. Build loyalty that no dealership can buy.
        </p>
      </div>

      {/* KPIs */}
      <TrustKPIs />

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", gap: 0, background: "#fff", borderRadius: 16, border: "1px solid #E5E7EB", overflow: "hidden", minHeight: 0 }}>
        {/* Customer List */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #E5E7EB" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #F3F4F6", display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 6, border: "1px solid",
                  borderColor: filter === f.key ? COLORS.accent : "#E5E7EB",
                  background: filter === f.key ? COLORS.accent + "15" : "transparent",
                  color: filter === f.key ? COLORS.accent : COLORS.textSecondary,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.map(c => (
              <CustomerTrustCard
                key={c.id}
                customer={c}
                selected={selectedId === c.id}
                onClick={() => setSelectedId(c.id)}
              />
            ))}
          </div>
        </div>

        {/* Detail View */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#FAFAF8" }}>
          {selectedCustomer && <CustomerDetail customer={selectedCustomer} />}
        </div>
      </div>
    </div>
    </div>
  );
}
