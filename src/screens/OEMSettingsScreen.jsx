import { useState } from "react";
import {
  Settings,
  Check,
  AlertCircle,
  Zap,
  Users,
  Bell,
  FileText,
  ChevronDown,
  Database,
  Globe,
  BookOpen,
  Cpu,
  Activity,
  Shield,
  Tag,
  Server,
  Layers,
  Wrench,
  Bot,
  ArrowRight,
} from "lucide-react";
import { COLORS } from "../theme/colors";
import { OEM_DEALER, OEM_ADVISORS, OP_CODES } from "../data/oemDemoData";

// ── Nav config ────────────────────────────────────────────────
const TABS = [
  { id: "edition",     label: "Edition",          icon: Settings },
  { id: "dms",         label: "DMS Credentials",  icon: Zap },
  { id: "makes",       label: "OEM Makes",         icon: Check },
  { id: "compliance",  label: "Compliance Rules",  icon: AlertCircle },
  { id: "team",        label: "Team",              icon: Users },
  { id: "notify",      label: "Notifications",     icon: Bell },
  { id: "audit",       label: "Audit Log",         icon: FileText },
  { id: "admin",       label: "Admin",             icon: Database },
];

const ALL_MAKES = ["Toyota", "Ford", "GM/Chevrolet", "Honda", "Hyundai", "Nissan", "BMW", "Mercedes"];

const AUDIT_ENTRIES = [
  { action: "DMS Push — RO-2861 to CDK",                  user: "Amy Chen",      time: "March 21  10:14 AM", detail: "" },
  { action: "Compliance Override — RO-2798",               user: "Carlos Reyes",  time: "March 17  2:31 PM",  detail: "Reason: \"Customer needed RO same day\"" },
  { action: "Settings Change — Compliance threshold updated", user: "Ryan Cho",   time: "March 15  9:08 AM",  detail: "" },
  { action: "DMS Push — RO-2791 to CDK",                  user: "Jessica Torres",time: "March 15  11:22 AM", detail: "" },
  { action: "User Added — Priya Nair",                     user: "Ryan Cho",      time: "March 1  8:45 AM",   detail: "" },
];

// ── Small helpers ─────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: COLORS.textMuted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 10,
      }}
    >
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value, mono }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
        {label}
      </label>
      <div
        style={{
          background: COLORS.borderLight,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: 13,
          color: COLORS.textPrimary,
          fontFamily: mono ? "monospace" : "inherit",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function ConnectedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#DCFCE7",
        color: "#15803D",
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#15803D", display: "inline-block" }} />
      Connected
    </span>
  );
}

function NotConnectedBadge() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: COLORS.borderLight,
        color: COLORS.textMuted,
        borderRadius: 20,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: COLORS.textMuted, display: "inline-block" }} />
      Not Connected
    </span>
  );
}

