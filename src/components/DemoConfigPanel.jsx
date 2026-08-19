/**
 * DemoConfigPanel — floating demo configuration panel
 *
 * Two tabs:
 *   Setup   — SMS name, shop name, owner, primary customer
 *   Modules — edition toggle (AM / OEM / Both) + per-module on/off
 *
 * All settings persist to localStorage via DemoContext.
 */

import { useState } from "react";
import { Settings2, X, RotateCcw, Check, LayoutGrid } from "lucide-react";
import { useDemo, smsNameToProvider, SMS_VENDOR_CONFIG, MODULE_REGISTRY } from "../context/DemoContext";
import { COLORS } from "../theme/colors";

export default function DemoConfigPanel({ onClose }) {
  const {
    smsName, corporateName, shopName, ownerName, primaryCustomer,
    moduleConfig,
    setDemo, reset, SMS_OPTIONS,
  } = useDemo();

  const [tab, setTab]   = useState("modules"); // "setup" | "modules"
  const [local, setLocal] = useState({
    smsName, corporateName, shopName, ownerName, primaryCustomer,
  });
  const [localMod, setLocalMod] = useState({
    edition: moduleConfig?.edition ?? "am",
    modules: { ...(moduleConfig?.modules ?? {}) },
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    const smsProvider = smsNameToProvider(local.smsName);
    setDemo({ ...local, smsProvider, moduleConfig: localMod });
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 700);
  }

  function handleReset() {
    reset();
    onClose();
  }

  function toggleModule(id) {
    setLocalMod(prev => ({
      ...prev,
      modules: { ...prev.modules, [id]: !prev.modules[id] },
    }));
  }

  function setEdition(ed) {
    setLocalMod(prev => ({ ...prev, edition: ed }));
  }

  // Modules visible for current edition choice
  const editionFilter = (m) => {
    if (localMod.edition === "am")   return m.am;
    if (localMod.edition === "oem")  return m.oem;
    return true; // "both"
  };

  const visibleModules = MODULE_REGISTRY.filter(editionFilter);

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.25)" }} />

      {/* Panel */}
      <div style={{
        position: "fixed",
        top: 60, right: 16,
        width: 340,
        background: "#fff",
        borderRadius: 14,
        boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        border: `1px solid ${COLORS.border}`,
        zIndex: 1000,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        maxHeight: "calc(100vh - 80px)",
      }}>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: `1px solid ${COLORS.border}`,
          background: COLORS.bgDark,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Settings2 size={14} color={COLORS.accent} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Demo Configuration</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0, background: "#FAFAFA" }}>
          {[
            { key: "modules", label: "Modules", icon: LayoutGrid },
            { key: "setup",   label: "Setup",   icon: Settings2 },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                padding: "10px 0",
                border: "none",
                borderBottom: tab === key ? `2px solid ${COLORS.primary}` : "2px solid transparent",
                background: "transparent",
                fontSize: 12, fontWeight: tab === key ? 700 : 500,
                color: tab === key ? COLORS.primary : COLORS.textMuted,
                cursor: "pointer",
              }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* ── MODULES TAB ── */}
          {tab === "modules" && (
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Edition toggle */}
              <div>
                <label style={labelStyle}>Edition</label>
                <div style={{ display: "flex", gap: 0, background: "#F3F4F6", borderRadius: 10, padding: 3 }}>
                  {[
                    { key: "am",   label: "AM",   sub: "Aftermarket" },
                    { key: "oem",  label: "OEM",  sub: "Dealerships" },
                    { key: "both", label: "Both", sub: "AM + OEM" },
                  ].map(opt => {
                    const active = localMod.edition === opt.key;
                    return (
                      <button
                        key={opt.key}
                        onClick={() => setEdition(opt.key)}
                        style={{
                          flex: 1,
                          padding: "7px 4px",
                          border: "none",
                          borderRadius: 8,
                          background: active ? COLORS.primary : "transparent",
                          color: active ? "#fff" : COLORS.textMuted,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 700 }}>{opt.label}</div>
                        <div style={{ fontSize: 9, opacity: active ? 0.75 : 0.6 }}>{opt.sub}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Module toggles */}
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <label style={labelStyle}>Modules</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setLocalMod(prev => ({ ...prev, modules: Object.fromEntries(MODULE_REGISTRY.map(m => [m.id, true])) }))}
                      style={smallBtn}>All On</button>
                    <button onClick={() => setLocalMod(prev => ({ ...prev, modules: Object.fromEntries(MODULE_REGISTRY.map(m => [m.id, false])) }))}
                      style={smallBtn}>All Off</button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {visibleModules.map(m => {
                    const enabled = localMod.modules[m.id] !== false;
                    const amOnly  = m.am && !m.oem;
                    const oemOnly = !m.am && m.oem;
                    return (
                      <label
                        key={m.id}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: `1px solid ${enabled ? `${COLORS.primary}22` : "#E5E7EB"}`,
                          background: enabled ? `${COLORS.primary}06` : "#FAFAFA",
                          cursor: "pointer",
                          transition: "all 0.12s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() => toggleModule(m.id)}
                            style={{ accentColor: COLORS.primary, width: 14, height: 14 }}
                          />
                          <span style={{ fontSize: 12, fontWeight: enabled ? 600 : 400, color: enabled ? "#111827" : "#9CA3AF" }}>
                            {m.label}
                          </span>
                        </div>
                        {amOnly  && <span style={badgeStyle("#FF6B35")}>AM</span>}
                        {oemOnly && <span style={badgeStyle("#4DB6AC")}>OEM</span>}
                        {!amOnly && !oemOnly && <span style={badgeStyle("#6B7280")}>Shared</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── SETUP TAB ── */}
          {tab === "setup" && (
            <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

              {/* SMS Name */}
              <div>
                <label style={labelStyle}>Shop Management System</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                  {SMS_OPTIONS.map(opt => {
                    const provider = smsNameToProvider(opt);
                    const hasPredii = SMS_VENDOR_CONFIG[provider]?.poweredByPredii;
                    const isSelected = local.smsName === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setLocal(p => ({ ...p, smsName: opt }))}
                        title={hasPredii ? `${opt} — Powered by Predii` : opt}
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          border: `1.5px solid ${isSelected ? COLORS.primary : COLORS.border}`,
                          background: isSelected ? `${COLORS.primary}12` : "#fff",
                          color: isSelected ? COLORS.primary : COLORS.textSecondary,
                          fontSize: 12,
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          display: "flex", alignItems: "center", gap: 4,
                        }}
                      >
                        {opt}
                        {hasPredii && (
                          <svg width={8} height={8} viewBox="0 0 24 24" fill="none" style={{ opacity: isSelected ? 1 : 0.4 }}>
                            <path d="M4 8 Q12 2 20 8"  stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            <path d="M4 12 Q12 6 20 12" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                            <path d="M4 16 Q12 10 20 16" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2, marginBottom: 4 }}>
                  <svg width={8} height={8} viewBox="0 0 24 24" fill="none">
                    <path d="M4 8 Q12 2 20 8"  stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M4 12 Q12 6 20 12" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                    <path d="M4 16 Q12 10 20 16" stroke="#FF6B35" strokeWidth="3" strokeLinecap="round" fill="none"/>
                  </svg>
                  <span style={{ fontSize: 10, color: "#9CA3AF" }}>= Powered by Predii integration available</span>
                </div>
              </div>

              {/* Corporate Name */}
              <div>
                <label style={labelStyle}>Corporate / Chain Name</label>
                <input value={local.corporateName} onChange={e => setLocal(p => ({ ...p, corporateName: e.target.value }))} placeholder="e.g. EWG Auto Group" style={inputStyle} />
              </div>

              {/* Shop Name */}
              <div>
                <label style={labelStyle}>Shop / Location Name</label>
                <input value={local.shopName} onChange={e => setLocal(p => ({ ...p, shopName: e.target.value }))} placeholder="e.g. Acme Auto Service — Palo Alto" style={inputStyle} />
              </div>

              {/* Owner Name */}
              <div>
                <label style={labelStyle}>Shop Owner / Manager</label>
                <input value={local.ownerName} onChange={e => setLocal(p => ({ ...p, ownerName: e.target.value }))} placeholder="e.g. John Smith" style={inputStyle} />
              </div>

              {/* Primary Customer */}
              <div>
                <label style={labelStyle}>Demo Customer Name</label>
                <input value={local.primaryCustomer} onChange={e => setLocal(p => ({ ...p, primaryCustomer: e.target.value }))} placeholder="e.g. Robert Taylor" style={inputStyle} />
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 16px",
          borderTop: `1px solid ${COLORS.border}`,
          display: "flex", gap: 8,
          flexShrink: 0,
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
  color: "#6B7280",
  marginBottom: 6,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1.5px solid #E5E7EB",
  borderRadius: 8,
  fontSize: 13,
  color: "#111827",
  outline: "none",
  boxSizing: "border-box",
};

const smallBtn = {
  padding: "2px 8px",
  borderRadius: 5,
  border: "1px solid #E5E7EB",
  background: "#fff",
  fontSize: 10, fontWeight: 600,
  color: "#6B7280",
  cursor: "pointer",
};

function badgeStyle(color) {
  return {
    fontSize: 9, fontWeight: 700,
    color,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    borderRadius: 4,
    padding: "1px 5px",
    letterSpacing: "0.04em",
  };
}
