import { useState } from "react";
import {
  X, Wrench, BookOpen, Users, FileCode, Globe, Layers, Copy, Check,
  BarChart3, Zap, Shield, TrendingUp, GitBranch, Target,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Code Block ────────────────────────────────────────────────
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

// ── Shared UI helpers ─────────────────────────────────────────
function SectionTitle({ children }) {
  return <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 14, marginTop: 24, borderBottom: `1px solid ${COLORS.accent}25`, paddingBottom: 6 }}>{children}</div>;
}
function Row({ label, value, accent }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "7px 0", borderBottom: "1px solid #F3F4F6", alignItems: "flex-start" }}>
      <span style={{ fontSize: 12, color: COLORS.textMuted, width: 150, flexShrink: 0 }}>{label}</span>
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

// ── File template data ────────────────────────────────────────
const FILE_CONTENTS = {
  shop_config: `{
  "shop_id": "shop-001",
  "edition": "AM",
  "name": "Peninsula Precision Auto",
  "address": "2847 El Camino Real, Palo Alto, CA 94306",
  "phone": "(650) 555-0192",
  "labor_rate": 195,
  "labor_matrix": { "A": 1.0, "B": 1.1, "C": 1.25 },
  "bays": 6,
  "hours": { "open": "07:00", "close": "18:00", "days": "Mon-Fri" },
  "personas_enabled": ["advisor", "tech", "owner", "customer"],
  "integrations": {
    "sms": "twilio",
    "parts_vendors": ["worldpac", "oreilly", "partstech"],
    "accounting": "quickbooks",
    "payments": ["stripe", "dignifi", "sunbit"],
    "scheduling": "google_calendar"
  },
  "features": {
    "dvi_video": true,
    "social_inbox": true,
    "multi_location": false,
    "ai_copilot": true,
    "trust_engine": true,
    "parts_intelligence": true
  },
  "ai": {
    "model": "claude-sonnet-4-6",
    "context_aware": true,
    "proactive_alerts": true
  }
}`,
  repair_order: `{
  "ro_id": "RO-2024-1187",
  "edition": "AM",
  "shop_id": "shop-001",
  "customer_id": "cust-003",
  "vehicle_id": "veh-001",
  "advisor_id": "adv-001",
  "tech_id": "tech-001",
  "status": "awaiting_approval",
  "priority": "normal",
  "created_at": "2024-03-21T09:15:00Z",
  "complaint": "Check engine light, rough idle at startup",
  "diagnosis": "P0420 — Catalyst system efficiency below threshold (Bank 1)",
  "tsb_refs": ["TSB-2021-0144"],
  "line_items": [
    {
      "id": "li-001",
      "type": "labor",
      "description": "Diagnostic Fee",
      "labor_code": "D001",
      "hours": 0.5,
      "rate": 195,
      "total": 97.50,
      "margin_pct": 100
    },
    {
      "id": "li-002",
      "type": "part",
      "description": "Catalytic Converter (OEM-equiv)",
      "part_number": "WP-16468",
      "vendor": "worldpac",
      "cost": 218,
      "price": 420,
      "margin_pct": 48.1,
      "quantity": 1,
      "ai_selected": true
    },
    {
      "id": "li-003",
      "type": "labor",
      "description": "Labor — Installation 1.5 hrs",
      "labor_code": "E002",
      "hours": 1.5,
      "rate": 195,
      "total": 292.50,
      "margin_pct": 100
    }
  ],
  "subtotal": 810.00,
  "tax": 53.44,
  "total": 863.44,
  "customer_approved": null,
  "approval_sent_at": null,
  "approval_channel": "sms",
  "dvi_id": "dvi-001",
  "health_report_sent": false
}`,
  customer: `{
  "customer_id": "cust-003",
  "first_name": "Monica",
  "last_name": "Rodriguez",
  "phone": "(650) 555-0142",
  "email": "monica@venturebloom.io",
  "address": "3201 Alma St, Palo Alto, CA 94306",
  "communication_pref": "sms",
  "vehicle_ids": ["veh-001"],
  "visit_count": 7,
  "lifetime_value": 3890,
  "trust_score": 94,
  "approval_rate": 1.0,
  "avg_approval_time_min": 8,
  "tags": ["drop-off-only", "fast-approver", "text-preferred"],
  "loyalty_tier": "Gold",
  "portal_magic_links": ["tok_abc123"],
  "preferred_tech": "tech-001",
  "notes": "Busy schedule — values speed. Drop-off only.",
  "created_at": "2021-01-10T00:00:00Z",
  "last_visit": "2024-08-15T00:00:00Z"
}`,
  dvi_template: `{
  "template_id": "dvi-std-8pt",
  "edition": "AM",
  "version": "2.1",
  "ai_suggestions_enabled": true,
  "video_walkaround": true,
  "photo_per_item": true,
  "sections": [
    { "id": "tires", "label": "Tires & Wheels",
      "items": [
        { "id": "tread_depth", "label": "Tire Tread Depth",
          "type": "measurement", "unit": "32nds",
          "thresholds": { "ok": 6, "watch": 4, "fail": 3 } },
        { "id": "tire_pressure", "label": "Tire Pressure",
          "type": "measurement", "unit": "PSI" },
        { "id": "wheel_condition", "label": "Wheel Condition",
          "type": "pass_fail_watch" }
      ]
    },
    { "id": "brakes", "label": "Brakes",
      "items": [
        { "id": "front_pads", "label": "Front Brake Pads",
          "type": "measurement", "unit": "mm",
          "thresholds": { "ok": 7, "watch": 4, "fail": 3 } },
        { "id": "rear_pads", "label": "Rear Brake Pads",
          "type": "measurement", "unit": "mm" },
        { "id": "rotors", "label": "Rotor Condition",
          "type": "pass_fail_watch" },
        { "id": "brake_fluid", "label": "Brake Fluid",
          "type": "pass_fail_watch" }
      ]
    },
    { "id": "suspension", "label": "Suspension & Steering",
      "items": [
        { "id": "ball_joints", "label": "Ball Joints", "type": "pass_fail_watch" },
        { "id": "tie_rods", "label": "Tie Rods", "type": "pass_fail_watch" },
        { "id": "shocks", "label": "Shocks / Struts", "type": "pass_fail_watch" }
      ]
    },
    { "id": "fluids", "label": "Fluids & Filters",
      "items": [
        { "id": "engine_oil", "label": "Engine Oil Level/Condition", "type": "pass_fail_watch" },
        { "id": "coolant", "label": "Coolant Level/Condition", "type": "pass_fail_watch" },
        { "id": "transmission_fluid", "label": "Transmission Fluid", "type": "pass_fail_watch" },
        { "id": "air_filter", "label": "Engine Air Filter", "type": "pass_fail_watch" }
      ]
    }
  ]
}`,
  labor_matrix: `{
  "shop_id": "shop-001",
  "edition": "AM",
  "base_rate": 195,
  "version": "2024-Q1",
  "jobs": [
    { "code": "B001", "desc": "Brake Pad Replacement (axle)",   "hrs": 1.2, "cat": "Brakes" },
    { "code": "B002", "desc": "Brake Rotor Replacement (axle)", "hrs": 1.8, "cat": "Brakes" },
    { "code": "B003", "desc": "Brake Fluid Flush",              "hrs": 0.5, "cat": "Brakes" },
    { "code": "M001", "desc": "Oil Change + Filter",            "hrs": 0.5, "cat": "Maintenance" },
    { "code": "M002", "desc": "Tire Rotation + Balance",        "hrs": 0.5, "cat": "Maintenance" },
    { "code": "M003", "desc": "90K Major Service",              "hrs": 3.5, "cat": "Maintenance" },
    { "code": "D001", "desc": "Diagnostic Scan",                "hrs": 0.5, "cat": "Diagnostic" },
    { "code": "E001", "desc": "Serpentine Belt Replacement",    "hrs": 0.7, "cat": "Engine" },
    { "code": "E002", "desc": "Catalytic Converter R&R",        "hrs": 1.5, "cat": "Exhaust" },
    { "code": "A001", "desc": "A/C Recharge + Leak Check",      "hrs": 1.0, "cat": "HVAC" }
  ]
}`,
  dealer_config: `{
  "dealer_id": "dlr-00142",
  "edition": "OEM",
  "oem_brand": "Honda",
  "franchise_code": "HDA-94306",
  "dealer_name": "Peninsula Honda",
  "dms": {
    "provider": "cdk",
    "endpoint": "https://api.cdk.com/fortellis/v2",
    "dealer_code": "94306-H",
    "auth_type": "oauth2",
    "sync_interval_min": 5
  },
  "personas_enabled": [
    "advisor", "master_tech", "service_manager",
    "customer", "parts_manager", "warranty_admin"
  ],
  "warranty": {
    "oem_portal": "https://warranty.honda.com/api/v2",
    "auth": "certificate",
    "auto_submit": true,
    "claim_readiness_threshold": 85
  },
  "oem_parts": {
    "catalog_api": "https://parts.honda.com/api/v1",
    "prefer_genuine": true,
    "allow_aftermarket": false
  },
  "compliance": {
    "csi_target": 92,
    "mpi_required": true,
    "tech_cert_required": true,
    "story_writer_enabled": true
  }
}`,
  warranty_claim: `{
  "claim_id": "WC-2024-00891",
  "edition": "OEM",
  "dealer_id": "dlr-00142",
  "ro_id": "RO-DLR-5541",
  "oem_brand": "Honda",
  "claim_type": "powertrain_warranty",
  "vin": "1HGCV1F30MA012345",
  "mileage_at_repair": 28450,
  "in_warranty": true,
  "complaint": "Transmission rough shifting between 2nd and 3rd gear",
  "cause": "Transmission control module software version 1.2.4 — calibration defect",
  "correction": "Reflashed TCM to version 1.4.1 per HDA TSB #23-041",
  "tsb_number": "HDA-2023-041",
  "labor_ops": [
    { "op_code": "28111600AA", "desc": "TCM Reprogram", "hrs": 0.4 }
  ],
  "parts_claimed": [],
  "claim_amount": 78.00,
  "readiness_score": 96,
  "submitted_at": null,
  "dms_ro_number": "DLR-5541",
  "tech_cert": "Honda Master Tech — Level 3"
}`,
  oem_mpi_template: `{
  "template_id": "oem-honda-mpi-v3",
  "edition": "OEM",
  "oem_brand": "Honda",
  "version": "3.0",
  "required_by_oem": true,
  "csi_impact": true,
  "sections": [
    { "id": "underhood", "label": "Underhood",
      "oem_required": true,
      "items": [
        { "id": "engine_air_filter", "label": "Engine Air Filter",
          "oem_code": "HDA-F01", "type": "pass_fail_watch" },
        { "id": "battery", "label": "Battery Load Test",
          "oem_code": "HDA-B01", "type": "measurement", "unit": "CCA" },
        { "id": "coolant", "label": "Coolant Condition",
          "oem_code": "HDA-C01", "type": "pass_fail_watch" }
      ]
    },
    { "id": "brakes_oem", "label": "Brake System",
      "oem_required": true,
      "items": [
        { "id": "front_pads_oem", "label": "Front Brake Pads",
          "oem_code": "HDA-BR01", "type": "measurement",
          "unit": "mm", "thresholds": { "ok": 8, "watch": 5, "fail": 3 } }
      ]
    }
  ],
  "story_writer": {
    "enabled": true,
    "output_types": ["warranty_narrative", "customer_report", "tech_notes"]
  }
}`,
  dms_mapping: `{
  "mapping_id": "cdk-wrenchiq-v2",
  "edition": "OEM",
  "dms_provider": "CDK Global",
  "version": "2.0",
  "sync_direction": "bidirectional",
  "field_mappings": {
    "customer": {
      "cdk_field": "CUSTOMER_NO",
      "wrenchiq_field": "customer_id"
    },
    "ro_number": {
      "cdk_field": "RO_NO",
      "wrenchiq_field": "ro_id"
    },
    "labor_op": {
      "cdk_field": "OP_CODE",
      "wrenchiq_field": "line_items[].labor_code"
    },
    "tech_id": {
      "cdk_field": "TECHNICIAN_NO",
      "wrenchiq_field": "tech_id"
    }
  },
  "webhooks": {
    "ro_opened": "POST /api/v1/dms/ro/opened",
    "ro_closed": "POST /api/v1/dms/ro/closed",
    "parts_ordered": "POST /api/v1/dms/parts/ordered"
  }
}`
};