function Btn({ label, variant = "primary", onClick }) {
  const styles = {
    primary: { bg: COLORS.primary, color: "#fff", border: "none" },
    success: { bg: COLORS.success, color: "#fff", border: "none" },
    danger:  { bg: "#fff", color: COLORS.danger, border: `1px solid ${COLORS.danger}` },
    outline: { bg: "#fff", color: COLORS.primary, border: `1px solid ${COLORS.primary}` },
  };
  const s = styles[variant] || styles.primary;
  return (
    <button
      onClick={onClick}
      style={{
        background: s.bg,
        color: s.color,
        border: s.border,
        borderRadius: 7,
        padding: "8px 16px",
        fontSize: 12,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

// ── Tab Contents ──────────────────────────────────────────────

function TabEdition() {
  return (
    <div>
      <div
        style={{
          background: COLORS.primary,
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>WrenchIQ Edition</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", letterSpacing: "-0.5px" }}>
            WrenchIQ-OEM
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>
            Locked · Managed by Predii account provisioning
          </div>
        </div>
        <div
          style={{
            marginLeft: "auto",
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 14px",
            fontSize: 12,
            fontFamily: "monospace",
            color: "#fff",
            fontWeight: 700,
          }}
        >
          edition=OEM
        </div>
      </div>

      <SectionLabel>Dealer Information</SectionLabel>
      <ReadOnlyField label="Dealer Name" value={OEM_DEALER.name} />
      <ReadOnlyField label="Dealer Code" value={OEM_DEALER.dealerCode} mono />
      <ReadOnlyField label="Address" value={OEM_DEALER.address} />
      <ReadOnlyField label="DMS System" value={OEM_DEALER.dms} />

      <SectionLabel>API Edition Field</SectionLabel>
      <div
        style={{
          background: "#1E293B",
          borderRadius: 8,
          padding: "14px 18px",
          fontFamily: "monospace",
          fontSize: 13,
          color: "#7DD3FC",
          marginBottom: 14,
        }}
      >
        <span style={{ color: "#94A3B8" }}>// All API requests include:</span>
        {"\n"}
        <span style={{ color: "#F8FAFC" }}>{"{ "}</span>
        <span style={{ color: "#86EFAC" }}>"edition"</span>
        <span style={{ color: "#F8FAFC" }}>: </span>
        <span style={{ color: "#FCA5A5" }}>"OEM"</span>
        <span style={{ color: "#F8FAFC" }}>{" }"}</span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "#FFF7ED",
          border: `1px solid #FED7AA`,
          borderRadius: 8,
          padding: "12px 14px",
          fontSize: 12,
          color: "#92400E",
        }}
      >
        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
        This setting is managed by Predii account provisioning. Contact your Predii account manager to change your edition.
      </div>
    </div>
  );
}

function TabDMS() {
  const [cdkKey, setCdkKey] = useState("sk-cdk-****-****-****-7f2a");
  const [cdkCode, setCdkCode] = useState(OEM_DEALER.dealerCode);
  const [testResult, setTestResult] = useState(null);

  function handleTest() {
    setTestResult("testing");
    setTimeout(() => setTestResult("ok"), 1200);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* CDK */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>CDK Global</div>
          <ConnectedBadge />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Dealer Code</label>
          <input
            value={cdkCode}
            onChange={(e) => setCdkCode(e.target.value)}
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: COLORS.textPrimary,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>API Key</label>
          <input
            value={cdkKey}
            onChange={(e) => setCdkKey(e.target.value)}
            type="password"
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              color: COLORS.textPrimary,
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "monospace",
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={handleTest}
            style={{
              background: testResult === "ok" ? COLORS.success : COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 7,
              padding: "8px 16px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {testResult === "testing" ? "Testing…" : testResult === "ok" ? "Connected ✓" : "Test Connection"}
          </button>
          <Btn label="Disconnect" variant="danger" />
          <span style={{ fontSize: 12, color: COLORS.textMuted }}>Last synced: March 21, 2026  9:42 AM</span>
        </div>
      </div>

      {/* R&R */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Reynolds & Reynolds</div>
          <NotConnectedBadge />
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Dealer Number</label>
            <input
              placeholder="Enter dealer number"
              style={{
                width: "100%",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 13,
                color: COLORS.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>Credentials</label>
            <input
              placeholder="Enter API credentials"
              type="password"
              style={{
                width: "100%",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "8px 12px",
                fontSize: 13,
                color: COLORS.textPrimary,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>
        <Btn label="Connect" variant="primary" />
      </div>

      {/* Dealertrack */}
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>Dealertrack</div>
          <NotConnectedBadge />
        </div>
        <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 14 }}>
          Connect via secure OAuth 2.0 authorization flow.
        </div>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            color: COLORS.primary,
            border: `1.5px solid ${COLORS.primary}`,
            borderRadius: 7,
            padding: "9px 18px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          <Zap size={14} /> Authorize Dealertrack
        </button>
      </div>

      <div style={{ textAlign: "right" }}>
        <button
          style={{
            background: "none",
            border: "none",
            color: COLORS.primary,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          DMS Push History →
        </button>
      </div>
    </div>
  );
}

function TabMakes() {
  const [selected, setSelected] = useState(new Set(OEM_DEALER.oemMakes));

  function toggle(make) {
    const next = new Set(selected);
    if (next.has(make)) next.delete(make);
    else next.add(make);
    setSelected(next);
  }

  return (
    <div>
      <SectionLabel>Select OEM Makes</SectionLabel>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "16px 20px",
          marginBottom: 20,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {ALL_MAKES.map((make) => {
          const checked = selected.has(make);
          return (
            <label
              key={make}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: 6,
                background: checked ? "#F0F7F9" : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(make)}
                style={{ width: 16, height: 16, cursor: "pointer", accentColor: COLORS.primary }}
              />
              <span style={{ fontSize: 14, color: COLORS.textPrimary, fontWeight: checked ? 600 : 400 }}>
                {make}
              </span>
            </label>
          );
        })}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#EFF6FF",
          border: `1px solid #BFDBFE`,
          borderRadius: 8,
          padding: "12px 16px",
          fontSize: 13,
          color: "#1D4ED8",
        }}
      >
        <Check size={14} />
        Op code databases loaded for:{" "}
        <strong>{[...selected].join(", ") || "none"}</strong> — last updated March 15, 2026
      </div>
    </div>
  );
}

function TabCompliance() {
  const [rules, setRules] = useState({
    minComplaintWords: 15,
    minCauseWords: 20,
    minCorrectionWords: 20,
    preAuthThreshold: 1000,
    highRejectionOpCodes: "0420B, 4750C",
  });
  const [saved, setSaved] = useState(false);

  function update(key, val) {
    setRules((r) => ({ ...r, [key]: val }));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function NumberInput({ label, field, min, max, unit }) {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
          {label}
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <input
            type="number"
            value={rules[field]}
            min={min}
            max={max}
            onChange={(e) => update(field, Number(e.target.value))}
            style={{
              width: 88,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "7px 10px",
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.textPrimary,
              outline: "none",
            }}
          />
          {unit && <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{unit}</span>}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 18,
        }}
      >
        <SectionLabel>Compliance Rules — Toyota</SectionLabel>
      </div>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <NumberInput label="Min complaint word count" field="minComplaintWords" min={5} max={100} unit="words" />
        <NumberInput label="Min cause word count" field="minCauseWords" min={5} max={100} unit="words" />
        <NumberInput label="Min correction word count" field="minCorrectionWords" min={5} max={100} unit="words" />
        <NumberInput label="Pre-auth threshold" field="preAuthThreshold" min={0} unit="$ (dollars)" />

        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, color: COLORS.textSecondary, display: "block", marginBottom: 4 }}>
            High-rejection op codes (comma separated)
          </label>
          <textarea
            value={rules.highRejectionOpCodes}
            onChange={(e) => update("highRejectionOpCodes", e.target.value)}
            rows={2}
            style={{
              width: "100%",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 6,
              padding: "8px 12px",
              fontSize: 13,
              fontFamily: "monospace",
              color: COLORS.textPrimary,
              outline: "none",
              resize: "vertical",
              boxSizing: "border-box",
            }}
          />
        </div>

        <button
          onClick={handleSave}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: saved ? COLORS.success : COLORS.primary,
            color: "#fff",
            border: "none",
            borderRadius: 8,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          {saved ? <><Check size={14} /> Rules Saved</> : "Save Rules"}
        </button>
      </div>
    </div>
  );
}

function TabTeam() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <SectionLabel>Team Members</SectionLabel>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn label="+ Add User" variant="primary" />
        </div>
      </div>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.borderLight }}>
              {["Team Member", "Role", "Compliance", "Approval Rate", ""].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.textMuted,
                    padding: "10px 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {OEM_ADVISORS.map((adv, i) => {
              const compColor =
                adv.complianceScore >= 85 ? COLORS.success :
                adv.complianceScore >= 70 ? COLORS.warning : COLORS.danger;
              const approveColor =
                adv.approvalRate >= 90 ? COLORS.success :
                adv.approvalRate >= 80 ? COLORS.warning : COLORS.danger;
              return (
                <tr key={adv.id} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: COLORS.primary,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {adv.initials}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>
                        {adv.name}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textSecondary }}>
                    {adv.role}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: compColor }}>
                      {adv.complianceScore}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: approveColor }}>
                      {adv.approvalRate}%
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <Btn label="Remove" variant="danger" />
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

