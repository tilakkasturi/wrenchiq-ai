import { useState } from "react";
import {
  MapPin, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Star, DollarSign, Car, BarChart3, Users, Zap, ChevronRight,
  Brain, ArrowUp, ArrowDown, Minus, RefreshCw, MessageSquare,
  Shield, Target, Clock, Building2,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import AIInsightsStrip from "../components/AIInsightsStrip";
import { EWG_DISTRICTS, EWG_LOCATIONS } from "../data/demoData";

// ─── Location generation ──────────────────────────────────────
const DISTRICT_CITIES = {
  norcal:    ["San Francisco, CA", "Oakland, CA", "San Jose, CA", "Sacramento, CA", "Fresno, CA", "Santa Rosa, CA", "Stockton, CA", "Modesto, CA"],
  socal:     ["Los Angeles, CA", "San Diego, CA", "Riverside, CA", "Anaheim, CA", "Long Beach, CA", "Bakersfield, CA", "Irvine, CA", "Santa Ana, CA", "Oxnard, CA", "Ventura, CA"],
  pacific:   ["Seattle, WA", "Portland, OR", "Tacoma, WA", "Bellevue, WA", "Eugene, OR", "Spokane, WA"],
  southwest: ["Phoenix, AZ", "Scottsdale, AZ", "Las Vegas, NV", "Tucson, AZ", "Albuquerque, NM", "Denver, CO", "Colorado Springs, CO", "Henderson, NV", "Chandler, AZ", "Reno, NV"],
  texas:     ["Dallas, TX", "Houston, TX", "Austin, TX", "San Antonio, TX", "Fort Worth, TX", "Plano, TX", "Arlington, TX", "El Paso, TX"],
  midwest:   ["Chicago, IL", "Minneapolis, MN", "Indianapolis, IN", "Kansas City, MO", "Columbus, OH", "Milwaukee, WI", "Detroit, MI", "Cleveland, OH", "Cincinnati, OH", "St. Louis, MO"],
  southeast: ["Miami, FL", "Orlando, FL", "Atlanta, GA", "Charlotte, NC", "Nashville, TN", "Tampa, FL", "Jacksonville, FL", "Raleigh, NC", "New Orleans, LA"],
  northeast: ["New York, NY", "Boston, MA", "Philadelphia, PA", "Washington, DC", "Baltimore, MD", "Pittsburgh, PA", "Hartford, CT"],
};

function generateLocations() {
  const statuses = ["excellent", "excellent", "excellent", "good", "good", "good", "good", "caution", "alert"];
  const gmNames = ["James Wilson", "Maria Santos", "Robert Chen", "Aisha Johnson", "Mike O'Brien",
    "Sarah Kim", "David Park", "Elena Rodriguez", "Tom Bradley", "Lisa Chang",
    "Andre Williams", "Jen Nakamura", "Raj Patel", "Christine Ford", "Omar Hassan"];

  let locNum = 1;
  const all = [];

  for (const district of EWG_DISTRICTS) {
    const cities = DISTRICT_CITIES[district.id] || [];
    for (let i = 0; i < district.count; i++) {
      const city = cities[i % cities.length];
      const status = statuses[Math.floor((locNum * 7 + i * 3) % statuses.length)];
      const revenue = status === "excellent" ? 38000 + (locNum * 137 % 25000)
        : status === "good" ? 25000 + (locNum * 97 % 15000)
        : status === "caution" ? 15000 + (locNum * 73 % 12000)
        : 8000 + (locNum * 53 % 10000);

      all.push({
        id: `gwg-${String(locNum).padStart(3, "0")}`,
        number: locNum,
        city,
        district: district.id,
        districtLabel: district.label,
        address: `${100 + locNum * 23} ${["Main St", "Oak Ave", "Commerce Blvd", "Central Ave", "Market St"][locNum % 5]}`,
        gm: gmNames[locNum % gmNames.length],
        status,
        healthScore: status === "excellent" ? 82 + (locNum * 11 % 18)
          : status === "good" ? 65 + (locNum * 9 % 17)
          : status === "caution" ? 45 + (locNum * 7 % 20)
          : 20 + (locNum * 5 % 25),
        weekRevenue: Math.round(revenue),
        monthRevenue: Math.round(revenue * 4.2),
        rating: status === "excellent" ? Math.round((4.6 + (locNum * 0.03 % 0.4)) * 10) / 10
          : status === "good" ? Math.round((4.2 + (locNum * 0.03 % 0.4)) * 10) / 10
          : status === "caution" ? Math.round((3.8 + (locNum * 0.03 % 0.4)) * 10) / 10
          : Math.round((3.0 + (locNum * 0.08 % 0.8)) * 10) / 10,
        carCount: 15 + (locNum * 3 % 30),
        techEfficiency: 72 + (locNum * 5 % 25),
        approvalRate: 64 + (locNum * 4 % 32),
        comebackRate: status === "alert" ? 8 + (locNum * 2 % 12) : 2 + (locNum * 1 % 6),
        bays: [4, 6, 8, 10, 12][locNum % 5],
        openIssues: status === "alert" ? 2 + (locNum % 4) : status === "caution" ? locNum % 2 : 0,
      });
      locNum++;
    }
  }
  return all;
}

const ALL_LOCATIONS = generateLocations();

// Convert EWG_LOCATIONS (real Cornerstone data) to screen format
const CORNERSTONE_LOCATIONS = EWG_LOCATIONS.map((loc, i) => ({
  id: loc.id,
  number: `C${i + 1}`,
  city: loc.name,
  district: "norcal",
  districtLabel: "Northern California",
  address: loc.address,
  gm: loc.manager,
  isCornerstone: true,
  avgRO: loc.avgRO,
  laborRate: loc.laborRate,
  bays: loc.bays,
  techs: loc.techs,
  status: loc.status === "flagship" ? "excellent"
    : loc.status === "strong" ? "good"
    : loc.status === "coaching" ? "caution"
    : "caution",
  healthScore: loc.status === "flagship" ? 94 : loc.status === "strong" ? 81 : loc.status === "coaching" ? 52 : 44,
  weekRevenue: Math.round(loc.avgRO * loc.bays * 0.9),
  monthRevenue: Math.round(loc.avgRO * loc.bays * 0.9 * 4.2),
  rating: loc.status === "flagship" ? 4.9 : loc.status === "strong" ? 4.7 : loc.status === "coaching" ? 4.2 : 4.4,
  carCount: Math.round(loc.bays * 4.5),
  techEfficiency: loc.status === "flagship" ? 91 : loc.status === "strong" ? 84 : loc.status === "coaching" ? 68 : 72,
  approvalRate: loc.status === "flagship" ? 87 : loc.status === "strong" ? 82 : loc.status === "coaching" ? 71 : 74,
  comebackRate: loc.status === "flagship" ? 1.2 : loc.status === "strong" ? 2.1 : loc.status === "coaching" ? 5.8 : 4.2,
  openIssues: loc.status === "coaching" ? 2 : 0,
  threeC_compliance: loc.status === "flagship" ? 94 : loc.status === "strong" ? 88 : loc.status === "coaching" ? 41 : 76,
  networkId: "EWG-CA-007",
}));

const STATUS_CONFIG = {
  excellent: { label: "Excellent", color: "#059669", bg: "#ECFDF5", dot: "#10B981" },
  good:      { label: "Good",      color: "#2563EB", bg: "#EFF6FF", dot: "#3B82F6" },
  caution:   { label: "Caution",   color: "#D97706", bg: "#FFFBEB", dot: "#F59E0B" },
  alert:     { label: "Alert",     color: "#DC2626", bg: "#FEF2F2", dot: "#EF4444" },
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
    { label: "Avg Google Rating",       value: avgRating,                        trend: "+0.2",   trendDir: "up", icon: Star,       color: "#F59E0B" },
    { label: "Locations Excellent",     value: `${excellentCount}/100`,          trend: "+4 this week", trendDir: "up", icon: CheckCircle, color: "#059669" },
    { label: "Need Attention",          value: String(alertCount),               trend: `${alertCount} need action`, trendDir: alertCount > 3 ? "down" : "neutral", icon: AlertTriangle, color: alertCount > 3 ? "#DC2626" : "#D97706" },
    { label: "Avg Approval Rate",       value: `${avgApproval}%`,               trend: "+3%",    trendDir: "up", icon: Target,     color: "#8B5CF6" },
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

// ─── District Summary Cards ───────────────────────────────────
function DistrictSummaryCards({ activeDistrict, onSelectDistrict }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
      {EWG_DISTRICTS.map(d => {
        const locs = ALL_LOCATIONS.filter(l => l.district === d.id);
        const alerts = locs.filter(l => l.status === "alert").length;
        const avgHealth = Math.round(locs.reduce((s, l) => s + l.healthScore, 0) / (locs.length || 1));
        const isNorCal = d.id === "norcal";
        const isActive = activeDistrict === d.id;

        return (
          <button
            key={d.id}
            onClick={() => onSelectDistrict(isActive ? "all" : d.id)}
            style={{
              background: isActive ? COLORS.primary : isNorCal ? "#F0F9FF" : "#fff",
              border: `2px solid ${isActive ? COLORS.primary : isNorCal ? "#BAE6FD" : "#E5E7EB"}`,
              borderRadius: 12,
              padding: "14px 16px",
              textAlign: "left",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#fff" : COLORS.textPrimary }}>
                {d.label}
                {isNorCal && !isActive && (
                  <span style={{ marginLeft: 6, fontSize: 10, background: COLORS.accent + "20", color: COLORS.accent, borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>
                    CORNERSTONE
                  </span>
                )}
              </div>
              {alerts > 0 && (
                <div style={{ fontSize: 10, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", borderRadius: 4, padding: "2px 6px" }}>
                  {alerts} alert
                </div>
              )}
            </div>
            <div style={{ fontSize: 11, color: isActive ? "rgba(255,255,255,0.7)" : COLORS.textMuted, marginBottom: 8 }}>
              {d.count} locations · {d.director}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: isActive ? "rgba(255,255,255,0.6)" : COLORS.textMuted }}>Avg Health</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: isActive ? "#fff" : avgHealth >= 70 ? "#059669" : avgHealth >= 50 ? "#D97706" : "#DC2626" }}>{avgHealth}</div>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Northern California District Detail ─────────────────────
function NorCalDistrict({ onSelectLocation }) {
  const complianceAlert = CORNERSTONE_LOCATIONS.find(l => l.threeC_compliance < 60);

  return (
    <div style={{ marginBottom: 20 }}>
      {/* District header */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)", borderRadius: 14, padding: "16px 20px", color: "#fff", marginBottom: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.8 }}>EWG District</div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Northern California</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>12 locations · District Director: Taylor Mitchell · Member since 2002</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 2 }}>District Avg RO</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#FF6B35" }}>$459</div>
            <div style={{ fontSize: 11, opacity: 0.6 }}>vs $341 network avg</div>
          </div>
        </div>

        {/* 4 Cornerstone location KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 16 }}>
          {CORNERSTONE_LOCATIONS.map(loc => {
            const cfg = STATUS_CONFIG[loc.status];
            const hasAlert = loc.threeC_compliance < 60;
            return (
              <button
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                style={{ background: "rgba(255,255,255,0.08)", border: `1px solid ${hasAlert ? "#FF6B35" : "rgba(255,255,255,0.15)"}`, borderRadius: 10, padding: "12px 14px", textAlign: "left", cursor: "pointer" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{loc.city.replace("Cornerstone — ", "")}</div>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.dot, marginTop: 2 }} />
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#FF6B35", marginBottom: 2 }}>
                  ${loc.avgRO}
                </div>
                <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 8 }}>avg RO</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ fontSize: 10 }}>
                    <span style={{ opacity: 0.6 }}>Health </span>
                    <span style={{ fontWeight: 700, color: loc.healthScore >= 80 ? "#10B981" : loc.healthScore >= 60 ? "#F59E0B" : "#EF4444" }}>{loc.healthScore}</span>
                  </div>
                  <div style={{ fontSize: 10 }}>
                    <span style={{ opacity: 0.6 }}>3C </span>
                    <span style={{ fontWeight: 700, color: loc.threeC_compliance >= 75 ? "#10B981" : "#EF4444" }}>{loc.threeC_compliance}%</span>
                  </div>
                </div>
                {hasAlert && (
                  <div style={{ marginTop: 6, fontSize: 10, color: "#FF6B35", fontWeight: 700 }}>
                    3C compliance alert
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3C Compliance alert banner */}
      {complianceAlert && (
        <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 14 }}>
          <AlertTriangle size={15} color="#DC2626" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#991B1B", marginBottom: 2 }}>
              3C Compliance Alert — {complianceAlert.city.replace("Cornerstone — ", "")} location
            </div>
            <div style={{ fontSize: 12, color: "#B91C1C" }}>
              Manager {complianceAlert.gm} — 3C score {complianceAlert.threeC_compliance}% is below EWG minimum (75%).
              {" "}Marcus Webb (lead tech) has an active RO with a 34/100 3C score. Coaching recommended.
            </div>
          </div>
          <button style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Review 3C
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Network Heat Grid ────────────────────────────────────────
function LocationHeatGrid({ locations, onSelectLocation }) {
  const total = locations.length;
  const statusCounts = {
    excellent: locations.filter(l => l.status === "excellent").length,
    good:      locations.filter(l => l.status === "good").length,
    caution:   locations.filter(l => l.status === "caution").length,
    alert:     locations.filter(l => l.status === "alert").length,
  };

  // Group all locations by district, preserving district order
  const byDistrict = EWG_DISTRICTS.map(d => ({
    district: d,
    locs: locations.filter(l => l.district === d.id),
  })).filter(g => g.locs.length > 0);

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", padding: "18px 20px", marginBottom: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>100 Rooftops — Network Health</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{total} locations across {byDistrict.length} districts · Click any rooftop to drill in</div>
        </div>
        <div style={{ display: "flex", gap: 14 }}>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: cfg.dot }} />
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{cfg.label} <strong style={{ color: COLORS.textPrimary }}>{statusCounts[key]}</strong></span>
            </div>
          ))}
        </div>
      </div>

      {/* District groups */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2, background: "#F8FAFC", borderRadius: 10, padding: "14px 16px" }}>
        {byDistrict.map(({ district, locs }) => {
          const dAlerts  = locs.filter(l => l.status === "alert").length;
          const dAvg     = Math.round(locs.reduce((s, l) => s + l.healthScore, 0) / locs.length);
          const isNorCal = district.id === "norcal";

          return (
            <div key={district.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 8px", borderRadius: 8, background: isNorCal ? "rgba(13,59,69,0.05)" : "transparent", border: isNorCal ? "1px solid rgba(13,59,69,0.12)" : "1px solid transparent" }}>
              {/* District label */}
              <div style={{ width: 148, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: isNorCal ? COLORS.primary : COLORS.textPrimary, display: "flex", alignItems: "center", gap: 5 }}>
                  {district.label}
                  {isNorCal && (
                    <span style={{ fontSize: 9, background: COLORS.accent + "25", color: COLORS.accent, borderRadius: 3, padding: "1px 4px", fontWeight: 800 }}>CRN</span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>
                  {locs.length} locations · avg {dAvg}
                  {dAlerts > 0 && <span style={{ color: "#DC2626", fontWeight: 700 }}> · {dAlerts} alert</span>}
                </div>
              </div>

              {/* Rooftop dots */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flex: 1 }}>
                {locs.map(loc => {
                  const cfg = STATUS_CONFIG[loc.status] || STATUS_CONFIG.good;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => onSelectLocation(loc)}
                      title={`${loc.city}\n${district.label} · ${cfg.label} · Health: ${loc.healthScore}`}
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 5,
                        background: cfg.dot,
                        border: "2px solid transparent",
                        cursor: "pointer",
                        opacity: 0.88,
                        transition: "transform 0.1s, opacity 0.1s",
                        flexShrink: 0,
                        position: "relative",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.35)"; e.currentTarget.style.opacity = "1"; e.currentTarget.style.zIndex = "10"; }}
                      onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.zIndex = "1"; }}
                    />
                  );
                })}
              </div>

              {/* District health bar */}
              <div style={{ width: 72, flexShrink: 0 }}>
                <div style={{ height: 5, background: "#E5E7EB", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: 5, borderRadius: 3, background: dAvg >= 70 ? "#10B981" : dAvg >= 50 ? "#F59E0B" : "#EF4444", width: `${dAvg}%` }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: dAvg >= 70 ? "#059669" : dAvg >= 50 ? "#D97706" : "#DC2626", marginTop: 3, textAlign: "right" }}>
                  {dAvg}/100
                </div>
              </div>
            </div>
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
      type: "alert", color: "#EF4444", icon: AlertTriangle,
      title: `${alerts.length} locations need immediate attention`,
      body: `${alerts.map(l => l.city).join(" and ")} show elevated comeback rates and declining ratings. Shared root cause: technician gap in advanced transmission service. Recommend deploying training module 7C to both GMs today.`,
      action: "Deploy Training",
    },
    {
      type: "win", color: "#059669", icon: CheckCircle,
      title: "Cornerstone Palo Alto — NorCal district leader · $535 avg RO",
      body: `Health score 94/100. 3C compliance 94% — above EWG standard. GM James Kowalski's pre-arrival AI message workflow is driving 31% of new customers from digital channels. Recommended for district-wide rollout.`,
      action: "Share Best Practice",
    },
    {
      type: "opportunity", color: "#8B5CF6", icon: Zap,
      title: "Parts inventory sharing saves $12,400 this week",
      body: "23 locations over-ordered on brake pads after winter promotion. 18 locations are short. Cross-location fulfillment routing is ready — approve to execute and eliminate same-day rush freight costs.",
      action: "Approve Transfer",
    },
    {
      type: "insight", color: "#3B82F6", icon: Brain,
      title: "NorCal district: Mountain View 3C gap dragging district avg",
      body: "Cornerstone Mountain View 3C compliance at 41% — lowest in NorCal district. Marcus Webb's ROs average 38/100. District avg RO is $459 vs $535 at flagship. Estimated revenue gap: $18K/month if brought to district standard.",
      action: "View Coaching Plan",
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
  const allForRank = location.isCornerstone ? CORNERSTONE_LOCATIONS : ALL_LOCATIONS;
  const leaderboard = [...allForRank].sort((a, b) => b.healthScore - a.healthScore)
    .findIndex(l => l.id === location.id) + 1;

  const metrics = location.isCornerstone ? [
    { label: "Avg RO", value: `$${location.avgRO}`, trend: location.avgRO >= 500 ? "Above avg" : "Below avg" },
    { label: "Google Rating", value: `${location.rating}★`, trend: location.rating >= 4.5 ? "+0.1" : "-0.2" },
    { label: "Approval Rate", value: `${location.approvalRate}%`, trend: "+3%" },
    { label: "Tech Efficiency", value: `${location.techEfficiency}%`, trend: "+2%" },
    { label: "Comeback Rate", value: `${location.comebackRate}%`, trend: location.comebackRate > 5 ? "⚠ High" : "Good" },
    { label: "3C Compliance", value: `${location.threeC_compliance}%`, trend: location.threeC_compliance >= 75 ? "EWG compliant" : "⚠ Below standard" },
  ] : [
    { label: "Weekly Revenue", value: `$${location.weekRevenue.toLocaleString()}`, trend: "+8%" },
    { label: "Google Rating", value: `${location.rating}★`, trend: location.rating >= 4.5 ? "+0.1" : "-0.2" },
    { label: "Approval Rate", value: `${location.approvalRate}%`, trend: "+3%" },
    { label: "Tech Efficiency", value: `${location.techEfficiency}%`, trend: "+2%" },
    { label: "Comeback Rate", value: `${location.comebackRate}%`, trend: location.comebackRate > 5 ? "⚠ High" : "Good" },
    { label: "Car Count (wk)", value: String(location.carCount), trend: "+4" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E5E7EB", overflow: "hidden" }}>
      <div style={{ background: cfg.bg, borderBottom: `2px solid ${cfg.dot}30`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.dot }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: 0.5 }}>{cfg.label}</span>
            {location.isCornerstone && (
              <span style={{ fontSize: 10, background: COLORS.accent + "20", color: COLORS.accent, borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>
                CORNERSTONE
              </span>
            )}
          </div>
          <div style={{ fontWeight: 800, fontSize: 18, color: COLORS.textPrimary }}>{location.city.replace("Cornerstone — ", "")}</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>{location.address} · GM: {location.gm}</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{location.districtLabel} District</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>Health Score</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: location.healthScore >= 80 ? "#059669" : location.healthScore >= 60 ? "#D97706" : "#DC2626" }}>
            {location.healthScore}
          </div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>/ 100</div>
        </div>
      </div>

      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F3F4F6" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Location Health Score</div>
        </div>
        <div style={{ height: 8, background: "#F3F4F6", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ height: 8, background: `linear-gradient(90deg, ${cfg.dot}, ${cfg.color})`, width: `${location.healthScore}%`, borderRadius: 4 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ padding: "12px 16px", borderBottom: "1px solid #F3F4F6", borderRight: i % 2 === 0 ? "1px solid #F3F4F6" : "none" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>{m.value}</div>
            <div style={{ fontSize: 11, color: m.trend.includes("⚠") ? "#DC2626" : m.trend.includes("compliant") ? "#059669" : m.trend.includes("avg") ? (m.trend.includes("Above") ? "#059669" : "#D97706") : "#059669", fontWeight: 600 }}>{m.trend}</div>
          </div>
        ))}
      </div>

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {location.openIssues > 0 && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", display: "flex", gap: 8, alignItems: "center" }}>
            <AlertTriangle size={14} color="#DC2626" />
            <div style={{ flex: 1, fontSize: 12, color: "#991B1B" }}>
              <strong>{location.openIssues} open issues</strong> need attention at this location.
            </div>
            <button style={{ background: "#DC2626", color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Review</button>
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
function LocationTable({ locations, onSelectLocation, isNorCal }) {
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
        {isNorCal ? "Other Northern California Locations" : `All Locations (${locations.length})`}
      </div>
      <div style={{ overflowX: "auto", maxHeight: 420, overflowY: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ position: "sticky", top: 0, background: "#F9FAFB", zIndex: 1 }}>
            <tr>
              <SortHeader col="number" label="#" />
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>Location</th>
              <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, fontSize: 11, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 }}>District</th>
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
                  <td style={{ padding: "10px 14px", fontSize: 11, color: COLORS.textMuted }}>{loc.districtLabel}</td>
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
  const [activeDistrict, setActiveDistrict] = useState("all");
  const [view, setView] = useState("map");

  const isNorCal = activeDistrict === "norcal";

  const filteredLocations = activeDistrict === "all"
    ? ALL_LOCATIONS
    : ALL_LOCATIONS.filter(l => l.district === activeDistrict);

  const locationCount = activeDistrict === "all"
    ? 100
    : EWG_DISTRICTS.find(d => d.id === activeDistrict)?.count ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <AIInsightsStrip insights={[
        { icon: "🔴", text: "2 locations in alert — Phoenix and Dallas. Combined Google rating drop to 3.6★", action: "Review Locations", value: "Action needed", color: "#EF4444" },
        { icon: "💰", text: "Network hit $2.1M this week — NorCal district leads with $459 avg RO vs $341 network avg", action: "See Districts", value: "$2.1M", color: "#22C55E" },
        { icon: "📦", text: "Cross-location parts transfer approved — $12,400 in excess inventory redistributed", action: "Track Transfer", value: "$12,400 saved", color: "#3B82F6" },
        { icon: "🎯", text: "NorCal — Mountain View 3C compliance at 41%. Marcus Webb coaching plan recommended", action: "View Plan", value: "Action needed", color: "#F59E0B" },
      ]} />
      <div style={{ padding: "24px 28px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px", color: COLORS.textPrimary }}>
              Expert Wrenchers Groups (EWG) — Network Command
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.textMuted }}>
              100 locations · 8 districts · Real-time operational intelligence
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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

        {/* District Cards */}
        <DistrictSummaryCards activeDistrict={activeDistrict} onSelectDistrict={setActiveDistrict} />

        {/* NorCal spotlight */}
        {isNorCal && <NorCalDistrict onSelectLocation={setSelectedLocation} />}

        {/* AI Brief */}
        {activeDistrict === "all" && <AIMorningBrief />}

        {/* Main Content */}
        <div style={{ display: "grid", gridTemplateColumns: selectedLocation ? "1fr 320px" : "1fr", gap: 20 }}>
          <div>
            {view === "map" && !isNorCal && (
              <LocationHeatGrid locations={filteredLocations} onSelectLocation={setSelectedLocation} />
            )}
            <LocationTable locations={filteredLocations} onSelectLocation={setSelectedLocation} isNorCal={isNorCal} />
          </div>
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