const AM_FILES = [
  { id: "shop_config",  label: "shop_config.json" },
  { id: "repair_order", label: "repair_order.json" },
  { id: "customer",     label: "customer.json" },
  { id: "dvi_template", label: "dvi_template.json" },
  { id: "labor_matrix", label: "labor_matrix.json" },
];

const OEM_FILES = [
  { id: "dealer_config",    label: "dealer_config.json" },
  { id: "warranty_claim",   label: "warranty_claim.json" },
  { id: "oem_mpi_template", label: "oem_mpi_template.json" },
  { id: "dms_mapping",      label: "dms_mapping.json" },
];

// ── Nav sections ──────────────────────────────────────────────
const SECTIONS = [
  { id: "overview",    label: "Overview",           icon: BookOpen },
  { id: "valueprop",   label: "Value Proposition",  icon: Zap },
  { id: "personas",    label: "Personas & UX",      icon: Users },
  { id: "flows",       label: "User Flows",         icon: GitBranch },
  { id: "competitive", label: "Competitive",        icon: Target },
  { id: "templates",   label: "Resource Templates", icon: FileCode },
  { id: "apis",        label: "External APIs",      icon: Globe },
  { id: "arch",        label: "Architecture",       icon: Layers },
];

// ── Section content ───────────────────────────────────────────

