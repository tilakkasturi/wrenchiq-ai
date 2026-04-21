// WrenchIQ Splash — "Moving Shop Management to Agentic Mode"
import { useState } from "react";
import {
  ArrowRight, Cpu, CheckCircle,
  MessageSquare, BarChart3, Wrench, FileText,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import BrandWordmark from "../components/BrandWordmark";
import { useAppVersion } from "../hooks/useAppVersion";

// ── Agent capability cards ──────────────────────────────────
const AGENTS = [
  {
    icon: MessageSquare,
    color: "#2563EB",
    bg: "rgba(37,99,235,0.1)",
    title: "WrenchIQ Advisor Agent",
    sub: "Front Desk Intelligence",
    desc: "Watches every open RO in real time. Surfaces approvals pending, upsell opportunities, customer context, and TSB flags before the advisor even asks.",
  },
  {
    icon: Wrench,
    color: "#16A34A",
    bg: "rgba(22,163,74,0.1)",
    title: "WrenchIQ Tech Agent",
    sub: "Bay-Level Intelligence",
    desc: "Guides technicians through DVI, pre-loads TSBs by VIN, recommends labor codes, and phrases upsell opportunities to the service advisor with labor overlap math built in.",
  },
  {
    icon: BarChart3,
    color: COLORS.accent,
    bg: "rgba(255,107,53,0.1)",
    title: "WrenchIQ Owner Agent",
    sub: "Command Center Intelligence",
    desc: "Delivers a daily briefing — revenue vs target, bay utilization, pending approvals, cash flow context. Captures owner decisions as shop playbook rules that persist across every future interaction.",
  },
  {
    icon: FileText,
    color: "#7C3AED",
    bg: "rgba(124,58,237,0.1)",
    title: "3C Story Writer",
    sub: "RO Narrative Generation",
    desc: "AI-generated Complaint · Cause · Correction narratives from voice, DTC, and tech notes. OEM-compliant in under 30 seconds. Direct push to any connected Dealership Management System.",
  },
];

// ── Market value for two deployment contexts ────────────────
const MARKETS = [
  {
    label: "Independent Repair Shops",
    color: COLORS.accent,
    bg: "rgba(255,107,53,0.06)",
    border: "rgba(255,107,53,0.2)",
    points: [
      "Attaches to any Shop Management System — no replacement",
      "Advisor, Tech, and Owner agents watch every RO autonomously",
      "Persistent shop memory: customer preferences, playbooks, bay context",
      "Trust Engine scores every customer relationship proactively",
      "Multi-location orchestration for 100+ site corporate groups",
    ],
  },
  {
    label: "OEM Dealership Locations",
    color: "#2563EB",
    bg: "rgba(37,99,235,0.06)",
    border: "rgba(37,99,235,0.2)",
    points: [
      "Plugs into any point solution provider that connects to Dealership Management Systems",
      "3C Story Writer generates OEM-compliant repair narratives in seconds",
      "Warranty Claim Readiness Score reduces rejection rates by 40%+",
      "Op code confidence matching eliminates wrong-code submissions",
      "Fixed Ops Director dashboard: per-advisor compliance, dollars at risk",
    ],
  },
];

export default function SplashScreen({ onEnter }) {
  const appVersion = useAppVersion();
  const [enterHov, setEnterHov] = useState(false);

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bgDark,
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 40px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        flexShrink: 0,
      }}>
        <BrandWordmark size="bar" />
        <button
          onClick={onEnter}
          onMouseEnter={() => setEnterHov(true)}
          onMouseLeave={() => setEnterHov(false)}
          style={{
            background: enterHov ? "#e55c28" : COLORS.accent,
            border: "none", borderRadius: 8, padding: "7px 18px",
            color: "#fff", fontSize: 13, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.15s",
          }}
        >
          Enter Demo <ArrowRight size={14} />
        </button>
      </div>

      {/* ── Hero ── */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "64px 40px 0",
        maxWidth: 960, margin: "0 auto", width: "100%", boxSizing: "border-box",
      }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.25)",
          borderRadius: 20, padding: "5px 14px", marginBottom: 28,
        }}>
          <Cpu size={12} color={COLORS.accent} />
          <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent, letterSpacing: 0.6 }}>
            AI-POWERED SHOP INTELLIGENCE
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 48, fontWeight: 800, color: "#fff",
          textAlign: "center", margin: "0 0 20px",
          lineHeight: 1.12, letterSpacing: -1.2,
          maxWidth: 720,
        }}>
          ARO. Labor Rate. Bay Efficiency. Managed by AI.
        </h1>

        <p style={{
          fontSize: 17, color: "rgba(255,255,255,0.5)",
          textAlign: "center", maxWidth: 600,
          lineHeight: 1.65, margin: "0 0 16px",
        }}>
          WrenchIQ watches every RO, surfaces every upsell, and follows up on every approval — so you don't have to.
        </p>

        <p style={{
          fontSize: 14, color: "rgba(255,255,255,0.3)",
          textAlign: "center", maxWidth: 480,
          lineHeight: 1.6, margin: "0 0 56px",
        }}>
          Attaches to any Shop Management System or Dealership Management System. No replacement, no migration — active in weeks.
        </p>

        {/* ── 4 Agent cards ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14, width: "100%", marginBottom: 56,
        }}>
          {AGENTS.map(a => (
            <div key={a.title} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 14, padding: "22px 18px",
            }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11,
                background: a.bg,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <a.icon size={19} color={a.color} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 3, lineHeight: 1.3 }}>{a.title}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: a.color, marginBottom: 10, letterSpacing: 0.2 }}>{a.sub}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.42)", lineHeight: 1.6 }}>{a.desc}</div>
            </div>
          ))}
        </div>

        {/* ── Two markets ── */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 16, width: "100%", marginBottom: 48,
        }}>
          {MARKETS.map(m => (
            <div key={m.label} style={{
              background: m.bg,
              border: `1px solid ${m.border}`,
              borderRadius: 14, padding: "24px 24px",
            }}>
              <div style={{
                fontSize: 13, fontWeight: 800, color: m.color,
                marginBottom: 16, letterSpacing: 0.2,
              }}>
                {m.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {m.points.map(p => (
                  <div key={p} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                    <CheckCircle size={13} color={m.color} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <button
          onClick={onEnter}
          style={{
            background: COLORS.accent, border: "none",
            borderRadius: 12, padding: "15px 48px",
            color: "#fff", fontSize: 15, fontWeight: 700,
            cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
            letterSpacing: 0.2, marginBottom: 64,
          }}
        >
          Enter Demo <ArrowRight size={17} />
        </button>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "14px 40px", marginTop: "auto",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="36" height="18" viewBox="0 0 44 22" fill="none">
            <path d="M2 18 C6 18, 10 15, 14 12 C18 9, 22 5, 28 3 C32 1.5, 36 1, 42 1" stroke="rgba(255,255,255,0.15)" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M2 20 C6 20, 10 17, 14 14 C18 11, 22 7, 28 5 C32 3.5, 36 3, 42 3" stroke="#1B3461" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
            <path d="M2 22 C6 22, 10 19, 14 16 C18 13, 22 9, 28 7 C32 5.5, 36 5, 42 5" stroke="#F5B800" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
          </svg>
          <span style={{ fontSize: 11, fontWeight: 300, letterSpacing: 3, color: "rgba(255,255,255,0.25)" }}>PREDII</span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", display: "flex", gap: 16 }}>
          <span>© {new Date().getFullYear()} Predii, Inc.</span>
          <span style={{ color: "rgba(255,255,255,0.06)" }}>|</span>
          <span style={{ fontWeight: 600, letterSpacing: 0.5 }}>PREDII CONFIDENTIAL</span>
          {appVersion && <span>{appVersion}</span>}
        </div>
      </div>
    </div>
  );
}
