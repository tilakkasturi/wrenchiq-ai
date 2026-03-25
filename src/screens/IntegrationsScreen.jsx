import { useState } from "react";
import {
  Zap, CheckCircle, AlertCircle, Clock, ChevronRight, Search,
  ArrowRight, Settings, Shield, Star, ExternalLink,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ─── Integration Data ─────────────────────────────────────────
const INTEGRATIONS = [
  // ── Customer Communication ─────────────────────────────────
  {
    id: "twilio",
    name: "Twilio",
    tagline: "SMS & MMS for every customer touchpoint",
    category: "Communication",
    status: "connected",
    tier: "Core",
    logo: "T",
    logoColor: "#F22F46",
    logoBg: "#FFF0F2",
    description: "Powers all 2-way texting: estimates, updates, review requests. 2,847 messages sent this month.",
    stats: { label: "Messages this month", value: "2,847" },
    usedFeatures: ["2-way SMS", "MMS photos", "Auto-reminders"],
  },
  {
    id: "podium",
    name: "Podium",
    tagline: "Reviews that build trust automatically",
    category: "Communication",
    status: "connected",
    tier: "Core",
    logo: "P",
    logoColor: "#3B5BFB",
    logoBg: "#EEF2FF",
    description: "Review requests go out automatically 2 hours after vehicle pickup. 23 new reviews this month.",
    stats: { label: "Reviews this month", value: "23 new" },
    usedFeatures: ["Auto review requests", "Review monitoring", "Webchat"],
  },
  {
    id: "google-business",
    name: "Google Business",
    tagline: "Google Messages + review management",
    category: "Communication",
    status: "connected",
    tier: "Core",
    logo: "G",
    logoColor: "#4285F4",
    logoBg: "#EBF3FF",
    description: "Google Business Messages routed to Social Inbox. Reviews monitored and responded to with AI drafts.",
    stats: { label: "Google Rating", value: "4.8★" },
    usedFeatures: ["Google Messages", "Review alerts", "Business profile sync"],
  },
  // ── Social Media ───────────────────────────────────────────
  {
    id: "meta",
    name: "Meta Business",
    tagline: "Instagram & Facebook DMs as repair orders",
    category: "Social Media",
    status: "connected",
    tier: "Core",
    logo: "M",
    logoColor: "#1877F2",
    logoBg: "#EBF5FF",
    description: "Instagram DMs and Facebook Messenger route directly to Social Inbox. AI scores intent and drafts replies.",
    stats: { label: "Leads this month", value: "47 from Meta" },
    usedFeatures: ["Instagram DMs", "Facebook Messenger", "Lead scoring"],
  },
  {
    id: "tiktok",
    name: "TikTok Business",
    tagline: "Turn viewers into car count",
    category: "Social Media",
    status: "connected",
    tier: "Core",
    logo: "TT",
    logoColor: "#010101",
    logoBg: "#F0F0F0",
    description: "TikTok comments and DMs with purchase intent detected and routed to Social Inbox for follow-up.",
    stats: { label: "TikTok leads this month", value: "31" },
    usedFeatures: ["Comment monitoring", "DM capture", "Intent detection"],
  },
  // ── Payments ───────────────────────────────────────────────
  {
    id: "stripe",
    name: "Stripe",
    tagline: "Collect payment before they pick up the car",
    category: "Payments",
    status: "connected",
    tier: "Core",
    logo: "S",
    logoColor: "#635BFF",
    logoBg: "#F0EFFF",
    description: "Digital invoices sent via text. Customers pay with Apple Pay, Google Pay, or card. Auto-reconciled.",
    stats: { label: "Collected this month", value: "$47,240" },
    usedFeatures: ["Digital invoices", "Apple Pay", "Google Pay", "Auto-reconcile"],
  },
  {
    id: "dignifi",
    name: "DigniFi",
    tagline: "Finance repairs customers can't pay today",
    category: "Payments",
    status: "connected",
    tier: "Premium",
    logo: "D",
    logoColor: "#059669",
    logoBg: "#ECFDF5",
    description: "Integrated financing offer added to every estimate over $400. 12 approvals this month, avg ticket $820.",
    stats: { label: "Financed repairs", value: "12 this month" },
    usedFeatures: ["Instant approval", "Estimate integration", "0% promo offers"],
  },
  {
    id: "sunbit",
    name: "Sunbit",
    tagline: "90% approval rate BNPL for auto repair",
    category: "Payments",
    status: "available",
    tier: "Premium",
    logo: "SB",
    logoColor: "#F59E0B",
    logoBg: "#FFFBEB",
    description: "Industry-leading BNPL with 90% approval. Increase average ticket by offering payment plans at the point of estimate.",
    stats: { label: "Industry approval rate", value: "90%" },
    usedFeatures: ["BNPL", "Point-of-estimate offers", "Instant decisioning"],
  },
  // ── Accounting ─────────────────────────────────────────────
  {
    id: "quickbooks",
    name: "QuickBooks Online",
    tagline: "Real-time P&L without the manual entry",
    category: "Accounting",
    status: "connected",
    tier: "Core",
    logo: "QB",
    logoColor: "#2CA01C",
    logoBg: "#F0FAF0",
    description: "Every RO automatically creates an invoice in QuickBooks. Supplier bills tracked. P&L updated in real-time.",
    stats: { label: "Auto-synced invoices", value: "183 this month" },
    usedFeatures: ["Auto invoice sync", "Supplier bills", "P&L sync", "Tax prep"],
  },
  {
    id: "xero",
    name: "Xero",
    tagline: "Alternative accounting for growing shops",
    category: "Accounting",
    status: "available",
    tier: "Core",
    logo: "X",
    logoColor: "#13B5EA",
    logoBg: "#EBF9FF",
    description: "Full-featured accounting alternative. Ideal for shops transitioning from manual bookkeeping.",
    stats: null,
    usedFeatures: ["Invoicing", "Payroll", "Bank reconciliation"],
  },
  {
    id: "gusto",
    name: "Gusto",
    tagline: "Payroll that keeps your techs happy",
    category: "Accounting",
    status: "connected",
    tier: "Core",
    logo: "G",
    logoColor: "#F45D3B",
    logoBg: "#FFF2EF",
    description: "Tech hours from WrenchIQ clock-in/out flow directly to Gusto payroll. Run payroll in 2 clicks.",
    stats: { label: "Techs on payroll", value: "4 active" },
    usedFeatures: ["Time sync", "Tech payroll", "Benefits"],
  },
  // ── Parts ──────────────────────────────────────────────────
  {
    id: "worldpac",
    name: "Worldpac",
    tagline: "OEM-quality parts with dealer-beating prices",
    category: "Parts",
    status: "connected",
    tier: "Core",
    logo: "W",
    logoColor: "#1D4ED8",
    logoBg: "#EFF6FF",
    description: "SpeedDial integration for live pricing, availability, and 1-click ordering. Net-30 account tracked.",
    stats: { label: "Parts ordered (month)", value: "247 lines" },
    usedFeatures: ["Live pricing", "1-click order", "Net-30 tracking"],
  },
  {
    id: "oreilly",
    name: "O'Reilly Auto Parts",
    tagline: "Same-day availability when you need it now",
    category: "Parts",
    status: "connected",
    tier: "Core",
    logo: "OR",
    logoColor: "#DC2626",
    logoBg: "#FEF2F2",
    description: "Real-time inventory at 3 local O'Reilly stores. Counter delivery or delivery to shop.",
    stats: { label: "Stores integrated", value: "3 local" },
    usedFeatures: ["Live inventory", "Counter pricing", "Delivery tracking"],
  },
  {
    id: "partstech",
    name: "PartsTech",
    tagline: "One search across 30+ parts suppliers",
    category: "Parts",
    status: "connected",
    tier: "Premium",
    logo: "PT",
    logoColor: "#7C3AED",
    logoBg: "#F5F3FF",
    description: "Multi-vendor catalog search. WrenchIQ shows cheapest available part per line automatically.",
    stats: { label: "Vendors in search", value: "31 suppliers" },
    usedFeatures: ["Multi-vendor search", "Price comparison", "Auto-source cheapest"],
  },
  // ── Vehicle Data ───────────────────────────────────────────
  {
    id: "nhtsa",
    name: "NHTSA",
    tagline: "Live recall + TSB data on every vehicle",
    category: "Vehicle Data",
    status: "connected",
    tier: "Core",
    logo: "NH",
    logoColor: "#1D4ED8",
    logoBg: "#EFF6FF",
    description: "Real-time recall and Technical Service Bulletin lookups on every VIN. Auto-surfaced on RO creation.",
    stats: { label: "TSBs checked today", value: "37" },
    usedFeatures: ["Recall lookup", "TSB matching", "VIN decode"],
  },
  {
    id: "alldata",
    name: "ALLDATA",
    tagline: "OEM repair procedures for every make/model",
    category: "Vehicle Data",
    status: "connected",
    tier: "Premium",
    logo: "AD",
    logoColor: "#374151",
    logoBg: "#F9FAFB",
    description: "Full OEM wiring diagrams, repair procedures, and labor times. Integrated into RO workflow.",
    stats: { label: "Vehicle database", value: "95K+ models" },
    usedFeatures: ["Repair procedures", "Wiring diagrams", "Labor times"],
  },
  {
    id: "mitchell",
    name: "Mitchell ProDemand",
    tagline: "Labor times that protect your profitability",
    category: "Vehicle Data",
    status: "available",
    tier: "Premium",
    logo: "MP",
    logoColor: "#D97706",
    logoBg: "#FFFBEB",
    description: "Industry-standard labor guides with real-world time adjustments. Estimate accuracy guard.",
    stats: null,
    usedFeatures: ["Labor guides", "Part labor time", "Estimate accuracy"],
  },
  // ── Mobility ───────────────────────────────────────────────
  {
    id: "lyft",
    name: "Lyft Business",
    tagline: "Free ride credits = zero reason to wait at a dealer",
    category: "Mobility",
    status: "available",
    tier: "Premium",
    logo: "LY",
    logoColor: "#FF00BF",
    logoBg: "#FFF0FD",
    description: "Offer customers a Lyft credit when dropping off — removes the biggest hesitation for choosing independent vs. dealer with a loaner.",
    stats: null,
    usedFeatures: ["Lyft credits", "Drop-off assist", "Customer notification"],
  },
  {
    id: "enterprise",
    name: "Enterprise Rent-A-Car",
    tagline: "Loaner coordination without the desk call",
    category: "Mobility",
    status: "available",
    tier: "Premium",
    logo: "ER",
    logoColor: "#166534",
    logoBg: "#F0FDF4",
    description: "Pre-book loaners directly from RO screen. Enterprise API checks availability for your account in real-time.",
    stats: null,
    usedFeatures: ["Loaner booking", "Availability check", "Customer notification"],
  },
];

const CATEGORIES = ["All", "Communication", "Social Media", "Payments", "Accounting", "Parts", "Vehicle Data", "Mobility"];

const STATUS_CONFIG = {
  connected: { label: "Connected", color: "#059669", bg: "#ECFDF5", icon: CheckCircle },
  available: { label: "Available", color: "#6B7280", bg: "#F9FAFB", icon: Zap },
  pending: { label: "Setting Up", color: "#D97706", bg: "#FFFBEB", icon: Clock },
};

const TIER_CONFIG = {
  Core: { color: COLORS.primary, bg: "#EFF6FF" },
  Premium: { color: "#8B5CF6", bg: "#F5F3FF" },
  Enterprise: { color: "#D97706", bg: "#FFFBEB" },
};

// ─── Integration Card ─────────────────────────────────────────
function IntegrationCard({ integration }) {
  const sc = STATUS_CONFIG[integration.status] || STATUS_CONFIG.available;
  const tc = TIER_CONFIG[integration.tier] || TIER_CONFIG.Core;

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "16px", display: "flex", flexDirection: "column", gap: 12, transition: "box-shadow 0.15s" }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)"}
      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
    >
      {/* Header */}
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: integration.logoBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: integration.logo.length > 1 ? 10 : 16, fontWeight: 800, color: integration.logoColor, flexShrink: 0, letterSpacing: -0.5 }}>
          {integration.logo}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{integration.name}</div>
            <span style={{ fontSize: 10, fontWeight: 700, color: tc.color, background: tc.bg, borderRadius: 4, padding: "1px 6px" }}>{integration.tier}</span>
          </div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 1 }}>{integration.tagline}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
          <sc.icon size={13} color={sc.color} />
          <span style={{ fontSize: 11, fontWeight: 600, color: sc.color }}>{sc.label}</span>
        </div>
      </div>

      {/* Description */}
      <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{integration.description}</div>

      {/* Stats */}
      {integration.stats && (
        <div style={{ background: "#F9FAFB", borderRadius: 8, padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted }}>{integration.stats.label}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: COLORS.textPrimary }}>{integration.stats.value}</span>
        </div>
      )}

      {/* Features */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {integration.usedFeatures.map((f, i) => (
          <span key={i} style={{ fontSize: 10, background: "#F3F4F6", color: COLORS.textSecondary, borderRadius: 4, padding: "2px 7px", fontWeight: 600 }}>{f}</span>
        ))}
      </div>

      {/* Action */}
      <button style={{
        width: "100%", padding: "8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
        background: integration.status === "connected" ? "#F3F4F6" : COLORS.accent,
        color: integration.status === "connected" ? COLORS.textSecondary : "#fff",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        {integration.status === "connected" ? (
          <><Settings size={13} /> Configure</>
        ) : (
          <><Zap size={13} /> Connect</>
        )}
      </button>
    </div>
  );
}

// ─── Category Stats ───────────────────────────────────────────
function IntegrationStats() {
  const connected = INTEGRATIONS.filter(i => i.status === "connected").length;
  const total = INTEGRATIONS.length;

  const kpis = [
    { label: "Connected Integrations", value: `${connected}/${total}`, sub: "Active right now", color: "#059669" },
    { label: "Time Saved / Week", value: "14.2 hrs", sub: "vs. manual data entry", color: "#3B82F6" },
    { label: "Data Syncs Today", value: "1,847", sub: "Across all integrations", color: "#8B5CF6" },
    { label: "Revenue Attributed", value: "$8,240", sub: "From social integrations", color: COLORS.accent },
  ];

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 24 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{k.label}</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary }}>{k.value}</div>
          <div style={{ fontSize: 11, color: k.color, fontWeight: 600, marginTop: 2 }}>{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function IntegrationsScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = INTEGRATIONS.filter(i => {
    const matchSearch = !search || i.name.toLowerCase().includes(search.toLowerCase()) || i.tagline.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || i.category === category;
    return matchSearch && matchCategory;
  });

  const connectedCount = INTEGRATIONS.filter(i => i.status === "connected").length;

  return (
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>Integrations Hub</h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            {connectedCount} of {INTEGRATIONS.length} integrations active · WrenchIQ connects everything your shop needs
          </p>
        </div>
        <div style={{ background: "linear-gradient(135deg, #0D3B45, #1A5C6B)", borderRadius: 10, padding: "10px 16px", color: "#fff", display: "flex", gap: 10, alignItems: "center" }}>
          <Shield size={16} color="#FF6B35" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700 }}>All integrations SOC 2 compliant</div>
            <div style={{ fontSize: 10, opacity: 0.7 }}>Data encrypted in transit and at rest</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <IntegrationStats />

      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 10, padding: "7px 12px", border: "1px solid #E5E7EB", flex: 1, maxWidth: 300 }}>
          <Search size={14} color={COLORS.textMuted} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search integrations…"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1 }}
          />
        </div>

        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 8, border: "1px solid",
                borderColor: category === cat ? COLORS.primary : "#E5E7EB",
                background: category === cat ? COLORS.primary : "transparent",
                color: category === cat ? "#fff" : COLORS.textSecondary,
                cursor: "pointer",
              }}
            >
              {cat}
              {cat !== "All" && (
                <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.7 }}>
                  ({INTEGRATIONS.filter(i => i.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Category Groups */}
      {category === "All" ? (
        CATEGORIES.slice(1).map(cat => {
          const catIntegrations = filtered.filter(i => i.category === cat);
          if (!catIntegrations.length) return null;
          return (
            <div key={cat} style={{ marginBottom: 32 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{cat}</div>
                <div style={{ height: 1, flex: 1, background: "#E5E7EB" }} />
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  {catIntegrations.filter(i => i.status === "connected").length}/{catIntegrations.length} connected
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
                {catIntegrations.map(i => <IntegrationCard key={i.id} integration={i} />)}
              </div>
            </div>
          );
        })
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 14 }}>
          {filtered.map(i => <IntegrationCard key={i.id} integration={i} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "60px 0", color: COLORS.textMuted }}>
          <Zap size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <div style={{ fontSize: 15, fontWeight: 600 }}>No integrations match your search</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Don't see a tool you need? <span style={{ color: COLORS.accent, cursor: "pointer", fontWeight: 600 }}>Request an integration →</span></div>
        </div>
      )}
    </div>
  );
}
