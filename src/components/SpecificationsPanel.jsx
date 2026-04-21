// WrenchIQ Specifications Panel — consolidated (AM + OEM unified, agentic positioning)
import { useState } from "react";
import {
  X, Wrench, BookOpen, Users, FileCode, Globe, Layers, Copy, Check,
  BarChart3, Zap, GitBranch, Cpu, MessageSquare, FileText,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Shared UI helpers ─────────────────────────────────────────
function CodeBlock({ code }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
  };
  return (
    <div style={{ position: "relative" }}>
      <pre style={{ background: "#0D1117", color: "#E2E8F0", borderRadius: 8, padding: "14px 16px", overflowX: "auto", fontSize: 11, fontFamily: "'JetBrains Mono','Fira Code','Courier New',monospace", lineHeight: 1.6, margin: 0, whiteSpace: "pre" }}>
        {code}
      </pre>
      <button onClick={handleCopy} style={{ position: "absolute", top: 8, right: 8, background: copied ? "#16A34A" : "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, padding: "4px 8px", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14, marginTop: 24, borderBottom: `1px solid ${COLORS.accent}25`, paddingBottom: 6 }}>{children}</div>;
}
function Row({ label, value, accent }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #F3F4F6", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted, width: 160, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: accent ? COLORS.accent : COLORS.textPrimary, fontWeight: accent ? 700 : 500, flex: 1 }}>{value}</span>
    </div>
  );
}
function Badge({ label, color = COLORS.accent, bg }) {
  return <span style={{ fontSize: 10, fontWeight: 700, color, background: bg || `${color}15`, border: `1px solid ${color}30`, borderRadius: 5, padding: "2px 8px" }}>{label}</span>;
}
function Table({ headers, rows }) {
  return (
    <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`, background: COLORS.primary, padding: "8px 14px" }}>
        {headers.map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>)}
      </div>
      {rows.map((row, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: `repeat(${headers.length}, 1fr)`, padding: "9px 14px", borderBottom: i < rows.length - 1 ? "1px solid #F3F4F6" : "none", background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
          {row.map((cell, j) => <div key={j} style={{ fontSize: 12, color: j === 0 ? COLORS.textPrimary : COLORS.textSecondary, fontWeight: j === 0 ? 600 : 400 }}>{cell}</div>)}
        </div>
      ))}
    </div>
  );
}

// ── Nav sections ──────────────────────────────────────────────
const SECTIONS = [
  { id: "overview",   label: "Overview",            icon: BookOpen },
  { id: "agents",     label: "Agent Architecture",  icon: Cpu },
  { id: "valueprop",  label: "Value Proposition",   icon: Zap },
  { id: "personas",   label: "Personas & UX",       icon: Users },
  { id: "flows",      label: "User Flows",          icon: GitBranch },
  { id: "templates",  label: "Resource Templates",  icon: FileCode },
  { id: "apis",       label: "External APIs",       icon: Globe },
  { id: "arch",       label: "System Architecture", icon: Layers },
];

// ── Section: Overview ─────────────────────────────────────────
function SectionOverview() {
  return (
    <div>
      {/* Vision hero */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45, #0D2A40)", borderRadius: 12, padding: "22px 26px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Product Vision</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", lineHeight: 1.5, marginBottom: 10 }}>
          Moving Shop Management to Agentic Mode
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 10 }}>
          WrenchIQ is the AI intelligence layer on top of any SMS or DMS. A team of autonomous agents watches every repair order, surfaces proactive actions, and gets smarter every week — without replacing the tools shops already use.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic" }}>
          "Your best service advisor — available 24/7, never misses a follow-up, and gets smarter every week."
        </div>
      </div>

      <SectionTitle>What WrenchIQ Is Not</SectionTitle>
      <div style={{ background: "#FFF8F0", border: "1.5px solid #FDE68A", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.7 }}>
          WrenchIQ does <strong style={{ color: COLORS.textPrimary }}>not</strong> replace Mitchell1, Tekmetric, Shop-Ware, CDK, or Reynolds & Reynolds.
          It <strong style={{ color: COLORS.textPrimary }}>attaches to</strong> any existing SMS or DMS — reading normalized RO data and layering autonomous AI agents on top.
          The shop keeps its existing workflow. WrenchIQ adds the thinking layer.
        </div>
      </div>

      <SectionTitle>Two Deployment Contexts — One Product</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          {
            name: "Independent Repair Shops",
            color: COLORS.accent,
            sms: "Mitchell1 · Tekmetric · Shop-Ware · R.O. Writer · AutoFluent",
            value: "Advisor Agent + Tech Agent + Owner Agent on every RO. Trust Engine. Multi-location orchestration.",
          },
          {
            name: "OEM Dealership Locations",
            color: "#2563EB",
            sms: "CDK Global · Reynolds & Reynolds · Dealertrack",
            value: "3C Story Writer. Warranty Claim Readiness Score. Op code confidence matching. Fixed Ops Director dashboard.",
          },
        ].map(c => (
          <div key={c.name} style={{ border: `1.5px solid ${c.color}30`, borderRadius: 10, padding: "16px 18px", background: `${c.color}04` }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: c.color, marginBottom: 8 }}>{c.name}</div>
            <Row label="Works on top of" value={c.sms} />
            <Row label="WrenchIQ adds" value={c.value} accent />
          </div>
        ))}
      </div>

      <SectionTitle>Market</SectionTitle>
      <Table
        headers={["Segment", "Scale", "WrenchIQ Entry Point"]}
        rows={[
          ["OEM Franchised Dealers", "16,000+ US dealers", "3C Story Writer — plugs into DMS, no migration"],
          ["AM Corporate Groups", "12,000+ multi-location operators", "Agent layer on top of their existing SMS"],
          ["AM Independent Shops", "168,000 shops, $1M–$5M/yr", "Agent-augmented SMS (Mitchell1, Tekmetric, etc.)"],
        ]}
      />

      <SectionTitle>Success Metrics</SectionTitle>
      <Table
        headers={["Metric", "Target"]}
        rows={[
          ["RO open time (5-step wizard)", "< 3 minutes"],
          ["DVI completion rate", "90%"],
          ["Customer digital approval", "85% same-day"],
          ["ARO improvement vs baseline", "+20%"],
          ["Tech time-on-wrenches", "+15%"],
          ["Warranty claim rejection reduction", "40%+"],
          ["Parts margin capture improvement", "+3–5%"],
          ["Customer trust score avg", "75/100"],
          ["Agent activation time (new shop)", "< 1 business day"],
        ]}
      />
    </div>
  );
}

// ── Section: Agent Architecture ───────────────────────────────
function SectionAgents() {
  const AGENT_CARDS = [
    {
      id: "advisor", label: "WrenchIQ Advisor Agent", persona: "advisor",
      screen: "Check-in, RO Board, Trust Engine",
      color: "#2563EB",
      responsibilities: [
        "Check-in guidance, upsell framing, fleet account protocol",
        "Surfaces customer memory: payment preferences, approval thresholds, communication style",
        "Appends timestamped events to daily shop log",
        "Drives Trust Engine recommendations",
      ],
      memory_reads: "customer_*, playbook_*, MEMORY.md",
      memory_writes: "logs/YYYY/MM/DD.md (append-only)",
    },
    {
      id: "tech", label: "WrenchIQ Tech Agent", persona: "tech",
      screen: "Tech Mobile View, DVI",
      color: "#16A34A",
      responsibilities: [
        "DVI inspection add-on recommendations",
        "Parts reality checks (availability, cross-references, lead times)",
        "Phrases upsell recommendations to advisor with labor overlap math",
        "Appends inspection findings and bay events to daily log",
      ],
      memory_reads: "playbook_*, vendor_*, MEMORY.md",
      memory_writes: "logs/YYYY/MM/DD.md (append-only)",
    },
    {
      id: "owner", label: "WrenchIQ Owner Agent", persona: "owner",
      screen: "Analytics, Command Center, Multi-Location",
      color: COLORS.accent,
      responsibilities: [
        "End-of-day synthesis and revenue digest",
        "Revenue pipeline visibility — pending approvals, bay utilization",
        "Captures owner corrections as shop playbook rules",
        "Cross-location pattern recognition and SOP deployment",
      ],
      memory_reads: "context_*, playbook_*, MEMORY.md (read-heavy)",
      memory_writes: "playbook_* (owner-validated rules)",
    },
    {
      id: "consolidation", label: "Memory Consolidation Agent", persona: "background",
      screen: "Nightly background worker",
      color: "#6B7280",
      responsibilities: [
        "Runs once per shop after local business close",
        "Merges daily log signals into topic memory files",
        "Resolves contradictions, removes stale pointers",
        "Refreshes MEMORY.md index — coherent for next session",
      ],
      memory_reads: "logs/YYYY/MM/DD.md",
      memory_writes: "customer_*, playbook_*, context_*, MEMORY.md",
    },
  ];

  return (
    <div>
      {/* System overview */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45, #0D2A40)", borderRadius: 12, padding: "20px 24px", marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
          Design Principle
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.65 }}>
          The WrenchIQ agent layer combines <strong style={{ color: "#fff" }}>live shop system state</strong> (RO system, DMS, scheduling board, bay status) with <strong style={{ color: "#fff" }}>durable memory</strong> for anything not reliably derivable from those systems — customer behavioral nuance, owner-validated playbooks, transient operational context. If you can look it up in the DMS or parts catalog, it does not belong in memory.
        </div>
      </div>

      {/* Agent cards */}
      {AGENT_CARDS.map(a => (
        <div key={a.id} style={{ border: `1.5px solid ${a.color}30`, borderRadius: 12, padding: "16px 18px", marginBottom: 14, background: `${a.color}04` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: a.color }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: a.color }}>{a.label}</span>
            <Badge label={a.screen} color={a.color} />
          </div>
          <div style={{ paddingLeft: 20, marginBottom: 10 }}>
            {a.responsibilities.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 5 }}>
                <span style={{ color: a.color, fontSize: 10, marginTop: 3 }}>▸</span>
                <span style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{r}</span>
              </div>
            ))}
          </div>
          <Row label="Memory reads" value={a.memory_reads} />
          <Row label="Memory writes" value={a.memory_writes} accent />
        </div>
      ))}

      <SectionTitle>Memory Architecture — Four Types</SectionTitle>
      <Table
        headers={["Type", "Stores", "Does NOT store"]}
        rows={[
          ["customer", "Behavioral nuance, fleet protocols, communication preferences", "What happened (that's CRM)"],
          ["shop_playbook", "Owner-validated rules, confirmed tactics, approval workflows + Why/How", "Catalog data, list prices"],
          ["shop_context", "Current conditions systems don't model — staffing, equipment, promotions (dated)", "HR records, certifications"],
          ["vendor_and_resource", "Supplier portals, warranty contacts, rate sheets — pointers to external truth", "Full RO payloads"],
        ]}
      />

      <SectionTitle>Memory Layout</SectionTitle>
      <CodeBlock code={`/platform/shops/{shop-id}/memory/
├── MEMORY.md                          # Index — loaded at every session start (~200 lines max)
├── customer_chen_preferences.md       # One file per memory topic
├── customer_kim_fleet_protocol.md
├── playbook_upsell_timing.md
├── playbook_brake_bundle_discount.md
├── context_surge_week_apr2026.md
├── vendor_worldpac_brake_parts.md
└── logs/
    └── 2026/
        └── 04/
            └── 2026-04-15.md          # Append-only raw signal during business day`} />

      <SectionTitle>Memory Consolidation — Nightly Phases</SectionTitle>
      <Table
        headers={["Phase", "Action"]}
        rows={[
          ["1 — Inspect", "List existing topic files + read current MEMORY.md"],
          ["2 — Gather Signal", "Read logs/YYYY/MM/DD.md, query tools if needed"],
          ["3 — Merge", "Push new signal into topic files, avoid near-duplicates"],
          ["4 — Clean", "Remove stale pointers, resolve contradictions, refresh MEMORY.md index"],
          ["Lock / unlock", "Per-shop lock with 1-hour stale timeout. Roll back watermark on failure."],
        ]}
      />

      <SectionTitle>Real-Time: Memory + Live State Combined</SectionTitle>
      <Table
        headers={["Live State (from SMS/DMS)", "Durable Memory", "Agent Output"]}
        rows={[
          ["Open RO line items, bay idle windows", "Shop playbook rules, customer preferences", "Prioritized action + call script + price position"],
          ["Pending approvals, clock time", "Context priorities, call window playbook", "Ordered action queue for end-of-day"],
          ["Parts availability, labor overlap", "Timing belt/water pump playbook, customer history", "Phased upsell recommendation with labor overlap justification"],
        ]}
      />

      <SectionTitle>Multi-Tenant Isolation</SectionTitle>
      <div style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", borderRadius: 10, padding: "14px 18px", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.65 }}>
        <strong style={{ color: COLORS.textPrimary }}>No cross-shop memory reads.</strong> Each shop's agents read and write only their own memory prefix. The Fleet Orchestrator schedules consolidation with jitter across shops — never a global lock. Three platform tiers: <em>real-time advisors</em> (stateless request/response, continuity from memory), <em>nightly consolidation</em> (scheduled per-shop, lock-protected), and <em>fleet orchestration</em> (kill switches, tunable windows).
      </div>
    </div>
  );
}

// ── Section: Value Proposition ────────────────────────────────
function SectionValueProp() {
  const INDEPENDENT_VALUE = [
    { title: "Zero SMS Replacement Friction", detail: "Any shop on Mitchell1, Tekmetric, Shop-Ware, or R.O. Writer activates the agent layer in under a day. No data migration, no workflow change, no retraining." },
    { title: "AI Copilot on Every Screen", detail: "Contextually aware across all screens — not an isolated chat bolt-on. Each persona's agent surfaces the right action for that moment in the repair workflow." },
    { title: "Persistent Shop Memory", detail: "The agent remembers customer preferences, owner-validated playbooks, and shop context across every session. It gets smarter every week without manual programming." },
    { title: "Proactive Trust Engine", detail: "At-risk customer scoring before they churn. Flags unhappy customers at 72 hours, not after a 1-star review. Proactive vs. reactive." },
    { title: "Multi-Location Fleet Intelligence", detail: "100-location command center with real-time performance visibility — 3C compliance rates, technician efficiency, revenue vs target, SOP deployment." },
    { title: "6-Vendor AI Parts Ranking", detail: "Real-time pricing from Worldpac, O'Reilly, PartsTech and 3 more. AI-ranked by margin, availability, and delivery ETA in one screen." },
  ];

  const OEM_VALUE = [
    { title: "3C Story Writer — Plugs Into DMS", detail: "AI-generated Complaint · Cause · Correction narratives from voice, DTC, and tech notes. OEM-compliant in under 30 seconds. Direct push to CDK, R&R, Dealertrack — no copy-paste." },
    { title: "Warranty Claim Readiness Score", detail: "96-point real-time checklist before submission. Recovers $3,000–$6,000/mo per dealer in previously rejected warranty claims." },
    { title: "Op Code Confidence Matching", detail: "AI matches repair to top-3 OEM labor operation codes with confidence percentage. Eliminates wrong-code rejections — the #1 cause of warranty claim rejection." },
    { title: "Fixed Ops Director Dashboard", detail: "Per-advisor approval rates, rejection root cause analysis, dollars-at-risk, multi-dealer rollup — all in one view. No manual reporting." },
    { title: "DMS Bi-Directional Sync", detail: "Field-mapped sync with CDK Fortellis, Reynolds ERA-IGNITE, and Dealertrack. ROs opened in DMS appear instantly in WrenchIQ. No double-entry." },
    { title: "OEM Tech Agent on Every Bay", detail: "TSB auto-match by VIN + complaint, voice note → 3C narrative, warranty flag, op code confirm — iPad native. Guides techs without disrupting workflow." },
  ];

  const WHY = [
    ["AI-native, not AI-retrofitted", "Every screen, every workflow was designed around AI assistance from day one. Competitors bolt on chat windows after the fact."],
    ["Adds to what shops already have", "WrenchIQ never asks a shop to abandon their SMS or a dealer to replace their DMS. The agent layer activates on top — frictionless adoption."],
    ["Predii's 10-year automotive data advantage", "Built on Predii's automotive AI/ML platform — OEM data, TSB/recall corpus, repair pattern models already in production. Not starting from scratch."],
    ["Shop memory that compounds", "The more a shop uses WrenchIQ, the smarter it gets. Owner playbooks, customer preferences, and confirmed tactics accumulate into a permanent intelligence asset."],
    ["Customer trust as a first-class metric", "Trust Engine scores every customer relationship 0–100. No competitor treats customer retention as a data model. WrenchIQ does."],
  ];

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #0D3B45, #1a2e44)", borderRadius: 14, padding: "22px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
          Internal — For Sales, Product & Engineering
        </div>
        <div style={{ fontSize: 17, fontWeight: 900, color: "#fff", lineHeight: 1.4, marginBottom: 8 }}>
          WrenchIQ adds the thinking layer.<br />The SMS keeps the data.
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, maxWidth: 540 }}>
          Most SMS platforms are excellent record-keeping tools but passive — they store data, they do not think. WrenchIQ acts as the thinking layer on top: watching every RO, surfacing the right action to the right person at the right moment.
        </div>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: `${COLORS.accent}18` }} />
      </div>

      <SectionTitle>For Independent Repair Shops</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {INDEPENDENT_VALUE.map((h, i) => (
          <div key={i} style={{ border: `1.5px solid ${COLORS.accent}20`, borderRadius: 10, padding: "14px 16px", background: `${COLORS.accent}04` }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>{h.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>{h.detail}</div>
          </div>
        ))}
      </div>

      <SectionTitle>For OEM Dealership Locations</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {OEM_VALUE.map((h, i) => (
          <div key={i} style={{ border: "1.5px solid rgba(37,99,235,0.2)", borderRadius: 10, padding: "14px 16px", background: "rgba(37,99,235,0.03)" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>{h.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>{h.detail}</div>
          </div>
        ))}
      </div>

      <SectionTitle>Why WrenchIQ — Internal Talking Points</SectionTitle>
      {WHY.map(([title, detail], i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "12px 16px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}

      <SectionTitle>Quantified Impact</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {[
          { val: "+20%",  label: "ARO improvement",             sub: "AI parts + approval nudges" },
          { val: "$3K+",  label: "Warranty recovery / dealer",  sub: "claim readiness score — OEM" },
          { val: "85%",   label: "Same-day digital approvals",  sub: "magic link SMS flow" },
          { val: "< 1d",  label: "Agent activation time",       sub: "new shop, any SMS" },
          { val: "< 3m",  label: "New RO open time",            sub: "5-step wizard" },
          { val: "100+",  label: "Locations, one dashboard",    sub: "corporate group command" },
        ].map((m, i) => (
          <div key={i} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: COLORS.accent, letterSpacing: -1, marginBottom: 4 }}>{m.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Personas ─────────────────────────────────────────
function SectionPersonas() {
  const PERSONAS = [
    {
      id: "advisor", label: "Service Advisor", color: "#2563EB",
      philosophy: "One screen. One flow. The rest is automatic.",
      landing: "Queue + active RO board (In Queue / Diagnosing / Approval / Ready Pickup) + Next Up card",
      workflow: "5-step guided RO: Customer Lookup → Vehicle Confirm → Complaint Entry → Intelligent Estimate → Approval & RO Open",
      nav: ["RO Queue & Board", "Parts Intelligence", "Scheduling", "Trust Engine"],
      ai: "Complaint → diagnosis, vendor auto-pricing, approval nudge, TSB flagging. Advisor Agent surfaces memory-backed customer context.",
    },
    {
      id: "tech", label: "Technician", color: "#16A34A",
      philosophy: "Large touch targets. Voice-first. Zero navigation. Work comes to them.",
      landing: "iPad-optimized job list — Active + Up Next cards with RO number, vehicle, job description",
      workflow: "8-point DVI: full-screen category by category, YES/WATCH/NO, camera + voice per item, 60s video walkaround",
      nav: ["My Jobs", "Reports"],
      ai: "Tech Agent: auto-suggest labor code + parts + time after marking Needs Service. TSB viewer pre-loaded per RO. Upsell phrasing to advisor.",
    },
    {
      id: "owner", label: "Shop Owner", color: COLORS.accent,
      philosophy: "An intelligent agent that manages the shop for you. You ask questions. It answers.",
      landing: "Revenue vs target, bay utilization, approval rate, CSI; WrenchIQ Agent proactive alerts; Live 6-bay grid",
      workflow: "Natural language commands: 'What's my best tech?' / 'Move Volvo to Bay 2' / 'Worldpac spend vs last month?'",
      nav: ["Today", "Bays", "Suppliers", "Team", "Reports"],
      ai: "Owner Agent: revenue forecasting, margin leak detection, rebate optimization, approval nudges, tech performance. Captures corrections as playbook rules.",
    },
    {
      id: "customer", label: "Car Owner", color: "#7C3AED",
      philosophy: "DoorDash for your car. Real-time, visual, mobile-first. No login friction.",
      landing: "Magic link via SMS → vehicle card, live progress bar (4 steps), What We Found, digital approval",
      workflow: "Approve All / Approve Selected / Decline / Call Shop → digital signature → live RO status → pay via Apple Pay / Stripe",
      nav: ["None — single-page progressive disclosure"],
      ai: "Plain-English repair explanations, wait time estimates, price transparency",
    },
  ];

  return (
    <div>
      <SectionTitle>AI Capabilities by Persona</SectionTitle>
      <Table
        headers={["Capability", "Advisor Agent", "Tech Agent", "Owner Agent", "Customer"]}
        rows={[
          ["Parts auto-pricing",        "Primary",   "—",         "Visibility", "—"],
          ["Complaint → diagnosis",     "Primary",   "Reference", "—",          "—"],
          ["Inspection AI suggestions", "—",         "Primary",   "—",          "—"],
          ["Revenue forecasting",       "—",         "—",         "Primary",    "—"],
          ["Upsell phrasing to advisor","—",         "Primary",   "—",          "—"],
          ["Rebate optimization",       "—",         "—",         "Primary",    "—"],
          ["Customer memory recall",    "Primary",   "—",         "—",          "—"],
          ["Playbook capture",          "—",         "—",         "Primary",    "—"],
          ["Plain-English report",      "—",         "—",         "—",          "Primary"],
          ["TSB / recall lookup",       "Primary",   "Reference", "—",          "—"],
        ]}
      />

      {PERSONAS.map(p => (
        <div key={p.id} style={{ border: `1.5px solid ${p.color}30`, borderRadius: 12, padding: "16px 18px", marginBottom: 14, background: `${p.color}04` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: p.color }}>{p.label}</span>
          </div>
          <div style={{ fontSize: 12, fontStyle: "italic", color: COLORS.textSecondary, marginBottom: 10, paddingLeft: 20 }}>"{p.philosophy}"</div>
          <Row label="Landing View"    value={p.landing} />
          <Row label="Core Workflow"   value={p.workflow} />
          <Row label="Navigation"      value={p.nav.join(" · ")} />
          <Row label="AI Capabilities" value={p.ai} accent />
        </div>
      ))}

      <SectionTitle>DVI Inspection — 8 Standard Sections</SectionTitle>
      <Table
        headers={["#", "Section", "Key Items"]}
        rows={[
          ["1", "Tires & Wheels",        "Tread depth (32nds), tire pressure (PSI), wheel condition"],
          ["2", "Brakes",                "Front/rear pad thickness (mm), rotor condition, brake fluid"],
          ["3", "Suspension & Steering", "Ball joints, tie rods, shocks/struts"],
          ["4", "Fluids & Filters",      "Engine oil, coolant, transmission fluid, air filter"],
          ["5", "Belts & Hoses",         "Serpentine belt, coolant hoses, power steering hose"],
          ["6", "Battery & Electrical",  "CCA load test, terminals, alternator output"],
          ["7", "Lights & Wipers",       "All exterior lights, wiper blade condition"],
          ["8", "Engine & Exhaust",      "Leaks, exhaust condition, catalytic converter"],
        ]}
      />
    </div>
  );
}

// ── Section: Flows ────────────────────────────────────────────
function SectionFlows() {
  const FLOWS = [
    {
      title: "Flow 1: SMS Adapter Activation",
      time: "< 1 business day",
      steps: [
        "Shop selects SMS platform (Mitchell1, Tekmetric, Shop-Ware…)",
        "WrenchIQ Normalization Layer parses SMS-native RO format",
        "Maps to Universal WrenchIQ RO Schema → writes to MongoDB",
        "Agent Layer activates — Advisor, Tech, Owner agents online",
        "MEMORY.md bootstrapped from existing customer + RO history",
        "First proactive alert surfaced within hours of activation",
      ],
    },
    {
      title: "Flow 2: Check-In → Estimate Approval (Zero Paper)",
      time: "< 3 min RO open",
      steps: [
        "License plate scan → customer profile + TSBs + comm preference loads instantly",
        "Advisor Agent recalls customer memory: 'Monica approves spend herself, no financing offers'",
        "5-step RO Wizard → tech assigned",
        "Tech Agent completes DVI with photo/video/voice, suggests labor codes",
        "AI generates health report in < 15 seconds",
        "Customer receives SMS link → digital approval → parts ordered → Apple Pay",
        "2hr post-pickup: review request auto-sent via Twilio",
      ],
    },
    {
      title: "Flow 3: OEM Warranty Claim — 3C Story Writer",
      time: "< 30 seconds narrative",
      steps: [
        "Tech completes repair → enters DTCs + voice note",
        "3C Story Writer generates Complaint · Cause · Correction narrative",
        "Op code confidence matching identifies top-3 OEM labor ops",
        "Warranty Claim Readiness Score computed (96-point checklist)",
        "Advisor reviews, approves → one-click DMS push to CDK/R&R/Dealertrack",
        "Claim submitted — all fields mapped, no copy-paste",
      ],
    },
    {
      title: "Flow 4: Owner Daily Briefing",
      time: "5 min / day",
      steps: [
        "Owner opens app → Owner Agent loads context_* + playbook_* from memory",
        "Agent queries live RO system: pending approvals, bay status, ELR",
        "'3 pending approvals worth $2,840. Bay 4 idle since 2pm — 2hr window available.'",
        "Owner replies: 'Add rule: always call pending approvals by 4pm'",
        "Owner Agent writes playbook_approval_call_window.md",
        "Rule active for all future Advisor Agent sessions",
      ],
    },
    {
      title: "Flow 5: Corporate Group Morning Review",
      time: "10 min / day",
      steps: [
        "Owner opens iPhone 6 AM → 94 green / 4 yellow / 2 red location map",
        "Fleet Orchestrator has run nightly consolidation across all shops",
        "AI morning brief: best location Houston 3 ($67K, 4.9★)",
        "Concern: Phoenix 7 comeback rate +12% → Fleet Agent identifies pattern",
        "Owner taps 'Deploy Training' → playbook pushed to Phoenix 7 tech agents",
        "Approves parts transfer across 23 locations before 7 AM team call",
      ],
    },
  ];

  return (
    <div>
      <SectionTitle>Speed Standards</SectionTitle>
      <Table
        headers={["Action", "Target Time"]}
        rows={[
          ["Agent activation (new shop, any SMS)", "< 1 business day"],
          ["Check-in to RO open",                  "< 60 seconds"],
          ["New RO via 5-step wizard",              "< 3 minutes"],
          ["DVI health report generation",          "< 15 seconds"],
          ["Customer digital approval",             "< 3 minutes"],
          ["3C narrative generation",               "< 30 seconds"],
          ["Parts pricing (3 vendors, real-time)",  "< 2 seconds"],
          ["VIN → TSB + recall check",              "< 1 second"],
        ]}
      />

      {FLOWS.map((f, i) => (
        <div key={i} style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${COLORS.accent}18`, border: `1.5px solid ${COLORS.accent}35`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: COLORS.accent, flexShrink: 0 }}>{i + 1}</div>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{f.title}</span>
            <Badge label={f.time} />
          </div>
          <div style={{ paddingLeft: 34, display: "flex", flexDirection: "column", gap: 5 }}>
            {f.steps.map((s, j) => (
              <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: COLORS.textMuted, flexShrink: 0, marginTop: 1 }}>{j + 1}</div>
                <span style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section: Templates ────────────────────────────────────────
const FILE_CONTENTS = {
  shop_config: `{
  "shop_id": "shop-001",
  "name": "Peninsula Precision Auto",
  "address": "2847 El Camino Real, Palo Alto, CA 94306",
  "labor_rate": 195,
  "bays": 6,
  "sms_adapter": "tekmetric",
  "agent_layer": {
    "advisor_agent": true,
    "tech_agent": true,
    "owner_agent": true,
    "consolidation_window": "22:00-23:59 local"
  },
  "integrations": {
    "parts_vendors": ["worldpac", "oreilly", "partstech"],
    "accounting": "quickbooks",
    "payments": ["stripe", "dignifi", "sunbit"]
  },
  "ai": {
    "model": "claude-sonnet-4-6",
    "context_aware": true,
    "proactive_alerts": true
  }
}`,
  repair_order: `{
  "ro_id": "RO-2024-1187",
  "shop_id": "shop-001",
  "customer_id": "cust-003",
  "vehicle_id": "veh-001",
  "advisor_id": "adv-001",
  "tech_id": "tech-001",
  "status": "awaiting_approval",
  "complaint": "Check engine light, rough idle at startup",
  "diagnosis": "P0420 — Catalyst system efficiency below threshold (Bank 1)",
  "tsb_refs": ["TSB-2021-0144"],
  "line_items": [
    { "id": "li-001", "type": "labor", "description": "Diagnostic Fee", "hours": 0.5, "rate": 195, "total": 97.50 },
    { "id": "li-002", "type": "part",  "description": "Catalytic Converter", "vendor": "worldpac", "cost": 218, "price": 420, "ai_selected": true },
    { "id": "li-003", "type": "labor", "description": "Labor — Installation 1.5 hrs", "hours": 1.5, "rate": 195, "total": 292.50 }
  ],
  "subtotal": 810.00,
  "tax": 53.44,
  "total": 863.44,
  "approval_channel": "sms"
}`,
  memory_index: `# MEMORY.md — Peninsula Precision Auto
# Index — loaded at every agent session start

- [Sarah Chen preferences](customer_chen_preferences.md) — itemized quotes, approves spend herself, no financing offers
- [Kim Fleet protocol](customer_kim_fleet_protocol.md) — PO required >$500, call Mike not Lisa
- [Brake bundle playbook](playbook_brake_bundle_discount.md) — 8% bundle with rotors improved close rate 23%
- [Water pump with timing belt](playbook_upsell_timing.md) — always recommend when timing belt; labor overlap justification
- [Worldpac net-30 terms](vendor_worldpac_terms.md) — net-30 account, rep is Jake at (650) 555-0181
- [April surge context](context_surge_week_apr2026.md) — car show weekend Apr 19-20, 40% capacity surge expected`,
  dealer_config: `{
  "dealer_id": "dlr-00142",
  "oem_brand": "Honda",
  "franchise_code": "HDA-94306",
  "dealer_name": "Peninsula Honda",
  "dms": {
    "provider": "cdk",
    "endpoint": "https://api.cdk.com/fortellis/v2",
    "dealer_code": "94306-H",
    "sync_interval_min": 5
  },
  "agent_layer": {
    "advisor_agent": true,
    "tech_agent": true,
    "story_writer": true,
    "warranty_rules_engine": true
  },
  "warranty": {
    "oem_portal": "https://warranty.honda.com/api/v2",
    "auto_submit": true,
    "claim_readiness_threshold": 85
  },
  "compliance": {
    "csi_target": 92,
    "mpi_required": true,
    "story_writer_enabled": true
  }
}`,
  warranty_claim: `{
  "claim_id": "WC-2024-00891",
  "dealer_id": "dlr-00142",
  "ro_id": "RO-DLR-5541",
  "oem_brand": "Honda",
  "vin": "1HGCV1F30MA012345",
  "complaint": "Transmission rough shifting between 2nd and 3rd gear",
  "cause": "Transmission control module software version 1.2.4 — calibration defect",
  "correction": "Reflashed TCM to version 1.4.1 per HDA TSB #23-041",
  "tsb_number": "HDA-2023-041",
  "labor_ops": [
    { "op_code": "28111600AA", "desc": "TCM Reprogram", "hrs": 0.4 }
  ],
  "readiness_score": 96,
  "claim_amount": 78.00,
  "dms_push": { "target": "CDK", "dealer_code": "04147", "status": "ready" }
}`,
};

const TEMPLATE_FILES = [
  { id: "shop_config",    label: "shop_config.json",    note: "Independent shop" },
  { id: "repair_order",   label: "repair_order.json",   note: "Universal RO schema" },
  { id: "memory_index",   label: "MEMORY.md",           note: "Shop memory index" },
  { id: "dealer_config",  label: "dealer_config.json",  note: "OEM dealer" },
  { id: "warranty_claim", label: "warranty_claim.json", note: "OEM warranty" },
];

function SectionTemplates() {
  const [activeFile, setActiveFile] = useState(TEMPLATE_FILES[0].id);
  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
        Core schemas for WrenchIQ — the Universal RO Schema, shop memory index format, and dealer configuration. These define the data contracts between the SMS adapter, agent layer, and integration partners.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {TEMPLATE_FILES.map(f => (
          <button key={f.id} onClick={() => setActiveFile(f.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${activeFile === f.id ? COLORS.accent : COLORS.border}`, background: activeFile === f.id ? `${COLORS.accent}10` : "#F9FAFB", color: activeFile === f.id ? COLORS.accent : COLORS.textSecondary, fontSize: 12, fontWeight: activeFile === f.id ? 700 : 500, cursor: "pointer" }}>
            <span>{f.label}</span>
            <span style={{ fontSize: 10, color: COLORS.textMuted, marginLeft: 6 }}>({f.note})</span>
          </button>
        ))}
      </div>
      <CodeBlock code={FILE_CONTENTS[activeFile] || "// No template found"} />
    </div>
  );
}

// ── Section: APIs ─────────────────────────────────────────────
function SectionAPIs() {
  const API_GROUPS = [
    {
      group: "SMS / DMS Adapters", color: "#0D3B45",
      apis: [
        { name: "Mitchell1",         use: "North America's largest SMS — RO read + write-back via API", endpoint: "api.mitchell1.com/v2",              status: "MOCK" },
        { name: "Tekmetric",         use: "Cloud-native SMS — full RO, customer, vehicle API",          endpoint: "api.tekmetric.com/v1",              status: "DEMO" },
        { name: "Shop-Ware",         use: "RO + customer + parts API — bi-directional sync",             endpoint: "app.shop-ware.com/api/v4",          status: "MOCK" },
        { name: "CDK Global",        use: "Full DMS bi-directional sync — ROs, customers, parts, labor", endpoint: "api.cdk.com/fortellis/v2",          status: "MOCK" },
        { name: "Reynolds & Reynolds","use": "ERA-IGNITE DMS integration — RO push/pull",               endpoint: "api.reyrey.com/v1",                 status: "MOCK" },
        { name: "Dealertrack",        use: "F&I and service lane DMS sync",                              endpoint: "api.dealertrack.com/v1",            status: "MOCK" },
      ],
    },
    {
      group: "Communication & Messaging", color: "#2563EB",
      apis: [
        { name: "Twilio",                  use: "SMS approval links, status updates, review requests", endpoint: "api.twilio.com/2010-04-01",           status: "DEMO" },
        { name: "Podium",                  use: "Review management, customer messaging hub",           endpoint: "api.podium.com/v2",                  status: "MOCK" },
        { name: "Google Business Messages","use": "Google DM → appointment → RO conversion",          endpoint: "businessmessages.googleapis.com/v1",  status: "DEMO" },
      ],
    },
    {
      group: "Payments & Financing", color: "#16A34A",
      apis: [
        { name: "Stripe",   use: "Invoice payment, Apple Pay, deposit collection",         endpoint: "api.stripe.com/v1",     status: "MOCK" },
        { name: "DigniFi",  use: "Point-of-approval financing for repairs $500–$5,000",   endpoint: "api.dignifi.com/v2",    status: "MOCK" },
        { name: "Sunbit",   use: "Buy-now-pay-later at digital approval screen",           endpoint: "api.sunbit.com/v1",     status: "MOCK" },
      ],
    },
    {
      group: "Parts Vendors", color: "#0891B2",
      apis: [
        { name: "Worldpac",   use: "Real-time parts pricing + availability + ETA",             endpoint: "api.worldpac.com/v2/pricing", status: "DEMO" },
        { name: "O'Reilly",   use: "Parts pricing + same-day availability check",              endpoint: "api.oreillyauto.com/v1",      status: "DEMO" },
        { name: "PartsTech",  use: "Parts aggregator — 30+ suppliers in one call",             endpoint: "api.partstech.com/v2",        status: "MOCK" },
      ],
    },
    {
      group: "Vehicle Data", color: "#DC2626",
      apis: [
        { name: "NHTSA",   use: "Recall lookup per VIN, safety campaign detection",         endpoint: "api.nhtsa.gov/recalls/recallsByVehicle", status: "DEMO" },
        { name: "ALLDATA", use: "Labor times, TSBs, wiring diagrams, OEM specs",            endpoint: "alldata.com/api/v1",                    status: "DEMO" },
      ],
    },
    {
      group: "OEM Warranty Portals", color: "#7C3AED",
      apis: [
        { name: "Honda Warranty",    use: "Claim submission, status, rejection recovery",             endpoint: "warranty.honda.com/api/v2",        status: "MOCK" },
        { name: "Toyota TIS",        use: "Tech info system — TSBs, warranty claims, ETM",            endpoint: "techinfo.toyota.com/api/v1",       status: "MOCK" },
        { name: "GM GlobalConnect",  use: "Warranty claim submission + labor op validation",          endpoint: "api.gmglobalconnect.com/v2",       status: "MOCK" },
      ],
    },
  ];

  const STATUS_COLORS = { LIVE: "#16A34A", DEMO: "#2563EB", MOCK: "#6B7280" };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        {[["LIVE", "Real API"], ["DEMO", "demoData.js"], ["MOCK", "Static UI"]].map(([s, d]) => (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: STATUS_COLORS[s] }} />
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}><strong>{s}</strong> — {d}</span>
          </div>
        ))}
      </div>
      {API_GROUPS.map(group => (
        <div key={group.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: group.color, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: group.color }} />
            {group.group}
          </div>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, overflow: "hidden" }}>
            {group.apis.map((api, i) => (
              <div key={api.name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 210px 56px", padding: "10px 14px", borderBottom: i < group.apis.length - 1 ? "1px solid #F3F4F6" : "none", background: "#fff", alignItems: "start", gap: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{api.name}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.4 }}>{api.use}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: "monospace" }}>{api.endpoint}</div>
                <div><Badge label={api.status} color={STATUS_COLORS[api.status]} /></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Section: System Architecture ─────────────────────────────
function SectionArch() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.8 }}>
            WrenchIQ — System Architecture
          </div>
          <a href="/architecture-am.html" target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}30`, borderRadius: 6, padding: "4px 10px" }}>
            ↗ Open full screen
          </a>
        </div>
        <div style={{ border: `1.5px solid ${COLORS.accent}30`, borderRadius: 12, overflow: "hidden", background: "#F0F4F5" }}>
          <iframe src="/architecture-am.html" title="WrenchIQ Architecture Diagram" style={{ width: "100%", height: 520, border: "none", display: "block" }} />
        </div>
      </div>

      <SectionTitle>Layered Architecture</SectionTitle>
      <CodeBlock code={`Existing SMS / DMS
  (Mitchell1 · Tekmetric · Shop-Ware · CDK · Reynolds & Reynolds)
         │  SMS/DMS Adapter (read + optional write-back)
         ▼
┌─────────────────────────────────────────┐
│  WrenchIQ Normalization Layer           │
│  • Parses SMS-native RO format          │
│  • Maps to Universal WrenchIQ RO Schema │
│  • Stores normalized ROs in MongoDB     │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  WrenchIQ Agent Layer (ADK)             │
│                                         │
│  Advisor Agent  Tech Agent  Owner Agent │
│  Memory Layer   Tool Access  Monitoring │
│  ─────────────  ───────────  ────────── │
│  • Shop prefs   • RO data    • 5-min    │
│  • Playbooks    • Parts      • Events   │
│  • Customer*    • Recalls    • Digest   │
│  • Context*     • TSBs                  │
└──────────────────┬──────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│  Delivery Channels                      │
│  • WrenchIQ UI (web/mobile)             │
│  • SMS / push notification to advisor   │
│  • Customer-facing magic link           │
│  • Optional: write-back to source SMS   │
└─────────────────────────────────────────┘`} />

      <SectionTitle>Tech Stack</SectionTitle>
      <Table
        headers={["Layer", "Technology"]}
        rows={[
          ["Frontend",      "React 18 + Vite, Lucide React icons, Recharts"],
          ["State",         "React useState / Context — no Redux"],
          ["AI / LLM",      "Claude claude-sonnet-4-6 (claude-sonnet-4-6) via Anthropic API"],
          ["Agent SDK",     "Google ADK — Advisor, Tech, Owner, Consolidation agents"],
          ["Vector DB",     "Pinecone — semantic TSB/recall/history search"],
          ["Backend",       "Node.js on AWS ECS/Fargate"],
          ["Database",      "MongoDB (ROs, memory) + Redis (cache) + S3 (media)"],
          ["SMS",           "Twilio — approval links, status updates"],
          ["Payments",      "Square + DigniFi + Sunbit"],
          ["Accounting",    "Xero (GL sync · invoice lifecycle) + QuickBooks"],
          ["Telemetry",     "OTel — quality monitoring across all agents"],
          ["Security",      "SOC 2 Type II · PCI-DSS (Square tokenizes) · CCPA"],
        ]}
      />

      <SectionTitle>Core Data Entities</SectionTitle>
      <Table
        headers={["Entity", "Key Fields"]}
        rows={[
          ["Shop",        "shop_id, sms_adapter, labor_rate, bays, agent_layer config"],
          ["Customer",    "customer_id, trust_score, ltv, approval_rate, communication_pref"],
          ["Vehicle",     "vin, year/make/model, mileage, license_plate, service_history"],
          ["RepairOrder", "ro_id, status, complaint, diagnosis, line_items, total, dvi_id"],
          ["LineItem",    "type (labor/part), labor_code, vendor, cost, price, margin_pct"],
          ["DVI",         "template_id, sections[], findings, video_url, ai_suggestions"],
          ["MemoryIndex", "MEMORY.md per shop — pointer to all topic files"],
          ["MemoryTopic", "customer_*, playbook_*, context_*, vendor_* files per shop"],
          ["DailyLog",    "logs/YYYY/MM/DD.md — append-only raw signal during business day"],
        ]}
      />

      <SectionTitle>WrenchIQ Agent — Screen Context Map</SectionTitle>
      <Table
        headers={["Screen", "Agent Behavior"]}
        rows={[
          ["Dashboard",          "Revenue opportunities, bottleneck alerts, daily priorities"],
          ["Repair Orders",      "Next action prompts, ETA recalculation, upsell flags"],
          ["DVI",                "Auto-suggest repairs from inspection findings, TSB lookup"],
          ["Health Report",      "Customer communication tone coaching, price framing"],
          ["Parts Intelligence", "Vendor recommendation, margin optimization, ETA comparison"],
          ["Trust Engine",       "Customer recovery scripts, review request timing, VIP flags"],
          ["Analytics",          "Anomaly detection, benchmark comparisons, trend narration"],
          ["Multi-Location",     "Underperformer alerts, best-practice sharing, SOP gaps"],
          ["Owner — Today",      "Revenue gap analysis, bay utilization, approval nudges"],
          ["Advisor — RO",       "Complaint → diagnosis, vendor auto-pricing, memory-backed customer context"],
          ["Tech — DVI",         "Labor code suggestion, parts estimate, upsell phrasing to advisor"],
          ["Customer Portal",    "Wait time estimate, plain-English explanations"],
        ]}
      />
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export default function SpecificationsPanel({ onClose }) {
  const [section, setSection] = useState("overview");
  const activeSection = SECTIONS.find(s => s.id === section);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", flexDirection: "column", background: "#fff", fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      {/* Top bar */}
      <div style={{ height: 52, background: COLORS.primary, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={12} color="#fff" style={{ transform: "rotate(-45deg)" }} />
            </div>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: -0.4 }}>
              WrenchIQ<span style={{ color: COLORS.accent }}>.ai</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>Product Specifications</span>
            </span>
          </button>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
          <X size={14} /> Close
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: 210, background: COLORS.bgDark, display: "flex", flexDirection: "column", flexShrink: 0, padding: "12px 8px" }}>
          {SECTIONS.map(s => {
            const Icon = s.icon;
            const active = section === s.id;
            return (
              <button key={s.id} onClick={() => setSection(s.id)} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 12px", borderRadius: 8, border: "none", cursor: "pointer", background: active ? `${COLORS.accent}20` : "transparent", color: active ? COLORS.accent : "rgba(255,255,255,0.45)", fontSize: 12, fontWeight: active ? 700 : 400, textAlign: "left", marginBottom: 2, transition: "all 0.12s" }}>
                <Icon size={14} />
                {s.label}
              </button>
            );
          })}

          <div style={{ marginTop: "auto", padding: "10px 12px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>WrenchIQ.ai</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Agentic Shop Intelligence</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>© 2026 Predii, Inc.</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <div style={{ maxWidth: 860 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{activeSection?.label}</h2>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>WrenchIQ.ai · Product Specifications · April 2026 · PREDII CONFIDENTIAL</div>

            {section === "overview"   && <SectionOverview />}
            {section === "agents"     && <SectionAgents />}
            {section === "valueprop"  && <SectionValueProp />}
            {section === "personas"   && <SectionPersonas />}
            {section === "flows"      && <SectionFlows />}
            {section === "templates"  && <SectionTemplates />}
            {section === "apis"       && <SectionAPIs />}
            {section === "arch"       && <SectionArch />}
          </div>
        </div>
      </div>
    </div>
  );
}
