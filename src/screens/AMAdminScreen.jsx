import { useState } from "react";
import {
  Database, Zap, Users, FileText, Settings2,
  Server, GitMerge, ArrowDown, ArrowRight,
  CheckCircle, AlertCircle, Key, Shield, Activity,
  Cpu, Globe, Lock,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, technicians, advisors } from "../data/demoData";
import IntegrationsScreen from "./IntegrationsScreen";

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { id: "architecture", label: "Architecture",      icon: GitMerge },
  { id: "api",          label: "API & Integrations", icon: Zap },
  { id: "team",         label: "Team",              icon: Users },
  { id: "audit",        label: "Audit Log",         icon: FileText },
  { id: "system",       label: "System",            icon: Settings2 },
];

// ── Demo audit data ───────────────────────────────────────────
const AUDIT_ENTRIES = [
  { action: "Predii API key rotated",                user: "Tilak K.",     time: "March 24  9:02 AM",  detail: "" },
  { action: "Integration connected — Meta Business", user: "Marcus J.",    time: "March 21  3:17 PM",  detail: "" },
  { action: "Team member added — Priya Nair",        user: "Tilak K.",     time: "March 18  11:30 AM", detail: "" },
  { action: "AI settings updated — tone: friendly",  user: "Marcus J.",    time: "March 15  2:05 PM",  detail: "" },
  { action: "Twilio SMS limit increased to 5,000",   user: "Tilak K.",     time: "March 10  8:44 AM",  detail: "" },
  { action: "Shop profile updated — labor rate $195",user: "Tilak K.",     time: "March 1   9:00 AM",  detail: "" },
];

// ── Predii API endpoints ──────────────────────────────────────
const PREDII_APIS = [
  { endpoint: "POST /v1/intake/contextualize",  purpose: "VIN + complaint → pre-filled RO",               status: "live" },
  { endpoint: "POST /v1/ro/generate-narrative", purpose: "RO data → 3C narrative (AM format)",             status: "live" },
  { endpoint: "GET  /v1/tsb/match",             purpose: "VIN + DTCs → ranked TSB list",                  status: "live" },
  { endpoint: "POST /v1/health/predict",        purpose: "Vehicle history → health score + predictions",   status: "live" },
  { endpoint: "GET  /v1/labor/estimate",        purpose: "VIN + op code → labor time range",              status: "live" },
  { endpoint: "POST /v1/parts/recommend",       purpose: "VIN + diagnosis → parts options with quality",  status: "live" },
  { endpoint: "GET  /v1/recall/active",         purpose: "VIN → active recalls",                          status: "live" },
  { endpoint: "POST /v1/feedback/outcome",      purpose: "Closed RO → nightly feedback to engine",        status: "live" },
];

// ── Helpers ───────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>
      {children}
    </div>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 20, ...style }}>
      {children}
    </div>
  );
}

