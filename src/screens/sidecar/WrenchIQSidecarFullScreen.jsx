/**
 * WrenchIQSidecarFullScreen — Surface B (Tauri): "full" window mode.
 *
 * Full-screen landing view instead of the narrow docked panel
 * (WrenchIQSidecarScreen.jsx): the RO queue + wait time on the left, the
 * selected RO's WrenchIQ Intelligence in the main area, and Chat docked at
 * the bottom — always visible, not a tab. Agent Trace is available here too,
 * next to RO Score, sharing the same component as sidecar mode.
 *
 * Shares all RO-detail/advisor state and mutation handlers with the sidecar
 * screen via useSidecarRO (see src/hooks/useSidecarRO.js) — same backend
 * calls, same accept/transfer behavior, just laid out differently.
 */

import { Sparkles, Settings, ExternalLink, ClipboardCheck, Layers, Search, Minimize2 } from "lucide-react";
import { COLORS } from "../../theme/colors";
import { useDemo } from "../../context/DemoContext";
import { useSidecarRO } from "../../hooks/useSidecarRO";
import TransferSimulationModal from "../../components/sidecar/TransferSimulationModal";
import RepairOrderQueue from "./RepairOrderQueue";
import {
  headerIconStyle, TabButton, RepairOrderCard, EmptyState, IntelligencePanel, ROScoreTab, ChatTab, AgentTraceTab,
  openSurfaceASettings, openSurfaceC,
} from "../WrenchIQSidecarScreen";

export default function WrenchIQSidecarFullScreen({ onToggleWindowMode }) {
  const { smsName } = useDemo();
  const {
    activeCustomer, selectCustomer,
    storyRO, agentData, loading,
    activeTab, setActiveTab,
    setRoScorePct,
    advisorFetchedAt, llmProfile,
    addedJobs, acceptedServices,
    transferOpen, handleTransfer, cancelTransfer, confirmTransfer,
    runAdvisorFetch, handleConfirmRecommendation, handleConcernUpdate, handleInspectionItemSelect,
    roGrandTotal, baseRoTotal, addedTotal,
  } = useSidecarRO({ autoFetch: true });

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100vh",
      background: COLORS.navyDark, fontFamily: "'Inter', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
      }}>
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
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
            padding: "2px 6px", borderRadius: 5,
            background: llmProfile === "azure" ? "rgba(56,189,248,0.15)" : "rgba(255,214,10,0.15)",
            color: llmProfile === "azure" ? "#7DD3FC" : COLORS.gold,
            border: `1px solid ${llmProfile === "azure" ? "rgba(56,189,248,0.35)" : "rgba(255,214,10,0.3)"}`,
          }}>
            {llmProfile === "azure" ? "Microsoft/OpenAI" : "PrediiLLM"}
          </span>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3 }}>
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
              title="Switch to Sidecar (docked) mode"
              style={headerIconStyle({ enabled: true })}
            >
              <Minimize2 size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Body: queue (left) | intelligence + chat (right) */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <div style={{ width: 340, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", minHeight: 0 }}>
          <RepairOrderQueue onSelect={selectCustomer} showWaitTime />
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {!activeCustomer && (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <EmptyState icon={<Search size={18} color="rgba(255,255,255,0.3)" />} text="Select a repair order from the queue to see WrenchIQ Intelligence." />
            </div>
          )}

          {activeCustomer && (
            <>
              <div style={{ padding: "14px 18px 10px", flexShrink: 0 }}>
                <RepairOrderCard
                  ro={storyRO}
                  activeCustomer={activeCustomer}
                  loading={loading}
                  onOpenQueue={() => {}}
                  smsName={smsName}
                  addedCount={addedJobs.length}
                  addedTotal={addedTotal}
                  baseTotal={storyRO ? baseRoTotal : null}
                  displayTotal={storyRO ? roGrandTotal : null}
                  onTransfer={handleTransfer}
                />
                {storyRO && (
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    <TabButton label="Intelligence" icon={Sparkles} active={activeTab === "intelligence"} onClick={() => setActiveTab("intelligence")} />
                    <TabButton label="RO Score" icon={ClipboardCheck} active={activeTab === "roScore"} onClick={() => setActiveTab("roScore")} />
                    <TabButton label="Agent Trace" icon={Layers} active={activeTab === "trace"} onClick={() => setActiveTab("trace")} />
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 18px 14px", minHeight: 0 }}>
                {!storyRO && loading && (
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Loading…</div>
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

                {storyRO && activeTab === "trace" && (
                  <AgentTraceTab key={storyRO.roNumber} ro={storyRO} agentData={agentData} agentLoading={loading} llmProfile={llmProfile} />
                )}
              </div>

              {storyRO && (
                <div style={{ height: 300, flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 18px" }}>
                  <ChatTab key={storyRO.roNumber} ro={storyRO} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