function SectionOverview({ edition }) {
  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #0D3B45, #0D2A40)", borderRadius: 12, padding: "20px 24px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Product Vision</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", lineHeight: 1.5, marginBottom: 8 }}>
          "WrenchIQ is the first shop management platform built backwards from the customer's phone screen — not the service advisor's desk."
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Every repair builds trust. Every trust builds loyalty.</div>
      </div>

      <SectionTitle>Two Editions</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {[
          { name: "WrenchIQ-AM", sub: "Aftermarket", target: "Independent & multi-location shops", focus: "Full SMS platform, social-to-RO, trust engine", color: COLORS.accent },
          { name: "WrenchIQ-OEM", sub: "Dealership", target: "16,000+ franchised dealers", focus: "RO Story Writer, warranty claim automation, DMS sync", color: "#2563EB" },
        ].map(e => (
          <div key={e.name} style={{ border: `1.5px solid ${edition === (e.name.includes("AM") ? "AM" : "OEM") ? e.color : "#E5E7EB"}`, borderRadius: 10, padding: "14px 16px", background: edition === (e.name.includes("AM") ? "AM" : "OEM") ? `${e.color}06` : "#FAFAFA" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: e.color, marginBottom: 2 }}>{e.name}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>{e.sub}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}><strong>Target:</strong> {e.target}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}><strong>Focus:</strong> {e.focus}</div>
          </div>
        ))}
      </div>

      <SectionTitle>Market</SectionTitle>
      <Table
        headers={["Segment", "Size", "Pain Point"]}
        rows={[
          ["OEM Franchised Dealers", "16,000+ dealers", "Warranty claim rejections, advisor write-up inconsistency"],
          ["AM Corporate Groups", "12,000+ multi-location", "Fragmented systems, no AI across locations"],
          ["AM Independent Shops", "168,000 shops", "$1M–$5M/yr, on Mitchell1/paper/Tekmetric"],
        ]}
      />

      <SectionTitle>Pricing</SectionTitle>
      <Table
        headers={["Tier", "Price", "Target"]}
        rows={[
          ["Starter",        "$199/mo",           "1–2 bay, basic RO + DVI"],
          ["Pro",            "$399/mo",           "3–8 bays, full AI features"],
          ["Enterprise",     "Custom",            "10+ locations, API access, SLA"],
          ["3C Writer Add-on","$99/mo/location",  "OEM story writer add-on"],
        ]}
      />

      <SectionTitle>Success Metrics</SectionTitle>
      <Table
        headers={["Metric", "Target"]}
        rows={[
          ["Time to open new RO",       "< 3 minutes"],
          ["DVI completion rate",       "90%"],
          ["Customer digital approval", "85% same-day"],
          ["ARO improvement",           "+20% vs. baseline"],
          ["Tech time-on-wrenches",     "+15%"],
          ["Parts margin capture",      "+3–5%"],
          ["Rebate capture rate",       "80% of eligible"],
          ["Customer trust score avg",  "75/100"],
          ["Net Revenue Retention",     "110%"],
        ]}
      />

      <SectionTitle>Roadmap</SectionTitle>
      <Table
        headers={["Milestone", "Date", "Deliverables"]}
        rows={[
          ["M0 Demo",     "Mar 2026",  "14-screen interactive demo, persona gateway"],
          ["M1 Alpha",    "Apr 2026",  "Backend API v1, real data persistence"],
          ["M2 Beta",     "Jun 2026",  "3 pilot shops, payments live, Twilio live"],
          ["M3 GA v1.0",  "Aug 2026",  "Full launch: RO, DVI, Scheduling, Portal"],
          ["M4 3C",       "Sep 2026",  "3C Story Writer embedded in RO workflow"],
          ["M5 Mobile",   "Nov 2026",  "iOS + Android native technician app"],
          ["M6 Enterprise","Q1 2027",  "Multi-location, fleet accounts, OEM GA"],
        ]}
      />
    </div>
  );
}

function SectionPersonas() {
  const PERSONAS = [
    {
      id: "advisor", label: "Service Advisor", color: "#2563EB",
      philosophy: "One screen. One flow. The rest is automatic.",
      landing: "Queue + active RO board (In Queue / Diagnosing / Approval / Ready Pickup) + Next Up card",
      workflow: "5-step guided RO: Customer Lookup → Vehicle Confirm → Complaint Entry → Intelligent Estimate → Approval & RO Open",
      nav: ["RO Queue & Board", "Parts Intelligence", "Scheduling", "Trust Engine"],
      hidden: ["Analytics", "Multi-location", "Supplier rebates", "Bay config", "Raw parts catalog", "Margin settings"],
      ai: "Complaint → diagnosis translation, vendor auto-pricing, approval nudge, TSB flagging",
    },
    {
      id: "tech", label: "Technician", color: "#16A34A",
      philosophy: "Large touch targets. Voice-first. Zero navigation. Work comes to them.",
      landing: "iPad-optimized job list — Active + Up Next cards with RO number, vehicle, job description",
      workflow: "8-point DVI: full-screen category by category, YES/WATCH/NO, camera + voice per item, 60s video walkaround",
      nav: ["My Jobs", "Reports"],
      hidden: ["Pricing", "Margins", "Customer financials", "Multi-location", "Customer contact details"],
      ai: "Auto-suggest labor code + parts + time after marking Needs Service. TSB viewer pre-loaded per RO.",
    },
    {
      id: "owner", label: "Shop Owner", color: COLORS.accent,
      philosophy: "An intelligent agent that manages the shop for you. You ask questions. It answers.",
      landing: "Revenue vs target, bay utilization, approval rate, CSI; WrenchIQ Agent proactive alerts; Live 6-bay grid",
      workflow: "Natural language commands: 'What's my best tech?' / 'Move Volvo to Bay 2' / 'Worldpac spend vs last month?'",
      nav: ["Today", "Bays", "Suppliers", "Team", "Reports"],
      hidden: ["Nothing — full visibility"],
      ai: "Revenue forecasting, margin leak detection, rebate optimization, approval nudges, tech performance benchmarks",
    },
    {
      id: "customer", label: "Car Owner", color: "#7C3AED",
      philosophy: "DoorDash for your car. Real-time, visual, mobile-first. No login friction.",
      landing: "Magic link via SMS → vehicle card, live progress bar (4 steps), What We Found, digital approval",
      workflow: "Approve All / Approve Selected / Decline / Call Shop → digital signature → live RO status → pay via Apple Pay / Stripe",
      nav: ["None — single-page progressive disclosure"],
      hidden: ["Shop costs", "Margins", "Other customers", "Tech last names", "Parts vendors"],
      ai: "Plain-English repair explanations, wait time estimates, price vs dealer comparison",
    },
  ];

  return (
    <div>
      <SectionTitle>AI Integration by Persona</SectionTitle>
      <Table
        headers={["Feature", "Advisor", "Tech", "Owner", "Customer"]}
        rows={[
          ["Parts auto-pricing",        "Primary", "—",       "Visibility", "—"],
          ["Complaint → diagnosis",     "Primary", "Reference","—",         "—"],
          ["Inspection AI suggestions", "—",       "Primary", "—",          "—"],
          ["Revenue forecasting",       "—",       "—",       "Primary",    "—"],
          ["Margin leak detection",     "—",       "—",       "Primary",    "—"],
          ["Rebate optimization",       "—",       "—",       "Primary",    "—"],
          ["Approval nudges",           "Notified","—",       "Controls",   "—"],
          ["Plain-English report",      "—",       "—",       "—",          "Primary"],
          ["Wait time estimates",       "Secondary","—",      "—",          "Primary"],
          ["TSB / recall lookup",       "Primary", "Reference","—",         "—"],
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
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8, paddingLeft: 0 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Hidden:</span>
            {p.hidden.map(h => <Badge key={h} label={h} color="#6B7280" bg="#F3F4F6" />)}
          </div>
        </div>
      ))}

      <SectionTitle>DVI Inspection — 8 Standard Sections</SectionTitle>
      <Table
        headers={["#", "Section", "Key Items"]}
        rows={[
          ["1", "Tires & Wheels",       "Tread depth (32nds), tire pressure (PSI), wheel condition"],
          ["2", "Brakes",               "Front/rear pad thickness (mm), rotor condition, brake fluid"],
          ["3", "Suspension & Steering","Ball joints, tie rods, shocks/struts"],
          ["4", "Fluids & Filters",     "Engine oil, coolant, transmission fluid, air filter"],
          ["5", "Belts & Hoses",        "Serpentine belt, coolant hoses, power steering hose"],
          ["6", "Battery & Electrical", "CCA load test, terminals, alternator output"],
          ["7", "Lights & Wipers",      "All exterior lights, wiper blade condition"],
          ["8", "Engine & Exhaust",     "Leaks, exhaust condition, catalytic converter"],
        ]}
      />
    </div>
  );
}