function TabNotifications() {
  const [checks, setChecks] = useState({
    approvalDrop: true,
    complianceDrop: true,
    weeklyReport: false,
    warrantyRejection: true,
  });
  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleCheck(key) {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  }

  const checkItems = [
    { key: "approvalDrop",     label: "Alert me when approval rate drops below 80%" },
    { key: "complianceDrop",   label: "Alert when compliance score drops below 70%" },
    { key: "weeklyReport",     label: "Weekly Fixed Ops report" },
    { key: "warrantyRejection",label: "New warranty rejection received" },
  ];

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function Toggle({ on, onToggle }) {
    return (
      <button
        onClick={onToggle}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          border: "none",
          background: on ? COLORS.primary : COLORS.border,
          position: "relative",
          cursor: "pointer",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 3,
            left: on ? 23 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            transition: "left 0.2s",
          }}
        />
      </button>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <SectionLabel>Alert Triggers</SectionLabel>
        {checkItems.map((item) => (
          <label
            key={item.key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 12,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={checks[item.key]}
              onChange={() => toggleCheck(item.key)}
              style={{ width: 16, height: 16, cursor: "pointer", accentColor: COLORS.primary }}
            />
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>{item.label}</span>
          </label>
        ))}
      </div>

      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          padding: "18px 20px",
        }}
      >
        <SectionLabel>Notification Channels</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>Email</span>
            <Toggle on={emailOn} onToggle={() => setEmailOn((v) => !v)} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 13, color: COLORS.textPrimary }}>SMS</span>
            <Toggle on={smsOn} onToggle={() => setSmsOn((v) => !v)} />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: saved ? COLORS.success : COLORS.primary,
          color: "#fff",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontWeight: 700,
          cursor: "pointer",
          alignSelf: "flex-start",
          transition: "background 0.2s",
        }}
      >
        {saved ? <><Check size={14} /> Saved</> : "Save Notification Settings"}
      </button>
    </div>
  );
}

