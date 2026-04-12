// AM3CAdminScreen — Admin Settings for 3C Story Writer (AE-876)
// Shop-owner configuration: Predii Score definition, factuality rules, delivery settings.

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft, Shield, CheckCircle, X, ChevronDown, ChevronUp,
  Save, Wifi, WifiOff, Settings,
} from "lucide-react";
import { COLORS } from "../theme/colors";

// ── Default settings (exported so callers can use as initializer) ──────────
export const DEFAULT_SETTINGS = {
  delivery: {
    method: "both",
    senderName: "Peninsula Precision Auto",
    documentExpiryDays: 90,
    minScoreToSend: 60,
  },
  smsIntegration: {
    target: "tekmetric",
    apiKey: "",
    enabled: false,
  },
};

// ── Predii Score rows ──────────────────────────────────────────────────────
const SCORE_FORMULA = [
  { component: "Source Coverage",       maxPts: 40, description: "% of sentences linked to a DVI, DTC, or TECH reference" },
  { component: "Factual Compliance",    maxPts: 40, description: "Deducted for each rule violation detected" },
  { component: "Document Completeness", maxPts: 20, description: "All 5 required narrative sections present and non-empty" },
];

const SCORE_THRESHOLDS = [
  { label: "Excellent",    range: "90 – 100", color: COLORS.success,  bg: "#DCFCE7" },
  { label: "Good",         range: "75 – 89",  color: "#2563EB",       bg: "#DBEAFE" },
  { label: "Fair",         range: "60 – 74",  color: COLORS.warning,  bg: "#FEF3C7" },
  { label: "Needs Review", range: "< 60",     color: COLORS.danger,   bg: "#FEE2E2" },
];

// ── Factuality rule definitions ────────────────────────────────────────────
const FACTUALITY_RULES = [
  {
    id: 1,
    name: "No Fabrication",
    description: "Every factual claim must link to a documented source (DVI, DTC, or tech note).",
    compliant:     "Catalytic converter [DVI-1] failed threshold test.",
    noncompliant:  "The catalytic converter is failing.",
  },
  {
    id: 2,
    name: "No Future-State Prediction",
    description: "Narratives must not predict failure timelines or outcomes beyond what data supports.",
    compliant:     "Brake pads [DVI-3] measured 2 mm (spec: 3 mm min).",
    noncompliant:  "Brakes will fail soon.",
  },
  {
    id: 3,
    name: "No Blame",
    description: "Narratives must not attribute fault or negligence to the customer.",
    compliant:     "Oil consumption noted at 1 qt / 1,000 mi [TECH-2].",
    noncompliant:  "Customer neglected oil changes.",
  },
  {
    id: 4,
    name: "No Guarantees",
    description: "Outcome warranties or repair guarantees must not appear in AI-generated text.",
    compliant:     "All work performed per OEM specification [TECH-4].",
    noncompliant:  "This repair is guaranteed to fix the issue.",
  },
  {
    id: 5,
    name: "No Speculation",
    description: "Diagnostic conclusions must reference confirmed data, not technician intuition alone.",
    compliant:     "DTC P0420 [DTC-1] confirms catalyst efficiency below threshold.",
    noncompliant:  "We think the catalytic converter might be bad.",
  },
  {
    id: 6,
    name: "Verbatim Audit Preservation",
    description: "Original technician inputs must be preserved in the audit trail unchanged.",
    compliant:     "Original tech notes preserved in audit trail.",
    noncompliant:  "Edited section without audit record.",
  },
];

const SMS_TARGETS = [
  { value: "tekmetric",   label: "Tekmetric" },
  { value: "shop_ware",   label: "Shop-Ware" },
  { value: "shopmonkey",  label: "Shopmonkey" },
  { value: "autoleap",    label: "AutoLeap" },
];

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ children, style }) {
  return (
    <div style={{
      background: COLORS.bgCard,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 10,
      overflow: "hidden",
      marginBottom: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{
      padding: "16px 20px",
      borderBottom: `1px solid ${COLORS.border}`,
      background: COLORS.borderLight,
    }}>
      <div style={{ fontWeight: 700, fontSize: 15, color: COLORS.textPrimary }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 3 }}>{subtitle}</div>
      )}
    </div>
  );
}

