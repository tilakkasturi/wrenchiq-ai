// useSidecarRO — the RO-detail/advisor state + mutation handlers shared by
// both Sidecar window modes: the narrow docked WrenchIQSidecarScreen and the
// full-screen WrenchIQSidecarFullScreen. Extracted from WrenchIQSidecarScreen
// (which owned all of this inline before the "full" mode existed) so both
// screens talk to the RO Advisor / story-RO backend exactly the same way —
// see server/services/roAdvisorService.js and src/services/repairOrderService.js.
//
// `autoFetch` gates the "auto-fetch once per RO" effect below: the narrow
// screen only wants this while the user has actually navigated to the "ro"
// phase (not while still on the health-check/queue screens), so it passes
// `phase === "ro"`; the full-screen layout has no such phase gate and always
// passes `true`.
import { useState, useEffect, useRef, useCallback } from "react";
import { useSelectedCustomer } from "../context/SelectedCustomerContext";
import { fetchStoryRO, updateStoryRO, rewriteConcern } from "../services/repairOrderService";
import { useInsightNotifier } from "../services/insightNotifier";
import { computeRepairJobsTotal } from "../services/roTotals";
import { notifyROUpdated } from "../services/roUpdatesChannel";
import { useLLMProfileStatus } from "./useLLMProfileStatus";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export function useSidecarRO({ autoFetch }) {
  const { activeCustomer, customers, selectCustomer } = useSelectedCustomer();
  const [storyRO, setStoryRO] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("intelligence");
  const [roScorePct, setRoScorePct] = useState(null);
  const [advisorFetchedAt, setAdvisorFetchedAt] = useState(null);
  // Accepted-recommendation state lives here (not in IntelligencePanel) so the
  // Transfer button/amount can render next to the customer name in
  // RepairOrderCard, above the Intelligence tab's content.
  const [addedJobs, setAddedJobs] = useState([]);
  const [acceptedServices, setAcceptedServices] = useState(new Set());
  const [transferOpen, setTransferOpen] = useState(false);
  // Tracks which roNumber the auto-fetch effect below has already run for,
  // so re-selecting the customer that's already active (or toggling phase
  // away and back) doesn't re-trigger it — only an actual RO change or the
  // manual refresh button does. Reset whenever the RO itself changes.
  const fetchedRoIdRef = useRef(null);
  const advisorRequestRef = useRef(0);
  // Which LLM profile is actually powering "Predii LLM" right now, and the
  // Ctrl+P reveal toggle — see useLLMProfileStatus.js.
  const { llmProfile, llmStatus, llmDetailVisible } = useLLMProfileStatus();

  const { notifications } = useInsightNotifier(customers);

  // Fetches RO detail + a fresh WrenchIQ Intelligence brief for `roId`. Used
  // both by the auto-fetch effect below and the manual refresh button — the
  // request-id guard lets a later call (new RO, or a manual refresh) always
  // win over a stale in-flight one, without needing an AbortController.
  const runAdvisorFetch = useCallback((roId) => {
    if (!roId) return;
    const requestId = ++advisorRequestRef.current;
    setLoading(true);

    fetchStoryRO(roId)
      .then((ro) => {
        if (advisorRequestRef.current !== requestId || !ro) return;
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
          .then((data) => {
            if (advisorRequestRef.current !== requestId) return;
            setAgentData(data);
            setAdvisorFetchedAt(Date.now());
          });
      })
      .finally(() => {
        if (advisorRequestRef.current === requestId) setLoading(false);
      });
  }, []);

  // Resets on every RO change (including the very first one) — deliberately
  // does NOT fetch here; fetching is gated on `autoFetch` in the effect below
  // so nothing calls the LLM silently in the background while the narrow
  // screen's user is still on the health-check/queue screens.
  useEffect(() => {
    setStoryRO(null);
    setAgentData(null);
    setRoScorePct(null);
    setAdvisorFetchedAt(null);
    // Always land back on Intelligence for a newly-selected RO — otherwise
    // whichever tab was open on the *previous* RO (e.g. Chat) carries over,
    // since activeTab is independent state that this effect never touched.
    setActiveTab("intelligence");
    fetchedRoIdRef.current = null;
    setAddedJobs([]);
    setAcceptedServices(new Set());
    setTransferOpen(false);
  }, [activeCustomer?.roNumber]);

  // Auto-fetches once per RO, but only once `autoFetch` is true — and only
  // once (re-selecting the same RO does not re-fetch; use the manual refresh
  // button in the Intelligence tab for that).
  useEffect(() => {
    const roId = activeCustomer?.roNumber;
    if (!roId || !autoFetch || fetchedRoIdRef.current === roId) return;
    fetchedRoIdRef.current = roId;
    runAdvisorFetch(roId);
  }, [activeCustomer?.roNumber, autoFetch, runAdvisorFetch]);

  async function handleConfirmRecommendation(rec, match) {
    const newJob = {
      description: rec.service,
      laborHours: match.laborHrs,
      actualLaborHours: 0,
      // Labor only — parts are tracked separately in `parts` below.
      // normalizeStoryRO (server/routes/repairOrders.js) maps this straight
      // to service.laborCost, so folding partCost in here would double-count
      // it against the RO total (see src/services/roTotals.js).
      lineCost: match.laborCost,
      parts: match.parts,
      status: "pending",
    };
    const nextAddedJobs = [...addedJobs, newJob];
    setAddedJobs(nextAddedJobs);
    setAcceptedServices((prev) => new Set(prev).add(rec.service));
    const repairJobs = [...(storyRO.repairJobs || []), ...nextAddedJobs];
    const { grandTotal } = computeRepairJobsTotal(repairJobs);
    try {
      await updateStoryRO(storyRO.roNumber, { repairJobs, invoice: grandTotal });
    } catch {
      // best-effort — the card still reflects "added" locally; a stale PATCH
      // here doesn't undo the advisor's decision, matching this screen's
      // existing best-effort convention for RO mutations (see StagedCustomerText).
    }
  }

  // Grounded rewrite of just the intake concern (rewriteConcern — scoped
  // narrower than the 3C rewrite, which operates on the separate
  // threeCConcern field), then persists it and re-fires recommendations.
  // Persist must complete BEFORE runAdvisorFetch, which re-fetches the RO
  // fresh from the server and would otherwise clobber this edit with the
  // stale value.
  async function handleConcernUpdate(newConcern) {
    if (!storyRO) return newConcern;
    let cleaned = newConcern;
    try {
      const result = await rewriteConcern({ concern: newConcern, vehicle: storyRO.vehicle });
      cleaned = result?.concern || newConcern;
    } catch {
      // rewrite unavailable — fall back to saving the raw edited text
    }
    try {
      await updateStoryRO(storyRO.roNumber, { customerConcern: cleaned });
    } catch {
      // best-effort, matching this screen's existing RO-mutation convention
    }
    runAdvisorFetch(storyRO.roNumber);
    return cleaned;
  }

  // Flags a Red (needs-replacement) inspection finding into the concern so
  // it feeds the same recommendations flow a concern edit does — same
  // persist-then-refresh ordering as handleConcernUpdate above.
  async function handleInspectionItemSelect(item) {
    if (!storyRO || !item) return null;
    const note = `Inspection finding: ${item.name} — ${item.aiAnalysis?.finding || "flagged for replacement"}`;
    const existing = storyRO.customerConcern || "";
    if (existing.includes(note)) return existing;
    const next = existing ? `${existing}\n${note}` : note;
    try {
      await updateStoryRO(storyRO.roNumber, { customerConcern: next });
    } catch {
      // best-effort, matching this screen's existing RO-mutation convention
    }
    runAdvisorFetch(storyRO.roNumber);
    return next;
  }

  // Opens the Transfer confirmation modal — nothing is sent to the SMS/DMS
  // until the advisor clicks OK inside it (see confirmTransfer below).
  function handleTransfer() {
    setTransferOpen(true);
  }

  function cancelTransfer() {
    setTransferOpen(false);
  }

  // Marks the accepted jobs as transferred (distinct from a locally-added
  // "pending" line in the SMS/DMS's own RO editor), persists that onto the
  // story RO — including a recomputed invoice total so every other reader
  // of this RO (SMS/DMS RO Viewer, RO Kanban) agrees on the number — and
  // nudges the SMS window to refetch immediately instead of waiting for its
  // next scheduled poll.
  async function confirmTransfer() {
    const transferredJobs = addedJobs.map((j) => ({
      ...j,
      status: "transferred",
      transferredAt: new Date().toISOString(),
    }));
    const repairJobs = [...(storyRO.repairJobs || []), ...transferredJobs];
    const { grandTotal } = computeRepairJobsTotal(repairJobs);
    try {
      await updateStoryRO(storyRO.roNumber, { repairJobs, invoice: grandTotal });
      notifyROUpdated(storyRO.roNumber);
    } catch {
      // best-effort, matching this screen's existing RO-mutation convention
    }
    setAddedJobs(transferredJobs);
    setTransferOpen(false);
  }

  // Live totals, computed the same way the SMS/DMS RO Viewer does (see
  // src/services/roTotals.js) from the same data about to be persisted —
  // not from `storyRO.totalEstimate`, which only reflects whatever was on
  // the RO the last time *something* recomputed it, and would otherwise
  // read stale as soon as a recommendation is accepted here.
  const liveRepairJobs = [...(storyRO?.repairJobs || []), ...addedJobs];
  const roGrandTotal = computeRepairJobsTotal(liveRepairJobs).grandTotal;
  const baseRoTotal = computeRepairJobsTotal(storyRO?.repairJobs || []).grandTotal;
  const addedTotal = roGrandTotal - baseRoTotal;

  return {
    activeCustomer, customers, selectCustomer,
    storyRO, agentData, loading,
    activeTab, setActiveTab,
    roScorePct, setRoScorePct,
    advisorFetchedAt, llmProfile, llmStatus, llmDetailVisible, notifications,
    addedJobs, acceptedServices,
    transferOpen, handleTransfer, cancelTransfer, confirmTransfer,
    runAdvisorFetch, handleConfirmRecommendation, handleConcernUpdate, handleInspectionItemSelect,
    roGrandTotal, baseRoTotal, addedTotal,
  };
}
