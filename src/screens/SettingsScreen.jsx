import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  DollarSign,
  Wrench,
  CheckCircle,
  XCircle,
  AlertCircle,
  Hash,
  MessageSquare,
  Users,
  Bell,
  Zap,
  ChevronRight,
  Edit2,
  Plus,
  ToggleLeft,
  ToggleRight,
  Activity,
  Star,
  Link,
  Unlink,
  Target,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, technicians, advisors } from "../data/demoData";
import { extractIngEntities } from "../services/ingEntityExtractor";
import { useDemo, smsNameToProvider } from "../context/DemoContext";
import AdminShell from "../components/AdminShell";
import PrediiLearnScreen from "./PrediiLearnScreen";
import { PrediiLearnProvider } from "../context/PrediiLearnContext";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Nav sections ───────────────────────────────────────────
export const SETTINGS_SECTIONS = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { id: "integrations", label: "Integrations", icon: Link },
      { id: "prediiLearn", label: "Predii Learn", icon: Sparkles },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      { id: "shop", label: "Shop Profile", icon: Building2 },
      { id: "team", label: "Team", icon: Users },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "aroMargin", label: "ARO, ELR & Margin", icon: Target },
      { id: "goldStandard", label: "Gold Standard", icon: ClipboardCheck },
      { id: "tribal", label: "Strategic Priorities", icon: MessageSquare },
    ],
  },
];

// ── Badge components ────────────────────────────────────────
function StatusBadge({ status }) {
  const configs = {
    connected: { bg: "#DCFCE7", color: "#15803D", dot: COLORS.success, label: "Connected" },
    active: { bg: "#EDE9FE", color: "#6D28D9", dot: "#8B5CF6", label: "Active" },
    disconnected: { bg: "#F3F4F6", color: "#6B7280", dot: "#9CA3AF", label: "Not Connected" },
  };
  const c = configs[status] || configs.disconnected;
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.color,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: c.dot,
        }}
      />
      {c.label}
    </div>
  );
}

// ── Section header ──────────────────────────────────────────
function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: COLORS.textPrimary,
          margin: 0,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: "4px 0 0" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ── Field row ───────────────────────────────────────────────
function FieldRow({ label, value, icon: Icon }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
        padding: "14px 0",
        borderBottom: `1px solid ${COLORS.border}`,
      }}
    >
      {Icon && (
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            background: COLORS.borderLight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={COLORS.textSecondary} />
        </div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: 500 }}>
          {value}
        </div>
      </div>
      <button
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 10px",
          borderRadius: 6,
          color: COLORS.textSecondary,
          fontSize: 12,
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Edit2 size={13} />
        Edit
      </button>
    </div>
  );
}

// ── Toggle row ──────────────────────────────────────────────
function ToggleRow({ label, description, enabled, onToggle, disabled, tag }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 16,
        padding: "14px 0",
        borderBottom: `1px solid ${COLORS.border}`,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 600,
            color: COLORS.textPrimary,
            marginBottom: 3,
          }}
        >
          {label}
          {tag && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                background: "#FEF3C7",
                color: "#92400E",
                padding: "2px 7px",
                borderRadius: 10,
                letterSpacing: "0.3px",
              }}
            >
              {tag}
            </span>
          )}
        </div>
        {description && (
          <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{description}</div>
        )}
      </div>
      <button
        onClick={disabled ? undefined : onToggle}
        style={{
          background: "none",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          padding: 0,
          flexShrink: 0,
        }}
      >
        {enabled ? (
          <ToggleRight size={28} color={COLORS.success} />
        ) : (
          <ToggleLeft size={28} color={COLORS.textMuted} />
        )}
      </button>
    </div>
  );
}