// ── Architecture Tab ──────────────────────────────────────────
function ArchitectureTab() {
  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          WrenchIQ + Predii Architecture
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
          Two distinct technology layers with a clean API boundary. WrenchIQ is the application platform; Predii is the intelligence engine.
        </div>
      </div>

      {/* Layer diagram */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 28 }}>

        {/* WrenchIQ Layer */}
        <Card style={{ borderColor: COLORS.accent, borderWidth: 2, borderRadius: "10px 10px 0 0", background: `${COLORS.accent}08` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Globe size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>WrenchIQ Application Layer</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Shop workflows · Customer UX · Scheduling · Billing · Multi-location ops</div>
            </div>
            <div style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, background: `${COLORS.accent}18`, color: COLORS.accent, border: `1px solid ${COLORS.accent}35`, borderRadius: 5, padding: "3px 8px" }}>AM</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              "Social Inbox", "Smart Scheduling", "DVI / Health Report", "Repair Orders",
              "Parts Intelligence", "Trust Engine", "Customer Portal", "Multi-Location Hub",
            ].map(m => (
              <div key={m} style={{ background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: COLORS.textSecondary, textAlign: "center" }}>
                {m}
              </div>
            ))}
          </div>
        </Card>

        {/* API boundary arrow */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#F8FAFC", border: `1px solid ${COLORS.border}`, borderTop: "none", borderBottom: "none", padding: "10px 20px", gap: 12 }}>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: "5px 14px" }}>
            <Lock size={11} color={COLORS.textMuted} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600 }}>REST API · OAuth 2.0 · versioned · edition-aware</span>
            <ArrowDown size={11} color={COLORS.textMuted} />
          </div>
          <div style={{ flex: 1, height: 1, background: COLORS.border }} />
        </div>

        {/* Predii Layer */}
        <Card style={{ borderColor: COLORS.primary, borderWidth: 2, borderRadius: "0 0 10px 10px", background: `${COLORS.primary}06` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>Predii Core Intelligence Layer</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Contextual Engine · RO Story Writer · Repair Knowledge Graph · Health Prediction</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e", boxShadow: "0 0 6px #22c55e88" }} />
              <span style={{ fontSize: 11, color: "#15803D", fontWeight: 600 }}>Connected</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {[
              "Contextual Engine", "RO Story Writer", "Knowledge Graph", "TSB/DTC Matching",
              "Health Prediction", "Labor Estimator", "Parts Recommender", "Outcome Feedback",
            ].map(m => (
              <div key={m} style={{ background: `${COLORS.primary}0d`, border: `1px solid ${COLORS.primary}25`, borderRadius: 6, padding: "6px 10px", fontSize: 11, color: COLORS.primary, textAlign: "center" }}>
                {m}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Separation principles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 28 }}>
        <Card>
          <SectionLabel>WrenchIQ Owns</SectionLabel>
          {["Shop workflows & customer UX", "Scheduling, billing, notifications", "Third-party integration hub", "Multi-location ops", "LLM: advisor copilot & comms drafts"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={COLORS.accent} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{item}</span>
            </div>
          ))}
        </Card>
        <Card>
          <SectionLabel>Predii Owns</SectionLabel>
          {["Repair intelligence & pattern matching", "Historical knowledge graph (10M+ ROs)", "Contextual RO intake engine", "Vehicle health prediction models", "RO narrative generation (AM format)"].map(item => (
            <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <CheckCircle size={13} color={COLORS.primary} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>{item}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Predii API surface */}
      <Card>
        <SectionLabel>Predii API Surface</SectionLabel>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 14 }}>
          All Predii intelligence is consumed via versioned REST APIs. WrenchIQ is a first-party API consumer — same as any enterprise partner.
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: "42%" }}>Endpoint</th>
              <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Purpose</th>
              <th style={{ textAlign: "center", padding: "8px 12px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, width: 70 }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {PREDII_APIS.map((api, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 11, color: COLORS.primary, background: `${COLORS.primary}04` }}>
                  {api.endpoint}
                </td>
                <td style={{ padding: "9px 12px", color: COLORS.textSecondary }}>{api.purpose}</td>
                <td style={{ padding: "9px 12px", textAlign: "center" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#DCFCE7", color: "#15803D", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 600 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: "#22c55e" }} />
                    Live
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, display: "flex", gap: 20, fontSize: 11, color: COLORS.textMuted }}>
          <span>Protocol: REST / HTTPS</span>
          <span>Auth: OAuth 2.0 client_credentials</span>
          <span>SLA: P95 &lt; 500ms</span>
          <span>Edition: <code style={{ background: COLORS.borderLight, padding: "1px 5px", borderRadius: 3 }}>edition=AM</code></span>
        </div>
      </Card>

      {/* Integration flow */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <SectionLabel>Integration Data Flow</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
            {[
              { label: "3rd-Party Systems", sub: "Twilio · Meta · Stripe · NHTSA · ALLDATA", color: "#64748b", bg: "#F1F5F9" },
              null,
              { label: "WrenchIQ Integration Layer", sub: "Normalizes all data before passing to Predii", color: COLORS.accent, bg: `${COLORS.accent}10` },
              null,
              { label: "Predii APIs", sub: "Stateless · WrenchIQ owns all shop state", color: COLORS.primary, bg: `${COLORS.primary}0d` },
            ].map((item, i) => item === null ? (
              <div key={i} style={{ padding: "0 6px", flexShrink: 0 }}>
                <ArrowRight size={16} color={COLORS.textMuted} />
              </div>
            ) : (
              <div key={i} style={{ flex: 1, background: item.bg, border: `1px solid ${item.color}30`, borderRadius: 8, padding: "12px 16px", minWidth: 180 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color, marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Shield size={10} /> Predii API keys are server-only — never exposed to browser or mobile</span>
            <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Activity size={10} /> Failed Predii calls degrade gracefully — shop workflow never blocked</span>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────
function TeamTab() {
  const allMembers = [
    ...advisors.map(a => ({ ...a, role: "Service Advisor" })),
    ...technicians.map(t => ({ ...t, role: "Technician" })),
  ];
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Team Members</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{SHOP.name} · {allMembers.length} members</div>
        </div>
        <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: "none", background: COLORS.accent, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          + Invite Member
        </button>
      </div>
      <Card style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#F8FAFC" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>NAME</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>ROLE</th>
              <th style={{ textAlign: "left", padding: "10px 16px", color: COLORS.textMuted, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}`, fontSize: 11 }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {allMembers.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${COLORS.borderLight}` }}>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 11, fontWeight: 700 }}>
                      {m.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <span style={{ fontWeight: 600, color: COLORS.textPrimary }}>{m.name}</span>
                  </div>
                </td>
                <td style={{ padding: "12px 16px", color: COLORS.textSecondary }}>{m.role}</td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#DCFCE7", color: "#15803D", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: "#22c55e" }} />
                    Active
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ── Audit Log Tab ─────────────────────────────────────────────
function AuditTab() {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>Audit Log</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>All admin actions · 90-day retention</div>
      </div>
      <Card style={{ padding: 0 }}>
        {AUDIT_ENTRIES.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderBottom: i < AUDIT_ENTRIES.length - 1 ? `1px solid ${COLORS.borderLight}` : "none" }}>
            <div style={{ width: 7, height: 7, borderRadius: 4, background: COLORS.accent, marginTop: 6, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{e.action}</div>
              {e.detail && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{e.detail}</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{e.user}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{e.time}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── System Tab ────────────────────────────────────────────────
function SystemTab() {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.textPrimary }}>System</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Edition config, API credentials, Predii connection</div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Edition */}
        <Card>
          <SectionLabel>Product Edition</SectionLabel>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, border: `2px solid ${COLORS.accent}`, borderRadius: 8, padding: 14, background: `${COLORS.accent}08` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <CheckCircle size={14} color={COLORS.accent} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>WrenchIQ-AM</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Aftermarket · Independent shops & corporate groups · Full SMS platform</div>
            </div>
            <div style={{ flex: 1, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 14, opacity: 0.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 14, height: 14, borderRadius: 7, border: `2px solid ${COLORS.border}` }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary }}>WrenchIQ-OEM</span>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>OEM Dealerships · RO Story Writer only · DMS integrations</div>
            </div>
          </div>
        </Card>

        {/* Predii connection */}
        <Card>
          <SectionLabel>Predii Core Connection</SectionLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: "#22c55e", boxShadow: "0 0 8px #22c55e88" }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#15803D" }}>Connected — All 8 APIs healthy</div>
              <div style={{ fontSize: 11, color: "#16a34a" }}>Last sync: today 8:14 AM · P95 latency: 312ms</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "API Base URL", value: "https://api.predii.com/v1", mono: true },
              { label: "Edition", value: "AM", mono: true },
              { label: "Auth", value: "OAuth 2.0 client_credentials", mono: false },
              { label: "Key rotation", value: "90 days · Next: May 2026", mono: false },
            ].map(f => (
              <div key={f.label}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 3 }}>{f.label}</div>
                <div style={{ background: COLORS.borderLight, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "7px 10px", fontSize: 12, fontFamily: f.mono ? "monospace" : "inherit", color: COLORS.textPrimary }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
          <button style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: "#fff", color: COLORS.textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            <Key size={13} /> Rotate API Key
          </button>
        </Card>

        {/* Cloud infra */}
        <Card>
          <SectionLabel>Cloud Infrastructure</SectionLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Platform", value: "AWS · us-east-1" },
              { label: "Database", value: "PostgreSQL RDS Multi-AZ" },
              { label: "Cache", value: "Redis ElastiCache" },
              { label: "Media", value: "S3 · CloudFront CDN" },
              { label: "Realtime", value: "WebSocket · EventBridge" },
              { label: "Build", value: "React + Vite · ECS/Fargate" },
            ].map(f => (
              <div key={f.label} style={{ background: "#F8FAFC", border: `1px solid ${COLORS.borderLight}`, borderRadius: 6, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{f.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{f.value}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function AMAdminScreen() {
  const [tab, setTab] = useState("architecture");

  return (
    <div style={{ display: "flex", height: "100%", background: COLORS.bg }}>

      {/* Left sidebar */}
      <div style={{ width: 200, background: "#fff", borderRight: `1px solid ${COLORS.border}`, padding: "20px 0", flexShrink: 0 }}>
        <div style={{ padding: "0 16px 16px", borderBottom: `1px solid ${COLORS.borderLight}`, marginBottom: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>Admin</div>
          <div style={{ fontSize: 11, color: COLORS.textMuted }}>WrenchIQ-AM</div>
        </div>
        {TABS.map(t => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "9px 16px", border: "none", cursor: "pointer",
                background: active ? `${COLORS.accent}12` : "transparent",
                color: active ? COLORS.accent : COLORS.textSecondary,
                borderRight: active ? `2px solid ${COLORS.accent}` : "2px solid transparent",
                fontSize: 13, fontWeight: active ? 600 : 400,
                textAlign: "left",
              }}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
        {tab === "architecture" && <ArchitectureTab />}
        {tab === "api"          && <IntegrationsScreen embedded />}
        {tab === "team"         && <TeamTab />}
        {tab === "audit"        && <AuditTab />}
        {tab === "system"       && <SystemTab />}
      </div>
    </div>
  );
}
