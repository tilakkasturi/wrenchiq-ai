/**
 * WrenchIQSidecarScreen — Surface B (Tauri): WrenchIQ Intelligence sidecar
 *
 * Narrow, single-purpose window: search/select a customer's RO from the
 * live Data Feed (CustomerSelector + SelectedCustomerContext, already
 * polling GET /api/data-feed/*), then automatically load WrenchIQ
 * intelligence for that RO (GET /api/repair-orders/story-ro/:roId for full
 * RO detail, then POST /api/ro-advisor for the advisor brief / service
 * recommendations / alerts). This is intentionally narrow — no Kanban, no
 * shop-wide Knowledge Graph panel. Just: pick a customer, get WrenchIQ
 * intelligence.
 */

import { useState, useEffect, useRef } from "react";
import { Sparkles, AlertTriangle, Search, Settings, ExternalLink, Bell, BellOff, Clipboard, Send, Check, ClipboardCheck, Circle, CircleSlash, ChevronDown, Pencil, X, MessageCircle, Info, ArrowRightLeft, Home, FileText, DollarSign, Stethoscope, Layers, History, MessagesSquare } from "lucide-react";
import { COLORS } from "../theme/colors";
import { useSelectedCustomer } from "../context/SelectedCustomerContext";
import { useDemo } from "../context/DemoContext";
import { fetchStoryRO, updateStoryRO } from "../services/repairOrderService";
import { useInsightNotifier } from "../services/insightNotifier";
import { openExternalUrl } from "../services/externalLink";
import TransferSimulationModal from "../components/sidecar/TransferSimulationModal";
import HealthCheckScreen from "./sidecar/HealthCheckScreen";
import RepairOrderQueue from "./sidecar/RepairOrderQueue";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const WEB_APP_BASE_URL = import.meta.env.VITE_WEB_APP_BASE_URL || "http://localhost:5173";

function fmtMoney(n) {
  if (n == null) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

// Splits a flowing AI-generated message into ~2 even paragraphs by sentence,
// so it reads less like a wall of text — purely a display concern, the
// underlying message stays a single string everywhere else (copy/send/edit).
function splitIntoParagraphs(text, paragraphCount = 2) {
  if (!text) return [];
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
  if (sentences.length < paragraphCount) return [text];

  const perParagraph = Math.ceil(sentences.length / paragraphCount);
  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += perParagraph) {
    paragraphs.push(sentences.slice(i, i + perParagraph).join("").trim());
  }
  return paragraphs;
}

