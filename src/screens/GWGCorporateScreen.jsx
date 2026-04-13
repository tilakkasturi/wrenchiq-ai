// GWGCorporateScreen — Corporate admin view (corporateName from DemoContext)
// Shows Network Objectives (4 job cards) + Location Health grid (100 rooftops)

import { useState } from "react";
import { Building2, Target, ChevronRight, AlertTriangle, CheckCircle, Clock, MapPin, User, ArrowLeft } from "lucide-react";
import { useDemo } from "../context/DemoContext";

// ── Seeded color distribution for 100 locations ─────────────────
// Deterministic pattern: green=35, blue=30, orange=25, red=10
const LOCATION_COLORS = (() => {
  const statuses = [
    ...Array(35).fill("green"),
    ...Array(30).fill("blue"),
    ...Array(25).fill("orange"),
    ...Array(10).fill("red"),
  ];
  // Shuffle with a seeded pattern (not crypto, just deterministic look)
  const seed = [3,7,1,9,2,8,4,6,0,5];
  const out = [];
  for (let i = 0; i < 100; i++) {
    // Deterministic but varied spread using index arithmetic
    const idx = (i * 7 + seed[i % 10] * 3 + Math.floor(i / 10)) % statuses.length;
    out.push(statuses[idx]);
  }
  // Post-process: ensure counts roughly match by just using original order shuffled
  // Use a fixed interleave so it looks realistic
  const fixed = [];
  const pools = {
    green:  [...Array(35).fill("green")],
    blue:   [...Array(30).fill("blue")],
    orange: [...Array(25).fill("orange")],
    red:    [...Array(10).fill("red")],
  };
  // Pattern: spread colors evenly across the 100 positions
  const pattern = [];
  for (let g = 0; g < 35; g++) pattern.push({ color: "green",  pos: Math.round(g * 2.857) });
  for (let b = 0; b < 30; b++) pattern.push({ color: "blue",   pos: Math.round(b * 3.333 + 0.5) });
  for (let o = 0; o < 25; o++) pattern.push({ color: "orange", pos: Math.round(o * 4.0 + 1) });
  for (let r = 0; r < 10; r++) pattern.push({ color: "red",    pos: Math.round(r * 10 + 4) });
  pattern.sort((a, b) => a.pos - b.pos);

  const result = new Array(100).fill("blue");
  const used = new Set();
  pattern.forEach(({ color, pos }) => {
    let p = pos % 100;
    while (used.has(p)) { p = (p + 1) % 100; }
    result[p] = color;
    used.add(p);
  });
  return result;
})();

const STATUS_COLORS = {
  green:  { dot: "#22C55E", label: "On Track",        bg: "#F0FDF4", border: "#BBF7D0", text: "#16A34A" },
  blue:   { dot: "#3B82F6", label: "Good",             bg: "#EFF6FF", border: "#BFDBFE", text: "#2563EB" },
  orange: { dot: "#F59E0B", label: "Needs Attention",  bg: "#FFFBEB", border: "#FDE68A", text: "#D97706" },
  red:    { dot: "#EF4444", label: "Off-Track",         bg: "#FEF2F2", border: "#FECACA", text: "#DC2626" },
};

