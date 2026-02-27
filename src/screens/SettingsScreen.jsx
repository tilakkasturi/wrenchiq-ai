import { useState } from "react";
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
  Sparkles,
  Shield,
  MessageSquare,
  CreditCard,
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
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, technicians, advisors } from "../data/demoData";

// ── Nav items ──────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "shop", label: "Shop Profile", icon: Building2 },
  { id: "integrations", label: "Integrations", icon: Link },
  { id: "ai", label: "AI Settings", icon: Sparkles },
  { id: "team", label: "Team", icon: Users },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
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

// ── Xero logo ───────────────────────────────────────────────
function XeroLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#13B5EA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 22,
        fontWeight: 900,
        fontStyle: "italic",
        fontFamily: "Georgia, serif",
      }}
    >
      x
    </div>
  );
}

// ── eBay logo ───────────────────────────────────────────────
function EbayLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#fff",
        border: `1px solid ${COLORS.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 15,
        fontWeight: 900,
        letterSpacing: "-0.5px",
      }}
    >
      <span style={{ color: "#E53238" }}>e</span>
      <span style={{ color: "#0064D2" }}>B</span>
      <span style={{ color: "#F5AF02" }}>a</span>
      <span style={{ color: "#86B817" }}>y</span>
    </div>
  );
}

// ── NHTSA logo ──────────────────────────────────────────────
function NhtsaLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#1E3A5F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Shield size={22} color="#fff" />
    </div>
  );
}

// ── Claude logo ─────────────────────────────────────────────
function ClaudeLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Sparkles size={22} color="#fff" />
    </div>
  );
}

// ── Twilio logo ─────────────────────────────────────────────
function TwilioLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#F22F46",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 16,
        fontWeight: 900,
        letterSpacing: "-0.5px",
      }}
    >
      ~
    </div>
  );
}

// ── QuickBooks logo ─────────────────────────────────────────
function QuickBooksLogo() {
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 10,
        background: "#2CA01C",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontSize: 14,
        fontWeight: 900,
      }}
    >
      QB
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
function ShopProfileTab() {
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

// ── Integrations tab ────────────────────────────────────────
function IntegrationsTab() {
  return (
    <div>
      <SectionHeader
        title="Integrations"
        subtitle="Connected services powering WrenchIQ"
      />

      {/* Summary bar */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: "Connected", count: 2, color: COLORS.success, bg: "#DCFCE7" },
          { label: "Active", count: 2, color: "#6D28D9", bg: "#EDE9FE" },
          { label: "Available", count: 2, color: COLORS.textSecondary, bg: "#F3F4F6" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: item.bg,
              borderRadius: 10,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 800, color: item.color }}>
              {item.count}
            </span>
            <span style={{ fontSize: 13, fontWeight: 500, color: item.color }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 16,
        }}
      >
        <IntegrationCard
          logo={<XeroLogo />}
          name="Xero Accounting"
          status="connected"
          lines={[
            "Syncing invoices, payments, P&L",
            "Last sync: 2 minutes ago",
          ]}
          actionLabel="Disconnect"
          actionVariant="gray"
        />

        <IntegrationCard
          logo={<EbayLogo />}
          name="eBay Motors"
          status="connected"
          lines={[
            "Parts sourcing & pricing — tilak@predii.com",
            "Compatible parts auto-detected via VIN",
          ]}
          actionLabel="Manage"
          actionVariant="manage"
        />

        <IntegrationCard
          logo={<NhtsaLogo />}
          name="NHTSA Vehicle Data"
          status="active"
          lines={[
            "VIN decoder, TSB lookup, Recall alerts",
            "Free API — no authentication required",
            "52 VIN decodes this month",
          ]}
          actionLabel="View activity"
          actionVariant="view"
        />

        <IntegrationCard
          logo={<ClaudeLogo />}
          name="Claude AI (Anthropic)"
          status="active"
          lines={[
            "Powers all AI features in WrenchIQ",
            "Model: Claude Sonnet 4.6",
            "Usage this month: 1,247 AI analyses",
          ]}
          actionLabel="Configure"
          actionVariant="configure"
        />

        <IntegrationCard
          logo={<TwilioLogo />}
          name="Twilio SMS"
          status="disconnected"
          lines={[
            "Customer notifications & appointment reminders",
          ]}
          actionLabel="Connect"
          actionVariant="primary"
        />

        <IntegrationCard
          logo={<QuickBooksLogo />}
          name="QuickBooks Online"
          status="disconnected"
          lines={[
            "Cloud accounting & bookkeeping",
          ]}
          note="Use Xero instead (already connected)"
          actionLabel="Connect"
          actionVariant="disabled"
        />
      </div>
    </div>
  );
}

// ── AI Settings tab ─────────────────────────────────────────
function AISettingsTab() {
  const [selectedModel, setSelectedModel] = useState("sonnet");
  const [showReasoning, setShowReasoning] = useState(true);
  const [features, setFeatures] = useState({
    dvi: true,
    tsb: true,
    partsMargin: true,
    customerComms: true,
    recalls: true,
    aiBooking: true,
    predictive: false,
  });

  const toggleFeature = (key) => {
    if (key === "predictive") return; // coming soon
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const featureList = [
    { key: "dvi", label: "DVI photo analysis", description: "AI-powered inspection photo analysis with confidence scores" },
    { key: "tsb", label: "TSB cross-reference", description: "Auto-match vehicles to Technical Service Bulletins" },
    { key: "partsMargin", label: "Parts margin optimization", description: "AI suggests optimal pricing to hit margin targets" },
    { key: "customerComms", label: "Customer communication drafting", description: "Generate professional messages and estimate explanations" },
    { key: "recalls", label: "Recall alerts (NHTSA)", description: "Automatically flag open recalls on check-in" },
    { key: "aiBooking", label: "AI appointment booking (customer chat)", description: "AI handles customer booking via chat interface" },
    { key: "predictive", label: "Predictive maintenance scheduling", description: "Proactively schedule services based on vehicle patterns", tag: "Coming Soon" },
  ];

  return (
    <div>
      <SectionHeader
        title="AI Settings"
        subtitle="Configure Claude AI behavior across WrenchIQ"
      />

      {/* Model selection */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 14,
          }}
        >
          AI Model
        </div>

        {[
          {
            id: "sonnet",
            label: "Claude Sonnet 4.6",
            sub: "Recommended — best balance of speed and intelligence",
            badge: "Recommended",
          },
          {
            id: "haiku",
            label: "Claude Haiku 4.5",
            sub: "Faster, less detailed — lower cost per analysis",
            badge: "Faster",
          },
        ].map((model) => (
          <div
            key={model.id}
            onClick={() => setSelectedModel(model.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 10,
              border: `2px solid ${selectedModel === model.id ? "#7C3AED" : COLORS.border}`,
              background: selectedModel === model.id ? "#FAF5FF" : "#fff",
              cursor: "pointer",
              marginBottom: 10,
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                border: `2px solid ${selectedModel === model.id ? "#7C3AED" : COLORS.textMuted}`,
                background: selectedModel === model.id ? "#7C3AED" : "transparent",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {selectedModel === model.id && (
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#fff",
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
                  {model.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: selectedModel === model.id ? "#EDE9FE" : COLORS.borderLight,
                    color: selectedModel === model.id ? "#6D28D9" : COLORS.textSecondary,
                    padding: "2px 8px",
                    borderRadius: 10,
                  }}
                >
                  {model.badge}
                </span>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 2 }}>
                {model.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* AI Features toggles */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "0 20px",
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            padding: "16px 0 0",
          }}
        >
          AI Features
        </div>
        {featureList.map((f) => (
          <ToggleRow
            key={f.key}
            label={f.label}
            description={f.description}
            enabled={features[f.key]}
            onToggle={() => toggleFeature(f.key)}
            disabled={f.key === "predictive"}
            tag={f.tag}
          />
        ))}
        <div style={{ height: 4 }} />
      </div>

      {/* Reasoning transparency */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: "0 20px",
          marginBottom: 20,
        }}
      >
        <ToggleRow
          label="AI reasoning transparency"
          description='Show chain-of-thought reasoning in the UI ("Why did AI say this?")'
          enabled={showReasoning}
          onToggle={() => setShowReasoning((v) => !v)}
        />
      </div>

      {/* Attribution */}
      <div
        style={{
          background: "linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)",
          border: "1px solid #DDD6FE",
          borderRadius: 12,
          padding: 16,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <ClaudeLogo />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#4C1D95" }}>
            Powered by Claude Sonnet 4.6 — Anthropic
          </div>
          <div style={{ fontSize: 12, color: "#6D28D9" }}>
            Industry-leading AI for automotive service intelligence
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Team tab ────────────────────────────────────────────────
function TeamTab() {
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
function NotificationsTab() {
  const [notifs, setNotifs] = useState({
    roComplete: true,
    estimateApproved: true,
    paymentReceived: true,
    recallAlert: true,
    lowParts: false,
    dailySummary: true,
    aiInsights: true,
    appointmentReminder: true,
  });

  const toggle = (key) => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));

  const items = [
    { key: "roComplete", label: "Repair order completed", description: "Alert when a job is marked complete" },
    { key: "estimateApproved", label: "Estimate approved by customer", description: "Alert when customer approves or declines" },
    { key: "paymentReceived", label: "Payment received (Xero)", description: "Alert when invoice is paid in Xero" },
    { key: "recallAlert", label: "Recall alerts (NHTSA)", description: "Alert when a checked-in vehicle has open recalls" },
    { key: "lowParts", label: "Low parts inventory", description: "Alert when frequently ordered parts run low" },
    { key: "dailySummary", label: "Daily performance summary", description: "EOD revenue, RO count, and bay utilization recap" },
    { key: "aiInsights", label: "AI insights & recommendations", description: "Proactive AI suggestions throughout the day" },
    { key: "appointmentReminder", label: "Appointment reminders (SMS)", description: "Send reminders to customers via Twilio SMS" },
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

// ── Billing tab ─────────────────────────────────────────────
function BillingTab() {
  return (
    <div>
      <SectionHeader title="Billing" subtitle="WrenchIQ subscription and usage" />

      {/* Plan card */}
      <div
        style={{
          background: "linear-gradient(135deg, #0D3B45 0%, #1A5C6B 100%)",
          borderRadius: 12,
          padding: 24,
          color: "#fff",
          marginBottom: 20,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -30,
            right: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />
        <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.7, letterSpacing: "0.5px", marginBottom: 6 }}>
          CURRENT PLAN
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
          WrenchIQ Pro
        </div>
        <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>
          All AI features · Unlimited repair orders · Priority support
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>$299</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>per month</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>1,247</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>AI analyses used</div>
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Feb 27</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>next billing date</div>
          </div>
        </div>
      </div>

      {/* Usage breakdown */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 14,
          }}
        >
          Usage This Month
        </div>
        {[
          { label: "DVI photo analyses", used: 418, total: "Unlimited" },
          { label: "TSB cross-references", used: 312, total: "Unlimited" },
          { label: "Customer messages drafted", used: 189, total: "Unlimited" },
          { label: "Repair orders processed", used: 328, total: "Unlimited" },
          { label: "VIN decodes (NHTSA)", used: 52, total: "Unlimited" },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 0",
              borderBottom: `1px solid ${COLORS.border}`,
            }}
          >
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.label}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>
                {item.used}
              </span>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>/ {item.total}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Payment method */}
      <div
        style={{
          background: "#fff",
          border: `1px solid ${COLORS.border}`,
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 14,
          }}
        >
          Payment Method
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 28,
              background: "#1A1F71",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
            }}
          >
            VISA
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: COLORS.textPrimary }}>
              Visa ending in 4242
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>Expires 09/2027</div>
          </div>
          <button
            style={{
              marginLeft: "auto",
              background: "none",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 500,
              color: COLORS.textSecondary,
              cursor: "pointer",
            }}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main SettingsScreen ─────────────────────────────────────
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("integrations");

  const tabContent = {
    shop: <ShopProfileTab />,
    integrations: <IntegrationsTab />,
    ai: <AISettingsTab />,
    team: <TeamTab />,
    notifications: <NotificationsTab />,
    billing: <BillingTab />,
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100%",
        background: COLORS.bg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left sidebar nav */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          background: "#fff",
          borderRight: `1px solid ${COLORS.border}`,
          padding: "24px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            padding: "0 8px",
            marginBottom: 10,
          }}
        >
          Settings
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 10px",
                borderRadius: 8,
                border: "none",
                background: isActive ? COLORS.primary : "transparent",
                color: isActive ? "#fff" : COLORS.textSecondary,
                cursor: "pointer",
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                textAlign: "left",
                width: "100%",
                transition: "all 0.12s",
              }}
            >
              <Icon size={16} />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 32,
        }}
      >
        <div style={{ maxWidth: 800 }}>
          {tabContent[activeTab]}
        </div>
      </div>
    </div>
  );
}