// Deterministic simulated parts/labor catalog match — stands in for a real
// DE (parts/labor data) integration until one is scoped and identified (see
// WrenchIQ Product Spec v3.0 §4/§7). Keyed off the service name so the
// "match" is stable across renders/sessions rather than random — this is a
// simulation, not a real search, and is disclosed as such in the UI.
function simulateCatalogMatch(serviceName, estimatedCost) {
  let hash = 0;
  for (let i = 0; i < serviceName.length; i++) {
    hash = (hash * 31 + serviceName.charCodeAt(i)) >>> 0;
  }
  const candidateCount = 3 + (hash % 4); // 3-6 "candidates" the simulated search turned up
  const laborHrs = Math.round((3 + (hash % 12)) * 10) / 100; // 0.3-1.4 hrs
  const partNumber = `WRQ-${10000 + (hash % 90000)}`;
  const cost = estimatedCost || 50;
  const partCost = Math.round(cost * 0.6);
  const laborCost = Math.max(cost - partCost, 0);
  return { candidateCount, laborHrs, partNumber, partCost, laborCost };
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

const openSurfaceASettings = () => openExternalUrl(`${WEB_APP_BASE_URL}/admin.html?section=settings&edition=am`);
const openSurfaceC = () => openExternalUrl(`${WEB_APP_BASE_URL}/sms-representative.html`);

export default function WrenchIQSidecarScreen() {
  // Launch sequence (WrenchIQ Product Spec v4.0): health → queue → ro.
  // "ro" is also where the collapsed RepairOrderCard lives; clicking it
  // navigates back to "queue" rather than opening its own dropdown.
  const [phase, setPhase] = useState("health");
  const { activeCustomer, customers, selectCustomer } = useSelectedCustomer();
  const [storyRO, setStoryRO] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("intelligence");
  const [roScorePct, setRoScorePct] = useState(null);
  // Which LLM profile is actually powering "Predii LLM" right now (see
  // Settings → Integrations → AI Engine / server/services/llmProviderConfig.js).
  const [llmProfile, setLlmProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = () => {
      fetch(`${API_BASE}/api/llm-provider-config`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => { if (data) setLlmProfile(data.activeProfile); })
        .catch(() => {});
    };
    fetchProfile();
    // Poll so a profile switch made in Settings while the Sidecar is already
    // open (no restart, no reload) shows up here without the user having to
    // relaunch the app.
    const interval = setInterval(fetchProfile, 15000);
    return () => clearInterval(interval);
  }, []);

  const { notifications } = useInsightNotifier(customers);

  useEffect(() => {
    const roId = activeCustomer?.roNumber;
    setStoryRO(null);
    setAgentData(null);
    setRoScorePct(null);

    if (!roId) return;

    let cancelled = false;
    setLoading(true);

    fetchStoryRO(roId)
      .then((ro) => {
        if (cancelled || !ro) return;
        setStoryRO(ro);

        return fetch(`${API_BASE}/api/ro-advisor`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            ro: {
              ...ro,
              customerId: ro._customer?.id,
              customerName: [ro._customer?.firstName, ro._customer?.lastName].filter(Boolean).join(" "),
            },
            customer: ro.customer || null,
            vehicle: ro.vehicle || null,
            shopId: ro.shopId,
          }),
        })
          .then((r) => r.json())
          .then((data) => { if (!cancelled) setAgentData(data); });
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [activeCustomer?.roNumber]);

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: COLORS.navyDark, fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 18px 10px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <div style={{
            width: 22, height: 22, background: COLORS.gold,
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Sparkles size={11} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
            WrenchIQ Intelligence
          </span>
          {llmProfile && (
            <span
              title="Which LLM endpoint is currently active — switch it under Settings → Integrations → AI Engine"
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
                padding: "2px 6px", borderRadius: 5,
                background: llmProfile === "azure" ? "rgba(56,189,248,0.15)" : "rgba(255,214,10,0.15)",
                color: llmProfile === "azure" ? "#7DD3FC" : COLORS.gold,
                border: `1px solid ${llmProfile === "azure" ? "rgba(56,189,248,0.35)" : "rgba(255,214,10,0.3)"}`,
              }}
            >
              {llmProfile === "azure" ? "Microsoft/OpenAI" : "PrediiLLM"}
            </span>
          )}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 2 }}>
            <button
              onClick={() => setPhase("health")}
              disabled={phase === "health"}
              title="Home — back to the launch/connections screen"
              style={{
                background: "transparent", border: "none",
                cursor: phase === "health" ? "default" : "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: phase === "health" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
              }}
            >
              <Home size={14} />
            </button>
            <button
              onClick={() => setNotificationsVisible((v) => !v)}
              title={notificationsVisible ? "Hide notifications" : "Show notifications"}
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: notificationsVisible ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)",
              }}
            >
              {notificationsVisible ? <Bell size={14} /> : <BellOff size={14} />}
            </button>
            <button
              onClick={() => setPhase("shopChat")}
              disabled={phase === "shopChat"}
              title="Ask WrenchIQ — shop-wide chat grounded in canned jobs, Shop Profile, and any named customer's history"
              style={{
                background: "transparent", border: "none",
                cursor: phase === "shopChat" ? "default" : "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: phase === "shopChat" ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)",
              }}
            >
              <MessagesSquare size={14} />
            </button>
            <button
              onClick={openSurfaceC}
              title="Open SMS/DMS Representative (Surface C)"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <ExternalLink size={14} />
            </button>
            <button
              onClick={openSurfaceASettings}
              title="Open WrenchIQ settings"
              style={{
                background: "transparent", border: "none",
                cursor: "pointer", padding: 4, borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "rgba(255,255,255,0.4)",
              }}
            >
              <Settings size={14} />
            </button>
          </div>
        </div>

        {phase === "ro" && (
          <>
            <RepairOrderCard ro={storyRO} activeCustomer={activeCustomer} loading={loading} onOpenQueue={() => setPhase("queue")} />

            {activeCustomer && storyRO && (
              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                <TabButton label="Intelligence" icon={Sparkles} active={activeTab === "intelligence"} onClick={() => setActiveTab("intelligence")} />
                <TabButton
                  label={roScorePct != null ? `RO Score · ${roScorePct}%` : "RO Score"}
                  icon={ClipboardCheck}
                  active={activeTab === "roScore"}
                  onClick={() => setActiveTab("roScore")}
                />
                <TabButton label="Chat" icon={MessageCircle} active={activeTab === "chat"} onClick={() => setActiveTab("chat")} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Health check → RO queue → selected RO (WrenchIQ Product Spec v4.0) */}
      {phase === "health" && (
        <HealthCheckScreen onContinue={() => setPhase("queue")} />
      )}

      {phase === "queue" && (
        <RepairOrderQueue onSelect={(id) => { selectCustomer(id); setPhase("ro"); }} />
      )}

      {phase === "shopChat" && <ShopChatScreen customers={customers} />}

      {phase === "ro" && (
        <>
          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
            {!activeCustomer && (
              <EmptyState icon={<Search size={18} color="rgba(255,255,255,0.3)" />} text="No active customer in the data feed yet." />
            )}

            {activeCustomer && loading && !storyRO && (
              <LoadingSkeleton />
            )}

            {activeCustomer && !loading && !storyRO && (
              <EmptyState icon={<AlertTriangle size={18} color="rgba(255,255,255,0.3)" />} text={`No RO detail found for ${activeCustomer.roNumber || activeCustomer.customerName}.`} />
            )}

            {storyRO && activeTab === "intelligence" && (
              <IntelligencePanel key={storyRO.roNumber} ro={storyRO} agentData={agentData} agentLoading={loading} />
            )}

            {storyRO && activeTab === "roScore" && (
              <ROScoreTab key={storyRO.roNumber} ro={storyRO} agentData={agentData} onScoreChange={setRoScorePct} />
            )}

            {storyRO && activeTab === "chat" && (
              <ChatTab key={storyRO.roNumber} ro={storyRO} />
            )}
          </div>

          {/* Notifications — shop activity while you keep working the selected customer.
              Clicking one loads that customer's RO; toggled via the bell icon above. */}
          {notificationsVisible && notifications.length > 0 && (
            <div style={{ padding: "0 18px 8px", flexShrink: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={n.customerId ? () => selectCustomer(n.customerId) : undefined}
                  style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.18)",
                borderRadius: 8, padding: "7px 10px",
                cursor: n.customerId ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { if (n.customerId) e.currentTarget.style.background = "rgba(34,197,94,0.12)"; }}
              onMouseLeave={(e) => { if (n.customerId) e.currentTarget.style.background = "rgba(34,197,94,0.06)"; }}
            >
              <Sparkles size={11} color="#4ADE80" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#86EFAC" }}>{n.title}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.35 }}>{n.body}</div>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {timeAgo(n.at)}
              </span>
            </div>
          ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Collapsed view of the RO Queue (WrenchIQ Product Spec v4.0 §3) — a pure
// summary bar. Clicking it navigates back to the shared RepairOrderQueue
// screen (phase="queue" in WrenchIQSidecarScreen) rather than owning a
// second, separate list UI.
function RepairOrderCard({ ro, activeCustomer, loading, onOpenQueue }) {
  const cust = ro?._customer;
  const veh = ro?._vehicle;
  const displayName = cust?.firstName
    ? `${cust.firstName} ${cust.lastName}`
    : activeCustomer?.customerName || (loading ? "Loading…" : "Select a customer");
  const roNumber = ro?.roNumber || activeCustomer?.roNumber;
  const vehicleLine = veh?.make
    ? `${veh.year} ${veh.make} ${veh.model}`
    : activeCustomer?.vehicle
      ? `${activeCustomer.vehicle.year || ""} ${activeCustomer.vehicle.make || ""} ${activeCustomer.vehicle.model || ""}`.trim()
      : null;

  return (
    <button
      onClick={onOpenQueue}
      title="Show the RO queue"
      style={{
        display: "block", width: "100%", textAlign: "left", cursor: "pointer",
        background: "rgba(255,255,255,0.05)", borderRadius: 10,
        border: "none", borderLeft: `3px solid ${COLORS.accent}`,
        padding: "10px 13px", boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {ro?.status && (
            <span style={{
              fontSize: 10, fontWeight: 800, color: COLORS.accent,
              background: "rgba(255,255,255,0.07)", borderRadius: 4,
              padding: "2px 7px", letterSpacing: "0.06em", flexShrink: 0,
            }}>
              {ro.status.replace(/_/g, " ").toUpperCase()}
            </span>
          )}
          <span style={{
            fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {roNumber || "No RO selected"}
          </span>
        </div>
        <ChevronDown size={14} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0, transform: "rotate(-90deg)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <span style={{
          fontSize: 15, fontWeight: 800, color: "#F1F5F9",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {displayName}
        </span>
        {ro?.totalEstimate != null && (
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.accent, flexShrink: 0 }}>
            {fmtMoney(ro.totalEstimate)}
          </span>
        )}
      </div>

      {vehicleLine && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{vehicleLine}</div>
      )}
    </button>
  );
}

function TabButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.4)",
        fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 10, padding: "48px 16px", textAlign: "center",
    }}>
      {icon}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      {[80, 60, 90, 45].map((w, i) => (
        <div key={i} style={{
          height: 10, borderRadius: 4,
          background: "rgba(34,197,94,0.12)",
          width: `${w}%`,
          animation: "pulse 1.4s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
    </div>
  );
}

function StagedCustomerText({ ro, agentData }) {
  const [status, setStatus] = useState(ro.agenticTextStatus || "staged");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const originalMessage = agentData?.suggestedCustomerMessage || ro.agenticCustomerText;
  const [draft, setDraft] = useState(originalMessage);

  // Keep the draft in sync as the AI message arrives/changes — but never
  // clobber text the advisor is actively editing.
  useEffect(() => {
    if (!editing) setDraft(originalMessage);
  }, [originalMessage, editing]);

  if (!draft) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function handleSend() {
    setSending(true);
    try {
      await updateStoryRO(ro.roNumber, { agenticTextStatus: "sent", agenticCustomerText: draft });
      setStatus("sent");
    } catch {
      // best-effort — leave status as-is so the advisor can retry
    } finally {
      setSending(false);
    }
  }

  async function handleSaveEdit() {
    setSaving(true);
    try {
      await updateStoryRO(ro.roNumber, { agenticCustomerText: draft });
    } catch {
      // best-effort — the edited draft still stays in local state
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleCancelEdit() {
    setDraft(originalMessage);
    setEditing(false);
  }

  const sent = status === "sent";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "11px 13px", marginBottom: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Suggested Message to Customer
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!editing && !sent && (
            <button
              onClick={() => setEditing(true)}
              title="Edit message"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "transparent", border: "none", cursor: "pointer",
                padding: 2, color: "rgba(255,255,255,0.35)",
              }}
            >
              <Pencil size={11} />
            </button>
          )}
          <span style={{
            fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 6px",
            textTransform: "uppercase", letterSpacing: "0.04em",
            background: sent ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.12)",
            color: sent ? "#4ADE80" : "#FBBF24",
          }}>
            {sent ? "Sent" : "Staged"}
          </span>
        </div>
      </div>

      {editing ? (
        <>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            style={{
              width: "100%", minHeight: 90, resize: "vertical", boxSizing: "border-box",
              margin: "0 0 9px", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.5,
              background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 6, padding: "8px 9px", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
            <button
              onClick={handleSaveEdit}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: COLORS.accent, border: "none", borderRadius: 6,
                padding: "5px 10px", cursor: saving ? "default" : "pointer",
                fontSize: 11, fontWeight: 600, color: "#fff", opacity: saving ? 0.6 : 1,
              }}
            >
              <Check size={12} />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 6, padding: "5px 10px", cursor: "pointer",
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
              }}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </>
      ) : (
        splitIntoParagraphs(draft).map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? "0 0 8px" : "0 0 9px", fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>
            {para}
          </p>
        ))
      )}

      {!editing && (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleCopy}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6, padding: "5px 10px", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.7)",
            }}
          >
            {copied ? <Check size={12} color="#4ADE80" /> : <Clipboard size={12} />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={handleSend}
            disabled={sent || sending}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: sent ? "rgba(74,222,128,0.12)" : COLORS.accent,
              border: "none", borderRadius: 6, padding: "5px 10px",
              cursor: sent || sending ? "default" : "pointer",
              fontSize: 11, fontWeight: 600, color: sent ? "#4ADE80" : "#fff",
              opacity: sending ? 0.6 : 1,
            }}
          >
            {sent ? <Check size={12} /> : <Send size={12} />}
            {sent ? "Sent to Customer" : sending ? "Sending…" : `Text ${ro._customer?.firstName || "Customer"}`}
          </button>
        </div>
      )}
    </div>
  );
}

