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
  History,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { SHOP, technicians, advisors } from "../data/demoData";
import { extractIngEntities } from "../services/ingEntityExtractor";
import { useDemo } from "../context/DemoContext";
import AdminShell from "../components/AdminShell";
import HistoricalROsScreen from "./HistoricalROsScreen";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// ── Nav sections ───────────────────────────────────────────
export const SETTINGS_SECTIONS = [
  {
    id: "learn",
    label: "Learn",
    items: [
      { id: "integrations", label: "Integrations", icon: Link },
      { id: "historicalROs", label: "Historical ROs", icon: History },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    items: [
      { id: "shop", label: "Shop Profile", icon: Building2 },
      { id: "team", label: "Team", icon: Users },
      { id: "notifications", label: "Notifications", icon: Bell },
      { id: "aroMargin", label: "ARO & Margin", icon: Target },
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
            SMS/DMS adapter — read-only feed of the Work-in-Progress Queue and up to 1 year of
            historical repair orders. WrenchIQ never writes back to your system.
          </div>
        </div>
      </div>

      {/* At-a-glance meta */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {[
          { label: "Adapter", value: "Protractor SMS" },
          { label: "Access", value: "Read-only" },
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

// ── Integrations tab ────────────────────────────────────────
export function IntegrationsTab() {
  return (
    <div>
      <SectionHeader
        title="Integrations"
        subtitle="How WrenchIQ connects to your shop's system"
      />

      <div style={{ maxWidth: 640 }}>
        <SmsIntegrationCard />
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

// ── ARO & Margin Tab ─────────────────────────────────────────
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
        title="ARO & Margin"
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

// ── Tribal Knowledge Panel ──────────────────────────────────
export function TribalKnowledgePanel() {
  const { activeShopId } = useDemo();
  const SHOP_ID = activeShopId;
  const LOCAL_STORAGE_KEY = `wrenchiq_tribal_${SHOP_ID}`;
  const [activeSubTab, setActiveSubTab] = useState('objectives');
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

  // Enrich ings in a list and update state
  const enrichAndSet = useCallback(async (raw) => {
    const ings   = raw.filter(n => n.noteType === 'ing');
    const others = raw.filter(n => n.noteType !== 'ing');
    const enriched = await extractIngEntities(ings).catch(() => ings);
    setNotes([...others, ...enriched]);
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
  const typeFilter = activeSubTab === 'ings' ? isIngNote : isObj;
  const isIng = activeSubTab === 'ings';

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

    // For ings: run entity extraction immediately so the badge appears
    if (created.noteType === 'ing') {
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
    // For ings: use LLM-extracted entityData label; for objectives: use triggerType label
    const isIngNote = note.noteType === 'ing';
    const trig = isIngNote && note.entityData
      ? { label: note.entityData.displayLabel || 'Any Vehicle', color: '#7C3AED', bg: '#EDE9FE' }
      : triggerLabel(note.triggerType);
    const disc = isIngNote && note.entityData?.discount;
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
          + {isIng ? 'New ing' : 'New Objective'}
        </button>
      </div>

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:20, background:'#F3F4F6', borderRadius:8, padding:3, width:'fit-content' }}>
        {[
          { id:'objectives', label:'Objectives' },
          { id:'ings',       label:'ings — Don\'t Forget' },
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

      {isIng && (
        <div style={{ background:'#FFF7ED', border:'1px solid #FED7AA', borderRadius:8, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#92400E' }}>
          <strong>ings</strong> are automatic reminders shown in the WrenchIQ overlay when an RO is open. They prompt advisors and techs to add commonly forgotten line items — fees, parts, or services.
        </div>
      )}

      {showNewForm && (
        <div style={{ background:'#F9FAFB', border:'1px solid #E5E7EB', borderRadius:8,
          padding:16, marginBottom:20 }}>
          <textarea
            placeholder={isIng
              ? 'e.g. Add waste disposal fee to every oil change'
              : 'e.g. Push cabin air filter to all customers this month'}
            value={newNote.note} onChange={e => setNewNote({...newNote, note: e.target.value})}
            style={{ width:'100%', border:'1px solid #D1D5DB', borderRadius:4, padding:8,
              fontSize:13, resize:'vertical', minHeight:70, marginBottom: isIng ? 4 : 10, boxSizing:'border-box' }} />
          {isIng && (
            <div style={{ fontSize:11, color:'#6B7280', marginBottom:10, display:'flex', alignItems:'center', gap:4 }}>
              <span style={{ color:'#7C3AED', fontWeight:700 }}>AI</span>
              WrenchIQ will automatically extract conditions (vehicle make/model, mileage, promotion type) from your text.
            </div>
          )}
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
            <input type="date" placeholder="Expiry (leave blank = ongoing)"
              value={newNote.expiresAt} onChange={e => setNewNote({...newNote, expiresAt: e.target.value})}
              style={{ border:'1px solid #D1D5DB', borderRadius:4, padding:'6px 8px', fontSize:13 }} />
            <button onClick={addNote}
              style={{ background:'#FF6B35', color:'#fff', border:'none', borderRadius:6,
                padding:'6px 16px', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {isIng ? 'Add ing' : 'Add Objective'}
            </button>
            <button onClick={() => setShowNewForm(false)}
              style={{ background:'#F3F4F6', border:'none', borderRadius:6,
                padding:'6px 12px', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {activeNotes.length === 0 && !showNewForm && (
        <div style={{ textAlign:'center', padding:'32px 0', color:'#9CA3AF', fontSize:14 }}>
          {isIng ? 'No ings yet. Add your first reminder above.' : 'No active objectives yet. Add your first above.'}
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
    </div>
  );
}

// ── Main SettingsScreen ─────────────────────────────────────
export default function SettingsScreen() {
  const [activeTab, setActiveTab] = useState("integrations");

  const tabContent = {
    shop: <ShopProfileTab />,
    integrations: <IntegrationsTab />,
    historicalROs: <HistoricalROsScreen />,
    team: <TeamTab />,
    notifications: <NotificationsTab />,
    aroMargin: <AROMarginTab />,
    tribal: <TribalKnowledgePanel />,
  };

  return (
    <AdminShell
      sections={SETTINGS_SECTIONS}
      activeId={activeTab}
      onSelect={setActiveTab}
      content={tabContent[activeTab]}
    />
  );
}