function SectionFlows() {
  const FLOWS = [
    {
      title: "Flow 1: Social Lead → First Visit",
      time: "8–12 min total",
      steps: [
        "Instagram/TikTok DM received → intent detected (Hot: brake service)",
        "AI classifies intent + drafts reply → advisor sends in < 30 sec",
        "Customer replies with vehicle info → auto-creates profile",
        "Advisor books appointment → SMS confirmation sent",
        "System notifies tech + pre-loads TSBs for vehicle",
        "Appointment → RO → DVI → Health Report → Approval",
      ],
    },
    {
      title: "Flow 2: Check-In → Estimate Approval (Zero Paper)",
      time: "< 3 min RO open",
      steps: [
        "License plate scan → customer profile + TSBs + comm preference loads instantly",
        "5-step RO Wizard → RO assigned to tech",
        "Tech completes DVI with photo/video/voice",
        "AI generates health report in < 15 sec",
        "Customer receives SMS link → opens on phone",
        "Customer approves digitally → parts ordered → invoice → Apple Pay",
        "2hr post-pickup: review request auto-sent via Twilio",
      ],
    },
    {
      title: "Flow 3: Competing Against OEM Dealer",
      time: "Trust-building sequence",
      steps: [
        "VIN entered → service history + active recalls + TSBs pulled",
        "Advisor mentions TSB customer didn't know about (loyalty signal)",
        "Full video DVI inspection recorded and narrated",
        "Health report shows $487 WrenchIQ vs $820 dealership price",
        "Higher approval rate due to trust + transparency + price",
        "Personalized care reminder scheduled 3 months out",
        "Pre-visit text → customer books without hesitation",
      ],
    },
    {
      title: "Flow 4: Corporate Group Morning Review",
      time: "10 min / day",
      steps: [
        "Owner opens iPhone 6 AM → 94 green / 4 yellow / 2 red location map",
        "AI morning brief: best location Houston 3 ($67K, 4.9★)",
        "Concern: Phoenix 7 comeback rate +12% → owner taps location",
        "AI identifies transmission flush pattern = Houston 2 from 2024",
        "Owner taps 'Deploy Training' → techs notified instantly",
        "Approves parts transfer across 23 locations",
        "Reviews before 7 AM team call — fully prepared",
      ],
    },
    {
      title: "Flow 5: Upset Customer Recovery",
      time: "20 min resolution",
      steps: [
        "Facebook negative comment → Social Inbox URGENT flag (sentiment: negative)",
        "AI drafts empathetic response → advisor personalizes + sends < 5 min",
        "Manager pulls RO → identifies root cause",
        "Customer called directly → same-day comeback booked",
        "Trust score drops 62 → 45 → comeback fixed → score recovers to 58",
        "AI queues 30-day free tire check offer",
        "No negative review posted — relationship saved",
      ],
    },
  ];

  return (
    <div>
      <SectionTitle>Speed Standards</SectionTitle>
      <Table
        headers={["Action", "Target Time"]}
        rows={[
          ["Check-in to RO open",             "< 60 seconds"],
          ["New RO via 5-step wizard",         "< 3 minutes"],
          ["DVI health report generation",     "< 15 seconds"],
          ["Customer digital approval",        "< 3 minutes"],
          ["Social DM response with AI draft", "< 30 seconds"],
          ["Parts pricing (3 vendors)",        "< 2 seconds"],
          ["VIN → TSB + recall check",         "< 1 second"],
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

function SectionCompetitive() {
  return (
    <div>
      <SectionTitle>Feature Comparison Matrix</SectionTitle>
      <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1fr", background: COLORS.primary, padding: "8px 14px" }}>
          {["Feature", "Mitchell1", "Tekmetric", "Shop-Ware", "Shopmonkey", "WrenchIQ"].map(h => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: h === "WrenchIQ" ? COLORS.accent : "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
          ))}
        </div>
        {[
          ["Cloud-native",                  "No",  "Yes", "Yes", "Yes", "Yes"],
          ["Mobile tech app",               "Ltd", "Yes", "Yes", "Yes", "Yes — full bay"],
          ["DVI",                           "Basic","Str","Str","Basic","AI-assisted"],
          ["Digital customer approval",     "Yes", "Yes", "Yes", "Yes", "Yes + financing"],
          ["Online scheduling",             "Basic","Yes","Yes","Yes", "AI demand forecast"],
          ["Multi-vendor parts pricing",    "No",  "No",  "No",  "No",  "6 vendors, AI-ranked"],
          ["AI Copilot embedded",           "No",  "No",  "No",  "No",  "Every screen"],
          ["Social DM → RO pipeline",       "No",  "No",  "No",  "No",  "TikTok/IG/Google"],
          ["3C Story Writer (AI docs)",     "No",  "No",  "No",  "No",  "4 specialty outputs"],
          ["Warranty claim automation",     "No",  "No",  "No",  "No",  "OEM rules engine"],
          ["Recall auto-detection per VIN", "No",  "No",  "No",  "No",  "NHTSA live check"],
          ["Customer trust scoring",        "No",  "No",  "No",  "No",  "Trust Engine 0–100"],
          ["Multi-location command center", "Basic","Ltd","No","No",    "100+ locations"],
          ["Pro tier pricing",              "$350","$299","$349","$199", "$399/mo"],
        ].map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1fr", padding: "8px 14px", borderBottom: i < 13 ? "1px solid #F3F4F6" : "none", background: i % 2 === 0 ? "#fff" : "#FAFAFA", alignItems: "center" }}>
            {row.map((cell, j) => (
              <div key={j} style={{ fontSize: j === 5 && cell !== "No" && cell !== "$399/mo" ? 11 : 11, fontWeight: j === 0 ? 600 : j === 5 ? 700 : 400, color: j === 5 ? (cell === "No" || cell === "$399/mo" ? COLORS.textSecondary : COLORS.accent) : j === 0 ? COLORS.textPrimary : COLORS.textMuted }}>{cell}</div>
            ))}
          </div>
        ))}
      </div>

      <SectionTitle>WrenchIQ's 7 Competitive Advantages</SectionTitle>
      {[
        { n: 1, title: "AI Copilot in Every Screen", detail: "Contextually aware across all 14 screens — not an isolated feature bolt-on. Each screen has tailored AI suggestions, not generic chat." },
        { n: 2, title: "Social-to-RO Conversion", detail: "Zero competitors capture TikTok/Instagram/Google Business DMs and convert them to appointments and ROs. Entirely new acquisition channel." },
        { n: 3, title: "3C Story Writer — 4 Specialty Outputs", detail: "AI generates structured Complaint-Cause-Correction narratives from one repair event: warranty docs, customer report, fleet schema, recall compliance." },
        { n: 4, title: "Warranty Documentation Automation", detail: "Claim Readiness Score + OEM rules engine. Recovers $3,000+/mo per dealership in previously rejected warranty claims." },
        { n: 5, title: "Trust Engine (Proactive)", detail: "Proactive at-risk scoring vs. competitors' reactive reviews. Flags customers before they churn, not after they post a 1-star." },
        { n: 6, title: "Multi-Vendor AI Parts Ranking", detail: "6 vendors, real-time pricing, AI-ranked by price + availability + margin + delivery. No competitor does more than 1 vendor lookup." },
        { n: 7, title: "Recall Capture Revenue Workflow", detail: "Auto-detect open recalls at check-in, structured revenue workflow, compliance documentation. Turns safety recall into revenue + trust moment." },
      ].map(a => (
        <div key={a.n} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "10px 14px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{a.n}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>{a.title}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{a.detail}</div>
          </div>
        </div>
      ))}

      <SectionTitle>White Space — Features No Competitor Has</SectionTitle>
      <Table
        headers={["Priority", "Feature"]}
        rows={[
          ["P0", "AI-generated 3C documentation (Complaint · Cause · Correction)"],
          ["P0", "Social media DM → RO conversion pipeline"],
          ["P0", "Warranty Claim Readiness Score + OEM rules engine"],
          ["P0", "Proactive Trust Engine with at-risk customer scoring"],
          ["P0", "Multi-vendor AI parts ranking (6 vendors, real-time)"],
          ["P1", "Recall auto-detection + structured revenue capture workflow"],
          ["P1", "Fleet 3C documentation with schema-per-account"],
          ["P1", "AI demand forecasting for bay scheduling"],
          ["P1", "Technician voice capture → structured RO notes"],
          ["P1", "Rejection recovery AI — revise and resubmit warranty claims"],
          ["P1", "Financing at point of digital approval (DigniFi/Sunbit native)"],
          ["P2", "Customer reading level adaptation for health reports"],
          ["P2", "Predictive parts stocking from historical RO data"],
          ["P2", "Cross-location knowledge sharing (AI pattern recognition)"],
        ]}
      />
    </div>
  );
}

function SectionTemplates({ edition }) {
  const files = edition === "AM" ? AM_FILES : OEM_FILES;
  const [activeFile, setActiveFile] = useState(files[0].id);

  return (
    <div>
      <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 0, marginBottom: 16, lineHeight: 1.6 }}>
        {edition === "AM"
          ? "Core JSON schemas for WrenchIQ-AM aftermarket shops. These define the data contracts between the frontend, backend API, and integration partners."
          : "OEM-specific schemas for dealership DMS sync, warranty claim submission, and OEM-mandated MPI templates. Compliant with CDK Fortellis, Reynolds & Reynolds, and Dealertrack connectors."}
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {files.map(f => (
          <button key={f.id} onClick={() => setActiveFile(f.id)} style={{ padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${activeFile === f.id ? COLORS.accent : COLORS.border}`, background: activeFile === f.id ? `${COLORS.accent}10` : "#F9FAFB", color: activeFile === f.id ? COLORS.accent : COLORS.textSecondary, fontSize: 12, fontWeight: activeFile === f.id ? 700 : 500, cursor: "pointer" }}>
            {f.label}
          </button>
        ))}
      </div>
      <CodeBlock code={FILE_CONTENTS[activeFile] || "// No template found"} />
    </div>
  );
}

function SectionAPIs({ edition }) {
  const AM_APIS = [
    {
      group: "Communication & Messaging",
      color: "#2563EB",
      apis: [
        { name: "Twilio", use: "SMS approval links, status updates, review requests", endpoint: "api.twilio.com/2010-04-01", status: "DEMO" },
        { name: "Podium", use: "Review management, customer messaging hub", endpoint: "api.podium.com/v2", status: "MOCK" },
        { name: "Google Business Messages", use: "Google DM → appointment → RO conversion", endpoint: "businessmessages.googleapis.com/v1", status: "DEMO" },
        { name: "Birdeye", use: "Multi-platform review aggregation, response automation", endpoint: "api.birdeye.com/resources/v1", status: "MOCK" },
      ],
    },
    {
      group: "Social Media",
      color: "#7C3AED",
      apis: [
        { name: "Meta Graph API", use: "Facebook/Instagram DM monitoring + intent detection", endpoint: "graph.facebook.com/v18.0", status: "DEMO" },
        { name: "TikTok Business API", use: "TikTok DM + comment monitoring, social-to-RO", endpoint: "business-api.tiktok.com/open_api/v1.3", status: "DEMO" },
      ],
    },
    {
      group: "Payments & Financing",
      color: "#16A34A",
      apis: [
        { name: "Stripe", use: "Invoice payment, Apple Pay, deposit collection", endpoint: "api.stripe.com/v1", status: "MOCK" },
        { name: "DigniFi", use: "Point-of-approval financing for repairs $500–$5,000", endpoint: "api.dignifi.com/v2", status: "MOCK" },
        { name: "Sunbit", use: "Buy-now-pay-later at digital approval screen", endpoint: "api.sunbit.com/v1", status: "MOCK" },
      ],
    },
    {
      group: "Accounting",
      color: "#D97706",
      apis: [
        { name: "QuickBooks", use: "Invoice sync, expense categorization, P&L", endpoint: "quickbooks.api.intuit.com/v3", status: "MOCK" },
        { name: "Xero", use: "Alternative accounting sync for multi-location", endpoint: "api.xero.com/api.xro/2.0", status: "MOCK" },
        { name: "Gusto", use: "Payroll sync — tech hours from RO clock-in/out", endpoint: "api.gusto.com/v1", status: "MOCK" },
      ],
    },
    {
      group: "Parts Vendors",
      color: "#0891B2",
      apis: [
        { name: "Worldpac", use: "Real-time parts pricing + availability + ETA", endpoint: "api.worldpac.com/v2/pricing", status: "DEMO" },
        { name: "O'Reilly Auto Parts", use: "Parts pricing + same-day availability check", endpoint: "api.oreillyauto.com/v1", status: "DEMO" },
        { name: "PartsTech", use: "Parts aggregator — 30+ suppliers in one call", endpoint: "api.partstech.com/v2", status: "MOCK" },
      ],
    },
    {
      group: "Vehicle Data",
      color: "#DC2626",
      apis: [
        { name: "NHTSA", use: "Recall lookup per VIN, safety campaign detection", endpoint: "api.nhtsa.gov/recalls/recallsByVehicle", status: "DEMO" },
        { name: "ALLDATA", use: "Labor times, TSBs, wiring diagrams, OEM specs", endpoint: "alldata.com/api/v1", status: "DEMO" },
      ],
    },
    {
      group: "Mobility & Loaner",
      color: "#475569",
      apis: [
        { name: "Lyft Business", use: "Ride request from customer portal when vehicle dropped off", endpoint: "api.lyft.com/v1", status: "MOCK" },
        { name: "Enterprise", use: "Loaner car reservation from tech board", endpoint: "api.enterprise.com/v1", status: "MOCK" },
      ],
    },
  ];

  const OEM_APIS = [
    {
      group: "DMS Connectors",
      color: "#2563EB",
      apis: [
        { name: "CDK Global (Fortellis)", use: "Full DMS bi-directional sync — ROs, customers, parts, labor", endpoint: "api.cdk.com/fortellis/v2", status: "MOCK" },
        { name: "Reynolds & Reynolds", use: "ERA-IGNITE DMS integration — RO push/pull", endpoint: "api.reyrey.com/v1", status: "MOCK" },
        { name: "Dealertrack", use: "F&I and service lane DMS sync", endpoint: "api.dealertrack.com/v1", status: "MOCK" },
      ],
    },
    {
      group: "OEM Warranty Portals",
      color: "#DC2626",
      apis: [
        { name: "Honda Warranty API", use: "Claim submission, status, rejection recovery", endpoint: "warranty.honda.com/api/v2", status: "MOCK" },
        { name: "Toyota TIS", use: "Tech info system — TSBs, warranty claims, ETM", endpoint: "techinfo.toyota.com/api/v1", status: "MOCK" },
        { name: "GM GlobalConnect", use: "Warranty claim submission + labor op validation", endpoint: "api.gmglobalconnect.com/v2", status: "MOCK" },
      ],
    },
  ];

  const apis = edition === "AM" ? AM_APIS : OEM_APIS;
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

      {apis.map(group => (
        <div key={group.group} style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: group.color, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: group.color }} />
            {group.group}
          </div>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, overflow: "hidden" }}>
            {group.apis.map((api, i) => (
              <div key={api.name} style={{ display: "grid", gridTemplateColumns: "130px 1fr 200px 56px", padding: "10px 14px", borderBottom: i < group.apis.length - 1 ? "1px solid #F3F4F6" : "none", background: "#fff", alignItems: "start", gap: 12 }}>
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

function SectionArch({ edition }) {
  return (
    <div>
      {edition === "AM" && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.8 }}>
              WrenchIQ-AM — System Architecture
            </div>
            <a
              href="/architecture-am.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 11, fontWeight: 600, color: COLORS.accent, textDecoration: "none", display: "flex", alignItems: "center", gap: 4, background: `${COLORS.accent}12`, border: `1px solid ${COLORS.accent}30`, borderRadius: 6, padding: "4px 10px" }}
            >
              ↗ Open full screen
            </a>
          </div>
          <div style={{ border: `1.5px solid ${COLORS.accent}30`, borderRadius: 12, overflow: "hidden", background: "#F0F4F5" }}>
            <iframe
              src="/architecture-am.html"
              title="WrenchIQ-AM Architecture Diagram"
              style={{ width: "100%", height: 520, border: "none", display: "block" }}
            />
          </div>
        </div>
      )}

      <SectionTitle>Tech Stack</SectionTitle>
      <Table
        headers={["Layer", "Technology"]}
        rows={[
          ["Frontend",    "React 18 + Vite, Lucide React icons, Recharts"],
          ["State",       "React useState / Context — no Redux"],
          ["Styling",     "Inline styles, COLORS theme (src/theme/colors.js)"],
          ["AI / LLM",    "Claude claude-sonnet-4-6 (claude-sonnet-4-6) via Anthropic API"],
          ["Vector DB",   "Pinecone — semantic TSB/recall/history search"],
          ["Backend",     "Node.js on AWS ECS/Fargate"],
          ["Database",    "PostgreSQL (RDS) + Redis (ElastiCache) + S3"],
          ["SMS",         "Twilio — approval links, status updates"],
          ["Payments",    "Square (Web SDK · Terminal API · Reader SDK) + DigniFi + Sunbit"],
          ["Accounting",  "Xero (GL sync · invoice lifecycle · credit notes) + QuickBooks"],
          ["Build",       "Vite → dist/ — base path /wrenchiq-ai"],
          ["Security",    "SOC 2 Type II · PCI-DSS (Square tokenizes) · CCPA"],
        ]}
      />

      <SectionTitle>Core Data Entities</SectionTitle>
      <Table
        headers={["Entity", "Key Fields"]}
        rows={[
          ["Shop",        "shop_id, edition, labor_rate, bays, integrations, features"],
          ["Customer",    "customer_id, trust_score, ltv, approval_rate, communication_pref"],
          ["Vehicle",     "vin, year/make/model, mileage, license_plate, service_history"],
          ["RepairOrder", "ro_id, status, complaint, diagnosis, line_items, total, dvi_id"],
          ["LineItem",    "type (labor/part), labor_code, vendor, cost, price, margin_pct"],
          ["DVI",         "template_id, sections[], findings, video_url, ai_suggestions"],
          ["Technician",  "tech_id, certifications, efficiency_score, active_ro"],
          ["Appointment", "slot, bay, vehicle, advisor, capacity_score, source"],
        ]}
      />

      <SectionTitle>WrenchIQ Agent — Screen Context Map</SectionTitle>
      <Table
        headers={["Screen", "Agent Behavior"]}
        rows={[
          ["Dashboard",          "Revenue opportunities, bottleneck alerts, daily priorities"],
          ["Social Inbox",       "Draft replies, appointment slot recommendations"],
          ["Scheduling",         "Demand forecast, optimal slot suggestions, tech availability"],
          ["DVI",                "Auto-suggest repairs from inspection findings, TSB lookup"],
          ["Health Report",      "Customer communication tone coaching, price framing"],
          ["Repair Orders",      "Next action prompts, ETA recalculation, upsell flags"],
          ["Parts Intelligence", "Vendor recommendation, margin optimization, ETA comparison"],
          ["Trust Engine",       "Customer recovery scripts, review request timing, VIP flags"],
          ["Analytics",          "Anomaly detection, benchmark comparisons, trend narration"],
          ["Multi-Location",     "Underperformer alerts, best-practice sharing, SOP gaps"],
          ["Owner — Today",      "Revenue gap analysis, bay utilization, approval nudges"],
          ["Advisor — RO",       "Complaint → diagnosis, vendor auto-pricing, TSB flagging"],
          ["Tech — DVI",         "Labor code suggestion, parts estimate, safety flag detection"],
          ["Customer Portal",    "Wait time estimate, plain-English explanations, follow-up"],
        ]}
      />

      <SectionTitle>{edition === "OEM" ? "OEM Architecture" : "AM Deployment Architecture"}</SectionTitle>
      <div style={{ background: "#0D1117", borderRadius: 10, padding: "16px 18px", fontFamily: "monospace", fontSize: 11, color: "#E2E8F0", lineHeight: 1.8 }}>
        {edition === "AM" ? `
  Customer Phone (PWA / Magic Link)
         │ HTTPS
  ┌──────▼──────────────────────────────┐
  │  React 18 + Vite (SPA)             │
  │  /wrenchiq-ai (base path)          │
  │  14 screens · 4 persona shells      │
  └──────┬──────────────────────────────┘
         │ REST / WebSocket
  ┌──────▼──────────────────────────────┐
  │  Node.js API (ECS Fargate)         │
  │  /api/v1 — RO, DVI, Customer,      │
  │           Parts, Schedule, AI       │
  └──┬────┬────┬────┬────────────────────┘
     │    │    │    │
  [RDS] [Redis] [S3] [Pinecone]
  Postgres Cache  Media  Vector

  External: Twilio · Meta · Worldpac
            O'Reilly · Stripe · NHTSA
            ALLDATA · QuickBooks · Gusto
` : `
  Dealership DMS (CDK / R&R / Dealertrack)
         │ Fortellis / OAuth2
  ┌──────▼──────────────────────────────┐
  │  WrenchIQ-OEM React Shell           │
  │  Personas: Advisor · Tech ·         │
  │            Warranty Admin · Owner   │
  └──────┬──────────────────────────────┘
         │ REST / Webhook
  ┌──────▼──────────────────────────────┐
  │  Node.js API + OEM Rules Engine    │
  │  Warranty Claim Readiness Score    │
  │  3C Story Writer (Claude API)       │
  └──┬────┬────┬────────────────────────┘
     │    │    │
  [RDS]  [S3]  [Claude claude-sonnet-4-6]
  Postgres  Docs   3C Narratives

  External: Honda/Toyota/GM Warranty APIs
            ALLDATA · CDK Fortellis
            Reynolds ERA-IGNITE
`}
      </div>
    </div>
  );
}

function SectionValueProp({ edition }) {
  const amHighlights = [
    { icon: "🔧", title: "Zero-Paper RO in 3 Minutes", detail: "License plate scan → customer profile → 5-step wizard → tech assigned. No clipboard, no paper." },
    { icon: "📲", title: "Social DM → Revenue", detail: "TikTok/Instagram/Google DM intent detection converts social followers into booked appointments and repair orders." },
    { icon: "🧠", title: "AI Copilot on Every Screen", detail: "Context-aware suggestions across all 14 screens — not a chat bolt-on. Parts pricing, diagnosis translation, approval nudges." },
    { icon: "🔍", title: "6-Vendor Parts AI Ranking", detail: "Real-time pricing from Worldpac, O'Reilly, PartsTech + 3 more. AI-ranked by margin, availability, and delivery ETA." },
    { icon: "🛡️", title: "Proactive Trust Engine", detail: "At-risk customer scoring before they churn. Flags unhappy customers at 72h, not after a 1-star review." },
    { icon: "📍", title: "100-Location Command Center", detail: "Single dashboard for corporate groups — revenue, tech performance, parts transfers, alerts, SOP deployment." },
  ];

  const oemHighlights = [
    { icon: "📝", title: "RO Story Writer (3C AI)", detail: "AI generates Complaint · Cause · Correction narratives from voice/DTC input. OEM-compliant in < 30 seconds." },
    { icon: "✅", title: "Claim Readiness Score", detail: "96-point real-time checklist before submission. Recovers $3,000–$6,000/mo per dealer in rejected warranty claims." },
    { icon: "🔗", title: "One-Click DMS Push", detail: "CDK Fortellis, Reynolds ERA-IGNITE, Dealertrack — direct push with field-mapped sync. No copy-paste." },
    { icon: "🏆", title: "Op Code Confidence Matching", detail: "AI matches repair to top-3 OEM labor operation codes with confidence %. Eliminates wrong-code rejections." },
    { icon: "📊", title: "Fixed Ops Director Dashboard", detail: "Per-advisor approval rates, rejection root cause analysis, dollars-at-risk, multi-dealer rollup — all in one view." },
    { icon: "🔧", title: "OEM-Branded Technician View", detail: "TSB auto-match by VIN + complaint, voice note → 3C narrative, warranty flag, op code confirm — iPad native." },
  ];

  const whyRows = [
    ["Built for AI-first — not AI-retrofitted", "Every screen, every workflow was designed around AI assistance from day one. Competitors bolt on chat windows."],
    ["Same API, two editions", "One schema with an `edition` field controls AM vs OEM behavior. No forked codebases, no duplicated infrastructure."],
    ["Trust as a product feature", "Trust Engine scores every customer relationship 0–100. No competitor treats customer retention as a first-class data model."],
    ["The customer's phone IS the platform", "Health report, approval, payment — the customer never needs an app or a login. SMS magic link, done."],
    ["Revenue recovery built in", "Warranty claim automation, rebate capture, recall revenue workflow — WrenchIQ finds money the shop is leaving on the table."],
    ["Predii's 10-year data advantage", "Pre-built on Predii's automotive AI/ML platform. OEM data, TSB/recall corpus, repair pattern models — not starting from scratch."],
  ];

  const competitiveMatrix = [
    { feature: "AI Copilot on every screen",      am: true,  oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Social DM → RO pipeline",         am: true,  oem: false, tek: false, sw: false, m1: false, cdk: false },
    { feature: "3C RO Story Writer (AI)",         am: false, oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Warranty Claim Readiness Score",  am: false, oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "DMS Push (CDK/R&R/Dealertrack)",  am: false, oem: true,  tek: false, sw: false, m1: false, cdk: "partial" },
    { feature: "6-vendor AI parts ranking",       am: true,  oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Proactive Trust Engine",          am: true,  oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Customer magic-link approval",    am: true,  oem: true,  tek: true,  sw: true,  m1: true,  cdk: false },
    { feature: "Multi-location (100+ sites)",     am: true,  oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Recall auto-detect + revenue WF", am: true,  oem: true,  tek: false, sw: false, m1: false, cdk: false },
    { feature: "Video DVI walkaround",            am: true,  oem: true,  tek: true,  sw: true,  m1: false, cdk: false },
    { feature: "Built-in financing (BNPL)",       am: true,  oem: false, tek: false, sw: false, m1: false, cdk: false },
  ];

  const Check2 = ({ val }) => {
    if (val === true)      return <span style={{ color: "#16A34A", fontWeight: 800, fontSize: 13 }}>✓</span>;
    if (val === "partial") return <span style={{ color: "#D97706", fontWeight: 700, fontSize: 11 }}>~</span>;
    return <span style={{ color: "#D1D5DB", fontSize: 11 }}>—</span>;
  };

  const highlightData = edition === "OEM" ? oemHighlights : amHighlights;
  const edColor = edition === "OEM" ? "#2563EB" : COLORS.accent;

  return (
    <div>
      {/* Hero statement */}
      <div style={{ background: "linear-gradient(135deg, #0D3B45, #1a2e44)", borderRadius: 14, padding: "22px 28px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Internal — For Sales, Product & Engineering</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.4, marginBottom: 6 }}>
          "The Dealership's Intelligence.<br />The Neighborhood's Trust."
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
          WrenchIQ is the first shop management platform where AI is native to every screen — not bolted on. Built for independent shops (AM) and franchise dealerships (OEM) on a single API, same intelligence layer.
        </div>
        <div style={{ position: "absolute", right: -20, top: -20, width: 120, height: 120, borderRadius: "50%", background: `${COLORS.accent}18` }} />
      </div>

      {/* Edition toggle bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["AM", "OEM"].map(e => (
          <div key={e} style={{
            flex: 1, padding: "10px 16px", borderRadius: 10,
            border: `2px solid ${(edition === "OEM" ? e === "OEM" : e === "AM") ? edColor : "#E5E7EB"}`,
            background: (edition === "OEM" ? e === "OEM" : e === "AM") ? `${edColor}08` : "#FAFAFA",
          }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: e === "AM" ? COLORS.accent : "#2563EB", marginBottom: 2 }}>WrenchIQ-{e}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted }}>{e === "AM" ? "Independent & multi-location aftermarket shops" : "Franchise dealerships — OEM warranty automation"}</div>
          </div>
        ))}
      </div>

      {/* Key Highlights grid */}
      <SectionTitle>Key Highlights — WrenchIQ-{edition}</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
        {highlightData.map((h, i) => (
          <div key={i} style={{ border: `1.5px solid ${edColor}22`, borderRadius: 10, padding: "14px 16px", background: `${edColor}04` }}>
            <div style={{ fontSize: 18, marginBottom: 8 }}>{h.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>{h.title}</div>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.5 }}>{h.detail}</div>
          </div>
        ))}
      </div>

      {/* Competitive checklist */}
      <SectionTitle>Competitive Feature Checklist</SectionTitle>
      <div style={{ border: "1px solid #E5E7EB", borderRadius: 10, overflow: "hidden", marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr", background: COLORS.primary, padding: "8px 14px" }}>
          {["Feature", "WrenchIQ-AM", "WrenchIQ-OEM", "Tekmetric", "Shop-Ware", "Mitchell1", "CDK/DMS"].map((h, i) => (
            <div key={h} style={{ fontSize: 9, fontWeight: 700, color: i <= 2 ? COLORS.accent : "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 0.3 }}>{h}</div>
          ))}
        </div>
        {competitiveMatrix.map((row, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1.8fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr", padding: "8px 14px", borderBottom: i < competitiveMatrix.length - 1 ? "1px solid #F3F4F6" : "none", background: i % 2 === 0 ? "#fff" : "#FAFAFA", alignItems: "center" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: COLORS.textPrimary }}>{row.feature}</div>
            <div style={{ textAlign: "center" }}><Check2 val={row.am} /></div>
            <div style={{ textAlign: "center" }}><Check2 val={row.oem} /></div>
            <div style={{ textAlign: "center" }}><Check2 val={row.tek} /></div>
            <div style={{ textAlign: "center" }}><Check2 val={row.sw} /></div>
            <div style={{ textAlign: "center" }}><Check2 val={row.m1} /></div>
            <div style={{ textAlign: "center" }}><Check2 val={row.cdk} /></div>
          </div>
        ))}
      </div>

      {/* Why WrenchIQ */}
      <SectionTitle>Why WrenchIQ — Internal Talking Points</SectionTitle>
      {whyRows.map(([title, detail], i) => (
        <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, padding: "12px 16px", borderRadius: 10, background: "#FFFBEB", border: "1px solid #FDE68A" }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: COLORS.accent, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>{title}</div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.5 }}>{detail}</div>
          </div>
        </div>
      ))}

      {/* Metrics summary */}
      <SectionTitle>Quantified Impact (Demo Targets)</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 8 }}>
        {[
          { val: "+20%", label: "ARO improvement",              sub: "via AI parts + approval nudges" },
          { val: "$3K+", label: "Warranty recovery / dealer",   sub: "claim readiness score — OEM" },
          { val: "85%",  label: "Same-day digital approvals",   sub: "magic link SMS flow — AM" },
          { val: "6",    label: "Parts vendors, 1 screen",      sub: "AI-ranked, real-time pricing" },
          { val: "< 3m", label: "New RO open time",             sub: "5-step wizard, license plate scan" },
          { val: "100+", label: "Locations, one dashboard",     sub: "Corporate group command center" },
        ].map((m, i) => (
          <div key={i} style={{ border: "1.5px solid #E5E7EB", borderRadius: 10, padding: "14px 16px", textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: edColor, letterSpacing: -1, marginBottom: 4 }}>{m.val}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{m.label}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{m.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export default function SpecificationsPanel({ onClose }) {
  const [section, setSection] = useState("overview");
  const [edition, setEdition] = useState("AM");

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
          {/* Edition toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.1)", borderRadius: 8, padding: 3, gap: 2 }}>
            {["AM", "OEM"].map(e => (
              <button key={e} onClick={() => setEdition(e)} style={{ padding: "4px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 700, background: edition === e ? COLORS.accent : "transparent", color: edition === e ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.15s" }}>
                WrenchIQ-{e}
              </button>
            ))}
          </div>
        </div>
        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "rgba(255,255,255,0.7)", fontSize: 12, display: "flex", alignItems: "center", gap: 5 }}>
          <X size={14} /> Close
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Sidebar */}
        <div style={{ width: 200, background: COLORS.bgDark, display: "flex", flexDirection: "column", flexShrink: 0, padding: "12px 8px" }}>
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

          {/* Edition badge at bottom */}
          <div style={{ marginTop: "auto", padding: "10px 12px" }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: COLORS.accent, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Edition</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>WrenchIQ-{edition}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>v1.0 · Mar 2026</div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 32px" }}>
          <div style={{ maxWidth: 860 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 800, color: COLORS.textPrimary }}>{activeSection?.label}</h2>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 24 }}>WrenchIQ-{edition} · Product Specifications v1.0 · March 2026</div>

            {section === "overview"    && <SectionOverview    edition={edition} />}
            {section === "valueprop"   && <SectionValueProp   edition={edition} />}
            {section === "personas"    && <SectionPersonas />}
            {section === "flows"       && <SectionFlows />}
            {section === "competitive" && <SectionCompetitive />}
            {section === "templates"   && <SectionTemplates   edition={edition} />}
            {section === "apis"        && <SectionAPIs        edition={edition} />}
            {section === "arch"        && <SectionArch        edition={edition} />}
          </div>
        </div>
      </div>
    </div>
  );
}