const RO_SCORE_STATUS_CYCLE = { pending: "done", done: "na", na: "pending" };

const RO_SCORE_STATUS_STYLE = {
  done:    { icon: Check,       color: "#4ADE80", bg: "rgba(74,222,128,0.15)" },
  na:      { icon: CircleSlash, color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.06)" },
  pending: { icon: Circle,      color: "rgba(255,255,255,0.3)", bg: "transparent" },
};

const AI_STATUS_STYLE = {
  met:      { label: "AI: Met",      color: "#4ADE80", bg: "rgba(74,222,128,0.12)" },
  not_met:  { label: "AI: Not Met",  color: "#F87171", bg: "rgba(248,113,113,0.12)" },
  unclear:  { label: "AI: Unclear",  color: "#FBBF24", bg: "rgba(250,204,21,0.1)" },
};

// RO Score — Gold Standard checklist for this specific RO. Read against the
// shop's guideline definitions (server/routes/goldStandardChecklist.js),
// but the checked/N-A state below is scoped to this RO — a live
// checklist/reminder the advisor works through, not a shop-wide setting.
// WrenchIQ also auto-scores the RO on open (using the RO record + conversation
// fields + Intelligence findings) and surfaces its read as an "AI:" suggestion
// per item — the advisor's own tap always remains the source of truth.
function ROScoreTab({ ro, agentData, onScoreChange }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiScoring, setAiScoring] = useState(false);

  const shopId = ro.shopId || "shop-001";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_BASE}/api/ro-gold-standard-score/${shopId}/${ro.roNumber}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setItems(data.items || []); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [shopId, ro.roNumber]);

  useEffect(() => {
    let cancelled = false;
    setAiScoring(true);
    fetch(`${API_BASE}/api/ro-gold-standard-score/${shopId}/${ro.roNumber}/auto-score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ro: {
          ...ro,
          customerId: ro._customer?.id,
        },
        customer: ro._customer,
        vehicle: ro._vehicle,
        agentData,
      }),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled && data.items) setItems(data.items); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setAiScoring(false); });
    return () => { cancelled = true; };
    // Re-run once the Intelligence agent's findings arrive so the score can use them as "conversation" evidence.
  }, [shopId, ro.roNumber, agentData]);

  function setItemStatus(itemId, nextStatus) {
    setItems((prev) => prev.map((it) => (it.id === itemId ? { ...it, status: nextStatus } : it)));
    fetch(`${API_BASE}/api/ro-gold-standard-score/${shopId}/${ro.roNumber}/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
  }

  function advance(itemId) {
    const current = items.find((it) => it.id === itemId);
    setItemStatus(itemId, RO_SCORE_STATUS_CYCLE[current.status] || "done");
  }

  // Advisor's own status always wins once set; until then, fall back to
  // WrenchIQ's AI suggestion so the score reflects the AI's read of the RO
  // rather than sitting at 0% before anyone has reviewed the checklist.
  const effectiveStatus = (it) => (it.status !== "pending" ? it.status : (it.aiStatus === "met" ? "done" : it.status));

  const applicable = (items || []).filter((it) => effectiveStatus(it) !== "na");
  const met = applicable.filter((it) => effectiveStatus(it) === "done").length;
  const pct = applicable.length > 0 ? Math.round((met / applicable.length) * 100) : 0;

  useEffect(() => {
    onScoreChange?.(items && items.length > 0 ? pct : null);
  }, [items, pct, onScoreChange]);

  if (loading || items === null) return <LoadingSkeleton />;

  if (items.length === 0) {
    return <EmptyState icon={<ClipboardCheck size={18} color="rgba(255,255,255,0.3)" />} text="No Gold Standard guidelines configured for this shop yet." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: "12px 14px",
      }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            RO Score
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
            {met} of {applicable.length} Gold Standard guidelines met
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 80 ? "#4ADE80" : pct >= 50 ? "#FBBF24" : "#F87171" }}>
          {pct}%
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
        <Sparkles size={10} color={aiScoring ? "#86EFAC" : "rgba(255,255,255,0.25)"} style={{ flexShrink: 0 }} />
        {aiScoring
          ? "WrenchIQ is reviewing this RO and its conversation against the Gold Standard…"
          : "Tap an item to cycle Pending → Met → N/A, or Accept a WrenchIQ suggestion below."}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => {
          const style = RO_SCORE_STATUS_STYLE[it.status] || RO_SCORE_STATUS_STYLE.pending;
          const StatusIcon = style.icon;
          const aiStyle = it.aiStatus ? AI_STATUS_STYLE[it.aiStatus] : null;
          const canAccept = it.aiStatus === "met" && it.status !== "done";
          return (
            <div
              key={it.id}
              style={{
                display: "flex", gap: 10, alignItems: "flex-start",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8, padding: "10px 12px",
              }}
            >
              <button
                onClick={() => advance(it.id)}
                style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: style.bg, cursor: "pointer", padding: 0,
                  border: `1.5px solid ${it.status === "done" ? "#4ADE80" : "rgba(255,255,255,0.2)"}`,
                }}
              >
                <StatusIcon size={11} color={style.color} />
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, lineHeight: 1.4,
                    color: it.status === "na" ? "rgba(255,255,255,0.35)" : "#F1F5F9",
                    textDecoration: it.status === "na" ? "line-through" : "none",
                  }}>
                    {it.guideline}
                  </div>
                  {aiStyle && (
                    <span style={{
                      flexShrink: 0, fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                      letterSpacing: "0.03em", textTransform: "uppercase",
                      background: aiStyle.bg, color: aiStyle.color,
                    }}>
                      {aiStyle.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.4, marginTop: 3 }}>
                  {it.whatA5LooksLike}
                </div>
                {it.aiEvidence && (
                  <div style={{ fontSize: 10, color: "rgba(134,239,172,0.7)", lineHeight: 1.4, marginTop: 4, fontStyle: "italic" }}>
                    WrenchIQ: {it.aiEvidence}
                  </div>
                )}
                {canAccept && (
                  <button
                    onClick={() => setItemStatus(it.id, "done")}
                    style={{
                      marginTop: 6, fontSize: 10, fontWeight: 700, color: "#4ADE80",
                      background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
                      borderRadius: 5, padding: "3px 8px", cursor: "pointer",
                    }}
                  >
                    Accept — mark Met
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Editable "talk track" quote under a Service Recommendation. Persisted per-RO
// per-service-name in talkTrackOverrides (server/routes/repairOrders.js), since
// serviceRecommendations itself is recomputed live on every /api/ro-advisor call
// and has no other stable per-item identity to key an edit against.
function TalkTrackText({ ro, service, talkTrack }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const original = ro.talkTrackOverrides?.[service] || talkTrack;
  const [draft, setDraft] = useState(original);

  useEffect(() => {
    if (!editing) setDraft(original);
  }, [original, editing]);

  async function handleSave() {
    setSaving(true);
    try {
      const nextOverrides = { ...(ro.talkTrackOverrides || {}), [service]: draft };
      await updateStoryRO(ro.roNumber, { talkTrackOverrides: nextOverrides });
      ro.talkTrackOverrides = nextOverrides; // keep in sync locally until next fetch
    } catch {
      // best-effort — the edited draft still stays in local state
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  function handleCancel() {
    setDraft(original);
    setEditing(false);
  }

  if (editing) {
    return (
      <div>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          autoFocus
          style={{
            width: "100%", minHeight: 60, resize: "vertical", boxSizing: "border-box",
            fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.5,
            background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: 6, padding: "7px 8px", fontFamily: "inherit", marginBottom: 6,
          }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: COLORS.accent, border: "none", borderRadius: 5,
              padding: "3px 8px", cursor: saving ? "default" : "pointer",
              fontSize: 10, fontWeight: 700, color: "#fff", opacity: saving ? 0.6 : 1,
            }}
          >
            <Check size={10} />
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5, padding: "3px 8px", cursor: "pointer",
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)",
            }}
          >
            <X size={10} />
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      title="Click to edit"
      style={{
        display: "flex", alignItems: "flex-start", gap: 6, cursor: "pointer",
        borderLeft: "2px solid rgba(59,130,246,0.4)", paddingLeft: 8,
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, fontStyle: "italic", flex: 1 }}>
        "{draft}"
      </div>
      <Pencil size={10} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0, marginTop: 3 }} />
    </div>
  );
}

