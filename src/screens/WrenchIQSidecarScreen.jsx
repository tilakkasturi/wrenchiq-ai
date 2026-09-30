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

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Sparkles, AlertTriangle, Search, Settings, ExternalLink, Bell, BellOff, Clipboard, Send, Check, ClipboardCheck, Circle, CircleSlash, ChevronDown, Pencil, X, MessageCircle, Info, ArrowRightLeft, Home, FileText, DollarSign, Stethoscope, Layers, History, MessagesSquare, RefreshCw, Play, RotateCcw, Coins, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";
import { useZoom } from "../context/ZoomContext";
import { COLORS } from "../theme/colors";
import { useDemo } from "../context/DemoContext";
import { updateStoryRO } from "../services/repairOrderService";
import { fetchCannedJobs } from "../services/prediiLearnService";
import { openExternalUrl, openSmsRepresentativeSplit, openAdminSettingsWindow } from "../services/externalLink";
import { useSidecarRO } from "../hooks/useSidecarRO";
import TransferSimulationModal from "../components/sidecar/TransferSimulationModal";
import TSBReferenceModal from "../components/sidecar/TSBReferenceModal";
import { LLMProfileBadge } from "../components/LLMProfileBadge";
import HealthCheckScreen from "./sidecar/HealthCheckScreen";
import RepairOrderQueue from "./sidecar/RepairOrderQueue";

const API_BASE = import.meta.env.VITE_API_BASE || "";
const WEB_APP_BASE_URL = import.meta.env.VITE_WEB_APP_BASE_URL || "http://localhost:5173";

function fmtMoney(n) {
  if (n == null) return "$0";
  return `$${Math.round(n).toLocaleString()}`;
}

// Visit-history serviceType comes straight from the RO's raw serviceCategory
// field (see fetchCustomerHistory), which is internal shop taxonomy, not
// customer/advisor-facing copy — "factory_oem" means "manufacturer-scheduled
// maintenance package," not literally "OEM" or "factory." Mapped to plain
// language here rather than displayed verbatim.
const SERVICE_CATEGORY_LABELS = {
  factory_oem: "Maintenance",
  other_mechanical: "General Repair",
  ac: "A/C",
  climate_control: "A/C",
  engine_emissions: "Engine/Emissions",
};
function humanizeServiceCategory(cat) {
  if (!cat) return "Service";
  if (SERVICE_CATEGORY_LABELS[cat]) return SERVICE_CATEGORY_LABELS[cat];
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Header icon buttons (zoom, Home, notifications, chat, SMS/settings launch)
// were rendered at 0.15-0.4 white opacity — nearly invisible against the
// dark navy header. Every one of them now reads at a solid, legible
// contrast: `active` (a toggled-on state, e.g. viewing Home or Notifications
// showing) gets a gold fill+outline, a plain clickable icon sits at 0.9
// opacity, and a genuinely inert one (zoom already maxed) still holds at
// 0.35 rather than fading out.
export function headerIconStyle({ enabled = true, active = false }) {
  return {
    background: active ? "rgba(255,214,10,0.18)" : "transparent",
    border: active ? "1px solid rgba(255,214,10,0.4)" : "1px solid transparent",
    cursor: enabled ? "pointer" : "default",
    padding: 5, borderRadius: 6,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: active ? COLORS.gold : enabled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.35)",
  };
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

// Real match against this shop's own priced canned-job catalog
// (cannedJobsService.js / Predii Learn → Canned Jobs) — same substring-match
// convention used server-side for alreadyOnRO checks (roAdvisorService.js).
// When a recommendation's service name matches a canned job, its real labor
// hours and priced parts replace the simulated lookup below entirely.
function matchCannedJob(serviceName, cannedJobs) {
  const svc = (serviceName || "").toLowerCase().trim();
  if (!svc || !cannedJobs?.length) return null;
  const job = cannedJobs.find((j) => {
    const desc = (j.description || "").toLowerCase().trim();
    return desc && (desc.includes(svc) || svc.includes(desc));
  });
  if (!job) return null;
  const parts = (job.parts || []).map((p) => ({ description: p.description, lineCost: p.lineCost }));
  return {
    real: true,
    sourceDescription: job.description,
    laborHrs: job.laborHours,
    laborCost: job.laborCost,
    parts,
    partCost: parts.reduce((s, p) => s + (p.lineCost || 0), 0),
    totalPrice: job.totalPrice,
  };
}

// Deterministic simulated parts/labor catalog match — stands in for a real
// DE (parts/labor data) integration until one is scoped and identified (see
// WrenchIQ Product Spec v3.0 §4/§7). Keyed off the service name so the
// "match" is stable across renders/sessions rather than random — this is a
// simulation, not a real search, and is disclosed as such in the UI. Only
// reached when matchCannedJob() above found nothing for this service.
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
  return {
    real: false,
    candidateCount, laborHrs, partNumber, partCost, laborCost,
    parts: [{ description: `${serviceName} — ${partNumber}`, lineCost: partCost }],
  };
}

