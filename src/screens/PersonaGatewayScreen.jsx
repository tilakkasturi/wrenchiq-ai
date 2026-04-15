// AE-775 — Combined Gateway: WrenchIQ-AM + WrenchIQ-OEM with API demo
import { useState, useEffect, useRef } from "react";
import {
  Wrench, ClipboardList, ArrowRight, Shield, Menu, Sparkles,
  CheckCircle, Clock, ChevronRight, Building2, FileText,
  Code2, Play, BarChart3, Hammer, Copy, ChevronDown,
  Zap, Package, Send,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, customers, vehicles } from "../data/demoData";
import { WARRANTY_CLAIMS } from "../data/oemDemoData";
import BrandWordmark from "../components/BrandWordmark";
import { useEditionName } from "../context/BrandingContext";
import { useDemo, DEMO_SHOPS } from "../context/DemoContext";

// ── AM data ─────────────────────────────────────────────────
const QUEUE = [
  { custId: "cust-001", waitMin: 2,  concern: "Check engine light on, runs rough at idle" },
  { custId: "cust-002", waitMin: 14, concern: "90K service + brake inspection" },
  { custId: "cust-005", waitMin: 22, concern: "A/C blowing warm air" },
  { custId: "cust-007", waitMin: 31, concern: "Oil change + tire rotation" },
];
function getVehicle(custId) { return vehicles.find(v => v.customerId === custId); }
function initials(first, last) { return `${first[0]}${last[0]}`.toUpperCase(); }

const AM_PERSONAS = [
  {
    id: "advisor",  label: "Service Advisor", tagline: "Manage Relationships & Bay",
    detail: "RO queue & board · Bay utilization · Customer Trust Engine · Parts Intelligence",
    iconBg: "#FFF3E8", isDefault: true,
  },
  {
    id: "owner", label: "Shop Owner", tagline: "Command Center",
    detail: "Revenue vs target · Bay grid · Supplier rebates · Team performance · AI alerts",
    iconBg: "#E8F5E9",
  },
  {
    id: "gwgCorporate", label: "GWG Corporate", tagline: "Network Objectives & Location Health",
    detail: "Set performance targets · Monitor 100 locations · Track compliance by job type",
    iconBg: "#E8EAF0",
  },
];

const LIVE_SIGNALS = {
  cornerstone: {
    advisor:      "3 approvals pending · $920 waiting",
    owner:        "2 AI alerts · Bay 3 idle 45 min",
    gwgCorporate: "3C compliance Off-Track — 36 locations",
  },
  ridgeline: {
    advisor: "2 upsells staged · $803 opportunity",
    owner:   "Luis — 3 comebacks this month",
  },
};

const OEM_PERSONAS = [
  { id: "fixedOps",   label: "Fixed Ops Director", tagline: "Warranty Performance Hub",       detail: "Approval rate · Per-advisor compliance · Dollars at risk · Rejection analytics · Multi-dealer rollup", accent: "#0D3B45", badge: `${WARRANTY_CLAIMS.thisMonth.approvalRate}% approval` },
  { id: "oemAdvisor", label: "Service Advisor",     tagline: "RO Story Writer",                detail: "AI narrative generation · Op code matching · Compliance checker · CDK / R&R / Dealertrack push",       accent: "#2563EB", badge: "3 ROs pending" },
  { id: "oemTech",    label: "Technician",           tagline: "OEM Bay View",                   detail: "TSB auto-match by VIN · OEM op codes · DTC entry · Voice note · Warranty flag to advisor",             accent: "#16A34A", badge: "2 active jobs" },
];

// ── API demo payloads ────────────────────────────────────────
const API_REQUESTS = {
  AM: `POST /v1/ro/narrative  HTTP/1.1
Host: api.wrenchiq.ai
Authorization: Bearer sk-wiq-...
Content-Type: application/json

{
  "edition": "AM",
  "shop_id": "shop-ppa-001",
  "vin": "1HGCM82633A123456",
  "complaint": "CEL on, rough idle at warm-up",
  "dtcs": ["P0171", "P0420"],
  "tech_notes": "Lean condition bank 1 confirmed. Cat efficiency below threshold.",
  "labor_rate": 195
}`,
  OEM: `POST /v1/ro/narrative  HTTP/1.1
Host: api.wrenchiq.ai
Authorization: Bearer sk-wiq-...
Content-Type: application/json

{
  "edition": "OEM",
  "dealer_code": "04147",
  "vin": "4T1BF1FK5CU195842",
  "complaint": "CEL on, rough idle at warm-up",
  "dtcs": ["P0171", "P0420"],
  "tech_notes": "Lean condition bank 1 confirmed. Cat efficiency below threshold.",
  "dms": "CDK",
  "oem_make": "Toyota"
}`,
};