// ServiceRecommendationCard — per-recommendation accept flow (WrenchIQ
// Product Spec v3.0 §5/§7): advisor accepts a recommendation → a simulated
// parts/labor catalog search resolves one match → confirming appends a real
// job to the RO's repairJobs. Distinct from the bulk "Transfer to SE" button
// above, which only simulates pushing everything to the SMS and never writes
// to the story RO itself.
function ServiceRecommendationCard({ ro, rec, accepted, onConfirm }) {
  const [phase, setPhase] = useState("idle"); // idle | searching | resolved
  const [match, setMatch] = useState(null);

  function handleAccept() {
    setPhase("searching");
    setTimeout(() => {
      setMatch(simulateCatalogMatch(rec.service, rec.estimatedCost));
      setPhase("resolved");
    }, 700);
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 6, padding: "9px 11px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#F1F5F9", flex: 1, marginRight: 8 }}>
          {rec.service}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#93C5FD" }}>
            ~${rec.estimatedCost}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
            background: rec.confidence === "high" ? "rgba(74,222,128,0.15)" : "rgba(250,204,21,0.12)",
            color: rec.confidence === "high" ? "#4ADE80" : "#FBBF24",
          }}>
            {rec.confidence}
          </span>
        </div>
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.4 }}>
        {rec.reason}
      </div>
      {rec.talkTrack && <TalkTrackText ro={ro} service={rec.service} talkTrack={rec.talkTrack} />}

      {accepted ? (
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, fontSize: 11, fontWeight: 700, color: "#4ADE80" }}>
          <Check size={12} /> Added to RO
        </div>
      ) : phase === "idle" ? (
        <button
          onClick={handleAccept}
          style={{
            marginTop: 8, display: "flex", alignItems: "center", gap: 5,
            background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
            borderRadius: 6, padding: "4px 9px", cursor: "pointer",
            fontSize: 10, fontWeight: 700, color: "#4ADE80",
          }}
        >
          <Check size={11} /> Accept
        </button>
      ) : phase === "searching" ? (
        <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
          Searching parts/labor catalog…
        </div>
      ) : (
        <div style={{
          marginTop: 8, padding: "8px 9px", borderRadius: 6,
          background: "rgba(147,197,253,0.08)", border: "1px solid rgba(147,197,253,0.2)",
        }}>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 6 }}>
            Matched {match.candidateCount} candidate results → picked <strong>{match.partNumber}</strong> · {match.laborHrs} hrs labor
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", fontSize: 9.5, color: "rgba(255,255,255,0.4)", lineHeight: 1.4, marginBottom: 8 }}>
            <Info size={11} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Simulated match — no live parts/labor catalog integration exists yet.</span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onConfirm(rec, match)}
              style={{
                background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)",
                borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                fontSize: 10, fontWeight: 700, color: "#4ADE80",
              }}
            >
              Confirm & Add to RO
            </button>
            <button
              onClick={() => setPhase("idle")}
              style={{
                background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.5)",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IntelligencePanel({ ro, agentData, agentLoading }) {
  const cust = ro._customer;
  const { smsName } = useDemo(); // shop's selected SMS/DMS (Settings → Learn → Integrations), defaults to Mitchell1 ShopManager SE
  const [transferOpen, setTransferOpen] = useState(false);
  const [acceptedServices, setAcceptedServices] = useState(new Set());
  // Jobs added this session, kept locally so back-to-back accepts append onto
  // each other correctly without needing a refetch of `ro` between clicks.
  const [addedJobs, setAddedJobs] = useState([]);

  async function handleConfirmRecommendation(rec, match) {
    const newJob = {
      description: rec.service,
      laborHours: match.laborHrs,
      actualLaborHours: 0,
      lineCost: match.laborCost + match.partCost,
      parts: [{ description: `${rec.service} — ${match.partNumber}`, lineCost: match.partCost }],
      status: "pending",
    };
    const nextAddedJobs = [...addedJobs, newJob];
    setAddedJobs(nextAddedJobs);
    setAcceptedServices(prev => new Set(prev).add(rec.service));
    try {
      await updateStoryRO(ro.roNumber, { repairJobs: [...(ro.repairJobs || []), ...nextAddedJobs] });
    } catch {
      // best-effort — the card still reflects "added" locally; a stale PATCH
      // here doesn't undo the advisor's decision, matching this screen's
      // existing best-effort convention for RO mutations (see StagedCustomerText).
    }
  }

  const hasNothing = !agentLoading && !agentData?.advisorBrief
    && (agentData?.serviceRecommendations || []).length === 0
    && (agentData?.alerts || []).length === 0
    && (agentData?.ings || []).length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Concern ──────────────────────────────────────────────────── */}
      {ro.customerConcern && (
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "11px 13px",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, fontStyle: "italic" }}>
            "{ro.customerConcern}"
          </p>
        </div>
      )}

      {/* ── Live agent output ─────────────────────────────────────────── */}
      <div style={{
        background: "rgba(34,197,94,0.06)",
        border: `1px solid ${agentLoading ? "rgba(34,197,94,0.3)" : "rgba(34,197,94,0.18)"}`,
        borderRadius: 8, padding: "12px 14px",
        transition: "border-color 0.3s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Sparkles size={13} color="#4ADE80" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#86EFAC", lineHeight: 1.4 }}>
            {agentLoading
              ? `AI Agent reviewing ${cust?.firstName || "the customer"}'s profile to make customized recommendations…`
              : `AI Agent reviewed ${cust?.firstName || "the customer"}'s profile to make customized recommendations`}
          </span>
        </div>

        {agentLoading && !agentData && <LoadingSkeleton />}

        <StagedCustomerText ro={ro} agentData={agentData} />

        {agentData?.advisorBrief && (
          <div style={{
            fontSize: 12, color: "#86EFAC", lineHeight: 1.55, marginBottom: 10,
            fontStyle: "italic", padding: "8px 10px",
            background: "rgba(34,197,94,0.08)", borderRadius: 6,
          }}>
            {agentData.advisorBrief}
          </div>
        )}

        {agentData?.marginCheck?.status && (
          <div style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "7px 10px", marginBottom: 10, borderRadius: 6,
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 6px",
              letterSpacing: "0.04em", textTransform: "uppercase", flexShrink: 0,
              background: agentData.marginCheck.status === "on-target" ? "rgba(74,222,128,0.15)"
                : agentData.marginCheck.status === "at-risk" ? "rgba(250,204,21,0.12)" : "rgba(248,113,113,0.15)",
              color: agentData.marginCheck.status === "on-target" ? "#4ADE80"
                : agentData.marginCheck.status === "at-risk" ? "#FBBF24" : "#F87171",
            }}>
              Margin {agentData.marginCheck.status.replace("-", " ")}
            </span>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
              {agentData.marginCheck.marginPct}% vs {agentData.marginCheck.target}% target
            </span>
          </div>
        )}

        {agentData?.aroGap?.gapAmount > 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginBottom: 10, lineHeight: 1.45 }}>
            <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.gapAmount)}</strong> below ARO target
            {agentData.aroGap.recommendationsCoverAmount > 0 && (
              <> — these recommendations would close <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.recommendationsCoverAmount)}</strong> of it</>
            )}
          </div>
        )}

        {(agentData?.alerts || []).length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(252,211,77,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Alerts
            </div>
            {agentData.alerts.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < agentData.alerts.length - 1 ? "1px solid rgba(252,211,77,0.08)" : "none",
              }}>
                <AlertTriangle size={11} color="#FCD34D" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {hasNothing && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
            No intelligence signals for this RO right now.
          </div>
        )}
      </div>

      {/* ── Service Recommendations — distinct blue panel ──────────────── */}
      {(agentData?.serviceRecommendations || []).length > 0 && (
        <div style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Service Recommendations
            </div>
            <button
              onClick={() => setTransferOpen(true)}
              disabled={addedJobs.length === 0}
              title={addedJobs.length === 0
                ? "Accept at least one recommendation first"
                : `Simulate sending ${addedJobs.length} accepted recommendation${addedJobs.length === 1 ? "" : "s"} to ${smsName}`}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: addedJobs.length === 0 ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6, padding: "4px 9px",
                cursor: addedJobs.length === 0 ? "default" : "pointer",
                fontSize: 10, fontWeight: 700,
                color: addedJobs.length === 0 ? "rgba(147,197,253,0.35)" : "#93C5FD",
              }}
            >
              <ArrowRightLeft size={11} />
              Transfer to {smsName}{addedJobs.length > 0 ? ` (${addedJobs.length})` : ""}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agentData.serviceRecommendations.map((u, i) => (
              <ServiceRecommendationCard
                key={i}
                ro={ro}
                rec={u}
                accepted={acceptedServices.has(u.service)}
                onConfirm={handleConfirmRecommendation}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Strategic Priorities — distinct purple panel ────────────────── */}
      {(agentData?.ings || []).length > 0 && (
        <div style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#D8B4FE", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Strategic Priorities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[...agentData.ings].sort((a, b) => (b.applies ? 1 : 0) - (a.applies ? 1 : 0)).map((ing, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < agentData.ings.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <span style={{
                  fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 5px", flexShrink: 0, marginTop: 2,
                  letterSpacing: "0.04em", textTransform: "uppercase",
                  background: ing.applies ? "rgba(216,180,254,0.18)" : "rgba(255,255,255,0.06)",
                  color: ing.applies ? "#D8B4FE" : "rgba(255,255,255,0.35)",
                }}>
                  {ing.applies ? "Applies" : "N/A"}
                </span>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", lineHeight: 1.45 }}>{ing.note}</div>
                  {ing.reason && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2, lineHeight: 1.4 }}>{ing.reason}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {transferOpen && (
        <TransferSimulationModal
          repairOrderId={ro.roNumber}
          acceptedJobs={addedJobs}
          smsName={smsName}
          onClose={() => setTransferOpen(false)}
        />
      )}
    </div>
  );
}