// Strategic Priorities mix two different kinds of objective: sellable
// upsells ("offer alignment check", "add shop supply fee ($29.95)") and pure
// process/compliance rules ("follow up within 24 hours on estimates over
// $1,500"). Only the former has a real price to add to the RO — for the
// latter, any dollar figure in the note is a threshold condition, not a fee,
// so grabbing it (or fabricating a hash-based simulated catalog line item)
// would add a nonsensical charge to the customer's invoice. This resolves a
// price only when there's a real canned-job match or an explicit fee named
// in the note itself; otherwise it returns null and the UI skips pricing.
const THRESHOLD_PHRASE_RE = /\b(?:over|above|exceed(?:s|ing)?|more than|under|below|less than|at least|up to)\s*\$[\d,]+(?:\.\d{1,2})?/gi;
function extractIngFee(note) {
  const stripped = (note || "").replace(THRESHOLD_PHRASE_RE, "");
  const m = stripped.match(/\$([\d,]+(?:\.\d{1,2})?)/);
  return m ? parseFloat(m[1].replace(/,/g, "")) : null;
}
function resolveIngPricing(note, cannedJobs) {
  const cannedMatch = matchCannedJob(note, cannedJobs);
  if (cannedMatch) return cannedMatch;
  const fee = extractIngFee(note);
  if (fee == null) return null;
  return { real: true, sourceDescription: note, laborHrs: 0, laborCost: fee, parts: [], partCost: 0, totalPrice: fee };
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.round(s / 60)}m ago`;
}

export const openSurfaceASettings = (smsName) => openAdminSettingsWindow(`${WEB_APP_BASE_URL}/admin.html?section=settings&edition=am&sms=${encodeURIComponent(smsName)}`);
export const openSurfaceC = (smsName) => openSmsRepresentativeSplit(`${WEB_APP_BASE_URL}/sms-representative.html?sms=${encodeURIComponent(smsName)}`);

export default function WrenchIQSidecarScreen({ windowMode = "sidecar", onToggleWindowMode }) {
  // Launch sequence (WrenchIQ Product Spec v4.0): health → queue → ro.
  // "ro" is also where the collapsed RepairOrderCard lives; clicking it
  // navigates back to "queue" rather than opening its own dropdown.
  const [phase, setPhase] = useState("health");
  const { smsName } = useDemo(); // shop's selected SMS/DMS (Settings → Learn → Integrations), defaults to Mitchell1 ShopManager SE
  const { zoomIn, zoomOut, canZoomIn, canZoomOut } = useZoom();
  const [notificationsVisible, setNotificationsVisible] = useState(false);

  const {
    activeCustomer, customers, selectCustomer,
    storyRO, agentData, loading,
    activeTab, setActiveTab,
    roScorePct, setRoScorePct,
    advisorFetchedAt, llmProfile, llmStatus, llmDetailVisible, notifications,
    addedJobs, acceptedServices,
    transferOpen, handleTransfer, cancelTransfer, confirmTransfer,
    runAdvisorFetch, handleConfirmRecommendation, handleConcernUpdate, handleInspectionItemSelect,
    roGrandTotal, baseRoTotal, addedTotal,
  } = useSidecarRO({ autoFetch: phase === "ro" });

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
          <LLMProfileBadge llmProfile={llmProfile} llmStatus={llmStatus} showDetail={llmDetailVisible} />
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
            <button
              onClick={zoomOut}
              disabled={!canZoomOut}
              title="Zoom out — shrink section text back down"
              style={headerIconStyle({ enabled: canZoomOut })}
            >
              <ZoomOut size={15} />
            </button>
            <button
              onClick={zoomIn}
              disabled={!canZoomIn}
              title="Zoom in — enlarge the text inside each section for readability"
              style={headerIconStyle({ enabled: canZoomIn })}
            >
              <ZoomIn size={15} />
            </button>
            <button
              onClick={() => setPhase("health")}
              disabled={phase === "health"}
              title="Home — back to the launch/connections screen"
              style={headerIconStyle({ enabled: phase !== "health", active: phase === "health" })}
            >
              <Home size={15} />
            </button>
            <button
              onClick={() => setNotificationsVisible((v) => !v)}
              title={notificationsVisible ? "Hide notifications" : "Show notifications"}
              style={headerIconStyle({ enabled: true, active: notificationsVisible })}
            >
              {notificationsVisible ? <Bell size={15} /> : <BellOff size={15} />}
            </button>
            <button
              onClick={() => setPhase("shopChat")}
              disabled={phase === "shopChat"}
              title="Ask WrenchIQ — shop-wide chat grounded in canned jobs, Shop Profile, and any named customer's history"
              style={headerIconStyle({ enabled: phase !== "shopChat", active: phase === "shopChat" })}
            >
              <MessagesSquare size={15} />
            </button>
            <button
              onClick={() => openSurfaceC(smsName)}
              title={`Open ${smsName || "SMS/DMS"} Representative (Surface C)`}
              style={headerIconStyle({ enabled: true })}
            >
              <ExternalLink size={15} />
            </button>
            <button
              onClick={() => openSurfaceASettings(smsName)}
              title="Open WrenchIQ settings"
              style={headerIconStyle({ enabled: true })}
            >
              <Settings size={15} />
            </button>
            {onToggleWindowMode && (
              <button
                onClick={onToggleWindowMode}
                title={windowMode === "full" ? "Switch to Sidecar (docked) mode" : "Switch to Full-screen mode"}
                style={headerIconStyle({ enabled: true })}
              >
                {windowMode === "full" ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
            )}
          </div>
        </div>

        {phase === "ro" && (
          <>
            <RepairOrderCard
              ro={storyRO}
              activeCustomer={activeCustomer}
              loading={loading}
              onOpenQueue={() => setPhase("queue")}
              smsName={smsName}
              addedCount={addedJobs.length}
              addedTotal={addedTotal}
              baseTotal={storyRO ? baseRoTotal : null}
              displayTotal={storyRO ? roGrandTotal : null}
              onTransfer={handleTransfer}
            />

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
                <TabButton label="Agent Trace" icon={Layers} active={activeTab === "trace"} onClick={() => setActiveTab("trace")} />
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
              <IntelligencePanel
                key={storyRO.roNumber}
                ro={storyRO}
                agentData={agentData}
                agentLoading={loading}
                fetchedAt={advisorFetchedAt}
                onRefresh={() => runAdvisorFetch(storyRO.roNumber)}
                addedJobs={addedJobs}
                acceptedServices={acceptedServices}
                onConfirmRecommendation={handleConfirmRecommendation}
                onConcernUpdate={handleConcernUpdate}
                onInspectionItemSelect={handleInspectionItemSelect}
              />
            )}

            {storyRO && activeTab === "roScore" && (
              <ROScoreTab key={storyRO.roNumber} ro={storyRO} agentData={agentData} onScoreChange={setRoScorePct} />
            )}

            {storyRO && activeTab === "chat" && (
              <ChatTab key={storyRO.roNumber} ro={storyRO} />
            )}

            {storyRO && activeTab === "trace" && (
              <AgentTraceTab key={storyRO.roNumber} ro={storyRO} agentData={agentData} agentLoading={loading} llmProfile={llmProfile} llmStatus={llmStatus} llmDetailVisible={llmDetailVisible} />
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
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.35 }}>{n.body}</div>
              </div>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", flexShrink: 0, whiteSpace: "nowrap" }}>
                {timeAgo(n.at)}
              </span>
            </div>
          ))}
            </div>
          )}
        </>
      )}

      {transferOpen && storyRO && (
        <TransferSimulationModal
          repairOrderId={storyRO.roNumber}
          acceptedJobs={addedJobs}
          smsName={smsName}
          onCancel={cancelTransfer}
          onConfirm={confirmTransfer}
        />
      )}
    </div>
  );
}

// Collapsed view of the RO Queue (WrenchIQ Product Spec v4.0 §3) — a pure
// summary bar. Clicking it navigates back to the shared RepairOrderQueue
// screen (phase="queue" in WrenchIQSidecarScreen) rather than owning a
// second, separate list UI.
export function RepairOrderCard({ ro, activeCustomer, loading, onOpenQueue, smsName, addedCount = 0, addedTotal = 0, baseTotal, displayTotal, onTransfer }) {
  const cust = ro?._customer;
  const veh = ro?._vehicle;
  const displayName = cust?.firstName
    ? `${cust.firstName} ${cust.lastName}`
    : activeCustomer?.customerName || (loading ? "Loading…" : "Select a customer");
  const roNumber = ro?.roNumber || activeCustomer?.roNumber;
  const vehMileage = veh?.mileage ?? veh?.odometer ?? activeCustomer?.vehicle?.mileage ?? null;
  const vehicleLine = veh?.make
    ? `${veh.year} ${veh.make} ${veh.model}`
    : activeCustomer?.vehicle
      ? `${activeCustomer.vehicle.year || ""} ${activeCustomer.vehicle.make || ""} ${activeCustomer.vehicle.model || ""}`.trim()
      : null;
  const vehicleLineWithMileage = vehicleLine && vehMileage != null
    ? `${vehicleLine} — ${vehMileage.toLocaleString()} mi`
    : vehicleLine;

  return (
    // A plain div (not <button>) because the Transfer action below renders
    // its own nested button — a <button> can't legally contain one.
    <div
      onClick={onOpenQueue}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onOpenQueue(); }}
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
            fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.8)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {roNumber || "No RO selected"}
          </span>
        </div>
        <ChevronDown size={14} color="rgba(255,255,255,0.35)" style={{ flexShrink: 0, transform: "rotate(-90deg)" }} />
      </div>

      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{
            fontSize: 15, fontWeight: 800, color: "#F1F5F9",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {displayName}
          </span>
          {onTransfer && addedCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onTransfer(); }}
              title={`Simulate sending ${addedCount} accepted recommendation${addedCount === 1 ? "" : "s"} to ${smsName}`}
              style={{
                display: "flex", alignItems: "center", gap: 4, flexShrink: 0,
                background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)",
                borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                fontSize: 10, fontWeight: 700, color: "#93C5FD",
              }}
            >
              <ArrowRightLeft size={11} />
              Transfer to {smsName} (+{fmtMoney(addedTotal)})
            </button>
          )}
        </div>
        {displayTotal != null && (
          <span style={{ fontSize: 15, fontWeight: 800, color: COLORS.accent, flexShrink: 0 }}>
            {fmtMoney(displayTotal)}
          </span>
        )}
      </div>

      {vehicleLineWithMileage && (
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>{vehicleLineWithMileage}</div>
      )}

      {/* Base RO value → accepted upsell → new total, so the advisor can see */}
      {/* exactly how much WrenchIQ Intelligence added on top of the walk-in job. */}
      {addedCount > 0 && baseTotal != null && (
        <div style={{
          display: "flex", alignItems: "center", gap: 5, marginTop: 6,
          fontSize: 11, color: "rgba(255,255,255,0.8)", flexWrap: "wrap",
        }}>
          <span>Base {fmtMoney(baseTotal)}</span>
          <span style={{ color: "rgba(74,222,128,0.9)" }}>+ {fmtMoney(addedTotal)} accepted</span>
          <span>= {fmtMoney(displayTotal)}</span>
          {baseTotal > 0 && (
            <span style={{
              fontWeight: 700, color: "#4ADE80", background: "rgba(74,222,128,0.12)",
              borderRadius: 4, padding: "1px 5px", fontSize: 10,
            }}>
              +{Math.round((addedTotal / baseTotal) * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TabButton({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 12px", borderRadius: 7,
        border: active ? "1px solid rgba(255,255,255,0.16)" : "1px solid transparent",
        background: active ? "rgba(255,255,255,0.08)" : "transparent",
        color: active ? "#fff" : "rgba(255,255,255,0.6)",
        fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      }}
    >
      <Icon size={12} />
      {label}
    </button>
  );
}

export function EmptyState({ icon, text }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 10, padding: "48px 16px", textAlign: "center",
    }}>
      {icon}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

export function LoadingSkeleton() {
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

// Tool/data sources the agent "pulls" while reasoning — purely cosmetic
// (the real call is a single POST /api/ro-advisor), but makes the wait
// feel like an active multi-step agent instead of a stalled spinner.
const AGENT_TOOL_TARGETS = [
  "service history", "open TSBs", "parts pricing", "labor time guide",
  "warranty coverage", "shop margin targets", "DTC codes", "vehicle build data",
];

function pickTools(seed, count) {
  const start = seed % AGENT_TOOL_TARGETS.length;
  return Array.from({ length: count }, (_, i) => AGENT_TOOL_TARGETS[(start + i) % AGENT_TOOL_TARGETS.length]);
}

function AgentThinkingStatus({ roNumber, firstName }) {
  const { bz } = useZoom();
  const seed = String(roNumber || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const steps = useMemo(() => {
    const [t1, t2, t3, t4] = pickTools(seed, 4);
    const who = firstName || "the customer";
    return [
      `Agent is triggering tools to pull ${t1}, ${t2}…`,
      `Cross-referencing ${t3} and ${t4}…`,
      `PrediiLLM is now reasoning with the data, providing personalized recommendations for ${who}…`,
    ];
  }, [seed, firstName]);

  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const interval = setInterval(() => {
      setStep((s) => Math.min(s + 1, steps.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, [steps]);

  return (
    <span style={{ fontSize: bz(11), color: "#fff", lineHeight: 1.4 }}>
      {steps[step]}
    </span>
  );
}

function StagedCustomerText({ ro, agentData, agentLoading }) {
  const [status, setStatus] = useState(ro.agenticTextStatus || "staged");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { bz } = useZoom();

  // Only fall back to the RO's last saved/sent message once the agent call
  // has actually finished — otherwise this shows a stale (or, for seeded
  // demo ROs, entirely canned) message before the LLM has generated
  // anything, which reads as the AI having already responded.
  const originalMessage = agentData?.suggestedCustomerMessage
    || (!agentLoading ? ro.agenticCustomerText : undefined);
  const [draft, setDraft] = useState(originalMessage);

  // Keep the draft in sync as the AI message arrives/changes — but never
  // clobber text the advisor is actively editing.
  useEffect(() => {
    if (!editing) setDraft(originalMessage);
  }, [originalMessage, editing]);

  if (agentLoading && !originalMessage) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
        <span style={{ fontSize: bz(11), color: "rgba(255,255,255,0.8)" }}>
          Generating suggested customer message…
        </span>
        <LoadingSkeleton />
      </div>
    );
  }

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
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
                padding: 2, color: "rgba(255,255,255,0.75)",
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
                fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)",
              }}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </>
      ) : (
        splitIntoParagraphs(draft).map((para, i) => (
          <p key={i} style={{ margin: i === 0 ? "0 0 8px" : "0 0 9px", fontSize: bz(12), color: "rgba(255,255,255,0.82)", lineHeight: 1.5 }}>
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
              fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.85)",
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
  na:      { icon: CircleSlash, color: "rgba(255,255,255,0.75)", bg: "rgba(255,255,255,0.06)" },
  pending: { icon: Circle,      color: "rgba(255,255,255,0.75)", bg: "transparent" },
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
export function ROScoreTab({ ro, agentData, onScoreChange }) {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiScoring, setAiScoring] = useState(false);
  const { bz } = useZoom();

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
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>
            RO Score
          </div>
          <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)" }}>
            {met} of {applicable.length} Gold Standard guidelines met
          </div>
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: pct >= 80 ? "#4ADE80" : pct >= 50 ? "#FBBF24" : "#F87171" }}>
          {pct}%
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: bz(10), color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
        <Sparkles size={10} color={aiScoring ? "#86EFAC" : "rgba(255,255,255,0.25)"} style={{ flexShrink: 0 }} />
        {aiScoring
          ? "WrenchIQ is reviewing this RO and its conversation against the Gold Standard…"
          : "Tap an item to cycle Pending → Met → N/A, or Accept a WrenchIQ suggestion below."}
      </div>

      <ThreeCPanel ro={ro} />

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
                <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.8)", lineHeight: 1.4, marginTop: 3 }}>
                  {it.whatA5LooksLike}
                </div>
                {it.aiEvidence && (
                  <div style={{ fontSize: bz(10), color: "rgba(134,239,172,0.9)", lineHeight: 1.4, marginTop: 4, fontStyle: "italic" }}>
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

function threeCContext(ro) {
  return {
    concern: ro.threeCConcern || "",
    diagnosis: ro.threeCDiagnosis || "",
    correction: ro.threeCCorrection || "",
    vehicle: ro._vehicle,
    dtcs: ro.dtcs || [],
    services: ro.services || [],
  };
}

function ThreeCScoreBadge({ score, size = 20, title }) {
  if (score == null) return <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>—</span>;
  const color = score >= 75 ? "#4ADE80" : score >= 50 ? "#FBBF24" : "#F87171";
  return <span title={title} style={{ fontSize: size, fontWeight: 800, color, cursor: title ? "help" : "default" }}>{score}</span>;
}

// Read-only Complaint/Cause/Correction — the raw narrative as it exists on
// the RO right now, always shown (not just after a rewrite is drafted), so
// the advisor can see exactly what's on file before deciding to rewrite it.
function ThreeCRawFields({ concern, diagnosis, correction, bz }) {
  const rows = [
    ["Complaint", concern],
    ["Cause", diagnosis],
    ["Correction", correction],
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {rows.map(([label, value]) => (
        <div key={label}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.55)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {label}
          </div>
          <div style={{ fontSize: bz(11), color: value ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.4)", lineHeight: 1.4, fontStyle: value ? "normal" : "italic" }}>
            {value || "(not recorded)"}
          </div>
        </div>
      ))}
    </div>
  );
}

// Live 3C (Complaint/Cause/Correction) narrative quality, scored by
// WrenchIQ against the narrative actually on file for this RO — seeded demo
// ROs can carry deliberately weak 3C text (see threeCConcern fixtures in
// demoData.js), so this reads live from the model rather than a fixture
// score. "Rewrite with WrenchIQ" drafts an improved narrative that is
// strictly grounded in this RO's own data (see threeCScoreService.js) —
// it never introduces a DTC, TSB, part, or customer statement that wasn't
// already on file, so the "after" score reflects a real improvement, not a
// polished fabrication.
function ThreeCPanel({ ro }) {
  const [live, setLive] = useState(null);
  const [scoring, setScoring] = useState(true);
  const [rewriteResult, setRewriteResult] = useState(null);
  const [rewriting, setRewriting] = useState(false);
  const [applied, setApplied] = useState(false);
  const { bz } = useZoom();

  useEffect(() => {
    let cancelled = false;
    setScoring(true);
    setLive(null);
    setRewriteResult(null);
    setApplied(false);
    fetch(`${API_BASE}/api/three-c-score/score`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(threeCContext(ro)),
    })
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setLive(data); })
      .catch(() => { if (!cancelled) setLive({ score: null, rationale: "WrenchIQ couldn't reach the scoring model.", gaps: [] }); })
      .finally(() => { if (!cancelled) setScoring(false); });
    return () => { cancelled = true; };
  }, [ro.roNumber, ro.threeCConcern, ro.threeCDiagnosis, ro.threeCCorrection]);

  async function handleRewrite() {
    setRewriting(true);
    try {
      const res = await fetch(`${API_BASE}/api/three-c-score/rewrite-and-score`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(threeCContext(ro)),
      });
      const data = await res.json();
      setRewriteResult(data);
    } catch {
      setRewriteResult({ before: live, rewritten: null, after: null });
    } finally {
      setRewriting(false);
    }
  }

  function handleApply() {
    if (!rewriteResult?.rewritten) return;
    const { concern, diagnosis, correction } = rewriteResult.rewritten;
    updateStoryRO(ro.roNumber, {
      threeCConcern: concern,
      threeCDiagnosis: diagnosis,
      threeCCorrection: correction,
      threeCScore: rewriteResult.after?.score ?? null,
    }).catch(() => {});
    // Keep in sync locally until next fetch (same pattern as TalkTrackText).
    ro.threeCConcern = concern;
    ro.threeCDiagnosis = diagnosis;
    ro.threeCCorrection = correction;
    ro.threeCScore = rewriteResult.after?.score ?? null;
    setLive(rewriteResult.after);
    setApplied(true);
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          3C Narrative Quality
        </div>
        {scoring ? <Sparkles size={12} color="#86EFAC" /> : <ThreeCScoreBadge score={live?.score} title={live?.rationale} />}
      </div>

      {!scoring && live && (
        <>
          <ThreeCRawFields concern={ro.threeCConcern} diagnosis={ro.threeCDiagnosis} correction={ro.threeCCorrection} bz={bz} />

          {live.gaps?.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {live.gaps.map((g, i) => (
                <span key={i} style={{
                  fontSize: bz(10), color: "#FCA5A5", background: "rgba(248,113,113,0.1)",
                  border: "1px solid rgba(248,113,113,0.25)", borderRadius: 5, padding: "2px 6px",
                }}>
                  {g}
                </span>
              ))}
            </div>
          )}

          {!rewriteResult && (
            <button
              onClick={handleRewrite}
              disabled={rewriting}
              style={{
                alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 5,
                background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.4)",
                borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 700, color: "#C4B5FD",
                cursor: rewriting ? "default" : "pointer",
              }}
            >
              <Sparkles size={11} />
              {rewriting ? "Rewriting…" : "Rewrite with WrenchIQ"}
            </button>
          )}

          {rewriteResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <GroundingNotice grounding={rewriteResult.grounding} bz={bz} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ borderLeft: "3px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 10px", background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.8)", textTransform: "uppercase" }}>Before</span>
                    <ThreeCScoreBadge score={rewriteResult.before?.score} size={13} title={rewriteResult.before?.rationale} />
                  </div>
                  <ThreeCRawFields concern={ro.threeCConcern} diagnosis={ro.threeCDiagnosis} correction={ro.threeCCorrection} bz={bz} />
                </div>
                <div style={{ borderLeft: "3px solid #8B5CF6", borderRadius: 6, padding: "6px 10px", background: "rgba(139,92,246,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#C4B5FD", textTransform: "uppercase" }}>After</span>
                    <ThreeCScoreBadge score={rewriteResult.after?.score} size={13} title={rewriteResult.after?.rationale} />
                  </div>
                  {rewriteResult.rewritten ? (
                    <ThreeCRawFields
                      concern={rewriteResult.rewritten.concern}
                      diagnosis={rewriteResult.rewritten.diagnosis}
                      correction={rewriteResult.rewritten.correction}
                      bz={bz}
                    />
                  ) : (
                    <div style={{ fontSize: bz(10), color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>(rewrite unavailable)</div>
                  )}
                </div>
              </div>
              {rewriteResult.rewritten && !applied && rewriteResult.grounding?.grounded !== false && (
                <button
                  onClick={handleApply}
                  style={{
                    alignSelf: "flex-start", fontSize: 10, fontWeight: 700, color: "#4ADE80",
                    background: "rgba(74,222,128,0.12)", border: "1px solid rgba(74,222,128,0.3)",
                    borderRadius: 5, padding: "4px 9px", cursor: "pointer",
                  }}
                >
                  Apply rewrite to RO
                </button>
              )}
              {applied && (
                <div style={{ fontSize: 10, fontWeight: 700, color: "#4ADE80" }}>Applied — RO updated.</div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Renders the outcome of verifyThreeCGrounding() — an independent LLM
// fact-check of the rewrite against the same context it was supposed to be
// grounded in. Blocks the natural next step to read "flagged, don't apply"
// as strongly as the copy does: ThreeCPanel/runThreeCTask both hide their
// "Apply"/accept affordance whenever grounded === false, rather than just
// showing a warning next to a button that still works.
// "Translate" on a non-English assistant reply — the advisor picked (or the
// model auto-detected) a language other than English to talk to the
// customer in, but still needs to know what was actually said. Fetches
// lazily on first click and caches the result locally so re-toggling never
// re-calls the model; shown as a hovering popover anchored to the button
// rather than replacing the reply inline, so the original (the thing that
// actually gets sent/copied to the customer) stays the visible text.
function TranslateButton({ text }) {
  const [open, setOpen] = useState(false);
  const [translation, setTranslation] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (open) { setOpen(false); return; }
    if (translation) { setOpen(true); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ro-chat/translate`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setTranslation(data.translation || "Translation unavailable.");
      setOpen(true);
    } catch {
      setTranslation("Sorry, WrenchIQ couldn't translate this just now — try again.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      <button
        onClick={handleClick}
        title="Translate to English"
        style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "transparent", border: "none", cursor: "pointer", padding: "0 2px",
          color: open ? "#7DD3FC" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600,
        }}
      >
        <Layers size={11} />
        {loading ? "Translating…" : "Translate"}
      </button>
      {open && translation && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 6px)", left: 0, zIndex: 20,
          minWidth: 200, maxWidth: 320,
          background: COLORS.navyMid, border: "1px solid rgba(125,211,252,0.35)",
          borderRadius: 8, padding: "8px 10px", boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
          fontSize: 11.5, lineHeight: 1.5, color: "#fff", whiteSpace: "pre-wrap",
        }}>
          {translation}
        </div>
      )}
    </div>
  );
}