const OBJECTIVES = [
  {
    job: "JOB 1",
    jobColor: "#3B82F6",
    type: "Intake & Diagnosis",
    objective: "First-visit diagnosis accuracy > 90%. Flag locations with comeback rate above 5%.",
    metric: "87%",
    metricLabel: "first-visit accuracy avg",
    status: "Needs Attention",
    statusKey: "orange",
    statusIcon: AlertTriangle,
    borderColor: "#F59E0B",
    detail: "13 locations above 5% comeback threshold",
  },
  {
    job: "JOB 2",
    jobColor: "#EF4444",
    type: "3C Compliance",
    objective: "All brake and diagnostic ROs must score 80%+ on 3C completeness with TSB references.",
    metric: "64%",
    metricLabel: "avg 3C score",
    status: "Off-Track",
    statusKey: "red",
    statusIcon: AlertTriangle,
    borderColor: "#EF4444",
    detail: "36 locations below threshold — action required",
  },
  {
    job: "JOB 3",
    jobColor: "#3B82F6",
    type: "Smart Upsell",
    objective: "Increase oil change ARO by $75. Prioritize Brand X oil. Target 30% upsell acceptance.",
    metric: "+$42",
    metricLabel: "avg ARO increase",
    status: "In Progress",
    statusKey: "blue",
    statusIcon: Clock,
    borderColor: "#3B82F6",
    detail: "$33 gap to target — 22% upsell acceptance",
  },
  {
    job: "JOB 4",
    jobColor: "#22C55E",
    type: "Operational Intel",
    objective: "Weekly performance brief for every shop owner. Flag locations with approval rate below 75%.",
    metric: "89%",
    metricLabel: "avg approval rate",
    status: "On Track",
    statusKey: "green",
    statusIcon: CheckCircle,
    borderColor: "#22C55E",
    detail: "94/100 shops received weekly brief last week",
  },
];