// V5 feedback (D2): one-click tasks scoped to the RO already open in the
// sidecar, so the advisor never re-types context the app already has.
// "Look up a price/symptom" lean on the shop's canned-job pricing once A1
// (Predii Learn → canned jobs) ships; until then the assistant's own
// system prompt rule against inventing prices/parts keeps replies honest
// about what's actually on file.
function buildPresetTasks(ro) {
  const concern = ro.customerConcern;
  const serviceNames = (ro.services || []).map((s) => s.name).filter(Boolean);
  const primaryService = serviceNames[0];
  const tasks = [];

  if (concern) {
    tasks.push({
      id: "rewriteConcern",
      label: "Rewrite concern",
      icon: Pencil,
      prompt: `Rewrite this customer concern for the RO record in clear, professional automotive language:\n"${concern}"`,
    });
    tasks.push({
      id: "rewriteCCC",
      label: "Rewrite CCC",
      icon: FileText,
      prompt: `Using this RO, write it up as a proper Complaint / Cause / Correction.\nComplaint (customer's own words): "${concern}"\nServices performed or recommended on this RO: ${serviceNames.join(", ") || "none listed"}\nWrite three short labeled sections: Complaint, Cause, Correction.`,
    });
    // A genuinely multi-step task (root-cause reasoning + real pricing lookup
    // + tone-constrained customer copy, all in one structured answer) — sent
    // to both tiers at once so the reasoning-quality gap is directly visible
    // rather than asserted.
    tasks.push({
      id: "deepDiagnosisCompare",
      label: "Deep diagnosis (compare models)",
      icon: Layers,
      compare: true,
      prompt: `Do a full diagnosis writeup for this RO in three clearly labeled sections:\n1. Diagnosis Reasoning — the most likely root cause(s) for the customer's concern, reasoned from the vehicle and concern given.\n2. Recommended Job(s) & Price — which job(s) on our canned job menu address it, with the exact price.\n3. Customer Message — a warm, Gold Standard customer-facing message explaining the finding, price, and urgency.\nConcern: "${concern}"`,
    });
  }

  tasks.push({
    id: "lookUpPrice",
    label: "Look up a price",
    icon: DollarSign,
    prompt: primaryService
      ? `What's our shop's typical price for "${primaryService}"? Use our canned job pricing if we have one on file for it.`
      : `What's our shop's typical price for an oil change? Use our canned job pricing if we have one on file.`,
  });
  tasks.push({
    id: "lookUpSymptom",
    label: "Look up a symptom",
    icon: Stethoscope,
    prompt: concern
      ? `A customer describes this symptom: "${concern}". Based on our shop profile, what's the likely related repair, and do we have a canned job for it?`
      : `A customer says their car makes a grinding noise when braking. What's the likely related repair, and do we have a canned job for it?`,
  });

  // Free-chat capability: summarize this customer's real visit history
  // (server-side lookup — see roChat.js's loadCustomerHistory), not a guess.
  const customerName = ro._customer?.firstName || "this customer";
  tasks.push({
    id: "summarizeVisits",
    label: "Summarize past visits",
    icon: History,
    prompt: `Summarize ${customerName}'s past visits — what's been done before, any patterns, and anything worth following up on.`,
  });

  return tasks;
}

