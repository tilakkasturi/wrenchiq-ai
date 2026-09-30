/**
 * HealthCheckScreen — Sidecar launch step 1 (WrenchIQ Product Spec v4.0 §1).
 *
 * Shows the two hard dependencies the Sidecar relies on before the advisor
 * gets to any customer data: the LLM endpoint (roAdvisorService.js) and the
 * shop's data feed. "Not Connected" for the SMS/DMS is an honest, expected
 * state right now — no live shop system integration exists yet — not an
 * error, so it never blocks "Continue to Shop". Runs once on mount, with a
 * manual recheck rather than background polling (no benefit mid-demo).
 */

import { useEffect, useState } from "react";
import { Cpu, Database, RotateCw, ArrowRight, Tablet, Smartphone, Laptop, Clock, DollarSign, ChevronDown, AlertTriangle } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { fetchDetailedHealth } from "../../services/healthService";
import { useSelectedCustomer } from "../../context/SelectedCustomerContext";
import { useDemo } from "../../context/DemoContext";
import { hoursSince } from "../../utils/waitTime";

// Same stage labels/colors as the Sidecar's RO Queue (RepairOrderQueue.jsx) —
// kept in sync so a stage reads the same way everywhere in the app.
const STAGE_LABEL = {
  checked_in:    { label: "Checked In",    color: "#60A5FA" },
  inspecting:    { label: "Inspecting",    color: "#FB923C" },
  estimate_sent: { label: "Estimate Sent", color: "#FBBF24" },
  approved:      { label: "Approved",      color: "#2DD4BF" },
  in_progress:   { label: "In Progress",   color: "#C084FC" },
  ready:         { label: "Ready",         color: "#4ADE80" },
};
const STAGE_ORDER = ["checked_in", "inspecting", "estimate_sent", "approved", "in_progress", "ready"];

// The Sidecar is one Tauri app, built once and installed everywhere an
// advisor actually works — not a phone-only or desktop-only tool.
const AVAILABLE_ON = [
  { icon: Tablet,     label: "iPad" },
  { icon: Smartphone, label: "iPhone" },
  { icon: Smartphone, label: "Android" },
  { icon: Laptop,     label: "Windows" },
];

const STATUS_STYLE = {
  connected:     { label: "Connected",     color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  degraded:      { label: "Degraded",      color: "#FBBF24", bg: "rgba(250,204,21,0.12)" },
  not_connected: { label: "Not Connected", color: "rgba(255,255,255,0.8)", bg: "rgba(255,255,255,0.06)" },
  error:         { label: "Error",         color: "#F87171", bg: "rgba(248,113,113,0.12)" },
};

function fallbackHealth() {
  return {
    llm: { status: "error", error: "Could not reach the WrenchIQ server" },
    sms: { status: "not_connected", note: "Reading Predii's demo data feed — not yet connected to a live shop SMS/DMS" },
  };
}

export default function HealthCheckScreen({ onContinue }) {
  const [health, setHealth] = useState(null);
  const [checking, setChecking] = useState(true);
  const { customers, loading: customersLoading } = useSelectedCustomer();
  const { shopName, smsName } = useDemo();

  async function runCheck() {
    setChecking(true);
    const result = await fetchDetailedHealth();
    setHealth(result || fallbackHealth());
    setChecking(false);
  }

  useEffect(() => { runCheck(); }, []);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflowY: "auto", padding: "24px 20px", gap: 16,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 2 }}>
          {shopName || "Your Shop"}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.8)" }}>
          {today}
        </div>
      </div>

      <ShopSnapshot customers={customers} loading={customersLoading} />

      <div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
          Checking WrenchIQ Connections
        </div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
          Here's exactly what's live before you start working a repair order.
        </div>
      </div>

      <AvailableOnStrip />

      <HealthRow
        icon={Cpu}
        label="LLM Endpoint"
        checking={checking}
        status={health?.llm?.status}
        detail={
          checking ? null
            : health?.llm?.status === "error" ? (health.llm.error || "Unreachable")
            : health?.llm?.latencyMs != null
              ? `${health.llm.latencyMs}ms${health.llm.model ? ` — ${health.llm.model}` : ""}`
              : null
        }
      />

      <HealthRow
        icon={Database}
        label={`Shop Management System — ${smsName || "SMS"}`}
        checking={checking}
        status={health?.sms?.status}
        detail={checking ? null : health?.sms?.note}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
        <button
          onClick={onContinue}
          disabled={checking}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            background: checking ? "rgba(255,255,255,0.06)" : COLORS.gold,
            border: "none", borderRadius: 8, padding: "10px 14px", cursor: checking ? "default" : "pointer",
            fontSize: 12.5, fontWeight: 800, color: checking ? "rgba(255,255,255,0.35)" : "#0A1628",
          }}
        >
          Continue to Shop <ArrowRight size={13} />
        </button>
        <button
          onClick={runCheck}
          title="Recheck connections"
          disabled={checking}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8, padding: "10px 12px", cursor: checking ? "default" : "pointer",
            color: "rgba(255,255,255,0.75)",
          }}
        >
          <RotateCw size={13} style={{ animation: checking ? "spin 0.8s linear infinite" : "none" }} />
        </button>
      </div>
      <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}

