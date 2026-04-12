import { useState } from "react";
import {
  MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Star, DollarSign, Car, BarChart3, Users, Zap, ChevronRight,
  Brain, ArrowUp, ArrowDown, Minus, RefreshCw, MessageSquare,
  Shield, Target, Clock,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import AIInsightsStrip from "../components/AIInsightsStrip";

// ─── 100-Location Data ────────────────────────────────────────
const REGIONS = [
  { id: "west", label: "West Coast", count: 28 },
  { id: "southwest", label: "Southwest", count: 19 },
  { id: "midwest", label: "Midwest", count: 24 },
  { id: "southeast", label: "Southeast", count: 16 },
  { id: "northeast", label: "Northeast", count: 13 },
];

function generateLocations() {
  const cities = [
    // West
    { city: "San Francisco, CA", region: "west", lat: 37.77, lng: -122.41 },
    { city: "Los Angeles, CA", region: "west", lat: 34.05, lng: -118.24 },
    { city: "San Diego, CA", region: "west", lat: 32.72, lng: -117.16 },
    { city: "Portland, OR", region: "west", lat: 45.52, lng: -122.68 },
    { city: "Seattle, WA", region: "west", lat: 47.60, lng: -122.33 },
    { city: "Palo Alto, CA", region: "west", lat: 37.44, lng: -122.14 },
    { city: "Sacramento, CA", region: "west", lat: 38.58, lng: -121.49 },
    { city: "Fresno, CA", region: "west", lat: 36.74, lng: -119.79 },
    { city: "San Jose, CA", region: "west", lat: 37.34, lng: -121.89 },
    { city: "Oakland, CA", region: "west", lat: 37.80, lng: -122.27 },
    // Southwest
    { city: "Phoenix, AZ", region: "southwest", lat: 33.45, lng: -112.07 },
    { city: "Scottsdale, AZ", region: "southwest", lat: 33.49, lng: -111.92 },
    { city: "Las Vegas, NV", region: "southwest", lat: 36.17, lng: -115.14 },
    { city: "Tucson, AZ", region: "southwest", lat: 32.22, lng: -110.97 },
    { city: "Albuquerque, NM", region: "southwest", lat: 35.08, lng: -106.65 },
    { city: "Denver, CO", region: "southwest", lat: 39.74, lng: -104.98 },
    { city: "Colorado Springs, CO", region: "southwest", lat: 38.83, lng: -104.82 },
    // Midwest
    { city: "Chicago, IL", region: "midwest", lat: 41.88, lng: -87.63 },
    { city: "Dallas, TX", region: "midwest", lat: 32.78, lng: -96.80 },
    { city: "Houston, TX", region: "midwest", lat: 29.76, lng: -95.37 },
    { city: "Austin, TX", region: "midwest", lat: 30.27, lng: -97.74 },
    { city: "Minneapolis, MN", region: "midwest", lat: 44.98, lng: -93.27 },
    { city: "Indianapolis, IN", region: "midwest", lat: 39.77, lng: -86.16 },
    { city: "Kansas City, MO", region: "midwest", lat: 39.10, lng: -94.58 },
    { city: "Columbus, OH", region: "midwest", lat: 39.96, lng: -82.99 },
    // Southeast
    { city: "Miami, FL", region: "southeast", lat: 25.77, lng: -80.19 },
    { city: "Orlando, FL", region: "southeast", lat: 28.54, lng: -81.38 },
    { city: "Atlanta, GA", region: "southeast", lat: 33.75, lng: -84.39 },
    { city: "Charlotte, NC", region: "southeast", lat: 35.23, lng: -80.84 },
    { city: "Nashville, TN", region: "southeast", lat: 36.17, lng: -86.78 },
    { city: "Tampa, FL", region: "southeast", lat: 27.95, lng: -82.46 },
    // Northeast
    { city: "New York, NY", region: "northeast", lat: 40.71, lng: -74.01 },
    { city: "Boston, MA", region: "northeast", lat: 42.36, lng: -71.06 },
    { city: "Philadelphia, PA", region: "northeast", lat: 39.95, lng: -75.17 },
    { city: "Washington, DC", region: "northeast", lat: 38.91, lng: -77.04 },
    { city: "Baltimore, MD", region: "northeast", lat: 39.29, lng: -76.61 },
  ];

  const statuses = ["excellent", "excellent", "excellent", "good", "good", "good", "good", "caution", "alert"];
  const gmNames = ["James Wilson", "Maria Santos", "Robert Chen", "Aisha Johnson", "Mike O'Brien", "Sarah Kim", "David Park", "Elena Rodriguez", "Tom Bradley", "Lisa Chang"];

  return Array.from({ length: 100 }, (_, i) => {
    const cityData = cities[i % cities.length];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const revenue = status === "excellent" ? 38000 + Math.random() * 25000
      : status === "good" ? 25000 + Math.random() * 15000
      : status === "caution" ? 15000 + Math.random() * 12000
      : 8000 + Math.random() * 10000;
    const rating = status === "excellent" ? 4.6 + Math.random() * 0.4
      : status === "good" ? 4.2 + Math.random() * 0.4
      : status === "caution" ? 3.8 + Math.random() * 0.4
      : 3.0 + Math.random() * 0.8;

    return {
      id: `loc-${String(i + 1).padStart(3, "0")}`,
      number: i + 1,
      city: cityData.city,
      region: cityData.region,
      address: `${100 + i * 23} ${["Main St", "Oak Ave", "Commerce Blvd", "Central Ave", "Market St"][i % 5]}`,
      gm: gmNames[i % gmNames.length],
      status,
      healthScore: status === "excellent" ? 82 + Math.floor(Math.random() * 18)
        : status === "good" ? 65 + Math.floor(Math.random() * 17)
        : status === "caution" ? 45 + Math.floor(Math.random() * 20)
        : 20 + Math.floor(Math.random() * 25),
      weekRevenue: Math.round(revenue),
      monthRevenue: Math.round(revenue * 4.2),
      rating: Math.round(rating * 10) / 10,
      carCount: Math.round(15 + Math.random() * 30),
      techEfficiency: Math.round(72 + Math.random() * 25),
      approvalRate: Math.round(64 + Math.random() * 32),
      comebackRate: status === "alert" ? Math.round(8 + Math.random() * 12)
        : Math.round(2 + Math.random() * 6),
      bays: [4, 6, 8, 10, 12][i % 5],
      openIssues: status === "alert" ? Math.round(2 + Math.random() * 4)
        : status === "caution" ? Math.round(1 + Math.random() * 2)
        : 0,
      lat: cityData.lat + (Math.random() - 0.5) * 2,
      lng: cityData.lng + (Math.random() - 0.5) * 2,
    };
  });
}

const ALL_LOCATIONS = generateLocations();

const STATUS_CONFIG = {
  excellent: { label: "Excellent", color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  good: { label: "Good", color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  caution: { label: "Caution", color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  alert: { label: "Alert", color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
};

// ─── Corporate KPIs ───────────────────────────────────────────
function CorporateKPIs() {
  const total = ALL_LOCATIONS.reduce((s, l) => s + l.weekRevenue, 0);
  const avgRating = (ALL_LOCATIONS.reduce((s, l) => s + l.rating, 0) / ALL_LOCATIONS.length).toFixed(1);
  const alertCount = ALL_LOCATIONS.filter(l => l.status === "alert").length;
  const excellentCount = ALL_LOCATIONS.filter(l => l.status === "excellent").length;
  const avgApproval = Math.round(ALL_LOCATIONS.reduce((s, l) => s + l.approvalRate, 0) / ALL_LOCATIONS.length);

  const kpis = [
    { label: "Network Revenue (Week)", value: `$${(total / 1000).toFixed(0)}K`, trend: "+12.4%", trendDir: "up", icon: DollarSign, color: COLORS.accent },
    { label: "Avg Google Rating", value: avgRating, trend: "+0.2", trendDir: "up", icon: Star, color: "#F59E0B" },
    { label: "Locations Excellent", value: `${excellentCount}/100`, trend: "+4 from last week", trendDir: "up", icon: CheckCircle, color: "#059669" },
    { label: "Locations Need Attention", value: String(alertCount), trend: `${alertCount} need action`, trendDir: alertCount > 3 ? "down" : "neutral", icon: AlertTriangle, color: alertCount > 3 ? "#DC2626" : "#D97706" },
    { label: "Avg Approval Rate", value: `${avgApproval}%`, trend: "+3%", trendDir: "up", icon: Target, color: "#8B5CF6" },
  ];

  return (
    <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
      {kpis.map((k, i) => (
        <div key={i} style={{ flex: 1, background: "#fff", borderRadius: 12, border: "1px solid #E5E7EB", padding: "14px 16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{k.label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: COLORS.textPrimary }}>{k.value}</div>
              <div style={{ fontSize: 11, marginTop: 3, color: k.trendDir === "up" ? "#059669" : k.trendDir === "down" ? "#DC2626" : COLORS.textMuted, fontWeight: 600 }}>
                {k.trendDir === "up" ? "↑" : k.trendDir === "down" ? "↓" : ""} {k.trend}
              </div>
            </div>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: k.color + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <k.icon size={18} color={k.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Simplified US Map Grid ───────────────────────────────────
function LocationHeatGrid({ locations, onSelectLocation }) {
  const statusCounts = {
    excellent: locations.filter(l => l.status === "excellent").length,
    good: locations.filter(l => l.status === "good").length,
    caution: locations.filter(l => l.status === "caution").length,
    alert: locations.filter(l => l.status === "alert").length,
  };

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "18px 20px", marginBottom: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>Network Health Map</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>All 100 locations · Click any to drill in</div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot }} />
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{cfg.label} ({statusCounts[key]})</span>
            </div>
          ))}
        </div>
      </div>

      {/* Dot grid representing 100 locations */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, padding: "16px", background: "#F8FAFC", borderRadius: 10 }}>
        {locations.slice(0, 100).map((loc) => {
          const cfg = STATUS_CONFIG[loc.status] || STATUS_CONFIG.good;
          return (
            <button
              key={loc.id}
              onClick={() => onSelectLocation(loc)}
              title={`${loc.city} — ${cfg.label}\n$${(loc.weekRevenue / 1000).toFixed(0)}K/wk · ${loc.rating}★ · Health: ${loc.healthScore}`}
              style={{
                width: 20,
                height: 20,
                borderRadius: 5,
                background: cfg.dot,
                border: "2px solid transparent",
                cursor: "pointer",
                opacity: 0.85,
                transition: "all 0.1s",
                flexShrink: 0,
                position: "relative",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.3)"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.zIndex = "10"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "0.85"; e.currentTarget.style.zIndex = "1"; }}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Morning Brief ─────────────────────────────────────────
function AIMorningBrief() {
  const alerts = ALL_LOCATIONS.filter(l => l.status === "alert").slice(0, 2);
  const best = [...ALL_LOCATIONS].sort((a, b) => b.weekRevenue - a.weekRevenue)[0];

  const insights = [
    {
      type: "alert",
      color: "#EF4444",
      icon: AlertTriangle,
      title: `${alerts.length} locations need immediate attention`,
      body: `${alerts.map(l => l.city).join(" and ")} both show elevated comeback rates and declining ratings. Shared root cause: technician gap in advanced transmission service. Recommend deploying training module 7C to both GMs today.`,
      action: "Deploy Training",
    },
    {
      type: "win",
      color: "#059669",
      icon: CheckCircle,
      title: `${best.city} is your top performer this week — $${(best.weekRevenue / 1000).toFixed(0)}K`,
      body: `Health score: ${best.healthScore}/100. Their GM (${best.gm}) implemented the WrenchIQ social scheduling flow. 31% of their new customers came from Instagram. This model should be replicated at 14 similar-sized locations.`,
      action: "Share Best Practice",
    },
    {
      type: "opportunity",
      color: "#8B5CF6",
      icon: Zap,
      title: "Parts inventory sharing saves $12,400 this week",
      body: "23 locations over-ordered on brake pads (common after winter promotion). 18 locations are short. Cross-location fulfillment routing is ready — approve to execute and save same-day rush freight costs.",
      action: "Approve Transfer",
    },
    {
      type: "insight",
      color: "#3B82F6",
      icon: Brain,
      title: "Tuesday AROup-sell pattern identified across top 10 locations",
      body: "Locations that send the WrenchIQ pre-arrival prep message (night before) see 23% higher estimate approval rates. Only 41 of 100 locations have this enabled. Enable for remaining 59 locations?",
      action: "Enable for All",
    },
  ];

  return (
    <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "18px 22px", color: "#fff", marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,107,53,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={18} color="#FF6B35" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>AI Network Brief · Thursday Morning</div>
          <div style={{ fontSize: 11, opacity: 0.65 }}>4 cross-location insights require your attention</div>
        </div>
        <div style={{ marginLeft: "auto", fontSize: 11, opacity: 0.5 }}>Updated 6:00 AM</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {insights.map((ins, i) => (
          <div key={i} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
            <ins.icon size={15} color={ins.color} style={{ marginTop: 2, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{ins.title}</div>
              <div style={{ fontSize: 11, opacity: 0.75, lineHeight: 1.4, marginBottom: 8 }}>{ins.body}</div>
              <button style={{ fontSize: 11, fontWeight: 700, color: ins.color, background: "rgba(255,255,255,0.12)", border: `1px solid ${ins.color}50`, borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                {ins.action} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Location Detail Panel ────────────────────────────────────
function LocationDetail({ location, onClose }) {
  const cfg = STATUS_CONFIG[location.status] || STATUS_CONFIG.good;
  const leaderboard = [...ALL_LOCATIONS]
    .sort((a, b) => b.healthScore - a.healthScore)
    .findIndex(l => l.id === location.id) + 1;

  const metrics = [
    { label: "Weekly Revenue", value: `$${location.weekRevenue.toLocaleString()}`, trend: "+8%" },
    { label: "Google Rating", value: `${location.rating}★`, trend: location.rating >= 4.5 ? "+0.1" : "-0.2" },
    { label: "Approval Rate", value: `${location.approvalRate}%`, trend: "+3%" },
    { label: "Tech Efficiency", value: `${location.techEfficiency}%`, trend: "+2%" },
    { label: "Comeback Rate", value: `${location.comebackRate}%`, trend: location.comebackRate > 5 ? "⚠ High" : "Good" },
    { label: "Car Count (wk)", value: String(location.carCount), trend: "+4" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ background: cfg.bg, borderBottom: `2px solid ${cfg.dot}30`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</span>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>· #{location.number}</span>
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>{location.city}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{location.address} · GM: {location.gm}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Network Rank</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: leaderboard <= 10 ? "#059669" : leaderboard <= 50 ? "#2563EB" : "#D97706" }}>
            #{leaderboard}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>of 100</div>
        </div>
      </div>

      {/* Health Score */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Location Health Score</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color }}>{location.healthScore}/100</div>
        </div>
        <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: 8, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.color})`, width: `${location.healthScore}%`, borderRadius: 4, transition: "width 0.5s" }} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", borderRight: i % 2 === 0 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.trend.includes("⚠") ? "#DC2626" : "#059669", fontWeight: 600 }}>{m.trend}</div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {location.openIssues > 0 && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={14} color="#DC2626" />
            <div style={{ flex: 1, fontSize: 12, color: "#991B1B" }}>
              <strong>{location.openIssues} open issues</strong> need attention at this location.
            </div>
            <button style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
              Review
            </button>
          </div>
        )}
        <button style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <BarChart3 size={14} /> Full Location Report
        </button>
        <button style={{ background: "#F3F4F6", color: COLORS.textSecondary, border: "none", borderRadius: 8, padding: "10px", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <MessageSquare size={14} /> Message GM
        </button>
      </div>
    </div>
  );
}

// ─── Location Table ───────────────────────────────────────────
function LocationTable({ locations, onSelectLocation }) {
  const [sort, setSort] = useState({ key: "healthScore", dir: "desc" });

  const sorted = [...locations].sort((a, b) => {
    const va = a[sort.key], vb = b[sort.key];
    return sort.dir === "desc" ? vb - va : va - vb;
  });

  const SortHeader = ({ col, label }) => (
    <th
      onClick={() => setSort(s => s.key === col ? { key: col, dir: s.dir === "desc" ? "asc" : "desc" } : { key: col, dir: "desc" })}
      style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, cursor: "pointer", whiteSpace: "nowrap", userSelect: "none" }}
    >
      {label} {sort.key === col ? (sort.dir === "desc" ? "↓" : "↑") : ""}
    </th>
  );

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #E5E7EB", fontWeight: 700, fontSize: 15 }}>
        All Locations ({locations.length})
      </div>
      <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, background: "#F9FAFB", zIndex: 1 }}>
            <tr>
              <SortHeader col="number" label="#" />
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Location</th>
              <SortHeader col="healthScore" label="Health" />
              <SortHeader col="weekRevenue" label="Wk Revenue" />
              <SortHeader col="rating" label="Rating" />
              <SortHeader col="approvalRate" label="Approval %" />
              <SortHeader col="techEfficiency" label="Tech Eff." />
              <SortHeader col="comebackRate" label="Comeback" />
              <th style={{ padding: "10px 14px" }}></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(loc => {
              const cfg = STATUS_CONFIG[loc.status] || STATUS_CONFIG.good;
              return (
                <tr
                  key={loc.id}
                  onClick={() => onSelectLocation(loc)}
                  style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                  onMouseLeave={e => e.currentTarget.style.background = ""}
                >
                  <td style={{ padding: "10px 14px", color: COLORS.textMuted, fontSize: 11, fontWeight: 600 }}>#{loc.number}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{loc.city}</div>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>{loc.gm} · {loc.bays} bays</div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: cfg.color }}>{loc.healthScore}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>${(loc.weekRevenue / 1000).toFixed(0)}K</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Star size={11} color="#F59E0B" fill="#F59E0B" />
                      <span style={{ fontWeight: 600 }}>{loc.rating}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ flex: 1, height: 4, background: "#F3F4F6", borderRadius: 2, width: 48 }}>
                        <div style={{ height: 4, background: loc.approvalRate >= 80 ? "#059669" : loc.approvalRate >= 65 ? "#3B82F6" : "#F59E0B", borderRadius: 2, width: `${loc.approvalRate}%` }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: 11 }}>{loc.approvalRate}%</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px", fontWeight: 600, fontSize: 12 }}>{loc.techEfficiency}%</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: loc.comebackRate > 6 ? "#DC2626" : loc.comebackRate > 3 ? "#D97706" : "#059669" }}>
                      {loc.comebackRate}%
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <ChevronRight size={14} color={COLORS.textMuted} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────
export default function MultiLocationScreen() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [activeRegion, setActiveRegion] = useState("all");
  const [view, setView] = useState("map"); // "map" | "list"

  const filteredLocations = activeRegion === "all"
    ? ALL_LOCATIONS
    : ALL_LOCATIONS.filter(l => l.region === activeRegion);

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AIInsightsStrip insights={[
        { icon: "🔴", text: "2 locations in alert — Phoenix 7 and Dallas 4. Combined Google rating drop: 3.6★ avg", action: "Review Locations", value: "Action needed", color: "#EF4444" },
        { icon: "💰", text: "Network hit $2.1M this week — top 10 locations drove 34% of revenue. Houston 3 is #1", action: "See Top 10", value: "$2.1M", color: "#22C55E" },
        { icon: "📦", text: "Cross-location parts transfer approved — $12,400 in excess inventory redistributed", action: "Track Transfer", value: "$12,400 saved", color: "#3B82F6" },
        { icon: "🎯", text: "59 locations haven't enabled pre-arrival AI message — enable all to lift approval rate 23%", action: "Enable All", value: "+23% ARO", color: "#F59E0B" },
      ]} />
    <div style={{ padding: "24px 28px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>
            Great Water 360 Auto Care — Network Command
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
            100 locations · 5 regions · Real-time operational intelligence
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* Region Filter */}
          <div style={{ display: "flex", gap: 4 }}>
            {[{ key: "all", label: "All (100)" }, ...REGIONS.map(r => ({ key: r.id, label: `${r.label.split(" ")[0]} (${r.count})` }))].map(f => (
              <button
                key={f.key}
                onClick={() => setActiveRegion(f.key)}
                style={{
                  fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 6, border: "1px solid",
                  borderColor: activeRegion === f.key ? COLORS.primary : "#E5E7EB",
                  background: activeRegion === f.key ? COLORS.primary : "transparent",
                  color: activeRegion === f.key ? "#fff" : COLORS.textSecondary,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div style={{ display: "flex", background: "#F3F4F6", borderRadius: 8, padding: 2 }}>
            {[{ key: "map", label: "Map" }, { key: "list", label: "List" }].map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                style={{ padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: view === v.key ? "#fff" : "transparent", color: view === v.key ? COLORS.textPrimary : COLORS.textMuted, boxShadow: view === v.key ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <CorporateKPIs />

      {/* AI Brief */}
      <AIMorningBrief />

      {/* Main Content */}
      <div style={{ display: "grid", gridTemplateColumns: selectedLocation ? "1fr 320px" : "1fr", gap: 20 }}>
        <div>
          {view === "map"
            ? <LocationHeatGrid locations={filteredLocations} onSelectLocation={setSelectedLocation} />
            : null}
          <LocationTable locations={filteredLocations} onSelectLocation={setSelectedLocation} />
        </div>

        {/* Location Detail */}
        {selectedLocation && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Location Detail</div>
              <button onClick={() => setSelectedLocation(null)} style={{ background: "#F3F4F6", border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: COLORS.textSecondary }}>
                Close
              </button>
            </div>
            <LocationDetail location={selectedLocation} onClose={() => setSelectedLocation(null)} />
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