// One half of a model-comparison reply — a colored-left-border card with a
// labeled header, its own copy button, and an optional fallback notice.
function ComparisonReplyBlock({ label, color, textColor, text, notice, copyKey, copiedKey, onCopy }) {
  const copied = copiedKey === copyKey;
  return (
    <div style={{
      borderLeft: `3px solid ${color}`, borderRadius: 8, padding: "8px 11px",
      background: "rgba(255,255,255,0.05)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: textColor, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
        <button
          onClick={() => onCopy(text, copyKey)}
          title="Copy this reply"
          style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "transparent", border: "none", cursor: "pointer", padding: 0,
            color: copied ? "#4ADE80" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600,
          }}
        >
          {copied ? <Check size={11} /> : <Clipboard size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.8)", whiteSpace: "pre-wrap" }}>
        {text}
      </div>
      {notice && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6, fontStyle: "italic" }}>
          {notice}
        </div>
      )}
    </div>
  );
}

// Shop-wide preset tasks — parallels buildPresetTasks (RO Chat) but scoped
// to the whole shop instead of one RO. "Summarize past visits" only appears
// once a customer is actually selected in the dropdown.
function buildShopPresetTasks(selectedCustomerName) {
  const tasks = [
    {
      id: "shopPerformance",
      label: "Shop performance",
      icon: Layers,
      prompt: "Summarize this shop's overall performance — RO count, average RO value, margin, and top repair jobs.",
    },
    {
      id: "topCannedJobs",
      label: "Top canned jobs",
      icon: DollarSign,
      prompt: "What are our most common canned jobs and their prices?",
    },
    {
      id: "seasonalTrends",
      label: "Seasonal trends",
      icon: Stethoscope,
      prompt: "What seasonal patterns should we be planning around right now?",
    },
  ];
  if (selectedCustomerName) {
    tasks.push({
      id: "summarizeVisits",
      label: `Summarize ${selectedCustomerName}'s visits`,
      icon: History,
      prompt: `Summarize ${selectedCustomerName}'s past visits — what's been done before, any patterns, and anything worth following up on.`,
    });
  }
  return tasks;
}

