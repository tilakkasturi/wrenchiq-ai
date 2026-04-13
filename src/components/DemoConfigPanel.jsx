/**
 * DemoConfigPanel — floating demo configuration panel
 *
 * Accessible via the "Demo" button in the top bar.
 * Changes SMS name, shop name, and owner name across the entire app.
 */

import { useState } from "react";
import { Settings2, X, RotateCcw, Check } from "lucide-react";
import { useDemo } from "../context/DemoContext";
import { COLORS } from "../theme/colors";

export default function DemoConfigPanel({ onClose }) {
  const { smsName, corporateName, shopName, ownerName, primaryCustomer, setDemo, reset, SMS_OPTIONS } = useDemo();

  const [local, setLocal] = useState({ smsName, corporateName, shopName, ownerName, primaryCustomer });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setDemo(local);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  }

  function handleReset() {
    reset();
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 999,
          background: "rgba(0,0,0,0.25)",
        }}
      />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 60, right: 16,
        width: 320,
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        border: `1px solid ${COLORS.border}`,
        zIndex: 1000,
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bgDark,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Settings2 size={14} color={COLORS.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Demo Setup</span>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* SMS Name */}
          <div>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Shop Management System
            </label>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              {SMS_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setLocal(p => ({ ...p, smsName: opt }))}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: `1.5px solid ${local.smsName === opt ? COLORS.primary : COLORS.border}`,
                    background: local.smsName === opt ? `${COLORS.primary}12` : "#fff",
                    color: local.smsName === opt ? COLORS.primary : COLORS.textSecondary,
                    fontSize: 12,
                    fontWeight: local.smsName === opt ? 700 : 500,
                    cursor: "pointer",
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
            {local.smsName === "Other" && (
              <input
                autoFocus
                placeholder="Type SMS name..."
                value={local.smsName === "Other" ? "" : local.smsName}
                onChange={e => setLocal(p => ({ ...p, smsName: e.target.value }))}
                style={inputStyle}
              />
            )}
          </div>

          {/* Corporate Name */}
          <div>
            <label style={labelStyle}>Corporate / Chain Name</label>
            <input
              value={local.corporateName}
              onChange={e => setLocal(p => ({ ...p, corporateName: e.target.value }))}
              placeholder="e.g. GWG Auto Group"
              style={inputStyle}
            />
          </div>

          {/* Shop Name */}
          <div>
            <label style={labelStyle}>Shop / Location Name</label>
            <input
              value={local.shopName}
              onChange={e => setLocal(p => ({ ...p, shopName: e.target.value }))}
              placeholder="e.g. Acme Auto Service — Palo Alto"
              style={inputStyle}
            />
          </div>

          {/* Owner Name */}
          <div>
            <label style={labelStyle}>Shop Owner / Manager</label>
            <input
              value={local.ownerName}
              onChange={e => setLocal(p => ({ ...p, ownerName: e.target.value }))}
              placeholder="e.g. John Smith"
              style={inputStyle}
            />
          </div>

          {/* Primary Customer */}
          <div>
            <label style={labelStyle}>Demo Customer Name</label>
            <input
              value={local.primaryCustomer}
              onChange={e => setLocal(p => ({ ...p, primaryCustomer: e.target.value }))}
              placeholder="e.g. Robert Taylor"
              style={inputStyle}
            />
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", gap: 8,
        }}>
          <button
            onClick={handleReset}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "7px 12px",
              background: "transparent",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              fontSize: 12, fontWeight: 600,
              color: COLORS.textMuted,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={11} />
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "8px 16px",
              background: saved ? "#16A34A" : COLORS.primary,
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 13, fontWeight: 700,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            {saved ? <><Check size={13} /> Saved!</> : "Apply to Demo"}
          </button>
        </div>
      </div>
    </>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11, fontWeight: 700,
  color: COLORS.textMuted,
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: `1.5px solid #E5E7EB`,
  borderRadius: 8,
  fontSize: 13,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};