// ── Integration card ────────────────────────────────────────
function IntegrationCard({ logo, name, status, lines, actionLabel, actionVariant, note }) {
  const actionColors = {
    primary: { bg: COLORS.accent, color: "#fff" },
    gray: { bg: "#F3F4F6", color: COLORS.textSecondary },
    disabled: { bg: "#F3F4F6", color: COLORS.textMuted },
    manage: { bg: COLORS.primary, color: "#fff" },
    configure: { bg: "#7C3AED", color: "#fff" },
    view: { bg: "#EDE9FE", color: "#6D28D9" },
  };
  const btnStyle = actionColors[actionVariant] || actionColors.gray;

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top row: logo + name + badge */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ flexShrink: 0 }}>{logo}</div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
              {name}
            </span>
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      {/* Info lines */}
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontSize: 13, color: i === 0 ? COLORS.textPrimary : COLORS.textSecondary }}>
            {line}
          </div>
        ))}
        {note && (
          <div
            style={{
              fontSize: 12,
              color: "#92400E",
              background: "#FEF3C7",
              borderRadius: 6,
              padding: "4px 8px",
              marginTop: 2,
            }}
          >
            {note}
          </div>
        )}
      </div>

      {/* Action button */}
      <button
        disabled={actionVariant === "disabled"}
        style={{
          background: btnStyle.bg,
          color: btnStyle.color,
          border: "none",
          borderRadius: 8,
          padding: "8px 16px",
          fontSize: 13,
          fontWeight: 600,
          cursor: actionVariant === "disabled" ? "default" : "pointer",
          alignSelf: "flex-start",
          opacity: actionVariant === "disabled" ? 0.6 : 1,
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

// ── Tech avatar ─────────────────────────────────────────────
function TechAvatar({ initials, role }) {
  const colors = {
    "Master Technician": { bg: "#FEF3C7", color: "#92400E" },
    "Journeyman Technician": { bg: "#DBEAFE", color: "#1E40AF" },
    "Apprentice Technician": { bg: "#D1FAE5", color: "#065F46" },
  };
  const c = colors[role] || { bg: COLORS.borderLight, color: COLORS.textSecondary };
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: c.bg,
        color: c.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

// ── Shop Profile tab ────────────────────────────────────────
export function ShopProfileTab() {
  return (
    <div>
      <SectionHeader
        title="Shop Profile"
        subtitle="Business information and operating details"
      />

      {/* Card */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "0 24px",
          marginBottom: 24,
        }}
      >
        <FieldRow icon={Building2} label="Shop Name" value={SHOP.name} />
        <FieldRow icon={Hash} label="Shop ID" value={SHOP.id} />
        <FieldRow icon={MapPin} label="Address" value={SHOP.address} />
        <FieldRow icon={Phone} label="Phone" value={SHOP.phone} />
        <FieldRow icon={Mail} label="Email" value={SHOP.email} />
        <FieldRow
          icon={DollarSign}
          label="Labor Rate"
          value={`$${SHOP.laborRate}/hr`}
        />
        <FieldRow icon={Wrench} label="Service Bays" value={`${SHOP.bays} bays`} />
        <FieldRow
          icon={Clock}
          label="Hours — Weekdays"
          value={`${SHOP.hours.days} · ${SHOP.hours.open} – ${SHOP.hours.close}`}
        />
        <FieldRow
          icon={Clock}
          label="Hours — Saturday"
          value={`Sat · ${SHOP.satHours.open} – ${SHOP.satHours.close}`}
        />
      </div>

      {/* Owner info */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>
          Owner / Primary Contact
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: COLORS.primary,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {SHOP.ownerInitials}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
              {SHOP.owner}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Owner · Lead Service Advisor
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Data Feed endpoints (SMS integration detail) ────────────
const DATA_FEED_ENDPOINTS = [
  {
    title: "Most recently updated customer",
    method: "GET",
    path: "/api/data-feed/most-recent-customer?shopId=&edition=",
    description: "The customer/RO with the newest activity — this is what WrenchIQ shows by default.",
    sample: {
      found: true,
      data: {
        source: "RepairOrder",
        roId: "69df2f96fb5c4e71e8de297e",
        roNumber: "RO-2026-0502",
        shopId: "ridgeline",
        customerId: "cust-102",
        customerName: "Karen Tso",
        status: "inspecting",
        vehicle: { year: 2022, make: "Chevrolet", model: "Silverado 1500", vin: "1GCPACED8NZ143872" },
        dateIn: "2026-04-14T15:30:00.000Z",
        updatedAt: "2026-06-29T21:21:19.081Z",
      },
    },
  },
  {
    title: "Active customer / RO list",
    method: "GET",
    path: "/api/data-feed/customers?shopId=&edition=&limit=",
    description: "Up to 100 active customers and their ROs, most-recent first — lets an advisor search for or switch to any of them.",
    sample: {
      count: 2,
      data: [
        {
          source: "RepairOrder",
          roId: "69df2f96fb5c4e71e8de297e",
          roNumber: "RO-2026-0502",
          shopId: "ridgeline",
          customerId: "cust-102",
          customerName: "Karen Tso",
          status: "inspecting",
          vehicle: { year: 2022, make: "Chevrolet", model: "Silverado 1500", vin: "1GCPACED8NZ143872" },
          dateIn: "2026-04-14T15:30:00.000Z",
          updatedAt: "2026-06-29T21:21:19.081Z",
        },
        {
          source: "RepairOrder",
          roId: "69e04b5ea2ba2dfaa2c4b2ab",
          roNumber: "RO-shop-004-2026-0023",
          shopId: "shop-001",
          customerId: "cust-loc-004-016",
          customerName: "Hector Santos",
          status: "closed",
          vehicle: { year: 2023, make: "Rivian", model: "R1T", vin: "LOC00420230000230" },
          dateIn: "2026-04-16T02:33:12.057Z",
          updatedAt: "2026-04-17T02:33:12.057Z",
        },
      ],
    },
  },
];

// ── SMS logo ─────────────────────────────────────────────────
function SmsLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: COLORS.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 12,
        fontWeight: 900,
        letterSpacing: "-0.5px",
      }}
    >
      SMS
    </div>
  );
}

// ── SMS integration card (with Data Feed endpoint detail) ────
function SmsIntegrationCard() {
  const [expanded, setExpanded] = useState(true);
  const { smsName, setDemo, SMS_OPTIONS, smsWriteTier } = useDemo();

  const handleSmsChange = (e) => {
    const name = e.target.value;
    setDemo({ smsName: name, smsProvider: smsNameToProvider(name) });
  };

  const isReadWrite = smsWriteTier === "readwrite";

  return (
    <div
      style={{
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Identity + status */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <SmsLogo />
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>
              SMS / DMS Data Feed
            </span>
            <StatusBadge status="connected" />
          </div>
          <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
            SMS/DMS adapter — feed of the Work-in-Progress Queue and up to 1 year of
            historical repair orders. {isReadWrite
              ? "Write-back is enabled — WrenchIQ can push approved changes to your system."
              : "WrenchIQ never writes back to your system on this tier."}
          </div>
        </div>
      </div>

      {/* Shop Management System selector — remembered across every surface
          that reads useDemo()'s smsName/smsProvider (Sidecar, header skin,
          Trust Engine, etc.), since it's persisted via DemoContext's
          localStorage-backed config. */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Shop Management System
        </label>
        <select
          value={smsName}
          onChange={handleSmsChange}
          style={{
            width: "100%", maxWidth: 320, padding: "10px 12px", fontSize: 13, fontWeight: 600,
            color: COLORS.textPrimary, background: "#fff", border: `1px solid ${COLORS.border}`,
            borderRadius: 8, cursor: "pointer",
          }}
        >
          {SMS_OPTIONS.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
      </div>

      {/* Access tier — V5 feedback (C1): Read-only vs Read+Write */}
      <div>
        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
          Access Tier
        </label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { id: "read", label: "Read-only", desc: "WrenchIQ reads your queue and history — never writes back." },
            { id: "readwrite", label: "Read + Write", desc: "WrenchIQ can push approved estimates/services back to your SMS/DMS." },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setDemo({ smsWriteTier: opt.id })}
              style={{
                textAlign: "left", flex: "1 1 220px", maxWidth: 280,
                border: `1.5px solid ${smsWriteTier === opt.id ? COLORS.accent : COLORS.border}`,
                background: smsWriteTier === opt.id ? `${COLORS.accent}0d` : "#fff",
                borderRadius: 10, padding: "10px 12px", cursor: "pointer",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>{opt.label}</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4 }}>{opt.desc}</div>
            </button>
          ))}
        </div>
        {isReadWrite && (
          <div style={{ marginTop: 8, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.4 }}>
            You own this decision — WrenchIQ only writes back what you've explicitly approved on an RO, and only while this tier is active.
          </div>
        )}
      </div>

      {/* At-a-glance meta */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Adapter", value: `${smsName} SMS` },
          { label: "Access", value: isReadWrite ? "Read + Write" : "Read-only" },
          { label: "Refreshes every", value: "60 seconds" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              background: COLORS.bg, border: `1px solid ${COLORS.border}`,
              borderRadius: 8, padding: "6px 10px",
            }}
          >
            <span style={{ fontSize: 11, color: COLORS.textMuted, fontWeight: 600 }}>{m.label}</span>
            <span style={{ fontSize: 12, color: COLORS.textPrimary, fontWeight: 700 }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Sample data feeds */}
      <div>
        <button
          onClick={() => setExpanded((v) => !v)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            padding: 0, marginBottom: expanded ? 12 : 0,
            fontSize: 13, fontWeight: 700, color: COLORS.primary,
          }}
        >
          <ChevronRight
            size={14}
            style={{ transform: expanded ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}
          />
          Sample data feeds
          <span style={{ fontSize: 12, fontWeight: 500, color: COLORS.textMuted }}>
            — exactly what WrenchIQ reads, nothing it doesn't
          </span>
        </button>

        {expanded && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {DATA_FEED_ENDPOINTS.map((ep) => (
              <div
                key={ep.path}
                style={{
                  background: COLORS.bg,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: 14,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>
                  {ep.title}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>
                  {ep.description}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "#15803D",
                      background: "#DCFCE7",
                      padding: "2px 7px",
                      borderRadius: 6,
                    }}
                  >
                    {ep.method}
                  </span>
                  <code style={{ fontSize: 11, color: COLORS.textMuted }}>
                    {ep.path}
                  </code>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
                  Sample response
                </div>
                <pre
                  style={{
                    margin: 0,
                    fontSize: 11,
                    lineHeight: 1.5,
                    background: "#0D1117",
                    color: "#C9D1D9",
                    borderRadius: 8,
                    padding: 12,
                    overflowX: "auto",
                  }}
                >
                  {JSON.stringify(ep.sample, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── LLM provider card — switch which configured LLM endpoint "Predii LLM"
// actually calls (e.g. a self-hosted model vs. Azure OpenAI), without
// editing .env.local or restarting the server. See
// server/services/llmProviderConfig.js — only the choice of profile is
// stored; no API key material is ever sent to or from this UI.
function LLMProviderCard() {
  const [status, setStatus] = useState(null);
  const [switching, setSwitching] = useState(null);
  const [error, setError] = useState(null);

  const load = () => {
    fetch(`${API_BASE}/api/llm-provider-config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStatus(data); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  const switchTo = async (profileKey) => {
    setSwitching(profileKey);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/llm-provider-config`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeProfile: profileKey }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStatus(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div
      style={{
        background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 12,
        padding: 20, display: "flex", flexDirection: "column", gap: 12,
      }}
    >
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
          AI Engine
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>
          Which configured LLM endpoint powers Predii LLM across recommendations, chat, and the ARO Agent. Switches instantly — no restart needed.
        </div>
      </div>

      {!status ? (
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Loading…</div>
      ) : (
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(status.profiles).map(([key, p]) => {
            const active = status.activeProfile === key;
            const disabled = !p.configured || switching !== null;
            return (
              <button
                key={key}
                disabled={disabled}
                onClick={() => switchTo(key)}
                title={p.configured ? p.baseUrl : `Not configured — set the ${key === "azure" ? "AZURE_OPENAI_*" : "LLM_*"} vars in .env.local`}
                style={{
                  textAlign: "left", flex: "1 1 220px", maxWidth: 280,
                  border: `1.5px solid ${active ? COLORS.accent : COLORS.border}`,
                  background: active ? `${COLORS.accent}0d` : "#fff",
                  borderRadius: 10, padding: "10px 12px",
                  cursor: disabled ? "not-allowed" : "pointer",
                  opacity: p.configured ? 1 : 0.5,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{p.label}</span>
                  {active && <StatusBadgeDot />}
                </div>
                <div style={{ fontSize: 11, color: COLORS.textSecondary, lineHeight: 1.4 }}>
                  {p.model || "—"}
                </div>
                {!p.configured && (
                  <div style={{ fontSize: 10, color: "#B45309", marginTop: 3, fontWeight: 600 }}>
                    Not configured
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {error && (
        <div style={{ fontSize: 12, color: "#B91C1C" }}>{error}</div>
      )}
    </div>
  );
}

function StatusBadgeDot() {
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, color: "#15803D", background: "#DCFCE7",
      padding: "1px 6px", borderRadius: 6, textTransform: "uppercase", letterSpacing: 0.3,
    }}>
      Active
    </span>
  );
}

// ── Integrations tab ────────────────────────────────────────
export function IntegrationsTab() {
  return (
    <div>
      <SectionHeader
        title="Integrations"
        subtitle="How WrenchIQ connects to your shop's system"
      />

      <div style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 20 }}>
        <SmsIntegrationCard />
        <LLMProviderCard />
      </div>
    </div>
  );
}

// ── Team tab ────────────────────────────────────────────────
export function TeamTab() {
  return (
    <div>
      <SectionHeader
        title="Team"
        subtitle="Technicians and service advisors"
      />

      {/* Technicians */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Technicians
          </div>
          <button
            style={{
              background: COLORS.accent,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "7px 14px",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <Plus size={14} />
            Add Technician
          </button>
        </div>

        <div
          style={{
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {technicians.map((tech, i) => (
            <div
              key={tech.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderBottom: i < technicians.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              <TechAvatar initials={tech.initials} role={tech.role} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                    {tech.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      background: tech.status === "working" ? "#DCFCE7" : "#FEF3C7",
                      color: tech.status === "working" ? "#15803D" : "#92400E",
                      padding: "2px 8px",
                      borderRadius: 10,
                    }}
                  >
                    {tech.status === "working" ? "On Shift" : "Available"}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2 }}>
                  {tech.role} · {tech.specialty}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {tech.certs.map((cert) => (
                    <span
                      key={cert}
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        background: COLORS.borderLight,
                        color: COLORS.textSecondary,
                        padding: "2px 8px",
                        borderRadius: 8,
                      }}
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                  {tech.efficiency}% efficiency
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                  {tech.customerRating} rating
                </div>
                <button
                  style={{
                    background: "none",
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 6,
                    padding: "5px 12px",
                    fontSize: 12,
                    fontWeight: 500,
                    color: COLORS.textSecondary,
                    cursor: "pointer",
                    marginTop: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Edit2 size={11} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advisors */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
          Service Advisors
        </div>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${COLORS.border}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          {advisors.map((adv, i) => (
            <div
              key={adv.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 20px",
                borderBottom: i < advisors.length - 1 ? `1px solid ${COLORS.border}` : "none",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: COLORS.primary,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {adv.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.textPrimary }}>
                  {adv.name}
                </div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{adv.role}</div>
              </div>
              <button
                style={{
                  background: "none",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  padding: "5px 12px",
                  fontSize: 12,
                  fontWeight: 500,
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Edit2 size={11} />
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notifications tab ───────────────────────────────────────
export function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    dailySummary: true,
    aiInsights: true,
  });

  const toggle = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "dailySummary", label: "Daily performance summary", description: "EOD revenue, RO count, and bay utilization recap" },
    { key: "aiInsights", label: "AI insights & recommendations", description: "Proactive AI suggestions throughout the day" },
  ];

  return (
    <div>
      <SectionHeader
        title="Notifications"
        subtitle="Control alerts and shop communication preferences"
      />
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "0 20px",
        }}
      >
        {items.map((item) => (
          <ToggleRow
            key={item.key}
            label={item.label}
            description={item.description}
            enabled={notifs[item.key]}
            onToggle={() => toggle(item.key)}
          />
        ))}
        <div style={{ height: 4 }} />
      </div>
    </div>
  );
}

// ── ARO, ELR & Margin Tab ─────────────────────────────────────────
const PREFERRED_SUPPLIER_OPTIONS = ["Worldpac", "O'Reilly", "NAPA", "eBay Motors", "RockAuto"];

export function AROMarginTab() {
  const { activeShopId } = useDemo();
  // ARO Target reuses the network-wide "avg_ro" goal (shop_goals collection),
  // shared with the ARO Agent dashboard's aggregate-across-locations view —
  // intentionally not scoped to the single active shop.
  const NETWORK_SHOP_ID = 'shop-001';

  const [aroTarget, setAroTarget] = useState('');
  const [aroGoalDoc, setAroGoalDoc] = useState(null);
  const [aroLoading, setAroLoading] = useState(true);
  const [aroSaving, setAroSaving] = useState(false);

  const [marginConfig, setMarginConfig] = useState(null);
  const [laborCost, setLaborCost] = useState('');
  const [partsMarginTarget, setPartsMarginTarget] = useState('');
  const [preferredSuppliers, setPreferredSuppliers] = useState([]);
  const [marginLoading, setMarginLoading] = useState(true);
  const [marginSaving, setMarginSaving] = useState(false);

  // Effective Labor Rate (ELR) target — shares the same config as the
  // ARO Agent dashboard's minELR goal.
  const [elrTarget, setElrTarget] = useState('');
  const [elrLoading, setElrLoading] = useState(true);
  const [elrSaving, setElrSaving] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/api/shop-goals/${NETWORK_SHOP_ID}`)
      .then(r => r.ok ? r.json() : [])
      .then(goals => {
        const aroGoal = (Array.isArray(goals) ? goals : []).find(g => g.metric === 'avg_ro');
        if (aroGoal) {
          setAroGoalDoc(aroGoal);
          setAroTarget(String(aroGoal.target));
        }
        setAroLoading(false);
      })
      .catch(() => setAroLoading(false));
  }, []);

  const loadElrTarget = useCallback(() => {
    setElrLoading(true);
    fetch(`${API_BASE}/api/aro-agent/config/${NETWORK_SHOP_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(goals => {
        if (goals) setElrTarget(String(goals.minELR ?? ''));
        setElrLoading(false);
      })
      .catch(() => setElrLoading(false));
  }, []);

  useEffect(() => { loadElrTarget(); }, [loadElrTarget]);

  const saveElrTarget = async () => {
    const minELR = Number(elrTarget);
    if (isNaN(minELR) || minELR <= 0) return;
    setElrSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/aro-agent/config/${NETWORK_SHOP_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minELR }),
      });
      if (res.ok) loadElrTarget();
    } finally {
      setElrSaving(false);
    }
  };

  useEffect(() => {
    setMarginLoading(true);
    fetch(`${API_BASE}/api/shop-config/${activeShopId}`)
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (cfg) {
          setMarginConfig(cfg);
          setLaborCost(String(cfg.laborCost ?? ''));
          setPartsMarginTarget(String(cfg.partsMarginTarget ?? ''));
          setPreferredSuppliers(Array.isArray(cfg.preferredSuppliers) ? cfg.preferredSuppliers : []);
        }
        setMarginLoading(false);
      })
      .catch(() => setMarginLoading(false));
  }, [activeShopId]);

  const saveAroTarget = async () => {
    const target = Number(aroTarget);
    if (isNaN(target) || target <= 0) return;
    setAroSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/shop-goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId: NETWORK_SHOP_ID,
          locationId: aroGoalDoc?.locationId || 'all',
          metric: 'avg_ro',
          target,
          baseline: aroGoalDoc?.baseline ?? target,
          targetDate: aroGoalDoc?.targetDate || null,
          trackDaily: aroGoalDoc?.trackDaily ?? true,
        }),
      });
      if (res.ok) setAroGoalDoc(await res.json());
    } finally {
      setAroSaving(false);
    }
  };

  const toggleSupplier = (name) => {
    setPreferredSuppliers(prev =>
      prev.includes(name) ? prev.filter(s => s !== name) : [...prev, name]
    );
  };

  const saveMarginConfig = async () => {
    setMarginSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/shop-config/${activeShopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          laborCost: Number(laborCost),
          partsMarginTarget: Number(partsMarginTarget),
          preferredSuppliers,
        }),
      });
      if (res.ok) setMarginConfig(await res.json());
    } finally {
      setMarginSaving(false);
    }
  };

  const cardStyle = {
    background: "#fff",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  };
  const inputStyle = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    fontSize: 14,
    color: COLORS.textPrimary,
    boxSizing: "border-box",
  };
  const fieldLabelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.textMuted,
    marginBottom: 6,
    display: "block",
  };
  const saveButtonStyle = (disabled) => ({
    background: disabled ? COLORS.borderLight : COLORS.primary,
    color: disabled ? COLORS.textMuted : "#fff",
    border: "none",
    borderRadius: 8,
    padding: "9px 18px",
    fontSize: 13,
    fontWeight: 600,
    cursor: disabled ? "default" : "pointer",
    marginTop: 12,
  });

  return (
    <div>
      <SectionHeader
        title="ARO, ELR & Margin"
        subtitle="Shop objectives for Average Repair Order, and the variables used to compute per-RO margin"
      />

      {/* ARO target */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.borderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Star size={15} color={COLORS.textSecondary} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>ARO Target</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
          The Average Repair Order goal WrenchIQ tracks in the ARO Agent and surfaces as a gap-to-goal on service recommendations.
        </div>
        {aroLoading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
            <div style={{ maxWidth: 200 }}>
              <label style={fieldLabelStyle}>Target ARO ($)</label>
              <input
                type="number"
                value={aroTarget}
                onChange={(e) => setAroTarget(e.target.value)}
                style={inputStyle}
              />
            </div>
            <button onClick={saveAroTarget} disabled={aroSaving} style={saveButtonStyle(aroSaving)}>
              {aroSaving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>

      {/* Effective Labor Rate (ELR) target + live calculation */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.borderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={15} color={COLORS.textSecondary} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Effective Labor Rate (ELR)</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
          The minimum ELR goal WrenchIQ tracks in the ARO Agent — flags technicians and shop-wide performance falling below target.
        </div>
        {elrLoading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 16 }}>
              <div style={{ maxWidth: 200 }}>
                <label style={fieldLabelStyle}>Min ELR Target ($/hr)</label>
                <input
                  type="number"
                  value={elrTarget}
                  onChange={(e) => setElrTarget(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <button onClick={saveElrTarget} disabled={elrSaving} style={saveButtonStyle(elrSaving)}>
                {elrSaving ? "Saving…" : "Save"}
              </button>
            </div>

            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: "monospace" }}>
              ELR = Total Labor Revenue ÷ Total Actual Hours Worked
            </div>
          </>
        )}
      </div>

      {/* Margin calculation variables */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.borderLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <DollarSign size={15} color={COLORS.textSecondary} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.textPrimary }}>Margin Calculation Variables</div>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 16 }}>
          Inputs the RO margin checker uses to compute billed-vs-cost margin and flag ROs below target.
        </div>

        {marginLoading ? (
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>Loading…</div>
        ) : (
          <>
            <div style={{ display: "flex", gap: 16, marginBottom: 18 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle}>Labor Cost ($/hr)</label>
                <input
                  type="number"
                  value={laborCost}
                  onChange={(e) => setLaborCost(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                  Shop's internal cost per labor hour — distinct from the posted Labor Rate in Shop Profile.
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle}>Parts Margin Target (%)</label>
                <input
                  type="number"
                  value={partsMarginTarget}
                  onChange={(e) => setPartsMarginTarget(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                  Target margin when parts are sourced from a preferred supplier below.
                </div>
              </div>
            </div>

            <label style={fieldLabelStyle}>Preferred Parts Suppliers</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 }}>
              {PREFERRED_SUPPLIER_OPTIONS.map((name) => {
                const selected = preferredSuppliers.includes(name);
                return (
                  <button
                    key={name}
                    onClick={() => toggleSupplier(name)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: `1px solid ${selected ? COLORS.primary : COLORS.border}`,
                      background: selected ? COLORS.primary : "#fff",
                      color: selected ? "#fff" : COLORS.textSecondary,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {selected && <CheckCircle size={12} />}
                    {name}
                  </button>
                );
              })}
            </div>

            <button onClick={saveMarginConfig} disabled={marginSaving} style={saveButtonStyle(marginSaving)}>
              {marginSaving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Gold Standard Checklist ──────────────────────────────────
function AppliesToBadge({ appliesTo }) {
  const isRO = appliesTo === "RO";
  return (
    <span style={{
      display: "inline-block",
      fontSize: 11,
      fontWeight: 700,
      padding: "2px 8px",
      borderRadius: 12,
      background: isRO ? "#EFF6FF" : "#ECFDF5",
      color: isRO ? "#2563EB" : "#059669",
    }}>
      {appliesTo}
    </span>
  );
}

function GoldStandardRow({ item, onSave }) {
  const [editing, setEditing] = useState(false);
  const [guideline, setGuideline] = useState(item.guideline);
  const [appliesTo, setAppliesTo] = useState(item.appliesTo);
  const [whatA5, setWhatA5] = useState(item.whatA5LooksLike);
  const [saving, setSaving] = useState(false);

  const cellStyle = { padding: "12px 14px", fontSize: 13, color: COLORS.textPrimary, verticalAlign: "top" };
  const inputStyle = {
    width: "100%",
    padding: "6px 8px",
    borderRadius: 6,
    border: `1px solid ${COLORS.border}`,
    fontSize: 13,
    color: COLORS.textPrimary,
    boxSizing: "border-box",
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(item.id, { guideline, appliesTo, whatA5LooksLike: whatA5 });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
      <td style={{ ...cellStyle, fontWeight: 700, color: COLORS.textMuted }}>{item.id}</td>
      <td style={cellStyle}>
        {editing ? (
          <input style={inputStyle} value={guideline} onChange={(e) => setGuideline(e.target.value)} />
        ) : (
          <span style={{ fontWeight: 600 }}>{item.guideline}</span>
        )}
      </td>
      <td style={cellStyle}>
        {editing ? (
          <select style={inputStyle} value={appliesTo} onChange={(e) => setAppliesTo(e.target.value)}>
            <option value="RO">RO</option>
            <option value="Conversation">Conversation</option>
          </select>
        ) : (
          <AppliesToBadge appliesTo={item.appliesTo} />
        )}
      </td>
      <td style={{ ...cellStyle, maxWidth: 380 }}>
        {editing ? (
          <textarea
            style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
            value={whatA5}
            onChange={(e) => setWhatA5(e.target.value)}
          />
        ) : (
          <span style={{ color: COLORS.textSecondary }}>{item.whatA5LooksLike}</span>
        )}
      </td>
      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
        {editing ? (
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={save}
              disabled={saving}
              style={{ background: COLORS.primary, color: "#fff", border: "none", borderRadius: 6, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => { setEditing(false); setGuideline(item.guideline); setAppliesTo(item.appliesTo); setWhatA5(item.whatA5LooksLike); }}
              style={{ background: "none", border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", color: COLORS.textSecondary }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted, display: "flex", alignItems: "center", padding: 4 }}
          >
            <Edit2 size={14} />
          </button>
        )}
      </td>
    </tr>
  );
}

export function GoldStandardTab() {
  const { activeShopId } = useDemo();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE}/api/gold-standard-checklist/${activeShopId}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeShopId]);

  const saveItem = async (itemId, updates) => {
    const res = await fetch(`${API_BASE}/api/gold-standard-checklist/${activeShopId}/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(prev => prev.map(i => (i.id === itemId ? updated : i)));
    }
  };

  return (
    <div>
      <SectionHeader
        title="Gold Standard Checklist"
        subtitle="The default rubric WrenchIQ scores every RO and customer conversation against, on a 1-5 scale."
      />
      <div style={{
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        borderRadius: 12,
        overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 20, fontSize: 13, color: COLORS.textMuted }}>Loading…</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: COLORS.borderLight, borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>ID</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Guideline</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>Applies To</th>
                  <th style={{ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, textTransform: "uppercase" }}>What a 5 Looks Like</th>
                  <th style={{ padding: "10px 14px" }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <GoldStandardRow key={item.id} item={item} onSave={saveItem} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Predii Score Logic ───────────────────────────────────────
// Documents the two independent RO-level scores side by side: Value Based
// (server/services/roValueScoreService.js — how likely a customer is to say
// yes) and Quality Based (server/routes/roGoldStandardScore.js — did the
// advisor follow the shop's hygiene checklist on this RO). Read-only —
// mirrors the actual formulas in code, not a separate editable config.
export function PrediiScoreLogicTab() {
  const [activeSubTab, setActiveSubTab] = useState("value");

  const Formula = ({ children }) => (
    <div style={{
      fontFamily: "monospace", fontSize: 12.5, color: "#111827",
      background: "#F9FAFB", border: `1px solid ${COLORS.border}`, borderRadius: 8,
      padding: "12px 14px", marginBottom: 16, lineHeight: 1.7, whiteSpace: "pre-wrap",
    }}>
      {children}
    </div>
  );

  const Row = ({ label, points, desc }) => (
    <div style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: `1px solid ${COLORS.borderLight || "#F3F4F6"}` }}>
      <div style={{ width: 56, flexShrink: 0, fontSize: 12, fontWeight: 800, color: COLORS.accent }}>{points}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{label}</div>
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  );

  const BandRow = ({ color, label, range }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{label}</span>
      <span style={{ fontSize: 12, color: COLORS.textMuted }}>{range}</span>
    </div>
  );

  return (
    <div>
      <SectionHeader
        title="Predii Score Logic"
        subtitle="How WrenchIQ scores every RO — two independent scores, shown side by side on the queue."
      />

      <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#F3F4F6", borderRadius: 8, padding: 3, width: "fit-content" }}>
        {[
          { id: "value", label: "Value Based" },
          { id: "quality", label: "Quality Based" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveSubTab(t.id)}
            style={{
              padding: "6px 16px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: activeSubTab === t.id ? "#fff" : "transparent",
              color: activeSubTab === t.id ? COLORS.textPrimary : "#6B7280",
              boxShadow: activeSubTab === t.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {activeSubTab === "value" && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#1E40AF" }}>
            <strong>Value Based</strong> answers "how likely is this customer to say yes" — a value/opportunity score shown alongside (not instead of) the Quality Based score on the RO queue.
          </div>

          <Formula>
{`score = round((trustScore / 100) × 65)
      + round((min(estimate, $2,000) / $2,000) × 35)

clamped to 0–100`}
          </Formula>

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>
            Two inputs
          </div>
          <Row points="0–65 pts" label="Customer Trust Score" desc="The customer's existing Trust Score (visit frequency, lifetime value, approval rate, recency, comeback penalty — see below), scaled to a 65-point weight. Trust carries the heavier weight — a customer's track record of saying yes predicts more than any single RO's size." />
          <Row points="0–35 pts" label="Estimate Size" desc="This RO's dollar estimate, capped at $2,000, scaled linearly. Bigger tickets are worth more selling effort, but a single large outlier can't dominate the score." />

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, margin: "20px 0 8px" }}>
            Customer Trust Score (0–100)
          </div>
          <Row points="+5" label="Base" desc="Every customer starts here." />
          <Row points="+0–25" label="Visit frequency" desc="Scales with visit count, capped at 15 visits." />
          <Row points="+0–25" label="Lifetime value" desc="Scales with total spend, capped at $10,000." />
          <Row points="+0–30" label="Approval rate" desc="Share of presented services the customer has accepted — the single heaviest-weighted factor." />
          <Row points="+0–10" label="Recency" desc="Full bonus within 90 days of last visit, half within 180 days, none beyond." />
          <Row points="−0–20" label="Comeback penalty" desc="Deducted per comeback RO (same problem, repeat visit), capped at 20 points." />

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, margin: "20px 0 8px" }}>
            Score bands
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <BandRow color="#16A34A" label="High" range="≥ 70" />
            <BandRow color="#D97706" label="Medium" range="40–69" />
            <BandRow color="#9CA3AF" label="Low" range="< 40" />
          </div>
        </div>
      )}

      {activeSubTab === "quality" && (
        <div style={{ maxWidth: 640 }}>
          <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#15803D" }}>
            <strong>Quality Based</strong> answers "did the advisor follow the shop's Gold Standard hygiene checklist on this RO" — independent of, and unaffected by, the Value Based score.
          </div>

          <Formula>
{`quality % = round((met / applicable) × 100)

applicable = every checklist item NOT marked "N/A" for this RO
met        = items marked "Done"`}
          </Formula>

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 8 }}>
            How an item gets marked "Done"
          </div>
          <Row points="1st" label="Advisor's own status wins" desc="Once an advisor manually sets an item's status on the checklist, that's authoritative — it never gets overridden." />
          <Row points="2nd" label="WrenchIQ's AI suggestion" desc="Until the advisor reviews an item, its status falls back to WrenchIQ's own AI read of the RO/conversation — so the score reflects a real assessment instead of sitting at 0% before anyone has looked." />

          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, margin: "20px 0 8px" }}>
            Where the checklist comes from
          </div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
            The guideline items themselves are edited under the <strong>Gold Standard</strong> tab — this page only documents how the percentage above is computed from whatever guidelines are configured there.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tribal Knowledge Panel ──────────────────────────────────
export function TribalKnowledgePanel() {
  const { activeShopId } = useDemo();
  const SHOP_ID = activeShopId;
  const LOCAL_STORAGE_KEY = `wrenchiq_tribal_${SHOP_ID}`;
  // V5 feedback (B1): standing targets (margin/ARO/ELR-type, ongoing) and
  // time-bound campaigns ("this week, push the brake-fluid flush") are two
  // different kinds of thing and shouldn't be mixed in one bucket.
  const [activeSubTab, setActiveSubTab] = useState('standing');
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiOffline, setApiOffline] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNote, setNewNote] = useState({ note: '', triggerType: 'any_ro', expiresAt: '' });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [hierarchyNodes, setHierarchyNodes] = useState([]);
  const [scopeId, setScopeId] = useState(SHOP_ID);

  // V5 feedback (B3): tone-of-voice settings that shape every LLM-generated
  // recommendation/message for this shop (see server/services/voicePrompt.js).
  const [voice, setVoice] = useState(null);
  useEffect(() => {
    fetch(`${API_BASE}/api/shop-voice-settings/${SHOP_ID}`)
      .then(r => r.ok ? r.json() : null)
      .then(v => v && setVoice(v))
      .catch(() => {});
  }, [SHOP_ID]);

  const patchVoice = async (updates) => {
    const next = { ...voice, ...updates };
    setVoice(next);
    try {
      const res = await fetch(`${API_BASE}/api/shop-voice-settings/${SHOP_ID}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) setVoice(await res.json());
    } catch {}
  };

  // Scope options for authoring a priority: this shop, or its district/region
  // ancestors (Strategic Priorities set above shop level — see /api/hierarchy).
  useEffect(() => {
    fetch(`${API_BASE}/api/hierarchy`)
      .then(r => r.ok ? r.json() : [])
      .then(setHierarchyNodes)
      .catch(() => setHierarchyNodes([]));
  }, []);

  useEffect(() => { setScopeId(SHOP_ID); }, [SHOP_ID]);

  const scopeOptions = (() => {
    const byId = Object.fromEntries(hierarchyNodes.map(n => [n.id, n]));
    const opts = [{ id: SHOP_ID, label: 'This shop only' }];
    let parentId = byId[SHOP_ID]?.parentId;
    while (parentId && byId[parentId]) {
      const node = byId[parentId];
      opts.push({ id: node.id, label: `${node.type === 'region' ? 'Region' : 'District'}: ${node.name}` });
      parentId = node.parentId;
    }
    return opts;
  })();

  // Enrich a list and update state — runs the same LLM rule/entity extraction
  // for standing + time-bound objectives as it already did for ings (B1: both
  // buckets are free-form text, both get rules/entities extracted from it).
  const enrichAndSet = useCallback(async (raw) => {
    const extractable = raw.filter(n => n.noteType === 'ing' || isObj(n));
    const rest        = raw.filter(n => !(n.noteType === 'ing' || isObj(n)));
    const enriched = await extractIngEntities(extractable).catch(() => extractable);
    setNotes([...rest, ...enriched]);
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/tribal-notes/${SHOP_ID}?includeInactive=true&includeExpired=true`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('api_error')))
      .then(async data => {
        const raw = Array.isArray(data) ? data : [];
        setNotes(raw);
        setLoading(false);
        enrichAndSet(raw);
      })
      .catch(() => {
        // API unavailable — load from localStorage so locally-added notes survive
        try {
          const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
          setNotes(Array.isArray(cached) ? cached : []);
          enrichAndSet(Array.isArray(cached) ? cached : []);
        } catch {}
        setApiOffline(true);
        setLoading(false);
      });
  }, [enrichAndSet, SHOP_ID]);

  const now = new Date();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  const isIngNote = n => n.noteType === 'ing';
  const isObj = n => !n.noteType || n.noteType === 'objective';
  // Legacy objectives predate priorityKind — fall back to whether an expiry
  // was ever set (no expiry read as "ongoing" == standing) so they still land
  // in the right bucket without a data migration.
  const isStanding   = n => isObj(n) && (n.priorityKind ? n.priorityKind === 'standing' : !n.expiresAt);
  const isTimeBound  = n => isObj(n) && (n.priorityKind ? n.priorityKind === 'time_bound' : !!n.expiresAt);
  const typeFilter = activeSubTab === 'ings' ? isIngNote : activeSubTab === 'timeBound' ? isTimeBound : isStanding;
  const isIng = activeSubTab === 'ings';
  const isTimeBoundTab = activeSubTab === 'timeBound';
  const isToneTab = activeSubTab === 'tone';

  const activeNotes   = notes.filter(n => typeFilter(n) && n.active && (!n.expiresAt || new Date(n.expiresAt) > now));
  const inactiveNotes = notes.filter(n => typeFilter(n) && !n.active);
  const expiredNotes  = notes.filter(n => typeFilter(n) && n.active && n.expiresAt && new Date(n.expiresAt) <= now);

  const isExpiringSoon = (note) =>
    note.expiresAt && new Date(note.expiresAt) - now < threeDays && new Date(note.expiresAt) > now;

  const triggerLabel = (t) => {
    if (t === 'any_ro') return { label: 'Any RO', color: '#2563EB', bg: '#EFF6FF' };
    if (t === 'mpi_only') return { label: 'MPI Only', color: '#7C3AED', bg: '#EDE9FE' };
    if (t?.startsWith('vehicle_type:')) return { label: t.replace('vehicle_type:', '').replace(/^\w/, c => c.toUpperCase()), color: '#059669', bg: '#ECFDF5' };
    if (t?.startsWith('vehicle_make:')) return { label: `Make: ${t.replace('vehicle_make:', '').replace(/^\w/, c => c.toUpperCase())}`, color: '#0891B2', bg: '#ECFEFF' };
    if (t?.startsWith('mileage_range:')) return { label: `Miles: ${t.replace('mileage_range:', '')}`, color: '#D97706', bg: '#FFFBEB' };
    return { label: t || 'Any', color: '#6B7280', bg: '#F3F4F6' };
  };

  const toggleActive = async (note) => {
    const res = await fetch(`${API_BASE}/api/tribal-notes/${note._id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !note.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes(notes.map(n => n._id === updated._id ? updated : n));
    }
  };

  const deleteNote = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    const res = await fetch(`${API_BASE}/api/tribal-notes/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) setNotes(notes.filter(n => n._id !== id));
  };

  const saveEdit = async (id) => {
    const res = await fetch(`${API_BASE}/api/tribal-notes/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: editText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setNotes(notes.map(n => n._id === updated._id ? updated : n));
      setEditingId(null);
    }
  };

  const persistLocalNote = useCallback((note) => {
    try {
      const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([...cached, note]));
    } catch {}
  }, [LOCAL_STORAGE_KEY]);

  const addNote = async () => {
    if (!newNote.note.trim()) return;
    const body = {
      shopId: scopeId || SHOP_ID, locationId: 'all', ...newNote,
      noteType: activeSubTab === 'ings' ? 'ing' : 'objective',
      priorityKind: activeSubTab === 'timeBound' ? 'time_bound' : activeSubTab === 'standing' ? 'standing' : undefined,
      expiresAt: newNote.expiresAt || null, active: true,
    };

    let created = null;

    try {
      const res = await fetch(`${API_BASE}/api/tribal-notes`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) created = await res.json();
    } catch {}

    // API unavailable — create locally with a temp ID and persist to localStorage
    if (!created) {
      created = { ...body, _id: `local-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      persistLocalNote(created);
    }

    setNotes(prev => [...prev, created]);
    setNewNote({ note: '', triggerType: 'any_ro', expiresAt: '' });
    setShowNewForm(false);

    // Run entity extraction immediately so the badge appears — for ings and
    // for standing/time-bound objectives alike (B1: same free-form → rules
    // pipeline for both).
    if (created.noteType === 'ing' || isObj(created)) {
      extractIngEntities([created]).then(enriched => {
        if (enriched[0]?.entityData) {
          setNotes(prev => prev.map(n => n._id === created._id ? enriched[0] : n));
          // Update localStorage with enriched version
          if (created._id?.startsWith('local-')) {
            try {
              const cached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(
                cached.map(n => n._id === created._id ? enriched[0] : n)
              ));
            } catch {}
          }
        }
      }).catch(() => {});
    }
  };

  const StickyCard = ({ note }) => {
    // Prefer the LLM-extracted entityData label (now populated for standing/
    // time-bound objectives too, not just ings) — fall back to triggerType.
    const trig = note.entityData
      ? { label: note.entityData.displayLabel || 'Any Vehicle', color: '#7C3AED', bg: '#EDE9FE' }
      : triggerLabel(note.triggerType);
    const disc = note.entityData?.discount;
    const expiringSoon = isExpiringSoon(note);
    return (
      <div style={{
        background: note.active ? '#FEF9C3' : '#F3F4F6',
        border: `1px solid ${note.active ? '#FDE047' : '#D1D5DB'}`,
        borderRadius: 8, padding: 14,
        opacity: note.active ? 1 : 0.65,
        position: 'relative',
      }}>
        {expiringSoon && (
          <div style={{ position:'absolute', top:8, right:8, width:8, height:8,
            borderRadius:'50%', background:'#F97316' }} title="Expiring soon" />
        )}
        {editingId === note._id ? (
          <div>
            <textarea value={editText} onChange={e => setEditText(e.target.value)}
              style={{ width:'100%', border:'1px solid #D1D5DB', borderRadius:4,
                padding:6, fontSize:13, resize:'vertical', minHeight:60, marginBottom:8 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => saveEdit(note._id)}
                style={{ background:'#0D3B45', color:'#fff', border:'none', borderRadius:4,
                  padding:'4px 10px', fontSize:12, cursor:'pointer' }}>Save</button>
              <button onClick={() => setEditingId(null)}
                style={{ background:'#F3F4F6', border:'none', borderRadius:4,
                  padding:'4px 10px', fontSize:12, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <div style={{ fontSize:13, color:'#1F2937', marginBottom:10, lineHeight:1.4 }}>
            {note.note}
          </div>
        )}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:6 }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ background:trig.bg, color:trig.color, fontSize:11,
              fontWeight:600, padding:'2px 7px', borderRadius:10 }}>{trig.label}</span>
            {disc && (
              <span style={{ background:'#DCFCE7', color:'#16A34A', fontSize:11,
                fontWeight:600, padding:'2px 7px', borderRadius:10 }}>{disc} off</span>
            )}
            <span style={{ fontSize:11, color:'#9CA3AF' }}>
              {note.expiresAt ? `Until ${new Date(note.expiresAt).toLocaleDateString()}` : 'Ongoing'}
            </span>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => toggleActive(note)}
              style={{ fontSize:11, padding:'2px 8px', borderRadius:4, cursor:'pointer',
                background: note.active ? '#FEF2F2' : '#F0FDF4',
                color: note.active ? '#DC2626' : '#16A34A', border:'none', fontWeight:600 }}>
              {note.active ? 'Disable' : 'Enable'}
            </button>
            <button onClick={() => { setEditingId(note._id); setEditText(note.note); }}
              style={{ fontSize:11, padding:'2px 8px', borderRadius:4, cursor:'pointer',
                background:'#F3F4F6', border:'none' }}>Edit</button>
            <button onClick={() => deleteNote(note._id)}
              style={{ fontSize:11, padding:'2px 8px', borderRadius:4, cursor:'pointer',
                background:'#FEF2F2', color:'#DC2626', border:'none' }}>&#x2715;</button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding:32, color:'#6B7280' }}>Loading shop objectives...</div>;

  return (
    <div style={{ padding: '0 4px' }}>
      {apiOffline && (
        <div style={{ background:'#FFFBEB', border:'1px solid #FDE68A', borderRadius:8, padding:'8px 12px', marginBottom:14, fontSize:12, color:'#92400E', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontWeight:700 }}>Offline mode</span> — server unavailable. Notes are saved locally and will sync when the server is back.
        </div>
      )}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <h3 style={{ fontSize:18, fontWeight:700, color:'#1F2937', margin:0 }}>Strategic Priorities</h3>
          <p style={{ fontSize:13, color:'#6B7280', marginTop:4, marginBottom:0 }}>
            Surfaced in the WrenchIQ overlay when an RO is open
          </p>
        </div>
        <button onClick={() => setShowNewForm(!showNewForm)}
          style={{ background:'#0D3B45', color:'#fff', border:'none', borderRadius:8,
            padding:'8px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          + {isIng ? 'New ing' : isTimeBoundTab ? 'New Time-Bound Priority' : 'New Standing Priority'}
        </button>
      </div>

      {/* Sub-tabs — B1: standing (ongoing targets) vs. time-bound (tactical campaigns) are separate buckets */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#F3F4F6', borderRadius:8, padding:3, width:'fit-content' }}>
        {[
          { id:'standing',  label:'Standing' },
          { id:'timeBound', label:'Time-Bound' },
          { id:'ings',      label:'ings — Don\'t Forget' },
          { id:'tone',      label:'Tone of Voice' },
        ].map(t => (
          <button key={t.id} onClick={() => { setActiveSubTab(t.id); setShowNewForm(false); }}
            style={{
              padding:'6px 16px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: activeSubTab === t.id ? '#fff' : 'transparent',
              color: activeSubTab === t.id ? COLORS.textPrimary : '#6B7280',
              boxShadow: activeSubTab === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {isToneTab && <ToneOfVoicePanel voice={voice} onChange={patchVoice} />}

      {!isToneTab && <>
      {isIng && (
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#92400E' }}>
          <strong>ings</strong> are automatic reminders shown in the WrenchIQ overlay when an RO is open. They prompt advisors and techs to add commonly forgotten line items — fees, parts, or services.
        </div>
      )}

      {activeSubTab === 'standing' && (
        <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#1E40AF' }}>
          <strong>Standing priorities</strong> are ongoing shop targets that don't change week to week — margin, ARO, ELR, or whatever this shop actually tracks. Free-form text; no expiry.
        </div>
      )}
      {isTimeBoundTab && (
        <div style={{ background:'#FDF4FF', border:'1px solid #F0ABFC', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#86198F' }}>
          <strong>Time-bound priorities</strong> are tactical campaigns scoped to a window — e.g. "this week, offer a brake-fluid flush." Set an expiry so they fall off on their own.
        </div>
      )}

      {showNewForm && (
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8,
          padding:16, marginBottom:20 }}>
          <textarea
            placeholder={isIng
              ? 'e.g. Add waste disposal fee to every oil change'
              : isTimeBoundTab
                ? 'e.g. This week, push the brake-fluid flush to every RO'
                : 'e.g. Keep gross margin above 55% on every RO'}
            value={newNote.note} onChange={e => setNewNote({...newNote, note: e.target.value})}
            style={{ width:'100%', border:'1px solid #D1D5DB', borderRadius:4, padding:8,
              fontSize:13, resize:'vertical', minHeight:70, marginBottom: 4, boxSizing:'border-box' }} />
          <div style={{ fontSize:11, color:'#6B7280', marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ color:'#7C3AED', fontWeight:700 }}>AI</span>
            WrenchIQ will automatically extract conditions (vehicle make/model, mileage, promotion type) from your text.
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
            {scopeOptions.length > 1 && (
              <select value={scopeId} onChange={e => setScopeId(e.target.value)}
                style={{ border:'1px solid #D1D5DB', borderRadius:4, padding:'6px 8px', fontSize:13 }}>
                {scopeOptions.map(o => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            )}
            {!isIng && (
              <select value={newNote.triggerType}
                onChange={e => setNewNote({...newNote, triggerType: e.target.value})}
                style={{ border:'1px solid #D1D5DB', borderRadius:4, padding:'6px 8px', fontSize:13 }}>
                <option value="any_ro">Any RO</option>
                <option value="mpi_only">MPI / DVI Only</option>
                <option value="vehicle_type:japanese">Japanese Vehicles</option>
                <option value="vehicle_type:german">German Vehicles</option>
                <option value="vehicle_type:domestic_us">Domestic Vehicles</option>
                <option value="mileage_range:50000-999999">50k+ Miles</option>
                <option value="mileage_range:80000-100000">80k-100k Miles</option>
              </select>
            )}
            {isTimeBoundTab && (
              <input type="date" placeholder="Expiry (when this campaign ends)"
                value={newNote.expiresAt} onChange={e => setNewNote({...newNote, expiresAt: e.target.value})}
                style={{ border:'1px solid #D1D5DB', borderRadius:4, padding:'6px 8px', fontSize:13 }} />
            )}
            <button onClick={addNote}
              style={{ background:'#FF6B35', color:'#fff', border:'none', borderRadius:6,
                padding:'6px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {isIng ? 'Add ing' : isTimeBoundTab ? 'Add Time-Bound Priority' : 'Add Standing Priority'}
            </button>
            <button onClick={() => setShowNewForm(false)}
              style={{ background:'#F3F4F6', border:'none', borderRadius:6,
                padding:'6px 12px', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {activeNotes.length === 0 && !showNewForm && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'#9CA3AF', fontSize:14 }}>
          {isIng
            ? 'No ings yet. Add your first reminder above.'
            : isTimeBoundTab
              ? 'No active time-bound priorities yet. Add your first campaign above.'
              : 'No standing priorities yet. Add your first ongoing target above.'}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, marginBottom:20 }}>
        {activeNotes.map(note => <StickyCard key={note._id} note={note} />)}
      </div>

      {inactiveNotes.length > 0 && (
        <div style={{ marginTop:16 }}>
          <div style={{ fontSize:13, fontWeight:600, color:'#9CA3AF', marginBottom:8 }}>Disabled ({inactiveNotes.length})</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
            {inactiveNotes.map(note => <StickyCard key={note._id} note={note} />)}
          </div>
        </div>
      )}

      {expiredNotes.length > 0 && (
        <div style={{ marginTop:16 }}>
          <button onClick={() => setShowExpired(!showExpired)}
            style={{ background:'none', border:'none', fontSize:13, color:'#9CA3AF',
              cursor:'pointer', padding:0, marginBottom:8 }}>
            {showExpired ? '▼' : '▶'} Expired ({expiredNotes.length})
          </button>
          {showExpired && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
              {expiredNotes.map(note => <StickyCard key={note._id} note={note} />)}
            </div>
          )}
        </div>
      )}
      </>}
    </div>
  );
}

// V5 feedback (B3): tone-of-voice knobs shaping every LLM-generated
// recommendation/message for this shop — register, length, evidence-sharing,
// pressure level. See server/services/voicePrompt.js for how each maps into
// the actual system prompts.
function ToneOfVoicePanel({ voice, onChange }) {
  if (!voice) {
    return <div style={{ padding: '32px 0', textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Loading tone settings…</div>;
  }

  const Row = ({ label, help, children }) => (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 2 }}>{label}</div>
      {help && <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{help}</div>}
      {children}
    </div>
  );

  const RadioPill = ({ value, current, onClick, children }) => (
    <button onClick={onClick}
      style={{
        padding: '6px 16px', borderRadius: 6, border: '1px solid ' + (current === value ? '#FF6B35' : '#D1D5DB'),
        cursor: 'pointer', fontSize: 13, fontWeight: 600, marginRight: 8,
        background: current === value ? '#FFF7ED' : '#fff',
        color: current === value ? '#FF6B35' : COLORS.textPrimary,
      }}>
      {children}
    </button>
  );

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ background:'#EFF6FF', border:'1px solid #BFDBFE', borderRadius:8, padding:'10px 14px', marginBottom:22, fontSize:12, color:'#1E40AF' }}>
        Shapes how WrenchIQ writes every recommendation, chat reply, and customer message for this shop — not just here, everywhere the AI generates copy.
      </div>

      <Row label="Register" help="How formal should the shop sound?">
        <RadioPill value="professional" current={voice.register} onClick={() => onChange({ register: 'professional' })}>Professional</RadioPill>
        <RadioPill value="neighborhood" current={voice.register} onClick={() => onChange({ register: 'neighborhood' })}>Neighborhood</RadioPill>
      </Row>

      <Row label="Length" help="How long should generated messages be?">
        <RadioPill value="short" current={voice.length} onClick={() => onChange({ length: 'short' })}>Short</RadioPill>
        <RadioPill value="medium" current={voice.length} onClick={() => onChange({ length: 'medium' })}>Medium</RadioPill>
      </Row>

      <Row label="Pressure level" help="How assertively should upsell opportunities be framed?">
        <RadioPill value="low" current={voice.pressureLevel} onClick={() => onChange({ pressureLevel: 'low' })}>Low — no pressure</RadioPill>
        <RadioPill value="medium" current={voice.pressureLevel} onClick={() => onChange({ pressureLevel: 'medium' })}>Medium</RadioPill>
        <RadioPill value="high" current={voice.pressureLevel} onClick={() => onChange({ pressureLevel: 'high' })}>High</RadioPill>
      </Row>

      <Row label="Share evidence" help="Cite the specific data point behind a recommendation, or just state the recommendation.">
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={!!voice.shareEvidence} onChange={e => onChange({ shareEvidence: e.target.checked })} />
          Share the data behind each recommendation
        </label>
      </Row>
    </div>
  );
}

// ── Main SettingsScreen ─────────────────────────────────────
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("integrations");

  const tabContent = {
    shop: <ShopProfileTab />,
    integrations: <IntegrationsTab />,
    prediiLearn: <PrediiLearnScreen />,
    team: <TeamTab />,
    notifications: <NotificationsTab />,
    aroMargin: <AROMarginTab />,
    goldStandard: <GoldStandardTab />,
    tribal: <TribalKnowledgePanel />,
  };

  return (
    <PrediiLearnProvider>
      <AdminShell
        sections={SETTINGS_SECTIONS}
        activeId={activeTab}
        onSelect={setActiveTab}
        content={tabContent[activeTab]}
        contentMaxWidth={activeTab === "prediiLearn" ? "none" : 800}
      />
    </PrediiLearnProvider>
  );
}