function TabAuditLog() {
  const actionColor = (action) => {
    if (action.startsWith("DMS Push")) return { bg: "#EFF6FF", color: "#1D4ED8" };
    if (action.startsWith("Compliance Override")) return { bg: "#FEF3C7", color: "#92400E" };
    if (action.startsWith("Settings Change")) return { bg: "#F0FDF4", color: "#15803D" };
    if (action.startsWith("User Added")) return { bg: "#F5F3FF", color: "#5B21B6" };
    return { bg: COLORS.borderLight, color: COLORS.textSecondary };
  };

  return (
    <div>
      <SectionLabel>Audit Log</SectionLabel>
      <div
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: 10,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: COLORS.borderLight }}>
              {["Action", "User", "Timestamp", "Details"].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: "left",
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLORS.textMuted,
                    padding: "10px 16px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUDIT_ENTRIES.map((entry, i) => {
              const c = actionColor(entry.action);
              return (
                <tr key={i} style={{ borderTop: i === 0 ? "none" : `1px solid ${COLORS.borderLight}` }}>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        background: c.bg,
                        color: c.color,
                        borderRadius: 6,
                        padding: "3px 10px",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, color: COLORS.textPrimary }}>
                    {entry.user}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap" }}>
                    {entry.time}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 12, color: COLORS.textSecondary, fontStyle: entry.detail ? "italic" : "normal" }}>
                    {entry.detail || "—"}
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

// ── Admin Tab ─────────────────────────────────────────────────

const DATA_SOURCES = [
  {
    id: "nhtsa-vin",
    name: "NHTSA vPIC — VIN Decoder",
    icon: Globe,
    color: "#2563EB",
    endpoint: "vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/{VIN}",
    status: "demo",
    cache: "30-day cache per VIN",
    description: "Decodes VIN → YMME, engine code, trim, plant, country of origin. First call in every 3C pipeline.",
    dataOut: ["year", "make", "model", "trim", "engine_code", "plant_city", "origin"],
    agent: "VIN Intelligence Agent",
  },
  {
    id: "nhtsa-recalls",
    name: "NHTSA Recalls",
    icon: Globe,
    color: "#DC2626",
    endpoint: "api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}",
    status: "live",
    cache: "24-hour cache per YMME",
    description: "Live NHTSA recall feed — active in 3C Story Writer. On RO selection, fetches open recall campaigns for the vehicle's YMME. Auto-extracts DTCs, component names, and part numbers from recall Summary, Consequence, and Remedy text to pre-populate the narrative. No API key required.",
    dataOut: ["recall_campaign", "recall_title", "component", "dtcs_extracted", "parts_extracted", "remedy_text", "is_safety_recall"],
    agent: "TSB / Recall Agent",
  },
  {
    id: "tsb-labor",
    name: "TSB & Labor Operations",
    icon: BookOpen,
    color: "#D97706",
    endpoint: "Pluggable — Mitchell1 / ALLDATA / MOTOR (per-tenant config)",
    status: "not-configured",
    cache: "Static refresh per TSB revision",
    description: "Technical Service Bulletins and OEM labor operation codes keyed by YMME + DTC. Powers TSB auto-match and flat-rate hour suggestions.",
    dataOut: ["tsb_number", "tsb_title", "dtc_xref", "labor_op_code", "flat_rate_hrs", "parts_xref"],
    agent: "TSB/Recall Agent",
  },
  {
    id: "plate-lookup",
    name: "License Plate Lookup",
    icon: Tag,
    color: "#7C3AED",
    endpoint: "Pluggable — DMV Direct / NLETS / Plate2VIN (per-state licensing)",
    status: "not-configured",
    cache: "No cache — real-time lookup",
    description: "Resolves CA / US license plate to VIN for drive-in customers without appointment. Pluggable adapter per provider.",
    dataOut: ["vin", "state", "plate", "expiry"],
    agent: "VIN Intelligence Agent",
  },
  {
    id: "predii-spec",
    name: "Predii Normalized Content",
    icon: Cpu,
    color: "#0D3B45",
    endpoint: "Internal — api.predii.com/v2/normalized/{vin_pattern}",
    status: "demo",
    cache: "Permanent — versioned by model year + Dealer ID",
    description: "Predii's proprietary normalized content layer. Aggregates and normalizes: historical ROs by dealership, factory maintenance schedules, and manufacturer communications (Recalls, TSBs). Components, Part Numbers, Labor Op Codes, and DTCs are extracted and normalized by Predii per dealership — enabling VIN-exact matching across the full 3C pipeline.",
    dataOut: ["normalized_ros", "maintenance_schedule", "tsb_catalog", "recall_registry", "components", "part_numbers", "labor_op_codes", "dtc_map"],
    agent: "VIN Intelligence Agent + DTC Enrichment Agent",
  },
  {
    id: "predii-score",
    name: "Predii Score Engine",
    icon: Activity,
    color: "#16A34A",
    endpoint: "Internal — api.predii.com/v2/score",
    status: "demo",
    cache: "Real-time — per narrative generation",
    description: "3-layer scoring engine: Layer 1 Universal Base Score (6 dimensions), Layer 2 OEM Modifier (per-make compliance rules), Layer 3 Claim Context Modifier (warranty vs recall vs customer pay). Gate score ≥ 90 required for DMS push.",
    dataOut: ["predii_score", "layer1_breakdown", "layer2_oem_modifier", "layer3_context_modifier", "compliance_flags"],
    agent: "Narrative Assembly Agent",
  },
];