function GroundingNotice({ grounding, bz }) {
  if (!grounding || grounding.grounded == null) {
    return (
      <div style={{ fontSize: bz(9), color: "rgba(255,255,255,0.75)", lineHeight: 1.4 }}>
        Rewrite is instructed to stay grounded strictly in this RO's own data — no invented DTCs, parts, or
        customer statements — but the independent fact-check couldn't be reached, so this hasn't been verified.
      </div>
    );
  }
  if (grounding.grounded === false) {
    return (
      <div style={{
        display: "flex", gap: 6, alignItems: "flex-start", fontSize: bz(10), lineHeight: 1.45,
        color: "#FCA5A5", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.3)",
        borderRadius: 6, padding: "7px 9px",
      }}>
        <AlertTriangle size={12} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontWeight: 700 }}>Hallucination check failed — do not apply as-is.</div>
          {grounding.fabrications?.length > 0 && (
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {grounding.fabrications.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          )}
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", fontSize: bz(9), color: "#86EFAC", lineHeight: 1.4 }}>
      <Check size={11} style={{ flexShrink: 0 }} />
      Independently fact-checked — grounded strictly in this RO's own data, no invented DTCs, parts, or customer statements.
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
  const { bz } = useZoom();

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
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.85)",
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
      <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.85)", lineHeight: 1.5, fontStyle: "italic", flex: 1 }}>
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
function ServiceRecommendationCard({ ro, rec, accepted, onConfirm, cannedJobs, tsbReferences }) {
  const [phase, setPhase] = useState("idle"); // idle | searching | resolved
  const [match, setMatch] = useState(null);
  const [tsbModalOpen, setTsbModalOpen] = useState(false);
  const { bz } = useZoom();
  const tsbRef = rec.category === "tsb"
    ? (tsbReferences || []).find((t) => t.tsbNumber === rec.tsbNumber)
    : null;

  // Accept resolves the catalog match and adds it to the RO in one step —
  // no separate "Confirm & Add to RO" click required.
  function handleAccept() {
    setPhase("searching");
    setTimeout(() => {
      // Real canned-job pricing wins when this service is on the shop's own
      // menu; only simulate a parts/labor-guide lookup when it isn't.
      const resolvedMatch = matchCannedJob(rec.service, cannedJobs) || simulateCatalogMatch(rec.service, rec.estimatedCost);
      setMatch(resolvedMatch);
      setPhase("resolved");
      onConfirm(rec, resolvedMatch);
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
          {rec.category === "tsb" && (
            <button
              onClick={() => setTsbModalOpen(true)}
              title={tsbRef ? "View full bulletin" : (rec.tsbNumber ? `NHTSA TSB ${rec.tsbNumber}` : "Manufacturer Technical Service Bulletin")}
              style={{
                marginLeft: 6, fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                background: "rgba(240,171,252,0.15)", color: "#F0ABFC", letterSpacing: 0.2,
                border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 3,
              }}
            >
              TSB{rec.tsbNumber ? ` ${rec.tsbNumber}` : ""}
              <FileText size={9} />
            </button>
          )}
          {tsbModalOpen && (
            <TSBReferenceModal rec={rec} tsbRef={tsbRef} onClose={() => setTsbModalOpen(false)} />
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>
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
      <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)", marginBottom: 6, lineHeight: 1.4 }}>
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
      ) : (
        <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.8)", fontStyle: "italic" }}>
          Searching parts/labor catalog…
        </div>
      )}
    </div>
  );
}