const API_RESPONSES = {
  AM: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "edition": "AM",
  "narrative": {
    "complaint": "Customer brought in vehicle with check engine
      light illuminated. States rough idle present at warm-up
      for approximately one week.",
    "cause": "Found lean condition on bank 1 (P0171). Catalytic
      converter efficiency below threshold (P0420). No vacuum
      leaks detected. MAF sensor within spec.",
    "correction": "Replaced air-fuel ratio sensor bank 1.
      Performed fuel trim reset. Cleared codes. Test drive
      confirmed repair — all monitors set."
  },
  "estimate": {
    "labor_hrs": 1.2,
    "labor_total": 234.00,
    "parts_total": 198.00,
    "total": 432.00
  },
  "customer_summary": "We replaced the oxygen sensor that was
    causing your check engine light. Your car is running great!"
}`,
  OEM: `HTTP/1.1 200 OK
Content-Type: application/json

{
  "status": "success",
  "edition": "OEM",
  "compliance_score": 96,
  "dms_ready": true,
  "narrative": {
    "complaint": "Customer states malfunction indicator lamp
      illuminated and vehicle exhibits rough idle condition
      upon reaching operating temperature.",
    "cause": "Diagnostic scan revealed P0171 (System Too Lean,
      Bank 1) and P0420 (Catalyst Efficiency Below Threshold,
      Bank 1). Air-fuel ratio sensor confirmed lean bias per
      TSB #0074-21. Vacuum integrity test negative.",
    "correction": "Replaced Bank 1 air-fuel ratio sensor
      (Part No. 22641-31010) per TSB #0074-21. Fuel trim reset
      performed. Road tested 12 miles — all monitors complete.
      All DTCs cleared."
  },
  "op_code": {
    "code": "0171A",
    "description": "Lean Fuel Trim — AFR Sensor Replacement",
    "flat_rate_hrs": 1.2,
    "pre_auth_required": false
  },
  "compliance_flags": [],
  "dms_push": {
    "target": "CDK",
    "dealer_code": "04147",
    "status": "ready"
  }
}`,
};

// ── Syntax-colored JSON line renderer ───────────────────────
function CodeBlock({ text, bg = "rgba(0,0,0,0.5)" }) {
  const lines = text.split("\n");
  return (
    <div style={{
      background: bg, borderRadius: 8, padding: "12px 14px",
      fontFamily: "'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace",
      fontSize: 10.5, lineHeight: 1.6, overflowX: "auto",
    }}>
      {lines.map((line, i) => {
        // Color JSON keys orange, strings green, numbers blue, keywords teal
        const colored = line
          .replace(/("[\w_]+")(\s*:)/g, '<span style="color:#FF6B35">$1</span>$2')
          .replace(/:\s*("([^"]*)")/g, ': <span style="color:#86EFAC">$1</span>')
          .replace(/:\s*(\d+\.?\d*)/g, ': <span style="color:#93C5FD">$1</span>')
          .replace(/:\s*(true|false|null)/g, ': <span style="color:#C084FC">$1</span>')
          .replace(/^(POST|GET|HTTP\/[\d.]+\s\d+\s\w+)/g, '<span style="color:#FCD34D;font-weight:700">$1</span>')
          .replace(/^(Host|Authorization|Content-Type):/g, '<span style="color:#7DD3FC">$1:</span>')
          .replace(/^(  "status"|  "edition")/, '<span style="color:#FF6B35">$1</span>');
        return (
          <div key={i} dangerouslySetInnerHTML={{ __html: colored }} style={{ color: "rgba(255,255,255,0.75)", whiteSpace: "pre" }} />
        );
      })}
    </div>
  );
}

// ── Format AI response text into readable JSX ────────────────
function formatAIResponse(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const nodes = [];
  let listItems = [];

  const flushList = () => {
    if (listItems.length > 0) {
      nodes.push(
        <ul key={`ul-${nodes.length}`} style={{ margin: "6px 0", paddingLeft: 16, display: "flex", flexDirection: "column", gap: 3 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 1.5 }}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      return;
    }
    // Bullet list
    if (/^[-•*]\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^[-•*]\s+/, ""));
      return;
    }
    // Numbered list
    if (/^\d+\.\s+/.test(trimmed)) {
      listItems.push(trimmed.replace(/^\d+\.\s+/, ""));
      return;
    }
    flushList();
    // Heading (## or bold-only line)
    if (/^#{1,3}\s/.test(trimmed)) {
      const heading = trimmed.replace(/^#{1,3}\s+/, "");
      nodes.push(
        <div key={idx} style={{ fontWeight: 700, fontSize: 11, color: "#FF6B35", marginTop: nodes.length ? 8 : 0, marginBottom: 2 }}>{heading}</div>
      );
      return;
    }
    // Bold label: "**Label:** rest"
    if (/^\*\*[^*]+\*\*/.test(trimmed)) {
      nodes.push(
        <div key={idx} style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>{renderInline(trimmed)}</div>
      );
      return;
    }
    // Normal paragraph
    nodes.push(
      <div key={idx} style={{ fontSize: 11, color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>{renderInline(trimmed)}</div>
    );
  });
  flushList();
  return <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>{nodes}</div>;
}

function renderInline(text) {
  // Replace **bold** with <strong>
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return <strong key={i} style={{ color: "#fff", fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

// ── Main gateway ─────────────────────────────────────────────
export default function PersonaGatewayScreen({ onSelectPersona, onOpenSpecs, onOpenOEM }) {
  const amName  = useEditionName("AM");
  const oemName = useEditionName("OEM");
  const { smsName, activeShopId, setDemo } = useDemo();
  const [activeTab, setActiveTab]        = useState("AM");     // "AM" | "OEM" | "API"
  const [hoveredPersona, setHoveredPersona] = useState(null);
  const [selectedCust, setSelectedCust]  = useState(null);
  const [apiEdition, setApiEdition]      = useState("OEM");   // "AM" | "OEM"
  const [apiView, setApiView]            = useState("postman"); // "postman" | "ui"
  const [copied, setCopied]              = useState(false);

  // ── Knowledge Graph + AI Chat state ──────────────────────────
  const [kgStats, setKgStats]        = useState(null);
  const [topClusters, setTopClusters] = useState([]);
  const [messages, setMessages]      = useState([]);
  const [inputText, setInputText]    = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetch("/api/knowledge-graph/clusters?limit=5")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (!d) return; setKgStats(d); setTopClusters((d.clusters || []).slice(0, 5)); })
      .catch(() => {});
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(text) {
    const q = (text || inputText).trim();
    if (!q || chatLoading) return;
    setInputText("");
    const history = [...messages, { role: "user", content: q }];
    setMessages(history);
    setChatLoading(true);
    try {
      const res = await fetch("/api/knowledge-graph/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, history: history.slice(-6) }),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `Server error ${res.status}`);
      setMessages([...history, { role: "assistant", content: data.answer || "No response." }]);
    } catch {
      setMessages([...history, { role: "assistant", content: "Could not reach the knowledge graph." }]);
    } finally {
      setChatLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(API_REQUESTS[apiEdition]).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  const isOEM = activeTab === "OEM";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F2F4F7",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "32px 24px 60px",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* ── Wordmark ── */}
      <div style={{ marginBottom: 6 }}>
        <BrandWordmark size="xl" />
      </div>
      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 10, textAlign: "center", maxWidth: 540 }}>
        AI intelligence that works alongside your shop management system.
      </div>
      <div style={{ marginBottom: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "#fff", border: "1.5px solid #22C55E",
          borderRadius: 20, padding: "6px 16px",
          fontSize: 12, fontWeight: 700, color: "#16A34A",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22C55E", display: "inline-block", flexShrink: 0 }} />
          Connected to: {smsName}
        </span>

        {/* ── Demo shop selector (April 18 demos) ─────────────────────────── */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#9CA3AF", fontWeight: 600, letterSpacing: "0.05em" }}>
            DEMO:
          </span>
          {Object.values(DEMO_SHOPS).map(shop => {
            const isActive = activeShopId === shop.id;
            return (
              <button
                key={shop.id}
                onClick={() => setDemo({
                  activeShopId: shop.id,
                  shopName: shop.shopName,
                  ownerName: shop.ownerName,
                  ownerInitials: shop.ownerInitials,
                  smsName: shop.smsName,
                  corporateName: shop.corporateName,
                  primaryCustomer: shop.primaryCustomer,
                  smsProvider: shop.smsProvider,
                  advisorName: shop.advisorName,
                })}
                style={{
                  padding: "4px 12px", borderRadius: 20,
                  border: isActive ? `1.5px solid ${COLORS.accent}` : "1.5px solid #E5E7EB",
                  cursor: "pointer",
                  background: isActive ? COLORS.accent : "#fff",
                  color: isActive ? "#fff" : "#6B7280",
                  fontSize: 10, fontWeight: 700, transition: "all 0.15s",
                }}
              >
                {shop.shopName} ({shop.smsName})
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          TOP TABS: AM · OEM (API tab hidden in demo mode)
      ══════════════════════════════════════════════════════ */}
      {activeTab === "OEM" && (
        <div style={{
          display: "flex", gap: 0,
          background: "rgba(0,0,0,0.06)",
          borderRadius: 14, padding: 4,
          marginBottom: 28,
          border: "1px solid #E5E7EB",
        }}>
          {[
            { key: "AM",  label: amName,  sub: "Independent & Multi-Location Shops",   badge: "AM",  color: COLORS.accent, badgeBg: "rgba(255,107,53,0.15)", badgeBorder: "rgba(255,107,53,0.3)",  activeBg: "rgba(255,107,53,0.12)" },
            { key: "OEM", label: oemName, sub: "Franchise Dealerships (Toyota, Ford…)", badge: "OEM", color: "#4DB6AC",     badgeBg: "rgba(77,182,172,0.15)",  badgeBorder: "rgba(77,182,172,0.3)", activeBg: "#0D3B45" },
          ].map((e) => {
            const active = activeTab === e.key;
            return (
              <button
                key={e.key}
                onClick={() => setActiveTab(e.key)}
                style={{
                  padding: "10px 28px", borderRadius: 10, border: "none", cursor: "pointer",
                  background: active ? e.activeBg : "transparent",
                  transition: "all 0.18s",
                  display: "flex", alignItems: "center", gap: 10,
                }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: active ? "#fff" : "#9CA3AF", letterSpacing: -0.3 }}>{e.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 0.5, color: active ? e.color : "#D1D5DB", background: active ? e.badgeBg : "transparent", border: `1px solid ${active ? e.badgeBorder : "transparent"}`, borderRadius: 4, padding: "1px 6px" }}>{e.badge}</span>
                  </div>
                  <div style={{ fontSize: 10, color: active ? "rgba(255,255,255,0.55)" : "#9CA3AF", marginTop: 1 }}>{e.sub}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          OEM EDITION
      ══════════════════════════════════════════════════════ */}
      {isOEM && (
        <div style={{ width: "100%", background: "linear-gradient(160deg, #0D3B45 0%, #0D2A40 55%, #111827 100%)", borderRadius: 20, padding: "28px 24px", display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 940 }}>
          {/* Dealer context */}
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>
            Palo Alto Toyota · Dealer Code 04147 · CDK Global Connected
          </div>

          {/* ── OEM HERO: RO Story Writer ── */}
          <div style={{
            width: "100%", maxWidth: 880,
            background: "rgba(255,255,255,0.04)",
            border: "1.5px solid rgba(77,182,172,0.4)",
            borderRadius: 20, padding: "0",
            marginBottom: 20,
            position: "relative", overflow: "hidden",
          }}>
            {/* Teal glow */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(77,182,172,0.07)", pointerEvents: "none" }} />

            {/* Hero header */}
            <div style={{ padding: "24px 28px 0", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(77,182,172,0.15)", border: "1.5px solid rgba(77,182,172,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={26} color="#4DB6AC" />
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: -0.4 }}>RO Story Writer</span>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#4DB6AC", background: "rgba(77,182,172,0.15)", border: "1px solid rgba(77,182,172,0.35)", borderRadius: 5, padding: "2px 7px", letterSpacing: 0.5 }}>OEM CORE</span>
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                    AI-generated complaint · cause · correction — OEM-compliant, DMS-ready in seconds
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "5px 10px" }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3, background: "#22C55E", boxShadow: "0 0 0 2px rgba(34,197,94,0.3)" }} />
                  <span style={{ fontSize: 10, color: "#22C55E", fontWeight: 700 }}>86% warranty approval rate</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Palo Alto Toyota · March 2026</div>
              </div>
            </div>

            {/* Demo: before → after */}
            <div style={{ display: "flex", gap: 0, padding: "20px 28px 24px" }}>

              {/* Left: Input */}
              <div style={{ flex: 1, marginRight: 12 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Technician Input</div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>VIN</span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", color: "#93C5FD" }}>4T1BF1FK5CU195842</span>
                    <span style={{ fontSize: 9, background: "rgba(77,182,172,0.15)", color: "#4DB6AC", borderRadius: 4, padding: "1px 5px" }}>2024 Toyota Camry SE</span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>
                    <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>Customer concern: </span>
                    "CEL on, rough idle at warm-up"
                  </div>
                  <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                    {["P0171", "P0420"].map(d => (
                      <span key={d} style={{ fontSize: 9, fontWeight: 700, background: "rgba(255,107,53,0.2)", color: COLORS.accent, border: "1px solid rgba(255,107,53,0.3)", borderRadius: 5, padding: "2px 7px" }}>{d}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontStyle: "italic", lineHeight: 1.5 }}>
                    "Lean condition bank 1 confirmed. MAF within spec. Cat efficiency below threshold per TSB #0074-21…"
                  </div>
                </div>
              </div>

              {/* Arrow */}
              <div style={{ display: "flex", alignItems: "center", padding: "0 8px", flexShrink: 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <Sparkles size={14} color="#4DB6AC" />
                  <ArrowRight size={18} color="rgba(77,182,172,0.6)" />
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", textAlign: "center" }}>AI</span>
                </div>
              </div>

              {/* Right: Generated narrative */}
              <div style={{ flex: 1.4, marginLeft: 4 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase" }}>OEM-Compliant Narrative</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: "#4ADE80", background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.25)", borderRadius: 4, padding: "1px 6px" }}>Score 96</span>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Op: 0171A · 1.2 FRH</span>
                  </div>
                </div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "12px 14px", border: "1px solid rgba(74,222,128,0.2)" }}>
                  {[
                    { label: "Complaint", text: "Customer states malfunction indicator lamp illuminated and vehicle exhibits rough idle condition upon reaching operating temperature." },
                    { label: "Cause", text: "P0171 and P0420 confirmed. Air-fuel ratio sensor lean bias Bank 1 per TSB #0074-21. Vacuum integrity negative." },
                    { label: "Correction", text: "Replaced AFR sensor (22641-31010) per TSB procedure. Fuel trim reset. Road tested 12 miles — monitors complete. DTCs cleared." },
                  ].map((s) => (
                    <div key={s.label} style={{ marginBottom: 8 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, color: "#4DB6AC", textTransform: "uppercase", letterSpacing: 0.6 }}>{s.label} · </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{s.text}</span>
                    </div>
                  ))}
                  {/* DMS push row */}
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>Push to DMS:</span>
                    {[
                      { label: "CDK Global", active: true },
                      { label: "R&R",        active: false },
                      { label: "Dealertrack", active: false },
                    ].map((d) => (
                      <span key={d.label} style={{
                        fontSize: 9, fontWeight: 700, borderRadius: 5, padding: "2px 8px",
                        background: d.active ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.05)",
                        color: d.active ? COLORS.accent : "rgba(255,255,255,0.25)",
                        border: `1px solid ${d.active ? "rgba(255,107,53,0.35)" : "rgba(255,255,255,0.08)"}`,
                      }}>{d.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CTA row */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 28px", display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => onOpenOEM && onOpenOEM()}
                style={{
                  background: "#4DB6AC", border: "none", borderRadius: 10,
                  padding: "11px 24px", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                  fontSize: 13, fontWeight: 700, color: "#fff",
                  boxShadow: "0 4px 16px rgba(77,182,172,0.35)",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "none"}
              >
                <FileText size={15} />
                Open RO Story Writer
                <ArrowRight size={14} />
              </button>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                Select a persona below to enter the full OEM workflow
              </div>
            </div>
          </div>

          {/* OEM persona cards */}
          <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 880, marginBottom: 0 }}>
            {OEM_PERSONAS.map((p) => {
              const isHov = hoveredPersona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onOpenOEM && onOpenOEM(p.id)}
                  onMouseEnter={() => setHoveredPersona(p.id)}
                  onMouseLeave={() => setHoveredPersona(null)}
                  style={{
                    flex: 1, background: isHov ? "#fff" : "rgba(255,255,255,0.04)",
                    border: isHov ? `1.5px solid ${p.accent}` : "1.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 14, padding: "14px 16px",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    transform: isHov ? "translateY(-2px)" : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isHov ? "#111827" : "#fff" }}>{p.label}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: isHov ? p.accent : "rgba(255,255,255,0.4)", background: isHov ? `${p.accent}14` : "rgba(255,255,255,0.07)", borderRadius: 5, padding: "2px 7px" }}>{p.badge}</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: isHov ? p.accent : "rgba(255,255,255,0.5)", marginBottom: 4 }}>{p.tagline}</div>
                  <div style={{ fontSize: 10, color: isHov ? "#6B7280" : "rgba(255,255,255,0.28)", lineHeight: 1.45 }}>{p.detail}</div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    <ChevronRight size={13} color={isHov ? p.accent : "rgba(255,255,255,0.2)"} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          AM EDITION
      ══════════════════════════════════════════════════════ */}
      {!isOEM && (
        <>
          {/* AM persona cards — clean light design */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 480 }}>
            {AM_PERSONAS
              .filter(p => p.id !== "gwgCorporate" || activeShopId === "cornerstone")
              .map((p) => {
                const isHov = hoveredPersona === p.id;
                const isSelected = p.isDefault;
                const liveSignal = (LIVE_SIGNALS[activeShopId] || {})[p.id] || "";

                // Icon per persona
                let PersonaIcon = Wrench;
                if (p.id === "owner") PersonaIcon = BarChart3;
                if (p.id === "gwgCorporate") PersonaIcon = Building2;

                const iconColor = p.id === "advisor" ? "#FF6B35" : p.id === "owner" ? "#16A34A" : "#6B7280";

                return (
                  <button key={p.id}
                    onClick={() => onSelectPersona(p.id)}
                    onMouseEnter={() => setHoveredPersona(p.id)}
                    onMouseLeave={() => setHoveredPersona(null)}
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: `1.5px solid ${isSelected && !isHov ? "#C9A227" : isHov ? "#C9A227" : "#E5E7EB"}`,
                      borderRadius: 14,
                      padding: "18px 20px",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                      cursor: "pointer", textAlign: "left",
                      display: "flex", alignItems: "center", gap: 14,
                      transition: "all 0.15s",
                      transform: isHov ? "translateY(-1px)" : "none",
                    }}>
                    {/* Icon square */}
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: p.iconBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <PersonaIcon size={22} color={iconColor} />
                    </div>

                    {/* Text content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 2 }}>{p.label}</div>
                      <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 6 }}>{p.detail}</div>
                      {liveSignal && (
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#C9A227" }}>{liveSignal}</div>
                      )}
                    </div>

                    {/* Arrow */}
                    <ChevronRight size={18} color="#C9A227" style={{ flexShrink: 0 }} />
                  </button>
                );
              })}
          </div>

          {/* Switch to OEM link */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              onClick={() => setActiveTab("OEM")}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#9CA3AF", fontWeight: 500 }}
            >
              Switch to OEM view →
            </button>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          API TAB
      ══════════════════════════════════════════════════════ */}
      {activeTab === "API" && (
        <div style={{ width: "100%", maxWidth: 880 }}>
          <div style={{
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(192,132,252,0.2)",
            borderRadius: 16,
            padding: "24px",
          }}>

            {/* Controls row */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>

              {/* Edition toggle */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 0 }}>
                {["AM", "OEM"].map((e) => (
                  <button key={e} onClick={() => setApiEdition(e)}
                    style={{
                      padding: "5px 16px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: apiEdition === e ? (e === "OEM" ? "#0D3B45" : "rgba(255,107,53,0.2)") : "transparent",
                      color: apiEdition === e ? "#fff" : "rgba(255,255,255,0.4)",
                      fontSize: 11, fontWeight: 700, transition: "all 0.15s",
                    }}
                  >
                    edition=<span style={{ color: apiEdition === e ? (e === "OEM" ? "#4DB6AC" : COLORS.accent) : "inherit" }}>{e}</span>
                  </button>
                ))}
              </div>

              {/* View toggle */}
              <div style={{ display: "flex", background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: 3, gap: 0 }}>
                {[
                  { key: "postman", icon: Code2,  label: "Postman" },
                  { key: "ui",      icon: Play,    label: "UI Preview" },
                ].map((v) => (
                  <button key={v.key} onClick={() => setApiView(v.key)}
                    style={{
                      padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                      background: apiView === v.key ? "rgba(255,255,255,0.1)" : "transparent",
                      color: apiView === v.key ? "#fff" : "rgba(255,255,255,0.4)",
                      fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    }}
                  >
                    <v.icon size={11} />
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Endpoint pill */}
              <div style={{
                flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 7,
                padding: "6px 12px", display: "flex", alignItems: "center", gap: 8,
                border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontSize: 9, fontWeight: 700, background: "rgba(74,222,128,0.15)", color: "#4ADE80", borderRadius: 4, padding: "1px 5px" }}>POST</span>
                <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.5)" }}>
                  api.wrenchiq.ai<span style={{ color: "rgba(255,255,255,0.7)" }}>/v1/ro/narrative</span>
                </span>
                <button onClick={handleCopy}
                  style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, color: copied ? "#4ADE80" : "rgba(255,255,255,0.3)", fontSize: 10 }}>
                  <Copy size={11} />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {/* API consistent-schema note */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, padding: "7px 12px", background: "rgba(255,107,53,0.06)", borderRadius: 7, border: "1px solid rgba(255,107,53,0.15)" }}>
              <Zap size={11} color={COLORS.accent} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
                <strong style={{ color: "rgba(255,255,255,0.7)" }}>API Consistency Policy:</strong> Identical endpoint, headers, and schema for both editions. Only the <code style={{ background: "rgba(255,107,53,0.15)", color: COLORS.accent, padding: "0 4px", borderRadius: 3, fontSize: 10 }}>edition</code> field changes behavior — no separate API versions.
              </span>
            </div>

            {/* Postman view */}
            {apiView === "postman" && (
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Request</div>
                  <CodeBlock text={API_REQUESTS[apiEdition]} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>Response</div>
                  <CodeBlock text={API_RESPONSES[apiEdition]} />
                </div>
              </div>
            )}

            {/* UI Preview view */}
            {apiView === "ui" && (
              <div style={{ display: "flex", gap: 12 }}>

                {/* AM UI preview */}
                {apiEdition === "AM" && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{amName} — Customer-Facing Summary</div>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <Wrench size={16} color="#fff" style={{ transform: "rotate(-45deg)" }} />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>Peninsula Precision Auto</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>Repair estimate · 2024 Honda Accord</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, background: "#FFF7ED", color: COLORS.accent, border: `1px solid ${COLORS.accent}30`, borderRadius: 5, padding: "2px 7px" }}>AM</span>
                      </div>
                      <div style={{ borderRadius: 8, padding: "10px 12px", background: "#F9FAFB", border: "1px solid #E5E7EB", marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#374151", marginBottom: 4 }}>What we found</div>
                        <div style={{ fontSize: 11, color: "#6B7280", lineHeight: 1.5 }}>We replaced the oxygen sensor that was causing your check engine light. Your car is running great!</div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        {[["Labor", "$234"], ["Parts", "$198"], ["Total", "$432"]].map(([l, v]) => (
                          <div key={l} style={{ flex: 1, textAlign: "center", padding: "8px", background: "#F3F4F6", borderRadius: 7 }}>
                            <div style={{ fontSize: 9, color: "#9CA3AF" }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      <button style={{ width: "100%", marginTop: 10, background: COLORS.accent, border: "none", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                        Approve Estimate
                      </button>
                    </div>
                  </div>
                )}

                {/* OEM UI preview */}
                {apiEdition === "OEM" && (
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>{oemName} — Warranty RO Narrative</div>
                    <div style={{ background: "#fff", borderRadius: 12, padding: "16px", border: "1px solid #E5E7EB" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0D3B45", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FileText size={16} color="#4DB6AC" />
                        </div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#111827" }}>RO-2847 · 2024 Toyota Camry SE</div>
                          <div style={{ fontSize: 10, color: "#9CA3AF" }}>Warranty · Op 0171A · 1.2 FRH · CDK Ready</div>
                        </div>
                        <span style={{ marginLeft: "auto", fontSize: 9, fontWeight: 700, background: "#E0F2F1", color: "#0D3B45", border: "1px solid #80CBC4", borderRadius: 5, padding: "2px 7px" }}>OEM</span>
                      </div>
                      {[
                        { label: "Complaint", color: "#2563EB", text: "Customer states malfunction indicator lamp illuminated and vehicle exhibits rough idle condition upon reaching operating temperature." },
                        { label: "Cause",     color: "#7C3AED", text: "Diagnostic scan revealed P0171 and P0420. Air-fuel ratio sensor lean bias Bank 1 per TSB #0074-21. Vacuum test negative." },
                        { label: "Correction",color: "#16A34A", text: "Replaced AFR sensor (22641-31010) per TSB. Fuel trim reset. Road tested 12 miles. All monitors complete. DTCs cleared." },
                      ].map((s) => (
                        <div key={s.label} style={{ marginBottom: 8, padding: "7px 10px", borderRadius: 7, borderLeft: `3px solid ${s.color}`, background: "#F9FAFB" }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{s.label}</div>
                          <div style={{ fontSize: 10, color: "#374151", lineHeight: 1.45 }}>{s.text}</div>
                        </div>
                      ))}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#F0FDF4", borderRadius: 8, border: "1px solid #BBF7D0" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <CheckCircle size={13} color="#16A34A" />
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#16A34A" }}>Compliance Score: 96 / 100</span>
                        </div>
                        <button style={{ background: "#0D3B45", border: "none", borderRadius: 6, padding: "5px 12px", fontSize: 10, fontWeight: 700, color: "#4DB6AC", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                          <Send size={10} />
                          Push to CDK
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Side note showing the key difference */}
                <div style={{ width: 220, flexShrink: 0 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8 }}>Key Difference</div>
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px", border: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: 10 }}>
                    {(apiEdition === "AM" ? [
                      { label: "Tone",       value: "Customer-friendly", color: COLORS.accent },
                      { label: "Output",     value: "Estimate + approve CTA", color: COLORS.accent },
                      { label: "Audience",   value: "Vehicle owner", color: COLORS.accent },
                      { label: "DMS Push",   value: "None", color: "#9CA3AF" },
                      { label: "Compliance", value: "Not required", color: "#9CA3AF" },
                    ] : [
                      { label: "Tone",       value: "OEM technical standard", color: "#4DB6AC" },
                      { label: "Output",     value: "C/C/C + op code + DMS push", color: "#4DB6AC" },
                      { label: "Audience",   value: "OEM warranty dept.", color: "#4DB6AC" },
                      { label: "DMS Push",   value: "CDK / R&R / Dealertrack", color: "#4ADE80" },
                      { label: "Compliance", value: "Score 96 / 100", color: "#4ADE80" },
                    ]).map((r) => (
                      <div key={r.label}>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 2 }}>{r.label}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: r.color }}>{r.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Footer links ── */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 24 }}>
        {onOpenSpecs && (
          <button onClick={onOpenSpecs}
            style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 16px", cursor: "pointer", color: "#9CA3AF", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
            <Menu size={11} />
            Product Specifications
          </button>
        )}
        <button onClick={() => onSelectPersona("admin")}
          style={{ background: "none", border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 16px", cursor: "pointer", color: "#9CA3AF", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", gap: 5 }}>
          <Shield size={11} />
          Full Admin View
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 16, right: 20, fontSize: 10, color: "#D1D5DB" }}>
        © {new Date().getFullYear()} Predii, Inc. · PREDII CONFIDENTIAL
      </div>
    </div>
  );
}