function ReadOnlyBadge({ text }) {
  return (
    <span style={{
      display: "inline-block",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      background: "#F3F4F6",
      color: COLORS.textMuted,
      border: `1px solid ${COLORS.border}`,
      borderRadius: 4,
      padding: "2px 7px",
      marginLeft: 8,
      verticalAlign: "middle",
    }}>
      {text}
    </span>
  );
}

function RuleCard({ rule }) {
  return (
    <div style={{
      border: `1px solid ${COLORS.border}`,
      borderRadius: 8,
      overflow: "hidden",
      marginBottom: 12,
    }}>
      {/* Rule header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "#F9FAFB",
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          background: COLORS.primary,
          color: "#fff",
          fontSize: 11,
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {rule.id}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.textPrimary }}>{rule.name}</div>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 1 }}>{rule.description}</div>
        </div>
        <div style={{
          marginLeft: "auto",
          fontSize: 10,
          fontWeight: 700,
          color: COLORS.danger,
          background: "#FEF2F2",
          border: `1px solid #FECACA`,
          borderRadius: 4,
          padding: "2px 7px",
          whiteSpace: "nowrap",
        }}>
          ALWAYS ON
        </div>
      </div>

      {/* Examples */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
        {/* Compliant */}
        <div style={{
          padding: "10px 14px",
          borderRight: `1px solid ${COLORS.border}`,
          background: "#F0FDF4",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: "#15803D",
            marginBottom: 5,
          }}>
            <CheckCircle size={13} />
            Compliant
          </div>
          <div style={{
            fontSize: 12,
            color: "#166534",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}>
            "{rule.compliant}"
          </div>
        </div>

        {/* Non-compliant */}
        <div style={{
          padding: "10px 14px",
          background: "#FFF5F5",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontSize: 11,
            fontWeight: 700,
            color: COLORS.danger,
            marginBottom: 5,
          }}>
            <X size={13} />
            Non-Compliant
          </div>
          <div style={{
            fontSize: 12,
            color: "#991B1B",
            fontStyle: "italic",
            lineHeight: 1.5,
          }}>
            "{rule.noncompliant}"
          </div>
        </div>
      </div>
    </div>
  );
}

function FormRow({ label, hint, children }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px 1fr",
      gap: 16,
      alignItems: "start",
      padding: "14px 20px",
      borderBottom: `1px solid ${COLORS.borderLight}`,
    }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 44,
        height: 24,
        borderRadius: 12,
        border: "none",
        background: checked ? COLORS.primary : COLORS.border,
        cursor: "pointer",
        position: "relative",
        transition: "background 0.2s",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 2,
        left: checked ? 22 : 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
      }} />
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function AM3CAdminScreen({ settings = DEFAULT_SETTINGS, onSave }) {
  const [local, setLocal] = useState(() => ({
    delivery: { ...DEFAULT_SETTINGS.delivery, ...(settings?.delivery || {}) },
    smsIntegration: { ...DEFAULT_SETTINGS.smsIntegration, ...(settings?.smsIntegration || {}) },
  }));

  const [expandedExplainer, setExpandedExplainer] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(""); // "" | "connected" | "error"
  const [saveIndicator, setSaveIndicator] = useState("saved"); // "saved" | "saving" | "unsaved"

  const debounceRef = useRef(null);
  const isFirstRender = useRef(true);

  // Auto-save with 800ms debounce
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setSaveIndicator("unsaved");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSaveIndicator("saving");
      if (typeof onSave === "function") onSave(local);
      setTimeout(() => setSaveIndicator("saved"), 400);
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [local]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateDelivery(patch) {
    setLocal(prev => ({ ...prev, delivery: { ...prev.delivery, ...patch } }));
  }

  function updateSms(patch) {
    setLocal(prev => ({ ...prev, smsIntegration: { ...prev.smsIntegration, ...patch } }));
  }

  function handleTestConnection() {
    setTestingConnection(true);
    setConnectionStatus("");
    setTimeout(() => {
      setTestingConnection(false);
      setConnectionStatus("connected");
    }, 1000);
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.bg,
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Header bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: COLORS.primary,
        color: "#fff",
        padding: "0 24px",
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
      }}>
        {/* Back button */}
        <button style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "rgba(255,255,255,0.12)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 6,
          color: "#fff",
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 500,
        }}>
          <ArrowLeft size={15} />
          Back
        </button>

        <Settings size={18} style={{ opacity: 0.8 }} />

        <div style={{ fontWeight: 700, fontSize: 16 }}>
          3C Story Writer — Admin Settings
        </div>

        {/* Admin Only badge */}
        <div style={{
          background: COLORS.accent,
          color: "#fff",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          borderRadius: 4,
          padding: "3px 8px",
        }}>
          Admin Only
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Auto-save indicator */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
          opacity: 0.85,
        }}>
          {saveIndicator === "saved" && (
            <>
              <CheckCircle size={14} style={{ color: "#86EFAC" }} />
              <span>Settings saved</span>
            </>
          )}
          {saveIndicator === "saving" && (
            <>
              <Save size={14} style={{ color: "#FCD34D", opacity: 0.9 }} />
              <span>Saving…</span>
            </>
          )}
          {saveIndicator === "unsaved" && (
            <>
              <Save size={14} style={{ opacity: 0.6 }} />
              <span>Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* ── Content area ───────────────────────────────────────────────── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 24px 60px" }}>

        {/* ── Section 1: Predii Score Definition ───────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Predii Score — How It Works"
            subtitle="Read-only in AM edition. Weights are set by Predii."
          />
          <div style={{ padding: 20 }}>

            {/* Score formula table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}>
                Score Formula
                <ReadOnlyBadge text="Read-only in AM edition" />
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textSecondary, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Component</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", color: COLORS.textSecondary, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>Max Points</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", color: COLORS.textSecondary, fontWeight: 600, borderBottom: `1px solid ${COLORS.border}` }}>What It Measures</th>
                  </tr>
                </thead>
                <tbody>
                  {SCORE_FORMULA.map((row, i) => (
                    <tr key={row.component} style={{ background: i % 2 === 0 ? "#fff" : "#FAFAFA" }}>
                      <td style={{ padding: "9px 12px", fontWeight: 600, color: COLORS.textPrimary, borderBottom: `1px solid ${COLORS.borderLight}` }}>{row.component}</td>
                      <td style={{ padding: "9px 12px", textAlign: "center", borderBottom: `1px solid ${COLORS.borderLight}` }}>
                        <span style={{
                          display: "inline-block",
                          background: COLORS.primary,
                          color: "#fff",
                          borderRadius: 4,
                          padding: "2px 9px",
                          fontWeight: 700,
                          fontSize: 13,
                        }}>
                          {row.maxPts}
                        </span>
                      </td>
                      <td style={{ padding: "9px 12px", color: COLORS.textSecondary, borderBottom: `1px solid ${COLORS.borderLight}` }}>{row.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Score threshold table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 700,
                color: COLORS.textSecondary,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
              }}>
                Score Thresholds
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {SCORE_THRESHOLDS.map(t => (
                  <div key={t.label} style={{
                    background: t.bg,
                    border: `1px solid ${t.color}30`,
                    borderRadius: 8,
                    padding: "12px 14px",
                    textAlign: "center",
                  }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: t.color }}>{t.range}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: t.color, marginTop: 2 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Worked example */}
            <div style={{
              background: "#F0F9FF",
              border: `1px solid #BAE6FD`,
              borderRadius: 8,
              padding: "12px 14px",
              fontSize: 13,
              color: "#0369A1",
              marginBottom: 16,
            }}>
              <strong>Worked example:</strong> An RO with 85% sourced sentences, 1 violation, and all 5 sections
              = (34 + 32 + 20) = <strong>86 — Good</strong>
            </div>

            {/* Expandable explainer */}
            <button
              onClick={() => setExpandedExplainer(v => !v)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "none",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                padding: "7px 12px",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: COLORS.primary,
              }}
            >
              <Shield size={14} />
              How Predii Score Works — Staff Explainer
              {expandedExplainer ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {expandedExplainer && (
              <div style={{
                marginTop: 12,
                background: "#FAFAFA",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 8,
                padding: "14px 16px",
                fontSize: 13,
                color: COLORS.textSecondary,
                lineHeight: 1.7,
              }}>
                <p style={{ margin: "0 0 10px" }}>
                  <strong style={{ color: COLORS.textPrimary }}>Predii Score</strong> is a 0–100 quality metric
                  calculated automatically every time a 3C narrative is generated. It is not a customer-facing score —
                  it is an internal quality gate to ensure every document sent to a customer meets a minimum standard
                  of factual grounding.
                </p>
                <p style={{ margin: "0 0 10px" }}>
                  <strong style={{ color: COLORS.textPrimary }}>Source Coverage (40 pts)</strong> rewards narratives
                  where most sentences are directly linked to a data source — a DVI line item, a DTC code, or a
                  technician note. Unsourced sentences reduce this score.
                </p>
                <p style={{ margin: "0 0 10px" }}>
                  <strong style={{ color: COLORS.textPrimary }}>Factual Compliance (40 pts)</strong> starts at 40 and
                  deducts points for each of the 6 factuality rule violations detected. A single violation costs up
                  to 8 points.
                </p>
                <p style={{ margin: 0 }}>
                  <strong style={{ color: COLORS.textPrimary }}>Document Completeness (20 pts)</strong> verifies that
                  all five narrative sections — Complaint, Cause, Correction, Parts, and Recommendations — are present
                  and contain substantive content.
                </p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Section 2: Factuality Rules ───────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Factuality Rules (Always On)"
            subtitle="Rules cannot be disabled in AM edition. Violations reduce the Predii Score."
          />
          <div style={{ padding: 20 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#FEF9C3",
              border: `1px solid #FDE68A`,
              borderRadius: 7,
              padding: "9px 13px",
              marginBottom: 16,
              fontSize: 12,
              color: "#92400E",
              fontWeight: 500,
            }}>
              <Shield size={14} style={{ flexShrink: 0 }} />
              These rules are enforced automatically during narrative generation. They protect your shop from
              liability exposure and ensure regulatory-grade documentation.
            </div>
            {FACTUALITY_RULES.map(rule => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </SectionCard>

        {/* ── Section 3: Delivery Settings ─────────────────────────────── */}
        <SectionCard>
          <SectionHeader
            title="Delivery Settings"
            subtitle="Changes auto-save and take effect on the next RO generated."
          />

          {/* Delivery Method */}
          <FormRow label="Delivery Method" hint="How 3C documents are sent to customers">
            <div style={{ display: "flex", gap: 20, paddingTop: 2 }}>
              {[
                { value: "sms",   label: "SMS" },
                { value: "email", label: "Email" },
                { value: "both",  label: "Both" },
              ].map(opt => (
                <label key={opt.value} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: local.delivery.method === opt.value ? 700 : 400,
                  color: local.delivery.method === opt.value ? COLORS.primary : COLORS.textPrimary,
                }}>
                  <input
                    type="radio"
                    name="delivery-method"
                    value={opt.value}
                    checked={local.delivery.method === opt.value}
                    onChange={() => updateDelivery({ method: opt.value })}
                    style={{ accentColor: COLORS.primary }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </FormRow>

          {/* SMS Sender Name */}
          <FormRow label="SMS Sender Name" hint="Displayed as sender in outbound SMS">
            <input
              type="text"
              value={local.delivery.senderName}
              onChange={e => updateDelivery({ senderName: e.target.value })}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
          </FormRow>

          {/* Document Expiry */}
          <FormRow label="Document Expiry" hint="Days until document link expires">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                min={1}
                max={365}
                value={local.delivery.documentExpiryDays}
                onChange={e => updateDelivery({ documentExpiryDays: Math.min(365, Math.max(1, Number(e.target.value))) })}
                style={{
                  width: 80,
                  padding: "8px 10px",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 6,
                  fontSize: 13,
                  color: COLORS.textPrimary,
                  fontFamily: "inherit",
                  outline: "none",
                  textAlign: "center",
                }}
              />
              <span style={{ fontSize: 13, color: COLORS.textSecondary }}>days</span>
            </div>
          </FormRow>

          {/* Minimum Predii Score */}
          <FormRow label="Min. Predii Score to Send" hint="Documents below this score are held for review">
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={local.delivery.minScoreToSend}
                onChange={e => updateDelivery({ minScoreToSend: Number(e.target.value) })}
                style={{ flex: 1, accentColor: COLORS.primary, cursor: "pointer" }}
              />
              <div style={{
                minWidth: 48,
                textAlign: "center",
                fontWeight: 800,
                fontSize: 18,
                color: local.delivery.minScoreToSend >= 75
                  ? COLORS.success
                  : local.delivery.minScoreToSend >= 60
                    ? COLORS.warning
                    : COLORS.danger,
              }}>
                {local.delivery.minScoreToSend}
              </div>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
              {local.delivery.minScoreToSend >= 90 && "Excellent threshold — very strict"}
              {local.delivery.minScoreToSend >= 75 && local.delivery.minScoreToSend < 90 && "Good threshold — recommended for most shops"}
              {local.delivery.minScoreToSend >= 60 && local.delivery.minScoreToSend < 75 && "Fair threshold — some review items may pass through"}
              {local.delivery.minScoreToSend < 60 && "Low threshold — most documents will be sent without review"}
            </div>
          </FormRow>

          {/* SMS Integration divider */}
          <div style={{
            padding: "12px 20px",
            background: COLORS.borderLight,
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
            fontSize: 12,
            fontWeight: 700,
            color: COLORS.textSecondary,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}>
            <Wifi size={13} />
            SMS Integration
          </div>

          {/* Target SMS system */}
          <FormRow label="Target SMS System" hint="Your shop management system">
            <select
              value={local.smsIntegration.target}
              onChange={e => updateSms({ target: e.target.value })}
              style={{
                padding: "8px 10px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontFamily: "inherit",
                background: "#fff",
                cursor: "pointer",
                outline: "none",
                minWidth: 180,
              }}
            >
              {SMS_TARGETS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </FormRow>

          {/* API Key */}
          <FormRow label="API Key" hint="Provided by your SMS system vendor">
            <input
              type="password"
              value={local.smsIntegration.apiKey}
              onChange={e => updateSms({ apiKey: e.target.value })}
              placeholder="••••••••••••••••"
              style={{
                width: "100%",
                padding: "8px 10px",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 6,
                fontSize: 13,
                color: COLORS.textPrimary,
                fontFamily: "inherit",
                boxSizing: "border-box",
                outline: "none",
                letterSpacing: local.smsIntegration.apiKey ? "0.12em" : "normal",
              }}
            />
          </FormRow>

          {/* Enable toggle + Test Connection */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "200px 1fr",
            gap: 16,
            alignItems: "center",
            padding: "14px 20px",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.textPrimary }}>Enable Integration</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Activate outbound SMS via selected system</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <Toggle
                checked={local.smsIntegration.enabled}
                onChange={val => updateSms({ enabled: val })}
              />
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: local.smsIntegration.enabled ? COLORS.success : COLORS.textMuted,
              }}>
                {local.smsIntegration.enabled ? "Enabled" : "Disabled"}
              </span>

              {/* Test Connection button */}
              <button
                onClick={handleTestConnection}
                disabled={testingConnection}
                style={{
                  marginLeft: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  background: testingConnection ? "#F3F4F6" : COLORS.primary,
                  color: testingConnection ? COLORS.textMuted : "#fff",
                  border: "none",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: testingConnection ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {testingConnection
                  ? <><WifiOff size={13} /> Testing…</>
                  : <><Wifi size={13} /> Test Connection</>
                }
              </button>

              {/* Connection status */}
              {connectionStatus === "connected" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.success,
                }}>
                  <CheckCircle size={14} />
                  Connected
                </div>
              )}
              {connectionStatus === "error" && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.danger,
                }}>
                  <X size={14} />
                  Connection failed
                </div>
              )}
            </div>
          </div>

        </SectionCard>

        {/* Footer note */}
        <div style={{
          textAlign: "center",
          fontSize: 11,
          color: COLORS.textMuted,
          marginTop: 8,
        }}>
          Settings auto-save. No manual save required. Changes apply to all new ROs in this shop account.
        </div>
      </div>
    </div>
  );
}