const STATUS_CONFIG = {
  "demo":           { label: "Demo — Synthetic Data", bg: "#EFF6FF", color: "#1D4ED8", border: "#BFDBFE" },
  "not-configured": { label: "Not Configured",        bg: "#FEF3C7", color: "#92400E", border: "#FDE68A" },
  "live":           { label: "Live",                  bg: "#F0FDF4", color: "#15803D", border: "#BBF7D0" },
};

function TabAdmin({ showWrenchIQBranding = true, onToggleBranding }) {
  const [activeOpMake, setActiveOpMake] = useState(Object.keys(OP_CODES)[0]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Header banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #0D2A3A 0%, #0D3B45 100%)",
        borderRadius: 12, padding: "18px 24px",
        display: "flex", alignItems: "center", gap: 14,
      }}>
        <Database size={22} color="#FF6B35" />
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", marginBottom: 3 }}>
            Admin — Data Sources & Op Code Registry
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            Shows how real-world data providers plug into the 3C pipeline when live integrations are activated. Demo mode uses synthetic data for all sources.
          </div>
        </div>
      </div>

      {/* ── Branding Control ── */}
      <div>
        <SectionLabel>Branding</SectionLabel>
        <div style={{
          background: "#fff",
          border: "1px solid #E5E7EB",
          borderRadius: 10,
          padding: "18px 20px",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 4 }}>
              WrenchIQ.ai Branding
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary, maxWidth: 480 }}>
              When enabled, the WrenchIQ.ai wordmark is displayed throughout the shell. When disabled, the interface shows <strong>PrediiPowered™</strong> instead — suitable for white-label or co-branded deployments.
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <button
              onClick={() => onToggleBranding && onToggleBranding(!showWrenchIQBranding)}
              style={{
                width: 48, height: 26, borderRadius: 13, border: "none", cursor: "pointer",
                background: showWrenchIQBranding ? "#FF6B35" : "#D1D5DB",
                position: "relative", transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute", top: 3,
                left: showWrenchIQBranding ? 26 : 4,
                width: 20, height: 20, borderRadius: 10,
                background: "#fff",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                transition: "left 0.2s",
              }} />
            </button>
            <span style={{ fontSize: 10, fontWeight: 700, color: showWrenchIQBranding ? "#FF6B35" : COLORS.textMuted }}>
              {showWrenchIQBranding ? "WrenchIQ.ai" : "PrediiPowered™"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Architecture Diagram ── */}
      <div>
        <SectionLabel>Platform Architecture</SectionLabel>
        <div style={{
          background: "linear-gradient(160deg, #0D1F2D 0%, #0D2A3A 60%, #111827 100%)",
          borderRadius: 14,
          padding: "28px 24px 24px",
          overflowX: "auto",
        }}>
          {/* Title row */}
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 20, textAlign: "center" }}>
            WrenchIQ · AI-Native Warranty Intelligence Platform
          </div>

          {/* Diagram row */}
          <div style={{ display: "flex", alignItems: "stretch", gap: 0, minWidth: 820 }}>

            {/* ── Column 1: Data Sources ── */}
            <div style={{ flex: "0 0 170px" }}>
              <div style={{
                height: "100%", background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 10, padding: "14px 14px 16px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(107,114,128,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Server size={13} color="#9CA3AF" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#9CA3AF", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    Data Sources
                  </span>
                </div>
                {[
                  { label: "NHTSA Recalls",      dot: "#EF4444", sub: "Live API" },
                  { label: "OEM Manufacturer",   dot: "#3B82F6", sub: "TSBs · Specs" },
                  { label: "Dealer RO History",  dot: "#10B981", sub: "Historical ROs" },
                  { label: "DMS Systems",        dot: "#8B5CF6", sub: "CDK · R&R · DT" },
                  { label: "VIN / NHTSA VPIC",   dot: "#F59E0B", sub: "Vehicle decode" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "flex-start", gap: 7, marginBottom: 9 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, flexShrink: 0, marginTop: 4 }} />
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.75)", lineHeight: 1.3 }}>{s.label}</div>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 1 */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 6px", flexShrink: 0 }}>
              <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
            </div>

            {/* ── Column 2: Predii Normalization ── */}
            <div style={{ flex: "0 0 178px" }}>
              <div style={{
                height: "100%",
                background: "linear-gradient(160deg, rgba(13,59,69,0.7) 0%, rgba(13,59,69,0.4) 100%)",
                border: "1.5px solid rgba(13,180,160,0.35)",
                boxShadow: "0 0 20px rgba(13,180,160,0.08)",
                borderRadius: 10, padding: "14px 14px 16px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(13,59,69,0.6)", border: "1px solid rgba(13,180,160,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Layers size={13} color="#2DD4BF" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#2DD4BF", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    Predii
                  </span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(45,212,191,0.5)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
                  Normalization Layer
                </div>
                {[
                  "DTCs — extracted & coded",
                  "Part numbers — OEM keyed",
                  "Labor op codes — normalized",
                  "Components — classified",
                  "VIN-exact matching",
                  "Factory maintenance sched.",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 7 }}>
                    <Check size={10} color="#2DD4BF" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", lineHeight: 1.35 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 2 */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 6px", flexShrink: 0 }}>
              <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
            </div>

            {/* ── Column 3: MCP / CLI ── */}
            <div style={{ flex: "0 0 158px" }}>
              <div style={{
                height: "100%",
                background: "rgba(37,99,235,0.08)",
                border: "1px solid rgba(37,99,235,0.25)",
                borderRadius: 10, padding: "14px 14px 16px",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 7, background: "rgba(37,99,235,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Cpu size={13} color="#60A5FA" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#60A5FA", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    MCP / CLI
                  </span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(96,165,250,0.5)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10 }}>
                  Access Layer
                </div>
                {[
                  { label: "api.predii.com/v2", sub: "REST · JSON" },
                  { label: "Model Context Protocol", sub: "Agent tool calls" },
                  { label: "CLI Tool Interface", sub: "Direct source access" },
                  { label: "Auth & rate limiting", sub: "Per-tenant keys" },
                ].map((s) => (
                  <div key={s.label} style={{ marginBottom: 9 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>{s.label}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Arrow 3 */}
            <div style={{ display: "flex", alignItems: "center", padding: "0 6px", flexShrink: 0 }}>
              <ArrowRight size={18} color="rgba(255,255,255,0.2)" />
            </div>

            {/* ── Column 4+5: WrenchIQ OEM + Agent Factory stacked ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>

              {/* WrenchIQ OEM */}
              <div style={{
                background: "rgba(255,107,53,0.08)",
                border: "1px solid rgba(255,107,53,0.3)",
                borderRadius: 10, padding: "12px 14px",
                flex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(255,107,53,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Wrench size={12} color="#FF6B35" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#FF6B35", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    WrenchIQ OEM
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {["3C Story Writer", "Fixed Ops Dashboard", "Warranty Analytics", "Tech Bay View", "Dealer Group Hub"].map((f) => (
                    <span key={f} style={{
                      fontSize: 9, fontWeight: 600, color: "#FF6B35",
                      background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)",
                      borderRadius: 4, padding: "2px 7px",
                    }}>{f}</span>
                  ))}
                </div>
              </div>

              {/* Agent Factory */}
              <div style={{
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.3)",
                borderRadius: 10, padding: "12px 14px",
                flex: 1,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 7, background: "rgba(124,58,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bot size={12} color="#A78BFA" />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#A78BFA", letterSpacing: 0.8, textTransform: "uppercase" }}>
                    Agent Factory
                  </span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(167,139,250,0.45)", letterSpacing: 0.4, marginBottom: 8 }}>
                  Autonomous · Chained · Zero-click
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {[
                    { n: 1, label: "VIN Intelligence",   trigger: "on RO open" },
                    { n: 2, label: "TSB / Recall",        trigger: "VIN resolved" },
                    { n: 3, label: "DTC Enrichment",      trigger: "DTC received" },
                    { n: 4, label: "Warranty Context",    trigger: "op code candidate" },
                    { n: 5, label: "Narrative Assembly",  trigger: "all agents done" },
                  ].map((a) => (
                    <div key={a.n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        width: 15, height: 15, borderRadius: 4, flexShrink: 0,
                        background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.3)",
                        fontSize: 8, fontWeight: 800, color: "#A78BFA",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>{a.n}</span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.65)" }}>{a.label}</span>
                      <span style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", marginLeft: "auto" }}>{a.trigger}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Bottom legend */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 16 }}>
            {[
              { dot: "#9CA3AF", label: "External / Public" },
              { dot: "#2DD4BF", label: "Predii Proprietary" },
              { dot: "#60A5FA", label: "Protocol / Interface" },
              { dot: "#FF6B35", label: "Application Layer" },
              { dot: "#A78BFA", label: "AI Agents" },
            ].map((l) => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.dot }} />
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Value Proposition ── */}
      <div>
        <SectionLabel>Key Value Proposition</SectionLabel>

        {/* Headline banner */}
        <div style={{
          background: "linear-gradient(135deg, rgba(255,107,53,0.12) 0%, rgba(124,58,237,0.1) 100%)",
          border: "1.5px solid rgba(255,107,53,0.3)",
          borderRadius: 12, padding: "16px 22px", marginBottom: 14,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: "rgba(255,107,53,0.15)", border: "1px solid rgba(255,107,53,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={18} color="#FF6B35" />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: COLORS.textPrimary, letterSpacing: -0.3, marginBottom: 3 }}>
              Zero keystrokes to a compliant first draft.
            </div>
            <div style={{ fontSize: 12, color: COLORS.textSecondary }}>
              Advisors review and approve — the Agent Factory creates.
            </div>
          </div>
        </div>

        {/* Value prop cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            {
              headline: "Auto-trigger on RO open",
              detail: "No button click — the moment an advisor selects an RO, the full agent pipeline starts automatically.",
              color: "#2563EB",
            },
            {
              headline: "Chained output → input",
              detail: "Each agent's output is the next agent's input. No human passes data between steps — the chain runs to completion.",
              color: "#7C3AED",
            },
            {
              headline: "Self-selecting relevance",
              detail: "TSB / Recall Agent decides which of 10+ open campaigns apply to this VIN and complaint. Advisor never filters.",
              color: "#D97706",
            },
            {
              headline: "Draft delivered before typing",
              detail: "Narrative Assembly produces a compliance-ready 3C story before the advisor has typed a single word.",
              color: "#16A34A",
            },
            {
              headline: "Compliance scored automatically",
              detail: "Predii Score is computed by comparing the generated narrative against OEM rules — not manually assessed.",
              color: "#DC2626",
            },
          ].map((vp, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "flex-start", gap: 14,
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderLeft: `3px solid ${vp.color}`,
              borderRadius: 10, padding: "13px 16px",
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0, marginTop: 1,
                background: `${vp.color}14`, border: `1px solid ${vp.color}33`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: vp.color,
              }}>
                {i + 1}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 3 }}>
                  {vp.headline}
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.55 }}>
                  {vp.detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Configurable Data Sources ── */}
      <div>
        <SectionLabel>Configurable Data Sources</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DATA_SOURCES.map((src) => {
            const Icon = src.icon;
            const st = STATUS_CONFIG[src.status];
            return (
              <div key={src.id} style={{
                background: COLORS.bgCard,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `3px solid ${src.color}`,
                borderRadius: 10, padding: "14px 18px",
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                      background: `${src.color}15`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={15} color={src.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.textPrimary }}>{src.name}</div>
                      <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>Agent: {src.agent}</div>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
                    background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                    borderRadius: 5, padding: "2px 9px",
                  }}>
                    {st.label}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, lineHeight: 1.5 }}>
                  {src.description}
                </div>

                <div style={{
                  background: "#1E293B", borderRadius: 6, padding: "7px 12px",
                  fontFamily: "monospace", fontSize: 11, color: "#7DD3FC", marginBottom: 8,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {src.endpoint}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>Cache: {src.cache} &nbsp;·&nbsp; Outputs:</span>
                  {src.dataOut.map((d) => (
                    <span key={d} style={{
                      fontSize: 10, fontFamily: "monospace",
                      background: COLORS.borderLight, color: COLORS.textSecondary,
                      border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "1px 6px",
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Op Code Registry by OEM ── */}
      <div>
        <SectionLabel>Op Code Registry by OEM</SectionLabel>

        {/* Make tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {Object.keys(OP_CODES).map((make) => (
            <button
              key={make}
              onClick={() => setActiveOpMake(make)}
              style={{
                padding: "5px 14px", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: activeOpMake === make ? COLORS.primary : COLORS.borderLight,
                color: activeOpMake === make ? "#fff" : COLORS.textSecondary,
                transition: "all 0.13s",
              }}
            >
              {make}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{
          border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: "hidden",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ background: COLORS.borderLight, borderBottom: `1px solid ${COLORS.border}` }}>
                {["Op Code", "Description", "Flat Rate Hrs", "Pre-Auth", "Notes"].map((h) => (
                  <th key={h} style={{
                    padding: "10px 14px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, color: COLORS.textMuted,
                    textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(OP_CODES[activeOpMake] || []).map((op, i) => (
                <tr key={op.code} style={{
                  borderBottom: i < OP_CODES[activeOpMake].length - 1 ? `1px solid ${COLORS.border}` : "none",
                  background: i % 2 === 0 ? "#fff" : COLORS.borderLight,
                }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 800, color: COLORS.primary, whiteSpace: "nowrap" }}>
                    {op.code}
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.textPrimary, lineHeight: 1.4 }}>
                    {op.description}
                  </td>
                  <td style={{ padding: "10px 14px", color: COLORS.textSecondary, textAlign: "center", whiteSpace: "nowrap" }}>
                    {op.flatRateHrs} hrs
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "center" }}>
                    {op.preAuthThreshold ? (
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA",
                        borderRadius: 4, padding: "2px 7px",
                      }}>
                        ${op.preAuthThreshold.toLocaleString()}+
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: COLORS.textMuted }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "10px 14px", fontSize: 11, color: COLORS.textMuted, fontStyle: op.notes ? "normal" : "italic" }}>
                    {op.notes || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
          {(OP_CODES[activeOpMake] || []).length} op codes for {activeOpMake} &nbsp;·&nbsp;
          {Object.values(OP_CODES).flat().length} total op codes across {Object.keys(OP_CODES).length} makes &nbsp;·&nbsp;
          Source: Predii Normalized Content (demo data)
        </div>
      </div>

      {/* ── 3C Agent Pipeline ── */}
      <div>
        <SectionLabel>3C Agent Pipeline</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { n: 1, name: "VIN Intelligence Agent",   trigger: "RO opened (VIN present)",      out: "vin_profile, oem_spec, service_history",        color: "#2563EB" },
            { n: 2, name: "TSB / Recall Agent",       trigger: "VIN + complaint available",    out: "tsb_list, recall_campaigns, dtc_xref",         color: "#D97706" },
            { n: 3, name: "DTC Enrichment Agent",     trigger: "Tech DTC input received",      out: "enriched_dtc, freeze_frame, tsb_link",         color: "#7C3AED" },
            { n: 4, name: "Warranty Context Agent",   trigger: "VIN + op code candidate",      out: "coverage_status, labor_op, auth_requirements", color: "#16A34A" },
            { n: 5, name: "Narrative Assembly Agent", trigger: "All sub-agents complete",      out: "3C_draft, predii_score, compliance_flags",     color: "#0D3B45" },
          ].map((a) => (
            <div key={a.n} style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "10px 14px",
              background: COLORS.bgCard,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                background: `${a.color}18`, border: `1px solid ${a.color}44`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: a.color,
              }}>
                {a.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>{a.name}</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 1 }}>Trigger: {a.trigger}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {a.out.split(", ").map((o) => (
                  <span key={o} style={{
                    display: "inline-block", marginLeft: 4,
                    fontSize: 10, fontFamily: "monospace",
                    background: COLORS.borderLight, color: COLORS.textSecondary,
                    border: `1px solid ${COLORS.border}`, borderRadius: 4, padding: "1px 5px",
                  }}>
                    {o}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ── Main Screen ───────────────────────────────────────────────
export default function OEMSettingsScreen({ showWrenchIQBranding = true, onToggleBranding }) {
  const [activeTab, setActiveTab] = useState("edition");

  const tabContent = {
    edition:    <TabEdition />,
    dms:        <TabDMS />,
    makes:      <TabMakes />,
    compliance: <TabCompliance />,
    team:       <TabTeam />,
    notify:     <TabNotifications />,
    audit:      <TabAuditLog />,
    admin:      <TabAdmin showWrenchIQBranding={showWrenchIQBranding} onToggleBranding={onToggleBranding} />,
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100%",
        background: COLORS.bg,
        boxSizing: "border-box",
      }}
    >
      {/* ── Left vertical tab nav ── */}
      <div
        style={{
          width: 200,
          flexShrink: 0,
          background: COLORS.bgCard,
          borderRight: `1px solid ${COLORS.border}`,
          display: "flex",
          flexDirection: "column",
          paddingTop: 24,
          paddingBottom: 24,
        }}
      >
        {/* Nav header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 20px 20px",
            borderBottom: `1px solid ${COLORS.border}`,
            marginBottom: 8,
          }}
        >
          <Settings size={16} color={COLORS.primary} />
          <span style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary }}>Settings</span>
        </div>

        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 20px",
                border: "none",
                background: active ? "#F0F7F9" : "transparent",
                color: active ? COLORS.primary : COLORS.textSecondary,
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                textAlign: "left",
                borderLeft: active ? `3px solid ${COLORS.primary}` : "3px solid transparent",
                borderRight: "none",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />
        <div style={{ padding: "0 20px", fontSize: 11, color: COLORS.textMuted, lineHeight: 1.5 }}>
          WrenchIQ-OEM
          <br />
          {OEM_DEALER.name}
          <br />
          Predii, Inc.
        </div>
      </div>

      {/* ── Right content ── */}
      <div style={{ flex: 1, padding: "28px 32px", overflowY: "auto", minWidth: 0 }}>
        {/* Page title */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: COLORS.textPrimary, margin: "0 0 4px" }}>
            {TABS.find((t) => t.id === activeTab)?.label}
          </h2>
          <div style={{ fontSize: 13, color: COLORS.textSecondary }}>
            {OEM_DEALER.name} · WrenchIQ-OEM
          </div>
        </div>

        {tabContent[activeTab]}
      </div>
    </div>
  );
}