export function IntelligencePanel({ ro, agentData, agentLoading, fetchedAt, onRefresh, addedJobs, acceptedServices, onConfirmRecommendation, onConcernUpdate, onInspectionItemSelect }) {
  const cust = ro._customer;
  const { activeShopId } = useDemo();
  // Accepting a Strategic Priority resolves a catalog match and adds it to
  // the RO exactly like accepting a Service Recommendation (handleAcceptIng
  // below) — it must count toward addedJobs/Transfer just like any other
  // accepted item, not just flip a local "Accepted" label.
  const [acceptedIngs, setAcceptedIngs] = useState(new Set());
  // A Strategic Priority isn't always a sellable item to Accept — some are
  // pure talking points (e.g. "lead with loyalty history") with nothing to
  // price or add to the RO. This just tracks "I said this to the customer,"
  // independent of Accept — the two aren't mutually exclusive or dependent.
  const [presentedIngs, setPresentedIngs] = useState(new Set());
  function togglePresented(note) {
    setPresentedIngs((prev) => {
      const next = new Set(prev);
      if (next.has(note)) next.delete(note); else next.add(note);
      return next;
    });
  }
  // This shop's real priced canned-job menu — lets the Accept flow below use
  // real labor hours + parts pricing when a recommendation is on the menu,
  // instead of always falling back to the simulated catalog match.
  const [cannedJobs, setCannedJobs] = useState([]);
  const { bz } = useZoom();

  // Editable concern draft — parent remounts this component (key={roNumber})
  // on RO change, so seeding from the prop here only needs to happen once
  // per mount; a successful rewrite/inspection-select updates it directly
  // via the returned final text rather than re-deriving from `ro`.
  const [concernDraft, setConcernDraft] = useState(ro.customerConcern || "");
  const [rewriting, setRewriting] = useState(false);
  // The last persisted concern (post-rewrite or post-inspection-flag),
  // shown read-only above recommendations so it's clear what the AI Agent
  // actually used — distinct from concernDraft, which tracks live typing.
  // Starts blank on load (not seeded from ro.customerConcern) so this
  // section only appears once an actual rewrite/flag has happened.
  const [savedConcern, setSavedConcern] = useState("");

  async function handleConcernKeyDown(e) {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    setRewriting(true);
    try {
      // The textbox keeps the advisor's original typed text — only the
      // "Updated Concern" section below shows the rewritten version.
      const cleaned = await onConcernUpdate(concernDraft);
      if (cleaned != null) setSavedConcern(cleaned);
    } finally {
      setRewriting(false);
    }
  }

  async function handleInspectionSelectChange(e) {
    const itemId = e.target.value;
    e.target.value = "";
    if (!itemId) return;
    const item = urgentInspectionItems.find((i) => i.id === itemId);
    if (!item) return;
    const next = await onInspectionItemSelect(item);
    if (next != null) {
      setConcernDraft(next);
      setSavedConcern(next);
    }
  }

  const urgentInspectionItems = (ro.dviInspection?.categories || [])
    .flatMap((c) => c.items || [])
    .filter((i) => i.status === "urgent");

  useEffect(() => {
    let cancelled = false;
    fetchCannedJobs(activeShopId)
      .then((data) => { if (!cancelled) setCannedJobs(data.jobs || []); })
      .catch(() => { if (!cancelled) setCannedJobs([]); });
    return () => { cancelled = true; };
  }, [activeShopId]);

  // Accepting a Strategic Priority resolves it the same way a Service
  // Recommendation does — real canned-job pricing when the note matches the
  // shop's menu, otherwise an explicit fee already named in the note itself
  // (e.g. "shop supply fee ($29.95)") — then hands off to the same
  // onConfirmRecommendation the parent uses to add a job to the RO and count
  // it toward the Transfer button. Only ever called when resolveIngPricing()
  // found a real price (see the render below) — pure process/compliance
  // objectives have no Accept control at all, so there's nothing to add.
  function handleAcceptIng(ing) {
    if (acceptedIngs.has(ing.note)) return;
    const match = resolveIngPricing(ing.note, cannedJobs);
    if (!match) return;
    setAcceptedIngs((prev) => new Set(prev).add(ing.note));
    onConfirmRecommendation({ service: ing.note }, match);
  }

  const hasNothing = !agentLoading && !agentData?.advisorBrief
    && (agentData?.serviceRecommendations || []).length === 0
    && (agentData?.alerts || []).length === 0
    && (agentData?.ings || []).length === 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* ── Concern ──────────────────────────────────────────────────── */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "11px 13px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <textarea
          value={concernDraft}
          onChange={(e) => setConcernDraft(e.target.value)}
          onKeyDown={handleConcernKeyDown}
          disabled={rewriting}
          placeholder="Customer concern — type and press Enter to rewrite"
          rows={5}
          style={{
            margin: 0, width: "100%", minHeight: 110, resize: "vertical", background: "transparent",
            border: "none", outline: "none", fontFamily: "inherit",
            fontSize: bz(13), color: "rgba(255,255,255,0.82)", lineHeight: 1.6, fontStyle: "italic",
            opacity: rewriting ? 0.6 : 1,
          }}
        />
        {rewriting && (
          <span style={{ fontSize: bz(10), color: "rgba(134,239,172,0.85)" }}>Rewriting…</span>
        )}
        {urgentInspectionItems.length > 0 && (
          <select
            defaultValue=""
            onChange={handleInspectionSelectChange}
            disabled={rewriting}
            style={{
              fontSize: bz(10.5), color: "#FCA5A5", background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.3)", borderRadius: 5, padding: "4px 6px",
            }}
          >
            <option value="">Flag inspection finding…</option>
            {urgentInspectionItems.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── Updated Concern (last persisted — what the AI Agent used) ──── */}
      {savedConcern && (
        <div style={{
          background: "rgba(139,92,246,0.06)",
          border: "1px solid rgba(139,92,246,0.2)",
          borderRadius: 8, padding: "11px 13px",
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#C4B5FD", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
            Updated Concern
          </div>
          <p style={{ margin: 0, fontSize: bz(12), color: "rgba(255,255,255,0.82)", lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {savedConcern}
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
          {agentLoading ? (
            <AgentThinkingStatus roNumber={ro.roNumber} firstName={cust?.firstName} />
          ) : (
            <span style={{ fontSize: bz(11), color: "#fff", lineHeight: 1.4 }}>
              {`AI Agent reviewed ${cust?.firstName || "the customer"}'s profile to make customized recommendations`}
            </span>
          )}
          {!agentLoading && onRefresh && (
            <button
              onClick={onRefresh}
              title={fetchedAt ? `Last updated ${timeAgo(fetchedAt)} — click to ask WrenchIQ again` : "Refresh"}
              style={{
                marginLeft: "auto", flexShrink: 0, display: "flex", alignItems: "center", gap: 4,
                background: "transparent", border: "none", cursor: "pointer", padding: "2px 4px",
                color: "rgba(134,239,172,0.85)", fontSize: 10,
              }}
            >
              {fetchedAt && <span>{timeAgo(fetchedAt)}</span>}
              <RefreshCw size={11} />
            </button>
          )}
        </div>

        {agentLoading && !agentData && <LoadingSkeleton />}

        <StagedCustomerText ro={ro} agentData={agentData} agentLoading={agentLoading} />

        {agentData?.advisorBrief && (
          <div style={{
            fontSize: bz(12), color: "#fff", lineHeight: 1.55, marginBottom: 10,
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
            <span style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)" }}>
              {agentData.marginCheck.marginPct}% vs {agentData.marginCheck.target}% target
            </span>
          </div>
        )}

        {agentData?.aroGap?.gapAmount > 0 && (
          <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)", marginBottom: 10, lineHeight: 1.45 }}>
            <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.gapAmount)}</strong> below ARO target
            {agentData.aroGap.recommendationsCoverAmount > 0 && (
              <> — these recommendations would close <strong style={{ color: COLORS.accent }}>{fmtMoney(agentData.aroGap.recommendationsCoverAmount)}</strong> of it</>
            )}
          </div>
        )}

        {(agentData?.alerts || []).length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
              Alerts
            </div>
            {agentData.alerts.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < agentData.alerts.length - 1 ? "1px solid rgba(252,211,77,0.08)" : "none",
              }}>
                <AlertTriangle size={11} color="#FCD34D" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: bz(11), color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {hasNothing && (
          <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)" }}>
            No intelligence signals for this RO right now.
          </div>
        )}
      </div>

      {/* ── Service Recommendations — distinct blue panel ──────────────── */}
      {(agentData?.serviceRecommendations || []).length > 0 && (() => {
        const allRecs = agentData.serviceRecommendations;
        const coreRecs = allRecs.filter((u) => u.category !== "tsb");
        const tsbRecs = allRecs.filter((u) => u.category === "tsb");
        return (
        <div style={{
          background: "rgba(59,130,246,0.08)",
          border: "1px solid rgba(59,130,246,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Service Recommendations
          </div>
          {coreRecs.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: tsbRecs.length > 0 ? 14 : 0 }}>
              {coreRecs.map((u, i) => (
                <ServiceRecommendationCard
                  key={i}
                  ro={ro}
                  rec={u}
                  accepted={acceptedServices.has(u.service)}
                  onConfirm={onConfirmRecommendation}
                  cannedJobs={cannedJobs}
                  tsbReferences={agentData?.tsbReferences}
                />
              ))}
            </div>
          )}

          {/* TSBs surface regardless of relevance to the stated concern — they're */}
          {/* real manufacturer guidance for this exact vehicle, called out on their */}
          {/* own so the advisor sees them even when unrelated to why the car is in. */}
          {tsbRecs.length > 0 && (
            <div>
              <div style={{
                display: "flex", alignItems: "center", gap: 5, marginBottom: 8,
                fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase",
              }}>
                <FileText size={11} /> Technical Service Bulletins
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {tsbRecs.map((u, i) => (
                  <ServiceRecommendationCard
                    key={i}
                    ro={ro}
                    rec={u}
                    accepted={acceptedServices.has(u.service)}
                    onConfirm={onConfirmRecommendation}
                    cannedJobs={cannedJobs}
                    tsbReferences={agentData?.tsbReferences}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}

      {/* ── Strategic Priorities — distinct purple panel ────────────────── */}
      {/* Only priorities that actually apply to this RO — an N/A one isn't
          actionable here and isn't worth a row (the Agent Trace tab is where
          the full applies/N/A picture, including why something didn't
          apply, is meant to live). */}
      {(() => {
        const applicableIngs = (agentData?.ings || []).filter((ing) => ing.applies);
        if (applicableIngs.length === 0) return null;
        return (
        <div style={{
          background: "rgba(168,85,247,0.08)",
          border: "1px solid rgba(168,85,247,0.22)",
          borderRadius: 8, padding: "12px 14px",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 6 }}>
            Strategic Priorities
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {applicableIngs.map((ing, i) => {
              const isAccepted = acceptedIngs.has(ing.note);
              const pricing = resolveIngPricing(ing.note, cannedJobs);
              return (
              <div key={i} style={{
                display: "flex", gap: 7, alignItems: "flex-start",
                padding: "5px 0",
                borderBottom: i < applicableIngs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                {isAccepted ? (
                  <span style={{
                    display: "flex", alignItems: "center", gap: 3, flexShrink: 0, marginTop: 1,
                    fontSize: 10, fontWeight: 700, color: "#D8B4FE",
                    background: "rgba(216,180,254,0.12)", border: "1px solid rgba(216,180,254,0.3)",
                    borderRadius: 6, padding: "3px 8px",
                  }}>
                    <Check size={11} /> Added {fmtMoney(pricing?.totalPrice)}
                  </span>
                ) : pricing ? (
                  <button
                    onClick={() => handleAcceptIng(ing)}
                    title={`Adds ${fmtMoney(pricing.totalPrice)} to this RO's estimate`}
                    style={{
                      flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", gap: 3,
                      background: "rgba(216,180,254,0.12)", border: "1px solid rgba(216,180,254,0.3)",
                      borderRadius: 6, padding: "3px 8px", cursor: "pointer",
                      fontSize: 10, fontWeight: 700, color: "#D8B4FE",
                    }}
                  >
                    <Check size={11} /> Accept {fmtMoney(pricing.totalPrice)}
                  </button>
                ) : (
                  <span
                    title="Process/compliance reminder, not a sellable service — no price to add to this RO"
                    style={{
                      flexShrink: 0, marginTop: 1, fontSize: 9, fontWeight: 700, borderRadius: 3, padding: "3px 8px",
                      background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", letterSpacing: 0.2,
                    }}
                  >
                    Not billable
                  </span>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.82)", lineHeight: 1.45 }}>{ing.note}</div>
                  {ing.reason && (
                    <div style={{ fontSize: bz(10), color: "rgba(255,255,255,0.75)", marginTop: 2, lineHeight: 1.4 }}>{ing.reason}</div>
                  )}
                </div>
                <label
                  title="Check off once you've actually said this to the customer"
                  style={{
                    display: "flex", alignItems: "center", gap: 4, flexShrink: 0, marginTop: 1,
                    cursor: "pointer", fontSize: 9.5, color: presentedIngs.has(ing.note) ? "#D8B4FE" : "rgba(255,255,255,0.5)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={presentedIngs.has(ing.note)}
                    onChange={() => togglePresented(ing.note)}
                    style={{ accentColor: "#A855F7", cursor: "pointer" }}
                  />
                  Presented
                </label>
              </div>
              );
            })}
          </div>
        </div>
        );
      })()}
    </div>
  );
}

// ── Agent Trace tab — visualizes the ReAct tool-calling loop (server/services/
// roAdvisorService.js) that produces the Service Recommendations and
// Strategic Priorities panels on the Intelligence tab. Every value here is
// read straight off this RO's own agentData/storyRO — no invented data — so
// the trace always reflects whichever customer/RO is actually selected.
const REACT_TOOLS = [
  {
    name: "get_customer_history",
    color: "#67E8F9", bg: "rgba(103,232,249,0.08)", border: "rgba(103,232,249,0.22)",
    thought: (ro) => `What has ${ro?._customer?.firstName || "this customer"} had done before, and what have they declined?`,
    observation: (d) => `${d?.historyVisits ?? 0} prior visit${d?.historyVisits === 1 ? "" : "s"} on file for this customer.`,
  },
  {
    name: "get_shop_objectives",
    color: "#D8B4FE", bg: "rgba(168,85,247,0.08)", border: "rgba(168,85,247,0.22)",
    thought: () => "What standing priorities has this shop set today (fees, promos, inventory pushes)?",
    observation: (d) => `${d?.objectivesCount ?? 0} active shop objective${d?.objectivesCount === 1 ? "" : "s"} pulled — each checked against this vehicle's make/mileage before it's allowed through.`,
  },
  {
    name: "get_mileage_services",
    color: "#86EFAC", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.22)",
    thought: (ro) => {
      const v = ro?._vehicle;
      const miles = (v?.mileage ?? v?.odometer ?? 0).toLocaleString();
      return `What's due at ${miles} miles on a ${v?.year || ""} ${v?.make || ""} ${v?.model || ""}?`.replace(/\s+/g, " ").trim();
    },
    observation: () => "Standard maintenance intervals (oil, cabin filter, brake fluid, trans service, etc.) checked against the odometer reading — anything already a line item on this RO is flagged out.",
  },
  {
    name: "get_canned_jobs",
    color: "#FCD34D", bg: "rgba(252,211,77,0.08)", border: "rgba(252,211,77,0.22)",
    thought: () => "Does the shop already have a real priced job on file for any of these?",
    observation: (d) => `${d?.cannedJobsCount ?? 0} priced canned job${d?.cannedJobsCount === 1 ? "" : "s"} on file — a match replaces the estimate with the shop's real totalPrice.`,
  },
  {
    name: "get_seasonal_trends",
    color: "#FDBA74", bg: "rgba(251,146,60,0.08)", border: "rgba(251,146,60,0.22)",
    thought: () => "What has this shop actually been busy with this season, historically?",
    observation: (d) => d?.seasonalTrendsAvailable
      ? "This shop's own persisted seasonal history is available and used to ground any seasonal recommendation."
      : "No persisted seasonal history yet (Settings → Predii Learn) — falls back to general seasonal domain knowledge.",
  },
  {
    name: "get_tsbs",
    color: "#F0ABFC", bg: "rgba(240,171,252,0.08)", border: "rgba(240,171,252,0.22)",
    thought: (ro) => {
      const v = ro?._vehicle;
      return `Has the manufacturer issued any Technical Service Bulletins for this ${v?.year || ""} ${v?.make || ""} ${v?.model || ""}?`.replace(/\s+/g, " ").trim();
    },
    observation: (d) => `${d?.tsbCount ?? 0} active NHTSA TSB${d?.tsbCount === 1 ? "" : "s"} found for this exact year/make/model — real manufacturer guidance, priced from a canned-job match or estimated from the bulletin's own scope.`,
  },
];

// Mirrors buildSystemPrompt() in server/services/roAdvisorService.js — same
// header fields and rules, populated from this RO so what's shown here is
// the real prompt shape, not a paraphrase. Rules are abridged for length.
function buildDisplaySystemPrompt(ro) {
  const veh = ro?._vehicle;
  const vehicleStr = veh?.make
    ? `${veh.year || ""} ${veh.make || ""} ${veh.model || ""} — ${(veh.mileage ?? veh.odometer ?? 0).toLocaleString()} miles`
    : "vehicle details not available";
  const existing = (ro?.services || []).map((s) => s.name).filter(Boolean);

  return `You are WrenchIQ Intelligence, an AI agent briefing a human service advisor before they walk out to greet a customer.

Current RO:
  Customer: ${[ro?._customer?.firstName, ro?._customer?.lastName].filter(Boolean).join(" ") || "Unknown"}
  Vehicle:  ${vehicleStr}
  In for:   ${ro?.customerConcern || ro?.serviceType || "General service"}
  DTCs:     ${(ro?.dtcs || []).join(", ") || "none"}
  Shop:     Cornerstone Auto Group
  Advisor:  ${ro?.advisorName || "not on file"}

Shop profile (Settings → ARO & Margin — situational awareness only, never quoted to the customer):
  Labor rate / parts margin target — used only to judge whether a recommendation is realistically priced for this shop.

Line items already on this RO (never re-recommended, in any wording):
${existing.length ? existing.map((s) => `  - ${s}`).join("\n") : "  (none)"}

Your job:
1. Call get_customer_history to understand this customer's visit history and any declined services.
2. Call get_shop_objectives to get today's active shop priorities and promotions.
3. Call get_mileage_services to identify what's due at this vehicle's mileage.
4. Call get_canned_jobs to see the shop's real priced job menu.
5. Call get_seasonal_trends to see what's historically busy at this shop right now.
6. Call get_tsbs to check for active manufacturer Technical Service Bulletins filed for this exact vehicle year/make/model.
7. Cross-reference all six sources to produce a prioritized, non-redundant recommendation set (max 4).

Rules (abridged):
- A service declined in the last 12 months becomes an alert, never a fresh recommendation.
- Only surface shop priorities that apply to this specific vehicle (trigger filters: vehicle_make, mileage_range, any_ro).
- Never recommend anything already a line item on this RO, worded differently or not.
- category = "year_round" for interval-based items (oil, filters, etc.); "seasonal" only for genuinely calendar-driven work; "tsb" for a get_tsbs-driven fix (cite the TSB number in the reason).
- Use a matching canned job's real totalPrice instead of estimating a cost; a TSB with no canned-job match is priced from the bulletin's own described scope.

Respond ONLY with valid JSON: { advisorBrief, serviceRecommendations[], ings[], alerts[], suggestedCustomerMessage }`;
}

// Azure AI Foundry list pricing ($ per 1M tokens) — illustrative only, matched
// against the model name actually echoed back by the LLM response. RO Advisor
// itself always runs on the "default" Predii LLM profile, never Azure (see
// azureOpenAI.js useConfiguredProvider comment) — so this is a genuine cost
// *projection*: what this same token usage would run on Azure AI Foundry's
// serverless pricing tiers, not a real bill. Never presented as actual spend.
const AZURE_FOUNDRY_PRICING = [
  { match: /gpt-5/i,                        label: "Azure OpenAI GPT-5 tier",         in: 5.00,  out: 15.00 },
  { match: /gpt-4o-mini/i,                  label: "Azure OpenAI GPT-4o mini",        in: 0.15,  out: 0.60 },
  { match: /gpt-4o/i,                       label: "Azure OpenAI GPT-4o",             in: 2.50,  out: 10.00 },
  { match: /gpt-4/i,                        label: "Azure OpenAI GPT-4",              in: 30.00, out: 60.00 },
  { match: /gemma|llama|mixtral|qwen|phi/i, label: "Azure AI Foundry open-model tier", in: 0.10,  out: 0.30 },
];
const DEFAULT_FOUNDRY_PRICING = { label: "Azure AI Foundry (generic serverless estimate)", in: 0.50, out: 1.50 };

function resolveFoundryPricing(model) {
  if (!model) return DEFAULT_FOUNDRY_PRICING;
  return AZURE_FOUNDRY_PRICING.find((p) => p.match.test(model)) || DEFAULT_FOUNDRY_PRICING;
}

function fmtUsd(n) {
  if (n == null) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(5)}`;
  return `$${n.toFixed(4)}`;
}

// One stage per tool call + 1 "final synthesis" reveal + 1 "deterministic
// corrections" reveal + 1 "usage/cost" reveal.
const TRACE_STAGE_COUNT = REACT_TOOLS.length + 3;

// The non-LLM pass every result goes through after synthesis, before
// reaching the client — finishAdvisorResult() in roAdvisorService.js.
// Listed here so the trace doesn't stop at "the model produced JSON" and
// silently skip the corrections that run on every single request.
const DETERMINISTIC_CORRECTIONS = [
  {
    label: "Filter already-on-RO items",
    detail: "Any recommendation or shop-objective note that duplicates an existing line item on this RO is dropped — worded differently or not.",
  },
  {
    label: "Reconcile TSB pricing & scope",
    detail: "Every \"tsb\"-category recommendation matched to this repo's curated bulletin data (src/data/tsbData.js) gets its cost recomputed from that bulletin's own labor hours × shop rate + parts — not the LLM's own estimate, which varied run-to-run. If the recommended service name drops the bulletin's specified fix (e.g. \"Inspection\" standing in for a bulletin that specifies replacement), it's realigned to the bulletin's own title. Live NHTSA-sourced TSBs have no such structured pricing and are left as the model scoped/priced them.",
  },
  {
    label: "Regenerate customer message on artifact",
    detail: "If the model's customer-facing message leaked a stray list-numbering fragment (a drafting artifact, not a price or real number), it's rebuilt directly from the structured recommendations rather than patched in place.",
  },
];

// Previews, per recommendation, the exact pricing source ServiceRecommendationCard's
// real Accept flow will resolve to (matchCannedJob → simulateCatalogMatch) — same
// two functions, same fallback order, so this is never out of sync with what
// actually happens on Accept, and an advisor can see which items are priced from
// the shop's real menu vs. a simulated placeholder before ever clicking Accept.
function CatalogMatchPreview({ service, estimatedCost, cannedJobs }) {
  const match = matchCannedJob(service, cannedJobs) || simulateCatalogMatch(service, estimatedCost);

  if (match.real) {
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: 5,
        fontSize: 10, color: "#86EFAC",
      }}>
        <Check size={10} style={{ flexShrink: 0 }} />
        Canned-job match: "{match.sourceDescription}" — {match.laborHrs} hr + {match.parts.length} part{match.parts.length === 1 ? "" : "s"} → {fmtMoney(match.totalPrice)}
      </div>
    );
  }
  return (
    <div
      title="No match on this shop's canned-job menu — this is a placeholder parts/labor split, not a real parts search. See WrenchIQ Product Spec v3.0 §4/§7."
      style={{
        display: "flex", alignItems: "center", gap: 5, marginTop: 5,
        fontSize: 10, color: "rgba(255,255,255,0.6)",
      }}
    >
      <AlertTriangle size={10} style={{ flexShrink: 0 }} />
      Simulated catalog match (no canned-job on file): {match.laborHrs} hr @ part #{match.partNumber} — {fmtMoney(match.laborCost)} labor + {fmtMoney(match.partCost)} parts
    </div>
  );
}

export function AgentTraceTab({ ro, agentData, agentLoading, llmProfile, llmStatus, llmDetailVisible }) {
  const { bz } = useZoom();
  const [showPrompt, setShowPrompt] = useState(false);
  const [revealCount, setRevealCount] = useState(TRACE_STAGE_COUNT); // fully shown by default
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);
  const { activeShopId } = useDemo();
  // Independent fetch rather than a prop from IntelligencePanel — this tab
  // is meant to be self-sufficient (reads straight off this RO's own data),
  // and it needs the same canned-job menu ServiceRecommendationCard's real
  // Accept flow checks, to show *before* the advisor clicks Accept which
  // pricing source each recommendation will actually resolve to.
  const [cannedJobs, setCannedJobs] = useState([]);
  useEffect(() => {
    let cancelled = false;
    fetchCannedJobs(activeShopId)
      .then((data) => { if (!cancelled) setCannedJobs(data.jobs || []); })
      .catch(() => { if (!cancelled) setCannedJobs([]); });
    return () => { cancelled = true; };
  }, [activeShopId]);

  useEffect(() => () => clearTimeout(playTimerRef.current), []);

  const handlePlay = useCallback(() => {
    clearTimeout(playTimerRef.current);
    setIsPlaying(true);
    setRevealCount(0);
    let step = 0;
    const tick = () => {
      step += 1;
      setRevealCount(step);
      if (step < TRACE_STAGE_COUNT) {
        playTimerRef.current = setTimeout(tick, 2200);
      } else {
        setIsPlaying(false);
      }
    };
    playTimerRef.current = setTimeout(tick, 800);
  }, []);

  const d = agentData?.dataSourced;
  const recs = agentData?.serviceRecommendations || [];
  const ings = agentData?.ings || [];
  const alerts = agentData?.alerts || [];
  const usage = agentData?.usage;
  const pricing = resolveFoundryPricing(agentData?.model);
  const inCost = ((usage?.promptTokens || 0) / 1_000_000) * pricing.in;
  const outCost = ((usage?.completionTokens || 0) / 1_000_000) * pricing.out;
  const totalCost = inCost + outCost;

  const toolsRevealed = Math.min(revealCount, REACT_TOOLS.length);
  const synthesisRevealed = revealCount > REACT_TOOLS.length;
  const correctionsRevealed = revealCount > REACT_TOOLS.length + 1;
  const usageRevealed = revealCount > REACT_TOOLS.length + 2;

  if (agentLoading && !agentData) return <LoadingSkeleton />;

  if (!agentData) {
    return <EmptyState icon={<Layers size={18} color="rgba(255,255,255,0.3)" />} text="No agent run yet for this RO — open Intelligence to trigger one." />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
            Tool-calling run for <strong style={{ color: "#fff" }}>{ro?.roNumber}</strong> — up to{" "}
            {REACT_TOOLS.length} tool calls → synthesis → deterministic corrections → Intelligence tab.
          </div>
          <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.4, marginTop: 3 }}>
            Runs on one of two interchangeable engines (hand-rolled loop or LangChain's{" "}
            <code style={{ fontFamily: "monospace" }}>createAgent</code>, via server setting{" "}
            <code style={{ fontFamily: "monospace" }}>LLM_ENGINE</code>) — same tools/prompt/contract either way.
          </div>
        </div>
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          title="Replay the ReAct loop step by step"
          style={{
            display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
            background: isPlaying ? "rgba(255,255,255,0.03)" : "rgba(34,197,94,0.12)",
            border: `1px solid ${isPlaying ? "rgba(255,255,255,0.08)" : "rgba(34,197,94,0.3)"}`,
            borderRadius: 6, padding: "5px 10px", cursor: isPlaying ? "default" : "pointer",
            fontSize: 10, fontWeight: 700, color: isPlaying ? "rgba(255,255,255,0.3)" : "#86EFAC",
          }}
        >
          {isPlaying ? <RotateCcw size={11} style={{ animation: "wrenchiqTraceSpin 1s linear infinite" }} /> : <Play size={11} />}
          {isPlaying ? "Playing…" : revealCount >= TRACE_STAGE_COUNT ? "Replay" : "Play"}
        </button>
      </div>
      <style>{`@keyframes wrenchiqTraceSpin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Timeline of tool calls (Thought → Action → Observation) ─────── */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {REACT_TOOLS.map((tool, i) => {
          const revealed = i < toolsRevealed;
          const active = isPlaying && i === toolsRevealed - 1;
          return (
            <div key={tool.name} style={{ display: "flex", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: revealed ? tool.bg : "rgba(255,255,255,0.03)",
                  border: `1.5px solid ${revealed ? tool.border : "rgba(255,255,255,0.1)"}`,
                  boxShadow: active ? `0 0 0 3px ${tool.bg}` : "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: revealed ? tool.color : "rgba(255,255,255,0.2)",
                  transition: "all 0.35s ease",
                }}>
                  {i + 1}
                </div>
                {i < REACT_TOOLS.length - 1 && (
                  <div style={{ width: 1, flex: 1, minHeight: 22, background: "rgba(255,255,255,0.1)" }} />
                )}
              </div>
              <div style={{
                paddingBottom: 16, flex: 1, minWidth: 0,
                opacity: revealed ? 1 : 0, transform: revealed ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 0.4s ease, transform 0.4s ease",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, fontFamily: "monospace", color: tool.color, marginBottom: 3 }}>
                  {tool.name}()
                </div>
                <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.75)", lineHeight: 1.45, marginBottom: 3 }}>
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>Thought — </span>{tool.thought(ro)}
                </div>
                <div style={{
                  fontSize: bz(11), color: tool.color, lineHeight: 1.45,
                  background: tool.bg, border: `1px solid ${tool.border}`,
                  borderRadius: 6, padding: "5px 8px",
                }}>
                  <span style={{ color: "rgba(255,255,255,0.75)" }}>Observation — </span>{tool.observation(d)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        opacity: synthesisRevealed ? 1 : 0, transform: synthesisRevealed ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        display: "flex", flexDirection: "column", gap: 14,
        pointerEvents: synthesisRevealed ? "auto" : "none",
      }}>
        {/* ── Final synthesis → Service Recommendations ───────────────────── */}
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.22)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#93C5FD", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Final synthesis → Service Recommendations
          </div>
          {recs.length === 0 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
              Nothing survived the filters for this RO — likely everything evidence-based is already a line item.
            </div>
          )}
          {recs.map((r, i) => (
            <div key={i} style={{ padding: "6px 0", borderBottom: i < recs.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                {r.service}{" "}
                <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.75)", fontSize: 10 }}>
                  · {r.category} · {r.confidence} confidence · {fmtMoney(r.estimatedCost)}
                </span>
                {/* Curated bulletins (src/data/tsbData.js) are numbered like "TSB-20-009"/
                    "SIB-11-06-20" — letter-prefixed. Live NHTSA-sourced numbers are plain
                    numeric IDs and carry no structured labor/parts data to reconcile against,
                    so the badge (and the claim it makes) only applies to the former. */}
                {r.category === "tsb" && /^[A-Za-z]/.test(r.tsbNumber || "") && (
                  <span
                    title="Cost recomputed deterministically from the bulletin's own labor/parts data — see Deterministic corrections below."
                    style={{
                      marginLeft: 6, fontSize: 8.5, fontWeight: 700, borderRadius: 3, padding: "1px 5px",
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      background: "rgba(74,222,128,0.14)", color: "#86EFAC",
                    }}
                  >
                    price verified
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>{r.reason}</div>
              <CatalogMatchPreview service={r.service} estimatedCost={r.estimatedCost} cannedJobs={cannedJobs} />
            </div>
          ))}
        </div>

        {/* ── Final synthesis → Strategic Priorities ──────────────────────── */}
        <div style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.22)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#D8B4FE", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
            Final synthesis → Strategic Priorities
          </div>
          {ings.length === 0 && (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>No standing shop priorities matched this vehicle.</div>
          )}
          {ings.map((ing, i) => (
            <div key={i} style={{ display: "flex", gap: 7, padding: "6px 0", borderBottom: i < ings.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <span style={{
                fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 5px", flexShrink: 0, marginTop: 2,
                letterSpacing: "0.04em", textTransform: "uppercase",
                background: ing.applies ? "rgba(216,180,254,0.18)" : "rgba(255,255,255,0.06)",
                color: ing.applies ? "#D8B4FE" : "rgba(255,255,255,0.35)",
              }}>
                {ing.applies ? "Applies" : "N/A"}
              </span>
              <div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.82)" }}>{ing.note}</div>
                {ing.reason && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 1 }}>{ing.reason}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* ── Alerts — evidence the agent held back rather than recommending ── */}
        {alerts.length > 0 && (
          <div style={{ background: "rgba(252,211,77,0.06)", border: "1px solid rgba(252,211,77,0.18)", borderRadius: 8, padding: "12px 14px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#FCD34D", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 8 }}>
              Alerts (held back from fresh recommendations)
            </div>
            {alerts.map((a, i) => (
              <div key={i} style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", padding: "3px 0" }}>{a.message}</div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deterministic corrections — runs on every result, LLM-independent ── */}
      <div style={{
        opacity: correctionsRevealed ? 1 : 0, transform: correctionsRevealed ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        pointerEvents: correctionsRevealed ? "auto" : "none",
      }}>
        <div style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.2)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#86EFAC", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
            Deterministic corrections (no LLM call)
          </div>
          <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, marginBottom: 8 }}>
            The synthesis JSON above is the model's output before this pass — everything below runs in plain code
            against that JSON, the same way marginCheck/aroGap never let the model do that arithmetic itself.
          </div>
          {DETERMINISTIC_CORRECTIONS.map((c, i) => (
            <div key={c.label} style={{ padding: "6px 0", borderBottom: i < DETERMINISTIC_CORRECTIONS.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{c.label}</div>
              <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", marginTop: 2, lineHeight: 1.45 }}>{c.detail}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Token usage & cost projection ────────────────────────────────── */}
      <div style={{
        opacity: usageRevealed ? 1 : 0, transform: usageRevealed ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 0.45s ease, transform 0.45s ease",
        display: "flex", flexDirection: "column", gap: 14,
        pointerEvents: usageRevealed ? "auto" : "none",
      }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Coins size={13} color="#FCD34D" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Token usage & cost projection
            </div>
          </div>

          {usage ? (
            <>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[
                  { label: "Prompt", value: usage.promptTokens },
                  { label: "Completion", value: usage.completionTokens },
                  { label: "Total", value: usage.totalTokens },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: "7px 9px" }}>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{s.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.85)", fontFamily: "monospace" }}>{(s.value ?? 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                Model: <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.8)" }}>{agentData?.model || "unknown"}</span>
                {" · "}priced here as <strong style={{ color: "rgba(255,255,255,0.75)" }}>{pricing.label}</strong>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", background: "rgba(252,211,77,0.08)", border: "1px solid rgba(252,211,77,0.2)", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ flex: 1, fontSize: 10, color: "rgba(255,255,255,0.75)" }}>
                  {(usage.promptTokens || 0).toLocaleString()} in × {fmtUsd(pricing.in / 1_000_000)}/tok + {(usage.completionTokens || 0).toLocaleString()} out × {fmtUsd(pricing.out / 1_000_000)}/tok
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#FCD34D", fontFamily: "monospace" }}>
                  {fmtUsd(totalCost)}
                </div>
              </div>

              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.75)", marginTop: 6, lineHeight: 1.4 }}>
                Projection only, based on Azure AI Foundry list pricing per 1M tokens (in {fmtMoney(pricing.in)} / out {fmtMoney(pricing.out)}).
                RO Advisor runs on the shop's configured Predii LLM profile, not billed via Azure — this is what
                the same {(usage.totalTokens || 0).toLocaleString()}-token run would cost on a comparable Azure
                Foundry tier, not an actual invoice line.
              </div>
            </>
          ) : (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)" }}>
              This response didn't report token usage (older run, or the endpoint doesn't return a usage block).
            </div>
          )}
        </div>

        {/* ── System prompt viewer ─────────────────────────────────────────── */}
        <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, overflow: "hidden" }}>
          <button
            onClick={() => setShowPrompt((v) => !v)}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "rgba(255,255,255,0.03)", border: "none", cursor: "pointer",
              padding: "9px 12px", color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: 600,
            }}
          >
            System prompt used for this ReAct loop
            <ChevronDown size={13} style={{ transform: showPrompt ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
          </button>
          {showPrompt && (
            <pre style={{
              margin: 0, padding: "10px 12px", fontSize: 10, lineHeight: 1.5,
              color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap", fontFamily: "monospace",
              background: "rgba(0,0,0,0.2)", maxHeight: 320, overflowY: "auto",
            }}>
              {buildDisplaySystemPrompt(ro)}
            </pre>
          )}
        </div>

        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>
          Model: {llmProfile === "azure" ? "Microsoft/OpenAI" : "PrediiLLM"}
          {llmDetailVisible && llmStatus?.profiles?.[llmProfile] && (
            <> ({llmStatus.profiles[llmProfile].model || "—"} · {llmStatus.profiles[llmProfile].baseUrl || "—"})</>
          )}{" "}
          · generated{" "}
          {agentData?.generatedAt ? new Date(agentData.generatedAt).toLocaleTimeString() : "just now"} · source:
          server/services/roAdvisorService.js
        </div>
      </div>
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

  // "Rewrite concern", "Rewrite CCC", and "Deep diagnosis (compare models)"
  // used to live here — all three duplicated what the "3C" task below
  // already does strictly better (scores before/after, grounds the rewrite
  // in this RO's own data, independently fact-checks it for hallucination,
  // and can apply the result straight to the RO). Removed rather than kept
  // as a second, worse way to do the same thing.

  // Live 3C scoring/rewrite — a dedicated flow (server/services/
  // threeCScoreService.js), not a plain chat prompt: scores this RO's
  // actual 3C narrative, drafts a rewrite grounded strictly in this RO's
  // own data (no invented DTCs/parts/statements), and scores the rewrite
  // too, so the before/after numbers are both live model judgments. Always
  // offered, even before a concern is on file, since a not-yet-started 3C
  // is itself a valid (low) score to see.
  tasks.push({
    id: "score3C",
    label: "3C",
    icon: ClipboardCheck,
    threeC: true,
  });

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

  // Structured (not LLM-summarized) visit-by-date timeline — real MongoDB
  // history (see roChat.js's GET /customer-history, same lookup the chat's
  // own grounding already uses), rendered as a scannable list rather than
  // asking the model to restate dates from prose.
  const customerName = ro._customer?.firstName || "this customer";
  tasks.push({
    id: "visitHistory",
    label: "Visit history",
    icon: History,
    history: true,
  });

  // Advisor guidance for the conversation happening today — grounded in
  // the customer's real history (recurring issues, declined work worth
  // re-offering, tenure), distinct from the raw timeline above.
  tasks.push({
    id: "talkingPoints",
    label: "Talking points for today",
    icon: Sparkles,
    prompt: `Based on ${customerName}'s full visit history, give me specific talking points for my conversation with them today: any recurring issue worth mentioning, previously declined work worth re-offering, their tenure/loyalty if it's notable, and anything to watch for. Write it as short bullet points I can glance at while talking to them — not a script to read verbatim.`,
  });

  return tasks;
}

// One half of a model-comparison reply — a colored-left-border card with a
// labeled header, its own copy button, and an optional fallback notice.
// Renders **bold** spans inline — the one inline markup the chat prompts
// actually ask the model to use (e.g. "bold the price"). Everything else
// (headers, emphasis) stays plain text rather than growing a real markdown
// parser for a small assistant reply surface.
function formatInlineBold(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") && p.length > 4
      ? <strong key={i} style={{ color: "inherit", fontWeight: 800 }}>{p.slice(2, -2)}</strong>
      : p
  );
}

// Chat replies were rendered as one whiteSpace:pre-wrap blob — a model's
// numbered sections and bullet lists ran together into a wall of text since
// nothing gave them real line breaks or list markup. This gives replies the
// structure they're already asking for: blank-line paragraphs, "- "/"* "
// bullets, "1. " numbered steps, and inline **bold** — without pulling in a
// markdown dependency for what's still a small, mostly-plain-text surface.
function ChatMessageText({ text }) {
  const lines = String(text || "").split("\n");
  const blocks = [];
  let currentList = null;
  let currentPara = [];

  const flushPara = () => {
    if (currentPara.length) { blocks.push({ type: "p", text: currentPara.join(" ") }); currentPara = []; }
  };
  const flushList = () => {
    if (currentList) { blocks.push(currentList); currentList = null; }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) { flushPara(); flushList(); continue; }

    const bulletMatch = line.match(/^[-*•]\s+(.*)/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)/);

    if (bulletMatch) {
      flushPara();
      if (!currentList || currentList.type !== "ul") { flushList(); currentList = { type: "ul", items: [] }; }
      currentList.items.push(bulletMatch[1]);
    } else if (numberedMatch) {
      flushPara();
      if (!currentList || currentList.type !== "ol") { flushList(); currentList = { type: "ol", items: [] }; }
      currentList.items.push(numberedMatch[1]);
    } else {
      flushList();
      currentPara.push(line);
    }
  }
  flushPara();
  flushList();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {blocks.map((b, i) => {
        if (b.type === "ul" || b.type === "ol") {
          const Tag = b.type === "ul" ? "ul" : "ol";
          return (
            <Tag key={i} style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 3 }}>
              {b.items.map((item, j) => <li key={j}>{formatInlineBold(item)}</li>)}
            </Tag>
          );
        }
        return <div key={i}>{formatInlineBold(b.text)}</div>;
      })}
    </div>
  );
}

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
            color: copied ? "#4ADE80" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600,
          }}
        >
          {copied ? <Check size={11} /> : <Clipboard size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.5, color: "rgba(255,255,255,0.8)" }}>
        <ChatMessageText text={text} />
      </div>
      {notice && (
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", marginTop: 6, fontStyle: "italic" }}>
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
    // Deterministic (not LLM-guessed) candidate discovery — see
    // cannedJobCandidatesService.js. Finds RO jobs that recur often but
    // aren't priced on the menu yet, so the shop can turn tribal pricing
    // knowledge into a real canned job with one click.
    {
      id: "cannedJobCandidates",
      label: "Suggest new canned jobs",
      icon: ClipboardCheck,
      cannedJobCandidates: true,
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

// Common Tasks dropdown — replaces a horizontally-scrolling row of pill
// buttons with a single "Select a task…" control, since the Sidecar window
// is narrow enough that a wide task list either wrapped awkwardly or forced
// horizontal scrolling past the visible edge. Shared between ChatTab (RO
// Chat) and ShopChatScreen (Ask WrenchIQ) — same interaction, different
// task lists and open direction (ChatTab's control sits at the bottom of
// the panel, so its menu opens upward over the transcript instead of
// downward off the bottom edge).
function TaskMenu({ tasks, onRun, sending, direction = "down" }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={sending}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.14)",
          borderRadius: 8, padding: "8px 11px", cursor: sending ? "default" : "pointer",
          color: "#F1F5F9", fontSize: 12, fontWeight: 700, boxSizing: "border-box",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Layers size={13} color="rgba(255,255,255,0.55)" />
          Select a task…
        </span>
        <ChevronDown
          size={14} color="rgba(255,255,255,0.5)"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        />
      </button>
      {open && (
        <div style={{
          position: "absolute", left: 0, right: 0, zIndex: 20,
          ...(direction === "up" ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
          background: COLORS.navyMid, border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8,
          boxShadow: "0 12px 32px rgba(0,0,0,0.45)", maxHeight: 260, overflowY: "auto",
        }}>
          {tasks.map((t, i) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => { setOpen(false); onRun(t); }}
                title={
                  t.threeC ? "Score this RO's 3C narrative and draft a grounded rewrite"
                    : t.history ? "This customer's real visit history, by date"
                    : t.cannedJobCandidates ? "RO jobs that recur often but aren't on the canned-job menu yet"
                    : t.compare ? `${t.label} — sends to both Predii LLM and Frontier at once`
                    : t.label
                }
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%", textAlign: "left",
                  background: "transparent", border: "none",
                  borderBottom: i < tasks.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  padding: "9px 11px", cursor: "pointer", boxSizing: "border-box",
                  fontSize: 12, fontWeight: 600, color: t.compare ? "#C4B5FD" : "#F1F5F9",
                }}
              >
                <Icon size={13} color={t.compare ? "#C4B5FD" : "#86EFAC"} style={{ flexShrink: 0 }} />
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
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

  // Finds RO jobs that recur often but aren't on the canned-job menu yet
  // (see cannedJobCandidatesService.js — every number here comes from this
  // shop's own historical line items, never LLM-estimated) and renders them
  // as its own message type with a per-candidate Yes/No, not a plain reply.
  async function runCannedJobCandidatesTask() {
    if (sending) return;
    setMessages((prev) => [...prev, { role: "user", text: "Suggest new canned jobs" }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/canned-jobs/${encodeURIComponent(activeShopId)}/candidates`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "cannedJobSuggestion", candidates: data.candidates || [] }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't check for canned-job candidates just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  // Persists a candidate as a real canned job (POST /api/canned-jobs/:shopId)
  // and flips that one card to "Added" — msgIndex + candidate description
  // together key which card, since candidates within one suggestion message
  // don't otherwise have a stable id.
  async function handleAddCannedJob(msgIndex, candidate) {
    setMessages((prev) => prev.map((m, i) => i !== msgIndex ? m : { ...m, addingKey: candidate.description }));
    try {
      await fetch(`${API_BASE}/api/canned-jobs/${encodeURIComponent(activeShopId)}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(candidate.proposedJob),
      });
      setMessages((prev) => prev.map((m, i) => i !== msgIndex ? m : {
        ...m, addingKey: null,
        addedKeys: [...(m.addedKeys || []), candidate.description],
      }));
    } catch {
      setMessages((prev) => prev.map((m, i) => i !== msgIndex ? m : { ...m, addingKey: null }));
    }
  }

  function handleDismissCandidate(msgIndex, candidate) {
    setMessages((prev) => prev.map((m, i) => i !== msgIndex ? m : {
      ...m, dismissedKeys: [...(m.dismissedKeys || []), candidate.description],
    }));
  }

  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", padding: "14px 18px", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Ask WrenchIQ · {shopName || "this shop"}
        </div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2 }}>
          {[{ id: "tasks", label: "Common Tasks" }, { id: "custom", label: "Ask anything" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setChatMode(m.id)}
              style={{
                padding: "4px 11px", borderRadius: 5, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 700,
                background: chatMode === m.id ? COLORS.accent : "transparent",
                color: chatMode === m.id ? "#fff" : "rgba(255,255,255,0.75)",
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
        <TaskMenu tasks={presetTasks} sending={sending} direction="down" onRun={(t) => sendMessage(t.prompt)} />
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            {chatMode === "tasks"
              ? "Tap a task above, or switch to Ask anything to type your own question."
              : "Ask anything grounded in this shop's canned-job pricing, Shop Profile, or (if selected above) a customer's real visit history. Works in English and Spanish. Always runs on Predii's default model."}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 3 }}>
            <div style={{
              maxWidth: "85%", borderRadius: 10, padding: "8px 11px", fontSize: 12, lineHeight: 1.5,
              background: m.role === "user" ? COLORS.accent : "rgba(255,255,255,0.06)",
              color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
            }}>
              <ChatMessageText text={m.text} />
            </div>
            {m.role === "assistant" && (
              <button
                onClick={() => handleCopy(m.text, `${i}`)}
                title="Copy this reply"
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  background: "transparent", border: "none", cursor: "pointer", padding: "0 2px",
                  color: copiedKey === `${i}` ? "#4ADE80" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600,
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
// The chat auto-detects English/Spanish by default (matches whatever
// language the advisor types in), but an advisor drafting a message *for* a
// customer who doesn't speak English needs to force the reply language
// regardless of what they themselves type — e.g. type shop jargon in
// English, get back a Vietnamese customer-facing message. This roster
// matches what the server (roChatService.js LANGUAGE_NAMES) actually
// supports — the languages most commonly spoken by customers at US
// independent auto shops, plus German and French.
const LANGUAGES = [
  { code: "auto", label: "Auto (EN/ES)" },
  { code: "en", label: "English" },
  { code: "es", label: "Español (Spanish)" },
  { code: "zh", label: "中文 (Chinese)" },
  { code: "vi", label: "Tiếng Việt (Vietnamese)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "fr", label: "Français (French)" },
];

// Shown as tap-to-fill chips once a specific (non-auto) language is picked
// in "Ask anything" mode — an advisor who doesn't speak that language still
// needs to know *what a reasonable question looks like* in it, not just
// that the model can reply in it.
const SAMPLE_QUERIES = {
  en: [
    "What's our price for a brake pad replacement?",
    "Summarize this customer's past visits.",
    "Is the noise from the front brakes something urgent?",
  ],
  es: [
    "¿Cuál es el precio de un cambio de pastillas de freno?",
    "Resume las visitas anteriores de este cliente.",
    "¿El ruido de los frenos delanteros es urgente?",
  ],
  zh: [
    "更换刹车片多少钱？",
    "总结一下这位客户之前的到店记录。",
    "前刹车的异响严重吗？",
  ],
  vi: [
    "Thay má phanh trước giá bao nhiêu?",
    "Tóm tắt các lần đến sửa xe trước đây của khách này.",
    "Tiếng kêu ở phanh trước có nghiêm trọng không?",
  ],
  de: [
    "Was kostet ein Bremsbelagwechsel bei uns?",
    "Fasse die bisherigen Besuche dieses Kunden zusammen.",
    "Ist das Geräusch von den vorderen Bremsen dringend?",
  ],
  fr: [
    "Quel est notre prix pour un remplacement de plaquettes de frein ?",
    "Résume les visites précédentes de ce client.",
    "Le bruit des freins avant est-il urgent ?",
  ],
};

export function ChatTab({ ro }) {
  const { bz } = useZoom();
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
  // "auto" matches the original bilingual EN/ES auto-detect behavior; any
  // other value forces every reply into that language regardless of what
  // the advisor typed (see LANGUAGES above and LANGUAGE_NAMES server-side).
  const [chatLanguage, setChatLanguage] = useState("auto");
  // Personal notes an advisor saved about this customer (customerNotesService.js)
  // — kept visible regardless of Tasks/Custom mode, since "remember this
  // about the customer" isn't a one-shot task, it's persistent context the
  // advisor should see every time they open this chat.
  const [customerNotes, setCustomerNotes] = useState([]);
  const [notesOpen, setNotesOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const scrollRef = useRef(null);

  const shop = ro.shop || { name: "the shop" };
  const customer = ro._customer;
  const vehicle = ro._vehicle;
  const presetTasks = buildPresetTasks(ro);
  const customerId = customer?.id || ro.customerId || null;

  useEffect(() => {
    fetch(`${API_BASE}/api/ro-chat/frontier-info`)
      .then((r) => r.json())
      .then((data) => setFrontierModel(data.model || null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, sending]);

  useEffect(() => {
    if (!customerId) { setCustomerNotes([]); return; }
    let cancelled = false;
    fetch(`${API_BASE}/api/customer-notes?shopId=${encodeURIComponent(ro.shopId || "")}&customerId=${encodeURIComponent(customerId)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setCustomerNotes(data.notes || []); })
      .catch(() => { if (!cancelled) setCustomerNotes([]); });
    return () => { cancelled = true; };
  }, [customerId, ro.shopId]);

  async function handleAddNote() {
    const trimmed = noteDraft.trim();
    if (!trimmed || !customerId || savingNote) return;
    setSavingNote(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer-notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          shopId: ro.shopId,
          customerId,
          customerName: [customer?.firstName, customer?.lastName].filter(Boolean).join(" "),
          note: trimmed,
        }),
      });
      const data = await res.json();
      if (data.note) setCustomerNotes((prev) => [data.note, ...prev]);
      setNoteDraft("");
    } catch {
      // best-effort — advisor can retry; nothing else depends on this write.
    } finally {
      setSavingNote(false);
    }
  }

  function handleDeleteNote(id) {
    setCustomerNotes((prev) => prev.filter((n) => n._id !== id));
    fetch(`${API_BASE}/api/customer-notes/${id}`, { method: "DELETE" }).catch(() => {});
  }

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
        body: JSON.stringify({ message: trimmed, history, ro, customer, vehicle, shop, modelTier, language: chatLanguage === "auto" ? undefined : chatLanguage, maxTokens }),
      });
      const data = await res.json();
      const notice = data.forcedReason === "pii"
        ? "\n\n(This message mentions customer-identifying info, so it stayed on Predii's model regardless of the tier toggle.)"
        : data.forcedReason === "not_configured"
          ? "\n\n(Frontier model isn't configured on this server yet — this reply came from Predii's model instead.)"
          : "";
      setMessages((prev) => [...prev, { role: "assistant", text: (data.reply || "…") + notice, lang: chatLanguage }]);
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
        body: JSON.stringify({ message: trimmed, history, ro, customer, vehicle, shop, modelTier: tier, language: chatLanguage === "auto" ? undefined : chatLanguage, maxTokens }),
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

  // "3C" preset task — scores this RO's actual Complaint/Cause/Correction
  // narrative, drafts a rewrite grounded strictly in this RO's own data,
  // and scores the rewrite too. Renders as its own message type (like the
  // model-comparison bubble above) since it's a score + before/after pair,
  // not a plain text reply.
  async function runThreeCTask() {
    if (sending) return;
    setMessages((prev) => [...prev, { role: "user", text: "Score & improve this RO's 3C narrative" }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/three-c-score/rewrite-and-score`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          concern: ro.threeCConcern || "",
          diagnosis: ro.threeCDiagnosis || "",
          correction: ro.threeCCorrection || "",
          vehicle,
          dtcs: ro.dtcs || [],
          services: ro.services || [],
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "threeC", ...data }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't reach the 3C scoring model just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  // Structured visit-by-date timeline — real data (GET /customer-history),
  // rendered as its own message type rather than asking the model to
  // restate dates and totals it might get wrong.
  async function runHistoryTask() {
    if (sending) return;
    setMessages((prev) => [...prev, { role: "user", text: "Show visit history" }]);
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/api/ro-chat/customer-history?customerId=${encodeURIComponent(customerId || "")}&shopId=${encodeURIComponent(ro.shopId || "")}`);
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "history", visits: data.history || [] }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Sorry, WrenchIQ couldn't load visit history just now — try again." }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.75)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          WrenchIQ Assistant
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select
            value={chatLanguage}
            onChange={(e) => setChatLanguage(e.target.value)}
            title="Force every reply into this language, regardless of what language you type in — useful when drafting a message for a customer who doesn't speak English"
            style={{
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 5, padding: "2px 4px", cursor: "pointer",
              color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700,
            }}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code} style={{ color: "#000" }}>{l.label}</option>
            ))}
          </select>
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
              color: modelTier === "frontier" ? "#C4B5FD" : "rgba(255,255,255,0.55)",
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
              color: "rgba(255,255,255,0.75)", fontSize: 10, fontWeight: 700,
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
              color: "rgba(255,255,255,0.75)", fontSize: 10, padding: 0,
            }}
          >
            <Info size={11} />
            {promptLoading ? "Loading…" : showPrompt ? "Hide system prompt" : "View system prompt"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, gap: 8 }}>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: 2 }}>
          {[{ id: "tasks", label: "Common Tasks" }, { id: "custom", label: "Ask anything" }].map((m) => (
            <button
              key={m.id}
              onClick={() => setChatMode(m.id)}
              style={{
                padding: "4px 11px", borderRadius: 5, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 700,
                background: chatMode === m.id ? COLORS.accent : "transparent",
                color: chatMode === m.id ? "#fff" : "rgba(255,255,255,0.75)",
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
        {customerId && (
          <button
            onClick={() => setNotesOpen((v) => !v)}
            title="Personal notes about this customer — remembered across visits"
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: notesOpen ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${notesOpen ? "rgba(250,204,21,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 6, padding: "4px 9px", cursor: "pointer",
              fontSize: 11, fontWeight: 700, color: notesOpen ? COLORS.gold : "rgba(255,255,255,0.75)",
            }}
          >
            <Pencil size={11} />
            Notes{customerNotes.length > 0 ? ` · ${customerNotes.length}` : ""}
          </button>
        )}
      </div>

      {notesOpen && customerId && (
        <div style={{
          flexShrink: 0, background: "rgba(250,204,21,0.06)", border: "1px solid rgba(250,204,21,0.25)",
          borderRadius: 8, padding: "9px 11px", display: "flex", flexDirection: "column", gap: 7,
        }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: COLORS.gold, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Personal notes — {[customer?.firstName, customer?.lastName].filter(Boolean).join(" ") || "this customer"}
          </div>
          {customerNotes.length === 0 ? (
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>
              Nothing saved yet — jot down anything worth remembering for next time (preferences, sensitivities, small talk to pick back up).
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 140, overflowY: "auto" }}>
              {customerNotes.map((n) => (
                <div key={n._id} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <div style={{ flex: 1, fontSize: 11.5, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                    {n.note}
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.45)", marginLeft: 6 }}>
                      {n.createdAt ? new Date(n.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(n._id)}
                    title="Delete this note"
                    style={{ background: "transparent", border: "none", cursor: "pointer", padding: 2, color: "rgba(255,255,255,0.4)", flexShrink: 0 }}
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }}
              placeholder="Add a note about this customer…"
              style={{
                flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6, padding: "5px 8px", color: "#fff", fontSize: 11, outline: "none",
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={!noteDraft.trim() || savingNote}
              style={{
                background: "rgba(250,204,21,0.18)", border: "1px solid rgba(250,204,21,0.4)",
                borderRadius: 6, padding: "5px 10px", cursor: !noteDraft.trim() || savingNote ? "default" : "pointer",
                fontSize: 11, fontWeight: 700, color: COLORS.gold,
                opacity: !noteDraft.trim() || savingNote ? 0.5 : 1,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

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
              style={{ background: "transparent", color: "rgba(255,255,255,0.75)", border: "none", fontSize: 11, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showPrompt && systemPrompt && (
        <pre style={{
          whiteSpace: "pre-wrap", fontSize: 10, lineHeight: 1.5, color: "rgba(255,255,255,0.75)",
          background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 8, padding: "10px 12px", margin: 0, maxHeight: 180, overflowY: "auto",
          fontFamily: "monospace", flexShrink: 0,
        }}>
          {systemPrompt}
        </pre>
      )}

      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, minHeight: 0 }}>
        {messages.length === 0 && (
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
            {chatMode === "tasks"
              ? "Tap a task below, or switch to Ask anything to type your own question."
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
          if (m.role === "history") {
            return (
              <div key={i} style={{
                borderLeft: "3px solid rgba(134,239,172,0.4)", borderRadius: 8, padding: "8px 11px",
                background: "rgba(255,255,255,0.04)",
              }}>
                {m.visits.length === 0 ? (
                  <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.7)" }}>
                    No past visits on file for this customer.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                    {m.visits.map((v, vi) => (
                      <div key={vi} style={{
                        display: "flex", gap: 8, padding: "6px 0",
                        borderBottom: vi < m.visits.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                      }}>
                        <div style={{ fontSize: bz(10), color: "rgba(255,255,255,0.55)", flexShrink: 0, width: 76 }}>
                          {v.date ? new Date(v.date).toLocaleDateString() : "unknown date"}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: bz(11), color: "#F1F5F9", fontWeight: 700 }}>
                            {humanizeServiceCategory(v.serviceType)}
                            {v.roNumber ? <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>{v.roNumber}</span> : null}
                          </div>
                          {v.services?.length > 0 && (
                            <div style={{ fontSize: bz(10.5), color: "rgba(255,255,255,0.7)", marginTop: 1 }}>
                              {v.services.join(", ")}
                            </div>
                          )}
                        </div>
                        {typeof v.totalEstimate === "number" && v.totalEstimate > 0 && (
                          <div style={{ fontSize: bz(11), fontWeight: 700, color: "#86EFAC", flexShrink: 0 }}>
                            {fmtMoney(v.totalEstimate)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }
          if (m.role === "threeC") {
            return (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, borderLeft: "3px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 11px", background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em", textTransform: "uppercase" }}>Before</span>
                      <ThreeCScoreBadge score={m.before?.score} size={14} title={m.before?.rationale} />
                    </div>
                    <ThreeCRawFields concern={ro.threeCConcern} diagnosis={ro.threeCDiagnosis} correction={ro.threeCCorrection} bz={bz} />
                  </div>
                  <div style={{ flex: 1, borderLeft: "3px solid #8B5CF6", borderRadius: 8, padding: "8px 11px", background: "rgba(139,92,246,0.08)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#C4B5FD", letterSpacing: "0.04em", textTransform: "uppercase" }}>After</span>
                      <ThreeCScoreBadge score={m.after?.score} size={14} title={m.after?.rationale} />
                    </div>
                    {m.rewritten ? (
                      <ThreeCRawFields concern={m.rewritten.concern} diagnosis={m.rewritten.diagnosis} correction={m.rewritten.correction} bz={bz} />
                    ) : (
                      <div style={{ fontSize: bz(11), color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>Rewrite unavailable.</div>
                    )}
                  </div>
                </div>
                <GroundingNotice grounding={m.grounding} bz={bz} />
              </div>
            );
          }
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: m.role === "user" ? "flex-end" : "flex-start", gap: 3 }}>
              <div style={{
                maxWidth: "85%", borderRadius: 10, padding: "8px 11px", fontSize: bz(12), lineHeight: 1.5,
                background: m.role === "user" ? COLORS.accent : "rgba(255,255,255,0.06)",
                color: m.role === "user" ? "#fff" : "rgba(255,255,255,0.8)",
              }}>
                <ChatMessageText text={m.text} />
              </div>
              {m.role === "assistant" && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => handleCopy(m.text, `${i}`)}
                    title="Copy this reply"
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      background: "transparent", border: "none", cursor: "pointer", padding: "0 2px",
                      color: copiedKey === `${i}` ? "#4ADE80" : "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: 600,
                    }}
                  >
                    {copiedKey === `${i}` ? <Check size={11} /> : <Clipboard size={11} />}
                    {copiedKey === `${i}` ? "Copied" : "Copy"}
                  </button>
                  {m.lang && m.lang !== "en" && <TranslateButton text={m.text} />}
                </div>
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

      {/* Tasks mode: a dropdown, always one tap away right above the
          compose box — opens upward over the transcript since this control
          sits at the bottom of the panel. */}
      {chatMode === "tasks" && (
        <TaskMenu
          tasks={presetTasks}
          sending={sending}
          direction="up"
          onRun={(t) => (t.threeC ? runThreeCTask() : t.history ? runHistoryTask() : t.compare ? sendComparisonMessage(t.prompt) : sendMessage(t.prompt))}
        />
      )}

      {/* Custom mode: the free-form compose box. Sample queries in the
          selected language appear above it once a specific (non-auto)
          language is picked — an advisor who doesn't speak that language
          still needs an example of a reasonable question in it. */}
      {chatMode === "custom" && (
        <>
          {chatLanguage !== "auto" && SAMPLE_QUERIES[chatLanguage] && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flexShrink: 0 }}>
              {SAMPLE_QUERIES[chatLanguage].map((q, i) => (
                <button
                  key={i}
                  onClick={() => setInput(q)}
                  title="Use this sample query"
                  style={{
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 6, padding: "4px 8px", cursor: "pointer",
                    fontSize: 10.5, color: "rgba(255,255,255,0.75)", textAlign: "left",
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}
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
        </>
      )}
    </div>
  );
}