// ShopChatScreen — shop-wide chat, no RO needs to be open. Ask anything
// grounded in the canned-job menu, the persisted Shop Profile, and (if
// selected) a specific customer's real visit history. Always the default
// Predii LLM — no frontier-model tier here (see server/services/shopChatService.js).
// Toggles between predefined shop-wide tasks and a fully custom question,
// same "always accessible" pattern as the RO Chat's task strip.
function ShopChatScreen({ customers = [] }) {
  const { shopName, activeShopId } = useDemo();
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [chatMode, setChatMode] = useState("tasks"); // "tasks" | "custom"
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [copiedKey, setCopiedKey] = useState(null);
  const scrollRef = useRef(null);

  const selectedCustomer = customers.find((c) => c.customerId === selectedCustomerId) || null;
  const presetTasks = buildShopPresetTasks(selectedCustomer?.customerName);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  async function handleCopy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((v) => (v === key ? null : v)), 1500);
    } catch {}
  }

  async function sendMessage(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/shop-chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: trimmed, history,
          shopId: activeShopId, shopName,
          customerId: selectedCustomer?.customerId || undefined,
          customerName: selectedCustomer?.customerName || undefined,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "…" }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't reach the assistant just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 18px", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Ask WrenchIQ · {shopName || "this shop"}
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2 }}>
          {[{ id: "tasks", label: "Tasks" }, { id: "custom", label: "Custom" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setChatMode(m.id)}
              style={{
                padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                fontSize: 10, fontWeight: 700,
                background: chatMode === m.id ? COLORS.accent : "transparent",
                color: chatMode === m.id ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <select
        value={selectedCustomerId}
        onChange={(e) => setSelectedCustomerId(e.target.value)}
        title="Select a customer to include their real visit history — leave unselected to ask across the whole shop"
        style={{
          flexShrink: 0, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 8, padding: "7px 10px", color: "#fff", fontSize: 12, outline: "none",
        }}
      >
        <option value="" style={{ color: "#000" }}>No customer selected — ask across the whole shop</option>
        {customers.map((c) => (
          <option key={c.customerId} value={c.customerId} style={{ color: "#000" }}>{c.customerName}</option>
        ))}
      </select>

      {chatMode === "tasks" && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flexShrink: 0 }}>
          {presetTasks.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => sendMessage(t.prompt)}
                disabled={sending}
                title={t.label}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 7, padding: "6px 10px", cursor: sending ? "default" : "pointer",
                  fontSize: 11, fontWeight: 700, color: "#86EFAC",
                }}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {chatMode === "tasks"
              ? "Tap a task above, or switch to Custom to ask anything in your own words."
              : "Ask anything grounded in this shop's canned-job pricing, Shop Profile, or (if selected above) a customer's real visit history. Works in English and Spanish. Always runs on Predii's default model."}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 3 }}>
            <div style={{
              maxWidth: "85%", borderRadius: 10, padding: "8px 11px", fontSize: 12, lineHeight: 1.5,
              background: m.role === "user" ? COLORS.accent : "rgba(255,255,255,0.06)",
              color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
              whiteSpace: "pre-wrap",
            }}>
              {m.text}
            </div>
            {m.role === "assistant" && (
              <button
                onClick={() => handleCopy(m.text, `${i}`)}
                title="Copy this reply"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "transparent", border: "none", cursor: "pointer", padding: "0 2px",
                  color: copiedKey === `${i}` ? "#4ADE80" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600,
                }}
              >
                {copiedKey === `${i}` ? <Check size={11} /> : <Clipboard size={11} />}
                {copiedKey === `${i}` ? "Copied" : "Copy"}
              </button>
            )}
          </div>
        ))}

        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ borderRadius: 10, padding: "8px 11px", background: "rgba(255,255,255,0.06)", width: 60 }}>
              <LoadingSkeleton />
            </div>
          </div>
        )}
      </div>

      {chatMode === "custom" && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about this shop's pricing, patterns, or the selected customer…"
            rows={2}
            style={{
              flex: 1, resize: "none", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 12,
              fontFamily: "inherit", outline: "none",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            title="Send"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: COLORS.accent, border: "none", borderRadius: 8,
              width: 36, flexShrink: 0,
              cursor: sending || !input.trim() ? "default" : "pointer",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}

// ChatTab — small bilingual (EN/ES) rewrite assistant scoped to the active
// RO. Not a general chatbot: its one job is turning rough text (customer
// words, tech shorthand) into correct "automotive speak" in either
// direction, grounded in this RO's shop/vehicle/service context (see
// server/services/roChatService.js for the system prompt).
function ChatTab({ ro }) {
  const [messages, setMessages] = useState([]);
  // D1: pre-fill the customer concern already on the RO instead of making
  // the advisor paste it in — still editable/clearable before sending.
  const [input, setInput] = useState(ro.customerConcern || "");
  const [sending, setSending] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptLoading, setPromptLoading] = useState(false);
  // D2 follow-up: copy-to-clipboard on assistant replies — key of whichever
  // reply is currently showing "Copied" ("<msgIndex>" for a normal reply,
  // "<msgIndex>-predii"/"-frontier" for a comparison's two halves), reverts
  // after a beat.
  const [copiedKey, setCopiedKey] = useState(null);
  // V5 feedback (D3): optional frontier-model tier alongside the default
  // Predii LLM — same Azure-backed pipeline, different deployment (see
  // server/config.js FRONTIER_MODEL / roChatService.js resolveModelTier).
  const [modelTier, setModelTier] = useState("predii");
  const [showFrontierDisclaimer, setShowFrontierDisclaimer] = useState(false);
  // Completion-token budget for complex tasks — server default is 2000
  // (server/config.js RO_CHAT_MAX_TOKENS) since reasoning models spend part
  // of it on hidden reasoning before writing a visible reply; exposed here
  // so an advisor can raise it further for a genuinely long ask, or lower it
  // for a quick rewrite.
  const [maxTokens, setMaxTokens] = useState(2000);
  // Reflects whatever's actually configured in .env.local (e.g. gpt-5.4-mini
  // today) instead of a hardcoded model name that drifts out of sync.
  const [frontierModel, setFrontierModel] = useState(null);
  // Same Tasks/Custom split as ShopChatScreen (Ask WrenchIQ) — one-click
  // presets vs. a fully custom question, kept consistent across both chat
  // surfaces instead of always showing both at once.
  const [chatMode, setChatMode] = useState("tasks"); // "tasks" | "custom"
  const scrollRef = useRef(null);

  const shop = ro.shop || { name: "the shop" };
  const customer = ro._customer;
  const vehicle = ro._vehicle;
  const presetTasks = buildPresetTasks(ro);

  useEffect(() => {
    fetch(`${API_BASE}/api/ro-chat/frontier-info`)
      .then((r) => r.json())
      .then((data) => setFrontierModel(data.model || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  function togglePrompt() {
    if (systemPrompt) { setShowPrompt((v) => !v); return; }
    setPromptLoading(true);
    fetch(`${API_BASE}/api/ro-chat/system-prompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ro, customer, vehicle, shop }),
    })
      .then((r) => r.json())
      .then((data) => { setSystemPrompt(data.systemPrompt || ""); setShowPrompt(true); })
      .catch(() => {})
      .finally(() => setPromptLoading(false));
  }

  async function sendMessage(text) {
    const trimmed = (text ?? input).trim();
    if (!trimmed || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/ro-chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, ro, customer, vehicle, shop, modelTier, maxTokens }),
      });
      const data = await res.json();
      const notice = data.forcedReason === "pii"
        ? "\n\n(This message mentions customer-identifying info, so it stayed on Predii's model regardless of the tier toggle.)"
        : data.forcedReason === "not_configured"
          ? "\n\n(Frontier model isn't configured on this server yet — this reply came from Predii's model instead.)"
          : "";
      setMessages((prev) => [...prev, { role: "assistant", text: (data.reply || "…") + notice }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't reach the assistant just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleCopy(text, key) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((v) => (v === key ? null : v)), 1500);
    } catch {}
  }

  // Sends the same prompt to both tiers at once and renders them side by
  // side — for tasks meant to demonstrate the frontier model's strength
  // rather than just use whichever tier is currently toggled on.
  async function sendComparisonMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const history = messages;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setSending(true);

    try {
      const call = (tier) => fetch(`${API_BASE}/api/ro-chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: trimmed, history, ro, customer, vehicle, shop, modelTier: tier, maxTokens }),
      }).then((r) => r.json());

      const [predii, frontier] = await Promise.all([call("predii"), call("frontier")]);

      const frontierNotice = frontier.forcedReason === "not_configured"
        ? "Frontier isn't configured on this server yet — this is Predii's model again."
        : frontier.forcedReason === "pii"
          ? "This prompt looked like it had customer-identifying info, so this side also ran on Predii's model."
          : null;

      setMessages((prev) => [...prev, {
        role: "comparison",
        predii: predii.reply || "…",
        frontier: frontier.reply || "…",
        frontierNotice,
      }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't reach the assistant just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          WrenchIQ Assistant · EN / ES
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => {
              if (modelTier === "predii") {
                setShowFrontierDisclaimer(true);
              } else {
                setModelTier("predii");
              }
            }}
            title={modelTier === "frontier" ? "Switch back to Predii LLM" : `Try the frontier model${frontierModel ? ` (${frontierModel})` : ""} for this chat`}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: modelTier === "frontier" ? "rgba(139,92,246,0.15)" : "transparent",
              border: `1px solid ${modelTier === "frontier" ? "#8B5CF6" : "transparent"}`,
              borderRadius: 5, padding: "2px 6px", cursor: "pointer",
              color: modelTier === "frontier" ? "#C4B5FD" : "rgba(255,255,255,0.35)",
              fontSize: 10, fontWeight: 700,
            }}
          >
            <Sparkles size={11} />
            {modelTier === "frontier" ? `Frontier${frontierModel ? ` (${frontierModel})` : ""}` : "Predii LLM"}
          </button>
          <select
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            title="Response length budget — raise it for a complex, multi-step task so the model has room to reason and still write the full answer"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5, padding: "2px 4px", cursor: "pointer",
              color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 700,
            }}
          >
            <option value={500}>Short (500)</option>
            <option value={2000}>Standard (2000)</option>
            <option value={4000}>Long / complex (4000)</option>
          </select>
          <button
            onClick={togglePrompt}
            title="Preview the system prompt sent to the model"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: "transparent", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.35)", fontSize: 10, padding: 0,
            }}
          >
            <Info size={11} />
            {promptLoading ? "Loading…" : showPrompt ? "Hide system prompt" : "View system prompt"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexShrink: 0 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2 }}>
          {[{ id: "tasks", label: "Tasks" }, { id: "custom", label: "Custom" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setChatMode(m.id)}
              style={{
                padding: "3px 10px", borderRadius: 5, border: "none", cursor: "pointer",
                fontSize: 10, fontWeight: 700,
                background: chatMode === m.id ? COLORS.accent : "transparent",
                color: chatMode === m.id ? "#fff" : "rgba(255,255,255,0.4)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {showFrontierDisclaimer && (
        <div style={{
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.4)",
          borderRadius: 8, padding: "10px 12px", fontSize: 11, lineHeight: 1.5,
          color: "rgba(255,255,255,0.75)", flexShrink: 0,
        }}>
          <strong style={{ color: "#C4B5FD" }}>Frontier model{frontierModel ? ` (${frontierModel})` : ""}:</strong> messages you send while this
          tier is on may leave Predii's managed environment. Any message that looks like it contains a
          customer's name, phone, address, or VIN automatically stays on Predii's model instead. +$10/mo.
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              onClick={() => { setModelTier("frontier"); setShowFrontierDisclaimer(false); }}
              style={{ background: "#8B5CF6", color: "#fff", border: "none", borderRadius: 5, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
            >
              Enable for this chat
            </button>
            <button
              onClick={() => setShowFrontierDisclaimer(false)}
              style={{ background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", fontSize: 11, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPrompt && systemPrompt && (
        <pre style={{
          whiteSpace: "pre-wrap", fontSize: 10, lineHeight: 1.5, color: "rgba(255,255,255,0.5)",
          background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "10px 12px", margin: 0, maxHeight: 180, overflowY: "auto",
          fontFamily: "monospace", flexShrink: 0,
        }}>
          {systemPrompt}
        </pre>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            {chatMode === "tasks"
              ? "Tap a task below, or switch to Custom to ask anything in your own words."
              : ro.customerConcern
                ? "This RO's concern is already loaded below — send it as-is, or ask anything grounded in this shop's data (pricing, past visits, seasonal patterns)."
                : "Ask anything grounded in this shop's data — pricing, symptoms, past visits, seasonal patterns. Works in English and Spanish."}
          </div>
        )}

        {messages.map((m, i) => {
          if (m.role === "comparison") {
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <ComparisonReplyBlock
                  label="Predii LLM" color="#4ADE80" textColor="#86EFAC"
                  text={m.predii} copyKey={`${i}-predii`} copiedKey={copiedKey} onCopy={handleCopy}
                />
                <ComparisonReplyBlock
                  label={`Frontier${frontierModel ? ` (${frontierModel})` : ""}`} color="#8B5CF6" textColor="#C4B5FD"
                  text={m.frontier} notice={m.frontierNotice} copyKey={`${i}-frontier`} copiedKey={copiedKey} onCopy={handleCopy}
                />
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 3 }}>
              <div style={{
                maxWidth: "85%", borderRadius: 10, padding: "8px 11px", fontSize: 12, lineHeight: 1.5,
                background: m.role === "user" ? COLORS.accent : "rgba(255,255,255,0.06)",
                color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
                whiteSpace: "pre-wrap",
              }}>
                {m.text}
              </div>
              {m.role === "assistant" && (
                <button
                  onClick={() => handleCopy(m.text, `${i}`)}
                  title="Copy this reply"
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    background: "transparent", border: "none", cursor: "pointer", padding: "0 2px",
                    color: copiedKey === `${i}` ? "#4ADE80" : "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 600,
                  }}
                >
                  {copiedKey === `${i}` ? <Check size={11} /> : <Clipboard size={11} />}
                  {copiedKey === `${i}` ? "Copied" : "Copy"}
                </button>
              )}
            </div>
          );
        })}

        {sending && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ borderRadius: 10, padding: "8px 11px", background: "rgba(255,255,255,0.06)", width: 60 }}>
              <LoadingSkeleton />
            </div>
          </div>
        )}
      </div>

      {/* Tasks mode: a persistent task strip, always one tap away right
          above the compose box — not tucked inside the scrolling transcript. */}
      {chatMode === "tasks" && (
        <div style={{ display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, paddingBottom: 2 }}>
          {presetTasks.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => (t.compare ? sendComparisonMessage(t.prompt) : sendMessage(t.prompt))}
                disabled={sending}
                title={t.compare ? `${t.label} — sends to both Predii LLM and Frontier at once` : t.label}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  background: t.compare ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${t.compare ? "rgba(139,92,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 7, padding: "6px 10px", cursor: sending ? "default" : "pointer",
                  fontSize: 11, fontWeight: 700, color: t.compare ? "#C4B5FD" : "#86EFAC", whiteSpace: "nowrap",
                }}
              >
                <Icon size={12} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Custom mode: the free-form compose box. */}
      {chatMode === "custom" && (
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste text to rewrite… (English or Español)"
            rows={2}
            style={{
              flex: 1, resize: "none", boxSizing: "border-box",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 12,
              fontFamily: "inherit", outline: "none",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={sending || !input.trim()}
            title="Send"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: COLORS.accent, border: "none", borderRadius: 8,
              width: 36, flexShrink: 0,
              cursor: sending || !input.trim() ? "default" : "pointer",
              opacity: sending || !input.trim() ? 0.5 : 1,
            }}
          >
            <Send size={14} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