export default function GWGCorporateScreen({ onExitPersona }) {
  const { smsName, corporateName } = useDemo();
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [hoveredObjective, setHoveredObjective] = useState(null);

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F3F4F6",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: "flex",
      flexDirection: "column",
    }}>

      {/* ── Header bar ── */}
      <div style={{
        background: "#1a1f2e",
        padding: "0 32px",
        height: 64,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        {/* Left: back + brand + title */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {onExitPersona && (
            <button
              onClick={onExitPersona}
              title="Back to gateway"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                color: "rgba(255,255,255,0.5)",
                fontSize: 11,
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              <ArrowLeft size={13} />
              Back
            </button>
          )}
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: "rgba(246,201,14,0.15)",
            border: "1.5px solid rgba(246,201,14,0.35)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={20} color="#F6C90E" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: -0.3 }}>
              {corporateName}
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
              Network Objectives
            </div>
          </div>

          {/* Separator */}
          <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)", marginLeft: 8 }} />

          {/* Network count */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.25)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>100 rooftops active</span>
          </div>
        </div>

        {/* Right: admin badge + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(246,201,14,0.12)",
            border: "1px solid rgba(246,201,14,0.3)",
            borderRadius: 8, padding: "5px 12px",
          }}>
            <Target size={12} color="#F6C90E" />
            <span style={{ fontSize: 11, fontWeight: 800, color: "#F6C90E", letterSpacing: 0.5 }}>ADMIN</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <User size={16} color="rgba(255,255,255,0.6)" />
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Taylor Mitchell</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Network Director</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "28px 32px 40px", overflowY: "auto" }}>

        {/* Section heading */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: -0.4 }}>
              Network Objectives
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 2 }}>
              4 active performance targets across 100 locations — Q2 2026
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "On Track", color: "#22C55E", count: 1 },
              { label: "In Progress", color: "#3B82F6", count: 1 },
              { label: "Needs Attention", color: "#F59E0B", count: 1 },
              { label: "Off-Track", color: "#EF4444", count: 1 },
            ].map((s) => (
              <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #E5E7EB", borderRadius: 20, padding: "4px 10px" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.color }} />
                <span style={{ fontSize: 10, color: "#6B7280", fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives 2×2 grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}>
          {OBJECTIVES.map((obj, idx) => {
            const StatusIcon = obj.statusIcon;
            const sc = STATUS_COLORS[obj.statusKey];
            const isHov = hoveredObjective === idx;
            return (
              <div
                key={obj.job}
                onMouseEnter={() => setHoveredObjective(idx)}
                onMouseLeave={() => setHoveredObjective(null)}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  border: `1.5px solid ${isHov ? obj.borderColor : "#E5E7EB"}`,
                  borderLeft: `4px solid ${obj.borderColor}`,
                  padding: "20px 20px 18px",
                  transition: "all 0.15s",
                  boxShadow: isHov ? `0 4px 20px rgba(0,0,0,0.08)` : "0 1px 4px rgba(0,0,0,0.04)",
                  cursor: "default",
                  position: "relative",
                }}
              >
                {/* Job tag row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: 0.8,
                      color: obj.jobColor,
                      background: `${obj.jobColor}14`,
                      border: `1px solid ${obj.jobColor}30`,
                      borderRadius: 5, padding: "2px 8px",
                    }}>{obj.job}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{obj.type}</span>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: sc.bg,
                    border: `1px solid ${sc.border}`,
                    borderRadius: 6, padding: "3px 8px",
                  }}>
                    <StatusIcon size={11} color={sc.text} />
                    <span style={{ fontSize: 10, fontWeight: 700, color: sc.text }}>{obj.status}</span>
                  </div>
                </div>

                {/* Objective text */}
                <div style={{
                  fontSize: 11, color: "#6B7280", lineHeight: 1.55,
                  marginBottom: 14, paddingBottom: 14,
                  borderBottom: "1px solid #F3F4F6",
                }}>
                  {obj.objective}
                </div>

                {/* Metric row */}
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#111827", letterSpacing: -1, lineHeight: 1 }}>
                      {obj.metric}
                    </div>
                    <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>{obj.metricLabel}</div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 5,
                    background: "#F9FAFB", border: "1px solid #E5E7EB",
                    borderRadius: 6, padding: "5px 10px", maxWidth: "55%",
                  }}>
                    <ChevronRight size={11} color="#9CA3AF" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: "#6B7280", lineHeight: 1.35 }}>{obj.detail}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Location Health Grid */}
        <div style={{
          background: "#fff",
          borderRadius: 12,
          border: "1.5px solid #E5E7EB",
          padding: "24px 24px 20px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}>
          {/* Grid header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <MapPin size={16} color="#1a1f2e" />
                <span style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}>
                  Location Health — 100 Rooftops
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF" }}>
                Click any location to drill in — updated daily at 6:00 AM
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
              {Object.entries(STATUS_COLORS).map(([key, sc]) => {
                const count = LOCATION_COLORS.filter(c => c === key).length;
                return (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 5, background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 20, padding: "4px 10px" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot }} />
                    <span style={{ fontSize: 10, color: sc.text, fontWeight: 600 }}>{sc.label}</span>
                    <span style={{ fontSize: 10, color: sc.text, fontWeight: 800 }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dot grid */}
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            padding: "4px 0",
          }}>
            {LOCATION_COLORS.map((colorKey, i) => {
              const sc = STATUS_COLORS[colorKey];
              const locationNum = i + 1;
              const isHov = hoveredLocation === i;
              return (
                <div
                  key={i}
                  onMouseEnter={() => setHoveredLocation(i)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  title={`Location #${String(locationNum).padStart(2, "0")} — ${sc.label}`}
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: sc.dot,
                    opacity: isHov ? 1 : 0.75,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    transform: isHov ? "scale(1.5)" : "scale(1)",
                    boxShadow: isHov ? `0 0 0 3px ${sc.dot}40` : "none",
                    position: "relative",
                    zIndex: isHov ? 2 : 1,
                    flexShrink: 0,
                  }}
                />
              );
            })}
          </div>

          {/* Hover tooltip row */}
          <div style={{ minHeight: 24, marginTop: 12, paddingTop: 12, borderTop: "1px solid #F3F4F6" }}>
            {hoveredLocation !== null ? (() => {
              const colorKey = LOCATION_COLORS[hoveredLocation];
              const sc = STATUS_COLORS[colorKey];
              const num = hoveredLocation + 1;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>
                    Location #{String(num).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 12, color: sc.text, fontWeight: 600 }}>{sc.label}</span>
                  <span style={{ fontSize: 11, color: "#9CA3AF" }}>— click to drill in</span>
                </div>
              );
            })() : (
              <span style={{ fontSize: 11, color: "#D1D5DB" }}>Hover over a location to see details</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        background: "#1a1f2e",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
          {corporateName} &middot; 100 Rooftops &middot; {smsName} Connected
        </span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>
          Powered by WrenchIQ.ai &middot; Predii, Inc. &middot; PREDII CONFIDENTIAL
        </span>
      </div>
    </div>
  );
}