// Today's queue at a glance — count by stage, total wait time, and the
// estimate value currently sitting in the queue. All computed from the same
// live data feed the RO Queue itself renders (SelectedCustomerContext), so
// this never drifts out of sync with what the advisor sees one tap away.
function ShopSnapshot({ customers, loading }) {
  const [waitExpanded, setWaitExpanded] = useState(false);

  if (loading && customers.length === 0) {
    return (
      <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.75)" }}>Loading today's queue…</div>
    );
  }

  const stageCounts = {};
  let openCount = 0;
  let totalEstimateValue = 0;

  for (const c of customers) {
    stageCounts[c.status] = (stageCounts[c.status] || 0) + 1;
    totalEstimateValue += c.totalEstimate || 0;
    if (c.status !== "ready") openCount += 1;
  }

  // A sum of every open RO's wait time (the old metric) grows with queue
  // size and tells an advisor nothing about what to actually do — 23.3 hrs
  // across 8 ROs could mean one RO waiting all day or eight waiting under 3
  // hours each. Sorted longest-first, the same list both answers "how long
  // has anyone been waiting" (the max) and "who's priority" (the top row).
  const openWaits = customers
    .filter((c) => c.status !== "ready")
    .map((c) => ({ ...c, waitHours: hoursSince(c.dateIn) }))
    .sort((a, b) => b.waitHours - a.waitHours);
  const longestWaitHours = openWaits[0]?.waitHours ?? 0;

  const avgEstimate = customers.length > 0 ? totalEstimateValue / customers.length : 0;

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Today's Queue
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{customers.length} ROs</span>
      </div>

      {/* Stage counts */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {STAGE_ORDER.filter(s => stageCounts[s]).map((s) => {
          const meta = STAGE_LABEL[s];
          return (
            <span key={s} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              fontSize: 10, fontWeight: 700, borderRadius: 5, padding: "3px 8px",
              background: "rgba(255,255,255,0.05)", color: meta.color,
            }}>
              {stageCounts[s]} {meta.label}
            </span>
          );
        })}
        {customers.length === 0 && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>No active repair orders yet today.</span>
        )}
      </div>

      {/* Wait time + shop performance */}
      {customers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <SnapshotStat
              icon={Clock}
              label="Longest Wait"
              value={`${longestWaitHours.toFixed(1)} hrs`}
              sub={`${openWaits[0]?.customerName || "—"} · ${openCount} open RO${openCount === 1 ? "" : "s"} total`}
              expandable
              expanded={waitExpanded}
              onClick={() => setWaitExpanded((v) => !v)}
            />
            <SnapshotStat
              icon={DollarSign}
              label="In Queue"
              value={`$${Math.round(totalEstimateValue).toLocaleString()}`}
              sub={`avg $${Math.round(avgEstimate).toLocaleString()}/RO`}
            />
          </div>

          {waitExpanded && (
            <div style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 8, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 2,
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", marginBottom: 6, lineHeight: 1.4 }}>
                Sorted by how long each open RO has been checked in — the top row is who's waited longest and worth checking on first.
              </div>
              {openWaits.length === 0 ? (
                <div style={{ fontSize: 13, color: "#fff" }}>No open ROs waiting right now.</div>
              ) : (
                openWaits.map((c, i) => (
                  <div key={c.roNumber || i} style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "6px 0",
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  }}>
                    {i === 0 ? (
                      <AlertTriangle size={14} color="#FBBF24" style={{ flexShrink: 0 }} />
                    ) : (
                      <span style={{ width: 14, flexShrink: 0 }} />
                    )}
                    <span style={{ fontSize: 13, color: "#fff", fontWeight: i === 0 ? 700 : 600, flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.customerName || "Unknown customer"}
                    </span>
                    <span style={{ fontSize: 12, color: "#fff", flexShrink: 0 }}>
                      {STAGE_LABEL[c.status]?.label || c.status}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? "#FBBF24" : "#fff", flexShrink: 0, width: 60, textAlign: "right" }}>
                      {c.waitHours.toFixed(1)} hrs
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SnapshotStat({ icon: Icon, label, value, sub, expandable, expanded, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 8, padding: "8px 10px", cursor: expandable ? "pointer" : "default",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
        <Icon size={11} color="rgba(255,255,255,0.4)" />
        <span style={{ fontSize: 9.5, fontWeight: 700, color: "rgba(255,255,255,0.8)", textTransform: "uppercase", letterSpacing: "0.04em", flex: 1 }}>
          {label}
        </span>
        {expandable && (
          <ChevronDown size={11} color="rgba(255,255,255,0.4)" style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>{value}</div>
      <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.75)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sub}</div>
    </div>
  );
}

function AvailableOnStrip() {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 8, padding: "9px 12px",
    }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", fontWeight: 600, flexShrink: 0 }}>
        Same app, everywhere:
      </span>
      <div style={{ display: "flex", gap: 14, flexShrink: 0 }}>
        {AVAILABLE_ON.map(({ icon: Icon, label }) => (
          <div key={label} title={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <Icon size={13} color="rgba(255,255,255,0.55)" />
            <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}


function HealthRow({ icon: Icon, label, checking, status, detail }) {
  const style = checking ? null : (STATUS_STYLE[status] || STATUS_STYLE.error);
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "11px 13px",
    }}>
      <Icon size={15} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9" }}>{label}</div>
        {detail && (
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.8)", marginTop: 2, lineHeight: 1.4 }}>{detail}</div>
        )}
      </div>
      <span style={{
        flexShrink: 0, fontSize: 9.5, fontWeight: 700, borderRadius: 4, padding: "3px 8px",
        letterSpacing: "0.04em", textTransform: "uppercase",
        background: checking ? "rgba(255,255,255,0.06)" : style.bg,
        color: checking ? "rgba(255,255,255,0.35)" : style.color,
      }}>
        {checking ? "Checking…" : style.label}
      </span>
    </div>
  );
}
